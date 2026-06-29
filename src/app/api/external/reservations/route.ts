import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { generateSecretCode } from '@/lib/utils/secret-code';
import { createCalendarEvent } from '@/lib/google-calendar/client';
import { registerSwitchBotKey } from '@/lib/switchbot/client';
import { z } from 'zod';

const CreateExternalReservationSchema = z.object({
  check_in_date: z.string().min(1, 'チェックイン日は必須です'),
  check_out_date: z.string().optional().nullable(),
  guest_name: z.string().optional().nullable(),
  guest_contact: z.string().optional().nullable(),
  stay_type: z.enum(['宿泊', 'デイユース']).default('宿泊'),
  property_id: z.string().uuid().optional().nullable(),
  door_pin: z.string().optional(),
});

function generateDoorPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.EXTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const validation = CreateExternalReservationSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }

  const { check_in_date, check_out_date, guest_name, guest_contact, stay_type, property_id, door_pin: providedPin } =
    validation.data;
  const door_pin = providedPin ?? generateDoorPin();

  const supabase = await createClient();

  let googleCalendarId: string | null = null;
  let propertyName: string | null = null;
  let ciTime = '15:00';
  let coTime = '11:00';
  let switchbotDeviceId: string | null = null;

  if (property_id) {
    const { data: prop } = await supabase
      .from('properties')
      .select('name, google_calendar_id, switchbot_keypad_device_id, check_in_time, check_out_time')
      .eq('id', property_id)
      .single();
    if (prop) {
      propertyName = prop.name ?? null;
      googleCalendarId = prop.google_calendar_id;
      switchbotDeviceId = prop.switchbot_keypad_device_id;
      if (prop.check_in_time) ciTime = prop.check_in_time;
      if (prop.check_out_time) coTime = prop.check_out_time;
    }
  }

  let secret_code = generateSecretCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await supabase.from('reservations').select('id').eq('secret_code', secret_code).single();
    if (!existing) break;
    secret_code = generateSecretCode();
    attempts++;
  }
  if (attempts === 5) {
    return NextResponse.json({ error: 'Failed to generate unique secret code' }, { status: 500 });
  }

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
    } catch {
      // Whereby失敗はスキップ
    }
  }

  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({
      door_pin,
      secret_code,
      whereby_room_url,
      whereby_host_room_url,
      check_in_date,
      check_out_date: check_out_date ?? null,
      guest_name: guest_name ?? null,
      guest_contact: guest_contact ?? null,
      stay_type,
      property_id: property_id ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
  }

  const calendarEventId = await createCalendarEvent({
    reservationId: reservation.id,
    secretCode: reservation.secret_code,
    doorPin: reservation.door_pin,
    checkInDate: reservation.check_in_date,
    checkOutDate: reservation.check_out_date,
    guestName: reservation.guest_name,
    propertyName,
    calendarId: googleCalendarId,
  });
  if (calendarEventId) {
    await supabase.from('reservations').update({ google_calendar_event_id: calendarEventId }).eq('id', reservation.id);
  }

  if (switchbotDeviceId) {
    try {
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
    } catch {
      // SwitchBot失敗はスキップ
    }
  }

  const checkinUrl = `${process.env.NEXT_PUBLIC_ORIGIN}/checkin/${reservation.secret_code}`;

  return NextResponse.json(
    {
      reservation,
      secret_code: reservation.secret_code,
      door_pin: reservation.door_pin,
      checkin_url: checkinUrl,
    },
    { status: 201 }
  );
}
