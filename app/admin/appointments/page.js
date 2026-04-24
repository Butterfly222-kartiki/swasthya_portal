'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Search, Clock, User, Video, MessageCircle, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminAppointmentsPage() {
  const supabase = createClient();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: false })
      .order('time_slot', { ascending: false });
    setAppointments(data || []);
    setLoading(false);
  };

  const filtered = appointments.filter(apt => {
    const matchesSearch = 
      apt.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      apt.doctor_name?.toLowerCase().includes(search.toLowerCase()) ||
      apt.reason?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesType = typeFilter === 'all' || apt.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'video': return <Video size={14} color="#0f766e" />;
      case 'chat': return <MessageCircle size={14} color="#10b981" />;
      default: return <User size={14} color="#0d9488" />;
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'video': return 'Video Call';
      case 'chat': return 'Chat';
      default: return 'In-Person';
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '1.5rem', color: '#0f2d2a' }}>
          Appointments
        </h1>
        <p style={{ color: '#3d6b66', fontSize: '0.875rem', marginTop: 4 }}>
          View and manage all appointments
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total', value: stats.total, color: '#0f766e', icon: '📅' },
          { label: 'Confirmed', value: stats.confirmed, color: '#0d9488', icon: '✓' },
          { label: 'Completed', value: stats.completed, color: '#0f766e', icon: '✓✓' },
          { label: 'Cancelled', value: stats.cancelled, color: '#059669', icon: '✗' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 16, padding: '1.25rem', border: '1px solid #ccfbf1' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{stat.icon}</div>
            <div style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '1.75rem', color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ color: '#3d6b66', fontSize: '0.8rem', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 250 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient, doctor, or reason..."
            style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: 12, border: '1px solid #ccfbf1', fontSize: '0.875rem', outline: 'none' }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #ccfbf1', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
        >
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #ccfbf1', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
        >
          <option value="all">All Types</option>
          <option value="in-person">In-Person</option>
          <option value="video">Video Call</option>
          <option value="chat">Chat</option>
        </select>
      </div>

      {/* Appointments List */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #ccfbf1', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            Loading appointments...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            <Calendar size={48} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
            <p>{search || statusFilter !== 'all' || typeFilter !== 'all' ? 'No appointments found' : 'No appointments yet'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #ccfbf1' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#3d6b66', textTransform: 'uppercase', letterSpacing: 0.5 }}>Date & Time</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#3d6b66', textTransform: 'uppercase', letterSpacing: 0.5 }}>Patient</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#3d6b66', textTransform: 'uppercase', letterSpacing: 0.5 }}>Doctor</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#3d6b66', textTransform: 'uppercase', letterSpacing: 0.5 }}>Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#3d6b66', textTransform: 'uppercase', letterSpacing: 0.5 }}>Reason</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#3d6b66', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(apt => (
                  <tr key={apt.id} style={{ borderBottom: '1px solid #fafafa' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f2d2a' }}>
                        {format(new Date(apt.appointment_date + 'T00:00:00'), 'MMM d, yyyy')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Clock size={11} /> {apt.time_slot}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f2d2a' }}>
                        {apt.patient_name || 'Unknown'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f2d2a' }}>
                        Dr. {apt.doctor_name || 'Unknown'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                        {getTypeIcon(apt.type)}
                        {getTypeLabel(apt.type)}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#3d6b66', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {apt.reason || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge badge-${apt.status}`}>
                        {apt.status}
                      </span>
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
