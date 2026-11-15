// node 켜는시간.js 폴더 [망속도kbps=1600] [지연ms=150] → JSON: 느린 휴대폰 망(기본 「빠른 3G」 1.6Mbps · 150ms)에서 ① 첫 글자(천 년의 잠) 뜰 때까지 ② 화면 누른 뒤 싸움 첫 장면(군단 그림이 실제로 그려짐)까지 ③ 그때까지 받은 크기 ④ 가장 큰 파일들 — 순서 #13
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], KB = +(process.argv[3] || 1600), RTT = +(process.argv[4] || 150), PORT = 8201;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const zlib = require('zlib'), GZ = process.env.GZ !== '0';   /* 실제 올리는 곳(claude.ai)처럼 글 파일(js · html)은 압축해서 보냄 — GZ=0이면 압축 없이 */
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } const ext = path.extname(p), h = { 'Content-Type': MIME[ext] || 'application/octet-stream' }; if (GZ && /\.(js|html|json)$/.test(ext) && /gzip/.test(q.headers['accept-encoding'] || '')) { h['Content-Encoding'] = 'gzip'; d = zlib.gzipSync(d); } r.writeHead(200, h); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const ctx = await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const cdp = await ctx.newCDPSession(pg); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: RTT, downloadThroughput: KB * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: +(process.env.CPU || 4) });   /* 보급형 휴대폰 흉내(CPU 4배 느리게) */
  const files = []; let bytes = 0; const t0 = Date.now(); let mark = null;
  cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; }); cdp.on('Network.responseReceived', e => { files.push({ u: e.response.url.split('/').slice(3).join('/').split('?')[0], id: e.requestId, t: Date.now() - t0 }); });
  const sizes = {}; cdp.on('Network.loadingFinished', e => { sizes[e.requestId] = e.encodedDataLength; });
  await pg.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'commit' });
  await pg.waitForFunction(() => { const o = document.getElementById('opening'); return o && o.offsetParent !== null && /잠/.test(o.innerText); }, null, { timeout: 120000 }); const tOpen = Date.now() - t0, bOpen = bytes;
  /* 「불러오는 중 N%」이면 누름이 무시됨 → 「화면을 누르세요」가 뜰 때까지 기다렸다 누름(사람과 같게) */
  await pg.waitForFunction(() => { const o = document.getElementById('opening'); return o && !o.classList.contains('loading'); }, null, { timeout: 120000 }); const tReady = Date.now() - t0;
  await pg.waitForTimeout(300); await pg.evaluate(() => document.getElementById('opening')?.click()); const tTap = Date.now() - t0;
  /* 싸움 첫 장면 = 군단 · 적 새 그림이 실제로 한 번 그려짐 */
  await pg.evaluate(() => { window.__drawn = 0; const vd = window.vsDraw; window.vsDraw = function (n, an) { const M = VS[n]; if (M && ART[M.f + '_' + an] && /^(sumv|foev|lordw|heroI)/.test(n)) window.__drawn++; return vd.apply(this, arguments); }; });
  let tFight = null; for (let i = 0; i < 600; i++) { await pg.waitForTimeout(100); if (await pg.evaluate(() => window.__drawn > 3 && document.getElementById('opening').style.display === 'none')) { tFight = Date.now() - t0; break; } }
  const bFight = bytes; await pg.waitForTimeout(3000);
  const big = files.map(f => ({ 파일: f.u, KB: Math.round((sizes[f.id] || 0) / 1024), 받기시작초: Math.round(f.t / 100) / 10 })).filter(f => f.KB > 0).sort((a, b) => b.KB - a.KB);
  const firstFight = big.filter(f => f.받기시작초 * 1000 <= (tFight || 1e9));
  console.log(JSON.stringify({ 망: `${KB}kbps · ${RTT}ms · CPU 4배 느림`, 첫글자초: Math.round(tOpen / 100) / 10, 첫글자까지MB: Math.round(bOpen / 1048576 * 10) / 10, 누를수있음초: Math.round(tReady / 100) / 10, 누름초: Math.round(tTap / 100) / 10, 싸움첫장면초: tFight == null ? null : Math.round(tFight / 100) / 10, 누른뒤기다림초: tFight == null ? null : Math.round((tFight - tTap) / 100) / 10, 싸움까지MB: Math.round(bFight / 1048576 * 10) / 10, 파일수: files.length, 큰파일: firstFight.slice(0, 80), 오류: errs.slice(0, 3) }));
  await b.close(); srv.close(); })();
