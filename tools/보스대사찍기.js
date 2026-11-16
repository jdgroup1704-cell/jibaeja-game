// node 보스대사찍기.js 폴더 이름 → /home/claude/rec/보스대사_이름.jpg + JSON: 이름 넣기(지배자 진동 · 라이벌 로이) · 1-10 보스 등장 대사 · 2페이지 카드 · 분노 대사 · 쓰러짐 대사 (관문 ㉘)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = process.argv[2], nm = process.argv[3] || '확인', PORT = 8213;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1200);
  /* 설정 창에서 이름을 실제로 넣고 저장 */
  await pg.evaluate(() => { UI.closeModal(); EX.act('settings'); }); await pg.waitForTimeout(600);
  const hasInput = await pg.evaluate(() => !!document.getElementById('nmMe')); await pg.screenshot({ path: '/tmp/bv_set.png' });
  if (hasInput) { await pg.fill('#nmMe', '진동'); await pg.fill('#nmRv', '로이'); await pg.click('[data-x="nmSave"]'); await pg.waitForTimeout(500); }
  await pg.evaluate(() => { st.stage = st.best = 9; st.wave = 3; st.waveT = 0; st.daysPlayed = 14; st.souls = 5e6; st.up.summon = 10; st.spellReady = 999; st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; UI.closeModal(); JB.startWave(st);
    setInterval(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }, 120);
    window.__V = { arrive: null, ph2: 0, card: null, lines: [], vsMe: null, vsBoss: null };
    const bb = BV.bubble.bind(BV); BV.bubble = function (t, l) { __V.lines.push(t); return bb(t, l); };
    setInterval(() => { const v = document.getElementById('vsfx'); if (v && v.classList.contains('go') && !__V.vsMe) { __V.vsMe = v.querySelector('.vl span')?.textContent; __V.vsBoss = v.querySelector('.vr span')?.textContent; } if (st.boss && st.boss.ph2 && !__V.ph2) { __V.ph2 = 1; __V.card = document.getElementById('bph2')?.textContent; } if (st.boss && st.boss.phase === 'fight' && !st.boss.__big) { st.boss.__big = 1; st.maxHp = st.hp = st.hp * 2.5; st.boss.timer += 60; } }, 50); });
  const shots = []; let p2shot = 0, aShot = 0, dShot = 0;
  for (let i = 0; i < 260; i++) { await pg.waitForTimeout(200); const s = await pg.evaluate(() => ({ bub: document.querySelector('#bvb.on')?.textContent || '', ph2: !!document.querySelector('#bph2.on'), down: !st.boss && __V.lines.length >= 3 }));
    if (s.bub && !aShot) { aShot = 1; await pg.screenshot({ path: '/tmp/bv_a.png' }); shots.push('/tmp/bv_a.png'); }
    if (s.ph2 && !p2shot) { p2shot = 1; await pg.waitForTimeout(250); await pg.screenshot({ path: '/tmp/bv_p.png' }); shots.push('/tmp/bv_p.png'); await pg.waitForTimeout(1200); await pg.screenshot({ path: '/tmp/bv_p2.png' }); shots.push('/tmp/bv_p2.png'); }
    if (s.down && !dShot) { dShot = 1; await pg.screenshot({ path: '/tmp/bv_d.png' }); shots.push('/tmp/bv_d.png'); break; } }
  const V = await pg.evaluate(() => __V);
  const all = ['/tmp/bv_set.png', ...shots]; execSync(`ffmpeg -loglevel error -y ${all.map(f => `-i ${f}`).join(' ')} -filter_complex "${all.map((_, i) => `[${i}]scale=360:-2[s${i}]`).join(';')};${all.map((_, i) => `[s${i}]`).join('')}hstack=inputs=${all.length}" /home/claude/rec/보스대사_${nm}.jpg`);
  console.log(JSON.stringify({ 이름칸: hasInput, 대결지배자: V.vsMe, 대결보스: V.vsBoss, 대사: V.lines, 페이지2: V.ph2, 카드: V.card, 오류: errs.slice(0, 3) })); await b.close(); srv.close(); })();
