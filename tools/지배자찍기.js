// node 지배자찍기.js 폴더 이름 → /home/claude/rec/지배자_이름.jpg: ① 평소 싸움 지배자 쪽 0.1초 간격 24장(내지르기 방향) ② 보스 대마법 영창 0.15초 간격 24장(화면 전체) — 11-16 08:44 「지배자 뒤돌아 때리고 · 영창 깨지고 · 화면 난리」
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = process.argv[2], nm = process.argv[3] || '확인', PORT = 8205;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { st.stage = st.best = 9; st.wave = 2; st.waveT = 0; st.daysPlayed = 14; st.souls = 5e6; st.up.summon = 10; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; st.login = { n: 1, last: st.day }; S.loginShown = 1; UI.closeModal(); JB.startWave(st); setInterval(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }, 100); });
  await pg.waitForTimeout(9000);   /* 모든 그림이 다 온 뒤(영창 그림은 12초 뒤에 받기 시작) */
  const A = []; for (let i = 0; i < 24; i++) { const f = `/tmp/la_${i}.png`; await pg.screenshot({ path: f, clip: { x: 0, y: 60, width: 220, height: 260 } }); A.push(f); await pg.waitForTimeout(100); }
  execSync(`ffmpeg -loglevel error -y ${A.map(f => `-i ${f}`).join(' ')} -filter_complex "${A.map((_, i) => `[${i}]scale=220:-2[s${i}]`).join(';')};${A.map((_, i) => `[s${i}]`).join('')}xstack=inputs=24:layout=${A.map((_, i) => `${(i % 8) * 220}_${Math.floor(i / 8) * 260}`).join('|')}" /tmp/la.jpg`);
  /* 보스판까지 → 대마법 */
  let cast = false; for (let i = 0; i < 120 && !cast; i++) { await pg.waitForTimeout(250); cast = await pg.evaluate(() => { if (S.phase === 'prompt' || (st.boss && st.boss.phase === 'wait' && JB.canCast(st))) { document.getElementById('cast')?.click(); return true; } return false; }); }
  const info = await pg.evaluate(() => ({ 영창그림: !!(ART.ld8_cast), 판: st.stage, 단계: S.phase }));
  const B = []; for (let i = 0; i < 24; i++) { const f = `/tmp/lc_${i}.png`; await pg.screenshot({ path: f, clip: { x: 0, y: 40, width: 360, height: 400 } }); B.push(f); await pg.waitForTimeout(150); }
  execSync(`ffmpeg -loglevel error -y ${B.map(f => `-i ${f}`).join(' ')} -filter_complex "${B.map((_, i) => `[${i}]scale=240:-2[s${i}]`).join(';')};${B.map((_, i) => `[s${i}]`).join('')}xstack=inputs=24:layout=${B.map((_, i) => `${(i % 8) * 240}_${Math.floor(i / 8) * 267}`).join('|')}" /tmp/lc.jpg`);
  execSync(`cp /tmp/la.jpg /home/claude/rec/지배자_${nm}_공격.jpg; cp /tmp/lc.jpg /home/claude/rec/지배자_${nm}_영창.jpg`);
  console.log(JSON.stringify({ 대마법눌림: cast, ...info, 오류: errs.slice(0, 3) })); await b.close(); srv.close(); })();
