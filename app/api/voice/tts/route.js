import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * TTS Route
 * Primary: Browser Web Speech API (free, no backend needed)
 * Fallback: Returns text for browser to speak
 * Optional: gTTS Python microservice if GTTS_URL is set
 */
export async function POST(request) {
  try {
    const { text, language = 'en', voice = 'female' } = await request.json();
    if (!text) return NextResponse.json({ error: 'No text' }, { status: 400 });

    // Language code mapping for TTS
    const langCodes = {
      en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN'
    };

    // If gTTS microservice is configured, use it
    const GTTS_URL = process.env.GTTS_URL;
    if (GTTS_URL) {
      try {
        const res = await fetch(`${GTTS_URL}/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, lang: language }),
        });
        if (res.ok) {
          const audioBuffer = await res.arrayBuffer();
          return new Response(audioBuffer, {
            headers: { 'Content-Type': 'audio/mpeg', 'X-TTS-Source': 'gtts' },
          });
        }
      } catch (e) {
        console.warn('gTTS failed, using browser TTS');
      }
    }

    // Default: return text + lang code for browser Web Speech API
    return NextResponse.json({
      text,
      langCode: langCodes[language] || 'en-IN',
      source: 'browser',
      // Browser will call window.speechSynthesis with this
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
