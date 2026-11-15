#!/bin/bash
# 소리 관문 시험: 일부러 망가뜨린 사본 두 개는 막혀야 하고, 그대로인 사본은 통과해야 함
G=${1:-/home/claude/v85}; T=/tmp/소리시험; rm -rf $T; mkdir -p $T
cp -r $G $T/a; rm $T/a/sfx/bgm2.mp3
cp -r $G $T/b; sed -i 's/if (JB.buy(st, arg)) { Snd.upTap();/if (JB.buy(st, arg)) { Snd.smp("click", 0.5);/' $T/b/js/ui.js
cp -r $G $T/c; ffmpeg -loglevel error -y -i $G/sfx/bgm1.mp3 -af volume=-10dB $T/c/sfx/bgm1.mp3
r=0
python3 $G/tools/소리검사.py $T/a >/tmp/s1.txt; [ $? -eq 1 ] && grep -q "bgm2.mp3 없음" /tmp/s1.txt && echo "막힘 ✅ 둘째 곡 없음" || { echo "❌ 둘째 곡 없음이 안 막힘"; r=1; }
python3 $G/tools/소리검사.py $T/b >/tmp/s2.txt; [ $? -eq 1 ] && grep -q "실패 ③ 강화 단추" /tmp/s2.txt && echo "막힘 ✅ 강화 단추 소리 옛것" || { echo "❌ 강화 단추가 안 막힘"; r=1; }
python3 $G/tools/소리검사.py $T/c >/tmp/s3.txt; [ $? -eq 1 ] && grep -q "실패 ① bgm1" /tmp/s3.txt && echo "막힘 ✅ 배경음 작음(-26 LUFS)" || { echo "❌ 작은 배경음이 안 막힘"; r=1; }
python3 $G/tools/소리검사.py $G >/tmp/s4.txt && echo "통과 ✅ 그대로인 것(대조군)" || { echo "❌ 대조군이 막힘"; r=1; }
exit $r
