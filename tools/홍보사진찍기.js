// node 홍보사진찍기.js 폴더 → /home/claude/rec/홍보/홍보_N.jpg (폰 360×640 · 3배 = 1080×1920 그대로 · 실제 게임 화면)
// 11-16 19:14 대표님 「4 5번 사진은 딱 봐도 이상하지?」 — 영상에서 뽑은 사진은 위 띠 잘림 · 흐림 · 손가락 · 위아래 검은 빈칸 → 게임을 3배로 직접 찍음
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], PORT = 8261, OUT = '/home/claude/rec/홍보'; fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const shot = async n => { await pg.evaluate(() => { document.querySelectorAll('.finger,#finger,.hand').forEach(e => e.style.display = 'none'); }); await pg.screenshot({ path: `${OUT}/홍보_${n}.jpg`, quality: 92 }); };
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  const setup = (stage, wave) => pg.evaluate(([stage, wave]) => { st.myName = ''; st.stage = st.best = stage; st.wave = wave; st.daysPlayed = 14; st.souls = 5e6; st.bones = 300; st.gems = 500; st.raised = 99; st.up.summon = 12; st.up.magic = 6; for (const h of JB.HEROES.slice(0, 4)) st.heroes[h.id] = { lv: 3, wp: 1 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => JB.HEROES[i] ? JB.HEROES[i].id : null); st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; Object.assign(st.seen, { curTip: 1, fallTip: 1, idleTip: 9 }); window.__noModal = setInterval(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }, 100); UI.closeModal(); UI.tab = 'up'; UI.render(true); JB.startWave(st); }, [stage, wave]);
  // 1) 싸움 한가운데: 3-10 앞 판(28) 맞붙은 장면 — 7초 뒤부터 0.5초마다 찍어 효과 많은 장면 하나
  await setup(28, 1); await pg.waitForTimeout(7000); for (let i = 0; i < 6; i++) { await shot(`싸움${i}`); await pg.waitForTimeout(500); }
  // 2) 보스 대결 등장
  await setup(9, 3); for (let i = 0; i < 300; i++) { await pg.waitForTimeout(50); if (await pg.evaluate(() => document.querySelector('#vsfx.go'))) break; } await pg.waitForTimeout(900); await shot('대결0'); await pg.waitForTimeout(500); await shot('대결1');
  // 3) 보스와 싸움(대결 끝난 뒤)
  await pg.waitForTimeout(4500); for (let i = 0; i < 6; i++) { await shot(`보스${i}`); await pg.waitForTimeout(600); }
  console.log(JSON.stringify({ 오류: errs.slice(0, 3) })); await b.close(); srv.close(); })();
