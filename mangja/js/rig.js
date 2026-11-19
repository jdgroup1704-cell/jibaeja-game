/* 2D 관절(종이 인형) 군주 — 부위 그림을 관절로 이어 돌림 (11-19 대표님 「2D 관절까지는 해야」) */
const RIGS = {
  ghost: { img: 'rig_ghost', k: 0.5,
    R: [[0, 0, 122.5, 144], [124.5, 0, 101.5, 182], [228, 0, 124.5, 157.5], [354.5, 0, 104, 143], [460.5, 0, 104.5, 150], [567, 0, 98, 132], [0, 184, 70.5, 103], [72.5, 184, 69.5, 131.5], [144, 184, 61.5, 140.5], [207.5, 184, 65.5, 132], [275, 184, 84, 140.5]],
    // 이름: [그림 번호, 관절 x, 관절 y, 부모, 부모 위 붙는 x, y, 기본 각도(도)]  — 좌표는 원본(2배) 부위 그림 기준
    P: { torso: [1, 82, 320, null, 0, 0, 0], head: [0, 135, 258, 'torso', 100, 36, 0], cape: [2, 150, 22, 'torso', 105, 45, 0, 1.3],
      bArmU: [3, 180, 60, 'torso', 32, 92, 0], bArmF: [6, 55, 25, 'bArmU', 60, 262, 0], fArmU: [5, 25, 55, 'torso', 170, 92, 0], fArmF: [4, 30, 250, 'fArmU', 145, 235, 0],
      bLegU: [7, 60, 25, 'torso', 50, 250, 0], bLegL: [8, 60, 25, 'bLegU', 80, 195, 0], fLegU: [9, 75, 25, 'torso', 118, 252, 0], fLegL: [10, 65, 25, 'fLegU', 66, 195, 0] },
    order: ['cape', 'bArmU', 'bArmF', 'bLegU', 'bLegL', 'fLegU', 'fLegL', 'torso', 'head', 'fArmU', 'fArmF'],
    foot: 345, hpx: 880 }   // 엉덩이 관절에서 발바닥까지(원본 px) — 땅에 붙이기
};
function rigMat(R, name, pose, base) {   // 부위 그림 좌표 → 화면 행렬
  const p = R.P[name], rot = ((p[6] || 0) * Math.PI / 180) + (pose[name] || 0);
  const m = p[3] ? rigMat(R, p[3], pose, base).translate(p[4], p[5]) : base;
  return m.rotate(rot * 180 / Math.PI).scale(p[7] || 1).translate(-p[1], -p[2]);
}
function drawRig(ctx, IMG, key, x, y, h, dir, pose, o = {}) {
  const R = RIGS[key], I = IMG[R.img]; if (!I || !I.naturalWidth) return false;
  const s = h / (R.hpx || 640);   // 원본 px → 화면
  let base = new DOMMatrix().translate(x, y).scale(dir * s, s).translate(pose.dx || 0, -(R.foot) + (pose.dy || 0)).rotate((pose.root || 0) * 180 / Math.PI);
  ctx.save(); if (o.a != null) ctx.globalAlpha = o.a; const m0 = ctx.getTransform();
  for (const n of R.order) { const p = R.P[n], r = R.R[p[0]], m = m0.multiply(rigMat(R, n, pose, base)); ctx.setTransform(m); ctx.drawImage(I, r[0], r[1], r[2], r[3], 0, 0, r[2] / R.k, r[3] / R.k); }
  ctx.setTransform(m0);
  if (o.flash > 0) { /* 맞을 때 하얗게: 같은 부위를 밝게 덧그림 */ ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, o.flash) * 0.7; for (const n of R.order) { const p = R.P[n], r = R.R[p[0]]; ctx.setTransform(m0.multiply(rigMat(R, n, pose, base))); ctx.drawImage(I, r[0], r[1], r[2], r[3], 0, 0, r[2] / R.k, r[3] / R.k); } ctx.setTransform(m0); }
  ctx.restore(); return true;
}

/* 동작: t=시간(초), mv=걷기 위상(없으면 서 있음), atk=공격 진행 0~1(없으면 -1), hurt=0~1 */
function rigPose(t, mv, atk, hurt) {
  const b = Math.sin(t * 2.2), P = { dy: b * 3, root: 0.012 * b, head: 0.035 * Math.sin(t * 2.2 - 0.7), cape: 0.05 * Math.sin(t * 1.7),
    fArmU: -0.2 + 0.05 * b, fArmF: -0.65 + 0.08 * Math.sin(t * 2.2 + 0.5), bArmU: 0.06 * b, bArmF: 0.05 * Math.sin(t * 2.2 + 1) };
  if (mv != null) { const s = Math.sin(mv), c = Math.cos(mv);
    P.fLegU = -0.45 * s; P.bLegU = 0.45 * s; P.fLegL = 0.55 * Math.max(0, c); P.bLegL = 0.55 * Math.max(0, -c);
    P.bArmU += -0.35 * s; P.fArmU += 0.18 * s; P.dy += -Math.abs(Math.sin(mv)) * 10 + 4; P.root += 0.06; P.cape += 0.12 + 0.05 * c; P.head -= 0.04; }
  if (atk >= 0) { const e = atk < 0.3 ? atk / 0.3 : 1, f = atk < 0.3 ? 0 : atk < 0.55 ? (atk - 0.3) / 0.25 : 1, r = atk < 0.55 ? 0 : (atk - 0.55) / 0.45, k = f * (1 - r);   /* 젖히기 → 내지르기 → 돌아오기 */
    const pull = e * (1 - f);
    P.fArmU += 0.7 * pull - 1.25 * k; P.fArmF += 0.5 * pull + 0.55 * k; P.root += -0.07 * pull + 0.14 * k; P.dx = (-6 * pull + 18 * k); P.head += 0.08 * k; P.bArmU += -0.3 * k; P.cape += 0.15 * k;
    P.fLegU = (P.fLegU || 0) - 0.25 * k; P.bLegU = (P.bLegU || 0) + 0.2 * k; }
  if (hurt > 0) { P.root -= 0.16 * hurt; P.head += 0.2 * hurt; P.dx = (P.dx || 0) - 14 * hurt; P.fArmU += 0.3 * hurt; P.bArmU -= 0.3 * hurt; }
  return P;
}
function rigPt(key, part, px, py, x, y, h, dir, pose) {   // 부위 그림 위 한 점의 화면 좌표(불꽃 손 위치 등)
  const R = RIGS[key], s = h / (R.hpx || 640), base = new DOMMatrix().translate(x, y).scale(dir * s, s).translate(pose.dx || 0, -(R.foot) + (pose.dy || 0)).rotate((pose.root || 0) * 180 / Math.PI);
  const p = rigMat(R, part, pose, base).transformPoint(new DOMPoint(px, py)); return [p.x, p.y];
}
