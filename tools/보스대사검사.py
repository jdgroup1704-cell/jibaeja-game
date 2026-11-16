# python3 보스대사검사.py '<보스대사찍기.js JSON>' → 관문 ㉘(11-16 10:29 「던전 히어로 마왕 김진동 · 반성해」): 설정에 이름 칸 · 넣은 이름이 대결 카드(지배자 진동 · 마왕 로이)에 · 보스 등장 대사 · 체력 50%에 2페이지 카드 · 분노 대사
import sys, json
R = json.loads(sys.argv[1]); bad = []
if not R.get('이름칸'): bad.append('설정에 이름 칸 없음')
if R.get('대결지배자') != '지배자 진동' or R.get('대결보스') != '마왕 로이': bad.append(f"대결 카드 이름 {R.get('대결지배자')} · {R.get('대결보스')} (기준 지배자 진동 · 마왕 로이)")
L = R.get('대사') or []
if len(L) < 2: bad.append(f"보스 대사 {len(L)}번 (기준 등장 · 분노 2번↑)")
if not R.get('페이지2') or '2페이지' not in (R.get('카드') or ''): bad.append(f"2페이지 카드 {R.get('카드')}")
if R.get('오류'): bad.append('페이지 오류 ' + ' | '.join(R['오류']))
for b in bad: print('  ✗ 보스 대사 · 이름: ' + b)
if not bad: print(f"  보스 대사 · 이름 통과: 대결 카드 「{R['대결지배자']} vs {R['대결보스']}」 · 대사 {len(L)}번(「{L[0]}」) · 2페이지 카드")
sys.exit(1 if bad else 0)
