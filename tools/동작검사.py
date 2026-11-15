# python3 동작검사.py ../art → 관문 ⑫ (11-15 19:36 대표님 「종이가 움직이냐? 고전 겜이냐?」 · 19:38 「한 장인 걸 스스로 판단했어야지」)
# 전장에 나오는 영웅마다 「때리기」(heroK_<id>_atk) · 「서 있기」(heroI_<id>_idle) 영상 줄그림이 있어야 함. 걷는 영웅(날지 않는)은 걷기 영상(heroW_<id>_walk.webp)도.
import os, sys
art = sys.argv[1]; H = ['krag', 'serafine', 'nox', 'drummer', 'porter', 'morde', 'twins', 'wisp']; FLY = {'twins', 'wisp'}; miss = []
for h in H:
    if not os.path.exists(f'{art}/heroK_{h}_atk.webp'): miss.append(f'{h} 때리기')
    if not os.path.exists(f'{art}/heroI_{h}_idle.webp'): miss.append(f'{h} 서 있기')
    if h not in FLY and not os.path.exists(f'{art}/heroW_{h}_walk.webp'): miss.append(f'{h} 걷기')
for m in miss: print('  ✗ 그림 한 장(종이): ' + m)
print(f'  영웅 {len(H)}명 · 동작 빠짐 {len(miss)}개')
if miss: sys.exit(1)
# 11-15 22:45 더함: 때리기 줄그림 칸 가장자리가 불투명하면(빛이 영상 테두리에 잘려 네모가 보임) 실패
import numpy as np
from PIL import Image
bad = []
for h in H:
    p = f'{art}/heroK_{h}_atk.webp'
    if not os.path.exists(p): continue
    im = Image.open(p); a = np.asarray(im)[..., 3]; cw = im.width // 10; rh = im.height // 2
    for i in range(16):
        c = a[(i // 10) * rh:(i // 10 + 1) * rh, (i % 10) * cw:(i % 10 + 1) * cw]; e = np.concatenate([c[:4].ravel(), c[-4:].ravel(), c[:, :4].ravel(), c[:, -4:].ravel()])
        if (e > 60).mean() > 0.05: bad.append(f'{h} {i + 1}번 장 가장자리 {round(float((e > 60).mean()) * 100)}%'); break
for b in bad: print('  ✗ 네모 테두리: ' + b)
if bad: sys.exit(1)
