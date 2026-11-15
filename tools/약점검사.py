# python3 약점검사.py '<약점재기.js JSON>' → 관문 ㉒ 약점 끊기: 보스전에서 약점이 뜨고(2번↑) · 누르면 체력 4%↑ 깎이고 보스 시간 늘고(1.5초↑ — 0.25초 흐른 것 감안) 그 기술은 안 터지고 · 안 누르면 기술이 터짐
import sys, json
R = json.loads(sys.argv[1]); bad = []
if R.get('약점뜸', 0) < 2: bad.append(f"약점 {R.get('약점뜸')}번 뜸 (기준 2↑)")
if R.get('눌러서끊음', 0) < 1: bad.append('눌러도 끊기지 않음')
if (R.get('체력깎인퍼센트') or 0) < 4: bad.append(f"누른 뒤 보스 체력 {R.get('체력깎인퍼센트')}% 깎임 (기준 4%↑)")
if (R.get('시간더함') or 0) < 1.5: bad.append(f"누른 뒤 보스 시간 {R.get('시간더함')}초 늘어남 (기준 1.5↑)")
if R.get('끊은뒤기술') not in (0,): bad.append(f"끊었는데 기술이 {R.get('끊은뒤기술')}번 터짐 (기준 0)")
if R.get('그냥둠', 0) < 1 or R.get('기술총', 0) < 1: bad.append(f"안 눌렀는데 기술이 안 터짐(그냥 둠 {R.get('그냥둠')} · 기술 {R.get('기술총')})")
if R.get('오류'): bad.append('페이지 오류 ' + ' | '.join(R['오류']))
for b in bad: print('  ✗ 약점 끊기: ' + b)
if not bad: print(f"  약점 끊기 통과: {R['약점뜸']}번 뜸 · 누르면 체력 {R['체력깎인퍼센트']}% · 시간 +{R['시간더함']}초 · 기술 취소 · 안 누르면 기술 {R['기술총']}번")
sys.exit(1 if bad else 0)
