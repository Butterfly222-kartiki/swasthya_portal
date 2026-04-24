'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { Video, PhoneOff, Copy, Loader, Calendar, Clock, User, Maximize2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function VideoPage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const iframeRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [activeRoom, setActiveRoom] = useState('');
  const [activeApt, setActiveApt] = useState(null);
  const [upcomingVideo, setUpcomingVideo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const notesTimer = useRef(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const p = { ...prof, id: user.id };
    setProfile(p);

    const today = format(new Date(), 'yyyy-MM-dd');
    const col = p.role === 'doctor' ? 'doctor_id' : 'patient_id';
    const { data: apts } = await supabase
      .from('appointments')
      .select('*')
      .eq(col, user.id)
      .eq('type', 'video')
      .neq('status', 'cancelled')
      .gte('appointment_date', today)
      .order('appointment_date', { ascending: true })
      .order('time_slot', { ascending: true });

    setUpcomingVideo(apts || []);
    setLoading(false);
  };

  // Deterministic room name from appointment id — SAME for both parties, no coordination needed
  const getRoomName = (apt) => apt.video_room_name || `swasthya-${apt.id.slice(0, 12)}`;

  const joinAppointmentRoom = async (apt) => {
    setJoining(true);
    const room = getRoomName(apt);

    // Write room name to DB on first join so both parties read the same value
    if (!apt.video_room_name) {
      await supabase.from('appointments')
        .update({ video_room_name: room })
        .eq('id', apt.id);
    }

    setActiveRoom(room);
    setActiveApt(apt);
    setNotes('');
    setNotesSaved(false);

    if (profile?.role === 'doctor') {
      const { data: room_row } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('doctor_id', apt.doctor_id)
        .eq('patient_id', apt.patient_id)
        .maybeSingle();
      if (room_row?.id) {
        const { data: existing } = await supabase
          .from('consultation_notes')
          .select('notes')
          .eq('room_id', room_row.id)
          .maybeSingle();
        if (existing?.notes?.rawText) setNotes(existing.notes.rawText);
      }
    }

    setInCall(true);
    setJoining(false);
  };

  const endCall = async () => {
    if (notes.trim() && activeApt && profile?.role === 'doctor') {
      await saveNotes(notes);
    }
    setInCall(false);
    setActiveRoom('');
    setActiveApt(null);
    toast.success('Call ended');
    loadData();
  };

  const copyRoom = () => {
    navigator.clipboard.writeText(activeRoom);
    toast.success('Room name copied!');
  };

  const handleNotesChange = (val) => {
    setNotes(val);
    setNotesSaved(false);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => saveNotes(val), 2000);
  };

  const saveNotes = async (currentNotes) => {
    const n = currentNotes ?? notes;
    if (!n.trim() || !activeApt) return;
    setNotesSaving(true);
    try {
      const payload = {
        patient_id: activeApt.patient_id,
        doctor_id: activeApt.doctor_id,
        notes: { rawText: n, source: 'video_session', appointmentId: activeApt.id },
        raw_conversation: n,
        updated_at: new Date().toISOString(),
      };

      const { data: room_row } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('doctor_id', activeApt.doctor_id)
        .eq('patient_id', activeApt.patient_id)
        .maybeSingle();

      if (room_row?.id) {
        await supabase.from('consultation_notes')
          .upsert({ room_id: room_row.id, ...payload }, { onConflict: 'room_id' });
      } else {
        const { data: existing } = await supabase
          .from('consultation_notes')
          .select('id')
          .eq('doctor_id', activeApt.doctor_id)
          .eq('patient_id', activeApt.patient_id)
          .is('room_id', null)
          .maybeSingle();
        if (existing?.id) {
          await supabase.from('consultation_notes').update(payload).eq('id', existing.id);
        } else {
          await supabase.from('consultation_notes').insert({ room_id: null, ...payload });
        }
      }
      setNotesSaved(true);
    } catch (e) { console.error('Notes save error:', e); }
    setNotesSaving(false);
  };

  const jitsiUrl = activeRoom ? `https://meet.jit.si/${encodeURIComponent(activeRoom)}` : '';

  // ── ACTIVE CALL ────────────────────────────────────────────
  if (inCall) {
    return (
      <div className="animate-fade-in">
        <div style={{ background: 'white', border: '1px solid #f0e8d8', borderRadius: 14, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700, marginBottom: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Active Room — {profile?.role === 'doctor' ? `Patient: ${activeApt?.patient_name}` : `Dr. ${activeApt?.doctor_name}`}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#1a1a2e', fontWeight: 700, fontFamily: 'monospace' }}>{activeRoom}</div>
          </div>
          <button onClick={copyRoom} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, border: '1px solid #e0e0e0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', color: '#4f46e5' }}>
            <Copy size={12} /> Copy
          </button>
          <a href={jitsiUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, background: '#4f46e5', color: 'white', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none' }}>
            <Maximize2 size={12} /> Full Screen
          </a>
          <button onClick={endCall} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, background: '#ef4444', color: 'white', fontWeight: 600, fontSize: '0.78rem', border: 'none', cursor: 'pointer' }}>
            <PhoneOff size={12} /> End Call
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: profile?.role === 'doctor' ? '1fr 340px' : '1fr', gap: 16 }}>
          <div style={{ borderRadius: 18, overflow: 'hidden', background: '#1a1a2e', height: 'calc(100vh - 200px)', minHeight: 480, border: '2px solid #f0e8d8' }}>
            <iframe
              ref={iframeRef}
              src={`${jitsiUrl}#config.startWithVideoMuted=false&config.startWithAudioMuted=false&interfaceConfig.SHOW_JITSI_WATERMARK=false`}
              allow="camera; microphone; fullscreen; speaker; display-capture"
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Video Consultation"
            />
          </div>

          {profile?.role === 'doctor' && (
            <div style={{ background: 'white', border: '1px solid #f0e8d8', borderRadius: 16, padding: '1rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e', fontSize: '0.9rem' }}>📝 Consultation Notes</div>
                  <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>Patient: {activeApt?.patient_name}</div>
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: notesSaving ? '#f08000' : notesSaved ? '#10b981' : '#9ca3af' }}>
                  {notesSaving ? '⟳ Saving...' : notesSaved ? '✓ Saved' : 'Auto-saves'}
                </div>
              </div>
              <textarea
                value={notes}
                onChange={e => handleNotesChange(e.target.value)}
                placeholder={'Chief complaint:\n\nSymptoms:\n\nExamination:\n\nDiagnosis:\n\nPlan:'}
                style={{ flex: 1, minHeight: 320, resize: 'vertical', padding: '10px', borderRadius: 10, border: '1px solid #f0e8d8', fontSize: '0.82rem', fontFamily: 'monospace', lineHeight: 1.7, outline: 'none', color: '#1a1a2e' }}
              />
              <button onClick={() => saveNotes(notes)} disabled={notesSaving || !notes.trim()} style={{ marginTop: 10, padding: '9px', borderRadius: 9, background: notes.trim() ? '#4f46e5' : '#e5e7eb', color: notes.trim() ? 'white' : '#9ca3af', border: 'none', cursor: notes.trim() ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.82rem' }}>
                Save Notes Now
              </button>
            </div>
          )}
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── PRE-CALL (LOBBY) VIEW ──────────────────────────────────
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.5rem', color: '#1a1a2e' }}>Video Consultation</h1>
        <p style={{ color: '#4a5568', fontSize: '0.875rem', marginTop: 4 }}>Your upcoming video appointments</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
          <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: '#f08000' }} />
        </div>
      ) : upcomingVideo.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Video size={48} style={{ margin: '0 auto 14px', opacity: 0.2, color: '#f08000' }} />
          <p style={{ fontFamily: 'Poppins', fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>No upcoming video appointments</p>
          <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: 16 }}>
            {profile?.role === 'patient'
              ? 'Book a video consultation from the Appointments page.'
              : 'Your upcoming video appointments will appear here once patients book.'}
          </p>
          {profile?.role === 'patient' && (
            <a href="/appointments" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#f08000,#c66200)', color: 'white', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
              <Calendar size={14} /> Book Video Appointment
            </a>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={16} color="#2563eb" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', color: '#1e40af', fontWeight: 500 }}>
              Both doctor and patient click <strong>Join Call</strong> — you will automatically enter the same private room. No room code needed.
            </span>
          </div>

          {upcomingVideo.map(apt => {
            const isToday = apt.appointment_date === format(new Date(), 'yyyy-MM-dd');
            const otherParty = profile?.role === 'doctor' ? apt.patient_name : `Dr. ${apt.doctor_name}`;
            return (
              <div key={apt.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '1rem 1.5rem', border: isToday ? '2px solid #f08000' : '1px solid #f0e8d8', background: isToday ? '#fff8f0' : 'white' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: isToday ? 'linear-gradient(135deg,#f08000,#c66200)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'white', fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 }}>
                    {format(new Date(apt.appointment_date + 'T00:00:00'), 'd')}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.6rem', fontWeight: 700 }}>
                    {format(new Date(apt.appointment_date + 'T00:00:00'), 'MMM')}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem' }}>{otherParty}</div>
                    {isToday && <span style={{ fontSize: '0.65rem', background: '#f08000', color: 'white', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>TODAY</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', color: '#4a5568', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {apt.time_slot}</span>
                    <span style={{ fontSize: '0.78rem', color: '#4a5568', display: 'flex', alignItems: 'center', gap: 4 }}><User size={11} /> {apt.reason || 'Video Consultation'}</span>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'monospace' }}>Room: {getRoomName(apt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => joinAppointmentRoom(apt)}
                  disabled={joining}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, background: isToday ? 'linear-gradient(135deg,#10b981,#047857)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', opacity: joining ? 0.7 : 1, boxShadow: isToday ? '0 4px 14px rgba(16,185,129,0.35)' : '0 4px 14px rgba(79,70,229,0.3)' }}
                >
                  {joining ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Video size={14} />}
                  {isToday ? 'Join Now' : 'Join Call'}
                </button>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
