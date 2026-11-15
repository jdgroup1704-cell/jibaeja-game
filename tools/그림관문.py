# python3 그림관문.py 게임폴더 → 관문 ⑳ 그림 기준(순서 #10 · 01:40 대표님 결정 「시안 1번: 2등신 귀여운 + 어두운 보랏빛」)
# 그림기준표.json의 「대상」(전투에 실제로 그려지는 그림 — 쓰는그림.js로 잰 것) 하나하나를 실제 파일에서 잼:
#  ㉠ 새그림 기록: 시안 1번을 드리미나 참고 그림으로 넣고 만든 원본 이름이 적혀 있어야 함(글로만 시킨 그림 · 옛 그림은 실패)
#  ㉡ 테두리 ≥ 기준(굵고 어두운 선) ㉢ 우리 편 보랏빛 ≥ 기준 · 적 보랏빛 ≤ 기준(한눈에 편이 갈림)
# 머리 크기(2등신)는 기계로 못 잼(망토 · 책 · 무기 때문에 값이 틀림) → 나란히 사진으로 사람 판단(확인 전)
import sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from 그림기준 import measure, frame

def run(game):
    T = json.load(open(os.path.join(game, 'tools', '그림기준표.json'), encoding='utf-8'))
    K = T['기준']; ok = 0; bad = []
    for d in T['대상']:
        f = os.path.join(game, d['파일']); arg = f + (':%s:%s' % tuple(d['칸']) if d.get('칸') else '')
        why = []
        if not d.get('새그림'): why.append('옛 그림(시안 참고로 다시 안 그림)')
        if not os.path.exists(f): why.append('파일 없음')
        else:
            m = measure(frame(arg))
            if m is None: why.append('그림 비어 있음')
            else:
                tk = d.get('테두리기준', K['테두리'])
                if m['테두리'] < tk: why.append('테두리 %.2f<%.2f' % (m['테두리'], tk))
                if d['편'] == '우리' and m['보랏빛'] < K['우리보라']: why.append('보랏빛 %.2f<%.2f' % (m['보랏빛'], K['우리보라']))
                if d['편'] == '적' and m['보랏빛'] > K['적보라']: why.append('적인데 보랏빛 %.2f>%.2f' % (m['보랏빛'], K['적보라']))
        if why: bad.append(d['이름'] + ': ' + ' · '.join(why))
        else: ok += 1
    n = len(T['대상'])
    print('관문⑳ 그림 기준: %d/%d 통과' % (ok, n))
    for b in bad[:30]: print('  ✗ ' + b)
    return ok == n

if __name__ == '__main__':
    sys.exit(0 if run(sys.argv[1]) else 1)
