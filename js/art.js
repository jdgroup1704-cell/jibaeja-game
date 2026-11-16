'use strict';
// 그림: 대마법 장면에서 가져옴(그림체 ① 확정). 그림 파일이 없으면 코드로 그린 그림
// ───────────── 미리 그려 둔 작은 그림 (군단 수백 마리를 빠르게 그리려고) ─────────────
function sprite(w, h, fn) { const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const g = c.getContext('2d'); g.scale(2, 2); fn(g); return c; }
function skeletonSprite(weapon) {
  return sprite(44, 66, g => {
    const bone = '#e9e3cf', sh = '#a59d86';
    g.lineCap = 'round'; g.strokeStyle = bone; g.lineWidth = 3;
    // 다리
    g.beginPath(); g.moveTo(20, 44); g.lineTo(15, 62); g.moveTo(24, 44); g.lineTo(29, 62); g.stroke();
    // 골반·척추
    g.fillStyle = sh; g.fillRect(16, 41, 12, 4);
    g.strokeStyle = sh; g.lineWidth = 2.5; g.beginPath(); g.moveTo(22, 41); g.lineTo(22, 24); g.stroke();
    // 갈비뼈
    g.strokeStyle = bone; g.lineWidth = 2;
    for (let i = 0; i < 4; i++) { const y = 26 + i * 4; g.beginPath(); g.ellipse(22, y, 7 - i * 0.6, 2, 0, Math.PI, 0); g.stroke(); }
    // 팔
    g.lineWidth = 2.5; g.beginPath(); g.moveTo(15, 25); g.lineTo(10, 37); g.moveTo(29, 25); g.lineTo(34, 33); g.stroke();
    // 해골
    g.fillStyle = bone; g.beginPath(); g.arc(22, 15, 8, 0, Math.PI * 2); g.fill();
    g.fillRect(17, 18, 10, 6);
    g.fillStyle = '#1a1020'; g.beginPath(); g.arc(19, 15, 2.3, 0, 7); g.arc(25.5, 15, 2.3, 0, 7); g.fill();
    g.fillStyle = '#7dff9a'; g.beginPath(); g.arc(19.3, 15.2, 0.9, 0, 7); g.arc(25.8, 15.2, 0.9, 0, 7); g.fill();
    // 무기
    if (weapon === 0) { g.strokeStyle = '#9aa3b5'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(34, 33); g.lineTo(42, 14); g.stroke(); g.strokeStyle = '#5a3a2a'; g.beginPath(); g.moveTo(31, 36); g.lineTo(36, 31); g.stroke(); }
    else if (weapon === 1) { g.strokeStyle = '#6b4a30'; g.lineWidth = 2; g.beginPath(); g.moveTo(34, 50); g.lineTo(40, 2); g.stroke(); g.fillStyle = '#b8c0cf'; g.beginPath(); g.moveTo(40, -2); g.lineTo(43, 7); g.lineTo(37.5, 6); g.fill(); }
    else { g.fillStyle = '#3d2a4f'; g.strokeStyle = '#8d6cc0'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(9, 34, 6, 9, 0, 0, 7); g.fill(); g.stroke(); g.strokeStyle = '#9aa3b5'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(34, 33); g.lineTo(41, 18); g.stroke(); }
  });
}
function knightSprite() {
  return sprite(40, 60, g => {
    g.fillStyle = '#cfd6e6'; g.fillRect(14, 42, 5, 16); g.fillRect(22, 42, 5, 16);
    const grd = g.createLinearGradient(10, 20, 30, 44); grd.addColorStop(0, '#f4f7ff'); grd.addColorStop(1, '#9aa7c2');
    g.fillStyle = grd; g.beginPath(); g.moveTo(10, 22); g.lineTo(30, 22); g.lineTo(28, 44); g.lineTo(12, 44); g.fill();
    g.fillStyle = '#e8c35a'; g.fillRect(12, 31, 16, 3);
    g.fillStyle = '#dfe5f2'; g.beginPath(); g.arc(20, 14, 8, 0, 7); g.fill();
    g.fillStyle = '#e8c35a'; g.fillRect(12, 12, 16, 3); g.fillStyle = '#20263a'; g.fillRect(14, 15, 12, 2.5);
    g.fillStyle = '#fff7d6'; g.beginPath(); g.ellipse(7, 33, 6, 9, 0, 0, 7); g.fill(); g.strokeStyle = '#e8c35a'; g.lineWidth = 1.5; g.stroke();
    g.strokeStyle = '#c9d2e6'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(31, 34); g.lineTo(38, 18); g.stroke();
  });
}
// ChatGPT로 만든 그림(art/*.png). 없으면 코드로 그린 그림을 씀
const ART = {};
// 처음엔 늘 보이는 것만 받고(11-13 12:40 첫 화면 무게 줄이기), 지역 그림은 그 지역 2판 전에 · 수하 얼굴은 말할 때 받음
const LOADING = {};
const HQ4 = (() => { try { return new URLSearchParams(location.search).get('style') === 'hq'; } catch (e) { return false; } })();   /* ④ 고급 실사풍: 지배자 · 망자병 · 적 기사는 d4_ 그림으로 */
let ARTHOLD = null;   /* 11-15 첫 화면 동안엔 첫 싸움에 필요한 그림만 먼저(느린 망에서 옛 임시 그림 · 큰 영상 그림이 대역폭을 먹던 것) */
function loadImg(n) { if (ART[n] || LOADING[n]) return; if (ARTHOLD && !ARTHOLD.has(n)) return; LOADING[n] = 1; const im = new Image(); im.onload = () => { ART[n] = im; }; im.onerror = () => { (window.ARTERR = window.ARTERR || {})[n] = 1; }; im.src = 'art/' + (HQ4 && /^d2_(lord|skel|knight)$/.test(n) ? n.replace('d2_', 'd4_') : n) + (n === 'bg' || n.startsWith('bg_') ? '.jpg' : '.webp'); }
const ANIME = new Set(['lord', 'heroF_serafine', 'heroF_krag', 'heroF_nox', 'heroF_morde']);   /* 그림체 시안(애니풍): 이 그림들만 「이름_a」 파일로 바꿔 보여 줌 */
const artName = n => (typeof st !== 'undefined' && st && st.settings && st.settings.anime && ANIME.has(n)) ? n + '_a' : n;
function need(n) { if (!ART[n]) loadImg(n); return ART[n] || null; }
function ensureRegion(stage) { for (const s of [stage, stage + 2]) { const k = REGION_BG[regionOf(s)]; if (k) { loadImg('bg_' + k); loadImg('lord_' + k); loadImg('foe_' + k); } } }
function loadArt() { ['bg', 'lordA', 'sumv1_idle', 'foev0_idle', 'sumv1_attack', 'foev0_attack', 'sumv1_walk'].forEach(loadImg); setTimeout(() => ['lord', 'skel', 'giant', 'knight', 'treasure', 'sumA0', 'foeA0', 'cls0', 'cls1', 'cls2', 'cls3', 'cls4', 'cls5', 'foev4_idle', 'foev4_attack'].forEach(loadImg), 4000); setTimeout(() => ['gv2_idle', 'gv2_raise', 'gv2_slam', 'gv2_rec', 'ld8_cast'].forEach(loadImg), 12000); }   /* 11-16 #13 순서: 첫 싸움 줄그림 → 4초 뒤 옛 정지 그림 · 직업 그림 → 12초 뒤 거인 · 영창 영상(2판 · 첫 보스 전에만 있으면 됨). 전엔 3초에 2.2MB를 받기 시작해 느린 망에서 첫 싸움 그림이 28초 늦었음 */   /* 영상 거인은 첫 거인(2판) 전에 미리 받아 둠 */   /* 여기서 st를 쓰면 출시판(한 덩어리)에서 아직 안 만든 이름이라 멈춤 — 수하 얼굴은 need()로 */
/* loadArt()는 main.js boot에서 부름(처음 하는 사람은 첫 화면 그림이 다 온 뒤) */
function drawArt(im, cx, bottom, h, flip) { const w = h * im.width / im.height; ctx.save(); ctx.translate(cx, bottom); if (flip) ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore(); }
const SKEL = [skeletonSprite(0), skeletonSprite(1), skeletonSprite(2)];
const KNIGHT = knightSprite();
// 마법진 글자(지어낸 문양, 실제 글자 아님)
const GLYPHS = Array.from({ length: 30 }, () => Array.from({ length: 3 + (Math.random() * 3 | 0) }, () => [rnd(-1, 1), rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)]));
const STARS = Array.from({ length: 160 }, () => [rnd(0, W), rnd(0, GROUND - 60), rnd(0.4, 1.6), rnd(0, 6)]);
