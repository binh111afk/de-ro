/**
 * Khung chương trình GDPT 2018 (mọi môn, lớp 1–12) → đoạn chèn vào prompt soạn đề, để AI không ra câu vượt lớp.
 * Đoán môn, lớp, chương, học kỳ từ yêu cầu người dùng rồi chỉ cắt đúng phần đó (không nạp cả file).
 * Mỗi file JSON nạp lười, chỉ khi cần đúng môn đó.
 */

export interface KhungChuong {
  id: string
  ten: string
  hoc_ky: number
  ten_theo_sach?: Record<string, string>
  cac_bai?: string[]
  yeu_cau_can_dat?: string[] | Record<string, string[]>
  kien_thuc_duoc_dung?: string[]
  chua_duoc_dung?: string[]
  dang_bai_dien_hinh?: string[]
  luu_y_ra_de?: string
  /** Tiếng Anh */
  chu_de?: string
  ngu_phap?: string[] | string
  tu_vung?: string[] | string
  mau_cau?: string[] | string
  /** Tin, Công nghệ lớp 10–12 */
  dinh_huong?: string
  /** KHTN */
  mach?: string
}
export interface KhungLop {
  lop: number
  /** chỉ có ở file tiểu học gộp nhiều môn */
  mon?: string
  chuong: KhungChuong[]
  ghi_chu_chua_chac?: string[]
}
export interface KhungCauTruc {
  loai?: string
  ten?: string
  mon?: string
  lop: number | number[]
  thoi_gian_phut?: number
  phan?: Array<{ ten: string; so_cau?: number; mo_ta?: string; tong_diem?: number }>
  cau_truc?: string
  pham_vi?: string | string[]
  ti_le_muc_do?: string
}
export interface KhungFile {
  lop: KhungLop[]
  cau_truc_de?: KhungCauTruc[]
  /** tiểu học: môn không kiểm tra định kì (TN&XH, Đạo đức) */
  danh_gia_khong_dinh_ki?: Array<{ mon: string; lop: number[]; cach_danh_gia: string; vi_du_cong_cu?: string[] }>
}
/** giữ tên cũ cho chỗ khác đang import */
export type KhungToan = KhungFile

export const deaccent = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

type Loader = () => Promise<KhungFile>
const cacheOf = new Map<string, Promise<KhungFile>>()
const lazy = (key: string, imp: () => Promise<{ default: unknown }>): Loader => () => {
  let p = cacheOf.get(key)
  if (!p) {
    p = imp().then((m) => (m.default ?? m) as KhungFile)
    cacheOf.set(key, p)
  }
  return p
}
const F = {
  toan: lazy('toan', () => import('../data/khungToan.json')),
  toanTH: lazy('toanTH', () => import('../data/khungToanTieuHoc.json')),
  van: lazy('van', () => import('../data/khungVan.json')),
  tiengViet: lazy('tiengViet', () => import('../data/khungTiengViet.json')),
  anh: lazy('anh', () => import('../data/khungAnh.json')),
  ly: lazy('ly', () => import('../data/khungLy.json')),
  hoa: lazy('hoa', () => import('../data/khungHoa.json')),
  sinh: lazy('sinh', () => import('../data/khungSinh.json')),
  khtn: lazy('khtn', () => import('../data/khungKhtn.json')),
  su: lazy('su', () => import('../data/khungSu.json')),
  dia: lazy('dia', () => import('../data/khungDia.json')),
  tin: lazy('tin', () => import('../data/khungTin.json')),
  congNghe: lazy('congNghe', () => import('../data/khungCongNghe.json')),
  gdcd: lazy('gdcd', () => import('../data/khungGdcd.json')),
  ktpl: lazy('ktpl', () => import('../data/khungKtpl.json')),
  thKhac: lazy('thKhac', () => import('../data/khungTieuHocKhac.json')),
}

/** một nguồn khung: file + (với file tiểu học gộp) tên môn để lọc lớp */
interface Src {
  load: Loader
  mon?: string
  /** lớp 6–9: người dùng nói rõ Lý/Hoá/Sinh thì chỉ lấy chương KHTN thuộc các mạch này */
  mach?: string[]
  /** nhãn phân môn khi gộp 2 nguồn (Lịch sử và Địa lí THCS) */
  nhan?: string
}
interface Subject {
  /** tên hiển thị trong prompt */
  ten: string
  re: RegExp
  /** nguồn theo lớp; [] = môn không có ở lớp đó */
  src: (lop: number) => Src[]
  /** lớp hợp lệ */
  lops: [number, number]
  /** có đề tốt nghiệp THPT */
  thpt?: boolean
}

// thứ tự quan trọng: cụm dài/cụ thể trước ("lịch sử và địa lí" trước "lịch sử", "khoa học tự nhiên" trước "khoa học")
const SUBJECTS: Subject[] = [
  {
    ten: 'Lịch sử và Địa lí',
    re: /lich su (?:va|&) dia l[iy]|\bls ?(?:&|va) ?dl\b|lsdl/,
    lops: [4, 9],
    src: (l) =>
      l <= 5
        ? [{ load: F.thKhac, mon: 'Lịch sử và Địa lí' }]
        : [
            { load: F.su, nhan: 'Phân môn Lịch sử' },
            { load: F.dia, nhan: 'Phân môn Địa lí' },
          ],
  },
  { ten: 'Khoa học tự nhiên', re: /khoa hoc tu nhien|\bkhtn\b/, lops: [6, 9], src: () => [{ load: F.khtn }] },
  { ten: 'Tự nhiên và Xã hội', re: /tu nhien (?:va|&) xa hoi|\btnxh\b/, lops: [1, 3], src: () => [{ load: F.thKhac, mon: 'Tự nhiên và Xã hội' }] },
  { ten: 'Đạo đức', re: /\bdao duc\b/, lops: [1, 5], src: () => [{ load: F.thKhac, mon: 'Đạo đức' }] },
  { ten: 'Tiếng Việt', re: /tieng viet/, lops: [1, 5], src: () => [{ load: F.tiengViet }] },
  { ten: 'Ngữ văn', re: /ngu van|\bmon van\b|\bvan\s*(?:lop\s*)?(?:1[0-2]|[6-9])\b|\bde van\b/, lops: [6, 12], thpt: true, src: () => [{ load: F.van }] },
  { ten: 'Tiếng Anh', re: /tieng anh|english|\bmon anh\b|\banh\s*(?:lop\s*)?(?:1[0-2]|[3-9])\b|\bde anh\b/, lops: [3, 12], thpt: true, src: () => [{ load: F.anh }] },
  { ten: 'Vật lí', re: /vat l[iy]|\bmon l[iy]\b|\bl[iy]\s*(?:lop\s*)?1[0-2]\b/, lops: [6, 12], thpt: true, src: (l) => [l <= 9 ? { load: F.khtn, mach: ["Lý", "Trái Đất và bầu trời"] } : { load: F.ly }] },
  { ten: 'Hoá học', re: /(?<!k)hoa hoc|\bmon hoa\b|\bhoa\s*(?:lop\s*)?1[0-2]\b|\bde hoa\b/, lops: [6, 12], thpt: true, src: (l) => [l <= 9 ? { load: F.khtn, mach: ["Hoá"] } : { load: F.hoa }] },
  { ten: 'Sinh học', re: /sinh hoc|\bmon sinh\b|\bsinh\s*(?:lop\s*)?1[0-2]\b|\bde sinh\b/, lops: [6, 12], thpt: true, src: (l) => [l <= 9 ? { load: F.khtn, mach: ["Sinh"] } : { load: F.sinh }] },
  { ten: 'Lịch sử', re: /lich su|\bmon su\b|\bsu\s*(?:lop\s*)?(?:1[0-2]|[6-9])\b/, lops: [6, 12], thpt: true, src: () => [{ load: F.su }] },
  { ten: 'Địa lí', re: /dia l[iy]|\bmon dia\b|\bdia\s*(?:lop\s*)?(?:1[0-2]|[6-9])\b/, lops: [6, 12], thpt: true, src: () => [{ load: F.dia }] },
  { ten: 'Tin học', re: /tin hoc|\bmon tin\b|\btin\s*(?:lop\s*)?(?:1[0-2]|[3-9])\b/, lops: [3, 12], thpt: true, src: (l) => [l <= 5 ? { load: F.thKhac, mon: 'Tin học' } : { load: F.tin }] },
  { ten: 'Công nghệ', re: /cong nghe/, lops: [3, 12], thpt: true, src: (l) => [l <= 5 ? { load: F.thKhac, mon: 'Công nghệ' } : { load: F.congNghe }] },
  { ten: 'Kinh tế và Pháp luật', re: /kinh te (?:va|&) phap luat|\bktpl\b|gdktpl/, lops: [10, 12], thpt: true, src: () => [{ load: F.ktpl }] },
  { ten: 'Giáo dục công dân', re: /giao duc cong dan|\bgdcd\b/, lops: [6, 12], src: (l) => [{ load: l <= 9 ? F.gdcd : F.ktpl }] },
  { ten: 'Khoa học', re: /\bkhoa hoc\b/, lops: [4, 5], src: () => [{ load: F.thKhac, mon: 'Khoa học' }] },
  { ten: 'Toán', re: /\btoan\b/, lops: [1, 12], thpt: true, src: (l) => [{ load: l <= 5 ? F.toanTH : F.toan }] },
]
const TOAN = SUBJECTS[SUBJECTS.length - 1]

/** từ khoá Toán hay gặp (đã bỏ dấu); dùng khi người dùng không nêu môn (vd "soạn 10 câu tích phân") */
const ALIASES = [
  'dao ham', 'tich phan', 'nguyen ham', 'logarit', 'loga', 'ham so mu', 'luong giac', 'to hop', 'xac suat', 'thong ke',
  'vecto', 'vector', 'oxyz', 'toa do', 'cap so', 'day so', 'gioi han', 'lien tuc', 'tiem can', 'khao sat', 'menh de',
  'tap hop', 'mat cau', 'mat phang', 'ghep nhom', 'vi-et', 'vi et', 'can bac', 'phan so', 'so nguyen', 'so huu ti',
  'so thuc', 'thales', 'dong dang', 'tu giac', 'da thuc', 'phan thuc', 'hang dang thuc', 'ti le', 'song song',
  'vuong goc', 'duong tron', 'he thuc luong', 'bat phuong trinh', 'ham so bac hai', 'tam giac bang nhau',
  'so thap phan', 'doi xung', 'da giac deu', 'phep quay', 'hinh tru', 'hinh non', 'hinh cau', 'hinh chop',
  'phuong trinh bac hai', 'phuong trinh bac nhat', 'he phuong trinh', 'chia het', 'so tu nhien',
]
/** cụm chung chung, không dùng riêng để khớp chương */
const GENERIC = new Set([
  'toa do', 'mat phang', 'bat phuong trinh', 'phuong trinh bac nhat', 'song song',
  'de kiem tra', 'kiem tra giua', 'kiem tra cuoi', 'trac nghiem', 'tu luan', 'hoc ki', 'hoc ky',
])

const hay = (c: KhungChuong) =>
  deaccent(
    [c.ten, c.chu_de ?? '', c.id.replace(/^[a-z]+\d+-/, '').replace(/-/g, ' '), ...Object.values(c.ten_theo_sach ?? {}), ...(c.cac_bai ?? [])].join(' | '),
  )

export interface KhungScope {
  /** tên môn hiển thị */
  mon: string
  /** lớp chính */
  grade: number
  /** đề tốt nghiệp THPT (phạm vi 10–12, chủ yếu 12) */
  graduation: boolean
  semester?: 1 | 2
  midterm: boolean
  /** chương khớp theo từ khoá; rỗng = cả lớp (hoặc cả học kỳ) */
  chapters: KhungChuong[]
}

interface Part {
  nhan?: string
  lop: KhungLop[]
  cau_truc_de: KhungCauTruc[]
  danhGia?: string
}

/** lấy các lớp (đã lọc theo môn với file tiểu học gộp) */
function partOf(src: Src, f: KhungFile): Part {
  let lop = src.mon ? f.lop.filter((l) => l.mon === src.mon) : f.lop.filter((l) => !l.mon)
  const mach = src.mach
  if (mach) lop = lop.map((l) => ({ ...l, chuong: l.chuong.filter((c) => !c.mach || mach.includes(c.mach)) }))
  const cau_truc_de = (f.cau_truc_de ?? []).filter((s) => !src.mon || !s.mon || s.mon === src.mon)
  const dg = src.mon ? f.danh_gia_khong_dinh_ki?.find((x) => x.mon === src.mon) : undefined
  const danhGia = dg ? `${dg.mon} không có bài kiểm tra định kì (TT 27/2020). Đánh giá: ${dg.cach_danh_gia}${dg.vi_du_cong_cu?.length ? ` Công cụ: ${dg.vi_du_cong_cu.join('; ')}` : ''}` : undefined
  return { nhan: src.nhan, lop, cau_truc_de, danhGia }
}

function readGrade(t: string): number {
  const m = /\b(?:lop|khoi|toan|ngu van|vat l[iy]|hoa hoc|sinh hoc|lich su|dia l[iy]|tin hoc|van|anh|li|ly|hoa|sinh|su|dia|tin|khtn|gdcd|ktpl|cong nghe|tieng viet|tieng anh|khoa hoc|dao duc)\s*(1[0-2]|[1-9])\b/.exec(t)
  return m ? Number(m[1]) : 0
}

function chapterMatcher(t: string, toan: boolean) {
  const words = t.split(/[^a-z0-9-]+/).filter(Boolean)
  const grams = new Set<string>()
  for (let i = 0; i + 2 < words.length; i++) grams.add(words.slice(i, i + 3).join(' '))
  if (toan) for (const a of ALIASES) if (t.includes(a)) grams.add(a)
  // môn khác Toán: thêm cụm 2 từ có nghĩa ("năng lượng", "thực vật") — bỏ cụm có từ đệm
  const STOP = new Set(["de", "ve", "lop", "cau", "mon", "bai", "kiem", "tra", "thi", "hoc", "ki", "ky", "cuoi", "giua", "nam", "soan", "cho", "va", "cac", "mot", "nhung", "trac", "nghiem", "tu", "luan", "phut", "voi", "theo", "chu", "unit"])
  if (!toan) for (let i = 0; i + 1 < words.length; i++) if (!STOP.has(words[i]) && !STOP.has(words[i + 1]) && !/\d/.test(words[i] + words[i + 1])) grams.add(`${words[i]} ${words[i + 1]}`)
  const units = [...t.matchAll(/\bunit\s*(\d{1,2})\b/g)].map((m) => `-u${m[1].padStart(2, '0')}`)
  return (lop: KhungLop) =>
    lop.chuong.filter((c) => {
      if (units.some((u) => c.id.endsWith(u))) return true
      const h = hay(c)
      return [...grams].some((g) => !GENERIC.has(g) && h.includes(g))
    })
}

/** đoán phạm vi cho một môn đã biết; null nếu không xác định được lớp */
export function detectScope(text: string, khung: KhungFile, subject: Pick<Subject, 'ten' | 'thpt'> & { re?: RegExp } = TOAN, explicit = true): KhungScope | null {
  const t = deaccent(text)
  const graduation = !!subject.thpt && /tot nghiep|thpt ?quoc gia|thptqg|thi thpt|on thi dai hoc/.test(t)
  const sem = /(?:hoc ki|hoc ky|hk|ki|ky)\s*(1|2|ii|i)\b/.exec(t)
  const semester = sem ? (sem[1] === '2' || sem[1] === 'ii' ? 2 : 1) : /cuoi nam/.test(t) ? 2 : undefined
  const midterm = /giua (?:hoc )?k[iy]/.test(t)
  // bỏ tên môn khỏi câu trước khi so chương ("lịch sử và địa lí" không được khớp chương "phát kiến địa lí")
  const re = 're' in subject && subject.re ? new RegExp(subject.re.source, 'g') : null
  const matchIn = chapterMatcher(re ? t.replace(re, ' ') : t, subject.ten === 'Toán')

  let grade = readGrade(t) || (graduation ? 12 : 0)
  let chapters: KhungChuong[] = []
  // gộp các lớp cùng số (Lịch sử + Địa lí THCS là 2 nguồn)
  const byGrade = new Map<number, KhungLop>()
  for (const l of khung.lop) {
    const g = byGrade.get(l.lop)
    byGrade.set(l.lop, g ? { ...g, chuong: g.chuong.concat(l.chuong) } : l)
  }
  if (grade) {
    const lop = byGrade.get(grade)
    if (!lop) return null
    chapters = matchIn(lop)
    if (!explicit && !graduation && !chapters.length) return null
  } else {
    // không nói lớp: nhận khi từ khoá chỉ khớp chương của đúng một lớp (vd "tích phân" → lớp 12)
    const hits = [...byGrade.values()].map((l) => ({ l, c: matchIn(l) })).filter((x) => x.c.length)
    if (hits.length !== 1) return null
    grade = hits[0].l.lop
    chapters = hits[0].c
  }
  if (graduation) chapters = []
  return { mon: subject.ten, grade, graduation, semester, midterm, chapters }
}

const asList = (x: string[] | string | undefined) => (Array.isArray(x) ? x : x ? [x] : [])
const list = (xs: string[] | string | undefined, max = 99) => asList(xs).slice(0, max).join('; ')
const yccd = (c: KhungChuong) =>
  Array.isArray(c.yeu_cau_can_dat)
    ? list(c.yeu_cau_can_dat)
    : c.yeu_cau_can_dat
      ? Object.entries(c.yeu_cau_can_dat).map(([k, v]) => `${k}: ${list(v)}`).join(' | ')
      : ''
const tag = (c: KhungChuong) => [c.dinh_huong && c.dinh_huong !== 'chung' ? `định hướng ${c.dinh_huong}` : '', c.mach ?? ''].filter(Boolean).join(', ')
const title = (c: KhungChuong, lop: number) => `• Lớp ${lop} — ${c.ten || c.chu_de} (HK${c.hoc_ky}${tag(c) ? `; ${tag(c)}` : ''})`

function chapterDetail(c: KhungChuong, lop: number) {
  return [
    title(c, lop),
    yccd(c) ? `  Yêu cầu cần đạt: ${yccd(c)}` : '',
    c.ngu_phap ? `  Ngữ pháp: ${list(c.ngu_phap)}` : '',
    c.mau_cau ? `  Mẫu câu: ${list(c.mau_cau)}` : '',
    c.kien_thuc_duoc_dung?.length ? `  Được dùng: ${list(c.kien_thuc_duoc_dung)}` : '',
    c.chua_duoc_dung?.length ? `  CHƯA được dùng: ${list(c.chua_duoc_dung)}` : '',
    c.dang_bai_dien_hinh?.length ? `  Dạng bài điển hình: ${list(c.dang_bai_dien_hinh, 6)}` : '',
    c.luu_y_ra_de ? `  Lưu ý ra đề: ${c.luu_y_ra_de}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function chapterBrief(c: KhungChuong, lop: number) {
  return [title(c, lop), c.chua_duoc_dung?.length ? `  CHƯA được dùng: ${list(c.chua_duoc_dung, 6)}` : '', c.luu_y_ra_de ? `  Lưu ý: ${c.luu_y_ra_de}` : '']
    .filter(Boolean)
    .join('\n')
}

const stName = (s: KhungCauTruc) => deaccent(s.loai ?? s.ten ?? '')
const hasLop = (s: KhungCauTruc, g: number) => (Array.isArray(s.lop) ? s.lop.includes(g) : s.lop === g)

function structureFor(scope: KhungScope, all: KhungCauTruc[]): KhungCauTruc | undefined {
  if (scope.graduation) return all.find((s) => /tot nghiep/.test(stName(s)))
  const cands = all.filter((s) => !/tot nghiep/.test(stName(s)) && hasLop(s, scope.grade))
  const want = (s: KhungCauTruc) => {
    const n = stName(s)
    const kyOk = !scope.semester || new RegExp(scope.semester === 1 ? 'k[iy] ?(?:1|i\\b)' : 'k[iy] ?(?:2|ii)|cuoi nam').test(n)
    const giuaOk = scope.midterm === /giua/.test(n)
    return kyOk && giuaOk
  }
  return cands.find(want) ?? cands[0]
}

function structureText(st: KhungCauTruc | undefined) {
  if (!st) return ''
  const body = st.phan?.length
    ? st.phan.map((p) => `${p.ten}${p.so_cau ? ` — ${p.so_cau} câu` : ''}${p.tong_diem ? `, ${p.tong_diem} điểm` : ''}`).join('; ')
    : (st.cau_truc ?? '')
  const pv = Array.isArray(st.pham_vi) ? '' : st.pham_vi
  return (
    `\nCẤU TRÚC ĐỀ THAM KHẢO (${st.loai ?? st.ten}${st.thoi_gian_phut ? `, ${st.thoi_gian_phut} phút` : ''}; dùng khi người dùng không nêu cấu trúc khác): ` +
    body +
    (pv ? `. Phạm vi: ${pv}` : '') +
    (st.ti_le_muc_do ? `. Mức độ: ${st.ti_le_muc_do}` : '')
  )
}

function chaptersFor(scope: KhungScope, part: Part): string[] {
  const out: string[] = []
  if (scope.graduation) {
    for (const l of part.lop.filter((l) => l.lop >= 10)) for (const c of l.chuong) out.push(chapterBrief(c, l.lop))
    return out
  }
  const lop = part.lop.find((l) => l.lop === scope.grade)
  if (!lop) return out
  if (scope.chapters.length) {
    const ids = new Set(scope.chapters.map((c) => c.id))
    for (const c of lop.chuong.filter((c) => ids.has(c.id))) out.push(chapterDetail(c, scope.grade))
    return out
  }
  let cs = lop.chuong
  if (scope.semester) {
    cs = cs.filter((c) => c.hoc_ky === scope.semester)
    if (scope.midterm) cs = cs.slice(0, Math.ceil(cs.length / 2))
  }
  for (const c of cs) out.push(scope.semester ? chapterDetail(c, scope.grade) : chapterBrief(c, scope.grade))
  return out
}

/** đoạn văn chèn vào system prompt */
export function buildKhungBlock(scope: KhungScope, khung: KhungFile | Part[]): string {
  const parts: Part[] = Array.isArray(khung) ? khung : [{ lop: khung.lop, cau_truc_de: khung.cau_truc_de ?? [] }]
  const tieuHoc = scope.grade <= 5
  const ky = scope.semester ? `, ${scope.midterm ? 'giữa ' : ''}học kỳ ${scope.semester}` : ''
  const head = scope.graduation
    ? `Đề tốt nghiệp THPT: phạm vi ${scope.mon} 10–12, chủ yếu lớp 12.`
    : scope.chapters.length
      ? `Đề ${scope.mon} lớp ${scope.grade}, các chương: ${scope.chapters.map((c) => c.ten || c.chu_de).join('; ')}.`
      : `Đề ${scope.mon} lớp ${scope.grade}${ky}: chỉ ra câu trong các chương dưới đây.`
  const body = parts
    .map((p) => {
      const cs = chaptersFor(scope, p)
      return cs.length ? (p.nhan ? `[${p.nhan}]\n` : '') + cs.join('\n') : ''
    })
    .filter(Boolean)
    .join('\n')
  const dg = parts.map((p) => p.danhGia).filter(Boolean).join('\n')
  const st = dg ? `\nĐÁNH GIÁ: ${dg}` : structureText(structureFor(scope, parts.flatMap((p) => p.cau_truc_de)))
  return (
    `KHUNG CHƯƠNG TRÌNH ${scope.mon.toUpperCase()} (GDPT 2018) — mặc định chỉ ra câu trong phạm vi dưới đây. ` +
    'KHÔNG dùng kiến thức ghi ở "CHƯA được dùng", kiến thức của lớp trên hay của chương trình cũ (2006). ' +
    'Soạn xong tự rà từng câu; câu nào vượt phạm vi thì thay bằng câu khác. ' +
    (tieuHoc ? 'Tiểu học đánh giá theo Thông tư 27/2020: chia câu theo Mức 1 / Mức 2 / Mức 3, không dùng Nhận biết/Thông hiểu/Vận dụng. ' : '') +
    'NGOẠI LỆ: người dùng yêu cầu RÕ nội dung, dạng bài hay ma trận nằm ngoài phạm vi (đề ôn học sinh giỏi, chủ đề cụ thể…) ' +
    'thì làm đúng theo yêu cầu đó, và thêm vào JSON trả về field "warning": một câu ngắn nói nội dung nào ngoài chương trình 2018.\n' +
    head +
    '\n' +
    body +
    st
  )
}

/** môn được nêu trong yêu cầu (môn đầu tiên khớp theo thứ tự ưu tiên) */
function subjectOf(t: string): Subject | undefined {
  return SUBJECTS.find((s) => s.re.test(t))
}

/** dùng trong AiPanel: '' khi không xác định được môn + lớp */
export async function khungPromptFor(text: string): Promise<string> {
  const t = deaccent(text)
  let subject = subjectOf(t)
  const explicit = !!subject
  // không nêu môn: chỉ đoán Toán qua từ khoá quen ("10 câu tích phân")
  if (!subject) {
    if (!ALIASES.some((a) => t.includes(a))) return ''
    subject = TOAN
  }
  try {
    const g0 = readGrade(t) || (/tot nghiep|thpt/.test(t) ? 12 : 0)
    // biết lớp thì chọn nguồn theo lớp; chưa biết thì dò trên nguồn của lớp cao nhất môn đó có
    const srcs = subject.src(g0 && g0 >= subject.lops[0] && g0 <= subject.lops[1] ? g0 : subject.lops[1])
    if (g0 && (g0 < subject.lops[0] || g0 > subject.lops[1])) return ''
    const parts = await Promise.all(srcs.map(async (s) => partOf(s, await s.load())))
    const merged: KhungFile = { lop: parts.flatMap((p) => p.lop) }
    // Toán: không nêu lớp thì dò cả tiểu học lẫn 6–12
    if (subject === TOAN && !g0) merged.lop = merged.lop.concat((await F.toanTH()).lop)
    const scope = detectScope(text, merged, subject, explicit)
    if (!scope) return ''
    if (subject === TOAN && !g0 && scope.grade <= 5) return buildKhungBlock(scope, [partOf({ load: F.toanTH }, await F.toanTH())])
    return buildKhungBlock(scope, parts)
  } catch {
    return ''
  }
}
