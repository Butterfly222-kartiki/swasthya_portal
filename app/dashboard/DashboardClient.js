'use client';

import { useLanguage } from '@/lib/LanguageContext';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Calendar, MessageCircle, FileText, MapPin,
  ChevronRight, Clock, AlertCircle, TrendingUp
} from 'lucide-react';

const healthTips = {
  en: [
    'Drink at least 8 glasses of water daily.',
    'Walk for 30 minutes every day.',
    'Eat seasonal fruits and vegetables.',
    'Get 7–8 hours of sleep for body recovery.',
    'Wash hands regularly to prevent infections.',
    'Avoid skipping meals — eat small portions 5 times a day.',
  ],
  hi: [
    'रोज़ कम से कम 8 गिलास पानी पिएं।',
    'हर दिन 30 मिनट चलें।',
    'मौसमी फल और सब्जियां खाएं।',
    'शरीर की रिकवरी के लिए 7-8 घंटे सोएं।',
    'संक्रमण से बचने के लिए हाथ नियमित धोएं।',
    'भोजन न छोड़ें — दिन में 5 बार थोड़ा-थोड़ा खाएं।',
  ],
  mr: [
    'दररोज किमान 8 ग्लास पाणी प्या.',
    'दररोज 30 मिनिटे चाला.',
    'हंगामी फळे आणि भाज्या खा.',
    'शरीर पुनर्प्राप्तीसाठी 7-8 तास झोपा.',
    'संसर्ग टाळण्यासाठी नियमित हात धुवा.',
    'जेवण वगळू नका — दिवसातून 5 वेळा थोडे थोडे खा.',
  ],
  ta: [
    'தினமும் குறைந்தது 8 கிளாஸ் தண்ணீர் குடியுங்கள்.',
    'தினமும் 30 நிமிடம் நடுங்கள்.',
    'பருவகால பழங்கள் மற்றும் காய்கறிகள் சாப்பிடுங்கள்.',
    'உடல் மீட்புக்கு 7-8 மணி நேரம் தூங்குங்கள்.',
    'தொற்றை தடுக்க கைகளை அடிக்கடி கழுவுங்கள்.',
    'உணவை தவிர்க்காதீர்கள் — தினமும் 5 முறை சாப்பிடுங்கள்.',
  ],
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'good_morning';
  if (h < 17) return 'good_afternoon';
  return 'good_evening';
}

const greetingEmoji = { good_morning: '🌅', good_afternoon: '☀️', good_evening: '🌙' };

export default function DashboardClient({ profile, appointments, recentChats, docCount }) {
  const { t, language } = useLanguage();
  const greeting = getGreeting();
  const tips = healthTips[language] || healthTips.en;
  const tipIndex = new Date().getDate() % tips.length;

  const stats = [
    { label: t('upcoming_appointments'), value: appointments.length, icon: Calendar, color: '#f08000' },
    { label: t('active_chats'), value: recentChats.length, icon: MessageCircle, color: '#10b981' },
    { label: t('medical_records'), value: docCount, icon: FileText, color: '#4f46e5' },
    { label: t('consultations_done'), value: 12, icon: TrendingUp, color: '#8b5cf6' },
  ];

  const quickActions = [
    { href: '/appointments', icon: Calendar, label: t('book_appointment'), color: '#f08000', bg: '#fff8f0' },
    { href: '/chat', icon: MessageCircle, label: t('chat_with_doctor'), color: '#10b981', bg: '#ecfdf5' },
    { href: '/documents', icon: FileText, label: t('upload_record'), color: '#4f46e5', bg: '#eef2ff' },
    { href: '/pharmacy', icon: MapPin, label: t('find_pharmacy'), color: '#ef4444', bg: '#fef2f2' },
  ];

  return (
    <div className="animate-fade-in db-wrap">
      {/* Greeting banner */}
      <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)', borderRadius: 20, padding: '1.5rem 2rem', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,128,0,0.2) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: 4 }}>
            {greetingEmoji[greeting]} {t(greeting)},
          </div>
          <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 'clamp(1.2rem,3vw,2rem)', color: 'white', marginBottom: 8 }}>
            {profile?.role === 'doctor' ? `Dr. ${profile?.full_name}` : profile?.full_name}
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(240,128,0,0.2)', border: '1px solid rgba(240,128,0,0.3)', borderRadius: 20, padding: '4px 12px', flexWrap: 'wrap' }}>
            <AlertCircle size={12} color="#ffbd5c" />
            <span style={{ color: '#ffbd5c', fontSize: '0.75rem', fontWeight: 600 }}>
              {t('health_tip')}: {tips[tipIndex]}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '2rem', color: '#1a1a2e', lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: '#4a5568', fontSize: '0.8rem', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '1.1rem', color: '#1a1a2e', marginBottom: 14 }}>{t('quick_actions')}</h2>
        <div className="actions-grid">
          {quickActions.map((a, i) => (
            <Link key={i} href={a.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #f0e8d8', borderRadius: 14, padding: '1.25rem 1rem', textAlign: 'center', transition: 'all 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${a.color}20`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <a.icon size={22} color={a.color} />
                </div>
                <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.8rem', color: '#1a1a2e' }}>{a.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="dash-bottom-grid">
        {/* Upcoming appointments */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '1rem', color: '#1a1a2e' }}>{t('upcoming_appointments')}</h2>
            <Link href="/appointments" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f08000', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>{t('view_all')} <ChevronRight size={14} /></Link>
          </div>
          {appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              <Calendar size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.875rem' }}>{t('no_appointments')}</p>
              <Link href="/appointments" style={{ display: 'inline-block', marginTop: 12, padding: '8px 20px', borderRadius: 10, background: '#f08000', color: 'white', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>
                {t('book_appointment')}
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {appointments.map((apt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#fafafa', borderRadius: 12, border: '1px solid #f0e8d8' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#f08000,#c66200)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'white', fontFamily: 'Poppins', fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>{format(new Date(apt.appointment_date), 'd')}</span>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.6rem', fontWeight: 600 }}>{format(new Date(apt.appointment_date), 'MMM')}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{apt.doctor_name || 'Doctor'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4a5568', fontSize: '0.75rem', marginTop: 2 }}>
                      <Clock size={11} /> {apt.time_slot}
                    </div>
                  </div>
                  <span className={`badge badge-${apt.status || 'pending'}`}>{apt.status || 'Pending'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent chats */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '1rem', color: '#1a1a2e' }}>{t('recent_chats')}</h2>
            <Link href="/chat" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f08000', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>{t('view_all')} <ChevronRight size={14} /></Link>
          </div>
          {recentChats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              <MessageCircle size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.875rem' }}>{t('no_conversations')}</p>
              <Link href="/chat" style={{ display: 'inline-block', marginTop: 12, padding: '8px 20px', borderRadius: 10, background: '#10b981', color: 'white', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>
                {t('start_chat')}
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentChats.map((chat, i) => (
                <Link key={i} href={`/chat/${chat.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#fafafa', borderRadius: 12, border: '1px solid #f0e8d8' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontFamily: 'Poppins', flexShrink: 0 }}>D</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a2e' }}>Dr. Consultation</div>
                    <div style={{ color: '#4a5568', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                      {chat.messages?.[0]?.content || t('no_conversations')}
                    </div>
                  </div>
                  <ChevronRight size={14} color="#9ca3af" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .db-wrap { padding-bottom: 2rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .actions-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
        .dash-bottom-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; }
        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(2,1fr); }
          .actions-grid { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2,1fr); gap: 10px; }
          .actions-grid { grid-template-columns: repeat(2,1fr); gap: 8px; }
          .dash-bottom-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
