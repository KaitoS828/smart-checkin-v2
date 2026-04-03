// Web Crypto API only — compatible with Edge Runtime (middleware)

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr;
}

let _cachedSecret: string | null = null;

function getSessionSecret(): string {
  if (_cachedSecret) return _cachedSecret;

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[security] SESSION_SECRET environment variable is required in production');
    }
    console.warn('[security] SESSION_SECRET not set. Using random value — sessions will not persist across restarts.');
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    _cachedSecret = toHex(bytes);
    return _cachedSecret;
  }
  _cachedSecret = secret;
  return _cachedSecret;
}

async function getHmacKey(): Promise<CryptoKey> {
  const keyBytes = new TextEncoder().encode(getSessionSecret());
  return crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSessionToken(): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = toHex(bytes);

  const key = await getHmacKey();
  const tokenBytes = new TextEncoder().encode(token);
  const sigBuf = await crypto.subtle.sign('HMAC', key, tokenBytes.buffer as ArrayBuffer);
  const sig = toHex(new Uint8Array(sigBuf));

  return `${token}.${sig}`;
}

export async function verifySessionToken(value: string): Promise<boolean> {
  if (!value) return false;

  const dotIndex = value.lastIndexOf('.');
  if (dotIndex === -1) return false;

  const token = value.slice(0, dotIndex);
  const sig = value.slice(dotIndex + 1);

  if (!token || !sig) return false;

  try {
    const key = await getHmacKey();
    const sigBytes = fromHex(sig);
    const tokenBytes = new TextEncoder().encode(token);
    return await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes.buffer as ArrayBuffer,
      tokenBytes.buffer as ArrayBuffer
    );
  } catch {
    return false;
  }
}
