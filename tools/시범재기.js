// node 시범재기.js 폴더 [이름] → JSON · 관문 ㊴ (11-17 02:44 대표님 「로봇이 화면에서 직접 플레이하는 창 + 빨리 감기 · 내 기록 · 서버는 건드리지 않게 시범용 저장 따로」)
// ① 대표님 기록(원래 저장)을 미리 넣어 둠 → ② ?demo=1로 켜서 위 띠 · 로봇이 한 일 · ×20 빨리 감기로 판이 오름 · 하루 넘기기 → ③ 끝내기 → 원래 기록이 한 글자도 안 바뀜 · 시범 저장은 따로 생김 · 오류 0 + 사진 띠
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process'); const dir = process.argv[2], name = process.argv[3] || 'a';
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8304);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  // ① 원래 기록: 보통 켜서 7판 저장
  await pg.goto('http://localhost:8304/index.html'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1000);
  await pg.evaluate(() => { st.stage = st.best = 7; st.gems = 123; save(); }); await pg.waitForTimeout(300); const before = await pg.evaluate(() => localStorage.getItem('jibaeja_b1115102811'));
  // ② 설정의 자동 시범 단추로 들어감
  await pg.evaluate(() => EX.settingsOpen()); await Promise.all([pg.waitForNavigation({ timeout: 8000 }).catch(() => {}), pg.evaluate(() => document.querySelector('#modal [data-x="demoGo"]').click())]); await pg.waitForTimeout(3000);
  execSync('rm -rf /tmp/시범; mkdir -p /tmp/시범'); let k = 0;
  const r = {}; r.띠 = await pg.evaluate(() => !!document.querySelector('#demobar') && getComputedStyle(document.querySelector('#demobar')).display !== 'none');
  r.시범저장이름 = await pg.evaluate(() => SAVE_KEY);
  await pg.screenshot({ path: `/tmp/시범/${String(k++).padStart(2, '0')}.png` });
  await pg.evaluate(() => document.querySelector('#demobar [data-sp="20"]').click()); const s0 = await pg.evaluate(() => ({ st: st.best, t: BOT.t }));
  for (let i = 0; i < 7; i++) { await pg.waitForTimeout(2000); await pg.screenshot({ path: `/tmp/시범/${String(k++).padStart(2, '0')}.png` }); }
  const s1 = await pg.evaluate(() => ({ st: st.best, t: BOT.t, aw: st.awakens, log: document.querySelector('#demobar .db3').innerText }));
  r.빨리감기_게임초 = Math.round(s1.t - s0.t); r.판오름 = s1.st - s0.st; r.로봇한일 = s1.log.slice(0, 60);
  const d0 = await pg.evaluate(() => st.daysPlayed || 0); await pg.evaluate(() => document.querySelector('#demobar .dbday').click()); await pg.waitForTimeout(1500); r.하루넘김 = (await pg.evaluate(() => st.daysPlayed || 0)) - d0;
  await pg.screenshot({ path: `/tmp/시범/${String(k++).padStart(2, '0')}.png` });
  r.시범저장있음 = await pg.evaluate(() => !!localStorage.getItem('jibaeja_demo_b1115102811'));
  // ③ 끝내기 → 원래 기록 그대로
  await pg.evaluate(() => document.querySelector('#demobar .dbx').click()); await pg.waitForTimeout(600); r.결과카드 = await pg.evaluate(() => !!document.getElementById('demoEnd')); await pg.screenshot({ path: `/tmp/시범/${String(k++).padStart(2, '0')}.png` });
  await Promise.all([pg.waitForNavigation({ timeout: 8000 }).catch(() => {}), pg.evaluate(() => document.getElementById('demoEnd').click())]); await pg.waitForTimeout(2500); r.끝낸뒤주소 = await pg.evaluate(() => location.search + location.hash);
  const after = await pg.evaluate(() => localStorage.getItem('jibaeja_b1115102811')); const ab = JSON.parse(after || '{}'), bb = JSON.parse(before || '{}');
  r.원래기록_판 = ab.stage; r.원래기록_마정석 = ab.gems; r.원래기록같음 = ab.stage === bb.stage && ab.gems === bb.gems && ab.up && JSON.stringify(ab.up) === JSON.stringify(bb.up); r.끝낸뒤띠없음 = await pg.evaluate(() => !document.querySelector('#demobar'));
  execSync(`ffmpeg -y -loglevel error -framerate 1 -i /tmp/시범/%02d.png -vf "scale=360:-1,tile=10x1" -frames:v 1 -q:v 4 /home/claude/rec/시범_${name}.jpg`);
  console.log(JSON.stringify({ ...r, 오류: errs.slice(0, 3) })); await b.close(); srv.close(); })();
