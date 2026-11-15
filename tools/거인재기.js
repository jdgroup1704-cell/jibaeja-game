// node 거인재기.js 폴더 → JSON 한 줄: 순서 #11 「잡은 보스가 망자 거인으로 일어남」 · 자랑 카드가 실제 플레이에서 되는지 잼(관문 ㉑)
// 2-10 보스판 직전에서 시작 → 대마법으로 보스를 잡게 둠 → ① 보스 잡은 뒤 몇 초 만에 거인이 일어나기 시작했나 ② 그 뒤 15초 싸움에서 거인이 솟아 내려찍은 횟수 ③ 자랑 단추 · 카드(카드 속 보라 거인 칸의 보랏빛 비율)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], PORT = 8198;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { st.stage = st.best = 9; st.wave = 3; st.daysPlayed = 14; st.souls = 5e6; st.up.summon = 10; const H = JB.HEROES.slice(0, 4).map(h => h.id); for (const id of H) st.heroes[id] = { lv: 2, wp: 1 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => H[i] || null); st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; delete st.seen.brag; UI.closeModal();
    window.__G = { t0: performance.now(), down: null, rise: null, riseDraw: 0, pops: 0, hits: 0 }; const n0 = st.thralls || 0;
    setInterval(() => { const G = __G; if (G.down == null && (st.thralls || 0) > n0) G.down = performance.now(); if (G.down != null && G.rise == null && TH.rise) G.rise = performance.now(); if (TH.pop && !TH.pop.__c) { TH.pop.__c = 1; G.pops++; } if (TH.pop && TH.pop.hit && !TH.pop.__h) { TH.pop.__h = 1; G.hits++; } if (document.getElementById('modal').style.display === 'flex' && !window.__keepModal) UI.closeModal(); }, 50);
    const vd = window.vsDraw; window.vsDraw = function (n, an, fi, h, filt) { if (n === 'foev4' && filt && /hue-rotate\(235deg\)/.test(filt)) __G.riseDraw++; return vd.apply(this, arguments); }; });
  for (let i = 0; i < 40; i++) { await pg.waitForTimeout(1000); await pg.evaluate(() => { if (S.phase === 'prompt' || (st.boss && st.boss.phase === 'wait' && JB.canCast(st))) { const c = document.getElementById('cast'); c && c.click(); } }); const g = await pg.evaluate(() => __G); if (g.down != null && performance.now && (Date.now() - 0) && g.pops >= 1 && g.hits >= 1) break; }
  await pg.waitForTimeout(1500);
  const btn = await pg.evaluate(() => { const e = document.querySelector('#tools button[data-x="brag"]'); return e ? e.className : null; });
  await pg.evaluate(() => { window.__keepModal = 1; }); if (btn != null) { await pg.click('#tools button[data-x="brag"]'); await pg.waitForTimeout(2500); }
  const card = await pg.evaluate(() => { if (!BRAG.c) return null; const g = BRAG.c.getContext('2d'), d = g.getImageData(700, 150, 380, 520).data; let p = 0, n = 0; for (let i = 0; i < d.length; i += 16) { n++; const r = d[i], gg = d[i + 1], b = d[i + 2]; if (b > 140 && r > 110 && gg < b - 40 && r < b + 10) p++; } return Math.round(p / n * 1000) / 10; });
  const G = await pg.evaluate(() => __G);
  console.log(JSON.stringify({ 보스잡음: G.down != null, 일어남까지초: G.down != null && G.rise != null ? Math.round((G.rise - G.down) / 100) / 10 : null, 보라거인그림횟수: G.riseDraw, 솟음: G.pops, 내려찍음: G.hits, 망자거인수: await pg.evaluate(() => st.thralls || 0), 자랑단추: btn, 카드보라퍼센트: card, 판: await pg.evaluate(() => st.stage + "·" + st.wave + "·" + (st.boss ? st.boss.phase : "-")), 오류: errs.slice(0, 3) }));
  await b.close(); srv.close(); })();
