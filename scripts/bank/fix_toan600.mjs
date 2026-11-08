// Sửa 600 câu Toán 10–12 (scripts/bank/toan600) sau khi Claude tự giải lại. Chạy một lần từ bản gốc:
//   rm -rf toan600 && cp -r toan600.orig toan600 && node fix_toan600.mjs
import fs from 'node:fs'
const D = 'toan600/'
const files = {}
const get = (f) => (files[f] ??= JSON.parse(fs.readFileSync(D + f + '.json', 'utf8')))
const q = (f, n) => get(f)[n - 1]
const opt = (f, n, key, text) => { q(f, n).options.find((o) => o.key === key).text = text }
const set = (f, n, o) => Object.assign(q(f, n), o)

// ---- Sai đáp án / phương án ----
opt('t10-hambac2', 6, 'D', '$(-\\infty;2) \\cup (3;+\\infty)$')
set('t10-hambac2', 6, { explanation: '$x^2-5x+6=(x-2)(x-3)>0 \\Leftrightarrow x<2$ hoặc $x>3$.' })
set('t10-vecto', 13, { answer: 'SĐSĐ', explanation: 'a) $\\vec{v}=-2\\vec{u}$ nên hai vectơ ngược hướng — sai. b) $\\sqrt{4+9}=\\sqrt{13}$ — đúng. c) $-8-18=-26$ — sai. d) $(-2;3)$ — đúng.' })
set('t11-dayso', 23, { prompt: 'Gửi tiền với lãi kép $5\\%$/năm. Sau ít nhất bao nhiêu năm thì số tiền nhận được không nhỏ hơn gấp đôi số tiền ban đầu?', answer: '15', explanation: '$1{,}05^{n} \\ge 2 \\Leftrightarrow n \\ge \\log_{1{,}05}2 \\approx 14{,}2$; $1{,}05^{14}\\approx 1{,}98<2$, $1{,}05^{15}\\approx 2{,}08$. Vậy 15 năm.' })
set('t11-gioihan', 16, { answer: 'ĐĐSS', explanation: 'a), b) Đúng. c) $\\lim_{x\\to-1}x^2=1$ — sai. d) $y=x^2$ liên tục trên $\\mathbb{R}$, kể cả tại $x=0$ — sai.' })
set('t11-songsong', 24, { prompt: 'Hình lập phương $ABCD.A\'B\'C\'D\'$ có cạnh bằng 2. Tính khoảng cách giữa hai đường thẳng song song $AB$ và $C\'D\'$ (làm tròn đến hàng phần trăm).', answer: '2,83', explanation: '$AB$ và $C\'D\'$ cùng nằm trong mặt chéo $ABC\'D\'$ (hình chữ nhật), khoảng cách bằng $BC\'=2\\sqrt{2}\\approx 2{,}83$.' })
set('t11-songsong', 25, { level: 'VD', prompt: 'Cho hình chóp $S.ABCD$ có đáy là hình bình hành, $CD=8$. Gọi $M$, $N$ lần lượt là trung điểm của $SA$, $SB$. Tính độ dài $MN$.', answer: '4', explanation: '$MN$ là đường trung bình của tam giác $SAB$ nên $MN=\\dfrac{AB}{2}=\\dfrac{CD}{2}=4$.' })
set('t11-vuonggoc-xs', 7, { prompt: 'Hình chóp $S.ABCD$ có đáy hình vuông cạnh 4, $SA \\perp (ABCD)$, $SA=2$. Khoảng cách từ $S$ đến đường thẳng $BD$ là', answer: 'C', explanation: 'Gọi $O$ là tâm đáy. $BD \\perp (SAC)$ nên $d(S,BD)=SO=\\sqrt{SA^2+AO^2}=\\sqrt{4+8}=2\\sqrt{3}$.' })
set('t11-vuonggoc-xs', 22, { prompt: 'Hình chóp $S.ABC$ có $SA \\perp (ABC)$, tam giác $ABC$ đều cạnh 4, $SA=2\\sqrt{3}$. Tính khoảng cách từ $S$ đến đường thẳng $BC$ (làm tròn đến hàng phần mười).', answer: '4,9', explanation: 'Gọi $H$ là trung điểm $BC$: $AH=2\\sqrt{3}$, $BC \\perp (SAH)$ nên $d(S,BC)=SH=\\sqrt{12+12}=2\\sqrt{6}\\approx 4{,}9$.' })
set('t12-gtln-tiemcan', 25, { prompt: 'Tính GTNN của hàm số $y=x+\\dfrac{4}{x}$ trên đoạn $[1;3]$.', answer: '4', explanation: '$y\'=1-\\dfrac{4}{x^2}=0 \\Leftrightarrow x=2$; $y(1)=5$, $y(2)=4$, $y(3)=\\dfrac{13}{3}$. GTNN bằng 4.' })
opt('t12-matcau', 12, 'C', '$8{,}38$')
set('t12-matcau', 12, { explanation: 'Chỏm cầu cao $h=3-2=1$: $V=\\pi\\int_2^3(9-z^2)\\,dz=\\pi\\left(9-\\dfrac{19}{3}\\right)=\\dfrac{8\\pi}{3}\\approx 8{,}38$.' })
set('t12-nguyenham', 15, { answer: 'ĐĐSĐ', explanation: 'a) Đúng. b) $(4+2)-(1+1)=4$ — đúng. c) Sai. d) $2x+1>0$ trên $[1;2]$ nên $I$ đúng bằng diện tích hình thang — đúng.' })
set('t12-nguyenham', 18, { answer: 'ĐĐĐS' })
opt('t12-oxyz', 6, 'D', '$\\dfrac{1}{3}$')
set('t12-oxyz', 17, { answer: 'ĐSSS', explanation: 'a) $(ABC)$ là mặt $(Oxy)$ — đúng. b) $SB=\\sqrt{9+9}=3\\sqrt{2}$ — sai. c) Hạ $AH \\perp BC$: $AH=\\dfrac{12}{5}$, $d(S,BC)=SH=\\sqrt{9+5{,}76}\\approx 3{,}84$ — sai. d) $V=\\dfrac{1}{3}\\cdot 6\\cdot 3=6$ — sai.' })
set('t12-toiuu', 12, { answer: 'C', explanation: '$\\dfrac{C(x)}{x}=0{,}01x+40+\\dfrac{4000}{x}$ nhỏ nhất khi $0{,}01=\\dfrac{4000}{x^2}$, tức $x=\\sqrt{400000}\\approx 632$.' })
set('t12-toiuu', 18, { answer: 'ĐĐSĐ', explanation: 'a), b) $60:80=30:40=0{,}75$ h — đúng. c) $90:1{,}5=60$ km/h — sai. d) Đúng.' })
set('t12-ungdungtp', 6, { answer: 'D', explanation: 'Chân cổng tại $x=\\pm 4$: $S=\\int_{-4}^{4}\\left(4-\\dfrac{x^2}{4}\\right)dx=32-\\dfrac{32}{3}=\\dfrac{64}{3}\\approx 21{,}33$ m².' })
set('t12-ungdungtp', 15, { answer: 'ĐĐSS', explanation: 'a) Chân tại $x=\\pm4$ — đúng. b) Đúng. c) $S=\\dfrac{64}{3}\\approx 21{,}33$ m² — sai. d) Cổng chỉ cao đúng 4 m tại một điểm — sai.' })
set('t12-ungdungtp', 17, { answer: 'ĐĐSĐ', explanation: 'a), b) Đúng. $S=\\dfrac{2}{3}-\\dfrac{1}{3}=\\dfrac{1}{3}$ nên c) sai, d) đúng.' })
set('t12-ungdungtp', 24, { prompt: q('t12-ungdungtp', 24).prompt.replace('hàng phần trăm', 'hàng phần mười'), answer: '2,7', explanation: '$V=\\pi\\int_0^{1/2}e^{2x}dx=\\dfrac{\\pi(e-1)}{2}\\approx 2{,}70$.' })
q('t12-xacsuat-thongke', 7).figure.text = 'Bệnh: 0,01\n  Dương: 0,95\n  Âm: 0,05\nKhông bệnh: 0,99\n  Dương: 0,05\n  Âm: 0,95'
set('t12-xacsuat-thongke', 13, { answer: 'ĐĐSS', explanation: 'a) $\\dfrac{2}{5}\\cdot\\dfrac{1}{4}=\\dfrac{1}{10}$ — đúng. b) Đúng. c) $P(B)=\\dfrac{1}{10}+\\dfrac{3}{5}\\cdot\\dfrac{2}{4}=\\dfrac{2}{5}$ — sai. d) $P(B\\mid A)\\ne P(B)$ — sai.' })

// ---- Lời văn ----
set('t11-songsong', 19, { prompt: 'Trong hình lập phương $ABCD.A\'B\'C\'D\'$, có bao nhiêu mặt của hình lập phương song song với mặt $(ABCD)$?', explanation: 'Chỉ có mặt $(A\'B\'C\'D\')$.' })
set('t11-songsong', 20, { level: 'NB', prompt: 'Hình lập phương có bao nhiêu mặt?' })
set('t11-songsong', 21, { prompt: 'Mặt phẳng đi qua trung điểm của $SA$ và song song với $(ABCD)$ cắt hình chóp $S.ABCD$. Thiết diện tạo thành có bao nhiêu cạnh?', explanation: 'Mặt phẳng cắt bốn cạnh bên tại trung điểm, thiết diện là tứ giác (4 cạnh).' })
set('t11-vuonggoc-xs', 12, { prompt: 'Bảng tần số thời gian tự học (giờ/tuần) của 20 học sinh như hình. Tứ phân vị thứ ba của mẫu số liệu ghép nhóm là' })

// ---- Ngoài chương trình ----
// Lớp 10 không học bất phương trình chứa giá trị tuyệt đối → đổi thành hệ bất phương trình bậc nhất, giữ đáp án
set('t10-bpt', 9, { prompt: 'Tập nghiệm của hệ $\\begin{cases} 2x+4>0 \\\\ x-3<0 \\end{cases}$ là', explanation: '$x>-2$ và $x<3$.' })
set('t10-bpt', 16, { prompt: 'Cho hệ bất phương trình $\\begin{cases} x+4 \\ge 0 \\\\ x-2 \\le 0 \\end{cases}$. Xét tính đúng sai:', explanation: 'Tập nghiệm $[-4;2]$: a) đúng, b) sai, c) đúng, d) sai.' })
set('t10-bpt', 22, { prompt: 'Hệ bất phương trình $\\begin{cases} 3x+7>0 \\\\ 3x-9<0 \\end{cases}$ có bao nhiêu nghiệm nguyên?', explanation: '$-\\dfrac{7}{3}<x<3$: các số nguyên $-2;-1;0;1;2$.' })
// Lô song song: chưa học quan hệ vuông góc → đổi các ý dùng vuông góc, giữ đáp án
opt('t11-songsong', 13, 'd', '$A\'B\'$ song song với $(ABCD)$')
opt('t11-songsong', 14, 'c', '$SO$ song song với $(ABCD)$')
opt('t11-songsong', 16, 'd', '$AM$ song song với $(SBC)$')
opt('t11-songsong', 17, 'b', '$BD$ cắt $B\'D\'$')
opt('t11-songsong', 17, 'c', '$AC$ và $BD$ cắt nhau tại $O$')
for (const n of [13, 14, 16, 17]) delete q('t11-songsong', n).explanation
// Tích có hướng hạn chế ở lớp 12 → đổi sang tích vô hướng
set('t12-oxyz', 11, { prompt: 'Tích vô hướng $\\vec{u} \\cdot \\vec{v}$ với $\\vec{u}=(1;2;0)$, $\\vec{v}=(2;-1;3)$ bằng', answer: 'A', explanation: '$2-2+0=0$.' })
q('t12-oxyz', 11).options = [{ key: 'A', text: '$0$' }, { key: 'B', text: '$1$' }, { key: 'C', text: '$4$' }, { key: 'D', text: '$-1$' }]
// Câu không phải bài tối ưu
set('t12-toiuu', 10, { prompt: 'Một hình chữ nhật có chu vi 40 cm. Diện tích lớn nhất của hình chữ nhật đó là', answer: 'A', explanation: 'Cạnh $x$ và $20-x$: $S=x(20-x)\\le 100$, dấu bằng khi $x=10$.' })
q('t12-toiuu', 10).options = [{ key: 'A', text: '$100$ cm²' }, { key: 'B', text: '$80$ cm²' }, { key: 'C', text: '$120$ cm²' }, { key: 'D', text: '$400$ cm²' }]

// ---- Hình ----
// Đề cho SA ⊥ đáy (hoặc ba cạnh vuông góc tại một đỉnh) → dùng dạng -sa
for (const [f, n] of [['t11-vuonggoc-xs', 5], ['t11-vuonggoc-xs', 14]]) q(f, n).figure.shape = 'pyramid4-sa'
q('t12-oxyz', 17).figure.shape = 'pyramid3-sa'
Object.assign(q('t12-matcau', 8).figure, { shape: 'pyramid3-sa', names: ['C', 'O', 'A', 'B'] })
// hình tròn của công cụ không đặt được 5 điểm → bỏ hình, đề tự đủ
delete q('t10-tohop', 9).figure
q('t10-tohop', 9).prompt = q('t10-tohop', 9).prompt.replace(' (như hình)', '')

// Mặt cầu ngoại tiếp khối đa diện thuộc chương trình 2006, chương trình 2018 không học → bỏ câu
const del = [['t12-matcau', 5], ['t12-matcau', 17], ['t12-matcau', 25]]
// Câu mặt cầu qua 4 điểm cho bằng toạ độ vẫn giải bằng Oxyz → chỉ bỏ hình "chóp trong mặt cầu"
delete q('t12-matcau', 8).figure
q('t12-matcau', 8).prompt = q('t12-matcau', 8).prompt.replace(' (như hình)', '')

// ---- Chung ----
for (const x of get('t12-xacsuat-thongke')) for (const k of ['prompt', 'explanation']) if (x[k]) x[k] = x[k].replace(/trung tâm kiểu/g, 'giá trị đại diện').replace(/Trung tâm kiểu/g, 'Giá trị đại diện')
for (const x of get('t12-xacsuat-thongke')) for (const o of x.options ?? []) o.text = o.text.replace(/trung tâm kiểu/g, 'giá trị đại diện')
// Bảng tần số ghép nhóm vẽ bằng công cụ "Bảng ghép nhóm"
const toGrouped = (f, n, label, freqLabel, view = 'htable') => {
  const fig = q(f, n).figure
  const [head, cnt] = fig.data.split('\n')
  const groups = head.match(/\[[^)\]]+[)\]]/g)
  const freqs = cnt.split(':')[1].split(';').map((s) => s.trim())
  q(f, n).figure = { kind: 'grouped', groups: groups.map((g, i) => `${g}: ${freqs[i]}`).join('\n'), label, freqLabel, view, polygon: false, extras: '' }
}
toGrouped('t11-vuonggoc-xs', 12, 'Thời gian (giờ)', 'Số học sinh')
toGrouped('t11-vuonggoc-xs', 18, 'Cân nặng (kg)', 'Số học sinh')
toGrouped('t12-xacsuat-thongke', 12, 'Nhóm', 'Tần số')

for (const [f, n] of del.sort((a, b) => b[1] - a[1])) get(f).splice(n - 1, 1)
for (const [f, a] of Object.entries(files)) fs.writeFileSync(D + f + '.json', JSON.stringify(a, null, 2) + '\n')
console.log('Đã sửa', Object.keys(files).length, 'file')
