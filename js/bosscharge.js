/* 11-16 순서 #12 보스전(01:42 대표님 「보스전 이거도 안 땡기게 만들어 놨고」) — 「약점 끊기」
   보스 큰 기술(3번째 공격마다) 앞에 1.9초 힘을 모으며 가슴에 붉은 금빛 약점이 드러남 → 눌러서 끊으면 「반격!」:
   기술 취소 · 보스 체력 6% 깎기 · 보스 시간 +2초 · 보스 휘청. 못 누르면 지금처럼 기술이 터짐(방치하는 사람에게 벌은 없음 — 누르면 이득만).
   그전엔 보스전에서 손으로 할 게 대마법 한 번뿐이었음 */
const BC = {
  c: null,
  el() {
    let e = document.getElementById('bweak'); if (e) return e;
    e = document.createElement('div'); e.id = 'bweak'; e.innerHTML = '<i class="ring"></i><i class="core"></i><b></b>';
    e.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); BC.hit(); });
    document.body.appendChild(e); return e;
  },
  start() {
    const g = S.giant; if (!g || g.dead || this.c) return false;
    this.c = { t: 0, L: 1.9 }; const e = this.el(); e.querySelector('b').textContent = L.bc.tap; e.classList.add('on');
    Snd.smp && Snd.smp('click', 0.5, 0, 0.55); g.raise = 1; return true;
  },
  place() {
    const e = this.el(), g = S.giant, r = cv.getBoundingClientRect(), k = r.width / cv.width;
    const wx = g.x - 10, wy = g.y - 230;   /* 보스 가슴(키 400의 가운데보다 조금 위) */
    const sx = r.left + (wx * view.s + view.ox) * k; e.style.left = Math.max(r.left + 60, Math.min(r.left + r.width * 0.72, sx)) + 'px';   /* 휴대폰에선 보스가 오른쪽 끝이라 약점이 설정 · 채팅 단추 위에 겹쳤음(약점_2 사진) → 단추 기둥 안쪽으로 */ e.style.top = (r.top + (wy * view.s + view.oy) * k) + 'px';
  },
  tick() {   /* 화면 한 장마다 — 흐른 시간은 게임 시계(S.t)로(느린 기기에서 1/60로 세면 1.9초가 길어졌음) */
    const c = this.c; if (!c) return; const dt = Math.max(0, Math.min(0.1, S.t - (c.lt ?? S.t))); c.lt = S.t;
    const g = S.giant; if (!st.boss || !g || g.dead || UI.awakening) { this.end(); return; }
    c.t += dt; this.place(); this.el().style.setProperty('--k', (1 - c.t / c.L).toFixed(3));
    if (c.t >= c.L) { this.end(); st.seen.bcMiss = (st.seen.bcMiss || 0) + 1; bossSpecial(); }
  },
  end() { this.c = null; const e = document.getElementById('bweak'); if (e) e.classList.remove('on'); },
  hit() {
    if (!this.c || !st.boss) return; this.end();
    const g = S.giant, dmg = st.maxHp * 0.06; st.hp = Math.max(1, st.hp - dmg); st.boss.timer += 2;
    st.seen.bcHit = (st.seen.bcHit || 0) + 1;
    g.stagger = 0.8; g.raise = 0; punch(0.16, 18, [60, 40, 90]);
    say(L.bc.hit, W / 2, 0, { top: true, size: 56, col: '#fff0b0', glow: '#ffb020', life: 1.5, vy: 0, stamp: true, screen: true });
    say(L.bc.sub, W / 2, 0, { size: 26, col: '#ffe6a0', glow: '#a05a00', life: 1.5, vy: 0, screen: true });
    burst(g.x - 10, g.y - 230, 60, { col: ['#ffd76a', '#fff3c4', '#ff8a2a'], vmax: 320 });
    Snd.smp && Snd.smp('summon', 0.8, 0, 1.4);
  },
};
