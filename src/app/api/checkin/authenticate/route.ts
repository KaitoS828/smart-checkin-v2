import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { sendCheckinNotifications } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  // Rate limit: 20 attempts per 10 minutes per IP
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = rateLimit(`checkin-auth:${ip}`, 20, 10 * 60 * 1000);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
      }
    );
  }

  try {
    const body = await request.json();
    const { secretCode } = body;

    if (!secretCode || typeof secretCode !== 'string') {
      return NextResponse.json({ error: 'Secret code is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // ゲスト情報・宿情報も取得（通知用）
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, whereby_room_url, guest_name, check_in_date, secret_code, property_id')
      .eq('secret_code', secretCode)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json(
        { error: 'シークレットコードが正しくありません' },
        { status: 401 }
      );
    }

    // 宿名を取得
    let propertyName: string | null = null;
    if (reservation.property_id) {
      const adminSupabase = await createAdminClient();
      const { data: property } = await adminSupabase
        .from('properties')
        .select('name')
        .eq('id', reservation.property_id)
        .single();
      propertyName = property?.name ?? null;
    }

    // 通知送信（失敗してもチェックインは成功扱い）
    sendCheckinNotifications({
      reservationId: reservation.id,
      guestName: reservation.guest_name,
      checkInDate: reservation.check_in_date,
      secretCode: reservation.secret_code,
      propertyName,
    }).catch((err) => console.error('[notifications] Unexpected error:', err));

    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
      wherebyRoomUrl: reservation.whereby_room_url,
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
