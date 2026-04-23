-- ================================================
-- SWASTHYA PORTAL - Complete Database Schema v4
-- Run this entirely in Supabase SQL Editor
-- ================================================

create extension if not exists "uuid-ossp";

-- ─── PROFILES ───────────────────────────────────
drop table if exists public.notifications cascade;
drop table if exists public.follow_ups cascade;
drop table if exists public.prescriptions cascade;
drop table if exists public.medical_documents cascade;
drop table if exists public.messages cascade;
drop table if exists public.chat_rooms cascade;
drop table if exists public.appointments cascade;

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  phone text,
  role text check (role in ('patient','doctor','admin')) default 'patient',
  -- Doctor fields
  speciality text,
  license_number text,
  years_experience integer,
  license_doc_url text,
  certificate_url text,
  photo_url text,
  is_verified boolean default false,
  verification_status text check (verification_status in ('pending','approved','rejected')) default 'approved',
  available_slots text[],
  available_days text[],
  -- Patient fields
  age integer,
  gender text,
  blood_group text,
  address text,
  emergency_contact text,
  allergies text,
  chronic_conditions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- ─── APPOINTMENTS ────────────────────────────────
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete cascade,
  doctor_id uuid references public.profiles(id) on delete cascade,
  patient_name text,
  doctor_name text,
  appointment_date date not null,
  time_slot text not null,
  reason text,
  status text check (status in ('pending','confirmed','cancelled','completed')) default 'confirmed',
  type text check (type in ('in-person','video','chat')) default 'in-person',
  notes text,
  created_at timestamptz default now()
);
alter table public.appointments enable row level security;
create policy "apts_select" on public.appointments for select using (auth.uid() = patient_id or auth.uid() = doctor_id);
create policy "apts_insert" on public.appointments for insert with check (auth.uid() = patient_id);
create policy "apts_update" on public.appointments for update using (auth.uid() = patient_id or auth.uid() = doctor_id);
create policy "apts_delete" on public.appointments for delete using (auth.uid() = patient_id);

-- ─── CHAT ROOMS ──────────────────────────────────
create table public.chat_rooms (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete cascade,
  doctor_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(patient_id, doctor_id)
);
alter table public.chat_rooms enable row level security;
create policy "rooms_select" on public.chat_rooms for select using (auth.uid() = patient_id or auth.uid() = doctor_id);
create policy "rooms_insert" on public.chat_rooms for insert with check (auth.uid() = patient_id or auth.uid() = doctor_id);
create policy "rooms_update" on public.chat_rooms for update using (auth.uid() = patient_id or auth.uid() = doctor_id);

-- ─── MESSAGES ────────────────────────────────────
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.chat_rooms(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  sender_name text,
  sender_role text,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;
create policy "msg_select" on public.messages for select using (
  exists (select 1 from public.chat_rooms where id = messages.room_id and (patient_id = auth.uid() or doctor_id = auth.uid()))
);
create policy "msg_insert" on public.messages for insert with check (
  auth.uid() = sender_id and
  exists (select 1 from public.chat_rooms where id = messages.room_id and (patient_id = auth.uid() or doctor_id = auth.uid()))
);

-- ─── MEDICAL DOCUMENTS ───────────────────────────
create table public.medical_documents (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  doc_type text,
  file_url text,
  file_path text,
  file_size bigint,
  file_mime text,
  shared_with uuid[] default '{}',
  created_at timestamptz default now()
);
alter table public.medical_documents enable row level security;
create policy "docs_all" on public.medical_documents for all using (auth.uid() = patient_id);
create policy "docs_shared" on public.medical_documents for select using (auth.uid() = any(shared_with));

-- ─── PRESCRIPTIONS ───────────────────────────────
create table public.prescriptions (
  id uuid default uuid_generate_v4() primary key,
  doctor_id uuid references public.profiles(id),
  patient_id uuid references public.profiles(id),
  medicine text not null,
  dosage text,
  duration text,
  notes text,
  created_at timestamptz default now()
);
alter table public.prescriptions enable row level security;
create policy "rx_select" on public.prescriptions for select using (auth.uid() = patient_id or auth.uid() = doctor_id);
create policy "rx_insert" on public.prescriptions for insert with check (auth.uid() = doctor_id or auth.uid() = patient_id);

-- ─── FOLLOW-UPS ──────────────────────────────────
create table public.follow_ups (
  id uuid default uuid_generate_v4() primary key,
  doctor_id uuid references public.profiles(id),
  patient_id uuid references public.profiles(id),
  follow_up_date date,
  notes text,
  status text check (status in ('pending','completed','cancelled')) default 'pending',
  created_at timestamptz default now()
);
alter table public.follow_ups enable row level security;
create policy "fu_select" on public.follow_ups for select using (auth.uid() = patient_id or auth.uid() = doctor_id);
create policy "fu_insert" on public.follow_ups for insert with check (auth.uid() = doctor_id or auth.uid() = patient_id);
create policy "fu_update" on public.follow_ups for update using (auth.uid() = doctor_id);

-- ─── NOTIFICATIONS ───────────────────────────────
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  type text default 'general',
  is_read boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "notif_select" on public.notifications for select using (auth.uid() = user_id);
create policy "notif_insert" on public.notifications for insert with check (true);
create policy "notif_update" on public.notifications for update using (auth.uid() = user_id);

-- ─── STORAGE BUCKETS ─────────────────────────────
insert into storage.buckets (id, name, public) values ('medical-records','medical-records',true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('doctor-documents','doctor-documents',true) on conflict do nothing;

create policy "storage_upload" on storage.objects for insert with check (auth.role() = 'authenticated');
create policy "storage_select" on storage.objects for select using (true);
create policy "storage_delete" on storage.objects for delete using (auth.uid()::text = (storage.foldername(name))[1]);

-- ─── REALTIME ────────────────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.appointments;
alter publication supabase_realtime add table public.chat_rooms;

-- ─── TRIGGER: AUTO-CREATE PROFILE ────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, phone, speciality, verification_status, is_verified, available_slots, available_days)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    coalesce(new.raw_user_meta_data->>'role','patient'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'speciality',
    case when coalesce(new.raw_user_meta_data->>'role','patient') = 'doctor' then 'pending' else 'approved' end,
    case when coalesce(new.raw_user_meta_data->>'role','patient') = 'patient' then true else false end,
    case when coalesce(new.raw_user_meta_data->>'role','patient') = 'doctor'
      then ARRAY['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM']
      else null end,
    case when coalesce(new.raw_user_meta_data->>'role','patient') = 'doctor'
      then ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday']
      else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── CREATE ADMIN USER (update email after running) ──
-- INSERT INTO public.profiles (id, full_name, email, role, is_verified, verification_status)
-- VALUES ('YOUR-AUTH-USER-UUID', 'Admin', 'admin@swasthya.com', 'admin', true, 'approved')
-- ON CONFLICT (id) DO UPDATE SET role='admin';

-- ─── CONSULTATION NOTES (AI-generated) ───────────
create table if not exists public.consultation_notes (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.chat_rooms(id) on delete cascade unique,
  patient_id uuid references public.profiles(id),
  doctor_id uuid references public.profiles(id),
  notes jsonb,
  raw_conversation text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.consultation_notes enable row level security;
create policy "notes_access" on public.consultation_notes for all
  using (auth.uid() = patient_id or auth.uid() = doctor_id);

alter publication supabase_realtime add table public.consultation_notes;

-- ─── SCHEMA UPDATES v6 ───────────────────────────
-- Add day_overrides column for per-day availability
alter table public.profiles add column if not exists day_overrides text default '{}';

-- Update prescriptions table to have a unique constraint for consultation notes upsert
-- (medicine, doctor_id, patient_id, duration) for video session notes
-- Note: run this only if not already present
-- alter table public.prescriptions add constraint unique_consult_notes unique (doctor_id, patient_id, duration) where medicine = '__CONSULTATION_NOTES__';

-- Allow prescriptions to be deleted by doctor
drop policy if exists "rx_delete" on public.prescriptions;
create policy "rx_delete" on public.prescriptions for delete using (auth.uid() = doctor_id);

