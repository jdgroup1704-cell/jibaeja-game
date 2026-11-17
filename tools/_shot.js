const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], PORT = 8319;
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': {'.js':'text/javascript','.html':'text/html','.css':'text/css','.webp':'image/webp','.png':'image/png'}[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--mute-audio'] });
  for (const [h, stg] of [[593, 6], [640, 30], [780, 30]]) { const pg = await (await b.newContext({ viewport: { width: 360, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
    await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1000);
    await pg.evaluate(s => { st.raised = 99; st.stage = st.best = s; st.souls = s > 10 ? 5e6 : 300; st.up.summon = s > 10 ? 12 : 2; st.tombGift = 1; st.tombQ = [{slot:"ring",g:2,ilv:5,lv:0},{slot:"crown",g:1,ilv:5,lv:0}]; (st.seen = st.seen || {}).curTip = 1; UI.closeModal(); UI.tab = 'up'; UI.render(true); }, stg); await pg.waitForTimeout(2200);
    for (let i = 0; i < 3; i++) { await pg.evaluate(() => UI.closeModal()); await pg.waitForTimeout(400); }
    console.log(h, JSON.stringify(await pg.evaluate(() => { const R = s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return [Math.round(q.top), Math.round(q.height)]; }; return { 패널: R('#panel'), 전장: R('#stagewrap'), 칸: R('.ucard'), 단추: R('.ucard .btn.buy'), 탭: R('#tabs'), 칸수: document.querySelectorAll('.ucard').length }; })));
    await pg.screenshot({ path: `/tmp/아래${h}.png` }); await pg.close(); }
  await b.close(); srv.close(); })();
