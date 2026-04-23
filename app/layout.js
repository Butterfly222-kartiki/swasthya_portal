import './globals.css';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from '@/lib/LanguageContext';
import VoiceNavigator from '@/components/VoiceNavigator';

export const metadata = {
  title: 'Swasthya Portal - Rural Telemedicine',
  description: 'Secure telemedicine platform for rural India. Consult doctors, book appointments, manage records.',
  manifest: '/manifest.json',
  icons: {
    apple: '/icon-192.png',
    shortcut: '/icon-192.png',
  },
};

export const viewport = {
  themeColor: '#f08000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LanguageProvider>
          {children}
          <VoiceNavigator />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: 'Poppins, sans-serif',
                borderRadius: '12px',
                fontSize: '0.875rem',
                maxWidth: '90vw',
              },
            }}
          />
        </LanguageProvider>
      </body>
    </html>
  );
}
