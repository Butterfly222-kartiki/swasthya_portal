'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { supportedLanguages } from '@/lib/i18n';
import toast from 'react-hot-toast';
import { HeartPulse, Mail, Lock, Eye, EyeOff, Globe, Mic, MicOff, Volume2 } from 'lucide-react';

export default function LoginPage() {
  const { t, language, changeLanguage } = useLanguage();
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [listening, setListening] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const recRef = useRef(null);

  // Voice navigation - read page instructions aloud
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : language === 'ta' ? 'ta-IN' : 'en-IN';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const startVoice = (field) => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Voice not supported in this browser');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recRef.current = new SR();
    recRef.current.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
    recRef.current.onresult = (e) => {
      const text = e.results[0][0].transcript;
      if (field === 'email') setEmail(text.replace(/\s/g, '').toLowerCase());
      else if (field === 'password') setPassword(text);
    };
    recRef.current.onend = () => { setListening(false); setActiveField(null); };
    recRef.current.start();
    setListening(true);
    setActiveField(field);
    speak(field === 'email' ? 'Please say your email address' : 'Please say your password');
  };

  const stopVoice = () => { recRef.current?.stop(); setListening(false); setActiveField(null); };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        toast.error(error.message);
        speak('Login failed. ' + error.message);
      } else {
        // Check role and redirect accordingly
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        toast.success('Welcome back!');
        speak('Login successful. Welcome back.');
        if (profile?.role === 'admin') router.push('/admin');
        else router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="rangoli-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg,#0d9488,#0f766e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(13,148,136,0.35)' }}>
            <HeartPulse size={30} color="white" />
          </div>
          <h1 style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '1.6rem', color: '#0f2d2a' }}>Swasthya Portal</h1>
          <p style={{ color: '#3d6b66', fontSize: '0.875rem', marginTop: 4 }}>Sign in to your account</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>

          {/* Top bar: Language + Voice nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            {/* Language switcher */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowLang(!showLang)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid #ccfbf1', background: '#f0fdfa', cursor: 'pointer', fontSize: '0.8rem', color: '#0d9488', fontWeight: 600 }}>
                <Globe size={13} />
                {supportedLanguages.find(l => l.code === language)?.flag} {supportedLanguages.find(l => l.code === language)?.label}
              </button>
              {showLang && (
                <div style={{ position: 'absolute', top: '110%', left: 0, background: 'white', border: '1px solid #ccfbf1', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 150 }}>
                  {supportedLanguages.map(lang => (
                    <button key={lang.code} onClick={() => { changeLanguage(lang.code); setShowLang(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: language === lang.code ? '#f0fdfa' : 'white', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: language === lang.code ? '#0d9488' : '#0f2d2a', fontWeight: language === lang.code ? 600 : 400 }}>
                      {lang.flag} {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Voice navigation button */}
            <button
              onClick={() => speak('Welcome to Swasthya Portal. Please enter your email address and password to login. You can also use the microphone buttons next to each field to speak your input.')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid #ccfbf1', background: '#f0fdfa', cursor: 'pointer', fontSize: '0.8rem', color: '#0f766e', fontWeight: 600 }}
              title="Read page instructions aloud"
            >
              <Volume2 size={13} />
              Voice Guide
            </button>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email field */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#0f2d2a', marginBottom: 6 }}>{t('email')}</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 1 }} />
                <input
                  className="input-field"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={{ paddingLeft: 38, paddingRight: 44, borderColor: activeField === 'email' ? '#0f766e' : undefined }}
                />
                <button type="button" onClick={() => activeField === 'email' ? stopVoice() : startVoice('email')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', border: 'none', background: activeField === 'email' ? '#059669' : '#f5f5f5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Voice input for email"
                >
                  {activeField === 'email' ? <MicOff size={13} color="white" /> : <Mic size={13} color="#3d6b66" />}
                </button>
              </div>
            </div>

            {/* Password field */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#0f2d2a', marginBottom: 6 }}>{t('password')}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  className="input-field"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{ paddingLeft: 38, paddingRight: 76 }}
                />
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#f5f5f5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {showPass ? <EyeOff size={13} color="#3d6b66" /> : <Eye size={13} color="#3d6b66" />}
                  </button>
                  <button type="button" onClick={() => activeField === 'password' ? stopVoice() : startVoice('password')}
                    style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: activeField === 'password' ? '#059669' : '#f5f5f5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Voice input for password"
                  >
                    {activeField === 'password' ? <MicOff size={13} color="white" /> : <Mic size={13} color="#3d6b66" />}
                  </button>
                </div>
              </div>
            </div>

            {listening && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#ecfdf5', borderRadius: 8, border: '1px solid #fecaca' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', animation: 'pulse 1s infinite' }} />
                <span style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 600 }}>Listening… speak now</span>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', opacity: loading ? 0.7 : 1, fontSize: '1rem', padding: '0.875rem' }}>
              {loading ? '⏳ Signing in...' : t('login')}
            </button>
          </form>

          <div className="mandala-divider" style={{ margin: '20px 0' }} />

          <p style={{ textAlign: 'center', color: '#3d6b66', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link href="/auth/register" style={{ color: '#0d9488', fontWeight: 700, textDecoration: 'none' }}>{t('register')}</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.72rem', marginTop: 16 }}>
          🔒 Secured by Supabase Auth · End-to-end encrypted
        </p>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
