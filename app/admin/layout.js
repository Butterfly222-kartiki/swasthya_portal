import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default async function AdminLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar profile={profile} />
      <main style={{ flex: 1, marginLeft: 260, background: '#f8f9fa', padding: '2rem', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
