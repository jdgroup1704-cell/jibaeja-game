/* 망자의 군주 — 새판(11-19). 옆에서 보는 전장 · 드리미나로 움직이는 캐릭터 · 쓰러진 적이 해골로 일어나 내 군단이 됨.
   화면 기준: 갤럭시 S26 울트라 412×891(CSS 크기). PC에서는 그 크기의 폰 틀 안에 그림. */
'use strict';
const Q = new URLSearchParams(location.search), BOT = Q.has('bot'), MUTE = Q.has('mute'), SPEED = +(Q.get('speed') || 1);
const FONT = "JB,'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif";
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let W = 412, H = 891, DPR = 1, PC = false;
function fit() {
  const iw = innerWidth, ih = innerHeight; PC = iw > ih * 0.75 && iw > 700; document.body.classList.toggle('pc', PC);
  if (PC) { W = 412; H = 891; const s = Math.min((ih - 60) / H, 1.25); cv.style.width = W * s + 'px'; cv.style.height = H * s + 'px'; DPR = (devicePixelRatio || 1) * s; }
  else { W = iw; H = ih; cv.style.width = W + 'px'; cv.style.height = H + 'px'; DPR = devicePixelRatio || 1; }
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
}
addEventListener('resize', fit); fit();

/* ── 그림 ── */
const IMG = {}, META = {};
function img(n, src) { const i = new Image(); i.src = src || `art/${n}.webp`; IMG[n] = i; return i; }
const SHEETS = ['sk', 'lord', 'boss', 'knight'];
for (const n of SHEETS) { img(n); fetch(`art/${n}.json`).then(r => r.ok ? r.json() : null).then(m => { if (m) META[n] = m; }).catch(() => {}); }
for (const n of ['still_sk', 'still_lord', 'still_boss', 'still_knight']) img(n);
/* 동작 구간(칸 번호 · 10칸=1초). 영상을 보고 맞춤 */
const ANIM = {
  sk: { walk: [11, 31], atk: [60, 74], hitAt: 65, flip: true },          /* 영상에서 왼쪽을 봄 → 뒤집어 오른쪽으로 */
  lord: { walk: [12, 26], atk: [54, 74], hitAt: 58, flip: false },
  boss: { walk: [4, 23], atk: [32, 56], hitAt: 43, flip: false },         /* 왼쪽을 봄(적) */
  knight: { walk: [10, 26], atk: [44, 57], hitAt: 52, die: [56, 66], flip: true },   /* 오른쪽을 봄 → 뒤집어 왼쪽으로 */
};
const ready = n => META[n] && IMG[n].complete && IMG[n].naturalWidth;
const TINT = {};   /* 색 입힌 그림판(망령 성기사 · 유령 군단) */
function tinted(n, col, key) { const k = n + key; if (TINT[k]) return TINT[k]; if (!ready(n)) return null; const I = IMG[n], c = document.createElement('canvas'); c.width = I.naturalWidth; c.height = I.naturalHeight; const x = c.getContext('2d'); x.drawImage(I, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); TINT[k] = c; return c; }
const FL = document.createElement('canvas'), FLX = FL.getContext('2d');   /* 맞을 때 하얗게 번쩍 */
/* 칸 하나 그리기: 발을 (x, fy)에, 화면 높이 h */
function drawSp(n, f, x, fy, h, flip, o = {}) {
  const m = META[n]; let I = o.src || IMG[n];
  if (!m || !I || !(I.naturalWidth || I.width)) { const S = IMG['still_' + n]; if (S && S.naturalWidth) { const w = h * S.naturalWidth / S.naturalHeight; ctx.save(); ctx.translate(x, fy); if (flip) ctx.scale(-1, 1); ctx.globalAlpha = o.a ?? 1; ctx.drawImage(S, -w / 2, -h, w, h); ctx.restore(); } return; }
  f = Math.max(0, Math.min(m.n - 1, f | 0)); const sx = (f % m.cols) * m.cw, sy = Math.floor(f / m.cols) * m.ch, s = h / m.ch, w = m.cw * s, top = fy - m.foot * s;
  ctx.save(); ctx.translate(x, 0); if (flip !== !!(ANIM[n] && ANIM[n].flip)) ctx.scale(-1, 1); if (o.a != null) ctx.globalAlpha = o.a;
  if (o.flash > 0) { if (FL.width < m.cw || FL.height < m.ch) { FL.width = m.cw; FL.height = m.ch; } FLX.globalCompositeOperation = 'source-over'; FLX.clearRect(0, 0, FL.width, FL.height); FLX.drawImage(I, sx, sy, m.cw, m.ch, 0, 0, m.cw, m.ch); FLX.globalCompositeOperation = 'source-atop'; FLX.fillStyle = `rgba(255,255,255,${Math.min(1, o.flash)})`; FLX.fillRect(0, 0, m.cw, m.ch); ctx.drawImage(I, sx, sy, m.cw, m.ch, -w / 2, top, w, h); ctx.drawImage(FL, 0, 0, m.cw, m.ch, -w / 2, top, w, h); }
  else ctx.drawImage(I, sx, sy, m.cw, m.ch, -w / 2, top, w, h);
  ctx.restore();
}
const walkF = (n, t) => { const m = META[n], L = (ANIM[n].walk) || (m ? m.loop : [0, 12]); const len = Math.max(2, L[1] - L[0]); return L[0] + Math.floor(t * 10) % len; };

/* ── 소리 ── */
const SND = { ctx: null, buf: {}, on: !MUTE, init() { if (this.ctx || MUTE) return; try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); for (const n of ['hit', 'rise', 'soul', 'slam', 'boom', 'slash', 'shatter', 'bossin', 'ult', 'win', 'legend', 'stamp', 'bgm1']) fetch(`sfx/${n}.mp3`).then(r => r.arrayBuffer()).then(b => this.ctx.decodeAudioData(b)).then(d => { this.buf[n] = d; if (n === 'bgm1') this.music(); }).catch(() => {}); } catch (e) {} },
  last: {}, play(n, v = 0.5, r = 1) { if (!this.ctx || !this.on || !this.buf[n]) return; const t = this.ctx.currentTime; if (t - (this.last[n] || 0) < 0.05) return; this.last[n] = t; const s = this.ctx.createBufferSource(), g = this.ctx.createGain(); s.buffer = this.buf[n]; s.playbackRate.value = r * (0.95 + Math.random() * 0.1); g.gain.value = v; s.connect(g).connect(this.ctx.destination); s.start(); },
  music() { if (this.bgm || !this.buf.bgm1) return; const s = this.ctx.createBufferSource(), g = this.ctx.createGain(); s.buffer = this.buf.bgm1; s.loop = true; g.gain.value = this.on ? 0.2 : 0; s.connect(g).connect(this.ctx.destination); s.start(); this.bgm = s; this.bgmG = g; },
  toggle() { this.on = !this.on; if (this.bgmG) this.bgmG.gain.value = this.on ? 0.2 : 0; } };

/* ── 상태 ── */
const FIELD = { top: 70, gy0: 548, gy1: 690 };   /* 땅 깊이: 뒤 548 ~ 앞 690 */
const zY = z => FIELD.gy0 + z * (FIELD.gy1 - FIELD.gy0), zS = z => 0.78 + z * 0.36;
let G;
function newGame() {
  G = { t: 0, stage: 1, wave: 1, waveN: 4, armyT: 0, spawnLeft: 0, spawnT: 0, phase: 'march', phaseT: 0, scroll: 0, sk: [], foes: [], fx: [], nums: [], shots: [], bones: [], pops: [],
    lord: { x: 74, z: 0.3, hp: 400, max: 400, castT: 1.2, atk: -1, at: 0, flash: 0 }, souls: 0, atkLv: 1, kills: 0, ult: 0, stormCd: 0, hitstop: 0, shake: 0, flashW: 0, slow: 1, slowT: 0,
    banner: null, boss: null, champ: null, best: 0, combo: 0, comboT: 0, darken: 0 };
  for (let i = 0; i < 6; i++) addSk(150 + Math.random() * 120, Math.random(), true);
  startWave();
}
const skAtk = () => 10 * (1 + (G.atkLv - 1) * 0.35) * (1 + (G.extra || 0) * 0.02);
function addSk(x, z, instant) { const s = { x, z, tx: 0, hp: 60, max: 60, st: instant ? 'march' : 'rise', t: Math.random() * 3, rise: instant ? 1 : 0, atk: -1, at: 0, flash: 0, vx: 0, vy: 0, fy: 0, id: Math.random() }; G.sk.push(s); slotAll(); return s; }
function slotAll() {   /* 진형: 군주 앞으로 세 줄 */
  const L = G.sk.filter(s => s.st !== 'dead'); L.sort((a, b) => a.id - b.id);
  L.forEach((s, i) => { const col = Math.floor(i / 4), row = i % 4; s.slotX = 118 + col * 25 + (row % 2) * 11; s.slotZ = [0.05, 0.36, 0.66, 0.95][row] + ((s.id * 10) % 1 - 0.5) * 0.1; });
}
function startWave() {
  const S = G.stage, w = G.wave; G.phase = 'fight'; G.phaseT = 0;
  if (w === G.waveN) { G.spawnLeft = 2 + S; spawnBoss(); }
  else { G.spawnLeft = 3 + w * 2 + (S - 1) * 3; }
  G.spawnT = 0.3;
}
function spawnFoe(x) { const S = G.stage, hp = (34 + G.wave * 6) * (1 + (S - 1) * 0.6); G.foes.push({ x: x ?? W + 30 + Math.random() * 40, z: Math.random(), hp, max: hp, st: 'walk', t: Math.random() * 2, atk: -1, at: 0, flash: 0, die: 0, vx: 0, spd: 34 + Math.random() * 14, dmg: 6 + S * 2 }); }
function spawnBoss() { const S = G.stage, hp = 3000 * (1 + (S - 1) * 0.8); G.boss = { x: W + 140, z: 0.5, hp, max: hp, st: 'enter', t: 0, atk: -1, at: 0, slamT: 2.6, warn: 0, flash: 0, dead: 0 }; G.banner = { text: '황금 성기사 단장', sub: '빛의 수호자가 길을 막는다', t: 0, col: '#ffd76a' }; G.darken = 0.6; SND.play('bossin', 0.8); SND.play('stamp', 0.5); G.shake = 10; }

/* ── 효과 ── */
function burst(x, y, n, cols, sp = 220, g = 600, life = 0.7, sz = 3) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = sp * (0.3 + Math.random() * 0.8); G.fx.push({ k: 'p', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.3, g, t: 0, life: life * (0.6 + Math.random() * 0.6), c: cols[i % cols.length], s: sz * (0.6 + Math.random() * 0.9) }); } }
function ring(x, y, r, col, life = 0.4, w = 6) { G.fx.push({ k: 'r', x, y, r0: 10, r, col, t: 0, life, w }); }
function num(x, y, v, col = '#fff', big) { G.nums.push({ x: x + (Math.random() - 0.5) * 16, y, v: Math.round(v), col, t: 0, big }); }
function pop(x, y, text, col) { G.pops.push({ x, y, text, col, t: 0 }); }
function hit(o, dmg, kx = 0, col) { o.hp -= dmg; o.flash = 0.75; if (kx) o.x += kx; num(o.x, (o.fyTop || zY(o.z) - 80), dmg, col || '#ffffff', dmg > 60); }

/* ── 갱신 ── */
function update(dt) {
  if (G.hitstop > 0) { G.hitstop -= dt; return; }
  if (G.slowT > 0) { G.slowT -= dt; dt *= G.slow; }
  G.t += dt; G.phaseT += dt; G.armyT = Math.max(0, G.armyT - dt); G.stormCd = Math.max(0, G.stormCd - dt); if (G.comboT > 0) G.comboT -= dt; else G.combo = 0;
  G.shake = Math.max(0, G.shake - dt * 40); G.flashW = Math.max(0, G.flashW - dt * 3); G.darken = Math.max(G.boss && !G.boss.dead ? 0.18 : 0, G.darken - dt * 0.8);
  const fight = G.foes.length || (G.boss && !G.boss.dead);
  if (!fight) { G.scroll += dt * 60; }
  /* 적 나오기 */
  if (G.spawnLeft > 0) { G.spawnT -= dt; if (G.spawnT <= 0) { spawnFoe(); G.spawnLeft--; G.spawnT = 0.55 + Math.random() * 0.5; } }
  else if (!G.foes.length && !(G.boss && !G.boss.dead) && G.phase === 'fight') { G.phase = 'march'; G.phaseT = 0; if (G.wave >= G.waveN) { G.stage++; G.wave = 1; G.banner = { text: `제 ${G.stage} 장`, sub: '군단이 다음 땅으로 행진한다', t: 0, col: '#c9a2ff' }; } else G.wave++; }
  if (G.phase === 'march' && G.phaseT > 2.4) startWave();
  /* 군주 */
  const L = G.lord; L.flash = Math.max(0, L.flash - dt * 5); L.castT -= dt;
  if (L.atk >= 0) { L.at += dt * 10; const A = ANIM.lord, f = A.atk[0] + L.at; if (!L.fired && f >= A.hitAt) { L.fired = 1; castSoul(); } if (f >= A.atk[1]) L.atk = -1; }
  else if (L.castT <= 0 && nearestFoe(L.x)) { L.atk = 0; L.at = 0; L.fired = 0; L.castT = 2.4; }
  /* 해골 */
  for (const s of G.sk) {
    s.t += dt; s.flash = Math.max(0, s.flash - dt * 6);
    if (s.st === 'rise') { s.rise += dt / 0.9; if (s.rise >= 1) { s.rise = 1; s.st = 'march'; } continue; }
    if (s.st === 'fly') { s.x += s.vx * dt; s.fy += s.vy * dt; s.vy += 1400 * dt; s.spin += s.vs * dt; if (s.fy >= 0) { s.fy = 0; s.st = s.hp > 0 ? 'march' : 'dead'; if (s.hp <= 0) { burst(s.x, zY(s.z) - 20, 10, ['#e8dcc0', '#bfb59a'], 200); G.bones.push({ x: s.x, z: s.z, t: 0 }); } else burst(s.x, zY(s.z), 6, ['#6a5a7a'], 120); } continue; }
    if (s.st === 'dead') continue;
    const tg = targetFor(s);
    if (s.atk >= 0) { s.at += dt * 12; const A = ANIM.sk, f = A.atk[0] + s.at; if (!s.hitDone && f >= A.hitAt) { s.hitDone = 1; if (tg && Math.abs(tg.x - s.x) < 62) { const crit = Math.random() < 0.15; hit(tg, skAtk() * (crit ? 2.5 : 1) * (0.8 + Math.random() * 0.4), 5, crit ? '#ffe14d' : '#fff'); SND.play('slash', 0.25); burst(tg.x - 10, zY(tg.z) - 50 * zS(tg.z), crit ? 10 : 5, crit ? ['#ffe14d', '#fff'] : ['#d9c2ff', '#fff'], 160, 300, 0.3, 2.5); if (crit) { G.hitstop = 0.03; G.shake = Math.max(G.shake, 3); } } } if (f >= A.atk[1]) s.atk = -1; }
    else if (tg && Math.abs(tg.x - s.x) < 56) { s.atk = 0; s.at = Math.random() * 2; s.hitDone = 0; }
    else { const gx = tg ? tg.x - 46 : s.slotX + (fight ? 0 : 0), dx = gx - s.x, sp = tg ? 95 : 70; if (Math.abs(dx) > 3) s.x += Math.sign(dx) * Math.min(Math.abs(dx), sp * dt); const dz = (tg ? tg.z : s.slotZ) - s.z; s.z += Math.sign(dz) * Math.min(Math.abs(dz), dt * 0.6); }
    s.x = Math.max(100, Math.min(W - 110, s.x));
  }
  G.sk = G.sk.filter(s => s.st !== 'dead');
  /* 적 기사 */
  for (const f of G.foes) {
    f.t += dt; f.flash = Math.max(0, f.flash - dt * 10);
    if (f.st === 'die') { f.die += dt * 10; const A = ANIM.knight; if (A.die[0] + f.die >= A.die[1]) { f.st = 'lie'; f.lieT = 0; } continue; }
    if (f.st === 'lie') { f.lieT += dt; if (f.lieT > 0.45 && !f.raised) { f.raised = 1; raiseFrom(f); } continue; }
    if (f.hp <= 0) { f.st = 'die'; f.die = 0; G.kills++; G.combo++; G.comboT = 1.6; G.ult = Math.min(1, G.ult + 0.045); G.souls += 3 + G.stage; SND.play('hit', 0.4); burst(f.x, zY(f.z) - 40, 12, ['#bcd6ff', '#ffffff', '#7a8aa8'], 230); if (G.combo >= 5 && G.combo % 5 === 0) pop(W / 2, 230, `${G.combo} 연속 처치!`, '#ffe14d'); continue; }
    const tg = nearestAlly(f.x);
    if (f.atk >= 0) { f.at += dt * 9; const A = ANIM.knight, fr = A.atk[0] + f.at; if (!f.hitDone && fr >= A.hitAt) { f.hitDone = 1; if (tg && Math.abs(tg.x - f.x) < 58) { if (tg === G.lord) { G.lord.hp -= f.dmg; G.lord.flash = 1; G.shake = Math.max(G.shake, 4); } else { tg.hp -= f.dmg; tg.flash = 1; if (tg.hp <= 0) { tg.st = 'dead'; burst(tg.x, zY(tg.z) - 30, 10, ['#e8dcc0', '#bfb59a'], 200); G.bones.push({ x: tg.x, z: tg.z, t: 0 }); } } } } if (fr >= A.atk[1]) f.atk = -1; }
    else if (tg && Math.abs(tg.x - f.x) < 52 && f.x < W - 100) { f.atk = 0; f.at = 0; f.hitDone = 0; }
    else { f.x -= f.spd * dt; if (tg) { const dz = tg.z - f.z; f.z += Math.sign(dz) * Math.min(Math.abs(dz), dt * 0.25); } }
  }
  G.foes = G.foes.filter(f => !(f.st === 'lie' && f.raised && f.lieT > 1.2));
  if (G.lord.hp <= 0) lordFall();
  /* 보스 */
  const B = G.boss;
  if (B && !B.dead) { B.t += dt; B.flash = Math.max(0, B.flash - dt * 5);
    if (B.st === 'enter') { B.x -= 60 * dt; if (B.x <= W - 92) { B.st = 'walk'; } }
    else { const front = Math.min(...G.sk.filter(s => s.st === 'march').map(s => s.x), W); if (B.atk < 0) { if (B.x - front > 110 && B.x > W - 140) B.x -= 26 * dt; B.slamT -= dt; if (B.slamT <= 0) { B.atk = 0; B.at = 0; B.hitDone = 0; B.warn = 1; B.slamX = B.x - 110; SND.play('stamp', 0.4, 0.8); } }
      else { B.at += dt * 9; const A = ANIM.boss, fr = A.atk[0] + B.at; if (!B.hitDone && fr >= A.hitAt) { B.hitDone = 1; B.warn = 0; bossSlam(B); } if (fr >= A.atk[1]) { B.atk = -1; B.slamT = 3.2 + Math.random() * 1.2; } } }
    if (B.hp <= 0) bossDie(B);
  }
  if (B && B.dead) { B.dead += dt; if (B.dead > 2.2 && !B.risen) { B.risen = 1; champRise(B); } }
  const C = G.champ; if (C) { C.t += dt; C.flash = Math.max(0, C.flash - dt * 5); C.rise = Math.min(1, (C.rise || 0) + dt / 1.4);
    const tg = nearestFoe(C.x) || (G.boss && !G.boss.dead ? G.boss : null); if (C.rise >= 1) { if (C.atk >= 0) { C.at += dt * 9; const A = ANIM.boss, fr = A.atk[0] + C.at; if (!C.hitDone && fr >= A.hitAt) { C.hitDone = 1; champSlam(C); } if (fr >= A.atk[1]) C.atk = -1; } else if (tg && tg.x - C.x < 150) { C.atk = 0; C.at = 0; C.hitDone = 0; } else { const gx = Math.min(230, tg ? tg.x - 130 : 210), dx = gx - C.x; if (Math.abs(dx) > 4) C.x += Math.sign(dx) * Math.min(Math.abs(dx), 40 * dt); } } }
  /* 영혼탄 */
  for (const p of G.shots) { p.t += dt; const tx = p.tg.x, ty = zY(p.tg.z) - 50; const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1, sp = 640; p.x += dx / d * sp * dt; p.y += dy / d * sp * dt + Math.sin(p.t * 20) * 0.6; if (Math.random() < 0.9) G.fx.push({ k: 'p', x: p.x, y: p.y, vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40, g: -40, t: 0, life: 0.35, c: Math.random() < 0.5 ? '#c78bff' : '#7a3cff', s: 4 }); if (d < 20 || p.t > 1.5) { p.done = 1; soulBoom(tx, ty, p.big); } }
  G.shots = G.shots.filter(p => !p.done);
  /* 유령 군단(필살기) */
  if (G.U) { const U = G.U; U.t += dt; const fx = -200 + U.t * 520; for (const o of [...G.foes, G.boss].filter(o => o && !(o.dead) && o.hp > 0 && o.st !== 'die' && o.st !== 'lie')) { if (!U.hit.has(o) && o.x < fx + 60) { U.hit.add(o); hit(o, o === G.boss ? 380 * (1 + (G.stage - 1) * 0.8) : 999, 30, '#7affd8'); burst(o.x, zY(o.z || 0.5) - 60, 14, ['#7affd8', '#ffffff', '#3affb0'], 260); G.shake = Math.max(G.shake, 6); G.hitstop = 0.02; } } if (U.t > 1.6) G.U = null; }
  /* 입자 · 숫자 */
  for (const p of G.fx) { p.t += dt; if (p.k === 'p') { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; } }
  G.fx = G.fx.filter(p => p.t < p.life); if (G.fx.length > 700) G.fx.splice(0, G.fx.length - 700);
  for (const n of G.nums) n.t += dt; G.nums = G.nums.filter(n => n.t < 0.9);
  for (const p of G.pops) p.t += dt; G.pops = G.pops.filter(p => p.t < 1.4);
  for (const b of G.bones) b.t += dt; G.bones = G.bones.filter(b => b.t < 6);
  if (G.banner) { G.banner.t += dt; if (G.banner.t > 2.6) G.banner = null; }
  if (BOT) botTick(dt);
}
function nearestFoe(x) { let b = null, bd = 1e9; for (const f of G.foes) if (f.hp > 0 && f.st === 'walk' && f.x < W - 80) { const d = Math.abs(f.x - x); if (d < bd) { bd = d; b = f; } } if (!b && G.boss && !G.boss.dead && G.boss.x < W) b = G.boss; return b; }
function targetFor(s) { let b = null, bd = 1e9; for (const f of G.foes) if (f.hp > 0 && f.st === 'walk' && f.x < W - 95) { const d = Math.abs(f.x - s.x) + Math.abs(f.z - s.z) * 60; if (d < bd) { bd = d; b = f; } } if (G.boss && !G.boss.dead && G.boss.st !== 'enter') { const d = Math.abs(G.boss.x - 90 - s.x); if (!b || d < bd - 40) b = { x: G.boss.x - 70, z: s.z, boss: 1, get hp() { return G.boss.hp; }, set hp(v) { G.boss.hp = v; }, set flash(v) { G.boss.flash = v; } }; } return b; }
function nearestAlly(x) { let b = null, bd = 1e9; for (const s of G.sk) if (s.st === 'march') { const d = x - s.x; if (d > -30 && d < bd) { bd = d; b = s; } } if (G.champ && G.champ.rise >= 1) { const d = x - G.champ.x - 40; if (d > -30 && d < bd) b = { x: G.champ.x + 40, z: 0.5, get hp() { return 1; }, set hp(v) {}, set flash(v) { G.champ.flash = v; } }; } if (!b) b = G.lord; return b; }

function castSoul() { const L = G.lord, tg = nearestFoe(L.x); if (!tg) return; const big = G.sk.length >= 20; G.shots.push({ x: L.x + 30, y: zY(L.z) - 120, tg, t: 0, big }); SND.play('soul', 0.45); burst(L.x + 34, zY(L.z) - 118, 10, ['#c78bff', '#ffffff'], 160, 0, 0.35); }
function soulBoom(x, y, big) { const R = big ? 95 : 70, dmg = 26 * (1 + (G.atkLv - 1) * 0.35) * (1 + G.stage * 0.3); ring(x, y, R, '#c78bff', 0.35, 7); burst(x, y, 22, ['#c78bff', '#7a3cff', '#ffffff'], 300, 300, 0.5); G.shake = Math.max(G.shake, 5); SND.play('boom', 0.35);
  for (const f of G.foes) if (f.hp > 0 && f.st === 'walk' && Math.abs(f.x - x) < R) hit(f, dmg, 14, '#e2c6ff');
  if (G.boss && !G.boss.dead && Math.abs(G.boss.x - x) < R + 40) hit(G.boss, dmg, 0, '#e2c6ff'); }
function raiseFrom(f) {   /* ★ 쓰러진 기사의 영혼이 타오르고 해골로 일어남 */
  const y = zY(f.z); for (let i = 0; i < 16; i++) G.fx.push({ k: 'w', x: f.x + (Math.random() - 0.5) * 30, y: y - Math.random() * 20, vx: (Math.random() - 0.5) * 30, vy: -80 - Math.random() * 120, g: -60, t: 0, life: 0.9, c: Math.random() < 0.6 ? '#5fffc8' : '#c9a2ff', s: 5 });
  ring(f.x, y - 4, 46, '#5fffc8', 0.5, 4);
  if (G.sk.length < 24) { const s = addSk(f.x, f.z); s.raiseFx = 1; }
  else { G.extra = (G.extra || 0) + 1; }   /* 화면에 24명 넘으면 뒤에서 행진(숫자 · 공격력으로만 셈) */
  SND.play('rise', 0.4); pop(f.x, y - 130, '+1 군단', '#5fffc8'); G.armyT = 0.5;
}
function bossSlam(B) { const x = B.slamX, y = zY(0.5); ring(x, y, 170, '#ffd76a', 0.5, 10); ring(x, y, 110, '#ffffff', 0.3, 6); burst(x, y, 40, ['#ffd76a', '#fff2c0', '#c8a050'], 420, 900, 0.8, 4); G.shake = 22; G.hitstop = 0.08; G.flashW = 0.35; SND.play('slam', 0.8);
  for (const s of G.sk) if (s.st === 'march' && Math.abs(s.x - x) < 170) { const k = 1 - Math.abs(s.x - x) / 170; s.st = 'fly'; s.vx = -90 - 220 * k * Math.random(); s.vy = -260 - 260 * k * (0.6 + Math.random() * 0.6); s.fy = -1; s.spin = 0; s.vs = (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 7); s.hp -= 8 + 14 * k; s.atk = -1; }
  if (Math.abs(G.lord.x - x) < 170) { G.lord.hp -= 30; G.lord.flash = 1; } }
function champSlam(C) { const x = C.x + 130, y = zY(0.5); ring(x, y, 150, '#5fffc8', 0.5, 9); burst(x, y, 30, ['#5fffc8', '#c9a2ff', '#ffffff'], 380, 900, 0.7, 4); G.shake = Math.max(G.shake, 12); G.hitstop = 0.05; SND.play('slam', 0.6, 1.1);
  for (const f of G.foes) if (f.hp > 0 && f.st === 'walk' && Math.abs(f.x - x) < 150) hit(f, 140 * (1 + G.stage * 0.4), 40, '#7affd8');
  if (G.boss && !G.boss.dead && Math.abs(G.boss.x - x) < 190) hit(G.boss, 160 * (1 + G.stage * 0.4), 0, '#7affd8'); }
function bossDie(B) { B.dead = 0.001; G.slow = 0.25; G.slowT = 1.1; G.flashW = 1; G.shake = 30; G.hitstop = 0.12; SND.play('shatter', 0.8); SND.play('legend', 0.5);
  const m = META.boss, h = 300, fy = zY(B.z); G.shards = [];   /* 보스 그림을 조각내 흩뿌림 */
  for (let i = 0; i < 6; i++) for (let j = 0; j < 8; j++) G.shards.push({ i, j, x: B.x, y: fy, vx: (i - 2.5) * 60 + (Math.random() - 0.5) * 160, vy: -200 - Math.random() * 380 + j * 20, r: 0, vr: (Math.random() - 0.5) * 10, t: 0, f: ANIM.boss.atk[0], h });
  burst(B.x, fy - 120, 70, ['#ffd76a', '#ffffff', '#fff2c0'], 520, 500, 1.1, 5); G.banner = { text: '단장 격파!', sub: '그 영혼은 이제 군주의 것', t: 0, col: '#ffd76a' }; G.souls += 120 * G.stage; G.ult = Math.min(1, G.ult + 0.3); }
function champRise(B) { const fy = zY(0.5); G.champ = { x: Math.min(B.x, 230), z: 0.5, t: 0, atk: -1, at: 0, flash: 0, rise: 0 }; G.boss = null; G.shards = null; G.darken = 0.7; G.flashW = 0.6; G.shake = 16;
  for (let i = 0; i < 40; i++) G.fx.push({ k: 'w', x: G.champ.x + (Math.random() - 0.5) * 120, y: fy - Math.random() * 40, vx: (Math.random() - 0.5) * 60, vy: -120 - Math.random() * 200, g: -60, t: 0, life: 1.4, c: Math.random() < 0.6 ? '#5fffc8' : '#c9a2ff', s: 6 });
  ring(G.champ.x, fy, 140, '#5fffc8', 0.8, 8); SND.play('rise', 0.8, 0.7); SND.play('legend', 0.6, 0.9); G.banner = { text: '망령 성기사 합류!', sub: '쓰러뜨린 단장이 군단의 수호자로 일어났다', t: 0, col: '#5fffc8' }; }
function lordFall() { G.banner = { text: '군주가 물러난다', sub: '군단을 다시 모아 일어선다', t: 0, col: '#ff8a8a' }; G.foes = []; G.boss = null; G.lord.hp = G.lord.max; G.wave = 1; G.phase = 'march'; G.phaseT = 0; G.spawnLeft = 0; }

/* 단추 기술 */
function doStorm() { if (G.stormCd > 0) return; G.stormCd = 9; const L = G.foes.filter(f => f.hp > 0 && f.st === 'walk' && f.x < W); for (let i = 0; i < 7; i++) { const tg = L[i % Math.max(1, L.length)] || (G.boss && !G.boss.dead ? G.boss : null); if (!tg) break; setTimeout(() => { if (!G) return; G.shots.push({ x: G.lord.x + 30, y: zY(G.lord.z) - 130 - i * 6, tg, t: 0, big: 1 }); SND.play('soul', 0.35, 1.2); }, i * 70); } G.lord.atk = 0; G.lord.at = 0; G.lord.fired = 1; }
function doUlt() { if (G.ult < 1 || G.U) return; G.ult = 0; G.U = { t: 0, hit: new Set() }; G.darken = 0.75; G.flashW = 0.4; G.shake = 14; SND.play('ult', 0.8); G.banner = { text: '망자의 행진', sub: '', t: 0.4, col: '#7affd8' }; }
function doUp() { const c = upCost(); if (G.souls < c) return; G.souls -= c; G.atkLv++; G.lord.max += 40; G.lord.hp = G.lord.max; SND.play('win', 0.4, 1.3); pop(W / 2, 300, `군단 공격 Lv.${G.atkLv}`, '#ffe08a'); for (const s of G.sk) { burst(s.x, zY(s.z) - 40, 3, ['#ffe08a'], 120, 0, 0.5); } }
const upCost = () => Math.round(40 * Math.pow(1.45, G.atkLv - 1));

/* ── 그리기 ── */
const BTN = [];
function drawBg() {
  const g = ctx.createLinearGradient(0, 0, 0, FIELD.gy0); g.addColorStop(0, '#120624'); g.addColorStop(0.55, '#3a0f3a'); g.addColorStop(1, '#6a1f3a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, FIELD.gy0 + 10);
  /* 달 */
  const mx = W * 0.83, my = 300; const mg = ctx.createRadialGradient(mx, my, 10, mx, my, 160); mg.addColorStop(0, 'rgba(255,210,220,.55)'); mg.addColorStop(1, 'rgba(255,120,160,0)'); ctx.fillStyle = mg; ctx.fillRect(mx - 170, my - 170, 340, 340); ctx.fillStyle = '#ffd9e0'; ctx.beginPath(); ctx.arc(mx, my, 46, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(200,120,150,.35)'; ctx.beginPath(); ctx.arc(mx + 12, my - 8, 10, 0, 7); ctx.arc(mx - 14, my + 14, 7, 0, 7); ctx.fill();
  /* 구름(천천히 흐름) · 가끔 번개 */
  for (let i = 0; i < 5; i++) { const cx = ((i * 140 - G.t * (6 + i * 2) - G.scroll * 0.08) % (W + 300) + W + 300) % (W + 300) - 150, cy = 120 + i * 46 + Math.sin(i * 3) * 20; ctx.fillStyle = `rgba(${60 + i * 8},${20 + i * 4},${60 + i * 6},.35)`; ctx.beginPath(); ctx.ellipse(cx, cy, 90 + i * 10, 16 + i * 2, 0, 0, 7); ctx.ellipse(cx + 50, cy - 8, 60, 14, 0, 0, 7); ctx.fill(); }
  { const k = (G.t % 9.3); if (k < 0.18) { ctx.fillStyle = `rgba(230,200,255,${0.25 * (1 - k / 0.18)})`; ctx.fillRect(0, 0, W, FIELD.gy0); } }
  /* 먼 성 · 산 실루엣(느리게 흐름) */
  const s1 = G.scroll * 0.15, s2 = G.scroll * 0.4, s3 = G.scroll;
  ctx.fillStyle = '#2a0c30'; ctx.beginPath(); ctx.moveTo(0, FIELD.gy0); for (let x = -40; x <= W + 40; x += 20) { const X = x - (s1 % 40); ctx.lineTo(X, 380 + Math.sin((x + Math.floor(s1 / 40) * 40) * 0.013) * 40 + Math.sin(x * 0.05) * 8); } ctx.lineTo(W, FIELD.gy0); ctx.fill();
  ctx.fillStyle = '#1e0822'; for (let i = -1; i < 4; i++) { const bx = ((i * 190 - s1 * 1.3) % 760 + 760) % 760 - 120; ctx.fillRect(bx, 330, 22, 120); ctx.fillRect(bx + 30, 360, 60, 90); ctx.fillRect(bx + 96, 310, 18, 140); ctx.beginPath(); ctx.moveTo(bx - 4, 330); ctx.lineTo(bx + 11, 300); ctx.lineTo(bx + 26, 330); ctx.moveTo(bx + 92, 310); ctx.lineTo(bx + 105, 280); ctx.lineTo(bx + 118, 310); ctx.fill(); }
  ctx.fillStyle = '#150517'; ctx.beginPath(); ctx.moveTo(0, FIELD.gy0); for (let x = -30; x <= W + 30; x += 15) { const k = x + (Math.floor(s2 / 30) * 30); ctx.lineTo(x - (s2 % 30), 455 + Math.sin(k * 0.031) * 18 + Math.sin(k * 0.11) * 6); } ctx.lineTo(W, FIELD.gy0); ctx.fill();
  /* 죽은 나무 */
  ctx.strokeStyle = '#0d0310'; ctx.lineCap = 'round'; for (let i = 0; i < 4; i++) { const tx = ((i * 150 - s2) % 600 + 600) % 600 - 60, ty = 470; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(tx, ty + 20); ctx.lineTo(tx + 4, ty - 50); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tx + 3, ty - 30); ctx.lineTo(tx - 22, ty - 58); ctx.moveTo(tx + 4, ty - 44); ctx.lineTo(tx + 26, ty - 72); ctx.moveTo(tx - 12, ty - 45); ctx.lineTo(tx - 16, ty - 66); ctx.stroke(); }
  /* 떠다니는 불씨(하늘이 살아 있게) */
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const sp = 8 + (i * 7) % 13, x = ((i * 53 + G.t * sp * 2 - G.scroll * 0.3) % (W + 40) + W + 40) % (W + 40) - 20, y = FIELD.gy0 - ((i * 97 + G.t * sp * 3) % 420), a = 0.25 + 0.25 * Math.sin(G.t * 2 + i); ctx.fillStyle = i % 3 ? `rgba(255,140,170,${a})` : `rgba(190,140,255,${a})`; ctx.beginPath(); ctx.arc(x, y, 1.2 + (i % 3) * 0.7, 0, 7); ctx.fill(); } ctx.restore();
  /* 땅 */
  const gg = ctx.createLinearGradient(0, FIELD.gy0 - 30, 0, H); gg.addColorStop(0, '#2a1230'); gg.addColorStop(0.3, '#1c0c22'); gg.addColorStop(1, '#0a050e'); ctx.fillStyle = gg; ctx.fillRect(0, FIELD.gy0 - 30, W, H);
  ctx.strokeStyle = 'rgba(150,90,190,.10)'; ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { const y = FIELD.gy0 - 20 + i * i * 6; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  /* 묘비(앞쪽이 빨리 흐름) */
  for (let i = 0; i < 7; i++) { const z = (i * 0.37) % 1, sp = 0.6 + z * 0.8, gx = ((i * 97 - s3 * sp) % (W + 80) + W + 80) % (W + 80) - 40, gy = zY(z) - 30 + (i % 2) * 6, sc = zS(z) * 0.8; ctx.fillStyle = `rgba(${40 + z * 30},${26 + z * 14},${52 + z * 20},.9)`; ctx.beginPath(); ctx.moveTo(gx - 11 * sc, gy + 20 * sc); ctx.lineTo(gx - 11 * sc, gy); ctx.arc(gx, gy, 11 * sc, Math.PI, 0); ctx.lineTo(gx + 11 * sc, gy + 20 * sc); ctx.fill(); }
}
function shadow(x, fy, w) { ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.beginPath(); ctx.ellipse(x, fy + 2, w, w * 0.22, 0, 0, 7); ctx.fill(); }
function txt(s, x, y, size, col, o = {}) { ctx.font = `${o.w || 900} ${size}px ${FONT}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; if (o.stroke !== 0) { ctx.lineWidth = o.lw || Math.max(3, size * 0.18); ctx.strokeStyle = o.sc || 'rgba(8,2,16,.95)'; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); } ctx.fillStyle = col; ctx.fillText(s, x, y); }
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

function draw() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); BTN.length = 0;
  const sx = (Math.random() - 0.5) * G.shake, sy = (Math.random() - 0.5) * G.shake; ctx.save(); ctx.translate(sx, sy);
  drawBg();
  if (G.darken > 0) { ctx.fillStyle = `rgba(4,0,10,${G.darken * 0.6})`; ctx.fillRect(-20, -20, W + 40, H + 40); }
  /* 뼈 무더기 */
  for (const b of G.bones) { const y = zY(b.z), a = Math.min(1, 6 - b.t); ctx.fillStyle = `rgba(220,210,190,${0.6 * a})`; ctx.fillRect(b.x - 10, y - 3, 20, 4); ctx.fillRect(b.x - 3, y - 6, 5, 5); }
  /* 그릴 것 모아서 깊이(z) 순서로 */
  const L = [];
  const lord = G.lord; L.push({ z: lord.z, d: () => { const fy = zY(lord.z), h = 190 * zS(lord.z); shadow(lord.x, fy, 34); const f = lord.atk >= 0 ? ANIM.lord.atk[0] + lord.at : walkF('lord', G.t * 0.8); /* 군주 둘레 빛 */ const gl = ctx.createRadialGradient(lord.x, fy - h * 0.5, 10, lord.x, fy - h * 0.5, h * 0.8); gl.addColorStop(0, 'rgba(160,90,255,.22)'); gl.addColorStop(1, 'rgba(160,90,255,0)'); ctx.fillStyle = gl; ctx.fillRect(lord.x - h, fy - h * 1.3, h * 2, h * 1.6); drawSp('lord', f, lord.x, fy, h, false, { flash: lord.flash }); } });
  for (const s of G.sk) L.push({ z: s.z, d: () => drawSk(s) });
  for (const f of G.foes) L.push({ z: f.z, d: () => drawFoe(f) });
  if (G.boss && !G.boss.dead) { const B = G.boss; L.push({ z: B.z, d: () => drawBoss(B) }); }
  if (G.champ) { const C = G.champ; L.push({ z: 0.5, d: () => drawChamp(C) }); }
  L.sort((a, b) => a.z - b.z); for (const o of L) o.d();
  /* 보스 조각 */
  if (G.shards && META.boss && IMG.boss.naturalWidth) { const m = META.boss, I = IMG.boss, s = 300 / m.ch, f = ANIM.boss.atk[0], sx0 = (f % m.cols) * m.cw, sy0 = Math.floor(f / m.cols) * m.ch, pw = m.cw / 6, ph = m.ch / 8; for (const p of G.shards) { p.t += 1 / 60 * (G.slowT > 0 ? G.slow : 1); p.x += p.vx / 60; p.y += p.vy / 60; p.vy += 900 / 60; p.r += p.vr / 60; const a = Math.max(0, 1 - p.t / 1.6); if (a <= 0) continue; ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x + (p.i - 3) * pw * s * -1, p.y - (m.foot - p.j * ph) * s); ctx.rotate(p.r); ctx.scale(-1, 1); ctx.drawImage(I, sx0 + p.i * pw, sy0 + p.j * ph, pw, ph, -pw * s / 2, -ph * s / 2, pw * s + 1, ph * s + 1); ctx.restore(); } }
  /* 경고 원 */
  const B = G.boss; if (B && B.warn) { const y = zY(0.5), k = 0.5 + Math.sin(G.t * 30) * 0.5; ctx.strokeStyle = `rgba(255,80,60,${0.5 + k * 0.4})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(B.slamX, y, 170, 40, 0, 0, 7); ctx.stroke(); ctx.fillStyle = `rgba(255,60,40,${0.12 + k * 0.1})`; ctx.fill(); }
  /* 유령 군단 */
  if (G.U) { const U = G.U, fx = -200 + U.t * 520; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = 'hue-rotate(170deg) saturate(2) brightness(1.6)'; for (let i = 0; i < 18; i++) { const z = (i * 0.41) % 1, x = fx - (i % 6) * 46 - z * 20, fy = zY(z); drawSp('sk', walkF('sk', G.t * 1.6 + i), x, fy, 150 * zS(z), false, { a: 0.5 }); } ctx.filter = 'none'; ctx.restore(); const g = ctx.createLinearGradient(fx - 300, 0, fx + 80, 0); g.addColorStop(0, 'rgba(90,255,210,0)'); g.addColorStop(0.85, 'rgba(90,255,210,.18)'); g.addColorStop(1, 'rgba(90,255,210,0)'); ctx.fillStyle = g; ctx.fillRect(fx - 300, FIELD.top, 380, FIELD.gy1 - FIELD.top + 40); }
  /* 영혼탄 */
  for (const p of G.shots) { const r = p.big ? 13 : 9, g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, r * 2.4); g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#d6a8ff'); g.addColorStop(1, 'rgba(122,60,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.4, 0, 7); ctx.fill(); }
  /* 입자 */
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const p of G.fx) { const k = 1 - p.t / p.life; if (p.k === 'p' || p.k === 'w') { ctx.globalAlpha = Math.max(0, k); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (p.k === 'w' ? (0.6 + k) : 1), 0, 7); ctx.fill(); } else if (p.k === 'r') { const r = p.r0 + (p.r - p.r0) * Math.pow(p.t / p.life, 0.5); ctx.globalAlpha = Math.max(0, k); ctx.strokeStyle = p.col; ctx.lineWidth = p.w * k + 1; ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.3, 0, 0, 7); ctx.stroke(); } }
  ctx.restore(); ctx.globalAlpha = 1;
  /* 숫자 */
  for (const n of G.nums) { const k = n.t / 0.9, s = (n.big ? 30 : 19) * (n.t < 0.08 ? 1.6 - n.t * 7 : 1); ctx.globalAlpha = Math.min(1, (1 - k) * 2); txt(n.v + '', n.x, n.y - n.t * 50, s, n.col, { lw: s * 0.22 }); }
  ctx.globalAlpha = 1;
  for (const p of G.pops) { const k = p.t / 1.4, s = 1 + Math.max(0, 0.25 - p.t) * 2; ctx.globalAlpha = Math.min(1, (1 - k) * 2.2); txt(p.text, p.x, p.y - p.t * 40, 20 * s, p.col, { lw: 5 }); }
  ctx.globalAlpha = 1; ctx.restore();
  if (G.flashW > 0) { ctx.fillStyle = `rgba(255,250,240,${G.flashW * 0.7})`; ctx.fillRect(0, 0, W, H); }
  drawHud();
}
function drawSk(s) {
  const fy = zY(s.z) + (s.fy || 0), h = 116 * zS(s.z); let f;
  if (s.st === 'rise') { /* 땅에서 솟아오름: 아래부터 드러남 + 초록 불 */ const k = s.rise, ey = zY(s.z); ctx.save(); ctx.beginPath(); ctx.rect(s.x - 80, ey - h * 1.2, 160, h * 1.2 + 2); ctx.clip(); drawSp('sk', walkF('sk', 0), s.x, ey + h * (1 - easeOut(k)) * 0.9, h, false, { a: 0.4 + k * 0.6, flash: (1 - k) * 0.8 }); ctx.restore(); const gl = ctx.createRadialGradient(s.x, ey, 4, s.x, ey, 50); gl.addColorStop(0, `rgba(95,255,200,${0.7 * (1 - k)})`); gl.addColorStop(1, 'rgba(95,255,200,0)'); ctx.fillStyle = gl; ctx.fillRect(s.x - 60, ey - 60, 120, 80); ctx.fillStyle = `rgba(20,8,30,${0.9})`; ctx.beginPath(); ctx.ellipse(s.x, ey, 26 * (1 - k * 0.4), 6, 0, 0, 7); ctx.fill(); return; }
  if (s.st === 'fly') { ctx.save(); ctx.translate(s.x, fy - h * 0.5); ctx.rotate(s.spin); drawSp('sk', walkF('sk', s.t), 0, h * 0.5, h, false, { flash: s.flash }); ctx.restore(); return; }
  shadow(s.x, zY(s.z), 20 * zS(s.z));
  f = s.atk >= 0 ? ANIM.sk.atk[0] + s.at : walkF('sk', s.t);
  drawSp('sk', f, s.x, fy, h, false, { flash: s.flash });
}
function drawFoe(f) {
  const fy = zY(f.z), h = 122 * zS(f.z); let fr, a = 1;
  if (f.st === 'die') fr = ANIM.knight.die[0] + f.die; else if (f.st === 'lie') { fr = ANIM.knight.die[1]; a = f.raised ? Math.max(0, 1 - (f.lieT - 0.45) / 0.6) : 1; } else if (f.atk >= 0) fr = ANIM.knight.atk[0] + f.at; else fr = walkF('knight', f.t);
  if (f.st !== 'lie') shadow(f.x, fy, 18 * zS(f.z));
  drawSp('knight', fr, f.x, fy, h, false, { flash: f.flash, a });
  if (f.st === 'walk' && f.hp < f.max) { const w = 34 * zS(f.z); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(f.x - w / 2, fy - h - 6, w, 4); ctx.fillStyle = '#ff5a5a'; ctx.fillRect(f.x - w / 2, fy - h - 6, w * Math.max(0, f.hp / f.max), 4); }
}
function drawBoss(B) { const fy = zY(B.z), h = 300; shadow(B.x, fy, 70); const fr = B.atk >= 0 ? ANIM.boss.atk[0] + B.at : walkF('boss', B.t * 0.8); const gl = ctx.createRadialGradient(B.x, fy - 120, 20, B.x, fy - 120, 200); gl.addColorStop(0, 'rgba(255,215,106,.25)'); gl.addColorStop(1, 'rgba(255,215,106,0)'); ctx.fillStyle = gl; ctx.fillRect(B.x - 200, fy - 320, 400, 380); drawSp('boss', fr, B.x, fy, h, false, { flash: B.flash }); }
function drawChamp(C) { const fy = zY(0.5), h = 280, k = C.rise || 0; ctx.save(); if (k < 1) { ctx.beginPath(); ctx.rect(C.x - 200, fy - h * 1.3, 400, h * 1.3 + 2); ctx.clip(); } shadow(C.x, fy, 60); const gl = ctx.createRadialGradient(C.x, fy - 110, 20, C.x, fy - 110, 190); gl.addColorStop(0, 'rgba(95,255,200,.28)'); gl.addColorStop(1, 'rgba(95,255,200,0)'); ctx.fillStyle = gl; ctx.fillRect(C.x - 200, fy - 300, 400, 360); const fr = C.atk >= 0 ? ANIM.boss.atk[0] + C.at : walkF('boss', C.t * 0.8); ctx.filter = 'hue-rotate(205deg) saturate(1.3) brightness(0.8) contrast(1.1)'; drawSp('boss', fr, C.x, fy + h * (1 - easeOut(k)), h, true, { flash: C.flash }); ctx.filter = 'none'; ctx.restore(); }
const easeOut = k => 1 - Math.pow(1 - k, 3);

function drawHud() {
  /* 위: 장 · 웨이브 · 군단 수 */
  const g = ctx.createLinearGradient(0, 0, 0, 90); g.addColorStop(0, 'rgba(6,2,12,.85)'); g.addColorStop(1, 'rgba(6,2,12,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 90);
  txt(`제 ${G.stage} 장`, 18, 30, 20, '#e9dcff', { align: 'left' });
  const pw = 120, px = W - pw - 26;   /* 가운데 위는 폰 카메라 구멍 자리라 비움 */ for (let i = 1; i <= G.waveN; i++) { const x = px + (i - 1) * (pw / (G.waveN - 1)), on = i < G.wave || (i === G.wave && G.phase === 'march' && false), cur = i === G.wave, boss = i === G.waveN; ctx.fillStyle = on ? '#c9a2ff' : cur ? '#ffe08a' : 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(x, 30, boss ? 9 : 6, 0, 7); ctx.fill(); if (boss) txt('보스', x, 50, 11, cur ? '#ffd76a' : '#8a7aa8', { w: 800, lw: 3 }); if (i < G.waveN) { ctx.fillStyle = i < G.wave ? '#c9a2ff' : 'rgba(255,255,255,.12)'; ctx.fillRect(x + 7, 29, pw / (G.waveN - 1) - 14, 2); } }
  
  /* 하늘 가운데 큰 군단 수: 이 게임의 자랑(한 명 늘 때마다 튐) */
  { const n = G.sk.length + (G.extra || 0) + (G.champ ? 1 : 0), k = G.armyT / 0.5, s = 1 + k * 0.35, y = 150; const gl = ctx.createRadialGradient(W / 2, y, 4, W / 2, y, 110); gl.addColorStop(0, `rgba(95,255,200,${0.12 + k * 0.25})`); gl.addColorStop(1, 'rgba(95,255,200,0)'); ctx.fillStyle = gl; ctx.fillRect(W / 2 - 120, y - 80, 240, 160);
    txt('망자의 군단', W / 2, y - 40, 15, '#bfe9da', { w: 800, lw: 4 }); txt(n + '', W / 2, y + 6, 58 * s, k > 0 ? '#c8fff0' : '#5fffc8', { lw: 9, sc: '#06241c' }); }
  /* 보스 체력 */
  const B = G.boss; if (B && !B.dead && B.st !== 'enter') { const bw = W - 60, bx = 30, by = 76; ctx.fillStyle = 'rgba(0,0,0,.7)'; rr(bx, by, bw, 14, 7); ctx.fill(); ctx.fillStyle = '#ffcf4a'; rr(bx, by, bw * Math.max(0, B.hp / B.max), 14, 7); ctx.fill(); txt('황금 성기사 단장', W / 2, by + 26, 14, '#ffe08a', { w: 800 }); }
  /* 군주 체력 */
  { const L = G.lord, w = 70, x = L.x - w / 2, y = zY(L.z) + 14; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y, w, 5); ctx.fillStyle = '#b07aff'; ctx.fillRect(x, y, w * Math.max(0, L.hp / L.max), 5); }
  /* 알림 띠 */
  if (G.banner) { const b = G.banner, k = b.t, a = Math.min(1, k * 4) * Math.min(1, (2.6 - k) * 2), y = 250; ctx.globalAlpha = Math.max(0, a); const bg = ctx.createLinearGradient(0, 0, W, 0); bg.addColorStop(0, 'rgba(10,4,20,0)'); bg.addColorStop(0.5, 'rgba(10,4,20,.85)'); bg.addColorStop(1, 'rgba(10,4,20,0)'); ctx.fillStyle = bg; ctx.fillRect(0, y - 40, W, b.sub ? 92 : 70); const s = 1 + Math.max(0, 0.15 - k) * 3; txt(b.text, W / 2, y, 34 * s, b.col, { lw: 8 }); if (b.sub) txt(b.sub, W / 2, y + 36, 15, '#e9dcff', { w: 700, lw: 4 }); ctx.globalAlpha = 1; }
  /* 아래 단추 판 */
  const py = H - 172; const pg = ctx.createLinearGradient(0, py - 30, 0, H); pg.addColorStop(0, 'rgba(8,3,14,0)'); pg.addColorStop(0.25, 'rgba(8,3,14,.92)'); pg.addColorStop(1, '#06030b'); ctx.fillStyle = pg; ctx.fillRect(0, py - 30, W, H - py + 30);
  txt(`영혼 ${G.souls.toLocaleString()}`, W / 2, py + 4, 15, '#d9c8ff', { w: 800 });
  const bw = (W - 48) / 3, bh = 112, by = py + 22;
  skillBtn(16, by, bw, bh, '영혼 폭풍', '1', G.stormCd > 0 ? 1 - G.stormCd / 9 : 1, '#8c5cff', doStorm, G.stormCd > 0 ? Math.ceil(G.stormCd) + '초' : '');
  skillBtn(24 + bw, by, bw, bh, '망자의 행진', '2', G.ult, '#2fd6a8', doUlt, G.ult >= 1 ? '준비!' : Math.floor(G.ult * 100) + '%', G.ult >= 1);
  const c = upCost(); skillBtn(32 + bw * 2, by, bw, bh, `군단 강화`, '3', G.souls >= c ? 1 : G.souls / c, '#e3a21a', doUp, `Lv.${G.atkLv} · ${c}`, G.souls >= c);
  if (!SND.on || !SND.ctx) txt(SND.ctx ? '소리 꺼짐' : '눌러서 소리 켜기', 18, 56, 11, '#8a7aa8', { align: 'left', w: 700, lw: 3 });
}
function skillBtn(x, y, w, h, label, key, k, col, fn, sub, glow) {
  const on = k >= 1; ctx.fillStyle = 'rgba(28,16,44,.95)'; rr(x, y, w, h, 18); ctx.fill();
  if (on) { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, col); g.addColorStop(1, 'rgba(20,8,30,.9)'); ctx.fillStyle = g; rr(x, y, w, h, 18); ctx.fill(); }
  else { ctx.save(); rr(x, y, w, h, 18); ctx.clip(); ctx.fillStyle = col + '55'; ctx.fillRect(x, y + h * (1 - k), w, h * k); ctx.restore(); }
  ctx.strokeStyle = on ? '#ffffff' : 'rgba(201,162,255,.35)'; ctx.lineWidth = on ? 2.5 : 1.5; rr(x, y, w, h, 18); ctx.stroke();
  if (glow) { const p = 0.5 + Math.sin(G.t * 6) * 0.5; ctx.strokeStyle = `rgba(255,255,255,${0.3 + p * 0.5})`; ctx.lineWidth = 3 + p * 3; rr(x - 3, y - 3, w + 6, h + 6, 21); ctx.stroke(); }
  /* 그림 대신 큰 기호 */
  const cx = x + w / 2; if (key === '1') { const g = ctx.createRadialGradient(cx, y + 42, 2, cx, y + 42, 26); g.addColorStop(0, '#fff'); g.addColorStop(0.35, '#d6a8ff'); g.addColorStop(1, 'rgba(122,60,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, y + 42, 26, 0, 7); ctx.fill(); }
  else if (key === '2') { ctx.save(); ctx.filter = 'hue-rotate(170deg) saturate(2) brightness(1.5)'; drawSp('sk', walkF('sk', G.t), cx, y + 70, 64, false, { a: 0.95 }); ctx.filter = 'none'; ctx.restore(); }
  else { txt('⚔', cx, y + 42, 32, '#ffe08a', { stroke: 0 }); }
  txt(label, cx, y + h - 34, 16, '#fff', { lw: 4 }); txt(sub, cx, y + h - 14, 12, on ? '#fff6c0' : '#a898c8', { w: 700, lw: 3 });
  BTN.push({ x, y, w, h, fn });
}

/* ── 입력 ── */
function tapAt(cx, cy) { SND.init(); if (!SND.ctx) return; const r = cv.getBoundingClientRect(), x = (cx - r.left) * W / r.width, y = (cy - r.top) * H / r.height; if (SND.ctx.state === 'suspended') SND.ctx.resume(); for (const b of BTN) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { b.fn(); return; } /* 전장을 누르면 그쪽으로 영혼탄 */ if (y < FIELD.gy1 + 40 && y > FIELD.top && G.lord.atk < 0) { G.lord.castT = 0; } }
cv.addEventListener('pointerdown', e => { e.preventDefault(); SND.init(); tapAt(e.clientX, e.clientY); });
addEventListener('keydown', e => { SND.init(); if (e.key === '1') doStorm(); if (e.key === '2') doUlt(); if (e.key === '3') doUp(); if (e.key === 'm' || e.key === 'M') SND.toggle(); });
function botTick() { if (G.ult >= 1) doUlt(); if (G.stormCd <= 0 && G.foes.length > 3) doStorm(); if (G.souls >= upCost()) doUp(); }

/* ── 돌리기 ── */
newGame(); let last = performance.now();
function loop(now) { const dt = Math.min(1 / 30, (now - last) / 1000) * SPEED; last = now; try { update(dt); draw(); } catch (e) { console.error(e); } requestAnimationFrame(loop); }
requestAnimationFrame(loop);
window.GAME = { get G() { return G; }, newGame, doUlt, doStorm, doUp, ANIM, META, step(n, dt = 1 / 60) { for (let i = 0; i < n; i++) update(dt); draw(); } };
