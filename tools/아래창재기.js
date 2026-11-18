// 아래 창 잼(11-18 10:43 대표님 사진 셋 「상태창 · 업그레이드 창을 스크롤로 내리는데 어떻게 이렇게 불편 · 마지막 기회 · 최적으로」)
// node 아래창재기.js 폴더 [높이=628] [사진이름] → 탭(과 작은 탭)마다: 창 높이 % · 싸움터 % · 내용 보이는 비율(보이는 높이 ÷ 전체) · 스크롤 필요 px
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], H = +(process.argv[3] || 628), SHOT = process.argv[4] || '', PORT = 8400 + Math.floor(Math.random() * 50);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
const LATE = fs.readFileSync(path.join(__dirname, '시험자료', '후반저장.txt'), 'utf8');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--mute-audio'] }); const ctx = await b.newContext({ viewport: { width: 360, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(sv => { try { localStorage.setItem('jibaeja_b1115102811', sv); } catch (e) {} }, LATE);
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3500); for (let i = 0; i < 5; i++) { await pg.evaluate(() => UI.closeModal()); await pg.waitForTimeout(250); }
  const views = [['up'], ['grave', 'graveView', 'raise'], ['grave', 'graveView', 'gear'], ['grave', 'graveView', 'grow'], ['hero', 'heroView', 'squad'], ['hero', 'heroView', 'pull'], ['hero', 'heroView', 'list'], ['hero', 'heroView', 'bond'], ['awaken', 'awakenView', 'awaken'], ['awaken', 'awakenView', 'spell'], ['crypt'], ['mission']];
  const out = []; let shots = [];
  for (const [t, vk, vv] of views) {
    await pg.evaluate(([t, vk, vv]) => { UI.closeModal(); UI.tab = t; if (vk) UI[vk] = vv; UI.render(true); }, [t, vk, vv]); await pg.waitForTimeout(700); await pg.evaluate(() => UI.closeModal()); await pg.waitForTimeout(150);
    const r = await pg.evaluate(() => { const g = id => document.getElementById(id).getBoundingClientRect(), app = g('app'), tb = document.getElementById('tabbody');
      return { 창: Math.round((g('panel').height + g('skillbar').height) / app.height * 100), 싸움터: Math.round(g('stagewrap').height / app.height * 100), 보임: Math.round(tb.clientHeight / tb.scrollHeight * 100), 스크롤px: tb.scrollHeight - tb.clientHeight, 내용높이: tb.clientHeight, 큰그림: Math.max(0, ...[...tb.querySelectorAll('img')].map(i => Math.round(i.getBoundingClientRect().height))) }; });   /* 11-18 옛 <style> 규칙이 빠져 장비 그림이 330px로 깨졌던 것 — 아래 창 그림은 110px 아래여야(옛 판 장비 160 · 진형 94) */
    out.push(Object.assign({ 탭: t + (vv ? '/' + vv : '') }, r));
    if (SHOT) { const f = `/tmp/아래창_${SHOT}_${t}${vv ? '_' + vv : ''}.png`; await pg.evaluate(() => UI.closeModal()); await pg.waitForTimeout(100); await pg.screenshot({ path: f }); shots.push(f); }
  }
  console.log(JSON.stringify({ 높이: H, 탭: out, 오류: errs })); await b.close(); srv.close(); })();
