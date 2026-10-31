// tests/auth.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSessionToken,
  verifySessionToken,
  createWsTicket,
  verifyWsTicket,
  parseCookies,
  buildSessionCookie,
  buildClearSessionCookie,
  verifyGoogleIdToken
} from '../cloudflare-worker/src/auth.js';

test('1. Tạo và xác thực session token bằng HMAC-SHA256', async () => {
  const secret = 'test-secret-key-123456';
  const payload = {
    userId: 'usr_abc123',
    googleSub: '10987654321',
    displayName: 'Nguyễn Văn A',
    email: 'a@example.com'
  };

  const token = await createSessionToken(payload, secret, 3600);
  assert.equal(typeof token, 'string');
  assert.equal(token.split('.').length, 3);

  const verified = await verifySessionToken(token, secret);
  assert.ok(verified);
  assert.equal(verified.userId, 'usr_abc123');
  assert.equal(verified.googleSub, '10987654321');
  assert.equal(verified.displayName, 'Nguyễn Văn A');
  assert.equal(verified.email, 'a@example.com');
  assert.ok(verified.exp > Math.floor(Date.now() / 1000));
});

test('2. Từ chối token bị sửa đổi (tampered) hoặc sai secret', async () => {
  const secret1 = 'secret-1';
  const secret2 = 'secret-2';

  const token = await createSessionToken({ userId: 'u1' }, secret1);

  // Thử verify bằng secret khác
  const verifiedWrongSecret = await verifySessionToken(token, secret2);
  assert.equal(verifiedWrongSecret, null);

  // Sửa payload giả mạo
  const parts = token.split('.');
  const tamperedPayload = Buffer.from(JSON.stringify({ userId: 'hacked_admin' })).toString('base64url');
  const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

  const verifiedTampered = await verifySessionToken(tamperedToken, secret1);
  assert.equal(verifiedTampered, null);
});

test('3. Token hết hạn bị từ chối', async () => {
  const secret = 'secret-expiry';
  // Token hết hạn 5 giây trước
  const token = await createSessionToken({ userId: 'u1' }, secret, -5);

  const verified = await verifySessionToken(token, secret);
  assert.equal(verified, null);
});

test('4. Parse và tạo Cookie HttpOnly, Secure, SameSite', () => {
  const cookieStr = buildSessionCookie('sample_token_xyz', 86400, true);
  assert.ok(cookieStr.includes('windhub_session=sample_token_xyz'));
  assert.ok(cookieStr.includes('HttpOnly'));
  assert.ok(cookieStr.includes('SameSite=Lax'));
  assert.ok(cookieStr.includes('Secure'));
  assert.ok(cookieStr.includes('Max-Age=86400'));

  const parsed = parseCookies('foo=bar; windhub_session=sample_token_xyz; other=123');
  assert.equal(parsed.foo, 'bar');
  assert.equal(parsed.windhub_session, 'sample_token_xyz');
  assert.equal(parsed.other, '123');

  const clearCookie = buildClearSessionCookie();
  assert.ok(clearCookie.includes('Max-Age=0'));
});

test('5. Mock Google ID Token trong môi trường test', async () => {
  const env = { ALLOW_MOCK_AUTH: 'true' };
  // Mock JWT
  const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: 'mock_google_auth',
    sub: 'google_mock_sub_999',
    email: 'mock@windhub.vn',
    name: 'Bác Thợ Rèn'
  })).toString('base64url');
  const mockToken = `${header}.${payload}.mock_sig`;

  const verified = await verifyGoogleIdToken(mockToken, env);
  assert.equal(verified.sub, 'google_mock_sub_999');
  assert.equal(verified.email, 'mock@windhub.vn');
  assert.equal(verified.name, 'Bác Thợ Rèn');
});

test('6. Từ chối xác thực Google ID token khi thiếu GOOGLE_CLIENT_ID', async () => {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: 'https://accounts.google.com',
    aud: 'client-123.apps.googleusercontent.com',
    sub: '1234567890',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  })).toString('base64url');
  const token = `${header}.${payload}.sig`;

  await assert.rejects(
    async () => {
      await verifyGoogleIdToken(token, {}); // missing GOOGLE_CLIENT_ID
    },
    /GOOGLE_CLIENT_ID is not configured/
  );
});

test('7. Từ chối khi aud không khớp với GOOGLE_CLIENT_ID', async () => {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: 'https://accounts.google.com',
    aud: 'malicious-client.apps.googleusercontent.com',
    sub: '1234567890',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  })).toString('base64url');
  const token = `${header}.${payload}.sig`;

  await assert.rejects(
    async () => {
      await verifyGoogleIdToken(token, { GOOGLE_CLIENT_ID: 'windhub-official.apps.googleusercontent.com' });
    },
    /Audience mismatch/
  );
});

test('8. Từ chối token có iss không thuộc Google hợp lệ', async () => {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: 'https://fake-google-auth.com',
    aud: 'windhub.apps.googleusercontent.com',
    sub: '1234567890',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  })).toString('base64url');
  const token = `${header}.${payload}.sig`;

  await assert.rejects(
    async () => {
      await verifyGoogleIdToken(token, { GOOGLE_CLIENT_ID: 'windhub.apps.googleusercontent.com' });
    },
    /Invalid issuer/
  );
});

test('9. Từ chối token thiếu hoặc rỗng sub', async () => {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: 'https://accounts.google.com',
    aud: 'windhub.apps.googleusercontent.com',
    sub: '   ',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  })).toString('base64url');
  const token = `${header}.${payload}.sig`;

  await assert.rejects(
    async () => {
      await verifyGoogleIdToken(token, { GOOGLE_CLIENT_ID: 'windhub.apps.googleusercontent.com' });
    },
    /Missing or invalid sub/
  );
});

test('10. Ném lỗi nếu SESSION_SECRET không được cấu hình', async () => {
  await assert.rejects(
    async () => {
      await createSessionToken({ userId: 'u1' }, null);
    },
    /SESSION_SECRET is not configured/
  );

  await assert.rejects(
    async () => {
      await verifySessionToken('header.payload.sig', '');
    },
    /SESSION_SECRET is not configured/
  );
});

test('11. Cấp phát và xác minh one-time WebSocket ticket', async () => {
  const secret = 'strong_session_secret_for_ticket_test';
  const player = {
    userId: 'usr_tk_123',
    googleSub: 'gsub_998877',
    displayName: 'Thợ Rèn Làng'
  };

  const ticket = await createWsTicket(player, secret, 60);
  assert.equal(typeof ticket, 'string');

  const verified = await verifyWsTicket(ticket, secret);
  assert.ok(verified);
  assert.equal(verified.type, 'WS_TICKET');
  assert.equal(verified.userId, 'usr_tk_123');
  assert.equal(verified.googleSub, 'gsub_998877');
  assert.equal(verified.displayName, 'Thợ Rèn Làng');
  assert.ok(verified.jti);
  assert.ok(verified.exp > Math.floor(Date.now() / 1000));
});

test('12. Từ chối ticket quá hạn hoặc sai secret', async () => {
  const secret1 = 'secret-tk-1';
  const secret2 = 'secret-tk-2';

  const ticket = await createWsTicket({ userId: 'u1', googleSub: 's1' }, secret1, -10); // Đã hết hạn
  const verifiedExpired = await verifyWsTicket(ticket, secret1);
  assert.equal(verifiedExpired, null);

  const validTicket = await createWsTicket({ userId: 'u1', googleSub: 's1' }, secret1, 60);
  const verifiedWrongSecret = await verifyWsTicket(validTicket, secret2);
  assert.equal(verifiedWrongSecret, null);
});
