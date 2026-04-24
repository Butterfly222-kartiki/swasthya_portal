'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ClipboardList, RefreshCw, AlertTriangle, ChevronDown, ChevronUp, Loader, Brain } from 'lucide-react';

export default function ConsultationNotes({ roomId, isDoctor, messages }) {
  const supabase = createClient();
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(isDoctor);
  const timerRef = useRef(null);

  // Auto-refresh notes every 30s during active consultation if doctor
  useEffect(() => {
    if (autoRefresh && messages?.length > 2) {
      generateNotes();
      timerRef.current = setInterval(() => {
        if (messages?.length > 2) generateNotes();
      }, 30000);
    }
    return () => clearInterval(timerRef.current);
  }, [autoRefresh, messages?.length]);

  // Regenerate when message count changes by 3+
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (!isDoctor) return;
    if (messages?.length >= prevCountRef.current + 3) {
      prevCountRef.current = messages.length;
      generateNotes();
    }
  }, [messages?.length]);

  const generateNotes = async () => {
    if (!roomId || !messages || messages.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch('/api/consultation-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, messages, language: 'en' }),
      });
      const data = await res.json();
      if (data.notes) {
        setNotes(data.notes);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Notes error:', err);
    }
    setLoading(false);
  };

  const loadExisting = async () => {
    if (!roomId) return;
    const res = await fetch(`/api/consultation-notes?roomId=${roomId}`);
    const data = await res.json();
    if (data.notes) {
      setNotes(data.notes);
      setLastUpdated(data.updatedAt ? new Date(data.updatedAt) : null);
    }
  };

  useEffect(() => { if (roomId) loadExisting(); }, [roomId]);

  const severityColor = {
    mild: '#0d9488', moderate: '#f59e0b', severe: '#059669'
  };

  if (!isDoctor && !notes) return null;

  return (
    <div style={{
      background: 'white', border: '1px solid #ccfbf1', borderRadius: 16,
      overflow: 'hidden', marginBottom: 12,
    }}>
      {/* Header */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '10px 14px', background: 'linear-gradient(135deg,#134e4a,#312e81)',
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        }}
      >
        <Brain size={15} color="#5eead4" />
        <span style={{ color: 'white', fontFamily: 'DM Sans', fontWeight: 700, fontSize: '0.82rem', flex: 1 }}>
          AI Consultation Notes
        </span>
        {loading && <Loader size={13} color="#5eead4" style={{ animation: 'spin 1s linear infinite' }} />}
        {isDoctor && !loading && (
          <button
            onClick={e => { e.stopPropagation(); generateNotes(); }}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Regenerate notes"
          >
            <RefreshCw size={11} color="white" />
          </button>
        )}
        {open ? <ChevronUp size={14} color="rgba(255,255,255,0.7)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.7)" />}
      </div>

      {open && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
          {!notes ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#9ca3af' }}>
              {isDoctor ? (
                <>
                  <Brain size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.8rem' }}>AI will generate notes as the conversation progresses</p>
                  {messages?.length >= 2 && (
                    <button onClick={generateNotes} style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, background: '#0f766e', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                      Generate Now
                    </button>
                  )}
                </>
              ) : (
                <p style={{ fontSize: '0.8rem' }}>Consultation notes will appear here</p>
              )}
            </div>
          ) : (
            <>
              {/* Chief complaint */}
              {notes.chiefComplaint && (
                <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '8px 12px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0d9488', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Chief Complaint</div>
                  <div style={{ fontWeight: 600, color: '#0f2d2a', fontSize: '0.82rem' }}>{notes.chiefComplaint}</div>
                </div>
              )}

              {/* Severity + Duration row */}
              <div style={{ display: 'flex', gap: 8 }}>
                {notes.severity && (
                  <div style={{ flex: 1, background: `${severityColor[notes.severity]}15`, border: `1px solid ${severityColor[notes.severity]}40`, borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: severityColor[notes.severity], textTransform: 'uppercase' }}>Severity</div>
                    <div style={{ fontWeight: 700, color: severityColor[notes.severity], fontSize: '0.8rem', textTransform: 'capitalize' }}>{notes.severity}</div>
                  </div>
                )}
                {notes.duration && notes.duration !== 'Not specified' && (
                  <div style={{ flex: 1, background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase' }}>Duration</div>
                    <div style={{ fontWeight: 700, color: '#0f766e', fontSize: '0.8rem' }}>{notes.duration}</div>
                  </div>
                )}
              </div>

              {/* Symptoms */}
              {notes.symptoms?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#3d6b66', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Symptoms</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {notes.symptoms.map((s, i) => (
                      <span key={i} style={{ padding: '2px 8px', borderRadius: 20, background: '#f5f5f5', fontSize: '0.72rem', color: '#0f2d2a', fontWeight: 500 }}>
                        • {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctor instructions */}
              {notes.doctorInstructions?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#3d6b66', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Instructions</div>
                  {notes.doctorInstructions.map((inst, i) => (
                    <div key={i} style={{ fontSize: '0.78rem', color: '#0f2d2a', padding: '3px 0', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <span style={{ color: '#0d9488', flexShrink: 0 }}>✓</span> {inst}
                    </div>
                  ))}
                </div>
              )}

              {/* Suggested diagnosis */}
              {notes.suggestedDiagnosis && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#065f46', marginBottom: 2, textTransform: 'uppercase' }}>Suggested Diagnosis (AI)</div>
                  <div style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600 }}>{notes.suggestedDiagnosis}</div>
                  <div style={{ fontSize: '0.65rem', color: '#6ee7b7', marginTop: 2 }}>⚠️ AI suggestion only — confirm with examination</div>
                </div>
              )}

              {/* Red flags */}
              {notes.redFlags?.length > 0 && (
                <div style={{ background: '#ecfdf5', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <AlertTriangle size={12} color="#ef4444" />
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Red Flags</div>
                  </div>
                  {notes.redFlags.map((f, i) => (
                    <div key={i} style={{ fontSize: '0.78rem', color: '#991b1b' }}>⚠️ {f}</div>
                  ))}
                </div>
              )}

              {/* Summary */}
              {notes.summary && (
                <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '8px 12px', borderLeft: '3px solid #0d9488' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0d9488', marginBottom: 3, textTransform: 'uppercase' }}>Summary</div>
                  <div style={{ fontSize: '0.78rem', color: '#3d6b66', lineHeight: 1.5 }}>{notes.summary}</div>
                </div>
              )}

              {lastUpdated && (
                <div style={{ fontSize: '0.62rem', color: '#9ca3af', textAlign: 'right' }}>
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </>
          )}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
