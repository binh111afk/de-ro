"""Nén hình của bộ phong cách slide: bảng 256 màu RGBA (k-means), khuếch tán sai số nhẹ.

Chạy: python scripts/slide-packs/nen.py <vào.png> <ra.png> <cạnh dài tối đa px, khoảng 1,5 lần cỡ trên slide 1280>
Viền trong suốt thừa được cắt. Cần Pillow và numpy. Quầng nền gần trong suốt (alpha < 14) được xoá.
"""
import sys, numpy as np
from PIL import Image

def palette(px, k=256, seed=0):
    rng = np.random.default_rng(seed)
    sample = px[rng.choice(len(px), min(len(px), 60000), replace=False)]
    cent = sample[rng.choice(len(sample), k, replace=False)].copy()
    for _ in range(14):
        d = (sample**2).sum(1)[:, None] - 2 * sample @ cent.T + (cent**2).sum(1)[None]
        lab = d.argmin(1)
        for i in range(k):
            m = lab == i
            cent[i] = sample[m].mean(0) if m.any() else sample[rng.integers(len(sample))]
    return cent

def compress(im, out, dither=0.6):
    a = np.array(im.convert('RGBA'), np.float32)
    a[a[..., 3] < 14] = 0
    h, w, _ = a.shape
    def pre(x):  # nhân màu với alpha để pixel trong suốt không chiếm màu
        y = x.copy(); y[..., :3] *= y[..., 3:4] / 255; return y
    p = pre(a).reshape(-1, 4)
    cent = palette(p)
    cent[0] = 0
    cn = (cent**2).sum(1)
    # bảng tra theo ô 5 bit/kênh để khuếch tán sai số đủ nhanh
    cache = {}
    def near(v):
        key = (int(v[0]) >> 2, int(v[1]) >> 2, int(v[2]) >> 2, int(v[3]) >> 2)
        i = cache.get(key)
        if i is None:
            i = cache[key] = int((cn - 2 * cent @ v).argmin())
        return i
    work = pre(a)
    idx = np.zeros((h, w), np.uint8)
    for y in range(h):
        for x in range(w):
            v = np.clip(work[y, x], 0, 255)
            if v[3] < 1.5:
                continue
            i = near(v)
            idx[y, x] = i
            err = (v - cent[i]) * dither
            if x + 1 < w: work[y, x + 1] += err * (7 / 16)
            if y + 1 < h:
                if x: work[y + 1, x - 1] += err * (3 / 16)
                work[y + 1, x] += err * (5 / 16)
                if x + 1 < w: work[y + 1, x + 1] += err * (1 / 16)
    alpha = np.clip(cent[:, 3], 0, 255)
    rgb = np.where(alpha[:, None] > 0, cent[:, :3] * 255 / np.maximum(alpha[:, None], 1e-3), 0)
    q = Image.fromarray(idx, 'P')
    q.putpalette(np.clip(rgb + 0.5, 0, 255).astype(np.uint8).tobytes())
    q.save(out, optimize=True, transparency=bytes((alpha + 0.5).astype(np.uint8)))

if __name__ == '__main__':
    src, out, side = sys.argv[1], sys.argv[2], int(sys.argv[3])
    im = Image.open(src).convert('RGBA')
    box = im.getchannel('A').point(lambda v: 255 if v >= 14 else 0).getbbox()
    im = im.crop(box)
    k = side / max(im.size)
    if k < 1:
        im = im.convert('RGBa').resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).convert('RGBA')
    compress(im, out)
