# python3 관문묶음.py 작업순서.md ⑨ 0|1 → 그 관문이 묶인 순서 줄이 ✅인데 실패(1)면 막음(끝 코드 1), 아니면 결과만 알림
import re, sys
q = open(sys.argv[1], encoding='utf-8').read(); g, fail = sys.argv[2], sys.argv[3] == '1'
rows = [(a, st) for a, b, st in [(int(m[0]), m[1], m[2].strip()) for m in re.findall(r'^\| (\d+) \| .+? \| (.+?) \| \d+ \| (.+?) \|$', q, re.M)] if g in b]
if not fail: sys.exit(0)
for n, st in rows:
    if st.startswith('✅'): print(f'  ✗ 순서 #{n}을 끝냈다(✅)고 적었는데 관문{g} 실패 — 막음'); sys.exit(1)
print(f'  ⏳ 관문{g} 실패지만 묶인 순서 ' + ', '.join(f'#{n}({st})' for n, st in rows) + ' 아직 안 끝남 — 끝났다고 적으면 막힘'); sys.exit(0)
