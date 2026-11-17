// node 효과음재기.js 폴더 → 순서 #8 효과음 다듬기: 1-1 처음부터 강화 · 3-10 싸움 · 대마법까지 45초 실제로 돌며 나는 소리를 모두 기록 → 녹음(__renderSound)해서 잼
// 잼: 소리 이름마다 초당 횟수 · 실제 크기(파일 평균 dB + 부른 크기) · 녹음 전체: 0.4초 창 가장 큰 소리 · 깨짐(0.99 넘는 표본) · 1초에 10번 넘게 겹친 순간
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process'); const dir = process.argv[2], PORT = 8182;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(2000);
  for (let i = 0; i < 6; i++) { await pg.evaluate(() => { const r = document.getElementById('raiseBtn'); if (r) { r.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); r.click(); } }); await pg.waitForTimeout(600); }
  for (let i = 0; i < 6; i++) { await pg.evaluate(() => { st.souls = Math.max(st.souls, 1e4); const u = document.querySelector('[data-act="buy"]:not([disabled])'); if (u) u.click(); }); await pg.waitForTimeout(330); }
  await pg.evaluate(() => { st.stage = st.best = 30; st.souls = 5e6; st.up.summon = 12; for (const h of JB.HEROES.slice(0, 4)) st.heroes[h.id] = { lv: 2, wp: 1 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => JB.HEROES[i] ? JB.HEROES[i].id : null); st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; UI.closeModal(); UI.render(true); });
  for (let i = 0; i < 6; i++) { await pg.waitForTimeout(5000); await pg.evaluate(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }); }
  const dur = await pg.evaluate(() => performance.now() / 1000); const r = await pg.evaluate(async d => ({ wav: await window.__renderSound(d), all: window.__sndAll() }), dur);
  fs.writeFileSync('/tmp/효과음.wav', Buffer.from(r.wav, 'base64')); fs.writeFileSync('/tmp/효과음.json', JSON.stringify({ dur, all: r.all, 오류: errs.length, 오류글: errs.slice(0, 3) }));
  await b.close(); srv.close();
  console.log(execSync(`python3 ${__dirname}/효과음분석.py ${dir}`).toString()); })();
