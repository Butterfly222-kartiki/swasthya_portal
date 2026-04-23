'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const VoiceAssistant = dynamic(() => import('./VoiceAssistant'), { ssr: false });

export default function VoiceAssistantWrapper() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show on all authenticated pages, not on landing/auth
    const isAuth = pathname === '/' || pathname.startsWith('/auth/');
    setShow(!isAuth);
  }, [pathname]);

  if (!show) return null;
  return <VoiceAssistant />;
}
