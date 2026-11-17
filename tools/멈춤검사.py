# 멈춤 검사 (11-12 16:32 대표님 "고정을 시키라고, 시간 아깝잖아 파트너야")
# 작업기록.md 의 '## 0-1. 🤖 혼자 할 일' 칸에서 아직 안 한 🤖 줄(- [ ] 🤖 ...)을 센다.
#   🤖 = 대표님 없이 Claude 혼자 할 수 있는 일 / 👤 = 대표님 손이 필요한 일(결정·결제·설치·키)
# 🤖 이 하나라도 남아 있으면 종료 코드 1 → 답장을 끝내지 말고 그 일을 계속한다.
# 쓰는 법: python 멈춤검사.py 작업기록.md
import re, sys
# 21:2x 대표님 「영어하지마 한글ㅡㅡ」(마지막 두 답장이 영어였음) → 답장 초안을 /tmp/답장.md에 쓰고 「--답장 /tmp/답장.md」로 같이 검사: 영어 낱말(링크 · 단위 빼고) 5개 넘으면 멈출 수 없음
if '--답장' in sys.argv:
    i = sys.argv.index('--답장'); rp = sys.argv[i + 1]; del sys.argv[i:i + 2]
    rt = re.sub(r'https?://\S+|`[^`]*`|\b(fps|ms|px|LUFS|dB|Opus|ElevenLabs|Midnight|Cave|Sujin|Bright|Energetic|Eleven|v\d+|mp3|mp4|jpg|png|md|js|py|sh)\b', ' ', open(rp, encoding='utf-8').read())
    en = re.findall(r'[A-Za-z]{3,}', rt); ko = len(re.findall(r'[가-힣]', rt))
    if len(en) > 5 or ko < 10: print(f'✗ 답장이 한글이 아님: 영어 낱말 {len(en)}개 · 한글 {ko}자 — {en[:8]}'); sys.exit(1)
    print(f'🔤 답장 한글 통과(영어 낱말 {len(en)}개 · 한글 {ko}자)')
p = sys.argv[1] if len(sys.argv) > 1 else "작업기록.md"
t = open(p, encoding="utf-8").read()
m = re.search(r"^## 0-1\..*?$(.*?)(?=^## )", t, re.S | re.M)
if not m:
    print("✗ '## 0-1. 🤖 혼자 할 일' 칸이 없음 → 멈추면 안 됨 (칸부터 만들 것)"); sys.exit(1)
body = m.group(1)
bot = [l.strip() for l in body.splitlines() if re.match(r"\s*- \[ \]\s*🤖", l)]
usr = [l.strip() for l in body.splitlines() if re.match(r"\s*- \[ \]\s*👤", l)]
done = [l for l in body.splitlines() if re.match(r"\s*- \[x\]", l, re.I)]
# 💡 제안 장부 (11-12 17:18 대표님 "아이디어 있으면 언제든 제안하라 했는데 한 번을 먼저 안 하길래") — 오늘 날짜 제안이 0개면 실패
import datetime
today = (sys.argv[2] if len(sys.argv) > 2 else datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).strftime("%m-%d"))
mp = re.search(r"^## 0-2\..*?$(.*?)(?=^## )", t, re.S | re.M)
props = [l for l in (mp.group(1).splitlines() if mp else []) if re.match(r"\s*- 💡", l) and today in l]
print(f"🛑 멈춤 검사: 혼자 할 일 {len(bot)}개 · 대표님 할 일 {len(usr)}개 · 끝낸 일 {len(done)}개")
for l in bot: print("   남음 " + l)
print(f"💡 오늘({today}) 제안 {len(props)}개")
# 🔤 한글 표기 관문 (11-13 03:12 대표님 "표기 한글로만 고정해") — 작업기록·봇 출력·게임 화면 글자에 영어 낱말이 있으면 실패
import subprocess, glob, os
_root = os.path.dirname(os.path.abspath(p))
_files = [p] + sorted(glob.glob(os.path.join(_root, 'tools', '*.js'))) + sorted(glob.glob(os.path.join(_root, 'game', 'lang_*.js')))
_h = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), '한글검사.py')] + _files, capture_output=True, text=True)
print(_h.stdout.strip().splitlines()[-1] if _h.stdout.strip() else '🔤 한글 검사 결과 없음')
if _h.returncode != 0: print(_h.stdout); print("✗ 한글로 바꾸기 전에는 멈출 수 없음"); sys.exit(1)
# 📋 기능 점검 (11-13 03:33 대표님 "너가 다 구상하고 해 주는 거 아님?") — 이번 단계에 넣기로 한 기능(🔨)이 남으면 멈출 수 없음
_fp = os.path.join(_root, '기능점검표.md')
if os.path.exists(_fp):
    _f = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), '기능점검.py'), _fp], capture_output=True, text=True)
    print(_f.stdout.strip().splitlines()[0] if _f.stdout.strip() else '📋 기능 점검 결과 없음')
    if _f.returncode != 0: print("✗ 기능점검표에 이번 단계 할 일(🔨)이 남음 — 넣거나 '나중'으로 옮기고 이유 적기"); sys.exit(1)
if not mp: print("✗ '## 0-2. 💡 Claude 제안 장부' 칸이 없음"); sys.exit(1)
if not props: print("✗ 오늘 먼저 꺼낸 제안이 없음 → 진짜 떠오른 것 1개 이상(확신/조건부/반대 + 이유) 제안하고 장부에 적기"); sys.exit(1)
if bot:
    print("✗ 멈추면 안 됨 — 위 🤖 일을 계속하세요"); sys.exit(1)
# 🔁 (11-13 04:04 대표님 "너 멈췄니?" — 03:00 "부재 시 스스로 계속, 멈추지 말고") 혼자 할 일이 0개면 멈추는 게 아니라 다음 일을 채움
# 대표님이 직접 멈추라고 하셨을 때만 작업기록에 "- 🛑 대표님 멈춤 지시 (11-13 05:00 대표님 말 그대로)" 줄을 넣고 멈출 수 있음
if re.search(r'^- 🛑 대표님 멈춤 지시 \(\d\d-\d\d \d\d:\d\d', t, re.M):   # 줄 맨 앞 + 날짜·시각이 있어야 함(설명 글에 낱말만 있으면 안 됨)
    print("✓ 대표님 멈춤 지시 있음 → 보고하고 멈춰도 됨"); sys.exit(0)
print("✗ 혼자 할 일 0개 = 멈춤 아님 → 제안 장부·보관함·점검표 ⏭️에서 다음 🤖 일을 골라 '0-1'에 적고 계속하세요"); sys.exit(1)
