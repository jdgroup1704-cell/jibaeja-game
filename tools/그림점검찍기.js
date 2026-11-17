// 그림 점검(11-18 05:4x · 대표님 03:59 「버릴 거 버리고 드리미나로 새로」): 후반 · 처음 저장 싸움터를 3배로 몇 장 — 크기 표에 안 맞거나 어색한 그림 고르기용 → /home/claude/rec/새틀/그림점검_N.png
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], PORT = 8420 + Math.floor(Math.random() * 20);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
const LATE = fs.readFileSync(path.join(__dirname, '시험자료', '후반저장.txt'), 'utf8');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--mute-audio'] }); let n = 0;
  for (const save of ['후반', '처음']) { const ctx = await b.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    if (save === '후반') await ctx.addInitScript(sv => { try { localStorage.setItem('jibaeja_b1115102811', sv); } catch (e) {} }, LATE);
    const pg = await ctx.newPage(); await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
    for (let i = 0; i < 16; i++) { await pg.evaluate(() => UI.closeModal()); await pg.waitForTimeout(400); }
    if (save === '처음') await pg.evaluate(() => { st.raised = 99; st.stage = st.best = 30; st.up.summon = 14; for (const h of JB.HEROES.slice(0, 4)) st.heroes[h.id] = { lv: 2, wp: 1 }; JB.squadFit(st); UI.closeModal(); });
    for (let k = 0; k < 3; k++) { await pg.waitForTimeout(2500); await pg.evaluate(() => UI.closeModal()); const sw = await pg.evaluate(() => { const r = document.getElementById('stagewrap').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; }); await pg.screenshot({ path: `/home/claude/rec/새틀/그림점검_${++n}.png`, clip: sw }); }
    await ctx.close(); }
  console.log('찍음', n); await b.close(); srv.close(); })();
