# python3 tools/소리검사.py [게임폴더] [영상이름]  — 관문 ⑮ 소리 (11-15 순서 #5, 대표님 「게임 배경음 · 업글할 때 클릭 사운드 필수」)
# 재는 것 (하나라도 틀리면 실패, 끝 코드 1):
#  ① 배경음 파일 bgm1·bgm2 있음 · 각 25초 이상 · 크기 -16±2 LUFS (옛 march는 -26.5라 거의 안 들렸음)
#  ② 강화 소리 up.mp3 있음 · 0.6초 이하 · 가장 큰 소리 -6dB 이상
#  ③ 코드: 강화 단추(buy)가 Snd.upTap을 부름 · 배경음이 두 곡을 번갈아 틈(bgmNext)
#  ④ 플레이 영상(rec/영상/영상_이름.mp4)에 소리 줄이 있고, 5초부터 끝까지 0.6초 넘게 조용한(-45dB 아래) 틈이 없음(곡이 끊기지 않음 · 30초 넘는 곳 포함)
#  ⑤ 영상 소리 기록: 배경음 켜짐 · 곡 2개 · 강화 「띵」이 이어 누를 때 3번 넘게 계속 올라감
#  ⑥ 띵이 배경음에 묻히지 않음: 띵마다 직후 0.15초의 1~5kHz 소리가 첫 띵 전 배경음(2초)보다 8dB 이상 큼(23:20 영상 소리 그림에서 묻힌 것 찾음 — 그때 +2.5dB)
import sys, os, json, subprocess, re
import numpy as np
G = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/v85'
NAME = sys.argv[2] if len(sys.argv) > 2 else None
bad, ok = [], []
def lufs(p):
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', p, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', o); return float(m[-1]) if m else -99
def dur(p): return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout or 0)
def peak(p):
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', p, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.search(r'max_volume: (-?[\d.]+)', o); return float(m.group(1)) if m else -99
for n in ['bgm1', 'bgm2']:
    p = f'{G}/sfx/{n}.mp3'
    if not os.path.exists(p): bad.append(f'① {n}.mp3 없음'); continue
    d, l = dur(p), lufs(p)
    (ok if d >= 25 and -18 <= l <= -14 else bad).append(f'① {n}: {d:.1f}초 · {l:.1f} LUFS (기준 25초↑ · -18~-14)')
p = f'{G}/sfx/up.mp3'
if os.path.exists(p):
    d, pk = dur(p), peak(p); (ok if d <= 0.6 and pk >= -6 else bad).append(f'② up: {d:.2f}초 · 가장 큰 {pk:.1f}dB (기준 0.6초↓ · -6dB↑)')
else: bad.append('② up.mp3 없음')
ui, snd = open(f'{G}/js/ui.js').read(), open(f'{G}/js/sound.js').read()
(ok if "if (JB.buy(st, arg)) { Snd.upTap();" in ui else bad).append('③ 강화 단추 → Snd.upTap')
(ok if 'bgmNext(' in snd and "['bgm1', 'bgm2']" in snd and "'bgm1', 'bgm2', 'up'" in snd else bad).append('③ 배경음 두 곡 번갈아 · 불러오기 목록')
if NAME:
    v = f'/home/claude/rec/영상/영상_{NAME}.mp4'; j = v.replace('.mp4', '.소리.json')
    if not os.path.exists(v): bad.append(f'④ 영상 없음 {v}')
    else:
        has = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', v], capture_output=True, text=True).stdout.strip()
        if not has: bad.append('④ 영상에 소리 줄 없음')
        else:
            raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', v, '-ac', '1', '-ar', '8000', '-f', 'f32le', '-'], capture_output=True).stdout
            x = np.frombuffer(raw, np.float32); sr = 8000; w = sr // 10
            db = np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + w] ** 2)) + 1e-9) for i in range(0, len(x) - w, w)])
            E = len(db)
            if os.path.exists(j): E = min(E, int(json.load(open(j)).get('녹음길이', 999) * 10) - 3)   # 녹음이 끝난 뒤(창 닫는 꼬리)는 빼고 잼
            seg = db[50:E]; quiet = seg < -45; run = mx = 0
            for q in quiet: run = run + 1 if q else 0; mx = max(mx, run)
            T = E / 10
            (ok if mx * 0.1 <= 0.6 and T > 32 else bad).append(f'④ 영상 소리 {T:.0f}초 · 5초 뒤 가장 긴 조용한 틈 {mx * 0.1:.1f}초 (기준 0.6초↓ · 영상 32초↑로 곡 바뀜 포함) · 평균 {np.mean(seg):.1f}dB')
    if os.path.exists(j):
        s = json.load(open(j)); up = [r for _, r in s.get('강화띵', [])]
        best = cur = 1
        for a, b in zip(up, up[1:]): cur = cur + 1 if b > a + 1e-6 else 1; best = max(best, cur)
        (ok if s.get('배경음켜짐') and s.get('곡수') == 2 else bad).append(f"⑤ 배경음 켜짐 {s.get('배경음켜짐')} · 곡 {s.get('곡수')}개")
        (ok if best >= 3 else bad).append(f'⑤ 강화 띵 {len(up)}번 · 이어서 올라간 가장 긴 계단 {best} (기준 3↑) · 음 높이 {up[:8]}')
        if up and os.path.exists(v):
            raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', v, '-ac', '1', '-ar', '22050', '-af', 'highpass=f=1000,lowpass=f=5000', '-f', 'f32le', '-'], capture_output=True).stdout
            y = np.frombuffer(raw, np.float32); sr = 22050; d = []
            t0 = s['강화띵'][0][0]; R = np.mean(y[int((t0 - 2.0) * sr):int((t0 - 0.1) * sr)] ** 2) + 1e-12
            for t, _ in s['강화띵']:
                a = y[int(t * sr):int((t + 0.15) * sr)]
                if len(a): d.append(10 * np.log10((np.mean(a ** 2) + 1e-12) / R))
            m = min(d) if d else -99
            (ok if m >= 8 else bad).append(f'⑥ 띵이 배경음 위로 가장 작은 것 {m:+.1f}dB (기준 띵마다 +8dB↑) · 하나하나 {[round(float(x), 1) for x in d]}')
    else: bad.append('⑤ 소리 기록(.소리.json) 없음')
for m in ok: print('통과', m)
for m in bad: print('실패', m)
print('소리검사:', '통과' if not bad else '실패')
sys.exit(1 if bad else 0)
