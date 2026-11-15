# 영웅 때리기 영상(드리미나 Seedance · 첫·끝 장면 = 걷기 A그림, 초록 바탕 3:4) → 때리기 한 번 N장 줄그림 webp + VS 값
# 사용: python3 -I 영웅때리기.py 영상.mp4 영웅id 그림전체높이 그림바닥y 그림가운데x [장수=16]   (768×1024 기준 · 값은 걷기와 같음)
# 11-15 19:36 대표님 「종이가 움직이냐?」 — 영웅이 그림 한 장을 허리에서 돌리던 것 → 진짜 때리는 동작
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
    hh, ww = al.shape; yy, xx = np.mgrid[0:hh, 0:ww]; m = 0.1; ef = np.clip(np.minimum.reduce([xx / (ww * m), (ww - 1 - xx) / (ww * m), yy / (hh * m), (hh - 1 - yy) / (hh * m)]), 0, 1)
    al = al * ef; al = np.clip((al - 0.18) / 0.82, 0, 1)   # 11-15 22:45 느린 영상: 칼 빛이 영상 테두리에 잘려 전장에 반투명 네모가 보였음 → 테두리 10%에서 서서히 사라지게 · 옅은 바탕 안개는 지움
    out = a.copy(); out[..., 1] = np.where(g > mx, mx + (g - mx) * 0.15, g)   # 초록 번짐
    return np.dstack([np.clip(out, 0, 255), al * 255]).astype(np.uint8)
small = [a[::6, ::6] for a in A]; d = np.array([np.abs(s - small[0]).mean() for s in small]); dm = d.max()
pk = int(np.argmax(d)); act = np.where(d > dm * 0.3)[0]; s0 = max(0, act[0] - 2, pk - 18)   # 젖히기는 짧게(최대 0.75초 앞부터)
s1 = min(range(pk + 8, min(len(A), pk + 48)), key=lambda i: d[i])   # 끝 = 첫 장면과 가장 닮은 장(제자리로 돌아온 때) — 게임에서 서 있는 그림으로 이어질 때 튀지 않게
a0 = int(np.where(d > dm * 0.12)[0][0]); a0 = max(0, min(a0, pk - 6))   # 움직이기 시작한 장(서 있는 모습에서 출발)
seg = lambda u, v, n: [round(u + i * (v - u) / n) for i in range(n)]
idx = seg(a0, pk - 2, 5) + seg(pk - 2, pk + 8, 5) + seg(pk + 8, s1, 5) + [s1]   # 젖히기 5 · 내려침 5 · 돌아오기 6 = 16장(장마다 시간이 달라 실제 동작 박자를 살림)
NF = len(idx); hit = 6   # 내려침 두 번째 장 = 닿는 순간
K = [key(A[i]) for i in idx]; Z = 300 / (bh * H / 1024)   # 몸 전체 높이를 300픽셀로(게임에선 최대 약 250으로 그림)
al = np.max([k[..., 3] for k in K], axis=0); ys, xs = np.where(al > 40)
x0, x1, y0, y1 = max(0, xs.min() - 4), min(W, xs.max() + 5), max(0, ys.min() - 4), min(H, ys.max() + 5); cw, ch = x1 - x0, y1 - y0
COLS = 10; rows = (NF + COLS - 1) // COLS; sheet = Image.new('RGBA', (cw * COLS, ch * rows), (0, 0, 0, 0))
zw, zh = round(cw * Z), round(ch * Z); sheet = Image.new('RGBA', (zw * COLS, zh * rows), (0, 0, 0, 0))
for i, k in enumerate(K): sheet.paste(Image.fromarray(k[y0:y1, x0:x1], 'RGBA').resize((zw, zh), Image.LANCZOS), ((i % COLS) * zw, (i // COLS) * zh))
sc = H / 1024; out = f'/home/claude/v85/art/heroK_{hid}_atk.webp'; cw, ch, sc2 = zw, zh, Z
sheet.save(out, 'WEBP', quality=86)
vs = {'f': f'heroK_{hid}', 'cw': round(cw), 'ch': round(ch), 'ax': round((cx * sc - x0) * sc2, 1), 'ay': round((foot * sc - y0) * sc2, 1), 'hpx': round(bh * sc * sc2, 1), 'n': {'atk': NF}, 'hit': hit}
print(json.dumps({'frames': len(A), 'act': [int(s0), int(s1)], 'dur': round((s1 - s0) / 24, 2), 'vs': vs, 'bytes': os.path.getsize(out)}, ensure_ascii=False))
