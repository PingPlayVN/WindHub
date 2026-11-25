import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clipboard,
  ClipboardPaste,
  Download,
  ExternalLink,
  Info,
  Link as LinkIcon,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/os/Button';
import Modal from '@/components/os/Modal';
import { StudioWorkspaceHeader, ToolEmblem } from '@/components/studio/StudioPrimitives';

/* =========================================================
   UTILITIES & URL ANALYZER (Thuật toán v4.1 nguyên bản)
   ========================================================= */
const clean = (val, fallback = null) => {
  if (val === null || val === undefined) return fallback;
  const v = String(val).trim();
  return !v || v.toLowerCase() === 'undefined' || v.toLowerCase() === 'null' ? fallback : v;
};

const numeric = (val) => {
  const value = clean(val, '');
  return /^\d+$/.test(value) && value !== '0' ? value : null;
};

const getParam = (params, name) => {
  const expected = name.toLowerCase();
  for (const [key, value] of params.entries()) {
    if (key.toLowerCase() === expected) return value;
  }
  return null;
};

const decode = (val) => {
  try {
    return decodeURIComponent(clean(val, ''));
  } catch {
    return val;
  }
};

const isFacebookHost = (hostname) => {
  const host = String(hostname || '')
    .toLowerCase()
    .replace(/^www\./, '');
  return [
    'facebook.com',
    'm.facebook.com',
    'mbasic.facebook.com',
    'touch.facebook.com',
    'web.facebook.com',
    'fb.com',
  ].some((domain) => host === domain || host.endsWith('.' + domain));
};

const getMeta = (...names) =>
  names
    .map((name) =>
      document
        .querySelector(`meta[property="${name}"], meta[name="${name}"]`)
        ?.content?.trim()
    )
    .find(Boolean) || '';
const facebookWorkerUrl = import.meta.env.VITE_FACEBOOK_WORKER_URL || '';

const getCurrentPageDetails = (result) => {
  const pageText = document.body?.innerText?.replace(/\s+/g, ' ').trim() || '';
  result.name =
    getMeta('og:title', 'twitter:title') || clean(document.querySelector('h1')?.textContent);
  result.bio = getMeta('og:description', 'description', 'twitter:description');
  result.avatar =
    getMeta('og:image', 'twitter:image') ||
    document.querySelector('img[alt*="profile" i], img[alt*="avatar" i]')?.src ||
    '';
  result.canonical_url = document.querySelector('link[rel="canonical"]')?.href || '';
  result.website =
    [...document.querySelectorAll('a[href]')]
      .map((link) => link.href)
      .find((href) => {
        try {
          const parsed = new URL(href);
          return /^https?:$/i.test(parsed.protocol) && !isFacebookHost(parsed.hostname);
        } catch {
          return false;
        }
      }) || '';
  result.verified =
    /(?:verified profile|verified page|hồ sơ đã xác minh|trang đã xác minh|đã xác minh)/i.test(
      pageText
    )
      ? 'true'
      : null;
  result.page_transparency = /page transparency|tính minh bạch của trang/i.test(pageText)
    ? 'Có trên trang hiện tại'
    : null;
  const createdText =
    pageText.match(/(?:account created|created on|ngày tạo tài khoản|tạo tài khoản)[^.!?]{0,100}/i)?.[0] ||
    '';
  result.created_at =
    createdText.match(
      /\b(?:\d{1,2}[./-]\d{1,2}[./-](?:19|20)?\d{2}|(?:19|20)\d{2}[./-]\d{1,2}[./-]\d{1,2})\b/
    )?.[0] || null;

  if (!result.uid) {
    result.uid =
      document.documentElement.innerHTML.match(
        /"(?:userID|user_id|profile_id|entity_id|ownerID)":"(\d+)"/i
      )?.[1] || null;
  }
};

function uniqueObjects(array, key) {
  const seen = new Set();
  return array.filter((item) => {
    const value = item && item[key];
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function generateProfileLinks(data) {
  const links = [];
  const username = clean(data.username);
  const uid = numeric(data.uid);
  const add = (type, url) => url && links.push({ type, url });

  if (username) {
    add('Profile', 'https://www.facebook.com/' + encodeURIComponent(username));
    add('Mobile', 'https://m.facebook.com/' + encodeURIComponent(username));
    add('MBasic', 'https://mbasic.facebook.com/' + encodeURIComponent(username));
    add('Touch', 'https://touch.facebook.com/' + encodeURIComponent(username));
    add('Profile via people', 'https://www.facebook.com/people/' + encodeURIComponent(username));
  }

  if (uid) {
    add('Profile.php', 'https://www.facebook.com/profile.php?id=' + uid);
    add('Mobile Profile.php', 'https://m.facebook.com/profile.php?id=' + uid);
    add('MBasic Profile.php', 'https://mbasic.facebook.com/profile.php?id=' + uid);
    add('UID path', 'https://www.facebook.com/' + uid);
    add('People + UID', 'https://www.facebook.com/people/profile.php?id=' + uid);
  }

  if (data.page_id) {
    links.push({
      type: 'Page',
      url:
        'https://www.facebook.com/pages/' +
        encodeURIComponent(data.name || 'page') +
        '/' +
        data.page_id,
    });
  }

  if (data.group_id) {
    add('Group', 'https://www.facebook.com/groups/' + data.group_id);
  }

  if (data.post_id) add('Post', `https://www.facebook.com/${data.post_id}`);
  if (data.photo_id) add('Photo', `https://www.facebook.com/photo.php?fbid=${data.photo_id}`);
  if (data.video_id) add('Video', `https://www.facebook.com/watch/?v=${data.video_id}`);
  if (data.reel_id) add('Reel', `https://www.facebook.com/reel/${data.reel_id}`);
  if (data.story_id)
    add('Story', `https://www.facebook.com/stories/${data.username || 'profile'}/${data.story_id}`);
  if (data.canonical_url) add('Canonical', data.canonical_url);

  return uniqueObjects(links, 'url');
}

const resultFields = (result) =>
  [
    ['TYPE', result.type],
    ['UID / PROFILE ID', result.uid],
    ['USERNAME', result.username],
    ['NAME', result.name],
    ['BIO', result.bio],
    ['AVATAR URL', result.avatar],
    ['WEBSITE', result.website],
    ['VERIFIED', result.verified],
    ['PAGE ID', result.page_id],
    ['GROUP ID', result.group_id],
    ['POST ID', result.post_id],
    ['STORY FBID', result.story_fbid],
    ['PHOTO ID', result.photo_id],
    ['VIDEO ID', result.video_id],
    ['REEL ID', result.reel_id],
    ['STORY ID', result.story_id],
    ['PAGE TRANSPARENCY', result.page_transparency],
    ['ACCOUNT CREATED', result.created_at],
    ['CANONICAL URL', result.canonical_url],
    ['HOST', result.host],
    ['PATH', result.path],
    [
      'QUERY PARAMS',
      result.query_params && Object.keys(result.query_params).length
        ? JSON.stringify(result.query_params)
        : null,
    ],
    ['INPUT URL', result.url],
    ['SHARED URL', result.shared_url],
  ]
    .filter(([, value]) => value)
    .sort((first, second) => Number(Boolean(second[1])) - Number(Boolean(first[1])));

function analyzeURL(input) {
  const original = clean(input, '');
  if (!original) return { valid: false, type: 'Invalid', reason: 'Vui lòng nhập URL hoặc UID Facebook' };

  const bareUid = numeric(original);

  const candidate = /^https?:\/\//i.test(original)
    ? original
    : /^(?:www\.|m\.|mbasic\.)?(?:facebook\.com|fb\.com)(?:\/|$)/i.test(original)
    ? `https://${original}`
    : `https://www.facebook.com/${original.replace(/^\/+/, '')}`;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    return { valid: false, type: 'Invalid', reason: 'Định dạng URL không hợp lệ' };
  }

  if (!isFacebookHost(url.hostname))
    return { valid: false, type: 'Not Facebook', url: url.href, reason: 'Tên miền không thuộc Facebook' };

  const pathname = url.pathname.replace(/\/+/g, '/');
  const parts = pathname.split('/').filter(Boolean).map(decode);
  const lowerParts = parts.map((x) => String(x || '').toLowerCase());

  const result = {
    valid: true,
    type: 'Unknown',
    url: url.href,
    host: url.hostname,
    path: pathname,
    name: null,
    username: null,
    uid: null,
    page_id: null,
    group_id: null,
    post_id: null,
    photo_id: null,
    video_id: null,
    reel_id: null,
    story_id: null,
    story_fbid: null,
    bio: null,
    avatar: null,
    website: null,
    verified: null,
    canonical_url: null,
    page_transparency: null,
    created_at: null,
    query_params: Object.fromEntries(url.searchParams.entries()),
    profile_links: [],
  };

  if (bareUid) {
    result.type = 'Profile';
    result.uid = bareUid;
  }

  if (lowerParts[0] === 'profile.php') {
    result.type = 'Profile';
    result.uid = numeric(getParam(url.searchParams, 'id'));
  } else if (lowerParts[0] === 'people' && parts.length >= 3) {
    result.type = 'Profile';
    result.name = clean(parts[1]);
    result.uid = numeric(parts[2]);
  } else if (lowerParts[0] === 'groups') {
    result.type = 'Group';
    const value = clean(parts[1]);
    if (value) {
      if (/^\d+$/.test(value)) result.group_id = value;
      else result.username = value;
    }
  } else if (lowerParts[0] === 'pages') {
    result.type = 'Page';
    result.username = clean(parts[1]);
    result.page_id = numeric(parts[2]);
  } else if (lowerParts[0] === 'permalink.php') {
    result.type = 'Post';
    result.post_id = numeric(getParam(url.searchParams, 'story_fbid'));
    result.story_fbid = numeric(getParam(url.searchParams, 'story_fbid'));
    result.uid = numeric(getParam(url.searchParams, 'id'));
  } else if (lowerParts[0] === 'photo.php' || (lowerParts[0] === 'photo' && parts.length >= 2)) {
    result.type = 'Photo';
    result.photo_id = numeric(getParam(url.searchParams, 'fbid')) || numeric(parts[1]);
    result.uid = numeric(getParam(url.searchParams, 'id'));
  } else if (lowerParts[0] === 'watch') {
    result.type = 'Video';
    result.video_id =
      numeric(getParam(url.searchParams, 'v')) || numeric(getParam(url.searchParams, 'video_id'));
  } else if (lowerParts[0] === 'videos' && parts.length >= 2) {
    result.type = 'Video';
    result.video_id = numeric(parts[1]);
  } else if (lowerParts[0] === 'reel' || lowerParts[0] === 'reels') {
    result.type = 'Reel';
    result.reel_id = numeric(parts[1]);
  } else if (lowerParts[0] === 'stories') {
    result.type = 'Story';
    result.username = clean(parts[1]);
    result.story_id = numeric(parts[2]);
  } else if (lowerParts[0] === 'share') {
    result.type = 'Share';
    const u = getParam(url.searchParams, 'u');
    if (u) result.shared_url = decode(u);
  } else if (
    !bareUid &&
    parts.length >= 1 &&
    ![
      'home',
      'watch',
      'login',
      'settings',
      'notifications',
      'messages',
      'marketplace',
      'gaming',
      'groups',
      'pages',
      'photos',
      'videos',
      'reels',
      'stories',
      'friends',
      'bookmarks',
      'events',
      'search',
      'profile.php',
      'permalink.php',
      'photo.php',
      'share',
      'sharer.php',
    ].includes(lowerParts[0])
  ) {
    result.type = 'Profile';
    result.username = parts[0];
  }

  const postsIndex = lowerParts.indexOf('posts');
  if (postsIndex !== -1 && parts[postsIndex + 1]) {
    result.type = 'Post';
    result.post_id = numeric(parts[postsIndex + 1]);
  }

  const videosIndex = lowerParts.indexOf('videos');
  if (videosIndex !== -1 && parts[videosIndex + 1]) {
    result.type = 'Video';
    result.video_id = numeric(parts[videosIndex + 1]);
  }

  if (!result.uid) {
    const q =
      numeric(getParam(url.searchParams, 'id')) ||
      numeric(getParam(url.searchParams, 'profile_id'));
    if (q) result.uid = q;
  }
  if (!result.post_id) {
    const p =
      numeric(getParam(url.searchParams, 'story_fbid')) ||
      numeric(getParam(url.searchParams, 'post_id'));
    if (p) result.post_id = p;
  }
  if (!result.video_id) {
    const v =
      numeric(getParam(url.searchParams, 'v')) || numeric(getParam(url.searchParams, 'video_id'));
    if (v) result.video_id = v;
  }
  if (!result.photo_id) {
    const ph = numeric(getParam(url.searchParams, 'fbid'));
    if (ph) result.photo_id = ph;
  }

  const currentUrl = `${location.origin}${location.pathname}${location.search}`;
  const inputUrl = `${url.origin}${url.pathname}${url.search}`;
  if (currentUrl === inputUrl) getCurrentPageDetails(result);

  result.profile_links = generateProfileLinks(result);
  return result;
}

async function enrichWithWorker(localResult) {
  if (!facebookWorkerUrl || !localResult?.valid) return localResult;
  try {
    const endpoint = `${facebookWorkerUrl.replace(/\/$/, '')}/profile?url=${encodeURIComponent(
      localResult.url
    )}`;
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (!response.ok) return localResult;
    const payload = await response.json();
    const remote = payload?.data || {
      name: payload?.basic_info?.name,
      uid: payload?.basic_info?.uid,
      username: payload?.basic_info?.username,
      verified: payload?.metrics?.is_verified ? 'true' : '',
      avatar: payload?.media?.avatar,
      created_at:
        payload?.creation?.accuracy === 'Estimated from UID' ? '' : payload?.creation?.date,
      bio: payload?.public_metadata?.og_description,
      canonical_url: payload?.public_metadata?.og_url,
    };
    if (!remote) return localResult;
    return {
      ...localResult,
      ...Object.fromEntries(
        Object.entries(remote).filter(([, value]) => value && value !== '0' && value !== 'Not found')
      ),
      profile_links: generateProfileLinks({ ...localResult, ...remote }),
      source: 'Cloudflare Worker + local URL parser',
    };
  } catch {
    return localResult;
  }
}

function SignalCell({ label, value, onCopy, highlight }) {
  if (!value) return null;
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[var(--radius-md)] border px-3.5 py-2.5 transition-colors ${
        highlight
          ? 'border-[var(--os-info-border)] bg-[var(--os-info-soft)]'
          : 'border-[var(--os-border-subtle)] bg-[var(--os-surface-2)]'
      }`}
    >
      <div className="min-w-0">
        <p
          className={`font-mono text-[10px] font-bold uppercase tracking-wider ${
            highlight ? 'text-[var(--os-info)]' : 'text-[var(--os-text-muted)]'
          }`}
        >
          {label}
        </p>
        <p className="mt-0.5 truncate font-mono text-xs sm:text-sm font-semibold text-[var(--os-text-primary)]">
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(String(value), label)}
        aria-label={`Sao chép ${label}`}
        title={`Sao chép ${label}`}
        className="os-focus-ring shrink-0 rounded-md p-1.5 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-1)] hover:text-[var(--os-info)] cursor-pointer transition-colors"
      >
        <Clipboard size={15} />
      </button>
    </div>
  );
}

export function FacebookAnalyzerWorkspace() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const copy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Đã sao chép ${label}`);
    } catch {
      toast.error('Không thể truy cập clipboard');
    }
  };

  const analyze = async (overrideInput) => {
    const targetInput = typeof overrideInput === 'string' ? overrideInput : input;
    setIsScanning(true);
    const data = analyzeURL(targetInput);
    if (!data.valid) {
      toast.error(data.reason || 'Lỗi phân tích URL');
      setResult(null);
      setIsScanning(false);
      return;
    }
    try {
      setResult(data);
      const enriched = await enrichWithWorker(data);
      setResult(enriched);
      toast.success('Phân tích tín hiệu URL thành công!');
    } finally {
      setIsScanning(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInput(text);
        void analyze(text);
      }
    } catch {
      toast.info('Hãy nhấn Ctrl+V trực tiếp vào ô URL.');
    }
  };

  const download = () => {
    if (!result) return;
    const exportData = {
      analyzer: { name: 'Facebook Public Analyzer', version: '4.1 (WindHub Edition)' },
      analyzed_at: new Date().toISOString(),
      url_analysis: result,
    };
    const blobUrl = URL.createObjectURL(
      new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    );
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `FB_Analysis_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(blobUrl);
  };

  const copyLinks = async () => {
    if (!result || !result.profile_links.length) return toast.error('Không có liên kết để sao chép');
    const text = result.profile_links.map((l) => l.url).join('\n');
    await copy(text, 'danh sách liên kết');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-6 text-[var(--os-text-primary)]">
      <StudioWorkspaceHeader
        eyebrow="OSINT // PUBLIC SIGNAL PARSER"
        title="Facebook Analyzer v4.1"
        description="Bóc tách cấu trúc URL, trích xuất UID, định danh tài nguyên và sinh bộ liên kết đa giao diện hoàn toàn trên trình duyệt."
        emblemVariant="fb-osint"
        tone="sky"
        badges={['Zero Cookie', '100% Client-Side']}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<ClipboardPaste size={14} />}
              onClick={() => void handlePasteClipboard()}
            >
              Dán & Quét
            </Button>
            {result && (
              <Button
                variant="primary"
                size="sm"
                icon={<Download size={14} />}
                onClick={download}
              >
                Xuất JSON
              </Button>
            )}
          </>
        }
      />

      {/* Command Input Bar */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-4 space-y-3">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void analyze()}
              placeholder="Nhập URL Facebook (profile, group, watch, reel, photo...) hoặc mã UID..."
              aria-label="URL Facebook hoặc UID cần phân tích"
              autoFocus
              className="os-focus-ring h-11.5 w-full rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] pl-3.5 pr-9 font-mono text-xs sm:text-sm text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-info)] focus:bg-[var(--os-surface-1)]"
            />
            {input && (
              <button
                type="button"
                aria-label="Xóa URL"
                onClick={() => {
                  setInput('');
                  setResult(null);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--os-text-muted)] hover:text-[var(--os-text-primary)] cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <Button
            variant="primary"
            size="md"
            loading={isScanning}
            icon={<Search size={16} />}
            onClick={() => void analyze()}
          >
            {isScanning ? 'Đang phân tích...' : 'Phân tích URL'}
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--os-text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-[var(--os-success)]" />
            <span>Chỉ phân tích cú pháp công khai, không yêu cầu đăng nhập tài khoản.</span>
          </span>
          <span className="font-mono">Hỗ trợ: Profile · Page · Group · Post · Reel · Watch · Story</span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isScanning && !result && (
        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-5 animate-pulse">
          <div className="h-5 w-48 rounded bg-[var(--os-surface-3)]" />
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-[var(--radius-md)] bg-[var(--os-surface-2)]" />
            ))}
          </div>
        </div>
      )}

      {/* Empty Guide State */}
      {!result && !isScanning && (
        <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--os-border-strong)] bg-[var(--os-surface-1)] p-8 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl border border-[var(--os-info-border)] bg-[var(--os-info-soft)] text-[var(--os-info)]">
            <ToolEmblem variant="fb-osint" size={24} />
          </div>
          <h4 className="text-sm sm:text-base font-bold text-[var(--os-text-primary)]">
            Sẵn sàng bóc tách tín hiệu URL Facebook
          </h4>
          <p className="mx-auto mt-1 max-w-lg text-xs sm:text-sm text-[var(--os-text-muted)]">
            Dán bất kỳ liên kết chia sẻ, liên kết rút gọn m.facebook.com, profile.php?id=... hoặc dãy số UID để trích xuất thông tin định danh và chuyển đổi sang liên kết MBasic/Mobile chuẩn.
          </p>
        </div>
      )}

      {/* Results Output */}
      {result && (
        <div className="space-y-5">
          {/* Status Summary Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--os-success-border)] bg-[var(--os-success-soft)] px-4 py-3 font-mono text-xs">
            <span className="inline-flex items-center gap-2 font-bold text-[var(--os-success)]">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>PHÂN TÍCH HOÀN TẤT · LOẠI: {String(result.type).toUpperCase()}</span>
            </span>
            <span className="text-[var(--os-text-secondary)]">
              {resultFields(result).length} trường tín hiệu · {result.profile_links.length} liên kết dẫn xuất
            </span>
          </div>

          {result.avatar && (
            <div className="flex items-center gap-3.5 rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-3.5">
              <img
                src={result.avatar}
                alt="Facebook profile"
                className="size-16 rounded-xl border border-[var(--os-border-default)] object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--os-text-primary)]">
                  {result.name || result.username || result.uid}
                </p>
                {result.bio && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-[var(--os-text-secondary)]">
                    {result.bio}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Extracted Signals Grid */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-[var(--os-border-subtle)] pb-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--os-text-secondary)]">
              <Info size={14} className="text-[var(--os-info)]" />
              <span>Tín hiệu trích xuất ({resultFields(result).length})</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {resultFields(result).map(([label, value], index) => (
                <SignalCell
                  key={`${label}-${index}`}
                  label={label}
                  value={value}
                  onCopy={copy}
                  highlight={index < 3}
                />
              ))}
            </div>
          </section>

          {/* Generated Profile Links */}
          {result.profile_links.length > 0 && (
            <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)]">
              <div className="flex items-center justify-between border-b border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] px-4 py-2.5">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--os-text-secondary)]">
                  Liên kết chuẩn hóa đa nền tảng
                </span>
                <button
                  type="button"
                  onClick={copyLinks}
                  className="os-focus-ring inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] px-2 py-1 text-xs font-bold text-[var(--os-info)] hover:bg-[var(--os-info-soft)] cursor-pointer transition-colors"
                >
                  <LinkIcon size={13} />
                  <span>Sao chép tất cả</span>
                </button>
              </div>
              <div className="divide-y divide-[var(--os-border-subtle)] p-2">
                {result.profile_links.map((link) => (
                  <div
                    key={link.url}
                    className="group flex flex-col justify-between gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 hover:bg-[var(--os-surface-hover)] sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="inline-block rounded bg-[var(--os-surface-2)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--os-text-muted)]">
                        {link.type}
                      </span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 flex items-center gap-1 break-all font-mono text-xs sm:text-sm text-[var(--os-info)] hover:underline"
                      >
                        <span>{link.url}</span>
                        <ExternalLink size={12} className="shrink-0" />
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => copy(link.url, link.type)}
                      aria-label={`Sao chép ${link.type}`}
                      className="self-start rounded-md p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-2)] hover:text-[var(--os-info)] sm:self-auto cursor-pointer transition-colors"
                    >
                      <Clipboard size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Raw JSON Output */}
          <section className="overflow-hidden rounded-[var(--radius-lg)] border border-slate-800 bg-[#0b0e14]">
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#111620] px-4 py-2.5">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                JSON Payload
              </span>
              <button
                type="button"
                onClick={download}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
              >
                <Download size={13} />
                <span>Tải tệp JSON</span>
              </button>
            </div>
            <pre className="max-h-60 overflow-auto custom-scrollbar p-4 font-mono text-[11px] leading-5 text-emerald-400">
              {JSON.stringify(
                {
                  analyzer: { name: 'Facebook Public Analyzer', version: '4.1' },
                  analyzed_at: new Date().toISOString(),
                  url_analysis: result,
                },
                null,
                2
              )}
            </pre>
          </section>
        </div>
      )}
    </div>
  );
}

function FacebookProfileTool({ embedded = false }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (embedded || !isOpen) return undefined;
    const closeOnEscape = (e) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [embedded, isOpen]);

  if (embedded) {
    return <FacebookAnalyzerWorkspace />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="os-card os-card-interactive os-focus-ring w-full p-5 text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--os-info-border)] bg-[var(--os-info-soft)] text-[var(--os-info)]">
            <ToolEmblem variant="fb-osint" size={20} />
          </span>
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--os-info)]">
              OSINT · Zero Cookie
            </span>
            <h3 className="text-base font-bold text-[var(--os-text-primary)]">
              Facebook Analyzer v4.1
            </h3>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-[var(--os-text-secondary)]">
          Phân tách mọi định dạng URL Facebook, trích xuất UID và sinh liên kết chuẩn hóa 100% Client-side.
        </p>
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        size="xl"
        subtitle="WINDOS EXTENSION"
        title="Facebook Analyzer v4.1"
      >
        <FacebookAnalyzerWorkspace />
      </Modal>
    </>
  );
}

FacebookProfileTool.tool = { id: 'facebook-profile', Component: FacebookProfileTool };
export default FacebookProfileTool;
