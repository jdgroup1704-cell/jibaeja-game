'use strict';
// 글자 칸(HTML): 위 숫자, 탭(강화·무덤·수하·각성·임무), 안내 한 줄, 알림, 창
const $ = id => document.getElementById(id);
const UI = {
  tab: 'up', seenTab: {}, prevUnlock: {}, feedLines: [], lastGrave: null, autoGrave: false, guideKey: null, guideUntil: 0,
  init() {
    $('hud').addEventListener('click', e => { if (e.target.closest('[data-cur]')) { e.stopPropagation(); Snd.init(); Snd.smp('click', 0.5); this.curOpen(e.target.closest('[data-cur]').dataset.cur); return; } if (e.target.closest('[data-shop]')) { e.stopPropagation(); Snd.init(); Snd.smp('click', 0.5); EX.act('shop'); return; } if (e.target.closest('[data-vip]')) { e.stopPropagation(); Snd.init(); Snd.smp('click', 0.5); this.vipOpen(); } });
    const tabs = ['up', 'grave', 'hero', 'awaken', 'crypt', 'mission'];
    $('tabs').innerHTML = tabs.map(k => `<button data-tab="${k}"><img class="tic" src="art/${TI_ART[k]}.webp" alt="" onerror="this.remove()"><span>${L.tabs[k]}</span></button>`).join('');
    $('tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const k = b.dataset.tab; if (false && k === this.tab && this.tabOpen(k)) { this.setFold(!document.getElementById('app').classList.contains('fold')); this.render(true); return; } if (!this.tabOpen(k)) { this.toast(L.tabs[k], this.lockText(k)); return; } Snd.init(); Snd.smp('click', 0.5); this.tab = k; this.seenTab[k] = 1; this.render(true); });
    $('tabbody').addEventListener('pointerdown', () => { this.ptrDown = true; });
    addEventListener('pointerup', () => { this.ptrDown = false; }); addEventListener('pointercancel', () => { this.ptrDown = false; });
    $('tabbody').addEventListener('click', e => { const bx = e.target.closest('[data-x]'); if (bx && !bx.disabled && typeof EX !== 'undefined') { Snd.init(); Snd.smp('click', 0.5); EX.act(bx.dataset.x, bx.dataset.arg); return; } const b = e.target.closest('[data-act]');   /* 11-15 우편함 시험 중 찾음: 임무 탭의 출석부 줄(data-x)은 눌러도 아무 일 없었음 — 탭 몸통은 data-act만 받았음 */ if (!b || b.disabled) return; Snd.init(); this.act(b.dataset.act, b.dataset.arg); });
    $('cast').innerHTML = `${L.spell.btn}<small>${L.spell.tap}</small>`;
    $('slots').addEventListener('click', e => { const b = e.target.closest('[data-sk]'); if (!b) return; e.stopPropagation(); Snd.init(); const k = b.dataset.sk; if (k === 'rer') { const n = raiseFallen(); if (n) { Snd.smp('rise', 0.4); S.shake = Math.max(S.shake, 4); } this.skillRow(); return; } if (k.startsWith('lock')) { this.toast(L.spell.btn, k === 'lock' ? '' : (k.slice(5) ? `${L.spell[k.slice(5)].name} · ${L.ui.spellAt(JB.SPELLS[k.slice(5)].unlock)}` : '')); return; } Snd.smp('click', 0.5); if (k === 'auto') { if (JB.unlocked(st, 'autoCast')) this.act('autoCast'); else this.toast(L.spell.auto, L.autoCastLock(st.casts || 0)); } else { this.act('spell', k); this.toast(L.spell[k].name, L.spell[k].desc); } this.render(true); });
    { const g = $('grip'); let y0 = null; const on = () => document.getElementById('app').classList.contains('fold');
      g.addEventListener('pointerdown', e => { y0 = e.clientY; }); g.addEventListener('pointerup', e => { const dy = y0 == null ? 0 : e.clientY - y0; y0 = null; Snd.init(); Snd.smp('click', 0.4); this.setFold(Math.abs(dy) < 8 ? !on() : dy > 0); });   /* 손잡이: 누르면 바꾸고, 아래로 끌면 전장 크게 · 위로 끌면 목록 크게 */
      this.setFold(true); }   /* 11-14 18:08 대표님 「밑에 창을 위아래 내릴 수 있으니 헷갈려, 어떤 소비자가 저걸 만지면서 해」: 올리내리기 없앰, 늘 같은 배치 */   /* 11-14 14:49 대표님 「다른 게임도 화면이 이렇게 작나?」: 처음부터 전장 크게(세로 화면 약 46%). 손잡이로 목록 크게 고르면 그걸 기억 */
    if (!TRAILER) { const sw = $('stagewrap'); sw.appendChild($('skillbar')); $('panel').prepend($('goal')); }   /* 스킬 줄 · 목표를 전장 안으로 */
    $('reraise').addEventListener('click', e => { e.stopPropagation(); Snd.init(); const n = raiseFallen(); if (n) { Snd.smp('rise', 0.4); S.shake = Math.max(S.shake, 4); } });   /* 쓰러진 해골 바로 일으키기 */
    $('goal').addEventListener('click', e => { e.stopPropagation(); Snd.init(); const r = e.target.closest('[data-gi]'); if (r && $('goal').classList.contains('ready')) { this.act('claim', r.dataset.gi); this.render(true); return; } if (JB.unlocked(st, 'mission')) { this.tab = 'mission'; this.seenTab.mission = 1; this.render(true); } });
    $('cast').addEventListener('click', e => { e.stopPropagation(); if (!$('cast').classList.contains('on')) return; Snd.init(); castPressed(); }); this.showCast(false);
    $('timing').addEventListener('pointerdown', e => { e.preventDefault(); timingTap(); });
    $('raiseBtn').addEventListener('click', e => { e.stopPropagation(); Snd.init(); if (JB.raiseTap(st)) { Snd.smp('rise', 0.6, 0, rnd(0.9, 1.15)); if (st.raised === JB.C.RAISE_TAPS) Snd.voice('v_rise'); burst(rnd(150, 230), 640, 12, { col: '#5dff8f', vmin: 30, vmax: 140, up: 120, g: -30, lmax: 0.9, smax: 4 }); } this.render(); });
    $('modal').addEventListener('click', e => { if (e.target.id === 'modal' || e.target.dataset.close) return this.closeModal(); const b = e.target.closest('[data-act]'); if (b && !b.disabled && /^(gear|lskin)/.test(b.dataset.act)) { Snd.init(); this.act(b.dataset.act, b.dataset.arg); } });   /* 장비 정보 창 안의 강화 단추 */
    if (TEST) {   // 시험판 전용: 며칠 뒤에 열리는 것(침공 지도 5일째 · 마법 연구 6일째)과 35판 지하 묘지를 바로 볼 수 있게
      $('testbar').innerHTML = `<button data-t="fold" class="fold">${L.test.fold}</button><span class="tb"><button data-t="gems">${L.test.gems}</button><button data-t="bones">${L.test.bones}</button><button data-t="stone">${L.weapon.test}</button><button data-t="day">${L.test.day}</button><button data-t="best">${L.test.best}</button><button data-t="perf">${L.test.perf}</button><button data-t="reset">${L.test.reset}</button></span>`;
      $('testbar').addEventListener('click', e => { const t = e.target.dataset.t; if (t === 'fold') { $('testbar').classList.toggle('open'); return; } if (t === 'gems') st.gems += 500; if (t === 'stone') st.wpStone = (st.wpStone || 0) + 3; if (t === 'bones') st.bones += 200;
        if (t === 'day') { const real = st.day; JB.newDay(st, -1 - (st.daysPlayed || 0)); st.day = real; this.toast(L.test.day, L.test.dayNow(st.daysPlayed)); }   // 날짜만 넘긴 셈: 열쇠·침공·임무 다시 채움, 진짜 날짜는 그대로
        if (t === 'best') { st.best += 10; st.peak = Math.max(st.peak || 1, st.best); if (st.best >= JB.C.CRYPT.unlock) st.crypt.open = true; }
        if (t === 'perf') { let el = document.getElementById('perf'); if (el) { clearInterval(el.iv); el.remove(); } else { el = document.createElement('div'); el.id = 'perf'; el.style.cssText = 'position:fixed;left:6px;top:64px;z-index:60;background:#000b;color:#9fffd0;font:12px/1.4 monospace;padding:4px 6px;border-radius:6px;pointer-events:none'; document.body.appendChild(el); el.iv = setInterval(() => { const g = window.__game(); el.textContent = L.ui.perf(g.fps, g.qual, g.px, S.army.length); }, 500); } }   /* 대표님 휴대폰에서 재 보시는 용도 */
        if (t === 'reset') { localStorage.removeItem(SAVE_KEY); location.reload(); } this.render(true); });
    }
    for (const k of Object.keys(JB.C.UNLOCK)) this.prevUnlock[k] = JB.unlocked(st, k);
  },
  tabOpen(k) { return k === 'up' || (k === 'grave' && JB.unlocked(st, 'grave')) || (k === 'hero' && JB.unlocked(st, 'hero')) || (k === 'awaken' && (st.best >= 20 || st.awakens > 0)) || (k === 'crypt' && (JB.unlocked(st, 'dungeon') || JB.unlocked(st, 'crypt') || JB.unlocked(st, 'map') || JB.unlocked(st, 'lab'))) || (k === 'mission' && JB.unlocked(st, 'mission')); },
  lockText(k) { return L.lockedAt({ grave: JB.C.UNLOCK.grave, hero: JB.C.UNLOCK.hero, awaken: 20, crypt: JB.C.CRYPT.unlock, mission: JB.C.UNLOCK.mission }[k]); },
  skinLine(id) {   /* 수하 전용 겉모습 칸: 있으면 입기/벗기, 없으면 얻는 길(귀빈 등급 · 상점) */
    const sids = Object.keys(JB.C.SKINS).filter(s => JB.C.SKINS[s].hero === id); if (!sids.length) return '';
    return sids.map(sid => { const nm = L.skin.names[sid], k = JB.C.SKINS[sid], worn = st.wear && st.wear[id] === sid;
      if (!JB.skinOwned(st, sid)) return `<div class="wpl"><span class="muted small">🔒 ${L.skin.lock(nm, k.vip)}</span></div>`;
      return `<div class="wpl"><span class="wt t4">${L.skin.line(worn ? nm : L.skin.base)} · ${L.skin.bonus((1 + k.mul).toFixed(1))}</span><button class="btn wpb paid" data-act="skin" data-arg="${id}:${worn ? '' : sid}">${worn ? L.skin.off : L.skin.wear(nm)}</button></div>`; }).join('');
  },
  wpLine(id, o) {   /* 수하 줄 아래 무기 칸: 단계 색(초록 → 파랑 → 보라 → 금 → 빨강) + 강화 단추 */
    const w = o.wp || 0, C = JB.C.WEAPON, nm = L.weapon.names[id];
    const btn = w >= C.max ? `<span class="muted small">${L.weapon.max}</span>` : w >= C.freeMax ? ((st.wpStone || 0) > 0 ? `<button class="btn wpb paid" data-act="wp" data-arg="${id}">${L.weapon.stoneBtn(st.wpStone)}</button>` : `<span class="muted small">${L.weapon.stone}</span>`) : `<button class="btn wpb" data-act="wp" data-arg="${id}" ${st.bones < JB.weaponCost(w) ? 'disabled' : ''}>${L.weapon.btn(JB.weaponCost(w))}</button>`;
    return `<div class="wpl"><span class="wt t${Math.ceil(w / 2)}">${L.weapon.line(nm, w, (1 + C.mul * w).toFixed(2))}</span>${btn}</div>`;
  },
  vipOpen() {   /* 귀빈 등급 창: 지금 등급 · 다음 등급 막대 · 등급별 혜택 표 */
    const v = JB.vipLv(st), N = JB.C.VIP.need, e = st.vipExp || 0, top = v >= N.length - 1;
    const bar = top ? `<p class="muted">${L.vip.max}</p>` : `<div class="vipbar"><div style="width:${Math.min(100, (e - N[v]) / (N[v + 1] - N[v]) * 100)}%"></div></div><p class="muted small">${L.vip.next(e.toLocaleString('ko-KR'), N[v + 1].toLocaleString('ko-KR'))}</p>`;
    const IT = JB.C.VIP_ITEMS, V = L.vip, rows = V.perks.map((p, i) => { if (!i) return ''; const it = Object.keys(IT).find(k => IT[k].vip === i), sp = V.spellAt[i], art = { 3: 'lord_v3', 5: 'lord_vip', 6: 'lord_v6', 9: 'lord_v9', 10: 'lord_v10' }[i];   /* 11-14 등급마다: 누적 금액 · 혜택 · 전용 무기/물건 · 귀빈 마법 · 지배자 옷 */
      const extra = (it ? `<div class="vipx it"><img src="art/${V.item[it].ic}.webp" alt=""><span><small>${V.itemT}</small><b>${V.item[it].name}</b> ${V.item[it].desc}</span></div>` : '') + (sp ? `<div class="vipx sp"><span class="spi">✦</span><span><small>${V.spellT}</small><b>${V.spell[sp]}</b> ${V.spellDesc[sp]}</span></div>` : '');
      return `<div class="row vipr${i === v ? ' on' : ''}${i < v ? ' got' : ''}"><div class="vlw"><b class="vl">${V.lv(i)}</b><small class="vp">${V.priceT(V.price[i])}</small></div><div class="grow"><div class="ds">${p}</div>${extra}</div>${art ? `<img class="vipimg" src="art/${art}.webp" alt="">` : ''}</div>`; }).join('');
    this.openModal(`<h3>${L.vip.title}</h3><p><b class="vipnow">${L.vip.now(v)}</b></p>${bar}<p class="muted small">${L.vip.note}</p><div class="viplist">${rows}</div>` + (TEST ? `<button class="btn" data-x="vipTest">${L.vip.test}</button>` : ''));
  },
  toast(title, body) { if (typeof S !== 'undefined' && (S.phase === 'cast' || bossFight() || S.phase === 'prompt' || S.phase === 'stare' || S.warn || (S.texts && S.texts.some(t => t.screen && t.size >= 40 && t.age < t.life)))) { (this.toastQ = this.toastQ || []).push([title, body]); return; }   /* 대마법 연출 중엔 알림이 마법진을 가리지 않게 미뤘다가 끝나면 띄움 */
    if (typeof S !== 'undefined') S.lastNew = S.t;   /* 박자 감독이 보는 「마지막 새 것」 */
    const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = `<b>${title}</b>${body}`; $('toast').appendChild(d); setTimeout(() => d.remove(), 3500); while ($('toast').children.length > 2) $('toast').firstChild.remove(); },
  feed(t) { this.feedLines.unshift(t); this.feedLines.length = Math.min(this.feedLines.length, 4); $('feed').innerHTML = this.feedLines.map(x => `<div>${x}</div>`).join(''); },
  guide(k, secs = 8) { this.guideKey = k; this.guideUntil = performance.now() + secs * 1000; },
  onBest(s) { this.lossN = 0; if (s === 20 && !st.awakens) this.toast(L.tabs.awaken, JB.canAwaken(st) ? L.guide.awaken : L.awaken.need(JB.awakenStage(st))); },   /* 20:33 첫 각성 20판인데 「2-10에 도달하면」이라고 떴음 */
  wallCard() {
    if (getComputedStyle($('modal')).display !== 'none') return;
    const W2 = L.wallCard, opts = [];
    const ks = Object.keys(JB.UPGRADES).filter(k => JB.unlocked(st, k)); const cheap = ks.map(k => [k, JB.upCost(k, st.up[k])]).sort((a, b) => a[1] - b[1])[0];
    if (JB.unlocked(st, 'bone')) opts.push(['up', W2.bone(st.up.bone), st.souls >= JB.upCost('bone', st.up.bone)]);
    if (JB.unlocked(st, 'grave')) opts.push(['grave', W2.grave(st.bones), st.bones > 0]);
    if (JB.unlocked(st, 'hero')) opts.push(['hero', W2.hero(st.gems), st.gems >= JB.C.GACHA_COST || (st.free10 || 0) > 0]);
    if (!opts.length && cheap) opts.push(['up', W2.up, true]);
    opts.sort((a, b) => b[2] - a[2]);
    this.openModal(`<h3>${W2.title}</h3><p class="muted">${W2.body}</p><div class="wallopts">${opts.slice(0, 3).map(([t, txt, ok]) => `<button class="btn big${ok ? ' gold' : ''}" data-x="goTab" data-arg="${t}">${txt}${ok ? ` <small>${W2.now}</small>` : ''}</button>`).join('')}</div>`);
  },
  offerFirst() {   /* 03:50 첫 결제 특가 알림 창: 세라핀 크게 + 사면 바로 + 1,200원 */
    const T = L.shop2.items.first;
    this.openModal(`<div class="offer"><i class="rib">${L.shop2.hotFirst}</i><img src="art/heroA_serafine.webp" alt=""><h3>${L.offer.title}</h3><p class="now">${T.now}</p><p class="muted mini">${L.offer.sub}</p><button class="btn big gold" data-x="shopBuy" data-arg="first"><b>1,200원</b> · ${L.shop2.test}</button><button class="btn" data-x="shop">${L.offer.more}</button></div>`);
  },
  curOpen(k) {   /* 03:25 대표님 「마정석이 뭔지 · 유료 재화인지」: 재화 셋 설명 창. 마정석 줄엔 상점 단추 */
    const C = L.cur, row = (id, ic) => `<div class="currow${id === k ? ' on' : ''}"><img src="art/${ic}.webp" alt=""><div><b>${C[id].n}</b>${id === 'gems' ? `<span class="paid">${C.paid}</span>` : ''}<p>${C[id].use}</p><small>${C[id].get}</small></div></div>`;
    this.openModal(`<h3>${C.title}</h3>${row('souls', 'i_soul')}${row('bones', 'i_bone')}${row('gems', 'i_gem')}<button class="btn big gold" data-x="shop">${C.shop}</button>`);
    st.seen.curTip = 1;
  },
  vsCustom(img, name, sub, then) {   /* 05:05 던전 · 길드 보스 도전도 결과 창만 뜨던 것 → 대결 띠 1.6초 뒤 결과(대표님 「현질하면 확실한 효과 · 몰입」) */
    this.closeModal(); let el = $('vsfx'); if (!el) { el = document.createElement('div'); el.id = 'vsfx'; $('stagewrap').appendChild(el); }
    el.innerHTML = `<div class="vl"><img src="art/lordA.webp" alt=""><span>${L.vs.me}</span></div><div class="vr"><img src="art/${img}.webp" alt=""><span>${name}</span></div><b class="vsx">${L.vs.x}</b><div class="vsw">${sub || ''}</div>`;
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); clearTimeout(this.vsT); this.vsT = setTimeout(() => { el.classList.remove('go'); then && then(); }, 1650);
    Snd.slam && setTimeout(() => Snd.slam(0.5), 330);
  },
  vsShow(lord) {   /* 00:55 보스 「VS」 화면 1.7초: 왼쪽 지배자(보라) · 오른쪽 보스(빨강)가 대각선으로 밀려 들어오고 가운데 VS 쾅 */
    if (UI.awakening || document.getElementById('modal').style.display === 'flex') return false;
    let el = $('vsfx'); if (!el) { el = document.createElement('div'); el.id = 'vsfx'; $('stagewrap').appendChild(el); }
    const nm = L.boss.name(L.regions[regionOf(st.stage)], lord), lk = 'lordA';   /* 01:55 그림체 A 지배자(오른쪽을 봄 = 보스와 마주 봄) */
    el.innerHTML = `<div class="vl"><img src="art/${lk}.webp" alt=""><span>${L.vs.me}</span></div><div class="vr"><img src="art/foeA4.webp" alt=""><span>${nm}</span></div><b class="vsx">${L.vs.x}</b><div class="vsw">${lord ? L.boss.lord : L.boss.arrive}</div>`;
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); clearTimeout(this.vsT); this.vsT = setTimeout(() => el.classList.remove('go'), 1750);
    Snd.slam && setTimeout(() => Snd.slam(0.5), 330); return true;
  },
  cutIn(id, name, col) {
    const now = performance.now(); if (now - (this.cutT || 0) < 7000 /* 23:55 4초 → 7초: 너무 자주 가림 */ || (S.bubble && S.bubble.age < (S.bubble.life || 3.2)) || document.querySelector('#toast .toast') || $('reraise').classList.contains('on') /* 23:59 겹침재기: 말풍선 · 일으켜라 알약과 86~93% 겹침 → 그땐 띠 대신 영웅 머리 위 글자 */ || S.warn || S.phase !== 'battle' && S.phase !== 'fight' || UI.awakening || TRAILER || ($('rcard') && $('rcard').classList.contains('on'))) return false;   /* 21:45 「제2장」 지역 카드 위에 기술 띠가 겹쳐 글자가 가려짐 → 카드 동안엔 안 띄움 */ this.cutT = now;
    let el = $('cutin'); if (!el) { el = document.createElement('div'); el.id = 'cutin'; $('stagewrap').appendChild(el); }
    el.style.setProperty('--c', col); el.innerHTML = `<div class="ci-bg"></div><img src="art/hero_${id}.webp" alt=""><div class="ci-t"><small>${L.heroes[id].name}</small><b>${name}</b></div>`;
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); clearTimeout(this.cutHide); this.cutHide = setTimeout(() => el.classList.remove('go'), 900);   /* 끝나면 치움(투명하게 남아 있지 않게) */ Snd.smp && Snd.smp('stamp', 0.25, 0, 1.3); return true;
  },
  /* 19:33 대표님 「딱딱하다」: 강화를 눌러도 전장엔 아무 변화가 없었음 → 누른 강화가 전장에서 바로 보이게 */
  buyFx(k) {
    const live = S.army.filter(a => !a.fly && a.rise >= 1); const mx = live.length ? live.reduce((p, a) => p + a.x, 0) / live.length : 450, my = 520;
    if (k === 'summon') { burst(mx, 640, 26, { col: ['#c9a7ff', '#9b6bff', '#ffffff'], vmin: 60, vmax: 260, up: 320, g: -60, lmax: 0.9 }); say(`+${JB.C.ARMY_PER_SUMMON} ${L.army}`, mx, my - 40, { size: 22, col: '#e8dcff', glow: '#8a3cff', life: 1.1, vy: -45 }); for (const a of live) if (Math.random() < 0.5) a.hop = 0.5; }
    else if (k === 'bone') { for (const a of live) a.flash = 0.18; burst(mx, my, 20, { col: ['#fff3c4', '#ffd76a', '#ffffff'], vmin: 80, vmax: 300, up: 80, lmax: 0.5 }); say(L.fx.atkUp, mx, my - 50, { size: 22, col: '#ffe9a8', glow: '#ff9a2a', life: 1.1, vy: -45 }); }
    else if (k === 'magic') { const s2 = LM.staff(); S.lord.glow = 1; S.lord.shotT = 0.28; burst(s2.x, s2.y, 30, { col: ['#ffffff', '#c58bff', '#ffd76a'], vmin: 80, vmax: 360, up: 60, lmax: 0.7 }); say(L.fx.staffUp, s2.x + 40, s2.y - 30, { size: 22, col: '#ffe9a8', glow: '#a050ff', life: 1.2, vy: -40 }); }
    else { burst(mx, my, 14, { col: ['#9fffd0', '#ffffff'], vmin: 60, vmax: 220, up: 120, lmax: 0.6 }); }
    S.shake = Math.max(S.shake || 0, 2);
  },
  showCast(on) { const c = $('cast'); c.classList.toggle('on', !!on); c.innerHTML = `${L.spell.btn}<small>${on ? L.spell.tap : L.spell.wait}</small>`; if (TRAILER) c.style.display = on ? 'block' : 'none'; },   /* 11-14: 스킬 줄에 늘 서 있고, 거대한 적 앞에서만 빛남 */
  showTiming(on) { $('timing').style.display = on ? 'block' : 'none'; $('timing').querySelector('span').textContent = L.spell.timingHint; },
  openModal(html) { { const fg = $('finger'); if (fg) fg.classList.remove('on'); }   /* 11-15 출석부처럼 화면 갱신 없이 열린 창 위에 손가락이 남던 것 */ $('modal').querySelector('.box').innerHTML = html + `<div style="margin-top:.8em"><button class="btn big" data-close="1">${L.odds.close}</button></div>`; $('modal').style.display = 'flex'; },
  closeModal() { $('modal').style.display = 'none'; },

  act(a, arg) {
    if (a === 'bulk') { this.bulk = +arg || 999; this.render(true); return; }
    if (a === 'buy') { const B = this.bulk || 1; for (let i = 1; i < (B === 999 ? 999 : B); i++) if (!JB.buy(st, arg)) break; if (JB.buy(st, arg)) { Snd.smp('click', 0.5, 0, 1.2); if (arg === 'summon') Snd.smp('rise', 0.3); this.buyFx(arg); } }
    if (a === 'grave') this.raiseGrave(1);
    if (a === 'graveAll') this.raiseGrave(st.bones);
    if (a === 'autoGrave') this.autoGrave = !this.autoGrave;
    if (a === 'altar') { if (JB.altarUp(st, Date.now())) Snd.smp('summon', 0.5); }
    if (a === 'altarOdds') this.altarOdds();
    if (a === 'adBones') { if ((st.adBones || 0) < JB.C.AD_BONES.max) EX.ad(() => { const n = JB.adBones(st); if (n) { Snd.smp('rise', 0.6); this.toast(L.grave.title, `${L.bones} +${n}`); } this.render(true); }); }
    if (a === 'altarRush') { if (JB.altarRush(st, Date.now())) { Snd.smp('summon', 0.6); Snd.chime(1319); this.toast(L.grave.title, L.grave.altar(st.altar)); } }
    if (a === 'pull1' || a === 'pull10') this.pull(a === 'pull10' ? 10 : 1);
    if (a === 'altar1' || a === 'altarAll') { const r = JB.altarPull(st, a === 'altarAll' ? 10 : 1); if (r) { this.gearGot(r); Snd.smp && Snd.smp('summon', 0.5); } this.render(true); return; }
    if (a === 'gearPull1' || a === 'gearPull10') { const r = JB.gearPull(st, a === 'gearPull10' ? 10 : 1); if (r) this.gearGot(r); }
    if (a === 'gearAd') EX.ad(() => { const r = JB.gearAd(st); if (r) this.gearGot(r); this.render(true); });
    if (a === 'gearUpAll') { const n = JB.gearUpAll(st); if (n) { Snd.smp('summon', 0.4); this.toast(L.gear.title, L.ui.lvUp(n)); } }
    if (a === 'gearSlot') this.gearInfo(arg);
    if (a === 'gearUp') { if (JB.gearUp(st, arg)) { Snd.smp('summon', 0.4); this.gearInfo(arg); } }
    if (a === 'heroOdds') this.heroOdds();
    if (a === 'direct') { const r = JB.directBuy(st, arg); if (r) this.pullResult([r]); }
    if (a === 'skin') { const [hid, sid] = arg.split(':'); if (JB.wearSkin(st, hid, sid || null)) { if (sid) { this.toast(L.heroes[hid].name, L.skin.on(L.heroes[hid].name, L.skin.names[sid])); Snd.chime(1319); const fh = HF.list.find(x => x.id === hid); if (fh) { fh.flash = 1; burst(fh.x, fh.y - 80, 40, { col: ['#ff5a7a', '#ffd76a', '#ffffff'], vmin: 60, vmax: 360, up: 140, lmax: 0.9 }); } } } this.render(true); return; }
    if (a === 'lskin' || a === 'lskinWear') { if (a === 'lskinWear') { JB.lskinWear(st, arg); Snd.smp('summon', 0.5); } this.lskinOpen(); }
    if (a === 'power') { const P = JB.powerParts(st), N = L.power, row = (k, v, txt) => { const t = N.tab[k], on = t && this.tabOpen(t); return `<div class="pwrow${v > (k === 'summon' ? 1.01 : 1.0001) || (txt && v > 0) ? '' : ' off'}"><span>${N.n[k]}</span><b>${txt ? (v > 0 ? '+' + Math.round(v * 100) + '%' : N.none) : '×' + (v >= 100 ? fmt(v) : v.toFixed(2))}</b>${on ? `<button class="btn mini" data-x="goTab" data-arg="${t}">${N.go}</button>` : '<i></i>'}</div>`; };
      this.openModal(`<h3>${N.title}</h3><p class="pwtot">${N.total(fmt(P.total))}</p><div class="muted mini">${N.mulT}</div><div class="pwlist">${P.mul.map(([k, v]) => row(k, v)).join('')}</div><div class="muted mini">${N.addT}</div><div class="pwlist">${P.add.map(([k, v]) => row(k, v, 1)).join('')}</div><p class="mini" style="color:#ffd76a">${N.addSum(Math.round(P.addSum * 100))}</p>`); return; }   /* 00:10 군단 힘 한눈에 */
    if (a === 'keepGo') { if (JB.keepStart(st, arg, Date.now())) { Snd.smp('click', 0.6); Snd.slam && Snd.slam(0.2); this.toast(L.keep.title, L.keep.started(L.keep.n[arg])); } this.render(true); return; }
    if (a === 'keepRush') { const r = JB.keepRush(st, Date.now()); if (r) this.keepDone(r); else this.toast(L.keep.title, L.keep.noGem); this.render(true); return; }
    if (a === 'dunGo' && !this.dunNow) { if (this.dunBusy) return; if (JB.dunOf(st).keys[arg] < 1) { this.toast(L.dun.title, L.dun.noKey); return; } const d = JB.DUNGEON.list.find(x => x.id === arg), lv = JB.dunOf(st).lv[arg] + 1; this.dunBusy = 1; this.vsCustom(d.boss, L.dun.names[arg], L.dun.next(lv).replace(' 보상', ''), () => { this.dunBusy = 0; this.dunNow = 1; try { this.act('dunGo', arg); } finally { this.dunNow = 0; } }); return; }
    if (a === 'dunGo' || a === 'dunSweep') { const r = JB.dunFight(st, arg, a === 'dunSweep'); if (!r) return; if (r.noKey) { this.toast(L.dun.title, L.dun.noKey); return; }
      if (!r.win) { Snd.smp && Snd.smp('click', 0.5); this.openModal(`<h3>${L.dun.lose}</h3><p>${L.dun.loseD(Math.round(r.ratio * 100))}</p><button class="btn gold" data-x="goTab" data-arg="up">${L.dun.toUp}</button>`); return; }
      if (!r.sweep) Snd.smp('win', 0.9); if (r.sweep || !conquestFx(L.dun.win(r.L), '', arg === 'gem' ? '#bff4ff' : arg === 'bone' ? '#ffe9b8' : '#e9dcff', arg === 'gem' ? '#29c6ff' : arg === 'bone' ? '#d99a2b' : '#8a3cff', 'conquer')) { S.shake = Math.max(S.shake || 0, 6); Snd.chime && Snd.chime(1319); } Snd.smp('summon', 0.6); const R = r.r, t = R.souls ? `${L.souls} +${fmt(R.souls)}` : R.bones ? `${L.bones} +${R.bones}` : `${L.gems} +${R.gems}`;
      this.openModal(`<div class="dwin"><h3>${r.sweep ? L.dun.swept : L.dun.win(r.L)}</h3><img src="art/${r.r.souls ? 'i_soul' : r.r.bones ? 'i_bone' : 'i_gem'}.webp" alt=""><p class="big">${t}</p></div>`); this.render(true); return; }
    if (a === 'dunAd') { EX.ad(() => { JB.dunAd(st, arg); this.render(true); }); return; }
    if (a === 'dex') { const d = JB.dexOf(st), R = JB.C.RISE; this.openModal(`<h3>${L.rise.dex}</h3><p class="muted">${L.rise.hint}</p><table><tr>${L.rise.cols.map(c => `<th>${c}</th>`).join('')}</tr>${L.regions.map((n, i) => `<tr><td>${n}</td><td class="${d.f[i] ? 'good' : 'muted'}">${d.f[i] ? L.rise.done : L.rise.kills(Math.min(d.k[i], R.foe), R.foe)}</td><td class="${d.l[i] ? 'good' : 'muted'}">${d.l[i] ? L.rise.done : d.lt[i] ? L.rise.tries(d.lt[i], R.lordPity) : L.rise.locked}</td></tr>`).join('')}</table>`); return; }
    if (a === 'wpAll') { let n = 0; for (let k = 0; k < 200; k++) { const ids = st.squad.filter(id => id && st.heroes[id]).sort((x, y) => JB.weaponCost(st.heroes[x].wp || 0) - JB.weaponCost(st.heroes[y].wp || 0)); let ok = false; for (const id of ids) if (JB.weaponUp(st, id) === 'ok') { n++; ok = true; break; } if (!ok) break; }   /* 일괄 강화: 진형 수하 무기를 가장 싼 것부터 살 수 있는 만큼 */
      this.toast(L.weapon.allTitle, n ? L.weapon.allDone(n) : L.weapon.allNone); if (n) { Snd.stamp && Snd.stamp(0.5); Snd.chime(1175); } this.render(true); return; }
    if (a === 'autoSquad') { st.settings.autoSquad = !st.settings.autoSquad; if (st.settings.autoSquad) this.act('bestSquad', Math.ceil(Math.max(st.stage, 1) / JB.C.BOSS_EVERY) * JB.C.BOSS_EVERY); this.render(true); return; }
    if (a === 'wp') { const r = JB.weaponUp(st, arg); if (r === 'ok') { const w = st.heroes[arg].wp; Snd.stamp && Snd.stamp(0.5); Snd.chime(880 + w * 60); this.toast(L.heroes[arg].name, L.weapon.up(L.heroes[arg].name, L.weapon.names[arg], w)); const fh = HF.list.find(x => x.id === arg); if (fh) { fh.flash = 0.8; burst(fh.x, fh.y - 80, 30, { col: [HF.TIER[Math.ceil(w / 2)] || '#fff', '#ffffff'], vmin: 60, vmax: 320, up: 120, lmax: 0.8 }); } } else if (r === 'bones') this.toast(L.weapon.names[arg], L.weapon.noBones); else if (r === 'stone') this.toast(L.weapon.names[arg], L.weapon.stone); this.render(true); return; }
    if (a === 'squad') { const before = JB.bondsOn(st).map(x => x.id); setTimeout(() => { for (const x of JB.bondsOn(st)) if (!before.includes(x.id)) { bondTalk(x.id); break; } }, 0); const i = st.squad.indexOf(arg); if (i < 0) { let w = 0; st.squad.forEach((id, j) => { if (!id) w = j; }); if (st.squad.every(Boolean)) { const rank = id => ['N', 'R', 'SR', 'SSR'].indexOf(JB.heroById(id).rarity); w = st.squad.reduce((m, id, j) => rank(id) < rank(st.squad[m]) ? j : m, 0); } st.squad[w] = arg; heroSay('join', arg); } }
    if (a === 'awaken') this.doAwaken();
    if (a === 'spell') { if (JB.spellUnlocked(st, arg)) st.spell = arg; }
    if (a === 'autoCast') st.autoCast = !st.autoCast;
    if (a === 'bestSquad') { const bs = JB.bestSquad(st, +arg); st.squad = st.squad.map((_, i) => bs[i] || null); this.toast(L.plan.best, L.plan.bestDone); }
    if (a === 'weekClaim') { const g = JB.weekClaim(st, +arg); if (g) { Snd.chime && Snd.chime(1175); Snd.smp('summon', 0.4); this.toast(L.week.toast, [g.gems ? `${L.gems} +${g.gems}` : '', g.bones ? `${L.bones} +${g.bones}` : ''].filter(Boolean).join(' · ')); } this.render(true); return; }
    if (a === 'claim') { const m = JB.claimMission(st, +arg); if (m) { Snd.smp('soul', 0.6); this.toast(L.mission.title, `${L.gems} +${m.gems}${m.bones ? ` · ${L.bones} +${m.bones}` : ''}`); if (m.free10) { Snd.stamp(); setTimeout(() => this.toast(L.mission.first, L.mission.firstBody), 700); this.seenTab.hero = 0; } } }
    if (a === 'crypt') { const r = JB.cryptFight(st); if (r.ok) { if (!conquestFx(L.crypt.floorWon(r.f), L.crypt.title, '#d6c2ff', '#5a2cff', 'crypt')) Snd.chime(392); this.toast(L.crypt.title, L.crypt.win(r.f, r.dust, r.gems)); this.feed(L.crypt.win(r.f, r.dust, r.gems)); if (r.relic) { const n = L.relics[r.relic]; Snd.stamp(); setTimeout(() => this.openModal(`<h3>${L.crypt.newRelic(n.name)}</h3><img class="rl big" src="art/relic_${r.relic}.webp" alt="" onerror="this.style.display='none'"><p>${n.desc(this.relicVal(r.relic, 1))}</p><p class="muted">${L.crypt.keep}</p>`), 500); } } else this.toast(L.crypt.title, r.why === 'key' ? L.crypt.nokey : L.crypt.weak(Math.floor(r.have / r.need * 100))); }
    if (a === 'exp') this.expView = arg;
    if (a === 'lab') { const r = JB.labStart(st, arg, Date.now()); if (r.ok) { Snd.smp('summon', 0.4); Snd.chime(1319); } else this.toast(L.lab.title, r.why === 'busy' ? L.lab.busy : L.lab.bones(r.cost)); }
    if (a === 'labRush') { const r = JB.labRush(st, Date.now()); if (r) this.labDone(r); }
    if (a === 'labAd') { if (st.lab.cur && st.lab.adUsed < JB.C.LAB.adMax) EX.ad(() => { JB.labAd(st, Date.now()); this.labDone(); this.render(true); }); }
    if (a === 'take') { const t = L.map.tiles[+arg], r = JB.mapTake(st, +arg); if (r.ok) { if (!conquestFx(L.map.conquered(t), r.done ? L.map.done(L.map.kingdom(r.kingdom)) : L.map.kingdom(r.kingdom), undefined, undefined, 'conquer')) Snd.stamp(); this.toast(L.map.title, L.map.won(t, r.gems, r.bones)); this.feed(L.map.won(t, r.gems, r.bones)); if (r.done) { Snd.stamp(); Snd.cheer && Snd.cheer(); this.toast(L.map.title, L.map.done(L.map.kingdom(r.kingdom))); } } else { const w = L.map.why[r.why]; this.toast(L.map.title, typeof w === 'function' ? w(r.need) : w); } }
    if (a === 'sweep') { const r = JB.cryptSweep(st); if (r) { Snd.smp('soul', 0.6); this.toast(L.crypt.title, L.crypt.swept(r.f, r.dust)); } }
    if (a === 'relic') { if (JB.relicUp(st, arg)) { Snd.smp('summon', 0.4); Snd.chime(1175); } }
    if (a === 'key') { if (JB.buyKey(st)) Snd.smp('click', 0.6); }
    if (a === 'retry') { if (JB.retryBoss(st)) onEvents([{ e: 'bossArrive', lord: st.boss && st.boss.lord }]); }
    this.render(true);
  },
  raiseGrave(n) {
    let last = null, better = 0, souls = 0;
    for (let i = 0; i < n; i++) { const r = JB.raiseGrave(st); if (!r) break; if (JB.keepGrave(st, r)) better++; else souls += JB.scrapGrave(st, r); last = r; }
    if (!last) return;
    this.lastGrave = { r: last, better, souls, n };
    Snd.smp('rise', 0.5, 0, rnd(0.9, 1.1)); if (better) { Snd.chime(1047); for (let i = 0; i < 20; i++) { const a = S.army[Math.floor(Math.random() * S.army.length)]; if (a && !a.fly) { Object.assign(a, pickClass()); burst(a.x, a.y - 30, 3, { col: '#c58bff', vmin: 20, vmax: 80, up: 40, lmax: 0.6 }); } } }
  },
  pull(n) { const r = JB.pull(st, n); if (!r) return; this.pullResult(r); },
  pullResult(res) {   /* 22:55 뽑기 연출: 마법진 → 빛기둥(가장 높은 등급 색) → 높은 등급은 영웅이 크게 등장 → 카드 */
    const RO = { N: 0, R: 1, SR: 2, SSR: 3 }, rk = r => RO[JB.heroById(r.id).rarity] ?? 0, top = res.reduce((m, r) => Math.max(m, rk(r)), 0), best = res.find(r => rk(r) === top);
    if (AUTO || TRAILER) return this.pullCards(res);
    this.summonFx(top, best, () => this.pullCards(res));
  },
  summonFx(top, best, done) {
    let el = $('summonfx'); if (!el) { el = document.createElement('div'); el.id = 'summonfx'; document.body.appendChild(el); }
    const h = JB.heroById(best.id), col = ['#d9dcf0', '#4aa8ff', '#b56cff', '#ffcc33'][top];
    el.style.setProperty('--c', col); el.className = 'on rk' + top;
    el.innerHTML = `<div class="sf-bg"></div><div class="sf-rays"></div><div class="sf-circle"></div><div class="sf-pillar"></div>${top >= 2 ? `<img class="sf-hero" src="art/${need('heroF_' + best.id) ? 'heroF_' : 'hero_'}${best.id}.webp" alt=""><div class="sf-name"><small>${top >= 3 ? L.ui.sfTop : L.rarity[h.rarity]}</small><b>${L.heroes[best.id].name}</b></div>` : ''}<div class="sf-tap">${L.ui.sfTap}</div>`;
    Snd.smp('summon', 0.9); const T = top >= 3 ? 2600 : top >= 2 ? 1800 : 1000;
    if (top >= 2) setTimeout(() => { Snd.stamp && Snd.stamp(); S.flash = top >= 3 ? 0.6 : 0.3; if (top >= 3) { Snd.slam && Snd.slam(0.6); S.shake = 14; } }, T * 0.45);
    let gone = false; const fin = () => { if (gone) return; gone = true; el.className = ''; el.innerHTML = ''; el.onclick = null; done(); };
    setTimeout(() => el.classList.add('tapok'), T * 0.55); el.onclick = () => { if (el.classList.contains('tapok')) fin(); }; setTimeout(fin, T + 2200);
  },
  pullCards(res) {
    Snd.smp('summon', 0.5);
    /* 20:02 모집 결과: 글자가 한 자씩 줄바꿈(「새 영 웅!」) · 등급 차이가 안 보임 → 카드가 차례로 뒤집혀 나타나고, 등급 색 테두리 · 높은 등급은 빛, NEW 딱지 */
    const RO = { N: 0, R: 1, SR: 2, SSR: 3 };
    const html = `<h3>${L.hero.title}</h3><div class="res">${res.map((r, i) => { const h = JB.heroById(r.id), n = L.heroes[r.id], rk = RO[h.rarity] ?? 0; return `<div class="rc rk${rk}" style="animation-delay:${i * 0.09 + (rk >= 2 ? 0.25 : 0)}s">${r.isNew ? `<i class="nw">${L.ui.newTag}</i>` : ''}<img class="pf big" src="art/hero_${r.id}.webp" alt=""><b class="r${h.rarity}">${L.rarity[h.rarity]}</b><span class="hn">${n.name}</span><span class="lv">${r.isNew ? '' : L.hero.lvl(r.lv)}</span></div>`; }).join('')}</div>`;
    this.openModal(html);
    const fresh = res.find(r => r.isNew); if (fresh) { heroSay('join', fresh.id); const h = JB.heroById(fresh.id); if (h.rarity === 'SSR' || h.rarity === 'SR') { S.flash = 0.4; Snd.stamp(); if (h.rarity === 'SSR') { Snd.smp('ssr', 1); Snd.smp('v_' + fresh.id, 1, 1.4); } } }   /* 05:15 최고 등급 영웅은 첫 만남 목소리(드리미나 AI 오디오) */
  },
  altarOdds() {
    const rows = JB.ALTAR.map((a, lv) => JB.altarTable(lv));
    this.openModal(`<h3>${L.grave.title} · ${L.odds.title}</h3><table><tr><th>${L.odds.grade}</th>${rows.map((_, i) => `<th>${L.grave.altar(i)}</th>`).join('')}</tr>${L.grades.map((g, gi) => `<tr><td class="g${gi}">${g}</td>${rows.map(r => `<td>${r[gi] > 0 ? (r[gi] * 100).toFixed(r[gi] < 0.01 ? 2 : 1) + '%' : '—'}</td>`).join('')}</tr>`).join('')}</table><p class="muted">${L.ui.oddsClass(Object.values(L.classes).join('·'))}</p>`);
  },
  heroOdds() {
    const t = JB.probTable();
    this.openModal(`<h3>${L.hero.title} · ${L.odds.title}</h3><table>${t.map(r => `<tr><th class="r${r.rarity}">${L.rarity[r.rarity]}</th><th>${(r.p * 100).toFixed(1)}%</th></tr>${r.each.map(e => `<tr><td>&nbsp;&nbsp;${L.heroes[e.id].name}</td><td>${(e.p * 100).toFixed(2)}%</td></tr>`).join('')}`).join('')}</table><p class="muted">${L.hero.pity(JB.C.PITY)} · ${L.ui.ten}</p>`);
  },
  doAwaken() {
    if (!JB.canAwaken(st) || this.awakening) return;
    // 1단계(1.6초): 군단이 영혼이 되어 지배자에게 빨려 듦 → 2단계: 각성(설계서 「모습이 바뀐다」, 11-13 16:00)
    this.awakening = true; const LX = 196, LY = 470;
    Snd.smp('rise', 0.8, 0, 0.7); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => Snd.chime(f), 250 + i * 280));
    S.army.forEach((a, i) => { if (a.fly) return; const t = 0.7 + Math.random() * 0.8, x = a.x, y = a.y - 30;
      setTimeout(() => { a.gone = true; S.parts.push({ x, y, vx: (LX - x) / t, vy: (LY - y) / t, life: t, age: 0, size: rnd(3, 6), col: ['#c9a7ff', '#9fffd0', '#ffffff'][i % 3], g: 0, add: true, kind: 'dot', rot: 0, vr: 0, real: true }); }, Math.random() * 600); });
    const glow = setInterval(() => { S.lord.glow = Math.min(1, S.lord.glow + 0.08); S.shake = Math.max(S.shake, 3); }, 60);
    setTimeout(() => { clearInterval(glow); this.awakening = false; this.awakenNow(); }, 1600);
  },
  awakenNow() {
    const r = JB.awaken(st); if (!r) return;
    resetView(); S.milestone = 0; S.flash = 1; Snd.boom(); Snd.cheer(); Snd.voiceCd('v_awaken', 0, 0.7); S.calmUntil = S.t + 4.5; S.texts = S.texts.filter(t => t.screen);   /* 20:50 각성 이름 위로 싸움 숫자가 겹쳐 읽을 수 없었음 → 4.5초 동안 전장 숫자 끄고 어둡게 */
    say(L.rankName(st.awakens), W / 2, H / 2, { size: 90, col: '#fff3c4', glow: '#a46bff', life: 3.2, vy: 0, stamp: true, screen: true });
    this.toast(L.awaken.title, `${L.awaken.gain(r.gain)}${r.newSpell ? ' · ' + L.awaken.newSpell(L.spell[r.newSpell].name) : ''}`);
    this.feed(`${L.awaken.title}: ${L.rankName(st.awakens)}`); if (r.newSpell) st.spell = r.newSpell;
    setTimeout(() => say(L.awaken.kept, W / 2, H / 2 + 80, { size: 26, col: '#cfe9ff', life: 3, vy: 0, screen: true }), 900);
    setTimeout(() => heroSay('win'), 1500);
  },

  finger() {   /* 03:58 처음 1분 손가락 안내(대표님 순서 목록): 첫 각성 전 12판까지, 지금 눌러야 할 단추 하나를 손가락이 톡톡 두드림. 창이 열리면 숨김 */
    let f = $('finger'); if (!f) { f = document.createElement('div'); f.id = 'finger'; f.innerHTML = '<i class="rp"></i><img src="art/finger.webp" alt="" onerror="this.replaceWith(Object.assign(document.createElement(\'b\'),{textContent:\'👆\'}))">'; document.body.appendChild(f); }
    const early = !AUTO && !TRAILER && (!st.awakens && (st.best < 20 || JB.canAwaken(st)) || st.awakens === 1 && st.best < 8),   /* 첫 각성 바로 뒤 8판까지도: 강화가 처음으로 돌아간 걸 손가락으로 한 번 더(봇: 각성 뒤 3분 동안 강화 0) */   /* 05:30 첫 벽(15판)까지 */   /* 11-15 처음 10분 봇: 20판에 「각성할 수 있어요!」 글만 뜨고 손가락이 꺼져 3분 넘게 19↔20판을 오감(첫 각성을 못 찾음) → 첫 각성까지 각성 탭 · 각성 단추를 짚음 */ modal = $('modal') && $('modal').style.display === 'flex' || document.querySelector('.vsfx.on, #cutin.on');
    let t = null; if (early && !modal && JB.canAwaken(st) && !this.awakening) t = this.tab === 'awaken' ? document.querySelector('#tabbody [data-act="awaken"]:not([disabled])') : document.querySelector('#tabs [data-tab="awaken"]');
    if (!t && early && !modal) { const rb = $('raiseBtn'); t = rb && rb.style.display === 'block' ? rb : S.phase === 'prompt' ? $('cast') : document.querySelector('#tabbody .btn.hint:not([disabled]), #tabbody .ucard.hint, #tabs button.hint, #tools .hint');
      if (!t) {   /* 05:25 처음 5분 따라 하기: 안내 글이 끝난 뒤(군단이 알아서…를 세 번 보여 준 뒤) 살 수 있는 강화가 있어도 손가락이 사라져 28초 멈춤 · 군단 탭에서 뼛조각 76개를 들고 멈춤 → 지금 할 수 있는 것 하나를 계속 짚음 */
        const ks = Object.keys(JB.UPGRADES).filter(k => JB.unlocked(st, k) && st.souls >= JB.upCost(k, st.up[k])).sort((a, b) => JB.upCost(a, st.up[a]) - JB.upCost(b, st.up[b]));
        if (this.tab === 'grave') t = document.querySelector('#tabbody [data-act="graveAll"]:not([disabled])') || document.querySelector('#tabbody [data-act="grave"]:not([disabled])');
        if (!t && ks.length) { const cards = this.tab === 'up' ? ks.map(k => document.querySelector(`#tabbody .ucard[data-arg="${k}"]`)).filter(Boolean) : []; t = this.tab === 'up' ? cards[0] || null : document.querySelector('#tabs [data-tab="up"]'); }   /* 11-15 각성 뒤 가장 싼 강화가 카드로 안 보이는 것(수확)이면 손가락이 강화 탭 ↔ 각성 탭을 오갔음 → 카드로 보이는 것 중 가장 싼 것 */
        if (!t && this.tab === 'crypt') t = document.querySelector('#tabbody [data-act="dunGo"].gold, #tabbody [data-act="keepGo"].gold:not([disabled])');   /* 벽(15판)에서 100초 멈춤 → 빨간 점 난 탭 · 그 안의 금빛 단추 */
        if (!t) { const d = [...document.querySelectorAll('#tabs button')].find(b => b.querySelector('.dot') && b.dataset.tab !== this.tab); if (d) t = d; }
      } }
    if (t && t.offsetParent !== null) {   /* 11-15 대표님 사진 「머를 갈키는거야?」: 짚을 단추(영웅 모집)가 위 「목표」 띠 밑에 가려져 손가락이 띠를 가리킴(아래 탭 줄에 가려지는 것도 같은 일) → 손가락 자리에서 맨 위에 있는 게 그 단추인지 확인, 아니면 목록 칸만 굴려 가운데로, 그래도 가려지면 손가락을 안 띄움 */
      const spot = r => [r.left + r.width * 0.5, r.top + r.height * 0.55], seen = r => { const [x, y] = spot(r); if (!r.width || y < 0 || y > innerHeight) return false; const e = document.elementFromPoint(x, y); return !!e && (e === t || t.contains(e) || e.closest('#finger')); };
      let r = t.getBoundingClientRect();
      if (!seen(r) && !t.closest('#tabs, #tools, #stagewrap')) { let sc = t.parentElement; while (sc && sc !== document.body && !(sc.scrollHeight > sc.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
        if (sc && sc !== document.body) { const cr = sc.getBoundingClientRect(); sc.scrollTop += (r.top + r.height / 2) - (cr.top + cr.height / 2); r = t.getBoundingClientRect(); } }   /* 목록 칸만 굴림(화면 전체는 안 움직임) */
      if (seen(r)) { const [x, y] = spot(r); f.style.left = x + 'px'; f.style.top = y + 'px'; f.classList.add('on'); return; } }
    f.classList.remove('on');
  },
  guideText() {
    if (performance.now() < this.guideUntil && this.guideKey) return L.guide[this.guideKey];
    if (st.raised < JB.C.RAISE_TAPS) return '';   /* 19:47 큰 「일으켜라」 단추 바로 위에 같은 말 안내가 또 → 단추만 */
    if (S.phase === 'prompt') return L.guide.boss;
    if (JB.unlocked(st, 'hero') && !this.seenTab.hero) return L.guide.hero;
    if (JB.unlocked(st, 'grave') && st.graveCount === 0) return L.guide.grave;
    if (JB.canAwaken(st)) return L.guide.awaken;
    if (st.retreat) return this.wallTip();
    const k = Object.keys(JB.UPGRADES).find(k => JB.unlocked(st, k) && st.souls >= JB.upCost(k, st.up[k]));
    if (k && st.up.summon < 3) return L.guide.summon;
    /* 19:50 직접 플레이: 마정석 90개를 들고도 영웅 칸 둘이 비어 있었음 · 뼈 갈기 0단계로 15판 벽 → 할 만한 것을 한 번씩 짚어 줌 */
    if (JB.unlocked(st, 'hero') && st.gems >= JB.C.GACHA_COST && st.squad.filter(Boolean).length < 3 && !this.seenGachaTip) { this.seenGachaTip = 1; this.guide('gachaTip', 7); return L.guide.gachaTip; }
    if (JB.unlocked(st, 'bone') && st.up.bone * 3 < st.up.summon - 3 && st.up.summon >= 6 && st.souls >= JB.upCost('bone', st.up.bone) * 0.6 && (this.seenBoneTip || 0) < 3 && performance.now() - (this.boneTipT || 0) > 40000) { this.seenBoneTip = (this.seenBoneTip || 0) + 1; this.boneTipT = performance.now(); this.guide('boneTip', 7); return L.guide.boneTip; }   /* 19:58 직접 플레이: 소환만 15단계 · 뼈 갈기 0~1단계로 15판 벽 → 소환에 비해 뼈 갈기가 처지면 40초마다 세 번까지 */
    if ((st.seen.idleTip || 0) > 2) return '';   /* 19:36 「군단이 알아서 싸워요」가 2판 9에도 싸움터 가운데에 → 세 번 보여 준 뒤엔 그만 */
    return L.guide.idle;
  },
  // 벽 앞(물러난 동안): 지금 바로 할 수 있는 것 중 가장 센 것부터 한 줄로 이끎 (11-13 09:50: 19~20판 6분 벽이 '그냥 기다림'이 되지 않게)
  wallTip() {
    const G = L.guide.wall, grave = JB.unlocked(st, 'grave'), hero = JB.unlocked(st, 'hero');
    if (grave && st.bones >= 1) return G.bones(st.bones);
    const nx = JB.ALTAR[st.altar + 1]; if (grave && nx && !st.altarUntil && st.souls >= nx.cost) return G.altar;
    if (hero && st.squad.some(x => !x) && Object.keys(st.heroes).some(id => !st.squad.includes(id))) return G.squad;
    if (hero && st.gems >= JB.C.GACHA_COST) return G.pull(JB.C.GACHA_COST);
    if ((this.lossN || 0) >= 2 && grave && st.quickUsed < JB.C.QUICK_FREE) return L.guide.stuck;
    return L.guide.retreat;
  },
  render(force) {
    if (st.lab && st.lab.cur && Date.now() >= st.lab.cur.end) this.labDone();   // 연구는 실제 시간으로 끝남(자리를 비운 동안 끝난 것도 켜면 바로)
    if (this.autoGrave && st.bones > 0) this.raiseGrave(st.bones);
    // 위 숫자
    const boss = st.boss;
    $('hud').innerHTML = `<div class="r1"><span class="chip stg">${boss ? L.stageBoss(st.stage) : `${L.stage(st.stage)} <span class="pips">${Array.from({ length: JB.C.WAVES }, (_, i) => `<i class="${i < st.wave ? 'on' : i === st.wave ? 'now' : ''}"></i>`).join('')}</span> <small>${L.toBoss(JB.C.BOSS_EVERY - (st.stage % JB.C.BOSS_EVERY || JB.C.BOSS_EVERY) )}</small>`}</span><span class="chip" id="rank">${L.rankName(st.awakens)}</span><span class="sp"></span>${JB.unlocked(st, 'hero') ? `<span class="chip shopc" data-shop="1">${IC('b_shop')}${L.shop.btn}</span>` : ''}<span class="chip vip" data-vip="1">${IC('i_vip')}${L.vip.chip(JB.vipLv(st))}</span></div><div class="r2">`
      + `<span class="chip" title="${L.army}">${IC('i_army')}${JB.armySize(st).toLocaleString('ko-KR')}</span><span class="chip cur" data-cur="souls" title="${L.souls}">${IC('i_soul')}${fmt(st.souls)}</span>`
      + (JB.unlocked(st, 'grave') || JB.unlocked(st, 'gear') ? `<span class="chip cur" data-cur="bones" title="${L.bones}">${IC('i_bone')}${st.bones}</span>` : '') + `<span class="chip cur gem" data-cur="gems" title="${L.gems}">${IC('i_gem')}${st.gems}<b class="plus">+</b></span>`   /* 03:25 마정석은 처음부터 보이고 「+」(유료 재화 = 상점) · 뼛조각은 제단(4판)부터 */ + '</div>';   /* 위 띠 두 줄: 판 · 이름 · 귀빈 / 자원 넷. 자원은 그림 아이콘 + 숫자(글자 이름은 손가락 올리면) */
    // 거대한 적 체력
    const bb = $('bossbar');
    if (boss && ['fight', 'wait', 'cast'].includes(boss.phase) && S.giant.on && !S.giant.dead && !S.warn && !(S.phase === 'cast' && S.texts.some(t => t.screen && t.size >= 36))) {   /* 19:27 영창 글자와 보스 막대가 겹침 → 영창 글자가 떠 있는 동안은 숨김 */   /* 붉은 경고 띠가 지나간 뒤에(겹쳐 글자가 섞였음) */   /* 18:42: 싸움뿐 아니라 대마법이 꽂힐 때도 보여 막대가 확 깎이는 걸 보게 */
      bb.style.display = 'block'; const tr = JB.bossTraits(st.stage), v = clamp(st.hp / st.maxHp, 0, 1), pc = v * 100;
      bb.querySelector('.nm').textContent = L.boss.name(L.regions[regionOf(st.stage)], boss.lord);
      const tm = bb.querySelector('.tm'); tm.textContent = boss.phase === 'fight' ? '⏱ ' + L.boss.timer(Math.ceil(boss.timer)) : ''; tm.classList.toggle('low', boss.phase === 'fight' && boss.timer < 8);
      bb.querySelector('.pc').textContent = `${fmt(Math.max(0, st.hp))} · ${pc >= 10 ? Math.round(pc) : pc.toFixed(1)}%`;
      bb.querySelector('.t').textContent = tr.length ? tr.map(t => L.traits[t].n).join(' · ') + ' · ' + L.plan.bar(JB.matchMul(st).toFixed(1)) : '';
      bb.querySelector('.fill').style.width = bb.querySelector('.ghost').style.width = `${v * 100}%`;
      if (this.bbV != null && v < this.bbV - 0.002) { bb.classList.remove('hit'); void bb.offsetWidth; bb.classList.add('hit'); } this.bbV = v; }
    else { bb.style.display = 'none'; this.bbV = null; }
    { let sb = $('stbig'); if (!sb) { sb = document.createElement('div'); sb.id = 'stbig'; $('stagewrap').appendChild(sb); }   /* 21:45 대표님 「판이 너무 안 보인다」: 전장 위 가운데에 크게 「2-1」 + 무리 점 + 지역 · 보스까지 */
      const show = bb.style.display !== 'block' && !(boss && boss.phase !== 'done') && !TRAILER, key = show ? `${st.stage}|${st.wave}` : '';
      if (key !== this.sbK) { this.sbK = key; sb.style.display = show ? 'block' : 'none'; $('app').classList.toggle('stbig', show);
        if (show) { const left = JB.C.BOSS_EVERY - (st.stage % JB.C.BOSS_EVERY || JB.C.BOSS_EVERY); sb.innerHTML = `<div class="l1"><b>${L.stage(st.stage).replace('-', '<i class="dash"></i>')}</b><span class="pips">${Array.from({ length: JB.C.WAVES }, (_, i) => `<i class="${i < st.wave ? 'on' : i === st.wave ? 'now' : ''}"></i>`).join('')}</span></div><small>${L.regions[regionOf(st.stage)]} · ${L.toBoss(left)}</small>`; } } }
    { const cb = $('app'); if (cb) cb.classList.toggle('bigtxt', bb.style.display === 'block' || S.texts.some(t => t.screen && t.size >= 40 && t.age < t.life)); }   /* 18:55 화면 위 글자는 한 번에 하나: 큰 알림 · 보스 막대가 있으면 연속 처치는 잠깐 숨김(「망자 군단 10」과 겹쳤음) */
    // 일으켜라
    const rb = $('raiseBtn'); if (st.raised < JB.C.RAISE_TAPS && !AUTO) { rb.style.display = 'block'; rb.innerHTML = `${L.raise}<small>${L.raiseLeft(JB.C.RAISE_TAPS - st.raised)}</small>`; } else rb.style.display = 'none';
    // 새로 열림
    for (const k of Object.keys(JB.C.UNLOCK)) { const u = JB.unlocked(st, k); if (u && !this.prevUnlock[k] && !['crypt', 'map', 'lab'].includes(k)) { this.toast(L.unlock.title, L.unlock[k]); this.feed(`${L.unlock.title}: ${L.unlock[k]}`); Snd.chime(880); if (k === 'grave' || k === 'timing') this.guide(k); } this.prevUnlock[k] = u; }
    // 날짜로 여는 것(지하 묘지 · 침공 지도 · 마법 연구)은 켜는 순간 이미 열려 있을 수 있어서, 저장에 「알렸음」을 적어 두고 한 번은 꼭 알림
    { const ks = ['crypt', 'map', 'lab', 'squad4'].filter(k => JB.unlocked(st, k) && !st.seen['open_' + k]); if (ks.length) { for (const k of ks) { st.seen['open_' + k] = 1; this.seenTab[k === 'squad4' ? 'hero' : 'crypt'] = 0; } const t = ks.map(k => L.unlock[k]).join(' · '); this.toast(L.unlock.title, t); this.feed(`${L.unlock.title}: ${t}`); Snd.chime(988); this.guide(ks[0]); } }   /* 한꺼번에 여럿 열리면(오래 비웠다 돌아옴) 알림 하나로 묶음 */
    { const t = this.guideText(), el = $('guide'), now = performance.now(); if (t !== this.gT) { this.gT = t; this.gT0 = now; el.textContent = t; if (t === L.guide.idle) st.seen.idleTip = (st.seen.idleTip || 0) + 1; }   /* 11-14 같은 안내가 6초 넘게 싸움터 가운데를 가리지 않게: 6초 뒤 흐려짐, 글이 바뀌면 다시 보임. 보스전(대마법 기다림 빼고)엔 숨김 */
      el.classList.toggle('dim', now - this.gT0 > 6000 || !!S.bubble || (S.giant && S.giant.on && S.phase !== 'prompt') || !!S.warn || S.texts.some(x => x.screen && x.size >= 40 && x.age < x.life)); }   /* 18:10 「거대한 적이 나타났다」 같은 큰 글자와 겹치면 숨김 */
    this.skillRow(); this.goalRow(); { const n = (S.fallen || []).filter(c => c.t < 2.6).length, b = $('reraise'); b.classList.toggle('on', n >= 3); const h = L.foes.raise(n); if (n >= 3 && b.dataset.w !== h) { b.dataset.w = h; b.textContent = h; } }   /* 11-14: 스킬 칸 · 목표 한 칸 */
    // 탭
    [...$('tabs').children].forEach(b => { const k = b.dataset.tab, open = this.tabOpen(k); b.classList.toggle('on', k === this.tab); b.classList.toggle('lock', !open); const dot = open && !this.seenTab[k] && k !== 'up' || (k === 'mission' && open && (st.missions.some((v, i) => !st.missionDone[i] && v >= JB.MISSIONS[i].need) || JB.mailList(st).length > 0)) || (k === 'awaken' && JB.canAwaken(st)) || (k === 'crypt' && open && ((JB.unlocked(st, 'crypt') && st.crypt.keys > 0 && JB.cryptPower(st) >= JB.cryptHp(st.crypt.floor + 1)) || (JB.unlocked(st, 'map') && st.map.tokens > 0 && (st.peak || st.best) >= JB.mapNeed(st.map.taken)) || (JB.unlocked(st, 'lab') && !st.lab.cur) || (JB.unlocked(st, 'keep') && !JB.keepOf(st).bld && JB.KEEP.ids.some(id => { const c = JB.keepCost(st, id); return JB.keepLv(st, id) < JB.KEEP.max[id] && st.souls >= c.souls && st.bones >= c.bones; })) || (JB.unlocked(st, 'dungeon') && JB.DUNGEON.list.some(d => JB.dunOf(st).keys[d.id] > 0 && (JB.dunOf(st).lv[d.id] > 0 || JB.dunPower(st) >= JB.dunHp(d.id, 1)))))); const want = (dot ? 1 : 0) + ':' + k; if (b.dataset.w !== want) { b.dataset.w = want; b.innerHTML = `<img class="tic" src="art/${TI_ART[k]}.webp" alt="" onerror="this.remove()"><span>${L.tabs[k]}</span>` + (dot ? '<i class="dot"></i>' : ''); } });   /* 그림 아이콘 + 글자, 바뀔 때만 다시 그림 */
    if (!this.tabOpen(this.tab)) this.tab = 'up';
    // 누르는 중에는 다시 그리지 않음(누르고 떼는 사이에 단추가 바뀌면 눌림이 사라짐 — 11-13 09:55 시험에서 찾음), 같은 내용이면 건드리지 않음
    if (this.ptrDown && !force) return;
    if (!this.tipSeen) this.tipSeen = {}; if (this.tab !== this.tipTab) { this.tipTab = this.tab; this.tipSeen[this.tab] = (this.tipSeen[this.tab] || 0) + 1; }   /* 21:58 대표님 「항목별 불편」: 탭 설명 줄은 그 탭을 처음 두 번 열 때만 */
    const tip = L.tabTip && L.tabTip[this.tab] && !['up', 'mission'].includes(this.tab) && this.tipSeen[this.tab] <= 2 ? `<div class="ttip"><b>${L.tabs[this.tab]}</b> ${L.tabTip[this.tab]}</div>` : '';   /* 19:12 탭마다 맨 위 한 줄 설명 */
    { const pn = $('panel'); if (pn && pn.dataset.t !== this.tab) { pn.dataset.t = this.tab; pn.className = 't-' + this.tab; } }
    const html = tip + this['tab_' + this.tab](); if (html !== this.lastBody) { $('tabbody').innerHTML = html; this.lastBody = html; }
    /* 안내 줄이 「소환」을 말하면 그 단추가 금빛으로 깜빡임(16:05 첫 흐름 화면: 안내만 있고 단추가 안 보여 군단 10에 멈춤) */
    { const g = this.guideText(), ks = Object.keys(JB.UPGRADES).filter(k => JB.unlocked(st, k) && st.souls >= JB.upCost(k, st.up[k])).sort((a, b) => JB.upCost(a, st.up[a]) - JB.upCost(b, st.up[b]));
      const canClaim = JB.unlocked(st, 'mission') && JB.MISSIONS.some((m, i) => !st.missionDone[i] && st.missions[i] >= m.need), canPull = JB.unlocked(st, 'hero') && (st.gems >= JB.C.GACHA_COST || (st.free10 || 0) > 0);
      const nb = Math.ceil(Math.max(st.stage, 1) / JB.C.BOSS_EVERY) * JB.C.BOSS_EVERY, planBetter = nb - st.stage <= 2 && JB.bossTraits(nb).length && JB.matchMul(st, nb, JB.bestSquad(st, nb)) > JB.matchMul(st, nb) + 0.15;   /* 보스 2판 앞인데 더 센 조합이 있으면 */
      { const pb = document.querySelector('#tabbody [data-act="bestSquad"]'); if (pb) pb.classList.toggle('hint', !!planBetter); }
      const tabWant = JB.canAwaken(st) && !this.awakening ? 'awaken' : planBetter ? 'hero' : g === L.guide.hero ? 'hero' : g === L.guide.grave ? 'grave' : !st.awakens && canClaim ? 'mission' : !st.awakens && canPull ? 'hero' : null;   /* 18:05 처음 10분 재기: 229초부터 64초 동안 누를 게 없었음 → 받을 임무 · 할 수 있는 계약(뽑기)도 탭을 깜빡임 */   /* 「수하가 생겼어요」 · 「무덤」 안내 땐 그 탭이 깜빡임(17:35 첫 6분 봇: 안내가 4분 반 멈춰 있었음) */
      const want = g === L.guide.summon ? 'summon' : g === L.guide.boneTip ? 'bone' : ((g === L.guide.idle || tabWant) && !st.awakens && !st.autoUp && ks.length) ? ks[0] : null;   /* 첫 각성 전엔 「강화하세요」 · 새 탭 안내 때도 가장 싼 강화를 깜빡임(16:10 첫 흐름: 소환 3단계 뒤 손을 놓아 버림) */
      for (const b of document.querySelectorAll('#tabbody [data-act=buy]')) b.classList.toggle('hint', b.dataset.arg === want && !b.disabled);
      for (const b of $('tabs').children) b.classList.toggle('hint', b.dataset.tab === tabWant && this.tab !== tabWant);
      { const ab = document.querySelector('#tabbody [data-act="awaken"]'); if (ab) ab.classList.toggle('hint', !ab.disabled); }
      { const gb = document.querySelector('#tabbody [data-act="grave"]'); if (gb) gb.classList.toggle('hint', g === L.guide.grave && !gb.disabled); }
      for (const cb of document.querySelectorAll('#tabbody [data-act="claim"]')) cb.classList.toggle('hint', !st.awakens && !cb.disabled);
      { const any = !!document.querySelector('#tabbody .btn.hint, #tabs button.hint'), qb = document.querySelector('#tools [data-x="quick"]'); if (qb) qb.classList.toggle('hint', !any && !st.awakens && JB.quickCost(st) === 0 && S.t - (S.lastNew || 0) > 30); }   /* 누를 게 없이 30초 넘으면 무료 「빠른 보상」을 깜빡임 */
      { const pb = document.querySelector('#tabbody [data-act="pull10"]:not([disabled])') || document.querySelector('#tabbody [data-act="pull1"]:not([disabled])'); for (const x of document.querySelectorAll('#tabbody [data-act^="pull"]')) x.classList.toggle('hint', x === pb && !st.awakens); }
      this.finger();   /* 무덤 탭을 열어도 「일으키기」를 못 찾아 3분 멈춤(17:55 봇) → 그 단추도 깜빡임 */ }
  },
  setFold(on) {   /* 11-14 11:28 대표님 「게임도 잘 보여야」: 지금 탭을 한 번 더 누르면 전장 크게 ↔ 목록 크게(장르 흔한 방식: 아래 창 높이 바꾸기) */
    document.getElementById('app').classList.toggle('fold', on); const tl = on && document.getElementById('app').classList.contains('tall'); VW.y = on ? (tl ? 215 : 245) : 168; VW.h = on ? (tl ? 640 : 610) : 542; VW.x = on ? 30 : 95; VW.w = on ? 1100 : 799;   /* 11-15 대표님 「배치 넓게 위아래」: 폰에선 아래 기술 단추 줄(64)이 땅 아래쪽을 덮어 위아래로 벌릴 자리가 없었음 → 카메라를 55 내려 땅 전체가 단추 위로 오게 */   /* 21:59 다른 게임 비교: 폰에서 위 하늘을 조금 더 잘라 캐릭터 약 5% 크게(가로세로 비율 그대로 840:570) */   /* 11-14 18:40 대표님 「좀 먼 화면, 나는 왼쪽 끝 부근 · 상대는 오른쪽 끝 부근」: 30~1130을 다 보이게(캐릭터 약 22% 작게) */   /* 11-14 18:24 대표님 「캐릭터가 뒤에 있어야 더 잘 보이지 않나」(캡처: 위는 빈 하늘, 캐릭터는 아래 단추에 가림) → 하늘을 덜 보이고 캐릭터를 단추 위로 올림. 클로드 앱 안(384×665)은 tall이 아니라 지난번 840폭 고침이 안 먹었던 것도 같이 */   /* 11-14 18:05 대표님 「너무 확대 같지 않어?」(캡처 8장) → 840폭(16:30 전 폭)으로. 17:45 「보이지도 않는데, 너무 확대」: 640폭이면 거인(가운데 800)이 화면 오른쪽 끝(790) 밖으로 반쯤 나갔음 → 770폭으로 넓히고 거인 자리도 안쪽으로 */   /* 11-14 16:31 「화면이 너무 좁아 재미없다」: 세로 휴대폰은 전장을 당겨 캐릭터 약 25% 크게 */ requestAnimationFrame(() => resize()); try { localStorage.setItem('jb_fold2', on ? '1' : '0'); } catch (e) {}
  },
  skillRow() {
    const sb = $('skillbar'), raise = $('raiseBtn').style.display === 'block'; sb.classList.toggle('raise', raise); if (raise) return;
    const au = JB.unlocked(st, 'autoCast'), ks = Object.keys(JB.SPELLS), rn = (S.fallen || []).filter(c => c.t < 2.6).length;
    const h = (rn >= 3 ? `<button data-sk="rer" class="rer">${L.foes.rerS}<b>${rn}</b></button>` : '') +   /* 00:30 「일으켜라 · 쓰러진 망자병」 알약이 어디 둬도 말풍선 · 단추 · 이름표와 겹침 → 기술 줄의 둥근 단추로 */ (au ? `<button data-sk="auto" class="auto ${st.autoCast ? '' : 'off'}">${L.spell.autoS}</button>` : '') +   /* 19:26 잠긴 자동 칸이 「각성 2」로 보여 헷갈림(실제론 대마법 3번이면 열림) → 열리기 전엔 숨김 */ (() => { let lk = 0; return ks.map(k => JB.spellUnlocked(st, k) ? `<button data-sk="${k}" class="${st.spell === k ? 'on' : ''}">${L.spell[k].s}</button>` : lk++ ? '' : `<button class="lock" data-sk="lock:${k}">${L.spell.lockS(JB.SPELLS[k].unlock)}</button>`).join(''); })();   /* 11-14: 잠긴 칸이 줄줄이 있어 어수선 → 다음 하나만 */
    if ($('slots').dataset.w !== h) { $('slots').dataset.w = h; $('slots').innerHTML = h; }
  },
  goalRow() {
    let h = '', ready = false;
    if (JB.unlocked(st, 'mission')) {
      const i0 = JB.MISSIONS.findIndex((m, i) => !st.missionDone[i] && st.missions[i] >= m.need), i = i0 >= 0 ? i0 : JB.MISSIONS.findIndex((m, j) => !st.missionDone[j]);
      if (i >= 0) { const m = JB.MISSIONS[i], v = Math.min(st.missions[i], m.need); ready = i0 >= 0; h = `<span class="gk">${L.mission.title}</span><span class="gt">${L.mission.names[m.id](m.need)}</span><span class="gb"><i style="width:${v / m.need * 100}%"></i></span><span class="gr" data-gi="${i}">${ready ? L.mission.claim : `${IC('i_gem')}${m.gems}`}</span>`; }
    }
    if (!h) { const nx = Object.entries(JB.C.UNLOCK).filter(([k, v]) => v > st.best && L.unlock[k] && !['map', 'lab', 'autoCast', 'crypt'].includes(k)).sort((a, b) => a[1] - b[1])[0];
      if (nx) h = `<span class="gk">${L.spell.goal}</span><span class="gt">${L.spell.goalNext(nx[1], L.unlock[nx[0]])}</span><span class="gb"><i style="width:${Math.min(1, st.best / nx[1]) * 100}%"></i></span>`; }
    if (this.tab === 'mission') h = '';   /* 11-14 임무 탭에선 같은 임무가 두 번 보여 위 막대를 숨김 */
    const g = $('goal'); g.classList.toggle('ready', ready); if (g.dataset.w !== h) { g.dataset.w = h; g.innerHTML = h; }
  },
  tab_up() {   /* 11-14 11:36 대표님 「그래도 불편, 최적 찾아봐」: 장르 표준 강화 목록 — 같은 높이 줄(그림 · 이름 · 단계 · 효과 · 값 단추), 위에 ×1 / ×10 / 최대, 정보 줄은 맨 아래 작은 칩으로 */
    const keys = Object.keys(JB.UPGRADES).sort((a, b) => (b === 'magic') - (a === 'magic')), shut = keys.filter(k => !JB.unlocked(st, k)).sort((a, b) => JB.C.UNLOCK[a] - JB.C.UNLOCK[b]);
    const B = this.bulk || 1, cnt = k => { if (B === 1) return 1; let n = 0, s = st.souls, lv = st.up[k]; while (n < (B === 10 ? 10 : 999)) { const c = JB.upCost(k, lv + n); if (s < c) break; s -= c; n++; } return n; };
    const sum = (k, n) => { let t = 0; for (let i = 0; i < Math.max(1, n); i++) t += JB.upCost(k, st.up[k] + i); return t; };
    const head = `<div class="bulk">${[1, 10, 0].map(b => `<button data-act="bulk" data-arg="${b}" class="${B === (b || 999) ? 'on' : ''}">${b ? '×' + b : L.ui.bulkMax}</button>`).join('')}</div>`;
    /* 00:58 대표님 「버섯커처럼 아래가 그림 칸 · 간단」: 글자 줄 목록 → 큰 그림 카드 한 줄(그림 · 이름 · 단계 · 짧은 효과 · 값 단추). 지팡이는 금테 */
    const vis = keys.filter(k => !shut.includes(k) || k === shut[0]);
    const rows = `<div class="ucards" style="grid-template-columns:repeat(${vis.length},minmax(0,1fr))">` + vis.map(k => {
      const u = L.ups[k], lv = st.up[k];
      if (!JB.unlocked(st, k)) return `<div class="ucard off"><img src="art/u_${k}.webp" alt=""><div class="un">${u.name}</div><div class="ul">${L.lockedAt(JB.C.UNLOCK[k])}</div></div>`;
      const n = cnt(k), c = sum(k, n), tier = Math.min(5, Math.floor(lv / 10)), isM = k === 'magic';
      const eff = { summon: () => L.ui.armyN(JB.armySize(st)), bone: () => '×' + fmt(JB.unitAtk(st)), magic: () => '×' + fmt(Math.pow(JB.C.MAGIC_MUL, lv)), harvest: () => '×' + fmt(Math.pow(JB.C.HARVEST_MUL, lv)) }[k]();
      const name = isM ? `<b class="st${tier}">${L.staff.tiers[tier]}</b>` : u.name, ic = isM ? `art/st_${tier}.webp` : `art/u_${k}.webp`, ok = n >= 1 && st.souls >= c;
      return `<div class="ucard${isM ? ' main t' + tier : ''}${ok ? ' can' : ''}" data-act="buy" data-arg="${k}"><span class="ulv">${L.lv(lv)}</span><img src="${ic}" alt=""><div class="un">${name}</div><div class="ue">${eff}</div><button class="btn buy${isM ? ' gold' : ''}" data-act="buy" data-arg="${k}" style="--p:${Math.floor(clamp(st.souls / Math.max(1, c), 0, 1) * 10) * 10}%" ${ok ? '' : 'disabled'}>${n > 1 ? `<small>×${n}</small>` : ''}${IC('i_soul')}${fmt(c)}</button></div>`;
    }).join('') + '</div>' + (shut.length > 1 ? `<p class="muted mini">${L.moreLocked(shut.length - 1)}</p>` : '');
    const dex = JB.dexOf(st), dn = dex.f.filter(Boolean).length + dex.l.filter(Boolean).length;
    const evo = JB.armySize(st) >= JB.C.EVO.minArmy ? `<div class="row ur"><img class="uic" src="art/cls0.webp" alt=""><div class="grow"><div class="nm">${L.evo.title} <span class="lvb">${L.evo.mul(JB.evoMul(st).toFixed(2))}</span></div><div class="bar2"><i style="width:${(st.evoXp || 0) / JB.C.EVO.waves * 100}%"></i></div><div class="ds">${L.evo.next(JB.C.EVO.waves - (st.evoXp || 0))}</div></div><button class="btn buy gold" data-act="evoAd" ${(st.evoAd || 0) >= JB.C.EVO.adMax ? 'disabled' : ''}>${L.ui.evoAdShort}<small>${st.evoAd || 0}/${JB.C.EVO.adMax}</small></button></div>` : '';
    const lsn = JB.LSKINS.filter(s => JB.lskinOwned(st, s.id)).length;
    const chips = `<div class="chips"><button class="chip2 lsk" data-act="lskin">${L.lskin.chip(lsn, JB.LSKINS.length, Math.round(JB.lskinBonus(st) * 100))} ›</button><button class="chip2" data-act="dex">${L.ui.dexChip(dn, JB.C.RISE.regions * 2, JB.dexMul(st).toFixed(2))}</button><button class="chip2 pwr" data-act="power">${L.power.chip} ›</button></div>`;
    return head + rows + this.gearBox() + evo + chips;
  },
  gearBox() {   /* 22:50 지배자 장비 6칸: 등급 색 테두리 · +강화 · 효과. 아래에 뽑기 · 광고 · 모두 강화 */
    if (!JB.unlocked(st, 'gear')) return `<div class="gearbox off"><div class="gh">${L.gear.title}</div><p class="muted mini">${L.gear.lockAt(L.stage(JB.C.UNLOCK.gear))}</p></div>`;
    const G = JB.gearOf(st), ART_OF = { staff: 'gear_staff', crown: 'gear_crown', ring: 'gear_ring', armor: 'gear_armor', amulet: 'gear_amulet', cloak: 'gear_cloak' };   /* 23:05 드리미나로 만든 장비 전용 아이콘 */
    const cells = JB.GEAR_SLOTS.map(sl => { const it = G.slots[sl.id]; return `<button class="gslot ${it ? 'g' + it.g : 'emp'}" data-act="gearSlot" data-arg="${sl.id}"><img src="art/${ART_OF[sl.id]}.webp" alt="">${it ? `<b class="glv">+${it.lv || 0}</b><i class="ggr">${L.gear.grades[it.g]}</i>` : `<i class="ggr">${L.gear.slots[sl.id]}</i>`}</button>`; }).join('');
    const adLeft = G.adDay === st.day ? JB.GEAR.adMax - G.ad : JB.GEAR.adMax;
    return `<div class="gearbox"><div class="gh">${L.gear.title}<span class="gst">${L.gear.stones(G.stones)}</span></div><div class="gslots">${cells}</div>
      <button class="btn big altar" data-act="altar1" ${st.bones < 1 ? 'disabled' : ''}><img src="art/i_bone.webp" alt=""><span><b>${L.gear.altar}</b><small>${L.gear.altarSub(st.bones, JB.altarLv(st))}</small></span></button><div class="gbtns">${st.bones >= 2 ? `<button class="btn" data-act="altarAll">${L.gear.altarAll(Math.min(st.bones, 10))}</button>` : ''}<button class="btn gold" data-act="gearPull10" ${st.gems < JB.GEAR.pull10 ? 'disabled' : ''}>${L.gear.pull10}<small>${L.gems} ${JB.GEAR.pull10}</small></button>${adLeft > 0 ? `<button class="btn" data-act="gearAd">${L.gear.ad(adLeft, JB.GEAR.adMax)}</button>` : ''}<button class="btn" data-act="gearUpAll" ${G.stones < 3 ? 'disabled' : ''}>${L.gear.upAll}</button></div></div>`;
  },
  lskinOpen() {   /* 23:00 지배자 겉모습: 미리 보기(지배자 그림 첫 장에 색) · 얻는 법 · 보유 효과 · 입기 */
    const LSF = { blood: 'hue-rotate(80deg) saturate(1.4)', frost: 'hue-rotate(-60deg) saturate(1.1) brightness(1.1)', plague: 'hue-rotate(-165deg) saturate(1.3)', shadow: 'grayscale(.75) contrast(1.25) brightness(.9)', gold: 'sepia(.7) saturate(2.2) hue-rotate(-12deg) brightness(1.1)' };
    const cur = st.lskin || 'void';
    const cards = JB.LSKINS.map(s => { const own = JB.lskinOwned(st, s.id); return `<div class="lsc${own ? '' : ' off'}${cur === s.id ? ' on' : ''}"><div class="lsp" style="filter:${own ? (LSF[s.id] || 'none') : 'grayscale(1) brightness(.35)'}"></div><b>${L.lskin.names[s.id]}</b><small>${s.bonus ? L.lskin.bonus(Math.round(s.bonus * 100)) : '&nbsp;'}</small>${own ? (cur === s.id ? `<span class="muted mini">${L.lskin.worn}</span>` : `<button class="btn" data-act="lskinWear" data-arg="${s.id}">${L.lskin.wear}</button>`) : `<span class="muted mini">🔒 ${L.lskin.how[s.id]}</span>`}</div>`; }).join('');
    this.openModal(`<h3>${L.lskin.title}</h3><p style="text-align:center;font-weight:800;color:#ffe9a6">${L.lskin.own(Math.round(JB.lskinBonus(st) * 100))}</p><div class="lsgrid">${cards}</div><p class="muted mini" style="text-align:center">${L.lskin.hint}</p>`);
  },
  gearInfo(id) {
    const G = JB.gearOf(st), it = G.slots[id], sl = JB.GEAR_SLOTS.find(s => s.id === id);
    const val = it ? JB.gearVal(it, sl) : 0, pc = sl.stat === 'cd' ? Math.round(val / (1 + val) * 100) : Math.round(val * 100);
    this.openModal(`<h3>${L.gear.slots[id]}</h3>${it ? `<p style="text-align:center"><b class="gq g${it.g}">${L.gear.grades[it.g]} ${L.gear.slots[id]} +${it.lv || 0}</b></p><p style="text-align:center">${L.gear.stat[sl.stat]} +${pc}%<br><span class="muted">${L.gear.ilv(L.stage(it.ilv))}</span></p>
      ${(it.lv || 0) < JB.GEAR.maxLv ? `<button class="btn big gold" data-act="gearUp" data-arg="${id}" ${G.stones < JB.gearUpCost(it) ? 'disabled' : ''} style="width:100%">${L.gear.up(JB.gearUpCost(it))}</button>` : `<p class="muted" style="text-align:center">${L.gear.max}</p>`}` : `<p class="muted" style="text-align:center">${L.gear.empty}</p>`}<p class="muted mini" style="text-align:center">${L.gear.hint}</p>`);
  },
  gearGot(list) {   /* 장비 얻음: 좋은 것만 크게 알림, 나머지는 작은 줄 */
    const best = list.slice().sort((a, b) => b.it.g - a.it.g)[0]; if (!best) return;
    const t = L.gear.got(L.gear.grades[best.it.g], L.gear.slots[best.it.slot]) + (best.equipped ? ' · ' + L.gear.on : ''), sv = list.reduce((a, r) => a + (r.equipped ? 0 : r.stones), 0);
    this.toast(L.gear.title, t + (sv ? ` · ${L.gear.salv(sv)}` : '')); if (best.it.g >= 3) { Snd.chime(1568); } else Snd.chime(1175);
    if (this.tab === 'up') this.render(true);
  },
  tab_grave() {
    const now = Date.now(), alt = st.altar, nx = JB.ALTAR[alt + 1];
    const slots = JB.CLASSES.map((c, i) => { const g = st.grave[i]; return `<div class="slot${g >= 0 ? ' s' + g : ' emp'}"><img class="ci" src="art/cls${i}.webp" alt=""><b class="${g >= 0 ? 'g' + g : ''}">${g >= 0 ? L.grades[g] : L.grave.empty}</b>${L.classes[c]}</div>`; }).join('');
    const lg = this.lastGrave; const last = lg ? `<p>${lg.n > 1 ? L.ui.times(lg.n) : ''}<b class="g${lg.r.grade}">${L.grades[lg.r.grade]} ${L.classes[JB.CLASSES[lg.r.cls]]}</b> — ${lg.better ? L.grave.better : L.grave.worse(fmt(lg.souls))}</p>` : '';
    const altarBtn = st.altarUntil ? `<button class="btn" disabled>${L.grave.altarWait(L.time(Math.ceil((st.altarUntil - now) / 1000)))}</button><button class="btn gold" data-act="altarRush" ${st.gems < JB.altarGems(st, now) ? 'disabled' : ''}>${L.lab.rush(JB.altarGems(st, now))}</button>` : nx ? `<button class="btn" data-act="altar" ${st.souls < nx.cost ? 'disabled' : ''}>${L.grave.altarUp(fmt(nx.cost))}</button>` : `<span class="muted">${L.grave.altarMax}</span>`;
    return `<div class="row"><div class="grow"><div class="nm">${L.grave.title}</div><div class="ds">${L.bones} ${st.bones} · ${L.ui.graveMul} ×${JB.graveMul(st).toFixed(2)}</div></div><button class="btn" data-act="autoGrave">${L.grave.auto} ${this.autoGrave ? L.settings.on : L.settings.off}</button></div>
      <div class="gbtns"><button class="btn big gold" data-act="grave" ${st.bones < 1 ? 'disabled' : ''}>${L.grave.raiseBtn} <small>(${L.grave.cost})</small></button>${st.bones > 1 ? `<button class="btn big" data-act="graveAll">${L.ui.raiseAll(st.bones)}</button>` : ''}</div>
      <div class="slots">${slots}</div>
      ${(st.adBones || 0) < JB.C.AD_BONES.max ? `<button class="btn" style="width:100%;margin-top:.4em" data-act="adBones">${L.grave.adBones(JB.C.AD_BONES.n, st.adBones || 0, JB.C.AD_BONES.max)}</button>` : ''}
      ${last}
      <div class="row"><div class="grow"><div class="nm">${L.grave.altar(alt)}</div><div class="ds">${L.ui.graveHint}</div></div>${altarBtn}</div>
      <button class="btn" data-act="altarOdds">${L.grave.odds}</button>`;
  },
  tab_hero() {
    const cc = JB.country(navigator.language), allowed = JB.gachaAllowed(Q.get('country') || cc);
    const squad = st.squad.map((id, i) => `<div class="slot sq">${id ? `<img class="pf" src="art/hero_${id}.webp" alt="">` : '<i class="pfe"></i>'}<div class="sqt"><span class="muted">${L.hero.slot[i]}</span><b class="${id ? 'r' + JB.heroById(id).rarity : ''}">${id ? L.heroes[id].name : '—'}${id && st.heroes[id].wp ? ` <span class="wt t${Math.ceil(st.heroes[id].wp / 2)}">+${st.heroes[id].wp}</span>` : ''}</b><small>${id ? L.stat[JB.heroById(id).stat] : ''}</small></div></div>`).join('');   /* 21:45 대표님 「영웅 탭 너무 확대돼 크다」: 얼굴 작게 왼쪽 + 글자 오른쪽, 칸 높이 절반 */
    const owned = JB.HEROES.filter(h => st.heroes[h.id]).map(h => { const o = st.heroes[h.id], inS = st.squad.includes(h.id); return `<div class="row"><img class="pf r${h.rarity}" src="art/hero_${h.id}.webp" alt=""><div class="grow"><div class="nm"><b class="r${h.rarity}">${L.heroes[h.id].name}</b> <span class="role">${L.roles[JB.ROLE[h.id]]}</span> <span class="muted">${L.rarity[h.rarity]} · ${L.hero.lvl(o.lv)}</span></div><div class="ds">${L.stat[h.stat]} +${Math.round(JB.RARITY[h.rarity].bonus * (1 + 0.5 * (o.lv - 1)) * (1 + JB.C.WEAPON.mul * (o.wp || 0)) * 100)}%</div>${this.wpLine(h.id, o)}${this.skinLine(h.id)}</div>${inS ? `<span class="muted">${L.ui.inForm}</span>` : `<button class="btn" data-act="squad" data-arg="${h.id}">${L.ui.toForm}</button>`}</div>`; }).join('') || `<p class="muted">${L.hero.none}</p>`;
    const buy = allowed ? `<div style="display:flex;gap:.5em"><button class="btn big" data-act="pull1" ${st.gems < JB.C.GACHA_COST ? 'disabled' : ''}>${L.hero.contract1}<br><small>${L.gems} ${JB.C.GACHA_COST}</small></button><button class="btn big gold" data-act="pull10" ${st.gems < JB.C.GACHA10_COST && !st.free10 ? 'disabled' : ''}>${L.hero.contract10}<br><small>${st.free10 ? L.hero.free10 : `${L.gems} ${JB.C.GACHA10_COST}`}</small></button></div><p class="muted">${L.hero.pity(JB.C.PITY - st.pity)} · <a href="#" data-act="heroOdds" style="color:#c9a7ff">${L.hero.odds}</a></p>`
      : `<p class="muted">${L.hero.blocked}</p>` + JB.HEROES.map(h => `<div class="row"><div class="grow">${L.heroes[h.id].name}</div><button class="btn" data-act="direct" data-arg="${h.id}" ${st.gems < JB.C.DIRECT_PRICE[h.rarity] ? 'disabled' : ''}>${L.hero.direct} ${JB.C.DIRECT_PRICE[h.rarity]}</button></div>`).join('');
    const bondsHid = JB.BONDS.filter(x => !(st.heroes[x.a] && st.heroes[x.b])).length;   /* 21:55 인연은 두 영웅을 다 가진 것만 펼치고 나머지는 한 줄로 */
    const bonds = JB.BONDS.filter(x => st.heroes[x.a] && st.heroes[x.b]).map(x => { const on = JB.bondsOn(st).includes(x), own = st.heroes[x.a] && st.heroes[x.b]; return `<div class="row"><div class="grow"><div class="nm" style="${on ? 'color:var(--gold)' : ''}">${on ? '✦ ' : ''}${L.bonds[x.id].name}</div><div class="ds">${L.heroes[x.a].name} + ${L.heroes[x.b].name} · ${L.stat[x.stat]} +${Math.round(x.bonus * 100)}%${own ? '' : L.ui.bondMissing}</div></div></div>`; }).join('');
    const nb = Math.ceil(Math.max(st.stage, 1) / JB.C.BOSS_EVERY) * JB.C.BOSS_EVERY, tr = JB.bossTraits(nb), mm = JB.matchMul(st, nb), bs = JB.bestSquad(st, nb), bm = JB.matchMul(st, nb, bs), better = bm > mm + 0.01;
    const plan = tr.length ? `<div class="plan"><div class="nm">${L.plan.title(nb)}</div>${tr.map(t => `<div class="ds"><b class="tr">${L.traits[t].n}</b> ${L.traits[t].d}</div>`).join('')}<div class="row" style="border:0;padding:.3em 0 0"><div class="grow"><b class="${mm >= 1.2 ? 'good' : mm < 0.95 ? 'bad' : ''}">${L.plan.match(mm.toFixed(2))}</b>${better ? `<div class="ds">${L.plan.could(bm.toFixed(2))}</div>` : ''}</div>${better ? `<button class="btn gold" data-act="bestSquad" data-arg="${nb}">${L.plan.best}</button>` : ''}<button class="btn" data-act="autoSquad">${L.plan.auto} ${st.settings.autoSquad ? L.settings.on : L.settings.off}</button></div></div>` : '';   /* 다음 보스 작전: 특징 · 지금 상성 · 추천 진형 */
    const wpAll = st.squad.some(id => id && st.heroes[id]) ? `<button class="btn" data-act="wpAll" style="width:100%;margin:.3em 0">${L.weapon.allBtn}</button>` : '';
    return plan + `<div class="muted">${L.hero.squad}</div><div class="slots" style="grid-template-columns:repeat(${st.squad.length},1fr)">${squad}</div>${buy}${wpAll}<div class="muted" style="margin-top:.5em">${L.hero.owned}</div>${owned}<div class="muted" style="margin-top:.6em">${L.bonds.title}</div>${bonds}${bondsHid ? `<div class="ds muted" style="margin:.2em .5em">${L.ui.bondsMore(bondsHid)}</div>` : ''}<div class="muted" style="margin-top:.6em">${L.hero.dex(Object.keys(st.heroes).length, JB.HEROES.length)}</div><div class="dex">${JB.HEROES.map(h => { const o = st.heroes[h.id]; return `<div class="${o ? '' : 'off'}"><img class="pf" src="art/hero_${h.id}.webp" alt=""><b class="r${h.rarity}">${o ? L.heroes[h.id].name : '?'}</b></div>`; }).join('')}</div>`;   /* 도감: 못 얻은 수하는 어두운 실루엣 + 「?」 — 모으는 재미(11-13 17:50) */
  },
  tab_awaken() {
    const need = JB.awakenStage(st), can = JB.canAwaken(st), gain = JB.sigilsFor(st.best, need);
    const spells = Object.keys(JB.SPELLS).map(k => { const un = JB.spellUnlocked(st, k); return `<div class="row"><div class="grow"><div class="nm">${L.spell[k].name}</div><div class="ds">${un ? L.spell[k].desc : L.ui.spellAt(JB.SPELLS[k].unlock)}</div></div>${un ? (st.spell === k ? `<span class="muted">${L.ui.equipped}</span>` : `<button class="btn" data-act="spell" data-arg="${k}">${L.ui.equip}</button>`) : ''}</div>`; }).join('');
    return `<div class="row"><div class="grow"><div class="nm" style="color:var(--gold)">${L.rankName(st.awakens)}</div><div class="ds">${L.awaken.now(st.sigils, (1 + JB.C.SIGIL_MUL * st.sigils).toFixed(1))} · ${L.awaken.cap(JB.armyCap(st).toLocaleString('ko-KR'))}</div></div></div>
      <p style="margin:.4em .5em">${can ? L.awaken.gain(gain) : L.awaken.need(need)}</p>
      <button class="btn big gold" data-act="awaken" style="width:calc(100% - 1em);margin:0 .5em .5em" ${can ? '' : 'disabled'}>${L.awaken.btn}${` → ${L.rankName(st.awakens + 1)}`}</button>
      <div class="keepgrid"><div><b>${L.awaken.keepT}</b>${L.awaken.keep.map(x => `<span>${x}</span>`).join('')}</div><div><b>${L.awaken.resetT}</b>${L.awaken.reset.map(x => `<span>${x}</span>`).join('')}</div></div>
      <div class="muted" style="margin-top:.8em">${L.ui.spells}</div>${spells}
      ${JB.unlocked(st, 'autoCast') ? `<div class="row"><div class="grow">${L.spell.auto}</div><button class="btn" data-act="autoCast">${st.autoCast ? L.settings.on : L.settings.off}</button></div>` : `<p class="muted">${L.spell.auto}: ${L.autoCastLock(st.casts || 0)}</p>`}`;
  },
  labDone(r) { r = r || JB.labCheck(st, Date.now()); if (!r || !r.id) return; const t = L.lab.done(L.lab.names[r.id], r.lv); this.toast(L.lab.title, t); this.feed(t); conquestFx(t, L.lab.title, '#cfe9ff', '#4f8bff', 'lab'); },
  relicVal(id, lv) { const r = JB.RELICS.find(x => x.id === id); return r.stat === 'time' ? lv * r.per : Math.round(lv * r.per * 100); },
  tab_crypt() {
    JB.dunDay(st); const open = { dun: JB.unlocked(st, 'dungeon'), keep: JB.unlocked(st, 'keep'), crypt: JB.unlocked(st, 'crypt'), map: JB.unlocked(st, 'map'), lab: JB.unlocked(st, 'lab') }, lockTxt = { dun: L.lockedAt(JB.C.UNLOCK.dungeon), keep: L.lockedAt(JB.C.UNLOCK.keep), crypt: st.crypt.open ? L.crypt.tomorrow : L.lockedAt(JB.C.CRYPT.unlock), map: L.map.lockDay(JB.C.MAP.day), lab: L.map.lockDay(JB.C.LAB.day) };
    if (!this.expView || !open[this.expView]) this.expView = ['dun', 'keep', 'crypt', 'map', 'lab'].find(k => open[k]);
    const sub = `<div class="subtabs">${['dun', 'keep', 'crypt', 'map', 'lab'].map(k => `<button class="btn ${this.expView === k ? 'gold' : ''}" data-act="exp" data-arg="${k}" ${open[k] ? '' : 'disabled'}>${L.map.sub[k]}${open[k] ? '' : `<br><small>${lockTxt[k]}</small>`}</button>`).join('')}</div>`;
    return sub + ({ keep: () => this.keepView(), dun: () => this.dunView(), map: () => this.mapView(), lab: () => this.labView(), crypt: () => this.cryptView() }[this.expView])();
  },
  keepView() {   /* 04:25 성채: 건물 카드 4장 · 짓는 중이면 막대 + 바로 완료 */
    const K = JB.keepOf(st), T = L.keep, now = Date.now(), left = JB.keepLeft(st, now), rc = JB.keepRushCost(st, now);
    const tm = s => s >= 3600 ? T.h(Math.floor(s / 3600), Math.round(s % 3600 / 60)) : s >= 60 ? T.m(Math.ceil(s / 60)) : T.s(Math.ceil(s));
    return `<div class="keeps">${JB.KEEP.ids.map(id => { const lv = K.lv[id], mx = lv >= JB.KEEP.max[id], c = JB.keepCost(st, id), me = K.bld && K.bld.id === id, ok = !K.bld && !mx && st.souls >= c.souls && st.bones >= c.bones;
      const bar = me ? `<div class="kbar"><i style="width:${Math.round((1 - left / K.bld.len) * 100)}%"></i><span>${T.left(tm(left))}</span></div><button class="btn ${rc ? '' : 'gold'}" data-act="keepRush">${rc ? `${T.rush} ${IC('i_gem')}${rc}` : T.free}</button>` : mx ? `<div class="muted mini">${T.max}</div>`
        : `<div class="kc">${IC('i_soul')}${fmt(c.souls)} ${IC('i_bone')}${c.bones} · ${tm(JB.keepTime(lv))}</div><button class="btn ${ok ? 'gold' : ''}" data-act="keepGo" data-arg="${id}" ${ok ? '' : 'disabled'}>${lv ? T.up : T.build}</button>`;
      return `<div class="keep${me ? ' bld' : ''}"><img src="art/keep_${id}.webp" alt="" onerror="this.style.visibility='hidden'"><div class="kt"><b>${T.n[id]}</b> <span class="lv">${T.lv(lv)}</span><div class="ke">${T.effK[id]} <b>${T.eff[id](lv)}</b>${mx ? '' : ` → <span class="nx">${T.eff[id](lv + 1)}</span>`}</div>${bar}</div></div>`; }).join('')}</div><p class="muted mini">${T.foot}</p>`;
  },
  keepDone(r) { Snd.smp('win', 0.8); Snd.smp('summon', 0.5); S.shake = Math.max(S.shake || 0, 5); this.toast(L.keep.title, L.keep.done(L.keep.n[r.id], r.lv)); this.feed(L.keep.done(L.keep.n[r.id], r.lv)); },
  dunView() {   /* 03:55 모험 던전 카드 3장: 그림 · 단계 · 열쇠 · 보상 · 도전 / 소탕 / 광고 열쇠 */
    const D = JB.dunOf(st), T = L.dun, pw = JB.dunPower(st);
    return '<div class="duns">' + JB.DUNGEON.list.map(d => { const lv = D.lv[d.id], nx = lv + 1, hp = JB.dunHp(d.id, nx), ok = pw >= hp, rw = JB.dunReward(st, d.id, nx), rt = rw.souls ? `${IC('i_soul')}${fmt(rw.souls)}` : rw.bones ? `${IC('i_bone')}${rw.bones}` : `${IC('i_gem')}${rw.gems}`;
      return `<div class="dun d-${d.id}"><img src="art/${d.boss}.webp" alt=""><div class="dt"><b>${T.names[d.id]}</b><span class="lv">${T.lv(lv)}</span><div class="muted mini">${T.desc[d.id]}</div><div class="rw">${T.next(nx)} ${rt}</div><div class="pw ${ok ? 'ok' : 'no'}">${ok ? T.canWin : T.need(Math.round(pw / hp * 100))}</div></div>
        <div class="db"><div class="keys">${T.keys(D.keys[d.id])}</div><button class="btn ${ok && D.keys[d.id] > 0 ? 'gold' : ''}" data-act="dunGo" data-arg="${d.id}" ${D.keys[d.id] < 1 ? 'disabled' : ''}>${T.go(nx)}</button>${lv > 0 ? `<button class="btn" data-act="dunSweep" data-arg="${d.id}" ${D.keys[d.id] < 1 ? 'disabled' : ''}>${T.sweep(lv)}</button>` : ''}${D.keys[d.id] < 1 && D.ad[d.id] < JB.DUNGEON.adMax ? `<button class="btn" data-act="dunAd" data-arg="${d.id}">${T.ad}</button>` : ''}</div></div>`; }).join('') + `</div><p class="muted mini">${T.foot}</p>`;
  },
  labView() {
    const lb = st.lab, now = Date.now(), C = JB.C.LAB, cur = lb.cur, left = Math.ceil(JB.labLeft(st, now) / 60000);
    const val = (r, lv) => r.stat === 'time' ? +(lv * r.per).toFixed(1) : Math.round(lv * r.per * 100);
    const head = cur ? `<div class="row"><div class="grow"><div class="nm" style="color:var(--gold)">${L.lab.now(L.lab.names[cur.id], L.lab.time(left))}</div><div class="bar2"><i style="width:${Math.max(0, 100 - left / JB.labMins(lb.lv[cur.id] || 0) * 100)}%"></i></div></div></div>
      <div class="row"><button class="btn gold" data-act="labRush" ${st.gems < JB.labGems(st, now) ? 'disabled' : ''}>${L.lab.rush(JB.labGems(st, now))}</button><button class="btn" data-act="labAd" ${lb.adUsed >= C.adMax ? 'disabled' : ''}>${L.lab.ad(lb.adUsed, C.adMax)}</button></div>`
      : `<p class="muted">${L.lab.idle}</p>`;
    const rows = JB.LAB.map(r => { const lv = lb.lv[r.id] || 0, b = JB.labBones(lv), on = cur && cur.id === r.id;
      return `<div class="row"><div class="grow"><div class="nm">${L.lab.names[r.id]} <span class="muted">${L.lab.lv(lv)}</span></div><div class="ds">${L.lab.desc[r.id](val(r, lv))} → ${L.lab.desc[r.id](val(r, lv + 1))}</div></div><button class="btn ${on ? 'gold' : ''}" data-act="lab" data-arg="${r.id}" ${cur || st.bones < b ? 'disabled' : ''}>${on ? L.lab.lv(lv + 1) + '…' : L.lab.start(b, L.lab.time(JB.labMins(lv)))}</button></div>`; }).join('');
    return `<div class="muted">${L.lab.explain}</div>${head}${rows}`;
  },
  mapView() {
    const m = st.map, need = JB.mapNeed(m.taken), peak = st.peak || st.best;
    const tiles = Array.from({ length: JB.MAP_TILES }, (_, i) => { const own = m.owned[i], why = JB.mapCanTake(st, i), cls = own ? 'own' : why === 'ok' ? 'ok' : 'shut';
      return `<button class="tile ${cls} ${i === JB.MAP_CAP ? 'cap' : ''}" data-act="take" data-arg="${i}" style="background-image:url(art/map_${i}.jpg)"><span>${L.map.tiles[i]}</span>${own ? '<b>☠</b>' : ''}</button>`; }).join('');
    return `<div class="row"><div class="grow"><div class="nm" style="color:var(--gold)">${L.map.kingdom(m.kingdom)}</div><div class="ds">${L.map.tokens(m.tokens, JB.C.MAP.tokens)} · ${L.map.taken(m.taken)}</div></div></div>
      <div class="mapgrid">${tiles}</div>
      <div class="ds" style="margin:.4em 0">${L.map.need(need)} · ${L.map.peak(peak)}</div><p class="muted">${L.map.explain}</p>`;
  },
  cryptView() {
    const c = st.crypt, C = JB.C.CRYPT, f = c.floor + 1, need = JB.cryptHp(f), have = JB.cryptPower(st), pct = Math.min(100, have / need * 100), can = have >= need;
    const relics = JB.RELICS.map(r => { const lv = c.relics[r.id] || 0, n = L.relics[r.id], cost = JB.relicCost(Math.max(1, lv));
      return lv ? `<div class="row"><img class="rl" src="art/relic_${r.id}.webp" alt="" onerror="this.style.display='none'"><div class="grow"><div class="nm">${n.name} <span class="muted">${L.crypt.lv(lv)}</span></div><div class="ds">${n.desc(this.relicVal(r.id, lv))} → ${n.desc(this.relicVal(r.id, lv + 1))}</div></div><button class="btn" data-act="relic" data-arg="${r.id}" ${c.dust < cost ? 'disabled' : ''}>${L.crypt.up(cost)}</button></div>`
        : `<div class="row"><img class="rl off" src="art/relic_${r.id}.webp" alt="" onerror="this.style.display='none'"><div class="grow"><div class="nm muted">${n.name}</div><div class="ds">${L.crypt.relicAt(r.floor)}</div></div></div>`; }).join('');
    return `<div class="row"><div class="grow"><div class="nm" style="color:var(--gold)">${L.crypt.title}</div><div class="ds">${L.crypt.keys(c.keys, C.keys)} · ${L.crypt.dust(c.dust)}</div></div></div>
      <p class="muted">${L.crypt.explain}</p>
      <div class="row"><div class="grow"><div class="nm">${L.crypt.floor(f)}</div><div class="bar2"><i style="width:${pct}%"></i></div><div class="ds">${L.crypt.power(fmt(have), fmt(need))}</div></div><button class="btn ${can && c.keys ? 'gold' : ''}" data-act="crypt" ${c.keys < 1 ? 'disabled' : ''}>${L.crypt.go}<br><small>${L.crypt.key1}</small></button></div>
      ${c.floor ? `<div class="row"><div class="grow"><div class="ds">${L.crypt.sweepDs(JB.cryptDust(c.floor))}</div></div><button class="btn" data-act="sweep" ${c.keys < 1 ? 'disabled' : ''}>${L.crypt.sweep(c.floor)}</button></div>` : ''}
      <div class="row"><div class="grow"><div class="ds">${L.crypt.buyKey(C.keyGems, c.bought, C.keyBuyMax)}</div></div><button class="btn" data-act="key" ${c.bought >= C.keyBuyMax || st.gems < C.keyGems ? 'disabled' : ''}>${L.gems} ${C.keyGems}</button></div>
      <div class="muted" style="margin-top:.8em">${L.ui.relics}</div>${relics}`;
  },
  tab_mission() {
    const mn = JB.mailList(st).length;
    return `<button class="row lrow${mn ? ' hint' : ''}" data-x="mailOpen" style="width:100%;text-align:left"><img src="art/chest1.webp" alt="" style="width:22px;height:22px"> ${L.mail.row(mn)}</button>` + `<button class="row lrow${JB.loginCan(st) ? ' hint' : ''}" data-x="loginOpen" style="width:100%;text-align:left"><img src="art/i_gem.webp" alt="" style="width:22px;height:22px"> ${L.login.row(JB.loginOf(st).n, JB.loginCan(st))}</button>` + `<div class="muted">${L.mission.title}</div>` + JB.MISSIONS.map((m, i) => { const v = st.missions[i], done = st.missionDone[i]; return `<div class="row"><div class="grow"><div class="nm">${L.mission.names[m.id](m.need)}</div><div class="bar2"><i style="width:${v / m.need * 100}%"></i></div><div class="ds">${v}/${m.need} · ${L.gems} ${m.gems}${m.bones ? ` · ${L.bones} ${m.bones}` : ''}</div></div><button class="btn" data-act="claim" data-arg="${i}" ${done || v < m.need ? 'disabled' : ''}>${done ? L.mission.done : L.mission.claim}</button></div>`; }).join('') + (() => { const w = JB.weekOf(st), A = JB.WEEK.at, mx = A[A.length - 1], rd = JB.weekReady(st);
      return `<div class="wk"><div class="wkh"><b>${L.week.title}</b><small>${L.week.sub}</small><span>${L.week.pts(w.pts, mx)}</span></div><div class="wkbar"><i style="width:${w.pts / mx * 100}%"></i>${A.map((n, k) => `<button class="wkc${rd[k] ? ' can hint' : ''}${w.got.includes(k) ? ' got' : ''}" style="left:${n / mx * 100}%" data-act="weekClaim" data-arg="${k}" ${rd[k] ? '' : 'disabled'}><img src="art/chest${Math.min(3, k)}.webp" alt=""><em>${n}</em></button>`).join('')}</div></div>`; })();
  },
};
const bossFight = () => !!(st.boss && st.boss.phase === 'fight' && S.giant && S.giant.on && !S.giant.dead);   /* 11-15 보스 싸움 중 알림은 끝난 뒤로: 보스 머리 위 막대 · 이름을 가리던 것(눈 확인 보스_4차) */
setInterval(() => { if (UI.toastQ && UI.toastQ.length && typeof S !== 'undefined' && S.phase !== 'cast' && !bossFight() && S.phase !== 'prompt' && S.phase !== 'stare' && !S.warn && !S.texts.some(t => t.screen && t.size >= 40 && t.age < t.life)) { const q = UI.toastQ;   /* 19:47 「승리!」 위에 알림이 겹침 → 큰 글자가 지나간 뒤에 */ UI.toastQ = []; q.forEach(([a, b]) => UI.toast(a, b)); } }, 400);
