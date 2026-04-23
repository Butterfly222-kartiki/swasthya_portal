import { NextResponse } from 'next/server';

export async function POST() {
  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  if (!DAILY_API_KEY) {
    return NextResponse.json({ error: 'Daily API key not configured' }, { status: 500 });
  }
  try {
    const res = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DAILY_API_KEY}` },
      body: JSON.stringify({
        properties: {
          exp: Math.floor(Date.now() / 1000) + 3600,
          enable_chat: true,
          max_participants: 2,
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    return NextResponse.json({ url: data.url, name: data.name });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
