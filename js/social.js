/* 04:05 채팅 · 길드 화면(대표님 「채팅 · 길드 · 전투력 · 템 · 커스텀 기본」)
   시험판: 서버가 없어 이야기 인물 대화 + 내 소식(가짜 이용자 없음). 출시판은 실제 서버 채팅 + 신고 · 차단 · 욕설 거르기로 바꿈 — 작업기록 「출시 전」 */
const SO = {
  msgs: { world: [], guild: [] }, view: 'world', t: 8, pvT: 0,
  /* 04:15 작업기록 설계(01:21 「가짜 사람 아님」) 따라 고침: 가상 「이용자」 대신 이야기 인물(다른 지배자들 · 내 영웅)과 내 게임의 진짜 소식만. 실시간 채팅은 출시판 서버에서 */
  NICK: ['서리 리치 벨라', '역병 공작 모르그', '해골 기사단장 카론', '밤의 여왕 릴리스', '무덤지기 오그', '피의 백작 드라쿨', '그림자 사제 네아', '뼈 거인 굴'],
  pick(a) { return a[Math.floor(Math.random() * a.length)]; },
  fresh(a) { const last = (this.msgs.world.concat(this.msgs.guild)).slice(-12).map(m => m.txt); const ok = a.filter(x => !last.includes(x)); return this.pick(ok.length ? ok : a); },   /* 최근 12줄과 같은 말은 안 함 */
  stageTxt(d) { return SN(Math.max(1, (st.best || 1) + d)); },
  worldLine() {
    return this.fresh(['인간 왕국이 또 군대를 모으는군. 성가신 것들.', '대마법 고리가 겹칠 때 한 번 더… 그게 힘의 비밀이지.', '영혼의 무덤 깊은 곳엔 영혼이 넘쳐난다더군.', '제단에 뼛조각을 바쳐라. 금빛 장비가 응답할 것이다.',
      `${this.stageTxt(Math.floor(rnd(2, 12)))}의 성기사들, 만만치 않아.`, '막히면 군단부터 다시 일으켜. 숫자가 곧 힘이다.', '보스의 약점에 맞는 영웅을 세워라. 상성이 반을 한다.', '자리를 비워도 군단은 싸운다. 돌아와서 전리품을 챙겨.',
      '새 지배자인가. 흥, 얼마나 버티는지 보지.', '오늘 길드 보스는 내가 먼저 친다.', '각성하면 처음부터지만, 훨씬 강해져서 돌아오지.', '…피 냄새가 나는군. 좋은 밤이야.']);
  },
  guildLine() { return this.fresh(['출석은 했겠지?', '길드 보스, 다 같이 몰아붙이자.', `${this.stageTxt(Math.floor(rnd(0, 20)))}에서 한참 막혔었지.`, '던전 소탕 잊지 마라.', '길드 레벨이 곧 오른다.', '새 지배자, 환영한다.']); },
  push(ch, who, txt, kind) { const a = this.msgs[ch]; a.push({ who, txt, kind: kind || '' }); if (a.length > 60) a.shift(); if (this.open && this.view === ch) this.drawList(); if (ch === 'world' || kind === 'me') this.preview(who, txt, kind); },
  tick(dt) {   /* main 매 화면에서 부름 */
    this.hookFeed(); if (AUTO || TRAILER) return; this.t -= dt; this.pvT -= dt;
    if (this.t <= 0) { this.t = rnd(14, 30); const r = Math.random();
      if (r < 0.6) this.push('world', this.pick(this.NICK), this.worldLine());
      if (JB.guildOf(st) && Math.random() < 0.35) this.push('guild', this.pick(this.NICK), this.guildLine()); }
    const pv = $('chatpv'); if (pv && this.pvT <= 0 && pv.classList.contains('on')) pv.classList.remove('on');
  },
  preview(who, txt, kind) {   /* 채팅 단추 옆에 4초 · 첫 6판 · 창 · 보스 대마법 · 처음 안내 중엔 안 띄움 */
    if ((st.best || 0) < 6 || this.open || ($('modal') && $('modal').style.display === 'flex') || ['prompt', 'cast'].includes(S.phase)) return;
    { const gd = $('guide'); if (gd && gd.textContent.trim() && !gd.classList.contains('dim') && +getComputedStyle(gd).opacity > 0.3) return; }   /* 11-15 눈 확인(효과재기): 채팅 한 줄이 아래 안내 「영웅은 군단을 강하게 해요」 위에 겹쳐 둘 다 못 읽음 → 안내가 보일 땐 채팅 한 줄 안 띄움 */
    let pv = $('chatpv'); if (!pv) { pv = document.createElement('div'); pv.id = 'chatpv'; pv.addEventListener('click', () => this.openChat()); ($('app') || document.body).appendChild(pv); }
    { const sb = $('skillbar'), ap = ($('app') || document.body).getBoundingClientRect(); if (sb) { const r = sb.getBoundingClientRect(); pv.style.top = (r.top - ap.top - 22) + 'px'; pv.style.left = '6px'; pv.style.right = 'auto'; } }   /* 09:30 싸움터 가운데를 가려서 → 아래 왼쪽 구석(스킬 줄 바로 위) */
    pv.innerHTML = kind === 'sys' ? `<span class="sy">${txt}</span>` : `<b>${who}</b> ${txt}`; pv.classList.add('on'); this.pvT = 4.5;
  },
  esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },
  drawList() { const el = document.getElementById('chatlist'); if (!el) return; el.innerHTML = this.msgs[this.view].map(m => m.kind === 'sys' ? `<div class="cm sys">${this.esc(m.txt)}</div>` : `<div class="cm${m.kind === 'me' ? ' me' : ''}"><b>${this.esc(m.who)}</b><span>${this.esc(m.txt)}</span></div>`).join('') || `<div class="cm sys">…</div>`; el.scrollTop = 1e6; },
  openChat(v) {
    if (v) this.view = v; const T = L.so, hasG = !!JB.guildOf(st); if (this.view === 'guild' && !hasG) this.view = 'world'; this.open = true; const pv = $('chatpv'); if (pv) pv.classList.remove('on');
    UI.openModal(`<div class="chatbox"><div class="ctabs"><button class="btn ${this.view === 'world' ? 'gold' : ''}" data-x="chatView" data-arg="world">${T.world}</button>${hasG ? `<button class="btn ${this.view === 'guild' ? 'gold' : ''}" data-x="chatView" data-arg="guild">${T.gchat}</button>` : ''}</div>
      <div id="chatlist"></div><div class="cin"><input id="chatin" maxlength="40" placeholder="${T.ph}" onkeydown="if(event.key==='Enter'){SO.send();}"><button class="btn gold" data-x="chatSend">${T.send}</button></div><p class="muted mini">${T.demo}</p></div>`);
    this.drawList(); const box = $('modal'); if (!this.watch) { this.watch = setInterval(() => { if (box.style.display !== 'flex' || !document.getElementById('chatlist')) { this.open = false; } }, 500); }
  },
  hookFeed() {   /* 내 게임의 진짜 소식(보스 처치 · 영웅 · 새로 열림 등)을 소식 칸에 */
    if (this.hooked || typeof UI === 'undefined' || !UI.feed) return; this.hooked = 1; const f0 = UI.feed.bind(UI);
    UI.feed = t => { f0(t); const txt = String(t).replace(/<[^>]*>/g, '').trim(); if (txt) { const a = this.msgs.world; a.push({ who: '', txt: '📜 ' + txt, kind: 'sys' }); if (a.length > 60) a.shift(); if (this.open && this.view === 'world') this.drawList(); } };
  },
  send() { const i = document.getElementById('chatin'); if (!i) return; const t = i.value.trim().slice(0, 40); if (!t) return; i.value = ''; this.push(this.view, L.so.me, t, 'me');
    if (Math.random() < 0.7) setTimeout(() => this.push(this.view, this.replier(), /[?？]$/.test(t) ? this.pick(['강화부터 올리시고, 막히면 군단 탭으로 가 보시지요.', '대마법 고리를 맞추시는 게 가장 큽니다.', '모험의 영혼의 무덤을 도시면 금방 뚫립니다.', '보스 상성에 맞게 진형을 짜 보시지요.']) : this.pick(['분부대로, 지배자님.', '좋은 밤입니다, 지배자님.', '군단이 지배자님을 따릅니다.', '하하, 재미있는 말씀이군요.'])), rnd(1500, 4000));
  },
  replier() { const hs = Object.keys(st.heroes || {}).filter(id => L.heroes[id]); return hs.length ? L.heroes[this.pick(hs)].name : '해골 기사단장 카론'; },
  // ───── 길드 ─────
  openGuild() {
    const T = L.so, g = JB.guildOf(st); this.open = false;
    if (!JB.unlocked(st, 'guild')) { UI.openModal(`<h3>${T.guild}</h3><p>${T.lockAt(SN(JB.C.UNLOCK.guild))}</p>`); return; }
    JB.guildDay(st);
    if (!g) { UI.openModal(`<h3>${T.guild}</h3><p class="muted">${T.pick}</p><div class="glist">${JB.GUILD.list.map(x => `<div class="gcard"><img src="art/b_guild.webp" alt="" onerror="this.remove()"><div class="gt"><b>${T.gName[x.id]}</b> <span class="lv">${T.lv(x.lv)}</span><div class="muted mini">${T.gDesc[x.id]} · ${T.members(x.n)}</div><div class="mini gb">${T.buff(Math.round(JB.GUILD.buff * x.lv * 100))}</div></div><button class="btn gold" data-x="guildJoin" data-arg="${x.id}">${T.join}</button></div>`).join('')}</div>`); return; }
    const pct = JB.guildBossPct(st, Date.now()), left = JB.GUILD.hits - g.hits, need = JB.GUILD.expNeed(g.lv), seed = g.id.charCodeAt(1), meP = JB.dunPower(st);
    const mem = [...Array(7)].map((_, i) => ({ n: this.NICK[(seed * 3 + i * 5) % this.NICK.length], p: meP * (2.6 - i * 0.33) * (0.9 + ((seed + i * 7) % 5) / 20) })); mem.push({ n: L.so.me, p: meP, me: 1 }); mem.sort((a, b) => b.p - a.p);
    UI.openModal(`<div class="gwrap"><div class="ghead"><img src="art/b_guild.webp" alt="" onerror="this.remove()"><div><b>${T.gName[g.id]}</b> <span class="lv">${T.lv(g.lv)}</span><div class="mini gb">${T.buff(Math.round(JB.GUILD.buff * g.lv * 100))}</div><div class="gexp"><i style="width:${Math.round(g.exp / need * 100)}%"></i><span>${T.exp(g.exp, need)}</span></div></div>
        <button class="btn ${g.checked ? '' : 'gold'}" data-x="guildCheck" ${g.checked ? 'disabled' : ''}>${g.checked ? T.checked : T.check}</button></div>
      <div class="gboss"><img src="art/foeA4.webp" alt=""><div class="gbt"><b>${T.boss}</b><div class="muted mini">${T.bossD}</div><div class="gbar"><i style="width:${Math.round(pct * 100)}%"></i><span>${Math.round(pct * 100)}%${g.killed ? ' ✔' : ''}</span></div><div class="mini">${T.mine(Math.round(g.dmg * 100))}</div></div>
        <button class="btn ${left ? 'gold' : ''}" data-x="guildHit" ${left ? '' : 'disabled'}>${left ? T.hit(left) : T.hitDone}</button></div>
      <h4>${T.rank}</h4><div class="gmem">${mem.map((m, i) => `<div class="${m.me ? 'me' : ''}"><i>${i + 1}</i><b>${m.n}</b><span>힘 ${fmt(m.p)}</span></div>`).join('')}</div>
      <button class="btn" data-x="chatOpen" data-arg="guild" style="width:100%;margin-top:6px">${T.gchat} ${T.chat}</button></div>`);
  },
  act(x, arg) {
    const T = L.so;
    if (x === 'chat' || x === 'chatOpen') { this.openChat(arg); return true; }
    if (x === 'chatView') { this.openChat(arg); return true; }
    if (x === 'chatSend') { this.send(); return true; }
    if (x === 'guild') { this.openGuild(); return true; }
    if (x === 'guildJoin') { if (JB.guildJoin(st, arg)) { Snd.chime && Snd.chime(1175); Snd.smp('summon', 0.5); UI.toast(T.guild, T.joined(T.gName[arg])); this.msgs.guild = []; this.push('guild', this.pick(this.NICK), '새 지배자, 환영한다.'); setTimeout(() => this.push('guild', this.pick(this.NICK), '출석과 길드 보스, 잊지 마라.'), 1800); } this.openGuild(); return true; }
    if (x === 'guildCheck') { const r = JB.guildCheck(st); if (r) { Snd.chime && Snd.chime(1319); UI.toast(T.guild, T.checkGot(r.gems, r.bones)); if (r.up) UI.toast(T.guild, T.lvUp(JB.guildOf(st).lv)); } this.openGuild(); UI.render(true); return true; }
    if (x === 'guildHit' && !this.hitNow) { if (this.hitBusy) return true; this.hitBusy = 1; UI.vsCustom('foeA4', T.boss.replace('길드 보스 ', ''), T.guild, () => { this.hitBusy = 0; this.hitNow = 1; try { this.act('guildHit'); } finally { this.hitNow = 0; } }); return true; }
    if (x === 'guildHit') { const r = JB.guildHit(st, Date.now()); if (r) { S.shake = Math.max(S.shake || 0, 10); Snd.slam && Snd.slam(0.5); Snd.smp('soul', 0.6); UI.toast(T.boss, T.hitGot(r.gems, r.bones)); if (r.kill) { Snd.smp('win', 0.9); UI.toast(T.guild, T.kill(r.kill.gems, r.kill.bones)); this.push('world', '', `⚔ 우리 길드 「${T.gName[JB.guildOf(st).id]}」가 길드 보스를 처치했어요!`, 'sys'); } if (r.up) UI.toast(T.guild, T.lvUp(JB.guildOf(st).lv)); } this.openGuild(); UI.render(true); return true; }
    return false;
  },
};
