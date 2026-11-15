# python3 밸런스관문.py → 관문 ⑪ 과금 흉내 30일(씨앗 8)을 돌려 대표님 밸런스 말씀을 숫자로 확인
# 11-15 21:55 더함: 정체(21→30일 5% 못 오름)와 폭주(30일 > 7일의 3배)도 실패 — 지속성(대표님 「변수 · 지속성 · 성장」)
# 근거: 11-14 20:30 「소과금 1.3배 · 중과금 1.6배 · 고과금 2배 정도 빠르게, 무료도 같은 곳에 반드시 도착」
#       11-15 18:08 「무과금도 따라올 수는 있고, 소과금도 운이 좋아서 아주 좋은 장비를 먹을 수도 있고, 그래도 현질 메리트는 느껴야」
import re, subprocess, sys, os
out = subprocess.run(['node', os.path.join(os.path.dirname(os.path.abspath(__file__)), '과금흉내.js'), '30', '16'], capture_output=True, text=True, timeout=300).stdout
D = {}
for m in re.finditer(r'^(\d+)일 \| (.+)$', out, re.M):
    D[int(m.group(1))] = [int(x) for x in re.findall(r'(\d+)판', m.group(2))][:4]
L = {k: (int(a), int(b)) for k, a, b in re.findall(r'^(무|소|중|고)과금: .*?신화 (\d+)/(\d+)', out, re.M)}
if 30 not in D or len(L) < 4: print('  ✗ 과금 흉내 결과를 못 읽음'); sys.exit(1)
N = ['무', '소', '중', '고']; days = sorted(D); bad = []
def reach(i, target):   # i번째 사람이 target 판에 닿는 날(점 사이는 곧게 이음)
    for a, b in zip(days, days[1:]):
        if D[b][i] >= target: return a + (b - a) * (target - D[a][i]) / max(1, D[b][i] - D[a][i]) if D[a][i] < target else a
    return 99
F = D[30][0]
print('  30일 판: ' + ' · '.join(f'{N[i]} {D[30][i]}' for i in range(4)) + f' / 7일: ' + ' · '.join(f'{N[i]} {D[7][i]}' for i in range(4)))
if 21 in D and D[30][0] < D[21][0] * 1.05: bad.append(f'무과금 21일 → 30일 {D[21][0]} → {D[30][0]}판(5% 못 오름) — 정체, 오래 할 이유 없음')
if D[30][0] > D[7][0] * 3: bad.append(f'무과금 30일 {D[30][0]}판 > 7일 {D[7][0]}판의 3배 — 폭주(콘텐츠가 금방 끝남)')
if F < D[30][3] * 0.7: bad.append(f'무과금이 못 따라옴(30일 {F} < 고과금 {D[30][3]}의 70%)')
for d in (7, 30):
    for i in range(3):
        if not D[d][i] < D[d][i + 1]: bad.append(f'{d}일 {N[i + 1]}과금({D[d][i + 1]}판)이 {N[i]}과금({D[d][i]}판)보다 높지 않음 — 돈 쓴 보람 없음')
for i, x in ((1, 1.3), (2, 1.6), (3, 2.0)):
    r = reach(i, F); lim = 30 / x
    print(f'  {N[i]}과금이 무과금 30일 판({F})에 닿는 날 {r:.1f}일 (기준 {lim:.0f}일 안 = {x}배 빠르게)')
    if r > lim: bad.append(f'{N[i]}과금 {x}배 빠르지 않음({r:.1f}일 > {lim:.0f}일)')
print('  신화 장비(운): ' + ' · '.join(f'{k} {L[k][0]}/{L[k][1]}' for k in N))
if L['소'][0] < L['무'][0]: bad.append('소과금 신화 운이 무과금보다 낮음')
if L['고'][0] < L['무'][0]: bad.append(f'고과금 신화({L["고"][0]}/8)가 무과금({L["무"][0]}/8)보다 적음 — 현질 메리트 없음')
for b in bad: print('  ✗ ' + b)
print('  밸런스 통과' if not bad else '  밸런스 실패'); sys.exit(1 if bad else 0)
