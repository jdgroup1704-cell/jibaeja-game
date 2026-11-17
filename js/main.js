'use strict';
// 시작·반복·저장·자리 비움·봇(시험용)
// 저장: 본 저장(5초마다) + 예비 저장(1분마다). 본 저장을 못 읽으면 예비에서 살림, 깨진 본 저장은 따로 남겨 둠(11-13 14:05)
const BAK_KEY = SAVE_KEY + '_예비';
let restored = false, bakT = 0;
function load() {
  if (Q.get('reset') === '1') { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(BAK_KEY); try { const u = new URL(location.href); u.searchParams.delete('reset'); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) {} }   /* 11-16 19:02 대표님: 「처음부터」 주소로 한 번 지운 뒤엔 주소에서 reset을 빼서, 그 주소를 다시 열어도(새로 고침 · 즐겨찾기) 또 지우지 않음 */
  const raw = localStorage.getItem(SAVE_KEY);
  let s = null; try { s = JB.deserialize(raw || ''); } catch (e) {}
  if (!s && raw) {   // 본 저장이 있는데 못 읽음 = 깨짐
    try { localStorage.setItem(SAVE_KEY + '_깨짐', raw); } catch (e) {}
    try { s = JB.deserialize(localStorage.getItem(BAK_KEY) || ''); } catch (e) {}
    if (s) restored = true;
  }
  return s;
}
const worth = o => o ? (o.awakens || 0) * 1e4 + (o.peak || o.best || 0) : -1;   // 예비를 덮어써도 되는지 가늠(처음부터 시작한 판이 좋은 예비를 지우지 않게)
function save() {
  if (window.__wiped) return;   /* 「처음부터」를 누른 뒤엔 다시 저장하지 않음(새로고침 전에 옛 기록이 되살아나지 않게) */
  try { localStorage.setItem(SAVE_KEY, JB.serialize(st)); } catch (e) {}
  if (Date.now() - bakT > 60000) { bakT = Date.now(); try { let old = null; try { old = JSON.parse(localStorage.getItem(BAK_KEY) || 'null'); } catch (e) {} if (worth(st) >= worth(old)) localStorage.setItem(BAK_KEY, JB.serialize(st)); } catch (e) {} }
}
const dayNo = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };

function opening() {
  const o = $('opening'), ps = o.querySelectorAll('p'); o.style.display = 'flex'; S.hold = true;   /* 19:10 직접 플레이로 잡음: 첫 검은 화면을 읽는 동안 뒤에서 싸움이 돌아 첫 보스가 이미 와 있었음 → 누를 때까지 멈춤 */
  ps[0].textContent = L.nar.open; ps[1].textContent = L.nar.open2; o.querySelector('.go').textContent = L.ui.tap;
  setTimeout(() => ps[0].style.opacity = 1, 300); setTimeout(() => ps[1].style.opacity = 1, 1900); setTimeout(() => o.querySelector('.go').style.opacity = 1, 3200);
  /* 11-16 #13: 새 그림체로 바뀐 뒤 첫 싸움 그림은 줄그림(소환수 sumv1 · 적 foev0) → 그 둘을 기다림 목록에 · 옛 정지 그림은 뺌 */
  /* 11-15 켜는 시간 재기: 느린 망(빠른 3세대)에선 4.7초에 싸움이 시작되는데 그때 배경 · 지배자 · 소환수 · 아이콘이 아직 없어 옛 임시 그림이 보임 → 첫 싸움에 꼭 필요한 그림이 다 올 때까지(최대 12초) 「누르세요」 대신 「불러오는 중 N%」. 영상 줄그림(한 장 150~560킬로)은 빼고 같은 그림체 정지 그림만 기다림 — 영상은 누른 뒤 */
  const ESS = ['bg', 'lordA', 'sumv1_idle', 'foev0_idle', 'i_soul', 'i_bone', 'i_gem', 'i_army', 'b_speed', 'b_set', 'b_chat', 'u_summon', 'u_bone', 'st_0', 'ui_ring', 'finger', 't_up', 't_grave', 't_hero'], gb = o.querySelector('.go'), tL = Date.now();
  ARTHOLD = new Set(ESS); ESS.forEach(n => loadImg(n)); const release = () => { if (ARTHOLD) { ARTHOLD = null; loadArt(); } }; const ready = () => AUTO || Date.now() - tL > 12000 || ESS.every(n => ART[n] || (window.ARTERR && ARTERR[n]));
  if (ready()) release(); else { o.classList.add('loading'); const tk = setInterval(() => { const k = ESS.filter(n => ART[n]).length; if (ready()) { clearInterval(tk); release(); o.classList.remove('loading'); gb.textContent = L.ui.tap; } else gb.textContent = (L.ui.loading || L.spell.loading)(Math.round(k / ESS.length * 100)); }, 200); }
  const go = () => { Snd.init(); Snd.startDrone(); Snd.loadAll().then(() => { Snd.bgmStart(BGM_V); EX.applySettings(); }); o.style.display = 'none'; S.hold = false; S.lord.glow = 1; S.shake = 12; S.flash = 0.35; { const s2 = LM.staff(); burst(s2.x, s2.y, 40, { col: ['#ffffff', '#c58bff', '#7a3cff'], vmin: 80, vmax: 420, up: 120, lmax: 1.0 }); burst(260, 640, 50, { col: ['#c9a7ff', '#9b6bff', '#e8dcc0'], vmin: 60, vmax: 300, up: 380, g: -40, lmax: 1.2 }); } S.army.filter(a => !a.fly).forEach((a, i) => { a.rise = 0; a.riseD = 0.35 + i * 0.22; burst(a.x, a.y - 6, 10, { col: ['#5dff8f', '#c9a7ff'], vmin: 20, vmax: 120, up: 140, g: -30, lmax: 0.7 }); }); S.foes.filter(f => !f.dead).forEach((f, i) => { f.x = VX1 + 30 + i * 45; f.born = S.t; });   /* 11-15 순서 #6: 「깨어나라, 나의 군단이여」 뒤 군단이 이미 서 있고 적도 화면 안에 서 있던 것 → 군단은 땅에서 차례로 솟고, 적은 오른쪽 밖에서 걸어 들어옴 */   /* 20:17 첫 화면을 누르면 지배자가 깨어나는 순간: 지팡이 번쩍 · 땅에서 보라 기운 · 흔들림 */ Snd.osc('sine', 1800, 900, 0.5, 0.06); };
  if (AUTO) setTimeout(go, 400); else { const tap = () => { if (o.classList.contains('loading')) return; o.removeEventListener('click', tap); go(); }; o.addEventListener('click', tap); }   /* 불러오는 동안 누르면 무시 */
}
/* 예전 저장(대마법 자동이 생기기 전부터 쓴 사람): 이미 3번 넘게 썼으면 켜서 시작 */
function autoCastFix() { if (!st.seen.autoCastOn && JB.unlocked(st, 'autoCast')) { st.seen.autoCastOn = 1; st.autoCast = true; setTimeout(() => UI.toast(L.unlock.title, L.autoCastOn), 3000); } }
function offlineCheck() {
  const secs = (Date.now() - st.lastSeen) / 1000, g = JB.offlineGain(st, secs); JB.trainTick(st, Date.now()); S.offDone = 1; const trUp = st.train.lv - (st.train.shown == null ? st.train.lv : st.train.shown); st.train.shown = st.train.lv;
  if (!g) return;
  JB.applyOffline(st, g);
  // 돌아왔을 때 기다리는 것(매일 돌아올 이유를 한눈에): 연구 완성 · 쉬는 연구 · 열쇠 · 침공
  const R = L.offline.ready, now = Date.now(), wait = [];
  if (JB.unlocked(st, 'lab')) wait.push(st.lab.cur ? (now >= st.lab.cur.end ? R.labDone(L.lab.names[st.lab.cur.id]) : null) : R.labIdle);
  if (JB.unlocked(st, 'crypt') && st.crypt.keys > 0) wait.push(R.keys(st.crypt.keys));
  if (JB.unlocked(st, 'map') && st.map.tokens > 0) wait.push(R.tokens(st.map.tokens));
  if (secs > 1800 && !TRAILER) { const once = () => { document.removeEventListener('pointerdown', once, true); setTimeout(() => { try { Snd.voiceCd('v_lback', 60, 0); } catch (e) {} }, 350); }; document.addEventListener('pointerdown', once, true); }   /* 21:3x 30분 넘게 비웠다 오면 지배자 「돌아왔는가. 그동안 내 군단은 쉬지 않았다」(첫 손댐 뒤 — 그 전엔 휴대폰이 소리를 막음) */
  const bg = JB.backGift(st, secs, now);   /* 11-15 돌아온 사람 보상(따로 금빛 칸) */
  const list = wait.filter(Boolean), more = (bg ? `<div class="ready backg">${L.offline.back(bg.days, bg.gems, bg.bones)}</div>` : '') + (list.length ? `<div class="ready"><b>${R.title}</b>${list.map(x => `<div>· ${x}</div>`).join('')}</div>` : '');
  const O = L.offline, ch = g.chest, card = (ic, n, v) => `<div class="oc"><img src="art/${ic}.webp" alt=""><b>${v}</b><small>${n}</small></div>`;
  const nextH = [1, 4, 8].find(h => h * 3600 > g.secs), bar = `<div class="obar"><i style="width:${Math.min(1, g.secs / (g.capH * 3600)) * 100}%"></i>${[1, 4, 8].map(h => `<span style="left:${h / g.capH * 100}%" class="${g.secs >= h * 3600 ? 'on' : ''}">${O.tier[[1, 4, 8].indexOf(h) + 1]}</span>`).join('')}</div>`;
  UI.openModal(`<h3>${O.title}</h3><p>${O.time(L.time(g.secs))}</p>${ch ? `<div class="ochest t${ch}"><img src="art/treasure.webp" alt=""><b>${O.chest(O.tier[ch])}</b></div>` : ''}<div class="ocards">${card('i_soul', O.n.souls, fmt(g.souls))}${card('i_bone', O.n.bones, g.bones)}${g.gems ? card('i_gem', O.n.gems, g.gems) : ''}</div>${bar}<p class="mini muted">${nextH ? O.next(nextH, O.tier[[1, 4, 8].indexOf(nextH) + 1]) : O.full(g.capH)}</p>${trUp > 0 ? `<p style="color:#ffd76a">${L.train.away(trUp, st.train.lv, Math.round(st.train.lv * JB.C.TRAIN.atk * 100))}</p>` : ''}${g.evoN ? `<p style="color:#7dff9a">${L.evo.away(g.evoN, g.merges || 0)}</p>` : ''}${more}<button class="btn big gold" data-x="offline2">${L.offline2}</button>`);
  EX.off2 = g;
  setTimeout(() => heroSay('back'), 600);
}

// ───────── 시험용 봇: 처음 하는 사람처럼 단순하게 ─────────
const BOT = { t: 0, log: [] };
/* 봇 놀이는 뽑기 · 무덤 · 보물 운을 씨앗으로 고정(?seed=숫자, 기본 1): 바꾼 것 때문인지 운 때문인지 가르려고 */
if (AUTO) { let sd = (+Q.get('seed') || 1) >>> 0; const rnd = () => { sd = (sd + 0x6D2B79F5) >>> 0; let t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; for (const k of ['raiseGrave', 'pull', 'treasure']) { const f = JB[k]; JB[k] = (st, a, r) => k === 'pull' ? f(st, a, r || rnd) : f(st, a || rnd); } }
function botStep() {
  if (EX.tr && EX.tr.t > 1.5) { EX.catchTreasure(); return; }
  if (st.raised < JB.C.RAISE_TAPS) { if (JB.raiseTap(st)) { Snd.smp('rise', 0.5); if (st.raised === JB.C.RAISE_TAPS) Snd.voice('v_rise'); } return; }
  if (S.phase === 'prompt') { castPressed(); BOT.say && BOT.say('cast'); return; }
  if ($('modal').style.display === 'flex') UI.closeModal();
  const ks = Object.keys(JB.UPGRADES).filter(k => JB.unlocked(st, k)).sort((a, b) => JB.upCost(a, st.up[a]) - JB.upCost(b, st.up[b]));
  for (const k of ks) if (JB.buy(st, k)) { BOT.say && BOT.say('up', k); break; }
  if ((st.tombQ || []).length && !$('tombfx')) { const tb = document.querySelector('#slots .tomb'); if (tb) { UI.tombOpen(tb); BOT.say && BOT.say('tomb'); } else JB.tombOpen(st); }   /* 11-17 23:0x 로봇도 무덤을 엶(자동 시범에서 보이게 · 하나 솟는 동안은 기다림) */
  if (JB.unlocked(st, 'grave') && st.bones > 0) { UI.tab = 'grave'; UI.raiseGrave(st.bones); }
  if (JB.unlocked(st, 'grave') && JB.ALTAR[st.altar + 1] && st.souls > JB.ALTAR[st.altar + 1].cost * 1.5) JB.altarUp(st, Date.now());
  if (JB.unlocked(st, 'hero') && st.gems >= JB.C.GACHA_COST) { UI.tab = 'hero'; UI.pull(1); BOT.say && BOT.say('pull'); }
  for (let i = 0; i < 5; i++) JB.claimMission(st, i);
  if (JB.canAwaken(st) && !UI.awakening) { UI.tab = 'awaken'; UI.doAwaken(); BOT.say && BOT.say('awaken'); }
  if (st.awakens > (BOT.aw || 0)) { BOT.aw = st.awakens; BOT.log.push(['각성' + st.awakens, BOT.t]); }   /* 각성은 1.6초 연출 뒤에 일어남 */
  if (Math.random() < 0.05) UI.tab = ['up', 'grave', 'hero', 'mission'].filter(k => UI.tabOpen(k))[Math.floor(Math.random() * 4)] || 'up';
}

// ───────── 반복 ─────────
let last = 0, uiT = 0, saveT = 0, botT = 0, fpsN = 0, fpsT = 0, fps = 0, slowT = 0;
function frame(now) {
  { const ap = document.getElementById('app'), c = S.phase === 'cast'; if (ap && ap.classList.contains('casting') !== c) ap.classList.toggle('casting', c); }   /* 11-15 폰에서 대마법 마법진(검은 태양)이 오른쪽 단추 기둥(설정 · 채팅) 밑에 깔림 → 대마법 동안 구석 단추를 흐리게 */
  const real = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  if (Snd.bgmTick) Snd.bgmTick();
  let dt = S.hold ? 0 : real * SPEED * (window.DEMO_SP || 1) * JB.speedMul(st, Date.now()); if (S.hitstop > 0) { S.hitstop -= real; dt *= 0.06; }   /* 히트 스톱 */ fpsN++; fpsT += real; if (fpsT > 0.5) { fps = fpsN / fpsT; fpsN = 0; fpsT = 0; slowT = fps < 40 && !document.hidden && performance.now() > 10000 && !TRAILER ? slowT + 0.5 : 0; if (slowT >= 3) { slowT = 0; lowerQuality(); } }
  // 규칙: 연출 중(노려봄·대마법)에는 규칙 시간도 멈춤
  if (!(TRAILER && window.__freeze) && (!['stare', 'prompt', 'cast'].includes(S.phase) || st.boss?.phase === 'fight')) {
    let left = dt; while (left > 0) { const d = Math.min(0.1, left); left -= d; onEvents(JB.tick(st, d)); }
  }
  if (!st.tombGift && JB.tombStart(st) && !AUTO && typeof UI !== 'undefined') UI.skillRow();   /* 11-17 22:0x 장비가 열릴 때 무덤 3개 */
  if (JB.altarTick(st, Date.now())) { UI.toast(L.grave.title, L.grave.altar(st.altar)); Snd.chime(988); }
  EX.tick(real, dt); if (typeof SO !== 'undefined') SO.tick(real);
  viewUpdate(dt); if (typeof Saver !== 'undefined' && Saver.is) Saver.tick(); else if (!window.DEMO_SKIP) draw();   /* 절전 중엔 그리지 않음 */
  uiT += real; if (uiT > (typeof Saver !== 'undefined' && Saver.is ? 2 : 0.25)) { uiT = 0; UI.render(); }
  saveT += real; if (saveT > 5) { saveT = 0; save(); if (JB.newDay(st, dayNo())) UI.toast(L.mission.title, L.ui.newMission); }
  if (AUTO) { BOT.t += dt; botT += dt; if (botT > 0.5) { botT = 0; botStep(); } }
  requestAnimationFrame(frame);
}
addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

// ───────── 시작 ─────────
(function boot() {
  const saved = load(); st = saved || JB.newState(); JB.newDay(st, dayNo());
  resetView(); resize(); UI.init(); EX.init();
  for (let i = 0; i < Math.min(JB.armySize(st), 300); i++) addSkel(false);
  S.milestone = [1000, 300, 100, 10].find(m => JB.armySize(st) >= m) || 0;
  if (saved) { loadArt(); offlineCheck(); autoCastFix(); document.addEventListener('pointerdown', () => { Snd.init(); Snd.startDrone(); Snd.loadAll().then(() => { Snd.bgmStart(BGM_V); EX.applySettings(); }); }, { once: true }); }
  else opening();
  if (restored) setTimeout(() => { UI.toast(L.saveFix.title, L.saveFix.body); save(); }, 800);
  UI.render(true); requestAnimationFrame(frame);
})();
// 시험용 엿보기
window.__game = () => ({ fps: Math.round(fps), qual: +QUAL.toFixed(2), px: cv.width + '×' + cv.height, t: BOT.t, stage: st.stage, best: st.best, wave: st.wave, army: JB.armySize(st), souls: st.souls, bones: st.bones, gems: st.gems, awakens: st.awakens, phase: S.phase, boss: st.boss && st.boss.phase, heroes: Object.keys(st.heroes).length, grave: st.grave.slice(), log: BOT.log, tab: UI.tab });
function wipeAll() { window.__wiped = true; try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(BAK_KEY); } catch (e) {} location.reload(); }
/* 21:58 대표님 「모바일 앱이 아니라 확인이 답답」: 폰에서 처음 누를 때 전체 화면을 한 번 시도(Claude 앱 · 브라우저가 막으면 그냥 지나감) */
document.addEventListener('pointerdown', function fsOnce() { document.removeEventListener('pointerdown', fsOnce, true); try { if (TRAILER || AUTO || !matchMedia('(pointer:coarse)').matches || document.fullscreenElement) return; const d = document.documentElement, f = d.requestFullscreen || d.webkitRequestFullscreen; if (f) { const r = f.call(d, { navigationUI: 'hide' }); if (r && r.catch) r.catch(() => {}); } } catch (e) {} }, true);

/* 11-16 19:03 대표님 「새로 업데이트되었다고 이용자들은 알 수 있게 알람」: 판이 바뀌면(오른쪽 아래 판 표시) 이어 하던 사람에게 「업데이트됐어요 · 바뀐 것」 창 — 저장은 그대로(저장 이름은 판과 상관없이 같음) */
(function patchNote() { const T = setInterval(() => { if (typeof st === 'undefined' || !st) return; const op = document.getElementById('opening'); if (op && op.offsetParent) return; if (document.getElementById('modal').style.display === 'flex' || UI.awakening || (UI.busy && UI.busy()) || (typeof S !== 'undefined' && S.giant && S.giant.on)) return;
  clearInterval(T); const ver = (document.getElementById('ver') || {}).textContent || ''; if (!ver) return; const was = st.lastVer; st.lastVer = ver; if (was === ver || !(st.best > 1)) { save(); return; }   /* 예전 판 이용자(was 없음)도 한 번 알림 */
  const P = L.patch || {}; UI.openModal(`<h3>${P.title || '업데이트됐어요'}</h3><p class="muted">${ver}</p><ul class="patch">${(P.list || []).map(x => `<li>${x}</li>`).join('')}</ul><p class="muted">${P.keep || '하던 판 · 강화는 그대로 이어져요'}</p><button class="btn big gold" data-x="closeModal">${P.ok || '확인'}</button>`); save(); }, 700); })();
