"""Vẽ nền giấy 1280×720 của bộ khoa học (chấm bi) và toán (ô li). Chạy từ gốc dự án."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2] / 'public' / 'slide-packs'
W, H, S = 1280, 720, 3  # vẽ gấp 3 rồi thu lại cho mịn


def save(im, name):
    out = ROOT / name / 'giay.png'
    out.parent.mkdir(parents=True, exist_ok=True)
    im.resize((W, H), Image.LANCZOS).convert('P', palette=Image.ADAPTIVE, colors=64).save(out, optimize=True)


def khoa_hoc():
    im = Image.new('RGB', (W * S, H * S), '#f7f5ee')
    d = ImageDraw.Draw(im)
    for y in range(24, H, 32):
        for x in range(64, W, 32):
            d.ellipse([(x - 1.6) * S, (y - 1.6) * S, (x + 1.6) * S, (y + 1.6) * S], fill='#cfcabb')
    # gáy sổ bên trái với các lỗ đục
    d.rectangle([0, 0, 34 * S, H * S], fill='#173f5f')
    for y in range(40, H, 80):
        d.ellipse([22 * S, (y - 12) * S, 46 * S, (y + 12) * S], fill='#e7e3d6', outline='#173f5f', width=3 * S)
    save(im, 'khoa-hoc')


def toan():
    im = Image.new('RGB', (W * S, H * S), '#fbfcff')
    d = ImageDraw.Draw(im)
    for x in range(0, W + 1, 16):
        d.line([x * S, 0, x * S, H * S], fill='#c9dbf7' if x % 80 == 0 else '#e8effc', width=S)
    for y in range(0, H + 1, 16):
        d.line([0, y * S, W * S, y * S], fill='#c9dbf7' if y % 80 == 0 else '#e8effc', width=S)
    d.line([64 * S, 0, 64 * S, H * S], fill='#f2a0a0', width=2 * S)  # đường lề đỏ
    save(im, 'toan')


khoa_hoc()
toan()
