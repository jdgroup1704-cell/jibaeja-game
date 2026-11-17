// node 탭재기.js 폴더 [이름] → JSON · 관문 ㊳ (11-17 02:0x 대표님 「던전 히어로처럼 움직임 · 직접」 → ④ 누른 곳에 영혼탄)
// 폰(360×593) 3-10 싸움: 적 쪽을 0.25초마다 손가락으로 20번 누름 → 영혼탄이 날아가 맞은 수 · 준 피해 · 1초 5번 제한 · 창이 열렸을 땐 안 나감 · 오류 0 + 0.1초 사진 띠
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process'); const dir = process.argv[2], name = process.argv[3] || 'a';
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8301);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8301/index.html?test=1'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  await pg.evaluate(() => { st.stage = st.best = 30; st.wave = 1; st.souls = 5e6; st.up.summon = 12; for (const h of JB.HEROES.slice(0, 4)) st.heroes[h.id] = { lv: 2, wp: 1 }; st.squad = st.squad.map((_, i) => JB.HEROES[i] ? JB.HEROES[i].id : null); for (const k in st.seen) st.seen[k] = st.seen[k] || 9; Object.assign(st.seen, { curTip: 1, fallTip: 1, idleTip: 9 }); delete st.seen.tapTip; UI.closeModal(); UI.render(true); });
  await pg.waitForTimeout(5000); await pg.evaluate(() => UI.closeModal());
  execSync('rm -rf /tmp/탭; mkdir -p /tmp/탭'); let k = 0; const box = await (await pg.$('#battle')).boundingBox();
  const res = { 누름: 0, 나감: 0 }; await pg.evaluate(() => { window.__tapDmg = 0; });
  for (let i = 0; i < 20; i++) { const tg = await pg.evaluate(() => { UI.closeModal(); const r = cv.getBoundingClientRect(); const f = S.foes.filter(f => !f.dead && !f.wait && f.x < VX1)[0]; if (!f) return null; return { x: r.left + (f.x - VIS.x0) / (VIS.x1 - VIS.x0) * r.width, y: r.top + (f.y - 50 - VIS.y0) / (VIS.y1 - VIS.y0) * r.height }; });
    const n0 = await pg.evaluate(() => TAP.n); if (tg) { await pg.touchscreen.tap(tg.x, tg.y); res.누름++; } await pg.waitForTimeout(80); if (await pg.evaluate(() => TAP.n) > n0) res.나감++;
    if (i < 16) await pg.screenshot({ path: `/tmp/탭/${String(k++).padStart(2, '0')}.png`, clip: { x: box.x, y: box.y, width: box.width, height: box.height } }); await pg.waitForTimeout(170); }
  res.피해 = await pg.evaluate(() => Math.round(window.__tapDmg)); res.초당힘 = await pg.evaluate(() => Math.round(JB.dps(st)));
  // 1초 5번 제한: 0.05초 간격 10번 → 나간 수
  const n1 = await pg.evaluate(() => TAP.n); const c = await pg.evaluate(() => { const r = cv.getBoundingClientRect(); return { x: r.left + r.width * 0.7, y: r.top + r.height * 0.6 }; }); for (let i = 0; i < 10; i++) { await pg.touchscreen.tap(c.x, c.y); await pg.waitForTimeout(30); } res.빨리10번 = (await pg.evaluate(() => TAP.n)) - n1;
  // 창이 열렸을 땐 안 나감
  await pg.evaluate(() => EX.settingsOpen()); const n2 = await pg.evaluate(() => TAP.n); await pg.evaluate(() => { const ev = new PointerEvent('pointerdown', { clientX: 250, clientY: 150, bubbles: true }); cv.dispatchEvent(ev); }); res.창열림때 = (await pg.evaluate(() => TAP.n)) - n2;
  execSync(`ffmpeg -y -loglevel error -framerate 1 -i /tmp/탭/%02d.png -vf "tile=8x2,scale=2400:-1" -frames:v 1 -q:v 4 /home/claude/rec/탭_${name}.jpg`);
  console.log(JSON.stringify({ ...res, 오류: errs.slice(0, 3) })); await b.close(); srv.close(); })();
