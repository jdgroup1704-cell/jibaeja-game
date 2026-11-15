#!/bin/bash
# 올리기 전 반드시 통과해야 하는 관문(11-14 23:10 대표님 「확실히 보려면 어떻게 해야 해?」)
# 사용: bash 점검관문.sh 폴더   → 하나라도 실패면 「관문 실패」 + 0 아닌 끝 번호
D=${1:-/home/claude/v85t}; F=0; pkill -f chrome 2>/dev/null
echo "① 안 때리는 병사"; R=$(timeout 60 node 공격재기.js $D 13 2>&1); echo "$R" | head -3 | cut -c1-160; echo "$R" | grep -q "한번도안때림[1-9]" && { echo "  ✗ 안 때리는 병사 있음"; F=1; }; echo "$R" | grep -q "오류 0" || { echo "  ✗ 오류"; F=1; }
pkill -f chrome 2>/dev/null
echo "② 보스 동작"; sleep 2; R=$(timeout 80 node 보스재기.js $D 20 2>&1); echo "$R" | grep -q "오류 0" || { sleep 3; R=$(timeout 80 node 보스재기.js $D 20 2>&1); }; echo "$R" | grep -c "slam" | sed 's/^/  내려찍기 횟수 /'; echo "$R" | grep -q "slam" || { echo "  ✗ 보스가 안 때림"; F=1; }; echo "$R" | grep -q "오류 0" || { echo "  ✗ 오류"; F=1; }
pkill -f chrome 2>/dev/null
echo "③ 잘린 글자 · 화면 밖"; R=$(timeout 90 node 잘림점검.js $D 관문 2>&1); C=$(echo "$R" | grep -v "^[a-z]* goal" | grep -c "잘림:\|밖:"); echo "  잘림 줄 $C"; [ "$C" -gt 0 ] && { echo "$R" | grep "잘림:\|밖:" | head -5; F=1; }; echo "$R" | grep -q "오류 0" || { echo "  ✗ 오류"; F=1; }
pkill -f chrome 2>/dev/null
echo "④ 처음 10분"; R=$(timeout 200 node 첫10분재기.js $D 4 10 2>&1); echo "$R" | tail -2; echo "$R" | grep -q "오류 0" || { echo "  ✗ 오류"; F=1; }; G=$(echo "$R" | grep -o "가장 긴 틈 [0-9]*" | grep -o "[0-9]*$"); [ "${G:-999}" -gt 120 ] && { echo "  ✗ 2분 넘게 새것 없음"; F=1; }
pkill -f chrome 2>/dev/null
echo "⑤ 글자 상자 겹침(대표님 폰 360×593 · 1판부터 실제 흐름 2분 반)"; R=$(timeout 210 node 겹침재기.js $D 0 2>&1); echo "$R" | grep "겹침" | head -5; echo "$R" | grep -q "오류 0" || { echo "  ✗ 오류"; F=1; }; echo "$R" | grep "^겹침" | sed -E 's/.* ([0-9]+)번\(([0-9]+)%\)/\1 \2/' | awk '$1>=10 && $2>=30{f=1} END{exit !f}' && { echo "  ✗ 10번 넘게 30% 넘게 겹치는 짝 있음"; F=1; }
pkill -f chrome 2>/dev/null
echo "⑥ 눈 확인(고친 뒤 찍은 폰 화면을 열어 보고 본 것을 적었나)"; python3 -I 눈확인검사.py $D || F=1
echo "⑦ 장르 대조표(필수 칸이 비면 실패)"; T=../장르대조표.md; if [ ! -f $T ]; then echo "  ✗ 장르대조표.md 없음"; F=1; else N=$(grep "| 필수 |" $T | awk -F"|" '{print $7}' | grep -c "⬜"); echo "  필수 칸 중 없음 $N"; [ "$N" -gt 0 ] && { grep "| 필수 |" $T | awk -F"|" '$7 ~ /⬜/ {print "  ✗"$2}'; F=1; }; fi
[ $F = 0 ] && echo "관문 통과" || { echo "관문 실패"; exit 1; }
