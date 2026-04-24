'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Bell, Send, Users, UserCheck } from 'lucide-react';

export default function AdminNotificationsPage() {
  const supabase = createClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState([]);

  useEffect(() => { loadSent(); }, []);

  const loadSent = async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20);
    setSent(data || []);
  };

  const sendNotification = async () => {
    if (!title.trim() || !body.trim()) { toast.error('Fill title and message'); return; }
    setSending(true);
    let q = supabase.from('profiles').select('id');
    if (target === 'patients') q = q.eq('role', 'patient');
    else if (target === 'doctors') q = q.eq('role', 'doctor');
    const { data: users } = await q;

    const notifications = (users || []).map(u => ({
      user_id: u.id, title, body, type: 'broadcast', is_read: false,
    }));

    if (notifications.length > 0) {
      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) toast.error('Failed to send');
      else {
        toast.success(`Sent to ${notifications.length} users!`);
        setTitle(''); setBody('');
        loadSent();
      }
    } else toast.error('No users found');
    setSending(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '1.5rem', color: '#0f2d2a' }}>Send Notifications</h1>
        <p style={{ color: '#3d6b66', fontSize: '0.875rem', marginTop: 4 }}>Broadcast notifications to users via Chrome push</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #ccfbf1' }}>
          <h3 style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#0f2d2a', marginBottom: 16 }}>Compose Notification</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f2d2a', marginBottom: 6 }}>Send To</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['all','All Users'],['patients','Patients'],['doctors','Doctors']].map(([val,label]) => (
                  <button key={val} onClick={() => setTarget(val)}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${target === val ? '#0d9488' : '#ccfbf1'}`, background: target === val ? '#f0fdfa' : 'white', color: target === val ? '#0d9488' : '#3d6b66', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f2d2a', marginBottom: 6 }}>Title</label>
              <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f2d2a', marginBottom: 6 }}>Message</label>
              <textarea className="input-field" rows={3} value={body} onChange={e => setBody(e.target.value)} placeholder="Notification message..." style={{ resize: 'vertical' }} />
            </div>
            <button onClick={sendNotification} disabled={sending} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: sending ? 0.7 : 1 }}>
              <Send size={16} /> {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #ccfbf1', maxHeight: 500, overflow: 'auto' }}>
          <h3 style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#0f2d2a', marginBottom: 14 }}>Recent Notifications</h3>
          {sent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              <Bell size={32} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
              <p>No notifications sent yet</p>
            </div>
          ) : sent.map((n, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f2d2a' }}>{n.title}</div>
              <div style={{ fontSize: '0.78rem', color: '#3d6b66', marginTop: 2 }}>{n.body}</div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 4 }}>{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
