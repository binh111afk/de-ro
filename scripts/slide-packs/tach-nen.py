"""Tách nền MỘT MÀU (ảnh từ công cụ không xuất được nền trong suốt) thành trong suốt, ghi đè thành PNG.

python scripts/slide-packs/tach-nen.py file.png ...
Bản gốc giữ ở <tên>.nen.jpg; file đã có bản gốc thì bỏ qua. Nền nên là màu không có trong hình (vd hồng cánh sen).
"""
import sys
from pathlib import Path
from PIL import Image

for f in sys.argv[1:]:
    p = Path(f)
    keep = p.with_suffix('.nen.jpg')
    if keep.exists():
        continue
    im = Image.open(p).convert('RGB')
    w, h = im.size
    key = tuple(sorted(c)[1] for c in zip(*(im.getpixel(xy) for xy in ((3, 3), (w - 4, 3), (3, h - 4)))))
    im.save(keep, quality=95)
    out = []
    for px in im.getdata():
        d = max(abs(px[i] - key[i]) for i in range(3))
        a = max(0.0, min(1.0, (d - 40) / 90))
        if a <= 0:
            out.append((0, 0, 0, 0))
        elif a >= 1:
            out.append((*px, 255))
        else:  # viền: trừ phần màu nền đã pha vào
            out.append((*(max(0, min(255, round((px[i] - (1 - a) * key[i]) / a))) for i in range(3)), round(a * 255)))
    res = Image.new('RGBA', (w, h))
    res.putdata(out)
    res.save(p)
    print(p.name, key, res.getbbox())
