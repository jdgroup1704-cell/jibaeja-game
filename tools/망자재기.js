// node 망자재기.js 폴더 [이름] → JSON + /home/claude/rec/망자_이름.jpg — 관문 ㉖ 순서 #15 「쓰러진 적이 그 자리에서 일어나 우리 편」
// 3-1부터 군단으로 40초 싸움: 일어난 망자 수 · 화면에 동시 최대 · 새 그림(foev)으로 그려진 횟수 vs 옛 그림(초록 기사) 횟수 · 일어난 망자가 공격 장면으로 그려진 횟수 · 22초 뒤 사라졌나
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = process.argv[2], nm = process.argv[3] || '확인', PORT = 8208;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { st.stage = st.best = 24; st.wave = 0; st.waveT = 0; st.daysPlayed = 14; st.souls = 5e6; for (const k in st.up) st.up[k] = Math.max(st.up[k], 25); st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; UI.closeModal(); JB.startWave(st); setInterval(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }, 100);
    window.__R = { newArt: 0, oldArt: 0, atk: 0, maxOn: 0 }; const vd = window.vsDraw; window.vsDraw = function (n, an, fi, h, filt) { if (/^foev/.test(n) && filt && /hue-rotate\(235deg\)/.test(filt) && h < 200) { __R.newArt++; if (an === 'attack') __R.atk++; } return vd.apply(this, arguments); };
    const ti = window.tinted; if (ti) window.tinted = function (im, key) { if (/^rise/.test(key)) __R.oldArt++; return ti.apply(this, arguments); };
    setInterval(() => { const n = (S.riseGhosts || []).length; if (n > __R.maxOn) __R.maxOn = n; }, 100); });
  const shots = []; for (let i = 0; i < 40; i++) { await pg.waitForTimeout(1000); if ([12, 20, 28].includes(i)) { const f = `/tmp/mz_${i}.png`; await pg.screenshot({ path: f, clip: { x: 0, y: 40, width: 360, height: 330 } }); shots.push(f); } }
  const R = await pg.evaluate(() => ({ 쓰러뜨림: S.riseN || 0, 일어남: S.risenTot || 0, 동시최대: __R.maxOn, 새그림: __R.newArt, 옛그림: __R.oldArt, 공격장면: __R.atk, 지금: (S.riseGhosts || []).length, 오래된것: (S.riseGhosts || []).filter(r => r.t > 2).length }));
  execSync(`ffmpeg -loglevel error -y ${shots.map(f => `-i ${f}`).join(' ')} -filter_complex hstack=inputs=${shots.length} /home/claude/rec/망자_${nm}.jpg`);
  console.log(JSON.stringify({ ...R, 오류: errs.slice(0, 3) })); await b.close(); srv.close(); })();
