# python3 영상확인검사.py 시험폴더 → 관문 ⑬ (11-15 19:56 대표님 「만들면 기능들도 전부 영상으로 해서 직접 플레이 체크 확실히」)
# 시험 폴더 코드 · 그림이 마지막으로 바뀐 뒤에 찍은 직접 플레이 영상(/home/claude/rec/영상/영상_*.mp4)이 있고, 눈확인.md에 「- 영상_이름.mp4: 본 것」(20자 이상)이 있어야 통과
import os, re, sys, glob
d = sys.argv[1]; last = max(os.path.getmtime(p) for p in glob.glob(f'{d}/js/*.js') + glob.glob(f'{d}/*.js') + glob.glob(f'{d}/index.html'))
vids = [v for v in glob.glob('/home/claude/rec/영상/영상_*.mp4') if os.path.getmtime(v) >= last - 5]
note = open('/home/claude/rec/눈확인.md', encoding='utf-8').read()
ok = [v for v in vids if re.search(r'^- ' + re.escape(os.path.basename(v)) + r': (.{20,})', note, re.M)]
if not vids: print('  ✗ 코드가 바뀐 뒤 찍은 플레이 영상 없음 — node 플레이녹화.js 시험폴더 이름'); sys.exit(1)
if not ok: print('  ✗ 영상은 있는데 눈확인.md에 본 것을 안 적음: ' + ', '.join(os.path.basename(v) for v in vids)); sys.exit(1)
errs = [v for v in ok if os.path.exists(v.replace('.mp4', '.오류.txt')) and open(v.replace('.mp4', '.오류.txt'), encoding='utf-8').read().strip()]
if errs: print('  ✗ 플레이하는 동안 게임 오류: ' + ' / '.join(open(v.replace('.mp4', '.오류.txt'), encoding='utf-8').read().strip()[:120] for v in errs)); sys.exit(1)   # 11-15 21:35 영상 찍다 「L.ui.loading is not a function」을 찾음 → 오류가 있으면 실패
print('  영상 확인 통과: ' + ', '.join(os.path.basename(v) for v in ok))
