'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { supportedLanguages } from '@/lib/i18n';
import toast from 'react-hot-toast';
import { HeartPulse, Mail, Lock, User, Eye, EyeOff, Stethoscope, Globe, Upload, FileText, Volume2, Mic, MicOff, CheckCircle } from 'lucide-react';

const SPECIALITIES = ['General Physician','Cardiologist','Dermatologist','Pediatrician','Gynecologist','Orthopedic','ENT Specialist','Ophthalmologist','Psychiatrist','Neurologist','Diabetologist','Pulmonologist'];

function RegisterForm() {
  const { t, language, changeLanguage } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const recRef = useRef(null);

  const [role, setRole] = useState(searchParams.get('role') || 'patient');
  const [step, setStep] = useState(1);
  const [showLang, setShowLang] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [listening, setListening] = useState(false);

  // Form fields
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    age: '', gender: '', blood_group: '',
    speciality: '', license_number: '', years_experience: '',
    address: '', emergency_contact: '',
  });

  // Doctor document files
  const [licenseFile, setLicenseFile] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    window.speechSynthesis.speak(u);
  };

  const startVoice = (field, prompt) => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recRef.current = new SR();
    recRef.current.lang = 'en-IN';
    recRef.current.onresult = (e) => set(field, e.results[0][0].transcript);
    recRef.current.onend = () => setListening(false);
    recRef.current.start();
    setListening(true);
    speak(prompt || `Please say your ${field}`);
  };

  const uploadFile = async (file, folder) => {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('doctor-documents').upload(path, file);
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from('doctor-documents').getPublicUrl(path);
    return publicUrl;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { full_name: form.name, role, phone: form.phone },
        },
      });

      if (error) throw error;

      // Upload doctor documents
      let licenseUrl = null, certUrl = null, photoUrl = null;
      if (role === 'doctor') {
        licenseUrl = await uploadFile(licenseFile, 'licenses');
        certUrl = await uploadFile(certificateFile, 'certificates');
        photoUrl = await uploadFile(photoFile, 'photos');
      }

      // Insert profile
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: form.name,
        email: form.email.trim(),
        phone: form.phone,
        role,
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender,
        blood_group: form.blood_group,
        address: form.address,
        emergency_contact: form.emergency_contact,
        speciality: role === 'doctor' ? form.speciality : null,
        license_number: role === 'doctor' ? form.license_number : null,
        years_experience: role === 'doctor' ? parseInt(form.years_experience) : null,
        license_doc_url: licenseUrl,
        certificate_url: certUrl,
        photo_url: photoUrl,
        is_verified: role === 'patient', // patients auto-verified, doctors need admin approval
        verification_status: role === 'doctor' ? 'pending' : 'approved',
      });

      toast.success(role === 'doctor'
        ? '✅ Registration submitted! Admin will verify your documents within 24 hours.'
        : '✅ Account created! Please check your email to confirm.'
      );
      speak(role === 'doctor' ? 'Registration successful. Awaiting admin verification.' : 'Registration successful. Welcome to Swasthya Portal.');
      router.push('/auth/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    }
    setLoading(false);
  };

  const InputRow = ({ label, fieldKey, type = 'text', placeholder, required = false }) => (
    <div>
      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#1a1a2e', marginBottom: 5 }}>{label}{required && ' *'}</label>
      <div style={{ position: 'relative' }}>
        <input className="input-field" type={type} value={form[fieldKey]} onChange={e => set(fieldKey, e.target.value)} placeholder={placeholder} required={required} style={{ paddingRight: 40 }} />
        <button type="button" onClick={() => startVoice(fieldKey, `Say your ${label}`)}
          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 26, height: 26, borderRadius: '50%', border: 'none', background: '#f5f5f5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mic size={12} color="#4a5568" />
        </button>
      </div>
    </div>
  );

  const FileUpload = ({ label, file, setFile, accept = '.pdf,.jpg,.jpeg,.png', required = false }) => (
    <div>
      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#1a1a2e', marginBottom: 5 }}>{label}{required && ' *'}</label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `2px dashed ${file ? '#10b981' : '#f0e8d8'}`, borderRadius: 10, cursor: 'pointer', background: file ? '#ecfdf5' : '#fafafa', transition: 'all 0.2s' }}>
        <input type="file" accept={accept} hidden onChange={e => setFile(e.target.files[0])} required={required} />
        {file ? <CheckCircle size={16} color="#10b981" /> : <Upload size={16} color="#9ca3af" />}
        <span style={{ fontSize: '0.8rem', color: file ? '#065f46' : '#4a5568' }}>
          {file ? file.name : `Upload ${label} (PDF/JPG/PNG)`}
        </span>
      </label>
    </div>
  );

  const totalSteps = role === 'doctor' ? 3 : 2;

  return (
    <div className="rangoli-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#f08000,#c66200)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(240,128,0,0.3)' }}>
            <HeartPulse size={26} color="white" />
          </div>
          <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.4rem', color: '#1a1a2e' }}>Create Account</h1>
          <p style={{ color: '#4a5568', fontSize: '0.8rem', marginTop: 4 }}>Join Swasthya Portal — Healthcare for Bharat</p>
        </div>

        <div className="card" style={{ padding: '1.75rem' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowLang(!showLang)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: '1px solid #f0e8d8', background: '#fff8f0', cursor: 'pointer', fontSize: '0.78rem', color: '#f08000', fontWeight: 600 }}>
                <Globe size={12} />
                {supportedLanguages.find(l => l.code === language)?.flag} {supportedLanguages.find(l => l.code === language)?.label}
              </button>
              {showLang && (
                <div style={{ position: 'absolute', top: '110%', left: 0, background: 'white', border: '1px solid #f0e8d8', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 140 }}>
                  {supportedLanguages.map(lang => (
                    <button key={lang.code} onClick={() => { changeLanguage(lang.code); setShowLang(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: language === lang.code ? '#fff8f0' : 'white', border: 'none', cursor: 'pointer', fontSize: '0.82rem', color: language === lang.code ? '#f08000' : '#1a1a2e', fontWeight: language === lang.code ? 600 : 400 }}>
                      {lang.flag} {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => speak('Register as a patient or doctor. Fill in your details step by step. Doctors must upload their medical license and certificate for admin verification.')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, border: '1px solid #e0e7ff', background: '#eef2ff', cursor: 'pointer', fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600 }}>
              <Volume2 size={12} /> Voice Guide
            </button>
          </div>

          {/* Role selector */}
          <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: 12, padding: 4, marginBottom: 20 }}>
            {['patient', 'doctor'].map(r => (
              <button key={r} type="button" onClick={() => { setRole(r); setStep(1); }}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.88rem', background: role === r ? 'white' : 'transparent', color: role === r ? '#f08000' : '#4a5568', boxShadow: role === r ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                {r === 'patient' ? <User size={15} /> : <Stethoscope size={15} />}
                {r === 'patient' ? t('patient') : t('doctor')}
              </button>
            ))}
          </div>

          {/* Step progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: i < totalSteps - 1 ? 1 : 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: step > i + 1 ? '#10b981' : step === i + 1 ? '#f08000' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: step >= i + 1 ? 'white' : '#9ca3af', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                {i < totalSteps - 1 && <div style={{ flex: 1, height: 2, background: step > i + 1 ? '#10b981' : '#e5e7eb', borderRadius: 2 }} />}
              </div>
            ))}
            <span style={{ fontSize: '0.75rem', color: '#4a5568', marginLeft: 8 }}>Step {step} of {totalSteps}</span>
          </div>

          <form onSubmit={step < totalSteps ? (e) => { e.preventDefault(); setStep(s => s + 1); } : handleRegister}>

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem', margin: 0 }}>Personal Information</h3>
                <InputRow label="Full Name" fieldKey="name" placeholder={role === 'doctor' ? 'Dr. Full Name' : 'Your Full Name'} required />
                <InputRow label="Email" fieldKey="email" type="email" placeholder="you@example.com" required />
                <InputRow label="Phone Number" fieldKey="phone" type="tel" placeholder="+91 98765 43210" required />
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#1a1a2e', marginBottom: 5 }}>Password *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input className="input-field" type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} placeholder="Min. 8 characters" style={{ paddingLeft: 34, paddingRight: 40 }} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showPass ? <EyeOff size={14} color="#9ca3af" /> : <Eye size={14} color="#9ca3af" />}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#1a1a2e', marginBottom: 5 }}>Gender</label>
                    <select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                      <option value="">Select</option>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#1a1a2e', marginBottom: 5 }}>Blood Group</label>
                    <select className="input-field" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                      <option value="">Select</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Doctor Professional Info OR Patient Additional */}
            {step === 2 && role === 'doctor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem', margin: 0 }}>Professional Details</h3>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#1a1a2e', marginBottom: 5 }}>Speciality *</label>
                  <select className="input-field" value={form.speciality} onChange={e => set('speciality', e.target.value)} required>
                    <option value="">Select Speciality</option>
                    {SPECIALITIES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <InputRow label="Medical License Number" fieldKey="license_number" placeholder="e.g. MH-12345" required />
                <InputRow label="Years of Experience" fieldKey="years_experience" type="number" placeholder="e.g. 5" required />
                <InputRow label="Clinic / Hospital Address" fieldKey="address" placeholder="Full address" />
              </div>
            )}

            {/* Step 2 Patient: Address */}
            {step === 2 && role === 'patient' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem', margin: 0 }}>Additional Info</h3>
                <InputRow label="Age" fieldKey="age" type="number" placeholder="e.g. 32" />
                <InputRow label="Address" fieldKey="address" placeholder="Your full address" />
                <InputRow label="Emergency Contact" fieldKey="emergency_contact" type="tel" placeholder="+91 98765 43210" />
              </div>
            )}

            {/* Step 3: Doctor Documents */}
            {step === 3 && role === 'doctor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem', margin: 0 }}>Upload Documents</h3>
                <div style={{ background: '#fff8f0', border: '1px solid #ffd9a0', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', color: '#92400e' }}>
                  ⚠️ All documents will be reviewed by admin before your account is activated. This usually takes 24 hours.
                </div>
                <FileUpload label="Medical License" file={licenseFile} setFile={setLicenseFile} required />
                <FileUpload label="Degree Certificate" file={certificateFile} setFile={setCertificateFile} required />
                <FileUpload label="Profile Photo" file={photoFile} setFile={setPhotoFile} accept=".jpg,.jpeg,.png" />
              </div>
            )}

            {/* Navigation buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {step > 1 && (
                <button type="button" onClick={() => setStep(s => s - 1)} className="btn-outline" style={{ flex: 1, padding: '10px' }}>
                  ← Back
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, padding: '10px', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Creating account...' : step < totalSteps ? 'Continue →' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mandala-divider" style={{ margin: '18px 0' }} />
          <p style={{ textAlign: 'center', color: '#4a5568', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#f08000', fontWeight: 700, textDecoration: 'none' }}>{t('login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="rangoli-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="skeleton" style={{ width: 460, height: 600, borderRadius: 16 }} /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
