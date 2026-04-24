'use client';
import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    if (ios) {
      const dismissed = sessionStorage.getItem('pwa-ios-dismissed');
      if (!dismissed) {
        setTimeout(() => setShow(true), 3000);
      }
      return;
    }

    // Android / Chrome beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = sessionStorage.getItem('pwa-dismissed');
      if (!dismissed) setTimeout(() => setShow(true), 2500);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setInstalled(true); setShow(false); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) { setShowIOSGuide(true); return; }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem(isIOS ? 'pwa-ios-dismissed' : 'pwa-dismissed', '1');
  };

  if (installed || !show) return null;

  return (
    <>
      {/* Install Banner */}
      <div style={{
        position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom) + 72px)',
        left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 2rem)', maxWidth: 420,
        background: 'white', borderRadius: 20,
        boxShadow: '0 8px 40px rgba(13,148,136,0.22), 0 2px 8px rgba(0,0,0,0.1)',
        border: '1.5px solid #b2f0e8', zIndex: 9998,
        animation: 'slideUpBanner 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: '0.875rem',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: 'linear-gradient(135deg,#0d9488,#0f766e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(13,148,136,0.3)',
        }}>
          <Smartphone size={22} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '0.9rem', color: '#0f2d2a', lineHeight: 1.2 }}>
            Add Swasthya to Home Screen
          </div>
          <div style={{ fontSize: '0.72rem', color: '#3d6b66', marginTop: 2 }}>
            {isIOS ? 'Tap Share → Add to Home Screen' : 'Install for offline access & faster loads'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={handleInstall} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 14px', borderRadius: 10,
            background: 'linear-gradient(135deg,#0d9488,#0f766e)',
            color: 'white', border: 'none', cursor: 'pointer',
            fontFamily: 'DM Sans', fontWeight: 700, fontSize: '0.8rem',
            boxShadow: '0 2px 8px rgba(13,148,136,0.3)',
          }}>
            <Download size={13} /> Install
          </button>
          <button onClick={handleDismiss} style={{
            width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e2e8f0',
            background: 'white', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <X size={14} color="#94a3b8" />
          </button>
        </div>
      </div>

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 9999, display: 'flex', alignItems: 'flex-end',
        }} onClick={() => setShowIOSGuide(false)}>
          <div style={{
            background: 'white', borderRadius: '24px 24px 0 0', width: '100%',
            padding: '1.5rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom))',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e2e8f0', margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '1.1rem', color: '#0f2d2a', marginBottom: 4 }}>
              Install on iPhone
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#3d6b66', marginBottom: 20 }}>
              Follow these steps to add Swasthya to your home screen:
            </p>
            {[
              { step: '1', text: 'Tap the Share button', sub: '(box with arrow pointing up)' },
              { step: '2', text: 'Scroll down and tap', sub: '"Add to Home Screen"' },
              { step: '3', text: 'Tap "Add"', sub: 'in the top right corner' },
            ].map(({ step, text, sub }) => (
              <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#0d9488,#0f766e)',
                  color: 'white', fontFamily: 'DM Sans', fontWeight: 800,
                  fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{step}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2d2a' }}>{text}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sub}</div>
                </div>
              </div>
            ))}
            <button onClick={() => setShowIOSGuide(false)} style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: 'linear-gradient(135deg,#0d9488,#0f766e)',
              color: 'white', border: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1rem',
            }}>Got it!</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUpBanner {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
