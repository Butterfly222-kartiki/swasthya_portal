import { requireAuth } from '@/lib/supabase/getUser';
import Sidebar from '@/components/layout/Sidebar';
export default async function Layout({ children }) {
  const { user, profile } = await requireAuth();
  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      <Sidebar user={user} profile={profile} />
      <main className="main-content">{children}</main>
    </div>
  );
}
