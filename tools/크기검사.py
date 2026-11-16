# python3 크기검사.py '<크기재기.js pc JSON>' '<크기재기.js 폰 JSON>' → 관문 ㉙ 「처음 보는 사람 눈」(11-16 11:28~11:38 대표님 사진 넷 — 폰으로만 재서 PC 세로 창 문제를 못 봤음):
# 두 화면 모두 ① 지배자가 적 쪽(지팡이 구슬이 몸 오른쪽 +40↑) ② 지배자 키 ≥ 가장 큰 우리 편 × 1.25 ③ 지배자 이름표 그려짐 ④ 영웅 이름표 그려짐(15판↑에도) ⑤ 일으켜라 단추 높이 ≤ 46 ⑥ 맨 아래 우리 편 발과 단추 사이 빈 땅 ≤ 화면 12%
import sys, json
bad = []
for a in sys.argv[1:]:
    R = json.loads(a); v = R.get('화면')
    if R.get('오류'): bad.append(f"{v}: 페이지 오류 {R['오류']}")
    if R['지팡이쪽'] < 40: bad.append(f"{v}: 지배자가 적 반대쪽을 봄(지팡이 {R['지팡이쪽']})")
    if R['지배자키'] < R['우리편최대'] * 1.25: bad.append(f"{v}: 지배자 키 {R['지배자키']} < 우리 편 {R['우리편최대']}({R['누구']}) × 1.25")
    if R['이름표'] < 10: bad.append(f"{v}: 지배자 이름표 {R['이름표']}번")
    if R.get('영웅이름표', 0) < 100: bad.append(f"{v}: 영웅 이름표 {R.get('영웅이름표')}번(15판↑)")
    if R['단추높이'] > 46: bad.append(f"{v}: 일으켜라 단추 높이 {R['단추높이']} (기준 46↓)")
    if R['빈땅비율'] > 12: bad.append(f"{v}: 아래 빈 땅 {R['빈땅비율']}% (기준 12%↓)")
for b in bad: print('  ✗ 처음 보는 눈: ' + b)
if not bad: print('  처음 보는 눈 통과: ' + ' / '.join(f"{json.loads(a)['화면']} 지팡이 +{json.loads(a)['지팡이쪽']} · 키 {json.loads(a)['지배자키']} vs {json.loads(a)['우리편최대']} · 단추 {json.loads(a)['단추높이']} · 빈 땅 {json.loads(a)['빈땅비율']}%" for a in sys.argv[1:]))
sys.exit(1 if bad else 0)
