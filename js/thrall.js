/* 11-16 순서 #11 「처음 3분 와」 · #12 보스전 재미 — 우리 게임만의 장면: 「잡은 보스가 내 망자 거인으로 일어난다」
   ① 보스를 쓰러뜨리면(승리 도장 뒤) 그 자리에 보라 마법진 → 보스가 보랏빛 망자로 다시 일어나 「망자 거인이 일어났다!」 → 땅속으로 가라앉음
   ② 그 뒤 싸움마다 9초에 한 번 군단 뒤 보라 문에서 망자 거인이 솟아 앞줄 적을 내려찍고 다시 가라앉음(거인 하나당 군단 공격 +3% — logic.js thrallMul)
   그림은 새 보스 띠(foev4)를 좌우로 뒤집고 보랏빛으로 물들여 씀 — 같은 보스가 내 편이 된 게 한눈에 보이게 */
const TH = {
  rise: null, pop: null, cd: 6,
  FILT: 'hue-rotate(235deg) saturate(1.25) brightness(0.82) drop-shadow(0 0 7px rgba(185,95,255,.95))',
  start(x, y) { this.rise = { t: 0, x, y }; S.quietUntil = S.t + 3.6; },   /* 일어나는 동안 피해 숫자 · 작은 글자를 잠재움(거인과 큰 글자만) */
  n() { return (st && st.thralls) || 0; },
  frame(an, k) { const M = VS.foev4; return an === 'idle' ? (S.t * 8) % M.n.idle : k * (M.n.attack - 1); },
  body(x, y, h, an, fi, a, sink) {   /* sink 0~1: 땅 아래로 잠긴 정도(아래부터 잘라 그림) */
    if (!VS.foev4 || !need('foev4_idle') || !need('foev4_attack')) return;
    ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.rect(x - 400, y - 900, 800, 900 + 2); ctx.clip();
    ctx.translate(x, y + sink * h * 1.25); ctx.scale(-1, 1); vsDraw('foev4', an, fi, h, this.FILT, 0, an === 'idle'); ctx.restore();
  },
  gate(x, y, r, a) {   /* 땅의 보라 문(마법진) */
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(1, 0.3);
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, r); g.addColorStop(0, 'rgba(210,140,255,.95)'); g.addColorStop(0.55, 'rgba(140,60,255,.55)'); g.addColorStop(1, 'rgba(60,0,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.rotate(S.t * 1.6); ctx.strokeStyle = 'rgba(230,190,255,.9)'; ctx.lineWidth = 5; ctx.setLineDash([18, 12]); ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  },
  draw() {
    if (typeof st === 'undefined' || !st || TRAILER) return;
    const dt = 1 / 60, R = this.rise;
    if (R) {   /* ① 첫 일어남: 0~0.9 마법진 · 영혼 모임 → 0.9~2.0 솟아오름 · 도장 글자 → 2.0~3.2 포효(숨쉬기) → 3.2~3.9 가라앉음 */
      { const rc = document.getElementById('rcard'); if ((rc && rc.classList.contains('on')) || (!R.t && document.getElementById('modal').style.display === 'flex')) { S.quietUntil = S.t + 3.6; return; } }   /* 새 지역 장 카드가 떠 있으면 기다렸다가 일어남(11-16 영상_망자거인: 1-10 보스 → 「제2장」 카드 뒤에 가려 일어나는 장면이 안 보였음) */
      if (!R.t && typeof BRAG !== 'undefined') BRAG.clipStart();   /* 일어나는 순간 녹화 시작(자랑 창에서 영상으로) */
      R.t += dt; const t = R.t, h = 300;
      { const dm = t < 0.6 ? t / 0.6 : t > 3.3 ? Math.max(0, 1 - (t - 3.3) / 0.6) : 1; if (dm > 0 && typeof VIS !== 'undefined') { ctx.save(); ctx.fillStyle = `rgba(12,0,28,${0.55 * dm})`; ctx.fillRect(VIS.x0, VIS.y0, VIS.x1 - VIS.x0, VIS.y1 - VIS.y0); ctx.restore(); } }   /* 무대 조명: 둘레를 어둡게 해 거인과 글자만 보이게(싸움이 정신없어 글자가 묻혔음 — 11-16 거인_1 사진) */
      if (!R.s0) { R.s0 = 1; Snd.smp && Snd.smp('soul', 0.8, 0, 0.7); S.shake = Math.max(S.shake, 6); }
      this.gate(R.x, R.y, 40 + Math.min(1, t / 0.9) * 170, Math.min(1, t / 0.4) * (t > 3.4 ? Math.max(0, 1 - (t - 3.4) / 0.5) : 1));
      if (t < 1.2 && Math.random() < 0.6) S.parts.push({ x: R.x + rnd(-160, 160), y: R.y + rnd(-10, 10), vx: rnd(-10, 10), vy: rnd(-260, -120), life: 0.9, age: 0, size: rnd(3, 6), col: '#c58bff', g: -30, add: true, kind: 'dot', rot: 0, vr: 0 });
      if (t > 0.9) {
        const k = Math.min(1, (t - 0.9) / 1.1), sink = t < 3.2 ? 1 - ease(k) : Math.min(1, (t - 3.2) / 0.7);
        if (!R.s1) { R.s1 = 1; Snd.slam && Snd.slam(1); S.shake = Math.max(S.shake, 16); punch && punch(0.12, 14, [60, 30, 90]); burst(R.x, R.y - 120, 70, { col: ['#c58bff', '#7a2cff', '#f2e6ff'], vmin: 80, vmax: 520, up: 260, g: 300, lmin: 0.5, lmax: 1.3 }); }
        if (!R.s2 && t > 1.6) { R.s2 = 1; say(L.thrall.rise, W / 2, H * 0.15, { size: 50, col: '#f0dcff', glow: '#9a3cff', life: 2.2, vy: 0, stamp: true, screen: true }); say(L.thrall.sub(this.n()), W / 2, H * 0.15 + 58, { size: 24, col: '#fff', life: 2.2, vy: 0, screen: true }); Snd.cheer && Snd.cheer(); setTimeout(() => typeof heroSay === 'function' && heroSay('win'), 400); }
        this.body(R.x, R.y, h, 'idle', this.frame('idle'), Math.min(1, k * 1.5), sink);
      }
      if (t > 3.9) this.rise = null;
      return;
    }
    if (this.n() <= 0) return;
    const on = S.phase === 'battle' && !UI.awakening && S.foes.some(f => !f.dead && !f.flee && f.x < VX1 - 40);
    const P = this.pop;
    if (!P) { if (on) { this.cd -= dt; if (this.cd <= 0) { this.cd = 9; const fx = Math.min(VX1 - 120, (typeof armyFront === 'function' ? armyFront() : 600) + 40); this.pop = { t: 0, x: Math.max(330, fx - 210), y: 640, fx }; } } return; }
    /* ② 싸움 중 등장: 0~0.45 문 열리며 솟음 → 0.45~1.3 내려찍기(띠 공격 장면) · 닿는 순간 앞줄에 보라 충격파 → 1.3~1.9 가라앉음 */
    P.t += dt; const t = P.t, h = 240;
    this.gate(P.x, P.y, 150, t < 0.3 ? t / 0.3 : t > 1.6 ? Math.max(0, 1 - (t - 1.6) / 0.3) : 1);
    const sink = t < 0.45 ? 1 - ease(t / 0.45) : t > 1.3 ? Math.min(1, (t - 1.3) / 0.5) : 0, k = clamp((t - 0.45) / 0.85, 0, 1);
    this.body(P.x, P.y, h, t < 0.45 ? 'idle' : 'attack', t < 0.45 ? 0 : this.frame('attack', k), 1, sink);
    if (!P.hit && k >= 6 / 15) { P.hit = 1; S.shake = Math.max(S.shake, 10); Snd.slam && Snd.slam(0.8); S.wave = { x: P.fx + 40, y: 600, r: 0 };
      burst(P.fx + 60, 600, 46, { col: ['#c58bff', '#7a2cff', '#ffffff'], vmin: 120, vmax: 620, up: 160, g: 500, lmin: 0.4, lmax: 0.9 });
      for (const f of S.foes) if (!f.dead && !f.flee && f.x < P.fx + 260) { f.flash = 0.2; f.kb = 0.3; }
      const dmg = JB.dps(st) * (JB.thrallMul(st) - 1) * 9; if (dmg > 0) say(fmt(dmg), P.fx + 60, 470, { size: 40, col: '#e9c8ff', glow: '#8a2cff', life: 1.1 }); }
    if (t > 1.9) this.pop = null;
  },
};
