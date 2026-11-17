// node 처음1분재기.js 폴더 → JSON · 관문 ㉞ (11-16 19:50 대표님 「게임이 엄청 재미없는데 · 초반부터 캐릭터들 어색」 · 「왜 규칙 정하고 스스로 진화해서 보고 만들라 했는지」)
// 처음 하는 사람처럼: 새 저장 · 오프닝 누름 · 「일으켜라」를 0.5초마다 누름 → 60초 동안 0.5초마다 잼
// 잼: 20초 안 화면 위 우리 편 최대 수 · 1초당 우리 편이 실제로 때린 횟수 · 땅을 뚫고 솟는 연출 수 · 살아 있는 적끼리 포개진 비율(가장 나쁜 때)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], PORT = 8281;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { window.__M = { hit0: 0, cracks: 0 }; const lh = S.lastHit; window.__hitN = 0; const of = burst; window.burst = function (...a) { return of.apply(this, a); }; setInterval(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }, 300); });
  let maxUs20 = 0, worstOv = 0, cracks = 0; const t0 = Date.now();
  for (let i = 0; i < 120; i++) {
    const r = await pg.evaluate(() => { const rb = document.getElementById('raiseBtn'); if (rb && rb.style.display === 'block') rb.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); if (S.phase === 'prompt') { const c = document.getElementById('cast'); c && c.click(); }   /* 처음 하는 사람도 손가락이 가리키는 대마법을 누름 */
      const mn = typeof MN !== 'undefined' ? MN.list.filter(m => m.rise > 0.5).length : 0, us = S.army.filter(a => !a.fly && !a.gone).length + mn + (HF.list ? HF.list.length : 0);
      const F = S.foes.filter(f => !f.dead && !f.wait && f.x < VX1); let ov = 0; for (let a = 0; a < F.length; a++) for (let c = a + 1; c < F.length; c++) if (Math.abs(F[a].x - F[c].x) < 22 && Math.abs(F[a].y - F[c].y) < 16) { ov++; break; }
      return { us, ov: F.length >= 3 ? ov / F.length : 0, cr: (S.cracks || []).filter(c => c.t < 0.05).length, hits: typeof MN !== 'undefined' ? MN.hits || 0 : 0, stage: st.stage }; });
    if (i < 40) maxUs20 = Math.max(maxUs20, r.us); worstOv = Math.max(worstOv, r.ov); cracks += r.cr;
    if (i === 119) { const sec = (Date.now() - t0) / 1000; console.log(JSON.stringify({ 우리편20초최대: maxUs20, 떼맞힘초당: Math.round(r.hits / sec * 10) / 10, 솟는연출: cracks, 적포개짐최악: Math.round(worstOv * 100), 판: r.stage, 오류: errs.slice(0, 3) })); }
    await pg.waitForTimeout(500);
  }
  await b.close(); srv.close(); })();
