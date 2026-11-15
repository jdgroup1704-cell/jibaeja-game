# 관문 ㉑ 시험: ① 맞는 판 통과 ② 보스 잡아도 거인 안 일어나게(연출 연결 끊음) → 막혀야 ③ 자랑 단추 빼면 → 막혀야 ④ 일어나는 영상을 크롬 mp4로(풀면 깨짐) → 막혀야 ⑤ 보스 격파 받은 것 띠 · 날아가는 아이콘 빼면 → 막혀야
D=$1; ok=1
rm -rf /tmp/g21a /tmp/g21b; cp -r $D /tmp/g21a; cp -r $D /tmp/g21b
sed -i "s/setTimeout(() => TH.start(gx, gy), 900)/0/" /tmp/g21a/js/director.js
sed -i 's/data-x="brag"/data-x="brag0"/' /tmp/g21b/js/extra.js
R=$(timeout 150 node 거인재기.js $D | tail -1); python3 거인검사.py "$R" >/dev/null && echo "  ✓ 맞는 판 통과" || { echo "  ✗ 맞는 판이 막힘"; ok=0; }
R=$(timeout 150 node 거인재기.js /tmp/g21a | tail -1); python3 거인검사.py "$R" | grep -q "일어남까지" && echo "  ✓ 거인 연출 끊으면 막힘(일어남)" || { echo "  ✗ 거인 끊어도 통과"; ok=0; }
R=$(timeout 150 node 거인재기.js /tmp/g21b | tail -1); python3 거인검사.py "$R" | tee /tmp/g21b.txt | grep -q "자랑 단추" && echo "  ✓ 자랑 단추 빼면 막힘: $(head -1 /tmp/g21b.txt)" || { echo "  ✗ 자랑 단추 빼도 통과"; ok=0; }
R=$(CLIPT=video/mp4 timeout 150 node 거인재기.js $D | tail -1); python3 거인검사.py "$R" | grep -q "깨짐" && echo "  ✓ 깨지는 mp4 녹화면 막힘" || { echo "  ✗ 깨지는 mp4도 통과"; ok=0; }
rm -rf /tmp/g21c; cp -r $D /tmp/g21c; sed -i 's/    if (!de) return; this.n++;/    return;/' /tmp/g21c/js/reward.js
R=$(timeout 170 node 거인재기.js /tmp/g21c | tail -1); python3 거인검사.py "$R" | grep -q "받은 것 띠" && echo "  ✓ 보스 격파 띠 빼면 막힘" || { echo "  ✗ 보스 격파 띠 빼도 통과"; ok=0; }
[ $ok = 1 ]
