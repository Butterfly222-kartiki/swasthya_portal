'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfDay, isAfter, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { Calendar, ChevronLeft, ChevronRight, Clock, Stethoscope, CheckCircle, X, Video, MessageCircle, User } from 'lucide-react';

const TIME_SLOTS = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM'];

const APT_TYPE_ICONS = { video: Video, chat: MessageCircle, 'in-person': User };
const APT_TYPE_COLORS = { video: '#0f766e', chat: '#0d9488', 'in-person': '#0d9488' };

export default function AppointmentsPage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedType, setSelectedType] = useState('in-person');
  const [doctors, setDoctors] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'book' | 'list'
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState(null);
  const [reason, setReason] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'
  const [selectedCity, setSelectedCity] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  useEffect(() => { loadData(); }, []);

  // Auto-set patient's city when switching to in-person mode
  useEffect(() => {
    if (selectedType === 'in-person' && profile?.city && !selectedCity && doctors.length > 0) {
      // Check if there are doctors in patient's city
      const doctorsInCity = doctors.filter(doc => doc.city?.toLowerCase() === profile.city.toLowerCase());
      if (doctorsInCity.length > 0) {
        setSelectedCity(profile.city);
      }
    } else if (selectedType !== 'in-person') {
      setSelectedCity('');
    }
  }, [selectedType, profile, doctors]);

  useEffect(() => {
    // Filter doctors by city when city or doctors change
    // Only filter by city for in-person appointments
    if (selectedType === 'in-person' && selectedCity && doctors.length > 0) {
      setFilteredDoctors(doctors.filter(doc => doc.city?.toLowerCase() === selectedCity.toLowerCase()));
    } else {
      // Show all doctors for online consultations or when no city is selected
      setFilteredDoctors(doctors);
    }
  }, [selectedCity, doctors, selectedType]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const today = format(new Date(), 'yyyy-MM-dd');

    // Fetch profile + appointments in parallel
    const [
      { data: prof },
      { data: upApts },
      { data: pastApts },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('appointments').select('*')
        .eq('patient_id', user.id)
        .neq('status', 'cancelled')
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .order('time_slot', { ascending: true }),
      supabase.from('appointments').select('*')
        .eq('patient_id', user.id)
        .or(`appointment_date.lt.${today},status.eq.cancelled`)
        .order('appointment_date', { ascending: false })
        .limit(20),
    ]);

    const role = prof?.role;
    setProfile({ ...prof, id: user.id });

    // Use correct col for doctor role appointments
    if (role === 'doctor') {
      const [{ data: drUp }, { data: drPast }] = await Promise.all([
        supabase.from('appointments').select('*')
          .eq('doctor_id', user.id)
          .neq('status', 'cancelled')
          .gte('appointment_date', today)
          .order('appointment_date', { ascending: true })
          .order('time_slot', { ascending: true }),
        supabase.from('appointments').select('*')
          .eq('doctor_id', user.id)
          .or(`appointment_date.lt.${today},status.eq.cancelled`)
          .order('appointment_date', { ascending: false })
          .limit(20),
      ]);
      setUpcoming(drUp || []);
      setPast(drPast || []);
    } else {
      setUpcoming(upApts || []);
      setPast(pastApts || []);
    }

    if (role === 'patient') {
      const { data: docs } = await supabase.from('profiles').select('*').eq('role', 'doctor').eq('is_verified', true);
      if (docs && docs.length > 0) {
        setDoctors(docs);
      } else {
        const { data: allDocs } = await supabase.from('profiles').select('*').eq('role', 'doctor');
        setDoctors(allDocs || []);
      }
    }
  };

  useEffect(() => {
    if (selectedDate && selectedDoctor) loadBookedSlots();
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
      type: selectedType,
    });
    if (error) {
      toast.error('Booking failed. Please try again.');
    } else {
      toast.success('Appointment booked successfully!');
      setStep(1); setSelectedDoctor(null); setSelectedDate(null); setSelectedSlot(null); setReason(''); setSelectedType('in-person');
      setView('list'); setActiveTab('upcoming');
      loadData();
    }
    setLoading(false);
  };

  const cancelAppointment = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    if (!error) { toast.success('Appointment cancelled'); loadData(); }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = monthStart.getDay();
  const today = startOfDay(new Date());
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const AptCard = ({ apt, showCancel }) => {
    const Icon = APT_TYPE_ICONS[apt.type] || User;
    const color = APT_TYPE_COLORS[apt.type] || '#0d9488';
    const isToday = apt.appointment_date === todayStr;
    const otherParty = profile?.role === 'doctor'
      ? apt.patient_name
      : `Dr. ${apt.doctor_name}`;

    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '1rem 1.5rem', border: isToday ? '2px solid #0d9488' : '1px solid #ccfbf1', background: isToday ? '#f0fdfa' : 'white' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${color},${color}aa)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: 'white', fontFamily: 'DM Sans', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 }}>
            {format(new Date(apt.appointment_date + 'T00:00:00'), 'd')}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.6rem', fontWeight: 700 }}>
            {format(new Date(apt.appointment_date + 'T00:00:00'), 'MMM')}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#0f2d2a' }}>{otherParty}</div>
            {isToday && <span style={{ fontSize: '0.65rem', background: '#0d9488', color: 'white', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>TODAY</span>}
          </div>
          <div style={{ color: '#3d6b66', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{apt.time_slot}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color, fontWeight: 600 }}>
              <Icon size={11} />
              {apt.type === 'in-person' ? 'In-Person (Offline)' : apt.type === 'video' ? 'Video Call (Online)' : 'Chat (Online)'}
            </span>
            {apt.reason && <span style={{ color: '#6b7280' }}>{apt.reason}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {apt.type === 'video' && apt.status !== 'cancelled' && (
            <a href="/video" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, background: '#0f766e', color: 'white', fontWeight: 600, fontSize: '0.75rem', textDecoration: 'none' }}>
              <Video size={12} /> Join
            </a>
          )}
          <span className={`badge badge-${apt.status}`}>{apt.status}</span>
          {showCancel && apt.status === 'confirmed' && (
            <button onClick={() => cancelAppointment(apt.id)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={12} color="#ef4444" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: 'clamp(1.2rem,5vw,1.5rem)', color: '#0f2d2a' }}>{t('appointments')}</h1>
            <p style={{ color: '#3d6b66', fontSize: '0.85rem', marginTop: 4 }}>
              {profile?.role === 'doctor' ? 'Your patient appointments' : 'Book and manage your consultations'}
            </p>
          </div>
          {/* Only patients can book */}
          {profile?.role === 'patient' && (
            <div style={{ display: 'flex', gap: 6, background: '#f5f5f5', borderRadius: 12, padding: 4, flexShrink: 0 }}>
              {['list', 'book'].map(v => (
                <button key={v} onClick={() => setView(v)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', background: view === v ? 'white' : 'transparent', color: view === v ? '#0d9488' : '#3d6b66', boxShadow: view === v ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                  {v === 'book' ? 'Book Appointment' : 'My Appointments'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── LIST VIEW ─────────────────────────────────── */}
      {(view === 'list' || profile?.role === 'doctor') && (
        <div>
          {/* Upcoming / Past tabs */}
          <div style={{ display: 'flex', gap: 0, background: '#f5f5f5', borderRadius: 12, padding: 4, marginBottom: 20, width: 'fit-content' }}>
            {[
              { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
              { key: 'past', label: `Past / Cancelled (${past.length})` },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', background: activeTab === tab.key ? 'white' : 'transparent', color: activeTab === tab.key ? '#0d9488' : '#3d6b66', boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'upcoming' ? (
            upcoming.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <Calendar size={48} style={{ margin: '0 auto 12px', opacity: 0.3, color: '#0d9488' }} />
                <p style={{ color: '#3d6b66', fontFamily: 'DM Sans', fontWeight: 600 }}>No upcoming appointments</p>
                {profile?.role === 'patient' && (
                  <button onClick={() => setView('book')} className="btn-primary" style={{ marginTop: 16 }}>{t('book_appointment')}</button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcoming.map(apt => <AptCard key={apt.id} apt={apt} showCancel={true} />)}
              </div>
            )
          ) : (
            past.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <Calendar size={48} style={{ margin: '0 auto 12px', opacity: 0.3, color: '#9ca3af' }} />
                <p style={{ color: '#9ca3af' }}>No past appointments</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {past.map(apt => <AptCard key={apt.id} apt={apt} showCancel={false} />)}
              </div>
            )
          )}
        </div>
      )}

      {/* ── BOOK VIEW (patients only) ─────────────────── */}
      {view === 'book' && profile?.role === 'patient' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Step progress */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
            {['Select Doctor', 'Pick Date', 'Choose Time', 'Confirm'].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: step > i + 1 ? '#0d9488' : step === i + 1 ? '#0d9488' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: step >= i + 1 ? 'white' : '#9ca3af', fontWeight: 700, fontSize: '0.75rem', transition: 'all 0.3s' }}>
                  {step > i + 1 ? <CheckCircle size={13} /> : i + 1}
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? '#0d9488' : '#9ca3af', whiteSpace: 'nowrap' }}>{s}</span>
                {i < 3 && <div style={{ width: 20, height: 2, background: step > i + 1 ? '#0d9488' : '#e5e7eb', borderRadius: 2, flexShrink: 0 }} />}
              </div>
            ))}
          </div>

          {/* Step 1: Doctor + Type */}
          {step === 1 && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ fontFamily: 'DM Sans', fontWeight: 700, marginBottom: 12, color: '#0f2d2a' }}>Select a Doctor</h3>

              {/* Consultation Mode: Online / Offline */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#3d6b66', marginBottom: 8 }}>Consultation Mode</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 12 }}>
                  {[
                    { key: 'online', label: '🌐 Online Consultation', desc: 'Video or Chat' },
                    { key: 'offline', label: '🏥 In-Person Visit', desc: 'Visit clinic' }
                  ].map(({ key, label, desc }) => {
                    const isOnline = key === 'online';
                    const isSelected = isOnline ? ['video', 'chat'].includes(selectedType) : selectedType === 'in-person';
                    return (
                      <button 
                        key={key} 
                        onClick={() => setSelectedType(isOnline ? 'video' : 'in-person')} 
                        style={{ 
                          padding: '12px 14px', 
                          borderRadius: 12, 
                          border: `2px solid ${isSelected ? '#0d9488' : '#ccfbf1'}`, 
                          background: isSelected ? '#f0fdfa' : 'white', 
                          cursor: 'pointer', 
                          textAlign: 'left',
                          transition: 'all 0.15s' 
                        }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: isSelected ? '#0d9488' : '#0f2d2a', marginBottom: 2 }}>
                          {label}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{desc}</div>
                      </button>
                    );
                  })}
                </div>
                
                {/* If online is selected, show video/chat options */}
                {['video', 'chat'].includes(selectedType) && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3d6b66', marginBottom: 6 }}>Choose online method:</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { key: 'video', label: '🎥 Video Call', Icon: Video }, 
                        { key: 'chat', label: '💬 Chat', Icon: MessageCircle }
                      ].map(({ key, label }) => (
                        <button 
                          key={key} 
                          onClick={() => setSelectedType(key)} 
                          style={{ 
                            padding: '8px 14px', 
                            borderRadius: 9, 
                            border: `2px solid ${selectedType === key ? APT_TYPE_COLORS[key] : '#e5e7eb'}`, 
                            background: selectedType === key ? `${APT_TYPE_COLORS[key]}15` : 'white', 
                            cursor: 'pointer', 
                            fontWeight: selectedType === key ? 700 : 500, 
                            fontSize: '0.78rem', 
                            color: selectedType === key ? APT_TYPE_COLORS[key] : '#3d6b66', 
                            transition: 'all 0.15s' 
                          }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* City Filter - Only for in-person appointments */}
              {selectedType === 'in-person' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#3d6b66', marginBottom: 6 }}>
                    📍 Filter by City
                  </label>
                  <select 
                    className="input-field" 
                    value={selectedCity} 
                    onChange={e => setSelectedCity(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="">All Cities - Show All Doctors</option>
                    {[...new Set(doctors.map(d => d.city).filter(Boolean))].sort().map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {selectedCity ? (
                    <p style={{ fontSize: '0.72rem', color: '#0d9488', marginTop: 4 }}>
                      ✓ Showing doctors in <strong>{selectedCity}</strong>
                      {profile?.city === selectedCity && ' (your city)'}
                    </p>
                  ) : (
                    <p style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>
                      Showing all doctors. {profile?.city && `Your city: ${profile.city}`}
                    </p>
                  )}
                </div>
              )}

              {/* Doctor List */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#3d6b66', marginBottom: 8 }}>
                  Available Doctors {filteredDoctors.length > 0 && `(${filteredDoctors.length})`}
                </div>
                
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {filteredDoctors.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                      <Stethoscope size={32} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
                        {selectedCity ? `No doctors available in ${selectedCity}` : doctors.length === 0 ? 'No doctors registered yet' : 'No doctors available'}
                      </p>
                      {doctors.length === 0 ? (
                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          Please contact admin to add doctors to the system
                        </p>
                      ) : selectedCity ? (
                        <button 
                          onClick={() => setSelectedCity('')} 
                          style={{ marginTop: 10, padding: '6px 12px', borderRadius: 8, border: '1px solid #ccfbf1', background: 'white', cursor: 'pointer', fontSize: '0.75rem', color: '#0d9488' }}
                        >
                          View all doctors
                        </button>
                      ) : null}
                    </div>
                  ) : filteredDoctors.map(doc => (
                    <div 
                      key={doc.id} 
                      onClick={() => setSelectedDoctor(doc)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 14, 
                        padding: 16, 
                        borderRadius: 14, 
                        border: `2px solid ${selectedDoctor?.id === doc.id ? '#0d9488' : '#ccfbf1'}`, 
                        cursor: 'pointer', 
                        transition: 'all 0.2s', 
                        background: selectedDoctor?.id === doc.id ? '#f0fdfa' : 'white' 
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#0d9488'}
                      onMouseLeave={e => { if (selectedDoctor?.id !== doc.id) e.currentTarget.style.borderColor = '#ccfbf1'; }}
                    >
                      <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg,#0f766e,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontFamily: 'DM Sans', fontSize: '1.1rem', flexShrink: 0 }}>
                        {doc.full_name?.[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontFamily: 'DM Sans', color: '#0f2d2a' }}>Dr. {doc.full_name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#3d6b66', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Stethoscope size={12} /> {doc.speciality || 'General Physician'}
                        </div>
                        {doc.city && (
                          <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>
                            📍 {doc.city}
                          </div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: 600, marginTop: 2 }}>⭐ Available</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continue Button */}
              {selectedDoctor && (
                <button 
                  onClick={() => setStep(2)} 
                  className="btn-primary" 
                  style={{ width: '100%', marginTop: 12 }}
                >
                  Continue to Date Selection →
                </button>
              )}
            </div>
          )}

          {/* Step 2: Calendar */}
          {step === 2 && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#0f2d2a' }}>{t('select_date')}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #ccfbf1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={14} /></button>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', minWidth: 110, textAlign: 'center' }}>{format(currentMonth, 'MMMM yyyy')}</span>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #ccfbf1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={14} /></button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#3d6b66', padding: '4px 0' }}>{d}</div>
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
              <button onClick={() => setStep(1)} style={{ width: '100%', marginTop: 8, padding: '8px', borderRadius: 9, border: '1px solid #ccfbf1', background: 'white', cursor: 'pointer', fontSize: '0.82rem', color: '#3d6b66' }}>← Back</button>
            </div>
          )}

          {/* Step 3: Time slots */}
          {step === 3 && (
            <div className="card">
              <h3 style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#0f2d2a', marginBottom: 4 }}>{t('select_time')}</h3>
              <p style={{ color: '#3d6b66', fontSize: '0.8rem', marginBottom: 16 }}>{selectedDate && format(selectedDate, 'EEEE, MMMM d')}</p>
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
              <button onClick={() => setStep(2)} style={{ width: '100%', marginTop: 8, padding: '8px', borderRadius: 9, border: '1px solid #ccfbf1', background: 'white', cursor: 'pointer', fontSize: '0.82rem', color: '#3d6b66' }}>← Back</button>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="card">
              <h3 style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#0f2d2a', marginBottom: 16 }}>Confirm Appointment</h3>
              <div style={{ background: '#fafafa', borderRadius: 12, border: '1px solid #ccfbf1', padding: 16, marginBottom: 16 }}>
                {[
                  { label: 'Doctor', value: `Dr. ${selectedDoctor?.full_name}` },
                  { label: 'Speciality', value: selectedDoctor?.speciality || 'General Physician' },
                  { label: 'Date', value: selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy') },
                  { label: 'Time', value: selectedSlot },
                  { 
                    label: 'Mode', 
                    value: selectedType === 'in-person' 
                      ? '🏥 In-Person (Offline)' 
                      : selectedType === 'video' 
                        ? '🎥 Video Call (Online)' 
                        : '💬 Chat (Online)' 
                  },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ccfbf1' }}>
                    <span style={{ color: '#3d6b66', fontSize: '0.875rem' }}>{label}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f2d2a' }}>{value}</span>
                  </div>
                ))}
              </div>
              {selectedType === 'video' && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: '0.8rem', color: '#1e40af' }}>
                  📹 A private video room will be created automatically. Both you and your doctor will join from the <strong>Video</strong> page.
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: '#0f2d2a' }}>Reason for Visit</label>
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
      )}
    </div>
  );
}