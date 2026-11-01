/**
 * Nhập contact sheet icon do thiết kế giao → `src/lib/graphics.ts`.
 *
 * Chạy: node scripts/import-graphics.mjs
 * Sheet: mỗi icon = 2 path liền nhau (1 khối `fill` + 1 nét `#22333B`), lưới
 * đọc theo hàng. Script cắt cửa sổ 70×70 quanh tâm icon (3px đệm cho nét 3px),
 * bỏ nền trắng, giữ nguyên màu fill pastel; nét ink đổi được lúc render.
 *
 * Danh sách 112 icon dưới đây là nguồn tên/id/keyword — thêm icon mới thì thêm
 * một dòng vào mảng ICONS theo đúng thứ tự đọc trên sheet rồi chạy lại.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { bboxOf } from './lib/svg-bbox.mjs'
import { ICONS_DECOR2, SHEET_DECOR2, importDecor } from './import-decor.mjs'
import { ADDED, REDRAWN } from './graphics-redraw.mjs'
import { ICONS_100, ICONS_DOT4, ICONS_NEW, ICONS_PROG, SHEET_100, SHEET_DOT4, SHEET_NEW, SHEET_PROG } from './graphics-extra.mjs'

const SHEET = 'C:/Users/Lenovo/Downloads/112 educational icons · 64px.svg'
const OUT = 'src/lib/graphics.ts'

const ICONS = [
  ['math-eke', 'Ê-ke', 'math', 'eke thuoc tam giac goc vuong hinh hoc'],
  ['math-compa', 'Compa', 'math', 'compa ve hinh tron ban kinh'],
  ['math-do-thi-ham-so', 'Đồ thị hàm số', 'math', 'do thi ham so parabol truc toa do'],
  ['math-can-bang', 'Cán cân', 'math', 'can bang phuong trinh cong bang'],
  ['math-may-tinh', 'Máy tính', 'math', 'may tinh bo tui so hoc phep tinh'],
  ['math-thuoc-do-goc', 'Thước đo góc', 'math', 'thuoc do goc protractor hinh hoc'],
  ['math-thuoc-ke', 'Thước kẻ', 'math', 'thuoc ke do dai cm'],
  ['math-hinh-lap-phuong', 'Hình lập phương', 'math', 'hinh lap phuong khoi the tich'],
  ['math-hinh-chop', 'Hình chóp', 'math', 'hinh chop khoi da giac the tich'],
  ['math-bieu-do-tron', 'Biểu đồ tròn', 'math', 'bieu do tron thong ke ti le'],
  ['sci-gia-ong-nghiem', 'Giá ống nghiệm', 'sci', 'gia ong nghiem dung cu thi nghiem'],
  ['sci-mat-phang-nghieng', 'Mặt phẳng nghiêng', 'sci', 'mat phang nghieng vat ly luc'],
  ['sci-ong-nghiem', 'Ống nghiệm', 'sci', 'ong nghiem thu nghiem hoa hoc'],
  ['sci-kinh-hien-vi', 'Kính hiển vi', 'sci', 'kinh hien vi phong thi nghiem vi khuan'],
  ['sci-dna', 'DNA', 'sci', 'dna di truyen sinh hoc gene'],
  ['sci-nam-cham', 'Nam châm', 'sci', 'nam cham tu truong vat ly'],
  ['sci-mach-dien', 'Mạch điện', 'sci', 'mach dien pin bong den dong dien'],
  ['sci-nguyen-tu', 'Nguyên tử', 'sci', 'nguyen tu hat nhan quy dao vat ly'],
  ['sci-binh-tam-giac', 'Bình tam giác', 'sci', 'binh tam giac erlenmeyer dung dich'],
  ['sci-coc-dong', 'Cốc đong', 'sci', 'coc dong beaker chat long thi nghiem'],
  ['sci-phan-tu', 'Phân tử', 'sci', 'phan tu hoa hoc lien ket hop chat'],
  ['sci-hanh-tinh', 'Hành tinh', 'sci', 'hanh tinh sao tho vu tru thien van'],
  ['sci-kinh-vien-vong', 'Kính viễn vọng', 'sci', 'kinh vien vong thien van quan sat'],
  ['sci-bong-den', 'Bóng đèn ý tưởng', 'sci', 'bong den y tuong sang tao phat minh'],
  ['nat-mat-troi', 'Mặt trời', 'nat', 'mat troi nang thoi tiet'],
  ['nat-may-mua', 'Mây mưa', 'nat', 'may mua thoi tiet khi hau'],
  ['nat-song-bien', 'Sóng biển', 'nat', 'song bien nuoc dai duong'],
  ['nat-dia-cau', 'Quả địa cầu', 'nat', 'dia cau trai dat the gioi dia ly'],
  ['nat-cay', 'Cây', 'nat', 'cay xanh rung thien nhien moi truong'],
  ['nat-la', 'Chiếc lá', 'nat', 'la cay xanh thien nhien sinh hoc'],
  ['nat-nui', 'Núi', 'nat', 'nui nui non canh quan dia hinh'],
  ['nat-hoa', 'Bông hoa', 'nat', 'hoa bong hoa thien nhien sac mau'],
  ['nat-trang-sao', 'Trăng và sao', 'nat', 'trang sao ban dem vu tru'],
  ['lang-sach-mo', 'Sách mở', 'lang', 'sach mo doc sach van hoc'],
  ['lang-but-chi', 'Bút chì', 'lang', 'but chi viet ve sang tac'],
  ['lang-bong-thoai', 'Bóng thoại', 'lang', 'bong thoai noi giao tiep ke chuyen'],
  ['lang-so-ghi-chu', 'Sổ ghi chú', 'lang', 'so ghi chu vo hoc tap'],
  ['lang-cuon-giay', 'Cuộn giấy', 'lang', 'cuon giay truyen van ban xua'],
  ['lang-but-long', 'Bút lông', 'lang', 'but long viet thu phap sang tac'],
  ['lang-danh-dau-sach', 'Thẻ đánh dấu sách', 'lang', 'danh dau sach bookmark doc sach'],
  ['soc-ban-do', 'Bản đồ', 'soc', 'ban do dia ly vi tri hanh trinh'],
  ['soc-la-ban', 'La bàn', 'soc', 'la ban huong dinh huong'],
  ['soc-trong-dong', 'Trống đồng', 'soc', 'trong dong dong son van hoa lich su'],
  ['soc-hai-dang', 'Hải đăng', 'soc', 'hai dang ngon hai dang bien lich su'],
  ['soc-bao-tang', 'Bảo tàng', 'soc', 'bao tang di tich kien truc lich su'],
  ['soc-dong-ho-cat', 'Đồng hồ cát', 'soc', 'dong ho cat thoi gian lich su'],
  ['soc-la-co', 'Lá cờ', 'soc', 'la co doc lap su kien lich su'],
  ['class-bang-thuyet-trinh', 'Bảng thuyết trình', 'class', 'bang thuyet trinh trinh chieu bieu do'],
  ['class-cap-sach', 'Cặp sách', 'class', 'cap sach hoc sinh di hoc'],
  ['class-gia-sach', 'Giá sách', 'class', 'gia sach thu vien sach vo'],
  ['class-lich', 'Lịch', 'class', 'lich ngay thang ke hoach thoi gian bieu'],
  ['class-but-chi', 'Bút chì (nghiêng)', 'class', 'but chi viet dung cu hoc tap'],
  ['class-keo', 'Kéo', 'class', 'keo cat thu cong dung cu'],
  ['class-cuc-tay', 'Cục tẩy', 'class', 'cuc tay xoa but chi'],
  ['class-vo-xoan', 'Vở xoắn', 'class', 'vo xoan so ghi chep hoc tap'],
  ['class-dong-ho', 'Đồng hồ', 'class', 'dong ho gio hoc thoi gian'],
  ['class-mu-tot-nghiep', 'Mũ tốt nghiệp', 'class', 'mu tot nghiep hoc sinh tot nghiep'],
  ['people-hoc-sinh-gio-tay', 'Học sinh giơ tay', 'people', 'hoc sinh gio tay phat bieu cau hoi'],
  ['people-giao-vien-bang', 'Giáo viên và bảng', 'people', 'giao vien bang giang day'],
  ['people-bat-tay', 'Bắt tay', 'people', 'bat tay hop tac dong y'],
  ['people-dien-gia', 'Diễn giả', 'people', 'dien gia thuyet trinh phat bieu'],
  ['people-nhom', 'Nhóm học tập', 'people', 'nhom hoc tap team dong doi'],
  ['people-thao-luan', 'Thảo luận', 'people', 'thao luan trao doi y kien'],
  ['people-giao-vien', 'Giáo viên', 'people', 'giao vien thay co giang day'],
  ['reward-cup', 'Cúp', 'reward', 'cup giai thuong vo dich'],
  ['reward-huy-chuong', 'Huy chương', 'reward', 'huy chuong giai thuong thanh tich'],
  ['reward-bang-khen', 'Bằng khen', 'reward', 'bang khen chung nhan tot nghiep'],
  ['reward-sao', 'Ngôi sao', 'reward', 'ngoi sao khen thuong tich cuc'],
  ['reward-vuong-mien', 'Vương miện', 'reward', 'vuong mien quan quan xuat sac'],
  ['reward-huy-hieu', 'Huy hiệu', 'reward', 'huy hieu rosette chung nhan'],
  ['sym-a', 'Chữ A', 'sym', 'chu a phuong an trac nghiem'],
  ['sym-b', 'Chữ B', 'sym', 'chu b phuong an trac nghiem'],
  ['sym-c', 'Chữ C', 'sym', 'chu c phuong an trac nghiem'],
  ['sym-d', 'Chữ D', 'sym', 'chu d phuong an trac nghiem'],
  ['sym-cong', 'Dấu cộng', 'sym', 'dau cong phep cong toan'],
  ['sym-tru', 'Dấu trừ', 'sym', 'dau tru phep tru toan'],
  ['sym-nhan', 'Dấu nhân', 'sym', 'dau nhan phep nhan toan'],
  ['sym-chia', 'Dấu chia', 'sym', 'dau chia phep chia toan'],
  ['sym-bang', 'Dấu bằng', 'sym', 'dau bang phuong trinh toan'],
  ['sym-phan-tram', 'Dấu phần trăm', 'sym', 'phan tram ti le thong ke'],
  ['sym-dung', 'Dấu tích', 'sym', 'dau tich dung check dap an dung'],
  ['sym-sai', 'Dấu gạch chéo', 'sym', 'dau sai cross dap an sai'],
  ['sym-hoi', 'Dấu chấm hỏi', 'sym', 'cham hoi cau hoi thac mac'],
  ['sym-than', 'Dấu chấm than', 'sym', 'cham than chu y nhan manh'],
  ['frame-bo-tron', 'Khung bo tròn', 'frame', 'khung bo tron vien khung anh'],
  ['frame-bang-ron', 'Băng rôn', 'frame', 'bang ron banner tieu de'],
  ['frame-nhan', 'Nhãn', 'frame', 'nhan tag danh gia phan loai'],
  ['frame-the', 'Khung thẻ', 'frame', 'khung the card hop noi dung'],
  ['frame-vien-net-dut', 'Khung nét đứt', 'frame', 'khung net dut vien cat trang tri'],
  ['frame-giay-ghi-chu', 'Giấy ghi chú', 'frame', 'giay ghi chu note ghi chu'],
  ['decor-chum-sao', 'Chùm sao', 'decor', 'chum sao burst trang tri nhan manh'],
  ['decor-elip', 'Hình elip', 'decor', 'elip ellipse hinh khoi trang tri'],
  ['arrow-phai', 'Mũi tên phải', 'arrow', 'mui ten phai huong tien trinh'],
  ['arrow-cong', 'Mũi tên cong', 'arrow', 'mui ten cong quay lai tro ve'],
  ['arrow-vong', 'Vòng tuần hoàn', 'arrow', 'vong tuan hoan quy trinh lap'],
  ['arrow-doi', 'Mũi tên hai chiều', 'arrow', 'mui ten doi hai chieu so sanh'],
  ['arrow-tach', 'Mũi tên tách nhánh', 'arrow', 'mui ten tach nhanh phan nhanh so do'],
  ['misc-nhip-tim', 'Nhịp tim', 'misc', 'nhip tim suc khoe the duc'],
  ['misc-not-nhac', 'Nốt nhạc', 'misc', 'not nhac am nhac nhac'],
  ['misc-bong', 'Quả bóng', 'misc', 'qua bong bong da the thao'],
  ['math-tam-giac', 'Tam giác', 'math', 'tam giac goc dinh hinh hoc'],
  ['math-duong-tron', 'Đường tròn', 'math', 'duong tron ban kinh hinh hoc'],
  ['math-can-bac', 'Dấu căn', 'math', 'dau can can bac nghiem toan'],
  ['math-hinh-co-ban', 'Bộ hình cơ bản', 'math', 'bo hinh co ban vuong tron tam giac hinh hoc'],
  ['class-hop-but', 'Hộp bút', 'class', 'hop but dung cu hoc tap'],
  ['class-lop-hoc', 'Lớp học', 'class', 'lop hoc ban ghe bang hoc sinh'],
  ['lang-tu-dien', 'Từ điển', 'lang', 'tu dien sach tra cuu tu vung'],
  ['sci-banh-rang', 'Bánh răng', 'sci', 'banh rang co che ky thuat cong nghe'],
  ['sci-ten-lua', 'Tên lửa', 'sci', 'ten lua vu tru phong ve tinh'],
  ['lang-phong-bi', 'Phong bì thư', 'lang', 'phong bi thu gui thu van ban'],
  ['soc-ghim-vi-tri', 'Ghim vị trí', 'soc', 'ghim vi tri ban do dia diem gps'],
  ['reward-no', 'Nơ ruy băng', 'reward', 'no ruy bang trang tri le hoi'],
]

/* ------------------------------ đọc sheet ------------------------------ */

/** Đọc một contact sheet (mỗi icon 2 path) và ghép với danh sách tên theo thứ tự đọc. */
function importSheet(SHEET, ICONS) {
const raw = readFileSync(SHEET, 'utf8')
const paths = [...raw.matchAll(/<path\b([^>]*)>/g)].map((m) => {
  const attrs = {}
  for (const a of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) attrs[a[1]] = a[2]
  return attrs
})
if (paths.length !== ICONS.length * 2) {
  throw new Error(`Sheet có ${paths.length} path, cần ${ICONS.length * 2} (mỗi icon 2 path)`)
}


const rawIcons = []
for (let i = 0; i < paths.length; i += 2) {
  const fill = paths[i]
  const ink = paths[i + 1]
  if (!fill?.d || ink?.stroke !== '#22333B') throw new Error(`Cặp path ${i / 2} sai cấu trúc`)
  const a = bboxOf(fill.d)
  const b = bboxOf(ink.d)
  const x1 = Math.min(a.x1, b.x1)
  const y1 = Math.min(a.y1, b.y1)
  const x2 = Math.max(a.x2, b.x2)
  const y2 = Math.max(a.y2, b.y2)
  rawIcons.push({ fill, ink, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2, w: x2 - x1, h: y2 - y1 })
}

// đọc theo hàng: gom theo tâm y (lệch < 20), trong hàng sort theo x
const rows = []
for (const icon of rawIcons) {
  const row = rows.find((r) => Math.abs(r.cy - icon.cy) < 20)
  if (row) row.items.push(icon)
  else rows.push({ cy: icon.cy, items: [icon] })
}
rows.sort((a, b) => a.cy - b.cy)
const sorted = rows.flatMap((r) => r.items.sort((a, b) => a.cx - b.cx))

const rowShape = rows.map((r) => r.items.length)
console.log('lưới:', rowShape.join(' + '), '=', sorted.length, 'icon')
if (sorted.length !== ICONS.length) throw new Error('Số icon đọc được không khớp danh sách tên')

const entries = sorted.map((icon, index) => {
  const [id, name, category, keywords] = ICONS[index]
  const size = 70
  const x = (icon.cx - size / 2).toFixed(2)
  const y = (icon.cy - size / 2).toFixed(2)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${size} ${size}">` +
    `<path d="${icon.fill.d}" fill="${icon.fill.fill}" fill-rule="evenodd" clip-rule="evenodd"/>` +
    `<path d="${icon.ink.d}" fill="none" stroke="#22333B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>`
  return { id, name, category, keywords, ratio: 1, svg }
})
return entries
}

const entries = [
  ...importSheet(SHEET, ICONS),
  ...importSheet(SHEET_100, ICONS_100),
  ...importSheet(SHEET_NEW, ICONS_NEW),
  ...importSheet(SHEET_PROG, ICONS_PROG),
  ...importSheet(SHEET_DOT4, ICONS_DOT4),
  ...importDecor(),
  ...importDecor(SHEET_DECOR2, ICONS_DECOR2),
]
// Lớp tô của các icon này gồm nhiều hình CHỒNG nhau (thẻ chồng thẻ); evenodd biến vùng chồng thành lỗ trắng.
// Các hình vẽ cùng chiều nên nonzero (mặc định) tô kín phần hợp.
// Danh sách lấy bằng cách so mặt nạ từng hình con: có cặp chồng MỘT PHẦN (không phải lỗ nằm trọn trong hình) → lỗi.
const FILL_NONZERO = new Set([
  'eng-the-tu-vung','feel-vo-tay','math-venn','cs-may-in','class-trong-truong','reward-bang-khen',
  'bio-trau','pe-huy-chuong','art-keo-ho-dan','frame-cuon-tieu-de','bio-hoa-cau-tao','his-chua-mot-cot',
  'bio-voi','his-voi-chien','people-doc-sach','nat-cay-thong','event-hop-qua','lit-hoa-sen',
  'life-ban-chai','frame-bong-suy-nghi','his-dai-bac','class-hop-but-mau','bio-rua','sci-kep-ong-nghiem',
  'decor-bong-bay','bio-cho','life-ly-sua','bio-tho','life-ca-rot','arrow-vong-cung',
  'bio-meo','class-ban-ghe','civic-gia-dinh','frame-the-lat','reward-huy-chuong','lit-mat-na-2',
  'geo-tuabin-gio','life-rua-tay','bio-buom','eng-dich-thuat','sci-binh-cau','lit-den-dau',
  'civic-la-phieu','bio-ho','bio-tim','his-lau-dai','art-co-ve',
])
for (const e of entries) {
  if (FILL_NONZERO.has(e.id)) e.svg = e.svg.replace(' fill-rule="evenodd" clip-rule="evenodd"', '')
}

// Hoa sen vẽ lại theo lớp: icon gốc dồn mọi nét vào một path nên nét cánh sau chạy đè qua cánh trước.
// Ở đây cánh sau vẽ trước, cánh trước vẽ sau, mỗi cánh tự tô nên che nét phía sau (nối tiếp, không chồng).
const SEN = entries.find((e) => e.id === 'lit-hoa-sen')
if (SEN) {
  const petal = (d) => `<path d="${d}" fill="#F5D6E0" stroke="#22333B" stroke-width="3" stroke-linejoin="round"/>`
  SEN.svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70">' +
    petal('M35 50C26 54 15.5 52 10.5 41C20 38.5 29 41.5 35 50Z') +
    petal('M35 50C44 54 54.5 52 59.5 41C50 38.5 41 41.5 35 50Z') +
    petal('M35 50C22 50 14.5 42 13.5 26.5C25 28.5 32 36.5 35 50Z') +
    petal('M35 50C48 50 55.5 42 56.5 26.5C45 28.5 38 36.5 35 50Z') +
    petal('M35 50C26 42.5 26 30 35 13C44 30 44 42.5 35 50Z') +
    '<path d="M23 58.5H47" fill="none" stroke="#22333B" stroke-width="3" stroke-linecap="round"/>' +
    '</svg>'
}

// Hoạ tiết hoa sen (B.svg) cùng lỗi: vẽ lại theo lớp — cánh bên (sau) → cuống → nụ giữa → cánh dưới (trước) → mặt nước.
const SEN_ORN = entries.find((e) => e.id === 'orn-sen')
if (SEN_ORN) {
  const fill = (d) => `<path d="${d}" fill="#F5D6E0" stroke="#22333B" stroke-width="3" stroke-linejoin="round"/>`
  const line = (d) => `<path d="${d}" fill="none" stroke="#22333B" stroke-width="3" stroke-linecap="round"/>`
  SEN_ORN.ratio = 0.98
  SEN_ORN.svg =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 107 110">' +
    fill('M53.5 76.5C36.2 67.2 24.8 50.8 19.5 27.5C35.5 29.5 46.8 37.5 53.5 51.5C60.2 37.5 71.5 29.5 87.5 27.5C82.2 50.8 70.8 67.2 53.5 76.5Z') +
    line('M53.5 59.5V73.5') +
    fill('M53.5 59.5C38.8 43.5 38.8 24.5 53.5 2.5C68.2 24.5 68.2 43.5 53.5 59.5Z') +
    fill('M53.5 76.5C35.5 86.5 18.5 79.2 2.5 54.5C21.8 50.5 38.8 57.8 53.5 76.5Z') +
    fill('M53.5 76.5C71.5 86.5 88.5 79.2 104.5 54.5C85.2 50.5 68.2 57.8 53.5 76.5Z') +
    line('M14.5 91.5C40.5 99.5 66.5 99.5 92.5 91.5') +
    line('M34.5 104.5C47.2 107.2 59.8 107.2 72.5 104.5') +
    '</svg>'
}

// icon vẽ lại bằng tay (xem graphics-redraw.mjs) thay bản từ sheet
for (const [id, svg] of Object.entries(REDRAWN)) {
  const e = entries.find((x) => x.id === id)
  if (!e) throw new Error('vẽ lại: không có icon ' + id)
  e.svg = svg
  e.ratio = 1
}

for (const { after, ...e } of ADDED) {
  const i = entries.findIndex((x) => x.id === after)
  if (i < 0) throw new Error('thêm icon: không có ' + after)
  entries.splice(i + 1, 0, { ...e, ratio: 1 })
}

// nhóm 'soc' (Lịch sử & địa lý) tách về hai nhóm Địa lí / Lịch sử (giữ id soc-*)
const SOC_GEO = new Set(['soc-ban-do', 'soc-la-ban', 'soc-ghim-vi-tri', 'soc-hai-dang'])
for (const e of entries) if (e.category === 'soc') e.category = SOC_GEO.has(e.id) ? 'geo' : 'his'

const seen = new Set()
for (const e of entries) {
  if (seen.has(e.id)) throw new Error(`id trùng: ${e.id}`)
  seen.add(e.id)
}

const body = entries
  .map(
    (e) =>
      `  {\n    id: ${JSON.stringify(e.id)},\n    name: ${JSON.stringify(e.name)},\n    category: ${JSON.stringify(e.category)},\n    keywords: ${JSON.stringify(e.keywords)},\n    ratio: ${e.ratio},\n    svg: ${JSON.stringify(e.svg)},\n  },`,
  )
  .join('\n')

const file = `/* AUTO-GENERATED bởi scripts/import-graphics.mjs — đừng sửa tay.
 * Nguồn: 5 contact sheet (112 icon gốc + 100 icon bổ sung + 20 ngôn ngữ lập trình + 100 icon đợt 4 + 78
 * asset trang trí "ornament" — scripts/import-decor.mjs; ornament không vào catalog/tìm kiếm của AI;
 * 64px, 3px stroke #22333B, 8 màu pastel).
 * Cắt cửa sổ 70×70 quanh tâm từng icon để nét 3px không bị cắt.
 */
export type GraphicCategory =
  | 'math'
  | 'sci'
  | 'nat'
  | 'lang'
  | 'soc'
  | 'class'
  | 'people'
  | 'reward'
  | 'sym'
  | 'frame'
  | 'arrow'
  | 'decor'
  | 'misc'
  | 'cs'
  | 'prog'
  | 'eng'
  | 'geo'
  | 'his'
  | 'lit'
  | 'bio'
  | 'chem'
  | 'phys'
  | 'art'
  | 'pe'
  | 'life'
  | 'civic'
  | 'event'
  | 'feel'
  | 'ornament'

export interface SlideGraphicData {
  id: string
  name: string
  category: GraphicCategory
  /** keyword tiếng Việt không dấu, cách nhau khoảng trắng */
  keywords: string
  ratio: number
  /** SVG đã cắt sẵn; nét #22333B được thay theo theme lúc render */
  svg: string
}

export const GRAPHICS: SlideGraphicData[] = [
${body}
]
`

writeFileSync(OUT, file)
console.log(`Đã ghi ${OUT}: ${entries.length} icon, ${file.length} ký tự`)
