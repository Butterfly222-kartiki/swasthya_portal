'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { User, Save, Pill, FileText, RefreshCw, Video, Phone, Edit3 } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfilePage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [newPrescription, setNewPrescription] = useState({ medicine: '', dosage: '', duration: '', notes: '' });
  const [addingRx, setAddingRx] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile({ ...prof, id: user.id });
    const { data: rx } = await supabase.from('prescriptions').select('*, doctor:profiles!prescriptions_doctor_id_fkey(full_name)').or(`patient_id.eq.${user.id},doctor_id.eq.${user.id}`).order('created_at', { ascending: false });
    setPrescriptions(rx || []);
    const { data: fu } = await supabase.from('follow_ups').select('*, doctor:profiles!follow_ups_doctor_id_fkey(full_name)').or(`patient_id.eq.${user.id},doctor_id.eq.${user.id}`).order('follow_up_date', { ascending: true });
    setFollowUps(fu || []);
  };

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name,
      phone: profile.phone,
      city: profile.city,
      age: profile.age,
      gender: profile.gender,
      blood_group: profile.blood_group,
      address: profile.address,
      emergency_contact: profile.emergency_contact,
      allergies: profile.allergies,
      chronic_conditions: profile.chronic_conditions,
      speciality: profile.speciality,
    }).eq('id', profile.id);
    if (error) toast.error('Failed to save');
    else { toast.success('Profile updated!'); setEditing(false); }
    setSaving(false);
  };

  const addPrescription = async () => {
    if (!newPrescription.medicine) { toast.error('Enter medicine name'); return; }
    const { error } = await supabase.from('prescriptions').insert({
      doctor_id: profile.role === 'doctor' ? profile.id : null,
      patient_id: profile.role === 'patient' ? profile.id : null,
      medicine: newPrescription.medicine,
      dosage: newPrescription.dosage,
      duration: newPrescription.duration,
      notes: newPrescription.notes,
    });
    if (!error) { toast.success('Prescription added'); setNewPrescription({ medicine:'',dosage:'',duration:'',notes:'' }); setAddingRx(false); loadData(); }
  };

  if (!profile) return <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>Loading...</div>;

  const tabs = ['profile', 'prescriptions', 'followups'];

  return (
    <div className="animate-fade-in">
      {/* Profile header */}
      <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)', borderRadius: 20, padding: '2rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#f08000,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Poppins', fontWeight: 800, fontSize: '2rem', flexShrink: 0 }}>
          {profile.full_name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.5rem', color: 'white' }}>
            {profile.role === 'doctor' ? 'Dr. ' : ''}{profile.full_name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginTop: 4 }}>
            {profile.role === 'doctor' ? profile.speciality || 'General Physician' : 'Patient'} · {profile.email}
          </p>
          {profile.blood_group && (
            <span style={{ display: 'inline-block', marginTop: 8, padding: '3px 12px', borderRadius: 20, background: 'rgba(240,128,0,0.2)', border: '1px solid rgba(240,128,0,0.4)', color: '#ffbd5c', fontSize: '0.75rem', fontWeight: 700 }}>
              🩸 Blood Group: {profile.blood_group}
            </span>
          )}
        </div>
        <button onClick={() => setEditing(!editing)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.85rem' }}>
          <Edit3 size={14} /> Edit
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#f5f5f5', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 20 }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', background: activeTab === tab ? 'white' : 'transparent', color: activeTab === tab ? '#f08000' : '#4a5568', boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', textTransform: 'capitalize' }}>
            {tab === 'followups' ? 'Follow-Ups' : tab}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          <div className="card">
            <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>Personal Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Full Name', key: 'full_name', type: 'text' },
                { label: 'Phone', key: 'phone', type: 'tel' },
                { label: 'City', key: 'city', type: 'text' },
                { label: 'Age', key: 'age', type: 'number' },
                { label: 'Address', key: 'address', type: 'text' },
                { label: 'Emergency Contact', key: 'emergency_contact', type: 'tel' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4a5568', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{field.label}</label>
                  {editing ? (
                    <input className="input-field" type={field.type} value={profile[field.key] || ''} onChange={e => setProfile({ ...profile, [field.key]: e.target.value })} />
                  ) : (
                    <div style={{ color: '#1a1a2e', fontWeight: 500, fontSize: '0.9rem', padding: '8px 0', borderBottom: '1px solid #f0e8d8' }}>{profile[field.key] || '—'}</div>
                  )}
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4a5568', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Gender</label>
                {editing ? (
                  <select className="input-field" value={profile.gender || ''} onChange={e => setProfile({ ...profile, gender: e.target.value })}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                ) : <div style={{ color: '#1a1a2e', fontWeight: 500, fontSize: '0.9rem', padding: '8px 0', borderBottom: '1px solid #f0e8d8' }}>{profile.gender || '—'}</div>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4a5568', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Blood Group</label>
                {editing ? (
                  <select className="input-field" value={profile.blood_group || ''} onChange={e => setProfile({ ...profile, blood_group: e.target.value })}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                  </select>
                ) : <div style={{ color: '#1a1a2e', fontWeight: 500, fontSize: '0.9rem', padding: '8px 0', borderBottom: '1px solid #f0e8d8' }}>{profile.blood_group || '—'}</div>}
              </div>
            </div>
            {editing && (
              <button onClick={saveProfile} disabled={saving} className="btn-primary" style={{ width: '100%', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Save size={16} /> {saving ? 'Saving...' : t('save')}
              </button>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>Medical Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Known Allergies', key: 'allergies' },
                { label: 'Chronic Conditions', key: 'chronic_conditions' },
                ...(profile.role === 'doctor' ? [{ label: 'Speciality', key: 'speciality' }] : []),
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4a5568', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{field.label}</label>
                  {editing ? (
                    <textarea className="input-field" rows={2} value={profile[field.key] || ''} onChange={e => setProfile({ ...profile, [field.key]: e.target.value })} style={{ resize: 'vertical' }} />
                  ) : <div style={{ color: '#1a1a2e', fontWeight: 500, fontSize: '0.9rem', padding: '8px 0', borderBottom: '1px solid #f0e8d8' }}>{profile[field.key] || '—'}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prescriptions tab */}
      {activeTab === 'prescriptions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={() => setAddingRx(!addingRx)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Pill size={16} /> Add Prescription
            </button>
          </div>

          {addingRx && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h4 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>New Prescription</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Medicine Name *', key: 'medicine', placeholder: 'e.g. Paracetamol 500mg' },
                  { label: 'Dosage', key: 'dosage', placeholder: 'e.g. 1 tablet twice daily' },
                  { label: 'Duration', key: 'duration', placeholder: 'e.g. 5 days' },
                  { label: 'Notes', key: 'notes', placeholder: 'Additional instructions' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1a1a2e', marginBottom: 5 }}>{f.label}</label>
                    <input className="input-field" value={newPrescription[f.key]} onChange={e => setNewPrescription({ ...newPrescription, [f.key]: e.target.value })} placeholder={f.placeholder} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button onClick={() => setAddingRx(false)} className="btn-outline">Cancel</button>
                <button onClick={addPrescription} className="btn-primary">Save Prescription</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {prescriptions.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <Pill size={40} style={{ margin: '0 auto 12px', opacity: 0.2, color: '#f08000' }} />
                <p style={{ color: '#4a5568' }}>No prescriptions found</p>
              </div>
            ) : prescriptions.map(rx => (
              <div key={rx.id} className="prescription-card">
                <div className="prescription-header">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Pill size={18} color="#ffbd5c" />
                      <span style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{rx.medicine}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{rx.created_at ? format(new Date(rx.created_at), 'MMM d, yyyy') : '—'}</span>
                  </div>
                </div>
                <div style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                    {[
                      { label: 'Dosage', value: rx.dosage || '—' },
                      { label: 'Duration', value: rx.duration || '—' },
                      { label: 'Prescribed By', value: rx.doctor?.full_name ? `Dr. ${rx.doctor.full_name}` : '—' },
                    ].map(d => (
                      <div key={d.label}>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{d.label}</div>
                        <div style={{ fontWeight: 600, color: '#1a1a2e', marginTop: 2, fontSize: '0.875rem' }}>{d.value}</div>
                      </div>
                    ))}
                  </div>
                  {rx.notes && <div style={{ marginTop: 10, padding: '8px 12px', background: '#fafafa', borderRadius: 8, fontSize: '0.8rem', color: '#4a5568' }}>📝 {rx.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-ups tab */}
      {activeTab === 'followups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {followUps.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <RefreshCw size={40} style={{ margin: '0 auto 12px', opacity: 0.2, color: '#10b981' }} />
              <p style={{ color: '#4a5568' }}>No follow-ups scheduled</p>
            </div>
          ) : followUps.map(fu => (
            <div key={fu.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#10b981,#047857)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RefreshCw size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e' }}>Follow-up with Dr. {fu.doctor?.full_name}</div>
                <div style={{ fontSize: '0.8rem', color: '#4a5568', marginTop: 4 }}>{fu.follow_up_date ? format(new Date(fu.follow_up_date), 'EEEE, MMMM d, yyyy') : '—'} · {fu.notes || 'General check-up'}</div>
              </div>
              <span className={`badge badge-${fu.status || 'pending'}`}>{fu.status || 'Pending'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
