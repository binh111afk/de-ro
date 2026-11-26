"""Vẽ nền 1280×720 của các bộ theo môn. Chạy từ gốc dự án."""
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


def hat_giay(name, nen, hat, seed):
    """giấy trơn có hạt, dùng cho các bộ vẽ tay"""
    import random
    rnd = random.Random(seed)  # cố định để vẽ lại ra đúng nền cũ
    im = Image.new('RGB', (W * S, H * S), nen)
    d = ImageDraw.Draw(im)
    for _ in range(2600):
        x, y, r = rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(0.5, 1.4)
        d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=rnd.choice(hat))
    save(im, name)


def vat_ly():
    hat_giay('vat-ly', '#fbfaf6', ['#eeede8', '#e8e8e3', '#f1f0eb'], 11)


def hoa_hoc():
    hat_giay('hoa-hoc', '#faf9f6', ['#eeece6', '#e8e6df', '#f1efea'], 7)


def sinh_hoc():
    hat_giay('sinh-hoc', '#fafaf4', ['#edede4', '#e7e8de', '#f0f0e8'], 5)


def ngu_van():
    hat_giay('ngu-van', '#fbf8f2', ['#efeae1', '#e9e3d9', '#f2eee6'], 13)


def dia_li():
    hat_giay('dia-li', '#f8faf8', ['#ebeeeb', '#e5e9e6', '#eef1ee'], 17)


def tieng_anh():
    hat_giay('tieng-anh', '#fcfaf7', ['#efece7', '#e9e6e1', '#f2efea'], 19)


def kinh_te_phap_luat():
    hat_giay('kinh-te-phap-luat', '#faf9f5', ['#edebe4', '#e7e5de', '#f0eee8'], 23)


def lich_su():
    hat_giay('lich-su', '#fbf7ee', ['#efe9dc', '#e9e2d2', '#f2ede2'], 29)


def cong_nghe():
    hat_giay('cong-nghe', '#f8f9fa', ['#ecedef', '#e6e8ea', '#eff0f2'], 31)


def nghe_thuat():
    hat_giay('nghe-thuat', '#fdf9f7', ['#f1ecea', '#ebe6e4', '#f3efed'], 37)


def the_duc():
    hat_giay('the-duc', '#f8faf6', ['#ecefea', '#e6eae4', '#eef1ec'], 41)


def mam_non():
    hat_giay('mam-non', '#fffbf5', ['#f2eee8', '#ece8e2', '#f4f1ec'], 43)


def sinh_hoat_lop():
    hat_giay('sinh-hoat-lop', '#fbf9f4', ['#eeece5', '#e8e6df', '#f1efe9'], 47)


def moi_truong():
    hat_giay('moi-truong', '#f7faf4', ['#ecefe8', '#e6eae2', '#eef1ea'], 53)


def kinh_doanh():
    hat_giay('kinh-doanh', '#f9f9fb', ['#ececf0', '#e6e6ec', '#efeff3'], 59)


def le_hoi():
    hat_giay('le-hoi', '#fffaf4', ['#f2ede7', '#ece7e1', '#f4f0eb'], 61)


def tin_hoc():
    im = Image.new('RGB', (W * S, H * S), '#f8f7fc')
    d = ImageDraw.Draw(im)
    for y in range(20, H, 28):
        for x in range(20, W, 28):
            d.ellipse([(x - 1) * S, (y - 1) * S, (x + 1) * S, (y + 1) * S], fill='#dcd8ee')
    # đường mạch ở hai mép
    for path in [[(0, 640), (36, 640), (62, 666), (62, 720)], [(0, 600), (22, 600), (44, 622), (44, 640)],
                 [(1280, 90), (1250, 90), (1228, 68), (1228, 0)], [(1280, 130), (1262, 130), (1240, 108), (1240, 90)]]:
        d.line([(x * S, y * S) for x, y in path], fill='#bdb3f0', width=3 * S, joint='curve')
        x, y = path[-1]
        d.ellipse([(x - 6) * S, (y - 6) * S, (x + 6) * S, (y + 6) * S], fill='#18c1a8')
    d.rectangle([0, 0, W * S, 10 * S], fill='#6c4cf1')
    save(im, 'tin-hoc')


def tam_ly():
    im = Image.new('RGB', (W * S, H * S), '#fbf4ec')
    d = ImageDraw.Draw(im)
    # các mảng giấy cắt mềm ở góc
    d.ellipse([-220 * S, -250 * S, 230 * S, 110 * S], fill='#f6e3d3')
    d.ellipse([-160 * S, -200 * S, 120 * S, 70 * S], fill='#f2d3c4')
    d.ellipse([1060 * S, 640 * S, 1500 * S, 900 * S], fill='#dfe8dc')
    d.ellipse([-120 * S, 668 * S, 300 * S, 900 * S], fill='#fbe9c4')
    save(im, 'tam-ly')


khoa_hoc()
toan()
vat_ly()
hoa_hoc()
tin_hoc()
tam_ly()
sinh_hoc()
ngu_van()
dia_li()
tieng_anh()
kinh_te_phap_luat()
lich_su()
cong_nghe()
nghe_thuat()
the_duc()
mam_non()
sinh_hoat_lop()
moi_truong()
kinh_doanh()
le_hoi()
