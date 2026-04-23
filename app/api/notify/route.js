import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, body, userId } = await request.json();

  // Store notification in DB
  await supabase.from('notifications').insert({
    user_id: userId || user.id,
    title,
    body,
    is_read: false,
  });

  return NextResponse.json({ success: true });
}
