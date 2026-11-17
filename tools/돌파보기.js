// node 돌파보기.js 폴더 → /home/claude/rec/눈/눈_돌파보기.jpg : 폰에서 「군단 힘 N 돌파!」가 어디 뜨는지(0.3초 · 1초)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process'); const dir = process.argv[2];
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8174);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  await pg.goto('http://localhost:8174/index.html'); await pg.waitForTimeout(3600); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(3000);
  await pg.evaluate(() => { st.stage = st.best = 30; st.souls = 5e6; st.up.summon = 12; for (const h of JB.HEROES.slice(0, 4)) st.heroes[h.id] = { lv: 2, wp: 1 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => JB.HEROES[i] ? JB.HEROES[i].id : null); st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; UI.closeModal(); UI.tab = 'up'; UI.render(true); });
  await pg.waitForTimeout(4000); await pg.evaluate(() => { UI.closeModal(); S.milestone = 0; }); const T = '/tmp/돌파'; execSync(`rm -rf ${T}; mkdir -p ${T}`);
  await pg.waitForTimeout(300); await pg.screenshot({ path: T + '/0.png' }); await pg.waitForTimeout(700); await pg.screenshot({ path: T + '/1.png' });
  const info = await pg.evaluate(() => S.texts.filter(t => t.screen).map(t => t.text + ' y' + Math.round(t.y) + ' 크기' + t.size));
  execSync(`python3 -c "from PIL import Image;a=[Image.open('${T}/%d.png'%i) for i in (0,1)];w,h=a[0].size;c=Image.new('RGB',(w*2,h//2));[c.paste(x.crop((0,0,w,h//2)),(i*w,0)) for i,x in enumerate(a)];c.save('/home/claude/rec/눈/눈_돌파보기.jpg',quality=85)"`);
  console.log('화면 글자', JSON.stringify(info)); await b.close(); srv.close(); })();
