-- =============================================
-- SWASTHYA PORTAL - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- 1. PROFILES TABLE
-- =============================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text unique,
  phone text,
  role text check (role in ('patient', 'doctor')) default 'patient',
  speciality text,
  age integer,
  gender text check (gender in ('Male', 'Female', 'Other')),
  blood_group text,
  address text,
  emergency_contact text,
  allergies text,
  chronic_conditions text,
  avatar_url text,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- =============================================
-- 2. APPOINTMENTS TABLE
-- =============================================
create table if not exists public.appointments (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete cascade,
  doctor_id uuid references public.profiles(id) on delete cascade,
  patient_name text,
  doctor_name text,
  appointment_date date not null,
  time_slot text not null,
  reason text,
  status text check (status in ('pending', 'confirmed', 'cancelled', 'completed')) default 'confirmed',
  type text check (type in ('in-person', 'video', 'chat')) default 'in-person',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.appointments enable row level security;
create policy "Users can view own appointments" on public.appointments for select
  using (auth.uid() = patient_id or auth.uid() = doctor_id);
create policy "Patients can create appointments" on public.appointments for insert
  with check (auth.uid() = patient_id);
create policy "Users can update own appointments" on public.appointments for update
  using (auth.uid() = patient_id or auth.uid() = doctor_id);

-- =============================================
-- 3. CHAT ROOMS TABLE
-- =============================================
create table if not exists public.chat_rooms (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete cascade,
  doctor_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(patient_id, doctor_id)
);

alter table public.chat_rooms enable row level security;
create policy "Users can view own chat rooms" on public.chat_rooms for select
  using (auth.uid() = patient_id or auth.uid() = doctor_id);
create policy "Patients can create chat rooms" on public.chat_rooms for insert
  with check (auth.uid() = patient_id);
create policy "Users can update own chat rooms" on public.chat_rooms for update
  using (auth.uid() = patient_id or auth.uid() = doctor_id);

-- =============================================
-- 4. MESSAGES TABLE
-- =============================================
create table if not exists public.messages (
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
create policy "Room members can view messages" on public.messages for select
  using (
    exists (
      select 1 from public.chat_rooms
      where id = messages.room_id
      and (patient_id = auth.uid() or doctor_id = auth.uid())
    )
  );
create policy "Room members can insert messages" on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.chat_rooms
      where id = messages.room_id
      and (patient_id = auth.uid() or doctor_id = auth.uid())
    )
  );

-- =============================================
-- 5. MEDICAL DOCUMENTS TABLE
-- =============================================
create table if not exists public.medical_documents (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  doc_type text,
  file_url text,
  file_path text,
  file_size bigint,
  file_mime text,
  shared_with uuid[],
  created_at timestamptz default now()
);

alter table public.medical_documents enable row level security;
create policy "Patients can manage own documents" on public.medical_documents for all
  using (auth.uid() = patient_id);
create policy "Doctors can view shared documents" on public.medical_documents for select
  using (auth.uid() = any(shared_with));

-- =============================================
-- 6. PRESCRIPTIONS TABLE
-- =============================================
create table if not exists public.prescriptions (
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
create policy "Users can view own prescriptions" on public.prescriptions for select
  using (auth.uid() = patient_id or auth.uid() = doctor_id);
create policy "Users can insert prescriptions" on public.prescriptions for insert
  with check (auth.uid() = doctor_id or auth.uid() = patient_id);

-- =============================================
-- 7. FOLLOW-UPS TABLE
-- =============================================
create table if not exists public.follow_ups (
  id uuid default uuid_generate_v4() primary key,
  doctor_id uuid references public.profiles(id),
  patient_id uuid references public.profiles(id),
  follow_up_date date,
  notes text,
  status text check (status in ('pending', 'completed', 'cancelled')) default 'pending',
  created_at timestamptz default now()
);

alter table public.follow_ups enable row level security;
create policy "Users can view own follow-ups" on public.follow_ups for select
  using (auth.uid() = patient_id or auth.uid() = doctor_id);
create policy "Doctors can create follow-ups" on public.follow_ups for insert
  with check (auth.uid() = doctor_id);

-- =============================================
-- 8. STORAGE BUCKET
-- =============================================
insert into storage.buckets (id, name, public) values ('medical-records', 'medical-records', true)
  on conflict (id) do nothing;

create policy "Authenticated users can upload" on storage.objects
  for insert with check (bucket_id = 'medical-records' and auth.role() = 'authenticated');
create policy "Users can view own files" on storage.objects
  for select using (bucket_id = 'medical-records' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own files" on storage.objects
  for delete using (bucket_id = 'medical-records' and auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- 9. REALTIME
-- =============================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.chat_rooms;
alter publication supabase_realtime add table public.appointments;

-- =============================================
-- 10. AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, phone, speciality)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'speciality'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
