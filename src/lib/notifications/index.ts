import { sendGmailNotification } from './gmail';
import { sendLineNotification } from './line';

export interface CheckinNotificationData {
  reservationId: string;
  guestName: string | null;
  checkInDate: string | null;
  secretCode: string;
  propertyName?: string | null;
}

export async function sendCheckinNotifications(data: CheckinNotificationData): Promise<void> {
  // 両方並列で送信（片方失敗しても止まらない）
  const results = await Promise.allSettled([
    sendGmailNotification(data),
    sendLineNotification(data),
  ]);

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`[notifications] channel[${i}] failed:`, result.reason);
    }
  });
}
