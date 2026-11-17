// node 저장이어짐재기.js 폴더 → JSON (관문 ㉝ 11-16 19:01~19:03 대표님 「업데이트되더라도 기존에 했던 강화들 초기화되면 안 된다 · 처음부터 링크 · 업데이트 알람」)
// ① 강화 · 판을 올리고 저장 → 다시 열기(업데이트 흉내: 판 표시가 바뀐 판) → 강화 · 판 그대로? ② 판이 바뀌었으면 「업데이트됐어요」 창이 뜨나 ③ ?reset=1로 열면 1-1부터 · 주소에서 reset이 빠지나 · 그 뒤 새로 고침해도 다시 지우지 않나
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], PORT = 8258;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
let verOverride = null;
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } if (verOverride && p.endsWith('index.html')) d = Buffer.from(d.toString().replace(/판 \d\d-\d\d \d\d:\d\d/, verOverride)); r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const open = async (q = '') => { await pg.goto(`http://localhost:${PORT}/index.html${q}`); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(2500); };
  const R = {};
  await open(); await pg.evaluate(() => { st.best = st.stage = 7; st.up.summon = 9; st.up.magic = 4; UI.closeModal(); save(); }); await pg.waitForTimeout(1500);
  verOverride = '판 99-99 99:99'; await open(); for (let i = 0; i < 4; i++) { const t = await pg.evaluate(() => (document.getElementById('modal').style.display === 'flex' && !document.querySelector('#modal .patch')) ? (UI.closeModal(), 1) : 0); await pg.waitForTimeout(1200); if (!t) break; }
  Object.assign(R, await pg.evaluate(() => ({ 판이어짐: st.best, 소환이어짐: st.up.summon, 지팡이이어짐: st.up.magic, 알림창: !!document.querySelector('#modal .patch') && document.getElementById('modal').style.display === 'flex', 창글: (document.querySelector('#modal h3')||{}).textContent, 창열림: document.getElementById('modal').style.display, lastVer: st.lastVer })));
  await open('?reset=1'); Object.assign(R, await pg.evaluate(() => ({ 처음부터_판: st.best, 처음부터_소환: st.up.summon, 주소에reset남음: /reset=1/.test(location.search) })));
  await pg.evaluate(() => { st.best = st.stage = 3; st.up.summon = 2; save(); }); await pg.waitForTimeout(800); await pg.reload(); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  Object.assign(R, await pg.evaluate(() => ({ 새로고침뒤_판: st.best, 새로고침뒤_소환: st.up.summon })));
  console.log(JSON.stringify({ ...R, 오류: errs.slice(0, 3) })); await b.close(); srv.close(); })();
