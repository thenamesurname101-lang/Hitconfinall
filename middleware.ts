import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './lib/auth';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/session'];

const MASTER_ONLY_PATHS = [
  '/dashboard/sites',
  '/dashboard/managers',
  '/dashboard/settings',
  '/api/sites',
  '/api/managers',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) {
    if (pathname === '/login') {
      const session = getSession(request);
      if (session) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  if (pathname === '/') {
    const session = getSession(request);
    if (session) return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  const session = getSession(request);
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based protection
  if (session.role === 'site_manager') {
    const isMasterOnly = MASTER_ONLY_PATHS.some((p) => pathname.startsWith(p));
    if (isMasterOnly) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
