// 효과 가림 잼(11-18 · 다시그릴그림.md 1번 「후반 저장에서 기술 효과가 몸을 거의 덮음」): 후반 저장 폰 360×780 · 같은 순간을 효과 층 하나씩 끄고 다시 그려 픽셀 차이를 잼 → 층마다 싸움터를 바꾼 비율(%) · 큰 것부터 줄이기
// 층: 군단 효과(drawArmyFx) · 영웅 효과(HF.drawFx) · 지배자 마법(LM.draw) · 적 기술(FFX.draw) · 대마법(SPX) · 거인(TH.draw)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], PORT = 8440 + Math.floor(Math.random() * 20);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
const LATE = fs.readFileSync(path.join(__dirname, '시험자료', '후반저장.txt'), 'utf8');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--mute-audio'] }); const ctx0 = await b.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx0.addInitScript(sv => { try { localStorage.setItem('jibaeja_b1115102811', sv); } catch (e) {} }, LATE);
  const pg = await ctx0.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); for (let i = 0; i < 8; i++) { await pg.evaluate(() => UI.closeModal()); await pg.waitForTimeout(400); }
  const R = await pg.evaluate(async () => {
    const LAY = { 앞안개: ['window', 'drawAtmoFront'], 뒤안개: ['window', 'drawAtmoBack'], 지역빛: ['window', 'drawRegionTint'], 가장자리: ['window', 'drawVignette'], 덮개: ['window', 'drawOverlay'], 조각: ['window', 'drawParts'], 고리: ['window', 'drawRings'], 베기: ['window', 'drawSlashes'], 내려찍기: ['window', 'drawSlams'], 충격: ['window', 'drawShock'], 쓸기: ['window', 'drawSweep'], 태양: ['window', 'drawFxSun'], 싸움글자: ['window', 'drawWorldTexts'], 군단효과: ['window', 'drawArmyFx'], 영웅효과: ['HF', 'drawFx'], 지배자마법: ['LM', 'draw'], 적기술: ['FFX', 'draw'], 대마법: ['SPX', 'draw'], 대마법밑: ['SPX', 'drawUnder'], 거인: ['TH', 'draw'] };
    const get = ([o, k]) => (o === 'window' ? window : window[o]); const sum = {}; for (const n in LAY) sum[n] = 0; let frames = 0;
    for (let s = 0; s < 12; s++) { await new Promise(r => setTimeout(r, 700)); if (document.getElementById('modal').style.display === 'flex') UI.closeModal();
      S.paused = true; const W0 = cv.width, H0 = cv.height; const snap = () => ctx.getImageData(0, 0, W0, H0).data;
      const rnd0 = Math.random; let seed = 1; Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const t0 = S.t; const pf = performance.now; const pn = pf.call(performance); performance.now = () => pn;
      const run = () => { seed = 1; S.t = t0; draw(); return snap(); };
      const base = run();
      const df = (A, B) => { let d = 0; for (let i = 0; i < A.length; i += 16) if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 60) d++; return d / (A.length / 16) * 100; };
      for (const n in LAY) { const o = get(LAY[n]), k = LAY[n][1]; if (!o || typeof o[k] !== 'function') continue; const b1 = run(); const f = o[k]; o[k] = function () {}; const img = run(); o[k] = f; const b2 = run(); sum[n] += Math.max(0, df(b1, img) - df(b1, b2)); }   /* 그릴 때마다 조금씩 움직이는 흔들림은 빼고(앞뒤 두 번 기준) */
      Math.random = rnd0; performance.now = pf; S.paused = false; frames++; }
    for (const n in sum) sum[n] = Math.round(sum[n] / frames * 10) / 10; return { 층별가림: sum, 장면: frames, 각성: st.awakens, 군단: JB.armySize(st) }; });
  R.오류 = errs.slice(0, 3); console.log(JSON.stringify(R)); await b.close(); srv.close(); })();
