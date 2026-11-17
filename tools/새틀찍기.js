// 새 틀 사진(11-18 03:3x): 폰 세 크기 × 저장 두 가지(처음 · 후반) × 장면(싸움 · 강화 · 군단 · 영웅 · 각성 · 모험 · 임무 · 상점 창) → /home/claude/rec/새틀/
// node 새틀찍기.js 폴더 [이름] [장면들(쉼표)] [높이들(쉼표)]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = process.argv[2], name = process.argv[3] || 'x', scenes = (process.argv[4] || '싸움,강화,군단,영웅,각성,임무,상점').split(','), hs = (process.argv[5] || '593,780').split(',').map(Number), PORT = 8330 + Math.floor(Math.random() * 20);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
const LATE = fs.readFileSync(path.join(__dirname, '시험자료', '후반저장.txt'), 'utf8');
const OUT = '/home/claude/rec/새틀'; execSync(`mkdir -p ${OUT}`);
const TAB = { 강화: 'up', 군단: 'grave', 영웅: 'hero', 각성: 'awaken', 모험: 'crypt', 임무: 'mission' };
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--mute-audio'] }); const errs = []; const shots = [];
  for (const h of hs) for (const save of ['처음', '후반']) {
    const ctx = await b.newContext({ viewport: { width: 360, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    if (save === '후반') await ctx.addInitScript(sv => { try { localStorage.setItem('jibaeja_b1115102811', sv); } catch (e) {} }, LATE);
    const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(save + h + ': ' + e.message));
    await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(save === '처음' ? 6000 : 3500);
    for (let i = 0; i < 4; i++) { await pg.evaluate(() => { try { UI.closeModal(); } catch (e) {} }); await pg.waitForTimeout(300); }
    for (const sc of scenes) {
      if (TAB[sc]) await pg.evaluate(k => { UI.closeModal(); if (UI.tabOpen(k)) { UI.tab = k; UI.render(true); } }, TAB[sc]);
      else if (sc === '상점') await pg.evaluate(() => { UI.closeModal(); EX.shopOpen && EX.shopOpen(); });
      else await pg.evaluate(() => { UI.closeModal(); UI.tab = 'up'; UI.render(true); });
      await pg.waitForTimeout(900); const f = `/tmp/새틀_${h}_${save}_${sc}.png`; await pg.screenshot({ path: f }); shots.push(f);
    }
    await ctx.close();
  }
  const n = scenes.length, rows = hs.length * 2, out = `${OUT}/새틀_${name}.jpg`;
  execSync(`ffmpeg -y -loglevel error ${shots.map(f => `-i ${f}`).join(' ')} -filter_complex "${shots.map((_, i) => `[${i}]scale=360:-1[s${i}]`).join(';')};${Array.from({ length: rows }, (_, r) => `${Array.from({ length: n }, (_, c) => `[s${r * n + c}]`).join('')}hstack=${n}[r${r}]`).join(';')};${Array.from({ length: rows }, (_, r) => `[r${r}]`).join('')}${rows > 1 ? `vstack=${rows}` : 'null'}" -q:v 4 "${out}"`);
  console.log('찍음', out, '· 오류', errs.length, errs.slice(0, 4).join(' | ')); await b.close(); srv.close(); })();
