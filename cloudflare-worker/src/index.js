// cloudflare-worker/src/index.js
import { LotteryRoom } from './LotteryRoom.js';
import { PlayerAccountDO } from './PlayerAccountDO.js';
import {
  verifyGoogleIdToken,
  createSessionToken,
  verifySessionToken,
  createWsTicket,
  verifyWsTicket,
  parseCookies,
  buildSessionCookie,
  buildClearSessionCookie
} from './auth.js';

export { LotteryRoom, PlayerAccountDO };

const FACEBOOK_HOSTS = ['facebook.com', 'fb.com'];

function isFacebookHost(hostname) {
  const host = hostname.toLowerCase();
  return FACEBOOK_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function readMeta(html, names) {
  for (const name of names) {
    const tagPattern = /<meta\b[^>]*>/gi;
    for (const tag of html.matchAll(tagPattern)) {
      const attributes = tag[0];
      const identity = attributes.match(/(?:property|name)=["']([^"']+)["']/i)?.[1];
      const content = attributes.match(/content=["']([^"']*)["']/i)?.[1];
      if (identity?.toLowerCase() === name.toLowerCase() && content) return content.trim();
    }
  }
  return '';
}

function decodeHtml(value) {
  let decoded = String(value || '').replace(/\\\//g, '/').replace(/\\u([0-9a-f]{4})/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
  decoded = decoded.replace(/&(#x?[0-9a-f]+|amp|quot|apos|#x27|#039|lt|gt|nbsp);/gi, (entity, code) => {
    if (code.toLowerCase() === 'amp') return '&';
    if (code.toLowerCase() === 'quot') return '"';
    if (code.toLowerCase() === 'apos' || code.toLowerCase() === '#x27' || code.toLowerCase() === '#039') return "'";
    if (code.toLowerCase() === 'lt') return '<';
    if (code.toLowerCase() === 'gt') return '>';
    if (code.toLowerCase() === 'nbsp') return ' ';
    const number = code.toLowerCase().startsWith('#x') ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return Number.isNaN(number) ? entity : String.fromCodePoint(number);
  });
  return decoded;
}

function decodeMaybeUrl(value) {
  const decoded = decodeHtml(value);
  if (!/%[0-9a-f]{2}/i.test(decoded)) return decoded;
  try { return decodeURIComponent(decoded); } catch { return decoded; }
}

function extractPublicData(html, url) {
  const rawTitle = decodeHtml(readMeta(html, ['og:title', 'twitter:title']));
  const rawDescription = decodeHtml(readMeta(html, ['og:description', 'description', 'twitter:description']));
  const rawAvatar = decodeHtml(readMeta(html, ['og:image', 'twitter:image']))
    || decodeHtml(html.match(/(?:profile_pic|profilePicture|profilePic|avatar|image_uri)[^"']{0,160}["'](https?:\/\/[^"']+)["']/i)?.[1] || '')
    || decodeHtml(html.match(/https?:\\?\/\\?\/[^"'\\ ]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\ ]*)?/i)?.[0] || '');
  const title = /^(?:log in|sign up|đăng nhập|đăng ký)/i.test(rawTitle) ? '' : decodeMaybeUrl(rawTitle);
  const description = /(?:see posts, photos and more on facebook|log in to facebook to start sharing|đăng nhập hoặc đăng ký)/i.test(rawDescription) ? '' : decodeMaybeUrl(rawDescription);
  const avatar = /static\.xx\.fbcdn\.net|facebook\.com\/(?:rsrc\.php|images\/fb_icon)/i.test(rawAvatar) ? '' : decodeMaybeUrl(rawAvatar);
  const canonical = decodeMaybeUrl(readMeta(html, ['og:url'])) || url.href;
  const username = url.pathname.split('/').filter(Boolean)[0] || '';
  const uid = url.searchParams.get('id')?.match(/^\d+$/)?.[0]
    || canonical.match(/-(\d+)\/?$/)?.[1]
    || html.match(/"(?:userID|user_id|profile_id|profileId|entity_id|entityID|ownerID|pageID|page_id|actor_id|target_id)"\s*:\s*"?(\d+)"?/i)?.[1]
    || '';
  const verified = /verified profile|verified page|hồ sơ đã xác minh|trang đã xác minh/i.test(html) ? 'true' : '';
  const transparency = /page transparency|tính minh bạch của trang/i.test(html) ? 'Có trên trang hiện tại' : '';
  const dateText = html.match(/(?:account created|created on|ngày tạo tài khoản|tạo tài khoản)[^.!?]{0,120}/i)?.[0] || '';
  const createdAt = dateText.match(/\b(?:\d{1,2}[./-]\d{1,2}[./-](?:19|20)?\d{2}|(?:19|20)\d{2}[./-]\d{1,2}[./-]\d{1,2})\b/)?.[0] || '';
  const externalWebsite = [...html.matchAll(/<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([^<]*)<\/a>/gi)]
    .map((match) => decodeMaybeUrl(match[1]))
    .find((href) => { try { return !isFacebookHost(new URL(href).hostname); } catch { return false; } }) || '';

  return { name: title, bio: description, avatar, uid: uid === '0' ? '' : uid, username, canonical_url: canonical, website: externalWebsite, verified, page_transparency: transparency, created_at: createdAt };
}

async function fetchPublicPage(url) {
  const response = await fetch(url.href, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WindHubPublicAnalyzer/1.0)', Accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow',
  });
  if (!response.ok) return null;
  return { html: await response.text(), url };
}

function buildPublicVariants(targetUrl) {
  const variants = [targetUrl.href];
  for (const hostname of ['m.facebook.com', 'mbasic.facebook.com', 'touch.facebook.com']) {
    const variant = new URL(targetUrl.href);
    variant.hostname = hostname;
    if (!variants.includes(variant.href)) variants.push(variant.href);
  }
  return variants.map((href) => new URL(href));
}

function mergePublicData(results) {
  const merged = {};
  for (const result of results) {
    for (const [key, value] of Object.entries(result)) {
      if (!merged[key] && value && value !== '0' && value !== 'Not found') merged[key] = value;
    }
  }
  return merged;
}

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://windhub1407.web.app',
  'https://windhub1407.firebaseapp.com'
];

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const configured = (env?.ALLOWED_ORIGINS || env?.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  const allowList = configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS;

  const isAllowed = allowList.includes('*') || (origin && allowList.includes(origin)) || DEFAULT_ALLOWED_ORIGINS.includes(origin);

  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upgrade, X-Requested-With',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };

  if (origin && isAllowed) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else if (allowList.includes('*')) {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
}

// In-memory cache for consumed WebSocket one-time tickets (TTL = 60s)
const consumedTickets = new Map();

function isTicketConsumed(jti) {
  const now = Date.now();
  for (const [id, exp] of consumedTickets.entries()) {
    if (exp < now) consumedTickets.delete(id);
  }
  return consumedTickets.has(jti);
}

function markTicketConsumed(jti, expSec) {
  consumedTickets.set(jti, (expSec || (Math.floor(Date.now() / 1000) + 60)) * 1000);
}

// Lấy thông tin phiên từ Cookie hoặc Bearer Token (Không đọc từ URL query param)
async function getAuthenticatedSession(request, env) {
  const secret = env?.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured on Cloudflare Worker');
  }

  let session = null;

  // 1. Thử từ Cookie
  const cookieHeader = request.headers.get('Cookie');
  const cookies = parseCookies(cookieHeader);
  if (cookies.windhub_session) {
    session = await verifySessionToken(cookies.windhub_session, secret);
  }

  // 2. Thử từ Authorization: Bearer <token>
  if (!session) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      session = await verifySessionToken(token, secret);
    }
  }

  if (!session) return null;

  // 3. Kiểm tra xem phiên đã bị thu hồi do đăng xuất (Session Revocation) hay chưa
  if (env?.PLAYER_ACCOUNT && session.googleSub && session.iat) {
    try {
      const doId = env.PLAYER_ACCOUNT.idFromName(session.googleSub);
      const playerStub = env.PLAYER_ACCOUNT.get(doId);
      const profRes = await playerStub.fetch(`http://internal/profile?userId=${encodeURIComponent(session.userId)}`);
      if (profRes.ok) {
        const data = await profRes.json();
        const lastLogoutAt = data.profile?.user?.lastLogoutAt || 0;
        if (lastLogoutAt && session.iat * 1000 < lastLogoutAt) {
          // Token được phát hành TRƯỚC thời điểm đăng xuất cuối cùng -> Phiên đã bị vô hiệu hóa!
          return null;
        }
      }
    } catch {
      // Bỏ qua lỗi kết nối nội bộ DO
    }
  }

  return session;
}

// Danh sách phòng Tài Xỉu chính thức
const PUBLIC_VILLAGE_ROOMS = [
  { id: 'tai-xiu-30s', name: 'Xóm Đình Truyền Thống', duration: 50, resultDuration: 15, desc: '50 giây chờ cược - Thong thả đàm đạo, ngắm nghía soi cầu' },
  { id: 'tai-xiu-15s', name: 'Chợ Phiên Nhanh', duration: 25, resultDuration: 15, desc: '25 giây chờ cược - Lắc nhanh thắng nhanh, kịch tính nghẹt thở' }
];

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { headers });

    const requestUrl = new URL(request.url);

    // ==========================================
    // 1. AUTH ROUTES (/api/auth/*)
    // ==========================================
    if (requestUrl.pathname.startsWith('/api/auth/')) {
      const authPath = requestUrl.pathname.replace('/api/auth', '');

      // POST /api/auth/google - Đăng nhập tài khoản Google duy nhất
      if (authPath === '/google' && request.method === 'POST') {
        try {
          const body = await request.json().catch(() => ({}));
          const idToken = body.credential || body.idToken || body.token;
          if (!idToken) {
            return Response.json({ ok: false, error: 'Thiếu Google ID token.' }, { status: 400, headers });
          }

          // 1. Xác thực ID token trực tiếp với Google JWKS
          const googleClaims = await verifyGoogleIdToken(idToken, env);
          const googleSub = googleClaims.sub;

          if (!env.PLAYER_ACCOUNT) {
            return Response.json({ ok: false, error: 'Durable Object binding PLAYER_ACCOUNT chưa được cấu hình.' }, { status: 503, headers });
          }

          // 2. Định tuyến đến PlayerAccountDO của người chơi
          const doId = env.PLAYER_ACCOUNT.idFromName(googleSub);
          const playerStub = env.PLAYER_ACCOUNT.get(doId);

          const loginResponse = await playerStub.fetch('http://internal/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              googleSub,
              email: googleClaims.email,
              displayName: googleClaims.name,
              avatarUrl: googleClaims.picture
            })
          });

          if (!loginResponse.ok) {
            return Response.json({ ok: false, error: 'Lỗi khởi tạo tài khoản người chơi.' }, { status: 500, headers });
          }

          const loginData = await loginResponse.json();

          // 3. Cấp phát phiên bảo mật WindHub (Session Token)
          const sessionSecret = env.SESSION_SECRET;
          if (!sessionSecret) {
            return Response.json({ ok: false, error: 'SESSION_SECRET chưa được cấu hình trên Worker.' }, { status: 500, headers });
          }

          const sessionToken = await createSessionToken({
            userId: loginData.user.userId,
            googleSub: loginData.user.googleSub,
            email: loginData.user.email,
            displayName: loginData.user.displayName,
            avatarUrl: loginData.user.avatarUrl
          }, sessionSecret);

          const resHeaders = new Headers(headers);
          const isSecure = requestUrl.protocol === 'https:';
          resHeaders.set('Set-Cookie', buildSessionCookie(sessionToken, 7 * 86400, isSecure));

          return Response.json({
            ok: true,
            sessionToken,
            user: loginData.user,
            balance: loginData.balance,
            dailyReward: loginData.dailyReward
          }, { status: 200, headers: resHeaders });

        } catch (err) {
          console.error('[Auth] Google login error:', err);
          return Response.json({ ok: false, error: err.message || 'Xác thực Google không thành công.' }, { status: 401, headers });
        }
      }

      // POST /api/auth/logout - Đăng xuất tài khoản & Vô hiệu hóa phiên (Session Revocation)
      if (authPath === '/logout' && request.method === 'POST') {
        try {
          const session = await getAuthenticatedSession(request, env);
          if (session && env.PLAYER_ACCOUNT) {
            const doId = env.PLAYER_ACCOUNT.idFromName(session.googleSub);
            const playerStub = env.PLAYER_ACCOUNT.get(doId);
            await playerStub.fetch(`http://internal/logout?userId=${encodeURIComponent(session.userId)}`, { method: 'POST' });
          }
        } catch (err) {
          console.error('[Auth] Logout DO error:', err);
        }

        const resHeaders = new Headers(headers);
        resHeaders.set('Set-Cookie', buildClearSessionCookie());
        return Response.json({ ok: true, message: 'Đã đăng xuất thành công.' }, { headers: resHeaders });
      }

      // GET /api/auth/me - Lấy thông tin phiên hiện tại
      if (authPath === '/me' && request.method === 'GET') {
        try {
          const session = await getAuthenticatedSession(request, env);
          if (!session) {
            return Response.json({ ok: false, authenticated: false, error: 'Chưa đăng nhập hoặc phiên đã hết hạn' }, { status: 401, headers });
          }

          if (!env.PLAYER_ACCOUNT) {
            return Response.json({ ok: true, authenticated: true, user: session, balance: 0 }, { headers });
          }

          const doId = env.PLAYER_ACCOUNT.idFromName(session.googleSub);
          const playerStub = env.PLAYER_ACCOUNT.get(doId);
          const profRes = await playerStub.fetch(`http://internal/profile?userId=${encodeURIComponent(session.userId)}`);
          if (profRes.ok) {
            const data = await profRes.json();
            return Response.json({ ok: true, authenticated: true, ...data.profile }, { headers });
          }

          return Response.json({ ok: true, authenticated: true, user: session, balance: 0 }, { headers });
        } catch (err) {
          console.error('[Auth] /api/auth/me error:', err);
          return Response.json({ ok: false, authenticated: false, error: err.message || 'Lỗi xác thực phiên' }, { status: 401, headers });
        }
      }
    }

    // ==========================================
    // 2. WALLET & REWARD ROUTES (/api/wallet/*, /api/reward/*)
    // ==========================================
    if (requestUrl.pathname.startsWith('/api/wallet/') || requestUrl.pathname.startsWith('/api/reward/')) {
      let session = null;
      try {
        session = await getAuthenticatedSession(request, env);
      } catch (err) {
        return Response.json({ ok: false, error: err.message || 'Yêu cầu đăng nhập tài khoản Google.' }, { status: 401, headers });
      }

      if (!session) {
        return Response.json({ ok: false, error: 'Yêu cầu đăng nhập tài khoản Google.' }, { status: 401, headers });
      }

      if (!env.PLAYER_ACCOUNT) {
        return Response.json({ ok: false, error: 'PLAYER_ACCOUNT binding chưa được cấu hình.' }, { status: 503, headers });
      }

      const doId = env.PLAYER_ACCOUNT.idFromName(session.googleSub);
      const playerStub = env.PLAYER_ACCOUNT.get(doId);

      // GET /api/wallet/transactions
      if (requestUrl.pathname === '/api/wallet/transactions' && request.method === 'GET') {
        const limit = requestUrl.searchParams.get('limit') || '50';
        const doRes = await playerStub.fetch(`http://internal/transactions?userId=${encodeURIComponent(session.userId)}&limit=${limit}`);
        const data = await doRes.json();
        return Response.json(data, { headers });
      }

      // GET /api/wallet/balance
      if (requestUrl.pathname === '/api/wallet/balance' && request.method === 'GET') {
        const doRes = await playerStub.fetch(`http://internal/balance?userId=${encodeURIComponent(session.userId)}`);
        const data = await doRes.json();
        return Response.json(data, { headers });
      }

      // POST /api/wallet/dev-credit - Lệnh nạp tiền thử nghiệm DevTools Console
      if (requestUrl.pathname === '/api/wallet/dev-credit' && request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) || {};
        const creditAmount = parseInt(body.amount, 10) || 50000;
        const targetUserId = body.userId || session.userId;
        const doRes = await playerStub.fetch(`http://internal/credit?userId=${encodeURIComponent(targetUserId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: creditAmount,
            txId: `tx_dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            referenceId: 'dev_tools',
            type: 'GIFT',
            description: `Dev Console nạp +${creditAmount.toLocaleString()} xu`
          })
        });
        const data = await doRes.json();
        return Response.json({ ok: true, balance: data.balance }, { headers });
      }

      // GET /api/reward/status
      if (requestUrl.pathname === '/api/reward/status' && request.method === 'GET') {
        const doRes = await playerStub.fetch(`http://internal/reward/status?userId=${encodeURIComponent(session.userId)}`);
        const data = await doRes.json();
        return Response.json(data, { headers });
      }

      // POST /api/reward/claim
      if (requestUrl.pathname === '/api/reward/claim' && request.method === 'POST') {
        const doRes = await playerStub.fetch(`http://internal/reward/claim?userId=${encodeURIComponent(session.userId)}`, {
          method: 'POST'
        });
        const data = await doRes.json();
        return Response.json(data, { status: doRes.status, headers });
      }
    }

    // ==========================================
    // 2.5 CỔNG WEBHOOK SEPAY / VIETQR DONATE: /api/donate/webhook
    // ==========================================
    if (requestUrl.pathname === '/api/donate/webhook' || requestUrl.pathname === '/api/webhook/sepay') {
      if (request.method !== 'POST') {
        return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers });
      }

      // Xác thực API Key nếu được cấu hình trong biến môi trường
      const authHeader = request.headers.get('Authorization') || '';
      if (env.SEPAY_API_KEY) {
        const expected = `Apikey ${env.SEPAY_API_KEY}`;
        if (authHeader !== expected && authHeader !== env.SEPAY_API_KEY) {
          return Response.json({ ok: false, error: 'Unauthorized webhook' }, { status: 401, headers });
        }
      }

      const payload = await request.json().catch(() => ({}));
      const {
        id: bankTxId,
        content = '',
        description = '',
        transferType = 'in',
        transferAmount = 0
      } = payload;

      if (transferType !== 'in' || transferAmount < 10000) {
        return Response.json({ ok: true, message: 'Bỏ qua giao dịch không phải tiền vào hoặc dưới 10.000đ' }, { headers });
      }

      // Trích xuất mã đơn hàng từ nội dung chuyển khoản: WINDHUB <MÃ_ĐƠN>
      const fullText = `${content} ${description}`;
      const match = fullText.match(/(?:WINDHUB|WH)\s*([0-9]{5,8})/i);
      const orderCode = match ? match[1] : null;

      if (!orderCode) {
        return Response.json({ ok: true, message: 'Giao dịch không chứa mã đơn WINDHUB hợp lệ' }, { headers });
      }

      // Tính số xu thưởng theo mốc (10k -> 100.000 xu, 20k -> 250.000 xu)
      let rewardCoins = Math.floor(transferAmount * 10);
      if (transferAmount >= 20000 && transferAmount < 50000) {
        rewardCoins = 250000;
      }

      return Response.json({
        success: true,
        orderCode,
        rewardCoins,
        transferAmount,
        bankTxId,
        message: `Đã xác nhận giao dịch thành công cho đơn ${orderCode} (+${rewardCoins.toLocaleString()} xu)`
      }, { headers });
    }

    // ==========================================
    // 3. ROUTE XỔ SỐ VUI XÓM LÀNG: /api/lottery/*
    // ==========================================
    if (requestUrl.pathname.startsWith('/api/lottery/')) {
      const subPath = requestUrl.pathname.replace('/api/lottery', '');

      // Danh sách phòng công cộng (không cần auth)
      if (subPath === '/rooms' && request.method === 'GET') {
        return Response.json({ ok: true, rooms: PUBLIC_VILLAGE_ROOMS }, { headers });
      }

      // GET /api/lottery/round-info hoặc /status - Stateless Provably Fair Game Engine (Không tốn DO / SQLite)
      if (subPath === '/round-info' || subPath === '/status') {
        const rawRoom = requestUrl.searchParams.get('room') || 'tai-xiu-50s';
        const isFast = rawRoom.includes('15') || rawRoom.includes('25') || rawRoom.includes('cho-phien');
        const ROUND_DURATION_SEC = isFast ? 25 : 50;
        const SECRET_SALT = env.SESSION_SECRET || 'windhub_taixiu_secret_salt_2026';

        const now = Date.now();
        const roundDurationMs = ROUND_DURATION_SEC * 1000;
        const currentRoundId = Math.floor(now / roundDurationMs);
        const elapsedSec = Math.floor((now % roundDurationMs) / 1000);
        const timeRemaining = ROUND_DURATION_SEC - elapsedSec;

        const shakeDuration = isFast ? 2 : 3;
        const waitDuration = ROUND_DURATION_SEC - (isFast ? 10 : 17);
        let status = 'WAITING';
        if (elapsedSec >= waitDuration && elapsedSec < waitDuration + shakeDuration) {
          status = 'PLAYING';
        } else if (elapsedSec >= waitDuration + shakeDuration) {
          status = 'RESULT';
        }

        const prevRoundId = currentRoundId - 1;
        const prevRoundData = await getDramaticRound(prevRoundId, SECRET_SALT);
        const prevDice = prevRoundData.dice;
        const prevTotal = prevRoundData.total;
        const isTriple = prevRoundData.isTriple;
        const prevOutcome = prevRoundData.outcome;
        const prevResultName = isTriple ? 'Bão' : (prevTotal >= 11 ? 'Tài' : 'Xỉu');

        // Sinh lịch sử soi cầu 50 ván gần nhất kèm nhãn kịch bản đột biến
        const history = [];
        for (let i = 0; i < 50; i++) {
          const rId = prevRoundId - i;
          const rData = await getDramaticRound(rId, SECRET_SALT);
          history.push({
            roundId: `TX-${isFast ? '25S' : '50S'}-${rId}`,
            dice: rData.dice,
            total: rData.total,
            outcome: rData.outcome,
            isTriple: rData.isTriple,
            dramaticType: rData.dramaticType,
            dramaticMessage: rData.dramaticMessage,
            drawTime: now - ((i + 1) * roundDurationMs)
          });
        }

        const currentRoundData = await getDramaticRound(currentRoundId, SECRET_SALT);
        const currentDice = currentRoundData.dice;
        const currentTotal = currentRoundData.total;
        const currentIsTriple = currentRoundData.isTriple;
        const currentOutcome = currentRoundData.outcome;

        return Response.json({
          ok: true,
          room: isFast ? 'tai-xiu-25s' : 'tai-xiu-50s',
          current_round: {
            id: `TX-${isFast ? '25S' : '50S'}-${currentRoundId}`,
            cycle_index: currentRoundId,
            time_remaining_seconds: timeRemaining,
            duration: ROUND_DURATION_SEC,
            wait_duration: waitDuration,
            shake_duration: shakeDuration,
            status,
            ends_at: (currentRoundId * roundDurationMs) + (status === 'WAITING' ? waitDuration * 1000 : (status === 'PLAYING' ? (waitDuration + shakeDuration) * 1000 : roundDurationMs)),
            dice: status === 'RESULT' ? currentDice : [1, 2, 3],
            total: status === 'RESULT' ? currentTotal : 6,
            outcome: status === 'RESULT' ? currentOutcome : 'XIU',
            is_triple: status === 'RESULT' ? currentIsTriple : false
          },
          previous_round: {
            id: `TX-${isFast ? '25S' : '50S'}-${prevRoundId}`,
            dice: prevDice,
            total: prevTotal,
            outcome: prevOutcome,
            is_triple: isTriple,
            result_name: prevResultName
          },
          history,
          server_time: now
        }, { headers });
      }

      // POST /api/lottery/ws-ticket - Cấp vé kết nối WebSocket dùng một lần (Short-lived 60s Ticket)
      if (subPath === '/ws-ticket' && request.method === 'POST') {
        try {
          let session = await getAuthenticatedSession(request, env).catch(() => null);

          // Hỗ trợ người dùng Firebase gửi kèm userId & userName
          if (!session) {
            const body = await request.json().catch(() => ({}));
            const fbUserId = body.userId || requestUrl.searchParams.get('userId');
            const fbUserName = body.userName || requestUrl.searchParams.get('userName');
            if (fbUserId && fbUserId !== 'auth_player' && fbUserId !== 'guest_player') {
              session = {
                userId: fbUserId,
                displayName: fbUserName || 'Người Chơi',
                googleSub: ''
              };
            }
          }

          if (!session) {
            return Response.json({ ok: false, error: 'Yêu cầu đăng nhập tài khoản Google để nhận vé kết nối.' }, { status: 401, headers });
          }

          const ticket = await createWsTicket({
            userId: session.userId,
            googleSub: session.googleSub || '',
            displayName: session.displayName
          }, env.SESSION_SECRET, 60);

          return Response.json({ ok: true, ticket }, { status: 200, headers });
        } catch (err) {
          return Response.json({ ok: false, error: err.message || 'Lỗi cấp phát vé kết nối.' }, { status: 500, headers });
        }
      }

      // Kiểm tra Durable Object binding
      if (!env.LOTTERY_ROOM) {
        return Response.json({
          error: 'Durable Object binding LOTTERY_ROOM chưa được cấu hình trên môi trường này.'
        }, { status: 503, headers });
      }

      // WebSocket Upgrade & Snapshot Authentication
      // Reject unauthenticated access: No guest mode!
      let authSession = null;
      if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket' || subPath === '/ws' || subPath === '/snapshot') {
        const ticketParam = requestUrl.searchParams.get('ticket');
        if (ticketParam) {
          if (!env.SESSION_SECRET) {
            return Response.json({ ok: false, error: 'SESSION_SECRET is not configured on Cloudflare Worker' }, { status: 500, headers });
          }
          const ticketPayload = await verifyWsTicket(ticketParam, env.SESSION_SECRET);
          if (!ticketPayload) {
            return Response.json({ ok: false, code: 'INVALID_TICKET', error: 'Vé kết nối không hợp lệ hoặc đã hết hạn.' }, { status: 401, headers });
          }
          if (isTicketConsumed(ticketPayload.jti)) {
            return Response.json({ ok: false, code: 'TICKET_ALREADY_USED', error: 'Vé kết nối đã được sử dụng.' }, { status: 401, headers });
          }
          markTicketConsumed(ticketPayload.jti, ticketPayload.exp);
          authSession = {
            userId: ticketPayload.userId,
            googleSub: ticketPayload.googleSub,
            displayName: ticketPayload.displayName
          };
        } else {
          // Fallback xác thực qua Cookie hoặc Authorization header
          try {
            authSession = await getAuthenticatedSession(request, env);
          } catch {
            authSession = null;
          }
        }

        // Hỗ trợ người dùng đăng nhập bằng Firebase Auth (gửi kèm userId & userName)
        if (!authSession) {
          const qUserId = requestUrl.searchParams.get('userId');
          const qUserName = requestUrl.searchParams.get('userName');
          if (qUserId && qUserId !== 'auth_player' && qUserId !== 'guest_player') {
            authSession = {
              userId: qUserId,
              displayName: qUserName || 'Người Chơi',
              googleSub: ''
            };
          }
        }

        // Nếu client chỉ định dùng ví Firebase, không sử dụng PlayerAccountDO của Cloudflare
        const walletParam = requestUrl.searchParams.get('wallet');
        if (walletParam === 'firebase' && authSession) {
          authSession.googleSub = '';
        }

        if (!authSession) {
          return Response.json({
            ok: false,
            code: 'UNAUTHORIZED',
            error: 'Bạn cần đăng nhập tài khoản Google để tham gia chơi Tài Xỉu.'
          }, { status: 401, headers });
        }
      }

      // Xác thực mã phòng: chỉ cho phép ký tự chữ thường, số, dấu gạch nối (tối đa 32 ký tự)
      const rawRoomId = requestUrl.searchParams.get('room') || 'tai-xiu-30s';
      let cleanRoomId = rawRoomId.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32) || 'tai-xiu-30s';
      if (cleanRoomId === 'tai-xiu-50s') cleanRoomId = 'tai-xiu-30s';
      if (cleanRoomId === 'tai-xiu-25s') cleanRoomId = 'tai-xiu-15s';

      try {
        const doId = env.LOTTERY_ROOM.idFromName(cleanRoomId);
        const roomStub = env.LOTTERY_ROOM.get(doId);

        // Chuẩn bị URL chuyển tiếp vào LotteryRoom với thông tin danh tính xác thực authoritative từ server
        const forwardUrl = new URL(request.url);
        if (authSession) {
          forwardUrl.searchParams.set('userId', authSession.userId);
          forwardUrl.searchParams.set('userName', authSession.displayName || 'Người Chơi');
          forwardUrl.searchParams.set('googleSub', authSession.googleSub);
        }

        const forwardRequest = new Request(forwardUrl.toString(), request);

        // Chuyển tiếp request vào Durable Object
        const doResponse = await roomStub.fetch(forwardRequest);

        // Nối thêm CORS header cho phản hồi HTTP thông thường (nếu không phải WebSocket 101)
        if (doResponse.status !== 101) {
          const newHeaders = new Headers(doResponse.headers);
          for (const [k, v] of Object.entries(headers)) {
            newHeaders.set(k, v);
          }
          return new Response(doResponse.body, {
            status: doResponse.status,
            statusText: doResponse.statusText,
            headers: newHeaders
          });
        }

        return doResponse;
      } catch (err) {
        console.error('[Worker] Error routing to Durable Object:', err);
        return Response.json({ error: 'Không thể kết nối đến phòng quay số.' }, { status: 500, headers });
      }
    }

    // ==========================================
    // 4. ROUTE FACEBOOK PROFILE CŨ (Giữ nguyên 100% chức năng)
    // ==========================================
    if (requestUrl.pathname === '/profile') {
      if (request.method !== 'GET') {
        return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
      }

      const target = requestUrl.searchParams.get('url') || '';
      let targetUrl;
      try {
        targetUrl = new URL(target);
      } catch {
        return Response.json({ error: 'Invalid URL' }, { status: 400, headers });
      }

      if (!['http:', 'https:'].includes(targetUrl.protocol) || !isFacebookHost(targetUrl.hostname)) {
        return Response.json({ error: 'Only public Facebook URLs are supported' }, { status: 400, headers });
      }

      try {
        const settled = await Promise.allSettled(buildPublicVariants(targetUrl).map(fetchPublicPage));
        const pages = [];
        for (const entry of settled) {
          if (entry.status === 'fulfilled' && entry.value) {
            pages.push(entry.value);
          }
        }
        if (!pages.length) return Response.json({ error: 'Facebook returned no readable public page' }, { status: 502, headers });
        const data = mergePublicData(pages.map(({ html, url }) => extractPublicData(html, url)));
        return Response.json({ ok: true, source: 'cloudflare-worker', url: targetUrl.href, data }, { headers });
      } catch {
        return Response.json({ error: 'Unable to read the public Facebook page' }, { status: 502, headers });
      }
    }

    return Response.json({
      service: 'WindHub Multi-Service Worker',
      version: '3.1.0',
      routes: [
        'POST /api/auth/google',
        'POST /api/auth/logout',
        'GET /api/auth/me',
        'GET /api/wallet/balance',
        'GET /api/wallet/transactions',
        'GET /api/reward/status',
        'POST /api/reward/claim',
        'GET /profile?url=...',
        'GET /api/lottery/rooms',
        'POST /api/lottery/ws-ticket',
        'GET /api/lottery/round-info?room=...',
        'GET /api/lottery/ws?room=...&ticket=...',
        'GET /api/lottery/snapshot?room=...',
        'GET /api/lottery/history?room=...'
      ]
    }, { status: 200, headers });
  },
};

export async function getDramaticRound(roundId, salt = 'windhub_taixiu_secret_salt_2026') {
  const encoder = new TextEncoder();
  const hashBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(String(roundId) + ':' + salt)));
  const cycleIndex = Number(roundId) || 0;

  // Kịch bản 1: Chu kỳ Tam Bảo (Bão) độc đắc x30 (Xuất hiện định kỳ mỗi 28 ván)
  const cycleMod28 = (cycleIndex % 28 + 28) % 28;
  if (cycleMod28 === 7) {
    const face = (hashBytes[0] % 6) + 1;
    return {
      dice: [face, face, face],
      total: face * 3,
      isTriple: true,
      outcome: 'BAO',
      dramaticType: 'TRIPLE_JACKPOT',
      dramaticMessage: '👑 TAM BẢO XUẤT THẾ! Bão nổ giòn giã ăn x30 lần tiền!'
    };
  }

  // Kịch bản 2: Chu kỳ Sát Nút Thót Tim 10 vs 11 Điểm (Xuất hiện định kỳ mỗi 7 ván)
  const cycleMod7 = (cycleIndex % 7 + 7) % 7;
  if (cycleMod7 === 3) {
    const isTai = (hashBytes[0] % 2 === 0);
    const dice = isTai ? [6, 4, 1] : [5, 4, 1];
    const total = dice[0] + dice[1] + dice[2];
    return {
      dice,
      total,
      isTriple: false,
      outcome: total >= 11 ? 'TAI' : 'XIU',
      dramaticType: 'EDGE_TENSION',
      dramaticMessage: total === 11
        ? '⚡ SÁT NÚT THÓT TIM! 11 điểm Tài ngoạn mục!'
        : '⚡ SÁT NÚT THÓT TIM! 10 điểm Xỉu thoát hiểm gang tấc!'
    };
  }

  // Xúc xắc ngẫu nhiên tự nhiên
  const raw = [
    (hashBytes[0] % 6) + 1,
    (hashBytes[1] % 6) + 1,
    (hashBytes[2] % 6) + 1
  ];
  let total = raw[0] + raw[1] + raw[2];
  let isTriple = (raw[0] === raw[1] && raw[1] === raw[2]);
  let outcome = isTriple ? 'BAO' : (total >= 11 ? 'TAI' : 'XIU');

  // Kịch bản 3: Bẻ Cầu Bệt (Nếu 4 ván trước cùng ra 1 cửa, ván này bẻ cầu ngược lại)
  const prevOutcomes = [];
  for (let i = 1; i <= 4; i++) {
    const prevBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(String(cycleIndex - i) + ':' + salt)));
    const pt = ((prevBytes[0] % 6) + 1) + ((prevBytes[1] % 6) + 1) + ((prevBytes[2] % 6) + 1);
    prevOutcomes.push(pt >= 11 ? 'TAI' : 'XIU');
  }
  const allSame = prevOutcomes.every((o) => o === prevOutcomes[0]);
  if (allSame && outcome === prevOutcomes[0]) {
    const targetOpposite = prevOutcomes[0] === 'TAI' ? 'XIU' : 'TAI';
    const flippedDice = targetOpposite === 'XIU'
      ? [(hashBytes[1] % 3) + 1, (hashBytes[2] % 3) + 1, (hashBytes[3] % 3) + 1]
      : [(hashBytes[1] % 3) + 4, (hashBytes[2] % 3) + 4, (hashBytes[3] % 3) + 4];
    total = flippedDice[0] + flippedDice[1] + flippedDice[2];
    outcome = targetOpposite;
    isTriple = (flippedDice[0] === flippedDice[1] && flippedDice[1] === flippedDice[2]);
    return {
      dice: flippedDice,
      total,
      isTriple,
      outcome,
      dramaticType: 'STREAK_BREAKER',
      dramaticMessage: outcome === 'TAI'
        ? '🔥 BẺ CẦU NGOẠN MỤC! Cửa Tài chặn đứng chuỗi bệt Xỉu!'
        : '🔥 BẺ CẦU NGOẠN MỤC! Cửa Xỉu chặn đứng chuỗi bệt Tài!'
    };
  }

  return {
    dice: raw,
    total,
    isTriple,
    outcome,
    dramaticType: 'NORMAL',
    dramaticMessage: ''
  };
}

export async function getDiceFromRoundId(roundId, salt = 'windhub_taixiu_secret_salt_2026') {
  const round = await getDramaticRound(roundId, salt);
  return round.dice;
}
