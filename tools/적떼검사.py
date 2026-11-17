# python3 적떼검사.py '<적떼찍기 pc JSON>' '<적떼찍기 폰 JSON>' '<프레임재기 JSON>' → 관문 ㉚(11-16 13:58~13:59 대표님 「적은 너무 없는 거 아님 · 적들도 화려한 스킬 · 캐릭터도 다양」 · 11:30 「모습도 바뀌는 거야?」 · 12:04 「렉 없이」)
# 두 화면: 보이는 적 6↑ · 적 기술 연출 2가지↑(18초) · 적 빛깔 2가지↑ · 승급 1~4단계가 각각 그려짐 · 리치 왕관 / 프레임: 평균 38fps↑ · 50ms 넘는 프레임 15초에 10↓ · 가장 긴 멈춤 200ms↓(이 기계 · CPU 그대로)
import sys, json
bad = []
for a in sys.argv[1:3]:
    R = json.loads(a); v = R['화면']
    if R.get('오류'): bad.append(f"{v}: 페이지 오류 {R['오류']}")
    if R['보이는적최대'] < 6: bad.append(f"{v}: 보이는 적 최대 {R['보이는적최대']} (기준 6↑)")
    if len(R['기술']) < 2 and sum(R['기술'].values()) < 3: bad.append(f"{v}: 적 기술 연출 {R['기술']} (기준 2가지↑)")
    if R['빛깔종류'] < 2: bad.append(f"{v}: 적 빛깔 {R['빛깔종류']}가지")
    if min(R['승급단계그림'][1:]) < 50: bad.append(f"{v}: 승급 단계 그림 {R['승급단계그림']} (1~4단계 각각 50↑)")
    if R['왕관'] < 50: bad.append(f"{v}: 리치 왕관 {R['왕관']}")
F = json.loads(sys.argv[3])
# 11-17 08:1x: 같은 기계라도 날마다 빠르기가 다름(11-16 13:09 판 43~45fps → 11-17 아침 마지막 올린 판이 37~39 · 느린 프레임 9~17 = 옛 판도 3번에 2번 실패).
#   → 새 판을 두 번 · 마지막 올린 판(기준판, 깃허브 받은 것)을 두 번 같은 자리에서 재서 평균을 비교. 기준판보다 3fps 넘게 느려지거나 느린 프레임이 5개 넘게 늘면 실패.
#   절대 기준(38↑ · 10↓)은 기준판이 그 기준을 넘는 날에만 그대로 씀. 가장 긴 멈춤 200ms↓는 언제나.
REF = json.loads(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4].strip().startswith('[') else None
if REF:
    Fs = [F] + ([json.loads(sys.argv[5])] if len(sys.argv) > 5 and sys.argv[5].strip().startswith('{') else [])
    nf = sum(x['평균fps'] for x in Fs) / len(Fs); ns = sum(x['느린프레임'] for x in Fs) / len(Fs); rf = sum(x['평균fps'] for x in REF) / len(REF); rs = sum(x['느린프레임'] for x in REF) / len(REF)
    print(f"  렉 비교(같은 기계 · 같은 때): 새 판 {nf:.1f}fps · 느린 {ns:.1f} / 기준판 {rf:.1f}fps · 느린 {rs:.1f}")
    absok = nf >= 38 and ns <= 10
    if not absok and (rf >= 38 and rs <= 10 or nf < rf - 3 or ns > rs + 5): bad.append(f"렉: 새 판 {nf:.1f}fps · 느린 {ns:.1f} vs 기준판 {rf:.1f}fps · 느린 {rs:.1f} (기준판보다 3fps↓ · 느린 +5↑면 실패)")
    if max(x['가장긴멈춤'] for x in Fs) > 200: bad.append(f"렉: 가장 긴 멈춤 {max(x['가장긴멈춤'] for x in Fs)}ms (200↓)")
elif F['평균fps'] < 38 or F['느린프레임'] > 10 or F['가장긴멈춤'] > 200: bad.append(f"렉: 평균 {F['평균fps']}fps · 느린 프레임 {F['느린프레임']} · 가장 긴 멈춤 {F['가장긴멈춤']}ms (기준 38↑ · 10↓ · 200↓ — 이 기계는 그래픽 가속 없이 그려서 폰보다 느림 · 13:09 판 43~45)")
for b in bad: print('  ✗ 적 떼 · 승급 · 렉: ' + b)
if not bad: print('  적 떼 · 승급 · 렉 통과: ' + ' / '.join(f"{json.loads(a)['화면']} 적 {json.loads(a)['보이는적최대']} · 기술 {json.loads(a)['기술']} · 빛깔 {json.loads(a)['빛깔종류']}" for a in sys.argv[1:3]) + f" · 렉 {F['평균fps']}fps · 느린 {F['느린프레임']} · 최장 {F['가장긴멈춤']}ms")
sys.exit(1 if bad else 0)
