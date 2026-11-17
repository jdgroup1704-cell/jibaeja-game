/* 알림 줄(11-18 새 틀 · 대표님 03:09 사진: 「보스 격파!」가 「2페이지」 · 「…거인 분노!」 위에 세 겹 · 「망자 거인이 일어났다!」와 설명 줄이 겹침)
   규칙: 싸움터 가운데 큰 알림은 이 줄 하나로만 뜬다. 한 번에 하나. 막(VS · 보스 격파 · 각성)이 떠 있으면 나머지는 기다림. 4초 넘게 기다린 띠는 버림(늦은 소식은 의미 없음).
   pri: 3 막 · 2 띠(2페이지 · 거인 · 고비 · 경고 · 대마법 ○초) · 1 작은 띠 */
const NOTICE = {
  q: [], until: 0, last: null,
  now() { return performance.now(); },
  busy() { return this.now() < this.until || !!document.querySelector('#vsfx.go'); },
  hold(ms, pri = 3) { this.until = Math.max(this.until, this.now() + ms); if (pri >= 3) { const e = this.box(); e.classList.remove('on'); } },   /* 막: 다른 띠는 숨기고 그 시간만큼 줄을 막음 */
  box() { let e = document.getElementById('notice'); if (!e) { e = document.createElement('div'); e.id = 'notice'; e.innerHTML = '<b></b><small></small>'; (document.getElementById('stagewrap') || document.body).appendChild(e); } return e; },
  push(it) { it.t0 = this.now(); this.q.push(it); this.q.sort((a, b) => b.pri - a.pri || a.t0 - b.t0); if (this.q.length > 6) this.q.length = 6; this.tick(); },
  tick() {
    const n = this.now(); this.q = this.q.filter(x => x.pri >= 3 || n - x.t0 < 4000);
    if (this.busy() || !this.q.length) return;
    const it = this.q.shift(); this.until = n + (it.ms || 1700);
    if (it.run) { it.run(); return; }
    { const bv = document.getElementById('bvb'); if (bv) bv.classList.remove('on'); }   /* 띠가 뜨면 보스 말풍선은 내림(한 번에 하나) */
    const e = this.box(); e.className = it.cls || ''; e.style.setProperty('--c', it.col || '#ffe9a8'); e.style.setProperty('--g', it.glow || '#8a3cff');
    { const bb = e.querySelector('b'); bb.textContent = it.title || ''; const w = (e.parentElement || document.body).getBoundingClientRect().width - 20, len = Math.max(1, (it.title || '').length); bb.style.fontSize = Math.max(18, Math.min(34, w / (len * 1.02))) + 'px'; }   /* 글자 수에 맞춰 크기를 줄여 한 줄에 다 들어가게(「경고 · 거대한 적이 다가…」처럼 잘리지 않게) */ const sm = e.querySelector('small'); sm.textContent = it.sub || ''; sm.style.display = it.sub ? '' : 'none';
    e.style.setProperty('--ms', (it.ms || 1700) + 'ms'); void e.offsetWidth; e.classList.add('on');
  },
  /* director.js say(…, {screen:true}) → 여기로: 큰 글자는 새 띠, 바로 뒤(0.15초 안) 작은 글자는 그 띠의 둘째 줄 */
  say(text, o = {}) {
    if (typeof text !== 'string' || !text) return; const n = this.now(), big = (o.size || 28) >= 34;
    const p = this.last && n - this.last.t < 150 ? this.last.it : null;
    if (!big && p && !p.sub) { p.sub = text; if (!this.q.includes(p)) { const e = this.box(); if (e.classList.contains('on')) { const sm = e.querySelector('small'); sm.textContent = text; sm.style.display = ''; } } return; }
    const it = { pri: o.pri || (big ? 2 : 1), ms: Math.max(1200, Math.min(2600, (o.life || 1.7) * 1000)), title: text, col: o.col, glow: o.glow, cls: o.cls || '' };
    this.last = { t: n, it }; this.push(it);
  },
  banner(title, sub, o = {}) { const it = Object.assign({ pri: 2, ms: 1700, title, sub }, o); this.last = { t: this.now(), it }; this.push(it); },
};
setInterval(() => { NOTICE.tick(); if (NOTICE.busy()) { const bv = document.getElementById('bvb'); if (bv && bv.classList.contains('on')) bv.classList.remove('on'); } }, 100);
