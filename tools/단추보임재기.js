// node 단추보임재기.js 폴더 → JSON: 폰 두 크기(360×593 · 360×640) × 두 저장(처음 1-1 · 후반 귀빈 8 · 2막 · 군단 수련 칸) — 강화 「사기」 단추 3개가 아래 탭 줄 위에 다 보이나(잘린 픽셀) (관문 ㉛ — 전장을 키우다 값 단추가 잘렸음 11-16 15:2x)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], PORT = 8241;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const out = {};
  for (const [w, h] of [[360, 593], [360, 640]]) for (const late of [0, 1]) { const pg = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
    await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
    if (late) await pg.evaluate(() => { st.vipExp = 120000; st.awakens = 1; st.stage = st.best = 137; st.souls = 5e12; st.up.summon = 307; st.up.magic = 121; st.up.bone = 154; st.daysPlayed = 20; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; UI.closeModal(); UI.render && UI.render(true); });
    await pg.waitForTimeout(3000); await pg.evaluate(() => { UI.closeModal(); UI.render && UI.render(true); }); await pg.waitForTimeout(600);
    out[`${w}x${h}${late ? ' 후반' : ' 처음'}`] = await pg.evaluate(() => { const t = document.getElementById('tabs').getBoundingClientRect().top, B = [...document.querySelectorAll('#panel .btn.buy')].slice(0, 3); return B.length ? Math.max(0, ...B.map(e => Math.round(e.getBoundingClientRect().bottom - t))) : -1; });
    await pg.close(); }
  console.log(JSON.stringify({ 잘림: out })); await b.close(); srv.close(); })();
