// 효과재기: 30판 전장 8초 동안 0.25초마다 효과 종류 · 파티클 수를 적고 그 순간을 찍음(/tmp/효과재기/번호.png) — 어느 효과가 가운데를 덮는지 찾기
// (전장연속에서 가져옴) 자리표시와 같은 판(STG_N · HERO_N)을 표시 없이 1초 간격 4장 찍어 겹침 · 효과 범벅을 눈으로 봄 → /home/claude/rec/눈/전장_이름.jpg
// (아래는 자리표시에서 가져옴)
// 군단 · 영웅 · 적의 진짜 자리(x,y)에 십자와 이름을 그려서 찍음 — 그림이 자기 자리에 그려지는지 눈으로 확인
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'); const dir = process.argv[2], out = process.argv[3] || '/tmp/자리표시.png';
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : p.endsWith('.css') ? 'text/css' : 'image/webp' }); r.end(d); }); }).listen(8188);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2 })).newPage();
  await pg.goto('http://localhost:8188/index.html?test=1'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  await pg.evaluate(([SN, HN]) => { st.stage = st.best = SN; st.raised = 99; st.up.summon = 12; st.daysPlayed = 14; for (const h of JB.HEROES.slice(0, HN)) st.heroes[h.id] = { lv: 2, wp: 1 }; JB.squadFit(st); if (HN) st.squad = st.squad.map((_, i) => JB.HEROES[i] ? JB.HEROES[i].id : null); st.login = { n: 1, last: st.day }; S.loginShown = 1; st.seen.curTip = 1; st.seen.firstHero = 1; st.seen.fallTip = 1; st.seen.idleTip = 9; UI.closeModal(); UI.render(true);
  }, [+(process.env.STG_N || 8), +(process.env.HERO_N || 0)]);
  await pg.waitForTimeout(6000); await pg.evaluate(() => UI.closeModal());
  const { execSync } = require('child_process'); const T = '/tmp/효과재기'; execSync(`rm -rf ${T}; mkdir -p ${T}`);
  for (let i = 0; i < 40; i++) { const r = await pg.evaluate(() => { const c = {}; for (const f of HF.fx) c[f.kind] = (c[f.kind] || 0) + 1; for (const p of (S.fx || [])) c['S.' + (p.kind || p.t || '?')] = (c['S.' + (p.kind || p.t || '?')] || 0) + 1; const arr = Object.keys(S).filter(k => Array.isArray(S[k]) && S[k].length && !['parts', 'texts', 'army', 'foes', 'fallen', 'corpses'].includes(k)).map(k => k + S[k].length); return JSON.stringify(c) + ' 파티클' + S.parts.length + ' 글자' + S.texts.length + ' 배열 ' + arr.join(','); }); console.log(i, r); await pg.screenshot({ path: `${T}/${i}.png`, clip: { x: 0, y: 40, width: 360, height: 210 } }); await pg.waitForTimeout(200); }
  await b.close(); srv.close(); })();
