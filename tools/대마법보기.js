// 대표님 폰(360×593)에서 첫 보스 대마법이 화면 밖으로 잘리는지 보기: node 대마법보기.js 폴더 → 장면 8장 격자 + 마법진 자리 숫자
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process'); const dir = process.argv[2];
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8165);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8165/index.html?test=1'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  await pg.evaluate(() => { st.stage = st.best = 9; st.wave = 2; st.up.summon = 8; st.seen.curTip = 1; st.seen.fallTip = 1; st.seen.idleTip = 9; st.raised = 99; UI.closeModal(); UI.render(true); });
  let t0 = Date.now(); while (Date.now() - t0 < 60000 && !(await pg.evaluate(() => S.phase === 'prompt'))) await pg.waitForTimeout(300);
  console.log('대마법 차례', await pg.evaluate(() => S.phase)); execSync('rm -rf /tmp/대마법; mkdir -p /tmp/대마법');
  await pg.evaluate(() => UI.closeModal()); await pg.waitForTimeout(200); await pg.screenshot({ path: '/tmp/대마법/0.png' }); await pg.evaluate(() => document.getElementById('cast')?.click());
  await pg.waitForTimeout(+(process.argv[3] || 0)); for (let i = 1; i < 8; i++) { await pg.waitForTimeout(450); await pg.screenshot({ path: `/tmp/대마법/${i}.png` }); }
  execSync(`ffmpeg -y -loglevel error ${[...Array(8)].map((_, i) => `-i /tmp/대마법/${i}.png`).join(' ')} -filter_complex "xstack=inputs=8:layout=0_0|w0_0|w0+w0_0|w0+w0+w0_0|0_h0|w0_h0|w0+w0_h0|w0+w0+w0_h0,scale=1440:-1" -q:v 4 /home/claude/rec/대마법_폰.jpg`);
  console.log('오류', errs.length, errs.slice(0, 2).join(' | ')); await b.close(); srv.close(); })();
