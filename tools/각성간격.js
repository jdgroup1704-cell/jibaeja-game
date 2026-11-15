// 봇으로 각성 시각 · 그때 최고 판 기록: node 각성간격.js 폴더 [게임 분=60] [배속=8]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'); const dir = process.argv[2], mins = +(process.argv[3] || 60), sp = +(process.argv[4] || 8);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8182);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 } })).newPage();
  await pg.goto(`http://localhost:8182/index.html?bot=1&speed=${sp}&seed=7`); await pg.waitForTimeout(2000);
  await pg.evaluate(() => { window.__aw = []; let a = st.awakens, pb = 0; setInterval(() => { if (st.awakens !== a) { __aw.push([Math.round(BOT.t), pb, st.awakens, Math.round(st.sigils || 0)]); a = st.awakens; } pb = st.best; }, 200); });
  await pg.waitForTimeout(mins * 60000 / sp);
  const r = await pg.evaluate(() => ({ aw: __aw, t: Math.round(BOT.t), best: st.best, stage: st.stage }));
  let prev = 0; for (const [t, best, n, sg] of r.aw) { console.log(`각성 ${n}번: ${Math.floor(t / 60)}분 ${t % 60}초 (앞과 ${Math.round((t - prev) / 6) / 10}분) · 최고 ${best}판 · 인장 ${sg}`); prev = t; }
  console.log(`끝 ${Math.floor(r.t / 60)}분 · 최고 ${r.best} · 지금 ${r.stage}`); await b.close(); srv.close(); })();
