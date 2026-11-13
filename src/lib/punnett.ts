/**
 * Công cụ "Bảng lai Punnett" (Sinh học 9 và 12):
 * - Phân tích phép lai P (tối đa 3 cặp gen phân li độc lập, gen trên NST thường và NST giới tính X).
 * - Liệt kê giao tử GP của bố và mẹ (kèm tỉ lệ nếu không đều).
 * - Kẻ khung Punnett: hàng = giao tử đực (♂), cột = giao tử cái (♀), chuẩn hoá thứ tự kiểu gen.
 * - Tuỳ chọn trội hoàn toàn, trội không hoàn toàn (dị hợp trung gian), đồng trội.
 * - Đặt tên kiểu hình cho từng gen (hiển thị tỉ lệ bằng lời).
 * - Đếm và rút gọn tỉ lệ kiểu gen (KG) và tỉ lệ kiểu hình (KH). Tách theo giới tính với gen liên kết X.
 * - Chế độ "Để trống cho học sinh điền" (khung có sẵn giao tử, ô kiểu gen để trống).
 */

export type DominanceType = 'complete' | 'incomplete' | 'codominant'

export interface GeneTrait {
  /** Ký hiệu gen, ví dụ: 'A', 'B', 'D' */
  gene: string
  /** Kiểu trội lặn: 'complete' (mặc định), 'incomplete' (trội không hoàn toàn), 'codominant' (đồng trội) */
  dominance?: DominanceType
  /** Tên kiểu hình: [trội, lặn] hoặc [trội, trung gian, lặn] */
  phenotypes?: [string, string] | [string, string, string]
}

export interface PunnettSpec {
  /** Chuỗi phép lai, ví dụ: "AaBb x Aabb", "XAXa x XaY", "P: AaBb × AaBb" */
  cross: string
  /** Cấu hình từng gen (tuỳ chọn trội không hoàn toàn, tên kiểu hình) */
  traits?: GeneTrait[]
  /** Hiện dòng giao tử GP */
  showGametes?: boolean
  /** Hiện khung Punnett */
  showGrid?: boolean
  /** Hiện tỉ lệ kiểu gen */
  showGenotypeRatio?: boolean
  /** Hiện tỉ lệ kiểu hình */
  showPhenotypeRatio?: boolean
  /** Chế độ để trống ô kiểu gen cho học sinh điền */
  blankGrid?: boolean
  /** Tô màu ô theo kiểu hình */
  colorByPhenotype?: boolean
  /** Cỡ chữ (12–18, mặc định 14) */
  fontSize?: number
}

export const PUNNETT_DEFAULT: PunnettSpec = {
  cross: 'AaBb x AaBb',
  showGametes: true,
  showGrid: true,
  showGenotypeRatio: true,
  showPhenotypeRatio: true,
  blankGrid: false,
  colorByPhenotype: true,
  fontSize: 14,
}

/* ------------------------------------------------------------------ *
 * Các hàm toán & tiện ích
 * ------------------------------------------------------------------ */

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b > 0) {
    const t = b
    b = a % b
    a = t
  }
  return a || 1
}

function gcdArray(arr: number[]): number {
  if (!arr.length) return 1
  return arr.reduce((acc, v) => gcd(acc, v), arr[0])
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Bảng màu pastel nhẹ nhàng cho các kiểu hình khác nhau trong khung */
const PHENO_COLORS = [
  { bg: '#e0f2fe', stroke: '#7dd3fc', text: '#0369a1' }, // sky
  { bg: '#fef3c7', stroke: '#fcd34d', text: '#b45309' }, // amber
  { bg: '#dcfce7', stroke: '#86efac', text: '#15803d' }, // emerald
  { bg: '#fce7f3', stroke: '#f472b6', text: '#be185d' }, // pink
  { bg: '#ede9fe', stroke: '#c4b5fd', text: '#6d28d9' }, // violet
  { bg: '#ffedd5', stroke: '#fdba74', text: '#c2410c' }, // orange
  { bg: '#ccfbf1', stroke: '#5eead4', text: '#0f766e' }, // teal
  { bg: '#e0e7ff', stroke: '#a5b4fc', text: '#4338ca' }, // indigo
  { bg: '#f1f5f9', stroke: '#cbd5e1', text: '#475569' }, // slate
]

/* ------------------------------------------------------------------ *
 * Xử lý ký tự chỉ số trên cho NST giới tính X^A, X^a
 * ------------------------------------------------------------------ */

const SUP_MAP: Record<string, string> = {
  'ᴬ': 'A', 'ᵃ': 'a',
  'ᴮ': 'B', 'ᵇ': 'b',
  'ᴰ': 'D', 'ᵈ': 'd',
  'ᴹ': 'M', 'ᵐ': 'm',
  '⁺': '+', '⁻': '-',
}

/** Chuyển ký tự superscript unicode hoặc ^A thành dạng chuẩn X^A */
export function normalizeSuperscripts(text: string): string {
  let s = text
  for (const [sup, ch] of Object.entries(SUP_MAP)) {
    s = s.replaceAll(sup, `^${ch}`)
  }
  return s
}

/** Chuyển dạng X^A hoặc XAXa thành SVG có tspan số mũ đúng chuẩn */
export function formatGenotypeToSvg(raw: string): string {
  const norm = normalizeSuperscripts(raw).replace(/X([A-Za-z+-])(?!\^)/g, 'X^$1')
  return norm.replace(/X\^([^XY\s^]+)/g, (_, allele) => {
    return `X<tspan baseline-shift="super" font-size="72%">${esc(allele)}</tspan>`
  })
}

/** Chuyển dạng X^A thành Unicode superscript để hiển thị text thuần nếu cần */
export function formatGenotypeToUnicode(raw: string): string {
  const map: Record<string, string> = {
    A: 'ᴬ', a: 'ᵃ', B: 'ᴮ', b: 'ᵇ', D: 'ᴰ', d: 'ᵈ', M: 'ᴹ', m: 'ᵐ', '+': '⁺', '-': '⁻',
  }
  return raw.replace(/X\^([A-Za-z0-9+-]+)/g, (_, allele) => {
    return 'X' + [...allele].map((c) => map[c] ?? c).join('')
  })
}

/* ------------------------------------------------------------------ *
 * Mô hình dữ liệu di truyền
 * ------------------------------------------------------------------ */

export interface GenePair {
  gene: string
  allele1: string
  allele2: string
}

export interface SexLinkedPair {
  gene: string
  /** 'XX' = mẹ, 'XY' = bố */
  kind: 'XX' | 'XY'
  x1Allele: string
  x2Allele?: string // chỉ có ở XX
}

export interface ParentParsed {
  label: string // '♀' hoặc '♂'
  isFemale: boolean
  autosomal: GenePair[]
  sexLinked?: SexLinkedPair
  raw: string
}

export interface Gamete {
  label: string
  svgLabel: string
  /** xác suất dạng số, ví dụ 0.25 */
  prob: number
  /** phân số đẹp: "1/4", "1/2", "1" */
  ratioStr: string
  /** các alen thành phần */
  alleles: Record<string, string> // locus -> allele
  sexChrom?: { kind: 'X' | 'Y'; allele?: string }
}

export interface PunnettCell {
  row: number
  col: number
  maleGamete: Gamete
  femaleGamete: Gamete
  genotype: string
  svgGenotype: string
  prob: number
  phenotypeKey: string
  phenotypeName: string
  colorIndex: number
}

export interface RatioItem {
  key: string
  label: string
  count: number
  ratioNum: number
  prob: number
  percent: string
}

export interface ParsedCrossResult {
  mother: ParentParsed
  father: ParentParsed
  motherGametes: Gamete[]
  fatherGametes: Gamete[]
  grid: PunnettCell[][]
  genotypeRatios: RatioItem[]
  phenotypeRatios: RatioItem[]
  femalePhenotypeRatios?: RatioItem[]
  malePhenotypeRatios?: RatioItem[]
  isSexLinked: boolean
  genes: string[]
  traitsMap: Map<string, GeneTrait>
}

/* ------------------------------------------------------------------ *
 * Phân tích chuỗi phép lai
 * ------------------------------------------------------------------ */

/**
 * Tách một chuỗi kiểu gen thành các cặp gen:
 * Hỗ trợ NST thường (Aa, Bb, dd...) và liên kết giới tính (X^A X^a, XAXa, XaY...).
 */
function parseParentGenotype(rawInput: string, forceGender?: 'female' | 'male'): ParentParsed {
  let s = normalizeSuperscripts(rawInput.trim())
  // Bỏ tiền tố mẹ/bố nếu có
  let detectedGender: 'female' | 'male' | undefined = forceGender
  if (/♀|cái|mẹ|female/i.test(s)) {
    detectedGender = 'female'
    s = s.replace(/♀|\(cái\)|\(mẹ\)|female/gi, '').trim()
  } else if (/♂|đực|bố|male/i.test(s)) {
    detectedGender = 'male'
    s = s.replace(/♂|\(đực\)|\(bố\)|male/gi, '').trim()
  }

  // Chuẩn hoá các dạng viết X:
  // XAXa -> X^A X^a; XaY -> X^a Y; X^AX^a -> X^A X^a
  // Lưu ý không đụng tới chữ X thường trong text khác
  s = s.replace(/X([A-Za-z+-])(?!\^)/g, 'X^$1')
  // Thêm khoảng trắng quanh Y độc lập
  s = s.replace(/(?<=[A-Za-z0-9])Y\b/g, ' Y').replace(/\bY(?=[A-Za-z0-9])/g, 'Y ')

  // Tách các token
  const tokens = s.split(/\s+/).filter(Boolean)
  const autosomal: GenePair[] = []
  let sexLinked: SexLinkedPair | undefined

  // Phân tích các đoạn
  const fullText = tokens.join('')
  let idx = 0

  while (idx < fullText.length) {
    // 1. Kiểm tra NST giới tính bắt đầu bằng X hoặc Y
    if (fullText[idx] === 'X') {
      // Có dạng X^A hoặc X
      let allele1 = ''
      idx++
      if (idx < fullText.length && fullText[idx] === '^') {
        idx++
        while (idx < fullText.length && /[A-Za-z0-9+-]/.test(fullText[idx]) && fullText[idx] !== 'X' && fullText[idx] !== 'Y') {
          allele1 += fullText[idx]
          idx++
        }
      }
      if (!allele1 && idx < fullText.length && /[A-Za-z]/.test(fullText[idx]) && fullText[idx] !== 'X' && fullText[idx] !== 'Y') {
        allele1 = fullText[idx]
        idx++
      }

      // Tìm NST giới tính thứ 2 đi kèm (X hoặc Y)
      if (idx < fullText.length && fullText[idx] === 'X') {
        // XX (cái)
        let allele2 = ''
        idx++
        if (idx < fullText.length && fullText[idx] === '^') {
          idx++
          while (idx < fullText.length && /[A-Za-z0-9+-]/.test(fullText[idx]) && fullText[idx] !== 'X' && fullText[idx] !== 'Y') {
            allele2 += fullText[idx]
            idx++
          }
        }
        if (!allele2 && idx < fullText.length && /[A-Za-z]/.test(fullText[idx]) && fullText[idx] !== 'X' && fullText[idx] !== 'Y') {
          allele2 = fullText[idx]
          idx++
        }
        const geneName = (allele1 || allele2 || 'X').toUpperCase()[0] || 'X'
        sexLinked = { kind: 'XX', gene: geneName, x1Allele: allele1 || 'A', x2Allele: allele2 || 'a' }
        detectedGender = 'female'
      } else if (idx < fullText.length && fullText[idx] === 'Y') {
        // XY (đực)
        idx++
        const geneName = (allele1 || 'X').toUpperCase()[0] || 'X'
        sexLinked = { kind: 'XY', gene: geneName, x1Allele: allele1 || 'A' }
        detectedGender = 'male'
      } else {
        throw new Error(`NST giới tính '${fullText.slice(Math.max(0, idx - 4), idx + 2)}' thiếu chiếc tương đồng (phải là XX hoặc XY).`)
      }
      continue
    }

    if (fullText[idx] === 'Y') {
      throw new Error(`Ký hiệu '${fullText[idx]}' đứng đơn độc. Kiểu gen đực trên NST giới tính phải viết là X^...Y (ví dụ: XAY hoặc XaY).`)
    }

    // 2. Cặp gen trên NST thường (2 alen cùng một chữ cái: Aa, AA, aa, Bb...)
    const ch1 = fullText[idx]
    if (!/[A-Za-z]/.test(ch1)) {
      throw new Error(`Ký hiệu lạ '${ch1}' trong kiểu gen '${rawInput}'. Chỉ dùng chữ cái (Aa, Bb...) hoặc NST giới tính (X, Y).`)
    }

    if (idx + 1 >= fullText.length) {
      throw new Error(`Gen '${ch1}' bị thiếu alen thứ hai. Sinh vật lưỡng bội cần 2 alen cho mỗi gen (ví dụ: ${ch1}${ch1.toLowerCase()} hoặc ${ch1}${ch1.toUpperCase()}).`)
    }

    const ch2 = fullText[idx + 1]
    if (!/[A-Za-z]/.test(ch2)) {
      throw new Error(`Ký hiệu lạ hoặc không hợp lệ: '${ch2}' trong cặp gen '${ch1}${ch2}'. Chỉ dùng chữ cái (Aa, Bb...) hoặc NST giới tính (X, Y).`)
    }
    if (ch1.toLowerCase() !== ch2.toLowerCase()) {
      throw new Error(`Cặp alen không khớp: '${ch1}${ch2}'. Mỗi gen phải gồm 2 alen cùng chữ cái (ví dụ: ${ch1.toUpperCase()}${ch1.toLowerCase()}).`)
    }

    const gene = ch1.toUpperCase()
    // Chuẩn hoá chữ hoa trước chữ thường
    const a1 = ch1 < ch2 ? ch1 : ch2
    const a2 = ch1 < ch2 ? ch2 : ch1
    autosomal.push({ gene, allele1: a1, allele2: a2 })
    idx += 2
  }

  // Sắp xếp gen thường theo bảng chữ cái A-Z
  autosomal.sort((a, b) => a.gene.localeCompare(b.gene))

  const isFemale = detectedGender !== 'male'

  return {
    label: isFemale ? '♀' : '♂',
    isFemale,
    autosomal,
    sexLinked,
    raw: rawInput,
  }
}

/** Tách chuỗi phép lai thành 2 bên bố mẹ */
export function splitCrossString(crossStr: string): [string, string] {
  let s = crossStr.trim()
  // Bỏ tiền tố P: hoặc P :
  s = s.replace(/^P\s*:\s*/i, '').trim()

  // Tìm dấu phân cách phép lai: ×, *, hoặc chữ x/X đứng giữa khoảng trắng
  let parts: string[] = []
  if (s.includes('×')) {
    parts = s.split('×')
  } else if (s.includes('*')) {
    parts = s.split('*')
  } else {
    // Tách bằng chữ x hoặc X
    // Ưu tiên tách bằng " x " hoặc " X "
    const spaceX = s.split(/\s+[xX]\s+/)
    if (spaceX.length === 2) {
      parts = spaceX
    } else {
      // Trường hợp không có khoảng cách, vd: AaBbxAabb
      // Tìm vị trí chữ x phân cách
      const m = /\s*[xX]\s*/.exec(s)
      if (m && m.index > 0 && m.index + m[0].length < s.length) {
        parts = [s.slice(0, m.index), s.slice(m.index + m[0].length)]
      }
    }
  }

  if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
    throw new Error('Cần nhập phép lai giữa hai bên, cách nhau bằng dấu × hoặc x (ví dụ: AaBb × Aabb hoặc XAXa × XaY).')
  }

  return [parts[0].trim(), parts[1].trim()]
}

/** Phân tích toàn bộ phép lai */
export function parsePunnettCross(spec: PunnettSpec): ParsedCrossResult {
  const [side1Str, side2Str] = splitCrossString(spec.cross)

  let p1 = parseParentGenotype(side1Str)
  let p2 = parseParentGenotype(side2Str)

  // Xác định bên nào là mẹ (♀), bên nào là bố (♂)
  let mother: ParentParsed
  let father: ParentParsed

  if (p1.sexLinked || p2.sexLinked) {
    if (p1.sexLinked?.kind === 'XX' && p2.sexLinked?.kind === 'XY') {
      mother = p1
      father = p2
    } else if (p1.sexLinked?.kind === 'XY' && p2.sexLinked?.kind === 'XX') {
      mother = p2
      father = p1
    } else if (p1.isFemale && !p2.isFemale) {
      mother = p1
      father = p2
    } else if (!p1.isFemale && p2.isFemale) {
      mother = p2
      father = p1
    } else {
      // Mặc định bên 1 mẹ, bên 2 bố nếu cùng là XX hoặc cùng XY
      mother = p1
      father = p2
    }
  } else {
    if (p1.isFemale && !p2.isFemale) {
      mother = p1
      father = p2
    } else if (!p1.isFemale && p2.isFemale) {
      mother = p2
      father = p1
    } else {
      // Theo thông lệ: bên trái mẹ ♀, bên phải bố ♂
      mother = { ...p1, isFemale: true, label: '♀' }
      father = { ...p2, isFemale: false, label: '♂' }
    }
  }

  // Kiểm tra số cặp gen và tính khớp giữa bố mẹ
  const motherGenes = mother.autosomal.map((g) => g.gene)
  const fatherGenes = father.autosomal.map((g) => g.gene)
  if (mother.sexLinked) motherGenes.push('X')
  if (father.sexLinked) fatherGenes.push('X')

  const totalGenes = motherGenes.length
  if (totalGenes > 3) {
    throw new Error(`Tối đa 3 cặp gen (khung tối đa 8 × 8). Phép lai đang có ${totalGenes} cặp gen.`)
  }

  // Kiểm tra cặp gen có khớp không
  const sortedMother = [...motherGenes].sort().join(',')
  const sortedFather = [...fatherGenes].sort().join(',')
  if (sortedMother !== sortedFather) {
    const diff1 = motherGenes.filter((g) => !fatherGenes.includes(g))
    const diff2 = fatherGenes.filter((g) => !motherGenes.includes(g))
    const msg: string[] = []
    if (diff1.length) msg.push(`bên mẹ có gen [${diff1.join(', ')}]`)
    if (diff2.length) msg.push(`bên bố có gen [${diff2.join(', ')}]`)
    throw new Error(`Cặp gen không khớp giữa hai bên: ${msg.join(', ')}. Cả hai bên phải có cùng các cặp gen.`)
  }

  if (mother.sexLinked && father.sexLinked) {
    if (mother.sexLinked.gene !== father.sexLinked.gene) {
      throw new Error(`Gen trên NST giới tính X không khớp: mẹ là gen '${mother.sexLinked.gene}', bố là gen '${father.sexLinked.gene}'.`)
    }
  }

  // Tạo map cấu hình kiểu hình
  const traitsMap = new Map<string, GeneTrait>()
  if (spec.traits) {
    for (const t of spec.traits) {
      traitsMap.set(t.gene.toUpperCase(), t)
    }
  }

  // Sinh giao tử cho mẹ và bố
  const motherGametes = generateGametes(mother)
  const fatherGametes = generateGametes(father)

  // Tạo khung Punnett
  const isSexLinked = Boolean(mother.sexLinked || father.sexLinked)
  const genesList = motherGenes.filter((g) => g !== 'X')
  if (isSexLinked) genesList.push('X')

  const { grid, genotypeRatios, phenotypeRatios, femalePhenotypeRatios, malePhenotypeRatios } = buildPunnettGrid(
    motherGametes,
    fatherGametes,
    isSexLinked,
    mother.sexLinked?.gene || 'A',
    traitsMap,
  )

  return {
    mother,
    father,
    motherGametes,
    fatherGametes,
    grid,
    genotypeRatios,
    phenotypeRatios,
    femalePhenotypeRatios,
    malePhenotypeRatios,
    isSexLinked,
    genes: genesList,
    traitsMap,
  }
}

/* ------------------------------------------------------------------ *
 * Sinh giao tử
 * ------------------------------------------------------------------ */

function formatFraction(n: number, d: number): string {
  if (n === d) return '1'
  const g = gcd(n, d)
  return `${n / g}/${d / g}`
}

export function generateGametes(parent: ParentParsed): Gamete[] {
  // Mỗi locus sinh ra mảng { allele, prob, sexChrom? }
  const locusChoices: Array<Array<{ key: string; allele: string; prob: number; sexChrom?: { kind: 'X' | 'Y'; allele?: string } }>> = []

  // NST thường
  for (const g of parent.autosomal) {
    if (g.allele1 === g.allele2) {
      locusChoices.push([{ key: g.gene, allele: g.allele1, prob: 1 }])
    } else {
      // Dị hợp: 1/2 A, 1/2 a (theo thứ tự chữ hoa trước chữ thường)
      const upper = g.allele1 < g.allele2 ? g.allele1 : g.allele2
      const lower = g.allele1 < g.allele2 ? g.allele2 : g.allele1
      locusChoices.push([
        { key: g.gene, allele: upper, prob: 0.5 },
        { key: g.gene, allele: lower, prob: 0.5 },
      ])
    }
  }

  // NST giới tính
  if (parent.sexLinked) {
    const sl = parent.sexLinked
    if (sl.kind === 'XX') {
      const a1 = sl.x1Allele
      const a2 = sl.x2Allele ?? sl.x1Allele
      if (a1 === a2) {
        locusChoices.push([{ key: 'X', allele: `X^${a1}`, prob: 1, sexChrom: { kind: 'X', allele: a1 } }])
      } else {
        // X^A trước, X^a sau
        const upper = a1 < a2 ? a1 : a2
        const lower = a1 < a2 ? a2 : a1
        locusChoices.push([
          { key: 'X', allele: `X^${upper}`, prob: 0.5, sexChrom: { kind: 'X', allele: upper } },
          { key: 'X', allele: `X^${lower}`, prob: 0.5, sexChrom: { kind: 'X', allele: lower } },
        ])
      }
    } else {
      // XY: 1/2 X^A, 1/2 Y
      locusChoices.push([
        { key: 'X', allele: `X^${sl.x1Allele}`, prob: 0.5, sexChrom: { kind: 'X', allele: sl.x1Allele } },
        { key: 'X', allele: 'Y', prob: 0.5, sexChrom: { kind: 'Y' } },
      ])
    }
  }

  // Tích đề-các (Cartesian product) các lựa chọn
  let combinations: Array<{ alleles: Record<string, string>; prob: number; sexChrom?: { kind: 'X' | 'Y'; allele?: string } }> = [
    { alleles: {}, prob: 1 },
  ]

  for (const choices of locusChoices) {
    const next: typeof combinations = []
    for (const cur of combinations) {
      for (const ch of choices) {
        next.push({
          alleles: { ...cur.alleles, [ch.key]: ch.allele },
          prob: cur.prob * ch.prob,
          sexChrom: ch.sexChrom ?? cur.sexChrom,
        })
      }
    }
    combinations = next
  }

  // Tính mẫu số chung nhỏ nhất của tỉ lệ giao tử (thường là 1, 2, 4 hoặc 8)
  const denom = Math.round(1 / Math.min(...combinations.map((c) => c.prob)))

  return combinations.map((c) => {
    // Nhãn giao tử: ghép các alen thường + NST giới tính
    const parts: string[] = []
    for (const g of parent.autosomal) {
      parts.push(c.alleles[g.gene] || '')
    }
    if (c.alleles['X']) {
      parts.push(c.alleles['X'])
    }
    const label = parts.join('')
    const num = Math.round(c.prob * denom)
    const ratioStr = denom === 1 ? '1' : formatFraction(num, denom)

    return {
      label,
      svgLabel: formatGenotypeToSvg(label),
      prob: c.prob,
      ratioStr,
      alleles: c.alleles,
      sexChrom: c.sexChrom,
    }
  })
}

/* ------------------------------------------------------------------ *
 * Khung Punnett & Đếm tỉ lệ KG, KH
 * ------------------------------------------------------------------ */

function normalizeGenotype(
  maleGamete: Gamete,
  femaleGamete: Gamete,
  isSexLinked: boolean,
): { genotype: string; svgGenotype: string; isFemale: boolean } {
  const parts: string[] = []

  // 1. Ghép từng locus thường: sắp xếp chữ hoa trước chữ thường
  const allGeneKeys = Object.keys(maleGamete.alleles)
    .filter((k) => k !== 'X')
    .sort()

  for (const g of allGeneKeys) {
    const a1 = maleGamete.alleles[g] || ''
    const a2 = femaleGamete.alleles[g] || ''
    const pair = a1 < a2 ? `${a1}${a2}` : `${a2}${a1}`
    parts.push(pair)
  }

  // 2. NST giới tính
  let isFemale = true
  if (isSexLinked) {
    const mChrom = maleGamete.sexChrom
    const fChrom = femaleGamete.sexChrom
    if (mChrom && fChrom) {
      if (mChrom.kind === 'Y' || fChrom.kind === 'Y') {
        // Con đực XY: X trước, Y sau
        isFemale = false
        const xAllele = mChrom.kind === 'X' ? mChrom.allele : fChrom.allele
        parts.push(`X^${xAllele} Y`)
      } else {
        // Con cái XX: X^A trước, X^a sau
        isFemale = true
        const a1 = mChrom.allele || ''
        const a2 = fChrom.allele || ''
        const upper = a1 < a2 ? a1 : a2
        const lower = a1 < a2 ? a2 : a1
        parts.push(`X^${upper} X^${lower}`)
      }
    }
  }

  const genotype = parts.join('')
  const svgGenotype = formatGenotypeToSvg(genotype)
  return { genotype, svgGenotype, isFemale }
}

function determinePhenotype(
  _genotype: string,
  maleGamete: Gamete,
  femaleGamete: Gamete,
  isSexLinked: boolean,
  sexGene: string,
  traitsMap: Map<string, GeneTrait>,
): { phenotypeKey: string; phenotypeName: string; isFemale: boolean } {
  const nameParts: string[] = []
  const keyParts: string[] = []

  // 1. Phân tích gen thường
  const allGeneKeys = Object.keys(maleGamete.alleles)
    .filter((k) => k !== 'X')
    .sort()

  for (const g of allGeneKeys) {
    const a1 = maleGamete.alleles[g] || ''
    const a2 = femaleGamete.alleles[g] || ''
    const hasUpper = a1 === a1.toUpperCase() || a2 === a2.toUpperCase()
    const isHomoUpper = a1 === a1.toUpperCase() && a2 === a2.toUpperCase()
    const isHomoLower = a1 === a1.toLowerCase() && a2 === a2.toLowerCase()
    const isHetero = !isHomoUpper && !isHomoLower

    const trait = traitsMap.get(g)
    const dom = trait?.dominance ?? 'complete'
    const phenos = trait?.phenotypes

    if (dom === 'incomplete') {
      // Trội không hoàn toàn: AA trội, Aa trung gian, aa lặn
      if (isHomoUpper) {
        keyParts.push(`${g}(trội)`)
        nameParts.push(phenos?.[0] || `${g} (trội)`)
      } else if (isHetero) {
        keyParts.push(`${g}(trung gian)`)
        nameParts.push(phenos?.[1] || (phenos ? `trung gian (${phenos[0]}-${phenos[phenos.length - 1]})` : `${g} (trung gian)`))
      } else {
        keyParts.push(`${g}(lặn)`)
        nameParts.push(phenos ? phenos[phenos.length - 1] : `${g.toLowerCase()} (lặn)`)
      }
    } else if (dom === 'codominant') {
      // Đồng trội: AA, Aa đồng trội, aa
      if (isHomoUpper) {
        keyParts.push(`${g}(1)`)
        nameParts.push(phenos?.[0] || `${g} (1)`)
      } else if (isHetero) {
        keyParts.push(`${g}(đồng trội)`)
        nameParts.push(phenos?.[1] || `${g} (đồng trội)`)
      } else {
        keyParts.push(`${g}(2)`)
        nameParts.push(phenos ? phenos[phenos.length - 1] : `${g.toLowerCase()} (2)`)
      }
    } else {
      // Trội hoàn toàn (mặc định)
      if (hasUpper) {
        keyParts.push(`${g}-`)
        nameParts.push(phenos?.[0] || `trội ${g}`)
      } else {
        keyParts.push(`${g.toLowerCase()}${g.toLowerCase()}`)
        nameParts.push(phenos ? phenos[phenos.length - 1] : `lặn ${g.toLowerCase()}`)
      }
    }
  }

  // 2. NST giới tính
  let isFemale = true
  if (isSexLinked) {
    const mChrom = maleGamete.sexChrom
    const fChrom = femaleGamete.sexChrom
    const trait = traitsMap.get(sexGene.toUpperCase()) || traitsMap.get('X')
    const phenos = trait?.phenotypes

    if (mChrom?.kind === 'Y' || fChrom?.kind === 'Y') {
      // Con đực (♂)
      isFemale = false
      const allele = mChrom?.kind === 'X' ? mChrom.allele : fChrom?.allele
      const isDom = allele === allele?.toUpperCase()
      const phenoText = isDom ? phenos?.[0] || 'trội' : phenos ? phenos[phenos.length - 1] : 'lặn'
      keyParts.push(`♂_X^${allele}Y`)
      nameParts.push(`đực ${phenoText}`)
    } else {
      // Con cái (♀)
      isFemale = true
      const a1 = mChrom?.allele || ''
      const a2 = fChrom?.allele || ''
      const hasUpper = a1 === a1.toUpperCase() || a2 === a2.toUpperCase()
      const isHomoUpper = a1 === a1.toUpperCase() && a2 === a2.toUpperCase()
      const isHetero = (a1 === a1.toUpperCase() && a2 === a2.toLowerCase()) || (a1 === a1.toLowerCase() && a2 === a2.toUpperCase())
      const dom = trait?.dominance ?? 'complete'

      if (dom === 'incomplete') {
        if (isHomoUpper) {
          keyParts.push('♀_X^A X^A')
          nameParts.push(`cái ${phenos?.[0] || 'trội'}`)
        } else if (isHetero) {
          keyParts.push('♀_X^A X^a')
          nameParts.push(`cái ${phenos?.[1] || 'trung gian'}`)
        } else {
          keyParts.push('♀_X^a X^a')
          nameParts.push(`cái ${phenos ? phenos[phenos.length - 1] : 'lặn'}`)
        }
      } else {
        if (hasUpper) {
          keyParts.push('♀_X^A_')
          nameParts.push(`cái ${phenos?.[0] || 'trội'}`)
        } else {
          keyParts.push('♀_X^a X^a')
          nameParts.push(`cái ${phenos ? phenos[phenos.length - 1] : 'lặn'}`)
        }
      }
    }
  }

  const phenotypeKey = keyParts.join(';')
  const phenotypeName = nameParts.join(', ')

  return { phenotypeKey, phenotypeName, isFemale }
}

function buildPunnettGrid(
  motherGametes: Gamete[],
  fatherGametes: Gamete[],
  isSexLinked: boolean,
  sexGene: string,
  traitsMap: Map<string, GeneTrait>,
): {
  grid: PunnettCell[][]
  genotypeRatios: RatioItem[]
  phenotypeRatios: RatioItem[]
  femalePhenotypeRatios?: RatioItem[]
  malePhenotypeRatios?: RatioItem[]
} {
  const grid: PunnettCell[][] = []
  const genoCounts = new Map<string, { label: string; count: number; prob: number }>()
  const phenoCounts = new Map<string, { label: string; count: number; prob: number }>()
  const femalePhenoCounts = new Map<string, { label: string; count: number; prob: number }>()
  const malePhenoCounts = new Map<string, { label: string; count: number; prob: number }>()

  const phenoColorMap = new Map<string, number>()
  let nextColorIdx = 0

  // Hàng = bố (♂), Cột = mẹ (♀)
  for (let r = 0; r < fatherGametes.length; r++) {
    const row: PunnettCell[] = []
    const mGam = fatherGametes[r]
    for (let c = 0; c < motherGametes.length; c++) {
      const fGam = motherGametes[c]
      const { genotype, svgGenotype, isFemale } = normalizeGenotype(mGam, fGam, isSexLinked)
      const { phenotypeKey, phenotypeName } = determinePhenotype(genotype, mGam, fGam, isSexLinked, sexGene, traitsMap)

      if (!phenoColorMap.has(phenotypeKey)) {
        phenoColorMap.set(phenotypeKey, nextColorIdx % PHENO_COLORS.length)
        nextColorIdx++
      }
      const colorIndex = phenoColorMap.get(phenotypeKey) ?? 0
      const cellProb = mGam.prob * fGam.prob

      row.push({
        row: r,
        col: c,
        maleGamete: mGam,
        femaleGamete: fGam,
        genotype,
        svgGenotype,
        prob: cellProb,
        phenotypeKey,
        phenotypeName,
        colorIndex,
      })

      // Đếm kiểu gen
      const gEntry = genoCounts.get(genotype) ?? { label: genotype, count: 0, prob: 0 }
      gEntry.count += 1
      gEntry.prob += cellProb
      genoCounts.set(genotype, gEntry)

      // Đếm kiểu hình chung
      const pEntry = phenoCounts.get(phenotypeKey) ?? { label: phenotypeName, count: 0, prob: 0 }
      pEntry.count += 1
      pEntry.prob += cellProb
      phenoCounts.set(phenotypeKey, pEntry)

      // Đếm theo giới tính (cho liên kết X)
      if (isSexLinked) {
        if (isFemale) {
          const feEntry = femalePhenoCounts.get(phenotypeKey) ?? { label: phenotypeName.replace(/^cái\s*/i, ''), count: 0, prob: 0 }
          feEntry.count += 1
          feEntry.prob += cellProb
          femalePhenoCounts.set(phenotypeKey, feEntry)
        } else {
          const maEntry = malePhenoCounts.get(phenotypeKey) ?? { label: phenotypeName.replace(/^đực\s*/i, ''), count: 0, prob: 0 }
          maEntry.count += 1
          maEntry.prob += cellProb
          malePhenoCounts.set(phenotypeKey, maEntry)
        }
      }
    }
    grid.push(row)
  }

  // Rút gọn tỉ lệ kiểu gen
  const totalCells = fatherGametes.length * motherGametes.length
  const genoItems = Array.from(genoCounts.entries()).map(([k, v]) => ({
    key: k,
    label: v.label,
    count: v.count,
    prob: v.prob,
  }))
  const genoGcd = gcdArray(genoItems.map((i) => i.count))
  const genotypeRatios: RatioItem[] = genoItems.map((i) => ({
    ...i,
    ratioNum: i.count / genoGcd,
    percent: `${Math.round(i.prob * 1000) / 10}%`,
  }))

  // Rút gọn tỉ lệ kiểu hình
  const phenoItems = Array.from(phenoCounts.entries()).map(([k, v]) => ({
    key: k,
    label: v.label,
    count: v.count,
    prob: v.prob,
  }))
  const phenoGcd = gcdArray(phenoItems.map((i) => i.count))
  const phenotypeRatios: RatioItem[] = phenoItems.map((i) => ({
    ...i,
    ratioNum: i.count / phenoGcd,
    percent: `${Math.round(i.prob * 1000) / 10}%`,
  }))

  // Rút gọn theo giới
  let femalePhenotypeRatios: RatioItem[] | undefined
  let malePhenotypeRatios: RatioItem[] | undefined
  if (isSexLinked) {
    const fItems = Array.from(femalePhenoCounts.entries()).map(([k, v]) => ({
      key: k,
      label: v.label,
      count: v.count,
      prob: v.prob,
    }))
    const fGcd = gcdArray(fItems.map((i) => i.count))
    femalePhenotypeRatios = fItems.map((i) => ({
      ...i,
      ratioNum: i.count / fGcd,
      percent: `${Math.round((i.count / (totalCells / 2)) * 1000) / 10}%`,
    }))

    const mItems = Array.from(malePhenoCounts.entries()).map(([k, v]) => ({
      key: k,
      label: v.label,
      count: v.count,
      prob: v.prob,
    }))
    const mGcd = gcdArray(mItems.map((i) => i.count))
    malePhenotypeRatios = mItems.map((i) => ({
      ...i,
      ratioNum: i.count / mGcd,
      percent: `${Math.round((i.count / (totalCells / 2)) * 1000) / 10}%`,
    }))
  }

  return {
    grid,
    genotypeRatios,
    phenotypeRatios,
    femalePhenotypeRatios,
    malePhenotypeRatios,
  }
}

/* ------------------------------------------------------------------ *
 * Định dạng text xuất ra
 * ------------------------------------------------------------------ */

export function formatRatioString(items: RatioItem[]): string {
  return items.map((it) => `${it.ratioNum} ${it.label}`).join(' : ')
}

/** Xuất toàn bộ bài toán dạng văn bản thuần để người dùng sao chép */
export function exportPunnettToText(spec: PunnettSpec): string {
  const res = parsePunnettCross(spec)
  const lines: string[] = []

  // Phép lai
  lines.push(`P: ${res.mother.label} ${res.mother.raw} × ${res.father.label} ${res.father.raw}`)

  // Giao tử
  const mGamStr = res.motherGametes.map((g) => (g.ratioStr === '1' ? g.label : `${g.ratioStr} ${g.label}`)).join(', ')
  const fGamStr = res.fatherGametes.map((g) => (g.ratioStr === '1' ? g.label : `${g.ratioStr} ${g.label}`)).join(', ')
  lines.push(`GP: ${res.mother.label} (${mGamStr}) × ${res.father.label} (${fGamStr})`)

  // Khung Punnett dạng bảng chữ
  lines.push('\nKhung Punnett:')
  const colHeaders = ['', ...res.motherGametes.map((g) => g.label)]
  lines.push(colHeaders.join('\t| '))
  for (let r = 0; r < res.grid.length; r++) {
    const row = res.grid[r]
    const rowCells = [res.fatherGametes[r].label, ...row.map((c) => (spec.blankGrid ? '___' : c.genotype))]
    lines.push(rowCells.join('\t| '))
  }

  // Tỉ lệ kiểu gen
  lines.push(`\nTỉ lệ kiểu gen (F₁): ${formatRatioString(res.genotypeRatios)}`)

  // Tỉ lệ kiểu hình
  if (res.isSexLinked && res.femalePhenotypeRatios && res.malePhenotypeRatios) {
    lines.push('Tỉ lệ kiểu hình (F₁):')
    lines.push(`• Giới cái (♀): ${formatRatioString(res.femalePhenotypeRatios)}`)
    lines.push(`• Giới đực (♂): ${formatRatioString(res.malePhenotypeRatios)}`)
    lines.push(`• Chung: ${formatRatioString(res.phenotypeRatios)}`)
  } else {
    lines.push(`Tỉ lệ kiểu hình (F₁): ${formatRatioString(res.phenotypeRatios)}`)
  }

  return lines.join('\n')
}

/* ------------------------------------------------------------------ *
 * Vẽ SVG Bảng lai Punnett
 * ------------------------------------------------------------------ */

export function renderPunnettSvg(spec: PunnettSpec, desc: string): { svg: string; width: number; height: number } {
  const res = parsePunnettCross(spec)

  const showGametes = spec.showGametes ?? true
  const showGrid = spec.showGrid ?? true
  const showGenotypeRatio = spec.showGenotypeRatio ?? true
  const showPhenotypeRatio = spec.showPhenotypeRatio ?? true
  const blankGrid = spec.blankGrid ?? false
  const colorByPhenotype = spec.colorByPhenotype ?? true
  const fs = Math.min(18, Math.max(12, spec.fontSize ?? 14))

  const pad = 16
  const numRows = res.fatherGametes.length
  const numCols = res.motherGametes.length

  // Bề rộng các cột trong bảng Punnett
  // Khung 8x8 (3 cặp): cột hẹp hơn (~58px), khung 4x4: ~80px, khung 2x2: ~110px
  let colW = 85
  if (numCols > 4) colW = 58
  else if (numCols <= 2) colW = 110

  const headerColW = numCols > 4 ? 50 : 64
  const rowH = numRows > 4 ? 30 : 36
  const tableW = headerColW + numCols * colW

  // Chiều rộng tổng thể: tối thiểu 540px để dòng tỉ lệ và tiêu đề không bị chật
  const totalW = Math.max(540, tableW + pad * 2)
  const tableX = pad + Math.max(0, (totalW - pad * 2 - tableW) / 2)

  let curY = pad + 18
  const svgElements: string[] = []

  // 1. Dòng Phép lai P
  const pMotherGeno = formatGenotypeToSvg(res.mother.raw)
  const pFatherGeno = formatGenotypeToSvg(res.father.raw)
  svgElements.push(
    `<text x="${pad}" y="${curY}" font-family="Times New Roman, serif" font-size="${fs + 1}" font-weight="bold" fill="#111827">` +
      `P: <tspan fill="#d97706">${res.mother.label}</tspan> ${pMotherGeno} × <tspan fill="#2563eb">${res.father.label}</tspan> ${pFatherGeno}` +
      `</text>`,
  )
  curY += fs + 10

  // 2. Dòng Giao tử GP
  if (showGametes) {
    const mGamSvg = res.motherGametes
      .map((g) => (g.ratioStr === '1' ? g.svgLabel : `<tspan font-size="88%">${g.ratioStr}</tspan> ${g.svgLabel}`))
      .join(', ')
    const fGamSvg = res.fatherGametes
      .map((g) => (g.ratioStr === '1' ? g.svgLabel : `<tspan font-size="88%">${g.ratioStr}</tspan> ${g.svgLabel}`))
      .join(', ')

    svgElements.push(
      `<text x="${pad}" y="${curY}" font-family="Times New Roman, serif" font-size="${fs}" fill="#1f2937">` +
        `<tspan font-weight="bold">G<tspan baseline-shift="sub" font-size="75%">P</tspan>:</tspan> ` +
        `<tspan fill="#d97706">${res.mother.label}</tspan> (${mGamSvg}) × <tspan fill="#2563eb">${res.father.label}</tspan> (${fGamSvg})` +
        `</text>`,
    )
    curY += fs + 14
  }

  // 3. Khung Punnett
  if (showGrid) {
    const gridTopY = curY
    const gridH = (numRows + 1) * rowH

    // Ô góc trên bên trái (0, 0): chia đôi ♂ \ ♀
    svgElements.push(
      `<rect x="${tableX}" y="${gridTopY}" width="${headerColW}" height="${rowH}" fill="#f8fafc" stroke="#334155" stroke-width="1.2" />`,
      `<line x1="${tableX}" y1="${gridTopY}" x2="${tableX + headerColW}" y2="${gridTopY + rowH}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2" />`,
      `<text x="${tableX + headerColW - 6}" y="${gridTopY + 14}" font-family="Times New Roman, serif" font-size="${fs - 1}" font-weight="bold" fill="#d97706" text-anchor="end">♀</text>`,
      `<text x="${tableX + 6}" y="${gridTopY + rowH - 6}" font-family="Times New Roman, serif" font-size="${fs - 1}" font-weight="bold" fill="#2563eb" text-anchor="start">♂</text>`,
    )

    // Tiêu đề cột: Giao tử của mẹ (♀)
    for (let c = 0; c < numCols; c++) {
      const cx = tableX + headerColW + c * colW
      const gam = res.motherGametes[c]
      svgElements.push(
        `<rect x="${cx}" y="${gridTopY}" width="${colW}" height="${rowH}" fill="#fef3c7" stroke="#334155" stroke-width="1.2" />`,
        `<text x="${cx + colW / 2}" y="${gridTopY + rowH / 2 + 5}" font-family="Times New Roman, serif" font-size="${fs}" font-weight="bold" fill="#92400e" text-anchor="middle">${gam.svgLabel}</text>`,
      )
    }

    // Các hàng: Tiêu đề hàng (Giao tử của bố ♂) + Các ô con lai
    for (let r = 0; r < numRows; r++) {
      const ry = gridTopY + (r + 1) * rowH
      const mGam = res.fatherGametes[r]

      // Tiêu đề hàng
      svgElements.push(
        `<rect x="${tableX}" y="${ry}" width="${headerColW}" height="${rowH}" fill="#dbeafe" stroke="#334155" stroke-width="1.2" />`,
        `<text x="${tableX + headerColW / 2}" y="${ry + rowH / 2 + 5}" font-family="Times New Roman, serif" font-size="${fs}" font-weight="bold" fill="#1e40af" text-anchor="middle">${mGam.svgLabel}</text>`,
      )

      // Các ô kiểu gen
      for (let c = 0; c < numCols; c++) {
        const cx = tableX + headerColW + c * colW
        const cell = res.grid[r][c]
        const colStyle = colorByPhenotype && !blankGrid ? PHENO_COLORS[cell.colorIndex] : { bg: '#ffffff', text: '#111827' }

        svgElements.push(
          `<rect x="${cx}" y="${ry}" width="${colW}" height="${rowH}" fill="${colStyle.bg}" stroke="#334155" stroke-width="1.2" />`,
        )

        if (!blankGrid) {
          svgElements.push(
            `<text x="${cx + colW / 2}" y="${ry + rowH / 2 + 5}" font-family="Times New Roman, serif" font-size="${fs}" font-weight="bold" fill="${colStyle.text}" text-anchor="middle">${cell.svgGenotype}</text>`,
          )
        }
      }
    }

    curY += gridH + 16
  }

  // 4. Tỉ lệ kiểu gen (KG)
  if (showGenotypeRatio) {
    const maxGenoPerLine = 5
    for (let i = 0; i < res.genotypeRatios.length; i += maxGenoPerLine) {
      const chunk = res.genotypeRatios.slice(i, i + maxGenoPerLine)
      const chunkStr = chunk.map((it) => `${it.ratioNum} ${formatGenotypeToSvg(it.label)}`).join(' : ')
      const hasMore = i + maxGenoPerLine < res.genotypeRatios.length
      if (i === 0) {
        svgElements.push(
          `<text x="${pad}" y="${curY}" font-family="Times New Roman, serif" font-size="${fs}" fill="#111827">` +
            `<tspan font-weight="bold">Tỉ lệ kiểu gen (F<tspan baseline-shift="sub" font-size="75%">1</tspan>):</tspan> ` +
            `${chunkStr}${hasMore ? ' :' : ''}` +
            `</text>`,
        )
      } else {
        svgElements.push(
          `<text x="${pad + 16}" y="${curY}" font-family="Times New Roman, serif" font-size="${fs}" fill="#111827">` +
            `${chunkStr}${hasMore ? ' :' : ''}` +
            `</text>`,
        )
      }
      curY += fs + 6
    }
    curY += 4
  }

  // 5. Tỉ lệ kiểu hình (KH)
  if (showPhenotypeRatio) {
    if (res.isSexLinked && res.femalePhenotypeRatios && res.malePhenotypeRatios) {
      svgElements.push(
        `<text x="${pad}" y="${curY}" font-family="Times New Roman, serif" font-size="${fs}" font-weight="bold" fill="#111827">` +
          `Tỉ lệ kiểu hình (F<tspan baseline-shift="sub" font-size="75%">1</tspan>):` +
          `</text>`,
      )
      curY += fs + 6

      // Giới cái
      const feStr = res.femalePhenotypeRatios.map((it) => `${it.ratioNum} ${it.label}`).join(' : ')
      svgElements.push(
        `<text x="${pad + 12}" y="${curY}" font-family="Times New Roman, serif" font-size="${fs - 0.5}" fill="#1f2937">` +
          `• Giới cái (♀): ${feStr} <tspan fill="#64748b">(${res.femalePhenotypeRatios.map((it) => it.percent).join(' : ')})</tspan>` +
          `</text>`,
      )
      curY += fs + 6

      // Giới đực
      const maStr = res.malePhenotypeRatios.map((it) => `${it.ratioNum} ${it.label}`).join(' : ')
      svgElements.push(
        `<text x="${pad + 12}" y="${curY}" font-family="Times New Roman, serif" font-size="${fs - 0.5}" fill="#1f2937">` +
          `• Giới đực (♂): ${maStr} <tspan fill="#64748b">(${res.malePhenotypeRatios.map((it) => it.percent).join(' : ')})</tspan>` +
          `</text>`,
      )
      curY += fs + 6

      // Chung
      const chungLines: string[] = []
      let curChungItems: string[] = []
      let curChungLen = 0
      for (const it of res.phenotypeRatios) {
        const itemStr = `${it.ratioNum} ${it.label}`
        if (curChungItems.length > 0 && curChungLen + itemStr.length + 3 > 45) {
          chungLines.push(curChungItems.join(' : ') + ' :')
          curChungItems = [itemStr]
          curChungLen = itemStr.length
        } else {
          curChungItems.push(itemStr)
          curChungLen += itemStr.length + 3
        }
      }
      if (curChungItems.length > 0) {
        chungLines.push(curChungItems.join(' : '))
      }

      for (let i = 0; i < chungLines.length; i++) {
        if (i === 0) {
          svgElements.push(
            `<text x="${pad + 12}" y="${curY}" font-family="Times New Roman, serif" font-size="${fs - 0.5}" fill="#475569">` +
              `• Chung: ${chungLines[i]}` +
              `</text>`,
          )
        } else {
          svgElements.push(
            `<text x="${pad + 24}" y="${curY}" font-family="Times New Roman, serif" font-size="${fs - 0.5}" fill="#475569">` +
              `${chungLines[i]}` +
              `</text>`,
          )
        }
        curY += fs + 6
      }
      curY += 2
    } else {
      const phenoLines: string[] = []
      let curLineItems: string[] = []
      let curLineLen = 0
      for (const it of res.phenotypeRatios) {
        const itemStr = `${it.ratioNum} ${it.label}`
        if (curLineItems.length > 0 && curLineLen + itemStr.length + 3 > 45) {
          phenoLines.push(curLineItems.join(' : ') + ' :')
          curLineItems = [itemStr]
          curLineLen = itemStr.length
        } else {
          curLineItems.push(itemStr)
          curLineLen += itemStr.length + 3
        }
      }
      if (curLineItems.length > 0) {
        phenoLines.push(curLineItems.join(' : '))
      }

      for (let i = 0; i < phenoLines.length; i++) {
        if (i === 0) {
          svgElements.push(
            `<text x="${pad}" y="${curY}" font-family="Times New Roman, serif" font-size="${fs}" fill="#111827">` +
              `<tspan font-weight="bold">Tỉ lệ kiểu hình (F<tspan baseline-shift="sub" font-size="75%">1</tspan>):</tspan> ` +
              `${phenoLines[i]}` +
              `</text>`,
          )
        } else {
          svgElements.push(
            `<text x="${pad + 16}" y="${curY}" font-family="Times New Roman, serif" font-size="${fs}" fill="#111827">` +
              `${phenoLines[i]}` +
              `</text>`,
          )
        }
        curY += fs + 6
      }
      curY += 4
    }
  }

  const totalH = Math.round(curY + pad / 2)

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}">` +
    desc +
    `<rect width="${totalW}" height="${totalH}" fill="#ffffff" />` +
    svgElements.join('\n') +
    `</svg>`

  return { svg, width: totalW, height: totalH }
}
