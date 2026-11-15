// 눈 확인용 폰 화면 6장(11-15 대표님 「눈으로 보라고! 니가 만드는 거」 · 「계속 고정한다 해 놓고 놓치니」)
// node 눈찍기.js 폴더 [이름] → /home/claude/rec/눈/눈_이름.jpg(대표님 폰 360×593: 첫 화면 · 전장 · 강화 탭 · 영웅 탭 · 임무 탭 · 상점)
// 찍은 뒤 반드시 그 사진을 열어 보고 /home/claude/rec/눈확인.md 에 「- 눈_이름.jpg: 본 것 한 줄」을 적어야 관문 ⑥이 통과
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process'); const dir = process.argv[2], name = process.argv[3] || new Date(Date.now() + 9 * 3600e3).toISOString().slice(5, 16).replace(/[-T:]/g, '');
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8173);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const T = '/tmp/눈찍기'; execSync(`rm -rf ${T}; mkdir -p ${T}`); const shot = async i => pg.screenshot({ path: `${T}/${i}.png` });
  await pg.goto('http://localhost:8173/index.html'); await pg.waitForTimeout(3600); await shot(0);
  await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(4000); await shot(1);
  await pg.evaluate(() => { st.stage = st.best = 30; st.daysPlayed = 14; st.souls = 5e6; st.bones = 300; st.gems = 500; st.raised = 99; st.up.summon = 12; for (const h of JB.HEROES.slice(0, 4)) st.heroes[h.id] = { lv: 2, wp: 1 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => JB.HEROES[i] ? JB.HEROES[i].id : null); st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; Object.assign(st.seen, { curTip: 1, fallTip: 1, idleTip: 9 }); UI.closeModal(); UI.tab = 'up'; UI.render(true); });
  await pg.waitForTimeout(3000); await shot(2);
  for (const [i, tb] of [[3, 'hero'], [4, 'mission']]) { await pg.evaluate(tb => { UI.closeModal(); UI.tab = tb; UI.render(true); }, tb); await pg.waitForTimeout(900); await shot(i); }
  await pg.evaluate(() => { UI.closeModal(); EX.shopOpen(); }); await pg.waitForTimeout(800); await shot(5);
  const out = `/home/claude/rec/눈/눈_${name}.jpg`;
  execSync(`ffmpeg -y -loglevel error ${[0, 1, 2, 3, 4, 5].map(i => `-i ${T}/${i}.png`).join(' ')} -filter_complex "xstack=inputs=6:layout=0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0,scale=2160:-1" -q:v 3 "${out}"`);
  console.log('찍음', out, '· 오류', errs.length, errs.slice(0, 2).join(' | ')); await b.close(); srv.close(); })();
