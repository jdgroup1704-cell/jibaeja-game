# python3 켜는검사.py '<켜는시간.js JSON>' → 관문 ㉓ 켜는 시간(순서 #13): 느린 휴대폰 망(빠른 3G 1.6Mbps · 150ms · CPU 4배 느림 · 글 파일 압축)에서
#   첫 글자 3초 안 · 「화면을 누르세요」 12초 안 · 누른 뒤 새 그림 싸움까지 1초 안
import sys, json
R = json.loads(sys.argv[1]); bad = []
if R.get('첫글자초') is None or R['첫글자초'] > 3: bad.append(f"첫 글자 {R.get('첫글자초')}초 (기준 3초 안)")
if R.get('누를수있음초') is None or R['누를수있음초'] > 12: bad.append(f"「누르세요」까지 {R.get('누를수있음초')}초 (기준 12초 안)")
if R.get('누른뒤기다림초') is None or R['누른뒤기다림초'] > 1: bad.append(f"누른 뒤 새 그림 싸움까지 {R.get('누른뒤기다림초')}초 (기준 1초 안)")
if R.get('오류'): bad.append('페이지 오류 ' + ' | '.join(R['오류']))
for b in bad: print('  ✗ 켜는 시간: ' + b)
if not bad: print(f"  켜는 시간 통과({R['망']}): 첫 글자 {R['첫글자초']}초 · 누르세요 {R['누를수있음초']}초 · 누른 뒤 {R['누른뒤기다림초']}초 · 싸움까지 {R['싸움까지MB']}MB")
sys.exit(1 if bad else 0)
