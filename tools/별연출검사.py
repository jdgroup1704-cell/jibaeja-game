# python3 별연출검사.py '<별연출재기.js 결과 JSON>' → 관문 ⑰ (순서 #7 「별 올릴 때 연출 · ★3 불꽃 크게」)
# 기준: ★2 · ★3 둘 다 연출 창이 뜸 · 별 칸 6 · 새 별 1 · 끝나면 결과 카드 창 · 잘린 글 0 · 「띵」이 별 수만큼 계속 올라감
#       ★3만: 불꽃(sx-fire) 있음 · 불똥 10개 이상 · 「새 힘」 글 있음 / ★2: 불꽃 없음(★3이 더 커 보여야) · 화면 오류 0
import json, sys
r = json.loads(sys.argv[1]); b = []
for n in (2, 3):
    o = r.get(f'★{n}', {})
    if not o.get('on'): b.append(f'★{n} 연출 창 안 뜸'); continue
    if o.get('slots') != 6 or o.get('nw') != 1: b.append(f"★{n} 별 칸 {o.get('slots')} · 새 별 {o.get('nw')}")
    if not o.get('modalAfter'): b.append(f'★{n} 연출 뒤 결과 카드 창 안 뜸')
    if o.get('cut'): b.append(f"★{n} 잘린 글 {o['cut']}")
    d = o.get('띵', [])
    if len(d) < n or any(q <= p for p, q in zip(d, d[1:])): b.append(f'★{n} 띵 계단 아님 {d}')
o3, o2 = r.get('★3', {}), r.get('★2', {})
if o3.get('on') and not (o3.get('fire') and o3.get('sp', 0) >= 10 and o3.get('perk')): b.append(f"★3 불꽃 {o3.get('fire')} · 불똥 {o3.get('sp')} · 새 힘 「{o3.get('perk')}」")
if o2.get('fire'): b.append('★2에도 불꽃(★3과 차이 없음)')
if r.get('오류'): b.append(f"화면 오류 {r['오류']} {r.get('오류글')}")
print('  ✗ 별 연출: ' + ' · '.join(b) if b else f"  별 연출 통과: ★3 불꽃 · 불똥 {o3.get('sp')} · 띵 {o3.get('띵')} · 「{o3.get('perk')}」")
sys.exit(1 if b else 0)
