#!/bin/bash
# 올리기: bash 올리기.sh  → /home/claude/pub 에 판 번호 찍고 깃허브 커밋·푸시, 바뀐 파일 목록 /home/claude/scratch/바뀐.txt
set -e
# 11-17 09:5x 막음: 09:46 판을 올리며 업데이트 소식 창 목록(lang_ko.js patch.list)을 안 바꿔 옛 목록이 떴음 → 깃허브 마지막 판과 같으면 멈춤
python3 - <<'PY' || { echo "✗ 업데이트 소식 목록(lang_ko.js patch.list)이 지난 판과 같음 — 바뀐 것을 적고 다시"; exit 1; }
import re,sys
g=lambda p: re.search(r"patch:\s*\{.*?list:\s*\[(.*?)\]", open(p,encoding='utf-8').read(), re.S).group(1)
sys.exit(0 if g('/home/claude/v85t/lang_ko.js')!=g('/home/claude/jibaeja-game/lang_ko.js') else 1)
PY
OLD=$(grep -o 'js/main.js?v=[0-9]*' /home/claude/v85t/index.html | head -1 | cut -d= -f2)
OLDL=$(grep -o '판 [0-9][0-9]-[0-9][0-9] [0-9][0-9]:[0-9][0-9]' /home/claude/v85t/index.html | head -1)
NEW=$(TZ=Asia/Seoul date +%m%d%H%M%S | cut -c1-10); NEWL="판 $(TZ=Asia/Seoul date '+%m-%d %H:%M')"
rm -rf /home/claude/pub && cp -r /home/claude/v85t /home/claude/pub
sed -i "s/$OLD/$NEW/g; s/$OLDL/$NEWL/g" /home/claude/pub/index.html
for d in /home/claude/v85 ; do sed -i "s/$OLD/$NEW/g; s/$OLDL/$NEWL/g" $d/index.html; done
echo "판번호 $OLD → $NEW · $OLDL → $NEWL"
R=/home/claude/jibaeja-game; cd $R; git pull -q --rebase origin main 2>&1 | tail -1 || true
cp -r /home/claude/pub/. $R/
git add -A . ':!dungeon-hero'
git diff --cached --name-only > /home/claude/scratch/바뀐.txt; wc -l < /home/claude/scratch/바뀐.txt
