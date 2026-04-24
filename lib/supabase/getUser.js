import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Cached per-request auth fetch.
 * React.cache() deduplicates calls within the same server request,
 * so every layout/page that calls getUser() shares one DB round-trip.
 */
export const getUser = cache(async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
});

/**
 * Cached profile fetch. Separate cache from getUser so we can call
 * each independently without redundant re-fetches.
 */
export const getProfile = cache(async () => {
  const { user, supabase } = await getUser();
  if (!user) return { user: null, profile: null };
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return { user, profile };
});

/**
 * Require auth — redirects to login if not authenticated.
 * Returns { user, profile }.
 */
export async function requireAuth() {
  const { user, profile } = await getProfile();
  if (!user) redirect('/auth/login');
  return { user, profile };
}