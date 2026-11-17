// node 거인찍기.js 폴더 이름 → /home/claude/rec/거인_이름.jpg : 망자 거인(thrall.js) ① 일어나는 연출 0.3초마다 12장 ② 싸움 중 솟아 내려찍기 0.2초마다 8장 (순서 #11 처음 3분 「와」)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = process.argv[2], nm = process.argv[3] || '확인', PORT = 8196;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { st.stage = st.best = 12; st.daysPlayed = 14; st.up.summon = 10; const H = JB.HEROES.slice(0, 4).map(h => h.id); for (const id of H) st.heroes[id] = { lv: 2, wp: 1 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => H[i] || null); st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; UI.closeModal(); });
  await pg.waitForTimeout(4000);
  await pg.evaluate(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); st.thralls = 1; TH.cd = 99; TH.start(760, 600); });
  const fr = []; for (let k = 0; k < 12; k++) { await pg.waitForTimeout(300); await pg.evaluate(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }); const f = `/tmp/gt_${k}.png`; await pg.screenshot({ path: f, clip: { x: 0, y: 30, width: 360, height: 330 } }); fr.push(f); }
  await pg.waitForTimeout(1500); await pg.evaluate(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); TH.cd = 0; });
  for (let k = 0; k < 8; k++) { await pg.waitForTimeout(200); const f = `/tmp/gt_${12 + k}.png`; await pg.screenshot({ path: f, clip: { x: 0, y: 30, width: 360, height: 330 } }); fr.push(f); }
  const N = fr.length, cols = 5;
  execSync(`ffmpeg -y -loglevel error ${fr.map(f => '-i ' + f).join(' ')} -filter_complex "${fr.map((_, i) => `[${i}]`).join('')}xstack=inputs=${N}:layout=${fr.map((_, i) => `${(i % cols) ? Array.from({ length: i % cols }, () => 'w0').join('+') : '0'}_${Math.floor(i / cols) ? Array.from({ length: Math.floor(i / cols) }, () => 'h0').join('+') : '0'}`).join('|')}" -q:v 3 /home/claude/rec/거인_${nm}.jpg`);
  console.log('오류', errs.length, errs.slice(0, 3).join(' | ')); await b.close(); srv.close(); })();
