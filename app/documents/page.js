'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FileText, Upload, Download, Eye, Trash2, Search, Filter, File, FileImage, FilePlus } from 'lucide-react';

const DOC_TYPES = ['All', 'Lab Report', 'Prescription', 'X-Ray / Scan', 'Discharge Summary', 'Insurance', 'Other'];

function getFileIcon(type) {
  if (type?.includes('image')) return <FileImage size={20} color="#4f46e5" />;
  if (type?.includes('pdf')) return <FileText size={20} color="#ef4444" />;
  return <File size={20} color="#f08000" />;
}

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function DocumentsPage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const [docs, setDocs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [drag, setDrag] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Lab Report');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile({ ...prof, id: user.id });
    const { data: documents } = await supabase.from('medical_documents').select('*').eq('patient_id', user.id).order('created_at', { ascending: false });
    setDocs(documents || []);
  };

  const handleUpload = async () => {
    if (!selectedFile || !docName.trim()) {
      toast.error('Please select a file and enter a name');
      return;
    }
    setUploading(true);
    try {
      const ext = selectedFile.name.split('.').pop();
      const path = `${profile.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('medical-records').upload(path, selectedFile);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('medical-records').getPublicUrl(path);
      const { error: dbErr } = await supabase.from('medical_documents').insert({
        patient_id: profile.id,
        name: docName,
        doc_type: docType,
        file_url: publicUrl,
        file_path: path,
        file_size: selectedFile.size,
        file_mime: selectedFile.type,
      });
      if (dbErr) throw dbErr;
      toast.success('Document uploaded successfully!');
      setSelectedFile(null); setDocName(''); loadData();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    }
    setUploading(false);
  };

  const handleDelete = async (doc) => {
    if (!confirm('Delete this document?')) return;
    await supabase.storage.from('medical-records').remove([doc.file_path]);
    await supabase.from('medical_documents').delete().eq('id', doc.id);
    toast.success('Deleted');
    loadData();
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) { setSelectedFile(file); setDocName(file.name.split('.').slice(0, -1).join('.')); }
  };

  const filtered = docs.filter(d => {
    const matchSearch = d.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || d.doc_type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 'clamp(1.2rem,3vw,1.5rem)', color: '#1a1a2e' }}>{t('medical_records_title')}</h1>
        <p style={{ color: '#4a5568', fontSize: '0.875rem', marginTop: 4 }}>{t('upload_document')} — {t('medical_records')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 28 }}>
        {/* Upload card */}
        <div className="card">
          <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FilePlus size={18} color="#f08000" /> {t('upload_document')}
          </h3>

          <div
            className={`upload-zone ${drag ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{ marginBottom: 16 }}
          >
            <Upload size={32} style={{ margin: '0 auto 10px', color: drag ? '#f08000' : '#9ca3af', display: 'block' }} />
            {selectedFile ? (
              <div>
                <p style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem' }}>{selectedFile.name}</p>
                <p style={{ color: '#4a5568', fontSize: '0.8rem', marginTop: 4 }}>{formatBytes(selectedFile.size)}</p>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem' }}>Drop files here or click to browse</p>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: 4 }}>PDF, JPG, PNG up to 10MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" hidden onChange={e => { const f = e.target.files[0]; if (f) { setSelectedFile(f); setDocName(f.name.split('.').slice(0,-1).join('.')); } }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#1a1a2e', marginBottom: 5 }}>{t('doc_name')}</label>
              <input className="input-field" value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Blood Test Report" />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#1a1a2e', marginBottom: 5 }}>{t('doc_type')}</label>
              <select className="input-field" value={docType} onChange={e => setDocType(e.target.value)}>
                {DOC_TYPES.filter(t => t !== 'All').map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <button onClick={handleUpload} disabled={uploading || !selectedFile} className="btn-primary" style={{ opacity: uploading || !selectedFile ? 0.6 : 1 }}>
              {uploading ? t('uploading') : t('upload_btn')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: t('total_docs'), value: docs.length, color: '#f08000' },
            { label: t('lab_reports'), value: docs.filter(d => d.doc_type === 'Lab Report').length, color: '#10b981' },
            { label: t('prescriptions_label'), value: docs.filter(d => d.doc_type === 'Prescription').length, color: '#4f46e5' },
            { label: t('scans'), value: docs.filter(d => d.doc_type === 'X-Ray / Scan').length, color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #f0e8d8', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#4a5568', fontSize: '0.875rem' }}>{s.label}</span>
              <span style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.5rem', color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search_docs')} style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10, border: '1px solid #f0e8d8', fontSize: '0.875rem', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DOC_TYPES.map(type => (
            <button key={type} onClick={() => setFilter(type)} style={{ padding: '6px 14px', borderRadius: 20, border: `2px solid ${filter === type ? '#f08000' : '#f0e8d8'}`, background: filter === type ? '#f08000' : 'white', color: filter === type ? 'white' : '#4a5568', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}>
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Documents grid */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={48} style={{ margin: '0 auto 12px', opacity: 0.2, color: '#f08000' }} />
          <p style={{ color: '#4a5568' }}>{t('no_docs')}</p>
          <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: 4 }}>{t('upload_first')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(doc => (
            <div key={doc.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {getFileIcon(doc.file_mime)}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: '0.7rem', background: '#fff8f0', color: '#f08000', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>{doc.doc_type}</span>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{formatBytes(doc.file_size)}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 4 }}>{doc.created_at ? format(new Date(doc.created_at), 'MMM d, yyyy') : '—'}</div>
                </div>
              </div>
              <div className="mandala-divider" style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={doc.file_url} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px', borderRadius: 8, background: '#f5f5f5', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.color = '#4f46e5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#4a5568'; }}
                >
                  <Eye size={13} /> {t('view')}
                </a>
                <a href={doc.file_url} download style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px', borderRadius: 8, background: '#ecfdf5', color: '#10b981', fontWeight: 600, fontSize: '0.75rem', textDecoration: 'none' }}>
                  <Download size={13} /> {t('download')}
                </a>
                <button onClick={() => handleDelete(doc)} style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
