# 한글 관문 시험: 일부러 틀린 글은 막히고, 맞는 글은 통과하는지. 관문을 고칠 때마다 다시 돌림.
import subprocess, sys, os, tempfile
here = os.path.dirname(os.path.abspath(__file__)); gate = os.path.join(here, '한글검사.py')
cases = [
  ('틀림: 작업기록에 영어', '작업기록.md', '- 시험 결과 firstBoss 1:06\n', 1, 'firstBoss'),
  ('틀림: 봇 출력에 영어', 'bot.js', "console.log(`army ${n}`);\n", 1, 'army'),
  ('맞음: 한글 + 허용 낱말·코드·경로', '작업기록.md', '- 첫 거인 1:06 · `game/logic.js` · Opus 5.5 · Space 키 · https://claude.ai/x\n', 0, None),
  ('맞음: 봇 출력 한글', 'bot.js', "console.log(`군단 ${n}`);\n", 0, None),
]
ok = True
for name, fn, body, want, word in cases:
    d = tempfile.mkdtemp(); f = os.path.join(d, fn); open(f, 'w', encoding='utf-8').write(body)
    r = subprocess.run([sys.executable, gate, f], capture_output=True, text=True)
    good = r.returncode == want and (word is None or word in r.stdout)
    ok &= good
    print(('✓' if good else '✗'), name, '→ 종료코드', r.returncode, ('(막힌 낱말 확인: ' + word + ')') if word and good else '')
print('시험 통과' if ok else '시험 실패'); sys.exit(0 if ok else 1)
