import { NextRequest, NextResponse } from 'next/server';
import { NAV_REGISTRY, type NavSlug } from '@/components/navbar/registry';

export async function POST(req: NextRequest) {
  const { slug } = (await req.json()) as { slug: NavSlug };
  if (!slug || !(slug in NAV_REGISTRY)) {
    return NextResponse.json({ ok: false, error: 'Unknown variant' }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, slug });
  res.cookies.set('nav_variant', slug, {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
