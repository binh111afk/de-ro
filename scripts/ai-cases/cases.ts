/** Yêu cầu thử cho AI: điều kiện ghi ở đây phải kiểm được bằng máy. Độ khó, độ đẹp của hình chấm bằng mắt. */
import type { ExamBlock } from '../../src/data/docTypes'

const options = (...texts: string[]) => texts.map((text, i) => ({ label: 'ABCD'[i], text }))

export const EXAM: ExamBlock[] = [
  { type: 'heading', text: 'PHẦN I. TRẮC NGHIỆM (Toán lớp 9)', level: 1 },
  { type: 'question', no: 1, text: 'Nghiệm của phương trình $2x-6=0$ là', options: options('$x=3$', '$x=-3$', '$x=6$', '$x=2$') },
  { type: 'question', no: 2, text: 'Phương trình $x^2-5x+6=0$ có tổng hai nghiệm bằng', options: options('$5$', '$-5$', '$6$', '$-6$') },
  { type: 'question', no: 3, text: 'Căn bậc hai số học của $49$ là', options: options('$7$', '$-7$', '$\\pm 7$', '$49$') },
  { type: 'question', no: 4, text: 'Tam giác $ABC$ vuông tại $A$ có $AB=3$, $AC=4$. Độ dài cạnh $BC$ bằng', options: options('$5$', '$7$', '$25$', '$1$') },
  { type: 'question', no: 5, text: "Cho hai đường tròn $(O;3)$ và $(O';1)$ tiếp xúc ngoài tại $A$. $BD$ là đoạn nối hai tiếp điểm trên $(O)$ của hai tiếp tuyến chung ngoài. Độ dài $BD$ bằng", options: options('$3\\sqrt3$', '$3\\sqrt2$', '$2\\sqrt3$', '$3$') },
  { type: 'essay', no: 1, score: 2, text: 'Giải hệ phương trình $\\begin{cases}x+y=5\\\\x-y=1\\end{cases}$.' },
  { type: 'answerKey', items: [{ no: 1, answer: 'A' }, { no: 2, answer: 'A' }, { no: 3, answer: 'A' }, { no: 4, answer: 'A' }, { no: 5, answer: 'A' }] },
]

export interface ExamCase {
  id: string
  text: string
  /** `edit`: đề phải được sửa · `text`: trả lời bằng chữ, đề giữ nguyên · `ask`: hỏi lại */
  want: 'edit' | 'text' | 'ask'
  /** đề trống */
  empty?: boolean
  /** số các câu trắc nghiệm không được đổi nội dung */
  keep?: number[]
  /** số câu trắc nghiệm tối thiểu sau lượt này */
  minQuestions?: number
  /** sau lượt này đề phải có hình */
  figure?: boolean
}

export const EXAM_CASES: ExamCase[] = [
  { id: 'sua-so-lieu', text: 'đổi số liệu câu 4', want: 'edit', keep: [1, 2, 3, 5] },
  { id: 'sua-noi-lung', text: 'câu 3 chưa ổn lắm, dễ đoán quá', want: 'edit', keep: [1, 2, 4, 5] },
  { id: 'sua-than-phien', text: 'phương án nhiễu câu 2 ngớ ngẩn quá', want: 'edit', keep: [1, 3, 4, 5] },
  { id: 'kho-hon', text: 'câu 5 không khó lắm, cho hình khó và phức tạp hơn', want: 'edit', keep: [1, 2, 3, 4], figure: true },
  { id: 'kho-hon-ngan', text: 'câu 5 khó hơn nữa đi', want: 'edit', keep: [1, 2, 3, 4], figure: true },
  { id: 'de-hon', text: 'câu 2 học sinh yếu không làm nổi, hạ xuống chút', want: 'edit', keep: [1, 3, 4, 5] },
  { id: 'them-hinh', text: 'câu 4 nên có cái hình cho dễ nhìn', want: 'edit', keep: [1, 2, 3, 5], figure: true },
  { id: 'them-cau', text: 'thêm 2 câu về căn bậc hai', want: 'edit', keep: [1, 2, 3, 4, 5], minQuestions: 7 },
  { id: 'loi-giai-vao-de', text: 'chèn lời giải câu 5 vào đề', want: 'edit', keep: [1, 2, 3, 4, 5] },
  { id: 'soan-moi', text: 'soạn 4 câu trắc nghiệm toán 9 về hàm số y = ax^2', want: 'edit', empty: true, minQuestions: 4 },
  { id: 'mo-ho', text: 'soạn đề đi', want: 'ask', empty: true },
  { id: 'hoi-cach-giai', text: 'giải thích câu 5 giúp mình', want: 'text' },
  { id: 'hoi-tai-sao', text: 'sao câu 2 đáp án lại là A?', want: 'text' },
  { id: 'hoi-nhan-xet', text: 'đề này học sinh trung bình làm được mấy điểm', want: 'text' },
  { id: 'hoi-kiem-tra', text: 'kiểm tra xem đáp án có câu nào sai không', want: 'text' },
  { id: 'chi-trong-chat', text: 'ra thử 1 câu tích phân ngay tại đây, không cần ghi vào đề', want: 'text' },
  { id: 'chao', text: 'chào bạn', want: 'text' },
  { id: 'ngoai-luong', text: 'hôm nay mệt quá, kể chuyện gì vui đi', want: 'text' },
  { id: 'cam-on', text: 'ok cảm ơn, đề ổn rồi', want: 'text' },
]

export const SLIDE_CONTEXT = 'Bài "Phương trình bậc hai", 6 slide: 1) tiêu đề; 2) định nghĩa; 3) công thức nghiệm; 4) ví dụ; 5) bài tập; 6) tổng kết. Đang chọn slide 3.'

export interface SlideCase {
  id: string
  text: string
  /** số slide đang có (0 = chưa có bài) */
  existing: number
  want: 'plan' | 'commands' | 'text'
}

export const SLIDE_CASES: SlideCase[] = [
  { id: 'tao-bai', text: 'tạo bài giảng 6 slide về quang hợp lớp 6', existing: 0, want: 'plan' },
  { id: 'hoi-chua-co-bai', text: 'dạy quang hợp thì nên mở bài thế nào?', existing: 0, want: 'text' },
  { id: 'doi-mau', text: 'đổi bộ màu sang tông xanh', existing: 6, want: 'commands' },
  { id: 'sua-noi-lung-slide', text: 'slide 3 chữ nhiều quá', existing: 6, want: 'commands' },
  { id: 'them-slide', text: 'thêm 1 slide về ứng dụng thực tế', existing: 6, want: 'commands' },
  { id: 'hoi-ve-slide', text: 'bài này dạy trong 45 phút có dài quá không?', existing: 6, want: 'text' },
  { id: 'bai-moi-khi-da-co', text: 'thôi bỏ bài này, soạn cho mình bài 8 slide về quang hợp lớp 6', existing: 6, want: 'plan' },
]

export interface BoardCase {
  id: string
  text: string
  want: 'ops' | 'text'
}

export const BOARD_CASES: BoardCase[] = [
  { id: 've-do-thi', text: 'vẽ đồ thị y = x^2 lên bảng', want: 'ops' },
  { id: 've-noi-lung', text: 'cho cái tam giác vuông ra giữa bảng', want: 'ops' },
  { id: 'hoi-bang', text: 'gợi ý cách chia bảng cho tiết hình học', want: 'text' },
  { id: 'ngoai-luong-bang', text: 'chúc mừng lớp nhân ngày 20/11 nên nói gì', want: 'text' },
]
