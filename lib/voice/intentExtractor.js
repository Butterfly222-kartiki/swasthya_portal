/**
 * INTENT + ENTITY EXTRACTOR
 * Uses Google AI Studio (Gemini) to extract structured intent from user speech
 * Falls back to rule-based if API unavailable
 */

import { INTENTS } from './sessionManager.js';

const SYSTEM_PROMPT = `You are an AI assistant for Swasthya Portal, an Indian telemedicine platform.
Extract the intent and entities from the user's input.

Possible intents:
- BOOK_APPOINTMENT: user wants to book/schedule a doctor appointment
- NAVIGATE: user wants to go to a specific page/section
- CHAT_DOCTOR: user wants to message/text a doctor
- UPLOAD_DOCUMENT: user wants to upload a medical file/report
- VIEW_RECORDS: user wants to see their medical records
- FIND_PHARMACY: user wants to find a pharmacy
- VIDEO_CALL: user wants a video consultation
- CHECK_APPOINTMENTS: user wants to see their appointments
- WRITE_PRESCRIPTION: doctor wants to write a prescription
- GENERAL_QUERY: general health question
- UNKNOWN: cannot determine

Navigation targets (for NAVIGATE intent):
dashboard, appointments, chat, documents, pharmacy, profile, video

Return ONLY valid JSON, no markdown, no explanation:
{
  "intent": "BOOK_APPOINTMENT",
  "mode": "video|in-person|chat|null",
  "doctor": "doctor name or speciality mentioned, or null",
  "slot": "time slot if mentioned, or null",
  "date": "date if mentioned, or null",
  "symptoms": "symptoms or reason if mentioned, or null",
  "navigateTo": "page name for NAVIGATE intent, or null",
  "chatMessage": "the message to send if CHAT_DOCTOR, or null",
  "confidence": 0.95,
  "detectedLanguage": "en|hi|mr|ta"
}`;

export async function extractIntent(text, sessionHistory = [], apiKey = null) {
  // Try Google AI (Gemini) first
  if (apiKey || process.env.GOOGLE_AI_API_KEY) {
    try {
      return await extractWithGemini(text, sessionHistory, apiKey || process.env.GOOGLE_AI_API_KEY);
    } catch (err) {
      console.error('Gemini failed, using rule-based fallback:', err.message);
    }
  }

  // Fallback: rule-based extraction
  return ruleBasedExtract(text);
}

async function extractWithGemini(text, history, apiKey) {
  const historyContext = history.slice(-4).map(h => `${h.role}: ${h.text}`).join('\n');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${SYSTEM_PROMPT}\n\nConversation history:\n${historyContext || 'none'}\n\nUser input: "${text}"\n\nExtract intent and entities:`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 256,
        },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Rule-based fallback — covers common Indian English + Hindi patterns
 */
function ruleBasedExtract(text) {
  const t = text.toLowerCase().trim();
  const result = {
    intent: INTENTS.UNKNOWN,
    mode: null, doctor: null, slot: null, date: null,
    symptoms: null, navigateTo: null, chatMessage: null,
    confidence: 0.7, detectedLanguage: 'en',
  };

  // Language detection
  if (/[\u0900-\u097F]/.test(text)) result.detectedLanguage = 'hi';
  else if (/[\u0B80-\u0BFF]/.test(text)) result.detectedLanguage = 'ta';

  // Intent matching — English + Hindi
  if (/book|appointment|schedule|appoint|fix|doctor\s+milna|appointment\s+chahiye|भेट|अपॉइंटमेंट|बुक/.test(t))
    result.intent = INTENTS.BOOK_APPOINTMENT;
  else if (/chat|message|text|send|type|likhna|चैट|संदेश/.test(t))
    result.intent = INTENTS.CHAT_DOCTOR;
  else if (/video|call|consult|meet online|वीडियो|कॉल/.test(t))
    result.intent = INTENTS.VIDEO_CALL;
  else if (/upload|report|document|file|record upload|दस्तावेज़|अपलोड/.test(t))
    result.intent = INTENTS.UPLOAD_DOCUMENT;
  else if (/record|history|my file|past|report dekho|रिकॉर्ड|देखना/.test(t))
    result.intent = INTENTS.VIEW_RECORDS;
  else if (/pharmacy|medicine|shop|dawai|दवाई|फार्मेसी/.test(t))
    result.intent = INTENTS.FIND_PHARMACY;
  else if (/appointment|schedule|when|kab/.test(t))
    result.intent = INTENTS.CHECK_APPOINTMENTS;
  else if (/go to|open|navigate|dashboard|show me|खोलो|जाओ/.test(t))
    result.intent = INTENTS.NAVIGATE;

  // Mode extraction
  if (/video|online/.test(t)) result.mode = 'video';
  else if (/in.person|offline|clinic|physical/.test(t)) result.mode = 'in-person';
  else if (/chat|message|text/.test(t)) result.mode = 'chat';

  // Navigation target
  const navMap = {
    dashboard: 'dashboard', home: 'dashboard',
    appointment: 'appointments', appointments: 'appointments',
    chat: 'chat', message: 'chat',
    document: 'documents', record: 'documents', report: 'documents',
    pharmacy: 'pharmacy', medicine: 'pharmacy',
    profile: 'profile', video: 'video',
  };
  for (const [key, val] of Object.entries(navMap)) {
    if (t.includes(key)) { result.navigateTo = val; break; }
  }

  // Time slot extraction
  const slotMatch = t.match(/(\d{1,2})[:\s]?(\d{0,2})\s*(am|pm)/i);
  if (slotMatch) {
    const h = slotMatch[1], m = slotMatch[2] || '00', ampm = slotMatch[3].toUpperCase();
    result.slot = `${h.padStart(2,'0')}:${m.padStart(2,'0')} ${ampm}`;
  }

  // Doctor speciality extraction
  const specialities = ['cardiologist','dermatologist','pediatrician','gynecologist','orthopedic','ent','psychiatrist','neurologist','general'];
  for (const s of specialities) {
    if (t.includes(s)) { result.doctor = s; break; }
  }

  // Symptoms extraction — capture anything after symptom keywords
  const symMatch = t.match(/(?:symptoms?|feeling|suffering|problem|issue|pain|fever|cough|headache|chest|stomach|dizzy|vomit|bukhar|dard|takleef)\s*(.{0,80})/i);
  if (symMatch) result.symptoms = text.substring(text.toLowerCase().indexOf(symMatch[0])).trim().slice(0, 100);

  return result;
}
