// node 플레이녹화.js 폴더 이름 → /home/claude/rec/영상/영상_이름.mp4 (대표님 폰 360×593 · 봇이 직접 플레이하며 녹화)
// 11-15 19:56 대표님 「만들면 기능들도 전부 영상으로 해서 직접 플레이 체크 확실히」 — 관문 ⑬: 고친 뒤 찍은 영상이 있고 눈확인.md에 「- 영상_이름.mp4: 본 것」이 있어야 통과
// 구간: 0~15초 처음 시작(일으켜라 · 강화 누르기) → 15~45초 3-10 싸움(영웅 4명 때리기 · 지배자 · 군단)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process'); const dir = process.argv[2], name = process.argv[3] || 'play';
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8177);
(async () => { const V = '/tmp/녹화'; execSync(`rm -rf ${V}; mkdir -p ${V} /home/claude/rec/영상`);
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const ctx = await b.newContext({ viewport: { width: 360, height: 593 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, recordVideo: { dir: V, size: { width: 360, height: 593 } } }); const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8177/index.html'); await pg.waitForTimeout(2500); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(2500);
  for (let i = 0; i < 6; i++) { await pg.evaluate(() => { const r = document.getElementById('raiseBtn'); if (r) { r.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); r.click(); } }); await pg.waitForTimeout(700); }
  for (let i = 0; i < 6; i++) { await pg.evaluate(() => { st.souls = Math.max(st.souls, 1e4); const u = document.querySelector('[data-act="buy"]:not([disabled])'); if (u) u.click(); }); await pg.waitForTimeout(i < 5 ? 330 : 900); }   /* 강화 연타 5번(소리 계단 확인) */
  await pg.evaluate(() => { st.stage = st.best = 30; st.souls = 5e6; st.up.summon = 12; for (const h of JB.HEROES.slice(0, 4)) st.heroes[h.id] = { lv: 2, wp: 1 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => JB.HEROES[i] ? JB.HEROES[i].id : null); st.login = { n: 1, last: st.day }; S.loginShown = 1; for (const k in st.seen) st.seen[k] = st.seen[k] || 9; Object.assign(st.seen, { curTip: 1, fallTip: 1, idleTip: 9 }); UI.closeModal(); UI.tab = 'up'; UI.render(true); });
  for (let i = 0; i < 6; i++) { await pg.waitForTimeout(5000); await pg.evaluate(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }); }   /* 안내 창이 뜨면 닫음(처음 플레이어처럼 닫기 누름) */ const info = await pg.evaluate(() => ({ 판: st.stage, 군단: S.army.length, 영웅: st.squad.filter(Boolean) }));
  const pend = await pg.evaluate(() => performance.now() / 1000); const snd = await pg.evaluate(async d => ({ wav: await window.__renderSound(d), up: window.__sndUp ? window.__sndUp() : [], bgm: !!(Snd.bgm && Snd.bgm.list), 곡: Snd.bgm && Snd.bgm.list ? Snd.bgm.list.length : 0 }), pend);   /* 순서 #5: 영상에 소리도 넣음(기록된 소리를 다시 만들어 붙임) */
  fs.writeFileSync(V + '/a.wav', Buffer.from(snd.wav, 'base64')); fs.writeFileSync(`/home/claude/rec/영상/영상_${name}.소리.json`, JSON.stringify({ 강화띵: snd.up, 배경음켜짐: snd.bgm, 곡수: snd.곡, 녹음길이: pend }));
  await ctx.close(); await b.close(); srv.close();
  const wb = fs.readdirSync(V).find(f => f.endsWith('.webm')); const out = `/home/claude/rec/영상/영상_${name}.mp4`;
  execSync(`ffmpeg -loglevel error -y -i ${V}/${wb} -i ${V}/a.wav -map 0:v -map 1:a -af apad -c:a aac -b:a 128k -t ${pend.toFixed(2)} -vf "fps=30,scale=720:-2:flags=lanczos,drawtext=fontfile=/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc:text='%{pts\\:hms}':x=8:y=h-28:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.5" -c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p ${out}`);
  fs.writeFileSync(out.replace('.mp4', '.오류.txt'), errs.join('\n')); console.log(JSON.stringify({ 영상: out, 크기: fs.statSync(out).size, 오류: errs.length, 오류글: errs.slice(0, 3), ...info }));
})();
