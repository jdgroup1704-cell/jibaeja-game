// node 지배자재기.js 폴더 → JSON — 관문 ㉕(11-16 08:44 대표님 「지배자 뒤돌아 때리고 · 영창 깨지고 · 화면 난리」)
// 평소 싸움 8초: 뒤도는 지배자 공격 영상(lordw)이 그려진 횟수 / 보스 대마법 영창 내내 0.1초마다: 지배자 몸이 화면 안 · 「일으켜라」 단추 위에 보이는 비율(가장 낮은 값) · 손가락이 뜬 횟수 / 「대결」 카드 보스 그림 이름
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], PORT = 8207;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { st.stage = st.best = 9; st.wave = 2; st.waveT = 0; st.daysPlayed = 14; st.souls = 5e6; st.up.summon = 10; st.login = { n: 1, last: st.day }; S.loginShown = 1; UI.closeModal(); JB.startWave(st); setInterval(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }, 100);
    window.__M = { lordw: 0, fing: 0, vis: [], vsImg: null }; const vd = window.vsDraw; window.vsDraw = function (n) { if (n === 'lordw') __M.lordw++; return vd.apply(this, arguments); };
    /* 지배자 몸 상자(세상 좌표) → 화면: 캔버스 안 · 「일으켜라」 단추 위 · 위 띠 아래에 보이는 넓이 비율 */
    window.__lordVis = () => { const im = ART.lordA; if (!im) return null; const x = 196 + LDX(), y = 560, h = 330, w = h * im.width / im.height; const r = cv.getBoundingClientRect(), k = r.width / cv.width, z = S.cam.z;
      const toS = (wx, wy) => { const p = new DOMPoint(wx, wy).matrixTransform(window.__camM || new DOMMatrix()); return p; };
      const M = ctx.getTransform(); const sx = (wx, wy) => r.left + (M.a * wx + M.c * wy + M.e) * k, sy = (wx, wy) => r.top + (M.b * wx + M.d * wy + M.f) * k;
      const x0 = sx(x + 10 - w / 2, 0), x1 = sx(x + 10 + w / 2, 0), y0 = sy(0, y + 34 - h), y1 = sy(0, y + 34);
      const rb = document.getElementById('raiseBtn').getBoundingClientRect(), hud = document.getElementById('hud').getBoundingClientRect();
      const top = Math.max(r.top, hud.bottom), bot = Math.min(r.bottom, rb.top > 0 ? rb.top : r.bottom), left = Math.max(r.left, 0), right = Math.min(r.right, innerWidth);
      const vw = Math.max(0, Math.min(x1, right) - Math.max(x0, left)), vh = Math.max(0, Math.min(y1, bot) - Math.max(y0, top)); return (vw * vh) / Math.max(1, (x1 - x0) * (y1 - y0)); };
    /* 카메라 행렬은 그리는 중에만 맞으므로 지배자 그리는 순간에 잼 */
    const dl = window.drawLord; window.drawLord = function () { if (['cast', 'prompt', 'stare'].includes(S.phase) && window.__measure) { const v = __lordVis(); if (v != null) __M.vis.push(Math.round(v * 100)); } return dl.apply(this, arguments); };
  });
  await pg.waitForTimeout(8000);
  await pg.evaluate(() => { window.__measure = 1; });
  let cast = false; for (let i = 0; i < 160 && !cast; i++) { await pg.waitForTimeout(200); const r = await pg.evaluate(() => { const v = document.getElementById('vsfx'); if (v && v.classList.contains('go') && !__M.vsImg) __M.vsImg = (v.querySelector('.vr img') || {}).getAttribute?.('src'); if (S.phase === 'cast') return true; if (S.phase === 'prompt' || (st.boss && st.boss.phase === 'wait' && JB.canCast(st))) document.getElementById('cast')?.click(); return false; }); cast = r; }
  for (let i = 0; i < 70; i++) { await pg.waitForTimeout(100); await pg.evaluate(() => { const f = document.getElementById('finger'); if (S.phase === 'cast' && f && f.classList.contains('on')) __M.fing++; }); }
  const M = await pg.evaluate(() => { const v = __M.vis.slice(); return { 뒤도는공격영상: __M.lordw, 영창중손가락: __M.fing, 영창중지배자보임최저: v.length ? Math.min(...v) : null, 잰장수: v.length, 대결카드보스: __M.vsImg }; });
  console.log(JSON.stringify({ 대마법눌림: cast, ...M, 오류: errs.slice(0, 3) })); await b.close(); srv.close(); })();
