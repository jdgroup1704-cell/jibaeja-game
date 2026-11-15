# 올리기 전에 판 번호 찍기: 스크립트 주소에 ?v=시각(휴대폰이 옛 파일을 쓰지 않게) + 화면 구석에 「판 11-14 18:10」
# 사용: python3 판번호.py 폴더/index.html  (원본에 VERSTAMP · VERLABEL 자리, 결과는 같은 폴더 index.out.html)
import sys, re, datetime
p = sys.argv[1]; s = open(p).read(); now = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=9)
s = s.replace('VERSTAMP', now.strftime('%m%d%H%M%S')).replace('VERLABEL', now.strftime('%m-%d %H:%M'))
open(p.replace('index.html', 'index.out.html'), 'w').write(s); print('판', now.strftime('%m-%d %H:%M'))
