# python3 새그림넣기.py → 순서 #10: new_art의 n_*/nw_* 띠 그림을 게임 이름으로 복사하고 draw.js VS 값(cw ch ax ay hpx=몸통 키 · n · bb=몸 상자)을 고쳐 씀. 띠를 다시 뽑을 때마다 돌림
import json, re, shutil, os
from PIL import Image, ImageFilter
import numpy as np
G = '/home/claude/v85/'; A = G + 'art/'; N = '/home/claude/new_art/'
src = open(G + 'js/draw.js', encoding='utf-8').read()
def core(path, v):
    im = Image.open(path).convert('RGBA').crop((0, 0, v['cw'], v['ch'])); a = np.array(im)[..., 3] > 100; kk = int(v['cw'] * 0.12) | 1
    m = np.array(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(kk)).filter(ImageFilter.MaxFilter(kk))) > 128
    ys, xs = np.where(m); return int(ys.max() - ys.min()), [round(float(xs.min() / v['cw']), 3), round(float(xs.max() / v['cw']), 3), round(float(ys.min() / v['ch']), 3), round(float(ys.max() / v['ch']), 3)]
def put(key, f, v, n, hpx, bb, extra='', note='새 그림체(시안 1번 참고 · 드리미나 영상)'):
    global src
    line = f"  {key}: {{ f: '{f}', cw: {v['cw']}, ch: {v['ch']}, ax: {v['ax']}, ay: {v['ay']}, hpx: {hpx}, n: {n}{extra}, bb: {json.dumps(bb)} }},   /* 11-16 순서 #10 {note} */"
    pat = re.compile(r'^  ' + re.escape(key) + r': \{.*$', re.M); assert pat.search(src), key; src = pat.sub(lambda m: line, src, count=1)
def cp(a, b): shutil.copy(A + a, A + b)
for i in range(1, 5):
    v = json.load(open(N + f'vs_n_sum{i}.json')); cp(f'n_sum{i}_idle.webp', f'sumv{i}_idle.webp'); cp(f'n_sum{i}_attack.webp', f'sumv{i}_attack.webp'); h, bb = core(A + f'sumv{i}_idle.webp', v)
    put(f'sumv{i}', f'sumv{i}', v, '{ attack: 16, idle: 20 }', h, bb)
    if os.path.exists(N + f'vsw_nw_sum{i}.json'):
        w = json.load(open(N + f'vsw_nw_sum{i}.json')); cp(f'nw_sum{i}_walk.webp', f'sumv{i}_walk.webp'); hw, bw = core(A + f'sumv{i}_walk.webp', w); put(f'sumv{i}w', f'sumv{i}', w, '{ walk: 16 }', hw, bw, note='새 그림체 걷기')
for i in range(5):
    v = json.load(open(N + f'vs_n_foe{i}.json')); cp(f'n_foe{i}_idle.webp', f'foev{i}_idle.webp'); cp(f'n_foe{i}_attack.webp', f'foev{i}_attack.webp'); h, bb = core(A + f'foev{i}_idle.webp', v)
    put(f'foev{i}', f'foev{i}', v, '{ attack: 16, idle: 20 }', h, bb)
for hid in ['krag', 'porter', 'serafine', 'nox', 'morde', 'twins', 'wisp', 'drummer']:
    v = json.load(open(N + f'vs_n_{hid}.json')); cp(f'n_{hid}_idle.webp', f'heroI_{hid}_idle.webp'); cp(f'n_{hid}_attack.webp', f'heroK_{hid}_atk.webp'); cp(f'n_{hid}_still.webp', f'heroA_{hid}.webp'); h, bb = core(A + f'heroI_{hid}_idle.webp', v)
    put(f'heroI_{hid}', f'heroI_{hid}', v, '{ idle: 20 }', h, bb); put(f'heroK_{hid}', f'heroK_{hid}', v, '{ atk: 16 }', h, bb, ', hit: 6')
    if os.path.exists(N + f'vsw_nw_{hid}.json'):
        w = json.load(open(N + f'vsw_nw_{hid}.json')); cp(f'nw_{hid}_walk.webp', f'heroW_{hid}_walk.webp'); hw, bw = core(A + f'heroW_{hid}_walk.webp', w); put(f'heroW_{hid}', f'heroW_{hid}', w, '{ walk: 16 }', hw, bw, note='새 그림체 걷기')
v = json.load(open(N + 'vs_n_lord.json')); cp('n_lord_attack.webp', 'lordw_attack.webp'); cp('n_lord_still.webp', 'lordA.webp'); h, bb = core(A + 'n_lord_idle.webp', v); put('lordw', 'lordw', v, '{ attack: 16 }', h, bb)
open(G + 'js/draw.js', 'w', encoding='utf-8').write(src); print('넣음')
