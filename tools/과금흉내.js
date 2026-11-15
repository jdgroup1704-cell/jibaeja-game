// 과금 흉내 30일(11-15 18:08 대표님 「무과금도 따라올 수는 있고, 소과금도 운이 좋아서 아주 좋은 장비를 먹을 수도 있고, 그래도 현질 메리트는 느껴야」)
// node 과금흉내.js [날수=30] [씨앗수=8] → 무 · 소 · 중 · 고 4사람 × 씨앗 N번, 하루 40분 켜고(그 사이 23시간 20분 자리 비움) 하는 일을 다 하고 날마다 최고 판 · 힘 · 장비 · 영웅 별을 적음
const path = require('path'); const JB = require(path.join(__dirname, '..', 'logic.js'));
const DAYS = +(process.argv[2] || 30), SEEDS = +(process.argv[3] || 8), PLAY = 40 * 60, DT = 0.5;
const PROFILES = {
  무과금: { buy: () => [], won: 0 },
  소과금: { buy: d => d === 1 ? ['first', 'monthGem'] : d === 31 ? ['monthGem'] : [] },   // 첫 결제 1,200 + 월정액 4,900 ≈ 6천 원/월
  중과금: { buy: d => d === 1 ? ['first', 'monthGem', 'monthBone', 'pass', 'fund'] : (d % 7 === 0 ? ['gem3'] : []) },   // 약 7만 원/월
  고과금: { buy: d => d === 1 ? ['first', 'monthGem', 'monthBone', 'pass', 'fund', 'gem6', 'gem6'] : (d % 3 === 0 ? ['gem5'] : []) },   // 약 80만 원/월
};
function seeded(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const T = (f, ...a) => { try { return f(...a); } catch (e) { return null; } };
function run(name, seed) {
  Math.random = seeded(seed * 7919 + name.length * 131); const P = PROFILES[name]; let won = 0;
  const st = JB.newState(); let now = Date.UTC(2026, 10, 15, 0, 0, 0); const out = [];
  for (let d = 1; d <= DAYS; d++) {
    JB.newDay(st, d); st.daysPlayed = d; now += 864e5;
    for (const id of P.buy(d)) { const r = T(JB.shopBuy, st, id, now); if (r) won += JB.SHOP2[id].won; }
    T(JB.loginClaim, st); T(JB.mailClaim, st, 'all'); T(JB.monthClaim, st, now, d); T(JB.passClaim, st); T(JB.fundClaim, st); T(JB.guildCheck, st);
    for (let q = 0; q < 3; q++) if (JB.quickCost(st) === 0) T(JB.quickReward, st);
    for (let q = 0; q < 3; q++) { T(JB.adBones, st); T(JB.gearAd, st); }
    // 40분 켜 둠
    for (let t = 0; t < PLAY; t += DT) {
      JB.tick(st, DT);
      if (JB.canCast(st)) { JB.beginCast(st); JB.landSpell(st, Math.random() < 0.6); }
      if (st.retreat) JB.retryBoss(st);
      if ((t | 0) % 10 === 0 && t % 1 === 0) { for (let k = 0; k < 200; k++) { let best = null; for (const u of ['magic', 'summon', 'bone']) { if (!JB.unlocked(st, u)) continue; const c = JB.upCost(u, st.up[u]); if (c != null && c <= st.souls && (!best || c < best[1])) best = [u, c]; } if (!best || !T(JB.buy, st, best[0])) break; } while (T(JB.raiseTap, st)) {} }
      if ((t | 0) % 60 === 0 && t % 1 === 0) { if (JB.canAwaken(st)) T(JB.awaken, st); }
    }
    for (let i = 0; i < JB.C.MISSIONS?.length || i < 8; i++) T(JB.claimMission, st, i); T(JB.weekClaim, st, 0); T(JB.weekClaim, st, 1); T(JB.weekClaim, st, 2);
    // 뽑기 · 별 · 초월 · 무기 · 장비
    while (st.gems >= JB.C.GACHA10_COST) T(JB.pull, st, 10);
    for (const h of JB.HEROES) T(JB.transcend, st, h.id);
    const sq = T(JB.bestSquad, st); if (sq) st.squad = sq.slice(0, st.squad.length);
    for (let k = 0; k < 60; k++) { let any = false; for (const id of st.squad) if (id && T(JB.weaponUp, st, id) === 'ok') any = true; if (!any) break; }
    T(JB.gearUpAll, st); if (st.bones > 200) T(JB.altarPull, st, Math.min(30, st.bones - 200));
    for (const id of ['bone', 'gem', 'soul']) { for (let k = 0; k < 5; k++) { const r = T(JB.dunFight, st, id, false); if (!r || r.noKey || !r.win) break; } }
    for (let k = 0; k < 5; k++) { const r = T(JB.cryptFight, st); if (!r || !r.win) break; }
    // 자리 비움 23시간 20분
    const g = T(JB.offlineGain, st, 86400 - PLAY); T(JB.applyOffline, st, g);
    const G = st.gear ? st.gear.slots : {}, gmax = Math.max(-1, ...Object.values(G).map(it => it ? it.g : -1));
    const stars = Object.entries(st.heroes).map(([id, o]) => JB.heroStar(o));
    out.push({ d, best: st.best, aw: st.awakens, dps: JB.dps(st), gmax, g4: Object.values(G).filter(it => it && it.g >= 4).length, smax: Math.max(0, ...stars), tr: Object.values(st.heroes).filter(o => o.tr).length, ssr: JB.HEROES.filter(h => h.rarity === 'SSR' && st.heroes[h.id]).length, won, pulls: st.pulls || 0, gems: st.gems, ssrStar: Math.max(0, ...JB.HEROES.filter(h => h.rarity === 'SSR' && st.heroes[h.id]).map(h => JB.heroStar(st.heroes[h.id]))), trR: Object.entries(st.heroes).filter(([id, o]) => o.tr).map(([id]) => JB.heroById(id).rarity).join('') });
  }
  return out;
}
const R = {}; for (const n in PROFILES) { R[n] = []; for (let s = 1; s <= SEEDS; s++) R[n].push(run(n, s)); }
const med = a => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const GN = ['일반', '고급', '희귀', '영웅', '전설', '신화'];
console.log('날 | ' + Object.keys(PROFILES).map(n => `${n}(판 · 각성 · 힘 · 장비최고 · 별최고 · ☠7 · 최고등급영웅)`).join(' | '));
for (const d of [1, 3, 7, 14, 21, 30].filter(x => x <= DAYS)) {
  console.log(`${d}일 | ` + Object.keys(PROFILES).map(n => { const rows = R[n].map(r => r[d - 1]); return `${med(rows.map(r => r.best))}판 · ${med(rows.map(r => r.aw))} · ${med(rows.map(r => r.dps)).toExponential(1)} · ${GN[med(rows.map(r => r.gmax))] || '-'} · ★${med(rows.map(r => r.smax))} · ${med(rows.map(r => r.tr))} · ${med(rows.map(r => r.ssr))}`; }).join(' | '));
}
for (const n in PROFILES) console.log(n, [1, 3, 7].map(d => { const r = R[n][0][d - 1]; return d + '일 모집' + r.pulls + ' 최고등급별' + r.ssrStar + ' 초월' + r.trR; }).join(' / '));
console.log('\n운: 30일 안에 전설 이상 장비를 하나라도 먹은 씨앗 비율 · 최고 판 범위(최저~최고) · 쓴 돈');
for (const n in PROFILES) { const L = R[n].map(r => r[r.length - 1]); console.log(`${n}: 전설↑ ${L.filter(x => x.gmax >= 4).length}/${L.length} · 신화 ${L.filter(x => x.gmax >= 5).length}/${L.length} · 판 ${Math.min(...L.map(x => x.best))}~${Math.max(...L.map(x => x.best))} · ${med(L.map(x => x.won)).toLocaleString()}원`); }
