/* 11-16 순서 #11 입소문 장치(01:40 대표님 「광고 할 돈도 없다 · 주변이 추천해 줄 만한 게임」) — 「내 군단 자랑 카드」
   지금 전장 그림 위에 내 군단 숫자(힘 · 판 · 망자 거인 · 영웅)를 얹은 세로 카드 한 장을 만들어 카톡 · 인스타로 바로 보냄
   (휴대폰 공유 창 navigator.share → 안 되면 그림 내려받기 + 글 복사). 보스를 잡아 망자 거인이 일어난 직후 「자랑하기」 단추가 반짝임 */
const BRAG = {
  shot() {   /* 전장 캔버스 → 1080×1350 카드 */
    const W2 = 1080, H2 = 1350, c = document.createElement('canvas'); c.width = W2; c.height = H2; const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, H2); bg.addColorStop(0, '#1a0830'); bg.addColorStop(1, '#07010f'); g.fillStyle = bg; g.fillRect(0, 0, W2, H2);
    this.scene(g, 0, 150, W2, 640);
    const T = L.brag, gold = '#ffd76a', vio = '#c9a2ff';
    g.textAlign = 'center'; g.fillStyle = gold; g.font = '900 64px sans-serif'; g.shadowColor = '#8a3cff'; g.shadowBlur = 24; g.fillText(T.brand, W2 / 2, 100); g.shadowBlur = 0;
    const army = JB.armySize ? JB.armySize(st) : 0, dps = JB.dps(st), stg = typeof SN === 'function' ? SN(st.best || st.stage) : (st.best || st.stage);
    const rows = [[T.power, fmt(dps)], [T.army, fmt(army)], [T.stage, String(stg)], [T.thrall, String(st.thralls || 0)]];
    let y = 860; g.font = '700 40px sans-serif';
    rows.forEach(([a, b], i) => { const x = i % 2 ? W2 * 0.73 : W2 * 0.27, yy = y + Math.floor(i / 2) * 130; g.fillStyle = 'rgba(140,70,255,.18)'; g.beginPath(); g.roundRect ? g.roundRect(x - 230, yy - 62, 460, 112, 24) : g.rect(x - 230, yy - 62, 460, 112); g.fill(); g.fillStyle = vio; g.font = '700 32px sans-serif'; g.fillText(a, x, yy - 14); g.fillStyle = '#fff'; g.font = '900 50px sans-serif'; g.fillText(b, x, yy + 36); });
    /* 영웅 얼굴 줄 */
    const hs = (st.squad || []).filter(Boolean).slice(0, 5); const fw = 150, x0 = W2 / 2 - (hs.length * (fw + 16) - 16) / 2;
    hs.forEach((id, i) => { const im = ART['hero_' + id]; const x = x0 + i * (fw + 16), yy = 1130; g.save(); g.beginPath(); g.arc(x + fw / 2, yy + fw / 2, fw / 2, 0, 7); g.closePath(); g.fillStyle = '#2a1150'; g.fill(); g.clip(); if (im) g.drawImage(im, x, yy, fw, fw); g.restore(); g.strokeStyle = gold; g.lineWidth = 5; g.beginPath(); g.arc(x + fw / 2, yy + fw / 2, fw / 2, 0, 7); g.stroke(); });
    g.fillStyle = '#e9dcff'; g.font = '700 34px sans-serif'; g.fillText(T.cta, W2 / 2, 1320);
    return c;
  },
  spr(g, n, an, x, y, h, flip, filt) {   /* 띠 그림 첫 장을 카드에 그림(발 = x, y) */
    const M = VS[n], im = M && (ART[M.f + '_' + an] || (typeof need === 'function' && need(M.f + '_' + an))); if (!im) return;
    const k = h / M.hpx; g.save(); if (filt) g.filter = filt; g.translate(x, y); if (flip) g.scale(-1, 1); g.drawImage(im, 0, 0, M.cw, M.ch, -M.ax * k, -M.ay * k, M.cw * k, M.ch * k); g.restore();
  },
  scene(g, x0, y0, w, h) {   /* 깔끔한 군단 단체 사진: 지역 배경 · 뒤에 망자 거인 · 왼쪽 지배자 · 가운데 소환수 · 앞줄 영웅 (11-16 처음엔 전장 화면을 그대로 잘랐더니 말풍선 · 숫자로 어지러웠음) */
    g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
    const rb = REGION_BG[regionOf(st.best || st.stage)], bg = (rb && ART['bg_' + rb]) || ART.bg;
    if (bg) { const k = Math.max(w / bg.width, h / bg.height) * 1.15; g.drawImage(bg, x0 + (w - bg.width * k) / 2, y0 + h - bg.height * k * 0.82, bg.width * k, bg.height * k); }
    g.fillStyle = 'rgba(10,3,24,.35)'; g.fillRect(x0, y0, w, h);
    const gy = y0 + h - 40;
    if ((st.thralls || 0) > 0) { g.save(); g.globalAlpha = 0.95; this.spr(g, 'foev4', 'idle', x0 + w * 0.74, gy - 20, 420, true, 'hue-rotate(235deg) saturate(1.25) brightness(0.82) drop-shadow(0 0 14px rgba(185,95,255,.95))'); g.restore(); }
    const lord = ART.lordA || (typeof need === 'function' && need('lordA')); if (lord) { const lh = 470, lw = lh * lord.width / lord.height; g.drawImage(lord, x0 + w * 0.17 - lw / 2, gy - lh + 10, lw, lh); }
    [['sumv3', 0.40], ['sumv1', 0.53], ['sumv2', 0.64], ['sumv4', 0.33]].forEach(([n, fx], i) => this.spr(g, n, 'idle', x0 + w * fx, gy - 70 - (i === 3 ? 30 : 0), 170));
    const hs = (st.squad || []).filter(Boolean).slice(0, 4); hs.forEach((id, i) => this.spr(g, 'heroI_' + id, 'idle', x0 + w * (0.36 + i * 0.16), gy + 10, 230));
    const fade = g.createLinearGradient(0, y0 + h - 120, 0, y0 + h); fade.addColorStop(0, 'rgba(7,1,15,0)'); fade.addColorStop(1, 'rgba(7,1,15,1)'); g.fillStyle = fade; g.fillRect(x0, y0 + h - 120, w, 120);
    g.restore();
  },
  /* 11-16 #11 「해골로 일어나는 순간 짧은 영상 저장」: 망자 거인이 일어나는 5.5초를 전장 캔버스 그대로(소리 포함) 녹화 → 자랑 창에서 영상으로 보냄 */
  clipStart() {   /* webm 먼저(11-16 시험: 크롬 mp4 녹화는 ffmpeg로 풀면 장면이 깨져 멈춤 · webm은 깨짐 0) — 아이폰 사파리는 webm 녹화가 없어 mp4로 */
    if (this.rec || typeof MediaRecorder === 'undefined' || !cv.captureStream || AUTO || TRAILER) return;
    try {
      const vs = cv.captureStream(30); let stream = vs, dest = null;
      if (Snd.ac && Snd.master) { dest = Snd.ac.createMediaStreamDestination(); Snd.master.connect(dest); stream = new MediaStream([...vs.getVideoTracks(), ...dest.stream.getAudioTracks()]); }
      const type = (window.__clipTypes || ['video/webm;codecs=vp9', 'video/webm', 'video/mp4']).find(t => MediaRecorder.isTypeSupported(t)) || '';
      const r = new MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: 3e6 } : {}), ch = [];
      r.ondataavailable = e => { if (e.data && e.data.size) ch.push(e.data); };
      r.onstop = () => { this.clip = new Blob(ch, { type: (r.mimeType || type || 'video/webm').split(';')[0] }); this.rec = null; if (dest) try { Snd.master.disconnect(dest); } catch (e) { } vs.getTracks().forEach(t => t.stop()); st.seen.clip = (st.seen.clip || 0) + 1; };
      r.start(250); this.rec = r; setTimeout(() => { if (r.state !== 'inactive') r.stop(); }, 5500);
    } catch (e) { this.rec = null; }
  },
  async sendClip() {
    const c = this.clip; if (!c) return; const ext = /mp4/.test(c.type) ? 'mp4' : 'webm', file = new File([c], 'giant_rise.' + ext, { type: c.type }), txt = this.text();
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: txt, title: L.brag.title }); st.seen.clipSent = (st.seen.clipSent || 0) + 1; return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(c); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
      try { await navigator.clipboard.writeText(txt); } catch (e) { }
      UI.toast(L.brag.title, L.brag.saved); st.seen.clipSent = (st.seen.clipSent || 0) + 1;
    } catch (e) { if (e && e.name !== 'AbortError') UI.toast(L.brag.title, L.brag.fail); }
  },
  text() { return L.brag.msg(fmt(JB.dps(st)), typeof SN === 'function' ? SN(st.best || st.stage) : (st.best || st.stage), st.thralls || 0) + ' ' + location.href.split('?')[0]; },
  async open() {
    const ks = ['foev4_idle', 'lordA', 'sumv1_idle', 'sumv2_idle', 'sumv3_idle', 'sumv4_idle', ...(st.squad || []).filter(Boolean).map(id => 'heroI_' + id + '_idle')];
    for (let i = 0; i < 20 && ks.some(k => !(typeof need === 'function' && need(k))); i++) await new Promise(r => setTimeout(r, 100));   /* 그림이 아직 안 불러졌으면 2초까지 기다림(망자 거인이 빠진 카드가 나갔음) */
    let c; try { c = this.shot(); } catch (e) { UI.toast(L.brag.title, L.brag.fail); return; }
    const url = c.toDataURL('image/jpeg', 0.9);
    UI.openModal(`<h3>${L.brag.title}</h3><img src="${url}" style="width:100%;border-radius:14px;margin:6px 0" alt=""><p class="muted" style="margin:4px 0 10px">${L.brag.hint}</p><button class="btn gold" data-x="bragSend" style="width:100%">${L.brag.send}</button>${this.clip ? `<button class="btn" data-x="bragClip" style="width:100%;margin-top:8px">${L.brag.clip}</button>` : ''}`);
    this.c = c; st.seen.brag = (st.seen.brag || 0) + 1;
  },
  async send() {
    const c = this.c; if (!c) return; const txt = this.text();
    try {
      const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.9)), file = new File([blob], 'my_legion.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: txt, title: L.brag.title }); st.seen.bragSent = (st.seen.bragSent || 0) + 1; return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my_legion.jpg'; document.body.appendChild(a); a.click(); a.remove();
      try { await navigator.clipboard.writeText(txt); } catch (e) { }
      UI.toast(L.brag.title, L.brag.saved); st.seen.bragSent = (st.seen.bragSent || 0) + 1;
    } catch (e) { if (e && e.name !== 'AbortError') UI.toast(L.brag.title, L.brag.fail); }
  },
  act(x) { if (x === 'brag') { this.open(); return true; } if (x === 'bragSend') { this.send(); return true; } if (x === 'bragClip') { this.sendClip(); return true; } return false; },
};
