// 켜는 시간 재기(느린 망 흉내): node 켜는시간.js 폴더 → 휴대폰 크기 · 빠른 3세대 망(1.6메가비트 · 150밀리초)과 보통 4세대 망에서 첫 화면 단추가 뜰 때까지 · 받은 양
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'); const dir = process.argv[2];
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8169);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  for (const [nm, kbps, lat] of [['빠른 3세대', 1600, 150], ['보통 4세대', 9000, 60]]) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true }); const pg = await ctx.newPage(); const cdp = await ctx.newCDPSession(pg);
    await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: lat, downloadThroughput: kbps * 1024 / 8, uploadThroughput: 750 * 1024 / 8 }); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    let bytes = 0, n = 0; const urls = {}, sz = []; cdp.on('Network.requestWillBeSent', e => urls[e.requestId] = e.request.url.split('/').pop().split('?')[0]); cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; n++; sz.push([urls[e.requestId], e.encodedDataLength]); });
    const t0 = Date.now(); await pg.goto('http://localhost:8169/index.html', { waitUntil: 'commit' }); if (nm === '빠른 3세대') { await pg.waitForTimeout(5000); await pg.screenshot({ path: '/home/claude/rec/불러오는중_3세대.png' }); }
    await pg.waitForFunction(() => { const o = document.getElementById('opening'); return o && o.offsetParent !== null && typeof st !== 'undefined' && !o.classList.contains('loading') && getComputedStyle(o.querySelector('.go')).opacity > 0.5; }, null, { timeout: 120000 }).catch(() => {});
    const tOpen = (Date.now() - t0) / 1000, b1 = bytes; await pg.evaluate(() => document.getElementById('opening')?.click());
    await pg.waitForFunction(() => typeof S !== 'undefined' && S.phase === 'battle', null, { timeout: 120000 }).catch(() => {}); const tPlay = (Date.now() - t0) / 1000;
    if (nm === '빠른 3세대') await pg.screenshot({ path: '/home/claude/rec/켜는순간_3세대.png' }); await pg.waitForTimeout(3000); if (process.argv[3]) console.log('큰 파일', sz.sort((a, c) => c[1] - a[1]).slice(0, 10).map(x => x[0] + ' ' + Math.round(x[1] / 1024) + '킬로').join(' · ')); console.log(`${nm}: 첫 화면 단추 ${tOpen.toFixed(1)}초(${(b1 / 1048576).toFixed(2)}메가) · 싸움 시작 ${tPlay.toFixed(1)}초 · 3초 뒤까지 ${(bytes / 1048576).toFixed(2)}메가 · 파일 ${n}개`); await ctx.close(); }
  await b.close(); srv.close(); })();
