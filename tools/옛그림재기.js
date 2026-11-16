// node 옛그림재기.js 폴더 → 관문 ㉗(11-16 09:15 「검은 종이 인형 지배자」 · 「역탑 검수랑 차이 심하네」): 처음 15초 · 3-10 40초 · 후반 저장(귀빈 8 · 2막 · 영웅 8 · 보스 대마법) 40초 동안 그림 파일을 바로 그린 이름과 횟수(새 줄그림은 구워 그려서 안 셈 = 여기 나오는 건 정지 그림 · 옛 그림)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'); const dir = process.argv[2], PORT = 8212;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(() => { window.__D = {}; const od = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = function (im, ...a) { const s = im && im.src; if (s) { const n = decodeURIComponent(s.split('/').pop().split('?')[0]); __D[n] = (__D[n] || 0) + 1; } return od.call(this, im, ...a); }; });
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click());
  await pg.waitForTimeout(15000);
  await pg.evaluate(() => { st.stage = st.best = 30; st.daysPlayed = 14; st.souls = 5e6; st.up.summon = 12; for (const h of JB.HEROES.slice(0, 8)) st.heroes[h.id] = { lv: 2, wp: 1 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => JB.HEROES[i] ? JB.HEROES[i].id : null); st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; UI.closeModal(); });
  for (let i = 0; i < 8; i++) { await pg.waitForTimeout(5000); await pg.evaluate(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }); }
  /* 후반 저장: 대표님 사진(9:14)과 같은 상태 — 귀빈 8 · 2막 · 영웅 8 · 보스판 대마법 */
  await pg.evaluate(() => { st.vipExp = 120000; st.awakens = 1; st.stage = st.best = 139; st.wave = 3; st.waveT = 0; st.up.summon = 307; st.up.bone = 154; st.up.magic = 121; for (const h of JB.HEROES) st.heroes[h.id] = { lv: 5, wp: 2 }; JB.squadFit(st); UI.closeModal(); JB.startWave(st); UI.render(true); });
  for (let i = 0; i < 40; i++) { await pg.waitForTimeout(1000); await pg.evaluate(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); if (S.phase === 'prompt' || (st.boss && st.boss.phase === 'wait' && JB.canCast(st))) document.getElementById('cast')?.click(); }); }
  const D = await pg.evaluate(() => __D); const m = Object.entries(D).sort((a, b) => b[1] - a[1]);
  console.log(JSON.stringify({ 그림수: m.length, 그림: m, 오류: errs }, null, 0)); process.exit(0); })();
