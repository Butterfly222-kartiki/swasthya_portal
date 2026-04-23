# 🏥 Swasthya Portal — Rural Telemedicine Platform

A modern Indian-designed telemedicine platform built with **Next.js 14**, **Supabase**, and **Tailwind CSS**.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Auth | Email/password login & registration via Supabase Auth |
| 👥 Roles | Patient & Doctor roles with different dashboards |
| 📅 Appointments | Calendar booking with time slots & status tracking |
| 💬 Chat | Real-time doctor-patient messaging with Supabase Realtime |
| 🎙️ Voice Input | Browser-native speech-to-text for chat messages |
| 🔊 Text-to-Speech | Read doctor messages aloud |
| 📄 Documents | Upload, view & download medical records (Supabase Storage) |
| 💊 Prescriptions | Create and manage prescriptions |
| 🔁 Follow-ups | Track follow-up appointments |
| 🗺️ Pharmacy Map | Google Maps nearby pharmacy & clinic search |
| 🌐 Multilingual | English, हिंदी, मराठी, தமிழ் |
| 📱 Responsive | Mobile-first, works on all screen sizes |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18
- **Styling**: Tailwind CSS with custom Indian design system
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Realtime**: Supabase Realtime (WebSockets)
- **Maps**: Google Maps JavaScript API + Places API
- **Date Handling**: date-fns
- **Notifications**: react-hot-toast

---

## 🚀 Setup Instructions

### Step 1 — Clone and Install

```bash
# Install dependencies
npm install
```

### Step 2 — Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) → **New Project**
2. Note your **Project URL** and **anon public key** from:
   - Project Settings → API → Project URL
   - Project Settings → API → anon / public key

### Step 3 — Run Database Schema

1. In Supabase dashboard → **SQL Editor** → **New Query**
2. Paste the entire contents of `supabase_schema.sql`
3. Click **Run**

This will create all tables, RLS policies, storage bucket, and the auto-profile trigger.

### Step 4 — Configure Environment Variables

```bash
# Copy the example file
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Step 5 — Maps (No API Key Needed! 🆓)

The pharmacy/clinic map uses **OpenStreetMap + Leaflet.js + Overpass API** — all 100% free with no registration or credit card required. Just run the app and the map works out of the box.

### Step 6 — Configure Supabase Auth

In Supabase Dashboard → Authentication → Settings:
- **Site URL**: `http://localhost:3000` (for dev) or your production URL
- **Redirect URLs**: Add `http://localhost:3000/**`

Optional: Enable **email confirmation** under Auth → Providers → Email

### Step 7 — Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
swasthya-portal/
├── app/
│   ├── page.js                  # Landing page
│   ├── layout.js                # Root layout with providers
│   ├── globals.css              # Indian design system CSS
│   ├── auth/
│   │   ├── login/page.js        # Login page
│   │   └── register/page.js     # Registration page
│   ├── dashboard/
│   │   ├── layout.js            # Dashboard layout
│   │   ├── page.js              # Dashboard (server)
│   │   └── DashboardClient.js   # Dashboard UI (client)
│   ├── appointments/
│   │   ├── layout.js
│   │   └── page.js              # Booking + listing
│   ├── chat/
│   │   ├── layout.js
│   │   └── page.js              # Real-time chat
│   ├── documents/
│   │   ├── layout.js
│   │   └── page.js              # Document management
│   ├── pharmacy/
│   │   ├── layout.js
│   │   └── page.js              # Maps + nearby search
│   └── profile/
│       ├── layout.js
│       └── page.js              # Profile, prescriptions, follow-ups
├── components/
│   └── layout/
│       └── Sidebar.js           # Navigation sidebar
├── lib/
│   ├── supabase/
│   │   ├── client.js            # Browser Supabase client
│   │   ├── server.js            # Server Supabase client
│   │   └── middleware.js        # Auth middleware
│   ├── i18n.js                  # Translations (en/hi/mr/ta)
│   └── LanguageContext.js       # Language provider
├── middleware.js                # Route protection
├── supabase_schema.sql          # Full DB schema
├── tailwind.config.js
├── next.config.js
└── .env.local.example
```

---

## 🎨 Design System

The UI uses a custom **Indian Design System** with:

- 🟠 **Saffron** (`#f08000`) — Primary actions, CTAs
- 🟢 **Emerald** (`#10b981`) — Success states, health indicators
- 🔵 **Indigo** (`#4f46e5`) — Documents, info states
- 🏺 **Rangoli pattern** — Background texture
- **Poppins** font — Headings
- **Noto Sans** — Body text (supports Devanagari)
- Mandala-inspired dividers
- Warm cream background (`#fffdf7`)

---

## 🔒 Security

- All routes protected by middleware
- Supabase Row Level Security (RLS) on all tables
- Users can only access their own data
- Documents stored per-user in Supabase Storage
- End-to-end auth via Supabase JWT tokens

---

## 📱 Mobile Support

- Collapsible sidebar on mobile (hamburger menu)
- Touch-friendly calendar and time slot pickers
- Responsive grid layouts
- Works on 2G/3G connections (optimized assets)

---

## 🌐 Multilingual

Switch languages via the Globe icon:
- 🇬🇧 English
- 🇮🇳 हिंदी (Hindi)
- 🇮🇳 मराठी (Marathi)
- 🇮🇳 தமிழ் (Tamil)

Language preference is saved in `localStorage`.

---

## 🏗️ Production Deployment

### Deploy on Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

In Vercel → Project Settings → Environment Variables, add all three `.env.local` variables.

Update Supabase Auth **Site URL** to your Vercel domain.

---

## 📋 Supabase Tables Created

| Table | Purpose |
|---|---|
| `profiles` | User accounts (patients & doctors) |
| `appointments` | Booking records |
| `chat_rooms` | Doctor-patient chat sessions |
| `messages` | Individual chat messages |
| `medical_documents` | Uploaded file metadata |
| `prescriptions` | Medicine prescriptions |
| `follow_ups` | Follow-up appointments |

Storage bucket: `medical-records`

---

## 🐛 Troubleshooting

**Auth not working?**
- Check Site URL in Supabase Auth settings
- Verify env vars are set correctly

**Realtime chat not updating?**
- Check `supabase_realtime` publication includes `messages` table
- Verify Supabase plan supports Realtime

**Maps not loading?**
- Ensure Maps JavaScript API + Places API are enabled
- Check API key restrictions (HTTP referrers)

**Uploads failing?**
- Verify storage bucket `medical-records` exists
- Check Storage RLS policies are applied

---

## 📞 Support

Built for **Bharat** 🇮🇳 — Healthcare at your fingertips.
