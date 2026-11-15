// 동작 띠: 지배자 마법 · 소환수 공격을 억지로 일으켜 0.1초마다 찍어 한 장으로(올리기 전 눈으로 보는 관문)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = process.argv[2], nm = process.argv[3] || '확인';
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : 'image/webp' }); r.end(d); }); }).listen(8166);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2 })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8166/index.html?test=1'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  await pg.evaluate(() => { st.stage = st.best = 3; st.raised = 99; st.up.summon = 14; UI.render(true); }); await pg.waitForTimeout(5000);
  const fr = [];
  for (const who of ['lord', 'army']) { await pg.evaluate(w => { S.hitstop = 0; if (w === 'lord') { S.lord.shotT = 0.28; S.lord.vA = 0; } else for (const a of S.army) { a.sw = 1; a.vT = 0; } }, who);
    for (let k = 0; k < 8; k++) { await pg.waitForTimeout(90); const f = `/tmp/dd_${who}_${k}.png`; await pg.screenshot({ path: f, clip: { x: 0, y: 28, width: 360, height: 230 } }); fr.push(f); } }
  execSync(`ffmpeg -y -loglevel error ${fr.map(f => '-i ' + f).join(' ')} -filter_complex "xstack=inputs=16:layout=${Array.from({ length: 16 }, (_, i) => `${(i % 4) ? Array.from({ length: i % 4 }, () => 'w0').join('+') : 0}_${Math.floor(i / 4) ? Array.from({ length: Math.floor(i / 4) }, () => 'h0').join('+') : 0}`).join('|')},scale=1440:-1" -q:v 4 /home/claude/rec/동작띠_${nm}.jpg`);
  console.log('오류', errs.length, errs.join('|').slice(0, 200)); await b.close(); srv.close(); })();
