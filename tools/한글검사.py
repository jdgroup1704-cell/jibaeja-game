# 한글 표기 관문 (11-13 03:12 대표님 "표기 한글로만 고정해. 니가 영어로 텍스트 적으면 나 몰라")
# 대표님이 읽는 글에 영어 낱말이 있으면 실패(종료 코드 1)로 막는다.
#   검사 대상: ① 작업기록.md 의 글  ② 봇·계산 도구가 화면에 찍는 글(console.log / print 안의 문자열)  ③ 게임 화면 글자(언어 파일)
#   사용: python3 Tools/한글검사.py 파일1 파일2 ...
# 예외(허용 낱말): 키 이름, 모델·도구 이름, 단위. 코드(`...`), 주소(http...), 파일 경로는 검사하지 않는다.
import re, sys

ALLOW = {'CC', 'Space', 'Shift', 'Esc', 'Opus', 'Fable', 'ChatGPT', 'Claude', 'Pro', 'Starter', 'SSR', 'SR', 'R', 'N', 'CC0', 'KST', 'mp3', 'mp4', 'png', 'jpg', 'opus', 'md', 'js', 'py', 'html', 'x', 'v', 'ms', 'fps', 'OK', 'AI', 'SNS', 'PC', 'UI', 'BGM', 'Ctrl', 'B', 'A', 'C', 'BE', 'NL', 'W', 'H', 'D'}
WORD = re.compile(r"[A-Za-z][A-Za-z]+")

def strip_skippable(line):
    line = re.sub(r"`[^`]*`", " ", line)                 # 코드
    line = re.sub(r"https?://\S+", " ", line)            # 주소
    line = re.sub(r"[A-Za-z]:\\[^\s|)]*", " ", line)     # 윈도우 경로
    line = re.sub(r"(?:[\w.-]+/)+[\w.-]+", " ", line)    # 경로 a/b/c
    line = re.sub(r"\b[\w-]+\.(?:md|js|py|html|mp3|mp4|png|jpg|opus|json|txt|webm)\b", " ", line)  # 파일 이름
    return line

def texts_of(path, src):
    if path.endswith('.md'):
        out, fence = [], False
        for i, l in enumerate(src.splitlines(), 1):
            if l.strip().startswith('```'): fence = not fence; continue
            if not fence: out.append((i, l))
        return out
    # 코드 파일: 화면에 찍는 문자열만 (console.log(...), print(...), 언어 파일의 '값')
    out = []
    for i, l in enumerate(src.splitlines(), 1):
        if 'console.log' in l or re.search(r"\bprint\(", l) or path.endswith(('lang_ko.js',)):
            for s in re.findall(r"`([^`]*)`|'([^']*)'|\"([^\"]*)\"", l):
                t = next(x for x in s if x is not None and x != '') if any(s) else ''
                t = re.sub(r"\$\{[^}]*\}", " ", t)
                if t: out.append((i, t))
    return out

def check(path):
    try: src = open(path, encoding='utf-8').read()
    except Exception as e: return [(0, f'파일을 못 읽음: {e}')]
    bad = []
    for i, t in texts_of(path, src):
        for w in WORD.findall(strip_skippable(t)):
            if w not in ALLOW: bad.append((i, w, t.strip()[:60]))
    return bad

if __name__ == '__main__':
    total = 0
    for p in sys.argv[1:]:
        b = check(p)
        for x in b[:15]: print(f'  ✗ {p}:{x[0]} 영어 낱말 "{x[1]}" ← {x[2] if len(x) > 2 else ""}')
        if len(b) > 15: print(f'  … 그 밖에 {len(b) - 15}개')
        total += len(b)
    if total: print(f'🔤 한글 검사 실패: 영어 낱말 {total}개 — 한글로 바꾸기 전에는 다음 단계로 못 감'); sys.exit(1)
    print(f'🔤 한글 검사 통과: 파일 {len(sys.argv) - 1}개, 영어 낱말 0개')
