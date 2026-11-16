/* 망자병 떼 — 11-16 19:50 대표님 「게임이 엄청 재미없는데 · 초반부터 캐릭터들 어색」
   큰 소환수 넷(펫처럼 · 01:20 지시)은 그대로 두고, 그 앞에서 작은 망자병 떼가 땅을 뚫고 솟아 적에게 달려들어 맞붙음(영혼군단 키우기 참고)
   힘 계산은 그대로(보이는 것만) — 1-1 「일으켜라」 한 번에 2마리씩 솟고, 그 뒤엔 판이 오를수록 10 → 18마리 */
const MN = {
  list: [], cd: 0,
  want() { const r = Math.min(st.raised || 0, JB.C.RAISE_TAPS); if ((st.best || 1) <= 1) return Math.min(14, 2 + r * 2); return Math.min(14, 10 + Math.floor((st.best || 1) / 3)); },
  spawn(n, x, y) {
    for (let i = 0; i < n && this.list.length < 14; i++) {
      const d = Math.random(), m = { x: (x ?? 320 + rnd(0, 140)) + rnd(-50, 50), y: GY0(GROUND + 40, 680, d), d, ph: rnd(0, 7), rise: 0, sw: 0, cd: rnd(0, 0.6), hurt: 0, k: (Math.random() * 3) | 0, born: S.t };
      this.list.push(m);
      burst(m.x, m.y - 4, 12, { col: ['#5a3a2a', '#8a6a4a', '#c58bff', '#e8dcc0'], vmin: 60, vmax: 220, up: 200, g: 520, lmax: 0.7, smin: 2, smax: 5, add: false });   /* 흙 · 뼈 조각이 튀며 솟음 */
      (S.cracks = S.cracks || []).push({ x: m.x, y: m.y, t: 0 });
    }
  },
  walkIn(n) { for (let i = 0; i < n && this.list.length < 14; i++) { const d = Math.random(); this.list.push({ x: VW.x - 60 - i * 40 - rnd(0, 40), y: GY0(GROUND + 40, 680, d), d, ph: rnd(0, 7), rise: 1, sw: 0, cd: rnd(0, 0.6), hurt: 0, k: (Math.random() * 3) | 0, born: S.t }); } },
  update(dt) {
    if (UI.awakening) return;
    const w = this.want(); this.cd -= dt;
    if (this.list.length < w && this.cd <= 0 && S.t > 2 && ((st.best || 1) > 1 || st.raised >= JB.C.RAISE_TAPS || AUTO)) { this.walkIn(Math.min(3, w - this.list.length)); this.cd = 1.2; }
    if (this.list.length > w + 2) this.list.length = w;
    const foes = S.foes.filter(f => !f.dead && !f.flee && !f.wait && f.x < VX1 + 20);
    const line = foes.length ? Math.min(...foes.map(f => f.x)) : null;
    this.list.forEach((m, i) => {
      m.rise = Math.min(1, m.rise + dt * 2.2); m.sw = Math.max(0, m.sw - dt); m.hurt = Math.max(0, m.hurt - dt); m.cd -= dt;
      if (m.rise < 1) return;
      let tx, tgt = null; if (i === 0) for (const f of foes) f.mnN = 0;
      if (line != null) { let best = 1e9; for (const f of foes) { const s = Math.abs(f.y - m.y) * 1.5 + Math.abs(f.x - m.x) * 0.3 + (f.mnN || 0) * 60; if (s < best) { best = s; tgt = f; } } tx = tgt.x - 52 - (tgt.mnN || 0) * 30; tgt.mnN = (tgt.mnN || 0) + 1; }
      else tx = 360 + (i % 6) * 34 + Math.floor(i / 6) * 18 + (typeof LDX === 'function' ? LDX() : 0);
      const dx = tx - m.x, sp = line != null ? 270 : 90; m.px = m.x; m.x += Math.sign(dx) * Math.min(Math.abs(dx), sp * dt);
      if (tgt && Math.abs(dx) < 26 && m.cd <= 0) { m.sw = 0.5; m.cd = rnd(0.45, 0.75); m.tgt = tgt; m.hitAt = 0.22; }
      if (m.hitAt != null && m.sw <= 0.5 - m.hitAt) { const t = m.tgt; m.hitAt = null; if (t && !t.dead) { t.flash = Math.max(t.flash || 0, 0.1); burst(t.x - 20, t.y - 50, 3, { col: ['#e8dcff', '#c58bff', '#ffffff'], vmin: 60, vmax: 200, up: 30, lmax: 0.25, smax: 3 }); MN.hits = (MN.hits || 0) + 1; if (Math.random() < 0.12) m.hurt = 0.25; } }
    });
    if (S.cracks) { for (const c of S.cracks) c.t += dt; S.cracks = S.cracks.filter(c => c.t < 1.2); }
  },
  drawCracks() { for (const c of (S.cracks || [])) { const a = 1 - c.t / 1.2; ctx.save(); ctx.globalAlpha = a * 0.9; ctx.translate(c.x, c.y); ctx.fillStyle = 'rgba(20,6,30,.85)'; ctx.beginPath(); ctx.ellipse(0, 0, 34, 9, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(197,139,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); for (let j = 0; j < 5; j++) { const an = j * 1.26 + 0.3; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an) * 38, Math.sin(an) * 10); } ctx.stroke(); ctx.restore(); } },
  draw(m) {
    const sc = lerp(0.85, 1.12, m.d), at = m.sw > 0, M = VS.sumv1; if (!M || !need('sumv1_idle')) return;
    const mv = Math.abs(m.x - (m.px ?? m.x)), bob = mv > 0.3 ? -Math.abs(Math.sin(S.t * 14 + m.ph)) * 4 : Math.sin(S.t * 2.6 + m.ph) * 0.8;
    ctx.save(); ctx.translate(m.x - (m.hurt > 0 ? 5 : 0), m.y + bob + (1 - m.rise) * 70);
    if (m.rise < 1) { ctx.beginPath(); ctx.rect(-80, -200, 160, 200); ctx.clip(); }   /* 땅 위로만 보이게 — 땅을 뚫고 올라옴 */
    ctx.globalAlpha = Math.min(1, m.rise * 1.6);
    const fi = at ? svAtkF((0.5 - m.sw) / 0.5 * 0.55) * (M.n.attack - 1) / 19 : Math.floor(vsIdle(m.ph, 4, M.n.idle));
    vsDraw('sumv1', at && need('sumv1_attack') ? 'attack' : 'idle', fi, 96 * sc, SV_TINT.d, 0, false);   /* 겹쳐 그리기 없이(렉 · 관문 ㉚) */
    ctx.restore(); ctx.globalAlpha = 1;
  },
  reset() { this.list = []; },
};
