'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import {
  Mic, MicOff, X, Volume2, VolumeX, Loader,
  Calendar, MessageCircle, FileText, MapPin, Video,
  ChevronRight, CheckCircle, AlertCircle, Minimize2, Maximize2
} from 'lucide-react';

const ACTION_ICONS = {
  SHOW_DOCTORS: Calendar,
  SHOW_SLOTS: Calendar,
  CONFIRM_BOOKING: CheckCircle,
  'NAVIGATE:/appointments': Calendar,
  'NAVIGATE:/chat': MessageCircle,
  'NAVIGATE:/documents': FileText,
  'NAVIGATE:/pharmacy': MapPin,
  'NAVIGATE:/video': Video,
  'NAVIGATE:/dashboard': CheckCircle,
  OPEN_UPLOAD: FileText,
  OPEN_CHAT: MessageCircle,
};

export default function VoiceAssistant() {
  const router = useRouter();
  const { language, speak, t } = useLanguage();

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState(null);
  const [messages, setMessages] = useState([]);
  const [liveData, setLiveData] = useState(null);
  const [session, setSession] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // On first open, greet user
  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = {
        en: "Hello! I'm your Swasthya AI assistant. I can help you book appointments, chat with doctors, find pharmacies, and navigate the portal. Just speak or type your request.",
        hi: "नमस्ते! मैं आपका स्वास्थ्य AI सहायक हूं। मैं अपॉइंटमेंट बुक करने, डॉक्टरों से बात करने और नेविगेट करने में मदद कर सकता हूं।",
        mr: "नमस्कार! मी तुमचा स्वास्थ्य AI सहाय्यक आहे. मी भेटी बुक करणे, डॉक्टरांशी बोलणे मध्ये मदत करू शकतो.",
        ta: "வணக்கம்! நான் உங்கள் ஸ்வாஸ்த்ய AI உதவியாளர். சந்திப்பு முன்பதிவு, மருத்துவரிடம் பேசுவது போன்றவற்றில் உதவுகிறேன்.",
      };
      const greetMsg = greeting[language] || greeting.en;
      addMessage('assistant', greetMsg);
      if (!muted) speak(greetMsg);
    }
  }, [open]);

  const addMessage = (role, text, extra = {}) => {
    setMessages(prev => [...prev, { role, text, ...extra, id: Date.now() }]);
  };

  // ── RECORD AUDIO ──────────────────────────────────────────
  const startRecording = async () => {
    try {
      // Try browser SpeechRecognition first (faster, free)
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        startBrowserSTT();
        return;
      }
      // Fallback: MediaRecorder → Whisper
      await startMediaRecorder();
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setPermissionDenied(true);
        addMessage('system', 'Microphone access denied. Please allow mic access in your browser settings.');
      } else {
        addMessage('system', `Error: ${err.message}`);
      }
    }
  };

  const startBrowserSTT = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognitionRef.current = recognition;

    const langMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN' };
    recognition.lang = langMap[language] || 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setRecording(true);
    recognition.onresult = (e) => {
      const interim = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(interim);
    };
    recognition.onend = () => {
      setRecording(false);
      const finalText = transcript || '';
      if (finalText.trim()) processText(finalText.trim());
      setTranscript('');
    };
    recognition.onerror = (e) => {
      setRecording(false);
      if (e.error === 'not-allowed') setPermissionDenied(true);
    };
    recognition.start();
  };

  const startMediaRecorder = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRef.current = { recorder, stream };
    chunksRef.current = [];

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      await transcribeAudio(blob);
    };

    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    if (mediaRef.current?.recorder?.state === 'recording') {
      mediaRef.current.recorder.stop();
      setRecording(false);
    }
  };

  // ── TRANSCRIBE: Groq/HF Whisper (free) or browser STT ────
  const transcribeAudio = async (blob) => {
    setProcessing(true);
    try {
      const form = new FormData();
      form.append('audio', blob, 'audio.webm');
      form.append('language', language);

      const res = await fetch('/api/voice/stt', { method: 'POST', body: form });
      const data = await res.json();

      if (data.source === 'browser_required') {
        // No backend STT key — fall back to browser SpeechRecognition
        setProcessing(false);
        addMessage('system', 'Using browser speech recognition. Speak clearly.');
        startBrowserSTT();
        return;
      }

      if (data.text) {
        await processText(data.text);
      } else if (data.error) {
        addMessage('system', `STT error: ${data.error}. Switching to browser STT.`);
        startBrowserSTT();
      }
    } catch (err) {
      addMessage('system', 'Connection error. Using browser speech recognition.');
      startBrowserSTT();
    }
    setProcessing(false);
  };

  // ── PROCESS TEXT → INTENT → RESPONSE ─────────────────────
  const processText = async (text) => {
    setProcessing(true);
    addMessage('user', text);

    try {
      const res = await fetch('/api/voice/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });
      const data = await res.json();

      setSession(data.session);
      setLiveData(data.liveData || null);

      const responseText = data.prompt || "I didn't understand that. Please try again.";
      addMessage('assistant', responseText, {
        action: data.action,
        liveData: data.liveData,
        field: data.field,
      });

      if (!muted) speak(responseText);

      // Handle navigation actions
      handleAction(data.action, data);

    } catch (err) {
      addMessage('system', 'Something went wrong. Please try again.');
    }
    setProcessing(false);
    setTranscript('');
  };

  const handleAction = (action, data) => {
    if (!action) return;

    if (action.startsWith('NAVIGATE:')) {
      const path = action.replace('NAVIGATE:', '');
      setTimeout(() => {
        router.push(`/${path}`);
        setOpen(false);
      }, 1500);
    }

    if (action === 'OPEN_UPLOAD') {
      setTimeout(() => { router.push('/documents'); setOpen(false); }, 1500);
    }

    if (action === 'OPEN_CHAT') {
      setTimeout(() => { router.push('/chat'); setOpen(false); }, 1500);
    }

    if (action === 'BOOKING_CONFIRMED') {
      setTimeout(() => { router.push('/appointments'); }, 2000);
    }
  };

  // ── TEXT INPUT FALLBACK ───────────────────────────────────
  const [textInput, setTextInput] = useState('');
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    processText(textInput.trim());
    setTextInput('');
  };

  const quickCommands = [
    { label: '📅 Book Appointment', text: 'book appointment' },
    { label: '💬 Chat Doctor', text: 'chat with doctor' },
    { label: '🎥 Video Call', text: 'start video consultation' },
    { label: '📄 Upload Report', text: 'upload document' },
    { label: '💊 Find Pharmacy', text: 'find pharmacy near me' },
    { label: '🏠 Dashboard', text: 'go to dashboard' },
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Voice Assistant"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          width: 58, height: 58, borderRadius: '50%',
          background: 'linear-gradient(135deg,#f08000,#c66200)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(240,128,0,0.45)',
          animation: 'voicePulse 2.5s infinite',
        }}
      >
        <Mic size={24} color="white" />
        <style>{`
          @keyframes voicePulse {
            0%,100%{box-shadow:0 6px 24px rgba(240,128,0,0.45)}
            50%{box-shadow:0 6px 32px rgba(240,128,0,0.75),0 0 0 10px rgba(240,128,0,0.1)}
          }
        `}</style>
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
      width: minimized ? 280 : 380,
      background: 'white', borderRadius: 20,
      boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      border: '1px solid #f0e8d8',
      display: 'flex', flexDirection: 'column',
      maxHeight: minimized ? 60 : 560,
      transition: 'all 0.3s ease',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#1a1a2e,#0f3460)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        borderRadius: minimized ? 20 : '20px 20px 0 0',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#f08000,#c66200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Mic size={14} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.875rem', lineHeight: 1 }}>Swasthya AI</div>
          {!minimized && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.68rem', marginTop: 2 }}>Voice & Chat Assistant</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setMuted(!muted)} style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {muted ? <VolumeX size={12} color="white" /> : <Volume2 size={12} color="white" />}
          </button>
          <button onClick={() => setMinimized(!minimized)} style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {minimized ? <Maximize2 size={12} color="white" /> : <Minimize2 size={12} color="white" />}
          </button>
          <button onClick={() => setOpen(false)} style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={12} color="white" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'user' ? (
                  <div style={{ background: 'linear-gradient(135deg,#f08000,#c66200)', color: 'white', borderRadius: '14px 14px 4px 14px', padding: '8px 12px', maxWidth: '80%', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    {msg.text}
                  </div>
                ) : msg.role === 'system' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fef3c7', color: '#92400e', borderRadius: 10, padding: '6px 10px', fontSize: '0.75rem', maxWidth: '90%' }}>
                    <AlertCircle size={12} /> {msg.text}
                  </div>
                ) : (
                  <div style={{ maxWidth: '90%' }}>
                    <div style={{ background: '#f8f9fa', border: '1px solid #f0e8d8', color: '#1a1a2e', borderRadius: '14px 14px 14px 4px', padding: '8px 12px', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: msg.liveData ? 8 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg,#f08000,#c66200)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.65rem', color: '#f08000', fontWeight: 700 }}>SWASTHYA AI</span>
                      </div>
                      {msg.text}
                    </div>

                    {/* Live Doctor Cards */}
                    {msg.liveData?.doctors && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                        {msg.liveData.doctors.slice(0,3).map(doc => (
                          <button key={doc.id}
                            onClick={() => processText(`I want Dr. ${doc.full_name}`)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: '1px solid #f0e8d8', background: 'white', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#f08000'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#f0e8d8'}
                          >
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                              {doc.full_name?.[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#1a1a2e' }}>Dr. {doc.full_name}</div>
                              <div style={{ fontSize: '0.68rem', color: '#4a5568' }}>{doc.speciality}</div>
                            </div>
                            <ChevronRight size={12} color="#9ca3af" style={{ marginLeft: 'auto' }} />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Time slots */}
                    {msg.liveData?.slots && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5, marginTop: 6 }}>
                        {msg.liveData.slots.slice(0,9).map(slot => (
                          <button key={slot} onClick={() => processText(`I want the ${slot} slot`)}
                            style={{ padding: '5px 4px', borderRadius: 7, border: '1px solid #f0e8d8', background: 'white', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 600, color: '#1a1a2e', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f08000'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#1a1a2e'; }}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {processing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8f9fa', borderRadius: 12, padding: '8px 12px', width: 'fit-content' }}>
                <Loader size={12} color="#f08000" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.75rem', color: '#4a5568' }}>Thinking...</span>
              </div>
            )}

            {recording && transcript && (
              <div style={{ background: '#fef3c7', borderRadius: 10, padding: '6px 10px', fontSize: '0.75rem', color: '#92400e', fontStyle: 'italic' }}>
                🎤 {transcript}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick commands */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {quickCommands.map((cmd, i) => (
                <button key={i} onClick={() => processText(cmd.text)}
                  style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid #f0e8d8', background: 'white', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, color: '#4a5568', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fff8f0'; e.currentTarget.style.color = '#f08000'; e.currentTarget.style.borderColor = '#f08000'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#4a5568'; e.currentTarget.style.borderColor = '#f0e8d8'; }}
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #f0e8d8', flexShrink: 0 }}>
            {permissionDenied && (
              <div style={{ fontSize: '0.7rem', color: '#ef4444', marginBottom: 6, textAlign: 'center' }}>
                Mic blocked. Use text input below. ↓
              </div>
            )}

            {recording && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8, padding: '6px', background: '#fef2f2', borderRadius: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{t('listening')}</span>
                <button onClick={stopRecording} style={{ padding: '3px 10px', borderRadius: 20, border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>Stop</button>
              </div>
            )}

            <form onSubmit={handleTextSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Type or speak your request..."
                style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: '1px solid #f0e8d8', fontSize: '0.82rem', outline: 'none', fontFamily: 'Noto Sans, sans-serif' }}
                onFocus={e => e.target.style.borderColor = '#f08000'}
                onBlur={e => e.target.style.borderColor = '#f0e8d8'}
                disabled={processing}
              />
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={processing}
                style={{
                  width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: recording ? '#ef4444' : 'linear-gradient(135deg,#f08000,#c66200)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: recording ? '0 0 0 4px rgba(239,68,68,0.2)' : '0 4px 12px rgba(240,128,0,0.35)',
                  animation: recording ? 'voicePulse 1s infinite' : 'none',
                }}
              >
                {processing ? <Loader size={15} color="white" style={{ animation: 'spin 1s linear infinite' }} /> : recording ? <MicOff size={15} color="white" /> : <Mic size={15} color="white" />}
              </button>
              {textInput && (
                <button type="submit" disabled={processing}
                  style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#10b981,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ChevronRight size={15} color="white" />
                </button>
              )}
            </form>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes voicePulse {
          0%,100%{box-shadow:0 6px 24px rgba(240,128,0,0.45)}
          50%{box-shadow:0 6px 32px rgba(240,128,0,0.75),0 0 0 10px rgba(240,128,0,0.1)}
        }
      `}</style>
    </div>
  );
}
