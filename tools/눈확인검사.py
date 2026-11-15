# 관문 ⑥ 눈 확인(11-15 대표님 「눈으로 보라고! 니가 만드는 거」 → 13:32 「계속 고정한다 해 놓고 놓치니」 → 말 대신 장치로 고정)
# 사용: python3 눈확인검사.py 게임폴더 [눈확인.md]
# 통과 조건(셋 다): ① /home/claude/rec/눈/ 의 가장 새 사진이 게임 코드(html · js)의 가장 새 수정보다 뒤에 찍힘
#                    ② 눈확인.md 에 그 사진 이름 줄 「- 눈_이름.jpg: …」이 있음
#                    ③ 그 줄의 「본 것」이 한글 15자 넘음(「확인함」 같은 빈말 막기)
import sys, os, glob, re
d = sys.argv[1]; note = sys.argv[2] if len(sys.argv) > 2 else '/home/claude/rec/눈확인.md'
code = [p for p in glob.glob(os.path.join(d, '*.html')) + glob.glob(os.path.join(d, '*.js')) + glob.glob(os.path.join(d, 'js', '*.js'))]
newest = max(os.path.getmtime(p) for p in code)
shots = sorted(glob.glob('/home/claude/rec/눈/눈_*.jpg'), key=os.path.getmtime)
if not shots: print('  ✗ 눈 확인 사진이 없음 → node 눈찍기.js 폴더'); sys.exit(1)
last = shots[-1]; nm = os.path.basename(last)
if os.path.getmtime(last) < newest: print(f'  ✗ 마지막 사진({nm})이 코드를 고치기 전에 찍힘 → 고친 뒤 다시 찍고 보기'); sys.exit(1)
txt = open(note, encoding='utf-8').read() if os.path.exists(note) else ''
m = re.search(r'^- ' + re.escape(nm) + r'\s*:\s*(.+)$', txt, re.M)
if not m: print(f'  ✗ 눈확인.md에 「- {nm}: 본 것」 줄이 없음 → 사진을 열어 보고 적기'); sys.exit(1)
ko = len(re.findall(r'[가-힣]', m.group(1)))
if ko <= 15: print(f'  ✗ 「본 것」이 너무 짧음(한글 {ko}자) → 사진에서 실제로 본 것 · 이상한 곳을 적기'); sys.exit(1)
print(f'  눈 확인 통과: {nm} · 본 것 한글 {ko}자'); sys.exit(0)
