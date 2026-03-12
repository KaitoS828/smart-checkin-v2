import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const CheckinSchema = z.object({
  reservation_id: z.string().uuid(),
});

/**
 * POST /api/checkin
 * Verify secret code and complete check-in
 */
export async function POST(request: NextRequest) {
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

    const { reservation_id } = validation.data;

    // Use admin client to retrieve reservation and update check-in status
    const supabase = await createClient();

    // Fetch reservation
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservation_id)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Update check-in status
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ is_checked_in: true })
      .eq('id', reservation_id);

    if (updateError) {
      console.error('Error updating check-in status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update check-in status' },
        { status: 500 }
      );
    }

    // Return success with door pin
    return NextResponse.json({
      success: true,
      guest_name: reservation.guest_name,
      door_pin: reservation.door_pin,
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
