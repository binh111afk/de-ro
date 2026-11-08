/**
 * Khung chương trình Toán 6–12 (GDPT 2018) → đoạn chèn vào prompt soạn đề, để AI không ra câu vượt lớp.
 * Đoán lớp, chương, học kỳ từ yêu cầu người dùng rồi chỉ cắt đúng phần đó (không nạp cả file ~150 KB).
 * File JSON nạp lười để không làm nặng gói tải đầu trang.
 */

export interface KhungChuong {
  id: string
  ten: string
  hoc_ky: number
  ten_theo_sach?: Record<string, string>
  yeu_cau_can_dat?: string[]
  kien_thuc_duoc_dung?: string[]
  chua_duoc_dung?: string[]
  dang_bai_dien_hinh?: string[]
  luu_y_ra_de?: string
}
export interface KhungLop {
  lop: number
  chuong: KhungChuong[]
  ghi_chu_chua_chac?: string[]
}
export interface KhungCauTruc {
  loai: string
  lop: number | number[]
  thoi_gian_phut?: number
  phan: Array<{ ten: string; so_cau?: number; mo_ta?: string; tong_diem?: number }>
  pham_vi?: string
  ti_le_muc_do?: string
}
export interface KhungToan {
  lop: KhungLop[]
  cau_truc_de: KhungCauTruc[]
}

export const deaccent = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

/** từ khoá ngắn hay gặp (đã bỏ dấu); khớp với tên/id chương trong lớp đã biết */
const ALIASES = [
  'dao ham', 'tich phan', 'nguyen ham', 'logarit', 'loga', 'ham so mu', 'luong giac', 'to hop', 'xac suat', 'thong ke',
  'vecto', 'vector', 'oxyz', 'toa do', 'cap so', 'day so', 'gioi han', 'lien tuc', 'tiem can', 'khao sat', 'menh de',
  'tap hop', 'mat cau', 'mat phang', 'ghep nhom', 'vi-et', 'vi et', 'can bac', 'phan so', 'so nguyen', 'so huu ti',
  'so thuc', 'thales', 'dong dang', 'tu giac', 'da thuc', 'phan thuc', 'hang dang thuc', 'ti le', 'song song',
  'vuong goc', 'duong tron', 'he thuc luong', 'bat phuong trinh', 'ham so bac hai', 'tam giac bang nhau',
  'so thap phan', 'doi xung', 'da giac deu', 'phep quay', 'hinh tru', 'hinh non', 'hinh cau', 'hinh chop',
  'phuong trinh bac hai', 'phuong trinh bac nhat', 'he phuong trinh', 'chia het', 'so tu nhien',
]
/** từ chung chung — không dùng riêng để khớp chương */
const GENERIC = new Set(['toa do', 'mat phang', 'bat phuong trinh', 'phuong trinh bac nhat', 'song song'])

const hay = (c: KhungChuong) =>
  deaccent([c.ten, c.id.replace(/^t\d+-/, '').replace(/-/g, ' '), ...Object.values(c.ten_theo_sach ?? {})].join(' | '))

export interface KhungScope {
  /** lớp chính */
  grade: number
  /** đề tốt nghiệp THPT (phạm vi 10–12, chủ yếu 12) */
  graduation: boolean
  semester?: 1 | 2
  midterm: boolean
  /** chương khớp theo từ khoá; rỗng = cả lớp (hoặc cả học kỳ) */
  chapters: KhungChuong[]
}

/** đoán phạm vi từ yêu cầu; null nếu không phải đề Toán hoặc không xác định được lớp */
export function detectScope(text: string, khung: KhungToan): KhungScope | null {
  const t = deaccent(text)
  const graduation = /tot nghiep|thpt ?quoc gia|thptqg|thi thpt|on thi dai hoc/.test(t)
  const gm = /\b(?:lop|toan|khoi)\s*(1[0-2]|[6-9])\b/.exec(t)
  const isMath = /\btoan\b/.test(t)
  // môn khác (Vật lí lớp 10 có "vectơ"…) thì không chèn khung Toán
  if (!isMath && /vat li|vat ly|hoa hoc|\bhoa\b|sinh hoc|ngu van|tieng anh|lich su|dia li|dia ly|tin hoc|cong nghe|gdcd|kinh te/.test(t)) return null
  const sem = /(?:hoc ki|hoc ky|hk|ki|ky)\s*(1|2|ii|i)\b/.exec(t)
  const semester = sem ? (sem[1] === '2' || sem[1] === 'ii' ? 2 : 1) : undefined
  const midterm = /giua (?:hoc )?k[iy]/.test(t)

  const words = t.split(/[^a-z0-9-]+/).filter(Boolean)
  const grams = new Set<string>()
  for (let i = 0; i + 2 < words.length; i++) grams.add(words.slice(i, i + 3).join(' '))
  for (const a of ALIASES) if (t.includes(a)) grams.add(a)
  const matchIn = (lop: KhungLop) => {
    const found = lop.chuong.filter((c) => {
      const h = hay(c)
      return [...grams].some((g) => !GENERIC.has(g) && h.includes(g))
    })
    return found
  }

  let grade = gm ? Number(gm[1]) : graduation ? 12 : 0
  let chapters: KhungChuong[] = []
  if (grade) {
    const lop = khung.lop.find((l) => l.lop === grade)
    if (!lop) return null
    chapters = matchIn(lop)
    if (!isMath && !graduation && !chapters.length) return null
  } else {
    // không nói lớp: nhận khi từ khoá chỉ khớp chương của đúng một lớp (vd "tích phân" → lớp 12)
    const hits = khung.lop.map((l) => ({ l, c: matchIn(l) })).filter((x) => x.c.length)
    if (hits.length !== 1) return null
    grade = hits[0].l.lop
    chapters = hits[0].c
  }
  if (graduation) chapters = []
  return { grade, graduation, semester, midterm, chapters }
}

const list = (xs: string[] | undefined, max = 99) => (xs?.length ? xs.slice(0, max).join('; ') : '')

function chapterDetail(c: KhungChuong, lop: number) {
  return [
    `• Lớp ${lop} — ${c.ten} (HK${c.hoc_ky})`,
    c.yeu_cau_can_dat?.length ? `  Yêu cầu cần đạt: ${list(c.yeu_cau_can_dat)}` : '',
    c.kien_thuc_duoc_dung?.length ? `  Được dùng: ${list(c.kien_thuc_duoc_dung)}` : '',
    c.chua_duoc_dung?.length ? `  CHƯA được dùng: ${list(c.chua_duoc_dung)}` : '',
    c.dang_bai_dien_hinh?.length ? `  Dạng bài điển hình: ${list(c.dang_bai_dien_hinh, 6)}` : '',
    c.luu_y_ra_de ? `  Lưu ý ra đề: ${c.luu_y_ra_de}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function chapterBrief(c: KhungChuong, lop: number) {
  return [
    `• Lớp ${lop} — ${c.ten} (HK${c.hoc_ky})`,
    c.chua_duoc_dung?.length ? `  CHƯA được dùng: ${list(c.chua_duoc_dung)}` : '',
    c.luu_y_ra_de ? `  Lưu ý: ${c.luu_y_ra_de}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function structureFor(scope: KhungScope, khung: KhungToan): KhungCauTruc | undefined {
  const all = khung.cau_truc_de
  if (scope.graduation) return all.find((s) => /tot nghiep/.test(deaccent(s.loai)))
  return all.find((s) => !/tot nghiep/.test(deaccent(s.loai)) && (Array.isArray(s.lop) ? s.lop.includes(scope.grade) : s.lop === scope.grade))
}

/** đoạn văn chèn vào system prompt; '' nếu không xác định được phạm vi */
export function buildKhungBlock(scope: KhungScope, khung: KhungToan): string {
  const lop = khung.lop.find((l) => l.lop === scope.grade)!
  const out: string[] = []
  let head: string
  if (scope.graduation) {
    head = 'Đề tốt nghiệp THPT: phạm vi Toán 10–12, chủ yếu lớp 12.'
    for (const l of khung.lop.filter((l) => l.lop >= 10)) for (const c of l.chuong) out.push(chapterBrief(c, l.lop))
  } else if (scope.chapters.length) {
    head = `Đề Toán lớp ${scope.grade}, các chương: ${scope.chapters.map((c) => c.ten).join('; ')}.`
    for (const c of scope.chapters) out.push(chapterDetail(c, scope.grade))
  } else {
    let cs = lop.chuong
    if (scope.semester) {
      cs = cs.filter((c) => c.hoc_ky === scope.semester)
      if (scope.midterm) cs = cs.slice(0, Math.ceil(cs.length / 2))
    }
    const ky = scope.semester ? `, ${scope.midterm ? 'giữa ' : ''}học kỳ ${scope.semester}` : ''
    head = `Đề Toán lớp ${scope.grade}${ky}: chỉ ra câu trong các chương dưới đây.`
    for (const c of cs) out.push(scope.semester ? chapterDetail(c, scope.grade) : chapterBrief(c, scope.grade))
  }
  const st = structureFor(scope, khung)
  const stText = st
    ? `\nCẤU TRÚC ĐỀ THAM KHẢO (${st.loai}; dùng khi người dùng không nêu cấu trúc khác): ` +
      st.phan.map((p) => `${p.ten}${p.so_cau ? ` — ${p.so_cau} câu` : ''}${p.tong_diem ? `, ${p.tong_diem} điểm` : ''}`).join('; ') +
      (st.pham_vi ? `. Phạm vi: ${st.pham_vi}` : '') +
      (st.ti_le_muc_do ? `. Mức độ: ${st.ti_le_muc_do}` : '')
    : ''
  return (
    'KHUNG CHƯƠNG TRÌNH TOÁN (GDPT 2018) — BẮT BUỘC: chỉ ra câu trong phạm vi dưới đây. ' +
    'KHÔNG dùng kiến thức ghi ở "CHƯA được dùng", kiến thức của lớp trên hay của chương trình cũ (2006). ' +
    'Soạn xong tự rà từng câu; câu nào vượt phạm vi thì thay bằng câu khác.\n' +
    head +
    '\n' +
    out.join('\n') +
    stText
  )
}

let cache: Promise<KhungToan> | null = null
const loadKhung = () => (cache ??= import('../data/khungToan.json').then((m) => (m.default ?? m) as unknown as KhungToan))

/** dùng trong AiPanel: '' khi không phải đề Toán xác định được lớp */
export async function khungPromptFor(text: string): Promise<string> {
  const t = deaccent(text)
  // lọc nhanh trước khi nạp JSON
  if (!/toan|lop\s*\d|tot nghiep|thpt/.test(t) && !ALIASES.some((a) => t.includes(a))) return ''
  try {
    const khung = await loadKhung()
    const scope = detectScope(text, khung)
    return scope ? buildKhungBlock(scope, khung) : ''
  } catch {
    return ''
  }
}
