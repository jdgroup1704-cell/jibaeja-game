// 잘린 글자 · 화면 밖 점검(11-15 다시 만듦 — 옛 도구는 클라우드에만 있다 사라짐): node 잘림점검.js 폴더 [이름]
// 대표님 폰 크기 360×593 · 하루 14일째 · 40판 상태로 탭과 창을 하나씩 열고,
// 글자가 칸보다 길어 잘린 것(「잘림:」)과 화면 밖으로 나간 것(「밖:」)을 찾음. 끝에 「오류 N」
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2];
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8161);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await (await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8161/index.html?test=1&seed=3'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click());
  await pg.evaluate(() => { st.stage = st.best = st.peak = 40; st.daysPlayed = 14; st.souls = 1e9; st.bones = 5000; st.gems = 3000; st.raised = 99; st.up.summon = 12;
    for (const h of JB.HEROES) st.heroes[h.id] = { lv: 3, wp: 2 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => JB.HEROES[i].id);
    for (const k in st.seen || {}) st.seen[k] = 9; UI.closeModal && UI.closeModal(); UI.render(true); });
  await pg.waitForTimeout(1500);
  const scan = name => pg.evaluate(name => { const out = [], W = innerWidth, H = innerHeight;
    for (const el of document.querySelectorAll('#app *, #modal .box *')) {
      if (el.closest('#cutin, #toast, .vsfx')) continue;   /* 옆에서 미끄러져 들어오는 기술 띠 · 알림은 움직이는 중이라 뺌 */
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if (!own) continue;
      const t = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30), r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      if (el.closest('#modal') && getComputedStyle(document.getElementById('modal')).display === 'none') continue;
      const clip = (cs.overflow !== 'visible' || cs.textOverflow === 'ellipsis') && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 4 && cs.whiteSpace === 'nowrap');
      if (clip) out.push(`${name} 잘림: 「${t}」 ${el.scrollWidth}>${el.clientWidth}`);
      const box = el.closest('.box, #tabbody, #app'); const bs = box && box.closest('#modal .box') ? null : null;
      let sc = el.parentElement; while (sc && !/(auto|scroll)/.test(getComputedStyle(sc).overflowX)) sc = sc.parentElement;   /* 옆으로 미는 줄 안이면 괜찮음 */
      if (!sc && (r.right > W + 1 || r.left < -1)) out.push(`${name} 밖: 「${t}」 ${Math.round(r.left)}~${Math.round(r.right)}`);
    } return out; }, name);
  const all = [];
  for (const k of ['up', 'grave', 'hero', 'awaken', 'crypt', 'mission']) { await pg.evaluate(k => { UI.closeModal && UI.closeModal(); UI.tab = k; UI.render(true); }, k); await pg.waitForTimeout(500); all.push(...await scan('탭 ' + k)); }
  for (const f of ['EX.shopOpen', 'EX.settingsOpen', 'EX.quickOpen', 'EX.lchestOpen', 'UI.vipOpen', 'UI.curOpen', 'SO.openChat', 'SO.openGuild', 'LEGAL.open']) { const ok = await pg.evaluate(f => { UI.closeModal && UI.closeModal(); const [o, m] = f.split('.'), obj = window[o] || eval(o); if (!obj || typeof obj[m] !== 'function') return false; try { obj[m](o === 'LEGAL' ? 'odds' : o === 'UI' ? 'gems' : undefined); } catch (e) { return String(e).slice(0, 80); } return true; }, f); if (ok !== true) { console.log('창 못 엶', f, ok); continue; } await pg.waitForTimeout(500); all.push(...await scan('창 ' + f)); }
  await pg.evaluate(() => { UI.closeModal && UI.closeModal(); UI.tab = 'up'; UI.render(true); }); await pg.waitForTimeout(400); await pg.screenshot({ path: '/home/claude/rec/잘림_첫화면.png' });
  const uniq = [...new Set(all)]; uniq.forEach(x => console.log(x));
  console.log('잘림 · 밖 줄', uniq.length, '· 오류', errs.length, errs.slice(0, 2).join(' | ')); await b.close(); srv.close();
})();
