'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { supportedLanguages } from '@/lib/i18n';
import toast from 'react-hot-toast';
import { HeartPulse, Mail, Lock, Eye, EyeOff, Globe } from 'lucide-react';

export default function LoginPage() {
  const { t, language, changeLanguage } = useLanguage();
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLang, setShowLang] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="rangoli-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#f08000,#c66200)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <HeartPulse size={28} color="white" />
          </div>
          <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.5rem', color: '#1a1a2e' }}>Swasthya Portal</h1>
          <p style={{ color: '#4a5568', fontSize: '0.875rem', marginTop: 4 }}>{t('sign_in')}</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {/* Language switcher inside card */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, position: 'relative' }}>
            <button onClick={() => setShowLang(!showLang)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: '1px solid #f0e8d8', background: 'white', cursor: 'pointer', fontSize: '0.8rem', color: '#4a5568' }}>
              <Globe size={13} />
              {supportedLanguages.find(l => l.code === language)?.label}
            </button>
            {showLang && (
              <div style={{ position: 'absolute', top: '110%', right: 0, background: 'white', border: '1px solid #f0e8d8', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 130 }}>
                {supportedLanguages.map(lang => (
                  <button key={lang.code} onClick={() => { changeLanguage(lang.code); setShowLang(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: language === lang.code ? '#fff8f0' : 'white', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: language === lang.code ? '#f08000' : '#1a1a2e', fontWeight: language === lang.code ? 600 : 400 }}>
                    {lang.flag} {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#1a1a2e', marginBottom: 6 }}>{t('email')}</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={{ paddingLeft: 38 }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#1a1a2e', marginBottom: 6 }}>{t('password')}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input className="input-field" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={{ paddingLeft: 38, paddingRight: 38 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', opacity: loading ? 0.7 : 1 }}>
              {loading ? t('loading') : t('login')}
            </button>
          </form>

          <div className="mandala-divider" style={{ margin: '24px 0' }} />

          <p style={{ textAlign: 'center', color: '#4a5568', fontSize: '0.875rem' }}>
            {t('no_account')}{' '}
            <Link href="/auth/register" style={{ color: '#f08000', fontWeight: 600, textDecoration: 'none' }}>{t('register')}</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.75rem', marginTop: 20 }}>
          {t('data_secure')}
        </p>
      </div>
    </div>
  );
}
