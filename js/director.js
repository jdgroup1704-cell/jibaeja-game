'use strict';
// 연출 감독: 게임 규칙(JB)에서 일어난 일을 받아 화면(S)과 소리로 보여 줌
let st;                 // 게임 상태(규칙)
let S;                  // 화면 상태
const RC = { get x() { return BX; }, y: 220 };   // 마법진 가운데
// 대마법 시간표: 긴 연출(첫 사용·지역의 주인)과 짧은 연출(평소)
const TC_LONG = { l1: 0.4, l2: 3.75, r1: 3.85, r2: 4.55, r3: 5.5, name: 6.4, kou: 8.05, flash: 8.55 };
const TC_SHORT = { l1: -1, l2: -1, r1: 0.15, r2: 0.3, r3: 0.45, name: 0.1, kou: 1.75, flash: 2.6 };
let TC = TC_LONG, TB = TC.flash + 0.8;

function resetView() {
  S = {
    t: 0, ts: 1, phase: 'battle', army: [], foes: [], parts: [], texts: [],
    shake: 0, tombs: [], cam: { x: W / 2, y: H / 2, z: 1 }, camT: null, flash: 0, dark: 0, tint: 0,
    giant: { x: 1600, y: 640, alpha: 0, slam: 0, raise: 0, charge: 0, dead: false, walk: 0, on: false },
    lord: { raise: 0, glow: 0 }, cast: -1, rings: [], sun: null, wave: null, bubble: null, marks: {},
    foeWave: -1, foeN: 0, killN: 0, soulTick: 0, nextRise: 0, heart: 0, castInfo: null, ringTap: null, milestone: 0,
  };
}
function addSkel(fromPortal) {
  const depth = Math.random(), n = S.army.length;
  const spread = Math.min(470, 80 + n * 1.6);
  S.army.push({ x: fromPortal ? rnd(150, 230) : rnd(260, 260 + spread), y: lerp(GROUND + 40, 680, depth), d: depth,
    tx: rnd(280, 280 + spread) + depth * 30, w: (Math.random() * 3) | 0, ph: rnd(0, 7), rise: fromPortal ? 0 : 1, fly: null, cheer: rnd(0, 7), ...pickClass() });
}
// 무덤에서 일으킨 병과가 군단에 섞여 보이게: 채워진 칸 중 하나(빈 군단은 기본 해골)
function pickClass() {
  const rs = st.dex ? st.dex.f.map((v, i) => v ? i : -1).filter(i => i >= 0) : []; if (rs.length && Math.random() < 0.07) return { c: -1, g: 0, rf: rs[Math.floor(Math.random() * rs.length)] };   /* 부활한 지역 병사가 군단에 섞임 */
  const filled = st.grave.map((g, i) => g >= 0 ? i : -1).filter(i => i >= 0);
  if (!filled.length) { const r = Math.random(), b = st.best; if (b >= 4 && r < 0.22) return { c: 1, g: 0 }; if (b >= 7 && r < 0.4) return { c: 3, g: 0 }; if (b >= 9 && r < 0.52) return { c: 2, g: 0 }; return { c: -1, g: 0 }; }   /* 23:25 무덤 열리기(11판) 전엔 13명이 전부 같은 칼 해골이었음 → 4판 창 · 7판 활 · 9판 방패가 섞여 나옴(겉모습 · 하는 일만, 힘은 그대로) */
  if (Math.random() < 0.25) return { c: -1, g: 0 };
  const i = filled[Math.floor(Math.random() * filled.length)]; return { c: i, g: st.grave[i] };
}
function burst(x, y, n, o) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), v = rnd(o.vmin || 40, o.vmax || 220);
    S.parts.push({ x, y, vx: Math.cos(a) * v * (o.sx || 1), vy: Math.sin(a) * v * (o.sy || 1) - (o.up || 0), life: rnd(o.lmin || 0.3, o.lmax || 0.9), age: 0,
      size: rnd(o.smin || 2, o.smax || 5), col: o.col instanceof Array ? o.col[(Math.random() * o.col.length) | 0] : o.col, g: o.g ?? 300, add: o.add ?? true, kind: 'dot', rot: rnd(0, 7), vr: rnd(-8, 8), real: o.real });
  }
}
/* 11-14 17:45 휴대폰 세로에서 대마법 마법진이 오른쪽에서 잘리던 것(녹화로 확인): 좁은 화면이면 마법진 가운데(RC)가 화면 가운데 오게 카메라를 옮김 */
function ringCam() { const narrow = cv.width / Math.max(1, cv.height) < 1.6; if (!narrow) return [820, 340]; const R = 310 * NS(), dx = Math.max(0, RC.x + R + 15 - (VW.x + VW.w)); return [W / 2 + dx, H / 2 + (Math.min(RC.y + 55, VW.y + VW.h / 2) - (VW.y + VW.h / 2))]; }   /* 18:22 마법진이 들어올 만큼만 옮김(전엔 마법진을 가운데로 → 지배자가 왼쪽 밖으로 잘림) */
function camTo(x, y, z, dur) { S.camT = { fx: S.cam.x, fy: S.cam.y, fz: S.cam.z, x, y, z, t: 0, dur }; }
function say(text, x, y, o = {}) { const sz = o.size || 28; if (!o.screen && ((typeof UI !== 'undefined' && UI.awakening) || S.t < (S.calmUntil || 0))) return;
  if (!o.screen && typeof L !== 'undefined' && L.field && text === L.field.crit) return;
  if (!o.screen && typeof fmtD !== 'undefined' && text === fmtD.s && fmtD.v != null) { const v = fmtD.v, col = o.col || '#fff', m = S.texts.find(t => !t.screen && t.val != null && t.col === col && t.age < 0.3 && Math.abs(t.x - x) < 90 && Math.abs(t.y - y) < 70); fmtD.v = null;
    if (m) { m.val += v; m.text = fmtD(m.val); fmtD.v = null; m.age = Math.min(m.age, 0.08); m.size = Math.min(48, Math.max(m.size, o.size || 28) + 2); m.bump = 0.12; return; }   /* 11-15 19:58 타격 리듬 잼: 0.3초 안에 가까이 뜨는 같은 색 숫자는 하나로 합쳐 커짐(장르 게임 방식 — 숫자가 비처럼 쏟아지지 않게) */
    o = Object.assign({}, o, { val: v }); }   /* 21:55 대표님 「보기 불편」: 「치명!」 글자는 빼고 노란 큰 숫자로만(다른 게임 방식) */
  if (!o.screen && !/^[-+]?[\d.,]/.test(text) && !o.must && S.texts.some(t => !t.screen && !/^[-+]?[\d.,]/.test(t.text) && t.age < t.life * 0.75)) return;   /* 전장 위 낱말 글자(기술 이름 · 합체 등)는 한 번에 하나만 */ if (o.screen && sz >= 40 || o.stamp) S.lastNew = S.t;
  if (o.screen && sz >= 40 && !o.__q) { const busy = S.texts.some(t => t.screen && t.size >= 40 && t.age < t.life * 0.85); if (busy || (S.textQ && S.textQ.length)) { (S.textQ = S.textQ || []).push([text, x, y, { ...o, __q: 1 }]); if (S.textQ.length > 3) S.textQ.shift(); return; } }   /* 화면 큰 글자는 한 번에 하나: 앞 글자가 거의 사라지면 다음 글자(줄은 3개까지) */ if (sz >= 40) for (let k = 0; k < 3; k++) { const hit = S.texts.find(t => t.size >= 40 && t.age < t.life * 0.8 && Math.abs(t.y - y) < (t.size + sz) * 0.5 && Math.abs(t.x - x) < (t.text.length * t.size + text.length * sz) * 0.25); if (!hit) break; y = hit.y + (hit.size + sz) * 0.6; }   /* 큰 글자 둘이 같은 자리에 겹치면 새 글자를 아래로 비킴 */
  if (!o.screen && /^[-+]?[\d.,]/.test(text)) { if ((o.size || 28) < 28 && S.texts.filter(t => !t.screen && /^[-+]?[\d.,]/.test(t.text)).length >= 2) return;   /* 01:05 대표님 「움직임 심플 · 타격감 굿」(버섯커): 작은 숫자는 한 번에 2개까지 — 큰 숫자 · 치명만 또렷하게 */ if (FAR()) x = Math.min(x, VX1 - 200); if ((o.size || 28) >= 34) x = Math.min(x, VX1 - 330);   /* 00:22 큰 피해 숫자가 오른쪽 설정 · 절전 단추를 덮음 */   /* 19:14 대표님 캡처: 숫자가 열 개 넘게 오른쪽 단추 밑에 쌓임 → 보통 숫자는 한 번에 7개까지, 오른쪽 단추 줄 안쪽에 */
    const k = typeof WK === 'function' ? WK() : 1; { const w = S.texts.find(t => !t.screen && !/^[-+]?[\d.,]/.test(t.text) && t.age < t.life && Math.abs(t.x - x) < (t.text.length * 0.32 * t.size + 30) * k && Math.abs(t.y - y) < 28 * k); if (w) y = w.y + 30 * k; }   /* 11-15 눈 확인: 「불덩이!」 「피의 일섬」 같은 기술 글자 사이에 숫자가 끼어 읽기 어려웠음 → 숫자는 글자 아래로 */
    const sz0 = o.size || 28, wd = tt => (String(tt.text).length * 0.34 * (tt.size || 28) + String(text).length * 0.34 * sz0 + 18) * k;   /* 11-15 눈 확인: 「191」 「50」이 옆으로 붙어 「19150」처럼 읽힘 → 옆 간격 더 넓게 재고 0.9초까지 피함 */ for (let i = 0; i < 4; i++) { const hit = S.texts.find(t => !t.screen && (/^[-+]?[\d.,]/.test(t.text) ? t.age < 0.9 : t.age < t.life) && Math.abs(t.x - x) < wd(t) && Math.abs(t.y - y) < (t.size + sz0) * 0.42 * k); if (!hit) break; y = hit.y - (hit.size + sz0) * 0.45 * k; } { const yMin = (60 * (view.dpr || 1) - view.oy) / view.s; if (UK() < 1 && y < yMin) { y = yMin + rnd(0, 30); const d = rnd(70, 120) * k; x = x - d < 470 ? x + d : x - d; } }   { const hit2 = S.texts.find(t => !t.screen && /^[-+]?[\d.,]/.test(t.text) && t.age < t.life * 0.85 && Math.abs(t.x - x) < wd(t) && Math.abs(t.y - y) < (t.size + sz0) * 0.45 * k);   /* 11-15 20:05 플레이 영상(30초): 맨 위로 밀린 두 숫자가 같은 줄에 붙어 「291276」으로 읽힘(아까 「19150」과 같은 병) → 밀어 올린 뒤에도 한 번 더 보고, 겹치면 합치거나(값을 알면) 안 띄움 */
      if (hit2) { if (hit2.val != null && o.val != null) { hit2.val += o.val; hit2.text = fmtD(hit2.val); fmtD.v = null; hit2.age = Math.min(hit2.age, 0.08); hit2.size = Math.min(48, hit2.size + 2); } return; } }   /* 11-15 눈 확인(눈_돌진): 왼쪽으로 비키다 지배자 지팡이 끝을 가림 → 지배자 쪽(470 왼쪽)으로는 안 비킴 */ }   /* 11-15 눈 확인(효과_숫자 5번): 쌓다 보니 숫자가 맨 위 판 제목까지 올라감 → 폰은 제목 밑(전장 위에서 60픽셀)에서 멈추고 옆으로 비킴 — 탭마다 전장 높이가 달라 화면 픽셀로 잼 */   /* 11-15 눈 확인(눈_빛 영웅 탭): 폭을 46으로만 재서 「320」 「198」처럼 큰 숫자가 반쯤 겹침 → 글자 길이 · 크기로 폭 · 높이를 재고 0.6초까지 피함 */   /* 19:06 피해 숫자끼리 겹치면 위로 비켜 쌓임(「3.89」처럼 붙어 읽히던 것) */
    if (typeof UK === 'function' && UK() < 1) { const ns = S.texts.filter(t => !t.screen && /^[-+]?[\d.,]/.test(t.text) && t.age < t.life * 0.85).sort((a, b) => b.age - a.age); for (let i = 0; i <= ns.length - 4; i++) ns[i].age = ns[i].life * 0.85; }   /* 11-15 눈 확인(효과재기 14번): 폰에서 큰 숫자 다섯이 탑처럼 쌓여 영웅을 덮음 → 전장 숫자는 넷까지, 오래된 것부터 빨리 사라짐 */
  if (!o.screen && !/^[-+]?[\d.,]/.test(text)) { const k2 = typeof WK === 'function' ? WK() : 1, sz2 = o.size || 28, ns = S.texts.filter(t => !t.screen && /^[-+]?[\d.,]/.test(t.text) && t.age < t.life * 0.85 && Math.abs(t.x - x) < (text.length * 0.32 * sz2 + 30) * k2 && t.y < y + 30 * k2 && t.y > y - 60 * k2); if (ns.length) y = Math.min(...ns.map(t => t.y)) - 30 * k2; }   /* 11-15 기술 글자가 숫자 더미 한가운데 서던 것 → 숫자 더미 위로 */
  if (!o.screen && typeof UK === 'function' && UK() < 1 && typeof view !== 'undefined') { const yMin = (66 * (view.dpr || 1) - view.oy) / view.s + (o.size || 28) * 0.6; if (y < yMin) y = yMin; }   /* 11-15 눈 확인(눈_말풍선2): 「불덩이!」가 판 제목 · 2배속 단추 높이까지 올라감 → 폰은 전장 위 66픽셀 밑에서 시작 */
  S.texts.push({ text, x, y, age: 0, life: o.life || 1.2, size: o.size || 28, col: o.col || '#fff', vy: o.vy ?? -40, font: o.font || SERIF, glow: o.glow || null, stamp: o.stamp || false, reveal: o.reveal || 0, screen: o.screen || false, top: o.top || false, val: o.val ?? null }); }
function once(k) { if (S.marks[k]) return false; S.marks[k] = true; return true; }

// ───────── 수하 한마디 ─────────
// 정해진 한마디(인연 대화 등): 수하 얼굴 + 이름 + 말
function heroLine(who, text, life = 3.2) { if (TRAILER) return; const h = L.heroes[who]; if (!h) return; S.bubble = { text, name: `${h.title} ${h.name}`, who, x: 250, y: 352 /* 23:59 위 단추(빠른 보상)와 100% 겹침 → 조금 아래 */, age: 0, life }; }
function bondTalk(id) {
  const b = L.bonds[id], x = JB.BONDS.find(k => k.id === id); if (!b || !x) return; UI.toast(L.bonds.title, b.name); Snd.chime(1175);
  b.talk.forEach((text, i) => { const who = x.talk[i]; setTimeout(() => { heroLine(who, text, 3); UI.feed(`${L.heroes[who].name}: ${text}`); }, 1800 + i * 3100); });
}
function heroSay(kind, id) {
  if (TRAILER) return;   // 광고 영상에선 말풍선 안 띄움
  const who = id || st.squad.filter(Boolean)[Math.floor(Math.random() * st.squad.filter(Boolean).length)];
  if (!who) return;
  const h = L.heroes[who]; if (!h) return;
  if (!h.lines[kind]) kind = 'win';
  S.bubble = { text: h.lines[kind], name: `${h.title} ${h.name}`, who, x: 250, y: 352 /* 23:59 위 단추(빠른 보상)와 100% 겹침 → 조금 아래 */, age: 0, life: kind === 'join' ? 4.5 : 3.2 };
  if (['join', 'win', 'crypt', 'conquer', 'lab'].includes(kind)) UI.feed(`${h.name}: ${h.lines[kind]}`);
}

// ───────── 군단·적 맞추기 ─────────
/* 화면에 세우는 해골 수: 30까지는 그대로, 그 뒤로는 천천히(제곱근) 늘어 72에서 멈춤 — 19:15 대표님 「쫄따구가 너무 많다」(전엔 160) */
const FAR = () => VW.w > 1000 && !TRAILER;   /* 먼 화면(세로 휴대폰): 우리 편 왼쪽 · 적 오른쪽 */
const foeLine = () => VX1 - 330;   /* 18:55 오른쪽 단추 줄(2배속 · 설정 · 절전)이 화면 끝 120픽셀을 덮어 적이 가려졌음 → 조금 더 안쪽 */   /* 적이 서는 줄 */
const GWIND = 0.55;   /* 거인이 망치를 치켜드는 시간(초) */
const armyVis = () => Math.min(4, 1 + Math.floor(Math.min(st.raised || 0, JB.C.RAISE_TAPS) / 3) + Math.floor((st.up.summon || 0) / 4));   /* 03:15 대표님 「망자병 눌러도 안 돼」: 「일으켜라」 3번마다 소환수 하나씩 일어남(1 → 4) */   /* 01:20 대표님 「쫄따구 필요 있냐? 1 2 3 4 하나씩 소환 · 진화, 최소만. 펫처럼」: 화면엔 큰 소환수 최대 4(소환 0 · 4 · 8 · 12단계에 하나씩), 힘 계산(군단 수)은 그대로 */
const SUMMON_C = [-1, 1, 2, 3];   /* 소환수 자리: 칼 · 창 · 방패 · 활 해골 */
const summonTier = () => Math.min(4, Math.floor((st.up.summon || 0) / 12));   /* 22:38 대표님 「같은 병사가 너무 많다」: 화면에 서는 병사 최대 24 → 16(덩어리로 뭉개져 병과가 안 보였음) */   /* 19:15 대표님 「병사 물량이 적당한지」: 8마리에서 멈춰 「군단」 느낌이 없었음 → 군단이 클수록 화면 병사도 늘어 24까지(45명이면 21) */   /* 11-14 「세우기 버튼이 안 눌리는 것 같다」: 8마리까지는 누를 때마다 한 마리씩 화면에 늘어남, 그 뒤엔 묶어서 ×수 */   // A 시험판: 부대 수(최대 8) — 한 부대 = 큰 캐릭터 한 명
function syncArmy(dt) {
  if (UI.awakening) return;   /* 각성 연출 중엔 빨려 든 해골을 다시 세우지 않음 */
  const want = armyVis();   /* 화면에 세우는 해골은 160까지(더 많으면 덩어리로 뭉개짐, 숫자는 위에 그대로) */
  let alive = S.army.filter(a => !a.fly).length;
  if (alive < want) setTimeout(() => formation(true), 0);   /* 새 병사 자리를 바로 정해 제자리에서 솟게 */
  while (alive < want) { addSkel(true); alive++; if (S.t > S.nextRise) { Snd.rise(); S.nextRise = S.t + rnd(0.4, 0.8); } burst(rnd(150, 230), rnd(GROUND + 60, 660), 4, { col: '#5dff8f', vmin: 10, vmax: 60, up: 60, g: -20, lmax: 0.8, smax: 3 }); }
  S.army.filter(a => !a.fly).forEach((a, i) => { a.c = SUMMON_C[i % 4]; a.g = summonTier(); a.big = 1.3; });   /* 자리마다 정해진 소환수 */
  while (alive > want) { const i = S.army.findIndex(a => !a.fly); if (i < 0) break; S.army.splice(i, 1); alive--; }
  // 이름 붙은 순간: 10·100·300·1000
  const n = JB.armySize(st);
  const m = [1000, 300, 100, 10].find(x => n >= x && S.milestone < x);   /* 한 번에 여러 고비를 넘으면 가장 큰 것 하나만(글자 두 겹 막기) */
  if (m) {
    S.milestone = m; if (m >= 100 && S.t > 2 && !TRAILER && S.phase === 'battle') { const xs = S.army.filter(a => !a.fly).map(a => a.x), cx = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 420; S.cam = { x: cx, y: 560, z: 1.7 }; S.camT = null; camTo(W / 2, H / 2, 1, 1.5); Snd.stamp(0.5); }   /* 설계: 군단 100 · 300 · 1000에 카메라가 군단에 붙었다가 뒤로 빠짐 */
    if (m >= 10 && S.t > 2 && !TRAILER) { say(L.milestone(m.toLocaleString('ko-KR')), W / 2, UK() < 1 ? 0 : 150, { size: UK() < 1 ? 40 : 54, col: '#e9dcff', glow: '#5dff8f', life: UK() < 1 ? 1.6 : 2.4, top: UK() < 1, vy: 0, stamp: true, screen: true }); Snd.cheer(); UI.feed(L.milestone(m.toLocaleString('ko-KR'))); }   /* 11-15 눈 확인(숫자간격 3번): 폰에서 「군단 힘 100 돌파!」가 영웅 · 군단 한가운데를 2.4초 덮음 → 폰은 판 제목 밑 맨 위에 작게(40) · 1.6초 */
  }
}
// 진형: 뒤(왼쪽)부터 마법사·활·기본 해골·창·검·말 탄 해골·방패(맨 앞 벽). 줄 맞춰 서되 조금씩 흐트러지게
const RANK_ORDER = [5, 3, -1, 1, 0, 4, 2];
let formT = 0, formKey = '';
function formation(force) {
  const live = S.army.filter(a => !a.fly);
  const key = live.length + ':' + live.map(a => a.c + '' + (a.evo || 0)).join('');
  if (!force && key === formKey) return; formKey = key;
  const n = live.length; if (!n) return;
  const BIG = live.every(a => a.big), rows = BIG ? (n <= 1 ? 1 : 2) : n <= 3 ? 1 : n <= 6 ? 2 : n <= 10 ? 3 : n <= 15 ? 4 : 5, cols = Math.ceil(n / rows);   /* 02:00 큰 소환수 4: 앞뒤 두 줄 엇갈리게, 칸 넓게(겹쳐 뭉치던 것) */   /* 20:38 앞줄을 넓게(세로로 펼쳐 맞닿는 앞줄이 더 많게) */   // A 시험판: 큰 부대 캐릭터가 겹치지 않게 넓게
  const colW = (typeof STYLE !== 'undefined' && STYLE === '2d') ? 92 : (typeof STYLE !== 'undefined' && STYLE === 'old') ? (LDX() ? 96 : 118) : 105, x0 = ((typeof STYLE !== 'undefined' && STYLE === '2d') ? 375 : 330) + LDX() * 0.6, top = GROUND + 120, bot = 660;   /* 03:18 「상대가 잘 안 보인다」: 군단은 화면 왼쪽 절반에 모으고 오른쪽을 적 자리로 비움 */
  const span = FAR() ? foeLine() - 30 - x0 : 1e9; const colW2 = BIG ? 112 : Math.max(52, Math.min(colW, span / Math.max(1, cols - 0.5)));   /* 19:05 먼 화면: 군단이 커지면 줄이 적 자리까지 밀고 나가 적이 오른쪽 끝(단추 밑)으로 밀렸음 → 칸 폭을 줄여 맞붙는 줄 안에 */
  if (BIG) {   /* 09:40 대표님 「직업별 배치 · 왜 꼭 몰려 있어」: 숫자로 보니 네 소환수가 가로 183(휴대폰 60점) 안에 몰린 채 통째로 적 앞까지 밀려감 → 직업별 자리를 가로 350에 펼쳐 놓고 그 자리에서 싸움
       방패 = 맨 앞(적과 맞닿음) · 칼 = 바로 뒤 아래 · 창 = 그 뒤 가운데(긴 창으로 앞 사이로 찌름) · 활 = 맨 뒤 위(지배자 앞) */
    /* 11-15 16:01 대표님 「배치 넓게 · 위아래 대각」 · 「해골 궁수가 지배자 공격할 때마다 가림」: 방패 가운데 맨 앞 · 칼 위 · 창 위 뒤 · 궁수는 아래 줄 맨 뒤(지배자 지팡이보다 오른쪽) — 영웅(field.js PB)과 번갈아 세 줄 */ const F = FAR() ? foeLine() - 10 : 760, SLOT = { 2: [-1, 600], '-1': [-91, 490], 1: [-226, 490], 3: [-316, 712] }, used = {};
    for (const a of live) { const q = SLOT[a.c] || [-120, 620], k = used[a.c] = (used[a.c] || 0) + 1; if (a.jx === undefined) { a.jx = rnd(-4, 4); a.jy = rnd(-5, 5); } a.tx = F + q[0] - (k - 1) * 60 + a.jx; a.ty = q[1] + (k - 1) * 30 + a.jy; }
    return;
  }
  const sorted = live.slice().sort((p, q) => (p.evo || 0) - (q.evo || 0) || RANK_ORDER.indexOf(p.c) - RANK_ORDER.indexOf(q.c) || p.g - q.g || p.x - q.x);   /* 18:58 같은 병과끼리는 지금 앞에 선 놈이 그대로 앞에(새 병사가 일어날 때마다 줄이 뒤섞여 앞줄이 뒤로 걸어가는 게 「밀리는」 것처럼 보였음) */   /* 진화한 쫄따구는 맨 앞 줄로 */
  sorted.forEach((a, i) => {
    const col = Math.floor(i / rows), row = i % rows;
    if (a.jx === undefined) { a.jx = rnd(-4, 4); a.jy = rnd(-5, 5); }
    a.tx = x0 + col * colW2 + (row % 2) * colW2 * 0.5 + a.jx;
    a.ty = lerp(top, bot, rows > 1 ? row / (rows - 1) : 0.5) + a.jy;
    if (a.evo) a.tx += a.evo * 6 + (row % 3) * 8;   /* 진화한 놈은 크니까 조금씩 앞뒤로 엇갈려 덜 겹치게 */
  });
}
/* 쫄따구(해골 군단)도 각자 싸움(11-13 대표님 「쫄따구들 뭐 하는지 모르겠다」):
   앞줄 칼 · 창 · 방패 · 기수는 몸을 앞으로 기울여 휘두르고(칼빛), 궁병은 화살, 주술사는 보라 구슬. 맞은 적은 번쩍, 작은 숫자는 0.4초에 하나까지(화면이 숫자로 덮이지 않게 — 16:30 화면 보고 0.15에서 줄임) */
/* 쫄따구 진화 화면: 진화 = 해골 하나에 빛기둥 + 커짐 + 「진화! 해골 전사」, 합체 = 아래 단계 셋이 한 곳으로 빨려 들어가 하나가 커짐 + 「합체! …」
   화면에 단계마다 12마리까지만 세움(규칙의 수는 그대로). 0.5초마다 규칙의 수와 화면을 맞춤 */
/* 부활 화면: 지역 병사 — 화면의 적 셋이 초록 빛 속에 쓰러졌다가 내 편 해골로 일어나 군단으로 걸어감 · 지역의 주인 — 망자 거인이 되어 군단 뒤에 섬 */
function riseFoeShow(r) {
  say(L.rise.foeUp(L.regions[r]), W / 2, H * 0.3, { size: 46, col: '#e6ffe9', glow: '#2bff8a', life: 2.2, vy: 0, stamp: true, screen: true }); Snd.smp && Snd.smp('rise', 0.8, 0, 0.8); S.shake = Math.max(S.shake, 4);
  for (const f of S.foes.filter(f => !f.dead && !f.flee).slice(0, 3)) { f.dead = true; burst(f.x, f.y - 30, 18, { col: ['#5dff8f', '#e6ffe9'], vmin: 40, vmax: 200, up: 120, g: -40, lmax: 0.9 }); S.army.push({ x: f.x, y: f.y, d: f.d, tx: armyFront() - 20, ty: f.y, w: 0, ph: rnd(0, 7), rise: 0.2, fly: null, cheer: rnd(0, 7), c: -1, g: 0, rf: r }); }
}
function riseLordShow(r) {
  say(L.rise.lord(L.regions[r]), W / 2, H * 0.3, { size: 52, col: '#e6ffe9', glow: '#2bff8a', life: 2.6, vy: 0, stamp: true, screen: true }); Snd.slam && Snd.slam(0.6); S.shake = Math.max(S.shake, 10); S.flash = Math.max(S.flash || 0, 0.5);
  S.ally = { r, x: S.giant.x || BX, t: 0 };
}
const EVO_CAP = 12;
function evoPick(L, n) { const c = S.army.filter(a => !a.fly && !a.mg && (a.evo || 0) === L && a.rise >= 1); c.sort((p, q) => q.x - p.x); return c.slice(0, n); }
function evoShow(lv, merge) {
  const nm = L.evo.names[lv];
  if (merge) {
    const three = evoPick(lv - 1, 3); if (three.length < 3) { const one = evoPick(0, 1)[0]; if (one) { one.evo = lv; one.evoFx = 1.2; } return; }
    const tgt = three[0]; for (const a of three.slice(1)) a.mg = { to: tgt, t: 0 };
    tgt.evoWait = 0.5; tgt.evoTo = lv;
    setTimeout(() => { say(L.evo.merge(nm), tgt.x, tgt.y - 130, { size: 26 + lv * 3, col: '#ffffff', glow: EVO_COL[lv], life: 1.5, vy: -30, stamp: true });
      if (lv === 4 && !st.seen.evoLord) { st.seen.evoLord = 1; say(L.evo.lordBorn, W / 2, H * 0.3, { size: 56, col: '#fff3c4', glow: '#ffb020', life: 2.4, vy: 0, stamp: true, screen: true }); S.shake = Math.max(S.shake, 10); Snd.chime && Snd.chime(784);
        const who = st.squad && st.squad[0]; if (who) setTimeout(() => heroLine(who, L.evo.lordLine), 900); } }, 500);   /* 첫 해골 군주: 화면 큰 글자 + 수하 한마디(한 번만) */
  } else {
    const a = evoPick(0, 1)[0]; if (!a) return; a.evo = 1; a.evoFx = 1;
    say(L.evo.up(nm), a.x, a.y - 100, { size: 20, col: '#d8ffe4', glow: EVO_COL[1], life: 1.1, vy: -40 });
  }
}
const EVO_COL = [null, '#5dff8f', '#6ab8ff', '#c58bff', '#ffd76a'];
function evoUpdate(dt) {
  for (const a of S.army) {
    if (a.evoFx > 0) a.evoFx = Math.max(0, a.evoFx - dt);
    if (a.evoWait > 0) { a.evoWait -= dt; if (a.evoWait <= 0) { a.evo = a.evoTo; a.evoFx = 1.3; burst(a.x, a.y - 50, 24, { col: [EVO_COL[a.evo], '#ffffff'], vmin: 80, vmax: 320, up: 120, lmax: 0.7 }); S.shake = Math.max(S.shake, 3); Snd.smp && Snd.smp('summon', 0.35, 0, 1.3); } }
    if (a.mg) { a.mg.t += dt; const k = Math.min(1, a.mg.t / 0.5); a.x = lerp(a.x, a.mg.to.x, k * 0.35); a.y = lerp(a.y, a.mg.to.y, k * 0.35); if (k >= 1) { a.gone = true; } }
  }
  S.evoT = (S.evoT || 0) + dt; if (S.evoT < 0.5) return; S.evoT = 0;
  let tagged = false; for (const a of S.army) { a.tag = !tagged && a.evo === 4 && !a.fly && !a.mg; if (a.tag) tagged = true; }   /* 이름표는 군주 한 마리만(여럿이면 겹쳐서 안 읽힘) */
  const e = st.evo || [];
  for (let lv = 4; lv >= 1; lv--) {
    const have = S.army.filter(a => !a.fly && !a.mg && ((a.evo || 0) === lv || a.evoTo === lv)), want = Math.min(e[lv] || 0, EVO_CAP);
    if (have.length < want) for (const a of evoPick(0, want - have.length)) a.evo = lv;
    else if (have.length > want) for (const a of have.slice(want)) if (!(a.evoWait > 0)) a.evo = 0;
  }
}
function armyTarget(a) {
  const g = S.giant;
  if (S.phase === 'fight' && st.boss && g.alpha > 0.5 && !g.dead) return { x: g.x - 130 + rnd(-30, 30), y: rnd(430, 610) };
  let best = null, bd = 1e9; for (const f of S.foes) { if (f.dead || f.flee) continue; const d = Math.abs(f.x - a.x) + Math.abs(f.y - a.y) * 0.5; if (d < bd) { bd = d; best = f; } }
  return best ? { x: best.x, y: best.y - 30, foe: best } : null;
}
function armyFight(dt) {
  if (UI.awakening) { S.ashots = []; for (const a of S.army) { a.sw = 0; a.swT = null; } return; }   /* 각성 연출 중엔 날아가던 화살 · 휘두르던 칼도 멈춤(19:55 시험에서 잡힘) */
  S.ashots = S.ashots || []; S.aslash = S.aslash || []; S.aStat = S.aStat || { sw: 0, arrow: 0, curse: 0, num: 0, back: 0 };   /* 시험용 셈 */
  const g = S.giant, on = !UI.awakening && ((S.phase === 'battle' && S.foes.some(f => !f.dead && !f.flee)) || (S.phase === 'fight' && st.boss && g.alpha > 0.5 && !g.dead));
  S.anumT = Math.max(0, (S.anumT || 0) - dt);
  const fr = armyFront(), per = JB.dps(st) / Math.max(1, armyVis());
  if (S.drum > 0) S.drum -= dt; for (const f of S.foes) if (f.curse > 0) f.curse -= dt;
  const land = (t, col, crit) => { if (t.foe) { t.foe.flash = Math.max(t.foe.flash || 0, 0.14); t.foe.kbT = 0.16; } /* 11-15 19:30 소환수 평타는 멈칫 없이 번쩍 · 튕김만(박자는 영웅이 만듦) */   /* 01:35 대표님 「때리는 거 딱딱탁」: 소환수 한 방마다 짧게 멈춤 · 흔들림 · 하얀 번쩍 · 뒤로 튕김 */ if (t.foe && t.foe.curse > 0 && Math.random() < 0.1) say(fmtD(per * 0.6), t.x + rnd(-20, 20), t.y - 40, { size: 15, col: '#e0b8ff', glow: '#9a4aff', life: 0.6, vy: -55 }); burst(t.x, t.y, 3, { col: [col, '#ffffff'], vmin: 30, vmax: 120, up: 30, lmax: 0.25 });
    crit = crit || Math.random() < 0.05;   /* 18:42 대표님 「데미지 표시 · 크리티컬」: 치명타 10% — 노란 큰 숫자 + 「치명!」 + 잠깐 멈춤 · 흔들림 · 별 불꽃 */
    if (crit) { S.aStat.num++; S.critN = (S.critN || 0) + 1; const tx = t.x + rnd(-16, 16), ty = t.y - 30 + rnd(-10, 4); say(fmtD(per * rnd(1.8, 2.4)), tx, ty, { size: 30, col: '#ffe14d', glow: '#ff7a00', life: 0.85, vy: -70 }); say(L.field.crit, tx, ty - 34, { size: 15, col: '#ffb02e', life: 0.7, vy: -70 });
      if (t.foe) t.foe.flash = 0.2; punch(0.04, 3); burst(t.x, t.y, 10, { col: ['#ffe14d', '#ffffff', '#ff9a2a'], vmin: 120, vmax: 340, up: 40, lmax: 0.3, smin: 2, smax: 4 }); }
    else if (S.anumT <= 0) { S.anumT = 1.6; S.aStat.num++; say(fmtD(per * rnd(0.8, 1.2)), t.x + rnd(-20, 20), t.y - 20 + rnd(-14, 6), { size: 17, col: '#ffffff', life: 0.6, vy: -55 }); } };
  for (const a of S.army) {
    if (a.fly) continue;
    if (a.sw > 0) { const was = a.sw; a.sw = Math.max(0, a.sw - dt); if (was > 0.2 && a.sw <= 0.2 && a.swT) { { const T = a.swT; S.aslash.push({ x: (T.foe ? T.foe.x : T.x) - 18, y: (T.foe ? T.foe.y - 70 : T.y - 40), age: 0, life: a.c === 2 ? 0.3 : 0.22, star: 1, c: a.c, ax: a.x + 40, ay: a.y - 80 }); if (a.c === 2 && T.foe) T.foe.kbT = 0.16; } land(a.swT, '#e8dcc0', Math.random() < 0.08); if (a.big) armySkill(a, a.swT, land); a.swT = null; } }
    if (!on) { a.sw = 0; continue; }
    a.atkT = (a.atkT == null ? rnd(0, 1.6) : a.atkT) - dt * (S.drum > 0 ? 1.6 : 1); if (a.atkT > 0) continue;   /* 북 치기: 6초 동안 1.6배 자주 */
    const far = a.c === 3 || a.c === 5; a.atkT = far ? rnd(1.5, 2.8) : rnd(0.9, 1.8);   /* 활 · 주술은 덜 자주(화면이 줄로 덮이지 않게) */
    const t = armyTarget(a); if (!t) continue;
    /* 20:35 대표님 「뒤에 노는 병사가 많네 — 전부 근거리 떨거지」: 칼이 안 닿는 뒷줄은 같은 베기 동작으로 뼈 창을 던짐(포물선) → 군단 전체가 쉬지 않고 싸움 */
    const RE = a.big ? ({ 1: 270, 2: 140 }[a.c] || 170) : 110;   /* 09:50 직업 차별: 큰 소환수 손 닿는 거리 — 창은 길게(270, 뒷줄에서 찌름) · 칼 170 · 방패 140 */
    if (!far && !a.big && (a.x < fr - 140 || (t.foe && Math.abs(t.foe.x - a.x) > RE))) {   /* 23:08 점검으로 찾음: 진화한 병사는 뒷줄에서 던지지 않아 싸움 내내 가만히 서 있었음 → 진화 병사도 던짐 */ a.atkT = rnd(1.5, 2.6); if (S.ashots.length < 40 && t.x - a.x > 60) { a.sw = SW_T; a.swT = null; S.aStat.throw = (S.aStat.throw || 0) + 1; S.ashots.push({ x: a.x + 18, y: a.y - 70, tx: t.x + rnd(-14, 14), ty: t.y + rnd(-10, 10), age: -0.22, life: rnd(0.45, 0.6), bone: true, t, sp: rnd(-1, 1) }); } continue; }
    if (!far && t.foe && Math.abs(t.foe.x - a.x) > RE) { if (a.big) { const home = a.tx + (S.engDx || 0);
        if (a.c === 1 || t.foe.x - home > RE + 200 || t.foe.x - a.x > RE + 110) { a.atkT = rnd(1.1, 1.8); if (S.ashots.length < 40) { a.sw = SW_T; a.swT = null; S.ashots.push({ x: a.x + 40, y: a.y - (a.c === 2 ? 20 : 80), tx: t.x, ty: t.y - (a.c === 2 ? 10 : 60), age: -0.25, life: a.c === 2 ? 0.42 : 0.3, wave: a.c, t }); } }   /* 11-15 관문 ①이 가끔(5번에 3번) 실패: 무리가 막 들어올 때 방패가 2초 넘게 걷기만 하고 못 침 → 지금 자리에서도 250 넘게 멀면 걷지 말고 먼 기술(충격파 · 검기) */ /* 10:15 직업 차별 · 먼 적: 칼 = 금빛 검기, 창 = 하늘빛 창 던지기, 방패 = 땅을 타고 가는 주황 충격파(화면 끝까지 쫓아가지 않음) */
        else { a.atkT = 0.2; a.advTo = Math.min(home + 200, t.foe.x - RE * 0.6); a.advT = 1.4; } } continue; }   /* 10:05 관문: 적이 하나만 멀리 남으면 칼이 47초 동안 한 번도 못 침 → 칼 · 방패는 그 적 앞까지 걸어가 치고, 다 끝나면 자기 자리로 걸어 돌아옴(창은 길어서 제자리) */   /* 09:55 느린 화면 셈: 5초에 칼 1번 · 창 1번 · 방패 1번만 침(닿지 않으면 쉬는 시간을 통째로 버림) → 큰 소환수는 닿을 때까지 0.2초마다 다시 봄 */   /* 근접은 적이 닿는 거리일 때만 휘두름 — 허공 휘두르기 없앰 */
    if (far) { if (S.ashots.length < 40) { S.aStat[a.c === 5 ? 'curse' : 'arrow']++; a.sw = SW_T; a.swT = null; S.ashots.push({ x: a.x + 30, y: a.y - (a.c === 5 ? 120 : 95), tx: t.x, ty: t.y - 30, age: -0.43, life: rnd(0.35, 0.55), curse: a.c === 5, t });
        if (a.big && a.c === 3 && (a.skN = (a.skN || 0) + 1) % 4 === 0) { skillSay(a, L.field.skill ? L.field.skill[3] : '연사!', '#b8ff7a'); const fs = S.foes.filter(f => !f.dead && !f.flee && f.x < VX1); for (let k = 1; k <= 3; k++) { const f2 = fs[k % Math.max(1, fs.length)] || t.foe, t2 = f2 ? { foe: f2, x: f2.x, y: f2.y - 60 } : t; S.ashots.push({ x: a.x + 30, y: a.y - 95, tx: t2.x, ty: t2.y - 30, age: -0.43 - k * 0.09, life: 0.32, t: t2, volley: 1 }); } } } }   /* 10:30 직업 기술 · 활 「연사」: 네 번째마다 화살 셋을 더 빠르게 */   /* 22:35 활 · 주술도 공격 동작을 하고, 시위를 놓는 순간에 맞춰 화살 · 마법이 나감 */
    else { a.sw = SW_T; a.swT = t; S.aStat.sw++; if (a.x < fr - 140) S.aStat.back++; }
  }
  for (const b of S.ashots) { b.age += dt; if (b.age >= b.life && !b.done) { b.done = true; if (b.pierce) { for (const f of S.foes.filter(f => !f.dead && !f.flee && f.x > b.x && f.x < b.tx + 60).slice(0, 3)) { const t2 = { foe: f, x: f.x, y: f.y - 60 }; land(t2, '#ffe28a', true); S.aslash.push({ x: f.x - 18, y: f.y - 70, age: 0, life: 0.22, star: 1, c: -1 }); } continue; } land(b.t, b.curse ? '#c58bff' : b.bone ? '#e8dcff' : '#fff2c8', false); if (b.wave !== undefined && b.t) S.aslash.push({ x: (b.t.foe ? b.t.foe.x : b.t.x) - 18, y: (b.t.foe ? b.t.foe.y - 70 : b.t.y - 40), age: 0, life: 0.22, star: 1, c: b.wave, ax: b.x, ay: b.y }); } }
  S.ashots = S.ashots.filter(b => !b.done); if (!on) S.ashots.length = 0;
  for (const f of S.aslash) f.age += dt; S.aslash = S.aslash.filter(f => f.age < f.life);
}
/* 10:30 대표님 「차별성」: 큰 소환수 직업 기술 — 칼 「검기」(네 번째마다 적 셋을 꿰뚫는 금빛 초승달) · 창 「관통」(맞은 적 뒤의 적까지) · 방패 「도발」(네 번째마다 주황 충격파, 주변 적 기절 0.6초 · 밀림) · 활 「연사」(armyFight) */
function skillSay(a, txt, col) { say(txt, a.x + 10, a.y - 175, { size: 19, col, glow: '#1a0730', life: 0.8, vy: -40 }); }
function armySkill(a, T, land) {
  a.skN = (a.skN || 0) + 1; const SK = (L.field && L.field.skill) || { '-1': '검기!', 1: '관통!', 2: '도발!', 3: '연사!' };
  if (a.c === -1 && a.skN % 4 === 0 && S.ashots.length < 40) { skillSay(a, SK[-1], '#ffe28a'); S.ashots.push({ x: a.x + 40, y: a.y - 80, tx: VX1 - 140, ty: a.y - 80, age: 0, life: 0.38, wave: -1, pierce: 1, big: 1, t: T }); }
  else if (a.c === 1 && T && T.foe) { const f2 = S.foes.filter(f => !f.dead && !f.flee && f !== T.foe && f.x > T.foe.x && f.x - T.foe.x < 170).sort((p, q) => p.x - q.x)[0]; if (f2) { if (a.skN % 3 === 0) skillSay(a, SK[1], '#9fe9ff'); land({ foe: f2, x: f2.x, y: f2.y - 60 }, '#9fe9ff', false); S.aslash.push({ x: f2.x - 18, y: f2.y - 70, age: 0, life: 0.22, star: 1, c: 1, ax: T.foe.x, ay: f2.y - 70 }); } }
  else if (a.c === 2 && a.skN % 4 === 0) { skillSay(a, SK[2], '#ffb36a'); S.aslash.push({ ring: 1, x: a.x + 20, y: a.y, age: 0, life: 0.45, c: 2 }); for (const f of S.foes) if (!f.dead && !f.flee && Math.abs(f.x - a.x) < 380) { f.kbT = 0.16; f.flash = 0.18; f.stun = Math.max(f.stun || 0, 0.6); } punch(0.05, 5); Snd.slam && Snd.slam(0.2); }
}
function armyFront() { let m = 0; for (const a of S.army) { if (a.fly) continue; const x = a.big && a.tx != null ? Math.min(a.x, a.tx + (S.engDx || 0) + 30) : a.x; if (x > m) m = x; } return m || 300; }   /* 10:10 관문: 큰 소환수가 적에게 걸어가면 적이 「맨 앞 + 70」에 서려고 같이 물러나 끝없이 쫓음 → 큰 소환수는 자기 자리 기준 */
/* 적 종류(21:10 싸움 다양화): 6판부터 궁수(뒤에서 쏨) · 11판 방패병(크고 느림, 앞줄) · 16판 날개 적(쫄따구 줄 위로 넘어와 수하를 침) · 21판 자폭병(빨리 달려와 쫄따구 줄에서 터짐)
   피해는 보여주기(규칙의 체력은 그대로) — 판마다 싸움 모양이 달라지게 */
function skelFall(a) {   /* 11-14 대표님 「공격하면 우리 쫄따구도 죽고」: 진짜로 쓰러져 뼈 무더기 → 3초 뒤 지배자가 보랏빛으로 다시 일으킴(군단 수는 그대로) */
  (S.fallen = S.fallen || []).push({ x: a.x, y: a.y, sc: a.sc || 1, t: 0 }); S.downN = (S.downN || 0) + 1; if (!st.seen.fallTip && !AUTO && typeof UI !== 'undefined' && st.raised >= JB.C.RAISE_TAPS && (st.best || 0) >= 3) {   /* 05:08 첫 몇 초(손가락 안내 · 일으켜라) 위에 쓰러짐 안내가 겹쳐 시끄러움 → 3판부터 */ st.seen.fallTip = 1; setTimeout(() => UI.toast(L.foes.fallT, L.foes.fallTip), 400); }   /* 00:32 대표님 「왜 죽는 거야? 기준 모르겠어」 → 처음 쓰러질 때 한 번 알려 줌 */
}
function fallenUpdate(dt) { if (!S.fallen) return; for (const c of S.fallen) { c.t += dt; if (c.t > 3 && !c.up) { c.up = 1; burst(c.x, c.y - 40, 14, { col: ['#c9a7ff', '#9b6bff', '#ffffff'], vmin: 40, vmax: 180, up: 220, lmax: 0.8 }); } } S.fallen = S.fallen.filter(c => c.t < 3.6); }
function raiseFallen() { if (!S.fallen || !S.fallen.length) return 0; const n = S.fallen.filter(c => c.t < 3).length; for (const c of S.fallen) if (c.t < 3) c.t = 3; return n; }
/* 지역 정예(11-14): 지역 순서 = 묘지 · 피의 늪 · 재의 평원 · 얼어붙은 성채 · 타락한 왕도 · 독안개 숲 · 가라앉은 신전 · 심연의 문. 그림은 병사 3D에 지역 색 + 고유 효과(전용 3D는 브라우저가 돌아오면) */
const ELITE_OF = [null, 'leech', 'pyro', 'frost', 'lancer', 'plague', 'paladin', 'abyss'];
function fellArmy(n, near, fx) { let c = 0; const L0 = S.army.filter(a => !a.fly && a.rise >= 1 && !a.evo && a.rf == null && !a.gone);
  L0.sort(near ? (a, b) => Math.hypot(a.x - near.x, a.y - near.y) - Math.hypot(b.x - near.x, b.y - near.y) : (a, b) => b.x - a.x);
  for (const a of L0) { if (c++ >= n) break; a.gone = true; skelFall(a); burst(a.x, a.y - 40, 8, { col: fx || ['#e8dcc0'], vmin: 80, vmax: 280, up: 160, g: 600, lmax: 0.7, add: false }); } return c; }
function armyMid() { const L0 = S.army.filter(a => !a.fly && a.rise >= 1); if (!L0.length) return { x: 400, y: 600 }; const t = L0[Math.floor(Math.random() * L0.length)]; return { x: t.x, y: t.y }; }
const ELITE = {
  leech: { off: 40, cd: [4, 5], col: '#ffb0b0', glow: '#c0102a', act(f) { const t = armyMid(); fellArmy(2, t, ['#ff3a4a', '#7a0010']); (S.drains = S.drains || []).push({ x: t.x, y: t.y - 40, tx: f.x, ty: f.y - 90, t: 0 }); st.hp = Math.min(st.maxHp, st.hp + st.maxHp * 0.02); } },   // 피의 늪 · 흡혈 기사: 해골 2 쓰러뜨리고 피를 빨아 적 무리 2% 회복
  pyro: { off: 240, cd: [4.5, 5.5], col: '#ffd0a0', glow: '#ff5a10', act(f) { const t = armyMid(); (S.fballs = S.fballs || []).push({ x: f.x - 30, y: f.y - 120, tx: t.x, ty: t.y, t: 0, L: 0.75, kind: 'fire', n: 3 }); } },   // 재의 평원 · 화염술사: 불덩이가 군단 한가운데 떨어져 3 쓰러짐
  frost: { off: 240, cd: [5, 6], col: '#d8f4ff', glow: '#3aa8ff', act(f) { const t = armyMid(); (S.fballs = S.fballs || []).push({ x: f.x - 30, y: f.y - 120, tx: t.x, ty: t.y, t: 0, L: 0.55, kind: 'ice', n: 2 }); st.chill = 2.5; S.chill = 2.5; } },   // 얼어붙은 성채 · 서리술사: 얼음 창 2 쓰러짐 + 2.5초 군단 공격 느려짐(화면 푸르게)
  lancer: { off: 0, cd: [5, 6], col: '#ffe0c0', glow: '#ff8a2a', act(f) { f.charge = 0.7; f.atk = 0.32; fellArmy(3, null, ['#e8dcc0', '#ffb070']); (S.slashes = S.slashes || []).push({ x: f.x - 160, y: f.y - 70, t: 0 }); S.shake = Math.max(S.shake, 10); Snd.smp && Snd.smp('slam', 0.25, 0, 1.6); } },   // 타락한 왕도 · 창기병: 앞줄 3을 꿰뚫는 돌격
  plague: { off: 230, cd: [5.5, 6.5], col: '#e0ffb0', glow: '#5aa020', act(f) { const t = armyMid(); (S.clouds = S.clouds || []).push({ x: t.x, y: t.y, t: 0, L: 3.2, hit: 0 }); } },   // 독안개 숲 · 역병술사: 독구름(3초 동안 해골이 하나씩 쓰러짐)
  paladin: { off: 120, cd: [6, 7], col: '#fff6c0', glow: '#ffd23a', act(f) { st.guard = 3.5; for (const o of S.foes) if (!o.dead && !o.flee) o.guard = 3.5; } },   // 가라앉은 신전 · 성기사: 3.5초 성스러운 방패(적 무리가 받는 피해 절반)
  abyss: { off: 260, cd: [6, 7], col: '#e0c8ff', glow: '#7a2aff', act(f) { for (let j = 0; j < 2; j++) { const d = Math.random(); const o = foeKind({ x: f.x + rnd(-40, 40), y: lerp(GROUND + 40, 680, d), d, ph: rnd(0, 7), sp: rnd(240, 310), born: S.t, dead: false, flee: false, off: rnd(20, 120), summoned: 1 }, 5); o.kind = 'foot'; o.elite = 0; o.big = 1; S.foes.push(o); (S.portals = S.portals || []).push({ x: o.x, y: o.y, t: 0 }); } } },   // 심연의 문 · 심연술사: 보병 2를 불러냄
};
function eliteUpdate(dt) {
  if (S.chill > 0) S.chill -= dt; if (st.chill > 0) st.chill -= dt; if (st.guard > 0) st.guard -= dt;
  for (const b of S.fballs || []) { b.t += dt; if (b.t >= b.L && !b.hit) { b.hit = 1; fellArmy(b.n, { x: b.tx, y: b.ty }, b.kind === 'fire' ? ['#ffb020', '#ff4a10', '#3a1a10'] : ['#d8f4ff', '#7ac8ff', '#ffffff']); (S.slams = S.slams || []).push({ x: b.tx, y: b.ty, t: 0, tint: b.kind }); S.shake = Math.max(S.shake, 7); burst(b.tx, b.ty - 30, 26, { col: b.kind === 'fire' ? ['#ffcf5a', '#ff5a10', '#ffffff'] : ['#ffffff', '#9ad8ff'], vmin: 80, vmax: 360, up: 160, lmax: 0.7 }); } }
  S.fballs = (S.fballs || []).filter(b => b.t < b.L + 0.1);
  for (const c of S.clouds || []) { c.t += dt; c.hit += dt; if (c.hit > 0.9 && c.t < c.L) { c.hit = 0; fellArmy(1, c, ['#9ad04a', '#3a6a10']); } }
  S.clouds = (S.clouds || []).filter(c => c.t < c.L + 0.6);
  for (const d of S.drains || []) d.t += dt; S.drains = (S.drains || []).filter(d => d.t < 0.8);
  for (const p of S.portals || []) p.t += dt; S.portals = (S.portals || []).filter(p => p.t < 0.9);
  for (const k of ['cracks', 'breath', 'pillars', 'beams']) { for (const o of S[k] || []) o.t += dt; S[k] = (S[k] || []).filter(o => o.t < 1.6); }
}
function foeKind(f, i) {
  const s = st.stage, pool = ['foot']; if (s >= 6) pool.push('archer'); if (s >= 11) pool.push('shield'); /* 날개 적은 그림이 오기 전까지 뺌(공중에 떠 오는 게 어색함, 21:51) */ if (s >= 21) pool.push('bomber'); if (s >= 8) pool.push('priest');
  const cap = i === 0 && s % 5 === 0 && st.wave === 2;   /* 5판마다 둘째 무리 맨 앞에 중간보스 「기사단장」 */
  let k = cap ? 'captain' : i === 0 ? (s >= 11 ? 'shield' : 'foot') : pool[Math.floor(Math.random() * pool.length)]; if (k === 'priest' && (i < 3 || S.foes.some(o => !o.dead && o.kind === 'priest'))) k = 'foot'; f.kind = k;   /* 사제는 한 무리에 1명, 뒤쪽에만 */
  { const rg = regionOf(st.stage), ek = ELITE_OF[rg]; if (ek && !cap && i === 1 && st.wave >= 1 && !S.foes.some(o => !o.dead && o.kind === ek)) { k = ek; f.kind = k; f.elite = 1; f.big = 1.15; f.off = ELITE[ek].off + rnd(0, 40); f.sp *= 0.85; f.actT = rnd(2, 3); } }   /* 11-14 대표님 「몬스터 · 마법 더 만들어 풍성하게」: 지역마다 고유 정예 1명(그 지역 둘째 무리부터) */
  if (k === 'captain') { f.off = 0; f.sp *= 0.7; f.big = 1.35; f.actT = 2.5; }
  if (k === 'priest') { f.off = 260 + rnd(0, 60); f.sp *= 0.8; f.actT = rnd(2, 3); }
  if (k === 'foot') f.off = rnd(0, 120);   /* 11-14: 같은 자리에 세로로 쌓여 기둥처럼 보여서 앞뒤로 흩음 */   /* 근접 적은 쫄따구 줄에 바짝 붙음(21:51 「쫄따구가 허공을 친다」) */
  if (k === 'archer') { f.off = 230 + rnd(0, 80); f.sp *= 0.9; } if (k === 'shield') { f.off = 0; f.sp *= 0.6; } if (k === 'flyer') { f.sp *= 1.2; f.fly = 1; } if (k === 'bomber') { f.sp *= 2.2; f.off = -10; }
  return f;
}
function foeAct(f, dt, front) {   /* 종류별 행동 */
  if (f.stun > 0) { f.stun -= dt; f.hitT = Math.max(f.hitT || 0, 0.3); return; }   /* 군주의 일갈: 멈춤 */
  f.actT = (f.actT == null ? rnd(1, 2) : f.actT) - dt;
  if (f.kind === 'priest' && f.actT <= 0 && f.x < VX1 - 40) { f.actT = rnd(3.5, 4.5); f.cast = 0.6; f.castT = 1.3; const add = st.maxHp * 0.03; st.hp = Math.min(st.maxHp, st.hp + add);   /* 사제: 적 무리 회복 + 금빛 축복(공격 빨라짐) */
    for (const o of S.foes) if (!o.dead && !o.flee) { o.bless = 2.5; } say(L.foes.heal, f.x, f.y - 150, { size: 24, col: '#fff2a8', glow: '#ffcf3a', life: 1.0, vy: -40 }); (S.slams = S.slams || []); }
  if (f.kind === 'captain' && f.actT <= 0 && f.x < VX1 - 60 && !(st.frozen > 0)) { f.actT = rnd(4.5, 5.5);
    if (Math.random() < 0.6) { f.atk = 0.32; f.charge = 0.5; S.shake = Math.max(S.shake, 12); say(L.foes.charge, f.x, f.y - 210, { size: 34, col: '#ffd0b0', glow: '#ff3a2a', life: 1.1, vy: -30, stamp: true });   /* 기사단장: 돌진 베기 — 앞줄 해골 4~6이 쓰러짐 */
      let n = 0; for (const a of S.army.filter(a => !a.fly && a.rise >= 1 && !a.evo && a.rf == null).sort((a, b) => b.x - a.x)) { if (n++ >= 4 + (Math.random() * 3 | 0)) break; a.gone = true; skelFall(a); burst(a.x, a.y - 40, 6, { col: ['#e8dcc0', '#ff5a3a'], vmin: 80, vmax: 260, up: 140, g: 600, lmax: 0.6, add: false }); }
      (S.slashes = S.slashes || []).push({ x: f.x - 160, y: f.y - 70, t: 0 }); Snd.smp && Snd.smp('slam', 0.3, 0, 1.4); }
    else { f.cryT = 1.2; for (const o of S.foes) if (!o.dead && !o.flee) o.bless = 4; say(L.foes.cry, f.x, f.y - 210, { size: 34, col: '#ffe08a', glow: '#ff8a2a', life: 1.2, vy: -30, stamp: true }); S.shake = Math.max(S.shake, 8); } }
  if (f.elite && ELITE[f.kind] && f.actT <= 0 && f.x < VX1 - 40 && !(st.frozen > 0)) { const E = ELITE[f.kind]; f.actT = rnd(E.cd[0], E.cd[1]); f.flash = 0.25; E.act(f); say(L.foes.elite[f.kind].skill, f.x, f.y - 190, { size: 28, col: E.col, glow: E.glow, life: 1.1, vy: -36, stamp: true }); }
  if (f.bless > 0) { f.bless -= dt; if (f.hitT > 0) f.hitT -= dt * 0.8; }
  if (f.charge > 0) { f.charge -= dt; f.x -= dt * 260; }
  if (f.kind === 'archer' && f.actT <= 0 && f.x < VX1) { f.actT = rnd(1.8, 2.6); const t = S.army.filter(a => !a.fly && a.rise >= 1).sort((a, b) => b.x - a.x)[Math.floor(rnd(0, 6))]; if (t) (S.fshots = S.fshots || []).push({ x: f.x - 20, y: f.y - 50, tx: t.x, ty: t.y - 40, age: 0, life: 0.6, t }); }
  if (f.kind === 'bomber' && f.x <= front + 5 && !f.boom) { f.boom = 1; f.dead = true; S.shake = Math.max(S.shake, 9); burst(f.x, f.y - 30, 40, { col: ['#ffb020', '#ff4a2a', '#ffffff'], vmin: 80, vmax: 420, up: 120, lmax: 0.7 }); say(L.foes.boom, f.x, f.y - 90, { size: 26, col: '#ffcf5a', glow: '#ff4a2a', life: 0.9, vy: -40 });
    let n = 0; for (const a of S.army.filter(a => !a.fly && a.rise >= 1 && !a.evo && a.rf == null).sort((a, b) => Math.abs(a.x - f.x) + Math.abs(a.y - f.y) - Math.abs(b.x - f.x) - Math.abs(b.y - f.y))) { if (n++ >= 3) break; a.gone = true; burst(a.x, a.y - 30, 8, { col: ['#e8dcc0'], vmin: 60, vmax: 260, up: 160, g: 600, lmax: 0.8, add: false }); } }
  if (f.kind === 'flyer') { const h = HF.list[0]; if (h && f.x < h.x + 260) { f.tx2 = h.x + 60; f.x += ((h.x + 60) - f.x) * Math.min(1, dt * 1.5); if (f.actT <= 0 && Math.abs(f.x - h.x) < 120) { f.actT = rnd(1.4, 2.2); HF.hurt(h, 1, false); } } }
}
function syncFoes() {
  if (st.boss) return;
  const key = st.stage * 10 + st.wave;
  if (S.foeWave !== key) {   // 새 무리
    S.foes.forEach(f => { if (!f.dead) { f.dead = true; killFx(f); } });
    S.foeWave = key; S.foeN = clamp(4 + Math.floor(st.stage / 15), 4, 6);   /* 09:35 갓깨비 사진 「적이 빽빽」 → 4~6마리(간격 70 → 56) */   /* 02:55 큰 소환수 4 · 큰 적: 3~5마리(10마리면 오른쪽에 뭉쳐 체력 막대가 겹치고 단추 밑까지 밀림) */   /* A판: 적이 커져서 10마리까지 */   /* 적 무리도 우리 군단 크기를 따라 늘림(11-14 대표님 「우리 군단 대비 적이 너무 적다」: 전엔 3~8마리 고정, 우리는 최대 72) */
    for (let i = 0; i < S.foeN; i++) { const d = Math.random(); S.foes.push(foeKind({ x: rnd(VX1 + 10, VX1 + 90) + i * 10, y: lerp(GROUND + 40, 680, d), d, ph: rnd(0, 7), sp: rnd(240, 310), born: S.t, dead: false, flee: false, off: i * 56 + rnd(0, 16) }, i));   /* 03:15 적이 한 자리에 겹쳐 섬 → 한 마리씩 뒤로 */   /* off: 맞서는 자리를 앞뒤로 흩음 — 한 줄로 몰려 숫자가 한곳에 쌓였음(16:55) */ }
  }
  const aliveWant = Math.ceil(S.foeN * clamp(st.hp / st.maxHp, 0, 1));
  const alive = S.foes.filter(f => !f.dead && !f.flee);
  /* 죽는 적은 화면 안 맨 앞부터(전엔 맨 뒤 = 화면 밖 적부터 죽어서 싸우는 게 안 보였음). 화면 안에 아직 없으면 들어올 때까지 미룸 */
  const front = alive.filter(f => f.x < VX1 - 140 && S.t - (f.born || 0) > 0.7).sort((a, b) => a.x - b.x);   /* A판 03:18: 큰 적이 화면 끝에서 바로 죽어 안 보였음 → 화면 안쪽까지 들어와 0.7초는 싸운 뒤 쓰러짐 */
  for (let i = 0; i < Math.min(alive.length - aliveWant, front.length); i++) { front[i].dead = true; killFx(front[i]); }
}
/* 11-14 대표님 「확실한 타격감 싹 잡자」: 히트 스톱(아주 짧게 느려짐) + 흔들림 + 휴대폰 진동을 한 번에 */
function punch(stop, shake, vib) {
  if (st.settings && st.settings.calm) { stop *= 0.4; shake *= 0.3; }
  if (stop < 0.07) { stop = Math.min(stop, 0.045); if (S.t - (S.stopT ?? -9) < 0.85) { S.shake = Math.max(S.shake || 0, shake * 0.3); return; } S.stopT = S.t; }   /* 11-15 19:30 대표님 「타격감 없고 따따따닥」: 잰 값 멈칫 초당 2.85 · 멈춘 시간 15% — 해골 한 방마다 멈추니 화면이 덜컥덜컥 → 작은 멈칫은 0.85초에 한 번만(큰 기술 · 보스 · 궁극기 0.07 이상은 그대로) */
  S.hitstop = Math.max(S.hitstop || 0, stop); S.shake = Math.max(S.shake || 0, shake);
  if (vib && st.settings && st.settings.vib !== false && navigator.vibrate && !(typeof Saver !== 'undefined' && Saver.is)) { const n = performance.now(); if (n - (punch.vt || 0) > 180) { punch.vt = n; try { navigator.vibrate(vib); } catch (e) {} } }
}
/* 영혼 구슬: 쓰러진 적에서 위 띠 영혼 칸으로 날아가 쌓임(번다는 느낌) */
function soulOrbs(x, y, n) {
  const V = window.__VT, cv = $('battle'), chip = document.querySelector('#hud .chip img[src*="i_soul"]'); if (!V || !cv || !chip) return;
  const r = cv.getBoundingClientRect(), dpr = cv.width / r.width, sx = r.left + (x * V.k + V.tx) / dpr, sy = r.top + (y * V.k + V.ty) / dpr, t = chip.getBoundingClientRect();
  if ((soulOrbs.live || 0) > 14) return;
  for (let i = 0; i < n; i++) { const o = document.createElement('div'); o.className = 'sorb'; o.style.left = sx + 'px'; o.style.top = sy + 'px'; document.body.appendChild(o); soulOrbs.live = (soulOrbs.live || 0) + 1;
    const mx = sx + (Math.random() - 0.5) * 90, my = sy - 40 - Math.random() * 60, d = 520 + Math.random() * 260 + i * 60;
    o.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 }, { transform: `translate(calc(-50% + ${mx - sx}px), calc(-50% + ${my - sy}px)) scale(1.1)`, opacity: 1, offset: 0.3 }, { transform: `translate(calc(-50% + ${t.left + t.width / 2 - sx}px), calc(-50% + ${t.top + t.height / 2 - sy}px)) scale(.55)`, opacity: 0.9 }], { duration: d, easing: 'cubic-bezier(.5,0,.75,.4)' }).onfinish = () => { o.remove(); soulOrbs.live--; chip.parentElement.classList.remove('bump'); void chip.offsetWidth; chip.parentElement.classList.add('bump'); }; }
}
/* 연속 처치: 2.5초 안에 이어서 쓰러뜨리면 숫자가 올라감 */
function comboHit() {
  const n = performance.now(); S.combo = n - (S.comboT || 0) < 2500 ? (S.combo || 0) + 1 : 1; S.comboT = n; const el = $('combo'); if (!el) return;
  if (S.combo >= 3) { el.innerHTML = `<b>${S.combo}</b><small>${L.ui.combo}</small>`; el.className = 'on' + (S.combo >= 20 ? ' hot' : S.combo >= 10 ? ' warm' : ''); void el.offsetWidth; el.classList.add('pop'); clearTimeout(comboHit.t); comboHit.t = setTimeout(() => { el.className = ''; }, 2500); if (S.combo % 10 === 0) { punch(0.05, 6, 30); Snd.chime && Snd.chime(660 + Math.min(10, S.combo / 10) * 60); } }
}
function killFx(f) {
  if (!(UI.awakening)) { soulOrbs(f.x, f.y - 50, f.elite || f.kind === 'captain' ? 5 : 1 + (Math.random() < 0.4 ? 1 : 0)); comboHit(); if (f.elite || f.kind === 'captain') punch(0.08, 9, 35); }
  (S.corpses = S.corpses || []).push({ x: f.x, y: f.y, d: f.d, t: 0, kind: f.kind, big: f.big }); S.shake = Math.max(S.shake || 0, 2.5);   /* A판: 그냥 사라지지 않고 쓰러짐 + 살짝 흔들림 */
  burst(f.x, f.y - 24, 10, { col: ['#fff6c8', '#ffd76a', '#ffffff'], vmin: 60, vmax: 260, up: 80, lmax: 0.5 });
  burst(f.x, f.y - 40, f.elite || f.kind === 'captain' ? 14 : 7, { col: ['#f3ecd9', '#d8ccb0', '#bfb59a', '#9aa3b5'], vmin: 160, vmax: 460, up: 360, g: 1100, lmin: 0.5, lmax: 0.9, smin: 3, smax: 6 });   /* 09:20 갓깨비 사진: 쓰러질 때 뼈 · 갑옷 조각이 사방으로 튐 */
  S.killN++; if ((S.combo || 0) >= 5 && S.combo % 5 === 0 && !S.texts.some(t => !t.screen && L.ui.kills.includes(t.text))) say(L.ui.kills[(Math.random() * L.ui.kills.length) | 0], f.x, f.y - 50, { size: 20, col: '#e8dcff', glow: '#8a3cff', life: 0.7 });   /* 19:04 적 무리 위가 숫자 · 막대 · 「압도 · 소멸 · 분쇄」로 뒤덮여 → 연속 처치 5 · 10 · 15…에만, 한 번에 하나 */
  if (S.killN % 2 === 0) Snd.tick();
}

// ───────── 규칙에서 온 일 처리 ─────────
function onEvents(ev) {
  for (const e of ev) {
    if (e.e === 'cryptSoon') { UI.toast(L.crypt.title, L.crypt.soon); UI.feed(L.crypt.soon); }
    if (e.e === 'riseFoe') riseFoeShow(e.r);
    if (e.e === 'riseLord') setTimeout(() => riseLordShow(e.r), 1300);
    if (e.e === 'evo') evoShow(1, false);
    if (e.e === 'merge') evoShow(e.lv, true);
    if (e.e === 'waveDown') { S.soulTick++; if (S.soulTick % 3 === 0) Snd.smp('soul', 0.25, 0, rnd(0.9, 1.2)); for (let i = 0; i < 3; i++) S.parts.push({ x: rnd(900, 1150), y: rnd(500, 640), vx: rnd(-520, -380), vy: rnd(-260, -120), life: 1.1, age: 0, size: rnd(3, 5), col: '#9fffd0', g: 160, add: true, kind: 'dot', rot: 0, vr: 0, real: true }); }
    if (e.e === 'bossArrive') bossArrive(e.lord);
    if (e.e === 'bossWait') bossWait(e.lord);
    if (e.e === 'autoCast') startCast(true);
    if (e.e === 'gear') { const gc = ['#cfcfcf', '#5be37a', '#4aa8ff', '#b56cff', '#ffcc33', '#ff4b4b'][e.it.g], fx = Math.min(VX1 - 220, (armyFront ? armyFront() : 600) + 120); burst(fx, 600, 14 + e.it.g * 6, { col: [gc, '#ffffff'], vmin: 60, vmax: 260 + e.it.g * 40, up: 260, lmax: 0.9 }); if (e.it.g >= 3) { S.flash = Math.max(S.flash || 0, 0.12); Snd.slam && Snd.slam(0.25); } if (typeof UI !== 'undefined' && !AUTO) UI.gearGot([e]); }   /* 22:50 장비가 떨어짐: 등급 색 빛 터짐 + 알림 */
    if (e.e === 'bossDown' && !AUTO && !TRAILER && !st.seen.firstOffer && (st.best || 0) >= 10 && !(JB.shopOf(st).bought.first)) { st.seen.firstOffer = 1; setTimeout(() => { if (document.getElementById('modal').style.display !== 'flex' && UI.offerFirst) UI.offerFirst(); }, 4200); }   /* 03:50 첫 지역의 주인을 잡은 직후 첫 결제 특가 한 번(AFK 저니는 14분쯤 첫 제안) */
    if (e.e === 'bossDown' && S.phase === 'fight') { S.downEv = e; giantDown(false); if (st.stage % 10 === 0 || (st.boss && st.boss.lord)) setTimeout(() => say(L.conquer(L.regions[regionOf(st.stage)]), W / 2, H * 0.24, { size: 54, col: '#ffe9a8', glow: '#ff9a2a', life: 2.4, vy: 0, stamp: true, screen: true }), 1600); }   /* x-10 지역의 주인을 잡으면 「정복」 */
    if (e.e === 'retreat') retreatFx();
    if (e.e === 'pushed') pushedFx();
    if (e.e === 'firstHero') { heroSay('join', e.id); Snd.smp('summon', 0.7); UI.toast(L.unlock.title, L.unlock.hero); if (!AUTO && !st.seen.curTip) setTimeout(() => { if (document.getElementById('modal').style.display !== 'flex' && !document.querySelector('#vsfx.go')) UI.curOpen('gems'); }, 3500); }   /* 03:25 첫 영웅(마정석이 처음 생김) 때 재화 안내 한 번 */
    if (e.e === 'best') UI.onBest(e.stage);
    if (e.e === 'stage' && (e.stage - 1) % 10 === 0 && e.stage > 1 && !TRAILER) {   // 새 땅 알림
      const n = Math.floor((e.stage - 1) / 10) + 1, name = L.regions[regionOf(e.stage)];
      regionCard(e.stage); Snd.chime(784); UI.feed(L.regionIn(n, name));
    }
  }
}
function bossArrive(lord) {
  if ((AUTO || st.settings.autoSquad) && JB.bossTraits(st.stage).length) { const bs = JB.bestSquad(st); st.squad = st.squad.map((_, i) => bs[i] || null); }   /* 봇 · 「추천 진형 자동」을 켠 사람은 보스 앞에서 추천 진형으로 */
  S.phase = 'arrive'; S.foes.forEach(f => f.flee = true); Snd.voiceCd && Snd.voiceCd('v_boss', 90, 0.6);   /* 04:40 보스 등장 「감히 여기까지 오다니!」(드리미나 AI 오디오), 90초에 한 번 */
  Object.assign(S.giant, { x: 1500, alpha: 1, dead: false, slam: 0, raise: 0, charge: 0, wind: 0, windFn: null, on: true, t0: S.t });
  S.warn = { t: 0 }; S.giant.rage = 0; S.giant.step = 0; S.raged = false; S.shock = [];   /* 보스 긴장감(11-14 대표님 「보스 나오는데 긴장감도 없고 너무 단순」): 붉은 경고 띠 · 쿵쿵 발소리 · 분노 */
  const vs = !TRAILER && typeof UI !== 'undefined' && UI.vsShow && UI.vsShow(lord);   /* 00:55 대표님이 보낸 버섯커 키우기: 보스 앞 「VS」 화면(지배자 ↔ 보스 대각선) */
  Snd.rumble(2); S.shake = 6; if (!vs) setTimeout(() => say(lord ? L.boss.lord : L.boss.arrive, W / 2, H * 0.4, { size: 50, col: '#ffe9a8', glow: '#ff3a2a', life: 1.8, vy: 0, stamp: true, screen: true }), (st.autoCast && JB.unlocked(st, 'autoCast')) ? 250 : 1100);   // 19:58 대마법 자동이면 영창이 먼저 떠서 「나타났다」가 뒤로 밀렸음 → 바로 // 이름은 경고 띠 뒤에 화면 가운데 도장처럼
  if (Math.random() < 0.6) setTimeout(() => heroSay('boss'), 2800);   // 수하 말은 경고가 끝난 뒤(겹치지 않게)
}
function bossWait(lord) {
  if (st.spellReady <= 0 && JB.unlocked(st, 'autoCast') && st.autoCast) return;   /* 대마법 자동이면 「누르세요」 화면 없이 규칙이 바로 자동 영창(21:07 대표님 「자동 없어 귀찮아」) */
  if (st.spellReady > 0) { S.phase = 'fight'; const sr = st.spellReady; setTimeout(() => say(L.spell.ready(Math.ceil(Math.max(1, sr - 1.6))), W / 2, 230, { size: 32, col: '#d9c2ff', life: 1.8, vy: 0, screen: true }), 1600); return; }
  const long = !st.seen.castLong || lord;
  if (long) { S.phase = 'stare'; S.stare0 = S.t; S.ts = 0.25; Snd.droneTo(0.008, 0.6); Snd.stareIn(); camTo(W / 2 + 70, H / 2, NARROW() ? 1 : 1.12, 0.5);   /* 얼굴만 확 당기던 것(3.4배) → 전장 전체가 보이게 살짝만 다가감(11-14 대표님 「얼굴만 딱 확대 — 별로」) */ }
  else showPrompt();
}
function showPrompt() { S.phase = 'prompt'; S.ts = 0.06; camTo(W / 2, H / 2, 1, 0.4); UI.showCast(true); if (AUTO || (JB.unlocked(st, 'autoCast') && st.autoCast)) setTimeout(() => castPressed(), AUTO ? 900 / SPEED : 400); }
function castPressed() { if (S.phase !== 'prompt') return; startCast(false); }
function startCast(auto) {
  if (!JB.beginCast(st) && st.boss?.phase !== 'cast') return;
  UI.showCast(false);
  const long = !st.seen.castLong || (!st.settings.shortCast && ((st.boss && st.boss.lord) || (st.spell !== 'sun' && !st.seen['long_' + st.spell] && !(st.spell === 'tide' && st.seen.tideLong))));   /* 설계: 새 대마법은 처음 한 번 긴 연출 — 전에는 뼈의 해일만 */
  st.seen.castLong = 1; if (st.spell !== 'sun') st.seen['long_' + st.spell] = 1;
  TC = long ? TC_LONG : TC_SHORT; TB = TC.flash + 0.8;
  S.phase = 'cast'; S.cast = 0; S.ts = 0.02; S.tint = 0; S.marks = {}; S.rings = []; S.sun = null; S.wave = null;
  S.castInfo = { long, auto, perfect: false, timing: JB.unlocked(st, 'timing') && !auto, tapped: false, landed: false };
  camTo(W / 2 - 40, H / 2 + 10, NARROW() ? 1 : long ? 1.08 : 1.04, 0.6); Snd.osc('sine', 220, 440, 0.6, 0.12);   // 지배자 · 마법진 · 적이 한 화면에
  UI.showTiming(S.castInfo.timing);
}
// 타이밍: 고리가 마법진에 겹칠 때(번쩍 직전) 누르면 완벽
function timingTap() {
  const ci = S.castInfo; if (!ci || !ci.timing || ci.tapped || S.phase !== 'cast') return;
  ci.tapped = true; const d = Math.abs(S.cast - (TC.flash - 0.05));
  if (d < 0.22) { ci.perfect = true; say(L.spell.perfect, W / 2, H * 0.32, { size: 58, col: '#fff3c4', glow: '#ffd76a', life: 1.4, vy: 0, stamp: true, screen: true }); Snd.chime(1568); }
  else Snd.tick();
}
function castUpdate(dt) {
  S.cast += dt; const c = S.cast, ci = S.castInfo;
  S.tint = Math.min(1, S.tint + dt * 2);
  S.lord.raise = ease(c / 0.6); S.lord.glow = Math.max(S.lord.glow, Math.min(1, c * 1.5));
  if (c > 0.15 && c < TB) S.parts.push({ x: 250 + rnd(-14, 14), y: 300 + rnd(-20, 20), vx: rnd(-25, 25), vy: rnd(-70, -20), life: 1.0, age: 0, size: rnd(1.5, 3.5), col: '#c9a7ff', g: -10, add: true, kind: 'dot', rot: 0, vr: 0, real: true });
  const spellName = L.spell[st.spell].name;
  if (TC.l1 >= 0 && c > TC.l1 && once('l1')) { say(L.spell.chant[0], W * 0.27, 150, { size: 42, col: '#e9dcff', life: 3.3, vy: 0, glow: '#8a3cff', reveal: 2.8, screen: true }); Snd.voice('vj_chant1'); if (TC === TC_LONG) camTo(FAR() ? 330 : 196 + LDX() + 60, FAR() ? 300 : 360, FAR() ? 1.0 : NARROW() ? 1.15 : 1.2, 1.0);   /* 18:41 대표님 「영창할 때 화면 끝 닿잖아, 내려」: 먼 화면은 지배자를 아래쪽 가운데로 */ }   /* 첫 영창: 카메라가 지배자에게 다가가 지팡이 치켜들고 구슬 모으는 영상을 크게 */
  if (TC.l2 >= 0 && c > TC.l2 && once('l2')) { say(L.spell.chant[1], W * 0.27, 212, { size: 42, col: '#e9dcff', life: 2.6, vy: 0, glow: '#8a3cff', reveal: 2.0, screen: true }); Snd.voice('vj_chant2'); camTo(...ringCam(), 1.0, 1.2); }
  if (c > TC.r1 && once('r1')) { S.rings.push({ r: 250, born: c, dir: 1 }); Snd.ring(0); }
  if (c > TC.r2 && once('r2')) { S.rings.push({ r: 178, born: c, dir: -1 }); Snd.ring(1); }
  if (c > TC.r3 && once('r3')) { S.rings.push({ r: 110, born: c, dir: 1 }); Snd.ring(2); }
  if (c > TC.name && once('name')) { say(`「${spellName}」`, W / 2, H * 0.74, { size: 96, col: '#f6efff', life: TC === TC_LONG ? 2.4 : 2.2, vy: 0, glow: '#a46bff', stamp: true, screen: true }); S.shake = 16; Snd.stamp(); if (st.spell === 'sun') Snd.voice('vj_chant3');   // 일본어 기술 이름 목소리는 검은 태양 것뿐 → 다른 대마법은 목소리 생길 때까지 쾅 소리만
    if (TC === TC_SHORT) camTo(...ringCam(), 1.0, 0.8); }
  if (c > TC.kou && once('kou')) S.shake = 22;
  if (c > TC.name + 0.05 && c < TC.flash) {
    if (c > TC.flash - 1.4 && once('suck')) Snd.suck();
    for (let i = 0; i < 3; i++) { const a = rnd(0, 7), r = rnd(300, 520); S.parts.push({ x: RC.x + Math.cos(a) * r, y: RC.y + Math.sin(a) * r * 0.7, vx: -Math.cos(a) * r * 1.6, vy: -Math.sin(a) * r * 1.1, life: 0.6, age: 0, size: rnd(2, 4), col: '#d7c0ff', g: 0, add: true, kind: 'dot', rot: 0, vr: 0, real: true }); }
  }
  if (ci.timing && !ci.tapped && AUTO && c > TC.flash - 0.15 && Math.random() < 0.1) { if (Math.random() < 0.7) { S.cast = TC.flash - 0.05; } timingTap(); }
  if (c > TC.flash && once('flash')) {
    S.flash = 1; S.ts = 0.6; UI.showTiming(false);
    const ev = JB.landSpell(st, ci.perfect); ci.landed = true;
    if (!st.seen.autoCastOn && JB.unlocked(st, 'autoCast')) { st.seen.autoCastOn = 1; st.autoCast = true; setTimeout(() => UI.toast(L.unlock.title, L.autoCastOn), 2500); }   /* 대마법 3번째: 자동을 켜 주고 알림(설정에서 끔) */
    S.pendingDown = ev.some(e => e.e === 'bossDown'); S.downEv = ev.find(e => e.e === 'bossDown') || null; S.lastDmg = (ev.find(e => e.e === 'spellHit') || {}).dmg || 0;
    onEvents(ev.filter(e => e.e !== 'bossDown'));
  }
  if (st.spell === 'sun') {
    if (c > TC.flash + 0.05 && once('sun')) S.sun = { y: RC.y, r: 10, born: c };
    if (S.sun && !S.sun.hit) { const k = ease((c - S.sun.born) / 0.75); S.sun.y = lerp(RC.y, S.giant.y - 230, k); S.sun.r = lerp(20, 150, k); if (k >= 1) { S.sun.hit = true; S.sun.hitT = c; } }
    if (S.sun && S.sun.hit && once('boom')) boomFx();
  } else if (c > TC.flash + 0.6 && once('boom')) boomFx();   // 뼈의 해일: 검은 태양 없이 군단에서 물결
  if (S.wave) S.wave.r += dt * 1700;
  if (S.giant.dead) S.giant.alpha = Math.max(0, S.giant.alpha - dt * 0.9);
  if (c > TB + 0.4) S.ts = Math.min(1, S.ts + dt * 0.8);
  if (c > TB + 0.9) { S.tint = Math.max(0, S.tint - dt * 3); S.dark = Math.max(0, S.dark - dt * 0.8); S.lord.raise = Math.max(0, 1 - (c - TB - 0.9) * 2); }
  if (c > TB + 1.1 && once('end')) {
    camTo(W / 2, H / 2, 1, 0.6); Snd.droneTo(0.05, 1.2);
    if (S.pendingDown) { Snd.cheer(); setTimeout(() => heroSay('win'), 600); S.phase = 'battle'; S.giant.on = false; }
    else { S.phase = 'fight'; }
    S.ts = 1; S.rings = []; S.sun = null; S.cast = -1;
  }
}
function boomFx() {
  const gx = S.giant.x, gy = S.giant.y - 220;
  S.tint = { col: st.spell === 'tide' || st.spell === 'graves' ? '60,220,140' : st.spell === 'sun' ? '255,170,40' : '150,60,255', a: 0.42 };   /* 09:20 대마법이 터질 때 화면 전체가 한 색으로 물듦 */
  if (st.spell === 'tide') {
    Snd.boom(); S.shake = 26; S.flash = 0.5; S.wave = { x: 300, y: 500, r: 0 };
    burst(400, 600, 160, { col: ['#e9e3cf', '#9fffd0', '#5dff8f'], vmin: 200, vmax: 900, up: 200, g: 300, lmin: 0.5, lmax: 1.5, smin: 3, smax: 7 });
  } else if (st.spell === 'graves') {   // 만 개의 묘비: 땅에서 묘비·초록 불길이 솟음
    Snd.boom(); Snd.smp('rise', 0.9); S.shake = 24; S.flash = 0.4; S.wave = { x: 520, y: 600, r: 0 };
    for (let i = 0; i < 40; i++) S.tombs.push({ x: rnd(260, gx + 80), y: rnd(GROUND + 40, 690), h: 0, life: 2.4, age: rnd(-0.4, 0) });
    burst(560, 620, 140, { col: ['#5dff8f', '#b8ffd0', '#2a8f55'], vmin: 100, vmax: 600, up: 400, g: 300, lmin: 0.6, lmax: 1.6, smin: 2, smax: 6 });
    say(L.spell.plusTime, W / 2, 150, { size: 54, col: '#c8ffd9', glow: '#2fbf6a', life: 1.8, vy: 0, stamp: true, screen: true });
  } else if (st.spell === 'frozen') {   // 얼어붙은 시각: 푸른 빛, 거인 위 얼음
    Snd.boom(); Snd.chime(1568); S.shake = 18; S.flash = 0.7; S.wave = { x: gx, y: gy, r: 0 };
    burst(gx, gy, 160, { col: ['#ffffff', '#bfefff', '#6fd3ff'], vmin: 100, vmax: 800, up: 60, g: 80, lmin: 0.8, lmax: 2, smin: 2, smax: 6 });
    say(L.spell.frozenMsg, W / 2, 150, { size: 54, col: '#dff6ff', glow: '#4fc3ff', life: 1.8, vy: 0, stamp: true, screen: true });
  } else if (st.spell === 'bell') {   // 종말의 종: 금빛 종소리 고리 세 겹
    Snd.boom(); Snd.stamp(); setTimeout(() => Snd.stamp(), 350); S.shake = 36; S.flash = 0.9; S.ts = 0.4; S.wave = { x: gx, y: gy, r: 0 };
    for (let i = 0; i < 3; i++) setTimeout(() => { S.wave = { x: gx, y: gy, r: 0 }; S.shake = 20; }, i * 260);
    burst(gx, gy, 200, { col: ['#fff3c4', '#ffd04a', '#c9a24a'], vmin: 150, vmax: 1100, up: 80, g: 200, lmin: 0.5, lmax: 1.6, smin: 3, smax: 8 });
  } else {
    Snd.boom(); S.shake = 42; S.flash = 0.6; S.ts = 0.35; S.wave = { x: gx, y: gy, r: 0 };
    burst(gx, gy, 220, { col: ['#ffffff', '#e2ccff', '#9b5cff', '#5a1fb0'], vmin: 200, vmax: 1300, up: 100, g: 200, lmin: 0.5, lmax: 1.8, smin: 3, smax: 9 });
    burst(gx, gy + 150, 100, { col: ['#ffe08a', '#ffd04a', '#fff3c4'], vmin: 80, vmax: 700, up: 300, g: 500, lmin: 0.8, lmax: 2.2, smin: 2, smax: 6 });
  }
  punch(S.castInfo.perfect ? 0.22 : 0.14, 0, S.castInfo.perfect ? [70, 40, 110] : 70);   /* 대마법 명중: 화면이 숨을 멈춤 */
  say(fmtD(S.lastDmg), gx, gy - 40, { size: S.castInfo.perfect ? 92 : 76, col: S.castInfo.perfect ? '#fff3c4' : '#ffe9a8', life: 1.2, vy: -40, glow: '#ff9d2a', stamp: true });
  if (S.pendingDown) { S.giant.dead = true; victoryFx(gx, gy); }
}
function giantDown(big) {
  punch(0.3, 22, [90, 50, 140]);
  const gx = S.giant.x, gy = S.giant.y - 220; S.giant.dead = true;
  burst(gx, gy, 120, { col: ['#ffe08a', '#ffd04a', '#fff3c4'], vmin: 80, vmax: 600, up: 200, g: 400, lmin: 0.6, lmax: 1.6 });
  Snd.boom(); S.shake = 18; Snd.cheer(); setTimeout(() => heroSay('win'), 500);
  S.phase = 'battle'; setTimeout(() => { S.giant.on = false; }, 1200);
  victoryFx(gx, gy);
}
/* 19:45 보스를 잡아도 숫자 하나 뜨고 끝 → 「승리!」 도장 + 받은 것 한 줄 + 영혼 구슬이 위 칸으로 쏟아짐(대마법으로 잡아도 · 군단으로 잡아도) */
function victoryFx(gx, gy) {
  const de = S.downEv; S.downEv = null; if (TRAILER) return;
  setTimeout(() => { say(L.boss.victory, W / 2, H * 0.3, { size: 64, col: '#ffe9a8', glow: '#ff9a2a', life: 1.6, vy: 0, stamp: true, screen: true });
    if (de) say(L.boss.loot(fmt(de.souls || 0), de.gems || 0), W / 2, H * 0.3 + 70, { size: 26, col: '#e8dcff', glow: '#8a3cff', life: 1.8, vy: 0, screen: true });
    soulOrbs(gx, gy + 120, 14); Snd.chime && Snd.chime(1319); }, 450);
}
// 원정(침공 지도 · 지하 묘지) 성공 순간: 전장 화면에 큰 글자 + 보라 물결 + 군단 함성. 대마법 연출 중이면 건너뜀
function conquestFx(title, sub, col = '#e9dcff', glow = '#8a3cff', kind) {   // kind = 수하 대사 종류(crypt · conquer · lab)
  if (S.phase === 'cast' || S.phase === 'prompt' || (TRAILER && !window.__adFx)) return false;   /* 광고 영상은 시안 3에서만 */
  // 소리로도 구분(11-13 14:20): 묘지 = 낮은 울림 + 문 닫히는 쾅 · 점령 = 도장 + 함성 · 연구 = 맑은 종 세 번 오름(쾅 없음)
  if (kind === 'crypt') { Snd.smp('stare', 0.55, 0, 0.8); Snd.slam(0.6); Snd.chime(392); }
  else if (kind === 'lab') { [1047, 1319, 1568].forEach((f, i) => setTimeout(() => Snd.chime(f), i * 130)); Snd.smp('soul', 0.6, 0, 1.3); }
  else { Snd.stamp(0.6); setTimeout(() => Snd.cheer(), 220); }
  S.shake = kind === 'lab' ? 4 : 16; S.flash = 0.25; S.wave = { x: 300, y: 520, r: 0 };
  burst(W / 2, 600, 120, { col: [glow, col, '#ffffff'], vmin: 150, vmax: 800, up: 300, g: 350, lmin: 0.6, lmax: 1.6, smin: 2, smax: 6 });
  S.army.forEach(a => { if (!a.fly && Math.random() < 0.5) a.hop = 0.6; });
  say(title, W / 2, 150, { size: 60, col, glow, life: 2.4, vy: 0, stamp: true, screen: true });
  if (sub) say(sub, W / 2, 220, { size: 26, col: '#fff', life: 2.4, vy: 0, screen: true });
  setTimeout(() => heroSay(kind || 'win'), 600);
  return true;
}
function pushedFx() {   /* 보통 판에서 밀림: 적 무리가 밀고 들어와 앞줄 몇이 튕겨 나가고, 줄 전체가 물러남 */
  UI.lossN = (UI.lossN || 0) + 1; S.shake = Math.max(S.shake, 12); Snd.slam && Snd.slam();
  S.army.forEach(a => { if (!a.fly && a.x > armyFront() - 60 && Math.random() < 0.35) a.fly = { vx: rnd(-420, -120), vy: rnd(-520, -260), r: 0, vr: rnd(-10, 10) }; });
  say(L.boss.pushed, W / 2, 130, { size: 30, col: '#ffd0d0', life: 2.4, vy: 0, screen: true });
  setTimeout(() => heroSay('lose'), 700); UI.guide('retreat');
  if (UI.lossN <= 3 && !AUTO && !TRAILER) setTimeout(() => UI.wallCard && UI.wallCard(), 2600);
}
/* 11-14 보스 지역 기술(대표님 「풍성하게」): 내려찍기 세 번에 한 번, 지역마다 다른 큰 기술. 0.9초 전에 붉은 경고 원 */
const BOSS_SP = [
  { k: 'quake', col: '#ffd9a0', glow: '#a0602a' },   // 잊힌 묘지 · 대지 가르기: 땅이 왼쪽으로 갈라지며 앞줄 5 쓰러짐
  { k: 'bloodrain', col: '#ffb0b0', glow: '#c0102a' },   // 피의 늪 · 피의 비: 2초 동안 군단 곳곳에 피 방울
  { k: 'breath', col: '#ffd0a0', glow: '#ff5a10' },   // 재의 평원 · 화염 숨결: 앞쪽을 휩쓰는 불길
  { k: 'blizzard', col: '#e0f6ff', glow: '#3aa8ff' },   // 얼어붙은 성채 · 눈보라: 얼음 창 넷 + 3초 군단 느려짐
  { k: 'meteor3', col: '#ffe0c0', glow: '#ff8a2a' },   // 타락한 왕도 · 왕의 유성: 불덩이 셋
  { k: 'miasma', col: '#e0ffb0', glow: '#5aa020' },   // 독안개 숲 · 독 늪: 큰 독구름 둘
  { k: 'mend', col: '#fff6c0', glow: '#ffd23a' },   // 가라앉은 신전 · 성스러운 회복: 보스 체력 6% 회복
  { k: 'beam', col: '#e8d0ff', glow: '#8a2aff' },   // 심연의 문 · 심연의 눈: 보라 빛줄기가 군단을 가로질러 쓸어냄
];
function bossSpecial() {
  punch(0.06, 0, [40, 30, 40]);
  const g = S.giant, sp = BOSS_SP[regionOf(st.stage)] || BOSS_SP[0], nm = L.boss.sp[sp.k];
  say(nm, W / 2, 285, { size: 40, col: sp.col, glow: sp.glow, life: 1.6, vy: 0, stamp: true, screen: true }); S.shake = Math.max(S.shake, 8); g.raise = 1;
  const pick = () => armyMid(), hurtH = n => { for (const h of HF.list) HF.hurt(h, n, true); };
  if (sp.k === 'quake') { (S.cracks = S.cracks || []).push({ x0: g.x - 160, x1: 260, y: 596, t: 0 }); setTimeout(() => { fellArmy(5, null, ['#a89070', '#6a5a48']); hurtH(2); S.shake = Math.max(S.shake, 14); }, 450); }
  else if (sp.k === 'bloodrain') { for (let j = 0; j < 8; j++) { const t = pick(); (S.fballs = S.fballs || []).push({ x: t.x + rnd(-40, 40), y: t.y - 700, tx: t.x, ty: t.y, t: -j * 0.22, L: 0.5, kind: 'blood', n: 1 }); } hurtH(1); }
  else if (sp.k === 'breath') { (S.breath = S.breath || []).push({ x: g.x - 120, y: g.y - 250, t: 0 }); setTimeout(() => { fellArmy(6, null, ['#ffb020', '#ff4a10', '#3a1a10']); hurtH(3); }, 500); }
  else if (sp.k === 'blizzard') { for (let j = 0; j < 4; j++) { const t = pick(); (S.fballs = S.fballs || []).push({ x: g.x - 100, y: g.y - 300, tx: t.x, ty: t.y, t: -j * 0.15, L: 0.6, kind: 'ice', n: 1 }); } st.chill = 3; S.chill = 3; hurtH(1); }
  else if (sp.k === 'meteor3') { for (let j = 0; j < 3; j++) { const t = pick(); (S.fballs = S.fballs || []).push({ x: g.x - 60, y: g.y - 380, tx: t.x, ty: t.y, t: -j * 0.25, L: 0.8, kind: 'fire', n: 2 }); } hurtH(2); }
  else if (sp.k === 'miasma') { for (let j = 0; j < 2; j++) { const t = pick(); (S.clouds = S.clouds || []).push({ x: t.x, y: t.y, t: 0, L: 3.5, hit: 0 }); } hurtH(1); }
  else if (sp.k === 'mend') { st.hp = Math.min(st.maxHp, st.hp + st.maxHp * 0.06); (S.pillars = S.pillars || []).push({ x: g.x, y: g.y, t: 0 }); }
  else if (sp.k === 'beam') { (S.beams = S.beams || []).push({ x: g.x - 60, y: g.y - 300, t: 0 }); setTimeout(() => { fellArmy(6, null, ['#c58bff', '#3a0a6a']); hurtH(3); }, 550); }
}
/* 11-14 새 지역 진입 장면(대표님 「새로운 진입 구간도 정해야」): 장 번호 · 지역 이름 · 배경 · 이 지역 정예 · 주인 판 */
function regionCard(stage) {
  const rg = regionOf(stage), act = Math.floor((stage - 1) / 80), n = Math.floor((stage - 1) % 80 / 10) + 1, el = $('rcard'); if (!el) return;
  const bg = REGION_BG[rg] ? `art/bg_${REGION_BG[rg]}.jpg` : 'art/bg.jpg', ek = ELITE_OF[rg];
  el.innerHTML = `<div class="rc-bg" style="background-image:url(${bg})"></div><div class="rc-in"><div class="rc-ch">${act ? (act + 1) + '막 · ' : ''}제${n}장</div><div class="rc-nm">${L.regions[rg]}</div><div class="rc-ln"></div>${ek ? `<div class="rc-row">${L.rcard.elite} <b>${L.foes.elite[ek].name}</b> — ${L.foes.elite[ek].skill.replace(/!$/, '')}</div>` : ''}<div class="rc-row">${L.rcard.boss(L.sn(stage + 9))}</div>${act ? `<div class="rc-row hot">${L.rcard.hard}</div>` : ''}</div>`;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); clearTimeout(regionCard.t); regionCard.t = setTimeout(() => el.classList.remove('on'), 3400);
}
function giantSlamFx() {   /* 거인 내려찍기: 땅이 갈라지는 충격파 + 앞줄 쫄따구 몇이 튕겨 나감(곧 다시 일어남) */
  punch(0.07, 0, 45);
  const g = S.giant, gx = g.x - 170; (S.shock = S.shock || []).push({ x: gx, t: 0 }); (S.slams = S.slams || []).push({ x: gx, t: 0 });
  burst(gx, 640, 22, { col: ['#6a5a48', '#a89070', '#fff2c8'], vmin: 80, vmax: 420, up: 160, lmax: 0.7 });
  const fr = armyFront(); let n = (g.rage > 0.5 ? 6 : 3) + ((Math.random() * 3) | 0);
  for (const a of S.army) { if (n <= 0) break; if (!a.fly && !a.evo && a.x > fr - 90) { a.fly = { vx: rnd(-520, -200), vy: rnd(-640, -320), r: 0, vr: rnd(-12, 12) }; n--; } }
}
function retreatFx() {
  UI.lossN = (UI.lossN || 0) + 1;
  const g = S.giant; g.slam = 1; S.shake = 26; Snd.slam();
  burst(840, 600, 50, { col: ['#ffe08a', '#fff', '#c8a24a'], vmin: 100, vmax: 600, up: 200, lmax: 0.9 });
  S.army.forEach(a => { if (a.x > 560 && Math.random() < 0.4) a.fly = { vx: rnd(-500, -150), vy: rnd(-700, -350), r: 0, vr: rnd(-12, 12) }; });
  say(L.boss.retreat, W / 2, 130, { size: 34, col: '#ffd0d0', life: 2.4, vy: 0, screen: true });
  setTimeout(() => heroSay('lose'), 800);
  S.phase = 'battle'; S.giant.leaving = true; UI.guide('retreat');
  if (UI.lossN <= 3 && !AUTO && !TRAILER) setTimeout(() => UI.wallCard && UI.wallCard(), 2600);   /* 19:55 처음 물러날 때 「졌다」로 끝나지 않게: 지금 할 수 있는 길 카드 */
}

// ───────── 한 틀 움직이기(화면) ─────────
function viewUpdate(realDt) {
  const dt = realDt * S.ts; S.t += realDt; const t = S.t;
  if (S.camT) { const c = S.camT; c.t += realDt; const k = ease(c.t / c.dur); S.cam.x = lerp(c.fx, c.x, k); S.cam.y = lerp(c.fy, c.y, k); S.cam.z = lerp(c.fz, c.z, k); if (c.t >= c.dur) S.camT = null; }
  const g = S.giant;
  const walkIn = g.on && !g.leaving && !g.dead && g.t0 != null && t - g.t0 < 1.5;   /* 11-14 18:46 대표님 「상대 안 보인디」: 대마법이 아직이면 걸어 들어오다 말고 「싸움」으로 넘어가 거인이 화면 밖(x 1466)에 멈춰 있었음 → 단계와 상관없이 1.5초 동안 끝까지 걸어 들어오고, 그 뒤에도 늘 제자리(BX)로 */
  if (walkIn || S.phase === 'arrive') { g.x = lerp(1500, BX, ease(Math.min(1, (t - g.t0) / 1.5))); g.walk += dt * 4; if (S.phase === 'arrive') S.shake = Math.max(S.shake, 2); }
  else if (g.on && !g.leaving && !g.dead && Math.abs(g.x - BX) > 1) g.x += (BX - g.x) * Math.min(1, realDt * 3);
  if (S.warn) { S.warn.t += realDt; if (S.warn.t > 2.6) S.warn = null; }
  if (S.phase === 'arrive') { const stp = Math.floor(g.walk / Math.PI); if (stp !== g.step) { g.step = stp; S.shake = Math.max(S.shake, 9); Snd.slam && Snd.slam(0.35); burst(g.x - 60, 650, 10, { col: ['#5a4a3a', '#8a7a64'], vmin: 40, vmax: 200, up: 60, lmax: 0.6 }); } }
  if (st.boss && st.boss.phase === 'fight') { const tl = st.boss.timer / Math.max(1, JB.C.BOSS_TIME); if (tl < 0.35 && !S.raged) { S.raged = true; say(L.boss.rage, W / 2, 285, { size: 46, col: '#ffb0a0', glow: '#ff2a2a', life: 1.8, vy: 0, stamp: true, screen: true }); S.shake = Math.max(S.shake, 16); Snd.slam && Snd.slam(0.8); } }
  g.rage = S.raged && st.boss ? Math.min(1, (g.rage || 0) + dt * 1.5) : Math.max(0, (g.rage || 0) - dt);
  if (S.shock) { for (const k of S.shock) k.t += dt; S.shock = S.shock.filter(k => k.t < 0.6); }
  if (S.phase === 'stare') {
    S.dark = Math.min(0.55, S.dark + realDt * 1.2);
    const k = t - S.stare0;
    if (k > 1.0 && once('lordEye')) { camTo(W / 2 - 70, H / 2, NARROW() ? 1 : 1.12, 0.6); S.lord.glow = 1; Snd.osc('sine', 1800, 900, 0.5, 0.06); }
    if (k > 2.0) showPrompt();
  }
  if (S.phase === 'prompt') { g.charge = Math.min(1, g.charge + realDt * 0.25); S.heart -= realDt; if (S.heart <= 0) { Snd.heart(); S.heart = 0.65; } }
  if (S.phase === 'cast') castUpdate(realDt);
  if (S.phase === 'fight') { g.walk += dt * 0.5; if (Math.random() < 0.08) burst(g.x - 120 + rnd(-40, 40), rnd(420, 600), 4, { col: ['#fff6c8', '#ffd76a'], vmin: 40, vmax: 160, lmax: 0.4 }); if (S.killN++ % 9 === 0) Snd.tick(); }
  if (g.leaving) { g.x += 380 * dt; if (g.x > 1600) { g.leaving = false; g.on = false; g.alpha = 0; } }
  if (g.dead && S.phase !== 'cast') g.alpha = Math.max(0, g.alpha - realDt * 0.9);
  if (!g.on && !g.leaving && S.phase === 'battle') g.alpha = 0;
  if (S.phase !== 'cast' && S.phase !== 'stare') S.dark = Math.max(0, S.dark - realDt * 0.8);
  if (st.tide > 0) { if (Math.random() < 0.3) { const a = S.army[(Math.random() * S.army.length) | 0]; if (a) S.parts.push({ x: a.x, y: a.y - 40, vx: 0, vy: -60, life: 0.6, age: 0, size: 3, col: '#9fffd0', g: 0, add: true, kind: 'dot', rot: 0, vr: 0, real: true }); } }

  syncArmy(dt); if (S.phase === 'battle') syncFoes(); HF.update(dt); LM.update(dt);   /* 전장의 수하 · 지배자 작은 마법 */
  formT += dt; if (formT > 0.7) { formT = 0; formation(); }
  // 군단 움직임
  /* 돌격 박자: 싸우는 중이면 6초마다 0.5초 밀고 들어가 1초 머물고 돌아옴(맨 앞 줄이 적과 부딪힐 때 불꽃) */
  S.surgeT = (S.surgeT || 0) + dt; const sp = S.surgeT % 6; const fighting = S.phase === 'battle' && S.foes.some(f => !f.dead && !f.flee);
  S.surge = fighting ? (sp < 0.5 ? sp / 0.5 : sp < 1.5 ? 1 : sp < 2.3 ? 1 - (sp - 1.5) / 0.8 : 0) : Math.max(0, (S.surge || 0) - dt * 2);
  /* 11-14 18:42 대표님 「유닛들이 그냥 밀리네」: 먼 화면에서 군단이 6초마다 적 앞까지 미끄러져 갔다가 뒤로 스르륵 밀려나 「밀리는」 것처럼 보였음
     → 싸우는 동안은 앞줄이 적과 맞닿은 곳에 버티고 서서 계속 싸움(S.eng: 0 대기 · 1 맞붙음), 돌격 박자는 제자리에서 20픽셀 밀어붙이기만 */
  const engOn = fighting || (S.phase === 'fight' && st.boss && g.alpha > 0.5 && !g.dead);
  S.eng = clamp((S.eng || 0) + (engOn ? dt * 1.2 : -dt * 0.35), 0, 1);
  let txMax = 0; for (const a of S.army) if (!a.fly && a.tx > txMax) txMax = a.tx;
  const clashX = S.phase === 'fight' && st.boss ? g.x - (ART.foev4_attack ? 380 : ART.foeA4 ? 290 : 200) : foeLine() - 10,   /* 02:35 새 보스 그림이 넓어 소환수와 겹침 → 더 앞에서 멈춤 */ engDx = FAR() ? Math.max(0, clashX - txMax) * ease(S.eng) : 0; S.engDx = engDx;
  if (fighting && sp >= 0.5 && sp - dt < 0.5) { Snd.stamp && Snd.stamp(0.35); for (const f of S.foes) if (!f.dead && !f.flee) { burst(f.x - 20, f.y - 30, 6, { col: ['#e8dcc0', '#ffffff'], vmin: 60, vmax: 200, up: 60, lmax: 0.35 }); f.flash = 0.12; } for (const a of S.army) if (!a.fly && Math.random() < 0.3) a.hop = 0.4; }
  const engage = S.phase === 'battle' ? null : 0;
  { const bossOn = st.boss && ['arrive', 'stare', 'prompt', 'cast'].includes(S.phase); S.bossBack = bossOn; let mx = -1e9; for (const a of S.army) if (!a.fly && a.tx != null) mx = Math.max(mx, a.tx);   /* 04:58 동작띠: 큰 보스 몸 속에 소환수가 서 있음 → 보스전엔 군단이 조금 물러섬(최대 90) */
    const want = bossOn && mx > -1e9 ? clamp(BX - 330 - mx, -110, 0) : 0; S.bShift = (S.bShift || 0) + (want - (S.bShift || 0)) * Math.min(1, dt * 3); }
  const bigM = S.army.some(a => !a.fly) && S.army.every(a => a.fly || a.big);   /* 09:45 느린 화면으로 봄: 큰 소환수가 돌격 박자(150) · 밀어붙이기(22)로 자리를 벗어나 적 위에 겹쳐 들어가고, 1초에 30씩 뒤로 미끄러져 돌아옴 → 큰 소환수는 자기 자리에서 내디디며 침(그림에서), 벗어나면 걸어서 빨리 돌아옴 */
  for (const a of S.army) {
    if (a.hop > 0) a.hop = Math.max(0, a.hop - dt);
    if (a.fly) { a.x += a.fly.vx * dt; a.y += a.fly.vy * dt; a.fly.vy += 1400 * dt; a.fly.r += a.fly.vr * dt; if (a.y > 760) a.gone = true; continue; }
    if (a.rise < 1) a.rise = Math.min(1, a.rise + dt * 2.5);
    if (a.charge > 0) a.charge -= dt; let gx = a.tx + engDx + (S.bShift || 0) + (bigM ? 0 : S.surge * (FAR() ? 22 : 90) * (0.6 + 0.4 * ((a.ph || 0) % 1)) + (a.charge > 0 ? 150 * Math.sin(a.charge / 0.7 * Math.PI) : 0));   /* 크라그 「뼈의 돌격」: 앞줄이 함께 뛰어나갔다 돌아옴 */   /* 돌격: 줄 전체가 앞으로 밀고 들어갔다 돌아옴 */
    if (a.advT > 0) { a.advT -= dt; if (a.big && a.advTo > gx) gx = Math.min(a.advTo, gx + 360); }
    if (!a.placed && a.tx != null && isFinite(gx)) { a.placed = 1; if (a.rise < 1) { a.x = gx; a.y = a.ty ?? a.y; burst(a.x, a.y - 10, 8, { col: ['#c9a7ff', '#9b6bff'], vmin: 30, vmax: 140, up: 160, g: -30, lmax: 0.6 }); } }   /* 20:42 대표님 「걸어오는 게 체스말 같다」: 새 망자병이 문에서 먼 길을 미끄러져 오던 것 → 제자리 땅에서 솟아오름 */
    if (a.x < gx) a.x += Math.min((S.surge > 0.05 || a.charge > 0 ? 380 : 120) * dt, gx - a.x); else if (a.x > gx + (bigM ? 4 : 26)) a.x -= Math.min((S.bossBack ? 260 : bigM ? 140 : FAR() ? 30 : 40) * dt, a.x - gx - (bigM ? 0 : 20));   /* 04:58 보스가 오면 군단이 제자리로 빠르게 물러나 보스 몸과 안 겹침 */   /* 21:58 대표님 「아직도 밀리는 애」: 조금 뒤에 있어도 그 자리에 서 있고, 많이 벗어났을 때만 천천히 물러남(뒤로 미끄러지던 것) */
    if (a.ty !== undefined && Math.abs(a.y - a.ty) > 1) { a.y += Math.sign(a.ty - a.y) * Math.min(50 * dt, Math.abs(a.ty - a.y)); a.d = clamp((a.y - GROUND - 40) / (680 - GROUND - 40), 0, 1); }
  }
  S.army = S.army.filter(a => !a.gone); fallenUpdate(dt); eliteUpdate(dt);
  evoUpdate(dt); armyFight(dt);
  const front = (S.army.some(a => !a.fly) ? armyFront() : Math.max(armyFront(), HF.front())) + 70;   /* A판: 적이 커서 조금 더 떨어져 섬 */   /* 적은 맨 앞 쫄따구 앞에서 맞섬(쫄따구가 없으면 수하 앞) */
  for (const f of S.foes) {
    if (f.dead) continue;
    if (f.flee) { f.x += 300 * dt; if (f.x > 1500) f.dead = true; continue; }
    const fx = FAR() ? Math.min(VX1 - (UK() < 1 ? 235 : 170), Math.max(front, foeLine()) + (f.off || 0) * 0.3) : Math.min(VX1 - (VW.w < 700 ? 95 : 130), front + (f.off || 0) * (VW.w < 700 ? 0.35 : VX1 < 1100 ? 0.65 : 1));   /* 18:40 먼 화면: 적은 오른쪽 끝 부근에 섬 · 11-15 폰은 오른쪽 단추 줄(설정 · 채팅 · 길드) 밑에 몸이 깔려서 65 더 안쪽 */   /* A판 03:18: 큰 적이 화면 오른쪽 끝에 반쯤 잘려 섰음 → 끝에서 130 안쪽 */   /* 좁은 화면은 앞뒤 흩는 폭을 반으로(화면 끝에 몰려 서지 않게) */   /* 화면 오른쪽 끝 안에 멈춤(11-13 대표님 「상대는 보이지도 않네」: 좁은 화면에서 궁수가 화면 밖에 섰음) */ if (f.kind === 'flyer' && f.tx2) {} else if (f.x > fx) f.x -= f.sp * dt * (FAR() && f.x > fx + 110 ? 2.4 : 1); else f.x = fx + Math.sin(t * 9 + f.ph) * 3;   /* 18:57 먼 화면: 적이 걸어 들어오다 화면 끝(단추 밑)에서 바로 쓰러져 「상대가 안 보였음」 → 맞붙는 줄까지는 뛰어 들어옴 */
    if (S.phase === 'battle' && !UI.awakening && !(st.frozen > 0)) foeAct(f, dt, front);
  }
  for (const b of S.fshots || []) { b.age += dt; if (b.age >= b.life && !b.done) { b.done = true; if (b.t && !b.t.gone) HF.skelHurt(b.t); } }
  S.fshots = (S.fshots || []).filter(b => !b.done); if (UI.awakening) S.fshots = [];
  S.foes = S.foes.filter(f => !f.dead); if (S.corpses) { for (const c of S.corpses) c.t += dt; S.corpses = S.corpses.filter(c => c.t < (c.kind === 'captain' ? 2.4 : 1.6)); }
  for (const p of S.parts) { const d = p.real ? realDt : dt; p.age += d; p.x += p.vx * d; p.y += p.vy * d; p.vy += p.g * d; p.rot += p.vr * d; }
  S.parts = S.parts.filter(p => p.age < p.life); if (S.parts.length > 900) S.parts.splice(0, S.parts.length - 900);
  for (const x of S.texts) { x.age += x.screen ? realDt : dt; x.y += x.vy * (x.screen ? realDt : dt); }
  S.texts = S.texts.filter(x => x.age < x.life);
  if (S.textQ && S.textQ.length && !S.texts.some(t => t.screen && t.size >= 40 && t.age < t.life * 0.85)) { const q = S.textQ.shift(); say(q[0], q[1], q[2], q[3]); }
  if (S.bubble) { S.bubble.age += realDt; if (S.bubble.age > (S.bubble.life || 3.2)) S.bubble = null; }
  S.shake *= Math.pow(0.02, realDt); S.flash = Math.max(0, S.flash - realDt * 2.6);
  if (g.slam > 0) g.slam = Math.max(0, g.slam - dt * 2);
  if (g.wind > 0) { g.wind -= dt; if (g.wind <= 0) { g.wind = 0; const f = g.windFn; g.windFn = null; if (f && !g.dead && g.alpha > 0.5) f(); } }   /* 거인 힘 모으기가 끝나는 순간 내려찍기 */
  if (S.phase !== 'cast' && S.tint > 0) S.tint = Math.max(0, S.tint - realDt * 1.5);   /* 고침(11-14 17:40): 대마법이 일찍 끝나면 보라 덮개(S.tint 0.7)가 다음 대마법까지 전장을 32% 어둡게 덮고 있었음 */
  if (g.raise > 0) g.raise = Math.max(0, g.raise - dt * 0.9);   /* 고침: 지역 기술 뒤 g.raise가 1로 남아 거인이 내내 뒤로 젖혀져 있던 것 */
  if (S.lord.glow > 0 && S.phase !== 'cast') S.lord.glow = Math.max(0, S.lord.glow - realDt * 0.6);
}
