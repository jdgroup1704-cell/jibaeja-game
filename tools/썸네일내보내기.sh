#!/bin/bash
# bash 썸네일내보내기.sh 표지.jpg 보낼이름.jpg → 검사 통과해야만 /mnt/user-data/outputs 에 복사(+ 격자 미리보기). 썸네일은 이 길로만 내보냄
H=$(dirname "$0"); OUT=/mnt/user-data/outputs; mkdir -p $OUT
python3 "$H/썸네일검사.py" "$1" "$OUT/${2%.jpg}_grid_preview.jpg" || { echo "내보내지 않음"; exit 1; }
cp "$1" "$OUT/$2" && echo "내보냄: $OUT/$2 · $OUT/${2%.jpg}_grid_preview.jpg"
