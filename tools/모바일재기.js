// node 모바일재기.js 폴더 → JSON · 관문 ㊲ (11-17 00:37 대표님 「던전 히어로 직원판 채팅 읽어서 모바일 화면 배울 거 배우고 와」)
// ① 카카오톡 안 브라우저(안드로이드)면 위 띠 「바깥 브라우저로」 ② 아이폰 사파리면 홈 화면 추가 안내 ③ 홈 화면 아이콘으로 들어오면 설치 선물 마정석 100(두 번째엔 안 줌) ④ 설정 창에 설치 줄 ⑤ 띠가 일으켜라 단추를 안 가림 · 오류 0
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'); const dir = process.argv[2];
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8299);
const KAKAO = 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36 KAKAOTALK 10.4.5';
const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1';
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const errs = []; const out = {};
  const open = async (ua, init) => { const c = await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: ua }); const pg = await c.newPage(); pg.on('pageerror', e => errs.push(e.message)); if (init) await pg.addInitScript(init); await pg.goto('http://localhost:8299/index.html'); await pg.waitForTimeout(3200); return [c, pg]; };
  const bar = pg => pg.evaluate(() => { const e = document.getElementById('mbar'); if (!e || !e.classList.contains('on')) return null; const r = e.getBoundingClientRect(), rb = document.getElementById('raiseBtn')?.getBoundingClientRect(); return { 글: e.innerText.slice(0, 40), 단추: !!e.querySelector('.mb-go'), 아래: Math.round(r.bottom), 일으켜라위: rb ? Math.round(rb.top) : 999 }; });
  let [c, pg] = await open(KAKAO); out.카톡 = await bar(pg); await c.close();
  [c, pg] = await open(IOS); out.아이폰 = await bar(pg); await c.close();
  [c, pg] = await open(undefined, () => { Object.defineProperty(navigator, 'standalone', { get: () => true }); });
  await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(3500);
  const g1 = await pg.evaluate(() => ({ gems: st.gems, gift: !!(st.seen && st.seen.installGift) })); await pg.evaluate(() => { save(); MOB.gift(); }); await pg.waitForTimeout(300); const g2 = await pg.evaluate(() => st.gems);
  out.설치선물 = g1.gift; out.두번째선물 = g2 - g1.gems; await c.close();
  [c, pg] = await open(); await pg.evaluate(() => { document.getElementById('opening')?.click(); }); await pg.waitForTimeout(800); await pg.evaluate(() => EX.settingsOpen()); out.설정설치줄 = await pg.evaluate(() => !!document.querySelector('#modal [data-x="mobInst"]')); out.보통띠 = await bar(pg); await c.close();
  /* ⑥ 기록 옮기기: 한쪽에서 37판 기록을 글자로 → 새 브라우저에 붙여 넣고 바꾸기 → 37판으로 이어짐 · 틀린 글자는 막힘 */
  [c, pg] = await open(); await pg.evaluate(() => { document.getElementById('opening')?.click(); }); await pg.waitForTimeout(800); const code = await pg.evaluate(() => { st.stage = st.best = 37; return MOB.code(); }); await c.close();
  [c, pg] = await open(); await pg.evaluate(() => { document.getElementById('opening')?.click(); }); await pg.waitForTimeout(800);
  await pg.evaluate(() => { EX.settingsOpen(); document.querySelector('#modal [data-x="mvOpen"]').click(); }); await pg.waitForTimeout(300);
  await pg.evaluate(() => { document.getElementById('mvIn').value = 'JBK1.틀린글자'; document.querySelector('#modal [data-x="mvLoad"]').click(); }); out.틀린글자막힘 = await pg.evaluate(() => /맞지 않아요/.test(document.getElementById('mvMsg').innerText));
  await pg.evaluate(cd => { document.getElementById('mvIn').value = cd; document.querySelector('#modal [data-x="mvLoad"]').click(); }, code); await pg.waitForTimeout(200);
  await Promise.all([pg.waitForNavigation({ timeout: 8000 }).catch(() => {}), pg.evaluate(() => document.querySelector('#modal [data-x="mvYes"]')?.click())]); await pg.waitForTimeout(2500);
  out.옮긴판 = await pg.evaluate(() => st.stage); out.글자길이 = code.length; await c.close();
  console.log(JSON.stringify({ ...out, 오류: errs.slice(0, 3) })); await b.close(); srv.close(); })();
