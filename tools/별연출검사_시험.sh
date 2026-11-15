#!/bin/bash
# 별 연출 관문 ⑰ 시험: ★3 불꽃을 지운 사본은 막혀야 하고, 그대로인 것은 통과
G=${1:-/home/claude/v85}; T=/tmp/별시험; rm -rf $T; cp -r $G $T
sed -i "s|\${big ? '<div class=\"sx-fire\"></div><div class=\"sx-ring\"></div>' +|\${big ? '' +|" $T/js/ui.js
grep -q "big ? '' +" $T/js/ui.js || { echo "❌ 사본 망가뜨리기 실패"; exit 1; }
cd $G/tools; r=0
B=$(timeout 150 node 별연출재기.js $T 2>/dev/null | tail -1); python3 별연출검사.py "$B" >/tmp/별1.txt; [ $? -eq 1 ] && grep -q "★3 불꽃 False" /tmp/별1.txt && echo "막힘 ✅ ★3 불꽃 없음" || { echo "❌ 불꽃 없는 ★3이 안 막힘"; cat /tmp/별1.txt; r=1; }
A=$(timeout 150 node 별연출재기.js $G 2>/dev/null | tail -1); python3 별연출검사.py "$A" && echo "통과 ✅ 그대로인 것(대조군)" || { echo "❌ 대조군이 막힘"; r=1; }
exit $r
