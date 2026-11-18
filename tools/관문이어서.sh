#!/bin/bash
# 관문 이어 돌리기(11-18 12:2x — 작업 환경이 한 시간마다 다시 켜져 45분짜리 관문이 ㊹ · ㊼에서 두 번 끊김)
# 사용: bash 관문이어서.sh 폴더 앞결과파일
#   앞결과파일에 ✗가 하나도 없고, 그 뒤로 코드가 안 바뀌었을 때만, 마지막으로 시작된 칸부터 끝까지 돌려 앞결과 뒤에 붙임
set -e; D=$1; P=$2; cd "$(dirname "$0")"
grep -q "✗" "$P" && { echo "✗ 앞 결과에 실패가 있음 — 처음부터"; exit 1; }
NEWEST=$(find "$D" -name '*.js' -o -name '*.css' -o -name 'index.html' | grep -v /tools/ | xargs stat -c %Y | sort -n | tail -1); [ "$(stat -c %Y "$P")" -ge "$NEWEST" ] || { echo "✗ 앞 결과 뒤에 코드가 바뀜 — 처음부터"; exit 1; }
LAST=$(python3 -c "import sys,re; L=[l[0] for l in open(sys.argv[1],encoding='utf-8') if re.match('[\u2460-\u2473\u3251-\u325f\u32b1-\u32bf]',l)]; print(L[-1] if L else '')" "$P"); [ -n "$LAST" ] || { echo "✗ 앞 결과에 칸이 없음"; exit 1; }
N=$(grep -n "^echo \"$LAST" 점검관문.sh | head -1 | cut -d: -f1); [ -n "$N" ] || { echo "✗ $LAST 칸을 못 찾음"; exit 1; }
T=/tmp/관문뒤.sh; { sed -n 1,5p 점검관문.sh; sed -n "$N,\$p" 점검관문.sh; } > $T
python3 - "$P" "$LAST" <<'PY'
import sys; p, last = sys.argv[1], sys.argv[2]; L = open(p, encoding='utf-8').read().split('\n')
i = max(k for k, l in enumerate(L) if l.startswith(last)); open(p, 'w', encoding='utf-8').write('\n'.join(L[:i]) + '\n')
PY
echo "── 여기부터 이어서($LAST · $(TZ=Asia/Seoul date +%H:%M)) ──" >> "$P"; bash $T "$D" >> "$P" 2>&1 || true; tail -1 "$P"
