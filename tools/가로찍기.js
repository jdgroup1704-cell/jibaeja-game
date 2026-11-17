// 가로 배치 사진(11-18 · 03:59 「가로 버전 모드」): PC 1366×768 · 태블릿 1180×820 — 처음 · 후반 저장 → /home/claude/rec/새틀/가로.jpg
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = process.argv[2], PORT = 8400 + Math.floor(Math.random() * 20);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
const LATE = fs.readFileSync(path.join(__dirname, '시험자료', '후반저장.txt'), 'utf8');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--mute-audio'] }); const shots = [], errs = [], info = [];
  for (const [w, h] of [[1366, 768], [1180, 820]]) for (const save of ['처음', '후반']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); if (save === '후반') await ctx.addInitScript(sv => { try { localStorage.setItem('jibaeja_b1115102811', sv); } catch (e) {} }, LATE);
    const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(e.message));
    await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(4000);
    for (let i = 0; i < 4; i++) { await pg.evaluate(() => UI.closeModal()); await pg.waitForTimeout(300); }
    info.push(await pg.evaluate(() => { const R = s => { const q = document.querySelector(s).getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height)]; }; return { 창: [innerWidth, innerHeight], 싸움터: R('#stagewrap'), 아래: R('#panel'), 기술: R('#skillbar') }; }));
    const f = `/tmp/가로_${w}_${save}.png`; await pg.screenshot({ path: f }); shots.push(f); await ctx.close(); }
  execSync(`ffmpeg -y -loglevel error ${shots.map(x => `-i ${x}`).join(' ')} -filter_complex "${shots.map((_, i) => `[${i}]scale=960:-1[s${i}]`).join(';')};[s0][s1]hstack[a];[s2][s3]hstack[b];[a][b]vstack" -q:v 4 /home/claude/rec/새틀/가로.jpg`);
  console.log(JSON.stringify({ info, 오류: errs.slice(0, 3) })); await b.close(); srv.close(); })();
