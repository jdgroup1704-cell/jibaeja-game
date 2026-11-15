# 관문 ㉒ 시험: ① 맞는 판 통과 ② 눌러도 반격이 안 되게(hit 비움) → 막혀야 ③ 약점을 아예 안 띄우고 예전처럼 바로 기술 → 막혀야
D=$1; ok=1
rm -rf /tmp/g22a /tmp/g22b; cp -r $D /tmp/g22a; cp -r $D /tmp/g22b
sed -i 's/    if (!this.c || !st.boss) return; this.end();/    if (!this.c || !st.boss) return; this.end(); return;/' /tmp/g22a/js/bosscharge.js; grep -q "this.end(); return;" /tmp/g22a/js/bosscharge.js || { echo "  ✗ 시험 판 ②를 못 만듦"; ok=0; }
sed -i "s/if (typeof BC !== 'undefined' \&\& BC.start())/if (false)/" /tmp/g22b/js/field.js; grep -q "if (false)" /tmp/g22b/js/field.js || { echo "  ✗ 시험 판 ③을 못 만듦"; ok=0; }
R=$(timeout 150 node 약점재기.js $D 시험 | tail -1); python3 약점검사.py "$R" >/dev/null && echo "  ✓ 맞는 판 통과" || { echo "  ✗ 맞는 판이 막힘: $R"; ok=0; }
R=$(timeout 150 node 약점재기.js /tmp/g22a 시험a | tail -1); M=$(python3 약점검사.py "$R"); echo "$M" | grep -q "체력" && echo "  ✓ 반격 비우면 막힘: $(echo "$M" | head -1)" || { echo "  ✗ 반격 비워도 통과"; ok=0; }
R=$(timeout 150 node 약점재기.js /tmp/g22b 시험b | tail -1); M=$(python3 약점검사.py "$R"); echo "$M" | grep -q "약점 0번" && echo "  ✓ 약점 안 띄우면 막힘: $(echo "$M" | head -1)" || { echo "  ✗ 약점 안 띄워도 통과: $M"; ok=0; }
[ $ok = 1 ]
