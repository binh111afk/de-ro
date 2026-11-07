// Sửa lời giải cho các câu fix3.mjs đã đổi đáp án. Chạy sau fix3.mjs.
import fs from 'node:fs'
const E = {
  'toan-b#23': '$V=\pi\int_0^1(x^2+2)^2\,dx=\pi\left(\frac{1}{5}+\frac{4}{3}+4\right)=\frac{83\pi}{15}$, nên $\frac{V}{\pi}=\frac{83}{15}\approx 5{,}5$.',
  'toan-d#17': 'a) Đúng: $6!=720$. b) Đúng: hai kiểu xen kẽ, mỗi kiểu $3!\cdot3!=36$, tổng 72. c) Sai: coi ba nam là một khối có $4!\cdot3!=144$ cách, $P=0{,}2$. d) Sai: xếp 3 nữ trước ($3!$ cách) tạo 4 chỗ trống, chọn 3 chỗ cho nam và hoán vị: $3!\cdot C_4^3\cdot3!=144$, $P=\frac{144}{720}=0{,}2$.',
  'toan-e#14': 'Gọi $M$ là trung điểm $BC$: $AM=2\sqrt{3}$, $OA=\frac{2}{3}AM=\frac{4\sqrt{3}}{3}$, $OM=\frac{2\sqrt{3}}{3}$. a) Sai: $SA^2=6+\frac{16}{3}=\frac{34}{3}$, $SA\approx3{,}37\ne3\sqrt{2}$. b) Sai: $\tan\widehat{SAO}=\frac{\sqrt{6}}{4\sqrt{3}/3}\approx1{,}06$, góc $\approx46{,}7^{\circ}$. c) Sai: $V=\frac{1}{3}\cdot4\sqrt{3}\cdot\sqrt{6}=4\sqrt{2}$. d) Đúng: $d(O,BC)=OM=\frac{2\sqrt{3}}{3}$.',
  'toan-e#23': 'Chọn $A(0;0;0)$, $B\'(4;0;4)$, $C\'(4;4;4)$, $A\'(0;0;4)$. Mặt phẳng $(AB\'C\')$ có VTPT $[\vec{AB\'},\vec{AC\'}]$ cùng phương $(1;0;-1)$, phương trình $x-z=0$. $d=\frac{|0-4|}{\sqrt{2}}=2\sqrt{2}$, $d^2=8$.',
  'ly-a#5': 'Đẳng nhiệt: $p_1V_1=p_2V_2\Rightarrow p_2=\frac{2\cdot10^{5}\cdot2}{4}=1\cdot10^{5}$ Pa.',
  'ly-a#29': 'Công toàn phần bằng diện tích tam giác 1–2–3 trên đồ thị p–V: $W=\frac{1}{2}\cdot(6-2)\cdot(4-1)=6$ J; chu trình đi theo chiều kim đồng hồ nên khí sinh công dương.',
  'ly-b#21': 'a) Đúng: $R_{23}=\frac{12\cdot4}{16}=3\,\Omega$, mạch ngoài $4+3=7\,\Omega$. b) Đúng: $I=\frac{9}{7+0{,}5}=1{,}2$ A. c) Đúng: $U_{23}=1{,}2\cdot3=3{,}6$ V, $I_3=0{,}9$ A. d) Đúng: $P_1=1{,}2^2\cdot4=5{,}76$ W.',
  'hoa-e#15': '$\frac{x}{(2-x)^2}=4\Rightarrow4x^2-17x+16=0\Rightarrow x=\frac{17-\sqrt{33}}{8}\approx1{,}41$ M (nghiệm còn lại lớn hơn 2, loại).',
  'hoa-e#26': '$K=\frac{[B]}{[A]}=9$ và $[A]+[B]=0{,}4\Rightarrow[B]=0{,}36$ M.',
  'sinh-a#18': 'a) Đúng: cha mẹ bình thường sinh con gái bệnh nên bệnh do alen lặn trên NST thường (nếu trên X thì bố phải bệnh). b) Đúng: cả hai đều $Aa$. c) Sai: con trai bình thường có thể là $Aa$ (xác suất 2/3). d) Sai: $Aa\times Aa$ cho con bệnh với xác suất 1/4.',
  'sinh-a#22': 'Hai cặp gen phân li độc lập: $2^2=4$ loại giao tử AB, Ab, aB, ab.',
  'sinh-b#18': 'a) Đúng. b) Đúng. c) Sai: glucose được tái hấp thu hết ở ống thận. d) Đúng: đường phân ở tế bào chất, còn chu trình Krebs và chuỗi truyền electron (tạo phần lớn ATP) diễn ra trong ti thể.',
  'su#8': 'Chiến dịch Biên giới 1950 mở đầu bằng trận tiến công cứ điểm Đông Khê (16/9/1950).',
  'dia#20': 'a) Đúng: 100,3 triệu. b) Sai: 1975–2002 tăng khoảng 32 triệu trong 27 năm, 2002–2022 tăng khoảng 21 triệu trong 20 năm. c) Đúng: $100{,}3\cdot10^6/331{,}2\cdot10^3\approx303$ người/km², khoảng 300. d) Đúng: $100{,}3/47{,}4\approx2{,}1$.',
}
const byFile = {}
for (const [k, v] of Object.entries(E)) { const [f, n] = k.split('#'); (byFile[f] ??= []).push([+n, v]) }
for (const [f, list] of Object.entries(byFile)) {
  const p = `new/${f}.json`, a = JSON.parse(fs.readFileSync(p, 'utf8'))
  for (const [n, v] of list) a[n - 1].explanation = v
  fs.writeFileSync(p, JSON.stringify(a, null, 2) + '\n')
}
console.log('Đã sửa lời giải', Object.keys(E).length, 'câu')
