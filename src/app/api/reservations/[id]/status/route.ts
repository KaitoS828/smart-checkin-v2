import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';

/**
 * GET /api/reservations/[id]/status
 * Returns the check-in status and door_pin for a reservation.
 * Used by the guest-side polling to detect when staff has confirmed the identity.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('id, is_checked_in, door_pin, guest_name, whereby_room_url')
      .eq('id', id)
      .single();

    if (error || !reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    return NextResponse.json({
      is_checked_in: reservation.is_checked_in,
      // Only return door_pin once check-in is confirmed by staff
      door_pin: reservation.is_checked_in ? reservation.door_pin : null,
      guest_name: reservation.guest_name,
      whereby_room_url: reservation.whereby_room_url,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
