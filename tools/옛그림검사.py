# python3 옛그림검사.py '<옛그림재기.js JSON>' → 관문 ㉗(11-16 09:15): 처음 · 3-10 · 후반 저장(귀빈 8 · 2막 · 영웅 8 · 보스 대마법) 플레이에서 옛 그림체 그림 파일이 그려진 횟수 합 10번 이하
# 옛 그림 = 그림체 바꾸기(#10) 전 그림: 옛 지배자(lord · lord_* · ld*) · 옛 영웅(heroF_) · 옛 기사(kn_* · knight · kv2 · kw2 · foeA*) · 옛 해골(skel · sk4/5 · sv2 · sw2 · sumA*) · 옛 거인(giant · gi_* · gv2) · d2_ · d4_ · evo*
import sys, json, re
R = json.loads(sys.argv[1]); OLD = re.compile(r'^(lord(_[a-z0-9]+)?|ld\d.*|heroF_.*|kn_.*|kn5_.*|knight|kv2_.*|kw2_.*|foeA\d|foe_[a-z]+|skel|sk[345]_.*|sv2_.*|sw2_.*|sumA\d|giant|gi_.*|gv2_.*|d2_.*|d4_.*|evo\d)\.(webp|png|jpg)$')
old = [(n, c) for n, c in R.get('그림', []) if OLD.match(n)]; tot = sum(c for _, c in old)
bad = []
if tot > 10: bad.append(f"옛 그림 {tot}번: " + ' · '.join(f'{n} {c}' for n, c in sorted(old, key=lambda x: -x[1])[:8]))
if R.get('오류'): bad.append('페이지 오류 ' + ' | '.join(R['오류'][:2]))
for b in bad: print('  ✗ 옛 그림: ' + b)
if not bad: print(f"  옛 그림 통과: 처음 · 3-10 · 후반(귀빈 8 · 2막) 플레이에서 옛 그림 {tot}번(기준 10 이하) · 그린 그림 {R.get('그림수')}가지")
sys.exit(1 if bad else 0)
