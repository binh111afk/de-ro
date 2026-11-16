/**
 * Lệnh công thức hay dùng trong đề (Toán, Lý, Hoá THCS–THPT) cho hộp thoại Công thức.
 * `snip`: LaTeX chèn vào, `#` là chỗ đặt con trỏ (chữ đang bôi đen sẽ vào đó).
 * `show`: LaTeX vẽ trên nút (thiếu thì vẽ `snip` với ô trống thay cho chỗ nhập).
 */
export type MathSnippet = { snip: string; show?: string; tip: string }
export type SnippetGroup = { key: string; label: string; items: MathSnippet[] }

export const SNIPPET_GROUPS: SnippetGroup[] = [
  {
    key: 'basic',
    label: 'Cơ bản',
    items: [
      { snip: '\\dfrac{#}{}', show: '\\frac{a}{b}', tip: 'Phân số' },
      { snip: '\\sqrt{#}', show: '\\sqrt{x}', tip: 'Căn bậc hai' },
      { snip: '\\sqrt[3]{#}', show: '\\sqrt[3]{x}', tip: 'Căn bậc ba' },
      { snip: '\\sqrt[#]{}', show: '\\sqrt[n]{x}', tip: 'Căn bậc n' },
      { snip: '^{#}', show: 'x^{n}', tip: 'Số mũ' },
      { snip: '_{#}', show: 'x_{n}', tip: 'Chỉ số dưới' },
      { snip: '\\left| # \\right|', show: '|x|', tip: 'Giá trị tuyệt đối' },
      { snip: '\\left( # \\right)', show: '(\\,)', tip: 'Ngoặc tròn co giãn' },
      { snip: '\\left[ # \\right]', show: '[\\,]', tip: 'Ngoặc vuông co giãn' },
      { snip: '\\pm ', show: '\\pm', tip: 'Cộng trừ' },
      { snip: '\\cdot ', show: '\\cdot', tip: 'Nhân (chấm)' },
      { snip: '\\times ', show: '\\times', tip: 'Nhân (dấu x)' },
      { snip: '\\div ', show: '\\div', tip: 'Chia' },
      { snip: '\\ne ', show: '\\ne', tip: 'Khác' },
      { snip: '\\le ', show: '\\le', tip: 'Nhỏ hơn hoặc bằng' },
      { snip: '\\ge ', show: '\\ge', tip: 'Lớn hơn hoặc bằng' },
      { snip: '\\approx ', show: '\\approx', tip: 'Xấp xỉ' },
      { snip: '\\infty ', show: '\\infty', tip: 'Vô cực' },
      { snip: '^\\circ', show: '30^\\circ', tip: 'Độ' },
      { snip: '\\%', show: '\\%', tip: 'Phần trăm' },
    ],
  },
  {
    key: 'geo',
    label: 'Hình học',
    items: [
      { snip: '\\widehat{#}', show: '\\widehat{ABC}', tip: 'Góc' },
      { snip: '\\triangle ', show: '\\triangle', tip: 'Tam giác' },
      { snip: '\\perp ', show: '\\perp', tip: 'Vuông góc' },
      { snip: '\\parallel ', show: '\\parallel', tip: 'Song song' },
      { snip: '\\backsim ', show: '\\backsim', tip: 'Đồng dạng' },
      { snip: '\\overrightarrow{#}', show: '\\overrightarrow{AB}', tip: 'Vectơ' },
      { snip: '\\vec{#}', show: '\\vec{a}', tip: 'Vectơ (một chữ)' },
      { snip: '\\overline{#}', show: '\\overline{AB}', tip: 'Gạch trên' },
      { snip: '\\overset{\\frown}{#}', show: '\\overset{\\frown}{AB}', tip: 'Cung' },
      { snip: '\\angle ', show: '\\angle', tip: 'Ký hiệu góc' },
      { snip: '\\pi ', show: '\\pi', tip: 'Pi' },
      { snip: '\\sin #', show: '\\sin', tip: 'sin' },
      { snip: '\\cos #', show: '\\cos', tip: 'cos' },
      { snip: '\\tan #', show: '\\tan', tip: 'tan' },
      { snip: '\\cot #', show: '\\cot', tip: 'cot' },
      { snip: '\\left( O; R \\right)', show: '(O;R)', tip: 'Đường tròn' },
    ],
  },
  {
    key: 'set',
    label: 'Tập hợp',
    items: [
      { snip: '\\in ', show: '\\in', tip: 'Thuộc' },
      { snip: '\\notin ', show: '\\notin', tip: 'Không thuộc' },
      { snip: '\\subset ', show: '\\subset', tip: 'Tập con' },
      { snip: '\\cup ', show: '\\cup', tip: 'Hợp' },
      { snip: '\\cap ', show: '\\cap', tip: 'Giao' },
      { snip: '\\setminus ', show: '\\setminus', tip: 'Hiệu' },
      { snip: '\\varnothing ', show: '\\varnothing', tip: 'Tập rỗng' },
      { snip: '\\mathbb{N}', show: '\\mathbb{N}', tip: 'Số tự nhiên' },
      { snip: '\\mathbb{Z}', show: '\\mathbb{Z}', tip: 'Số nguyên' },
      { snip: '\\mathbb{Q}', show: '\\mathbb{Q}', tip: 'Số hữu tỉ' },
      { snip: '\\mathbb{R}', show: '\\mathbb{R}', tip: 'Số thực' },
      { snip: '\\left\\{ # \\right\\}', show: '\\{\\,\\}', tip: 'Ngoặc nhọn' },
      { snip: '\\Rightarrow ', show: '\\Rightarrow', tip: 'Suy ra' },
      { snip: '\\Leftrightarrow ', show: '\\Leftrightarrow', tip: 'Tương đương' },
      { snip: '\\forall ', show: '\\forall', tip: 'Với mọi' },
      { snip: '\\exists ', show: '\\exists', tip: 'Tồn tại' },
    ],
  },
  {
    key: 'calc',
    label: 'Giải tích',
    items: [
      { snip: '\\begin{cases} # \\\\  \\end{cases}', show: '\\begin{cases}x\\\\y\\end{cases}', tip: 'Hệ phương trình' },
      { snip: '\\left[\\begin{array}{l} # \\\\  \\end{array}\\right.', show: '\\left[\\begin{array}{l}x\\\\y\\end{array}\\right.', tip: 'Tuyển (hoặc)' },
      { snip: 'x_{1,2} = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}', show: 'x_{1,2}', tip: 'Công thức nghiệm' },
      { snip: '\\Delta ', show: '\\Delta', tip: 'Delta' },
      { snip: '\\lim_{x \\to #}', show: '\\lim_{x\\to a}', tip: 'Giới hạn' },
      { snip: '\\sum_{i=1}^{#}', show: '\\sum_{i=1}^{n}', tip: 'Tổng' },
      { snip: '\\int_{#}^{}', show: '\\int_a^b', tip: 'Tích phân' },
      { snip: "f'(x)", show: "f'(x)", tip: 'Đạo hàm' },
      { snip: '\\log_{#}', show: '\\log_a', tip: 'Logarit cơ số a' },
      { snip: '\\ln #', show: '\\ln', tip: 'Logarit tự nhiên' },
      { snip: 'e^{#}', show: 'e^{x}', tip: 'Mũ e' },
      { snip: '\\mathrm{C}_{n}^{#}', show: '\\mathrm{C}_n^k', tip: 'Tổ hợp' },
      { snip: '\\mathrm{A}_{n}^{#}', show: '\\mathrm{A}_n^k', tip: 'Chỉnh hợp' },
      { snip: 'n!', show: 'n!', tip: 'Giai thừa' },
    ],
  },
  {
    key: 'greek',
    label: 'Chữ Hy Lạp',
    items: ['alpha', 'beta', 'gamma', 'delta', 'varepsilon', 'theta', 'lambda', 'mu', 'rho', 'sigma', 'varphi', 'omega', 'Delta', 'Omega'].map((n) => ({
      snip: `\\${n} `,
      show: `\\${n}`,
      tip: n,
    })),
  },
  {
    key: 'chem',
    label: 'Lý – Hoá',
    items: [
      { snip: '\\xrightarrow{#}', show: '\\xrightarrow{t^\\circ}', tip: 'Mũi tên có điều kiện' },
      { snip: '\\rightarrow ', show: '\\rightarrow', tip: 'Mũi tên phản ứng' },
      { snip: '\\rightleftharpoons ', show: '\\rightleftharpoons', tip: 'Thuận nghịch' },
      { snip: '\\uparrow', show: '\\uparrow', tip: 'Bay hơi' },
      { snip: '\\downarrow', show: '\\downarrow', tip: 'Kết tủa' },
      { snip: '\\mathrm{#}', show: '\\mathrm{H_2O}', tip: 'Chữ đứng (công thức hoá)' },
      { snip: '\\text{#}', show: '\\text{chữ}', tip: 'Chữ thường trong công thức' },
      { snip: '\\,\\mathrm{#}', show: '5\\,\\mathrm{cm}', tip: 'Đơn vị' },
      { snip: '\\Omega ', show: '\\Omega', tip: 'Ôm' },
      { snip: '^\\circ\\mathrm{C}', show: '^\\circ\\mathrm{C}', tip: 'Độ C' },
    ],
  },
]

/** chèn `snip` vào `text` tại vùng chọn [start, end): chữ đang chọn vào chỗ `#`, trả về chuỗi mới và vị trí con trỏ */
export function applySnippet(text: string, start: number, end: number, snip: string) {
  const picked = text.slice(start, end)
  const at = snip.indexOf('#')
  const body = at < 0 ? snip : snip.slice(0, at) + picked + snip.slice(at + 1)
  const caret = start + (at < 0 ? body.length : at + picked.length)
  return { text: text.slice(0, start) + body + text.slice(end), caret }
}
