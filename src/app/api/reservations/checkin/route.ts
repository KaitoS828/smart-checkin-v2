import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeSecretCode } from '@/lib/utils/secret-code';
import { z } from 'zod';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// Validation schema for check-in
const CheckinSchema = z.object({
  reservationId: z.string().uuid('Invalid reservation ID'),
  secretCode: z.string().min(1, 'Secret code is required'),
});

/**
 * POST /api/reservations/checkin
 * Verify secret code and complete check-in
 */
export async function POST(request: NextRequest) {
  // Rate limit: 15 attempts per 10 minutes per IP
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = rateLimit(`reservations-checkin:${ip}`, 15, 10 * 60 * 1000);

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

    // Validate input
    const validation = CheckinSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { reservationId, secretCode } = validation.data;

    // Normalize secret code (uppercase, remove spaces)
    const normalizedCode = normalizeSecretCode(secretCode);

    // Get reservation
    const supabase = await createClient();
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Check if already checked in
    if (reservation.is_checked_in) {
      return NextResponse.json(
        {
          error: 'Already checked in',
          alreadyCheckedIn: true,
          doorPin: reservation.door_pin,
        },
        { status: 200 }
      );
    }

    // Verify secret code
    if (reservation.secret_code !== normalizedCode) {
      return NextResponse.json(
        { error: 'Invalid secret code. Please check and try again.' },
        { status: 401 }
      );
    }

    // Update check-in status
    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update({ is_checked_in: true })
      .eq('id', reservationId)
      .select()
      .single();

    if (updateError || !updatedReservation) {
      console.error('Error updating check-in status:', updateError);
      return NextResponse.json({ error: 'Failed to complete check-in' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      doorPin: updatedReservation.door_pin,
      reservation: updatedReservation,
    });
  } catch (error) {
    console.error('Unexpected error during check-in:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
