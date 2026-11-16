#!/bin/bash
# bash 썸네일관문시험.sh → 관문이 진짜 막는지(틀린 값) · 맞는 값은 통과하는지(대조군). 관문을 고칠 때마다 다시 돌림
H=$(dirname "$0"); T=/tmp/썸시험; mkdir -p $T; F=0
python3 - "$T" <<'E'
import sys; from PIL import Image, ImageDraw, ImageFont
t = sys.argv[1]; ft = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc', 80)
def mk(n, y, size=(1080, 1920)):
    im = Image.new('RGB', size, (60, 20, 60)); ImageDraw.Draw(im).text((200, y), '지배자 키우기', font=ft, fill='white', stroke_width=6, stroke_fill='black'); im.save(f'{t}/{n}.jpg', quality=92)
mk('위잘림', 150); mk('아래잘림', 1760); mk('크기틀림', 600, (1080, 1350)); mk('맞음', 600)
import json
for n in ['위잘림','아래잘림','크기틀림','맞음']: json.dump({'글자': [], '캐릭터': []}, open(f'{t}/{n}.jpg.json','w'))
json.dump({'글자': [['제목', 200, 700, 900, 800]], '캐릭터': [['lord', 300, 750, 700, 1440]]}, open(f'{t}/가림.jpg.json','w')); mk('가림', 600)
E
chk() { python3 "$H/썸네일검사.py" "$1" > $T/out.txt 2>&1; r=$?; if [ $r = $2 ] && grep -q "$3" $T/out.txt; then echo "  ○ $(basename $1) → 끝 코드 $r · 「$3」"; else echo "  ✗ $(basename $1) 기대 $2 「$3」 · 실제 $r: $(cat $T/out.txt)"; F=1; fi; }
chk $T/위잘림.jpg 1 "위(격자에서 잘림)"
chk $T/아래잘림.jpg 1 "아래(격자에서 잘림)"
chk $T/크기틀림.jpg 1 "1080×1920이어야"
chk $T/맞음.jpg 0 "통과"
chk $T/가림.jpg 1 "가림"
[ -f "$H/dev_day1_thumb_old.jpg" ] && chk "$H/dev_day1_thumb_old.jpg" 1 "잘림"
[ $F = 0 ] && echo "썸네일 관문 시험 통과" || { echo "썸네일 관문 시험 실패"; exit 1; }
