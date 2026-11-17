// 봇 + 던전 · 성채 · 길드를 30초마다 쓰는 사람: 받은 양이 전체에서 얼마나 되는지(게임 시간 30분, 8배속)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'); const dir = process.argv[2], mins = +(process.argv[3] || 30);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(8181);
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await (await b.newContext({ viewport: { width: 360, height: 593 } })).newPage();
  await pg.goto('http://localhost:8181/index.html?bot=1&speed=8&seed=5'); await pg.waitForTimeout(2000);
  await pg.evaluate(() => { window.__g = { dun: { souls: 0, bones: 0, gems: 0, n: 0 }, keep: 0, guild: { gems: 0, bones: 0 } }; window.__log = [];
    const g0 = { souls: 0, bones: 0, gems: 0 }; let ls = st.souls, lb = st.bones, lg = st.gems; window.__tot = { souls: 0, bones: 0, gems: 0 };
    setInterval(() => { const T = __tot; if (st.souls > ls) T.souls += st.souls - ls; if (st.bones > lb) T.bones += st.bones - lb; if (st.gems > lg) T.gems += st.gems - lg; ls = st.souls; lb = st.bones; lg = st.gems; }, 100);
    setInterval(() => { const now = Date.now();
      if (JB.unlocked(st, 'dungeon')) for (const d of JB.DUNGEON.list) { for (let k = 0; k < 3; k++) { const r = JB.dunFight(st, d.id, false); if (!r || !r.win) break; __g.dun.n++; for (const x of ['souls', 'bones', 'gems']) __g.dun[x] += r.r[x] || 0; } }
      if (JB.unlocked(st, 'guild')) { if (!JB.guildOf(st)) JB.guildJoin(st, 'g1'); JB.guildDay(st); const c = JB.guildCheck(st); if (c) { __g.guild.gems += c.gems; __g.guild.bones += c.bones; } const h = JB.guildHit(st, now); if (h) { __g.guild.gems += h.gems; __g.guild.bones += h.bones; } }
      if (JB.unlocked(st, 'keep')) { JB.keepTick(st, now); const K = JB.keepOf(st); if (!K.bld) { const id = JB.KEEP.ids.slice().sort((a, b) => K.lv[a] - K.lv[b])[0]; if (JB.keepStart(st, id, now)) __g.keep++; } else if (JB.keepRushCost(st, now) === 0) JB.keepRush(st, now); }
      __log.push([Math.round(BOT.t / 60), st.best, st.awakens, JSON.stringify(JB.dunOf ? JB.dunOf(st).lv : {}), st.keep ? JSON.stringify(st.keep.lv) : '-'].join(' '));
    }, 30000 / 8); });
  await pg.waitForTimeout(mins * 60000 / 8);
  const r = await pg.evaluate(() => ({ g: __g, tot: __tot, log: __log.filter((_, i) => i % 6 === 5), best: st.best, aw: st.awakens, gemsNow: st.gems }));
  console.log(r.log.join('\n')); console.log('던전', JSON.stringify(r.g.dun), '길드', JSON.stringify(r.g.guild), '성채 짓기', r.g.keep); console.log('전체 받은 양', JSON.stringify(r.tot)); console.log('최고', r.best, '각성', r.aw);
  await b.close(); srv.close(); })();
