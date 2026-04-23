'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import toast from 'react-hot-toast';
import { HeartPulse, Mail, Lock, User, Eye, EyeOff, Stethoscope } from 'lucide-react';

function RegisterForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [role, setRole] = useState(searchParams.get('role') || 'patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role, phone, speciality: role === 'doctor' ? speciality : null },
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
      // Insert profile
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: name,
          email,
          phone,
          role,
          speciality: role === 'doctor' ? speciality : null,
        });
      }
      toast.success('Account created! Please check your email to confirm.');
      router.push('/auth/login');
    }
    setLoading(false);
  };

  return (
    <div className="rangoli-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#f08000,#c66200)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <HeartPulse size={28} color="white" />
          </div>
          <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.5rem', color: '#1a1a2e' }}>{t('create_account')}</h1>
          <p style={{ color: '#4a5568', fontSize: '0.875rem', marginTop: 4 }}>{t('join_today')}</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {/* Role Toggle */}
          <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {['patient', 'doctor'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.9rem',
                  background: role === r ? 'white' : 'transparent',
                  color: role === r ? '#f08000' : '#4a5568',
                  boxShadow: role === r ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                {r === 'patient' ? <User size={15} /> : <Stethoscope size={15} />}
                {r === 'patient' ? t('patient') : t('doctor')}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#1a1a2e', marginBottom: 6 }}>{t('name')}</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input className="input-field" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder={role === 'doctor' ? 'Dr. Full Name' : 'Your Full Name'} style={{ paddingLeft: 38 }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#1a1a2e', marginBottom: 6 }}>{t('email')}</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={{ paddingLeft: 38 }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#1a1a2e', marginBottom: 6 }}>{t('phone')}</label>
              <input className="input-field" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>

            {role === 'doctor' && (
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#1a1a2e', marginBottom: 6 }}>{t('speciality')}</label>
                <select className="input-field" value={speciality} onChange={e => setSpeciality(e.target.value)} required={role === 'doctor'}>
                  <option value="">{t('select_speciality')}</option>
                  {['General Physician','Cardiologist','Dermatologist','Pediatrician','Gynecologist','Orthopedic','ENT Specialist','Ophthalmologist','Psychiatrist','Neurologist'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#1a1a2e', marginBottom: 6 }}>{t('password')}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input className="input-field" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 characters" minLength={8} style={{ paddingLeft: 38, paddingRight: 38 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', opacity: loading ? 0.7 : 1, marginTop: 8 }}>
              {loading ? t('loading') : t('create_account')}
            </button>
          </form>

          <div className="mandala-divider" style={{ margin: '20px 0' }} />
          <p style={{ textAlign: 'center', color: '#4a5568', fontSize: '0.875rem' }}>
            {t('already_have_account')}{' '}
            <Link href="/auth/login" style={{ color: '#f08000', fontWeight: 600, textDecoration: 'none' }}>{t('login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="rangoli-bg" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="skeleton" style={{width:400,height:500}} /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
