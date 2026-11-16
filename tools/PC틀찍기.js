// node PC틀찍기.js 폴더 출력.png [가로 세로] [판] → PC 넓은 화면이 폰 틀(가로 430)을 감싸 크게 보이나: 틀 안 화면 · 틀 크기 · 틀 안 innerWidth(폰 규칙이 먹나)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], out = process.argv[3], VW = +(process.argv[4] || 1920), VH = +(process.argv[5] || 1000), STG = +(process.argv[6] || 12), PORT = 8250;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'commit' }); await pg.waitForTimeout(5000); const fr = pg.frames().find(f => /inner=1/.test(f.url())) || pg.mainFrame();
  await fr.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  await fr.evaluate(stg => { st.stage = st.best = stg; st.daysPlayed = 14; st.souls = 5e6; st.up.summon = 10; for (const h of JB.HEROES.slice(0, 3)) st.heroes[h.id] = { lv: 2, wp: 1 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => JB.HEROES[i] ? JB.HEROES[i].id : null); for (const k in st.seen) st.seen[k] = st.seen[k] || 9; UI.closeModal(); setInterval(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }, 150); }, STG);
  await pg.waitForTimeout(7000); const info = await fr.evaluate(() => ({ 틀안가로: innerWidth, 틀안세로: innerHeight, 앱: document.getElementById('app').className })); const f = await pg.$('#pf'); const box = f ? await f.boundingBox() : null;
  await pg.screenshot({ path: out }); console.log(JSON.stringify({ 틀: box && { w: Math.round(box.width), h: Math.round(box.height) }, ...info, 오류: errs.slice(0, 3) })); await b.close(); srv.close(); })();
