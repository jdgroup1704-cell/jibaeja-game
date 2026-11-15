'use strict';
// 전장에 나오는 수하(11-13 대표님: 「캐릭터가 싸우는 게 보여야 재미를 안다」)
// 진형의 수하가 군단 맨 앞에 서서 각자 때리고, 몇 초마다 자기 기술을 씀. 적마다 체력 막대.
// 숫자는 보여 주기용: 실제 피해 계산은 규칙(logic.js)이 그대로 하고, 여기선 그 몫을 나눠 보여 줌
const HERO_STILL_K = {"krag": 1.134, "porter": 1.03, "serafine": 1.177, "nox": 1.03, "morde": 1.022, "twins": 1.251, "wisp": 1.312, "drummer": 1.334};   /* 11-16 #10 정지 그림 전체 키 / 몸통 키 */
const HF = {
  list: [], shots: [], fx: [],
  /* 수하마다 공격 빠르기 · 기술 간격 · 색 · 기술 모양(베기 · 마법탄 · 범위 · 북) */
  ROLE: { krag: 0, porter: 0, serafine: 1, nox: 1, morde: 2, twins: 2, wisp: 2, drummer: 2 },   /* 11-16 순서 #9 역할: 0 탱커(맨 앞) · 1 근접 · 2 원거리 · 후원(뒤) */
  KIND: {
    serafine: { iv: 1.45, sk: 7, col: '#ff4d6d', fx: 'slash' }, morde: { iv: 2.1, sk: 9, col: '#9b7bff', fx: 'aoe', far: 1 },
    nox: { iv: 1.2, sk: 6, col: '#7cf0ff', fx: 'slash' }, twins: { iv: 1.9, sk: 8, col: '#ff7ae0', fx: 'bolt', far: 1 },
    krag: { iv: 1.75, sk: 8, col: '#e8dcc0', fx: 'slash' }, wisp: { iv: 1.6, sk: 8, col: '#7dffb0', fx: 'bolt', far: 1 },
    drummer: { iv: 1.3, sk: 10, col: '#ffb35a', fx: 'drum' }, porter: { iv: 1.5, sk: 10, col: '#b7d36a', fx: 'aoe' },
  },
  RMUL: { N: 0.6, R: 0.9, SR: 1.3, SSR: 1.8 },
  TIER: [null, '#7dff9a', '#6ab8ff', '#c58bff', '#ffd76a', '#ff5a5a'],   /* 무기 단계 색: 1~2 초록 · 3~4 파랑 · 5~6 보라 · 7~8 금 · 9~10 빨강 */
  sync() {
    const ids = st.squad.filter(Boolean), have = this.list.map(h => h.id).join(), want = ids.join();
    if (have === want) return;
    const old = Object.fromEntries(this.list.map(h => [h.id, h]));
    this.list = ids.map((id, i) => old[id] || { id, x: null, y: 600, upD: i * 0.35,   /* 11-15 순서 #6 「입장 자연스럽게 · 몰림」: 넷이 한 점(120, 560 — 화면 안)에서 겹쳐 나와 한 줄로 걸어오던 것 → 화면 왼쪽 밖에서 한 명씩 간격 두고 자기 줄로 걸어 들어옴 */ hp: 1, atkT: 0.3 + i * 0.27, skT: 3 + i * 1.7, lunge: 0, flash: 0, enter: 0, tgt: null, hurtT: 0 });
  },
  place() {
    const n = this.list.length; if (!n) return;
    let fr = 300; for (const a of S.army) if (!a.fly && a.tx > fr) fr = a.tx; const fx = clamp(fr + 90 + (S.engDx || 0), 470, FAR() ? foeLine() - 40 : 840);   /* 19:55 먼 화면에서 군단이 앞으로 나가 맞붙는데 영웅은 줄 선 자리 기준이라 군단 한가운데 묻혔음 → 맞붙은 앞줄 바로 뒤로 */   /* 돌격으로 앞으로 나간 자리가 아니라 줄 선 자리 기준 */
    const P = [[-150, 600], [-210, 540], [-215, 668], [-270, 610]];   /* 역할 진형(19:41 대표님 「수하가 더 센데 쫄따구 앞에 있음, 무슨 소용」): 쫄따구가 맨 앞에서 막고, 수하는 쫄따구 줄 뒤에서 쏘거나 뛰어들어 베고 돌아옴 */
    const g = S.giant, ring = st.boss && g.on && g.alpha > 0.5 && !g.dead && !g.leaving && (S.phase === 'fight' || S.phase === 'battle' || S.phase === 'prompt');
    /* 보스전: 거인을 둘러쌈 — 앞 · 거인 오른쪽 옆(왼쪽을 보고 다리를 침) · 아래 앞 · 위 앞. 휴대폰 화면 폭(오른쪽 끝 1160) 안에 들게. 끝나면 원래 마름모로 */
    const R = [[-210, 640, 0], [55, 705, 1], [-120, 690, 0], [-235, 545, 0]];
    const ffx = (S.phase === 'battle' || S.phase === 'fight') ? (S.foes.filter(f => !f.dead && !f.flee && !f.fly).reduce((m, f) => Math.min(m, f.x), 1e9)) : 0, PB = [[-100, 712], [-230, 490], [-220, 712], [-300, 600]], big = S.army.some(a => !a.fly && a.big);   /* 11-15 16:01 대표님 「배치 더 넓게, 위아래 대각 여러 개」: 소환수 넷 + 영웅 넷을 세 줄(위 490 · 가운데 600 · 아래 712 — 땅 위아래를 끝까지 씀) 엇갈림 — 앞에서부터 45씩 뒤로, 줄마다 번갈아 → 같은 줄 이웃은 135 떨어짐(director.js SLOT과 짝) */
    if (!ring) {   /* 11-16 00:25 대표님 「완전 따로 포지션 · 가운데가 서브(영웅) · 서브도 탱커 · 중수 · 후미」: 영웅은 앞줄(방패 · 칼 · 창) 뒤 가운데 칸에 역할별로 고정 — 탱커 -195 · 근접 -255 · 원거리 · 후원 -335(같은 역할이 둘이면 35 더 뒤), 줄은 위 · 가운데 · 아래로 나눔. 적에게 뛰어가지 않음 */
      const F0 = (FAR() ? foeLine() - 50 : 740) + clamp(S.engDx || 0, 0, 60), role = h => (this.ROLE[h.id] ?? (((this.KIND[h.id] || {}).far) ? 2 : 1)), ord = this.list.slice().sort((p, q) => role(p) - role(q) || this.list.indexOf(p) - this.list.indexOf(q));
      const HS = [[-220, 490], [-220, 712], [-320, 600], [-440, 728]];   /* 바둑판 칸(director.js SLOT과 짝) — 탱커 · 근접이 앞 칸, 원거리가 뒤 칸 */
      ord.forEach((h, j) => { const q = HS[j] || HS[3]; h.tx = F0 + q[0]; h.ty = q[1]; h.flip = false; });
      this.ring = ring; this.rise(); return;
    }
    this.list.forEach((h, i) => { if (!ring && big) { const q = PB[i] || PB[0]; h.tx = fx + q[0]; h.ty = q[1]; h.flip = false; if (!(this.KIND[h.id] || {}).far && ffx && ffx < 1e8) { const mi = this.list.filter((o, j) => j < i && !(this.KIND[o.id] || {}).far).length; h.tx = Math.max(h.tx, ffx - 95 - mi * 55); h.ty = [712, 600, 490, 650][mi] ?? h.ty; } return; }   /* 11-15 순서 #6: 근접 영웅 둘(세라핀 · 녹스)이 같은 자리(앞 95 · 아래 줄 712)에 딱 포개져 한 명처럼 보였음(포개짐 34%) → 근접끼리 55씩 뒤로 · 줄도 아래 · 가운데 · 위로 나눔 */   /* 11-15 22:50 대표님 「움직임이 자꾸 이상」 · 느린 영상: 근접 영웅이 때릴 때마다 뛰어갔다 제자리로 튕겨 돌아옴(요요) → 적이 있으면 적 맨 앞줄 앞까지 걸어가 그 자리에서 계속 벰(버섯커처럼) */ if (ring) { const q = R[i] || R[0]; h.tx = g.x + q[0]; h.ty = q[1]; h.flip = !!q[2]; } else { const q = P[i] || P[0]; h.tx = fx + q[0]; h.ty = q[1]; h.flip = false; } });
    this.ring = ring; this.rise();
  },
  rise() {   /* 11-16 순서 #9: 새 영웅은 왼쪽에서 걸어오다 궁수 · 다른 영웅 몸을 뚫고 지나갔음(진형재기 겹침 14%) → 자기 칸 땅에서 보랏빛 원과 함께 차례로 솟아오름 */
    for (const h of this.list) if (h.x == null && h.tx != null) { h.x = h.tx; h.y = h.ty; h.enter = -(h.upD || 0) * 1.5; burst(h.x, h.y - 20, 16, { col: ['#c9a7ff', '#7a3cff', '#ffffff'], vmin: 40, vmax: 200, up: 220, g: -40, lmax: 0.8 }); }
  },
  tags: [],
  drawTags() {   /* 영웅 이름표: 위에서부터 놓고, 먼저 놓인 표와 겹치면 그 아래로 한 칸씩 비킴(최대 6번) */
    const T = this.tags; this.tags = []; if (!T.length || S.phase === 'cast') return; T.sort((p, q) => p.m.f - q.m.f); const placed = [];
    if (!TRAILER && S.phase !== 'cast') { const M = ctx.getTransform(), fz = Math.round(13 * Math.min(WK(), 2.2)); ctx.save(); ctx.font = `900 ${fz}px ${SERIF}`; const w = ctx.measureText('♛ ' + L.ui.lordTag).width + fz * 1.6; ctx.restore(); placed.push({ x: M.a * (230 + LDX() - w / 2) + M.e, y: M.d * (614 - fz * 0.8) + M.f, w: w * M.a, h: fz * 1.6 * M.d }); }   /* 지배자 이름표 자리도 피함 */
    { const cr = cv.getBoundingClientRect(), kx = cv.width / (cr.width || 1), ky = cv.height / (cr.height || 1); for (const b of document.querySelectorAll('#slots > *, #raiseBtn, #cast, #chatpv.on')) { const r = b.getBoundingClientRect(); if (!r.width || getComputedStyle(b).display === 'none' || getComputedStyle(b).visibility === 'hidden') continue; placed.push({ x: (r.left - cr.left) * kx, y: (r.top - cr.top) * ky, w: r.width * kx, h: r.height * ky, dom: 1 }); } }   /* 11-15 눈 확인: 이름표가 부활 · 태양 단추 밑에 깔렸음 → 전장 위 단추 자리도 피함 */
    ctx.save();
    for (const g of T) { const m = g.m; ctx.setTransform(m.a, 0, 0, m.d, m.e, m.f); ctx.font = `800 ${g.fz}px sans-serif`; const tw = ctx.measureText(g.nt).width + g.fz * 0.9, th = g.fz * 1.36;
      const x0 = m.e - tw / 2 * m.a, y0 = m.f + (g.ty - g.fz * 0.68) * m.d, w = tw * m.a, hh = th * m.d; let dy = 0;
      const hitAt = (d, e = 0) => placed.find(p => x0 + e < p.x + p.w && x0 + e + w > p.x && y0 + d < p.y + p.h && y0 + d + hh > p.y); let dx = 0;
      if (hitAt(0)) { const st2 = hh + 1.5 * m.d, CAND = []; for (const k of [1, 2, 3, 4]) for (const e of [0, 0.55, -0.55]) for (const d of [k * st2, -k * st2]) CAND.push([d, e * w]); for (const e of [0.6, -0.6, 1.1, -1.1]) CAND.push([0, e * w]); CAND.sort((p, q) => Math.hypot(p[0], p[1] * 0.7) - Math.hypot(q[0], q[1] * 0.7)); const ok = CAND.find(([d, e]) => !hitAt(d, e)); if (ok) { dy = ok[0]; dx = ok[1]; } }   /* 11-15 눈 확인: 위아래로만 비키다 지배자 발밑까지 줄줄이 내려가 주인과 멀어짐 → 옆으로도 반 칸 비키며 가장 가까운 빈자리 */
      placed.push({ x: x0 + dx, y: y0 + dy, w, h: hh }); ctx.setTransform(m.a, 0, 0, m.d, m.e + dx, m.f + dy);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = g.a; ctx.fillStyle = 'rgba(12,4,22,.78)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-tw / 2, g.ty - g.fz * 0.68, tw, th, g.fz * 0.68) : ctx.rect(-tw / 2, g.ty - g.fz * 0.68, tw, th); ctx.fill();
      ctx.strokeStyle = g.line; ctx.globalAlpha = g.a * (g.rt >= 2 ? 1 : 0.7); ctx.lineWidth = g.rt >= 2 ? 2.5 : 1.5; if (g.rt === 3) { ctx.shadowColor = g.RC; ctx.shadowBlur = 10; } ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = g.a; ctx.fillStyle = g.txt; ctx.fillText(g.nt, 0, g.ty + 0.5); }
    ctx.restore(); ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
  },
  front() { let m = 0; for (const h of this.list) m = Math.max(m, h.x + 40); return m; },
  /* 11-15 10:50 「크라그 돌진이 소환수 줄에 겹침」(느린 영상: 크라그가 칼 소환수 바로 위 781,655 ↔ 784,672에 내려앉음, 세라핀은 창 소환수를 뚫고 지나감)
     → 영웅이 뛰어들 자리를 소환수 · 다른 영웅이 서 있지 않은 칸으로 고르고(앞뒤 · 위아래 몇 칸 중 가장 덜 겹치는 곳), 큰 소환수 위로는 껑충 뛰어넘어 감 */
  dashTo(h, tx, ty, maxDx) {
    const big = S.army.some(a => !a.fly && a.big), occ = S.army.filter(a => !a.fly && a.rise >= 1).map(a => [a.x, a.y, a.big ? 95 : 55]);
    for (const o of this.list) if (o !== h) occ.push(o.dash ? [o.x + o.dash.dx, o.y + o.dash.dy, 80] : [o.x, o.y, 70]);   /* 11-15 대표님 「뭉쳐 보여」: 서 있는 다른 영웅 자리도 피함 */
    let best = null, bs = 1e9;
    for (const ox of [0, 60, 110, -50]) for (const oy of [0, 50, -50, 80, -80, 120, -120]) {
      const lx = h.x + clamp(tx + ox - h.x, 0, maxDx), ly = clamp(ty + oy, 485, 730);   /* 11-15 세 줄 배치(490~712)에 맞춰 위아래로 더 넓게 */
      let pen = Math.abs(ox) * 0.3 + Math.abs(oy) * 0.4; for (const [x, y, r] of occ) { const ddx = Math.abs(lx - x), ddy = Math.abs(ly - y); if (ddx < r * 0.75 && ddy < 45) pen += (r * 0.75 - ddx) * 6 + (45 - ddy) * 3; }
      if (pen < bs) { bs = pen; best = [lx - h.x, ly - h.y]; } }
    const jump = big ? 70 : 28;   /* 큰 소환수 줄 위로 껑충 · 11-15 줄이 없어도 낮게 한 번 뛰어 들어감(미끄러져 보이지 않게) */
    return { dx: best[0], dy: best[1], jump };
  },
  /* 지금 때릴 것: 거대한 적이 있으면 거인, 아니면 가장 가까운 살아 있는 적 */
  target(h) {
    const g = S.giant;
    if (st.boss && g.alpha > 0.5 && !g.dead) return { x: g.x + (h.flip ? 30 : -90), y: h.y - 70, giant: true };
    const far = (this.KIND[h.id] || {}).far;
    if (false && !far && S.army.some(a => !a.fly && a.big)) {   /* 11-15 21:55 대표님이 보내 주신 버섯커 영상: 우리 편은 왼쪽 한 덩어리 · 적은 오른쪽 — 뒤치기로 적 뒷줄에 뛰어들면 우리 · 적이 뒤섞임(진영섞임 잼) → 끔 */   /* 11-15 뒤치기(제 추천, 대표님 「니 추천은 너 알아서」): 앞줄은 소환수 4마리 몫 → 근접 영웅은 적 무리 뒷줄(궁수 · 사제 쪽, 가장 뒤 적)로 뛰어들어 침. 앞줄이 덜 붐비고 영웅이 특별해 보임 */
      let bk = null; for (const f of S.foes) { if (f.dead || f.flee || f.fly || f.x > VX1 - 70) continue; if (!bk || f.x > bk.x) bk = f; }
      if (bk) return { x: bk.x, y: bk.y - 34, foe: bk, back: true }; }
    let best = null, bd = 1e9; for (const f of S.foes) { if (f.dead || f.flee) continue; const d = Math.abs(f.x - h.x) + Math.abs(f.y - h.y) * 0.6 - (far && f.fly ? 2000 : 0); if (d < bd) { bd = d; best = f; } }   /* 원거리 수하는 날개 적부터 쏨 */
    return best ? { x: best.x, y: best.y - 34 - (best.fly ? 150 : 0), foe: best } : null;
  },
  share(h) { const r = JB.heroById(h.id).rarity, o = st.heroes[h.id]; return 0.12 * this.RMUL[r] * (1 + 0.2 * ((o && o.lv) || 1)) * (1 + 0.25 * ((o && o.wp) || 0)); },
  hit(h, mul, big) {
    const t = this.target(h); if (!t) return false;
    const k = this.KIND[h.id] || this.KIND.krag, crit = !big && Math.random() < 0.15;
    const dmg = JB.dps(st) * this.share(h) * k.iv * mul * (crit ? 2 : 1);
    const land = () => {   /* 닿는 순간: 숫자 · 터짐 · 번쩍 */
      const jx = rnd(-26, 26), jy = rnd(-22, 10);
      say(fmtD(dmg), t.x + jx, t.y - 10 + jy, { size: big ? 40 : crit ? 30 : 22, col: big ? k.col : crit ? '#ffe14d' : '#ffffff', glow: big ? k.col : crit ? '#ff9d2a' : null, life: big ? 1.1 : 0.8, vy: -70 });
      if (crit) { say(L.field.crit, t.x + jx, t.y - 44 + jy, { size: 16, col: '#ffe14d', life: 0.7, vy: -60 }); punch(0.035, 3, 0); Snd.smp && Snd.smp('slam', 0.12, 0, 1.9); }
      if (!crit && !big) punch(0.055, 2.5, 0);   /* 11-15 19:30 영웅 평타 = 묵직한 한 방(멈칫 0.055 · 0.85초에 한 번까지) */ if (big) { punch(0.08, 6, 25); Snd.smp && Snd.smp('hit', 0.55, 0, rnd(0.65, 0.8)); } else if (Snd.smp && Math.random() < 0.5) Snd.smp('hit', 0.18, 0, rnd(0.9, 1.35));   /* 타격음 높이를 매번 다르게 */
      burst(t.x, t.y, big ? 18 : 5, { col: [k.col, '#ffffff'], vmin: 40, vmax: big ? 320 : 160, up: 60, lmax: big ? 0.6 : 0.35 });
      if (t.foe) t.foe.flash = 0.15;
      if (!k.far) this.fx.push({ kind: 'slash', x: t.x - 10, y: t.y, age: 0, life: 0.22, col: k.col, big });
    };
    h.swg = 0; h.swgL = k.far ? 0.45 : 0.52; h.swgB = big ? 1.35 : 1; h.ka = 0;   /* 때리기 영상 시작(0.9초: 젖히기 0.4 · 내려침 0.15 · 돌아오기 0.35 — 6번째 장이 닿는 순간 = 돌진 끝 0.42초쯤) */   /* 윗몸 휘두르기 시작 */
    if (k.far) { this.shots.push({ x: h.x + (h.flip ? -30 : 30), y: h.y - 110, tx: t.x, ty: t.y, age: 0, life: big ? 0.35 : 0.45, col: k.col, big, land }); h.lunge = 0.2; }
    else if (h.flip) h.dash = { age: 0, life: 0.42, dx: -70, dy: clamp(t.y + 40 - h.y, -60, 60), land, hit: false };
    else if (!t.giant && Math.abs((t.x - 70) - h.x) < 110) { h.dash = { age: 0, life: 0.8, dx: 22, dy: 0, land, hit: false }; }   /* 이미 적 앞에 서 있으면 뛰지 않고 그 자리에서 한 걸음 내디디며 벰 — 닿는 순간 0.4초 = 때리기 영상 6번째 장(내려침) */
    else if (!this.ring) { this.shots.push({ x: h.x + 40, y: h.y - 90, tx: t.x, ty: t.y - 20, age: 0, life: big ? 0.3 : 0.36, col: k.col, big, land, wave: 1 }); h.lunge = 0.25; h.dash = { age: 0, life: 0.5, dx: 14, dy: 0, land: () => {}, hit: true }; }   /* 11-16 순서 #9: 앞줄 뒤 자기 칸에서 검기를 날림(뛰어갔다 돌아오기 없음) */
    else { const ff = this.foesLive ? this.foesLive() : S.foes.filter(f => !f.dead && !f.flee), fr = ff.length ? Math.min(...ff.map(f => f.x)) : t.x; const q = this.dashTo(h, Math.min(t.x - 60, fr - 55), h.y + clamp(t.y + 40 - h.y, -24, 24), 260);   /* 적 맨 앞줄 앞에서 멈춰 베기(적 사이로 안 들어감) · 위아래는 조금만 */ h.dash = { age: 0, life: t.back ? 0.62 : q.jump ? 0.5 : 0.42, dx: q.dx, dy: q.dy, jump: q.jump, land, hit: false }; }
    return true;
  },
  ult(h, k) {   /* 11-15 최고 등급 ★7 궁극기: 화면이 붉게 물들고 영웅 뒤로 거대한 영혼이 솟아 적 무리 전체를 벰 */
    const fs = this.foesLive(); if (!fs.length || UI.awakening) return;
    say(L.star.ult[h.id] || L.star.ultAny, W / 2, 210, { size: 44, col: '#fff0f0', glow: '#ff2040', life: 1.6, vy: 0, stamp: true, screen: true });
    S.tint = { col: '200,20,40', a: 0.32 }; S.shake = Math.max(S.shake || 0, 14); S.hitstop = Math.max(S.hitstop || 0, 0.08);
    LM.fx.push({ kind: 'nova', hit: true, x: h.x, y: h.y - 90, age: 0, life: 1.3, col: '#ff3a4a', big: true });
    for (const f of fs) { f.flash = 0.4; burst(f.x, f.y - 50, 18, { col: ['#ff3a4a', '#ffffff', k.col], vmin: 100, vmax: 420, up: 80, lmax: 0.6 }); }
    this.num(fs[0].x + 60, fs[0].y - 140, 14, '#ff3a4a'); Snd.smp && Snd.smp('boom', 0.6);
  },
  skill(h) {
    const k = this.KIND[h.id] || this.KIND.krag, name = L.field.skills[h.id];
    if (!this.target(h)) return;
    if (!UI.cutIn || !UI.cutIn(h.id, name, k.col)) say(name, h.x, h.y - 150, { size: 24, col: '#ffffff', glow: k.col, life: 1.1, vy: -20 });   /* 19:38 영웅 기술 = 얼굴 그림이 옆에서 쓱 들어오는 컷인(장르 공식). 4초에 한 번만, 나머지는 작은 글자 */
    { const tier = { N: 0, R: 1, SR: 2, SSR: 3 }[JB.heroById(h.id).rarity] || 0; if (tier >= 2) { LM.fx.push({ kind: 'nova', hit: true, x: h.x, y: h.y - 70, age: 0, life: tier >= 3 ? 1.0 : 0.7, col: k.col, big: tier >= 3 }); burst(h.x, h.y - 80, tier >= 3 ? 48 : 24, { col: [k.col, '#ffffff'], vmin: 120, vmax: tier >= 3 ? 560 : 380, up: 220, lmax: 0.8 }); S.flash = Math.max(S.flash || 0, tier >= 3 ? 0.22 : 0.1); if (tier >= 3) { S.shake = Math.max(S.shake || 0, 8); punch(0.06, 0); } } }   /* 22:58 대표님 「뽑아서 강한 건 스킬이 화려하고」: 상급 · 최고 등급 영웅은 기술 때 빛기둥 · 충격파 · 불꽃이 훨씬 크게 */
    if (this.UNIQ[h.id]) this.UNIQ[h.id].call(this, h, k);   /* 11-14 대표님 「다양한 캐릭 스킬」: 수하마다 다른 기술 */
    else if (k.fx === 'drum') { for (const a of S.army) if (!a.fly && Math.random() < 0.6) a.hop = 0.6; Snd.stamp && Snd.stamp(0.4); this.hit(h, 3, true); }
    else if (k.fx === 'aoe') { let n = 0; for (const f of S.foes) { if (f.dead || f.flee || n > 3) continue; n++; burst(f.x, f.y - 30, 14, { col: [k.col, '#ffffff'], vmin: 60, vmax: 300, up: 80, lmax: 0.6 }); } this.hit(h, 4, true); Snd.rumble && Snd.rumble(0.6); }
    else { this.hit(h, 5, true); S.shake = Math.max(S.shake, 4); }
    h.flash = 0.5; h.lunge = 0.4;
    { const sr = JB.heroStar(st.heroes[h.id]);   /* 11-15 별마다 기술이 바뀜(대표님 17:42) */
      if (sr >= 3) { const n = typeof raiseFallen === 'function' ? raiseFallen() : 0; if (n) say(L.star.rise(n), h.x, h.y - 190, { size: 15, col: '#d6b8ff', life: 0.9, vy: -30 }); }
      if (sr >= 5 && this.UNIQ[h.id]) setTimeout(() => { if (!UI.awakening && S.phase === 'battle' && this.foesLive().length) { this.UNIQ[h.id].call(this, h, k); say(L.star.twice, h.x, h.y - 170, { size: 14, col: '#ffe08a', life: 0.7, vy: -30 }); } }, 650);
      if (sr >= 7 && JB.heroById(h.id).rarity === 'SSR' && (h.ultN = (h.ultN || 0) + 1) % 3 === 0) setTimeout(() => this.ult(h, k), 900); }
    if (Snd.smp) Snd.smp('hit', 0.5, 0, rnd(0.8, 1));
  },
  foesLive() { return S.foes.filter(f => !f.dead && !f.flee && f.x < VX1 + 40); },
  num(x, y, mul, col, big) { say(fmtD(JB.dps(st) * 0.12 * mul * rnd(0.85, 1.15)), x + rnd(-16, 16), y, { size: big ? 34 : 24, col: '#ffffff', glow: col, life: 0.9, vy: -60 }); },
  /* 수하 8명 고유 기술 — 모양 · 효과가 다 다름. 피해 계산은 규칙이 그대로, 여기선 보여 주기 + 작은 덤(회복 · 해골 일으키기 · 공격 빨라짐 · 영혼) */
  UNIQ: {
    serafine(h, k) {   // 피의 일섬: 화면을 가로지르는 붉은 일섬이 줄 위 적을 모두 베고, 수하들 체력을 조금 채움
      const fs = this.foesLive(); if (!fs.length) return this.hit(h, 5, true); const y = fs[0].y - 60;
      this.fx.push({ kind: 'bladeline', x0: h.x, x1: VX1 + 60, y, age: 0, life: 0.6, col: k.col });
      fs.forEach((f, i) => setTimeout(() => { if (f.dead) return; f.flash = 0.3; burst(f.x, f.y - 50, 10, { col: ['#ff2a4a', '#ffffff'], vmin: 80, vmax: 300, up: 60, lmax: 0.5 }); if (i < 4) this.num(f.x, f.y - 90, 4, k.col, i === 0); }, 60 + i * 40));
      for (const o of this.list) o.hp = Math.min(1, o.hp + 0.15); { const q = this.dashTo(h, fs[0].x - 40, h.y, 320); h.dash = { age: 0, life: 0.5, dx: q.dx, dy: q.dy, jump: q.jump, land: () => {}, hit: false }; } S.shake = Math.max(S.shake, 5);
    },
    morde(h, k) {   // 영혼 폭발: 적 무리 한가운데 보라 영혼이 터지고, 쓰러진 해골 둘이 바로 일어남
      const fs = this.foesLive(); if (!fs.length) return this.hit(h, 4, true); const cx = fs.reduce((a, f) => a + f.x, 0) / fs.length, cy = fs.reduce((a, f) => a + f.y, 0) / fs.length - 50;
      this.fx.push({ kind: 'soulburst', x: cx, y: cy, age: 0, life: 1.0, col: k.col });
      setTimeout(() => { for (const f of fs) { f.flash = 0.25; } burst(cx, cy, 40, { col: ['#c58bff', '#ffffff', '#5a2aaa'], vmin: 80, vmax: 460, up: 120, lmax: 0.8 }); this.num(cx, cy - 60, 6, k.col, true); S.shake = Math.max(S.shake, 8); }, 350);
      if (S.fallen) { let n = 0; for (const c of S.fallen) if (c.t < 3 && n < 2) { c.t = 3; n++; } if (n) say(L.field.raised(n), h.x, h.y - 190, { size: 18, col: '#d8c0ff', life: 1, vy: -30 }); }
      Snd.rumble && Snd.rumble(0.6);
    },
    nox(h, k) {   // 그림자 찌르기: 맨 뒤 적(사제 · 궁수) 뒤로 순간이동해 찌르고 돌아옴, 잔상 셋
      const fs = this.foesLive(); if (!fs.length) return this.hit(h, 5, true); const t = fs.slice().sort((a, b) => b.x - a.x)[0];
      for (let j = 0; j < 3; j++) this.fx.push({ kind: 'ghost', id: h.id, x: lerp(h.x, t.x + 40, j / 3), y: lerp(h.y, t.y, j / 3), age: -j * 0.05, life: 0.5, col: k.col });
      this.fx.push({ kind: 'xcut', x: t.x, y: t.y - 60, age: 0, life: 0.45, col: k.col });
      setTimeout(() => { if (!t.dead) { t.flash = 0.4; burst(t.x, t.y - 50, 14, { col: ['#7cf0ff', '#ffffff', '#102030'], vmin: 80, vmax: 320, up: 60, lmax: 0.5 }); this.num(t.x, t.y - 100, 8, k.col, true); say(L.field.backstab, t.x, t.y - 140, { size: 18, col: '#bff8ff', life: 0.8, vy: -40 }); } }, 120);
    },
    twins(h, k) {   // 쌍둥이 저주: 적 둘에 저주 표식 — 5초 동안 맞을 때마다 보라 숫자가 한 번 더
      const fs = this.foesLive().sort(() => Math.random() - 0.5).slice(0, 2); if (!fs.length) return this.hit(h, 4, true);
      for (const f of fs) { f.curse = 5; this.shots.push({ x: h.x + 20, y: h.y - 110, tx: f.x, ty: f.y - 60, age: 0, life: 0.4, col: k.col, big: true, land: () => { f.flash = 0.3; this.num(f.x, f.y - 90, 4, k.col); } }); }
    },
    krag(h, k) {   // 뼈의 돌격: 크라그를 따라 앞줄 해골 여덟이 함께 돌격, 적을 밀어냄
      const fs = this.foesLive(); this.hit(h, 5, true); let n = 0; for (const a of S.army.filter(a => !a.fly && a.rise >= 1).sort((a, b) => b.x - a.x)) { if (n++ >= 8) break; a.charge = 0.7; a.hop = 0.5; }
      for (const f of fs.slice(0, 4)) { f.kb = 0.4; f.x += 50; burst(f.x, f.y - 30, 6, { col: ['#e8dcc0', '#ffffff'], vmin: 60, vmax: 220, up: 60, lmax: 0.4 }); }
      this.fx.push({ kind: 'dustline', x: h.x, y: h.y, age: 0, life: 0.8, col: k.col }); S.shake = Math.max(S.shake, 7); Snd.stamp && Snd.stamp(0.5);
    },
    wisp(h, k) {   // 도깨비 불꽃: 초록 불꽃 다섯이 적 사이를 튕기며 돌아다님
      const fs = this.foesLive(); if (!fs.length) return this.hit(h, 4, true);
      for (let j = 0; j < 5; j++) { const path = [{ x: h.x, y: h.y - 100 }]; for (let q = 0; q < 3; q++) { const f = fs[(j + q * 2) % fs.length]; path.push({ x: f.x + rnd(-20, 20), y: f.y - 60 + rnd(-20, 20), f }); }
        this.fx.push({ kind: 'wisp', path, age: -j * 0.12, life: 1.3, col: k.col, hits: 0 }); }
    },
    drummer(h, k) {   // 진군의 북소리: 북소리 고리가 퍼지고, 6초 동안 군단 공격이 빨라짐(해골들이 들썩)
      for (const a of S.army) if (!a.fly && Math.random() < 0.8) a.hop = 0.6; S.drum = 6; Snd.stamp && Snd.stamp(0.5);
      for (let j = 0; j < 3; j++) this.fx.push({ kind: 'ring', x: h.x, y: h.y - 60, age: -j * 0.18, life: 0.9, col: k.col });
      say(L.field.drumBuff, h.x, h.y - 190, { size: 18, col: '#ffd9a0', life: 1.2, vy: -30 }); this.hit(h, 2, true);
    },
    porter(h, k) {   // 시체 던지기: 시체 자루를 크게 던져 뼛조각이 터지고, 영혼을 덤으로 주움
      const fs = this.foesLive(); if (!fs.length) return this.hit(h, 4, true); const t = fs[Math.min(fs.length - 1, 1)];
      this.shots.push({ x: h.x, y: h.y - 120, tx: t.x, ty: t.y - 40, age: 0, life: 0.7, col: k.col, big: true, sack: true, land: () => { for (const f of fs) if (Math.abs(f.x - t.x) < 160) f.flash = 0.25; burst(t.x, t.y - 30, 30, { col: ['#e8dcc0', '#b7d36a', '#6a5a30'], vmin: 80, vmax: 420, up: 200, g: 500, lmax: 0.8, add: false }); this.num(t.x, t.y - 90, 5, k.col, true); const add = Math.max(1, Math.round(JB.waveSouls(Math.max(1, st.stage)) * 0.5));   /* 무리 하나 영혼의 절반 */ st.souls += add; say('+' + fmt(add) + ' ' + L.field.soul, t.x, t.y - 140, { size: 18, col: '#d8f0a0', life: 1.1, vy: -40 }); S.shake = Math.max(S.shake, 5); } });
    },
  },
  skelHurt(a) {   /* 쫄따구가 맞음: 움찔 + 작은 빨간 숫자, 4번에 1번쯤 부서짐(뼈 조각 튐) → 무덤에서 새 해골이 일어나 줄을 채움 */
    a.hurt = 0.25; a.flash = 0.12; a.vh = Math.max(0.12, (a.vh ?? 1) - rnd(0.15, 0.32)); a.hbT = 2.5; S.shieldHits = (S.shieldHits || 0) + 1;   /* 18:42 체력 막대: 맞으면 머리 위에 2.5초 보였다 사라짐(보여주기 체력, 천천히 다시 참) */
    burst(a.x + 8, a.y - 60, 4, { col: ['#ffffff', '#ff8a8a'], vmin: 60, vmax: 200, up: 40, lmax: 0.22 });
    if (Math.random() < 0.12) say('-' + fmtD(Math.max(1, JB.dps(st) * 0.01 * rnd(0.7, 1.3))), a.x + rnd(-10, 10), a.y - 70, { size: 16, col: '#ff6a6a', life: 0.6, vy: -50 });
    if (!a.evo && a.rf == null && Math.random() < (a.big ? (S.t - (a.bornT ?? -99) < 6 ? 0 : 0.05) : 0.25)) { a.gone = true; skelFall(a);   /* 11-16 순서 #9: 큰 소환수는 쓰러지면 3초 칸이 빔 → 25%면 앞줄이 늘 비어 있었음(잰 값) → 5% · 다시 솟은 뒤 6초는 안 쓰러짐 */   /* 진화한 놈 · 부활한 병사는 안 부서짐 */ S.skelDown = (S.skelDown || 0) + 1; burst(a.x, a.y - 30, 10, { col: ['#e8dcc0', '#bfb59a'], vmin: 60, vmax: 220, up: 120, g: 600, lmax: 0.7, smin: 2, smax: 5, add: false }); }
  },
  /* 수하가 맞음: 빨간 숫자 · 뒤로 밀림 · 붉은 번쩍 · 체력 막대가 깎였다가 다시 참 */
  hurt(h, mul, big) {
    const dmg = Math.max(1, JB.dps(st) * 0.03 * mul * rnd(0.7, 1.3));
    h.hp = Math.max(0.3, h.hp - (big ? rnd(0.12, 0.2) : rnd(0.04, 0.09))); h.hurtT = big ? 0.3 : 0.2; h.kb = big ? 0.35 : 0.22; if (big) { S.shake = Math.max(S.shake || 0, 7); punch(0.05, 0); }
    say('-' + fmtD(dmg), h.x + rnd(-18, 18), h.y - 120 + rnd(-10, 10), { size: big ? 34 : 24, col: '#ff4a4a', glow: big ? '#ff0000' : null, life: 0.75, vy: -60 });
    burst(h.x + 10, h.y - 70, big ? 10 : 4, { col: ['#ff3030', '#ffffff'], vmin: 30, vmax: big ? 220 : 120, up: 40, lmax: 0.3 });
  },
  update(dt) {
    this.sync(); this.place();
    const fight = (S.phase === 'battle' || S.phase === 'fight') && !UI.awakening;
    for (const h of this.list) {
      h.enter = Math.min(1, h.enter + dt * 1.5); h.ea = clamp(h.enter, 0, 1);
      { const ox = h.x, oy = h.y; if (Math.abs(h.tx - h.x) > 14) h.x += Math.sign(h.tx - h.x) * Math.min(Math.abs(h.tx - h.x) - 10, (Math.abs(h.tx - h.x) > 260 ? 230 : 110) * dt);   /* 멀리서 들어올 땐 빠른 걸음 */ if (Math.abs(h.ty - h.y) > 8) h.y += Math.sign(h.ty - h.y) * Math.min(Math.abs(h.ty - h.y) - 6, 75 * dt); const v = Math.hypot(h.x - ox, (h.y - oy) * 1.6) / Math.max(dt, 1e-3);   /* 11-15 대표님 「크라그는 밑에서 앞으로 걷는 게 아니라 스르르 미끄러져」: 위아래로 옮길 땐 걸음(들썩 · 기우뚱) 없이 미끄러졌음 → 위아래도 일정한 걸음 빠르기 + 걸음 흔들림 */ h.wamp = lerp(h.wamp || 0, v > 12 ? 1 : 0, Math.min(1, dt * 10)); h.wph = (h.wph || 0) + dt * 11 * (h.wamp > 0.1 ? 1 : 0); h.wf = ((h.wf || 0) + Math.min(v, 160) * dt * 16 / 80) % 16; }   /* 걷기 영상: 80 걸으면 한 바퀴(16장) */   /* 21:58 대표님 「밀리는 애」: 영웅이 그림 한 장째로 미끄러지던 것 → 일정한 걸음 빠르기로 걷고, 걸을 땐 걸음마다 들썩 · 기우뚱. 조금 벗어난 건 그 자리에 서 있음 */
      h.lunge = Math.max(0, h.lunge - dt); h.flash = Math.max(0, h.flash - dt);
      if (h.swg != null) { h.swg += dt; if (h.swg >= h.swgL) h.swg = null; } if (h.ka != null) { h.ka += dt; if (h.ka >= 0.9) h.ka = null; }
      if (h.dash && fight) { const d = h.dash; d.age += dt; if (!d.hit && d.age >= d.life * 0.5) { d.hit = true; d.land(); } if (d.age >= d.life) h.dash = null; }
      if (!fight) { h.dash = null; continue; }
      h.atkT -= dt; h.skT -= dt;
      const k = this.KIND[h.id] || this.KIND.krag;
      if (h.atkT <= 0) { h.atkT = k.iv * rnd(0.85, 1.15); this.hit(h, 1, false); }
      if (h.skT <= 0) { h.skT = k.sk * rnd(0.9, 1.1); this.skill(h); }
      /* 적 반격: 앞줄 쫄따구가 있으면 쫄따구가 막고 맞음(아래 shieldHits), 쫄따구가 없을 때만 수하가 맞음 */
      h.kb = Math.max(0, (h.kb || 0) - dt);
      const wall = S.army.some(a => !a.fly && a.rise >= 1 && a.x > h.x + 40 && Math.abs(a.y - h.y) < 170);   /* 11-16 순서 #9: 내 앞(같은 쪽 줄)에 서 있는 소환수가 막아 줄 때만 안 맞음 — 앞줄이 무너지면 영웅이 맞음 */
      const foe = wall ? null : S.foes.find(f => !f.dead && !f.flee && f.x - h.x > -40 && f.x - h.x < 200 && Math.abs(f.y - h.y) < 110 && !(f.atk > 0));
      h.hitT = (h.hitT == null ? rnd(0.6, 1.4) : h.hitT) - dt;
      if (foe && h.hitT <= 0 && !(st.frozen > 0) && !(foe.stun > 0)) { h.hitT = rnd(0.9, 1.6); foe.atk = 0.32; foe.atkTo = h; }
      if (!foe && !(st.boss && S.giant.alpha > 0.5 && !S.giant.dead)) h.hp = Math.min(1, h.hp + dt * 0.05);   /* 싸움이 멎으면 혼자 차오름 */
      h.hurtT = Math.max(0, h.hurtT - dt);
    }
    for (const f of S.foes) { if (f.flash > 0) f.flash = Math.max(0, f.flash - dt);
      if (f.atk > 0) { const was = f.atk; f.atk = Math.max(0, f.atk - dt); if (was > 0.16 && f.atk <= 0.16 && f.atkTo && !f.dead) (f.atkTo.isSkel ? this.skelHurt(f.atkTo) : this.hurt(f.atkTo, 1, false)); } }
    /* 앞줄 쫄따구가 방패: 붙은 적이 맨 앞 해골을 치고, 가끔 해골이 부서져 무덤에서 새로 일어남(군단 수는 그대로 — 보여주기) */
    if ((S.phase === 'battle') && !UI.awakening && !(st.frozen > 0)) {
      const fr = S.army.filter(a => !a.fly && a.rise >= 1).sort((a, b) => b.x - a.x).slice(0, 8);
      for (const f of S.foes) { if (f.dead || f.flee || f.atk > 0 || !fr.length) continue; f.hitT = (f.hitT == null ? rnd(0.5, 1.5) : f.hitT) - dt; if (f.hitT > 0) continue;
        let t = fr[0], bd = 1e9; for (const a of fr) { const d = Math.abs(a.y - f.y) + Math.abs(a.x - f.x) * 0.3; if (d < bd) { bd = d; t = a; } }
        if (f.x - t.x < 220) { f.hitT = rnd(0.7, 1.3); f.atk = 0.32; t.isSkel = true; f.atkTo = t; } }
    }
    /* 보스(거인)는 2~3초마다 앞줄 수하를 한꺼번에 휩씀 */
    const gOn = (S.phase === 'battle' || S.phase === 'fight') && !UI.awakening && !(st.frozen > 0) && st.boss && S.giant.alpha > 0.5 && !S.giant.dead && this.list.length;
    if (gOn) { this.gT = (this.gT == null ? 2.2 : this.gT) - dt; if (this.gT <= 0) { this.gT = S.giant.rage > 0.5 ? rnd(1.3, 1.9) : rnd(2.2, 3.2); S.giant.nAtk = (S.giant.nAtk || 0) + 1; if (S.giant.nAtk % 3 === 0) { bossSpecial(); this.gT += 1.2; } else { const me = this, hit = () => { S.giant.slam = Math.max(S.giant.slam || 0, 0.6); S.shake = Math.max(S.shake, S.giant.rage > 0.5 ? 13 : 9); giantSlamFx();
      for (const h of me.list) me.hurt(h, 3, true); if (Snd.smp) Snd.smp('slam', 0.25, 0, 1.2); };
      if (typeof GWIND !== 'undefined' && typeof vsOk === 'function' && vsOk('gv')) { S.giant.wind = GWIND; S.giant.windFn = hit; } else hit(); } } } else { this.gT = null; S.giant.wind = 0; S.giant.windFn = null; }   /* 11-14 17:30 망치를 먼저 치켜든 뒤(0.55초) 내려찍음 — 전엔 치켜듦 없이 바로 쾅 */
    if (!((S.phase === 'battle' || S.phase === 'fight') && !UI.awakening)) this.shots = [];
    for (const b of this.shots) { b.age += dt; if (b.age >= b.life && !b.done) { b.done = true; b.land(); } }
    this.shots = this.shots.filter(b => !b.done);
    for (const f of this.fx) f.age += dt; this.fx = this.fx.filter(f => f.age < f.life);
  },
  /* 적 체력: 규칙의 남은 체력을 적 수로 나눠, 다음에 쓰러질 적의 막대가 줄어듦 */
  foeHp(f) {
    if (st.boss || f.dead || f.flee) return null;
    const alive = S.foes.filter(x => !x.dead && !x.flee); if (!alive.length) return null;
    const left = clamp(st.hp / st.maxHp, 0, 1) * S.foeN, whole = Math.ceil(left) - 1;
    return alive.indexOf(f) === alive.length - 1 ? clamp(left - whole, 0.05, 1) : 1;
  },
  bar(x, y, w, v, col, ghost) {   /* 18:42 휴대폰에서도 보이게: 화면 배수(WK)만큼 두껍고 길게 · 테두리 · 방금 깎인 부분은 흰색으로 남았다 줄어듦 */
    const k = WK(), hh = Math.round(5 * k), ww = w * Math.min(k, 1.7), x0 = x - ww / 2, y0 = y - hh;
    ctx.fillStyle = 'rgba(8,0,14,.85)'; ctx.fillRect(x0 - 2, y0 - 2, ww + 4, hh + 4);
    if (ghost != null && ghost > v) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(x0, y0, ww * clamp(ghost, 0, 1), hh); }
    ctx.fillStyle = col; ctx.fillRect(x0, y0, ww * clamp(v, 0, 1), hh);
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x0, y0, ww * clamp(v, 0, 1), Math.max(1, hh * 0.35));
  },
  drawArmyBars() {   /* 우리 망자병 · 소환수 머리 위 초록 막대(11-15부터 늘 보임 — 지금은 땅 병사가 몇 안 돼 덮지 않음) */
    for (const a of S.army) {
      if (a.fly || !(a.rise >= 1) || a.gone) continue; if (a.vh == null) a.vh = 1;   /* 11-15 대표님 「상대든 우리든 체력바는 보여야 할 것 같아」: 맞은 놈만 → 늘 보임(땅에 선 병사 · 소환수 모두) */
      a.hbT = Math.max(0, (a.hbT || 0) - 1 / 60); a.vh = Math.min(1, a.vh + 0.06 / 60); a.vg = a.vg == null ? a.vh : Math.max(a.vh, a.vg - 0.6 / 60);
      ctx.globalAlpha = a.hbT > 0 ? 1 : 0.85; const sc = lerp(0.8, 1.25, a.d) * (a.big ? a.big * UKU() : 1);
      this.bar(a.x, a.y - (a.big ? 175 : 150) * sc - 6, (a.big ? 40 : 30) * sc, a.vh, a.vh > 0.5 ? '#5dff8f' : a.vh > 0.25 ? '#ffcf5a' : '#ff5a5a', a.vg); ctx.globalAlpha = 1;
    }
  },
  draw(h) {
    const k = this.KIND[h.id] || this.KIND.krag, d = clamp((h.y - GROUND - 40) / (680 - GROUND - 40), 0, 1), sc = lerp(0.92, 1.08, d) * UKU();   /* 11-16 #10 새 2등신 그림: 앞뒤 줄 크기 차이가 커 뒷줄 영웅이 아이처럼 작아 보였음(0.85~1.15 → 0.92~1.08) */
    const lg = (h.flip ? -1 : 1) * (h.lunge > 0 ? Math.sin((h.lunge / 0.28) * Math.PI) * 18 : 0), bob = Math.sin(S.t * 4 + h.atkT) * 3;
    const dk = h.dash ? Math.sin(Math.min(1, h.dash.age / h.dash.life) * Math.PI) : 0, ddx = h.dash ? h.dash.dx * dk : 0, ddy = h.dash ? h.dash.dy * Math.min(1, h.dash.age / h.dash.life * 2) * (h.dash.age > h.dash.life * 0.5 ? dk : 1) - (h.dash.jump || 0) * Math.sin(Math.min(1, h.dash.age / (h.dash.life * 0.5)) * Math.PI) * (h.dash.age < h.dash.life * 0.5 ? 1 : 0) - (h.dash.jump || 0) * 0.6 * Math.sin(Math.min(1, Math.max(0, h.dash.age - h.dash.life * 0.5) / (h.dash.life * 0.5)) * Math.PI) : 0;   /* 갈 때 한 번 · 돌아올 때 낮게 한 번 뛰어넘음 */
    const kbx = h.kb > 0 ? (h.flip ? 1 : -1) * Math.sin((h.kb / 0.35) * Math.PI * 3) * 4 : 0;   /* 18:42 「그냥 밀리네」: 뒤로 16픽셀 밀리던 것 → 제자리에서 부르르 떨기 */ ctx.save(); const TA = !TRAILER && !(st.wear && st.wear[h.id]) && JB.heroStar(st.heroes[h.id]) >= 7 && need('heroT_' + h.id);   /* 11-15 ☠7 망자 군주화: 초월하면 그림 자체가 군주 모습(드리미나 · 뼈 날개 · 붉은 불꽃)으로 바뀌고 날개로 떠서 다님 */ const WV = 'heroW_' + h.id, wk = !TA && !h.dash && (h.wamp || 0) > 0.3 && typeof VS !== 'undefined' && VS[WV] && !(st.wear && st.wear[h.id]) && need(WV + '_walk'), wa = wk ? 0 : (h.wamp || 0);   /* 11-15 대표님 「크라그는 걷는 게 아니라 미끄러져」: 드리미나 걷기 영상(heroW_*_walk)이 있으면 걷는 동안 진짜 걸음, 흔들림은 끔 */ ctx.translate(h.x + lg + ddx + kbx, h.y + bob + ddy - Math.abs(Math.sin(h.wph || 0)) * 7 * wa - (TA ? 10 + Math.sin(S.t * 2.6 + h.atkT) * 6 : 0) + (1 - clamp(h.enter, 0, 1)) * 36);   /* 솟아오름 */ if (wa > 0.05) ctx.rotate(Math.sin(h.wph || 0) * 0.06 * wa); ctx.globalAlpha = Math.max(0, h.enter);
    /* 무기 기운: 단계가 오를수록 몸을 감싸는 빛이 커지고 진해짐, 금 · 빨강은 불꽃이 피어오름 */
    const o = st.heroes[h.id], wp = (o && o.wp) || 0, tc = this.TIER[Math.ceil(wp / 2)];
    if (tc) { const tier = Math.ceil(wp / 2), pu = 0.75 + 0.25 * Math.sin(S.t * 4 + h.atkT); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g2 = ctx.createRadialGradient(0, -75 * sc, 6, 0, -75 * sc, (60 + tier * 14) * sc); g2.addColorStop(0, tc + Math.round((0.08 + tier * 0.04) * pu * 255).toString(16).padStart(2, '0')); g2.addColorStop(1, tc + '00'); ctx.fillStyle = g2; ctx.beginPath(); ctx.ellipse(0, -75 * sc, (60 + tier * 14) * sc, (95 + tier * 12) * sc, 0, 0, 7); ctx.fill(); ctx.restore();
      if (tier >= 4 && Math.random() < 0.25) S.parts.push({ x: h.x + rnd(-30, 30), y: h.y - rnd(10, 120), vx: rnd(-10, 10), vy: rnd(-90, -40), life: 0.8, age: 0, size: rnd(2, 4), col: tc, g: -20, add: true, kind: 'dot', rot: 0, vr: 0 }); }
    /* 00:25 대표님 「모르데 기존 병사랑 뭔 차이야? SSR 차별화하기로 했던 것 같은데」: 최고(2%) · 상급(13%) 영웅은 등급 색 빛기둥 + 발밑 마법진 + 반짝이, 키도 더 큼 */
    const rr = JB.heroById(h.id).rarity, RC = { SSR: '#ffcc33', SR: '#c08cff', R: '#5ab0ff', N: '#b8bcc4' }[rr] || '#b8bcc4', rt = { N: 0, R: 1, SR: 2, SSR: 3 }[rr] || 0;
    if (rt >= 2) { const pu = 0.7 + 0.3 * Math.sin(S.t * 3 + h.atkT), big = rt === 3 ? 1 : 0.7; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const pg = ctx.createLinearGradient(0, -300 * sc, 0, 0); pg.addColorStop(0, RC + '00'); pg.addColorStop(0.55, RC + Math.round(40 * pu * big).toString(16).padStart(2, '0')); pg.addColorStop(1, RC + Math.round(90 * pu * big).toString(16).padStart(2, '0'));
      ctx.globalAlpha = Math.max(0, h.enter); ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(0, -130 * sc, 52 * sc * big + 20, 170 * sc, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.scale(1, 0.26); ctx.rotate(S.t * 0.8); ctx.strokeStyle = RC; ctx.globalAlpha = 0.75 * Math.max(0, h.enter); ctx.lineWidth = 3 / 0.26 * 0.5; ctx.setLineDash([14, 9]); ctx.beginPath(); ctx.arc(0, 0, 62 * sc, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 2; ctx.globalAlpha = 0.45 * Math.max(0, h.enter); ctx.beginPath(); ctx.arc(0, 0, 76 * sc, 0, 7); ctx.stroke(); ctx.restore();
      ctx.restore(); if (Math.random() < (rt === 3 ? 0.35 : 0.15)) S.parts.push({ x: h.x + rnd(-40, 40), y: h.y - rnd(0, 40), vx: rnd(-8, 8), vy: rnd(-120, -60), life: 1.1, age: 0, size: rnd(2, 4.5), col: RC, g: -10, add: true, kind: 'dot', rot: 0, vr: 0 }); }
    /* 발밑 그림자(땅에 서 있게) */
    ctx.save(); ctx.globalAlpha = 0.55 * Math.max(0, h.enter); ctx.fillStyle = '#05000c'; ctx.beginPath(); ctx.ellipse(0, -1, 44 * sc, 10 * sc, 0, 0, 7); ctx.fill(); ctx.restore();
    /* 발밑 빛 */
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (0.3 + 0.1 * Math.sin(S.t * 4 + h.atkT)) * Math.max(0, h.enter); ctx.fillStyle = k.col; ctx.beginPath(); ctx.ellipse(0, -2, 46 * sc, 11 * sc, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 0.5 * Math.max(0, h.enter); ctx.strokeStyle = k.col; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -2, 50 * sc, 12 * sc, 0, 0, 7); ctx.stroke(); ctx.restore();   /* 영웅 발밑 색 고리(누가 영웅인지 한눈에) */
    const sk = st.wear && st.wear[h.id] && JB.skinOwned(st, st.wear[h.id]) ? st.wear[h.id] : null, full = (sk && need('heroS_' + sk)) || TA || need('heroA_' + h.id) || need(artName('heroF_' + h.id)) || need('heroF_' + h.id), bust = need('hero_' + h.id), H2 = (full ? 172 : 140) * sc * 0.74 * (rt === 3 ? 1.16 : rt === 2 ? 1.08 : 1) * (TA ? 1.3 : 1);   /* 군주 그림은 날개가 머리 위로 솟아 몸이 작아 보임 → 1.3배 */   /* 19:56 망자병(150)과 같은 키라 영웅이 군단에 묻힘 → 조금 크게 */   /* 주인공(지배자 370)보다 확실히 작게 — 대표님 「누가 주인공인지 모르겠다」 */
    { const sr = JB.heroStar(o); if (sr >= 3 && !TRAILER) { const t = S.t + h.atkT, R7 = sr >= 7; ctx.save(); ctx.globalCompositeOperation = 'lighter';   /* 11-15 별 모습: ★3 영혼 불꽃 · ★5 뼈 날개 · ★7(초월) 검붉은 군주 기운 */
        if (sr >= 5 && !TA) { ctx.save(); ctx.translate(0, -H2 * 0.68); for (const sd of [-1, 1]) { ctx.save(); ctx.scale(sd, 1); ctx.rotate(-0.18 + Math.sin(t * 2.2) * 0.07); ctx.scale(1.35, 1.35); ctx.strokeStyle = R7 ? 'rgba(255,90,100,.95)' : 'rgba(235,220,255,.92)'; ctx.lineWidth = 4.6 * sc; ctx.lineCap = 'round'; for (let f = 0; f < 4; f++) { ctx.beginPath(); ctx.moveTo(6 * sc, 0); ctx.quadraticCurveTo((30 + f * 14) * sc, (-38 + f * 6) * sc, (52 + f * 16) * sc, (-12 + f * 20) * sc); ctx.stroke(); } ctx.fillStyle = R7 ? 'rgba(220,30,50,.38)' : 'rgba(160,120,255,.32)'; ctx.beginPath(); ctx.moveTo(6 * sc, 0); ctx.quadraticCurveTo(60 * sc, -50 * sc, 102 * sc, 48 * sc); ctx.quadraticCurveTo(50 * sc, 30 * sc, 6 * sc, 0); ctx.fill(); ctx.restore(); } ctx.restore(); }
        for (let f = 0; f < (R7 ? 7 : 4); f++) { const a = t * 1.7 + f * 1.57, fx = Math.cos(a) * 34 * sc, fy = -H2 * 0.25 - ((t * 60 + f * 37) % 90) * sc, fr = (7 - ((t * 60 + f * 37) % 90) / 18) * sc; if (fr <= 0) continue; const gq = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr * 2); gq.addColorStop(0, R7 ? 'rgba(255,120,120,.9)' : 'rgba(200,150,255,.9)'); gq.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gq; ctx.fillRect(fx - fr * 2, fy - fr * 2, fr * 4, fr * 4); }
        if (R7) { const gg = ctx.createRadialGradient(0, -H2 * 0.45, 4, 0, -H2 * 0.45, H2 * 0.8); gg.addColorStop(0, 'rgba(255,40,60,.28)'); gg.addColorStop(1, 'rgba(60,0,10,0)'); ctx.fillStyle = gg; ctx.fillRect(-H2, -H2 * 1.3, H2 * 2, H2 * 1.5); }
        ctx.restore(); } }
    if (full) { const SK = full === need('heroA_' + h.id) ? (HERO_STILL_K[h.id] || 1) : 1, w = H2 * SK * full.width / full.height, src = tc ? this.glow(full, tc, Math.ceil(wp / 2)) : full, ang = this.pose(h); if (h.flip) { ctx.save(); ctx.scale(-1, 1); }
      const KV = 'heroK_' + h.id, ka = h.ka, kf = ka == null ? -1 : ka < 0.4 ? ka / 0.4 * 5.9 : ka < 0.55 ? 6 + (ka - 0.4) / 0.15 * 4.9 : 11 + (ka - 0.55) / 0.35 * 4.9;   /* 시간 → 장 번호(장마다 시간이 다름) */
      if (kf >= 0 && !TA && !sk && VS[KV] && need(KV + '_atk')) vsDraw(KV, 'atk', kf, H2, '', 0, false);   /* 11-15 19:45 「종이가 움직이냐」: 그림 한 장을 허리에서 돌리던 것 → 진짜 때리는 영상 */
      else if (wk && !ang) vsDraw(WV, 'walk', h.wf || 0, H2, '', 0, true);
      else if (!ang && !TA && !sk && !wk && VS['heroI_' + h.id] && need('heroI_' + h.id + '_idle')) vsDraw('heroI_' + h.id, 'idle', (S.t + h.atkT * 3) * 10, H2, '', 0, true);   /* 11-16 #10 새 그림체: 숨쉬기 20장 2초 한 바퀴 · 걷는 동안도 숨쉬기 + 들썩임(옛 그림체 걷기 띠는 치움) */   /* 11-15 20:10 서 있을 때도 숨쉬는 영상(그림 한 장 = 종이였던 것) */
      else if (!ang) ctx.drawImage(src, -w / 2, -H2 * SK, w, H2 * SK);   /* 11-16 #10 새 정지 그림은 무기까지 키에 들어감 → 몸통 키 기준으로 맞춤 */
      else {   /* 그림 한 장을 허리(위에서 52%)에서 나눠 아랫몸은 그대로, 윗몸(무기 든 팔)은 허리를 축으로 돌림 — 윗몸을 4% 겹쳐 그려 틈이 안 보이게 */
        const H3 = H2 * SK, cut = 0.52, sw = src.width, sh = src.height, wy = -H3 * (1 - cut);
        ctx.drawImage(src, 0, sh * cut, sw, sh * (1 - cut), -w / 2, wy, w, H3 * (1 - cut));
        ctx.save(); ctx.translate(0, wy); ctx.rotate(ang); ctx.drawImage(src, 0, 0, sw, sh * (cut + 0.04), -w / 2, -H3 * cut, w, H3 * (cut + 0.04)); ctx.restore();
      }
      if (h.flip) ctx.restore(); }   /* 무기 단계 색 테두리 빛 */
    else if (bust) {   /* 전신 그림이 오기 전: 얼굴 그림을 방패 틀에 */
      const w = 92 * sc, hh = 104 * sc; ctx.save(); ctx.beginPath(); ctx.moveTo(-w / 2, -hh - 20); ctx.lineTo(w / 2, -hh - 20); ctx.lineTo(w / 2, -40); ctx.lineTo(0, -8); ctx.lineTo(-w / 2, -40); ctx.closePath();
      ctx.fillStyle = '#140a22'; ctx.fill(); ctx.clip(); const bw = w * 1.15, bh = bw * bust.height / bust.width; ctx.drawImage(bust, -bw / 2, -hh - 22, bw, bh); ctx.restore();
      ctx.lineWidth = 3; ctx.strokeStyle = k.col; ctx.beginPath(); ctx.moveTo(-w / 2, -hh - 20); ctx.lineTo(w / 2, -hh - 20); ctx.lineTo(w / 2, -40); ctx.lineTo(0, -8); ctx.lineTo(-w / 2, -40); ctx.closePath(); ctx.stroke();
    }
    if (h.flash > 0 || h.hurtT > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = h.flash > 0 ? h.flash : 0.4; ctx.fillStyle = h.flash > 0 ? k.col : '#ff3030'; ctx.beginPath(); ctx.ellipse(0, -70 * sc, 50 * sc, 70 * sc, 0, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.globalAlpha = Math.max(0, h.enter);
    h.hbT = Math.max(0, (h.hbT || 0) - 1 / 60); if (h.hurtT > 0) h.hbT = 2.5;
    { ctx.globalAlpha = Math.max(0, h.enter) * (h.hbT > 0 || h.hp < 0.6 ? 1 : 0.85); this.bar(0, -H2 - 10, 46 * sc, h.hp, h.hp > 0.5 ? '#5dff8f' : h.hp > 0.25 ? '#ffcf5a' : '#ff5a5a'); ctx.globalAlpha = Math.max(0, h.enter); }   /* 11-15 대표님 「우리든 체력바 보여야」: 영웅 막대도 늘 보임 */   /* 19:13 늘 떠 있던 막대 → 맞았을 때 · 다쳤을 때만 */
    { const sr = JB.heroStar(o), nm = L.heroes[h.id].name, nt = `${nm} ${sr >= 7 ? '☠' : '★'}${sr}`,   /* 11-15 이름표 = 이름 + 별 수(★1~6 · 초월 ☠7) */ fz = Math.round(11.5 * Math.min(WK(), 2.2));   /* 19:13 발밑 이름표 */
      this.tags.push({ m: ctx.getTransform(), nt, fz, ty: 10 + fz * 0.6, rt, RC, line: sr >= 7 ? '#ff3a4a' : rt >= 2 ? RC : tc || k.col, txt: sr >= 7 ? '#ffb0b8' : rt >= 2 ? RC : tc || '#f3e8ff', a: Math.max(0, h.enter) }); }   /* 11-15 눈 확인: 30판에서 영웅 넷 이름표가 서로 포개짐 → 그리기는 다 모아서 마지막에(drawTags), 겹치면 아래로 비킴 */
    ctx.restore(); ctx.globalAlpha = 1;
  },
  glowC: {},
  /* 휘두르기 각도(라디안): 뒤로 젖혀 모았다가(-0.3) 앞으로 내려침(+0.6) → 돌아옴. 허리를 축으로 윗몸만 돎 */
  pose(h) {
    if (h.swg == null) return 0; const p = h.swg / h.swgL;
    const a = p < 0.4 ? -0.38 * Math.sin(p / 0.4 * Math.PI / 2) : p < 0.52 ? -0.38 + 1.05 * (p - 0.4) / 0.12 : 0.67 * (1 - (p - 0.52) / 0.48);   /* 11-15 19:30 크게 젖혔다(0.2초) 빠르게 내려침(0.06초) — 예비 동작이 있어야 한 방이 무거워 보임 */
    return a * (h.swgB || 1);
  },
  glow(im, col, tier) {   /* 무기 단계 테두리 빛을 한 번만 그려 두고 다시 씀(매 장 그리면 휴대폰이 버벅여 선명도가 떨어짐) */
    const key = im.src + col + tier; if (this.glowC[key]) return this.glowC[key];
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d');
    const m = document.createElement('canvas'); m.width = im.width; m.height = im.height; const mg = m.getContext('2d'); mg.drawImage(im, 0, 0);
    try { const d = mg.getImageData(0, 0, m.width, m.height), a = d.data; for (let i = 3; i < a.length; i += 4) if (a[i] < 60) a[i] = 0; mg.putImageData(d, 0, 0); } catch (e) {}   /* 거의 투명한 가장자리 점은 지움(그대로 두면 빛이 네모 상자로 번짐) */
    g.shadowColor = col; g.shadowBlur = (4 + tier * 5) * im.height / 150; g.drawImage(m, 0, 0); g.shadowBlur = 0; g.drawImage(im, 0, 0);
    return (this.glowC[key] = c);
  },
  drawUniq(f) {
    const k = clamp(f.age / f.life, 0, 1);
    if (f.kind === 'bladeline') { const p = Math.min(1, k * 3), x = lerp(f.x0, f.x1, p); ctx.globalAlpha = 1 - Math.max(0, (k - 0.4) / 0.6);
      for (const [lw, c] of [[34, 'rgba(255,30,60,.25)'], [14, 'rgba(255,60,90,.7)'], [4, '#ffffff']]) { ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(f.x0, f.y + 10); ctx.lineTo(x, f.y - 10); ctx.stroke(); } }
    else if (f.kind === 'soulburst') { const ph = UK() < 1, r = 40 + k * (ph ? 170 : 260); ctx.globalAlpha = (1 - k) * (ph ? 0.65 : 1);   /* 11-15 폰: 영혼 폭발 흰 빛이 영웅 셋을 통째로 덮음(효과재기 29번) → 작고 옅게 */ const g = ctx.createRadialGradient(f.x, f.y, 4, f.x, f.y, r); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.3, 'rgba(180,110,255,.7)'); g.addColorStop(1, 'rgba(60,10,140,0)'); ctx.fillStyle = g; ctx.fillRect(f.x - r, f.y - r, r * 2, r * 2);
      for (let j = 0; j < 7; j++) { const an = j / 7 * 6.28 + k * 2, rr = r * 0.8; ctx.fillStyle = 'rgba(230,210,255,.8)'; ctx.beginPath(); ctx.arc(f.x + Math.cos(an) * rr, f.y + Math.sin(an) * rr * 0.6, 8 * (1 - k), 0, 7); ctx.fill(); } }
    else if (f.kind === 'ghost') { const im = need('heroF_' + f.id); if (im) { const H2 = 150, w = H2 * im.width / im.height; ctx.globalAlpha = 0.45 * (1 - k); ctx.filter = 'brightness(0) invert(.7) sepia(1) hue-rotate(150deg) saturate(3)'; ctx.drawImage(im, f.x - w / 2, f.y - H2, w, H2); ctx.filter = 'none'; } }
    else if (f.kind === 'xcut') { ctx.globalAlpha = 1 - k; ctx.lineCap = 'round'; for (const [lw, c] of [[16, 'rgba(120,240,255,.4)'], [5, '#ffffff']]) { ctx.lineWidth = lw * (1 - k * 0.5); ctx.strokeStyle = c; const L2 = 70 * Math.min(1, k * 4); ctx.beginPath(); ctx.moveTo(f.x - L2, f.y - L2); ctx.lineTo(f.x + L2, f.y + L2); ctx.moveTo(f.x + L2, f.y - L2); ctx.lineTo(f.x - L2, f.y + L2); ctx.stroke(); } }
    else if (f.kind === 'dustline') { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.5 * (1 - k); for (let j = 0; j < 10; j++) { const x = f.x + j * 45 * Math.min(1, k * 2), r = 30 + j * 4; const g = ctx.createRadialGradient(x, f.y - 10, 2, x, f.y - 10, r); g.addColorStop(0, 'rgba(200,180,150,.6)'); g.addColorStop(1, 'rgba(120,100,80,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, f.y - 10 - r, r * 2, r * 2); } ctx.globalCompositeOperation = 'lighter'; }
    else if (f.kind === 'ring') { const r = 30 + k * 380; ctx.globalAlpha = 0.8 * (1 - k); ctx.strokeStyle = f.col; ctx.lineWidth = 8 * (1 - k) + 1; ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.45, 0, 0, 7); ctx.stroke(); }
    else if (f.kind === 'wisp') { const seg = f.path.length - 1, u = k * seg, i = Math.min(seg - 1, Math.floor(u)), q = u - i, a = f.path[i], b = f.path[i + 1], x = lerp(a.x, b.x, q), y = lerp(a.y, b.y, q) - Math.sin(q * Math.PI) * 50;
      if (i + 1 > f.hits && q > 0.9) { f.hits = i + 1; if (b.f && !b.f.dead) { b.f.flash = 0.2; if (f.hits % 2) this.num(b.f.x, b.f.y - 90, 3, f.col); }   /* 11-15 19:55 여러 번 맞는 기술은 숫자를 두 번에 한 번(합친 값) */ }
      ctx.globalAlpha = 1 - Math.max(0, (k - 0.85) / 0.15); const g = ctx.createRadialGradient(x, y, 2, x, y, 22); g.addColorStop(0, 'rgba(240,255,240,1)'); g.addColorStop(0.4, 'rgba(110,255,160,.7)'); g.addColorStop(1, 'rgba(0,80,40,0)'); ctx.fillStyle = g; ctx.fillRect(x - 22, y - 22, 44, 44);
      if (Math.random() < 0.5) S.parts.push({ x, y, vx: rnd(-20, 20), vy: rnd(-40, 0), life: 0.4, age: 0, size: rnd(2, 4), col: '#7dffb0', g: -20, add: true, kind: 'dot', rot: 0, vr: 0 }); }
    ctx.globalAlpha = 1;
  },
  drawFx() {   /* 마법탄(꼬리 달린 빛) · 베기 궤적(초승달) */
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const b of this.shots) {
      if (b.wave) { const k = clamp(b.age / b.life, 0, 1), x = lerp(b.x, b.tx, k), y = lerp(b.y, b.ty, k), R = (b.big ? 70 : 50) * (0.7 + 0.3 * k); ctx.save(); ctx.translate(x, y); ctx.globalCompositeOperation = 'lighter';   /* 검기: 날아가는 초승달 */
        for (let i = 3; i >= 0; i--) { ctx.globalAlpha = (0.9 - i * 0.2) * (1 - k * 0.3); ctx.strokeStyle = i ? b.col : '#ffffff'; ctx.lineWidth = (b.big ? 16 : 11) - i * 3; ctx.beginPath(); ctx.arc(-R * 0.55 - i * 10, 0, R, -1.0, 1.0); ctx.stroke(); }
        ctx.restore(); ctx.globalAlpha = 1; continue; }
      const k = clamp(b.age / b.life, 0, 1), x = lerp(b.x, b.tx, k), y = lerp(b.y, b.ty, k) - Math.sin(k * Math.PI) * 60, r = (b.big ? 16 : 9) * Math.min(1.6, WK() * 0.7 + 0.3);
      for (let i = 4; i >= 0; i--) { const kk = Math.max(0, k - i * 0.05), xx = lerp(b.x, b.tx, kk), yy = lerp(b.y, b.ty, kk) - Math.sin(kk * Math.PI) * 60; ctx.globalAlpha = 0.18 * (5 - i); ctx.fillStyle = b.col; ctx.beginPath(); ctx.arc(xx, yy, r * (1 - i * 0.15), 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, 7); ctx.fill();
      if (b.sack) { ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.translate(x, y); ctx.rotate(k * 9); ctx.fillStyle = '#8a7040'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 16, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#e8dcc0'; ctx.fillRect(-4, -20, 8, 8); ctx.restore(); }
    }
    for (const f of this.fx) {
      if (f.age < 0) continue;
      if (f.kind && f.kind !== 'slash') { this.drawUniq(f); continue; }
      const q = Math.min(1.6, WK() * 0.7 + 0.3), k = f.age / f.life, R = (f.big ? 90 : 60) * q; ctx.globalAlpha = 1 - k; ctx.strokeStyle = f.col; ctx.lineWidth = (f.big ? 14 : 8) * (1 - k) * q; ctx.shadowColor = f.col; ctx.shadowBlur = 12;   /* 20:15 휴대폰에서 베기 자국이 작아 안 보였음 → 화면 크기만큼 키우고 빛 번짐 */
      ctx.beginPath(); ctx.arc(f.x, f.y - 30, R * (0.7 + k * 0.4), -1.9 + k * 0.6, 0.2 + k * 0.6); ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3 * (1 - k) * q; ctx.stroke();
    }
    ctx.restore(); ctx.globalAlpha = 1;
  },
  drawFoeBar(f) {
    const v = this.foeHp(f); if (v === null) return;
    const hgt = 160 * (f.big || 1) * lerp(0.85, 1.1, f.d); f.vg = f.vg == null || f.vg < v ? v : Math.max(v, f.vg - 0.5 / 60);   /* 머리 위(전엔 가슴께에 묻혀 안 보였음) */
    if (f.flash > 0.05) f.hbT = 2.2; f.hbT = Math.max(0, (f.hbT || 0) - 1 / 60);
    const al = f.big || f.elite || f.kind === 'captain' || f.hbT > 0 ? 1 : 0.85;   /* 19:04 맞은 적만 보이던 것 → 11-15 대표님 「상대들 에너지바도 있어서 줄어드는 거 보고 싶고」: 모든 적에게 늘 보임(맞은 적은 진하게), 조금 크게 */
    ctx.globalAlpha = al; this.bar(f.x, f.y - hgt - 4, 54 * (f.big || 1), v, f.elite ? '#ff9a2a' : '#ff4a4a', f.vg); ctx.globalAlpha = 1;
  },
};

/* ───────── 지배자 작은 마법(11-13 대표님 「초반엔 마법이 너무 적다」 · 「주인공이 누군지」) ─────────
   보스가 아니어도 지배자가 지팡이를 들어 스스로 씀. 3판 뼈 창(6초) · 6판 저주 안개(10초) · 9판 망자의 손(14초).
   피해 숫자는 보여주기(규칙의 체력은 그대로 — 각성 시간표를 흔들지 않게). 처음 열릴 때 알림 */
const LM = {
  DEF: { spear: { at: 3, iv: 6, mul: 1.2, col: '#f3ead2' }, fog: { at: 6, iv: 10, mul: 2, col: '#b06bff' }, hands: { at: 9, iv: 14, mul: 3, col: '#7dff9a' }, meteor: { at: 15, iv: 16, mul: 4, col: '#ff8a3a' }, chain: { at: 25, iv: 18, mul: 5, col: '#c58bff' }, scythe: { at: 40, iv: 22, mul: 7, col: '#9af0ff' }, wraith: { at: 60, iv: 26, mul: 9, col: '#e8e0ff' }, shout: { vip: 5, iv: 15, mul: 5, col: '#ffd76a' }, gate: { vip: 7, iv: 20, mul: 8, col: '#9ad8ff' }, kingdom: { vip: 9, iv: 24, mul: 12, col: '#fff0a0' }, eclipse: { vip: 11, iv: 30, mul: 18, col: '#ff9a5a' } },   /* 11-14 귀빈 마법(5 · 7 · 9 · 11등급) */   /* 11-14 대표님 「마법 더, 풍성하게」: 15 · 25 · 40 · 60판에 하나씩 */
  T: {}, fx: [], pose: 0, shown: {},
  open(id) { const d = this.DEF[id]; return d.vip ? JB.vipLv(st) >= d.vip : (st.best >= d.at || st.awakens > 0); },
  staff() { const r = this.staff0(); r.x += LDX() + (!window.LORDV_OK && S.lord && S.lord.pkx || 0); return r; },
  staff0() { if (typeof need === 'function' && !window.LORDV_OK && need('lordA') && JB.vipLv(st) < 5) return { x: 196 + 10 - 79, y: 560 + 34 - 292 };   /* 09:58 그림 A 지배자 지팡이 보석 자리(그림 276×420의 38,48) — 영혼탄이 진짜 보석에서 나감 */
    if (typeof STYLE !== 'undefined' && STYLE === 'old' && need('ld7_idle')) return { x: 222 + LDX() + 29 * LSC(), y: 594 - 358 * LSC() }; if (typeof STYLE !== 'undefined' && STYLE === '2d') return { x: 321, y: 330 }; if (typeof lordSD === 'function' && lordSD()) return { x: 328, y: 352 }; return JB.vipLv(st) >= 5 ? { x: 340, y: 232 } : { x: 260, y: 250 }; },   /* 11-14 SD 지배자: 내지른 지팡이 구슬 자리 */   /* 지팡이 끝 보석(세계 좌표) — 21:20 지팡이 등급 그림을 손에 들린 뒤 그 그림 끝에 맞춤 */
  update(dt) {
    for (const id in this.DEF) if (this.open(id) && !st.seen['lm_' + id]) { st.seen['lm_' + id] = 1; UI.toast(L.unlock.title, L.lm.unlock(L.lm.names[id] || L.vip.spell[id])); this.T[id] = 1.5; }
    this.pose = Math.max(0, this.pose - dt * 2.2);
    if (S.phase !== 'cast' && S.phase !== 'prompt') S.lord.raise = Math.max(S.lord.raise * Math.max(0, 1 - dt * 4), this.pose);
    const on = S.phase === 'battle' && !UI.awakening && S.foes.some(f => !f.dead && !f.flee && f.x < VX1);
    if (UI.awakening) { this.fx = []; return; }   /* 각성 연출 중엔 마법 효과도 지움 */
    for (const f of this.fx) { f.age += dt; if (!f.hit && f.age >= (f.hitAt || 0)) { f.hit = true; f.land && f.land(); } }
    this.fx = this.fx.filter(f => f.age < f.life);
    this.basic(dt, on);
    if (!on) return;
    for (const id in this.DEF) { if (!this.open(id)) continue; this.T[id] = (this.T[id] == null ? rnd(1, 3) : this.T[id]) - dt; if (this.T[id] <= 0) { this.T[id] = this.DEF[id].iv * rnd(0.9, 1.1); this.cast(id); break; } }
  },
  /* 11-14 19:02 대표님 「기본 공격 때 우리 주인공 공격 모션이 느리고 임팩트도 없어」: 지배자 기본 공격 = 영혼탄
     0.85초마다(대마법 강화로 빨라짐) 지팡이 끝이 번쩍 → 보라 영혼탄이 0.22초 만에 휘어 날아가 맨 앞 적(보스면 거인 가슴)에 꽂힘
     → 보라 고리 · 불꽃 · 피해 숫자, 치명타 15%(금빛 큰 숫자 · 「치명!」 · 잠깐 멈춤). 세 번째마다 두 발 연속(리듬). 피해는 보여주기(규칙 체력 그대로) */
  basic(dt, on) {
    const g = S.giant, bossOn = S.phase === 'fight' && st.boss && g.alpha > 0.5 && !g.dead && !UI.awakening;
    this.bT = (this.bT ?? 0.6) - dt; if (!(on || bossOn) || this.bT > 0) return;
    const sp = Math.max(0.5, 0.85 - 0.02 * Math.min(15, st.up.magic || 0)); this.bT = sp * rnd(0.92, 1.08); this.bN = (this.bN || 0) + 1;
    let tgt; if (bossOn) tgt = { x: g.x - 90 + rnd(-30, 30), y: g.y - 230 + rnd(-50, 40), boss: true };
    else { const fs = S.foes.filter(f => !f.dead && !f.flee && f.x < VX1 - 60).sort((a, b) => a.x - b.x); if (!fs.length) return; const f = fs[Math.min(fs.length - 1, (Math.random() * Math.min(3, fs.length)) | 0)]; tgt = { x: f.x, y: f.y - 80 * lerp(0.85, 1.1, f.d), f }; }
    if (this.bN % 4 === 0 && !UI.awakening) { this.bigSlash(bossOn); return; }   /* 09:20 대표님 갓깨비 사진: 화면을 가로지르는 큰 칼 궤적 · 쌓이는 큰 숫자 */
    const shots = this.bN % 3 === 0 ? 2 : 1;
    for (let j = 0; j < shots; j++) {
      const vw = !window.LORDV_OK && need('lordw_attack') && JB.vipLv(st) < 5 && this.bN % 2 === 0 && !(S.lord.raise > 0.05), s = vw ? { x: 196 + LDX() + 10 + 239, y: 560 + 34 - 228 } : this.staff(), crit = Math.random() < 0.15, dy = rnd(-120, -40) - j * 40;   /* 10:05 영상 지배자: 내지른 보석 자리(줄그림 4번째 칸에서 잼)에서, 내지르는 순간(0.12초 뒤)에 발사 */
      this.fx.push({ kind: 'orb', x0: s.x, y0: s.y, t: tgt, dy, age: -j * 0.12 - (vw ? 0.12 : 0), life: 0.22 + 0.28, hitAt: 0.22, col: crit ? '#ffd76a' : '#c58bff', crit, land: () => this.orbHit(tgt, crit) });
    }
    S.lord.shotT = 0.28; S.lord.glow = Math.max(S.lord.glow || 0, 0.6);
    if (!(!window.LORDV_OK && need('lordw_attack') && JB.vipLv(st) < 5 && this.bN % 2 === 0)) { const s = this.staff(); burst(s.x, s.y, 6, { col: ['#ffffff', '#c58bff'], vmin: 60, vmax: 200, up: 20, lmax: 0.25, smin: 2, smax: 4 }); }
    Snd.smp && Snd.smp('soul', 0.38, 0, rnd(1.5, 1.8));   /* 11-16 순서 #8 효과음재기: 지배자 지팡이 한 발 소리가 -46.6dB로 안 들렸음(초당 0.9번 나는 주인공 소리) → -36.6 */
  },
  bigSlash(bossOn) {   /* 지배자 앞에서 적 무리를 가로질러 큰 초승달 궤적(보라 → 흰빛), 맞은 적마다 숫자 3줄이 쌓임 · 쓰러지면 뼈 · 갑옷 조각이 사방으로 */
    const g = S.giant, fs = bossOn ? [] : S.foes.filter(f => !f.dead && !f.flee && f.x < VX1 - 40).sort((a, b) => a.x - b.x).slice(0, 5);
    const x0 = VW.x + VW.w * 0.24, x1 = VX1 - 20, y = bossOn ? g.y - 200 : GROUND - 60;   /* 화면 오른쪽 끝까지 가로지름 */
    const blue = (this.bN / 4) % 2 === 1;
    this.fx.push({ kind: 'bigSlash', x0, x1, y, age: 0, life: 0.38, hitAt: 0.08, col: blue ? '#7ad7ff' : '#c58bff', land: () => {
      const hit = bossOn ? [{ x: g.x - 60, y: g.y - 260, boss: 1 }] : fs.filter(f => !f.dead).map(f => ({ f, x: f.x, y: f.y - 80 * lerp(0.85, 1.1, f.d) }));
      for (const h of hit) { if (h.f) { h.f.flash = 0.22; h.f.kbT = Math.max(h.f.kbT || 0, 0.18); } else S.giant.hitFl = 0.2;
        const base = JB.dps(st) * 0.5 * Math.pow(JB.C.MAGIC_MUL, st.up.magic || 0);
        if (hit.indexOf(h) < 3) say(fmtD(base * 3 * rnd(0.9, 1.1)), Math.min(VX1 - 120, h.x) + rnd(-6, 6), h.y - 20, { size: 30, col: '#ffe14d', glow: '#3a1600', life: 0.9, vy: -40 });   /* 11-15 19:35 타격 리듬 잼: 적마다 숫자 3줄씩(최대 15개)이 「따따따닥」의 큰 몫(20초에 75개) → 앞 3마리만 합친 숫자 하나씩 크게 */   /* 갓깨비처럼 노란 큰 숫자가 3줄 쌓임(오른쪽 끝 단추에 안 가리게 안쪽으로) */
        burst(h.x, h.y, 10, { col: blue ? ['#ffffff', '#9fe6ff', '#2a8cff'] : ['#ffffff', '#e0c8ff', '#9b6bff'], vmin: 120, vmax: 420, up: 40, lmax: 0.35, smin: 2, smax: 4 }); }
      punch(0.06, 7); S.tint = { col: blue ? '40,140,255' : '150,70,255', a: 0.18 };
      Snd.smp && Snd.smp('hit', 0.45, 0, 0.7); Snd.slam && Snd.slam(0.25); } });
    S.lord.shotT = 0.28; S.lord.glow = 1;
  },
  orbHit(t, crit) {
    if (UI.awakening) return; const f = t.f, x = f ? f.x : t.x, y = f ? f.y - 80 * lerp(0.85, 1.1, f.d) : t.y;
    if (f && !f.dead) { f.flash = Math.max(f.flash || 0, crit ? 0.25 : 0.14); f.hk = 0; } if (t.boss) S.giant.hitFl = 0.15;
    this.fx.push({ kind: 'orbRing', x, y, age: 0, life: crit ? 0.42 : 0.3, hitAt: 9, col: crit ? '#ffd76a' : '#c58bff', big: crit });
    burst(x, y, crit ? 16 : 8, { col: crit ? ['#ffe14d', '#ffffff', '#ff9a2a'] : ['#e0c8ff', '#ffffff', '#9b6bff'], vmin: 80, vmax: crit ? 380 : 240, up: 30, lmax: 0.32, smin: 2, smax: crit ? 5 : 3.5 });
    const dmg = JB.dps(st) * 0.35 * Math.pow(JB.C.MAGIC_MUL, st.up.magic || 0) * rnd(0.85, 1.15) * (crit ? 2.2 : 1);
    if (crit) { say(fmtD(dmg), x + rnd(-10, 10), y - 26, { size: 32, col: '#ffe14d', glow: '#ff7a00', life: 0.85, vy: -70 }); say(L.field.crit, x, y - 62, { size: 15, col: '#ffb02e', life: 0.7, vy: -70 }); punch(0.045, 0); S.shake = Math.max(S.shake || 0, 4); }
    else if (Math.random() < 0.3) say(fmtD(dmg), x + rnd(-14, 14), y - 22, { size: 20, col: '#efe2ff', glow: '#8a3cff', life: 0.65, vy: -60 });   /* 11-15 19:35 지배자 구슬 평타 숫자는 반만 */
    Snd.smp && Snd.smp('hit', crit ? 0.32 : 0.2, 0, crit ? rnd(0.8, 0.9) : rnd(1.2, 1.5));
  },
  num(x, y, mul, col) { say(fmtD(JB.dps(st) * mul * Math.pow(JB.C.MAGIC_MUL, st.up.magic || 0) * rnd(0.85, 1.15)), x + rnd(-14, 14), y, { size: 26, col: '#ffffff', glow: col, life: 0.9, vy: -60 }); },
  cast(id) {
    const d = this.DEF[id], foes = S.foes.filter(f => !f.dead && !f.flee && f.x < VX1).sort((a, b) => a.x - b.x); if (!foes.length) return;
    this.pose = (typeof STYLE !== 'undefined' && STYLE === 'old') ? 0 : 1; S.lord.c2T = 0.9; this.shown[id] = (this.shown[id] || 0) + 1;   /* SD 지배자가 지팡이를 내지르는 동작 */
    const s = this.staff(); burst(s.x, s.y, 8, { col: [d.col, '#ffffff'], vmin: 40, vmax: 160, up: 40, lmax: 0.4 });
    if (this.shown[id] <= 4 || d.vip) say(L.lm.names[id] || L.vip.spell[id], d.vip ? W / 2 : s.x + 10, d.vip ? 200 : s.y - 40, d.vip ? { size: 40, col: '#fff3c4', glow: d.col, life: 1.6, vy: 0, stamp: true, screen: true } : { size: 22, col: '#ffffff', glow: d.col, life: 1.1, vy: -25 });
    Snd.smp && Snd.smp(id === 'hands' ? 'rise' : 'circle', 0.3, 0, id === 'spear' ? 1.6 : 1.1);
    if (id === 'spear') {   /* 뼈 창: 지팡이에서 맨 앞 적까지 곧게 날아가 꿰뚫음(줄 위 적 모두 번쩍) */
      const t = foes[0], ty = t.y - 40;
      this.fx.push({ kind: 'spear', x0: s.x, y0: s.y, x1: t.x + 160, y1: ty, age: 0, life: 0.5, hitAt: 0.22, col: d.col, land: () => { let n = 0; for (const f of foes) if (Math.abs(f.y - 40 - ty) < 60 && f.x < t.x + 170) { f.flash = 0.2; burst(f.x, f.y - 40, 6, { col: ['#ffffff', d.col], vmin: 60, vmax: 220, up: 30, lmax: 0.3 }); if (n++ < 2) this.num(f.x, f.y - 70, d.mul, d.col); } S.shake = Math.max(S.shake, 2); } });
    } else if (id === 'fog') {   /* 저주 안개: 적 무리 위로 보라 안개가 퍼져 2.5초 머묾, 그동안 두 번 피해 */
      const cx = foes.reduce((a, f) => a + f.x, 0) / foes.length;
      const fog = { kind: 'fog', x: cx, y: 600, age: 0, life: 2.6, hitAt: 0.6, col: d.col, puffs: Array.from({ length: 9 }, () => ({ dx: rnd(-150, 150), dy: rnd(-70, 70), r: rnd(50, 90) })) };
      fog.land = () => { for (const f of foes.slice(0, 4)) f.flash = 0.15; this.num(cx, 520, d.mul / 2, d.col); setTimeout(() => { if (!UI.awakening) this.num(cx + 30, 510, d.mul / 2, d.col); }, 900); };
      this.fx.push(fog);
    } else if (id === 'meteor') {   /* 해골 유성: 불붙은 해골 셋이 하늘에서 적 무리에 떨어짐 */
      for (let j = 0; j < 3; j++) { const t = foes[Math.min(foes.length - 1, j * 2)]; if (!t) break; this.fx.push({ kind: 'meteor', x: t.x + rnd(-30, 30), y: t.y, sx: t.x + rnd(-220, -120), age: -j * 0.18, life: 1.0, hitAt: 0.45, col: d.col, land: () => { for (const f of foes) if (Math.abs(f.x - t.x) < 110) f.flash = 0.25; burst(t.x, t.y - 20, 22, { col: ['#ffd76a', '#ff6a1a', '#3a1208'], vmin: 80, vmax: 340, up: 180, lmax: 0.7 }); this.num(t.x, t.y - 90, d.mul / 3, d.col); S.shake = Math.max(S.shake, 5); } }); }
    } else if (id === 'chain') {   /* 영혼 사슬: 지팡이에서 튄 보라 번개가 적 다섯을 차례로 잇는다 */
      const pts = [{ x: s.x, y: s.y }].concat(foes.slice(0, 5).map(f => ({ x: f.x, y: f.y - 60, f })));
      this.fx.push({ kind: 'chain', pts, age: 0, life: 0.9, hitAt: 0.1, col: d.col, land: () => { pts.slice(1).forEach((p, i) => setTimeout(() => { if (UI.awakening) return; p.f.flash = 0.25; burst(p.x, p.y, 7, { col: ['#ffffff', d.col], vmin: 40, vmax: 200, up: 20, lmax: 0.35 }); if (i < 3) this.num(p.x, p.y - 30, d.mul / 3, d.col); }, i * 70)); } });
    } else if (id === 'scythe') {   /* 사신의 낫: 커다란 유령 낫이 적 무리를 오른쪽 끝까지 한 번에 쓸어냄 */
      const y0 = foes.reduce((a, f) => a + f.y, 0) / foes.length - 70;
      this.fx.push({ kind: 'scythe', x0: foes[0].x - 160, x1: VX1 + 60, y: y0, age: 0, life: 1.1, hitAt: 0.45, col: d.col, land: () => { for (const f of foes) { f.flash = 0.3; burst(f.x, f.y - 50, 5, { col: ['#ffffff', d.col], vmin: 60, vmax: 260, up: 40, lmax: 0.3 }); } this.num(foes[0].x + 80, y0 - 40, d.mul, d.col); S.shake = Math.max(S.shake, 7); } });
    } else if (id === 'wraith') {   /* 망령 폭풍: 망령 여덟이 적 무리를 휘감아 돌다 흩어짐 */
      const cx = foes.reduce((a, f) => a + f.x, 0) / foes.length, cy = foes.reduce((a, f) => a + f.y, 0) / foes.length - 70;
      this.fx.push({ kind: 'wraith', x: cx, y: cy, age: 0, life: 2.4, hitAt: 0.5, col: d.col, land: () => { for (const f of foes) f.flash = 0.2; this.num(cx, cy - 60, d.mul / 2, d.col); setTimeout(() => { if (!UI.awakening) { this.num(cx + 40, cy - 70, d.mul / 2, d.col); for (const f of foes) f.flash = 0.2; } }, 900); } });
    } else if (id === 'shout') {   /* 군주의 일갈(귀빈 5): 지배자에게서 금빛 충격파 — 적이 밀려나고 1.5초 멈춤 */
      this.fx.push({ kind: 'shout', x: s.x, y: s.y + 120, age: 0, life: 1.2, hitAt: 0.35, col: d.col, land: () => { for (const f of foes) { f.kb = 0.4; f.x += 70; f.stun = 1.5; f.flash = 0.3; } this.num(foes[0].x, foes[0].y - 100, d.mul, d.col); S.shake = Math.max(S.shake, 10); } });
    } else if (id === 'gate') {   /* 저승 문(귀빈 7): 지배자 앞에 문이 열리고 저승 기사 여덟이 쏟아져 돌격 */
      const gx = s.x + 120; this.fx.push({ kind: 'gate', x: gx, y: 600, age: 0, life: 2.4, hitAt: 0.9, col: d.col, riders: Array.from({ length: 8 }, (_, j) => ({ y: 520 + j * 22 + rnd(-8, 8), dl: j * 0.06 + rnd(0, 0.05) })), land: () => { for (const f of foes) { f.flash = 0.35; burst(f.x, f.y - 40, 8, { col: ['#9ad8ff', '#ffffff'], vmin: 60, vmax: 260, up: 60, lmax: 0.4 }); } this.num(foes[0].x + 60, foes[0].y - 110, d.mul, d.col); S.shake = Math.max(S.shake, 9); } });
    } else if (id === 'kingdom') {   /* 천년왕국 강림(귀빈 9): 하늘이 금빛으로 열리고 창 스물넷이 비처럼 */
      this.fx.push({ kind: 'kingdom', age: 0, life: 2.2, hitAt: 0.8, col: d.col, sp: Array.from({ length: 24 }, (_, j) => ({ x: lerp(foes[0].x - 120, VX1 + 40, Math.random()), y: rnd(520, 690), dl: rnd(0, 0.7) })), land: () => { for (const f of foes) f.flash = 0.3; this.num((foes[0].x + VX1) / 2, 470, d.mul, d.col); S.shake = Math.max(S.shake, 12); } });
    } else if (id === 'eclipse') {   /* 영겁의 일식(귀빈 11): 화면이 어두워지고 검은 별이 적 무리 위로 떨어짐 */
      const cx = foes.reduce((a, f) => a + f.x, 0) / foes.length; this.fx.push({ kind: 'eclipse', x: cx, y: 600, age: 0, life: 2.6, hitAt: 1.5, col: d.col, land: () => { for (const f of foes) { f.flash = 0.4; f.kb = 0.4; } burst(cx, 560, 60, { col: ['#ff9a5a', '#ffffff', '#3a0a20'], vmin: 120, vmax: 620, up: 200, lmax: 1 }); this.num(cx, 460, d.mul, d.col); S.shake = Math.max(S.shake, 20); } });
    } else {   /* 망자의 손: 앞 적 셋 발밑에서 뼈 손이 솟아 붙잡음 */
      for (const f of foes.slice(0, 3)) this.fx.push({ kind: 'hand', foe: f, x: f.x, y: f.y, age: 0, life: 1.3, hitAt: 0.3, col: d.col, land: () => { f.flash = 0.25; burst(f.x, f.y - 10, 8, { col: ['#d8ffe4', d.col], vmin: 40, vmax: 160, up: 80, lmax: 0.4 }); this.num(f.x, f.y - 80, d.mul / 3, d.col); } });
    }
  },
  draw() {
    if (S.lord.shotT > 0.12) { const s = this.staff(), q = (S.lord.shotT - 0.12) / 0.16, r = 46 * (WK() * 0.5 + 0.5) * (1.4 - q * 0.6); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = q; const g = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#c58bff'); g.addColorStop(1, 'rgba(120,60,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, 7); ctx.fill(); ctx.restore(); }   /* 지팡이 끝 번쩍 */
    if (!this.fx.length) return;
    ctx.save();
    for (const f of this.fx) {
      const k = f.age / f.life;
      if (f.kind === 'orb') { if (f.age < 0 || f.age > 0.22) continue; const p = f.age / 0.22, tx = f.t.f ? f.t.f.x : f.t.x, ty = f.t.f ? f.t.f.y - 80 * lerp(0.85, 1.1, f.t.f.d) : f.t.y;
        const P = q => [lerp(f.x0, tx, q), lerp(f.y0, ty, q) + f.dy * 4 * q * (1 - q)], k2 = UK() < 1 ? WK() * 0.4 + 0.3 : WK() * 0.7 + 0.3;   /* 11-15 눈 확인(효과재기 흰 픽셀 1등): 폰에서 지배자 구슬 꼬리가 굵기 80의 흰 띠가 되어 전장을 가로지름 → 폰은 꼬리 굵기 0.65배 */
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1;
        for (let j = 7; j >= 0; j--) { const q = Math.max(0, p - j * 0.045), [x, y] = P(q), r = (f.crit ? 15 : 12) * k2 * (1 - j * 0.1); ctx.globalAlpha = 1 - j * 0.12; const g = ctx.createRadialGradient(x, y, 1, x, y, r * 1.8); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, f.col); g.addColorStop(1, 'rgba(120,60,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 1.8, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1; continue; }
      if (f.kind === 'bigSlash') { const q = clamp(f.age / 0.14, 0, 1), fade = 1 - clamp((f.age - 0.12) / 0.26, 0, 1), cx = (f.x0 + f.x1) / 2, R = (f.x1 - f.x0) / 2, a0 = Math.PI * 1.02, a1 = a0 - Math.PI * 1.04 * q;   /* 왼쪽 위에서 아래로 휘어 오른쪽으로 빠지는 큰 베기 */
        ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
        for (const [lw, al, c] of [[70, 0.3, f.col], [36, 0.75, f.col], [13, 1, '#ffffff']]) { ctx.globalAlpha = al * fade; ctx.strokeStyle = c; ctx.lineWidth = lw * (0.6 + 0.4 * fade); ctx.shadowColor = f.col; ctx.shadowBlur = 24; ctx.beginPath(); ctx.ellipse(cx, f.y - R * 0.12, R, R * 0.3, -0.1, a0, a1, true); ctx.stroke(); }
        ctx.shadowBlur = 0; ctx.globalAlpha = 1; continue; }
      if (f.kind === 'orbRing') { const q = f.age / f.life, r = (f.big ? 70 : 46) * (0.3 + q) * (WK() * 0.5 + 0.5); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - q; ctx.strokeStyle = f.col; ctx.lineWidth = (f.big ? 7 : 5) * (1 - q) + 1; ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.75, 0, 0, 7); ctx.stroke();
        const g = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, r * 0.9); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(160,100,255,0)'); ctx.globalAlpha = (1 - q) * 0.8; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, r * 0.9, 0, 7); ctx.fill(); ctx.globalAlpha = 1; continue; }
      if (f.kind === 'spear') { const p = clamp(f.age / 0.25, 0, 1), x = lerp(f.x0, f.x1, p), y = lerp(f.y0, f.y1, p), tl = 120, an = Math.atan2(f.y1 - f.y0, f.x1 - f.x0);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - Math.max(0, (k - 0.6) / 0.4); ctx.strokeStyle = f.col; ctx.lineWidth = 9; ctx.shadowColor = '#c58bff'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.moveTo(x - Math.cos(an) * tl, y - Math.sin(an) * tl); ctx.lineTo(x, y); ctx.stroke();
        ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x + Math.cos(an) * 22, y + Math.sin(an) * 22); ctx.lineTo(x + Math.cos(an + 2.6) * 12, y + Math.sin(an + 2.6) * 12); ctx.lineTo(x + Math.cos(an - 2.6) * 12, y + Math.sin(an - 2.6) * 12); ctx.fill(); }
      else if (f.kind === 'nova') { const W2 = WK(), R = (f.big ? 520 : 320) * (0.15 + 0.85 * Math.sqrt(k)) * (0.5 + W2 * 0.5); ctx.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 2; j++) { ctx.globalAlpha = (1 - k) * (j ? 0.45 : 0.9); ctx.strokeStyle = j ? '#ffffff' : f.col; ctx.lineWidth = (f.big ? 16 : 10) * (1 - k) + 2; ctx.beginPath(); ctx.ellipse(f.x, f.y + 60, R * (j ? 0.72 : 1), R * 0.32 * (j ? 0.72 : 1), 0, 0, 7); ctx.stroke(); }
        const cw = (f.big ? 90 : 56) * (1 - k * 0.6); ctx.save(); ctx.translate(f.x, f.y - 300); ctx.scale(cw / 380, 1); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 380); g.addColorStop(0, f.col); g.addColorStop(0.55, f.col + '66'); g.addColorStop(1, f.col + '00'); ctx.globalAlpha = Math.max(0, 1 - k * 1.4) * 0.85; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 380, 0, 7); ctx.fill(); ctx.restore();   /* 11-15 22:55 느린 영상: 빛기둥을 네모로 칠해 위 · 아래 끝이 잘린 분홍 네모로 보였음 → 길쭉한 타원으로 사방이 서서히 사라지게 */
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
      else if (f.kind === 'fog') { ctx.globalCompositeOperation = 'source-over'; const a = Math.min(1, f.age * 3) * (1 - Math.max(0, (k - 0.7) / 0.3)); for (const p of f.puffs) { const r = p.r * (0.7 + 0.3 * Math.min(1, f.age * 2)), g = ctx.createRadialGradient(f.x + p.dx, f.y + p.dy, 4, f.x + p.dx, f.y + p.dy, r); g.addColorStop(0, `rgba(130,40,215,${0.55 * a})`); g.addColorStop(1, 'rgba(80,20,150,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x + p.dx + Math.sin(S.t + p.dx) * 6, f.y + p.dy, r, 0, 7); ctx.fill(); } }
      else if (f.kind === 'shout') { const r = 40 + k * 900; ctx.globalCompositeOperation = 'lighter'; for (let j = 0; j < 3; j++) { const rr = r - j * 70; if (rr < 10) continue; ctx.globalAlpha = (1 - k) * (0.9 - j * 0.25); ctx.strokeStyle = j ? '#ffcf5a' : '#fffbe0'; ctx.lineWidth = 18 - j * 5; ctx.beginPath(); ctx.ellipse(f.x, f.y, rr, rr * 0.35, 0, -1.2, 1.2); ctx.stroke(); } }
      else if (f.kind === 'gate') { const o = Math.min(1, f.age / 0.5) * (1 - Math.max(0, (k - 0.8) / 0.2)), gh = 260 * o, gw = 120; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = o;
        const g = ctx.createLinearGradient(f.x - gw, 0, f.x + gw, 0); g.addColorStop(0, 'rgba(20,60,120,0)'); g.addColorStop(0.5, 'rgba(120,200,255,.7)'); g.addColorStop(1, 'rgba(20,60,120,0)'); ctx.fillStyle = g; ctx.fillRect(f.x - gw, f.y - gh, gw * 2, gh);
        ctx.strokeStyle = '#d8f4ff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(f.x - gw * 0.6, f.y); ctx.lineTo(f.x - gw * 0.6, f.y - gh * 0.8); ctx.quadraticCurveTo(f.x, f.y - gh * 1.1, f.x + gw * 0.6, f.y - gh * 0.8); ctx.lineTo(f.x + gw * 0.6, f.y); ctx.stroke();
        for (const rd of f.riders) { const t2 = f.age - 0.45 - rd.dl; if (t2 < 0) continue; const x = f.x + t2 * 900, y = rd.y; if (x > VX1 + 200) continue; ctx.globalAlpha = 0.85 * o; const g2 = ctx.createRadialGradient(x, y - 50, 4, x, y - 50, 60); g2.addColorStop(0, 'rgba(230,248,255,.9)'); g2.addColorStop(0.5, 'rgba(110,190,255,.45)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g2; ctx.fillRect(x - 60, y - 110, 120, 120);
          ctx.strokeStyle = 'rgba(200,240,255,.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 10, y - 70); ctx.lineTo(x + 70, y - 60); ctx.stroke(); ctx.strokeStyle = 'rgba(140,210,255,.35)'; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(x - 20, y - 45); ctx.lineTo(x - 150, y - 40); ctx.stroke(); } }
      else if (f.kind === 'kingdom') { const sky = Math.sin(Math.min(1, k * 1.4) * Math.PI); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * sky; const g = ctx.createLinearGradient(0, VW.y, 0, 600); g.addColorStop(0, 'rgba(255,230,140,.9)'); g.addColorStop(1, 'rgba(255,200,80,0)'); ctx.fillStyle = g; ctx.fillRect(VW.x, VW.y, VW.w, 600 - VW.y);
        for (const p of f.sp) { const t2 = (f.age - p.dl) / 0.35; if (t2 < 0) continue; const y = lerp(VW.y - 60, p.y, Math.min(1, t2)); ctx.globalAlpha = t2 < 1 ? 1 : Math.max(0, 1 - (t2 - 1) * 0.8); ctx.strokeStyle = '#fff6c8'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(p.x, y - 90); ctx.lineTo(p.x, y); ctx.stroke(); ctx.strokeStyle = 'rgba(255,200,80,.5)'; ctx.lineWidth = 14; ctx.stroke();
          if (t2 >= 1) { const r = 30 + (t2 - 1) * 40; const g2 = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, r); g2.addColorStop(0, 'rgba(255,240,180,.7)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g2; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2); } } }
      else if (f.kind === 'eclipse') { const dk = Math.sin(Math.min(1, k * 1.2) * Math.PI); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.55 * dk; ctx.fillStyle = '#05000a'; ctx.fillRect(VIS.x0, VIS.y0, VIS.x1 - VIS.x0, VIS.y1 - VIS.y0);
        const p = clamp((f.age - 0.5) / 1.0, 0, 1), sx = f.x, sy = lerp(VW.y + 80, f.y - 60, p * p), r = 70; ctx.globalAlpha = Math.min(1, f.age * 2) * (1 - Math.max(0, (k - 0.75) / 0.25)); ctx.globalCompositeOperation = 'lighter'; const cg = ctx.createRadialGradient(sx, sy, r * 0.8, sx, sy, r * 2.2); cg.addColorStop(0, 'rgba(255,170,90,.9)'); cg.addColorStop(0.4, 'rgba(255,90,40,.35)'); cg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = cg; ctx.fillRect(sx - r * 2.2, sy - r * 2.2, r * 4.4, r * 4.4);
        ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.fill(); }
      else if (f.kind === 'meteor') { if (f.age < 0) continue; const p = clamp(f.age / 0.45, 0, 1), x = lerp(f.sx, f.x, p), y = lerp(f.y - 520, f.y - 20, p * p);
        if (p < 1) { ctx.globalCompositeOperation = 'lighter'; for (let j = 0; j < 8; j++) { const q = Math.max(0, p - j * 0.05), xx = lerp(f.sx, f.x, q), yy = lerp(f.y - 520, f.y - 20, q * q), r = 30 - j * 3; const g = ctx.createRadialGradient(xx, yy, 1, xx, yy, r); g.addColorStop(0, 'rgba(255,230,160,.9)'); g.addColorStop(0.5, 'rgba(255,100,20,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(xx - r, yy - r, r * 2, r * 2); }
          ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#efe4c8'; ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fill(); ctx.fillStyle = '#1a0a06'; ctx.beginPath(); ctx.arc(x - 4, y - 1, 2.6, 0, 7); ctx.arc(x + 4, y - 1, 2.6, 0, 7); ctx.fill(); }
        else { const q = (f.age - 0.45) / 0.55; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - q; const r = 40 + q * 110, g = ctx.createRadialGradient(f.x, f.y - 20, 4, f.x, f.y - 20, r); g.addColorStop(0, 'rgba(255,220,140,.8)'); g.addColorStop(0.5, 'rgba(255,90,20,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(f.x - r, f.y - 20 - r, r * 2, r * 2); } }
      else if (f.kind === 'chain') { const n = f.pts.length - 1, upto = Math.min(n, Math.floor(f.age / 0.07) + 1); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - Math.max(0, (k - 0.55) / 0.45); ctx.lineJoin = 'round';
        for (const [lw, c] of [[10, 'rgba(160,90,255,.35)'], [4, f.col], [1.6, '#ffffff']]) { ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); for (let i = 0; i < upto; i++) { const a = f.pts[i], b = f.pts[i + 1]; ctx.moveTo(a.x, a.y); for (let j = 1; j <= 6; j++) { const u = j / 6; ctx.lineTo(lerp(a.x, b.x, u) + (j < 6 ? rnd(-14, 14) : 0), lerp(a.y, b.y, u) + (j < 6 ? rnd(-14, 14) : 0)); } } ctx.stroke(); } }
      else if (f.kind === 'scythe') { const p = clamp(f.age / 0.85, 0, 1), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, x = lerp(f.x0, f.x1, e), a = Math.min(1, f.age * 6) * (1 - Math.max(0, (k - 0.75) / 0.25)) * (UK() < 1 ? 0.6 : 1);   /* 11-15 폰에선 낫 빛을 0.6배(전장 전체를 하얗게 덮었음) */ ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
        ctx.shadowColor = '#7ae0ff'; ctx.shadowBlur = 30; for (let j = 0; j < 6; j++) { const xx = x - j * 60; ctx.globalAlpha = a * (1 - j * 0.15); ctx.strokeStyle = j ? 'rgba(130,230,255,.55)' : '#ffffff'; ctx.lineWidth = j ? 26 - j * 3 : 12; ctx.beginPath(); ctx.arc(xx - 60, f.y + 80, 230, -1.3, 0.2); ctx.stroke(); } ctx.shadowBlur = 0;
        ctx.globalAlpha = a * 0.8; ctx.strokeStyle = '#bfefff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x - 60, f.y + 80); ctx.lineTo(x - 290, f.y + 320); ctx.stroke(); }
      else if (f.kind === 'wraith') { const a = Math.min(1, f.age * 2.5) * (1 - Math.max(0, (k - 0.75) / 0.25)); ctx.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 8; j++) { const an = f.age * 3.2 + j * Math.PI / 4, rx = 160 + 30 * Math.sin(j), ry = 70, x = f.x + Math.cos(an) * rx * (0.6 + 0.4 * Math.min(1, f.age)), y = f.y + Math.sin(an) * ry;
          ctx.globalAlpha = a * 0.85; const g = ctx.createRadialGradient(x, y, 2, x, y, 34); g.addColorStop(0, 'rgba(240,235,255,.85)'); g.addColorStop(0.6, 'rgba(150,130,255,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - 34, y - 34, 68, 68);
          ctx.strokeStyle = 'rgba(200,190,255,.45)'; ctx.lineWidth = 6; ctx.beginPath(); for (let q = 0; q < 6; q++) { const aa = an - q * 0.12; const xx = f.x + Math.cos(aa) * rx * (0.6 + 0.4 * Math.min(1, f.age)), yy = f.y + Math.sin(aa) * ry; q ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke();
          ctx.fillStyle = 'rgba(20,10,40,.9)'; ctx.beginPath(); ctx.arc(x - 5, y - 3, 3, 0, 7); ctx.arc(x + 5, y - 3, 3, 0, 7); ctx.fill(); } }
      else if (f.kind === 'hand') { const up = Math.sin(Math.min(1, k * 1.6) * Math.PI / 2) * (1 - Math.max(0, (k - 0.75) / 0.25)), x = f.foe.dead ? f.x : f.foe.x, y = f.y;
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, up * 1.5); ctx.strokeStyle = '#e8f5e0'; ctx.lineCap = 'round'; ctx.shadowColor = f.col; ctx.shadowBlur = 18; ctx.lineWidth = 11; const HA = 74;   /* 16:55 화면 보고: 손이 작아 안 보여서 1.6배 */
        ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x, y - HA * up); ctx.stroke(); ctx.lineWidth = 6;   /* 팔뚝 + 손가락 다섯 */
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.34, L2 = (i === 0 || i === 4 ? 30 : 42) * up; ctx.beginPath(); ctx.moveTo(x, y - HA * up); ctx.quadraticCurveTo(x + Math.cos(a) * L2 * 0.7, y - HA * up + Math.sin(a) * L2 * 0.7, x + Math.cos(a) * L2 + (i - 2) * 3, y - HA * up + Math.sin(a) * L2 - 6 * up); ctx.stroke(); }
        ctx.shadowBlur = 0; ctx.globalAlpha = 0.7 * up; ctx.fillStyle = '#0c0408'; ctx.beginPath(); ctx.ellipse(x, y + 4, 40, 10, 0, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * up; ctx.fillStyle = f.col; ctx.beginPath(); ctx.ellipse(x, y + 4, 46, 12, 0, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
    ctx.restore();
  },
};

/* 지팡이 등급 빛(주력이 눈에 보이게): 10단계마다 나무 → 뼈 → 은 → 금 → 심연 → 왕. 등급이 오를수록 보석 빛이 커지고, 금부터 불티, 심연부터 도는 고리, 왕은 불꽃 왕관 */
const STAFF_COL = ['#c9a27a', '#efe6cf', '#cfe3ff', '#ffd76a', '#b06bff', '#ff7a3a'];
let staffSeen = -1;
function drawStaff() {
  if (typeof st === 'undefined' || !st || !st.up) return;
  const lv = st.up.magic || 0, tier = Math.min(5, Math.floor(lv / 10)), c = STAFF_COL[tier], p0 = LM.staff(), x = p0.x, y = p0.y - S.lord.raise * 30 + Math.sin(S.t * 1.6) * 4;
  if (staffSeen >= 0 && tier > staffSeen) { say(L.staff.up(L.staff.tiers[tier]), W / 2, H * 0.3, { size: 50, col: '#ffffff', glow: c, life: 2, vy: 0, stamp: true, screen: true }); burst(x, y, 40, { col: [c, '#ffffff'], vmin: 80, vmax: 360, up: 60, lmax: 0.8 }); S.shake = Math.max(S.shake, 6); }
  staffSeen = tier;
  const pu = 0.75 + 0.25 * Math.sin(S.t * 4), r = (16 + tier * 9 + Math.min(9, lv % 10)) * pu;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 1, x, y, r * 2.2); g.addColorStop(0, '#ffffff'); g.addColorStop(0.18, c); g.addColorStop(1, c + '00'); ctx.globalAlpha = 0.35 + tier * 0.1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, 7); ctx.fill();
  if (tier >= 4) { ctx.globalAlpha = 0.7; ctx.strokeStyle = c; ctx.lineWidth = 2.5; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.ellipse(x, y, r * (1.6 + i * 0.5), r * (0.55 + i * 0.2), S.t * (1.2 - i * 2.1), 0, 7); ctx.stroke(); } }
  if (tier >= 3 && Math.random() < 0.3 + tier * 0.08) S.parts.push({ x: x + rnd(-r, r) * 0.6, y: y + rnd(-6, 6), vx: rnd(-15, 15), vy: rnd(-110, -50), life: 0.9, age: 0, size: rnd(2, 4.5), col: tier === 5 ? (Math.random() < 0.5 ? '#ffb020' : '#ff4a2a') : c, g: -30, add: true, kind: 'dot', rot: 0, vr: 0 });
  ctx.restore(); ctx.globalAlpha = 1;
}
