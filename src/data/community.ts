import type { Exam } from './types'

export const COMMUNITY_EXAMS: Exam[] = [
  {
    id: 'ct-toan-9-2026',
    title: 'Đề thi môn Toán lớp 9 cuối học kỳ II năm học 2025 - 2026',
    subject: 'Toán',
    grade: 'Lớp 9',
    school: 'Trường THCS Nguyễn Du',
    year: '2025 – 2026',
    term: 'Học kỳ II',
    durationMinutes: 45,
    interactive: true,
    author: 'Nguyễn Minh Anh',
    createdAt: '2026-09-18T07:15:00.000Z',
    views: 3380,
    likes: 462,
    shared: true,
    sections: [
      {
        id: 'ct-toan-9-2026-s1',
        title: 'PHẦN I. TRẮC NGHIỆM',
        points: 5,
        questions: [
          {
            id: 'ct-toan-9-2026-s1-q1',
            number: 1,
            type: 'trac-nghiem',
            prompt: 'Biểu thức $\\sqrt{16}$ có giá trị bằng:',
            options: [
              { key: 'A', text: '4' },
              { key: 'B', text: '8' },
              { key: 'C', text: '2' },
              { key: 'D', text: '16' },
            ],
            answer: 'A',
            explanation: '$\\sqrt{16} = \\sqrt{2^4} = 2^2 = 4$.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q2',
            number: 2,
            type: 'trac-nghiem',
            prompt: 'Biểu thức $\\sqrt{(-3)^2}$ bằng:',
            options: [
              { key: 'A', text: '$-3$' },
              { key: 'B', text: '$3$' },
              { key: 'C', text: '$9$' },
              { key: 'D', text: '$\\pm 3$' },
            ],
            answer: 'B',
            explanation: '$\\sqrt{a^2} = |a|$ nên $\\sqrt{(-3)^2} = 3$, tuyệt đối không phải $-3$.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q3',
            number: 3,
            type: 'trac-nghiem',
            prompt: 'Biểu thức $\\sqrt{12 \\cdot 27}$ bằng:',
            options: [
              { key: 'A', text: '$6$' },
              { key: 'B', text: '$324$' },
              { key: 'C', text: '$9$' },
              { key: 'D', text: '$18$' },
            ],
            answer: 'D',
            explanation: '$12 \\cdot 27 = 324$ và $\\sqrt{324} = 18$.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q4',
            number: 4,
            type: 'trac-nghiem',
            prompt: 'Rút gọn biểu thức $\\dfrac{\\sqrt{50}}{\\sqrt{2}}$ ta được:',
            options: [
              { key: 'A', text: '$25$' },
              { key: 'B', text: '$4$' },
              { key: 'C', text: '$5$' },
              { key: 'D', text: '$10$' },
            ],
            answer: 'C',
            explanation: '$\\dfrac{\\sqrt{50}}{\\sqrt{2}} = \\sqrt{\\dfrac{50}{2}} = \\sqrt{25} = 5$.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q5',
            number: 5,
            type: 'trac-nghiem',
            prompt: 'Sau khi trục căn thức hai, biểu thức $\\dfrac{1}{2 - \\sqrt{3}}$ có dạng:',
            options: [
              { key: 'A', text: '$2 - \\sqrt{3}$' },
              { key: 'B', text: '$2 + \\sqrt{3}$' },
              { key: 'C', text: '$4 - 3$' },
              { key: 'D', text: '$1 - 2\\sqrt{3}$' },
            ],
            answer: 'B',
            explanation:
              'Nhân cả tử và mẫu với $(2 + \\sqrt{3})$: $\\dfrac{2 + \\sqrt{3}}{4 - 3} = 2 + \\sqrt{3}$.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q6',
            number: 6,
            type: 'trac-nghiem',
            prompt: 'Phương trình $x^2 - 5x + 6 = 0$ có nghiệm:',
            options: [
              { key: 'A', text: '$x = 2$ hoặc $x = 3$' },
              { key: 'B', text: '$x = -2$ hoặc $x = -3$' },
              { key: 'C', text: '$x = 1$ hoặc $x = 6$' },
              { key: 'D', text: '$x = 2$ hoặc $x = -3$' },
            ],
            answer: 'A',
            explanation: '$x^2 - 5x + 6 = (x - 2)(x - 3)$, hai nghiệm là $2$ và $3$.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q7',
            number: 7,
            type: 'trac-nghiem',
            prompt: 'Với $a < 0$ thì $\\sqrt{a^2}$ bằng:',
            options: [
              { key: 'A', text: '$a$' },
              { key: 'B', text: '$a^2$' },
              { key: 'C', text: '$-a$' },
              { key: 'D', text: '$0$' },
            ],
            answer: 'C',
            explanation: '$\\sqrt{a^2} = |a|$ và $a < 0$ nên $|a| = -a$.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q8',
            number: 8,
            type: 'trac-nghiem',
            prompt: 'Đường thẳng $y = -2x + 3$ có hệ số góc bằng:',
            options: [
              { key: 'A', text: '$2$' },
              { key: 'B', text: '$-3$' },
              { key: 'C', text: '$-2$' },
              { key: 'D', text: '$3$' },
            ],
            answer: 'C',
            explanation: 'Trong $y = ax + b$, hệ số góc chính là hệ số của $x$.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q9',
            number: 9,
            type: 'trac-nghiem',
            prompt: 'Hệ số góc của đường thẳng vuông góc với đường thẳng $y = 3x + 1$ bằng:',
            options: [
              { key: 'A', text: '$3$' },
              { key: 'B', text: '$\\dfrac{1}{3}$' },
              { key: 'C', text: '$-3$' },
              { key: 'D', text: '$-\\dfrac{1}{3}$' },
            ],
            answer: 'D',
            explanation: 'Hai đường thẳng vuông góc có tích hai hệ số góc bằng $-1$: $3 \\cdot k = -1$.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q10',
            number: 10,
            type: 'trac-nghiem',
            prompt: 'Hàm số $y = x^2$ nghịch biến trên khoảng:',
            options: [
              { key: 'A', text: '$(-\\infty; 0)$' },
              { key: 'B', text: '$(0; +\\infty)$' },
              { key: 'C', text: '$(-\\infty; 0)$ và $(0; +\\infty)$' },
              { key: 'D', text: '$(-\\infty; +\\infty)$' },
            ],
            answer: 'A',
            explanation: 'Trên khoảng bên trái trục tung, $x$ tăng thì $x^2$ giảm nên hàm số nghịch biến.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q11',
            number: 11,
            type: 'trac-nghiem',
            prompt:
              'Giao điểm của hai đường thẳng $y = x + 2$ và $y = -2x + 1$ có tọa độ:',
            options: [
              { key: 'A', text: '$(1; 3)$' },
              { key: 'B', text: '$(-1; 1)$' },
              { key: 'C', text: '$\\left(-\\dfrac{1}{3};\\dfrac{5}{3}\\right)$' },
              { key: 'D', text: '$(-2; -1)$' },
            ],
            answer: 'C',
            explanation:
              'Giải $x + 2 = -2x + 1$ được $x = -\\dfrac{1}{3}$, suy ra $y = \\dfrac{5}{3}$.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q12',
            number: 12,
            type: 'trac-nghiem',
            prompt: 'Phương trình $x^2 - 2x + 5 = 0$ có số nghiệm thực là:',
            options: [
              { key: 'A', text: '$2$' },
              { key: 'B', text: '$3$' },
              { key: 'C', text: '$0$' },
              { key: 'D', text: '$1$' },
            ],
            answer: 'C',
            explanation: '$\\Delta = (-2)^2 - 4 \\cdot 1 \\cdot 5 = -16 < 0$ nên phương trình vô nghiệm.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q13',
            number: 13,
            type: 'trac-nghiem',
            prompt:
              'Hệ phương trình gồm hai phương trình $x + y = 5$ và $x - y = 1$ có nghiệm là:',
            options: [
              { key: 'A', text: '$(3; 2)$' },
              { key: 'B', text: '$(2; 3)$' },
              { key: 'C', text: '$(1; 4)$' },
              { key: 'D', text: '$(5; 1)$' },
            ],
            answer: 'A',
            explanation: 'Cộng hai phương trình được $2x = 6$, suy ra $x = 3$, $y = 2$.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q14',
            number: 14,
            type: 'trac-nghiem',
            prompt: 'Đường tròn $(x - 2)^2 + (y + 1)^2 = 9$ có tâm $I$ và bán kính $R$ là:',
            options: [
              { key: 'A', text: '$I(-2; 1)$ và $R = 3$' },
              { key: 'B', text: '$I(2; 1)$ và $R = 9$' },
              { key: 'C', text: '$I(2; -1)$ và $R = 9$' },
              { key: 'D', text: '$I(2; -1)$ và $R = 3$' },
            ],
            answer: 'D',
            explanation: 'Tâm là $I(2; -1)$ và bán kính $R = \\sqrt{9} = 3$.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q15',
            number: 15,
            type: 'trac-nghiem',
            prompt: 'Giao điểm của đường tròn $x^2 + y^2 = 4$ với trục hoành là:',
            options: [
              { key: 'A', text: '$(0; 2)$ và $(0; -2)$' },
              { key: 'B', text: '$(4; 0)$ và $(-4; 0)$' },
              { key: 'C', text: '$(0; 0)$' },
              { key: 'D', text: '$(2; 0)$ và $(-2; 0)$' },
            ],
            answer: 'D',
            explanation: 'Trên trục hoành $y = 0$, ta có $x^2 = 4$ nên $x = \\pm 2$.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q16',
            number: 16,
            type: 'trac-nghiem',
            prompt: 'Một đường tròn có chu vi bằng $12\\pi$ cm. Bán kính đường tròn đó là:',
            options: [
              { key: 'A', text: '$3$ cm' },
              { key: 'B', text: '$12$ cm' },
              { key: 'C', text: '$6$ cm' },
              { key: 'D', text: '$6\\pi$ cm' },
            ],
            answer: 'C',
            explanation: '$C = 2\\pi R$ suy ra $R = \\dfrac{12\\pi}{2\\pi} = 6$ cm.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q17',
            number: 17,
            type: 'trac-nghiem',
            prompt: 'Diện tích của hình tròn có bán kính $3$ cm là:',
            options: [
              { key: 'A', text: '$27\\pi\\,\\text{cm}^2$' },
              { key: 'B', text: '$3\\pi\\,\\text{cm}^2$' },
              { key: 'C', text: '$6\\pi\\,\\text{cm}^2$' },
              { key: 'D', text: '$9\\pi\\,\\text{cm}^2$' },
            ],
            answer: 'D',
            explanation: '$S = \\pi R^2 = \\pi \\cdot 3^2 = 9\\pi\\,\\text{cm}^2$.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q18',
            number: 18,
            type: 'trac-nghiem',
            prompt:
              'Một tam giác vuông cân có cạnh huyền $6\\sqrt{2}$ cm. Cạnh góc vuông của tam giác đó bằng:',
            options: [
              { key: 'A', text: '$3\\sqrt{2}$ cm' },
              { key: 'B', text: '$6\\sqrt{2}$ cm' },
              { key: 'C', text: '$6$ cm' },
              { key: 'D', text: '$12$ cm' },
            ],
            answer: 'C',
            explanation: 'Cạnh huyền của tam giác vuông cân bằng $a\\sqrt{2}$ nên $a = 6$ cm.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q19',
            number: 19,
            type: 'trac-nghiem',
            prompt:
              'Cho tam giác vuông có cạnh huyền $13$ cm và một cạnh góc vuông $5$ cm. Cạnh góc vuông còn lại có độ dài:',
            options: [
              { key: 'A', text: '$8$ cm' },
              { key: 'B', text: '$18$ cm' },
              { key: 'C', text: '$12$ cm' },
              { key: 'D', text: '$144$ cm' },
            ],
            answer: 'C',
            explanation: '$a = \\sqrt{13^2 - 5^2} = \\sqrt{169 - 25} = \\sqrt{144} = 12$ cm.',
            points: 0.25,
          },
          {
            id: 'ct-toan-9-2026-s1-q20',
            number: 20,
            type: 'trac-nghiem',
            prompt: 'Giá trị nhỏ nhất của biểu thức $x^2 - 4x + 7$ là:',
            options: [
              { key: 'A', text: '$3$' },
              { key: 'B', text: '$4$' },
              { key: 'C', text: '$7$' },
              { key: 'D', text: '$2$' },
            ],
            answer: 'A',
            explanation: '$x^2 - 4x + 7 = (x - 2)^2 + 3 \\ge 3$, dấu bằng xảy ra khi $x = 2$.',
            points: 0.25,
          },
        ],
      },
      {
        id: 'ct-toan-9-2026-s2',
        title: 'PHẦN II. TỰ LUẬN',
        points: 5,
        questions: [
          {
            id: 'ct-toan-9-2026-s2-q1',
            number: 1,
            type: 'tu-luan',
            prompt: 'Giải phương trình: $\\sqrt{x + 1} = x - 1$.',
            answer: 'Nghiệm của phương trình là $x = 3$.',
            solution: [
              'Điều kiện xác định: $x + 1 \\ge 0$ và $x - 1 \\ge 0$ $\\Rightarrow x \\ge 1$.',
              'Bình phương hai vế: $x + 1 = (x - 1)^2 = x^2 - 2x + 1$ $\\Rightarrow x^2 - 3x = 0$.',
              'Giải phương trình: $x = 0$ hoặc $x = 3$.',
              'Kiểm tra điều kiện $x \\ge 1$: loại $x = 0$, giữ lại $x = 3$. Thay vào: $\\sqrt{3 + 1} = 2 = 3 - 1$ (thỏa mãn).',
            ],
            explanation:
              'Khi giải phương trình chứa căn bậc hai phải kèm điều kiện xác định và kiểm tra lại từng nghiệm sau khi bình phương.',
            points: 2,
          },
          {
            id: 'ct-toan-9-2026-s2-q2',
            number: 2,
            type: 'tu-luan',
            prompt:
              "Cho hai đường thẳng $(d): y = -2x + 5$ và $(d'): y = 3x - 1$. a) Tìm tọa độ giao điểm $I$ của $(d)$ và $(d')$. b) Viết phương trình đường thẳng $(d'')$ đi qua $I$ và song song với trục hoành.",
            answer: "$I\\left(\\dfrac{6}{5};\\dfrac{13}{5}\\right)$ và $(d''): y = \\dfrac{13}{5}$.",
            solution: [
              'Giao điểm thỏa mãn: $-2x + 5 = 3x - 1 \\Rightarrow 5x = 6 \\Rightarrow x = \\dfrac{6}{5}$.',
              "Thay vào $(d)$: $y = -2 \\cdot \\dfrac{6}{5} + 5 = \\dfrac{13}{5}$, suy ra $I\\left(\\dfrac{6}{5};\\dfrac{13}{5}\\right)$.",
              'Đường thẳng song song với trục hoành có dạng $y = c$, tức hệ số góc bằng $0$.',
              "Do $(d'')$ đi qua $I$ nên $c = \\dfrac{13}{5}$, vậy $(d''): y = \\dfrac{13}{5}$.",
            ],
            explanation:
              'Bài toán kết hợp việc tìm giao điểm của hai đường thẳng với việc viết phương trình đường thẳng mới thỏa mãn điều kiện đã cho.',
            points: 2,
          },
          {
            id: 'ct-toan-9-2026-s2-q3',
            number: 3,
            type: 'tu-luan',
            prompt:
              'Tính diện tích hình tròn nội tiếp tam giác vuông có hai cạnh góc vuông lần lượt là $6$ cm và $8$ cm.',
            answer: 'Diện tích hình tròn là $S = 25\\pi\\,\\text{cm}^2$.',
            solution: [
              'Cạnh huyền của tam giác: $h = \\sqrt{6^2 + 8^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10$ cm.',
              'Bán kính đường tròn nội tiếp tam giác vuông bằng nửa cạnh huyền: $R = \\dfrac{10}{2} = 5$ cm.',
              'Diện tích: $S = \\pi R^2 = \\pi \\cdot 5^2 = 25\\pi\\,\\text{cm}^2$.',
            ],
            explanation:
              'Đường tròn nội tiếp tam giác vuông có bán kính bằng một nửa cạnh huyền, từ đó tính nhanh diện tích.',
            points: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'ct-toan-12-2026',
    title: 'Đề thi môn Toán lớp 12 chuyên đề đạo hàm - tích phân năm học 2025 - 2026',
    subject: 'Toán',
    grade: 'Lớp 12',
    school: 'Trường THPT Lê Hồng Phong',
    year: '2025 – 2026',
    term: 'Học kỳ II',
    durationMinutes: 60,
    interactive: true,
    author: 'Trần Thị Thu Hà',
    createdAt: '2026-09-02T13:40:00.000Z',
    views: 2140,
    likes: 289,
    shared: true,
    sections: [
      {
        id: 'ct-toan-12-2026-s1',
        title: 'PHẦN I. TRẮC NGHIỆM',
        points: 6,
        questions: [
          {
            id: 'ct-toan-12-2026-s1-q1',
            number: 1,
            type: 'trac-nghiem',
            prompt: "Cho $f(x) = 3x^4 - 2x^2 + 5$. Giá trị $f'(1)$ bằng:",
            options: [
              { key: 'A', text: '$10$' },
              { key: 'B', text: '$8$' },
              { key: 'C', text: '$6$' },
              { key: 'D', text: '$4$' },
            ],
            answer: 'B',
            explanation: "$f'(x) = 12x^3 - 4x$, do đó $f'(1) = 12 - 4 = 8$.",
            points: 0.5,
          },
          {
            id: 'ct-toan-12-2026-s1-q2',
            number: 2,
            type: 'trac-nghiem',
            prompt: 'Đạo hàm của hàm số $y = \\dfrac{1}{x}$ là:',
            options: [
              { key: 'A', text: '$\\dfrac{1}{x^2}$' },
              { key: 'B', text: '$-\\dfrac{1}{x^3}$' },
              { key: 'C', text: '$-\\dfrac{1}{2x}$' },
              { key: 'D', text: '$-\\dfrac{1}{x^2}$' },
            ],
            answer: 'D',
            explanation: "$y = x^{-1}$ nên $y' = -x^{-2} = -\\dfrac{1}{x^2}$.",
            points: 0.5,
          },
          {
            id: 'ct-toan-12-2026-s1-q3',
            number: 3,
            type: 'trac-nghiem',
            prompt: 'Hàm số $f(x) = x^3 - 3x + 1$ đạt cực đại tại điểm có hoành độ:',
            options: [
              { key: 'A', text: '$x = 1$' },
              { key: 'B', text: '$x = 0$' },
              { key: 'C', text: '$x = -1$' },
              { key: 'D', text: '$x = \\pm 1$' },
            ],
            answer: 'C',
            explanation:
              "$f'(x) = 3x^2 - 3 = 0 \\Rightarrow x = \\pm 1$; $f''(-1) = -6 < 0$ nên $x = -1$ là điểm cực đại.",
            points: 0.5,
          },
          {
            id: 'ct-toan-12-2026-s1-q4',
            number: 4,
            type: 'trac-nghiem',
            prompt: 'Hàm số $f(x) = x^4 - 4x^2 + 5$ đạt cực tiểu tại:',
            options: [
              { key: 'A', text: '$x = \\pm 1$' },
              { key: 'B', text: '$x = 0$' },
              { key: 'C', text: '$x = \\pm 2$' },
              { key: 'D', text: '$x = \\pm\\sqrt{2}$' },
            ],
            answer: 'D',
            explanation:
              "$f'(x) = 4x(x^2 - 2) = 0 \\Rightarrow x = 0,\\ x = \\pm\\sqrt{2}$; $f''(\\pm\\sqrt{2}) = 12 \\cdot 2 - 8 = 16 > 0$.",
            points: 0.5,
          },
          {
            id: 'ct-toan-12-2026-s1-q5',
            number: 5,
            type: 'trac-nghiem',
            prompt:
              'Diện tích hình phẳng giới hạn bởi các đường thẳng $y = 2x$, trục hoành và hai đường thẳng $x = 0$, $x = 2$ bằng:',
            options: [
              { key: 'A', text: '$8$' },
              { key: 'B', text: '$2$' },
              { key: 'C', text: '$4$' },
              { key: 'D', text: '$\\dfrac{2}{3}$' },
            ],
            answer: 'C',
            explanation: '$\\int_0^2 2x\\,\\mathrm{d}x = x^2\\big|_0^2 = 4$.',
            points: 0.5,
          },
          {
            id: 'ct-toan-12-2026-s1-q6',
            number: 6,
            type: 'trac-nghiem',
            prompt: '$\\displaystyle\\int_0^1 (2x + 1)\\,\\mathrm{d}x$ bằng:',
            options: [
              { key: 'A', text: '$1$' },
              { key: 'B', text: '$3$' },
              { key: 'C', text: '$2$' },
              { key: 'D', text: '$\\dfrac{3}{2}$' },
            ],
            answer: 'C',
            explanation: '$\\left[x^2 + x\\right]_0^1 = 1 + 1 = 2$.',
            points: 0.5,
          },
          {
            id: 'ct-toan-12-2026-s1-q7',
            number: 7,
            type: 'trac-nghiem',
            prompt: '$\\displaystyle\\int_0^2 x^2\\,\\mathrm{d}x$ bằng:',
            options: [
              { key: 'A', text: '$2$' },
              { key: 'B', text: '$\\dfrac{8}{3}$' },
              { key: 'C', text: '$4$' },
              { key: 'D', text: '$\\dfrac{2}{3}$' },
            ],
            answer: 'B',
            explanation: '$\\left[\\dfrac{x^3}{3}\\right]_0^2 = \\dfrac{8}{3}$.',
            points: 0.5,
          },
          {
            id: 'ct-toan-12-2026-s1-q8',
            number: 8,
            type: 'trac-nghiem',
            prompt: '$\\displaystyle\\int_1^e \\dfrac{1}{x}\\,\\mathrm{d}x$ bằng:',
            options: [
              { key: 'A', text: '$0$' },
              { key: 'B', text: '$1$' },
              { key: 'C', text: '$e$' },
              { key: 'D', text: '$e - 1$' },
            ],
            answer: 'B',
            explanation: '$\\ln e - \\ln 1 = 1 - 0 = 1$.',
            points: 0.5,
          },
          {
            id: 'ct-toan-12-2026-s1-q9',
            number: 9,
            type: 'trac-nghiem',
            prompt: 'Một nguyên hàm của hàm số $f(x) = \\sin x$ là:',
            options: [
              { key: 'A', text: '$\\cos x + C$' },
              { key: 'B', text: '$-\\cos x + C$' },
              { key: 'C', text: '$-\\sin x + C$' },
              { key: 'D', text: '$e^{-\\cos x} + C$' },
            ],
            answer: 'B',
            explanation: "$(\\cos x)' = -\\sin x$ nên $\\int \\sin x\\,\\mathrm{d}x = -\\cos x + C$.",
            points: 0.5,
          },
          {
            id: 'ct-toan-12-2026-s1-q10',
            number: 10,
            type: 'trac-nghiem',
            prompt:
              "Số nghiệm của phương trình $f'(x) = 0$, với $f(x) = \\dfrac{1}{3}x^3 - x^2 + 2x$, là:",
            options: [
              { key: 'A', text: 'Có đúng một nghiệm' },
              { key: 'B', text: 'Có hai nghiệm phân biệt' },
              { key: 'C', text: 'Vô nghiệm' },
              { key: 'D', text: 'Không xác định' },
            ],
            answer: 'C',
            explanation: "$f'(x) = x^2 - 2x + 2$ và $\\Delta = 4 - 8 = -4 < 0$ nên vô nghiệm.",
            points: 0.5,
          },
          {
            id: 'ct-toan-12-2026-s1-q11',
            number: 11,
            type: 'trac-nghiem',
            prompt: "Với $f(x) = e^{2x}$, ta có $f'(x)$ bằng:",
            options: [
              { key: 'A', text: '$e^{2x}$' },
              { key: 'B', text: '$2e^x$' },
              { key: 'C', text: '$e^{2x + 1}$' },
              { key: 'D', text: '$2e^{2x}$' },
            ],
            answer: 'D',
            explanation: "$f'(x) = 2e^{2x}$.",
            points: 0.5,
          },
          {
            id: 'ct-toan-12-2026-s1-q12',
            number: 12,
            type: 'trac-nghiem',
            prompt: '$\\displaystyle\\int_0^{\\pi/2} \\sin^2 x\\,\\mathrm{d}x$ bằng:',
            options: [
              { key: 'A', text: '$\\dfrac{\\pi}{4}$' },
              { key: 'B', text: '$1$' },
              { key: 'C', text: '$\\dfrac{\\pi}{2}$' },
              { key: 'D', text: '$0$' },
            ],
            answer: 'A',
            explanation:
              '$\\sin^2 x = \\dfrac{1 - \\cos 2x}{2}$ nên tích phân bằng $\\dfrac{1}{2}\\left[x - \\dfrac{\\sin 2x}{2}\\right]_0^{\\pi/2} = \\dfrac{\\pi}{4}$.',
            points: 0.5,
          },
        ],
      },
      {
        id: 'ct-toan-12-2026-s2',
        title: 'PHẦN II. TỰ LUẬN',
        points: 4,
        questions: [
          {
            id: 'ct-toan-12-2026-s2-q1',
            number: 1,
            type: 'tu-luan',
            prompt:
              'Tính đạo hàm của hàm số $y = \\dfrac{2x - 1}{x + 1}$ và xác định tập xác định của hàm số.',
            answer:
              "$y' = \\dfrac{3}{(x + 1)^2}$ và tập xác định là $D = \\mathbb{R} \\setminus \\{-1\\}$.",
            solution: [
              'Điều kiện xác định: $x + 1 \\ne 0 \\Rightarrow x \\ne -1$, suy ra $D = \\mathbb{R} \\setminus \\{-1\\}$.',
              "Áp dụng công thức đạo hàm của thương: $y' = \\dfrac{2(x + 1) - (2x - 1)}{(x + 1)^2}$.",
              'Tử số: $2x + 2 - 2x + 1 = 3$, suy ra $y\' = \\dfrac{3}{(x + 1)^2}$.',
              'Vì $3 > 0$ và $(x + 1)^2 > 0$ với mọi $x \\ne -1$ nên $y\' > 0$ trên $D$, hàm số đồng biến trên mỗi khoảng $(-\\infty; -1)$ và $(-1; +\\infty)$.',
            ],
            explanation:
              'Tính đạo hàm theo công thức thương và luôn kèm điều kiện xác định khi mẫu chứa biểu thức tuyến tính của $x$.',
            points: 1.5,
          },
          {
            id: 'ct-toan-12-2026-s2-q2',
            number: 2,
            type: 'tu-luan',
            prompt: 'Tính tích phân $\\displaystyle I = \\int_0^1 \\dfrac{x^3 + 1}{x + 1}\\,\\mathrm{d}x$.',
            answer: '$I = \\dfrac{5}{6}$.',
            solution: [
              'Phân tích nhân tử: $x^3 + 1 = (x + 1)(x^2 - x + 1)$ với $x \\ne -1$.',
              'Suy ra $\\dfrac{x^3 + 1}{x + 1} = x^2 - x + 1$ trên đoạn $[0; 1]$.',
              'Tích phân: $I = \\int_0^1 (x^2 - x + 1)\\,\\mathrm{d}x = \\left[\\dfrac{x^3}{3} - \\dfrac{x^2}{2} + x\\right]_0^1$.',
              'Kết quả: $I = \\dfrac{1}{3} - \\dfrac{1}{2} + 1 = \\dfrac{2 - 3 + 6}{6} = \\dfrac{5}{6}$.',
            ],
            explanation:
              'Khi tích phân một thương, cần rút gọn mẫu trước bằng cách phân tích nhân tử để thuận tiện tính các nguyên hàm.',
            points: 1.5,
          },
          {
            id: 'ct-toan-12-2026-s2-q3',
            number: 3,
            type: 'tu-luan',
            prompt:
              'Tìm giá trị lớn nhất của hàm số $f(x) = x - \\dfrac{1}{x}$ trên đoạn $[1; 2]$.',
            answer:
              'Giá trị lớn nhất là $\\dfrac{3}{2}$, đạt tại $x = 2$.',
            solution: [
              'Hàm số xác định với $x \\ne 0$, nên trên đoạn $[1; 2]$ hàm số xác định liên tục.',
              "$f'(x) = 1 + \\dfrac{1}{x^2} > 0$ với mọi $x \\in [1; 2]$, do đó $f$ đồng biến trên đoạn này.",
              'Giá trị lớn nhất đạt tại đầu mút $x = 2$: $f(2) = 2 - \\dfrac{1}{2} = \\dfrac{3}{2}$.',
            ],
            explanation:
              'Dùng đạo hàm để xét tính đơn điệu của hàm số, từ đó tìm giá trị lớn nhất trên đoạn đã cho.',
            points: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'ct-vatli-10-2026',
    title: 'Đề thi môn Vật lí lớp 10 học kỳ II năm học 2025 - 2026',
    subject: 'Vật lí',
    grade: 'Lớp 10',
    school: 'Trường THPT Trần Đình Xu',
    year: '2025 – 2026',
    term: 'Học kỳ II',
    durationMinutes: 60,
    interactive: true,
    author: 'Phạm Quốc Việt',
    createdAt: '2026-08-25T02:10:00.000Z',
    views: 1720,
    likes: 214,
    shared: true,
    sections: [
      {
        id: 'ct-vatli-10-2026-s1',
        title: 'PHẦN I. TRẮC NGHIỆM',
        points: 6,
        questions: [
          {
            id: 'ct-vatli-10-2026-s1-q1',
            number: 1,
            type: 'trac-nghiem',
            prompt:
              'Một xe chuyển động thẳng đều với vận tốc $v = 20\,\text{m/s}$ trong thời gian $t = 15\,\text{s}$. Quãng đường xe đi được là:',
            options: [
              { key: 'A', text: '$300\,\text{m}$' },
              { key: 'B', text: '$200\,\text{m}$' },
              { key: 'C', text: '$35\,\text{m}$' },
              { key: 'D', text: '$3\,\text{m}$' },
            ],
            answer: 'A',
            explanation: '$s = v \cdot t = 20 \cdot 15 = 300\,\text{m}$.',
            points: 0.5,
          },
          {
            id: 'ct-vatli-10-2026-s1-q2',
            number: 2,
            type: 'trac-nghiem',
            prompt:
              'Một xe khởi hành từ trạng thái đứng yên với gia tốc $a = 2\,\text{m/s}^2$. Sau $10\,\text{s}$ vận tốc của xe là:',
            options: [
              { key: 'A', text: '$2\,\text{m/s}$' },
              { key: 'B', text: '$20\,\text{m/s}$' },
              { key: 'C', text: '$0{,}5\,\text{m/s}$' },
              { key: 'D', text: '$18\,\text{m/s}$' },
            ],
            answer: 'B',
            explanation: '$v = v_0 + at = 0 + 2 \cdot 10 = 20\,\text{m/s}$.',
            points: 0.5,
          },
          {
            id: 'ct-vatli-10-2026-s1-q3',
            number: 3,
            type: 'trac-nghiem',
            prompt:
              'Một vật có khối lượng $m = 1{,}8\,\text{kg}$ và thể tích $V = 3 \cdot 10^{-3}\,\text{m}^3$. Khối lượng riêng của vật là:',
            options: [
              { key: 'A', text: '$600\,\text{kg/m}^3$' },
              { key: 'B', text: '$6000\,\text{kg/m}^3$' },
              { key: 'C', text: '$0{,}6\,\text{kg/m}^3$' },
              { key: 'D', text: '$60\,\text{kg/m}^3$' },
            ],
            answer: 'A',
            explanation: '$\rho = \dfrac{m}{V} = \dfrac{1{,}8}{3 \cdot 10^{-3}} = 600\,\text{kg/m}^3$.',
            points: 0.5,
          },
          {
            id: 'ct-vatli-10-2026-s1-q4',
            number: 4,
            type: 'trac-nghiem',
            prompt:
              'Hai lực $5\,\text{N}$ và $8\,\text{N}$ cùng chiều tác dụng lên một vật. Lực tổng hợp có độ lớn:',
            options: [
              { key: 'A', text: '$13\,\text{N}$' },
              { key: 'B', text: '$3\,\text{N}$' },
              { key: 'C', text: '$40\,\text{N}$' },
              { key: 'D', text: '$1{,}6\,\text{N}$' },
            ],
            answer: 'A',
            explanation: 'Các lực cùng chiều nên lực tổng hợp $F = 5 + 8 = 13\,\text{N}$.',
            points: 0.5,
          },
          {
            id: 'ct-vatli-10-2026-s1-q5',
            number: 5,
            type: 'trac-nghiem',
            prompt:
              'Một người đẩy một thùng sắt với lực $200\,\text{N}$. Lực mà thùng sắt tác dụng lại người có độ lớn và chiều:',
            options: [
              { key: 'A', text: '$0\,\text{N}$, không có chiều' },
              { key: 'B', text: '$200\,\text{N}$, cùng chiều với lực đẩy' },
              { key: 'C', text: '$200\,\text{N}$, ngược chiều với lực đẩy' },
              { key: 'D', text: '$400\,\text{N}$, ngược chiều với lực đẩy' },
            ],
            answer: 'C',
            explanation:
              'Theo định luật III Newton, hai lực tương tác cân bằng, có độ lớn bằng nhau và ngược chiều.',
            points: 0.5,
          },
          {
            id: 'ct-vatli-10-2026-s1-q6',
            number: 6,
            type: 'trac-nghiem',
            prompt:
              'Một vật được thả rơi tự do từ độ cao $h = 19{,}6\,\text{m}$ xuống mặt đất, lấy $g = 9{,}8\,\text{m/s}^2$. Thời gian rơi là:',
            options: [
              { key: 'A', text: '$1\,\text{s}$' },
              { key: 'B', text: '$2\,\text{s}$' },
              { key: 'C', text: '$4\,\text{s}$' },
              { key: 'D', text: '$4{,}45\,\text{s}$' },
            ],
            answer: 'B',
            explanation:
              '$h = \dfrac{1}{2}gt^2 \Rightarrow t = \sqrt{\dfrac{2h}{g}} = \sqrt{\dfrac{2 \cdot 19{,}6}{9{,}8}} = 2\,\text{s}$.',
            points: 0.5,
          },
          {
            id: 'ct-vatli-10-2026-s1-q7',
            number: 7,
            type: 'trac-nghiem',
            prompt:
              'Một ô tô chạy trên đường thẳng đi được $100\,\text{km}$ trong $2$ giờ. Vận tốc trung bình của ô tô là:',
            options: [
              { key: 'A', text: '$50\,\text{km/h}$' },
              { key: 'B', text: '$200\,\text{km/h}$' },
              { key: 'C', text: '$25\,\text{km/h}$' },
              { key: 'D', text: '$20\,\text{km/h}$' },
            ],
            answer: 'A',
            explanation: '$v_{tb} = \dfrac{s}{t} = \dfrac{100}{2} = 50\,\text{km/h}$.',
            points: 0.5,
          },
          {
            id: 'ct-vatli-10-2026-s1-q8',
            number: 8,
            type: 'trac-nghiem',
            prompt:
              'Trên sàn một xe buýt đang chạy thẳng đều với vận tốc $50\,\text{km/h}$, một hành khách đặt chiếc vali lên sàn mà không dây. Vận tốc của vali so với mặt đất là:',
            options: [
              { key: 'A', text: '$50\,\text{km/h}$' },
              { key: 'B', text: '$0$' },
              { key: 'C', text: 'Lớn hơn $50\,\text{km/h}$' },
              { key: 'D', text: 'Không xác định được' },
            ],
            answer: 'A',
            explanation:
              'Vali đi theo xe vì không có lực từ nào làm thay đổi vận tốc của nó, nên vận tốc của vali bằng vận tốc của xe.',
            points: 0.5,
          },
          {
            id: 'ct-vatli-10-2026-s1-q9',
            number: 9,
            type: 'trac-nghiem',
            prompt:
              'Hai vật có cùng kích thước, một vật bằng gỗ và một vật bằng chì. Khi tác dụng vào chúng những lực bằng nhau thì vật nào thay đổi vận tốc nhanh hơn?',
            options: [
              { key: 'A', text: 'Vật bằng gỗ' },
              { key: 'B', text: 'Vật bằng chì' },
              { key: 'C', text: 'Cả hai thay đổi vận tốc như nhau' },
              { key: 'D', text: 'Không vật nào thay đổi vận tốc' },
            ],
            answer: 'A',
            explanation:
              'Vật bằng gỗ có khối lượng nhỏ hơn nên theo định luật II Newton, gia tốc của nó lớn hơn.',
            points: 0.5,
          },
          {
            id: 'ct-vatli-10-2026-s1-q10',
            number: 10,
            type: 'trac-nghiem',
            prompt:
              'Một vật có khối lượng $2\,\text{kg}$ nằm yên trên mặt phẳng ngang. Trọng lực tác dụng lên vật có độ lớn (lấy $g = 9{,}8\,\text{m/s}^2$):',
            options: [
              { key: 'A', text: '$19{,}6\,\text{N}$' },
              { key: 'B', text: '$20\,\text{N}$' },
              { key: 'C', text: '$9{,}8\,\text{N}$' },
              { key: 'D', text: '$4{,}9\,\text{N}$' },
            ],
            answer: 'A',
            explanation: '$P = mg = 2 \cdot 9{,}8 = 19{,}6\,\text{N}$.',
            points: 0.5,
          },
          {
            id: 'ct-vatli-10-2026-s1-q11',
            number: 11,
            type: 'trac-nghiem',
            prompt:
              'Một lực $F = 200\,\text{N}$ tác dụng lên vật làm vật chuyển động $3\,\text{m}$ theo đúng hướng của lực. Công của lực đó là:',
            options: [
              { key: 'A', text: '$600\,\text{J}$' },
              { key: 'B', text: '$200\,\text{J}$' },
              { key: 'C', text: '$66{,}7\,\text{J}$' },
              { key: 'D', text: '$1200\,\text{J}$' },
            ],
            answer: 'A',
            explanation: '$A = F \cdot s = 200 \cdot 3 = 600\,\text{J}$.',
            points: 0.5,
          },
          {
            id: 'ct-vatli-10-2026-s1-q12',
            number: 12,
            type: 'trac-nghiem',
            prompt:
              'Một bóng đèn điện có công suất $100\,\text{W}$ sáng liên tục trong $5$ giờ. Điện năng bóng đèn tiêu thụ là:',
            options: [
              { key: 'A', text: '$1\,800\,000\,\text{J}$' },
              { key: 'B', text: '$500\,\text{J}$' },
              { key: 'C', text: '$1800\,\text{J}$' },
              { key: 'D', text: '$180\,000\,\text{J}$' },
            ],
            answer: 'A',
            explanation: '$A = P \cdot t = 100 \cdot (5 \cdot 3600) = 1\,800\,000\,\text{J}$.',
            points: 0.5,
          },
        ],
      },
      {
        id: 'ct-vatli-10-2026-s2',
        title: 'PHẦN II. TỰ LUẬN',
        points: 4,
        questions: [
          {
            id: 'ct-vatli-10-2026-s2-q1',
            number: 1,
            type: 'tu-luan',
            prompt:
              'Một ô tô khởi hành từ trạng thái đứng yên trên đường thẳng với gia tốc không đổi $a = 2\,\text{m/s}^2$. a) Tính vận tốc của ô tô sau $10\,\text{s}$. b) Tính quãng đường ô tô đi được trong $10\,\text{s}$ đầu. c) Tính quãng đường ô tô đi được trong $5\,\text{s}$ đầu.',
            answer: 'a) $v = 20\,\text{m/s}$; b) $s_{10} = 100\,\text{m}$; c) $s_{5} = 25\,\text{m}$.',
            solution: [
              'Áp dụng công thức vận tốc: $v = v_0 + at = 0 + 2 \cdot 10 = 20\,\text{m/s}$.',
              'Quãng đường trong $10\,\text{s}$ đầu: $s = v_0t + \dfrac{1}{2}at^2 = 0 + \dfrac{1}{2} \cdot 2 \cdot 10^2 = 100\,\text{m}$.',
              'Quãng đường trong $5\,\text{s}$ đầu: $s = \dfrac{1}{2} \cdot 2 \cdot 5^2 = 25\,\text{m}$.',
              'Kiểm tra lại: $s_{10} = 4 \cdot s_5$, đúng vì $s \propto t^2$.',
            ],
            explanation:
              'Các công thức của chuyển động thẳng biến đổi đều tính từ trạng thái ban đầu, với $v_0 = 0$ ở đây.',
            points: 2,
          },
          {
            id: 'ct-vatli-10-2026-s2-q2',
            number: 2,
            type: 'tu-luan',
            prompt:
              'Một vật có khối lượng $m = 5\,\text{kg}$ nằm trên mặt phẳng ngang, có hệ số ma sát $\mu = 0{,}2$. Người ta kéo vật bằng lực ngang $F = 20\,\text{N}$ (lấy $g = 10\,\text{m/s}^2$). a) Tính lực ma sát. b) Tính gia tốc của vật. c) Sau $5\,\text{s}$ vật có vận tốc và quãng đường bao nhiêu?',
            answer: 'a) $f = 10\,\text{N}$; b) $a = 2\,\text{m/s}^2$; c) $v = 10\,\text{m/s}$ và $s = 25\,\text{m}$.',
            solution: [
              'Lực ma sát: $f = \mu N = \mu mg = 0{,}2 \cdot 5 \cdot 10 = 10\,\text{N}$.',
              'Lực tổng hợp theo phương ngang: $F_{t} = F - f = 20 - 10 = 10\,\text{N}$.',
              'Gia tốc: $a = \dfrac{F_{t}}{m} = \dfrac{10}{5} = 2\,\text{m/s}^2$.',
              'Sau $5\,\text{s}$: $v = at = 2 \cdot 5 = 10\,\text{m/s}$ và $s = \dfrac{1}{2}at^2 = \dfrac{1}{2} \cdot 2 \cdot 25 = 25\,\text{m}$.',
            ],
            explanation:
              'Khi vật chuyển động trên mặt phẳng ngang, phải xét cả lực ma sát khi tính lực tổng hợp theo phương ngang.',
            points: 2,
          },
        ],
      },
    ],
  },  {
    id: 'ct-hoahoc-8-2026',
    title: 'Đề thi môn Hoá học lớp 8 học kỳ II năm học 2025 - 2026',
    subject: 'Hoá học',
    grade: 'Lớp 8',
    school: 'Trường THCS Trần Đăng Ninh',
    year: '2025 – 2026',
    term: 'Học kỳ II',
    durationMinutes: 45,
    interactive: true,
    author: 'Lê Thị Hồng Nhung',
    createdAt: '2026-08-11T09:05:00.000Z',
    views: 1480,
    likes: 176,
    shared: true,
    sections: [
      {
        id: 'ct-hoahoc-8-2026-s1',
        title: 'PHẦN I. TRẮC NGHIỆM',
        points: 6,
        questions: [
          {
            id: 'ct-hoahoc-8-2026-s1-q1',
            number: 1,
            type: 'trac-nghiem',
            prompt: 'Công thức hoá học của nước là:',
            options: [
              { key: 'A', text: '$\mathrm{H_2O}$' },
              { key: 'B', text: '$\mathrm{H_2O_2}$' },
              { key: 'C', text: '$\mathrm{HO}$' },
              { key: 'D', text: '$\mathrm{H_2SO_4}$' },
            ],
            answer: 'A',
            explanation:
              'Một phân tử nước gồm hai nguyên tử hiđro và một nguyên tử oxi nên công thức là $\mathrm{H_2O}$.',
            points: 0.5,
          },
          {
            id: 'ct-hoahoc-8-2026-s1-q2',
            number: 2,
            type: 'trac-nghiem',
            prompt:
              'Một nguyên tử có $8$ proton trong hạt nhân và $8$ electron ở vỏ electron. Nguyên tố hoá học tương ứng là:',
            options: [
              { key: 'A', text: 'Oxi' },
              { key: 'B', text: 'Cacbon' },
              { key: 'C', text: 'Nito' },
              { key: 'D', text: 'Lưu huỳnh' },
            ],
            answer: 'A',
            explanation:
              'Số proton trong hạt nhân bằng $8$ nên nguyên tố có số hiệu nguyên tử $Z = 8$ là oxi.',
            points: 0.5,
          },
          {
            id: 'ct-hoahoc-8-2026-s1-q3',
            number: 3,
            type: 'trac-nghiem',
            prompt:
              'Nguyên tử có $11$ proton và $12$ neutron có số hiệu nguyên tử và số khối lần lượt là:',
            options: [
              { key: 'A', text: '$11$ và $12$' },
              { key: 'B', text: '$12$ và $11$' },
              { key: 'C', text: '$23$ và $12$' },
              { key: 'D', text: '$11$ và $23$' },
            ],
            answer: 'D',
            explanation:
              'Số hiệu nguyên tử bằng số proton là $11$, số khối là tổng số proton và neutron: $11 + 12 = 23$.',
            points: 0.5,
          },
          {
            id: 'ct-hoahoc-8-2026-s1-q4',
            number: 4,
            type: 'trac-nghiem',
            prompt: 'Kí hiệu hoá học đúng của nguyên tố sắt là:',
            options: [
              { key: 'A', text: '$\mathrm{Fe}$' },
              { key: 'B', text: '$\mathrm{F}$' },
              { key: 'C', text: '$\mathrm{FE}$' },
              { key: 'D', text: '$\mathrm{Fr}$' },
            ],
            answer: 'A',
            explanation:
              'Kí hiệu hoá học viết bằng chữ in hoa, chữ cái đầu viết lớn, chữ sau viết thường: sắt là $\mathrm{Fe}$.',
            points: 0.5,
          },
          {
            id: 'ct-hoahoc-8-2026-s1-q5',
            number: 5,
            type: 'trac-nghiem',
            prompt: 'Số mol chất có trong $8{,}8\,\text{g}$ khí $\mathrm{CO_2}$ là:',
            options: [
              { key: 'A', text: '$0{,}2\,\text{mol}$' },
              { key: 'B', text: '$0{,}1\,\text{mol}$' },
              { key: 'C', text: '$2\,\text{mol}$' },
              { key: 'D', text: '$4\,\text{mol}$' },
            ],
            answer: 'A',
            explanation:
              '$M(\mathrm{CO_2}) = 12 + 2 \cdot 16 = 44\,\text{g/mol}$, suy ra $n = \dfrac{8{,}8}{44} = 0{,}2\,\text{mol}$.',
            points: 0.5,
          },
          {
            id: 'ct-hoahoc-8-2026-s1-q6',
            number: 6,
            type: 'trac-nghiem',
            prompt: 'Số mol nguyên tử hiđro có trong $1\,\text{mol}$ nước là:',
            options: [
              { key: 'A', text: '$1\,\text{mol}$' },
              { key: 'B', text: '$2\,\text{mol}$' },
              { key: 'C', text: '$3\,\text{mol}$' },
              { key: 'D', text: '$0{,}5\,\text{mol}$' },
            ],
            answer: 'B',
            explanation:
              'Mỗi phân tử nước có hai nguyên tử hiđro, nên $1\,\text{mol}$ nước chứa $2\,\text{mol}$ nguyên tử hiđro.',
            points: 0.5,
          },
          {
            id: 'ct-hoahoc-8-2026-s1-q7',
            number: 7,
            type: 'trac-nghiem',
            prompt: 'Thể tích của $0{,}5\,\text{mol}$ khí oxi ở điều kiện chuẩn là:',
            options: [
              { key: 'A', text: '$11{,}2\,\text{l}$' },
              { key: 'B', text: '$1{,}12\,\text{l}$' },
              { key: 'C', text: '$22{,}4\,\text{l}$' },
              { key: 'D', text: '$44{,}8\,\text{l}$' },
            ],
            answer: 'A',
            explanation:
              'Ở điều kiện chuẩn $V_m = 22{,}4\,\text{l/mol}$, suy ra $V = 0{,}5 \cdot 22{,}4 = 11{,}2\,\text{l}$.',
            points: 0.5,
          },
          {
            id: 'ct-hoahoc-8-2026-s1-q8',
            number: 8,
            type: 'trac-nghiem',
            prompt: 'Số Avogadro có giá trị xấp xỉ:',
            options: [
              { key: 'A', text: '$6{,}02 \cdot 10^{23}$' },
              { key: 'B', text: '$3{,}01 \cdot 10^{23}$' },
              { key: 'C', text: '$6{,}02 \cdot 10^{-23}$' },
              { key: 'D', text: '$1{,}204 \cdot 10^{24}$' },
            ],
            answer: 'A',
            explanation:
              'Hằng số Avogadro là số hạt có trong $1\,\text{mol}$, xấp xỉ $6{,}02 \cdot 10^{23}$ hạt.',
            points: 0.5,
          },
          {
            id: 'ct-hoahoc-8-2026-s1-q9',
            number: 9,
            type: 'trac-nghiem',
            prompt: 'Cân bằng hoá học sau phản ứng là:',
            options: [
              { key: 'A', text: 'Số phân tử các chất phản ứng và sản phẩm không đổi' },
              { key: 'B', text: 'Phản ứng dừng lại hoàn toàn' },
              { key: 'C', text: 'Phản ứng hoàn toàn theo một chiều' },
              { key: 'D', text: 'Nhiệt độ phòng không thay đổi' },
            ],
            answer: 'A',
            explanation:
              'Ở trạng thái cân bằng hoá học, tốc độ phản ứng thuận bằng tốc độ phản ứng nghịch nên số phân tử của các chất không đổi.',
            points: 0.5,
          },
          {
            id: 'ct-hoahoc-8-2026-s1-q10',
            number: 10,
            type: 'trac-nghiem',
            prompt: 'Hiện tượng nào sau đây là hiện tượng hoá học?',
            options: [
              { key: 'A', text: 'Củ tỏi bị cháy đen khi nướng' },
              { key: 'B', text: 'Nước đóng đông thành băng' },
              { key: 'C', text: 'Dây thép bị uốn cong' },
              { key: 'D', text: 'Cát khô cát thành cát ướt' },
            ],
            answer: 'A',
            explanation:
              'Củ tỏi cháy đen tạo ra chất mới nên là hiện tượng hoá học; các hiện tượng còn lại đều là hiện tượng vật lý.',
            points: 0.5,
          },
          {
            id: 'ct-hoahoc-8-2026-s1-q11',
            number: 11,
            type: 'trac-nghiem',
            prompt: 'Trong phản ứng hoá học, điều được bảo toàn là:',
            options: [
              { key: 'A', text: 'Số nguyên tử của mỗi nguyên tố' },
              { key: 'B', text: 'Số loại nguyên tố có mặt' },
              { key: 'C', text: 'Thể tích của hỗn hợp khí' },
              { key: 'D', text: 'Trạng thái của các chất' },
            ],
            answer: 'A',
            explanation:
              'Trong phản ứng hoá học chỉ có sự sắp xếp lại các nguyên tử, số nguyên tử của mỗi nguyên tố được giữ nguyên.',
            points: 0.5,
          },
          {
            id: 'ct-hoahoc-8-2026-s1-q12',
            number: 12,
            type: 'trac-nghiem',
            prompt:
              'Nhiệt lượng riêng của nước là $4200\,\text{J/(kg}\cdot{}^\circ\text{C)}$. Ý nghĩa của câu này là:',
            options: [
              { key: 'A', text: 'Nóng $1\,\text{kg}$ nước lên $1^\circ\text{C}$ cần $4200\,\text{J}$' },
              { key: 'B', text: 'Nóng $1\,\text{kg}$ nước lên $10^\circ\text{C}$ cần $4200\,\text{J}$' },
              { key: 'C', text: 'Nóng $4200\,\text{kg}$ nước lên $1^\circ\text{C}$ cần $1\,\text{J}$' },
              { key: 'D', text: 'Làm $1\,\text{kg}$ nước đông đá cần $4200\,\text{J}$' },
            ],
            answer: 'A',
            explanation:
              'Nhiệt lượng riêng là nhiệt lượng cần cung cấp để nóng $1\,\text{kg}$ chất lên $1^\circ\text{C}$.',
            points: 0.5,
          },
        ],
      },
      {
        id: 'ct-hoahoc-8-2026-s2',
        title: 'PHẦN II. TỰ LUẬN',
        points: 4,
        questions: [
          {
            id: 'ct-hoahoc-8-2026-s2-q1',
            number: 1,
            type: 'tu-luan',
            prompt:
              'Cân bằng phương trình hoá học sau: $2\mathrm{H_2} + \mathrm{O_2} \rightarrow 2\mathrm{H_2O}$. a) Cho biết số phân tử của mỗi chất trong phương trình. b) Tính số mol nguyên tử oxi có trong $2\,\text{mol}$ nước. c) Tính khối lượng hiđro cần dùng để tạo ra $18\,\text{g}$ nước.',
            answer:
              'a) $2$ phân tử $\mathrm{H_2}$, $1$ phân tử $\mathrm{O_2}$, $2$ phân tử $\mathrm{H_2O}$; b) $2\,\text{mol}$ nguyên tử oxi; c) $2\,\text{g}$ hiđro.',
            solution: [
              'Đọc hệ số các chất trong phương trình cân bằng để xác định số phân tử tương ứng trong từng phân tử hợp chất.',
              'Trong $1\,\text{mol}$ nước có $1\,\text{mol}$ nguyên tử oxi, nên $2\,\text{mol}$ nước chứa $2\,\text{mol}$ nguyên tử oxi.',
              'Khối lượng $18\,\text{g}$ nước tương ứng $1\,\text{mol}$ nước; theo tỉ lệ $2\,\text{mol}\,\mathrm{H_2} \rightarrow 2\,\text{mol}\,\mathrm{H_2O}$ cần dùng $1\,\text{mol}$ hiđro.',
              '$m(\mathrm{H_2}) = n \cdot M = 1 \cdot 2 = 2\,\text{g}$.',
            ],
            explanation:
              'Cần chú ý đọc kỹ đề bài: $1\,\text{mol}$ nước chứa $1\,\text{mol}$ nguyên tử oxi, nên $2\,\text{mol}$ nước chứa $2\,\text{mol}$ nguyên tử oxi.',
            points: 2,
          },
          {
            id: 'ct-hoahoc-8-2026-s2-q2',
            number: 2,
            type: 'tu-luan',
            prompt:
              'Cần cung cấp bao nhiêu nhiệt lượng để nóng $200\,\text{g}$ nước từ $20^\circ\text{C}$ lên $60^\circ\text{C}$? Biết nhiệt lượng riêng của nước là $c = 4200\,\text{J/(kg}\cdot{}^\circ\text{C)}$.',
            answer: 'Nhiệt lượng cần cung cấp là $Q = 33600\,\text{J}$.',
            solution: [
              'Đổi khối lượng: $m = 200\,\text{g} = 0{,}2\,\text{kg}$.',
              'Nhiệt độ tăng: $\Delta t = 60^\circ\text{C} - 20^\circ\text{C} = 40^\circ\text{C}$.',
              'Nhiệt lượng: $Q = mc\Delta t = 0{,}2 \cdot 4200 \cdot 40 = 33600\,\text{J}$.',
            ],
            explanation:
              'Công thức tính nhiệt lượng $Q = mc\Delta t$ phải dùng đơn vị SI: khối lượng tính bằng kg, nhiệt lượng riêng tính bằng $\text{J/(kg}\cdot{}^\circ\text{C)}$.',
            points: 2,
          },
        ],
      },
    ],
  },  {
    id: 'ct-nguvan-9-2026',
    title: 'Đề thi môn Ngữ văn lớp 9 học kỳ II năm học 2025 - 2026',
    subject: 'Ngữ văn',
    grade: 'Lớp 9',
    school: 'Trường THCS Nguyễn Trai',
    year: '2025 – 2026',
    term: 'Học kỳ II',
    durationMinutes: 45,
    interactive: true,
    author: 'Ngô Thị Bích Ngọc',
    createdAt: '2026-07-29T03:25:00.000Z',
    views: 1260,
    likes: 143,
    shared: true,
    sections: [
      {
        id: 'ct-nguvan-9-2026-s1',
        title: 'PHẦN I. CÂU HỎI TỰ LUẬN',
        points: 7.5,
        questions: [
          {
            id: 'ct-nguvan-9-2026-s1-q1',
            number: 1,
            type: 'tu-luan',
            prompt:
              'Đọc văn bản sau:\n\nVăn bản:\n\n"Buổi sớm, sương còn giăng trên lá ngô đồng. Tôi đi trên con đường làng, một tay cầm giỏ sách, một tay nắm lá thư gửi về cho mẹ. Trong lá thư, tôi kể rằng lần này đi học xa, nhà còn vắng, mẹ đừng lo. Nhưng viết đến dòng cuối, tôi lại bật cười, bởi câu đầu tiên tôi viết lại là: "Mẹ ơi, con nhớ nhà quá".\n\nGió thổi nghiêng mái lá, tiếng gà gai kêu đâu đó gần bếp mẹ. Tôi bỏ thư vào hòm thư và bước đi, nhưng trong lòng vẫn nghe văng vẳng tiếng bước chân nhỏ của em gái chạy ra cổng đón mẹ về."\n\nCâu 1. Sự xuất hiện của hình ảnh lá thư giữa hai đoạn văn có ý nghĩa gì đối với việc thể hiện tâm tư nhân vật? Câu 2. Vì sao nhân vật viết "Đừng lo" rồi lại viết lại thành "Con nhớ nhà quá"? Câu 3. Câu văn "Gió thổi nghiêng mái lá, tiếng gà gai kêu đâu đó gần bếp mẹ" đã đạt hiệu quả nghệ thuật gì?',
            answer:
              'Câu 1. Lá thư là vật trung gian để nhân vật bộc lộ tâm tư: đi viết thư cho người nhà ở lại nhưng tâm trí vẫn hướng về nhà. Câu 2. Vì thư gửi đi, nên nhân vật cố trấn an mẹ, giấu giếm nỗi nhớ nhà; nhưng không kìm được tình cảm thật, nên viết lại. Câu 3. Câu văn gợi không khí gia đình ấm áp, bằng giọng văn trong trẻo, bằng chi tiết gần gũi (mái lá, tiếng gà gai) để gợi không gian đồng quê và tình thương gia đình.',
            solution: [
              'Câu 1. Xác định vị trí hai lần xuất hiện của lá thư (nhân vật cầm lá thư ở đầu văn bản và bỏ thư vào hòm thư ở cuối) và chỉ ra chức năng: chiếc lá thư "chứa" nỗi lòng thật của nhân vật.',
              'Câu 2. Phân tích mối đối lập giữa lời an ủi bên ngoài và sự thật bên trong: "Đừng lo" là lời dối dịu dàng có chủ đích, "Con nhớ nhà quá" là sự bộc lộ không kiềm chế.',
              'Câu 3. Nêu các phép nghệ thuật: nhân hóa gió thổi, lựa chọn chi tiết gần gũi của không gian nông thôn, âm thanh tiếng gà gai, kết hợp cảm xúc của người kể với cảm xúc của thiên nhiên.',
              'Tổng hợp: cả ba câu hỏi đều hướng đến việc làm rõ chủ đề "nhớ nhà" và cách thể hiện tâm tư của nhân vật cô đơn.',
            ],
            explanation:
              'Câu hỏi đọc hiểu đòi hỏi người học nắm bắt chi tiết nghệ thuật và mối quan hệ giữa chi tiết với chủ đề, chứ không chỉ kể lại nội dung.',
            points: 2,
          },
          {
            id: 'ct-nguvan-9-2026-s1-q2',
            number: 2,
            type: 'tu-luan',
            prompt:
              'Câu 1. Trong văn bản trên, cảnh sương giăng trên lá ngô đồng và gió thổi nghiêng mái lá được lặp lại ở đầu và cuối văn bản. Việc lặp lại đó có tác dụng gì? Câu 2. Nếu thay câu "Gió thổi nghiêng mái lá, tiếng gà gai kêu đâu đó gần bếp mẹ" bằng câu "Gió thổi và lá đổi màu" thì hiệu quả nghệ thuật sẽ thay đổi như thế nào?',
            answer:
              'Câu 1. Việc lặp lại tạo nên sự đối xứng, gợi hình dung cảnh vật chuyển mình trong buổi sớm và khép lại văn bản bằng hình ảnh mở đầu, tạo cảm giác tròn trải, giàu sức gợi. Câu 2. Câu gốc lấy âm thanh (tiếng gà gai) và chi tiết gần gũi (bếp mẹ) để gợi cảm xúc thân thương, gắn cảnh vật với không gian gia đình; câu thay thế chỉ nêu hiện tượng, mất đi sức gợi cảm xúc và thành một câu văn báo hiện, trí tưởng tượng bị hạn chế.',
            solution: [
              'Câu 1. Chỉ ra hai vị trí lặp lại và tính chất "bao trùn" của cấu trúc đầu - cuối: mở ra không gian đồng quê, đóng lại bằng âm thanh quen thuộc của khu vườn nhà.',
              'Câu 2. Phân tích từng thành phần của câu gốc: động từ "thổi nghiêng" (gợi chuyển động), chi tiết "tiếng gà gai kêu" (âm thanh), cụm "gần bếp mẹ" (gắn không gian với gia đình).',
              'So sánh với câu thay thế: không có âm thanh, không có chi tiết gia đình, chỉ còn một hiện tượng thiên nhiên chung chung.',
              'Kết luận về mức độ hiệu quả nghệ thuật và tính cách điệu của ngôn ngữ văn bản.',
            ],
            explanation:
              'Câu hỏi so sánh - thay thế giúp người học thấy rõ vai trò của chi tiết nghệ thuật và cách tích lũy cảm xúc trong văn bản.',
            points: 2,
          },
          {
            id: 'ct-nguvan-9-2026-s1-q3',
            number: 3,
            type: 'tu-luan',
            prompt:
              'Câu 1. Vì sao nhân vật kể chuyện "tôi" mà vẫn dùng đại từ "mẹ" để gọi? Việc xưng hô này gợi lên điều gì? Câu 2. Câu "Tôi bỏ thư vào hòm thư và bước đi, nhưng trong lòng vẫn nghe văng vẳng tiếng bước chân nhỏ của em gái chạy ra cổng đón mẹ về" thể hiện điều gì?',
            answer:
              'Câu 1. Nhân vật kể chuyện ở ngôi thứ nhất nhưng lại xưng "tôi" với người nghe, còn "mẹ" và "em gái" được gọi bằng danh xưng thân mật, cho thấy đây là ký ức trải qua trong gia đình, nơi tình thương là tự nhiên, gần gũi. Câu 2. Câu văn cho thấy nhân vật đã bước đi thật, nhưng nỗi nhớ vẫn bám theo; hình ảnh "văng vẳng" tiếng bước chân em gái là hình ảnh hoài niệm, cho thấy em gái và mẹ vẫn luôn ở lại trong tâm trí nhân vật.',
            solution: [
              'Câu 1. Xác định hệ thống xưng hô: "tôi" (người kể), "mẹ", "em gái" (người được nhắc đến). Phân tích tính thân mật của danh xưng "mẹ" và "em gái".',
              'Câu 1. Liên hệ với tâm trạng cô đơn khi xa nhà: cách gọi thân mật chính là cách nhân vật bám víu vào ký ức, đồng thời cho thấy ký ức đó có sức sống.',
              'Câu 2. Phân tích cấu trúc câu: mệnh đề "nhưng" đảo chiều, tạo tương phản giữa hành động bên ngoài và trạng thái bên trong.',
              'Câu 2. Giải thích hình ảnh "văng vẳng" như âm thanh của ký ức, cho thấy nỗi nhớ không thể cất lời được.',
            ],
            explanation:
              'Câu hỏi về điện từ, xưng hô và tương phản trong câu tưởng chừng đơn giản nhưng là phần cơ bản của kĩ năng phân tích ngôn ngữ văn.',
            points: 2,
          },
          {
            id: 'ct-nguvan-9-2026-s1-q4',
            number: 4,
            type: 'tu-luan',
            prompt:
              'Câu 1. Trong văn bản trên, từ "mẹ" và từ "nhà" được lặp đi lặp lại nhiều lần. Đó là biện pháp ngữ pháp nào? Câu 2. Sự lặp lại đó góp phần như thế nào để khắc sâu nỗi nhớ nhà của nhân vật?',
            answer:
              'Câu 1. Đó là biện pháp điệp từ: từ "mẹ" được lặp lên đến năm lần, từ "nhà" được lặp lên hai lần. Câu 2. Sự lặp lại giúp cho hai từ này trở thành mạch sống của văn bản: từ "mẹ" gắn với giọng gọi thương yêu, lần đầu là "gửi về cho mẹ", rồi "mẹ đừng lo" trong lời dối dịu dàng, rồi "Mẹ ơi, con nhớ nhà quá" là lời thật lòng; từ "nhà" đi từ nỗi trống "nhà còn vắng" đến mong muốn "con nhớ nhà quá", rồi hiện ra trong hình ảnh "bếp mẹ", "cổng đón mẹ về". Nhờ điệp từ, nỗi nhớ nhà được gọi tên nhiều lần và trở thành nội tâm xuyên suốt tác phẩm.',
            solution: [
              'Câu 1. Nhận dạng hiện tượng: các từ "mẹ" (5 lần) và "nhà" (2 lần) được lặp lại ở những vị trí khác nhau trong văn bản, đó là biện pháp điệp từ.',
              'Câu 2. Xác định nghĩa của từng lần lặp: "gửi về cho mẹ", "mẹ đừng lo", "Mẹ ơi, con nhớ nhà quá", "gần bếp mẹ", "đón mẹ về" - mỗi lần lặp gắn với một tình huống và một cảm xúc khác nhau.',
              'Câu 2. Chỉ ra tác dụng: điệp từ tạo sự nhấn nháy, khiến từ "mẹ" và "nhà" trở thành mạch sống xuyên suốt, gợi nỗi nhớ gia đình ở mọi thời điểm.',
              'Câu 2. Kết luận: điệp từ làm chủ đề "nhớ nhà" trở nên sâu sắc và dễ nhớ.',
            ],
            explanation:
              'Đây là câu hỏi về ngôn ngữ học, đòi hỏi người học nhận dạng được biện pháp điệp từ và lập luận về tác dụng của nó với chủ đề tác phẩm.',
            points: 1.5,
          },
        ],
      },
      {
        id: 'ct-nguvan-9-2026-s2',
        title: 'PHẦN II. CÂU HỎI MỞ RỘNG',
        points: 2.5,
        questions: [
          {
            id: 'ct-nguvan-9-2026-s2-q1',
            number: 1,
            type: 'tu-luan',
            prompt:
              'Câu 1. Nêu chủ đề và nội dung chính của văn bản trên. Câu 2. Hãy viết một đoạn văn khoảng 8 - 10 câu nối tiếp nội dung sau: "Tiếng gà gai kêu đâu đó gần bếp mẹ." (Viết theo văn bản đã học, không nhất thiết phải viết văn bản mới).',
            answer:
              'Câu 1. Chủ đề: Nỗi nhớ nhà và tình thương gia đình. Nội dung chính: Văn bản kể về lá thư của một người con xa nhà, trong đó nhân vật vừa cố giấu nỗi nhớ trong lời thư gửi mẹ, vừa không kìm được mà bộc lộ thật lòng. Câu 2. Đoạn văn cần triển khai cảm xúc nhớ nhà, giữ giọng văn nhẹ nhàng, trong trẻo như văn bản gốc.',
            solution: [
              'Câu 1. Tìm câu từ khái quát nội dung (nhớ nhà, thư gửi mẹ) để nêu chủ đề.',
              'Câu 1. Tóm lược diễn biến: lá thư trong tay, viết lời an ủi, viết lại lời thật, bỏ thư vào hòm và bước đi nhưng vẫn mang theo nỗi nhớ.',
              'Câu 2. Xác định yêu cầu: đoạn văn phải nối tiếp, cùng giọng điệu, có chi tiết cụ thể, không tóm tắt hay liệt kê.',
              'Câu 2. Gợi ý triển khai: hình ảnh bếp mẹ, mùi khói bếp, con đường làng, tiếng chân nhỏ của em gái, lá thư trong hòm thư.',
              'Câu 2. Sau khi viết cần đếm số câu và rà soát lại tính liên hệ với câu trước.',
            ],
            explanation:
              'Phần mở rộng kiểm tra năng lực viết: người học phải nắm được chủ đề, nội dung cốt lõi và cách triển khai câu văn theo hướng có sẵn.',
            points: 1.5,
          },
          {
            id: 'ct-nguvan-9-2026-s2-q2',
            number: 2,
            type: 'tu-luan',
            prompt:
              'Câu 1. Vì sao nói văn bản trên là "văn bản tự sự" chứ không phải "văn bản tả cảnh"? Câu 2. Nếu viết theo kiểu tả cảnh, nội dung văn bản sẽ thay đổi như thế nào?',
            answer:
              'Câu 1. Văn bản tự sự truyền tải bằng cách kể lại những gì "tôi" chứng kiến, trong đó có thời gian diễn ra (buổi sớm), không gian (con đường làng, hòm thư) và trạng thái nội tâm của nhân vật. Câu 2. Nếu viết theo kiểu tả cảnh, trọng tâm sẽ dồn vào hình ảnh, màu sắc, ánh sáng của buổi sớm và mất đi phần tâm sự sâu sắc của nhân vật, cũng như mất đi chất cảm xúc trực tiếp do người kể bày tỏ.',
            solution: [
              'Câu 1. Nhắc lại tiêu chí phân biệt hai thể loại: tự sự có người kể và nhân vật "tôi", tả cảnh tập trung vào bức tranh thiên nhiên, không gắn với một nhân vật cụ thể.',
              'Câu 1. Dẫn chứng: "Tôi đi trên con đường làng", "Tôi bỏ thư vào hòm thư" - hành động của nhân vật, tương phản với tả cảnh vốn không có nhân vật nêu tên hay xưng "tôi".',
              'Câu 2. Phân tích hậu quả: mất đi lớp nội tâm, tả cảnh chỉ giữ lại vẻ ngoài của không gian.',
              'Câu 2. Nêu nhận xét: văn bản gốc kết hợp tả cảnh với tự sự nên vừa có không gian vừa có tâm hồn, đó là điểm hay của tác phẩm.',
            ],
            explanation:
              'Câu hỏi về thể loại đòi hỏi người học hiểu bản chất khác nhau giữa tự sự và tả cảnh, từ đó thấy được giá trị của việc lồng ghép hai thể loại.',
            points: 1,
          },
        ],
      },
    ],
  },  {
    id: 'ct-tienganh-8-2026',
    title: 'Đề thi môn Tiếng Anh lớp 8 học kỳ II năm học 2025 - 2026',
    subject: 'Tiếng Anh',
    grade: 'Lớp 8',
    school: 'Trường THCS Phan Đình Phùng',
    year: '2025 – 2026',
    term: 'Học kỳ II',
    durationMinutes: 45,
    interactive: true,
    author: 'Nguyễn Thị Mai Chi',
    createdAt: '2026-07-14T08:50:00.000Z',
    views: 980,
    likes: 118,
    shared: true,
    sections: [
      {
        id: 'ct-tienganh-8-2026-s1',
        title: 'PHẦN I. TRẮC NGHIỆM',
        points: 8,
        questions: [
          {
            id: 'ct-tienganh-8-2026-s1-q1',
            number: 1,
            type: 'trac-nghiem',
            prompt: 'Choose the word whose underlined part is pronounced differently from the others:',
            options: [
              { key: 'A', text: 'c<u>a</u>ke' },
              { key: 'B', text: 'n<u>a</u>me' },
              { key: 'C', text: 'c<u>a</u>t' },
              { key: 'D', text: 'f<u>a</u>ce' },
            ],
            answer: 'C',
            explanation:
              'In "cat" the letter a is pronounced /æ/, whereas in "cake", "name" and "face" it is pronounced /eɪ/ as part of the vowel combination "a...e".',
            points: 0.5,
          },
          {
            id: 'ct-tienganh-8-2026-s1-q2',
            number: 2,
            type: 'trac-nghiem',
            prompt: 'Choose the word whose underlined part is pronounced differently from the others:',
            options: [
              { key: 'A', text: 'b<u>o</u>ok' },
              { key: 'B', text: 'c<u>o</u>ok' },
              { key: 'C', text: 'l<u>o</u>ok' },
              { key: 'D', text: 's<u>o</u>up' },
            ],
            answer: 'D',
            explanation:
              'In "soup" the letter o is pronounced /uː/, while in "book", "cook" and "look" it is pronounced /ʊ/.',
            points: 0.5,
          },
          {
            id: 'ct-tienganh-8-2026-s1-q3',
            number: 3,
            type: 'trac-nghiem',
            prompt: 'My sister usually ______ her room before going to school.',
            options: [
              { key: 'A', text: 'cleans' },
              { key: 'B', text: 'clean' },
              { key: 'C', text: 'cleaning' },
              { key: 'D', text: 'is cleaning' },
            ],
            answer: 'A',
            explanation:
              '"Usually" is an adverb of frequency used with the simple present tense, and with "my sister" the verb takes the -s form.',
            points: 0.5,
          },
          {
            id: 'ct-tienganh-8-2026-s1-q4',
            number: 4,
            type: 'trac-nghiem',
            prompt: 'We ______ to Da Nang last summer.',
            options: [
              { key: 'A', text: 'go' },
              { key: 'B', text: 'went' },
              { key: 'C', text: 'have gone' },
              { key: 'D', text: 'are going' },
            ],
            answer: 'B',
            explanation:
              '"Last summer" is a finished time in the past, so the simple past tense "went" is used.',
            points: 0.5,
          },
          {
            id: 'ct-tienganh-8-2026-s1-q5',
            number: 5,
            type: 'trac-nghiem',
            prompt: 'There ______ some milk and two eggs in the fridge.',
            options: [
              { key: 'A', text: 'is' },
              { key: 'B', text: 'are' },
              { key: 'C', text: 'have' },
              { key: 'D', text: 'has' },
            ],
            answer: 'A',
            explanation:
              '"Milk" is an uncountable noun and is treated as singular, so the verb is "is".',
            points: 0.5,
          },
          {
            id: 'ct-tienganh-8-2026-s1-q6',
            number: 6,
            type: 'trac-nghiem',
            prompt: 'She ______ her homework when I came into her room.',
            options: [
              { key: 'A', text: 'does' },
              { key: 'B', text: 'did' },
              { key: 'C', text: 'was doing' },
              { key: 'D', text: 'has done' },
            ],
            answer: 'C',
            explanation:
              'The past continuous tense shows an action in progress at a moment in the past, so "was doing" is correct.',
            points: 0.5,
          },
          {
            id: 'ct-tienganh-8-2026-s1-q7',
            number: 7,
            type: 'trac-nghiem',
            prompt: 'I am looking forward to ______ you again.',
            options: [
              { key: 'A', text: 'meet' },
              { key: 'B', text: 'meeting' },
              { key: 'C', text: 'met' },
              { key: 'D', text: 'be met' },
            ],
            answer: 'B',
            explanation:
              'The phrase "look forward to" is followed by a gerund, so we use "meeting".',
            points: 0.5,
          },
          {
            id: 'ct-tienganh-8-2026-s1-q8',
            number: 8,
            type: 'trac-nghiem',
            prompt: 'The blue bag is ______ than the red one.',
            options: [
              { key: 'A', text: 'cheap' },
              { key: 'B', text: 'cheaper' },
              { key: 'C', text: 'the cheapest' },
              { key: 'D', text: 'more cheap' },
            ],
            answer: 'B',
            explanation:
              'In a comparison with "than" we use the comparative form, and the correct comparative of "cheap" is "cheaper".',
            points: 0.5,
          },
          {
            id: 'ct-tienganh-8-2026-s1-q9',
            number: 9,
            type: 'trac-nghiem',
            prompt: 'You ______ wear a helmet when you ride a motorbike. It is very dangerous.',
            options: [
              { key: 'A', text: 'should' },
              { key: 'B', text: "shouldn't" },
              { key: 'C', text: "mustn't" },
              { key: 'D', text: "can't" },
            ],
            answer: 'B',
            explanation:
              '"Shouldn\'t" expresses advice against doing something that is dangerous.',
            points: 0.5,
          },
          {
            id: 'ct-tienganh-8-2026-s1-q10',
            number: 10,
            type: 'trac-nghiem',
            prompt: "Don't worry. I ______ you with your English lesson.",
            options: [
              { key: 'A', text: 'am helping' },
              { key: 'B', text: 'help' },
              { key: 'C', text: 'will help' },
              { key: 'D', text: 'helped' },
            ],
            answer: 'C',
            explanation:
              'The sentence offers help for the future, so the future tense "will help" is used.',
            points: 0.5,
          },
          {
            id: 'ct-tienganh-8-2026-s1-q11',
            number: 11,
            type: 'trac-nghiem',
            prompt: 'Nam is the kind of boy ______ never says no to his friends.',
            options: [
              { key: 'A', text: 'who' },
              { key: 'B', text: 'which' },
              { key: 'C', text: 'whom' },
              { key: 'D', text: 'whose' },
            ],
            answer: 'A',
            explanation:
              'Relative pronouns referring to a person are "who" or "whom"; here "who" is used as the subject of "says".',
            points: 0.5,
          },
          {
            id: 'ct-tienganh-8-2026-s1-q12',
            number: 12,
            type: 'trac-nghiem',
            prompt: 'She asked me ______ I could help her with her homework.',
            options: [
              { key: 'A', text: 'that' },
              { key: 'B', text: 'if' },
              { key: 'C', text: 'what' },
              { key: 'D', text: 'which' },
            ],
            answer: 'B',
            explanation:
              'The conjunction "if" is used to introduce an indirect question asking whether something is true.',
            points: 0.5,
          },
          {
            id: 'ct-tienganh-8-2026-s1-q13',
            number: 13,
            type: 'trac-nghiem',
            prompt: 'Choose the correct passive voice: People build many wooden houses in this village.',
            options: [
              { key: 'A', text: 'Many wooden houses are built in this village.' },
              { key: 'B', text: 'Many wooden houses were built in this village.' },
              { key: 'C', text: 'Many wooden houses have built in this village.' },
              { key: 'D', text: 'Many wooden houses are building in this village.' },
            ],
            answer: 'A',
            explanation:
              'The present simple passive is "am/is/are + past participle", so "are built" is correct.',
            points: 0.5,
          },
          {
            id: 'ct-tienganh-8-2026-s1-q14',
            number: 14,
            type: 'trac-nghiem',
            prompt: 'This is the village ______ my grandparents live.',
            options: [
              { key: 'A', text: 'where' },
              { key: 'B', text: 'which' },
              { key: 'C', text: 'what' },
              { key: 'D', text: 'when' },
            ],
            answer: 'A',
            explanation:
              'The relative adverb "where" is used for places, and it replaces the preposition "in".',
            points: 0.5,
          },
          {
            id: 'ct-tienganh-8-2026-s1-q15',
            number: 15,
            type: 'trac-nghiem',
            prompt: 'If it ______ tomorrow, we will cancel the picnic.',
            options: [
              { key: 'A', text: 'rains' },
              { key: 'B', text: 'will rain' },
              { key: 'C', text: 'rained' },
              { key: 'D', text: 'is raining' },
            ],
            answer: 'A',
            explanation:
              'In the first conditional, the if-clause uses the present simple and the main clause uses "will + verb".',
            points: 1,
          },
        ],
      },
      {
        id: 'ct-tienganh-8-2026-s2',
        title: 'PHẦN II. TỰ LUẬN',
        points: 2,
        questions: [
          {
            id: 'ct-tienganh-8-2026-s2-q1',
            number: 1,
            type: 'tu-luan',
            prompt:
              'Write a short paragraph (about 80 - 100 words) about the changes in your hometown over the last five years. You may use the following cues: more buildings, wider roads, new facilities, traffic, environment.',
            answer:
              'A suitable paragraph should use the past simple and the present perfect to describe changes, include at least three of the given cues and finish with a personal opinion about the future of the hometown.',
            solution: [
              'Plan the content: begin with the general change ("My hometown has changed a lot in the last five years"), then give three specific changes and close with a personal comment.',
              'Use the past simple for finished changes ("They built a new hospital", "They widened the old road") and the present perfect for the result ("My hometown has become much more modern").',
              'Include linking words such as "also", "nowadays", "because" and "however" to make the paragraph coherent.',
              'Check the number of words, the spelling and the punctuation of the final paragraph before handing in.',
            ],
            explanation:
              'Đề yêu cầu viết một đoạn văn ngắn về sự thay đổi của quê hương, người học cần sử dụng linh hoạt các thì đã học và bám sát các ý gợi ý đã cho.',
            points: 2,
          },
        ],
      },
    ],
  },  {
    id: 'ct-lichsu-8-2026',
    title: 'Đề thi môn Lịch sử lớp 8 học kỳ II năm học 2025 - 2026',
    subject: 'Lịch sử',
    grade: 'Lớp 8',
    school: 'Trường THCS Lê Lợi',
    year: '2025 – 2026',
    term: 'Học kỳ II',
    durationMinutes: 45,
    interactive: true,
    author: 'Vũ Đình Khoa',
    createdAt: '2026-06-30T04:00:00.000Z',
    views: 640,
    likes: 72,
    shared: true,
    sections: [
      {
        id: 'ct-lichsu-8-2026-s1',
        title: 'PHẦN I. CÂU HỎI TỰ LUẬN',
        points: 5,
        questions: [
          {
            id: 'ct-lichsu-8-2026-s1-q1',
            number: 1,
            type: 'tu-luan',
            prompt:
              'Trình bày quá trình hình thành và phát triển của Đảng Cộng sản Việt Nam từ năm 1930 đến năm 1975. Nêu rõ các mốc lịch sử tiêu biểu.',
            answer:
              'Quá trình hình thành và phát triển của Đảng gồm các mốc: ngày 3-2-1930 Hội nghị lập Đảng ở Hà Nội; 1935 ảnh chụp Nguyễn Ái Quốc với đại biểu các nước; 1936 Ban Chấp hành Trung ương lần thứ nhất, chính thức kết nạp Đảng và ra Chính cương lịch; 1940 Trung ương lần thứ nhất, đổi tên Đảng; 22-5-1941 Trung ương lần thứ VIII, ra Nghị quyết 12; 1945 thành lập Chính phủ; 1946 lập Đảng; 1950 Hội nghị lần thứ III BCH Trung ương, ban hành Chiến lược chính trị; 1975 đại diện Đảng thắng lợi trong cuộc chiến chống Mỹ cứu nước.',
            solution: [
              'Giai đoạn 1930 - 1939: ngày 3-2-1930 hội nghị lập Đảng ở Hà Nội đã đánh dấu sự ra đời của Đảng; 1935 ảnh chụp Nguyễn Ái Quốc ở London, tiếp 1936 hội nghị Trung ương lần thứ nhất xác lập Chính cương lịch.',
              'Giai đoạn 1939 - 1945: 1940 Trung ương lần thứ nhất đổi tên Đảng, tổ chức lại; 22-5-1941 Trung ương lần thứ VIII ra Nghị quyết 12 về nhiệm vụ, đối tượng, phương hướng; 1945 Chính phủ lập để cầm quyền lập nước.',
              'Giai đoạn 1946 - 1975: tháng 12-1946 Hội nghị lập Đảng ban hành Điều lệ; tháng 2-1950 Hội nghị Trung ương lần thứ III xác định phương hướng chính trị; ngày 30-4-1975 Đảng lãnh đạo nhân dân giành độc lập.',
              'Khẳng định: Đảng Cộng sản Việt Nam ra đời trong hoàn cảnh đặc biệt, do yêu cầu cứu nước và là sự kết tinh của đấu tranh cách mạng trong nước và quốc tế.',
            ],
            explanation:
              'Câu hỏi yêu cầu nắm chắc các mốc lịch sử với ngày, tháng, năm cụ thể và hiểu được mối liên hệ giữa các giai đoạn hình thành và phát triển của Đảng.',
            points: 2,
          },
          {
            id: 'ct-lichsu-8-2026-s1-q2',
            number: 2,
            type: 'tu-luan',
            prompt:
              'Nêu ý nghĩa thắng lợi của Chiến dịch Điện Biên Phủ năm 1954 đối với cuộc chiến đấu ở Việt Nam và ở các nước khác.',
            answer:
              'Ý nghĩa đối với cuộc chiến đấu ở Việt Nam: buộc Pháp phải đàm phán, dẫn tới Hiệp định Geneva ngày 21-7-1954, kết thúc chiến tranh xâm lược ở Việt Nam, đất nước được giải phóng từ Bắc đến Nam trong điều kiện mới. Ý nghĩa đối với các nước khác: cổ vũ mạnh mẽ phong trào đấu tranh giành độc lập dân tộc ở các nước thuộc hệ thống thuộc địa, cản trở mưu toàn lập chiến tranh xâm lược của hệ thống thực dân, làm thất bại chính sách "Domino" của Mỹ.',
            solution: [
              'Xác định thời điểm: ngày 7-5-1954 quân Pháp bị "choáng ngợp" trong chiến dịch Viễn Châu - Điện Biên Phủ; ngày 17-5-1954 giải phóng Thành cổ.',
              'Trước tác động: 21-7-1954 Hiệp định Geneva, Pháp phải rút quân, cắt lưu cung quốc tế, xác lập đường phân chia tạm thời tại vĩnh tuyến 17, mở đầu cho sự ra đời của hai nước Việt Nam.',
              'Đối với các nước khác: cổ vũ cuộc đấu tranh chống thực dân của nhân dân các nước, khiến chính sách lan tỏa của Mỹ bị phá sản trên phạm vi thế giới.',
              'Kết luận: đây là thắng lợi có tầm chiến lược quốc tế, chứng minh sức mạnh của chủ nghĩa dân tộc và chủ nghĩa Mác - Lênin trong thực tiễn Việt Nam.',
            ],
            explanation:
              'Câu hỏi đòi hỏi phân tích tính chất, ý nghĩa của một sự kiện lịch sử trên cả hai phương diện trong nước và quốc tế.',
            points: 2,
          },
          {
            id: 'ct-lichsu-8-2026-s1-q3',
            number: 3,
            type: 'tu-luan',
            prompt:
              'Ngày 2-9-1945 có ý nghĩa như thế nào đối với lịch sử dân tộc ta? Hãy nêu vài minh hoạ tiêu biểu.',
            answer:
              'Ngày 2-9-1945 là ngày khai sinh độc lập của nhân dân Việt Nam, mở đầu cho kỷ nguyên mới của đất nước. Ý nghĩa lịch sử: đánh dấu sự thành lập của nước Việt Nam Dân chủ Cộng hòa, nước nhà thống nhất, độc lập, dân chủ; đánh dấu sự thất bại hoàn toàn của chính sách thực dân của Nhật và Pháp; mở đầu cho cuộc cách mạng dân chủ nhân dân tiến lên giai đoạn mới. Minh hoạ: bài hát "Nắng sáng trong tươi lai" của Phạm Duy; cờ đỏ sao vàng treo ở Ba Đình; cuộc biểu tình ở Hà Nội ngày 2-9; việc lập Chính phủ ở Nam Kỳ và Bắc Kỳ, kéo dài cơ sở điều hành nhà nước.',
            solution: [
              'Xác định sự kiện: 2-9-1945, Chính phủ Việt Nam Dân chủ Cộng hòa tuyên bố độc lập trước quần đông dân chúng ở Ba Đình, Hà Nội.',
              'Nêu các ý nghĩa: ra đời chính quyền nhân dân; đánh dấu thắng lợi của cách mạng tháng Tám; thất bại của chính sách thực dân Nhật - Pháp; mở đầu giai đoạn xây dựng nước độc lập.',
              'Nêu minh hoạ tiêu biểu từ khối liệu lịch sử và văn hoá như bài hát "Nắng sáng trong tươi lai", cờ đỏ sao vàng, các cuộc biểu tình quần chúng.',
              'Liên hệ bài học: thắng lợi thuộc về động đòi cách mạng của nhân dân, trong đó vai trò của Đảng là điều kiện tiên quyết.',
            ],
            explanation:
              'Câu hỏi kiểm tra khả năng làm rõ ý nghĩa của sự kiện lịch sử và biết dẫn chứng bằng sự kiện, di sản cụ thể.',
            points: 1,
          },
        ],
      },
      {
        id: 'ct-lichsu-8-2026-s2',
        title: 'PHẦN II. CÂU HỎI MỞ RỘNG',
        points: 5,
        questions: [
          {
            id: 'ct-lichsu-8-2026-s2-q1',
            number: 1,
            type: 'tu-luan',
            prompt:
              'Quốc hội khóa I (1946) đã làm những việc gì quan trọng trong đời đời dân Việt? Nêu cơ sở pháp lý và ý nghĩa của những việc đó.',
            answer:
              'Quốc hội khóa I đã thông qua Chính cương lịch, chính sách bầu cử, Hiến pháp 1946; thành lập Chính phủ, bầu Đồng Khánh làm Chủ tịch nước; tổ chức bầu cử Quốc hội khóa II, thành lập Ủy ban Trung ương Đảng, thành lập các cơ quan nhà nước trung ương. Ý nghĩa: đây là cơ quan đại diện tối cao của nhân dân, cơ quan quyền lập pháp, chứng minh chính quyền dân chủ do nhân dân xây dựng và mang tính nhân dân sâu sắc.',
            solution: [
              'Bối cảnh thành lập: tháng 1-1946 Quốc hội khóa I họp phiên đầu tiên tại Hà Nội, đóng vai trò cơ quan đại diện tối cao.',
              'Liệt kê các việc quan trọng: ban hành Chính cương lịch và chính sách bầu cử, thông qua Hiến pháp 1946, thành lập Chính phủ, bầu Chủ tịch nước, thành lập Ủy ban Trung ương Đảng, cử Đồng Khánh đi thiện triều nước, tổ chức bầu cử khóa II.',
              'Phân tích tính chất: Quốc hội hoạt động theo Hiến pháp, dân chủ, có đại diện của các giai cấp, dân tộc, tôn giáo, đảng phái.',
              'Nêu ý nghĩa: khẳng định chính quyền của nhân dân, mở đầu cho quá trình xây dựng chế độ dân chủ mới, củng cố chính quyền non trẻ.',
            ],
            explanation:
              'Câu hỏi mở rộng yêu cầu người học không chỉ liệt kê sự kiện mà còn phân tích được cơ sở, tính chất và ý nghĩa của hoạt động của Quốc hội khóa I.',
            points: 2,
          },
          {
            id: 'ct-lichsu-8-2026-s2-q2',
            number: 2,
            type: 'tu-luan',
            prompt:
              'Sự kiện nào trong năm 1945 được coi là "mốc son" cho sự ra đời và thành lập nước Việt Nam Dân chủ Cộng hòa? Hãy nêu diễn biến chính của sự kiện đó.',
            answer:
              'Sự kiện ngày 2-9-1945. Diễn biến: sau khi Nhật đầu hàng, Chính phủ Việt Nam Dân chủ Cộng hòa thành lập ngày 18-4-1945 với sự tham gia của các đảng phái, tổ chức quốc dân đoàn và Đồng Khánh đi thiện triều nước; Tổng ủy trị ở Trung ương và Thanh niên cứu quốc phối hợp giành chính quyền ở Hà Nội, Sài Gòn và các địa phương; ngày 2-9-1945 Chính phủ tuyên bố độc lập trước quần chúng ở Ba Đình, Hà Nội; sau đó lập Chính phủ ở Nam Kỳ, Bắc Kỳ, trung ương và địa phương, củng cố bộ máy nhà nước.',
            solution: [
              'Xác định mốc: 2-9-1945, đồng thời là Quốc khánh.',
              'Trình bày diễn biến theo trình tự: mốc Nhật đầu hàng 15-8-1945, Tổng ủy trị và Thanh niên cứu quốc giành chính quyền, Chính phủ thành lập ngày 18-4-1945, việc lập chính quyền ở các địa phương.',
              'Mô tả cảnh giác trưng bày lớn ở Ba Đình ngày 2-9-1945 và lá cờ đỏ sao vàng được kéo lên.',
              'Kết luận về ý nghĩa: đây là sự kiện "mốc son" đánh dấu sự ra đời của nước Việt Nam Dân chủ Cộng hòa, chủ quyền, chủ tịch và tự do, dân chủ.',
            ],
            explanation:
              'Câu hỏi yêu cầu dựng lại trình tự diễn biến của sự kiện, đồng thời liên hệ với các mốc thời gian khác trong năm 1945.',
            points: 2,
          },
          {
            id: 'ct-lichsu-8-2026-s2-q3',
            number: 3,
            type: 'tu-luan',
            prompt:
              'Hãy nêu những đóng góp quan trọng của Đảng Cộng sản Việt Nam trong sự nghiệp dựng nước và bảo vệ độc lập, bảo vệ Tổ quốc.',
            answer:
              'Đảng Cộng sản Việt Nam đóng góp: làm nòng lực lãnh đạo cách mạng, xây dựng chính quyền dân chủ ở nhiều địa phương; thành lập Chính phủ, tổ chức quốc dân đoàn, cử Đồng Khánh đi thiện triều nước; xây dựng lực lượng vũ trang, tổ chức chiến dịch Việt Nam - Xô Đông và chiến dịch Đông Xuân; lãnh đạo đấu tranh chính trị, ngoại giao, đấu tranh ngoại thương, bảo vệ đường biên giới, tổ chức bầu cử ở nhiều tỉnh, thành phố; lãnh đạo cuộc kháng chiến chống Mỹ cứu nước và thống nhất đất nước năm 1975.',
            solution: [
              'Nhóm các đóng góp theo ba phương diện: về chính trị, về quân sự, về xây dựng và bảo vệ chế độ.',
              'Chính trị: lãnh đạo nhân dân giành chính quyền, thành lập Chính phủ, xây dựng chính quyền dân chủ ở các địa phương.',
              'Quân sự: xây dựng lực lượng vũ trang, tổ chức các chiến dịch, lãnh đạo kháng chiến chống Mỹ.',
              'Kết luận: vai trò của Đảng là điều kiện tiên quyết để cách mạng Việt Nam thắng lợi, là mấu chốt của mọi thắng lợi.',
            ],
            explanation:
              'Câu hỏi cần tổng hợp kiến thức cả năm học về vai trò lãnh đạo của Đảng, đồng thời liên hệ với bài học về tính chất, nhiệm vụ của Đảng.',
            points: 1,
          },
        ],
      },
    ],
  },  {
    id: 'ct-tinhoc-7-2026',
    title: 'Đề thi môn Tin học lớp 7 học kỳ II năm học 2025 - 2026',
    subject: 'Tin học',
    grade: 'Lớp 7',
    school: 'Trường THCS Võ Thị Sáu',
    year: '2025 – 2026',
    term: 'Học kỳ II',
    durationMinutes: 45,
    interactive: true,
    author: 'Đỗ Trung Kiên',
    createdAt: '2026-06-12T01:30:00.000Z',
    views: 760,
    likes: 95,
    shared: true,
    sections: [
      {
        id: 'ct-tinhoc-7-2026-s1',
        title: 'PHẦN I. TRẮC NGHIỆM',
        points: 6,
        questions: [
          {
            id: 'ct-tinhoc-7-2026-s1-q1',
            number: 1,
            type: 'trac-nghiem',
            prompt: 'Trong Windows, tổ hợp phím nào dùng để mở menu Start?',
            options: [
              { key: 'A', text: 'Phím Esc' },
              { key: 'B', text: 'Phím Windows' },
              { key: 'C', text: 'Phím Ctrl + Esc' },
              { key: 'D', text: 'Phím Alt + F4' },
            ],
            answer: 'B',
            explanation:
              'Phím Windows nằm ở giữa bàn phím, bấm phím này sẽ mở menu Start; tổ hợp Ctrl + Esc cũng mở được menu Start.',
            points: 0.5,
          },
          {
            id: 'ct-tinhoc-7-2026-s1-q2',
            number: 2,
            type: 'trac-nghiem',
            prompt: 'Tổ hợp phím nào được dùng để sao chép (copy) nội dung đang chọn?',
            options: [
              { key: 'A', text: 'Ctrl + X' },
              { key: 'B', text: 'Ctrl + C' },
              { key: 'C', text: 'Ctrl + V' },
              { key: 'D', text: 'Ctrl + Z' },
            ],
            answer: 'B',
            explanation:
              'Ctrl + C sao chép, Ctrl + X cắt, Ctrl + V dán và Ctrl + Z hoàn tác thao tác.',
            points: 0.5,
          },
          {
            id: 'ct-tinhoc-7-2026-s1-q3',
            number: 3,
            type: 'trac-nghiem',
            prompt: 'Để lưu tệp với tên khác hoặc địa chỉ khác, ta dùng tổ hợp phím:',
            options: [
              { key: 'A', text: 'Ctrl + S' },
              { key: 'B', text: 'Ctrl + F' },
              { key: 'C', text: 'Ctrl + P' },
              { key: 'D', text: 'Ctrl + O' },
            ],
            answer: 'A',
            explanation:
              'Ctrl + S lưu tệp; nếu tệp chưa có tên, hộp thoại Save As sẽ mở ra để ta chọn tên và nơi lưu.',
            points: 0.5,
          },
          {
            id: 'ct-tinhoc-7-2026-s1-q4',
            number: 4,
            type: 'trac-nghiem',
            prompt: 'Biểu tượng nào trong Windows Explorer dùng để biểu thị thư mục?',
            options: [
              { key: 'A', text: 'Hình chiếc lá' },
              { key: 'B', text: 'Hình cái kẹp giấy' },
              { key: 'C', text: 'Hình chiếc túi' },
              { key: 'D', text: 'Hình ổ cứng' },
            ],
            answer: 'C',
            explanation:
              'Hình chiếc túi biểu thị thư mục, hình chiếc lá biểu thị tệp, hình cái kẹp giấy biểu thị tệp đang được mở.',
            points: 0.5,
          },
          {
            id: 'ct-tinhoc-7-2026-s1-q5',
            number: 5,
            type: 'trac-nghiem',
            prompt: 'Dữ liệu kiểu nào trong bảng tính chỉ chứa các số?',
            options: [
              { key: 'A', text: 'Kiểu văn bản' },
              { key: 'B', text: 'Kiểu số' },
              { key: 'C', text: 'Kiểu ngày tháng' },
              { key: 'D', text: 'Kiểu công thức' },
            ],
            answer: 'B',
            explanation:
              'Kiểu số chỉ chứa các số, còn kiểu văn bản chứa chuỗi ký tự, kiểu ngày tháng chứa các giá trị ngày.',
            points: 0.5,
          },
          {
            id: 'ct-tinhoc-7-2026-s1-q6',
            number: 6,
            type: 'trac-nghiem',
            prompt: 'Trong bảng tính Excel, ô nào chứa công thức sau: =A1+B1 ?',
            options: [
              { key: 'A', text: 'A1' },
              { key: 'B', text: 'B1' },
              { key: 'C', text: 'C1' },
              { key: 'D', text: 'A2' },
            ],
            answer: 'C',
            explanation:
              'Công thức =A1+B1 được gõ vào ô C1, khi đó giá trị của ô C1 là tổng giá trị hai ô A1 và B1.',
            points: 0.5,
          },
          {
            id: 'ct-tinhoc-7-2026-s1-q7',
            number: 7,
            type: 'trac-nghiem',
            prompt: 'Hàm nào trong bảng tính dùng để tính tổng các số trong một dải ô?',
            options: [
              { key: 'A', text: 'AVERAGE' },
              { key: 'B', text: 'SUM' },
              { key: 'C', text: 'MAX' },
              { key: 'D', text: 'COUNT' },
            ],
            answer: 'B',
            explanation:
              'Hàm SUM dùng để tính tổng, AVERAGE tính trung bình, MAX tìm giá trị lớn nhất, COUNT đếm số ô chứa số.',
            points: 0.5,
          },
          {
            id: 'ct-tinhoc-7-2026-s1-q8',
            number: 8,
            type: 'trac-nghiem',
            prompt: 'Địa chỉ nào là địa chỉ tương đối trong bảng tính?',
            options: [
              { key: 'A', text: '$A$1' },
              { key: 'B', text: 'A1' },
              { key: 'C', text: '\\$A1' },
              { key: 'D', text: 'A\\$1' },
            ],
            answer: 'B',
            explanation:
              'Địa chỉ tương đối là A1, khi sao chép công thức nó thay đổi theo vị trí; có ký hiệu \\$ là địa chỉ tuyệt đối.',
            points: 0.5,
          },
          {
            id: 'ct-tinhoc-7-2026-s1-q9',
            number: 9,
            type: 'trac-nghiem',
            prompt: 'Trong phần mềm soạn thảo văn bản, thao tác "cắt" (cut) nội dung được thực hiện bằng:',
            options: [
              { key: 'A', text: 'Tổ hợp phím Ctrl + X' },
              { key: 'B', text: 'Tổ hợp phím Ctrl + C' },
              { key: 'C', text: 'Tổ hợp phím Ctrl + V' },
              { key: 'D', text: 'Tổ hợp phím Ctrl + B' },
            ],
            answer: 'A',
            explanation:
              'Ctrl + X cắt (chuyển nội dung vào bộ nhớ tạm), Ctrl + C sao chép, Ctrl + V dán, Ctrl + B in đậm.',
            points: 0.5,
          },
          {
            id: 'ct-tinhoc-7-2026-s1-q10',
            number: 10,
            type: 'trac-nghiem',
            prompt: 'Câu nào sau đây là cách sử dụng máy tính an toàn?',
            options: [
              { key: 'A', text: 'Tự ý cài đặt phần mềm từ Internet không rõ nguồn gốc' },
              { key: 'B', text: 'Đặt mật khẩu mạnh cho tài khoản và tắt máy khi rời khỏi bàn' },
              { key: 'C', text: 'Chia sẻ mật khẩu tài khoản với bạn bè' },
              { key: 'D', text: 'Bấm vào mọi liên kết lạ nhận được qua thư điện tử' },
            ],
            answer: 'B',
            explanation:
              'Đặt mật khẩu mạnh và tắt máy khi không sử dụng là những thói quen bảo vệ an toàn thông tin.',
            points: 0.5,
          },
          {
            id: 'ct-tinhoc-7-2026-s1-q11',
            number: 11,
            type: 'trac-nghiem',
            prompt: 'Một tệp tin có tên "Bai tap.docx" được lưu trong ổ đĩa D. Ký hiệu đầy đủ của đường dẫn tới tệp đó là:',
            options: [
              { key: 'A', text: 'D:\\Bai tap.docx' },
              { key: 'B', text: 'D:/Bai tap.docx' },
              { key: 'C', text: 'C:\\Bai tap.docx' },
              { key: 'D', text: 'Bai tap.docx' },
            ],
            answer: 'A',
            explanation:
              'Đường dẫn tuyệt đối gồm tên ổ đĩa, dấu gạch chéo ngược và tên tệp; trên Windows dùng dấu \\ để phân cách.',
            points: 0.5,
          },
          {
            id: 'ct-tinhoc-7-2026-s1-q12',
            number: 12,
            type: 'trac-nghiem',
            prompt: 'Câu nào nói đúng về thư mục "Tài liệu" (Documents)?',
            options: [
              { key: 'A', text: 'Là nơi lưu trữ các tệp văn bản, hình ảnh, âm thanh do người dùng tạo' },
              { key: 'B', text: 'Là nơi lưu trữ chương trình đang chạy' },
              { key: 'C', text: 'Chỉ chứa các tệp có tên tiếng Anh' },
              { key: 'D', text: 'Không thể sao chép hay di chuyển tệp trong đó' },
            ],
            answer: 'A',
            explanation:
              'Thư mục Tài liệu là nơi lưu trữ mặc định các tệp dữ liệu của người dùng, hỗ trợ sao chép, di chuyển và xóa bình thường.',
            points: 0.5,
          },
        ],
      },
      {
        id: 'ct-tinhoc-7-2026-s2',
        title: 'PHẦN II. TỰ LUẬN',
        points: 4,
        questions: [
          {
            id: 'ct-tinhoc-7-2026-s2-q1',
            number: 1,
            type: 'tu-luan',
            prompt:
              'Trên máy tính, hãy nêu các thao tác để tạo một thư mục có tên "Bai tap lop 7" trong ổ đĩa D và giải thích ngắn gọn ý nghĩa của từng thao tác.',
            answer:
              'Các thao tác: mở ổ đĩa D trong Windows Explorer; nhấn chuột phải vào vùng trống để hiện menu ngữ cảnh; chọn New; chọn Folder; gõ tên "Bai tap lop 7"; nhấn Enter để hoàn tất.',
            solution: [
              'Bước 1: mở ổ đĩa D bằng cách nhấp đúp vào biểu tượng ổ đĩa trong cửa sổ This PC.',
              'Bước 2: nhấn chuột phải vào vùng trống của cửa sổ để mở menu ngữ cảnh, đây là thao tác gọi menu lệnh theo vị trí nhấp chuột.',
              'Bước 3: chọn New rồi chọn Folder để tạo một thư mục mới trong vị trí hiện tại.',
              'Bước 4: gõ tên "Bai tap lop 7" rồi nhấn Enter để xác nhận tên và hoàn tất thao tác.',
            ],
            explanation:
              'Đề yêu cầu trình bày quy trình thao tác theo đúng thứ tự và hiểu được ý nghĩa của từng thao tác, tránh chỉ liệt kê mà không giải thích.',
            points: 2,
          },
          {
            id: 'ct-tinhoc-7-2026-s2-q2',
            number: 2,
            type: 'tu-luan',
            prompt:
              'Trong bảng tính, giả sử cột A chứa điểm số của 5 học sinh là A1 đến A5. a) Hãy viết công thức tính tổng điểm. b) Viết công thức tính điểm trung bình. c) Viết công thức tại ô B1 để biết kết quả có lớn hơn 8 hay không (dùng hàm điều kiện).',
            answer:
              'a) Tổng điểm: =SUM(A1:A5). b) Điểm trung bình: =AVERAGE(A1:A5). c) Tại ô B1: =IF(AVERAGE(A1:A5)>=8,"Đạt","Chưa đạt").',
            solution: [
              'Xác định dải dữ liệu: các điểm số nằm trong dải ô A1:A5, trong đó dấu hai chấm là toán tử nối giữa hai ô đầu và cuối.',
              'a) Dùng hàm SUM để lấy tổng các giá trị số trong dải: =SUM(A1:A5).',
              'b) Dùng hàm AVERAGE để lấy trung bình cộng của dải: =AVERAGE(A1:A5).',
              'c) Dùng hàm IF với điều kiện trung bình lớn hơn hoặc bằng 8 thì trả về chuỗi "Đạt", ngược lại trả về "Chưa đạt"; dấu phẩy là dấu phân cách các tham số của hàm.',
            ],
            explanation:
              'Câu hỏi kiểm tra khả năng sử dụng địa chỉ dải ô, các hàm SUM, AVERAGE và hàm điều kiện IF trong bảng tính.',
            points: 2,
          },
        ],
      },
    ],
  },
]
