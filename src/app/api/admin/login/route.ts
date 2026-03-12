import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/auth/session';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/admin/login
 * Admin password authentication with rate limiting and signed session tokens
 */
export async function POST(request: NextRequest) {
  // Rate limit: 10 attempts per 15 minutes per IP
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = rateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
      }
    );
  }

  try {
    const { username, password } = await request.json();

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      console.error('[security] ADMIN_USERNAME or ADMIN_PASSWORD environment variables are not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json(
        { error: 'ユーザーIDまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    const sessionToken = await createSessionToken();
    const response = NextResponse.json({ success: true });

    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
