// node 대결찍기.js 폴더 [pc|폰] 이름 → /home/claude/rec/대결_이름_화면.jpg: 보스 대결 등장 0~2.6초를 0.2초 간격 14장
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = process.argv[2], vp = process.argv[3] || 'pc', nm = process.argv[4] || '확인', PORT = 8221 + (vp === 'pc' ? 0 : 1);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext(vp === 'pc' ? { viewport: { width: 1600, height: 1150 }, deviceScaleFactor: 1 } : { viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { st.myName = '진동'; st.stage = st.best = 9; st.wave = 3; st.waveT = 0; st.daysPlayed = 14; st.up.summon = 10; st.spellReady = 999; st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; UI.closeModal(); JB.startWave(st); setInterval(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }, 100); });
  for (let i = 0; i < 300; i++) { await pg.waitForTimeout(50); if (await pg.evaluate(() => document.querySelector('#vsfx.go'))) break; }
  const el = await pg.$('#stagewrap'), fr = [];
  for (let i = 0; i < 14; i++) { const f = `/tmp/vs_${vp}_${i}.png`; await el.screenshot({ path: f }); fr.push(f); await pg.waitForTimeout(40); }
  execSync(`ffmpeg -loglevel error -y ${fr.map(f => `-i ${f}`).join(' ')} -filter_complex "${fr.map((_, i) => `[${i}]scale=${vp === 'pc' ? 280 : 240}:-2[s${i}]`).join(';')};${fr.map((_, i) => `[s${i}]`).join('')}xstack=inputs=14:layout=${Array.from({ length: 14 }, (_, i) => `${i % 7 === 0 ? '0' : Array.from({ length: i % 7 }, () => 'w0').join('+')}_${i < 7 ? '0' : 'h0'}`).join('|')}" /home/claude/rec/대결_${nm}_${vp}.jpg`);
  console.log(JSON.stringify({ 화면: vp, 오류: errs.slice(0, 3) })); await b.close(); srv.close(); })();
