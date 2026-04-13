import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { generateSecretCode } from '@/lib/utils/secret-code';
import { createCalendarEvent, deleteCalendarEvent, getCalendarEvents } from '@/lib/google-calendar/client';
import { registerSwitchBotKey, deleteSwitchBotKey } from '@/lib/switchbot/client';
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
      return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
    }

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/reservations
 * Create a new reservation with double booking prevention
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
    const supabase = await createClient();

    // 1. カレンダーIDの取得とダブルブッキング防止
    let googleCalendarId: string | null = null;
    let ciTime = '15:00';
    let coTime = '11:00';
    let switchbotDeviceId: string | null = null;

    if (property_id) {
      const { data: prop } = await supabase
        .from('properties')
        .select('google_calendar_id, switchbot_keypad_device_id, check_in_time, check_out_time')
        .eq('id', property_id)
        .single();
      
      if (prop) {
        googleCalendarId = prop.google_calendar_id;
        switchbotDeviceId = prop.switchbot_keypad_device_id;
        if (prop.check_in_time) ciTime = prop.check_in_time;
        if (prop.check_out_time) coTime = prop.check_out_time;
      }
    }

    if (check_in_date && check_out_date) {
      // 既存のイベントを取得 (日本のタイムゾーンを想定)
      const timeMin = `${check_in_date}T00:00:00+09:00`;
      const timeMax = `${check_out_date}T00:00:00+09:00`;
      const events = await getCalendarEvents(googleCalendarId, timeMin, timeMax);
      
      if (events.length > 0) {
        return NextResponse.json(
          { error: '指定された日程には既に予約（カレンダーの予定）が入っています' },
          { status: 409 }
        );
      }
    }

    // 2. 予約の作成 (Secret Code 生成)
    let secret_code = generateSecretCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase.from('reservations').select('id').eq('secret_code', secret_code).single();
      if (!existing) break;
      secret_code = generateSecretCode();
      attempts++;
    }
    if (attempts === 5) return NextResponse.json({ error: 'Failed to generate unique secret code' }, { status: 500 });

    let whereby_room_url = null;
    let whereby_host_room_url = null;

    if (process.env.WHEREBY_API_KEY) {
      try {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);
        const wherebyResponse = await fetch('https://api.whereby.dev/v1/meetings', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.WHEREBY_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ isLocked: true, endDate: endDate.toISOString(), fields: ['hostRoomUrl'] }),
        });
        if (wherebyResponse.ok) {
          const data = await wherebyResponse.json();
          whereby_room_url = data.roomUrl;
          whereby_host_room_url = data.hostRoomUrl;
        }
      } catch (err) {
        console.error('Failed to create whereby room:', err);
      }
    } else {
      whereby_room_url = 'https://demo.whereby.com/smart-checkin-demo';
      whereby_host_room_url = 'https://demo.whereby.com/smart-checkin-demo';
    }

    // DBへの保存
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
      return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
    }

    // 3. カレンダーへイベントを書き込む
    const calendarEventId = await createCalendarEvent({
      reservationId: reservation.id,
      secretCode: reservation.secret_code,
      doorPin: reservation.door_pin,
      checkInDate: reservation.check_in_date,
      checkOutDate: reservation.check_out_date,
      guestName: reservation.guest_name,
      calendarId: googleCalendarId,
    });

    if (calendarEventId) {
      await supabase.from('reservations').update({ google_calendar_event_id: calendarEventId }).eq('id', reservation.id);
    }

    // 4. SwitchBotデバイスへの登録
    try {
      if (switchbotDeviceId) {
        const switchbotKeyId = await registerSwitchBotKey(
          switchbotDeviceId,
          reservation.secret_code,
          reservation.door_pin,
          reservation.check_in_date,
          reservation.check_out_date,
          ciTime,
          coTime
        );
        if (switchbotKeyId !== null) {
          await supabase.from('reservations').update({ switchbot_key_id: switchbotKeyId }).eq('id', reservation.id);
        }
      }
    } catch (err) {
      console.error('Failed to register SwitchBot key:', err);
    }

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/reservations
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = BulkActionReservationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }
    const { ids, is_archived } = validation.data;
    const supabase = await createClient();
    const { error } = await supabase.from('reservations').update({ is_archived }).in('id', ids);
    if (error) return NextResponse.json({ error: 'Failed to update reservations' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/reservations
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = BulkActionReservationSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

    const { ids } = validation.data;
    const supabase = await createClient();

    const { data: reservations } = await supabase
      .from('reservations')
      .select('google_calendar_event_id, switchbot_key_id, property_id')
      .in('id', ids);

    if (reservations) {
      const propertyIds = [...new Set(reservations.map((r) => r.property_id).filter(Boolean))];
      const propertyDeviceMap: Record<string, string> = {};
      const propertyCalendarMap: Record<string, string> = {};
      
      if (propertyIds.length > 0) {
        const { data: props } = await supabase
          .from('properties')
          .select('id, switchbot_keypad_device_id, google_calendar_id')
          .in('id', propertyIds);
          
        props?.forEach((p) => {
          if (p.switchbot_keypad_device_id) propertyDeviceMap[p.id] = p.switchbot_keypad_device_id;
          if (p.google_calendar_id) propertyCalendarMap[p.id] = p.google_calendar_id;
        });
      }

      await Promise.all([
        ...reservations
          .filter((r) => r.google_calendar_event_id)
          .map((r) => deleteCalendarEvent(
             r.google_calendar_event_id!, 
             r.property_id ? propertyCalendarMap[r.property_id] : null
          )),
        ...reservations
          .filter((r) => r.switchbot_key_id && r.property_id && propertyDeviceMap[r.property_id])
          .map((r) => deleteSwitchBotKey(propertyDeviceMap[r.property_id!], r.switchbot_key_id!).catch((err) =>
            console.error('Failed to delete SwitchBot key:', err)
          )),
      ]);
    }

    const { error } = await supabase.from('reservations').delete().in('id', ids);
    if (error) return NextResponse.json({ error: 'Failed to delete reservations' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
