// node 뽑기재기.js 폴더 [이름] → JSON · 관문 ㊱ (11-16 대표님 다음 할 일 ④ 「뽑기 · 승급 결제 매력」)
// 대표님 폰(360×593): 마정석을 주고 ① 천장 바로 앞에서 10번 모집(최고 등급 확정) ② 보통 1번 모집 → 봉인 구슬 색 단계 · 결과 창 막대 · 한 번 더 단추 · 마정석 없을 때 상점 길을 잼
// 같이 찍음: 0.2초마다 → /home/claude/rec/뽑기_이름.jpg (직접 열어 볼 것)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process'); const dir = process.argv[2], name = process.argv[3] || 'a';
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8298);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8298/index.html?test=1'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(800);
  execSync('rm -rf /tmp/뽑기; mkdir -p /tmp/뽑기'); let k = 0; const shot = async () => { await pg.screenshot({ path: `/tmp/뽑기/${String(k++).padStart(2, '0')}.png` }); };
  await pg.evaluate(() => { Snd.mute && Snd.mute(true); UI.closeModal(); st.stage = st.best = 30; st.gems = 3000; st.pity = JB.C.PITY - 1; st.seen.curTip = 1; document.querySelector('#tabs [data-tab="hero"]')?.click(); UI.render(true); });
  await pg.waitForTimeout(400); await pg.evaluate(() => { UI.closeModal(); (UI.heroView = 'pull', UI.render(true), document).querySelector('#tabbody [data-act="pull10"]')?.click(); });
  const S1 = []; for (let i = 0; i < 26; i++) { S1.push(await pg.evaluate(() => { const e = document.getElementById('summonfx'); return e ? e.className + '|' + getComputedStyle(e).getPropertyValue('--c').trim() : ''; })); await shot(); await pg.waitForTimeout(170); if (i === 20) await pg.evaluate(() => { const e = document.getElementById('starfx'); if (e && e.className) e.click(); }); }
  for (let i = 0; i < 30 && !(await pg.evaluate(() => document.getElementById('modal').style.display === 'flex')); i++) { await pg.evaluate(() => { for (const id of ['summonfx', 'starfx']) { const e = document.getElementById(id); if (e && e.classList.contains('tapok')) e.click(); } }); await pg.waitForTimeout(300); }
  await pg.waitForTimeout(1200); await shot();
  const m1 = await pg.evaluate(() => ({ pity: !!document.querySelector('#modal .pity .pb i'), again: document.querySelectorAll('#modal .again [data-act^="pull"]').length, cards: document.querySelectorAll('#modal .res .rc').length, ssr: document.querySelectorAll('#modal .res .rc.rk3').length }));
  // 「한 번 더」 단추가 실제로 다시 모집하는지
  const g0 = await pg.evaluate(() => st.gems); await pg.evaluate(() => document.querySelector('#modal .again [data-act^="pull"]')?.click()); await pg.waitForTimeout(500); await shot(); const g1 = await pg.evaluate(() => st.gems);
  for (let i = 0; i < 40 && !(await pg.evaluate(() => document.getElementById('modal').style.display === 'flex')); i++) { await pg.evaluate(() => { for (const id of ['summonfx', 'starfx']) { const e = document.getElementById(id); if (e && e.className) e.click(); } }); await pg.waitForTimeout(250); }
  // 마정석이 없을 때: 상점 길
  await pg.evaluate(() => { UI.closeModal(); st.gems = JB.C.GACHA_COST; UI.render(true); (UI.heroView = 'pull', UI.render(true), document).querySelector('#tabbody [data-act="pull1"]')?.click(); });
  for (let i = 0; i < 40 && !(await pg.evaluate(() => document.getElementById('modal').style.display === 'flex')); i++) { await pg.evaluate(() => { for (const id of ['summonfx', 'starfx']) { const e = document.getElementById(id); if (e && e.className) e.click(); } }); await pg.waitForTimeout(250); }
  await pg.waitForTimeout(900); await shot();
  const m2 = await pg.evaluate(() => ({ shop: !!document.querySelector('#modal [data-act="shopGo"]') })); await pg.evaluate(() => document.querySelector('#modal [data-act="shopGo"]')?.click()); await pg.waitForTimeout(700); await shot();
  const shopOpen = await pg.evaluate(() => document.getElementById('modal').style.display === 'flex' && /1,200|특가|상점/.test(document.getElementById('modal').innerText));
  const tease = await pg.evaluate(() => window.__tease || []); const cols = [...new Set(S1.filter(x => /tease/.test(x)).map(x => x.split('|')[1]))];
  execSync(`ffmpeg -y -loglevel error -framerate 1 -i /tmp/뽑기/%02d.png -vf "tile=8x${Math.ceil(k / 8)},scale=2400:-1" -frames:v 1 -q:v 4 /home/claude/rec/뽑기_${name}.jpg`);
  console.log(JSON.stringify({ 구슬단계: tease.map(t => `${t.top}:${t.steps}`).join(','), 구슬색: cols, 결과카드: m1.cards, 최고등급카드: m1.ssr, 천장막대: m1.pity, 한번더단추: m1.again, 한번더씀: g0 - g1, 상점길: m2.shop, 상점열림: shopOpen, 장수: k, 오류: errs.slice(0, 3) }));
  await b.close(); srv.close(); })();
