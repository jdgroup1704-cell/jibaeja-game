# python3 썸네일만들기.py 출력.jpg [N일차] — 「개발 N일차」 표지 1080×1920 (game-devlog-thumbnail 틀 규격 그대로)
# 11-16 19:09 「썸네일 너 짤린다」 · 19:16 「규격 고정틀」 · 19:19 「캐릭터 안 가리게 조심」
# 글자는 위 320 아래 금지 · 캐릭터는 소개 글 아래(775)부터 띠 위(1440)까지 → 글자와 캐릭터가 겹치지 않음 · 주인공(지배자) 맨 앞 · 나머지는 어둡게 뒤 옆
import sys, json
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
A = '/home/claude/v85/art/'
W, H = 1080, 1920
DAY = sys.argv[2] if len(sys.argv) > 2 else '1'
FB = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'
f = lambda s: ImageFont.truetype(FB, s)
bg = Image.open(A + 'bg_blood.jpg').convert('RGB'); s = H / bg.height
bg = bg.resize((int(bg.width * s), H)); x0 = (bg.width - W) // 2; im = bg.crop((x0, 0, x0 + W, H))
im = Image.blend(im, Image.new('RGB', (W, H), (40, 8, 40)), 0.35)
CHAR_TOP, CHAR_FOOT = 775, 1440
boxes = []
def put(fn, h, cx, flip=False, dark=1.0):
    a = Image.open(A + fn).convert('RGBA'); a = a.crop(a.getbbox())
    a = a.resize((int(a.width * h / a.height), h), Image.LANCZOS)
    if flip: a = a.transpose(Image.FLIP_LEFT_RIGHT)
    if dark < 1: al = a.split()[3]; a = ImageEnhance.Brightness(a.convert('RGB')).enhance(dark).convert('RGBA'); a.putalpha(al)
    x, y = cx - a.width // 2, CHAR_FOOT - h
    gl = a.split()[3].filter(ImageFilter.GaussianBlur(18)); glow = Image.new('RGBA', a.size, (170, 80, 255, 0)); glow.putalpha(gl.point(lambda v: int(v * 0.55)))
    im.paste(glow, (x, y), glow); im.paste(a, (x, y), a); boxes.append((fn, x, y, x + a.width, y + h))
put('bossV.webp', CHAR_FOOT - CHAR_TOP, 760, dark=0.78)          # 뒤 오른쪽 · 조금 어둡게
put('lordA.webp', CHAR_FOOT - CHAR_TOP, 400, flip=True)         # 주인공 맨 앞(맨 나중에 그림)
d = ImageDraw.Draw(im)
texts = []
def tx(t, size, cy, fill, stroke, sw, shadow=False, maxw=920):
    while d.textlength(t, font=f(size)) > maxw: size -= 4
    ft = f(size)
    if shadow: d.text((W / 2 + 6, cy + 8), t, font=ft, fill=(10, 0, 20), anchor='mm', stroke_width=sw, stroke_fill=(10, 0, 20))
    d.text((W / 2, cy), t, font=ft, fill=fill, anchor='mm', stroke_width=sw, stroke_fill=stroke)
    texts.append((t, d.textbbox((W / 2, cy), t, font=ft, anchor='mm', stroke_width=sw)))
tx('지배자 키우기', 104, 372, (255, 214, 77), (58, 18, 0), 9)
tx(f'개발 {DAY}일차', 250, 552, 'white', (42, 11, 82), 19, shadow=True)
tx('죽은 자를 일으키는 지배자', 66, 720, 'white', (42, 11, 82), 9)
d.rectangle((0, 1440, W, 1640), fill=(22, 8, 40)); d.rectangle((0, 1440, W, 1446), fill=(122, 77, 255))
tx('방치형 RPG · 개발 일지', 88, 1522, (255, 233, 168), (58, 18, 0), 6)
tx('실제 플레이 화면', 60, 1602, (217, 200, 255), (22, 8, 40), 4)
im.save(sys.argv[1], quality=93)
# 잰 값: 글자 상자 · 캐릭터 상자 — 썸네일검사.py가 「글자가 캐릭터를 가림」을 막는 데 씀
json.dump({'글자': [[t, *b] for t, b in texts], '캐릭터': [list(b) for b in boxes]}, open(sys.argv[1] + '.json', 'w'), ensure_ascii=False)
print({'글자맨위': min(b[1] for _, b in texts), '글자맨아래': max(b[3] for _, b in texts), '캐릭터맨위': min(b[2] for b in boxes)})
