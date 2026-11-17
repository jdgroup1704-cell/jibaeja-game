// 군단 공격 오름 표시 잼(11-17 23:2x): 강화 하나 사면 「군단 공격 ○ ▲ +○%」가 뜨나 · 전장 안 · 기술 줄 · 무덤 · 대마법 · 아래 칸과 안 겹치나 · 1.3초 뒤 사라지나
// node 힘오름재기.js 폴더 [높이] → JSON · 사진 /home/claude/rec/힘오름_관문.jpg
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], H = +(process.argv[3] || 593), PORT = 8305;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--mute-audio'] }); const pg = await (await b.newContext({ viewport: { width: 360, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { st.stage = st.best = 8; st.raised = 99; st.souls = 1e6; st.tombQ = [{ slot: 'ring', g: 2, ilv: 8, lv: 0 }]; st.tombGift = 1; UI.closeModal(); UI.tab = 'up'; UI.render(true); });
  await pg.waitForTimeout(1500); await pg.evaluate(() => UI.closeModal()); await pg.waitForTimeout(2500);
  const out = {};
  out.산것 = await pg.evaluate(() => { const bt = document.querySelector('.ucard[data-arg="summon"] .btn.buy:not([disabled])') || document.querySelector('.ucard .btn.buy:not([disabled])'); if (!bt) return 0; bt.click(); return 1; });
  let best = 0; for (let k = 0; k < 8; k++) { await pg.waitForTimeout(120); const o = await pg.evaluate(() => { const e = document.getElementById('pwrup'); return e ? +getComputedStyle(e).opacity : 0; }); if (o > best) best = o; if (o > 0.9) break; } out.가장보임 = best;
  const m = await pg.evaluate(() => { const e = document.getElementById('pwrup'); if (!e || !e.classList.contains('on')) return null; const R = x => { const q = x.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)]; }; const a = R(e);
    const hit = ['#slots', '#cast', '#panel', '#raiseBtn', '#tombfx'].filter(s => { const o = document.querySelector(s); if (!o || !o.offsetWidth) return false; const c = o.getBoundingClientRect(); return c.left < a[2] - 2 && c.right > a[0] + 2 && c.top < a[3] - 2 && c.bottom > a[1] + 2; }); const sw = document.getElementById('stagewrap').getBoundingClientRect();
    return { 상자: a, 글: e.textContent, 가림: hit, 전장안: a[1] >= sw.top && a[3] <= sw.bottom && a[0] >= 0 && a[2] <= innerWidth, 보임: +getComputedStyle(e).opacity }; });
  out.표시 = m; await pg.evaluate(() => { if (document.getElementById('modal').style.display === 'flex') { UI.closeModal(); const e = document.getElementById('pwrup'); e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); } }); await pg.waitForTimeout(350); await pg.screenshot({ path: '/tmp/힘오름.png' });
  await pg.waitForTimeout(1500); out.사라짐 = await pg.evaluate(() => { const e = document.getElementById('pwrup'); return !e || +getComputedStyle(e).opacity < 0.05; });
  out.오류 = errs.slice(0, 3);
  require('child_process').execSync('ffmpeg -y -loglevel error -i /tmp/힘오름.png -q:v 3 /home/claude/rec/힘오름_관문.jpg');
  console.log(JSON.stringify(out)); await b.close(); srv.close(); })();
