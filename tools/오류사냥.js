// 로봇 오류 사냥(11-17 22:5x 대표님 21:24 「오류 못 찾으니까 니가 진화해」): 봇이 빨리 감아 플레이하는 동안 탭 · 창을 돌아가며 열고 매번 잼
// node 오류사냥.js 폴더 [분=6] [배속=8] [높이=593] → JSON 요약 + 처음 본 문제마다 사진 /home/claude/rec/사냥/
// 재는 것: ① 보이는 글에 NaN · undefined · Infinity · [object · null 원 ② 재화가 음수 · 숫자 아님 ③ 단추끼리 30% 넘게 겹침 ④ 단추 · 이름 글자가 칸 밖으로 넘침(말줄임 없이) ⑤ 화면 밖으로 나간 단추 ⑥ 콘솔 오류
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = process.argv[2], mins = +(process.argv[3] || 6), sp = +(process.argv[4] || 8), H = +(process.argv[5] || 593), PORT = 8301;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
const OUT = '/home/claude/rec/사냥'; execSync(`mkdir -p ${OUT}`);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--mute-audio'] }); const pg = await (await b.newContext({ viewport: { width: 360, height: H }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('콘솔: ' + m.text().slice(0, 120)); });
  await pg.goto(`http://localhost:${PORT}/index.html?bot=1&speed=${sp}&seed=7`); await pg.waitForTimeout(2500);
  const views = ['tab:up', 'tab:army', 'tab:hero', 'tab:awaken', 'tab:adv', 'tab:mission', 'tab:grave', 'shop', 'menu', 'battle', 'battle'];
  const seen = {}, found = []; let n = 0; const t0 = Date.now();
  while (Date.now() - t0 < mins * 60000) {
    const v = views[n++ % views.length];
    await pg.evaluate(v => { try { UI.closeModal(); if (v.startsWith('tab:')) { const k = v.slice(4); if (UI.tabOpen && UI.tabOpen(k)) { UI.tab = k; UI.render(true); } } else if (v === 'shop' && typeof EX !== 'undefined' && EX.shopOpen) EX.shopOpen(); else if (v === 'menu') { const m = document.querySelector('#tools .more, #tools [data-t="more"]'); m && m.click(); } } catch (e) { console.error('사냥 열기 ' + v + ' ' + e.message); } }, v);
    await pg.waitForTimeout(700);
    const r = await pg.evaluate(() => {
      const vis = e => { if (!e.offsetWidth && !e.offsetHeight) return false; const c = getComputedStyle(e); if (c.visibility === 'hidden' || +c.opacity < 0.05) return false; const q = e.getBoundingClientRect(); return q.bottom > 0 && q.top < innerHeight && q.right > 0 && q.left < innerWidth; };
      const out = [];
      // ① 이상한 글
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let t; while ((t = walker.nextNode())) { const s = t.nodeValue; if (/\bNaN\b|undefined|Infinity|\[object|\bnull\b/.test(s) && t.parentElement && vis(t.parentElement) && !t.parentElement.closest('script,style')) out.push(['이상한 글', s.trim().slice(0, 50), t.parentElement.className || t.parentElement.id]); }
      // ② 재화
      for (const k of ['souls', 'gems', 'bones', 'stage', 'best']) { const x = st[k]; if (typeof x !== 'number' || !isFinite(x) || x < 0) out.push(['재화 이상', k + '=' + x, '']); }
      // ③ ⑤ 단추
      const bs = [...document.querySelectorAll('button, .btn')].filter(vis).filter(e => !e.closest('#testbar'));
      const clip = e => { const q = e.getBoundingClientRect(); let l = q.left, t = q.top, r = q.right, b = q.bottom; for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const c = getComputedStyle(p); if (c.overflow !== 'visible' || c.overflowY !== 'visible') { const z = p.getBoundingClientRect(); l = Math.max(l, z.left); t = Math.max(t, z.top); r = Math.min(r, z.right); b = Math.min(b, z.bottom); } } return { left: l, top: t, right: r, bottom: b, width: Math.max(0, r - l), height: Math.max(0, b - t) }; };   /* 스크롤 칸 밖으로 나가 잘린 부분은 안 셈 */
      const R = bs.map(clip);
      for (let i = 0; i < bs.length; i++) { const a = R[i];
        if (a.left < -2 || a.right > innerWidth + 2) out.push(['화면 밖 단추', (bs[i].textContent || '').trim().slice(0, 20), bs[i].className]);
        for (let j = i + 1; j < bs.length; j++) { if (bs[i].contains(bs[j]) || bs[j].contains(bs[i])) continue; const c = R[j]; const w = Math.min(a.right, c.right) - Math.max(a.left, c.left), h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top); if (w <= 0 || h <= 0) continue; const ar = Math.min(a.width * a.height, c.width * c.height); if (ar > 0 && w * h / ar > 0.3) { const top = document.elementFromPoint((Math.max(a.left, c.left) + Math.min(a.right, c.right)) / 2, (Math.max(a.top, c.top) + Math.min(a.bottom, c.bottom)) / 2); if (!top || !(bs[i].contains(top) || bs[j].contains(top))) continue;   /* 둘 다 다른 것(대결 카드 등)에 덮였으면 안 보이니 안 셈 */ if (top && top.closest('#tools .col.r.open')) continue;   /* 펼친 메뉴 기둥이 위에 뜬 건 정상(아래에 깔리면 잡힘) */ if (top && top.closest('#modal') && !(bs[i].closest('#modal') && bs[j].closest('#modal'))) continue;   /* 창이 위에 덮인 건 정상 */ out.push(['단추 겹침', (bs[i].textContent || '').trim().slice(0, 14) + ' × ' + (bs[j].textContent || '').trim().slice(0, 14), (bs[i].closest('[id]') || {}).id + '/' + (bs[j].closest('[id]') || {}).id]); } } }
      // ④ 글자 넘침(말줄임 없이 잘림)
      for (const e of [...document.querySelectorAll('button, .btn, .nm, .ds, .chip, .toast, h3, b, small')].filter(vis)) { const c = getComputedStyle(e); if (c.textOverflow === 'ellipsis' || c.overflow === 'visible' && c.whiteSpace !== 'nowrap') continue; if (e.scrollWidth > e.clientWidth + 3 && e.clientWidth > 0 && (e.textContent || '').trim().length > 1 && !e.querySelector('img,svg')) out.push(['글자 넘침', (e.textContent || '').trim().slice(0, 24), e.tagName + '.' + e.className]); }
      return { out, stg: st.stage, best: st.best, modal: document.getElementById('modal').style.display === 'flex' };
    });
    for (const [k, a, c] of r.out) { const key = k + '|' + a + '|' + c; if (seen[key]) { seen[key].n++; continue; } seen[key] = { k, a, c, n: 1, v, stg: r.stg }; const f = `${OUT}/${String(found.length).padStart(2, '0')}_${k.replace(/ /g, '')}.jpg`; await pg.screenshot({ path: f, type: 'jpeg', quality: 70 }); seen[key].f = f; found.push(seen[key]); }
  }
  const fin = await pg.evaluate(() => ({ stg: st.stage, best: st.best, aw: st.awakens }));
  console.log(JSON.stringify({ 끝: fin, 본화면: n, 문제: found.map(x => `${x.k} · ${x.a} · ${x.c} · ${x.v} · ${x.stg}판 · ${x.n}번 · ${path.basename(x.f)}`), 오류: [...new Set(errs)].slice(0, 8) }, null, 1));
  await b.close(); srv.close(); })();
