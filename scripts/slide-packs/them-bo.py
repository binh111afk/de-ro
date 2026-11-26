"""Thêm các bộ vẽ tay (doodle) của chế độ Chuyên nghiệp. Chạy từ gốc dự án, cần Pillow và numpy.

python scripts/slide-packs/them-bo.py them <bo.json>              # khai bộ vào mã và vẽ nền giấy
python scripts/slide-packs/them-bo.py hinh <bo.json> <thư-mục-ảnh> # nén hình, tạo mảng đốm + ba hạt, ghi kích thước

<bo.json> theo mẫu scripts/slide-packs/mau-bo.json. <thư-mục-ảnh>/<key>/ chứa PNG nền trong suốt:
6 file đúng tên trong "items" và 1 file "cum" (bốn hình nhỏ rời nhau).
Xem hướng dẫn: docs/huong-dan-them-bo-slide.md
"""
import json
import subprocess
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
PUB = ROOT / 'public' / 'slide-packs'
# vai trong khung mẫu, đúng thứ tự của "items"
ROLES = ['tallA', 'tallB', 'pair', 'atom', 'long', 'mol']

sys.path.insert(0, str(HERE))
from nen import compress  # noqa: E402


class Src:
    """sửa file giữ nguyên kiểu xuống dòng"""

    def __init__(self, path):
        self.path = ROOT / path
        self.s = self.path.read_bytes()
        self.nl = b'\r\n' if b'\r\n' in self.s else b'\n'

    def enc(self, text):
        return text.encode('utf-8').replace(b'\n', self.nl)

    def before(self, anchor, text):
        a = self.enc(anchor)
        assert self.s.count(a) == 1, f'{self.path.name}: không thấy đúng một chỗ {anchor!r}'
        self.s = self.s.replace(a, self.enc(text) + a)

    def line_end(self, start, text):
        a = self.s.index(self.enc(start))
        b = self.s.index(self.nl, a)
        self.s = self.s[:b] + self.enc(text) + self.s[b:]

    def save(self):
        self.path.write_bytes(self.s)


q = lambda xs: '[' + ', '.join(f"'{x}'" for x in xs) + ']'


def theme_id(p):
    """tiền tố quyết định bộ thuộc lựa chọn nào (proThemesFor)"""
    return f"tranh-{p['key']}" if p.get('kieu') == 'tranh' else f"{p['key']}-ve-tay"


def them(packs):
    ids = ''.join(f" | '{p['key']}'" for p in packs)
    layout = Src('src/lib/slidePacks.ts')
    for p in packs:
        assert f"'{p['key']}'".encode() not in layout.s, f"bộ {p['key']} đã có"
        assert len(p['items']) == len(ROLES), f"{p['key']}: items cần đúng {len(ROLES)} tên"
    layout.line_end('export type SlidePackId', ids)
    layout.line_end('type StudyId = ', ids)
    layout.before("  'tin-hoc': { background:", ''.join(
        f"  '{p['key']}': {{ background: '{p['bg']}', fg: '{p['fg']}', ink: '{p['ink']}', accent: '{p['accent']}', "
        f"muted: '{p['muted']}', surface: '#ffffff', panel: '{p['soft']}', onAccent: '#ffffff' }},\n" for p in packs))
    entries = ''
    for p in packs:
        art = ', '.join(f"{role}: '{name}'" for role, name in zip(ROLES, p['items']))
        entries += (f"  '{p['key']}': veTay({{ cycle: {q(p['cycle'])}, soft: '{p['soft']}', softText: '{p['softText']}', "
                    f"frame: '{p['frame']}', tints: {q(p['tints'])},\n    {art} }}),\n")
    layout.before("  'tam-ly': {\n    cycle:", entries)

    docs = Src('src/store/docs.ts')
    docs.line_end("  pack?: 'co-dien'", ids)

    theme = Src('src/lib/slideTheme.ts')
    theme.before("  packTheme('tin-hoc-3d'", ''.join(
        f"  packTheme('{theme_id(p)}','{p['name']}', '{p['vibe']}', '{p['key']}',\n    {q(p['tags'])},\n"
        f"    '{p['bg']}', '{p['ink']}', '{p['accent']}', '{p['cycle'][1]}', 'Barlow Condensed', 'Nunito'),\n" for p in packs))

    paper = Src('scripts/slide-packs/giay.py')
    fn = lambda p: p['key'].replace('-', '_')
    paper.before('def tin_hoc():', ''.join(
        f"def {fn(p)}():\n    hat_giay('{p['key']}', '{p['bg']}', {q(p['dots'])}, {p['seed']})\n\n\n" for p in packs))
    paper.s = paper.s.rstrip() + paper.nl + paper.nl.join(f'{fn(p)}()'.encode() for p in packs) + paper.nl

    for f in (layout, docs, theme, paper):
        f.save()
    subprocess.run([sys.executable, str(HERE / 'giay.py')], cwd=ROOT, check=True)
    print('đã khai:', ', '.join(p['key'] for p in packs))


def mang(color):
    """mảng đốm ôm góc: đổi màu từ mảng của bộ Hoá"""
    im = Image.open(PUB / 'hoa-hoc' / 'dai-te-bao.png').convert('RGBA')
    px = list(im.getdata())
    seen = {}
    for r, g, b, a in px:
        if a > 240:
            seen[(r, g, b)] = seen.get((r, g, b), 0) + 1
    br, bg, bb = max(seen, key=seen.get)  # màu thân mảng
    base = 0.299 * br + 0.587 * bg + 0.114 * bb
    target = [int(color[i:i + 2], 16) for i in (1, 3, 5)]
    out = []
    for r, g, b, a in px:
        if min(r, g, b) > 236:  # vệt sáng giữ trắng
            out.append((r, g, b, a))
            continue
        k = (0.299 * r + 0.587 * g + 0.114 * b) / base
        out.append((*(min(255, round(t * k)) for t in target), a))
    im.putdata(out)
    return im


def tach_hat(src, folder):
    """tách ba hình lớn nhất của ảnh cụm thành hat-1..3"""
    from PIL import ImageChops, ImageFilter
    im = Image.open(src).convert('RGBA')
    im.thumbnail((720, 720), Image.LANCZOS)
    w, h = im.size
    a = im.getchannel('A').load()
    seen = bytearray(w * h)
    parts = []
    for y0 in range(h):
        for x0 in range(w):
            if seen[y0 * w + x0] or a[x0, y0] < 128:
                continue
            stack = [(x0, y0)]
            seen[y0 * w + x0] = 1
            pts = []
            while stack:
                x, y = stack.pop()
                pts.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and a[nx, ny] >= 128:
                        seen[ny * w + nx] = 1
                        stack.append((nx, ny))
            if len(pts) > 400:
                parts.append(pts)
    parts.sort(key=len, reverse=True)
    assert len(parts) >= 3, f'{src}: chỉ tách được {len(parts)} hình (cần 3 hình rời nhau, nền trong suốt)'
    for i, pts in enumerate(parts[:3], 1):
        mask = Image.new('L', (w, h), 0)
        m = mask.load()
        for x, y in pts:
            m[x, y] = 255
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        box = (max(min(xs) - 3, 0), max(min(ys) - 3, 0), min(max(xs) + 4, w), min(max(ys) + 4, h))
        out = im.copy()
        out.putalpha(ImageChops.multiply(im.getchannel('A'), mask.filter(ImageFilter.MaxFilter(5))))
        compress(out.crop(box), folder / f'hat-{i}.png')


def nen_hinh(src, out, side=540):
    im = Image.open(src).convert('RGBA')
    alpha = im.getchannel('A')
    assert alpha.getextrema()[0] == 0, f'{src}: nền không trong suốt (chạy tach-nen.py trước)'
    im = im.crop(alpha.point(lambda v: 255 if v >= 14 else 0).getbbox())
    k = side / max(im.size)
    if k < 1:
        im = im.convert('RGBa').resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).convert('RGBA')
    compress(im, out)


def hinh(packs, src_root):
    lines = []
    for p in packs:
        src = Path(src_root) / p['key']
        out = PUB / p['key']
        out.mkdir(parents=True, exist_ok=True)
        for name in p['items']:
            nen_hinh(src / f'{name}.png', out / f'{name}.png')
        mang(p['frame']).save(out / 'mang.png', optimize=True)
        tach_hat(src / f"{p['cum']}.png", out)
        dims = []
        for f in sorted(out.glob('*.png')):
            if f.stem != 'giay':
                w, h = Image.open(f).size
                dims.append(f"'{p['key']}/{f.stem}': [{w}, {h}],")
        lines += ['  ' + ' '.join(dims[i:i + 5]) for i in range(0, len(dims), 5)]
        print('xong hình', p['key'])
    layout = Src('src/lib/slidePacks.ts')
    for p in packs:
        assert f"'{p['key']}/".encode() not in layout.s, f"{p['key']}: đã ghi kích thước, xoá các dòng cũ trong ART trước"
    layout.before('  // het dot 2', '\n'.join(lines) + '\n')
    layout.save()


if __name__ == '__main__':
    mode, data = sys.argv[1], json.loads(Path(sys.argv[2]).read_text(encoding='utf-8'))
    if mode == 'them':
        them(data)
    elif mode == 'hinh':
        hinh(data, sys.argv[3])
    else:
        sys.exit(__doc__)
