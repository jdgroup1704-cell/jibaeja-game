// node 대마법화려재기.js 폴더 [이름] → JSON · 관문 ㉟ (11-16 대표님 다음 할 일 ③ 「큰 기술(지배자 대마법) 더 화려하게」)
// 대표님 폰(360×593) · 9판에서 보스 대마법을 누름 → 0.15초마다 무대를 셈: 번개 · 적 발밑 마법진 · 빛기둥 · 충격파 · 불똥 비 · 밀린 적 · 대마법 동안 가장 느린 화면(초당 장수)
// 같이 찍음: 0.3초마다 한 장 → /home/claude/rec/대마법화려_이름.jpg (직접 열어 볼 것)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process'); const dir = process.argv[2], name = process.argv[3] || 'a';
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8297);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(s => { window.__ST = s; }, process.env.ST || '9'); await pg.goto('http://localhost:8297/index.html?test=1'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  await pg.evaluate(() => { Snd.mute && Snd.mute(true); st.stage = st.best = +(window.__ST || 9); st.wave = 2; st.up.summon = 8; st.seen.curTip = 1; st.seen.fallTip = 1; st.seen.idleTip = 9; st.raised = 99; UI.closeModal(); UI.render(true); });
  let t0 = Date.now(); while (Date.now() - t0 < 60000 && !(await pg.evaluate(() => S.phase === 'prompt'))) { await pg.evaluate(() => UI.closeModal()); await pg.waitForTimeout(300); }
  const ph = await pg.evaluate(() => S.phase); execSync(`rm -rf /tmp/대마법화려; mkdir -p /tmp/대마법화려`);
  await pg.evaluate(() => { UI.closeModal(); window.__fr = []; let last = performance.now(); const tick = () => { const n = performance.now(); window.__fr.push([S.phase, n - last]); last = n; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    window.__spx = { bolt: 0, circle: 0, pillar: 0, shock: 0, ember: 0, rays: 0 }; const seen = new Set(); setInterval(() => { if (typeof SPX === 'undefined') return; for (const e of SPX.L) if (!seen.has(e)) { seen.add(e); window.__spx[e.k] = (window.__spx[e.k] || 0) + 1; } }, 30);
    window.__kb = 0; const ob = typeof SPX !== 'undefined' && SPX.blast; if (ob) SPX.blast = function (...a) { const n0 = SPX.foesOn().length; window.__kb = n0; return ob.apply(this, a); }; });
  await pg.evaluate(() => document.getElementById('cast')?.click());
  let k = 0; const end = Date.now() + 13000; while (Date.now() < end && k < 40) { await pg.screenshot({ path: `/tmp/대마법화려/${String(k).padStart(2, '0')}.png` }); k++; await pg.waitForTimeout(240); if (k > 6 && await pg.evaluate(() => S.phase !== 'cast')) break; }
  const r = await pg.evaluate(() => { const F = window.__fr.filter(x => x[0] === 'cast').map(x => x[1]); let worst = 99; for (let i = 0; i + 15 <= F.length; i += 5) { const s = F.slice(i, i + 15).reduce((a, b) => a + b, 0); worst = Math.min(worst, 15000 / s); } return { ...window.__spx, 밀린적: window.__kb, 대마법중최저초당: Math.round(worst), 대마법장수: F.length }; });
  const n = Math.min(k, 40); execSync(`ffmpeg -y -loglevel error -framerate 1 -i /tmp/대마법화려/%02d.png -vf "tile=8x${Math.ceil(n / 8)},scale=2400:-1" -frames:v 1 -q:v 4 /home/claude/rec/대마법화려_${name}.jpg`);
  console.log(JSON.stringify({ 차례: ph, 번개: r.bolt, 마법진: r.circle, 빛기둥: r.pillar, 충격파: r.shock, 불똥: r.ember, 빛살: r.rays, 밀린적: r.밀린적, 대마법중최저초당: r.대마법중최저초당, 장수: n, 오류: errs.slice(0, 3) }));
  await b.close(); srv.close(); })();
