// src/app/api/site-unlock/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const enabled = process.env.SITE_LOCK_ENABLED === 'true';
  if (!enabled) return NextResponse.json({ ok: true });

  const { password } = (await req.json().catch(() => ({}))) as {
    password?: string;
  };

  const correct = process.env.SITE_LOCK_PASSWORD;

  if (!password || !correct || password !== correct) {
    return NextResponse.json({ ok: false, error: 'Incorrect password' }, { status: 401 });
  }

  const cookieName = process.env.SITE_UNLOCK_COOKIE || 'site_unlocked';
  const isHttps = req.nextUrl.protocol === 'https:';

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, '1', {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
