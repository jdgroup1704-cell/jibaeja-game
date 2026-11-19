/* 서버(파이어베이스 mangja-lord-jd): 익명 로그인 · 순위표 · 행사 공지.
   서버가 안 되면(인터넷 없음 · 막힘) 조용히 꺼지고 게임은 그대로 돌아간다. */
const FB_CFG = { apiKey: 'AIzaSyC8Ubib9IsrUIYpZQoayVlUjxfkrVNk66s', authDomain: 'mangja-lord-jd.firebaseapp.com', projectId: 'mangja-lord-jd', storageBucket: 'mangja-lord-jd.firebasestorage.app', messagingSenderId: '990901899140', appId: '1:990901899140:web:95d134ae4d53988ecd17d1' };
const FB_BASE = 'https://www.gstatic.com/firebasejs/13.3.0/', RK_S = 's1';
let fb = null, fbUser = null, fbState = 'off', EVT = null, rkLastPush = 0, rkLastKey = '';
const RK = { tab: 0, data: [null, null], at: [0, 0], mine: [0, 0], busy: false, err: '', msg: '', msgT: -9 };
const fbOK = () => { try { return !BOT && !Q.has('nofb') && location.protocol === 'https:'; } catch (e) { return false; } };
const NICK_BAD = /운영|관리자|개발자|대표|gm|admin|staff|씨발|시발|병신|좆|존나|fuck|shit/i;
const myNick = () => { const n = ('' + (META.nick || '')).trim(); return n && !NICK_BAD.test(n) ? n.slice(0, 8) : '군주' + (fbUser ? fbUser.uid.replace(/[^0-9a-zA-Z]/g, '').slice(0, 4) : ''); };

async function fbInit() {
  if (!fbOK() || fb || fbState === 'loading') return; fbState = 'loading';
  try {
    const [A, U, S] = await Promise.all([import(FB_BASE + 'firebase-app.js'), import(FB_BASE + 'firebase-auth.js'), import(FB_BASE + 'firebase-firestore-lite.js')]);
    const app = A.initializeApp(FB_CFG), auth = U.getAuth(app), db = S.getFirestore(app); fb = { A, U, S, app, auth, db };
    U.onAuthStateChanged(auth, u => { fbUser = u; if (!u) { U.signInAnonymously(auth).catch(e => { fbState = 'err'; RK.err = e.code || 'login'; }); return; } fbState = 'on'; rkPush(true); evtLoad(); });
  } catch (e) { fbState = 'err'; RK.err = 'load'; fb = null; }
}

/* 내 기록 올리기: 최고 단계 · 무덤 토벌 최고 · 쓰러뜨린 적 수. 1분에 한 번만(바뀐 게 있을 때) */
async function rkPush(force) {
  if (!fb || !fbUser) return; const best = Math.max(0, Math.min(5000, META.bestStage | 0)); if (best < 1) return;
  const d = { name: myNick(), best, power: Math.max(0, META.dgBest | 0), kills: Math.max(0, META.kt | 0), ts: Date.now() }, key = d.name + '|' + d.best + '|' + d.power;
  if (!force && (key === rkLastKey || Date.now() - rkLastPush < 60000)) return; rkLastPush = Date.now(); rkLastKey = key;
  try { const { S, db } = fb; await S.setDoc(S.doc(db, 'rank', RK_S, 'list', fbUser.uid), d); RK.at = [0, 0]; } catch (e) { RK.err = e.code || 'write'; }
}

/* 순위 불러오기: 위 50명 + 내 등수(나보다 높은 사람 수 + 1) */
async function rkLoad(tab) {
  if (!fb || !fbUser || RK.busy) return; if (RK.data[tab] && Date.now() - RK.at[tab] < 30000) return; RK.busy = true; RK.err = '';
  try {
    const { S, db } = fb, col = S.collection(db, 'rank', RK_S, 'list'), f = tab ? 'power' : 'best';
    const q = await S.getDocs(S.query(col, S.orderBy(f, 'desc'), S.limit(50))), a = [];
    q.forEach(x => { const v = x.data(); a.push({ me: x.id === fbUser.uid, name: ('' + (v.name || '군주')).slice(0, 8), best: v.best | 0, power: v.power | 0 }); });
    RK.data[tab] = a; RK.at[tab] = Date.now();
    const mine = tab ? (META.dgBest | 0) : (META.bestStage | 0);
    if (mine > 0) { try { const c = await S.getCount(S.query(col, S.where(f, '>', mine))); RK.mine[tab] = c.data().count + 1; } catch (e) { RK.mine[tab] = 0; } }
  } catch (e) { RK.err = e.code || 'read'; }
  RK.busy = false;
}

/* 행사 공지: config/event 문서 하나(콘솔에서 고침). { on, title, until(ms), gem(결정 배수) } */
async function evtLoad() {
  if (!fb) return; try { const { S, db } = fb, g = await S.getDoc(S.doc(db, 'config', 'event')); const d = g.exists() ? g.data() : null; EVT = d && d.on && (+d.until || 0) > Date.now() ? { title: ('' + (d.title || '행사')).slice(0, 24), until: +d.until, gem: Math.max(1, Math.min(3, +d.gem || 1)) } : null; } catch (e) { EVT = null; }
}
const evtGem = () => EVT && EVT.until > Date.now() ? EVT.gem : 1;

function nickEdit() {
  let n = null; try { n = window.prompt('군주 이름(2~8글자)', myNick()); } catch (e) { return; } if (n == null) return; n = ('' + n).replace(/\s+/g, ' ').trim().slice(0, 8);
  if (n.length < 2) { RK.msg = '2글자 이상 적어 주세요'; RK.msgT = T; return; } if (NICK_BAD.test(n)) { RK.msg = '쓸 수 없는 이름이에요'; RK.msgT = T; return; }
  META.nick = n; saveMeta(); RK.msg = '이름을 바꿨어요'; RK.msgT = T; RK.data = [null, null]; rkPush(true);
}

function drawRank() {
  drawBg(); ctx.fillStyle = 'rgba(6,2,14,.5)'; ctx.fillRect(0, 0, W, H);
  if (Q.has('fakerk') && !RK.data[0]) { const N = ['해골왕', '망령누나', '뼈다귀', '밤의군주', '무덤지기', '검은달', '리치', '유령', '어둠', '군단장']; RK.data = [N.map((n, i) => ({ name: n, best: 120 - i * 9, power: 30 - i * 2 })), N.map((n, i) => ({ name: n, best: 120 - i * 9, power: 30 - i * 2 }))]; RK.data[0][6].me = RK.data[1][6].me = true; RK.data[0][6].name = RK.data[1][6].name = myNick(); RK.mine = [7, 7]; fbState = 'on'; }
  if (fbState === 'off') fbInit(); else if (fbState === 'on' && !Q.has('fakerk')) rkLoad(RK.tab);
  const cw = Math.min(W - 24, 420), x = (W - cw) / 2; txt('순위', W / 2, 50, 30, '#ffe08a');
  ['최고 단계', '무덤 토벌'].forEach((l, i) => { const bw = (cw - 10) / 2, bx = x + i * (bw + 10), on = RK.tab === i; ctx.fillStyle = on ? 'rgba(140,92,255,.95)' : 'rgba(30,18,52,.9)'; rr(bx, 80, bw, 40, 12); ctx.fill(); ctx.strokeStyle = on ? '#e9dcff' : 'rgba(201,162,255,.35)'; ctx.lineWidth = 1.5; ctx.stroke(); txt(l, bx + bw / 2, 101, 16, on ? '#fff' : '#b9a8d8', { w: 800 }); BTNS.push({ x: bx, y: 80, w: bw, h: 40, fn: () => { RK.tab = i; } }); });
  const top = 132, foot = 150, rh = 38, L = RK.data[RK.tab], n = Math.max(1, Math.floor((H - top - foot) / rh));
  ctx.fillStyle = 'rgba(20,10,36,.88)'; rr(x, top, cw, n * rh + 8, 14); ctx.fill();
  if (fbState !== 'on' || !L) { const m = fbState === 'err' ? '서버에 연결하지 못했어요' : fbState === 'off' && !fbOK() ? '시험 화면에서는 순위가 꺼져 있어요' : '불러오는 중…'; txt(m, W / 2, top + 60, 16, '#b9a8d8', { w: 700 }); if (fbState === 'err') txt('인터넷을 확인하고 다시 열어 주세요', W / 2, top + 88, 13, '#8a7aa8', { w: 600 }); }
  else if (!L.length) txt('아직 기록이 없어요. 첫 주인공이 되어 보세요!', W / 2, top + 60, 15, '#b9a8d8', { w: 700, box: cw - 20 });
  else L.slice(0, n).forEach((r, i) => { const y = top + 4 + i * rh, c = i === 0 ? '#ffd23a' : i === 1 ? '#dfe6ff' : i === 2 ? '#ffb070' : '#b9a8d8';
    if (r.me) { ctx.fillStyle = 'rgba(95,255,200,.16)'; rr(x + 4, y, cw - 8, rh - 2, 10); ctx.fill(); }
    txt(i + 1 + '', x + 30, y + rh / 2, i < 3 ? 19 : 15, c, { w: 900 }); txt(r.name, x + 60, y + rh / 2, 15, r.me ? '#8affd0' : '#fff', { w: 800, align: 'left', box: cw - 170 });
    txt(RK.tab ? `토벌 ${r.power}` : `${r.best}단계`, x + cw - 16, y + rh / 2, 15, '#ffe08a', { w: 800, align: 'right' }); });
  const my = RK.tab ? (META.dgBest | 0) : (META.bestStage | 0), fy = H - foot + 16;
  ctx.fillStyle = 'rgba(30,18,52,.95)'; rr(x, fy, cw, 50, 14); ctx.fill(); ctx.strokeStyle = '#5fffc8'; ctx.lineWidth = 1.5; ctx.stroke();
  txt(RK.mine[RK.tab] ? `내 순위 ${RK.mine[RK.tab]}위` : '내 순위 —', x + 16, fy + 25, 15, '#8affd0', { w: 800, align: 'left' }); txt(myNick(), W / 2, fy + 25, 15, '#fff', { w: 800, box: cw * 0.36 }); txt(RK.tab ? `토벌 ${my}` : `${my}단계`, x + cw - 16, fy + 25, 15, '#ffe08a', { w: 800, align: 'right' });
  if (T - RK.msgT < 2.5) txt(RK.msg, W / 2, fy - 14, 14, '#ffe14d', { w: 700 });
  const by = H - 74, bw = (cw - 10) / 2; button(x, by, bw, 50, '이름 바꾸기', () => nickEdit(), { size: 17, off: fbState !== 'on' }); button(x + bw + 10, by, bw, 50, '돌아가기', () => { MODE = 'title'; }, { size: 17 });
}
