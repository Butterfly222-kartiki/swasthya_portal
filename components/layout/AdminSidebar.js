'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, LayoutDashboard, UserCheck, Users, Calendar, Bell, LogOut, HeartPulse } from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/doctors', icon: UserCheck, label: 'Doctor Verification' },
  { href: '/admin/patients', icon: Users, label: 'Patients' },
  { href: '/admin/appointments', icon: Calendar, label: 'Appointments' },
  { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
];

export default function AdminSidebar({ profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out');
    router.push('/');
  };

  return (
    <aside style={{ position: 'fixed', top: 0, left: 0, width: 260, height: '100vh', background: '#1a1a2e', display: 'flex', flexDirection: 'column', zIndex: 40 }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#f08000,#c66200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HeartPulse size={20} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.95rem', color: 'white', lineHeight: 1 }}>Swasthya</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={9} color="#f08000" />
              <span style={{ fontSize: '0.6rem', color: '#f08000', fontWeight: 700, letterSpacing: 1.5 }}>ADMIN PANEL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin info */}
      <div style={{ margin: '1rem', padding: '0.875rem', background: 'rgba(240,128,0,0.1)', borderRadius: 12, border: '1px solid rgba(240,128,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#f08000,#c66200)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontFamily: 'Poppins' }}>
            {profile?.full_name?.[0] || 'A'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'white' }}>{profile?.full_name || 'Admin'}</div>
            <div style={{ fontSize: '0.68rem', color: '#f08000', fontWeight: 600 }}>System Administrator</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
              textDecoration: 'none', color: active ? '#f08000' : 'rgba(255,255,255,0.7)',
              background: active ? 'rgba(240,128,0,0.12)' : 'transparent',
              borderLeft: active ? '3px solid #f08000' : '3px solid transparent',
              fontWeight: active ? 600 : 400, fontSize: '0.875rem', transition: 'all 0.2s',
            }}>
              <item.icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
          <LogOut size={17} /> Logout
        </button>
      </div>
    </aside>
  );
}
