'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { MessageCircle, Send, Search, Plus, Mic, MicOff, Volume2, Stethoscope, User } from 'lucide-react';
import ConsultationNotes from '@/components/voice/ConsultationNotes';

export default function ChatPage() {
  const supabase = createClient();
  const { t, language, speak: speakText } = useLanguage();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [profile, setProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [searchDr, setSearchDr] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [mobilePanel, setMobilePanel] = useState('list'); // 'list' | 'chat'
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => { loadProfile(); }, []);
  useEffect(() => { if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile({ ...prof, id: user.id });
    loadRooms(user.id, prof.role);
    if (prof.role === 'patient') {
      const { data: docs } = await supabase.from('profiles').select('*').eq('role', 'doctor');
      setDoctors(docs || []);
    }
  };

  const loadRooms = async (userId, role) => {
    const col = role === 'patient' ? 'patient_id' : 'doctor_id';
    const { data } = await supabase.from('chat_rooms').select('*, patient:profiles!chat_rooms_patient_id_fkey(full_name), doctor:profiles!chat_rooms_doctor_id_fkey(full_name)').eq(col, userId).order('updated_at', { ascending: false });
    setRooms(data || []);
    if (data && data.length > 0) openRoom(data[0]);
  };

  const openRoom = async (room) => {
    setActiveRoom(room);
    setMobilePanel('chat');
    // Unsubscribe from previous room channel to prevent leaks
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    const { data } = await supabase.from('messages').select('*').eq('room_id', room.id).order('created_at', { ascending: true });
    setMessages(data || []);
    // Subscribe to new messages for this room
    const channel = supabase.channel(`room-${room.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${room.id}` }, payload => {
        setMessages(prev => [...prev, payload.new]);
      }).subscribe();
    channelRef.current = channel;
  };

  const startChat = async (doctor) => {
    if (!profile) return;
    // Check if room exists - use maybeSingle() so no error when not found
    const { data: existing } = await supabase.from('chat_rooms').select('*').eq('patient_id', profile.id).eq('doctor_id', doctor.id).maybeSingle();
    if (existing) { openRoom(existing); return; }
    const { data: room, error } = await supabase.from('chat_rooms').insert({ patient_id: profile.id, doctor_id: doctor.id }).select().single();
    if (room) { setRooms(prev => [room, ...prev]); openRoom(room); }
    if (error) toast.error('Could not start chat. Please try again.');
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!newMsg.trim() || !activeRoom || !profile) return;
    const content = newMsg.trim();
    setNewMsg('');
    const { error } = await supabase.from('messages').insert({
      room_id: activeRoom.id,
      sender_id: profile.id,
      sender_name: profile.full_name,
      sender_role: profile.role,
      content,
    });
    if (error) { toast.error('Failed to send'); setNewMsg(content); }
    else {
      await supabase.from('chat_rooms').update({ updated_at: new Date().toISOString() }).eq('id', activeRoom.id);
    }
  };

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Voice recognition not supported in your browser');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SR();
    const langMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN' };
    recognitionRef.current.lang = langMap[language] || 'en-IN';
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    let finalText = '';
    recognitionRef.current.onresult = (e) => {
      finalText = e.results[0][0].transcript;
      setNewMsg(prev => prev + (prev ? ' ' : '') + finalText);
    };
    recognitionRef.current.onend = () => setListening(false);
    recognitionRef.current.start();
    setListening(true);
  };

  const stopVoice = () => { recognitionRef.current?.stop(); setListening(false); };

  const speak = (text) => speakText(text);

  const filteredDoctors = doctors.filter(d => d.full_name?.toLowerCase().includes(searchDr.toLowerCase()) || d.speciality?.toLowerCase().includes(searchDr.toLowerCase()));

  return (
    <div className="animate-fade-in chat-page-wrapper">
      {/* Left: Rooms + Doctors */}
      <div className={`chat-sidebar-panel${mobilePanel === 'chat' ? ' chat-panel-hidden' : ''}`}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '1.3rem', color: '#0f2d2a', marginBottom: 4 }}>{t('chat')}</h1>
          <p style={{ color: '#3d6b66', fontSize: '0.8rem' }}>Consult your doctors securely</p>
        </div>

        {profile?.role === 'patient' && (
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '0.875rem', color: '#0f2d2a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} color="#0d9488" /> Start New Consultation
            </div>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input type="text" value={searchDr} onChange={e => setSearchDr(e.target.value)} placeholder="Search doctors..." style={{ width: '100%', padding: '7px 8px 7px 28px', borderRadius: 8, border: '1px solid #ccfbf1', fontSize: '0.8rem', outline: 'none' }} />
            </div>
            <div style={{ maxHeight: 200, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredDoctors.map(doc => (
                <button key={doc.id} onClick={() => startChat(doc)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, border: '1px solid #ccfbf1', background: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0fdfa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#0f766e,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                    {doc.full_name?.[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#0f2d2a' }}>Dr. {doc.full_name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#3d6b66' }}>{doc.speciality || 'General'}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rooms list */}
        <div className="card" style={{ padding: '1rem', flex: 1, overflow: 'auto' }}>
          <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '0.875rem', color: '#0f2d2a', marginBottom: 10 }}>Conversations</div>
          {rooms.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', padding: '1.5rem 0' }}>
              <MessageCircle size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p>No conversations yet</p>
            </div>
          ) : rooms.map(room => {
            const other = profile?.role === 'patient' ? room.doctor : room.patient;
            const active = activeRoom?.id === room.id;
            return (
              <button key={room.id} onClick={() => openRoom(room)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', background: active ? '#f0fdfa' : 'white', marginBottom: 4, transition: 'all 0.2s', borderLeft: active ? '3px solid #0d9488' : '3px solid transparent' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: active ? 'linear-gradient(135deg,#0d9488,#0f766e)' : 'linear-gradient(135deg,#10b981,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                  {other?.full_name?.[0] || '?'}
                </div>
                <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: active ? '#0d9488' : '#0f2d2a' }}>
                    {profile?.role === 'patient' ? 'Dr. ' : ''}{other?.full_name || 'Unknown'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {room.updated_at ? format(new Date(room.updated_at), 'MMM d') : 'New chat'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Chat window */}
      <div className={`chat-main-panel${mobilePanel === 'list' ? ' chat-panel-hidden' : ''}`}>
        {activeRoom ? (
          <>
            {/* Chat header */}
            <div style={{ background: 'white', borderRadius: 16, padding: '1rem 1.5rem', marginBottom: 12, border: '1px solid #ccfbf1', display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Back button on mobile */}
              <button className="chat-back-btn" onClick={() => setMobilePanel('list')} style={{ display: 'none', width: 34, height: 34, borderRadius: 9, border: '1px solid #ccfbf1', background: '#f0fdfa', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                ‹
              </button>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#0f766e,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontFamily: 'DM Sans' }}>
                {(profile?.role === 'patient' ? activeRoom.doctor?.full_name : activeRoom.patient?.full_name)?.[0] || 'D'}
              </div>
              <div>
                <div style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#0f2d2a' }}>
                  {profile?.role === 'patient' ? 'Dr. ' : ''}{profile?.role === 'patient' ? activeRoom.doctor?.full_name : activeRoom.patient?.full_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0d9488' }} /> Online
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <span style={{ fontSize: '0.75rem', color: '#3d6b66', background: '#f5f5f5', padding: '4px 10px', borderRadius: 20 }}>🔒 End-to-End Secure</span>
              </div>
            </div>


            {/* AI Consultation Notes - visible to doctor in realtime */}
            <ConsultationNotes
              roomId={activeRoom?.id}
              isDoctor={profile?.role === 'doctor'}
              messages={messages}
            />

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                  <MessageCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.3, color: '#0d9488' }} />
                  <p>Start the conversation</p>
                  <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Your messages are private and secure</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === profile?.id;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    {!isMe && (
                      <span style={{ fontSize: '0.7rem', color: '#3d6b66', marginBottom: 4, marginLeft: 4 }}>{msg.sender_name}</span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                      <div className={isMe ? 'chat-bubble-patient' : 'chat-bubble-doctor'}>
                        <p style={{ fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>{msg.content}</p>
                        <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                          {msg.created_at ? format(new Date(msg.created_at), 'h:mm a') : 'now'}
                        </div>
                      </div>
                      {!isMe && (
                        <button onClick={() => speak(msg.content)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #ccfbf1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Read aloud">
                          <Volume2 size={12} color="#3d6b66" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ background: 'white', borderRadius: 16, padding: '1rem', border: '1px solid #ccfbf1', marginTop: 12 }}>
              <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <textarea
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={t('type_message')}
                  rows={2}
                  style={{ flex: 1, border: '2px solid #ccfbf1', borderRadius: 12, padding: '10px 14px', fontSize: '0.9rem', outline: 'none', resize: 'none', fontFamily: 'Noto Sans, sans-serif' }}
                  onFocus={e => e.target.style.borderColor = '#0d9488'}
                  onBlur={e => e.target.style.borderColor = '#ccfbf1'}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button type="button" onClick={listening ? stopVoice : startVoice}
                    style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer', background: listening ? '#059669' : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                    title="Voice input"
                  >
                    {listening ? <MicOff size={16} color="white" /> : <Mic size={16} color="#3d6b66" />}
                  </button>
                  <button type="submit" disabled={!newMsg.trim()} className="btn-primary" style={{ width: 40, height: 40, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: newMsg.trim() ? 1 : 0.5 }}>
                    <Send size={16} />
                  </button>
                </div>
              </form>
              {listening && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontSize: '0.75rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', animation: 'pulseSoft 1s infinite' }} />
                  Listening… speak now
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#9ca3af' }}>
              <MessageCircle size={56} style={{ margin: '0 auto 16px', opacity: 0.2, color: '#0d9488' }} />
              <p style={{ fontFamily: 'DM Sans', fontWeight: 600, color: '#3d6b66' }}>Select a conversation</p>
              <p style={{ fontSize: '0.8rem', marginTop: 4 }}>or start a new consultation with a doctor</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}