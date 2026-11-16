# python3 개발일지만들기.py 원본.mp4 출력.mp4 — 「지배자 키우기 · 개발 1일차」 세로 쇼츠(1080×1920 · 30fps · 60초 안팎)
# 실제 플레이 녹화(폰 360×592 화면 · 720×1184)에서 장면을 잘라, 전장 부분만 크게(1080 폭) 가운데 · 위 제목 · 아래 자막
import subprocess, sys, os
SRC, OUT = sys.argv[1], sys.argv[2]
W, H = 1080, 1920
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'
TMP = '/home/claude/vid/tmp'; os.makedirs(TMP, exist_ok=True)
ENC = ['-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2']
# (원본 시작초, 길이, 큰 제목, 자막) — 원본은 0~81초 실제 플레이(1-1 → 3-10 → 보스 → 피의 늪 → 2-2 → 자랑)
SC = [   # 원본: 영상_개발1일차.mp4(11-16 19:3x · 판 19:12 · 시간 글자 없음)
  (0.5, 3.5, '천 년의 잠', '죽은 자를 일으키는 지배자가 깨어난다'),
  (3.0, 7.0, '일으켜라', '누를 때마다 망자병이 땅에서 솟아요'),
  (12.0, 6.5, '군단이 커진다', '소환수 넷 · 영웅이 하나둘 합류'),
  (24.0, 10.0, '밀고 밀리는 싸움', '적 떼의 화살비 · 방패 치기를 버티고 밀어붙여요'),
  (45.5, 10.5, '지역의 주인', 'VS 등장 → 2페이지 분노 → 격파!'),
  (59.0, 5.0, '망자 거인', '쓰러진 거인도 내 편으로 일어나요'),
  (73.5, 4.3, '내 군단 자랑', '키운 군단을 사진 한 장으로'),
]
def esc(t): return t.replace(':', '\\:').replace("'", "’")
def dt(text, size, y, col='white', border=6, bcol='0x2a0b52'):
    return f"drawtext=fontfile={FONT}:text='{esc(text)}':fontsize={size}:fontcolor={col}:borderw={border}:bordercolor={bcol}:x=(w-text_w)/2:y={y}"
BG = "color=c=0x12081f:s=1080x1920:r=30"
files = []
GW, GH, GX, GY = 958, 1592, 61, 328   # 게임 화면 전체 · 위 띠 0~320은 글자
SRC_CROP = (0, 0, 712, 1184)           # 원본 오른쪽 끝 8px = 브라우저 스크롤 줄만 뺌(게임 화면은 다 들어감)
# 🔒 영상 틀 관문(11-16 19:26 대표님 「게임 화면이 너무 안 보이고 · 업글 화면도 안 보이고 · 다 짤려 보이고 · 개발 2화부터 참고」)
#   (19:39 「렉도 있고」) 원본은 매끈녹화.js(시간 멈춤 · 1/30초씩 한 장) 것만 · 게임 화면 높이 1500px↑(화면의 78%↑) · 원본에서 잘라 내는 것 세로 0 · 가로 2%↓ · 녹화 시간 글자 없는 원본(NOTS=1 녹화)만
_w, _h = 720, 1184
_cut_v = 1 - (SRC_CROP[3] - SRC_CROP[1]) / _h; _cut_h = 1 - (SRC_CROP[2] - SRC_CROP[0]) / _w
print(f'  잰 값: 게임 화면 높이 {GH}px({GH / H:.0%}) · 원본 세로 잘림 {_cut_v:.0%} · 가로 잘림 {_cut_h:.1%}')
if GH < 1500 or _cut_v > 0 or _cut_h > 0.02: sys.exit('  ✗ 영상 틀 막힘: 게임 화면이 작거나 잘림 — 강화 화면 · 아래 탭까지 다 보여야 함')
if not os.path.exists(SRC + '.smooth'): sys.exit('  ✗ 영상 틀 막힘: 실시간 녹화 원본(서버가 느리면 끊김 · 11-16 19:39 「렉도 있고」) — node 매끈녹화.js 폴더 이름 으로 1/30초씩 찍을 것')
def card(name, big, small, dur, idx):
    f = f'{TMP}/c{idx}.mp4'
    vf = f"{dt('지배자 키우기', 64, 640, '0xffd76a', 8, '0x3a1200')},{dt(big, 120, 760, 'white', 10)},{dt(small, 48, 960, '0xd8c8ff', 6)},fade=t=in:st=0:d=0.4,fade=t=out:st={dur - 0.4}:d=0.4"
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', f'{BG}:d={dur}', '-f', 'lavfi', '-i', f'anullsrc=r=44100:cl=stereo', '-t', str(dur), '-vf', vf, *ENC, '-shortest', f + '.part.mp4'], check=True)
    os.replace(f + '.part.mp4', f); files.append(f)
card('t', '개발 1일차', '오늘 하루 만든 것 · 실제 플레이 화면', 3.0, 0)
for i, (ss, d, big, sub) in enumerate(SC, 1):
    f = f'{TMP}/s{i}.mp4'
    # 11-16 19:26 대표님 「게임 화면이 너무 안 보이고 · 업글 화면도 안 보이고 · 다 짤려 보이고」 → 원본 폰 화면 720×1184를 하나도 안 자르고 968×1592로(위 자원 띠 ~ 강화 카드 ~ 아래 탭 전부)
    # 제목 · 자막은 위 띠(0~320)에만 — 게임을 가리지 않음
    vf = (f"[0:v]crop={SRC_CROP[2] - SRC_CROP[0]}:{SRC_CROP[3] - SRC_CROP[1]}:{SRC_CROP[0]}:{SRC_CROP[1]},scale={GW}:{GH},setsar=1[g];[1:v][g]overlay={GX}:{GY}[o];"
          f"[o]{dt('개발 1일차 · ' + str(i) + '/7', 44, 34, '0xffd76a', 5, '0x3a1200')},{dt(big, 92, 92, 'white', 8)},{dt(sub, 42, 222, '0xe8dcff', 5)},"
          f"drawbox=x=0:y={GY - 8}:w=1080:h=4:color=0x8a3cff@0.9:t=fill,fade=t=in:st=0:d=0.25,fade=t=out:st={d - 0.25}:d=0.25[v]")
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(ss), '-t', str(d), '-i', SRC, '-f', 'lavfi', '-t', str(d), '-i', BG, '-filter_complex', vf,
                    '-map', '[v]', '-map', '0:a', '-af', f'afade=t=in:st=0:d=0.2,afade=t=out:st={d - 0.25}:d=0.25', *ENC, f + '.part.mp4'], check=True)
    os.replace(f + '.part.mp4', f); files.append(f)
card('e', '내일도 계속', '오늘 관문 33가지를 세워 하나씩 통과 중', 4.0, 9)
lst = f'{TMP}/list.txt'; open(lst, 'w').write(''.join(f"file '{x}'\n" for x in files))
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', OUT + '.part.mp4'], check=True)
os.replace(OUT + '.part.mp4', OUT); print('만듦', OUT)
