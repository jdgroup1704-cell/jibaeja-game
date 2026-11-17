// node 시범맞춤재기.js 폴더 → 관문 ㊵ (11-17 16:3x 던전 히어로 조언 4 맞춤): 내 기록 복사본으로 시범 · 손가락 · 결과만(그림 건너뛰기) · 새로 고침해도 시범 유지 · 끝내면 원래 기록
// node 탭덩어리.js 폴더 → 대표님 폰 360×780 · 3-10(14일째): 탭마다 아래 칸 높이 · 내용 높이(몇 배) · 덩어리 수 · 덩어리 이름
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], PORT = 9050 + Math.floor(Math.random() * 30);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--mute-audio'] }); const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const pg = await ctx.newPage(); const err = []; pg.on('pageerror', e => err.push(String(e).slice(0, 150)));
  const U = `http://localhost:${PORT}/index.html`; const R = {};
  await pg.goto(U); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(800);
  await pg.evaluate(() => { st.stage = st.best = 20; st.souls = 1e5; save(); }); R.진짜키 = await pg.evaluate(() => SAVE_KEY);
  const real0 = await pg.evaluate(() => localStorage.getItem('jibaeja_b1115102811').length);
  await pg.evaluate(() => { location.hash = 'demo-copy'; location.reload(); }); await pg.waitForTimeout(3500);
  R.복사 = await pg.evaluate(() => ({ 키: SAVE_KEY, 판: st.stage, 주소: location.hash, 띠: !!document.getElementById('demobar') }));
  await pg.evaluate(() => { document.querySelector('#demobar [data-sp="1"]').click(); }); let fg = 0;
  for (let i = 0; i < 40; i++) { await pg.waitForTimeout(250); fg += await pg.evaluate(() => document.getElementById('dfinger')?.classList.contains('on') ? 1 : 0); } R.손가락보임 = fg;
  await pg.screenshot({ path: '/tmp/시범_손.png' });
  const s0 = await pg.evaluate(() => ({ t: BOT.t, 판: st.best })); await pg.evaluate(() => document.querySelector('#demobar .dbskip').click()); await pg.waitForTimeout(15000);
  const s1 = await pg.evaluate(() => ({ t: BOT.t, 판: st.best, skip: window.DEMO_SKIP, sp: DEMO_SP })); R.결과만 = { 게임초: Math.round(s1.t - s0.t), 판: s0.판 + '→' + s1.판, skip: s1.skip, sp: s1.sp };
  await pg.screenshot({ path: '/tmp/시범_결과만.png' });
  await pg.evaluate(() => document.querySelector('#demobar .dbskip').click()); R.다시보기 = await pg.evaluate(() => ({ skip: window.DEMO_SKIP, sp: DEMO_SP }));
  await pg.goto(U); await pg.waitForTimeout(3000); R.유지 = await pg.evaluate(() => ({ DEMO, 키: SAVE_KEY, 띠: !!document.getElementById('demobar') }));
  await pg.evaluate(() => { document.querySelector('#demobar .dbx').click(); }); await pg.waitForTimeout(400); await pg.evaluate(() => document.getElementById('demoEnd')?.click()); await pg.waitForTimeout(3500);
  R.끝 = await pg.evaluate(() => ({ DEMO, 키: SAVE_KEY, 판: st.stage })); R.진짜기록그대로 = (await pg.evaluate(() => localStorage.getItem('jibaeja_b1115102811').length)) === real0 || 'len ' + real0;
  R.오류 = err; console.log(JSON.stringify(R)); await b.close(); srv.close(); })();
