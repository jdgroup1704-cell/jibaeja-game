#!/bin/bash
# 관문 ⑥ 시험: 틀린 경우 셋은 막히고(이유까지 확인), 맞는 경우 하나는 통과해야 함. 관문을 고칠 때마다 다시 돌림
cd "$(dirname "$0")"; G=/tmp/눈시험_게임; N=/tmp/눈시험_메모.md; R=/home/claude/rec/눈; mkdir -p $R; F=0
B=$(mktemp -d); mv $R/눈_*.jpg $B/ 2>/dev/null
rm -rf $G; mkdir -p $G/js; echo x > $G/index.html; echo x > $G/js/a.js; : > $N
python3 -I 눈확인검사.py $G $N | grep -q "사진이 없음" && echo "① 사진 없음 → 막힘 ✓" || { echo "① ✗ 안 막힘"; F=1; }
sleep 1; touch $R/눈_시험.jpg; sleep 1; touch $G/js/a.js
python3 -I 눈확인검사.py $G $N | grep -q "고치기 전에 찍힘" && echo "② 고치기 전 사진 → 막힘 ✓" || { echo "② ✗ 안 막힘"; F=1; }
sleep 1; touch $R/눈_시험.jpg
python3 -I 눈확인검사.py $G $N | grep -q "줄이 없음" && echo "③ 본 것 안 적음 → 막힘 ✓" || { echo "③ ✗ 안 막힘"; F=1; }
echo "- 눈_시험.jpg: 확인함" > $N
python3 -I 눈확인검사.py $G $N | grep -q "너무 짧음" && echo "④ 빈말 「확인함」 → 막힘 ✓" || { echo "④ ✗ 안 막힘"; F=1; }
echo "- 눈_시험.jpg: 첫 화면 글자 잘 보임 · 영웅 탭 모집 단추에 손가락이 정확히 얹힘 · 상점 카드 잘림 없음" > $N
python3 -I 눈확인검사.py $G $N | grep -q "통과" && echo "⑤ 제대로 적음 → 통과 ✓(대조군)" || { echo "⑤ ✗ 맞는데 막힘"; F=1; }
rm -f $R/눈_시험.jpg; mv $B/눈_*.jpg $R/ 2>/dev/null; rmdir $B
[ $F = 0 ] && echo "시험 통과(틀린 넷 막힘 · 맞는 하나 통과)" || { echo "시험 실패"; exit 1; }
