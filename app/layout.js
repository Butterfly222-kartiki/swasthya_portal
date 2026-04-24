import './globals.css';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from '@/lib/LanguageContext';
import VoiceAssistantWrapper from '@/components/voice/VoiceAssistantWrapper';
import PWARegister from '@/components/pwa/PWARegister';
import InstallPrompt from '@/components/pwa/InstallPrompt';

export const metadata = {
  title: 'Swasthya Portal – Rural Telemedicine',
  description: 'Secure AI-powered telemedicine platform for rural India',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Swasthya' },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Swasthya" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />
        <meta name="msapplication-TileColor" content="#0d9488" />
      </head>
      <body>
        <LanguageProvider>
          {children}
          <VoiceAssistantWrapper />
          <InstallPrompt />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3500,
              style: { fontFamily: 'DM Sans, sans-serif', borderRadius: '12px', fontSize: '0.875rem' },
            }}
          />
        </LanguageProvider>
        <PWARegister />
      </body>
    </html>
  );
}
