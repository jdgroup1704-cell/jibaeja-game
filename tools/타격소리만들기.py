# python3 타격소리만들기.py 출력.wav — 11-16 15:57 대표님 「때리는 딱딱 사운드도 좀 바꿔 줘」: 가벼운 「딱」 대신 묵직한 「쿵 + 퍽 + 찰칵」을 직접 합성(내려받기 없이)
# 낮은 쿵(120→48Hz 사인) + 몸통 퍽(180~900Hz 잡음) + 금속 찰칵(2.2~4.8kHz 아주 짧게) → 살짝 찌그러뜨려 두껍게
import sys, numpy as np, wave
sr = 44100; L = int(sr * 0.42); t = np.arange(L) / sr
rng = np.random.default_rng(7)
def bp(x, lo, hi):
    X = np.fft.rfft(x); fr = np.fft.rfftfreq(len(x), 1 / sr); X[(fr < lo) | (fr > hi)] = 0; return np.fft.irfft(X, len(x))
f = 48 + 72 * np.exp(-t * 28); thump = np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-t * 9)
n = rng.standard_normal(L)
body = bp(n, 180, 900); body = body / np.abs(body).max() * np.exp(-t * 22) * 0.7
crack = bp(n, 2200, 4800); crack = crack / np.abs(crack).max() * np.exp(-t * 90) * 0.55
y = np.tanh((thump + body + crack) * 1.6) / np.tanh(1.6); y = y / np.abs(y).max() * 0.92
k = int(sr * 0.05); y[-k:] *= np.linspace(1, 0, k)
w = wave.open(sys.argv[1], 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((y * 32767).astype(np.int16).tobytes()); w.close()
print('만듦', sys.argv[1], round(L / sr, 2), '초')
