// 싸움 화면 몇 장 찍기: node 싸움찍기.js 폴더 판 [초반] 이름 → /home/claude/rec/싸움_이름.jpg (가로로 붙임)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = process.argv[2], stg = +(process.argv[3] || 9), early = process.argv[4] === '초반', nm = process.argv[5] || '확인';
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8154);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await (await b.newContext({ viewport: { width: 384, height: 665 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8154/index.html?test=1&seed=5'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  await pg.evaluate(([s, e]) => { st.stage = st.best = s; if (!e) { st.grave = st.grave.map(() => 2); st.evo = [2, 1, 1, 0, 0]; } st.up.summon = 6; S.army.length = 0; }, [stg, early]);
  const fs2 = []; for (let k = 0; k < 4; k++) { await pg.waitForTimeout(k ? 2500 : 6000); if (process.env.SAY && k === 1) { await pg.evaluate(() => heroSay("join")); await pg.waitForTimeout(600); } if (process.env.CUT && k === 1) { await pg.evaluate(() => { UI.cutT = 0; UI.cutIn("krag", "뼈의 돌격", "#ffcc33"); }); await pg.waitForTimeout(300); } const f = `/tmp/sf${k}.png`; await pg.screenshot({ path: f, clip: { x: 0, y: 28, width: 384, height: 200 } }); fs2.push(f); }
  execSync(`ffmpeg -y -loglevel error ${fs2.map(f => '-i ' + f).join(' ')} -filter_complex "hstack=${fs2.length}" -q:v 3 /home/claude/rec/싸움_${nm}.jpg`);
  console.log('오류', errs.length, errs.slice(0, 2).join(' | ')); await b.close(); srv.close();
})();
