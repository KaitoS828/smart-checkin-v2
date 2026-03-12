interface CheckinNotificationData {
  reservationId: string;
  guestName: string | null;
  checkInDate: string | null;
  secretCode: string;
  propertyName?: string | null;
}

export async function sendLineNotification(data: CheckinNotificationData): Promise<void> {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;

  if (!channelAccessToken || !userId) {
    console.warn('[notifications] LINE_CHANNEL_ACCESS_TOKEN or LINE_USER_ID not set. Skipping LINE notification.');
    return;
  }

  const guestLabel = data.guestName ?? '（未登録）';
  const dateLabel = data.checkInDate
    ? new Date(data.checkInDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
    : '不明';
  const propertyLabel = data.propertyName ? `【${data.propertyName}】\n` : '';

  const message =
    `📍 ${propertyLabel}チェックイン開始\n` +
    `━━━━━━━━━━━━━━━\n` +
    `👤 ${guestLabel}\n` +
    `📅 ${dateLabel}\n` +
    `🔑 ${data.secretCode}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `管理画面でビデオ通話に応答してください。`;

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: 'text', text: message }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[notifications] LINE push failed: ${res.status} ${body}`);
    return;
  }

  console.log(`[notifications] LINE push sent to ${userId}`);
}
