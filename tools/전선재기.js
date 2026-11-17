// node 전선재기.js 폴더 → JSON: 일반 싸움 30초 · 보스전(일부러 느리게 · 빠르게) — 맞붙는 줄(foeLine)이 움직인 폭 · 새 무리 올 때 밀렸나 · 보스에 밀릴 때 뒤로 · 앞설 때 앞으로 (관문 ㉜ 11-16 16:18 대표님 「계속 저쪽에서만 싸워? 더 세면 밀리고」)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], PORT = 8256;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const out = {};
  for (const mode of ['일반', '보스느림', '보스빠름']) { const pg = await (await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
    await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
    await pg.evaluate(m => { st.stage = st.best = m === '일반' ? 24 : 9; st.wave = m === '일반' ? 0 : 3; st.daysPlayed = 14; st.souls = 5e6; st.up.summon = 12; st.spellReady = 999; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; UI.closeModal(); JB.startWave(st); setInterval(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }, 100);
      window.__P = []; setInterval(() => { __P.push([Math.round(S.t * 10) / 10, typeof foeLine === 'function' ? Math.round(foeLine()) : 0, st.boss ? st.boss.phase : '-', Math.round(st.hp / Math.max(1, st.maxHp) * 100)]); if (st.boss && st.boss.phase === 'fight' && !st.boss.__m) { st.boss.__m = 1; if (m === '보스느림') { st.maxHp = st.hp = st.hp * 40; } } }, 250); }, mode);
    await pg.waitForTimeout(mode === '일반' ? 30000 : 24000);
    out[mode] = await pg.evaluate(m => { const P = __P.filter(p => m === '일반' ? p[2] === '-' : p[2] === 'fight'); if (!P.length) return null; const xs = P.map(p => p[1]); return { 최소: Math.min(...xs), 최대: Math.max(...xs), 처음: xs[0], 끝: xs[xs.length - 1], 표본: xs.length }; }, mode); await pg.close(); }
  console.log(JSON.stringify(out)); await b.close(); srv.close(); })();
