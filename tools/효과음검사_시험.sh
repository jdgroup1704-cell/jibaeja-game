#!/bin/bash
# 효과음 관문 ⑱ 시험: 지배자 한 발 소리를 옛날(0.12)로 되돌린 사본은 막혀야 하고, 그대로인 것은 통과
G=${1:-/home/claude/v85}; T=/tmp/효과음시험; rm -rf $T; cp -r $G $T
sed -i "s/Snd.smp('soul', 0.38, 0, rnd(1.5, 1.8));/Snd.smp('soul', 0.12, 0, rnd(1.5, 1.8));/" $T/js/field.js
grep -q "smp('soul', 0.12" $T/js/field.js || { echo "❌ 사본 망가뜨리기 실패"; exit 1; }
cd $G/tools; r=0
B=$(timeout 150 node 효과음재기.js $T 2>/dev/null | grep "^{" | tail -1); python3 효과음검사.py "$B" >/tmp/효1.txt; [ $? -eq 1 ] && grep -q "soul .*안 들림" /tmp/효1.txt && echo "막힘 ✅ 지배자 한 발 소리 묻힘" || { echo "❌ 묻힌 소리가 안 막힘"; cat /tmp/효1.txt; r=1; }
A=$(timeout 150 node 효과음재기.js $G 2>/dev/null | grep "^{" | tail -1); python3 효과음검사.py "$A" && echo "통과 ✅ 그대로인 것(대조군)" || { echo "❌ 대조군이 막힘"; r=1; }
exit $r
