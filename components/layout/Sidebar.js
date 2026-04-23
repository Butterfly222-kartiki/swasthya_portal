'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { supportedLanguages } from '@/lib/i18n';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  HeartPulse, LayoutDashboard, Calendar, MessageCircle,
  FileText, MapPin, Video, User, LogOut, Globe, X, Menu
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { href: '/appointments', icon: Calendar, labelKey: 'appointments' },
  { href: '/chat', icon: MessageCircle, labelKey: 'chat' },
  { href: '/documents', icon: FileText, labelKey: 'documents' },
  { href: '/pharmacy', icon: MapPin, labelKey: 'pharmacy' },
  { href: '/profile', icon: User, labelKey: 'profile' },
];

export default function Sidebar({ user, profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { t, language, changeLanguage } = useLanguage();
  const [showLang, setShowLang] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out');
    router.push('/');
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #f0e8d8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#f08000,#c66200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HeartPulse size={20} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '1rem', color: '#1a1a2e', lineHeight: 1 }}>Swasthya</div>
            <div style={{ fontSize: '0.6rem', color: '#f08000', fontWeight: 600, letterSpacing: 2 }}>PORTAL</div>
          </div>
        </div>
      </div>

      {/* User card */}
      {profile && (
        <div style={{ margin: '1rem', padding: '1rem', background: 'linear-gradient(135deg,#fff8f0,#fff)', borderRadius: 12, border: '1px solid #f0e8d8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#f08000,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1rem', fontFamily: 'Poppins', flexShrink: 0 }}>
              {profile.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.full_name}</div>
              <div style={{ fontSize: '0.75rem', color: '#f08000', fontWeight: 500 }}>
                {profile.role === 'doctor' ? `Dr. · ${profile.speciality || 'General'}` : t('patient')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <item.icon size={18} />
              <span style={{ fontSize: '0.9rem' }}>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid #f0e8d8', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Language */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowLang(!showLang)} className="nav-item" style={{ width: '100%', background: 'none', border: 'none' }}>
            <Globe size={18} />
            <span style={{ fontSize: '0.9rem', flex: 1, textAlign: 'left' }}>{supportedLanguages.find(l => l.code === language)?.label}</span>
          </button>
          {showLang && (
            <div style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, background: 'white', border: '1px solid #f0e8d8', borderRadius: 12, boxShadow: '0 -8px 24px rgba(0,0,0,0.12)', zIndex: 100 }}>
              {supportedLanguages.map(lang => (
                <button key={lang.code} onClick={() => { changeLanguage(lang.code); setShowLang(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: language === lang.code ? '#fff8f0' : 'white', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: language === lang.code ? '#f08000' : '#1a1a2e', fontWeight: language === lang.code ? 600 : 400 }}>
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', color: '#ef4444' }}>
          <LogOut size={18} />
          <span style={{ fontSize: '0.9rem' }}>{t('logout')}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        style={{ position: 'fixed', top: 12, left: 12, zIndex: 50, display: 'none', width: 40, height: 40, borderRadius: 10, background: 'white', border: '1px solid #f0e8d8', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        className="mobile-hamburger"
      >
        <Menu size={20} color="#1a1a2e" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
          <div onClick={() => setMobileOpen(false)} style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} />
          <aside style={{ width: 260, background: 'white', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 24px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#4a5568" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .mobile-hamburger { display: flex !important; }
          .main-content { margin-left: 0 !important; }
        }
      `}</style>
    </>
  );
}
