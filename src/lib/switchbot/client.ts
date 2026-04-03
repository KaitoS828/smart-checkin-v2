import crypto from 'crypto';

function buildHeaders() {
  const token = process.env.SWITCHBOT_TOKEN!;
  const secret = process.env.SWITCHBOT_SECRET!;
  const t = Date.now().toString();
  const nonce = crypto.randomUUID();
  const data = token + t + nonce;
  const sign = crypto.createHmac('sha256', secret).update(data).digest('base64').toUpperCase();

  return {
    Authorization: token,
    sign,
    t,
    nonce,
    'Content-Type': 'application/json',
  };
}

function isTokenConfigured(): boolean {
  return !!(process.env.SWITCHBOT_TOKEN && process.env.SWITCHBOT_SECRET);
}

/**
 * キーパッドに時間限定パスコードを登録する
 * チェックイン時刻 〜 チェックアウト時刻 (JST) で有効
 *
 * @param deviceId    キーパッドのデバイスID
 * @param name        識別名（secret_code など）
 * @param password    PINコード（door_pin）
 * @param checkInDate  "YYYY-MM-DD"
 * @param checkOutDate "YYYY-MM-DD" | null（nullの場合はチェックイン翌日）
 * @param checkInTime  "HH:MM" JST（デフォルト: 15:00）
 * @param checkOutTime "HH:MM" JST（デフォルト: 11:00）
 * @returns SwitchBot keyId（削除時に使用）、スキップ時は null
 */
export async function registerSwitchBotKey(
  deviceId: string,
  name: string,
  password: string,
  checkInDate: string,
  checkOutDate: string | null,
  checkInTime = '15:00',
  checkOutTime = '11:00'
): Promise<number | null> {
  if (!isTokenConfigured()) {
    console.warn('SwitchBot token/secret not configured, skipping key registration');
    return null;
  }

  const startDate = new Date(`${checkInDate}T${checkInTime}:00+09:00`);
  const endDateStr = checkOutDate ?? addDays(checkInDate, 1);
  const endDate = new Date(`${endDateStr}T${checkOutTime}:00+09:00`);

  const res = await fetch(`https://api.switch-bot.com/v1.1/devices/${deviceId}/commands`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      command: 'createKey',
      parameter: {
        name,
        type: 'timeLimit',
        password,
        startTime: Math.floor(startDate.getTime() / 1000),
        endTime: Math.floor(endDate.getTime() / 1000),
      },
      commandType: 'command',
    }),
  });

  const data = await res.json();
  if (data.statusCode !== 100) {
    throw new Error(`SwitchBot createKey error: ${JSON.stringify(data)}`);
  }

  return data.body?.keyId ?? null;
}

/**
 * キーパッドからパスコードを削除する
 */
export async function deleteSwitchBotKey(deviceId: string, keyId: number): Promise<void> {
  if (!isTokenConfigured()) return;

  const res = await fetch(`https://api.switch-bot.com/v1.1/devices/${deviceId}/commands`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      command: 'deleteKey',
      parameter: { id: keyId },
      commandType: 'command',
    }),
  });

  const data = await res.json();
  if (data.statusCode !== 100) {
    throw new Error(`SwitchBot deleteKey error: ${JSON.stringify(data)}`);
  }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
