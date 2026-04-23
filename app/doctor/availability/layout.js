import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
export default async function Layout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'doctor') redirect('/dashboard');
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar user={user} profile={profile} />
      <main className="main-content" style={{ flex: 1, padding: '2rem', marginLeft: 245 }}>{children}</main>
    </div>
  );
}
