/**
 * Nhập sheet asset trang trí (`B.svg`, 78 item: đường kẻ, khung, hoa lá, blob, thẻ số...)
 * → các mục `ornament` ghép vào `src/lib/graphics.ts` (xem import-graphics.mjs).
 *
 * Khác sheet icon: item có kích thước khác nhau và không cố định 2 path/icon, nên
 * gom path theo ô lưới (cột = cx / 360, hàng = cụm theo cy). Item nằm trong
 * `<g clip-path>` (đường kẻ lượn) lấy đúng hộp cắt làm viewBox — viewBox của svg
 * nhúng tự cắt phần thừa. Sheet không có nhãn: id/tên/keyword đặt theo hình, theo thứ
 * tự đọc trái → phải, trên → dưới.
 */
import { readFileSync } from 'node:fs'
import { bboxOf } from './lib/svg-bbox.mjs'

export const SHEET_DECOR = 'C:/Users/Lenovo/Downloads/B.svg'

const O = 'ornament'
export const ICONS_DECOR = [
  // hàng 1–2: đường kẻ
  ['orn-ke-song', 'Đường kẻ sóng', O, 'duong ke song ngan cach tieu de'],
  ['orn-ke-zigzag', 'Đường kẻ zigzag', O, 'duong ke zigzag ngan cach'],
  ['orn-ke-net-dut', 'Đường kẻ nét đứt', O, 'duong ke net dut ngan cach'],
  ['orn-ke-cham', 'Đường kẻ chấm', O, 'duong ke cham ngan cach'],
  ['orn-ke-luon', 'Đường kẻ lượn nhỏ', O, 'duong ke luon song ngan cach'],
  ['orn-ke-nut-giua', 'Đường kẻ nút giữa', O, 'duong ke nut giua ngan cach'],
  ['orn-ke-sao-giua', 'Đường kẻ sao giữa', O, 'duong ke sao giua ngan cach'],
  ['orn-ke-but-1', 'Gạch chân nét bút 1', O, 'gach chan net but nhan manh'],
  ['orn-ke-but-2', 'Gạch chân nét bút 2', O, 'gach chan net but nhan manh'],
  ['orn-ke-but-3', 'Gạch chân nét bút 3', O, 'gach chan net but nhan manh'],
  // khung
  ['orn-khung-tron-vuong', 'Khung bo tròn vuông', O, 'khung bo tron vien'],
  ['orn-khung-tron-ngang', 'Khung bo tròn ngang', O, 'khung bo tron vien'],
  ['orn-khung-vat-vuong', 'Khung vát góc vuông', O, 'khung vat goc vien'],
  ['orn-khung-vat-ngang', 'Khung vát góc ngang', O, 'khung vat goc vien'],
  ['orn-khung-anh-vuong', 'Khung ảnh vuông', O, 'khung anh polaroid'],
  ['orn-khung-anh-ngang', 'Khung ảnh ngang', O, 'khung anh polaroid'],
  ['orn-goc-vuong', 'Góc ngoặc vuông', O, 'goc ngoac tieu diem khung'],
  ['orn-goc-ngang', 'Góc ngoặc ngang', O, 'goc ngoac tieu diem khung'],
  ['orn-khung-tem-vuong', 'Khung tem vuông', O, 'khung tem rang cua'],
  ['orn-khung-tem-ngang', 'Khung tem ngang', O, 'khung tem rang cua'],
  ['orn-the-kep-vuong', 'Thẻ kẹp giấy vuông', O, 'the kep giay ghi chu'],
  ['orn-the-kep-ngang', 'Thẻ kẹp giấy ngang', O, 'the kep giay ghi chu'],
  ['orn-the-bang-keo-vuong', 'Thẻ băng keo vuông', O, 'the bang keo ghi chu'],
  ['orn-the-bang-keo-ngang', 'Thẻ băng keo ngang', O, 'the bang keo ghi chu'],
  // hàng 4–5: vòng, hoa lá
  ['orn-vong-doi-1', 'Vòng tròn đôi 1', O, 'vong tron doi khung huy hieu'],
  ['orn-vong-doi-2', 'Vòng tròn đôi 2', O, 'vong tron doi khung huy hieu'],
  ['orn-nhanh-la-goc', 'Nhánh lá góc', O, 'nhanh la goc trang tri'],
  ['orn-nhanh-hoa-goc', 'Nhánh hoa góc', O, 'nhanh hoa goc trang tri'],
  ['orn-nguyet-que', 'Vòng nguyệt quế', O, 'nguyet que vong la trang tri'],
  ['orn-bo-hoa', 'Bó hoa', O, 'bo hoa trang tri'],
  ['orn-canh-hoa-roi', 'Cánh hoa rơi', O, 'canh hoa roi trang tri'],
  ['orn-canh-la', 'Cành lá', O, 'canh la trang tri'],
  ['orn-sen', 'Hoa sen', O, 'hoa sen trang tri'],
  ['orn-canh-hoa-hong', 'Cành hoa hồng', O, 'canh hoa trang tri'],
  ['orn-canh-hoa-vang', 'Cành hoa vàng', O, 'canh hoa trang tri'],
  ['orn-la-phong', 'Lá phong', O, 'la phong mua thu trang tri'],
  ['orn-la-monstera', 'Lá monstera', O, 'la monstera trang tri'],
  // hàng 5–6: blob, hình nền
  ['orn-blob-xanh', 'Blob xanh', O, 'blob nen hinh khoi trang tri'],
  ['orn-blob-cam', 'Blob cam', O, 'blob nen hinh khoi trang tri'],
  ['orn-blob-tim', 'Blob tím', O, 'blob nen hinh khoi trang tri'],
  ['orn-blob-vang', 'Blob vàng', O, 'blob nen hinh khoi trang tri'],
  ['orn-blob-hong', 'Blob hồng', O, 'blob nen hinh khoi trang tri'],
  ['orn-blob-mint', 'Blob mint', O, 'blob nen hinh khoi trang tri'],
  ['orn-vom', 'Vòm cầu vồng', O, 'vom cau vong trang tri'],
  ['orn-ban-nguyet', 'Bán nguyệt', O, 'ban nguyet mat troi moc trang tri'],
  ['orn-doi-xanh', 'Sóng đồi xanh', O, 'song doi nen trang tri'],
  ['orn-doi-la', 'Sóng đồi lá', O, 'song doi nen trang tri'],
  ['orn-ruy-bang', 'Ruy-băng', O, 'ruy bang tieu de banner'],
  // hàng 7: nhãn số, điểm nhấn
  ['orn-the-so-1', 'Thẻ số 1', O, 'the so 1 buoc thu tu'],
  ['orn-the-so-2', 'Thẻ số 2', O, 'the so 2 buoc thu tu'],
  ['orn-the-so-3', 'Thẻ số 3', O, 'the so 3 buoc thu tu'],
  ['orn-the-so-4', 'Thẻ số 4', O, 'the so 4 buoc thu tu'],
  ['orn-the-so-5', 'Thẻ số 5', O, 'the so 5 buoc thu tu'],
  ['orn-huy-hieu-sao', 'Huy hiệu sao', O, 'huy hieu sao khen thuong'],
  ['orn-canh-bao', 'Cảnh báo', O, 'canh bao chu y luu y'],
  ['orn-bong-den', 'Ô bóng đèn', O, 'bong den meo y tuong'],
  // hàng 8
  ['orn-lop-hinh', 'Hai lớp hình', O, 'lop hinh sao chep'],
  ['orn-bong-thoai-mint', 'Bóng thoại mint', O, 'bong thoai noi'],
  ['orn-bong-nghi', 'Bóng suy nghĩ', O, 'bong suy nghi may nghi'],
  ['orn-bong-thoai-xanh', 'Bóng thoại xanh', O, 'bong thoai noi'],
  ['orn-mui-ten-cong', 'Mũi tên cong', O, 'mui ten cong chi'],
  ['orn-tich', 'Dấu tích', O, 'dau tich dung'],
  ['orn-gach-cheo', 'Dấu gạch chéo', O, 'dau sai gach cheo'],
  ['orn-sao', 'Ngôi sao', O, 'ngoi sao khen thuong'],
  // hàng 9–10: điểm nhấn nhỏ, họa tiết lát
  ['orn-tia-sang', 'Tia sáng', O, 'tia sang nhan manh'],
  ['orn-lap-lanh', 'Lấp lánh', O, 'lap lanh sao nhan manh'],
  ['orn-ba-cham', 'Ba chấm', O, 'ba cham to tang dan'],
  ['orn-gach-xien', 'Gạch xiên', O, 'gach xien nhan manh'],
  ['orn-xoan-oc', 'Xoắn ốc', O, 'xoan oc trang tri'],
  ['orn-zigzag-nho', 'Zigzag nhỏ', O, 'zigzag nho trang tri'],
  ['orn-ghim', 'Ghim', O, 'ghim ghi chu'],
  ['orn-mat-cuoi', 'Mặt cười', O, 'mat cuoi vui'],
  ['orn-ban-tay-chi', 'Bàn tay chỉ', O, 'ban tay chi huong'],
  ['orn-nen-luoi', 'Nền lưới', O, 'hoa tiet nen luoi lat'],
  ['orn-nen-cham', 'Nền chấm', O, 'hoa tiet nen cham lat'],
  ['orn-nen-soc-cheo', 'Nền sọc chéo', O, 'hoa tiet nen soc cheo lat'],
  ['orn-nen-o-cham', 'Nền ô chấm', O, 'hoa tiet nen o cham lat'],
  ['orn-nen-song', 'Nền sóng', O, 'hoa tiet nen song lat'],
]

const attrsOf = (s) => Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]))

export function importDecor(sheet = SHEET_DECOR, names = ICONS_DECOR) {
  const raw = readFileSync(sheet, 'utf8')

  const clips = {}
  for (const m of raw.matchAll(/<clipPath id="(clip\d+)[^"]*">\s*<rect ([^>]*)\/>/g)) {
    const a = attrsOf(m[2])
    const [tx, ty] = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(a.transform).slice(1).map(Number)
    clips[m[1]] = { x: tx, y: ty, w: Number(a.width), h: Number(a.height) }
  }

  // path theo thứ tự tài liệu, kèm hộp cắt nếu nằm trong <g clip-path>
  const items = []
  let clip
  for (const m of raw.matchAll(/<g clip-path="url\(#(clip\d+)[^"]*\)"\s*>|<\/g>|<path\b([^>]*)\/?>/g)) {
    if (m[1]) clip = clips[m[1]]
    else if (m[0] === '</g>') clip = undefined
    else {
      const attrs = m[2].trim().replace(/\/$/, '')
      const b = bboxOf(attrsOf(attrs).d)
      items.push({ attrs, clip, b })
    }
  }

  const cell = (it) => (it.clip ? { x1: it.clip.x, y1: it.clip.y, x2: it.clip.x + it.clip.w, y2: it.clip.y + it.clip.h } : it.b)
  const centre = (it) => ({ cx: (cell(it).x1 + cell(it).x2) / 2, cy: (cell(it).y1 + cell(it).y2) / 2 })

  // hàng = cụm cy cách nhau > 100; cột = cx / 360
  const ys = [...new Set(items.map((it) => Math.round(centre(it).cy)))].sort((a, b) => a - b)
  const rowTops = []
  for (const y of ys) if (!rowTops.length || y - rowTops.at(-1).last > 100) rowTops.push({ first: y, last: y }); else rowTops.at(-1).last = y
  const rowOf = (cy) => rowTops.findIndex((r) => cy <= r.last + 50)

  const cells = new Map()
  for (const it of items) {
    const { cx, cy } = centre(it)
    const key = rowOf(cy) * 100 + Math.floor(cx / 360)
    if (!cells.has(key)) cells.set(key, [])
    cells.get(key).push(it)
  }
  const keys = [...cells.keys()].sort((a, b) => a - b)
  console.log('decor lưới:', rowTops.length, 'hàng,', keys.length, 'item')
  if (keys.length !== names.length) throw new Error(`Đọc được ${keys.length} item, danh sách tên có ${names.length}`)

  const entries = keys.map((key, i) => {
    const group = cells.get(key)
    const clipped = group.find((it) => it.clip)?.clip
    const u = group.reduce(
      (acc, it) => ({
        x1: Math.min(acc.x1, it.b.x1), y1: Math.min(acc.y1, it.b.y1),
        x2: Math.max(acc.x2, it.b.x2), y2: Math.max(acc.y2, it.b.y2),
      }),
      { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity },
    )
    const pad = 2.5 // nửa nét 1,5 + đệm
    const box = clipped ?? { x: u.x1 - pad, y: u.y1 - pad, w: u.x2 - u.x1 + pad * 2, h: u.y2 - u.y1 + pad * 2 }
    const f = (n) => Number(n.toFixed(2))
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="${f(box.x)} ${f(box.y)} ${f(box.w)} ${f(box.h)}">` +
      group.map((it) => `<path ${it.attrs}/>`).join('') +
      `</svg>`
    const [id, name, category, keywords] = names[i]
    return { id, name, category, keywords, ratio: f(box.w / box.h), svg }
  })

  // Đường kẻ gốc rộng 256 đơn vị — thu nhỏ còn ~10% slide thì nét 3 đơn vị chỉ còn sợi tóc.
  // Bản ngắn (2 chu kỳ, 64 đơn vị) cho vạch dưới tiêu đề/cuối section.
  const shorten = (id, name, x) => {
    const src = entries.find((e) => e.id === id)
    const [, y, , h] = /viewBox="([^"]*)"/.exec(src.svg)[1].split(' ')
    const svg = src.svg.replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} 64 ${h}"`)
    return { ...src, id: id + '-ngan', name, ratio: Number((64 / Number(h)).toFixed(2)), svg }
  }
  if (sheet !== SHEET_DECOR) return entries
  return [...entries, shorten('orn-ke-song', 'Đường kẻ sóng ngắn', 72), shorten('orn-ke-zigzag', 'Đường kẻ zigzag ngắn', 424)]
}

/** Đợt 2: 60 hoạ tiết nét tay (lưới 10×6, ô 360) — cùng cách gom theo ô như B.svg, tên theo thứ tự đọc. */
export const SHEET_DECOR2 = 'C:/Users/Lenovo/Downloads/60 hoạ tiết bài giảng · nét tay 3px.svg'
export const ICONS_DECOR2 = [
  // nét vẽ tay nhấn mạnh
  ['orn-mui-ten-cong-trai', 'Mũi tên cong trái', O, 'mui ten cong ve tay nhan manh'],
  ['orn-mui-ten-cong-phai', 'Mũi tên cong phải', O, 'mui ten cong ve tay nhan manh'],
  ['orn-mui-ten-xoan', 'Mũi tên xoắn', O, 'mui ten xoan ve tay'],
  ['orn-mui-ten-hai-dau', 'Mũi tên hai đầu', O, 'mui ten hai dau ve tay'],
  ['orn-khoanh-tron', 'Vòng khoanh tròn', O, 'vong khoanh tron danh dau'],
  ['orn-khoanh-oval', 'Vòng khoanh oval', O, 'vong khoanh oval danh dau'],
  ['orn-gach-chan-nguech', 'Gạch chân nguệch ngoạc', O, 'gach chan ve tay nhan manh'],
  ['orn-gach-chan-doi', 'Gạch chân hai nét', O, 'gach chan doi nhan manh'],
  ['orn-tick-ve-tay', 'Dấu tick vẽ tay', O, 'dau tick dung ve tay'],
  ['orn-x-ve-tay', 'Dấu X vẽ tay', O, 'dau x sai ve tay'],
  ['orn-sao-ve-tay', 'Ngôi sao vẽ tay', O, 'ngoi sao ve tay'],
  ['orn-tia-nhan', 'Tia nhấn', O, 'tia nhan toa ra chu y'],
  // giấy ghi chú
  ['orn-washi-ngang', 'Băng dính washi ngang', O, 'bang dinh washi giay'],
  ['orn-washi-cheo', 'Băng dính washi chéo', O, 'bang dinh washi cheo giay'],
  ['orn-note-vuong', 'Giấy note vuông', O, 'giay note ghi chu'],
  ['orn-note-gap-goc', 'Giấy note gấp góc', O, 'giay note gap goc ghi chu'],
  ['orn-kep-giay-2', 'Kẹp giấy', O, 'kep giay ghi chu'],
  ['orn-ghim-tron', 'Ghim đầu tròn', O, 'ghim dau tron bang ghim'],
  ['orn-giay-xe', 'Mảnh giấy xé', O, 'manh giay xe'],
  ['orn-giay-ke-dong', 'Giấy kẻ dòng', O, 'giay ke dong vo lo gay'],
  ['orn-the-treo', 'Thẻ treo', O, 'the treo day nhan'],
  ['orn-nhan-tron', 'Nhãn dán tròn', O, 'nhan dan tron sticker'],
  ['orn-nhan-rang-cua', 'Nhãn dán răng cưa', O, 'nhan dan rang cua sticker'],
  ['orn-kep-buom', 'Kẹp bướm', O, 'kep buom giay'],
  // ô chứa chữ
  ['orn-thoai-tron', 'Bong bóng thoại tròn', O, 'bong bong hoi thoai tron'],
  ['orn-thoai-vuong', 'Bong bóng thoại vuông', O, 'bong bong hoi thoai vuong'],
  ['orn-suy-nghi', 'Bong bóng suy nghĩ', O, 'bong bong suy nghi'],
  ['orn-ruy-bang-ngang', 'Ruy băng tiêu đề', O, 'ruy bang tieu de'],
  ['orn-ruy-bang-cong', 'Ruy băng cong', O, 'ruy bang cong tieu de'],
  ['orn-banner-duoi', 'Banner hai đuôi', O, 'banner hai duoi tieu de'],
  ['orn-khung-tieu-de', 'Khung tiêu đề bo tròn', O, 'khung tieu de bo tron'],
  ['orn-khung-ngoac-nhon', 'Khung ngoặc nhọn', O, 'khung ngoac nhon'],
  ['orn-bang-den', 'Bảng đen', O, 'bang den lop hoc khung'],
  ['orn-bang-ghim', 'Bảng ghim', O, 'bang ghim khung'],
  ['orn-bien-chi-dan', 'Biển chỉ dẫn', O, 'bien chi dan mui ten o chu'],
  ['orn-danh-dau-trang', 'Thẻ đánh dấu trang', O, 'the danh dau trang bookmark'],
  // góc và nền
  ['orn-cum-cham-bi', 'Cụm chấm bi', O, 'cham bi nen goc'],
  ['orn-o-li', 'Mảng ô li', O, 'o li tap vo nen'],
  ['orn-ke-o-vuong', 'Mảng kẻ ô vuông', O, 'ke o vuong nen'],
  ['orn-song-song-song', 'Đường sóng song song', O, 'duong song nen'],
  ['orn-confetti', 'Confetti', O, 'confetti phao giay le hoi'],
  ['orn-cum-sao-lap-lanh', 'Cụm sao lấp lánh', O, 'sao lap lanh'],
  ['orn-cum-hinh-hoc', 'Cụm hình học', O, 'hinh hoc tron tam giac vuong'],
  ['orn-goc-hoa-la', 'Góc hoa lá', O, 'goc hoa la trang tri'],
  ['orn-goc-cham-tron', 'Góc chấm tròn', O, 'goc cham tron'],
  ['orn-co-duoi-nheo', 'Dải cờ đuôi nheo', O, 'co duoi nheo le hoi'],
  ['orn-vong-tron-long', 'Vòng tròn lồng nhau', O, 'vong tron long nhau'],
  ['orn-soc-cheo', 'Mảng sọc chéo', O, 'soc cheo nen'],
  // doodle học đường
  ['orn-but-chi', 'Bút chì', O, 'but chi doodle hoc duong'],
  ['orn-thuoc-ke', 'Thước kẻ', O, 'thuoc ke doodle'],
  ['orn-bong-den-2', 'Bóng đèn ý tưởng', O, 'bong den y tuong doodle'],
  ['orn-tia-nang', 'Tia sáng mặt trời', O, 'mat troi tia sang doodle'],
  ['orn-dam-may', 'Đám mây nhỏ', O, 'dam may doodle'],
  ['orn-sao-nam-canh', 'Ngôi sao năm cánh', O, 'ngoi sao doodle'],
  ['orn-tim-nho', 'Trái tim nhỏ', O, 'trai tim doodle'],
  ['orn-tia-chop', 'Tia chớp', O, 'tia chop doodle'],
  ['orn-cham-hoi', 'Dấu chấm hỏi', O, 'dau cham hoi cau hoi doodle'],
  ['orn-cham-than', 'Dấu chấm than', O, 'dau cham than chu y doodle'],
  ['orn-kinh-lup', 'Kính lúp', O, 'kinh lup tim kiem doodle'],
  ['orn-chiec-la', 'Chiếc lá', O, 'chiec la doodle'],
]
