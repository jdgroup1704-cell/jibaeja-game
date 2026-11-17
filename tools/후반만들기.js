// 대표님 같은 후반 저장 만들기(11-18 03:1x 대표님 사진: 2막 2-10 · 군단 1000 · 기술 6개 · 영웅 ★6 · 망자 거인) — 지금까지 검사는 3-10 · 군단 160뿐이라 효과가 쌓인 진짜 화면을 못 봤음
// node 후반만들기.js 폴더 [분=6] → tools/시험자료/후반저장.txt (그 저장 글자 · 다른 도구가 localStorage에 넣고 켬)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], mins = +(process.argv[3] || 6), PORT = 8321;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--mute-audio'] }); const pg = await (await b.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true })).newPage();
  await pg.goto(`http://localhost:${PORT}/index.html?bot=1&speed=20&seed=11`); await pg.waitForTimeout(3000);
  const t0 = Date.now(); let last = {};
  while (Date.now() - t0 < mins * 60000) { await pg.waitForTimeout(15000); last = await pg.evaluate(() => ({ 판: st.stage, 최고: st.best, 각성: st.awakens, 군단: JB.armySize(st), 영웅: Object.keys(st.heroes).length })); console.error(Math.round((Date.now() - t0) / 1000) + '초', JSON.stringify(last)); if (last.각성 >= 2 && last.군단 >= 900 && last.최고 >= 18) break; }
  const sv = await pg.evaluate(() => { st.raised = 99; return JB.serialize(st); });
  fs.mkdirSync(path.join(__dirname, '시험자료'), { recursive: true }); fs.writeFileSync(path.join(__dirname, '시험자료', '후반저장.txt'), sv);
  console.log(JSON.stringify(Object.assign({ 저장: sv.length }, last))); await b.close(); srv.close(); })();
