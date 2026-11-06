import crypto from 'crypto';

const SESSION_COOKIE = 'baha_fb_session';

function getSessionSecret() {
  return process.env.SESSION_SECRET || process.env.META_APP_SECRET || 'baha-session-secret-change-me';
}

export function createFacebookSession(user: { id: string; email: string; name: string; role: string }) {
  const payload = Buffer.from(JSON.stringify({
    ...user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function readFacebookSession(value?: string) {
  if (!value) return undefined;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return undefined;
  const expected = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return undefined;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.exp > Date.now() ? data : undefined;
  } catch {
    return undefined;
  }
}

export const FACEBOOK_SESSION_COOKIE = SESSION_COOKIE;
