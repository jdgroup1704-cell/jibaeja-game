/* 2D 관절(종이 인형) 군주 — 부위 그림을 관절로 이어 돌림 (11-19 대표님 「2D 관절까지는 해야」) */
const RIGS = {
  ghost: { img: 'rig_ghost', k: 0.5,
    R: [[0, 0, 122.5, 144], [124.5, 0, 101.5, 182], [228, 0, 124.5, 157.5], [354.5, 0, 104, 143], [460.5, 0, 104.5, 150], [567, 0, 98, 132], [0, 184, 70.5, 103], [72.5, 184, 69.5, 131.5], [144, 184, 61.5, 140.5], [207.5, 184, 65.5, 132], [275, 184, 84, 140.5]],
    // 이름: [그림 번호, 관절 x, 관절 y, 부모, 부모 위 붙는 x, y, 기본 각도(도)]  — 좌표는 원본(2배) 부위 그림 기준
    P: { torso: [1, 82, 320, null, 0, 0, 0], head: [0, 135, 258, 'torso', 100, 36, 0], cape: [2, 150, 22, 'torso', 105, 45, 0, 1.3],
      bArmU: [3, 180, 60, 'torso', 32, 92, 0], bArmF: [6, 55, 25, 'bArmU', 60, 262, 0], fArmU: [5, 25, 55, 'torso', 170, 92, 0], fArmF: [4, 30, 250, 'fArmU', 145, 235, 0],
      bLegU: [7, 60, 25, 'torso', 50, 250, 0], bLegL: [8, 60, 25, 'bLegU', 80, 195, 0], fLegU: [9, 75, 25, 'torso', 118, 252, 0], fLegL: [10, 65, 25, 'fLegU', 66, 195, 0] },
    order: ['cape', 'bArmU', 'bArmF', 'bLegU', 'bLegL', 'fLegU', 'fLegL', 'torso', 'head', 'fArmU', 'fArmF'],
    foot: 345, hpx: 880, glow: ['fArmF', 150, 95] }   // 엉덩이 관절에서 발바닥까지(원본 px) — 땅에 붙이기
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
  if (o.rim && typeof rimOf === 'function') { const RI = rimOf(R.img, I, o.rim); if (RI) { const k2 = 2 / s; for (const n of R.order) { const p = R.P[n], r = R.R[p[0]], m = m0.multiply(rigMat(R, n, pose, base)); for (const [ox, oy] of [[-k2, 0], [k2, 0], [0, -k2], [0, k2]]) { ctx.setTransform(m.translate(ox, oy)); ctx.drawImage(RI, r[0], r[1], r[2], r[3], 0, 0, r[2] / R.k, r[3] / R.k); } } } }
  for (const n of R.order) { const p = R.P[n], r = R.R[p[0]], m = m0.multiply(rigMat(R, n, pose, base)); ctx.setTransform(m); ctx.drawImage(I, r[0], r[1], r[2], r[3], 0, 0, r[2] / R.k, r[3] / R.k); }
  ctx.setTransform(m0);
  if (o.flash > 0) { /* 맞을 때 하얗게: 같은 부위를 밝게 덧그림 */ ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, o.flash) * 0.7; for (const n of R.order) { const p = R.P[n], r = R.R[p[0]]; ctx.setTransform(m0.multiply(rigMat(R, n, pose, base))); ctx.drawImage(I, r[0], r[1], r[2], r[3], 0, 0, r[2] / R.k, r[3] / R.k); } ctx.setTransform(m0); }
  ctx.restore(); return true;
}

/* 동작: t=시간(초), mv=걷기 위상(없으면 서 있음), atk=공격 진행 0~1(없으면 -1), hurt=0~1 */
function rigPose(t, mv, atk, hurt, style) {
  const b = Math.sin(t * 2.2), P = { dy: b * 3, root: 0.012 * b, head: 0.035 * Math.sin(t * 2.2 - 0.7), cape: 0.05 * Math.sin(t * 1.7),
    fArmU: -0.2 + 0.05 * b, fArmF: -0.65 + 0.08 * Math.sin(t * 2.2 + 0.5), bArmU: 0.06 * b, bArmF: 0.05 * Math.sin(t * 2.2 + 1) };
  if (mv != null) { const s = Math.sin(mv), c = Math.cos(mv);
    P.fLegU = -0.45 * s; P.bLegU = 0.45 * s; P.fLegL = 0.55 * Math.max(0, c); P.bLegL = 0.55 * Math.max(0, -c);
    P.bArmU += -0.35 * s; P.fArmU += 0.18 * s; P.dy += -Math.abs(Math.sin(mv)) * 10 + 4; P.root += 0.06; P.cape += 0.12 + 0.05 * c; P.head -= 0.04; }
  P.skirt = 0.025 * Math.sin(t * 1.9); P.weap = 0.04 * Math.sin(t * 2.2); P.staff = 0.03 * Math.sin(t * 2.2 + 1);
  if (mv != null) P.skirt += 0.07 * Math.sin(mv * 2);
  if (atk >= 0 && style === 'swing') { const up = atk < 0.35 ? atk / 0.35 : 1, dn = atk < 0.35 ? 0 : atk < 0.6 ? (atk - 0.35) / 0.25 : 1, bk = atk < 0.6 ? 0 : (atk - 0.6) / 0.4, k = dn * (1 - bk), pull = up * (1 - dn);   /* 낫: 크게 치켜들었다 앞으로 베어 내림 */
    P.fArmU += -1.9 * pull + 0.9 * k; P.fArmF += -0.4 * pull + 0.3 * k; P.weap += -0.5 * pull + 0.9 * k; P.root += -0.1 * pull + 0.18 * k; P.dx = -8 * pull + 22 * k; P.head += 0.1 * k; P.bArmU += 0.4 * pull - 0.3 * k; P.cape += 0.25 * k; P.fLegU = (P.fLegU || 0) - 0.35 * k; P.bLegU = (P.bLegU || 0) + 0.3 * k; atk = -1; }
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

/* 해골 병사 3종(검 · 방패 · 활): 머리 · 몸통 · 앞팔(무기) · 뒷팔 · 다리 둘 */
const SK_R = [[0.0, 0.0, 84.4, 91.2], [86.0, 0.0, 67.2, 94.8], [154.8, 0.0, 75.6, 102.8], [232.0, 0.0, 46.8, 71.6], [280.4, 0.0, 46.4, 87.6], [328.4, 0.0, 47.6, 81.6], [0.0, 104.4, 84.4, 89.6], [86.0, 104.4, 67.2, 92.8], [154.8, 104.4, 80.0, 77.6], [236.4, 104.4, 62.4, 72.4], [300.4, 104.4, 42.4, 86.8], [344.4, 104.4, 45.6, 81.2], [0.0, 198.8, 84.0, 90.0], [85.6, 198.8, 66.4, 93.2], [153.6, 198.8, 65.6, 110.0], [220.8, 198.8, 60.8, 76.8], [283.2, 198.8, 42.0, 88.4], [326.8, 198.8, 46.0, 84.0]];
function skRig(o, fa, fx, fy, ba, bx, by) { return { img: 'rig_sk', k: 0.4, R: SK_R, foot: 190, hpx: 560,
  P: { torso: [o + 1, 78, 205, null, 0, 0, 0], head: [o, 95, 208, 'torso', 77, 24, 0],
    bArm: [o + 3, bx, by, 'torso', 30, 58, ba], fArm: [o + 2, fx, fy, 'torso', 142, 54, fa],
    bLeg: [o + 5, 22, 22, 'torso', 58, 192, 0], fLeg: [o + 4, 36, 22, 'torso', 98, 194, 0] },
  order: ['bArm', 'bLeg', 'fLeg', 'torso', 'head', 'fArm'] }; }
RIGS.skSword = skRig(0, 0, 45, 95, 0, 80, 20);
RIGS.skShield = skRig(6, -38, 22, 32, 0, 55, 40);
RIGS.skArch = skRig(12, 0, 45, 95, 0, 55, 40);
/* 병사 동작: wf=걷기 위상(움직일 때만), atk=공격 0~1, ut=병종 */
function skPose(t, wf, atk, ut, seed) {
  const b = Math.sin(t * 3 + seed), P = { dy: b * 2, head: 0.04 * Math.sin(t * 3 + seed - 0.8), fArm: 0.05 * b, bArm: -0.05 * b };
  if (wf != null) { const s = Math.sin(wf), c = Math.cos(wf); P.fLeg = -0.55 * s; P.bLeg = 0.55 * s; P.bArm += 0.45 * s; P.fArm += -0.2 * s; P.dy += -Math.abs(s) * 9; P.root = 0.07 + 0.03 * c; P.head -= 0.05 * c; }
  if (atk >= 0) { const up = atk < 0.35 ? atk / 0.35 : 1, dn = atk < 0.35 ? 0 : atk < 0.6 ? (atk - 0.35) / 0.25 : 1, back = atk < 0.6 ? 0 : (atk - 0.6) / 0.4, k = dn * (1 - back), pull = up * (1 - dn);
    if (ut === 'arch') { P.bArm += 0.9 * pull - 0.2 * k; P.fArm += -0.35 * pull; P.root = (P.root || 0) - 0.06 * pull + 0.04 * k; P.dx = -4 * k; }   /* 시위 당겼다 놓기(반동) */
    else if (ut === 'shield') { P.fArm += -0.5 * k + 0.2 * pull; P.bArm += -1.0 * k + 0.4 * pull; P.root = (P.root || 0) + 0.16 * k - 0.05 * pull; P.dx = 14 * k - 4 * pull; }   /* 방패로 밀치며 단검 찌르기 */
    else { P.fArm += -1.5 * pull + 1.3 * k; P.root = (P.root || 0) - 0.08 * pull + 0.2 * k; P.dx = -5 * pull + 14 * k; P.head += 0.1 * k; P.fLeg = (P.fLeg || 0) - 0.3 * k; P.bLeg = (P.bLeg || 0) + 0.25 * k; } }   /* 칼 치켜들었다 내려베기 */
  return P;
}

/* 뼈의 장군 · 역병 마녀 (rig_lords.webp, 원본 대비 0.45) */
const LR = [[0.0, 0.0, 107.1, 134.6], [108.9, 0.0, 89.1, 158.8], [199.8, 0.0, 116.5, 134.1], [318.2, 0.0, 87.3, 139.1], [407.2, 0.0, 71.5, 99.5], [480.6, 0.0, 66.2, 112.5], [548.6, 0.0, 71.5, 95.4], [0.0, 160.7, 63.9, 101.7], [65.7, 160.7, 97.7, 180.9], [165.2, 160.7, 70.7, 141.3], [237.6, 160.7, 61.6, 111.6], [301.1, 160.7, 76.0, 132.8],
  [378.9, 160.7, 141.8, 164.7], [522.5, 160.7, 88.2, 151.7], [0.0, 343.4, 133.2, 149.4], [135.0, 343.4, 99.5, 429.8], [236.2, 343.4, 78.3, 125.1], [316.4, 343.4, 118.4, 146.2], [436.5, 343.4, 76.0, 127.4], [514.4, 343.4, 115.7, 87.3]];
RIGS.bone = { img: 'rig_lords', k: 0.45, R: LR, foot: 450, hpx: 1000, style: 'swing', glow: ['weap', 195, 70],
  P: { torso: [1, 95, 315, null, 0, 0, 0], head: [0, 115, 282, 'torso', 100, 24, 0], cape: [2, 145, 22, 'torso', 100, 40, 0, 1.15],
    bArmU: [5, 75, 70, 'torso', 25, 78, 0], bArmF: [6, 55, 15, 'bArmU', 110, 235, 0], fArmU: [3, 100, 90, 'torso', 175, 78, 0], fArmF: [4, 40, 15, 'fArmU', 100, 292, -20],
    weap: [8, 85, 250, 'fArmF', 112, 168, 60, 1.8],
    bLegU: [10, 65, 20, 'torso', 62, 300, 0], bLegL: [11, 65, 20, 'bLegU', 55, 222, 0], fLegU: [7, 55, 20, 'torso', 128, 300, 0], fLegL: [9, 65, 20, 'fLegU', 55, 202, 0] },
  order: ['cape', 'bArmU', 'bArmF', 'bLegU', 'bLegL', 'fLegU', 'fLegL', 'torso', 'head', 'weap', 'fArmU', 'fArmF'] };
RIGS.witch = { img: 'rig_lords', k: 0.45, R: LR, foot: 315, hpx: 1000, style: 'cast', glow: ['fArmF', 195, 150],
  P: { torso: [13, 100, 320, null, 0, 0, 0], skirt: [14, 155, 18, 'torso', 100, 312, 0], head: [12, 195, 330, 'torso', 100, 22, 0],
    bArmU: [18, 130, 25, 'torso', 32, 55, 10], bArmF: [19, 30, 30, 'bArmU', 70, 252, 50], staff: [15, 110, 560, 'bArmF', 205, 72, -62],
    fArmU: [16, 140, 25, 'torso', 172, 52, -15], fArmF: [17, 25, 205, 'fArmU', 60, 252, 0] },
  order: ['bArmU', 'staff', 'bArmF', 'skirt', 'torso', 'head', 'fArmU', 'fArmF'] };

/* 보스 3마리 (rig_boss.webp, 부위 그림 800 기준 × 0.8) — 치켜들기(raise) → 내려찍기(slam) */
const BR = [[0, 0, 163, 211], [165, 0, 128, 192], [295, 0, 173, 183], [470, 0, 109, 170], [581, 0, 140, 86], [723, 0, 115, 156], [840, 0, 116, 80], [958, 0, 90, 137], [1050, 0, 87, 156], [1139, 0, 82, 147], [1223, 0, 90, 150], [0, 213, 158, 265], [160, 213, 155, 214], [317, 213, 135, 192], [454, 213, 179, 206], [635, 213, 115, 204], [752, 213, 134, 86], [888, 213, 114, 173], [1004, 213, 124, 90], [1130, 213, 79, 144], [1211, 213, 95, 174], [1308, 213, 86, 164], [0, 480, 103, 158], [105, 480, 164, 270], [271, 480, 158, 213], [431, 480, 130, 187], [563, 480, 183, 192], [748, 480, 111, 185], [861, 480, 146, 104], [1009, 480, 126, 170], [1137, 480, 131, 94], [1270, 480, 86, 139], [0, 752, 92, 162], [94, 752, 84, 152], [180, 752, 87, 154], [269, 752, 157, 272]];
function bossRig(o, c) { const P = {}; for (const n in c) { const v = c[n].slice(); v[0] += o; P[n] = v; }
  return { img: 'rig_boss', k: 0.8, R: BR, foot: 300, hpx: 640, style: 'boss', glow: ['weap', 100, 60], P,
    order: ['cape', 'bArmU', 'bArmF', 'bLegU', 'bLegL', 'fLegU', 'fLegL', 'torso', 'head', 'weap', 'fArmU', 'fArmF'] }; }
RIGS.bossPaladin = bossRig(0, { torso: [1, 80, 165, null, 0, 0, 0], head: [0, 160, 205, 'torso', 85, 25, 0], cape: [2, 108, 22, 'torso', 80, 30, 0, 1.15],
  bArmU: [5, 85, 40, 'torso', 30, 55, 0], bArmF: [6, 22, 40, 'bArmU', 55, 175, 90], fArmU: [3, 95, 45, 'torso', 140, 55, 0], fArmF: [4, 25, 55, 'fArmU', 113, 195, 90],
  weap: [11, 100, 250, 'fArmF', 140, 55, -13, 1.3],
  bLegU: [7, 55, 15, 'torso', 55, 165, 0], bLegL: [9, 55, 10, 'bLegU', 58, 140, 0], fLegU: [7, 55, 15, 'torso', 105, 170, 0], fLegL: [8, 70, 15, 'fLegU', 58, 140, 0] });
RIGS.bossBlood = bossRig(12, { torso: [1, 85, 170, null, 0, 0, 0], head: [0, 140, 225, 'torso', 85, 18, 0], cape: [2, 112, 25, 'torso', 85, 28, 0, 1.15],
  bArmU: [5, 85, 55, 'torso', 30, 55, 0], bArmF: [6, 25, 35, 'bArmU', 40, 195, 90], fArmU: [3, 95, 40, 'torso', 145, 55, 0], fArmF: [4, 20, 40, 'fArmU', 115, 225, 90],
  weap: [11, 115, 230, 'fArmF', 140, 50, -13, 1.3],
  bLegU: [7, 55, 15, 'torso', 60, 170, 0], bLegL: [9, 55, 10, 'bLegU', 60, 150, 0], fLegU: [7, 55, 15, 'torso', 110, 172, 0], fLegL: [8, 60, 15, 'fLegU', 60, 150, 0] });
RIGS.bossIce = bossRig(24, { torso: [1, 85, 165, null, 0, 0, 0], head: [0, 150, 200, 'torso', 90, 20, 0], cape: [2, 115, 25, 'torso', 85, 28, 0, 1.15],
  bArmU: [5, 90, 55, 'torso', 28, 55, 0], bArmF: [6, 25, 35, 'bArmU', 45, 185, 90], fArmU: [3, 90, 50, 'torso', 140, 55, 0], fArmF: [4, 20, 45, 'fArmU', 95, 190, 90],
  weap: [11, 95, 240, 'fArmF', 140, 55, -13, 1.3],
  bLegU: [7, 55, 15, 'torso', 58, 165, 0], bLegL: [9, 55, 10, 'bLegU', 55, 145, 0], fLegU: [7, 55, 15, 'torso', 108, 168, 0], fLegL: [8, 70, 15, 'fLegU', 55, 145, 0] });
/* 보스 동작: mv=걷기 위상, act='idle'|'raise'|'slam', at=그 동작 시간(초) */
function bossPose(t, mv, act, at, hurt) {
  const b = Math.sin(t * 1.8), P = { dy: b * 3, root: 0.015 * b, head: 0.04 * Math.sin(t * 1.8 - 0.7), cape: 0.06 * Math.sin(t * 1.4),
    fArmU: 0.1 + 0.05 * b, fArmF: -1.1 + 0.06 * Math.sin(t * 1.8 + 0.5), bArmU: -0.1 + 0.05 * b, bArmF: -0.5, weap: 0.04 * Math.sin(t * 1.8) };
  if (mv != null) { const s = Math.sin(mv), c = Math.cos(mv);
    P.fLegU = -0.4 * s; P.bLegU = 0.4 * s; P.fLegL = 0.5 * Math.max(0, c); P.bLegL = 0.5 * Math.max(0, -c);
    P.bArmU += -0.3 * s; P.dy += -Math.abs(s) * 8 + 3; P.root += 0.05; P.cape += 0.1 + 0.05 * c; }
  const E = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  let up = 0, k = 0;
  if (act === 'raise') { up = E(at / 0.75); P.dy += Math.sin(t * 40) * 1.5 * E((at - 0.75) / 0.25); }   /* 끝에서 부르르 — 곧 내려친다 */
  else if (act === 'slam') { const d = E(at / 0.13), r = E((at - 0.3) / 0.3); up = 1 - d; k = d * (1 - r); }
  if (up > 0 || k > 0) {
    P.fArmU += -2.9 * up - 0.85 * k; P.fArmF += 0.45 * up + 1.0 * k; P.weap += 1.55 * k;
    P.bArmU += -2.2 * up - 0.6 * k; P.bArmF += -0.3 * up;
    P.root += -0.16 * up + 0.3 * k; P.dy += -10 * up + 18 * k; P.dx = -6 * up + 18 * k; P.head += -0.12 * up + 0.15 * k; P.cape += 0.1 * up + 0.3 * k;
    P.fLegU = (P.fLegU || 0) - 0.15 * up - 0.35 * k; P.fLegL = (P.fLegL || 0) + 0.4 * k; P.bLegU = (P.bLegU || 0) + 0.1 * up + 0.2 * k; P.bLegL = (P.bLegL || 0) + 0.3 * k; }
  if (hurt > 0) { P.root -= 0.08 * hurt; P.head += 0.12 * hurt; P.dx = (P.dx || 0) - 6 * hurt; }
  return P;
}
