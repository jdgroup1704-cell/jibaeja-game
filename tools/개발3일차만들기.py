# python3 개발3일차만들기.py 원본.mp4 목소리.mp3 출력.mp4 — 「지배자 키우기 · 개발 3일차」 세로 쇼츠(1080×1920 · 30fps · 50초 아래)
# 11-17 17:43 대표님 고정: 재미있는 컨셉 + 고충을 일레븐랩스 목소리로 · 60초 미만 · 점점 바뀌며 만드는 모습 + 「짜증나 · 잘 안 된다」 현실 고충도 목소리로
# 컨셉: 해골 지배자가 직접 「개발자가 날 매일 뜯어고친다」고 투덜대며 오늘 바뀐 것을 소개(목소리 Midnight Cave · Eleven v4 · 감정 태그)
# 틀은 2일차와 같음: 게임 화면 958×1592(61, 328) 하나도 안 자름 · 제목 · 자막은 위 띠(0~320)에만
import subprocess, sys, os
SRC, VOICE, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
W, H = 1080, 1920
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'
TMP = '/home/claude/vid/tmp3'; os.makedirs(TMP, exist_ok=True)
VENC = ['-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', '30']
GW, GH, GX, GY = 958, 1592, 61, 328
SRC_CROP = (0, 0, 712, 1184)
V0 = 1.95   # 목소리 앞 빈 소리
# (장면 길이, 원본 시작초 또는 그림, 속도, 큰 제목, 자막) — 길이는 목소리 줄 사이 침묵에 맞춤(silencedetect 잰 값)
SC = [
  (4.15, 8.45, 1.0, '천 년 만에 깨어났더니', '개발자가 날 매일 뜯어고친다'),
  (6.50, 8.60, 0.5, '보라 빛의 벽 + 해골 손', '무리 끝에 남은 놈들은 땅에서 붙잡는다'),
  (4.90, 24.6, 1.0, '또 박혔다…', '칼 해골이 세라핀 몸속으로 · 고쳤다 → 또 박혔다'),
  (3.90, 21.0, 1.0, '아 진짜 짜증나', '겹침 26% → 고치고 또 재서 0%'),
  (5.20, 29.0, 0.62, '「띵」이 안 들린다고?', '범인은… 내가 넣은 「쿵」 소리였다'),
  (4.70, '/tmp/전_780.png', 1.0, '오늘 대표님한테 혼났다', '「아래 버튼 너무 작은 거 아니냐」'),
  (3.10, '/tmp/후_780.png', 1.0, '…그래서 키웠다', '큰 폰 강화 카드 67 → 129px'),
  (4.40, 36.4, 1.0, '로봇이 대신 플레이', '「결과만」 누르면 하루가 15초'),
  (3.00, 41.4, 1.0, '…나보다 강화를 잘한다', '로봇 · 자동 시범(내 기록은 그대로)'),
  (4.75, 9.0, 0.5, '지배자 키우기 · 개발 3일차', '내일은 또 뭐가 박힐까'),
]
def esc(t): return t.replace(':', '\\:').replace("'", "’").replace(',', '\\,')
def dt(text, size, y, col='white', border=6, bcol='0x2a0b52'):
    return f"drawtext=fontfile={FONT}:text='{esc(text)}':fontsize={size}:fontcolor={col}:borderw={border}:bordercolor={bcol}:x=(w-text_w)/2:y={y}:expansion=none"
BG = "color=c=0x12081f:s=1080x1920:r=30"
_cut_v = 0; _cut_h = 1 - (SRC_CROP[2] - SRC_CROP[0]) / 720
print(f'  잰 값: 게임 화면 높이 {GH}px({GH / H:.0%}) · 원본 세로 잘림 {_cut_v:.0%} · 가로 잘림 {_cut_h:.1%}')
if GH < 1500 or _cut_h > 0.02: sys.exit('  ✗ 영상 틀 막힘')
if not os.path.exists(SRC + '.smooth'): sys.exit('  ✗ 영상 틀 막힘: 매끈 녹화 원본만')
total = sum(s[0] for s in SC)
if total + 2.0 >= 60: sys.exit(f'  ✗ 60초 넘음 {total + 2:.1f}')
files = []
for i, (d, src, sp, big, sub) in enumerate(SC, 1):
    f = f'{TMP}/s{i}.mp4'
    head = f"{dt('개발 3일차 · ' + str(i) + '/' + str(len(SC)), 44, 34, '0xffd76a', 5, '0x3a1200')},{dt(big, 88 if len(big) < 12 else 76, 92, 'white', 8)},{dt(sub, 42 if len(sub) < 22 else 36, 222, '0xe8dcff', 5)},drawbox=x=0:y={GY - 8}:w=1080:h=4:color=0x8a3cff@0.9:t=fill"
    if isinstance(src, str):   # 전 · 후 정지 화면(360×780 폰 — 세로가 길어 높이 1592에 맞추고 가운데)
        sw = round(GH * 720 / 1560 / 2) * 2
        vf = f"[0:v]scale={sw}:{GH},setsar=1,zoompan=z='1+0.0008*on':d=1:s={sw}x{GH}:fps=30[g];[1:v][g]overlay={(W - sw) // 2}:{GY}[o];[o]{head},fade=t=in:st=0:d=0.15[v]"
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-loop', '1', '-t', str(d), '-i', src, '-f', 'lavfi', '-t', str(d), '-i', BG, '-filter_complex', vf, '-map', '[v]', '-t', str(d), *VENC, f], check=True)
    else:
        n = d * sp
        vf = (f"[0:v]crop={SRC_CROP[2]}:{SRC_CROP[3]}:0:0,scale={GW}:{GH},setsar=1,setpts=PTS/{sp}[g];[1:v][g]overlay={GX}:{GY}:shortest=1[o];[o]{head}{'' if i == 1 else ',fade=t=in:st=0:d=0.15'}[v]")
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(src), '-t', str(n + 0.1), '-i', SRC, '-f', 'lavfi', '-t', str(d), '-i', BG, '-filter_complex', vf, '-map', '[v]', '-t', str(d), *VENC, f], check=True)
    files.append(f)
# 끝 카드 2초
f = f'{TMP}/e.mp4'
vf = f"{dt('지배자 키우기', 64, 640, '0xffd76a', 8, '0x3a1200')},{dt('내일도 투덜대며 계속', 96, 770, 'white', 10)},{dt('죽은 자의 군단 · 방치형 RPG 개발 일지', 44, 960, '0xd8c8ff', 6)},fade=t=in:st=0:d=0.3"
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', f'{BG}:d=2', '-vf', vf, '-t', '2', *VENC, f], check=True); files.append(f)
lst = f'{TMP}/list.txt'; open(lst, 'w').write(''.join(f"file '{x}'\n" for x in files))
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', f'{TMP}/v.mp4'], check=True)
T = total + 2.0
# 소리: 목소리(앞 빈 소리 뺌 · -14 LUFS) + 배경음 bgm1(목소리 아래 -12dB 쯤 · 말할 때 더 낮춤) · 끝 카드는 배경음만
BGM = '/home/claude/v85/sfx/bgm1.mp3'
af = (f"[1:a]atrim=start={V0},asetpts=PTS-STARTPTS,loudnorm=I=-14:TP=-1.5,apad=whole_dur={T}[vo];"
      f"[2:a]aloop=loop=-1:size=2e9,atrim=0:{T},volume=0.16,afade=t=out:st={T - 1.2}:d=1.2[bg];"
      f"[bg][vo]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=300[bgd];[bgd][vo]amix=inputs=2:duration=first:normalize=0[a]")
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f'{TMP}/v.mp4', '-i', VOICE, '-i', BGM, '-filter_complex', af.replace('[bgd][vo]amix', '[bgd][vo2]amix').replace('[bg][vo]side', '[bg][vo1]side').replace(f',apad=whole_dur={T}[vo];', f',apad=whole_dur={T},asplit=2[vo1][vo2];'),
                '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-ac', '2', '-t', str(T), OUT], check=True)
print('만듦', OUT, f'{T:.1f}초')
