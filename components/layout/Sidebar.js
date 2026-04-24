'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HeartPulse, LayoutDashboard, Calendar, MessageCircle,
  FileText, MapPin, Video, User, LogOut, Globe, X, Menu,
  Bell, Stethoscope, Users, ClipboardList, Shield, ChevronRight,
} from 'lucide-react';

const patientNav = [
  { href: '/dashboard',     icon: LayoutDashboard, key: 'dashboard' },
  { href: '/appointments',  icon: Calendar,        key: 'appointments' },
  { href: '/chat',          icon: MessageCircle,   key: 'chat' },
  { href: '/video',         icon: Video,           key: 'video' },
  { href: '/documents',     icon: FileText,        key: 'documents' },
  { href: '/pharmacy',      icon: MapPin,          key: 'pharmacy' },
  { href: '/profile',       icon: User,            key: 'profile' },
];

const doctorNav = [
  { href: '/dashboard',          icon: LayoutDashboard, key: 'dashboard' },
  { href: '/doctor/patients',    icon: Users,           key: 'my_patients' },
  { href: '/chat',               icon: MessageCircle,   key: 'chat' },
  { href: '/video',              icon: Video,           key: 'video' },
  { href: '/doctor/availability',icon: ClipboardList,   key: 'my_availability' },
  { href: '/profile',            icon: User,            key: 'profile' },
];

// Bottom nav items (max 5 for mobile)
const patientBottomNav = [
  { href: '/dashboard',    icon: LayoutDashboard, key: 'dashboard' },
  { href: '/appointments', icon: Calendar,        key: 'appointments' },
  { href: '/chat',         icon: MessageCircle,   key: 'chat' },
  { href: '/documents',    icon: FileText,        key: 'documents' },
  { href: '/profile',      icon: User,            key: 'profile' },
];

const doctorBottomNav = [
  { href: '/dashboard',           icon: LayoutDashboard, key: 'dashboard' },
  { href: '/doctor/patients',     icon: Users,           key: 'my_patients' },
  { href: '/chat',                icon: MessageCircle,   key: 'chat' },
  { href: '/video',               icon: Video,           key: 'video' },
  { href: '/profile',             icon: User,            key: 'profile' },
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
  const bottomNavItems = profile?.role === 'doctor' ? doctorBottomNav : patientBottomNav;

  useEffect(() => {
    if (!user?.id) return;
    loadNotifications();
    const channel = supabase.channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnread(n => n + 1);
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

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const SidebarInner = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #ccfbf1', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#0d9488,#0f766e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}>
            <HeartPulse size={20} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '1rem', color: '#0f2d2a', lineHeight: 1 }}>Swasthya</div>
            <div style={{ fontSize: '0.58rem', color: '#0d9488', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Portal</div>
          </div>
        </div>
      </div>

      {/* User card */}
      {profile && (
        <div style={{ margin: '0.75rem', padding: '0.875rem', background: 'linear-gradient(135deg,#f0fdfa,#e6fdf9)', borderRadius: 12, border: '1px solid #ccfbf1', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: profile.role === 'doctor' ? 'linear-gradient(135deg,#0f766e,#059669)' : 'linear-gradient(135deg,#0d9488,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem', fontFamily: 'DM Sans', flexShrink: 0 }}>
              {profile.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f2d2a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.role === 'doctor' ? 'Dr. ' : ''}{profile.full_name}
              </div>
              <div style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                {profile.role === 'doctor' ? (
                  <>
                    <Stethoscope size={9} color="#0f766e" />
                    <span style={{ color: '#0f766e', fontWeight: 600 }}>{profile.speciality || 'Doctor'}</span>
                    {profile.verification_status === 'approved'
                      ? <span style={{ background: '#ecfdf5', color: '#065f46', padding: '1px 5px', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700 }}>✓ Verified</span>
                      : <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700 }}>Pending</span>
                    }
                  </>
                ) : (
                  <span style={{ color: '#0d9488', fontWeight: 600 }}>Patient</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.25rem 0.625rem', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              onClick={() => speak(t(item.key))}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                textDecoration: 'none', color: active ? '#0d9488' : '#3d6b66',
                background: active ? 'rgba(13,148,136,0.09)' : 'transparent',
                borderLeft: `3px solid ${active ? '#0d9488' : 'transparent'}`,
                fontWeight: active ? 700 : 500, fontSize: '0.875rem', transition: 'all 0.15s',
                minHeight: 44,
              }}
            >
              <item.icon size={17} />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: '0.625rem', borderTop: '1px solid #ccfbf1', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotif(!showNotif)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#3d6b66', fontSize: '0.875rem', justifyContent: 'space-between', minHeight: 44 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={17} /><span>{t('notifications')}</span>
            </div>
            {unread > 0 && (
              <span style={{ background: '#059669', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotif && (
            <div style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, background: 'white', border: '1px solid #ccfbf1', borderRadius: 14, boxShadow: '0 -8px 24px rgba(0,0,0,0.12)', zIndex: 200, maxHeight: 280, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #ccfbf1' }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f2d2a' }}>{t('notifications')}</span>
                {unread > 0 && <button onClick={markAllRead} style={{ fontSize: '0.7rem', color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{t('mark_read')}</button>}
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {notifications.length === 0
                  ? <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af', fontSize: '0.8rem' }}>{t('no_notifications')}</div>
                  : notifications.map((n, i) => (
                    <div key={i} style={{ padding: '10px 12px', borderBottom: '1px solid #fafafa', background: n.is_read ? 'white' : '#f0fdfa' }}>
                      <div style={{ fontWeight: n.is_read ? 400 : 700, fontSize: '0.8rem', color: '#0f2d2a' }}>{n.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#3d6b66', marginTop: 2 }}>{n.body}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* Language */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowLang(!showLang)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#3d6b66', fontSize: '0.875rem', minHeight: 44 }}>
            <Globe size={17} />
            <span>{supportedLanguages.find(l => l.code === language)?.flag} {supportedLanguages.find(l => l.code === language)?.label}</span>
          </button>
          {showLang && (
            <div style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, background: 'white', border: '1px solid #ccfbf1', borderRadius: 12, boxShadow: '0 -8px 24px rgba(0,0,0,0.12)', zIndex: 100 }}>
              {supportedLanguages.map(lang => (
                <button key={lang.code} onClick={() => { changeLanguage(lang.code); setShowLang(false); speak('Language changed'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', background: language === lang.code ? '#f0fdfa' : 'white', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: language === lang.code ? '#0d9488' : '#0f2d2a', fontWeight: language === lang.code ? 700 : 400, minHeight: 44 }}>
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#059669', fontSize: '0.875rem', fontWeight: 600, minHeight: 44 }}>
          <LogOut size={17} /> {t('logout')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="desktop-sidebar" style={{ position: 'fixed', top: 0, left: 0, width: 248, height: '100vh', background: 'white', borderRight: '1px solid #ccfbf1', zIndex: 40, boxShadow: '2px 0 16px rgba(0,0,0,0.04)' }}>
        <SidebarInner />
      </aside>

      {/* ── MOBILE TOP BAR ── */}
      <header className="mobile-topbar" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 50,
        background: 'white', borderBottom: '1px solid #ccfbf1',
        display: 'none', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1rem',
        paddingTop: 'env(safe-area-inset-top)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      }}>
        <button onClick={() => setMobileOpen(true)} style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdfa', border: '1px solid #ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Menu size={20} color="#134e4a" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#0d9488,#0f766e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HeartPulse size={15} color="white" />
          </div>
          <span style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '1rem', color: '#0f2d2a' }}>Swasthya</span>
        </div>
        <button onClick={() => setShowNotif(!showNotif)} style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, background: '#f0fdfa', border: '1px solid #ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Bell size={18} color="#134e4a" />
          {unread > 0 && (
            <span style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, background: '#059669', borderRadius: '50%', fontSize: '0.6rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </header>

      {/* Mobile notification drawer */}
      {showNotif && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300 }} onClick={() => setShowNotif(false)}>
          <div style={{ position: 'absolute', top: 64, right: 12, width: 300, background: 'white', border: '1px solid #ccfbf1', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #ccfbf1', background: '#f0fdfa' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2d2a' }}>{t('notifications')}</span>
              {unread > 0 && <button onClick={markAllRead} style={{ fontSize: '0.72rem', color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Mark all read</button>}
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {notifications.length === 0
                ? <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '0.82rem' }}>{t('no_notifications')}</div>
                : notifications.map((n, i) => (
                  <div key={i} style={{ padding: '12px 14px', borderBottom: '1px solid #fafafa', background: n.is_read ? 'white' : '#f0fdfa' }}>
                    <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize: '0.82rem', color: '#0f2d2a' }}>{n.title}</div>
                    <div style={{ fontSize: '0.73rem', color: '#3d6b66', marginTop: 3 }}>{n.body}</div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div onClick={() => setMobileOpen(false)} style={{ flex: 1, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} />
          <aside style={{ width: 280, background: 'white', height: '100%', boxShadow: '4px 0 32px rgba(0,0,0,0.15)', animation: 'slideInDrawer 0.28s ease-out', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <button onClick={() => setMobileOpen(false)} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 9, background: '#f0fdfa', border: '1px solid #ccfbf1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <X size={17} color="#3d6b66" />
            </button>
            <SidebarInner />
          </aside>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mobile-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'white',
        borderTop: '1px solid #ccfbf1',
        display: 'none',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {bottomNavItems.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                onClick={() => speak(t(item.key))}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '8px 4px 6px', textDecoration: 'none',
                  color: active ? '#0d9488' : '#7aa8a3',
                  gap: 4, position: 'relative', minHeight: 52,
                  transition: 'color 0.15s',
                }}
              >
                {active && (
                  <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 28, height: 3, borderRadius: '0 0 4px 4px', background: '#0d9488' }} />
                )}
                <span style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: active ? 'rgba(13,148,136,0.1)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}>
                  <item.icon size={18} />
                </span>
                <span style={{ fontSize: '0.6rem', fontFamily: 'DM Sans', fontWeight: active ? 700 : 500, lineHeight: 1 }}>
                  {t(item.key)?.split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <style jsx global>{`
        @keyframes slideInDrawer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }

        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar   { display: flex !important; }
          .mobile-bottom-nav { display: block !important; }
          .main-content {
            margin-left: 0 !important;
            padding: 0.875rem !important;
            padding-top: calc(56px + env(safe-area-inset-top) + 0.75rem) !important;
            padding-bottom: calc(60px + env(safe-area-inset-bottom) + 0.75rem) !important;
          }
        }
      `}</style>
    </>
  );
}