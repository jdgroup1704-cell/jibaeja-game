// 싸움 중 병사 · 영웅 · 적 · 보스가 실제로 때리는지 잼: node 공격재기.js 폴더 [판]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], stg = +(process.argv[3] || 14);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8152);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await (await b.newContext({ viewport: { width: 384, height: 665 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8152/index.html?test=1&seed=5'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  if (process.argv[4] === '초반') await pg.evaluate(() => window.__early = 1);
  await pg.evaluate(s => { st.stage = st.best = s; if (!window.__early) { st.grave = st.grave.map(() => 2); st.up.summon = 12; st.up.bone = 10; st.evo = [3, 2, 1, 0, 0]; } else { st.up.summon = 4; } S.army.length = 0;
    window.__m = { t: 0, rows: [] }; const id = new WeakMap(); let n = 0;
    setInterval(() => { if (S.phase !== 'battle' && S.phase !== 'fight') return; __m.t++; const fr = Math.max(...S.army.filter(a => !a.fly).map(a => a.x)); const foes = S.foes.filter(f => !f.dead && !f.flee);
      for (const a of S.army) { if (a.fly) continue; if (!id.has(a)) id.set(a, { i: n++, c: a.c, sw: 0, seen: 0, near: 0, back: 0 }); const r = id.get(a); r.seen++; if (a.sw > 0 || a.vT > 0) r.sw++; const nf = foes.reduce((m, f) => Math.min(m, Math.abs(f.x - a.x)), 1e9); if (nf < 110) r.near++; if (a.x < fr - 140) r.back++; r.c = a.c; r.evo = a.evo || 0; }
      __m.rows = [...S.army].filter(a => id.has(a)).map(a => id.get(a)); __m.boss = st.boss ? st.boss.phase : '-'; __m.giant = S.giant && S.giant.on ? `on slam${(S.giant.slam||0).toFixed(1)} raise${(S.giant.raise||0).toFixed(1)} walk${(S.giant.walk||0).toFixed(1)}` : 'off'; }, 100); }, stg);
  for (let k = 0; k < 8; k++) { await pg.waitForTimeout(3000); if (k === 4) console.log("병사 구성", await pg.evaluate(() => { const m = {}; for (const a of S.army) if (!a.fly) { const key = "c" + a.c + (a.evo ? "e" + a.evo : ""); m[key] = (m[key] || 0) + 1; } return JSON.stringify(m); })); const m = await pg.evaluate(() => { const r = __m.rows; const idle = r.filter(x => x.seen > 20 && x.sw / x.seen < 0.04); return `[${S.phase} wave${st.wave} stage${st.stage} foes${S.foes.length}] t${__m.t} 병사${r.length} 한번도안때림${idle.length} [${idle.map(x => 'c' + x.c + 'e' + x.evo + ':' + x.sw + '/' + x.seen + (x.near ? '·가까움' + x.near : '') + (x.back ? '·뒷줄' + x.back : '')).join(' ')}] 적${S.foes.filter(f => !f.dead).length} 보스${__m.boss} 거인${__m.giant} 영웅${HF.list.map(h => h.id + ':' + (h.atkT||0).toFixed(1)).join(',')}`; }); console.log(m); }
  console.log('오류', errs.length, errs.slice(0, 3).join(' | ')); await b.close(); srv.close();
})();
