# python3 망자검사.py '<망자재기.js JSON>' → 관문 ㉖(순서 #15 · 11-16 11:40 다시 만듦): 40초 싸움에서 쓰러진 적이 보랏빛 망자로 솟아 군단에 녹아든 것 3번↑ · 화면에 동시 6 이하 · 새 그림체로만(옛 0) · 2초 넘게 남은 것 0
import sys, json
R = json.loads(sys.argv[1]); bad = []
if R.get('일어남', 0) < 3: bad.append(f"일어난 망자 {R.get('일어남')} (기준 3↑)")
if R.get('동시최대', 99) > 6: bad.append(f"화면에 동시에 {R.get('동시최대')}마리 (기준 6 이하)")
if R.get('새그림', 0) < 60 or R.get('옛그림', 1) != 0: bad.append(f"새 그림 {R.get('새그림')}번 · 옛 초록 그림 {R.get('옛그림')}번 (기준 60↑ · 0)")
if R.get('오래된것', 0) != 0: bad.append(f"22초 지나도 남은 망자 {R.get('오래된것')}")
if R.get('오류'): bad.append('페이지 오류 ' + ' | '.join(R['오류']))
for b in bad: print('  ✗ 일어나는 망자: ' + b)
if not bad: print(f"  일어나는 망자 통과: 40초에 {R['일어남']}마리 일어남 · 동시 최대 {R['동시최대']} · 새 그림 {R['새그림']}번(옛 0) ")
sys.exit(1 if bad else 0)
