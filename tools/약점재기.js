// node 약점재기.js 폴더 [이름] → JSON 한 줄 + /home/claude/rec/약점_이름.jpg — 순서 #12 「약점 끊기」(관문 ㉒)
// 1-10 보스판: 대마법을 쓰지 않고 군단만으로 싸우게 둠 → 약점이 몇 번 떴나 · 첫 번째는 눌러서(체력 줄었나 · 보스 시간 +2초 · 기술 취소) · 두 번째는 그냥 둠(기술이 터지나)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = process.argv[2], nm = process.argv[3] || '확인', PORT = 8199;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { st.stage = st.best = 9; st.wave = 3; st.waveT = 0; st.daysPlayed = 14; st.souls = 5e6; st.up.summon = 6; st.spellReady = 999; const H = JB.HEROES.slice(0, 4).map(h => h.id); for (const id of H) st.heroes[id] = { lv: 2, wp: 1 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => H[i] || null); st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; st.seen.bcHit = 0; st.seen.bcMiss = 0; UI.closeModal();
    window.__B = { 뜸: 0, 누름전: null, 누른뒤: null, 특수: 0 }; const bs = window.bossSpecial; window.bossSpecial = function () { __B.특수++; return bs.apply(this, arguments); };
    setInterval(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); const e = document.getElementById('bweak'); if (e && e.classList.contains('on') && !e.__c) { e.__c = 1; __B.뜸++; } if (e && !e.classList.contains('on')) e.__c = 0; }, 30); });
  /* 보스가 약점 두 번 뜰 때까지 버티게: 보스가 나오면 체력 · 시간을 크게(약점 동작을 재는 시험 — 밸런스는 ⑪이 잼) */
  await pg.evaluate(() => { window.__big = setInterval(() => { if (st.boss && !st.boss.__big && st.boss.phase !== 'arrive') { st.boss.__big = 1; st.maxHp = st.hp = st.hp * 40; st.boss.timer = 99; } }, 50); });
  const shots = []; let pressed = false, t0 = Date.now();
  while (Date.now() - t0 < 50000) { await pg.waitForTimeout(150);
    const s = await pg.evaluate(() => ({ on: !!document.querySelector('#bweak.on'), n: __B.뜸, boss: !!st.boss, ph: st.boss && st.boss.phase }));
    if (s.on && !pressed && s.n === 1) { await pg.waitForTimeout(500); const f = `/tmp/bw_${shots.length}.png`; await pg.screenshot({ path: f }); shots.push(f);
      await pg.evaluate(() => { const b = { hp: st.hp, timer: st.boss.timer, sp: __B.특수 }; document.getElementById('bweak').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); __B.누름전 = b; __B.누른뒤 = { hp: st.hp, timer: st.boss ? st.boss.timer : null }; });   /* 누르기 전후를 한순간에 잼(군단 피해 · 흐른 시간이 섞이지 않게) */
      await pg.waitForTimeout(600); const f2 = `/tmp/bw_${shots.length}.png`; await pg.screenshot({ path: f2 }); shots.push(f2); pressed = true; await pg.waitForTimeout(2200); await pg.evaluate(() => { __B.누른뒤.sp = __B.특수; }); }
    if (s.n >= 2 && pressed) { await pg.waitForTimeout(1000); const f = `/tmp/bw_${shots.length}.png`; await pg.screenshot({ path: f }); shots.push(f); for (let w = 0; w < 30 && !(await pg.evaluate(() => __B.특수 > 0 || !document.querySelector('#bweak.on'))); w++) await pg.waitForTimeout(200); await pg.waitForTimeout(500); const f2 = `/tmp/bw_${shots.length}.png`; await pg.screenshot({ path: f2 }); shots.push(f2); break; }
    if (!s.boss && pressed) break; }
  const B = await pg.evaluate(() => __B), seen = await pg.evaluate(() => ({ hit: st.seen.bcHit, miss: st.seen.bcMiss }));
  if (shots.length) execSync(`ffmpeg -loglevel error -y ${shots.map(f => `-i ${f}`).join(' ')} -filter_complex "${shots.map((_, i) => `[${i}]scale=360:-2[s${i}]`).join(';')};${shots.map((_, i) => `[s${i}]`).join('')}hstack=inputs=${shots.length}" /home/claude/rec/약점_${nm}.jpg`);
  const R = { 약점뜸: B.뜸, 눌러서끊음: seen.hit, 그냥둠: seen.miss, 체력깎인퍼센트: B.누름전 && B.누른뒤 ? Math.round((B.누름전.hp - B.누른뒤.hp) / await pg.evaluate(() => st.maxHp) * 1000) / 10 : null, 시간더함: B.누름전 && B.누른뒤 && B.누른뒤.timer != null ? Math.round((B.누른뒤.timer - B.누름전.timer) * 10) / 10 : null, 끊은뒤기술: B.누름전 && B.누른뒤 ? B.누른뒤.sp - B.누름전.sp : null, 기술총: B.특수, 오류: errs.slice(0, 3) };
  console.log(JSON.stringify(R)); await b.close(); srv.close(); })();
