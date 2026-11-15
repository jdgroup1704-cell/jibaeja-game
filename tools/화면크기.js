// node 화면크기.js 폴더 → /home/claude/rec/화면크기.jpg (작은 폰 360×640 · 대표님 폰 360×593 · 큰 폰 412×891(갤럭시 S26 울트라) · PC 1280×800)
// 순서 #3(대표님 「너무 확대 · 판이 안 보인다」「화면 너무 좁아 재미없다」「작은 폰 큰 폰 · 웹으로 보여 줘」): 화면마다 전장이 차지하는 높이 비율 · 화면 밖으로 잘린 유닛 수 · 유닛 키(픽셀)를 잼
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process'); const dir = process.argv[2];
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8179);
const VPS = [['작은폰', 360, 640, 2, true], ['대표님폰', 360, 593, 2, true], ['큰폰', 412, 891, 2.6, true], ['PC', 1280, 800, 1, false]];
(async () => { const T = '/tmp/화면크기'; execSync(`rm -rf ${T}; mkdir -p ${T}`); const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const out = [];
  for (const [nm, w, h, dpr, mob] of VPS) {
    const pg = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mob, hasTouch: mob })).newPage();
    await pg.goto('http://localhost:8179/index.html'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
    await pg.evaluate(() => { st.stage = st.best = 30; st.souls = 5e6; st.up.summon = 12; for (const hh of JB.HEROES.slice(0, 4)) st.heroes[hh.id] = { lv: 2, wp: 1 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => JB.HEROES[i] ? JB.HEROES[i].id : null); st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; Object.assign(st.seen, { curTip: 1, fallTip: 1, idleTip: 9 }); UI.closeModal(); UI.tab = 'up'; UI.render(true); });
    await pg.waitForTimeout(7000); await pg.evaluate(() => UI.closeModal());
    const m = await pg.evaluate(() => { const cv = document.getElementById('battle'), cr = cv.getBoundingClientRect(), dpr = view.dpr || 1, sx = x => cr.left + (x * view.s + view.ox) / dpr, sy = y => cr.top + (y * view.s + view.oy) / dpr; const us = [...S.army.filter(u => !u.fly).map(u => ['병사', u.x, u.y]), ...S.foes.filter(f => !f.dead).map(f => ['적', f.x, f.y]), ...HF.list.map(hh => ['영웅', hh.x, hh.y])]; let cut = 0; const ex = []; for (const [k, x, y] of us) { const X = sx(x), Y = sy(y); if (X < cr.left + 8 || X > cr.right - 8 || Y > cr.bottom + 2 || Y - 150 * view.s / dpr < cr.top - 2) { cut++; ex.push(k); } } return { 전장높이비: Math.round(cr.height / innerHeight * 100), 전장폭: Math.round(cr.width), 영웅키px: Math.round(190 * view.s / dpr), 병사키px: Math.round(150 * view.s / dpr), 잘린유닛: cut, 잘린예: ex.slice(0, 4), 유닛수: us.length }; });
    await pg.screenshot({ path: `${T}/${nm}.png` }); out.push({ 화면: `${nm} ${w}×${h}`, ...m }); await pg.close(); }
  await b.close(); srv.close();
  execSync(`python3 -c "
from PIL import Image
ns=['작은폰','대표님폰','큰폰','PC'];a=[Image.open('${T}/'+n+'.png').convert('RGB') for n in ns];H=900
a=[x.resize((int(x.width*H/x.height),H)) for x in a];W=sum(x.width for x in a)+30;c=Image.new('RGB',(W,H),(20,10,30));X=0
for x in a: c.paste(x,(X,0));X+=x.width+10
c.save('/home/claude/rec/화면크기.jpg',quality=85)"`);
  for (const o of out) console.log(JSON.stringify(o)); })();
