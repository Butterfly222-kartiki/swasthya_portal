'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye, Stethoscope, FileText, Search, Filter } from 'lucide-react';

export default function AdminDoctorsPage() {
  const supabase = createClient();
  const [doctors, setDoctors] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDoctors(); }, [filter]);

  const loadDoctors = async () => {
    setLoading(true);
    let q = supabase.from('profiles').select('*').eq('role', 'doctor').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('verification_status', filter);
    const { data } = await q;
    setDoctors(data || []);
    setLoading(false);
  };

  const updateStatus = async (doctorId, status) => {
    const { error } = await supabase.from('profiles').update({
      verification_status: status,
      is_verified: status === 'approved',
    }).eq('id', doctorId);

    if (error) { toast.error('Failed to update'); return; }

    // Send notification to doctor
    await supabase.from('notifications').insert({
      user_id: doctorId,
      title: status === 'approved' ? '✅ Account Verified!' : '❌ Verification Rejected',
      body: status === 'approved'
        ? 'Your doctor account has been verified. You can now accept patient appointments.'
        : 'Your verification was rejected. Please contact support for more information.',
      type: 'verification',
    });

    toast.success(`Doctor ${status === 'approved' ? 'verified' : 'rejected'}!`);
    loadDoctors();
    setSelected(null);
  };

  const filtered = doctors.filter(d =>
    d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.speciality?.toLowerCase().includes(search.toLowerCase()) ||
    d.license_number?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = { pending: '#92400e', approved: '#065f46', rejected: '#991b1b' };
  const statusBgs = { pending: '#fef3c7', approved: '#d1fae5', rejected: '#fee2e2' };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.5rem', color: '#1a1a2e' }}>Doctor Verification</h1>
        <p style={{ color: '#4a5568', fontSize: '0.875rem', marginTop: 4 }}>Review and verify doctor registrations</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pending','approved','rejected','all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'Poppins', background: filter === f ? '#f08000' : 'white', color: filter === f ? 'white' : '#4a5568', border: filter === f ? 'none' : '1px solid #e5e7eb', transition: 'all 0.2s', textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            style={{ padding: '8px 12px 8px 30px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: '0.85rem', outline: 'none', width: 200 }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 20 }}>
        {/* Doctor list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            Array.from({length:4}).map((_,i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: 16, border: '1px solid #f0e8d8', color: '#9ca3af' }}>
              <Stethoscope size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
              <p style={{ fontFamily: 'Poppins', fontWeight: 600 }}>No doctors found</p>
            </div>
          ) : filtered.map(doc => (
            <div key={doc.id} onClick={() => setSelected(doc)}
              style={{ background: 'white', borderRadius: 14, padding: '1.25rem', border: `2px solid ${selected?.id === doc.id ? '#f08000' : '#f0e8d8'}`, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.1rem', fontFamily: 'Poppins', flexShrink: 0 }}>
                {doc.full_name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e' }}>Dr. {doc.full_name}</div>
                <div style={{ fontSize: '0.8rem', color: '#4a5568', marginTop: 2 }}>
                  {doc.speciality} · License: {doc.license_number || 'N/A'} · {doc.years_experience ? `${doc.years_experience} yrs` : ''}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>
                  Registered: {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <span style={{ padding: '3px 10px', borderRadius: 20, background: statusBgs[doc.verification_status] || '#f5f5f5', color: statusColors[doc.verification_status] || '#4a5568', fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize' }}>
                  {doc.verification_status || 'pending'}
                </span>
                {doc.verification_status === 'pending' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={e => { e.stopPropagation(); updateStatus(doc.id, 'approved'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>
                      <CheckCircle size={12} /> Verify
                    </button>
                    <button onClick={e => { e.stopPropagation(); updateStatus(doc.id, 'rejected'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #f0e8d8', height: 'fit-content', position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e' }}>Doctor Details</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1.2rem' }}>×</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontFamily: 'Poppins', fontSize: '1.25rem' }}>
                {selected.full_name?.[0]}
              </div>
              <div>
                <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.1rem', color: '#1a1a2e' }}>Dr. {selected.full_name}</div>
                <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>{selected.email}</div>
              </div>
            </div>

            {[
              ['Speciality', selected.speciality],
              ['License Number', selected.license_number],
              ['Experience', selected.years_experience ? `${selected.years_experience} years` : 'N/A'],
              ['Phone', selected.phone],
              ['Address', selected.address],
            ].map(([label, value]) => value && (
              <div key={label} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #f0e8d8' }}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontWeight: 600, color: '#1a1a2e', marginTop: 2, fontSize: '0.875rem' }}>{value}</div>
              </div>
            ))}

            {/* Document links */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4a5568', marginBottom: 10, textTransform: 'uppercase' }}>Uploaded Documents</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selected.license_doc_url ? (
                  <a href={selected.license_doc_url} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#eef2ff', borderRadius: 10, textDecoration: 'none', color: '#4f46e5', fontWeight: 600, fontSize: '0.82rem' }}>
                    <FileText size={14} /> Medical License
                  </a>
                ) : <div style={{ color: '#9ca3af', fontSize: '0.8rem', padding: '8px 0' }}>No license uploaded</div>}
                {selected.certificate_url ? (
                  <a href={selected.certificate_url} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#ecfdf5', borderRadius: 10, textDecoration: 'none', color: '#10b981', fontWeight: 600, fontSize: '0.82rem' }}>
                    <FileText size={14} /> Degree Certificate
                  </a>
                ) : <div style={{ color: '#9ca3af', fontSize: '0.8rem', padding: '8px 0' }}>No certificate uploaded</div>}
              </div>
            </div>

            {selected.verification_status === 'pending' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => updateStatus(selected.id, 'approved')}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 10, background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.9rem' }}>
                  <CheckCircle size={16} /> Approve
                </button>
                <button onClick={() => updateStatus(selected.id, 'rejected')}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 10, background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.9rem' }}>
                  <XCircle size={16} /> Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
