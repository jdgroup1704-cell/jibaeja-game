# python3 장부검사.py ../지적장부.md → 관문 ⑩ (11-15 19:40 대표님 「말 아닌 확실하게 할 수밖에 없게끔 강제해」)
# 장부 한 줄마다 「확인」 칸에 자동으로 재는 것(관문 번호 또는 도구 파일 이름)이 있어야 함. 「눈」만 있으면 실패. 정말 못 재는 건 [못 잼: 이유]를 적어야 함.
# ✅ 줄은 [못 잼]이면 안 됨(못 재는데 됐다고 할 수 없음).
import re, sys
s = open(sys.argv[1], encoding='utf-8').read(); bad = []; mot = 0; n = 0
for m in re.finditer(r'^\| ([A-Z]\d+) \| (.+?) \| (.+?) \| (.+?) \|$', s, re.M):
    k, said, chk, stt = m.groups(); n += 1
    auto = re.search(r'관문[①-⑳]|[\w가-힣]+\.(js|py|sh)', chk); nm = '[못 잼' in chk
    if nm: mot += 1
    if not auto and not nm: bad.append(f'{k} 확인 「{chk.strip()}」 — 자동으로 재는 것 없음')
    if stt.strip().startswith('✅') and nm and not auto: bad.append(f'{k} ✅인데 [못 잼] — 못 재는데 됐다고 함')
for b in bad: print('  ✗ ' + b)
print(f'  장부 {n}줄 · 자동 확인 {n - mot}줄 · 못 잼 {mot}줄 · 문제 {len(bad)}개'); sys.exit(1 if bad or n == 0 else 0)
