// node 후반찍기.js 폴더 이름 [귀빈경험] → /home/claude/rec/후반_이름.jpg: 대표님 같은 후반 저장(11-16 09:15 사진: 귀빈 높음 · 2막 6-8 · 소환 307 · 영웅 여럿 · 마법 줄)에서
//   전장 0.15초 간격 16장 + 보스 판 6장 — 처음 하는 사람 저장만 시험해서 놓친 화면을 직접 봄
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = process.argv[2], nm = process.argv[3] || '확인', VX = +(process.argv[4] || 120000), PORT = 8209;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(PORT);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById('opening')?.click()); await pg.waitForTimeout(1500);
  await pg.evaluate(vx => { st.vipExp = vx; st.awakens = 1; st.stage = st.best = 137; st.wave = 1; st.waveT = 0; st.daysPlayed = 30; st.souls = 6.5e11; st.bones = 313; st.gems = 603; st.up.summon = 307; st.up.bone = 154; st.up.magic = 121;
    const H = JB.HEROES.map(h => h.id); for (const id of H) st.heroes[id] = { lv: 5, wp: 2 }; JB.squadFit(st); st.squad = st.squad.map((_, i) => H[i] || null);
    for (const k in st.seen) st.seen[k] = st.seen[k] || 9; st.login = { n: 1, last: st.day }; S.loginShown = 1; UI.closeModal(); JB.startWave(st); UI.render(true);
    setInterval(() => { if (document.getElementById('modal').style.display === 'flex') UI.closeModal(); }, 150); }, VX);
  await pg.waitForTimeout(9000);
  const A = []; for (let i = 0; i < 16; i++) { const f = `/tmp/hb_${i}.png`; await pg.screenshot({ path: f }); A.push(f); await pg.waitForTimeout(150); }
  execSync(`ffmpeg -loglevel error -y ${A.map(f => `-i ${f}`).join(' ')} -filter_complex "${A.map((_, i) => `[${i}]scale=360:-2[s${i}]`).join(';')};${A.map((_, i) => `[s${i}]`).join('')}xstack=inputs=16:layout=${A.map((_, i) => `${(i % 8) * 360}_${Math.floor(i / 8) * 640}`).join('|')}" /home/claude/rec/후반_${nm}.jpg`);
  const info = await pg.evaluate(() => ({ 귀빈: JB.vipLv(st), 판: SN(st.stage), 영웅: st.squad.filter(Boolean).length }));
  console.log(JSON.stringify({ ...info, 오류: errs.slice(0, 3) })); await b.close(); srv.close(); })();
