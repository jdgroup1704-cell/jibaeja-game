/* 11-16 순서 #14 「도감 보상 다듬기」(제 제안) — 망자 도감을 표에서 그림 카드로
   그전: 지역 · 병사 · 주인 세 칸 글자 표뿐, 모아도 공격 배수만 조금 올라 모으는 맛이 없었음
   이제: 지역마다 지역 그림 카드 두 장(병사 · 주인) — 내 편이 되면 보랏빛으로 살아나고, 못 모은 칸은 어둡게 + 진행 막대
        모은 칸 수 2 · 4 · 8 · 12 · 16마다 마정석 받기(금빛으로 빛나면 받을 수 있음) · 군단 탭 「망자 도감」 칩에 빨간 점 */
const DEX = {
  html() {
    const d = JB.dexOf(st), R = JB.C.RISE, n = JB.dexCount(st), tot = R.regions * 2, got = st.dexGot || [];
    const ms = JB.C.DEX_REWARD.map(([need, g], i) => { const can = n >= need && !got[i]; return `<button class="dxm ${got[i] ? 'got' : can ? 'can' : ''}" ${can ? `data-x="dexClaim" data-arg="${i}"` : 'disabled'}><b>${need}</b><span>${IC('i_gem')}${g}</span><i>${got[i] ? L.dexr.got : can ? L.dexr.claim : L.dexr.need(need)}</i></button>`; }).join('');
    const card = (i, kind) => {
      const on = kind === 'f' ? d.f[i] : d.l[i], pr = kind === 'f' ? Math.min(1, d.k[i] / R.foe) : Math.min(1, d.lt[i] / R.lordPity);
      const sub = on ? L.rise.done : kind === 'f' ? L.rise.kills(Math.min(d.k[i], R.foe), R.foe) : d.lt[i] ? L.rise.tries(d.lt[i], R.lordPity) : L.rise.locked;
      return `<div class="dxc ${on ? 'on' : ''}" style="background-image:url(art/map_${i}.jpg)"><em>${kind === 'f' ? '☠' : '♛'}</em><b>${kind === 'f' ? L.dexr.foe : L.dexr.lord}</b><small>${sub}</small><u style="--p:${on ? 1 : pr.toFixed(2)}"></u><s>+${Math.round((kind === 'f' ? JB.C.RISE.foeMul : JB.C.RISE.lordMul) * 100)}%</s></div>`;
    };
    const rows = L.regions.map((nm, i) => `<div class="dxr"><h4>${nm}</h4><div class="dxp">${card(i, 'f')}${card(i, 'l')}</div></div>`).join('');
    return `<h3>${L.rise.dex}</h3><div class="dxtop"><b>${n} / ${tot}</b> · ${L.dexr.atk(JB.dexMul ? JB.dexMul(st).toFixed(2) : '')}</div><div class="dxms">${ms}</div><p class="muted small">${L.rise.hint}</p><div class="dxg">${rows}</div>`;
  },
  open() { UI.openModal(this.html()); st.seen.dex = (st.seen.dex || 0) + 1; },
  claim(i) {
    const g = JB.dexClaim(st, +i); if (!g) return;
    Snd.smp && Snd.smp('ssr', 0.6); UI.toast(L.rise.dex, L.dexr.gotT(g)); UI.openModal(this.html()); UI.render && UI.render(true);
  },
  act(x, arg) { if (x === 'dexClaim') { this.claim(arg); return true; } if (x === 'dexOpen') { this.open(); return true; } return false; },
};
