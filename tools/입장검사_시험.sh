#!/bin/bash
# 입장 관문 ⑯ 시험: 영웅이 모두 한 자리에 서게 망가뜨린 사본은 막혀야 하고(포개짐), 그대로인 것은 통과
G=${1:-/home/claude/v85}; T=/tmp/입장시험; rm -rf $T; cp -r $G $T
python3 - "$T/js/field.js" <<'P'
import sys; p=sys.argv[1]; s=open(p).read()
a="PB = [[-100, 712], [-230, 490], [-220, 712], [-300, 600]]"; assert a in s; s=s.replace(a,"PB = [[-100, 712], [-100, 712], [-100, 712], [-100, 712]]")
a="const mi = this.list.filter((o, j) => j < i && !(this.KIND[o.id] || {}).far).length; h.tx = Math.max(h.tx, ffx - 95 - mi * 55); h.ty = [712, 600, 490, 650][mi] ?? h.ty;"
assert a in s; s=s.replace(a,""); open(p,'w').write(s)
P
r=0
B=$(cd $G/tools && timeout 120 node 입장재기.js $T 2>/dev/null | tail -1); echo "$B" | python3 -c "import json,sys; r=json.loads(sys.stdin.read()); sys.exit(0 if int(r['영웅_포개짐'][:-1])>5 else 1)" && echo "막힘 ✅ 영웅 포개짐 $(echo $B | grep -o '영웅_포개짐[^,]*')" || { echo "❌ 포개진 영웅이 안 막힘"; r=1; }
A=$(cd $G/tools && timeout 120 node 입장재기.js $G 2>/dev/null | tail -1); echo "$A" | python3 -c "import json,sys; r=json.loads(sys.stdin.read()); sys.exit(0 if int(r['영웅_포개짐'][:-1])<=5 and int(r['몰림_비율'][:-1])<=12 and not sum(r['순간이동'].values()) and not sum(r['갑자기나타남'].values()) else 1)" && echo "통과 ✅ 그대로인 것(대조군)" || { echo "❌ 대조군이 막힘 $A"; r=1; }
exit $r
