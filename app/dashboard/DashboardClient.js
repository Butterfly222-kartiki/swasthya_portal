'use client';
import { useLanguage } from '@/lib/LanguageContext';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, MessageCircle, FileText, MapPin, Video, ChevronRight, Clock, Users, ClipboardList, Bell, TrendingUp } from 'lucide-react';

const healthTips = {
  en: ['Drink 8 glasses of water daily.','Walk 30 minutes every day.','Eat seasonal fruits and vegetables.','Get 7–8 hours of sleep.','Wash hands regularly.'],
  hi: ['रोज 8 गिलास पानी पियें।','हर दिन 30 मिनट चलें।','मौसमी फल और सब्जियां खाएं।','7-8 घंटे की नींद लें।','नियमित रूप से हाथ धोएं।'],
  mr: ['दररोज 8 ग्लास पाणी प्या।','दररोज 30 मिनिटे चाला।','हंगामी फळे आणि भाज्या खा।','7-8 तास झोपा।','नियमित हात धुवा।'],
  ta: ['தினமும் 8 கிளாஸ் தண்ணீர் குடியுங்கள்.','தினமும் 30 நிமிடம் நடையுங்கள்.','பருவகால பழங்கள் சாப்பிடுங்கள்.','7-8 மணி நேரம் தூங்குங்கள்.','அடிக்கடி கைகளை கழுவுங்கள்.'],
};

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'good_morning' : h < 17 ? 'good_afternoon' : 'good_evening';
}

// ─── PATIENT DASHBOARD ───
function PatientDashboard({ profile, appointments, recentChats, docCount }) {
  const { t, language, speak } = useLanguage();
  const greeting = getGreeting();
  const tips = healthTips[language] || healthTips.en;
  const tip = tips[new Date().getDate() % tips.length];

  const quickActions = [
    { href: '/appointments', icon: Calendar, label: t('book_appointment'), color: '#f08000', bg: '#fff8f0' },
    { href: '/chat', icon: MessageCircle, label: t('chat_with_doctor'), color: '#10b981', bg: '#ecfdf5' },
    { href: '/video', icon: Video, label: t('video_consultation'), color: '#4f46e5', bg: '#eef2ff' },
    { href: '/documents', icon: FileText, label: t('medical_records'), color: '#8b5cf6', bg: '#f5f3ff' },
    { href: '/pharmacy', icon: MapPin, label: t('find_pharmacy'), color: '#ef4444', bg: '#fef2f2' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Greeting banner */}
      <div style={{ background: 'linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%)', borderRadius: 20, padding: '1.75rem 2rem', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(240,128,0,0.18),transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem' }}>
            {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {t(greeting)} 👋
          </p>
          <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 'clamp(1.3rem,3vw,1.9rem)', color: 'white', margin: '6px 0 12px' }}>
            {profile?.full_name}
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(240,128,0,0.18)', border: '1px solid rgba(240,128,0,0.3)', borderRadius: 20, padding: '5px 14px' }}>
            <span style={{ fontSize: '0.75rem', color: '#ffbd5c', fontWeight: 600 }}>💡 {t('health_tip')}: {tip}</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: t('upcoming_appointments'), value: appointments.length, icon: Calendar, color: '#f08000' },
          { label: 'Active Chats', value: recentChats.length, icon: MessageCircle, color: '#10b981' },
          { label: t('medical_records'), value: docCount, icon: FileText, color: '#4f46e5' },
          { label: 'Consultations', value: 12, icon: TrendingUp, color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 14, padding: '1.25rem', border: '1px solid #f0e8d8', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.75rem', color: '#1a1a2e', lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: '#4a5568', fontSize: '0.75rem', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '1rem', color: '#1a1a2e', marginBottom: 12 }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
          {quickActions.map((a, i) => (
            <Link key={i} href={a.href} style={{ textDecoration: 'none' }}
              onClick={() => speak(a.label)}>
              <div style={{ background: 'white', border: '1px solid #f0e8d8', borderRadius: 14, padding: '1rem 0.75rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${a.color}20`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <a.icon size={20} color={a.color} />
                </div>
                <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.75rem', color: '#1a1a2e', lineHeight: 1.3 }}>{a.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Appointments + Chats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 18 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '1.25rem', border: '1px solid #f0e8d8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e' }}>{t('upcoming_appointments')}</h3>
            <Link href="/appointments" style={{ color: '#f08000', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>View all <ChevronRight size={13} /></Link>
          </div>
          {appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af' }}>
              <Calendar size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.8rem' }}>{t('no_appointments')}</p>
              <Link href="/appointments" style={{ display: 'inline-block', marginTop: 10, padding: '7px 18px', borderRadius: 8, background: '#f08000', color: 'white', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none' }}>
                {t('book_appointment')}
              </Link>
            </div>
          ) : appointments.map((apt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', background: '#fafafa', borderRadius: 10, border: '1px solid #f0e8d8', marginBottom: 8 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg,#f08000,#c66200)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontFamily: 'Poppins', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1 }}>{format(new Date(apt.appointment_date), 'd')}</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.58rem', fontWeight: 600 }}>{format(new Date(apt.appointment_date), 'MMM')}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1a1a2e' }}>Dr. {apt.doctor_name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4a5568', fontSize: '0.72rem', marginTop: 2 }}>
                  <Clock size={10} /> {apt.time_slot}
                </div>
              </div>
              <span className={`badge badge-${apt.status}`} style={{ fontSize: '0.68rem' }}>{t(apt.status)}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: '1.25rem', border: '1px solid #f0e8d8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e' }}>Recent Chats</h3>
            <Link href="/chat" style={{ color: '#f08000', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>View all <ChevronRight size={13} /></Link>
          </div>
          {recentChats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af' }}>
              <MessageCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.8rem' }}>{t('no_conversations')}</p>
              <Link href="/chat" style={{ display: 'inline-block', marginTop: 10, padding: '7px 18px', borderRadius: 8, background: '#10b981', color: 'white', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none' }}>
                {t('start_consultation')}
              </Link>
            </div>
          ) : recentChats.map((chat, i) => (
            <Link key={i} href={`/chat`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '10px', background: '#fafafa', borderRadius: 10, border: '1px solid #f0e8d8', marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>D</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1a1a2e' }}>Doctor Consultation</div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 1 }}>Tap to continue chat</div>
              </div>
              <ChevronRight size={13} color="#9ca3af" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DOCTOR DASHBOARD ───
function DoctorDashboard({ profile, appointments, recentChats }) {
  const { t, language, speak } = useLanguage();
  const greeting = getGreeting();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter(a => a.appointment_date === todayStr);
  const upcomingApts = appointments.filter(a => a.appointment_date > todayStr).slice(0, 3);

  const docActions = [
    { href: '/appointments', icon: Calendar, label: t('appointments'), color: '#f08000', bg: '#fff8f0' },
    { href: '/chat', icon: MessageCircle, label: t('chat'), color: '#10b981', bg: '#ecfdf5' },
    { href: '/video', icon: Video, label: t('video_consultation'), color: '#4f46e5', bg: '#eef2ff' },
    { href: '/doctor/patients', icon: Users, label: t('my_patients'), color: '#8b5cf6', bg: '#f5f3ff' },
    { href: '/doctor/availability', icon: ClipboardList, label: t('my_availability'), color: '#06b6d4', bg: '#ecfeff' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Doctor greeting */}
      <div style={{ background: 'linear-gradient(135deg,#312e81 0%,#1e1b4b 100%)', borderRadius: 20, padding: '1.75rem 2rem', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,70,229,0.3),transparent 70%)' }} />
        {profile.verification_status !== 'approved' && (
          <div style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 10, padding: '8px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={14} color="#fbbf24" />
            <span style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 600 }}>Your account is pending admin verification. You can still explore the portal.</span>
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {t(greeting)} 👨‍⚕️
          </p>
          <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 'clamp(1.3rem,3vw,1.9rem)', color: 'white', margin: '6px 0 4px' }}>
            Dr. {profile?.full_name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>{profile?.speciality || 'General Physician'} · {profile?.years_experience ? `${profile.years_experience} yrs exp` : ''}</p>
        </div>
      </div>

      {/* Today's stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: "Today's Appointments", value: todayApts.length, icon: Calendar, color: '#f08000' },
          { label: 'Total Patients', value: appointments.length, icon: Users, color: '#10b981' },
          { label: 'Active Chats', value: recentChats.length, icon: MessageCircle, color: '#4f46e5' },
          { label: 'Upcoming', value: upcomingApts.length, icon: TrendingUp, color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 14, padding: '1.25rem', border: '1px solid #f0e8d8' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.75rem', color: '#1a1a2e', lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: '#4a5568', fontSize: '0.75rem', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '1rem', color: '#1a1a2e', marginBottom: 12 }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
          {docActions.map((a, i) => (
            <Link key={i} href={a.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #f0e8d8', borderRadius: 14, padding: '1rem 0.75rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${a.color}20`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <a.icon size={20} color={a.color} />
                </div>
                <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.75rem', color: '#1a1a2e', lineHeight: 1.3 }}>{a.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Today's schedule */}
      <div style={{ background: 'white', borderRadius: 16, padding: '1.25rem', border: '1px solid #f0e8d8' }}>
        <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} color="#f08000" /> {t('todays_schedule')}
        </h3>
        {todayApts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            <Calendar size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
            <p style={{ fontSize: '0.8rem' }}>No appointments today</p>
          </div>
        ) : todayApts.map((apt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#fafafa', borderRadius: 10, border: '1px solid #f0e8d8', marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontFamily: 'Poppins', flexShrink: 0 }}>
              {apt.patient_name?.[0] || 'P'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a2e' }}>{apt.patient_name}</div>
              <div style={{ fontSize: '0.72rem', color: '#4a5568', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={10} /> {apt.time_slot}
                {apt.reason && <span>· {apt.reason}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Link href="/chat" style={{ padding: '5px 10px', borderRadius: 7, background: '#ecfdf5', color: '#10b981', fontWeight: 600, fontSize: '0.72rem', textDecoration: 'none' }}>Chat</Link>
              <Link href="/video" style={{ padding: '5px 10px', borderRadius: 7, background: '#eef2ff', color: '#4f46e5', fontWeight: 600, fontSize: '0.72rem', textDecoration: 'none' }}>Video</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardClient({ profile, appointments, recentChats, docCount }) {
  if (profile?.role === 'doctor') {
    return <DoctorDashboard profile={profile} appointments={appointments} recentChats={recentChats} />;
  }
  return <PatientDashboard profile={profile} appointments={appointments} recentChats={recentChats} docCount={docCount} />;
}
