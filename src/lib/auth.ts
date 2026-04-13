// Password hashing using Web Crypto API (PBKDF2 + SHA-256)
// Works in all modern browsers with no external dependencies.

const ITERATIONS = 100_000;
const KEY_LENGTH = 256; // bits
const HASH_ALGORITHM = 'SHA-256';

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const pairs = hex.match(/.{2}/g) ?? [];
  return new Uint8Array(pairs.map((byte) => parseInt(byte, 16)));
}

async function deriveKey(password: string, salt: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: HASH_ALGORITHM,
      salt,
      iterations: ITERATIONS,
    },
    keyMaterial,
    KEY_LENGTH
  );

  return bufferToHex(bits);
}

/** Hash a plain-text password. Returns { hash, salt } — store both. */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveKey(password, salt);
  return { hash, salt: bufferToHex(salt.buffer) };
}

/** Verify a plain-text password against a stored hash + salt. */
export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  try {
    const salt = hexToBuffer(storedSalt);
    const hash = await deriveKey(password, salt);
    return hash === storedHash;
  } catch {
    return false;
  }
}
