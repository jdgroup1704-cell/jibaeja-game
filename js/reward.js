/* 11-16 순서 #12 「보상이 눈에 보이게」(01:42 대표님 「보스전 이거도 안 땡기게」)
   그전: 보스를 잡으면 「승리!」 · 「영혼 +13 · 마정석 +30」이 작은 글자로 잠깐 뜨고 「새로 열림」 알림에 가렸음(영상_약점거인2 55초)
   이제: 보스 자리에서 영혼 · 마정석 아이콘이 쏟아져 위 띠의 숫자 칸으로 날아가 박히고(칸이 통 튐), 가운데에 「보스 격파!」 + 받은 것 큰 띠 */
const RW = {
  n: 0, arrived: 0,
  pos(wx, wy) { const r = cv.getBoundingClientRect(), k = r.width / cv.width; return { x: r.left + (wx * view.s + view.ox) * k, y: r.top + (wy * view.s + view.oy) * k, r }; },
  show(de, gx, gy, k = 0) {
    if (!de) return; if (k < 60 && ((typeof NOTICE !== 'undefined' && NOTICE.busy()) || (typeof UI !== 'undefined' && UI.busy && UI.busy()))) { setTimeout(() => this.show(de, gx, gy, k + 1), 300); return; }   /* 11-17 04:24 「보스 격파!」가 자리 비움 창 · 대마법 이름 위에 겹쳤음 → 비면 띄움 */
    this.n++;
    if (typeof Snd !== 'undefined' && Snd.smp && !TRAILER) { const n = [1, 2, 3, 4, 5].filter(i => i !== RW.lastV); const v = n[Math.floor(Math.random() * n.length)]; RW.lastV = v; Snd.voiceCd('v_lwin' + v, 6, 1.1); }   /* 11-17 18:5x 💡 보스를 깨면 지배자 목소리 한 줄(일레븐랩스 Midnight Cave · 3일차 영상과 같은 목소리) — 「다음은… 누구냐」 등 5줄 · 같은 줄 연달아 X · 1.1초 뒤(영웅 말과 안 겹치게) */
    const p = this.pos(Math.min(gx, VW.x + VW.w * 0.6), gy - 160), r = p.r;
    const items = [['souls', 'i_soul', fmt(de.souls || 0), L.rw.souls]]; if (de.gems) items.push(['gems', 'i_gem', de.gems, L.rw.gems]); if (de.bones) items.push(['bones', 'i_bone', de.bones, L.rw.bones]);
    /* 가운데 큰 띠 */
    const b = document.createElement('div'); b.className = 'rwban';
    b.innerHTML = `<b>${L.rw.title}</b><div>${items.map(([, ic, v, nm]) => `<span><img src="art/${ic}.webp" alt="">${nm} <em>+${v}</em></span>`).join('')}</div>`;
    b.style.left = (r.left + r.width / 2) + 'px'; const rc = document.getElementById('rcard'), chap = (rc && rc.classList.contains('on')) || (st.stage > 1 && st.stage % 10 <= 1); b.style.top = (r.top + r.height * 0.32) + 'px'; if (typeof NOTICE !== 'undefined') NOTICE.hold(2100, 3); { const bv = document.getElementById('bvb'); if (bv) bv.classList.remove('on'); }   /* 11-18 새 틀: 늘 같은 자리 · 떠 있는 2.1초 동안 다른 알림은 기다림 */   /* 지역 보스면 「제N장」 카드 제목을 덮지 않게 위로(보상_관문 사진) */
    document.body.appendChild(b); setTimeout(() => b.classList.add('out'), 1700); setTimeout(() => b.remove(), 2100);
    /* 아이콘이 보스 자리에서 튀어 올랐다가 위 띠 숫자 칸으로 */
    items.forEach(([cur, ic], j) => {
      const tg = document.querySelector(`#hud [data-cur="${cur}"]`); if (!tg) return; const tr = tg.getBoundingClientRect();
      const cnt = cur === 'souls' ? 8 : 6;
      for (let i = 0; i < cnt; i++) {
        const e = document.createElement('img'); e.src = `art/${ic}.webp`; e.className = 'rwfly'; e.alt = '';
        const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 50, sx = p.x + Math.cos(a) * d, sy = p.y + Math.sin(a) * d * 0.6 - 20;
        e.style.left = p.x + 'px'; e.style.top = p.y + 'px'; document.body.appendChild(e);
        const t0 = 120 + j * 160 + i * 55;
        setTimeout(() => { e.style.transition = 'left .28s ease-out, top .28s ease-out, transform .28s'; e.style.left = sx + 'px'; e.style.top = sy + 'px'; e.style.transform = 'translate(-50%,-50%) scale(1.25)'; }, t0);
        setTimeout(() => { e.style.transition = 'left .5s cubic-bezier(.5,0,.9,.6), top .5s cubic-bezier(.3,.6,.6,1), transform .5s, opacity .5s'; e.style.left = (tr.left + 16) + 'px'; e.style.top = (tr.top + tr.height / 2) + 'px'; e.style.transform = 'translate(-50%,-50%) scale(.7)'; }, t0 + 380);
        setTimeout(() => { e.remove(); this.arrived++; tg.classList.remove('rwbump'); void tg.offsetWidth; tg.classList.add('rwbump'); if (i % 2 === 0) Snd.smp && Snd.smp('soul', 0.25, 0, 1.6 + j * 0.2); }, t0 + 880);
      }
    });
  },
};
