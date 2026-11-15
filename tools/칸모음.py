# 칸모음: 찍은 장면 폴더에서 구역을 잘라 격자로: python3 -I 칸모음.py 폴더 시작 끝 간격 열 x0 y0 x1 y1(0~1) 출력
import sys
from PIL import Image, ImageDraw
d, a, b, st, cols = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]); x0, y0, x1, y1 = map(float, sys.argv[6:10]); out = sys.argv[10]
ims = []
for i in range(a, b, st):
    f = Image.open(f'{d}/{i:03d}.jpg'); w, h = f.size; c = f.crop((int(w * x0), int(h * y0), int(w * x1), int(h * y1))); ImageDraw.Draw(c).text((4, 4), str(i), fill=(255, 255, 0)); ims.append(c)
cw, ch = ims[0].size; rows = (len(ims) + cols - 1) // cols; o = Image.new('RGB', (cw * cols, ch * rows))
for k, c in enumerate(ims): o.paste(c, ((k % cols) * cw, (k // cols) * ch))
o.save(out, quality=82); print(o.size)
