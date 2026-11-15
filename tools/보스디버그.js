// 동작 띠: 지배자 마법 · 소환수 공격을 억지로 일으켜 0.1초마다 찍어 한 장으로(올리기 전 눈으로 보는 관문)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = process.argv[2], nm = process.argv[3] || '확인';
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : 'image/webp' }); r.end(d); }); }).listen(8176);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2 })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8176/index.html?test=1'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  await pg.evaluate(() => { st.stage = st.best = 3; st.raised = 99; st.up.summon = 14; UI.render(true); }); await pg.waitForTimeout(5000);
  for (let k = 0; k < 6; k++) { console.log(JSON.stringify(await pg.evaluate(() => ({ ph: S.phase, boss: st.boss, bs: Math.round(S.bShift || 0), BX, VX1, W: VW.w, gx: Math.round(S.giant.x), front: Math.round(armyFront()), tx: S.army.map(a => Math.round(a.tx)) })))); await pg.waitForTimeout(800); }
  ;
  console.log('오류', errs.length, errs.join('|').slice(0, 200)); await b.close(); srv.close(); })();
