'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import toast from 'react-hot-toast';
import { Clock, Save, CheckCircle, ChevronLeft, ChevronRight, Calendar, Plus, Trash2 } from 'lucide-react';

const ALL_SLOTS = [
  '08:00 AM','08:30 AM','09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','01:00 PM','01:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM',
  '04:00 PM','04:30 PM','05:00 PM','05:30 PM','06:00 PM','06:30 PM','07:00 PM',
];

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getWeekDates(baseDate) {
  const d = new Date(baseDate);
  const day = d.getDay(); // 0=sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1); // start from Monday
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

function formatDate(date) {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

export default function AvailabilityPage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [weekBase, setWeekBase] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  // dayOverrides: { 'YYYY-MM-DD': { slots: [...], isOff: bool } }
  const [dayOverrides, setDayOverrides] = useState({});
  // Default weekly template: { 'Monday': [...slots], ... }
  const [weeklyDefaults, setWeeklyDefaults] = useState({});
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('calendar'); // 'calendar' | 'defaults'

  useEffect(() => {
    const dates = getWeekDates(weekBase);
    setWeekDates(dates);
    if (!selectedDate) setSelectedDate(formatDate(dates[0]));
  }, [weekBase]);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile({ ...prof, id: user.id });
    // Load weekly defaults from available_days + available_slots (legacy)
    const defaults = {};
    (prof?.available_days || ['Monday','Tuesday','Wednesday','Thursday','Friday']).forEach(day => {
      defaults[day] = prof?.available_slots || ALL_SLOTS.slice(0, 10);
    });
    setWeeklyDefaults(defaults);
    // Load day-specific overrides from doctor_availability table (if it exists)
    // We store overrides as JSON in a separate field - use available_slots as JSON map fallback
    try {
      const overrides = prof?.day_overrides ? JSON.parse(prof.day_overrides) : {};
      setDayOverrides(overrides);
    } catch { setDayOverrides({}); }
  };

  const selectedDateObj = selectedDate ? new Date(selectedDate + 'T12:00:00') : null;
  const selectedDayName = selectedDateObj ? DAYS_FULL[selectedDateObj.getDay()] : '';
  const isWeeklyEnabled = weeklyDefaults[selectedDayName];

  // Effective slots for selected date: override > weekly default > empty
  const getEffectiveSlots = (dateStr) => {
    if (dayOverrides[dateStr]?.isOff) return [];
    if (dayOverrides[dateStr]?.slots) return dayOverrides[dateStr].slots;
    const d = new Date(dateStr + 'T12:00:00');
    const dayName = DAYS_FULL[d.getDay()];
    return weeklyDefaults[dayName] || [];
  };

  const effectiveSlots = selectedDate ? getEffectiveSlots(selectedDate) : [];
  const hasOverride = selectedDate && dayOverrides[selectedDate] !== undefined;

  const toggleSlotForDay = (slot) => {
    if (!selectedDate) return;
    const current = effectiveSlots;
    const newSlots = current.includes(slot) ? current.filter(s => s !== slot) : [...current, slot].sort((a, b) => ALL_SLOTS.indexOf(a) - ALL_SLOTS.indexOf(b));
    setDayOverrides(prev => ({ ...prev, [selectedDate]: { slots: newSlots, isOff: false } }));
  };

  const markDayOff = () => {
    if (!selectedDate) return;
    setDayOverrides(prev => ({ ...prev, [selectedDate]: { slots: [], isOff: true } }));
  };

  const resetToDefault = () => {
    if (!selectedDate) return;
    setDayOverrides(prev => {
      const n = { ...prev };
      delete n[selectedDate];
      return n;
    });
  };

  const toggleWeeklyDay = (dayName) => {
    setWeeklyDefaults(prev => {
      const n = { ...prev };
      if (n[dayName]) delete n[dayName];
      else n[dayName] = ALL_SLOTS.slice(2, 12);
      return n;
    });
  };

  const toggleWeeklySlot = (dayName, slot) => {
    setWeeklyDefaults(prev => {
      const slots = prev[dayName] || [];
      const newSlots = slots.includes(slot) ? slots.filter(s => s !== slot) : [...slots, slot].sort((a, b) => ALL_SLOTS.indexOf(a) - ALL_SLOTS.indexOf(b));
      return { ...prev, [dayName]: newSlots };
    });
  };

  const save = async () => {
    setSaving(true);
    const availDays = Object.keys(weeklyDefaults);
    const allDefaultSlots = [...new Set(Object.values(weeklyDefaults).flat())].sort((a, b) => ALL_SLOTS.indexOf(a) - ALL_SLOTS.indexOf(b));
    const { error } = await supabase.from('profiles').update({
      available_slots: allDefaultSlots,
      available_days: availDays,
      day_overrides: JSON.stringify(dayOverrides),
    }).eq('id', profile.id);
    if (error) toast.error('Failed to save');
    else toast.success('Availability saved!');
    setSaving(false);
  };

  const today = formatDate(new Date());

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '1.5rem', color: '#0f2d2a' }}>{t('my_availability')}</h1>
          <p style={{ color: '#3d6b66', fontSize: '0.82rem', marginTop: 2 }}>Set default weekly hours + override specific dates</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setView('calendar')} style={{ padding: '8px 14px', borderRadius: 9, border: `2px solid ${view === 'calendar' ? '#0d9488' : '#ccfbf1'}`, background: view === 'calendar' ? '#f0fdfa' : 'white', color: view === 'calendar' ? '#0d9488' : '#3d6b66', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
            <Calendar size={13} style={{ display: 'inline', marginRight: 5 }} />Day Override
          </button>
          <button onClick={() => setView('defaults')} style={{ padding: '8px 14px', borderRadius: 9, border: `2px solid ${view === 'defaults' ? '#0d9488' : '#ccfbf1'}`, background: view === 'defaults' ? '#f0fdfa' : 'white', color: view === 'defaults' ? '#0d9488' : '#3d6b66', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
            <Clock size={13} style={{ display: 'inline', marginRight: 5 }} />Weekly Defaults
          </button>
          <button onClick={save} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.82rem' }}>
            <Save size={13} /> {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          {/* Calendar week view */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #ccfbf1', overflow: 'hidden' }}>
            {/* Week nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #ccfbf1' }}>
              <button onClick={() => setWeekBase(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })} style={{ padding: '6px', borderRadius: 8, border: '1px solid #ccfbf1', background: 'white', cursor: 'pointer', display: 'flex' }}>
                <ChevronLeft size={16} color="#3d6b66" />
              </button>
              <div style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#0f2d2a', fontSize: '0.9rem' }}>
                {weekDates[0] && weekDates[6] ? `${weekDates[0].toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
              </div>
              <button onClick={() => setWeekBase(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })} style={{ padding: '6px', borderRadius: 8, border: '1px solid #ccfbf1', background: 'white', cursor: 'pointer', display: 'flex' }}>
                <ChevronRight size={16} color="#3d6b66" />
              </button>
            </div>

            {/* Day columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #ccfbf1' }}>
              {weekDates.map((date, i) => {
                const dateStr = formatDate(date);
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === today;
                const slots = getEffectiveSlots(dateStr);
                const isOff = dayOverrides[dateStr]?.isOff;
                const hasOvr = dayOverrides[dateStr] !== undefined;
                return (
                  <button key={i} onClick={() => setSelectedDate(dateStr)}
                    style={{ padding: '12px 4px', border: 'none', borderRight: i < 6 ? '1px solid #ccfbf1' : 'none', background: isSelected ? '#f0fdfa' : 'white', cursor: 'pointer', borderBottom: `3px solid ${isSelected ? '#0d9488' : 'transparent'}`, transition: 'all 0.15s' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase' }}>{DAYS_SHORT[(i + 1) % 7]}</div>
                    <div style={{ fontFamily: 'DM Sans', fontWeight: isToday ? 800 : 600, fontSize: '1rem', color: isToday ? '#0d9488' : isSelected ? '#0d9488' : '#0f2d2a', background: isToday ? '#f0fdfa' : 'transparent', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px' }}>
                      {date.getDate()}
                    </div>
                    {isOff ? (
                      <div style={{ fontSize: '0.6rem', color: '#059669', fontWeight: 600 }}>OFF</div>
                    ) : slots.length > 0 ? (
                      <div style={{ fontSize: '0.6rem', color: hasOvr ? '#0f766e' : '#0d9488', fontWeight: 600 }}>{slots.length} slots{hasOvr ? ' *' : ''}</div>
                    ) : (
                      <div style={{ fontSize: '0.6rem', color: '#d1d5db' }}>Closed</div>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ padding: '10px 14px', background: '#fafafa', display: 'flex', gap: 16, fontSize: '0.68rem', color: '#6b7280' }}>
              <span><span style={{ color: '#0d9488', fontWeight: 700 }}>● </span>Default schedule</span>
              <span><span style={{ color: '#0f766e', fontWeight: 700 }}>● </span>Custom override (*)</span>
              <span><span style={{ color: '#059669', fontWeight: 700 }}>● </span>Day off</span>
            </div>
          </div>

          {/* Day detail */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #ccfbf1', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#0f2d2a', fontSize: '0.95rem' }}>
                {selectedDateObj ? selectedDateObj.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
              </div>
              {hasOverride && (
                <div style={{ fontSize: '0.7rem', color: '#0f766e', fontWeight: 600, marginTop: 2 }}>✏ Custom override active</div>
              )}
              {!hasOverride && isWeeklyEnabled && (
                <div style={{ fontSize: '0.7rem', color: '#0d9488', fontWeight: 600, marginTop: 2 }}>Using {selectedDayName} default</div>
              )}
              {!hasOverride && !isWeeklyEnabled && (
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>Closed by default</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={markDayOff} style={{ fontSize: '0.72rem', padding: '5px 10px', borderRadius: 8, border: '1px solid #fecaca', background: dayOverrides[selectedDate]?.isOff ? '#059669' : '#ecfdf5', color: dayOverrides[selectedDate]?.isOff ? 'white' : '#059669', fontWeight: 600, cursor: 'pointer' }}>
                Mark Day Off
              </button>
              {hasOverride && (
                <button onClick={resetToDefault} style={{ fontSize: '0.72rem', padding: '5px 10px', borderRadius: 8, border: '1px solid #ccfbf1', background: '#f9fafb', color: '#3d6b66', fontWeight: 600, cursor: 'pointer' }}>
                  Reset to Default
                </button>
              )}
            </div>

            {!dayOverrides[selectedDate]?.isOff && (
              <>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3d6b66', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Time Slots — click to toggle
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, maxHeight: 340, overflowY: 'auto' }}>
                  {ALL_SLOTS.map(slot => {
                    const active = effectiveSlots.includes(slot);
                    return (
                      <button key={slot} onClick={() => toggleSlotForDay(slot)}
                        style={{ padding: '7px 4px', borderRadius: 8, border: `2px solid ${active ? '#0d9488' : '#ccfbf1'}`, background: active ? '#0d9488' : 'white', color: active ? 'white' : '#3d6b66', fontWeight: active ? 700 : 400, fontSize: '0.72rem', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                        <Clock size={9} />{slot}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#9ca3af', textAlign: 'center' }}>
                  {effectiveSlots.length} slot{effectiveSlots.length !== 1 ? 's' : ''} selected
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Weekly Defaults View */
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #ccfbf1', padding: '1.5rem' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#0f2d2a', fontSize: '0.95rem' }}>Default Weekly Schedule</div>
            <p style={{ fontSize: '0.78rem', color: '#3d6b66', marginTop: 3 }}>These defaults apply when no day-specific override is set. You can override individual dates from the Day Override view.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {DAYS_FULL.map(day => {
              const enabled = !!weeklyDefaults[day];
              const slots = weeklyDefaults[day] || [];
              return (
                <div key={day} style={{ border: `2px solid ${enabled ? '#0d9488' : '#ccfbf1'}`, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: enabled ? '#f0fdfa' : '#fafafa', cursor: 'pointer' }} onClick={() => toggleWeeklyDay(day)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${enabled ? '#0d9488' : '#d1d5db'}`, background: enabled ? '#0d9488' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {enabled && <CheckCircle size={12} color="white" />}
                      </div>
                      <span style={{ fontWeight: enabled ? 700 : 400, color: enabled ? '#0d9488' : '#3d6b66', fontSize: '0.88rem' }}>{day}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: enabled ? '#0d9488' : '#9ca3af', fontWeight: 600 }}>
                      {enabled ? `${slots.length} slots` : 'Closed'}
                    </span>
                  </div>
                  {enabled && (
                    <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {ALL_SLOTS.map(slot => {
                        const active = slots.includes(slot);
                        return (
                          <button key={slot} onClick={() => toggleWeeklySlot(day, slot)}
                            style={{ padding: '5px 8px', borderRadius: 7, border: `1.5px solid ${active ? '#0d9488' : '#ccfbf1'}`, background: active ? '#0d9488' : 'white', color: active ? 'white' : '#3d6b66', fontWeight: active ? 700 : 400, fontSize: '0.68rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
