// 보스 머리 위 체력 막대 · 적 체력 막대 눈 확인(11-15 대표님 「보스도 에너지바 맨 위 말고 따로」): node 보스막대보기.js 폴더 [이름] → /home/claude/rec/눈/보스_이름.jpg (싸움 중 3장 + 9판 일반 1장)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process'); const dir = process.argv[2], name = process.argv[3] || 'now';
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8174);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); const T = '/tmp/보스막대'; execSync(`rm -rf ${T}; mkdir -p ${T}`);
  await pg.goto('http://localhost:8174/index.html?test=1&seed=5'); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { st.stage = st.best = 9; st.wave = 2; st.autoCast = true; st.up.summon = 3; st.up.bone = 2; st.login = { n: 1, last: st.day }; st.seen = Object.assign(st.seen || {}, { curTip: 1, fallTip: 1, idleTip: 9 }); UI.closeModal && UI.closeModal(); });
  await pg.waitForTimeout(2500); await pg.screenshot({ path: `${T}/0.png` }); let n = 1, last = 0;
  for (let i = 0; i < 70 && n < 4; i++) { await pg.waitForTimeout(500); const ph = await pg.evaluate(i => { UI.closeModal && UI.closeModal(); if (S.phase === 'prompt' || (st.boss && st.boss.phase === 'wait' && JB.canCast(st))) { const c = document.getElementById('cast'); c && c.click(); } return st.boss ? st.boss.phase + '|' + S.phase + '|' + (st.hp / st.maxHp).toFixed(2) : '-'; }, i); if (i % 6 === 0) console.log(i, ph, await pg.evaluate(() => st.stage));
    if (ph.startsWith('fight|') && i - last >= 4) { await pg.screenshot({ path: `${T}/${n}.png` }); console.log('찍음', n, ph); n++; last = i; } }
  while (n < 4) { await pg.screenshot({ path: `${T}/${n}.png` }); n++; }
  const out = `/home/claude/rec/눈/보스_${name}.jpg`; execSync(`ffmpeg -y -loglevel error ${[0, 1, 2, 3].map(i => `-i ${T}/${i}.png`).join(' ')} -filter_complex "xstack=inputs=4:layout=0_0|w0_0|w0+w1_0|w0+w1+w2_0,scale=2160:-1" -q:v 3 "${out}"`);
  console.log('저장', out, '· 오류', errs.length, errs.slice(0, 2).join(' | ')); await b.close(); srv.close(); })();
