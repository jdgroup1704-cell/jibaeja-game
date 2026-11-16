/* 11-16 23:5x 대표님 다음 할 일 ③ 「큰 기술(지배자 대마법) 더 화려하게」 (11-16 14:46 「마법이 덜 화려」 · 22:1x 「스킬 타격감」)
   대마법 하나에 무대 셋을 더함 — 그림 영상 효과(drawFxSun)는 그대로 두고 그 위아래에 겹침
   ① 영창: 하늘이 갈라지며 보라 번개가 적 무리에 차례로 꽂힘 · 지배자 둘레에 글자 고리가 돎
   ② 이름 외침: 적 발밑에 큰 마법진이 펼쳐지며 돎(땅 위 · 유닛 아래)
   ③ 터짐: 하늘에서 큰 빛기둥 · 사방으로 뻗는 빛살 · 땅 충격파 세 겹 · 화면 위에서 불똥 비 · 화면 안 모든 적이 번쩍이며 뒤로 밀림
   비싼 그림자 흐림(shadowBlur) 없이 겹쳐 그린 반투명 빛만 씀(관문 ㉚ 렉) */
const SPX = {
  L: [], boltT: 0,
  COL: { sun: ['#b06bff', '#ffd27a', '#ffffff'], tide: ['#5cffb0', '#e9fff4', '#ffffff'], graves: ['#5dff8f', '#c8ffd9', '#ffffff'], frozen: ['#6fd3ff', '#e6f9ff', '#ffffff'], bell: ['#ffcf4a', '#fff3c4', '#ffffff'] },
  col() { return this.COL[(typeof st !== 'undefined' && st && st.spell) || 'sun'] || this.COL.sun; },
  foesOn() { return S.foes.filter(f => !f.dead && !f.flee && !f.wait && f.x < VX1 + 10); },
  bolt(x, y) { const pts = []; let px = x + rnd(-60, 60), py = (typeof VIS !== 'undefined' ? VIS.y0 : 0) - 20; const n = 9; for (let i = 0; i <= n; i++) { pts.push([px, py]); const k = (i + 1) / n; px = lerp(px, x, 0.35) + rnd(-38, 38) * (1 - k * 0.6); py = lerp(py, y, 1 / (n - i)); } pts[pts.length - 1] = [x, y];
    this.L.push({ k: 'bolt', pts, life: 0.32, t: 0 }); this.L.push({ k: 'spark', x, y, life: 0.4, t: 0 }); S.shake = Math.max(S.shake || 0, 6);
    burst(x, y - 10, 10, { col: [this.col()[0], '#ffffff'], vmin: 120, vmax: 420, up: 220, g: 600, lmax: 0.5, smin: 2, smax: 5 });
    if (Snd.smp && (this.boltN = (this.boltN || 0) + 1) % 3 === 1) Snd.smp('hit', 0.07, 0, 1.6); },   /* 관문⑱: 0.3초마다 큰 소리면 다른 소리와 겹쳐 깨짐 4 → 세 번에 한 번 · 작게 */
  circle(x, y) { this.L.push({ k: 'circle', x, y, life: 3.2, t: 0 }); },
  blast(x, y) { this.lastBlast = performance.now();
    const sx = x, sy = Math.min(y + 220, 660);   /* 빛기둥이 꽂히는 땅 */
    this.L.push({ k: 'pillar', x: sx, y: sy, life: 1.1, t: 0 });
    this.L.push({ k: 'rays', x, y, life: 1.3, t: 0, rot: rnd(0, 6) });
    for (let i = 0; i < 3; i++) this.L.push({ k: 'shock', x: sx, y: sy, life: 1.0, t: -i * 0.14 });
    for (let i = 0; i < 46; i++) this.L.push({ k: 'ember', x: rnd(VIS.x0, VIS.x1), y: rnd(VIS.y0 - 200, VIS.y0), vy: rnd(260, 520), vx: rnd(-60, 30), life: rnd(1.4, 2.4), t: -rnd(0, 0.5), s: rnd(3, 7) });
    for (const f of this.foesOn()) { f.flash = Math.max(f.flash || 0, 0.35); f.kbT = 0.3; f.x += 40; }
    if (typeof FFX !== 'undefined') for (const f of this.foesOn().slice(0, 6)) FFX.ring(f.x, f.y, this.col()[0], 120, 0.5);
  },
  /* 영창 중 매 프레임: 번개를 적 무리에 차례로(0.28초마다) · 화면이 아주 느린 시간이라 실제 시간(1/60)으로 셈 */
  chant() { if (S.phase !== 'cast' || S.cast < 0) return; const c = S.cast; if (c < TC.r1 || c > TC.flash) return;
    if ((this.boltT -= 1 / 60) > 0) return; this.boltT = TC === TC_LONG ? 0.3 : 0.18;
    const F = this.foesOn(), g = S.giant && S.giant.on && !S.giant.dead ? S.giant : null; const tg = F.length && Math.random() < 0.7 ? F[(Math.random() * F.length) | 0] : g;
    if (tg) this.bolt(tg.x + rnd(-30, 30), tg.y + (tg === g ? 0 : 4)); },
  drawUnder() { if (!this.L.length) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const [c0, c1] = this.col();
    for (const e of this.L) { if (e.k !== 'circle' || e.t < 0) continue; const p = e.t / e.life, gr = ease(Math.min(1, p * 2.2)), a = Math.min(1, p * 4) * Math.max(0, Math.min(1, (1 - p) * 3)), R = 300 * gr * (UK() < 1 ? 0.8 : 1);
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(1, 0.3); ctx.globalAlpha = a * 0.35; const g = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R); g.addColorStop(0, c0); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
      ctx.globalAlpha = a; ctx.strokeStyle = c1; ctx.lineWidth = 6; for (const rr of [1, 0.78, 0.5]) { ctx.beginPath(); ctx.arc(0, 0, R * rr, 0, 7); ctx.stroke(); }
      ctx.rotate(e.t * 1.4); ctx.lineWidth = 4; ctx.strokeStyle = c0; ctx.beginPath(); for (let i = 0; i <= 6; i++) { const an = i * Math.PI * 2 / 6 * 2; const px = Math.cos(an) * R * 0.78, py = Math.sin(an) * R * 0.78; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();   /* 여섯 꼭짓점 별 */
      ctx.rotate(-e.t * 2.6); ctx.fillStyle = c1; for (let i = 0; i < 16; i++) { const an = i * Math.PI * 2 / 16; ctx.save(); ctx.rotate(an); ctx.translate(R * 0.89, 0); ctx.fillRect(-9, -4, 18, 8); ctx.fillRect(-3, -12, 6, 24); ctx.restore(); }   /* 고리 사이 룬 글자 */
      ctx.restore(); }
    ctx.restore(); },
  draw() { this.chant(); if (!this.L.length) return; const dt = 1 / 60, [c0, c1] = this.col(); ctx.save();
    for (const e of this.L) { e.t += dt; if (e.t < 0 || e.k === 'circle') continue; const p = e.t / e.life, a = Math.max(0, 1 - p); ctx.globalCompositeOperation = 'lighter';
      if (e.k === 'bolt') { for (const [w, cc, al] of [[22, c0, 0.25], [9, c0, 0.7], [3, '#ffffff', 1]]) { ctx.globalAlpha = a * al; ctx.strokeStyle = cc; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.beginPath(); e.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); } }
      else if (e.k === 'spark') { const R = 90 * ease(Math.min(1, p * 2)); ctx.globalAlpha = a; const g = ctx.createRadialGradient(e.x, e.y - 20, 2, e.x, e.y - 20, R); g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, c0); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(e.x - R, e.y - 20 - R, R * 2, R * 2); }
      else if (e.k === 'pillar') { const w = 260 * (p < 0.15 ? p / 0.15 : 1 - (p - 0.15) * 0.9), top = VIS.y0 - 10;
        const g = ctx.createLinearGradient(e.x - w / 2, 0, e.x + w / 2, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.3, c0); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.7, c0); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = a * 0.9; ctx.fillStyle = g; ctx.fillRect(e.x - w / 2, top, w, e.y - top); ctx.globalAlpha = a * 0.6; const gg = ctx.createRadialGradient(e.x, e.y, 4, e.x, e.y, w * 1.4); gg.addColorStop(0, '#ffffff'); gg.addColorStop(0.4, c0); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.fillRect(e.x - w * 1.4, e.y - w * 1.4, w * 2.8, w * 2.8); }
      else if (e.k === 'rays') { const L = 1500 * ease(Math.min(1, p * 1.8)); ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.rot + e.t * 0.5); for (let i = 0; i < 14; i++) { ctx.rotate(Math.PI * 2 / 14); const w = (i % 2 ? 26 : 54) * (1 - p * 0.6); ctx.globalAlpha = a * (i % 2 ? 0.25 : 0.4); ctx.fillStyle = i % 3 ? c0 : c1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L, -w); ctx.lineTo(L, w); ctx.closePath(); ctx.fill(); } ctx.restore(); }
      else if (e.k === 'shock') { const R = 760 * ease(Math.min(1, p)); ctx.globalAlpha = a; for (const [w, cc] of [[26 * a + 4, c0], [6, c1]]) { ctx.strokeStyle = cc; ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(e.x, e.y, R, R * 0.24, 0, 0, 7); ctx.stroke(); } }
      else if (e.k === 'ember') { e.x += e.vx * dt; e.y += e.vy * dt; const fa = Math.min(1, e.t * 4) * a; ctx.globalAlpha = fa; ctx.fillStyle = Math.random() < 0.5 ? c1 : c0; ctx.fillRect(e.x - e.s / 2, e.y - e.s * 2, e.s, e.s * 4); ctx.globalAlpha = fa * 0.35; ctx.fillRect(e.x - e.s * 1.5, e.y - e.s * 3, e.s * 3, e.s * 6); }
    }
    ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    this.L = this.L.filter(e => e.t < e.life); if (this.L.length > 220) this.L.splice(0, this.L.length - 220);
  },
};
