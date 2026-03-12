import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { verifySessionToken } from '@/lib/auth/session';

// Validation schema for updating guest info
const UpdateGuestInfoSchema = z.object({
  guest_name: z.string().min(1, 'お名前は必須です'),
  guest_name_kana: z.string().min(1, 'ふりがなは必須です'),
  guest_address: z.string().min(1, '住所は必須です'),
  guest_contact: z.string().min(1, '連絡先は必須です'),
  guest_occupation: z.string().min(1, '職業は必須です'),
  guest_gender: z.string().min(1, '性別は必須です'),
  is_foreign_national: z.boolean().default(false),
  nationality: z.string().optional(),
  passport_number: z.string().optional(),
  check_in_time: z.string().optional().nullable(),
});

/**
 * GET /api/reservations/[id]
 * Get a specific reservation by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Admin-only: verify session
  const sessionToken = request.cookies.get('admin_session')?.value;
  if (!sessionToken || !(await verifySessionToken(sessionToken))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reservations/[id]
 * Update guest information for a reservation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validation = UpdateGuestInfoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      guest_name,
      guest_name_kana,
      guest_address,
      guest_contact,
      guest_occupation,
      guest_gender,
      is_foreign_national,
      nationality,
      passport_number,
      check_in_time,
    } = validation.data;

    const supabase = await createClient();

    // Build update data
    const updateData: Record<string, unknown> = {
      guest_name,
      guest_name_kana,
      guest_address,
      guest_contact,
      guest_occupation,
      guest_gender,
      is_foreign_national,
      ...(check_in_time !== undefined && { check_in_time: check_in_time || null }),
    };

    if (is_foreign_national) {
      updateData.nationality = nationality || null;
      updateData.passport_number = passport_number || null;
    } else {
      updateData.nationality = null;
      updateData.passport_number = null;
      updateData.passport_image_url = null;
    }

    // Update reservation
    const { data: reservation, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !reservation) {
      console.error('Error updating reservation:', error);
      return NextResponse.json(
        { error: 'Failed to update reservation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
