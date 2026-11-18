/* 망자의 군주 — 세로 폰 한 손 서바이벌 (11-18 새로 시작)
   화면을 끌면 지배자가 움직이고, 공격은 저절로. 쓰러뜨린 적이 그 자리에서 내 해골 병사로 일어나 같이 싸움.
   모든 것(배경 · 캐릭터 · 글자 · 단추)을 캔버스 하나에 그림. ?mute=1 소리 끔 · ?bot=1 시험용 자동 조작 · ?t=초 시작 시간 */
'use strict';
const Q = new URLSearchParams(location.search), MUTE = Q.has('mute'), BOT = Q.has('bot'), SPEED = +(Q.get('speed') || 1);
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let W = 400, H = 800, DPR = 1;
function resize() { DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); }
addEventListener('resize', resize); resize();
const rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
try { for (const [w, f] of [['900', 'jb900'], ['800', 'jb900'], ['700', 'jb700']]) { const ff = new FontFace('JB', `url(fonts/${f}.woff)`, { weight: w }); ff.load().then(x => document.fonts.add(x)).catch(() => {}); } } catch (e) {}   /* 게임 글꼴(본고딕 · 게임 글자만) */
const FONT = "'JB','Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif";

/* ── 그림 ── 줄그림 = 한 줄 10칸, 칸 크기 cw×ch, 발 기준점 ax·ay, 몸 높이 hpx(그림 속 픽셀) · face 1 = 오른쪽 봄 */
const IMG = {}; const img = n => { if (!IMG[n]) { const i = new Image(); i.src = 'art/' + n + '.webp'; IMG[n] = i; } return IMG[n]; };
const SP = {
  lordWalk: { i: 'lordw_attack', cw: 281, ch: 363, ax: 150, ay: 339.1, hpx: 291, n: 16, face: 1 },
  lordIdle: { i: 'lordv_idle', cw: 185, ch: 553, ax: 57.6, ay: 438.6, hpx: 330, n: 15, face: 1 },
  skWalk: { i: 'sw2_walk', cw: 167, ch: 221, ax: 77.5, ay: 220.8, hpx: 220, n: 24, face: 1 },
  skAtk: { i: 'sv2_attack', cw: 182, ch: 237, ax: 84.1, ay: 235.9, hpx: 220, n: 20, face: 1 },
  /* 적(인간 · 우리 지배자와 같은 그림체) — 걷기 그림이 없는 것은 숨쉬기 장면 + 통통 뛰기(hop) */
  foot: { i: 'foev0_idle', cw: 255, ch: 321, ax: 137.5, ay: 312.8, hpx: 240, n: 20, face: -1, hop: 1 },
  footAtk: { i: 'foev0_attack', cw: 255, ch: 321, ax: 137.5, ay: 312.8, hpx: 240, n: 16, face: -1 },
  archer: { i: 'foev1_idle', cw: 428, ch: 325, ax: 240.8, ay: 312.3, hpx: 251, n: 20, face: -1, hop: 1 },
  archerAtk: { i: 'foev1_attack', cw: 428, ch: 325, ax: 240.8, ay: 312.3, hpx: 251, n: 16, face: -1 },
  shield: { i: 'foev2_idle', cw: 310, ch: 361, ax: 177.1, ay: 351.3, hpx: 218, n: 20, face: -1, hop: 1 },
  shieldAtk: { i: 'foev2_attack', cw: 310, ch: 361, ax: 177.1, ay: 351.3, hpx: 218, n: 16, face: -1 },
  priest: { i: 'foev3_idle', cw: 258, ch: 344, ax: 146.0, ay: 316.1, hpx: 264, n: 20, face: -1, hop: 1 },
  priestAtk: { i: 'foev3_attack', cw: 258, ch: 344, ax: 146.0, ay: 316.1, hpx: 264, n: 16, face: -1 },
  spear: { i: 'kn5_walk', cw: 270, ch: 273, ax: 135, ay: 268, hpx: 250, n: 12, cols: 12, face: -1 },
  spearAtk: { i: 'kn5_attack', cw: 270, ch: 273, ax: 135, ay: 268, hpx: 250, n: 12, cols: 12, face: -1 },
  paladin: { i: 'foev4_idle', cw: 350, ch: 467, ax: 187.6, ay: 386.1, hpx: 223, n: 20, face: -1, hop: 1 },
  paladinAtk: { i: 'foev4_attack', cw: 350, ch: 467, ax: 187.6, ay: 386.1, hpx: 223, n: 16, face: -1 },
  giant: { i: 'gv2_idle', cw: 258, ch: 344, ax: 131.4, ay: 339.9, hpx: 330, n: 40, face: -1, hop: 1 },   /* 큰 해골(진화 「무덤의 문」 · 정예가 일어난 것) */
  skArch: { i: 'sk_archer', cw: 269, ch: 360, ax: 100, ay: 356, hpx: 330, n: 1, cols: 1, face: 1 },   /* 궁수 해골(ChatGPT 11-19) */
  skArchW: { i: 'sk_archer_w', cw: 285, ch: 360, ax: 128, ay: 356, hpx: 372, n: 1, cols: 1, face: 1 },   /* 궁수 해골 걷는 자세(번갈아) */
  skShield: { i: 'sk_shield', cw: 386, ch: 360, ax: 150, ay: 356, hpx: 330, n: 1, cols: 1, face: 1 },   /* 방패 해골 */
  skShieldW: { i: 'sk_shield_w', cw: 326, ch: 360, ax: 150, ay: 356, hpx: 330, n: 1, cols: 1, face: 1 },   /* 방패 해골 걷는 자세(번갈아) */
  bossBlood: { i: 'lord_blood', cw: 442, ch: 620, ax: 221, ay: 600, hpx: 560, n: 1, cols: 1, face: -1 },
  bossIce: { i: 'lord_ice', cw: 371, ch: 620, ax: 185, ay: 600, hpx: 560, n: 1, cols: 1, face: -1 },
};
for (const k in SP) img(SP[k].i);
for (const n of ['lord_blood', 'lord_ice', 'u_magic', 'u_summon', 'u_bone', 'u_harvest', 'i_soul', 'i_army', 'relic_chain', 'relic_staff', 'relic_cloak', 'relic_ring', 'relic_crown', 'relic_glass', 'chest2', 'lord']) img(n);
const RIM = {}; function rimOf(n, I, col) { const k = n + col; if (RIM[k] !== undefined) return RIM[k]; if (!I._ok) { if (!I._dec) I._dec = (I.decode ? I.decode() : Promise.resolve()).then(() => { I._ok = 1; }, () => { I._ok = 1; }); return null; } try { const c = document.createElement('canvas'); c.width = I.naturalWidth; c.height = I.naturalHeight; const x = c.getContext('2d'); x.drawImage(I, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); RIM[k] = c; } catch (e) { RIM[k] = null; } return RIM[k]; }   /* 아군 테두리(밝은 윤곽) — 어두운 땅에서도 내 군단이 보이게 */
/* ── 군주 3명 ── */
const LORDS = [
  { name: '망령 군주', desc: '영혼탄으로 시작 · 고른 힘', w: 'bolt', hue: 0, lock: 0 },
  { name: '뼈의 장군', desc: '사신의 낫으로 시작 · 군단 +4 · 병사 힘 +30% · 부활 +10%', w: 'scythe', hue: 130, lock: 2, need: '스테이지 20을 깨면 열려요' },
  { name: '역병 마녀', desc: '저주 늪으로 시작 · 마법 +15% · 영혼 끌기 +40%', w: 'pool', hue: 70, lock: 3, need: '스테이지 40을 깨면 열려요' }];
function lordOpen(i) { return META.lordpack || (i === 1 && META.lord1) || (META.open || 1) >= (LORDS[i].lock || 0); }
function hueSheet(n, deg) { const k = n + '#' + deg; if (IMG[k]) return IMG[k]; const I = IMG[n]; if (!I || !I.complete || !I.naturalWidth) return null; if (!I._ok) { if (!I._dec) I._dec = (I.decode ? I.decode() : Promise.resolve()).then(() => { I._ok = 1; }, () => { I._ok = 1; }); return null; }
  try { const c = document.createElement('canvas'); c.width = I.naturalWidth; c.height = I.naturalHeight; const x = c.getContext('2d'); x.drawImage(I, 0, 0); const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    const a = deg * Math.PI / 180, co = Math.cos(a), si = Math.sin(a), m = [0.213 + co * 0.787 - si * 0.213, 0.715 - co * 0.715 - si * 0.715, 0.072 - co * 0.072 + si * 0.928, 0.213 - co * 0.213 + si * 0.143, 0.715 + co * 0.285 + si * 0.140, 0.072 - co * 0.072 - si * 0.283, 0.213 - co * 0.213 - si * 0.787, 0.715 - co * 0.715 + si * 0.715, 0.072 + co * 0.928 + si * 0.072];
    for (let i = 0; i < p.length; i += 4) { if (!p[i + 3]) continue; const r = p[i], g = p[i + 1], b = p[i + 2]; p[i] = m[0] * r + m[1] * g + m[2] * b; p[i + 1] = m[3] * r + m[4] * g + m[5] * b; p[i + 2] = m[6] * r + m[7] * g + m[8] * b; }
    x.putImageData(d, 0, 0); IMG[k] = c; return c; } catch (e) { IMG[k] = I; return I; } }   /* 같은 그림을 색만 돌려 다른 군주로(사파리도 되게 화소로 직접) */
function lordSpr(base, li) { const L = LORDS[li || 0]; if (!L.hue) return base; const S = SP[base], key = base + li; if (!SP[key]) SP[key] = { ...S }; const c = hueSheet(S.i, L.hue); SP[key].i = c && c !== IMG[S.i] ? S.i + '#' + L.hue : S.i; return key; }
function spr(s, frame, x, y, h, dir, o = {}) {   /* dir: 1 = 오른쪽을 보게 */
  const S = SP[s], I = IMG[S.i]; if (!I || !(I.width && (I.naturalWidth || I.getContext))) { ctx.fillStyle = o.col || '#888'; ctx.beginPath(); ctx.ellipse(x, y - h / 2, h * 0.25, h / 2, 0, 0, 7); ctx.fill(); return; }
  const fi = ((Math.floor(frame) % S.n) + S.n) % S.n, C = S.cols || 10, c = fi % C, r = Math.floor(fi / C), sc = h / S.hpx;
  ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (dir * S.face < 0) ctx.scale(-1, 1); if (o.sx) ctx.scale(o.sx, o.sy || 1);
  if (o.a != null) ctx.globalAlpha = o.a;
  if (o.rim) { const R = rimOf(S.i, I, o.rim); if (R) { const dx = -S.ax * sc, dy = -S.ay * sc, w = S.cw * sc, hh = S.ch * sc, k = 2; for (const [ox, oy] of [[-k, 0], [k, 0], [0, -k], [0, k]]) ctx.drawImage(R, c * S.cw, r * S.ch, S.cw, S.ch, dx + ox, dy + oy, w, hh); } }
  ctx.drawImage(I, c * S.cw, r * S.ch, S.cw, S.ch, -S.ax * sc, -S.ay * sc, S.cw * sc, S.ch * sc);
  if (o.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(0.7, o.flash * 4); ctx.drawImage(I, c * S.cw, r * S.ch, S.cw, S.ch, -S.ax * sc, -S.ay * sc, S.cw * sc, S.ch * sc); }
  ctx.restore();
}

/* ── 소리 ── */
const SND = { ctx: null, buf: {}, bgm: null, init() { if (this.ctx || MUTE) return; try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); for (const n of ['hit', 'rise', 'soul', 'up', 'slam', 'win', 'boom', 'stamp', 'bgm1']) fetch('sfx/' + n + '.mp3').then(r => r.arrayBuffer()).then(b => this.ctx.decodeAudioData(b)).then(d => { this.buf[n] = d; if (n === 'bgm1') this.music(); }).catch(() => {}); } catch (e) {} },
  play(n, vol = 0.5, rate = 1) { if (!this.ctx || !this.buf[n] || (typeof META !== 'undefined' && !META.snd)) return; const now = this.ctx.currentTime; this.last = this.last || {}; if (now - (this.last[n] || 0) < 0.04) return; this.last[n] = now; const s = this.ctx.createBufferSource(), g = this.ctx.createGain(); s.buffer = this.buf[n]; s.playbackRate.value = rate; g.gain.value = vol; s.connect(g).connect(this.ctx.destination); s.start(); },
  music() { if (this.bgm || !this.buf.bgm1) return; const s = this.ctx.createBufferSource(), g = this.ctx.createGain(); this.bgmG = g; s.buffer = this.buf.bgm1; s.loop = true; g.gain.value = META.snd ? 0.22 : 0; s.connect(g).connect(this.ctx.destination); s.start(); this.bgm = s; } };

/* ── 저장(강화 · 기록) ── */
const SAVE_KEY = 'mangja_v1';
const META = Object.assign({ gems: 0, best: 0, runs: 0, snd: 1, vib: 1, ch: 0, open: 1, lord: 0, up: { hp: 0, pow: 0, rise: 0, cap: 0, gold: 0 } }, (() => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; } })());
const saveMeta = () => { META.seen = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(META)); } catch (e) {} };
/* ── 꺼 둔 동안 보상: 마지막으로 본 때부터 최대 8시간 · 최고 스테이지에 비례 ── */
let OFF = null;
function offCheck() { const now = Date.now(), last = META.seen || now, min = Math.min(480, (now - last) / 60000); if (min < 2 || !META.bestStage || BOT) return; const g = Math.floor(min * 0.25 * (1 + META.bestStage * 0.12) * gemMul()); if (g > 0) OFF = { g, min: Math.floor(min) }; }
offCheck(); setTimeout(() => { try { monthCheck(); } catch (e) {} }, 500); addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveMeta(); else if (!OFF) offCheck(); });
function buyUp(u) { const l = META.up[u.id], cost = u.cost(l); if (l >= u.max || META.gems < cost) return false; META.gems -= cost; META.up[u.id]++;
  if (G && MODE === 'play') { const S = G.S, P = G.P, n = l + 1; if (u.id === 'pow') S.pow *= POWM(n) / POWM(l); if (u.id === 'rise') S.rise += 0.03; if (u.id === 'cap') S.cap += 2; if (u.id === 'hp') { const k = HPM(n) / HPM(l); P.max *= k; P.hp *= k; } burst(P.x, P.y - 40, 16, ['#ffe08a', '#ffffff'], 200, 0.5); }
  saveMeta(); if (G && G.idle) saveRun(); SND.play('up', 0.5); return true; }   /* 군주 강화 — 싸우는 중에 사도 바로 들어감 */
/* 방치형 강화: 끝없이 오르고 값은 곱으로 커짐(공격 · 체력은 곱으로 세짐) — 막히면 강화 → 뚫음 */
const HPM = l => Math.pow(1.07, l), POWM = l => Math.pow(1.08, l);
const META_UP = [
  { id: 'hp', name: '뼈 갑옷', desc: l => `최대 체력 ×${HPM(l).toFixed(2)}`, cost: l => Math.round(20 * Math.pow(1.13, l)), max: 300, icon: 'relic_cloak' },
  { id: 'pow', name: '흑마력', desc: l => `모든 공격 ×${POWM(l).toFixed(2)}`, cost: l => Math.round(25 * Math.pow(1.13, l)), max: 300, icon: 'relic_staff' },
  { id: 'rise', name: '죽음의 부름', desc: l => `일으킬 확률 +${l * 3}%`, cost: l => 30 + l * 30, max: 10, icon: 'relic_chain' },
  { id: 'cap', name: '군단기', desc: l => `군단 최대 +${l * 2}`, cost: l => Math.round(40 * Math.pow(1.3, l)), max: 15, icon: 'relic_crown' },
  { id: 'gold', name: '영혼 수확', desc: l => `얻는 결정 +${l * 10}%`, cost: l => Math.round(50 * Math.pow(1.35, l)), max: 20, icon: 'relic_glass' },
];

/* ── 판 하나 ── */
const RUN_LEN = 300;   /* 5분 뒤 보스 */
let G = null, MODE = 'title', T = 0, hitstop = 0, shake = 0;
const KINDS = {
  foot: { hp: 18, spd: 46, dmg: 9, r: 15, h: 64, s: 'foot', xp: 1, from: 0 },
  spear: { hp: 26, spd: 64, dmg: 11, r: 15, h: 62, s: 'spear', xp: 1, from: 35 },
  shield: { hp: 70, spd: 36, dmg: 9, r: 17, h: 66, s: 'shield', xp: 2, from: 70, heavy: 1 },
  archer: { hp: 16, spd: 44, dmg: 10, r: 14, h: 64, s: 'archer', xp: 2, from: 100, far: 170 },
  priest: { hp: 30, spd: 40, dmg: 8, r: 15, h: 68, s: 'priest', xp: 2, from: 150, heal: 1 },
};
/* 지역(판) 3곳 — 이기면 다음 지역이 열림 */
const CHAPTERS = [
  { name: '버려진 묘지', sub: '제1장', boss: '황금 성기사 단장', weak: 'sword', bs: 'paladin', tint: null, hp: 1, lines: ['죽은 자는 흙으로 돌아가라!', '빛이여… 나를 버리지 마라!', '이 몸도… 일어나는가…'] },
  { name: '피의 늪', sub: '제2장', boss: '피의 군주', weak: 'arch', lines: ['내 늪에 발을 들였구나, 해골 왕.', '피가… 끓어오른다!', '내 피를… 가져가라…'], bs: 'bossBlood', tint: 'rgba(120,0,20,.28)', hp: 1.8 },
  { name: '얼음 성채', sub: '제3장', boss: '서리 왕', weak: 'shield', lines: ['얼어붙어라. 영원히.', '이 추위가… 나를 배신하는가!', '봄은… 오지 않는다…'], bs: 'bossIce', tint: 'rgba(40,120,200,.22)', hp: 2.7 },
];
function newRun() {
  const U = META.up;
  G = { ch: META.ch || 0, t: +(Q.get('t') || 0), kills: 0, lvl: 1, xp: 0, next: 3, gems: 0, over: 0, win: 0, cards: null, chestN: 0, bossOn: 0, boss: null, eliteT: 60 + +(Q.get('t') || 0), rallyCd: 6, rallyOn: 0,
    P: { x: 0, y: 0, hp: 120 * HPM(U.hp), max: 120 * HPM(U.hp), spd: 150, dir: 1, inv: 0, wf: 0, moving: 0, hurt: 0 },
    foes: [], allies: [], shots: [], arrows: [], orbs: [], fx: [], texts: [], pools: [], marks: [],
    S: { pow: POWM(U.pow) * Math.pow(1.3, META.awake || 0), rise: 0.4 + U.rise * 0.03, cap: 10 + U.cap * 2 + (META.awake || 0) * 3, allyPow: 1, spd: 1, magnet: 115, haste: 1 },
    W: { bolt: 0, orbit: 0, pool: 0, scythe: 0, chain: 0, hands: 0 }, L: {}, E: {}, cd: { bolt: 0, pool: 1.5, scythe: 2, chain: 1, hands: 1.5 }, spawnAcc: 0, dead: [], pillars: [], zaps: [], handFx: [] };
  G.lord = lordOpen(META.lord || 0) ? (META.lord || 0) : 0; if (Q.has('lord')) G.lord = +Q.get('lord'); const LD = LORDS[G.lord]; G.W[LD.w] = 1;
  if (G.lord === 1) { G.S.cap += 4; G.S.allyPow += 0.3; G.P.max *= 1.2; G.P.hp = G.P.max; G.S.rise += 0.1; }
  if (G.lord === 2) { G.S.pow *= 1.15; G.S.magnet *= 1.4; G.S.cap -= 2; G.P.max *= 0.9; G.P.hp = G.P.max; }
  if (Q.has('all')) { for (const k in G.W) G.W[k] = CARDS.find(c => c.id === k).max; for (const e of EVO) G.E[e.id] = 1; G.S.cap = 40; }   /* 시험: 모든 무기 진화 */
  { const R = relOf(); G.S.pow *= R.p; G.P.max *= R.h; G.P.hp = G.P.max; G.S.cap += R.c; }   /* 유물 */
  G.idle = !Q.has('surv'); G.d = G.t;
  if (G.idle) { loadRun(); setStage(Q.has('st') ? +Q.get('st') : (META.stage || 1)); }
  MODE = 'play'; JOY.on = false; for (let i = 0; i < 6; i++) spawnFoe('foot');   /* 처음 1초부터 적이 보이게 */
}

/* ── 조작: 화면 아무 데나 누르고 끌면 그 자리가 조이스틱 ── */
const JOY = { on: false, x0: 0, y0: 0, x: 0, y: 0, id: null };
let BTNS = [];
cv.addEventListener('pointerdown', e => { SND.init(); const x = e.clientX, y = e.clientY;
  for (const b of BTNS) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { b.fn(); SND.play('up', 0.4, 1.2); return; }
  if (MODE === 'play') { JOY.on = true; JOY.id = e.pointerId; JOY.x0 = JOY.x = x; JOY.y0 = JOY.y = y; } });
cv.addEventListener('pointermove', e => { if (JOY.on && e.pointerId === JOY.id) { JOY.x = e.clientX; JOY.y = e.clientY; } });
const up = e => { if (e.pointerId === JOY.id) JOY.on = false; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
const KEYS = {}; addEventListener('keydown', e => { KEYS[e.key.toLowerCase()] = 1; SND.init(); }); addEventListener('keyup', e => { KEYS[e.key.toLowerCase()] = 0; });

/* ── 카드(레벨 업) ── */
const CARDS = [
  { id: 'bolt', w: 1, name: '영혼탄', icon: 'u_magic', max: 6, desc: l => l <= 1 ? '가장 가까운 적에게 영혼탄' : ['', '', '탄 +1', '피해 +40%', '탄 +1 · 꿰뚫기', '피해 +40%', '탄 +2'][l] },
  { id: 'orbit', w: 1, name: '뼈 방패', icon: 'u_bone', max: 5, desc: l => l <= 1 ? '뼈가 몸 둘레를 돌며 때림' : ['', '', '뼈 +1', '피해 +50%', '뼈 +1 · 더 넓게', '뼈 +2'][l] },
  { id: 'pool', w: 1, name: '저주 늪', icon: 'u_harvest', max: 5, desc: l => l <= 1 ? '적 무리 밑에 독 늪' : ['', '', '늪 +1', '더 넓게', '피해 +60%', '늪 +2'][l] },
  { id: 'scythe', w: 1, name: '사신의 낫', icon: 'relic_ring', max: 5, desc: l => l <= 1 ? '둘레를 한 바퀴 베어 냄' : ['', '', '피해 +50%', '더 넓게', '더 자주', '피해 +80%'][l] },
  { id: 'chain', w: 1, name: '영혼 사슬', icon: 'relic_chain', max: 5, desc: l => l <= 1 ? '번개가 적 사이를 튀며 지짐' : ['', '', '한 번 더 튐', '피해 +50%', '두 번 더 튐', '더 자주'][l] },
  { id: 'hands', w: 1, name: '망자의 손', icon: 'u_summon', max: 5, desc: l => l <= 1 ? '땅에서 손이 솟아 적을 붙잡음' : ['', '', '손 +1', '더 오래 붙잡음', '손 +2', '피해 +80%'][l] },
  { id: 'rise', name: '죽음의 부름', icon: 'chest2', max: 5, desc: () => '쓰러진 적이 일어날 확률 +12%' },
  { id: 'cap', name: '군단 확장', icon: 'i_army', max: 6, desc: () => '군단 최대 +6' },
  { id: 'allyPow', name: '망자의 힘', icon: 'relic_crown', max: 5, desc: () => '해골 병사 공격 · 체력 +35%' },
  { id: 'spd', name: '그림자 걸음', icon: 'relic_cloak', max: 4, desc: () => '이동 속도 +12%' },
  { id: 'hp', name: '뼈 갑옷', icon: 'relic_glass', max: 5, desc: () => '최대 체력 +25 · 다 회복' },
  { id: 'magnet', name: '영혼 끌개', icon: 'i_soul', max: 4, desc: () => '영혼을 더 멀리서 끌어옴' },
  { id: 'haste', name: '서두르는 주문', icon: 'relic_staff', max: 5, desc: () => '모든 마법 대기 −8%' },
];
const lv = id => (G.W[id] != null ? G.W[id] : (G.L[id] || 0));
/* 무기 진화: 무기 최대 + 짝 강화 1 이상이면 금빛 진화 카드(뱀파이어 서바이버식 「찾아내는 재미」) */
const EVO = [
  { id: 'bolt', need: 'haste', name: '영혼 폭풍', desc: '영혼탄 +3 · 모두 꿰뚫음 · 피해 ×1.5', icon: 'u_magic' },
  { id: 'orbit', need: 'hp', name: '뼈의 성채', desc: '뼈 8개가 크게 돌며 피해 ×2', icon: 'u_bone' },
  { id: 'pool', need: 'magnet', name: '망자의 늪', desc: '늪에서 죽은 적은 반드시 해골로 일어남', icon: 'u_harvest' },
  { id: 'scythe', need: 'spd', name: '사신 강림', desc: '낫이 두 겹 · 1.2초마다', icon: 'relic_ring' },
  { id: 'chain', need: 'cap', name: '망령 폭풍', desc: '사슬이 8번 튀고 맞은 적이 잠깐 멈춤', icon: 'relic_chain' },
  { id: 'hands', need: 'allyPow', name: '무덤의 문', desc: '손에 붙잡혀 죽은 적이 큰 해골로 일어남', icon: 'u_summon' },
];
const evoOk = e => G.W[e.id] >= (CARDS.find(c => c.id === e.id).max) && (G.L[e.need] || 0) >= 1 && !G.E[e.id];
function rollCards() {
  const pool = CARDS.filter(c => lv(c.id) < c.max && !(c.w && lv(c.id) === 0 && Object.values(G.W).filter(v => v > 0).length >= 4));
  const out = []; const ev = EVO.find(evoOk); if (ev) out.push({ id: 'evo_' + ev.id, evo: ev, name: ev.name, icon: ev.icon, max: 1, desc: () => ev.desc }); while (out.length < 3 && pool.length) { const wts = pool.map(c => (c.w && lv(c.id) === 0 ? 2.2 : c.w ? 1.6 : 1)); let r = Math.random() * wts.reduce((a, b) => a + b, 0), i = 0; while ((r -= wts[i]) > 0) i++; out.push(pool.splice(i, 1)[0]); }
  return out;
}
function takeCard(c) {
  if (c.evo) { G.E[c.evo.id] = 1; G.cards = null; say('진화! ' + c.name, G.P.x, G.P.y - 100, { size: 26, col: '#ffd23a', life: 1.6, vy: -30 }); burst(G.P.x, G.P.y - 40, 50, ['#ffd23a', '#fff', '#c9a2ff'], 420, 0.8); shake = 12; G.flashW = 0.6; SND.play('win', 0.6); if (G.queue > 0) { G.queue--; G.cards = rollCards(); } return; }
  const n = lv(c.id) + 1; if (c.w) G.W[c.id] = n; else G.L[c.id] = n;
  const S = G.S;
  if (c.id === 'rise') S.rise += 0.12; if (c.id === 'cap') S.cap += 6; if (c.id === 'allyPow') S.allyPow += 0.35; if (c.id === 'spd') S.spd += 0.12;
  if (c.id === 'hp') { G.P.max += 25; G.P.hp = G.P.max; } if (c.id === 'magnet') S.magnet *= 1.45; if (c.id === 'haste') S.haste *= 0.92;
  G.cards = null; say(`${c.name} ${n > 1 ? 'Lv' + n : '획득'}`, G.P.x, G.P.y - 150, { size: 20, col: '#ffe08a', vy: -20, life: 1.2 }); burst(G.P.x, G.P.y - 40, 18, ['#c9a2ff', '#fff', '#ffe08a'], 240);
  if (G.queue > 0) { G.queue--; G.cards = rollCards(); }
}

/* ── 효과 ── */
function burst(x, y, n, cols, sp = 180, life = 0.5) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = rnd(sp * 0.3, sp); G.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, t: 0, life: rnd(life * 0.5, life), col: cols[i % cols.length], s: rnd(2, 4.5) }); } if (G.fx.length > 500) G.fx.splice(0, G.fx.length - 500); }
function say(text, x, y, o = {}) { G.texts.push({ text, x, y, t: 0, life: o.life || 0.8, size: o.size || 16, col: o.col || '#fff', vy: o.vy ?? -50 }); if (G.texts.length > 60) G.texts.shift(); }

/* ── 피해 ── */
function hurtFoe(f, dmg, sx, sy, kb = 60, src) {
  if (f.dead) return; dmg *= G.S.pow; const crit = Math.random() < 0.1; if (crit) { dmg *= 2; if (hitstop < 0.03) hitstop = 0.03; }
  if (src) { G.dmg = G.dmg || {}; G.dmg[src] = (G.dmg[src] || 0) + Math.min(dmg, Math.max(0, f.hp)); } f.hp -= dmg; f.flash = 0.12; const d = Math.hypot(f.x - sx, f.y - sy) || 1, k = f.boss ? 0.1 : f.heavy ? 0.4 : 1; f.kx += (f.x - sx) / d * kb * k; f.ky += (f.y - sy) / d * kb * k;
  if (Math.random() < (crit ? 1 : 0.5)) say(Math.round(dmg) + '', f.x + rnd(-10, 10), f.y - f.h - 4, { size: crit ? 22 : 15, col: crit ? '#ffd23a' : '#ffffff', life: 0.55 });
  SND.play('hit', crit ? 0.35 : 0.18, rnd(0.85, 1.25));
  if (f.hp <= 0) killFoe(f);
}
function killFoe(f) {
  f.dead = true; G.kills++; if (!f.boss) G.dead.push({ s: f.s, wf: f.wf, x: f.x, y: f.y, h: f.h, dir: f.dir, t: 0 }); if (G.dead.length > 40) G.dead.shift();
  if (META.vib && f.elite && navigator.vibrate) try { navigator.vibrate(40); } catch (e) {} burst(f.x, f.y - f.h * 0.5, f.boss ? 60 : f.elite ? 26 : 9, ['#e8dcc0', '#bfb59a', '#ffffff', '#9a7ad8'], f.boss ? 420 : 220);
  for (let i = 0; i < (f.boss ? 30 : f.elite ? 8 : 1); i++) G.orbs.push({ x: f.x + rnd(-8, 8) * (i ? 3 : 0), y: f.y - 10 + rnd(-8, 8) * (i ? 3 : 0), v: f.xp * (1 + G.d / 160) * (1 + G.ch * 0.25), t: 0 });
  if (!f.boss && Math.random() < (f.elite ? 1 : 0.012)) G.hearts = (G.hearts || []).concat([{ x: f.x, y: f.y - 6, t: 0 }]);   /* 회복: 영혼 심장 */
  if (f.elite) { G.chestN++; G.queue = (G.queue || 0) + 1; hitstop = 0.08; shake = Math.max(shake, 10); SND.play('boom', 0.5); say('정예 처치! 보물 카드', f.x, f.y - 90, { size: 22, col: '#ffd23a', life: 1.4 }); if (!G.cards) { G.queue--; G.cards = rollCards(); } }
  if (f.boss) { G.bossSay = { s: CHAPTERS[G.ch].lines[2], t: 0, x: f.x, y: f.y - f.h - 10 }; hitstop = 0.25; shake = 30; SND.play('win', 0.8); if (G.idle) { G.boss = null; G.bossOn = 0; stageClear(); } else { G.win = 1; G.over = 2.5; } }
  if (G.idle && !f.boss && !G.stBoss) { G.stK++; if (G.stK >= G.stNeed) stageClear(); }
  const alive = G.allies.filter(a => !a.dead).length;
  const sure = (G.E.pool && f.inPool > G.t) || (G.E.hands && f.rootT > 0), big = f.elite || (G.E.hands && f.rootT > 0 && Math.random() < 0.5);
  if (!f.boss && alive < G.S.cap && (sure || Math.random() < (f.elite ? 1 : G.S.rise))) raise(f.x, f.y, big, f.kind === 'archer' || f.kind === 'priest' ? 'arch' : f.kind === 'shield' ? 'shield' : 'sword');
}
function raise(x, y, big, kind) {   /* kind: 'sword' 칼 · 'arch' 활(뒤에서 쏨) · 'shield' 방패(몸 튼튼) */
  kind = big ? 'sword' : kind || 'sword'; const FM = META.form || 0; if (!big && FM && Math.random() < 0.6) kind = FORM[FM].k;   /* 군단 편성: 고른 병종이 60% */ const S = G.S, hp = (big ? 120 : 40) * S.allyPow * (1 + G.d / 200) * (kind === 'shield' ? 2.6 : kind === 'arch' ? 0.7 : 1);
  G.allies.push({ ut: kind, x, y, hp, max: hp, rise: 0, t: rnd(0, 5), atkT: rnd(0, 0.6), dir: 1, big, dead: false, wf: rnd(0, 20), af: -1, ang: Math.random() * 6.283 });
  G.marks.push({ x, y, t: 0 }); G.pillars.push({ x, y, t: 0, big }); SND.play('rise', 0.22, rnd(0.9, 1.15));
}
function hurtLord(d, why = 'contact') { const P = G.P; if (P.inv > 0 || G.over) return; G.why = G.why || {}; G.why[why] = (G.why[why] || 0) + Math.round(d); if (META.vib && navigator.vibrate) try { navigator.vibrate(25); } catch (e) {} P.hp -= d; P.inv = 0.45; P.hurt = 0.3; shake = Math.max(shake, 6); SND.play('slam', 0.3, 1.4); if (P.hp <= 0) { P.hp = 0; if (G.idle) { retreat(); return; } if (!G.revived && !BOT) { G.reviveAsk = 1; JOY.on = false; } else { G.over = 2; G.win = 0; } } }

/* ── 생겨남 ── */
function spawnFoe(kind, elite) {
  const K = KINDS[kind], a = Math.random() * 6.283, R = Math.hypot(W, H) * (G.t < 8 ? 0.42 : 0.56) + 30, sc = 1 + G.d / 90 + Math.max(0, G.d - 200) / 60;
  const ss = elite ? 'paladin' : K.s; const f = { kind, x: G.P.x + Math.cos(a) * R, y: G.P.y + Math.sin(a) * R, hp: K.hp * sc * (1 + G.ch * 0.4) * (elite ? 9 : 1) * (G.idle ? Math.pow(1.07, Math.max(0, G.stage - 15)) : 1), spd: K.spd * rnd(0.9, 1.1) * (elite ? 0.8 : 1), dmg: K.dmg * (0.5 + Math.min(G.d, 600) / 230) * (1 + G.ch * 0.25) * (G.idle ? Math.pow(1.035, Math.max(0, G.stage - 15)) : 1), r: K.r * (elite ? 1.6 : 1), h: K.h * (elite ? 1.55 : 1), s: ss, xp: K.xp, far: K.far, heal: K.heal, heavy: K.heavy || elite, elite, kx: 0, ky: 0, flash: 0, wf: rnd(0, 30), shootT: rnd(1, 2.5), dir: -1 };
  f.max = f.hp; G.foes.push(f); return f;
}
function spawnBoss() {
  const P = G.P, C = CHAPTERS[G.ch]; G.bossOn = 1; const hp = 3400 * (1 + G.d / 250) * C.hp * (G.idle ? 0.8 * Math.pow(1.07, Math.max(0, G.stage - 15)) : 1);
  G.boss = { kind: 'boss', s: C.bs, boss: 1, x: P.x + W * 0.42, y: P.y - 60, hp, max: hp, spd: 38, dmg: 22 * (1 + G.ch * 0.4), r: 40, h: G.ch ? 200 : 190, xp: 1, kx: 0, ky: 0, flash: 0, wf: 0, dir: -1, heavy: 1, act: 'idle', actT: 3, af: 0 };
  G.foes.push(G.boss); SND.play('stamp', 0.7); shake = 18; G.banner = { text: C.boss + ' 등장', t: 0 }; if (C.weak) G.weakTip = { t: 0, k: C.weak }; G.bossSay = { s: C.lines[0], t: 0 }; G.bossHalf = 0;
}

/* ── 한 걸음 ── */
const GRID = new Map(), CELL = 48, gk = (x, y) => (Math.floor(x / CELL) * 73856093) ^ (Math.floor(y / CELL) * 19349663);
function near(x, y, r, fn) { const c0 = Math.floor((x - r) / CELL), c1 = Math.floor((x + r) / CELL), r0 = Math.floor((y - r) / CELL), r1 = Math.floor((y + r) / CELL); for (let cx = c0; cx <= c1; cx++) for (let cy = r0; cy <= r1; cy++) { const L = GRID.get((cx * 73856093) ^ (cy * 19349663)); if (L) for (const f of L) fn(f); } }
function nearestFoe(x, y, maxR = 1e9) { let best = null, bd = maxR * maxR; for (const f of G.foes) { if (f.dead) continue; const d = (f.x - x) ** 2 + (f.y - y) ** 2; if (d < bd) { bd = d; best = f; } } return best; }

function step(dt) {
  const P = G.P, S = G.S;
  if (G.over) { G.over -= dt; if (G.over <= 0) endRun(); updateFx(dt); return; }
  G.t += dt; if (!G.idle) G.d = G.t; else idleTick(dt);
  /* 움직이기 */
  let mx = 0, my = 0;
  if (JOY.on) { const dx = JOY.x - JOY.x0, dy = JOY.y - JOY.y0, d = Math.hypot(dx, dy); if (d > 6) { const k = Math.min(1, d / 50); mx = dx / d * k; my = dy / d * k; } }
  if (KEYS.a || KEYS.arrowleft) mx -= 1; if (KEYS.d || KEYS.arrowright) mx += 1; if (KEYS.w || KEYS.arrowup) my -= 1; if (KEYS.s || KEYS.arrowdown) my += 1;
  const AUTO = BOT || (G.idle && !JOY.on && !(KEYS.a || KEYS.d || KEYS.w || KEYS.s || KEYS.arrowleft || KEYS.arrowright || KEYS.arrowup || KEYS.arrowdown));
  if ((BOT || (G.idle && META.autoRally !== 0)) && G.rallyCd <= 0) { let n = 0; for (const f of G.foes) if (!f.dead && Math.hypot(f.x - P.x, f.y - P.y) < 200) n++; if (n >= 8) doRally(); }
  if (AUTO) { let ax = 0, ay = 0; for (const f of G.foes) { const dx = P.x - f.x, dy = P.y - f.y, d = Math.hypot(dx, dy); if (d < 200 && d > 0) { const w = (200 - d) * (200 - d) / 60; ax += dx / d * w; ay += dy / d * w; } } for (const h of G.hearts || []) { const d = Math.hypot(h.x - P.x, h.y - P.y); if (P.hp < P.max * 0.6 && d < 400) { ax += (h.x - P.x) / d * 150; ay += (h.y - P.y) / d * 150; } } let o = null, od = 1e9; for (const q of G.orbs) { const d = (q.x - P.x) ** 2 + (q.y - P.y) ** 2; if (d < od) { od = d; o = q; } } if (o && od < 300 * 300) { const d = Math.sqrt(od) || 1; ax += (o.x - P.x) / d * 60; ay += (o.y - P.y) / d * 60; } if (G.slam) { const dx = P.x - G.slam.x, dy = P.y - G.slam.y, d = Math.hypot(dx, dy) || 1; if (d < G.slam.r + 30) { ax += dx / d * 3000; ay += dy / d * 3000; } } if (G.boss && !G.boss.dead && !G.slam) { const dx = G.boss.x - P.x, dy = G.boss.y - P.y, d = Math.hypot(dx, dy) || 1; if (d > 150) { ax += dx / d * 400; ay += dy / d * 400; } } ax += Math.cos(G.t * 0.3) * 30; ay += Math.sin(G.t * 0.37) * 30; const l = Math.hypot(ax, ay) || 1; mx = ax / l; my = ay / l; }   /* 시험 봇: 몰린 적을 피하고 가까운 영혼을 주움(사람 흉내) */
  const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
  P.x += mx * P.spd * S.spd * dt; P.y += my * P.spd * S.spd * dt; P.moving = ml > 0.1; if (Math.abs(mx) > 0.15 && !(P.cast > 0.1)) P.dir = Math.sign(mx); P.wf += dt * 24 * (P.moving ? 1 : 0);
  P.inv = Math.max(0, P.inv - dt); P.hurt = Math.max(0, P.hurt - dt); P.cast = Math.max(0, (P.cast || 0) - dt);
  /* 적 생겨남 */
  if (!G.idle && !G.bossOn && G.t >= RUN_LEN) spawnBoss();
  const alive = G.foes.length, rate = G.bossOn ? 1.4 : 1.7 + Math.min(G.d, 600) * 0.036, cap = 170;
  G.spawnAcc += dt * rate; while (G.spawnAcc >= 1) { G.spawnAcc--; if (alive < cap) { const ks = Object.keys(KINDS).filter(k => G.d >= KINDS[k].from && (k !== 'archer' || (!G.bossOn && Math.random() < 0.5))); spawnFoe(ks[Math.floor(Math.random() * ks.length)]); } }
  if (!G.bossOn && G.t >= G.eliteT) { G.eliteT += 60; const ks = Object.keys(KINDS).filter(k => G.d >= KINDS[k].from && !KINDS[k].far); const e = spawnFoe(ks[Math.floor(Math.random() * ks.length)], true); say('정예 등장!', P.x, P.y - 120, { size: 20, col: '#ff8a6a', life: 1.2, vy: 0 }); e.hp *= 1; }
  /* 칸 나누기(가까운 적 찾기) */
  GRID.clear(); for (const f of G.foes) { if (f.dead) continue; const k = gk(f.x, f.y); let L = GRID.get(k); if (!L) GRID.set(k, L = []); L.push(f); }
  /* 적 */
  for (const f of G.foes) {
    if (f.dead) continue; f.flash = Math.max(0, f.flash - dt); f.wf += dt * 22;
    let tx = P.x, ty = P.y, tgtAlly = null;
    if (!f.boss) { let bd = 46 * 46; for (const a of G.allies) { if (a.dead || a.rise < 1) continue; const d = (a.x - f.x) ** 2 + (a.y - f.y) ** 2; if (d < bd) { bd = d; tgtAlly = a; } } }
    if (tgtAlly) { tx = tgtAlly.x; ty = tgtAlly.y; }
    const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1;
    f.rootT = Math.max(0, (f.rootT || 0) - dt); f.slowT = Math.max(0, (f.slowT || 0) - dt);
    let v = f.spd * (f.rootT > 0 ? 0 : f.slowT > 0 ? 0.55 : 1); if (f.far && !tgtAlly) { if (d < f.far * 0.8) v = -f.spd * 0.6; else if (d < f.far) v = 0; }
    if (f.boss) { bossAct(f, dt, d); v = f.act === 'idle' ? f.spd : 0; }
    f.x += (dx / d * v + f.kx) * dt; f.y += (dy / d * v + f.ky) * dt; f.kx *= Math.pow(0.002, dt); f.ky *= Math.pow(0.002, dt); if (Math.abs(dx) > 4) f.dir = Math.sign(dx);
    /* 서로 밀어내기 */
    near(f.x, f.y, f.r * 2, o => { if (o === f) return; const ox = f.x - o.x, oy = f.y - o.y, od = Math.hypot(ox, oy), m = f.r + o.r; if (od > 0 && od < m) { const p = (m - od) / m * 40 * dt * 4; f.x += ox / od * p; f.y += oy / od * p; } });
    /* 닿으면 */
    if (tgtAlly && d < f.r + 14) { tgtAlly.hp -= f.dmg * 0.6 * dt; if (tgtAlly.hp <= 0 && !tgtAlly.dead) { tgtAlly.dead = true; burst(tgtAlly.x, tgtAlly.y - 20, 8, ['#d8ccb0', '#9a7ad8'], 160); } }
    else if (!f.boss && Math.hypot(P.x - f.x, P.y - f.y) < f.r + 16) { hurtLord(f.dmg); if (!(f.atkA > 0)) f.atkA = 0.5; }
    if (tgtAlly && d < f.r + 14 && !(f.atkA > 0)) f.atkA = 0.5; f.atkA = Math.max(0, (f.atkA || 0) - dt);
    if (f.far && !tgtAlly && d < f.far * 1.4) { f.shootT -= dt; if (f.shootT <= 0) { f.shootT = rnd(3.2, 4.2); f.atkA = 0.5; const sp = 190; G.arrows.push({ x: f.x, y: f.y - 34, vx: dx / d * sp, vy: dy / d * sp, t: 0, dmg: f.dmg * 0.55 }); } }   /* 11-18 판재기: 죽음의 90%가 화살 → 느리게 · 약하게 · 덜 자주(피할 수 있게) */
    if (f.heal && Math.random() < dt * 0.5) near(f.x, f.y, 90, o => { if (!o.dead && !o.boss && o.hp < o.max) { o.hp = Math.min(o.max, o.hp + o.max * (o.elite ? 0.04 : 0.15)); G.fx.push({ x: o.x, y: o.y - o.h, vx: 0, vy: -40, t: 0, life: 0.6, col: '#8affb0', s: 5 }); } });
  }
  /* 화살 */
  for (const a of G.arrows) { a.t += dt; a.x += a.vx * dt; a.y += a.vy * dt; if (Math.hypot(a.x - P.x, a.y - (P.y - 30)) < 18) { hurtLord(a.dmg, 'arrow'); a.t = 9; } }
  G.arrows = G.arrows.filter(a => a.t < 3);
  /* 내 마법 */
  weapons(dt);
  /* 해골 병사 */
  let slot = 0; const live = G.allies.filter(a => !a.dead);
  for (const a of live) {
    a.t += dt; if (a.rise < 1) { a.rise = Math.min(1, a.rise + dt * 1.8); continue; }
    const tgt = nearestFoe(a.x, a.y, 260); let tx, ty, spd = 125 * (a.big ? 0.9 : 1) * (G.rallyOn > 0 ? 1.6 : 1);
    if (a.ut === 'arch') { const ring = 96 + (slot % 3) * 18, ang = slot * 0.9 + G.t * 0.25; tx = P.x + Math.cos(ang) * ring; ty = P.y + Math.sin(ang) * ring * 0.6; slot++;
      const at = nearestFoe(a.x, a.y, 240); a.atkT -= dt; if (at) a.dir = Math.sign(at.x - a.x) || a.dir; else if (Math.abs(tx - a.x) > 6) a.dir = Math.sign(tx - a.x); if (at && a.atkT <= 0 && a.rise >= 1) { a.atkT = G.rallyOn > 0 ? 0.6 : 1.1; a.af = 0; a.dir = Math.sign(at.x - a.x) || 1; const ay2 = a.y - 40, dx2 = at.x - a.x, dy2 = at.y - at.h * 0.45 - ay2, dd = Math.hypot(dx2, dy2) || 1; (G.bones = G.bones || []).push({ x: a.x + a.dir * 14, y: ay2, vx: dx2 / dd * 420, vy: dy2 / dd * 420, t: 0, dmg: 5 * S.allyPow * (1 + G.d / 240) * (G.rallyOn > 0 ? 1.6 : 1) }); }
      const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy); if (d > 4) { const v = Math.min(spd, d * 4); a.x += dx / d * v * dt; a.y += dy / d * v * dt; a.wf += dt * 26; } if (a.af >= 0) a.af += dt * 3; if (a.af > 1) a.af = -1; continue; }
    if (tgt && Math.hypot(tgt.x - P.x, tgt.y - P.y) < 260 && Math.hypot(a.x - P.x, a.y - P.y) < 300) {   /* 지배자 곁(화면 안)에서만 싸움 — 멀리 흩어져 안 보이던 것 */ tx = tgt.x + Math.cos(a.ang) * (tgt.r + 16); ty = tgt.y + Math.sin(a.ang) * (tgt.r + 12) * 0.6; }   /* 한 적을 여럿이 둘러쌈 — 한 점에 겹치면 군단이 1명처럼 보임 */
    else { const ring = 46 + Math.floor(slot / 10) * 30, ang = slot * 0.63 + G.t * 0.3; tx = P.x + Math.cos(ang) * ring; ty = P.y + Math.sin(ang) * ring * 0.6; slot++; }
    for (const o of live) { if (o === a || o.rise < 1) continue; const ox = a.x - o.x, oy = a.y - o.y, od = Math.hypot(ox, oy), m = a.big || o.big ? 40 : 26; if (od < m) { const p = (m - od) / m * 160 * dt; a.x += (ox / (od || 1) || Math.random() - 0.5) * p; a.y += (oy / (od || 1) || Math.random() - 0.5) * p; } }
    const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
    if (d > 4) { const v = Math.min(spd, d * 4); a.x += dx / d * v * dt; a.y += dy / d * v * dt; a.wf += dt * 26; if (Math.abs(dx) > 3) a.dir = Math.sign(dx); }
    a.atkT -= dt; if (a.af >= 0) a.af += dt * 30;  if (a.af > 19) a.af = -1;
    if (tgt && Math.hypot(tgt.x - a.x, tgt.y - a.y) < tgt.r + 22 && a.atkT <= 0) { a.atkT = G.rallyOn > 0 ? 0.42 : 0.75; a.af = 0; a.dir = Math.sign(tgt.x - a.x) || 1; setTimeout(() => { if (!tgt.dead && !a.dead) { hurtFoe(tgt, (a.big ? 16 : a.ut === 'shield' ? 3.6 : 6) * S.allyPow * (1 + G.d / 240) * (G.rallyOn > 0 ? 1.6 : 1) * weakMul(tgt, a.big ? 'sword' : a.ut), a.x, a.y, 30, 'ally'); burst(tgt.x, tgt.y - 24, 3, ['#ffffff', '#c9a2ff'], 120, 0.25); } }, 180); }
  }
  G.allies = G.allies.filter(a => !a.dead || false);
  if (G.bones) { for (const b of G.bones) { b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; near(b.x, b.y + 50, 70, f => { if (b.t > 9 || f.dead) return; if (Math.hypot(f.x - b.x, f.y - f.h * 0.45 - b.y) < f.r + 8) { hurtFoe(f, b.dmg * weakMul(f, 'arch'), b.x - b.vx * 0.05, b.y - b.vy * 0.05, 40, 'ally'); burst(b.x, b.y, 3, ['#e8dcc0', '#ffffff'], 120, 0.2); b.t = 9; } }); } G.bones = G.bones.filter(b => b.t < 0.7); }   /* 해골 궁수의 뼈 화살 */
  /* 영혼 줍기 */
  for (const o of G.orbs) { o.t += dt; const d = Math.hypot(P.x - o.x, P.y - 20 - o.y); if (d < S.magnet || o.pull) { o.pull = 1; const v = 380 + o.t * 200; o.x += (P.x - o.x) / d * v * dt; o.y += (P.y - 20 - o.y) / d * v * dt; if (d < 16) { o.got = 1; gainXp(o.v); } } }
  if (G.hearts) { for (const h of G.hearts) { h.t += dt; if (Math.hypot(P.x - h.x, P.y - 20 - h.y) < 34) { h.got = 1; P.hp = Math.min(P.max, P.hp + P.max * 0.25); say('+체력', P.x, P.y - 110, { size: 18, col: '#7dffa0' }); SND.play('up', 0.4, 1.5); } } G.hearts = G.hearts.filter(h => !h.got && h.t < 40); }
  G.orbs = G.orbs.filter(o => !o.got); if (G.orbs.length > 400) { let s = 0; for (const o of G.orbs.splice(0, G.orbs.length - 300)) s += o.v; G.orbs[0] && (G.orbs[0].v += s); }
  G.foes = G.foes.filter(f => !f.dead && Math.hypot(f.x - P.x, f.y - P.y) < Math.hypot(W, H) * 1.6);
  updateFx(dt);
}
function gainXp(v) { const G2 = G; G2.xp += v; SND.play('soul', 0.12, rnd(1.1, 1.5)); while (G2.xp >= G2.next) { G2.xp -= G2.next; G2.lvl++; G2.next = Math.round(3 + G2.lvl * 2.2 + Math.pow(G2.lvl, 1.4)); if (G2.cards) G2.queue = (G2.queue || 0) + 1; else G2.cards = rollCards(); SND.play('up', 0.6); burst(G.P.x, G.P.y - 40, 24, ['#ffe08a', '#fff', '#c9a2ff'], 300); } }

function weapons(dt) {
  const P = G.P, S = G.S, W_ = G.W, h = S.haste;
  /* 영혼탄 */
  if (W_.bolt) { G.cd.bolt -= dt; if (G.cd.bolt <= 0) { const l = W_.bolt, n = 1 + (l >= 2) + (l >= 4) + (l >= 6) * 2 + (G.E.bolt ? 3 : 0), tgt = nearestFoe(P.x, P.y, 520); if (tgt) { G.cd.bolt = 0.85 * h; P.cast = 0.2; P.dir = Math.sign(tgt.x - P.x) || P.dir; const base = Math.atan2(tgt.y - tgt.h * 0.4 - (P.y - 50), tgt.x - P.x);
    for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * 0.18; G.shots.push({ x: P.x + P.dir * 34, y: P.y - 58, vx: Math.cos(a) * 460, vy: Math.sin(a) * 460, t: 0, dmg: 12 * (1 + 0.4 * (l >= 3) + 0.4 * (l >= 5)) * (G.E.bolt ? 1.5 : 1), pierce: G.E.bolt ? 99 : l >= 4 ? 2 : 0, hit: new Set() }); } } } }
  for (const s of G.shots) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; near(s.x, s.y + 50, 70, f => { if (s.t > 9 || s.hit.has(f) || f.dead) return; if (Math.hypot(f.x - s.x, f.y - f.h * 0.45 - s.y) < f.r + 10) { s.hit.add(f); hurtFoe(f, s.dmg, s.x - s.vx * 0.05, s.y - s.vy * 0.05, 70, 'bolt'); burst(s.x, s.y, 5, ['#d9c2ff', '#ffffff', '#8a4dff'], 150, 0.3); if (s.pierce-- <= 0) s.t = 9; } }); }
  G.shots = G.shots.filter(s => s.t < 1.4);
  /* 뼈 방패 */
  if (W_.orbit) { const l = W_.orbit, n = G.E.orbit ? 8 : 2 + (l >= 2) + (l >= 4) + (l >= 5) * 2, R = G.E.orbit ? 115 : l >= 4 ? 92 : 74, dmg = 10 * (l >= 3 ? 1.5 : 1) * (G.E.orbit ? 2 : 1); G.orbA = (G.orbA || 0) + dt * 3.2;
    G.orbP = []; for (let i = 0; i < n; i++) { const a = G.orbA + i * 6.283 / n, x = P.x + Math.cos(a) * R, y = P.y - 30 + Math.sin(a) * R * 0.75; G.orbP.push({ x, y, a });
      near(x, y + 50, 70, f => { if (f.dead) return; f.orbT = f.orbT || 0; if (G.t < f.orbT) return; if (Math.hypot(f.x - x, f.y - f.h * 0.4 - y) < f.r + 14) { f.orbT = G.t + 0.45; hurtFoe(f, dmg, P.x, P.y - 30, 110, 'orbit'); } }); } }
  /* 저주 늪 */
  if (W_.pool) { G.cd.pool -= dt; if (G.cd.pool <= 0) { const l = W_.pool, n = 1 + (l >= 2) + (l >= 5) * 2; G.cd.pool = 2.6 * h; for (let i = 0; i < n; i++) { const f = G.foes.filter(o => !o.dead && Math.hypot(o.x - P.x, o.y - P.y) < 330)[Math.floor(Math.random() * 40)] || nearestFoe(P.x, P.y, 330); if (f) G.pools.push({ x: f.x + rnd(-20, 20), y: f.y + rnd(-10, 10), t: 0, life: 3, r: 58 * (l >= 3 ? 1.4 : 1), dps: 14 * (l >= 4 ? 1.6 : 1) }); } } }
  for (const p of G.pools) { p.t += dt; near(p.x, p.y, p.r, f => { if (!f.dead && (f.x - p.x) ** 2 / (p.r * p.r) + (f.y - p.y) ** 2 / (p.r * p.r * 0.4) < 1) { f.poolT = (f.poolT || 0) + dt; f.slowT = 0.3; f.inPool = G.t + 0.4; if (f.poolT > 0.35) { f.poolT = 0; hurtFoe(f, p.dps * 0.35, f.x, f.y, 0, 'pool'); } } }); }
  G.pools = G.pools.filter(p => p.t < p.life);
  /* 영혼 사슬 */
  if (W_.chain) { G.cd.chain -= dt; if (G.cd.chain <= 0) { const l = W_.chain, jumps = G.E.chain ? 8 : 2 + (l >= 2) + (l >= 4) * 2, dmg = 18 * (l >= 3 ? 1.5 : 1); let from = { x: P.x, y: P.y - 50 }, f = nearestFoe(P.x, P.y, 280); if (f) { G.cd.chain = (l >= 5 ? 1.6 : 2.2) * h; const hit = new Set(), pts = [from];
    for (let k = 0; k <= jumps && f; k++) { hit.add(f); pts.push({ x: f.x, y: f.y - f.h * 0.5 }); hurtFoe(f, dmg, from.x, from.y, 40, 'chain'); if (G.E.chain) f.rootT = Math.max(f.rootT || 0, 0.6); from = f; let nb = null, nd = 160 * 160; for (const o of G.foes) { if (o.dead || hit.has(o)) continue; const d = (o.x - f.x) ** 2 + (o.y - f.y) ** 2; if (d < nd) { nd = d; nb = o; } } f = nb; }
    G.zaps.push({ pts, t: 0 }); SND.play('hit', 0.3, 1.8); } } }
  /* 망자의 손 */
  if (W_.hands) { G.cd.hands -= dt; if (G.cd.hands <= 0) { const l = W_.hands, n = 1 + (l >= 2) + (l >= 4) * 2, dmg = 16 * (l >= 5 ? 1.8 : 1), root = l >= 3 ? 1.6 : 1.0; G.cd.hands = 2.6 * h; const cand = G.foes.filter(o => !o.dead && !o.boss && Math.hypot(o.x - P.x, o.y - P.y) < 320);
    for (let i = 0; i < n && cand.length; i++) { const f = cand.splice(Math.floor(Math.random() * cand.length), 1)[0]; f.rootT = root; G.handFx.push({ x: f.x, y: f.y, t: 0 }); hurtFoe(f, dmg, f.x, f.y + 10, 0, 'hands'); } if (n) SND.play('rise', 0.18, 1.4); } }
  /* 사신의 낫 */
  if (W_.scythe) { G.cd.scythe -= dt; const l = W_.scythe; if (G.cd.scythe <= 0) { G.cd.scythe = (G.E.scythe ? 1.2 : l >= 4 ? 2.4 : 3.2) * h; G.sweep = { t: 0, r: 120 * (l >= 3 ? 1.3 : 1) * (G.E.scythe ? 1.25 : 1), dmg: 30 * (l >= 2 ? 1.5 : 1) * (l >= 5 ? 1.8 : 1), hit: new Set() }; SND.play('slam', 0.25, 1.6); } }
  if (G.sweep) { const s = G.sweep; s.t += dt; const a = s.t / 0.32 * 6.283; near(P.x, P.y, s.r, f => { if (f.dead || s.hit.has(f)) return; const fa = Math.atan2(f.y - P.y, f.x - P.x); let da = ((a % 6.283) - ((fa + 6.283) % 6.283) + 6.283) % 6.283; if (da < 0.9 && Math.hypot(f.x - P.x, (f.y - P.y) / 0.7) < s.r) { s.hit.add(f); hurtFoe(f, s.dmg, P.x, P.y, 160, 'scythe'); } }); if (s.t > 0.36) G.sweep = null; }
}
function bossAct(b, dt, d) {
  b.actT -= dt; b.af += dt * 20;
  if (b.act === 'idle' && b.actT <= 0 && d < 420) { b.act = 'raise'; b.af = 0; b.at = 0; G.slam = { x: G.P.x, y: G.P.y, r: 120 + G.ch * 15, t: 0 }; }
  else if (b.act === 'raise') { b.at += dt; if (b.at >= 1.0) { b.act = 'slam'; b.af = 0; b.at = 0; } }
  else if (b.act === 'slam') { b.at += dt; if (b.at >= 0.15 && G.slam) { shake = 22; SND.play('boom', 0.7); const s = G.slam; burst(s.x, s.y, 40, ['#e8dcc0', '#9a7ad8', '#ff8a6a'], 400, 0.8); G.ring = { x: s.x, y: s.y, r: s.r, t: 0 }; if (Math.hypot((G.P.x - s.x), (G.P.y - s.y) / 0.6) < s.r) hurtLord(28 * (1 + G.ch * 0.3), 'boss'); for (const a of G.allies) if (Math.hypot(a.x - s.x, (a.y - s.y) / 0.6) < s.r) a.hp -= 22; G.slam = null; }
    if (b.at >= 0.6) { b.act = 'idle'; b.actT = Math.max(1.4, 2.6 - G.ch * 0.4); } }
}
function updateFx(dt) {
  for (const p of G.fx) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.vx *= 0.97; }
  G.fx = G.fx.filter(p => p.t < p.life);
  for (const t of G.texts) { t.t += dt; t.y += t.vy * dt; } G.texts = G.texts.filter(t => t.t < t.life);
  for (const m of G.marks) m.t += dt; G.marks = G.marks.filter(m => m.t < 0.9);
  for (const d of G.dead) d.t += dt; G.dead = G.dead.filter(d => d.t < 0.5); for (const p of G.pillars) p.t += dt; G.pillars = G.pillars.filter(p => p.t < 0.55);
  for (const z of G.zaps) z.t += dt; G.zaps = G.zaps.filter(z => z.t < 0.2); for (const q of G.handFx) q.t += dt; G.handFx = G.handFx.filter(q => q.t < 0.8); G.flashW = Math.max(0, (G.flashW || 0) - dt * 2);
  G.rallyCd -= dt; G.rallyOn -= dt; { let n = 0; for (const a of G.allies) if (!a.dead) n++; if (n > (G.armyMax || 0)) G.armyMax = n; } if (G.slam) G.slam.t += dt; if (G.ring) { G.ring.t += dt; if (G.ring.t > 0.5) G.ring = null; } if (G.banner) { G.banner.t += dt; if (G.banner.t > 2.6) G.banner = null; } if (G.gemPop > 0) G.gemPop -= dt; if (G.weakTip) { G.weakTip.t += dt; if (G.weakTip.t > 7 || !G.boss) G.weakTip = null; } if (G.clr) { G.clr.t += dt; if (G.clr.t > (G.clr.boss ? 3.4 : 2.6)) G.clr = null; } if (G.bossSay) { G.bossSay.t += dt; if (G.bossSay.t > 2.8) G.bossSay = null; } if (G.boss && !G.boss.dead && !G.bossHalf && G.boss.hp < G.boss.max * 0.5) { G.bossHalf = 1; G.bossSay = { s: CHAPTERS[G.ch].lines[1], t: 0 }; }
}
/* ── 오늘의 임무(하루 3개 · 날짜 바뀌면 새로) ── */
const DAILY = [{ key: 'k', name: '적 500명 쓰러뜨리기', need: 500, gem: 40 }, { key: 's', name: '스테이지 5개 돌파하기', need: 5, gem: 40 }, { key: 'e', name: '마법 진화 1번 하기', need: 1, gem: 40 }];
function today() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function dayFix() { if (META.dd !== today()) { META.dd = today(); META.dq = { k: 0, s: 0, e: 0 }; META.dc = [0, 0, 0, 0]; saveMeta(); } }
function dailyReady() { dayFix(); return DAILY.filter((m, i) => !META.dc[i] && META.dq[m.key] >= m.need).length + (DAILY.every((m, i) => META.dc[i]) && !META.dc[3] ? 1 : 0); }
/* ── 상점(시험판: 실제 결제 없음 · 진짜 결제는 대표님 결정 뒤 window.MANGJA_PAY(상품, 성공 시 부를 함수)로 끼움) ── */
/* 가격: 던전 히어로 결정(11-17 23:38) 그대로 — 앱 ≈ 웹 × 1.25 · 한 건 최고 웹 119,000 / 앱 149,000 · 광고 · 광고 제거는 앱에만(11-17 18:21) */
const IS_APP = Q.has('app') || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
const SHOP = [
  { id: 'first', name: '첫 결제 특가', sub: '결정 600 + 장군 열기', web: 1100, app: 1500, once: 1, give: () => { META.gems += 600; META.lord1 = 1; } },
  { id: 'g2', name: '결정 1,300', sub: '+20% 더 · 많이 사요', web: 9900, app: 12000, give: () => { META.gems += 1300; } },
  { id: 'g3', name: '결정 3,300', sub: '+35% 더', web: 23000, app: 29000, give: () => { META.gems += 3300; } },
  { id: 'g4', name: '결정 19,000', sub: '+60% 더 · 가장 큰 묶음', web: 119000, app: 149000, give: () => { META.gems += 19000; } },
  { id: 'box11', name: '유물 상자 11개', sub: '10번 값에 11번', web: 9900, app: 12000, give: () => { openBox(11); MODE = 'box'; } },
  { id: 'pass', name: '성장 패스', sub: '결정 8,300 + 상자 12개', web: 11000, app: 13900, once: 1, give: () => { META.passBuy = 1; } },
  { id: 'month', name: '월정액', sub: '매일 결정 100 · 30일', web: 9900, app: 12000, give: () => { META.gems += 300; META.monthUntil = Math.max(Date.now(), META.monthUntil || 0) + 30 * 864e5; } },
  { id: 'lordpack', name: '군주 묶음', sub: '두 군주 열기 + 결정 500', web: 9900, app: 12000, once: 1, give: () => { META.lordpack = 1; META.gems += 500; } },
  { id: 'awake', name: () => `군주 각성 ${(META.awake || 0) + 1}단계`, sub: '공격 ×1.3 · 군단 +3', web: [22000, 44000, 99000], app: [27500, 55000, 119000], tiers: 3, give: () => { META.awake = (META.awake || 0) + 1; if (G && MODE === 'play') { G.S.pow *= 1.3; G.S.cap += 3; } } },
  { id: 'speed', name: '2배속 (영구)', sub: '싸움이 두 배로 빨라요', web: 19000, app: 24000, once: 1, give: () => { META.speed2 = 1; META.spd = 2; } },
  { id: 'noad', name: '광고 제거', sub: '부활 · 2배를 광고 없이(영구)', web: 0, app: 28000, once: 1, appOnly: 1, give: () => { META.noad = 1; } }].filter(it => IS_APP || !it.appOnly);
const won = n => '₩' + n.toLocaleString('ko-KR');
function monthCheck() { if ((META.monthUntil || 0) > Date.now() && META.monthDay !== today()) { META.monthDay = today(); META.gems += 100; saveMeta(); toast('월정액: 오늘의 결정 100'); } }
const nmOf = it => typeof it.name === 'function' ? it.name() : it.name, priceOf = it => { const p = IS_APP ? it.app : it.web; return Array.isArray(p) ? p[Math.min(p.length - 1, META.awake || 0)] : p; }, gotOf = it => it.tiers ? (META.awake || 0) >= it.tiers : it.once && META.bought && META.bought[it.id];
function buy(it) { const nm = nmOf(it); const ok = () => { it.give(); if (it.once) { META.bought = META.bought || {}; META.bought[it.id] = 1; } saveMeta(); SND.play('win', 0.5); toast(`${nm} 받았어요`); };
  if (window.MANGJA_PAY) window.MANGJA_PAY(it.id, ok); else { ok(); toast(`${nm} 받았어요 (시험판 · 돈은 안 나가요)`); } }
/* ── 유물 상자: 소과금도 운이 좋으면 크게 앞서는 장치 · 50번 안에 전설 반드시(천장) ── */
const RELICS = [
  { r: 0, name: '일반', col: '#c9c2d8', p: 0.70, fx: [['p', 1.02, '공격 ×1.02'], ['h', 1.03, '체력 ×1.03'], ['g', 0.02, '결정 +2%']] },
  { r: 1, name: '희귀', col: '#7ab8ff', p: 0.25, fx: [['p', 1.06, '공격 ×1.06'], ['h', 1.08, '체력 ×1.08'], ['g', 0.06, '결정 +6%']] },
  { r: 2, name: '영웅', col: '#c48aff', p: 0.045, fx: [['p', 1.15, '공격 ×1.15'], ['h', 1.2, '체력 ×1.2'], ['g', 0.15, '결정 +15%']] },
  { r: 3, name: '전설', col: '#ffd23a', p: 0.005, fx: [['p', 1.5, '공격 ×1.5'], ['c', 5, '군단 +5'], ['g', 0.4, '결정 +40%']] }];
let BOXR = null;
function relOf() { const R = META.rel || {}; return { p: R.p || 1, h: R.h || 1, g: R.g || 0, c: R.c || 0 }; }
function openBox(n) { const out = []; META.rel = relOf(); for (let i = 0; i < n; i++) { META.pity = (META.pity || 0) + 1; let x = Math.random(), k = 0; for (; k < 3; k++) { if (x < RELICS[k].p) break; x -= RELICS[k].p; } if (META.pity >= 50) k = 3; if (k === 3) META.pity = 0;
    const T = RELICS[k], f = T.fx[Math.floor(Math.random() * T.fx.length)]; if (f[0] === 'g' || f[0] === 'c') META.rel[f[0]] += f[1]; else META.rel[f[0]] *= f[1]; out.push({ k, t: f[2] }); }
  if (G && MODE !== 'title') { /* 판에는 다음 출전 때 들어감 */ } saveMeta(); BOXR = out.sort((a, b) => b.k - a.k); SND.play(out.some(o => o.k >= 2) ? 'win' : 'up', 0.6); }
/* ── 성장 패스: 스테이지 5마다 한 칸 · 무료 줄 + 유료 줄(웹 11,000 / 앱 13,900) ── */
let PASSPG = 0;
const PASS_N = 20, passNow = () => Math.min(PASS_N, Math.floor((META.bestStage || 0) / 5));
const passFree = t => 30 + t * 10, passPaid = t => 100 + t * 30;
function passReady() { const n = passNow(), F = META.passF || [], Pp = META.passP || []; let c = 0; for (let t = 1; t <= n; t++) { if (!F[t]) c++; if (META.passBuy && !Pp[t]) c++; } return c; }
function drawPass() {
  drawBg(); txt('성장 패스', W / 2, 50, 30, '#ffe08a'); txt(`스테이지 5마다 한 칸 · 지금 ${passNow()}/${PASS_N}칸`, W / 2, 84, 14, '#d9c8ff', { w: 800 });
  const cw = Math.min(W - 24, 400), x = (W - cw) / 2; let y = 106;
  if (!META.passBuy) { const it = SHOP.find(i => i.id === 'pass'); button(x, y, cw, 46, `유료 줄 열기 · ${won(priceOf(it))}`, () => buy(it), { gold: 1, size: 16 }); y += 56; } else { txt('유료 줄 열림 ✦', W / 2, y + 14, 15, '#ffd23a'); y += 34; }
  txt('무료', x + cw * 0.5, y + 8, 13, '#c9b8e8', { w: 800 }); txt('유료', x + cw * 0.82, y + 8, 13, '#ffd23a', { w: 800 }); y += 22;
  const F = META.passF = META.passF || [], Pp = META.passP = META.passP || [], rh = Math.min(64, (H - y - 150) / 5);
  for (let i = 0; i < 5; i++) { const t = PASSPG * 5 + i + 1; if (t > PASS_N) break; const ok = passNow() >= t;
    ctx.fillStyle = ok ? 'rgba(40,24,70,.92)' : 'rgba(20,12,34,.85)'; rr(x, y, cw, rh - 6, 10); ctx.fill();
    txt(`스테이지 ${t * 5}`, x + 12, y + (rh - 6) / 2, 14, ok ? '#fff' : '#8f84a6', { align: 'left' });
    const bw = cw * 0.28, bh = rh - 18, fx = x + cw * 0.5 - bw / 2, px = x + cw * 0.82 - bw / 2, by = y + 6;
    button(fx, by, bw, bh, F[t] ? '받음' : `결정 ${passFree(t)}`, () => { if (ok && !F[t]) { F[t] = 1; META.gems += passFree(t); saveMeta(); SND.play('up', 0.5); } }, { gold: ok && !F[t], off: !ok || F[t], size: 13 });
    const pl = t % 5 === 0 ? `${passPaid(t)}+상자3` : `결정 ${passPaid(t)}`;
    button(px, by, bw, bh, Pp[t] ? '받음' : META.passBuy ? pl : '🔒 ' + pl, () => { if (ok && META.passBuy && !Pp[t]) { Pp[t] = 1; META.gems += passPaid(t); if (t % 5 === 0) { openBox(3); MODE = 'pass'; toast('유물 상자 3개를 열었어요'); } saveMeta(); SND.play('up', 0.5); } }, { gold: ok && META.passBuy && !Pp[t], off: !(ok && META.passBuy) || Pp[t], size: 12 });
    y += rh; }
  if (PASSPG > 0) button(x, H - 140, 64, 44, '◀', () => { PASSPG--; }, { size: 16 }); if ((PASSPG + 1) * 5 < PASS_N) button(x + cw - 64, H - 140, 64, 44, '▶', () => { PASSPG++; }, { size: 16 });
  txt(`${PASSPG * 5 + 1}~${Math.min(PASS_N, PASSPG * 5 + 5)}칸`, W / 2, H - 118, 13, '#9a8fae', { w: 700 });
  button(W / 2 - 120, H - 80, 240, 56, '돌아가기', () => { MODE = 'title'; }, {});
}
function drawBox() {
  drawBg(); txt('유물 상자', W / 2, 50, 30, '#ffe08a'); const R = relOf();
  txt(`모은 유물: 공격 ×${R.p.toFixed(2)} · 체력 ×${R.h.toFixed(2)} · 결정 +${Math.round(R.g * 100)}% · 군단 +${R.c}`, W / 2, 84, 13, '#d9c8ff', { w: 800, box: W - 24 });
  txt(`전설까지 ${50 - (META.pity || 0)}번 안에 반드시`, W / 2, 106, 13, '#ffd23a', { w: 800 });
  const cw = Math.min(W - 32, 380), x = (W - cw) / 2; let y = 126;
  if (BOXR) { const rows = BOXR.slice(0, 11), rh = Math.min(30, (H - 220 - 136) / rows.length); for (const o of rows) { const T = RELICS[o.k]; ctx.fillStyle = 'rgba(30,18,52,.9)'; rr(x, y, cw, rh - 4, 8); ctx.fill(); ctx.strokeStyle = T.col; ctx.lineWidth = o.k >= 2 ? 2 : 1; ctx.stroke(); txt(T.name, x + 12, y + (rh - 4) / 2, 13, T.col, { align: 'left' }); txt(o.t, x + cw - 12, y + (rh - 4) / 2, 14, '#fff', { align: 'right' }); y += rh; } }
  else { RELICS.forEach(T => { txt(`${T.name} ${(T.p * 100).toFixed(T.p < 0.01 ? 1 : 0)}% — ${T.fx.map(f => f[2]).join(' · ')}`, W / 2, y + 12, 12, T.col, { w: 700, box: W - 24 }); y += 26; }); }
  const by = H - 220; const can1 = META.gems >= 300, can10 = META.gems >= 2700;
  button(x, by, cw / 2 - 5, 56, '1번 · 결정 300', () => { if (META.gems >= 300) { META.gems -= 300; openBox(1); } }, { gold: can1, off: !can1, size: 15 });
  button(x + cw / 2 + 5, by, cw / 2 - 5, 56, '10번 · 결정 2,700', () => { if (META.gems >= 2700) { META.gems -= 2700; openBox(10); } }, { gold: can10, off: !can10, size: 15 });
  txt(`가진 결정 ${META.gems}`, W / 2, by + 76, 14, '#ffe9c0', { w: 800 }); txt('유물은 다음 출전부터 들어가요', W / 2, by + 98, 12, '#9a8fae', { w: 700 });
  button(W / 2 - 120, H - 80, 240, 56, '돌아가기', () => { MODE = 'title'; }, {});
}
function drawShop() {
  drawBg(); txt('상점', W / 2, 50, 30, '#ffe08a'); txt('시험판 — 실제 결제는 일어나지 않아요', W / 2, 82, 13, '#ff9a8a', { w: 800 });
  const cw = Math.min(W - 24, 420), x0 = (W - cw) / 2, gw = (cw - 10) / 2, gh = Math.min(104, (H - 210) / Math.ceil(SHOP.length / 2) - 10); let i = 0;
  for (const it of SHOP) { const x = x0 + (i % 2) * (gw + 10), y = 104 + Math.floor(i / 2) * (gh + 10), got = gotOf(it); i++;
    ctx.fillStyle = 'rgba(30,18,52,.92)'; rr(x, y, gw, gh, 12); ctx.fill(); ctx.strokeStyle = it.id === 'first' ? '#ff8ad2' : '#4a3678'; ctx.lineWidth = it.id === 'first' ? 2 : 1; ctx.stroke();
    const sm = gh < 90; icon(it.id[0] === 'g' ? 'relic_glass' : it.id === 'noad' ? 'chest2' : it.id === 'month' ? 'relic_crown' : it.id === 'awake' ? 'u_magic' : it.id === 'speed' ? 'relic_ring' : 'lord', x + 22, y + (sm ? 22 : 26), sm ? 28 : 34);
    txt(got && it.tiers ? '군주 각성 완료' : nmOf(it), x + 42, y + (sm ? 15 : 20), 15, '#fff', { align: 'left', box: gw - 48 }); txt(it.sub, x + 42, y + (sm ? 32 : 40), 11, '#c9b8e8', { align: 'left', w: 700, box: gw - 48 });
    const price = priceOf(it); button(x + 8, y + gh - (sm ? 32 : 42), gw - 16, sm ? 27 : 34, got ? '가짐' : won(price), () => { if (!got) buy(it); }, { off: got, size: 15 }); }
  txt(IS_APP ? '앱 가격' : '웹 가격 — 앱보다 싸요', W / 2, H - 98, 12, '#9a8fae', { w: 700 });
  button(W / 2 - 120, H - 80, 240, 56, '돌아가기', () => { MODE = 'title'; }, {});
}
function drawDaily() {
  dayFix(); drawBg(); txt('오늘의 임무', W / 2, 54, 30, '#ffe08a'); txt('매일 새로 바뀌어요', W / 2, 88, 14, '#9a8fae', { w: 700 });
  const cw = Math.min(W - 32, 400), x = (W - cw) / 2; let y = 116;
  DAILY.forEach((m, i) => { const v = Math.min(m.need, META.dq[m.key] || 0), ok = v >= m.need, got = META.dc[i];
    ctx.fillStyle = 'rgba(30,18,52,.92)'; rr(x, y, cw, 84, 14); ctx.fill(); ctx.strokeStyle = ok && !got ? '#ffd23a' : '#4a3678'; ctx.lineWidth = 2; ctx.stroke();
    txt(m.name, x + 18, y + 28, 17, '#fff', { align: 'left', box: cw - 130 }); ctx.fillStyle = 'rgba(0,0,0,.5)'; rr(x + 18, y + 50, cw - 196, 12, 6); ctx.fill(); ctx.fillStyle = ok ? '#8affb0' : '#9a6aff'; rr(x + 18, y + 50, Math.max(12, (cw - 196) * v / m.need), 12, 6); ctx.fill();
    txt(`${v} / ${m.need}`, x + cw - 116, y + 56, 12, '#c9b8e8', { align: 'right' });
    button(x + cw - 104, y + 20, 92, 44, got ? '받음' : `결정 ${m.gem}`, () => { if (ok && !got) { META.dc[i] = 1; META.gems += m.gem; saveMeta(); SND.play('win', 0.5); } }, { gold: ok && !got, off: !ok || got, size: 15 }); y += 96; });
  const all = DAILY.every((m, i) => META.dc[i]); ctx.fillStyle = 'rgba(60,30,10,.85)'; rr(x, y, cw, 64, 14); ctx.fill(); txt('3개 모두 받으면 보너스', x + 18, y + 32, 16, '#ffe9c0', { align: 'left' });
  button(x + cw - 104, y + 10, 92, 44, META.dc[3] ? '받음' : '결정 60', () => { if (all && !META.dc[3]) { META.dc[3] = 1; META.gems += 60; saveMeta(); SND.play('win', 0.6); } }, { gold: all && !META.dc[3], off: !all || META.dc[3], size: 15 });
  button(W / 2 - 120, H - 80, 240, 56, '돌아가기', () => { MODE = 'title'; }, {});
}
/* ══ 방치형: 스테이지 · 후퇴 · 저장 (11-18 23:16 대표님 「방치형하자」) ══ */
function setStage(s) { G.stage = Math.max(1, s); G.ch = Math.floor((G.stage - 1) / 20) % 3; G.d = 12 + (G.stage - 1) * 11; G.stK = 0; G.stBoss = G.stage % 10 === 0; G.stNeed = G.stBoss ? 1 : 18 + Math.min(42, G.stage * 2); G.bossT = G.stBoss ? 2.5 : 0; G.bossOn = 0; G.boss = null; }
function idleTick(dt) { if (BOT && Q.has('buy') && (G.buyT = (G.buyT || 0) + dt) > 4) { G.buyT = 0; const u = META_UP.filter(u => META.up[u.id] < u.max).sort((a, b) => a.cost(META.up[a.id]) - b.cost(META.up[b.id]))[0]; if (u) buyUp(u); }   /* 시험 봇: 싼 강화부터 산다(사람 흉내) */
  if (G.stBoss && !G.bossOn && G.bossT > 0) { G.bossT -= dt; if (G.bossT <= 0) spawnBoss(); } if ((G.saveT = (G.saveT || 0) + dt) > 20) { G.saveT = 0; saveRun(); } }
function gemMul() { return (1 + META.up.gold * 0.1 + relOf().g) * ((META.monthUntil || 0) > Date.now() ? 1.2 : 1); }   /* 월정액 쓰는 동안 결정 +20% */
function weakMul(f, ut) { return f && f.boss && CHAPTERS[G.ch].weak === (ut || 'sword') ? 1.5 : 1; }   /* 보스 약점 병종 피해 1.5배 */
const FORM = [{ n: '균형', k: null, d: '쓰러뜨린 적 종류대로' }, { n: '검', k: 'sword', d: '검 해골 60% · 고르게 셈' }, { n: '활', k: 'arch', d: '활 해골 60% · 뒤에서 쏨' }, { n: '방패', k: 'shield', d: '방패 해골 60% · 오래 버팀' }];
function stageClear() { const s = G.stage, gain = Math.round((3 + s * 0.6) * (s % 10 === 0 ? 5 : 1) * gemMul());
  META.gems += gain; META.stage = Math.max(META.stage || 1, s + 1); if (s % 20 === 0) META.open = Math.max(META.open || 1, Math.min(3, 1 + s / 20)); META.bestStage = Math.max(META.bestStage || 0, s); dayFix(); META.dq.s = (META.dq.s || 0) + 1;
  SND.play('win', s % 10 === 0 ? 0.8 : 0.35); setStage(s + 1); G.banner = null; G.P.cast = 0.2;
  const ng = Math.min(14, 5 + Math.floor(gain / 8)); G.clr = { t: s % 10 === 0 ? -1.3 : 0, s, gain, boss: s % 10 === 0, reg: s % 20 === 0 ? CHAPTERS[G.ch].name : null, g: Array.from({ length: ng }, (_, i) => ({ x: W / 2 + rnd(-100, 100), y: H * 0.52 - rnd(0, 90), d: 0.35 + i * 0.06, done: 0 })) };   /* 돌파 연출: 글자 튀어나옴 · 결정이 날아가 위 칸에 들어감 · 군단 환호 · 다음 스테이지 소개 */
  saveRun(); saveMeta(); }
function clrLeft() { const c = G && G.clr; if (!c) return 0; let n = 0; for (const g of c.g) if (!g.done) n++; return Math.round(c.gain * n / c.g.length); }
function retreat() { const P = G.P; G.retreats = (G.retreats || 0) + 1; P.hp = P.max; P.inv = 3; for (const f of G.foes) f.dead = true; G.foes = []; G.arrows = []; G.slam = null; G.bossSay = null;
  G.allies = G.allies.filter((a, i) => i % 2 === 0); const s = Math.max(1, G.stage - 1); setStage(s); G.banner = { text: `후퇴! 스테이지 ${s}에서 힘 모으기`, t: 0 }; shake = 14; SND.play('slam', 0.5); saveRun(); }
function saveRun() { if (!G || !G.idle || BOT) return; META.run = META.run || {}; META.run[G.lord] = { lvl: G.lvl, xp: G.xp, next: G.next, W: G.W, L: G.L, E: G.E, S: G.S, max: G.P.max, kills: G.kills, U: { ...META.up }, aw: META.awake || 0, rel: relOf() }; saveMeta(); }
function loadRun() { const aw = META.awake || 0; if (BOT || Q.has('fresh')) return; const R = META.run && META.run[G.lord]; if (!R) return; Object.assign(G, { lvl: R.lvl, xp: R.xp, next: R.next, W: R.W, L: R.L, E: R.E, S: R.S, kills: R.kills || 0 }); G.P.max = R.max;
  const o = R.U || {}, u = META.up; G.S.pow *= POWM(u.pow) / POWM(o.pow || 0); G.S.rise += (u.rise - (o.rise || 0)) * 0.03; G.S.cap += (u.cap - (o.cap || 0)) * 2; G.S.pow *= Math.pow(1.3, aw - (R.aw || 0)); G.S.cap += (aw - (R.aw || 0)) * 3; { const r = relOf(), q = R.rel || { p: 1, h: 1, c: 0 }; G.S.pow *= r.p / q.p; G.P.max *= r.h / q.h; G.S.cap += r.c - q.c; } G.P.max *= HPM(u.hp) / HPM(o.hp || 0); G.P.hp = G.P.max; }   /* 저장 뒤에 산 군주 강화도 바로 들어가게 */
function endRun() {
  dayFix(); META.dq.k += G.kills; if (G.t >= 300) META.dq.s = 1; META.dq.e += Object.keys(G.E).length;
  const gain = Math.round((G.kills / 6 + G.t / 10 + (G.win ? 120 : 0)) * (1 + META.up.gold * 0.1));
  let unlock = 0; if (G.win && G.ch + 1 < CHAPTERS.length && META.open < G.ch + 2) { META.open = G.ch + 2; unlock = 1; }
  META.gems += gain; META.runs++; META.best = Math.max(META.best, Math.round(G.t)); saveMeta();
  G.result = { why: G.why, near: G.foes.filter(f => !f.dead && Math.hypot(f.x - G.P.x, f.y - G.P.y) < 80).length, unlock, gain, win: G.win, t: G.t, kills: G.kills, lvl: G.lvl, army: G.allies.length }; MODE = 'result';
}

/* ── 그리기 ── */
let TILE = null; const GROUND = [];   /* 지역별 바닥 그림(art/ground0~2.webp, 1024칸 → 화면 512) · 없으면 그려 만든 바닥 */
const GROUND_HAS = [0, 1, 2];   /* 바닥 그림을 넣으면 여기에 지역 번호를 적는다(없는 파일을 부르지 않게) */
for (const i of GROUND_HAS) { const im = new Image(); im.onload = () => { try { const c = document.createElement('canvas'); c.width = c.height = 1024; const gx = c.getContext('2d'); gx.drawImage(im, 0, 0, 1024, 1024); if (i === 0) drawGraves(gx, 2, (q => () => (q = (q * 16807) % 2147483647) / 2147483647)(11)); const p = ctx.createPattern(c, 'repeat'); p.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, 0, 0])); GROUND[i] = p; } catch (e) {} }; im.src = 'art/ground' + i + '.webp'; }
function drawGraves(g, k, R) {
  for (let i = 0; i < 9; i++) { const x = (30 + R() * 452) * k, y = (30 + R() * 452) * k, s = (0.7 + R() * 0.6) * k; g.save(); g.translate(x, y); g.scale(s, s);   /* 비석 */
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(2, 2, 16, 5, 0, 0, 7); g.fill(); const gr = g.createLinearGradient(-12, -30, 12, 0); gr.addColorStop(0, '#6f6680'); gr.addColorStop(1, '#3d3549'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(-11, 0); g.lineTo(-11, -22); g.arc(0, -22, 11, Math.PI, 0); g.lineTo(11, 0); g.closePath(); g.fill(); g.fillStyle = 'rgba(20,10,30,.6)'; g.fillRect(-1.5, -26, 3, 14); g.fillRect(-6, -21, 12, 3); g.restore(); }
}
function makeTile() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#1d1726'; g.fillRect(0, 0, 512, 512);
  const R = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
  for (let i = 0; i < 70; i++) { const x = R() * 512, y = R() * 512, r = 20 + R() * 70, gr = g.createRadialGradient(x, y, 0, x, y, r); const c1 = R() < 0.5 ? 'rgba(60,40,80,.35)' : 'rgba(10,6,16,.35)'; gr.addColorStop(0, c1); gr.addColorStop(1, 'rgba(0,0,0,0)'); for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) { g.save(); g.translate(ox, oy); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); } }
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5; for (let i = 0; i < 26; i++) { let x = R() * 512, y = R() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 40; y += (R() - 0.5) * 24; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 140; i++) { g.fillStyle = R() < 0.5 ? 'rgba(120,100,140,.25)' : 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(R() * 512, R() * 512, 1 + R() * 3, 1 + R() * 2, 0, 0, 7); g.fill(); }
  drawGraves(g, 1, R);
  for (let i = 0; i < 14; i++) { const x = R() * 512, y = R() * 512, a = R() * 3; g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = 'rgba(220,210,190,.35)'; g.fillRect(-7, -1.5, 14, 3); g.beginPath(); g.arc(-7, 0, 2.5, 0, 7); g.arc(7, 0, 2.5, 0, 7); g.fill(); g.restore(); }
  TILE = ctx.createPattern(c, 'repeat');
}
function txt(s, x, y, size, col, o = {}) { ctx.font = `${o.w || 900} ${size}px ${FONT}`; if (o.box) { const tw = ctx.measureText(s).width; if (tw > o.box) { size = Math.max(11, Math.floor(size * o.box / tw)); ctx.font = `${o.w || 900} ${size}px ${FONT}`; } }   /* 상자보다 길면 글자를 줄여 맞춤 */ ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; if (o.stroke !== 0) { ctx.lineWidth = o.lw || Math.max(3, size * 0.16); ctx.strokeStyle = o.sc || 'rgba(8,2,16,.92)'; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); } ctx.fillStyle = col; ctx.fillText(s, x, y);
  if (CHECK) { const m = ctx.getTransform(); if (m.e === 0 && m.f === 0 && m.a === DPR) { const tw = ctx.measureText(s).width, al = ctx.textAlign, l = al === 'left' ? x : al === 'right' ? x - tw : x - tw / 2; if (l < 1 || l + tw > W - 1 || (o.box && tw > o.box)) CLIP.add(MODE + ':' + s); } } }   /* 관문용: 화면 밖 · 상자 밖으로 나간 글자 기록 */
const CHECK = Q.has('check'), CLIP = new Set();
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function button(x, y, w, h, label, fn, o = {}) {
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, o.gold ? '#ffe08a' : o.green ? '#5fe0a0' : '#8c5cff'); g.addColorStop(1, o.gold ? '#e3a21a' : o.green ? '#1f8a54' : '#5a2fc0');
  ctx.fillStyle = o.off ? '#3a3046' : g; rr(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = o.gold ? '#fff2c0' : o.green ? '#c0ffe0' : '#b99aff'; ctx.lineWidth = 2; ctx.stroke();
  txt(label, x + w / 2, y + h / 2 + 1, o.size || 20, o.off ? '#9a8fae' : '#ffffff', { box: w - 10, sc: o.gold ? '#6a3a00' : o.green ? '#06321c' : '#1a0638' }); if (!o.off) BTNS.push({ x, y, w, h, fn });
}
function icon(n, x, y, s) { const I = IMG[n]; if (I && I.complete && I.naturalWidth) ctx.drawImage(I, x - s / 2, y - s / 2, s, s); }

/* ── 광고 자리(시험판은 3초 흉내 · 출시 때 window.MANGJA_AD(끝나면 부를 함수)로 진짜 광고를 끼움) ── */
let AD = null;
function showAd(done) { if (META.noad) return done(); if (window.MANGJA_AD) { AD = { t: 999, wait: 1 }; window.MANGJA_AD(() => { AD = null; done(); }); } else AD = { t: 3, done }; }
function drawAd() { BTNS = []; ctx.fillStyle = '#05020a'; ctx.fillRect(0, 0, W, H); if (AD.wait) return; txt('광고 자리', W / 2, H * 0.42, 30, '#e9dcff'); txt('시험판 — 실제 광고는 출시 때 들어가요', W / 2, H * 0.42 + 40, 14, '#9a8fae', { w: 800 }); txt(Math.ceil(AD.t) + '', W / 2, H * 0.58, 54, '#ffe08a'); }
let TOAST = null; function toast(s) { TOAST = { s, t: 2.2 }; }
function drawOff() { BTNS = []; ctx.fillStyle = 'rgba(6,2,14,.86)'; ctx.fillRect(0, 0, W, H); const h = Math.floor(OFF.min / 60), m = OFF.min % 60, cy = H * 0.36;
  txt('군단이 일하고 있었어요', W / 2, cy, 26, '#ffe08a', { box: W - 30 }); txt(`${h ? h + '시간 ' : ''}${m}분 동안 모은 결정`, W / 2, cy + 38, 16, '#d9c8ff', { w: 800 });
  icon('relic_glass', W / 2 - 64, cy + 96, 48); txt(`+${OFF.g}`, W / 2 + 16, cy + 98, 38, '#ffe9c0'); if (OFF.min >= 480) txt('8시간이 최대예요 — 자주 들러 주세요', W / 2, cy + 140, 13, '#9a8fae', { w: 700 });
  const take = k => { META.gems += OFF.g * k; OFF = null; saveMeta(); SND.play('win', 0.6); };
  if (IS_APP) button(W / 2 - 140, cy + 168, 280, 56, '2배 받기  ·  광고', () => showAd(() => take(2)), { green: 1, size: 19 }); button(W / 2 - 140, cy + 236, 280, 50, '받기', () => take(1), { size: 18 }); }
function draw() { drawMain(); if (OFF && !AD && (MODE === 'title' || MODE === 'play')) { if (G && MODE === 'play') G.paused = G.paused || 0; drawOff(); } if (TOAST) { TOAST.t -= 1 / 60; const a = Math.min(1, TOAST.t * 2); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(10,4,20,.92)'; rr(W / 2 - 160, H - 150, 320, 46, 12); ctx.fill(); txt(TOAST.s, W / 2, H - 127, 15, '#ffe9c0', { w: 800, box: 300 }); ctx.globalAlpha = 1; if (TOAST.t <= 0) TOAST = null; } if (AD) drawAd(); }
function drawMain() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); BTNS = [];
  if (!TILE) makeTile();
  if (MODE === 'title') return drawTitle();
  if (MODE === 'meta') return drawMeta();
  if (MODE === 'daily') return drawDaily();
  if (MODE === 'shop') return drawShop();
  if (MODE === 'box') return drawBox();
  if (MODE === 'pass') return drawPass();
  const P = G.P, sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake, cx = W / 2 - P.x + sx, cy = H * 0.52 - P.y + sy;
  /* 바닥 */
  ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = GROUND[G.ch] || TILE; ctx.fillRect(P.x - W, P.y - H, W * 2, H * 2); { const tn = CHAPTERS[G.ch].tint; if (tn && !GROUND[G.ch]) { ctx.fillStyle = tn; ctx.fillRect(P.x - W, P.y - H, W * 2, H * 2); } }
  /* 늪 · 표시 */
  for (const p of G.pools) { const a = Math.min(1, p.t * 4, (p.life - p.t) * 2), gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); gr.addColorStop(0, `rgba(120,255,90,${0.45 * a})`); gr.addColorStop(0.7, `rgba(60,160,40,${0.3 * a})`); gr.addColorStop(1, 'rgba(30,80,20,0)'); ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.5); ctx.translate(-p.x, -p.y); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); ctx.restore(); }
  if (G.slam) { const s = G.slam, k = Math.min(1, s.t / 0.9); ctx.save(); ctx.translate(s.x, s.y); ctx.scale(1, 0.6); ctx.strokeStyle = `rgba(255,60,40,${0.5 + 0.4 * Math.sin(s.t * 20)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, s.r, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,40,30,.22)'; ctx.beginPath(); ctx.arc(0, 0, s.r * k, 0, 7); ctx.fill(); ctx.restore(); }
  if (G.ring) { const k = G.ring.t / 0.5; ctx.save(); ctx.translate(G.ring.x, G.ring.y); ctx.scale(1, 0.6); ctx.strokeStyle = `rgba(255,220,160,${1 - k})`; ctx.lineWidth = 10 * (1 - k) + 2; ctx.beginPath(); ctx.arc(0, 0, G.ring.r * (0.6 + k * 0.6), 0, 7); ctx.stroke(); ctx.restore(); }
  for (const m of G.marks) { const k = m.t / 0.9; ctx.save(); ctx.translate(m.x, m.y); ctx.scale(1, 0.4); ctx.strokeStyle = `rgba(190,120,255,${1 - k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 10 + k * 30, 0, 7); ctx.stroke(); ctx.restore(); }
  /* 쓰러지는 적 */
  for (const d of G.dead) { const k = d.t / 0.5; ctx.save(); ctx.translate(d.x, d.y + k * 6); ctx.rotate(d.dir * -k * 1.3); ctx.globalAlpha = 1 - k; spr(d.s, d.wf, 0, 0, d.h, d.dir, { flash: 0.1 * (1 - k) }); ctx.restore(); }
  /* 망자의 손 */
  for (const q of G.handFx) { const k = q.t / 0.8, up = k < 0.25 ? k / 0.25 : k > 0.7 ? (1 - k) / 0.3 : 1; ctx.save(); ctx.translate(q.x, q.y); ctx.fillStyle = `rgba(140,60,220,${0.45 * up})`; ctx.beginPath(); ctx.ellipse(0, 0, 26, 9, 0, 0, 7); ctx.fill(); ctx.strokeStyle = `rgba(235,225,205,${up})`; ctx.lineCap = 'round'; ctx.lineWidth = 4;
    for (let i = 0; i < 5; i++) { const ox = (i - 2) * 7, hh = (22 + (i === 2 ? 8 : i % 2 * 4)) * up; ctx.beginPath(); ctx.moveTo(ox, 2); ctx.lineTo(ox + (i - 2) * 2, -hh); ctx.lineTo(ox + (i - 2) * 4 - 3, -hh - 6 * up); ctx.stroke(); } ctx.restore(); }
  /* 영혼 */
  for (const o of G.orbs) { const r = 4 + Math.min(4, o.v); ctx.fillStyle = '#7a3aff'; ctx.beginPath(); ctx.arc(o.x, o.y, r + 2, 0, 7); ctx.fill(); ctx.fillStyle = '#d9c2ff'; ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.x - r * 0.3, o.y - r * 0.3, r * 0.35, 0, 7); ctx.fill(); }
  for (const h of G.hearts || []) { const b = Math.sin(T * 4 + h.x) * 3; ctx.save(); ctx.translate(h.x, h.y - 10 + b); ctx.fillStyle = '#ff3a5a'; ctx.strokeStyle = '#3a0010'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-14, -2, -8, -14, 0, -6); ctx.bezierCurveTo(8, -14, 14, -2, 0, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(-4, -5, 2, 0, 7); ctx.fill(); ctx.restore(); }
  /* 그림자 + 몸(아래쪽이 앞) */
  const list = []; for (const f of G.foes) list.push(f); for (const a of G.allies) list.push(a); list.push(P);
  list.sort((a, b) => a.y - b.y);
  for (const e of list) { const sh = e === P ? 20 : e.boss ? 60 : e.big ? 18 : (e.r || 12) * 1.1; ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(e.x, e.y, sh, sh * 0.32, 0, 0, 7); ctx.fill(); if (e !== P && !e.kind && e.rise >= 1) { ctx.strokeStyle = 'rgba(95,255,200,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y, sh + 3, (sh + 3) * 0.34, 0, 0, 7); ctx.stroke(); } }
  let cjOn = 0; const cjK = G.clr && G.clr.t >= 0 ? G.clr.t : 9;
  for (const e of list) { if (cjOn) { ctx.restore(); cjOn = 0; } if (cjK < 1.6 && e !== P && !e.kind && e.rise >= 1) { ctx.save(); cjOn = 1; ctx.translate(0, -Math.abs(Math.sin(cjK * 9 + e.ang * 4)) * 16 * (1 - cjK / 1.6)); }   /* 돌파 때 군단이 펄쩍펄쩍(환호) */
    if (e === P) { const h = 112, bob = P.moving ? 0 : Math.sin(T * 3) * 1.5; ctx.save(); if (P.inv > 0 && Math.floor(T * 20) % 2) ctx.globalAlpha = 0.55; { const mv = P.moving, cs = (P.cast || 0) / 0.2, b2 = mv ? -Math.abs(Math.sin(T * 10)) * 5 : bob;   /* 군주는 한 그림만(두건 군주): 걸을 땐 통통 · 기울기, 쏠 땐 늘었다 줄기 */
        spr(lordSpr('lordIdle', G.lord), T * (mv ? 22 : 14), P.x, P.y + b2, h, P.dir, { flash: P.hurt + cs * 0.12, rot: mv ? P.dir * 0.07 : 0, sx: 1 - cs * 0.06, sy: 1 + cs * 0.08 });
        if (cs > 0) { const hx = P.x + P.dir * 34, hy = P.y - 58 + b2, g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 26 * (0.5 + cs)); g.addColorStop(0, 'rgba(255,240,255,.95)'); g.addColorStop(0.4, 'rgba(180,120,255,.6)'); g.addColorStop(1, 'rgba(120,60,255,0)'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, 26 * (0.5 + cs), 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; } } ctx.restore(); continue; }
    if (e.kind) { const S = SP[e.s], atk = e.boss ? e.act !== 'idle' : e.atkA > 0, sa = SP[e.s + 'Atk'], hop = S.hop && !atk && !e.rootT ? Math.abs(Math.sin(e.wf * 0.28)) * (e.boss ? 6 : 5) : 0, br = e.boss && S.n === 1 ? 1 + Math.sin(T * 2.4) * 0.02 : 1;
      if (atk && sa) spr(e.s + 'Atk', e.boss ? Math.min(sa.n - 1, (e.act === 'raise' ? e.at / 1.0 * 8 : 8 + e.at / 0.6 * 8)) : (1 - e.atkA / 0.5) * (sa.n - 1), e.x, e.y, e.h, e.dir, { flash: e.flash, sx: 1 + (e.boss ? 0 : Math.max(0, e.flash) / 0.12 * 0.14), sy: 1 - (e.boss ? 0 : Math.max(0, e.flash) / 0.12 * 0.12) });
      else spr(e.s, S.hop ? T * 14 + e.wf * 0.1 : e.wf, e.x, e.y - hop, e.h * br, e.dir, { flash: e.flash, sy: e.boss && e.act === 'raise' ? 1.04 : 1 - (e.boss ? 0 : Math.max(0, e.flash) / 0.12 * 0.12), sx: 1 + (e.boss ? 0 : Math.max(0, e.flash) / 0.12 * 0.14) });   /* 맞으면 납작 — 손맛 */
      if (e.rootT > 0) { ctx.strokeStyle = 'rgba(200,150,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * 1.2, e.r * 0.45, 0, 0, 7); ctx.stroke(); }
      if (e.boss) continue;
      if (e.elite) { ctx.strokeStyle = 'rgba(255,200,60,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * 1.4, e.r * 0.5, 0, 0, 7); ctx.stroke(); }
      if (e.hp < e.max) { const w = e.elite ? 50 : 26; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(e.x - w / 2, e.y - e.h - 8, w, 4); ctx.fillStyle = e.elite ? '#ffb84a' : '#ff4a5a'; ctx.fillRect(e.x - w / 2, e.y - e.h - 8, w * Math.max(0, e.hp / e.max), 4); } continue; }
    /* 해골 병사 */    /* 해골 병사 */
    const h = e.big ? 104 : 70; if (e.big && e.rise >= 1) { spr('giant', T * 16 + e.wf, e.x, e.y - (Math.abs(Math.sin(e.wf * 0.25)) * 4), h, e.dir, { rim: '#5fffc8' }); continue; } if (e.rise < 1) { ctx.save(); ctx.beginPath(); ctx.rect(e.x - 60, e.y - 200, 120, 200); ctx.clip(); { const RK = e.big ? 'giant' : e.ut === 'arch' ? 'skArch' : e.ut === 'shield' ? 'skShield' : 'skWalk', ok = RK === 'skWalk' || RK === 'giant' || (IMG[SP[RK].i] && IMG[SP[RK].i].naturalWidth); spr(ok ? RK : 'skWalk', 0, e.x, e.y + h * (1 - e.rise), h, e.dir, { flash: 0.15 }); }   /* 솟을 때도 제 병종 그림 */ ctx.restore(); continue; }
    const rim = G.rallyOn > 0 ? '#ffd23a' : '#5fffc8'; let K2 = e.ut === 'arch' ? 'skArch' : e.ut === 'shield' ? 'skShield' : null;
    if (K2 && IMG[SP[K2].i] && IMG[SP[K2].i].naturalWidth) { const mv = e.wf !== e._pwf; e._pwf = e.wf; if (mv) e._mvT = 0.15; else e._mvT = (e._mvT || 0) - 1 / 60; const KW = K2 + 'W'; if (e._mvT > 0 && e.af < 0 && IMG[SP[KW].i] && IMG[SP[KW].i].naturalWidth && Math.floor(e.wf / 6) % 2) K2 = KW;   /* 걸을 때 걷는 그림과 번갈아 */ const hop = Math.abs(Math.sin(e.wf * 0.22)) * 3, at = e.af >= 0 ? Math.sin(Math.min(1, e.af) * 3.14) : 0; spr(K2, 0, e.x, e.y - hop, h * (e.ut === 'shield' ? 1.05 : 1), e.dir, { rim, flash: 0.06, rot: e.dir * (e.ut === 'arch' ? -0.12 : 0.15) * at, sx: 1 + at * 0.05 }); }   /* 궁수 · 방패 해골: 한 장 그림 + 통통 · 쏠 때 젖힘 */
    else if (e.af >= 0) spr('skAtk', e.af, e.x, e.y, h, e.dir, { rim, flash: 0.06 }); else spr('skWalk', e.wf, e.x, e.y, h, e.dir, { rim, flash: 0.06 });
  }
  if (cjOn) ctx.restore();
  /* 솟는 빛기둥 */
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const p of G.pillars) { const k = p.t / 0.55, a = (k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8) * 0.8, w = p.big ? 34 : 22, hh = p.big ? 170 : 120; const gr = ctx.createLinearGradient(0, p.y - hh, 0, p.y); gr.addColorStop(0, 'rgba(150,80,255,0)'); gr.addColorStop(1, `rgba(190,130,255,${a})`); ctx.fillStyle = gr; ctx.fillRect(p.x - w / 2, p.y - hh, w, hh); } ctx.restore();
  /* 사슬 번개 */
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round'; for (const z of G.zaps) { const a = 1 - z.t / 0.2; for (const [lw, col] of [[9, `rgba(140,80,255,${0.4 * a})`], [3, `rgba(240,230,255,${a})`]]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(z.pts[0].x, z.pts[0].y); for (let i = 1; i < z.pts.length; i++) { const A = z.pts[i - 1], B = z.pts[i]; for (let j = 1; j <= 4; j++) { const t2 = j / 4; ctx.lineTo(lerp(A.x, B.x, t2) + (j < 4 ? rnd(-9, 9) : 0), lerp(A.y, B.y, t2) + (j < 4 ? rnd(-9, 9) : 0)); } } ctx.stroke(); } } ctx.restore();
  /* 뼈 방패 · 낫 · 탄 · 화살 */
  if (G.W.orbit && G.orbP) for (const o of G.orbP) { ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a * 3); ctx.fillStyle = '#f3ead2'; ctx.strokeStyle = '#6a4aa0'; ctx.lineWidth = 2; rr(-12, -3.5, 24, 7, 3); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(-12, 0, 5, 0, 7); ctx.arc(12, 0, 5, 0, 7); ctx.fill(); ctx.restore(); }
  if (G.sweep) { const s = G.sweep, a = s.t / 0.32 * 6.283; ctx.save(); ctx.translate(P.x, P.y - 20); ctx.scale(1, 0.7); ctx.globalCompositeOperation = 'lighter'; for (const rr2 of G.E.scythe ? [s.r, s.r * 0.6] : [s.r]) for (let i = 0; i < 6; i++) { ctx.strokeStyle = G.E.scythe ? `rgba(255,210,120,${0.5 - i * 0.08})` : `rgba(200,150,255,${0.5 - i * 0.08})`; ctx.lineWidth = 10 - i; ctx.beginPath(); ctx.arc(0, 0, rr2 - i * 5, a - 0.9 + i * 0.1, a); ctx.stroke(); } ctx.restore(); }
  if (G.bones) for (const b of G.bones) { const I = IMG.u_bone; if (I && I.naturalWidth) { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx) + b.t * 18); ctx.drawImage(I, -11, -11, 22, 22); ctx.restore(); } }   /* 뼈 화살(그림) */
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const s of G.shots) { const gr = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 14); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(190,140,255,.9)'); gr.addColorStop(1, 'rgba(120,40,255,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(s.x, s.y, 14, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(160,100,255,.5)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.05, s.y - s.vy * 0.05); ctx.stroke(); } ctx.restore();
  ctx.strokeStyle = '#e8d4a0'; ctx.lineWidth = 2.5; for (const a of G.arrows) { const d = Math.hypot(a.vx, a.vy); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x - a.vx / d * 16, a.y - a.vy / d * 16); ctx.stroke(); }
  /* 불똥 · 숫자 */
  for (const p of G.fx) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.col; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); } ctx.globalAlpha = 1;
  for (const t of G.texts) { const k = t.t / t.life, sc = k < 0.15 ? 1.5 - k / 0.15 * 0.5 : 1; ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; ctx.save(); ctx.translate(t.x, t.y); ctx.scale(sc, sc); txt(t.text, 0, 0, t.size, t.col); ctx.restore(); } ctx.globalAlpha = 1;
  /* 지배자 체력 */
  { const w = 46, x = P.x - w / 2, y = P.y + 10; ctx.fillStyle = 'rgba(0,0,0,.65)'; rr(x - 1, y - 1, w + 2, 7, 3); ctx.fill(); ctx.fillStyle = P.hp / P.max < 0.3 ? '#ff4a4a' : '#4ade80'; rr(x, y, w * P.hp / P.max, 5, 2.5); ctx.fill(); }
  ctx.restore();
  /* 가장자리 어둡게 */
  const vg = ctx.createRadialGradient(W / 2, H * 0.52, Math.min(W, H) * 0.45, W / 2, H * 0.52, Math.hypot(W, H) * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,0,12,.65)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (G.P.hurt > 0) { ctx.fillStyle = `rgba(255,0,30,${G.P.hurt * 0.5})`; ctx.fillRect(0, 0, W, H); }
  if (G.P.hp / G.P.max < 0.3 && !G.over) { const a = 0.25 + 0.2 * Math.sin(T * 6), lg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6); lg.addColorStop(0, 'rgba(255,0,0,0)'); lg.addColorStop(1, `rgba(200,0,20,${a})`); ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H); }
  if (G.flashW > 0) { ctx.fillStyle = `rgba(255,240,200,${G.flashW * 0.6})`; ctx.fillRect(0, 0, W, H); }
  for (const f of G.foes) { if (f.dead || !(f.elite || f.boss)) continue; const x = f.x + cx, y = f.y - f.h / 2 + cy; if (x > 0 && x < W && y > 70 && y < H) continue; const dx = x - W / 2, dy = y - H * 0.52, k = Math.min((W / 2 - 22) / Math.abs(dx || 1), (H * 0.48 - 40) / Math.abs(dy || 1)), ex = W / 2 + dx * k, ey = H * 0.52 + dy * k, a = Math.atan2(dy, dx);
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.fillStyle = f.boss ? '#ff4a3a' : '#ff9a5a'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -10); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#1a0010'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
  drawHud();
  if (JOY.on) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(JOY.x0, JOY.y0, 50, 0, 7); ctx.stroke(); const dx = JOY.x - JOY.x0, dy = JOY.y - JOY.y0, d = Math.hypot(dx, dy), k = d > 50 ? 50 / d : 1; ctx.fillStyle = 'rgba(200,170,255,.55)'; ctx.beginPath(); ctx.arc(JOY.x0 + dx * k, JOY.y0 + dy * k, 22, 0, 7); ctx.fill(); }
  if (G.cards) drawCards();
  if (G.paused) drawPause();
  if (G.reviveAsk) drawRevive();
  if (MODE === 'result') drawResult();
}
function drawHud() {
  const top = 10 + (window.visualViewport ? 0 : 0);
  /* 경험치 막대 */
  ctx.fillStyle = 'rgba(10,4,20,.85)'; rr(8, top, W - 16, 14, 7); ctx.fill(); const g = ctx.createLinearGradient(8, 0, W - 8, 0); g.addColorStop(0, '#7a3aff'); g.addColorStop(1, '#d9a2ff'); ctx.fillStyle = g; rr(9, top + 1, (W - 18) * clamp(G.xp / G.next, 0, 1), 12, 6); ctx.fill();
  txt('Lv ' + G.lvl, 18, top + 7.5, 12, '#fff', { align: 'left', lw: 3 });
  /* 시간 · 처치 · 군단 */
  const left = Math.max(0, RUN_LEN - G.t), mm = Math.floor(left / 60), ss = Math.floor(left % 60);
  if (G.idle) { txt(`스테이지 ${G.stage}`, W / 2, top + 32, W < 400 ? 18 : 22, G.stBoss ? '#ff8a6a' : '#ffffff'); if (!G.stBoss) { const bw = 120, bx = W / 2 - bw / 2, by = top + 48; ctx.fillStyle = 'rgba(0,0,0,.6)'; rr(bx, by, bw, 7, 3.5); ctx.fill(); ctx.fillStyle = '#8affb0'; rr(bx, by, bw * Math.min(1, G.stK / G.stNeed), 7, 3.5); ctx.fill(); } }
  else txt(G.bossOn ? '보스전' : `${mm}:${String(ss).padStart(2, '0')}`, W / 2, top + 36, 26, G.bossOn ? '#ff8a6a' : '#ffffff');
  if (G.idle) { { const pop = G.gemPop > 0 ? G.gemPop / 0.18 : 0; icon('relic_glass', 22, top + 36, 24 * (1 + pop * 0.35)); txt((META.gems - clrLeft()) + '', 38, top + 37, 17 + pop * 3, pop > 0 ? '#ffffff' : '#ffe9c0', { align: 'left' }); } } else { icon('i_soul', 22, top + 36, 22); txt(G.kills + '', 38, top + 37, 17, '#e8dcff', { align: 'left' }); }
  const army = G.allies.filter(a => !a.dead).length; icon('i_army', W - 118, top + 36, 24); txt(`${army}/${G.S.cap}`, W - 102, top + 37, 17, army >= G.S.cap ? '#ffd23a' : '#c9a2ff', { align: 'left' });
  if (MODE === 'play' && G.idle && META.speed2 && !G.cards) { const sx = W - 46, sy = 86; ctx.fillStyle = META.spd === 2 ? 'rgba(90,60,10,.9)' : 'rgba(20,10,36,.85)'; rr(sx, sy, 36, 30, 9); ctx.fill(); ctx.strokeStyle = META.spd === 2 ? '#ffd23a' : '#6a4aa0'; ctx.lineWidth = 1.5; ctx.stroke(); txt(META.spd === 2 ? "×2" : "×1", sx + 18, sy + 15, 14, META.spd === 2 ? '#ffe08a' : '#c9b8e8'); BTNS.push({ x: sx, y: sy, w: 36, h: 30, fn: () => { META.spd = META.spd === 2 ? 1 : 2; saveMeta(); } }); }
  if (MODE === 'play' && !G.cards && !G.over && !G.reviveAsk) { const bx = W - 46, by = top + 20; ctx.fillStyle = 'rgba(20,10,36,.85)'; rr(bx, by, 36, 34, 10); ctx.fill(); ctx.strokeStyle = '#6a4aa0'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#e8dcff'; ctx.fillRect(bx + 12, by + 10, 4, 14); ctx.fillRect(bx + 20, by + 10, 4, 14); BTNS.push({ x: bx - 6, y: by - 6, w: 48, h: 46, fn: () => { G.paused = 1; JOY.on = false; } }); }
  if (MODE === 'play' && G.idle && !G.cards && !G.paused) { const bw = Math.min(64, (W - 110) / 4 - 4), bh = 58, y0 = H - bh - 12;   /* 아래 강화 칸: 방치형은 막히면 여기서 바로 강화 */
    META_UP.slice(0, 4).forEach((u, i) => { const l = META.up[u.id], max = l >= u.max, cost = u.cost(l), can = !max && META.gems >= cost, x = 8 + i * (bw + 4);
      ctx.fillStyle = 'rgba(16,8,30,.86)'; rr(x, y0, bw, bh, 10); ctx.fill(); ctx.strokeStyle = can ? '#ffd23a' : '#4a3678'; ctx.lineWidth = can ? 2 : 1; ctx.stroke();
      icon(u.icon, x + bw / 2, y0 + 20, 28); txt(({ hp: '체력', pow: '공격', rise: '부활', cap: '군단' }[u.id] || 'Lv') + ' ' + l, x + bw / 2, y0 + 8, 10, '#d9c8ff', { w: 800, lw: 2, box: bw - 4 }); txt(max ? '최대' : cost + '', x + bw / 2, y0 + 45, 13, can ? '#ffe08a' : '#8f84a6', { box: bw - 6 });
      if (can) BTNS.push({ x, y: y0, w: bw, h: bh, fn: () => buyUp(u) }); }); }
  if (MODE === 'play' && G.idle && !G.cards && !G.over && !G.reviveAsk && !G.paused) { const fw = 48, fh = 42, fx = W - fw - 8, fy = META.speed2 ? 124 : 86, FM = META.form || 0;   /* 군단 편성 단추(누를 때마다 바뀜) */
    ctx.fillStyle = FM ? 'rgba(10,50,40,.9)' : 'rgba(20,10,36,.85)'; rr(fx, fy, fw, fh, 10); ctx.fill(); const wk = G.boss && !G.boss.dead && CHAPTERS[G.ch].weak, hint = wk && FORM[FM].k !== wk; ctx.strokeStyle = hint ? `rgba(255,210,58,${0.6 + Math.sin(T * 8) * 0.4})` : FM ? '#5fffc8' : '#6a4aa0'; ctx.lineWidth = hint ? 3 : 1.5; ctx.stroke();
    txt('편성', fx + fw / 2, fy + 13, 11, '#b9a8d8', { w: 700, box: fw - 6 }); txt(FORM[FM].n, fx + fw / 2, fy + 29, 15, FM ? '#9effd0' : '#ffffff', { box: fw - 6 });
    if (!META.tipForm && !BOT && G.stage >= 2 && !G.clr) { const k = Math.sin(T * 7) * 4, tw = 150, tx = fx - tw - 10 + k, ty = fy + 3;   /* 처음 한 번: 편성 단추 알려주기 */
      ctx.fillStyle = 'rgba(255,244,230,.96)'; rr(tx, ty, tw, 36, 10); ctx.fill(); ctx.beginPath(); ctx.moveTo(tx + tw, ty + 12); ctx.lineTo(tx + tw + 9, ty + 18); ctx.lineTo(tx + tw, ty + 24); ctx.fill(); txt('누르면 병종을 골라요', tx + tw / 2, ty + 18, 13, '#3a1a5a', { box: tw - 10 }); }
    BTNS.push({ x: fx, y: fy, w: fw, h: fh, fn: () => { META.tipForm = 1; META.form = ((META.form || 0) + 1) % 4; saveMeta(); G.banner = { text: `편성 「${FORM[META.form].n}」 ${FORM[META.form].d}`, t: 0.6 }; } }); }
  if (MODE === 'play' && !G.cards && !G.over && !G.reviveAsk && !G.paused) { const r = 34, bx = W - r - 18, by = H - r - 34, ready = G.rallyCd <= 0;   /* 함성 단추 */
    ctx.fillStyle = ready ? 'rgba(90,50,10,.9)' : 'rgba(20,10,36,.8)'; ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fill(); if (!ready) { ctx.fillStyle = 'rgba(140,92,255,.35)'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.arc(bx, by, r, -1.5708, -1.5708 + 6.2832 * (1 - G.rallyCd / 22)); ctx.fill(); }
    ctx.strokeStyle = ready ? '#ffd23a' : '#6a4aa0'; ctx.lineWidth = ready ? 3 + Math.sin(T * 6) * 1.2 : 2; ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.stroke(); icon('i_army', bx, by - 6, 30); txt(ready ? '함성' : Math.ceil(G.rallyCd) + '', bx, by + 18, 13, ready ? '#ffe08a' : '#c9b8e8');
    BTNS.push({ x: bx - r, y: by - r, w: r * 2, h: r * 2, fn: doRally });
    if (ready && !META.tipRally && !BOT && G.allies.length >= 3) { const k = Math.sin(T * 7) * 6, tw = 196, tx = Math.max(10, bx - tw + 30), ty = by - r - 64 + k;   /* 처음 한 번: 함성 단추 알려주기 */
      ctx.fillStyle = 'rgba(255,244,230,.96)'; rr(tx, ty, tw, 44, 12); ctx.fill(); ctx.beginPath(); ctx.moveTo(bx - 10, ty + 44); ctx.lineTo(bx + 10, ty + 44); ctx.lineTo(bx, ty + 58); ctx.fill();
      txt('눌러 보세요! 군단이 세져요', tx + tw / 2, ty + 22, 15, '#3a0a14', { stroke: 0, box: tw - 16 }); } }
  if (G.boss && !G.boss.dead) { const w = W - 60, x = 30, y = top + 58; ctx.fillStyle = 'rgba(0,0,0,.7)'; rr(x, y, w, 12, 6); ctx.fill(); ctx.fillStyle = '#ff4a3a'; rr(x + 1, y + 1, (w - 2) * G.boss.hp / G.boss.max, 10, 5); ctx.fill(); txt(CHAPTERS[G.ch].boss, W / 2, y + 22, 13, '#ffd2c8'); }
  if (G.banner) { const k = G.banner.t, a = Math.min(1, k * 3, (2.6 - k) * 2); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(40,0,10,.75)'; ctx.fillRect(0, H * 0.3 - 30, W, 60); txt(G.banner.text, W / 2, H * 0.3, 26, '#ffd2c8', { box: W - 24 }); ctx.globalAlpha = 1; }
  if (G.weakTip && G.weakTip.t > 0.8) { const q = G.weakTip, a = Math.min(1, (q.t - 0.8) * 4, (7 - q.t) * 2), fi = FORM.findIndex(f => f.k === q.k), ok = (META.form || 0) === fi, y = H * 0.3 + 46;   /* 보스 약점 알림 */
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(10,40,30,.85)'; rr(16, y - 18, W - 32, 36, 12); ctx.fill(); ctx.strokeStyle = '#5fffc8'; ctx.lineWidth = 1.5; ctx.stroke();
    txt(`약점: ${FORM[fi].n} 해골 피해 ×1.5` + (ok ? ' · 편성 맞음!' : ` · 편성을 「${FORM[fi].n}」${(c => c % 28 === 0 || c % 28 === 8 ? '로' : '으로')(FORM[fi].n.charCodeAt(FORM[fi].n.length - 1) - 0xAC00)}`), W / 2, y + 1, 16, ok ? '#9effd0' : '#ffffff', { box: W - 48 }); ctx.globalAlpha = 1; }
  if (G.clr && G.clr.t >= 0) { const c = G.clr, k = c.t, L = c.boss ? 3.4 : 2.6, a = Math.max(0, Math.min(1, k * 5, (L - k) * 2.5)), cy = Math.max(120, H * 0.22), sc = k < 0.22 ? 0.5 + k / 0.22 * 0.65 : k < 0.36 ? 1.15 - (k - 0.22) / 0.14 * 0.15 : 1;
    G.bossSay = null; if (c.boss && k < 0.4) { ctx.fillStyle = `rgba(255,236,190,${0.5 * (1 - k / 0.4)})`; ctx.fillRect(0, 0, W, H); }
    ctx.globalAlpha = a; ctx.fillStyle = c.boss ? 'rgba(50,20,0,.78)' : 'rgba(20,6,40,.75)'; ctx.fillRect(0, cy - 44, W, 104); ctx.fillStyle = c.boss ? '#ffc94a' : '#a77bff'; ctx.fillRect(0, cy - 44, W, 3); ctx.fillRect(0, cy + 57, W, 3);
    txt(c.boss ? '보스 격파!' : `스테이지 ${c.s} 돌파!`, W / 2, cy - 8, Math.round((W < 400 ? 30 : 36) * sc), c.boss ? '#ffd86a' : '#ffffff', { box: W - 30 });
    if (k > 0.45) { const k2 = Math.min(1, (k - 0.45) * 4); ctx.globalAlpha = a * k2; txt(c.reg ? `새 지역 — ${c.reg}` : c.boss ? `스테이지 ${c.s} · 결정 +${c.gain}` : `결정 +${c.gain}`, W / 2 + (1 - k2) * 40, cy + 34, W < 400 ? 17 : 19, c.reg ? '#9effd0' : '#ffe9a8', { box: W - 40 }); }
    ctx.globalAlpha = 1;
    for (const g of c.g) { if (k < g.d || g.done) continue; const p = Math.min(1, (k - g.d) / 0.5), e = p * p, x = g.x + (22 - g.x) * e, y = g.y + (46 - g.y) * e - Math.sin(p * Math.PI) * 70; ctx.save(); ctx.shadowColor = '#ffe08a'; ctx.shadowBlur = 14; icon('relic_glass', x, y, 34 - e * 12); ctx.restore(); if (p >= 1) { g.done = 1; G.gemPop = 0.18; } }
  }
  if (G.bossSay) { const q = G.bossSay, a = Math.min(1, q.t * 5, (2.8 - q.t) * 3), y = Math.max(126, H * 0.3 - 54), tw = Math.min(W - 30, 360);   /* 보스 대사 — 화면 고정 칸(머리 위는 위 띠에 가려짐) */
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(255,244,230,.95)'; rr(W / 2 - tw / 2, y - 22, tw, 44, 12); ctx.fill(); txt('「' + q.s + '」', W / 2, y, 17, '#3a0a14', { stroke: 0, box: tw - 24 }); ctx.globalAlpha = 1; }
  if (G.t < 6 && !G.cards) { ctx.globalAlpha = Math.min(1, (6 - G.t) / 1.5); txt(G.idle ? '가만히 둬도 알아서 싸워요 · 끌면 직접 움직여요' : '화면을 누른 채 끌어서 움직여요', W / 2, H * 0.78, 17, '#e8dcff', { w: 800 }); txt('쓰러뜨린 적이 내 해골 병사로 일어나요', W / 2, H * 0.78 + 26, 15, '#c9a2ff', { w: 800 }); ctx.globalAlpha = 1; }
}
function drawCards() {
  ctx.fillStyle = 'rgba(6,2,14,.82)'; ctx.fillRect(0, 0, W, H);
  txt('레벨 업!', W / 2, H * 0.17, 34, '#ffe08a'); txt('하나를 고르세요', W / 2, H * 0.17 + 36, 16, '#d9c8ff', { w: 800 });
  const cw = Math.min(W - 40, 380), ch = Math.min(110, H * 0.15), x = (W - cw) / 2; let y = H * 0.27;
  G.cards.forEach(c => {
    const l = lv(c.id) + 1, g = ctx.createLinearGradient(0, y, 0, y + ch); g.addColorStop(0, c.w ? '#3a1f6a' : '#2a1c48'); g.addColorStop(1, '#1a0f30'); ctx.fillStyle = g; rr(x, y, cw, ch, 16); ctx.fill(); ctx.strokeStyle = l === 1 && c.w ? '#ffd76a' : '#8c5cff'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(x + 50, y + ch / 2, 34, 0, 7); ctx.fill(); icon(c.icon, x + 50, y + ch / 2, 56);
    txt(c.name, x + 98, y + ch * 0.34, 21, '#ffffff', { align: 'left' }); txt(l === 1 ? '새로!' : 'Lv ' + l, x + cw - 16, y + ch * 0.34, 15, l === 1 ? '#ffd76a' : '#c9a2ff', { align: 'right' });
    txt(c.desc(l), x + 98, y + ch * 0.68, 15, '#e0d4ff', { align: 'left', w: 700, lw: 2, box: cw - 108 });
    BTNS.push({ x, y, w: cw, h: ch, fn: () => takeCard(c) }); y += ch + 14; });
}
function drawRevive() {
  ctx.fillStyle = 'rgba(30,0,10,.78)'; ctx.fillRect(0, 0, W, H); txt('쓰러지기 직전!', W / 2, H * 0.3, 38, '#ff8a8a'); txt('군주는 한 번 다시 일어설 수 있어요', W / 2, H * 0.3 + 44, 16, '#ffd2c8', { w: 800 });
  button(W / 2 - 140, H * 0.48, 280, 64, '부활하기  ·  광고', () => showAd(doRevive), { gold: 1, size: 22 });
  button(W / 2 - 140, H * 0.48 + 80, 280, 50, '그만하기', () => { G.reviveAsk = 0; G.revived = 1; G.over = 2; G.win = 0; }, { size: 17 });
}
/* ── 망자의 함성: 22초마다 누르는 단추 · 주변 적을 밀치고 6초 동안 군단이 빨라지고 세짐 ── */
function doRally() { if (G.rallyCd > 0 || G.over) return; if (!META.tipRally) { META.tipRally = 1; saveMeta(); } const P = G.P; G.rallyCd = 22; G.rallyOn = 6; shake = 16; SND.play('slam', 0.6); G.ring = { x: P.x, y: P.y, r: 200, t: 0 };
  burst(P.x, P.y - 30, 40, ['#ffd23a', '#c9a2ff', '#ffffff'], 380, 0.7); say("망자의 함성!", P.x, P.y - 150, { size: 26, col: "#ffd23a", life: 1.2, vy: -20 }); if (META.vib && navigator.vibrate) try { navigator.vibrate(30); } catch (e) {}
  for (const f of G.foes) { if (f.dead) continue; const d = Math.hypot(f.x - P.x, f.y - P.y); if (d < 200) hurtFoe(f, 30 * (1 + G.d / 120), P.x, P.y, f.boss ? 0 : 160, 'rally'); } }
function doRevive() { const P = G.P; G.reviveAsk = 0; G.revived = 1; P.hp = P.max * 0.6; P.inv = 3; shake = 24; G.flashW = 1; SND.play('win', 0.6);
  burst(P.x, P.y - 40, 60, ['#ffffff', '#c9a2ff', '#ffe08a'], 520, 0.9); G.ring = { x: P.x, y: P.y, r: 300, t: 0 };
  for (const f of G.foes) { if (f.dead || f.boss) continue; const d = Math.hypot(f.x - P.x, f.y - P.y); if (d < 300) hurtFoe(f, 9999, P.x, P.y, 200); }
  for (const a of G.arrows) a.t = 9; say('부활!', P.x, P.y - 150, { size: 30, col: '#ffe08a', life: 1.4, vy: -20 }); }
function drawPause() {
  ctx.fillStyle = 'rgba(6,2,14,.82)'; ctx.fillRect(0, 0, W, H); txt('잠시 멈춤', W / 2, H * 0.2, 36, '#e9dcff');
  const ws = Object.entries(G.W).filter(([k, v]) => v > 0); let y = H * 0.28; txt('지금 마법', W / 2, y, 15, '#9a8fae', { w: 700 }); y += 30;
  ws.forEach(([k, v], i) => { const c = CARDS.find(c => c.id === k), x = W / 2 - (ws.length - 1) * 30 + i * 60; ctx.fillStyle = G.E[k] ? 'rgba(255,200,60,.25)' : 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.arc(x, y + 18, 26, 0, 7); ctx.fill(); icon(c.icon, x, y + 18, 40); txt(G.E[k] ? '진화' : 'Lv' + v, x, y + 50, 12, G.E[k] ? '#ffd23a' : '#d9c8ff'); });
  y = H * 0.45; button(W / 2 - 130, y, 260, 58, '계속하기', () => { G.paused = 0; }, { gold: 1, size: 22 });
  button(W / 2 - 130, y + 72, 125, 48, META.snd ? '소리 켬' : '소리 끔', () => { META.snd = META.snd ? 0 : 1; saveMeta(); if (SND.bgmG) SND.bgmG.gain.value = META.snd ? 0.22 : 0; }, { size: 16, off: false });
  button(W / 2 + 5, y + 72, 125, 48, META.vib ? '진동 켬' : '진동 끔', () => { META.vib = META.vib ? 0 : 1; saveMeta(); }, { size: 16 });
  button(W / 2 - 130, y + 136, 260, 48, G.idle ? '저장하고 나가기' : '포기하고 나가기', () => { G.paused = 0; if (G.idle) { saveRun(); MODE = 'title'; } else { G.over = 0.01; G.win = 0; } }, { size: 16 });
}
function drawResult() {
  const R = G.result; ctx.fillStyle = 'rgba(6,2,14,.86)'; ctx.fillRect(0, 0, W, H);
  txt(R.win ? '승리!' : '쓰러졌다', W / 2, H * 0.2, 44, R.win ? '#ffe08a' : '#ff8a8a');
  txt(R.win ? `${CHAPTERS[G.ch].boss}을(를) 쓰러뜨렸어요` + (R.unlock ? ' · 새 지역과 군주 열림!' : '') : '군단은 다시 일어설 거예요', W / 2, H * 0.2 + 42, 16, '#d9c8ff', { w: 800 });
  const D = G.dmg || {}, tot = Object.values(D).reduce((a, b) => a + b, 0) || 1, top = Object.keys(D).sort((a, b) => D[b] - D[a])[0], NM = { ally: '해골 군단', rally: '망자의 함성' }, topName = top ? (NM[top] || (CARDS.find(c => c.id === top) || {}).name || top) : '-';
  const rows = [['버틴 시간', `${Math.floor(R.t / 60)}분 ${Math.floor(R.t % 60)}초`], ['처치', R.kills], ['레벨', R.lvl], ['군단 최대', G.armyMax || 0], ['가장 센 힘', top ? `${topName} ${Math.round(D[top] / tot * 100)}%` : '-']]; let y = H * 0.33; const rh = H < 720 ? 30 : 36;   /* 다시 보기: 다음 판에 무엇을 고를지 생각하게 */
  for (const [a, b] of rows) { txt(a, W / 2 - 120, y, 17, '#c9b8e8', { align: 'left', w: 800 }); txt(b + '', W / 2 + 120, y, 19, a === '가장 센 힘' ? '#ffe08a' : '#fff', { align: 'right', box: 150 }); y += rh; }
  icon('relic_glass', W / 2 - 60, y + 24, 40); txt(`결정 +${R.gain}`, W / 2 + 10, y + 26, 26, '#ffe08a'); y += 64;
  if (!R.dbl && IS_APP) button(W / 2 - 140, y, 280, 48, `결정 2배 받기  ·  광고`, () => showAd(() => { META.gems += R.gain; R.gain *= 2; R.dbl = 1; saveMeta(); SND.play('win', 0.5); }), { size: 17, green: 1 }); else txt('2배로 받았어요!', W / 2, y + 24, 16, '#8affb0', { w: 700 }); y += 62;
  button(W / 2 - 140, y, 280, 58, '다시 싸우기', () => newRun(), { gold: 1, size: 22 }); button(W / 2 - 140, y + 72, 280, 52, '군주 강화하기', () => { MODE = 'meta'; }, {});
}
function drawBg() { ctx.fillStyle = GROUND[META.ch || 0] || TILE; ctx.save(); ctx.translate(-T * 12 % 512, -T * 6 % 512); ctx.fillRect(0, 0, W + 512, H + 512); ctx.restore(); const vg = ctx.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H * 0.45, Math.hypot(W, H) * 0.6); vg.addColorStop(0, 'rgba(60,20,110,.35)'); vg.addColorStop(1, 'rgba(4,0,10,.85)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
function drawTitle() {
  drawBg(); const cx = W / 2;
  txt('망자의 군주', cx, H * 0.13, 46, '#e9dcff', { sc: '#2a0a50', lw: 9 }); txt('쓰러뜨린 적이 나의 군단이 된다', cx, H * 0.13 + 44, 16, '#c9a2ff', { w: 800 });
  const li = META.lord || 0, LD = LORDS[li], open = lordOpen(li), fy = Math.min(H * 0.5, H * 0.7 - 146), h = Math.min(230, H * 0.27, fy - H * 0.13 - 66);
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + T * 0.4, x = cx + Math.cos(a) * 120, y = fy + 6 + Math.sin(a) * 26; if (Math.sin(a) < 0) spr('skWalk', T * 20 + i * 4, x, y, 52, Math.cos(a + 1.57) > 0 ? 1 : -1, { a: 0.85, rim: '#5fffc8' }); }
  spr(lordSpr('lordIdle', li), T * 14, cx - 6, fy, h, 1, open ? {} : { a: 0.28 });
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + T * 0.4, x = cx + Math.cos(a) * 120, y = fy + 6 + Math.sin(a) * 26; if (Math.sin(a) >= 0) spr('skWalk', T * 20 + i * 4, x, y, 52, Math.cos(a + 1.57) > 0 ? 1 : -1, { a: 0.85, rim: '#5fffc8' }); }
  if (!open) txt('🔒', cx, fy - h * 0.45, 40, '#fff', { stroke: 0 });
  txt(LD.name, cx, fy + 36, 22, open ? '#ffe08a' : '#9a8fae', { sc: '#1a0830', lw: 6 }); txt(open ? LD.desc : LD.need, cx, fy + 62, 13, open ? '#d9c8ff' : '#ff9a8a', { w: 800 });
  button(cx - 160, fy - h * 0.55, 46, 52, '◀', () => { META.lord = (li + LORDS.length - 1) % LORDS.length; saveMeta(); }, { size: 18 }); button(cx + 114, fy - h * 0.55, 46, 52, '▶', () => { META.lord = (li + 1) % LORDS.length; saveMeta(); }, { size: 18 });
  { const st = META.stage || 1, C = CHAPTERS[Math.floor((st - 1) / 20) % 3], y = H * 0.7 - 46; ctx.fillStyle = 'rgba(20,10,36,.8)'; rr(cx - 140, y - 22, 280, 44, 12); ctx.fill(); txt(`스테이지 ${st} · ${C.name}`, cx, y, 18, '#ffe9c0'); }
  if (0) { const C = CHAPTERS[META.ch], y = H * 0.7 - 46;
    if (META.ch > 0) button(cx - 140, y - 22, 44, 44, '◀', () => { META.ch--; saveMeta(); }, { size: 16 }); if (META.ch + 1 < META.open) button(cx + 96, y - 22, 44, 44, '▶', () => { META.ch++; saveMeta(); }, { size: 16 });
    else if (META.ch + 1 < CHAPTERS.length) txt('🔒', cx + 118, y, 16, '#9a8fae', { stroke: 0 }); }
  if (open) button(cx - 140, H * 0.7, 280, 64, '출전하기', () => newRun(), { gold: 1, size: 24 }); else button(cx - 140, H * 0.7, 280, 64, '잠긴 군주', () => {}, { size: 22 });
  button(cx - 140, H * 0.7 + 78, 280, 52, `군주 강화  ·  결정 ${META.gems}`, () => { MODE = 'meta'; }, { size: 17 });
  { const n = dailyReady(), y = H * 0.7 + 142; const pn = passReady(); button(cx - 140, y, 70, 44, `임무${n ? '·' + n : ''}`, () => { MODE = 'daily'; }, { size: 14, gold: !!n }); button(cx - 66, y, 66, 44, '유물', () => { MODE = 'box'; BOXR = null; }, { size: 14 }); button(cx + 4, y, 66, 44, `패스${pn ? '·' + pn : ''}`, () => { MODE = 'pass'; PASSPG = Math.max(0, Math.floor(passNow() / 5) - (passNow() % 5 === 0 && passNow() ? 1 : 0)); }, { size: 14, gold: !!pn }); button(cx + 74, y, 66, 44, '상점', () => { MODE = 'shop'; }, { size: 14 });
    if (META.best && y + 70 < H) txt(`최고 기록 ${Math.floor(META.best / 60)}분 ${META.best % 60}초`, cx, y + 62, 13, '#9a8fae', { w: 700 }); }
}
function drawMeta() {
  drawBg(); txt('군주 강화', W / 2, 54, 30, '#ffe08a'); { ctx.font = `900 20px ${FONT}`; const tw = ctx.measureText(`결정 ${META.gems}`).width; icon('relic_glass', W / 2 + 10 - tw / 2 - 20, 92, 26); } txt(`결정 ${META.gems}`, W / 2 + 10, 93, 20, '#fff');
  const cw = Math.min(W - 32, 400), x = (W - cw) / 2; let y = 124; const ch = Math.min(84, (H - 240) / META_UP.length - 10);
  for (const u of META_UP) { const l = META.up[u.id], max = l >= u.max, cost = u.cost(l), can = !max && META.gems >= cost;
    ctx.fillStyle = 'rgba(30,18,52,.92)'; rr(x, y, cw, ch, 14); ctx.fill(); ctx.strokeStyle = '#4a3678'; ctx.lineWidth = 1.5; ctx.stroke();
    icon(u.icon, x + 38, y + ch / 2, 48); txt(`${u.name}  Lv ${l}`, x + 72, y + ch * 0.34, 18, '#fff', { align: 'left', box: cw - 190 }); txt(u.desc(l + (max ? 0 : 1)), x + 72, y + ch * 0.7, 14, '#c9b8e8', { align: 'left', w: 700, lw: 2, box: cw - 190 });
    button(x + cw - 108, y + ch / 2 - 22, 96, 44, max ? '최대' : `${cost}`, () => { buyUp(u); }, { gold: can, off: !can, size: 17 }); y += ch + 10; }
  button(W / 2 - 120, H - 80, 240, 56, '돌아가기', () => { MODE = G && G.result ? 'title' : 'title'; }, {});
}

/* ── 돌리기 ── */
let last = performance.now();
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000) * SPEED * (MODE === 'play' && G && G.idle && META.speed2 && META.spd === 2 ? 2 : 1); last = now; T += dt; if (AD && !AD.wait) { AD.t -= dt; if (AD.t <= 0) { const f = AD.done; AD = null; f(); } }
  if (MODE === 'play' || MODE === 'result') { shake *= Math.pow(0.003, dt); if (hitstop > 0) { hitstop -= dt; dt *= 0.08; } if (MODE === 'play' && !G.cards && !G.paused && !G.reviveAsk && !AD && !OFF) step(dt); else if (G.over) updateFx(dt);
    if (G && G.cards && !BOT && G.idle && META.autoPick !== 0) { G.cardT = (G.cardT || 0) + dt; } else if (G) G.cardT = 0;
    if (G && G.cards && (BOT || (G.idle && META.autoPick !== 0 && G.cardT > 1.6))) { G.cardT = 0; const cs = G.cards, pick = cs.find(c => c.evo) || cs.find(c => c.w && lv(c.id) > 0) || cs.find(c => c.w) || cs[0]; takeCard(pick); } if (BOT && MODE === 'result' && Q.has('loop')) newRun(); }
  draw(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if (Q.has('ch')) META.ch = +Q.get('ch'); if (BOT || Q.has('play')) newRun();
window.GAME = { get G() { return G; }, get MODE() { return MODE; }, newRun, META, rollCards, CARDS, EVO, LORDS, hurtLord, raise, stageClear, saveMeta, CLIP, setMode: m => { MODE = m; }, get W() { return W; } };
