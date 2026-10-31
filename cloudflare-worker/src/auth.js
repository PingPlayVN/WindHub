// cloudflare-worker/src/auth.js

// Utilities for Base64URL encoding/decoding
export function base64UrlEncode(bufferOrString) {
  let bytes;
  if (typeof bufferOrString === 'string') {
    bytes = new TextEncoder().encode(bufferOrString);
  } else if (bufferOrString instanceof Uint8Array) {
    bytes = bufferOrString;
  } else {
    bytes = new Uint8Array(bufferOrString);
  }

  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function base64UrlDecodeToString(str) {
  const bytes = base64UrlDecode(str);
  return new TextDecoder().decode(bytes);
}

// Memory cache for Google's JWKS
let jwksCache = {
  keys: null,
  expiresAt: 0
};

export async function fetchGoogleJWKS(fetchFn = fetch) {
  const now = Date.now();
  if (jwksCache.keys && jwksCache.expiresAt > now) {
    return jwksCache.keys;
  }

  try {
    const res = await fetchFn('https://www.googleapis.com/oauth2/v3/certs', {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`Google certs returned ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data.keys)) {
      // Cache for 6 hours
      jwksCache = {
        keys: data.keys,
        expiresAt: now + 6 * 3600 * 1000
      };
      return data.keys;
    }
    throw new Error('Invalid JWKS response');
  } catch (err) {
    console.error('[Auth] Error fetching Google JWKS:', err);
    if (jwksCache.keys) return jwksCache.keys; // fallback to stale cache if available
    throw err;
  }
}

export function parseJwtParts(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(base64UrlDecodeToString(parts[0]));
    const payload = JSON.parse(base64UrlDecodeToString(parts[1]));
    return { header, payload, signedContent: `${parts[0]}.${parts[1]}`, signatureStr: parts[2] };
  } catch {
    return null;
  }
}

/**
 * Verify Google ID Token
 */
export async function verifyGoogleIdToken(idToken, env = {}, fetchFn = fetch) {
  if (!idToken) throw new Error('Missing ID token');

  const parsed = parseJwtParts(idToken);
  if (!parsed) throw new Error('Invalid JWT format');

  const { header, payload, signedContent, signatureStr } = parsed;

  // 1. Verify Header
  if (header.alg !== 'RS256') {
    throw new Error(`Unsupported alg: ${header.alg}`);
  }

  // Allow mock token in dev/test environment if explicitly flagged
  if (env.ALLOW_MOCK_AUTH === 'true' && payload.iss === 'mock_google_auth') {
    return {
      sub: payload.sub,
      email: payload.email || 'mock@example.com',
      name: payload.name || 'Mock User',
      picture: payload.picture || '',
      email_verified: true
    };
  }

  // 2. Verify Claims
  const validIssuers = ['https://accounts.google.com', 'accounts.google.com'];
  if (!validIssuers.includes(payload.iss)) {
    throw new Error(`Invalid issuer: ${payload.iss}`);
  }

  if (env.GOOGLE_CLIENT_ID && payload.aud !== env.GOOGLE_CLIENT_ID) {
    throw new Error(`Audience mismatch: expected ${env.GOOGLE_CLIENT_ID}, got ${payload.aud}`);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowSec - 60) {
    throw new Error('Token has expired');
  }

  if (!payload.sub) {
    throw new Error('Missing sub in token claims');
  }

  // 3. Verify Signature with Google JWKS
  const keys = await fetchGoogleJWKS(fetchFn);
  const matchingKey = keys.find((k) => k.kid === header.kid);
  if (!matchingKey) {
    throw new Error(`No matching Google public key for kid: ${header.kid}`);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    matchingKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureBytes = base64UrlDecode(signatureStr);
  const signedContentBytes = new TextEncoder().encode(signedContent);

  const isValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    signatureBytes,
    signedContentBytes
  );

  if (!isValid) {
    throw new Error('Google token signature verification failed');
  }

  return {
    sub: payload.sub,
    email: payload.email || '',
    name: payload.name || '',
    picture: payload.picture || '',
    email_verified: Boolean(payload.email_verified)
  };
}

/**
 * Session Token Management (HMAC-SHA256)
 */
async function getHmacKey(secretStr) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secretStr || 'windhub_default_secret_key_change_in_production'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSessionToken(payload, secret, expiresInSeconds = 7 * 86400) {
  const nowSec = Math.floor(Date.now() / 1000);
  const sessionPayload = {
    ...payload,
    iat: nowSec,
    exp: nowSec + expiresInSeconds
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(sessionPayload));
  const signedContent = `${encodedHeader}.${encodedPayload}`;

  const key = await getHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent));
  const encodedSignature = base64UrlEncode(signature);

  return `${signedContent}.${encodedSignature}`;
}

export async function verifySessionToken(token, secret) {
  if (!token || typeof token !== 'string') return null;

  const parsed = parseJwtParts(token);
  if (!parsed) return null;

  const { header, payload, signedContent, signatureStr } = parsed;
  if (header.alg !== 'HS256') return null;

  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowSec) {
    return null; // Expired
  }

  try {
    const key = await getHmacKey(secret);
    const signatureBytes = base64UrlDecode(signatureStr);
    const valid = await crypto.subtle.verify('HMAC', key, signatureBytes, new TextEncoder().encode(signedContent));
    if (!valid) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Cookies helper
 */
export function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  }
  return cookies;
}

export function buildSessionCookie(token, maxAge = 7 * 86400, isSecure = true) {
  let cookie = `windhub_session=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`;
  if (isSecure) {
    cookie += '; Secure';
  }
  return cookie;
}

export function buildClearSessionCookie() {
  return 'windhub_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure';
}

