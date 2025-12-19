import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ONLY protect /admin (and nothing else)
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/signin';
    url.searchParams.set('callbackUrl', pathname + search);
    return NextResponse.redirect(url);
  }

  if ((token as { role?: string }).role !== 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = '/403';
    url.search = '';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
