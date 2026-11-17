// 보통 판 싸움을 영상(초당 15장)으로: node 군단영상.js 폴더 이름 [초=6]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process'); const dir = process.argv[2], name = process.argv[3] || '군단', secs = +(process.argv[4] || 6);
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : p.endsWith('.css') ? 'text/css' : 'image/webp' }); r.end(d); }); }).listen(8184);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2 })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8184/index.html?test=1'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  await pg.evaluate(s => { window.__STG = s; }, +(process.env.STG || 8));
  await pg.evaluate(() => { st.stage = st.best = (window.__STG || 8); st.raised = 99; st.up.summon = 12; st.seen.curTip = 1; st.seen.fallTip = 1; st.seen.idleTip = 9; UI.closeModal(); UI.render(true); }); await pg.waitForTimeout(6000); await pg.evaluate(() => { UI.closeModal(); const v = document.getElementById('ver'); if (v) v.style.display = 'none'; });
  const d = `/tmp/gv_${name}`; execSync(`rm -rf ${d}; mkdir -p ${d}`); const n = secs * 15; const t0 = Date.now();
  for (let i = 0; i < n; i++) { await pg.screenshot({ path: `${d}/${String(i).padStart(3, '0')}.jpg`, type: 'jpeg', quality: 80, clip: { x: 0, y: 40, width: 360, height: 300 } }); const w = t0 + (i + 1) * 66 - Date.now(); if (w > 0) await pg.waitForTimeout(w); }
  const real = (Date.now() - t0) / 1000;
  execSync(`ffmpeg -y -loglevel error -framerate ${(n / real).toFixed(2)} -i ${d}/%03d.jpg -vf "scale=720:-2" -c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p /home/claude/rec/${name}.mp4`);
  const pick = Array.from({ length: 12 }, (_, i) => `${d}/${String(Math.floor(i * n / 12)).padStart(3, '0')}.jpg`);
  execSync(`ffmpeg -y -loglevel error ${pick.map(f => '-i ' + f).join(' ')} -filter_complex "xstack=inputs=12:layout=${Array.from({ length: 12 }, (_, i) => `${(i % 4) ? Array.from({ length: i % 4 }, () => 'w0').join('+') : 0}_${Math.floor(i / 4) ? Array.from({ length: Math.floor(i / 4) }, () => 'h0').join('+') : 0}`).join('|')}" -q:v 4 /home/claude/rec/${name}_띠.jpg`);
  console.log('실제', real.toFixed(1), '초', n, '장 · 오류', errs.length, errs.join('|').slice(0, 200)); await b.close(); srv.close(); })();
