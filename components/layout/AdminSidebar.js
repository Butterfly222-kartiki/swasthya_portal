'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, LayoutDashboard, UserCheck, Users, Calendar, Bell, LogOut, HeartPulse, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/admin',                icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/doctors',        icon: UserCheck,       label: 'Doctor Verification' },
  { href: '/admin/patients',       icon: Users,           label: 'Patients' },
  { href: '/admin/appointments',   icon: Calendar,        label: 'Appointments' },
  { href: '/admin/notifications',  icon: Bell,            label: 'Notifications' },
];

export default function AdminSidebar({ profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out');
    router.push('/');
  };

  const SidebarInner = () => (
    <>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#0d9488,#0f766e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HeartPulse size={20} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '0.95rem', color: 'white', lineHeight: 1 }}>Swasthya</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={9} color="#0d9488" />
              <span style={{ fontSize: '0.6rem', color: '#0d9488', fontWeight: 700, letterSpacing: 1.5 }}>ADMIN PANEL</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ margin: '1rem', padding: '0.875rem', background: 'rgba(13,148,136,0.1)', borderRadius: 12, border: '1px solid rgba(13,148,136,0.2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#0d9488,#0f766e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontFamily: 'DM Sans' }}>
            {profile?.full_name?.[0] || 'A'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'white' }}>{profile?.full_name || 'Admin'}</div>
            <div style={{ fontSize: '0.68rem', color: '#0d9488', fontWeight: 600 }}>System Administrator</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
              textDecoration: 'none', color: active ? '#0d9488' : 'rgba(255,255,255,0.7)',
              background: active ? 'rgba(13,148,136,0.12)' : 'transparent',
              borderLeft: active ? '3px solid #0d9488' : '3px solid transparent',
              fontWeight: active ? 600 : 400, fontSize: '0.875rem', transition: 'all 0.2s', minHeight: 44,
            }}>
              <item.icon size={17} /> {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: '#059669', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', minHeight: 44 }}>
          <LogOut size={17} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="admin-desktop-sidebar" style={{ position: 'fixed', top: 0, left: 0, width: 260, height: '100vh', background: '#0f2d2a', display: 'flex', flexDirection: 'column', zIndex: 40 }}>
        <SidebarInner />
      </aside>

      {/* Mobile top bar */}
      <header className="admin-mobile-topbar" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: '#0f2d2a', display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', zIndex: 50, paddingTop: 'env(safe-area-inset-top)' }}>
        <button onClick={() => setMobileOpen(true)} style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Menu size={20} color="white" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <HeartPulse size={18} color="#0d9488" />
          <span style={{ color: 'white', fontWeight: 800, fontFamily: 'DM Sans', fontSize: '1rem' }}>Admin Panel</span>
        </div>
        <div style={{ width: 40 }} />
      </header>

      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div onClick={() => setMobileOpen(false)} style={{ flex: 1, background: 'rgba(0,0,0,0.6)' }} />
          <aside style={{ width: 260, background: '#0f2d2a', height: '100%', display: 'flex', flexDirection: 'column', animation: 'slideInDrawer 0.28s ease-out' }}>
            <button onClick={() => setMobileOpen(false)} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={17} color="white" />
            </button>
            <SidebarInner />
          </aside>
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 768px) {
          .admin-desktop-sidebar { display: none !important; }
          .admin-mobile-topbar { display: flex !important; }
          .main-content {
            margin-left: 0 !important;
            padding-top: calc(56px + env(safe-area-inset-top) + 1rem) !important;
          }
        }
      `}</style>
    </>
  );
}
