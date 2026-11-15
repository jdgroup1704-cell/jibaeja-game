# python3 효과음검사.py '<효과음재기.js 결과 JSON>' → 관문 ⑱ 효과음(순서 #8)
# 기준: ① 들리는가 — 실제로 난 소리마다 실제 크기 -40dB 이상(그보다 작으면 배경음 -28에 묻혀 안 들림: 지배자 한 발 -46.6 · 솟는 소리 -42.9가 그랬음)
#       ② 시끄럽지 않은가 — 초당 0.2번 넘게 나는 소리는 -20dB 이하 · 0.4초 창 가장 큰 소리 -8dB 이하 · 깨짐 표본 0 · 화면 오류 0
import json, sys
r = json.loads(sys.argv[1]); b = []
for n, o in r['소리'].items():
    v = o.get('실제크기dB')
    if v is None: continue
    if v < -40: b.append(f'{n} {v}dB 안 들림')
    if o['초당'] > 0.2 and v > -20: b.append(f'{n} 초당 {o["초당"]}번 · {v}dB 시끄러움')
if r['가장큰0_4초dB'] > -8: b.append(f"가장 큰 순간 {r['가장큰0_4초dB']}dB")
if r['깨짐표본']: b.append(f"깨짐 {r['깨짐표본']}")
if r.get('오류'): b.append(f"화면 오류 {r['오류']}")
print('  ✗ 효과음: ' + ' · '.join(b) if b else f"  효과음 통과: 가장 작은 {min(o['실제크기dB'] for o in r['소리'].values() if o.get('실제크기dB') is not None)}dB · 가장 큰 순간 {r['가장큰0_4초dB']}dB · 깨짐 0")
sys.exit(1 if b else 0)
