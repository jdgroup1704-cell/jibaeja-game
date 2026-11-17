// 「새로 열림」 알림 상자가 판 표시(큰 판 글자 · 보스까지 줄) · 위 단추(전리품 · 빠른 보상 · 배속 · 메뉴)와 겹치는지 잼 — 지적장부 C7(11-16 00:05 사진 · 11-17 21:4x 눈_고비경례 다시 봄)
// node 알림겹침재기.js 폴더 [높이] → JSON {겹침:[...], 상자:[...], 오류}
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], H = +(process.argv[3] || 593), PORT = 8291;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--mute-audio'] }); const pg = await (await b.newContext({ viewport: { width: 360, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(2500);
  await pg.evaluate(() => { st.stage = st.best = 30; st.daysPlayed = 14; st.souls = 5e6; st.gems = 500; st.raised = 99; st.up.summon = 12; for (const h of JB.HEROES.slice(0, 4)) st.heroes[h.id] = { lv: 2, wp: 1 }; JB.squadFit(st); UI.closeModal(); UI.render(true); }); await pg.waitForTimeout(800); await pg.evaluate(() => UI.closeModal());
  await pg.waitForTimeout(2500);
  const texts = [[ '새로 열림', '영웅' ], [ '새로 열림', '지배자 마법 「영혼 사슬」 · 저절로 써요' ], [ '새로 열림', '지하 묘지(유물) · 깊이 내려갈수록 유물 가루' ], [ '소환수가 쓰러졌어요', '맞으면 쓰러지고 3초 뒤 스스로 일어나요 · 초록 「부활」로 바로' ]];
  const out = { 겹침: [], 상자: [] };
  for (const [t, bdy] of texts) {
    await pg.evaluate(([t, bdy]) => { document.getElementById('toast').innerHTML = ''; S.texts = S.texts.filter(x => !x.screen); UI.toast(t, bdy); }, [t, bdy]); await pg.waitForTimeout(700); const r = await pg.evaluate(([t, bdy]) => { const R = e => { const q = e.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)]; };
      const tt = [...document.querySelectorAll('#toast .toast')].filter(e => getComputedStyle(e).display !== 'none').pop(); if (!tt) return null; const a = R(tt);
      const others = []; const sb = document.getElementById('stbig'); if (sb && getComputedStyle(sb).display !== 'none') { for (const c of sb.children) others.push(['판표시:' + c.textContent.trim().slice(0, 8), R(c)]); }
      for (const e of document.querySelectorAll('#tools > *, #tools button, #tools .tb')) if (getComputedStyle(e).display !== 'none' && e.offsetWidth) others.push(["단추:" + (e.id || e.className || "").toString().slice(0, 10) + ":" + e.textContent.trim().slice(0, 6) + ":" + R(e).join(","), R(e)]);
      const hits = others.filter(([, o]) => o[0] < a[2] - 1 && o[2] > a[0] + 1 && o[1] < a[3] - 1 && o[3] > a[1] + 1).map(([n, o]) => n + ' ' + Math.min(a[3], o[3]) + '-' + Math.max(a[1], o[1]));
      return { 상자: a, 줄: Math.round((a[3] - a[1]) / parseFloat(getComputedStyle(tt).lineHeight || 16)), hits }; }, [t, bdy]);
    if (r) { out.상자.push(r.상자); out.겹침.push(...r.hits.map(h => bdy.slice(0, 8) + ' × ' + h)); }
    await pg.waitForTimeout(300);
  }
  await pg.screenshot({ path: '/tmp/알림겹침.png' });
  out.오류 = errs.slice(0, 3); console.log(JSON.stringify(out)); await b.close(); srv.close(); })();
