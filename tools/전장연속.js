// 전장연속: 자리표시와 같은 판(STG_N · HERO_N)을 표시 없이 1초 간격 4장 찍어 겹침 · 효과 범벅을 눈으로 봄 → /home/claude/rec/눈/전장_이름.jpg
// (아래는 자리표시에서 가져옴)
// 군단 · 영웅 · 적의 진짜 자리(x,y)에 십자와 이름을 그려서 찍음 — 그림이 자기 자리에 그려지는지 눈으로 확인
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'); const dir = process.argv[2], out = process.argv[3] || '/tmp/자리표시.png';
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : p.endsWith('.css') ? 'text/css' : 'image/webp' }); r.end(d); }); }).listen(8187);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2 })).newPage();
  await pg.goto('http://localhost:8187/index.html?test=1'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  await pg.evaluate(([SN, HN]) => { st.stage = st.best = SN; st.raised = 99; st.up.summon = 12; st.daysPlayed = 14; for (const h of JB.HEROES.slice(0, HN)) st.heroes[h.id] = { lv: 2, wp: 1 }; JB.squadFit(st); if (HN) st.squad = st.squad.map((_, i) => JB.HEROES[i] ? JB.HEROES[i].id : null); st.login = { n: 1, last: st.day }; S.loginShown = 1; st.seen.curTip = 1; st.seen.firstHero = 1; st.seen.fallTip = 1; st.seen.idleTip = 9; UI.closeModal(); UI.render(true);
  }, [+(process.env.STG_N || 8), +(process.env.HERO_N || 0)]);
  await pg.waitForTimeout(6000); await pg.evaluate(() => UI.closeModal());
  const { execSync } = require('child_process'); const T = '/tmp/전장연속'; execSync(`rm -rf ${T}; mkdir -p ${T}`); for (let i = 0; i < 4; i++) { await pg.screenshot({ path: `${T}/${i}.png`, clip: { x: 0, y: 40, width: 360, height: 210 } }); await pg.waitForTimeout(1000); }
  const out = `/home/claude/rec/눈/전장_${process.argv[3] || 'now'}.jpg`; execSync(`ffmpeg -y -loglevel error ${[0, 1, 2, 3].map(i => `-i ${T}/${i}.png`).join(' ')} -filter_complex "xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0" -q:v 3 "${out}"`); console.log('저장', out); await b.close(); srv.close(); })();
