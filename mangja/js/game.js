/* 망자의 군주 — 세로 폰 한 손 서바이벌 (11-18 새로 시작)
   화면을 끌면 지배자가 움직이고, 공격은 저절로. 쓰러뜨린 적이 그 자리에서 내 해골 병사로 일어나 같이 싸움.
   모든 것(배경 · 캐릭터 · 글자 · 단추)을 캔버스 하나에 그림. ?mute=1 소리 끔 · ?bot=1 시험용 자동 조작 · ?t=초 시작 시간 */
'use strict';
const Q = new URLSearchParams(location.search), MUTE = Q.has('mute'), BOT = Q.has('bot');
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
  footWalk: { i: 'kw2_walk', cw: 122, ch: 221, ax: 61.8, ay: 220.8, hpx: 210, n: 29, face: -1 },
  spearWalk: { i: 'k1_walk', cw: 214, ch: 230, ax: 82.1, ay: 227.7, hpx: 205, n: 24, face: -1 },
  shieldWalk: { i: 'k2_walk', cw: 179, ch: 231, ax: 96.6, ay: 230.3, hpx: 215, n: 28, face: -1 },
  archerWalk: { i: 'k3_walk', cw: 177, ch: 232, ax: 78.3, ay: 230.2, hpx: 215, n: 24, face: -1 },
  priestWalk: { i: 'k5_walk', cw: 177, ch: 236, ax: 74.4, ay: 227.7, hpx: 215, n: 32, face: -1 },
  archerAtk: { i: 'k3_attack', cw: 177, ch: 232, ax: 78.3, ay: 230.2, hpx: 215, n: 26, face: -1 },
  giantIdle: { i: 'gv2_idle', cw: 258, ch: 344, ax: 131.4, ay: 339.9, hpx: 330, n: 40, face: -1 },
  giantRaise: { i: 'gv2_raise', cw: 258, ch: 344, ax: 131.4, ay: 339.9, hpx: 330, n: 12, face: -1 },
  giantSlam: { i: 'gv2_slam', cw: 258, ch: 344, ax: 131.4, ay: 339.9, hpx: 330, n: 8, face: -1 },
};
for (const k in SP) img(SP[k].i);
for (const n of ['u_magic', 'u_summon', 'u_bone', 'u_harvest', 'i_soul', 'i_army', 'relic_chain', 'relic_staff', 'relic_cloak', 'relic_ring', 'relic_crown', 'relic_glass', 'chest2', 'lord']) img(n);
function spr(s, frame, x, y, h, dir, o = {}) {   /* dir: 1 = 오른쪽을 보게 */
  const S = SP[s], I = IMG[S.i]; if (!I || !I.complete || !I.naturalWidth) { ctx.fillStyle = o.col || '#888'; ctx.beginPath(); ctx.ellipse(x, y - h / 2, h * 0.25, h / 2, 0, 0, 7); ctx.fill(); return; }
  const fi = ((Math.floor(frame) % S.n) + S.n) % S.n, c = fi % 10, r = Math.floor(fi / 10), sc = h / S.hpx;
  ctx.save(); ctx.translate(x, y); if (dir * S.face < 0) ctx.scale(-1, 1); if (o.sx) ctx.scale(o.sx, o.sy || 1);
  if (o.a != null) ctx.globalAlpha = o.a;
  ctx.drawImage(I, c * S.cw, r * S.ch, S.cw, S.ch, -S.ax * sc, -S.ay * sc, S.cw * sc, S.ch * sc);
  if (o.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(0.7, o.flash * 4); ctx.drawImage(I, c * S.cw, r * S.ch, S.cw, S.ch, -S.ax * sc, -S.ay * sc, S.cw * sc, S.ch * sc); }
  ctx.restore();
}

/* ── 소리 ── */
const SND = { ctx: null, buf: {}, bgm: null, init() { if (this.ctx || MUTE) return; try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); for (const n of ['hit', 'rise', 'soul', 'up', 'slam', 'win', 'boom', 'stamp', 'bgm1']) fetch('sfx/' + n + '.mp3').then(r => r.arrayBuffer()).then(b => this.ctx.decodeAudioData(b)).then(d => { this.buf[n] = d; if (n === 'bgm1') this.music(); }).catch(() => {}); } catch (e) {} },
  play(n, vol = 0.5, rate = 1) { if (!this.ctx || !this.buf[n]) return; const now = this.ctx.currentTime; this.last = this.last || {}; if (now - (this.last[n] || 0) < 0.04) return; this.last[n] = now; const s = this.ctx.createBufferSource(), g = this.ctx.createGain(); s.buffer = this.buf[n]; s.playbackRate.value = rate; g.gain.value = vol; s.connect(g).connect(this.ctx.destination); s.start(); },
  music() { if (this.bgm || !this.buf.bgm1) return; const s = this.ctx.createBufferSource(), g = this.ctx.createGain(); s.buffer = this.buf.bgm1; s.loop = true; g.gain.value = 0.22; s.connect(g).connect(this.ctx.destination); s.start(); this.bgm = s; } };

/* ── 저장(강화 · 기록) ── */
const SAVE_KEY = 'mangja_v1';
const META = Object.assign({ gems: 0, best: 0, runs: 0, up: { hp: 0, pow: 0, rise: 0, cap: 0, gold: 0 } }, (() => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; } })());
const saveMeta = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(META)); } catch (e) {} };
const META_UP = [
  { id: 'hp', name: '뼈 갑옷', desc: l => `최대 체력 +${l * 10}%`, cost: l => 20 + l * 20, max: 10, icon: 'relic_cloak' },
  { id: 'pow', name: '흑마력', desc: l => `모든 공격 +${l * 8}%`, cost: l => 25 + l * 25, max: 10, icon: 'relic_staff' },
  { id: 'rise', name: '죽음의 부름', desc: l => `일으킬 확률 +${l * 3}%`, cost: l => 30 + l * 30, max: 8, icon: 'relic_chain' },
  { id: 'cap', name: '군단기', desc: l => `군단 최대 +${l * 2}`, cost: l => 30 + l * 35, max: 8, icon: 'relic_crown' },
  { id: 'gold', name: '영혼 수확', desc: l => `얻는 결정 +${l * 10}%`, cost: l => 40 + l * 40, max: 5, icon: 'relic_glass' },
];

/* ── 판 하나 ── */
const RUN_LEN = 300;   /* 5분 뒤 보스 */
let G = null, MODE = 'title', T = 0, hitstop = 0, shake = 0;
const KINDS = {
  foot: { hp: 18, spd: 46, dmg: 9, r: 15, h: 70, s: 'footWalk', xp: 1, from: 0 },
  spear: { hp: 26, spd: 62, dmg: 11, r: 15, h: 72, s: 'spearWalk', xp: 1, from: 35 },
  shield: { hp: 70, spd: 36, dmg: 9, r: 17, h: 74, s: 'shieldWalk', xp: 2, from: 70, heavy: 1 },
  archer: { hp: 16, spd: 44, dmg: 10, r: 14, h: 72, s: 'archerWalk', xp: 2, from: 100, far: 170 },
  priest: { hp: 30, spd: 40, dmg: 8, r: 15, h: 74, s: 'priestWalk', xp: 2, from: 150, heal: 1 },
};
function newRun() {
  const U = META.up;
  G = { t: +(Q.get('t') || 0), kills: 0, lvl: 1, xp: 0, next: 3, gems: 0, over: 0, win: 0, cards: null, chestN: 0, bossOn: 0, boss: null, eliteT: 60,
    P: { x: 0, y: 0, hp: 120 * (1 + U.hp * 0.1), max: 120 * (1 + U.hp * 0.1), spd: 150, dir: 1, inv: 0, wf: 0, moving: 0, hurt: 0 },
    foes: [], allies: [], shots: [], arrows: [], orbs: [], fx: [], texts: [], pools: [], marks: [],
    S: { pow: 1 + U.pow * 0.08, rise: 0.4 + U.rise * 0.03, cap: 10 + U.cap * 2, allyPow: 1, spd: 1, magnet: 115, haste: 1 },
    W: { bolt: 1, orbit: 0, pool: 0, scythe: 0 }, L: { bolt: 1 }, cd: { bolt: 0, pool: 1.5, scythe: 2 }, spawnAcc: 0 };
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
  { id: 'rise', name: '죽음의 부름', icon: 'u_summon', max: 5, desc: () => '쓰러진 적이 일어날 확률 +12%' },
  { id: 'cap', name: '군단 확장', icon: 'i_army', max: 6, desc: () => '군단 최대 +6' },
  { id: 'allyPow', name: '망자의 힘', icon: 'relic_crown', max: 5, desc: () => '해골 병사 공격 · 체력 +35%' },
  { id: 'spd', name: '그림자 걸음', icon: 'relic_cloak', max: 4, desc: () => '이동 속도 +12%' },
  { id: 'hp', name: '뼈 갑옷', icon: 'relic_glass', max: 5, desc: () => '최대 체력 +25 · 다 회복' },
  { id: 'magnet', name: '영혼 끌개', icon: 'i_soul', max: 4, desc: () => '영혼을 더 멀리서 끌어옴' },
  { id: 'haste', name: '서두르는 주문', icon: 'relic_staff', max: 5, desc: () => '모든 마법 대기 −8%' },
];
const lv = id => (G.W[id] != null ? G.W[id] : (G.L[id] || 0));
function rollCards() {
  const pool = CARDS.filter(c => lv(c.id) < c.max && !(c.w && lv(c.id) === 0 && Object.values(G.W).filter(v => v > 0).length >= 4));
  const out = []; while (out.length < 3 && pool.length) { const wts = pool.map(c => (c.w && lv(c.id) === 0 ? 2.2 : c.w ? 1.6 : 1)); let r = Math.random() * wts.reduce((a, b) => a + b, 0), i = 0; while ((r -= wts[i]) > 0) i++; out.push(pool.splice(i, 1)[0]); }
  return out;
}
function takeCard(c) {
  const n = lv(c.id) + 1; if (c.w) G.W[c.id] = n; else G.L[c.id] = n;
  const S = G.S;
  if (c.id === 'rise') S.rise += 0.12; if (c.id === 'cap') S.cap += 6; if (c.id === 'allyPow') S.allyPow += 0.35; if (c.id === 'spd') S.spd += 0.12;
  if (c.id === 'hp') { G.P.max += 25; G.P.hp = G.P.max; } if (c.id === 'magnet') S.magnet *= 1.45; if (c.id === 'haste') S.haste *= 0.92;
  G.cards = null; say(`${c.name} ${n > 1 ? 'Lv' + n : '획득'}`, G.P.x, G.P.y - 90, { size: 20, col: '#ffe08a' }); burst(G.P.x, G.P.y - 40, 18, ['#c9a2ff', '#fff', '#ffe08a'], 240);
  if (G.queue > 0) { G.queue--; G.cards = rollCards(); }
}

/* ── 효과 ── */
function burst(x, y, n, cols, sp = 180, life = 0.5) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = rnd(sp * 0.3, sp); G.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, t: 0, life: rnd(life * 0.5, life), col: cols[i % cols.length], s: rnd(2, 4.5) }); } if (G.fx.length > 500) G.fx.splice(0, G.fx.length - 500); }
function say(text, x, y, o = {}) { G.texts.push({ text, x, y, t: 0, life: o.life || 0.8, size: o.size || 16, col: o.col || '#fff', vy: o.vy ?? -50 }); if (G.texts.length > 60) G.texts.shift(); }

/* ── 피해 ── */
function hurtFoe(f, dmg, sx, sy, kb = 60) {
  if (f.dead) return; dmg *= G.S.pow; const crit = Math.random() < 0.1; if (crit) dmg *= 2;
  f.hp -= dmg; f.flash = 0.12; const d = Math.hypot(f.x - sx, f.y - sy) || 1, k = f.boss ? 0.1 : f.heavy ? 0.4 : 1; f.kx += (f.x - sx) / d * kb * k; f.ky += (f.y - sy) / d * kb * k;
  if (Math.random() < (crit ? 1 : 0.5)) say(Math.round(dmg) + '', f.x + rnd(-10, 10), f.y - f.h - 4, { size: crit ? 22 : 15, col: crit ? '#ffd23a' : '#ffffff', life: 0.55 });
  SND.play('hit', crit ? 0.35 : 0.18, rnd(0.85, 1.25));
  if (f.hp <= 0) killFoe(f);
}
function killFoe(f) {
  f.dead = true; G.kills++; burst(f.x, f.y - f.h * 0.5, f.boss ? 60 : f.elite ? 26 : 9, ['#e8dcc0', '#bfb59a', '#ffffff', '#9a7ad8'], f.boss ? 420 : 220);
  for (let i = 0; i < (f.boss ? 30 : f.elite ? 8 : 1); i++) G.orbs.push({ x: f.x + rnd(-8, 8) * (i ? 3 : 0), y: f.y - 10 + rnd(-8, 8) * (i ? 3 : 0), v: f.xp, t: 0 });
  if (f.elite) { G.chestN++; G.queue = (G.queue || 0) + 1; hitstop = 0.08; shake = Math.max(shake, 10); SND.play('boom', 0.5); say('정예 처치! 보물 카드', f.x, f.y - 90, { size: 22, col: '#ffd23a', life: 1.4 }); if (!G.cards) { G.queue--; G.cards = rollCards(); } }
  if (f.boss) { hitstop = 0.25; shake = 30; G.win = 1; G.over = 2.5; SND.play('win', 0.8); }
  const alive = G.allies.filter(a => !a.dead).length;
  if (!f.boss && alive < G.S.cap && Math.random() < (f.elite ? 1 : G.S.rise)) raise(f.x, f.y, f.elite);
}
function raise(x, y, big) {
  const S = G.S, hp = (big ? 90 : 26) * S.allyPow;
  G.allies.push({ x, y, hp, max: hp, rise: 0, t: rnd(0, 5), atkT: rnd(0, 0.6), dir: 1, big, dead: false, wf: rnd(0, 20), af: -1, ang: Math.random() * 6.283 });
  G.marks.push({ x, y, t: 0 }); SND.play('rise', 0.22, rnd(0.9, 1.15));
}
function hurtLord(d) { const P = G.P; if (P.inv > 0 || G.over) return; P.hp -= d; P.inv = 0.45; P.hurt = 0.3; shake = Math.max(shake, 6); SND.play('slam', 0.3, 1.4); if (P.hp <= 0) { P.hp = 0; G.over = 2; G.win = 0; } }

/* ── 생겨남 ── */
function spawnFoe(kind, elite) {
  const K = KINDS[kind], a = Math.random() * 6.283, R = Math.hypot(W, H) * (G.t < 8 ? 0.42 : 0.56) + 30, sc = 1 + G.t / 55 + Math.max(0, G.t - 180) / 40;
  const f = { kind, x: G.P.x + Math.cos(a) * R, y: G.P.y + Math.sin(a) * R, hp: K.hp * sc * (elite ? 9 : 1), spd: K.spd * rnd(0.9, 1.1) * (elite ? 0.8 : 1), dmg: K.dmg * (0.55 + G.t / 140), r: K.r * (elite ? 1.6 : 1), h: K.h * (elite ? 1.55 : 1), s: K.s, xp: K.xp, far: K.far, heal: K.heal, heavy: K.heavy || elite, elite, kx: 0, ky: 0, flash: 0, wf: rnd(0, 30), shootT: rnd(1, 2.5), dir: -1 };
  f.max = f.hp; G.foes.push(f); return f;
}
function spawnBoss() {
  const P = G.P; G.bossOn = 1; const hp = 5200 * (1 + G.t / 120);
  G.boss = { kind: 'giant', boss: 1, x: P.x + W * 0.7, y: P.y - 40, hp, max: hp, spd: 34, dmg: 22, r: 40, h: 210, xp: 1, kx: 0, ky: 0, flash: 0, wf: 0, dir: -1, heavy: 1, act: 'idle', actT: 3, af: 0 };
  G.foes.push(G.boss); SND.play('stamp', 0.7); shake = 18; G.banner = { text: '묘지의 거인이 깨어났다', t: 0 };
}

/* ── 한 걸음 ── */
const GRID = new Map(), CELL = 48, gk = (x, y) => (Math.floor(x / CELL) * 73856093) ^ (Math.floor(y / CELL) * 19349663);
function near(x, y, r, fn) { const c0 = Math.floor((x - r) / CELL), c1 = Math.floor((x + r) / CELL), r0 = Math.floor((y - r) / CELL), r1 = Math.floor((y + r) / CELL); for (let cx = c0; cx <= c1; cx++) for (let cy = r0; cy <= r1; cy++) { const L = GRID.get((cx * 73856093) ^ (cy * 19349663)); if (L) for (const f of L) fn(f); } }
function nearestFoe(x, y, maxR = 1e9) { let best = null, bd = maxR * maxR; for (const f of G.foes) { if (f.dead) continue; const d = (f.x - x) ** 2 + (f.y - y) ** 2; if (d < bd) { bd = d; best = f; } } return best; }

function step(dt) {
  const P = G.P, S = G.S;
  if (G.over) { G.over -= dt; if (G.over <= 0) endRun(); updateFx(dt); return; }
  G.t += dt;
  /* 움직이기 */
  let mx = 0, my = 0;
  if (JOY.on) { const dx = JOY.x - JOY.x0, dy = JOY.y - JOY.y0, d = Math.hypot(dx, dy); if (d > 6) { const k = Math.min(1, d / 50); mx = dx / d * k; my = dy / d * k; } }
  if (KEYS.a || KEYS.arrowleft) mx -= 1; if (KEYS.d || KEYS.arrowright) mx += 1; if (KEYS.w || KEYS.arrowup) my -= 1; if (KEYS.s || KEYS.arrowdown) my += 1;
  if (BOT) { let ax = 0, ay = 0; for (const f of G.foes) { const dx = P.x - f.x, dy = P.y - f.y, d = Math.hypot(dx, dy); if (d < 170 && d > 0) { ax += dx / d * (170 - d); ay += dy / d * (170 - d); } } let o = null, od = 1e9; for (const q of G.orbs) { const d = (q.x - P.x) ** 2 + (q.y - P.y) ** 2; if (d < od) { od = d; o = q; } } if (o && od < 300 * 300) { const d = Math.sqrt(od) || 1; ax += (o.x - P.x) / d * 60; ay += (o.y - P.y) / d * 60; } ax += Math.cos(G.t * 0.3) * 30; ay += Math.sin(G.t * 0.37) * 30; const l = Math.hypot(ax, ay) || 1; mx = ax / l; my = ay / l; }   /* 시험 봇: 몰린 적을 피하고 가까운 영혼을 주움(사람 흉내) */
  const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
  P.x += mx * P.spd * S.spd * dt; P.y += my * P.spd * S.spd * dt; P.moving = ml > 0.1; if (Math.abs(mx) > 0.15) P.dir = Math.sign(mx); P.wf += dt * 24 * (P.moving ? 1 : 0);
  P.inv = Math.max(0, P.inv - dt); P.hurt = Math.max(0, P.hurt - dt);
  /* 적 생겨남 */
  if (!G.bossOn && G.t >= RUN_LEN) spawnBoss();
  const alive = G.foes.length, rate = G.bossOn ? 1.4 : 1.7 + G.t * 0.036, cap = 170;
  G.spawnAcc += dt * rate; while (G.spawnAcc >= 1) { G.spawnAcc--; if (alive < cap) { const ks = Object.keys(KINDS).filter(k => G.t >= KINDS[k].from); spawnFoe(ks[Math.floor(Math.random() * ks.length)]); } }
  if (!G.bossOn && G.t >= G.eliteT) { G.eliteT += 60; const ks = Object.keys(KINDS).filter(k => G.t >= KINDS[k].from && !KINDS[k].far); const e = spawnFoe(ks[Math.floor(Math.random() * ks.length)], true); say('정예 등장!', P.x, P.y - 120, { size: 20, col: '#ff8a6a', life: 1.2, vy: 0 }); e.hp *= 1; }
  /* 칸 나누기(가까운 적 찾기) */
  GRID.clear(); for (const f of G.foes) { if (f.dead) continue; const k = gk(f.x, f.y); let L = GRID.get(k); if (!L) GRID.set(k, L = []); L.push(f); }
  /* 적 */
  for (const f of G.foes) {
    if (f.dead) continue; f.flash = Math.max(0, f.flash - dt); f.wf += dt * 22;
    let tx = P.x, ty = P.y, tgtAlly = null;
    if (!f.boss) { let bd = 46 * 46; for (const a of G.allies) { if (a.dead || a.rise < 1) continue; const d = (a.x - f.x) ** 2 + (a.y - f.y) ** 2; if (d < bd) { bd = d; tgtAlly = a; } } }
    if (tgtAlly) { tx = tgtAlly.x; ty = tgtAlly.y; }
    const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1;
    let v = f.spd; if (f.far && !tgtAlly) { if (d < f.far * 0.8) v = -f.spd * 0.6; else if (d < f.far) v = 0; }
    if (f.boss) { bossAct(f, dt, d); v = f.act === 'idle' ? f.spd : 0; }
    f.x += (dx / d * v + f.kx) * dt; f.y += (dy / d * v + f.ky) * dt; f.kx *= Math.pow(0.002, dt); f.ky *= Math.pow(0.002, dt); if (Math.abs(dx) > 4) f.dir = Math.sign(dx);
    /* 서로 밀어내기 */
    near(f.x, f.y, f.r * 2, o => { if (o === f) return; const ox = f.x - o.x, oy = f.y - o.y, od = Math.hypot(ox, oy), m = f.r + o.r; if (od > 0 && od < m) { const p = (m - od) / m * 40 * dt * 4; f.x += ox / od * p; f.y += oy / od * p; } });
    /* 닿으면 */
    if (tgtAlly && d < f.r + 14) { tgtAlly.hp -= f.dmg * dt; if (tgtAlly.hp <= 0 && !tgtAlly.dead) { tgtAlly.dead = true; burst(tgtAlly.x, tgtAlly.y - 20, 8, ['#d8ccb0', '#9a7ad8'], 160); } }
    else if (!f.boss && Math.hypot(P.x - f.x, P.y - f.y) < f.r + 16) hurtLord(f.dmg);
    if (f.far && !tgtAlly && d < f.far * 1.4) { f.shootT -= dt; if (f.shootT <= 0) { f.shootT = rnd(2.2, 3); const sp = 220; G.arrows.push({ x: f.x, y: f.y - 34, vx: dx / d * sp, vy: dy / d * sp, t: 0, dmg: f.dmg }); } }
    if (f.heal && Math.random() < dt * 0.5) near(f.x, f.y, 90, o => { if (!o.dead && o.hp < o.max) { o.hp = Math.min(o.max, o.hp + o.max * 0.15); G.fx.push({ x: o.x, y: o.y - o.h, vx: 0, vy: -40, t: 0, life: 0.6, col: '#8affb0', s: 5 }); } });
  }
  /* 화살 */
  for (const a of G.arrows) { a.t += dt; a.x += a.vx * dt; a.y += a.vy * dt; if (Math.hypot(a.x - P.x, a.y - (P.y - 30)) < 18) { hurtLord(a.dmg); a.t = 9; } }
  G.arrows = G.arrows.filter(a => a.t < 3);
  /* 내 마법 */
  weapons(dt);
  /* 해골 병사 */
  let slot = 0; const live = G.allies.filter(a => !a.dead);
  for (const a of live) {
    a.t += dt; if (a.rise < 1) { a.rise = Math.min(1, a.rise + dt * 1.8); continue; }
    const tgt = nearestFoe(a.x, a.y, 260); let tx, ty, spd = 125 * (a.big ? 0.9 : 1);
    if (tgt && Math.hypot(tgt.x - P.x, tgt.y - P.y) < 420) { tx = tgt.x - Math.sign(tgt.x - a.x) * (tgt.r + 8); ty = tgt.y; }
    else { const ring = 46 + Math.floor(slot / 10) * 30, ang = slot * 0.63 + G.t * 0.3; tx = P.x + Math.cos(ang) * ring; ty = P.y + Math.sin(ang) * ring * 0.6; slot++; }
    const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
    if (d > 4) { const v = Math.min(spd, d * 4); a.x += dx / d * v * dt; a.y += dy / d * v * dt; a.wf += dt * 26; if (Math.abs(dx) > 3) a.dir = Math.sign(dx); }
    a.atkT -= dt; if (a.af >= 0) a.af += dt * 30;  if (a.af > 19) a.af = -1;
    if (tgt && Math.hypot(tgt.x - a.x, tgt.y - a.y) < tgt.r + 22 && a.atkT <= 0) { a.atkT = 0.75; a.af = 0; a.dir = Math.sign(tgt.x - a.x) || 1; setTimeout(() => { if (!tgt.dead && !a.dead) { hurtFoe(tgt, (a.big ? 16 : 6) * S.allyPow, a.x, a.y, 30); burst(tgt.x, tgt.y - 24, 3, ['#ffffff', '#c9a2ff'], 120, 0.25); } }, 180); }
  }
  G.allies = G.allies.filter(a => !a.dead || false);
  /* 영혼 줍기 */
  for (const o of G.orbs) { o.t += dt; const d = Math.hypot(P.x - o.x, P.y - 20 - o.y); if (d < S.magnet || o.pull) { o.pull = 1; const v = 380 + o.t * 200; o.x += (P.x - o.x) / d * v * dt; o.y += (P.y - 20 - o.y) / d * v * dt; if (d < 16) { o.got = 1; gainXp(o.v); } } }
  G.orbs = G.orbs.filter(o => !o.got); if (G.orbs.length > 400) { let s = 0; for (const o of G.orbs.splice(0, G.orbs.length - 300)) s += o.v; G.orbs[0] && (G.orbs[0].v += s); }
  G.foes = G.foes.filter(f => !f.dead && Math.hypot(f.x - P.x, f.y - P.y) < Math.hypot(W, H) * 1.6);
  updateFx(dt);
}
function gainXp(v) { const G2 = G; G2.xp += v; SND.play('soul', 0.12, rnd(1.1, 1.5)); while (G2.xp >= G2.next) { G2.xp -= G2.next; G2.lvl++; G2.next = Math.round(3 + G2.lvl * 3 + Math.pow(G2.lvl, 1.55)); if (G2.cards) G2.queue = (G2.queue || 0) + 1; else G2.cards = rollCards(); SND.play('up', 0.6); burst(G.P.x, G.P.y - 40, 24, ['#ffe08a', '#fff', '#c9a2ff'], 300); } }

function weapons(dt) {
  const P = G.P, S = G.S, W_ = G.W, h = S.haste;
  /* 영혼탄 */
  if (W_.bolt) { G.cd.bolt -= dt; if (G.cd.bolt <= 0) { const l = W_.bolt, n = 1 + (l >= 2) + (l >= 4) + (l >= 6) * 2, tgt = nearestFoe(P.x, P.y, 520); if (tgt) { G.cd.bolt = 0.85 * h; const base = Math.atan2(tgt.y - tgt.h * 0.4 - (P.y - 50), tgt.x - P.x);
    for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * 0.18; G.shots.push({ x: P.x + P.dir * 16, y: P.y - 50, vx: Math.cos(a) * 460, vy: Math.sin(a) * 460, t: 0, dmg: 12 * (1 + 0.4 * (l >= 3) + 0.4 * (l >= 5)), pierce: l >= 4 ? 2 : 0, hit: new Set() }); } } } }
  for (const s of G.shots) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; near(s.x, s.y + 20, 30, f => { if (s.t > 9 || s.hit.has(f) || f.dead) return; if (Math.hypot(f.x - s.x, f.y - f.h * 0.45 - s.y) < f.r + 10) { s.hit.add(f); hurtFoe(f, s.dmg, s.x - s.vx * 0.05, s.y - s.vy * 0.05, 70); burst(s.x, s.y, 5, ['#d9c2ff', '#ffffff', '#8a4dff'], 150, 0.3); if (s.pierce-- <= 0) s.t = 9; } }); }
  G.shots = G.shots.filter(s => s.t < 1.4);
  /* 뼈 방패 */
  if (W_.orbit) { const l = W_.orbit, n = 2 + (l >= 2) + (l >= 4) + (l >= 5) * 2, R = l >= 4 ? 92 : 74, dmg = 10 * (l >= 3 ? 1.5 : 1); G.orbA = (G.orbA || 0) + dt * 3.2;
    G.orbP = []; for (let i = 0; i < n; i++) { const a = G.orbA + i * 6.283 / n, x = P.x + Math.cos(a) * R, y = P.y - 30 + Math.sin(a) * R * 0.75; G.orbP.push({ x, y, a });
      near(x, y + 20, 30, f => { if (f.dead) return; f.orbT = f.orbT || 0; if (G.t < f.orbT) return; if (Math.hypot(f.x - x, f.y - f.h * 0.4 - y) < f.r + 14) { f.orbT = G.t + 0.45; hurtFoe(f, dmg, P.x, P.y - 30, 110); } }); } }
  /* 저주 늪 */
  if (W_.pool) { G.cd.pool -= dt; if (G.cd.pool <= 0) { const l = W_.pool, n = 1 + (l >= 2) + (l >= 5) * 2; G.cd.pool = 2.6 * h; for (let i = 0; i < n; i++) { const f = G.foes.filter(o => !o.dead && Math.hypot(o.x - P.x, o.y - P.y) < 330)[Math.floor(Math.random() * 40)] || nearestFoe(P.x, P.y, 330); if (f) G.pools.push({ x: f.x + rnd(-20, 20), y: f.y + rnd(-10, 10), t: 0, life: 3, r: 58 * (l >= 3 ? 1.4 : 1), dps: 14 * (l >= 4 ? 1.6 : 1) }); } } }
  for (const p of G.pools) { p.t += dt; near(p.x, p.y, p.r, f => { if (!f.dead && (f.x - p.x) ** 2 / (p.r * p.r) + (f.y - p.y) ** 2 / (p.r * p.r * 0.4) < 1) { f.poolT = (f.poolT || 0) + dt; f.spdMul = 0.6; if (f.poolT > 0.35) { f.poolT = 0; hurtFoe(f, p.dps * 0.35, f.x, f.y, 0); } } }); }
  G.pools = G.pools.filter(p => p.t < p.life);
  /* 사신의 낫 */
  if (W_.scythe) { G.cd.scythe -= dt; const l = W_.scythe; if (G.cd.scythe <= 0) { G.cd.scythe = (l >= 4 ? 2.4 : 3.2) * h; G.sweep = { t: 0, r: 120 * (l >= 3 ? 1.3 : 1), dmg: 30 * (l >= 2 ? 1.5 : 1) * (l >= 5 ? 1.8 : 1), hit: new Set() }; SND.play('slam', 0.25, 1.6); } }
  if (G.sweep) { const s = G.sweep; s.t += dt; const a = s.t / 0.32 * 6.283; near(P.x, P.y, s.r, f => { if (f.dead || s.hit.has(f)) return; const fa = Math.atan2(f.y - P.y, f.x - P.x); let da = ((a % 6.283) - ((fa + 6.283) % 6.283) + 6.283) % 6.283; if (da < 0.9 && Math.hypot(f.x - P.x, (f.y - P.y) / 0.7) < s.r) { s.hit.add(f); hurtFoe(f, s.dmg, P.x, P.y, 160); } }); if (s.t > 0.36) G.sweep = null; }
}
function bossAct(b, dt, d) {
  b.actT -= dt; b.af += dt * (b.act === 'idle' ? 20 : b.act === 'raise' ? 14 : 20);
  if (b.act === 'idle' && b.actT <= 0 && d < 380) { b.act = 'raise'; b.af = 0; b.tx = G.P.x; b.ty = G.P.y; G.slam = { x: b.tx, y: b.ty, r: 120, t: 0 }; }
  else if (b.act === 'raise' && b.af >= 12) { b.act = 'slam'; b.af = 0; }
  else if (b.act === 'slam' && b.af >= 8) { b.act = 'idle'; b.actT = 2.6; shake = 22; SND.play('boom', 0.7); const s = G.slam; if (s) { burst(s.x, s.y, 40, ['#e8dcc0', '#9a7ad8', '#ff8a6a'], 400, 0.8); if (Math.hypot((G.P.x - s.x), (G.P.y - s.y) / 0.6) < s.r) hurtLord(28); for (const a of G.allies) if (Math.hypot(a.x - s.x, (a.y - s.y) / 0.6) < s.r) a.hp -= 40; G.slam = null; } }
}
function updateFx(dt) {
  for (const p of G.fx) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.vx *= 0.97; }
  G.fx = G.fx.filter(p => p.t < p.life);
  for (const t of G.texts) { t.t += dt; t.y += t.vy * dt; } G.texts = G.texts.filter(t => t.t < t.life);
  for (const m of G.marks) m.t += dt; G.marks = G.marks.filter(m => m.t < 0.9);
  if (G.slam) G.slam.t += dt; if (G.banner) { G.banner.t += dt; if (G.banner.t > 2.6) G.banner = null; }
}
function endRun() {
  const gain = Math.round((G.kills / 6 + G.t / 10 + (G.win ? 120 : 0)) * (1 + META.up.gold * 0.1));
  META.gems += gain; META.runs++; META.best = Math.max(META.best, Math.round(G.t)); saveMeta();
  G.result = { gain, win: G.win, t: G.t, kills: G.kills, lvl: G.lvl, army: G.allies.length }; MODE = 'result';
}

/* ── 그리기 ── */
let TILE = null;
function makeTile() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#1d1726'; g.fillRect(0, 0, 512, 512);
  const R = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
  for (let i = 0; i < 70; i++) { const x = R() * 512, y = R() * 512, r = 20 + R() * 70, gr = g.createRadialGradient(x, y, 0, x, y, r); const c1 = R() < 0.5 ? 'rgba(60,40,80,.35)' : 'rgba(10,6,16,.35)'; gr.addColorStop(0, c1); gr.addColorStop(1, 'rgba(0,0,0,0)'); for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) { g.save(); g.translate(ox, oy); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); } }
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5; for (let i = 0; i < 26; i++) { let x = R() * 512, y = R() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 40; y += (R() - 0.5) * 24; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 140; i++) { g.fillStyle = R() < 0.5 ? 'rgba(120,100,140,.25)' : 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(R() * 512, R() * 512, 1 + R() * 3, 1 + R() * 2, 0, 0, 7); g.fill(); }
  for (let i = 0; i < 9; i++) { const x = 30 + R() * 452, y = 30 + R() * 452, s = 0.7 + R() * 0.6; g.save(); g.translate(x, y); g.scale(s, s);   /* 비석 */
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(2, 2, 16, 5, 0, 0, 7); g.fill(); const gr = g.createLinearGradient(-12, -30, 12, 0); gr.addColorStop(0, '#6f6680'); gr.addColorStop(1, '#3d3549'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(-11, 0); g.lineTo(-11, -22); g.arc(0, -22, 11, Math.PI, 0); g.lineTo(11, 0); g.closePath(); g.fill(); g.fillStyle = 'rgba(20,10,30,.6)'; g.fillRect(-1.5, -26, 3, 14); g.fillRect(-6, -21, 12, 3); g.restore(); }
  for (let i = 0; i < 14; i++) { const x = R() * 512, y = R() * 512, a = R() * 3; g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = 'rgba(220,210,190,.35)'; g.fillRect(-7, -1.5, 14, 3); g.beginPath(); g.arc(-7, 0, 2.5, 0, 7); g.arc(7, 0, 2.5, 0, 7); g.fill(); g.restore(); }
  TILE = ctx.createPattern(c, 'repeat');
}
function txt(s, x, y, size, col, o = {}) { ctx.font = `${o.w || 900} ${size}px ${FONT}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; if (o.stroke !== 0) { ctx.lineWidth = o.lw || Math.max(3, size * 0.16); ctx.strokeStyle = o.sc || 'rgba(8,2,16,.92)'; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); } ctx.fillStyle = col; ctx.fillText(s, x, y); }
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function button(x, y, w, h, label, fn, o = {}) {
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, o.gold ? '#ffe08a' : '#8c5cff'); g.addColorStop(1, o.gold ? '#e3a21a' : '#5a2fc0');
  ctx.fillStyle = o.off ? '#3a3046' : g; rr(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = o.gold ? '#fff2c0' : '#b99aff'; ctx.lineWidth = 2; ctx.stroke();
  txt(label, x + w / 2, y + h / 2 + 1, o.size || 20, o.off ? '#9a8fae' : '#ffffff', { sc: o.gold ? '#6a3a00' : '#1a0638' }); if (!o.off) BTNS.push({ x, y, w, h, fn });
}
function icon(n, x, y, s) { const I = IMG[n]; if (I && I.complete && I.naturalWidth) ctx.drawImage(I, x - s / 2, y - s / 2, s, s); }

function draw() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); BTNS = [];
  if (!TILE) makeTile();
  if (MODE === 'title') return drawTitle();
  if (MODE === 'meta') return drawMeta();
  const P = G.P, sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake, cx = W / 2 - P.x + sx, cy = H * 0.52 - P.y + sy;
  /* 바닥 */
  ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = TILE; ctx.fillRect(P.x - W, P.y - H, W * 2, H * 2);
  /* 늪 · 표시 */
  for (const p of G.pools) { const a = Math.min(1, p.t * 4, (p.life - p.t) * 2), gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); gr.addColorStop(0, `rgba(120,255,90,${0.45 * a})`); gr.addColorStop(0.7, `rgba(60,160,40,${0.3 * a})`); gr.addColorStop(1, 'rgba(30,80,20,0)'); ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.5); ctx.translate(-p.x, -p.y); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); ctx.restore(); }
  if (G.slam) { const s = G.slam, k = Math.min(1, s.t / 0.9); ctx.save(); ctx.translate(s.x, s.y); ctx.scale(1, 0.6); ctx.strokeStyle = `rgba(255,60,40,${0.5 + 0.4 * Math.sin(s.t * 20)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, s.r, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,40,30,.22)'; ctx.beginPath(); ctx.arc(0, 0, s.r * k, 0, 7); ctx.fill(); ctx.restore(); }
  for (const m of G.marks) { const k = m.t / 0.9; ctx.save(); ctx.translate(m.x, m.y); ctx.scale(1, 0.4); ctx.strokeStyle = `rgba(190,120,255,${1 - k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 10 + k * 30, 0, 7); ctx.stroke(); ctx.restore(); }
  /* 영혼 */
  for (const o of G.orbs) { const r = 4 + Math.min(4, o.v); ctx.fillStyle = '#7a3aff'; ctx.beginPath(); ctx.arc(o.x, o.y, r + 2, 0, 7); ctx.fill(); ctx.fillStyle = '#d9c2ff'; ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.x - r * 0.3, o.y - r * 0.3, r * 0.35, 0, 7); ctx.fill(); }
  /* 그림자 + 몸(아래쪽이 앞) */
  const list = []; for (const f of G.foes) list.push(f); for (const a of G.allies) list.push(a); list.push(P);
  list.sort((a, b) => a.y - b.y);
  for (const e of list) { const sh = e === P ? 20 : e.boss ? 60 : e.big ? 18 : (e.r || 12) * 1.1; ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(e.x, e.y, sh, sh * 0.32, 0, 0, 7); ctx.fill(); }
  for (const e of list) {
    if (e === P) { const h = 112, bob = P.moving ? 0 : Math.sin(T * 3) * 1.5; ctx.save(); if (P.inv > 0 && Math.floor(T * 20) % 2) ctx.globalAlpha = 0.55; if (P.moving) spr('lordWalk', P.wf, P.x, P.y, h, P.dir, { flash: P.hurt }); else spr('lordIdle', T * 14, P.x, P.y + bob, h * 1.0, P.dir, { flash: P.hurt }); ctx.restore(); continue; }
    if (e.boss) { const s = e.act === 'raise' ? 'giantRaise' : e.act === 'slam' ? 'giantSlam' : 'giantIdle'; spr(s, e.act === 'idle' ? e.af : Math.min(SP[s].n - 1, e.af), e.x, e.y, e.h, e.dir, { flash: e.flash }); continue; }
    if (e.kind) { const K = KINDS[e.kind]; spr(e.s, e.wf, e.x, e.y, e.h, e.dir, { flash: e.flash, col: '#7a8aa0' }); if (e.elite) { ctx.strokeStyle = 'rgba(255,90,60,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * 1.4, e.r * 0.5, 0, 0, 7); ctx.stroke(); }
      if (e.hp < e.max) { const w = e.elite ? 50 : 26; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(e.x - w / 2, e.y - e.h - 8, w, 4); ctx.fillStyle = e.elite ? '#ff7a4a' : '#ff4a5a'; ctx.fillRect(e.x - w / 2, e.y - e.h - 8, w * Math.max(0, e.hp / e.max), 4); } continue; }
    /* 해골 병사 */
    const h = e.big ? 92 : 64; if (e.rise < 1) { ctx.save(); ctx.beginPath(); ctx.rect(e.x - 60, e.y - 200, 120, 200); ctx.clip(); spr('skWalk', 0, e.x, e.y + h * (1 - e.rise), h, e.dir, { flash: 0.15 }); ctx.restore(); continue; }
    if (e.af >= 0) spr('skAtk', e.af, e.x, e.y, h, e.dir); else spr('skWalk', e.wf, e.x, e.y, h, e.dir);
  }
  /* 뼈 방패 · 낫 · 탄 · 화살 */
  if (G.W.orbit && G.orbP) for (const o of G.orbP) { ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a * 3); ctx.fillStyle = '#f3ead2'; ctx.strokeStyle = '#6a4aa0'; ctx.lineWidth = 2; rr(-12, -3.5, 24, 7, 3); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(-12, 0, 5, 0, 7); ctx.arc(12, 0, 5, 0, 7); ctx.fill(); ctx.restore(); }
  if (G.sweep) { const s = G.sweep, a = s.t / 0.32 * 6.283; ctx.save(); ctx.translate(P.x, P.y - 20); ctx.scale(1, 0.7); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { ctx.strokeStyle = `rgba(200,150,255,${0.5 - i * 0.08})`; ctx.lineWidth = 10 - i; ctx.beginPath(); ctx.arc(0, 0, s.r - i * 5, a - 0.9 + i * 0.1, a); ctx.stroke(); } ctx.restore(); }
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
  drawHud();
  if (JOY.on) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(JOY.x0, JOY.y0, 50, 0, 7); ctx.stroke(); const dx = JOY.x - JOY.x0, dy = JOY.y - JOY.y0, d = Math.hypot(dx, dy), k = d > 50 ? 50 / d : 1; ctx.fillStyle = 'rgba(200,170,255,.55)'; ctx.beginPath(); ctx.arc(JOY.x0 + dx * k, JOY.y0 + dy * k, 22, 0, 7); ctx.fill(); }
  if (G.cards) drawCards();
  if (MODE === 'result') drawResult();
}
function drawHud() {
  const top = 10 + (window.visualViewport ? 0 : 0);
  /* 경험치 막대 */
  ctx.fillStyle = 'rgba(10,4,20,.85)'; rr(8, top, W - 16, 14, 7); ctx.fill(); const g = ctx.createLinearGradient(8, 0, W - 8, 0); g.addColorStop(0, '#7a3aff'); g.addColorStop(1, '#d9a2ff'); ctx.fillStyle = g; rr(9, top + 1, (W - 18) * clamp(G.xp / G.next, 0, 1), 12, 6); ctx.fill();
  txt('Lv ' + G.lvl, 18, top + 7.5, 12, '#fff', { align: 'left', lw: 3 });
  /* 시간 · 처치 · 군단 */
  const left = Math.max(0, RUN_LEN - G.t), mm = Math.floor(left / 60), ss = Math.floor(left % 60);
  txt(G.bossOn ? '보스전' : `${mm}:${String(ss).padStart(2, '0')}`, W / 2, top + 36, 26, G.bossOn ? '#ff8a6a' : '#ffffff');
  icon('i_soul', 22, top + 36, 22); txt(G.kills + '', 38, top + 37, 17, '#e8dcff', { align: 'left' });
  const army = G.allies.filter(a => !a.dead).length; icon('i_army', W - 70, top + 36, 24); txt(`${army}/${G.S.cap}`, W - 54, top + 37, 17, army >= G.S.cap ? '#ffd23a' : '#c9a2ff', { align: 'left' });
  if (G.boss && !G.boss.dead) { const w = W - 60, x = 30, y = top + 58; ctx.fillStyle = 'rgba(0,0,0,.7)'; rr(x, y, w, 12, 6); ctx.fill(); ctx.fillStyle = '#ff4a3a'; rr(x + 1, y + 1, (w - 2) * G.boss.hp / G.boss.max, 10, 5); ctx.fill(); txt('묘지의 거인', W / 2, y + 22, 13, '#ffd2c8'); }
  if (G.banner) { const k = G.banner.t, a = Math.min(1, k * 3, (2.6 - k) * 2); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(40,0,10,.75)'; ctx.fillRect(0, H * 0.3 - 30, W, 60); txt(G.banner.text, W / 2, H * 0.3, 26, '#ffd2c8'); ctx.globalAlpha = 1; }
  if (G.t < 6 && !G.cards) { ctx.globalAlpha = Math.min(1, (6 - G.t) / 1.5); txt('화면을 누른 채 끌어서 움직여요', W / 2, H * 0.78, 17, '#e8dcff', { w: 800 }); txt('쓰러뜨린 적이 내 해골 병사로 일어나요', W / 2, H * 0.78 + 26, 15, '#c9a2ff', { w: 800 }); ctx.globalAlpha = 1; }
}
function drawCards() {
  ctx.fillStyle = 'rgba(6,2,14,.82)'; ctx.fillRect(0, 0, W, H);
  txt('레벨 업!', W / 2, H * 0.17, 34, '#ffe08a'); txt('하나를 고르세요', W / 2, H * 0.17 + 36, 16, '#d9c8ff', { w: 800 });
  const cw = Math.min(W - 40, 380), ch = Math.min(110, H * 0.15), x = (W - cw) / 2; let y = H * 0.27;
  G.cards.forEach(c => {
    const l = lv(c.id) + 1, g = ctx.createLinearGradient(0, y, 0, y + ch); g.addColorStop(0, c.w ? '#3a1f6a' : '#2a1c48'); g.addColorStop(1, '#1a0f30'); ctx.fillStyle = g; rr(x, y, cw, ch, 16); ctx.fill(); ctx.strokeStyle = l === 1 && c.w ? '#ffd76a' : '#8c5cff'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(x + 50, y + ch / 2, 34, 0, 7); ctx.fill(); icon(c.icon, x + 50, y + ch / 2, 56);
    txt(c.name, x + 98, y + ch * 0.34, 21, '#ffffff', { align: 'left' }); txt(l === 1 ? '새로!' : 'Lv ' + l, x + cw - 16, y + ch * 0.34, 15, l === 1 ? '#ffd76a' : '#c9a2ff', { align: 'right' });
    txt(c.desc(l), x + 98, y + ch * 0.68, 15, '#e0d4ff', { align: 'left', w: 700, lw: 2 });
    BTNS.push({ x, y, w: cw, h: ch, fn: () => takeCard(c) }); y += ch + 14; });
}
function drawResult() {
  const R = G.result; ctx.fillStyle = 'rgba(6,2,14,.86)'; ctx.fillRect(0, 0, W, H);
  txt(R.win ? '승리!' : '쓰러졌다', W / 2, H * 0.2, 44, R.win ? '#ffe08a' : '#ff8a8a');
  txt(R.win ? '묘지의 거인을 쓰러뜨렸어요' : '군단은 다시 일어설 거예요', W / 2, H * 0.2 + 42, 16, '#d9c8ff', { w: 800 });
  const rows = [['버틴 시간', `${Math.floor(R.t / 60)}분 ${Math.floor(R.t % 60)}초`], ['처치', R.kills], ['레벨', R.lvl], ['마지막 군단', R.army]]; let y = H * 0.34;
  for (const [a, b] of rows) { txt(a, W / 2 - 110, y, 18, '#c9b8e8', { align: 'left', w: 800 }); txt(b + '', W / 2 + 110, y, 20, '#fff', { align: 'right' }); y += 36; }
  icon('relic_glass', W / 2 - 60, y + 24, 40); txt(`결정 +${R.gain}`, W / 2 + 10, y + 26, 26, '#ffe08a'); y += 80;
  button(W / 2 - 140, y, 280, 58, '다시 싸우기', () => newRun(), { gold: 1, size: 22 }); button(W / 2 - 140, y + 72, 280, 52, '군주 강화하기', () => { MODE = 'meta'; }, {});
}
function drawBg() { ctx.fillStyle = TILE; ctx.save(); ctx.translate(-T * 12 % 512, -T * 6 % 512); ctx.fillRect(0, 0, W + 512, H + 512); ctx.restore(); const vg = ctx.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H * 0.45, Math.hypot(W, H) * 0.6); vg.addColorStop(0, 'rgba(60,20,110,.35)'); vg.addColorStop(1, 'rgba(4,0,10,.85)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
function drawTitle() {
  drawBg(); const cx = W / 2;
  txt('망자의 군주', cx, H * 0.13, 46, '#e9dcff', { sc: '#2a0a50', lw: 9 }); txt('쓰러뜨린 적이 나의 군단이 된다', cx, H * 0.13 + 44, 16, '#c9a2ff', { w: 800 });
  const h = Math.min(260, H * 0.32); spr('lordIdle', T * 14, cx - 6, H * 0.55, h, 1);
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + T * 0.4, x = cx + Math.cos(a) * 120, y = H * 0.56 + Math.sin(a) * 26; spr('skWalk', T * 20 + i * 4, x, y, 52, Math.cos(a + 1.57) > 0 ? 1 : -1, { a: 0.85 }); }
  button(cx - 140, H * 0.7, 280, 64, '전투 시작', () => newRun(), { gold: 1, size: 24 });
  button(cx - 140, H * 0.7 + 78, 280, 52, `군주 강화  ·  결정 ${META.gems}`, () => { MODE = 'meta'; }, { size: 17 });
  if (META.best) txt(`최고 기록 ${Math.floor(META.best / 60)}분 ${META.best % 60}초`, cx, H * 0.7 + 152, 14, '#9a8fae', { w: 700 });
}
function drawMeta() {
  drawBg(); txt('군주 강화', W / 2, 54, 30, '#ffe08a'); icon('relic_glass', W / 2 - 50, 92, 26); txt(`결정 ${META.gems}`, W / 2 + 10, 93, 20, '#fff');
  const cw = Math.min(W - 32, 400), x = (W - cw) / 2; let y = 124; const ch = Math.min(84, (H - 240) / META_UP.length - 10);
  for (const u of META_UP) { const l = META.up[u.id], max = l >= u.max, cost = u.cost(l), can = !max && META.gems >= cost;
    ctx.fillStyle = 'rgba(30,18,52,.92)'; rr(x, y, cw, ch, 14); ctx.fill(); ctx.strokeStyle = '#4a3678'; ctx.lineWidth = 1.5; ctx.stroke();
    icon(u.icon, x + 38, y + ch / 2, 48); txt(`${u.name}  Lv ${l}`, x + 72, y + ch * 0.34, 18, '#fff', { align: 'left' }); txt(u.desc(l + (max ? 0 : 1)), x + 72, y + ch * 0.7, 14, '#c9b8e8', { align: 'left', w: 700, lw: 2 });
    button(x + cw - 108, y + ch / 2 - 22, 96, 44, max ? '최대' : `${cost}`, () => { if (META.gems >= cost) { META.gems -= cost; META.up[u.id]++; saveMeta(); } }, { gold: can, off: !can, size: 17 }); y += ch + 10; }
  button(W / 2 - 120, H - 80, 240, 56, '돌아가기', () => { MODE = G && G.result ? 'title' : 'title'; }, {});
}

/* ── 돌리기 ── */
let last = performance.now();
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
  if (MODE === 'play' || MODE === 'result') { shake *= Math.pow(0.003, dt); if (hitstop > 0) { hitstop -= dt; dt *= 0.08; } if (MODE === 'play' && !G.cards) step(dt); else if (G.over) updateFx(dt);
    if (BOT && G.cards) takeCard(G.cards[0]); if (BOT && MODE === 'result' && Q.has('loop')) newRun(); }
  draw(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if (BOT || Q.has('play')) newRun();
window.GAME = { get G() { return G; }, get MODE() { return MODE; }, newRun, META, rollCards };
