# python3 거인검사.py '<거인재기.js JSON>' → 관문 ㉑: 보스를 잡으면 3초 안에 망자 거인이 일어나고(보라 거인 그림이 실제로 그려짐) · 싸움 중 솟아 내려찍고 · 자랑 단추가 반짝이고 · 카드에 보라 거인이 들어감
import sys, json
R = json.loads(sys.argv[1]); bad = []
if not R.get('보스잡음'): bad.append('보스를 못 잡음(시험 판이 안 끝남)')
if R.get('일어남까지초') is None or R['일어남까지초'] > 3: bad.append(f"보스 잡고 일어남까지 {R.get('일어남까지초')}초 (기준 3초 이하)")
if R.get('보라거인그림횟수', 0) < 60: bad.append(f"보라 거인 그림 {R.get('보라거인그림횟수')}번 그려짐 (기준 60번↑ = 1초↑)")
if R.get('내려찍음', 0) < 1: bad.append(f"싸움 중 내려찍음 {R.get('내려찍음')}번 (기준 1↑)")
if R.get('자랑단추') != 'ready': bad.append(f"자랑 단추 반짝임: {R.get('자랑단추')}")
if (R.get('카드보라퍼센트') or 0) < 8: bad.append(f"카드 거인 칸 보랏빛 {R.get('카드보라퍼센트')}% (기준 8%↑)")
if (R.get('영상KB') or 0) < 40 or not R.get('영상단추'): bad.append(f"일어나는 순간 영상 {R.get('영상KB')}KB · 자랑 창 영상 단추 {R.get('영상단추')} (기준 40KB↑ · 단추 있음)")
if (R.get('영상프레임') or 0) < 60 or R.get('영상깨짐', 1) != 0: bad.append(f"일어나는 영상 풀어 보니 장면 {R.get('영상프레임')}장 · 깨짐 {R.get('영상깨짐')}줄 (기준 60장↑ · 깨짐 0)")
if R.get('오류'): bad.append('페이지 오류 ' + ' | '.join(R['오류']))
for b in bad: print('  ✗ 망자 거인: ' + b)
if not bad: print(f"  망자 거인 통과: 잡고 {R['일어남까지초']}초 만에 일어남 · 보라 거인 {R['보라거인그림횟수']}번 그려짐 · 내려찍음 {R['내려찍음']} · 자랑 단추 반짝 · 카드 보랏빛 {R['카드보라퍼센트']}% · 일어나는 영상 {R['영상KB']}KB({R['영상종류']})")
sys.exit(1 if bad else 0)
