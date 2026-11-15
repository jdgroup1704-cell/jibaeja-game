#!/bin/bash
# 진형 관문 ⑲ 시험: 고치기 전 코드(tools/시험자료/진형전)는 막혀야 하고, 지금 것은 통과
G=${1:-/home/claude/v85}; OLD=/tmp/진형시험_옛; rm -rf $OLD; cp -r $G $OLD; cp -r $G/tools/시험자료/진형전/. $OLD/   # 옛 코드(순서 #9 전, 시험자료에 얼려 둠)를 지금 그림 위에 덮음
cd $G/tools; r=0
B=$(timeout 120 node 진형재기.js $OLD 2>/dev/null | tail -1); python3 진형검사.py "$B" >/tmp/진1.txt; [ $? -eq 1 ] && grep -q "병과 바뀜" /tmp/진1.txt && echo "막힘 ✅ 옛 진형: $(cut -c1-160 /tmp/진1.txt)" || { echo "❌ 옛 진형이 안 막힘"; cat /tmp/진1.txt; r=1; }
A=$(timeout 120 node 진형재기.js $G 2>/dev/null | tail -1); python3 진형검사.py "$A" && echo "통과 ✅ 지금 진형(대조군)" || { echo "❌ 대조군이 막힘"; r=1; }
exit $r
