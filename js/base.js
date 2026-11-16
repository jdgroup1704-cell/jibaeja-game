'use strict';
// 기본: 전투 화면(캔버스), 크기 맞추기, 작은 도구들, 주소 설정
const L = window.LANG.ko;
const cv = document.getElementById('battle'), ctx = cv.getContext('2d');
const W = 1280, H = 720, GROUND = 452;
const Q = new URLSearchParams(location.search);
const AUTO = Q.get('bot') === '1';                 // 봇이 대신 플레이(시험용)
const TEST = Q.get('test') === '1' || AUTO;        // 시험용 저장 이름을 따로 씀
const SPEED = Math.max(0.1, Math.min(20, +(Q.get('speed') || 1)));
const SAVE_KEY = (TEST ? 'jibaeja_test_b' : 'jibaeja_b') + (window.BUILD && !/VERSTAMP/.test(window.BUILD) ? window.BUILD : '0');   /* 판마다 새 저장(새 판 = 처음부터) */
try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && /^jibaeja_(test_)?(b|v3)/.test(k) && !k.startsWith(SAVE_KEY)) localStorage.removeItem(k); } } catch (e) {}   /* 지난 판 시험 저장은 치움(맨 처음 jibaeja_v2 저장은 남김) */   /* 11-14 18:00 대표님 「첫 시작부터 되게, 이어서 하지 말고」: 저장 이름을 바꿔 처음부터. 옛 저장(jibaeja_v2)은 지우지 않고 남겨 둠 */
let view = { s: 1, ox: 0, oy: 0, dpr: 1 };
// 화면 선명도 자동 낮춤(11-13 14:50): 느린 휴대폰에서 초당 장수가 3초 넘게 40장 밑이면 선명도를 한 단계(×0.8)씩 낮춤. 올리지는 않음(오락가락 방지). 1배 밑으로는 안 내림
let QUAL = 1;
function lowerQuality() { const d = Math.min(2, window.devicePixelRatio || 1); if (d * QUAL <= Math.max(1.01, Math.min(d, 1.5))) return false;   /* 선명한 화면(2배)은 1.5배 밑으로 안 내림 — 계단(도트 느낌) 막기 */ QUAL *= 0.8; resize(); return true; }
const LDX = () => VW.x >= 100 ? 30 : -22;   /* 21:58 대표님 「해골 마법사는 더 왼쪽 아니었나」: 폰 화면(VW.x 95)에서 왼쪽으로 22 → 군단과 떨어져 보이게 */
const NARROW = () => cv.width / Math.max(1, cv.height) < 1.6;   /* 세로 휴대폰처럼 전장이 좁은 화면 */
const LSC = () => NARROW() ? 0.86 : 1;   /* 11-14 18:05 좁은 화면에선 지배자 14% 작게(왼쪽 1/4을 차지해 싸움이 밀리던 것) */
const NS = () => NARROW() ? 0.8 : 1;   /* 좁은 화면에선 마법진 · 대마법 효과 20% 작게 */   /* 전장을 당겼을 때 지배자가 왼쪽 끝에 잘리지 않게 오른쪽으로 */
const VW = { x: 95, y: 168, w: 799, h: 542 };   /* 11-14 11:27 대표님 「업글이 엄청 보기 불편, 특히 모바일」: 위쪽 하늘을 잘라 전장 ≈ 화면 1/3, 아래 목록을 넓힘 */   // 11-14: 세로를 넓혀 전장이 화면의 약 40%(대표님 「전장이 작고 아래는 비어 있다」)   // 좁은 화면에서 보여 줄 세계 창
let BX = 1030, VX1 = 1160;   // 거인이 멈추는 가로 위치(좁은 화면 800) · 화면에 보이는 오른쪽 끝(좁은 화면 935)
function resize() {
  { const ap = document.getElementById('app'); if (ap && !TRAILER) { const r0 = ap.getBoundingClientRect(); const was = ap.classList.contains('tall'); ap.classList.toggle('tall', r0.height / Math.max(1, r0.width) > 1.75); if (was !== ap.classList.contains('tall') && typeof UI !== 'undefined' && UI.setFold) setTimeout(() => UI.setFold(ap.classList.contains('fold')), 0); } }
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1) * QUAL), r = cv.getBoundingClientRect();
  cv.width = Math.max(2, Math.round(r.width * dpr)); cv.height = Math.max(2, Math.round(r.height * dpr));
  let s = Math.min(cv.width / W, cv.height / H), ox = (cv.width - W * s) / 2;
  let oy = (cv.height - H * s) / 2; BX = 1030; VX1 = 1160;
  if (!TRAILER && cv.width / cv.height < 1.6) {   /* 좁은 전장(휴대폰 세로 틀 · 11-13 대표님 「게임이 너무 작아졌다」): 세계 중 싸움이 벌어지는 곳(가로 95~935 · 세로 100~710)만 꽉 차게 → 캐릭터가 약 1.3배 커짐. 거인은 왼쪽(800)에 멈춰 잘리지 않게 */
    s = Math.min(cv.width / VW.w, cv.height / VW.h); ox = (cv.width - VW.w * s) / 2 - VW.x * s; oy = (cv.height - VW.h * s) / 2 - VW.y * s; VX1 = VW.x + VW.w; BX = VW.w > 1000 ? VX1 - 205 : Math.min(840, VX1 - 115);   /* 04:58 동작띠: 보스가 소환수와 겹침 → 보스를 오른쪽으로 조금 */   /* 거인이 화면 안에 다 들어오게 */
  }
  view = { s, ox, oy, dpr };
}
const TRAILER = Q.get('trailer') === '1'; if (TRAILER) document.documentElement.classList.add('trailer');
addEventListener('resize', resize); try { new ResizeObserver(() => resize()).observe(cv); } catch (e) {}   /* 전장 칸 크기가 탭마다 바뀌어도 맞춤 */
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const WK = () => clamp(0.8 / Math.max(0.05, view.s / (view.dpr || 1)), 1, 2.6);   /* 11-14 18:42 휴대폰에선 전장이 0.35배로 줄어 피해 숫자 · 체력 막대가 5픽셀로 안 보였음 → 세계 글자 · 막대를 화면 크기에 맞춰 키우는 배수 */
const UK = () => TRAILER ? 1 : WK() > 1.6 ? 0.76 : 1;
const UKU = () => TRAILER ? 1 : WK() > 1.6 ? 0.98 : 1;   /* 11-15 22:25 우리 유닛(해골 · 영웅) 폰 크기: 0.76으로 줄여 적 기사보다 작고 「종이처럼 작게」 보였음(버섯커는 캐릭터가 큼) → 자리를 줄마다 140씩 띄웠으니 거의 그대로(0.98) */   /* 11-15 대표님 「캐릭터들 띄엄띄엄, 아직도 지들끼리 겹쳐 보여」: 폰처럼 좁은 화면에선 영웅 · 군단 몸집을 조금 줄여 사이를 띄움 */
const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const SERIF = "'Noto Sans KR','Noto Sans CJK KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif";   /* 21:50 대표님 폰엔 굵은 명조가 없어 얇은 바탕체로 나와 싸 보였음 → 굵은 고딕 하나로 통일(이름은 그대로 둠) */
const fmt = n => L.num(n);
const fmtD = n => { const t = n < 10 ? String(Math.max(1, Math.round(n))) : fmt(n); fmtD.v = n; fmtD.s = t; return t; };   /* 값도 기억 — 가까이 뜬 숫자를 합칠 때 씀 */   /* 11-15 눈 확인(알림한줄 1-1): 피해 숫자 「0.6」 「0.5」 — 때리는 맛이 소수점이면 약해 보임 → 피해 숫자는 10 밑이면 정수(최소 1) */
const TI_ART = { up: 't_up', grave: 't_grave', hero: 't_hero', awaken: 't_awaken', crypt: 't_rule', mission: 't_mission' };   /* 아래 탭 그림 아이콘 */
const IC = n => `<img class="ic" src="art/${n}.webp" alt="" onerror="this.remove()">`;   /* 글자 앞 작은 그림 아이콘(그림이 없으면 사라지고 글자만) */

/* 11-16 11:29 대표님 「밑에 공간 아예 많은데 · 안 겹치게 한다며 · 화면상으로도 겹치고」(PC 세로로 긴 창): 진형 · 적이 땅 위쪽(445~712)에만 서고 아래 140이 비었음 → 기술 단추 줄 위까지 쓸 수 있는 땅만큼 아래로 펼침(폰은 단추 줄이 덮어 그대로) */
let GYk = 1, GYt = 0;
function GYupd() { try { if (!document.getElementById('app').classList.contains('tall') || innerWidth < 500) { GYk = 1; return; }   /* 폰은 그대로(펼치면 영웅끼리 포개짐 — 관문⑯) · PC 세로 창만 */ const c = cv, sb = document.getElementById('skillbar'); if (!c || !sb) return; const cr = c.getBoundingClientRect(); if (cr.height < 50) return; let top = cr.bottom; if (sb.offsetParent) for (const e of sb.querySelectorAll('button,#slots,.sbsp')) { const r = e.getBoundingClientRect(); if (r.height > 4 && e.offsetParent) top = Math.min(top, r.top); }   /* 단추 줄의 투명 위쪽(그라데이션)이 아니라 실제 단추 위 */
    const T = window.__VT; if (!T || !T.k) return; const gb = ((top - cr.top) * cv.height / cr.height - T.ty) / T.k - 22,   /* 실제 카메라 변환(__VT)으로 — VW.h는 화면 세로와 달랐음(PC 창은 세로로 훨씬 더 보임) */ k = (gb - 470) / (712 - 470); GYk = k < 1.12 ? 1 : Math.min(1.6, k); }   /* 폰은 남는 땅이 거의 없어 펼치면 영웅끼리 포개졌음(관문⑯ 7%) → 남는 땅이 넉넉할 때(PC 세로 창)만 */ catch (e) { GYk = 1; } }
const GY = y => y <= 470 ? y : 470 + (y - 470) * GYk;
