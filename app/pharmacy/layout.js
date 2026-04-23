import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
export default async function PharmacyLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar user={user} profile={profile} />
      <main className="main-content" style={{ flex: 1, padding: '2rem', paddingTop: '1.5rem' }}>{children}</main>
    </div>
  );
}
