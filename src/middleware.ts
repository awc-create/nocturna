import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ADMIN_HOST = process.env.NEXT_PUBLIC_ADMIN_URL
  ? new URL(process.env.NEXT_PUBLIC_ADMIN_URL).host
  : ''; // e.g. "admin.nocturnaagency.co.uk"

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = req.headers.get('host') || '';

  const isAdminHost = ADMIN_HOST ? host === ADMIN_HOST : host.startsWith('admin.');

  // 0) Block /admin on MAIN domain
  if (pathname.startsWith('/admin') && !isAdminHost) {
    // return 404 (or redirect home)
    return NextResponse.rewrite(new URL('/404', req.url));
  }

  // 1) Admin protection (only on admin host)
  if (pathname.startsWith('/admin') && isAdminHost) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

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

  // 2) Site lock (don’t lock admin host if you don’t want to)
  const lockEnabled = process.env.SITE_LOCK_ENABLED === 'true';
  if (!lockEnabled) return NextResponse.next();

  // Optional: don't lock admin subdomain
  if (isAdminHost) return NextResponse.next();

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

  const url = req.nextUrl.clone();
  url.pathname = '/coming-soon';
  url.searchParams.set('next', pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
