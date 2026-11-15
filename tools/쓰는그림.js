// node 쓰는그림.js 폴더 → 순서 #10 그림체 교체 대상: 실제 플레이(1-1 · 3-10 · 보스 · 영웅 4)에서 화면에 그려진 그림 이름과 횟수
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'); const dir = process.argv[2], PORT = 8191;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(() => { window.__D = {}; const od = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = function (im, ...a) { const s = im && im.src; if (s) { const n = decodeURIComponent(s.split('/').pop().split('?')[0]); __D[n] = (__D[n] || 0) + 1; } return od.call(this, im, ...a); }; });
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click());
  await pg.waitForTimeout(15000);
  await pg.evaluate(() => { st.stage = st.best = 30; st.daysPlayed = 14; st.souls = 5e6; st.up.summon = 12; for (const h of JB.HEROES.slice(0, 8)) st.heroes[h.id] = { lv: 2, wp: 1 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => JB.HEROES[i] ? JB.HEROES[i].id : null); st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; UI.closeModal(); });
  for (let i = 0; i < 8; i++) { await pg.waitForTimeout(5000); await pg.evaluate(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }); }
  const D = await pg.evaluate(() => __D); const m = Object.entries(D).sort((a, b) => b[1] - a[1]);
  console.log(JSON.stringify({ 그림수: m.length, 그림: m, 오류: errs }, null, 0)); process.exit(0); })();
