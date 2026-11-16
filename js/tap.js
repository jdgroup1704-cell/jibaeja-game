/* 11-17 02:1x 대표님 「던전 히어로 해 봐 — 움직임도 훨씬 낫지 않나」 → 그쪽은 손가락으로 직접 움직임, 우리는 지켜보기만 함
   ④ 「누른 곳에 지배자 마법」: 싸움터를 누르면 지배자 지팡이에서 영혼탄이 누른 곳 가장 가까운 적에게 날아가 터짐
   · 한 번에 군단 힘(dps)의 12% 피해 · 1초에 5번까지(꾹꾹 누르면 최대 +60%) · 봇 · 밸런스 흉내는 안 누르므로 그대로(관문 ⑪)
   · 대마법 · 영창 · 노려보기 · 창이 열렸을 땐 안 됨 · 처음 한 번 「화면을 누르면 직접 쏴요」 */
const TAP = {
  L: [], last: 0, n: 0,
  ok() { return typeof S !== 'undefined' && (S.phase === 'battle' || S.phase === 'fight') && !UI.awakening && document.getElementById('modal').style.display !== 'flex' && !(st.hp <= 0) && !S.hold; },
  world(ev) { const r = cv.getBoundingClientRect(); if (!r.width || typeof VIS === 'undefined') return null; return { x: VIS.x0 + (ev.clientX - r.left) / r.width * (VIS.x1 - VIS.x0), y: VIS.y0 + (ev.clientY - r.top) / r.height * (VIS.y1 - VIS.y0) }; },
  fire(p) { const now = performance.now(); if (now - this.last < 200 || !this.ok()) return false; this.last = now; this.n++;
    const F = S.foes.filter(f => !f.dead && !f.flee && !f.wait && f.x < VX1); let tg = null, bd = 1e9;
    for (const f of F) { const d = Math.hypot(f.x - p.x, (f.y - 40 - p.y) * 1.4); if (d < bd) { bd = d; tg = f; } }
    const g = S.giant && S.giant.on && !S.giant.dead ? S.giant : null; if (g && (!tg || Math.hypot(g.x - p.x, g.y - 200 - p.y) < bd)) tg = { x: g.x - 30, y: g.y - 150, giant: 1 };
    if (!tg) return false;
    const s0 = typeof LM !== 'undefined' && LM.staff ? LM.staff() : { x: 230, y: 330 };
    this.L.push({ k: 'bolt', x0: s0.x, y0: s0.y, x1: tg.x, y1: tg.y - (tg.giant ? 0 : 50), t: 0, life: 0.18, f: tg.giant ? null : tg });
    this.L.push({ k: 'tapring', x: p.x, y: p.y, t: 0, life: 0.35 });
    S.lord.glow = Math.max(S.lord.glow || 0, 0.5); S.lord.shotT = 0.25;
    Snd.smp && Snd.smp('hit', 0.12, 0, 1.9);
    if (!st.seen.tapTip) { st.seen.tapTip = 1; }
    return true; },
  land(e) { const dmg = JB.dps(st) * 0.12 * (typeof JB.matchMul === 'function' && st.boss ? JB.matchMul(st) : 1); st.hp -= dmg; window.__tapDmg = (window.__tapDmg || 0) + dmg;
    burst(e.x1, e.y1, 10, { col: ['#e2ccff', '#b87cff', '#ffffff'], vmin: 80, vmax: 320, up: 120, g: 400, lmax: 0.4, smin: 2, smax: 5 });
    this.L.push({ k: 'pop', x: e.x1, y: e.y1, t: 0, life: 0.32 });
    if (e.f && !e.f.dead) { e.f.flash = Math.max(e.f.flash || 0, 0.16); e.f.kbT = 0.14; e.f.x += 10; }
    S.shake = Math.max(S.shake || 0, 3); },
  draw() { if (!this.L.length) return; const dt = 1 / 60; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const e of this.L) { e.t += dt; const p = Math.min(1, e.t / e.life), a = 1 - p;
      if (e.k === 'bolt') { const x = lerp(e.x0, e.x1, p), y = lerp(e.y0, e.y1, p) - Math.sin(p * Math.PI) * 60; for (let j = 0; j < 7; j++) { const q = Math.max(0, p - j * 0.06), xx = lerp(e.x0, e.x1, q), yy = lerp(e.y0, e.y1, q) - Math.sin(q * Math.PI) * 60, r = 34 - j * 4.5; ctx.globalAlpha = 0.9 - j * 0.13; const gr = ctx.createRadialGradient(xx, yy, 1, xx, yy, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.4, '#c58bff'); gr.addColorStop(1, 'rgba(120,40,255,0)'); ctx.fillStyle = gr; ctx.fillRect(xx - r, yy - r, r * 2, r * 2); } if (p >= 1 && !e.done) { e.done = 1; this.land(e); } }
      else if (e.k === 'pop') { const R = 120 * ease(p); ctx.globalAlpha = a; ctx.strokeStyle = '#e2ccff'; ctx.lineWidth = 12 * a + 2; ctx.beginPath(); ctx.arc(e.x, e.y, R, 0, 7); ctx.stroke(); if (p < 0.35) { const gg = ctx.createRadialGradient(e.x, e.y, 2, e.x, e.y, 90); gg.addColorStop(0, 'rgba(255,255,255,.95)'); gg.addColorStop(0.4, 'rgba(197,139,255,.7)'); gg.addColorStop(1, 'rgba(120,40,255,0)'); ctx.globalAlpha = 1 - p / 0.35; ctx.fillStyle = gg; ctx.fillRect(e.x - 90, e.y - 90, 180, 180); } }
      else if (e.k === 'tapring') { const R = 50 + 50 * p; ctx.globalAlpha = a * 0.8; ctx.strokeStyle = '#d6b8ff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(e.x, e.y, R, R * 0.5, 0, 0, 7); ctx.stroke(); } }
    ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; this.L = this.L.filter(e => e.t < e.life); },
};
cv.addEventListener('pointerdown', ev => { const p = TAP.world(ev); if (p) TAP.fire(p); });
setInterval(() => { try { if (!st.seen.tapHint && st.stage >= 2 && TAP.ok() && !AUTO && !TRAILER && S.phase === 'battle' && !S.texts.some(t => t.screen && t.age < t.life) && !document.querySelector('#toast .toast')) {   /* 11-17 눈 확인: 싸움 한가운데 큰 글자 · 알림과 겹쳤음 → 조용할 때 아래쪽에 */ st.seen.tapHint = 1; say(L.tapHint || '싸움터를 누르면 지배자가 직접 쏴요!', W / 2, H * 0.6, { size: 30, col: '#f3e8ff', glow: '#8a3cff', life: 2.6, vy: 0, stamp: true, screen: true }); } } catch (e) {} }, 3000);   /* 처음 한 번 알려 줌 */
window.__tap = TAP;   /* 관문이 읽음 */
