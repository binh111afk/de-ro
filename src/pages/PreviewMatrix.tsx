import { MatrixModal } from '@/examEditor/tools/MatrixModal'
import { emptyDoc, type QuestionBlock } from '@/data/docTypes'

const sampleDoc = {
  ...emptyDoc(),
  title: 'Đề kiểm tra học kỳ II - Môn Toán 12',
  subject: 'Toán',
  grade: '12',
  duration: '90 phút',
  term: 'Cuối học kỳ II',
  schoolYear: '2025 - 2026',
  blocks: [
    ...Array.from({ length: 12 }, (_, i): QuestionBlock => ({
      type: 'question',
      no: i + 1,
      kind: 'mcq',
      text: i < 6 ? `Cho hàm số y = f(x) có đạo hàm f'(x). Khảo sát hàm số tại điểm x = ${i + 1}.` : `Trong không gian Oxyz, cho điểm M(${i}, 1, 2) và vectơ v.`,
      options: [
        { label: 'A', text: 'y = 2x + 1' },
        { label: 'B', text: 'y = -x + 3' },
        { label: 'C', text: 'y = 3x - 2' },
        { label: 'D', text: 'y = x^2' },
      ],
    })),
    ...Array.from({ length: 4 }, (_, i): QuestionBlock => ({
      type: 'question',
      no: 12 + i + 1,
      kind: 'tf',
      text: `Cho hàm số bậc ba y = ax^3 + bx^2 + cx + d. Xét tính đúng sai của các mệnh đề:`,
      options: [
        { label: 'a', text: 'Hàm số đồng biến trên R' },
        { label: 'b', text: 'Đồ thị có điểm cực đại tại x = 0' },
        { label: 'c', text: 'Giá trị nhỏ nhất bằng -2' },
        { label: 'd', text: 'Phương trình f(x) = 0 có đúng 3 nghiệm' },
      ],
    })),
    ...Array.from({ length: 6 }, (_, i): QuestionBlock => ({
      type: 'question',
      no: 16 + i + 1,
      kind: 'short',
      text: `Tính tích phân I = \\int_0^1 (2x + ${i}) dx.`,
      options: [],
    })),
  ],
}

export default function PreviewMatrix() {
  return (
    <div className="h-screen w-screen bg-slate-100 p-4">
      <MatrixModal doc={sampleDoc} onClose={() => {}} onInsertBlocks={() => {}} />
    </div>
  )
}
