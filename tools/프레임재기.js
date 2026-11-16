// node 프레임재기.js 폴더 [이름] → JSON: 폰(360×640 · dpr 2) CPU 4배 느림으로 3-10 싸움 15초 + 보스 대결 등장 — 평균 프레임 · 느린 프레임(50ms↑) 수 · 가장 긴 멈춤 (관문 ㉚ 「렉 없이」 11-16 12:04 대표님)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], PORT = 8225;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--enable-gpu-rasterization'] }); const ctxB = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const pg = await ctxB.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(4000);
  await pg.evaluate(() => { st.stage = st.best = 29; st.wave = 0; st.daysPlayed = 14; st.souls = 5e6; st.up.summon = 12; for (const h of JB.HEROES.slice(0, 4)) st.heroes[h.id] = { lv: 5, wp: 4 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => JB.HEROES[i] ? JB.HEROES[i].id : null); st.evo = [0, 3, 2, 1, 1]; st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; UI.closeModal(); JB.startWave(st); setInterval(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }, 200); });
  await pg.waitForTimeout(5000);
  const cdp = await ctxB.newCDPSession(pg); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +(process.env.CPU || 4) });
  await pg.evaluate(() => { window.__F = []; let last = performance.now(); const f = t => { __F.push(t - last); last = t; if (__F.length < 100000) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await pg.waitForTimeout(15000);
  const R = await pg.evaluate(() => { const a = __F.slice(5), s = a.reduce((x, y) => x + y, 0); return { 프레임수: a.length, 평균fps: Math.round(a.length / (s / 1000)), 느린프레임: a.filter(x => x > 50).length, 가장긴멈춤: Math.round(Math.max(...a)), 적: S.foes.filter(f => !f.dead).length, 군단: S.army.length }; });
  console.log(JSON.stringify({ ...R, 오류: errs.slice(0, 3) })); await b.close(); srv.close(); })();
