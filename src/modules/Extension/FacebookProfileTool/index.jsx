import { useEffect, useState } from 'react';
import { Clipboard, Download, Globe2, Link as LinkIcon, Search, X, LayoutGrid, Info, Terminal, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

/* =========================================================
   UTILITIES & URL ANALYZER (Thuật toán v4.1 nguyên bản)
   ========================================================= */
const clean = (val, fallback = null) => {
  if (val === null || val === undefined) return fallback;
  const v = String(val).trim();
  return (!v || v.toLowerCase() === 'undefined' || v.toLowerCase() === 'null') ? fallback : v;
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
  try { return decodeURIComponent(clean(val, '')); } 
  catch { return val; } 
};

const isFacebookHost = (hostname) => {
  const host = String(hostname || "").toLowerCase().replace(/^www\./, "");
  return ["facebook.com", "m.facebook.com", "mbasic.facebook.com", "touch.facebook.com", "web.facebook.com", "fb.com"].some(domain => host === domain || host.endsWith("." + domain));
};

const getMeta = (...names) => names.map((name) => document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.content?.trim()).find(Boolean) || '';
const facebookWorkerUrl = import.meta.env.VITE_FACEBOOK_WORKER_URL || '';

const getCurrentPageDetails = (result) => {
  const pageText = document.body?.innerText?.replace(/\s+/g, ' ').trim() || '';
  result.name = getMeta('og:title', 'twitter:title') || clean(document.querySelector('h1')?.textContent);
  result.bio = getMeta('og:description', 'description', 'twitter:description');
  result.avatar = getMeta('og:image', 'twitter:image') || document.querySelector('img[alt*="profile" i], img[alt*="avatar" i]')?.src || '';
  result.canonical_url = document.querySelector('link[rel="canonical"]')?.href || '';
  result.website = [...document.querySelectorAll('a[href]')].map((link) => link.href).find((href) => {
    try { const parsed = new URL(href); return /^https?:$/i.test(parsed.protocol) && !isFacebookHost(parsed.hostname); } catch { return false; }
  }) || '';
  result.verified = /(?:verified profile|verified page|hồ sơ đã xác minh|trang đã xác minh|đã xác minh)/i.test(pageText) ? 'true' : null;
  result.page_transparency = /page transparency|tính minh bạch của trang/i.test(pageText) ? 'Có trên trang hiện tại' : null;
  const createdText = pageText.match(/(?:account created|created on|ngày tạo tài khoản|tạo tài khoản)[^.!?]{0,100}/i)?.[0] || '';
  result.created_at = createdText.match(/\b(?:\d{1,2}[./-]\d{1,2}[./-](?:19|20)?\d{2}|(?:19|20)\d{2}[./-]\d{1,2}[./-]\d{1,2})\b/)?.[0] || null;

  if (!result.uid) {
    result.uid = document.documentElement.innerHTML.match(/"(?:userID|user_id|profile_id|entity_id|ownerID)":"(\d+)"/i)?.[1] || null;
  }
};

function uniqueObjects(array, key) {
  const seen = new Set();
  return array.filter(item => {
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
    add("Profile", "https://www.facebook.com/" + encodeURIComponent(username));
    add("Mobile", "https://m.facebook.com/" + encodeURIComponent(username));
    add("MBasic", "https://mbasic.facebook.com/" + encodeURIComponent(username));
    add("Touch", "https://touch.facebook.com/" + encodeURIComponent(username));
    add("Profile via people", "https://www.facebook.com/people/" + encodeURIComponent(username));
  }

  if (uid) {
    add("Profile.php", "https://www.facebook.com/profile.php?id=" + uid);
    add("Mobile Profile.php", "https://m.facebook.com/profile.php?id=" + uid);
    add("MBasic Profile.php", "https://mbasic.facebook.com/profile.php?id=" + uid);
    add("UID path", "https://www.facebook.com/" + uid);
    add("People + UID", "https://www.facebook.com/people/profile.php?id=" + uid);
  }

  if (data.page_id) {
    links.push({ type: "Page", url: "https://www.facebook.com/pages/" + encodeURIComponent(data.name || "page") + "/" + data.page_id });
  }

  if (data.group_id) {
    add("Group", "https://www.facebook.com/groups/" + data.group_id);
  }

  if (data.post_id) add("Post", `https://www.facebook.com/${data.post_id}`);
  if (data.photo_id) add("Photo", `https://www.facebook.com/photo.php?fbid=${data.photo_id}`);
  if (data.video_id) add("Video", `https://www.facebook.com/watch/?v=${data.video_id}`);
  if (data.reel_id) add("Reel", `https://www.facebook.com/reel/${data.reel_id}`);
  if (data.story_id) add("Story", `https://www.facebook.com/stories/${data.username || 'profile'}/${data.story_id}`);
  if (data.canonical_url) add("Canonical", data.canonical_url);

  return uniqueObjects(links, "url");
}

const resultFields = (result) => [
  ['TYPE', result.type], ['UID / PROFILE ID', result.uid], ['USERNAME', result.username], ['NAME', result.name],
  ['BIO', result.bio], ['AVATAR URL', result.avatar], ['WEBSITE', result.website], ['VERIFIED', result.verified],
  ['PAGE ID', result.page_id], ['GROUP ID', result.group_id], ['POST ID', result.post_id], ['STORY FBID', result.story_fbid],
  ['PHOTO ID', result.photo_id], ['VIDEO ID', result.video_id], ['REEL ID', result.reel_id], ['STORY ID', result.story_id],
  ['PAGE TRANSPARENCY', result.page_transparency], ['ACCOUNT CREATED', result.created_at], ['CANONICAL URL', result.canonical_url],
  ['HOST', result.host], ['PATH', result.path], ['QUERY PARAMS', JSON.stringify(result.query_params)], ['INPUT URL', result.url], ['SHARED URL', result.shared_url],
].filter(([, value]) => value).sort((first, second) => Number(Boolean(second[1])) - Number(Boolean(first[1])));

function analyzeURL(input) {
  const original = clean(input, "");
  if (!original) return { valid: false, type: "Invalid", reason: "URL trống" };

  const bareUid = numeric(original);

  const candidate = /^https?:\/\//i.test(original)
    ? original
    : (/^(?:www\.|m\.|mbasic\.)?(?:facebook\.com|fb\.com)(?:\/|$)/i.test(original)
      ? `https://${original}`
      : `https://www.facebook.com/${original.replace(/^\/+/, '')}`);
  let url;
  try { url = new URL(candidate); }
  catch { return { valid: false, type: "Invalid", reason: "URL không hợp lệ" }; }

  if (!isFacebookHost(url.hostname)) return { valid: false, type: "Not Facebook", url: url.href, reason: "Không phải URL Facebook" };

  const pathname = url.pathname.replace(/\/+/g, "/");
  const parts = pathname.split("/").filter(Boolean).map(decode);
  const lowerParts = parts.map(x => String(x || "").toLowerCase());

  const result = {
    valid: true, type: "Unknown", url: url.href, host: url.hostname, path: pathname,
    name: null, username: null, uid: null, page_id: null, group_id: null, post_id: null,
    photo_id: null, video_id: null, reel_id: null, story_id: null, story_fbid: null,
    bio: null, avatar: null, website: null, verified: null, canonical_url: null,
    page_transparency: null, created_at: null, query_params: Object.fromEntries(url.searchParams.entries()), profile_links: []
  };

  if (bareUid) {
    result.type = "Profile";
    result.uid = bareUid;
  }

  if (lowerParts[0] === "profile.php") {
    result.type = "Profile";
    result.uid = numeric(getParam(url.searchParams, "id"));
  } else if (lowerParts[0] === "people" && parts.length >= 3) {
    result.type = "Profile"; result.name = clean(parts[1]); result.uid = numeric(parts[2]);
  } else if (lowerParts[0] === "groups") {
    result.type = "Group";
    const value = clean(parts[1]);
    if (value) {
      if (/^\d+$/.test(value)) result.group_id = value;
      else result.username = value;
    }
  } else if (lowerParts[0] === "pages") {
    result.type = "Page"; result.username = clean(parts[1]); result.page_id = numeric(parts[2]);
  } else if (lowerParts[0] === "permalink.php") {
    result.type = "Post"; 
    result.post_id = numeric(getParam(url.searchParams, "story_fbid"));
    result.story_fbid = numeric(getParam(url.searchParams, "story_fbid"));
    result.uid = numeric(getParam(url.searchParams, "id"));
  } else if (lowerParts[0] === "photo.php" || (lowerParts[0] === "photo" && parts.length >= 2)) {
    result.type = "Photo";
    result.photo_id = numeric(getParam(url.searchParams, "fbid")) || numeric(parts[1]);
    result.uid = numeric(getParam(url.searchParams, "id"));
  } else if (lowerParts[0] === "watch") {
    result.type = "Video"; result.video_id = numeric(getParam(url.searchParams, "v")) || numeric(getParam(url.searchParams, "video_id"));
  } else if (lowerParts[0] === "videos" && parts.length >= 2) {
    result.type = "Video"; result.video_id = numeric(parts[1]);
  } else if (lowerParts[0] === "reel" || lowerParts[0] === "reels") {
    result.type = "Reel"; result.reel_id = numeric(parts[1]);
  } else if (lowerParts[0] === "stories") {
    result.type = "Story"; result.username = clean(parts[1]); result.story_id = numeric(parts[2]);
  } else if (lowerParts[0] === "share") {
    result.type = "Share";
    const u = getParam(url.searchParams, "u");
    if (u) result.shared_url = decode(u);
  } else if (!bareUid && parts.length >= 1 && !["home","watch","login","settings","notifications","messages","marketplace","gaming","groups","pages","photos","videos","reels","stories","friends","bookmarks","events","search","profile.php","permalink.php","photo.php","share","sharer.php"].includes(lowerParts[0])) {
    result.type = "Profile"; result.username = parts[0];
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

  // Query fallbacks
  if (!result.uid) { const q = numeric(getParam(url.searchParams, "id")) || numeric(getParam(url.searchParams, "profile_id")); if (q) result.uid = q; }
  if (!result.post_id) { const p = numeric(getParam(url.searchParams, "story_fbid")) || numeric(getParam(url.searchParams, "post_id")); if (p) result.post_id = p; }
  if (!result.video_id) { const v = numeric(getParam(url.searchParams, "v")) || numeric(getParam(url.searchParams, "video_id")); if (v) result.video_id = v; }
  if (!result.photo_id) { const ph = numeric(getParam(url.searchParams, "fbid")); if (ph) result.photo_id = ph; }

  const currentUrl = `${location.origin}${location.pathname}${location.search}`;
  const inputUrl = `${url.origin}${url.pathname}${url.search}`;
  if (currentUrl === inputUrl) getCurrentPageDetails(result);

  result.profile_links = generateProfileLinks(result);
  return result;
}

async function enrichWithWorker(localResult) {
  if (!facebookWorkerUrl || !localResult?.valid) return localResult;
  try {
    const endpoint = `${facebookWorkerUrl.replace(/\/$/, '')}/profile?url=${encodeURIComponent(localResult.url)}`;
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (!response.ok) return localResult;
    const payload = await response.json();
    const remote = payload?.data || {
      name: payload?.basic_info?.name,
      uid: payload?.basic_info?.uid,
      username: payload?.basic_info?.username,
      verified: payload?.metrics?.is_verified ? 'true' : '',
      avatar: payload?.media?.avatar,
      created_at: payload?.creation?.accuracy === 'Estimated from UID' ? '' : payload?.creation?.date,
      bio: payload?.public_metadata?.og_description,
      canonical_url: payload?.public_metadata?.og_url,
    };
    if (!remote) return localResult;
    return {
      ...localResult,
      ...Object.fromEntries(Object.entries(remote).filter(([, value]) => value && value !== '0' && value !== 'Not found')),
      profile_links: generateProfileLinks({ ...localResult, ...remote }),
      source: 'Cloudflare Worker + local URL parser',
    };
  } catch {
    return localResult;
  }
}

const InfoBlock = ({ label, value, onCopy, highlight }) => {
  if (!value) return null;
  return (
    <div className={`tool-signal flex items-center justify-between p-3 rounded-xl border transition-colors ${highlight ? 'bg-sky-950/20 border-sky-900/50 hover:border-sky-700/50' : 'bg-[#111] border-slate-800/60 hover:border-slate-700'}`}>
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="min-w-0">
          <p className={`text-[10px] uppercase font-bold tracking-wider ${highlight ? 'text-sky-500/70' : 'text-slate-500'}`}>{label}</p>
          <p className={`font-mono text-sm truncate ${highlight ? 'text-sky-100' : 'text-slate-200'}`}>{value}</p>
        </div>
      </div>
      <button type="button" onClick={() => onCopy(String(value), label)} aria-label={`Copy ${label}`} title={`Copy ${label}`} className="rounded-md border border-transparent p-2 text-slate-500 transition-colors hover:border-sky-900 hover:text-sky-400 shrink-0"><Clipboard size={16} /></button>
    </div>
  );
};

function FacebookProfileTool() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const copy = async (value, label) => { 
    try { await navigator.clipboard.writeText(value); toast.success(`Đã copy ${label}`); } 
    catch { toast.error('Lỗi clipboard'); } 
  };

  const analyze = async () => {
    setIsScanning(true);
    const data = analyzeURL(input);
    if (!data.valid) {
      toast.error(data.reason || "Lỗi phân tích URL");
      setResult(null);
      setIsScanning(false);
      return;
    }
    try {
      setResult(data);
      const enriched = await enrichWithWorker(data);
      setResult(enriched);
      toast.success('Phân tích URL thành công!');
    } finally {
      setIsScanning(false);
    }
  };

  const download = () => { 
    if (!result) return;
    const exportData = {
      analyzer: { name: "Facebook Public Analyzer", version: "4.1 (WindHub Edition)" },
      analyzed_at: new Date().toISOString(),
      url_analysis: result
    };
    const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })); 
    const link = document.createElement('a'); link.href = blobUrl; link.download = `FB_Analysis_${Date.now()}.json`; 
    link.click(); URL.revokeObjectURL(blobUrl); 
  };

  const copyLinks = async () => {
    if (!result || !result.profile_links.length) return toast.error("Không có link để copy");
    const text = result.profile_links.map(l => l.url).join('\n');
    await copy(text, "Profile Links");
  };

  useEffect(() => {
    const closeOnEscape = (e) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  if (!isOpen) {
    return (
      <button type="button" className="nhost-card group" onClick={() => setIsOpen(true)}>
        <span className="card-grid" /><span className="card-glow" />
        <span className="card-header">
            <span className="brand-wrapper">
                <span className="logo-container bg-[#1877F2]/10 border-[#1877F2]/20"><Globe2 className="text-[#1877F2]" size={22} /></span>
                <span className="brand-text text-slate-200">OSINT: FB Analyzer v4.1</span>
            </span>
        </span>
        <span className="card-body">
            <span className="repo-title">Scan profile Facebook<span className="blinking-cursor" /></span>
            <span className="repo-description text-slate-400">Thuật toán phân tách đa luồng mọi định dạng URL Facebook. An toàn tuyệt đối 100% Client-side.</span>
            <span className="tag-wrapper">
                <span className="badge border-emerald-500/20 bg-emerald-500/10 text-emerald-400">Pure Local</span>
                <span className="badge border-sky-500/20 bg-sky-500/10 text-sky-400">No Cookie</span>
            </span>
        </span>
      </button>
    );
  }

  return (
    <div className="tool-modal fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <article className="tool-modal-panel relative max-h-[90vh] w-full max-w-4xl flex flex-col rounded-2xl border border-slate-700 bg-[#0a0a0a] shadow-2xl">
          <div className="tool-modal-header flex shrink-0 items-center justify-between border-b border-slate-800 bg-[#0f0f0f] p-5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#1877F2]/10 p-2 text-[#1877F2]"><LayoutGrid size={24} /></div>
            <div>
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1877F2]"><Terminal size={12} /> Public signal scanner</p>
              <h2 className="text-xl font-bold text-slate-100">Facebook Analyzer v4.1</h2>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} aria-label="Đóng công cụ" title="Đóng công cụ (Esc)" className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 font-mono text-xs text-slate-400 transition hover:border-red-400/70 hover:bg-red-500/10 hover:text-red-300"><X size={17} /> EXIT</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <div className="flex flex-col gap-3 sm:flex-row mb-6">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && analyze()} 
              placeholder="Dán link Facebook vào đây..." 
              className="flex-1 rounded-xl border border-slate-700 bg-black px-4 py-3 font-mono text-sm text-slate-100 outline-none focus:border-[#1877F2]" 
              autoFocus 
            />
            <button type="button" onClick={analyze} disabled={isScanning} className={`tool-analyze-button flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-6 py-3 font-bold text-white transition hover:bg-[#166fe5] ${isScanning ? 'is-scanning' : ''}`}>
              <Search size={18} /> {isScanning ? 'Đang quét...' : 'Phân tích URL'}
            </button>
          </div>

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-3 font-mono text-xs text-emerald-400">
                  <span className="flex items-center gap-2"><CheckCircle2 size={16} className="shrink-0" /> SCAN COMPLETE // public data only</span>
                  <span className="text-slate-500">{result.profile_links.length} generated links</span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0b0b0b] p-3">
                <div className="mb-3 flex items-center gap-2 border-b border-slate-800 pb-3 font-mono text-xs text-slate-400"><Info size={15} className="text-sky-400" /> EXTRACTED SIGNALS <span className="text-emerald-500">({resultFields(result).length})</span></div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {resultFields(result).map(([label, value], index) => <InfoBlock key={`${label}-${index}`} label={label} value={value} onCopy={copy} highlight={index < 3} />)}
                </div>
              </div>

              {result.avatar && <img src={result.avatar} alt="Facebook profile" className="h-20 w-20 rounded-full border border-sky-900 object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}

              {result.profile_links.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-[#111] overflow-hidden">
                  <div className="flex items-center justify-between bg-slate-800/30 px-4 py-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Related Links</span>
                    <button onClick={copyLinks} className="text-xs font-bold text-[#1877F2] flex items-center gap-1 hover:text-sky-400"><LinkIcon size={14}/> Copy All</button>
                  </div>
                  <div className="p-2 space-y-1">
                    {result.profile_links.map((link, index) => (
                      <div key={link.url} style={{ '--tool-delay': `${index * 45}ms` }} className="tool-link-row flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-slate-800/30 rounded-lg transition-colors group border border-transparent hover:border-slate-800">
                        <div className="min-w-0 flex-1 mr-4">
                          <p className="text-xs text-slate-500 font-bold mb-1">{link.type}</p>
                          <a href={link.url} target="_blank" rel="noreferrer" className="font-mono text-sm text-[#1877F2] hover:underline break-all">
                            <span className="inline-flex items-center gap-1">{link.url} <ExternalLink size={12} /></span>
                          </a>
                        </div>
                        <button onClick={() => copy(link.url, link.type)} className="mt-2 sm:mt-0 p-2 text-slate-500 hover:text-[#1877F2] bg-black/50 rounded-lg sm:opacity-0 group-hover:opacity-100 transition-all self-start sm:self-auto">
                          <Clipboard size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-800 bg-[#111] overflow-hidden flex flex-col">
                 <div className="flex items-center justify-between bg-slate-800/30 px-4 py-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">JSON Data</span>
                    <button onClick={download} className="text-xs font-bold text-emerald-400 flex items-center gap-1 hover:text-emerald-300"><Download size={14}/> Download JSON</button>
                 </div>
                 <pre className="p-4 overflow-auto max-h-60 font-mono text-[11px] leading-5 text-emerald-500/80 custom-scrollbar">
                   {JSON.stringify({ analyzer: { name: "Facebook Public Analyzer", version: "4.1" }, analyzed_at: new Date().toISOString(), url_analysis: result }, null, 2)}
                 </pre>
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

FacebookProfileTool.tool = { id: 'facebook-profile', Component: FacebookProfileTool };
export default FacebookProfileTool;
