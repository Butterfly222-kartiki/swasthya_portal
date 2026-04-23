/**
 * VOICE SESSION STATE MANAGER
 * Tracks multi-turn conversation state per user
 * Uses in-memory Map + Supabase for persistence
 */

// In-memory session store (fast, per-request)
const sessions = new Map();

export const INTENTS = {
  BOOK_APPOINTMENT: 'BOOK_APPOINTMENT',
  NAVIGATE: 'NAVIGATE',
  CHAT_DOCTOR: 'CHAT_DOCTOR',
  UPLOAD_DOCUMENT: 'UPLOAD_DOCUMENT',
  VIEW_RECORDS: 'VIEW_RECORDS',
  FIND_PHARMACY: 'FIND_PHARMACY',
  VIDEO_CALL: 'VIDEO_CALL',
  CHECK_APPOINTMENTS: 'CHECK_APPOINTMENTS',
  WRITE_PRESCRIPTION: 'WRITE_PRESCRIPTION',
  GENERAL_QUERY: 'GENERAL_QUERY',
  UNKNOWN: 'UNKNOWN',
};

export const SESSION_STATUS = {
  IDLE: 'IDLE',
  COLLECTING: 'COLLECTING',
  CONFIRMING: 'CONFIRMING',
  DONE: 'DONE',
};

export function createSession(userId) {
  return {
    userId,
    intent: null,
    status: SESSION_STATUS.IDLE,
    // Appointment booking fields
    mode: null,          // 'video' | 'in-person' | 'chat'
    doctor: null,        // { id, name, speciality }
    slot: null,          // '10:00 AM'
    date: null,          // '2025-01-15'
    symptoms: null,      // free text
    // Navigation
    navigateTo: null,
    // Chat
    chatMessage: null,
    // History for context
    history: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, createSession(userId));
  }
  return sessions.get(userId);
}

export function updateSession(userId, updates) {
  const session = getSession(userId);
  const updated = { ...session, ...updates, updatedAt: Date.now() };
  sessions.set(userId, updated);
  return updated;
}

export function clearSession(userId) {
  sessions.set(userId, createSession(userId));
  return getSession(userId);
}

export function addToHistory(userId, role, text) {
  const session = getSession(userId);
  session.history.push({ role, text, timestamp: Date.now() });
  // Keep last 10 turns
  if (session.history.length > 10) session.history = session.history.slice(-10);
  sessions.set(userId, session);
}

/**
 * WORKFLOW ENGINE
 * Pure logic — no AI. Decides what to ask next based on session state.
 */
export function nextStep(session, lang = 'en') {
  const msgs = STEP_MESSAGES[lang] || STEP_MESSAGES.en;

  if (!session.intent || session.intent === INTENTS.UNKNOWN) {
    return { prompt: msgs.ask_intent, field: 'intent', action: null };
  }

  switch (session.intent) {
    case INTENTS.BOOK_APPOINTMENT:
      if (!session.mode)     return { prompt: msgs.ask_mode,     field: 'mode',     action: null };
      if (!session.doctor)   return { prompt: msgs.ask_doctor,   field: 'doctor',   action: 'SHOW_DOCTORS' };
      if (!session.date)     return { prompt: msgs.ask_date,     field: 'date',     action: 'SHOW_CALENDAR' };
      if (!session.slot)     return { prompt: msgs.ask_slot,     field: 'slot',     action: 'SHOW_SLOTS' };
      if (!session.symptoms) return { prompt: msgs.ask_symptoms, field: 'symptoms', action: null };
      return {
        prompt: msgs.confirm_booking
          .replace('{doctor}', session.doctor?.name || '')
          .replace('{date}', session.date || '')
          .replace('{slot}', session.slot || ''),
        field: 'confirm',
        action: 'CONFIRM_BOOKING',
      };

    case INTENTS.NAVIGATE:
      return { prompt: msgs.navigating, field: null, action: `NAVIGATE:${session.navigateTo}` };

    case INTENTS.CHAT_DOCTOR:
      if (!session.doctor) return { prompt: msgs.ask_which_doctor, field: 'doctor', action: 'SHOW_DOCTORS' };
      return { prompt: msgs.opening_chat, field: null, action: 'OPEN_CHAT' };

    case INTENTS.UPLOAD_DOCUMENT:
      return { prompt: msgs.upload_doc, field: null, action: 'OPEN_UPLOAD' };

    case INTENTS.VIEW_RECORDS:
      return { prompt: msgs.opening_records, field: null, action: 'NAVIGATE:/documents' };

    case INTENTS.FIND_PHARMACY:
      return { prompt: msgs.finding_pharmacy, field: null, action: 'NAVIGATE:/pharmacy' };

    case INTENTS.VIDEO_CALL:
      return { prompt: msgs.starting_video, field: null, action: 'NAVIGATE:/video' };

    case INTENTS.CHECK_APPOINTMENTS:
      return { prompt: msgs.showing_appointments, field: null, action: 'NAVIGATE:/appointments' };

    default:
      return { prompt: msgs.not_understood, field: null, action: null };
  }
}

const STEP_MESSAGES = {
  en: {
    ask_intent: "Hello! How can I help you today? You can book an appointment, chat with a doctor, view records, or find a pharmacy.",
    ask_mode: "Would you like an in-person visit, video consultation, or chat consultation?",
    ask_doctor: "Which doctor would you like to see? I'll show you available doctors.",
    ask_date: "Which date would you prefer for your appointment?",
    ask_slot: "Great! Let me show you available time slots for that day.",
    ask_symptoms: "Please briefly describe your symptoms or reason for the visit.",
    confirm_booking: "Perfect! Shall I confirm your appointment with Dr. {doctor} on {date} at {slot}? Say yes to confirm.",
    ask_which_doctor: "Which doctor would you like to chat with?",
    opening_chat: "Opening your chat now.",
    upload_doc: "Opening the document upload section for you.",
    opening_records: "Opening your medical records.",
    finding_pharmacy: "Finding pharmacies near you.",
    starting_video: "Starting video consultation.",
    showing_appointments: "Showing your appointments.",
    navigating: "Taking you there now.",
    not_understood: "I didn't quite understand that. Could you repeat? You can say: book appointment, chat with doctor, open records, find pharmacy.",
  },
  hi: {
    ask_intent: "नमस्ते! आज मैं आपकी कैसे मदद कर सकता हूं? आप अपॉइंटमेंट बुक कर सकते हैं, डॉक्टर से बात कर सकते हैं, रिकॉर्ड देख सकते हैं।",
    ask_mode: "क्या आप व्यक्तिगत मुलाकात, वीडियो परामर्श, या चैट परामर्श चाहते हैं?",
    ask_doctor: "आप किस डॉक्टर से मिलना चाहते हैं? मैं उपलब्ध डॉक्टर दिखाता हूं।",
    ask_date: "आप किस तारीख को अपॉइंटमेंट चाहते हैं?",
    ask_slot: "बढ़िया! उस दिन के लिए उपलब्ध समय स्लॉट दिखाता हूं।",
    ask_symptoms: "कृपया अपने लक्षण या मिलने का कारण बताएं।",
    confirm_booking: "क्या मैं डॉ. {doctor} के साथ {date} को {slot} पर आपकी अपॉइंटमेंट की पुष्टि करूं? हां कहें।",
    ask_which_doctor: "आप किस डॉक्टर से बात करना चाहते हैं?",
    opening_chat: "आपका चैट खोल रहा हूं।",
    upload_doc: "दस्तावेज़ अपलोड सेक्शन खोल रहा हूं।",
    opening_records: "आपके मेडिकल रिकॉर्ड खोल रहा हूं।",
    finding_pharmacy: "आपके पास की फार्मेसी ढूंढ रहा हूं।",
    starting_video: "वीडियो परामर्श शुरू कर रहा हूं।",
    showing_appointments: "आपकी अपॉइंटमेंट दिखा रहा हूं।",
    navigating: "अभी ले जा रहा हूं।",
    not_understood: "मैं समझ नहीं पाया। कृपया दोबारा बोलें। आप कह सकते हैं: अपॉइंटमेंट बुक करें, डॉक्टर से बात करें, रिकॉर्ड खोलें।",
  },
  mr: {
    ask_intent: "नमस्कार! आज मी तुम्हाला कशी मदत करू शकतो? तुम्ही भेट बुक करू शकता, डॉक्टरांशी बोलू शकता.",
    ask_mode: "तुम्हाला प्रत्यक्ष भेट, व्हिडिओ सल्लामसलत, किंवा चॅट सल्लामसलत हवी आहे का?",
    ask_doctor: "तुम्हाला कोणत्या डॉक्टरांना भेटायचे आहे?",
    ask_date: "तुम्हाला कोणत्या तारखेला भेट हवी आहे?",
    ask_slot: "छान! त्या दिवसाचे उपलब्ध वेळ स्लॉट दाखवतो.",
    ask_symptoms: "कृपया तुमची लक्षणे किंवा भेटीचे कारण सांगा.",
    confirm_booking: "डॉ. {doctor} सोबत {date} रोजी {slot} वाजता भेट निश्चित करू का? हो म्हणा.",
    ask_which_doctor: "तुम्हाला कोणत्या डॉक्टरांशी बोलायचे आहे?",
    opening_chat: "तुमचा चॅट उघडत आहे.",
    upload_doc: "कागदपत्र अपलोड विभाग उघडत आहे.",
    opening_records: "तुमचे वैद्यकीय रेकॉर्ड उघडत आहे.",
    finding_pharmacy: "जवळील फार्मसी शोधत आहे.",
    starting_video: "व्हिडिओ सल्लामसलत सुरू करत आहे.",
    showing_appointments: "तुमच्या भेटी दाखवत आहे.",
    navigating: "आता घेऊन जात आहे.",
    not_understood: "मला नीट समजले नाही. कृपया पुन्हा सांगा.",
  },
  ta: {
    ask_intent: "வணக்கம்! இன்று நான் உங்களுக்கு எவ்வாறு உதவலாம்? நீங்கள் சந்திப்பு முன்பதிவு செய்யலாம், மருத்துவரிடம் பேசலாம்.",
    ask_mode: "நேரில் சந்திப்பு, வீடியோ ஆலோசனை, அல்லது அரட்டை ஆலோசனை வேண்டுமா?",
    ask_doctor: "நீங்கள் எந்த மருத்துவரை சந்திக்க விரும்புகிறீர்கள்?",
    ask_date: "எந்த தேதியில் சந்திப்பு வேண்டும்?",
    ask_slot: "சரி! அந்த நாளுக்கான நேர இடங்களை காட்டுகிறேன்.",
    ask_symptoms: "உங்கள் அறிகுறிகளை சுருக்கமாக சொல்லுங்கள்.",
    confirm_booking: "டாக்டர் {doctor} உடன் {date} அன்று {slot} மணிக்கு சந்திப்பை உறுதிப்படுத்தட்டுமா? ஆம் என்று சொல்லுங்கள்.",
    ask_which_doctor: "எந்த மருத்துவரிடம் பேச விரும்புகிறீர்கள்?",
    opening_chat: "உங்கள் அரட்டையை திறக்கிறேன்.",
    upload_doc: "ஆவண பதிவேற்றும் பகுதியை திறக்கிறேன்.",
    opening_records: "உங்கள் மருத்துவ பதிவுகளை திறக்கிறேன்.",
    finding_pharmacy: "அருகிலுள்ள மருந்தகங்களை தேடுகிறேன்.",
    starting_video: "வீடியோ ஆலோசனை தொடங்குகிறேன்.",
    showing_appointments: "உங்கள் சந்திப்புகளை காட்டுகிறேன்.",
    navigating: "இப்போது அழைத்துச் செல்கிறேன்.",
    not_understood: "புரியவில்லை. மீண்டும் சொல்லுங்கள்.",
  },
};
