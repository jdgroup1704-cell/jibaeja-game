/* 11-16 10:29 대표님 「던전 히어로 마왕 김진동 스킬 봐 봐 · 하루 만에 아들 위해 만든 거 · 재밌어하네 · 반성해」
   거기서 가져온 것: 보스가 말한다(등장 · 분노 · 쓰러짐) · 체력이 깎이면 「2페이지」로 바뀌며 기술이 늘어난다.
   - 등장: 「대결」 카드가 끝나면 보스 머리 위 말풍선(2.4초)
   - 2페이지: 보스 체력 50% 아래 → 화면 카드 「2페이지 · ○○ 분노!」 + 분노 대사 + 붉은 기운, 그 뒤로 큰 기술에 두 번째 기술이 섞이고 약점이 2번에 한 번
   - 쓰러짐: 마지막 대사 */
const BV = {
  bubble(text, life = 2.4) {
    const g = S.giant; if (!g || !text) return;
    let e = document.getElementById('bvb'); if (!e) { e = document.createElement('div'); e.id = 'bvb'; document.body.appendChild(e); }
    e.textContent = text; e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); this.bT = life; this.place();
  },
  place() {
    const e = document.getElementById('bvb'); if (!e || !e.classList.contains('on')) return;
    const g = S.giant, r = cv.getBoundingClientRect(), k = r.width / cv.width, M = ctx.getTransform ? null : null;
    const wx = NARROW() ? g.x - 230 : Math.min(g.x - 40, VW.x + VW.w * 0.62), wy = NARROW() ? g.y - 250 : g.y - 330;   /* 16:12 폰: 말풍선이 보스 몸 · 얼굴을 덮었음 → 보스 왼쪽 옆 */   /* 보스 체력 막대 · 남은 시간 아래(덮었음) */
    const sx = r.left + (wx * view.s + view.ox) * k, sy = r.top + (wy * view.s + view.oy) * k;
    e.style.left = Math.max(r.left + 90, Math.min(r.right - 110, sx)) + 'px'; e.style.top = Math.max(r.top + 150, sy) + 'px';
  },
  tick(dt) {
    if (this.bT > 0 && document.querySelector('#rcard.on')) this.bT = 0.01;   /* 「제N장」 카드가 뜨면 말풍선 내림(겹쳤음) */
    if (this.bT > 0) { this.bT -= dt; this.place(); if (this.bT <= 0) { const e = document.getElementById('bvb'); if (e) e.classList.remove('on'); } }
    const b = st.boss; if (!b || b.phase !== 'fight' || !S.giant || S.giant.dead) return;
    if (!b.ph2 && st.hp / Math.max(1, st.maxHp) < 0.5 && !S.texts.some(t => t.screen && t.size >= 40 && t.age < t.life)) this.phase2();   /* 「반격!」 같은 큰 글자가 지나간 뒤에(겹쳤음) */
  },
  line(i, stage) { const r = regionOf(stage || st.stage); return (L.bline[r] || L.bline[0])[i]; },
  arrive() { setTimeout(() => { if (st.boss && !(UI.vsShown)) this.bubble(this.line(0)); UI.vsShown = 0; }, 2700); },   /* 대결 화면에서 이미 말했으면 말풍선은 생략 */
  phase2() {
    const b = st.boss; b.ph2 = 1; S.ph2 = 1;
    const nm = typeof bossName === 'function' ? bossName() : L.boss.name(L.regions[regionOf(st.stage)], b.lord);
    let c = document.getElementById('bph2'); if (!c) { c = document.createElement('div'); c.id = 'bph2'; c.innerHTML = '<b></b><small></small>'; document.body.appendChild(c); }
    c.querySelector('b').textContent = L.bph2.card; c.querySelector('small').textContent = L.bph2.sub(nm);
    const r = cv.getBoundingClientRect(); c.style.left = (r.left + r.width / 2) + 'px'; c.style.top = (r.top + r.height * 0.3) + 'px';
    c.classList.remove('on'); void c.offsetWidth; c.classList.add('on'); setTimeout(() => c.classList.remove('on'), 1600);
    S.shake = Math.max(S.shake, 14); S.flash = Math.max(S.flash || 0, 0.25); Snd.slam && Snd.slam(0.7); Snd.smp && Snd.smp('stare', 0.6, 0, 0.9);
    S.giant.rage = 1; S.raged = true;
    setTimeout(() => { if (st.boss) this.bubble(this.line(1), 2.2); }, 1600);   /* 11-16 15:4x 폰: 「2페이지」 카드(1.6초)와 분노 대사가 겹쳤음 → 카드가 사라진 뒤 */
    st.seen.ph2 = (st.seen.ph2 || 0) + 1;
  },
  down(stage) { const t = this.line(2, stage); if (t) this.bubble(t, 1.6); },   /* 판이 넘어간 뒤라 잡은 보스의 판으로 고름(다음 지역 대사가 나왔음) */
};
