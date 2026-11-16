// node 창겹침재기.js 폴더 [이름] [초] → JSON · 관문 ㊵ (11-17 04:24 대표님 폰 사진 4장 「헛웃음」)
// 대표님 상황 그대로: 폰(360×593) · 7장 끝(지역 주인 VS 앞) · 41분 비웠다 돌아옴(자리 비움 창) · 판이 바뀜(업데이트 창) → 보스 · 지역 주인 · 8-5 보스까지
// 0.1초마다 화면에 뜬 큰 것(창 · VS · 보스 격파 띠 · 보스 말풍선 · 장 카드 · 2페이지 카드 · 화면 큰 글자)의 자리를 재서 둘이 겹친 순간을 셈
// 창은 사람처럼 3초 읽고 닫음. 통과 = 겹침 0 · 오류 0 · 보스 격파 띠가 1번 이상 나옴(숨기기만 해서 통과하는 것 막기)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = process.argv[2], name = process.argv[3] || 'a', SEC = +(process.argv[4] || 100);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(+(process.env.PORT||8311));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const URL = 'http://localhost:'+(process.env.PORT||8311)+'/index.html?test=1&speed=2';
  await pg.goto(URL); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(800);
  await pg.evaluate(() => {
    st.stage = st.best = 28; st.wave = 1; st.souls = 5e9; st.gems = 1166; st.up = { summon: 175, bone: 90, magic: 60, harvest: 40 };
    for (const h of JB.HEROES.slice(0, 4)) st.heroes[h.id] = { lv: 30, wp: 3 }; st.squad = st.squad.map((_, i) => (JB.HEROES[i] || {}).id || null);
    st.autoCast = true; st.lastSeen = Date.now() - 41 * 60e3 - 21e3; st.lastVer = '판 옛날'; save(); window.__wiped = true;   // 다시 열 때 지금 상태로 덮어쓰지 않게
  });
  await pg.goto(URL); await pg.waitForTimeout(1200);
  const res = { 잰수: 0, 겹침: 0, 겹친것: {}, 본것: {}, 창닫음: 0, 격파띠: 0, 판: '' }; let modalT = 0, shots = 0; execSync('rm -rf /tmp/창겹침; mkdir -p /tmp/창겹침');
  const t0 = Date.now();
  while (Date.now() - t0 < SEC * 1000) {
    const o = await pg.evaluate(() => {
      const vis = el => { if (!el) return null; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.35) return null; const r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4 ? r : null; };
      const L = [], add = (k, r) => r && L.push({ k, x0: r.left, y0: r.top, x1: r.right, y1: r.bottom });
      const m = document.getElementById('modal'); if (m && m.style.display === 'flex') add('창', vis(m.querySelector('.box')));
      add('VS', vis(document.querySelector('#vsfx.go'))); document.querySelectorAll('.rwban:not(.out)').forEach(e => add('격파띠', vis(e)));
      add('보스말', vis(document.querySelector('#bvb.on'))); add('장카드', vis(document.querySelector('#rcard.on'))); add('2페이지', vis(document.querySelector('#bph2.on')));
      const r = cv.getBoundingClientRect(), k = r.width / cv.width;
      for (const t of S.texts) if (t.screen && t.size >= 40 && t.age < t.life && typeof t.text === 'string') { const w = t.text.length * t.size * 0.95 * k, h = t.size * 1.1 * k, cx = r.left + t.x * k, cy = r.top + t.y * k; L.push({ k: '큰글:' + t.text.slice(0, 8), x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 }); }
      const hit = [];
      for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const a = L[i], c = L[j]; const ix = Math.min(a.x1, c.x1) - Math.max(a.x0, c.x0), iy = Math.min(a.y1, c.y1) - Math.max(a.y0, c.y0); if (ix <= 0 || iy <= 0) continue; const sm = Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (c.x1 - c.x0) * (c.y1 - c.y0)); if (ix * iy > sm * 0.12) hit.push(a.k + ' × ' + c.k); }
      return { ks: L.map(x => x.k), hit, modal: !!(m && m.style.display === 'flex'), lab: (document.querySelector('#hud') || {}).textContent?.slice(0, 6) || '', stage: st.stage, rw: typeof RW !== 'undefined' ? RW.n : 0 };
    });
    res.잰수++; o.ks.forEach(k => { const kk = k.split(':')[0]; res.본것[kk] = (res.본것[kk] || 0) + 1; }); res.격파띠 = o.rw; res.판 = o.stage;
    if (o.hit.length) { res.겹침++; o.hit.forEach(h => res.겹친것[h] = (res.겹친것[h] || 0) + 1); if (shots < 8) await pg.screenshot({ path: `/tmp/창겹침/${String(shots++).padStart(2, '0')}.png` }); }
    if (o.modal) { if (!modalT) modalT = Date.now(); else if (Date.now() - modalT > 3000) { await pg.evaluate(() => UI.closeModal()); res.창닫음++; modalT = 0; } } else modalT = 0;
    await pg.waitForTimeout(100);
  }
  if (shots) execSync(`ffmpeg -y -loglevel error -framerate 1 -i /tmp/창겹침/%02d.png -vf "tile=${Math.min(shots, 4)}x${Math.ceil(shots / 4)},scale=1440:-1" -frames:v 1 -q:v 4 /home/claude/rec/창겹침_${name}.jpg`);
  res.오류 = errs.slice(0, 3); res.통과 = res.겹침 === 0 && errs.length === 0 && res.격파띠 >= 1 && res.창닫음 >= 2;
  console.log(JSON.stringify(res)); await b.close(); srv.close(); process.exit(0);
})();
