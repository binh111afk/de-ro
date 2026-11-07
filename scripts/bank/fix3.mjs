// Sửa sau khi Claude tự giải lại 600 câu GLM soạn (scripts/bank/new). Chạy một lần: node fix3.mjs
import fs from 'node:fs'
const D = 'new/'
const load = (f) => JSON.parse(fs.readFileSync(D + f, 'utf8'))
const save = (f, a) => fs.writeFileSync(D + f, JSON.stringify(a, null, 2) + '\n')
const files = {}
const get = (f) => (files[f] ??= load(f))
// q(file, số thứ tự 1-based) — trả về câu để sửa
const q = (f, n) => get(f)[n - 1]
const opt = (f, n, key, text) => { q(f, n).options.find((o) => o.key === key).text = text }
const del = []

// ---- Toán ----
q('toan-b.json', 13).answer = 'ĐĐSĐ' // d: π∫(x²+1)² = 28π/15 đúng
q('toan-b.json', 23).prompt = 'Thể tích khối tròn xoay tạo thành khi quay hình phẳng giới hạn bởi $y=x^2+2$, $x=0$, $x=1$ và trục $Ox$ quanh trục $Ox$ là $V$. Giá trị của $\\frac{V}{\\pi}$ làm tròn đến hàng phần mười là bao nhiêu?'
q('toan-b.json', 23).answer = '5,5' // 83/15
q('toan-c.json', 13).answer = 'SĐSĐ' // d(A,P)=4/3 đúng; (1;2;-2) là VTPT
q('toan-c.json', 17).prompt = q('toan-c.json', 17).prompt.replace('đến điểm thả hàng $T$', 'đến điểm thả hàng $T$ với $\\vec{KT}=\\vec{u}$')
q('toan-d.json', 13).answer = 'ĐĐSĐ' // P(II|xanh)=0,35/0,55=7/11
q('toan-d.json', 17).answer = 'ĐĐSS' // không hai nam cạnh nhau: 144/720 = 0,2
q('toan-d.json', 24).prompt = q('toan-d.json', 24).prompt.replace('Trong một lớp học,', 'Một lớp học có 25 học sinh, trong đó')
q('toan-e.json', 14).answer = 'SSSĐ' // SA=√(34/3), góc ≈ 47°, V=4√2
q('toan-e.json', 14).figure.shape = 'pyramid3-regular'
q('toan-e.json', 23).answer = '8' // (AB'C'): x−z=0, d=2√2

// ---- Vật lí ----
opt('ly-a.json', 5, 'A', '$1\\cdot10^{5}$ Pa') // p2 = p1V1/V2
q('ly-a.json', 5).figure.states = '1: (2; 2)\n2: (4; 1)'
q('ly-a.json', 7).figure.processes = '1-2: đoạn thẳng\n2-3: đẳng áp\n3-1: đẳng tích' // công = diện tích tam giác = 8 J
q('ly-a.json', 7).prompt = q('ly-a.json', 7).prompt.replace('chu trình kín như hình bên dưới', 'chu trình kín 1 → 2 → 3 → 1 như hình bên dưới (1 → 2 là đoạn thẳng)')
q('ly-a.json', 12).prompt = q('ly-a.json', 12).prompt.replace(' (tính trên)', '')
q('ly-a.json', 19).answer = 'SĐĐĐ' // T2 = 4T1 nên b đúng
q('ly-a.json', 25).prompt = 'Một mol khí lí tưởng ở 300 K đặt trong bình 10 lít. Áp suất của khí xấp xỉ bằng $x\\cdot10^{5}$ Pa. Giá trị của $x$ (làm tròn đến hàng phần mười) là bao nhiêu?'
q('ly-a.json', 29).answer = '6' // diện tích tam giác ½·4·3 (đơn vị SI)
q('ly-b.json', 21).answer = 'ĐĐĐĐ' // R_N = 4 + 3 = 7 Ω
q('ly-b.json', 22).answer = 'ĐĐĐS'
q('ly-b.json', 22).prompt = q('ly-b.json', 22).prompt.replace('Khi truyền ở điện áp 10 kV.', 'Điện áp truyền đi là 10 kV, coi hệ số công suất bằng 1.')
q('ly-d.json', 11).prompt = q('ly-d.json', 11).prompt.replace('Một vật khối lượng treo', 'Một vật treo')
q('ly-d.json', 19).prompt = q('ly-d.json', 19).prompt.replace('chuyển động thẳng biến đổi đều có', 'chuyển động thẳng có')
q('ly-d.json', 30).prompt = 'Một vật dao động điều hòa với chu kì 0,6 s, biên độ 10 cm. Thời gian ngắn nhất để vật đi từ vị trí biên dương đến vị trí có li độ 5 cm, tính bằng giây, là bao nhiêu?'
del.push(['ly-d.json', 21]) // trùng y hệt ly-b #21

// ---- Hoá học ----
q('hoa-a.json', 16).prompt = 'Este $X$ đơn chức có khối lượng mol 88. Thủy phân $X$ trong dung dịch NaOH thu được muối của axit cacboxylic $Y$ và ancol $Z$; oxi hóa $Z$ bằng CuO rồi oxi hóa tiếp thu được chính axit $Y$. Xà phòng hóa hoàn toàn 4,4 g $X$ bằng NaOH vừa đủ, khối lượng muối khan thu được sau khi cô cạn dung dịch là:'
q('hoa-a.json', 25).prompt = q('hoa-a.json', 25).prompt.replace('(dư vừa đủ)', '(vừa đủ)')
q('hoa-a.json', 26).prompt = 'Este $X$ thủy phân trong axit loãng cho axit $Y$ và ancol $T$; oxi hóa hoàn toàn $T$ thu được chính axit $Y$. Biết $Y$ là axit fomic. Khối lượng $X$ thu được tối đa khi este hóa 4,6 g axit $Y$ với lượng $T$ vừa đủ là bao nhiêu gam?'
q('hoa-b.json', 5).prompt = 'Cho pin điện hóa Zn–Cu gồm điện cực Zn nhúng trong dung dịch $\\text{ZnSO}_4$ và điện cực Cu nhúng trong dung dịch $\\text{CuSO}_4$. Biết $E^{\\circ}(\\text{Zn}^{2+}/\\text{Zn})=-0{,}76$ V và $E^{\\circ}(\\text{Cu}^{2+}/\\text{Cu})=+0{,}34$ V. Suất điện động chuẩn của pin là:'
opt('hoa-b.json', 14, 'C', '$\\text{NH}_4\\text{Cl}$ (dạng hồ)')
q('hoa-c.json', 5).prompt = q('hoa-c.json', 5).prompt.replace('(dư vừa đủ)', '(dư)')
q('hoa-c.json', 10).prompt = q('hoa-c.json', 10).prompt.replace('(dư vừa đủ)', '(dư)')
q('hoa-c.json', 12).prompt = q('hoa-c.json', 12).prompt.replace('phản ứng phân hạch hoàn toàn', 'phản ứng phân hủy hoàn toàn')
opt('hoa-c.json', 19, 'c', 'Trong $[\\text{Cu(NH}_3)_4]\\text{SO}_4$, phân tử $\\text{NH}_3$ đóng vai trò phối tử.')
opt('hoa-e.json', 15, 'D', '1,41') // 4x² − 17x + 16 = 0 → x ≈ 1,41
q('hoa-e.json', 26).answer = '0,36' // [B] = 9[A], [A]+[B] = 0,4

// ---- Sinh học ----
q('sinh-a.json', 5).prompt = 'Một gen có tổng số 3000 nuclêôtit, trong đó số nuclêôtit loại A là 600. Số nuclêôtit loại G của gen là:'
q('sinh-a.json', 10).prompt = q('sinh-a.json', 10).prompt.replace('Tỉ lệ con đực mắt trắng ở đời con là:', 'Trong số các con đực ở đời con, tỉ lệ con mắt trắng là:')
q('sinh-a.json', 18).prompt = 'Xét một phả hệ: cặp cha mẹ đều bình thường sinh ra một con gái bị bệnh và các con trai đều bình thường; trong quần thể bệnh này hiếm gặp. Xét tính đúng sai của các khẳng định sau:'
opt('sinh-a.json', 18, 'c', 'Các con trai bình thường chắc chắn không mang alen bệnh.')
opt('sinh-a.json', 18, 'd', 'Xác suất con kế tiếp (sinh từ cùng cặp cha mẹ) bị bệnh là 1/2.')
q('sinh-a.json', 18).answer = 'ĐĐSS'
opt('sinh-a.json', 19, 'd', 'Sau một thế hệ tự thụ phấn, tỉ lệ cá thể dị hợp giảm còn 42%.')
q('sinh-a.json', 20).prompt = 'Một gen có tổng số 1500 nuclêôtit, trong đó số nuclêôtit loại A là 300. Số nuclêôtit loại G của gen là bao nhiêu?'
q('sinh-a.json', 22).prompt = 'Một cơ thể có kiểu gen $AaBb$, hai cặp gen nằm trên hai cặp NST khác nhau. Số loại giao tử tối đa cơ thể này tạo ra (giảm phân bình thường) là bao nhiêu?'
q('sinh-a.json', 23).prompt = 'Một gen có 900 nuclêôtit. Số bộ ba (côđon) trên phân tử mARN do gen này phiên mã là bao nhiêu?'
q('sinh-b.json', 1).prompt = 'Theo Đacuyn, ba yếu tố cơ bản của quá trình tiến hóa là:'
q('sinh-b.json', 2).prompt = 'Nhân tố tiến hóa làm biến đổi tần số alen một cách ngẫu nhiên, không định hướng trong quần thể (rõ rệt nhất ở quần thể nhỏ) là:'
opt('sinh-b.json', 2, 'B', 'các yếu tố ngẫu nhiên (phiêu bạt di truyền)')
for (const n of [15, 25]) q('sinh-b.json', n).prompt = q('sinh-b.json', n).prompt.replace('logistical', 'logistic').replace('tốc độ tăng thể hiện', 'tốc độ tăng trưởng riêng')
q('sinh-b.json', 16).answer = 'ĐĐSĐ' // auxin kích thích ra rễ cành giâm
q('sinh-b.json', 18).answer = 'ĐĐSĐ' // hô hấp tế bào chủ yếu trong ti thể

// ---- Tiếng Anh ----
for (const f of ['anh-a.json']) for (const x of get(f)) x.prompt = x.prompt.replace(/\n\n(?:[A-D]\. .*(?:\n|$))+$/, '').trimEnd()
opt('anh-a.json', 7, 'A', 'put')
for (const n of [22, 23, 24, 25]) q('anh-a.json', n).level = 'VD'
{
  const b = get('anh-b.json')
  let passage = ''
  for (const x of b) {
    if (x.prompt.startsWith('Read the passage and choose')) passage = x.prompt.split('\n\n').slice(0, 2).join('\n\n')
    else if (x.prompt.startsWith('Read the passage (thông tin như câu trước)')) x.prompt = passage + '\n\n' + x.prompt.split('\n\n').slice(1).join('\n\n')
    x.prompt = x.prompt.replace(/ in paragraph [12]/g, ' in the passage')
  }
}

// ---- Lịch sử ----
opt('su.json', 8, 'D', 'cứ điểm Đông Khê')
q('su.json', 8).prompt = 'Chiến dịch Biên giới thu – đông năm 1950 của Quân đội nhân dân Việt Nam được mở đầu bằng trận tiến công:'
q('su.json', 9).prompt = q('su.json', 9).prompt.replace('Nghị quyết Trung ương 13 (1/1959)', 'Nghị quyết Hội nghị Trung ương lần thứ 15 (1/1959)')
opt('su.json', 24, 'A', 'Pháp trút gánh nặng khủng hoảng lên thuộc địa, tăng thuế, vơ vét bóc lột khiến đời sống nhân dân Đông Dương cực khổ, mâu thuẫn xã hội ngày càng gay gắt')
q('su.json', 25).prompt = 'Đọc tư liệu sau: "Hỡi đồng bào cả nước! Tất cả mọi người đều sinh ra có quyền bình đẳng. Tạo hóa cho họ những quyền không ai có thể xâm phạm được; trong những quyền ấy, có quyền được sống, quyền tự do và quyền mưu cầu hạnh phúc. Lời bất hủ ấy ở trong bản Tuyên ngôn Độc lập năm 1776 của nước Mĩ. [...] Bản Tuyên ngôn Nhân quyền và Dân quyền của Cách mạng Pháp năm 1791 cũng nói: Người ta sinh ra tự do và bình đẳng về quyền lợi; và phải luôn luôn được tự do và bình đẳng về quyền lợi."\n\n(Trích Tuyên ngôn Độc lập đọc ngày 2/9/1945). Xét tính đúng sai của các khẳng định sau:'

// ---- Địa lí ----
q('dia.json', 5).prompt = 'Sông lớn nhất Đông Nam Á, đổ ra biển qua vùng Đồng bằng sông Cửu Long của nước ta là:'
q('dia.json', 20).answer = 'ĐSĐĐ' // 100,3 triệu / 331,2 nghìn km² ≈ 303 ≈ 300
q('dia.json', 23).answer = 'ĐSSĐ' // c sai: Việt Nam thuộc nhóm chịu ảnh hưởng nặng
del.push(['dia.json', 28], ['dia.json', 29]) // câu vô nghĩa (42 ha / làm tròn 8,02)

// ---- GDKT&PL ----
q('gdkt.json', 9).prompt = q('gdkt.json', 9).prompt.replace('Biết mức giảm trừ', 'Giả sử mức giảm trừ')
q('gdkt.json', 17).prompt = q('gdkt.json', 17).prompt.replace('Theo Luật thuế thu nhập cá nhân, mức giảm trừ', 'Giả sử mức giảm trừ')
opt('gdkt.json', 17, 'b', 'Thu nhập tính thuế (theo tháng) của ông N là 9 triệu đồng.')

// ---- Chung: lỗi chữ của GLM ----
for (const f of fs.readdirSync(D).filter((f) => f.endsWith('.json'))) {
  const a = get(f)
  const fixText = (s) => s.replace(/Suất phản động/g, 'Suất điện động').replace(/suất phản động/g, 'suất điện động').replace(/nucleôtít/g, 'nuclêôtit')
  for (const x of a) {
    x.prompt = fixText(x.prompt)
    if (x.explanation) x.explanation = fixText(x.explanation)
    for (const o of x.options ?? []) o.text = fixText(o.text)
  }
}
for (const [f, n] of del.sort((a, b) => b[1] - a[1])) get(f).splice(n - 1, 1)
for (const [f, a] of Object.entries(files)) save(f, a)
console.log('Đã sửa', Object.keys(files).length, 'file')
