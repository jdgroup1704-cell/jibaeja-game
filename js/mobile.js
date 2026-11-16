/* 11-17 00:37 대표님 「던전 히어로 직원판 채팅 읽어서 모바일 화면이랑 배울 거 배우고 와」 — 그쪽 빌드 57에서 가져온 것
   ① 카카오톡 · 네이버 · 인스타 안 브라우저면 위아래가 잘림 → 위 띠로 「크롬(삼성 인터넷)으로 열기」(카톡 안드로이드는 바로 바깥 브라우저로 넘김)
   ② 아이폰 사파리는 꽉 찬 화면이 안 됨 → 「공유 → 홈 화면에 추가」 안내(하루 한 번)
   ③ 폰이 「설치할 수 있어요」 신호를 주면 설정 창에 설치 단추 · 홈 화면 아이콘으로 처음 들어오면 설치 선물(마정석 100, 한 번)
   ④ 주소창이 들어갔다 나왔다 할 때도 화면을 다시 맞춤
   ⑤ 꽉 찬 화면이 풀리면 다음 터치 때 다시 켬(한 판에 3번까지) */
const MOB = (() => {
  const UA = navigator.userAgent || '', IS_KAKAO = /KAKAOTALK/i.test(UA), IS_IOS = /iPhone|iPad|iPod/i.test(UA), IS_AND = /Android/i.test(UA);
  const IN_APP = IS_KAKAO || /NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps/i.test(UA);
  let TOP = true; try { TOP = top === window; } catch (e) { TOP = false; }   /* 클로드 시험판(틀 안)에서는 아무것도 안 함 */
  const isApp = () => { try { return navigator.standalone === true || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches; } catch (e) { return false; } };
  let instEvt = null; const M = { IN_APP, IS_IOS, IS_KAKAO, canInstall: () => !!instEvt && !isApp(), isApp };
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); instEvt = e; });
  addEventListener('appinstalled', () => { instEvt = null; try { UI.toast(L.mob.instT, L.mob.instDone); } catch (e) {} });
  M.install = () => { if (!instEvt) { M.guide(true); return; } const ev = instEvt; instEvt = null; try { ev.prompt(); ev.userChoice && ev.userChoice.then(c => { if (c && c.outcome !== 'accepted') instEvt = ev; }); } catch (e) {} };
  M.openOut = () => { const u = location.href; if (IS_KAKAO && IS_AND) { location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(u); return; } if (IS_AND) { location.href = 'intent://' + u.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end'; return; } try { navigator.clipboard && navigator.clipboard.writeText(u); } catch (e) {} M.say(L.mob.copied); };
  M.say = (txt, btn, fn) => { let el = document.getElementById('mbar'); if (!el) { el = document.createElement('div'); el.id = 'mbar'; document.body.appendChild(el); }
    el.innerHTML = `<span>${txt}</span>${btn ? `<button class="mb-go">${btn}</button>` : ''}<button class="mb-x" aria-label="${L.ui.close}">✕</button>`; el.className = 'on';
    el.querySelector('.mb-x').onclick = ev => { ev.stopPropagation(); el.className = ''; try { sessionStorage.setItem('jb-mbar-no', '1'); } catch (e) {} };
    const g = el.querySelector('.mb-go'); if (g) g.onclick = ev => { ev.stopPropagation(); fn && fn(); };
    clearTimeout(M._hid); M._hid = setTimeout(() => { el.className = ''; }, 15000); };   /* 띠가 판 이름 · 2배속을 덮음(눈 확인) → 15초 뒤 저절로 접힘 */
  M.guide = force => { if (!TOP || isApp()) return; let no = false; try { no = sessionStorage.getItem('jb-mbar-no') === '1'; } catch (e) {} if (no && !force) return;
    if (IN_APP) { M.say(IS_KAKAO ? L.mob.kakao : L.mob.inapp, L.mob.outBtn, M.openOut); return; }
    if (IS_IOS) { let last = ''; try { last = localStorage.getItem('jb-ios-tip') || ''; } catch (e) {} const today = new Date().toDateString(); if (force || last !== today) { try { localStorage.setItem('jb-ios-tip', today); } catch (e) {} M.say(L.mob.ios); } return; }
    if (force) M.say(L.mob.andHow); };
  /* 홈 화면 아이콘으로 처음 들어오면 설치 선물(저장에 한 번만) */
  M.GIFT = 0;   /* 11-17 02:2x 던전 히어로 조언 「무료 재화는 먼저 여쭙기」 — 대표님 답 전까지 0(설치 선물 끔) */
  M.gift = () => { if (!M.GIFT || !TOP || !isApp() || typeof st === 'undefined' || !st || (st.seen && st.seen.installGift)) return; st.seen = st.seen || {}; st.seen.installGift = 1; st.gems = (st.gems || 0) + M.GIFT; try { save(); } catch (e) {} setTimeout(() => { try { UI.toast(L.mob.giftT, L.mob.gift); Snd.chime && Snd.chime(1319); UI.render(true); } catch (e) {} }, 2500); };
  /* ④ 주소창 */ try { if (window.visualViewport) visualViewport.addEventListener('resize', () => { try { resize(); } catch (e) {} }); } catch (e) {} setTimeout(() => { try { resize(); } catch (e) {} }, 300); setTimeout(() => { try { resize(); } catch (e) {} }, 1500);
  /* ⑤ 꽉 찬 화면 다시 */ let fsN = 0; document.addEventListener('pointerdown', () => { try { if (!TOP || IS_IOS || IN_APP || fsN >= 3 || typeof TRAILER !== 'undefined' && TRAILER || typeof AUTO !== 'undefined' && AUTO || !matchMedia('(pointer:coarse)').matches || document.fullscreenElement || document.webkitFullscreenElement || isApp()) return; if (!M._fsWas) { M._fsWas = 1; return; } fsN++; const d = document.documentElement, f = d.requestFullscreen || d.webkitRequestFullscreen; if (f) { const r = f.call(d, { navigationUI: 'hide' }); if (r && r.catch) r.catch(() => {}); } } catch (e) {} }, true);   /* 첫 터치는 원래(main.js fsOnce)가 함 */
  /* ⑥ 기록 옮기기(던전 히어로 「DH4.」 글자처럼): 저장 전체를 글자 한 줄로 → 다른 폰 · 브라우저에 붙여 넣으면 이어서 */
  const b64e = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), b64d = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  M.code = () => { try { save(); } catch (e) {} return 'JBK1.' + b64e(JB.serialize(st)); };
  M.parse = code => { try { const m = /JBK1\.([A-Za-z0-9_-]+)/.exec(code || ''); if (!m) return null; const raw = b64d(m[1]), o = JB.deserialize(raw); return o && typeof o.stage === 'number' ? { raw, o } : null; } catch (e) { return null; } };
  M.moveOpen = () => { const c = M.code(); UI.openModal(`<h3>${L.mob.mvT}</h3><p class="muted">${L.mob.mvD}</p><textarea id="mvOut" readonly style="width:100%;height:4.5em;font-size:11px;word-break:break-all">${c}</textarea><div class="row" style="gap:6px;border:0"><button class="btn gold" data-x="mvCopy">${L.mob.mvCopy}</button></div><h4 style="margin:.6em 0 .2em">${L.mob.mvIn}</h4><textarea id="mvIn" placeholder="JBK1.…" style="width:100%;height:4.5em;font-size:11px"></textarea><div class="row" style="gap:6px;border:0"><button class="btn" data-x="mvLoad">${L.mob.mvLoad}</button></div><p id="mvMsg" class="muted"></p>`); };
  M.copy = () => { const t = document.getElementById('mvOut'); if (!t) return; try { navigator.clipboard.writeText(t.value).then(() => M.msg(L.mob.mvCopied), () => { t.select(); document.execCommand('copy'); M.msg(L.mob.mvCopied); }); } catch (e) { try { t.select(); document.execCommand('copy'); M.msg(L.mob.mvCopied); } catch (e2) {} } };
  M.msg = t => { const e = document.getElementById('mvMsg'); if (e) e.innerHTML = t; };
  M.load = (confirmed) => { const t = document.getElementById('mvIn'), r = M.parse(t && t.value); if (!r) { M.msg(L.mob.mvBad); return; }
    if (!confirmed) { M.msg(`${L.mob.mvAsk(L.stage ? L.stage(r.o.stage) : r.o.stage, st && L.stage ? L.stage(st.stage) : '')} <button class="btn gold" data-x="mvYes">${L.mob.mvYes}</button>`); return; }
    try { localStorage.setItem(SAVE_KEY + '_옮기기전', JB.serialize(st)); localStorage.setItem(SAVE_KEY, r.raw); window.__wiped = true; } catch (e) { M.msg(L.mob.mvBad); return; } location.reload(); };   /* 원래 기록은 따로 남겨 둠 */
  setTimeout(() => { M.guide(false); M.gift(); }, 2200);
  window.__mob = M;   /* 관문이 읽음 */
  return M;
})();
