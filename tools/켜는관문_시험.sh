# 관문 ㉓ 시험: ① 맞는 판 통과 ② 새 그림을 공격 그림까지 다 와야 쓰게(예전) → 누른 뒤 기다림으로 막혀야 ③ 첫 화면 기다림 목록에 큰 거인 영상 그림을 넣으면 → 「누르세요」 늦어 막혀야
D=$1; ok=1
rm -rf /tmp/g23a /tmp/g23b; cp -r $D /tmp/g23a; cp -r $D /tmp/g23b
sed -i "s/SVok = SVN \&\& VS\[SVN\] \&\& need(SVN + '_idle');/SVok = SVN \&\& VS[SVN] \&\& need(SVN + '_idle') \&\& need(SVN + '_attack');/; s/if (FVi \&\& VS\[FVi\] \&\& need(FVi + '_idle')) {/if (FVi \&\& VS[FVi] \&\& need(FVi + '_idle') \&\& need(FVi + '_attack')) {/" /tmp/g23a/js/draw.js; [ $(grep -c "_attack')) {\|need(SVN + '_attack');" /tmp/g23a/js/draw.js) -ge 2 ] || { echo "  ✗ 시험 판 ②를 못 만듦"; ok=0; }
sed -i "s/const ESS = \['bg', 'lordA', 'sumv1_idle', 'foev0_idle',/const ESS = ['bg', 'lordA', 'sumv1_idle', 'foev0_idle', 'gv2_idle', 'ld8_cast', 'gv2_raise',/" /tmp/g23b/js/main.js; grep -q "'gv2_idle', 'ld8_cast'" /tmp/g23b/js/main.js || { echo "  ✗ 시험 판 ③을 못 만듦"; ok=0; }
R=$(timeout 300 node 켜는시간.js $D | tail -1); python3 켜는검사.py "$R" >/dev/null && echo "  ✓ 맞는 판 통과" || { echo "  ✗ 맞는 판이 막힘: $(python3 켜는검사.py "$R")"; ok=0; }
R=$(timeout 300 node 켜는시간.js /tmp/g23a | tail -1); M=$(python3 켜는검사.py "$R"); echo "$M" | grep -q "누른 뒤" && echo "  ✓ 공격 그림까지 기다리게 하면 막힘: $M" || { echo "  ✗ 막히지 않음: $M"; ok=0; }
R=$(timeout 300 node 켜는시간.js /tmp/g23b | tail -1); M=$(python3 켜는검사.py "$R"); echo "$M" | grep -q "누르세요" && echo "  ✓ 큰 그림을 첫 화면에 기다리면 막힘: $M" || { echo "  ✗ 막히지 않음: $M"; ok=0; }
[ $ok = 1 ]
