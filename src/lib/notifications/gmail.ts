import nodemailer from 'nodemailer';

interface CheckinNotificationData {
  reservationId: string;
  guestName: string | null;
  checkInDate: string | null;
  secretCode: string;
  propertyName?: string | null;
}

export async function sendGmailNotification(data: CheckinNotificationData): Promise<void> {
  const user = process.env.GMAIL_USER;
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  const toEmail = process.env.NOTIFICATION_EMAIL || user;

  if (!user || !appPassword) {
    console.warn('[notifications] GMAIL_USER or GMAIL_APP_PASSWORD not set. Skipping Gmail notification.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass: appPassword },
  });

  const dashboardUrl = `${process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000'}/admin/dashboard`;
  const guestLabel = data.guestName ?? '（未登録）';
  const dateLabel = data.checkInDate
    ? new Date(data.checkInDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    : '不明';
  const propertyLabel = data.propertyName ? `【${data.propertyName}】` : '';

  await transporter.sendMail({
    from: `Smart Check-in <${user}>`,
    to: toEmail,
    subject: `${propertyLabel}チェックイン開始 — ${guestLabel}`,
    text: [
      `ゲストがチェックインを開始しました。`,
      ``,
      `■ 宿泊者名: ${guestLabel}`,
      `■ チェックイン日: ${dateLabel}`,
      `■ シークレットコード: ${data.secretCode}`,
      ``,
      `管理画面でビデオ通話に応答してください。`,
      `${dashboardUrl}`,
    ].join('\n'),
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#111;margin-bottom:4px;">📍 チェックイン開始通知</h2>
        ${data.propertyName ? `<p style="color:#6b7280;font-size:13px;margin:0 0 16px;">${data.propertyName}</p>` : ''}
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%;">宿泊者名</td><td style="font-weight:600;">${guestLabel}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">チェックイン日</td><td>${dateLabel}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">シークレットコード</td><td style="font-family:monospace;font-weight:700;">${data.secretCode}</td></tr>
        </table>
        <a href="${dashboardUrl}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">管理画面を開く</a>
      </div>
    `,
  });

  console.log(`[notifications] Gmail sent to ${toEmail}`);
}
