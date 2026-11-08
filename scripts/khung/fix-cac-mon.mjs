import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'

const SRC = fileURLToPath(new URL('./ban-goc/', import.meta.url))
const OUT = fileURLToPath(new URL('../../src/data/', import.meta.url))
const NGAY = '08/11/2026'

const load = (f) => JSON.parse(readFileSync(SRC + f, 'utf8'))
const find = (d, id) => {
  for (const l of d.lop) {
    const c = l.chuong.find((x) => x.id === id)
    if (c) return c
  }
  throw new Error('không thấy ' + id)
}
const lop = (d, n) => d.lop.find((l) => l.lop === n)
const replaceIn = (arr, re, val) => {
  const i = arr.findIndex((s) => re.test(s))
  if (i < 0) throw new Error('không khớp ' + re)
  if (val === null) arr.splice(i, 1)
  else arr[i] = val
}
const renameId = (d, from, to) => {
  find(d, from).id = to
  for (const e of d.cau_truc_de || []) if (Array.isArray(e.pham_vi)) e.pham_vi = e.pham_vi.map((x) => (x === from ? to : x))
}
// ký tự lạ (chữ Hán, chữ Thái…) lọt vào khi agent sinh văn bản
const cleanText = (s) => s.replace(/[\u0E00-\u0E7F\u3040-\u30FF\u4E00-\u9FFF]+/g, '')
const deepClean = (v) =>
  typeof v === 'string' ? cleanText(v) : Array.isArray(v) ? v.map(deepClean) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepClean(x)])) : v
const note = (d, n, s) => {
  const l = lop(d, n)
  l.ghi_chu_chua_chac = l.ghi_chu_chua_chac || []
  l.ghi_chu_chua_chac.push(s)
}
const save = (d, name, sua) => {
  d = deepClean(d)
  d.phien_ban = `Claude rà soát ${NGAY}: ${sua}`
  writeFileSync(OUT + name, JSON.stringify(d, null, 2) + '\n')
  console.log(name, d.lop.map((l) => `L${l.lop}:${l.chuong.length}`).join(' '))
}

// ---------------- Vật lí
{
  const d = load('khung_ly_10_12.json')
  renameId(d, 't10-dong-hoc', 'ly10-dong-hoc')
  replaceIn(find(d, 'ly10-dong-luc-hoc').chua_duoc_dung, /Moment lực/, null)
  find(d, 'ly10-dong-luc-hoc').luu_y_ra_de += ' Moment lực và điều kiện cân bằng của vật rắn thuộc chương Động lực học (theo chương trình), không phải chương Biến dạng.'
  lop(d, 12).chuyen_de = [
    'Chuyên đề 1: Dòng điện xoay chiều',
    'Chuyên đề 2: Một số ứng dụng vật lí trong chẩn đoán y học',
    'Chuyên đề 3: Vật lí lượng tử',
  ]
  note(d, 12, 'Mức độ dòng điện xoay chiều trong phần bắt buộc lớp 12 (chỉ khái niệm, giá trị hiệu dụng) cần đối chiếu thêm SGK.')
  save(d, 'khungLy.json', 'đổi id ly10-dong-hoc; moment lực thuộc Động lực học; sửa tên chuyên đề lớp 12.')
}

// ---------------- Hoá học
{
  const d = load('khung_hoa_10_12.json')
  const c = find(d, 'hoa11-nitrogen-phosphorus')
  c.ten = 'Nitrogen và sulfur'
  renameId(d, 'hoa11-nitrogen-phosphorus', 'hoa11-nitrogen-sulfur')
  c.chua_duoc_dung.push('Phosphorus và hợp chất của phosphorus, phân lân chi tiết (chương trình 2018 không còn phần phosphorus riêng như SGK 2006)')
  c.luu_y_ra_de = 'Chương này là "Nitrogen và sulfur" (sulfur, sulfur dioxide, sulfuric acid chuyển từ lớp 10 cũ lên). Không có phần phosphorus riêng. Bổ sung nội dung hiện tượng phú dưỡng, mưa acid. Giảm tải bài toán kim loại tác dụng HNO3 nhiều sản phẩm khử.'
  find(d, 'hoa11-dai-cuong-huu-co').luu_y_ra_de = find(d, 'hoa11-dai-cuong-huu-co').luu_y_ra_de.replace('Đề thi bắt buộc có dạng bài đọc tín hiệu từ phổ MS và IR.', 'Đề thường có câu đọc phổ IR (nhóm chức) hoặc MS (phân tử khối) ở mức đơn giản.')
  save(d, 'khungHoa.json', 'lớp 11 chương "Nitrogen và sulfur" (không có phosphorus); giảm mức "bắt buộc" của câu phổ MS/IR.')
}

// ---------------- Sinh học
{
  const d = load('khung_sinh_10_12.json')
  lop(d, 11).chuyen_de = [
    'Chuyên đề 1: Dinh dưỡng khoáng – tăng năng suất cây trồng và nông nghiệp sạch',
    'Chuyên đề 2: Một số bệnh dịch ở người và cách phòng ngừa, điều trị',
    'Chuyên đề 3: Vệ sinh an toàn thực phẩm',
  ]
  lop(d, 12).chuyen_de = ['Chuyên đề 1: Sinh học phân tử', 'Chuyên đề 2: Kiểm soát sinh học', 'Chuyên đề 3: Sinh thái nhân văn']
  save(d, 'khungSinh.json', 'sửa tên chuyên đề lớp 11, 12.')
}

// ---------------- Tin học
{
  const d = load('khung_tin_6_12.json')
  renameId(d, 'sinh6-mang-may-tinh-internet', 'tin6-mang-may-tinh-internet')
  const py = find(d, 'tin10-lap-trinh-python-co-ban')
  py.chua_duoc_dung = py.chua_duoc_dung.filter((s) => !/def/.test(s))
  py.kien_thuc_duoc_dung = [...(py.kien_thuc_duoc_dung || []), 'Hàm tự định nghĩa def/return, tham số của hàm (có trong Tin học 10 phần chung, ví dụ KNTT bài "Chương trình con và thư viện các chương trình có sẵn")']
  py.luu_y_ra_de = (py.luu_y_ra_de || '') + ' Lớp 10 có học hàm tự định nghĩa (def), kiểu list và xâu.'
  const oop = find(d, 'tin12-lap-trinh-huong-doi-tuong-oop-cs')
  oop.chua_duoc_dung.unshift('Lập trình hướng đối tượng (class, đối tượng, kế thừa): KHÔNG có trong chương trình GDPT 2018 — không ra đề')
  oop.luu_y_ra_de = 'CẢNH BÁO: tên và nội dung chương này chưa khớp chương trình (GDPT 2018 không có OOP). Không dùng làm căn cứ ra đề cho tới khi đối chiếu lại mục lục Tin học 12 định hướng CS.'
  for (const n of [11, 12]) note(d, n, 'Việc gán định hướng chung / ICT / CS cho từng chủ đề lớp 11–12 chưa đối chiếu với mục lục SGK (ví dụ: CSDL lớp 11 và HTML/CSS lớp 12 có thể thuộc phần chung). Cần agent làm lại phần này.')
  note(d, 12, 'Cấu trúc đề tốt nghiệp Tin học: kiểm tra lại Phần II (bao nhiêu câu Đúng/Sai thuộc phần chung, bao nhiêu thuộc phần riêng ICT/CS).')
  save(d, 'khungTin.json', 'đổi id tin6-mang-may-tinh-internet; lớp 10 có học def; cảnh báo chương OOP lớp 12 và phân định hướng lớp 11–12 chưa đối chiếu.')
}

// ---------------- Ngữ văn
{
  const d = load('khung_van_6_12.json')
  save(d, 'khungVan.json', 'không phát hiện lỗi lớn; các mục "chưa được dùng" lớp 12 khá chung chung.')
}

// ---------------- Lịch sử
{
  const d = load('khung_su_6_12.json')
  const l11 = lop(d, 11)
  const i = l11.chuong.findIndex((c) => c.id === 'su11-lich-su-doi-ngoai-viet-nam')
  l11.chuong.splice(i, 1, {
    id: 'su11-gianh-doc-lap-dong-nam-a',
    ten: 'Chủ đề 3: Quá trình giành độc lập dân tộc của các quốc gia Đông Nam Á',
    hoc_ky: 1,
    mach: 'Lịch sử khu vực',
    ten_theo_sach: { KNTT: 'Chủ đề 3. Quá trình giành độc lập dân tộc của các quốc gia Đông Nam Á', CTST: '(đối chiếu mục lục)', CD: '(đối chiếu mục lục)' },
    yeu_cau_can_dat: [
      'Trình bày được nét chính về quá trình xâm lược và cai trị của chủ nghĩa thực dân ở Đông Nam Á',
      'Nêu được nét chính về hành trình đi đến độc lập dân tộc ở Đông Nam Á: các giai đoạn, phong trào tiêu biểu',
      'Nêu được nét chính về cuộc đấu tranh giành độc lập ở Việt Nam trong bối cảnh khu vực (liên hệ)',
    ],
    pham_vi_thoi_gian: 'thế kỷ XVI – nửa sau thế kỷ XX',
    su_kien_moc: [
      '1511 – Bồ Đào Nha chiếm Ma-lắc-ca',
      'Cuối thế kỷ XIX – hầu hết Đông Nam Á (trừ Xiêm) thành thuộc địa',
      '17/8/1945 – In-đô-nê-xi-a tuyên bố độc lập',
      '2/9/1945 – Việt Nam Dân chủ Cộng hoà ra đời',
      '1984 – Bru-nây độc lập',
      '2002 – Đông Ti-mo độc lập',
    ],
    nhan_vat: ['Xu-các-nô', 'Hồ Chí Minh'],
    khai_niem: ['chủ nghĩa thực dân', 'thuộc địa', 'giải phóng dân tộc'],
    kien_thuc_duoc_dung: ['Đông Nam Á cổ – trung đại (lớp 6, 7, 10)', 'Đông Nam Á thế kỷ XVI–XIX (lớp 8)'],
    chua_duoc_dung: ['ASEAN và các chặng đường phát triển (lớp 12 Chủ đề 2)', 'Lịch sử đối ngoại Việt Nam thời cận – hiện đại (lớp 12 Chủ đề 5)'],
    dang_bai_dien_hinh: ['Đọc lược đồ thuộc địa Đông Nam Á cuối thế kỷ XIX', 'Sắp xếp mốc giành độc lập của các nước', 'So sánh con đường giành độc lập của các nước', 'Khai thác tư liệu về một phong trào tiêu biểu'],
    luu_y_ra_de: 'Chủ đề này do Claude thêm khi rà soát (agent bỏ sót, thay vào chủ đề "đối ngoại thời trung đại" không có trong lớp 11). Các mốc đã kiểm; tên bài theo CTST, CD cần đối chiếu.',
  })
  find(d, 'su12-doi-ngoai-viet-nam-hien-dai').chua_duoc_dung = find(d, 'su12-doi-ngoai-viet-nam-hien-dai').chua_duoc_dung.map((s) =>
    /Lớp 11 Chủ đề 6/.test(s) ? 'Lịch sử đối ngoại thời phong kiến (không phải trọng tâm; chương trình lớp 12 là thời cận – hiện đại)' : s,
  )
  const hcm = find(d, 'su12-ho-chi-minh-trong-lich-su-viet-nam')
  hcm.su_kien_moc = hcm.su_kien_moc.map((s) => s.replace('Ngày 3/2/1930 – Chủ tịch Hồ Chí Minh thành lập', 'Đầu năm 1930 (6/1–7/2) – Nguyễn Ái Quốc chủ trì hội nghị hợp nhất, thành lập'))
  note(d, 11, 'Chủ đề "Quá trình giành độc lập dân tộc của các quốc gia Đông Nam Á" do Claude thêm; thứ tự học kỳ theo KNTT.')
  save(d, 'khungSu.json', 'lớp 11 thay chủ đề "đối ngoại thời trung đại" (không có) bằng "Quá trình giành độc lập dân tộc của các quốc gia Đông Nam Á"; sửa mốc thành lập Đảng; xoá ký tự lạ.')
}
