import { readFileSync, writeFileSync } from 'node:fs'

const [src, out] = process.argv.slice(2)
const d = JSON.parse(readFileSync(src, 'utf8'))
const lop = (n) => d.lop.find((l) => l.lop === n)
const ch = (id) => {
  for (const l of d.lop) {
    const c = l.chuong.find((x) => x.id === id)
    if (c) return c
  }
  throw new Error('không thấy ' + id)
}
const replaceIn = (arr, re, val) => {
  const i = arr.findIndex((s) => re.test(s))
  if (i < 0) throw new Error('không khớp ' + re)
  if (val === null) arr.splice(i, 1)
  else arr[i] = val
}
const insertAfter = (n, afterId, chuong) => {
  const l = lop(n)
  const i = l.chuong.findIndex((c) => c.id === afterId)
  if (i < 0) throw new Error('không thấy ' + afterId)
  l.chuong.splice(i + 1, 0, chuong)
}

// ---- Lớp 6
replaceIn(ch('t6-hinh-hoc-truc-quan-6').chua_duoc_dung, /hình tròn/, 'Công thức chu vi, diện tích hình tròn, hình quạt (học ở lớp 9)')
ch('t6-hinh-hoc-truc-quan-6').chua_duoc_dung = ch('t6-hinh-hoc-truc-quan-6').chua_duoc_dung.map((s) => s.replace('Định lý Định lí Pitago', 'Định lí Pythagore (lớp 8)'))
replaceIn(ch('t6-thong-ke-xac-suat').chua_duoc_dung, /Xác suất lý thuyết/, 'Xác suất tính bằng tỉ số kết quả thuận lợi / số kết quả có thể (học từ lớp 8)')
replaceIn(ch('t6-thong-ke-xac-suat').chua_duoc_dung, /Số trung bình cộng/, 'Số trung bình, trung vị, mốt của mẫu số liệu (học ở lớp 10)')

// ---- Lớp 7
for (const id of ['t7-tam-giac-bang-nhau']) {
  const c = ch(id)
  c.chua_duoc_dung = c.chua_duoc_dung.map((s) => s.replace('Định lý Định lí Pitago', 'Định lí Pythagore'))
  c.luu_y_ra_de = c.luu_y_ra_de.replaceAll('Định lý Định lí Pitago', 'Định lí Pythagore').replace('Định lí Pitago', 'Định lí Pythagore')
}
replaceIn(ch('t7-thong-ke').chua_duoc_dung, /Trung bình cộng/, 'Các số đặc trưng: số trung bình, trung vị, mốt (học ở lớp 10)')
replaceIn(ch('t7-thong-ke').chua_duoc_dung, /ghép nhóm/, 'Bảng tần số, tần số ghép nhóm (học ở lớp 9)')

// ---- Lớp 8
{
  const c = ch('t8-dinh-ly-thales-va-tam-giac-dong-dang')
  c.yeu_cau_can_dat = c.yeu_cau_can_dat.map((s) =>
    s.replace(/đường phân giác trong và ngoài của tam giác/, 'đường phân giác trong của tam giác').replaceAll('Định lý Định lí Pitago', 'Định lí Pythagore'),
  )
  c.chua_duoc_dung.push('Tính chất đường phân giác NGOÀI của tam giác (chương trình chỉ có phân giác trong)')
  c.luu_y_ra_de = 'Định lí Pythagore (thuận và đảo) học chính thức ở lớp 8. Học sinh được dùng Pythagore và tam giác đồng dạng để tính độ dài. Chỉ dùng tính chất đường phân giác trong.'
}
replaceIn(ch('t8-hang-dang-thuc').chua_duoc_dung, /Nghiệm phức/, 'Căn bậc hai, biến đổi biểu thức chứa căn (lớp 9)')
replaceIn(ch('t8-phan-thuc').chua_duoc_dung, /Phương trình chứa ẩn ở mẫu/, 'Phương trình chứa ẩn ở mẫu (mọi dạng, học ở lớp 9)')
ch('t8-phan-thuc').luu_y_ra_de = 'Chỉ ra bài rút gọn, tính giá trị phân thức mà mẫu phân tích được bằng hằng đẳng thức / đặt nhân tử chung. Lớp 8 chưa giải phương trình chứa ẩn ở mẫu (học ở lớp 9).'
ch('t8-thong-ke-xac-suat-8').chua_duoc_dung = ch('t8-thong-ke-xac-suat-8').chua_duoc_dung.map((s) =>
  /ghép nhóm/.test(s) ? 'Bảng tần số ghép nhóm (học ở lớp 9)' : s,
)

// ---- Lớp 9
{
  const c = ch('t9-duong-tron-co-ban')
  replaceIn(c.chua_duoc_dung, /hai đường tròn/, null)
  c.yeu_cau_can_dat.push('Nhận biết được vị trí tương đối của hai đường tròn (cắt nhau, tiếp xúc trong/ngoài, không giao nhau) qua hệ thức giữa đoạn nối tâm và hai bán kính')
  c.dang_bai_dien_hinh.push('Xác định vị trí tương đối của hai đường tròn khi biết khoảng cách tâm và bán kính')
  c.luu_y_ra_de = 'Có học vị trí tương đối của đường thẳng và đường tròn, của hai đường tròn (mức nhận biết, tính toán đơn giản). Góc nội tiếp, tứ giác nội tiếp học ở học kỳ 2.'
}
{
  const c = ch('t9-goc-voi-duong-tron-tu-giac-noi-tiep')
  replaceIn(c.chua_duoc_dung, /Phép vị tự, phép quay/, 'Phép vị tự, phép dời hình tổng quát (chuyên đề lớp 11)')
}
{
  const c = ch('t9-thong-ke-tan-so')
  c.ten = 'Tần số, tần số tương đối và tần số ghép nhóm'
  c.yeu_cau_can_dat.push(
    'Nhận biết được mẫu số liệu ghép nhóm; lập được bảng tần số ghép nhóm, bảng tần số tương đối ghép nhóm',
    'Đọc và vẽ được biểu đồ tần số / tần số tương đối ghép nhóm (dạng cột, đoạn thẳng)',
  )
  replaceIn(c.chua_duoc_dung, /ghép nhóm/, 'Số đặc trưng của mẫu ghép nhóm: trung bình, trung vị, tứ phân vị, mốt (lớp 11); phương sai, độ lệch chuẩn ghép nhóm (lớp 12)')
  c.dang_bai_dien_hinh.push('Lập bảng tần số ghép nhóm từ dãy số liệu thực tế (chiều cao, điểm thi, thời gian)')
  c.luu_y_ra_de = 'Lớp 9 có bảng tần số ghép nhóm nhưng CHỈ lập bảng và vẽ biểu đồ; chưa tính số trung bình, trung vị, phương sai của mẫu ghép nhóm.'
}
insertAfter(9, 't9-he-phuong-trinh-bac-nhat', {
  id: 't9-phuong-trinh-quy-ve-bac-nhat',
  ten: 'Phương trình quy về phương trình bậc nhất một ẩn',
  hoc_ky: 1,
  ten_theo_sach: {
    KNTT: 'Chương II. Phương trình và bất phương trình bậc nhất một ẩn (Bài 4. Phương trình quy về phương trình bậc nhất một ẩn)',
    CTST: 'Chương 2. Phương trình và bất phương trình bậc nhất một ẩn (Bài 1. Phương trình quy về phương trình bậc nhất một ẩn)',
    CD: 'Chương II. Bất đẳng thức. Bất phương trình bậc nhất một ẩn — phần phương trình tích, phương trình chứa ẩn ở mẫu nằm ở Chương I/II tuỳ sách',
  },
  yeu_cau_can_dat: [
    'Giải được phương trình tích có dạng (a1x + b1)(a2x + b2) = 0',
    'Giải được phương trình chứa ẩn ở mẫu quy về phương trình bậc nhất (tìm điều kiện xác định, quy đồng, khử mẫu, đối chiếu điều kiện)',
    'Giải được bài toán thực tế dẫn đến phương trình chứa ẩn ở mẫu (năng suất, vận tốc, thời gian)',
  ],
  kien_thuc_duoc_dung: ['phân tích đa thức thành nhân tử', 'hằng đẳng thức', 'phân thức đại số', 'phương trình bậc nhất một ẩn'],
  chua_duoc_dung: [
    'Phương trình bậc hai và công thức nghiệm Δ (học ở học kỳ 2 lớp 9) — phương trình chứa ẩn ở mẫu phải khử mẫu ra BẬC NHẤT hoặc phương trình tích các nhân tử bậc nhất',
    'Phương trình chứa căn (lớp 9, chương căn bậc hai, chỉ dạng đơn giản)',
    'Phương trình chứa dấu giá trị tuyệt đối',
  ],
  dang_bai_dien_hinh: [
    'Giải phương trình tích (2x − 1)(x + 3) = 0',
    'Giải phương trình chứa ẩn ở mẫu có tìm điều kiện xác định',
    'Bài toán chuyển động / năng suất lập phương trình chứa ẩn ở mẫu',
  ],
  luu_y_ra_de: 'Nội dung này chuyển từ lớp 8 (chương trình cũ) lên lớp 9. Khi ra đề học kỳ 1 lớp 9, phương trình sau khi khử mẫu chỉ được là bậc nhất hoặc tích các nhân tử bậc nhất.',
})
insertAfter(9, 't9-goc-voi-duong-tron-tu-giac-noi-tiep', {
  id: 't9-da-giac-deu-phep-quay',
  ten: 'Đa giác đều và phép quay',
  hoc_ky: 2,
  ten_theo_sach: {
    KNTT: 'Chương X (phần Đa giác đều) — Bài: Đa giác đều và phép quay',
    CTST: 'Chương 9. Đa giác đều (Bài: Đa giác đều; Phép quay)',
    CD: 'Chương VIII/IX. Đa giác đều — Phép quay',
  },
  yeu_cau_can_dat: [
    'Nhận biết được đa giác đều; tam giác đều, hình vuông, ngũ giác đều, lục giác đều nội tiếp đường tròn',
    'Nhận biết được phép quay thuận chiều, ngược chiều tâm O góc α giữ nguyên một đa giác đều',
    'Nhận ra được đa giác đều, hình có dạng đa giác đều trong tự nhiên, nghệ thuật, kiến trúc',
  ],
  kien_thuc_duoc_dung: ['góc ở tâm, góc nội tiếp', 'tứ giác nội tiếp', 'tỉ số lượng giác góc nhọn', 'độ dài cung, diện tích hình quạt'],
  chua_duoc_dung: [
    'Biểu thức toạ độ của phép quay, phép dời hình tổng quát (chuyên đề lớp 11)',
    'Góc lượng giác, radian (lớp 11) — góc quay ghi bằng độ',
  ],
  dang_bai_dien_hinh: [
    'Tính số đo góc ở tâm, góc trong của đa giác đều n cạnh',
    'Tìm các phép quay tâm O biến lục giác đều / ngũ giác đều thành chính nó',
    'Tính cạnh, bán kính đường tròn ngoại tiếp tam giác đều, hình vuông, lục giác đều',
  ],
  luu_y_ra_de: 'Phép quay chỉ ở mức nhận biết: góc quay giữ nguyên đa giác đều, không dùng toạ độ.',
})

// ---- Lớp 10
replaceIn(ch('t10-thong-ke-10').chua_duoc_dung, /ghép nhóm/, 'Số đặc trưng của mẫu số liệu ghép nhóm (xu thế trung tâm ở lớp 11, độ phân tán ở lớp 12)')
lop(10).chuyen_de = [
  'Chuyên đề 1: Hệ phương trình bậc nhất ba ẩn',
  'Chuyên đề 2: Phương pháp quy nạp toán học. Nhị thức Newton',
  'Chuyên đề 3: Ba đường conic và ứng dụng',
]

// ---- Lớp 11
{
  const c = ch('t11-xac-suat-11')
  c.yeu_cau_can_dat.splice(1, 0, 'Vận dụng công thức cộng xác suất tổng quát P(A ∪ B) = P(A) + P(B) − P(AB); trường hợp A, B xung khắc thì P(A ∪ B) = P(A) + P(B)')
  replaceIn(c.chua_duoc_dung, /Công thức cộng tổng quát/, null)
  c.luu_y_ra_de = 'Có cả công thức cộng xác suất (tổng quát và xung khắc) và quy tắc nhân cho hai biến cố độc lập. Chưa có xác suất có điều kiện, toàn phần, Bayes (lớp 12).'
}
insertAfter(11, 't11-ham-so-luong-giac-phuong-trinh-luong-giac', {
  id: 't11-mau-so-lieu-ghep-nhom',
  ten: 'Các số đặc trưng đo xu thế trung tâm của mẫu số liệu ghép nhóm',
  hoc_ky: 1,
  ten_theo_sach: {
    KNTT: 'Chương III. Các số đặc trưng đo xu thế trung tâm của mẫu số liệu ghép nhóm',
    CTST: 'Chương 4 (Tập 1). Các số đặc trưng đo xu thế trung tâm cho mẫu số liệu ghép nhóm — thứ tự có thể khác',
    CD: 'Chương III. Các số đặc trưng đo xu thế trung tâm cho mẫu số liệu ghép nhóm',
  },
  yeu_cau_can_dat: [
    'Đọc và giải thích được mẫu số liệu ghép nhóm; ghép nhóm được mẫu số liệu không ghép nhóm theo các khoảng [a_i; a_{i+1})',
    'Tính được số trung bình (dùng giá trị đại diện là trung điểm mỗi nhóm) của mẫu số liệu ghép nhóm',
    'Tính được trung vị, tứ phân vị Q1, Q3 của mẫu số liệu ghép nhóm bằng công thức nội suy',
    'Tính được mốt của mẫu số liệu ghép nhóm (nhóm chứa mốt và công thức nội suy)',
    'Giải thích ý nghĩa của các số đặc trưng trong bối cảnh thực tế',
  ],
  kien_thuc_duoc_dung: ['số trung bình, trung vị, tứ phân vị, mốt của mẫu không ghép nhóm (lớp 10)', 'bảng tần số ghép nhóm (lớp 9)'],
  chua_duoc_dung: [
    'Khoảng biến thiên, khoảng tứ phân vị, phương sai, độ lệch chuẩn của mẫu GHÉP NHÓM (học ở lớp 12)',
    'Xác suất có điều kiện (lớp 12)',
  ],
  dang_bai_dien_hinh: [
    'Đọc bảng tần số ghép nhóm, xác định nhóm chứa trung vị / mốt',
    'Tính số trung bình của mẫu ghép nhóm (thời gian, chiều cao, điểm thi)',
    'Tính trung vị, Q1, Q3, mốt bằng công thức nội suy',
    'So sánh hai mẫu ghép nhóm qua số đặc trưng',
  ],
  luu_y_ra_de: 'Đáp số trung vị, tứ phân vị, mốt thường lẻ — nêu rõ làm tròn (ví dụ đến hàng phần mười). Thứ tự chương khác nhau giữa các bộ sách (KNTT học ở học kỳ 1).',
})
lop(11).chuyen_de = [
  'Chuyên đề 1: Phép biến hình phẳng',
  'Chuyên đề 2: Làm quen với một số yếu tố của lí thuyết đồ thị',
  'Chuyên đề 3: Một số yếu tố vẽ kĩ thuật',
]

// ---- Lớp 12
{
  const c = ch('t12-ung-dung-dao-ham-khao-sat-ham-so')
  replaceIn(c.chua_duoc_dung, /trùng phương/, 'Bài KHẢO SÁT VÀ VẼ ĐỒ THỊ hàm bậc bốn trùng phương (phần khảo sát chỉ có bậc ba, (ax+b)/(cx+d), (ax²+bx+c)/(px+q))')
  c.luu_y_ra_de = 'Phần khảo sát, vẽ đồ thị chỉ gồm hàm bậc ba, phân thức bậc nhất/bậc nhất và bậc hai/bậc nhất (có tiệm cận xiên). Hàm bậc bốn trùng phương KHÔNG có bài khảo sát riêng, nhưng vẫn có thể xuất hiện trong bài xét đơn điệu, cực trị, GTLN–GTNN bằng đạo hàm.'
}
{
  const c = ch('t12-cac-so-dac-trung-do-do-phan-tan-mau-ghep-nhom')
  c.kien_thuc_duoc_dung = Array.from(new Set([...(c.kien_thuc_duoc_dung || []), 'số trung bình, tứ phân vị của mẫu ghép nhóm (lớp 11)']))
}

// ---- Bỏ các mục "chưa được dùng" vô ích (AI vốn không dùng)
const junk = /Xích Markov|Poisson|Taylor|Maclaurin|Kiểm định giả thuyết|Tích phân bội|tích phân đường|bậc đại học/i
for (const l of d.lop) for (const c of l.chuong) {
  c.chua_duoc_dung = c.chua_duoc_dung.filter((s) => !junk.test(s))
  c.ten = c.ten.replace('Định lý Thalès', 'Định lí Thalès')
}

// ---- Cấu trúc đề định kỳ: thêm quy ước phạm vi theo học kỳ
const note = 'Giữa kỳ: các chương của học kỳ đó tính đến thời điểm kiểm tra (thường khoảng nửa đầu danh sách chương có cùng hoc_ky). Cuối kỳ: toàn bộ chương có cùng hoc_ky; cuối kỳ 2 có thể ôn lại một phần học kỳ 1. Thứ tự chương khác nhau giữa các bộ sách — nên cho giáo viên chọn chương.'
for (const e of d.cau_truc_de) if (Array.isArray(e.lop)) e.pham_vi = note
d.cau_truc_de[1].ti_le_muc_do = 'Nhận biết: 40%, Thông hiểu: 30%, Vận dụng: 20%, Vận dụng cao: 10% (tỉ lệ phổ biến trong ma trận đề của các Sở, không phải quy định bắt buộc)'

d.phien_ban = 'Đã rà soát 07/11/2026: thêm 3 chương (t9-phuong-trinh-quy-ve-bac-nhat, t9-da-giac-deu-phep-quay, t11-mau-so-lieu-ghep-nhom), sửa ghép nhóm lớp 9/10/11, công thức cộng xác suất lớp 11, hàm trùng phương lớp 12, chuyên đề 10/11.'
for (const l of d.lop) l.ghi_chu_chua_chac = l.ghi_chu_chua_chac || []
lop(9).ghi_chu_chua_chac.push('Tên chương theo từng bộ sách của hai chương mới thêm (phương trình quy về bậc nhất, đa giác đều – phép quay) chưa đối chiếu mục lục bản giấy.')
lop(11).ghi_chu_chua_chac.push('Vị trí chương mẫu số liệu ghép nhóm khác nhau giữa các bộ sách (hoc_ky ghi theo KNTT).')

writeFileSync(out, JSON.stringify(d, null, 2) + '\n')
console.log(d.lop.map((l) => `lớp ${l.lop}: ${l.chuong.length} chương`).join(', '))
