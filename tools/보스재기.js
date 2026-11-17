// 보스(거대한 적) 동작을 시간순으로 기록: node 보스재기.js 폴더 [판]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], stg = +(process.argv[3] || 10);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8153);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await (await b.newContext({ viewport: { width: 384, height: 665 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8153/index.html?test=1&seed=5'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  await pg.evaluate(s => { st.stage = st.best = s - 1; st.wave = 3; st.autoCast = true; st.up.summon = 8; st.up.bone = 6; st.up.magic = 0; window.__g = []; let last = '';
    setInterval(() => { const g = S.giant, bp = st.boss ? st.boss.phase : '-'; const k = `${S.phase}|${bp}|${g.on ? 'on' : 'off'}|${g.dead ? 'dead' : ''}|${(g.raise || 0) > 0.05 ? 'raise' : ''}|${(g.slam || 0) > 0.05 ? 'slam' : ''}|${(g.walk || 0) > 0.05 ? 'walk' : ''}|${g.hitFl > 0 ? 'hit' : ''}|${g.wind ? 'wind' : ''}`; if (k !== last) { __g.push((S.t).toFixed(1) + ' ' + k + ' x' + Math.round(g.x)); last = k; } }, 50); }, stg);
  for (let i = 0; i < 40; i++) { await pg.waitForTimeout(1000); await pg.evaluate(() => { if (S.phase === 'prompt' || (st.boss && st.boss.phase === 'wait' && JB.canCast(st))) { const c = document.getElementById('cast'); c && c.click(); } }); }
  console.log((await pg.evaluate(() => __g.slice(0, 80).join('\n'))));
  console.log('오류', errs.length, errs.slice(0, 3).join(' | ')); await b.close(); srv.close();
})();
