// 삼성 인터넷 다크 모드 대비 잼(11-18 15:1x 대표님 폰 사진: 금 단추 → 갈색 · 흰 빛 → 검은 점 · 원인 = 삼성 인터넷이 다크 모드면 웹 색을 강제로 바꿈 · 그림은 안 바꿈)
// node 다크재기.js 폴더 → 강제 다크(크롬 같은 방식) + 폰 다크 모드로 후반 저장을 열어: 보이는 단추 · 탭이 그림으로 바뀌었나(data-kc) · 시험 금 상자가 금색으로 남나 · 영혼 알갱이(.sorb)가 그림인가 · 오류 0
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], PORT = 8570 + Math.floor(Math.random() * 20);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json', '.woff': 'font/woff' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
const LATE = fs.readFileSync(path.join(__dirname, '시험자료', '후반저장.txt'), 'utf8');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--mute-audio', '--blink-settings=forceDarkModeEnabled=true'] });
  const ctx = await b.newContext({ viewport: { width: 412, height: 893 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  await ctx.addInitScript(sv => { try { localStorage.setItem('jibaeja_b1115102811', sv); } catch (e) {} }, LATE);
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3500); for (let i = 0; i < 5; i++) { await pg.evaluate(() => UI.closeModal()); await pg.waitForTimeout(250); }
  const R = {};
  for (const t of ['up', 'grave', 'hero']) { await pg.evaluate(t => { UI.closeModal(); UI.tab = t; UI.render(true); }, t); await pg.waitForTimeout(700);
    R[t] = await pg.evaluate(() => { const vis = e => { const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(e).visibility !== 'hidden'; };
      const bs = [...document.querySelectorAll('#app .btn, #tabs button.on, #slots button')].filter(vis).filter(e => /gradient|url\("?data/.test(e.style.backgroundImage + getComputedStyle(e).backgroundImage));
      return { 단추: bs.length, 그림: bs.filter(e => e.dataset.kc).length }; }); }
  await pg.evaluate(() => { const d = document.createElement('div'); d.id = 'dk'; d.style.cssText = 'position:fixed;left:0;top:0;width:100px;height:60px;z-index:99999;background:linear-gradient(#ffe27a,#d9a21a)'; document.body.appendChild(d); if (typeof soulOrbs === 'function') soulOrbs(600, 500, 3); });
  await pg.waitForTimeout(200); await pg.screenshot({ path: '/tmp/다크재기.png' });
  const px = await pg.evaluate(() => ({ 알갱이: [...document.querySelectorAll('.sorb')].length, 알갱이그림: [...document.querySelectorAll('.sorb')].filter(e => e.dataset.kc).length, keepc: document.documentElement.classList.contains('keepc') }));
  const { execSync } = require('child_process'); const rgb = execSync(`python3 -c "from PIL import Image; print(Image.open('/tmp/다크재기.png').convert('RGB').getpixel((50,30)))"`).toString().trim();
  console.log(JSON.stringify({ 탭: R, ...px, 시험상자색: rgb, 오류: errs.slice(0, 3) })); await b.close(); srv.close(); })();
