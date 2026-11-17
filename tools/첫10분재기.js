// 처음 10분 동안 「새로운 일」이 언제 생기는지 잼: node 첫10분재기.js 폴더 [배속4] [분10]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], sp = +(process.argv[3] || 4), mins = +(process.argv[4] || 10);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8155);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await (await b.newContext({ viewport: { width: 384, height: 665 }, isMobile: true, hasTouch: true })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:8155/index.html?bot=1&speed=${sp}&seed=3`); await pg.waitForTimeout(2000);
  await pg.evaluate(() => { window.__e = []; const seen = {}; let lastSt = 0, lastH = 0, lastG = 0, lastPh = '';
    const add = (k, x) => __e.push([+(BOT.t).toFixed(0), k, x || '']);
    setInterval(() => { for (const k of Object.keys(JB.C.UNLOCK)) if (!seen[k] && JB.unlocked(st, k)) { seen[k] = 1; add('열림', k); }
      if (st.stage !== lastSt) { lastSt = st.stage; add('판', st.stage); }
      const h = Object.keys(st.heroes || {}).length; if (h > lastH) { lastH = h; add('영웅', h); }
      const tq = (st.tombQ || []).length; if (tq > (seen.__tq || 0)) add('무덤', tq); seen.__tq = tq;   /* 11-17 22:5x 무덤도 「새것」 */
      const g = (st.gear && Object.values(st.gear).filter(Boolean).length) || 0; if (g > lastG) { lastG = g; add('장비', g); }
      if (S.phase !== lastPh && ['prompt', 'fight', 'boss'].includes(S.phase)) add('보스', S.phase); lastPh = S.phase;
      const t = document.querySelector('.toast.on, #toast.on'); if (t && t.textContent !== seen.__t) { seen.__t = t.textContent; add('알림', t.textContent.slice(0, 24)); }
    }, 200); });
  await pg.waitForTimeout(mins * 60000 / sp);
  const r = await pg.evaluate(() => ({ e: __e, t: BOT.t, st: st.stage, best: st.best, aw: st.awakens, souls: st.souls }));
  let prev = 0, gap = [0, 0]; const nov = r.e.filter(x => x[1] !== '판');
  for (const x of nov) { if (x[0] - prev > gap[0]) gap = [x[0] - prev, prev]; prev = x[0]; }
  if (r.t - prev > gap[0]) gap = [r.t - prev, prev];
  console.log(r.e.map(x => `${Math.floor(x[0] / 60)}:${String(x[0] % 60).padStart(2, '0')} ${x[1]} ${x[2]}`).join('\n'));
  console.log(`끝 ${r.t.toFixed(0)}초 판${r.st} 최고${r.best} 각성${r.aw} · 판 말고 새것 없는 가장 긴 틈 ${gap[0].toFixed(0)}초(${gap[1]}초부터)`);
  console.log('오류', errs.length, errs.slice(0, 3).join(' | ')); await b.close(); srv.close();
})();
