import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * STT Route — Free Whisper Options (priority order):
 *
 * 1. Groq API  (FREE: 7200 audio-seconds/day, fastest, whisper-large-v3-turbo)
 *    → Sign up: https://console.groq.com  (no credit card)
 *    → Set: GROQ_API_KEY=gsk_...
 *
 * 2. Hugging Face Inference API  (FREE: 1000 req/day, whisper-large-v3)
 *    → Sign up: https://huggingface.co   (no credit card)
 *    → Set: HF_API_KEY=hf_...
 *
 * 3. Browser Web Speech API  (FREE: unlimited, Chrome only)
 *    → Already handled in VoiceAssistant.js frontend
 *    → This is the zero-key fallback
 *
 * NO OPENAI KEY NEEDED.
 */
export async function POST(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const audioBlob = formData.get('audio');
    const language  = formData.get('language') || 'en';

    if (!audioBlob) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
    }

    // ── OPTION 1: Groq (Free, fastest) ──────────────────────
    if (process.env.GROQ_API_KEY) {
      try {
        const result = await transcribeWithGroq(audioBlob, language);
        return NextResponse.json(result);
      } catch (err) {
        console.warn('Groq STT failed, trying Hugging Face:', err.message);
      }
    }

    // ── OPTION 2: Hugging Face (Free fallback) ───────────────
    if (process.env.HF_API_KEY) {
      try {
        const result = await transcribeWithHuggingFace(audioBlob, language);
        return NextResponse.json(result);
      } catch (err) {
        console.warn('HF STT failed, using browser STT signal:', err.message);
      }
    }

    // ── OPTION 3: Signal frontend to use browser STT ─────────
    // Frontend VoiceAssistant.js already uses webkitSpeechRecognition
    // This response tells it no backend STT is available
    return NextResponse.json({
      text: null,
      source: 'browser_required',
      message: 'No STT API key configured. Browser Web Speech API is being used instead.',
    });

  } catch (err) {
    console.error('STT route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── GROQ WHISPER ─────────────────────────────────────────────
async function transcribeWithGroq(audioBlob, language) {
  const form = new FormData();

  // Groq accepts webm/mp3/mp4/mpeg/mpga/m4a/wav
  const file = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
  form.append('file', file);
  form.append('model', 'whisper-large-v3-turbo'); // fastest free model
  form.append('response_format', 'verbose_json');
  form.append('temperature', '0');

  // Language hint for better Indian language accuracy
  const groqLangMap = { en: 'en', hi: 'hi', mr: 'mr', ta: 'ta' };
  if (groqLangMap[language]) {
    form.append('language', groqLangMap[language]);
  }

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq error ${res.status}: ${errText}`);
  }

  const data = await res.json();

  return {
    text: data.text?.trim(),
    detectedLanguage: data.language || language,
    confidence: 0.95,
    source: 'groq-whisper',
    model: 'whisper-large-v3-turbo',
    duration: data.duration,
    segments: data.segments?.map(s => ({
      text: s.text,
      start: s.start,
      end: s.end,
    })),
  };
}

// ── HUGGING FACE WHISPER ──────────────────────────────────────
async function transcribeWithHuggingFace(audioBlob, language) {
  // Use whisper-large-v3 on HF Inference API
  const MODEL = 'openai/whisper-large-v3';

  const arrayBuffer = await audioBlob.arrayBuffer();
  const base64Audio = Buffer.from(arrayBuffer).toString('base64');

  // HF Inference API requires JSON body with inputs + parameters for multilingual
  const hfLangMap = { en: 'english', hi: 'hindi', mr: 'marathi', ta: 'tamil', te: 'telugu', bn: 'bengali', gu: 'gujarati', kn: 'kannada', ml: 'malayalam', pa: 'punjabi', ur: 'urdu' };
  const whisperLang = hfLangMap[language] || 'english';

  const res = await fetch(
    `https://api-inference.huggingface.co/models/${MODEL}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Wait-For-Model': 'true',
      },
      body: JSON.stringify({
        inputs: base64Audio,
        parameters: {
          language: whisperLang,
          task: 'transcribe',
          return_timestamps: false,
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    // If model is loading (503), wait and retry
    if (res.status === 503) {
      await new Promise(r => setTimeout(r, 3000));
      return transcribeWithHuggingFace(audioBlob, language);
    }
    throw new Error(`HF error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = typeof data === 'string' ? data : data.text || data[0]?.generated_text || '';

  return {
    text: text.trim(),
    detectedLanguage: language,
    confidence: 0.9,
    source: 'huggingface-whisper',
    model: MODEL,
  };
}
