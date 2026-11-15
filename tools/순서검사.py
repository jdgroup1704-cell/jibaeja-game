# python3 tools/순서검사.py 작업순서.md 작업기록.md → 관문 ⑧
# ① 안 끝난 줄(⬜ 🔶)이 대표님 말씀 횟수 순(많은 것 위)인가 ② 작업기록의 마지막 끝낸 일([x] 🤖 줄)에 [순서 #N]이 있고 N이 안 끝난 맨 위 번호인가(예외 표시가 있으면 통과)
import re, sys
q, j = open(sys.argv[1], encoding='utf-8').read(), open(sys.argv[2], encoding='utf-8').read()
rows = [(int(m[0]), m[1].strip(), int(m[2]), m[3].strip()) for m in re.findall(r'^\| (\d+) \| (.+?) \| .*? \| (\d+) \| (.+?) \|$', q, re.M)]
if not rows: print('  실패: 순서표에서 줄을 못 읽음'); sys.exit(1)
open_ = [r for r in rows if not r[3].startswith('✅') and not r[3].startswith('🚧')]
bad = [(a, b) for a, b in zip(open_, open_[1:]) if a[2] < b[2]]
for a, b in bad: print(f'  실패: 순서 #{a[0]}(말씀 {a[2]}번)이 #{b[0]}(말씀 {b[2]}번)보다 위에 있음 — 횟수 많은 것이 위')
top = open_[0][0] if open_ else None
done = [l for l in j.splitlines() if l.startswith('- [x] 🤖') and '[순서 #' in l]
last = done[-1] if done else ''
m = re.search(r'\[순서 #(\d+)\]', last)
ok = not bad
if not m: print('  실패: 작업기록 끝낸 일에 [순서 #N]이 없음'); ok = False
else:
    n = int(m.group(1)); ex = re.search(r'\[예외: (지금 바로|멈춤 버그)\]', last)
    above = [r for r in open_ if r[0] < n]   # N보다 위에 안 끝난 줄이 있으면 건너뛴 것(N 자신은 끝났어도 됨)
    if above and not ex: print(f'  실패: 이번 일은 순서 #{n}인데 그 위에 안 끝난 #{above[0][0]}이 있음 — 순서를 건너뜀'); ok = False
    else: print(f'  이번 일 순서 #{n}' + (f' ({ex.group(0)})' if ex else ' = 맨 위(또는 위가 다 끝남)') + f' · 안 끝난 줄 {len(open_)}개')
print('  순서 통과' if ok else '  순서 실패'); sys.exit(0 if ok else 1)
