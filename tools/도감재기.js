// node 도감재기.js 폴더 [이름] → JSON + /home/claude/rec/도감_이름.jpg — 순서 #14 망자 도감 그림 카드 · 모은 칸 보상(관문 ㉔)
// 지역 3곳 병사 · 2곳 주인을 내 편으로(5칸) 둔 저장 → 군단 탭 도감 칩 빨간 점 · 창: 카드 16장(그림 실제로 불러짐) · 켜진 카드 5 · 받기 단추 2개(2칸 · 4칸) → 하나 눌러 마정석 늘었나 · 받은 뒤 다시 못 받나
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], nm = process.argv[3] || '확인', PORT = 8204;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { st.stage = st.best = 35; st.daysPlayed = 14; st.up.summon = 12; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; st.login = { n: 1, last: st.day }; S.loginShown = 1; const d = JB.dexOf(st); d.k = [25, 25, 25, 12, 0, 0, 0, 0]; d.f = [true, true, true, false, false, false, false, false]; d.l = [true, true, false, false, false, false, false, false]; d.lt = [1, 2, 1, 0, 0, 0, 0, 0]; st.dexGot = []; UI.closeModal(); UI.tab = 'grave'; UI.graveView = 'grow';   /* 11-17 도감 칩이 강화 탭에서 군단 탭으로 옮겨감 */ UI.render(true); });
  await pg.waitForTimeout(800); await pg.evaluate(() => { const t = document.querySelector('#tabs [data-tab="grave"]'); t && t.click(); }); await pg.waitForTimeout(800);
  const chip = await pg.evaluate(() => { const c = document.querySelector('#tabbody [data-act="dex"]'); return c ? c.className : null; });
  const f1 = '/tmp/dx1.png'; await pg.screenshot({ path: f1 });
  await pg.evaluate(() => document.querySelector('#tabbody [data-act="dex"]')?.click()); await pg.waitForTimeout(1500);
  const M = await pg.evaluate(() => { const cs = [...document.querySelectorAll('#modal .dxc')]; const imgsOk = cs.every(c => { const u = getComputedStyle(c).backgroundImage; return /map_\d\.jpg/.test(u); }); return { 카드: cs.length, 켜짐: cs.filter(c => c.classList.contains('on')).length, 그림: imgsOk, 받기: document.querySelectorAll('#modal .dxm.can').length, 마정석: st.gems }; });
  const f2 = '/tmp/dx2.png'; await pg.screenshot({ path: f2 });
  await pg.evaluate(() => document.querySelector('#modal .dxm.can')?.click()); await pg.waitForTimeout(900);
  const A = await pg.evaluate(() => ({ 마정석: st.gems, 받기: document.querySelectorAll('#modal .dxm.can').length, 받음: document.querySelectorAll('#modal .dxm.got').length }));
  const again = await pg.evaluate(() => JB.dexClaim(st, 0));
  const f3 = '/tmp/dx3.png'; await pg.screenshot({ path: f3 });
  require('child_process').execSync(`ffmpeg -loglevel error -y -i ${f1} -i ${f2} -i ${f3} -filter_complex hstack=inputs=3 /home/claude/rec/도감_${nm}.jpg`);
  /* 지도 그림이 실제로 불러졌나 */
  const loaded = await pg.evaluate(async () => { const r = await Promise.all([0, 1, 2, 3, 4, 5, 6, 7].map(i => new Promise(ok => { const im = new Image(); im.onload = () => ok(1); im.onerror = () => ok(0); im.src = `art/map_${i}.jpg`; }))); return r.reduce((a, b) => a + b, 0); });
  console.log(JSON.stringify({ 칩: chip, 카드: M.카드, 켜짐: M.켜짐, 지도그림: M.그림, 불러진지도: loaded, 받기전: M.받기, 받은뒤받기: A.받기, 받음: A.받음, 마정석늘어남: A.마정석 - M.마정석, 다시받기: again, 오류: errs.slice(0, 3) }));
  await b.close(); srv.close(); })();
