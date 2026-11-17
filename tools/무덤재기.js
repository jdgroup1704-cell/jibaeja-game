// 무덤(유품 뽑기) 잼 — 순서 #34 (11-17 21:24 대표님 「재미없고 … 조사 · 분석 · 진화해」 → 처음 3분 비교: 버섯커 램프 = 첫 화면 · 누를 때마다 등급이 터짐)
// node 무덤재기.js 폴더 [높이] → JSON: 단추 보임 · 손가락 · 누르면 뼛조각 −1 · 유품 솟음(등급 칸) · 화면 안 · 사라짐 · 10번 연타 오류 0 · 사진 /home/claude/rec/무덤_관문.jpg
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], H = +(process.argv[3] || 593), PORT = 8293;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--mute-audio'] }); const pg = await (await b.newContext({ viewport: { width: 360, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(2000);
  const out = {};
  out.잠김때 = await pg.evaluate(() => { st.stage = st.best = 2; st.bones = 3; st.tombQ = []; UI.render(true); UI.skillRow(); return !!document.querySelector('#slots .tomb'); });
  await pg.evaluate(() => { st.stage = st.best = 6; st.raised = 99; st.bones = 20; st.seen = st.seen || {}; delete st.seen.tomb; st.tombGift = 1; st.tombQ = []; for (let i = 0; i < 12; i++) st.tombQ.push({ slot: JB.GEAR_SLOTS[i % 6].id, g: [0, 1, 2, 3, 4, 2][i % 6], ilv: 6, lv: 0 }); UI.closeModal(); UI.render(true); UI.skillRow(); });
  await pg.waitForTimeout(1500); await pg.evaluate(() => UI.closeModal()); await pg.waitForTimeout(400);
  const R = s => pg.evaluate(s => { const e = document.querySelector(s); if (!e || !e.offsetWidth) return null; const q = e.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)]; }, s);
  out.단추 = await R('#slots .tomb'); out.손가락 = await pg.evaluate(() => !!document.querySelector('#slots .tomb.hint'));
  const b0 = await pg.evaluate(() => [(st.tombQ || []).length, (st.gear || {}).n || 0, st.bones]);
  await pg.evaluate(() => document.querySelector('#slots .tomb').click()); await pg.waitForTimeout(350);
  out.유품 = await R('#tombfx'); out.등급칸 = await pg.evaluate(() => (document.getElementById('tombfx') || {}).className || ''); out.글 = await pg.evaluate(() => (document.getElementById('tombfx') || {}).textContent || '');
  await pg.screenshot({ path: '/tmp/무덤1.png' });
  const b1 = await pg.evaluate(() => [(st.tombQ || []).length, (st.gear || {}).n || 0, st.bones]); out.무덤 = b0[0] + '→' + b1[0]; out.뼛조각그대로 = b0[2] === b1[2]; out.장비수 = b0[1] + '→' + b1[1];
  out.손가락뒤 = await pg.evaluate(() => !!document.querySelector('#slots .tomb.hint'));
  out.화면안 = !!out.유품 && out.유품[0] >= 0 && out.유품[2] <= 360 && out.유품[1] >= 0;
  out.가림 = await pg.evaluate(() => { const f = document.getElementById('tombfx'); if (!f) return []; const a = f.getBoundingClientRect(); return ['#cast', '#hud', '#panel', '#tabs'].filter(s => { const e = document.querySelector(s); if (!e || !e.offsetWidth) return false; const o = e.getBoundingClientRect(); return o.left < a.right - 2 && o.right > a.left + 2 && o.top < a.bottom - 2 && o.bottom > a.top + 2; }); });
  await pg.waitForTimeout(2600); out.사라짐 = !(await R('#tombfx'));
  // 좋은 등급이 나왔을 때 모습(사진용): 제단 단계를 올려 여러 번
  for (let i = 0; i < 10; i++) { await pg.evaluate(() => { const t = document.querySelector('#slots .tomb'); t && t.click(); }); await pg.waitForTimeout(120); }
  await pg.waitForTimeout(250); await pg.screenshot({ path: '/tmp/무덤2.png' });
  out.연타뒤 = await pg.evaluate(() => (st.tombQ || []).length); out.빈무덤단추 = await pg.evaluate(() => !!document.querySelector('#slots .tomb'));
  out.오류 = errs.slice(0, 3);
  require('child_process').execSync(`ffmpeg -y -loglevel error -i /tmp/무덤1.png -i /tmp/무덤2.png -filter_complex hstack -q:v 3 /home/claude/rec/무덤_관문.jpg`);
  console.log(JSON.stringify(out)); await b.close(); srv.close(); })();
