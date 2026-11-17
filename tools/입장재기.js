// node 입장재기.js 폴더 → 순서 #6 「병사 · 영웅 입장 자연스럽게 · 몰림」(지적 B8 · A5) 재는 자
// 1-1 처음부터 「일으켜라」 9번 → 영웅 넷 합류 → 판 넘김 3번(1-2 · 1-3 · 1-4)을 실제로 돌리며 매 프레임 모든 유닛 위치를 기록
// 잼: ① 순간이동 = 한 프레임에 45px 넘게(2배속 · 시험 화면 끊김 0.1초면 30px까지는 걸음) 튄 횟수(날아가는 해골 · 죽는 것 빼고)  ② 갑자기 나타남 = 처음 보인 순간 이미 70% 넘게 진한 유닛(화면 안)
//     ③ 몰림 = 들어온 지 2초 안 유닛이 같은 편과 몸이 겹친(가로 28 · 세로 14 안) 프레임 비율  ④ 입장 시간 = 처음 보여서 자리에 설 때까지 걸린 초(너무 빠르면 「뿅」)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'); const dir = process.argv[2], PORT = 8178;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000);
  await pg.evaluate(() => {
    const id = new WeakMap(); let n = 0; const key = o => { if (!id.has(o)) id.set(o, ++n); return id.get(o); };
    const R = window.__E = { f: 0, seen: {}, tp: { 군단: 0, 영웅: 0, 적: 0 }, tpEx: [], pop: { 군단: 0, 영웅: 0, 적: 0 }, popEx: [], crowdF: 0, newF: 0, settle: [], last: {} };
    const vis = x => x > VW.x + 30 && x < VX1 - 40;   /* 몸 절반 넘게 화면 안 */
    const tick = () => { if (S.hold) { requestAnimationFrame(tick); return; } R.f++; const now = S.t, rows = [];
      for (const a of S.army) if (!a.fly && !a.gone) rows.push(['군단', key(a), a.x, a.y, a.rise ?? 1, a.tx]);
      for (const h of (HF.list || [])) if (st.squad.includes(h.id)) rows.push(['영웅', key(h), h.x, h.y, h.enter ?? 1, h.tx]);
      for (const f of S.foes) if (!f.dead && !f.flee) rows.push(['적', key(f), f.x, f.y, f.alpha ?? 1, null]);
      const fresh = [];
      for (const [k, i, x, y, al, tx] of rows) { const s = R.seen[i], L = R.last[i];
        if (!s && vis(x)) { R.seen[i] = { t: now, k, x0: x }; if (al > 0.7 && (k === '적' ? x < VX1 - 150 : x > VW.x + 150)) {   /* 끝에서 걸어 들어온 건 빼고, 화면 가운데에 진하게 「뿅」 나타난 것만 */ R.pop[k]++; R.popEx.length < 6 && R.popEx.push(`${k} x${Math.round(x)} 진하기${al.toFixed(2)} t${now.toFixed(1)} ${S.phase}`); } }
        if (L && vis(x) && Math.hypot(x - L[0], y - L[1]) > 45 && !S.hold && !UI.awakening) { R.tp[k]++; R.tpEx.length < 8 && R.tpEx.push(`${k} ${Math.round(L[0])},${Math.round(L[1])}→${Math.round(x)},${Math.round(y)} t${now.toFixed(1)}`); }
        R.last[i] = [x, y]; const s2 = R.seen[i];
        if (s2 && !s2.set && tx != null && Math.abs(x - tx) < 30 && now - s2.t > 0) { s2.set = 1; R.settle.push([k, +(now - s2.t).toFixed(2)]); }
        if (s2 && now - s2.t < 2 && k !== '적') fresh.push([k, x, y]); }
      { const hs = rows.filter(r => r[0] === '영웅'); for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++) if (Math.abs(hs[i][2] - hs[j][2]) < 20 && Math.abs(hs[i][3] - hs[j][3]) < 12) { R.hStack = (R.hStack || 0) + 1; } R.hF = (R.hF || 0) + (hs.length > 1 ? 1 : 0); }
      if (fresh.length) { R.newF++; const side = rows.filter(r => r[0] !== '적' && vis(r[2])); let hit = 0;
        for (const [k, x, y] of fresh) if (side.filter(r => Math.abs(r[2] - x) < 28 && Math.abs(r[3] - y) < 14).length > 1) hit++;
        if (hit) R.crowdF++; }
      requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);   /* 첫 화면을 누르는 순간부터 잼(깨어나는 장면의 입장 포함) */
  for (let i = 0; i < 9; i++) { await pg.evaluate(() => { const r = document.getElementById('raiseBtn'); if (r) { r.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); r.click(); } }); await pg.waitForTimeout(600); }
  await pg.waitForTimeout(2500);
  await pg.evaluate(() => { for (const h of JB.HEROES.slice(0, 4)) st.heroes[h.id] = st.heroes[h.id] || { lv: 1, wp: 0 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => JB.HEROES[i] ? JB.HEROES[i].id : null); st.souls = 1e6; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; UI.closeModal(); UI.render(true); });
  for (let i = 0; i < 4; i++) { await pg.waitForTimeout(6000); await pg.evaluate(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }); }
  const r = await pg.evaluate(() => { const R = __E, st2 = {}; for (const [k, s] of R.settle) (st2[k] = st2[k] || []).push(s);
    const med = a => a && a.length ? a.slice().sort((p, q) => p - q)[a.length >> 1] : null;
    return { 프레임: R.f, 판: st.stage, 순간이동: R.tp, 순간이동_예: R.tpEx, 갑자기나타남: R.pop, 나타남_예: R.popEx, 영웅_포개짐: R.hF ? Math.round((R.hStack || 0) / R.hF * 100) + '%' : '-', 몰림_비율: R.newF ? Math.round(R.crowdF / R.newF * 100) + '%' : '-', 몰림_프레임: R.crowdF + '/' + R.newF,
      입장초_가운데: Object.fromEntries(Object.entries(st2).map(([k, a]) => [k, med(a)])), 입장초_가장빠름: Object.fromEntries(Object.entries(st2).map(([k, a]) => [k, Math.min(...a)])), 본수: Object.values(R.seen).reduce((m, s) => (m[s.k] = (m[s.k] || 0) + 1, m), {}), 입장수: Object.fromEntries(Object.entries(st2).map(([k, a]) => [k, a.length])) }; });
  r.오류 = errs.length; console.log(JSON.stringify(r)); await b.close(); srv.close(); })();
