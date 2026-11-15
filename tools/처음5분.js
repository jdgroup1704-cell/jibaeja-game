// 처음 하는 사람처럼: 손가락이 가리키는 곳만 누르며 5분(2배속 → 실제 2분 반). 12장 띠 + 누른 기록
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process'); const dir = process.argv[2];
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : 'image/webp' }); r.end(d); }); }).listen(8178);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8178/index.html?speed=2'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  const shots = [3, 10, 20, 35, 50, 65, 80, 95, 110, 125, 140, 150], fr = [], log = []; let t0 = Date.now(), si = 0;
  while (si < shots.length) { const t = (Date.now() - t0) / 1000;
    if (t >= shots[si]) { const f = `/tmp/p5_${si}.png`; await pg.screenshot({ path: f }); fr.push(f); si++; continue; }
    const r = await pg.evaluate(() => { const m = document.getElementById('modal'); if (m && m.style.display === 'flex') { const g = m.querySelector('[data-close]') || m.querySelector('.btn.gold:not([disabled])'); const tx = g ? g.textContent.trim().slice(0, 12) : ''; g && g.click(); return '창:' + tx; }
      if (S.phase === 'prompt') { document.getElementById('cast')?.click(); return '대마법'; }
      const f = document.getElementById('finger'); if (f && f.classList.contains('on')) { const x = parseFloat(f.style.left), y = parseFloat(f.style.top), el = document.elementFromPoint(x, y - 4); const b = el && (el.closest('button,[data-act],[data-x],[data-tab],.ucard') || el); if (b) { b.click(); return '손가락:' + (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 12); } } return ''; });
    if (r) log.push(`${Math.round((Date.now() - t0) / 1000 * 2)}초 ${r}`); await pg.waitForTimeout(1200); }
  const info = await pg.evaluate(() => ({ stage: st.stage, best: st.best, aw: st.awakens, heroes: Object.keys(st.heroes).length, up: st.up }));
  execSync(`ffmpeg -y -loglevel error ${fr.map(f => '-i ' + f).join(' ')} -filter_complex "xstack=inputs=12:layout=${Array.from({ length: 12 }, (_, i) => `${(i % 6) ? Array.from({ length: i % 6 }, () => 'w0').join('+') : 0}_${Math.floor(i / 6) ? 'h0' : 0}`).join('|')},scale=2400:-1" -q:v 4 /home/claude/rec/처음5분.jpg`);
  console.log(log.join('\n')); console.log(JSON.stringify(info)); console.log('오류', errs.length, errs.join('|').slice(0, 300)); await b.close(); srv.close(); })();
