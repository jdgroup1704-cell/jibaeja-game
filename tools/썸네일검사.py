# python3 썸네일검사.py 표지.jpg [미리보기.jpg] → 통과 0 / 막힘 1
# 고정 틀(11-16 19:16 대표님 「앞으로 썸네일 규격 고정틀 박아놔」 · 19:09 「썸네일 너 짤린다」 사진)
#  ① 크기 1080×1920(9:16)
#  ② 인스타 프로필 격자는 가운데 3:4(y 240~1680)만 보임 → 잘리는 칸 + 여유 30px(y 0~270 · 1650~1920)에 글자 없음
#     글자 = 또렷한 경계(밝기 차 90↑) 점이 한 줄에 40개↑ 있는 줄. 흐린 배경 그림은 걸리지 않음
#  ②-1 (11-19 대표님 「캐릭터 안 가리게」) 만들 때 남긴 표지.jpg.json이 있으면: 띠 밖 글자 상자가 캐릭터 상자와 겹치면 막음 · 없으면 막음(잴 수 없음)
#  ③ 미리보기 이름을 주면 격자에서 보이는 모습(540×720)을 저장 — 보낼 때 같이 보고 눈으로 확인
import sys
import numpy as np
from PIL import Image
f = sys.argv[1]; im = Image.open(f); bad = []
if im.size != (1080, 1920): bad.append(f'크기 {im.size[0]}×{im.size[1]} — 1080×1920이어야 함')
else:
    a = np.asarray(im.convert('L')).astype(int)
    g = np.maximum(np.abs(np.diff(a, axis=1))[:-1, :], np.abs(np.diff(a, axis=0))[:, :-1]); s = (g > 90).sum(1)
    for nm, y0, y1 in [('위(격자에서 잘림)', 0, 315), ('아래(격자에서 잘림)', 1650, 1919)]:
        rows = [y0 + i for i, v in enumerate(s[y0:y1]) if v >= 40]
        if rows: bad.append(f'{nm} y {rows[0]}~{rows[-1]}에 글자 · 또렷한 그림 {len(rows)}줄 — 가운데 y 270~1650 안으로 옮길 것')
    print(f'  잰 값: 위 칸 글자 줄 {int((s[0:270] >= 40).sum())} · 아래 칸 글자 줄 {int((s[1650:1919] >= 40).sum())} · 가운데 글자 줄 {int((s[270:1650] >= 40).sum())}')
import os, json
j = f + '.json'
if not os.path.exists(j): bad.append('글자 · 캐릭터 자리 기록(.json) 없음 — 썸네일만들기.py로 만들 것')
else:
    J = json.load(open(j)); hit = []
    for t, x0, y0, x1, y1 in J['글자']:
        if y0 >= 1440: continue   # 아래 띠 안 글자는 띠가 캐릭터 발 아래를 덮는 자리
        for c in J['캐릭터']:
            ov = max(0, min(x1, c[3]) - max(x0, c[1])) * max(0, min(y1, c[4]) - max(y0, c[2]))
            if ov > 0: hit.append(f'「{t}」이 {c[0]}을 {ov}px² 가림')
    print(f'  잰 값: 글자가 캐릭터를 가린 곳 {len(hit)}')
    if hit: bad.append(' · '.join(hit))
if len(sys.argv) > 2 and im.size == (1080, 1920): im.convert('RGB').crop((0, 240, 1080, 1680)).resize((540, 720)).save(sys.argv[2], quality=90)
if bad: print('  ✗ 썸네일 막힘: ' + ' / '.join(bad)); sys.exit(1)
print('  ✓ 썸네일 통과(1080×1920 · 격자 3:4에서 안 잘림)')
