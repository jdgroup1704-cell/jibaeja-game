# python3 tools/초록빼기.py 입력.webp 출력.webp [높이] : 초록 배경 빼고(가장자리 초록 번짐 없앰) · 왼쪽 위 AI 표시 지움 · 그림만 잘라 높이 맞춤
import sys, numpy as np
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]; H = int(sys.argv[3]) if len(sys.argv) > 3 else 520
a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]; gr = g - np.maximum(r, b)
al = np.clip(1 - (gr - 18) / 50, 0, 1)
h, w = al.shape; al[:int(h * 0.06), :int(w * 0.1)] = 0   # 드리미나 AI 표시
bg = np.median(np.concatenate([a[:20, -20:].reshape(-1, 3), a[-20:, :20].reshape(-1, 3), a[-20:, -20:].reshape(-1, 3)]), 0)   # 바탕 초록 색
k = np.maximum(al, 0.05)[..., None]; a = np.clip((a - (1 - k) * bg) / k, 0, 255)   # 반투명 가장자리: 초록이 섞인 색에서 초록을 덜어 냄(불꽃 둘레 누런 번짐 막기)
r, g, b = a[..., 0], a[..., 1], a[..., 2]; a[..., 1] = np.where(al < 0.98, np.minimum(g, np.maximum(r, b)), g)
from scipy.ndimage import distance_transform_edt
near = distance_transform_edt(al > 0.5) < 16   # 투명 경계에서 16픽셀 안(불꽃 둘레 누런 띠 자리)
gr2 = a[..., 1] - np.maximum(a[..., 0], a[..., 2]); sel = near & (gr2 > -6)
al = np.where(sel, al * np.clip(1 - (gr2 + 6) / 30, 0, 1), al); a[..., 1] = np.where(sel, np.minimum(a[..., 1], a[..., 0]), a[..., 1])   # 11-15 눈 확인: 불꽃 둘레 누런 초록 띠 → 경계 가까운 초록 기운만 지움(포터 초록 피부는 안쪽이라 남음)
R, G, B = a[..., 0], a[..., 1], a[..., 2]; ol = (G - R >= -12) & (G - R <= 18) & (G - B > 15) & (np.maximum(R, G) < 150)   # 누런 초록 연기(드리미나가 붉은 불꽃에 초록 바탕을 섞어 그린 띠) — 포터 초록 피부(G가 R보다 20 넘게 큼)는 빠짐
a[..., 1] = np.where(ol, R * 0.45, G); a[..., 2] = np.where(ol, B * 0.7, B); al = np.where(ol, al * 0.75, al)   # 11-15 눈 확인: 검붉은 연기로 바꿈
im = Image.fromarray(np.dstack([a, al * 255]).astype(np.uint8), 'RGBA')
bb = Image.fromarray((al > 0.25).astype(np.uint8) * 255).getbbox(); im = im.crop(bb)
im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS); im.save(dst, quality=88, method=6)
print(dst, im.size, '남은 초록 비율', round(float(((gr > 30) & (al > 0.5)).mean()), 4))
