'use strict';
let VIS = { x0: 0, y0: 0, x1: 1280, y1: 720 };
// 그리기: 대마법 장면에서 가져옴. S(화면 상태)를 그림
// ───────────── 그리기 ─────────────
let focusX = 420;
function fillAll() { const m = ctx.getTransform(); ctx.fillRect(-m.e / m.a, -m.f / m.d, cv.width / m.a, cv.height / m.d); }   // 지금 좌표계로 캔버스 전체 채우기
function draw() {
  if (TRAILER && cv.height > cv.width * 1.2) {   // 세로 광고: 전장을 크게, 초점(군단 → 거인)을 따라 옆으로 이동
    focusX += ((window.__focusX ?? 420) - focusX) * 0.04;
    const s2 = cv.height / H * 0.5; view = { s: s2, ox: cv.width / 2 - focusX * s2, oy: cv.height * 0.56 - 560 * s2, dpr: view.dpr };
  }
  const { s, ox, oy } = view;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';   /* 큰 그림을 작게 줄일 때 계단(도트처럼 보임)이 생기지 않게 — 대표님 「픽셀 도트 느낌?」 */
  const calm = st.settings && st.settings.calm, sk = calm ? 0 : S.shake, sx = (Math.random() - 0.5) * sk, sy = (Math.random() - 0.5) * sk;   /* 설정 「흔들림 · 번쩍임 줄이기」 */
  const z = S.cam.z;
  // 장면 좌표 → 화면 좌표 (카메라 + 흔들림)
  const tx = ox + (W / 2 - S.cam.x * z) * s + sx * s, ty = oy + (H / 2 - S.cam.y * z) * s + sy * s, k = s * z;
  ctx.setTransform(k, 0, 0, k, tx, ty); window.__VT = { k, tx, ty };
  VIS = { x0: -tx / k, y0: -ty / k, x1: (cv.width - tx) / k, y1: (cv.height - ty) / k };   // 화면에 보이는 세계 범위(남는 칸까지 배경으로 채움)
  ctx.save(); ctx.beginPath(); ctx.rect(VIS.x0, VIS.y0, VIS.x1 - VIS.x0, VIS.y1 - VIS.y0); ctx.clip();
  drawSky(); drawGround(); drawRegionTint(); if (!TRAILER) drawAtmoBack();
  if (!TRAILER) {   /* 배경 누르기: 진한 배경에 캐릭터가 묻히지 않게, 배경만 살짝 어둡게 · 땅 쪽은 더(캐릭터가 서는 곳) */
    ctx.fillStyle = 'rgba(10,4,22,.30)'; ctx.fillRect(VIS.x0, VIS.y0, VIS.x1 - VIS.x0, VIS.y1 - VIS.y0);
    const gg = ctx.createLinearGradient(0, GROUND - 40, 0, 720); gg.addColorStop(0, 'rgba(8,2,18,0)'); gg.addColorStop(1, 'rgba(8,2,18,.45)'); ctx.fillStyle = gg; ctx.fillRect(VIS.x0, GROUND - 40, VIS.x1 - VIS.x0, VIS.y1 - GROUND + 40);
  }
  drawHorde(); drawAlly(); drawGiant(); drawBanners();
  // 깊이 순서로 군단·적
  const list = [];
  for (const a of S.army) list.push(['a', a.y, a]);
  for (const f of S.foes) list.push(['f', f.y, f]);
  for (const c of (S.corpses || [])) list.push(['c', c.y - 1, c]);
  for (const c of (S.fallen || [])) list.push(['d', c.y - 2, c]);   /* A판 03:23: 쓰러지는 적(뒤로 넘어지며 밀려나고 사라짐) */
  for (const h of HF.list) list.push(['h', h.y + 400, h]);   /* 00:35 영웅(모르데 y540)이 병사 뒤에 그려져 묻힘 → 영웅은 늘 병사 · 적 위에 */
  list.sort((p, q) => p[1] - q[1]);
  for (const [k, , o] of list) k === 'a' ? drawSkel(o) : k === 'h' ? HF.draw(o) : k === 'c' ? drawCorpse(o) : k === 'd' ? drawFallen(o) : drawFoe(o);
  if (typeof TH !== 'undefined') TH.draw();   /* 11-16 망자 거인은 군단 · 적 위에(앞으로 솟아 내려찍음) */
  for (const f of S.foes) HF.drawFoeBar(f);   /* 적 체력 막대는 맨 위에 */
  HF.drawArmyBars();
  drawArmyFx(); HF.drawFx(); LM.draw();
  const litLord = S.phase === 'cast' || S.phase === 'stare';   /* 11-14 18:10 대마법 영창 때 화면이 어두워져도 지배자는 밝게(어둠 위에 그림) — 「5초 동안 어둡고 글자만」 고침 */
  if (litLord && S.dark > 0) { ctx.fillStyle = `rgba(4,0,12,${S.dark})`; ctx.fillRect(VIS.x0, VIS.y0, VIS.x1 - VIS.x0, VIS.y1 - VIS.y0); }
  drawLord(); drawStaff(); drawLordTag(); if (!TRAILER) drawAtmoFront();
  if (!litLord && S.dark > 0) { ctx.fillStyle = `rgba(4,0,12,${S.dark})`; ctx.fillRect(VIS.x0, VIS.y0, VIS.x1 - VIS.x0, VIS.y1 - VIS.y0); }
  if (S.tint > 0) { ctx.fillStyle = `rgba(20,0,45,${0.45 * S.tint})`; ctx.fillRect(VIS.x0, VIS.y0, VIS.x1 - VIS.x0, VIS.y1 - VIS.y0); }
  drawShock(); drawRings(); if (!S.rings.length) drawFxSun(); drawSlams(); drawElite(); drawSlashes(); drawSun(); drawParts(); drawRises(); drawWave(); HF.drawTags(); drawBossBar(); drawWorldTexts();   /* 11-15 이름표 · 보스 막대는 효과(바닥 고리 · 충격 · 파편)와 지배자 몸 위에 — 눈 확인: 분홍 고리 · 지배자 몸이 이름표를 덮었음 */ drawBubble(); if (typeof drawOverlay === 'function') drawOverlay();
  ctx.restore();
  // 화면에 붙는 것 (카메라 영향 없음)
  ctx.setTransform(s, 0, 0, s, (TRAILER && cv.height > cv.width * 1.2) ? cv.width / 2 - W / 2 * s : ox, oy);   // 세로 광고: 화면 글자는 늘 가운데
  drawVignette(); drawWarn(); drawScreenTexts(); drawHud();
  if (S.tint && S.tint.a > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(${S.tint.col},${(st.settings && st.settings.calm) ? Math.min(0.08, S.tint.a) : S.tint.a})`; fillAll(); ctx.restore(); S.tint.a *= 0.93; }   /* 화면 색 물듦(대마법 · 큰 베기) */
  if (S.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${(st.settings && st.settings.calm) ? Math.min(0.15, S.flash * 0.25) : S.flash})`; fillAll(); }

}
// 지역 색감: 배경 위에 색을 '색조' 섞기로 덮어 땅마다 분위기를 바꿈. 적·거인은 색상 돌리기
const REGION_TINT = [null, ['#ff2a3a', 0.45, 140], ['#808080', 0.75, 20, 'saturation'], ['#5ad0ff', 0.45, 190], ['#ffb000', 0.6, 60], ['#5aff7a', 0.4, 100], ['#00e0c0', 0.5, 160], ['#3a1aff', 0.35, 250]];   // [색, 세기, 적 색상 돌림, 섞는 방식]
const regionOf = s => Math.floor((Math.max(1, (TRAILER && window.__lockStage) || s) - 1) / 10) % 8;   // 광고 영상은 지역을 고정할 수 있음
// 지역 전용 배경 그림(드리미나, 11-13 04:57~): 있으면 그 그림, 없으면 기본 배경 + 색감
const REGION_BG = [null, 'blood', 'ash', 'ice', 'royal', 'poison', 'temple', 'abyss'];
function regionBg() { ensureRegion(st.stage); const k = REGION_BG[regionOf(st.stage)]; return k && ART['bg_' + k] ? ART['bg_' + k] : null; }
function drawRegionTint() {
  if (regionBg()) return;
  const t = REGION_TINT[regionOf(st.stage)]; if (!t) return;
  ctx.save(); ctx.globalCompositeOperation = t[3] || 'color'; ctx.globalAlpha = t[1]; ctx.fillStyle = t[0]; ctx.fillRect(VIS.x0, VIS.y0, VIS.x1 - VIS.x0, VIS.y1 - VIS.y0); ctx.restore();
}
function regionFilter() { const t = REGION_TINT[regionOf(st.stage)]; return t ? `hue-rotate(${t[2]}deg) saturate(1.2)` : 'none'; }
/* 11-14 대표님 「80판 맵이 단순 이미지?」: 지역마다 움직이는 층(뒤: 하늘 · 먼 입자 / 앞: 낮은 안개 · 가까운 입자) + 지역 안에서 판이 오를수록 하늘이 어둡고 붉게, x-10 주인 판은 하늘이 바뀜 */
const ATMO = [
  { p: 'firefly', fog: 'rgba(150,120,200,', n: 26 },   // 잊힌 묘지
  { p: 'blooddrip', fog: 'rgba(160,20,40,', n: 30 },   // 피의 늪
  { p: 'ember', fog: 'rgba(90,70,60,', n: 46 },   // 재의 평원
  { p: 'snow', fog: 'rgba(200,230,255,', n: 70 },   // 얼어붙은 성채
  { p: 'ash', fog: 'rgba(120,90,60,', n: 34 },   // 타락한 왕도
  { p: 'spore', fog: 'rgba(110,170,60,', n: 40 },   // 독안개 숲
  { p: 'bubble', fog: 'rgba(60,170,170,', n: 34 },   // 가라앉은 신전
  { p: 'spark', fog: 'rgba(120,50,220,', n: 34 },   // 심연의 문
];
const AP = Array.from({ length: 80 }, (_, i) => ({ x: Math.random(), y: Math.random(), z: Math.random(), ph: Math.random() * 7, s: 0.5 + Math.random() }));
function atmoDot(o, kind, x, y, z, a) {
  const r = (kind === 'snow' ? 3.2 : kind === 'bubble' ? 3.6 : kind === 'firefly' ? 3.4 : 2.6) * (0.7 + z * 1.6) * o.s;
  const col = { firefly: '200,255,170', blooddrip: '220,30,50', ember: '255,150,50', snow: '240,248,255', ash: '210,190,170', spore: '190,255,120', bubble: '170,255,240', spark: '200,140,255' }[kind];
  if (kind === 'blooddrip') { ctx.strokeStyle = `rgba(${col},${a})`; ctx.lineWidth = 1.5 + z; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 10 + z * 14); ctx.stroke(); return; }
  if (kind === 'bubble') { ctx.strokeStyle = `rgba(${col},${a})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, 7); ctx.stroke(); return; }
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
}
function atmoLayer(front) {
  const rg = regionOf(st.stage), A = ATMO[rg], v = VIS, wv = v.x1 - v.x0, hv = v.y1 - v.y0, t = S.t, fall = { snow: 1, blooddrip: 1, ash: 0.5, ember: -0.8, spore: -0.15, bubble: -0.6, firefly: -0.1, spark: -0.4 }[A.p], wind = { snow: -0.25, ash: -0.2, ember: -0.15 }[A.p] || 0;
  ctx.save(); ctx.globalCompositeOperation = A.p === 'blooddrip' || A.p === 'ash' ? 'source-over' : 'lighter';
  const n = Math.round(A.n * (front ? 0.35 : 0.65));
  for (let i = 0; i < n; i++) { const o = AP[(i + (front ? 40 : 0)) % 80], z = front ? 0.7 + o.z * 0.3 : o.z * 0.7, sp = (fall * (40 + z * 90)) * o.s;
    const x = v.x0 + ((o.x * wv + t * (wind * 60 + Math.sin(t * 0.5 + o.ph) * 8) * (0.5 + z)) % wv + wv) % wv, y = v.y0 + ((o.y * hv + t * sp) % hv + hv) % hv;
    let a = (front ? 0.9 : 0.6) * (0.55 + 0.45 * Math.sin(t * (A.p === 'firefly' ? 2.2 : 1) + o.ph));
    if (A.p === 'firefly' || A.p === 'spore') a *= y > GROUND - 220 ? 1 : 0.3;
    atmoDot(o, A.p, x, y + (A.p === 'firefly' ? Math.sin(t + o.ph) * 14 : 0), z, a); }
  ctx.restore();
}
function drawAtmoBack() {
  if (!st) return; const rg = regionOf(st.stage), A = ATMO[rg], v = VIS, sub = (Math.max(1, st.stage) - 1) % 10, lord = sub === 9 && st.boss;
  /* 판이 오를수록 하늘이 어둡고 붉게(x-1 → x-9), 주인 판은 하늘 전체가 핏빛으로 맥박 */
  const dk = sub / 9; ctx.save(); ctx.fillStyle = `rgba(40,0,12,${0.04 + dk * 0.16})`; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, GROUND - v.y0 + 40);
  if (lord) { ctx.globalCompositeOperation = 'lighter'; const pu = 0.5 + 0.5 * Math.sin(S.t * 1.6); const g = ctx.createLinearGradient(0, v.y0, 0, GROUND); g.addColorStop(0, `rgba(140,10,20,${0.25 + pu * 0.12})`); g.addColorStop(1, 'rgba(60,0,10,0)'); ctx.fillStyle = g; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, GROUND - v.y0); }
  ctx.restore();
  if (A.p === 'spark' && Math.sin(S.t * 0.7) > 0.985) { ctx.save(); ctx.fillStyle = 'rgba(190,140,255,.18)'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); ctx.restore(); }   /* 심연: 가끔 보라 번개 번쩍 */
  if (lord && Math.sin(S.t * 0.9) > 0.99) { ctx.save(); ctx.fillStyle = 'rgba(255,220,220,.16)'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); ctx.restore(); }
  /* 먼 안개 띠 두 겹이 서로 다른 속도로 흐름 */
  ctx.save(); for (let j = 0; j < 2; j++) { const yy = GROUND - 60 + j * 40, sh = (S.t * (12 + j * 9)) % 600; for (let x = v.x0 - 600 + sh; x < v.x1 + 300; x += 300) { const g = ctx.createRadialGradient(x, yy, 10, x, yy, 220); g.addColorStop(0, A.fog + (0.16 - j * 0.04) + ')'); g.addColorStop(1, A.fog + '0)'); ctx.fillStyle = g; ctx.fillRect(x - 220, yy - 90, 440, 180); } } ctx.restore();
  atmoLayer(false);
}
function drawAtmoFront() {
  if (!st) return; const A = ATMO[regionOf(st.stage)], v = VIS;
  ctx.save(); const sh = (S.t * 26) % 520; for (let x = v.x0 - 520 + sh; x < v.x1 + 260; x += 260) { const yy = Math.min(v.y1, 720) - 10, g = ctx.createRadialGradient(x, yy, 10, x, yy, 200); g.addColorStop(0, A.fog + '0.13)'); g.addColorStop(1, A.fog + '0)'); ctx.fillStyle = g; ctx.fillRect(x - 200, yy - 70, 400, 140); } ctx.restore();   /* 발밑 낮은 안개 */
  atmoLayer(true);
}
function drawSky() {
  if (ART.bg) {   // 배경 그림: 지평선(그림 높이의 61%)을 땅 높이에 맞추고 보이는 범위를 다 덮음
    const im = regionBg() || ART.bg, asp = im.width / im.height, hz = GROUND + 20, v = VIS;
    const HZ = 0.65;   /* 02:30 새 그림체 배경은 땅이 그림 65%부터 */ const h = Math.max((hz - v.y0) / HZ, (v.y1 - hz) / (1 - HZ), (v.x1 - v.x0) / asp, H + 60) * 1.02, w = h * asp;
    const br = 1 + 0.012 * Math.sin(S.t * 0.25), pan = Math.sin(S.t * 0.04) * w * 0.012, act2 = st && st.stage > 80; if (act2) ctx.filter = 'brightness(.5) saturate(1.5) hue-rotate(-18deg) contrast(1.15)';   /* 11-14 배경이 아주 천천히 숨 쉬고 흐름 · 2막은 어둡고 붉게 */
    ctx.drawImage(im, (v.x0 + v.x1) / 2 - w * br / 2 + pan, hz - HZ * h * br, w * br, h * br); ctx.filter = 'none'; return;
  }
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, '#07030f'); g.addColorStop(0.55, '#1a0b2e'); g.addColorStop(1, '#3a1638');
  ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, GROUND + 300);
  for (const [x, y, r, p] of STARS) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(S.t * 2 + p); ctx.fillStyle = '#e8e0ff'; ctx.fillRect(x, y, r, r); }
  ctx.globalAlpha = 1;
  // 달
  const mx = 930, my = 110; const mg = ctx.createRadialGradient(mx, my, 10, mx, my, 160); mg.addColorStop(0, 'rgba(255,230,240,.35)'); mg.addColorStop(1, 'rgba(255,230,240,0)');
  ctx.fillStyle = mg; ctx.fillRect(mx - 160, my - 160, 320, 320);
  ctx.fillStyle = '#f2e3ea'; ctx.beginPath(); ctx.arc(mx, my, 52, 0, 7); ctx.fill();
  ctx.fillStyle = '#1a0b2e'; ctx.beginPath(); ctx.arc(mx + 22, my - 12, 46, 0, 7); ctx.fill();
  // 먼 성 그림자
  ctx.fillStyle = '#120818';
  ctx.beginPath(); ctx.moveTo(-300, GROUND);
  const sil = [[-300, 360], [80, 380], [120, 300], [140, 300], [150, 250], [170, 300], [210, 330], [520, 390], [700, 370], [760, 330], [780, 330], [790, 290], [805, 330], [880, 360], [1300, 380], [1600, 360]];
  for (const [x, y] of sil) ctx.lineTo(x, y); ctx.lineTo(1600, GROUND); ctx.fill();
  // 안개
  for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(120,60,140,${0.06 + i * 0.03})`; ctx.beginPath(); ctx.ellipse(((S.t * (8 + i * 6)) % 1800) - 300 + i * 400, GROUND - 10 + i * 8, 500, 40, 0, 0, 7); ctx.fill(); }
}
function drawGround() {
  if (ART.bg) { const g = ctx.createLinearGradient(0, GROUND, 0, H); g.addColorStop(0, 'rgba(10,4,16,0)'); g.addColorStop(1, 'rgba(10,4,16,.25)'); ctx.fillStyle = g; ctx.fillRect(-300, GROUND, W + 600, H - GROUND + 300); }
  else {  const g = ctx.createLinearGradient(0, GROUND, 0, H);
  g.addColorStop(0, '#24142b'); g.addColorStop(1, '#0c0710');
  ctx.fillStyle = g; ctx.fillRect(-300, GROUND, W + 600, H - GROUND + 300);
  ctx.strokeStyle = 'rgba(160,100,180,.12)'; ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(-300, GROUND + i * i * 4 + 6); ctx.lineTo(W + 300, GROUND + i * i * 4 + 6); ctx.stroke(); }
  }
  // 소환진(지배자 뒤에서 군단이 솟아남)
  if (S.phase === 'march' || S.phase === 'giant') {
    ctx.save(); ctx.translate(190, 610); ctx.scale(1, 0.32); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(93,255,143,.55)'; ctx.lineWidth = 4; ctx.shadowColor = '#5dff8f'; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(0, 0, 120, 0, 7); ctx.stroke(); ctx.rotate(S.t); ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx.lineTo(Math.cos(a) * 110, Math.sin(a) * 110); } ctx.closePath(); ctx.stroke();
    ctx.restore();
  }
}
// 병과 등급 겉모습(설계 핵심 "등급이 오르면 군단이 화려해진다"): 등급 묶음마다 금속 빛을 입힌 그림을 한 번 만들어 둠
// 0~1 기본 · 2~3 청동 · 4~5 은 · 6 금 · 7 금 + 보라 불꽃
const TIER_OF = g => g >= 7 ? 4 : g >= 6 ? 3 : g >= 4 ? 2 : g >= 2 ? 1 : 0;
const TIER_COL = [null, ['#c07a3a', 0.38], ['#dfe8ff', 0.42], ['#ffd040', 0.5], ['#ffd040', 0.5]];
const TINTED = {};
const RISE_TINT = [null, ['#3dff8a', 0.22]];   /* 21:51 초록이 너무 튀어서 0.42 → 0.22 */
const EVO_TINT = [null, ['#5dff8f', 0.32], ['#6ab8ff', 0.4], ['#c58bff', 0.46], ['#ffd040', 0.52]];   /* 진화 단계 색: 초록 · 파랑 · 보라 · 금 — 발밑 빛과 같은 색(16:40 화면 보고: 전부 금색이라 단계 구분이 안 됐음) */
function tinted(img, key, tier, cols) {
  if (!tier || !img) return img; cols = cols || TIER_COL; const k = key + '_' + tier + (cols === EVO_TINT ? 'e' : ''); if (TINTED[k]) return TINTED[k];
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d');
  g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = cols[tier][1]; g.fillStyle = cols[tier][0]; g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.12 * tier; g.drawImage(img, 0, 0);   // 높은 등급일수록 반짝
  return (TINTED[k] = c);
}
/* 쫄따구 공격: 화살(가는 빛줄기) · 주술 구슬(보라) · 앞줄 칼빛(작은 초승달) */
function drawArmyFx() {
  for (const b of S.fshots || []) { const k = Math.min(1, b.age / b.life), x = lerp(b.x, b.tx, k), y = lerp(b.y, b.ty, k) - Math.sin(k * Math.PI) * 50; ctx.strokeStyle = '#ffb3a0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14, y - 3); ctx.stroke(); }   /* 적 궁수 화살 */
  if (!S.ashots && !S.aslash) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const b of S.ashots || []) {
    if (b.age < 0) continue;   /* 던지기: 팔을 휘두른 뒤에 날아감 */
    const k = clamp(b.age / b.life, 0, 1), arc = b.curse ? 30 : b.bone ? 110 : 50, x = lerp(b.x, b.tx, k), y = lerp(b.y, b.ty, k) - Math.sin(k * Math.PI) * arc;
    if (b.wave !== undefined) {   /* 10:15 먼 적 공격(직업마다): 칼 금빛 초승달 검기 · 창 하늘빛 창 · 방패 땅 충격파 */
      const yy = lerp(b.y, b.ty, k), xx = x; ctx.globalAlpha = 1;
      if (b.wave === 1) { ctx.strokeStyle = 'rgba(120,220,255,.5)'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xx - 90, yy + 6); ctx.lineTo(xx, yy); ctx.stroke(); ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(xx - 70, yy + 5); ctx.lineTo(xx + 12, yy); ctx.stroke(); ctx.fillStyle = '#9fe9ff'; ctx.beginPath(); ctx.moveTo(xx + 26, yy - 1); ctx.lineTo(xx + 6, yy - 9); ctx.lineTo(xx + 6, yy + 8); ctx.fill(); }
      else if (b.wave === 2) { for (const [rr, al] of [[1, 0.9], [0.7, 0.5]]) { ctx.strokeStyle = `rgba(255,160,70,${al})`; ctx.lineWidth = 9 * rr; ctx.beginPath(); ctx.ellipse(xx, yy, 34 * rr + k * 20, 12 * rr, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); } for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(255,200,120,.8)'; ctx.fillRect(xx - 30 - i * 22, yy - 4 - ((i * 7 + b.age * 90) % 18), 5, 5); } }
      else { ctx.save(); ctx.translate(xx, yy); if (b.big) ctx.scale(1.8, 2.2); for (const [lw, c] of [[16, 'rgba(255,214,110,.45)'], [6, '#fff4cf']]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(-18, 0, 38, -1.2, 1.2); ctx.stroke(); } ctx.restore(); }
      continue; }
    if (b.bone) { const q = Math.min(1.6, WK() * 0.6 + 0.4), r = b.age * 16 + b.sp; for (let i = 3; i >= 1; i--) { const kk = Math.max(0, k - i * 0.06), xx = lerp(b.x, b.tx, kk), yy = lerp(b.y, b.ty, kk) - Math.sin(kk * Math.PI) * arc; ctx.globalAlpha = 0.25 * (4 - i) / 3; ctx.fillStyle = '#9b6bff'; ctx.beginPath(); ctx.arc(xx, yy, 6 * q, 0, 7); ctx.fill(); }   /* 뼈 창: 빙글빙글 + 보라 꼬리 */
      ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.translate(x, y); ctx.rotate(r); ctx.strokeStyle = '#efe6d2'; ctx.lineWidth = 3.5 * q; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-14 * q, 0); ctx.lineTo(14 * q, 0); ctx.stroke(); ctx.fillStyle = '#efe6d2'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * 15 * q, -2.5 * q, 3 * q, 0, 7); ctx.arc(sx * 15 * q, 2.5 * q, 3 * q, 0, 7); ctx.fill(); } ctx.restore(); continue; }
    if (b.curse) { ctx.globalAlpha = 0.5; ctx.fillStyle = '#a46bff'; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = '#f0dcff'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill(); }
    else { const k2 = Math.max(0, k - 0.1), x2 = lerp(b.x, b.tx, k2), y2 = lerp(b.y, b.ty, k2) - Math.sin(k2 * Math.PI) * arc, an = Math.atan2(y - y2, x - x2); ctx.globalAlpha = 0.95; ctx.strokeStyle = '#fff2c8'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x, y); ctx.stroke();   /* 화살: 몸통 + 화살촉 */
      ctx.beginPath(); ctx.moveTo(x + Math.cos(an) * 7, y + Math.sin(an) * 7); ctx.lineTo(x + Math.cos(an + 2.5) * 6, y + Math.sin(an + 2.5) * 6); ctx.lineTo(x + Math.cos(an - 2.5) * 6, y + Math.sin(an - 2.5) * 6); ctx.fill(); }
  }
  for (const f of S.aslash || []) { const k = f.age / f.life;
    if (f.ring) { ctx.save(); ctx.globalAlpha = 1 - k; ctx.globalCompositeOperation = 'lighter'; for (const [rr, lw] of [[1, 14], [0.8, 6]]) { ctx.strokeStyle = `rgba(255,170,80,${(1 - k) * (lw > 10 ? 0.5 : 1)})`; ctx.lineWidth = lw * (1 - k * 0.5); ctx.beginPath(); ctx.ellipse(f.x, f.y - 6, (60 + 340 * k) * rr, (18 + 90 * k) * rr, 0, 0, 7); ctx.stroke(); } ctx.restore(); continue; }   /* 방패 「도발」 충격파 */
    if (!f.star) { ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#f3ead2'; ctx.lineWidth = 5 * (1 - k) + 1; ctx.beginPath(); ctx.arc(f.x, f.y, 28, -1.3, 1.1); ctx.stroke(); continue; }
    /* 09:40 타격 순간: 맞는 적 몸에 하얀 십자 번쩍(커졌다 사라짐) + 비스듬한 베기 줄 — 예전엔 내 칼 옆 허공에 작은 호 */
    /* 09:48 대표님 「누구 타격인지 모르겠다 · 차별성」: 직업마다 맞는 모양 · 색이 다름 — 칼 = 금빛 사선 베기, 창 = 하늘빛 가로 찌르기 줄(창끝에서 적까지), 방패 = 주황 둥근 충격파 + 크게 밀림 */
    const CC = { '-1': '255,226,150', 1: '120,220,255', 2: '255,160,70' }[f.c] || '255,236,170', R = (f.c === 2 ? 44 : 34) + 40 * Math.min(1, k * 3), al = k < 0.3 ? 1 : 1 - (k - 0.3) / 0.7; ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter';
    if (f.c === 1) { ctx.strokeStyle = `rgba(${CC},${al})`; ctx.lineCap = 'round'; for (const [lw, a2] of [[22, 0.35], [8, 1]]) { ctx.lineWidth = lw * (1 - k * 0.6); ctx.globalAlpha = a2; ctx.beginPath(); ctx.moveTo(f.ax, f.y + 6); ctx.lineTo(f.x + 30, f.y); ctx.stroke(); } ctx.globalAlpha = 1; }
    ctx.translate(f.x, f.y);
    if (f.c === 2) { ctx.strokeStyle = `rgba(${CC},${al})`; ctx.lineWidth = 10 * (1 - k) + 2; ctx.beginPath(); ctx.ellipse(0, 10, R * 1.3, R * 0.9, 0, 0, 7); ctx.stroke(); }
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, R); g.addColorStop(0, `rgba(255,255,255,${al})`); g.addColorStop(0.3, `rgba(${CC},${al * 0.75})`); g.addColorStop(1, `rgba(${CC},0)`); ctx.fillStyle = g; ctx.fillRect(-R, -R, R * 2, R * 2);
    ctx.fillStyle = `rgba(255,255,255,${al})`; for (const r of [0.35, 0.35 + Math.PI / 2]) { ctx.save(); ctx.rotate(r); ctx.beginPath(); ctx.moveTo(-R * 1.5, 0); ctx.lineTo(0, -5); ctx.lineTo(R * 1.5, 0); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill(); ctx.restore(); }
    if (f.c !== 1 && f.c !== 2) { ctx.strokeStyle = `rgba(${CC},${al})`; ctx.lineWidth = 11 * (1 - k) + 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-50, -46); ctx.lineTo(44, 38); ctx.stroke(); } ctx.restore(); }
  ctx.restore(); ctx.globalAlpha = 1;
}
/* 다리 나눠 걷기: 그림 한 장을 무릎 줄(hy) 아래에서 뒷다리 · 앞다리로 갈라 번갈아 흔듦. [무릎 줄, 가르는 곳, (가운데 그대로 둘 띠 끝 — 창 자루)] 그림 쪽 비율 */
const EVO_H = [0, 84, 122, 108, 114];   // 진화 그림 키: 구울(웅크림) · 뼈 골렘(가장 큼) · 망령 기사 · 리치
const LEGS = { foe: [0.78, 0.5], cls0: [0.78, 0.53], cls1: [0.77, 0.38, 0.53], cls2: [0.77, 0.48], cls3: [0.79, 0.47], skel: [0.79, 0.57] };
function drawWalk(img, key, w, h, ph, amp, lean = 0) {
  const G = LEGS[key]; if (!G || (amp < 0.03 && !lean)) { ctx.drawImage(img, -w / 2, -h, w, h); return; }
  const iw = img.width, ih = img.height, hy = G[0], s0 = G[1], s1 = G[2] ?? G[1], th = Math.sin(ph) * 0.34 * amp, ly = -h + h * hy, lh = h * (1 - hy);
  const part = (u0, u1, piv, ang) => { ctx.save(); ctx.translate(-w / 2 + w * piv, ly); ctx.rotate(ang); ctx.drawImage(img, iw * u0, ih * hy, iw * (u1 - u0), ih * (1 - hy), w * (u0 - piv), 0, w * (u1 - u0), lh); ctx.restore(); };
  part(0, s0, Math.max(0.1, s0 - 0.14), th); part(s1, 1, Math.min(0.9, s1 + 0.14), -th);
  if (s1 > s0) ctx.drawImage(img, iw * s0, ih * hy, iw * (s1 - s0), ih * (1 - hy), -w / 2 + w * s0, ly, w * (s1 - s0), lh);
  ctx.save(); if (lean) { const py = ly; ctx.translate(0, py); ctx.rotate(lean); ctx.translate(0, -py); }   // 휘두르기: 무릎을 축으로 윗몸만 앞으로(정강이는 땅에)
  ctx.drawImage(img, 0, 0, iw, Math.min(ih, ih * hy + 3), -w / 2, -h, w, Math.min(h, h * hy + 3 * h / ih)); ctx.restore();   // 윗몸은 마지막에(무릎 이음매를 덮음)
}
/* 11-14 그림 방식 3가지 비교(대표님 「1 2 3 동시에 해서 보여줘」): ?style=2d | 3d | old (기본 3d)
   2d = 2D 그림 그대로 + 부위 움직임(허리 위 윗몸만 돌고 숨 쉬고, 다리는 땅에 붙음) */
const STYLE0 = (() => { try { return new URLSearchParams(location.search).get('style') || 'old'; } catch (e) { return 'old'; } })(), STYLE = STYLE0 === 'hq' ? '2d' : STYLE0;   /* 기본 2D(16:15). ④ hq는 2D 장치를 그대로 쓰고 그림만 d4_ */
/* 11-14 16:25 진짜 부위 움직임(대표님 「부위별 움직임은 당연히 있어야」): 그림 한 장을 다리 · 윗몸 · 머리 · 무기 넷으로 잘라
   허리를 축으로 윗몸, 목을 축으로 머리, 손을 축으로 무기가 따로 움직임. 좌표는 그림 크기에 대한 비율(0~1), 그림은 모두 왼쪽을 봄 */
const RIG = {
  lord: { w: [[0, .07], [.25, .07], [.25, .55], [.30, .60], [.30, .70], [.28, .99], [.17, .99], [.10, .70], [0, .55]], wp: [.18, .63], hd: [[.28, 0], [.92, 0], [.92, .46], [.28, .46]], nk: [.55, .46], ws: .62 },
  skel: { w: [[0, .40], [.13, .40], [.33, .66], [.33, .80], [.19, .80], [0, .56]], wp: [.25, .72], hd: [[.2, 0], [.95, 0], [.95, .46], [.2, .46]], nk: [.55, .46], ws: .68 },
  knight: { w: [[0, .78], [.18, .66], [.30, .70], [.30, .84], [.08, .97], [0, .97]], wp: [.22, .78], hd: [[.18, 0], [1, 0], [1, .33], [.86, .42], [.84, .53], [.16, .53]], nk: [.5, .53], ws: .72 },
  giant: { w: [[0, .69], [.18, .64], [.30, .70], [.18, 1], [0, 1]], wp: [.24, .71], hd: [[.3, 0], [.72, 0], [.68, .30], [.34, .30]], nk: [.5, .30], ws: .60 },
  archer: { w: [[0, .38], [.12, .38], [.36, .58], [.36, .68], [.2, .98], [0, .98]], wp: [.30, .63], hd: [[.28, 0], [.72, 0], [.72, .36], [.28, .36]], nk: [.5, .35], ws: .62, bow: 1 },
  shield: { w: [[0, .68], [.15, .62], [.30, .66], [.30, .76], [.14, .96], [0, .96]], wp: [.27, .70], hd: [[.25, 0], [.72, 0], [.62, .25], [.60, .38], [.25, .38]], nk: [.45, .37], ws: .65 },
  priest: { w: [[0, 0], [.32, 0], [.30, .55], [.38, .60], [.36, .70], [.36, .90], [.26, .90], [.2, .6], [0, .35]], wp: [.30, .55], hd: [[.38, .05], [.9, .05], [.9, .42], [.38, .42]], nk: [.55, .42], ws: .60, staff: 1 },
  captain: { w: [[0, .75], [.25, .62], [.33, .68], [.30, .76], [.05, .9], [0, .9]], wp: [.28, .69], hd: [[.3, 0], [.75, 0], [.7, .18], [.62, .35], [.3, .35]], nk: [.47, .34], ws: .62 },
};
RIG.lord.staff = 1;
const RIG4 = {   /* ④ 고급 실사풍(모두 왼쪽 보게 뒤집어 저장) */
  lord: { w: [[.76, 0], [1, 0], [1, .30], [.88, .42], [.80, .97], [.70, .97], [.73, .42], [.74, .30]], wp: [.82, .37], hd: [[.38, 0], [.62, 0], [.62, .24], [.38, .24]], nk: [.5, .23], ws: .55, staff: 1 },
  skel: { w: [[.78, 0], [1, 0], [1, .48], [.78, .48], [.74, .36]], wp: [.82, .38], hd: [[.38, .03], [.66, .03], [.66, .24], [.38, .24]], nk: [.52, .23], ws: .55, swing: [.35, -1.5] },
  knight: { w: [[0, .05], [.12, .05], [.27, .38], [.28, .50], [.18, .57], [0, .40]], wp: [.22, .43], hd: [[.38, 0], [.8, 0], [.8, .22], [.66, .25], [.40, .25]], nk: [.55, .24], ws: .55 },
};
function rigParts(img, R) {
  if (img.__rp) return img.__rp; const W = img.width, H = img.height, mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const path = (g, poly) => { g.beginPath(); poly.forEach(([x, y], i) => i ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H)); g.closePath(); };
  const cut = poly => { const c = mk(), g = c.getContext('2d'); path(g, poly); g.clip(); g.drawImage(img, 0, 0); return c; };
  const wpn = cut(R.w), head = cut(R.hd), body = mk(), g = body.getContext('2d'); g.drawImage(img, 0, 0); g.globalCompositeOperation = 'destination-out'; path(g, R.w); g.fill(); path(g, R.hd); g.fill();
  return (img.__rp = { wpn, head, body, W, H });
}
function rigOf(img) { const m = /d([24])_(\w+)\./.exec(img && img.src || ''); return m && (m[1] === '4' ? RIG4 : RIG)[m[2]]; }
function rigDraw(img, R, h, o) {
  const P = rigParts(img, R), W = P.W, H = P.H, w = h * W / H, X = x => (x - 0.5) * w, Y = y => (y - 1) * h, k = o.k || 0, t = S.t + (o.ph || 0);
  let lean = 0, up = 1, all = 0, lift = 0, hA = 0, wA = 0, sx = 1;
  const st2 = o.st;
  if (st2 === 'idle') { up = 1 + 0.02 * Math.sin(t * 2.4); lean = 0.025 * Math.sin(t * 1.2); hA = 0.04 * Math.sin(t * 1.7 + 1); wA = 0.05 * Math.sin(t * 1.9); }
  else if (st2 === 'walk') { const s2 = Math.sin(o.wph || t * 8); lift = -Math.abs(s2) * h * 0.04; lean = 0.06 + s2 * 0.03; hA = s2 * 0.05; wA = s2 * 0.14; }
  else if (st2 === 'attack') {
    if (R.staff || R.bow) { const a = Math.sin(Math.min(1, k) * Math.PI); lean = 0.12 * a; wA = -0.55 * a; hA = 0.08 * a; }   /* 지팡이 · 활: 앞으로 내지름 */
    else { const [u1, d1] = R.swing || [1.0, -0.85]; wA = k < 0.3 ? u1 * k / 0.3 : k < 0.48 ? u1 + (d1 - u1) * (k - 0.3) / 0.18 : d1 * (1 - (k - 0.48) / 0.52); lean = k < 0.3 ? -0.12 * k / 0.3 : k < 0.48 ? -0.12 + 0.36 * (k - 0.3) / 0.18 : 0.24 * (1 - (k - 0.48) / 0.52); hA = lean * 0.6; sx = 1 + Math.max(0, lean) * 0.15; }   /* 칼: 뒤로 크게 치켜들었다 → 앞으로 내리침 → 돌아옴 */
  }
  else if (st2 === 'hit') { const a = Math.sin(Math.min(1, k) * Math.PI); lean = -0.22 * a; all = -0.08 * a; hA = -0.25 * a; wA = 0.3 * a; }
  else if (st2 === 'cast') { const a = Math.min(1, k * 2); lean = -0.18 * a + 0.03 * Math.sin(t * 14) * a; up = 1 + 0.04 * a; lift = -a * h * 0.05; hA = -0.15 * a; wA = (R.staff ? -0.45 : 0.6) * a + 0.05 * Math.sin(t * 10) * a; }
  else if (st2 === 'die') { all = Math.min(1, k * 1.6) * 1.45; hA = Math.min(1, k * 2) * 0.4; wA = Math.min(1, k * 2) * -0.8; }
  ctx.save(); if (o.flip) ctx.scale(-1, 1); ctx.translate(0, lift); ctx.rotate(-all);
  const wy = Y(R.ws), wx = 0;
  ctx.drawImage(P.body, 0, R.ws * H - 1, W, H - R.ws * H + 1, -w / 2, wy - 1, w, h - R.ws * h + 1);   /* 다리 */
  ctx.save(); ctx.translate(wx, wy); ctx.rotate(-lean); ctx.scale(sx, up); ctx.translate(-wx, -wy);
  ctx.drawImage(P.body, 0, 0, W, R.ws * H, -w / 2, -h, w, R.ws * h);   /* 윗몸 */
  ctx.save(); ctx.translate(X(R.nk[0]), Y(R.nk[1])); ctx.rotate(-hA); ctx.translate(-X(R.nk[0]), -Y(R.nk[1])); ctx.drawImage(P.head, -w / 2, -h, w, h); ctx.restore();   /* 머리 */
  ctx.save(); ctx.translate(X(R.wp[0]), Y(R.wp[1])); ctx.rotate(wA); ctx.translate(-X(R.wp[0]), -Y(R.wp[1])); ctx.drawImage(P.wpn, -w / 2, -h, w, h);   /* 무기 */
  if (o.slash && st2 === 'attack' && k > 0.3 && k < 0.6 && !R.staff && !R.bow) { const p = (k - 0.3) / 0.3; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.sin(p * Math.PI); ctx.strokeStyle = o.slash; ctx.shadowColor = o.slash; ctx.shadowBlur = 14; ctx.lineCap = 'round'; ctx.lineWidth = h * 0.05; ctx.beginPath(); ctx.arc(X(R.wp[0]), Y(R.wp[1]), h * 0.42, Math.PI * (0.75 + 0.1 * p), Math.PI * (1.25 + 0.25 * p)); ctx.stroke(); }
  ctx.restore();
  ctx.restore(); ctx.restore();
}
function puppet(img, h, o) {
  { const R = rigOf(img); if (R) return rigDraw(img, R, h, o); }   /* o: { flip, cut(허리 0~1), st('idle'|'walk'|'attack'|'hit'|'cast'|'die'), k(0~1 진행), ph, wph } */
  const w = h * img.width / img.height, cut = o.cut || 0.58, cy = img.height * cut, k = o.k || 0, t = S.t + (o.ph || 0);
  let lean = 0, up = 1, ux = 0, uy = 0, all = 0, sq = 1, lift = 0;
  if (o.st === 'idle') { up = 1 + 0.025 * Math.sin(t * 2.4); lean = 0.03 * Math.sin(t * 1.2); }
  else if (o.st === 'walk') { const s2 = Math.sin(o.wph || t * 8); lift = -Math.abs(s2) * h * 0.045; lean = 0.07 + s2 * 0.05; sq = 1 - Math.abs(s2) * 0.04; }
  else if (o.st === 'attack') { const a = k < 0.3 ? -k / 0.3 * 0.35 : k < 0.55 ? -0.35 + (k - 0.3) / 0.25 * 0.95 : 0.6 * (1 - (k - 0.55) / 0.45); lean = a; ux = a * h * 0.12; sq = 1 + Math.max(0, a) * 0.05; }   /* 뒤로 젖혀 모았다가 → 앞으로 확 내리침 → 돌아옴 */
  else if (o.st === 'hit') { const a = Math.sin(Math.min(1, k) * Math.PI); lean = -0.3 * a; all = -0.12 * a; ux = -a * h * 0.08; sq = 1 - 0.06 * a; }
  else if (o.st === 'cast') { const a = Math.min(1, k * 2); lean = -0.22 * a + 0.04 * Math.sin(t * 14) * a; up = 1 + 0.06 * a; lift = -a * h * 0.06; }
  else if (o.st === 'die') { all = Math.min(1, k * 1.6) * 1.45; lift = 0; }
  ctx.save(); if (o.flip) ctx.scale(-1, 1); ctx.translate(0, lift); ctx.rotate(-all); ctx.scale(1 / Math.sqrt(sq), sq);
  const sh = h * (1 - cut);   /* 아래(다리)는 땅에 고정 */
  ctx.drawImage(img, 0, cy - 2, img.width, img.height - cy + 2, -w / 2, -sh - 2, w, sh + 2);
  ctx.save(); ctx.translate(ux * (o.flip ? -1 : 1) * 0 + ux, -sh + uy); ctx.rotate(-lean); ctx.scale(1, up);   /* 윗몸: 허리를 축으로 돌고 숨 쉼 */
  ctx.drawImage(img, 0, 0, img.width, cy, -w / 2, -h * cut, w, h * cut); ctx.restore();
  ctx.restore();
  if (o.st === 'attack' && o.slash && k > 0.28 && k < 0.75) {   /* 내리치는 순간 칼빛 초승달(앞쪽으로) */
    const p = (k - 0.28) / 0.47, dir = o.flip ? 1 : -1; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.sin(p * Math.PI);
    ctx.strokeStyle = o.slash; ctx.lineCap = 'round'; ctx.shadowColor = o.slash; ctx.shadowBlur = 12;
    for (const [lw, r] of [[9, 0.62], [4, 0.7]]) { ctx.lineWidth = lw; ctx.beginPath(); const a0 = -2.2 + p * 0.5, a1 = a0 + 0.4 + p * 1.5; ctx.ellipse(dir * w * 0.12, -h * 0.5, h * r * 0.7, h * r * 0.55, 0, dir > 0 ? a0 : Math.PI - a1, dir > 0 ? a1 : Math.PI - a0); ctx.stroke(); }
    ctx.restore(); }
}
/* 11-14 17:00 영상 장면 방식(대표님 「움직임이 완전 자연스러워야」): 그림 → 드리미나 영상 → 12장씩 잘라 대기 · 공격 줄그림.
   sv = 망자병(오른쪽 봄) · kv = 적 기사(왼쪽 봄) · gv = 거인(왼쪽 봄). 기준점(발)은 가공 도구가 잰 값 */
/* 11-14 17:30 버벅임 고침(대표님 「움직임 버벅임 고쳐야지」): 전엔 영상에서 12장만 잘라 0.34~0.4초에 한 장 + 앞뒤로 되감기 → 초당 3장.
   이제 원본 영상(초당 24장)에서 대기 40장 · 공격 16~20장을 잘라 앞으로만 돌고, 장과 장 사이를 섞어 그림(겹쳐 그리기 2번).
   빛 · 밝기 필터는 매 장 계산하지 않고 처음 한 번 구워 둠(휴대폰에서 끊기던 큰 원인). f = 그림 파일 앞이름, n = 동작별 장수 */
const VS = {
  /* 03:20 그림체 A 영상 동작(한 명만 움직이는 드리미나 영상, 몸 둘레만 자름 — vid/한놈영상.py ONLYOWN) */
  lordv: { f: 'lordv', cw: 185, ch: 553, ax: 57.6, ay: 438.6, hpx: 330, n: { attack: 22, idle: 15 } },
  sumv1: { f: 'sumv1', cw: 408, ch: 472, ax: 174.5, ay: 414.5, hpx: 237, n: { attack: 16, idle: 20 }, bb: [0.294, 0.814, 0.25, 0.752] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  sumv2: { f: 'sumv2', cw: 519, ch: 357, ax: 193.2, ay: 322.0, hpx: 234, n: { attack: 16, idle: 20 }, bb: [0.254, 0.557, 0.118, 0.773] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  sumv3: { f: 'sumv3', cw: 389, ch: 502, ax: 202.3, ay: 398.0, hpx: 285, n: { attack: 16, idle: 20 }, bb: [0.288, 0.799, 0.209, 0.777] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  sumv4: { f: 'sumv4', cw: 381, ch: 328, ax: 152.8, ay: 315.1, hpx: 249, n: { attack: 16, idle: 20 }, bb: [0.163, 0.659, 0.055, 0.814] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  /* 09:55 대표님 「걷기 · 입장 자연스럽게」: 드리미나 제자리 걷기 영상 4편(우리 그림 그대로) → 한 바퀴 16장(vid/걷기줄그림.py) */
  lordw: { f: 'lordw', cw: 281, ch: 363, ax: 150.0, ay: 339.1, hpx: 291, n: { attack: 16 }, bb: [0.093, 0.868, 0.124, 0.926] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroK_krag: { f: 'heroK_krag', cw: 374, ch: 499, ax: 174.2, ay: 412.1, hpx: 213, n: { atk: 16 }, hit: 6, bb: [0.275, 0.703, 0.317, 0.743] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroK_morde: { f: 'heroK_morde', cw: 344, ch: 426, ax: 126.1, ay: 381.7, hpx: 295, n: { atk: 16 }, hit: 6, bb: [0.186, 0.872, 0.2, 0.892] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroK_serafine: { f: 'heroK_serafine', cw: 425, ch: 467, ax: 197.4, ay: 431.4, hpx: 252, n: { atk: 16 }, hit: 6, bb: [0.214, 0.633, 0.291, 0.831] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroK_nox: { f: 'heroK_nox', cw: 339, ch: 393, ax: 157.7, ay: 365.9, hpx: 252, n: { atk: 16 }, hit: 6, bb: [0.18, 0.791, 0.176, 0.817] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroK_drummer: { f: 'heroK_drummer', cw: 308, ch: 410, ax: 146.3, ay: 366.4, hpx: 207, n: { atk: 16 }, hit: 6, bb: [0.302, 0.828, 0.261, 0.766] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroK_porter: { f: 'heroK_porter', cw: 373, ch: 409, ax: 183.5, ay: 397.5, hpx: 252, n: { atk: 16 }, hit: 6, bb: [0.118, 0.745, 0.244, 0.861] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroK_twins: { f: 'heroK_twins', cw: 448, ch: 502, ax: 221.6, ay: 401.6, hpx: 226, n: { atk: 16 }, hit: 6, bb: [0.243, 0.777, 0.267, 0.717] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroK_wisp: { f: 'heroK_wisp', cw: 267, ch: 345, ax: 88.5, ay: 330.8, hpx: 197, n: { atk: 16 }, hit: 6, bb: [0.172, 0.693, 0.197, 0.768] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroI_krag: { f: 'heroI_krag', cw: 374, ch: 499, ax: 174.2, ay: 412.1, hpx: 213, n: { idle: 20 }, bb: [0.275, 0.703, 0.317, 0.743] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroI_serafine: { f: 'heroI_serafine', cw: 425, ch: 467, ax: 197.4, ay: 431.4, hpx: 252, n: { idle: 20 }, bb: [0.214, 0.633, 0.291, 0.831] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroI_nox: { f: 'heroI_nox', cw: 339, ch: 393, ax: 157.7, ay: 365.9, hpx: 252, n: { idle: 20 }, bb: [0.18, 0.791, 0.176, 0.817] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroI_drummer: { f: 'heroI_drummer', cw: 308, ch: 410, ax: 146.3, ay: 366.4, hpx: 207, n: { idle: 20 }, bb: [0.302, 0.828, 0.261, 0.766] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroI_porter: { f: 'heroI_porter', cw: 373, ch: 409, ax: 183.5, ay: 397.5, hpx: 252, n: { idle: 20 }, bb: [0.118, 0.745, 0.244, 0.861] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroI_morde: { f: 'heroI_morde', cw: 344, ch: 426, ax: 126.1, ay: 381.7, hpx: 295, n: { idle: 20 }, bb: [0.186, 0.872, 0.2, 0.892] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroI_twins: { f: 'heroI_twins', cw: 448, ch: 502, ax: 221.6, ay: 401.6, hpx: 226, n: { idle: 20 }, bb: [0.243, 0.777, 0.267, 0.717] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroI_wisp: { f: 'heroI_wisp', cw: 267, ch: 345, ax: 88.5, ay: 330.8, hpx: 197, n: { idle: 20 }, bb: [0.172, 0.693, 0.197, 0.768] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  heroW_krag: { f: 'heroW_krag', cw: 327, ch: 328, ax: 138.4, ay: 326.0, hpx: 283, n: { walk: 16 }, bb: [0.055, 0.722, 0.034, 0.896] },   /* 11-16 순서 #10 새 그림체 걷기 */
  heroW_serafine: { f: 'heroW_serafine', cw: 459, ch: 385, ax: 219.3, ay: 382.2, hpx: 296, n: { walk: 16 }, bb: [0.155, 0.647, 0.034, 0.803] },   /* 11-16 순서 #10 새 그림체 걷기 */
  heroW_nox: { f: 'heroW_nox', cw: 364, ch: 363, ax: 192.3, ay: 360.3, hpx: 288, n: { walk: 16 }, bb: [0.104, 0.824, 0.025, 0.818] },   /* 11-16 순서 #10 새 그림체 걷기 */
  heroW_drummer: { f: 'heroW_drummer', cw: 368, ch: 393, ax: 176.3, ay: 389.3, hpx: 282, n: { walk: 16 }, bb: [0.239, 0.829, 0.081, 0.799] },   /* 11-16 순서 #10 새 그림체 걷기 */
  heroW_porter: { f: 'heroW_porter', cw: 270, ch: 322, ax: 163.2, ay: 320.1, hpx: 258, n: { walk: 16 }, bb: [0.019, 0.919, 0.025, 0.826] },   /* 11-16 순서 #10 새 그림체 걷기 */
  heroW_morde: { f: 'heroW_morde', cw: 305, ch: 317, ax: 99.2, ay: 315.1, hpx: 298, n: { walk: 16 }, bb: [0.115, 0.918, 0.032, 0.972] },   /* 11-16 순서 #10 새 그림체 걷기 */
  sumv1w: { f: 'sumv1', cw: 442, ch: 403, ax: 204.2, ay: 399.8, hpx: 297, n: { walk: 16 }, bb: [0.247, 0.882, 0.06, 0.797] },   /* 11-16 순서 #10 새 그림체 걷기 */
  sumv2w: { f: 'sumv2', cw: 450, ch: 368, ax: 169.0, ay: 363.8, hpx: 298, n: { walk: 16 }, bb: [0.196, 0.862, 0.065, 0.875] },   /* 11-16 순서 #10 새 그림체 걷기 */
  sumv3w: { f: 'sumv3', cw: 272, ch: 318, ax: 154.7, ay: 315.9, hpx: 290, n: { walk: 16 }, bb: [0.165, 0.956, 0.038, 0.95] },   /* 11-16 순서 #10 새 그림체 걷기 */
  sumv4w: { f: 'sumv4', cw: 375, ch: 366, ax: 162.0, ay: 362.3, hpx: 293, n: { walk: 16 }, bb: [0.123, 0.701, 0.044, 0.844] },   /* 11-16 순서 #10 새 그림체 걷기 */
  foev0: { f: 'foev0', cw: 255, ch: 321, ax: 137.5, ay: 312.8, hpx: 240, n: { attack: 16, idle: 20 }, bb: [0.275, 0.945, 0.14, 0.888] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  foev1: { f: 'foev1', cw: 428, ch: 325, ax: 240.8, ay: 312.3, hpx: 251, n: { attack: 16, idle: 20 }, bb: [0.432, 0.811, 0.055, 0.828] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  foev2: { f: 'foev2', cw: 310, ch: 361, ax: 177.1, ay: 351.3, hpx: 218, n: { attack: 16, idle: 20 }, bb: [0.174, 0.716, 0.235, 0.839] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  foev3: { f: 'foev3', cw: 258, ch: 344, ax: 146.0, ay: 316.1, hpx: 264, n: { attack: 16, idle: 20 }, bb: [0.248, 0.926, 0.096, 0.863] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  foev4: { f: 'foev4', cw: 350, ch: 467, ax: 187.6, ay: 386.1, hpx: 223, n: { attack: 16, idle: 20 }, bb: [0.071, 0.869, 0.257, 0.734] },   /* 11-16 순서 #10 새 그림체(시안 1번 참고 · 드리미나 영상) */
  sv: { f: 'sv2', cw: 182, ch: 237, ax: 84.1, ay: 235.9, hpx: 220, n: { idle: 40, attack: 20 } },
  kv: { f: 'kv2', cw: 174, ch: 230, ax: 90.7, ay: 228.5, hpx: 220, n: { idle: 40, attack: 20 } },
  sw: { f: 'sw2', cw: 167, ch: 221, ax: 77.5, ay: 220.8, hpx: 220, n: { walk: 24 } },   /* 21:25 드리미나 걷기 영상(1초 한 걸음 24장)에서 뽑음 */
  /* 22:35 대표님 「같은 병사만 잔뜩 · 역할 맞냐」: 병과마다 전용 영상(드리미나) — 창병 k1 · 방패병 k2 · 궁병 k3 · 주술사 k5 (서 있기 · 공격 · 걷기). 값은 영상 가공 뒤 채움 */
  k1: { f: 'k1', cw: 214, ch: 230, ax: 82.1, ay: 227.7, hpx: 205, n: { idle: 23, attack: 22, walk: 24 } },
  k2: { f: 'k2', cw: 179, ch: 231, ax: 96.6, ay: 230.3, hpx: 215, n: { idle: 28, attack: 20, walk: 28 } },   /* 방패병 걷기 영상은 몸을 돌려버려서 서 있기 장면 + 무거운 들썩임으로 */
  k3: { f: 'k3', cw: 177, ch: 232, ax: 78.3, ay: 230.2, hpx: 215, n: { idle: 19, attack: 26, walk: 24 } },
  k5: { f: 'k5', cw: 177, ch: 236, ax: 74.4, ay: 227.7, hpx: 215, n: { idle: 23, attack: 24, walk: 32 } },
  kw: { f: 'kw2', cw: 122, ch: 221, ax: 61.8, ay: 220.8, hpx: 210, n: { walk: 29 } },   /* 21:30 드리미나 기사 걷기(한 걸음 29장) — 대기 그림보다 몸이 조금 작게 나와 hpx를 낮춰 키움 */
  gv: { f: 'gv2', cw: 258, ch: 344, ax: 131.4, ay: 339.9, hpx: 330, n: { idle: 40, raise: 12, slam: 8, rec: 12 } },   /* 18:06 공격 영상 새로(카메라 고정): 치켜들기 12 · 내려찍기 8 · 다시 메기 12 */
  ld: { f: 'ld7', cw: 397, ch: 503, ax: 188.4, ay: 501.8, hpx: 420, n: { idle: 30 } },
  lc: { f: 'ld8', cw: 456, ch: 725, ax: 161.5, ay: 721.1, hpx: 420, n: { cast: 24 } },   /* 18:45 영창 영상 새로(지배자를 작게 두고 위에 여유 → 마법 구름이 위에서 안 잘림) */
};
const VS_COLS = 10;
const KC = { 1: 'k1', 2: 'k2', 3: 'k3', 5: 'k5' }, K_AT = { k1: 0.62, k2: 0.6, k3: 0.95, k5: 0.9 };   /* 병과 → 전용 영상 · 공격 동작 길이(초) */
const vsOk = n => STYLE === 'old' && !!VS[n] && Object.keys(VS[n].n).map(a => need(VS[n].f + '_' + a)).every(Boolean);   /* 한 번에 다 받기 시작(every는 첫 빈 것에서 멈춰 하나씩 늦게 받았음) */
const kk0 = f => f.hT > 0 ? 1 - f.hT / 0.4 : 0;
const BAKE = {};
function baked(key, img, filt) {   /* 필터 입힌 줄그림을 한 번만 만들어 둠(같은 필터면 다시 씀) */
  if (!filt || filt === 'none') return img;
  const k = key + '|' + filt; if (BAKE[k]) return BAKE[k];
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d');
  if (!('filter' in g)) return (BAKE[k] = img);   /* 필터를 못 쓰는 브라우저는 그림 그대로 */
  g.filter = filt; g.drawImage(img, 0, 0); return (BAKE[k] = c);
}
/* fi는 소수: 정수 쪽 장을 그리고 다음 장을 소수만큼 겹쳐 그려 부드럽게. loop = 마지막 장 다음이 첫 장(대기) */
/* 20:52 대표님 「군단 배치 있었지?」: 군단 탭 병과가 전장에선 다 같은 칼 망자병이라 안 보였음 → 병과마다 빛깔(방패병 은빛 · 조금 큼 앞줄, 궁병 초록 뒷줄, 주술사 분홍 보라 맨 뒷줄, 기병 구릿빛) */
const SV_TINT = { d: 'brightness(1.15) contrast(1.06) drop-shadow(0 0 2px rgba(190,120,255,.9))', 2: 'saturate(.5) brightness(1.32) contrast(1.1) drop-shadow(0 0 2px rgba(170,205,255,.95))', 3: 'hue-rotate(95deg) saturate(1.35) brightness(1.12) drop-shadow(0 0 2px rgba(120,255,190,.9))', 5: 'hue-rotate(-35deg) saturate(1.7) brightness(1.15) drop-shadow(0 0 4px rgba(255,80,220,.95))', 4: 'sepia(.45) hue-rotate(-18deg) saturate(1.3) brightness(1.15) drop-shadow(0 0 2px rgba(255,170,90,.9))' };
/* 19:30 대표님 「공격 모션이 느리고 임팩트 없어」: 망자병 베기 영상(20장)은 2~7장이 칼을 든 채 멈춘 장면이라 0.8초 내내 느릿 → 0.55초로, 치켜들기는 빨리 지나고 내리치기(8~10장)가 0.25초(실제 맞는 순간)에 오게 */
const svAtkF = t => t < 0.1 ? t / 0.1 * 2 : t < 0.18 ? 2 + (t - 0.1) / 0.08 * 5 : t < 0.3 ? 7 + (t - 0.18) / 0.12 * 4 : Math.min(19, 11 + (t - 0.3) / 0.25 * 8);
function vsDraw(n, an, fi, h, filt, rot, loop) {
  const M = VS[n], N = M.n[an] || 1, k = h / M.hpx, key = M.f + '_' + an, src = ART[key]; if (!src) return;
  if (rot) ctx.rotate(rot);
  const img = baked(key, src, filt); fi = loop ? ((fi % N) + N) % N : clamp(fi, 0, N - 1);
  const i0 = Math.floor(fi), fr = fi - i0, dw = M.cw * k, dh = M.ch * k, dx = -M.ax * k, dy = -M.ay * k;
  const one = i => ctx.drawImage(img, (i % VS_COLS) * M.cw, Math.floor(i / VS_COLS) * M.ch, M.cw, M.ch, dx, dy, dw, dh);
  one(i0);
  const i1 = loop ? (i0 + 1) % N : Math.min(N - 1, i0 + 1);
  if (loop && fr > 0.04 && i1 !== i0) {   /* 섞기는 대기(천천히 도는 동작)만 — 빠른 동작은 겹쳐 보임 */ const ga = ctx.globalAlpha; ctx.globalAlpha = ga * fr; one(i1); ctx.globalAlpha = ga; }
}
/* 대기: 영상 그대로의 빠르기(5초에 한 바퀴)로 앞으로만. ph로 저마다 다른 때에서 시작 */
const vsIdle = (ph, sp, n) => ((S.t / (sp || 5) + (((ph || 0) * 0.618) % 1)) % 1) * (n || 40);
function drawSkel(a) {
  const sc = lerp(0.8, 1.25, a.d) * (a.big || 1) * (a.big ? UKU() : 1), img = SKEL[a.w];
  if (a.big && !a.fly) { const TC = ['#9aa0a6', '#5be37a', '#4aa8ff', '#b56cff', '#ffcc33'][a.g || 0], pu = 0.75 + 0.25 * Math.sin(S.t * 3 + a.ph); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * pu; ctx.fillStyle = TC; ctx.beginPath(); ctx.ellipse(a.x, a.y - 2, 50 * sc, 11 * sc, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 0.7; ctx.strokeStyle = TC; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(a.x, a.y - 2, 50 * sc, 11 * sc, 0, 0, 7); ctx.stroke();
    if ((a.g || 0) >= 2) { const g2 = ctx.createRadialGradient(a.x, a.y - 80 * sc, 4, a.x, a.y - 80 * sc, 90 * sc); g2.addColorStop(0, TC + '44'); g2.addColorStop(1, TC + '00'); ctx.globalAlpha = pu; ctx.fillStyle = g2; ctx.fillRect(a.x - 90 * sc, a.y - 170 * sc, 180 * sc, 180 * sc); } ctx.restore(); }   /* 01:20 소환수: 진화 단계 색 발밑 고리(회 · 초 · 파 · 보 · 금), 3단계부터 몸 빛 */
  /* 걷기(11-13 대표님 「걷는 게 엄청 부자연스럽다」): 서 있으면 숨쉬기만, 움직이면 움직인 거리만큼 다리를 번갈아 내딛고 걸음마다 살짝 출렁 */
  const mv = a.px === undefined ? 0 : Math.abs(a.x - a.px); a.px = a.x; a.wph = (a.wph ?? a.ph) + Math.min(mv, 6) * 0.1; a.wamp = lerp(a.wamp || 0, mv > 0.15 ? 1 : 0, 0.2); a.back = a.x < (a.px0 ?? a.x) - 0.05; a.px0 = a.x;
  const bob = a.fly ? 0 : (1 - a.wamp) * Math.sin(S.t * 2.6 + a.ph) * 0.8 - a.wamp * Math.abs(Math.sin(a.wph)) * 3.5 + (S.phase === 'cast' && S.cast > TB + 1.2 ? -Math.abs(Math.sin(S.t * 8 + a.cheer)) * 12 : 0);
  const hop = a.hop > 0 ? -Math.sin((1 - a.hop / 0.6) * Math.PI) * 34 : 0;   // 원정 성공 때 함성 뜀
  if (a.hurt > 0) a.hurt = Math.max(0, a.hurt - 1 / 60);
  const swk = a.sw > 0 ? Math.sin((1 - a.sw / SW_T) * Math.PI) : (a.hurt > 0 ? -Math.sin(a.hurt / 0.25 * Math.PI) * 0.6 : 0);   /* 맞으면 뒤로 움찔 */   /* 휘두르기: 발을 축으로 앞으로 기울였다 돌아옴 */
  ctx.save(); ctx.translate(a.x + swk * 10, a.y + bob + hop + (1 - a.rise) * 40);
  const wkey = (a.evo && need('evo' + a.evo)) ? '' : a.c >= 0 && ART['cls' + a.c] ? 'cls' + a.c : 'skel', legs = !!LEGS[wkey];   /* 다리 나눠 그리는 병과는 휘두를 때 윗몸만 숙이고 발은 땅에 붙임 */
  if (a.fly) ctx.rotate(a.fly.r); else if (swk && !legs && !(ART.sk4_idle && !a.evo)) ctx.rotate(swk * 0.42);
  ctx.globalAlpha = a.rise;
  if (a.rf != null && !a.fly) {   /* 부활한 지역 병사: 그 지역 적 그림을 오른쪽으로 돌려 초록 망자 빛으로 */
    const fa = a.rf === 0 ? ART.knight : ART['foe_' + REGION_BG[a.rf]];
    if (fa) { const h = 74 * sc, w = h * fa.width / fa.height; ctx.scale(-1, 1); ctx.drawImage(tinted(fa, 'rise' + a.rf, 1, RISE_TINT), -w / 2, -h, w, h); ctx.restore(); ctx.globalAlpha = 1; return; }
  }
  const GC = ['', '', '', '#7fb6ff', '#c58bff', '#ffcf5a', '#ff7a7a', '#ffffff'];   // 정예 이상은 발밑에 등급 빛
  if (a.g >= 3 && !a.fly) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * a.rise; ctx.fillStyle = GC[a.g]; ctx.beginPath(); ctx.ellipse(0, -2, 20 * sc, 6 * sc, 0, 0, 7); ctx.fill(); ctx.restore(); }
  const ev = a.evo || 0, EVS = [1, 1.18, 1.36, 1.6, 1.95], pop = a.evoFx > 0 ? 1 + Math.sin(Math.min(1, a.evoFx) * Math.PI) * 0.25 : 1;   /* 진화 단계마다 커짐 + 진화 순간 부풀었다 돌아옴 */
  const ea = ev ? need('evo' + ev) : null;   /* 진화 단계마다 다른 언데드 그림(구울 · 뼈 골렘 · 망령 기사 · 리치 — 11-13 대표님 「진화들 차이가 별로 없다」), 그림이 아직 없으면 병과 그림 + 색 */
  const ci = ea || (a.c >= 0 && ART['cls' + a.c] ? ART['cls' + a.c] : ART.skel), hh = ea ? EVO_H[ev] * pop : (a.c === 4 ? 96 : 74) * EVS[ev] * pop;   // 병과 그림(기수는 말 때문에 더 큼)
  const tier = ev ? ev : a.c >= 0 ? TIER_OF(a.g) : 0, cimg = ea || tinted(ci || img, 'cls' + a.c, tier, ev ? EVO_TINT : null);
  if (ev && !a.fly) { const EC = ['', '#5dff8f', '#6ab8ff', '#c58bff', '#ffd76a'][ev]; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (0.45 + 0.15 * Math.sin(S.t * 5 + a.ph)) * a.rise; ctx.fillStyle = EC; ctx.beginPath(); ctx.ellipse(0, -2, (18 + ev * 7) * sc, (5 + ev * 1.5) * sc, 0, 0, 7); ctx.fill();
    if (a.evoFx > 0) { ctx.globalAlpha = Math.min(1, a.evoFx) * 0.7; const cg = ctx.createLinearGradient(0, -260, 0, 0); cg.addColorStop(0, EC + '00'); cg.addColorStop(1, EC); ctx.fillStyle = cg; ctx.fillRect(-26 * sc, -260, 52 * sc, 260); }   /* 진화 빛기둥 */
    ctx.restore(); }
  if (a.mg) ctx.globalAlpha = Math.max(0, 1 - a.mg.t / 0.5) * a.rise;
  if (tier === 4 && !a.fly) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const fl = 0.5 + 0.5 * Math.sin(S.t * 9 + a.ph); const fg = ctx.createRadialGradient(0, -40 * sc, 4, 0, -40 * sc, 46 * sc); fg.addColorStop(0, `rgba(190,110,255,${0.35 + fl * 0.25})`); fg.addColorStop(1, 'rgba(120,40,220,0)'); ctx.fillStyle = fg; ctx.fillRect(-50 * sc, -100 * sc, 100 * sc, 110 * sc); ctx.restore(); }
  const SD = STYLE === '3d' && !ea && ['idle', 'walk', 'run', 'attack', 'hit'].every(k => need('sk5_' + k)), S4 = SD || (STYLE === 'old' && !ea && ['idle', 'walk', 'run', 'attack', 'hit'].every(k => need('sk4_' + k)));   /* 11-14 다크 SD 해골(sk5) 우선 */
  const SA = a.big && !a.fly ? need('sumA' + ({ '-1': 0, 1: 1, 2: 2, 3: 3 }[a.c] ?? 0)) : null;
  const SVN = a.big && !a.fly ? { '-1': 'sumv1', 1: 'sumv2', 2: 'sumv3', 3: 'sumv4' }[a.c] : null, SVok = SVN && VS[SVN] && need(SVN + '_idle') && need(SVN + '_attack');
  if (SVok) {   /* 03:10 영상 움직임: 평소 숨쉬기(앞뒤로 돌림) · 공격 0.6초 동안 영상 공격 장면 전부 */
    const atT = 0.6; if (a.sw > 0 && !(a.vT > 0)) a.vT = atT; if (a.vT > 0) a.vT -= 1 / 60; const at = a.vT > 0, M = VS[SVN], h = 150 * sc * pop;
    const NI = M.n.idle, q = (S.t * 10 + a.ph * 7) % (2 * NI - 2), fi = at ? (1 - a.vT / atT) * (M.n.attack - 1) : (q < NI ? q : 2 * NI - 2 - q);
    const wk = !at && (a.wamp || 0) > 0.25 && need(SVN + '_walk'); a.wf = ((a.wf ?? a.ph * 9) + (wk ? (a.back ? -1 : 1) * Math.max(0.12, Math.min(mv, 8) * 16 / 75) : 0) + 16) % 16;   /* 움직인 거리만큼 발을 내딛음(75 걸으면 한 바퀴) · 뒤로 갈 땐 거꾸로 */
    if (wk) { vsDraw(SVN + 'w', 'walk', a.wf, h, '', a.hurt > 0 ? -Math.sin(a.hurt / 0.25 * Math.PI) * 0.06 : 0, true); if (a.flash > 0) a.flash -= 1 / 60; }
    else {
    if (a.wamp > 0.05) ctx.translate(0, -Math.abs(Math.sin(a.wph)) * 6 * a.wamp);
    if (at && a.c !== 3) { const p = 1 - a.vT / atT; ctx.translate(p < 0.25 ? -12 * p / 0.25 : p < 0.42 ? -12 + 52 * (p - 0.25) / 0.17 : 40 * Math.pow(1 - (p - 0.42) / 0.58, 2), 0); }   /* 09:40 대표님 「때리기 이상」: 근접은 살짝 물러섰다 → 맞는 순간(0.25초)에 앞으로 쑥 40 내디딤 → 천천히 제자리 */
    vsDraw(SVN, at ? 'attack' : 'idle', fi, h, '', a.hurt > 0 ? -Math.sin(a.hurt / 0.25 * Math.PI) * 0.06 : 0, false);
    if (a.flash > 0) { a.flash -= 1 / 60; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a.flash * 5); vsDraw(SVN, at ? 'attack' : 'idle', fi, h, 'brightness(2.2) saturate(0)', 0, false); ctx.restore(); }
    }
  } else if (SA) {   /* 01:45 새 그림체 A 소환수 + 「딱딱탁」: 0.08초 뒤로 젖힘 → 0.05초 확 내려침(앞으로 쏠림 · 살짝 커짐) → 제자리 */
    const atT = 0.34; if (a.sw > 0 && !(a.vT > 0)) a.vT = atT; if (a.vT > 0) a.vT -= 1 / 60;
    const p = a.vT > 0 ? 1 - a.vT / atT : 0; let rot = 0, dx = 0, sq = 1;
    if (p > 0) { if (p < 0.22) { const q = p / 0.22; dx = -8 * q; sq = 1 - 0.05 * q; } else if (p < 0.34) { const q = (p - 0.22) / 0.12; dx = -8 + 44 * q; sq = 0.95 + 0.13 * q; } else { const q = (p - 0.34) / 0.66; dx = 36 * (1 - q) * (1 - q); sq = 1.08 - 0.08 * q; } }   /* 02:20 대표님 「오뚝이처럼 때려?」: 발밑 기준 기울이기 빼고 → 살짝 물러섰다 앞으로 쑥 내딛어 찌르고 돌아옴(멈칫 · 번쩍은 그대로) */
    const br = 1 + Math.sin(S.t * 2.4 + a.ph) * 0.018, h = 150 * sc * pop, w = h * SA.width / SA.height, hurt = a.hurt > 0 ? -Math.sin(a.hurt / 0.25 * Math.PI) * 0.14 : 0;
    if (a.wamp > 0.05) ctx.translate(0, -Math.abs(Math.sin(a.wph)) * 7 * a.wamp);
    ctx.save(); ctx.translate(dx, 0); ctx.rotate(hurt * 0.4); ctx.translate(0, -h * 0.5); ctx.scale(sq, br / Math.sqrt(sq)); ctx.translate(0, h * 0.5); ctx.drawImage(SA, -w * 0.5, -h, w, h);
    if (a.flash > 0) { a.flash -= 1 / 60; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a.flash * 6); ctx.filter = 'brightness(2.2) saturate(0)'; ctx.drawImage(SA, -w * 0.5, -h, w, h); ctx.filter = 'none'; }
    ctx.restore();
  } else if (!ea && vsOk('sv')) {   /* 영상 장면 망자병: 칼을 치켜들었다 내리침(0.8초) · 맞으면 뒤로 움찔 · 평소 숨쉬기 */
    const kc = KC[a.c] && vsOk(KC[a.c]) ? KC[a.c] : null, atT = kc ? K_AT[kc] : 0.55;
    if (a.sw > 0 && !(a.vT > 0)) a.vT = atT; if (a.vT > 0) a.vT -= 1 / 60;
    const h = 150 * sc * pop, at = a.vT > 0;
    /* 21:25 대표님 「걷는 게 체스말 · 종이」: 걷기 영상(sw2_walk)이 있으면 움직이는 동안 진짜 걷기 장면, 없으면 예전처럼 들썩이기 */
    const WN = kc || 'sw', walk = !at && (a.wamp || 0) > 0.2 && vsOk(WN), NW = VS[WN] ? VS[WN].n.walk : 24; a.wf = ((a.wf ?? a.ph * 13) + (walk ? (a.back ? -1 : 1) / 60 * 22 * clamp(mv / 2, 0.7, 1.8) : 0) + NW) % NW;   /* 뒤로 갈 땐 걸음을 거꾸로(뒷걸음) */
    const lean = walk ? 0 : (a.wamp || 0) * (0.07 + 0.03 * Math.sin(a.wph * 2)) * (S.surge > 0.05 || (S.eng || 0) < 0.99 ? 1 : 0.5);   /* 19:58 앞으로 걸어 나갈 때 몸을 숙이고 걸음마다 흔들림(가만히 선 채 미끄러지던 것) */
    if (a.wamp > 0.05 && (!walk || kc === 'k2')) ctx.translate(0, -Math.abs(Math.sin(a.wph)) * (kc === 'k2' ? 6 : 4) * a.wamp);
    const [vn, va, vf] = walk ? [WN, 'walk', a.wf] : kc ? [kc, at ? 'attack' : 'idle', at ? (1 - a.vT / atT) * (VS[kc].n.attack - 1) : (n => { const q = vsIdle(a.ph, 4, 2 * n - 2); return q < n ? q : 2 * n - 2 - q; })(VS[kc].n.idle)] : ['sv', at ? 'attack' : 'idle', at ? svAtkF(0.55 - a.vT) : vsIdle(a.ph)];   /* 병과 대기는 앞뒤로 오가며(끊김 없이) */
    vsDraw(vn, va, vf, h * (kc === 'k2' ? 1.08 : a.c === 2 ? 1.07 : 1), kc ? SV_TINT.d : (SV_TINT[a.c] || SV_TINT.d), (a.hurt > 0 ? -Math.sin(a.hurt / 0.25 * Math.PI) * 0.12 : 0) + (at ? 0 : lean), !at);
    if (a.flash > 0) { a.flash -= 1 / 60; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a.flash * 6); vsDraw(vn, va, vf, h, 'brightness(2.2) saturate(0)', 0, !at); ctx.restore(); }   /* 18:42 맞는 순간 하얗게 번쩍 */
    { const per = Math.max(1, Math.round(JB.armySize(st) / Math.max(1, armyVis()))); if (false && !a.fly && per > 1) { ctx.font = `800 ${Math.round(18 * sc)}px sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,0,20,.9)'; ctx.fillStyle = '#e8dcff'; ctx.strokeText('×' + per, 0, -h - 10); ctx.fillText('×' + per, 0, -h - 10); } }
  } else
  if (STYLE === '2d' && !ea && need('d2_skel')) {   /* 2D 망자병: 윗몸으로 칼 내리치기 · 맞으면 뒤로 움찔 · 걸으면 통통 */
    const st2 = a.sw > 0 ? 'attack' : a.hurt > 0 ? 'hit' : a.wamp > 0.05 ? 'walk' : 'idle', kk = a.sw > 0 ? 1 - a.sw / SW_T : a.hurt > 0 ? 1 - a.hurt / 0.25 : 0;
    const pf = ctx.filter; ctx.filter = STYLE0 === 'hq' ? 'brightness(1.45) contrast(1.1) saturate(1.2) drop-shadow(0 0 2px rgba(190,120,255,.95))' : 'brightness(1.05) saturate(1.1)'; puppet(ART.d2_skel, 145 * sc * pop, { flip: true, cut: 0.5, slash: '#c9a2ff', st: st2, k: kk, ph: a.ph, wph: a.wph }); ctx.filter = pf;
    { const per = Math.max(1, Math.round(JB.armySize(st) / Math.max(1, armyVis()))); if (false && !a.fly && per > 1) { const h = 145 * sc * pop; ctx.font = `800 ${Math.round(18 * sc)}px sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,0,20,.9)'; ctx.fillStyle = '#e8dcff'; ctx.strokeText('×' + per, 0, -h - 10); ctx.fillText('×' + per, 0, -h - 10); } }
  } else
  if (S4) {   /* 03:40 진짜 3D 동작(Meshy 칼 해골 → 브라우저에서 찍어 옴): 대기 · 걷기 · 달리기 · 베기 · 맞기 */
    const M4 = SD ? SK5 : SK4, PF = SD ? 'sk5_' : 'sk4_'; let an = 'idle', fi;
    if (a.sw > 0) { an = 'attack'; fi = 1 + Math.min(9, Math.floor((1 - a.sw / SW_T) * 10)); }
    else if (a.hurt > 0) { an = 'hit'; fi = Math.min(11, Math.floor((1 - a.hurt / 0.25) * 11)); }
    else if (a.wamp > 0.05) { an = a.wamp > 0.5 ? 'run' : 'walk'; fi = Math.floor((a.wph / (Math.PI * 2)) * 12); }
    else fi = Math.floor(((S.t + a.ph) / 1.87) * 12);
    fi = ((fi % 12) + 12) % 12; const im = ART[PF + an], k = (SD ? 150 : 185) * sc * pop / M4.hpx, h = (SD ? 150 : 185) * sc * pop;
    const pf = ctx.filter; ctx.filter = SD ? 'brightness(1.15) saturate(1.25) contrast(1.1) drop-shadow(0 0 1.2px #12051e) drop-shadow(0 0 1.2px #12051e)' : STYLE === 'old' ? 'brightness(1.55) contrast(1.18) saturate(1.2) drop-shadow(0 0 2px #b98bff) drop-shadow(0 0 1px #000)' : 'brightness(1.35) saturate(1.1)';   /* ③ 개선: 보랏빛 테두리로 어두운 배경에서 떠 보이게 */ if (SD) { ctx.save(); ctx.scale(-1, 1); } ctx.drawImage(im, fi * M4.cw, 0, M4.cw, M4.ch, -M4.ax * k, -M4.ay * k, M4.cw * k, M4.ch * k); if (SD) ctx.restore(); ctx.filter = pf;   /* SD 그림은 왼쪽을 봐서 뒤집어 적(오른쪽)을 보게 */   /* 3D 그림이 어두워서 밝힘 */
    { const per = Math.max(1, Math.round(JB.armySize(st) / Math.max(1, armyVis()))); if (false && !a.fly && per > 1) { ctx.font = `800 ${Math.round(18 * sc)}px sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,0,20,.9)'; ctx.fillStyle = '#e8dcff'; ctx.strokeText('×' + per, 0, -h - 10); ctx.fillText('×' + per, 0, -h - 10); } }
  } else
  if (false) {   /* A 시험판: 부대 = 큰 3D 캐릭터 한 명(진짜 걷기 동작) + 머리 위 ×수 */
    const run = a.wamp > 0.5 && S3r, sh = run ? S3r : S3, N = 12, cw = sh.width / N, h = 205 * sc * pop, w = h * cw / sh.height, fi = a.wamp > 0.05 ? Math.floor((a.wph / (Math.PI * 2)) * N * 1.0) % N : 0;
    if (swk) ctx.rotate(swk * 0.3); ctx.drawImage(sh, ((fi % N) + N) % N * cw, 0, cw, sh.height, -w / 2, -h, w, h);
    if (a.sw > 0) { const k = 1 - a.sw / SW_T; ctx.save(); ctx.rotate(-swk * 0.3); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9; ctx.strokeStyle = '#e9ddff'; ctx.lineCap = 'round'; for (const [lw, al] of [[14 * sc, 0.25], [5 * sc, 1]]) { ctx.globalAlpha *= al === 1 ? 1 : 1; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(w * 0.18, -h * 0.5, h * 0.36, -1.5 + k * 0.6, -1.5 + k * 0.6 + 1.9 * Math.min(1, k * 2.2)); ctx.stroke(); } ctx.restore(); }   /* A판 03:23: 칼 휘두를 때 하얀 칼자국(동작 그림이 오기 전 임시) */
    { const per = Math.max(1, Math.round(JB.armySize(st) / Math.max(1, armyVis()))); if (false && !a.fly && per > 1) { ctx.font = `800 ${Math.round(18 * sc)}px sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,0,20,.9)'; ctx.fillStyle = '#e8dcff'; ctx.strokeText('×' + per, 0, -h - 6); ctx.fillText('×' + per, 0, -h - 6); } }
  } else
  if (ci) { const h = hh * sc, w = h * ci.width / ci.height; drawWalk(cimg, wkey, w, h, a.wph, a.fly ? 0 : a.wamp, a.fly ? 0 : swk * 0.38); if (ev === 4 && a.tag) { ctx.font = `800 ${Math.round(13 * sc)}px ${SERIF}`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,0,20,.9)'; ctx.strokeText(L.evo.names[ev], 0, -h - 6); ctx.fillStyle = ev === 4 ? '#ffd76a' : '#d9b8ff'; ctx.fillText(L.evo.names[ev], 0, -h - 6); } } else
  ctx.drawImage(img, -22 * sc, -64 * sc, 44 * sc, 66 * sc);
  ctx.restore(); ctx.globalAlpha = 1;
}
function drawFoe(f) {   /* 01:35 「딱딱탁」: 맞으면 0.16초 뒤로 튕겼다 돌아옴 */
  const kp = f.kbT > 0 ? 1 - f.kbT / 0.16 : 1, kx = f.kbT > 0 ? (kp < 0.2 ? kp / 0.2 : 1 - (kp - 0.2) / 0.8) * 28 : 0; if (f.kbT > 0) f.kbT -= 1 / 60;   /* 09:40 맞는 순간 확 밀렸다(0.03초) 천천히 돌아옴 · 28 */
  if (kx) { ctx.save(); ctx.translate(f.x + kx, f.y); ctx.rotate(kx / 28 * 0.12); ctx.translate(-f.x, -f.y); } drawFoe0(f); if (kx) ctx.restore();   /* 밀리며 뒤로 젖혀짐 */
}
function drawFoe0(f) {
  const sc = 1.9 * lerp(0.85, 1.1, f.d) * (f.kind === 'shield' ? 1.18 : f.kind === 'archer' ? 0.92 : 1), mv = f.px === undefined ? 0 : Math.abs(f.x - f.px);
  f.px = f.x; f.wph = (f.wph ?? f.ph) + Math.min(mv, 6) * 0.1; f.wamp = lerp(f.wamp || 0, mv > 0.15 ? 1 : 0, 0.2);   /* 적도 걸을 때만 다리를 번갈아 내딛음(전엔 서 있어도 늘 통통 튐) */
  const bob = (1 - f.wamp) * Math.sin(S.t * 2.6 + f.ph) * 0.8 - f.wamp * Math.abs(Math.sin(f.wph)) * 3.5 + (f.fly ? -150 + Math.sin(S.t * 5 + f.ph) * 10 : 0);
  ctx.save(); if (!f.flee) { ctx.globalCompositeOperation = 'lighter'; const rg = ctx.createRadialGradient(f.x, f.y - 40 * sc, 4, f.x, f.y - 40 * sc, 48 * sc); rg.addColorStop(0, 'rgba(255,40,60,.32)'); rg.addColorStop(1, 'rgba(255,40,60,0)'); ctx.fillStyle = rg; ctx.fillRect(f.x - 50 * sc, f.y - 92 * sc, 100 * sc, 100 * sc); ctx.globalCompositeOperation = 'source-over'; }   /* A판: 적 뒤 붉은 빛(우리 편과 한눈에 구분) */ ctx.globalAlpha = 0.5; ctx.fillStyle = '#05000c'; ctx.beginPath(); ctx.ellipse(f.x, f.y, 22 * sc, 6 * sc, 0, 0, 7); ctx.fill(); if (!f.flee) { ctx.globalAlpha = 0.75; ctx.strokeStyle = '#ff3a4a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(f.x, f.y - 1, 24 * sc, 7 * sc, 0, 0, 7); ctx.stroke(); } ctx.restore();   /* 적 발밑 그림자 + 빨간 고리(적 편 표시 — 11-13 대표님 「상대는 보이지도 않네」) */
  const ak = f.atk > 0 ? -Math.sin((1 - f.atk / 0.32) * Math.PI) * 22 : 0; f.hk = Math.max(0, (f.hk || 0) - 1 / 60); if (f.flash > 0.12 && !(f.hk > 0)) f.hk = 0.16; const hq = f.hk > 0 ? Math.sin(f.hk / 0.16 * Math.PI) : 0;   /* 11-14 타격감: 맞으면 찌그러지고 뒤로 살짝 밀림 */
  ctx.save(); ctx.translate(f.x + ak + hq * 9, f.y + bob); ctx.scale(1 + 0.1 * hq, 1 - 0.08 * hq); if (f.flee) ctx.scale(-1, 1); if (ak && !ART.kn_attack) ctx.rotate(-0.12 * Math.sin((1 - f.atk / 0.32) * Math.PI));
  const FAi = !f.fly ? need('foeA' + ({ foot: 0, archer: 1, shield: 2, priest: 3, captain: 2, lancer: 0, paladin: 2, leech: 2, pyro: 3, frost: 3, plague: 3, abyss: 3, bomber: 0 }[f.kind] ?? 0)) : null;
  const FVi = !f.fly ? 'foev' + ({ foot: 0, archer: 1, shield: 2, priest: 3, captain: 2, lancer: 0, paladin: 2, leech: 2, pyro: 3, frost: 3, plague: 3, abyss: 3, bomber: 0 }[f.kind] ?? 0) : null;
  if (FVi && VS[FVi] && need(FVi + '_idle') && need(FVi + '_attack')) {   /* 03:20 적 영상 동작: 평소 숨쉬기 · f.atk 동안 공격 장면 */
    const M = VS[FVi], h = (f.elite ? 104 : 90) * sc, at = f.atk > 0, NI = M.n.idle, q = (S.t * 9 + f.ph * 5) % (2 * NI - 2), fi = at ? (1 - f.atk / 0.32) * (M.n.attack - 1) : (q < NI ? q : 2 * NI - 2 - q);
    if (f.elite && ELITE[f.kind]) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.fillStyle = ELITE[f.kind].col || '#ffcc33'; ctx.beginPath(); ctx.ellipse(0, -2, 46 * sc / 1.9, 9, 0, 0, 7); ctx.fill(); ctx.restore(); }
    vsDraw(FVi, at ? 'attack' : 'idle', fi, h, f.elite && ELITE[f.kind] ? 'drop-shadow(0 0 6px ' + (ELITE[f.kind].col || '#ffcc33') + ')' : '', 0, false);
    if (f.flash > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, f.flash * 4); vsDraw(FVi, at ? 'attack' : 'idle', fi, h, 'brightness(2.2) saturate(0)', 0, false); ctx.restore(); }
    ctx.restore(); return;
  }
  if (FAi) {   /* 02:05 그림체 A 적(밝고 굵은 인간 왕국 병사): 그림 한 장 + 숨쉬기 · 공격 쏠림 · 맞으면 하얗게 */
    const h = (f.elite ? 104 : 90) * sc, w = h * FAi.width / FAi.height, br = 1 + Math.sin(S.t * 2.6 + f.ph) * 0.02; const pf = ctx.filter;
    if (f.elite && ELITE[f.kind]) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.fillStyle = ELITE[f.kind].col || '#ffcc33'; ctx.beginPath(); ctx.ellipse(0, -2, 46 * sc / 1.9, 9, 0, 0, 7); ctx.fill(); ctx.restore(); ctx.filter = 'drop-shadow(0 0 6px ' + (ELITE[f.kind].col || '#ffcc33') + ')'; }
    ctx.save(); ctx.scale(1 / Math.sqrt(br), br); ctx.drawImage(FAi, -w / 2, -h, w, h); ctx.filter = pf;
    if (f.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, f.flash * 4); ctx.filter = 'brightness(2.2) saturate(0)'; ctx.drawImage(FAi, -w / 2, -h, w, h); ctx.filter = pf; }
    ctx.restore(); ctx.restore(); return;
  }
  if (!f.fly && ['walk', 'idle', 'attack', 'hit'].every(k => need('kn_' + k))) {   /* 04:30 적 병사 3D 동작(걷기 · 대기 · 베기 · 맞기) */
    if (f.flash > 0.05 && !(f.hT > 0)) f.hT = 0.4; if (f.hT > 0) f.hT -= 1 / 60;
    if (f.cryT > 0) f.cryT -= 1 / 60; if (f.castT > 0) f.castT -= 1 / 60;
    let an = 'idle', fi; if (f.cryT > 0 && !window.BACKVIEW[f.kind] && need('kn_' + f.kind + '_cry')) { an = 'cry'; fi = 2 + Math.min(8, Math.floor((1 - f.cryT / 1.2) * 9)); } else if (f.castT > 0 && !window.BACKVIEW[f.kind] && need('kn_' + f.kind + '_cast')) { an = 'cast'; fi = Math.min(11, Math.floor((1 - f.castT / 1.3) * 12)); } else if (f.atk > 0) { an = 'attack'; fi = 1 + Math.min(9, Math.floor((1 - f.atk / 0.32) * 10)); } else if (f.hT > 0) { an = 'hit'; fi = 1 + Math.min(8, Math.floor((1 - f.hT / 0.4) * 9)); } else if (f.wamp > 0.05) { an = 'walk'; fi = Math.floor((f.wph / (Math.PI * 2)) * 12); } else fi = Math.floor(((S.t + f.ph) / 1.87) * 12);
    fi = ((fi % 12) + 12) % 12; const own = !window.BACKVIEW[f.kind] && need('kn' + (f.kind === 'foot' ? '' : '_' + f.kind) + '_' + an) && f.kind !== 'foot', sd = STYLE === '3d' && !own && ['walk', 'idle', 'attack', 'hit'].every(k => need('kn5_' + k)), d2s = STYLE === '2d' && (need('d2_' + (STYLE0 === 'hq' ? {} : { archer: 'archer', shield: 'shield', priest: 'priest', captain: 'captain', paladin: 'captain', lancer: 'captain' }[f.kind] || 'knight')) || need('d2_knight')), d2 = !!d2s, sheet = own ? 'kn_' + f.kind + '_' + an : (sd ? 'kn5_' : 'kn_') + an, M5 = own && window['KN_' + f.kind] || (sd ? KN5 : KN), h = (sd ? 150 : 172) * (f.big || 1) * lerp(0.85, 1.1, f.d), k = h / M5.hpx, pf = ctx.filter;
    if (f.elite && ELITE[f.kind]) { const E = ELITE[f.kind], pu = 0.75 + 0.25 * Math.sin(S.t * 5 + f.ph); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const rg = ctx.createRadialGradient(0, -h * 0.5, 4, 0, -h * 0.5, h * 0.75); rg.addColorStop(0, E.glow + '88'); rg.addColorStop(1, E.glow + '00'); ctx.globalAlpha = 0.6 * pu; ctx.fillStyle = rg; ctx.fillRect(-h * 0.75, -h * 1.25, h * 1.5, h * 1.5); ctx.restore();
      ctx.save(); ctx.font = `800 17px ${SERIF}`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,0,20,.9)'; const nm = '◆ ' + L.foes.elite[f.kind].name; ctx.strokeText(nm, 0, -h - 26); ctx.fillStyle = E.col; ctx.fillText(nm, 0, -h - 26); ctx.restore(); }   /* 11-14 지역 정예: 지역 색 기운 + 이름표 */
    if (f.curse > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, f.curse) * (0.6 + 0.3 * Math.sin(S.t * 6)); ctx.translate(0, -h - 8); ctx.rotate(S.t * 1.5); ctx.strokeStyle = '#c58bff'; ctx.lineWidth = 3; ctx.beginPath(); for (let j = 0; j < 6; j++) { const an = j / 6 * 6.28; j ? ctx.lineTo(Math.cos(an) * 16, Math.sin(an) * 16 * 0.5) : ctx.moveTo(16, 0); } ctx.closePath(); ctx.stroke(); ctx.fillStyle = '#e8d0ff'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill(); ctx.restore(); }   /* 쌍둥이 저주 표식 */
    if (f.guard > 0) { f.guard -= 1 / 60; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, f.guard) * (0.22 + 0.06 * Math.sin(S.t * 8)); ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(255,220,120,.05)'; ctx.beginPath(); ctx.ellipse(0, -h * 0.5, h * 0.42, h * 0.62, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }   /* 성기사 방패 */
    if (f.bless > 0 || f.kind === 'captain') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const rg = ctx.createRadialGradient(0, -h * 0.45, 4, 0, -h * 0.45, h * 0.6); rg.addColorStop(0, f.kind === 'captain' ? 'rgba(255,90,40,.35)' : 'rgba(255,210,90,.4)'); rg.addColorStop(1, 'rgba(255,160,40,0)'); ctx.fillStyle = rg; ctx.fillRect(-h * 0.6, -h * 1.05, h * 1.2, h * 1.2); ctx.restore(); }
    if (f.cast > 0) { f.cast -= 1 / 60; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = f.cast / 0.6; ctx.fillStyle = 'rgba(255,230,140,.6)'; ctx.fillRect(-26, -h * 1.6, 52, h * 1.6); ctx.restore(); }
    if (!own && vsOk('kv')) {   /* 영상 장면 적 기사(대장 · 정예는 색으로) */
      if (an === 'attack' && !(f.vT > 0)) f.vT = 0.55;   /* 19:30 적 기사 베기도 0.55초 */ if (f.vT > 0) f.vT -= 1 / 60;
      const H3 = 160 * (f.big || 1) * lerp(0.85, 1.1, f.d), at = f.vT > 0, tint = { captain: 'sepia(.3) saturate(1.6) ', priest: 'brightness(1.3) saturate(.5) ', leech: 'saturate(1.8) hue-rotate(-12deg) ', pyro: 'sepia(.5) saturate(2) hue-rotate(-20deg) ', frost: 'hue-rotate(170deg) ', lancer: 'sepia(.4) ', plague: 'sepia(.5) hue-rotate(50deg) ', paladin: 'brightness(1.3) sepia(.6) ', abyss: 'hue-rotate(230deg) ', archer: 'hue-rotate(80deg) saturate(.8) ', shield: 'hue-rotate(200deg) saturate(.8) ' }[f.kind] || '';
      const fwalk = !at && (f.wamp || 0) > 0.2 && vsOk('kw'); f.wf = ((f.wf ?? f.ph * 11) + (fwalk ? 1 / 60 * 26 * clamp(mv / 2, 0.7, 2) : 0)) % VS.kw.n.walk;   /* 21:25 걷기 영상(kw2_walk)이 있으면 뛰어 들어올 때 진짜 걷기 */
      if (f.wamp > 0.05 && !at && !fwalk) ctx.translate(0, -Math.abs(Math.sin(f.wph * 1.4)) * 6 * f.wamp);   /* 19:59 뛰어 들어올 때 걸음마다 들썩 · 앞으로 숙임 */
      const [kn2, ka2, kf2] = fwalk ? ['kw', 'walk', f.wf] : ['kv', at ? 'attack' : 'idle', at ? svAtkF(0.55 - f.vT) : vsIdle(f.ph, 4.4)];
      vsDraw(kn2, ka2, kf2, H3, tint + 'brightness(1.12) contrast(1.06) drop-shadow(0 0 2px rgba(255,170,120,.85))', (an === 'hit' ? Math.sin(Math.min(1, kk0(f)) * Math.PI) * 0.14 : 0) - (at || fwalk ? 0 : (f.wamp || 0) * 0.1), !at);
      if (f.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, f.flash * 3); vsDraw(kn2, ka2, kf2, H3, 'brightness(2)', 0, !at); }
      ctx.restore(); return; }
    if (d2) { const kk = an === 'attack' ? 1 - f.atk / 0.32 : an === 'hit' ? 1 - f.hT / 0.4 : an === 'cast' ? 1 - f.castT / 1.3 : an === 'cry' ? 1 - f.cryT / 1.2 : 0, H2 = (f.kind === 'captain' ? 165 : f.kind === 'shield' ? 158 : 150) * (f.big || 1) * lerp(0.85, 1.1, f.d); ctx.filter = STYLE0 === 'hq' && f.kind === 'foot' ? 'brightness(1.25) contrast(1.1) drop-shadow(0 0 2px rgba(255,200,140,.9))' : f.kind === 'foot' || (d2s !== ART.d2_knight && !f.elite) ? 'brightness(1.02)' : ({ captain: 'sepia(.3) saturate(1.6)', priest: 'brightness(1.3) saturate(.5)', leech: 'saturate(1.8) hue-rotate(-12deg)', pyro: 'sepia(.5) saturate(2) hue-rotate(-20deg)', frost: 'brightness(1.3) hue-rotate(170deg)', lancer: 'sepia(.4) saturate(1.3)', plague: 'sepia(.5) saturate(1.6) hue-rotate(50deg)', paladin: 'brightness(1.4) sepia(.6)', abyss: 'saturate(1.4) hue-rotate(230deg)', archer: 'hue-rotate(80deg) saturate(.8)', shield: 'hue-rotate(200deg) saturate(.8)' }[f.kind] || ''); puppet(d2s, H2, { flip: false, cut: 0.5, slash: f.kind === 'archer' || f.kind === 'priest' ? null : '#ffd9a0', st: an === 'attack' ? 'attack' : an === 'hit' ? 'hit' : an === 'walk' ? 'walk' : an === 'cast' || an === 'cry' ? 'cast' : 'idle', k: kk, ph: f.ph, wph: f.wph }); ctx.filter = pf; if (f.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, f.flash * 3); puppet(d2s, H2, { cut: 0.5, st: 'hit', k: 0.5 }); } ctx.restore(); return; }
    ctx.scale(own || sd ? 1 : KN_FLIP, 1); ctx.filter = sd && f.kind === 'foot' ? 'brightness(1.12) saturate(1.25) contrast(1.1) drop-shadow(0 0 1.2px #12051e) drop-shadow(0 0 1.2px #12051e)' : own ? ({ shield: 'brightness(1.7) contrast(1.1)', archer: 'brightness(1.7) contrast(1.1)', captain: 'brightness(1.5) contrast(1.1)', priest: 'brightness(1.15) contrast(1.1)' }[f.kind] || 'brightness(1.35) contrast(1.12)') : ({ captain: 'brightness(1.15) contrast(1.2) sepia(.35) saturate(1.6)', priest: 'brightness(1.5) saturate(.4) sepia(.5)', leech: 'brightness(1.1) saturate(1.8) hue-rotate(-12deg) contrast(1.2)', pyro: 'brightness(1.25) sepia(.6) saturate(2.2) hue-rotate(-20deg)', frost: 'brightness(1.5) saturate(.5) hue-rotate(170deg)', lancer: 'brightness(1.2) sepia(.5) saturate(1.4) contrast(1.15)', plague: 'brightness(1.1) sepia(.5) saturate(1.6) hue-rotate(50deg)', paladin: 'brightness(1.6) sepia(.7) saturate(1.3)', abyss: 'brightness(1.05) saturate(1.4) hue-rotate(230deg) contrast(1.2)', archer: 'brightness(1.05) hue-rotate(-20deg) saturate(.8)', shield: 'brightness(.95) contrast(1.25) saturate(.7)' }[f.kind] || (STYLE === 'old' ? 'brightness(1.4) contrast(1.15) saturate(1.15) drop-shadow(0 0 2px #ff9a6a) drop-shadow(0 0 1px #000)' : 'brightness(1.1) contrast(1.15)'));
    ctx.drawImage(ART[sheet], fi * M5.cw, 0, M5.cw, M5.ch, -M5.ax * k, -M5.ay * k, M5.cw * k, M5.ch * k); ctx.filter = pf;
    if (f.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = f.flash * 3; ctx.drawImage(ART[sheet], fi * M5.cw, 0, M5.cw, M5.ch, -M5.ax * k, -M5.ay * k, M5.cw * k, M5.ch * k); }
    ctx.restore(); return;
  }
  const fk = REGION_BG[regionOf(st.stage)], fa = fk && ART['foe_' + fk];   // 지역마다 다른 병사 그림(있으면), 없으면 기사 + 색상 돌리기
  if (fa) { const h = 74 * sc, w = h * fa.width / fa.height; drawWalk(fa, 'foe', w, h, f.wph, f.fly ? 0 : f.wamp); } else
  if (ART.knight) { const h = 70 * sc, w = h * ART.knight.width / ART.knight.height; ctx.filter = regionFilter(); drawWalk(ART.knight, 'foe', w, h, f.wph, f.fly ? 0 : f.wamp); ctx.filter = 'none'; } else
  ctx.drawImage(KNIGHT, -20 * sc, -58 * sc, 40 * sc, 60 * sc);
  /* 종류 표시: 방패병 = 앞에 큰 방패 · 궁수 = 활 · 날개 적 = 퍼덕이는 날개 · 자폭병 = 붉게 깜빡이는 불씨 */
  /* 방패 네모 · 활 선(코드로 그린 것)은 어색해서 뺌(21:51 대표님 「이 어색함이란」) — 종류는 크기 · 움직임으로 구분하고, 제대로 된 그림이 오면 그때 */
  if (f.fly) { const fl = Math.sin(S.t * 18 + f.ph) * 0.6; ctx.fillStyle = 'rgba(40,10,30,.85)'; for (const sd of [-1, 1]) { ctx.save(); ctx.translate(0, -50 * sc); ctx.rotate(sd * (0.5 + fl)); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sd * 46 * sc, -18 * sc); ctx.lineTo(sd * 30 * sc, 8 * sc); ctx.closePath(); ctx.fill(); ctx.restore(); } }
  if (f.kind === 'bomber') { const bl = 0.5 + 0.5 * Math.sin(S.t * 14); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,${80 + bl * 80},40,${0.35 + bl * 0.4})`; ctx.beginPath(); ctx.arc(0, -40 * sc, 26 * sc, 0, 7); ctx.fill(); ctx.restore(); }
  if (f.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = f.flash * 4; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, -36 * sc, 22 * sc, 36 * sc, 0, 0, 7); ctx.fill(); }   /* 맞으면 번쩍 */
  ctx.restore();
}
window.BACKVIEW = {};   /* 11-14 14:20: 「뒤돌아 있음」 원인은 찍은 각도가 아니라 뒤집기 — 새 3D 5종은 그림 자체가 이미 왼쪽(군단 쪽)을 봐서 첫 병사처럼 좌우로 뒤집으면 등을 보였음. 새 그림은 안 뒤집음 */
const GI = { cw: 337, ch: 279, ax: 197.6, ay: 254.3, hpx: 220 };   /* 보스 거인 줄그림 */
const KN = { cw: 306, ch: 245, ax: 193.5, ay: 230.0, hpx: 220 }, KN_FLIP = -1;
const KN5 = { cw: 270, ch: 273, ax: 134.4, ay: 256.9, hpx: 220 };   /* 11-14 다크 SD 적 기사(이미 왼쪽을 봐서 뒤집지 않음) */
window.KN_priest = { cw: 298, ch: 244, ax: 168.6, ay: 231.9, hpx: 220 };   /* 11-14 사제 3D: 걷기 · 대기 · 주문 · 맞기 · 쓰러짐 */
window.KN_archer = { cw: 393, ch: 257, ax: 195.0, ay: 246.4, hpx: 220 };   /* 11-14 궁수 3D: 걷기 · 대기 · 활 당기기 · 맞기 · 쓰러짐 */
window.KN_shield = { cw: 333, ch: 264, ax: 210.8, ay: 235.8, hpx: 220 };   /* 11-14 방패병 3D: 걷기 · 대기 · 철퇴 베기 · 막기(맞을 때) · 쓰러짐 */
window.KN_captain = { cw: 376, ch: 315, ax: 213.4, ay: 259.6, hpx: 220 };   /* 11-14 적 대장(중간 보스) 3D: 걷기 · 대기 · 베기 · 맞기 · 외침 · 쓰러짐 */   /* 적 병사 줄그림 정보 · 왼쪽 보게 뒤집기 */
const SK4 = { cw: 449, ch: 322, ax: 174.1, ay: 257.9, hpx: 220 }, SW_T = 0.45, SK5 = { cw: 325, ch: 291, ax: 168.6, ay: 234.5, hpx: 220 };   /* 칼 해골 줄그림 정보(tools 가공 결과) · 베기 시간 */
function drawFallen(c) {   /* 쓰러진 우리 해골: 칼 해골 쓰러짐 동작 → 뼈 무더기로 누움 → 보랏빛 기둥과 함께 일어남 */
  if (vsOk('sv')) { const up = c.t > 3, p = up ? Math.max(0, 1 - (c.t - 3) / 0.4) : Math.min(1, c.t / 0.6); ctx.save(); ctx.translate(c.x, c.y); ctx.globalAlpha = up ? Math.max(0.2, 1 - (c.t - 3) / 0.6) : 1; vsDraw('sv', 'idle', 0, 150 * c.sc, 'brightness(.9) saturate(.7)', -ease(p) * 1.4); if (c.t > 2.4) { const q = Math.min(1, (c.t - 2.4) / 0.6); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, -200, 0, 0); g.addColorStop(0, 'rgba(160,100,255,0)'); g.addColorStop(1, `rgba(180,120,255,${0.55 * q})`); ctx.fillStyle = g; ctx.fillRect(-28, -200, 56, 200); } ctx.restore(); return; }
  if (STYLE === '2d' && need('d2_skel')) { const up = c.t > 3; ctx.save(); ctx.translate(c.x, c.y); ctx.globalAlpha = up ? Math.max(0, 1 - (c.t - 3) / 0.6) : 1; puppet(ART.d2_skel, 145 * c.sc, { flip: true, cut: 0.5, st: 'die', k: up ? Math.max(0, 1 - (c.t - 3) / 0.4) : c.t }); ctx.restore(); return; }
  const sd = STYLE === '3d' && need('sk5_death'), im = sd || need('sk4_death'), MK = sd ? SK5 : SK4; if (!im) return; const up = c.t > 3, k = (sd ? 150 : 165) * c.sc / MK.hpx, fi = up ? Math.max(0, 11 - Math.floor((c.t - 3) / 0.05)) : Math.min(11, Math.floor(c.t / 0.9 * 11));
  ctx.save(); ctx.translate(c.x, c.y); ctx.globalAlpha = up ? 1 - (c.t - 3) / 0.6 : 1; ctx.filter = 'brightness(1.1) saturate(.8)';
  if (sd) { ctx.save(); ctx.scale(-1, 1); } ctx.drawImage(im, fi * MK.cw, 0, MK.cw, MK.ch, -MK.ax * k, -MK.ay * k, MK.cw * k, MK.ch * k); if (sd) ctx.restore(); ctx.filter = 'none';
  if (c.t > 2.4) { const p = Math.min(1, (c.t - 2.4) / 0.6); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, -200, 0, 0); g.addColorStop(0, 'rgba(160,100,255,0)'); g.addColorStop(1, `rgba(180,120,255,${0.55 * p})`); ctx.fillStyle = g; ctx.fillRect(-28, -200, 56, 200); }
  ctx.restore();
}
function drawSlashes() { if (!S.slashes) return; for (const o of S.slashes) { o.t += 1 / 60; const k = o.t / 0.35; if (k > 1) continue; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.sin(k * Math.PI); ctx.strokeStyle = '#ffd2c0'; ctx.lineCap = 'round'; for (const [lw, a] of [[28, 0.3], [9, 1]]) { ctx.globalAlpha = Math.sin(k * Math.PI) * a; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(o.x + 120, o.y + 40, 190, Math.PI * (0.75 + k * 0.2), Math.PI * (1.35 + k * 0.3)); ctx.stroke(); } ctx.restore(); } S.slashes = S.slashes.filter(o => o.t < 0.4); }
function drawCorpse(c) {   /* 쓰러진 적: 0.3초 뒤로 넘어지며 밀려나고 0.6초 뒤부터 사라짐 */
  if (vsOk('kv') && !(c.kind && c.kind !== 'foot' && need('kn_' + c.kind + '_death'))) { const T = 0.9, p = Math.min(1, c.t / T), fade = clamp(1 - (c.t - T - 0.1) / 0.4, 0, 1); if (fade <= 0) return; ctx.save(); ctx.globalAlpha = fade; ctx.translate(c.x + 26 * p, c.y); vsDraw('kv', 'idle', 0, 160 * (c.big || 1) * lerp(0.85, 1.1, c.d), `brightness(${(1 + Math.round((1 - p) * 4) / 4 * 0.8).toFixed(2)})`, ease(p) * 1.35); ctx.restore(); return; }
  if (STYLE === '2d' && need('d2_knight')) { const ci2 = need('d2_' + ({ archer: 'archer', shield: 'shield', priest: 'priest', captain: 'captain' }[c.kind] || 'knight')) || ART.d2_knight; const fade = clamp(1 - (c.t - 0.7) / 0.4, 0, 1); if (fade <= 0) return; ctx.save(); ctx.globalAlpha = fade; ctx.translate(c.x + 30 * Math.min(1, c.t * 3), c.y); puppet(ci2, 150 * (c.big || 1) * lerp(0.85, 1.1, c.d), { cut: 0.5, st: 'die', k: c.t }); ctx.restore(); return; }
  if (need('kn_death')) { const own = c.kind && c.kind !== 'foot' && !window.BACKVIEW[c.kind] && need('kn_' + c.kind + '_death'), sd = STYLE === '3d' && !own && need('kn5_death'), M = own && window['KN_' + c.kind] || (sd ? KN5 : KN), T = c.kind === 'captain' ? 1.6 : 1.0, fade = clamp(1 - (c.t - T - 0.15) / 0.4, 0, 1); if (fade <= 0) return; const fi = Math.min(11, Math.floor(c.t / T * 11)), h = (sd ? 150 : 172) * (c.big || 1) * lerp(0.85, 1.1, c.d), k = h / M.hpx; ctx.save(); ctx.globalAlpha = fade; ctx.translate(c.x + 18 * Math.min(1, c.t * 3), c.y); ctx.scale(own || sd ? 1 : KN_FLIP, 1); ctx.filter = 'brightness(1.1) contrast(1.15)'; ctx.drawImage(ART[own ? 'kn_' + c.kind + '_death' : sd ? 'kn5_death' : 'kn_death'], fi * M.cw, 0, M.cw, M.ch, -M.ax * k, -M.ay * k, M.cw * k, M.ch * k); ctx.restore(); return; }   /* 04:30 적 병사: 진짜 쓰러지는 동작 */
  const t = c.t, k = ease(Math.min(1, t / 0.3)), fade = clamp(1 - (t - 0.6) / 0.5, 0, 1); if (fade <= 0) return;
  const fk = REGION_BG[regionOf(st.stage)], fa = fk && ART['foe_' + fk], im = fa || ART.knight; if (!im) return;
  const sc = 1.9 * lerp(0.85, 1.1, c.d), h = (fa ? 74 : 70) * sc, w = h * im.width / im.height;
  ctx.save(); ctx.globalAlpha = fade; ctx.translate(c.x + 34 * k, c.y - Math.sin(k * Math.PI) * 14); ctx.rotate(k * 1.35);
  if (!fa) ctx.filter = regionFilter(); ctx.filter = (ctx.filter === 'none' ? '' : ctx.filter + ' ') + `brightness(${1 + (1 - k) * 1.2})`; ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore();
}
// 새 대마법 효과: 묘비(만 개의 묘비) · 얼음(얼어붙은 시각)
function drawOverlay() {
  const dt = 1 / 60;
  if (S.tombs && S.tombs.length) {
    for (const t of S.tombs) {
      t.age += dt; if (t.age < 0) continue; const k = Math.min(1, t.age * 4), fade = Math.min(1, (t.life - t.age) * 2); if (fade <= 0) continue;
      ctx.save(); ctx.globalAlpha = fade; ctx.translate(t.x, t.y); const h = 34 * k;
      ctx.fillStyle = '#3a3346'; ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-11, -h + 10); ctx.quadraticCurveTo(0, -h - 4, 11, -h + 10); ctx.lineTo(11, 0); ctx.fill();
      ctx.strokeStyle = '#6dff9f'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(93,255,143,.35)'; ctx.beginPath(); ctx.ellipse(0, -h / 2, 16, h / 2 + 8, 0, 0, 7); ctx.fill(); ctx.restore();
    }
    S.tombs = S.tombs.filter(t => t.age < t.life);
  }
  if (st && st.frozen > 0 && S.giant && S.giant.on && !S.giant.dead) {
    const a = Math.min(1, st.frozen) * 0.55, gx = S.giant.x, gy = S.giant.y;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(gx, gy - 200, 20, gx, gy - 200, 260); g.addColorStop(0, `rgba(160,230,255,${a})`); g.addColorStop(1, 'rgba(80,180,255,0)'); ctx.fillStyle = g; ctx.fillRect(gx - 300, gy - 480, 600, 560);
    ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = `rgba(220,248,255,${a + 0.2})`; ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) { const x = gx - 110 + i * 27, y = gy - 40 - (i % 3) * 70; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y - 40); ctx.lineTo(x + 16, y); ctx.stroke(); }
    ctx.restore();
  }
}
// 300명이 넘으면 뒤쪽 지평선에 '먼 군단' 그림자(눈만 빛남)를 깔아서 1000명이 커 보이게. 수가 바뀔 때만 다시 그림
let HORDE = null, hordeN = -1;
function drawHorde() {
  const n = typeof JB !== 'undefined' && st ? JB.armySize(st) : 0, far = Math.min(700, Math.max(0, n - 300));
  if (far <= 0) return;
  const cnt = Math.round(far * 0.45);
  if (cnt !== hordeN) {
    hordeN = cnt; HORDE = document.createElement('canvas'); HORDE.width = 560; HORDE.height = 90; const g = HORDE.getContext('2d');
    let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const list = []; for (let i = 0; i < cnt; i++) list.push([r() * 540 + 10, r() * 60 + 22]); list.sort((a, b) => a[1] - b[1]);
    for (const [x, y] of list) { const k = 0.55 + y / 90 * 0.6; g.fillStyle = `rgba(18,8,30,${0.75 + k * 0.2})`; g.beginPath(); g.ellipse(x, y, 4 * k, 9 * k, 0, 0, 7); g.fill(); g.beginPath(); g.arc(x, y - 11 * k, 3.6 * k, 0, 7); g.fill(); g.fillRect(x + 3 * k, y - 22 * k, 1.2, 20 * k); g.fillStyle = 'rgba(190,120,255,.9)'; g.fillRect(x - 1.6 * k, y - 12 * k, 1.3, 1.3); g.fillRect(x + 0.6 * k, y - 12 * k, 1.3, 1.3); }
  }
  ctx.save(); ctx.globalAlpha = 0.95; ctx.drawImage(HORDE, 230, GROUND - 46 + Math.sin(S.t * 1.3) * 1.5); ctx.restore();
}
// 군단 깃발: 코드로 그림(펄럭이는 천 + 금색 해골 문장). 군단이 커질수록 늘어남 → '내 군대' 느낌
function drawBanner(x, y, sc, ph) {
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.fillStyle = '#2a1a0c'; ctx.fillRect(-3, -260, 6, 260);                       // 깃대
  ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.moveTo(0, -278); ctx.lineTo(7, -262); ctx.lineTo(-7, -262); ctx.fill();   // 창끝
  const t = S.t * 2.2 + ph, wv = k => Math.sin(t + k * 2.4) * 7 * k;
  ctx.beginPath(); ctx.moveTo(3, -255);                                              // 천(오른쪽으로 펄럭임)
  for (let i = 0; i <= 10; i++) { const k = i / 10; ctx.lineTo(3 + 90 * k, -255 + wv(k)); }
  ctx.lineTo(93, -140 + wv(1)); ctx.lineTo(48, -168 + wv(0.5)); ctx.lineTo(3, -140);   // 아래 갈라진 꼬리
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -255, 0, -140); g.addColorStop(0, '#4a1d7a'); g.addColorStop(1, '#22093d'); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 2.5; ctx.stroke();
  // 해골 문장
  const cx = 48, cy = -206 + wv(0.5);
  ctx.fillStyle = '#e8c56a'; ctx.beginPath(); ctx.arc(cx, cy, 15, 0, 7); ctx.fill(); ctx.fillRect(cx - 9, cy + 8, 18, 10);
  ctx.fillStyle = '#22093d'; ctx.beginPath(); ctx.arc(cx - 6, cy - 1, 4.5, 0, 7); ctx.arc(cx + 6, cy - 1, 4.5, 0, 7); ctx.fill();
  ctx.fillRect(cx - 5, cy + 12, 2, 6); ctx.fillRect(cx - 1, cy + 12, 2, 6); ctx.fillRect(cx + 3, cy + 12, 2, 6);
  ctx.restore();
}
function drawBanners() {
  const n = typeof JB !== 'undefined' && st ? JB.armySize(st) : 0;
  if (n >= 10) drawBanner(128, 548, 1.05, 0);                                        // 지배자 뒤 큰 깃발
  if (!S.army.length) return;
  let x0 = 1e9, x1 = 0; for (const a of S.army) if (!a.fly) { x0 = Math.min(x0, a.tx ?? a.x); x1 = Math.max(x1, a.tx ?? a.x); }
  const k = n >= 1000 ? 5 : n >= 300 ? 3 : n >= 100 ? 1 : 0;
  for (let i = 0; i < k; i++) { const x = k === 1 ? (x0 + x1) / 2 : lerp(x0 + 20, x1 - 20, i / (k - 1)); drawBanner(x, GROUND + 52, 0.62, i * 1.7); }
}
function drawLordTag() {   /* 주인공 이름표: 지배자 머리 위 금빛 패 */
  if (TRAILER || S.phase === 'cast') return; const x = 222 + LDX() + 8, y = 614;   /* 19:22 머리 위 패가 왼쪽 위 「빠른 보상 · 상점」과 겹침 → 영웅처럼 발밑 이름표 */   /* 세로 화면: 위 아이콘에 가려서 지배자 오른쪽 어깨 옆으로 */
  const vl = JB.vipLv(st), ttl = vl >= 12 ? L.vip.title12 : vl >= 10 ? L.vip.title10 : '', tc = vl >= 4 ? '#ffd76a' : vl >= 1 ? '#e4ecf8' : '#c9a96a';   /* 11-14 귀빈 이름표: 0 낡은 금 · 1 은빛 · 4 금빛 · 10 칭호 · 11 빛나는 금 · 12 천년의 군주 */
  const fz = Math.round(13 * Math.min(WK(), 2.2)); ctx.save(); ctx.font = `900 ${fz}px ${SERIF}`; const t = '♛ ' + (ttl || L.ui.lordTag), w = ctx.measureText(t).width + fz * 1.1;
  if (vl >= 11) { ctx.shadowColor = '#ffcf5a'; ctx.shadowBlur = 16 + 8 * Math.sin(S.t * 3); }
  ctx.fillStyle = vl >= 10 ? 'rgba(40,20,4,.9)' : 'rgba(20,8,34,.85)'; ctx.strokeStyle = tc; ctx.lineWidth = vl >= 10 ? 3.5 : 2.5; ctx.beginPath(); ctx.roundRect(x - w / 2, y - fz * 0.75, w, fz * 1.5, fz * 0.75); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = tc; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y + 1); ctx.restore();
}
const STAFF_AT = { x: 64, y: 31, h: 376, r: 0 }, STAFF_VIP = { x: 108, y: 24, h: 384, r: 0.1 };   /* 지팡이 밑동 자리 · 길이 · 기울기(지배자 발 기준). 귀빈 그림(540×720)은 지팡이가 밑동 x 398 → 꼭대기 x 465로 오른쪽으로 기울어 있음(21:50 픽셀로 잼) */   /* 지배자 그림 안의 지팡이 자리(지배자 발 기준) — 원래 그림 364×720에서 x 307 · 위 5 · 아래 690 */
/* 11-14 다크 SD 지배자(Meshy 3D → 줄그림): 대기 · 작은 마법(지팡이 내지르기) · 대마법(망토 펼치며 모으기) · 맞기.
   대표님 「마법 쓰는데 모션도 없고 심심하다」 → 작은 마법마다 지팡이를 내지르고 구슬이 번쩍, 대마법은 모으는 자세로 버팀 */
const LD5 = { cw: 236, ch: 260, ax: 96.2, ay: 258.2, hpx: 220, h: 270, dx: 38 };
const LD5_ORB = { idle: [[65, -190]], cast: [[96, -158], [93, -171], [94, -151], [83, -128], [83, -115], [79, -111], [83, -117], [67, -177], [70, -185], [82, -176], [94, -163], [96, -158]], cast2: [[86, -159], [85, -162], [53, -156], [53, -156], [77, -187], [66, -149], [48, -145], [46, -148], [75, -153], [85, -170], [86, -165], [85, -158]] };
function lordSD() { return STYLE === '3d' && ['idle', 'hit', 'cast', 'cast2'].every(k => need('ld5_' + k)); }
function drawLord2D(L) {   /* 2D 지배자: 작은 마법 = 지팡이 내지르기(윗몸 앞으로) · 대마법 = 뒤로 젖히며 떠오름 · 평소 숨쉬기 */
  if (STYLE !== '2d' || !need('d2_lord')) return false;
  if (L.c2T > 0) L.c2T -= 1 / 60;
  const casting = S.phase === 'cast' || S.phase === 'prompt', st2 = casting ? 'cast' : L.c2T > 0 ? 'attack' : 'idle', kk = casting ? Math.max(0.5, Math.min(1, (S.cast || 0) / 0.6)) : L.c2T > 0 ? 1 - L.c2T / 0.9 : 0;
  ctx.translate(55, 0); const vl = JB.vipLv(st), pf = ctx.filter;
  ctx.filter = vl >= 10 ? 'sepia(.35) saturate(1.4) brightness(1.15)' : vl >= 9 ? 'hue-rotate(-70deg) brightness(1.1)' : vl >= 6 ? 'hue-rotate(55deg) saturate(1.5)' : vl >= 5 ? 'saturate(1.5) contrast(1.15)' : vl >= 3 ? 'hue-rotate(45deg) saturate(1.2)' : 'none'; if (STYLE0 === 'hq') ctx.filter = (ctx.filter === 'none' ? '' : ctx.filter + ' ') + 'brightness(1.5) contrast(1.1) drop-shadow(0 0 3px rgba(200,130,255,.95))';
  puppet(ART.d2_lord, STYLE0 === 'hq' ? 330 : 300, { flip: true, cut: 0.55, st: st2, k: kk }); ctx.filter = pf;
  const ox = 70, oy = -230 + (st2 === 'attack' ? Math.sin(kk * Math.PI) * 20 : 0), tier = Math.min(5, Math.floor((st.up.magic || 0) / 10)), fl = st2 === 'attack' && kk > 0.3 && kk < 0.7 ? 1 : casting ? 0.6 + 0.4 * Math.sin(S.t * 14) : 0, rr = 16 + tier * 5 + fl * 30 + Math.sin(S.t * 4) * 3;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const og = ctx.createRadialGradient(ox, oy, 1, ox, oy, rr); og.addColorStop(0, `rgba(255,230,255,${0.45 + fl * 0.4})`); og.addColorStop(0.35, `rgba(230,90,255,${0.3 + fl * 0.3})`); og.addColorStop(1, 'rgba(160,40,255,0)'); ctx.fillStyle = og; ctx.fillRect(ox - rr, oy - rr, rr * 2, rr * 2); ctx.restore();
  return true;
}
function drawLordSD(L) {
  if (!lordSD()) return false;
  if (L.c2T > 0) L.c2T -= 1 / 60; if (L.hitT > 0) L.hitT -= 1 / 60;
  let an = 'idle', fi;
  if (S.phase === 'cast' || S.phase === 'prompt') { an = 'cast'; fi = S.phase === 'prompt' ? Math.floor(S.t * 6) % 2 : clamp(Math.floor(Math.max(0, S.cast) / 0.16), 0, 5); }   /* 대마법 누르기 전(prompt)엔 S.cast가 -1이라 그림이 통째로 사라졌음 → 모으는 첫 자세로 숨 쉬듯 */
  else if (L.c2T > 0) { an = 'cast2'; fi = Math.min(11, Math.floor((1 - L.c2T / 0.9) * 12)); }
  else if (L.hitT > 0) { an = 'hit'; fi = Math.min(11, Math.floor((1 - L.hitT / 0.5) * 12)); }
  else if (L.raise > 0.05 && !(LM.pose > 0)) { an = 'cast'; fi = 6 + Math.min(5, Math.floor((1 - L.raise) * 6)); }
  else fi = Math.floor((S.t / 2.4) * 12) % 12;
  fi = clamp(fi | 0, 0, 11);
  ctx.translate(LD5.dx, 0); const k = LD5.h / LD5.hpx, vl = JB.vipLv(st), pf = ctx.filter;   /* SD 그림은 좁아서 화면 왼쪽 끝에 반쯤 잘렸음 → 안쪽으로 */
  ctx.filter = vl >= 10 ? 'sepia(.35) saturate(1.4) brightness(1.18)' : vl >= 9 ? 'hue-rotate(-70deg) brightness(1.1) saturate(1.2)' : vl >= 6 ? 'hue-rotate(55deg) saturate(1.5) brightness(1.05)' : vl >= 5 ? 'brightness(.92) saturate(1.5) contrast(1.15)' : vl >= 3 ? 'hue-rotate(45deg) saturate(1.2)' : 'brightness(1.12) saturate(1.2) contrast(1.1) drop-shadow(0 0 1.2px #12051e) drop-shadow(0 0 1.2px #12051e)';   /* 귀빈 옷 단계는 색으로(3 핏빛 · 5 심연 · 6 진홍 · 9 푸른 망령 · 10 금빛) */
  ctx.drawImage(ART['ld5_' + an], fi * LD5.cw, 0, LD5.cw, LD5.ch, -LD5.ax * k, -LD5.ay * k, LD5.cw * k, LD5.ch * k); ctx.filter = pf;
  const ob = (LD5_ORB[an] || LD5_ORB.idle), o = ob[Math.min(ob.length - 1, fi)] || ob[0], ox = o[0] * k, oy = o[1] * k, tier = Math.min(5, Math.floor((st.up.magic || 0) / 10));
  const fl = an === 'cast2' && fi >= 3 && fi <= 6 ? 1 : an === 'cast' ? 0.6 + 0.4 * Math.sin(S.t * 14) : 0, rr = 16 + tier * 5 + fl * 30 + Math.sin(S.t * 4) * 3;   /* 지팡이 구슬: 지팡이 등급이 오를수록 커지고, 내지를 때 번쩍 */
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const og = ctx.createRadialGradient(ox, oy, 1, ox, oy, rr); og.addColorStop(0, `rgba(255,230,255,${0.55 + fl * 0.4})`); og.addColorStop(0.35, `rgba(230,90,255,${0.35 + fl * 0.3})`); og.addColorStop(1, 'rgba(160,40,255,0)'); ctx.fillStyle = og; ctx.fillRect(ox - rr, oy - rr, rr * 2, rr * 2);
  if (fl >= 1) { ctx.strokeStyle = 'rgba(255,200,255,.8)'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { const a = i * 1.047 + S.t * 3; ctx.beginPath(); ctx.moveTo(ox + Math.cos(a) * 10, oy + Math.sin(a) * 10); ctx.lineTo(ox + Math.cos(a) * (rr + 14), oy + Math.sin(a) * (rr + 14)); ctx.stroke(); } }
  ctx.restore();
  return true;
}
/* 11-14 16:45 「움직임이 완전 자연스러워야」: ③ 예전 개선은 지배자를 드리미나 영상(우리 그림을 그대로 움직임)에서 뽑은 장면으로.
   대기 = 망토가 바람에 날리고 숨 쉼(12장 앞뒤로), 작은 마법 = 지팡이를 치켜드는 앞부분, 대마법 = 지팡이를 높이 들고 보랏빛 소용돌이 */
/* 지배자 영상 장면(11-14 17:30 촘촘하게): 대기 30장(5초 한 바퀴) · 영창 24장(지팡이 치켜듦 → 구슬 → 소용돌이) */
function drawLordV(L) {   /* 03:10 지배자 영상: 평소 숨쉬기 · 마법 쓸 때(L.poke · 대마법 영창 L.raise) 지팡이 내질러 빛줄기 */
  if (!window.LORDV_OK) return false;   /* 09:58 대표님 「지배자 공격 이상 · 그림 잘림 · 안 맞음」: 이 영상 줄그림을 한 칸씩 꺼내 보니 대기엔 지팡이가 없고, 공격 칸은 팔 끝이 칸 끝에서 세로로 잘리고 초록 얼룩까지 → 안 씀(새 영상이 오기 전까지 깨끗한 그림 A + 움직임) */
  const M = VS.lordv; if (!M || !need('lordv_idle') || !need('lordv_attack') || JB.vipLv(st) >= 5) return false;
  if ((L.shotT > 0.2 || L.raise > 0.6) && !(L.vA > 0)) L.vA = 0.9; if (L.vA > 0) L.vA -= 1 / 60; const at = L.vA > 0;
  const NI = M.n.idle, q = (S.t * 8) % (2 * NI - 2), fi = at ? (1 - L.vA / 0.9) * (M.n.attack - 1) : (q < NI ? q : 2 * NI - 2 - q);
  ctx.save(); ctx.translate(10, 34); vsDraw('lordv', at ? 'attack' : 'idle', fi, 330 * (window.LVK || 1), st.lskin && typeof LSF !== 'undefined' && LSF[st.lskin] ? LSF[st.lskin] : '', 0, false); ctx.restore(); return true;
}
function drawLordA(L) {   /* 01:58 그림체 A 지배자: 숨쉬기 · 영창 때 뒤로 젖히며 커짐 · 작은 마법 때 앞으로 쿡 */
  const im = need('lordA'); if (!im) return false; const vl = JB.vipLv(st); if (vl >= 5) return false;
  if (L.shotT > 0) L.shotT = Math.max(0, L.shotT - 1 / 60);
  const sp = L.shotT > 0 ? 1 - L.shotT / 0.28 : 1, at = sp < 1 ? (sp < 0.3 ? -sp / 0.3 * 0.4 : sp < 0.45 ? -0.4 + 1.4 * (sp - 0.3) / 0.15 : (1 - (sp - 0.45) / 0.55)) : 0;   /* 09:58 기본 공격: 살짝 뒤로 젖혀 모았다(0.08초) → 앞으로 쿡 내밀며 지팡이 구슬에서 발사 → 천천히 돌아옴 */
  const br = 1 + 0.016 * Math.sin(S.t * 2.2), r = L.raise || 0, pk = Math.max(L.poke > 0 ? Math.sin(Math.min(1, L.poke / 0.25) * Math.PI) : 0, at), h = 330 * (1 + 0.05 * r), w = h * im.width / im.height;
  const LW = need('lordw_attack'); if (LW && L.shotT > 0.2 && !(L.wA > 0) && r < 0.05 && (LM.bN || 0) % 2 === 0) L.wA = 0.6;   /* 두 번에 한 번만 크게 내지름(작게 쿡 → 크게 쭉, 박자) — 0.85초마다 큰 번쩍이면 화면이 덮임 */ if (L.wA > 0) L.wA -= 1 / 60;
  if (LW && L.wA > 0) {   /* 영상 내지르기 0.6초: 모음 → 앞으로 쭉 내질러 보석 번쩍 → 돌아옴, 끝 2장은 정지 그림과 섞어 이음 */
    const fi = (1 - L.wA / 0.6) * 15, pf = ctx.filter; L.pkx = 0; ctx.save(); ctx.translate(10, 34);
    if (fi < 14) vsDraw('lordw', 'attack', fi, 330, st.lskin && typeof LSF !== 'undefined' && LSF[st.lskin] ? LSF[st.lskin] : '', 0, false);
    else ctx.drawImage(im, -w / 2, -h, w, h);   /* 11-15 눈 확인(1판 0.12초 간격 12장): 끝 장면을 정지 그림과 반투명으로 섞어 지배자 머리가 둘로 보였음 → 섞지 않고 정지 그림으로 바로 돌아옴 */
    ctx.restore(); ctx.filter = pf; return true; }
  L.pkx = pk * 37 - r * 20; ctx.save(); ctx.translate(10 + pk * 16, 34); ctx.rotate(-0.07 * r + 0.07 * pk);   /* 보석이 몸과 함께 움직인 만큼 → LM.staff()가 따라감 */ ctx.scale(1 / Math.sqrt(br), br);
  const pf = ctx.filter; if (st.lskin && typeof LSF !== 'undefined' && LSF[st.lskin]) ctx.filter = LSF[st.lskin] + `drop-shadow(0 0 4px rgba(${LSG[st.lskin]},.9))`; else ctx.filter = `drop-shadow(0 0 ${3 + r * 6}px rgba(200,140,255,${0.6 + r * 0.4}))`;
  ctx.drawImage(im, -w / 2, -h, w, h); ctx.filter = pf; ctx.restore(); return true;
}
function drawLordVid(L) {
  if (!vsOk('ld')) return false;
  if (L.c2T > 0) L.c2T -= 1 / 60;
  let an = 'idle', fi, loop = false;
  if (S.phase === 'cast' || S.phase === 'prompt') { an = 'cast'; const c = S.phase === 'prompt' ? 0.4 : Math.max(0, S.cast); fi = c < 1.4 ? c / 1.4 * 19 : 21 + Math.sin(S.t * 2.4) * 2; }   /* 다 모은 뒤엔 마지막 몇 장을 천천히 오감(소용돌이 숨쉬기) */
  else if (L.c2T > 0) { an = 'cast'; const p = 1 - L.c2T / 0.9; fi = (p < 0.5 ? p * 2 : (1 - p) * 2) * 13; }
  else { fi = vsIdle(0, 5, 30); loop = true; }
  const vl = JB.vipLv(st);
  const LSF = { blood: 'hue-rotate(80deg) saturate(1.4) ', frost: 'hue-rotate(-60deg) saturate(1.1) brightness(1.1) ', plague: 'hue-rotate(-165deg) saturate(1.3) ', shadow: 'grayscale(.75) contrast(1.25) brightness(.9) ', gold: 'sepia(.7) saturate(2.2) hue-rotate(-12deg) brightness(1.1) ' }, LSG = { blood: '255,70,90', frost: '120,200,255', plague: '110,255,140', shadow: '220,220,240', gold: '255,210,90' };   /* 23:00 지배자 겉모습 */
  const filt = st.lskin && LSF[st.lskin] ? LSF[st.lskin] + `brightness(1.1) contrast(1.06) drop-shadow(0 0 4px rgba(${LSG[st.lskin]},.95))` : (vl >= 10 ? 'sepia(.35) saturate(1.4) ' : vl >= 9 ? 'hue-rotate(-70deg) ' : vl >= 6 ? 'hue-rotate(55deg) saturate(1.4) ' : vl >= 3 ? 'hue-rotate(40deg) ' : '') + 'brightness(1.12) contrast(1.06) drop-shadow(0 0 3px rgba(190,120,255,.85))';
  if (an === 'cast' && !vsOk('lc')) { an = 'idle'; fi = vsIdle(0, 5, 30); loop = true; }
  if (L.shotT > 0) L.shotT = Math.max(0, L.shotT - 1 / 60);
  const sp = L.shotT > 0 && an !== 'cast' ? Math.sin((1 - L.shotT / 0.28) * Math.PI) : 0;   /* 19:02 기본 공격: 지팡이를 앞으로 내지르듯 몸을 살짝 숙였다 돌아옴 */
  ctx.save(); ctx.translate(26 + sp * 6, 34); if (sp) ctx.rotate(sp * 0.05); vsDraw(an === 'cast' ? 'lc' : 'ld', an, fi, 385 * LSC(), filt, 0, loop);
  if (sp > 0.05) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = sp * 0.35; vsDraw(an === 'cast' ? 'lc' : 'ld', an, fi, 385 * LSC(), 'brightness(1.6) sepia(1) hue-rotate(220deg) saturate(3)', 0, loop); }
  ctx.restore();
  return true;
}
function drawLord() {
  const L = S.lord, x = 196 + LDX(), y = 560 + Math.sin(S.t * 1.6) * 4;
  ctx.save(); ctx.translate(x, y);
  // 기운
  // 칭호가 오를수록 기운이 커지고 진해짐(0~5), 해골 군주부터 왕관 빛, 불사의 왕부터 떠도는 영혼 구슬
  const rk = typeof st !== 'undefined' && st ? Math.min(5, st.awakens <= 0 ? 0 : 1 + Math.floor((st.awakens - 1) / 3)) : 0;
  const ag = ctx.createRadialGradient(0, -120, 10, 0, -120, 190 + rk * 28 + L.glow * 80); ag.addColorStop(0, `rgba(${140 + rk * 10},${70 - rk * 6},255,${0.25 + rk * 0.06 + L.glow * 0.35})`); ag.addColorStop(1, 'rgba(140,70,255,0)');
  ctx.fillStyle = ag; ctx.fillRect(-340, -420, 680, 560);
  if (rk >= 2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const cg = ctx.createRadialGradient(18, -282, 2, 18, -282, 34 + rk * 7); cg.addColorStop(0, `rgba(255,220,130,${0.25 + rk * 0.08 + 0.1 * Math.sin(S.t * 3)})`); cg.addColorStop(1, 'rgba(255,200,90,0)'); ctx.fillStyle = cg; ctx.fillRect(-72, -372, 180, 180); ctx.restore(); }
  if (rk >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 2 + rk; i++) { const a = S.t * 0.9 + i * 6.283 / (2 + rk), ox = Math.cos(a) * 95, oy = -170 + Math.sin(a) * 40; const og = ctx.createRadialGradient(ox, oy, 1, ox, oy, 14); og.addColorStop(0, 'rgba(210,180,255,.95)'); og.addColorStop(1, 'rgba(150,90,255,0)'); ctx.fillStyle = og; ctx.fillRect(ox - 14, oy - 14, 28, 28); } ctx.restore(); }
  if (ART.lord) {   // 그림 버전: 지팡이를 들수록 살짝 커지고 보라빛이 진해짐
    if (L.raise > 0.02) {   /* 04:20 「마법도 움직임 자연스러워야」: 영창 때 발밑 마법진이 돌고, 몸이 떠오르며 뒤로 젖혀졌다가, 빛 알갱이가 솟음 */
      const r = L.raise; ctx.save(); ctx.scale(1, 0.32); ctx.globalCompositeOperation = 'lighter';
      for (const [rad, sp, al] of [[150, 0.6, 0.55], [112, -0.9, 0.45], [72, 1.4, 0.4]]) { ctx.save(); ctx.rotate(S.t * sp); ctx.strokeStyle = `rgba(190,130,255,${al * r})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, rad * (0.6 + 0.4 * r), 0, 7); ctx.stroke(); for (let i = 0; i < 8; i++) { const a = i * 0.785; ctx.fillStyle = `rgba(230,200,255,${al * r})`; ctx.fillRect(Math.cos(a) * rad * (0.6 + 0.4 * r) - 4, Math.sin(a) * rad * (0.6 + 0.4 * r) - 4, 8, 8); } ctx.restore(); }
      const cg = ctx.createRadialGradient(0, 0, 4, 0, 0, 170); cg.addColorStop(0, `rgba(170,90,255,${0.45 * r})`); cg.addColorStop(1, 'rgba(120,40,220,0)'); ctx.fillStyle = cg; ctx.fillRect(-180, -180, 360, 360); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 14; i++) { const ph = (S.t * 0.7 + i * 0.137) % 1, px = Math.sin(i * 12.9) * 120, py = -ph * 330; ctx.globalAlpha = r * Math.sin(ph * Math.PI) * 0.9; ctx.fillStyle = i % 3 ? '#c9a2ff' : '#ffffff'; ctx.beginPath(); ctx.arc(px + Math.sin(S.t * 3 + i) * 8, py, 2 + (i % 4), 0, 7); ctx.fill(); } ctx.restore();
      ctx.translate(0, -16 * r); ctx.rotate(-0.06 * r * (1 + 0.3 * Math.sin(S.t * 6)));
    }
    if (!drawLordV(L) && !drawLordA(L) && !drawLordVid(L) && !drawLord2D(L) && !drawLordSD(L)) {
    const k = 1 + 0.05 * L.raise; ctx.save(); ctx.scale(k, k); const vl = JB.vipLv(st), vipArt = vl >= 10 ? need('lord_v10') || need('lord_vip') : vl >= 9 ? need('lord_v9') || need('lord_vip') : vl >= 6 ? need('lord_v6') || need('lord_vip') : vl >= 5 ? need('lord_vip') : null;   /* 귀빈 옷 단계(21:40): 5 「심연의 왕관」 · 6 핏빛 · 9 푸른 망령 · 10 상아빛 금 */
    const la = vipArt || need('lordA') || (vl >= 3 && need('lord_v3')) || (artName('lord') !== 'lord' && need('lord_a')) || ART.lord;   /* 01:50 그림체 A 지배자 */   /* 귀빈 3: 핏빛 로브(기본 그림과 같은 짜임이라 지팡이 등급 그림도 그대로) */ { const pf0 = ctx.filter; if (STYLE === 'old') { const br = 1 + 0.012 * Math.sin(S.t * 2.2); ctx.translate(0, 34); ctx.scale(1 / br, br); ctx.translate(0, -34); ctx.filter = `brightness(${1.3 + L.raise * 0.25}) contrast(1.12) drop-shadow(0 0 3px rgba(200,140,255,${0.8 + L.raise * 0.2})) drop-shadow(0 0 1px #000)`; } drawArt(la, vipArt ? 40 : la === ART.lordA ? 10 : 0, 34, vipArt ? 385 : la === ART.lordA ? 330 : 370, false); ctx.filter = pf0; }   /* ③ 개선: 숨쉬기 + 보랏빛 테두리, 주문 때 더 밝게 */
    { const at = vipArt ? STAFF_VIP : STAFF_AT, tier = Math.min(5, Math.floor((st.up.magic || 0) / 10)), sp = need('st_' + tier); if (sp && (vipArt || la === ART.lord || la === ART.lord_v3)) { const h = at.h, w = h * sp.width / sp.height; ctx.save(); ctx.translate(at.x, at.y); ctx.rotate(at.r); ctx.drawImage(sp, -w / 2, -h, w, h); ctx.restore(); } }   /* 귀빈 옷이어도 주력 지팡이는 등급 그림으로(21:45: 귀빈 5부터 지팡이가 사라졌었음) */   /* 지팡이 등급 그림(나무 · 뼈 · 은 · 금 · 심연 · 왕)을 원래 그림의 지팡이 위에 덮어 그림 */
    ctx.restore(); }
    if (L.glow > 0.05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * L.glow; const gg = ctx.createRadialGradient(0, -200, 5, 0, -200, 160); gg.addColorStop(0, 'rgba(190,140,255,1)'); gg.addColorStop(1, 'rgba(120,40,220,0)'); ctx.fillStyle = gg; ctx.fillRect(-200, -380, 400, 360); ctx.restore(); }
    ctx.restore(); return;
  }
  // 망토
  ctx.fillStyle = '#12081d'; ctx.beginPath(); ctx.moveTo(-34, -190); ctx.quadraticCurveTo(-110 - Math.sin(S.t * 2) * 8, -60, -95, 30); ctx.lineTo(85, 30); ctx.quadraticCurveTo(95, -80, 34, -190); ctx.fill();
  // 옷
  const rg = ctx.createLinearGradient(-50, -200, 50, 30); rg.addColorStop(0, '#2b1446'); rg.addColorStop(1, '#0d0616');
  ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(-30, -200); ctx.lineTo(30, -200); ctx.lineTo(62, 30); ctx.lineTo(-62, 30); ctx.fill();
  ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -200); ctx.lineTo(0, 30); ctx.stroke();
  ctx.strokeStyle = '#8a5cff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-62, 28); ctx.lineTo(62, 28); ctx.stroke();
  // 어깨 장식
  ctx.fillStyle = '#c9a24a'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 18, -200); ctx.lineTo(sx * 58, -214); ctx.lineTo(sx * 48, -186); ctx.fill(); }
  // 지팡이 팔
  const ra = -0.25 - L.raise * 1.05; ctx.save(); ctx.translate(36, -170); ctx.rotate(ra);
  ctx.strokeStyle = '#1d0f2e'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 70); ctx.stroke();
  ctx.translate(0, 72); ctx.rotate(-ra * 0.9 - 0.15);
  ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(0, -150); ctx.stroke();
  ctx.strokeStyle = '#e2c46a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -168, 20, Math.PI * 0.15, Math.PI * 0.85, true); ctx.stroke();
  ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = '#b48cff'; ctx.shadowBlur = 25 + L.glow * 40;
  ctx.fillStyle = `rgba(190,150,255,${0.7 + L.glow * 0.3})`; ctx.beginPath(); ctx.moveTo(0, -192); ctx.lineTo(9, -170); ctx.lineTo(0, -150); ctx.lineTo(-9, -170); ctx.fill();
  ctx.restore();
  // 해골 얼굴과 관
  ctx.fillStyle = '#ece4d2'; ctx.beginPath(); ctx.arc(0, -226, 22, 0, 7); ctx.fill(); ctx.fillRect(-12, -216, 24, 16);
  ctx.fillStyle = '#100616'; ctx.beginPath(); ctx.arc(-8, -228, 6, 0, 7); ctx.arc(8, -228, 6, 0, 7); ctx.fill();
  ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = '#ff3b5c'; ctx.shadowBlur = 10 + L.glow * 30;
  ctx.fillStyle = '#ff4a6a'; ctx.beginPath(); ctx.arc(-7.5, -228, 2.4 + L.glow * 1.6, 0, 7); ctx.arc(8.5, -228, 2.4 + L.glow * 1.6, 0, 7); ctx.fill();
  ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0;
  ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.moveTo(-24, -240); for (let i = 0; i <= 6; i++) { const px = -24 + i * 8; ctx.lineTo(px, i % 2 ? -276 + Math.abs(3 - i) * 4 : -248); } ctx.lineTo(24, -240); ctx.fill();
  ctx.restore();
}
/* 망자 거인(부활한 지역의 주인): 군단 뒤에 반투명 초록으로 서 있음, 보스전엔 4초마다 내려찍기 */
function drawAlly() {
  if (!st || !st.dex) return; let r = -1; st.dex.l.forEach((v, i) => { if (v) r = i; }); if (r < 0) return;
  const al = S.ally && S.ally.r === r ? S.ally : (S.ally = { r, x: 340, t: 9 }); al.t += 1 / 60; al.x += (340 - al.x) * Math.min(1, 0.02);
  const art = r === 0 ? ART.giant : ART['lord_' + REGION_BG[r]] || ART.giant; if (!art) return;
  const boss = st.boss && S.giant.alpha > 0.5 && !S.giant.dead && S.phase === 'fight'; if (boss) { al.hitT = (al.hitT || 4) - 1 / 60; if (al.hitT <= 0) { al.hitT = 4; al.slam = 0.5; say(fmtD(JB.dps(st) * 2), S.giant.x - 60, 400, { size: 30, col: '#e6ffe9', glow: '#2bff8a', life: 1, vy: -50 }); S.shake = Math.max(S.shake, 5); } }
  al.slam = Math.max(0, (al.slam || 0) - 1 / 60);
  ctx.save(); ctx.globalAlpha = Math.min(0.42, al.t * 0.4); ctx.translate(al.x, 560); ctx.rotate(0.15 * Math.sin((al.slam / 0.5) * Math.PI)); ctx.scale(-1, 1);
  const h = 240, w = h * art.width / art.height; ctx.drawImage(tinted(art, 'ally' + r, 1, RISE_TINT), -w / 2, -h, w, h); ctx.restore(); ctx.globalAlpha = 1;
}
function drawRises() {   /* 11-15 일으켜라 한 번 = 땅이 갈라지며 뼈 손이 쑥 솟았다 가라앉음(0.8초) */
  if (!S.rises || !S.rises.length) return; const k = typeof WK === 'function' ? Math.min(WK(), 1.8) : 1;
  for (const r of S.rises) { r.t += 1 / 60; const p = r.t, up = p < 0.18 ? p / 0.18 : p < 0.5 ? 1 : Math.max(0, 1 - (p - 0.5) / 0.3), a = p < 0.6 ? 1 : Math.max(0, 1 - (p - 0.6) / 0.2);
    ctx.save(); ctx.translate(r.x, r.y); ctx.scale(k, k); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(30,18,10,.85)'; ctx.beginPath(); ctx.ellipse(0, 0, 34, 9, 0, 0, 7); ctx.fill();   /* 갈라진 흙 */
    ctx.strokeStyle = 'rgba(93,255,143,.9)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 5; i++) { const an = -0.3 - i * 0.6; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an) * 36, Math.sin(an) * 9 + 2); } ctx.stroke();
    const h = 58 * up; ctx.save(); ctx.beginPath(); ctx.rect(-40, -120, 80, 120); ctx.clip(); ctx.translate(0, -h + 6); ctx.rotate(Math.sin(p * 18) * 0.06);
    ctx.strokeStyle = '#efe6d2'; ctx.lineCap = 'round'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(0, 14); ctx.stroke();   /* 팔뼈 */
    ctx.lineWidth = 4; for (const [dx, dy] of [[-12, -16], [-5, -22], [3, -23], [10, -18], [15, -6]]) { ctx.beginPath(); ctx.moveTo(dx * 0.35, 8); ctx.lineTo(dx, dy); ctx.stroke(); }   /* 손가락 */
    ctx.restore();
    const g = ctx.createLinearGradient(0, -110, 0, 0); g.addColorStop(0, 'rgba(93,255,143,0)'); g.addColorStop(1, `rgba(93,255,143,${0.45 * a})`); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(-22, -110, 44, 110);   /* 초록 기둥 */
    ctx.restore(); }
  S.rises = S.rises.filter(r => r.t < 0.8);
}
function drawBossBar() {   /* 11-15 보스 머리 바로 위: 이름 · 남은 시간(막대 위) + 큰 체력 막대(안에 %) · 깎인 부분은 흰색으로 남았다 줄어듦 */
  const g = S.giant, b = st.boss; if (TRAILER || !b || !g.on || g.dead || g.alpha < 0.5 || !['fight', 'wait', 'cast'].includes(b.phase) || S.phase === 'cast') return;
  const v = clamp(st.hp / st.maxHp, 0, 1); g.hpG = g.hpG == null || g.hpG < v ? v : Math.max(v, g.hpG - 0.35 / 60);
  const k = Math.min(WK(), 2.4), w = 200 * k, hh = Math.round(13 * k), x0 = clamp(g.x - w / 2, VIS.x0 + 20, VIS.x1 - 70 * k - w), y0 = g.y - 372;
  ctx.save(); ctx.lineJoin = 'round'; ctx.font = `900 ${Math.round(14 * k)}px sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3.5 * k; ctx.strokeStyle = 'rgba(10,0,16,.92)';
  const nm = '☠ ' + L.boss.name(L.regions[regionOf(st.stage)], b.lord); ctx.strokeText(nm, x0, y0 - 5 * k); ctx.fillStyle = '#ffd0b0'; ctx.fillText(nm, x0, y0 - 5 * k);
  if (b.phase === 'fight') { const tt = '⏱ ' + L.boss.timer(Math.ceil(b.timer)); ctx.textAlign = 'right'; ctx.fillStyle = b.timer < 8 ? '#ff5a5a' : '#fff3c4'; ctx.strokeText(tt, x0 + w, y0 - 5 * k); ctx.fillText(tt, x0 + w, y0 - 5 * k); }
  ctx.fillStyle = 'rgba(8,0,14,.92)'; ctx.fillRect(x0 - 2 * k, y0 - 2 * k, w + 4 * k, hh + 4 * k); ctx.strokeStyle = '#ffb35a'; ctx.lineWidth = 1.5 * k; ctx.strokeRect(x0 - 2 * k, y0 - 2 * k, w + 4 * k, hh + 4 * k);
  ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(x0, y0, w * g.hpG, hh); const gr = ctx.createLinearGradient(x0, 0, x0 + w, 0); gr.addColorStop(0, '#ff3a2a'); gr.addColorStop(1, '#ff9d2a'); ctx.fillStyle = gr; ctx.fillRect(x0, y0, w * v, hh);
  const pc = v * 100, t2 = (pc >= 10 ? Math.round(pc) : pc.toFixed(1)) + '%'; ctx.font = `900 ${Math.round(11 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3 * k; ctx.strokeText(t2, x0 + w / 2, y0 + hh / 2 + 0.5); ctx.fillStyle = '#fff'; ctx.fillText(t2, x0 + w / 2, y0 + hh / 2 + 0.5);
  ctx.restore();
}
function drawGiant() {
  const g = S.giant; if (g.alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = g.alpha; ctx.translate(g.x, g.y); ctx.filter = regionFilter();
  // 지역의 주인(10판마다): 지역 전용 거인 그림이 있으면 그것(색상 돌리기 없이), 없으면 기본 거인 + 지역 색상
  const lordArt = st && st.boss && st.boss.lord && REGION_BG[regionOf(st.stage)] ? ART['lord_' + REGION_BG[regionOf(st.stage)]] : null;
  if (lordArt) ctx.filter = 'none';
  const GV = VS.foev4 && need('foev4_idle') && need('foev4_attack');
  if (GV && g.dead) {   /* 11-16 #12 새 그림 보스 쓰러짐: 옛 그림(foeA4)으로 바뀌던 것 → 새 띠 첫 장을 뒤로 넘어뜨리며 흐려짐(그 자리에서 망자 거인으로 일어남 — thrall.js) */
    g.dT = (g.dT || 0) + 1 / 60; const k = Math.min(1, g.dT / 0.9); ctx.filter = 'none'; ctx.globalAlpha = g.alpha * (g.dT < 1.2 ? 1 : Math.max(0, 1 - (g.dT - 1.2) / 0.5)); ctx.rotate(0.85 * ease(k)); vsDraw('foev4', 'idle', 0, 400, 'brightness(0.75) saturate(0.6)', 0, false);
    ctx.restore(); ctx.globalAlpha = 1; return;
  }
  if (GV && !g.dead) {   /* 03:20 보스 영상: 힘 모으기 = 망치 치켜듦(공격 앞 절반) → 내려찍기(뒤 절반) · 평소 숨쉬기 */
    ctx.filter = 'none'; const M = VS.foev4; let an = 'idle', fi = (n => { const q = (S.t * 8) % (2 * n - 2); return q < n ? q : 2 * n - 2 - q; })(M.n.idle);
    if (g.wind > 0) { an = 'attack'; fi = (1 - g.wind / GWIND) * 11; } else if (g.slam > 0) { an = 'attack'; fi = 11 + (1 - g.slam / 0.6) * (M.n.attack - 12); } else if (g.raise > 0.15) { an = 'attack'; fi = Math.min(1, g.raise * 1.5) * 10; }
    if (g.rage > 0) { ctx.shadowColor = `rgba(255,60,30,${0.9 * g.rage})`; ctx.shadowBlur = 40 * g.rage * (0.75 + 0.25 * Math.sin(S.t * 9)); }
    vsDraw('foev4', an, fi, 400, '', 0, false);
    if (g.hitFl > 0) { g.hitFl -= 1 / 60; ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, g.hitFl * 4); vsDraw('foev4', an, fi, 400, 'brightness(2) saturate(0)', 0, false); }
    ctx.restore(); ctx.globalAlpha = 1; return;
  }
  const GA = need('foeA4');
  if (GA) {   /* 02:10 그림체 A 보스(황금 성기사): 힘 모으기 = 뒤로 젖히며 커짐 → 내려찍기 = 앞으로 확 숙임(딱) → 제자리 · 쓰러짐 */
    ctx.filter = 'none'; let rot = 0, sq = 1, dx = 0; const br = 1 + Math.sin(S.t * 2) * 0.015;
    if (g.dead) { g.dT = (g.dT || 0) + 1 / 60; rot = -Math.min(1, g.dT / 1.2) * 0.9; }
    else if (g.wind > 0) { const k = 1 - g.wind / GWIND; rot = 0.16 * ease(k); sq = 1 + 0.06 * k; dx = 10 * k; }
    else if (g.slam > 0) { const p = 1 - g.slam / 0.6; if (p < 0.18) { const q = p / 0.18; rot = 0.16 - 0.42 * q; dx = 10 - 40 * q; } else if (p < 0.45) { rot = -0.26; dx = -30; } else { const q = (p - 0.45) / 0.55; rot = -0.26 * (1 - q); dx = -30 * (1 - q); } }
    else if (g.raise > 0.15) { rot = 0.12 * Math.min(1, g.raise * 1.5); }
    if (g.rage > 0) { ctx.shadowColor = `rgba(255,60,30,${0.9 * g.rage})`; ctx.shadowBlur = 40 * g.rage * (0.75 + 0.25 * Math.sin(S.t * 9)); }
    const h = 400 * sq, w = h * GA.width / GA.height; ctx.translate(dx, 0); ctx.rotate(rot); ctx.scale(1 / Math.sqrt(br), br); ctx.drawImage(GA, -w * 0.55, -h, w, h);
    if (g.hitFl > 0) { g.hitFl -= 1 / 60; ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, g.hitFl * 4); ctx.filter = 'brightness(2) saturate(0)'; ctx.drawImage(GA, -w * 0.55, -h, w, h); ctx.filter = 'none'; }
    ctx.restore(); ctx.globalAlpha = 1; return;
  }
  if (!lordArt && vsOk('gv')) {   /* 영상 장면 거인(11-14 17:30): 힘 모으기 = 망치를 머리 위로(0.55초) → 내려찍기(앞으로 숙이며 아래로) → 영상의 「다시 어깨에 메기」 */
    ctx.filter = 'none'; let an = 'idle', fi = vsIdle(0.3, 5), rot = 0, loop = true;
    if (g.dead) { g.dT = (g.dT || 0) + 1 / 60; rot = Math.min(1, g.dT / 1.4) * 0.5; }
    else if (g.wind > 0) { const k = 1 - g.wind / GWIND; an = 'raise'; loop = false; fi = ease(k) * 11; }   /* 힘 모으기: 망치를 머리 위로 */
    else if (g.slam > 0) { const p = 1 - g.slam / 0.6; loop = false; if (p < 0.22) { an = 'slam'; fi = p / 0.22 * 7; } else if (p < 0.45) { an = 'slam'; fi = 7; } else { an = 'rec'; fi = (p - 0.45) / 0.55 * 11; } }   /* 쾅 → 잠깐 멈춤 → 다시 어깨에 */
    else if (g.raise > 0.15) { an = 'raise'; loop = false; fi = Math.min(1, g.raise * 1.5) * 11; }   /* 지역 기술 외칠 때 망치 치켜듦 */
    else if (S.warn && S.warn.t < 2.2) { an = 'raise'; loop = false; fi = Math.min(1, (2.2 - S.warn.t) / 1.2) * 6; }
    if (g.rage > 0) { ctx.shadowColor = `rgba(255,30,20,${0.85 * g.rage})`; ctx.shadowBlur = 40 * g.rage * (0.75 + 0.25 * Math.sin(S.t * 9)); }
    vsDraw('gv', an, fi, 360, 'brightness(1.12) contrast(1.06) drop-shadow(0 0 3px rgba(255,120,80,.8))', rot, loop);
    if (g.hitFl > 0) { g.hitFl -= 1 / 60; ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, g.hitFl * 4); vsDraw('gv', an, fi, 360, 'brightness(2) saturate(0)', rot, loop); ctx.globalCompositeOperation = 'source-over'; }   /* 19:02 맞는 순간 하얗게 */
    ctx.restore(); ctx.globalAlpha = 1; return;
  }
  if (STYLE0 === '2d' && !lordArt && need('d2_giant')) {   /* 2D 거인: 내려찍기 = 윗몸 젖혔다 앞으로, 포효 = 뒤로 젖힘, 맞기 · 쓰러짐 */
    ctx.filter = 'none'; const mv = g.px === undefined ? 0 : Math.abs(g.x - g.px); g.px = g.x; g.wa = lerp(g.wa || 0, mv > 0.3 ? 1 : 0, 0.15);
    let st2 = 'idle', kk = 0; if (g.dead) { g.dT = (g.dT || 0) + 1 / 60; st2 = 'die'; kk = g.dT / 1.6; } else if (g.slam > 0) { st2 = 'attack'; kk = 0.3 + (1 - g.slam / 0.6) * 0.6; } else if (S.phase === 'cast' && S.castInfo && S.castInfo.landed) { st2 = 'hit'; g.hT = (g.hT || 0) + 1 / 60; kk = Math.min(1, g.hT); } else if (g.raise > 0.25 || (S.warn && S.warn.t < 2.2)) { st2 = 'cast'; kk = 1; } else if (g.wa > 0.1) { st2 = 'walk'; }
    if (g.rage > 0) { ctx.shadowColor = `rgba(255,30,20,${0.85 * g.rage})`; ctx.shadowBlur = 40 * g.rage * (0.75 + 0.25 * Math.sin(S.t * 9)); }
    puppet(ART.d2_giant, 360, { flip: false, cut: 0.52, slash: '#ff8a5a', st: st2, k: kk, wph: S.t * 5 });
    ctx.restore(); ctx.globalAlpha = 1; return;
  }
  if (!lordArt && !window.BACKVIEW.giant && ['walk', 'idle', 'attack', 'hit', 'roar', 'death'].every(k => need('gi_' + k))) {   /* 11-14 보스 거인 3D(Meshy): 걷기 · 대기 · 망치 휘두르기 · 맞기 · 포효(가슴 치기) · 쓰러짐 */
    const mv = g.px === undefined ? 0 : Math.abs(g.x - g.px); g.px = g.x; g.wa = lerp(g.wa || 0, mv > 0.3 ? 1 : 0, 0.15);
    let an = 'idle', fi = Math.floor(((S.t * 0.9) % 1) * 12);
    if (g.dead) { g.dT = (g.dT || 0) + 1 / 60; an = 'death'; fi = Math.min(11, Math.floor(g.dT / 1.6 * 11)); }
    else if (g.slam > 0) { an = 'attack'; fi = 5 + Math.min(6, Math.floor((1 - g.slam / 0.6) * 7)); }
    else if (S.phase === 'cast' && S.castInfo && S.castInfo.landed) { an = 'hit'; g.hT = (g.hT || 0) + 1 / 60; fi = Math.min(11, Math.floor(g.hT / 1.0 * 11)); }
    else if (g.raise > 0.25 || (S.warn && S.warn.t < 2.2)) { an = 'roar'; fi = 4 + Math.floor((S.t * 6) % 4); }
    else if (g.wa > 0.1) { an = 'walk'; fi = Math.floor(((S.t / 1.03) % 1) * 12); }
    if (!(S.phase === 'cast')) g.hT = 0; if (!g.dead) g.dT = 0;
    const M = GI, h = 370, k = h / M.hpx; ctx.filter = 'brightness(1.3) contrast(1.08) saturate(1.15) drop-shadow(0 0 5px rgba(255,90,60,.75))';
    if (g.rage > 0) { ctx.shadowColor = `rgba(255,30,20,${0.85 * g.rage})`; ctx.shadowBlur = 40 * g.rage * (0.75 + 0.25 * Math.sin(S.t * 9)); }
    ctx.drawImage(ART['gi_' + an], fi * M.cw, 0, M.cw, M.ch, -M.ax * k, -M.ay * k, M.cw * k, M.ch * k);
    ctx.restore(); ctx.globalAlpha = 1; return;
  }
  if (ART.giant) {   // 그림 버전: 걸을 때 출렁, 내려찍을 때 앞으로 숙임, 힘 모을 때 가슴 빛
    ctx.save(); ctx.translate(0, Math.abs(Math.sin(g.walk)) * -8); ctx.rotate(-0.12 * g.raise + 0.18 * g.slam);
    if (g.rage > 0) { ctx.shadowColor = `rgba(255,30,20,${0.85 * g.rage})`; ctx.shadowBlur = 40 * g.rage * (0.75 + 0.25 * Math.sin(S.t * 9)); }   // 분노: 붉게 이글거림
    drawArt(lordArt || ART.giant, 0, 0, lordArt ? 520 : 480, false); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const core = ctx.createRadialGradient(0, -280, 4, 0, -280, 70 + g.charge * 60); core.addColorStop(0, `rgba(255,250,220,${0.25 + g.charge * 0.6})`); core.addColorStop(1, 'rgba(255,210,110,0)'); ctx.fillStyle = core; ctx.fillRect(-150, -420, 300, 300); ctx.restore();
    ctx.restore(); ctx.globalAlpha = 1; return;
  }
  const step = Math.sin(g.walk) * 10;
  // 후광
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,214,110,${0.35 + g.charge * 0.5})`; ctx.lineWidth = 6; ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(0, -390, 70 + g.charge * 10, 0, 7); ctx.stroke(); ctx.restore();
  const gold = ctx.createLinearGradient(-90, -380, 90, 0); gold.addColorStop(0, '#fff2bf'); gold.addColorStop(0.4, '#d9a93a'); gold.addColorStop(1, '#6b4a14');
  // 다리
  ctx.fillStyle = '#8a6a2a'; ctx.fillRect(-58, -150 + step, 44, 150 - step); ctx.fillRect(14, -150 - step, 44, 150 + step);
  ctx.fillStyle = gold; ctx.fillRect(-64, -40 + step * 0.2, 56, 40); ctx.fillRect(8, -40 - step * 0.2, 56, 40);
  // 몸통
  ctx.fillStyle = gold; ctx.beginPath(); ctx.moveTo(-95, -330); ctx.lineTo(95, -330); ctx.lineTo(70, -140); ctx.lineTo(-70, -140); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const core = ctx.createRadialGradient(0, -250, 4, 0, -250, 60 + g.charge * 30); core.addColorStop(0, 'rgba(255,255,240,.95)'); core.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = core; ctx.fillRect(-120, -340, 240, 200); ctx.restore();
  // 팔
  const armUp = g.raise * 2.3 + g.charge * 1.9 - g.slam * 0.4;
  for (const sxn of [-1, 1]) {
    ctx.save(); ctx.translate(sxn * 98, -310); ctx.rotate(sxn === 1 ? -armUp : 0.15);
    ctx.fillStyle = '#8a6a2a'; ctx.fillRect(-20, 0, 40, 150); ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(0, 160, 34, 0, 7); ctx.fill(); ctx.restore();
    ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(sxn * 98, -316, 42, 0, 7); ctx.fill();
  }
  // 머리
  ctx.fillStyle = gold; ctx.beginPath(); ctx.moveTo(-40, -330); ctx.lineTo(-44, -400); ctx.quadraticCurveTo(0, -440, 44, -400); ctx.lineTo(40, -330); ctx.fill();
  ctx.fillStyle = '#1b1206'; ctx.fillRect(-30, -392, 60, 12); ctx.fillRect(-5, -392, 10, 50);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 20 + g.charge * 30; ctx.fillStyle = '#fffbe8';
  ctx.fillRect(-26, -389, 18, 6); ctx.fillRect(8, -389, 18, 6); ctx.restore();
  ctx.restore(); ctx.globalAlpha = 1;
}
const RING_CACHE = {};
function ringSprite(r, col) {
  const key = r + col; if (RING_CACHE[key]) return RING_CACHE[key];
  const pad = 40, size = (r + pad) * 2, c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); g.translate(size / 2, size / 2); g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 18; g.lineCap = 'round';
  g.lineWidth = 4; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke();
  g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, r * 0.92, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.72, 0, 7); g.stroke();
  g.lineWidth = 2; g.beginPath(); const n = 7;
  for (let i = 0; i <= n; i++) { const a = (i * 3 % n) / n * Math.PI * 2; g.lineTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72); } g.stroke();
  g.lineWidth = 1.6; const cnt = Math.round(r / 9);
  for (let i = 0; i < cnt; i++) {
    const a = i / cnt * Math.PI * 2, gl = GLYPHS[i % GLYPHS.length]; g.save(); g.rotate(a); g.translate(0, -r * 0.82); const k = r * 0.045;
    g.beginPath(); for (const [x1, y1, x2, y2] of gl) { g.moveTo(x1 * k, y1 * k); g.lineTo(x2 * k, y2 * k); } g.stroke(); g.restore();
  }
  return RING_CACHE[key] = c;
}
function drawRing(cx, cy, r, rot, alpha, col, base) {
  const img = ringSprite(base, col), k = r / base, hs = img.width / 2 * k;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(img, -hs, -hs, hs * 2, hs * 2);
  ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
[250, 178, 110].forEach((r, i) => ringSprite(r, i === 1 ? '#ffd6ff' : '#b78bff'));
const FXN = { sun: 29, tide: 32, graves: 28, frozen: 32, bell: 32, slam: 25 }, FXC = { tide: 19, graves: 18, frozen: 19, bell: 25 };   /* 효과 줄그림 장수 · 터지는 장 */
const FXM = {};   /* 11-14 18:20 대표님 「마법 이미지 잘려 있고」: 효과 영상 한 장이 네모 끝에서 뚝 잘려 보이던 것 → 가장자리를 둥글게 흐리게 한 장을 한 번만 만들어 둠 */
function fxMasked(nm, k) { const key = nm + k; if (FXM[key]) return FXM[key]; const im = need('fx_' + nm); const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.drawImage(im, k * 256, 0, 256, 256, 0, 0, 256, 256); g.globalCompositeOperation = 'destination-in'; const rg = g.createRadialGradient(128, 128, 70, 128, 128, 128); rg.addColorStop(0, '#000'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, 256, 256); return (FXM[key] = c); }
function fxFrame(nm, k, x, y, size, a) { const im = need('fx_' + nm); if (!im || a <= 0) return; k = Math.max(0, Math.min(FXN[nm] - 1, k | 0)); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a); ctx.drawImage(fxMasked(nm, k), 0, 0, 256, 256, x - size / 2, y - size / 2, size, size); ctx.restore(); }
function drawFxSun() {   /* 11-14 대표님 「진짜 고퀄리티 · 아주 화려하게」: 드리미나 영상(씨댄스 2.0 Fast)에서 뽑은 대마법 효과 — 빛 겹치기 */
  if (S.phase !== 'cast' || !need('fx_' + st.spell)) return false;
  const c = S.cast, sp = st.spell;
  if (sp === 'sun') { const sn = S.sun;
    if (c > TC.r1 && !(sn && sn.hit)) { const p = clamp((c - TC.r1) / (TC.flash + 0.05 - TC.r1), 0, 1), out = sn ? 1 - (c - sn.born) / 0.5 : 1; fxFrame('sun', Math.min(19, p * 20), RC.x, RC.y, 620 * NS() * (0.9 + 0.1 * p), Math.min(1, (c - TC.r1) * 3) * out); }
    if (sn && sn.hit) { const t = c - (sn.hitT || c); if (20 + t / 0.11 <= 28.9) fxFrame('sun', 20 + t / 0.11, S.giant.x, S.giant.y - 230, (1150 + t * 300) * NS(), 1); }
    return true; }
  const peak = TC.flash + 0.6, cf = FXC[sp], n = FXN[sp]; if (c < TC.r1) return true;
  const k = c < peak ? (c - TC.r1) / (peak - TC.r1) * cf : cf + (c - peak) / 0.1; if (k > n - 0.01) return true;
  const gx = sp === 'tide' ? lerp(armyFront(), S.giant.x, 0.5) : S.giant.x - 60, gy = sp === 'graves' ? S.giant.y - 150 : S.giant.y - 230, size = (sp === 'tide' ? 820 : 740) * NS() * (k > cf ? 1 + (k - cf) * 0.015 : 1);
  fxFrame(sp, k, gx, gy, size, Math.min(1, (c - TC.r1) * 2.5));
  if (k > cf - 0.5 && k < cf + 3) { S.shake = Math.max(S.shake || 0, 9); }
  return true;
}
function drawElite() {   /* 11-14 지역 정예 효과: 불덩이 · 얼음 창 · 독구름 · 피 빨기 · 심연 문 · 서리 빛 */
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const b of S.fballs || []) { if (b.t < 0) continue; const k = Math.min(1, b.t / b.L), x = lerp(b.x, b.tx, k), y = lerp(b.y, b.ty - 30, k) - Math.sin(k * Math.PI) * (b.kind === 'fire' ? 220 : 60), fire = b.kind === 'fire';
    for (let j = 0; j < 7; j++) { const kk = Math.max(0, k - j * 0.035), xx = lerp(b.x, b.tx, kk), yy = lerp(b.y, b.ty - 30, kk) - Math.sin(kk * Math.PI) * (fire ? 220 : 60), r = (fire ? 26 : 14) * (1 - j * 0.12); const g = ctx.createRadialGradient(xx, yy, 1, xx, yy, r); const bl = b.kind === 'blood'; g.addColorStop(0, bl ? 'rgba(255,120,130,.9)' : fire ? 'rgba(255,240,180,.9)' : 'rgba(240,250,255,.95)'); g.addColorStop(0.5, bl ? 'rgba(200,10,30,.6)' : fire ? 'rgba(255,110,20,.6)' : 'rgba(120,200,255,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(xx - r, yy - r, r * 2, r * 2); }
    if (!fire) { ctx.strokeStyle = 'rgba(220,245,255,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 40, y - 12); ctx.lineTo(x - 8, y + 4); ctx.stroke(); }
    if (fire && Math.random() < 0.6) S.parts.push({ x, y, vx: rnd(-30, 30), vy: rnd(-60, 0), life: 0.5, age: 0, size: rnd(3, 6), col: '#ff8a2a', g: -40, add: true, kind: 'dot', rot: 0, vr: 0 }); }
  for (const c of S.clouds || []) { const a = Math.min(1, c.t / 0.4) * Math.max(0, Math.min(1, (c.L + 0.6 - c.t) / 0.6)); for (let j = 0; j < 6; j++) { const ox = Math.sin(S.t * 0.9 + j * 1.7) * 70, oy = Math.cos(S.t * 0.7 + j) * 18, r = 90 + 20 * Math.sin(S.t * 1.3 + j); const g = ctx.createRadialGradient(c.x + ox, c.y - 30 + oy, 4, c.x + ox, c.y - 30 + oy, r); g.addColorStop(0, `rgba(150,220,60,${0.28 * a})`); g.addColorStop(1, 'rgba(40,80,10,0)'); ctx.fillStyle = g; ctx.fillRect(c.x + ox - r, c.y - 30 + oy - r, r * 2, r * 2); } }
  for (const d of S.drains || []) { const k = d.t / 0.8; ctx.strokeStyle = `rgba(255,40,60,${0.8 * (1 - k)})`; ctx.lineWidth = 5; ctx.beginPath(); for (let j = 0; j <= 12; j++) { const u = j / 12, x = lerp(d.x, d.tx, u), y = lerp(d.y, d.ty, u) - Math.sin(u * Math.PI) * 60 + Math.sin(u * 14 + S.t * 20) * 6; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  for (const p of S.portals || []) { const k = p.t / 0.9, r = 70 * Math.sin(Math.min(1, k * 1.5) * Math.PI / 2) * (1 - Math.max(0, k - 0.7) / 0.3); ctx.strokeStyle = 'rgba(170,90,255,.85)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(p.x, p.y - 4, r, r * 0.3, 0, 0, 7); ctx.stroke(); const g = ctx.createRadialGradient(p.x, p.y - 60, 2, p.x, p.y - 60, r * 1.4); g.addColorStop(0, 'rgba(120,40,255,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - r * 1.4, p.y - 60 - r * 1.4, r * 2.8, r * 2.8); }
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const c of S.cracks || []) { const k = Math.min(1, c.t / 0.45), x = lerp(c.x0, c.x1, k), a = 1 - Math.max(0, (c.t - 0.9) / 0.7); ctx.globalAlpha = a; for (const [lw, col] of [[16, 'rgba(255,140,40,.35)'], [6, '#ffb060'], [2, '#fff2c8']]) { ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.beginPath(); let yy = c.y; ctx.moveTo(c.x0, yy); for (let xx = c.x0; xx > x; xx -= 34) { yy = c.y + Math.sin(xx * 0.07) * 14 + ((xx * 13) % 9 - 4); ctx.lineTo(xx, yy); } ctx.stroke(); } }
  for (const b of S.breath || []) { const k = Math.min(1, b.t / 0.5), a = 1 - Math.max(0, (b.t - 0.9) / 0.7); for (let j = 0; j < 26; j++) { const u = (j / 26) * k, x = lerp(b.x, 200, u), y = lerp(b.y, 620, u) + Math.sin(j * 1.7 + S.t * 10) * 30 * u, r = 30 + 90 * u; ctx.globalAlpha = a * 0.55; const g = ctx.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, 'rgba(255,240,170,.9)'); g.addColorStop(0.45, 'rgba(255,100,20,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); } }
  for (const p of S.pillars || []) { const a = Math.sin(Math.min(1, p.t / 1.6) * Math.PI); ctx.globalAlpha = a * 0.8; const g = ctx.createLinearGradient(p.x - 120, 0, p.x + 120, 0); g.addColorStop(0, 'rgba(255,220,120,0)'); g.addColorStop(0.5, 'rgba(255,240,180,.85)'); g.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - 120, VW.y, 240, p.y - VW.y); if (Math.random() < 0.7) S.parts.push({ x: p.x + rnd(-90, 90), y: p.y - rnd(0, 300), vx: 0, vy: rnd(-160, -60), life: 0.8, age: 0, size: rnd(2, 5), col: '#fff2a8', g: 0, add: true, kind: 'dot', rot: 0, vr: 0 }); }
  for (const b of S.beams || []) { const k = Math.min(1, b.t / 0.55), ang = lerp(0.05, -0.38, k), a = Math.min(1, b.t * 5) * (1 - Math.max(0, (b.t - 0.9) / 0.7)), L2 = 1100; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.PI + ang); ctx.globalAlpha = a; for (const [w, col] of [[90, 'rgba(120,40,255,.25)'], [40, 'rgba(170,100,255,.55)'], [12, '#f4e8ff']]) { ctx.fillStyle = col; ctx.fillRect(0, -w / 2, L2, w); } ctx.restore(); ctx.globalAlpha = a; const g = ctx.createRadialGradient(b.x, b.y, 4, b.x, b.y, 90); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.4, 'rgba(160,80,255,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(b.x - 90, b.y - 90, 180, 180); }
  ctx.restore();
  if (S.chill > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, S.chill) * 0.18; ctx.fillStyle = '#7ac8ff'; ctx.fillRect(VW.x, VW.y, VW.w * 0.62, VW.h); ctx.restore(); }   /* 서리: 우리 쪽 화면이 푸르게 */
}
function drawSlams() {   /* 거인 내려찍기: 청록 충격 효과 영상(25장) */
  if (!S.slams || !S.slams.length) return; for (const o of S.slams) { o.t += 1 / 60; const pf = ctx.filter; if (o.tint) ctx.filter = o.tint === 'fire' ? 'hue-rotate(160deg) saturate(1.6)' : 'hue-rotate(20deg) saturate(.6) brightness(1.3)'; fxFrame('slam', 1 + o.t / 0.06, o.x, o.tint ? o.y : 600, o.tint ? 360 * (UK() < 1 ? 0.75 : 1) : 620, (1 - Math.max(0, o.t - 1.2) * 2) * (o.tint && UK() < 1 ? 0.6 : 1));   /* 11-15 폰: 작은 충격(방패 · 정예)의 빛 기둥이 영웅을 덮음 → 0.75배 크기 · 0.6배 밝기 */ ctx.filter = pf; } S.slams = S.slams.filter(o => o.t < 1.5);
}
function drawRings() {
  if (!S.rings.length) return; if (drawFxSun()) return;
  const c = S.cast, after = S.sun && S.sun.hit;
  S.rings.forEach((rg, i) => {
    const age = c - rg.born, grow = ease(age / 0.35);
    let spin = rg.dir * (age * (0.8 + i * 0.3) + (c > TC.name ? (c - TC.name) * (c - TC.name) * 3 : 0));
    let r = rg.r * grow * (c > TC.name + 0.05 && !after ? 1 - Math.min(0.25, (c - TC.name - 0.05) * 0.18) : 1);
    let alpha = after ? Math.max(0, 1 - (c - S.sun.born - 0.75) * 2) : Math.min(1, age * 3);
    if (alpha <= 0) return;
    drawRing(RC.x, RC.y, r * NS(), spin, alpha, i === 1 ? '#ffd6ff' : '#b78bff', rg.r * NS());
  });
}
function drawSun() {
  const sn = S.sun; if (!sn) return; if (sn.hit && S.cast - sn.born > 2) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const cor = ctx.createRadialGradient(S.giant.x, sn.y, sn.r * 0.7, S.giant.x, sn.y, sn.r * 2.4);
  cor.addColorStop(0, 'rgba(200,140,255,.9)'); cor.addColorStop(0.4, 'rgba(120,40,220,.5)'); cor.addColorStop(1, 'rgba(60,0,120,0)');
  ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(S.giant.x, sn.y, sn.r * 2.4, 0, 7); ctx.fill(); ctx.restore();
  if (!sn.hit) { const x = S.giant.x, y = sn.y, r = sn.r;   /* 11-15 눈 확인(보스_6차): 그냥 까만 원으로 보였음 → 가장자리 보랏빛에서 가운데로 빨려 드는 검은 해 · 안쪽으로 갈수록 빨리 도는 보라 소용돌이 일곱 · 둘레를 도는 불티 */
    const core = ctx.createRadialGradient(x, y, 0, x, y, r); core.addColorStop(0, '#000'); core.addColorStop(0.62, '#07000f'); core.addColorStop(0.9, '#2a0650'); core.addColorStop(1, '#5a17a0'); ctx.fillStyle = core; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; const rot = S.t * 2.2;
    for (let i = 0; i < 7; i++) { const rr = r * (0.9 - i * 0.11), a0 = rot * (1 + i * 0.35) + i * 1.7; ctx.strokeStyle = `rgba(${150 + i * 12},${70 + i * 18},255,${0.42 - i * 0.045})`; ctx.lineWidth = r * 0.05; ctx.beginPath(); ctx.arc(x, y, rr, a0, a0 + 1.1 + i * 0.12); ctx.stroke(); }
    for (let i = 0; i < 8; i++) { const a = -S.t * 1.6 + i * 0.785, rr = r * (1.08 + 0.12 * Math.sin(S.t * 3 + i)); ctx.fillStyle = i % 2 ? 'rgba(255,220,255,.9)' : 'rgba(190,120,255,.85)'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, r * 0.045, 0, 7); ctx.fill(); }
    ctx.restore(); ctx.strokeStyle = 'rgba(230,200,255,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); }
}
function drawWave() {
  const w = S.wave; if (!w || w.r > 2200) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(230,210,255,${Math.max(0, 1 - w.r / 2200)})`; ctx.lineWidth = 30 * (1 - w.r / 2200) + 2;
  ctx.beginPath(); ctx.ellipse(w.x, w.y + 140, w.r, w.r * 0.45, 0, 0, 7); ctx.stroke(); ctx.restore();
}
function drawParts() {
  for (const p of S.parts) {
    const k = 1 - p.age / p.life; ctx.globalAlpha = Math.max(0, k);
    ctx.globalCompositeOperation = p.add ? 'lighter' : 'source-over'; ctx.fillStyle = p.col;
    if (p.add) { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + k * 0.5), 0, 7); ctx.fill(); }
    else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); ctx.restore(); }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function drawText(x, m = 1, maxW = W - 40) {
  const k = x.age / x.life;
  let a = k < 0.12 ? k / 0.12 : k > 0.75 ? (1 - k) / 0.25 : 1;
  let scale = 1; if (x.stamp) scale = 1 + Math.max(0, 0.5 - x.age * 3.5); else if (!x.screen && /^[-+]?[\d.,]+/.test(x.text)) { const q = x.age / 0.16; scale = q < 1 ? 1.75 - 0.95 * q : q < 1.6 ? 0.8 + 0.2 * (q - 1) / 0.6 : 1; }   /* 11-14 타격감: 피해 숫자가 크게 튀어나왔다 자리 잡음 */
  if (!x.screen) scale *= 1 + (WK() - 1) * (/^[-+]?[\d.,]/.test(x.text) ? clamp(22 / x.size, 0.3, 1) : x.size <= 20 ? 0.8 : 0.35);   /* 19:23 글자(기술 이름 등)는 덜 키움 — 숫자만큼 키우니 「뼈의 돌격」이 화면을 덮었음 */   /* 18:42 휴대폰에서 피해 숫자가 5픽셀로 안 보였음 → 화면 크기에 맞춰 키움(작은 글자일수록 더) */
  ctx.save(); ctx.translate(x.x, x.y); ctx.scale(scale, scale); ctx.globalAlpha = clamp(a, 0, 1);
  ctx.font = `900 ${x.size}px ${x.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (x.screen) { const w = ctx.measureText(x.text).width; const mm = Math.min(m, Math.max(60, maxW) / Math.max(1, w * scale)); if (mm !== 1) ctx.scale(mm, mm); x.drawnW = w * scale * mm; } if (x.size >= 36) { x.tf = ctx.getTransform(); x.bw = ctx.measureText(x.text).width; }   /* 00:20 겹침재기용 */   /* 키워도(휴대폰 ×1.9) 보이는 화면 밖으로 넘치지 않게, 원래 크기가 넘쳐도 줄임 */
  let str = x.text; if (x.reveal) { const n = Math.ceil(clamp(x.age / x.reveal, 0, 1) * str.length); str = str.slice(0, n); }
  if (x.glow) { ctx.shadowColor = x.glow; ctx.shadowBlur = Math.min(18, x.size * 0.25); }
  ctx.lineWidth = Math.max(3, x.size * 0.08); ctx.strokeStyle = 'rgba(10,0,20,.9)'; ctx.strokeText(str, 0, 0);
  ctx.fillStyle = x.col; ctx.fillText(str, 0, 0);
  if (x.glow) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.5; ctx.fillText(str, 0, 0); }
  ctx.restore();
}
function drawWorldTexts() { for (const x of S.texts) if (!x.screen) drawText(x); }
function drawScreenTexts() { if (S.t < (S.calmUntil || 0)) { const k = Math.min(1, (S.calmUntil - S.t) / 1.2) * 0.55; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(6,0,14,${k})`; ctx.fillRect(0, 0, cv.width, cv.height); ctx.restore(); }   /* 각성 이름이 또렷하게: 뒤를 어둡게 */ const css = view.s / (view.dpr || 1), m = clamp(0.55 / css, 1, 1.9), x0 = -view.ox / view.s, x1 = (cv.width - view.ox) / view.s; const pad = 66 / css, y0v = -view.oy / view.s; for (const x of S.texts) if (x.screen) { { const ym = y0v + (x.top ? 30 : 118) / css; if (x.y < ym) x.y = ym; }   /* 11-15 눈 확인(돌파보기): 폰 「군단 힘 10 돌파!」가 118 밑이라 군단 한가운데 → top이면 판 제목 자리(큰 글자 뜨는 동안 제목은 숨음) */ drawText(x, m, 2 * Math.min(x.x - x0 - pad, x1 - x.x - pad) - 30); } }   /* 00:22 대표님 폰 크기 · 실제 흐름으로 재니 「부활!」 「묘지의 주인」이 위 단추 · 판 표시를 100% 덮음 → 판 표시 아래로, 좌우 단추 기둥 안쪽 폭으로 */   /* 최대 폭 = 실제로 보이는 화면 폭(휴대폰은 80~1160) 안 */   /* 휴대폰 세로처럼 전장이 작으면 화면 큰 글자를 키움(390 너비에서 약 1.8배) */
function drawBubble() {   // 수하 말풍선: 이름 + 대사, 길이에 맞춰 오래 보임
  if (document.querySelector('#toast .toast') || S.texts.some(t => t.screen && t.size >= 40 && t.age < t.life)) { if (S.bubble) S.bubble.box = null; return; }   /* 11-15 관문⑤: 말풍선 × 보스 이름 큰 글자 86% → 화면 큰 글자가 떠 있는 동안도 말풍선은 숨김 */   /* 11-15 숨긴 동안 옛 자리(box)가 남아 겹침 관문이 「알림 × 말풍선 31%」로 잘못 셈 → 숨기면 자리도 지움   /* 20:44 알림 · 영웅 말풍선 · 「일으켜라」 표가 왼쪽 위에 겹쳐 쌓임 → 알림이 있으면 말풍선은 잠깐 숨김 */
  const b = S.bubble; if (!b) return; const life = b.life || 3.2; const a = clamp(b.age * 3, 0, 1) * clamp((life - b.age) * 2, 0, 1); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.font = `700 24px ${SERIF}`; ctx.textAlign = 'left';
  const pic = b.who && need('hero_' + b.who), pw = pic ? 120 : 0, vx0 = Math.max(0, VIS.x0), vx1 = Math.min(W, VIS.x1);   /* 11-14 18:05 작은 폰에서 말풍선이 왼쪽 끝에 잘리던 것: 세계 폭(0~1280)이 아니라 보이는 폭 안에 */
  const lines = wrapText(b.text, Math.min(520, vx1 - vx0 - pw - 90)), w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 44, h = 30 + lines.length * 32;
  const x = clamp((b.x ?? 330) + pw * 0.6, vx0 + 20 + pw, vx1 - w - 20), y = Math.max(b.y ?? 300, (78 * (view.dpr || 1) - view.oy) / view.s + Math.max(h + 30, pic ? 104 : 0) + 30);   /* 11-15 카메라를 내리자 말풍선이 왼쪽 위 「빠른 보상」 단추를 덮음(관문⑤ 78번) → 위 단추 줄(전장 위 78픽셀) 밑으로 */
  b.box = [x - pw - 6, y - Math.max(h + 30, pic ? 104 : 0) - 30, w + pw + 6, Math.max(h + 30, 104) + 52]; b.tf = ctx.getTransform();   /* 23:58 겹침재기용: 화면 어디를 덮는지 */
  ctx.fillStyle = 'rgba(15,5,25,.88)'; ctx.strokeStyle = '#8a5cff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y - h, w, h, 14) : ctx.rect(x, y - h, w, h); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 30, y - 2); ctx.lineTo(x + 18, y + 22); ctx.lineTo(x + 52, y - 2); ctx.fill();
  if (pic) { const ph = Math.max(h + 30, 104), px = x - pw - 6, py = y - ph + 10; ctx.save(); ctx.fillStyle = 'rgba(15,5,25,.88)'; ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(px, py, pw, ph, 12) : ctx.rect(px, py, pw, ph); ctx.fill(); ctx.stroke(); ctx.clip(); const sc = Math.max(pw / pic.width, ph / pic.height); ctx.drawImage(pic, px + (pw - pic.width * sc) / 2, py, pic.width * sc, pic.height * sc); ctx.restore(); }
  if (b.name) { ctx.font = `700 18px ${SERIF}`; ctx.fillStyle = '#c9a7ff'; ctx.fillText(b.name, x + 22, y - h - 8); }
  ctx.font = `700 24px ${SERIF}`; ctx.fillStyle = '#efe6ff'; lines.forEach((l, i) => ctx.fillText(l, x + 22, y - h + 34 + i * 32)); ctx.restore();
}
function wrapText(t, maxW) { const out = []; let cur = ''; for (const ch of t) { if (ctx.measureText(cur + ch).width > maxW && cur) { out.push(cur); cur = ch.trim() ? ch : ''; } else cur += ch; } if (cur) out.push(cur); return out; }
function drawVignette() {
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${0.55 + S.dark * 0.4})`); ctx.fillStyle = v; fillAll();
}
function drawShock() { for (const k of S.shock || []) { const q = k.t / 0.6; ctx.save(); ctx.globalAlpha = (1 - q) * 0.8; ctx.strokeStyle = '#fff0c8'; ctx.lineWidth = 6 * (1 - q) + 1; ctx.beginPath(); ctx.ellipse(k.x, 640, 40 + q * 320, 10 + q * 60, 0, 0, 7); ctx.stroke(); ctx.restore(); } }
/* 보스 등장 경고: 화면 위 · 아래로 붉은 띠가 흐르고 가장자리가 붉게 맥박침 */
function drawWarn() {
  if (!S.warn) return; const t = S.warn.t, a = Math.min(1, t * 4) * Math.min(1, (2.6 - t) * 3), x0 = -view.ox / view.s, x1 = (cv.width - view.ox) / view.s, y0 = -view.oy / view.s, y1 = (cv.height - view.oy) / view.s;
  ctx.save(); const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9); v.addColorStop(0, 'rgba(160,0,0,0)'); v.addColorStop(1, `rgba(170,0,10,${a * (0.35 + 0.25 * Math.sin(t * 12))})`); ctx.fillStyle = v; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  const bh = 34; ctx.font = '700 20px sans-serif'; ctx.textBaseline = 'middle';
  for (const [yy, dir] of [[y0 + 70, 1], [y1 - 70, -1]]) { ctx.globalAlpha = a * 0.9; ctx.fillStyle = '#5a0008'; ctx.fillRect(x0, yy - bh / 2, x1 - x0, bh); ctx.fillStyle = '#ffd0c8'; const w = ctx.measureText(L.boss.warn + '   ').width; for (let x = x0 - w + ((t * 220 * dir) % w + w) % w; x < x1; x += w) ctx.fillText(L.boss.warn, x, yy); }
  ctx.restore();
}
function drawHud() {}   // 게임에서는 화면 위 숫자를 글자 칸(HTML)으로 보여 줌
