// 게임 시간을 한 장면씩 직접 돌려(초당 30장 게임 시간) 찍는 느린 영상: node 느린영상.js 폴더 이름 [초=4] [판=8]
// 화면 그리기 타이머(1/60씩 줄어드는 것)까지 정확히 맞음 → 타격 순간 · 내디딤 · 밀림을 한 장씩 볼 수 있음
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process'); const dir = process.argv[2], name = process.argv[3] || '느린', secs = +(process.argv[4] || 4), stage = +(process.argv[5] || 8);
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : p.endsWith('.css') ? 'text/css' : p.endsWith('.mp3') ? 'audio/mpeg' : 'image/webp' }); r.end(d); }); }).listen(8185);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2 })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8185/index.html?test=1'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  await pg.evaluate(s => { st.stage = st.best = s; st.raised = 99; st.up.summon = 12; st.seen.curTip = 1; st.seen.fallTip = 1; st.seen.idleTip = 9; for (const k in LM.DEF) st.seen['lm_' + k] = 1; UI.closeModal(); UI.render(true); }, stage); await pg.waitForTimeout(5000);
  await pg.evaluate(() => { UI.closeModal(); const v = document.getElementById('ver'); if (v) v.style.display = 'none'; document.querySelectorAll('.toast,#toast').forEach(e => e.remove());
    window.__q = []; window.__t = performance.now(); window.requestAnimationFrame = cb => { window.__q.push(cb); return 1; }; });
  await pg.waitForTimeout(300);
  const d = `/tmp/sv_${name}`; execSync(`rm -rf ${d}; mkdir -p ${d}`); const n = secs * 30, hits = [];
  for (let i = 0; i < n; i++) { await pg.evaluate(() => { for (let k = 0; k < 2; k++) { window.__t += 1000 / 60; const q = window.__q; window.__q = []; for (const cb of q) { try { cb(window.__t); } catch (e) { (window.__err = window.__err || []).push(String(e.stack).slice(0, 300)); window.__q.push(cb); } } } });
    hits.push(await pg.evaluate(() => (S.aslash || []).filter(f => f.star && f.age < 0.04).map(f => f.c).concat((S.ashots || []).filter(f => f.age > f.life - 0.04 && f.age <= f.life).map(() => 'a')))); await pg.screenshot({ path: `${d}/${String(i).padStart(3, '0')}.jpg`, type: 'jpeg', quality: 85, clip: { x: 0, y: 40, width: 360, height: 300 } }); }
  fs.writeFileSync(`${d}/hits.json`, JSON.stringify(hits)); execSync(`ffmpeg -y -loglevel error -framerate 30 -i ${d}/%03d.jpg -vf "scale=720:-2" -c:v libx264 -preset veryfast -crf 24 -pix_fmt yuv420p /home/claude/rec/${name}.mp4`);
  console.log('장', n, '· 오류', errs.length, errs.join('|').slice(0, 200), JSON.stringify(await pg.evaluate(() => (window.__err || []).slice(0, 2)))); await b.close(); srv.close(); })();
