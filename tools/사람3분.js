// 사람 흉내 처음 3분(11-17 23:5x 처음 3분 비교 · 「봇이 통과해도 처음 하는 사람이 모르면 실패」): 새 저장 · 1배속 · 사람처럼 손가락이 짚는 것만 누름(0.9초마다) · 창은 2초 읽고 닫음
// node 사람3분.js 폴더 [초=180] [높이=593] → 초마다 무엇을 눌렀나 · 무엇이 새로 보였나(알림 · 보상 띠 · 군단 공격 ▲ · 무덤 유품) · 누를 게 없던 가장 긴 틈 · 3분 끝 판 · 무덤 연 수
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], SEC = +(process.argv[3] || 180), H = +(process.argv[4] || 593), PORT = 8309;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--mute-audio'] }); const pg = await (await b.newContext({ viewport: { width: 360, height: H }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); if (process.env.DBG) await pg.evaluate(() => { window.__dbg = 1; }); await pg.waitForTimeout(3000);
  await pg.evaluate(() => { window.__new = []; const add = (k, t) => __new.push([Math.round(performance.now() / 1000), k, (t || '').slice(0, 30)]);
    const mo = new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) { if (n.nodeType !== 1) continue; if (n.classList.contains('toast')) add('알림', n.textContent); if (n.id === 'tombfx') add('유품', n.textContent); } });
    mo.observe(document.body, { childList: true, subtree: true });
    let pw = ''; setInterval(() => { const e = document.getElementById('pwrup'); if (e && e.classList.contains('on') && e.textContent !== pw) { pw = e.textContent; add('힘▲', pw); } const rc = document.getElementById('rcard'); if (rc && rc.offsetWidth && rc.textContent !== window.__rc) { window.__rc = rc.textContent; add('보상', rc.textContent); } }, 250); });
  const T0 = Date.now(); const taps = [], whyL = []; let modalSince = 0, idle = 0, idleMax = [0, 0], cur = 0;
  await pg.evaluate(() => document.getElementById('opening')?.click()); taps.push([0, '첫 화면']);
  while (Date.now() - T0 < SEC * 1000) {
    await pg.waitForTimeout(900); const t = Math.round((Date.now() - T0) / 1000);
    const r = await pg.evaluate(() => {
      if (document.getElementById('modal').style.display === 'flex') return { modal: (document.querySelector('#modal h3') || {}).textContent || '창' };
      const op = document.getElementById('opening'); if (op && op.offsetWidth) { op.click(); return { tap: '첫 화면' }; }
      const f = document.getElementById('finger'); if (f && f.classList.contains('on')) { const x = parseFloat(f.style.left), y = parseFloat(f.style.top); const e = document.elementsFromPoint(x, y).find(z => !z.closest('#finger')); if (e) { const bt = e.closest('button, .btn, .ucard, [data-act], [data-tab], [data-sk], #raiseBtn, #cast') || e; bt.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); bt.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); bt.click(); return { tap: (bt.textContent || bt.id || '').trim().replace(/\s+/g, ' ').slice(0, 18) + (window.__dbg ? ' @' + UI.tab : '') }; } }
      if (S.phase === 'prompt') { const c = document.getElementById('cast'); c && c.click(); return { tap: '대마법' }; }
      return { none: 1, stage: st.stage, why: [document.getElementById('finger') ? document.getElementById('finger').className : '-', (st.tombQ || []).length, !!document.querySelector('#slots .tomb'), S.phase, st.raised, UI.tab, [...document.querySelectorAll('.hint')].map(h => h.tagName + '.' + h.className.replace(/ /g, '.') + ':' + (h.textContent || '').trim().slice(0, 8)).join(','), [...document.querySelectorAll('#tabbody [data-act="claim"]')].map(c => c.disabled ? 0 : 1).join('')].join('/') };
    });
    if (r.modal) { if (!modalSince) modalSince = t; if (t - modalSince >= 2) { const got = await pg.evaluate(() => { const c = [...document.querySelectorAll('#modal button, #modal .btn')].find(x => !x.disabled && /받기|모두 받기|받아요/.test(x.textContent)); if (c) { c.click(); return c.textContent.trim().slice(0, 12); } return ''; }); if (got) { taps.push([t, '창 안: ' + got]); await pg.waitForTimeout(600); } await pg.evaluate(() => UI.closeModal()); taps.push([t, '창 닫음: ' + r.modal.slice(0, 14)]); modalSince = 0; } continue; } modalSince = 0;
    if (r.tap) { taps.push([t, r.tap]); idle = 0; if (process.env.DBG) console.error(t, '누름', r.tap); } else { if (process.env.DBG) console.error(t, r.why); if (idle % 10 === 9) whyL.push(t + ' ' + r.why); idle++; if (idle > idleMax[0]) idleMax = [idle, t - idle]; }
  }
  const res = await pg.evaluate(() => ({ 새것: __new, 판: st.stage, 최고: st.best, 무덤남음: (st.tombQ || []).length, 장비: (st.gear || {}).n || 0, 영웅: Object.keys(st.heroes || {}).length }));
  const t0n = res.새것.length ? res.새것[0][0] : 0; const nov = res.새것.map(x => [x[0] - t0n, x[1], x[2]]);
  let gap = [0, 0], prev = 0; for (const x of nov) { if (x[0] - prev > gap[0]) gap = [x[0] - prev, prev]; prev = x[0]; }
  console.log(JSON.stringify({ 판: res.판, 최고: res.최고, 누른수: taps.length, 무덤연수: nov.filter(x => x[1] === '유품').length, 무덤남음: res.무덤남음, 장비: res.장비, 영웅: res.영웅, 힘오름: nov.filter(x => x[1] === '힘▲').length, 알림: nov.filter(x => x[1] === '알림').length, 새것없는가장긴틈: gap, 누를것없는가장긴틈초: idleMax, 누름: taps.map(x => x[0] + ' ' + x[1]).slice(-120), 새것: nov.map(x => x.join(' ')).slice(-120), 멈춤이유: whyL.slice(-30), 오류: errs.slice(0, 3) }, null, 0));
  await b.close(); srv.close(); })();
