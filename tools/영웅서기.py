# 영웅 서 있기 영상(드리미나 Seedance · 첫·끝 장면 = 걷기 A그림, 초록 바탕 3:4 · 숨쉬기 5초) → 한 바퀴 24장 줄그림 webp + VS 값
# 사용: python3 -I 영웅서기.py 영상.mp4 영웅id 그림전체높이 그림바닥y 그림가운데x [장수=16]   (768×1024 기준 · 값은 걷기와 같음)
# 11-15 19:36 대표님 「종이가 움직이냐?」 — 서 있을 때도 그림 한 장이던 것 → 숨쉬는 영상
import sys, subprocess, json, os, tempfile
import numpy as np
from PIL import Image
mp4, hid, bh, foot, cx = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]); NF = int(sys.argv[6]) if len(sys.argv) > 6 else 16
T = tempfile.mkdtemp(); subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', mp4, '-vf', 'fps=24', f'{T}/%03d.png'], check=True)
A = [np.asarray(Image.open(f'{T}/{f}').convert('RGB')).astype(np.float32) for f in sorted(os.listdir(T))]; H, W = A[0].shape[:2]
for a in A: a[:int(H * 0.06), :int(W * 0.12)] = (0, 177, 64)   # 「AI」 표시
def key(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]; mx = np.maximum(r, b)
    al = np.minimum(np.clip(1 - (g - mx - 22) / 45, 0, 1), np.clip(1 - (g / (mx + 8) - 1.25) / 0.45, 0, 1))   # 밝은 초록 + 어두운 초록(마법 소용돌이에 어두워진 바탕)도 빼기
    cn = np.concatenate([a[8:40, -40:-8].reshape(-1, 3), a[-40:-8, 8:40].reshape(-1, 3), a[-40:-8, -40:-8].reshape(-1, 3)]); bg = np.median(cn, 0)   # 이 장의 바탕색(모르데 마법에 바탕이 어두운 청록으로 변함)
    dist = np.sqrt(((a - bg) ** 2).sum(-1)); al = np.minimum(al, np.clip((dist - 28) / 50, 0, 1))   # 바탕색과 비슷하면 투명
    out = a.copy(); out[..., 1] = np.where(g > mx, mx + (g - mx) * 0.15, g)   # 초록 번짐
    return np.dstack([np.clip(out, 0, 255), al * 255]).astype(np.uint8)
NF = 24; idx = [round(i * (len(A) - 1) / NF) for i in range(NF)]   # 5초를 고르게 24장(첫 장 = 끝 장이라 이어 돌면 한 바퀴)
K = [key(A[i]) for i in idx]; Z = 260 / (bh * H / 1024)   # 몸 전체 높이를 300픽셀로(게임에선 최대 약 250으로 그림)
al = np.max([k[..., 3] for k in K], axis=0); ys, xs = np.where(al > 40)
x0, x1, y0, y1 = max(0, xs.min() - 4), min(W, xs.max() + 5), max(0, ys.min() - 4), min(H, ys.max() + 5); cw, ch = x1 - x0, y1 - y0
COLS = 10; rows = (NF + COLS - 1) // COLS; sheet = Image.new('RGBA', (cw * COLS, ch * rows), (0, 0, 0, 0))
zw, zh = round(cw * Z), round(ch * Z); sheet = Image.new('RGBA', (zw * COLS, zh * rows), (0, 0, 0, 0))
for i, k in enumerate(K): sheet.paste(Image.fromarray(k[y0:y1, x0:x1], 'RGBA').resize((zw, zh), Image.LANCZOS), ((i % COLS) * zw, (i // COLS) * zh))
sc = H / 1024; out = f'/home/claude/v85/art/heroI_{hid}_idle.webp'; cw, ch, sc2 = zw, zh, Z
sheet.save(out, 'WEBP', quality=86)
vs = {'f': f'heroI_{hid}', 'cw': round(cw), 'ch': round(ch), 'ax': round((cx * sc - x0) * sc2, 1), 'ay': round((foot * sc - y0) * sc2, 1), 'hpx': round(bh * sc * sc2, 1), 'n': {'idle': NF}}
print(json.dumps({'frames': len(A), 'vs': vs, 'bytes': os.path.getsize(out)}, ensure_ascii=False))
