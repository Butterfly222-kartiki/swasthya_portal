import { requireAuth } from '@/lib/supabase/getUser';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const { user, profile } = await requireAuth();
  const supabase = createClient();

  const today = new Date().toISOString().split('T')[0];
  const col = profile?.role === 'doctor' ? 'doctor_id' : 'patient_id';

  const [
    { data: appointments },
    { data: recentChats },
    { count: docCount },
  ] = await Promise.all([
    supabase.from('appointments').select('*')
      .eq(col, user.id)
      .gte('appointment_date', today)
      .order('appointment_date', { ascending: true })
      .limit(10),
    supabase.from('chat_rooms')
      .select('id, updated_at, patient:profiles!chat_rooms_patient_id_fkey(full_name), doctor:profiles!chat_rooms_doctor_id_fkey(full_name)')
      .or(`patient_id.eq.${user.id},doctor_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })
      .limit(3),
    supabase.from('medical_documents')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', user.id),
  ]);

  return <DashboardClient profile={profile} appointments={appointments || []} recentChats={recentChats || []} docCount={docCount || 0} />;
}