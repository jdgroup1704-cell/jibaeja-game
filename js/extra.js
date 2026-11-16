'use strict';
// 켜 두는 사람 덤 · 시간 아끼기: 2배속, 빠른 보상, 자동 강화, 군단 사기, 떠도는 보물 기사, 설정, 광고 자리
// 기준(대표님): 무료는 시간을, 지친 사람은 돈을 쓴다. 켜 둔 사람이 더 받고, 돈은 시간을 산다.
const EX = {
  tT: rnd(...JB.C.TREASURE_EVERY), tr: null, autoT: 0,
  init() {
    $('tools').addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (!b) return; e.stopPropagation(); Snd.init(); Snd.smp('click', 0.5); this.act(b.dataset.x); });
    $('modal').addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (!b || b.disabled) return; e.stopPropagation(); Snd.init(); this.act(b.dataset.x, b.dataset.arg); });
    const t = document.createElement('div'); t.id = 'treasure'; t.innerHTML = '<img alt=""><b></b>'; $('stagewrap').appendChild(t);
    t.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); this.catchTreasure(); });
    this.applySettings();
  },
  // 광고 자리: 출시 때 광고 회사 코드로 바꿈. 지금은 시험이라 창만 띄우고 바로 줌
  ad(then) {
    if (AUTO) { then(); return; }
    this.adThen = then;
    UI.openModal(`<h3>${L.ad.title}</h3><p class="muted">${L.ad.body}</p><button class="btn big gold" data-x="adOk">${L.ad.ok}</button>`);
  },
  act(x, arg) {
    if (x === 'closeModal') { UI.closeModal(); return; }
    if (x === 'more') { this.moreOpen = !this.moreOpen; this.render(); return; }   /* 11-16 14:53 폰 오른쪽 단추 기둥(전장 12%를 가림) → 2배속 + 「≡」 하나로 접고, 누르면 펼침 */
    if (typeof BRAG !== 'undefined' && BRAG.act(x)) return;
    if (x === 'nmSave') { const cl = v => (v || '').replace(/[<>"'&]/g, '').trim().slice(0, 8); st.myName = cl(document.getElementById('nmMe')?.value); st.rival = cl(document.getElementById('nmRv')?.value); UI.toast(L.names.title, L.names.saved(st.myName, st.rival)); UI.closeModal(); UI.render(true); return; }
    if (typeof DEX !== 'undefined' && DEX.act(x, arg)) return;   /* 11-16 #14 도감 보상 받기 */   /* 11-16 #11 자랑 카드 */
    if (typeof SO !== 'undefined' && SO.act(x, arg)) return;   /* 04:05 채팅 · 길드 */
    if (x === 'adOk') { UI.closeModal(); const f = this.adThen; this.adThen = null; if (f) f(); }
    if (x === 'evoAd') this.ad(() => { const ev = JB.evoAd(st); if (!ev) return; for (const e of ev) { if (e.e === 'evo') evoShow(1, false); if (e.e === 'merge') evoShow(e.lv, true); } UI.toast(L.evo.adDone, ''); UI.render(true); });
    if (x === 'saver') { Saver.on(); return; }
    if (x === 'saverGo') { UI.closeModal(); Saver.on(); return; }
    if (x === 'speed') this.ad(() => { JB.adSpeed(st, Date.now()); UI.toast(L.speed.btn(30), L.speed.note); Snd.chime(988); });
    if (x === 'quick') this.quickOpen();
    if (x === 'lchest') this.lchestOpen();
    if (x === 'lchestGo') { const g = JB.lchestClaim(st, Date.now()); if (!g) return; UI.closeModal(); Snd.smp('soul', 0.9); Snd.chime(1319); S.shake = Math.max(S.shake || 0, 3); burst(150, 260, 26, { col: ['#ffd76a', '#fff3c4', '#b58cff'], vmin: 60, vmax: 260, up: 220, lmax: 1 }); const t = L.lchest.got(fmt(g.souls), g.gems, g.bones); UI.toast(L.lchest.title, t); UI.feed(`${L.lchest.title}: ${t}`); if (g.ev.length) UI.gearGot(g.ev); UI.render(true); }
    if (x === 'quickGo') {
      const go = () => { const g = JB.quickReward(st); if (!g) return; UI.closeModal(); Snd.smp('soul', 0.8); Snd.chime(1175); UI.toast(L.quick.title, L.quick.got(fmt(g.souls), g.bones)); UI.feed(`${L.quick.title}: ${L.quick.got(fmt(g.souls), g.bones)}`); };
      JB.quickCost(st) === 0 ? this.ad(go) : go();
    }
    if (x === 'settings') this.settingsOpen();
    if (x === 'legal') { LEGAL.open(arg); return; }   /* 04:50 출시 준비: 확률 · 약관 · 개인정보 · 환불 */
    if (x === 'goTab') { UI.closeModal(); const b = document.querySelector(`#tabs [data-tab="${arg}"]`); if (b) b.click(); return; }   /* 벽 카드에서 바로 그 탭으로 */
    if (x === 'loginOpen') { this.loginOpen(); return; }
    if (x === 'mailOpen') { this.mailOpen(); return; }
    if (x === 'mailClaim') { const g = JB.mailClaim(st, arg || 'all'); if (!g) return; Snd.chime && Snd.chime(1175); Snd.smp('soul', 0.5); UI.toast(L.mail.toast(g.n), [g.gems ? L.mail.gems(g.gems) : '', g.bones ? L.mail.bones(g.bones) : ''].filter(Boolean).join(' · ')); typeof save === 'function' && save(); if (JB.mailList(st).length) this.mailOpen(); else UI.closeModal(); UI.render(true); return; }
    if (x === 'loginClaim') { const g = JB.loginClaim(st); if (!g) return; Snd.chime && Snd.chime(1319); Snd.smp('summon', 0.5); UI.toast(L.login.toast(g.day), [g.gems ? L.login.gems(g.gems) : '', g.bones ? L.login.bones(g.bones) : '', g.souls ? `${L.souls} +${fmt(g.souls)}` : ''].filter(Boolean).join(' · ')); UI.closeModal(); if (g.hero && UI.pullResult) UI.pullResult([g.hero]); UI.render(true); return; }
    if (x === 'shop') this.shopOpen();
    if (x === 'mobInst' && typeof MOB !== 'undefined') { UI.closeModal(); MOB.canInstall() ? MOB.install() : MOB.guide(true); return; }   /* 11-17 설치 단추 */
    if (x === 'shopBuy') { const g = JB.shopBuy(st, arg, Date.now()); if (!g) { UI.toast(L.shop2.title, L.shop2.empty); return; } Snd.chime && Snd.chime(1319); Snd.smp('summon', 0.6); S.shake = Math.max(S.shake || 0, 4); const T = L.shop2.items[arg] || { name: L.shop2.gemT }; UI.toast(L.shop2.got(T.name), [g.gems ? `${L.gems} +${g.gems}` : '', g.bones ? `${L.bones} +${g.bones}` : '', g.hero ? L.heroes[g.hero.id].name : ''].filter(Boolean).join(' · ')); if (g.hero && UI.pullResult) { UI.closeModal(); UI.pullResult([g.hero]); } else this.shopOpen(); UI.render(true); return; }
    if (x === 'passClaim' || x === 'fundClaim' || x === 'monthClaim') { const g = x === 'passClaim' ? JB.passClaim(st) : x === 'fundClaim' ? { gems: JB.fundClaim(st) } : JB.monthClaim(st, Date.now(), st.day); Snd.chime && Snd.chime(1175); if (g.hero) { UI.toast(L.shop2.claimT, `${L.heroes[g.hero.id].name} · ${L.rarity.SR}`); Snd.smp('ssr', 0.6); } UI.toast(L.shop2.claimT, [g.gems ? `${L.gems} +${g.gems}` : '', g.bones ? `${L.bones} +${g.bones}` : ''].filter(Boolean).join(' · ')); this.shopOpen(); UI.render(true); return; }
    if (x === 'stoneTest') { st.wpStone = (st.wpStone || 0) + 3; UI.toast(L.weapon.test, ''); }
    if (x === 'vipTest') { if (JB.addVip(st, 1000)) { UI.toast(L.vip.title, L.vip.up(JB.vipLv(st))); Snd.chime(1175); } UI.vipOpen(); }
    if (x === 'wipeAsk') { UI.openModal(`<h3>${L.settings.wipe}</h3><p>${L.settings.wipeQ}</p><div class="row" style="border:0"><button class="btn gold" data-x="wipeYes">${L.settings.wipeYes}</button><button class="btn" data-x="wipeNo">${L.settings.wipeNo}</button></div>`); return; }
    if (x === 'wipeYes') { wipeAll(); return; }
    if (x === 'wipeNo') { this.settingsOpen(); return; }
    if (x === 'autoCastSet') { st.autoCast = !st.autoCast; this.settingsOpen(); }
    if (x === 'set') { st.settings[arg] = !st.settings[arg]; this.applySettings(); this.settingsOpen(); }
    if (x === 'autoUp') st.autoUp = !st.autoUp;
    if (x === 'offline2') { const g = this.off2; this.off2 = null; if (!g) return; this.ad(() => { st.souls += g.souls; st.bones += g.bones; Snd.smp('soul', 0.8); UI.toast(L.offline.title, L.offline.got(fmt(g.souls * 2), g.bones * 2)); }); UI.closeModal(); }
    UI.render(true);
  },
  lchestOpen() {   /* 23:40 전리품 상자: 쌓인 것 보여 주고 받기 */
    const g = JB.lchestInfo(st, Date.now()), O = L.lchest, cap = g.cap || JB.LCHEST.cap, card = (ic, n, v) => `<div class="oc"><img src="art/${ic}.webp" alt=""><b>${v}</b><small>${n}</small></div>`;
    UI.openModal(`<h3>${O.title}</h3><p>${O.desc(cap)}</p><div class="ochest t${g.full ? 3 : g.h >= 4 ? 2 : 1}"><img src="art/chest${g.full ? 3 : g.h >= 4 ? 2 : g.h >= 1 ? 1 : 0}.webp" alt=""><b>${O.time(L.time(Math.floor(g.secs)), g.full)}</b></div><div class="ocards">${card('i_soul', L.offline.n.souls, fmt(g.souls))}${card('i_gem', L.offline.n.gems, g.gems)}${card('i_bone', L.offline.n.bones, g.bones)}</div><div class="obar"><i style="width:${g.h / cap * 100}%"></i></div><p class="mini muted">${g.gear ? O.gearOn : O.gearAt(JB.LCHEST.gearH)}</p><button class="btn big gold" data-x="lchestGo" ${g.secs < 300 ? 'disabled' : ''}>${g.secs < 300 ? O.wait(Math.ceil((300 - g.secs) / 60)) : O.go}</button>`);
  },
  quickOpen() {
    const c = JB.quickCost(st), free = Math.max(0, JB.C.QUICK_FREE - st.quickUsed);
    UI.openModal(`<h3>${L.quick.title}</h3><p>${L.quick.desc(JB.C.QUICK_HOURS)}</p>
      <button class="btn big gold" data-x="quickGo" ${st.gems < c ? 'disabled' : ''}>${c === 0 ? L.quick.free(free, JB.C.QUICK_FREE) : L.quick.gems(c)}</button>`);
  },
  mailOpen() {   /* 11-15 우편함: 시스템 선물만(기기 안) */
    const T = L.mail, ms = JB.mailList(st), rew = m => [m.gems ? `<img src="art/i_gem.webp" alt="">${m.gems}` : '', m.bones ? `<img src="art/i_bone.webp" alt="">${m.bones}` : ''].join(' ');
    const rows = ms.map(m => `<div class="row mrow"><div class="grow"><b>${T.t[m.id]}</b><div class="ds">${T.d[m.id]}</div><div class="mrew">${rew(m)}</div></div><button class="btn gold" data-x="mailClaim" data-arg="${m.id}">${T.get}</button></div>`).join('');
    UI.openModal(`<h3>${T.title}</h3><p class="muted small">${T.sub}</p>` + (ms.length ? rows + (ms.length > 1 ? `<button class="btn big gold" data-x="mailClaim" data-arg="all">${T.all(ms.length)}</button>` : '') : `<p class="muted" style="text-align:center;margin:1.4em 0">${T.none}</p>`));
  },
  loginOpen() {   /* 11-15 7일 출석부: 처음 7일은 크게(7일째 상급 영웅), 그 뒤 매주 작게 */
    const T = L.login, R = JB.loginRow(st), can = JB.loginCan(st), txt = r => [r.hero ? T.heroSR : '', r.gems ? T.gems(r.gems) : '', r.bones ? T.bones(r.bones) : '', r.hours ? T.hours(r.hours) : ''].filter(Boolean).join(' + ');
    const cells = R.list.map((r, i) => { const done = i < R.at || (i === R.at && !can), today = i === R.at && can, big = i === 6;
      return `<div class="lday${done ? ' done' : ''}${today ? ' now' : ''}${big ? ' big' : ''}"><b>${T.day(i + 1)}</b><img src="art/${r.hero ? 'chest3' : r.gems ? 'i_gem' : r.bones ? 'i_bone' : 'i_soul'}.webp" alt=""><small>${txt(r)}</small>${done ? `<i class="ck">✓</i>` : ''}</div>`; }).join('');
    UI.openModal(`<h3>${R.first ? T.title : T.week}</h3><p class="muted small">${T.sub}</p><div class="lgrid">${cells}</div>` + (can ? `<button class="btn big gold" data-x="loginClaim">${T.get}</button>` : `<button class="btn big" disabled>${T.later}</button>`));
  },
  shopOpen() {   /* 03:45 상점 새로: 위에 「받을 것」, 첫 결제 → 패스 → 월정액 → 성장 기금 → 저금통 → 꾸미기 → 마정석. 카드마다 「사면 바로」 */
    const S2 = L.shop2, now = Date.now(), SH = JB.shopOf(st), P = JB.SHOP2, won = n => n.toLocaleString('ko-KR') + '원', bought = id => !!SH.bought[id] && P[id].once;
    const pr = JB.passReady(st), fr = JB.fundReady(st), mo = (SH.gemUntil > now && SH.gemDay !== st.day) || (SH.boneUntil > now && SH.boneDay !== st.day);
    const claim = (pr.free + pr.paid > 0 || fr > 0 || mo) ? `<div class="sclaim"><b>${S2.claimT}</b>${pr.free + pr.paid > 0 ? `<button class="btn gold" data-x="passClaim">${S2.passGet(pr.free * JB.PASS.free.gems + pr.paid * JB.PASS.paid.gems)}</button>` : ''}${fr > 0 ? `<button class="btn gold" data-x="fundClaim">${S2.fundGet(fr * JB.FUND.gems)}</button>` : ''}${mo ? `<button class="btn gold" data-x="monthClaim">${S2.monthGet}</button>` : ''}</div>` : '';
    const card = (id, pic, hot, extra) => { const T = S2.items[id], own = bought(id); return `<div class="scard${hot ? ' hot' : ''}${own ? ' own' : ''}">${hot ? `<i class="rib">${hot}</i>` : ''}<img src="art/${pic}.webp" alt=""><div class="sb"><div class="nm">${T.name}</div><div class="now">${S2.now} ${T.now}</div>${extra || ''}<div class="muted mini">${T.who}</div></div><button class="btn ${own ? '' : 'gold'} sbuy" data-x="shopBuy" data-arg="${id}" ${own ? 'disabled' : ''}>${own ? S2.owned : `<b>${won(P[id].won)}</b><small>${S2.test}</small>`}</button></div>`; };
    const passBar = `<div class="sbar"><i style="width:${pr.n / JB.PASS.tiers * 100}%"></i></div><div class="muted mini">${S2.passProg(pr.n, JB.PASS.tiers, JB.PASS.every)}</div>`;
    const fundBar = `<div class="muted mini">${S2.fundProg(SH.fund, JB.FUND.at.length)}</div>`;
    const pig = `<div class="sbar pig"><i style="width:${Math.min(100, (SH.piggy || 0) / JB.PIGGY.cap * 100)}%"></i></div><div class="muted mini">${S2.pigProg(Math.floor(SH.piggy || 0), JB.PIGGY.cap)}</div>`;
    const mLeft = SH.gemUntil > now ? `<div class="muted mini">${S2.days(Math.ceil((SH.gemUntil - now) / 864e5))}</div>` : '';
    const gems = ['gem1', 'gem2', 'gem3', 'gem4', 'gem5', 'gem6'].map(id => `<button class="gpack" data-x="shopBuy" data-arg="${id}"><img src="art/i_gem.webp" alt=""><b>${(P[id].gems * (SH.firstPack[id] ? 1 : 2)).toLocaleString('ko-KR')}</b>${SH.firstPack[id] ? '' : `<i>${S2.double}</i>`}<span>${won(P[id].won)}</span></button>`).join('');
    UI.openModal(`<h3>${S2.title}</h3><p class="snote">${S2.note}</p>${claim}
      ${card('first', 'hero_serafine', S2.hotFirst)}
      ${card('pass', 'i_vip', S2.hotBest, passBar)}
      ${card('monthGem', 'i_gem', '', mLeft)}${card('monthBone', 'i_bone', '')}
      ${card('fund', 'treasure', S2.hotValue, fundBar)}
      ${card('piggy', 'chest2', '', pig)}
      ${card('skinGold', 'lordA', '')}
      <div class="sgh">${S2.gemT}</div><div class="gpacks">${gems}</div><p class="muted mini">${S2.legal}</p>`);
  },
  settingsOpen() {
    if (st.settings.vib === undefined) st.settings.vib = true;   /* 진동은 처음엔 켬 */
    const row = k => `<div class="row"><div class="grow">${L.settings[k]}</div><button class="btn" data-x="set" data-arg="${k}">${st.settings[k] ? L.settings.on : L.settings.off}</button></div>`;
    const auto = JB.unlocked(st, 'autoCast') ? `<div class="row"><div class="grow">${L.spell.auto}</div><button class="btn" data-x="autoCastSet">${st.autoCast ? L.settings.on : L.settings.off}</button></div>` : `<div class="row"><div class="grow muted">${L.spell.auto}: ${L.autoCastLock(st.casts || 0)}</div></div>`;   /* 대마법 자동은 설정에도(각성 탭은 25판에 열려서) */
    const nm = `<div class="row nmrow"><div class="grow">${L.names.title}<small class="muted" style="display:block">${L.names.hint}</small></div></div><div class="row nmrow" style="gap:6px"><input id="nmMe" maxlength="8" placeholder="${L.names.me}" value="${(st.myName || '').replace(/"/g, '')}"><input id="nmRv" maxlength="8" placeholder="${L.names.rival}" value="${(st.rival || '').replace(/"/g, '')}"><button class="btn gold" data-x="nmSave">${L.names.save}</button></div>`;   /* 11-16 이름 넣기(던전 히어로 「마왕 김진동」처럼 아는 사람이 나오게) */
    UI.openModal(`<h3>${L.settings.title}</h3>${nm}${auto}${row('sound')}${row('bgm')}${row('shortCast')}${row('calm')}${row('vib')}<div class="row"><div class="grow">☾ ${L.saver.btn} <span class="muted mini">${L.saver.title}</span></div><button class="btn" data-x="saverGo">${L.saver.btn}</button></div>${typeof MOB !== 'undefined' ? `<div class="row"><div class="grow">📲 ${L.mob.setRow}</div><button class="btn ${MOB.canInstall() ? 'gold' : ''}" data-x="mobInst" ${MOB.isApp() ? 'disabled' : ''}>${MOB.isApp() ? L.mob.setDone : MOB.canInstall() ? L.mob.setBtn : L.mob.setHow}</button></div>` : ''}<h4 style="margin:.6em 0 .2em">정보</h4><div class="lgrow">${LEGAL.rows().map(([k, t]) => `<button class="btn" data-x="legal" data-arg="${k}">${t}</button>`).join('')}</div><div class="row"><div class="grow muted">${L.settings.wipeD}</div><button class="btn" data-x="wipeAsk">${L.settings.wipe}</button></div>`);   /* 그림체 시안(애니풍)은 대표님 「원래 그림체」로 빼 둠 */
  },
  applySettings() {
    const s = st.settings; if (!Snd.master) return;
    Snd.master.gain.value = s.sound ? 0.8 : 0;
    if (Snd.bgm) Snd.bgmTo(s.bgm ? BGM_V : 0.0001, 0.3);
  },
  // 위 오른쪽 도구 줄 + 사기 표시
  render() {
    const now = Date.now(), left = Math.ceil(((st.speedUntil || 0) - now) / 60000), sp = JB.speedMul(st, now) > 1;
    const sR = `<button data-x="speed" class="${sp ? 'on' : ''}">${IC('b_speed')}${L.speed.btn(sp ? left : 0)}</button>` + `<button data-x="settings">${IC('b_set')}${L.settings.btn}</button>` + `<button data-x="chat">${IC('b_chat')}${L.so.chat}</button>` + ((st.thralls || 0) >= 1 || (st.best || 0) >= 6 ? `<button data-x="brag" class="${(st.thralls || 0) >= 1 && !st.seen.brag ? 'ready' : ''}">${IC('i_army')}${L.brag.btn}</button>` : '') + (JB.unlocked(st, 'guild') ? `<button data-x="guild" class="${JB.guildOf(st) && (!JB.guildOf(st).checked || JB.guildOf(st).hits < JB.GUILD.hits) && JB.guildOf(st).day === st.day ? 'dot' : !JB.guildOf(st) ? 'dot' : ''}">${IC('b_guild')}${L.so.guild}</button>` : ''),
      lg = JB.lchestInfo(st, now), lp = Math.round(lg.h / (lg.cap || JB.LCHEST.cap) * 20) * 5,
      fw = `<img src="art/chest${lg.full ? 3 : lg.h >= 4 ? 2 : lg.h >= 1 ? 1 : 0}.webp" alt=""><i class="fb"><i style="width:${lp}%"></i></i>${lg.h >= 1 ? `<b>${lg.full ? L.lchest.full : L.lchest.tap}</b>` : ''}`,
      sL = `<button data-x="lchest" class="lch${lg.full ? ' full' : lg.h >= 1 ? ' ready' : ''}">${IC('chest' + (lg.full ? 3 : lg.h >= 4 ? 2 : lg.h >= 1 ? 1 : 0))}${L.lchest.btn}<i class="lbar"><i style="width:${lp}%"></i></i></button>` + (JB.unlocked(st, 'grave') ? `<button data-x="quick">${IC('b_quick')}${L.quick.btn}${st.quickUsed < JB.C.QUICK_FREE ? ' •' : ''}</button>` : '');   /* 23:45 상점은 위 띠(귀빈 옆)로 — 왼쪽 줄에 전리품 · 빠른 보상 · 상점 셋이면 큰 판 표시와 겹침 */
    { const fc0 = $('fchest'); if (fc0) fc0.remove(); }   /* 03:15 대표님 「상자 좀 없애 다른 곳으로」: 전장 바닥 → 왼쪽 위 단추(빠른 보상 위) */
    const NAR = innerWidth < 500, dotR = /class="[^"]*(ready|dot)/.test(sR.split('</button>').slice(1).join('</button>')), sR2 = NAR ? sR.replace('</button>', '</button>' + `<button data-x="more" class="more${this.moreOpen ? ' on' : ''}${dotR ? ' dot' : ''}"><b class="mi">${this.moreOpen ? '✕' : '≡'}</b>${this.moreOpen ? L.ui.close || '닫기' : L.ui.more || '메뉴'}</button>`) : sR;
    const tw = `<div class="col l">${sL}</div><div class="col r${NAR ? ' nar' : ''}${this.moreOpen ? ' open' : ''}">${sR2}</div>`; if ($('tools').dataset.w !== tw) { $('tools').dataset.w = tw; $('tools').innerHTML = tw; }   /* 11-14: 전장 좌우 가장자리 아이콘 기둥(왼쪽 보상·상점, 오른쪽 배속·설정). 같으면 안 건드림(누르는 중 사라짐 방지) */
    const m = Math.round(JB.C.MORALE_MAX * (st.morale || 0) * 100);
    if (m > 0) ($('hud').querySelector('.r2') || $('hud')).insertAdjacentHTML('beforeend', `<span class="chip mor" title="${L.moraleTip}">${L.morale(m)}</span>`);   /* 위 띠 둘째 줄(자원 옆)에 — 셋째 줄이 생기지 않게 */
  },
  // 매 화면: 보물 기사 · 자동 강화
  tick(real, dt) {
    if (!S.loginShown && !AUTO && !TRAILER && JB.loginCan(st) && st.best >= 6 && S.phase === 'battle' && !UI.awakening && $('modal').style.display !== 'flex' && !document.querySelector('.vsfx.on, #cutin.on')) { S.loginShown = 1; this.loginOpen(); }   /* 11-15 출석부: 하루 처음 켤 때 한 번(첫날은 6판부터 — 처음 안내를 안 막게) */
    const wn = Date.now(); if (wn - (this.trT || 0) > 1000 && (S.offDone || performance.now() > 4000)) { this.trT = wn; const n = JB.trainTick(st, Date.now()); if (n > 0) { st.train.shown = st.train.lv; UI.toast(L.train.name, L.train.up(st.train.lv, Math.round(st.train.lv * JB.C.TRAIN.atk * 100))); Snd.chime && Snd.chime(988); if (UI.tab === 'up') UI.render(true); } }   /* 군단 수련: 시간이 흐르면 저절로 */
    this.autoT += dt; if (this.autoT > 1) { { const kd = JB.keepTick(st, Date.now()); if (kd) { UI.keepDone(kd); UI.render(true); } }   /* 04:25 성채 다 지어지면 알림 */ this.autoT = 0; if (JB.autoUpgrade(st)) Snd.smp('click', 0.2, 0, 1.3); }
    const busy = ['stare', 'prompt', 'cast'].includes(S.phase);
    const el = $('treasure');
    if (!this.tr) {
      if (!busy && st.raised >= JB.C.RAISE_TAPS) this.tT -= dt;
      /* 손 쉬는 시간: 깜빡이는 단추 · 일으키기 · 대마법 중 누를 게 하나도 없던 시간(11-13 처음 10분 재기: 3분 22초부터 88초 동안 누를 게 없었음) */
      this.hT = (this.hT || 0) + dt; if (S.t - (this.hChk || 0) > 0.5) { this.hChk = S.t; const on = id => getComputedStyle($(id)).display !== 'none'; if (document.querySelector('#tabs .hint, #tools .hint, #tabbody .hint') || on('raiseBtn') || $('cast').classList.contains('on')) this.hT = 0; }
      if (!busy && S.phase === 'battle' && st.raised >= JB.C.RAISE_TAPS && (S.t - (S.lastNew || 0) > 45 || this.hT > 28) && this.tT > 3) this.tT = 3;   /* 박자 감독: 45초 넘게 새 것이 없으면 보물 기사를 앞당김(18:00 처음 10분 재기: 3분 42초~4분 49초가 비었음) */
      if (this.tT <= 0) { S.lastNew = S.t; this.hT = 0; this.tr = { t: 0, life: 14, y: rnd(52, 68) }; el.querySelector('img').src = (ART.treasure || ART.knight) ? (ART.treasure || ART.knight).src : ''; /* 전용 그림(금 갑옷 · 보물 자루) 없으면 기사 */ el.querySelector('b').textContent = L.treasure.tap || '✦ 눌러요!'; el.style.display = 'block'; if (!AUTO) UI.toast(L.treasure.name, L.treasure.hint); Snd.chime(1319); }
      return;
    }
    const r = this.tr; r.t += real;
    const k = r.t / r.life; el.style.left = `${90 - k * 100}%`;   /* 21:55 오른쪽 끝에서 「눌러요」가 잘려 보여 안쪽에서 시작 */ el.style.top = `${r.y + Math.sin(r.t * 3) * 1.5}%`;
    if (k >= 1 || busy) this.endTreasure();
  },
  endTreasure() { this.tr = null; $('treasure').style.display = 'none'; this.tT = rnd(...JB.C.TREASURE_EVERY); },
  catchTreasure() {
    if (!this.tr) return;
    const g = JB.treasure(st); Snd.init(); Snd.smp('soul', 0.9); Snd.chime(1568); S.flash = Math.max(S.flash, 0.25);
    UI.toast(L.treasure.name, L.treasure.got(g.gems, g.bones)); UI.feed(`${L.treasure.name}: ${L.treasure.got(g.gems, g.bones)}`);
    if (typeof BOT !== 'undefined') BOT.log.push(['보물', Math.round(BOT.t)]);
    this.endTreasure(); UI.render(true);
  },
};
// 기존 화면에 덧붙이기
{ const r0 = UI.render.bind(UI); UI.render = f => { r0(f); EX.render(); }; }
{ const u0 = UI.tab_up.bind(UI); UI.tab_up = () => {
  const open = JB.autoUpOpen(st);
  if (!open) return u0() + (st.best >= 10 ? `<p class="muted">${L.autoUp.name}: ${L.autoUp.lock}</p>` : '');   // 잠겼을 땐 맨 위가 아니라 맨 아래 한 줄, 10판 전엔 숨김
  const tr = st.train || { lv: 0, t0: Date.now() }, need = JB.trainNeed(tr.lv), left = JB.trainLeft(st, Date.now()), trow = `<div class="row ur train"><img class="uic" src="art/i_army.webp" alt=""><div class="grow"><div class="nm">${L.train.name} <span class="lvb">${L.lv(tr.lv)}</span></div><div class="ds">${L.train.eff(Math.round(tr.lv * JB.C.TRAIN.atk * 100), Math.round(tr.lv * JB.C.TRAIN.soul * 100))}</div><div class="bar2"><i style="width:${(1 - left / need) * 100}%"></i></div><div class="ds mini">${L.train.next(L.time(Math.ceil(left / 1000)))}</div></div></div>`;
  const html = u0().replace('<div class="bulk">', `<div class="bulk"><button class="auto${st.autoUp ? ' on' : ''}" data-act="autoUp" title="${L.autoUp.desc}"><img src="art/u_auto.webp" alt="">${L.autoUp.short(st.autoUp)}</button>`); const bi = html.indexOf('<div class="bulk">'), be = bi < 0 ? 0 : html.indexOf('</div>', bi) + 6; { const gi = html.search(/<div class="(gear|gbox|eq)/); if (gi > be) return html.slice(0, gi) + trow + html.slice(gi); } return html.slice(0, be) + trow + html.slice(be);   /* 11-16 15:2x 수련 칸이 강화 카드 위에 있어 폰에서 값 단추가 잘렸음 → 강화 카드 아래(장비 위)로 */   /* 수련 칸은 ×1/×10 줄 아래(위 임무 막대에 가리지 않게) */   /* 11-14 자동 강화를 한 줄 차지하던 칸 → ×1/×10/최대 옆 작은 단추(임무 막대에 반쯤 가려지던 문제) */
}; }
{ const a0 = UI.act.bind(UI); UI.act = (a, arg) => { if (a === 'autoUp') { st.autoUp = !st.autoUp; UI.render(true); return; } if (a === 'evoAd') { EX.act('evoAd'); return; } a0(a, arg); }; }

/* 11-14 절전 모드(대표님 「온라인 24시간 돌리면 더 강해지지? 요새 재화 때문에」): 켜 둔 채 놔두는 사람용 — 그림을 거의 안 그리고(배터리 · 발열 ↓) 검은 화면에 번 것만. 규칙은 그대로 돌아 켜 둔 만큼 100% 벎. 화면을 두 번 누르면 돌아옴 */
const Saver = {
  is: false, t0: 0, s0: 0, earned: 0, last: 0, k0: 0, b0: 0, tapT: 0,
  on() { this.is = true; this.t0 = Date.now(); this.earned = 0; this.last = st.souls; this.k0 = st.kills || 0; this.b0 = st.best; this.bn0 = st.bones; const el = $('saver'); el.classList.add('on'); UI.closeModal && UI.closeModal(); this.paint(); if (Snd.bgmStop) Snd.bgmStop(); },
  off() { this.is = false; $('saver').classList.remove('on'); if (Snd.bgmStart) Snd.bgmStart(BGM_V); },
  tick() { if (!this.is) return; if (st.souls > this.last) this.earned += st.souls - this.last; this.last = st.souls;
    if (S.phase === 'prompt' && typeof startCast === 'function') startCast(true);   /* 보스는 대마법 자동으로 */
    const n = Date.now(); if (n - (this.pT || 0) > 1000) { this.pT = n; this.paint(); } },
  paint() { const el = $('saver'), sec = Math.floor((Date.now() - this.t0) / 1000), Z = L.saver;
    el.innerHTML = `<div class="sv-in"><div class="sv-moon">☾</div><div class="sv-t">${Z.title}</div><div class="sv-time">${L.time(Math.max(1, sec))}</div>
      <div class="sv-g"><div><img src="art/i_soul.webp" alt=""><b>${fmt(this.earned)}</b><small>${Z.souls}</small></div><div><img src="art/i_army.webp" alt=""><b>${(st.kills || 0) - this.k0}</b><small>${Z.kills}</small></div><div><img src="art/i_bone.webp" alt=""><b>${Math.max(0, st.bones - this.bn0)}</b><small>${Z.bones}</small></div></div>
      <div class="sv-st">${L.sn(st.stage)} · ${L.regions[regionOf(st.stage)]}${st.best > this.b0 ? ` <b>${Z.up(L.sn(st.best))}</b>` : ''}</div><div class="sv-hint">${Z.hint}</div></div>`; },
  tap() { const n = Date.now(); if (n - this.tapT < 450) this.off(); this.tapT = n; },
};
(function bindSaver() { const el = $('saver'); if (!el) return document.addEventListener('DOMContentLoaded', bindSaver); el.addEventListener('pointerdown', e => { e.stopPropagation(); Saver.tap(); }); })();

/* 11-14 화면 꾸밈 2차: 단추를 누르면 빛 물결, 강화 · 임무 받기가 성공하면 단추에서 「+3단계」 「+20 마정석」이 떠오르며 반짝 */
(function juicy() {
  let lastBtn = null;
  document.addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest('.btn,#tools .col button,.bulk button'); if (!b || b.disabled) return; lastBtn = b; const r = b.getBoundingClientRect(); lastBtn.__r = r; const _r = r, w = document.createElement('span'); w.className = 'rip'; const d = Math.max(r.width, r.height) * 2.2; w.style.width = w.style.height = d + 'px'; w.style.left = (e.clientX - r.left - d / 2) + 'px'; w.style.top = (e.clientY - r.top - d / 2) + 'px'; if (getComputedStyle(b).position === 'static') b.style.position = 'relative'; b.style.overflow = 'hidden'; b.appendChild(w); setTimeout(() => w.remove(), 500); }, true);
  const fly = (txt, cls) => { const b = lastBtn; if (!b || !b.__r) return; const r = b.__r, f = document.createElement('div'); f.className = 'flyt ' + (cls || ''); f.textContent = txt; f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top) + 'px'; document.body.appendChild(f); setTimeout(() => f.remove(), 1000);
    const g = document.createElement('div'); g.className = 'glint'; g.style.left = r.left + 'px'; g.style.top = r.top + 'px'; g.style.width = r.width + 'px'; g.style.height = r.height + 'px'; document.body.appendChild(g); setTimeout(() => g.remove(), 450); };
  const a0 = UI.act.bind(UI);
  UI.act = (a, arg) => {
    const up0 = a === 'buy' ? st.up[arg] : 0, gem0 = st.gems, bone0 = st.bones;
    const r = a0(a, arg);
    if (a === 'buy' && st.up[arg] > up0) fly(L.ui.lvUp(st.up[arg] - up0), 'up');
    if (a === 'claim' && (st.gems > gem0 || st.bones > bone0)) fly(st.gems > gem0 ? `+${st.gems - gem0} ${L.offline.n.gems}` : `+${st.bones - bone0} ${L.offline.n.bones}`, 'gem');
    return r;
  };
})();
