'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';
import { Calendar, ChevronLeft, ChevronRight, Clock, Stethoscope, CheckCircle, X } from 'lucide-react';

const TIME_SLOTS = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM'];

export default function AppointmentsPage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('book'); // 'book' | 'list'
  const [step, setStep] = useState(1); // 1=doctor, 2=date, 3=time, 4=confirm
  const [profile, setProfile] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile({ ...prof, id: user.id });

    const { data: docs } = await supabase.from('profiles').select('*').eq('role', 'doctor');
    setDoctors(docs || []);

    const { data: apts } = await supabase.from('appointments').select('*').or(`patient_id.eq.${user.id},doctor_id.eq.${user.id}`).order('appointment_date', { ascending: true });
    setAppointments(apts || []);
  };

  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      loadBookedSlots();
    }
  }, [selectedDate, selectedDoctor]);

  const loadBookedSlots = async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { data } = await supabase.from('appointments').select('time_slot').eq('doctor_id', selectedDoctor.id).eq('appointment_date', dateStr).neq('status', 'cancelled');
    setBookedSlots((data || []).map(a => a.time_slot));
  };

  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) return;
    setLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { error } = await supabase.from('appointments').insert({
      patient_id: profile.id,
      doctor_id: selectedDoctor.id,
      doctor_name: selectedDoctor.full_name,
      patient_name: profile.full_name,
      appointment_date: dateStr,
      time_slot: selectedSlot,
      reason: reason || 'General Consultation',
      status: 'confirmed',
      type: 'in-person',
    });
    if (error) {
      toast.error('Booking failed. Please try again.');
    } else {
      toast.success('Appointment booked successfully!');
      setStep(1); setSelectedDoctor(null); setSelectedDate(null); setSelectedSlot(null); setReason('');
      setView('list'); loadData();
    }
    setLoading(false);
  };

  const cancelAppointment = async (id) => {
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    if (!error) { toast.success('Appointment cancelled'); loadData(); }
  };

  // Calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = monthStart.getDay();
  const today = startOfDay(new Date());

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.5rem', color: '#1a1a2e' }}>{t('appointments')}</h1>
          <p style={{ color: '#4a5568', fontSize: '0.875rem', marginTop: 4 }}>Book and manage your consultations</p>
        </div>
        <div style={{ display: 'flex', gap: 8, background: '#f5f5f5', borderRadius: 12, padding: 4 }}>
          {['book', 'list'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', background: view === v ? 'white' : 'transparent', color: view === v ? '#f08000' : '#4a5568', boxShadow: view === v ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
              {v === 'book' ? t('book_appointment') : 'My Appointments'}
            </button>
          ))}
        </div>
      </div>

      {view === 'book' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Step progress */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'center' }}>
            {['Select Doctor', 'Pick Date', 'Choose Time', 'Confirm'].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: step > i + 1 ? '#10b981' : step === i + 1 ? '#f08000' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: step >= i + 1 ? 'white' : '#9ca3af', fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.3s' }}>
                  {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? '#f08000' : '#4a5568' }}>{s}</span>
                {i < 3 && <div style={{ width: 30, height: 2, background: step > i + 1 ? '#10b981' : '#e5e7eb', borderRadius: 2, transition: 'all 0.3s' }} />}
              </div>
            ))}
          </div>

          {/* Step 1: Doctor */}
          {step === 1 && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, marginBottom: 16, color: '#1a1a2e' }}>Select a Doctor</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {doctors.map(doc => (
                  <div key={doc.id} onClick={() => { setSelectedDoctor(doc); setStep(2); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, border: `2px solid ${selectedDoctor?.id === doc.id ? '#f08000' : '#f0e8d8'}`, cursor: 'pointer', transition: 'all 0.2s', background: selectedDoctor?.id === doc.id ? '#fff8f0' : 'white' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#f08000'}
                    onMouseLeave={e => { if (selectedDoctor?.id !== doc.id) e.currentTarget.style.borderColor = '#f0e8d8'; }}
                  >
                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontFamily: 'Poppins', fontSize: '1.1rem', flexShrink: 0 }}>
                      {doc.full_name?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontFamily: 'Poppins', color: '#1a1a2e' }}>Dr. {doc.full_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#4a5568', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Stethoscope size={12} /> {doc.speciality || 'General Physician'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginTop: 2 }}>⭐ 4.8 · Available Today</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Calendar */}
          {step === 2 && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e' }}>{t('select_date')}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #f0e8d8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={14} /></button>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', minWidth: 110, textAlign: 'center' }}>{format(currentMonth, 'MMMM yyyy')}</span>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #f0e8d8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={14} /></button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#4a5568', padding: '4px 0' }}>{d}</div>
                ))}
                {Array.from({ length: startDow }).map((_, i) => <div key={`e-${i}`} />)}
                {days.map(day => {
                  const past = isBefore(day, today);
                  const selected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, today);
                  return (
                    <div key={day.toISOString()} onClick={() => !past && setSelectedDate(day)}
                      className={`calendar-day ${past ? 'disabled' : ''} ${selected ? 'selected' : ''} ${isToday && !selected ? 'today' : ''}`}
                    >
                      {format(day, 'd')}
                    </div>
                  );
                })}
              </div>
              {selectedDate && (
                <button onClick={() => setStep(3)} className="btn-primary" style={{ width: '100%', marginTop: 12 }}>
                  Continue to Time →
                </button>
              )}
            </div>
          )}

          {/* Step 3: Time slots */}
          {step === 3 && (
            <div className="card">
              <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>{t('select_time')}</h3>
              <p style={{ color: '#4a5568', fontSize: '0.8rem', marginBottom: 16 }}>{selectedDate && format(selectedDate, 'EEEE, MMMM d')}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {TIME_SLOTS.map(slot => (
                  <div key={slot} onClick={() => !bookedSlots.includes(slot) && setSelectedSlot(slot)}
                    className={`time-slot ${bookedSlots.includes(slot) ? 'booked' : ''} ${selectedSlot === slot ? 'selected' : ''}`}
                  >
                    <Clock size={11} style={{ display: 'inline', marginRight: 4 }} />{slot}
                  </div>
                ))}
              </div>
              {selectedSlot && (
                <button onClick={() => setStep(4)} className="btn-primary" style={{ width: '100%' }}>
                  Continue →
                </button>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="card">
              <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>Confirm Appointment</h3>
              <div style={{ background: '#fafafa', borderRadius: 12, border: '1px solid #f0e8d8', padding: 16, marginBottom: 16 }}>
                {[
                  { label: 'Doctor', value: `Dr. ${selectedDoctor?.full_name}` },
                  { label: 'Speciality', value: selectedDoctor?.speciality || 'General Physician' },
                  { label: 'Date', value: selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy') },
                  { label: 'Time', value: selectedSlot },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0e8d8' }}>
                    <span style={{ color: '#4a5568', fontSize: '0.875rem' }}>{label}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a2e' }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: '#1a1a2e' }}>Reason for Visit</label>
                <textarea className="input-field" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Fever and headache for 3 days..." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(3)} className="btn-outline" style={{ flex: 1 }}>Back</button>
                <button onClick={handleBook} disabled={loading} className="btn-primary" style={{ flex: 2, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Booking...' : t('confirm_booking')}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Appointments list */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {appointments.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <Calendar size={48} style={{ margin: '0 auto 12px', opacity: 0.3, color: '#f08000' }} />
              <p style={{ color: '#4a5568' }}>No appointments yet</p>
              <button onClick={() => setView('book')} className="btn-primary" style={{ marginTop: 16 }}>{t('book_appointment')}</button>
            </div>
          ) : appointments.map(apt => (
            <div key={apt.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '1rem 1.5rem' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#f08000,#c66200)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 }}>{format(new Date(apt.appointment_date), 'd')}</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', fontWeight: 600 }}>{format(new Date(apt.appointment_date), 'MMM')}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1a1a2e' }}>Dr. {apt.doctor_name}</div>
                <div style={{ color: '#4a5568', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{apt.time_slot}</span>
                  <span>{apt.reason}</span>
                </div>
              </div>
              <div style={{ display: 'flex', align: 'center', gap: 10 }}>
                <span className={`badge badge-${apt.status}`}>{apt.status}</span>
                {apt.status === 'confirmed' && (
                  <button onClick={() => cancelAppointment(apt.id)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={12} color="#ef4444" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
