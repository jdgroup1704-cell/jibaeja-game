// 새 틀 알림 줄 잼(11-18 · 대표님 03:09 사진 「보스 격파!」 · 「2페이지」 · 「…분노!」 세 겹): 후반 저장에서 큰 알림 여러 개를 한꺼번에 일으키고 0.15초마다 6초 — 화면에 동시에 뜬 큰 알림 수(1이어야) · VS 그림이 반쪽 상자 안 · 사진
// node 알림줄재기.js 폴더 [높이] → JSON
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = process.argv[2], H = +(process.argv[3] || 640), PORT = 8360 + Math.floor(Math.random() * 20);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
const LATE = fs.readFileSync(path.join(__dirname, '시험자료', '후반저장.txt'), 'utf8');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--mute-audio'] }); const ctx = await b.newContext({ viewport: { width: 360, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(sv => { try { localStorage.setItem('jibaeja_b1115102811', sv); } catch (e) {} }, LATE);
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3500); for (let i = 0; i < 4; i++) { await pg.evaluate(() => UI.closeModal()); await pg.waitForTimeout(300); }
  const count = () => pg.evaluate(() => { const vis = e => { if (!e) return false; const c = getComputedStyle(e); if (c.display === 'none' || +c.opacity < 0.15) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const on = []; if (vis(document.getElementById('notice'))) on.push('띠:' + document.querySelector('#notice b').textContent.slice(0, 8)); for (const e of document.querySelectorAll('.rwban')) if (vis(e)) on.push('격파카드'); if (document.querySelector('#vsfx.go')) on.push('VS'); if (vis(document.querySelector('#bvb.on'))) on.push('보스말'); if (vis(document.querySelector('#cutin.go'))) on.push('기술띠');
    const sc = (S.texts || []).filter(t => t.screen && t.age < t.life).length; if (sc) on.push('캔버스큰글자' + sc); return on; });
  for (let i = 0; i < 3; i++) { await pg.evaluate(() => UI.closeModal()); await pg.waitForTimeout(400); } await pg.evaluate(() => { UI.openModal = () => {}; });   /* 출석부 창이 다시 떠서 격파 카드 · VS가 막혔음 → 재는 동안 창 끔 */
  // 한꺼번에: 경고 · 2페이지 · 격파 카드 · 고비 · 거인
  await pg.evaluate(() => { NOTICE.banner(L.boss.warn, '', { pri: 2, ms: 1500, cls: 'red' }); if (!st.boss) st.boss = { phase: 'fight', hp: 1, max: 1 }; try { BV.phase2(); } catch (e) { console.error('ph2 ' + e.message); } RW.show({ souls: 1.3e8, gems: 30 }, 700, 500); say(L.milestone('1,000'), W / 2, 0, { size: 30, screen: true, life: 1.6 }); say(L.thrall.rise, W / 2, H * 0.15, { size: 50, screen: true, life: 2.2 }); say('쓰러진 적…', W / 2, H * 0.2, { size: 22, screen: true }); });
  let max = 0, worst = [], seq = []; const shots = [];
  for (let i = 0; i < 46; i++) { const on = await count(); if (on.length > max) { max = on.length; worst = on; } if (on.length && (!seq.length || seq[seq.length - 1] !== on.join('+'))) seq.push(on.join('+')); if (i % 9 === 4) { const f = `/tmp/알림줄_${i}.png`; await pg.screenshot({ path: f }); shots.push(f); } await pg.waitForTimeout(150); }
  // VS
  await pg.waitForTimeout(800); await pg.evaluate(() => { UI.vsShow(false); }); await pg.waitForTimeout(1300);
  const vs = await pg.evaluate(() => { const box = document.querySelector('#vsfx'); if (!box || !box.classList.contains('go')) return null; const R = e => { const q = e.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)]; }; const sw = R(document.getElementById('stagewrap'));
    return { 칸: sw, 왼: R(document.querySelector('#vsfx .vl img')), 오: R(document.querySelector('#vsfx .vr img')), 이름: R(document.querySelector('#vsfx > .vnm.vb')) }; });
  const f = `/tmp/알림줄_vs.png`; await pg.screenshot({ path: f }); shots.push(f);
  const inside = v => v && [v.왼, v.오, v.이름].every(a => a[0] >= v.칸[0] - 1 && a[2] <= v.칸[2] + 1 && a[1] >= v.칸[1] - 1 && a[3] <= v.칸[3] + 1);
  execSync(`ffmpeg -y -loglevel error ${shots.map(x => `-i ${x}`).join(' ')} -filter_complex "${shots.map((_, i) => `[${i}]scale=360:-1[s${i}]`).join(';')};${shots.map((_, i) => `[s${i}]`).join('')}hstack=${shots.length}" -q:v 4 /home/claude/rec/새틀/알림줄.jpg`);
  console.log(JSON.stringify({ 동시최대: max, 그때: worst, 차례: seq, VS: vs, VS칸안: inside(vs), 오류: errs.slice(0, 3) })); await b.close(); srv.close(); })();
