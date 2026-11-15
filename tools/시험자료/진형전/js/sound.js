'use strict';
// 소리: 대마법 장면(scene)에서 그대로 가져옴. 일레븐랩스 소리 파일(sfx/) + 없으면 코드 합성
// ───────────── 소리 (코드로 합성) ─────────────
// 아이폰 무음 스위치가 켜져 있어도 소리가 나게: 소리 종류를 '재생'으로 + 조용한 소리 한 번 틀기
let unlocked = false;
function unlockAudio() {
  if (unlocked) return; unlocked = true;
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  try {
    const sr = 8000, n = 800, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
    const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    const a = new Audio(URL.createObjectURL(new Blob([b], { type: 'audio/wav' }))); a.setAttribute('playsinline', ''); a.play().catch(() => {});
  } catch (e) {}
}
// 시험용: 소리 기록(봇 영상에 소리를 입히려고)
function limiter(ac) { const c = ac.createDynamicsCompressor(); c.threshold.value = -6; c.knee.value = 4; c.ratio.value = 20; c.attack.value = 0.002; c.release.value = 0.12; c.connect(ac.destination); return c; }
const BGM_V = 0.3;   /* 11-15 순서 #5: 배경음 크기(효과음보다 한 발 뒤 — 강화 「띵」이 묻히지 않게) */
const SND_LOG = []; let sndT0 = 0;
const Snd = {
  ac: null, master: null, on: true, drone: null,
  init() {
    unlockAudio();
    if (this.ac) { if (this.ac.state !== 'running' && this.ac.resume) this.ac.resume().catch(() => {}); return; }
    try {
      this.ac = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ac.state !== 'running' && this.ac.resume) this.ac.resume().catch(() => {});
      this.master = this.ac.createGain(); this.master.gain.value = 0.8; this.master.connect(limiter(this.ac));   /* 11-16 순서 #8 효과음재기: 큰 소리 여럿이 겹치면 깨짐(45초에 46표본) → 마지막에 누르개(리미터) */
      const len = this.ac.sampleRate * 2, b = this.ac.createBuffer(1, len, this.ac.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = b;
    } catch (e) { this.ac = null; }
  },
  get t() { return this.ac ? (this.tOff ?? this.ac.currentTime) : 0; },
  env(g, t0, a, peak, dcy) { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + dcy); },
  osc(type, f0, f1, dur, vol, delay = 0) {
    if (!this.ac || !this.on) return;
    const t0 = this.t + delay, o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    this.env(g, t0, 0.005, vol, dur); o.connect(g); g.connect(this.master); o.start(t0); o.stop(t0 + dur + 0.05);
  },
  noise(dur, vol, type = 'lowpass', f0 = 1000, f1 = 0, delay = 0, q = 1) {
    if (!this.ac || !this.on) return;
    const t0 = this.t + delay, s = this.ac.createBufferSource(), f = this.ac.createBiquadFilter(), g = this.ac.createGain();
    s.buffer = this.noiseBuf; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t0);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    this.env(g, t0, 0.01, vol, dur); s.connect(f); f.connect(g); g.connect(this.master); s.start(t0); s.stop(t0 + dur + 0.1);
  },
  startDrone() {
    if (!this.ac || this.drone) return;
    const g = this.ac.createGain(), f = this.ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
    g.gain.setValueAtTime(0.0001, this.t); g.gain.exponentialRampToValueAtTime(0.06, this.t + 2);
    const os = [55, 55.6, 82.4].map(fr => { const o = this.ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(this.t); return o; });
    f.connect(g); g.connect(this.master); this.drone = { g, os };
  },
  droneTo(v, dur) { if (this.drone) { const g = this.drone.g.gain; g.cancelScheduledValues(this.t); g.setValueAtTime(Math.max(0.0001, g.value), this.t); g.exponentialRampToValueAtTime(Math.max(0.0001, v), this.t + dur); } },
  stopDrone() { if (this.drone) { this.droneTo(0.0001, 0.3); const d = this.drone; setTimeout(() => d.os.forEach(o => { try { o.stop(); } catch (e) {} }), 500); this.drone = null; } },
  drum() { this.osc('sine', 90, 38, 0.28, 0.32); this.noise(0.06, 0.08, 'lowpass', 800); },
  tick() { this.noise(0.05, 0.05, 'highpass', 3000); this.osc('square', 900, 400, 0.04, 0.02); },
  rumble(d) { this.noise(d, 0.35, 'lowpass', 140, 60); },
  slam() { this.osc('sine', 70, 25, 0.9, 0.9); this.noise(0.8, 0.6, 'lowpass', 900, 80); },
  heart() { this.osc('sine', 55, 35, 0.18, 0.5); this.osc('sine', 52, 33, 0.18, 0.4, 0.22); },
  chime(f) { this.osc('sine', f, 0, 1.8, 0.22); this.osc('sine', f * 2.01, 0, 1.2, 0.07); this.osc('triangle', f * 1.5, 0, 0.9, 0.05); },
  stamp() { this.osc('sine', 60, 30, 1.4, 0.95); this.osc('sawtooth', 110, 55, 0.5, 0.18); this.noise(0.5, 0.5, 'lowpass', 1500, 100); },
  suck() { this.noise(1.0, 0.25, 'bandpass', 200, 4000, 0, 3); },
  boom() { this.osc('sine', 48, 18, 2.6, 1.0); this.noise(2.4, 0.9, 'lowpass', 4000, 60); this.noise(0.4, 0.5, 'highpass', 2000); },
  cheer() { for (let i = 0; i < 6; i++) this.noise(0.5, 0.06, 'bandpass', rnd(500, 1200), 0, i * 0.12, 2); },
};

// 일레븐랩스로 만든 소리 파일(sfx/*.mp3). 없으면(파일로 바로 열었을 때 등) 코드 합성 소리로 대신함
Object.assign(Snd, {
  bufs: {}, bgm: null, bgmV: 0.5, loading: null,
  loadAll() {
    if (!this.ac) return Promise.resolve(); if (this.loading) return this.loading;
    const names = ['bgm1', 'bgm2', 'up', 'march', 'slam', 'boom', 'hit', 'stare', 'circle', 'stamp', 'charge', 'cheer', 'rise', 'soul', 'summon', 'click', 'vj_chant1', 'vj_chant2', 'vj_chant3', 'v_rise', 'win', 'ssr', 'v_awaken', 'v_boss', 'v_serafine', 'v_morde'];   /* 04:30 드리미나 AI 오디오: 지배자 「일어나라, 나의 군단이여!」 · 승리 짧은 팡파르 */
    this.loading = Promise.all(names.map(async n => { try { const r = await fetch('sfx/' + n + '.mp3'); if (!r.ok) return; const ab = await r.arrayBuffer(); this.bufs[n] = await new Promise((res, rej) => this.ac.decodeAudioData(ab, res, rej)); } catch (e) {} }));
    return this.loading;
  },
  smp(n, vol = 1, delay = 0, rate = 1) {
    if (!this.ac || !this.on || !this.bufs[n]) return;
    const t0 = this.t + delay, s = this.ac.createBufferSource(), g = this.ac.createGain();
    s.buffer = this.bufs[n]; s.playbackRate.value = rate; g.gain.value = vol; s.connect(g); g.connect(this.master); s.start(t0);
  },
  bgmStart(vol) {   /* 11-15 순서 #5: 배경음 두 곡(드리미나 SeedAudio, -16 LUFS로 맞춤)을 30초마다 1.2초 겹쳐 번갈아 틈. 옛 march(-26.5 LUFS)는 너무 작아 거의 안 들렸음 */
    if (!this.ac || this.bgm) return;
    const list = ['bgm1', 'bgm2'].filter(n => this.bufs[n]);
    if (!list.length) { if (!this.bufs.march) return; const s = this.ac.createBufferSource(), g = this.ac.createGain(); s.buffer = this.bufs.march; s.loop = true; g.gain.setValueAtTime(0.0001, this.t); g.gain.exponentialRampToValueAtTime(vol, this.t + 1); s.connect(g); g.connect(this.master); s.start(this.t); this.bgm = { s, g }; this.bgmV = vol; return; }
    const g = this.ac.createGain(); g.gain.setValueAtTime(0.0001, this.t); g.gain.exponentialRampToValueAtTime(vol, this.t + 1); g.connect(this.master);
    this.bgm = { g, list, i: 0, srcs: [] }; this.bgmV = vol; this.bgmNext(this.bgm, this.t);
  },
  bgmNext(b, at) {
    if (this.bgm !== b || !this.ac) return;
    const n = b.list[b.i % b.list.length]; b.i++; b.n = n;
    const s = this.ac.createBufferSource(), sg = this.ac.createGain(), D = this.bufs[n].duration, X = 1.2, t0 = Math.max(this.t, at);
    s.buffer = this.bufs[n]; s.connect(sg); sg.connect(b.g);
    sg.gain.setValueAtTime(b.i === 1 ? 1 : 0.0001, t0); if (b.i > 1) sg.gain.exponentialRampToValueAtTime(1, t0 + X);
    sg.gain.setValueAtTime(1, t0 + D - X); sg.gain.exponentialRampToValueAtTime(0.0001, t0 + D);
    s.start(t0); s.stop(t0 + D + 0.05); b.srcs = b.srcs.filter(x => x.end > this.t).concat([{ s, end: t0 + D }]); b.next = t0 + D - X;
    if (this.replaying) { if (b.next < (this.renderEnd || 0)) this.bgmNext(b, b.next); return; }   /* 시험 녹음(__renderSound): 시간 재기 없이 곡을 바로 이어 붙임 */
    if (!this.replaying) { clearTimeout(b.tm); b.tm = setTimeout(() => this.bgmNext(b, b.next), Math.max(0, (b.next - this.t - 3) * 1000)); }
  },
  bgmDuck() { const b = this.bgm; if (!b || !this.ac || this.bgmV < 0.05) return; const g = b.g.gain, t = this.t; g.cancelScheduledValues(t); g.setValueAtTime(this.bgmV * 0.5, t + 0.01); g.setTargetAtTime(this.bgmV, t + 0.18, 0.12); },
  bgmTick() { const b = this.bgm; if (b && b.list && this.ac && this.ac.state === 'running' && this.t > b.next - 0.5) this.bgmNext(b, b.next); },   /* 뒤 탭에서 시간 재기(setTimeout)가 늦어져도 다음 곡을 이어 붙임 */
  bgmTo(v, dur) { if (!this.bgm) return; const g = this.bgm.g.gain; g.cancelScheduledValues(this.t); g.setValueAtTime(Math.max(0.0001, this.bgmV), this.t); g.exponentialRampToValueAtTime(Math.max(0.0001, v), this.t + dur); this.bgmV = v; },
  bgmStop() { const b = this.bgm; if (!b) return; this.bgmTo(0.0001, 0.3); clearTimeout(b.tm); if (b.s) b.s.stop(this.t + 0.4); if (b.srcs) b.srcs.forEach(x => { try { x.s.stop(this.t + 0.4); } catch (e) {} }); this.bgm = null; },
  upTap(v = 1) {   /* 11-15 순서 #5: 강화 누를 때 맑은 「띵」 + 이어 누르면 음이 계단처럼 올라감(1초 안에 다시 누르면 다음 음, 13계단) */
    const now = performance.now() / 1000, STEP = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21];
    this.upN = now - (this.upT ?? -9) < 1.0 ? Math.min((this.upN || 0) + 1, STEP.length - 1) : 0; this.upT = now;
    const r = Math.pow(2, STEP[this.upN] / 12); this.upRate = r;
    if (this.bufs.up) this.smp('up', 0.9 * v, 0, r); else SYN.chime.call(this, 880 * r);
    this.bgmDuck();   /* 띵 하는 순간 배경음을 0.25초만 살짝 낮춤(게임들이 효과음 들리게 쓰는 방법) */
    this.smp('click', 0.22 * v, 0, 1.25);
  },
});
const SYN = { drum: Snd.drum, tick: Snd.tick, slam: Snd.slam, heart: Snd.heart, stamp: Snd.stamp, suck: Snd.suck, boom: Snd.boom, cheer: Snd.cheer, chime: Snd.chime, droneTo: Snd.droneTo };
Object.assign(Snd, {
  drum() { if (!this.bgm) SYN.drum.call(this); },
  tick() { this.bufs.hit ? this.smp('hit', 0.3, 0, rnd(0.85, 1.15)) : SYN.tick.call(this); },
  slam(v = 1) { this.bufs.slam ? this.smp('slam', v) : SYN.slam.call(this); },
  heart() { if (!this.bufs.stare) SYN.heart.call(this); },
  stareIn() { if (this.bufs.stare) this.smp('stare', 0.9); },
  stamp(v = 1) { this.bufs.stamp ? this.smp('stamp', v) : SYN.stamp.call(this); },   /* v = 크기(11-13 18:30: 점령·이름 순간처럼 자주 나는 곳은 작게) */
  suck() { this.bufs.charge ? this.smp('charge', 0.9) : SYN.suck.call(this); },
  boom() { this.bufs.boom ? this.smp('boom', 1) : SYN.boom.call(this); },
  cheer() { this.bufs.cheer ? this.smp('cheer', 0.8) : SYN.cheer.call(this); },
  chime(f) { SYN.chime.call(this, f); },
  ring(i) { this.bufs.circle ? this.smp('circle', 0.8, 0, [1, 1.12, 1.26][i]) : SYN.chime.call(this, [659, 784, 1047][i]); },
  voice(n) { this.smp(n, 1); },
  voiceCd(n, sec, delay = 0) { const now = performance.now() / 1000; this.vT = this.vT || {}; if (now - (this.vT[n] || -1e9) < sec) return; this.vT[n] = now; this.smp(n, 1, delay); },   /* 04:40 같은 목소리가 자꾸 나오면 질림 → sec초에 한 번 */
  rise() { this.smp('rise', 0.55, 0, rnd(0.9, 1.25)); },   /* 11-16 순서 #8: 망자병이 솟는 소리 -42.9dB(배경음에 묻힘) → -35 */
  droneTo(v, dur) { SYN.droneTo.call(this, v, dur); this.bgmTo(v >= 0.03 ? BGM_V : 0.02, dur); },
});
for (const k of ['osc', 'noise', 'startDrone', 'droneTo', 'stopDrone', 'smp', 'bgmStart', 'bgmTo', 'bgmStop', 'bgmDuck']) {
  const f = Snd[k];
  Snd[k] = function (...a) { if (!this.replaying) SND_LOG.push([performance.now() / 1000 - sndT0, k, a]); return f.apply(this, a); };
}
// 시험용: 기록한 소리를 오프라인으로 다시 만들어 WAV로 돌려줌
window.__renderSound = async (dur) => {
  const sr = 44100, oc = new OfflineAudioContext(2, Math.ceil(sr * dur), sr);
  const keep = { ac: Snd.ac, master: Snd.master, noiseBuf: Snd.noiseBuf, drone: Snd.drone, on: Snd.on, bgm: Snd.bgm, bgmV: Snd.bgmV }; Snd.bgm = null;
  Snd.ac = oc; Snd.master = oc.createGain(); Snd.master.gain.value = 0.8; Snd.master.connect(limiter(oc)); Snd.drone = null; Snd.on = true; Snd.replaying = true; Snd.renderEnd = dur;
  const len = sr * 2, nb = oc.createBuffer(1, len, sr), d = nb.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; Snd.noiseBuf = nb;
  // 오프라인에서는 '지금 시각'이 없으니 기록된 시각을 대신 씀. 드론의 setTimeout은 무시
  for (const [t, k, a] of SND_LOG) { if (t < 0 || t > dur) continue; Snd.tOff = t; if (k === 'stopDrone') { if (Snd.drone) { Snd.droneTo(0.0001, 0.3); Snd.tOff = t; Snd.drone.os.forEach(o => o.stop(t + 0.5)); Snd.drone = null; } } else Snd[k].apply(Snd, a); }
  Snd.tOff = undefined;
  const buf = await oc.startRendering();
  Object.assign(Snd, keep); Snd.replaying = false;
  const n = buf.length, out = new DataView(new ArrayBuffer(44 + n * 4)), L = buf.getChannelData(0), R = buf.getChannelData(1);
  const w = (o, str) => { for (let i = 0; i < str.length; i++) out.setUint8(o + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true);
  out.setUint32(24, sr, true); out.setUint32(28, sr * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) { out.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); out.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
  const u8 = new Uint8Array(out.buffer); let bin = ''; for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(bin);
};
window.__sndLog = () => SND_LOG.map(([t, k]) => [+t.toFixed(2), k]);
window.__sndAll = () => SND_LOG.map(([t, k, a]) => [+t.toFixed(2), k, k === 'smp' ? a[0] : k, k === 'smp' ? (a[1] ?? 1) : null]);   /* 순서 #8 효과음재기 */
window.__sndUp = () => SND_LOG.filter(([, k, a]) => k === 'smp' && a[0] === 'up').map(([t, , a]) => [+t.toFixed(2), +(a[3] || 1).toFixed(3)]);   /* 순서 #5 관문: 강화 「띵」이 이어 누를 때 올라가는지 */
