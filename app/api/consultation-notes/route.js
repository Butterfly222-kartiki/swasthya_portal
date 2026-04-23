import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const GEMINI_PROMPT = `You are a medical scribe AI for an Indian telemedicine platform.
Analyze this patient-doctor conversation and extract structured clinical notes.

Return ONLY valid JSON (no markdown):
{
  "chiefComplaint": "main symptom in one sentence",
  "symptoms": ["symptom 1", "symptom 2"],
  "duration": "how long symptoms have been present",
  "severity": "mild|moderate|severe",
  "vitalsmentioned": {"bp": null, "temp": null, "pulse": null},
  "allergiesmentioned": [],
  "medicationsMentioned": [],
  "suggestedDiagnosis": "possible diagnosis or null",
  "doctorInstructions": ["instruction 1", "instruction 2"],
  "followUpRequired": true/false,
  "summary": "2-3 sentence clinical summary",
  "redFlags": ["any urgent warning signs"]
}`;

export async function POST(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roomId, messages, language = 'en' } = await request.json();
    if (!roomId || !messages?.length) return NextResponse.json({ error: 'roomId and messages required' }, { status: 400 });

    // Verify user has access to this room
    const { data: room } = await supabase
      .from('chat_rooms').select('*')
      .eq('id', roomId)
      .or(`patient_id.eq.${user.id},doctor_id.eq.${user.id}`)
      .single();
    if (!room) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    // Format conversation for LLM
    const conversation = messages
      .slice(-20) // last 20 messages
      .map(m => `${m.sender_role === 'doctor' ? 'Doctor' : 'Patient'}: ${m.content}`)
      .join('\n');

    let notes = null;
    const GOOGLE_KEY = process.env.GOOGLE_AI_API_KEY;

    if (GOOGLE_KEY) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `${GEMINI_PROMPT}\n\nConversation:\n${conversation}\n\nExtract clinical notes:`
                }]
              }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          notes = JSON.parse(cleaned);
        }
      } catch (err) {
        console.error('Gemini notes error:', err);
      }
    }

    // Rule-based fallback
    if (!notes) {
      notes = extractNotesRuleBased(conversation);
    }

    // Save to DB
    const { data: saved, error } = await supabase
      .from('consultation_notes')
      .upsert({
        room_id: roomId,
        patient_id: room.patient_id,
        doctor_id: room.doctor_id,
        notes,
        raw_conversation: conversation,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'room_id' })
      .select().single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ notes, id: saved?.id });

  } catch (err) {
    console.error('Notes API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    if (!roomId) return NextResponse.json({ error: 'roomId required' }, { status: 400 });

    const { data } = await supabase
      .from('consultation_notes').select('*')
      .eq('room_id', roomId).single();

    return NextResponse.json({ notes: data?.notes || null, updatedAt: data?.updated_at });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function extractNotesRuleBased(conversation) {
  const text = conversation.toLowerCase();
  const symptoms = [];

  const symptomKeywords = ['fever','cough','headache','pain','nausea','vomit','dizzy','fatigue','chest','breathe','cold','runny nose','sore throat','rash','itching','swelling','weakness'];
  symptomKeywords.forEach(s => { if (text.includes(s)) symptoms.push(s); });

  const durationMatch = conversation.match(/(\d+)\s*(day|days|week|weeks|month|months)/i);

  return {
    chiefComplaint: symptoms.length > 0 ? symptoms.slice(0,2).join(' and ') : 'General consultation',
    symptoms,
    duration: durationMatch ? durationMatch[0] : 'Not specified',
    severity: text.includes('severe') || text.includes('worst') ? 'severe' : text.includes('moderate') ? 'moderate' : 'mild',
    vitalsmentioned: { bp: null, temp: null, pulse: null },
    allergiesmentioned: [],
    medicationsMentioned: [],
    suggestedDiagnosis: null,
    doctorInstructions: [],
    followUpRequired: text.includes('follow') || text.includes('come back'),
    summary: `Patient presents with ${symptoms.join(', ') || 'unspecified complaint'}. ${durationMatch ? 'Duration: ' + durationMatch[0] : ''}`,
    redFlags: [],
  };
}
