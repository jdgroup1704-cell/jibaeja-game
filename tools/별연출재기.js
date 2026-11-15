// node 별연출재기.js 폴더 → 관문 ⑰ 별 올림 연출(순서 #7). 영웅을 겹쳐 뽑아 ★2 · ★3이 된 결과를 실제 뽑기 화면 흐름(UI.pullResult)으로 띄워 잼
// 잼: 연출 창이 뜸 · 별 칸 6개 · 새 별 1개 · ★3은 불꽃(sx-fire)과 불똥 14개 · 새 힘 글 · 「띵」이 계단처럼 오름 · 끝나면 결과 카드 창이 뜸 · 화면 밖으로 잘린 글 0
// 사진: /home/claude/rec/눈/별연출_★3.jpg (0.25초 간격 8장)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process'); const dir = process.argv[2], PORT = 8181;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  const out = {}; execSync('mkdir -p /tmp/별사진 /home/claude/rec/눈 && rm -f /tmp/별사진/*');
  for (const n of [2, 3]) {
    await pg.evaluate(n => { const id = 'serafine'; st.heroes[id] = { lv: n, wp: 0 }; UI.closeModal(); window.__starFx = []; window.__t0 = performance.now(); UI.pullResult([{ id, isNew: false, lv: n, star: n, shard: false, maxed: false }]); }, n);
    const shots = []; let seen = null;
    let k = 0; for (let i = 0; i < 60; i++) { await pg.waitForTimeout(k < 8 && n === 3 ? 200 : 250); await pg.evaluate(() => { const f = document.getElementById('summonfx'); if (f && f.classList.contains('tapok')) f.click(); });   /* 뽑기 빛기둥은 누르고 넘김(사람처럼) */
      const s = await pg.evaluate(() => { const el = document.getElementById('starfx'); if (!el || !el.classList.contains('on')) return { on: false, modal: document.getElementById('modal').style.display === 'flex' }; const r = el.getBoundingClientRect(), cut = [...el.querySelectorAll('.sx-name *, .sx-row b')].filter(x => { const q = x.getBoundingClientRect(); return q.width && (q.left < -1 || q.right > innerWidth + 1); }).length; return { on: true, slots: el.querySelectorAll('.sx-row b').length, nw: el.querySelectorAll('.sx-row b.new').length, fire: !!el.querySelector('.sx-fire'), sp: el.querySelectorAll('.sx-sp').length, perk: (el.querySelector('.sx-name em') || {}).textContent || '', cut }; });
      if (s.on && !seen) seen = s; if (s.on && seen) { seen.fire = seen.fire || s.fire; seen.sp = Math.max(seen.sp, s.sp); seen.perk = seen.perk || s.perk; } if (s.on && k < 8 && n === 3) { await pg.screenshot({ path: `/tmp/별사진/${String(k++).padStart(2, '0')}.png` }); shots.push(i); } if (!s.on && seen) { seen.modalAfter = s.modal; break; } if (s.on) { seen.cut = Math.max(seen.cut, s.cut); } }
    if (!seen) { const s = await pg.evaluate(() => ({ modal: document.getElementById('modal').style.display === 'flex', fx: document.getElementById('summonfx') && document.getElementById('summonfx').className })); seen = { on: false, ...s }; }
    else if (seen.modalAfter === undefined) { await pg.waitForTimeout(3500); seen.modalAfter = await pg.evaluate(() => document.getElementById('modal').style.display === 'flex'); }
    const ups = await pg.evaluate(() => (window.__sndUp ? __sndUp() : []).filter(([t]) => t * 1000 > window.__t0 - 50).map(([, r]) => r));
    out['★' + n] = { ...seen, 띵: ups };
    await pg.evaluate(() => { UI.closeModal(); const f = document.getElementById('starfx'); if (f) f.className = ''; }); await pg.waitForTimeout(600);
  }
  if (fs.readdirSync('/tmp/별사진').length) execSync(`ffmpeg -loglevel error -y -pattern_type glob -i '/tmp/별사진/*.png' -vf "scale=360:-2,tile=4x2" -frames:v 1 /home/claude/rec/눈/별연출_3.jpg`);
  out.오류 = errs.length; out.오류글 = errs.slice(0, 3); console.log(JSON.stringify(out)); await b.close(); srv.close(); })();
