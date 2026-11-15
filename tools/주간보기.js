// 주간 활동 시험: 일일 임무를 받으면 +1 · 5에 첫 상자 · 다음 주(월요일)엔 0부터 · 임무 탭 찍기 → node 주간보기.js 폴더
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'); const dir = process.argv[2];
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8167);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2 })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8167/index.html?test=1'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  console.log(await pg.evaluate(() => { st.stage = st.best = 30; st.daysPlayed = 3; st.login = { n: 1, last: st.day }; st.missions = JB.MISSIONS.map(m => m.need); st.missionDone = JB.MISSIONS.map(() => false);
    for (let i = 0; i < 5; i++) JB.claimMission(st, i); const w = JB.weekOf(st); const g0 = st.gems; const r = JB.weekReady(st); const g = JB.weekClaim(st, 0);
    const before = w.id; const d = st.day; st.day = d + 7; const w2 = JB.weekOf(st); st.day = d; return `주 ${before} · 활동 ${w.pts} · 받을 수 ${r.join(',')} · 첫 상자 마정석 ${g0}→${st.gems} · 다음 주 활동 ${w2.pts}`; }));
  await pg.evaluate(() => { st.week = null; JB.weekOf(st).pts = 12; JB.weekOf(st).got = [0]; UI.closeModal(); UI.tab = 'mission'; UI.render(true); document.getElementById('tabbody').scrollTop = 9999; }); await pg.waitForTimeout(600);
  await pg.screenshot({ path: '/home/claude/rec/주간활동.png' }); console.log('탭', await pg.evaluate(() => UI.tab), '· 오류', errs.length, errs.slice(0, 2).join(' | ')); await b.close(); srv.close(); })();
