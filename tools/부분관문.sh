#!/bin/bash
# bash 부분관문.sh 폴더 ⑲ ㉚ ㉜ … → 점검관문.sh에서 고른 관문 줄만 돌림(같은 명령 그대로)
# 11-17 같은 날 두 번 관문이 겹쳐 돌며 서로 크롬을 끔 → 이미 도는 관문이 있으면 멈춤
exec 9>/tmp/관문.lock; flock -n 9 || { echo '✗ 다른 관문이 돌고 있음 — 끝난 뒤 다시'; exit 1; }
D=$1; shift; cd /home/claude/v85/tools; T=/tmp/부분관문_run.sh
{ echo '#!/bin/bash'; echo "D=$D; F=0; pkill -f chrome 2>/dev/null"; for m in "$@"; do grep "^echo \"$m" 점검관문.sh; echo 'pkill -f chrome 2>/dev/null'; done; echo '[ $F = 0 ] && echo "부분 관문 통과" || echo "부분 관문 실패"'; } > $T
bash $T $D
