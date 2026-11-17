// 새 틀 창(모달) 사진(11-18): 후반 저장 · 360×640 — 설정 · 상점 · 우편 · 출석 · 빠른 보상 · 자리 비움 상자 · 영웅 모집 결과 · 영웅 하나 · 각성 · 귀빈 · 군단 힘 · 확률 → /home/claude/rec/새틀/창_이름.jpg
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = process.argv[2], name = process.argv[3] || 'x', H = +(process.argv[4] || 640), PORT = 8380 + Math.floor(Math.random() * 20);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
const LATE = fs.readFileSync(path.join(__dirname, '시험자료', '후반저장.txt'), 'utf8');
const LIST = [['설정', () => EX.act('settings')], ['상점', () => EX.act('shop')], ['우편', () => EX.act('mailOpen')], ['출석', () => EX.act('loginOpen')], ['빠른보상', () => EX.act('quick')], ['보물상자', () => EX.act('lchest')], ['모집', () => { UI.tab = 'hero'; UI.heroView = 'pull'; UI.render(true); const b = document.querySelector('[data-act="pull10"]:not([disabled])') || document.querySelector('[data-act="pull1"]:not([disabled])'); b && b.click(); }], ['영웅하나', () => { UI.tab = 'hero'; UI.heroView = 'hero'; UI.render(true); const b = document.querySelector('#tabbody [data-act="heroOpen"], #tabbody .hcard, #tabbody [data-act="hero"]'); b && b.click(); }], ['군단힘', () => UI.act('power')], ['확률', () => UI.act('odds')], ['귀빈', () => { const v = document.querySelector('#hud [data-vip]'); v && v.click(); }], ['재화', () => UI.curOpen && UI.curOpen('gems')]];
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--mute-audio'] }); const ctx = await b.newContext({ viewport: { width: 360, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(sv => { try { localStorage.setItem('jibaeja_b1115102811', sv); } catch (e) {} }, LATE);
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3500); const shots = [], miss = [];
  for (const [nm, fn] of LIST) { for (let i = 0; i < 3; i++) { await pg.evaluate(() => UI.closeModal()); await pg.waitForTimeout(200); }
    await pg.evaluate(`(${fn.toString()})()`).catch(e => errs.push(nm + ' ' + e.message)); await pg.waitForTimeout(1300);
    const open = await pg.evaluate(() => document.getElementById('modal').style.display === 'flex' || !!document.querySelector('#summonfx.on, #starfx.on, .sf-bg'));
    if (!open) { miss.push(nm); continue; } const f = `/tmp/창_${nm}.png`; await pg.screenshot({ path: f }); shots.push(f); }
  const n = shots.length, cols = 6, rows = Math.ceil(n / cols), pad = rows * cols - n; const all = shots.concat(Array(pad).fill(shots[0]));
  execSync(`ffmpeg -y -loglevel error ${all.map(x => `-i ${x}`).join(' ')} -filter_complex "${all.map((_, i) => `[${i}]scale=360:-1[s${i}]`).join(';')};${Array.from({ length: rows }, (_, r) => `${Array.from({ length: cols }, (_, c) => `[s${r * cols + c}]`).join('')}hstack=${cols}[r${r}]`).join(';')};${Array.from({ length: rows }, (_, r) => `[r${r}]`).join('')}${rows > 1 ? `vstack=${rows}` : 'null'}" -q:v 4 /home/claude/rec/새틀/창_${name}.jpg`);
  console.log(JSON.stringify({ 찍음: shots.map(x => path.basename(x)), 못엶: miss, 오류: errs.slice(0, 5) })); await b.close(); srv.close(); })();
