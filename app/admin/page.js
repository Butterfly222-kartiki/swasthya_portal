import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboard() {
  const supabase = createClient();

  const [
    { count: totalDoctors },
    { count: totalPatients },
    { count: pendingDoctors },
    { count: totalAppointments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'doctor'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'doctor').eq('verification_status', 'pending'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
  ]);

  const { data: recentDoctors } = await supabase
    .from('profiles').select('*').eq('role', 'doctor').eq('verification_status', 'pending')
    .order('created_at', { ascending: false }).limit(5);

  const stats = [
    { label: 'Total Doctors', value: totalDoctors || 0, color: '#0f766e', icon: '👨‍⚕️' },
    { label: 'Total Patients', value: totalPatients || 0, color: '#0d9488', icon: '🧑' },
    { label: 'Pending Verification', value: pendingDoctors || 0, color: '#0d9488', icon: '⏳', urgent: true },
    { label: 'Total Appointments', value: totalAppointments || 0, color: '#0f766e', icon: '📅' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '1.75rem', color: '#0f2d2a' }}>Admin Dashboard</h1>
        <p style={{ color: '#3d6b66', marginTop: 4 }}>Manage the Swasthya Portal platform</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: `1px solid ${s.urgent ? '#99f6e4' : '#ccfbf1'}`, boxShadow: s.urgent ? '0 4px 16px rgba(13,148,136,0.15)' : '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '2.2rem', color: s.color }}>{s.value}</div>
            <div style={{ color: '#3d6b66', fontSize: '0.85rem', marginTop: 4, fontWeight: s.urgent ? 700 : 400 }}>
              {s.label}{s.urgent && s.value > 0 ? ' ⚠️' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Pending doctors */}
      <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #ccfbf1' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.1rem', color: '#0f2d2a' }}>⏳ Doctors Awaiting Verification</h2>
          <a href="/admin/doctors" style={{ color: '#0d9488', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>View All →</a>
        </div>
        {!recentDoctors || recentDoctors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
            <p>All doctors are verified!</p>
          </div>
        ) : recentDoctors.map(doc => (
          <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#0f766e,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontFamily: 'DM Sans', flexShrink: 0 }}>
              {doc.full_name?.[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#0f2d2a' }}>Dr. {doc.full_name}</div>
              <div style={{ fontSize: '0.8rem', color: '#3d6b66' }}>{doc.speciality} · License: {doc.license_number || 'N/A'}</div>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: 20, background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: 700 }}>Pending</span>
            <a href="/admin/doctors" style={{ padding: '6px 14px', borderRadius: 8, background: '#0d9488', color: 'white', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>Review</a>
          </div>
        ))}
      </div>
    </div>
  );
}
