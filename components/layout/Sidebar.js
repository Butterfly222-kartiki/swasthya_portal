'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HeartPulse, LayoutDashboard, Calendar, MessageCircle,
  FileText, MapPin, Video, User, LogOut, Globe, X, Menu,
  Bell, Stethoscope, Users, ClipboardList, Shield
} from 'lucide-react';

// Patient nav items
const patientNav = [
  { href: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/appointments', icon: Calendar, key: 'appointments' },
  { href: '/chat', icon: MessageCircle, key: 'chat' },
  { href: '/video', icon: Video, key: 'video' },
  { href: '/documents', icon: FileText, key: 'documents' },
  { href: '/pharmacy', icon: MapPin, key: 'pharmacy' },
  { href: '/profile', icon: User, key: 'profile' },
];

// Doctor nav items — different from patient
const doctorNav = [
  { href: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/doctor/patients', icon: Users, key: 'my_patients' },
  { href: '/chat', icon: MessageCircle, key: 'chat' },
  { href: '/video', icon: Video, key: 'video' },
  { href: '/doctor/availability', icon: ClipboardList, key: 'my_availability' },
  { href: '/profile', icon: User, key: 'profile' },
];

export default function Sidebar({ user, profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { t, language, changeLanguage, speak, supportedLanguages } = useLanguage();
  const [showLang, setShowLang] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [unread, setUnread] = useState(0);

  const navItems = profile?.role === 'doctor' ? doctorNav : patientNav;

  useEffect(() => {
    if (!user?.id) return;
    loadNotifications();
    // Subscribe to new notifications
    const channel = supabase.channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnread(n => n + 1);
        // Browser push notification
        if (Notification.permission === 'granted') {
          new Notification(payload.new.title, {
            body: payload.new.body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
          });
        }
        toast(payload.new.title, { icon: '🔔' });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('notifications').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(10);
    setNotifications(data || []);
    setUnread((data || []).filter(n => !n.is_read).length);
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const requestNotifPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  useEffect(() => { requestNotifPermission(); }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    speak(t('logout'));
    router.push('/');
    router.refresh();
  };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f0e8d8', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#f08000,#c66200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(240,128,0,0.3)' }}>
            <HeartPulse size={19} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e', lineHeight: 1 }}>Swasthya</div>
            <div style={{ fontSize: '0.58rem', color: '#f08000', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Portal</div>
          </div>
        </div>
      </div>

      {/* User card */}
      {profile && (
        <div style={{ margin: '0.75rem', padding: '0.875rem', background: 'linear-gradient(135deg,#fff8f0,#fef9f5)', borderRadius: 12, border: '1px solid #f0e8d8', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: profile.role === 'doctor' ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#f08000,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'Poppins', flexShrink: 0 }}>
              {profile.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.role === 'doctor' ? 'Dr. ' : ''}{profile.full_name}
              </div>
              <div style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                {profile.role === 'doctor' ? (
                  <>
                    <Stethoscope size={9} color="#4f46e5" />
                    <span style={{ color: '#4f46e5', fontWeight: 600 }}>{profile.speciality || 'Doctor'}</span>
                    {profile.verification_status === 'approved' ? (
                      <span style={{ background: '#ecfdf5', color: '#065f46', padding: '1px 5px', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700 }}>✓ Verified</span>
                    ) : (
                      <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700 }}>Pending</span>
                    )}
                  </>
                ) : (
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Patient</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0.25rem 0.625rem', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              onClick={() => { setMobileOpen(false); speak(t(item.key)); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10,
                textDecoration: 'none', color: active ? '#f08000' : '#4a5568',
                background: active ? 'rgba(240,128,0,0.08)' : 'transparent',
                borderLeft: `3px solid ${active ? '#f08000' : 'transparent'}`,
                fontWeight: active ? 700 : 400, fontSize: '0.875rem', transition: 'all 0.15s',
              }}
            >
              <item.icon size={17} />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: '0.625rem', borderTop: '1px solid #f0e8d8', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotif(!showNotif)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#4a5568', fontSize: '0.875rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={17} />
              <span>{t('notifications')}</span>
            </div>
            {unread > 0 && (
              <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotif && (
            <div style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, background: 'white', border: '1px solid #f0e8d8', borderRadius: 14, boxShadow: '0 -8px 24px rgba(0,0,0,0.12)', zIndex: 200, maxHeight: 280, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #f0e8d8' }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1a1a2e' }}>{t('notifications')}</span>
                {unread > 0 && <button onClick={markAllRead} style={{ fontSize: '0.7rem', color: '#f08000', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{t('mark_read')}</button>}
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af', fontSize: '0.8rem' }}>{t('no_notifications')}</div>
                ) : notifications.map((n, i) => (
                  <div key={i} style={{ padding: '10px 12px', borderBottom: '1px solid #fafafa', background: n.is_read ? 'white' : '#fff8f0' }}>
                    <div style={{ fontWeight: n.is_read ? 400 : 700, fontSize: '0.8rem', color: '#1a1a2e' }}>{n.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#4a5568', marginTop: 2 }}>{n.body}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Language switcher */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowLang(!showLang)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#4a5568', fontSize: '0.875rem' }}>
            <Globe size={17} />
            <span>{supportedLanguages.find(l => l.code === language)?.flag} {supportedLanguages.find(l => l.code === language)?.label}</span>
          </button>
          {showLang && (
            <div style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, background: 'white', border: '1px solid #f0e8d8', borderRadius: 12, boxShadow: '0 -8px 24px rgba(0,0,0,0.12)', zIndex: 100 }}>
              {supportedLanguages.map(lang => (
                <button key={lang.code} onClick={() => { changeLanguage(lang.code); setShowLang(false); speak('Language changed'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: language === lang.code ? '#fff8f0' : 'white', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: language === lang.code ? '#f08000' : '#1a1a2e', fontWeight: language === lang.code ? 700 : 400 }}>
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>
          <LogOut size={17} /> {t('logout')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside style={{ position: 'fixed', top: 0, left: 0, width: 245, height: '100vh', background: 'white', borderRight: '1px solid #f0e8d8', zIndex: 40, boxShadow: '2px 0 16px rgba(0,0,0,0.04)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)} id="hamburger-btn"
        style={{ position: 'fixed', top: 12, left: 12, zIndex: 50, width: 40, height: 40, borderRadius: 10, background: 'white', border: '1px solid #f0e8d8', display: 'none', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Menu size={20} color="#1a1a2e" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div onClick={() => setMobileOpen(false)} style={{ flex: 1, background: 'rgba(0,0,0,0.45)' }} />
          <aside style={{ width: 245, background: 'white', height: '100%', boxShadow: '4px 0 24px rgba(0,0,0,0.15)', position: 'relative' }}>
            <button onClick={() => setMobileOpen(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', zIndex: 1 }}>
              <X size={20} color="#4a5568" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          aside[style*="position: fixed"][style*="width: 245px"] { display: none !important; }
          #hamburger-btn { display: flex !important; }
          .main-content { margin-left: 0 !important; }
        }
      `}</style>
    </>
  );
}
