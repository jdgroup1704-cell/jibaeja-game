# python3 효과음분석.py 게임폴더 → 효과음재기.js가 남긴 /tmp/효과음.json · /tmp/효과음.wav 분석(JSON 한 줄)
import json, sys, subprocess, re, wave, numpy as np, os
G = sys.argv[1]; d = json.load(open('/tmp/효과음.json')); T = d['dur']
def mean_db(n):
    p = f'{G}/sfx/{n}.mp3'
    if not os.path.exists(p): return None
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', p, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.search(r'mean_volume: (-?[\d.]+)', o); return float(m.group(1)) if m else None
by = {}
for t, k, n, v in d['all']:
    if k != 'smp' or t < 0: continue
    o = by.setdefault(n, {'n': 0, 'v': []}); o['n'] += 1; o['v'].append(v or 1)
rows = {}
for n, o in by.items():
    md = mean_db(n); vv = float(np.median(o['v']))
    rows[n] = {'번': o['n'], '초당': round(o['n'] / T, 2), '실제크기dB': round(float(md + 20 * np.log10(max(vv, 1e-4))), 1) if md is not None else None}
w = wave.open('/tmp/효과음.wav'); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768; sr = w.getframerate(); x = x.reshape(-1, 2).mean(1)
win = int(0.4 * sr); m = [20 * np.log10(np.sqrt(np.mean(x[i:i + win] ** 2)) + 1e-9) for i in range(0, len(x) - win, win // 2)]
clip = int(np.sum(np.abs(x) > 0.99))
ts = sorted(t for t, k, n, v in d['all'] if k in ('smp', 'osc', 'noise') and t > 0); dense = max((sum(1 for u in ts if s <= u < s + 1) for s in ts), default=0)
loud = [rows[n]['실제크기dB'] for n in rows if rows[n]['실제크기dB'] is not None]
out = {'초': round(T, 1), '소리': dict(sorted(rows.items(), key=lambda kv: -kv[1]['번'])), '가장큰0_4초dB': round(float(max(m)), 1), '평균dB': round(float(np.mean([v for v in m if v > -60])), 1), '깨짐표본': clip, '1초최대겹침': dense,
       '실제크기_폭dB': round(max(loud) - min(loud), 1) if loud else None, '오류': d['오류']}
print(json.dumps(out, ensure_ascii=False))
