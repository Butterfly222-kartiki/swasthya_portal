'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { Mic, MicOff, X, Volume2 } from 'lucide-react';

// Page announcements per language
const PAGE_NAMES = {
  en: {
    '/': 'Home page. Welcome to Swasthya Portal.',
    '/auth/login': 'Login page. Please sign in to your account.',
    '/auth/register': 'Sign up page. Create your new account.',
    '/dashboard': 'Dashboard. Your health overview.',
    '/appointments': 'Appointment booking page. Book a doctor visit.',
    '/chat': 'Chat page. Talk to your doctor.',
    '/documents': 'Medical documents page. View your health records.',
    '/pharmacy': 'Nearby pharmacy page. Find medicines and clinics.',
    '/profile': 'Profile page. Manage your personal information.',
  },
  hi: {
    '/': 'होम पेज। स्वास्थ्य पोर्टल में आपका स्वागत है।',
    '/auth/login': 'लॉगिन पेज। कृपया अपने खाते में लॉगिन करें।',
    '/auth/register': 'नया खाता बनाएं। साइन अप पेज।',
    '/dashboard': 'डैशबोर्ड। आपकी स्वास्थ्य जानकारी।',
    '/appointments': 'अपॉइंटमेंट बुकिंग पेज। डॉक्टर की अपॉइंटमेंट बुक करें।',
    '/chat': 'चैट पेज। अपने डॉक्टर से बात करें।',
    '/documents': 'चिकित्सा दस्तावेज़ पेज। अपने स्वास्थ्य रिकॉर्ड देखें।',
    '/pharmacy': 'नजदीकी फार्मेसी पेज। दवाई और क्लिनिक खोजें।',
    '/profile': 'प्रोफ़ाइल पेज। अपनी जानकारी प्रबंधित करें।',
  },
  mr: {
    '/': 'मुख्य पान. स्वास्थ्य पोर्टलमध्ये आपले स्वागत आहे.',
    '/auth/login': 'लॉगिन पान. कृपया आपल्या खात्यात साइन इन करा.',
    '/auth/register': 'नोंदणी पान. नवीन खाते तयार करा.',
    '/dashboard': 'डॅशबोर्ड. तुमची आरोग्य माहिती.',
    '/appointments': 'भेट बुकिंग पान. डॉक्टरांची भेट बुक करा.',
    '/chat': 'चॅट पान. तुमच्या डॉक्टरांशी बोला.',
    '/documents': 'वैद्यकीय कागदपत्रे पान. तुमचे आरोग्य रेकॉर्ड पहा.',
    '/pharmacy': 'जवळील फार्मसी पान. औषधे आणि दवाखाना शोधा.',
    '/profile': 'प्रोफाइल पान. तुमची वैयक्तिक माहिती व्यवस्थापित करा.',
  },
};

const COMMANDS = {
  en: [
    { patterns: ['dashboard', 'home', 'go home'], route: '/dashboard', label: 'Dashboard' },
    { patterns: ['appointment', 'appointments', 'book appointment', 'book', 'schedule'], route: '/appointments', label: 'Appointments' },
    { patterns: ['chat', 'message', 'talk to doctor', 'consult'], route: '/chat', label: 'Chat' },
    { patterns: ['document', 'documents', 'records', 'medical records'], route: '/documents', label: 'Documents' },
    { patterns: ['pharmacy', 'medicine', 'nearby pharmacy', 'clinic'], route: '/pharmacy', label: 'Pharmacy' },
    { patterns: ['profile', 'my profile', 'account'], route: '/profile', label: 'Profile' },
    { patterns: ['login', 'sign in'], route: '/auth/login', label: 'Login' },
    { patterns: ['register', 'sign up', 'new account'], route: '/auth/register', label: 'Sign Up' },
    { patterns: ['logout', 'log out', 'sign out', 'exit'], action: 'logout', label: 'Logout' },
    { patterns: ['go back', 'back'], action: 'back', label: 'Go Back' },
    { patterns: ['help', 'commands'], action: 'help', label: 'Help' },
  ],
  hi: [
    { patterns: ['डैशबोर्ड', 'होम', 'घर', 'dashboard'], route: '/dashboard', label: 'डैशबोर्ड' },
    { patterns: ['अपॉइंटमेंट', 'मुलाकात', 'बुकिंग', 'book'], route: '/appointments', label: 'अपॉइंटमेंट' },
    { patterns: ['चैट', 'डॉक्टर से बात', 'chat'], route: '/chat', label: 'चैट' },
    { patterns: ['दस्तावेज़', 'रिकॉर्ड', 'document'], route: '/documents', label: 'दस्तावेज़' },
    { patterns: ['फार्मेसी', 'दवाई', 'दवा', 'pharmacy'], route: '/pharmacy', label: 'फार्मेसी' },
    { patterns: ['प्रोफ़ाइल', 'मेरा खाता', 'profile'], route: '/profile', label: 'प्रोफ़ाइल' },
    { patterns: ['लॉगिन', 'login'], route: '/auth/login', label: 'लॉगिन' },
    { patterns: ['नया खाता', 'साइन अप', 'register'], route: '/auth/register', label: 'साइन अप' },
    { patterns: ['लॉगआउट', 'बाहर', 'logout'], action: 'logout', label: 'लॉगआउट' },
    { patterns: ['वापस', 'पीछे', 'back'], action: 'back', label: 'वापस जाएं' },
    { patterns: ['मदद', 'help'], action: 'help', label: 'मदद' },
  ],
  mr: [
    { patterns: ['डॅशबोर्ड', 'मुख्य', 'dashboard'], route: '/dashboard', label: 'डॅशबोर्ड' },
    { patterns: ['भेट', 'अपॉइंटमेंट', 'बुकिंग', 'appointment'], route: '/appointments', label: 'भेटी' },
    { patterns: ['चॅट', 'डॉक्टरांशी बोला', 'chat'], route: '/chat', label: 'चॅट' },
    { patterns: ['कागदपत्रे', 'रेकॉर्ड', 'document'], route: '/documents', label: 'कागदपत्रे' },
    { patterns: ['फार्मसी', 'औषध', 'रुग्णालय', 'pharmacy'], route: '/pharmacy', label: 'फार्मसी' },
    { patterns: ['प्रोफाइल', 'माझे खाते', 'profile'], route: '/profile', label: 'प्रोफाइल' },
    { patterns: ['लॉगिन', 'login'], route: '/auth/login', label: 'लॉगिन' },
    { patterns: ['नोंदणी', 'नवीन खाते', 'register'], route: '/auth/register', label: 'नोंदणी' },
    { patterns: ['लॉगआउट', 'बाहेर', 'logout'], action: 'logout', label: 'लॉगआउट' },
    { patterns: ['मागे', 'परत', 'back'], action: 'back', label: 'मागे जा' },
    { patterns: ['मदत', 'help'], action: 'help', label: 'मदत' },
  ],
};

const LANG_CODES = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };

const HELP_TEXT = {
  en: 'Say: Dashboard, Appointments, Chat, Documents, Pharmacy, Profile, Login, Sign Up, Back, Logout',
  hi: 'कहें: डैशबोर्ड, अपॉइंटमेंट, चैट, दस्तावेज़, फार्मेसी, प्रोफ़ाइल, लॉगिन, साइन अप, वापस, लॉगआउट',
  mr: 'म्हणा: डॅशबोर्ड, भेट, चॅट, कागदपत्रे, फार्मसी, प्रोफाइल, लॉगिन, नोंदणी, मागे, लॉगआउट',
};

const NOT_UNDERSTOOD = {
  en: 'Not understood, please try again.',
  hi: 'समझ नहीं आया, फिर से कहें।',
  mr: 'समजले नाही, पुन्हा सांगा.',
};

function speak(text, langCode, rate = 0.92) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = langCode;
  utt.rate = rate;
  utt.pitch = 1.05;
  // Prefer a local voice for the language
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
  if (match) utt.voice = match;
  window.speechSynthesis.speak(utt);
}

export default function VoiceNavigator() {
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useLanguage();

  const [active, setActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('info');
  const [showPanel, setShowPanel] = useState(false);
  const [supported, setSupported] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentPageName, setCurrentPageName] = useState('');
  const recognitionRef = useRef(null);
  const restartRef = useRef(null);
  const prevPathRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  // ── Announce page on every route change ───────────────────────────────────
  useEffect(() => {
    if (!mounted || !active) return;
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;

    const langCode = LANG_CODES[language] || 'en-IN';
    const pages = PAGE_NAMES[language] || PAGE_NAMES.en;

    // Match exact or prefix
    const announcement =
      pages[pathname] ||
      Object.entries(pages).find(([k]) => pathname.startsWith(k) && k !== '/')?.[1] ||
      null;

    if (announcement) {
      setCurrentPageName(announcement);
      // Small delay so page has rendered
      setTimeout(() => speak(announcement, langCode, 0.88), 300);
    }
  }, [pathname, mounted, active, language]);

  // ── Also announce on language change if active ────────────────────────────
  useEffect(() => {
    if (!mounted || !active || !pathname) return;
    const langCode = LANG_CODES[language] || 'en-IN';
    const pages = PAGE_NAMES[language] || PAGE_NAMES.en;
    const announcement = pages[pathname] || null;
    if (announcement) {
      setCurrentPageName(announcement);
      setTimeout(() => speak(announcement, langCode, 0.88), 200);
    }
  }, [language]);

  const showFeedback = useCallback((msg, type = 'info') => {
    setFeedback(msg);
    setFeedbackType(type);
    setTimeout(() => setFeedback(''), 4000);
  }, []);

  const matchCommand = useCallback((text) => {
    const lower = text.toLowerCase().trim();
    const cmds = COMMANDS[language] || COMMANDS.en;
    for (const cmd of cmds) {
      if (cmd.patterns.some(p => lower.includes(p.toLowerCase()))) return cmd;
    }
    return null;
  }, [language]);

  const executeCommand = useCallback((cmd) => {
    const langCode = LANG_CODES[language] || 'en-IN';
    if (cmd.route) {
      showFeedback(`✅ ${cmd.label}`, 'success');
      speak(cmd.label, langCode);
      setTimeout(() => router.push(cmd.route), 500);
    } else if (cmd.action === 'logout') {
      showFeedback(`👋 ${cmd.label}`, 'success');
      speak(cmd.label, langCode);
      setTimeout(() => router.push('/auth/login'), 600);
    } else if (cmd.action === 'back') {
      showFeedback(`⬅️ ${cmd.label}`, 'success');
      speak(cmd.label, langCode);
      router.back();
    } else if (cmd.action === 'help') {
      const h = HELP_TEXT[language] || HELP_TEXT.en;
      showFeedback(h, 'info');
      speak(h, langCode, 0.85);
    }
  }, [language, router, showFeedback]);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }

    const recognition = new SR();
    recognition.lang = LANG_CODES[language] || 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      setTranscript(final || interim);
      if (final) {
        const cmd = matchCommand(final);
        if (cmd) executeCommand(cmd);
        else {
          showFeedback(`❓ "${final}"`, 'error');
          speak(NOT_UNDERSTOOD[language] || NOT_UNDERSTOOD.en, LANG_CODES[language] || 'en-IN');
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
      if (restartRef.current) { restartRef.current = false; startListening(); }
    };
    try { recognition.start(); } catch {}
  }, [language, matchCommand, executeCommand, showFeedback]);

  const stopListening = useCallback(() => {
    restartRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
    setTranscript('');
  }, []);

  const toggleActive = () => {
    if (active) {
      stopListening();
      setActive(false);
      setShowPanel(false);
      setCurrentPageName('');
      window.speechSynthesis?.cancel();
    } else {
      setActive(true);
      setShowPanel(true);
      restartRef.current = false;
      prevPathRef.current = null; // reset so it announces current page
      startListening();
    }
  };

  // Re-init mic when language changes
  useEffect(() => {
    if (active && listening) {
      restartRef.current = true;
      try { recognitionRef.current?.stop(); } catch {}
    }
  }, [language]);

  useEffect(() => {
    return () => {
      restartRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      window.speechSynthesis?.cancel();
    };
  }, []);

  if (!supported || !mounted) return null;

  const langCode = LANG_CODES[language] || 'en-IN';
  const commands = COMMANDS[language] || COMMANDS.en;

  const listenLabel = { en: 'Listening...', hi: 'सुन रहा है...', mr: 'ऐकत आहे...' };
  const pausedLabel = { en: 'Paused', hi: 'रुका हुआ', mr: 'थांबले' };
  const promptLabel = { en: 'Say a command...', hi: 'बोलिए...', mr: 'बोला...' };
  const availLabel = { en: 'Available Commands', hi: 'उपलब्ध आदेश', mr: 'उपलब्ध आदेश' };
  const stopLabel = { en: 'Stop', hi: 'रोकें', mr: 'थांबा' };
  const listenBtn = { en: 'Listen', hi: 'सुनें', mr: 'ऐका' };
  const helpLabel = { en: 'Help', hi: 'मदद', mr: 'मदत' };

  return (
    <>
      {showPanel && (
        <div style={{ position: 'fixed', bottom: 90, right: 20, zIndex: 9999, width: 'min(320px, calc(100vw - 40px))', background: 'white', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', border: '1px solid #f0e8d8', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: listening ? '#ef4444' : '#f08000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {listening ? <Mic size={16} color="white" /> : <MicOff size={16} color="white" />}
              </div>
              <div>
                <div style={{ color: 'white', fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.875rem' }}>Voice Navigator</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>{listening ? `🔴 ${listenLabel[language] || listenLabel.en}` : `⏸ ${pausedLabel[language] || pausedLabel.en}`}</div>
              </div>
            </div>
            <button onClick={() => { stopListening(); setActive(false); setShowPanel(false); setCurrentPageName(''); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={14} color="white" />
            </button>
          </div>

          {/* Current page banner */}
          {currentPageName && (
            <div style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#fff8f0,#fffaf5)', borderBottom: '1px solid #f0e8d8', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Volume2 size={13} color="#f08000" />
              <span style={{ fontSize: '0.78rem', color: '#c66200', fontWeight: 600, fontFamily: 'Poppins' }}>{currentPageName}</span>
            </div>
          )}

          {/* Transcript */}
          <div style={{ padding: '12px 16px', background: '#f9f9f9', borderBottom: '1px solid #f0e8d8', minHeight: 44, display: 'flex', alignItems: 'center', gap: 8 }}>
            {listening && (
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', flexShrink: 0 }}>
                {[4, 8, 5, 10, 6].map((h, i) => (
                  <div key={i} style={{ width: 3, height: h, background: '#f08000', borderRadius: 3, animation: `voiceBar 0.8s ease-in-out ${i * 0.12}s infinite alternate` }} />
                ))}
              </div>
            )}
            <span style={{ color: transcript ? '#1a1a2e' : '#9ca3af', fontSize: '0.85rem', fontStyle: transcript ? 'normal' : 'italic', fontFamily: 'Poppins' }}>
              {transcript || (listening ? (promptLabel[language] || promptLabel.en) : (pausedLabel[language] || pausedLabel.en))}
            </span>
          </div>

          {/* Feedback */}
          {feedback && (
            <div style={{ padding: '10px 16px', background: feedbackType === 'success' ? '#ecfdf5' : feedbackType === 'error' ? '#fef2f2' : '#eff6ff', borderBottom: '1px solid #f0e8d8' }}>
              <p style={{ color: feedbackType === 'success' ? '#065f46' : feedbackType === 'error' ? '#991b1b' : '#1e40af', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>{feedback}</p>
            </div>
          )}

          {/* Commands */}
          <div style={{ padding: '12px 16px', maxHeight: 180, overflowY: 'auto' }}>
            <p style={{ color: '#9ca3af', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{availLabel[language] || availLabel.en}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {commands.map((cmd, i) => (
                <button key={i} onClick={() => executeCommand(cmd)} style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid #f0e8d8', background: '#fff8f0', color: '#f08000', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins' }}>
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #f0e8d8', display: 'flex', gap: 8 }}>
            <button onClick={() => { if (listening) stopListening(); else { restartRef.current = false; startListening(); } }} style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: listening ? '#fef2f2' : '#ecfdf5', color: listening ? '#ef4444' : '#10b981', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Poppins' }}>
              {listening ? <><MicOff size={14} />{stopLabel[language]}</> : <><Mic size={14} />{listenBtn[language]}</>}
            </button>
            <button onClick={() => { const h = HELP_TEXT[language] || HELP_TEXT.en; showFeedback(h, 'info'); speak(h, langCode, 0.85); }} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #f0e8d8', background: 'white', color: '#4a5568', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Poppins' }}>
              <Volume2 size={13} />{helpLabel[language]}
            </button>
          </div>
        </div>
      )}

      {/* Floating mic */}
      <button onClick={toggleActive} title={active ? 'Stop Voice Navigation' : 'Start Voice Navigation'} style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 9999, width: 56, height: 56, borderRadius: '50%', background: active ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : 'linear-gradient(135deg,#f08000,#c66200)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: active ? '0 0 0 4px rgba(239,68,68,0.25),0 8px 24px rgba(239,68,68,0.4)' : '0 8px 24px rgba(240,128,0,0.4)', transition: 'all 0.3s' }}>
        {active ? <MicOff size={22} color="white" /> : <Mic size={22} color="white" />}
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes voicePulse {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5),0 8px 24px rgba(239,68,68,0.3); }
          70% { box-shadow: 0 0 0 14px rgba(239,68,68,0),0 8px 24px rgba(239,68,68,0.3); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0),0 8px 24px rgba(239,68,68,0.3); }
        }
        @keyframes voiceBar {
          from { transform: scaleY(0.4); opacity: 0.7; }
          to { transform: scaleY(1); opacity: 1; }
        }
        @media (max-width: 480px) {
          button[title*="Voice"] { right: 12px !important; bottom: 16px !important; }
        }
      `}} />
    </>
  );
}
