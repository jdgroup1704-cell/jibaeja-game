# python3 도감검사.py '<도감재기.js JSON>' → 관문 ㉔ 망자 도감(순서 #14): 카드 16장 · 지도 그림 8장 실제로 불러짐 · 모은 5칸이 켜짐 · 받을 게 있으면 칩에 빨간 점 · 받기 2개 → 하나 받으면 마정석 +30 · 받음 표시 · 다시 못 받음
import sys, json
R = json.loads(sys.argv[1]); bad = []
if R.get('카드') != 16 or not R.get('지도그림') or R.get('불러진지도') != 8: bad.append(f"카드 {R.get('카드')}장 · 지도 그림 {R.get('불러진지도')}/8 (기준 16장 · 8/8)")
if R.get('켜짐') != 5: bad.append(f"켜진 카드 {R.get('켜짐')} (기준 모은 5칸)")
if 'dot' not in (R.get('칩') or ''): bad.append(f"받을 게 있는데 도감 칩에 빨간 점 없음({R.get('칩')})")
if R.get('받기전') != 2 or R.get('받은뒤받기') != 1 or R.get('받음') != 1: bad.append(f"받기 단추 {R.get('받기전')}→{R.get('받은뒤받기')} · 받음 {R.get('받음')} (기준 2→1 · 1)")
if R.get('마정석늘어남') != 30: bad.append(f"받은 마정석 {R.get('마정석늘어남')} (기준 30)")
if R.get('다시받기'): bad.append(f"같은 보상을 다시 받음({R.get('다시받기')})")
if R.get('오류'): bad.append('페이지 오류 ' + ' | '.join(R['오류']))
for b in bad: print('  ✗ 망자 도감: ' + b)
if not bad: print(f"  망자 도감 통과: 카드 16 · 지도 8/8 · 켜짐 5 · 빨간 점 · 받기 2→1 · 마정석 +30 · 다시 못 받음")
sys.exit(1 if bad else 0)
