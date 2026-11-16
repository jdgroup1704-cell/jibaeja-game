# python3 지배자검사.py '<지배자재기.js JSON>' → 관문 ㉕(11-16 08:44 「지배자 뒤돌아 때리고 · 영창 깨지고 · 화면 난리」)
# 뒤도는 공격 영상 0번 · 영창(노려보기 · 누르기 · 영창) 내내 지배자 몸이 화면 안 · 단추 위로 75%↑ · 영창 중 손가락 0 · 「대결」 카드 보스는 새 그림(bossV)
import sys, json
R = json.loads(sys.argv[1]); bad = []
if not R.get('대마법눌림'): bad.append('대마법까지 못 감')
if R.get('뒤도는공격영상', 1) != 0: bad.append(f"뒤도는 지배자 공격 영상이 {R.get('뒤도는공격영상')}번 그려짐 (기준 0)")
v = R.get('영창중지배자보임최저')
if v is None or v < 75 or R.get('잰장수', 0) < 50: bad.append(f"영창 중 지배자 몸이 보이는 비율 가장 낮을 때 {v}% ({R.get('잰장수')}장 잼 · 기준 75%↑)")
if R.get('영창중손가락', 1) != 0: bad.append(f"영창 중 손가락 {R.get('영창중손가락')}번 (기준 0)")
if R.get('대결카드보스') != 'art/bossV.webp': bad.append(f"「대결」 카드 보스 그림 {R.get('대결카드보스')} (기준 새 그림 bossV)")
if R.get('오류'): bad.append('페이지 오류 ' + ' | '.join(R['오류']))
for b in bad: print('  ✗ 지배자 · 영창: ' + b)
if not bad: print(f"  지배자 · 영창 통과: 뒤도는 공격 0 · 영창 중 지배자 보임 최저 {v}% ({R['잰장수']}장) · 손가락 0 · 대결 카드 새 보스")
sys.exit(1 if bad else 0)
