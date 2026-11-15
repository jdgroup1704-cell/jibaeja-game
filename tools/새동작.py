# python3 -I 새동작.py 영상.mp4 출력이름 [--flip] [--idle 장수] [--atk 장수]  → 순서 #10 새 그림체 동작(드리미나 Seedance · 첫 장면 = 시안 1번 참고로 그린 새 그림, 초록 바탕 3:4)
# 영상 한 편 = 0~2초 숨쉬기 → 2~3.5초 때리기 한 번 → 3.5~5초 제자리. 여기서 두 띠 그림을 뽑음:
#   art/{이름}_idle.webp  숨쉬기 한 바퀴(첫 장면과 가장 닮은 장에서 끊어 이음매 없게)
#   art/{이름}_attack.webp 때리기 한 번(젖히기 5 · 내려침 5 · 돌아오기 6 = 16장, 닿는 순간 = 6번째)
# 두 띠는 같은 칸 크기 · 같은 발 위치(ax, ay) → 게임에서 숨쉬기 ↔ 때리기가 튀지 않음. VS 값(cw ch ax ay hpx n hit)을 json으로 출력
import sys, subprocess, json, os, tempfile
import numpy as np
from PIL import Image
a = sys.argv[1:]; mp4, name = a[0], a[1]; flip = '--flip' in a
NI = int(a[a.index('--idle') + 1]) if '--idle' in a else 20
T = tempfile.mkdtemp(); subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', mp4, '-vf', 'fps=24', f'{T}/%03d.png'], check=True)
A = [np.asarray(Image.open(f'{T}/{f}').convert('RGB')).astype(np.float32) for f in sorted(os.listdir(T))]; H, W = A[0].shape[:2]
if flip: A = [x[:, ::-1].copy() for x in A]
for x in A:   # 「AI」 표시(왼쪽 위 · 뒤집었으면 오른쪽 위)
    if flip: x[:int(H * 0.06), -int(W * 0.12):] = (0, 177, 64)
    else: x[:int(H * 0.06), :int(W * 0.12)] = (0, 177, 64)
def key(x):
    r, g, b = x[..., 0], x[..., 1], x[..., 2]; mx = np.maximum(r, b)
    al = np.minimum(np.clip(1 - (g - mx - 22) / 45, 0, 1), np.clip(1 - (g / (mx + 8) - 1.25) / 0.45, 0, 1))
    cn = np.concatenate([x[8:40, -40:-8].reshape(-1, 3), x[-40:-8, 8:40].reshape(-1, 3), x[-40:-8, -40:-8].reshape(-1, 3)]); bg = np.median(cn, 0)
    dist = np.sqrt(((x - bg) ** 2).sum(-1)); al = np.minimum(al, np.clip((dist - 28) / 50, 0, 1))
    hh, ww = al.shape; yy, xx = np.mgrid[0:hh, 0:ww]; m = 0.06; ef = np.clip(np.minimum.reduce([xx / (ww * m), (ww - 1 - xx) / (ww * m), yy / (hh * m), (hh - 1 - yy) / (hh * m)]), 0, 1)
    al = al * ef; al = np.clip((al - 0.18) / 0.82, 0, 1)
    k = np.maximum(al, 0.08)[..., None]; out = np.clip((x - (1 - k) * bg) / k, 0, 255)   # 반투명 빛 = 빛 색과 초록 바탕이 섞인 것 → 바탕을 덜어 냄(초록빼기.py와 같은 방법)
    r, g, b = out[..., 0], out[..., 1], out[..., 2]; mx = np.maximum(r, b); out[..., 1] = np.where(g > mx, mx + (g - mx) * 0.15, g)
    lime = (out[..., 1] > 0.88 * r) & (b < 0.7 * out[..., 1]) & (out[..., 1] > 90); out[..., 1] = np.where(lime, np.minimum(out[..., 1], 0.88 * r + 0.12 * b), out[..., 1])   # 연두 빛(노랑 + 초록 바탕) → 금빛으로. 금은 빨강 > 초록이라 안 바뀜   # 11-16 눈 확인: 노란 빛이 초록 바탕과 섞여 연두 안개(사제 지팡이) → 반투명 가장자리 초록 빼기
    return np.dstack([np.clip(out, 0, 255), al * 255]).astype(np.uint8)
R = 3   # 첫 몇 장은 원본 그림 그대로라 영상 화면과 색 · 선이 살짝 달라 튐 → 3번째 장을 기준으로
small = [x[::6, ::6] for x in A]; d = np.array([np.abs(s - small[R]).mean() for s in small]); d[:R] = 0
base = float(np.median(d[R + 1:min(len(A), 40)])); dm = float(d.max())
pk = int(np.argmax(d))   # 때리기에서 가장 많이 움직인 장
thr = base + (dm - base) * 0.35
a0 = next((i for i in range(20, pk) if d[i] > thr), max(20, pk - 12)); a0 = max(20, min(a0, pk - 6)) - 2   # 때리기 시작(2장 앞부터 = 서 있는 모습에서 출발)
lo, hi = R + 14, max(R + 15, a0 - 1)
e = lo + int(np.argmin(d[lo:hi]))   # 숨쉬기 한 바퀴 끝 = 기준 장과 가장 닮은 장
idle_idx = [R + round(i * (e - R) / NI) for i in range(NI)]
s1 = min(range(pk + 6, len(A)), key=lambda i: d[i])   # 제자리로 돌아온 장
seg = lambda u, v, n: [round(u + i * (v - u) / n) for i in range(n)]
atk_idx = seg(a0, pk - 2, 5) + seg(pk - 2, pk + 6, 5) + seg(pk + 6, s1, 5) + [s1]; hit = 6
KI = [key(A[i]) for i in idle_idx]; KA = [key(A[i]) for i in atk_idx]
al = np.max([k[..., 3] for k in KI + KA], axis=0); ys, xs = np.where(al > 40)
x0, x1, y0, y1 = max(0, xs.min() - 24), min(W, xs.max() + 25), max(0, ys.min() - 24), min(H, ys.max() + 25)   # 둘레 여유(가장자리 서서히 사라짐 칸)
f0 = key(A[R])[..., 3] > 100; fy, fx = np.where(f0); body = fy.max() - fy.min()   # 첫 장면 몸 키
foot = fy.max(); bot = fx[fy > foot - body * 0.12]; cx = (bot.min() + bot.max()) / 2   # 발 = 맨 아래 · 가운데 = 발 줄 가운데
Z = 300 / body; zw, zh = round((x1 - x0) * Z), round((y1 - y0) * Z); COLS = 10
def sheet(K, path):
    rows = (len(K) + COLS - 1) // COLS; sh = Image.new('RGBA', (zw * COLS if len(K) >= COLS else zw * len(K), zh * rows), (0, 0, 0, 0))
    yy, xx = np.mgrid[0:zh, 0:zw]; m = 0.07; fade = np.clip(np.minimum.reduce([xx / (zw * m), (zw - 1 - xx) / (zw * m), yy / (zh * m), (zh - 1 - yy) / (zh * m)]), 0, 1)   # 11-16 관문⑫: 때리기 빛이 칸 끝에 잘려 네모가 보임 → 칸 가장자리 7%에서 서서히 사라지게
    for i, k in enumerate(K):
        c = np.array(Image.fromarray(k[y0:y1, x0:x1], 'RGBA').resize((zw, zh), Image.LANCZOS)).astype(np.float32); c[..., 3] *= fade
        sh.paste(Image.fromarray(c.astype(np.uint8), 'RGBA'), ((i % COLS) * zw, (i // COLS) * zh))
    sh.save(path, 'WEBP', quality=86); return os.path.getsize(path)
art = '/home/claude/v85/art/'
b1 = sheet(KI, art + f'{name}_idle.webp'); b2 = sheet(KA, art + f'{name}_attack.webp')
vs = {'f': name, 'cw': zw, 'ch': zh, 'ax': round((cx - x0) * Z, 1), 'ay': round((foot - y0) * Z, 1), 'hpx': 300, 'n': {'idle': NI, 'attack': len(atk_idx)}, 'hit': hit}
# 첫 장면 그대로 한 장(정지 그림이 필요한 곳 — 지배자 lordA 등)
st = Image.fromarray(key(A[R])).crop((int(fx.min()) - 6, int(fy.min()) - 6, int(fx.max()) + 7, int(fy.max()) + 4)); st.save(art + f'{name}_still.webp', 'WEBP', quality=88)
json.dump(vs, open(f'/home/claude/new_art/vs_{name}.json', 'w'))
print(json.dumps({'장': len(A), '숨쉬기': [0, e], '때리기': [a0, pk, s1], 'vs': vs, 'bytes': [b1, b2]}, ensure_ascii=False))
