'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, Mail, Phone, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPatientsPage() {
  const supabase = createClient();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient')
      .order('created_at', { ascending: false });
    setPatients(data || []);
    setLoading(false);
  };

  const filtered = patients.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '1.5rem', color: '#0f2d2a' }}>
          Patients
        </h1>
        <p style={{ color: '#3d6b66', fontSize: '0.875rem', marginTop: 4 }}>
          Manage all registered patients
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #ccfbf1' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🧑</div>
          <div style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '2rem', color: '#0d9488' }}>
            {patients.length}
          </div>
          <div style={{ color: '#3d6b66', fontSize: '0.85rem', marginTop: 4 }}>Total Patients</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: 12, border: '1px solid #ccfbf1', fontSize: '0.875rem', outline: 'none' }}
        />
      </div>

      {/* Patients List */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #ccfbf1', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            Loading patients...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            <Users size={48} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
            <p>{search ? 'No patients found' : 'No patients registered yet'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #ccfbf1' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#3d6b66', textTransform: 'uppercase', letterSpacing: 0.5 }}>Patient</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#3d6b66', textTransform: 'uppercase', letterSpacing: 0.5 }}>Contact</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#3d6b66', textTransform: 'uppercase', letterSpacing: 0.5 }}>Details</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#3d6b66', textTransform: 'uppercase', letterSpacing: 0.5 }}>Registered</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(patient => (
                  <tr key={patient.id} style={{ borderBottom: '1px solid #fafafa' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontFamily: 'DM Sans', fontSize: '0.95rem' }}>
                          {patient.full_name?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2d2a' }}>
                            {patient.full_name || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {patient.age ? `${patient.age} yrs` : ''} {patient.gender ? `· ${patient.gender}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Mail size={12} color="#6b7280" />
                          <span style={{ color: '#3d6b66' }}>{patient.email || '—'}</span>
                        </div>
                        {patient.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Phone size={12} color="#6b7280" />
                            <span style={{ color: '#3d6b66' }}>{patient.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#3d6b66' }}>
                        {patient.blood_group && (
                          <div style={{ marginBottom: 4 }}>
                            🩸 <strong>{patient.blood_group}</strong>
                          </div>
                        )}
                        {patient.city && (
                          <div>📍 {patient.city}</div>
                        )}
                        {!patient.blood_group && !patient.city && '—'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {patient.created_at ? format(new Date(patient.created_at), 'MMM d, yyyy') : '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
