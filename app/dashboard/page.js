import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  // Fetch stats
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .or(`patient_id.eq.${user.id},doctor_id.eq.${user.id}`)
    .gte('appointment_date', new Date().toISOString().split('T')[0])
    .order('appointment_date', { ascending: true })
    .limit(5);

  const { data: recentChats } = await supabase
    .from('chat_rooms')
    .select('*, messages(content, created_at, sender_id)')
    .or(`patient_id.eq.${user.id},doctor_id.eq.${user.id}`)
    .order('updated_at', { ascending: false })
    .limit(3);

  const { count: docCount } = await supabase
    .from('medical_documents')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', user.id);

  return <DashboardClient profile={profile} appointments={appointments || []} recentChats={recentChats || []} docCount={docCount || 0} />;
}
