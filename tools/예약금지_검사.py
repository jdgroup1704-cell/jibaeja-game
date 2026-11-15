# 예약 금지 검사 (11-12 15:17 대표님 "저런 예약 안 나오게 고정해")
# 기록·스킬에 'send_later를 보험으로 걸어라' 같은 문구가 다시 생기면 실패(종료 코드 1).
# 쓰는 법: python 예약금지_검사.py 파일1 파일2 ...
import re, sys
BAD = [
    r"(알람|send_later)[^\n~]{0,40}보험",          # "알람(send_later)을 보험으로 걸기"
    r"보험[^\n~]{0,10}(알람|send_later)",
    r"1순위[^\n]{0,20}send_later",
    r"다음 예약을 다시 걸어",
]
def check(path):
    t = open(path, encoding="utf-8").read()
    t = re.sub(r"~~.*?~~", "", t)            # 취소선(폐지 표시)은 무시
    hits = []
    for i, line in enumerate(t.splitlines(), 1):
        for b in BAD:
            if re.search(b, line): hits.append((i, b, line.strip()[:80]))
    return hits
bad = 0
for p in sys.argv[1:]:
    h = check(p)
    if h:
        bad += 1
        for i, b, l in h: print(f"✗ {p}:{i} 금지 문구 [{b}] → {l}")
    else: print(f"✓ {p}")
sys.exit(1 if bad else 0)
