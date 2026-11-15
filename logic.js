// 지배자 키우기 — 게임 규칙 2판 (그림 없음). 브라우저와 균형 시험(node) 둘 다에서 씀.
// 설계서: https://claude.ai/artifact/1Hcn72LSvY2kLDpGJtPRQR
(function (root) {
'use strict';

// ───────── 설정 (숫자는 여기서만 바꿈) ─────────
const C = {
  WAVES: 4,
  AWAKEN_FIRST: 20,   // 첫 각성만 20판(지역의 주인 앞) — 20:40 직접 플레이 8분: 20판 벽에서 3분 넘게 막혀 25판 각성까지 못 감
  EARLY_SOUL: { start: 2.2, step: 0.08 },   // 첫 각성 전 영혼 배수 = 시작 − 판×줄임(1 밑으론 안 내려감) — 20:30 초반 1~2분 살 게 없던 것
  STAFF_FIRST: [25, 60, 120],               // 지팡이 첫 단계 값(주력 강화를 일찍 눌러 보게)
  WAVE_LIMIT: 40,   // 보통 무리를 이 초 안에 못 깨면 군단이 밀려 한 판 물러남(11-14 대표님 「점점 버거워질 때 우리 모습은?」: 전엔 한 무리에 11분 넘게 서 있었음)
  RISE: { foe: 25, lordP: 0.35, lordPity: 3, foeMul: 0.02, lordMul: 0.05, regions: 8 },   // 부활(11-13 20:40): 한 지역 적 무리 25번 → 그 지역 병사가 내 편 · 지역의 주인은 깰 때 35%(3번째엔 반드시) → 망자가 되어 내 편. 도감 칸마다 공격 +2% · +5%(각성해도 남음). +3% · +8%면 봇 각성 11.1 · 16.1분으로 빨라져서 줄임
  TRAIT_FROM: 20, TRAIT_TWO: 40, TRAIT_HP: 1.3,   // 보스 특징: 20판부터 1개, 40판부터 2개
  AUTO_CAST_AFTER: 3,       // 대마법 자동: 직접 3번 쓰면 열림(11-13 대표님 「마법 자동도」 — 전엔 각성 2번). 자동은 「완벽」 ×1.5가 없어 손으로 누르는 재미는 남음
  EVO: { waves: 3, boss: 2, adMax: 5, adN: 3, offSec: 120, offMax: 30, bonus: [0, 0.0025, 0.01, 0.035, 0.11], max: 4, minArmy: 20 },   // 쫄따구 진화(11-13 16:20): 적 무리 3번 쓰러뜨릴 때마다 해골 1마리가 스스로 진화(보스는 2마리). 같은 단계 3마리 → 다음 단계 1마리로 합체. 단계별 공격 보탬 0.25% · 1% · 3.5% · 11%(합체하면 늘 조금 이득). 16:50 봇 대조: 보탬 0 = 각성 12.4 · 21.8분, 두 배 값(0.5%~22%) = 11.0 · 16.1 · 23.1 · 28.2분(너무 빠름) → 반으로                 // 한 판의 적 무리 수
  BONE_MUL: 1.08, MAGIC_MUL: 1.15, HARVEST_MUL: 1.1, MAGIC_SOFT: 1e9, MAGIC_LIN: 0, MAGIC_MUL2: 1.15,   // 11-13 계산 봇으로 맞춤(tools/search.js)
  EARLY_HP: [0.3, 0.45, 0.65, 0.85],   // 처음 몇 판은 금방 쓰러지게(손맛)
  LATE_AT: 80, LATE_GROW: 1.13,   /* 11-15 과금흉내: 14일 뒤 정체(2주에 5판) → LATE_AT판부터 적 체력이 덜 가파르게 */
  HP_BASE: 50, HP_GROW: 1.24, SOUL_BASE: 0.1, SOUL_GROW: 1.18, SOUL_FLAT: 0.4, SPELL_X: 25,
  BOSS_EVERY: 5,            // 5판마다 거대한 적
  LORD_EVERY: 10,           // 10판마다 '지역의 주인'(긴 연출)
  BOSS_HP_MUL: 10,
  BOSS_TIME: 20,            // 대마법 뒤 군단이 마무리할 시간(초)
  SPELL_CD: 18,
  PERFECT_MUL: 1.5,         // 완벽한 영창
  WALL_STAGE: 15, WALL_MUL: 1.6,   // 15판 벽: 여기서부터 체력이 한 번 크게 오름
  RAISE_TAPS: 9,            // 처음 '일으켜라' 손으로 누르는 횟수
  ARMY_PER_SUMMON: 5,
  ARMY_CAP: [300, 600, 1000, 1000, 1000, 1000, 1000],  // 각성 횟수별 군단 최대
  TRAIN: { min0: 20, grow: 0.04, atk: 0.02, soul: 0.01 },   /* 11-14 대표님 「무과금도 시간으로 강해지는 기본 업글」: 군단 수련 — 실제 시간이 흐르면(접속 안 해도) 저절로 단계가 오름. 돈 · 광고로 못 당김, 모두 같은 속도. 20분 × (1 + 단계 × 4%) 마다 1단계 · 단계당 공격 +2% · 영혼 +1% · 각성해도 남음 */
  OFFLINE_CAP_H: 8, OFFLINE_EFF: 0.6, OFF_GEM_H: 5, OFF_CHEST: [{ soul: 0, bones: 0, gems: 0 }, { soul: 0.1, bones: 5, gems: 5 }, { soul: 0.2, bones: 15, gems: 20 }, { soul: 0.35, bones: 30, gems: 50 }],   /* 자리 비움 상자: 1시간 동 · 4시간 은 · 8시간 금 */
  MORALE_SECS: 1800, MORALE_MAX: 0.2,      // 켜 둔 사람 덤: 30분 켜 두면 공격 +20% (나가면 0, 흉내로 맞춤: 50%는 속도 두 배)
  QUICK_HOURS: 2, QUICK_FREE: 3, QUICK_GEMS: [50, 80, 120, 200],   // 시간 건너뛰기: 하루 3번 무료(광고 자리), 그 다음은 마정석
  SPEED_AD_MIN: 30,                        // 광고 한 번에 2배속 30분
  TREASURE_EVERY: [150, 300], TREASURE_GEMS: [5, 12], TREASURE_BONES: [1, 3],   // 떠도는 보물 기사(초)
  AUTO_UP_AWAKEN: 1,                       // 자동 강화는 각성 1번에 열림
  AWAKEN_STAGE: 25, AWAKEN_STEP: 6, AWAKEN_SQ: 1, SIGIL_BASE: 2, SIGIL_PER: 1, SIGIL_MUL: 0.8,   // 각성 조건: 25판 → 32 → 41 → 52 → 65…(간격이 점점 벌어짐. 봇 1시간: 간격 그대로면 4분마다 각성 = 너무 빠름)
  BOSS_EARLY_MUL: 3.5, BOSS_EARLY_UNTIL: 10,
  BOSS_STAGE_MUL: {},       // 판별 거대한 적 체력 손보기(예: {20: 0.7})
  /* 귀빈 등급(11-13 대표님 「남들처럼」): 상점에서 산 만큼 경험치(1,000원 = 100). 등급마다 매일 마정석 · 군단 공격 · 자리 비움 시간 · 열쇠 */
  /* 11-14 13:38 대표님 「귀빈 구간별 혜택 더 · 현실적 금액 · 특정 구간 아이템 · 무기 · 귀빈 마법」: 12등급. 누적 결제(1,000원 = 100) — 1등급 첫 결제 1,200원 · 3등급 3만 · 5등급 10만 · 7등급 50만 · 10등급 300만 · 12등급 1,000만. 자리 비움 · 수련은 모두 같음(귀빈 덤 없음) */
  VIP: { need: [0, 120, 1000, 3000, 5000, 10000, 20000, 50000, 100000, 200000, 300000, 500000, 1000000], gems: [0, 20, 30, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300], atk: [0, 0.03, 0.05, 0.08, 0.1, 0.13, 0.16, 0.2, 0.24, 0.28, 0.33, 0.38, 0.45],   /* 20:30 밸런스 시험(tools/밸런스시험.js): 귀빈 공격 +150%까지라 중과금이 무료보다 2.35배 빨랐음 → 목표 소 1.3 · 중 1.6 · 고 2배(무료도 같은 곳에 꼭 도착) */ key: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2] },
  VIP_ITEMS: { staff3: { vip: 3, spell: 0.10 }, banner6: { vip: 6, cd: 0.10 }, scythe8: { vip: 8, time: 5 }, scepter10: { vip: 10, spell: 0.25 }, crown12: { vip: 12, atk: 0.10 } },   /* 귀빈 전용 무기 · 물건: 3 귀빈의 뼈 지팡이(대마법 +10%) · 6 금빛 군기(대마법 대기 −10%) · 8 망자의 낫(보스 시간 +5초) · 10 영원의 왕홀(대마법 +25%) · 12 천년 왕관(군단 공격 +10% 더) */
  /* 수하 무기 강화(11-13 대표님 「무기 · 복장 업그레이드와 화려함」): 7단계까지 뼛조각, 8~10단계는 전설 강화석(상점 · 귀빈). 단계마다 그 수하 능력 +15% */
  WEAPON: { max: 10, freeMax: 7, bone0: 5, boneStep: 5, mul: 0.15 },
  /* 11-15 17:42 대표님 「SSR 뽑고 6성 초월해서 7성 되고 스킬도 달라지던데」: 같은 영웅을 겹쳐 뽑으면 「영혼 묶기」 ★1→★6, ★6 뒤 겹친 영혼(조각)으로 「망자 군주화」 ★7(초월).
     ★3 기술로 쓰러진 적이 우리 망자병으로 일어남 · ★5 기술 두 번 · ★7 대마법 때 함께 영창(+20%) + 최고 등급은 궁극기 */
  STAR: { max: 6, per: 0.5, trShards: 2, trBones: 300, trMul: 1.6, shardMax: 4, chant: 0.2, trAwaken: 1,   /* 11-15 18:05 대표님 「벌써부터 7성?」: 초월은 각성 1번 뒤에 열림 · 등급마다 값이 다름(흔한 영웅은 겹치기 쉬우니 뼛조각을 많이) */
    tr: { N: { shards: 4, bones: 900 }, R: { shards: 4, bones: 700 }, SR: { shards: 3, bones: 500 }, SSR: { shards: 2, bones: 300 } } },   /* 과금흉내: 무과금 상급(SR) 초월이 7일 → 영혼 3으로 늦춤 */
  /* 수하 전용 겉모습(유료 · 귀빈): 입으면 전장 모습이 바뀌고 그 수하 능력 덤. vip = 그 귀빈 등급이면 공짜로 받음 */
  SKINS: { serafine_q: { hero: 'serafine', mul: 0.3, vip: 7 } },
  SQUAD4_DAY: 3,            /* 진형 넷째 칸: 3번째 접속한 날(설계서 빈 3일째 채우기, 11-13 대표님 판정) */
  FIRST_GIANT: 2,           // 처음 켠 사람이 대마법을 빨리 맛보게: 이 판에 딱 한 번 거대한 적(0이면 끔)
  GACHA_COST: 50, GACHA10_COST: 450, PITY: 80,
  GEM_BOSS_FIRST: 30, GEM_AWAKEN: 150,
  BONE_PER_STAGE: 1, BONE_BOSS: 4,
  GACHA_BLOCKED_COUNTRIES: ['BE', 'NL'],
  DIRECT_PRICE: { N: 60, R: 200, SR: 900, SSR: 4500 },
  // 해금(판 기준). 시간 목표: 거인 1:30 / 수하 2:30 / 무덤 3:30 / 타이밍 5:00 / 임무 6:00 / 각성 18~22분
  CRYPT: { unlock: 35, day: 2, keys: 3, keyGems: 50, keyBuyMax: 3, log0: 5.6, logStep: 1.6, dust0: 10, dustPer: 4, firstGems: 20, costBase: 20, costGrow: 1.6 },   // 지하 묘지(설계 2일차): 하루 열쇠 3개 → 층을 깨면 유물·가루. 층 체력 = 10^(5.6 + 1.6×(층−1)): 열릴 때(힘 약 10^6) 1층은 바로, 처음 며칠은 열쇠가 막고 6~7일째부터는 힘이 막음(흉내 tools/sim3.js C=1)
  AD_BONES: { n: 10, max: 3 },   // 설계 매출 틀 「광고 보기: 무료 일으키기」 — 광고 1번에 뼛조각 10개, 하루 3번(11-13 17:00)
  LAB: { day: 6, min0: 10, minGrow: 1.6, bone0: 20, boneGrow: 1.5, gemPerMin: 1 / 3, adMin: 30, adMax: 3 },   // 마법 연구(설계 6일차): 6번째 접속한 날 · 한 번에 하나 · 10분 × 1.6^단계 · 뼛조각 20 × 1.5^단계 · 마정석 1개 = 3분 줄임 · 광고 30분 줄임 하루 3번
  MAP: { day: 5, tokens: 5, need0: 30, needStep: 5, gems: 15, bones: 5, soul: 0.01, kingdomGems: 150 },   // 침공 지도(설계 5일차): 5번째 접속한 날 열림 · 하루 5번 · 칸 n(0부터)은 최고 기록 30+5n판 필요 · 칸마다 영혼 +1%(영구)
  UNLOCK: { keep: 30, guild: 25, dungeon: 15, gear: 4, map: 0, lab: 0 /*날짜로 열림 — 알림용 이름만*/, crypt: 35, summon: 1, bone: 3, hero: 7, grave: 11, timing: 10, mission: 12, magic: 1 /* 지팡이(주력, 11-13 18:14 대표님 「지배자 키우기인데」) — 전엔 13판 「마력」 */, harvest: 16, awaken: 25, autoCast: 2 /*각성 횟수*/ },
};

const RARITY = {
  N: { weight: 50, bonus: 0.06 }, R: { weight: 35, bonus: 0.12 },
  SR: { weight: 13, bonus: 0.35 }, SSR: { weight: 2, bonus: 1.0 },   /* 11-15 과금흉내: 중과금(7.8만 원)이 무과금과 같은 판(129 vs 131) → 최고 · 상급을 키워 30일 무 143 · 소 128 · 중 157 · 고 177 */
};
// 수하: 이름·말투·대사는 언어 파일(LANG.heroes)에
const HEROES = [
  { id: 'serafine', rarity: 'SSR', stat: 'atk' },
  { id: 'morde', rarity: 'SSR', stat: 'spell' },
  { id: 'nox', rarity: 'SR', stat: 'soul' },
  { id: 'twins', rarity: 'SR', stat: 'cd' },
  { id: 'krag', rarity: 'R', stat: 'atk' },
  { id: 'wisp', rarity: 'R', stat: 'offline' },
  { id: 'drummer', rarity: 'N', stat: 'atk' },
  { id: 'porter', rarity: 'N', stat: 'soul' },
];
// 수하 역할 · 보스 특징 · 상성(11-13 18:16 대표님 「수하 특징으로 조합해서 보스를 깨야지」, 나중 겨루기도 같은 꼬리표로)
const ROLE = { serafine: 'melee', morde: 'aoe', nox: 'burst', twins: 'ranged', krag: 'melee', wisp: 'ranged', drummer: 'buff', porter: 'aoe' };
const TRAITS = {   // 역할별 배수: 1.6 = 잘 듣는다 · 0.6 = 안 듣는다
  armor: { melee: 0.6, burst: 1.6 }, wings: { ranged: 1.6, melee: 0.6 }, regen: { burst: 1.6, aoe: 0.6 },
  split: { aoe: 1.6, burst: 0.6 }, ward: { aoe: 0.6, melee: 1.6 }, frenzy: { buff: 1.6, ranged: 0.6 },
};
const TRAIT_IDS = Object.keys(TRAITS);
/* 보스 특징: 20판부터 1개, 40판부터 2개(판마다 늘 같음). 수하가 없을 때(첫 보스들)는 없음 */
function bossTraits(stage) { if (stage < C.TRAIT_FROM) return []; const n = stage >= C.TRAIT_TWO ? 2 : 1, a = (stage * 7 + 3) % TRAIT_IDS.length, b = (a + 1 + (stage * 3) % (TRAIT_IDS.length - 1)) % TRAIT_IDS.length; return n === 2 ? [TRAIT_IDS[a], TRAIT_IDS[b]] : [TRAIT_IDS[a]]; }
/* 상성 배수: 진형 칸마다(빈 칸 0.8) 특징 배수를 곱하고 평균 → 0.5 ~ 2 */
function matchMul(st, stage = st.stage, squad = st.squad) {
  const tr = bossTraits(stage); if (!tr.length) return 1;
  let sum = 0; for (const id of squad) { if (!id) { sum += 0.8; continue; } let m = 1; for (const t of tr) m *= TRAITS[t][ROLE[id]] || 1; sum += m; }
  return Math.max(0.5, Math.min(2, sum / Math.max(1, squad.length)));
}
/* 추천 진형: 가진 수하 중 이 보스에 가장 센 조합(역할 배수 × 등급 무게) */
function bestSquad(st, stage = st.stage) {
  const own = HEROES.filter(h => st.heroes[h.id]).map(h => h.id), tr = bossTraits(stage), w = { N: 0.6, R: 0.9, SR: 1.3, SSR: 1.8 };
  const score = id => { let m = 1; for (const t of tr) m *= TRAITS[t][ROLE[id]] || 1; return m * w[heroById(id).rarity] * (1 + 0.1 * ((st.heroes[id] && st.heroes[id].lv) || 1)); };
  return own.sort((a, b) => score(b) - score(a)).slice(0, st.squad.length);
}
const FIRST_HERO = 'krag';   // 첫 수하는 뽑기 없이 확정
const HERO_MAX_LV = 6, SQUAD = 3;   /* 11-15 레벨 = 별(★) 1~6, 그 뒤는 초월(tr) */
const starMul = o => !o ? 0 : (1 + C.STAR.per * (Math.min(o.lv, C.STAR.max) - 1)) * (o.tr ? C.STAR.trMul : 1);
const heroStar = o => !o ? 0 : o.tr ? 7 : Math.min(o.lv, C.STAR.max);
const trOpen = st => (st.awakens || 0) >= C.STAR.trAwaken;
const trCost = id => C.STAR.tr[heroById(id).rarity] || { shards: C.STAR.trShards, bones: C.STAR.trBones };
function transcend(st, id) { const o = st.heroes[id], c = trCost(id); if (!trOpen(st)) return { ok: false, why: 'lock' }; if (!o || o.tr || o.lv < C.STAR.max) return { ok: false, why: 'star' }; if ((o.shards || 0) < c.shards) return { ok: false, why: 'shards' }; if (st.bones < c.bones) return { ok: false, why: 'bones' }; o.shards -= c.shards; st.bones -= c.bones; o.tr = 1; return { ok: true, id }; }
const chantMul = st => 1 + C.STAR.chant * st.squad.filter(id => id && st.heroes[id] && st.heroes[id].tr).length;   /* ★7 영웅 하나마다 대마법 +20% */
// 인연: 둘을 같이 진형에 세우면 추가 효과(설계서 3일차 '진형과 인연')
const BONDS = [
  { id: 'vanguard', a: 'serafine', b: 'krag', talk: ['krag', 'serafine'], stat: 'atk', bonus: 0.15 },
  { id: 'master', a: 'morde', b: 'twins', talk: ['twins', 'morde'], stat: 'cd', bonus: 0.15 },
  { id: 'shadow', a: 'nox', b: 'porter', talk: ['porter', 'nox'], stat: 'soul', bonus: 0.15 },
  { id: 'parade', a: 'wisp', b: 'drummer', talk: ['wisp', 'drummer'], stat: 'offline', bonus: 0.15 },
];
/* 20:32 대표님 「나중에 편하게 업데이트」: balance.js(있으면)의 숫자로 덮어씀 — 코드를 안 건드리고 숫자만 고쳐 업데이트 */
{ const B = root.BALANCE; const merge = (a, b) => { if (!b) return; for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]); else a[k] = b[k]; } };
  if (B) merge(C, B.C); root.__balMerge = merge; }
const bondsOn = st => BONDS.filter(x => st.squad.includes(x.a) && st.squad.includes(x.b));

const UPGRADES = {
  summon: { base: 3, grow: 1.09 }, bone: { base: 8, grow: 1.18 },
  magic: { base: 250, grow: 1.2 },   // 지팡이: 처음부터 열려서(18:20) 값을 60 → 250 — 봇 각성: 60이면 9.9분, 150이면 11.5 · 19.2 · 27.1분(대조 12.8 · 22.3) harvest: { base: 80, grow: 1.2 },
};
if (root.BALANCE && root.__balMerge) root.__balMerge(UPGRADES, root.BALANCE.UPGRADES);


// 무덤 일으키기: 병과 6칸 × 등급 8단계
const CLASSES = ['sword', 'spear', 'shield', 'bow', 'rider', 'curse'];
const GRADES = 8;
const GRADE_POWER = [0.10, 0.25, 0.55, 1.2, 2.6, 5.5, 12, 26];   // 군단 공격에 더해지는 배수
// 제단 등급별 등급 확률(몫). 확률표는 여기서 자동 계산해 화면에 공개
const ALTAR = [
  { w: [70, 25, 5, 0, 0, 0, 0, 0], cost: 0, secs: 0 },
  { w: [50, 33, 13, 3.5, 0.5, 0, 0, 0], cost: 60, secs: 60 },
  { w: [35, 35, 20, 8, 1.8, 0.2, 0, 0], cost: 600, secs: 300 },
  { w: [25, 32, 25, 12, 5, 0.9, 0.1, 0], cost: 6000, secs: 1200 },
];

const SPELLS = {
  sun: { unlock: 0 },          // 검은 태양: 한 방
  tide: { unlock: 1, dur: 20, mul: 2 },   // 뼈의 해일: 20초 군단 공격 2배 (각성 1번에 열림)
  graves: { unlock: 2, time: 15, hit: 8 },   // 만 개의 묘비: 제한 시간 +15초, 초당 피해 8초치 한 번 더
  frozen: { unlock: 3, dur: 8, mul: 1.5, hit: 3 },   // 얼어붙은 시각: 8초 적 멈춤(시간도 멈춤), 그동안 피해 ×1.5 — 설계서 값(11-13 16:45, 전에는 10초 ×2)
  bell: { unlock: 4, frac: 0.28 },           // 종말의 종: 적 남은 체력의 28%(완벽 ×1.5) + 검은 태양의 30%
};
const RANKS = 6;
const MISSIONS = [
  { id: 'waves', need: 60, gems: 20, bones: 3 },
  { id: 'raise', need: 10, gems: 20, bones: 0 },
  { id: 'cast', need: 3, gems: 20, bones: 3 },
  { id: 'upgrade', need: 25, gems: 20, bones: 2 },
  { id: 'contract', need: 1, gems: 30, bones: 5 },
];

// ───────── 계산식 ─────────
const isBoss = s => s % C.BOSS_EVERY === 0;
const isLord = s => s % C.LORD_EVERY === 0;
const waveHp = s => C.HP_BASE * (C.EARLY_HP[s - 1] || 1) * (s > C.LATE_AT ? Math.pow(C.HP_GROW, C.LATE_AT - 1) * Math.pow(C.LATE_GROW, s - C.LATE_AT) : Math.pow(C.HP_GROW, s - 1)) * (s >= C.WALL_STAGE ? C.WALL_MUL : 1) * Math.pow(1.5, Math.floor((s - 1) / 50));
const waveSouls = s => C.SOUL_BASE * Math.pow(C.SOUL_GROW, s - 1) + C.SOUL_FLAT;   // 처음 몇 분 동안 강화를 바로 누를 수 있게 고정 몫을 조금 더함
const upCost = (k, lv) => k === 'magic' && lv < C.STAFF_FIRST.length ? C.STAFF_FIRST[lv] : Math.ceil(UPGRADES[k].base * Math.pow(UPGRADES[k].grow, lv));   // 지팡이 첫 3단계는 싸게(19:50 첫 플레이 3분 영상: 주력인데 3분 내내 +0이었음)
const unlocked = (st, k) => k === 'squad4' ? (st.daysPlayed || 0) >= C.SQUAD4_DAY : k === 'lab' ? (st.daysPlayed || 0) >= C.LAB.day : k === 'map' ? (st.daysPlayed || 0) >= C.MAP.day : k === 'crypt' ? !!(st.crypt && (st.crypt.open || st.best >= C.CRYPT.unlock)) && (st.daysPlayed || 0) >= C.CRYPT.day :   // 지하 묘지: 35판 + 2번째 접속한 날(설계서 2일차, 11-13 10:40)
   k === 'autoCast' ? st.awakens >= C.UNLOCK.autoCast || (st.casts || 0) >= C.AUTO_CAST_AFTER : k === 'awaken' ? st.awakens > 0 || st.best >= (C.AWAKEN_FIRST || C.UNLOCK.awaken) /* 23:20 각성한 뒤 25판에서 「새로 열림: 각성」이 또 뜨던 것 */ : st.best >= C.UNLOCK[k] || st.awakens > 0 && ['summon', 'bone', 'hero', 'grave', 'timing', 'mission', 'magic', 'harvest'].includes(k);

// ───────── 지하 묘지 · 유물(지배자 장비, 각성해도 남음) ─────────
// ───────── 지배자 장비 (11-14 22:45 대표님 「장비 등 강해지는 거 없어?」) ─────────
// 6칸 · 등급 6(일반 → 신화). 적 무리를 쓰러뜨리면 가끔 · 보스는 반드시 · 마정석 뽑기. 더 좋으면 자동 장착, 아니면 자동 분해 → 강화석. 각성해도 남음.
const GEAR_SLOTS = [{ id: 'staff', stat: 'spell', k: 0.5 }, { id: 'crown', stat: 'soul', k: 0.5 }, { id: 'ring', stat: 'atk', k: 1 }, { id: 'armor', stat: 'atk', k: 1 }, { id: 'amulet', stat: 'cd', k: 0.03 }, { id: 'cloak', stat: 'offline', k: 0.4 }];
const GEAR = { base: [0.02, 0.04, 0.08, 0.16, 0.32, 0.64], drop: 0.015, bossDrop: 0.5, w: [55, 27, 12.5, 4.3, 1.0, 0.2], pullW: [28, 36, 23, 9.5, 3.0, 0.5], pull1: 30, pull10: 270, salvage: [1, 2, 4, 9, 20, 45], maxLv: 20, lvK: 0.08, ilvDiv: 60, adMax: 3 };
const gearOf = st => st.gear || (st.gear = { slots: {}, stones: 0, n: 0, ad: 0, adDay: 0, log: [] });
const gearVal = (it, sl) => !it ? 0 : GEAR.base[it.g] * sl.k * (1 + it.ilv / GEAR.ilvDiv) * (1 + GEAR.lvK * (it.lv || 0));
function gearBonus(st, stat) { if (!st.gear) return 0; let b = 0; for (const sl of GEAR_SLOTS) if (sl.stat === stat) b += gearVal(st.gear.slots[sl.id], sl); return b; }
function gearRoll(st, w, ilv, bossUp) { const tot = w.reduce((a, b) => a + b, 0); let r = Math.random() * tot, g = 0; while (g < w.length - 1 && (r -= w[g]) > 0) g++; if (bossUp && g < 4 && Math.random() < 0.4) g++;   /* 보스 올림은 전설까지(신화로는 안 올림) */
  const sl = GEAR_SLOTS[Math.floor(Math.random() * GEAR_SLOTS.length)]; return { slot: sl.id, g, ilv: Math.max(1, ilv), lv: 0 }; }
function gearTake(st, it) {   /* 더 좋으면 끼고(끼던 건 분해), 아니면 분해. 결과를 돌려줌 */
  const G = gearOf(st), sl = GEAR_SLOTS.find(s => s.id === it.slot), cur = G.slots[it.slot]; G.n++;
  if (!cur || gearVal(it, sl) > gearVal(Object.assign({}, cur, { lv: 0 }), sl) * (1 + GEAR.lvK * (cur.lv || 0)) * 0.999) { if (cur) { it.lv = Math.max(it.lv || 0, Math.floor((cur.lv || 0) * 0.7)); G.stones += GEAR.salvage[cur.g]; } G.slots[it.slot] = it; return { it, equipped: true, stones: cur ? GEAR.salvage[cur.g] : 0 }; }
  G.stones += GEAR.salvage[it.g]; return { it, equipped: false, stones: GEAR.salvage[it.g] }; }
function gearDrop(st, ev, boss) { if (!unlocked(st, 'gear')) return; if (Math.random() > (boss ? GEAR.bossDrop : GEAR.drop)) return; const r = gearTake(st, gearRoll(st, GEAR.w, st.stage, boss)); ev.push(Object.assign({ e: 'gear', boss: !!boss }, r)); }
/* 01:30 「영혼 제단」(버섯커 램프): 뼛조각 1개 = 장비 1개, 무료 재화로 계속 누르는 핵심 반복. 많이 누를수록 제단 단계↑ → 좋은 등급 확률↑ */
function altarLv(st) { return Math.min(10, Math.floor(((st.gearAltar || 0)) / 40)); }
function altarW(st) { const k = altarLv(st); return GEAR.w.map((w, i) => i === 0 ? Math.max(10, w - k * 4) : i >= 5 ? 0 : i === 4 ? w * 0.5 * (1 + k * 0.1) : w * (1 + k * 0.18 * i)); }   /* 11-15 과금흉내: 뼛조각 제단으로 무과금이 7일에 신화 → 제단은 신화 없음 · 전설 절반(신화는 보스 · 장비 뽑기 · 운) */
function altarPull(st, n) { n = Math.min(n, st.bones); if (n < 1 || !unlocked(st, 'gear')) return null; st.bones -= n; const out = []; for (let i = 0; i < n; i++) { st.gearAltar = (st.gearAltar || 0) + 1; out.push(gearTake(st, gearRoll(st, altarW(st), st.best, false))); } return out; }
function gearPull(st, n) { const cost = n >= 10 ? GEAR.pull10 : GEAR.pull1 * n; if (st.gems < cost) return null; st.gems -= cost; const out = []; for (let i = 0; i < n; i++) out.push(gearTake(st, gearRoll(st, GEAR.pullW, st.best, false))); return out; }
function gearAd(st) { const G = gearOf(st); if (G.adDay !== st.day) { G.adDay = st.day; G.ad = 0; } if (G.ad >= GEAR.adMax) return null; G.ad++; return [gearTake(st, gearRoll(st, GEAR.pullW, st.best, false))]; }
const gearUpCost = it => 3 + (it.lv || 0) * 3;
function gearUp(st, id) { const G = gearOf(st), it = G.slots[id]; if (!it || (it.lv || 0) >= GEAR.maxLv) return false; const c = gearUpCost(it); if (G.stones < c) return false; G.stones -= c; it.lv = (it.lv || 0) + 1; return true; }
function gearUpAll(st) { let n = 0; for (let k = 0; k < 200; k++) { const G = gearOf(st); const ids = GEAR_SLOTS.map(s => s.id).filter(id => G.slots[id] && (G.slots[id].lv || 0) < GEAR.maxLv).sort((a, b) => gearUpCost(G.slots[a]) - gearUpCost(G.slots[b])); if (!ids.length || !gearUp(st, ids[0])) break; n++; } return n; }

// ───────── 지배자 겉모습 (11-14 23:00 커스텀) ─────────
// 얻은 겉모습마다 보유 효과(군단 공격 +%)가 쌓이고, 고른 겉모습으로 지배자 색 · 기운이 바뀜
const LSKINS = [
  { id: 'void', bonus: 0, need: st => true },
  { id: 'blood', bonus: 0.03, need: st => st.awakens > 0 || st.best >= 10 },
  { id: 'frost', bonus: 0.04, need: st => st.awakens >= 2 },
  { id: 'plague', bonus: 0.05, need: st => !!(st.crypt && st.crypt.floor >= 3) },
  { id: 'shadow', bonus: 0.06, need: st => vipLv(st) >= 5 },
  { id: 'gold', bonus: 0.08, need: st => !!(st.lskinBuy && st.lskinBuy.gold) },
];
const lskinOwned = (st, id) => { const s = LSKINS.find(x => x.id === id); return !!s && s.need(st); };
const lskinBonus = st => LSKINS.reduce((a, s) => a + (s.need(st) ? s.bonus : 0), 0);
function lskinWear(st, id) { if (!lskinOwned(st, id)) return false; st.lskin = id; return true; }

const RELICS = [
  { id: 'crown', stat: 'soul', per: 0.10, floor: 1 },     // 영혼 +10%/단계
  { id: 'ring', stat: 'atk', per: 0.10, floor: 2 },       // 군단 공격 +10%
  { id: 'staff', stat: 'spell', per: 0.12, floor: 3 },    // 대마법 피해 +12%
  { id: 'cloak', stat: 'offline', per: 0.10, floor: 4 },  // 자리 비움 +10%
  { id: 'glass', stat: 'cd', per: 0.05, floor: 5 },       // 대마법 대기 −
  { id: 'chain', stat: 'time', per: 1, floor: 6 },        // 거대한 적 시간 +1초
];
const relicBonus = (st, stat) => { let b = 0; if (st.crypt) for (const r of RELICS) if (r.stat === stat) b += r.per * (st.crypt.relics[r.id] || 0); return b; };
const cryptHp = f => Math.pow(10, C.CRYPT.log0 + C.CRYPT.logStep * (f - 1));
const cryptPower = st => spellDamage(st, false) + dps(st) * (C.BOSS_TIME + relicBonus(st, 'time'));
const cryptDust = f => C.CRYPT.dust0 + C.CRYPT.dustPer * f;
const relicCost = lv => Math.ceil(C.CRYPT.costBase * Math.pow(C.CRYPT.costGrow, lv - 1));
function cryptFight(st) {   // 다음 층 도전. 힘이 모자라면 열쇠를 쓰지 않음(벌 없음)
  const c = st.crypt; if (!unlocked(st, 'crypt')) return { ok: false, why: 'lock' }; if (c.keys < 1) return { ok: false, why: 'key' };
  const f = c.floor + 1, need = cryptHp(f), have = cryptPower(st);
  if (have < need) return { ok: false, why: 'weak', need, have, f };
  c.keys--; c.floor = f; const dust = cryptDust(f); c.dust += dust; st.gems += C.CRYPT.firstGems;
  const r = RELICS.find(x => x.floor === f); if (r && !c.relics[r.id]) c.relics[r.id] = 1;
  return { ok: true, f, dust, gems: C.CRYPT.firstGems, relic: r ? r.id : null };
}
function cryptSweep(st) {   // 깬 층 중 가장 깊은 층 보상을 바로(열쇠 1)
  const c = st.crypt; if (!c.floor || c.keys < 1) return null; c.keys--; const dust = cryptDust(c.floor); c.dust += dust; return { f: c.floor, dust };
}
function relicUp(st, id) { const c = st.crypt, lv = c.relics[id] || 0; if (!lv) return false; const cost = relicCost(lv); if (c.dust < cost) return false; c.dust -= cost; c.relics[id] = lv + 1; return true; }
function buyKey(st) { const c = st.crypt; if (c.bought >= C.CRYPT.keyBuyMax || st.gems < C.CRYPT.keyGems) return false; st.gems -= C.CRYPT.keyGems; c.bought++; c.keys++; return true; }

// ───────── 마법 연구: 실제 시간이 흐름(자리를 비워도 진행). 끝나면 단계 +1, 덤은 영구 ─────────
const LAB = [
  { id: 'drill', stat: 'atk', per: 0.05 },     // 군단 훈련: 공격 +5%/단계
  { id: 'reap', stat: 'soul', per: 0.05 },     // 영혼 수확술: 영혼 +5%
  { id: 'focus', stat: 'spell', per: 0.06 },   // 대마법 증폭: +6%
  { id: 'chant', stat: 'cd', per: 0.03 },      // 빠른 영창: 대기 −
  { id: 'dream', stat: 'offline', per: 0.05 }, // 잠든 군단: 자리 비움 +5%
  { id: 'hunt', stat: 'time', per: 0.5 },      // 거인 사냥술: 거대한 적 시간 +0.5초
];
const labBonus = (st, stat) => { let b = 0; if (st.lab) for (const r of LAB) if (r.stat === stat) b += r.per * (st.lab.lv[r.id] || 0); return b; };
const labMins = lv => Math.round(C.LAB.min0 * Math.pow(C.LAB.minGrow, lv));
const labBones = lv => Math.ceil(C.LAB.bone0 * Math.pow(C.LAB.boneGrow, lv));
function labStart(st, id, now) {
  const L = st.lab; if (!unlocked(st, 'lab')) return { ok: false, why: 'lock' }; if (L.cur) return { ok: false, why: 'busy' };
  const lv = L.lv[id] || 0, cost = labBones(lv); if (st.bones < cost) return { ok: false, why: 'bones', cost };
  st.bones -= cost; L.cur = { id, end: now + labMins(lv) * 60000 }; return { ok: true, id, mins: labMins(lv) };
}
function labCheck(st, now) { const L = st.lab; if (!L || !L.cur || now < L.cur.end) return null; const id = L.cur.id; L.lv[id] = (L.lv[id] || 0) + 1; L.cur = null; return { id, lv: L.lv[id] }; }
const labLeft = (st, now) => st.lab && st.lab.cur ? Math.max(0, st.lab.cur.end - now) : 0;
const labGems = (st, now) => Math.max(1, Math.ceil(labLeft(st, now) / 60000 * C.LAB.gemPerMin));
function labRush(st, now) { if (!st.lab.cur) return null; const g = labGems(st, now); if (st.gems < g) return null; st.gems -= g; st.lab.cur.end = now; const r = labCheck(st, now); return r && Object.assign(r, { gems: g }); }
function labAd(st, now) { const L = st.lab; if (!L.cur || L.adUsed >= C.LAB.adMax) return false; L.adUsed++; L.cur.end -= C.LAB.adMin * 60000; return true; }

// ───────── 침공 지도: 왕국마다 9칸(땅 8 + 가운데 왕도). 왕도는 나머지 8칸을 먹어야 열림 ─────────
const MAP_TILES = 9, MAP_CAP = 4;   // 3×3 중 가운데(4번)가 왕도
const mapNeed = n => C.MAP.need0 + C.MAP.needStep * n;   // n = 지금까지 먹은 칸 수(왕국을 넘어 이어짐)
function mapCanTake(st, i) { const m = st.map; if (m.owned[i]) return 'own'; if (i === MAP_CAP && m.owned.filter(Boolean).length < MAP_TILES - 1) return 'cap'; if (m.tokens < 1) return 'token'; if ((st.peak || st.best) < mapNeed(m.taken)) return 'weak'; return 'ok'; }
function mapTake(st, i) {
  const why = mapCanTake(st, i); if (why !== 'ok') return { ok: false, why, need: mapNeed(st.map.taken) };
  const m = st.map; m.tokens--; m.owned[i] = 1; m.taken++; st.gems += C.MAP.gems; st.bones += C.MAP.bones;
  const r = { ok: true, i, gems: C.MAP.gems, bones: C.MAP.bones, kingdom: m.kingdom, done: false };
  if (m.owned.every(Boolean)) { r.done = true; st.gems += C.MAP.kingdomGems; r.gems += C.MAP.kingdomGems; m.kingdom++; m.owned = Array(MAP_TILES).fill(0); }
  return r;
}

const weaponCost = w => C.WEAPON.bone0 + C.WEAPON.boneStep * w;
function weaponUp(st, id) {   /* 결과: ok · max · stone(전설 강화석 필요) · bones · none */
  const o = st.heroes[id]; if (!o) return 'none'; const w = o.wp || 0; if (w >= C.WEAPON.max) return 'max';
  if (w >= C.WEAPON.freeMax) { if ((st.wpStone || 0) < 1) return 'stone'; st.wpStone--; } else { const c = weaponCost(w); if (st.bones < c) return 'bones'; st.bones -= c; }
  o.wp = w + 1; return 'ok';
}
const skinOwned = (st, sid) => !!((st.skins && st.skins[sid]) || (C.SKINS[sid] && vipLv(st) >= C.SKINS[sid].vip));
function wearSkin(st, hid, sid) { st.wear = st.wear || {}; if (!sid) { delete st.wear[hid]; return true; } const k = C.SKINS[sid]; if (!k || k.hero !== hid || !skinOwned(st, sid)) return false; st.wear[hid] = sid; return true; }
const skinMul = (st, hid) => { const sid = st.wear && st.wear[hid]; return sid && C.SKINS[sid] && skinOwned(st, sid) ? 1 + C.SKINS[sid].mul : 1; };
const vipItem = (st, stat) => { const v = vipLv(st); let b = 0; for (const k in C.VIP_ITEMS) { const it = C.VIP_ITEMS[k]; if (v >= it.vip && it[stat]) b += it[stat]; } return b; };
function vipLv(st) { const n = C.VIP.need; let i = 0; while (i + 1 < n.length && (st.vipExp || 0) >= n[i + 1]) i++; return i; }
function addVip(st, n) { const a = vipLv(st); st.vipExp = (st.vipExp || 0) + n; return vipLv(st) > a; }
function heroBonus(st, stat) {
  let b = stat === 'atk' ? C.VIP.atk[vipLv(st)] : 0;
  for (const id of st.squad) { if (!id) continue; const h = heroById(id), o = st.heroes[id]; if (o && h.stat === stat) b += RARITY[h.rarity].bonus * starMul(o) * (1 + C.WEAPON.mul * (o.wp || 0)) * skinMul(st, id); }
  for (const x of bondsOn(st)) if (x.stat === stat) b += x.bonus;
  return b + gearBonus(st, stat) + (stat === 'atk' ? lskinBonus(st) : 0) + relicBonus(st, stat) + labBonus(st, stat) + (stat === 'soul' && st.map ? C.MAP.soul * st.map.taken : 0);
}
const sigilMul = st => 1 + C.SIGIL_MUL * st.sigils;
const armyCap = st => C.ARMY_CAP[Math.min(st.awakens, C.ARMY_CAP.length - 1)];
const armySize = st => Math.min(armyCap(st), 1 + st.raised + C.ARMY_PER_SUMMON * st.up.summon);
const unitAtk = st => Math.pow(C.BONE_MUL, st.up.bone);   // 뼈 갈기 1단계마다 ×1.12 (곱으로 쌓여 꾸준히 강해짐)
const graveMul = st => 1 + st.grave.reduce((a, g) => a + (g >= 0 ? GRADE_POWER[g] : 0), 0);
/* 00:10 「군단 힘 한눈에」(장르 공식 전투력 상세): 공격이 어디서 몇 배 오는지. 곱하는 것 · 더하는 것 따로 */
function powerParts(st) {
  const sq = st.squad.reduce((b, id) => { if (!id) return b; const h = heroById(id), o = st.heroes[id]; return o && h.stat === 'atk' ? b + RARITY[h.rarity].bonus * starMul(o) * (1 + C.WEAPON.mul * (o.wp || 0)) * skinMul(st, id) : b; }, 0);
  const bd = bondsOn(st).filter(x => x.stat === 'atk').reduce((a, x) => a + x.bonus, 0);
  const mul = [['summon', armySize(st)], ['bone', unitAtk(st)], ['grave', graveMul(st)], ['evo', evoMul(st)], ['dex', dexMul(st)], ['sigil', sigilMul(st)], ['train', 1 + C.TRAIN.atk * ((st.train && st.train.lv) || 0)], ['vipItem', 1 + vipItem(st, 'atk')]];
  const add = [['hero', sq], ['bond', bd], ['gear', gearBonus(st, 'atk')], ['lskin', lskinBonus(st)], ['relic', relicBonus(st, 'atk')], ['lab', labBonus(st, 'atk')], ['vip', C.VIP.atk[vipLv(st)]]];
  return { mul, add, addSum: add.reduce((a, x) => a + x[1], 0), total: dps(st) };
}
function dps(st) {
  return (1 + C.TRAIN.atk * ((st.train && st.train.lv) || 0)) * (1 + vipItem(st, 'atk')) * armySize(st) * unitAtk(st) * graveMul(st) * evoMul(st) * dexMul(st) * (1 + heroBonus(st, 'atk')) * sigilMul(st) * (st.tide > 0 ? SPELLS.tide.mul : 1) * ((st.frozen || 0) > 0 ? SPELLS.frozen.mul : 1) * (1 + C.MORALE_MAX * (st.morale || 0)) * guildMul(st) * keepMul(st);
}
const spellMul = st => { const m = st.up.magic, k = C.MAGIC_SOFT; const base = m <= k ? Math.pow(C.MAGIC_MUL, m) : Math.pow(C.MAGIC_MUL, k) * (C.MAGIC_LIN > 0 ? 1 + C.MAGIC_LIN * (m - k) : Math.pow(C.MAGIC_MUL2, m - k)); return base * (1 + heroBonus(st, 'spell')) * (1 + vipItem(st, 'spell')) * chantMul(st); };   /* 마력 강화가 MAGIC_SOFT단계를 넘으면 덜 커짐(늦은 판 힘 쏠림 막기 시험용, 기본은 꺼짐) */
const spellDamage = (st, perfect) => dps(st) * C.SPELL_X * spellMul(st) * (perfect ? C.PERFECT_MUL : 1);
const spellCd = st => C.SPELL_CD / (1 + heroBonus(st, 'cd')) * (1 - vipItem(st, 'cd'));
const soulMul = st => (1 + C.TRAIN.soul * ((st.train && st.train.lv) || 0)) * Math.pow(C.HARVEST_MUL, st.up.harvest) * (1 + heroBonus(st, 'soul')) * (1 + 0.15 * st.sigils);
const awakenStage = st => st.awakens === 0 && C.AWAKEN_FIRST ? C.AWAKEN_FIRST : C.AWAKEN_STAGE + C.AWAKEN_STEP * st.awakens + Math.round((C.AWAKEN_SQ || 0) * st.awakens * st.awakens);
const sigilsFor = (best, need) => best < need ? 0 : Math.floor((C.SIGIL_BASE + C.SIGIL_PER * (best - need)) * Math.pow(C.SIGIL_EXP || 1, Math.max(0, best - (C.SIGIL_EXP_FROM || 20))));   /* 11-14 21:45 깊이 갈수록 표식이 곱으로 늘어 ~100판 벽(5시간 정체)을 풂 */
const rankOf = st => Math.min(RANKS - 1, st.awakens);

// ───────── 상태 ─────────
function newState() {
  const st = {
    v: 2, stage: 1, best: 1, wave: 0, souls: 0, gems: 0, bones: 0,
    vipExp: 0, raised: 0, up: { summon: 0, bone: 0, magic: 0, harvest: 0 },
    grave: CLASSES.map(() => -1), altar: 0, altarUntil: 0, graveCount: 0,
    heroes: {}, squad: [null, null, null], pity: 0, pulls: 0,
    evo: [0, 0, 0, 0, 0], evoXp: 0, sigils: 0, awakens: 0, spell: 'sun', spellReady: 0, tide: 0, frozen: 0, casts: 0,
    hp: 0, maxHp: 0, boss: null, retreat: false, bossCleared: {},
    kills: 0, time: 0, lastSeen: Date.now(),
    missions: MISSIONS.map(() => 0), missionDone: MISSIONS.map(() => false), day: 0,
    seen: {}, // 처음 본 것(연출·안내 한 번만)
    lab: { cur: null, lv: {}, adUsed: 0 },
    map: { tokens: C.MAP.tokens, kingdom: 0, owned: Array(9).fill(0), taken: 0 }, daysPlayed: 0, peak: 1,
    crypt: { open: false, keys: C.CRYPT.keys, bought: 0, floor: 0, dust: 0, relics: {} },
    morale: 0, quickUsed: 0, speedUntil: 0, autoUp: false, settings: { sound: true, bgm: true, shortCast: false, calm: false, anime: false },
  };
  startWave(st); return st;
}
function startWave(st) {
  st.waveT = 0;
  const first = C.FIRST_GIANT && st.stage === C.FIRST_GIANT && !st.bossCleared[C.FIRST_GIANT] && !(st.awakens > 0);
  if ((isBoss(st.stage) || first) && st.wave === 0) {
    st.maxHp = st.hp = waveHp(st.stage) * (st.stage <= C.BOSS_EARLY_UNTIL ? C.BOSS_EARLY_MUL : C.BOSS_HP_MUL) * ((C.BOSS_STAGE_MUL || {})[st.stage] || 1);
    if (bossTraits(st.stage).length) st.maxHp = st.hp = st.maxHp * C.TRAIT_HP;   // 특징 보스는 체력 ×1.3: 추천 진형(보통 ×1.2~1.6)이면 예전과 비슷, 아무렇게나면 더 어려움
    st.boss = { phase: 'arrive', t: 0, timer: C.BOSS_TIME + relicBonus(st, 'time') + vipItem(st, 'time'), lord: isLord(st.stage) };
  } else { st.maxHp = st.hp = waveHp(st.stage); st.boss = null; }
}
function mission(st, id, n = 1) {
  if (!unlocked(st, 'mission')) return;
  const i = MISSIONS.findIndex(m => m.id === id); if (i < 0) return;
  st.missions[i] = Math.min(MISSIONS[i].need, st.missions[i] + n);
}

// 한 번 움직이기. 일어난 일(이벤트)을 돌려줌 → 화면·소리가 받아서 연출
function tick(st, dt) {
  const ev = [];
  st.time += dt; st.morale = Math.min(1, (st.morale || 0) + dt / C.MORALE_SECS);
  if (st.spellReady > 0) st.spellReady = Math.max(0, st.spellReady - dt);
  if (st.tide > 0) st.tide = Math.max(0, st.tide - dt);
  if (st.frozen > 0) st.frozen = Math.max(0, st.frozen - dt);
  const b = st.boss;
  if (b) {
    b.t += dt;
    if (b.phase === 'arrive') { if (b.t > 1.6) { b.phase = 'wait'; b.t = 0; ev.push({ e: 'bossWait', lord: b.lord }); } return ev; }
    if (b.phase === 'wait') {
      if (st.spellReady > 0) { b.phase = 'fight'; b.t = 0; }   // 대마법이 아직이면 군단만으로
      else if (unlocked(st, 'autoCast') && st.autoCast) { b.phase = 'cast'; ev.push({ e: 'autoCast' }); }
      return ev;
    }
    if (b.phase === 'cast') return ev;   // 연출 중
    if (b.phase === 'fight') {
      st.hp -= dps(st) * matchMul(st) * dt; if (!(st.frozen > 0)) b.timer -= dt;   // 보스는 수하 조합 상성만큼
      if (st.hp <= 0) { bossDown(st, ev); return ev; }
      if (b.timer <= 0) {   // 실패 → 한 판 물러남, 벌 없음
        st.stage = Math.max(1, st.stage - 1); st.wave = 0; st.retreat = true; st.boss = null; startWave(st);
        ev.push({ e: 'retreat' });
      }
    }
    return ev;
  }
  st.hp -= dps(st) * dt * (st.guard > 0 ? 0.5 : 1) * (st.chill > 0 ? 0.7 : 1);   /* 11-14 지역 정예: 성기사 방패(피해 절반) · 서리술사(군단 느려짐) */
  st.waveT = (st.waveT || 0) + dt;
  if (st.waveT > C.WAVE_LIMIT && st.stage > 1 && st.hp > 0) {   // 밀림: 벌 없이 한 판 물러나 힘을 기르다 3바퀴 뒤 다시 진격
    st.stage--; st.wave = 0; st.retreat = true; st.retreatLoops = 0; startWave(st); ev.push({ e: 'pushed' }); return ev;
  }
  let guard = 0;
  while (st.hp <= 0 && guard++ < 50) {
    const over = -st.hp, g = waveSouls(st.stage) * soulMul(st) * (st.awakens ? 1 : Math.max(1, C.EARLY_SOUL.start - st.stage * C.EARLY_SOUL.step));   /* 19:18 직접 플레이: 1분~2분 사이 살 게 없어 멍하니 봄(「딱딱하다」) → 첫 각성 전 1~15판 영혼을 2.1배→1배로 서서히 */
    st.souls += g; st.kills++; mission(st, 'waves'); ev.push({ e: 'waveDown', souls: g }); evoGain(st, 1, ev); riseFoe(st, ev); gearDrop(st, ev, false);
    st.wave++;
    if (st.wave >= C.WAVES) {
      st.wave = 0; st.bones += C.BONE_PER_STAGE + (unlocked(st, 'gear') ? 1 : 0); { const S2 = shopOf(st); S2.piggy = Math.min(PIGGY.cap, (S2.piggy || 0) + PIGGY.perStage); }   /* 03:40 마정석 저금통: 판마다 쌓임 */   /* 01:30 제단용으로 판마다 뼛조각 +1(02:15 +2는 봇이 7분에 각성 2번 = 너무 빠름) */
      if (st.retreat) {   // 물러난 동안은 같은 판을 돌며 키우다가 3바퀴 뒤 다시 도전(보스든 보통 판이든)
        st.retreatLoops = (st.retreatLoops || 0) + 1;
        if (st.retreatLoops >= 3) { st.retreatLoops = 0; retryBoss(st); ev.push({ e: 'retry' }); if (st.boss) { ev.push({ e: 'bossArrive', lord: st.boss.lord }); break; } } else startWave(st);
      }
      else { st.stage++; ev.push({ e: 'stage', stage: st.stage }); startWave(st); if (st.boss) { ev.push({ e: 'bossArrive', lord: st.boss.lord }); break; } }
    } else startWave(st);
    st.hp -= over;
  }
  if (st.stage > st.best) { st.best = st.stage; ev.push({ e: 'best', stage: st.best }); }
  if (st.crypt && !st.crypt.open && st.best >= C.CRYPT.unlock) { st.crypt.open = true; if ((st.daysPlayed || 0) < C.CRYPT.day) ev.push({ e: 'cryptSoon' }); }
  if (st.best > (st.peak || 0)) st.peak = st.best;
  if (st.best >= C.UNLOCK.hero && !st.heroes[FIRST_HERO]) { firstHero(st); ev.push({ e: 'firstHero', id: FIRST_HERO }); }
  return ev;
}
/* 쫄따구 진화: 진화 경험이 차면 보통 해골 하나가 1단계로, 같은 단계 3마리는 자동으로 합체 */
function evoGain(st, n, ev) {
  if (armySize(st) < C.EVO.minArmy) return;
  st.evo = st.evo || [0, 0, 0, 0, 0]; st.evoXp = (st.evoXp || 0) + n;
  while (st.evoXp >= C.EVO.waves) {
    st.evoXp -= C.EVO.waves; st.evo[1]++; ev.push({ e: 'evo', lv: 1 });
    for (let L = 1; L < C.EVO.max; L++) while (st.evo[L] >= 3) { st.evo[L] -= 3; st.evo[L + 1]++; ev.push({ e: 'merge', lv: L + 1 }); }
  }
}
/* 광고 보고 바로 진화: 하루 5번, 한 번에 진화 3마리 몫 */
function evoAd(st) { if (armySize(st) < C.EVO.minArmy || (st.evoAd || 0) >= C.EVO.adMax) return null; st.evoAd = (st.evoAd || 0) + 1; const ev = []; evoGain(st, C.EVO.waves * C.EVO.adN - (st.evoXp || 0), ev); return ev; }
/* 부활(망자 도감): 깬 적과 지역의 주인이 내 편으로 — 지역은 10판마다 바뀌는 8곳 */
const regionIdx = s => Math.floor((Math.max(1, s) - 1) / 10) % C.RISE.regions;
const dexOf = st => (st.dex = st.dex || { k: new Array(C.RISE.regions).fill(0), f: new Array(C.RISE.regions).fill(false), l: new Array(C.RISE.regions).fill(false), lt: new Array(C.RISE.regions).fill(0) });
function riseFoe(st, ev) { const d = dexOf(st), r = regionIdx(st.stage); d.k[r]++; if (!d.f[r] && d.k[r] >= C.RISE.foe) { d.f[r] = true; ev.push({ e: 'riseFoe', r }); } }
function riseLord(st, ev, stage, rnd = Math.random) { if (!isLord(stage)) return; const d = dexOf(st), r = regionIdx(stage); if (d.l[r]) return; d.lt[r]++; if (rnd() < C.RISE.lordP || d.lt[r] >= C.RISE.lordPity) { d.l[r] = true; ev.push({ e: 'riseLord', r }); } }
const dexMul = st => { const d = st.dex; if (!d) return 1; return 1 + C.RISE.foeMul * d.f.filter(Boolean).length + C.RISE.lordMul * d.l.filter(Boolean).length; };
const evoMul = st => { const e = st.evo || []; let m = 1; for (let L = 1; L <= C.EVO.max; L++) m += (e[L] || 0) * C.EVO.bonus[L]; return m; };
function bossDown(st, ev) {
  const g = waveSouls(st.stage) * 10 * soulMul(st);
  st.souls += g; st.bones += C.BONE_BOSS;
  let gems = 0; if (!st.bossCleared[st.stage]) { st.bossCleared[st.stage] = 1; gems = C.GEM_BOSS_FIRST; st.gems += gems; }
  ev.push({ e: 'bossDown', souls: g, gems, stage: st.stage, lord: st.boss && st.boss.lord }); gearDrop(st, ev, true); evoGain(st, C.EVO.waves * C.EVO.boss, ev); riseLord(st, ev, st.stage);
  st.boss = null; st.retreat = false; st.stage++; st.wave = 0; startWave(st);
  if (st.stage > st.best) { st.best = st.stage; ev.push({ e: 'best', stage: st.best }); }
  ev.push({ e: 'stage', stage: st.stage });
}
function retryBoss(st) { if (st.retreat) { st.retreat = false; st.retreatLoops = 0; st.stage++; st.wave = 0; startWave(st); return true; } return false; }

// ───────── 대마법 ─────────
const canCast = st => !!(st.boss && st.boss.phase === 'wait' && st.spellReady <= 0);
function beginCast(st) { if (!canCast(st)) return false; st.boss.phase = 'cast'; return true; }
// 연출이 끝나 발동하는 순간 부름. perfect = 타이밍을 맞췄는지
// 마력 강화(spellMul)는 모든 대마법 피해에 붙음(11-13 11:10 고침: 전에는 검은 태양·종에만 붙어서, 다른 대마법은 늦은 판에 약했음)
function landSpell(st, perfect) {
  const ev = []; st.casts++; mission(st, 'cast'); st.spellReady = spellCd(st);
  const p = !!perfect && unlocked(st, 'timing');
  if (st.spell === 'tide') { st.tide = SPELLS.tide.dur; ev.push({ e: 'tide', perfect: p }); const dmg = dps(st) * 4 * spellMul(st) * (p ? C.PERFECT_MUL : 1); st.hp -= dmg; ev.push({ e: 'spellHit', dmg, perfect: p }); }
  else if (st.spell === 'graves') { if (st.boss) st.boss.timer += SPELLS.graves.time; const dmg = dps(st) * SPELLS.graves.hit * spellMul(st) * (p ? C.PERFECT_MUL : 1); st.hp -= dmg; ev.push({ e: 'spellHit', dmg, perfect: p }); }
  else if (st.spell === 'frozen') { st.frozen = SPELLS.frozen.dur; const dmg = dps(st) * SPELLS.frozen.hit * spellMul(st) * (p ? C.PERFECT_MUL : 1); st.hp -= dmg; ev.push({ e: 'spellHit', dmg, perfect: p }); }
  else if (st.spell === 'bell') { const dmg = Math.max(0, st.hp) * SPELLS.bell.frac * (p ? C.PERFECT_MUL : 1) + spellDamage(st, p) * 0.3; st.hp -= dmg; ev.push({ e: 'spellHit', dmg, perfect: p }); }
  else { const dmg = spellDamage(st, p); st.hp -= dmg; ev.push({ e: 'spellHit', dmg, perfect: p }); }
  if (st.hp <= 0) bossDown(st, ev); else if (st.boss) { st.boss.phase = 'fight'; st.boss.t = 0; }
  return ev;
}
function spellUnlocked(st, id) { return st.awakens >= SPELLS[id].unlock; }

// ───────── 강화 ─────────
function buy(st, k) {
  if (!unlocked(st, k)) return false;
  const c = upCost(k, st.up[k]); if (st.souls < c) return false;
  st.souls -= c; st.up[k]++; mission(st, 'upgrade'); return true;
}
function raiseTap(st) { if (st.raised >= C.RAISE_TAPS) return false; st.raised++; return true; }

// ───────── 무덤 일으키기 ─────────
function altarTable(level) {   // 확률표 자동 생성
  const w = ALTAR[level].w, tw = w.reduce((a, b) => a + b, 0);
  return w.map(x => x / tw);
}
function raiseGrave(st, rnd = Math.random) {
  if (!unlocked(st, 'grave') || st.bones < 1) return null;
  st.bones--; st.graveCount++; mission(st, 'raise');
  const p = altarTable(st.altar); let x = rnd(), g = 0;
  for (; g < GRADES - 1; g++) { x -= p[g]; if (x < 0) break; }
  const cls = Math.floor(rnd() * CLASSES.length);
  return { cls, grade: g, better: g > st.grave[cls], cur: st.grave[cls] };
}
function keepGrave(st, r) { if (r && r.better) { st.grave[r.cls] = r.grade; return true; } return false; }
function scrapGrave(st, r) { const g = waveSouls(Math.max(1, st.best - 2)) * (1 + r.grade) * 2; st.souls += g; return g; }
function altarUp(st, now) {
  const nx = st.altar + 1; if (nx >= ALTAR.length || st.altarUntil) return false;
  if (st.souls < ALTAR[nx].cost) return false;
  st.souls -= ALTAR[nx].cost; st.altarUntil = now + ALTAR[nx].secs * 1000; return true;
}
// 제단 올리기 바로 끝내기(설계 「가속 가능」, 11-13 16:45): 마법 연구와 같은 값 — 마정석 1개 = 3분
const altarGems = (st, now) => st.altarUntil ? Math.max(1, Math.ceil((st.altarUntil - now) / 60000 * C.LAB.gemPerMin)) : 0;
function altarRush(st, now) { const g = altarGems(st, now); if (!g || st.gems < g) return null; st.gems -= g; st.altarUntil = now; altarTick(st, now); return { gems: g }; }
function adBones(st) { if ((st.adBones || 0) >= C.AD_BONES.max) return 0; st.adBones = (st.adBones || 0) + 1; st.bones += C.AD_BONES.n; return C.AD_BONES.n; }
function altarTick(st, now) { if (st.altarUntil && now >= st.altarUntil) { st.altar++; st.altarUntil = 0; return true; } return false; }

// ───────── 수하 계약(뽑기) ─────────
const heroById = id => HEROES.find(h => h.id === id);
function country(lang) { const m = /-([A-Za-z]{2})$/.exec(lang || ''); return m ? m[1].toUpperCase() : ''; }
const gachaAllowed = cc => !C.GACHA_BLOCKED_COUNTRIES.includes(cc);
function probTable() {
  const tw = Object.values(RARITY).reduce((a, r) => a + r.weight, 0);
  return Object.entries(RARITY).map(([k, r]) => { const pool = HEROES.filter(h => h.rarity === k), p = r.weight / tw; return { rarity: k, p, each: pool.map(h => ({ id: h.id, p: p / pool.length })) }; });
}
function grant(st, id) {
  const o = st.heroes[id]; let isNew = false, maxed = false;
  if (!o) { st.heroes[id] = { lv: 1 }; isNew = true; const free = st.squad.indexOf(null); if (free >= 0) st.squad[free] = id; }
  else if (o.lv < HERO_MAX_LV) o.lv++; else if ((o.shards || 0) < C.STAR.shardMax) { o.shards = (o.shards || 0) + 1; } else { maxed = true; st.gems += 10; }
  return { id, isNew, lv: st.heroes[id].lv, star: heroStar(st.heroes[id]), shard: !isNew && o && o.lv >= HERO_MAX_LV && !maxed, maxed };
}
function firstHero(st) { if (st.heroes[FIRST_HERO]) return null; return grant(st, FIRST_HERO); }
function rollOne(st, rnd, minR) {
  st.pity++; st.pulls++; let rar;
  if (st.pity >= C.PITY) rar = 'SSR';
  else { const order = ['N', 'R', 'SR', 'SSR'], cand = order.slice(minR ? order.indexOf(minR) : 0), tw = cand.reduce((a, k) => a + RARITY[k].weight, 0); let x = rnd() * tw; rar = cand[cand.length - 1]; for (const k of cand) { x -= RARITY[k].weight; if (x < 0) { rar = k; break; } } }
  if (rar === 'SSR') st.pity = 0;
  const pool = HEROES.filter(h => h.rarity === rar);
  return grant(st, pool[Math.floor(rnd() * pool.length)].id);
}
function pull(st, n, rnd = Math.random) {
  const free = n === 10 && (st.free10 || 0) > 0, cost = free ? 0 : n === 10 ? C.GACHA10_COST : C.GACHA_COST * n; if (st.gems < cost) return null;
  if (free) st.free10--; st.gems -= cost; mission(st, 'contract', n); const res = [];
  for (let i = 0; i < n; i++) res.push(rollOne(st, rnd, n === 10 && i === 9 && !res.some(r => ['SR', 'SSR'].includes(heroById(r.id).rarity)) ? 'SR' : null));
  return res;
}
function directBuy(st, id) { const c = C.DIRECT_PRICE[heroById(id).rarity]; if (st.gems < c) return null; st.gems -= c; mission(st, 'contract'); return grant(st, id); }
function setSquad(st, slot, id) { const i = st.squad.indexOf(id); if (i >= 0) st.squad[i] = st.squad[slot]; st.squad[slot] = id; }

// ───────── 각성 ─────────
const canAwaken = st => st.best >= awakenStage(st);
function awaken(st) {
  if (!canAwaken(st)) return null;
  const gain = sigilsFor(st.best, awakenStage(st)); st.sigils += gain; st.awakens++; st.gems += C.GEM_AWAKEN;
  Object.assign(st, { stage: 1, best: 1, wave: 0, souls: 0, retreat: false, tide: 0, spellReady: 0, raised: C.RAISE_TAPS, up: { summon: 0, bone: 0, magic: 0, harvest: 0 }, evo: [0, 0, 0, 0, 0], evoXp: 0 });   // 진화한 쫄따구도 군단과 함께 처음부터
  startWave(st);
  return { gain, rank: rankOf(st), newSpell: Object.keys(SPELLS).find(k => SPELLS[k].unlock === st.awakens) || null };
}

// ───────── 일일 임무 ─────────
/* 11-15 장르 기본: 주간 임무(일일 임무를 받을 때마다 주간 활동 +1, 한 주 최대 35) → 5 · 12 · 20 · 28 · 35에 상자. 월요일에 새 주 */
const WEEK = { at: [5, 12, 20, 28, 35], gift: [{ gems: 50 }, { bones: 20 }, { gems: 100 }, { bones: 40 }, { gems: 300, bones: 60 }] };
function weekId(day) { if (day == null || day < 19000000) return 0; const y = Math.floor(day / 10000), m = Math.floor(day / 100) % 100, d = day % 100; return Math.floor((Date.UTC(y, m - 1, d) / 864e5 + 3) / 7); }   /* 1970-01-01은 목요일 → +3 하면 월요일 시작 */
function weekOf(st) { const id = weekId(st.day); if (!st.week || st.week.id !== id) st.week = { id, pts: 0, got: [] }; return st.week; }
function weekReady(st) { const w = weekOf(st); return WEEK.at.map((n, i) => w.pts >= n && !w.got.includes(i)); }
function weekClaim(st, i) { const w = weekOf(st); if (!(w.pts >= WEEK.at[i]) || w.got.includes(i)) return null; w.got.push(i); const g = WEEK.gift[i]; st.gems += g.gems || 0; st.bones += g.bones || 0; return g; }
function claimMission(st, i) { if (st.missionDone[i] || st.missions[i] < MISSIONS[i].need) return null; st.missionDone[i] = true; weekOf(st).pts = Math.min(WEEK.at[WEEK.at.length - 1], weekOf(st).pts + 1); st.gems += MISSIONS[i].gems; st.bones += MISSIONS[i].bones;
  const first = !st.seen.firstMission; if (first) { st.seen.firstMission = 1; st.free10 = (st.free10 || 0) + 1; }   // 설계 처음 30분 표 6:00 「첫 임무 보상으로 10연 계약」
  return Object.assign({}, MISSIONS[i], { free10: first }); }
function newDay(st, dayNo) { if (st.day === dayNo) return false; st.day = dayNo; st.quickUsed = 0; st.evoAd = 0; st.missions = MISSIONS.map(() => 0); st.missionDone = MISSIONS.map(() => false); if (st.crypt) { st.crypt.keys = Math.max(st.crypt.keys, C.CRYPT.keys); st.crypt.bought = 0; } st.daysPlayed = (st.daysPlayed || 0) + 1; { const v = vipLv(st); st.gems += C.VIP.gems[v]; if (st.crypt) st.crypt.keys += C.VIP.key[v]; }   /* 귀빈 매일 보상 */ st.adBones = 0; if (st.lab) st.lab.adUsed = 0; if (st.map) st.map.tokens = Math.max(st.map.tokens, C.MAP.tokens); squadFit(st); return true; }
function squadFit(st) { const n = unlocked(st, 'squad4') ? 4 : SQUAD; while (st.squad.length < n) st.squad.push(null); }   /* 진형 칸 수를 날짜에 맞춤(넷째 칸) */

// ───────── 자리 비움 ─────────
const trainNeed = lv => C.TRAIN.min0 * (1 + C.TRAIN.grow * lv) * 60000;   /* 다음 단계까지 걸리는 시간(밀리초) */
function trainTick(st, now) {   /* 흐른 시간만큼 수련 단계를 올림(여러 단계 한꺼번에도). 올린 단계 수를 돌려줌 */
  if (!st.train) st.train = { lv: 0, t0: now }; let n = 0;
  while (now - st.train.t0 >= trainNeed(st.train.lv) && n < 500) { st.train.t0 += trainNeed(st.train.lv); st.train.lv++; n++; }
  return n;
}
const trainLeft = (st, now) => st.train ? Math.max(0, trainNeed(st.train.lv) - (now - st.train.t0)) : 0;
function offlineGain(st, secs) {
  const s = Math.min(secs, C.OFFLINE_CAP_H * 3600); if (s < 60) return null;   /* 11-14 대표님 「방치로 얻는 건 같아야지」: 귀빈이어도 자리 비움 시간 · 효율은 모두 같음 */
  const farm = Math.max(1, st.stage - (isBoss(st.stage) ? 1 : 0));
  const perSec = waveSouls(farm) * soulMul(st) * Math.min(1, dps(st) / waveHp(farm)) / C.WAVES;
  const eff = C.OFFLINE_EFF * (1 + heroBonus(st, 'offline'));
  const evoN = armySize(st) >= C.EVO.minArmy ? Math.min(C.EVO.offMax, Math.floor(s / C.EVO.offSec)) : 0;   /* 자리 비운 동안에도 쫄따구가 스스로 진화(2분에 1마리, 30마리까지) — 돌아올 이유 */
  const hrs = s / 3600, chest = hrs >= 8 ? 3 : hrs >= 4 ? 2 : hrs >= 1 ? 1 : 0, CB = C.OFF_CHEST[chest];   /* 11-14 대표님 「방치하면 확실히 재화든 재료든 이득」: 시간마다 마정석 + 오래 비울수록 상자 등급(모두 같음, 과금 덤 없음) */
  return { secs: s, souls: perSec * s * eff * (1 + CB.soul), bones: Math.floor(s / 600 * eff) + CB.bones, gems: Math.floor(hrs * C.OFF_GEM_H) + CB.gems, chest, capH: C.OFFLINE_CAP_H, evoN };
}
/* 11-15 장르 기본: 오래 안 왔다 돌아온 사람 보상 — 3일 넘게 비우면 한 번(7일에 한 번까지), 7일 넘으면 더 크게 */
function backGift(st, secs, now) { if (secs < 3 * 86400 || (st.backGot && now - st.backGot < 7 * 864e5)) return null; const big = secs >= 7 * 86400, g = { gems: big ? 500 : 300, bones: big ? 120 : 60, days: Math.floor(secs / 86400) }; st.gems += g.gems; st.bones += g.bones; st.backGot = now; return g; }
function applyOffline(st, g) { if (!g) return; st.souls += g.souls; st.bones += g.bones; st.gems += g.gems || 0; if (g.evoN) { const ev = []; evoGain(st, g.evoN * C.EVO.waves, ev); g.merges = ev.filter(e => e.e === 'merge').length; } }


// ───────── 시간과 돈 (대표님 기준: 무료는 시간을, 지친 사람은 돈을 쓴다) ─────────
function quickCost(st) { const fr = C.QUICK_FREE + (vipLv(st) >= 1 ? 1 : 0) + (st.shop2 && st.shop2.gemUntil > (st.nowMs || Date.now()) ? 1 : 0);   /* 11-15 과금흉내: 소과금(월정액) 체감이 약함 → 빠른 보상 하루 1번 더(자리 비움 수입은 모두 같게 그대로) */ return st.quickUsed < fr ? 0 : C.QUICK_GEMS[Math.min(C.QUICK_GEMS.length - 1, st.quickUsed - fr)]; }   /* 귀빈 1: 무료 1번 더 */
/* 23:40 전리품 상자(AFK 아레나처럼 첫 화면에서 쌓이는 게 보임 → 하루 몇 번 들어올 이유). 켜 있든 꺼져 있든 쌓이고 8시간에서 멈춤. 영혼은 30%만(자리 비움 보상과 겹치니) */
const LCHEST = { cap: 8, soulEff: 0.3, gemH: 2, boneSec: 1200, gearH: 4, gearP: 0.4 };
function lchestInfo(st, now) { if (!st.lchestT) st.lchestT = now; const cap = LCHEST.cap + 0.5 * keepLv(st, 'vault'), secs = Math.min(cap * 3600, Math.max(0, (now - st.lchestT) / 1000)), h = secs / 3600;
  const farm = Math.max(1, st.stage - (isBoss(st.stage) ? 1 : 0)), perSec = waveSouls(farm) * soulMul(st) * Math.min(1, dps(st) / waveHp(farm)) / C.WAVES;
  return { secs, h, souls: perSec * secs * (LCHEST.soulEff + 0.05 * keepLv(st, 'well')), gems: Math.floor(h * LCHEST.gemH), bones: Math.floor(secs / LCHEST.boneSec * (1 + 0.15 * keepLv(st, 'works'))), full: h >= cap, cap, gear: h >= LCHEST.gearH && unlocked(st, 'gear') }; }
function lchestClaim(st, now, rnd) { const g = lchestInfo(st, now); if (g.secs < 300) return null;   /* 02:20 바로 열면 「영혼 0.6 · 마정석 0」 → 5분은 쌓여야 */ st.souls += g.souls; st.gems += g.gems; st.bones += g.bones; st.lchestT = now; g.ev = [];
  if (g.gear && (rnd || Math.random)() < LCHEST.gearP) { const r = gearTake(st, gearRoll(st, GEAR.w, st.best, true)); g.ev.push(Object.assign({ e: 'gear', boss: false }, r)); } return g; }
function quickReward(st) {   // N시간치 영혼·뼛조각을 바로(효율 100%)
  const cost = quickCost(st); if (st.gems < cost) return null;
  st.gems -= cost; st.quickUsed++;
  const farm = Math.max(1, st.stage - (isBoss(st.stage) ? 1 : 0)), secs = C.QUICK_HOURS * 3600;
  const perSec = waveSouls(farm) * soulMul(st) * Math.min(1, dps(st) / waveHp(farm)) / C.WAVES;
  const g = { secs, souls: perSec * secs, bones: Math.floor(secs / 600), cost }; st.souls += g.souls; st.bones += g.bones; return g;
}
function speedMul(st, now) { return now < (st.speedUntil || 0) ? 2 : 1; }
function adSpeed(st, now) { st.speedUntil = Math.max(now, st.speedUntil || 0) + C.SPEED_AD_MIN * 60000; return st.speedUntil; }
const autoUpOpen = st => st.awakens >= C.AUTO_UP_AWAKEN;
function autoUpgrade(st) {   // 자동 강화: 열린 것 중 가장 싼 것부터 살 수 있는 만큼
  if (!st.autoUp || !autoUpOpen(st)) return 0; let n = 0;
  for (let guard = 0; guard < 50; guard++) { const ks = Object.keys(UPGRADES).filter(k => unlocked(st, k)).sort((a, b) => upCost(a, st.up[a]) - upCost(b, st.up[b])); if (!ks.length || !buy(st, ks[0])) break; n++; }
  return n;
}
function treasure(st, rnd = Math.random) {   // 떠도는 보물 기사를 눌렀을 때
  const r = (a, b) => Math.round(a + rnd() * (b - a));
  const g = { gems: r(...C.TREASURE_GEMS), bones: r(...C.TREASURE_BONES) }; st.gems += g.gems; st.bones += g.bones; return g;
}

// ───────── 저장 ─────────
function serialize(st) { st.lastSeen = Date.now(); return JSON.stringify(st); }
function deserialize(txt) {
  try {
    const o = JSON.parse(txt); if (!o || o.v !== 2) return null;
    const d = newState(); Object.assign(d, o); d.up = Object.assign(newState().up, o.up); d.crypt = Object.assign(newState().crypt, o.crypt || {}); d.crypt.relics = Object.assign({}, (o.crypt && o.crypt.relics) || {}); d.map = Object.assign(newState().map, o.map || {}); d.lab = Object.assign(newState().lab, o.lab || {}); d.lab.lv = Object.assign({}, (o.lab && o.lab.lv) || {}); d.peak = Math.max(d.peak || 1, d.best); squadFit(d);
    for (const id in (d.heroes || {})) { const h = d.heroes[id]; if (h && h.lv > HERO_MAX_LV) { h.shards = Math.min(C.STAR.shardMax, (h.shards || 0) + h.lv - HERO_MAX_LV); h.lv = HERO_MAX_LV; } }   /* 11-15 옛 레벨 7~10은 ★6 + 영혼 조각으로 */
    if (d.boss) { d.boss = null; d.wave = 0; startWave(d); }   // 거대한 적 도중이면 다시 등장부터
    d.morale = 0; d.settings = Object.assign(newState().settings, o.settings || {});   // 켜 둔 덤은 나가면 처음부터
    return d;
  } catch (e) { return null; }
}

/* 상점 뼈대(결제 없음, 11-13 대표님 판정): 값은 설계서 「매출 틀」 그대로, 정해지지 않은 값은 null */
/* 03:55 모험 던전 3개(대표님 「모험」): 하루 열쇠 2개씩, 이기면 단계 오름 · 이긴 단계는 「소탕」으로 바로. 보상은 단계가 오를수록 커짐 */
const DUNGEON = { keys: 2, adMax: 1, list: [{ id: 'soul', boss: 'foeA4' }, { id: 'bone', boss: 'foeA2' }, { id: 'gem', boss: 'foeA3' }] };
const dunOf = st => (st.dun = st.dun || { lv: { soul: 0, bone: 0, gem: 0 }, keys: { soul: DUNGEON.keys, bone: DUNGEON.keys, gem: DUNGEON.keys }, ad: { soul: 0, bone: 0, gem: 0 }, day: st.day });
function dunHp(id, L) { return waveHp(Math.max(1, L * 5)) * 5 * (id === 'gem' ? 1.4 : id === 'bone' ? 1.15 : 1); }   /* 단계 L ≈ L×5판 무리 · 15판에 열면 3단계까지 바로 이김 */
function dunReward(st, id, L) { return id === 'soul' ? { souls: waveSouls(Math.max(10, st.best || 1)) * 90 * soulMul(st) * (1 + 0.15 * L) }   /* 영혼은 지금 최고 판 수입 기준(단계 낮을 때 너무 적었음: 30분에 86) */ : id === 'bone' ? { bones: 5 + L * 2 } : { gems: 20 + L * 5 }; }
function dunPower(st) { return dps(st) * 30 * (1 + 0.3 * heroBonus(st, 'spell')); }
/* 05:58 봇 점검: 「도전 공짜」면 15분에 17단계 · 뼛조각의 95% · 마정석 절반이 던전에서 나와 각성이 6번 → 도전도 열쇠 1개(이길 때만 씀, 지면 그대로) · 하루 2개 + 광고 1개
   도전: 이기면 단계 오르고 그 단계 보상 / 소탕: 이긴 가장 높은 단계 보상을 싸움 없이 */
function dunFight(st, id, sweep) { const D = dunOf(st); if (D.keys[id] <= 0) return { noKey: true }; if (sweep && D.lv[id] < 1) return null;
  const L = sweep ? D.lv[id] : D.lv[id] + 1, hp = dunHp(id, L), pw = dunPower(st); if (!sweep && pw < hp) return { win: false, L, ratio: pw / hp };
  D.keys[id]--; if (!sweep) D.lv[id] = L; const r = dunReward(st, id, L); st.souls += r.souls || 0; st.bones += r.bones || 0; st.gems += r.gems || 0; return { win: true, L, r, sweep: !!sweep }; }
function dunAd(st, id) { const D = dunOf(st); if (D.ad[id] >= DUNGEON.adMax) return false; D.ad[id]++; D.keys[id]++; return true; }
function dunDay(st) { const D = dunOf(st); if (D.day !== st.day) { D.day = st.day; for (const k of Object.keys(D.keys)) { D.keys[k] = Math.max(D.keys[k], DUNGEON.keys); D.ad[k] = 0; } } }
/* 04:00 길드(대표님 「채팅 · 길드 기본」): 시험판은 혼자 도는 흉내(가상 길드원). 출시 땐 서버로 바꿈 — 작업기록 「출시 전」 참고
   가입 → 매일 출석(마정석 · 뼛조각) · 길드 보스 하루 3번(때릴수록 길드 경험 · 보상, 다 같이 잡으면 처치 보상) · 길드 레벨마다 공격 +2% */
const GUILD = { unlock: 25, hits: 3, check: { gems: 30, bones: 5, exp: 10 }, hit: { gems: 10, bones: 3, exp: 5 }, kill: { gems: 80, bones: 15 }, buff: 0.02, expNeed: lv => 40 + lv * 20,
  list: [{ id: 'g1', lv: 6, n: 27 }, { id: 'g2', lv: 3, n: 14 }, { id: 'g3', lv: 9, n: 30 }] };
const guildOf = st => st.guild && st.guild.id ? st.guild : null;
function guildJoin(st, id) { const g = GUILD.list.find(x => x.id === id); if (!g || guildOf(st)) return false; st.guild = { id, lv: g.lv, exp: 0, day: st.day, checked: 0, hits: 0, dmg: 0, killed: 0 }; return true; }
function guildDay(st) { const g = guildOf(st); if (g && g.day !== st.day) { g.day = st.day; g.checked = 0; g.hits = 0; g.dmg = 0; g.killed = 0; } }
function guildExp(st, n) { const g = guildOf(st); g.exp += n; let up = 0; while (g.exp >= GUILD.expNeed(g.lv)) { g.exp -= GUILD.expNeed(g.lv); g.lv++; up++; } return up; }
function guildCheck(st) { const g = guildOf(st); if (!g || g.checked) return null; g.checked = 1; const c = GUILD.check; st.gems += c.gems; st.bones += c.bones; return { gems: c.gems, bones: c.bones, up: guildExp(st, c.exp) }; }
/* 길드 보스: 보스 체력 = 내 힘 × 12 · 다른 길드원 몫은 하루 시간이 지날수록 차오름(최대 80%) · 내 한 번 = 내 힘 × (1~1.3) */
function guildBossPct(st, now) { const g = guildOf(st); if (!g) return 0; const d = new Date(now), hrs = d.getHours() + d.getMinutes() / 60, others = Math.min(0.8, 0.15 + hrs / 24 * 0.75); return Math.min(1, others + g.dmg); }
function guildHit(st, now) { const g = guildOf(st); if (!g || g.hits >= GUILD.hits) return null; g.hits++; const part = (1 + Math.random() * 0.3) / 12; g.dmg += part; const h = GUILD.hit; st.gems += h.gems; st.bones += h.bones; const r = { part, gems: h.gems, bones: h.bones, up: guildExp(st, h.exp) };
  if (!g.killed && guildBossPct(st, now) >= 1) { g.killed = 1; st.gems += GUILD.kill.gems; st.bones += GUILD.kill.bones; r.kill = GUILD.kill; } return r; }
const guildMul = st => { const g = guildOf(st); return g ? 1 + GUILD.buff * g.lv : 1; };
/* 04:25 성채(작업기록 순서 「성채 = 자리 비움 수입 건물」): 건물 4개 · 한 번에 하나씩 짓기(시간) · 5분 남으면 무료 완료 · 그 전엔 마정석 1개/분으로 바로 완료
   영혼 우물 = 전리품 상자 영혼 +5%p/단계 · 뼈 작업장 = 상자 뼛조각 +15%/단계 · 보물 금고 = 상자 최대 +0.5시간/단계 · 해골 막사 = 공격 +3%/단계 */
const KEEP = { ids: ['well', 'works', 'vault', 'barracks'], max: { well: 20, works: 20, vault: 8, barracks: 20 }, free: 300 };
const keepOf = st => (st.keep = st.keep || { lv: { well: 0, works: 0, vault: 0, barracks: 0 }, bld: null });
const keepLv = (st, id) => (st.keep && st.keep.lv[id]) || 0;
const keepTime = lv => Math.round(Math.min(6 * 3600, 60 * Math.pow(2.1, lv)));
function keepCost(st, id) { const lv = keepLv(st, id); return { souls: waveSouls(Math.max(10, st.best)) * 15 * Math.pow(1.5, lv) * soulMul(st), bones: 10 + lv * 8 }; }
function keepStart(st, id, now) { const K = keepOf(st); if (K.bld || K.lv[id] >= KEEP.max[id]) return false; const c = keepCost(st, id); if (st.souls < c.souls || st.bones < c.bones) return false; st.souls -= c.souls; st.bones -= c.bones; K.bld = { id, end: now + keepTime(K.lv[id]) * 1000, len: keepTime(K.lv[id]) }; return true; }
function keepLeft(st, now) { const K = keepOf(st); return K.bld ? Math.max(0, (K.bld.end - now) / 1000) : 0; }
const keepRushCost = (st, now) => { const l = keepLeft(st, now); return l <= KEEP.free ? 0 : Math.ceil(l / 60); };
function keepRush(st, now) { const K = keepOf(st); if (!K.bld) return null; const c = keepRushCost(st, now); if (st.gems < c) return null; st.gems -= c; K.bld.end = now; return keepTick(st, now); }
function keepTick(st, now) { const K = keepOf(st); if (!K.bld || now < K.bld.end) return null; const id = K.bld.id; K.lv[id]++; K.bld = null; return { id, lv: K.lv[id] }; }
const keepMul = st => 1 + 0.03 * keepLv(st, 'barracks');
/* 03:40 상점 새로(대표님 「현질 뭘 해야 하는지 · 사면 확실한 효과」): 첫 결제 · 패스 · 월정액 · 성장 기금 · 저금통 · 마정석 · 꾸미기. 시험판은 「시험 구매」로 실제 결제 없이 받아 봄 */
const SHOP2 = {
  first: { won: 1200, once: true }, pass: { won: 9900, once: true }, monthGem: { won: 4900 }, monthBone: { won: 3300 }, fund: { won: 11000, once: true }, piggy: { won: 5900 }, skinGold: { won: 9900, once: true },
  gem1: { won: 1200, gems: 60 }, gem2: { won: 6000, gems: 330 }, gem3: { won: 12000, gems: 700 }, gem4: { won: 33000, gems: 2000 }, gem5: { won: 59000, gems: 3800 }, gem6: { won: 119000, gems: 8000 },
};
const PASS = { every: 5, tiers: 20, free: { gems: 30 }, paid: { gems: 120, bones: 20 } }, FUND = { at: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100], gems: 500 }, PIGGY = { perStage: 8, cap: 2000 }, MONTH = { gem: { now: 300, day: 100, days: 30 }, bone: { now: 60, day: 30, days: 30 } };
const shopOf = st => (st.shop2 = st.shop2 || { bought: {}, passFree: 0, passPaid: 0, fund: 0, piggy: 0, gemUntil: 0, gemDay: -1, boneUntil: 0, boneDay: -1, firstPack: {} });
const peakOf = st => Math.max(st.best || 1, st.peak || 0);
function passReady(st) { const S = shopOf(st), n = Math.min(PASS.tiers, Math.floor(peakOf(st) / PASS.every)); return { n, free: n - S.passFree, paid: S.bought.pass ? n - S.passPaid : 0 }; }
function passClaim(st) { const S = shopOf(st), r = passReady(st), g = { gems: 0, bones: 0 }; g.gems += r.free * PASS.free.gems; S.passFree = r.n; if (S.bought.pass) { g.gems += r.paid * PASS.paid.gems; g.bones += r.paid * PASS.paid.bones; S.passPaid = r.n; } st.gems += g.gems; st.bones += g.bones; return g; }
function fundReady(st) { const S = shopOf(st); return S.bought.fund ? FUND.at.filter(x => peakOf(st) >= x).length - S.fund : 0; }
function fundClaim(st) { const n = fundReady(st); if (n <= 0) return 0; shopOf(st).fund += n; st.gems += n * FUND.gems; return n * FUND.gems; }
function monthClaim(st, now, day) { const S = shopOf(st), g = { gems: 0, bones: 0 }; if (S.gemUntil > now && S.gemDay !== day) { S.gemDay = day; g.gems += MONTH.gem.day; S.gemN = (S.gemN || 0) + 1; if (S.gemN === 7) { const pool = HEROES.filter(h => h.rarity === 'SR'), fresh = pool.filter(h => !st.heroes[h.id]), pk = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length ? fresh : pool).length)]; g.hero = grant(st, pk.id); } }   /* 11-15 과금흉내: 소과금(월정액)이 운에 묻혀 무과금과 비슷 → 7번째로 받는 날 상급 영웅 확정 */ if (S.boneUntil > now && S.boneDay !== day) { S.boneDay = day; g.bones += MONTH.bone.day; } st.gems += g.gems; st.bones += g.bones; return g; }
/* 11-15 장르 기본 점검: 「7일 출석」 · 「신규 7일 혜택」이 없었음(버섯커 · 세븐나이츠 키우기 · AFK 저니 다 있음) → 하루 한 칸 받는 출석부.
   처음 7일은 크게(7일째 상급 영웅 확정), 그 뒤는 매주 작게 돎. 날짜는 newDay의 st.day(하루 한 번) */
const LOGIN = {
  first: [{ gems: 100 }, { bones: 30 }, { gems: 150 }, { hours: 2 }, { bones: 60 }, { gems: 200 }, { hero: 'SR', gems: 300 }],
  week: [{ gems: 30 }, { bones: 10 }, { gems: 40 }, { hours: 1 }, { bones: 20 }, { gems: 50 }, { gems: 100, bones: 30 }],
};
function loginOf(st) { return st.login || (st.login = { n: 0, last: null }); }
function loginCan(st) { const L = loginOf(st); return st.day != null && L.last !== st.day; }
function loginRow(st) { const L = loginOf(st), first = L.n < 7; return { first, list: first ? LOGIN.first : LOGIN.week, at: first ? L.n : (L.n - 7) % 7 }; }
function loginClaim(st) {
  if (!loginCan(st)) return null; const L = loginOf(st), R = loginRow(st), r = R.list[R.at], g = { day: R.at + 1, first: R.first, gems: r.gems || 0, bones: r.bones || 0, souls: 0, hero: null };
  if (r.hours) g.souls = Math.round(waveSouls(Math.max(1, st.best || 1)) * 30 * r.hours);   /* 한 시간 = 무리 30개 치(빠른 보상과 비슷한 크기) */
  if (r.hero) { const pool = HEROES.filter(h => h.rarity === r.hero), fresh = pool.filter(h => !st.heroes[h.id]), pick = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length ? fresh : pool).length)]; g.hero = grant(st, pick.id); }
  st.gems += g.gems; st.bones += g.bones; st.souls += g.souls; L.n++; L.last = st.day; return g;
}
/* 11-15 장르 기본 ③ 우편함(시스템 보상만 · 기기 안): 시작 선물 · 정복 축하 · 시험판 감사. 조건을 넘으면 우편이 오고 「받기」로 받음(같은 우편은 한 번) */
const MAIL = [
  { id: 'welcome', at: st => true, gems: 200 },
  { id: 'trial', at: st => (st.best || 0) >= 3, bones: 40 },
  { id: 'st10', at: st => (st.best || 0) >= 10, gems: 100 },
  { id: 'st30', at: st => (st.best || 0) >= 30, gems: 200, bones: 50 },
  { id: 'st50', at: st => (st.best || 0) >= 50, gems: 300 },
  { id: 'st100', at: st => (st.best || 0) >= 100, gems: 500, bones: 100 },
  { id: 'aw1', at: st => (st.awakens || 0) >= 1, gems: 150 },
  { id: 'day3', at: st => (st.daysPlayed || 0) >= 2, gems: 120, bones: 30 },
];
function mailOf(st) { return st.mail || (st.mail = { got: [] }); }
function mailList(st) { const M = mailOf(st); return MAIL.filter(m => !M.got.includes(m.id) && m.at(st)); }
function mailClaim(st, id) { const ms = id === 'all' ? mailList(st) : mailList(st).filter(m => m.id === id); if (!ms.length) return null; const g = { n: ms.length, gems: 0, bones: 0 }; for (const m of ms) { g.gems += m.gems || 0; g.bones += m.bones || 0; mailOf(st).got.push(m.id); } st.gems += g.gems; st.bones += g.bones; return g; }
function shopBuy(st, id, now) {
  const P = SHOP2[id], S = shopOf(st); if (!P || (P.once && S.bought[id])) return null; const g = { id, gems: 0, bones: 0, hero: null, note: '' };
  if (id === 'first') { const r = grant(st, 'serafine'); g.hero = r; g.gems = 300; g.bones = 50; }
  else if (id === 'pass') { /* 지금까지 지난 칸 보상은 「받기」로 */ }
  else if (id === 'monthGem') { S.gemUntil = Math.max(now, S.gemUntil) + MONTH.gem.days * 864e5; g.gems = MONTH.gem.now; }
  else if (id === 'monthBone') { S.boneUntil = Math.max(now, S.boneUntil) + MONTH.bone.days * 864e5; g.bones = MONTH.bone.now; st.autoRaise = true; }
  else if (id === 'fund') { }
  else if (id === 'piggy') { g.gems = Math.floor(S.piggy); S.piggy = 0; if (g.gems <= 0) return null; }
  else if (id === 'skinGold') { st.lskinBuy = st.lskinBuy || {}; st.lskinBuy.gold = 1; if (typeof lskinWear === 'function') lskinWear(st, 'gold'); }
  else if (P.gems) { g.gems = P.gems * (S.firstPack[id] ? 1 : 2); S.firstPack[id] = 1; }
  st.gems += g.gems; st.bones += g.bones; S.bought[id] = (S.bought[id] || 0) + 1; addVip(st, P.won / 10); return g;
}
const SHOP = [{ id: 'crown119', won: [119000] }, { id: 'abyss59', won: [59000] }, { id: 'vault33', won: [33000] }, { id: 'lordPack', won: [5900] }, { id: 'skinSera', won: [9900] }, { id: 'wpStone', won: [3300] }, { id: 'first', won: [1500] }, { id: 'day1', won: [1500, 5900, 12000] }, { id: 'monthGem', won: null }, { id: 'monthBone', won: null }, { id: 'fund', won: null }, { id: 'noAds', won: null }];
root.JB = { trOpen, trCost, starMul, heroStar, transcend, chantMul, MAIL, mailOf, mailList, mailClaim, backGift, WEEK, weekOf, weekReady, weekClaim, LOGIN, loginOf, loginCan, loginRow, loginClaim, regionIdx, dexOf, riseFoe, riseLord, dexMul, ROLE, TRAITS, bossTraits, matchMul, bestSquad, evoMul, evoGain, evoAd, skinOwned, wearSkin, skinMul, weaponUp, weaponCost, vipLv, addVip, SHOP, squadFit, C, RARITY, HEROES, BONDS, bondsOn, FIRST_HERO, HERO_MAX_LV, SQUAD, UPGRADES, CLASSES, GRADES, GRADE_POWER, ALTAR, SPELLS, RANKS, MISSIONS,
  isBoss, isLord, waveHp, waveSouls, upCost, unlocked, heroBonus, armyCap, armySize, unitAtk, graveMul, dps, spellDamage, spellCd, soulMul, sigilsFor, awakenStage, rankOf,
  newState, startWave, tick, retryBoss, canCast, beginCast, landSpell, spellUnlocked, buy, raiseTap,
  altarTable, raiseGrave, keepGrave, scrapGrave, altarUp, altarTick, heroById, country, gachaAllowed, probTable, grant, firstHero, pull, directBuy, setSquad,
  canAwaken, awaken, claimMission, newDay, offlineGain, applyOffline, serialize, deserialize,
  LAB, labBonus, labMins, labBones, labStart, labCheck, labLeft, labGems, labRush, labAd,
  MAP_TILES, MAP_CAP, mapNeed, mapCanTake, mapTake,
  altarGems, altarRush, adBones,
  LSKINS, lskinOwned, lskinBonus, lskinWear,
  GEAR_SLOTS, GEAR, gearOf, gearVal, gearBonus, gearPull, gearAd, gearUp, gearUpAll, gearUpCost,
  RELICS, relicBonus, cryptHp, cryptPower, cryptDust, relicCost, cryptFight, cryptSweep, relicUp, buyKey,
  trainTick, trainNeed, trainLeft, vipItem, quickCost, quickReward, LCHEST, lchestInfo, lchestClaim, powerParts, KEEP, keepOf, keepLv, keepTime, keepCost, keepStart, keepLeft, keepRushCost, keepRush, keepTick, keepMul, GUILD, guildOf, guildJoin, guildDay, guildCheck, guildBossPct, guildHit, guildMul, DUNGEON, dunOf, dunHp, dunReward, dunPower, dunFight, dunAd, dunDay, SHOP2, PASS, FUND, PIGGY, MONTH, shopOf, passReady, passClaim, fundReady, fundClaim, monthClaim, shopBuy, altarLv, altarPull, speedMul, adSpeed, autoUpOpen, autoUpgrade, treasure };
})(typeof window !== 'undefined' ? window : globalThis);
if (typeof module !== 'undefined') module.exports = globalThis.JB;
