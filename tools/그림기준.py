# python3 그림기준.py 그림.webp[:칸폭:칸높이] ... → 순서 #10 그림체 기준(01:40 대표님 결정: 시안 1번 「2등신 귀여운 + 어두운 보랏빛」)
# 그림 한 장(띠 그림이면 첫 칸)에서 실제로 잼:
#  ① 머리폭비 = 몸통 윤곽(가는 무기 · 지팡이를 빼려고 굵게 깎아 낸 모양)에서 위 35%의 가장 넓은 폭 / 45~85%의 가장 넓은 폭(2등신은 머리가 몸만큼 큼) · 키폭비 = 몸통 키 / 폭(2등신은 땅딸막)
#  ② 테두리 = 그림 바깥 둘레 안쪽 2픽셀 중 어두운(밝기 < 80) 비율 — 시안 1번은 굵고 어두운 선
#  ③ 보랏빛 = 그림 안 보라(색상 255~315 · 채도 0.25 이상) 비율 — 우리 편 표시
# 기준(그림기준표.json): 머리 비율 ≥ 0.36 · 테두리 ≥ 0.45 · 우리 편 보랏빛 ≥ 0.06 · 적 보랏빛 ≤ 0.12(적과 우리 편이 한눈에 갈림) · 같은 무리 머리 비율 차 ≤ 0.14
import sys, json, colorsys
from PIL import Image, ImageFilter
import numpy as np

def frame(arg):
    p = arg.split(':'); im = Image.open(p[0]).convert('RGBA')
    if len(p) >= 3: im = im.crop((0, 0, int(float(p[1])), int(float(p[2]))))
    return im

def measure(im):
    a = np.array(im); al = a[:, :, 3] > 128
    ys, xs = np.where(al)
    if len(ys) < 50: return None
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)); a = np.array(im); al = a[:, :, 3] > 128
    H, W = al.shape
    k = max(3, int(H * 0.05) | 1)
    m = Image.fromarray((al * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k))
    core = np.array(m) > 128
    rows = np.where(core.any(1))[0]
    if len(rows) < 10: return None
    top, bot = rows.min(), rows.max(); ch = bot - top + 1
    w = np.array([core[y].sum() for y in range(H)])
    hw = w[top:top + int(ch * 0.35)].max(); bw = w[top + int(ch * 0.45):top + int(ch * 0.85)].max()
    head = hw / max(bw, 1)   # 머리 폭 / 몸 폭: 2등신은 머리가 몸만큼(≥ 0.85), 키 큰 그림은 머리가 좁음
    cols = np.where(core.any(0))[0]; squat = ch / max(1, cols.max() - cols.min() + 1)   # 몸통 키 / 폭: 2등신은 땅딸막(≤ 1.7)
    # 테두리
    er = np.array(Image.fromarray((al * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5))) > 128
    ring = al & ~er
    rgb = a[:, :, :3].astype(float); lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    edge = float((lum[ring] < 80).mean()) if ring.any() else 0
    # 보랏빛
    px = rgb[al] / 255.0; mx = px.max(1); mn = px.min(1); sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    r, g, b = px[:, 0], px[:, 1], px[:, 2]; d = np.maximum(mx - mn, 1e-6)
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    pur = float(((hue >= 255) & (hue <= 315) & (sat >= 0.25) & (mx > 0.15)).mean())
    return {'머리폭비': round(float(head), 3), '키폭비': round(float(squat), 2), '테두리': round(edge, 3), '보랏빛': round(pur, 3), '키': int(H)}

if __name__ == '__main__':
    out = {}
    for arg in sys.argv[1:]: out[arg.split(':')[0].split('/')[-1]] = measure(frame(arg))
    print(json.dumps(out, ensure_ascii=False, indent=0))
