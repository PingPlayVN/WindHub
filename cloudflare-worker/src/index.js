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

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = env.ALLOWED_ORIGIN || '*';
  return {
    'Access-Control-Allow-Origin': allowed === '*' || allowed === origin ? origin || '*' : allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { headers });
    if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405, headers });

    const requestUrl = new URL(request.url);
    if (requestUrl.pathname !== '/profile') return Response.json({ error: 'Use /profile?url=https://www.facebook.com/...' }, { status: 404, headers });

    const target = requestUrl.searchParams.get('url') || '';
    let targetUrl;
    try { targetUrl = new URL(target); } catch { return Response.json({ error: 'Invalid URL' }, { status: 400, headers }); }
    if (!['http:', 'https:'].includes(targetUrl.protocol) || !isFacebookHost(targetUrl.hostname)) {
      return Response.json({ error: 'Only public Facebook URLs are supported' }, { status: 400, headers });
    }

    try {
      const pages = (await Promise.allSettled(buildPublicVariants(targetUrl).map(fetchPublicPage)))
        .filter((entry) => entry.status === 'fulfilled' && entry.value)
        .map((entry) => entry.value);
      if (!pages.length) return Response.json({ error: 'Facebook returned no readable public page' }, { status: 502, headers });
      const data = mergePublicData(pages.map(({ html, url }) => extractPublicData(html, url)));
      return Response.json({ ok: true, source: 'cloudflare-worker', url: targetUrl.href, data }, { headers });
    } catch {
      return Response.json({ error: 'Unable to read the public Facebook page' }, { status: 502, headers });
    }
  },
};
