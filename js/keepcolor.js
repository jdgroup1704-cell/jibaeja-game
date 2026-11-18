/* 11-18 15:1x 대표님 폰(삼성 인터넷 · 다크 모드) 사진: 금 단추 → 갈색 · 보라 단추 → 남색 · 흰 빛 알갱이 → 검은 점
   원인: 삼성 인터넷은 폰이 다크 모드면 웹페이지 색(배경 · 그라데이션 · 글자)을 강제로 바꿈. 사이트가 끌 방법 없음(삼성 개발자 포럼 공식 답).
   단 「그림(이미지)」은 안 바꿈 → 다크 모드일 때 화면의 그라데이션 · 밝은 배경을 같은 모양의 그림으로 그려 바꿔 깔아 색을 지킴.
   (다크 모드가 아니면 아무것도 안 함 · ?keep=1 이면 시험용으로 늘 켬) */
(function () {
  const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  if (!((mq && mq.matches) || /[?&]keep=1/.test(location.search))) return;
  document.documentElement.classList.add('keepc');
  const CV = document.createElement('canvas'), X = CV.getContext('2d'), cache = new Map(), MAXA = 480 * 960;
  const split = s => { const out = []; let d = 0, b = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(b.trim()); b = ''; } else b += ch; } if (b.trim()) out.push(b.trim()); return out; };
  const isCol = t => /^(rgba?\(|#|transparent)/.test(t);
  const stopsOf = (parts, len) => {   /* 「rgb(...) 35%」 → [{c, p(0~1)}] — 자리 없는 것은 고르게 */
    const st = parts.map(p => { const m = p.match(/^(rgba?\([^)]*\)|#[0-9a-f]+|transparent)\s*(.*)$/i); if (!m) return null; let pos = null; const q = (m[2] || '').trim().split(/\s+/)[0]; if (q) { if (q.endsWith('%')) pos = parseFloat(q) / 100; else if (q.endsWith('px')) pos = parseFloat(q) / Math.max(1, len); } return { c: m[1] === 'transparent' ? 'rgba(0,0,0,0)' : m[1], p: pos }; }).filter(Boolean);
    if (!st.length) return null; if (st[0].p == null) st[0].p = 0; if (st[st.length - 1].p == null) st[st.length - 1].p = 1;
    for (let i = 1; i < st.length; i++) if (st[i].p == null) { let j = i; while (st[j].p == null) j++; const a = st[i - 1].p, b = st[j].p; for (let k = i; k < j; k++) st[k].p = a + (b - a) * (k - i + 1) / (j - i + 1); }
    let last = 0; for (const s of st) { s.p = Math.max(last, Math.min(1, s.p)); last = s.p; } return st; };
  const lin = (args, w, h) => {
    let a = Math.PI, first = args[0];
    if (/^-?[\d.]+(deg|rad|turn)$/.test(first)) { a = first.endsWith('deg') ? parseFloat(first) * Math.PI / 180 : first.endsWith('turn') ? parseFloat(first) * 2 * Math.PI : parseFloat(first); args = args.slice(1); }
    else if (/^to /.test(first)) { const t = first.slice(3); a = { top: 0, right: Math.PI / 2, bottom: Math.PI, left: Math.PI * 1.5 }[t] ?? (/top/.test(t) ? (/right/.test(t) ? Math.atan2(w, h) : -Math.atan2(w, h)) : (/right/.test(t) ? Math.PI - Math.atan2(w, h) : Math.PI + Math.atan2(w, h))); args = args.slice(1); }
    const L = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a)), dx = Math.sin(a) * L / 2, dy = -Math.cos(a) * L / 2, st = stopsOf(args, L); if (!st) return false;
    const g = X.createLinearGradient(w / 2 - dx, h / 2 - dy, w / 2 + dx, h / 2 + dy); for (const s of st) g.addColorStop(s.p, s.c); X.fillStyle = g; X.fillRect(0, 0, w, h); return true; };
  const rad = (args, w, h) => {
    let shape = 'ellipse', size = 'farthest-corner', cx = w / 2, cy = h / 2, rx = null, ry = null;
    if (!isCol(args[0])) { const d = args[0]; args = args.slice(1); const [sz, at] = d.split(/\s*\bat\b\s*/);
      if (at) { const p = at.trim().split(/\s+/); const v = (t, L) => t === 'left' || t === 'top' ? 0 : t === 'right' || t === 'bottom' ? L : t === 'center' ? L / 2 : t.endsWith('%') ? parseFloat(t) / 100 * L : parseFloat(t); cx = v(p[0], w); cy = v(p[1] || 'center', h); }
      for (const t of (sz || '').trim().split(/\s+/).filter(Boolean)) { if (t === 'circle' || t === 'ellipse') shape = t; else if (/side|corner/.test(t)) size = t; else { const n = t.endsWith('%') ? parseFloat(t) / 100 : parseFloat(t); if (rx == null) rx = t.endsWith('%') ? n * w : n; else ry = t.endsWith('%') ? n * h : n; } } }
    if (rx != null) { if (ry == null) { ry = rx; shape = 'circle'; } }
    else { const fx = Math.max(cx, w - cx), fy = Math.max(cy, h - cy), nx = Math.min(cx, w - cx), ny = Math.min(cy, h - cy);
      if (shape === 'circle') { const r = size === 'closest-side' ? Math.min(nx, ny) : size === 'farthest-side' ? Math.max(fx, fy) : size === 'closest-corner' ? Math.hypot(nx, ny) : Math.hypot(fx, fy); rx = ry = r; }
      else { const k = /corner/.test(size) ? Math.SQRT2 : 1; rx = (/closest/.test(size) ? nx : fx) * k; ry = (/closest/.test(size) ? ny : fy) * k; } }
    rx = Math.max(0.5, rx); ry = Math.max(0.5, ry); const st = stopsOf(args, rx); if (!st) return false;
    X.save(); X.translate(cx, cy); X.scale(1, ry / rx); const g = X.createRadialGradient(0, 0, 0, 0, 0, rx); for (const s of st) g.addColorStop(s.p, s.c); X.fillStyle = g; X.fillRect(-cx, -cy * rx / ry, w, h * rx / ry); X.restore(); return true; };
  function paint(bgi, bgc, w, h) {   /* 그라데이션 여러 겹 + 바탕색 → 그림(data URL) */
    const key = bgi + '|' + bgc + '|' + w + 'x' + h; if (cache.has(key)) return cache.get(key);
    CV.width = w; CV.height = h; X.setTransform(1, 0, 0, 1, 0, 0); X.clearRect(0, 0, w, h);
    if (bgc && bgc !== 'rgba(0, 0, 0, 0)') { X.fillStyle = bgc; X.fillRect(0, 0, w, h); }
    const layers = bgi && bgi !== 'none' ? split(bgi).reverse() : [];
    for (const L of layers) { const m = L.match(/^(repeating-)?(linear|radial)-gradient\((.*)\)$/s); if (!m || m[1]) { cache.set(key, null); return null; } const args = split(m[3]); if (!(m[2] === 'linear' ? lin(args, w, h) : rad(args, w, h))) { cache.set(key, null); return null; } }
    try { const im = X.getImageData(0, 0, w, h), d = im.data; for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { const n = ((i * 2654435761) >>> 28) - 8 >> 2; d[i] = Math.max(0, Math.min(255, d[i] + n)); d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n)); }   /* 아주 작은 얼룩: 한 가지 색 그림을 「아이콘」으로 보고 다시 칠하는 걸 피함 */ X.putImageData(im, 0, 0); } catch (e) {}
    const url = CV.toDataURL('image/png'); if (cache.size > 400) cache.clear(); cache.set(key, url); return url; }
  const lightish = c => { const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); if (!m || (m[4] != null && +m[4] < 0.05)) return false; const r = +m[1], g = +m[2], b = +m[3], mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx > 70 || mx - mn > 40; };   /* 어두운 바탕은 그대로 둬도 안 바뀜 — 밝거나 색이 짙은 바탕만 */
  const KT = '#stbig small';   /* 색 글자 중 다크 모드가 어둡게 바꾸던 것(대표님 사진 「보스까지 ○판」) → 글자 모양으로 오린 그림 */
  function fixText(el) { if (el.dataset.kt) return; const c = getComputedStyle(el).color, url = paint('none', c, 8, 8); if (!url) return; el.dataset.kt = 1;
    Object.assign(el.style, { backgroundImage: `url(${url})`, backgroundSize: '100% 100%', webkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', textShadow: 'none', filter: 'drop-shadow(0 1px 0 #000) drop-shadow(0 0 3px #000)' }); }
  function fix(el) {
    if (el.matches && el.matches(KT)) { fixText(el); return; }
    if (!(el instanceof HTMLElement) || el.id === 'battle' || el.tagName === 'CANVAS' || el.tagName === 'IMG') return;
    if (el.dataset.kc) { el.style.backgroundImage = el.dataset.kcI || ''; el.style.backgroundSize = el.dataset.kcS || ''; el.style.backgroundColor = el.dataset.kcC || ''; el.style.backgroundRepeat = el.dataset.kcR || ''; }   /* 게임이 직접 넣은 배경은 지켜 둠 */
    const cs = getComputedStyle(el), bgi = cs.backgroundImage, bgc = cs.backgroundColor, grad = /gradient\(/.test(bgi) && !/url\(/.test(bgi);
    if (!grad && !(bgc && lightish(bgc) && bgi === 'none')) { delete el.dataset.kc; return; }
    const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight); if (w < 2 || h < 2 || w * h > MAXA) { delete el.dataset.kc; return; }
    const url = paint(grad ? bgi : 'none', bgc, w, h); if (!url) { delete el.dataset.kc; return; }
    if (!el.dataset.kc) { el.dataset.kcI = el.style.backgroundImage; el.dataset.kcS = el.style.backgroundSize; el.dataset.kcC = el.style.backgroundColor; el.dataset.kcR = el.style.backgroundRepeat; }
    el.dataset.kc = 1; el.style.backgroundImage = `url(${url})`; el.style.backgroundSize = '100% 100%'; el.style.backgroundRepeat = 'no-repeat'; el.style.backgroundColor = 'transparent'; }
  const todo = new Set(); let raf = 0;
  const flush = () => { const t0 = performance.now(); flush0(); const dt = performance.now() - t0; window.__kc = window.__kc || { n: 0, t: 0, max: 0 }; __kc.n++; __kc.t += dt; __kc.max = Math.max(__kc.max, dt); };   /* 시험용 셈(관문 ㉚ 렉) */
  const flush0 = () => { raf = 0; const list = [...todo]; todo.clear(); for (const n of list) { if (!n.isConnected) continue; fix(n); if (n.querySelectorAll) for (const c of n.querySelectorAll('*')) fix(c); } };
  const want = n => { if (n && n.nodeType === 1) { todo.add(n); if (!raf) raf = requestAnimationFrame(flush); } };
  new MutationObserver(ms => { for (const m of ms) { if (m.type === 'attributes') { if (m.attributeName === 'style' && m.target.dataset && m.target.dataset.kc != null) continue; want(m.target); } else for (const n of m.addedNodes) want(n); } })
    .observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  addEventListener('resize', () => want(document.body));
  const start = () => want(document.body); if (document.body) start(); else addEventListener('DOMContentLoaded', start);
})();
