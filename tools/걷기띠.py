# python3 -I 걷기띠.py 영상.mp4 출력이름 [--flip] → art/{이름}_walk.webp 16장 + VS 값(json)  · 순서 #10 새 그림체 걷기
# 드리미나 영상(첫 장면 = 새 그림, 「제자리에서 오른쪽으로 걷기」 5초)에서 한 걸음 주기(장 i와 i+p가 가장 닮은 p)를 찾아 이음매 없는 한 바퀴를 뽑음
# 관문 ⑫ 「그림 한 장(종이)이 걷는다」를 막으려고 — 11-16 묶음 검수에서 옛 걷기 띠를 치우자 ⑫가 잡음
import sys, subprocess, json, os, tempfile
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
a = sys.argv[1:]; mp4, name = a[0], a[1]; flip = '--flip' in a; NF = 16
T = tempfile.mkdtemp(); subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', mp4, '-vf', 'fps=24', f'{T}/%03d.png'], check=True)
A = [np.asarray(Image.open(f'{T}/{f}').convert('RGB')).astype(np.float32) for f in sorted(os.listdir(T))]; H, W = A[0].shape[:2]
if flip: A = [x[:, ::-1].copy() for x in A]
for x in A:
    if flip: x[:int(H * 0.06), -int(W * 0.12):] = (0, 177, 64)
    else: x[:int(H * 0.06), :int(W * 0.12)] = (0, 177, 64)
def key(x):
    r, g, b = x[..., 0], x[..., 1], x[..., 2]; mx = np.maximum(r, b)
    al = np.minimum(np.clip(1 - (g - mx - 22) / 45, 0, 1), np.clip(1 - (g / (mx + 8) - 1.25) / 0.45, 0, 1))
    cn = np.concatenate([x[8:40, -40:-8].reshape(-1, 3), x[-40:-8, 8:40].reshape(-1, 3), x[-40:-8, -40:-8].reshape(-1, 3)]); bg = np.median(cn, 0)
    dist = np.sqrt(((x - bg) ** 2).sum(-1)); al = np.minimum(al, np.clip((dist - 28) / 50, 0, 1))
    hh, ww = al.shape; yy, xx = np.mgrid[0:hh, 0:ww]; m = 0.06; ef = np.clip(np.minimum.reduce([xx / (ww * m), (ww - 1 - xx) / (ww * m), yy / (hh * m), (hh - 1 - yy) / (hh * m)]), 0, 1)
    al = al * ef; al = np.clip((al - 0.18) / 0.82, 0, 1)
    k = np.maximum(al, 0.08)[..., None]; out = np.clip((x - (1 - k) * bg) / k, 0, 255)
    r, g, b = out[..., 0], out[..., 1], out[..., 2]; mx = np.maximum(r, b); out[..., 1] = np.where(g > mx, mx + (g - mx) * 0.15, g)
    lime = (out[..., 1] > 0.88 * r) & (b < 0.7 * out[..., 1]) & (out[..., 1] > 90); out[..., 1] = np.where(lime, np.minimum(out[..., 1], 0.88 * r + 0.12 * b), out[..., 1])
    return np.dstack([np.clip(out, 0, 255), al * 255]).astype(np.uint8)
S = [x[::6, ::6] for x in A]; n = len(A)
best = None
for p in range(10, 40):   # 한 걸음 주기(장 수): 0.4~1.7초
    for s in range(6, n - p - 1, 2):
        e = float(np.abs(S[s] - S[s + p]).mean())
        mv = float(np.mean([np.abs(S[s + i] - S[s]).mean() for i in range(0, p, max(1, p // 6))]))   # 그 사이에 실제로 움직였나(가만히 서 있는 구간은 빼려고)
        sc = e - 0.15 * mv
        if mv > 2.0 and (best is None or sc < best[0]): best = (sc, s, p, e, mv)
_, s0, p, e, mv = best
idx = [s0 + round(i * p / NF) for i in range(NF)]
K = [key(A[i]) for i in idx]
al = np.max([k[..., 3] for k in K], axis=0); ys, xs = np.where(al > 40)
x0, x1, y0, y1 = max(0, xs.min() - 4), min(W, xs.max() + 5), max(0, ys.min() - 4), min(H, ys.max() + 5)
f0 = K[0][..., 3] > 100; kk = int((x1 - x0) * 0.10) | 1
core = np.array(Image.fromarray((f0 * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(kk)).filter(ImageFilter.MaxFilter(kk))) > 128
cy, cx_ = np.where(core); body = cy.max() - cy.min()
fy, fx = np.where(f0); foot = np.percentile(np.max(np.stack([np.where(k[..., 3] > 100, np.arange(H)[:, None], 0).max(0) for k in K]), 0)[np.max(np.stack([np.where(k[..., 3] > 100, np.arange(H)[:, None], 0).max(0) for k in K]), 0) > 0], 98)   # 발 = 여러 장에서 가장 아래(걸음마다 발이 들려도 땅은 그대로)
bot = fx[fy > fy.max() - body * 0.12]; cx = (bot.min() + bot.max()) / 2
Z = 300 / body; zw, zh = round((x1 - x0) * Z), round((y1 - y0) * Z); COLS = 10
sh = Image.new('RGBA', (zw * COLS, zh * 2), (0, 0, 0, 0))
for i, k in enumerate(K): sh.paste(Image.fromarray(k[y0:y1, x0:x1], 'RGBA').resize((zw, zh), Image.LANCZOS), ((i % COLS) * zw, (i // COLS) * zh))
out = f'/home/claude/v85/art/{name}_walk.webp'; sh.save(out, 'WEBP', quality=86)
vs = {'cw': zw, 'ch': zh, 'ax': round((cx - x0) * Z, 1), 'ay': round((foot - y0) * Z, 1), 'hpx': 300, 'n': {'walk': NF}}
json.dump(vs, open(f'/home/claude/new_art/vsw_{name}.json', 'w'))
print(json.dumps({'장': n, '걸음': [int(s0), int(p)], '이음매차이': round(e, 2), '움직임': round(mv, 2), 'vs': vs, 'bytes': os.path.getsize(out)}, ensure_ascii=False))
