// node 자랑찍기.js 폴더 이름 → /home/claude/rec/자랑_이름.jpg(오른쪽 단추 기둥 + 자랑 카드 창) · /home/claude/rec/자랑카드_이름.jpg(만든 카드 그 자체) — 순서 #11 입소문 장치
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], nm = process.argv[3] || '확인', PORT = 8197;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { st.stage = st.best = 23; st.daysPlayed = 14; st.up.summon = 14; st.thralls = 3; const H = JB.HEROES.slice(0, 4).map(h => h.id); for (const id of H) st.heroes[id] = { lv: 2, wp: 1 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => H[i] || null); st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; delete st.seen.brag; UI.closeModal(); });
  await pg.waitForTimeout(5000); await pg.evaluate(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); });
  const has = await pg.evaluate(() => !!document.querySelector('#tools button[data-x="brag"]') && document.querySelector('#tools button[data-x="brag"]').className);
  await pg.click('#tools button[data-x="brag"]'); await pg.waitForTimeout(800);
  await pg.screenshot({ path: `/home/claude/rec/자랑_${nm}.jpg`, quality: 85 });
  const card = await pg.evaluate(() => BRAG.c ? BRAG.c.toDataURL('image/jpeg', 0.85) : null); if (card) fs.writeFileSync(`/home/claude/rec/자랑카드_${nm}.jpg`, Buffer.from(card.split(',')[1], 'base64'));
  console.log(JSON.stringify({ 단추: has, 카드: !!card, 글: await pg.evaluate(() => BRAG.text()) }), '오류', errs.length, errs.slice(0, 3).join(' | ')); await b.close(); srv.close(); })();
