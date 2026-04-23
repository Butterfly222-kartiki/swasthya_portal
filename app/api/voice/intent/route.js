import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractIntent } from '@/lib/voice/intentExtractor';
import {
  getSession, updateSession, addToHistory, nextStep, clearSession,
  SESSION_STATUS, INTENTS,
} from '@/lib/voice/sessionManager';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { text, language = 'en', reset = false } = await request.json();
    if (!text?.trim()) return NextResponse.json({ error: 'No text' }, { status: 400 });

    // Reset session if requested
    if (reset) clearSession(user.id);

    const session = getSession(user.id);
    addToHistory(user.id, 'user', text);

    // Extract intent from text
    const extracted = await extractIntent(text, session.history, process.env.GOOGLE_AI_API_KEY);

    // ── Apply extracted entities to session ──
    let updates = { status: SESSION_STATUS.COLLECTING };

    // Only update intent if we don't have one yet, OR if user is changing topic
    if (!session.intent || session.intent === INTENTS.UNKNOWN) {
      updates.intent = extracted.intent;
    }

    // Fill in entities as they arrive
    if (extracted.mode && !session.mode) updates.mode = extracted.mode;
    if (extracted.doctor && !session.doctor) updates.doctor = extracted.doctor;
    if (extracted.slot && !session.slot) updates.slot = extracted.slot;
    if (extracted.date && !session.date) updates.date = extracted.date;
    if (extracted.symptoms && !session.symptoms) updates.symptoms = extracted.symptoms;
    if (extracted.navigateTo) updates.navigateTo = extracted.navigateTo;
    if (extracted.chatMessage) updates.chatMessage = extracted.chatMessage;

    // Handle YES/NO confirmation
    const isYes = /^(yes|ha|haa|haan|ho|aam|aamaam|confirm|book it|okay|ok|sure|correct|right)\b/i.test(text.trim());
    const isNo  = /^(no|nahi|nai|cancel|stop|reset|change|nahin)\b/i.test(text.trim());

    if (isNo) {
      clearSession(user.id);
      const step = nextStep(getSession(user.id), language);
      addToHistory(user.id, 'assistant', step.prompt);
      return NextResponse.json({ ...step, session: getSession(user.id), extracted, reset: true });
    }

    const updatedSession = updateSession(user.id, updates);

    // ── Get next step from workflow ──
    let step = nextStep(updatedSession, language);

    // If confirmation and appointment is complete
    if (isYes && step.action === 'CONFIRM_BOOKING') {
      // Book the appointment via Supabase
      const bookingResult = await bookAppointment(supabase, user.id, updatedSession);
      if (bookingResult.success) {
        const confirmMsg = getConfirmationMessage(language, updatedSession);
        clearSession(user.id);
        addToHistory(user.id, 'assistant', confirmMsg);
        return NextResponse.json({
          prompt: confirmMsg,
          field: null,
          action: 'BOOKING_CONFIRMED',
          appointmentId: bookingResult.id,
          session: getSession(user.id),
          extracted,
        });
      } else {
        return NextResponse.json({
          prompt: `Sorry, booking failed: ${bookingResult.error}. Please try again.`,
          field: null, action: null, session: updatedSession, extracted,
        });
      }
    }

    // Fetch live data for certain actions
    let liveData = null;
    if (step.action === 'SHOW_DOCTORS') {
      const { data: doctors } = await supabase
        .from('profiles').select('id,full_name,speciality,available_slots')
        .eq('role','doctor').eq('verification_status','approved').limit(6);
      liveData = { doctors: doctors || [] };
    } else if (step.action === 'SHOW_SLOTS' && updatedSession.doctor) {
      const { data: doctor } = await supabase
        .from('profiles').select('available_slots').eq('id', updatedSession.doctor?.id).single();
      // Get already-booked slots for the date
      const { data: booked } = await supabase
        .from('appointments')
        .select('time_slot')
        .eq('doctor_id', updatedSession.doctor?.id)
        .eq('appointment_date', updatedSession.date)
        .neq('status','cancelled');
      const bookedSlots = (booked || []).map(b => b.time_slot);
      const allSlots = doctor?.available_slots || [];
      liveData = { slots: allSlots.filter(s => !bookedSlots.includes(s)) };
    }

    addToHistory(user.id, 'assistant', step.prompt);

    return NextResponse.json({
      ...step,
      liveData,
      session: updatedSession,
      extracted,
      detectedLanguage: extracted.detectedLanguage || language,
    });

  } catch (err) {
    console.error('Intent API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function bookAppointment(supabase, userId, session) {
  try {
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
    const { data, error } = await supabase.from('appointments').insert({
      patient_id: userId,
      doctor_id: session.doctor?.id,
      patient_name: profile?.full_name,
      doctor_name: session.doctor?.name,
      appointment_date: session.date,
      time_slot: session.slot,
      reason: session.symptoms || 'Voice booking',
      status: 'confirmed',
      type: session.mode || 'in-person',
    }).select().single();
    if (error) return { success: false, error: error.message };

    // Notify doctor
    await supabase.from('notifications').insert({
      user_id: session.doctor?.id,
      title: '📅 New Appointment Booked',
      body: `${profile?.full_name} booked a ${session.mode || 'in-person'} appointment for ${session.date} at ${session.slot}`,
      type: 'appointment',
    });

    return { success: true, id: data.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getConfirmationMessage(lang, session) {
  const msgs = {
    en: `Your appointment with Dr. ${session.doctor?.name} has been confirmed for ${session.date} at ${session.slot}. You'll receive a notification. Is there anything else I can help you with?`,
    hi: `डॉ. ${session.doctor?.name} के साथ ${session.date} को ${session.slot} पर आपकी अपॉइंटमेंट की पुष्टि हो गई है। क्या मैं और कुछ मदद कर सकता हूं?`,
    mr: `डॉ. ${session.doctor?.name} सोबत ${session.date} रोजी ${session.slot} वाजता भेट निश्चित झाली. आणखी काही मदत हवी आहे का?`,
    ta: `டாக்டர் ${session.doctor?.name} உடன் ${session.date} அன்று ${session.slot} மணிக்கு சந்திப்பு உறுதிப்படுத்தப்பட்டது. வேறு உதவி தேவையா?`,
  };
  return msgs[lang] || msgs.en;
}
