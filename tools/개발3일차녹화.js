// node 개발3일차녹화.js 폴더 이름 (개발2일차녹화.js 바탕) · node 매끈녹화.js 폴더 이름 — 플레이녹화.js와 같은 봇 플레이를 「시간을 멈춰 놓고 1/30초씩 넘기며 한 장씩」 찍음(11-16 19:39 대표님 「렉도 있고」 — 서버가 느려도 영상은 끊김 0 · 시간 글자 없음)
// 원래: node 플레이녹화.js 폴더 이름 → /home/claude/rec/영상/영상_이름.mp4 (대표님 폰 360×593 · 봇이 직접 플레이하며 녹화)
// 11-15 19:56 대표님 「만들면 기능들도 전부 영상으로 해서 직접 플레이 체크 확실히」 — 관문 ⑬: 고친 뒤 찍은 영상이 있고 눈확인.md에 「- 영상_이름.mp4: 본 것」이 있어야 통과
// 구간: 0~15초 처음 시작(일으켜라 · 강화 누르기) → 15~45초 3-10 싸움(영웅 4명 때리기 · 지배자 · 군단) → 45초~ 1-10 보스(군단으로 싸우며 약점 누르기 「반격!」) 잡기 · 망자 거인 일어남 · 솟아 내려찍기 · 자랑 카드
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process'); const dir = process.argv[2], name = process.argv[3] || 'play';
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8181);
(async () => { const V = '/tmp/녹화'; execSync(`rm -rf ${V}; mkdir -p ${V} /home/claude/rec/영상`);
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const ctx = await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const pg = await ctx.newPage(); await pg.clock.install({ time: 0 }); await pg.clock.pauseAt(1000); const FR = V + '/f'; fs.mkdirSync(FR); let fi = 0; const W = async ms => { const n = Math.max(1, Math.round(ms * 30 / 1000)); for (let k = 0; k < n; k++) { await pg.clock.runFor(fi % 3 === 2 ? 34 : 33); await pg.screenshot({ path: `${FR}/${String(fi++).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 90 }); } }; const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8181/index.html'); await W(1500); await pg.evaluate(() => document.getElementById('opening')?.click()); await W(1500);
  /* 개발 3일차 장면(11-17 18:1x · 일레븐랩스 목소리 영상): 쓸어 담기 빛의 벽 + 해골 손 → 3-10 진형(세라핀 · 칼 해골 따로) → 강화 띵 연타 → 자동 시범(손가락 · ×20 · 결과만) */
  await pg.evaluate(() => { st.stage = st.best = 22; st.lastVer = (document.getElementById('ver') || {}).textContent; st.souls = 5e6; st.raised = 99; st.daysPlayed = 14; st.up.summon = 12; for (const h of JB.HEROES.slice(0, 4)) st.heroes[h.id] = { lv: 2, wp: 1 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => JB.HEROES[i] ? JB.HEROES[i].id : null); st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; Object.assign(st.seen, { curTip: 1, fallTip: 1, idleTip: 9, tapTip: 9 }); UI.closeModal(); UI.tab = 'up'; UI.render(true); });
  await W(3500); const marks = {};
  for (let r = 0; r < 3; r++) { await pg.evaluate(() => { UI.closeModal(); }); await W(2200); marks['쓸기' + r] = fi / 30; await pg.evaluate(() => { const L2 = S.foes.filter(f => !f.dead && !f.flee); if (L2.length && typeof sweepFx === 'function') { S.sweptW = S.foeWave; sweepFx(L2); } }); await W(3800); }
  await pg.evaluate(() => { UI.closeModal(); UI.tab = 'up'; UI.render(true); }); marks.진형 = fi / 30; await W(4500);
  marks.강화 = fi / 30; for (let k = 0; k < 7; k++) { await pg.evaluate(() => { UI.closeModal(); st.souls = Math.max(st.souls, 1e7); const b = document.querySelector('.ucard[data-arg="summon"] .btn.buy'); if (b) b.click(); }); await W(330); } await W(1200);
  await pg.evaluate(() => { try { save(); } catch (e) {} location.hash = 'demo-copy'; location.reload(); }); await W(3500); marks.시범 = fi / 30;
  await pg.evaluate(() => { document.querySelector('#demobar [data-sp="1"]')?.click(); }); await W(5000); marks.시범빠름 = fi / 30;
  await pg.evaluate(() => { document.querySelector('#demobar [data-sp="20"]')?.click(); }); await W(3500); marks.결과만 = fi / 30;
  await pg.evaluate(() => { document.querySelector('#demobar .dbskip')?.click(); }); await W(2500);
  const info = { marks };
  const pend = await pg.evaluate(() => performance.now() / 1000); const snd = await pg.evaluate(async d => ({ wav: await window.__renderSound(d), up: window.__sndUp ? window.__sndUp() : [], bgm: !!(Snd.bgm && Snd.bgm.list), 곡: Snd.bgm && Snd.bgm.list ? Snd.bgm.list.length : 0 }), pend);   /* 순서 #5: 영상에 소리도 넣음(기록된 소리를 다시 만들어 붙임) */
  fs.writeFileSync(V + '/a.wav', Buffer.from(snd.wav, 'base64')); fs.writeFileSync(`/home/claude/rec/영상/영상_${name}.소리.json`, JSON.stringify({ 강화띵: snd.up, 배경음켜짐: snd.bgm, 곡수: snd.곡, 녹음길이: pend }));
  await ctx.close(); await b.close(); srv.close();
  const out = `/home/claude/rec/영상/영상_${name}.mp4`; fs.writeFileSync(out + '.marks.json', JSON.stringify(info.marks));
  execSync(`ffmpeg -loglevel error -y -framerate 30 -i ${FR}/%05d.jpg -i ${V}/a.wav -map 0:v -map 1:a -af apad -c:a aac -b:a 128k -t ${(fi / 30).toFixed(2)} -vf "scale=720:-2:flags=lanczos" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p ${out}`); fs.writeFileSync(out + '.nots', '시간 글자 없음 · 매끈 녹화'); fs.writeFileSync(out + '.smooth', String(fi));
  fs.writeFileSync(out.replace('.mp4', '.오류.txt'), errs.join('\n'));  console.log(JSON.stringify({ 영상: out, 크기: fs.statSync(out).size, 오류: errs.length, 오류글: errs.slice(0, 3), ...info }));
})();
