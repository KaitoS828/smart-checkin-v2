import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';

const ALLOWED_ORIGINS =
  process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3030'];

/**
 * Middleware: Admin routes protection with signed session tokens + CSRF origin check
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // CSRF: block state-changing requests from unexpected origins
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    const origin = request.headers.get('origin');
    if (origin && ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // Skip login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Protect all admin pages
  if (pathname.startsWith('/admin')) {
    return handleAdminAuth(request);
  }

  // Protect admin API routes (except login itself)
  if (pathname.startsWith('/api/admin/') && pathname !== '/api/admin/login') {
    return handleAdminAuth(request);
  }

  // Protect reservation list/create/delete (admin only)
  if (pathname === '/api/reservations' && (method === 'POST' || method === 'DELETE' || method === 'GET')) {
    return handleAdminAuth(request);
  }

  // Protect CSV export (admin only)
  if (pathname === '/api/reservations/export') {
    return handleAdminAuth(request);
  }

  return NextResponse.next();
}

async function handleAdminAuth(request: NextRequest): Promise<NextResponse> {
  const sessionToken = request.cookies.get('admin_session')?.value;

  if (sessionToken && (await verifySessionToken(sessionToken))) {
    return NextResponse.next();
  }

  // Redirect to login for page requests
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return new NextResponse('Unauthorized', { status: 401 });
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/reservations',
    '/api/reservations/export',
  ],
};
