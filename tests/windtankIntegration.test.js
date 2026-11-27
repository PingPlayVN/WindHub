import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  WINDTANK_ENTRY_PATH,
  extractWindTankAssetUrls,
  isGenuineWindTankHtml,
} from '../src/modules/Entertainment/WindTank/windtankOfflineSync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

test('extractWindTankAssetUrls extracts all relative WindTank chunks and ignores foreign origins', () => {
  const sampleHtml = `<!doctype html>
<html lang="vi">
  <head>
    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    <script type="module" crossorigin src="./assets/index-D4Oj66O6.js"></script>
    <link rel="modulepreload" crossorigin href="./assets/peerjs-a0_5iFT8.js">
    <link rel="modulepreload" crossorigin href="./assets/phaser-UtE5cioH.js">
    <link rel="stylesheet" crossorigin href="./assets/index-MrS6J34T.css">
    <link rel="preconnect" href="https://fonts.googleapis.com" />
  </head>
  <body>
    <main id="game-root"></main>
  </body>
</html>`;

  assert.equal(isGenuineWindTankHtml(sampleHtml), true);
  assert.equal(isGenuineWindTankHtml('<!doctype html><div id="root"></div>'), false);

  const urls = extractWindTankAssetUrls(
    sampleHtml,
    'https://windhub.example.com/windtank/index.html'
  );

  assert.deepEqual(urls, [
    WINDTANK_ENTRY_PATH,
    '/windtank/favicon.svg',
    '/windtank/assets/index-D4Oj66O6.js',
    '/windtank/assets/peerjs-a0_5iFT8.js',
    '/windtank/assets/phaser-UtE5cioH.js',
    '/windtank/assets/index-MrS6J34T.css',
  ]);
});

test('vercel.json proxies /windtank/* to windtank-trouble.vercel.app before SPA catch-all', () => {
  const vercelRaw = fs.readFileSync(path.join(repoRoot, 'vercel.json'), 'utf8');
  const vercelConfig = JSON.parse(vercelRaw);

  assert.ok(Array.isArray(vercelConfig.rewrites), 'rewrites array must exist');
  const windtankSubIdx = vercelConfig.rewrites.findIndex(
    (r) =>
      r.source === '/windtank/:path*' &&
      r.destination === 'https://windtank-trouble.vercel.app/:path*'
  );
  const catchAllIdx = vercelConfig.rewrites.findIndex((r) => r.source === '/(.*)');

  assert.ok(windtankSubIdx >= 0, 'must proxy /windtank/:path* to windtank-trouble.vercel.app');
  assert.ok(catchAllIdx > windtankSubIdx, '/windtank rewrite must precede SPA catch-all');
});

test('Entertainment tab is renamed to Giải trí and split into offline games vs online folk casino', () => {
  const navSrc = fs.readFileSync(
    path.join(repoRoot, 'src/components/os/navigationConfig.js'),
    'utf8'
  );
  assert.match(navSrc, /label:\s*'Giải trí'/);
  assert.doesNotMatch(navSrc, /Giải trí dân gian/);

  const appSrc = fs.readFileSync(path.join(repoRoot, 'src/App.jsx'), 'utf8');
  assert.match(appSrc, /path="\/entertainment"\s+element=\{<Entertainment\s*\/>\}/);
  assert.match(appSrc, /path="\/entertainment\/windtank"\s+element=\{<WindTankGame\s*\/>\}/);
  assert.match(
    appSrc,
    /path="\/entertainment\/tai-xiu"\s+element=\{<OfflineGate[^>]*><TaiXiu\s*\/><\/OfflineGate>\}/
  );

  const entSrc = fs.readFileSync(
    path.join(repoRoot, 'src/modules/Entertainment/index.jsx'),
    'utf8'
  );
  assert.match(entSrc, /Trò chơi/);
  assert.match(entSrc, /Sòng bạc dân gian/);
  assert.match(entSrc, /WindTank Trouble/);
  assert.match(entSrc, /Tài Xỉu Dân Gian/);
  assert.match(entSrc, /Bầu Cua Tôm Cá/);
  assert.match(entSrc, /\/games\/windtank-cover\.jpg/);
  assert.match(entSrc, /\/games\/tai-xiu-cover\.jpg/);
  assert.match(entSrc, /\/games\/bau-cua-cover\.jpg/);

  for (const thumb of ['windtank-cover.jpg', 'tai-xiu-cover.jpg', 'bau-cua-cover.jpg']) {
    assert.equal(
      fs.existsSync(path.join(repoRoot, 'public/games', thumb)),
      true,
      `missing game thumbnail ${thumb}`
    );
  }
});

test('built sw.js isolates /windtank/* cache from WindHub shell /index.html', () => {
  const swPath = path.join(repoRoot, 'dist/sw.js');
  if (!fs.existsSync(swPath)) return;
  const swSource = fs.readFileSync(swPath, 'utf8');
  assert.match(swSource, /WINDTANK_CACHE\s*=\s*"windhub-windtank-v1"/);
  assert.match(swSource, /url\.pathname\.startsWith\("\/windtank\/"\)/);
});
