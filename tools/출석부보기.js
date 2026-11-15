// 7일 출석부 시험: 6판에 저절로 뜨는지 · 받으면 늘어나는지 · 7일째 상급 영웅 · 화면 찍기 → node 출석부보기.js 폴더
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'); const dir = process.argv[2];
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8166);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2 })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8166/index.html?test=1'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  console.log('5판에선', await pg.evaluate(() => { st.stage = st.best = 5; return JB.loginCan(st); })); await pg.waitForTimeout(3000);
  console.log('5판 창', await pg.evaluate(() => document.getElementById('modal').style.display));
  await pg.evaluate(() => { UI.closeModal(); st.seen.curTip = 1; st.stage = st.best = 6; }); let t0 = Date.now(); while (Date.now() - t0 < 30000 && (await pg.evaluate(() => document.getElementById('modal').style.display)) !== 'flex') await pg.waitForTimeout(300);
  console.log('6판 창', await pg.evaluate(() => document.querySelector('#modal h3')?.textContent)); await pg.screenshot({ path: '/home/claude/rec/출석부_1일.png' });
  const g0 = await pg.evaluate(() => st.gems); await pg.evaluate(() => document.querySelector('[data-x="loginClaim"]').click()); await pg.waitForTimeout(500);
  console.log('1일 받음 마정석', g0, '→', await pg.evaluate(() => st.gems), '· 또 받을 수', await pg.evaluate(() => JB.loginCan(st)));
  for (let d = 2; d <= 7; d++) { const r = await pg.evaluate(() => { JB.newDay(st, st.day + 1); const h0 = Object.keys(st.heroes).length; const g = JB.loginClaim(st); return [g.day, g.gems, g.bones, g.souls, g.hero ? g.hero.id + (g.hero.isNew ? '(새)' : '') : '', Object.keys(st.heroes).length - h0]; }); console.log(d + '일', JSON.stringify(r)); }
  await pg.evaluate(() => { JB.newDay(st, st.day + 1); UI.closeModal(); EX.loginOpen(); }); await pg.waitForTimeout(400); await pg.screenshot({ path: '/home/claude/rec/출석부_8일.png' });
  console.log('8일 창', await pg.evaluate(() => document.querySelector('#modal h3')?.textContent), '· 임무 탭 줄', await pg.evaluate(() => { UI.closeModal(); UI.tab = 'mission'; UI.render(true); return UI.tab + ' · ' + UI.tabOpen('mission') + ' · ' + document.querySelector('.lrow')?.textContent.trim(); }));
  console.log('오류', errs.length, errs.slice(0, 2).join(' | ')); await b.close(); srv.close(); })();
