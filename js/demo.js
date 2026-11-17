/* 11-17 02:44 대표님 「로봇이 화면에서 직접 플레이하는 창 + 빨리 감기 · 내 기록 · 서버는 건드리지 않게 시범용 저장 따로」(던전 히어로 조언 「자동 시범」 · 방치형판 = 하루치 빨리 감기)
   · 설정 → 「🤖 자동 시범」 또는 주소 끝 #demo · ?demo=1
   · 저장은 jibaeja_demo_… 따로(대표님 기록 jibaeja_b… 는 읽지도 쓰지도 않음) · 우리 게임은 서버가 없음(채팅 · 길드는 기기 안 흉내)
   · 로봇 = 시험 관문이 쓰는 그 봇(botStep): 일으켜라 · 싼 강화부터 · 무덤 · 제단 · 모집 · 임무 받기 · 각성 · 대마법
   · 위 띠: 빠르기 ×1 ×4 ×10 ×20 · 「하루 넘기기」(날짜만 넘겨 매일 것이 다시 참) · 지금 로봇이 한 일 · 게임 안 시간 · 판 · 각성 · 군단 힘 · 끝내기 */
const DEMOUI = (() => {
  if (!DEMO) return null;
  const SP = [1, 4, 10, 20]; window.DEMO_SP = 4; try { sessionStorage.setItem('jbDemo', '1'); } catch (er) {} const log = []; const T0 = Date.now();
  const nm = { up: k => `강화: ${(L.ups && L.ups[k] && (L.ups[k].name || L.ups[k].n || L.ups[k])) || k}`, pull: () => '영웅 모집', awaken: () => '각성!', cast: () => '대마법', day: () => '하루 넘김' };
  BOT.say = (k, a) => { const t = (nm[k] || (() => k))(a); if (log[0] && log[0].t === t) { log[0].n++; return; } log.unshift({ t, n: 1 }); log.length = Math.min(log.length, 3); tapAt(k, a); };
  /* 16:3x 조언 4 「손가락을 보여 주고 누르기」: 로봇이 누른 단추 위에 손가락이 내려와 꾹 누름(0.5초) — 보이는 단추일 때만(다른 탭이면 탭 단추를 짚음) */
  const fg = document.createElement('div'); fg.id = 'dfinger'; fg.innerHTML = '<i></i><img src="art/finger.webp" alt="">'; document.body.appendChild(fg); let fgT = 0;
  const tapAt = (k, a) => { if (window.DEMO_SKIP) return; const sel = { up: `.ucard[data-arg="${a}"] .btn.buy`, pull: '[data-act="pull1"],[data-act="pull10"]', awaken: '[data-act="awaken"],[data-x="awaken"]', cast: '#castBtn,#cast,.castbtn' }[k]; if (!sel) return;
    let e = document.querySelector(sel); if (!e || !e.getBoundingClientRect().width) e = document.querySelector(`#tabs [data-tab="${{ up: 'up', pull: 'hero', awaken: 'awaken' }[k] || ''}"]`); if (!e) return; const r = e.getBoundingClientRect(); if (!r.width || r.top > innerHeight) return;
    fg.style.left = (r.left + r.width * 0.5) + 'px'; fg.style.top = (r.top + r.height * 0.55) + 'px'; fg.classList.remove('on'); void fg.offsetWidth; fg.classList.add('on'); clearTimeout(fgT); fgT = setTimeout(() => fg.classList.remove('on'), 520); };
  const el = document.createElement('div'); el.id = 'demobar';
  el.innerHTML = `<div class="db1"><b>🤖 ${L.demo.title}</b><span class="dbsp">${SP.map(v => `<button data-sp="${v}">×${v}</button>`).join('')}</span><button class="dbskip">⏩ ${L.demo.skip}</button><button class="dbday">${L.demo.day}</button><button class="dbx">${L.demo.exit}</button></div><div class="db2"></div><div class="db3"></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', e => { e.stopPropagation(); const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.sp) { window.DEMO_SP = +b.dataset.sp; if (window.DEMO_SKIP) skip(false); }
    else if (b.classList.contains('dbskip')) skip(!window.DEMO_SKIP);
    else if (b.classList.contains('dbday')) { const real = st.day; JB.newDay(st, -1 - (st.daysPlayed || 0)); st.day = real; st.lastSeen = Date.now() - 8 * 3600e3; try { offlineCheck(); } catch (er) {} BOT.say('day'); }   /* 날짜만 넘김 + 밤사이 8시간 자리 비움 보상 */
    else if (b.classList.contains('dbx')) { if (!el.dataset.sum) { el.dataset.sum = 1; window.DEMO_SP = 0.0001; UI.openModal(`<h3>🤖 ${L.demo.sumT}</h3><p>${L.demo.stat(Math.floor(BOT.t / 60) + '분', L.stage ? L.stage(st.best) : st.best, st.awakens || 0, typeof fmt === 'function' ? fmt(JB.armySize(st)) : JB.armySize(st), st.daysPlayed || 0)}</p><p class="muted">${L.demo.sumD}</p><button class="btn gold" id="demoEnd" style="width:100%">${L.demo.exit}</button>`); const e2 = document.getElementById('demoEnd'); if (e2) e2.onclick = () => DEMOUI.leave(); return; } DEMOUI.leave(); }   /* 끝낼 때 로봇이 한 결과 카드 한 번 */
    paint(); });
  /* 16:3x 조언 4 「그림 건너뛰고 결과만」: 그리기를 멈추고(절전 모드와 같은 방법) 규칙만 ×60으로 돌림 — 일주일치를 몇 분에 */
  let spKeep = 4; const skip = on => { window.DEMO_SKIP = on ? 1 : 0; if (on) { spKeep = window.DEMO_SP; window.DEMO_SP = 60; } else if (window.DEMO_SP === 60) window.DEMO_SP = spKeep; document.body.classList.toggle('dskip', !!on); el.querySelector('.dbskip').textContent = on ? '▶ ' + L.demo.skipBack : '⏩ ' + L.demo.skip; paint(); };
  const paint = () => { el.querySelectorAll('[data-sp]').forEach(b => b.classList.toggle('on', +b.dataset.sp === window.DEMO_SP));
    const gm = Math.floor(BOT.t / 60), gs = Math.floor(BOT.t % 60);
    el.querySelector('.db2').textContent = L.demo.stat(`${gm}분 ${gs}초`, L.stage ? L.stage(st.stage) : st.stage, st.awakens || 0, (typeof fmt === 'function' ? fmt(JB.armySize(st)) : JB.armySize(st)), st.daysPlayed || 0);
    el.querySelector('.db3').innerHTML = (window.DEMO_SKIP ? `<span class="new">${L.demo.skipOn}</span> · ` : '') + log.map((x, i) => `<span class="${i ? '' : 'new'}">${x.t}${x.n > 1 ? ' ×' + x.n : ''}</span>`).join(' · ') || L.demo.wait; };
  setInterval(paint, 400); paint();
  const leave = () => { try { save(); } catch (er) {} try { sessionStorage.removeItem('jbDemo'); } catch (er) {} try { history.replaceState(null, '', location.pathname); } catch (er) {} location.hash = ''; location.reload(); };   /* 시범 끝: 대표님 기록(원래 저장)으로 */
  return { log, el, leave };
})();
