import { google } from 'googleapis';

function getCalendarClient() {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

const DEFAULT_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? 'primary';

interface ReservationEvent {
  reservationId: string;
  secretCode: string;
  doorPin: string;
  checkInDate?: string | null;   // YYYY-MM-DD
  checkOutDate?: string | null;  // YYYY-MM-DD
  guestName?: string | null;
  calendarId?: string | null;
}

/** 予約をGoogleカレンダーに追加してイベントIDを返す */
export async function createCalendarEvent(reservation: ReservationEvent): Promise<string | null> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return null;
  }

  try {
    const calendar = getCalendarClient();
    const targetCalendarId = reservation.calendarId || DEFAULT_CALENDAR_ID;

    const title = reservation.guestName
      ? `【チェックイン】${reservation.guestName}`
      : `【チェックイン】${reservation.secretCode}`;

    // 日付がない場合は今日の日付を使用
    const checkIn = reservation.checkInDate ?? new Date().toISOString().split('T')[0];
    const checkOut = reservation.checkOutDate ?? checkIn;

    const event = await calendar.events.insert({
      calendarId: targetCalendarId,
      requestBody: {
        summary: title,
        description: [
          `Secret Code: ${reservation.secretCode}`,
          `ドアPIN: ${reservation.doorPin}`,
          `予約ID: ${reservation.reservationId}`,
        ].join('\n'),
        start: { date: checkIn },
        end: { date: checkOut },
        colorId: '2', // 緑
      },
    });

    return event.data.id ?? null;
  } catch (err) {
    console.error('Google Calendar event creation failed:', err);
    return null;
  }
}

/** Googleカレンダーのイベントを削除する */
export async function deleteCalendarEvent(eventId: string, calendarId?: string | null): Promise<void> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return;
  }

  try {
    const calendar = getCalendarClient();
    const targetCalendarId = calendarId || DEFAULT_CALENDAR_ID;
    await calendar.events.delete({ calendarId: targetCalendarId, eventId });
  } catch (err) {
    console.error('Google Calendar event deletion failed:', err);
  }
}

/** 指定期間内のイベントを取得する */
export async function getCalendarEvents(calendarId: string | null, timeMin: string, timeMax: string) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return [];
  }
  try {
    const calendar = getCalendarClient();
    const targetCalendarId = calendarId || DEFAULT_CALENDAR_ID;
    
    const res = await calendar.events.list({
      calendarId: targetCalendarId,
      timeMin: new Date(timeMin).toISOString(),
      timeMax: new Date(timeMax).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    return res.data.items || [];
  } catch (err) {
    console.error('Google Calendar event fetch failed:', err);
    return [];
  }
}
