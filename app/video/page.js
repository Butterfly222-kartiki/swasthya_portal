'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { Video, PhoneOff, Copy, Users, Mic, MicOff, VideoOff, Maximize2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VideoPage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const iframeRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [joinRoom, setJoinRoom] = useState('');
  const [inCall, setInCall] = useState(false);
  const [activeRoom, setActiveRoom] = useState('');
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const notesTimer = useRef(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile({ ...prof, id: user.id });

    if (prof?.role === 'doctor') {
      const { data: apts } = await supabase
        .from('appointments').select('patient_id, patient_name')
        .eq('doctor_id', user.id).order('appointment_date', { ascending: false });
      const unique = {};
      (apts || []).forEach(a => { if (!unique[a.patient_id]) unique[a.patient_id] = { id: a.patient_id, name: a.patient_name }; });
      setPatients(Object.values(unique));
    }
  };

  // Generate a clean Jitsi-safe room name
  const makeRoomName = () => {
    const id = Math.random().toString(36).substring(2, 10);
    return `swasthya-consult-${id}`;
  };

  const startCall = () => {
    const room = roomName.trim() || makeRoomName();
    setActiveRoom(room);
    setInCall(true);
    toast.success('Video room created! Share the room name below.');
  };

  const joinExisting = () => {
    if (!joinRoom.trim()) { toast.error('Enter a room name to join'); return; }
    setActiveRoom(joinRoom.trim());
    setInCall(true);
  };

  const endCall = () => {
    setInCall(false);
    setActiveRoom('');
    if (notes.trim()) saveNotes();
    toast.success('Call ended');
  };

  const copyRoom = () => {
    navigator.clipboard.writeText(activeRoom);
    toast.success('Room name copied!');
  };

  // Real-time notes auto-save
  const handleNotesChange = (val) => {
    setNotes(val);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => saveNotes(val), 2000);
  };

  const saveNotes = async (currentNotes) => {
    const n = currentNotes ?? notes;
    if (!n.trim() || !selectedPatient) return;
    setNotesSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Save as a consultation note in prescriptions table with a special marker
      await supabase.from('prescriptions').upsert({
        doctor_id: user.id,
        patient_id: selectedPatient.id,
        medicine: '__CONSULTATION_NOTES__',
        notes: n,
        dosage: new Date().toISOString(),
        duration: activeRoom,
      }, { onConflict: 'doctor_id,patient_id,duration' });
      setSavedNotes(n);
    } catch (e) { console.error(e); }
    setNotesSaving(false);
  };

  // Load existing notes for selected patient
  useEffect(() => {
    if (!selectedPatient) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from('prescriptions')
        .select('notes, dosage').eq('doctor_id', user.id)
        .eq('patient_id', selectedPatient.id)
        .eq('medicine', '__CONSULTATION_NOTES__')
        .order('dosage', { ascending: false }).limit(1);
      if (data?.[0]?.notes) { setNotes(data[0].notes); setSavedNotes(data[0].notes); }
      else { setNotes(''); setSavedNotes(''); }
    })();
  }, [selectedPatient]);

  const jitsiUrl = activeRoom ? `https://meet.jit.si/${encodeURIComponent(activeRoom)}` : '';

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.5rem', color: '#1a1a2e' }}>Video Consultation</h1>
        <p style={{ color: '#4a5568', fontSize: '0.875rem', marginTop: 4 }}>Powered by Jitsi Meet — free, open-source, no account needed</p>
      </div>

      {!inCall ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Start Call */}
          <div className="card">
            <div style={{ textAlign: 'center', paddingBottom: '1rem' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#1a1a2e,#0f3460)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(26,26,46,0.3)' }}>
                <Video size={30} color="white" />
              </div>
              <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '1.1rem', color: '#1a1a2e', marginBottom: 6 }}>Start New Call</h3>
              <p style={{ color: '#4a5568', fontSize: '0.82rem', marginBottom: 16 }}>Creates a private Jitsi room — share the room name with your {profile?.role === 'doctor' ? 'patient' : 'doctor'}</p>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4a5568', marginBottom: 4, display: 'block' }}>Custom room name (optional)</label>
              <input className="input-field" value={roomName} onChange={e => setRoomName(e.target.value.replace(/\s/g, '-').toLowerCase())} placeholder="e.g. pratik-consult-today" />
            </div>

            {profile?.role === 'doctor' && patients.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4a5568', marginBottom: 4, display: 'block' }}>Select patient for notes</label>
                <select className="input-field" value={selectedPatient?.id || ''} onChange={e => {
                  const p = patients.find(p => p.id === e.target.value);
                  setSelectedPatient(p || null);
                }}>
                  <option value="">-- No patient selected --</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}

            <button onClick={startCall} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px' }}>
              <Video size={16} /> Start Video Call
            </button>

            <div className="mandala-divider" style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input-field" value={joinRoom} onChange={e => setJoinRoom(e.target.value)} placeholder="Enter room name to join..." style={{ flex: 1 }} />
              <button onClick={joinExisting} className="btn-secondary" style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>Join</button>
            </div>
          </div>

          {/* How it works */}
          <div className="card">
            <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>How It Works</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: '🎥', title: 'Start / Join Room', desc: 'Doctor starts a room, patient joins using the same room name.' },
                { icon: '📋', title: 'Select Patient', desc: 'Doctor selects the patient before starting to enable linked notes.' },
                { icon: '📝', title: 'Real-time Notes', desc: 'Notes auto-save every 2 seconds and are linked to the patient record.' },
                { icon: '💊', title: 'Prescribe After', desc: 'Issue prescriptions from My Patients after the call ends.' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a2e' }}>{s.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#4a5568', marginTop: 2 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#fff8f0', borderRadius: 10, border: '1px solid #ffd9a0' }}>
              <div style={{ fontSize: '0.75rem', color: '#f08000', fontWeight: 700 }}>✓ No account required</div>
              <div style={{ fontSize: '0.72rem', color: '#4a5568', marginTop: 2 }}>Jitsi Meet is free and open-source. No sign-up needed for either party.</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: inCall && profile?.role === 'doctor' ? '1fr 340px' : '1fr', gap: 16 }}>
          {/* Video + controls */}
          <div>
            {/* Room bar */}
            <div style={{ background: 'white', border: '1px solid #f0e8d8', borderRadius: 14, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 600, marginBottom: 1 }}>ROOM NAME — Share this with {profile?.role === 'doctor' ? 'patient' : 'doctor'}</div>
                <div style={{ fontSize: '0.875rem', color: '#1a1a2e', fontWeight: 700 }}>{activeRoom}</div>
              </div>
              <button onClick={copyRoom} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, border: '1px solid #f0e8d8', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', color: '#4f46e5' }}>
                <Copy size={12} /> Copy
              </button>
              <a href={jitsiUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, background: '#4f46e5', color: 'white', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none' }}>
                <Maximize2 size={12} /> Full Screen
              </a>
              <button onClick={endCall} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, background: '#ef4444', color: 'white', fontWeight: 600, fontSize: '0.78rem', border: 'none', cursor: 'pointer' }}>
                <PhoneOff size={12} /> End Call
              </button>
            </div>

            {/* Jitsi iframe */}
            <div style={{ borderRadius: 18, overflow: 'hidden', background: '#1a1a2e', height: 'calc(100vh - 280px)', minHeight: 440, border: '2px solid #f0e8d8' }}>
              <iframe
                ref={iframeRef}
                src={`${jitsiUrl}#config.startWithVideoMuted=false&config.startWithAudioMuted=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true`}
                allow="camera; microphone; fullscreen; speaker; display-capture"
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Video Consultation"
              />
            </div>
          </div>

          {/* Doctor notes panel */}
          {profile?.role === 'doctor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'white', border: '1px solid #f0e8d8', borderRadius: 16, padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e', fontSize: '0.9rem' }}>📝 Consultation Notes</div>
                    {selectedPatient && <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>Patient: {selectedPatient.name}</div>}
                    {!selectedPatient && <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>⚠ No patient linked — notes won't save</div>}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: notesSaving ? '#f08000' : '#10b981', fontWeight: 600 }}>
                    {notesSaving ? '⟳ Saving...' : savedNotes === notes && notes ? '✓ Saved' : ''}
                  </div>
                </div>

                <textarea
                  value={notes}
                  onChange={e => handleNotesChange(e.target.value)}
                  placeholder={`Chief complaint:\n\nSymptoms:\n\nExamination:\n\nPlan:`}
                  style={{ flex: 1, minHeight: 300, resize: 'vertical', padding: '10px', borderRadius: 10, border: '1px solid #f0e8d8', fontSize: '0.82rem', fontFamily: 'monospace', lineHeight: 1.6, outline: 'none', color: '#1a1a2e' }}
                />

                {!selectedPatient && (
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#4a5568', marginBottom: 4, display: 'block' }}>Link patient to save notes</label>
                    <select className="input-field" style={{ fontSize: '0.8rem' }} onChange={e => {
                      const p = patients.find(p => p.id === e.target.value);
                      setSelectedPatient(p || null);
                    }}>
                      <option value="">-- Select patient --</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}

                <button onClick={() => saveNotes()} disabled={!selectedPatient || notesSaving} style={{ marginTop: 10, padding: '8px', borderRadius: 9, background: selectedPatient ? '#4f46e5' : '#e5e7eb', color: selectedPatient ? 'white' : '#9ca3af', border: 'none', cursor: selectedPatient ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.8rem' }}>
                  Save Notes
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
