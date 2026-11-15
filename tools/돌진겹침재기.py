# 영웅 돌진이 소환수와 겹치는지 재기: python3 돌진겹침재기.py 폴더(/tmp/sv_이름)
# 기준: 내려앉는 자리가 소환수와 가로 70 · 세로 45 안이면 「겹침」
import json, sys
h = json.load(open(sys.argv[1] + '/hits.json'))
seen, bad, prev = [], 0, {}
for i, r in enumerate(h):
    for k, v in r.items():
        if k == 'army': continue
        was = prev.get(k, 0); prev[k] = v[2]
        if not v[2] or was: continue   # 돌진이 막 시작된 장만 한 번 셈
        seen.append(k); lx, ly = v[3]
        hit = [(c, x, y) for c, x, y in r['army'] if abs(lx - x) < 70 and abs(ly - y) < 45]
        bad += bool(hit)
        print(i, k, '→', v[3], '겹침' if hit else '깨끗', hit)
print('돌진', len(seen), '번 중 겹침', bad, '번')
