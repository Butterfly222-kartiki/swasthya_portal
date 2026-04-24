import { requireAuth } from '@/lib/supabase/getUser';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
export default async function AdminLayout({ children }) {
  const { profile } = await requireAuth();
  if (profile?.role !== 'admin') redirect('/dashboard');
  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      <AdminSidebar profile={profile} />
      <main className="main-content">{children}</main>
    </div>
  );
}