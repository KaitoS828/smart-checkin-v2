import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { generateSecretCode } from '@/lib/utils/secret-code';
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar/client';
import { z } from 'zod';

// Validation schema for creating a reservation
const CreateReservationSchema = z.object({
  door_pin: z.string().min(1, 'Door PIN is required'),
  check_in_date: z.string().min(1, 'チェックイン日は必須です'),
  check_out_date: z.string().optional().nullable(),
  stay_type: z.enum(['宿泊', 'デイユース']).default('宿泊'),
  property_id: z.string().uuid().nullable().optional(),
});

// Validation schema for bulk updating reservations
const BulkActionReservationSchema = z.object({
  ids: z.array(z.string()),
  is_archived: z.boolean().optional(),
});

/**
 * GET /api/reservations
 * List all reservations with optional filtering
 * Query Params:
 * - archived: boolean (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const archived = searchParams.get('archived') === 'true';
    const propertyId = searchParams.get('property_id');

    const supabase = await createClient();

    let query = supabase
      .from('reservations')
      .select('*')
      .eq('is_archived', archived);

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    const { data: reservations, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reservations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reservations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reservations
 * Create a new reservation with auto-generated secret code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = CreateReservationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { door_pin, check_in_date, check_out_date, stay_type, property_id } = validation.data;

    // Generate unique secret code
    let secret_code = generateSecretCode();
    const supabase = await createClient();

    // Retry if collision (unlikely but possible)
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('reservations')
        .select('id')
        .eq('secret_code', secret_code)
        .single();

      if (!existing) {
        break; // Unique code found
      }

      secret_code = generateSecretCode();
      attempts++;
    }

    if (attempts === maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique secret code' },
        { status: 500 }
      );
    }

    // Create Whereby room if API key is provided
    let whereby_room_url = null;
    let whereby_host_room_url = null;

    if (process.env.WHEREBY_API_KEY) {
      try {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3); // 3ヶ月後に設定
        
        const wherebyResponse = await fetch('https://api.whereby.dev/v1/meetings', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHEREBY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            isLocked: true,
            endDate: endDate.toISOString(),
            fields: ['hostRoomUrl']
          }),
        });

        if (wherebyResponse.ok) {
          const data = await wherebyResponse.json();
          whereby_room_url = data.roomUrl;
          whereby_host_room_url = data.hostRoomUrl;
        } else {
          console.error('Whereby API response error:', await wherebyResponse.text());
        }
      } catch (err) {
        console.error('Failed to create whereby room:', err);
      }
    } else {
      // For testing without API key
      whereby_room_url = 'https://demo.whereby.com/smart-checkin-demo';
      whereby_host_room_url = 'https://demo.whereby.com/smart-checkin-demo';
      console.log('No WHEREBY_API_KEY found. Using demo room URL.');
    }

    // Insert reservation
    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert({
        door_pin,
        secret_code,
        whereby_room_url,
        whereby_host_room_url,
        check_in_date,
        check_out_date: check_out_date ?? null,
        stay_type,
        property_id: property_id ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reservation:', error);
      return NextResponse.json(
        { error: 'Failed to create reservation' },
        { status: 500 }
      );
    }

    // Google Calendarにイベント作成（失敗しても予約作成は成功扱い）
    const calendarEventId = await createCalendarEvent({
      reservationId: reservation.id,
      secretCode: reservation.secret_code,
      doorPin: reservation.door_pin,
      checkInDate: reservation.check_in_date,
      checkOutDate: reservation.check_out_date,
      guestName: reservation.guest_name,
    });

    if (calendarEventId) {
      await supabase
        .from('reservations')
        .update({ google_calendar_event_id: calendarEventId })
        .eq('id', reservation.id);
    }

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reservations
 * Bulk update reservations (e.g. archive/unarchive)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = BulkActionReservationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { ids, is_archived } = validation.data;
    const supabase = await createClient();

    const { error } = await supabase
      .from('reservations')
      .update({ is_archived })
      .in('id', ids);

    if (error) {
      console.error('Error updating reservations:', error);
      return NextResponse.json(
        { error: 'Failed to update reservations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reservations
 * Bulk delete reservations
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = BulkActionReservationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { ids } = validation.data;
    const supabase = await createClient();

    // Google Calendarイベントを先に取得して削除
    const { data: reservations } = await supabase
      .from('reservations')
      .select('google_calendar_event_id')
      .in('id', ids);

    if (reservations) {
      await Promise.all(
        reservations
          .filter((r) => r.google_calendar_event_id)
          .map((r) => deleteCalendarEvent(r.google_calendar_event_id!))
      );
    }

    const { error } = await supabase
      .from('reservations')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Error deleting reservations:', error);
      return NextResponse.json(
        { error: 'Failed to delete reservations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
