# 영웅 걷기 영상(드리미나, 초록 바탕 3:4 · 첫·끝 장면 = 영웅 그림 A) → 한 바퀴 16장 줄그림 webp + VS 값
# 사용: python3 -I 영웅걷기.py 영상.mp4 영웅id 그림전체높이 그림바닥y 그림가운데x (모두 768×1024 기준 — 게임은 그림 전체(빈 테두리 포함)의 바닥 가운데를 발로 씀)
import sys, subprocess, json, os, tempfile
import numpy as np
from PIL import Image
mp4, hid, bh, foot, cx = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
T = tempfile.mkdtemp()
subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', mp4, '-vf', 'fps=24', f'{T}/%03d.png'], check=True)
fs = sorted(os.listdir(T)); A = [np.asarray(Image.open(f'{T}/{f}').convert('RGB')).astype(np.int16) for f in fs]
H, W = A[0].shape[:2]
def key(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (g - np.maximum(r, b)).astype(np.float32)
    al = np.clip(1 - (m - 25) / 55, 0, 1)   # 초록이 진할수록 투명
    out = a.astype(np.float32).copy(); sp = np.maximum(0, g - np.maximum(r, b)); out[..., 1] -= sp * 0.9   # 초록 번짐 빼기
    return np.dstack([np.clip(out, 0, 255), al * 255]).astype(np.uint8)
for a in A: a[:int(H*0.06), :int(W*0.12)] = (0, 177, 64)   # 왼쪽 위 「AI」 표시 지움
small = [a[::4, ::4].astype(np.float32) for a in A]
n = len(A); best = None
for p in range(10, min(48, n // 2)):
    d = np.mean([np.abs(small[i] - small[i + p]).mean() for i in range(n // 4, n - p)])
    if best is None or d < best[0]: best = (d, p)
p = best[1]
# 고르게 걷는 구간: 앞뒤 여유를 두고 가운데에서 한 바퀴
s0 = max(2, (n - p) // 2)
seg = [s0 + round(i * p / 16) for i in range(16)]
K = [key(A[i]) for i in seg]
al = np.max([k[..., 3] for k in K], axis=0); ys, xs = np.where(al > 40)
x0, x1, y0, y1 = xs.min() - 4, xs.max() + 5, ys.min() - 4, ys.max() + 5
x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(W, x1), min(H, y1)
cw, ch = x1 - x0, y1 - y0; COLS = 10; rows = (16 + COLS - 1) // COLS
sheet = Image.new('RGBA', (cw * COLS, ch * rows), (0, 0, 0, 0))
for i, k in enumerate(K): sheet.paste(Image.fromarray(k[y0:y1, x0:x1], 'RGBA'), ((i % COLS) * cw, (i // COLS) * ch))
sc = H / 1024; out = f'/home/claude/v85/art/heroW_{hid}_walk.webp'; sheet.save(out, 'WEBP', quality=88)
vs = {'f': f'heroW_{hid}', 'cw': int(cw), 'ch': int(ch), 'ax': round(cx * sc - x0, 1), 'ay': round(foot * sc - y0, 1), 'hpx': round(bh * sc, 1), 'n': {'walk': 16}}
print(json.dumps({'frames': n, 'period': p, 'diff': round(float(best[0]), 2), 'size': [W, H], 'vs': vs, 'out': out, 'bytes': os.path.getsize(out)}, ensure_ascii=False))
