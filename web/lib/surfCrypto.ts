import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minute

function getKey(): Buffer {
  const s = process.env.SESSION_PROXY_SECRET;
  if (!s) throw new Error('SESSION_PROXY_SECRET env missing');
  return createHash('sha256').update(s).digest();
}

/** SR1.<base64url-json> code ko validate karke session JSON nikalo */
export function decodeSessionCode(code: string): {
  domain: string; url?: string; cookies: { n: string; val: string }[]; storage?: Record<string, string>;
} {
  const c = code.trim();
  if (!c.startsWith('SR1.')) throw new Error('Ye valid session code nahi lag raha (SR1. se shuru hona chahiye).');
  const b64 = c.slice(4).replace(/-/g, '+').replace(/_/g, '/');
  let json: string;
  try {
    json = Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    throw new Error('Session code decode nahi hua.');
  }
  const sess = JSON.parse(json);
  if (!sess.domain || !Array.isArray(sess.cookies)) throw new Error('Session code adhura hai.');
  return sess;
}

/** Session JSON -> short-lived opaque token (stateless, AES-256-GCM). Server kuch store nahi karta. */
export function mintToken(sessionJson: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(sessionJson, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const envelope = JSON.stringify({
    iv: iv.toString('base64'), tag: tag.toString('base64'),
    exp: Date.now() + TOKEN_TTL_MS, data: enc.toString('base64'),
  });
  return Buffer.from(envelope, 'utf8').toString('base64url');
}

/** Token -> session JSON (expiry + auth check ke saath) */
export function readToken(token: string): string {
  const key = getKey();
  let env: { iv: string; tag: string; exp: number; data: string };
  try {
    env = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
  } catch {
    throw new Error('Token invalid hai.');
  }
  if (!env.exp || Date.now() > env.exp) throw new Error('Token expire ho gaya — dobara session code daalo.');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(env.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(env.tag, 'base64'));
  const dec = Buffer.concat([decipher.update(Buffer.from(env.data, 'base64')), decipher.final()]);
  return dec.toString('utf8');
}
