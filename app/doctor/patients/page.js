'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { Users, Search, MessageCircle, FileText, Pill, X, Plus, ChevronDown, ChevronUp, Loader, ClipboardList } from 'lucide-react';
import Link from 'next/link';

const MEDICINE_FREQ = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'As needed', 'Before meals', 'After meals', 'At bedtime'];

export default function DoctorPatientsPage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const [doctorId, setDoctorId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activePatient, setActivePatient] = useState(null);
  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'prescriptions' | 'notes'
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [consultNotes, setConsultNotes] = useState([]);
  const [medicalDocs, setMedicalDocs] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  // Prescription form
  const [rxForm, setRxForm] = useState({ medicine: '', dosage: '', frequency: 'Once daily', duration: '', notes: '' });
  const [rxSaving, setRxSaving] = useState(false);

  useEffect(() => { loadPatients(); }, []);

  const loadPatients = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setDoctorId(user.id);
    const { data: apts } = await supabase
      .from('appointments').select('patient_id, patient_name, appointment_date, reason, status')
      .eq('doctor_id', user.id).order('appointment_date', { ascending: false });

    const uniquePatients = {};
    (apts || []).forEach(apt => {
      if (!uniquePatients[apt.patient_id]) {
        uniquePatients[apt.patient_id] = { id: apt.patient_id, name: apt.patient_name, lastVisit: apt.appointment_date, lastReason: apt.reason, totalVisits: 1 };
      } else {
        uniquePatients[apt.patient_id].totalVisits++;
      }
    });
    const ids = Object.keys(uniquePatients);
    if (ids.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids);
      (profiles || []).forEach(p => { if (uniquePatients[p.id]) uniquePatients[p.id] = { ...uniquePatients[p.id], ...p }; });
    }
    setPatients(Object.values(uniquePatients));
    setLoading(false);
  };

  const openPatient = async (patient) => {
    setActivePatient(patient);
    setActiveTab('records');
    setDetailLoading(true);
    // Load appointments (records), prescriptions, consultation notes from correct tables
    const [aptRes, rxRes, notesRes, docsRes] = await Promise.all([
      supabase.from('appointments').select('*').eq('patient_id', patient.id).eq('doctor_id', doctorId).order('appointment_date', { ascending: false }),
      supabase.from('prescriptions').select('*').eq('patient_id', patient.id).eq('doctor_id', doctorId).order('created_at', { ascending: false }),
      supabase.from('consultation_notes').select('*').eq('patient_id', patient.id).eq('doctor_id', doctorId).order('updated_at', { ascending: false }),
      supabase.from('medical_documents').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }),
    ]);
    setRecords(aptRes.data || []);
    setPrescriptions(rxRes.data || []);
    setConsultNotes(notesRes.data || []);
    setMedicalDocs(docsRes.data || []);
    setDetailLoading(false);
  };

  const addPrescription = async () => {
    if (!rxForm.medicine.trim()) { return; }
    setRxSaving(true);
    const { error, data } = await supabase.from('prescriptions').insert({
      doctor_id: doctorId,
      patient_id: activePatient.id,
      medicine: rxForm.medicine.trim(),
      dosage: `${rxForm.dosage} — ${rxForm.frequency}`,
      duration: rxForm.duration,
      notes: rxForm.notes,
    }).select().single();
    if (!error) {
      setPrescriptions(prev => [data, ...prev]);
      setRxForm({ medicine: '', dosage: '', frequency: 'Once daily', duration: '', notes: '' });
    }
    setRxSaving(false);
  };

  const deletePrescription = async (id) => {
    await supabase.from('prescriptions').delete().eq('id', id);
    setPrescriptions(prev => prev.filter(r => r.id !== id));
  };

  const filtered = patients.filter(p =>
    (p.full_name || p.name)?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: 20, height: 'calc(100vh - 80px)' }}>
      {/* Patient list */}
      <div style={{ width: activePatient ? 280 : '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', transition: 'width 0.3s' }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '1.4rem', color: '#0f2d2a' }}>{t('my_patients')}</h1>
          <p style={{ color: '#3d6b66', fontSize: '0.8rem', marginTop: 2 }}>Select a patient to view records & prescriptions</p>
        </div>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..."
            style={{ width: '100%', padding: '9px 10px 9px 32px', borderRadius: 10, border: '1px solid #ccfbf1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 70, borderRadius: 12 }} />)
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <Users size={36} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
              <p style={{ fontSize: '0.82rem' }}>No patients yet</p>
            </div>
          ) : filtered.map(patient => {
            const isActive = activePatient?.id === patient.id;
            return (
              <button key={patient.id} onClick={() => openPatient(patient)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: isActive ? '#f0fdfa' : 'white', borderRadius: 12, border: `2px solid ${isActive ? '#0d9488' : '#ccfbf1'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontFamily: 'DM Sans', flexShrink: 0, fontSize: '0.9rem' }}>
                  {(patient.full_name || patient.name)?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#0f2d2a', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient.full_name || patient.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#3d6b66' }}>
                    {patient.age ? `${patient.age}y` : ''}{patient.gender ? ` · ${patient.gender}` : ''} · {patient.totalVisits} visit{patient.totalVisits !== 1 ? 's' : ''}
                  </div>
                </div>
                {isActive && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d9488', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Patient detail panel */}
      {activePatient && (
        <div style={{ flex: 1, background: 'white', borderRadius: 16, border: '1px solid #ccfbf1', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #ccfbf1', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontFamily: 'DM Sans', fontSize: '1.1rem' }}>
              {(activePatient.full_name || activePatient.name)?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#0f2d2a', fontSize: '1rem' }}>{activePatient.full_name || activePatient.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#3d6b66' }}>
                {activePatient.age ? `${activePatient.age} yrs` : ''}{activePatient.gender ? ` · ${activePatient.gender}` : ''}{activePatient.blood_group ? ` · ${activePatient.blood_group}` : ''}
                {activePatient.allergies && <span style={{ color: '#059669', fontWeight: 600 }}> · ⚠️ {activePatient.allergies}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/chat" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, background: '#ecfdf5', color: '#0d9488', fontWeight: 600, fontSize: '0.75rem', textDecoration: 'none' }}>
                <MessageCircle size={12} /> Chat
              </Link>
              <button onClick={() => setActivePatient(null)} style={{ padding: '7px', borderRadius: 9, border: '1px solid #ccfbf1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={14} color="#3d6b66" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #ccfbf1', background: '#fafafa' }}>
            {[
              { key: 'records', label: '📅 Appointments', icon: ClipboardList },
              { key: 'prescriptions', label: '💊 Prescriptions', icon: Pill },
              { key: 'medical', label: '📁 Medical Records', icon: FileText },
              { key: 'notes', label: '📝 Consult Notes', icon: FileText },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{ padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: activeTab === tab.key ? 700 : 400, color: activeTab === tab.key ? '#0d9488' : '#3d6b66', fontSize: '0.82rem', borderBottom: `2px solid ${activeTab === tab.key ? '#0d9488' : 'transparent'}`, transition: 'all 0.15s' }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
            {detailLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
                <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: '#0d9488' }} />
              </div>
            ) : activeTab === 'records' ? (
              <div>
                {records.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                    <ClipboardList size={32} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
                    <p style={{ fontSize: '0.82rem' }}>No appointment records yet</p>
                  </div>
                ) : records.map(r => (
                  <div key={r.id} style={{ padding: '12px 14px', background: '#fafafa', borderRadius: 12, border: '1px solid #ccfbf1', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#0d9488,#0f766e)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: 'white', fontFamily: 'DM Sans', fontWeight: 800, fontSize: '0.9rem', lineHeight: 1 }}>{new Date(r.appointment_date).getDate()}</span>
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.58rem' }}>{new Date(r.appointment_date).toLocaleString('default', { month: 'short' })}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f2d2a' }}>{r.time_slot}</div>
                        <div style={{ fontSize: '0.75rem', color: '#3d6b66', marginTop: 1 }}>{r.reason || 'General Consultation'}</div>
                        {r.notes && <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 3, fontStyle: 'italic' }}>{r.notes}</div>}
                      </div>
                      <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: 20, background: r.status === 'completed' ? '#ecfdf5' : r.status === 'confirmed' ? '#eff6ff' : '#ecfdf5', color: r.status === 'completed' ? '#065f46' : r.status === 'confirmed' ? '#1d4ed8' : '#991b1b', fontWeight: 700 }}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : activeTab === 'prescriptions' ? (
              <div>
                {/* Add prescription form */}
                <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
                  <div style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#0f2d2a', fontSize: '0.88rem', marginBottom: 12 }}>
                    ➕ New Prescription for {activePatient.full_name || activePatient.name}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#3d6b66', marginBottom: 3, display: 'block' }}>Medicine *</label>
                      <input className="input-field" style={{ fontSize: '0.82rem' }} value={rxForm.medicine} onChange={e => setRxForm(p => ({ ...p, medicine: e.target.value }))} placeholder="e.g. Paracetamol 500mg" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#3d6b66', marginBottom: 3, display: 'block' }}>Dosage</label>
                      <input className="input-field" style={{ fontSize: '0.82rem' }} value={rxForm.dosage} onChange={e => setRxForm(p => ({ ...p, dosage: e.target.value }))} placeholder="e.g. 1 tablet" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#3d6b66', marginBottom: 3, display: 'block' }}>Frequency</label>
                      <select className="input-field" style={{ fontSize: '0.82rem' }} value={rxForm.frequency} onChange={e => setRxForm(p => ({ ...p, frequency: e.target.value }))}>
                        {MEDICINE_FREQ.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#3d6b66', marginBottom: 3, display: 'block' }}>Duration</label>
                      <input className="input-field" style={{ fontSize: '0.82rem' }} value={rxForm.duration} onChange={e => setRxForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 5 days" />
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#3d6b66', marginBottom: 3, display: 'block' }}>Notes</label>
                    <input className="input-field" style={{ fontSize: '0.82rem' }} value={rxForm.notes} onChange={e => setRxForm(p => ({ ...p, notes: e.target.value }))} placeholder="Special instructions..." />
                  </div>
                  <button onClick={addPrescription} disabled={rxSaving || !rxForm.medicine.trim()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.82rem' }}>
                    {rxSaving ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />}
                    Add Prescription
                  </button>
                </div>

                {/* Prescription list */}
                {prescriptions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                    <Pill size={28} style={{ margin: '0 auto 8px', opacity: 0.2 }} />
                    <p style={{ fontSize: '0.82rem' }}>No prescriptions yet for this patient</p>
                  </div>
                ) : prescriptions.map(rx => (
                  <div key={rx.id} style={{ padding: '12px 14px', background: 'white', borderRadius: 12, border: '1px solid #ccfbf1', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#0f766e,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Pill size={15} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f2d2a' }}>{rx.medicine}</div>
                      <div style={{ fontSize: '0.75rem', color: '#3d6b66', marginTop: 2 }}>{rx.dosage}{rx.duration ? ` · ${rx.duration}` : ''}</div>
                      {rx.notes && <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2, fontStyle: 'italic' }}>{rx.notes}</div>}
                      <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 3 }}>{new Date(rx.created_at).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => deletePrescription(rx.id)} style={{ padding: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : activeTab === 'medical' ? (
              <div>
                {medicalDocs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                    <FileText size={32} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
                    <p style={{ fontSize: '0.82rem' }}>No medical records uploaded yet</p>
                    <p style={{ fontSize: '0.72rem', marginTop: 4 }}>Patient can upload records from the Documents section</p>
                  </div>
                ) : medicalDocs.map(doc => {
                  // Generate public URL if file_path exists but file_url doesn't
                  let viewUrl = doc.file_url;
                  if (!viewUrl && doc.file_path) {
                    const { data } = supabase.storage.from('medical-records').getPublicUrl(doc.file_path);
                    viewUrl = data?.publicUrl;
                  }
                  
                  return (
                    <div key={doc.id} style={{ padding: '12px 14px', background: 'white', borderRadius: 12, border: '1px solid #ccfbf1', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={15} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f2d2a' }}>{doc.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#3d6b66', marginTop: 2 }}>
                          {doc.doc_type || 'Document'}{doc.file_size ? ` · ${(doc.file_size / 1024).toFixed(0)} KB` : ''}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 2 }}>
                          Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {viewUrl ? (
                        <a href={viewUrl} target="_blank" rel="noopener noreferrer"
                          style={{ padding: '6px 12px', borderRadius: 8, background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '0.72rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                          📄 View
                        </a>
                      ) : (
                        <span style={{ padding: '6px 12px', borderRadius: 8, background: '#ecfdf5', color: '#991b1b', fontWeight: 600, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                          ⚠️ No file
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Consultation Notes */
              <div>
                {consultNotes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                    <FileText size={32} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
                    <p style={{ fontSize: '0.82rem' }}>No consultation notes yet</p>
                    <p style={{ fontSize: '0.72rem', marginTop: 4 }}>Notes taken during video calls appear here</p>
                  </div>
                ) : consultNotes.map((n, i) => {
                  const notesData = typeof n.notes === 'string' ? JSON.parse(n.notes) : n.notes;
                  return (
                  <div key={n.id} style={{ background: 'white', border: '1px solid #ccfbf1', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f2d2a' }}>Session {consultNotes.length - i}</div>
                      <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{new Date(n.updated_at).toLocaleString()}</div>
                    </div>
                    {notesData?.chiefComplaint && (
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d9488', marginBottom: 4 }}>
                        📋 {notesData.chiefComplaint}
                      </div>
                    )}
                    {notesData?.symptoms?.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#3d6b66', marginBottom: 4 }}>
                        <strong>Symptoms:</strong> {notesData.symptoms.join(', ')}
                      </div>
                    )}
                    {notesData?.severity && (
                      <div style={{ fontSize: '0.75rem', color: '#3d6b66', marginBottom: 4 }}>
                        <strong>Severity:</strong> {notesData.severity}{notesData?.duration && notesData.duration !== 'Not specified' ? ` · ${notesData.duration}` : ''}
                      </div>
                    )}
                    {notesData?.suggestedDiagnosis && (
                      <div style={{ fontSize: '0.75rem', color: '#065f46', marginBottom: 4 }}>
                        <strong>Diagnosis (AI):</strong> {notesData.suggestedDiagnosis}
                      </div>
                    )}
                    {notesData?.summary && (
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 6, fontStyle: 'italic', lineHeight: 1.5 }}>{notesData.summary}</div>
                    )}
                    {notesData?.redFlags?.length > 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: 4 }}>⚠️ {notesData.redFlags.join(', ')}</div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
