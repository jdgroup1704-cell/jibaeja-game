const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = process.argv[2], port = +process.argv[3];
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : 'image/webp' }); r.end(d); }); }).listen(port);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  await pg.goto(`http://localhost:${port}/index.html?bot=1&test=1`);
  for (let i = 0; i < 6; i++) { await pg.waitForTimeout(4000); console.log(JSON.stringify(await pg.evaluate(() => ({ t: S.t.toFixed(1), ph: S.phase, dark: (S.dark || 0).toFixed(2), tint: (S.tint || 0).toFixed(2), stage: st.stage, army: JB.armySize(st), qual: QUAL })))); }
  await b.close(); srv.close();
})();
