import { randomBytes, scrypt as rawScrypt, timingSafeEqual } from 'node:crypto';
const params = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    rawScrypt(password, salt, 64, params, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
}
export async function hashPassword(password: string) {
  if (password.length < 14 || password.length > 256)
    throw new Error('Password must contain 14–256 characters');
  const salt = randomBytes(16);
  return `scrypt$${salt.toString('hex')}$${(await derive(password, salt)).toString('hex')}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [kind, salt, hash] = stored.split('$');
  if (
    kind !== 'scrypt' ||
    !/^[a-f0-9]{32}$/.test(salt || '') ||
    !/^[a-f0-9]{128}$/.test(hash || '') ||
    password.length > 256
  )
    return false;
  return timingSafeEqual(
    await derive(password, Buffer.from(salt, 'hex')),
    Buffer.from(hash, 'hex'),
  );
}
// Same cost for unknown accounts; this is not a usable account password.
export const dummyHash = 'scrypt$' + '0'.repeat(32) + '$' + '0'.repeat(128);
