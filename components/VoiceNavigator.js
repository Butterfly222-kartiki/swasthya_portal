'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { Mic, MicOff, X, Volume2 } from 'lucide-react';

// ── Voice commands mapped per language ─────────────────────────────────────
const COMMANDS = {
  en: [
    { patterns: ['dashboard', 'home', 'go home', 'go to dashboard'], route: '/dashboard', label: 'Dashboard' },
    { patterns: ['appointment', 'appointments', 'book appointment', 'book', 'schedule'], route: '/appointments', label: 'Appointments' },
    { patterns: ['chat', 'message', 'doctor chat', 'talk to doctor', 'consult'], route: '/chat', label: 'Chat' },
    { patterns: ['document', 'documents', 'records', 'medical records', 'files'], route: '/documents', label: 'Documents' },
    { patterns: ['pharmacy', 'medicine', 'nearby pharmacy', 'find pharmacy', 'clinic', 'hospital'], route: '/pharmacy', label: 'Pharmacy' },
    { patterns: ['profile', 'my profile', 'account', 'settings'], route: '/profile', label: 'Profile' },
    { patterns: ['logout', 'log out', 'sign out', 'exit'], action: 'logout', label: 'Logout' },
    { patterns: ['go back', 'back'], action: 'back', label: 'Go Back' },
    { patterns: ['help', 'what can you do', 'commands'], action: 'help', label: 'Help' },
  ],
  hi: [
    { patterns: ['डैशबोर्ड', 'होम', 'घर', 'मुख्य पृष्ठ', 'dashboard'], route: '/dashboard', label: 'डैशबोर्ड' },
    { patterns: ['अपॉइंटमेंट', 'मुलाकात', 'बुकिंग', 'appointment', 'book'], route: '/appointments', label: 'अपॉइंटमेंट' },
    { patterns: ['चैट', 'डॉक्टर से बात', 'संदेश', 'chat', 'consult'], route: '/chat', label: 'चैट' },
    { patterns: ['दस्तावेज़', 'रिकॉर्ड', 'फाइल', 'document', 'records'], route: '/documents', label: 'दस्तावेज़' },
    { patterns: ['फार्मेसी', 'दवाई', 'दवा', 'अस्पताल', 'pharmacy', 'clinic'], route: '/pharmacy', label: 'फार्मेसी' },
    { patterns: ['प्रोफ़ाइल', 'मेरा खाता', 'profile'], route: '/profile', label: 'प्रोफ़ाइल' },
    { patterns: ['लॉगआउट', 'बाहर', 'logout'], action: 'logout', label: 'लॉगआउट' },
    { patterns: ['वापस', 'पीछे', 'back'], action: 'back', label: 'वापस जाएं' },
    { patterns: ['मदद', 'सहायता', 'help'], action: 'help', label: 'मदद' },
  ],
  mr: [
    { patterns: ['डॅशबोर्ड', 'मुख्य', 'होम', 'dashboard'], route: '/dashboard', label: 'डॅशबोर्ड' },
    { patterns: ['भेट', 'अपॉइंटमेंट', 'बुकिंग', 'appointment'], route: '/appointments', label: 'भेटी' },
    { patterns: ['चॅट', 'डॉक्टरांशी बोला', 'संदेश', 'chat'], route: '/chat', label: 'चॅट' },
    { patterns: ['कागदपत्रे', 'रेकॉर्ड', 'फाइल', 'document'], route: '/documents', label: 'कागदपत्रे' },
    { patterns: ['फार्मसी', 'औषध', 'रुग्णालय', 'pharmacy'], route: '/pharmacy', label: 'फार्मसी' },
    { patterns: ['प्रोफाइल', 'माझे खाते', 'profile'], route: '/profile', label: 'प्रोफाइल' },
    { patterns: ['लॉगआउट', 'बाहेर', 'logout'], action: 'logout', label: 'लॉगआउट' },
    { patterns: ['मागे', 'परत', 'back'], action: 'back', label: 'मागे जा' },
    { patterns: ['मदत', 'help'], action: 'help', label: 'मदत' },
  ],
};

// BCP-47 language codes for SpeechRecognition
const LANG_CODES = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };

// Speak feedback aloud
function speak(text, langCode) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = langCode;
  utt.rate = 0.95;
  utt.pitch = 1;
  window.speechSynthesis.speak(utt);
}

const HELP_TEXT = {
  en: 'You can say: Dashboard, Appointments, Chat, Documents, Pharmacy, Profile, Logout, Back',
  hi: 'आप कह सकते हैं: डैशबोर्ड, अपॉइंटमेंट, चैट, दस्तावेज़, फार्मेसी, प्रोफ़ाइल, लॉगआउट, वापस',
  mr: 'तुम्ही म्हणू शकता: डॅशबोर्ड, भेट, चॅट, कागदपत्रे, फार्मसी, प्रोफाइल, लॉगआउट, मागे',
};

export default function VoiceNavigator() {
  const router = useRouter();
  const { language } = useLanguage();
  const [active, setActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('info'); // info | success | error
  const [showPanel, setShowPanel] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);
  const restartRef = useRef(null);

  const showFeedback = useCallback((msg, type = 'info') => {
    setFeedback(msg);
    setFeedbackType(type);
    setTimeout(() => setFeedback(''), 3500);
  }, []);

  const matchCommand = useCallback((text) => {
    const lower = text.toLowerCase().trim();
    const commands = COMMANDS[language] || COMMANDS.en;
    for (const cmd of commands) {
      if (cmd.patterns.some(p => lower.includes(p.toLowerCase()))) {
        return cmd;
      }
    }
    return null;
  }, [language]);

  const executeCommand = useCallback((cmd) => {
    const langCode = LANG_CODES[language] || 'en-IN';
    if (cmd.route) {
      showFeedback(`✅ ${cmd.label}`, 'success');
      speak(cmd.label, langCode);
      setTimeout(() => router.push(cmd.route), 400);
    } else if (cmd.action === 'logout') {
      showFeedback(`👋 ${cmd.label}`, 'success');
      speak(cmd.label, langCode);
      setTimeout(() => router.push('/auth/login'), 600);
    } else if (cmd.action === 'back') {
      showFeedback(`⬅️ ${cmd.label}`, 'success');
      speak(cmd.label, langCode);
      router.back();
    } else if (cmd.action === 'help') {
      const helpMsg = HELP_TEXT[language] || HELP_TEXT.en;
      showFeedback(helpMsg, 'info');
      speak(helpMsg, langCode);
    }
  }, [language, router, showFeedback]);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const recognition = new SR();
    recognition.lang = LANG_CODES[language] || 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setTranscript(final || interim);
      if (final) {
        const cmd = matchCommand(final);
        if (cmd) {
          executeCommand(cmd);
        } else {
          showFeedback(`❓ "${final}" — not recognized`, 'error');
          speak(LANG_CODES[language] === 'hi-IN'
            ? 'समझ नहीं आया, फिर से कहें'
            : LANG_CODES[language] === 'mr-IN'
              ? 'समजले नाही, पुन्हा सांगा'
              : 'Not understood, please try again',
            LANG_CODES[language]
          );
        }
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'no-speech') return;
      setListening(false);
      showFeedback(`Mic error: ${e.error}`, 'error');
    };

    recognition.onend = () => {
      setListening(false);
      setTranscript('');
      // Auto-restart if still active
      if (restartRef.current) {
        restartRef.current = false;
        startListening();
      }
    };

    try { recognition.start(); } catch {}
  }, [language, matchCommand, executeCommand, showFeedback]);

  const stopListening = useCallback(() => {
    restartRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setListening(false);
    setTranscript('');
  }, []);

  const toggleActive = () => {
    if (active) {
      stopListening();
      setActive(false);
      setShowPanel(false);
      window.speechSynthesis?.cancel();
    } else {
      setActive(true);
      setShowPanel(true);
      restartRef.current = false;
      startListening();
    }
  };

  // Re-init recognition when language changes
  useEffect(() => {
    if (active && listening) {
      restartRef.current = true;
      try { recognitionRef.current?.stop(); } catch {}
    }
  }, [language]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      restartRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      window.speechSynthesis?.cancel();
    };
  }, []);

  if (!supported) return null;

  const langCode = LANG_CODES[language] || 'en-IN';
  const commands = COMMANDS[language] || COMMANDS.en;

  return (
    <>
      {/* Panel */}
      {showPanel && (
        <div style={{
          position: 'fixed', bottom: 90, right: 20, zIndex: 9999,
          width: 'min(320px, calc(100vw - 40px))',
          background: 'white', borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid #f0e8d8', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: listening ? '#ef4444' : '#f08000', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: listening ? 'voicePulse 1s infinite' : 'none' }}>
                {listening ? <Mic size={16} color="white" /> : <MicOff size={16} color="white" />}
              </div>
              <div>
                <div style={{ color: 'white', fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.875rem' }}>Voice Navigator</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
                  {listening ? '🔴 Listening...' : '⏸ Paused'}
                </div>
              </div>
            </div>
            <button onClick={() => { stopListening(); setActive(false); setShowPanel(false); }}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={14} color="white" />
            </button>
          </div>

          {/* Transcript */}
          <div style={{ padding: '12px 16px', background: '#f9f9f9', borderBottom: '1px solid #f0e8d8', minHeight: 44, display: 'flex', alignItems: 'center', gap: 8 }}>
            {listening && (
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', flexShrink: 0 }}>
                {[4,8,5,10,6].map((h, i) => (
                  <div key={i} style={{ width: 3, height: h, background: '#f08000', borderRadius: 3, animation: `voiceBar 0.8s ease-in-out ${i * 0.12}s infinite alternate` }} />
                ))}
              </div>
            )}
            <span style={{ color: transcript ? '#1a1a2e' : '#9ca3af', fontSize: '0.85rem', fontStyle: transcript ? 'normal' : 'italic', fontFamily: 'Poppins' }}>
              {transcript || (listening ? (language === 'hi' ? 'बोलिए...' : language === 'mr' ? 'बोला...' : 'Say a command...') : (language === 'hi' ? 'माइक बंद' : language === 'mr' ? 'माइक बंद' : 'Mic paused'))}
            </span>
          </div>

          {/* Feedback */}
          {feedback && (
            <div style={{ padding: '10px 16px', background: feedbackType === 'success' ? '#ecfdf5' : feedbackType === 'error' ? '#fef2f2' : '#eff6ff', borderBottom: '1px solid #f0e8d8' }}>
              <p style={{ color: feedbackType === 'success' ? '#065f46' : feedbackType === 'error' ? '#991b1b' : '#1e40af', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>{feedback}</p>
            </div>
          )}

          {/* Commands list */}
          <div style={{ padding: '12px 16px', maxHeight: 200, overflowY: 'auto' }}>
            <p style={{ color: '#9ca3af', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              {language === 'hi' ? 'उपलब्ध आदेश' : language === 'mr' ? 'उपलब्ध आदेश' : 'Available Commands'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {commands.map((cmd, i) => (
                <button key={i} onClick={() => executeCommand(cmd)}
                  style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid #f0e8d8', background: '#fff8f0', color: '#f08000', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins' }}>
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mic toggle inside panel */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #f0e8d8', display: 'flex', gap: 8 }}>
            <button onClick={() => { if (listening) stopListening(); else { restartRef.current = false; startListening(); } }}
              style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: listening ? '#fef2f2' : '#ecfdf5', color: listening ? '#ef4444' : '#10b981', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Poppins' }}>
              {listening ? <><MicOff size={14} /> Stop</> : <><Mic size={14} /> Listen</>}
            </button>
            <button onClick={() => { const h = HELP_TEXT[language] || HELP_TEXT.en; showFeedback(h, 'info'); speak(h, langCode); }}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #f0e8d8', background: 'white', color: '#4a5568', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Poppins' }}>
              <Volume2 size={13} /> Help
            </button>
          </div>
        </div>
      )}

      {/* Floating mic button */}
      <button
        onClick={toggleActive}
        title={active ? 'Stop Voice Navigation' : 'Start Voice Navigation'}
        style={{
          position: 'fixed', bottom: 24, right: 20, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          background: active
            ? 'linear-gradient(135deg,#ef4444,#b91c1c)'
            : 'linear-gradient(135deg,#f08000,#c66200)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: active
            ? '0 0 0 4px rgba(239,68,68,0.25), 0 8px 24px rgba(239,68,68,0.4)'
            : '0 8px 24px rgba(240,128,0,0.4)',
          transition: 'all 0.3s',
          animation: listening ? 'voicePulse 1.5s infinite' : 'none',
        }}
      >
        {active ? <MicOff size={22} color="white" /> : <Mic size={22} color="white" />}
      </button>

      <style>{`
        @keyframes voicePulse {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5), 0 8px 24px rgba(239,68,68,0.3); }
          70% { box-shadow: 0 0 0 14px rgba(239,68,68,0), 0 8px 24px rgba(239,68,68,0.3); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0), 0 8px 24px rgba(239,68,68,0.3); }
        }
        @keyframes voiceBar {
          from { transform: scaleY(0.4); opacity: 0.7; }
          to { transform: scaleY(1); opacity: 1; }
        }
        @media (max-width: 480px) {
          /* Move button slightly left so it doesn't cover scrollbar */
          button[title*="Voice"] { right: 12px !important; bottom: 16px !important; }
        }
      `}</style>
    </>
  );
}
