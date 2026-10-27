/**
 * Gói theo môn cho slide AI (giai đoạn 1).
 *
 * Style pack (slideStyles.ts) là hướng thẩm mỹ; gói môn là hướng **sư phạm**:
 * một bài Toán đi từ khởi động → khái niệm → ví dụ mẫu → luyện tập, còn bài Văn
 * đi từ tác giả → trích đoạn → phân tích → nghệ thuật. Gói chỉ là dữ liệu khai
 * báo — planner chọn gói theo chủ đề, prompt dàn ý và từng slide đọc từ đây —
 * nên thêm một môn là thêm một mục, không đụng engine.
 */

export interface SubjectPack {
  id: string
  name: string
  /** từ khoá (không dấu, chữ thường) để suy ra môn khi model không chọn */
  keywords: string[]
  /** theme gợi ý (id trong DECK_THEMES) */
  themeHint: string
  /** trình tự bài giảng gợi ý — mỗi mục là một slide hoặc một cụm slide */
  structure: string[]
  /** layout nên ưu tiên cho môn này */
  layouts: string[]
  /** luật nội dung riêng của môn, chèn vào prompt từng slide */
  rules: string[]
}

export const SUBJECT_PACKS: SubjectPack[] = [
  {
    id: 'toan',
    name: 'Toán',
    keywords: ['toan', 'ham so', 'phuong trinh', 'bat phuong trinh', 'hinh hoc', 'dai so', 'uoc', 'boi', 'phan so', 'luong giac', 'dao ham', 'tich phan', 'xac suat', 'thong ke', 'vector', 'so hoc'],
    themeHint: 'sang',
    structure: [
      'Khởi động: một bài toán/tình huống gợi mở',
      'Khái niệm, định nghĩa',
      'Tính chất / công thức cần nhớ',
      'Ví dụ mẫu: đề bài rồi lời giải từng bước, có đáp số',
      'Luyện tập hoặc kiểm tra nhanh (có đáp án đúng)',
      'Tổng kết và dặn dò',
    ],
    layouts: ['statement', 'comparison', 'table', 'timeline', 'quiz', 'stats'],
    rules: [
      'Ví dụ dùng số liệu cụ thể và đã tính ĐÚNG; lời giải chia bước ngắn, mỗi bước một dòng, có kết quả cuối.',
      'Quiz chỉ có một đáp án đúng chắc chắn; các phương án sai là lỗi học sinh hay mắc.',
      'Công thức viết gọn, một công thức mỗi dòng; nêu điều kiện (a ≠ 0, x > 0…) khi cần.',
    ],
  },
  {
    id: 'van',
    name: 'Ngữ văn',
    keywords: ['van', 'ngu van', 'truyen', 'tho', 'tac pham', 'tac gia', 'nhan vat', 'phan tich', 'nghi luan', 'doan trich', 'chi pheo', 'kieu', 'bai tho', 'van hoc'],
    themeHint: 'giay-am',
    structure: [
      'Giới thiệu tác giả và tác phẩm',
      'Hoàn cảnh sáng tác, bối cảnh',
      'Trích đoạn tiêu biểu (nguyên văn, ngắn)',
      'Phân tích nhân vật / hình tượng / chi tiết',
      'Nghệ thuật đặc sắc',
      'Giá trị, ý nghĩa và liên hệ',
      'Tổng kết',
    ],
    layouts: ['quote', 'statement', 'two-column', 'comparison', 'timeline', 'cards'],
    rules: [
      'Trích dẫn nguyên văn ngắn (≤ 2 câu), đặt trong dấu ngoặc kép và ghi rõ tác phẩm; không bịa câu trích.',
      'Mỗi luận điểm kèm một dẫn chứng cụ thể trong tác phẩm; tiêu đề slide nêu thẳng luận điểm.',
      'Không bịa chi tiết, năm tháng hay nhân vật không có trong tác phẩm.',
    ],
  },
  {
    id: 'su-dia',
    name: 'Lịch sử & Địa lí',
    keywords: ['lich su', 'dia li', 'dia ly', 'chien tranh', 'khoi nghia', 'cach mang', 'trieu dai', 'khi hau', 'dan cu', 'kinh te', 'ban do', 'song ngoi', 'chien thang', 'chien dich', 'dien bien phu', 'phong kien', 'thuc dan'],
    themeHint: 'giay-am',
    structure: [
      'Bối cảnh / vị trí, phạm vi',
      'Diễn biến theo dòng thời gian (Sử) hoặc đặc điểm theo vùng (Địa)',
      'Nguyên nhân',
      'Kết quả, số liệu',
      'Ý nghĩa, bài học',
      'Củng cố và liên hệ',
    ],
    layouts: ['timeline', 'stats', 'comparison', 'table', 'statement', 'cards'],
    rules: [
      'Mốc thời gian (năm, ngày), tên riêng và số liệu phải chính xác; có đơn vị đi kèm (km², triệu người, %).',
      'Sự kiện xếp theo trình tự: nguyên nhân → diễn biến → kết quả → ý nghĩa.',
      'Không biết chắc con số hay mốc thời gian thì nêu khái quát, đừng bịa.',
    ],
  },
  {
    id: 'ngoai-ngu',
    name: 'Ngoại ngữ',
    keywords: ['tieng anh', 'english', 'ngu phap', 'tu vung', 'grammar', 'vocabulary', 'ielts', 'toeic', 'present', 'past tense', 'thi hien tai', 'thi qua khu', 'hoi thoai', 'tieng phap', 'tieng nhat', 'tieng han'],
    themeHint: 'tim',
    structure: [
      'Khởi động (câu hỏi, hình ảnh gợi mở)',
      'Từ vựng chủ đề: từ, nghĩa, ví dụ',
      'Ngữ pháp: cấu trúc và cách dùng',
      'Ví dụ câu / hội thoại ngắn',
      'Luyện tập (chọn đáp án, điền từ)',
      'Tổng kết',
    ],
    layouts: ['table', 'comparison', 'two-column', 'quiz', 'cards', 'statement'],
    rules: [
      'Từ vựng và ví dụ viết đúng chính tả ngoại ngữ, kèm nghĩa tiếng Việt ngắn.',
      'Mỗi cấu trúc ngữ pháp có công thức rõ (S + V-ed…) và đúng một ví dụ ngắn.',
      'Câu ví dụ ngắn, tự nhiên, đúng ngữ pháp đang dạy.',
    ],
  },
  {
    id: 'tin',
    name: 'Tin học',
    keywords: ['tin hoc', 'lap trinh', 'thuat toan', 'python', 'scratch', 'bien so', 'vong lap', 'co so du lieu', 'mang may tinh', 'internet', 'excel', 'html', 'code', 'phan mem', 'an toan thong tin'],
    themeHint: 'dem-xanh',
    structure: [
      'Vấn đề / tình huống mở đầu',
      'Khái niệm cốt lõi',
      'Thuật toán hoặc quy trình từng bước',
      'Ví dụ minh hoạ (đoạn mã ngắn hoặc thao tác)',
      'Bài tập thực hành',
      'Tổng kết',
    ],
    layouts: ['timeline', 'cycle', 'table', 'comparison', 'quiz', 'bullets'],
    rules: [
      'Thuật toán/quy trình chia bước ngắn, mỗi bước một hành động rõ ràng.',
      'Ví dụ mã giữ ≤ 4 dòng ngắn, dùng tên biến dễ hiểu; không dán đoạn mã dài.',
      'Dùng thuật ngữ tiếng Việt kèm thuật ngữ gốc ở lần đầu (biến — variable).',
    ],
  },
  {
    id: 'khtn',
    name: 'Khoa học tự nhiên (Lý, Hoá, Sinh)',
    keywords: ['vat li', 'vat ly', 'hoa hoc', 'sinh hoc', 'khoa hoc tu nhien', 'luc', 'chuyen dong', 'dong dien', 'dien tro', 'phan ung', 'bang tuan hoan', 'tinh the', 'te bao', 'quang hop', 'di truyen', 'sinh thai', 'axit', 'bazo', 'nang luong', 'khtn'],
    themeHint: 'rung',
    structure: [
      'Hiện tượng / câu hỏi mở đầu',
      'Khái niệm, định luật',
      'Công thức, phương trình / sơ đồ quá trình',
      'Thí nghiệm hoặc quy trình (từng bước)',
      'Ví dụ tính toán / ứng dụng thực tế',
      'Kiểm tra nhanh và tổng kết',
    ],
    layouts: ['timeline', 'cycle', 'comparison', 'stats', 'table', 'quiz'],
    rules: [
      'Nêu đơn vị đo cho mọi đại lượng (m/s, N, mol, °C); công thức kèm ý nghĩa từng ký hiệu.',
      'Thí nghiệm/quá trình trình bày theo bước có thứ tự; hiện tượng quan sát được nêu riêng với kết luận.',
      'Ví dụ tính toán có số liệu cụ thể, kết quả đúng và đúng chữ số có nghĩa hợp lý.',
    ],
  },
  {
    id: 'khac',
    name: 'Chủ đề chung',
    keywords: [],
    themeHint: 'sang',
    structure: [
      'Mở đầu: vấn đề hoặc câu hỏi',
      'Ý chính 1–3, mỗi ý một slide kèm ví dụ',
      'So sánh hoặc số liệu minh hoạ',
      'Kiểm tra nhanh hoặc thảo luận',
      'Tổng kết, hành động tiếp theo',
    ],
    layouts: ['statement', 'cards', 'comparison', 'stats', 'timeline'],
    rules: ['Mỗi slide một thông điệp, kèm ví dụ hoặc số liệu cụ thể.'],
  },
]

const IDS = new Set(SUBJECT_PACKS.map((pack) => pack.id))

export const isSubjectId = (value: unknown): value is string =>
  typeof value === 'string' && IDS.has(value)

export const subjectById = (id: string | undefined): SubjectPack | undefined =>
  SUBJECT_PACKS.find((pack) => pack.id === id)

const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()

/**
 * Suy ra môn từ chủ đề khi model không trả `subject` hợp lệ: gói có nhiều từ
 * khoá khớp nhất thắng; không khớp thì `khac`. Từ khoá ngắn (≤ 3 ký tự) phải
 * khớp cả từ để "uoc" không dính vào "thuoc".
 */
export function inferSubject(text: string): string {
  const haystack = ` ${fold(text)} `
  let best = 'khac'
  let bestScore = 0
  for (const pack of SUBJECT_PACKS) {
    const score = pack.keywords.reduce((sum, keyword) => {
      const key = keyword.trim()
      const hit = key.length <= 3 ? haystack.includes(` ${key} `) : haystack.includes(key)
      return sum + (hit ? 1 : 0)
    }, 0)
    if (score > bestScore) {
      best = pack.id
      bestScore = score
    }
  }
  return best
}

/** Catalog gửi cho model khi lập dàn ý. */
export function subjectCatalogText(): string {
  return [
    'MÔN HỌC (chọn "subject" đúng một id — dàn ý phải bám cấu trúc bài gợi ý của môn):',
    ...SUBJECT_PACKS.map(
      (pack) =>
        `- ${pack.id}: ${pack.name}. Cấu trúc: ${pack.structure.join(' → ')}. ` +
        `Layout ưu tiên: ${pack.layouts.join(', ')}. Theme gợi ý: ${pack.themeHint}.`,
    ),
  ].join('\n')
}

/** Khối luật môn chèn vào prompt từng slide (rỗng nếu không rõ môn). */
export function subjectRulesBlock(id: string | undefined): string {
  const pack = subjectById(id)
  if (!pack || pack.id === 'khac') return ''
  return `MÔN HỌC: ${pack.name}\n` + pack.rules.map((rule) => `- ${rule}`).join('\n') + '\n\n'
}
