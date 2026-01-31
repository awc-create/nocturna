import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // -----------------------------------
  // 1) ADMIN PROTECTION (NextAuth)
  // -----------------------------------
  if (pathname.startsWith('/admin')) {
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

  // -----------------------------------
  // 2) SITE LOCK (COMING SOON)
  // -----------------------------------
  const lockEnabled = process.env.SITE_LOCK_ENABLED === 'true';
  if (!lockEnabled) return NextResponse.next();

  // Allowlist
  const allow =
    pathname === '/coming-soon' ||
    pathname.startsWith('/api/site-unlock') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml';

  if (allow) return NextResponse.next();

  const cookieName = process.env.SITE_UNLOCK_COOKIE || 'site_unlocked';
  const unlocked = req.cookies.get(cookieName)?.value === '1';

  if (unlocked) return NextResponse.next();

  // Redirect to coming soon
  const url = req.nextUrl.clone();
  url.pathname = '/coming-soon';
  url.searchParams.set('next', pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
