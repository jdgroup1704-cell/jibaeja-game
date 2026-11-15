# 관문 ⑳ 시험: 옛 그림이면 막히고(대조), 새 그림이면 통과하는지 — 관문을 고칠 때마다 다시 돌림
set -u; D=$(mktemp -d); cp -r /home/claude/v85/tools $D/; mkdir -p $D/art; cp /home/claude/v85/art/*.webp $D/art/ 2>/dev/null
python3 그림관문.py /home/claude/v85 >/dev/null && echo "✓ 새 그림 통과" || { echo "✗ 새 그림이 막힘"; exit 1; }
# 틀린 값 1: 새그림 기록을 지움 → 막혀야
python3 - $D <<'P'
import json,sys; p=sys.argv[1]+'/tools/그림기준표.json'; T=json.load(open(p)); T['대상'][0]['새그림']=None; json.dump(T,open(p,'w'),ensure_ascii=False)
P
python3 $D/tools/그림관문.py $D | grep -q "옛 그림" && echo "✓ 새그림 기록 없으면 막힘(까닭: 옛 그림)" || { echo "✗ 기록 없는데 통과"; exit 1; }
# 틀린 값 2: 소환수 칼 숨쉬기를 옛 초록 그림으로 바꿈 → 테두리 · 보랏빛으로 막혀야
cp /home/claude/v85/tools/그림기준표.json $D/tools/; cp /home/claude/old_art_backup/sumv1_idle.webp $D/art/sumv1_idle.webp
python3 $D/tools/그림관문.py $D | grep "소환수 칼 idle" | grep -q "보랏빛" && echo "✓ 옛 초록 해골 넣으면 막힘(까닭: 보랏빛)" || { echo "✗ 옛 그림인데 통과"; exit 1; }
rm -rf $D
