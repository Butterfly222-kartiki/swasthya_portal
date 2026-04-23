'use client';

import { useLanguage } from '@/lib/LanguageContext';
import { supportedLanguages } from '@/lib/i18n';
import Link from 'next/link';
import { useState } from 'react';
import {
  HeartPulse, Calendar, MessageCircle, FileText,
  MapPin, Video, Globe, ChevronRight, Shield, Zap, Users
} from 'lucide-react';

export default function HomePage() {
  const { t, language, changeLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    { icon: MessageCircle, titleKey: 'chat_with_doctor', descKey: 'features_sub', color: '#f08000' },
    { icon: Calendar, titleKey: 'book_appointment', descKey: 'features_sub', color: '#10b981' },
    { icon: FileText, titleKey: 'medical_records', descKey: 'features_sub', color: '#4f46e5' },
    { icon: Video, titleKey: 'video_consultation', descKey: 'features_sub', color: '#ef4444' },
    { icon: MapPin, titleKey: 'find_pharmacy', descKey: 'features_sub', color: '#f59e0b' },
    { icon: Globe, titleKey: 'multilingual', descKey: 'features_sub', color: '#8b5cf6' },
  ];

  const featureDescs = {
    en: ['Text consult with verified doctors in your language', 'Book appointments in 3 simple steps', 'Upload, view and share records securely', 'Face-to-face consultation over low-bandwidth video', 'Find pharmacies and clinics on the map', 'English, हिंदी, मराठी, தமிழ் — your language'],
    hi: ['सत्यापित डॉक्टरों से आपकी भाषा में परामर्श', '3 आसान चरणों में अपॉइंटमेंट बुक करें', 'रिकॉर्ड सुरक्षित अपलोड, देखें और शेयर करें', 'कम बैंडविड्थ पर वीडियो परामर्श', 'मानचित्र पर फार्मेसी और क्लिनिक खोजें', 'अपनी भाषा में स्वास्थ्य सेवा'],
    mr: ['सत्यापित डॉक्टरांशी आपल्या भाषेत सल्लामसलत', '3 सोप्या चरणांमध्ये भेट बुक करा', 'रेकॉर्ड सुरक्षितपणे अपलोड, पहा आणि शेअर करा', 'कमी बँडविड्थवर व्हिडिओ सल्लामसलत', 'नकाशावर फार्मसी आणि क्लिनिक शोधा', 'आपल्या भाषेत आरोग्यसेवा'],
    ta: ['சரிபார்க்கப்பட்ட மருத்துவர்களிடம் உங்கள் மொழியில் ஆலோசனை', '3 எளிய படிகளில் சந்திப்பை முன்பதிவு செய்யுங்கள்', 'பதிவுகளை பாதுகாப்பாக பதிவேற்றி பார்க்கவும்', 'குறைந்த அலைவரிசையில் வீடியோ ஆலோசனை', 'வரைபடத்தில் மருந்தகங்கள் மற்றும் கிளினிக்கை கண்டுபிடிக்கவும்', 'உங்கள் மொழியில் சுகாதார சேவை'],
  };

  const featureTitles = {
    en: ['Doctor Chat', 'Easy Booking', 'Medical Records', 'Video Consult', 'Nearby Clinics', 'Multilingual'],
    hi: ['डॉक्टर चैट', 'आसान बुकिंग', 'चिकित्सा रिकॉर्ड', 'वीडियो परामर्श', 'नजदीकी क्लिनिक', 'बहुभाषी'],
    mr: ['डॉक्टर चॅट', 'सहज बुकिंग', 'वैद्यकीय नोंदी', 'व्हिडिओ सल्लामसलत', 'जवळील क्लिनिक', 'बहुभाषिक'],
    ta: ['மருத்துவர் அரட்டை', 'எளிதான முன்பதிவு', 'மருத்துவ பதிவுகள்', 'வீடியோ ஆலோசனை', 'அருகிலுள்ள கிளினிக்', 'பன்மொழி'],
  };

  const stats = [
    { value: '10,000+', label: { en: 'Patients Served', hi: 'मरीज़ सेवा', mr: 'रुग्ण सेवा', ta: 'நோயாளிகள்' } },
    { value: '500+', label: { en: 'Verified Doctors', hi: 'सत्यापित डॉक्टर', mr: 'सत्यापित डॉक्टर', ta: 'சரிபார்க்கப்பட்ட மருத்துவர்கள்' } },
    { value: '28', label: { en: 'States Covered', hi: 'राज्य कवर', mr: 'राज्ये कव्हर', ta: 'மாநிலங்கள்' } },
    { value: '4.8★', label: { en: 'Patient Rating', hi: 'मरीज़ रेटिंग', mr: 'रुग्ण रेटिंग', ta: 'நோயாளி மதிப்பீடு' } },
  ];

  const descs = featureDescs[language] || featureDescs.en;
  const titles = featureTitles[language] || featureTitles.en;

  return (
    <div className="min-h-screen rangoli-bg">
      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '1px solid #f0e8d8', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#f08000,#c66200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <HeartPulse size={18} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '1rem', color: '#1a1a2e', lineHeight: 1 }}>Swasthya</div>
              <div style={{ fontSize: '0.6rem', color: '#f08000', fontWeight: 600, letterSpacing: 2 }}>PORTAL</div>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowLangMenu(!showLangMenu)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid #f0e8d8', background: 'white', cursor: 'pointer', fontSize: '0.85rem', color: '#4a5568' }}>
                <Globe size={14} />{supportedLanguages.find(l => l.code === language)?.label}
              </button>
              {showLangMenu && (
                <div style={{ position: 'absolute', top: '110%', right: 0, background: 'white', border: '1px solid #f0e8d8', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 140, zIndex: 100 }}>
                  {supportedLanguages.map(lang => (
                    <button key={lang.code} onClick={() => { changeLanguage(lang.code); setShowLangMenu(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: language === lang.code ? '#fff8f0' : 'white', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: language === lang.code ? '#f08000' : '#1a1a2e', fontWeight: language === lang.code ? 600 : 400 }}>
                      {lang.flag} {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link href="/auth/login" style={{ padding: '8px 18px', borderRadius: 10, border: '2px solid #f08000', color: '#f08000', fontWeight: 600, fontFamily: 'Poppins', fontSize: '0.875rem', textDecoration: 'none' }}>{t('login')}</Link>
            <Link href="/auth/register" style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#f08000,#c66200)', color: 'white', fontWeight: 600, fontFamily: 'Poppins', fontSize: '0.875rem', textDecoration: 'none' }}>{t('register')}</Link>
          </div>

          {/* Mobile menu button */}
          <button className="nav-mobile" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: 'none', border: '1px solid #f0e8d8', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: '1.2rem' }}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div style={{ borderTop: '1px solid #f0e8d8', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {supportedLanguages.map(lang => (
                <button key={lang.code} onClick={() => { changeLanguage(lang.code); setMobileMenuOpen(false); }}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #f0e8d8', background: language === lang.code ? '#fff8f0' : 'white', color: language === lang.code ? '#f08000' : '#4a5568', cursor: 'pointer', fontSize: '0.8rem', fontWeight: language === lang.code ? 600 : 400 }}>
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>
            <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px', borderRadius: 10, border: '2px solid #f08000', color: '#f08000', fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>{t('login')}</Link>
            <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg,#f08000,#c66200)', color: 'white', fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>{t('register')}</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)', padding: 'clamp(50px,8vw,100px) 1.25rem clamp(60px,10vw,130px)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', right: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,128,0,0.15) 0%, transparent 70%)' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(240,128,0,0.15)', border: '1px solid rgba(240,128,0,0.3)', borderRadius: 50, padding: '6px 18px', marginBottom: 20 }}>
            <Zap size={14} color="#ffbd5c" />
            <span style={{ color: '#ffbd5c', fontSize: '0.75rem', fontWeight: 600, letterSpacing: 1 }}>INDIA&apos;S RURAL HEALTH TECH PLATFORM</span>
          </div>
          <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 'clamp(1.75rem, 5vw, 3.5rem)', color: 'white', lineHeight: 1.15, marginBottom: 18 }}>{t('welcome')}</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(0.95rem, 2vw, 1.2rem)', marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>{t('hero_sub')}</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/register?role=patient" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 14, background: 'linear-gradient(135deg,#f08000,#c66200)', color: 'white', fontWeight: 700, fontFamily: 'Poppins', fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 8px 24px rgba(240,128,0,0.4)' }}>
              {t('im_patient')} <ChevronRight size={16} />
            </Link>
            <Link href="/auth/register?role=doctor" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 14, background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.3)', color: 'white', fontWeight: 700, fontFamily: 'Poppins', fontSize: '0.95rem', textDecoration: 'none', backdropFilter: 'blur(10px)' }}>
              {t('im_doctor')} <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'white', padding: '0 1.25rem' }}>
        <div className="stats-row" style={{ maxWidth: 1200, margin: '0 auto', borderTop: '3px solid', borderImage: 'linear-gradient(90deg,#f08000,#10b981,#f08000) 1' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ padding: '1.5rem 1rem', textAlign: 'center', borderRight: i < stats.length - 1 ? '1px solid #f0e8d8' : 'none' }}>
              <div style={{ fontFamily: 'Poppins', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, color: '#f08000' }}>{s.value}</div>
              <div style={{ color: '#4a5568', fontSize: '0.85rem', marginTop: 4 }}>{s.label[language] || s.label.en}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: 'clamp(40px,6vw,80px) 1.25rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 'clamp(1.4rem, 3vw, 2.25rem)', color: '#1a1a2e', marginBottom: 12 }}>{t('everything_you_need')}</h2>
          <div className="mandala-divider" style={{ width: 80, margin: '0 auto 16px' }} />
          <p style={{ color: '#4a5568', maxWidth: 500, margin: '0 auto', fontSize: '0.95rem' }}>{t('features_sub')}</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <f.icon size={22} color={f.color} />
              </div>
              <div>
                <div style={{ fontFamily: 'Poppins', fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>{titles[i]}</div>
                <div style={{ color: '#4a5568', fontSize: '0.875rem', lineHeight: 1.5 }}>{descs[i]}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section style={{ background: 'linear-gradient(135deg,#fff8f0,#fff)', padding: 'clamp(30px,5vw,60px) 1.25rem', borderTop: '1px solid #f0e8d8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 28, alignItems: 'center' }}>
          {[
            { icon: Shield, text: 'ABDM Compliant' },
            { icon: Shield, text: 'End-to-End Encrypted' },
            { icon: Users, text: 'MCI Verified Doctors' },
            { icon: Zap, text: 'Works on 2G Networks' },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4a5568' }}>
              <b.icon size={18} color="#f08000" />
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{b.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1a1a2e', color: 'rgba(255,255,255,0.6)', padding: '1.75rem 1.25rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
          <HeartPulse size={16} color="#f08000" />
          <span style={{ color: 'white', fontWeight: 600 }}>Swasthya Portal</span>
        </div>
        <div style={{ fontSize: '0.8rem' }}>© 2025 Swasthya Portal. Built for Bharat 🇮🇳</div>
      </footer>

      <style>{`
        .nav-mobile { display: none !important; }
        .nav-desktop { display: flex !important; }
        .stats-row { display: grid; grid-template-columns: repeat(4,1fr); }
        .features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        @media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 640px) {
          .nav-mobile { display: flex !important; }
          .nav-desktop { display: none !important; }
          .stats-row { grid-template-columns: repeat(2,1fr); }
          .features-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
