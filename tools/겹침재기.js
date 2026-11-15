// 싸움 중 화면 위 글자 상자들(알림 · 말풍선 · 알약 · 기술 띠 · 위 단추들 · 판 표시)이 서로 얼마나 자주 겹치는지 잼
// node 겹침재기.js 폴더 [판] → 겹친 짝마다 「몇 번 본 중 몇 번」. 많이 겹치는 짝 = 고칠 것
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], stg = +(process.argv[3] || 9);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.webp': 'image/webp' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8157);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, isMobile: true, hasTouch: true })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const real = stg === 0; await pg.goto(real ? 'http://localhost:8157/index.html?bot=1&speed=3&seed=4' : 'http://localhost:8157/index.html?test=1&seed=5'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  await pg.evaluate(([s, real]) => { if (!real) { st.stage = st.best = s; st.grave = st.grave.map(() => 2); st.up.summon = 6; S.army.length = 0; JB.pull && (st.gems = 500, JB.pull(st, 10)); st.squad = Object.keys(st.heroes).slice(0, 3).concat([null, null, null]).slice(0, st.squad.length); }
    window.__o = { n: 0, pair: {}, seen: {} };
    const vis = el => { if (!el) return null; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.3) return null; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 ? r : null; };
    setInterval(() => { if (!['battle', 'fight', 'stare', 'prompt', 'walk'].includes(S.phase)) return; __o.n++; const box = {};
      box['알림'] = vis(document.getElementById('toast')); box['알약'] = document.getElementById('reraise').classList.contains('on') ? vis(document.getElementById('reraise')) : null;
      const ci = document.getElementById('cutin'); box['기술띠'] = ci && ci.classList.contains('go') && vis(ci) ? vis(ci.querySelector('.ci-bg')) : null;
      document.querySelectorAll('#tools button').forEach(bt => box['단추:' + bt.textContent.trim().slice(0, 4)] = vis(bt));
      box['판표시'] = vis(document.getElementById('stbig'));
      const bb = S.bubble; if (bb && bb.box && bb.age < (bb.life || 3.2) - 0.3) { const cv = document.querySelector('canvas'), cr = cv.getBoundingClientRect(), m = bb.tf, k = cr.width / cv.width; const x0 = cr.left + (m.a * bb.box[0] + m.e) * k, y0 = cr.top + (m.d * bb.box[1] + m.f) * k; box['말풍선'] = { left: x0, top: y0, right: x0 + m.a * bb.box[2] * k, bottom: y0 + m.d * bb.box[3] * k, width: m.a * bb.box[2] * k, height: m.d * bb.box[3] * k }; }
      { const cv = document.querySelector('canvas'), cr = cv.getBoundingClientRect(), k = cr.width / cv.width; let n = 0; for (const t of S.texts) if (t.tf && t.size >= 36 && t.age > t.life * 0.1 && t.age < t.life * 0.75) { const m = t.tf, hw = t.bw / 2, hh = t.size / 2, xs = [-hw, hw].map(lx => m.a * lx + m.e), ys = [-hh, hh].map(ly => m.d * ly + m.f); const L0 = cr.left + Math.min(...xs) * k, T0 = cr.top + Math.min(...ys) * k, W0 = Math.abs(xs[1] - xs[0]) * k, H0 = Math.abs(ys[1] - ys[0]) * k; box['큰글자' + (n++ ? n : '') + ':' + t.text.slice(0, 6)] = { left: L0, top: T0, right: L0 + W0, bottom: T0 + H0, width: W0, height: H0 }; } }
      const ks = Object.keys(box).filter(k => box[k]); ks.forEach(k => __o.seen[k] = (__o.seen[k] || 0) + 1);
      for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) { const A = box[ks[i]], B = box[ks[j]]; const ix = Math.min(A.right, B.right) - Math.max(A.left, B.left), iy = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top); if (ix > 4 && iy > 4) { const fr = ix * iy / Math.min(A.width * A.height, B.width * B.height); if (fr > 0.12) { const key = ks[i] + ' × ' + ks[j]; __o.pair[key] = (__o.pair[key] || 0) + 1; } } }
    }, 100);
    if (!real) setInterval(() => { if (Math.random() < 0.5) heroSay('win'); UI.cutT = 0; }, 2500);   /* 말풍선 · 기술 띠가 자주 나오게 */
  }, [stg, real]);
  await pg.waitForTimeout(real ? 150000 : 30000);
  const o = await pg.evaluate(() => __o);
  const rows = Object.entries(o.pair).sort((a, b) => b[1] - a[1]);
  console.log(`잰 횟수 ${o.n} · 보인 것 ${Object.entries(o.seen).map(([k, v]) => k + v).join(' ')}`);
  console.log(rows.length ? rows.map(([k, v]) => `겹침: ${k} ${v}번(${Math.round(v / Math.max(1, Math.min(o.seen[k.split(' × ')[0]], o.seen[k.split(' × ')[1]])) * 100)}%)`).join('\n') : '겹침 없음');
  console.log('오류', errs.length, errs.slice(0, 2).join(' | ')); await b.close(); srv.close();
})();
