'use client';

import { useLanguage } from '@/lib/LanguageContext';
import { supportedLanguages } from '@/lib/i18n';
import Link from 'next/link';
import { useState } from 'react';
import {
  HeartPulse, Calendar, MessageCircle, FileText,
  MapPin, Video, Globe, ChevronRight, Shield, Zap, Users
} from 'lucide-react';

const features = [
  { icon: MessageCircle, title: 'Doctor Chat', desc: 'Text consult with verified doctors in your language', color: '#f08000' },
  { icon: Calendar, title: 'Easy Booking', desc: 'Book appointments in 3 simple steps, any time', color: '#10b981' },
  { icon: FileText, title: 'Medical Records', desc: 'Upload, view and share records securely', color: '#4f46e5' },
  { icon: Video, title: 'Video Consult', desc: 'Face-to-face consultation over low-bandwidth video', color: '#ef4444' },
  { icon: MapPin, title: 'Nearby Clinics', desc: 'Find pharmacies and clinics on the map', color: '#f59e0b' },
  { icon: Globe, title: 'Multilingual', desc: 'English, हिंदी, मराठी, தமிழ் — your language', color: '#8b5cf6' },
];

const stats = [
  { value: '10,000+', label: 'Patients Served' },
  { value: '500+', label: 'Verified Doctors' },
  { value: '28', label: 'States Covered' },
  { value: '4.8★', label: 'Patient Rating' },
];

export default function HomePage() {
  const { t, language, changeLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  return (
    <div className="min-h-screen rangoli-bg">
      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '1px solid #f0e8d8', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#f08000,#c66200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartPulse size={20} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '1.1rem', color: '#1a1a2e', lineHeight: 1 }}>Swasthya</div>
              <div style={{ fontSize: '0.65rem', color: '#f08000', fontWeight: 600, letterSpacing: 2 }}>PORTAL</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Language Switcher */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid #f0e8d8', background: 'white', cursor: 'pointer', fontSize: '0.875rem', color: '#4a5568' }}
              >
                <Globe size={14} />
                {supportedLanguages.find(l => l.code === language)?.label}
              </button>
              {showLangMenu && (
                <div style={{ position: 'absolute', top: '110%', right: 0, background: 'white', border: '1px solid #f0e8d8', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 140, zIndex: 100 }}>
                  {supportedLanguages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { changeLanguage(lang.code); setShowLangMenu(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: language === lang.code ? '#fff8f0' : 'white', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: language === lang.code ? '#f08000' : '#1a1a2e', fontWeight: language === lang.code ? 600 : 400 }}
                    >
                      {lang.flag} {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link href="/auth/login" style={{ padding: '8px 20px', borderRadius: 10, border: '2px solid #f08000', color: '#f08000', fontWeight: 600, fontFamily: 'Poppins', fontSize: '0.9rem', textDecoration: 'none' }}>
              {t('login')}
            </Link>
            <Link href="/auth/register" className="btn-primary" style={{ padding: '8px 20px', fontFamily: 'Poppins', fontSize: '0.9rem', textDecoration: 'none', borderRadius: 10, background: 'linear-gradient(135deg,#f08000,#c66200)', color: 'white', fontWeight: 600 }}>
              {t('register')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)', padding: '80px 1.5rem 120px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', right: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,128,0,0.15) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '3%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(240,128,0,0.15)', border: '1px solid rgba(240,128,0,0.3)', borderRadius: 50, padding: '6px 18px', marginBottom: 24 }}>
            <Zap size={14} color="#ffbd5c" />
            <span style={{ color: '#ffbd5c', fontSize: '0.8rem', fontWeight: 600, letterSpacing: 1 }}>INDIA'S RURAL HEALTH TECH PLATFORM</span>
          </div>

          <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'white', lineHeight: 1.15, marginBottom: 20 }}>
            {t('welcome')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(1rem, 2vw, 1.25rem)', marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
            Expert doctors. Secure consultations. Your language. Available even in low-bandwidth areas.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/register?role=patient" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg,#f08000,#c66200)', color: 'white', fontWeight: 700, fontFamily: 'Poppins', fontSize: '1rem', textDecoration: 'none', boxShadow: '0 8px 24px rgba(240,128,0,0.4)' }}>
              I'm a Patient <ChevronRight size={18} />
            </Link>
            <Link href="/auth/register?role=doctor" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 14, background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.3)', color: 'white', fontWeight: 700, fontFamily: 'Poppins', fontSize: '1rem', textDecoration: 'none', backdropFilter: 'blur(10px)' }}>
              I'm a Doctor <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'white', padding: '0 1.5rem', marginTop: -1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 0, borderTop: '3px solid', borderImage: 'linear-gradient(90deg,#f08000,#10b981,#f08000) 1' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ padding: '2rem 1.5rem', textAlign: 'center', borderRight: i < stats.length - 1 ? '1px solid #f0e8d8' : 'none' }}>
              <div style={{ fontFamily: 'Poppins', fontSize: '2rem', fontWeight: 800, color: '#f08000' }}>{s.value}</div>
              <div style={{ color: '#4a5568', fontSize: '0.9rem', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 1.5rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', color: '#1a1a2e', marginBottom: 12 }}>Everything You Need</h2>
          <div className="mandala-divider" style={{ width: 80, margin: '0 auto 16px' }} />
          <p style={{ color: '#4a5568', maxWidth: 500, margin: '0 auto' }}>Comprehensive telemedicine designed for India's diverse population and connectivity challenges</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {features.map((f, i) => (
            <div key={i} className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <f.icon size={22} color={f.color} />
              </div>
              <div>
                <div style={{ fontFamily: 'Poppins', fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>{f.title}</div>
                <div style={{ color: '#4a5568', fontSize: '0.875rem', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section style={{ background: 'linear-gradient(135deg,#fff8f0,#fff)', padding: '60px 1.5rem', borderTop: '1px solid #f0e8d8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 40, alignItems: 'center' }}>
          {[
            { icon: Shield, text: 'ABDM Compliant' },
            { icon: Shield, text: 'End-to-End Encrypted' },
            { icon: Users, text: 'MCI Verified Doctors' },
            { icon: Zap, text: 'Works on 2G Networks' },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4a5568' }}>
              <b.icon size={18} color="#f08000" />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1a1a2e', color: 'rgba(255,255,255,0.6)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <HeartPulse size={16} color="#f08000" />
          <span style={{ color: 'white', fontWeight: 600 }}>Swasthya Portal</span>
        </div>
        <div style={{ fontSize: '0.8rem' }}>© 2025 Swasthya Portal. Built for Bharat 🇮🇳</div>
      </footer>
    </div>
  );
}
