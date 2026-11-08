/**
 * Câu THPT theo định dạng thi tốt nghiệp 2025 (trắc nghiệm, đúng/sai, trả lời ngắn), nhiều môn, soạn mới theo dạng và độ khó
 * của đề thi thử / kiểm tra các trường năm 2026. File sinh bằng scripts/bank/build.mjs — sửa câu thì sửa trực tiếp tại đây.
 */
import type { BankEntry } from './bank'

export const BANK_THPT3: BankEntry[] = [
  {
    "id": "thpt-t10-bpt-01",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập nghiệm của bất phương trình $2x-4>0$ là",
    "options": [
      {
        "key": "A",
        "text": "$[2;+\\infty)$"
      },
      {
        "key": "B",
        "text": "$(-\\infty;2)$"
      },
      {
        "key": "C",
        "text": "$(2;+\\infty)$"
      },
      {
        "key": "D",
        "text": "$(-\\infty;2]$"
      }
    ],
    "answer": "C",
    "explanation": "$2x-4>0 \\Leftrightarrow x>2$, dấu bất đẳng thức ngiêng nên không lấy đầu mút: $(2;+\\infty)$.",
    "points": 0.25,
    "tags": [
      "bất phương trình",
      "bậc nhất một ẩn",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-02",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập nghiệm của bất phương trình $-3x+6 \\ge 0$ là",
    "options": [
      {
        "key": "A",
        "text": "$(-\\infty;2)$"
      },
      {
        "key": "B",
        "text": "$(-\\infty;2]$"
      },
      {
        "key": "C",
        "text": "$(2;+\\infty)$"
      },
      {
        "key": "D",
        "text": "$[2;+\\infty)$"
      }
    ],
    "answer": "B",
    "explanation": "$-3x+6 \\ge 0 \\Leftrightarrow -3x \\ge -6 \\Leftrightarrow x \\le 2$ (đổi chiều khi chia số âm): $(-\\infty;2]$.",
    "points": 0.25,
    "tags": [
      "bất phương trình",
      "bậc nhất một ẩn",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-03",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập nghiệm của hệ $\\begin{cases} x>1 \\\\ x \\le 4 \\end{cases}$ là",
    "options": [
      {
        "key": "A",
        "text": "$(1;4)$"
      },
      {
        "key": "B",
        "text": "$[1;4]$"
      },
      {
        "key": "C",
        "text": "$(-1;4]$"
      },
      {
        "key": "D",
        "text": "$(1;4]$"
      }
    ],
    "answer": "D",
    "explanation": "Giao của $(1;+\\infty)$ và $(-\\infty;4]$ là $(1;4]$.",
    "points": 0.25,
    "tags": [
      "hệ bất phương trình",
      "một ẩn",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-04",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Miền nghiệm của bất phương trình $y \\ge x+1$ là",
    "options": [
      {
        "key": "A",
        "text": "nửa mặt phẳng bờ là đường thẳng $y=x+1$, không kể bờ, chứa gốc toạ độ"
      },
      {
        "key": "B",
        "text": "nửa mặt phẳng bờ là đường thẳng $y=x+1$, kể cả bờ, không chứa gốc toạ độ"
      },
      {
        "key": "C",
        "text": "nửa mặt phẳng bờ là đường thẳng $y=x+1$, không kể bờ, không chứa gốc toạ độ"
      },
      {
        "key": "D",
        "text": "nửa mặt phẳng bờ là đường thẳng $y=x+1$, kể cả bờ, chứa gốc toạ độ"
      }
    ],
    "answer": "B",
    "explanation": "$y \\ge x+1$ kể cả bờ; gốc toạ độ $O(0;0)$ có $0 \\ge 1$ sai nên miền không chứa $O$.",
    "points": 0.25,
    "tags": [
      "bất phương trình",
      "miền nghiệm hai ẩn",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-05",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong các điểm sau, điểm nào thuộc miền nghiệm của hệ $\\begin{cases} x+2y \\le 4 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$ (vẽ như hình)?",
    "options": [
      {
        "key": "A",
        "text": "$(0;2)$"
      },
      {
        "key": "B",
        "text": "$(2;2)$"
      },
      {
        "key": "C",
        "text": "$(3;1)$"
      },
      {
        "key": "D",
        "text": "$(1;2)$"
      }
    ],
    "answer": "A",
    "explanation": "$(0;2)$: $0+2 \\cdot 2=4 \\le 4$ thoả. $(2;2)$, $(3;1)$, $(1;2)$ đều cho $x+2y>4$ nên loại.",
    "points": 0.25,
    "tags": [
      "hệ bất phương trình",
      "miền nghiệm",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -1,
      "xMax": 4,
      "yMin": -1,
      "yMax": 4,
      "grid": true,
      "items": "x + 2y = 4\nx = 0\ny = 0"
    }
  },
  {
    "id": "thpt-t10-bpt-06",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Trên miền $\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ x+y \\le 5 \\end{cases}$ (vẽ như hình), giá trị lớn nhất của hàm $f(x;y)=2x+3y$ là",
    "options": [
      {
        "key": "A",
        "text": "$10$"
      },
      {
        "key": "B",
        "text": "$15$"
      },
      {
        "key": "C",
        "text": "$18$"
      },
      {
        "key": "D",
        "text": "$12$"
      }
    ],
    "answer": "B",
    "explanation": "Đỉnh miền: $(0;0)$, $(5;0)$, $(0;5)$. $f(5;0)=10$, $f(0;5)=15$ nên GTLN $=15$ tại $(0;5)$.",
    "points": 0.25,
    "tags": [
      "bất phương trình",
      "bài toán tối ưu",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -1,
      "xMax": 6,
      "yMin": -1,
      "yMax": 6,
      "grid": true,
      "items": "x + y = 5\nx = 0\ny = 0"
    }
  },
  {
    "id": "thpt-t10-bpt-07",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Miền nghiệm của hệ $\\begin{cases} x+y \\le 6 \\\\ x \\ge 1 \\\\ y \\ge 1 \\end{cases}$ là một tam giác. Diện tích tam giác đó là",
    "options": [
      {
        "key": "A",
        "text": "$6$"
      },
      {
        "key": "B",
        "text": "$9$"
      },
      {
        "key": "C",
        "text": "$16$"
      },
      {
        "key": "D",
        "text": "$8$"
      }
    ],
    "answer": "D",
    "explanation": "Tam giác có ba đỉnh $(1;1)$, $(5;1)$, $(1;5)$, hai cạnh góc vuông đều dài 4 nên diện tích $\\dfrac{4 \\cdot 4}{2}=8$.",
    "points": 0.25,
    "tags": [
      "hệ bất phương trình",
      "miền nghiệm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-08",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một xưởng sản xuất bàn và ghế. Mỗi chiếc bàn cần 2 giờ máy A và 1 giờ máy B; mỗi chiếc ghế cần 1 giờ máy A và 3 giờ máy B. Máy A hoạt động tối đa 12 giờ, máy B tối đa 15 giờ. Lợi nhuận 3 triệu đồng cho mỗi bàn, 4 triệu đồng cho mỗi ghế. Lợi nhuận lớn nhất (triệu đồng) là",
    "options": [
      {
        "key": "A",
        "text": "$20$"
      },
      {
        "key": "B",
        "text": "$25$"
      },
      {
        "key": "C",
        "text": "$27$"
      },
      {
        "key": "D",
        "text": "$28$"
      }
    ],
    "answer": "C",
    "explanation": "Ràng buộc: $2x+y \\le 12$, $x+3y \\le 15$, $x,y \\ge 0$. Đỉnh đặc biệt: giao hai đường là $x=4{,}2$, $y=3{,}6$ với lợi nhuận $3(4{,}2)+4(3{,}6)=27$. So sánh $(6;0)$: $18$; $(0;5)$: $20$. Vậy tối đa $27$.",
    "points": 0.25,
    "tags": [
      "bất phương trình",
      "bài toán tối ưu",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-09",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập nghiệm của hệ $\\begin{cases} 2x+4>0 \\\\ x-3<0 \\end{cases}$ là",
    "options": [
      {
        "key": "A",
        "text": "$(-3;2)$"
      },
      {
        "key": "B",
        "text": "$(-2;3]$"
      },
      {
        "key": "C",
        "text": "$(-2;3)$"
      },
      {
        "key": "D",
        "text": "$[-2;3)$"
      }
    ],
    "answer": "C",
    "explanation": "$x>-2$ và $x<3$.",
    "points": 0.25,
    "tags": [
      "bất phương trình",
      "giá trị tuyệt đối",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-10",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập nghiệm của hệ $\\begin{cases} x+1 \\ge 0 \\\\ 2-x>0 \\end{cases}$ là",
    "options": [
      {
        "key": "A",
        "text": "$[-1;2)$"
      },
      {
        "key": "B",
        "text": "$(-1;2)$"
      },
      {
        "key": "C",
        "text": "$[-1;2]$"
      },
      {
        "key": "D",
        "text": "$(-1;2]$"
      }
    ],
    "answer": "A",
    "explanation": "$x \\ge -1$ và $x<2$ nên $-1 \\le x<2$: $[-1;2)$.",
    "points": 0.25,
    "tags": [
      "hệ bất phương trình",
      "một ẩn",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-11",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho đường thẳng $d: 2x+y=4$ (vẽ như hình). Điểm $M(1;1)$ nằm ở đâu?",
    "options": [
      {
        "key": "A",
        "text": "thuộc miền $2x+y<4$"
      },
      {
        "key": "B",
        "text": "thuộc miền $2x+y>4$"
      },
      {
        "key": "C",
        "text": "thuộc đường thẳng $d$"
      },
      {
        "key": "D",
        "text": "không thuộc miền nào vì $d$ không chia mặt phẳng"
      }
    ],
    "answer": "A",
    "explanation": "Thay $M(1;1)$: $2 \\cdot 1+1=3<4$ nên $M$ thuộc nửa mặt phẳng $2x+y<4$.",
    "points": 0.25,
    "tags": [
      "bất phương trình",
      "miền nghiệm hai ẩn",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -1,
      "xMax": 4,
      "yMin": -1,
      "yMax": 5,
      "grid": true,
      "items": "d: 2x + y = 4\nM(1; 1)"
    }
  },
  {
    "id": "thpt-t10-bpt-12",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Với giá trị nào của $m$ thì bất phương trình $(m-1)x>m-1$ có tập nghiệm $T=(1;+\\infty)$?",
    "options": [
      {
        "key": "A",
        "text": "$m<1$"
      },
      {
        "key": "B",
        "text": "$m \\le 1$"
      },
      {
        "key": "C",
        "text": "$m \\ge 1$"
      },
      {
        "key": "D",
        "text": "$m>1$"
      }
    ],
    "answer": "D",
    "explanation": "Để tập nghiệm là $(1;+\\infty)$ phải chia hai vế cho $m-1>0$ mà không đổi chiều: $m>1$. Khi đó $(m-1)x>m-1 \\Leftrightarrow x>1$.",
    "points": 0.25,
    "tags": [
      "bất phương trình",
      "tham số",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-13",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho bất phương trình $3x-6<0$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$x=1$ là một nghiệm của bất phương trình"
      },
      {
        "key": "b",
        "text": "$x=2$ là một nghiệm của bất phương trình"
      },
      {
        "key": "c",
        "text": "Tập nghiệm của bất phương trình là $(-\\infty;2)$"
      },
      {
        "key": "d",
        "text": "$x=2{,}5$ là một nghiệm của bất phương trình"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) $3-6=-3<0$ — đúng. b) $3 \\cdot 2-6=0$, cần $<0$ — sai. c) $3x<6 \\Leftrightarrow x<2$ — đúng. d) $3(2{,}5)-6=1{,}5>0$ — sai.",
    "points": 1,
    "tags": [
      "bất phương trình",
      "bậc nhất một ẩn",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-14",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Xét hệ bất phương trình $\\begin{cases} x+y \\le 4 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$ với miền nghiệm vẽ như hình. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Điểm $(1;1)$ thuộc miền nghiệm"
      },
      {
        "key": "b",
        "text": "Điểm $(3;2)$ thuộc miền nghiệm"
      },
      {
        "key": "c",
        "text": "Miền nghiệm là tam giác có ba đỉnh $(0;0)$, $(4;0)$, $(0;4)$"
      },
      {
        "key": "d",
        "text": "Điểm $(4;0)$ thuộc miền nghiệm"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) $1+1=2 \\le 4$ — đúng. b) $3+2=5>4$ — sai. c) Ba đỉnh là giao từng cặp đường thẳng — đúng. d) $4+0=4 \\le 4$ — đúng.",
    "points": 1,
    "tags": [
      "hệ bất phương trình",
      "miền nghiệm",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -1,
      "xMax": 5,
      "yMin": -1,
      "yMax": 5,
      "grid": true,
      "items": "x + y = 4\nx = 0\ny = 0"
    }
  },
  {
    "id": "thpt-t10-bpt-15",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Xét bất phương trình $2x+3y \\le 12$ với $x \\ge 0$, $y \\ge 0$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Điểm $(0;4)$ thuộc miền nghiệm"
      },
      {
        "key": "b",
        "text": "Điểm $(6;0)$ thuộc miền nghiệm"
      },
      {
        "key": "c",
        "text": "Điểm $(3;3)$ thuộc miền nghiệm"
      },
      {
        "key": "d",
        "text": "Điểm $(1;2)$ không thuộc miền nghiệm"
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) $0+12=12 \\le 12$ — đúng. b) $12+0=12 \\le 12$ — đúng. c) $6+9=15>12$ — sai. d) $2+6=8 \\le 12$ nên $(1;2)$ thuộc miền — sai.",
    "points": 1,
    "tags": [
      "bất phương trình",
      "miền nghiệm hai ẩn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-16",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho hệ bất phương trình $\\begin{cases} x+4 \\ge 0 \\\\ x-2 \\le 0 \\end{cases}$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$x=2$ là một nghiệm"
      },
      {
        "key": "b",
        "text": "$x=-5$ là một nghiệm"
      },
      {
        "key": "c",
        "text": "Tập nghiệm là $[-4;2]$"
      },
      {
        "key": "d",
        "text": "Tập nghiệm là $(-4;2)$"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "Tập nghiệm $[-4;2]$: a) đúng, b) sai, c) đúng, d) sai.",
    "points": 1,
    "tags": [
      "bất phương trình",
      "giá trị tuyệt đối",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-17",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Xét bài toán: tìm GTLN của $f(x;y)=x+y$ trên miền $\\begin{cases} x+2y \\le 8 \\\\ 2x+y \\le 10 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$ (vẽ như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "GTLN của $f$ trên miền bằng 6"
      },
      {
        "key": "b",
        "text": "GTLN đạt được tại điểm $(4;2)$"
      },
      {
        "key": "c",
        "text": "$f(0;4)=5$"
      },
      {
        "key": "d",
        "text": "Điểm $(5;0)$ thuộc miền nghiệm"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "Đỉnh miền: $(0;0)$, $(0;4)$, $(4;2)$ (giao hai đường thẳng), $(5;0)$. a) $f(4;2)=6$ lớn nhất — đúng. b) Đúng. c) $f(0;4)=4 \\ne 5$ — sai. d) $2 \\cdot 5+0=10 \\le 10$, $5+0=5 \\le 8$ — đúng.",
    "points": 1,
    "tags": [
      "bất phương trình",
      "bài toán tối ưu",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -1,
      "xMax": 6,
      "yMin": -1,
      "yMax": 5,
      "grid": true,
      "items": "x + 2y = 8\n2x + y = 10\nx = 0\ny = 0"
    }
  },
  {
    "id": "thpt-t10-bpt-18",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Xét hệ bất phương trình $\\begin{cases} 3x+2y \\le 6 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Điểm $(0;3)$ thuộc miền nghiệm"
      },
      {
        "key": "b",
        "text": "Điểm $(2;0)$ không thuộc miền nghiệm"
      },
      {
        "key": "c",
        "text": "Điểm $(1;2)$ thuộc miền nghiệm"
      },
      {
        "key": "d",
        "text": "Điểm $(0;0)$ thuộc miền nghiệm"
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) $0+6=6 \\le 6$ — đúng. b) $6+0=6 \\le 6$ nên $(2;0)$ thuộc miền — sai. c) $3+4=7>6$ — sai. d) $0 \\le 6$ — đúng.",
    "points": 1,
    "tags": [
      "hệ bất phương trình",
      "miền nghiệm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-19",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tìm nghiệm lớn nhất của bất phương trình $5-2x \\ge 1$.",
    "answer": "2",
    "explanation": "$5-2x \\ge 1 \\Leftrightarrow -2x \\ge -4 \\Leftrightarrow x \\le 2$. Nghiệm lớn nhất là $2$.",
    "points": 0.5,
    "tags": [
      "bất phương trình",
      "bậc nhất một ẩn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-20",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tìm GTLN của $f(x;y)=4x+3y$ trên miền $\\begin{cases} x+y \\le 5 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$.",
    "answer": "20",
    "explanation": "Đỉnh miền: $(0;0)$, $(5;0)$, $(0;5)$. $f(5;0)=20$, $f(0;5)=15$. GTLN $=20$.",
    "points": 0.5,
    "tags": [
      "bất phương trình",
      "bài toán tối ưu",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-21",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Miền nghiệm của hệ $\\begin{cases} x+y \\le 6 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$ là một tam giác. Tính diện tích tam giác đó.",
    "answer": "18",
    "explanation": "Tam giác đỉnh $(0;0)$, $(6;0)$, $(0;6)$ có diện tích $\\dfrac{6 \\cdot 6}{2}=18$.",
    "points": 0.5,
    "tags": [
      "hệ bất phương trình",
      "miền nghiệm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-22",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hệ bất phương trình $\\begin{cases} 3x+7>0 \\\\ 3x-9<0 \\end{cases}$ có bao nhiêu nghiệm nguyên?",
    "answer": "5",
    "explanation": "$-\\dfrac{7}{3}<x<3$: các số nguyên $-2;-1;0;1;2$.",
    "points": 0.5,
    "tags": [
      "bất phương trình",
      "giá trị tuyệt đối",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-23",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Miền nghiệm của hệ $\\begin{cases} x+y \\le 5 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$ chứa bao nhiêu điểm có toạ độ nguyên?",
    "answer": "21",
    "explanation": "Với $x=0;1;\\ldots;5$ thì $y$ chạy từ $0$ đến $5-x$: $(6)+(5)+(4)+(3)+(2)+(1)=21$ điểm.",
    "points": 0.5,
    "tags": [
      "hệ bất phương trình",
      "đếm điểm",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-24",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tìm GTLN của $f(x;y)=2x+y$ trên miền $\\begin{cases} x+y \\le 4 \\\\ x \\le 3 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$.",
    "answer": "7",
    "explanation": "Đỉnh miền: $(0;0)$, $(3;0)$, $(3;1)$, $(0;4)$. $f(3;1)=7$ lớn nhất.",
    "points": 0.5,
    "tags": [
      "bất phương trình",
      "bài toán tối ưu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-bpt-25",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tìm GTLN của $f(x;y)=3x+2y$ trên miền $\\begin{cases} x+y \\le 5 \\\\ 2x+y \\le 8 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$.",
    "answer": "13",
    "explanation": "Đỉnh miền: $(0;0)$, $(0;5)$, $(3;2)$ (giao hai đường), $(4;0)$. $f(3;2)=13$ lớn nhất.",
    "points": 0.5,
    "tags": [
      "bất phương trình",
      "bài toán tối ưu",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-01",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong các hàm số sau, hàm số nào là hàm bậc hai?",
    "options": [
      {
        "key": "A",
        "text": "$y=2x^2+3x+1$"
      },
      {
        "key": "B",
        "text": "$y=3x+1$"
      },
      {
        "key": "C",
        "text": "$y=x^3+x^2$"
      },
      {
        "key": "D",
        "text": "$y=\\dfrac{x+1}{x}$"
      }
    ],
    "answer": "A",
    "explanation": "Hàm bậc hai có dạng $y=ax^2+bx+c$ với $a \\ne 0$. Chỉ hàm ở phương án A thoả.",
    "points": 0.25,
    "tags": [
      "hàm bậc hai",
      "nhận biết",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-02",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Đỉnh của parabol $y=(x-2)^2-3$ là",
    "options": [
      {
        "key": "A",
        "text": "$(-2;-3)$"
      },
      {
        "key": "B",
        "text": "$(2;3)$"
      },
      {
        "key": "C",
        "text": "$(2;-3)$"
      },
      {
        "key": "D",
        "text": "$(-2;3)$"
      }
    ],
    "answer": "C",
    "explanation": "Dạng chính tắc $y=a(x-h)^2+k$ có đỉnh $(h;k)=(2;-3)$.",
    "points": 0.25,
    "tags": [
      "hàm bậc hai",
      "đỉnh parabol",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-03",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Trục đối xứng của parabol $y=x^2-4x+3$ là",
    "options": [
      {
        "key": "A",
        "text": "$x=-2$"
      },
      {
        "key": "B",
        "text": "$x=2$"
      },
      {
        "key": "C",
        "text": "$x=4$"
      },
      {
        "key": "D",
        "text": "$x=-4$"
      }
    ],
    "answer": "B",
    "explanation": "Trục đối xứng $x=-\\dfrac{b}{2a}=-\\dfrac{-4}{2}=2$.",
    "points": 0.25,
    "tags": [
      "hàm bậc hai",
      "trục đối xứng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-04",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị lớn nhất của hàm số $y=-x^2+2x+3$ là",
    "options": [
      {
        "key": "A",
        "text": "$3$"
      },
      {
        "key": "B",
        "text": "$5$"
      },
      {
        "key": "C",
        "text": "$2$"
      },
      {
        "key": "D",
        "text": "$4$"
      }
    ],
    "answer": "D",
    "explanation": "Đỉnh tại $x=-\\dfrac{2}{2(-1)}=1$, $y=-1+2+3=4$. Parabol hướng xuống nên GTLN $=4$.",
    "points": 0.25,
    "tags": [
      "hàm bậc hai",
      "giá trị lớn nhất",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "-x^2+2x+3"
      ],
      "xMin": -2,
      "xMax": 4,
      "yMin": -2,
      "yMax": 6,
      "labels": true
    }
  },
  {
    "id": "thpt-t10-hambac2-05",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Parabol trong hình đi qua hai điểm $A(-1;0)$, $B(3;0)$ và có dạng $y=ax^2+bx+c$ với $a=1$. Phương trình của parabol đó là",
    "options": [
      {
        "key": "A",
        "text": "$y=x^2-2x-3$"
      },
      {
        "key": "B",
        "text": "$y=x^2+2x-3$"
      },
      {
        "key": "C",
        "text": "$y=x^2-2x+3$"
      },
      {
        "key": "D",
        "text": "$y=-x^2-2x+3$"
      }
    ],
    "answer": "A",
    "explanation": "$y=x^2+bx+c$ qua $(-1;0)$, $(3;0)$ nên $y=(x+1)(x-3)=x^2-2x-3$.",
    "points": 0.25,
    "tags": [
      "hàm bậc hai",
      "xác định phương trình",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^2-2x-3"
      ],
      "xMin": -3,
      "xMax": 5,
      "yMin": -6,
      "yMax": 6,
      "labels": true,
      "points": "A(-1; 0)\nB(3; 0)"
    }
  },
  {
    "id": "thpt-t10-hambac2-06",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập nghiệm của bất phương trình $x^2-5x+6>0$ là",
    "options": [
      {
        "key": "A",
        "text": "$(1;2)$"
      },
      {
        "key": "B",
        "text": "$(-\\infty;2)$"
      },
      {
        "key": "C",
        "text": "$(1;+\\infty)$"
      },
      {
        "key": "D",
        "text": "$(-\\infty;2) \\cup (3;+\\infty)$"
      }
    ],
    "answer": "D",
    "explanation": "$x^2-5x+6=(x-2)(x-3)>0 \\Leftrightarrow x<2$ hoặc $x>3$.",
    "points": 0.25,
    "tags": [
      "hàm bậc hai",
      "bất phương trình bậc hai",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-07",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập nghiệm của bất phương trình $x^2-2x-3 \\le 0$ là",
    "options": [
      {
        "key": "A",
        "text": "$[-1;3]$"
      },
      {
        "key": "B",
        "text": "$(-1;3)$"
      },
      {
        "key": "C",
        "text": "$(-\\infty;-1] \\cup [3;+\\infty)$"
      },
      {
        "key": "D",
        "text": "$[-3;1]$"
      }
    ],
    "answer": "A",
    "explanation": "$x^2-2x-3=(x+1)(x-3) \\le 0 \\Leftrightarrow -1 \\le x \\le 3$.",
    "points": 0.25,
    "tags": [
      "hàm bậc hai",
      "bất phương trình bậc hai",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-08",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Với giá trị nào của $m$ thì phương trình $x^2-2x+m=0$ có hai nghiệm phân biệt?",
    "options": [
      {
        "key": "A",
        "text": "$m \\ge 1$"
      },
      {
        "key": "B",
        "text": "$m<1$"
      },
      {
        "key": "C",
        "text": "$m \\le 1$"
      },
      {
        "key": "D",
        "text": "$m>1$"
      }
    ],
    "answer": "B",
    "explanation": "$\\Delta=4-4m>0 \\Leftrightarrow m<1$.",
    "points": 0.25,
    "tags": [
      "phương trình bậc hai",
      "tham số",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-09",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Đỉnh của parabol $y=2x^2+4x-1$ là",
    "options": [
      {
        "key": "A",
        "text": "$(1;3)$"
      },
      {
        "key": "B",
        "text": "$(-1;3)$"
      },
      {
        "key": "C",
        "text": "$(-1;-3)$"
      },
      {
        "key": "D",
        "text": "$(1;-3)$"
      }
    ],
    "answer": "C",
    "explanation": "$x=-\\dfrac{4}{2 \\cdot 2}=-1$, $y=2-4-1=-3$.",
    "points": 0.25,
    "tags": [
      "hàm bậc hai",
      "đỉnh parabol",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-10",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập nghiệm của bất phương trình $x^2+2x+5>0$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\mathbb{R}$"
      },
      {
        "key": "B",
        "text": "$\\varnothing$"
      },
      {
        "key": "C",
        "text": "$[-1;+\\infty)$"
      },
      {
        "key": "D",
        "text": "$(-\\infty;-1]$"
      }
    ],
    "answer": "A",
    "explanation": "$x^2+2x+5=(x+1)^2+4>0$ với mọi $x$.",
    "points": 0.25,
    "tags": [
      "hàm bậc hai",
      "bất phương trình bậc hai",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-11",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Với giá trị nào của $m$ thì đường thẳng $y=x+m$ cắt parabol $y=x^2$ tại hai điểm phân biệt?",
    "options": [
      {
        "key": "A",
        "text": "$m \\ge -\\dfrac{1}{4}$"
      },
      {
        "key": "B",
        "text": "$m<-\\dfrac{1}{4}$"
      },
      {
        "key": "C",
        "text": "$m>-\\dfrac{1}{4}$"
      },
      {
        "key": "D",
        "text": "$m \\le -\\dfrac{1}{4}$"
      }
    ],
    "answer": "C",
    "explanation": "Phương trình hoành độ giao điểm $x^2-x-m=0$ có $\\Delta=1+4m>0 \\Leftrightarrow m>-\\dfrac{1}{4}$.",
    "points": 0.25,
    "tags": [
      "hàm bậc hai",
      "giao điểm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-12",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị lớn nhất của hàm số $y=-x^2+4x$ trên đoạn $[0;3]$ là",
    "options": [
      {
        "key": "A",
        "text": "$3$"
      },
      {
        "key": "B",
        "text": "$4$"
      },
      {
        "key": "C",
        "text": "$5$"
      },
      {
        "key": "D",
        "text": "$9$"
      }
    ],
    "answer": "B",
    "explanation": "Đỉnh $x=2 \\in [0;3]$ với $y=4$; so sánh $f(0)=0$, $f(3)=3$. GTLN $=4$.",
    "points": 0.25,
    "tags": [
      "hàm bậc hai",
      "giá trị lớn nhất trên đoạn",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-13",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho parabol $(P): y=x^2-6x+8$ (đồ thị như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Đỉnh của $(P)$ là $I(3;-1)$"
      },
      {
        "key": "b",
        "text": "Trục đối xứng của $(P)$ là $x=3$"
      },
      {
        "key": "c",
        "text": "$(P)$ cắt trục $Ox$ tại hai điểm phân biệt"
      },
      {
        "key": "d",
        "text": "$(P)$ có giá trị lớn nhất bằng $-1$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) $x=3$, $y=9-18+8=-1$ — đúng. b) $x=-\\dfrac{-6}{2}=3$ — đúng. c) $\\Delta=36-32=4>0$ — đúng. d) Parabol hướng lên nên có giá trị nhỏ nhất $-1$, không có GTLN — sai.",
    "points": 1,
    "tags": [
      "hàm bậc hai",
      "khảo sát parabol",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^2-6x+8"
      ],
      "xMin": -1,
      "xMax": 7,
      "yMin": -3,
      "yMax": 8,
      "labels": true
    }
  },
  {
    "id": "thpt-t10-hambac2-14",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $f(x)=x^2-4x$ có bảng xét dấu như hình. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$f(x)>0$ trên khoảng $(-\\infty;0)$"
      },
      {
        "key": "b",
        "text": "$f(x)<0$ trên khoảng $(0;4)$"
      },
      {
        "key": "c",
        "text": "$f(x)=0$ tại $x=0$ và $x=-4$"
      },
      {
        "key": "d",
        "text": "$f(-1)=5$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Bảng xét dấu cho $f(x)>0$ khi $x<0$ — đúng. b) $f(x)<0$ khi $0<x<4$ — đúng. c) Nghiệm là $x=0$ và $x=4$, không phải $-4$ — sai. d) $f(-1)=1+4=5$ — đúng.",
    "points": 1,
    "tags": [
      "hàm bậc hai",
      "bảng xét dấu",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "signtable",
      "expr": "x^2-4x"
    }
  },
  {
    "id": "thpt-t10-hambac2-15",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Xét bất phương trình $x^2-x-2 \\ge 0$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$x=2$ là một nghiệm"
      },
      {
        "key": "b",
        "text": "$x=0$ là một nghiệm"
      },
      {
        "key": "c",
        "text": "Tập nghiệm là $(-\\infty;-1] \\cup [2;+\\infty)$"
      },
      {
        "key": "d",
        "text": "$x=-1$ là một nghiệm"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) $4-2-2=0 \\ge 0$ — đúng. b) $-2 \\ge 0$ sai — sai. c) $(x-2)(x+1) \\ge 0 \\Leftrightarrow x \\le -1$ hoặc $x \\ge 2$ — đúng. d) $1+1-2=0 \\ge 0$ — đúng.",
    "points": 1,
    "tags": [
      "hàm bậc hai",
      "bất phương trình bậc hai",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-16",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Xét phương trình $x^4-5x^2+4=0$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Đặt $t=x^2$ với điều kiện $t \\ge 0$ thì phương trình trở thành $t^2-5t+4=0$"
      },
      {
        "key": "b",
        "text": "Phương trình có đúng hai nghiệm phân biệt"
      },
      {
        "key": "c",
        "text": "$x=1$ là một nghiệm"
      },
      {
        "key": "d",
        "text": "$x=-4$ là một nghiệm"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) $t=1$ hoặc $t=4$ cho $x=\\pm 1, \\pm 2$: 4 nghiệm — sai. c) $1-5+4=0$ — đúng. d) $256-80+4 \\ne 0$ — sai.",
    "points": 1,
    "tags": [
      "phương trình bậc hai",
      "trùng phương",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-17",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Một quả bóng được ném lên cao, độ cao $h$ (mét) theo thời gian $t$ (giây) là $h(t)=-5t^2+20t+1$ (đồ thị như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Độ cao lúc bắt đầu ném là 1 m"
      },
      {
        "key": "b",
        "text": "Bóng chạm đất sau đúng 2 giây"
      },
      {
        "key": "c",
        "text": "Độ cao lớn nhất đạt được là 21 m"
      },
      {
        "key": "d",
        "text": "Bóng chạm đất sau khoảng 4,05 giây"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) $h(0)=1$ — đúng. b) $h(2)=21>0$, bóng chưa chạm đất — sai. c) Đỉnh tại $t=2$: $h(2)=21$ — đúng. d) $-5t^2+20t+1=0 \\Leftrightarrow t=\\dfrac{20+\\sqrt{420}}{10} \\approx 4{,}05$ — đúng.",
    "points": 1,
    "tags": [
      "hàm bậc hai",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "-5x^2+20x+1"
      ],
      "xMin": 0,
      "xMax": 4.2,
      "yMin": -2,
      "yMax": 23,
      "labels": true
    }
  },
  {
    "id": "thpt-t10-hambac2-18",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho parabol $(P): y=x^2+2x+m$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Nếu $m=3$ thì $(P)$ cắt trục $Ox$ tại hai điểm phân biệt"
      },
      {
        "key": "b",
        "text": "Nếu $m=0$ thì $(P)$ cắt trục $Ox$ tại hai điểm phân biệt"
      },
      {
        "key": "c",
        "text": "Nếu $m=1$ thì $(P)$ tiếp xúc trục $Ox$"
      },
      {
        "key": "d",
        "text": "Nếu $m=-1$ thì phương trình $x^2+2x+m=0$ có hai nghiệm trái dấu"
      }
    ],
    "answer": "SĐĐĐ",
    "explanation": "a) $\\Delta=4-12<0$ nên không cắt — sai. b) $x^2+2x=0 \\Leftrightarrow x=0$ hoặc $x=-2$ — đúng. c) $\\Delta=4-4=0$ — đúng. d) Tích hai nghiệm $m=-1<0$ nên trái dấu — đúng.",
    "points": 1,
    "tags": [
      "hàm bậc hai",
      "tham số",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-19",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tìm giá trị nhỏ nhất của hàm số $y=x^2-4x+5$.",
    "answer": "1",
    "explanation": "$y=(x-2)^2+1 \\ge 1$, dấu bằng khi $x=2$. GTNN $=1$.",
    "points": 0.5,
    "tags": [
      "hàm bậc hai",
      "giá trị nhỏ nhất",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-20",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Có bao nhiêu giá trị nguyên của $m$ thuộc đoạn $[-5;5]$ để phương trình $x^2-2x+m=0$ vô nghiệm?",
    "answer": "4",
    "explanation": "Vô nghiệm khi $\\Delta=4-4m<0 \\Leftrightarrow m>1$: $m \\in \\{2;3;4;5\\}$: 4 giá trị.",
    "points": 0.5,
    "tags": [
      "phương trình bậc hai",
      "tham số",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-21",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho parabol $y=-x^2+2x$. Tính tổng hoành độ và tung độ của đỉnh parabol.",
    "answer": "2",
    "explanation": "Đỉnh $I(1;1)$ nên tổng là $1+1=2$.",
    "points": 0.5,
    "tags": [
      "hàm bậc hai",
      "đỉnh parabol",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-22",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Bất phương trình $x^2 \\le 9$ có bao nhiêu nghiệm nguyên?",
    "answer": "7",
    "explanation": "$-3 \\le x \\le 3$ nên $x \\in \\{-3;-2;-1;0;1;2;3\\}$: 7 nghiệm.",
    "points": 0.5,
    "tags": [
      "hàm bậc hai",
      "bất phương trình bậc hai",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-23",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Đường thẳng $y=2x+1$ cắt parabol $y=x^2$ tại hai điểm. Tính hoành độ giao điểm có hoành độ dương (làm tròn đến hàng phần mười).",
    "answer": "2,4",
    "explanation": "$x^2-2x-1=0 \\Leftrightarrow x=1 \\pm \\sqrt{2}$. Nghiệm dương $1+\\sqrt{2} \\approx 2{,}4$.",
    "points": 0.5,
    "tags": [
      "hàm bậc hai",
      "giao điểm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-24",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tìm GTLN của hàm số $y=-x^2+6x-5$ trên đoạn $[0;4]$.",
    "answer": "4",
    "explanation": "Đỉnh $x=3 \\in [0;4]$ với $y=-9+18-5=4$; so $y(4)=3$. GTLN $=4$.",
    "points": 0.5,
    "tags": [
      "hàm bậc hai",
      "giá trị lớn nhất trên đoạn",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hambac2-25",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Có bao nhiêu giá trị nguyên của $m$ để hàm số $y=x^2+(m-1)x+1$ dương với mọi $x$?",
    "answer": "3",
    "explanation": "Cần $\\Delta=(m-1)^2-4<0 \\Leftrightarrow -1<m<3$: $m \\in \\{0;1;2\\}$: 3 giá trị.",
    "points": 0.5,
    "tags": [
      "hàm bậc hai",
      "tham số",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-01",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $\\sin 30^\\circ$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{\\sqrt{2}}{2}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{\\sqrt{3}}{2}$"
      },
      {
        "key": "C",
        "text": "$1$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{2}$"
      }
    ],
    "answer": "D",
    "explanation": "$\\sin 30^\\circ=\\dfrac{1}{2}$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "giá trị lượng giác",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-02",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $\\tan 45^\\circ$ là",
    "options": [
      {
        "key": "A",
        "text": "$1$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{\\sqrt{2}}{2}$"
      },
      {
        "key": "D",
        "text": "$\\sqrt{3}$"
      }
    ],
    "answer": "A",
    "explanation": "$\\tan 45^\\circ=1$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "giá trị lượng giác",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-03",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $\\cos \\alpha=\\dfrac{3}{5}$ với $0^\\circ<\\alpha<90^\\circ$. Khi đó $\\tan \\alpha$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{3}{4}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{5}{4}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{5}{3}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{4}{3}$"
      }
    ],
    "answer": "D",
    "explanation": "$\\sin \\alpha=\\sqrt{1-\\dfrac{9}{25}}=\\dfrac{4}{5}$ nên $\\tan \\alpha=\\dfrac{4}{3}$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "hệ thức lượng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-04",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong tam giác $ABC$ có $a=6$, $\\widehat{A}=30^\\circ$, $\\widehat{B}=45^\\circ$. Độ dài cạnh $b$ là",
    "options": [
      {
        "key": "A",
        "text": "$6$"
      },
      {
        "key": "B",
        "text": "$6\\sqrt{2}$"
      },
      {
        "key": "C",
        "text": "$3\\sqrt{2}$"
      },
      {
        "key": "D",
        "text": "$12$"
      }
    ],
    "answer": "B",
    "explanation": "Định lí sin: $b=\\dfrac{a\\sin B}{\\sin A}=\\dfrac{6 \\cdot \\frac{\\sqrt{2}}{2}}{\\frac{1}{2}}=6\\sqrt{2}$.",
    "points": 0.25,
    "tags": [
      "giải tam giác",
      "định lí sin",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-05",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong tam giác $ABC$ có $b=3$, $c=5$, $\\widehat{A}=60^\\circ$. Độ dài cạnh $a$ là",
    "options": [
      {
        "key": "A",
        "text": "$4$"
      },
      {
        "key": "B",
        "text": "$\\sqrt{21}$"
      },
      {
        "key": "C",
        "text": "$5$"
      },
      {
        "key": "D",
        "text": "$\\sqrt{19}$"
      }
    ],
    "answer": "D",
    "explanation": "$a^2=b^2+c^2-2bc\\cos A=9+25-2 \\cdot 3 \\cdot 5 \\cdot \\dfrac{1}{2}=19$ nên $a=\\sqrt{19}$.",
    "points": 0.25,
    "tags": [
      "giải tam giác",
      "định lí côsin",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-06",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Tam giác $ABC$ có $b=6$, $c=8$ và $\\widehat{A}=30^\\circ$. Diện tích tam giác $ABC$ là",
    "options": [
      {
        "key": "A",
        "text": "$24$"
      },
      {
        "key": "B",
        "text": "$10$"
      },
      {
        "key": "C",
        "text": "$12$"
      },
      {
        "key": "D",
        "text": "$14$"
      }
    ],
    "answer": "C",
    "explanation": "$S=\\dfrac{1}{2}bc\\sin A=\\dfrac{1}{2} \\cdot 6 \\cdot 8 \\cdot \\dfrac{1}{2}=12$.",
    "points": 0.25,
    "tags": [
      "giải tam giác",
      "diện tích",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-07",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một chiếc thang dài 5 m dựa vào bức tường, tạo với mặt đất một góc $60^\\circ$ (như hình). Chiều cao điểm tựa thang trên tường (làm tròn đến hàng phần trăm) là",
    "options": [
      {
        "key": "A",
        "text": "$4{,}33$ m"
      },
      {
        "key": "B",
        "text": "$2{,}5$ m"
      },
      {
        "key": "C",
        "text": "$5$ m"
      },
      {
        "key": "D",
        "text": "$3{,}53$ m"
      }
    ],
    "answer": "A",
    "explanation": "Chiều cao $=5 \\sin 60^\\circ=5 \\cdot \\dfrac{\\sqrt{3}}{2} \\approx 4{,}33$ m.",
    "points": 0.25,
    "tags": [
      "giải tam giác",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "A(0; 0) B(0; 4,3) C(2,5; 0)\nAB, BC, AC\ntường AB\ngóc ACB \"60°\"\nkích thước BC \"5 m\"\nnhãn AB \"?\""
    }
  },
  {
    "id": "thpt-t10-hethuc-08",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Tam giác $ABC$ (vẽ như hình) có $AB=7$, $AC=8$, $\\widehat{A}=120^\\circ$. Độ dài cạnh $BC$ là",
    "options": [
      {
        "key": "A",
        "text": "$15$"
      },
      {
        "key": "B",
        "text": "$11$"
      },
      {
        "key": "C",
        "text": "$\\sqrt{113}$"
      },
      {
        "key": "D",
        "text": "$13$"
      }
    ],
    "answer": "D",
    "explanation": "$BC^2=49+64-2 \\cdot 7 \\cdot 8 \\cos 120^\\circ=113+56=169$ nên $BC=13$.",
    "points": 0.25,
    "tags": [
      "giải tam giác",
      "định lí côsin",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "A(0; 0) B(7; 0) C(-4; 6,9)\nAB, BC, CA\ngóc BAC \"120°\"\nkích thước AB \"7\"\nnhãn AC \"8\"\nnhãn BC \"?\""
    }
  },
  {
    "id": "thpt-t10-hethuc-09",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $\\sin 150^\\circ$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{\\sqrt{3}}{2}$"
      },
      {
        "key": "B",
        "text": "$-\\dfrac{1}{2}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{\\sqrt{2}}{2}$"
      }
    ],
    "answer": "C",
    "explanation": "$\\sin 150^\\circ=\\sin(180^\\circ-150^\\circ)=\\sin 30^\\circ=\\dfrac{1}{2}$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "góc tù",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-10",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Tam giác $ABC$ vuông tại $A$ có $AB=3$, $AC=4$. Khi đó $\\cos B$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{4}{5}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{3}{5}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{5}{3}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{5}{4}$"
      }
    ],
    "answer": "B",
    "explanation": "$BC=5$ (Pythagoras). $\\cos B=\\dfrac{AB}{BC}=\\dfrac{3}{5}$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "tam giác vuông",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-11",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Để đo khoảng cách $AB$ giữa hai điểm nằm hai bên một khúc sông (hình vẽ), người ta chọn điểm $C$ nhìn thấy cả $A$ và $B$, đo được $CA=100$ m, $CB=140$ m và $\\widehat{ACB}=45^\\circ$. Khoảng cách $AB$ (làm tròn đến hàng mét) là",
    "options": [
      {
        "key": "A",
        "text": "$89$ m"
      },
      {
        "key": "B",
        "text": "$99$ m"
      },
      {
        "key": "C",
        "text": "$109$ m"
      },
      {
        "key": "D",
        "text": "$119$ m"
      }
    ],
    "answer": "B",
    "explanation": "$AB^2=100^2+140^2-2 \\cdot 100 \\cdot 140 \\cos 45^\\circ=29600-14000\\sqrt{2} \\approx 9801$ nên $AB \\approx 99$ m.",
    "points": 0.25,
    "tags": [
      "giải tam giác",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "C(0; 0) A(100; 0) B(99; 99)\nCA, CB, AB\ngóc ACB \"45°\"\nkích thước CA \"100 m\"\nkích thước CB \"140 m\"\nnhãn AB \"?\""
    }
  },
  {
    "id": "thpt-t10-hethuc-12",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Tam giác $ABC$ có $a=2$, $b=3$, $\\widehat{C}=60^\\circ$. Diện tích tam giác $ABC$ là",
    "options": [
      {
        "key": "A",
        "text": "$3\\sqrt{3}$"
      },
      {
        "key": "B",
        "text": "$6\\sqrt{3}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{3\\sqrt{3}}{2}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{9\\sqrt{3}}{2}$"
      }
    ],
    "answer": "C",
    "explanation": "$S=\\dfrac{1}{2}ab\\sin C=\\dfrac{1}{2} \\cdot 2 \\cdot 3 \\cdot \\dfrac{\\sqrt{3}}{2}=\\dfrac{3\\sqrt{3}}{2}$.",
    "points": 0.25,
    "tags": [
      "giải tam giác",
      "diện tích",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-13",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho góc $\\alpha=45^\\circ$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$\\sin \\alpha=\\dfrac{\\sqrt{2}}{2}$"
      },
      {
        "key": "b",
        "text": "$\\cos \\alpha=\\dfrac{1}{2}$"
      },
      {
        "key": "c",
        "text": "$\\tan \\alpha=1$"
      },
      {
        "key": "d",
        "text": "$\\sin^2 \\alpha+\\cos^2 \\alpha=2$"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) $\\cos 45^\\circ=\\dfrac{\\sqrt{2}}{2}$ — sai. c) Đúng. d) Tổng bằng 1 với mọi góc — sai.",
    "points": 1,
    "tags": [
      "lượng giác",
      "hệ thức lượng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-14",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Tam giác $ABC$ (vẽ như hình) có $AB=5$, $AC=7$, $\\widehat{A}=60^\\circ$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$BC=6$"
      },
      {
        "key": "b",
        "text": "Diện tích tam giác $ABC$ bằng $\\dfrac{35\\sqrt{3}}{4}$"
      },
      {
        "key": "c",
        "text": "$BC>AB$"
      },
      {
        "key": "d",
        "text": "$\\widehat{A}$ là góc lớn nhất của tam giác"
      }
    ],
    "answer": "SĐĐS",
    "explanation": "a) $BC^2=25+49-35=39$ nên $BC=\\sqrt{39} \\approx 6{,}24 \\ne 6$ — sai. b) $S=\\dfrac{1}{2} \\cdot 5 \\cdot 7 \\cdot \\dfrac{\\sqrt{3}}{2}=\\dfrac{35\\sqrt{3}}{4}$ — đúng. c) $\\sqrt{39}>5$ — đúng. d) Cạnh lớn nhất là $AC=7$ nên góc lớn nhất là $\\widehat{B}$ — sai.",
    "points": 1,
    "tags": [
      "giải tam giác",
      "định lí côsin",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "A(0; 0) B(5; 0) C(3,5; 6,1)\nAB, BC, CA\ngóc BAC \"60°\"\nkích thước AB \"5\"\nnhãn AC \"7\"\nnhãn BC \"?\""
    }
  },
  {
    "id": "thpt-t10-hethuc-15",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho tam giác $ABC$ có bán kính đường tròn ngoại tiếp $R$. Xét tính đúng sai theo định lí sin:",
    "options": [
      {
        "key": "a",
        "text": "$\\dfrac{a}{\\sin A}=\\dfrac{b}{\\sin B}$"
      },
      {
        "key": "b",
        "text": "Nếu $\\widehat{A}=30^\\circ$, $a=4$ thì $2R=8$"
      },
      {
        "key": "c",
        "text": "Nếu $\\widehat{B}=45^\\circ$, $b=\\sqrt{2}$ thì $R=1$"
      },
      {
        "key": "d",
        "text": "$b=2R \\cos B$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng theo định lí sin. b) $\\dfrac{a}{\\sin A}=\\dfrac{4}{1/2}=8=2R$ — đúng. c) $\\dfrac{\\sqrt{2}}{\\sqrt{2}/2}=2=2R$ nên $R=1$ — đúng. d) Đúng là $b=2R\\sin B$ — sai.",
    "points": 1,
    "tags": [
      "giải tam giác",
      "định lí sin",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-16",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Một cột đèn cao 6 m đổ bóng dài 8 m trên mặt đất (như hình). Gọi $\\alpha$ là góc chiếu của Mặt Trời so với mặt đất. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$\\tan \\alpha=\\dfrac{3}{4}$"
      },
      {
        "key": "b",
        "text": "$\\alpha>45^\\circ$"
      },
      {
        "key": "c",
        "text": "Khoảng cách từ đỉnh cột đến đầu bóng là 10 m"
      },
      {
        "key": "d",
        "text": "$\\sin \\alpha=\\dfrac{4}{5}$"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) $\\tan \\alpha=\\dfrac{6}{8}=\\dfrac{3}{4}$ — đúng. b) $\\tan \\alpha<1$ nên $\\alpha<45^\\circ$ — sai. c) $\\sqrt{6^2+8^2}=10$ — đúng. d) $\\sin \\alpha=\\dfrac{6}{10}=\\dfrac{3}{5}$ — sai.",
    "points": 1,
    "tags": [
      "giải tam giác",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "A(0; 0) B(8; 0) C(0; 6)\nAB, BC, CA\nvuông BAC\nkích thước CA \"6 m\"\nnhãn AB \"8 m\"\nnhãn BC \"?\"\nđất AB"
    }
  },
  {
    "id": "thpt-t10-hethuc-17",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Tam giác $ABC$ có $a=5$, $b=7$, $\\widehat{C}=120^\\circ$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$c=\\sqrt{109}$"
      },
      {
        "key": "b",
        "text": "Diện tích tam giác bằng $\\dfrac{35\\sqrt{3}}{4}$"
      },
      {
        "key": "c",
        "text": "$c<10$"
      },
      {
        "key": "d",
        "text": "Tam giác $ABC$ là tam giác tù"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $c^2=25+49-2 \\cdot 35 \\cos 120^\\circ=74+35=109$ — đúng. b) $S=\\dfrac{1}{2} \\cdot 5 \\cdot 7 \\cdot \\dfrac{\\sqrt{3}}{2}=\\dfrac{35\\sqrt{3}}{4}$ — đúng. c) $c=\\sqrt{109} \\approx 10{,}44>10$ — sai. d) Có góc $120^\\circ>90^\\circ$ — đúng.",
    "points": 1,
    "tags": [
      "giải tam giác",
      "định lí côsin",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-18",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về giá trị lượng giác của các góc đặc biệt:",
    "options": [
      {
        "key": "a",
        "text": "$\\sin 90^\\circ=1$"
      },
      {
        "key": "b",
        "text": "$\\cos 90^\\circ=1$"
      },
      {
        "key": "c",
        "text": "$\\sin 120^\\circ=\\dfrac{\\sqrt{3}}{2}$"
      },
      {
        "key": "d",
        "text": "$\\cos 120^\\circ=-\\dfrac{1}{2}$"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đúng. b) $\\cos 90^\\circ=0$ — sai. c) $\\sin 120^\\circ=\\sin 60^\\circ=\\dfrac{\\sqrt{3}}{2}$ — đúng. d) $\\cos 120^\\circ=-\\cos 60^\\circ=-\\dfrac{1}{2}$ — đúng.",
    "points": 1,
    "tags": [
      "lượng giác",
      "góc đặc biệt",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-19",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong tam giác $ABC$ có $a=8$, $\\widehat{B}=60^\\circ$, $\\widehat{C}=45^\\circ$. Tính độ dài cạnh $b$ (làm tròn đến hàng phần mười).",
    "answer": "7,2",
    "explanation": "$\\widehat{A}=75^\\circ$, $b=\\dfrac{8\\sin 60^\\circ}{\\sin 75^\\circ} \\approx \\dfrac{6{,}93}{0{,}966} \\approx 7{,}2$.",
    "points": 0.5,
    "tags": [
      "giải tam giác",
      "định lí sin",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-20",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\tan 135^\\circ$.",
    "answer": "-1",
    "explanation": "$\\tan 135^\\circ=\\tan(180^\\circ-45^\\circ)=-\\tan 45^\\circ=-1$.",
    "points": 0.5,
    "tags": [
      "lượng giác",
      "góc tù",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-21",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tam giác $ABC$ (vẽ như hình) có $AB=6$, $AC=10$, $\\widehat{A}=150^\\circ$. Tính diện tích tam giác $ABC$.",
    "answer": "15",
    "explanation": "$S=\\dfrac{1}{2} \\cdot 6 \\cdot 10 \\cdot \\sin 150^\\circ=30 \\cdot \\dfrac{1}{2}=15$.",
    "points": 0.5,
    "tags": [
      "giải tam giác",
      "diện tích",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "A(0; 0) B(6; 0) C(-8,7; 5)\nAB, BC, CA\ngóc BAC \"150°\"\nkích thước AB \"6\"\nnhãn AC \"10\""
    }
  },
  {
    "id": "thpt-t10-hethuc-22",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tam giác $ABC$ vuông tại $A$ có $AB=5$, $AC=12$. Tính bán kính đường tròn ngoại tiếp tam giác $ABC$.",
    "answer": "6,5",
    "explanation": "Bán kính đường tròn ngoại tiếp tam giác vuông bằng nửa cạnh huyền $=\\dfrac{13}{2}=6{,}5$.",
    "points": 0.5,
    "tags": [
      "giải tam giác",
      "đường tròn ngoại tiếp",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-23",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một chiếc thang dài 4 m nghiêng một góc $75^\\circ$ so với mặt đất (như hình). Tính chiều cao điểm tựa trên tường (làm tròn đến hàng phần mười).",
    "answer": "3,9",
    "explanation": "Chiều cao $=4\\sin 75^\\circ \\approx 4 \\cdot 0{,}966 \\approx 3{,}9$ m.",
    "points": 0.5,
    "tags": [
      "giải tam giác",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "A(0; 0) B(1; 0) C(0; 3,9)\nAB, BC, CA\ntường AB\ngóc ABC \"75°\"\nkích thước BC \"4 m\"\nnhãn AC \"?\""
    }
  },
  {
    "id": "thpt-t10-hethuc-24",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tam giác $ABC$ có $b=4$, $c=5$, $\\widehat{A}=60^\\circ$. Tính $a^2$.",
    "answer": "21",
    "explanation": "$a^2=16+25-2 \\cdot 4 \\cdot 5 \\cdot \\dfrac{1}{2}=41-20=21$.",
    "points": 0.5,
    "tags": [
      "giải tam giác",
      "định lí côsin",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-hethuc-25",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Từ vị trí $A$ trên mặt đất người ta thấy đỉnh một tháp dưới một góc $30^\\circ$. Đi về phía tháp thêm 20 m đến vị trí $B$ (thẳng hàng với $A$ và chân tháp) thì thấy đỉnh tháp dưới góc $60^\\circ$. Tính chiều cao tháp (làm tròn đến hàng phần mười).",
    "answer": "17,3",
    "explanation": "$h(\\cot 30^\\circ-\\cot 60^\\circ)=20 \\Rightarrow h \\cdot \\dfrac{2\\sqrt{3}}{3}=20 \\Rightarrow h=10\\sqrt{3} \\approx 17{,}3$ m.",
    "points": 0.5,
    "tags": [
      "giải tam giác",
      "bài toán thực tế",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-01",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Khoảng cách từ điểm $A(1;2)$ đến gốc toạ độ $O$ là",
    "options": [
      {
        "key": "A",
        "text": "$3$"
      },
      {
        "key": "B",
        "text": "$\\sqrt{5}$"
      },
      {
        "key": "C",
        "text": "$5$"
      },
      {
        "key": "D",
        "text": "$\\sqrt{3}$"
      }
    ],
    "answer": "B",
    "explanation": "$OA=\\sqrt{1^2+2^2}=\\sqrt{5}$.",
    "points": 0.25,
    "tags": [
      "toạ độ",
      "khoảng cách",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-02",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Đường thẳng đi qua điểm $M(0;2)$ và có hệ số góc $-1$ có phương trình",
    "options": [
      {
        "key": "A",
        "text": "$y=x+2$"
      },
      {
        "key": "B",
        "text": "$y=x-2$"
      },
      {
        "key": "C",
        "text": "$y=-x+2$"
      },
      {
        "key": "D",
        "text": "$y=-x-2$"
      }
    ],
    "answer": "C",
    "explanation": "$y=kx+b$ với $k=-1$, $b=2$ (đi qua $(0;2)$): $y=-x+2$.",
    "points": 0.25,
    "tags": [
      "toạ độ",
      "phương trình đường thẳng",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-03",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Hệ số góc của đường thẳng $d: 3x-4y+12=0$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{4}{3}$"
      },
      {
        "key": "B",
        "text": "$-\\dfrac{3}{4}$"
      },
      {
        "key": "C",
        "text": "$-\\dfrac{4}{3}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{3}{4}$"
      }
    ],
    "answer": "D",
    "explanation": "$-4y=-3x-12 \\Leftrightarrow y=\\dfrac{3}{4}x+3$ nên hệ số góc $\\dfrac{3}{4}$.",
    "points": 0.25,
    "tags": [
      "toạ độ",
      "hệ số góc",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-04",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Khoảng cách từ điểm $M(2;3)$ đến đường thẳng $d: 2x+y-4=0$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{3\\sqrt{5}}{5}$"
      },
      {
        "key": "B",
        "text": "$\\sqrt{5}$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{\\sqrt{5}}{5}$"
      }
    ],
    "answer": "A",
    "explanation": "$d(M,d)=\\dfrac{|2 \\cdot 2+3-4|}{\\sqrt{4+1}}=\\dfrac{3}{\\sqrt{5}}=\\dfrac{3\\sqrt{5}}{5}$.",
    "points": 0.25,
    "tags": [
      "toạ độ",
      "khoảng cách",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-05",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Đường tròn $(x-1)^2+(y+2)^2=9$ có bán kính bằng",
    "options": [
      {
        "key": "A",
        "text": "$9$"
      },
      {
        "key": "B",
        "text": "$\\sqrt{3}$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$6$"
      }
    ],
    "answer": "C",
    "explanation": "Bán kính $R=\\sqrt{9}=3$.",
    "points": 0.25,
    "tags": [
      "toạ độ",
      "đường tròn",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-06",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Viết phương trình đường tròn có tâm $I(2;-1)$ và đi qua gốc toạ độ $O$.",
    "options": [
      {
        "key": "A",
        "text": "$(x-2)^2+(y+1)^2=25$"
      },
      {
        "key": "B",
        "text": "$(x-2)^2+(y+1)^2=\\sqrt{5}$"
      },
      {
        "key": "C",
        "text": "$(x+2)^2+(y-1)^2=5$"
      },
      {
        "key": "D",
        "text": "$(x-2)^2+(y+1)^2=5$"
      }
    ],
    "answer": "D",
    "explanation": "$R=|OI|=\\sqrt{4+1}=\\sqrt{5}$ nên $(x-2)^2+(y+1)^2=5$.",
    "points": 0.25,
    "tags": [
      "toạ độ",
      "phương trình đường tròn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-07",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho đường tròn $(C): (x-1)^2+y^2=4$ và đường thẳng $d: x-y+3=0$ (như hình). Vị trí tương đối của $d$ và $(C)$ là",
    "options": [
      {
        "key": "A",
        "text": "$d$ cắt $(C)$ tại hai điểm phân biệt"
      },
      {
        "key": "B",
        "text": "$d$ tiếp xúc với $(C)$"
      },
      {
        "key": "C",
        "text": "$d$ không giao với $(C)$"
      },
      {
        "key": "D",
        "text": "$d$ đi qua tâm $(C)$"
      }
    ],
    "answer": "C",
    "explanation": "$d(I;d)=\\dfrac{|1-0+3|}{\\sqrt{2}}=2\\sqrt{2} \\approx 2{,}83>2=R$ nên $d$ không giao $(C)$.",
    "points": 0.25,
    "tags": [
      "toạ độ",
      "vị trí tương đối",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -5,
      "xMax": 4,
      "yMin": -3,
      "yMax": 4,
      "grid": true,
      "items": "đường tròn (1; 0) 2\nd: x - y + 3 = 0"
    }
  },
  {
    "id": "thpt-t10-oxy-08",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Góc giữa hai đường thẳng $d_1: y=2x+1$ và $d_2: y=-x+3$ (làm tròn đến hàng phần mười độ) là",
    "options": [
      {
        "key": "A",
        "text": "$45^\\circ$"
      },
      {
        "key": "B",
        "text": "$60^\\circ$"
      },
      {
        "key": "C",
        "text": "$71{,}6^\\circ$"
      },
      {
        "key": "D",
        "text": "$30^\\circ$"
      }
    ],
    "answer": "C",
    "explanation": "$\\tan \\varphi=\\left|\\dfrac{2-(-1)}{1+2(-1)}\\right|=3$ nên $\\varphi=\\arctan 3 \\approx 71{,}6^\\circ$.",
    "points": 0.25,
    "tags": [
      "toạ độ",
      "góc giữa hai đường thẳng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-09",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Đường thẳng đi qua hai điểm $A(1;2)$, $B(3;6)$ có phương trình",
    "options": [
      {
        "key": "A",
        "text": "$y=2x+1$"
      },
      {
        "key": "B",
        "text": "$y=2x$"
      },
      {
        "key": "C",
        "text": "$y=x+2$"
      },
      {
        "key": "D",
        "text": "$y=2x-2$"
      }
    ],
    "answer": "B",
    "explanation": "Hệ số góc $\\dfrac{6-2}{3-1}=2$; thay $A$: $y=2x$.",
    "points": 0.25,
    "tags": [
      "toạ độ",
      "phương trình đường thẳng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-10",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho elip $\\dfrac{x^2}{25}+\\dfrac{y^2}{16}=1$. Tiêu cự của elip là",
    "options": [
      {
        "key": "A",
        "text": "$6$"
      },
      {
        "key": "B",
        "text": "$3$"
      },
      {
        "key": "C",
        "text": "$\\sqrt{41}$"
      },
      {
        "key": "D",
        "text": "$2$"
      }
    ],
    "answer": "A",
    "explanation": "$c^2=a^2-b^2=25-16=9$ nên $c=3$, tiêu cự $2c=6$.",
    "points": 0.25,
    "tags": [
      "toạ độ",
      "elip",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-11",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Đường tròn trong hình có tâm $I(0;1)$ và đi qua điểm $M(2;1)$. Phương trình của đường tròn là",
    "options": [
      {
        "key": "A",
        "text": "$x^2+(y-1)^2=2$"
      },
      {
        "key": "B",
        "text": "$x^2+(y-1)^2=4$"
      },
      {
        "key": "C",
        "text": "$x^2+(y+1)^2=4$"
      },
      {
        "key": "D",
        "text": "$(x-2)^2+y^2=4$"
      }
    ],
    "answer": "B",
    "explanation": "$R=IM=2$ nên $x^2+(y-1)^2=4$.",
    "points": 0.25,
    "tags": [
      "toạ độ",
      "phương trình đường tròn",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -3,
      "xMax": 3,
      "yMin": -2,
      "yMax": 4,
      "grid": true,
      "items": "đường tròn (0; 1) 2\nM(2; 1)"
    }
  },
  {
    "id": "thpt-t10-oxy-12",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho tam giác $ABC$ với $A(1;1)$, $B(4;5)$, $C(5;-1)$. Phương trình đường cao kẻ từ $A$ là",
    "options": [
      {
        "key": "A",
        "text": "$x-6y+5=0$"
      },
      {
        "key": "B",
        "text": "$6x-y-5=0$"
      },
      {
        "key": "C",
        "text": "$x+6y-5=0$"
      },
      {
        "key": "D",
        "text": "$6x+y-5=0$"
      }
    ],
    "answer": "A",
    "explanation": "$\\overrightarrow{BC}=(1;-6)$ nên đường cao qua $A$ có VTPT $\\overrightarrow{BC}$: $1(x-1)-6(y-1)=0 \\Leftrightarrow x-6y+5=0$.",
    "points": 0.25,
    "tags": [
      "toạ độ",
      "đường cao",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-13",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho hai điểm $A(-1;2)$, $B(3;-4)$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$\\overrightarrow{AB}=(4;-6)$"
      },
      {
        "key": "b",
        "text": "$|\\overrightarrow{AB}|=2\\sqrt{13}$"
      },
      {
        "key": "c",
        "text": "Trung điểm của $AB$ là $M(1;-1)$"
      },
      {
        "key": "d",
        "text": "$|\\overrightarrow{AB}|=52$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) $(3+1;-4-2)=(4;-6)$ — đúng. b) $\\sqrt{16+36}=\\sqrt{52}=2\\sqrt{13}$ — đúng. c) $\\left(\\dfrac{-1+3}{2};\\dfrac{2-4}{2}\\right)=(1;-1)$ — đúng. d) Độ dài là $\\sqrt{52}$ — sai.",
    "points": 1,
    "tags": [
      "toạ độ",
      "vectơ và khoảng cách",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-14",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho đường tròn $(C): x^2+y^2=4$ và đường thẳng $d: 3x+4y-10=0$ (như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$d$ cắt $(C)$ tại hai điểm phân biệt"
      },
      {
        "key": "b",
        "text": "Khoảng cách từ $I(0;0)$ đến $d$ bằng $2$"
      },
      {
        "key": "c",
        "text": "$d$ tiếp xúc với $(C)$"
      },
      {
        "key": "d",
        "text": "Toạ độ tiếp điểm là $\\left(\\dfrac{6}{5};\\dfrac{8}{5}\\right)$"
      }
    ],
    "answer": "SĐĐĐ",
    "explanation": "a) $d(I;d)=\\dfrac{10}{5}=2=R$ nên $d$ tiếp xúc, không cắt tại hai điểm — sai. b) Đúng. c) Đúng vì khoảng cách bằng bán kính. d) Hình chiếu vuông góc của $I$ lên $d$: $\\left(-\\dfrac{3 \\cdot (-10)}{25};-\\dfrac{4 \\cdot (-10)}{25}\\right)=\\left(\\dfrac{6}{5};\\dfrac{8}{5}\\right)$ — đúng.",
    "points": 1,
    "tags": [
      "toạ độ",
      "tiếp xúc",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -3,
      "xMax": 4,
      "yMin": -3,
      "yMax": 3,
      "grid": true,
      "items": "đường tròn (0; 0) 2\nd: 3x + 4y - 10 = 0"
    }
  },
  {
    "id": "thpt-t10-oxy-15",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho đường thẳng $d: 2x-y+4=0$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$d$ có hệ số góc bằng $2$"
      },
      {
        "key": "b",
        "text": "$d$ có hệ số góc bằng $-2$"
      },
      {
        "key": "c",
        "text": "$d$ đi qua điểm $(1;6)$"
      },
      {
        "key": "d",
        "text": "$d$ đi qua điểm $(-2;0)$"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) $y=2x+4$ — đúng. b) Sai. c) $2-6+4=0$ — đúng. d) $-4-0+4=0$ — đúng.",
    "points": 1,
    "tags": [
      "toạ độ",
      "phương trình đường thẳng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-16",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho đường tròn $(C): (x+1)^2+(y-2)^2=16$ (vẽ như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Tâm của $(C)$ là $I(-1;2)$"
      },
      {
        "key": "b",
        "text": "Bán kính của $(C)$ bằng $4$"
      },
      {
        "key": "c",
        "text": "$(C)$ đi qua gốc toạ độ $O$"
      },
      {
        "key": "d",
        "text": "$(C)$ cắt trục $Oy$ tại hai điểm phân biệt"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a), b) Đúng theo phương trình. c) $(0+1)^2+(0-2)^2=5 \\ne 16$ — sai. d) $d(I;Oy)=1<4$ — đúng.",
    "points": 1,
    "tags": [
      "toạ độ",
      "đường tròn",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -6,
      "xMax": 4,
      "yMin": -3,
      "yMax": 7,
      "grid": true,
      "items": "đường tròn (-1; 2) 4"
    }
  },
  {
    "id": "thpt-t10-oxy-17",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho tam giác $ABC$ với $A(1;2)$, $B(-1;3)$, $C(2;-1)$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$|\\overrightarrow{BC}|=5$"
      },
      {
        "key": "b",
        "text": "Tam giác $ABC$ vuông tại $A$"
      },
      {
        "key": "c",
        "text": "Trọng tâm của tam giác là $G\\left(\\dfrac{2}{3};\\dfrac{4}{3}\\right)$"
      },
      {
        "key": "d",
        "text": "Diện tích tam giác $ABC$ bằng $\\dfrac{5}{2}$"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) $\\overrightarrow{BC}=(3;-4)$, độ dài $5$ — đúng. b) $\\overrightarrow{AB} \\cdot \\overrightarrow{AC}=(-2)(1)+(1)(-3)=-5 \\ne 0$ — sai. c) $\\left(\\dfrac{1-1+2}{3};\\dfrac{2+3-1}{3}\\right)=\\left(\\dfrac{2}{3};\\dfrac{4}{3}\\right)$ — đúng. d) Diện tích $=\\dfrac{|(-2)(-3)-(1)(1)|}{2}=\\dfrac{5}{2}$ — đúng.",
    "points": 1,
    "tags": [
      "toạ độ",
      "tam giác",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-18",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho parabol $(P): y=x^2-2x-3$ và đường thẳng $d: y=2x+3$ (vẽ như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$d$ cắt $(P)$ tại hai điểm phân biệt"
      },
      {
        "key": "b",
        "text": "Hai giao điểm có hoành độ dương"
      },
      {
        "key": "c",
        "text": "Tổng hai hoành độ giao điểm bằng $4$"
      },
      {
        "key": "d",
        "text": "Tích hai hoành độ giao điểm bằng $-6$"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) $x^2-4x-6=0$ có $\\Delta=40>0$ — đúng. b) $x=2 \\pm \\sqrt{10}$, một nghiệm âm — sai. c) Theo Vi-ét tổng $=4$ — đúng. d) Tích $=-6$ — đúng.",
    "points": 1,
    "tags": [
      "toạ độ",
      "giao điểm",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -3,
      "xMax": 5,
      "yMin": -6,
      "yMax": 8,
      "grid": true,
      "items": "(P): y = x^2 - 2x - 3\nd: 2x - y - 3 = 0"
    }
  },
  {
    "id": "thpt-t10-oxy-19",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính khoảng cách từ điểm $M(3;4)$ đến gốc toạ độ $O$.",
    "answer": "5",
    "explanation": "$OM=\\sqrt{9+16}=5$.",
    "points": 0.5,
    "tags": [
      "toạ độ",
      "khoảng cách",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-20",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính khoảng cách từ gốc toạ độ $O$ đến đường thẳng $d: 3x+4y-12=0$.",
    "answer": "2,4",
    "explanation": "$d(O;d)=\\dfrac{|-12|}{\\sqrt{9+16}}=\\dfrac{12}{5}=2{,}4$.",
    "points": 0.5,
    "tags": [
      "toạ độ",
      "khoảng cách",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-21",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính bán kính của đường tròn $(C): x^2+y^2-2x+4y-4=0$.",
    "answer": "3",
    "explanation": "Tâm $(1;-2)$, $R=\\sqrt{1+4+4}=\\sqrt{9}=3$.",
    "points": 0.5,
    "tags": [
      "toạ độ",
      "đường tròn",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-22",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Với giá trị dương nào của $m$ thì đường thẳng $d: x+y+m=0$ tiếp xúc với đường tròn $(C): x^2+y^2=8$?",
    "answer": "4",
    "explanation": "$d(O;d)=\\dfrac{|m|}{\\sqrt{2}}=2\\sqrt{2} \\Leftrightarrow |m|=4$. Vì $m>0$ nên $m=4$.",
    "points": 0.5,
    "tags": [
      "toạ độ",
      "tiếp xúc",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-23",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính góc (làm tròn đến hàng đơn vị độ) giữa hai đường thẳng $d_1: y=x+1$ và $d_2: y=2x-3$.",
    "answer": "18",
    "explanation": "$\\tan \\varphi=\\left|\\dfrac{1-2}{1+1 \\cdot 2}\\right|=\\dfrac{1}{3}$ nên $\\varphi \\approx 18^\\circ$.",
    "points": 0.5,
    "tags": [
      "toạ độ",
      "góc giữa hai đường thẳng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-24",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho elip $\\dfrac{x^2}{36}+\\dfrac{y^2}{11}=1$. Tính tiêu cự của elip.",
    "answer": "10",
    "explanation": "$c^2=36-11=25$ nên $c=5$, tiêu cự $2c=10$.",
    "points": 0.5,
    "tags": [
      "toạ độ",
      "elip",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-oxy-25",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tam giác $ABC$ có $A(1;0)$, $B(3;4)$, $C(-1;2)$. Tính diện tích tam giác $ABC$.",
    "answer": "6",
    "explanation": "Diện tích $=\\dfrac{|(2)(2)-(4)(-2)|}{2}=\\dfrac{12}{2}=6$.",
    "points": 0.5,
    "tags": [
      "toạ độ",
      "diện tích tam giác",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-01",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho các câu sau: (I) $4+3=7$; (II) Hãy mở sách ra!; (III) $2$ là số chính phương; (IV) Bạn có khoẻ không?. Số mệnh đề trong các câu trên là",
    "options": [
      {
        "key": "A",
        "text": "$1$"
      },
      {
        "key": "B",
        "text": "$2$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$4$"
      }
    ],
    "answer": "B",
    "explanation": "(I), (III) là mệnh đề (III sai vì $2$ không chính phương); (II) là câu cầu khiến, (IV) là câu hỏi — không phải mệnh đề. Vậy có 2 mệnh đề.",
    "points": 0.25,
    "tags": [
      "mệnh đề",
      "nhận biết mệnh đề",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-02",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập hợp nào sau đây là tập con của mọi tập hợp?",
    "options": [
      {
        "key": "A",
        "text": "$\\varnothing$"
      },
      {
        "key": "B",
        "text": "$\\mathbb{N}$"
      },
      {
        "key": "C",
        "text": "$\\mathbb{Z}$"
      },
      {
        "key": "D",
        "text": "$\\mathbb{R}$"
      }
    ],
    "answer": "A",
    "explanation": "Tập rỗng không chứa phần tử nào nên là tập con của mọi tập hợp.",
    "points": 0.25,
    "tags": [
      "tập hợp",
      "tập con",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-03",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập $A=\\{x \\in \\mathbb{Z} \\mid -2 < x \\le 3\\}$ có bao nhiêu tập con?",
    "options": [
      {
        "key": "A",
        "text": "$10$"
      },
      {
        "key": "B",
        "text": "$16$"
      },
      {
        "key": "C",
        "text": "$25$"
      },
      {
        "key": "D",
        "text": "$32$"
      }
    ],
    "answer": "D",
    "explanation": "$A=\\{-1;0;1;2;3\\}$ có 5 phần tử nên có $2^5=32$ tập con.",
    "points": 0.25,
    "tags": [
      "tập hợp",
      "số tập con",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-04",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $A=(-2;3)$ và $B=[0;5]$. Khi đó $A \\cap B$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$[0;5]$"
      },
      {
        "key": "B",
        "text": "$(-2;5]$"
      },
      {
        "key": "C",
        "text": "$[0;3)$"
      },
      {
        "key": "D",
        "text": "$(0;3)$"
      }
    ],
    "answer": "C",
    "explanation": "Phần chung của $(-2;3)$ và $[0;5]$ là $[0;3)$.",
    "points": 0.25,
    "tags": [
      "tập hợp",
      "giao hai tập",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-05",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Lớp 10A có 40 học sinh. Trong đó 25 em tham gia CLB Toán, 22 em tham gia CLB Văn, 8 em tham gia cả hai CLB (minh hoạ bởi hình). Số em không tham gia CLB nào là",
    "options": [
      {
        "key": "A",
        "text": "$0$"
      },
      {
        "key": "B",
        "text": "$1$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$5$"
      }
    ],
    "answer": "B",
    "explanation": "Số em tham gia ít nhất một CLB: $25+22-8=39$. Số em không tham gia CLB nào: $40-39=1$.",
    "points": 0.25,
    "tags": [
      "tập hợp",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "venn",
      "sets": "A, B",
      "shade": "",
      "counts": "",
      "universe": true
    }
  },
  {
    "id": "thpt-t10-taphop-06",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hai tập hợp $A$, $B$ với $n(A)=12$, $n(B)=18$, $n(A \\cap B)=7$ (minh hoạ bởi hình). Số phần tử của $A \\cup B$ là",
    "options": [
      {
        "key": "A",
        "text": "$21$"
      },
      {
        "key": "B",
        "text": "$23$"
      },
      {
        "key": "C",
        "text": "$25$"
      },
      {
        "key": "D",
        "text": "$37$"
      }
    ],
    "answer": "B",
    "explanation": "$n(A \\cup B)=n(A)+n(B)-n(A \\cap B)=12+18-7=23$.",
    "points": 0.25,
    "tags": [
      "tập hợp",
      "số phần tử hợp",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "venn",
      "sets": "A, B",
      "shade": "",
      "counts": "",
      "universe": false
    }
  },
  {
    "id": "thpt-t10-taphop-07",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một quán ăn sáng có 70 khách. Kết quả thống kê đếm theo từng vùng của biểu đồ Ven (P: dùng phở, B: dùng bún, C: dùng cơm) như hình. Số khách không dùng món nào trong ba món là",
    "options": [
      {
        "key": "A",
        "text": "$3$"
      },
      {
        "key": "B",
        "text": "$4$"
      },
      {
        "key": "C",
        "text": "$5$"
      },
      {
        "key": "D",
        "text": "$6$"
      }
    ],
    "answer": "C",
    "explanation": "Số khách dùng ít nhất một món: $18+14+11+7+6+4+5=65$. Số khách không dùng món nào: $70-65=5$.",
    "points": 0.25,
    "tags": [
      "tập hợp",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "venn",
      "sets": "P, B, C",
      "shade": "",
      "counts": "P: 18\nPB: 7\nPC: 6\nB: 14\nBC: 4\nC: 11\nPBC: 5",
      "universe": true
    }
  },
  {
    "id": "thpt-t10-taphop-08",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho tập $A=\\{1;2;3;\\ldots;20\\}$. Số tập con của $A$ chứa cả phần tử $3$ và phần tử $5$ là",
    "options": [
      {
        "key": "A",
        "text": "$2^{16}$"
      },
      {
        "key": "B",
        "text": "$2^{17}$"
      },
      {
        "key": "C",
        "text": "$2^{19}$"
      },
      {
        "key": "D",
        "text": "$2^{18}$"
      }
    ],
    "answer": "D",
    "explanation": "Một tập con chứa cả $3$ và $5$ thì 18 phần tử còn lại tuỳ chọn hoặc không: $2^{18}$ tập con.",
    "points": 0.25,
    "tags": [
      "tập hợp",
      "đếm tập con",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-09",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Số phần tử của tập $A=\\{x \\in \\mathbb{R} \\mid x^2 \\le 4\\} \\cap \\mathbb{Z}$ là",
    "options": [
      {
        "key": "A",
        "text": "$3$"
      },
      {
        "key": "B",
        "text": "$4$"
      },
      {
        "key": "C",
        "text": "$6$"
      },
      {
        "key": "D",
        "text": "$5$"
      }
    ],
    "answer": "D",
    "explanation": "$x^2 \\le 4 \\Leftrightarrow -2 \\le x \\le 2$ nên $A=\\{-2;-1;0;1;2\\}$ có 5 phần tử.",
    "points": 0.25,
    "tags": [
      "tập hợp",
      "số phần tử",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-10",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hai tập hợp $A$, $B$ bất kì. Mệnh đề nào sau đây đúng?",
    "options": [
      {
        "key": "A",
        "text": "$A \\subset B \\Leftrightarrow$ mọi phần tử của $A$ đều thuộc $B$"
      },
      {
        "key": "B",
        "text": "$A \\subset B \\Leftrightarrow$ tồn tại phần tử của $A$ thuộc $B$"
      },
      {
        "key": "C",
        "text": "$A \\subset B \\Leftrightarrow$ mọi phần tử của $B$ đều thuộc $A$"
      },
      {
        "key": "D",
        "text": "$A \\subset B \\Leftrightarrow n(A) < n(B)$"
      }
    ],
    "answer": "A",
    "explanation": "Theo định nghĩa: $A \\subset B$ khi mọi phần tử của $A$ đều thuộc $B$.",
    "points": 0.25,
    "tags": [
      "tập hợp",
      "tập con",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-11",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Số phần tử của tập $A=\\{x \\in \\mathbb{N}^* \\mid x \\le 100,\\ x \\text{ chia hết cho } 3 \\text{ hoặc } 5\\}$ là",
    "options": [
      {
        "key": "A",
        "text": "$45$"
      },
      {
        "key": "B",
        "text": "$46$"
      },
      {
        "key": "C",
        "text": "$47$"
      },
      {
        "key": "D",
        "text": "$48$"
      }
    ],
    "answer": "C",
    "explanation": "Bội của 3: 33 số; bội của 5: 20 số; bội của 15: 6 số. Vậy $|A|=33+20-6=47$.",
    "points": 0.25,
    "tags": [
      "tập hợp",
      "đếm phần tử",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "venn",
      "sets": "A, B",
      "shade": "",
      "counts": "",
      "universe": false
    }
  },
  {
    "id": "thpt-t10-taphop-12",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Có bao nhiêu số tự nhiên có ba chữ số mà các chữ số đôi một khác nhau?",
    "options": [
      {
        "key": "A",
        "text": "$648$"
      },
      {
        "key": "B",
        "text": "$720$"
      },
      {
        "key": "C",
        "text": "$810$"
      },
      {
        "key": "D",
        "text": "$900$"
      }
    ],
    "answer": "A",
    "explanation": "Chữ số hàng trăm: 9 cách; hàng chục: 9 cách (khác hàng trăm); hàng đơn vị: 8 cách. Vậy $9 \\cdot 9 \\cdot 8 = 648$.",
    "points": 0.25,
    "tags": [
      "đếm phần tử",
      "quy tắc nhân",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-13",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho hai tập hợp $A=\\{-1;0;1;2\\}$ và $B=\\{0;1;2;3\\}$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$1 \\in A \\cap B$"
      },
      {
        "key": "b",
        "text": "$3 \\in A \\cup B$"
      },
      {
        "key": "c",
        "text": "$n(A \\cap B)=2$"
      },
      {
        "key": "d",
        "text": "$n(A \\cup B)=6$"
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) $A \\cap B=\\{0;1;2\\}$ chứa $1$ — đúng. b) $A \\cup B=\\{-1;0;1;2;3\\}$ chứa $3$ — đúng. c) $n(A \\cap B)=3$, không phải 2 — sai. d) $n(A \\cup B)=5$, không phải 6 — sai.",
    "points": 1,
    "tags": [
      "tập hợp",
      "giao và hợp",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-14",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Lớp 10B có 45 học sinh, trong đó 20 em thích môn Toán, 18 em thích môn Lí, 12 em thích cả hai môn (minh hoạ bởi hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Số em thích ít nhất một trong hai môn là 26"
      },
      {
        "key": "b",
        "text": "Số em chỉ thích môn Toán là 8"
      },
      {
        "key": "c",
        "text": "Số em thích đúng một trong hai môn là 26"
      },
      {
        "key": "d",
        "text": "Số em không thích môn nào là 19"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $20+18-12=26$ — đúng. b) $20-12=8$ — đúng. c) $(20-12)+(18-12)=8+6=14 \\ne 26$ — sai. d) $45-26=19$ — đúng.",
    "points": 1,
    "tags": [
      "tập hợp",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "venn",
      "sets": "T, L",
      "shade": "",
      "counts": "",
      "universe": true
    }
  },
  {
    "id": "thpt-t10-taphop-15",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho $A=[-1;3)$ và $B=(0;5)$ (vẽ như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$2 \\in A \\cap B$"
      },
      {
        "key": "b",
        "text": "$3 \\in A \\cap B$"
      },
      {
        "key": "c",
        "text": "$A \\cup B=[-1;5)$"
      },
      {
        "key": "d",
        "text": "$A \\setminus B=[-1;0]$"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) $2 \\in [-1;3) \\cap (0;5)$ — đúng. b) $3 \\notin A=[-1;3)$ — sai. c) $A \\cup B=[-1;5)$ — đúng. d) $A \\setminus B=[-1;0]$: $-1 \\in A$, $-1 \\notin B$ nên $-1$ thuộc hiệu; $0 \\in A$, $0 \\notin B$ (vì $B$ mở tại 0) nên $0$ thuộc hiệu — đúng.",
    "points": 1,
    "tags": [
      "tập hợp",
      "phép hiệu",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "numberline",
      "sets": "A = [-1; 3)\nB = (0; 5)",
      "style": "bold"
    }
  },
  {
    "id": "thpt-t10-taphop-16",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Xét mệnh đề $P$: \\\"Với mọi số tự nhiên $n$, $n^2+n+41$ là số nguyên tố\\\". Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Với $n=1$ thì $n^2+n+41=43$ là số nguyên tố"
      },
      {
        "key": "b",
        "text": "Với $n=2$ thì $n^2+n+41=47$ là số nguyên tố"
      },
      {
        "key": "c",
        "text": "Với $n=10$ thì $n^2+n+41=151$ là số nguyên tố"
      },
      {
        "key": "d",
        "text": "$P$ là mệnh đề đúng"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) $43$ nguyên tố — đúng. b) $47$ nguyên tố — đúng. c) $151$ nguyên tố — đúng. d) Với $n=40$: $40^2+40+41=1681=41^2$ không nguyên tố nên $P$ sai.",
    "points": 1,
    "tags": [
      "mệnh đề",
      "mệnh đề chứa kí hiệu",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-17",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho tập $A=\\{1;2;3;\\ldots;8\\}$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$A$ có $256$ tập con"
      },
      {
        "key": "b",
        "text": "Số tập con của $A$ chứa phần tử $1$ là $128$"
      },
      {
        "key": "c",
        "text": "Số tập con của $A$ có đúng $3$ phần tử là $56$"
      },
      {
        "key": "d",
        "text": "Số tập con của $A$ có đúng $2$ phần tử là $24$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) $2^8=256$ — đúng. b) $2^7=128$ — đúng. c) $\\dfrac{8 \\cdot 7 \\cdot 6}{3!}=56$ — đúng. d) $\\dfrac{8 \\cdot 7}{2}=28 \\ne 24$ — sai.",
    "points": 1,
    "tags": [
      "tập hợp",
      "đếm tập con",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-18",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Khảo sát 100 người về việc sử dụng ba mạng xã hội Z, F, T: 45 người dùng Z, 40 người dùng F, 35 người dùng T; 15 người dùng cả Z và F, 12 người dùng cả Z và T, 10 người dùng cả F và T, 5 người dùng cả ba. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Số người dùng ít nhất một mạng xã hội là 88"
      },
      {
        "key": "b",
        "text": "Số người dùng cả ba mạng xã hội là 5"
      },
      {
        "key": "c",
        "text": "Số người không dùng mạng xã hội nào là 10"
      },
      {
        "key": "d",
        "text": "Số người dùng đúng một mạng xã hội là 61"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $45+40+35-15-12-10+5=88$ — đúng. b) Đề cho 5 — đúng. c) $100-88=12 \\ne 10$ — sai. d) Đúng một: Z $(45-15-12+5)=23$, F $(40-15-10+5)=20$, T $(35-12-10+5)=18$, tổng $61$ — đúng.",
    "points": 1,
    "tags": [
      "tập hợp",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-19",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $A=\\{x \\in \\mathbb{N} \\mid x<20,\\ x \\text{ chia hết cho } 4\\}$ và $B=\\{x \\in \\mathbb{N} \\mid x<20,\\ x \\text{ chia hết cho } 6\\}$. Tính $n(A \\cup B)$.",
    "answer": "7",
    "explanation": "$A=\\{0;4;8;12;16\\}$, $B=\\{0;6;12;18\\}$, $A \\cap B=\\{0;12\\}$. Vậy $n(A \\cup B)=5+4-2=7$.",
    "points": 0.5,
    "tags": [
      "tập hợp",
      "số phần tử hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-20",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Có bao nhiêu tập con gồm ba phần tử của tập $\\{1;2;3;4;5;6;7\\}$ sao cho tập con đó chứa phần tử $4$?",
    "answer": "15",
    "explanation": "Phải chọn thêm 2 phần tử từ 6 phần tử còn lại: $\\dfrac{6 \\cdot 5}{2}=15$.",
    "points": 0.5,
    "tags": [
      "tập hợp",
      "đếm tập con",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-21",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Lớp 10C có 40 học sinh: 18 em giỏi Toán, 16 em giỏi Lí, 8 em giỏi cả hai môn. Hỏi có bao nhiêu em giỏi đúng một trong hai môn?",
    "answer": "18",
    "explanation": "Chỉ giỏi Toán: $18-8=10$; chỉ giỏi Lí: $16-8=8$. Tổng $10+8=18$.",
    "points": 0.5,
    "tags": [
      "tập hợp",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-22",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính số phần tử của tập $A=\\{x \\in \\mathbb{Z} \\mid 1 < x^2 < 20\\}$.",
    "answer": "6",
    "explanation": "$x^2 \\in \\{4;9;16\\}$ nên $x \\in \\{\\pm 2; \\pm 3; \\pm 4\\}$: 6 phần tử.",
    "points": 0.5,
    "tags": [
      "tập hợp",
      "số phần tử",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-23",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Có bao nhiêu số tự nhiên có ba chữ số chia hết cho 6?",
    "answer": "150",
    "explanation": "Số nhỏ nhất là 102, lớn nhất là 996. Số lượng $=\\dfrac{996-102}{6}+1=150$.",
    "points": 0.5,
    "tags": [
      "đếm phần tử",
      "chia hết",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-24",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Từ các chữ số $0;1;2;3$ lập được bao nhiêu số có ba chữ số đôi một khác nhau và chia hết cho 2?",
    "answer": "10",
    "explanation": "Chữ số cuối là $0$: $3 \\cdot 2=6$ số; chữ số cuối là $2$: hàng trăm chỉ chọn $1$ hoặc $3$ (2 cách), hàng chục còn 2 cách $\\Rightarrow 4$ số. Tổng $6+4=10$.",
    "points": 0.5,
    "tags": [
      "đếm phần tử",
      "quy tắc nhân",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-taphop-25",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho tập $A=\\{1;2;\\ldots;12\\}$. Có bao nhiêu tập con của $A$ chứa cả phần tử $3$ và phần tử $5$ nhưng không chứa phần tử $7$?",
    "answer": "512",
    "explanation": "Ba phần tử $3;5;7$ đã cố định (lấy $3;5$, loại $7$), 9 phần tử còn lại tuỳ chọn: $2^9=512$.",
    "points": 0.5,
    "tags": [
      "tập hợp",
      "đếm tập con",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-01",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $A_5^2$ (chỉnh hợp chập 2 của 5 phần tử) là",
    "options": [
      {
        "key": "A",
        "text": "$10$"
      },
      {
        "key": "B",
        "text": "$15$"
      },
      {
        "key": "C",
        "text": "$20$"
      },
      {
        "key": "D",
        "text": "$25$"
      }
    ],
    "answer": "C",
    "explanation": "$A_5^2=5 \\cdot 4=20$.",
    "points": 0.25,
    "tags": [
      "tohop",
      "chỉnh hợp",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-02",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $C_5^3$ (tổ hợp chập 3 của 5 phần tử) là",
    "options": [
      {
        "key": "A",
        "text": "$20$"
      },
      {
        "key": "B",
        "text": "$10$"
      },
      {
        "key": "C",
        "text": "$5$"
      },
      {
        "key": "D",
        "text": "$8$"
      }
    ],
    "answer": "B",
    "explanation": "$C_5^3=\\dfrac{5 \\cdot 4 \\cdot 3}{3!}=10$.",
    "points": 0.25,
    "tags": [
      "tohop",
      "tổ hợp",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-03",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $4! \\cdot 3!$ là",
    "options": [
      {
        "key": "A",
        "text": "$144$"
      },
      {
        "key": "B",
        "text": "$72$"
      },
      {
        "key": "C",
        "text": "$120$"
      },
      {
        "key": "D",
        "text": "$288$"
      }
    ],
    "answer": "A",
    "explanation": "$4!=24$, $3!=6$ nên tích bằng $144$.",
    "points": 0.25,
    "tags": [
      "tohop",
      "giai thừa",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-04",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Có bao nhiêu cách xếp 5 học sinh thành một hàng ngang để chụp ảnh?",
    "options": [
      {
        "key": "A",
        "text": "$25$"
      },
      {
        "key": "B",
        "text": "$60$"
      },
      {
        "key": "C",
        "text": "$24$"
      },
      {
        "key": "D",
        "text": "$120$"
      }
    ],
    "answer": "D",
    "explanation": "Số hoán vị của 5 phần tử: $5!=120$.",
    "points": 0.25,
    "tags": [
      "tohop",
      "hoán vị",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-05",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Lớp học có 10 nam và 8 nữ. Có bao nhiêu cách chọn 2 em đi trực nhật sao cho có 1 nam và 1 nữ?",
    "options": [
      {
        "key": "A",
        "text": "$40$"
      },
      {
        "key": "B",
        "text": "$80$"
      },
      {
        "key": "C",
        "text": "$90$"
      },
      {
        "key": "D",
        "text": "$160$"
      }
    ],
    "answer": "B",
    "explanation": "Chọn 1 nam (10 cách) và 1 nữ (8 cách): $10 \\cdot 8=80$.",
    "points": 0.25,
    "tags": [
      "tohop",
      "quy tắc nhân",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-06",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một túi có 3 bi xanh, 2 bi đỏ cùng kích thước. Lấy ngẫu nhiên lần lượt 2 bi không hoàn lại (sơ đồ cây như hình). Xác suất để lấy được bi xanh ở lần thứ nhất và bi đỏ ở lần thứ hai là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{3}{10}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{2}{5}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{3}{5}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{4}$"
      }
    ],
    "answer": "A",
    "explanation": "$P=\\dfrac{3}{5} \\cdot \\dfrac{2}{4}=\\dfrac{6}{20}=\\dfrac{3}{10}$.",
    "points": 0.25,
    "tags": [
      "tohop",
      "quy tắc nhân",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "probtree",
      "text": "Xanh: 0,6\n  Đỏ: 0,5\n  Xanh: 0,5\nĐỏ: 0,4\n  Xanh: 0,75\n  Đỏ: 0,25"
    }
  },
  {
    "id": "thpt-t10-tohop-07",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Sắp xếp các chữ cái $T$, $O$, $A$, $N$ theo một thứ tự bất kì để được một chuỗi kí tự. Có bao nhiêu chuỗi kí tự khác nhau?",
    "options": [
      {
        "key": "A",
        "text": "$12$"
      },
      {
        "key": "B",
        "text": "$16$"
      },
      {
        "key": "C",
        "text": "$24$"
      },
      {
        "key": "D",
        "text": "$32$"
      }
    ],
    "answer": "C",
    "explanation": "Hoán vị 4 chữ cái khác nhau: $4!=24$.",
    "points": 0.25,
    "tags": [
      "tohop",
      "hoán vị",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-08",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Hệ số của $x^2$ trong khai triển $(x+2)^5$ là",
    "options": [
      {
        "key": "A",
        "text": "$40$"
      },
      {
        "key": "B",
        "text": "$16$"
      },
      {
        "key": "C",
        "text": "$10$"
      },
      {
        "key": "D",
        "text": "$80$"
      }
    ],
    "answer": "D",
    "explanation": "Số hạng chứa $x^2$: $C_5^2 x^2 \\cdot 2^3=10 \\cdot 8x^2$ nên hệ số là $80$.",
    "points": 0.25,
    "tags": [
      "tohop",
      "nhị thức Newton",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-09",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Trên đường tròn cho 5 điểm phân biệt. Có bao nhiêu dây cung nối hai trong năm điểm đó?",
    "options": [
      {
        "key": "A",
        "text": "$5$"
      },
      {
        "key": "B",
        "text": "$8$"
      },
      {
        "key": "C",
        "text": "$10$"
      },
      {
        "key": "D",
        "text": "$20$"
      }
    ],
    "answer": "C",
    "explanation": "Mỗi dây cung ứng một cách chọn 2 điểm: $C_5^2=10$.",
    "points": 0.25,
    "tags": [
      "tohop",
      "tổ hợp",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-10",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Chọn ngẫu nhiên 3 học sinh từ nhóm gồm 4 nam và 5 nữ. Số cách chọn sao cho nhóm có ít nhất một nữ là",
    "options": [
      {
        "key": "A",
        "text": "$64$"
      },
      {
        "key": "B",
        "text": "$76$"
      },
      {
        "key": "C",
        "text": "$80$"
      },
      {
        "key": "D",
        "text": "$84$"
      }
    ],
    "answer": "C",
    "explanation": "Tổng cách chọn 3 em từ 9 em: $C_9^3=84$. Cách chọn toàn nam: $C_4^3=4$. Số cách có ít nhất một nữ: $84-4=80$.",
    "points": 0.25,
    "tags": [
      "tohop",
      "tổ hợp",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-11",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một mật khẩu gồm 4 kí tự khác nhau được tạo từ 26 chữ cái in hoa. Số mật khẩu có thể tạo là",
    "options": [
      {
        "key": "A",
        "text": "$26^4$"
      },
      {
        "key": "B",
        "text": "$358\\,800$"
      },
      {
        "key": "C",
        "text": "$14\\,950$"
      },
      {
        "key": "D",
        "text": "$456\\,976$"
      }
    ],
    "answer": "B",
    "explanation": "$A_{26}^4=26 \\cdot 25 \\cdot 24 \\cdot 23=358\\,800$.",
    "points": 0.25,
    "tags": [
      "tohop",
      "chỉnh hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-12",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Xếp 3 nam và 3 nữ thành một hàng ngang sao cho nam, nữ xen kẽ nhau. Có bao nhiêu cách xếp?",
    "options": [
      {
        "key": "A",
        "text": "$72$"
      },
      {
        "key": "B",
        "text": "$144$"
      },
      {
        "key": "C",
        "text": "$36$"
      },
      {
        "key": "D",
        "text": "$720$"
      }
    ],
    "answer": "A",
    "explanation": "Hai kiểu Nam-Nữ hoặc Nữ-Nam: $2 \\cdot 3! \\cdot 3! = 2 \\cdot 36 = 72$.",
    "points": 0.25,
    "tags": [
      "tohop",
      "hoán vị",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-13",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về giá trị các biểu thức tổ hợp:",
    "options": [
      {
        "key": "a",
        "text": "$5!=120$"
      },
      {
        "key": "b",
        "text": "$A_4^3=24$"
      },
      {
        "key": "c",
        "text": "$C_6^4=15$"
      },
      {
        "key": "d",
        "text": "$A_4^4=12$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) $5!=120$ — đúng. b) $4 \\cdot 3 \\cdot 2=24$ — đúng. c) $C_6^4=C_6^2=15$ — đúng. d) $A_4^4=4!=24 \\ne 12$ — sai.",
    "points": 1,
    "tags": [
      "tohop",
      "chỉnh hợp",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-14",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Từ các chữ số $1;2;3;4;5$ lập số có ba chữ số (chữ số có thể lặp lại hoặc không tùy từng ý). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Số có ba chữ số đôi một khác nhau là 60"
      },
      {
        "key": "b",
        "text": "Số có ba chữ số (chữ số được lặp) là 125"
      },
      {
        "key": "c",
        "text": "Số chẵn có ba chữ số đôi một khác nhau là 30"
      },
      {
        "key": "d",
        "text": "Số lẻ có ba chữ số đôi một khác nhau là 36"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $5 \\cdot 4 \\cdot 3=60$ — đúng. b) $5^3=125$ — đúng. c) Chữ số cuối là 2 hoặc 4: $2 \\cdot 4 \\cdot 3=24 \\ne 30$ — sai. d) Chữ số cuối là 1, 3 hoặc 5: $3 \\cdot 4 \\cdot 3=36$ — đúng.",
    "points": 1,
    "tags": [
      "tohop",
      "quy tắc nhân",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-15",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Gieo một xúc xắc sáu mặt hai lần liên tiếp. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Không gian mẫu có 36 phần tử"
      },
      {
        "key": "b",
        "text": "Xác suất để tổng số chấm bằng 7 là $\\dfrac{1}{6}$"
      },
      {
        "key": "c",
        "text": "Xác suất để hai mặt giống nhau là $\\dfrac{1}{12}$"
      },
      {
        "key": "d",
        "text": "Xác suất để tổng số chấm lớn hơn 10 là $\\dfrac{1}{9}$"
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) $6^2=36$ — đúng. b) Có 6 cặp cho tổng 7 nên $\\dfrac{6}{36}=\\dfrac{1}{6}$ — đúng. c) Có 6 cặp giống nhau nên xác suất $\\dfrac{6}{36}=\\dfrac{1}{6} \\ne \\dfrac{1}{12}$ — sai. d) Có 3 cặp $(5;6),(6;5),(6;6)$ nên xác suất $\\dfrac{3}{36}=\\dfrac{1}{12} \\ne \\dfrac{1}{9}$ — sai.",
    "points": 1,
    "tags": [
      "tohop",
      "xác suất",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-16",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Xét khai triển $(x+1)^4$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Khai triển có 5 số hạng"
      },
      {
        "key": "b",
        "text": "Hệ số của $x^2$ là 6"
      },
      {
        "key": "c",
        "text": "Hệ số của $x^3$ là 4"
      },
      {
        "key": "d",
        "text": "Hệ số của $x$ là 1"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) $n+1=5$ — đúng. b) $C_4^2=6$ — đúng. c) $C_4^3=4$ — đúng. d) $C_4^1=4 \\ne 1$ — sai.",
    "points": 1,
    "tags": [
      "tohop",
      "nhị thức Newton",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-17",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Đội bóng của lớp có 11 học sinh, trong đó có 1 thủ quân. Chọn ngẫu nhiên 5 em vào sân. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Số cách chọn không ràng buộc là 562"
      },
      {
        "key": "b",
        "text": "Số cách chọn sao cho thủ quân có mặt là 210"
      },
      {
        "key": "c",
        "text": "Số cách chọn sao cho thủ quân không có mặt là 252"
      },
      {
        "key": "d",
        "text": "Số cách chọn sao cho thủ quân có mặt bằng nửa số cách chọn không ràng buộc, tức 231"
      }
    ],
    "answer": "SĐĐS",
    "explanation": "a) $C_{11}^5=462 \\ne 562$ — sai. b) $C_{10}^4=210$ — đúng. c) $C_{10}^5=252$ — đúng. d) $\\dfrac{462}{2}=231 \\ne 210$ — sai.",
    "points": 1,
    "tags": [
      "tohop",
      "tổ hợp",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-18",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Lớp có 25 học sinh, cần chọn ban cán sự gồm lớp trưởng, lớp phó học tập và lớp phó văn thể (mỗi chức vụ một em, mỗi em giữ nhiều nhất một chức). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Số cách chọn 3 em không phân biệt chức vụ là 2300"
      },
      {
        "key": "b",
        "text": "Số cách chọn có phân biệt chức vụ là 13800"
      },
      {
        "key": "c",
        "text": "$A_{25}^3=\\dfrac{25 \\cdot 24 \\cdot 23}{6}$"
      },
      {
        "key": "d",
        "text": "$C_{25}^3=\\dfrac{25 \\cdot 24 \\cdot 23}{6}$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $C_{25}^3=2300$ — đúng. b) $A_{25}^3=25 \\cdot 24 \\cdot 23=13800$ — đúng. c) $A_{25}^3=25 \\cdot 24 \\cdot 23$, chia cho 6 là $C_{25}^3$ — sai. d) Đúng.",
    "points": 1,
    "tags": [
      "tohop",
      "chỉnh hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-19",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một lớp có 12 học sinh. Có bao nhiêu cách chọn 2 em làm trực nhật?",
    "answer": "66",
    "explanation": "$C_{12}^2=\\dfrac{12 \\cdot 11}{2}=66$.",
    "points": 0.5,
    "tags": [
      "tohop",
      "tổ hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-20",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Có bao nhiêu cách xếp 4 cuốn sách khác nhau lên một kệ hàng ngang?",
    "answer": "24",
    "explanation": "$4!=24$ cách.",
    "points": 0.5,
    "tags": [
      "tohop",
      "hoán vị",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-21",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một hộp có 5 bi trắng và 3 bi đen cùng kích thước. Lấy ngẫu nhiên 2 bi. Có bao nhiêu cách lấy?",
    "answer": "28",
    "explanation": "$C_8^2=\\dfrac{8 \\cdot 7}{2}=28$.",
    "points": 0.5,
    "tags": [
      "tohop",
      "tổ hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-22",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $3!+2!$.",
    "answer": "8",
    "explanation": "$3!=6$, $2!=2$ nên tổng bằng 8.",
    "points": 0.5,
    "tags": [
      "tohop",
      "giai thừa",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-23",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính hệ số của $x^3$ trong khai triển $(x+1)^5$.",
    "answer": "10",
    "explanation": "Hệ số là $C_5^3=10$.",
    "points": 0.5,
    "tags": [
      "tohop",
      "nhị thức Newton",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-24",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Sáu người bắt tay nhau, mỗi cặp bắt đúng một lần. Có bao nhiêu cái bắt tay?",
    "answer": "15",
    "explanation": "$C_6^2=\\dfrac{6 \\cdot 5}{2}=15$.",
    "points": 0.5,
    "tags": [
      "tohop",
      "tổ hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-tohop-25",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Xếp 5 sinh viên vào 5 phòng khác nhau, mỗi phòng một sinh viên. Có bao nhiêu cách xếp?",
    "answer": "120",
    "explanation": "$5!=120$ cách.",
    "points": 0.5,
    "tags": [
      "tohop",
      "hoán vị",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-01",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Hai vectơ được gọi là bằng nhau khi",
    "options": [
      {
        "key": "A",
        "text": "có cùng điểm đầu"
      },
      {
        "key": "B",
        "text": "có cùng độ dài"
      },
      {
        "key": "C",
        "text": "cùng hướng và cùng độ dài"
      },
      {
        "key": "D",
        "text": "cùng phương"
      }
    ],
    "answer": "C",
    "explanation": "Theo định nghĩa, $\\vec{a}=\\vec{b}$ khi chúng cùng hướng và cùng độ dài.",
    "points": 0.25,
    "tags": [
      "vectơ",
      "khái niệm",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-02",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho vectơ $\\vec{u}=(2;-1)$. Độ dài của $\\vec{u}$ là",
    "options": [
      {
        "key": "A",
        "text": "$3$"
      },
      {
        "key": "B",
        "text": "$\\sqrt{5}$"
      },
      {
        "key": "C",
        "text": "$\\sqrt{3}$"
      },
      {
        "key": "D",
        "text": "$5$"
      }
    ],
    "answer": "B",
    "explanation": "$|\\vec{u}|=\\sqrt{2^2+(-1)^2}=\\sqrt{5}$.",
    "points": 0.25,
    "tags": [
      "vectơ",
      "độ dài vectơ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-03",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hai điểm $A(1;2)$, $B(4;6)$ (như hình). Toạ độ vectơ $\\overrightarrow{AB}$ là",
    "options": [
      {
        "key": "A",
        "text": "$(3;4)$"
      },
      {
        "key": "B",
        "text": "$(4;3)$"
      },
      {
        "key": "C",
        "text": "$(-3;-4)$"
      },
      {
        "key": "D",
        "text": "$(5;8)$"
      }
    ],
    "answer": "A",
    "explanation": "$\\overrightarrow{AB}=(4-1;6-2)=(3;4)$.",
    "points": 0.25,
    "tags": [
      "vectơ",
      "toạ độ vectơ",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -1,
      "xMax": 5,
      "yMin": -1,
      "yMax": 7,
      "grid": true,
      "items": "A(1; 2)\nB(4; 6)"
    }
  },
  {
    "id": "thpt-t10-vecto-04",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $\\vec{u}=(3;-2)$, $\\vec{v}=(-1;4)$. Toạ độ vectơ $\\vec{u}+\\vec{v}$ là",
    "options": [
      {
        "key": "A",
        "text": "$(4;-6)$"
      },
      {
        "key": "B",
        "text": "$(2;2)$"
      },
      {
        "key": "C",
        "text": "$(2;-6)$"
      },
      {
        "key": "D",
        "text": "$(-4;6)$"
      }
    ],
    "answer": "B",
    "explanation": "$\\vec{u}+\\vec{v}=(3-1;-2+4)=(2;2)$.",
    "points": 0.25,
    "tags": [
      "vectơ",
      "tổng vectơ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-05",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $\\vec{u}=(2;3)$, $\\vec{v}=(1;-2)$. Tích vô hướng $\\vec{u} \\cdot \\vec{v}$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$8$"
      },
      {
        "key": "B",
        "text": "$1$"
      },
      {
        "key": "C",
        "text": "$4$"
      },
      {
        "key": "D",
        "text": "$-4$"
      }
    ],
    "answer": "D",
    "explanation": "$\\vec{u} \\cdot \\vec{v}=2 \\cdot 1+3 \\cdot (-2)=2-6=-4$.",
    "points": 0.25,
    "tags": [
      "vectơ",
      "tích vô hướng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-06",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho tam giác $ABC$ (như hình) với $A(1;1)$, $B(3;5)$. Toạ độ trung điểm $M$ của $AB$ là",
    "options": [
      {
        "key": "A",
        "text": "$(4;6)$"
      },
      {
        "key": "B",
        "text": "$(2;3)$"
      },
      {
        "key": "C",
        "text": "$(3;2)$"
      },
      {
        "key": "D",
        "text": "$(2;-3)$"
      }
    ],
    "answer": "B",
    "explanation": "$M=\\left(\\dfrac{1+3}{2};\\dfrac{1+5}{2}\\right)=(2;3)$.",
    "points": 0.25,
    "tags": [
      "vectơ",
      "trung điểm",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo2d",
      "shape": "triangle",
      "names": [
        "A",
        "B",
        "C"
      ],
      "extras": "M = trung điểm AB"
    }
  },
  {
    "id": "thpt-t10-vecto-07",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Tam giác $ABC$ (như hình) có $A(1;1)$, $B(4;1)$, $C(1;5)$ và trọng tâm $G$. Tung độ của $G$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{7}{3}$"
      },
      {
        "key": "B",
        "text": "$2$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{5}{3}$"
      }
    ],
    "answer": "A",
    "explanation": "Tung độ trọng tâm $=\\dfrac{1+1+5}{3}=\\dfrac{7}{3}$.",
    "points": 0.25,
    "tags": [
      "vectơ",
      "trọng tâm",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo2d",
      "shape": "triangle",
      "names": [
        "A",
        "B",
        "C"
      ],
      "extras": "G = trọng tâm ABC"
    }
  },
  {
    "id": "thpt-t10-vecto-08",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật chịu lực $\\vec{F}=(3;4)$ (N) và di chuyển 5 m theo phương của $\\vec{F}$. Công của lực $\\vec{F}$ (jun) là",
    "options": [
      {
        "key": "A",
        "text": "$20$"
      },
      {
        "key": "B",
        "text": "$25$"
      },
      {
        "key": "C",
        "text": "$35$"
      },
      {
        "key": "D",
        "text": "$5$"
      }
    ],
    "answer": "B",
    "explanation": "$|\\vec{F}|=\\sqrt{9+16}=5$ (N), $W=|\\vec{F}| \\cdot d=5 \\cdot 5=25$ (J).",
    "points": 0.25,
    "tags": [
      "vectơ",
      "công của lực",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-09",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho ba điểm $A$, $B$, $C$ với $\\overrightarrow{AB}=(2;3)$, $\\overrightarrow{BC}=(1;-1)$. Toạ độ vectơ $\\overrightarrow{AC}$ là",
    "options": [
      {
        "key": "A",
        "text": "$(1;4)$"
      },
      {
        "key": "B",
        "text": "$(2;2)$"
      },
      {
        "key": "C",
        "text": "$(3;2)$"
      },
      {
        "key": "D",
        "text": "$(-1;2)$"
      }
    ],
    "answer": "C",
    "explanation": "$\\overrightarrow{AC}=\\overrightarrow{AB}+\\overrightarrow{BC}=(2+1;3-1)=(3;2)$.",
    "points": 0.25,
    "tags": [
      "vectơ",
      "tổng vectơ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-10",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $\\vec{u}=(2;m)$, $\\vec{v}=(3;-4)$. Giá trị của $m$ để $\\vec{u}$ vuông góc với $\\vec{v}$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{4}{3}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{2}{3}$"
      },
      {
        "key": "C",
        "text": "$-\\dfrac{3}{2}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{3}{2}$"
      }
    ],
    "answer": "D",
    "explanation": "$\\vec{u} \\cdot \\vec{v}=6-4m=0 \\Leftrightarrow m=\\dfrac{3}{2}$.",
    "points": 0.25,
    "tags": [
      "vectơ",
      "vuông góc",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-11",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hai vectơ $\\vec{u}$, $\\vec{v}$ có độ dài lần lượt là $2$ và $3$, góc giữa chúng bằng $60^\\circ$. Tích vô hướng $\\vec{u} \\cdot \\vec{v}$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$3$"
      },
      {
        "key": "B",
        "text": "$6$"
      },
      {
        "key": "C",
        "text": "$\\sqrt{3}$"
      },
      {
        "key": "D",
        "text": "$2$"
      }
    ],
    "answer": "A",
    "explanation": "$\\vec{u} \\cdot \\vec{v}=|\\vec{u}||\\vec{v}|\\cos 60^\\circ=2 \\cdot 3 \\cdot \\dfrac{1}{2}=3$.",
    "points": 0.25,
    "tags": [
      "vectơ",
      "tích vô hướng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-12",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho tam giác $ABC$ với $A(1;1)$, $B(3;2)$, $C(m;5)$. Giá trị của $m$ để tam giác $ABC$ vuông tại $B$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{2}{3}$"
      },
      {
        "key": "B",
        "text": "$1$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{3}{2}$"
      },
      {
        "key": "D",
        "text": "$2$"
      }
    ],
    "answer": "C",
    "explanation": "$\\overrightarrow{BA}=(-2;-1)$, $\\overrightarrow{BC}=(m-3;3)$. Vuông tại $B$: $-2(m-3)-3=0 \\Leftrightarrow m=\\dfrac{3}{2}$.",
    "points": 0.25,
    "tags": [
      "vectơ",
      "vuông góc",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-13",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho $\\vec{u}=(2;-3)$, $\\vec{v}=(-4;6)$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$\\vec{u}$ và $\\vec{v}$ cùng hướng"
      },
      {
        "key": "b",
        "text": "$|\\vec{u}|=\\sqrt{13}$"
      },
      {
        "key": "c",
        "text": "$\\vec{u} \\cdot \\vec{v}=10$"
      },
      {
        "key": "d",
        "text": "$\\vec{u}+\\vec{v}=(-2;3)$"
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "a) $\\vec{v}=-2\\vec{u}$ nên hai vectơ ngược hướng — sai. b) $\\sqrt{4+9}=\\sqrt{13}$ — đúng. c) $-8-18=-26$ — sai. d) $(-2;3)$ — đúng.",
    "points": 1,
    "tags": [
      "vectơ",
      "phép toán vectơ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-14",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Tam giác $ABC$ (vẽ như hình) có $A(1;2)$, $B(5;2)$, $C(2;6)$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$\\overrightarrow{AB}=(4;0)$"
      },
      {
        "key": "b",
        "text": "$|\\overrightarrow{AC}|=5$"
      },
      {
        "key": "c",
        "text": "Trọng tâm của tam giác là $G\\left(\\dfrac{8}{3};\\dfrac{10}{3}\\right)$"
      },
      {
        "key": "d",
        "text": "Tam giác $ABC$ vuông tại $B$"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) $(5-1;2-2)=(4;0)$ — đúng. b) $\\overrightarrow{AC}=(1;4)$ nên $|\\overrightarrow{AC}|=\\sqrt{17} \\ne 5$ — sai. c) $\\left(\\dfrac{1+5+2}{3};\\dfrac{2+2+6}{3}\\right)=\\left(\\dfrac{8}{3};\\dfrac{10}{3}\\right)$ — đúng. d) $\\overrightarrow{BA} \\cdot \\overrightarrow{BC}=(-4;0) \\cdot (-3;4)=12 \\ne 0$ — sai.",
    "points": 1,
    "tags": [
      "vectơ",
      "toạ độ vectơ",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo2d",
      "shape": "triangle",
      "names": [
        "A",
        "B",
        "C"
      ]
    }
  },
  {
    "id": "thpt-t10-vecto-15",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho $\\vec{u}=(1;\\sqrt{3})$ và $\\vec{v}=(\\sqrt{3};1)$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$|\\vec{u}|=2$"
      },
      {
        "key": "b",
        "text": "$\\vec{u} \\cdot \\vec{v}=2\\sqrt{3}$"
      },
      {
        "key": "c",
        "text": "Góc giữa $\\vec{u}$ và $\\vec{v}$ bằng $60^\\circ$"
      },
      {
        "key": "d",
        "text": "$\\cos(\\vec{u},\\vec{v})=\\dfrac{\\sqrt{3}}{2}$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $\\sqrt{1+3}=2$ — đúng. b) $\\sqrt{3}+\\sqrt{3}=2\\sqrt{3}$ — đúng. c) $\\cos=\\dfrac{2\\sqrt{3}}{2 \\cdot 2}=\\dfrac{\\sqrt{3}}{2}$ nên góc $30^\\circ$ — sai. d) Đúng.",
    "points": 1,
    "tags": [
      "vectơ",
      "góc giữa hai vectơ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-16",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho $A(2;3)$, $B(-4;1)$ (như hình) và $M$ là trung điểm của $AB$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$M(-1;2)$"
      },
      {
        "key": "b",
        "text": "$\\overrightarrow{AM}=\\overrightarrow{MB}$"
      },
      {
        "key": "c",
        "text": "$|\\overrightarrow{AB}|=2\\sqrt{10}$"
      },
      {
        "key": "d",
        "text": "$|\\overrightarrow{AB}|=40$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) $\\left(\\dfrac{2-4}{2};\\dfrac{3+1}{2}\\right)=(-1;2)$ — đúng. b) Tính chất trung điểm — đúng. c) $\\overrightarrow{AB}=(-6;-2)$, $|\\overrightarrow{AB}|=\\sqrt{40}=2\\sqrt{10}$ — đúng. d) Độ dài là $\\sqrt{40}$, không phải 40 — sai.",
    "points": 1,
    "tags": [
      "vectơ",
      "trung điểm",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -5,
      "yMin": -1,
      "xMax": 3,
      "yMax": 4,
      "grid": true,
      "items": "A(2; 3)\nB(-4; 1)"
    }
  },
  {
    "id": "thpt-t10-vecto-17",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Một vật chịu đồng thời hai lực $\\vec{F_1}=(3;4)$ và $\\vec{F_2}=(4;-3)$ (N). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Hợp lực $\\vec{F}=\\vec{F_1}+\\vec{F_2}=(7;1)$"
      },
      {
        "key": "b",
        "text": "$|\\vec{F}|=5\\sqrt{2}$ (N)"
      },
      {
        "key": "c",
        "text": "$\\vec{F_1}$ vuông góc với $\\vec{F_2}$"
      },
      {
        "key": "d",
        "text": "Công của hợp lực khi vật dịch chuyển 2 m theo phương $\\vec{F}$ là 10 J"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) $(3+4;4-3)=(7;1)$ — đúng. b) $\\sqrt{49+1}=\\sqrt{50}=5\\sqrt{2}$ — đúng. c) $3 \\cdot 4+4 \\cdot (-3)=0$ — đúng. d) $W=|\\vec{F}| \\cdot 2=10\\sqrt{2} \\approx 14{,}1$ J $\\ne 10$ J — sai.",
    "points": 1,
    "tags": [
      "vectơ",
      "công của lực",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-18",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho tam giác $ABC$ (vẽ như hình) với $A(1;0)$, $B(3;4)$, $C(-1;2)$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$\\overrightarrow{AB}=(2;4)$"
      },
      {
        "key": "b",
        "text": "$|\\overrightarrow{BC}|=20$"
      },
      {
        "key": "c",
        "text": "Trọng tâm của tam giác là $G(1;2)$"
      },
      {
        "key": "d",
        "text": "$\\overrightarrow{AB}$ vuông góc với $\\overrightarrow{AC}$"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) $(3-1;4-0)=(2;4)$ — đúng. b) $\\overrightarrow{BC}=(-4;-2)$, $|\\overrightarrow{BC}|=\\sqrt{20}=2\\sqrt{5} \\ne 20$ — sai. c) $\\left(\\dfrac{1+3-1}{3};\\dfrac{0+4+2}{3}\\right)=(1;2)$ — đúng. d) $\\overrightarrow{AC}=(-2;2)$, tích vô hướng $2(-2)+4(2)=4 \\ne 0$ — sai.",
    "points": 1,
    "tags": [
      "vectơ",
      "toạ độ vectơ",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo2d",
      "shape": "triangle",
      "names": [
        "A",
        "B",
        "C"
      ]
    }
  },
  {
    "id": "thpt-t10-vecto-19",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $A(1;2)$, $B(4;6)$. Tính độ dài đoạn $AB$.",
    "answer": "5",
    "explanation": "$AB=\\sqrt{3^2+4^2}=5$.",
    "points": 0.5,
    "tags": [
      "vectơ",
      "độ dài vectơ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-20",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $\\vec{u}=(m+1;3)$, $\\vec{v}=(2;m)$. Tìm $m$ để $\\vec{u}$ vuông góc với $\\vec{v}$.",
    "answer": "-0,4",
    "explanation": "$\\vec{u} \\cdot \\vec{v}=2(m+1)+3m=5m+2=0 \\Leftrightarrow m=-\\dfrac{2}{5}=-0{,}4$.",
    "points": 0.5,
    "tags": [
      "vectơ",
      "vuông góc",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-21",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hai vectơ có độ dài lần lượt là 4 và 5, góc giữa chúng bằng $120^\\circ$. Tính tích vô hướng của hai vectơ đó.",
    "answer": "-10",
    "explanation": "Tích vô hướng $=4 \\cdot 5 \\cdot \\cos 120^\\circ=20 \\cdot \\left(-\\dfrac{1}{2}\\right)=-10$.",
    "points": 0.5,
    "tags": [
      "vectơ",
      "tích vô hướng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-22",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $A(2;-1)$, $B(8;5)$. Tính tung độ của trung điểm $M$ của đoạn $AB$.",
    "answer": "2",
    "explanation": "Tung độ $M=\\dfrac{-1+5}{2}=2$.",
    "points": 0.5,
    "tags": [
      "vectơ",
      "trung điểm",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-23",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một vật chịu lực $\\vec{F}=(5;12)$ (N) và di chuyển 2 m theo phương của $\\vec{F}$. Tính công của lực (jun).",
    "answer": "26",
    "explanation": "$|\\vec{F}|=\\sqrt{25+144}=13$, $W=13 \\cdot 2=26$ J.",
    "points": 0.5,
    "tags": [
      "vectơ",
      "công của lực",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-24",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tam giác $ABC$ có $A(1;0)$, $B(0;3)$, $C(-4;1)$. Tính diện tích tam giác $ABC$.",
    "answer": "7",
    "explanation": "$\\overrightarrow{AB}=(-1;3)$, $\\overrightarrow{AC}=(-5;1)$, diện tích $=\\dfrac{|(-1)(1)-3(-5)|}{2}=\\dfrac{14}{2}=7$.",
    "points": 0.5,
    "tags": [
      "vectơ",
      "diện tích tam giác",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-vecto-25",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $\\vec{u}=(3;4)$, $\\vec{v}=(1;-2)$. Tính $|\\vec{u}-\\vec{v}|^2$.",
    "answer": "40",
    "explanation": "$\\vec{u}-\\vec{v}=(2;6)$ nên $|\\vec{u}-\\vec{v}|^2=4+36=40$.",
    "points": 0.5,
    "tags": [
      "vectơ",
      "độ dài vectơ",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-01",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Gieo một đồng xu đồng chất hai lần liên tiếp. Xác suất để cả hai lần đều ra mặt ngửa là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{1}{4}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{1}{8}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{3}{4}$"
      }
    ],
    "answer": "B",
    "explanation": "Không gian mẫu có 4 kết quả đồng khả năng, chỉ có 1 kết quả (ngửa, ngửa): $P=\\dfrac{1}{4}$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "cổ điển",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-02",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Trung vị của dãy số $3;\\ 5;\\ 7;\\ 8;\\ 12$ là",
    "options": [
      {
        "key": "A",
        "text": "$5$"
      },
      {
        "key": "B",
        "text": "$6$"
      },
      {
        "key": "C",
        "text": "$7$"
      },
      {
        "key": "D",
        "text": "$8$"
      }
    ],
    "answer": "C",
    "explanation": "Dãy đã sắp xếp có 5 số, trung vị là số giữa: $7$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "trung vị",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-03",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Gieo một xúc xắc sáu mặt đồng chất. Xác suất để mặt xuất hiện là số chẵn là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{1}{3}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{1}{6}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{2}{3}$"
      }
    ],
    "answer": "A",
    "explanation": "Số chẵn là $\\{2;4;6\\}$: 3 kết quả trên 6 nên $P=\\dfrac{1}{2}$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "cổ điển",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-04",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Mốt của dãy số $2;\\ 3;\\ 3;\\ 5;\\ 5;\\ 5;\\ 7$ là",
    "options": [
      {
        "key": "A",
        "text": "$3$"
      },
      {
        "key": "B",
        "text": "$5$"
      },
      {
        "key": "C",
        "text": "$7$"
      },
      {
        "key": "D",
        "text": "$15$"
      }
    ],
    "answer": "B",
    "explanation": "Số $5$ xuất hiện 3 lần, nhiều nhất trong dãy.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "mốt",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-05",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một túi có 4 bi đỏ và 6 bi xanh cùng kích thước. Bốc ngẫu nhiên một bi. Xác suất bốc được bi đỏ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{5}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{3}{5}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{2}{5}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{4}{5}$"
      }
    ],
    "answer": "C",
    "explanation": "$P=\\dfrac{4}{10}=\\dfrac{2}{5}$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "cổ điển",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-06",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Gieo hai xúc xắc sáu mặt đồng chất. Xác suất để tổng số chấm bằng 8 là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{6}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{7}{36}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{1}{9}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{5}{36}$"
      }
    ],
    "answer": "D",
    "explanation": "Có 5 cặp $(2;6),(3;5),(4;4),(5;3),(6;2)$ trên 36 kết quả: $P=\\dfrac{5}{36}$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "cổ điển",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-07",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Bảng thống kê số bài kiểm tra đạt từng loại của 10 học sinh như hình. Số trung bình của dãy điểm (làm tròn đến hàng phần mười) là",
    "options": [
      {
        "key": "A",
        "text": "$7{,}3$"
      },
      {
        "key": "B",
        "text": "$7$"
      },
      {
        "key": "C",
        "text": "$7{,}5$"
      },
      {
        "key": "D",
        "text": "$8$"
      }
    ],
    "answer": "A",
    "explanation": "$\\bar{x}=\\dfrac{5 \\cdot 1+6 \\cdot 2+7 \\cdot 3+8 \\cdot 2+9+10}{10}=\\dfrac{73}{10}=7{,}3$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "số trung bình",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "bar",
      "title": "Điểm kiểm tra của 10 học sinh",
      "xLabel": "Điểm",
      "yLabel": "Số học sinh",
      "data": "5; 6; 7; 8; 9; 10\nSố học sinh: 1; 2; 3; 2; 1; 1"
    }
  },
  {
    "id": "thpt-t10-xacsuat-thongke-08",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Phương sai của dãy số $2;\\ 4;\\ 6;\\ 8$ là",
    "options": [
      {
        "key": "A",
        "text": "$4$"
      },
      {
        "key": "B",
        "text": "$25$"
      },
      {
        "key": "C",
        "text": "$5$"
      },
      {
        "key": "D",
        "text": "$2{,}5$"
      }
    ],
    "answer": "C",
    "explanation": "Số trung bình $5$; $s^2=\\dfrac{9+1+1+9}{4}=5$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "phương sai",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-09",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho dãy số $1;\\ 2;\\ 3;\\ 4;\\ 5;\\ 6;\\ 7;\\ 8$. Tứ phân vị thứ ba của dãy là",
    "options": [
      {
        "key": "A",
        "text": "$2{,}5$"
      },
      {
        "key": "B",
        "text": "$6{,}5$"
      },
      {
        "key": "C",
        "text": "$5$"
      },
      {
        "key": "D",
        "text": "$8$"
      }
    ],
    "answer": "B",
    "explanation": "$n=8$ chia hết cho 4: $Q_1=\\dfrac{2+3}{2}=2{,}5$, $Q_3=\\dfrac{6+7}{2}=6{,}5$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "tứ phân vị",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-10",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một hộp có 3 bi trắng và 4 bi đen cùng kích thước. Bốc ngẫu nhiên đồng thời 2 bi. Xác suất để bốc được 2 bi đen là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{4}{7}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{1}{7}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{3}{7}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{2}{7}$"
      }
    ],
    "answer": "D",
    "explanation": "$P=\\dfrac{C_4^2}{C_7^2}=\\dfrac{6}{21}=\\dfrac{2}{7}$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "tổ hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-11",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Khoảng biến thiên của dãy số $3;\\ 7;\\ 2;\\ 9;\\ 5$ là",
    "options": [
      {
        "key": "A",
        "text": "$7$"
      },
      {
        "key": "B",
        "text": "$9$"
      },
      {
        "key": "C",
        "text": "$11$"
      },
      {
        "key": "D",
        "text": "$2$"
      }
    ],
    "answer": "A",
    "explanation": "$R=x_{\\max}-x_{\\min}=9-2=7$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "khoảng biến thiên",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-12",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Bốc ngẫu nhiên đồng thời 2 lá từ 5 lá thẻ đánh số $1;2;3;4;5$. Xác suất để tổng hai số trên hai lá là số chẵn là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{5}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{2}{5}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{3}{5}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{4}{5}$"
      }
    ],
    "answer": "B",
    "explanation": "Tổng chẵn khi hai số cùng tính chẵn lẻ: $C_2^2+C_3^2=1+3=4$ trên $C_5^2=10$ cách: $P=\\dfrac{2}{5}$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "tổ hợp",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-13",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Gieo một xúc xắc sáu mặt đồng chất một lần. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Không gian mẫu là $\\{1;2;3;4;5;6\\}$"
      },
      {
        "key": "b",
        "text": "Xác suất ra mặt là số nguyên tố bằng $\\dfrac{1}{2}$"
      },
      {
        "key": "c",
        "text": "Xác suất ra mặt có số chấm lớn hơn 4 bằng $\\dfrac{1}{3}$"
      },
      {
        "key": "d",
        "text": "Xác suất ra mặt là số lẻ bằng $\\dfrac{1}{3}$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) Số nguyên tố $\\{2;3;5\\}$: $\\dfrac{3}{6}=\\dfrac{1}{2}$ — đúng. c) $\\{5;6\\}$: $\\dfrac{2}{6}=\\dfrac{1}{3}$ — đúng. d) Số lẻ $\\{1;3;5\\}$: xác suất $\\dfrac{1}{2} \\ne \\dfrac{1}{3}$ — sai.",
    "points": 1,
    "tags": [
      "xác suất",
      "cổ điển",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-14",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Số cuốn sách mượn trong tháng của 10 bạn được ghi lại: $1;\\ 2;\\ 2;\\ 3;\\ 3;\\ 3;\\ 4;\\ 4;\\ 5;\\ 5$ (biểu đồ như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Mốt của dãy là 3"
      },
      {
        "key": "b",
        "text": "Số trung bình của dãy là 3"
      },
      {
        "key": "c",
        "text": "Trung vị của dãy là 3"
      },
      {
        "key": "d",
        "text": "Khoảng biến thiên của dãy là 4"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Số 3 xuất hiện 3 lần — đúng. b) $\\bar{x}=\\dfrac{32}{10}=3{,}2 \\ne 3$ — sai. c) Hai số giữa là $3;3$ nên trung vị $3$ — đúng. d) $5-1=4$ — đúng.",
    "points": 1,
    "tags": [
      "thống kê",
      "số đặc trưng",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "bar",
      "title": "Số sách mượn của 10 bạn",
      "xLabel": "Số sách",
      "yLabel": "Số bạn",
      "data": "1; 2; 3; 4; 5\nSố bạn: 1; 2; 3; 2; 2"
    }
  },
  {
    "id": "thpt-t10-xacsuat-thongke-15",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho dãy số $1;\\ 2;\\ 3;\\ 4$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Số trung bình là $2{,}5$"
      },
      {
        "key": "b",
        "text": "Phương sai là $1{,}25$"
      },
      {
        "key": "c",
        "text": "Độ lệch chuẩn là $1{,}25$"
      },
      {
        "key": "d",
        "text": "Khoảng biến thiên là $3$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $\\dfrac{10}{4}=2{,}5$ — đúng. b) $s^2=\\dfrac{2{,}25+0{,}25+0{,}25+2{,}25}{4}=1{,}25$ — đúng. c) $s=\\sqrt{1{,}25} \\approx 1{,}12 \\ne 1{,}25$ — sai. d) $4-1=3$ — đúng.",
    "points": 1,
    "tags": [
      "thống kê",
      "phương sai",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-16",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Một hộp có 2 bi trắng và 3 bi đen cùng kích thước. Bốc ngẫu nhiên 2 bi (không hoàn lại). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Không gian mẫu có 10 phần tử"
      },
      {
        "key": "b",
        "text": "Xác suất bốc được 2 bi trắng bằng $\\dfrac{1}{10}$"
      },
      {
        "key": "c",
        "text": "Xác suất bốc được 2 bi đen bằng $\\dfrac{3}{5}$"
      },
      {
        "key": "d",
        "text": "Xác suất bốc được 1 trắng và 1 đen bằng $\\dfrac{3}{5}$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $C_5^2=10$ — đúng. b) $\\dfrac{C_2^2}{C_5^2}=\\dfrac{1}{10}$ — đúng. c) $\\dfrac{C_3^2}{C_5^2}=\\dfrac{3}{10} \\ne \\dfrac{3}{5}$ — sai. d) $\\dfrac{2 \\cdot 3}{10}=\\dfrac{6}{10}=\\dfrac{3}{5}$ — đúng.",
    "points": 1,
    "tags": [
      "xác suất",
      "tổ hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-17",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Thời gian (phút) 8 bạn hoàn thành một bài tập: $10;\\ 20;\\ 25;\\ 25;\\ 30;\\ 35;\\ 40;\\ 55$ (biểu đồ như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Mốt của dãy là 25"
      },
      {
        "key": "b",
        "text": "Trung vị của dãy là $27{,}5$"
      },
      {
        "key": "c",
        "text": "Số trung bình của dãy là $27{,}5$"
      },
      {
        "key": "d",
        "text": "Khoảng biến thiên của dãy là 45"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) 25 xuất hiện 2 lần — đúng. b) Hai số giữa $25;30$: trung vị $27{,}5$ — đúng. c) $\\bar{x}=\\dfrac{240}{8}=30 \\ne 27{,}5$ — sai. d) $55-10=45$ — đúng.",
    "points": 1,
    "tags": [
      "thống kê",
      "số đặc trưng",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "bar",
      "title": "Thời gian làm bài của 8 bạn",
      "xLabel": "Thời gian (phút)",
      "yLabel": "Số bạn",
      "data": "10; 20; 25; 30; 35; 40; 55\nSố bạn: 1; 1; 2; 1; 1; 1; 1"
    }
  },
  {
    "id": "thpt-t10-xacsuat-thongke-18",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho dãy số $4;\\ 7;\\ 2;\\ 9;\\ 5$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Dãy sắp xếp tăng dần là $2;\\ 4;\\ 5;\\ 7;\\ 9$"
      },
      {
        "key": "b",
        "text": "Trung vị của dãy là 5"
      },
      {
        "key": "c",
        "text": "Trung vị của dãy là $\\dfrac{4+5}{2}$"
      },
      {
        "key": "d",
        "text": "Mốt của dãy là 2"
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng. b) Dãy có 5 số, số giữa là 5 — đúng. c) Trung vị là một giá trị của dãy, không phải trung bình hai số — sai. d) Mọi giá trị xuất hiện một lần nên dãy không có mốt — sai.",
    "points": 1,
    "tags": [
      "thống kê",
      "trung vị",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-19",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Gieo hai xúc xắc sáu mặt đồng chất. Có bao nhiêu kết quả để tổng số chấm bằng 8?",
    "answer": "5",
    "explanation": "Các cặp: $(2;6),(3;5),(4;4),(5;3),(6;2)$ — 5 kết quả.",
    "points": 0.5,
    "tags": [
      "xác suất",
      "cổ điển",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-20",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính phương sai của dãy số $3;\\ 5;\\ 7;\\ 9;\\ 11$.",
    "answer": "8",
    "explanation": "$\\bar{x}=7$; $s^2=\\dfrac{16+4+0+4+16}{5}=8$.",
    "points": 0.5,
    "tags": [
      "thống kê",
      "phương sai",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-21",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một túi có 3 bi đỏ và 7 bi xanh cùng kích thước. Bốc ngẫu nhiên một bi. Tính xác suất bốc được bi đỏ (viết dưới dạng số thập phân).",
    "answer": "0,3",
    "explanation": "$P=\\dfrac{3}{10}=0{,}3$.",
    "points": 0.5,
    "tags": [
      "xác suất",
      "cổ điển",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-22",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính trung vị của dãy số $2;\\ 4;\\ 6;\\ 8;\\ 10;\\ 12$.",
    "answer": "7",
    "explanation": "Hai số giữa là $6;8$ nên trung vị $=\\dfrac{6+8}{2}=7$.",
    "points": 0.5,
    "tags": [
      "thống kê",
      "trung vị",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-23",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Gieo hai đồng xu đồng chất. Tính xác suất để có ít nhất một mặt ngửa (viết dưới dạng số thập phân).",
    "answer": "0,75",
    "explanation": "Biến cố đối: không có mặt ngửa nào có xác suất $\\dfrac{1}{4}$, nên $P=1-\\dfrac{1}{4}=\\dfrac{3}{4}=0{,}75$.",
    "points": 0.5,
    "tags": [
      "xác suất",
      "biến cố đối",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-24",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính độ lệch chuẩn (làm tròn đến hàng phần trăm) của dãy số $2;\\ 4;\\ 4;\\ 6;\\ 9$.",
    "answer": "2,37",
    "explanation": "$\\bar{x}=5$; $s^2=\\dfrac{9+1+1+1+16}{5}=5{,}6$; $s=\\sqrt{5{,}6} \\approx 2{,}37$.",
    "points": 0.5,
    "tags": [
      "thống kê",
      "độ lệch chuẩn",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t10-xacsuat-thongke-25",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Chọn ngẫu nhiên 2 học sinh từ nhóm gồm 3 nam và 4 nữ. Có bao nhiêu cách chọn để được đúng 1 nam và 1 nữ?",
    "answer": "12",
    "explanation": "Chọn 1 nam (3 cách) và 1 nữ (4 cách): $3 \\cdot 4=12$.",
    "points": 0.5,
    "tags": [
      "xác suất",
      "quy tắc nhân",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-01",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Đạo hàm của hàm số $y=x^3$ là",
    "options": [
      {
        "key": "A",
        "text": "$3x$"
      },
      {
        "key": "B",
        "text": "$3x^2$"
      },
      {
        "key": "C",
        "text": "$x^2$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{x^4}{4}$"
      }
    ],
    "answer": "B",
    "explanation": "Công thức $(x^n)'=nx^{n-1}$ với $n=3$.",
    "points": 0.25,
    "tags": [
      "đạo hàm",
      "quy tắc tính đạo hàm",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-02",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Đạo hàm của hàm số $y=5x+2$ là",
    "options": [
      {
        "key": "A",
        "text": "$5$"
      },
      {
        "key": "B",
        "text": "$7$"
      },
      {
        "key": "C",
        "text": "$2$"
      },
      {
        "key": "D",
        "text": "$5x$"
      }
    ],
    "answer": "A",
    "explanation": "$y'=5$.",
    "points": 0.25,
    "tags": [
      "đạo hàm",
      "quy tắc tính đạo hàm",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-03",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $y=x^2-3x$. Giá trị $y'(2)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$-2$"
      },
      {
        "key": "B",
        "text": "$-1$"
      },
      {
        "key": "C",
        "text": "$1$"
      },
      {
        "key": "D",
        "text": "$4$"
      }
    ],
    "answer": "C",
    "explanation": "$y'=2x-3$ nên $y'(2)=1$.",
    "points": 0.25,
    "tags": [
      "đạo hàm",
      "giá trị đạo hàm",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-04",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Đạo hàm của hàm số $y=\\sin x$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\tan x$"
      },
      {
        "key": "B",
        "text": "$-\\cos x$"
      },
      {
        "key": "C",
        "text": "$\\sin x$"
      },
      {
        "key": "D",
        "text": "$\\cos x$"
      }
    ],
    "answer": "D",
    "explanation": "$(\\sin x)'=\\cos x$.",
    "points": 0.25,
    "tags": [
      "đạo hàm",
      "lượng giác",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-05",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Phương trình tiếp tuyến của đồ thị $y=x^2$ tại điểm có hoành độ $x_0=1$ là",
    "options": [
      {
        "key": "A",
        "text": "$y=x-1$"
      },
      {
        "key": "B",
        "text": "$y=2x-1$"
      },
      {
        "key": "C",
        "text": "$y=2x+1$"
      },
      {
        "key": "D",
        "text": "$y=x+2$"
      }
    ],
    "answer": "B",
    "explanation": "$y'(1)=2$, tiếp điểm $(1;1)$: $y=2(x-1)+1=2x-1$.",
    "points": 0.25,
    "tags": [
      "đạo hàm",
      "tiếp tuyến",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-06",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Đồ thị $y=x^2$ và tiếp tuyến tại điểm $A(1;1)$ như hình. Hệ số góc của tiếp tuyến là",
    "options": [
      {
        "key": "A",
        "text": "$1$"
      },
      {
        "key": "B",
        "text": "$-2$"
      },
      {
        "key": "C",
        "text": "$2$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{2}$"
      }
    ],
    "answer": "C",
    "explanation": "Hệ số góc tiếp tuyến tại $x_0$ bằng $y'(x_0)=2x_0=2$.",
    "points": 0.25,
    "tags": [
      "đạo hàm",
      "tiếp tuyến",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^2",
        "2x-1"
      ],
      "xMin": -2,
      "xMax": 4,
      "yMin": -2,
      "yMax": 8,
      "labels": true,
      "points": "A(1; 1)"
    }
  },
  {
    "id": "thpt-t11-daoham-07",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật chuyển động với quãng đường $s(t)=t^2+3t$ (m), $t$ tính bằng giây. Vận tốc của vật tại thời điểm $t=2$ s là",
    "options": [
      {
        "key": "A",
        "text": "$7$ m/s"
      },
      {
        "key": "B",
        "text": "$10$ m/s"
      },
      {
        "key": "C",
        "text": "$4$ m/s"
      },
      {
        "key": "D",
        "text": "$5$ m/s"
      }
    ],
    "answer": "A",
    "explanation": "$v(t)=s'(t)=2t+3$ nên $v(2)=7$ m/s.",
    "points": 0.25,
    "tags": [
      "đạo hàm",
      "vận tốc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-08",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hàm số $y=\\dfrac{2x+1}{x-1}$. Giá trị $y'(2)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$3$"
      },
      {
        "key": "B",
        "text": "$-\\dfrac{1}{3}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{1}{3}$"
      },
      {
        "key": "D",
        "text": "$-3$"
      }
    ],
    "answer": "D",
    "explanation": "$y'=\\dfrac{2(x-1)-(2x+1)}{(x-1)^2}=\\dfrac{-3}{(x-1)^2}$ nên $y'(2)=-3$.",
    "points": 0.25,
    "tags": [
      "đạo hàm",
      "hàm phân thức",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-09",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Đạo hàm của hàm số $y=\\cos x$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\cos x$"
      },
      {
        "key": "B",
        "text": "$-\\sin x$"
      },
      {
        "key": "C",
        "text": "$\\sin x$"
      },
      {
        "key": "D",
        "text": "$-\\cos x$"
      }
    ],
    "answer": "B",
    "explanation": "$(\\cos x)'=-\\sin x$.",
    "points": 0.25,
    "tags": [
      "đạo hàm",
      "lượng giác",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-10",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Đạo hàm của hàm số $y=\\sqrt{x}$ với $x>0$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{\\sqrt{x}}$"
      },
      {
        "key": "B",
        "text": "$2\\sqrt{x}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{1}{2\\sqrt{x}}$"
      },
      {
        "key": "D",
        "text": "$\\sqrt{x}$"
      }
    ],
    "answer": "C",
    "explanation": "$y=\\dfrac{1}{2}x^{\\frac{1}{2}}$ nên $y'=\\dfrac{1}{2} \\cdot \\dfrac{1}{2}x^{-\\frac{1}{2}}=\\dfrac{1}{2\\sqrt{x}}$.",
    "points": 0.25,
    "tags": [
      "đạo hàm",
      "căn thức",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-11",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật chuyển động với quãng đường $s(t)=2t^3$ (m). Gia tốc của vật tại thời điểm $t=1$ s là",
    "options": [
      {
        "key": "A",
        "text": "$6$ m/s$^2$"
      },
      {
        "key": "B",
        "text": "$12$ m/s$^2$"
      },
      {
        "key": "C",
        "text": "$2$ m/s$^2$"
      },
      {
        "key": "D",
        "text": "$24$ m/s$^2$"
      }
    ],
    "answer": "B",
    "explanation": "$v=6t^2$, gia tốc $a=v'=12t$ nên $a(1)=12$ m/s$^2$.",
    "points": 0.25,
    "tags": [
      "đạo hàm",
      "gia tốc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-12",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Có bao nhiêu tiếp tuyến của đồ thị $y=x^3-3x$ song song với đường thẳng $d: y=9x+1$?",
    "options": [
      {
        "key": "A",
        "text": "$2$"
      },
      {
        "key": "B",
        "text": "$1$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$0$"
      }
    ],
    "answer": "A",
    "explanation": "$y'=3x^2-3=9 \\Leftrightarrow x^2=4 \\Leftrightarrow x=\\pm 2$: 2 tiếp tuyến.",
    "points": 0.25,
    "tags": [
      "đạo hàm",
      "tiếp tuyến",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-13",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=x^2-4x+3$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$y'=2x-4$"
      },
      {
        "key": "b",
        "text": "$y'(0)=-4$"
      },
      {
        "key": "c",
        "text": "$y'=0$ tại $x=2$"
      },
      {
        "key": "d",
        "text": "$y'(1)=-3$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) $-4$ — đúng. c) $2x-4=0 \\Leftrightarrow x=2$ — đúng. d) $y'(1)=-2 \\ne -3$ — sai.",
    "points": 1,
    "tags": [
      "đạo hàm",
      "quy tắc tính đạo hàm",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-14",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét tiếp tuyến của đồ thị $y=\\sqrt{x}$ tại $x_0=4$ (hình vẽ). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$y'(4)=\\dfrac{1}{4}$"
      },
      {
        "key": "b",
        "text": "Tiếp điểm là $(2;4)$"
      },
      {
        "key": "c",
        "text": "Phương trình tiếp tuyến là $y=\\dfrac{x}{4}+1$"
      },
      {
        "key": "d",
        "text": "Hệ số góc của tiếp tuyến là 2"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) $y'=\\dfrac{1}{2\\sqrt{x}}$, $y'(4)=\\dfrac{1}{4}$ — đúng. b) Tiếp điểm $(4;2)$ — sai. c) $y=\\dfrac{1}{4}(x-4)+2=\\dfrac{x}{4}+1$ — đúng. d) Hệ số góc $\\dfrac{1}{4}$ — sai.",
    "points": 1,
    "tags": [
      "đạo hàm",
      "tiếp tuyến",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "sqrt(x)"
      ],
      "xMin": 0,
      "xMax": 9,
      "yMin": -1,
      "yMax": 4,
      "labels": true,
      "points": "A(4; 2)"
    }
  },
  {
    "id": "thpt-t11-daoham-15",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Một vật chuyển động với quãng đường $s(t)=-5t^2+20t$ (m), $t$ tính bằng giây. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Vận tốc $v(t)=-10t+20$ (m/s)"
      },
      {
        "key": "b",
        "text": "Vận tốc bằng 0 tại $t=3$ s"
      },
      {
        "key": "c",
        "text": "Gia tốc của vật là $-10$ m/s$^2$"
      },
      {
        "key": "d",
        "text": "$v(3)=20$ m/s"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) $v=0 \\Leftrightarrow t=2$ s — sai. c) $a=v'=-10$ — đúng. d) $v(3)=10 \\ne 20$ — sai.",
    "points": 1,
    "tags": [
      "đạo hàm",
      "vận tốc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-16",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về các quy tắc đạo hàm (với $u, v$ là các hàm số khả vi, $c$ hằng số):",
    "options": [
      {
        "key": "a",
        "text": "$(uv)'=u'v'$"
      },
      {
        "key": "b",
        "text": "$(u+v)'=u'+v'$"
      },
      {
        "key": "c",
        "text": "$\\left(\\dfrac{u}{v}\\right)'=\\dfrac{u'v-uv'}{v^2}$ với $v \\ne 0$"
      },
      {
        "key": "d",
        "text": "$(cu)'=cu'$"
      }
    ],
    "answer": "SĐĐĐ",
    "explanation": "a) Sai, đúng là $(uv)'=u'v+uv'$. b) Đúng. c) Đúng. d) Đúng.",
    "points": 1,
    "tags": [
      "đạo hàm",
      "quy tắc đạo hàm",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-17",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=x^3-3x^2$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$y'=3x^2-6x$"
      },
      {
        "key": "b",
        "text": "$y'=0$ tại $x=0$ và $x=-2$"
      },
      {
        "key": "c",
        "text": "Đạo hàm cấp hai $y''=6x-6$"
      },
      {
        "key": "d",
        "text": "$y''(0)=6$"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) $3x^2-6x=0 \\Leftrightarrow x=0$ hoặc $x=2$ — sai. c) Đúng. d) $y''(0)=-6 \\ne 6$ — sai.",
    "points": 1,
    "tags": [
      "đạo hàm",
      "đạo hàm cấp hai",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-18",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét tiếp tuyến của đồ thị $y=x^3$ tại điểm có hoành độ $x_0=1$ (hình vẽ). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Tiếp điểm là $(1;1)$"
      },
      {
        "key": "b",
        "text": "$y'(1)=3$"
      },
      {
        "key": "c",
        "text": "Phương trình tiếp tuyến là $y=3x+2$"
      },
      {
        "key": "d",
        "text": "Tiếp tuyến cắt trục $Ox$ tại điểm có hoành độ $\\dfrac{2}{3}$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) $3x^2=3$ — đúng. c) $y=3(x-1)+1=3x-2 \\ne 3x+2$ — sai. d) $3x-2=0 \\Leftrightarrow x=\\dfrac{2}{3}$ — đúng.",
    "points": 1,
    "tags": [
      "đạo hàm",
      "tiếp tuyến",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^3"
      ],
      "xMin": -2,
      "xMax": 3,
      "yMin": -3,
      "yMax": 9,
      "labels": true,
      "points": "A(1; 1)"
    }
  },
  {
    "id": "thpt-t11-daoham-19",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $y=x^4-2x$. Tính $y'(1)$.",
    "answer": "2",
    "explanation": "$y'=4x^3-2$ nên $y'(1)=2$.",
    "points": 0.5,
    "tags": [
      "đạo hàm",
      "giá trị đạo hàm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-20",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $y=x\\cos x$. Tính $y'\\left(\\dfrac{\\pi}{2}\\right)$ (làm tròn đến hàng phần mười).",
    "answer": "-1,6",
    "explanation": "$y'=\\cos x-x\\sin x$ nên $y'\\left(\\dfrac{\\pi}{2}\\right)=0-\\dfrac{\\pi}{2} \\approx -1{,}6$.",
    "points": 0.5,
    "tags": [
      "đạo hàm",
      "tích",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-21",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Vật chuyển động với quãng đường $s(t)=3t^2$ (m). Tính vận tốc tại $t=2$ s.",
    "answer": "12",
    "explanation": "$v=6t$ nên $v(2)=12$ m/s.",
    "points": 0.5,
    "tags": [
      "đạo hàm",
      "vận tốc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-22",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $y=2^x$. Tính $y'(0)$ (làm tròn đến hàng phần trăm).",
    "answer": "0,69",
    "explanation": "$y'=2^x \\ln 2$ nên $y'(0)=\\ln 2 \\approx 0{,}69$.",
    "points": 0.5,
    "tags": [
      "đạo hàm",
      "hàm mũ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-23",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính hệ số góc của tiếp tuyến với đồ thị $y=\\ln x$ tại điểm có hoành độ $x_0=1$.",
    "answer": "1",
    "explanation": "$y'=\\dfrac{1}{x}$ nên hệ số góc là $1$.",
    "points": 0.5,
    "tags": [
      "đạo hàm",
      "tiếp tuyến",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-24",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tiếp tuyến của $y=x^3+ax$ tại $x=1$ là $y=5x+b$. Tính $a+b$.",
    "answer": "0",
    "explanation": "$y'(1)=3+a=5 \\Rightarrow a=2$; tiếp điểm $(1;3)$: $3=5+b \\Rightarrow b=-2$. Vậy $a+b=0$.",
    "points": 0.5,
    "tags": [
      "đạo hàm",
      "tiếp tuyến",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-daoham-25",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Vật chuyển động với quãng đường $s(t)=t^3-6t^2+9t$ (m). Vận tốc của vật có bao nhiêu thời điểm (t > 0) bằng 0?",
    "answer": "2",
    "explanation": "$v=3t^2-12t+9=0 \\Leftrightarrow t=1$ hoặc $t=3$: 2 thời điểm.",
    "points": 0.5,
    "tags": [
      "đạo hàm",
      "vận tốc",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-01",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Dãy số $2;\\ 5;\\ 8;\\ 11;\\ \\ldots$ là một cấp số cộng với công sai",
    "options": [
      {
        "key": "A",
        "text": "$2$"
      },
      {
        "key": "B",
        "text": "$3$"
      },
      {
        "key": "C",
        "text": "$4$"
      },
      {
        "key": "D",
        "text": "$5$"
      }
    ],
    "answer": "B",
    "explanation": "Hiệu hai số hạng liên tiếp đều bằng $3$.",
    "points": 0.25,
    "tags": [
      "dãy số",
      "cấp số cộng",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-02",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Dãy số $3;\\ 6;\\ 12;\\ 24;\\ \\ldots$ là một cấp số nhân với công bội",
    "options": [
      {
        "key": "A",
        "text": "$3$"
      },
      {
        "key": "B",
        "text": "$4$"
      },
      {
        "key": "C",
        "text": "$2$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{2}$"
      }
    ],
    "answer": "C",
    "explanation": "Thương hai số hạng liên tiếp đều bằng $2$.",
    "points": 0.25,
    "tags": [
      "dãy số",
      "cấp số nhân",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-03",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cấp số cộng có $u_1=3$, công sai $d=4$. Số hạng $u_{10}$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$39$"
      },
      {
        "key": "B",
        "text": "$43$"
      },
      {
        "key": "C",
        "text": "$36$"
      },
      {
        "key": "D",
        "text": "$40$"
      }
    ],
    "answer": "A",
    "explanation": "$u_{10}=3+9 \\cdot 4=39$.",
    "points": 0.25,
    "tags": [
      "dãy số",
      "cấp số cộng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-04",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cấp số nhân có $u_1=5$, công bội $q=3$. Số hạng $u_4$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$45$"
      },
      {
        "key": "B",
        "text": "$60$"
      },
      {
        "key": "C",
        "text": "$15$"
      },
      {
        "key": "D",
        "text": "$135$"
      }
    ],
    "answer": "D",
    "explanation": "$u_4=5 \\cdot 3^3=135$.",
    "points": 0.25,
    "tags": [
      "dãy số",
      "cấp số nhân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-05",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Tính tổng 100 số tự nhiên chẵn đầu tiên: $2+4+6+\\cdots+200$.",
    "options": [
      {
        "key": "A",
        "text": "$5\\,050$"
      },
      {
        "key": "B",
        "text": "$10\\,100$"
      },
      {
        "key": "C",
        "text": "$20\\,200$"
      },
      {
        "key": "D",
        "text": "$10\\,000$"
      }
    ],
    "answer": "B",
    "explanation": "CSC 100 số hạng với $u_1=2$, $u_{100}=200$: $S=\\dfrac{100(2+200)}{2}=10\\,100$.",
    "points": 0.25,
    "tags": [
      "dãy số",
      "tổng cấp số cộng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-06",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cấp số cộng có $u_5=11$ và $u_{10}=21$. Số hạng đầu $u_1$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$1$"
      },
      {
        "key": "B",
        "text": "$2$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$5$"
      }
    ],
    "answer": "C",
    "explanation": "$5d=21-11=10 \\Rightarrow d=2$; $u_1=11-4 \\cdot 2=3$.",
    "points": 0.25,
    "tags": [
      "dãy số",
      "cấp số cộng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-07",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Số cây trồng mới mỗi năm của một xã (biểu đồ như hình) tăng theo cấp số cộng. Dự đoán số cây trồng mới năm 2026 là",
    "options": [
      {
        "key": "A",
        "text": "$350$"
      },
      {
        "key": "B",
        "text": "$300$"
      },
      {
        "key": "C",
        "text": "$450$"
      },
      {
        "key": "D",
        "text": "$400$"
      }
    ],
    "answer": "D",
    "explanation": "Công sai $50$; năm 2026 là số hạng sau 2024 thêm 2 bậc: $300+2 \\cdot 50=400$.",
    "points": 0.25,
    "tags": [
      "dãy số",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "line",
      "title": "Số cây trồng mới theo năm",
      "xLabel": "Năm",
      "yLabel": "Số cây",
      "data": "2020; 2021; 2022; 2023; 2024\nSố cây: 100; 150; 200; 250; 300"
    }
  },
  {
    "id": "thpt-t11-dayso-08",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một người gửi 10 triệu đồng vào ngân hàng với lãi suất kép $8\\%$/năm (tiền lãi nhập vốn mỗi năm). Sau 5 năm, người đó nhận được (làm tròn đến hàng phần trăm triệu đồng)",
    "options": [
      {
        "key": "A",
        "text": "$14{,}00$ triệu"
      },
      {
        "key": "B",
        "text": "$14{,}69$ triệu"
      },
      {
        "key": "C",
        "text": "$15{,}00$ triệu"
      },
      {
        "key": "D",
        "text": "$13{,}68$ triệu"
      }
    ],
    "answer": "B",
    "explanation": "Số tiền $=10 \\cdot 1{,}08^5 \\approx 14{,}69$ triệu đồng.",
    "points": 0.25,
    "tags": [
      "dãy số",
      "lãi kép",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-09",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cấp số nhân có $u_3=12$ và $u_5=48$ với các số hạng dương. Công bội $q$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$2$"
      },
      {
        "key": "B",
        "text": "$4$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "D",
        "text": "$3$"
      }
    ],
    "answer": "A",
    "explanation": "$q^2=\\dfrac{u_5}{u_3}=4$ nên $q=2$ (dương).",
    "points": 0.25,
    "tags": [
      "dãy số",
      "cấp số nhân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-10",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong các dãy số sau, dãy nào là cấp số cộng?",
    "options": [
      {
        "key": "A",
        "text": "$1;\\ 4;\\ 9;\\ 16$"
      },
      {
        "key": "B",
        "text": "$2;\\ 4;\\ 8;\\ 16$"
      },
      {
        "key": "C",
        "text": "$3;\\ 7;\\ 11;\\ 15$"
      },
      {
        "key": "D",
        "text": "$1;\\ 1;\\ 2;\\ 3$"
      }
    ],
    "answer": "C",
    "explanation": "Dãy $3;7;11;15$ có hiệu hai số hạng liên tiếp đều bằng $4$.",
    "points": 0.25,
    "tags": [
      "dãy số",
      "cấp số cộng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-11",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Tính tổng 20 số lẻ đầu tiên: $1+3+5+\\cdots+39$.",
    "options": [
      {
        "key": "A",
        "text": "$200$"
      },
      {
        "key": "B",
        "text": "$360$"
      },
      {
        "key": "C",
        "text": "$400$"
      },
      {
        "key": "D",
        "text": "$420$"
      }
    ],
    "answer": "C",
    "explanation": "Tổng $n$ số lẻ đầu tiên bằng $n^2=400$.",
    "points": 0.25,
    "tags": [
      "dãy số",
      "tổng cấp số cộng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-12",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vi khuẩn nhân đôi số lượng sau mỗi 20 phút. Ban đầu có 500 con. Sau 2 giờ, số vi khuẩn là",
    "options": [
      {
        "key": "A",
        "text": "$3\\,000$"
      },
      {
        "key": "B",
        "text": "$8\\,000$"
      },
      {
        "key": "C",
        "text": "$16\\,000$"
      },
      {
        "key": "D",
        "text": "$32\\,000$"
      }
    ],
    "answer": "D",
    "explanation": "2 giờ có 6 chu kì nhân đôi: $500 \\cdot 2^6=32\\,000$.",
    "points": 0.25,
    "tags": [
      "dãy số",
      "tăng trưởng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-13",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét cấp số cộng $5;\\ 9;\\ 13;\\ \\ldots$ Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Công sai $d=4$"
      },
      {
        "key": "b",
        "text": "$u_{10}=41$"
      },
      {
        "key": "c",
        "text": "$u_{20}=81$"
      },
      {
        "key": "d",
        "text": "Tổng 10 số hạng đầu bằng 250"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) $5+9 \\cdot 4=41$ — đúng. c) $5+19 \\cdot 4=81$ — đúng. d) $S_{10}=\\dfrac{10(5+41)}{2}=230 \\ne 250$ — sai.",
    "points": 1,
    "tags": [
      "dãy số",
      "cấp số cộng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-14",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét cấp số nhân $2;\\ 6;\\ 18;\\ \\ldots$ Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Công bội $q=3$"
      },
      {
        "key": "b",
        "text": "$u_5=162$"
      },
      {
        "key": "c",
        "text": "$u_6=324$"
      },
      {
        "key": "d",
        "text": "Tổng 5 số hạng đầu bằng 242"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) $2 \\cdot 3^4=162$ — đúng. c) $u_6=2 \\cdot 3^5=486 \\ne 324$ — sai. d) $2+6+18+54+162=242$ — đúng.",
    "points": 1,
    "tags": [
      "dãy số",
      "cấp số nhân",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-15",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Một người gửi 20 triệu đồng với lãi suất đơn $6\\%$/năm trong 3 năm (không nhập lãi). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Tiền lãi mỗi năm là 1,2 triệu đồng"
      },
      {
        "key": "b",
        "text": "Tổng tiền lãi sau 3 năm là 3,6 triệu đồng"
      },
      {
        "key": "c",
        "text": "Tổng số tiền nhận được cuối kì là 23,6 triệu đồng"
      },
      {
        "key": "d",
        "text": "Tiền lãi năm thứ ba nhiều hơn tiền lãi năm thứ nhất"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) $20 \\cdot 6\\%=1{,}2$ — đúng. b) $3 \\cdot 1{,}2=3{,}6$ — đúng. c) $20+3{,}6=23{,}6$ — đúng. d) Lãi đơn không đổi theo năm — sai.",
    "points": 1,
    "tags": [
      "dãy số",
      "lãi suất",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-16",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét cấp số cộng có $u_1=-3$, công sai $d=5$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$u_5=17$"
      },
      {
        "key": "b",
        "text": "$u_{50}=250$"
      },
      {
        "key": "c",
        "text": "Dãy số là dãy tăng"
      },
      {
        "key": "d",
        "text": "$u_{100}=492$"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) $-3+4 \\cdot 5=17$ — đúng. b) $-3+49 \\cdot 5=242 \\ne 250$ — sai. c) $d=5>0$ — đúng. d) $-3+99 \\cdot 5=492$ — đúng.",
    "points": 1,
    "tags": [
      "dãy số",
      "cấp số cộng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-17",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Một người gửi 50 triệu đồng với lãi suất kép $10\\%$/năm (lãi nhập vốn mỗi năm). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Sau 1 năm nhận được 55 triệu đồng"
      },
      {
        "key": "b",
        "text": "Sau 2 năm nhận được 60,5 triệu đồng"
      },
      {
        "key": "c",
        "text": "Sau 3 năm nhận được 66 triệu đồng"
      },
      {
        "key": "d",
        "text": "Tiền lãi của năm thứ hai là 5,5 triệu đồng"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $50 \\cdot 1{,}1=55$ — đúng. b) $55 \\cdot 1{,}1=60{,}5$ — đúng. c) $60{,}5 \\cdot 1{,}1=66{,}55 \\ne 66$ — sai. d) $60{,}5-55=5{,}5$ — đúng.",
    "points": 1,
    "tags": [
      "dãy số",
      "lãi kép",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-18",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Nhiệt độ lúc 6 giờ sáng mỗi ngày trong một tuần: $24;\\ 25;\\ 25;\\ 26;\\ 27;\\ 27;\\ 28$ (biểu đồ như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Dãy nhiệt độ là một cấp số cộng"
      },
      {
        "key": "b",
        "text": "Trung vị của dãy là 26"
      },
      {
        "key": "c",
        "text": "Mốt của dãy là 25"
      },
      {
        "key": "d",
        "text": "Số trung bình của dãy là 26"
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "a) Hiệu các số hạng liên tiếp không bằng nhau ($1;0;1;1;0;1$) — sai. b) Số giữa của 7 số là 26 — đúng. c) Cả 25 và 27 đều xuất hiện 2 lần nên dãy có hai mốt — sai. d) $\\dfrac{182}{7}=26$ — đúng.",
    "points": 1,
    "tags": [
      "dãy số",
      "thống kê",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "line",
      "title": "Nhiệt độ 6 giờ sáng trong tuần",
      "xLabel": "Ngày",
      "yLabel": "Nhiệt độ (°C)",
      "data": "Hai; Ba; Tư; Năm; Sáu; Bảy; CN\nNhiệt độ: 24; 25; 25; 26; 27; 27; 28"
    }
  },
  {
    "id": "thpt-t11-dayso-19",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cấp số cộng có $u_1=2$, công sai $d=6$. Tính $u_8$.",
    "answer": "44",
    "explanation": "$u_8=2+7 \\cdot 6=44$.",
    "points": 0.5,
    "tags": [
      "dãy số",
      "cấp số cộng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-20",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cấp số nhân có $u_2=6$ và $u_5=48$ với các số hạng dương. Tính $u_7$.",
    "answer": "192",
    "explanation": "$q^3=\\dfrac{48}{6}=8 \\Rightarrow q=2$; $u_1=3$; $u_7=3 \\cdot 2^6=192$.",
    "points": 0.5,
    "tags": [
      "dãy số",
      "cấp số nhân",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-21",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính tổng 30 số lẻ đầu tiên: $1+3+5+\\cdots+59$.",
    "answer": "900",
    "explanation": "Tổng $n$ số lẻ đầu tiên bằng $n^2=30^2=900$.",
    "points": 0.5,
    "tags": [
      "dãy số",
      "tổng cấp số cộng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-22",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cấp số nhân có $u_1=81$, công bội $q=\\dfrac{1}{3}$. Tính $u_4$.",
    "answer": "3",
    "explanation": "$u_4=81 \\cdot \\left(\\dfrac{1}{3}\\right)^3=81 \\cdot \\dfrac{1}{27}=3$.",
    "points": 0.5,
    "tags": [
      "dãy số",
      "cấp số nhân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-23",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Gửi tiền với lãi kép $5\\%$/năm. Sau ít nhất bao nhiêu năm thì số tiền nhận được không nhỏ hơn gấp đôi số tiền ban đầu?",
    "answer": "15",
    "explanation": "$1{,}05^{n} \\ge 2 \\Leftrightarrow n \\ge \\log_{1{,}05}2 \\approx 14{,}2$; $1{,}05^{14}\\approx 1{,}98<2$, $1{,}05^{15}\\approx 2{,}08$. Vậy 15 năm.",
    "points": 0.5,
    "tags": [
      "dãy số",
      "lãi kép",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-24",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cấp số cộng $(u_n)$ có $u_1+u_{20}=30$. Tính $S_{20}$.",
    "answer": "300",
    "explanation": "$S_{20}=\\dfrac{20(u_1+u_{20})}{2}=10 \\cdot 30=300$.",
    "points": 0.5,
    "tags": [
      "dãy số",
      "tổng cấp số cộng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-dayso-25",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Ba số dương lập thành cấp số nhân, có tổng bằng 21 và tích bằng 216. Tìm số lớn nhất trong ba số đó.",
    "answer": "12",
    "explanation": "Gọi ba số $\\dfrac{a}{r}; a; ar$: tích $a^3=216 \\Rightarrow a=6$; tổng $\\dfrac{6}{r}+6+6r=21 \\Rightarrow 2r^2-5r+2=0 \\Rightarrow r=2$. Ba số $3;6;12$, số lớn nhất $12$.",
    "points": 0.5,
    "tags": [
      "dãy số",
      "cấp số nhân",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-01",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho dãy $u_n=\\dfrac{2n+1}{n+3}$. Khi đó $\\lim u_n$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$1$"
      },
      {
        "key": "B",
        "text": "$2$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{2}$"
      }
    ],
    "answer": "B",
    "explanation": "Chia tử và mẫu cho $n$: $\\lim \\dfrac{2+\\frac{1}{n}}{1+\\frac{3}{n}}=2$.",
    "points": 0.25,
    "tags": [
      "giới hạn",
      "giới hạn dãy",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-02",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "$\\lim\\limits_{x \\to 2}(3x-1)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$4$"
      },
      {
        "key": "B",
        "text": "$6$"
      },
      {
        "key": "C",
        "text": "$5$"
      },
      {
        "key": "D",
        "text": "$3$"
      }
    ],
    "answer": "C",
    "explanation": "Hàm đa thức liên tục: $3 \\cdot 2-1=5$.",
    "points": 0.25,
    "tags": [
      "giới hạn",
      "giới hạn hàm số",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-03",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "$\\lim \\dfrac{5n^2+3n}{n^2+1}$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$5$"
      },
      {
        "key": "B",
        "text": "$3$"
      },
      {
        "key": "C",
        "text": "$+\\infty$"
      },
      {
        "key": "D",
        "text": "$0$"
      }
    ],
    "answer": "A",
    "explanation": "Chia cho $n^2$: $\\lim \\dfrac{5+\\frac{3}{n}}{1+\\frac{1}{n^2}}=5$.",
    "points": 0.25,
    "tags": [
      "giới hạn",
      "giới hạn dãy",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-04",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "$\\lim\\limits_{x \\to 1}\\dfrac{x^2-1}{x-1}$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$0$"
      },
      {
        "key": "B",
        "text": "$2$"
      },
      {
        "key": "C",
        "text": "$1$"
      },
      {
        "key": "D",
        "text": "$+\\infty$"
      }
    ],
    "answer": "B",
    "explanation": "$\\dfrac{x^2-1}{x-1}=x+1$ khi $x \\ne 1$ nên giới hạn bằng $2$.",
    "points": 0.25,
    "tags": [
      "giới hạn",
      "dạng 0/0",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-05",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cấp số nhân lùi vô hạn có số hạng đầu $u_1=8$, công bội $q=\\dfrac{1}{4}$. Tổng của cấp số nhân là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{16}{3}$"
      },
      {
        "key": "B",
        "text": "$12$"
      },
      {
        "key": "C",
        "text": "$24$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{32}{3}$"
      }
    ],
    "answer": "D",
    "explanation": "$S=\\dfrac{u_1}{1-q}=\\dfrac{8}{\\frac{3}{4}}=\\dfrac{32}{3}$.",
    "points": 0.25,
    "tags": [
      "giới hạn",
      "cấp số nhân lùi vô hạn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-06",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "$\\lim \\dfrac{4n+1}{2n^2+3}$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$2$"
      },
      {
        "key": "B",
        "text": "$4$"
      },
      {
        "key": "C",
        "text": "$0$"
      },
      {
        "key": "D",
        "text": "$+\\infty$"
      }
    ],
    "answer": "C",
    "explanation": "Bậc tử nhỏ hơn bậc mẫu nên giới hạn bằng $0$.",
    "points": 0.25,
    "tags": [
      "giới hạn",
      "giới hạn dãy",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-07",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Hàm số $f(x)=\\dfrac{x^2-4}{x-2}$ có đồ thị như hình (không xác định tại $x=2$). $\\lim\\limits_{x \\to 2}f(x)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$4$"
      },
      {
        "key": "B",
        "text": "$2$"
      },
      {
        "key": "C",
        "text": "$0$"
      },
      {
        "key": "D",
        "text": "không tồn tại"
      }
    ],
    "answer": "A",
    "explanation": "Với $x \\ne 2$: $f(x)=x+2$ nên giới hạn bằng $4$.",
    "points": 0.25,
    "tags": [
      "giới hạn",
      "đồ thị",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x+2"
      ],
      "xMin": -2,
      "xMax": 5,
      "yMin": -2,
      "yMax": 8,
      "labels": true
    }
  },
  {
    "id": "thpt-t11-gioihan-08",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "$\\lim\\limits_{x \\to +\\infty}\\left(\\sqrt{x^2+1}-x\\right)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$1$"
      },
      {
        "key": "B",
        "text": "$+\\infty$"
      },
      {
        "key": "C",
        "text": "$0$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{2}$"
      }
    ],
    "answer": "C",
    "explanation": "Nhân liên hợp: $\\dfrac{1}{\\sqrt{x^2+1}+x} \\to 0$.",
    "points": 0.25,
    "tags": [
      "giới hạn",
      "dạng vô định",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-09",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Hàm số $y=f(x)$ liên tục tại điểm $x_0$ khi và chỉ khi",
    "options": [
      {
        "key": "A",
        "text": "$f$ xác định tại $x_0$"
      },
      {
        "key": "B",
        "text": "$\\lim\\limits_{x \\to x_0}f(x)=f(x_0)$"
      },
      {
        "key": "C",
        "text": "$\\lim\\limits_{x \\to x_0}f(x)$ tồn tại"
      },
      {
        "key": "D",
        "text": "$f(x_0)>0$"
      }
    ],
    "answer": "B",
    "explanation": "Theo định nghĩa tính liên tục.",
    "points": 0.25,
    "tags": [
      "giới hạn",
      "liên tục",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-10",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "$\\lim\\limits_{x \\to 0}\\sin x$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$0$"
      },
      {
        "key": "B",
        "text": "$1$"
      },
      {
        "key": "C",
        "text": "không tồn tại"
      },
      {
        "key": "D",
        "text": "$-1$"
      }
    ],
    "answer": "A",
    "explanation": "$\\sin x$ liên tục tại $0$ nên giới hạn bằng $\\sin 0=0$.",
    "points": 0.25,
    "tags": [
      "giới hạn",
      "giới hạn lượng giác",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-11",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cấp số nhân lùi vô hạn có $u_1=6$, $q=-\\dfrac{1}{2}$. Tổng của cấp số nhân là",
    "options": [
      {
        "key": "A",
        "text": "$12$"
      },
      {
        "key": "B",
        "text": "$3$"
      },
      {
        "key": "C",
        "text": "$18$"
      },
      {
        "key": "D",
        "text": "$4$"
      }
    ],
    "answer": "D",
    "explanation": "$S=\\dfrac{6}{1-\\left(-\\frac{1}{2}\\right)}=\\dfrac{6}{\\frac{3}{2}}=4$.",
    "points": 0.25,
    "tags": [
      "giới hạn",
      "cấp số nhân lùi vô hạn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-12",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho dãy $u_n=\\dfrac{an+1}{2n-3}$. Để $\\lim u_n=3$ thì $a$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$3$"
      },
      {
        "key": "B",
        "text": "$6$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{3}{2}$"
      },
      {
        "key": "D",
        "text": "$2$"
      }
    ],
    "answer": "B",
    "explanation": "$\\lim u_n=\\dfrac{a}{2}=3 \\Rightarrow a=6$.",
    "points": 0.25,
    "tags": [
      "giới hạn",
      "tham số",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-13",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét dãy $u_n=\\dfrac{3n-2}{n+1}$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$\\lim u_n=3$"
      },
      {
        "key": "b",
        "text": "Dãy có giới hạn hữu hạn"
      },
      {
        "key": "c",
        "text": "$\\lim u_n=0$"
      },
      {
        "key": "d",
        "text": "$\\lim \\dfrac{n^2}{n^2+1}=1$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) Đúng. c) Giới hạn là 3, không phải 0 — sai. d) Đúng.",
    "points": 1,
    "tags": [
      "giới hạn",
      "giới hạn dãy",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-14",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét cấp số nhân lùi vô hạn. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Điều kiện để có tổng là $|q|<1$ và $q \\ne 0$"
      },
      {
        "key": "b",
        "text": "Với $u_1=9$, $q=\\dfrac{1}{3}$ thì tổng bằng $\\dfrac{27}{2}$"
      },
      {
        "key": "c",
        "text": "Với $u_1=5$, $q=\\dfrac{1}{2}$ thì tổng bằng $10$"
      },
      {
        "key": "d",
        "text": "Với $u_1=4$, $q=\\dfrac{1}{2}$ thì tổng bằng $6$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) $\\dfrac{9}{\\frac{2}{3}}=\\dfrac{27}{2}$ — đúng. c) $\\dfrac{5}{\\frac{1}{2}}=10$ — đúng. d) $\\dfrac{4}{\\frac{1}{2}}=8 \\ne 6$ — sai.",
    "points": 1,
    "tags": [
      "giới hạn",
      "cấp số nhân lùi vô hạn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-15",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét giới hạn $\\lim\\limits_{x \\to 3}\\dfrac{x^2-9}{x-3}$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Thay $x=3$ ta được dạng vô định $\\dfrac{0}{0}$"
      },
      {
        "key": "b",
        "text": "Giới hạn bằng 6"
      },
      {
        "key": "c",
        "text": "Giới hạn bằng 0"
      },
      {
        "key": "d",
        "text": "Hàm số không xác định tại $x=3$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) $\\dfrac{(x-3)(x+3)}{x-3}=x+3 \\to 6$ — đúng. c) Sai. d) Mẫu bằng 0 tại $x=3$ — đúng.",
    "points": 1,
    "tags": [
      "giới hạn",
      "dạng 0/0",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-16",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=x^2$ (đồ thị như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$\\lim\\limits_{x \\to 2}x^2=4$"
      },
      {
        "key": "b",
        "text": "Hàm số liên tục tại $x=2$"
      },
      {
        "key": "c",
        "text": "$\\lim\\limits_{x \\to -1}x^2=-1$"
      },
      {
        "key": "d",
        "text": "Hàm số không liên tục tại $x=0$"
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a), b) Đúng. c) $\\lim_{x\\to-1}x^2=1$ — sai. d) $y=x^2$ liên tục trên $\\mathbb{R}$, kể cả tại $x=0$ — sai.",
    "points": 1,
    "tags": [
      "giới hạn",
      "liên tục",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^2"
      ],
      "xMin": -3,
      "xMax": 3,
      "yMin": -1,
      "yMax": 9,
      "labels": true
    }
  },
  {
    "id": "thpt-t11-gioihan-17",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về các giới hạn:",
    "options": [
      {
        "key": "a",
        "text": "$\\lim\\limits_{x \\to -\\infty}(2x^3-x+1)=-\\infty$"
      },
      {
        "key": "b",
        "text": "$\\lim\\limits_{x \\to +\\infty}\\dfrac{3x^2+1}{x^2-2}=3$"
      },
      {
        "key": "c",
        "text": "$\\lim\\limits_{x \\to \\frac{\\pi}{2}}\\tan x=+\\infty$"
      },
      {
        "key": "d",
        "text": "$\\lim\\limits_{x \\to 0^+}\\dfrac{1}{x}=+\\infty$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) Đúng. c) Giới hạn trái là $-\\infty$, giới hạn phải là $+\\infty$ nên giới hạn không tồn tại — sai. d) Đúng.",
    "points": 1,
    "tags": [
      "giới hạn",
      "giới hạn vô cực",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-18",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về dãy số có giới hạn:",
    "options": [
      {
        "key": "a",
        "text": "Dãy số hội tụ thì bị chặn"
      },
      {
        "key": "b",
        "text": "Dãy số bị chặn thì hội tụ"
      },
      {
        "key": "c",
        "text": "Dãy đơn điệu tăng và bị chặn trên thì hội tụ"
      },
      {
        "key": "d",
        "text": "Dãy $u_n=(-1)^n$ hội tụ"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) Ví dụ $(-1)^n$ bị chặn nhưng phân kỳ — sai. c) Đúng theo định lí. d) Dãy dao động giữa $-1$ và $1$ — sai.",
    "points": 1,
    "tags": [
      "giới hạn",
      "dãy số",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-19",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\lim \\dfrac{n+5}{2n+1}$.",
    "answer": "0,5",
    "explanation": "Chia cho $n$: giới hạn $=\\dfrac{1}{2}=0{,}5$.",
    "points": 0.5,
    "tags": [
      "giới hạn",
      "giới hạn dãy",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-20",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\lim\\limits_{x \\to 1}\\dfrac{x^3-1}{x-1}$.",
    "answer": "3",
    "explanation": "$\\dfrac{(x-1)(x^2+x+1)}{x-1}=x^2+x+1 \\to 3$.",
    "points": 0.5,
    "tags": [
      "giới hạn",
      "dạng 0/0",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-21",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cấp số nhân lùi vô hạn có $u_1=12$, $q=\\dfrac{1}{3}$. Tính tổng của cấp số nhân.",
    "answer": "18",
    "explanation": "$S=\\dfrac{12}{1-\\frac{1}{3}}=\\dfrac{12}{\\frac{2}{3}}=18$.",
    "points": 0.5,
    "tags": [
      "giới hạn",
      "cấp số nhân lùi vô hạn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-22",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\lim\\limits_{x \\to +\\infty}\\left(5-\\dfrac{2}{x}\\right)$.",
    "answer": "5",
    "explanation": "$\\dfrac{2}{x} \\to 0$ nên giới hạn bằng $5$.",
    "points": 0.5,
    "tags": [
      "giới hạn",
      "giới hạn hàm số",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-23",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\lim\\limits_{x \\to 2}\\dfrac{\\sqrt{x+2}-2}{x-2}$.",
    "answer": "0,25",
    "explanation": "Nhân liên hợp: $\\dfrac{1}{\\sqrt{x+2}+2} \\to \\dfrac{1}{4}=0{,}25$.",
    "points": 0.5,
    "tags": [
      "giới hạn",
      "dạng vô định",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-24",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\lim \\left(3+\\left(-\\dfrac{1}{2}\\right)^n\\right)$.",
    "answer": "3",
    "explanation": "$\\left(-\\dfrac{1}{2}\\right)^n \\to 0$ nên giới hạn bằng $3$.",
    "points": 0.5,
    "tags": [
      "giới hạn",
      "giới hạn dãy",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-gioihan-25",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tìm $a$ để $\\lim\\limits_{x \\to +\\infty}\\dfrac{ax+1}{3x-2}=2$.",
    "answer": "6",
    "explanation": "Giới hạn bằng $\\dfrac{a}{3}=2$ nên $a=6$.",
    "points": 0.5,
    "tags": [
      "giới hạn",
      "tham số",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-01",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Số đo $90^\\circ$ đổi ra radian bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{\\pi}{3}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{\\pi}{2}$"
      },
      {
        "key": "C",
        "text": "$\\pi$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{\\pi}{4}$"
      }
    ],
    "answer": "B",
    "explanation": "$90^\\circ=90 \\cdot \\dfrac{\\pi}{180}=\\dfrac{\\pi}{2}$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "đơn vị góc",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-02",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $\\sin \\dfrac{\\pi}{6}$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{\\sqrt{3}}{2}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{\\sqrt{2}}{2}$"
      },
      {
        "key": "D",
        "text": "$1$"
      }
    ],
    "answer": "A",
    "explanation": "$\\sin \\dfrac{\\pi}{6}=\\sin 30^\\circ=\\dfrac{1}{2}$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "giá trị lượng giác",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-03",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong các góc sau, góc nào cùng tia đầu và tia cuối với góc $-135^\\circ$?",
    "options": [
      {
        "key": "A",
        "text": "$45^\\circ$"
      },
      {
        "key": "B",
        "text": "$135^\\circ$"
      },
      {
        "key": "C",
        "text": "$225^\\circ$"
      },
      {
        "key": "D",
        "text": "$315^\\circ$"
      }
    ],
    "answer": "C",
    "explanation": "$-135^\\circ+360^\\circ=225^\\circ$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "góc cùng tia",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-04",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Với mọi góc $\\alpha$, ta có $\\cos(\\pi-\\alpha)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\cos \\alpha$"
      },
      {
        "key": "B",
        "text": "$\\sin \\alpha$"
      },
      {
        "key": "C",
        "text": "$-\\sin \\alpha$"
      },
      {
        "key": "D",
        "text": "$-\\cos \\alpha$"
      }
    ],
    "answer": "D",
    "explanation": "Công thức góc bù: $\\cos(\\pi-\\alpha)=-\\cos \\alpha$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "công thức lượng giác",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-05",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Điểm $M$ trên đường tròn lượng giác ứng với góc $\\dfrac{\\pi}{3}$ (như hình). Tung độ của $M$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{\\sqrt{2}}{2}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{\\sqrt{3}}{2}$"
      },
      {
        "key": "D",
        "text": "$1$"
      }
    ],
    "answer": "C",
    "explanation": "Tung độ của điểm trên đường tròn lượng giác ứng với góc $\\alpha$ là $\\sin \\alpha=\\dfrac{\\sqrt{3}}{2}$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "đường tròn lượng giác",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "trig",
      "angles": "M: pi/3",
      "projections": true,
      "tan": false,
      "values": false,
      "cot": false
    }
  },
  {
    "id": "thpt-t11-luonggiac-06",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $\\sin \\alpha=\\dfrac{3}{5}$ với $0<\\alpha<\\dfrac{\\pi}{2}$. Giá trị của $\\sin 2\\alpha$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{12}{25}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{24}{25}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{6}{25}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{9}{25}$"
      }
    ],
    "answer": "B",
    "explanation": "$\\cos \\alpha=\\dfrac{4}{5}$ nên $\\sin 2\\alpha=2 \\cdot \\dfrac{3}{5} \\cdot \\dfrac{4}{5}=\\dfrac{24}{25}$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "công thức nhân đôi",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-07",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập giá trị của hàm số $y=2\\sin x+1$ là",
    "options": [
      {
        "key": "A",
        "text": "$[-1;3]$"
      },
      {
        "key": "B",
        "text": "$[-2;2]$"
      },
      {
        "key": "C",
        "text": "$[0;3]$"
      },
      {
        "key": "D",
        "text": "$[-3;1]$"
      }
    ],
    "answer": "A",
    "explanation": "$-1 \\le \\sin x \\le 1$ nên $-1 \\le 2\\sin x+1 \\le 3$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "hàm số lượng giác",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-08",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $\\tan \\alpha=\\dfrac{1}{2}$, $\\tan \\beta=\\dfrac{1}{3}$ với $\\alpha, \\beta$ là các góc nhọn. Khi đó $\\alpha+\\beta$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$30^\\circ$"
      },
      {
        "key": "B",
        "text": "$60^\\circ$"
      },
      {
        "key": "C",
        "text": "$90^\\circ$"
      },
      {
        "key": "D",
        "text": "$45^\\circ$"
      }
    ],
    "answer": "D",
    "explanation": "$\\tan(\\alpha+\\beta)=\\dfrac{\\frac{1}{2}+\\frac{1}{3}}{1-\\frac{1}{6}}=\\dfrac{\\frac{5}{6}}{\\frac{5}{6}}=1$ nên $\\alpha+\\beta=45^\\circ$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "công thức cộng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-09",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Với mọi góc $\\alpha$, ta có $\\sin\\left(\\dfrac{\\pi}{2}+\\alpha\\right)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\sin \\alpha$"
      },
      {
        "key": "B",
        "text": "$-\\cos \\alpha$"
      },
      {
        "key": "C",
        "text": "$\\cos \\alpha$"
      },
      {
        "key": "D",
        "text": "$-\\sin \\alpha$"
      }
    ],
    "answer": "C",
    "explanation": "Công thức góc phụ: $\\sin\\left(\\dfrac{\\pi}{2}+\\alpha\\right)=\\cos \\alpha$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "công thức lượng giác",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-10",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Chu kì của hàm số $y=\\cos 2x$ là",
    "options": [
      {
        "key": "A",
        "text": "$2\\pi$"
      },
      {
        "key": "B",
        "text": "$\\pi$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{\\pi}{2}$"
      },
      {
        "key": "D",
        "text": "$4\\pi$"
      }
    ],
    "answer": "B",
    "explanation": "Hàm $y=\\cos bx$ có chu kì $T=\\dfrac{2\\pi}{|b|}=\\pi$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "chu kì",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-11",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Điểm $M$ trên đường tròn lượng giác ứng với góc $150^\\circ$ (như hình). Hoành độ của $M$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{\\sqrt{3}}{2}$"
      },
      {
        "key": "C",
        "text": "$-\\dfrac{1}{2}$"
      },
      {
        "key": "D",
        "text": "$-\\dfrac{\\sqrt{3}}{2}$"
      }
    ],
    "answer": "D",
    "explanation": "Hoành độ của $M$ là $\\cos 150^\\circ=-\\cos 30^\\circ=-\\dfrac{\\sqrt{3}}{2}$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "đường tròn lượng giác",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "trig",
      "angles": "M: 150°",
      "projections": true,
      "tan": false,
      "values": false,
      "cot": false
    }
  },
  {
    "id": "thpt-t11-luonggiac-12",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $\\sin \\alpha+\\cos \\alpha=\\sqrt{2}$. Giá trị của $\\sin \\alpha \\cos \\alpha$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{4}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{\\sqrt{2}}{2}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "D",
        "text": "$1$"
      }
    ],
    "answer": "C",
    "explanation": "Bình phương hai vế: $1+2\\sin \\alpha \\cos \\alpha=2$ nên $\\sin \\alpha \\cos \\alpha=\\dfrac{1}{2}$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "hệ thức lượng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-13",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Điểm $M$ ứng với góc $\\dfrac{\\pi}{4}$ trên đường tròn lượng giác (như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$\\sin \\dfrac{\\pi}{4}=\\dfrac{\\sqrt{2}}{2}$"
      },
      {
        "key": "b",
        "text": "$\\cos \\dfrac{\\pi}{4}=\\dfrac{1}{2}$"
      },
      {
        "key": "c",
        "text": "$\\tan \\dfrac{\\pi}{4}=1$"
      },
      {
        "key": "d",
        "text": "$M$ nằm trên cung phần tư thứ nhất"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đúng. b) $\\cos \\dfrac{\\pi}{4}=\\dfrac{\\sqrt{2}}{2}$ — sai. c) Đúng. d) $\\dfrac{\\pi}{4}$ nằm giữa $0$ và $\\dfrac{\\pi}{2}$ — đúng.",
    "points": 1,
    "tags": [
      "lượng giác",
      "đường tròn lượng giác",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "trig",
      "angles": "M: pi/4",
      "projections": true,
      "tan": false,
      "values": false,
      "cot": false
    }
  },
  {
    "id": "thpt-t11-luonggiac-14",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về các công thức lượng giác:",
    "options": [
      {
        "key": "a",
        "text": "$\\sin(\\alpha+\\beta)=\\sin \\alpha \\cos \\beta+\\cos \\alpha \\sin \\beta$"
      },
      {
        "key": "b",
        "text": "$\\cos 2\\alpha=1-2\\sin^2 \\alpha$"
      },
      {
        "key": "c",
        "text": "$\\sin 2\\alpha=2\\sin \\alpha$"
      },
      {
        "key": "d",
        "text": "$\\tan 2\\alpha=\\dfrac{2\\tan \\alpha}{1-\\tan^2 \\alpha}$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) Đúng. c) Đúng là $\\sin 2\\alpha=2\\sin \\alpha \\cos \\alpha$ — sai. d) Đúng.",
    "points": 1,
    "tags": [
      "lượng giác",
      "công thức lượng giác",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-15",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=\\sin x$ với $x \\in [0;2\\pi]$ (đồ thị như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$y=0$ tại $x=0$, $x=\\pi$, $x=2\\pi$"
      },
      {
        "key": "b",
        "text": "$y=1$ tại $x=\\dfrac{\\pi}{2}$"
      },
      {
        "key": "c",
        "text": "$y=-1$ tại $x=\\dfrac{3\\pi}{2}$"
      },
      {
        "key": "d",
        "text": "$y>0$ trên khoảng $\\left(\\dfrac{\\pi}{2};\\dfrac{3\\pi}{2}\\right)$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a), b), c) Đúng theo đồ thị. d) Trên $(\\pi;\\dfrac{3\\pi}{2})$ thì $\\sin x<0$ — sai.",
    "points": 1,
    "tags": [
      "lượng giác",
      "đồ thị",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "sin(x)"
      ],
      "xMin": 0,
      "xMax": 6.3,
      "yMin": -1.5,
      "yMax": 1.5,
      "labels": true
    }
  },
  {
    "id": "thpt-t11-luonggiac-16",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về đơn vị đo góc:",
    "options": [
      {
        "key": "a",
        "text": "$60^\\circ=\\dfrac{\\pi}{3}$ rad"
      },
      {
        "key": "b",
        "text": "$\\dfrac{\\pi}{4}$ rad $=45^\\circ$"
      },
      {
        "key": "c",
        "text": "$30^\\circ=\\dfrac{\\pi}{3}$ rad"
      },
      {
        "key": "d",
        "text": "$150^\\circ=\\dfrac{5\\pi}{6}$ rad"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) Đúng. c) $30^\\circ=\\dfrac{\\pi}{6}$ rad — sai. d) Đúng.",
    "points": 1,
    "tags": [
      "lượng giác",
      "đơn vị góc",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-17",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho $\\sin \\alpha=-\\dfrac{2}{3}$ với $\\pi<\\alpha<\\dfrac{3\\pi}{2}$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$\\alpha$ là góc phần tư thứ ba"
      },
      {
        "key": "b",
        "text": "$\\cos \\alpha=-\\dfrac{\\sqrt{5}}{3}$"
      },
      {
        "key": "c",
        "text": "$\\tan \\alpha=-\\dfrac{2\\sqrt{5}}{5}$"
      },
      {
        "key": "d",
        "text": "$\\sin 2\\alpha=\\dfrac{4\\sqrt{5}}{9}$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $\\pi<\\alpha<\\dfrac{3\\pi}{2}$ — đúng. b) $\\cos \\alpha=-\\sqrt{1-\\dfrac{4}{9}}=-\\dfrac{\\sqrt{5}}{3}$ (âm ở phần tư III) — đúng. c) $\\tan \\alpha=\\dfrac{-2/3}{-\\sqrt{5}/3}=\\dfrac{2\\sqrt{5}}{5}>0$ — sai. d) $2 \\cdot \\left(-\\dfrac{2}{3}\\right)\\left(-\\dfrac{\\sqrt{5}}{3}\\right)=\\dfrac{4\\sqrt{5}}{9}$ — đúng.",
    "points": 1,
    "tags": [
      "lượng giác",
      "hệ thức lượng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-18",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét họ nghiệm $\\dfrac{\\pi}{3}+k\\dfrac{\\pi}{3}$ với $k \\in \\mathbb{Z}$ trên đường tròn lượng giác (điểm được nối thành lục giác như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Họ gồm 6 điểm trên đường tròn lượng giác"
      },
      {
        "key": "b",
        "text": "Điểm ứng với $k=0$ ứng với góc $\\dfrac{\\pi}{3}$"
      },
      {
        "key": "c",
        "text": "Cả 6 điểm có cùng hoành độ"
      },
      {
        "key": "d",
        "text": "Sáu điểm tạo thành một lục giác đều"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Bước $\\dfrac{\\pi}{3}$ chia hết $2\\pi$ thành 6 điểm — đúng. b) Đúng. c) Hoành độ là các giá trị $\\dfrac{1}{2},-\\dfrac{1}{2},-1,-\\dfrac{1}{2},\\dfrac{1}{2},1$ — sai. d) Sáu điểm cách đều nhau trên đường tròn — đúng.",
    "points": 1,
    "tags": [
      "lượng giác",
      "họ nghiệm",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "trig",
      "angles": "pi/3 + kpi/3\nnối tô: họ",
      "projections": false,
      "tan": false,
      "values": false,
      "cot": false
    }
  },
  {
    "id": "thpt-t11-luonggiac-19",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính giá trị của biểu thức $\\sin^2 10^\\circ+\\cos^2 10^\\circ$.",
    "answer": "1",
    "explanation": "Theo hệ thức lượng cơ bản, tổng luôn bằng 1.",
    "points": 0.5,
    "tags": [
      "lượng giác",
      "hệ thức lượng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-20",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $\\sin \\alpha=\\dfrac{1}{3}$ với $0<\\alpha<\\dfrac{\\pi}{2}$. Tính $\\cos \\alpha$ (làm tròn đến hàng phần trăm).",
    "answer": "0,94",
    "explanation": "$\\cos \\alpha=\\sqrt{1-\\dfrac{1}{9}}=\\dfrac{2\\sqrt{2}}{3} \\approx 0{,}94$.",
    "points": 0.5,
    "tags": [
      "lượng giác",
      "hệ thức lượng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-21",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính chu kì của hàm số $y=\\sin(\\pi x)$.",
    "answer": "2",
    "explanation": "Chu kì $T=\\dfrac{2\\pi}{\\pi}=2$.",
    "points": 0.5,
    "tags": [
      "lượng giác",
      "chu kì",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-22",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\tan \\dfrac{\\pi}{6}$ (làm tròn đến hàng phần trăm).",
    "answer": "0,58",
    "explanation": "$\\tan \\dfrac{\\pi}{6}=\\dfrac{\\sqrt{3}}{3} \\approx 0{,}58$.",
    "points": 0.5,
    "tags": [
      "lượng giác",
      "giá trị lượng giác",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-23",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\sin 105^\\circ$ (làm tròn đến hàng phần trăm).",
    "answer": "0,97",
    "explanation": "$\\sin 105^\\circ=\\sin(60^\\circ+45^\\circ)=\\dfrac{\\sqrt{6}+\\sqrt{2}}{4} \\approx 0{,}97$.",
    "points": 0.5,
    "tags": [
      "lượng giác",
      "công thức cộng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-24",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $\\sin \\alpha \\cos \\alpha=-\\dfrac{3}{8}$. Tính $(\\sin \\alpha+\\cos \\alpha)^2$.",
    "answer": "0,25",
    "explanation": "$(\\sin \\alpha+\\cos \\alpha)^2=1+2\\sin \\alpha \\cos \\alpha=1-\\dfrac{3}{4}=\\dfrac{1}{4}=0{,}25$.",
    "points": 0.5,
    "tags": [
      "lượng giác",
      "hệ thức lượng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-luonggiac-25",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $\\sin \\alpha=\\dfrac{2}{5}$ với $0<\\alpha<\\dfrac{\\pi}{2}$. Tính $\\sin 2\\alpha$ (làm tròn đến hàng phần trăm).",
    "answer": "0,73",
    "explanation": "$\\cos \\alpha=\\dfrac{\\sqrt{21}}{5}$; $\\sin 2\\alpha=2 \\cdot \\dfrac{2}{5} \\cdot \\dfrac{\\sqrt{21}}{5}=\\dfrac{4\\sqrt{21}}{25} \\approx 0{,}73$.",
    "points": 0.5,
    "tags": [
      "lượng giác",
      "công thức nhân đôi",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-01",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $\\log_2 8$ là",
    "options": [
      {
        "key": "A",
        "text": "$2$"
      },
      {
        "key": "B",
        "text": "$4$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{3}$"
      }
    ],
    "answer": "C",
    "explanation": "$\\log_2 8=3$ vì $2^3=8$.",
    "points": 0.25,
    "tags": [
      "mũ logarit",
      "logarit",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-02",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $2^{-2}$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{4}$"
      },
      {
        "key": "B",
        "text": "$-4$"
      },
      {
        "key": "C",
        "text": "$4$"
      },
      {
        "key": "D",
        "text": "$-\\dfrac{1}{4}$"
      }
    ],
    "answer": "A",
    "explanation": "$2^{-2}=\\dfrac{1}{2^2}=\\dfrac{1}{4}$.",
    "points": 0.25,
    "tags": [
      "mũ logarit",
      "lũy thừa",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-03",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Tính $\\log_3 27+\\log_3 9$.",
    "options": [
      {
        "key": "A",
        "text": "$6$"
      },
      {
        "key": "B",
        "text": "$5$"
      },
      {
        "key": "C",
        "text": "$4$"
      },
      {
        "key": "D",
        "text": "$9$"
      }
    ],
    "answer": "B",
    "explanation": "$\\log_3 27=3$, $\\log_3 9=2$ nên tổng bằng $5$.",
    "points": 0.25,
    "tags": [
      "mũ logarit",
      "phép tính logarit",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-04",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Nghiệm của phương trình $5^{x+1}=25$ là",
    "options": [
      {
        "key": "A",
        "text": "$x=2$"
      },
      {
        "key": "B",
        "text": "$x=0$"
      },
      {
        "key": "C",
        "text": "$x=-1$"
      },
      {
        "key": "D",
        "text": "$x=1$"
      }
    ],
    "answer": "D",
    "explanation": "$5^{x+1}=5^2 \\Leftrightarrow x+1=2 \\Leftrightarrow x=1$.",
    "points": 0.25,
    "tags": [
      "mũ logarit",
      "phương trình mũ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-05",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Độ pH của một dung dịch được tính bằng $pH=-\\log[H^+]$. Một dung dịch có nồng độ $[H^+]=10^{-3}$ (mol/lít) có pH bằng",
    "options": [
      {
        "key": "A",
        "text": "$7$"
      },
      {
        "key": "B",
        "text": "$3$"
      },
      {
        "key": "C",
        "text": "$-3$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{3}$"
      }
    ],
    "answer": "B",
    "explanation": "$pH=-\\log 10^{-3}=3$.",
    "points": 0.25,
    "tags": [
      "mũ logarit",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-06",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Độ lớn của một trận động đất được tính theo công thức $M=\\log\\dfrac{A}{A_0}$. Một trận động đất có biên độ gấp 1000 lần biên độ chuẩn thì độ lớn là",
    "options": [
      {
        "key": "A",
        "text": "$3$"
      },
      {
        "key": "B",
        "text": "$1000$"
      },
      {
        "key": "C",
        "text": "$2$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{3}$"
      }
    ],
    "answer": "A",
    "explanation": "$M=\\log 1000=3$.",
    "points": 0.25,
    "tags": [
      "mũ logarit",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-07",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hàm số $y=2^x$ có đồ thị như hình. Giá trị của $\\lim\\limits_{x \\to -\\infty}2^x$ là",
    "options": [
      {
        "key": "A",
        "text": "$+\\infty$"
      },
      {
        "key": "B",
        "text": "$1$"
      },
      {
        "key": "C",
        "text": "$0$"
      },
      {
        "key": "D",
        "text": "$-\\infty$"
      }
    ],
    "answer": "C",
    "explanation": "Khi $x \\to -\\infty$ thì $2^x \\to 0$.",
    "points": 0.25,
    "tags": [
      "mũ logarit",
      "hàm số mũ",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "2^x"
      ],
      "xMin": -4,
      "xMax": 3,
      "yMin": -1,
      "yMax": 9,
      "labels": true
    }
  },
  {
    "id": "thpt-t11-mulog-08",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập nghiệm của bất phương trình $\\log_2(x-1)<3$ là",
    "options": [
      {
        "key": "A",
        "text": "$(-\\infty;9)$"
      },
      {
        "key": "B",
        "text": "$(1;9)$"
      },
      {
        "key": "C",
        "text": "$(2;8)$"
      },
      {
        "key": "D",
        "text": "$(0;9)$"
      }
    ],
    "answer": "B",
    "explanation": "Điều kiện $x>1$. $\\log_2(x-1)<3 \\Leftrightarrow x-1<8 \\Leftrightarrow x<9$. Vậy $1<x<9$.",
    "points": 0.25,
    "tags": [
      "mũ logarit",
      "bất phương trình logarit",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-09",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Tính $\\log 500-\\log 5$.",
    "options": [
      {
        "key": "A",
        "text": "$2$"
      },
      {
        "key": "B",
        "text": "$100$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$\\log 495$"
      }
    ],
    "answer": "A",
    "explanation": "$\\log \\dfrac{500}{5}=\\log 100=2$.",
    "points": 0.25,
    "tags": [
      "mũ logarit",
      "phép tính logarit",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-10",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập xác định của hàm số $y=\\log_2 x$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\mathbb{R}$"
      },
      {
        "key": "B",
        "text": "$[0;+\\infty)$"
      },
      {
        "key": "C",
        "text": "$(-\\infty;0)$"
      },
      {
        "key": "D",
        "text": "$(0;+\\infty)$"
      }
    ],
    "answer": "D",
    "explanation": "Logarit chỉ xác định với biểu thức trong dấu log dương.",
    "points": 0.25,
    "tags": [
      "mũ logarit",
      "hàm số logarit",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-11",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một chất phóng xạ có chu kì bán rã 5 ngày. Ban đầu có 100 mg. Sau 15 ngày, khối lượng chất phóng xạ còn lại là",
    "options": [
      {
        "key": "A",
        "text": "$50$ mg"
      },
      {
        "key": "B",
        "text": "$33{,}3$ mg"
      },
      {
        "key": "C",
        "text": "$12{,}5$ mg"
      },
      {
        "key": "D",
        "text": "$25$ mg"
      }
    ],
    "answer": "C",
    "explanation": "15 ngày là 3 chu kì bán rã: $100 \\cdot \\left(\\dfrac{1}{2}\\right)^3=12{,}5$ mg.",
    "points": 0.25,
    "tags": [
      "mũ logarit",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-12",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Nghiệm của phương trình $4^x-2^{x+1}-8=0$ là",
    "options": [
      {
        "key": "A",
        "text": "$x=1$"
      },
      {
        "key": "B",
        "text": "$x=3$"
      },
      {
        "key": "C",
        "text": "$x=-1$"
      },
      {
        "key": "D",
        "text": "$x=2$"
      }
    ],
    "answer": "D",
    "explanation": "Đặt $t=2^x>0$: $t^2-2t-8=0 \\Leftrightarrow t=4$ (nhận) nên $x=2$.",
    "points": 0.25,
    "tags": [
      "mũ logarit",
      "phương trình mũ",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-13",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về lũy thừa và logarit:",
    "options": [
      {
        "key": "a",
        "text": "$3^0=1$"
      },
      {
        "key": "b",
        "text": "$\\log_5 125=3$"
      },
      {
        "key": "c",
        "text": "$\\log_2 \\dfrac{1}{8}=-3$"
      },
      {
        "key": "d",
        "text": "$\\ln e=2$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) $5^3=125$ — đúng. c) $2^{-3}=\\dfrac{1}{8}$ — đúng. d) $\\ln e=1$ — sai.",
    "points": 1,
    "tags": [
      "mũ logarit",
      "phép tính",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-14",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về các phép tính logarit:",
    "options": [
      {
        "key": "a",
        "text": "$\\log 2+\\log 5=1$"
      },
      {
        "key": "b",
        "text": "$\\log 4=2\\log 2$"
      },
      {
        "key": "c",
        "text": "$\\log 6=\\log 2+\\log 3$"
      },
      {
        "key": "d",
        "text": "$\\log 9=3\\log 3$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) $\\log 10=1$ — đúng. b) Đúng. c) Đúng. d) $\\log 9=2\\log 3$ — sai.",
    "points": 1,
    "tags": [
      "mũ logarit",
      "phép tính logarit",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-15",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=\\left(\\dfrac{1}{2}\\right)^x$ có đồ thị như hình. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Hàm số nghịch biến trên $\\mathbb{R}$"
      },
      {
        "key": "b",
        "text": "Đồ thị đi qua điểm $(1;0)$"
      },
      {
        "key": "c",
        "text": "Tập giá trị của hàm số là $(0;+\\infty)$"
      },
      {
        "key": "d",
        "text": "$\\lim\\limits_{x \\to +\\infty}y=+\\infty$"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Cơ số $\\dfrac{1}{2} \\in (0;1)$ nên nghịch biến — đúng. b) Đồ thị đi qua $(0;1)$, không qua $(1;0)$ — sai. c) Đúng. d) Khi $x \\to +\\infty$ thì $y \\to 0$ — sai.",
    "points": 1,
    "tags": [
      "mũ logarit",
      "hàm số mũ",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "(1/2)^x"
      ],
      "xMin": -3,
      "xMax": 4,
      "yMin": -1,
      "yMax": 9,
      "labels": true
    }
  },
  {
    "id": "thpt-t11-mulog-16",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét bất phương trình $2^x>16$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Tập nghiệm là $x>4$"
      },
      {
        "key": "b",
        "text": "$x=5$ là một nghiệm"
      },
      {
        "key": "c",
        "text": "$x=4$ là một nghiệm"
      },
      {
        "key": "d",
        "text": "Tập nghiệm là $(4;+\\infty)$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $2^x>2^4 \\Leftrightarrow x>4$ — đúng. b) $2^5=32>16$ — đúng. c) $2^4=16$ không lớn hơn 16 — sai. d) Đúng.",
    "points": 1,
    "tags": [
      "mũ logarit",
      "bất phương trình mũ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-17",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét phương trình $9^x-4 \\cdot 3^x+3=0$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Đặt $t=3^x$ với $t>0$ thì được $t^2-4t+3=0$"
      },
      {
        "key": "b",
        "text": "Có $t=1$ hoặc $t=3$"
      },
      {
        "key": "c",
        "text": "Nghiệm của phương trình là $x=0$ hoặc $x=1$"
      },
      {
        "key": "d",
        "text": "$x=2$ là một nghiệm"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) $t^2-4t+3=0 \\Leftrightarrow t=1, t=3$ — đúng. c) $t=1 \\Rightarrow x=0$; $t=3 \\Rightarrow x=1$ — đúng. d) $9^2-4 \\cdot 9+3=48 \\ne 0$ — sai.",
    "points": 1,
    "tags": [
      "mũ logarit",
      "phương trình mũ",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-18",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Chất phóng xạ I-131 có chu kì bán rã 8 ngày. Ban đầu có 80 mg. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Sau 8 ngày còn 40 mg"
      },
      {
        "key": "b",
        "text": "Sau 16 ngày còn 20 mg"
      },
      {
        "key": "c",
        "text": "Sau 24 ngày còn 5 mg"
      },
      {
        "key": "d",
        "text": "Sau 24 ngày còn 10 mg"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng (1 chu kì). b) Đúng (2 chu kì). c) 24 ngày là 3 chu kì: $80 \\cdot \\dfrac{1}{8}=10$ mg $\\ne 5$ — sai. d) Đúng.",
    "points": 1,
    "tags": [
      "mũ logarit",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-19",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\log_2 64$.",
    "answer": "6",
    "explanation": "$2^6=64$.",
    "points": 0.5,
    "tags": [
      "mũ logarit",
      "logarit",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-20",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tìm nghiệm của phương trình $3^x=12$ (làm tròn đến hàng phần trăm).",
    "answer": "2,26",
    "explanation": "$x=\\log_3 12=\\dfrac{\\ln 12}{\\ln 3} \\approx 2{,}26$.",
    "points": 0.5,
    "tags": [
      "mũ logarit",
      "phương trình mũ",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-21",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một dung dịch có nồng độ $[H^+]=10^{-5{,}5}$ (mol/lít). Tính pH của dung dịch.",
    "answer": "5,5",
    "explanation": "$pH=-\\log 10^{-5{,}5}=5{,}5$.",
    "points": 0.5,
    "tags": [
      "mũ logarit",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-22",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\log 25+\\log 4$.",
    "answer": "2",
    "explanation": "$\\log(25 \\cdot 4)=\\log 100=2$.",
    "points": 0.5,
    "tags": [
      "mũ logarit",
      "phép tính logarit",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-23",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Vay 100 triệu đồng với lãi kép $10\\%$/năm. Sau ít nhất bao nhiêu năm (làm tròn đến hàng đơn vị) số nợ vượt quá 133 triệu đồng?",
    "answer": "3",
    "explanation": "$100 \\cdot 1{,}1^3=133{,}1>133$; với $n=2$: $121<133$. Vậy cần 3 năm.",
    "points": 0.5,
    "tags": [
      "mũ logarit",
      "lãi kép",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-24",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tìm nghiệm nguyên lớn nhất của bất phương trình $\\left(\\dfrac{1}{3}\\right)^x>27$.",
    "answer": "-4",
    "explanation": "$3^{-x}>3^3 \\Leftrightarrow -x>3 \\Leftrightarrow x<-3$. Nghiệm nguyên lớn nhất là $-4$.",
    "points": 0.5,
    "tags": [
      "mũ logarit",
      "bất phương trình mũ",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-mulog-25",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Nước chanh có nồng độ $[H^+]=10^{-2{,}3}$ (mol/lít). Tính pH của nước chanh.",
    "answer": "2,3",
    "explanation": "$pH=-\\log 10^{-2{,}3}=2{,}3$.",
    "points": 0.5,
    "tags": [
      "mũ logarit",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-01",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập nghiệm của phương trình $\\sin x=0$ là",
    "options": [
      {
        "key": "A",
        "text": "$x=k\\pi,\\ k \\in \\mathbb{Z}$"
      },
      {
        "key": "B",
        "text": "$x=\\dfrac{\\pi}{2}+k\\pi,\\ k \\in \\mathbb{Z}$"
      },
      {
        "key": "C",
        "text": "$x=\\dfrac{\\pi}{2}+k2\\pi,\\ k \\in \\mathbb{Z}$"
      },
      {
        "key": "D",
        "text": "$x=k2\\pi,\\ k \\in \\mathbb{Z}$"
      }
    ],
    "answer": "A",
    "explanation": "$\\sin x=0 \\Leftrightarrow x=k\\pi$.",
    "points": 0.25,
    "tags": [
      "phương trình lượng giác",
      "cơ bản",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-02",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập nghiệm của phương trình $\\cos x=\\dfrac{1}{2}$ là",
    "options": [
      {
        "key": "A",
        "text": "$x=\\pm \\dfrac{\\pi}{6}+k2\\pi$"
      },
      {
        "key": "B",
        "text": "$x=\\dfrac{\\pi}{3}+k\\pi$"
      },
      {
        "key": "C",
        "text": "$x=\\pm \\dfrac{\\pi}{3}+k2\\pi$"
      },
      {
        "key": "D",
        "text": "$x=\\pm \\dfrac{\\sqrt{3}}{2}+k2\\pi$"
      }
    ],
    "answer": "C",
    "explanation": "$\\cos x=\\dfrac{1}{2} \\Leftrightarrow x=\\pm \\dfrac{\\pi}{3}+k2\\pi,\\ k \\in \\mathbb{Z}$.",
    "points": 0.25,
    "tags": [
      "phương trình lượng giác",
      "cơ bản",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-03",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Phương trình $\\sin x=\\dfrac{1}{2}$ có bao nhiêu nghiệm trên đoạn $[0;2\\pi]$?",
    "options": [
      {
        "key": "A",
        "text": "$1$"
      },
      {
        "key": "B",
        "text": "$2$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$4$"
      }
    ],
    "answer": "B",
    "explanation": "Hai nghiệm $x=\\dfrac{\\pi}{6}$ và $x=\\dfrac{5\\pi}{6}$.",
    "points": 0.25,
    "tags": [
      "phương trình lượng giác",
      "số nghiệm",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-04",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập nghiệm của phương trình $\\tan x=1$ là",
    "options": [
      {
        "key": "A",
        "text": "$x=\\dfrac{\\pi}{4}+k2\\pi$"
      },
      {
        "key": "B",
        "text": "$x=\\pm \\dfrac{\\pi}{4}+k2\\pi$"
      },
      {
        "key": "C",
        "text": "$x=\\dfrac{\\pi}{2}+k\\pi$"
      },
      {
        "key": "D",
        "text": "$x=\\dfrac{\\pi}{4}+k\\pi$"
      }
    ],
    "answer": "D",
    "explanation": "$\\tan x=1 \\Leftrightarrow x=\\dfrac{\\pi}{4}+k\\pi,\\ k \\in \\mathbb{Z}$.",
    "points": 0.25,
    "tags": [
      "phương trình lượng giác",
      "cơ bản",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-05",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Trên đường tròn lượng giác, các nghiệm của $\\sin x=\\dfrac{1}{2}$ là giao điểm của đường tròn với đường thẳng $y=\\dfrac{1}{2}$ (như hình). Nghiệm dương nhỏ nhất của phương trình $\\sin x=\\dfrac{1}{2}$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{\\pi}{6}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{\\pi}{3}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{5\\pi}{6}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{\\pi}{2}$"
      }
    ],
    "answer": "A",
    "explanation": "$\\sin x=\\dfrac{1}{2} \\Leftrightarrow x=\\dfrac{\\pi}{6}+k2\\pi$ hoặc $x=\\dfrac{5\\pi}{6}+k2\\pi$. Nghiệm dương nhỏ nhất $\\dfrac{\\pi}{6}$.",
    "points": 0.25,
    "tags": [
      "phương trình lượng giác",
      "đường tròn lượng giác",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "trig",
      "angles": "y = 1/2",
      "projections": false,
      "tan": false,
      "values": false,
      "cot": false
    }
  },
  {
    "id": "thpt-t11-ptlg-06",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một con lắc dao động với li độ $s=5\\sin(2\\pi t)$ (cm), $t$ tính bằng giây. Chu kì dao động là",
    "options": [
      {
        "key": "A",
        "text": "$2$ s"
      },
      {
        "key": "B",
        "text": "$0{,}5$ s"
      },
      {
        "key": "C",
        "text": "$1$ s"
      },
      {
        "key": "D",
        "text": "$\\pi$ s"
      }
    ],
    "answer": "C",
    "explanation": "$T=\\dfrac{2\\pi}{2\\pi}=1$ s.",
    "points": 0.25,
    "tags": [
      "phương trình lượng giác",
      "dao động",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-07",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một điểm chuyển động tròn đều, góc quay sau $t$ giây là $\\theta=4\\pi t$ (rad). Sau 3 giây, điểm đó quay được bao nhiêu vòng?",
    "options": [
      {
        "key": "A",
        "text": "$4$"
      },
      {
        "key": "B",
        "text": "$6$"
      },
      {
        "key": "C",
        "text": "$12$"
      },
      {
        "key": "D",
        "text": "$2$"
      }
    ],
    "answer": "B",
    "explanation": "Số vòng $=\\dfrac{4\\pi \\cdot 3}{2\\pi}=6$.",
    "points": 0.25,
    "tags": [
      "phương trình lượng giác",
      "chuyển động tròn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-08",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Phương trình $2\\sin^2 x+\\sin x-1=0$ có bao nhiêu nghiệm trên đoạn $[0;2\\pi]$?",
    "options": [
      {
        "key": "A",
        "text": "$2$"
      },
      {
        "key": "B",
        "text": "$4$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$1$"
      }
    ],
    "answer": "C",
    "explanation": "Đặt $t=\\sin x$: $2t^2+t-1=0 \\Leftrightarrow t=\\dfrac{1}{2}$ hoặc $t=-1$. $\\sin x=\\dfrac{1}{2}$ cho 2 nghiệm; $\\sin x=-1$ cho $x=\\dfrac{3\\pi}{2}$: tổng 3 nghiệm.",
    "points": 0.25,
    "tags": [
      "phương trình lượng giác",
      "đặt ẩn phụ",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-09",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập nghiệm của phương trình $\\cos x=-1$ là",
    "options": [
      {
        "key": "A",
        "text": "$x=0+k2\\pi$"
      },
      {
        "key": "B",
        "text": "$x=\\pi+k2\\pi$"
      },
      {
        "key": "C",
        "text": "$x=\\pi+k\\pi$"
      },
      {
        "key": "D",
        "text": "$x=\\dfrac{\\pi}{2}+k2\\pi$"
      }
    ],
    "answer": "B",
    "explanation": "$\\cos x=-1 \\Leftrightarrow x=\\pi+k2\\pi,\\ k \\in \\mathbb{Z}$.",
    "points": 0.25,
    "tags": [
      "phương trình lượng giác",
      "cơ bản",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-10",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Nghiệm dương nhỏ nhất của phương trình $\\sin x=\\sin 25^\\circ$ là",
    "options": [
      {
        "key": "A",
        "text": "$25^\\circ$"
      },
      {
        "key": "B",
        "text": "$155^\\circ$"
      },
      {
        "key": "C",
        "text": "$65^\\circ$"
      },
      {
        "key": "D",
        "text": "$205^\\circ$"
      }
    ],
    "answer": "A",
    "explanation": "Nghiệm $x=25^\\circ+k360^\\circ$ hoặc $x=155^\\circ+k360^\\circ$; nghiệm dương nhỏ nhất là $25^\\circ$.",
    "points": 0.25,
    "tags": [
      "phương trình lượng giác",
      "cơ bản",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-11",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một chất điểm dao động với li độ $s=3\\cos(4\\pi t)$ (cm), $t$ tính bằng giây. Chu kì dao động là",
    "options": [
      {
        "key": "A",
        "text": "$4$ s"
      },
      {
        "key": "B",
        "text": "$2$ s"
      },
      {
        "key": "C",
        "text": "$1$ s"
      },
      {
        "key": "D",
        "text": "$0{,}5$ s"
      }
    ],
    "answer": "D",
    "explanation": "$T=\\dfrac{2\\pi}{4\\pi}=\\dfrac{1}{2}$ s.",
    "points": 0.25,
    "tags": [
      "phương trình lượng giác",
      "dao động",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-12",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Phương trình $\\sin x=\\dfrac{\\sqrt{2}}{2}$ có bao nhiêu nghiệm trong khoảng $(0;4\\pi)$?",
    "options": [
      {
        "key": "A",
        "text": "$2$"
      },
      {
        "key": "B",
        "text": "$4$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$6$"
      }
    ],
    "answer": "B",
    "explanation": "Nghiệm $x=\\dfrac{\\pi}{4}+k2\\pi$ hoặc $x=\\dfrac{3\\pi}{4}+k2\\pi$; trong $(0;4\\pi)$ có $\\dfrac{\\pi}{4},\\dfrac{3\\pi}{4},\\dfrac{9\\pi}{4},\\dfrac{11\\pi}{4}$: 4 nghiệm.",
    "points": 0.25,
    "tags": [
      "phương trình lượng giác",
      "số nghiệm",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-13",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét phương trình $\\cos x=0$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Tập nghiệm là $x=\\dfrac{\\pi}{2}+k\\pi$"
      },
      {
        "key": "b",
        "text": "$x=\\dfrac{\\pi}{2}$ là một nghiệm"
      },
      {
        "key": "c",
        "text": "$x=0$ là một nghiệm"
      },
      {
        "key": "d",
        "text": "$x=\\dfrac{3\\pi}{2}$ là một nghiệm"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) $\\cos \\dfrac{\\pi}{2}=0$ — đúng. c) $\\cos 0=1 \\ne 0$ — sai. d) $\\cos \\dfrac{3\\pi}{2}=0$ — đúng.",
    "points": 1,
    "tags": [
      "phương trình lượng giác",
      "cơ bản",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-14",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét bất phương trình $\\sin x \\ge \\dfrac{\\sqrt{2}}{2}$ với $x \\in [0;2\\pi]$ (miền nghiệm tô đỏ trên hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Tập nghiệm là $\\left[\\dfrac{\\pi}{4};\\dfrac{3\\pi}{4}\\right]$"
      },
      {
        "key": "b",
        "text": "$x=\\dfrac{\\pi}{2}$ là một nghiệm"
      },
      {
        "key": "c",
        "text": "$x=\\pi$ là một nghiệm"
      },
      {
        "key": "d",
        "text": "Độ dài của tập nghiệm là $\\dfrac{\\pi}{2}$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) $\\sin \\dfrac{\\pi}{2}=1 \\ge \\dfrac{\\sqrt{2}}{2}$ — đúng. c) $\\sin \\pi=0$ — sai. d) $\\dfrac{3\\pi}{4}-\\dfrac{\\pi}{4}=\\dfrac{\\pi}{2}$ — đúng.",
    "points": 1,
    "tags": [
      "phương trình lượng giác",
      "bất phương trình lượng giác",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "trig",
      "angles": "tô: [pi/4 → 3pi/4]",
      "projections": false,
      "tan": false,
      "values": false,
      "cot": false
    }
  },
  {
    "id": "thpt-t11-ptlg-15",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét phương trình $\\sin x=-\\dfrac{\\sqrt{3}}{2}$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Một họ nghiệm là $x=-\\dfrac{\\pi}{3}+k2\\pi$"
      },
      {
        "key": "b",
        "text": "Một họ nghiệm là $x=\\dfrac{4\\pi}{3}+k2\\pi$"
      },
      {
        "key": "c",
        "text": "Họ $x=\\dfrac{\\pi}{3}+k2\\pi$ là họ nghiệm của phương trình"
      },
      {
        "key": "d",
        "text": "Trên đoạn $[0;2\\pi]$ phương trình có 2 nghiệm"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) $\\sin \\dfrac{4\\pi}{3}=-\\dfrac{\\sqrt{3}}{2}$ — đúng. c) $\\sin \\dfrac{\\pi}{3}=\\dfrac{\\sqrt{3}}{2}>0$ — sai. d) Hai nghiệm $\\dfrac{4\\pi}{3}$ và $\\dfrac{5\\pi}{3}$ — đúng.",
    "points": 1,
    "tags": [
      "phương trình lượng giác",
      "cơ bản",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-16",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Một chất điểm dao động với li độ $s=4\\sin(\\pi t)$ (cm), $t$ tính bằng giây (đồ thị như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Biên độ dao động là 4 cm"
      },
      {
        "key": "b",
        "text": "Chu kì dao động là 2 s"
      },
      {
        "key": "c",
        "text": "Tại thời điểm $t=\\dfrac{1}{2}$ s, li độ bằng 4 cm"
      },
      {
        "key": "d",
        "text": "Tại thời điểm $t=1$ s, li độ bằng 4 cm"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) $T=\\dfrac{2\\pi}{\\pi}=2$ s — đúng. c) $s\\left(\\dfrac{1}{2}\\right)=4\\sin \\dfrac{\\pi}{2}=4$ — đúng. d) $s(1)=4\\sin \\pi=0$ — sai.",
    "points": 1,
    "tags": [
      "phương trình lượng giác",
      "dao động",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "4sin(pi*x)"
      ],
      "xMin": 0,
      "xMax": 4,
      "yMin": -5,
      "yMax": 5,
      "labels": true
    }
  },
  {
    "id": "thpt-t11-ptlg-17",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét phương trình $\\sin^2 x-\\sin x=0$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Phương trình tương đương $\\sin x=0$ hoặc $\\sin x=1$"
      },
      {
        "key": "b",
        "text": "Phương trình có 4 nghiệm trên đoạn $[0;2\\pi]$"
      },
      {
        "key": "c",
        "text": "$x=\\dfrac{3\\pi}{2}$ là một nghiệm"
      },
      {
        "key": "d",
        "text": "Phương trình có 3 nghiệm trên đoạn $[0;\\pi]$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $\\sin x(\\sin x-1)=0$ — đúng. b) Nghiệm $0, \\pi, 2\\pi, \\dfrac{\\pi}{2}$: 4 nghiệm — đúng. c) $\\sin \\dfrac{3\\pi}{2}=-1$ — sai. d) Trên $[0;\\pi]$: $0, \\dfrac{\\pi}{2}, \\pi$ — đúng.",
    "points": 1,
    "tags": [
      "phương trình lượng giác",
      "phương trình bậc hai",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-18",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Bánh xe bán kính 50 cm quay đều với tần số 2 vòng/giây. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Chu kì quay là 0,5 s"
      },
      {
        "key": "b",
        "text": "Tốc độ góc là $4\\pi$ rad/s"
      },
      {
        "key": "c",
        "text": "Tốc độ dài của điểm trên vành bánh là $100\\pi$ cm/s"
      },
      {
        "key": "d",
        "text": "Sau 2 giây bánh quay được 4 vòng"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $T=\\dfrac{1}{2}$ s — đúng. b) $\\omega=2\\pi f=4\\pi$ — đúng. c) $v=\\omega R=4\\pi \\cdot 50=200\\pi$ cm/s — sai. d) $2 \\cdot 2=4$ vòng — đúng.",
    "points": 1,
    "tags": [
      "phương trình lượng giác",
      "chuyển động tròn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-19",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Phương trình $\\sin x=0$ có bao nhiêu nghiệm trên đoạn $[0;4\\pi]$?",
    "answer": "5",
    "explanation": "Các nghiệm $0, \\pi, 2\\pi, 3\\pi, 4\\pi$: 5 nghiệm.",
    "points": 0.5,
    "tags": [
      "phương trình lượng giác",
      "số nghiệm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-20",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Phương trình $\\tan x=\\sqrt{3}$ có bao nhiêu nghiệm trên khoảng $[0;2\\pi)$?",
    "answer": "2",
    "explanation": "Nghiệm $x=\\dfrac{\\pi}{3}+k\\pi$: $\\dfrac{\\pi}{3}$ và $\\dfrac{4\\pi}{3}$: 2 nghiệm.",
    "points": 0.5,
    "tags": [
      "phương trình lượng giác",
      "số nghiệm",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-21",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính chu kì (giây) của dao động $s=6\\sin(2\\pi t)$.",
    "answer": "1",
    "explanation": "$T=\\dfrac{2\\pi}{2\\pi}=1$ s.",
    "points": 0.5,
    "tags": [
      "phương trình lượng giác",
      "dao động",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-22",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tìm nghiệm dương nhỏ nhất của $\\tan x=-1$ (làm tròn đến hàng phần trăm, tính bằng radian).",
    "answer": "2,36",
    "explanation": "Nghiệm $x=-\\dfrac{\\pi}{4}+k\\pi$; nghiệm dương nhỏ nhất $\\dfrac{3\\pi}{4} \\approx 2{,}36$.",
    "points": 0.5,
    "tags": [
      "phương trình lượng giác",
      "cơ bản",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-23",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một điểm chuyển động tròn đều với chu kì 4 giây. Sau 13 giây, điểm đó quay trọn được bao nhiêu vòng?",
    "answer": "3",
    "explanation": "$\\dfrac{13}{4}=3{,}25$ nên quay trọn 3 vòng.",
    "points": 0.5,
    "tags": [
      "phương trình lượng giác",
      "chuyển động tròn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-24",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Phương trình $\\sin 2x=0$ có bao nhiêu nghiệm trong khoảng $(0;2\\pi)$?",
    "answer": "3",
    "explanation": "$2x=k\\pi \\Leftrightarrow x=\\dfrac{k\\pi}{2}$; trong $(0;2\\pi)$ có $\\dfrac{\\pi}{2},\\pi,\\dfrac{3\\pi}{2}$: 3 nghiệm.",
    "points": 0.5,
    "tags": [
      "phương trình lượng giác",
      "số nghiệm",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-ptlg-25",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Chất điểm dao động với li độ $s=2\\sin(\\pi t)$ (cm). Lần đầu tiên li độ đạt giá trị lớn nhất 2 cm tại thời điểm $t$ bao nhiêu giây?",
    "answer": "0,5",
    "explanation": "$\\sin(\\pi t)=1 \\Leftrightarrow \\pi t=\\dfrac{\\pi}{2} \\Leftrightarrow t=\\dfrac{1}{2}$ s.",
    "points": 0.5,
    "tags": [
      "phương trình lượng giác",
      "dao động",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-01",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Đường thẳng $a$ song song với mặt phẳng $(P)$ khi",
    "options": [
      {
        "key": "A",
        "text": "$a$ nằm trong $(P)$"
      },
      {
        "key": "B",
        "text": "$a$ không nằm trong $(P)$ và không có điểm chung với $(P)$"
      },
      {
        "key": "C",
        "text": "$a$ cắt $(P)$ tại một điểm"
      },
      {
        "key": "D",
        "text": "$a$ có đúng hai điểm chung với $(P)$"
      }
    ],
    "answer": "B",
    "explanation": "Theo định nghĩa về vị trí tương đối của đường thẳng và mặt phẳng.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "song song",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-02",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Hai mặt phẳng phân biệt được gọi là song song khi",
    "options": [
      {
        "key": "A",
        "text": "chúng có một điểm chung"
      },
      {
        "key": "B",
        "text": "chúng có một đường thẳng chung"
      },
      {
        "key": "C",
        "text": "chúng không có điểm chung"
      },
      {
        "key": "D",
        "text": "mỗi mặt phẳng chứa một đường thẳng của mặt phẳng kia"
      }
    ],
    "answer": "C",
    "explanation": "Theo định nghĩa, hai mặt phẳng song song khi không có điểm chung.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "song song",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-03",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành. Giao tuyến của $(SAB)$ và $(SCD)$ là",
    "options": [
      {
        "key": "A",
        "text": "đường thẳng qua $S$ và song song với $AB$"
      },
      {
        "key": "B",
        "text": "đường thẳng $AB$"
      },
      {
        "key": "C",
        "text": "đường thẳng qua $S$ và song song với $SA$"
      },
      {
        "key": "D",
        "text": "hai mặt phẳng song song, không có giao tuyến"
      }
    ],
    "answer": "A",
    "explanation": "Hai mặt phẳng có điểm chung $S$; $AB \\parallel CD$ nên giao tuyến qua $S$ song song $AB$.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "giao tuyến",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-04",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong hình lập phương $ABCD.A'B'C'D'$, đường thẳng $AB$ và mặt phẳng $(A'B'C'D')$ có vị trí tương đối",
    "options": [
      {
        "key": "A",
        "text": "cắt nhau"
      },
      {
        "key": "B",
        "text": "song song"
      },
      {
        "key": "C",
        "text": "$AB$ nằm trong mặt phẳng"
      },
      {
        "key": "D",
        "text": "không xác định được"
      }
    ],
    "answer": "B",
    "explanation": "$AB \\parallel A'B'$ với $A'B' \\subset (A'B'C'D')$ nên $AB$ song song mặt phẳng đó.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "song song",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-05",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hình chóp $S.ABC$ (như hình), $M$ là trung điểm $SA$. Thiết diện cắt bởi mặt phẳng $(MBC)$ là",
    "options": [
      {
        "key": "A",
        "text": "tứ giác $MBCM$"
      },
      {
        "key": "B",
        "text": "đoạn thẳng $MB$"
      },
      {
        "key": "C",
        "text": "tam giác $MBC$"
      },
      {
        "key": "D",
        "text": "tam giác $SBC$"
      }
    ],
    "answer": "C",
    "explanation": "Mặt phẳng $(MBC)$ cắt các cạnh $SA$, $SB$, $SC$ tại $M$, $B$, $C$ nên thiết diện là tam giác $MBC$.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "thiết diện",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "pyramid3",
      "names": [
        "S",
        "A",
        "B",
        "C"
      ],
      "extras": "M = trung điểm SA\nMB\nMC"
    }
  },
  {
    "id": "thpt-t11-songsong-06",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho đường thẳng $d$ song song với mặt phẳng $(P)$. Mặt phẳng $(Q)$ đi qua $d$ và cắt $(P)$ theo giao tuyến $a$. Khi đó",
    "options": [
      {
        "key": "A",
        "text": "$d$ cắt $a$"
      },
      {
        "key": "B",
        "text": "$d$ song song $a$"
      },
      {
        "key": "C",
        "text": "$d$ nằm trong $(P)$"
      },
      {
        "key": "D",
        "text": "$a$ vuông góc $d$"
      }
    ],
    "answer": "B",
    "explanation": "Theo tính chất: nếu đường thẳng song song với mặt phẳng thì mọi mặt phẳng chứa nó cắt mặt phẳng đó theo giao tuyến song song với nó.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "tính chất song song",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-07",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành, $O=AC \\cap BD$ (như hình). Giao tuyến của $(SAC)$ và $(SBD)$ là",
    "options": [
      {
        "key": "A",
        "text": "đường thẳng $SA$"
      },
      {
        "key": "B",
        "text": "đường thẳng $SO$"
      },
      {
        "key": "C",
        "text": "đường thẳng $SC$"
      },
      {
        "key": "D",
        "text": "đường thẳng $SD$"
      }
    ],
    "answer": "B",
    "explanation": "Hai mặt phẳng cùng chứa $S$; $O$ chung của $AC$ và $BD$ nên giao tuyến là $SO$.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "giao tuyến",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "pyramid4",
      "names": [
        "S",
        "A",
        "B",
        "C",
        "D"
      ],
      "extras": "O = AC cắt BD\nSO"
    }
  },
  {
    "id": "thpt-t11-songsong-08",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong hình lập phương $ABCD.A'B'C'D'$ (như hình), đường chéo $BD$ song song với mặt phẳng nào sau đây?",
    "options": [
      {
        "key": "A",
        "text": "$(ABB'A')$"
      },
      {
        "key": "B",
        "text": "$(ADD'A')$"
      },
      {
        "key": "C",
        "text": "$(ACC'A')$"
      },
      {
        "key": "D",
        "text": "$(A'B'C'D')$"
      }
    ],
    "answer": "D",
    "explanation": "$BD \\parallel B'D'$ với $B'D' \\subset (A'B'C'D')$ và $BD$ không nằm trong mặt phẳng đó nên $BD$ song song $(A'B'C'D')$.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "song song",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "cube",
      "names": [
        "A",
        "B",
        "C",
        "D",
        "A'",
        "B'",
        "C'",
        "D'"
      ]
    }
  },
  {
    "id": "thpt-t11-songsong-09",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Hai đường thẳng cùng nằm trong một mặt phẳng và không có điểm chung thì",
    "options": [
      {
        "key": "A",
        "text": "cắt nhau"
      },
      {
        "key": "B",
        "text": "chồng lên nhau"
      },
      {
        "key": "C",
        "text": "vuông góc"
      },
      {
        "key": "D",
        "text": "song song"
      }
    ],
    "answer": "D",
    "explanation": "Theo định nghĩa hai đường thẳng song song trong mặt phẳng.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "song song",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-10",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong phép chiếu song song, khi đường thẳng $a$ song song với phương chiếu thì hình chiếu của $a$ là",
    "options": [
      {
        "key": "A",
        "text": "một đường thẳng song song $a$"
      },
      {
        "key": "B",
        "text": "một đường thẳng cắt $a$"
      },
      {
        "key": "C",
        "text": "một điểm"
      },
      {
        "key": "D",
        "text": "một đường tròn"
      }
    ],
    "answer": "C",
    "explanation": "Trường hợp suy biến: đường thẳng song song phương chiếu có hình chiếu là một điểm.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "phép chiếu song song",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-11",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong phép chiếu song song (không suy biến), hình chiếu của một tam giác là",
    "options": [
      {
        "key": "A",
        "text": "một tam giác"
      },
      {
        "key": "B",
        "text": "một đoạn thẳng"
      },
      {
        "key": "C",
        "text": "một đường tròn"
      },
      {
        "key": "D",
        "text": "một điểm"
      }
    ],
    "answer": "A",
    "explanation": "Khi không suy biến, hình chiếu song song của tam giác là một tam giác.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "phép chiếu song song",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-12",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho tứ diện $ABCD$, $M$, $N$, $P$ lần lượt là trung điểm của $AB$, $AC$, $AD$. Mặt phẳng $(MNP)$ song song với $(BCD)$. Tỉ số $\\dfrac{S_{MNP}}{S_{BCD}}$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{1}{4}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{1}{3}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{8}$"
      }
    ],
    "answer": "B",
    "explanation": "Tam giác $MNP$ đồng dạng với tam giác $BCD$ theo tỉ số $\\dfrac{1}{2}$ nên tỉ số diện tích bằng $\\left(\\dfrac{1}{2}\\right)^2=\\dfrac{1}{4}$.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "song song",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-13",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Trong hình lập phương $ABCD.A'B'C'D'$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$AB$ song song với $(A'B'C'D')$"
      },
      {
        "key": "b",
        "text": "$AC$ song song với $(A'B'C'D')$"
      },
      {
        "key": "c",
        "text": "$AB'$ song song với $D'C$"
      },
      {
        "key": "d",
        "text": "$A'B'$ song song với $(ABCD)$"
      }
    ],
    "answer": "ĐĐSĐ",
    "points": 1,
    "tags": [
      "hình học không gian",
      "song song",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-14",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hình chóp $S.ABCD$ có đáy là hình bình hành $ABCD$, $O=AC \\cap BD$ (như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$(SAC)$ và $(SBD)$ cắt nhau theo giao tuyến $SO$"
      },
      {
        "key": "b",
        "text": "$O$ là trung điểm của $AC$"
      },
      {
        "key": "c",
        "text": "$SO$ song song với $(ABCD)$"
      },
      {
        "key": "d",
        "text": "$AB$ song song với $(SCD)$"
      }
    ],
    "answer": "ĐĐSĐ",
    "points": 1,
    "tags": [
      "hình học không gian",
      "giao tuyến",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "pyramid4",
      "names": [
        "S",
        "A",
        "B",
        "C",
        "D"
      ],
      "extras": "O = AC cắt BD\nSO"
    }
  },
  {
    "id": "thpt-t11-songsong-15",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét phép chiếu song song. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Hình chiếu của một đoạn thẳng là một đoạn thẳng hoặc một điểm"
      },
      {
        "key": "b",
        "text": "Hình chiếu song song bảo toàn tính song song của hai đường thẳng (không suy biến)"
      },
      {
        "key": "c",
        "text": "Hình chiếu của tam giác luôn là một tam giác"
      },
      {
        "key": "d",
        "text": "Hình chiếu của đường tròn có thể là một elip"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) Đúng. c) Có thể suy biến thành đoạn thẳng — sai. d) Đúng.",
    "points": 1,
    "tags": [
      "hình học không gian",
      "phép chiếu song song",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-16",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hình chóp $S.ABC$, $M$, $N$ lần lượt là trung điểm $SB$, $SC$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$MN \\parallel BC$"
      },
      {
        "key": "b",
        "text": "$(AMN)$ cắt $(ABC)$ theo giao tuyến là đường thẳng qua $A$ song song $MN$"
      },
      {
        "key": "c",
        "text": "$MN=\\dfrac{BC}{2}$"
      },
      {
        "key": "d",
        "text": "$AM$ song song với $(SBC)$"
      }
    ],
    "answer": "ĐĐĐS",
    "points": 1,
    "tags": [
      "hình học không gian",
      "tính chất song song",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-17",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Trong hình lập phương $ABCD.A'B'C'D'$, $O$, $O'$ lần lượt là tâm hai mặt đáy. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$(ACC'A')$ và $(BDD'B')$ cắt nhau theo giao tuyến $OO'$"
      },
      {
        "key": "b",
        "text": "$BD$ cắt $B'D'$"
      },
      {
        "key": "c",
        "text": "$AC$ và $BD$ cắt nhau tại $O$"
      },
      {
        "key": "d",
        "text": "$A'C'$ song song với $AC$"
      }
    ],
    "answer": "ĐSĐĐ",
    "points": 1,
    "tags": [
      "hình học không gian",
      "hình lập phương",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-18",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hình chóp đều $S.ABCD$, $M$ là trung điểm $SA$. Xét mặt phẳng $(MBD)$ cắt chóp. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Thiết diện là tam giác $MBD$"
      },
      {
        "key": "b",
        "text": "Thiết diện chứa đoạn $AC$"
      },
      {
        "key": "c",
        "text": "$MB=MD$"
      },
      {
        "key": "d",
        "text": "Thiết diện chia hình chóp thành hai phần"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đúng. b) $M$, $B$, $D$ không chứa $A$ hay $C$ trọn đoạn $AC$ — sai. c) Do đối xứng của chóp đều — đúng. d) Đúng.",
    "points": 1,
    "tags": [
      "hình học không gian",
      "thiết diện",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-19",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong hình lập phương $ABCD.A'B'C'D'$, có bao nhiêu mặt của hình lập phương song song với mặt $(ABCD)$?",
    "answer": "1",
    "explanation": "Chỉ có mặt $(A'B'C'D')$.",
    "points": 0.5,
    "tags": [
      "hình học không gian",
      "song song",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-20",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hình lập phương có bao nhiêu mặt?",
    "answer": "6",
    "explanation": "Hình lập phương có 6 mặt, mỗi mặt nằm trong một mặt phẳng.",
    "points": 0.5,
    "tags": [
      "hình học không gian",
      "hình lập phương",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-21",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Mặt phẳng đi qua trung điểm của $SA$ và song song với $(ABCD)$ cắt hình chóp $S.ABCD$. Thiết diện tạo thành có bao nhiêu cạnh?",
    "answer": "4",
    "explanation": "Mặt phẳng cắt bốn cạnh bên tại trung điểm, thiết diện là tứ giác (4 cạnh).",
    "points": 0.5,
    "tags": [
      "hình học không gian",
      "thiết diện",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-22",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong hình lập phương $ABCD.A'B'C'D'$, có bao nhiêu cạnh của hình lập phương song song với cạnh $AB$ (không tính chính $AB$)?",
    "answer": "3",
    "explanation": "Các cạnh song song với $AB$ là $DC$, $A'B'$, $D'C'$: 3 cạnh.",
    "points": 0.5,
    "tags": [
      "hình học không gian",
      "hình lập phương",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-23",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tứ diện $ABCD$ có $M$, $N$ lần lượt là trung điểm $AB$, $AC$. Biết $BC=10$, tính $MN$.",
    "answer": "5",
    "explanation": "$MN$ là đường trung bình của tam giác $ABC$: $MN=\\dfrac{BC}{2}=5$.",
    "points": 0.5,
    "tags": [
      "hình học không gian",
      "đường trung bình",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-24",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hình lập phương $ABCD.A'B'C'D'$ có cạnh bằng 2. Tính khoảng cách giữa hai đường thẳng song song $AB$ và $C'D'$ (làm tròn đến hàng phần trăm).",
    "answer": "2,83",
    "explanation": "$AB$ và $C'D'$ cùng nằm trong mặt chéo $ABC'D'$ (hình chữ nhật), khoảng cách bằng $BC'=2\\sqrt{2}\\approx 2{,}83$.",
    "points": 0.5,
    "tags": [
      "hình học không gian",
      "khoảng cách",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-songsong-25",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hình chóp $S.ABCD$ có đáy là hình bình hành, $CD=8$. Gọi $M$, $N$ lần lượt là trung điểm của $SA$, $SB$. Tính độ dài $MN$.",
    "answer": "4",
    "explanation": "$MN$ là đường trung bình của tam giác $SAB$ nên $MN=\\dfrac{AB}{2}=\\dfrac{CD}{2}=4$.",
    "points": 0.5,
    "tags": [
      "hình học không gian",
      "khoảng cách",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-01",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Đường thẳng $a$ vuông góc với mặt phẳng $(P)$ khi $a$ vuông góc với",
    "options": [
      {
        "key": "A",
        "text": "một đường thẳng bất kì của $(P)$"
      },
      {
        "key": "B",
        "text": "hai đường thẳng song song của $(P)$"
      },
      {
        "key": "C",
        "text": "hai đường thẳng cắt nhau nằm trong $(P)$"
      },
      {
        "key": "D",
        "text": "mọi mặt phẳng chứa $a$"
      }
    ],
    "answer": "C",
    "explanation": "Theo định lí: $a \\perp (P)$ khi $a$ vuông góc với hai đường thẳng cắt nhau trong $(P)$.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "vuông góc",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-02",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hình chóp $S.ABC$ có $SA \\perp (ABC)$. Khẳng định nào sau đây đúng?",
    "options": [
      {
        "key": "A",
        "text": "$SA \\perp BC$"
      },
      {
        "key": "B",
        "text": "$SA$ cắt $BC$"
      },
      {
        "key": "C",
        "text": "$SA$ song song $BC$"
      },
      {
        "key": "D",
        "text": "$SA$ vuông góc $AB$ nhưng không vuông góc $AC$"
      }
    ],
    "answer": "A",
    "explanation": "$SA \\perp (ABC)$ nên $SA$ vuông góc với mọi đường thẳng trong $(ABC)$, kể cả $BC$.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "vuông góc",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-03",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong hình lập phương $ABCD.A'B'C'D'$, góc giữa đường thẳng $A'C'$ và mặt phẳng $(ABCD)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$45^\\circ$"
      },
      {
        "key": "B",
        "text": "$0^\\circ$"
      },
      {
        "key": "C",
        "text": "$90^\\circ$"
      },
      {
        "key": "D",
        "text": "$30^\\circ$"
      }
    ],
    "answer": "B",
    "explanation": "$A'C' \\parallel AC \\subset (ABCD)$ nên góc giữa chúng bằng $0^\\circ$.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "góc",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-04",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Hình chóp đều $S.ABC$ có $SA=SB=SC=5$, tam giác $ABC$ đều cạnh 6. Độ dài đường cao $SO$ (chân cao là tâm đáy) là",
    "options": [
      {
        "key": "A",
        "text": "$4$"
      },
      {
        "key": "B",
        "text": "$\\sqrt{37}$"
      },
      {
        "key": "C",
        "text": "$\\sqrt{13}$"
      },
      {
        "key": "D",
        "text": "$3$"
      }
    ],
    "answer": "C",
    "explanation": "Bán kính đường tròn ngoại tiếp tam giác đều $R=\\dfrac{6}{\\sqrt{3}}=2\\sqrt{3}$; $SO=\\sqrt{25-12}=\\sqrt{13}$.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "đường cao",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-05",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Hình chóp $S.ABCD$ (như hình) có đáy là hình vuông cạnh 4, $SA \\perp (ABCD)$, $SA=3$. Thể tích khối chóp là",
    "options": [
      {
        "key": "A",
        "text": "$12$"
      },
      {
        "key": "B",
        "text": "$24$"
      },
      {
        "key": "C",
        "text": "$16$"
      },
      {
        "key": "D",
        "text": "$8$"
      }
    ],
    "answer": "C",
    "explanation": "$V=\\dfrac{1}{3} \\cdot 4^2 \\cdot 3=16$.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "thể tích",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "pyramid4-sa",
      "names": [
        "S",
        "A",
        "B",
        "C",
        "D"
      ]
    }
  },
  {
    "id": "thpt-t11-vuonggoc-xs-06",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Hình chóp $S.ABCD$ có đáy hình vuông cạnh 4, $SA \\perp (ABCD)$, $SA=3$. Góc giữa $SB$ và $(ABCD)$ (làm tròn đến hàng phần mười độ) bằng",
    "options": [
      {
        "key": "A",
        "text": "$45{,}0^\\circ$"
      },
      {
        "key": "B",
        "text": "$53{,}1^\\circ$"
      },
      {
        "key": "C",
        "text": "$60{,}0^\\circ$"
      },
      {
        "key": "D",
        "text": "$36{,}9^\\circ$"
      }
    ],
    "answer": "D",
    "explanation": "Góc giữa $SB$ và đáy là $\\widehat{SBA}$ với $\\tan \\widehat{SBA}=\\dfrac{SA}{AB}=\\dfrac{3}{4}$ nên góc $\\approx 36{,}9^\\circ$.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "góc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-07",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Hình chóp $S.ABCD$ có đáy hình vuông cạnh 4, $SA \\perp (ABCD)$, $SA=2$. Khoảng cách từ $S$ đến đường thẳng $BD$ là",
    "options": [
      {
        "key": "A",
        "text": "$2\\sqrt{2}$"
      },
      {
        "key": "B",
        "text": "$4$"
      },
      {
        "key": "C",
        "text": "$2\\sqrt{3}$"
      },
      {
        "key": "D",
        "text": "$\\sqrt{10}$"
      }
    ],
    "answer": "C",
    "explanation": "Gọi $O$ là tâm đáy. $BD \\perp (SAC)$ nên $d(S,BD)=SO=\\sqrt{SA^2+AO^2}=\\sqrt{4+8}=2\\sqrt{3}$.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "khoảng cách",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-08",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Hình chóp $S.ABC$ có $SA \\perp (ABC)$, tam giác $ABC$ vuông tại $A$ với $AB=3$, $AC=4$, $SA=5$. Thể tích khối chóp $S.ABC$ là",
    "options": [
      {
        "key": "A",
        "text": "$20$"
      },
      {
        "key": "B",
        "text": "$10$"
      },
      {
        "key": "C",
        "text": "$30$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{10}{3}$"
      }
    ],
    "answer": "B",
    "explanation": "$S_{ABC}=\\dfrac{3 \\cdot 4}{2}=6$; $V=\\dfrac{1}{3} \\cdot 6 \\cdot 5=10$.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "thể tích",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-09",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hai biến cố $A$, $B$ với $P(A)=0{,}5$, $P(B)=0{,}4$, $P(A \\cap B)=0{,}2$. Khi đó $P(A \\cup B)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$0{,}9$"
      },
      {
        "key": "B",
        "text": "$0{,}3$"
      },
      {
        "key": "C",
        "text": "$0{,}7$"
      },
      {
        "key": "D",
        "text": "$0{,}1$"
      }
    ],
    "answer": "C",
    "explanation": "$P(A \\cup B)=0{,}5+0{,}4-0{,}2=0{,}7$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "biến cố hợp",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-10",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Gieo một xúc xắc sáu mặt đồng chất. Gọi $A$ là biến cố \"mặt xuất hiện là số chẵn\", $B$ là biến cố \"mặt xuất hiện chia hết cho 3\". Xác suất của biến cố $A \\cup B$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{2}{3}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{5}{6}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{3}$"
      }
    ],
    "answer": "B",
    "explanation": "$A=\\{2;4;6\\}$, $B=\\{3;6\\}$, $A \\cup B=\\{2;3;4;6\\}$ nên $P=\\dfrac{4}{6}=\\dfrac{2}{3}$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "biến cố hợp",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-11",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một hộp có 3 bi đỏ và 4 bi xanh cùng kích thước. Lấy lần lượt 2 bi không hoàn lại. Xác suất để cả hai bi đều màu đỏ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{9}{49}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{3}{7}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{2}{7}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{7}$"
      }
    ],
    "answer": "D",
    "explanation": "$P=\\dfrac{3}{7} \\cdot \\dfrac{2}{6}=\\dfrac{6}{42}=\\dfrac{1}{7}$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "quy tắc nhân",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-12",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Bảng tần số thời gian tự học (giờ/tuần) của 20 học sinh như hình. Tứ phân vị thứ ba của mẫu số liệu ghép nhóm là",
    "options": [
      {
        "key": "A",
        "text": "$9{,}5$"
      },
      {
        "key": "B",
        "text": "$10{,}5$"
      },
      {
        "key": "C",
        "text": "$10$"
      },
      {
        "key": "D",
        "text": "$9$"
      }
    ],
    "answer": "C",
    "explanation": "$Q_3$ ở vị trí $\\dfrac{3 \\cdot 20}{4}=15$. Tần số tích luỹ: $4;12;18$ nên $Q_3$ thuộc nhóm $[9;11)$: $Q_3=9+\\dfrac{15-12}{6} \\cdot 2=10$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "tứ phân vị ghép nhóm",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "grouped",
      "groups": "[5; 7): 4\n[7; 9): 8\n[9; 11): 6\n[11; 13): 2",
      "label": "Thời gian (giờ)",
      "freqLabel": "Số học sinh",
      "view": "htable",
      "polygon": false,
      "extras": ""
    }
  },
  {
    "id": "thpt-t11-vuonggoc-xs-13",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Hình chóp $S.ABC$ có $SA \\perp (ABC)$, tam giác $ABC$ vuông tại $B$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$SA \\perp AB$"
      },
      {
        "key": "b",
        "text": "$SA \\perp BC$"
      },
      {
        "key": "c",
        "text": "$BC \\perp (SAB)$"
      },
      {
        "key": "d",
        "text": "$BC \\perp SC$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) Đúng. c) $BC \\perp AB$ (vuông tại $B$) và $BC \\perp SA$ nên $BC \\perp (SAB)$ — đúng. d) Từ $BC \\perp (SAB)$ chỉ suy ra $BC \\perp SB$, không suy ra $BC \\perp SC$ — sai.",
    "points": 1,
    "tags": [
      "hình học không gian",
      "vuông góc",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-14",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Hình chóp $S.ABCD$ có đáy là hình vuông cạnh 2, $SA \\perp (ABCD)$, $SA=2$ (như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$SB=2\\sqrt{2}$"
      },
      {
        "key": "b",
        "text": "$AC$ vuông góc $BD$"
      },
      {
        "key": "c",
        "text": "Khoảng cách từ $S$ đến $AC$ bằng 0"
      },
      {
        "key": "d",
        "text": "Góc giữa $SD$ và $(ABCD)$ bằng $45^\\circ$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $SB^2=SA^2+AB^2=8$ — đúng. b) Hai đường chéo hình vuông — đúng. c) $SA \\perp AC$ và $A \\in AC$ nên khoảng cách bằng $SA=2 \\ne 0$ — sai. d) $\\tan \\widehat{SDA}=\\dfrac{SA}{AD}=1$ — đúng.",
    "points": 1,
    "tags": [
      "hình học không gian",
      "góc và khoảng cách",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "pyramid4-sa",
      "names": [
        "S",
        "A",
        "B",
        "C",
        "D"
      ]
    }
  },
  {
    "id": "thpt-t11-vuonggoc-xs-15",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về thể tích:",
    "options": [
      {
        "key": "a",
        "text": "Thể tích khối chóp bằng $\\dfrac{1}{3}$ diện tích đáy nhân chiều cao"
      },
      {
        "key": "b",
        "text": "Thể tích khối lập phương cạnh $a$ là $a^3$"
      },
      {
        "key": "c",
        "text": "Thể tích khối lăng trụ bằng diện tích đáy nhân chiều cao"
      },
      {
        "key": "d",
        "text": "Hình chóp đều có đáy là hình vuông cạnh 2, chiều cao 3 có thể tích bằng 12"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a), b), c) Đúng. d) $V=\\dfrac{1}{3} \\cdot 4 \\cdot 3=4 \\ne 12$ — sai.",
    "points": 1,
    "tags": [
      "hình học không gian",
      "thể tích",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-16",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Hình chóp $S.ABCD$ có đáy là hình vuông cạnh 4, $SA \\perp (ABCD)$, $SA=3$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$BD=8$"
      },
      {
        "key": "b",
        "text": "$SC=\\sqrt{41}$"
      },
      {
        "key": "c",
        "text": "Khoảng cách từ $S$ đến $(ABCD)$ bằng 3"
      },
      {
        "key": "d",
        "text": "Thể tích khối chóp bằng 12"
      }
    ],
    "answer": "SĐĐS",
    "explanation": "a) $BD=4\\sqrt{2} \\ne 8$ — sai. b) $SC^2=SA^2+AC^2=9+32=41$ — đúng. c) Đúng. d) $V=\\dfrac{1}{3} \\cdot 16 \\cdot 3=16 \\ne 12$ — sai.",
    "points": 1,
    "tags": [
      "hình học không gian",
      "khoảng cách",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-17",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Gieo một xúc xắc sáu mặt đồng chất. Gọi $A$ là biến cố \"ra mặt 6 chấm\", $B$ là biến cố \"ra mặt số lẻ\". Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$P(A)=\\dfrac{1}{6}$"
      },
      {
        "key": "b",
        "text": "$A$ và $B$ là hai biến cố xung khắc"
      },
      {
        "key": "c",
        "text": "$P(A \\cup B)=\\dfrac{2}{3}$"
      },
      {
        "key": "d",
        "text": "$P(A \\cap B)=\\dfrac{1}{6}$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) Không thể đồng thời ra 6 và số lẻ — đúng. c) $\\dfrac{1}{6}+\\dfrac{1}{2}=\\dfrac{2}{3}$ — đúng. d) $A \\cap B=\\varnothing$ nên $P=0$ — sai.",
    "points": 1,
    "tags": [
      "xác suất",
      "biến cố xung khắc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-18",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cân nặng (kg) của 20 học sinh được lập thành bảng tần số ghép nhóm như hình. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Cỡ mẫu $n=20$"
      },
      {
        "key": "b",
        "text": "Nhóm chứa trung vị là $[45;50)$"
      },
      {
        "key": "c",
        "text": "Mốt của mẫu số liệu là 45"
      },
      {
        "key": "d",
        "text": "Tần số của nhóm $[50;55)$ là 5"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $5+8+5+2=20$ — đúng. b) Trung vị ở vị trí thứ 10, 11; tần số tích luỹ $5;13$ nên thuộc nhóm $[45;50)$ — đúng. c) Nhóm $[45;50)$ có tần số lớn nhất, mốt $=45+\\dfrac{8-5}{(8-5)+(8-5)} \\cdot 5=47{,}5 \\ne 45$ — sai. d) Đúng.",
    "points": 1,
    "tags": [
      "thống kê",
      "mẫu ghép nhóm",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "grouped",
      "groups": "[40; 45): 5\n[45; 50): 8\n[50; 55): 5\n[55; 60): 2",
      "label": "Cân nặng (kg)",
      "freqLabel": "Số học sinh",
      "view": "htable",
      "polygon": false,
      "extras": ""
    }
  },
  {
    "id": "thpt-t11-vuonggoc-xs-19",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hình chóp đều $S.ABC$ có $SA=6$, tam giác $ABC$ đều cạnh 6. Tính độ dài đường cao $SO$ (làm tròn đến hàng phần mười).",
    "answer": "4,9",
    "explanation": "$R=\\dfrac{6}{\\sqrt{3}}=2\\sqrt{3}$; $SO=\\sqrt{36-12}=\\sqrt{24} \\approx 4{,}9$.",
    "points": 0.5,
    "tags": [
      "hình học không gian",
      "đường cao",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-20",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hình chóp $S.ABCD$ có đáy hình vuông cạnh 2, $SA \\perp (ABCD)$, $SA=2$. Tính thể tích khối chóp (làm tròn đến hàng phần trăm).",
    "answer": "2,67",
    "explanation": "$V=\\dfrac{1}{3} \\cdot 4 \\cdot 2=\\dfrac{8}{3} \\approx 2{,}67$.",
    "points": 0.5,
    "tags": [
      "hình học không gian",
      "thể tích",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-21",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính khoảng cách từ đỉnh $A$ của hình lập phương $ABCD.A'B'C'D'$ cạnh 3 đến mặt phẳng $(A'B'C'D')$.",
    "answer": "3",
    "explanation": "$A$ cách đều mặt đối diện một khoảng bằng cạnh lập phương: 3.",
    "points": 0.5,
    "tags": [
      "hình học không gian",
      "khoảng cách",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-22",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hình chóp $S.ABC$ có $SA \\perp (ABC)$, tam giác $ABC$ đều cạnh 4, $SA=2\\sqrt{3}$. Tính khoảng cách từ $S$ đến đường thẳng $BC$ (làm tròn đến hàng phần mười).",
    "answer": "4,9",
    "explanation": "Gọi $H$ là trung điểm $BC$: $AH=2\\sqrt{3}$, $BC \\perp (SAH)$ nên $d(S,BC)=SH=\\sqrt{12+12}=2\\sqrt{6}\\approx 4{,}9$.",
    "points": 0.5,
    "tags": [
      "hình học không gian",
      "đường cao",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-23",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một hộp có 2 bi đỏ và 3 bi xanh cùng kích thước. Bốc ngẫu nhiên đồng thời 2 bi. Tính xác suất bốc được 1 bi đỏ và 1 bi xanh (viết dưới dạng số thập phân).",
    "answer": "0,6",
    "explanation": "$P=\\dfrac{2 \\cdot 3}{C_5^2}=\\dfrac{6}{10}=0{,}6$.",
    "points": 0.5,
    "tags": [
      "xác suất",
      "tổ hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-24",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hai biến cố độc lập $A$, $B$ với $P(A)=0{,}3$, $P(B)=0{,}5$. Tính $P(A \\cap B)$.",
    "answer": "0,15",
    "explanation": "Biến cố độc lập: $P(A \\cap B)=0{,}3 \\cdot 0{,}5=0{,}15$.",
    "points": 0.5,
    "tags": [
      "xác suất",
      "biến cố độc lập",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t11-vuonggoc-xs-25",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Gieo hai xúc xắc sáu mặt đồng chất. Tính xác suất để có ít nhất một xúc xắc ra mặt 6 chấm (làm tròn đến hàng phần trăm).",
    "answer": "0,31",
    "explanation": "Biến cố đối: không có mặt 6 nào, xác suất $\\left(\\dfrac{5}{6}\\right)^2=\\dfrac{25}{36}$. Vậy $P=1-\\dfrac{25}{36}=\\dfrac{11}{36} \\approx 0{,}31$.",
    "points": 0.5,
    "tags": [
      "xác suất",
      "biến cố đối",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đạo hàm của hàm số $y=x^3-3x$ là",
    "options": [
      {
        "key": "A",
        "text": "$x^2-3$"
      },
      {
        "key": "B",
        "text": "$3x^2-3$"
      },
      {
        "key": "C",
        "text": "$3x^2+3$"
      },
      {
        "key": "D",
        "text": "$x^2+3$"
      }
    ],
    "answer": "B",
    "explanation": "$y'=3x^2-3$.",
    "points": 0.25,
    "tags": [
      "đạo hàm",
      "đơn điệu",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hàm số $y=2x^2+1$ nghịch biến trên khoảng nào?",
    "options": [
      {
        "key": "A",
        "text": "$(0;+\\infty)$"
      },
      {
        "key": "B",
        "text": "$\\mathbb{R}$"
      },
      {
        "key": "C",
        "text": "$(-\\infty;0)$"
      },
      {
        "key": "D",
        "text": "$(-\\infty;+\\infty)$"
      }
    ],
    "answer": "C",
    "explanation": "$y'=4x<0 \\Leftrightarrow x<0$.",
    "points": 0.25,
    "tags": [
      "đơn điệu",
      "parabol",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hoành độ điểm cực tiểu của hàm số $y=x^3-3x^2+1$ là",
    "options": [
      {
        "key": "A",
        "text": "$0$"
      },
      {
        "key": "B",
        "text": "$1$"
      },
      {
        "key": "C",
        "text": "$-2$"
      },
      {
        "key": "D",
        "text": "$2$"
      }
    ],
    "answer": "D",
    "explanation": "$y'=3x^2-6x=0 \\Leftrightarrow x=0, x=2$; $y'$ đổi dấu từ $-$ sang $+$ tại $x=2$ nên cực tiểu tại $x=2$.",
    "points": 0.25,
    "tags": [
      "cực trị",
      "hàm bậc ba",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Bảng biến thiên của hàm số $y=f(x)$ như hình. Hàm số có bao nhiêu điểm cực trị?",
    "options": [
      {
        "key": "A",
        "text": "$1$"
      },
      {
        "key": "B",
        "text": "$2$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$0$"
      }
    ],
    "answer": "B",
    "explanation": "Hàm bậc ba với $y'$ đổi dấu hai lần nên có 1 cực đại và 1 cực tiểu: 2 điểm cực trị.",
    "points": 0.25,
    "tags": [
      "cực trị",
      "bảng biến thiên",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "vartable",
      "expr": "x^3-3x+1",
      "fname": "y"
    }
  },
  {
    "id": "thpt-t12-dondieu-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đồ thị hàm số $y=f'(x)$ như hình. Hàm số $y=f(x)$ đồng biến trên khoảng nào?",
    "options": [
      {
        "key": "A",
        "text": "$(1;3)$"
      },
      {
        "key": "B",
        "text": "$(-\\infty;2)$"
      },
      {
        "key": "C",
        "text": "$(3;+\\infty)$"
      },
      {
        "key": "D",
        "text": "$(0;4)$"
      }
    ],
    "answer": "C",
    "explanation": "Trên $(3;+\\infty)$ có $f'(x)>0$ nên $f$ đồng biến.",
    "points": 0.25,
    "tags": [
      "đơn điệu",
      "đồ thị đạo hàm",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^2-4x+3"
      ],
      "xMin": -1,
      "xMax": 5,
      "yMin": -2,
      "yMax": 4,
      "labels": true
    }
  },
  {
    "id": "thpt-t12-dondieu-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị cực tiểu của hàm số $y=x^3+3x^2-9x+2$ là",
    "options": [
      {
        "key": "A",
        "text": "$-3$"
      },
      {
        "key": "B",
        "text": "$-1$"
      },
      {
        "key": "C",
        "text": "$2$"
      },
      {
        "key": "D",
        "text": "$1$"
      }
    ],
    "answer": "A",
    "explanation": "$y'=3x^2+6x-9=0 \\Leftrightarrow x=-3, x=1$; cực tiểu tại $x=1$: $y(1)=1+3-9+2=-3$.",
    "points": 0.25,
    "tags": [
      "cực trị",
      "giá trị cực trị",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị cực đại của hàm số $y=-x^3+3x$ là",
    "options": [
      {
        "key": "A",
        "text": "$-2$"
      },
      {
        "key": "B",
        "text": "$1$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$2$"
      }
    ],
    "answer": "D",
    "explanation": "$y'=-3x^2+3=0 \\Leftrightarrow x=\\pm 1$; cực đại tại $x=1$: $y(1)=-1+3=2$.",
    "points": 0.25,
    "tags": [
      "cực trị",
      "giá trị cực trị",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hàm số $y=x^3-3mx^2+3(m^2-1)x+2$ có cực trị khi",
    "options": [
      {
        "key": "A",
        "text": "$m \\ge 1$"
      },
      {
        "key": "B",
        "text": "với mọi $m$"
      },
      {
        "key": "C",
        "text": "$m>0$"
      },
      {
        "key": "D",
        "text": "$m<1$"
      }
    ],
    "answer": "B",
    "explanation": "$y'=3x^2-6mx+3(m^2-1)$ có $\\Delta=36m^2-36(m^2-1)=36>0$ với mọi $m$ nên luôn có 2 nghiệm phân biệt: luôn có cực trị.",
    "points": 0.25,
    "tags": [
      "cực trị",
      "tham số",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hàm số $y=x^4-2x^2$ có bao nhiêu điểm cực trị?",
    "options": [
      {
        "key": "A",
        "text": "$1$"
      },
      {
        "key": "B",
        "text": "$2$"
      },
      {
        "key": "C",
        "text": "$4$"
      },
      {
        "key": "D",
        "text": "$3$"
      }
    ],
    "answer": "D",
    "explanation": "$y'=4x^3-4x=4x(x-1)(x+1)=0 \\Leftrightarrow x \\in \\{-1;0;1\\}$: 3 điểm.",
    "points": 0.25,
    "tags": [
      "cực trị",
      "hàm trùng phương",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Bảng biến thiên của $y=f(x)$ cho thấy $f$ tăng trên $(-\\infty;1)$ và giảm trên $(1;+\\infty)$. Khẳng định nào đúng?",
    "options": [
      {
        "key": "A",
        "text": "$f$ có cực đại tại $x=1$"
      },
      {
        "key": "B",
        "text": "$f$ có cực tiểu tại $x=1$"
      },
      {
        "key": "C",
        "text": "$f$ không có cực trị"
      },
      {
        "key": "D",
        "text": "$f$ có hai điểm cực trị"
      }
    ],
    "answer": "A",
    "explanation": "$y'$ đổi dấu từ $+$ sang $-$ qua $x=1$: cực đại.",
    "points": 0.25,
    "tags": [
      "cực trị",
      "bảng biến thiên",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đồ thị hàm số $y=f'(x)$ như hình. Hàm số $y=f(x)$ nghịch biến trên khoảng nào?",
    "options": [
      {
        "key": "A",
        "text": "$(-2;2)$"
      },
      {
        "key": "B",
        "text": "$(0;+\\infty)$"
      },
      {
        "key": "C",
        "text": "không tồn tại"
      },
      {
        "key": "D",
        "text": "$(-\\infty;-2)$"
      }
    ],
    "answer": "D",
    "explanation": "Với $x<-2$ có $f'(x)<0$ nên $f$ nghịch biến trên $(-\\infty;-2)$.",
    "points": 0.25,
    "tags": [
      "đơn điệu",
      "đồ thị đạo hàm",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "-x^2+4"
      ],
      "xMin": -4,
      "xMax": 4,
      "yMin": -6,
      "yMax": 6,
      "labels": true
    }
  },
  {
    "id": "thpt-t12-dondieu-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Có bao nhiêu giá trị nguyên của $m$ thuộc đoạn $[-3;3]$ để hàm số $y=x^3+mx+1$ không có cực trị?",
    "options": [
      {
        "key": "A",
        "text": "$3$"
      },
      {
        "key": "B",
        "text": "$5$"
      },
      {
        "key": "C",
        "text": "$4$"
      },
      {
        "key": "D",
        "text": "$2$"
      }
    ],
    "answer": "C",
    "explanation": "Không có cực trị khi $y'=3x^2+m \\ge 0$ với mọi $x \\Leftrightarrow m \\ge 0$: $m \\in \\{0;1;2;3\\}$: 4 giá trị.",
    "points": 0.25,
    "tags": [
      "cực trị",
      "tham số",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=x^3-3x$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$y'=3x^2-3$"
      },
      {
        "key": "b",
        "text": "Hàm số đồng biến trên $(1;+\\infty)$"
      },
      {
        "key": "c",
        "text": "Hàm số có cực đại tại $x=-1$"
      },
      {
        "key": "d",
        "text": "Giá trị cực đại của hàm số bằng $-2$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) $y'>0$ khi $|x|>1$ — đúng. c) $y'$ đổi dấu $+ \\to -$ tại $x=-1$ — đúng. d) Giá trị cực đại $y(-1)=2 \\ne -2$ — sai.",
    "points": 1,
    "tags": [
      "cực trị",
      "hàm bậc ba",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=x^3-12x+1$ có bảng biến thiên như hình. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$y'=3x^2-12$"
      },
      {
        "key": "b",
        "text": "Hàm số có cực đại tại $x=-2$"
      },
      {
        "key": "c",
        "text": "Giá trị cực đại bằng 17"
      },
      {
        "key": "d",
        "text": "Hàm số đồng biến trên $(-2;2)$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) Đúng. c) $y(-2)=-8+24+1=17$ — đúng. d) Trên $(-2;2)$ hàm nghịch biến — sai.",
    "points": 1,
    "tags": [
      "cực trị",
      "bảng biến thiên",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "vartable",
      "expr": "x^3-12x+1",
      "fname": "y"
    }
  },
  {
    "id": "thpt-t12-dondieu-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Đồ thị hàm $y=f'(x)$ như hình (parabol cắt $Ox$ tại $x=1$ và $x=3$, hướng lên). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$f'(x)=0$ tại $x=1$ và $x=3$"
      },
      {
        "key": "b",
        "text": "$f$ đồng biến trên $(1;3)$"
      },
      {
        "key": "c",
        "text": "$f$ có cực tiểu tại $x=3$"
      },
      {
        "key": "d",
        "text": "$f$ có đúng 2 điểm cực trị"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đúng. b) Trên $(1;3)$ có $f'<0$ nên $f$ nghịch biến — sai. c) $y'$ đổi dấu $- \\to +$ tại $x=3$ — đúng. d) Đúng.",
    "points": 1,
    "tags": [
      "cực trị",
      "đồ thị đạo hàm",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^2-4x+3"
      ],
      "xMin": -1,
      "xMax": 5,
      "yMin": -2,
      "yMax": 4,
      "labels": true
    }
  },
  {
    "id": "thpt-t12-dondieu-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=(x-1)^3+2$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$y'=3(x-1)^2$"
      },
      {
        "key": "b",
        "text": "$y' \\ge 0$ với mọi $x$"
      },
      {
        "key": "c",
        "text": "Hàm số đồng biến trên $\\mathbb{R}$"
      },
      {
        "key": "d",
        "text": "Hàm số có cực trị"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a), b), c) Đúng. d) $y'$ không đổi dấu nên không có cực trị — sai.",
    "points": 1,
    "tags": [
      "đơn điệu",
      "hàm bậc ba",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=x^4-4x^2+5$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$y'=4x^3-8x=0$ tại $x=0$ và $x=\\pm \\sqrt{2}$"
      },
      {
        "key": "b",
        "text": "Hàm số có 3 điểm cực trị"
      },
      {
        "key": "c",
        "text": "Giá trị cực tiểu của hàm số bằng 5"
      },
      {
        "key": "d",
        "text": "$y(0)=5$ là giá trị cực tiểu"
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng. b) Đúng. c) Giá trị cực tiểu tại $x=\\pm \\sqrt{2}$ bằng $4-8+5=1 \\ne 5$ — sai. d) $y'$ đổi dấu từ $+$ sang $-$ qua $x=0$ nên $y(0)=5$ là giá trị cực đại, không phải cực tiểu — sai.",
    "points": 1,
    "tags": [
      "cực trị",
      "hàm trùng phương",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Bảng biến thiên của hàm số $y=f(x)$: hàm tăng trên $(-\\infty;-1)$, giảm trên $(-1;2)$, tăng trên $(2;+\\infty)$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Hàm số tăng trên $(-\\infty;-1)$ và $(2;+\\infty)$"
      },
      {
        "key": "b",
        "text": "$f(-1)$ là giá trị cực tiểu"
      },
      {
        "key": "c",
        "text": "Hàm số giảm trên $(-1;2)$"
      },
      {
        "key": "d",
        "text": "$f(2)$ là giá trị cực đại"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) $f(-1)$ là giá trị cực đại — sai. c) Đúng. d) $f(2)$ là giá trị cực tiểu — sai.",
    "points": 1,
    "tags": [
      "cực trị",
      "bảng biến thiên",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính hoành độ điểm cực tiểu của hàm số $y=x^3-3x^2$.",
    "answer": "2",
    "explanation": "$y'=3x^2-6x=0 \\Leftrightarrow x=0, x=2$; cực tiểu tại $x=2$.",
    "points": 0.5,
    "tags": [
      "cực trị",
      "hàm bậc ba",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Có bao nhiêu giá trị nguyên của $m$ thuộc đoạn $[-5;5]$ để hàm số $y=x^3+mx+2$ có cực trị?",
    "answer": "5",
    "explanation": "Có cực trị khi $m<0$: $m \\in \\{-5;-4;-3;-2;-1\\}$: 5 giá trị.",
    "points": 0.5,
    "tags": [
      "cực trị",
      "tham số",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính giá trị cực đại của hàm số $y=2x^3-6x$.",
    "answer": "4",
    "explanation": "$y'=6x^2-6=0 \\Leftrightarrow x=\\pm 1$; cực đại tại $x=-1$: $y(-1)=-2+6=4$.",
    "points": 0.5,
    "tags": [
      "cực trị",
      "giá trị cực trị",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hàm số $y=x^2+6x$ nghịch biến trên $(-\\infty;x_0)$. Tìm $x_0$.",
    "answer": "-3",
    "explanation": "Hoành độ đỉnh $x_0=-\\dfrac{6}{2}=-3$.",
    "points": 0.5,
    "tags": [
      "đơn điệu",
      "parabol",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hàm số $y=-x^4+2x^2$ có bao nhiêu điểm cực trị?",
    "answer": "3",
    "explanation": "$y'=-4x^3+4x=0 \\Leftrightarrow x \\in \\{-1;0;1\\}$: 3 điểm.",
    "points": 0.5,
    "tags": [
      "cực trị",
      "hàm trùng phương",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính giá trị cực tiểu của hàm số $y=x^3-3x^2+3$.",
    "answer": "-1",
    "explanation": "Cực tiểu tại $x=2$: $y(2)=8-12+3=-1$.",
    "points": 0.5,
    "tags": [
      "cực trị",
      "giá trị cực trị",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-dondieu-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Có bao nhiêu giá trị nguyên của $a$ thuộc đoạn $[-4;4]$ để hàm số $y=x^4+ax^2$ có 3 điểm cực trị?",
    "answer": "4",
    "explanation": "Có 3 điểm cực trị khi $a<0$: $a \\in \\{-4;-3;-2;-1\\}$: 4 giá trị.",
    "points": 0.5,
    "tags": [
      "cực trị",
      "tham số",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đường thẳng đứng $x=2$ là tiệm cận đứng của đồ thị hàm số",
    "options": [
      {
        "key": "A",
        "text": "$y=x+2$"
      },
      {
        "key": "B",
        "text": "$y=x^2-4$"
      },
      {
        "key": "C",
        "text": "$y=\\dfrac{1}{x-2}$"
      },
      {
        "key": "D",
        "text": "$y=\\sqrt{x+2}$"
      }
    ],
    "answer": "C",
    "explanation": "$\\lim\\limits_{x \\to 2^+}\\dfrac{1}{x-2}=+\\infty$ nên $x=2$ là tiệm cận đứng.",
    "points": 0.25,
    "tags": [
      "tiệm cận",
      "hàm phân thức",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tiệm cận ngang của đồ thị hàm số $y=\\dfrac{2x+1}{x-1}$ là",
    "options": [
      {
        "key": "A",
        "text": "$x=1$"
      },
      {
        "key": "B",
        "text": "$y=2$"
      },
      {
        "key": "C",
        "text": "$y=1$"
      },
      {
        "key": "D",
        "text": "$y=-1$"
      }
    ],
    "answer": "B",
    "explanation": "Bậc tử bằng bậc mẫu nên tiệm cận ngang $y=\\dfrac{2}{1}=2$.",
    "points": 0.25,
    "tags": [
      "tiệm cận",
      "hàm phân thức",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tiệm cận xiên của đồ thị hàm số $y=x^3-3x$ (khi $x \\to \\pm \\infty$) là",
    "options": [
      {
        "key": "A",
        "text": "không có (bậc ba không có tiệm cận xiên)"
      },
      {
        "key": "B",
        "text": "$y=3x$"
      },
      {
        "key": "C",
        "text": "$y=x$"
      },
      {
        "key": "D",
        "text": "$y=x-3$"
      }
    ],
    "answer": "A",
    "explanation": "Hàm bậc ba không có tiệm cận.",
    "points": 0.25,
    "tags": [
      "tiệm cận",
      "hàm bậc ba",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đồ thị hàm số $y=\\dfrac{x^2-1}{x+1}$ (với $x \\ne -1$) có",
    "options": [
      {
        "key": "A",
        "text": "tiệm cận đứng $x=-1$"
      },
      {
        "key": "B",
        "text": "tiệm cận ngang $y=1$"
      },
      {
        "key": "C",
        "text": "hai tiệm cận đứng"
      },
      {
        "key": "D",
        "text": "không có tiệm cận, đồ thị là đường thẳng $y=x-1$ bỏ đi điểm $(-1;-2)$"
      }
    ],
    "answer": "D",
    "explanation": "Với $x \\ne -1$: $y=x-1$, hàm rút gọn thành bậc nhất nên không có tiệm cận.",
    "points": 0.25,
    "tags": [
      "tiệm cận",
      "hàm phân thức",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "GTLN của hàm số $y=x^3-3x$ trên đoạn $[-2;2]$ là",
    "options": [
      {
        "key": "A",
        "text": "$-2$"
      },
      {
        "key": "B",
        "text": "$0$"
      },
      {
        "key": "C",
        "text": "$2$"
      },
      {
        "key": "D",
        "text": "$6$"
      }
    ],
    "answer": "C",
    "explanation": "$y'=3x^2-3=0 \\Leftrightarrow x=\\pm 1$. So sánh $y(-2)=-2$, $y(-1)=2$, $y(1)=-2$, $y(2)=2$: GTLN $=2$.",
    "points": 0.25,
    "tags": [
      "GTLN-GTNN",
      "trên đoạn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "GTNN của hàm số $y=x^3-3x^2+1$ trên đoạn $[-1;1]$ (đồ thị như hình) là",
    "options": [
      {
        "key": "A",
        "text": "$1$"
      },
      {
        "key": "B",
        "text": "$-3$"
      },
      {
        "key": "C",
        "text": "$-1$"
      },
      {
        "key": "D",
        "text": "$0$"
      }
    ],
    "answer": "B",
    "explanation": "So sánh $y(-1)=-3$, $y(0)=1$, $y(1)=-1$: GTNN $=-3$.",
    "points": 0.25,
    "tags": [
      "GTLN-GTNN",
      "trên đoạn",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^3-3x^2+1"
      ],
      "xMin": -2,
      "xMax": 4,
      "yMin": -4,
      "yMax": 3,
      "labels": true
    }
  },
  {
    "id": "thpt-t12-gtln-tiemcan-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "GTNN của hàm số $y=x^4-2x^2+1$ trên đoạn $[0;2]$ là",
    "options": [
      {
        "key": "A",
        "text": "$0$"
      },
      {
        "key": "B",
        "text": "$1$"
      },
      {
        "key": "C",
        "text": "$9$"
      },
      {
        "key": "D",
        "text": "$-1$"
      }
    ],
    "answer": "A",
    "explanation": "$y=(x^2-1)^2 \\ge 0$, dấu bằng tại $x=1 \\in [0;2]$.",
    "points": 0.25,
    "tags": [
      "GTLN-GTNN",
      "hàm trùng phương",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đồ thị hàm số $y=\\dfrac{x+2}{x^2-1}$ có bao nhiêu tiệm cận đứng?",
    "options": [
      {
        "key": "A",
        "text": "$1$"
      },
      {
        "key": "B",
        "text": "$2$"
      },
      {
        "key": "C",
        "text": "$0$"
      },
      {
        "key": "D",
        "text": "$3$"
      }
    ],
    "answer": "B",
    "explanation": "$x^2-1=0 \\Leftrightarrow x=\\pm 1$, tử khác 0 tại cả hai chỗ nên có 2 tiệm cận đứng $x=\\pm 1$.",
    "points": 0.25,
    "tags": [
      "tiệm cận",
      "hàm phân thức",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hàm số $y=\\dfrac{x+1}{x-1}$ nghịch biến trên",
    "options": [
      {
        "key": "A",
        "text": "$\\mathbb{R}$"
      },
      {
        "key": "B",
        "text": "$(-1;1)$"
      },
      {
        "key": "C",
        "text": "không nghịch biến trên khoảng nào"
      },
      {
        "key": "D",
        "text": "$(-\\infty;1)$ và $(1;+\\infty)$"
      }
    ],
    "answer": "D",
    "explanation": "$y'=\\dfrac{-2}{(x-1)^2}<0$ với mọi $x \\ne 1$ nên nghịch biến trên từng khoảng xác định.",
    "points": 0.25,
    "tags": [
      "đơn điệu",
      "hàm phân thức",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "GTNN của hàm số $y=x^2-4x+1$ là",
    "options": [
      {
        "key": "A",
        "text": "$1$"
      },
      {
        "key": "B",
        "text": "$-4$"
      },
      {
        "key": "C",
        "text": "$-3$"
      },
      {
        "key": "D",
        "text": "$2$"
      }
    ],
    "answer": "C",
    "explanation": "$y=(x-2)^2-3 \\ge -3$.",
    "points": 0.25,
    "tags": [
      "GTLN-GTNN",
      "parabol",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "GTLN của hàm số $y=\\dfrac{x}{x^2+1}$ là",
    "options": [
      {
        "key": "A",
        "text": "$1$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{\\sqrt{2}}{2}$"
      },
      {
        "key": "C",
        "text": "$2$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{2}$"
      }
    ],
    "answer": "D",
    "explanation": "Với $x>0$: $y \\le \\dfrac{1}{2}$ (vì $2x \\le x^2+1$), dấu bằng tại $x=1$.",
    "points": 0.25,
    "tags": [
      "GTLN-GTNN",
      "hàm phân thức",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Biết hàm số $y=x^3-3x+m$ có GTNN trên đoạn $[0;2]$ bằng $-2$. Giá trị của $m$ là",
    "options": [
      {
        "key": "A",
        "text": "$0$"
      },
      {
        "key": "B",
        "text": "$1$"
      },
      {
        "key": "C",
        "text": "$2$"
      },
      {
        "key": "D",
        "text": "$-2$"
      }
    ],
    "answer": "A",
    "explanation": "Trên $[0;2]$: $y(0)=m$, $y(2)=m+2$, $y(1)=m-2$ (cực tiểu) nên GTNN $=m-2=-2 \\Rightarrow m=0$.",
    "points": 0.25,
    "tags": [
      "GTLN-GTNN",
      "tham số",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=x^3-3x^2+2$ xét trên đoạn $[0;3]$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$y'=3x^2-6x$"
      },
      {
        "key": "b",
        "text": "Hàm số có cực tiểu tại $x=2$"
      },
      {
        "key": "c",
        "text": "GTNN của hàm số trên đoạn $[0;3]$ bằng $-2$"
      },
      {
        "key": "d",
        "text": "GTLN của hàm số trên đoạn $[0;3]$ bằng 3"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) Đúng. c) $y(2)=8-12+2=-2$ là nhỏ nhất — đúng. d) GTLN $=\\max\\{y(0)=2; y(1)=0; y(3)=2\\}=2 \\ne 3$ — sai.",
    "points": 1,
    "tags": [
      "GTLN-GTNN",
      "trên đoạn",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=\\dfrac{x-1}{x+1}$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Tập xác định là $\\mathbb{R} \\setminus \\{-1\\}$"
      },
      {
        "key": "b",
        "text": "Đồ thị có tiệm cận đứng $x=-1$"
      },
      {
        "key": "c",
        "text": "Đồ thị có tiệm cận ngang $y=1$"
      },
      {
        "key": "d",
        "text": "Hàm số nghịch biến trên $\\mathbb{R}$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) Đúng. c) Đúng. d) Nghịch biến trên từng khoảng $(-\\infty;-1)$ và $(-1;+\\infty)$, không trên toàn $\\mathbb{R}$ — sai.",
    "points": 1,
    "tags": [
      "tiệm cận",
      "đơn điệu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=x^3-3x^2+1$ có đồ thị như hình. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Hàm số có cực đại tại $x=0$"
      },
      {
        "key": "b",
        "text": "Giá trị cực đại của hàm số bằng 2"
      },
      {
        "key": "c",
        "text": "Đồ thị có tiệm cận đứng $x=0$"
      },
      {
        "key": "d",
        "text": "GTNN của hàm số trên đoạn $[-1;1]$ bằng $-3$"
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng. b) Giá trị cực đại $y(0)=1 \\ne 2$ — sai. c) Hàm bậc ba không có tiệm cận — sai. d) $y(-1)=-3$ là nhỏ nhất — đúng.",
    "points": 1,
    "tags": [
      "cực trị",
      "GTLN-GTNN",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^3-3x^2+1"
      ],
      "xMin": -2,
      "xMax": 4,
      "yMin": -4,
      "yMax": 3,
      "labels": true
    }
  },
  {
    "id": "thpt-t12-gtln-tiemcan-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=x^4-4x^2+1$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Hàm số có 3 điểm cực trị"
      },
      {
        "key": "b",
        "text": "GTNN của hàm số bằng $-3$"
      },
      {
        "key": "c",
        "text": "$\\lim\\limits_{x \\to \\pm \\infty}y=+\\infty$"
      },
      {
        "key": "d",
        "text": "Hàm số đồng biến trên $(0;\\sqrt{2})$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) $y(\\pm \\sqrt{2})=4-8+1=-3$ — đúng. c) Đúng. d) Trên $(0;\\sqrt{2})$ hàm nghịch biến — sai.",
    "points": 1,
    "tags": [
      "cực trị",
      "hàm trùng phương",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=\\dfrac{x^2-4}{x-2}$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Với $x \\ne 2$, hàm số trở thành $y=x+2$"
      },
      {
        "key": "b",
        "text": "Đồ thị có tiệm cận đứng $x=2$"
      },
      {
        "key": "c",
        "text": "$\\lim\\limits_{x \\to 2}y=4$"
      },
      {
        "key": "d",
        "text": "Hàm số nghịch biến trên $\\mathbb{R} \\setminus \\{2\\}$"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) $\\lim\\limits_{x \\to 2^\\pm}y=4$ hữu hạn nên không có tiệm cận — sai. c) Đúng. d) Hàm đồng biến trên từng khoảng — sai.",
    "points": 1,
    "tags": [
      "tiệm cận",
      "hàm phân thức",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=-x^2+4x$ xét trên đoạn $[1;4]$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Hàm số đạt GTLN tại $x=2$"
      },
      {
        "key": "b",
        "text": "GTLN của hàm số bằng 5"
      },
      {
        "key": "c",
        "text": "Hàm số đạt GTNN tại $x=4$"
      },
      {
        "key": "d",
        "text": "GTNN của hàm số bằng 3"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) $y(2)=4 \\ne 5$ — sai. c) So sánh $y(1)=3$, $y(4)=0$ — đúng. d) GTNN $=0 \\ne 3$ — sai.",
    "points": 1,
    "tags": [
      "GTLN-GTNN",
      "parabol",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính GTLN của hàm số $y=-x^2+2x+1$.",
    "answer": "2",
    "explanation": "Đỉnh tại $x=1$: $y(1)=-1+2+1=2$.",
    "points": 0.5,
    "tags": [
      "GTLN-GTNN",
      "parabol",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính GTNN của hàm số $y=x^3-3x^2+4$ trên đoạn $[0;3]$.",
    "answer": "0",
    "explanation": "So sánh $y(0)=4$, $y(2)=0$, $y(3)=4$: GTNN $=0$.",
    "points": 0.5,
    "tags": [
      "GTLN-GTNN",
      "trên đoạn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính tiệm cận ngang của đồ thị hàm số $y=\\dfrac{3x-1}{x+2}$.",
    "answer": "3",
    "explanation": "Bậc hai đa thức bằng nhau nên tiệm cận ngang $y=\\dfrac{3}{1}=3$.",
    "points": 0.5,
    "tags": [
      "tiệm cận",
      "hàm phân thức",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính GTNN của hàm số $y=2x^2-8x+5$.",
    "answer": "-3",
    "explanation": "Đỉnh $x=2$: $y=8-16+5=-3$.",
    "points": 0.5,
    "tags": [
      "GTLN-GTNN",
      "parabol",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Với $x>0$, tính GTNN của hàm số $y=\\dfrac{x^2+3}{x}$ (làm tròn đến hàng phần trăm).",
    "answer": "3,46",
    "explanation": "$y=x+\\dfrac{3}{x} \\ge 2\\sqrt{3} \\approx 3{,}46$, dấu bằng tại $x=\\sqrt{3}$.",
    "points": 0.5,
    "tags": [
      "GTLN-GTNN",
      "Cauchy",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính hệ số góc của tiệm cận xiên của đồ thị hàm số $y=\\dfrac{x^2+2x+3}{x+1}$.",
    "answer": "1",
    "explanation": "Chia đa thức: $y=x+1+\\dfrac{2}{x+1}$ nên tiệm cận xiên $y=x+1$ có hệ số góc 1.",
    "points": 0.5,
    "tags": [
      "tiệm cận",
      "tiệm cận xiên",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-gtln-tiemcan-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính GTNN của hàm số $y=x+\\dfrac{4}{x}$ trên đoạn $[1;3]$.",
    "answer": "4",
    "explanation": "$y'=1-\\dfrac{4}{x^2}=0 \\Leftrightarrow x=2$; $y(1)=5$, $y(2)=4$, $y(3)=\\dfrac{13}{3}$. GTNN bằng 4.",
    "points": 0.5,
    "tags": [
      "GTLN-GTNN",
      "trên đoạn",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Phương trình mặt cầu tâm $I(1;2;3)$, bán kính $2$ là",
    "options": [
      {
        "key": "A",
        "text": "$(x+1)^2+(y+2)^2+(z+3)^2=4$"
      },
      {
        "key": "B",
        "text": "$(x-1)^2+(y-2)^2+(z-3)^2=2$"
      },
      {
        "key": "C",
        "text": "$(x-1)^2+(y-2)^2+(z-3)^2=4$"
      },
      {
        "key": "D",
        "text": "$(x-1)^2+(y-2)^2+(z-3)^2=9$"
      }
    ],
    "answer": "C",
    "explanation": "Dạng chính tắc với tâm $I$ và $R^2=4$.",
    "points": 0.25,
    "tags": [
      "mặt cầu",
      "phương trình",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Mặt cầu $x^2+y^2+z^2=9$ có tâm và bán kính",
    "options": [
      {
        "key": "A",
        "text": "$I(0;0;0)$, $R=9$"
      },
      {
        "key": "B",
        "text": "$I(0;0;0)$, $R=3$"
      },
      {
        "key": "C",
        "text": "$I(1;1;1)$, $R=3$"
      },
      {
        "key": "D",
        "text": "$I(0;0;0)$, $R=9$"
      }
    ],
    "answer": "B",
    "explanation": "Tâm $O$, $R=\\sqrt{9}=3$.",
    "points": 0.25,
    "tags": [
      "mặt cầu",
      "phương trình",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Mặt cầu $(x+1)^2+(y-2)^2+z^2=16$ có bán kính",
    "options": [
      {
        "key": "A",
        "text": "$16$"
      },
      {
        "key": "B",
        "text": "$\\sqrt{5}$"
      },
      {
        "key": "C",
        "text": "$8$"
      },
      {
        "key": "D",
        "text": "$4$"
      }
    ],
    "answer": "D",
    "explanation": "$R=\\sqrt{16}=4$.",
    "points": 0.25,
    "tags": [
      "mặt cầu",
      "phương trình",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Mặt cầu $(S)$ có tâm $I(0;0;1)$, bán kính $3$. Mặt phẳng $(\\alpha): z=3$ cắt $(S)$ theo",
    "options": [
      {
        "key": "A",
        "text": "không giao nhau"
      },
      {
        "key": "B",
        "text": "một điểm (tiếp xúc)"
      },
      {
        "key": "C",
        "text": "một đường tròn"
      },
      {
        "key": "D",
        "text": "cả mặt phẳng"
      }
    ],
    "answer": "C",
    "explanation": "$d(I,\\alpha)=2<3=R$ nên cắt theo đường tròn bán kính $\\sqrt{9-4}=\\sqrt{5}$.",
    "points": 0.25,
    "tags": [
      "mặt cầu",
      "vị trí tương đối",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Bán kính mặt cầu ngoại tiếp khối lập phương cạnh 2 (như hình) là",
    "options": [
      {
        "key": "A",
        "text": "$\\sqrt{2}$"
      },
      {
        "key": "B",
        "text": "$\\sqrt{3}$"
      },
      {
        "key": "C",
        "text": "$2$"
      },
      {
        "key": "D",
        "text": "$\\sqrt{6}$"
      }
    ],
    "answer": "B",
    "explanation": "Bán kính bằng nửa đường chéo lập phương $=\\dfrac{2\\sqrt{3}}{2}=\\sqrt{3}$.",
    "points": 0.25,
    "tags": [
      "mặt cầu",
      "ngoại tiếp",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "cube",
      "names": [
        "A",
        "B",
        "C",
        "D",
        "A'",
        "B'",
        "C'",
        "D'"
      ],
      "circumsphere": true
    }
  },
  {
    "id": "thpt-t12-matcau-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một trạm ra-đa đặt tại gốc toạ độ có vùng quét là mặt cầu bán kính 100 km. Máy bay ở vị trí $M(60;0;80)$ (km). Khoảng cách từ máy bay đến trạm là",
    "options": [
      {
        "key": "A",
        "text": "$100$ km"
      },
      {
        "key": "B",
        "text": "$140$ km"
      },
      {
        "key": "C",
        "text": "$60$ km"
      },
      {
        "key": "D",
        "text": "$80$ km"
      }
    ],
    "answer": "A",
    "explanation": "$OM=\\sqrt{3600+6400}=100$ km: máy bay đang trên biên vùng quét.",
    "points": 0.25,
    "tags": [
      "mặt cầu",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đường tròn giao của mặt cầu $x^2+y^2+z^2=25$ và mặt phẳng $z=3$ có bán kính",
    "options": [
      {
        "key": "A",
        "text": "$5$"
      },
      {
        "key": "B",
        "text": "$3$"
      },
      {
        "key": "C",
        "text": "$4$"
      },
      {
        "key": "D",
        "text": "$\\sqrt{34}$"
      }
    ],
    "answer": "C",
    "explanation": "$r=\\sqrt{R^2-d^2}=\\sqrt{25-9}=4$.",
    "points": 0.25,
    "tags": [
      "mặt cầu",
      "giao tuyến",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Mặt cầu đi qua bốn điểm $O(0;0;0)$, $A(2;0;0)$, $B(0;2;0)$, $C(0;0;2)$ (như hình) có bán kính bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\sqrt{3}$"
      },
      {
        "key": "B",
        "text": "$\\sqrt{2}$"
      },
      {
        "key": "C",
        "text": "$2$"
      },
      {
        "key": "D",
        "text": "$3$"
      }
    ],
    "answer": "A",
    "explanation": "Tâm là $I(1;1;1)$, $R=|OI|=\\sqrt{3}$.",
    "points": 0.25,
    "tags": [
      "mặt cầu",
      "ngoại tiếp",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "pyramid3-sa",
      "names": [
        "C",
        "O",
        "A",
        "B"
      ],
      "circumsphere": true
    }
  },
  {
    "id": "thpt-t12-matcau-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hai mặt cầu $(S_1): x^2+y^2+z^2=4$ và $(S_2): (x-3)^2+y^2+z^2=4$ có",
    "options": [
      {
        "key": "A",
        "text": "không giao nhau"
      },
      {
        "key": "B",
        "text": "giao nhau theo một đường tròn"
      },
      {
        "key": "C",
        "text": "tiếp xúc ngoài"
      },
      {
        "key": "D",
        "text": "trùng nhau"
      }
    ],
    "answer": "B",
    "explanation": "Hai tâm cách nhau 3, $R_1+R_2=4>3$ và $|R_1-R_2|=0<3$ nên giao nhau theo đường tròn.",
    "points": 0.25,
    "tags": [
      "mặt cầu",
      "vị trí tương đối",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tâm của mọi mặt cầu đi qua hai điểm $A(1;0;0)$ và $B(-1;0;0)$ nằm trên",
    "options": [
      {
        "key": "A",
        "text": "mặt phẳng $x=0$"
      },
      {
        "key": "B",
        "text": "trục $Ox$"
      },
      {
        "key": "C",
        "text": "mặt phẳng $y=0$"
      },
      {
        "key": "D",
        "text": "mặt phẳng $z=0$"
      }
    ],
    "answer": "A",
    "explanation": "Tâm phải cách đều $A$ và $B$ nên nằm trên mặt phẳng trung trực $x=0$.",
    "points": 0.25,
    "tags": [
      "mặt cầu",
      "quỹ tích",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Coi Trái Đất là hình cầu bán kính 6400 km. Một vệ tinh cách mặt đất 1600 km. Khoảng cách từ vệ tinh đến tâm Trái Đất là",
    "options": [
      {
        "key": "A",
        "text": "$1600$ km"
      },
      {
        "key": "B",
        "text": "$4800$ km"
      },
      {
        "key": "C",
        "text": "$6400$ km"
      },
      {
        "key": "D",
        "text": "$8000$ km"
      }
    ],
    "answer": "D",
    "explanation": "$6400+1600=8000$ km.",
    "points": 0.25,
    "tags": [
      "mặt cầu",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Thể tích phần nằm trong mặt cầu $x^2+y^2+z^2 \\le 9$ và phía trên mặt phẳng $z=2$ (làm tròn đến hàng phần trăm) là",
    "options": [
      {
        "key": "A",
        "text": "$16{,}76$"
      },
      {
        "key": "B",
        "text": "$113{,}10$"
      },
      {
        "key": "C",
        "text": "$8{,}38$"
      },
      {
        "key": "D",
        "text": "$58{,}64$"
      }
    ],
    "answer": "C",
    "explanation": "Chỏm cầu cao $h=3-2=1$: $V=\\pi\\int_2^3(9-z^2)\\,dz=\\pi\\left(9-\\dfrac{19}{3}\\right)=\\dfrac{8\\pi}{3}\\approx 8{,}38$.",
    "points": 0.25,
    "tags": [
      "mặt cầu",
      "thể tích",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho mặt cầu $(S): (x-2)^2+y^2+(z+1)^2=9$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Tâm của $(S)$ là $I(2;0;-1)$"
      },
      {
        "key": "b",
        "text": "Bán kính của $(S)$ là 3"
      },
      {
        "key": "c",
        "text": "$(S)$ đi qua gốc toạ độ $O$"
      },
      {
        "key": "d",
        "text": "$(S)$ cắt mặt phẳng $(Oxy)$ theo đường tròn bán kính $\\sqrt{8}$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a), b) Đúng. c) $|OI|=\\sqrt{5} \\ne 3$ — sai. d) $d(I,Oxy)=1$, bán kính đường tròn $\\sqrt{9-1}=\\sqrt{8}$ — đúng.",
    "points": 1,
    "tags": [
      "mặt cầu",
      "vị trí tương đối",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Mặt cầu $(S)$ đi qua bốn điểm $O(0;0;0)$, $A(2;0;0)$, $B(0;2;0)$, $C(0;0;2)$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Tâm của $(S)$ là $I(1;1;1)$"
      },
      {
        "key": "b",
        "text": "$R^2=3$"
      },
      {
        "key": "c",
        "text": "Phương trình $(S)$ là $x^2+y^2+z^2-2x-2y-2z=0$"
      },
      {
        "key": "d",
        "text": "$(S)$ đi qua điểm $(3;0;0)$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a), b), c) Đúng. d) Thay $(3;0;0)$: $9-6=3 \\ne 0$ — sai.",
    "points": 1,
    "tags": [
      "mặt cầu",
      "phương trình",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một drone xuất phát từ trạm $O(0;0;0)$ và đang ở vị trí $M(300;400;0)$ (m). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Khoảng cách từ drone đến trạm là 500 m"
      },
      {
        "key": "b",
        "text": "Drone nằm trong vùng quét bán kính 400 m của trạm"
      },
      {
        "key": "c",
        "text": "Drone nằm trong vùng quét bán kính 600 m của trạm"
      },
      {
        "key": "d",
        "text": "Drone đang bay ở độ cao 400 m"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) $OM=\\sqrt{90000+160000}=500$ — đúng. b) $500>400$ — sai. c) Đúng. d) Toạ độ $z=0$ nên độ cao 0 m — sai.",
    "points": 1,
    "tags": [
      "mặt cầu",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét vị trí tương đối giữa mặt phẳng $(\\alpha)$ và mặt cầu $(S)$ tâm $I$ bán kính $R$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Nếu $d(I,\\alpha)>R$ thì $(\\alpha)$ không cắt $(S)$"
      },
      {
        "key": "b",
        "text": "Nếu $d(I,\\alpha)=R$ thì $(\\alpha)$ tiếp xúc $(S)$"
      },
      {
        "key": "c",
        "text": "Nếu $d(I,\\alpha)<R$ thì $(\\alpha)$ cắt $(S)$ theo một đường tròn"
      },
      {
        "key": "d",
        "text": "Nếu $d(I,\\alpha)=0$ thì $(\\alpha)$ không cắt $(S)$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a), b), c) Đúng. d) $d=0$ nghĩa là $(\\alpha)$ qua tâm, cắt $(S)$ theo đường tròn lớn — sai.",
    "points": 1,
    "tags": [
      "mặt cầu",
      "vị trí tương đối",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Mặt cầu ngoại tiếp khối hộp chữ nhật $ABCD.A'B'C'D'$ với $AB=2$, $AD=4$, $AA'=4$ (như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Bán kính mặt cầu bằng $3$"
      },
      {
        "key": "b",
        "text": "Tâm mặt cầu là giao điểm của hai đường chéo hộp"
      },
      {
        "key": "c",
        "text": "Thể tích khối hộp bằng 16"
      },
      {
        "key": "d",
        "text": "$R^2=8$"
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) $R=\\dfrac{\\sqrt{4+16+16}}{2}=\\dfrac{6}{2}=3$ — đúng. b) Đúng. c) $V=2 \\cdot 4 \\cdot 4=32 \\ne 16$ — sai. d) $R^2=9 \\ne 8$ — sai.",
    "points": 1,
    "tags": [
      "mặt cầu",
      "ngoại tiếp",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "box",
      "names": [
        "A",
        "B",
        "C",
        "D",
        "A'",
        "B'",
        "C'",
        "D'"
      ],
      "circumsphere": true
    }
  },
  {
    "id": "thpt-t12-matcau-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho mặt cầu $(S): x^2+y^2+z^2-2x-4y+4=0$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Tâm của $(S)$ là $I(1;2;0)$"
      },
      {
        "key": "b",
        "text": "Bán kính của $(S)$ là 1"
      },
      {
        "key": "c",
        "text": "$(S)$ tiếp xúc với mặt phẳng $(Oxy)$"
      },
      {
        "key": "d",
        "text": "$(S)$ tiếp xúc với mặt phẳng $(Oyz)$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) $R^2=1+4-4=1$ — đúng. c) $d(I,Oxy)=2>1$: không giao — sai. d) $d(I,Oyz)=1=R$ — đúng.",
    "points": 1,
    "tags": [
      "mặt cầu",
      "vị trí tương đối",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Mặt cầu đi qua $O(0;0;0)$, $A(3;0;0)$, $B(0;4;0)$, $C(0;0;12)$. Tính bán kính mặt cầu.",
    "answer": "6,5",
    "explanation": "Tâm $I(1{,}5;2;6)$, $R=|OI|=\\sqrt{2{,}25+4+36}=6{,}5$.",
    "points": 0.5,
    "tags": [
      "mặt cầu",
      "ngoại tiếp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính bán kính đường tròn giao của mặt cầu $x^2+y^2+z^2=50$ và mặt phẳng $x+y+z=8$ (làm tròn đến hàng phần trăm).",
    "answer": "5,35",
    "explanation": "$d=\\dfrac{8}{\\sqrt{3}}$; $r=\\sqrt{50-\\dfrac{64}{3}}=\\sqrt{\\dfrac{86}{3}} \\approx 5{,}35$.",
    "points": 0.5,
    "tags": [
      "mặt cầu",
      "giao tuyến",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính thể tích (làm tròn đến hàng phần trăm) của chỏm cầu bán kính 3 cắt bởi mặt phẳng cách tâm 2 đơn vị.",
    "answer": "8,38",
    "explanation": "$h=3-2=1$; $V=\\dfrac{\\pi h^2(3R-h)}{3}=\\dfrac{8\\pi}{3} \\approx 8{,}38$.",
    "points": 0.5,
    "tags": [
      "mặt cầu",
      "thể tích",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính độ dài vectơ $\\overrightarrow{OM}$ với $M(2;-1;2)$.",
    "answer": "3",
    "explanation": "$|OM|=\\sqrt{4+1+4}=3$.",
    "points": 0.5,
    "tags": [
      "Oxyz",
      "độ dài vectơ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trái Đất có bán kính 6400 km. Vệ tinh cách mặt đất 600 km. Tính khoảng cách từ vệ tinh đến tâm Trái Đất (km).",
    "answer": "7000",
    "explanation": "$6400+600=7000$ km.",
    "points": 0.5,
    "tags": [
      "mặt cầu",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hai mặt cầu có bán kính lần lượt 5 và 3, hai tâm cách nhau 4. Tính bán kính đường tròn giao của hai mặt cầu.",
    "answer": "3",
    "explanation": "Khoảng cách từ tâm cầu lớn đến mặt phẳng giao: $x=\\dfrac{R_1^2-R_2^2+d^2}{2d}=\\dfrac{25-9+16}{8}=4$; bán kính đường tròn giao $r=\\sqrt{25-16}=3$.",
    "points": 0.5,
    "tags": [
      "mặt cầu",
      "giao tuyến",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-matcau-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính bán kính mặt cầu ngoại tiếp tứ diện đều cạnh 6 (làm tròn đến hàng phần trăm).",
    "answer": "3,67",
    "explanation": "$R=\\dfrac{6\\sqrt{6}}{4}=\\dfrac{3\\sqrt{6}}{2} \\approx 3{,}67$.",
    "points": 0.5,
    "tags": [
      "mặt cầu",
      "ngoại tiếp",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một nguyên hàm của $f(x)=2x$ là",
    "options": [
      {
        "key": "A",
        "text": "$x^2+C$"
      },
      {
        "key": "B",
        "text": "$2+C$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{x^2}{2}+C$"
      },
      {
        "key": "D",
        "text": "$2x^2+C$"
      }
    ],
    "answer": "A",
    "explanation": "$(x^2+C)'=2x$.",
    "points": 0.25,
    "tags": [
      "nguyên hàm",
      "cơ bản",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "$\\int x^2\\,dx$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$2x+C$"
      },
      {
        "key": "B",
        "text": "$x^3+C$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{x^3}{3}+C$"
      },
      {
        "key": "D",
        "text": "$3x^2+C$"
      }
    ],
    "answer": "C",
    "explanation": "$\\int x^n dx=\\dfrac{x^{n+1}}{n+1}+C$ với $n=2$.",
    "points": 0.25,
    "tags": [
      "nguyên hàm",
      "cơ bản",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "$\\int(3x^2-2x)\\,dx$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$x^3-x+C$"
      },
      {
        "key": "B",
        "text": "$x^3-x^2+C$"
      },
      {
        "key": "C",
        "text": "$6x-2+C$"
      },
      {
        "key": "D",
        "text": "$x^3+x^2+C$"
      }
    ],
    "answer": "B",
    "explanation": "$\\int 3x^2 dx=x^3$, $\\int -2x dx=-x^2$.",
    "points": 0.25,
    "tags": [
      "nguyên hàm",
      "đa thức",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $\\int\\limits_0^1 2x\\,dx$ là",
    "options": [
      {
        "key": "A",
        "text": "$2$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{1}{4}$"
      },
      {
        "key": "D",
        "text": "$1$"
      }
    ],
    "answer": "D",
    "explanation": "$\\left[x^2\\right]_0^1=1$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "tính tích phân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $\\int\\limits_1^e \\dfrac{1}{x}\\,dx$ là",
    "options": [
      {
        "key": "A",
        "text": "$e$"
      },
      {
        "key": "B",
        "text": "$1$"
      },
      {
        "key": "C",
        "text": "$e-1$"
      },
      {
        "key": "D",
        "text": "$0$"
      }
    ],
    "answer": "B",
    "explanation": "$\\left[\\ln x\\right]_1^e=\\ln e-\\ln 1=1$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "logarit",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $\\int\\limits_0^{\\pi}\\sin x\\,dx$ là",
    "options": [
      {
        "key": "A",
        "text": "$0$"
      },
      {
        "key": "B",
        "text": "$1$"
      },
      {
        "key": "C",
        "text": "$2$"
      },
      {
        "key": "D",
        "text": "$\\pi$"
      }
    ],
    "answer": "C",
    "explanation": "$\\left[-\\cos x\\right]_0^{\\pi}=-(-1)+1=2$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "lượng giác",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $F(x)=x^3+C$ là nguyên hàm của $f(x)=3x^2$ thỏa mãn $F(1)=5$. Giá trị $F(2)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$12$"
      },
      {
        "key": "B",
        "text": "$8$"
      },
      {
        "key": "C",
        "text": "$10$"
      },
      {
        "key": "D",
        "text": "$16$"
      }
    ],
    "answer": "A",
    "explanation": "$1+C=5 \\Rightarrow C=4$; $F(2)=8+4=12$.",
    "points": 0.25,
    "tags": [
      "nguyên hàm",
      "bài toán Cauchy",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $\\int\\limits_0^1 xe^x\\,dx$ là",
    "options": [
      {
        "key": "A",
        "text": "$e-1$"
      },
      {
        "key": "B",
        "text": "$1$"
      },
      {
        "key": "C",
        "text": "$e$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{e}{2}$"
      }
    ],
    "answer": "B",
    "explanation": "Từng phần: $\\left[xe^x-e^x\\right]_0^1=(e-e)-(0-1)=1$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "từng phần",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "$\\int \\cos x\\,dx$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$-\\sin x+C$"
      },
      {
        "key": "B",
        "text": "$-\\cos x+C$"
      },
      {
        "key": "C",
        "text": "$\\cos x+C$"
      },
      {
        "key": "D",
        "text": "$\\sin x+C$"
      }
    ],
    "answer": "D",
    "explanation": "$(\\sin x)'=\\cos x$.",
    "points": 0.25,
    "tags": [
      "nguyên hàm",
      "lượng giác",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $\\int\\limits_1^4 \\dfrac{1}{\\sqrt{x}}\\,dx$ là",
    "options": [
      {
        "key": "A",
        "text": "$1$"
      },
      {
        "key": "B",
        "text": "$4$"
      },
      {
        "key": "C",
        "text": "$2$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{2}$"
      }
    ],
    "answer": "C",
    "explanation": "$\\left[2\\sqrt{x}\\right]_1^4=4-2=2$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "căn thức",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Diện tích hình phẳng giới hạn bởi đồ thị $y=x^2$ (như hình), trục $Ox$ và hai đường thẳng $x=0$, $x=3$ là",
    "options": [
      {
        "key": "A",
        "text": "$9$"
      },
      {
        "key": "B",
        "text": "$3$"
      },
      {
        "key": "C",
        "text": "$27$"
      },
      {
        "key": "D",
        "text": "$6$"
      }
    ],
    "answer": "A",
    "explanation": "$S=\\int\\limits_0^3 x^2 dx=\\dfrac{27}{3}=9$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "diện tích",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^2"
      ],
      "xMin": -1,
      "xMax": 4,
      "yMin": -1,
      "yMax": 10,
      "labels": true
    }
  },
  {
    "id": "thpt-t12-nguyenham-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $\\int\\limits_0^2 |x-1|\\,dx$ là",
    "options": [
      {
        "key": "A",
        "text": "$2$"
      },
      {
        "key": "B",
        "text": "$0$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "D",
        "text": "$1$"
      }
    ],
    "answer": "D",
    "explanation": "$\\int\\limits_0^1(1-x)dx+\\int\\limits_1^2(x-1)dx=\\dfrac{1}{2}+\\dfrac{1}{2}=1$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "giá trị tuyệt đối",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về nguyên hàm và tích phân:",
    "options": [
      {
        "key": "a",
        "text": "$\\int x\\,dx=\\dfrac{x^2}{2}+C$"
      },
      {
        "key": "b",
        "text": "$\\int\\limits_0^1 x^2\\,dx=\\dfrac{1}{3}$"
      },
      {
        "key": "c",
        "text": "$\\int e^x dx=e^x+C$"
      },
      {
        "key": "d",
        "text": "$\\int \\dfrac{1}{x}dx=x+C$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a), b), c) Đúng. d) Đúng là $\\ln|x|+C$ — sai.",
    "points": 1,
    "tags": [
      "nguyên hàm",
      "cơ bản",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho $F(x)=x^3$ là một nguyên hàm của hàm số $f(x)$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$f(x)=3x^2$"
      },
      {
        "key": "b",
        "text": "Mọi nguyên hàm của $f$ có dạng $x^3+C$"
      },
      {
        "key": "c",
        "text": "$F(2)=6$"
      },
      {
        "key": "d",
        "text": "$\\int\\limits_0^2 f(x)\\,dx=9$"
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng. b) Đúng. c) $F(2)=8 \\ne 6$ — sai. d) $\\int\\limits_0^2 3x^2 dx=8 \\ne 9$ — sai.",
    "points": 1,
    "tags": [
      "nguyên hàm",
      "tích phân",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét tích phân $I=\\int\\limits_1^2(2x+1)\\,dx$ (hình vẽ). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Một nguyên hàm của $2x+1$ là $x^2+x$"
      },
      {
        "key": "b",
        "text": "$I=4$"
      },
      {
        "key": "c",
        "text": "$I=3$"
      },
      {
        "key": "d",
        "text": "$I$ biểu diễn diện tích hình thang giới hạn bởi $y=2x+1$, trục $Ox$ và $x=1$, $x=2$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) $(4+2)-(1+1)=4$ — đúng. c) Sai. d) $2x+1>0$ trên $[1;2]$ nên $I$ đúng bằng diện tích hình thang — đúng.",
    "points": 1,
    "tags": [
      "tích phân",
      "diện tích",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "2x+1"
      ],
      "xMin": 0,
      "xMax": 3,
      "yMin": -1,
      "yMax": 8,
      "labels": true
    }
  },
  {
    "id": "thpt-t12-nguyenham-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về tính chất của tích phân:",
    "options": [
      {
        "key": "a",
        "text": "$\\int(f+g)\\,dx=\\int f\\,dx+\\int g\\,dx$"
      },
      {
        "key": "b",
        "text": "$\\int kf\\,dx=k^2\\int f\\,dx$"
      },
      {
        "key": "c",
        "text": "$\\int\\limits_a^b f(x)\\,dx=-\\int\\limits_b^a f(x)\\,dx$"
      },
      {
        "key": "d",
        "text": "$\\int\\limits_0^2 x\\,dx=2$"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đúng. b) Sai, đúng là $k\\int f\\,dx$. c) Đúng. d) $\\left[\\dfrac{x^2}{2}\\right]_0^2=2$ — đúng.",
    "points": 1,
    "tags": [
      "tích phân",
      "tính chất",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét $J=\\int\\limits_0^{\\frac{\\pi}{2}}\\cos x\\,dx$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Một nguyên hàm của $\\cos x$ là $\\sin x$"
      },
      {
        "key": "b",
        "text": "$J=2$"
      },
      {
        "key": "c",
        "text": "$J=\\sin \\dfrac{\\pi}{2}-\\sin 0=1$"
      },
      {
        "key": "d",
        "text": "$J$ nhỏ hơn 0"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) $J=1 \\ne 2$ — sai. c) Đúng. d) $J=1>0$ — sai.",
    "points": 1,
    "tags": [
      "tích phân",
      "lượng giác",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét tích phân $K=\\int\\limits_0^1 x(1+x^2)^3\\,dx$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Đặt $t=1+x^2$ thì $dt=2x\\,dx$"
      },
      {
        "key": "b",
        "text": "Khi đó $K=\\dfrac{1}{2}\\int\\limits_1^2 t^3\\,dt$"
      },
      {
        "key": "c",
        "text": "$K=\\dfrac{15}{8}$"
      },
      {
        "key": "d",
        "text": "$K=3$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) Đúng. c) $\\left[\\dfrac{t^4}{8}\\right]_1^2=\\dfrac{16-1}{8}=\\dfrac{15}{8}$ — đúng. d) $\\dfrac{15}{8} \\ne 3$ — sai.",
    "points": 1,
    "tags": [
      "tích phân",
      "đổi biến",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\int\\limits_0^2 3x^2\\,dx$.",
    "answer": "8",
    "explanation": "$\\left[x^3\\right]_0^2=8$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "tính tích phân",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\int\\limits_1^e \\ln x\\,dx$.",
    "answer": "1",
    "explanation": "Từng phần: $\\left[x\\ln x-x\\right]_1^e=e-e-(-1)=1$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "từng phần",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính diện tích hình phẳng giới hạn bởi $y=\\sqrt{x}$, trục $Ox$ và $x=4$ (làm tròn đến hàng phần trăm).",
    "answer": "5,33",
    "explanation": "$S=\\int\\limits_0^4 \\sqrt{x}\\,dx=\\left[\\dfrac{2}{3}x^{\\frac{3}{2}}\\right]_0^4=\\dfrac{16}{3} \\approx 5{,}33$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "diện tích",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\int\\limits_1^3(2x-1)\\,dx$.",
    "answer": "6",
    "explanation": "$\\left[x^2-x\\right]_1^3=6-0=6$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "tính tích phân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $F(x)=2x^3+C$ là nguyên hàm của $f(x)=6x^2$ thỏa mãn $F(1)=4$. Tính $F(2)$.",
    "answer": "18",
    "explanation": "$2+C=4 \\Rightarrow C=2$; $F(2)=16+2=18$.",
    "points": 0.5,
    "tags": [
      "nguyên hàm",
      "bài toán Cauchy",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\int\\limits_0^1(2x+1)^2\\,dx$ (làm tròn đến hàng phần trăm).",
    "answer": "4,33",
    "explanation": "$\\left[\\dfrac{(2x+1)^3}{6}\\right]_0^1=\\dfrac{27-1}{6}=\\dfrac{13}{3} \\approx 4{,}33$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "đổi biến",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-nguyenham-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\int\\limits_0^1 x\\sqrt{x+1}\\,dx$ (làm tròn đến hàng phần trăm).",
    "answer": "0,64",
    "explanation": "Đặt $t=x+1$: $\\int\\limits_1^2(t-1)\\sqrt{t}\\,dt=\\left[\\dfrac{2t^{\\frac{5}{2}}}{5}-\\dfrac{2t^{\\frac{3}{2}}}{3}\\right]_1^2 \\approx 0{,}64$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "đổi biến",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $A(1;2;3)$, $B(4;6;3)$. Toạ độ vectơ $\\overrightarrow{AB}$ là",
    "options": [
      {
        "key": "A",
        "text": "$(3;4;6)$"
      },
      {
        "key": "B",
        "text": "$(3;4;0)$"
      },
      {
        "key": "C",
        "text": "$(-3;-4;0)$"
      },
      {
        "key": "D",
        "text": "$(5;8;6)$"
      }
    ],
    "answer": "B",
    "explanation": "$\\overrightarrow{AB}=(4-1;6-2;3-3)=(3;4;0)$.",
    "points": 0.25,
    "tags": [
      "Oxyz",
      "vectơ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Độ dài của vectơ $\\vec{u}=(2;-2;1)$ là",
    "options": [
      {
        "key": "A",
        "text": "$9$"
      },
      {
        "key": "B",
        "text": "$5$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$\\sqrt{5}$"
      }
    ],
    "answer": "C",
    "explanation": "$|\\vec{u}|=\\sqrt{4+4+1}=3$.",
    "points": 0.25,
    "tags": [
      "Oxyz",
      "độ dài vectơ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $A(1;0;2)$, $B(3;2;4)$. Độ dài đoạn $AB$ là",
    "options": [
      {
        "key": "A",
        "text": "$2\\sqrt{3}$"
      },
      {
        "key": "B",
        "text": "$2\\sqrt{2}$"
      },
      {
        "key": "C",
        "text": "$6$"
      },
      {
        "key": "D",
        "text": "$2\\sqrt{6}$"
      }
    ],
    "answer": "A",
    "explanation": "$AB=\\sqrt{2^2+2^2+2^2}=\\sqrt{12}=2\\sqrt{3}$.",
    "points": 0.25,
    "tags": [
      "Oxyz",
      "khoảng cách",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tìm $m$ để $\\vec{u}=(1;2;m)$ vuông góc với $\\vec{v}=(2;-1;1)$.",
    "options": [
      {
        "key": "A",
        "text": "$m=2$"
      },
      {
        "key": "B",
        "text": "$m=-2$"
      },
      {
        "key": "C",
        "text": "$m=1$"
      },
      {
        "key": "D",
        "text": "$m=0$"
      }
    ],
    "answer": "D",
    "explanation": "$\\vec{u} \\cdot \\vec{v}=2-2+m=0 \\Leftrightarrow m=0$.",
    "points": 0.25,
    "tags": [
      "Oxyz",
      "vuông góc",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Phương trình mặt phẳng đi qua $A(1;0;0)$ và có vectơ pháp tuyến $\\vec{n}=(2;1;-1)$ là",
    "options": [
      {
        "key": "A",
        "text": "$2x+y-z=0$"
      },
      {
        "key": "B",
        "text": "$2x+y-z+2=0$"
      },
      {
        "key": "C",
        "text": "$2x+y-z-2=0$"
      },
      {
        "key": "D",
        "text": "$x+y-z-1=0$"
      }
    ],
    "answer": "C",
    "explanation": "$2(x-1)+y-z=0 \\Leftrightarrow 2x+y-z-2=0$.",
    "points": 0.25,
    "tags": [
      "Oxyz",
      "mặt phẳng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Khoảng cách từ điểm $A(1;2;1)$ đến mặt phẳng $(P): 2x-y+2z-6=0$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{4}{3}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{2}{3}$"
      },
      {
        "key": "C",
        "text": "$2$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{3}$"
      }
    ],
    "answer": "A",
    "explanation": "$d=\\dfrac{|2-2+2-6|}{\\sqrt{4+1+4}}=\\dfrac{4}{3}$.",
    "points": 0.25,
    "tags": [
      "Oxyz",
      "khoảng cách",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đường thẳng đi qua $A(1;1;0)$ và có vectơ chỉ phương $\\vec{u}=(1;1;1)$ có phương trình tham số",
    "options": [
      {
        "key": "A",
        "text": "$\\begin{cases}x=1-t \\\\ y=1-t \\\\ z=t\\end{cases}$"
      },
      {
        "key": "B",
        "text": "$\\begin{cases}x=1+t \\\\ y=1+t \\\\ z=t\\end{cases}$"
      },
      {
        "key": "C",
        "text": "$\\begin{cases}x=t \\\\ y=t \\\\ z=t\\end{cases}$"
      },
      {
        "key": "D",
        "text": "$\\begin{cases}x=1+t \\\\ y=1-t \\\\ z=t\\end{cases}$"
      }
    ],
    "answer": "B",
    "explanation": "Điểm đầu $A(1;1;0)$, vectơ chỉ phương $(1;1;1)$.",
    "points": 0.25,
    "tags": [
      "Oxyz",
      "đường thẳng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Góc giữa hai mặt phẳng $(P): x+y-1=0$ và $(Q): z=0$ là",
    "options": [
      {
        "key": "A",
        "text": "$30^\\circ$"
      },
      {
        "key": "B",
        "text": "$45^\\circ$"
      },
      {
        "key": "C",
        "text": "$60^\\circ$"
      },
      {
        "key": "D",
        "text": "$90^\\circ$"
      }
    ],
    "answer": "D",
    "explanation": "$\\vec{n_P} \\cdot \\vec{n_Q}=(1;1;0) \\cdot (0;0;1)=0$ nên hai mặt phẳng vuông góc.",
    "points": 0.25,
    "tags": [
      "Oxyz",
      "góc",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cosin của góc giữa hai vectơ $\\vec{u}=(1;1;0)$ và $\\vec{v}=(0;1;1)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "B",
        "text": "$0$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{\\sqrt{2}}{2}$"
      },
      {
        "key": "D",
        "text": "$1$"
      }
    ],
    "answer": "A",
    "explanation": "$\\cos=\\dfrac{1}{\\sqrt{2} \\cdot \\sqrt{2}}=\\dfrac{1}{2}$ (góc $60^\\circ$).",
    "points": 0.25,
    "tags": [
      "Oxyz",
      "góc",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Phương trình mặt phẳng $(Oxy)$ là",
    "options": [
      {
        "key": "A",
        "text": "$z=0$"
      },
      {
        "key": "B",
        "text": "$x=0$"
      },
      {
        "key": "C",
        "text": "$y=0$"
      },
      {
        "key": "D",
        "text": "$x+y=0$"
      }
    ],
    "answer": "A",
    "explanation": "Mặt phẳng chứa $Ox$ và $Oy$ có phương trình $z=0$.",
    "points": 0.25,
    "tags": [
      "Oxyz",
      "mặt phẳng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tích vô hướng $\\vec{u} \\cdot \\vec{v}$ với $\\vec{u}=(1;2;0)$, $\\vec{v}=(2;-1;3)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$0$"
      },
      {
        "key": "B",
        "text": "$1$"
      },
      {
        "key": "C",
        "text": "$4$"
      },
      {
        "key": "D",
        "text": "$-1$"
      }
    ],
    "answer": "A",
    "explanation": "$2-2+0=0$.",
    "points": 0.25,
    "tags": [
      "Oxyz",
      "tích có hướng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Khoảng cách từ gốc toạ độ $O$ đến mặt phẳng $(P): x+2y-2z+4=0$ là",
    "options": [
      {
        "key": "A",
        "text": "$4$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{4}{3}$"
      },
      {
        "key": "C",
        "text": "$1$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{2}{3}$"
      }
    ],
    "answer": "B",
    "explanation": "$d=\\dfrac{|4|}{\\sqrt{1+4+4}}=\\dfrac{4}{3}$.",
    "points": 0.25,
    "tags": [
      "Oxyz",
      "khoảng cách",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho $A(1;2;0)$, $B(3;4;2)$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$\\overrightarrow{AB}=(2;2;2)$"
      },
      {
        "key": "b",
        "text": "$|\\overrightarrow{AB}|=2\\sqrt{3}$"
      },
      {
        "key": "c",
        "text": "Trung điểm của $AB$ là $M(2;3;1)$"
      },
      {
        "key": "d",
        "text": "$|\\overrightarrow{AB}|=12$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) $\\sqrt{12}=2\\sqrt{3}$ — đúng. c) Đúng. d) Độ dài là $\\sqrt{12}$ — sai.",
    "points": 1,
    "tags": [
      "Oxyz",
      "vectơ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho mặt phẳng $(P): 2x-y+2z-4=0$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Một vectơ pháp tuyến của $(P)$ là $\\vec{n}=(2;-1;2)$"
      },
      {
        "key": "b",
        "text": "$(P)$ cắt trục $Oz$ tại điểm $(0;0;4)$"
      },
      {
        "key": "c",
        "text": "$(P)$ đi qua gốc toạ độ $O$"
      },
      {
        "key": "d",
        "text": "Khoảng cách từ $O$ đến $(P)$ bằng $\\dfrac{4}{3}$"
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng. b) Cắt $Oz$ tại $(0;0;2)$ — sai. c) $-4 \\ne 0$ — sai. d) $\\dfrac{4}{3}$ — đúng.",
    "points": 1,
    "tags": [
      "Oxyz",
      "mặt phẳng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho đường thẳng $d: \\begin{cases}x=1+t \\\\ y=2-t \\\\ z=3+2t\\end{cases}$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$d$ đi qua điểm $A(1;2;3)$"
      },
      {
        "key": "b",
        "text": "Một vectơ chỉ phương của $d$ là $(1;-1;2)$"
      },
      {
        "key": "c",
        "text": "$d$ đi qua điểm $(2;1;4)$"
      },
      {
        "key": "d",
        "text": "$d$ song song với mặt phẳng $(Oxy)$"
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng ($t=0$). b) Đúng. c) Với $t=1$: điểm $(2;1;5) \\ne (2;1;4)$ — sai. d) Vectơ chỉ phương có thành phần $z \\ne 0$ nên không song song $(Oxy)$ — sai.",
    "points": 1,
    "tags": [
      "Oxyz",
      "đường thẳng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về các khái niệm vuông góc trong không gian:",
    "options": [
      {
        "key": "a",
        "text": "Nếu $\\vec{n}$ là vectơ pháp tuyến của $(P)$ thì $\\vec{n}$ vuông góc với $(P)$"
      },
      {
        "key": "b",
        "text": "$\\vec{u}$ vuông góc $\\vec{v}$ khi và chỉ khi $\\vec{u} \\cdot \\vec{v}=0$"
      },
      {
        "key": "c",
        "text": "Hai mặt phẳng vuông góc khi tích vô hướng hai pháp tuyến bằng 0"
      },
      {
        "key": "d",
        "text": "$|\\vec{u}-\\vec{v}|=|\\vec{u}|-|\\vec{v}|$ với mọi $\\vec{u}, \\vec{v}$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a), b), c) Đúng. d) Sai (bất đẳng thức tam giác cho phép đảo ngược chiều).",
    "points": 1,
    "tags": [
      "Oxyz",
      "vuông góc",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Trong không gian với hệ toạ độ, cho $A(0;0;0)$, $B(3;0;0)$, $C(0;4;0)$, $S(0;0;3)$ (như hình minh hoạ chóp $S.ABC$). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Một vectơ pháp tuyến của $(ABC)$ là $(0;0;1)$"
      },
      {
        "key": "b",
        "text": "$SB=9$"
      },
      {
        "key": "c",
        "text": "Khoảng cách từ $S$ đến $BC$ bằng $AB=3$"
      },
      {
        "key": "d",
        "text": "Thể tích khối chóp $S.ABC$ bằng 12"
      }
    ],
    "answer": "ĐSSS",
    "explanation": "a) $(ABC)$ là mặt $(Oxy)$ — đúng. b) $SB=\\sqrt{9+9}=3\\sqrt{2}$ — sai. c) Hạ $AH \\perp BC$: $AH=\\dfrac{12}{5}$, $d(S,BC)=SH=\\sqrt{9+5{,}76}\\approx 3{,}84$ — sai. d) $V=\\dfrac{1}{3}\\cdot 6\\cdot 3=6$ — sai.",
    "points": 1,
    "tags": [
      "Oxyz",
      "hình chóp",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "pyramid3-sa",
      "names": [
        "S",
        "A",
        "B",
        "C"
      ]
    }
  },
  {
    "id": "thpt-t12-oxyz-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho vectơ $\\vec{u}=(2;2;1)$. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$\\cos(\\vec{u},\\overrightarrow{Oz})=\\dfrac{1}{3}$"
      },
      {
        "key": "b",
        "text": "Góc giữa $\\vec{u}$ và trục $Oz$ bằng $19{,}5^\\circ$"
      },
      {
        "key": "c",
        "text": "Góc giữa $\\vec{u}$ và $(Oxy)$ khoảng $19{,}5^\\circ$"
      },
      {
        "key": "d",
        "text": "Góc giữa $\\vec{u}$ và $(Oxy)$ bằng $70{,}5^\\circ$"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) $\\dfrac{1}{3}$ — đúng. b) Góc với $Oz$ $=\\arccos \\dfrac{1}{3} \\approx 70{,}5^\\circ$ — sai. c) Góc với $(Oxy)$ $=\\arcsin \\dfrac{1}{3} \\approx 19{,}5^\\circ$ — đúng. d) Sai.",
    "points": 1,
    "tags": [
      "Oxyz",
      "góc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $A(1;2;3)$, $B(4;6;3)$. Tính độ dài đoạn $AB$.",
    "answer": "5",
    "explanation": "$AB=\\sqrt{3^2+4^2}=5$.",
    "points": 0.5,
    "tags": [
      "Oxyz",
      "khoảng cách",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính khoảng cách từ điểm $A(1;2;1)$ đến mặt phẳng $(P): x+2y+2z-4=0$.",
    "answer": "1",
    "explanation": "$d=\\dfrac{|1+4+2-4|}{\\sqrt{1+4+4}}=\\dfrac{3}{3}=1$.",
    "points": 0.5,
    "tags": [
      "Oxyz",
      "khoảng cách",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tìm $m$ để $\\vec{u}=(m;1;2)$ vuông góc với $\\vec{v}=(2;-2;m)$.",
    "answer": "0,5",
    "explanation": "$2m-2+2m=0 \\Leftrightarrow m=\\dfrac{1}{2}=0{,}5$.",
    "points": 0.5,
    "tags": [
      "Oxyz",
      "vuông góc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $A(0;1;1)$, $B(2;3;1)$. Gọi $M$ là trung điểm $AB$. Tính tung độ của $M$.",
    "answer": "2",
    "explanation": "Tung độ $M=\\dfrac{1+3}{2}=2$.",
    "points": 0.5,
    "tags": [
      "Oxyz",
      "trung điểm",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính cosin của góc giữa $\\vec{u}=(1;-1;2)$ và $\\vec{v}=(2;1;0)$ (làm tròn đến hàng phần trăm).",
    "answer": "0,18",
    "explanation": "$\\cos=\\dfrac{2-1}{\\sqrt{6} \\cdot \\sqrt{5}}=\\dfrac{1}{\\sqrt{30}} \\approx 0{,}18$.",
    "points": 0.5,
    "tags": [
      "Oxyz",
      "góc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính khoảng cách từ điểm $S(0;0;3)$ đến mặt phẳng $(ABC)$ với $A(1;0;0)$, $B(0;2;0)$, $C(0;0;0)$.",
    "answer": "3",
    "explanation": "$(ABC)$ là mặt phẳng $z=0$ nên khoảng cách bằng tung độ $z$ của $S$, bằng 3.",
    "points": 0.5,
    "tags": [
      "Oxyz",
      "khoảng cách",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-oxyz-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính thể tích khối tứ diện $OABC$ với $A(2;0;0)$, $B(0;3;0)$, $C(0;0;4)$.",
    "answer": "4",
    "explanation": "Ba cạnh $OA$, $OB$, $OC$ đôi một vuông góc: $V=\\dfrac{1}{6} \\cdot 2 \\cdot 3 \\cdot 4=4$.",
    "points": 0.5,
    "tags": [
      "Oxyz",
      "thể tích",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một cửa hàng có doanh thu $R(q)=50q$ (nghìn đồng) khi bán $q$ sản phẩm. Giá bán mỗi sản phẩm là",
    "options": [
      {
        "key": "A",
        "text": "$100$ nghìn đồng"
      },
      {
        "key": "B",
        "text": "$50$ nghìn đồng"
      },
      {
        "key": "C",
        "text": "$25$ nghìn đồng"
      },
      {
        "key": "D",
        "text": "$5$ nghìn đồng"
      }
    ],
    "answer": "B",
    "explanation": "Doanh thu tuyến tính $R=50q$ cho thấy mỗi sản phẩm được bán với giá 50 nghìn đồng.",
    "points": 0.25,
    "tags": [
      "tối ưu",
      "kinh tế",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Chi phí sản xuất $x$ sản phẩm là $C(x)=2x+100$ (nghìn đồng). Chi phí cố định (không phụ thuộc số sản phẩm) là",
    "options": [
      {
        "key": "A",
        "text": "$2$ nghìn đồng"
      },
      {
        "key": "B",
        "text": "$102$ nghìn đồng"
      },
      {
        "key": "C",
        "text": "$100$ nghìn đồng"
      },
      {
        "key": "D",
        "text": "$50$ nghìn đồng"
      }
    ],
    "answer": "C",
    "explanation": "Khi $x=0$ thì $C=100$: chi phí cố định là 100 nghìn đồng.",
    "points": 0.25,
    "tags": [
      "tối ưu",
      "kinh tế",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Doanh thu $R=40q$, chi phí $C=2q^2+10q+20$ (triệu đồng). Lợi nhuận lớn nhất đạt được khi sản xuất $q$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$5$ sản phẩm"
      },
      {
        "key": "B",
        "text": "$10$ sản phẩm"
      },
      {
        "key": "C",
        "text": "$15$ sản phẩm"
      },
      {
        "key": "D",
        "text": "$7{,}5$ sản phẩm"
      }
    ],
    "answer": "D",
    "explanation": "Lợi nhuận $P=40q-(2q^2+10q+20)=-2q^2+30q-20$, đỉnh $q=7{,}5$.",
    "points": 0.25,
    "tags": [
      "tối ưu",
      "kinh tế",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Từ một tấm bìa vuông cạnh 20 cm, cắt ở bốn góc các hình vuông cạnh $x$ (cm) rồi gập lại thành hộp không nắp (như hình). Để thể tích hộp lớn nhất thì $x$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{10}{3}$ cm"
      },
      {
        "key": "B",
        "text": "$5$ cm"
      },
      {
        "key": "C",
        "text": "$4$ cm"
      },
      {
        "key": "D",
        "text": "$\\dfrac{20}{3}$ cm"
      }
    ],
    "answer": "A",
    "explanation": "$V=x(20-2x)^2$; $V'=400-800x+12x^2=0 \\Leftrightarrow x=\\dfrac{10}{3}$ (nhận) hoặc $x=10$ (loại).",
    "points": 0.25,
    "tags": [
      "tối ưu",
      "thể tích",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "A(0; 0) B(20; 0) C(20; 20) D(0; 20)\nAB, BC, CD, DA\nkích thước AB \"20 cm\"\nnhãn BC \"?\""
    }
  },
  {
    "id": "thpt-t12-toiuu-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một bồn nước hình trụ có thể tích $32\\pi$ m³, chiều cao 2 m (cắt dọc như hình). Bán kính đáy của bồn là",
    "options": [
      {
        "key": "A",
        "text": "$2$ m"
      },
      {
        "key": "B",
        "text": "$8$ m"
      },
      {
        "key": "C",
        "text": "$4$ m"
      },
      {
        "key": "D",
        "text": "$16$ m"
      }
    ],
    "answer": "C",
    "explanation": "$\\pi r^2 \\cdot 2=32\\pi \\Rightarrow r^2=16 \\Rightarrow r=4$ m.",
    "points": 0.25,
    "tags": [
      "tối ưu",
      "hình học",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "A(0; 0) B(8; 0) C(8; 2) D(0; 2)\nAB, BC, CD, DA\nkích thước AB \"8 m\"\nkích thước BC \"2 m\""
    }
  },
  {
    "id": "thpt-t12-toiuu-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một xe tải đi quãng đường 200 km với tốc độ không đổi $v$ (km/h). Chi phí xăng mỗi giờ là $0{,}01v^2+4$ (nghìn đồng). Tốc độ $v$ để tổng chi phí xăng nhỏ nhất là",
    "options": [
      {
        "key": "A",
        "text": "$10$ km/h"
      },
      {
        "key": "B",
        "text": "$40$ km/h"
      },
      {
        "key": "C",
        "text": "$20$ km/h"
      },
      {
        "key": "D",
        "text": "$50$ km/h"
      }
    ],
    "answer": "C",
    "explanation": "Tổng chi phí $F(v)=\\left(0{,}01v^2+4\\right)\\dfrac{200}{v}=2v+\\dfrac{800}{v} \\ge 2\\sqrt{1600}=80$, dấu bằng khi $v=20$.",
    "points": 0.25,
    "tags": [
      "tối ưu",
      "quãng đường",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Sản lượng thu hoạch (tấn) sau $t$ tháng nuôi là $P(t)=5t-\\dfrac{t^2}{4}$. Sản lượng lớn nhất đạt sau",
    "options": [
      {
        "key": "A",
        "text": "$5$ tháng"
      },
      {
        "key": "B",
        "text": "$10$ tháng"
      },
      {
        "key": "C",
        "text": "$20$ tháng"
      },
      {
        "key": "D",
        "text": "$8$ tháng"
      }
    ],
    "answer": "B",
    "explanation": "$P'(t)=5-\\dfrac{t}{2}=0 \\Leftrightarrow t=10$.",
    "points": 0.25,
    "tags": [
      "tối ưu",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cầu về sản phẩm theo giá $p$ (nghìn đồng) là $q=200-2p$. Doanh thu lớn nhất (nghìn đồng) là",
    "options": [
      {
        "key": "A",
        "text": "$2500$"
      },
      {
        "key": "B",
        "text": "$10\\,000$"
      },
      {
        "key": "C",
        "text": "$5000$"
      },
      {
        "key": "D",
        "text": "$4000$"
      }
    ],
    "answer": "C",
    "explanation": "$R=p(200-2p)=-2p^2+200p$ đạt max tại $p=50$: $R=5000$ nghìn đồng.",
    "points": 0.25,
    "tags": [
      "tối ưu",
      "kinh tế",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Chi phí sản xuất $x$ tấn sản phẩm là $C(x)=x^3-6x^2+15x$ (triệu đồng), giá bán 15 triệu/tấn. Lợi nhuận lớn nhất khi sản xuất",
    "options": [
      {
        "key": "A",
        "text": "$2$ tấn"
      },
      {
        "key": "B",
        "text": "$4$ tấn"
      },
      {
        "key": "C",
        "text": "$6$ tấn"
      },
      {
        "key": "D",
        "text": "$3$ tấn"
      }
    ],
    "answer": "B",
    "explanation": "Lợi nhuận $P=15x-C(x)=-x^3+6x^2$; $P'=3x(4-x)=0 \\Leftrightarrow x=4$ (trong miền $x>0$).",
    "points": 0.25,
    "tags": [
      "tối ưu",
      "kinh tế",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một hình chữ nhật có chu vi 40 cm. Diện tích lớn nhất của hình chữ nhật đó là",
    "options": [
      {
        "key": "A",
        "text": "$100$ cm²"
      },
      {
        "key": "B",
        "text": "$80$ cm²"
      },
      {
        "key": "C",
        "text": "$120$ cm²"
      },
      {
        "key": "D",
        "text": "$400$ cm²"
      }
    ],
    "answer": "A",
    "explanation": "Cạnh $x$ và $20-x$: $S=x(20-x)\\le 100$, dấu bằng khi $x=10$.",
    "points": 0.25,
    "tags": [
      "tối ưu",
      "quãng đường",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Rào quanh một khu vườn chữ nhật với chu vi 200 m. Diện tích lớn nhất của khu vườn là",
    "options": [
      {
        "key": "A",
        "text": "$1600$ m$^2$"
      },
      {
        "key": "B",
        "text": "$1875$ m$^2$"
      },
      {
        "key": "C",
        "text": "$2000$ m$^2$"
      },
      {
        "key": "D",
        "text": "$2500$ m$^2$"
      }
    ],
    "answer": "D",
    "explanation": "Diện tích lớn nhất khi vườn là hình vuông cạnh 50 m: $S=2500$ m$^2$.",
    "points": 0.25,
    "tags": [
      "tối ưu",
      "hình học",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Chi phí sản xuất $x$ sản phẩm là $C(x)=0{,}01x^2+40x+4000$ (nghìn đồng). Chi phí trung bình $\\dfrac{C(x)}{x}$ đạt nhỏ nhất khi $x$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$200$ sản phẩm"
      },
      {
        "key": "B",
        "text": "$2000$ sản phẩm"
      },
      {
        "key": "C",
        "text": "$632$ sản phẩm"
      },
      {
        "key": "D",
        "text": "$400$ sản phẩm"
      }
    ],
    "answer": "C",
    "explanation": "$\\dfrac{C(x)}{x}=0{,}01x+40+\\dfrac{4000}{x}$ nhỏ nhất khi $0{,}01=\\dfrac{4000}{x^2}$, tức $x=\\sqrt{400000}\\approx 632$.",
    "points": 0.25,
    "tags": [
      "tối ưu",
      "kinh tế",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Doanh thu khi bán $q$ sản phẩm là $R(q)=120q-q^2$ (triệu đồng). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Giá bán để bán được $q$ sản phẩm là $p=120-q$ (triệu đồng)"
      },
      {
        "key": "b",
        "text": "Doanh thu lớn nhất khi $q=60$"
      },
      {
        "key": "c",
        "text": "Doanh thu lớn nhất bằng 3600 triệu đồng"
      },
      {
        "key": "d",
        "text": "$R(100)=3000$ triệu đồng"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) $R=pq \\Rightarrow p=120-q$ — đúng. b) Đỉnh $q=60$ — đúng. c) $R(60)=3600$ — đúng. d) $R(100)=12000-10000=2000$ — sai.",
    "points": 1,
    "tags": [
      "tối ưu",
      "kinh tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Từ tấm bìa vuông cạnh 24 cm cắt bốn góc các hình vuông cạnh $x$ (cm) rồi gập thành hộp không nắp (hình minh hoạ tấm bìa). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Thể tích hộp là $V(x)=x(24-2x)^2$"
      },
      {
        "key": "b",
        "text": "$x$ nhận giá trị trong khoảng $(0;12)$"
      },
      {
        "key": "c",
        "text": "$V(x)$ tăng trên $(0;12)$"
      },
      {
        "key": "d",
        "text": "$V(2)=800$ cm$^3$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) Đúng. c) $V$ tăng rồi giảm trên $(0;12)$ — sai. d) $V(2)=2 \\cdot 20^2=800$ — đúng.",
    "points": 1,
    "tags": [
      "tối ưu",
      "thể tích",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "A(0; 0) B(24; 0) C(24; 24) D(0; 24)\nAB, BC, CD, DA\nkích thước AB \"24 cm\""
    }
  },
  {
    "id": "thpt-t12-toiuu-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Chi phí sản xuất $q$ sản phẩm là $C(q)=q^2+20q+100$ (nghìn đồng), mỗi sản phẩm bán 60 nghìn đồng. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Lợi nhuận $P(q)=-q^2+40q-100$"
      },
      {
        "key": "b",
        "text": "Lợi nhuận lớn nhất khi $q=40$"
      },
      {
        "key": "c",
        "text": "Lợi nhuận lớn nhất bằng 300 nghìn đồng"
      },
      {
        "key": "d",
        "text": "Lợi nhuận bằng 0 khi $q=20$"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) $P=60q-C(q)$ — đúng. b) Đỉnh $q=20$ — sai. c) $P(20)=-400+800-100=300$ — đúng. d) $P(20)=300 \\ne 0$ — sai.",
    "points": 1,
    "tags": [
      "tối ưu",
      "kinh tế",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về công thức thể tích:",
    "options": [
      {
        "key": "a",
        "text": "Hộp chữ nhật có thể tích $V=(a+b+c)^3$"
      },
      {
        "key": "b",
        "text": "Khối trụ có thể tích $V=\\pi r^2 h$"
      },
      {
        "key": "c",
        "text": "Khối cầu có thể tích $V=\\dfrac{4}{3}\\pi r^3$"
      },
      {
        "key": "d",
        "text": "Khối nón có thể tích $V=\\dfrac{1}{3}\\pi r^2 h$"
      }
    ],
    "answer": "SĐĐĐ",
    "explanation": "a) Sai, đúng là $V=abc$. b), c), d) Đúng.",
    "points": 1,
    "tags": [
      "tối ưu",
      "hình học",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Kéo một vật bằng lực $F=50$ N theo phương chuyển động với tốc độ $v$ (m/s). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Nếu $v=2$ m/s thì trong 10 s lực sinh công 1000 J"
      },
      {
        "key": "b",
        "text": "Công suất khi $v=2$ m/s là 500 W"
      },
      {
        "key": "c",
        "text": "Nếu tốc độ tăng gấp đôi thì công suất tăng gấp đôi"
      },
      {
        "key": "d",
        "text": "Công suất được đo bằng jun"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) $W=F \\cdot s=50 \\cdot 20=1000$ J — đúng. b) $P=Fv=100$ W $\\ne 500$ — sai. c) $P=Fv$ tỉ lệ $v$ — đúng. d) Công suất đo bằng watt — sai.",
    "points": 1,
    "tags": [
      "tối ưu",
      "vật lí",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một xe đi từ $A$ qua $B$ đến $C$ (như hình): đoạn $AB=60$ km với tốc độ 80 km/h, đoạn $BC=30$ km với tốc độ 40 km/h. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Thời gian đi $AB$ là 0,75 h"
      },
      {
        "key": "b",
        "text": "Thời gian đi $BC$ là 0,75 h"
      },
      {
        "key": "c",
        "text": "Tốc độ trung bình trên cả đoạn là 90 km/h"
      },
      {
        "key": "d",
        "text": "Tổng thời gian là 1,5 h"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a), b) $60:80=30:40=0{,}75$ h — đúng. c) $90:1{,}5=60$ km/h — sai. d) Đúng.",
    "points": 1,
    "tags": [
      "tối ưu",
      "quãng đường",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "A(0; 0) B(60; 0) C(90; 0)\nAB, BC\nkích thước AB \"60 km\"\nkích thước BC \"30 km\""
    }
  },
  {
    "id": "thpt-t12-toiuu-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Doanh thu khi bán $q$ sản phẩm là $R(q)=-q^2+40q$ (triệu đồng). Tính $q$ để doanh thu lớn nhất.",
    "answer": "20",
    "explanation": "Đỉnh parabol $q=\\dfrac{40}{2}=20$.",
    "points": 0.5,
    "tags": [
      "tối ưu",
      "kinh tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tổng chi phí xăng khi đi 200 km với tốc độ $v$ (km/h) là $F(v)=2v+\\dfrac{800}{v}$ (nghìn đồng). Tính chi phí nhỏ nhất.",
    "answer": "80",
    "explanation": "$F \\ge 2\\sqrt{2v \\cdot \\frac{800}{v}}=80$ khi $v=20$.",
    "points": 0.5,
    "tags": [
      "tối ưu",
      "quãng đường",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Chi phí $C(x)=2x+100$ (nghìn đồng), giá bán 12 nghìn đồng/sản phẩm. Cần bán bao nhiêu sản phẩm để hòa vốn?",
    "answer": "10",
    "explanation": "$12x=2x+100 \\Leftrightarrow x=10$.",
    "points": 0.5,
    "tags": [
      "tối ưu",
      "kinh tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Rào chu vi 120 m quanh vườn chữ nhật. Tính diện tích lớn nhất của vườn (m²).",
    "answer": "900",
    "explanation": "Diện tích lớn nhất khi hình vuông cạnh 30 m: $900$ m$^2$.",
    "points": 0.5,
    "tags": [
      "tối ưu",
      "hình học",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Bồn nước hình trụ có thể tích $64\\pi$ m³ và chiều cao 4 m. Tính bán kính đáy (m).",
    "answer": "4",
    "explanation": "$\\pi r^2 \\cdot 4=64\\pi \\Rightarrow r=4$ m.",
    "points": 0.5,
    "tags": [
      "tối ưu",
      "hình học",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Lợi nhuận khi sản xuất $x$ sản phẩm là $P(x)=-2x^2+80x-300$ (nghìn đồng). Tính lợi nhuận lớn nhất.",
    "answer": "500",
    "explanation": "Đỉnh $x=20$: $P(20)=-800+1600-300=500$ nghìn đồng.",
    "points": 0.5,
    "tags": [
      "tối ưu",
      "kinh tế",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-toiuu-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một xe đi $\\dfrac{3}{4}$ quãng đường với tốc độ 60 km/h và $\\dfrac{1}{4}$ quãng đường còn lại với tốc độ 40 km/h. Tính tốc độ trung bình (làm tròn đến hàng phần mười).",
    "answer": "53,3",
    "explanation": "Đưa về quãng đường 4 đơn vị: thời gian $\\dfrac{3}{60}+\\dfrac{1}{40}=\\dfrac{3}{40}$ h, tốc độ trung bình $=\\dfrac{4}{\\frac{3}{40}}=\\dfrac{160}{3} \\approx 53{,}3$ km/h.",
    "points": 0.5,
    "tags": [
      "tối ưu",
      "quãng đường",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Diện tích hình phẳng giới hạn bởi $y=x$, trục $Ox$ và $x=2$ là",
    "options": [
      {
        "key": "A",
        "text": "$1$"
      },
      {
        "key": "B",
        "text": "$2$"
      },
      {
        "key": "C",
        "text": "$4$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{2}$"
      }
    ],
    "answer": "B",
    "explanation": "$S=\\int\\limits_0^2 x\\,dx=2$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "diện tích",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Thể tích khối tròn xoay tạo thành khi quay $y=x$ quanh trục $Ox$ với $x \\in [0;1]$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\pi$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{\\pi}{2}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{\\pi}{3}$"
      },
      {
        "key": "D",
        "text": "$2\\pi$"
      }
    ],
    "answer": "C",
    "explanation": "$V=\\pi\\int\\limits_0^1 x^2 dx=\\dfrac{\\pi}{3}$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "thể tích xoay",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Diện tích hình phẳng giới hạn bởi hai đồ thị $y=x^2$ và $y=x$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{1}{3}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{1}{4}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{6}$"
      }
    ],
    "answer": "D",
    "explanation": "$S=\\int\\limits_0^1(x-x^2)\\,dx=\\dfrac{1}{2}-\\dfrac{1}{3}=\\dfrac{1}{6}$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "diện tích",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật chuyển động với vận tốc $v(t)=3t^2$ (m/s). Quãng đường đi được trong 2 giây đầu là",
    "options": [
      {
        "key": "A",
        "text": "$8$ m"
      },
      {
        "key": "B",
        "text": "$4$ m"
      },
      {
        "key": "C",
        "text": "$12$ m"
      },
      {
        "key": "D",
        "text": "$6$ m"
      }
    ],
    "answer": "A",
    "explanation": "$s=\\int\\limits_0^2 3t^2\\,dt=8$ m.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "quãng đường",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Diện tích hình phẳng giới hạn bởi parabol $y=4-x^2$ (như hình) và trục $Ox$ là",
    "options": [
      {
        "key": "A",
        "text": "$16$"
      },
      {
        "key": "B",
        "text": "$8$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{32}{3}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{16}{3}$"
      }
    ],
    "answer": "C",
    "explanation": "$S=\\int\\limits_{-2}^{2}(4-x^2)\\,dx=\\left[4x-\\dfrac{x^3}{3}\\right]_{-2}^{2}=\\dfrac{32}{3}$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "diện tích",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "4-x^2"
      ],
      "xMin": -3,
      "xMax": 3,
      "yMin": -2,
      "yMax": 6,
      "labels": true
    }
  },
  {
    "id": "thpt-t12-ungdungtp-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một cổng có dạng parabol $y=4-\\dfrac{x^2}{4}$ (m) như hình, chân cổng chạm đất tại hai điểm trên trục $Ox$. Diện tích phần cổng phía trên mặt đất (làm tròn đến hàng phần trăm m²) là",
    "options": [
      {
        "key": "A",
        "text": "$32$ m$^2$"
      },
      {
        "key": "B",
        "text": "$26{,}67$ m$^2$"
      },
      {
        "key": "C",
        "text": "$16$ m$^2$"
      },
      {
        "key": "D",
        "text": "$21{,}33$ m$^2$"
      }
    ],
    "answer": "D",
    "explanation": "Chân cổng tại $x=\\pm 4$: $S=\\int_{-4}^{4}\\left(4-\\dfrac{x^2}{4}\\right)dx=32-\\dfrac{32}{3}=\\dfrac{64}{3}\\approx 21{,}33$ m².",
    "points": 0.25,
    "tags": [
      "tích phân",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "4-x^2/4"
      ],
      "xMin": -5,
      "xMax": 5,
      "yMin": -1,
      "yMax": 5,
      "labels": true
    }
  },
  {
    "id": "thpt-t12-ungdungtp-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Thể tích khối tròn xoay tạo thành khi quay $y=\\sqrt{x}$ quanh trục $Ox$ với $x \\in [0;4]$ là",
    "options": [
      {
        "key": "A",
        "text": "$4\\pi$"
      },
      {
        "key": "B",
        "text": "$2\\pi$"
      },
      {
        "key": "C",
        "text": "$16\\pi$"
      },
      {
        "key": "D",
        "text": "$8\\pi$"
      }
    ],
    "answer": "D",
    "explanation": "$V=\\pi\\int\\limits_0^4 x\\,dx=8\\pi$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "thể tích xoay",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật chuyển động với vận tốc $v(t)=6t-3t^2$ (m/s). Vật dừng lại lần đầu tiên tại $t=2$ s. Quãng đường vật đi được từ lúc xuất phát đến khi dừng là",
    "options": [
      {
        "key": "A",
        "text": "$4$ m"
      },
      {
        "key": "B",
        "text": "$6$ m"
      },
      {
        "key": "C",
        "text": "$3$ m"
      },
      {
        "key": "D",
        "text": "$8$ m"
      }
    ],
    "answer": "A",
    "explanation": "$s=\\int\\limits_0^2(6t-3t^2)\\,dt=\\left[3t^2-t^3\\right]_0^2=12-8=4$ m.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "quãng đường",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Diện tích hình phẳng giới hạn bởi $y=2^x$, trục $Ox$ và hai đường $x=0$, $x=2$ (làm tròn đến hàng phần trăm) là",
    "options": [
      {
        "key": "A",
        "text": "$4$ "
      },
      {
        "key": "B",
        "text": "$2{,}88$"
      },
      {
        "key": "C",
        "text": "$4{,}33$"
      },
      {
        "key": "D",
        "text": "$3{,}46$"
      }
    ],
    "answer": "C",
    "explanation": "$S=\\left[\\dfrac{2^x}{\\ln 2}\\right]_0^2=\\dfrac{3}{\\ln 2} \\approx 4{,}33$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "hàm mũ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật chuyển động với vận tốc $v(t)=5+2t$ (m/s). Quãng đường đi được trong 3 giây đầu là",
    "options": [
      {
        "key": "A",
        "text": "$15$ m"
      },
      {
        "key": "B",
        "text": "$21$ m"
      },
      {
        "key": "C",
        "text": "$9$ m"
      },
      {
        "key": "D",
        "text": "$24$ m"
      }
    ],
    "answer": "D",
    "explanation": "$s=\\left[5t+t^2\\right]_0^3=15+9=24$ m.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "quãng đường",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Diện tích hình phẳng giới hạn bởi $y=e^x$ (như hình), trục $Ox$, trục $Oy$ và $x=1$ (làm tròn đến hàng phần trăm) là",
    "options": [
      {
        "key": "A",
        "text": "$e$"
      },
      {
        "key": "B",
        "text": "$1{,}72$"
      },
      {
        "key": "C",
        "text": "$2{,}72$"
      },
      {
        "key": "D",
        "text": "$0{,}72$"
      }
    ],
    "answer": "B",
    "explanation": "$S=e-1 \\approx 1{,}72$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "hàm mũ",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "exp(x)"
      ],
      "xMin": -2,
      "xMax": 2,
      "yMin": -1,
      "yMax": 6,
      "labels": true
    }
  },
  {
    "id": "thpt-t12-ungdungtp-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Thể tích khối tròn xoay tạo thành khi quay $y=\\dfrac{1}{x}$ quanh trục $Ox$ với $x \\in [1;e]$ (làm tròn đến hàng phần trăm) là",
    "options": [
      {
        "key": "A",
        "text": "$\\pi e$"
      },
      {
        "key": "B",
        "text": "$3{,}14$"
      },
      {
        "key": "C",
        "text": "$1{,}99$"
      },
      {
        "key": "D",
        "text": "$2{,}72$"
      }
    ],
    "answer": "C",
    "explanation": "$V=\\pi\\int\\limits_1^e \\dfrac{1}{x^2}\\,dx=\\pi\\left(1-\\dfrac{1}{e}\\right) \\approx 1{,}99$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "thể tích xoay",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét hình phẳng giới hạn bởi $y=4-x^2$ và trục $Ox$ (như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Parabol cắt trục $Ox$ tại $x=\\pm 2$"
      },
      {
        "key": "b",
        "text": "Diện tích được tính bởi $S=\\int\\limits_{-2}^{2}(4-x^2)\\,dx$"
      },
      {
        "key": "c",
        "text": "$S=\\dfrac{32}{3}$"
      },
      {
        "key": "d",
        "text": "$S=16$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a), b), c) Đúng. d) $\\dfrac{32}{3} \\ne 16$ — sai.",
    "points": 1,
    "tags": [
      "tích phân",
      "diện tích",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "4-x^2"
      ],
      "xMin": -3,
      "xMax": 3,
      "yMin": -2,
      "yMax": 6,
      "labels": true
    }
  },
  {
    "id": "thpt-t12-ungdungtp-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về thể tích khối tròn xoay:",
    "options": [
      {
        "key": "a",
        "text": "Quay $y=f(x)$ quanh $Ox$: $V=\\pi\\int\\limits_a^b f^2(x)\\,dx$"
      },
      {
        "key": "b",
        "text": "Quay $y=x$ quanh $Ox$ với $x \\in [0;2]$: $V=\\dfrac{8\\pi}{3}$"
      },
      {
        "key": "c",
        "text": "Quay $y=2x$ quanh $Ox$ với $x \\in [0;1]$: $V=\\dfrac{8\\pi}{3}$"
      },
      {
        "key": "d",
        "text": "Đơn vị thể tích có thể là cm³"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) $\\pi\\int\\limits_0^2 x^2 dx=\\dfrac{8\\pi}{3}$ — đúng. c) $\\pi\\int\\limits_0^1 4x^2 dx=\\dfrac{4\\pi}{3} \\ne \\dfrac{8\\pi}{3}$ — sai. d) Đúng.",
    "points": 1,
    "tags": [
      "tích phân",
      "thể tích xoay",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một cổng có dạng parabol $y=4-\\dfrac{x^2}{4}$ (m) như hình. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Cổng rộng 8 m ở chân"
      },
      {
        "key": "b",
        "text": "Cổng cao 4 m"
      },
      {
        "key": "c",
        "text": "Diện tích cổng $\\approx 26{,}67$ m$^2$"
      },
      {
        "key": "d",
        "text": "Một xe tải cao 4 m đi qua được cổng"
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Chân tại $x=\\pm4$ — đúng. b) Đúng. c) $S=\\dfrac{64}{3}\\approx 21{,}33$ m² — sai. d) Cổng chỉ cao đúng 4 m tại một điểm — sai.",
    "points": 1,
    "tags": [
      "tích phân",
      "bài toán thực tế",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "4-x^2/4"
      ],
      "xMin": -5,
      "xMax": 5,
      "yMin": -1,
      "yMax": 5,
      "labels": true
    }
  },
  {
    "id": "thpt-t12-ungdungtp-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về quãng đường – vận tốc:",
    "options": [
      {
        "key": "a",
        "text": "Khi $v(t) \\ge 0$, quãng đường $s=\\int\\limits_{t_1}^{t_2} v(t)\\,dt$"
      },
      {
        "key": "b",
        "text": "Với $v(t)=t$, quãng đường trong 2 giây đầu là 2 m"
      },
      {
        "key": "c",
        "text": "Tích phân của vận tốc (m/s) theo thời gian (s) cho quãng đường (m)"
      },
      {
        "key": "d",
        "text": "Với $v(t)=3t^2$, quãng đường trong 1 giây đầu là 3 m"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a), b), c) Đúng. d) $\\int\\limits_0^1 3t^2\\,dt=1$ m $\\ne 3$ — sai.",
    "points": 1,
    "tags": [
      "tích phân",
      "quãng đường",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét hình phẳng giới hạn bởi $y=x^2$ và $y=\\sqrt{x}$ (như hình). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Hai đồ thị cắt nhau tại $x=0$ và $x=1$"
      },
      {
        "key": "b",
        "text": "Diện tích $S=\\int\\limits_0^1\\left(\\sqrt{x}-x^2\\right)dx$"
      },
      {
        "key": "c",
        "text": "$S=\\dfrac{2}{3}$"
      },
      {
        "key": "d",
        "text": "$S=\\dfrac{1}{3}$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a), b) Đúng. $S=\\dfrac{2}{3}-\\dfrac{1}{3}=\\dfrac{1}{3}$ nên c) sai, d) đúng.",
    "points": 1,
    "tags": [
      "tích phân",
      "diện tích",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^2",
        "sqrt(x)"
      ],
      "xMin": -0.5,
      "xMax": 2,
      "yMin": -0.5,
      "yMax": 2,
      "labels": true
    }
  },
  {
    "id": "thpt-t12-ungdungtp-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét tính đúng sai về khối tròn xoay:",
    "options": [
      {
        "key": "a",
        "text": "Quay nửa đường tròn $y=\\sqrt{r^2-x^2}$ quanh $Ox$ tạo khối cầu bán kính $r$"
      },
      {
        "key": "b",
        "text": "Thể tích khối cầu bằng $\\dfrac{3\\pi r^3}{4}$"
      },
      {
        "key": "c",
        "text": "Quay $y=r$ quanh $Ox$ với $x \\in [0;h]$ tạo khối trụ thể tích $\\pi r^2 h$"
      },
      {
        "key": "d",
        "text": "Quay $y=x^2$ quanh $Ox$ với $x \\in [0;1]$ tạo khối có thể tích $\\dfrac{\\pi}{5}$"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đúng. b) Đúng là $\\dfrac{4\\pi r^3}{3}$ — sai. c) Đúng. d) $\\pi\\int\\limits_0^1 x^4 dx=\\dfrac{\\pi}{5}$ — đúng.",
    "points": 1,
    "tags": [
      "tích phân",
      "thể tích xoay",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính diện tích hình phẳng giới hạn bởi $y=x^3$, trục $Ox$ và $x=2$.",
    "answer": "4",
    "explanation": "$S=\\int\\limits_0^2 x^3\\,dx=4$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "diện tích",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính thể tích khối tròn xoay khi quay $y=\\sin x$ quanh $Ox$ với $x \\in [0;\\pi]$ (làm tròn đến hàng phần trăm).",
    "answer": "4,93",
    "explanation": "$V=\\pi\\int\\limits_0^{\\pi}\\sin^2 x\\,dx=\\dfrac{\\pi^2}{2} \\approx 4{,}93$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "thể tích xoay",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Vật chuyển động với vận tốc $v(t)=10-2t$ (m/s), dừng lại lần đầu tại $t=5$ s. Tính quãng đường đi được.",
    "answer": "25",
    "explanation": "$s=\\left[10t-t^2\\right]_0^5=25$ m.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "quãng đường",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính diện tích hình phẳng giới hạn bởi $y=3x^2$, trục $Ox$ và $x=1$, $x=2$.",
    "answer": "7",
    "explanation": "$S=\\left[x^3\\right]_1^2=7$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "diện tích",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một cổng parabol $y=9-x^2$ (m) có chân chạm đất tại $x=\\pm 3$. Tính diện tích phần cổng phía trên mặt đất (m²).",
    "answer": "36",
    "explanation": "$S=\\int\\limits_{-3}^{3}(9-x^2)\\,dx=54-18=36$ m$^2$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính thể tích khối tròn xoay khi quay $y=e^x$ quanh $Ox$ với $x \\in \\left[0;\\dfrac{1}{2}\\right]$ (làm tròn đến hàng phần mười).",
    "answer": "2,7",
    "explanation": "$V=\\pi\\int_0^{1/2}e^{2x}dx=\\dfrac{\\pi(e-1)}{2}\\approx 2{,}70$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "thể tích xoay",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-ungdungtp-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính diện tích hình phẳng giới hạn bởi $y=x$ và $y=x^2$ (làm tròn đến hàng phần trăm).",
    "answer": "0,17",
    "explanation": "$S=\\int\\limits_0^1(x-x^2)\\,dx=\\dfrac{1}{6} \\approx 0{,}17$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "diện tích",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $P(A \\cap B)=0{,}2$ và $P(B)=0{,}5$. Khi đó $P(A \\mid B)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$0{,}1$"
      },
      {
        "key": "B",
        "text": "$0{,}4$"
      },
      {
        "key": "C",
        "text": "$0{,}3$"
      },
      {
        "key": "D",
        "text": "$0{,}7$"
      }
    ],
    "answer": "B",
    "explanation": "$P(A \\mid B)=\\dfrac{P(A \\cap B)}{P(B)}=\\dfrac{0{,}2}{0{,}5}=0{,}4$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "có điều kiện",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Công thức nhân xác suất được viết là",
    "options": [
      {
        "key": "A",
        "text": "$P(A \\cap B)=P(A)+P(B)$"
      },
      {
        "key": "B",
        "text": "$P(A \\cap B)=P(A) \\cdot P(B)$ với mọi $A$, $B$"
      },
      {
        "key": "C",
        "text": "$P(A \\cap B)=P(B) \\cdot P(A \\mid B)$"
      },
      {
        "key": "D",
        "text": "$P(A \\cap B)=P(A)-P(B)$"
      }
    ],
    "answer": "C",
    "explanation": "Định nghĩa xác suất có điều kiện cho $P(A \\cap B)=P(B) \\cdot P(A \\mid B)$ (và $=P(A) \\cdot P(B \\mid A)$).",
    "points": 0.25,
    "tags": [
      "xác suất",
      "quy tắc nhân",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Có hai hộp bi: hộp I có 3 bi đỏ, 2 bi xanh; hộp II có 1 bi đỏ, 4 bi xanh. Chọn ngẫu nhiên một hộp (xác suất bằng nhau) rồi bốc một bi (sơ đồ cây như hình). Xác suất bốc được bi đỏ là",
    "options": [
      {
        "key": "A",
        "text": "$0{,}4$"
      },
      {
        "key": "B",
        "text": "$0{,}3$"
      },
      {
        "key": "C",
        "text": "$0{,}5$"
      },
      {
        "key": "D",
        "text": "$0{,}6$"
      }
    ],
    "answer": "A",
    "explanation": "Công thức xác suất toàn phần: $P=0{,}5 \\cdot 0{,}6+0{,}5 \\cdot 0{,}2=0{,}4$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "toàn phần",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "probtree",
      "text": "Hộp I: 0,5\n  Đỏ: 0,6\n  Xanh: 0,4\nHộp II: 0,5\n  Đỏ: 0,2\n  Xanh: 0,8"
    }
  },
  {
    "id": "thpt-t12-xacsuat-thongke-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $P(A)=0{,}6$ và $P(B \\mid A)=0{,}5$. Khi đó $P(A \\cap B)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$0{,}8$"
      },
      {
        "key": "B",
        "text": "$0{,}12$"
      },
      {
        "key": "C",
        "text": "$0{,}2$"
      },
      {
        "key": "D",
        "text": "$0{,}3$"
      }
    ],
    "answer": "D",
    "explanation": "$P(A \\cap B)=P(A) \\cdot P(B \\mid A)=0{,}6 \\cdot 0{,}5=0{,}3$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "quy tắc nhân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hai nhà máy I và II cung cấp lần lượt 80% và 20% số sản phẩm cho một cửa hàng. Tỉ lệ sản phẩm lỗi của nhà máy I là 2%, của nhà máy II là 5%. Chọn ngẫu nhiên một sản phẩm lỗi, xác suất sản phẩm đó do nhà máy I sản xuất là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{8}{13}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{2}{13}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{5}{13}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{2}$"
      }
    ],
    "answer": "A",
    "explanation": "$P(\\text{lỗi})=0{,}8 \\cdot 0{,}02+0{,}2 \\cdot 0{,}05=0{,}026$; $P(I \\mid \\text{lỗi})=\\dfrac{0{,}016}{0{,}026}=\\dfrac{8}{13}$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "Bayes",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Gieo một xúc xắc sáu mặt đồng chất. Gọi $A$ là biến cố \"mặt xuất hiện số chẵn\", $B$ là biến cố \"mặt xuất hiện số lớn hơn 3\". Xác suất $P(A \\mid B)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{1}{3}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{2}{3}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{6}$"
      }
    ],
    "answer": "C",
    "explanation": "$A \\cap B=\\{4;6\\}$, $B=\\{4;5;6\\}$ nên $P(A \\mid B)=\\dfrac{2}{3}$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "có điều kiện",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một bệnh hiếm gặp ở 1% dân số. Xét nghiệm cho kết quả dương với 95% người có bệnh và 5% người không có bệnh (sơ đồ cây như hình). Xác suất một người được chọn ngẫu nhiên cho kết quả dương là",
    "options": [
      {
        "key": "A",
        "text": "$0{,}01$"
      },
      {
        "key": "B",
        "text": "$0{,}0595$"
      },
      {
        "key": "C",
        "text": "$0{,}095$"
      },
      {
        "key": "D",
        "text": "$0{,}059$"
      }
    ],
    "answer": "D",
    "explanation": "$P=0{,}01 \\cdot 0{,}95+0{,}99 \\cdot 0{,}05=0{,}0095+0{,}0495=0{,}059$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "toàn phần",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "probtree",
      "text": "Bệnh: 0,01\n  Dương: 0,95\n  Âm: 0,05\nKhông bệnh: 0,99\n  Dương: 0,05\n  Âm: 0,95"
    }
  },
  {
    "id": "thpt-t12-xacsuat-thongke-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Mẫu số liệu ghép nhóm có các nhóm $[20;30)$, $[30;40)$, $[40;50)$. Khoảng biến thiên của mẫu là",
    "options": [
      {
        "key": "A",
        "text": "$30$"
      },
      {
        "key": "B",
        "text": "$20$"
      },
      {
        "key": "C",
        "text": "$10$"
      },
      {
        "key": "D",
        "text": "$40$"
      }
    ],
    "answer": "A",
    "explanation": "$R=50-20=30$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "khoảng biến thiên",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Mẫu ghép nhóm: $[10;20)$ có tần số 6, $[20;30)$ có tần số 10, $[30;40)$ có tần số 4 ($n=20$). Khoảng tứ phân vị của mẫu (làm tròn đến hàng phần trăm) là",
    "options": [
      {
        "key": "A",
        "text": "$4{,}67$"
      },
      {
        "key": "B",
        "text": "$10{,}67$"
      },
      {
        "key": "C",
        "text": "$8{,}33$"
      },
      {
        "key": "D",
        "text": "$6{,}67$"
      }
    ],
    "answer": "B",
    "explanation": "Tần số tích luỹ: $6;16;20$. $Q_1=10+\\dfrac{5-0}{6} \\cdot 10=\\dfrac{55}{3} \\approx 18{,}33$; $Q_3=20+\\dfrac{15-6}{10} \\cdot 10=29$; $\\Delta_Q=29-\\dfrac{55}{3}=\\dfrac{32}{3} \\approx 10{,}67$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "tứ phân vị ghép nhóm",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị đại diện của nhóm $[25;35)$ là",
    "options": [
      {
        "key": "A",
        "text": "$25$"
      },
      {
        "key": "B",
        "text": "$30$"
      },
      {
        "key": "C",
        "text": "$35$"
      },
      {
        "key": "D",
        "text": "$32{,}5$"
      }
    ],
    "answer": "B",
    "explanation": "Giá trị đại diện $=\\dfrac{25+35}{2}=30$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "trung tâm kiểu",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Mẫu ghép nhóm: nhóm $[0;10)$ có tần số 2 (giá trị đại diện 5), nhóm $[10;20)$ có tần số 3 (giá trị đại diện 15). Phương sai của mẫu là",
    "options": [
      {
        "key": "A",
        "text": "$18$"
      },
      {
        "key": "B",
        "text": "$11$"
      },
      {
        "key": "C",
        "text": "$24$"
      },
      {
        "key": "D",
        "text": "$20$"
      }
    ],
    "answer": "C",
    "explanation": "$\\bar{x}=11$; $s^2=\\dfrac{2(5-11)^2+3(15-11)^2}{5}=\\dfrac{72+48}{5}=24$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "phương sai ghép nhóm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Mẫu ghép nhóm (như hình): nhóm $[5;15)$ tần số 4, nhóm $[15;25)$ tần số 6. Độ lệch chuẩn của mẫu (làm tròn đến hàng phần trăm) là",
    "options": [
      {
        "key": "A",
        "text": "$5{,}76$"
      },
      {
        "key": "B",
        "text": "$4{,}90$"
      },
      {
        "key": "C",
        "text": "$24{,}00$"
      },
      {
        "key": "D",
        "text": "$2{,}45$"
      }
    ],
    "answer": "B",
    "explanation": "$\\bar{x}=16$; $s^2=\\dfrac{4(10-16)^2+6(20-16)^2}{10}=24$; $s=\\sqrt{24} \\approx 4{,}90$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "độ lệch chuẩn",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "grouped",
      "groups": "[5; 15): 4\n[15; 25): 6",
      "label": "Nhóm",
      "freqLabel": "Tần số",
      "view": "htable",
      "polygon": false,
      "extras": ""
    }
  },
  {
    "id": "thpt-t12-xacsuat-thongke-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một hộp có 2 bi đỏ và 3 bi xanh. Bốc lần lượt 2 bi không hoàn lại. Gọi $A$ là biến cố \"bi thứ nhất màu đỏ\", $B$ là biến cố \"bi thứ hai màu đỏ\". Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$P(A \\cap B)=\\dfrac{1}{10}$"
      },
      {
        "key": "b",
        "text": "$P(B \\mid A)=\\dfrac{1}{4}$"
      },
      {
        "key": "c",
        "text": "$P(B)=\\dfrac{1}{10}$"
      },
      {
        "key": "d",
        "text": "$A$ và $B$ là hai biến cố độc lập"
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) $\\dfrac{2}{5}\\cdot\\dfrac{1}{4}=\\dfrac{1}{10}$ — đúng. b) Đúng. c) $P(B)=\\dfrac{1}{10}+\\dfrac{3}{5}\\cdot\\dfrac{2}{4}=\\dfrac{2}{5}$ — sai. d) $P(B\\mid A)\\ne P(B)$ — sai.",
    "points": 1,
    "tags": [
      "xác suất",
      "có điều kiện",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Trong một trường, 60% học sinh là nữ; 30% nữ và 50% nam thích môn Toán. Chọn ngẫu nhiên một học sinh. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Xác suất học sinh đó là nữ bằng 0,6"
      },
      {
        "key": "b",
        "text": "Xác suất học sinh đó thích Toán bằng 0,4"
      },
      {
        "key": "c",
        "text": "Biết học sinh đó thích Toán, xác suất là nữ bằng $\\dfrac{9}{19}$"
      },
      {
        "key": "d",
        "text": "Xác suất học sinh thích Toán biết học sinh đó là nữ bằng 0,5"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) $P=0{,}6 \\cdot 0{,}3+0{,}4 \\cdot 0{,}5=0{,}38 \\ne 0{,}4$ — sai. c) $\\dfrac{0{,}18}{0{,}38}=\\dfrac{9}{19}$ — đúng. d) Là 0,3 — sai.",
    "points": 1,
    "tags": [
      "xác suất",
      "Bayes",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một bệnh xuất hiện ở 2% dân số. Xét nghiệm dương tính với 90% người có bệnh và 10% người không có bệnh. Chọn ngẫu nhiên một người. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "$P(\\text{bệnh})=0{,}02$"
      },
      {
        "key": "b",
        "text": "$P(\\text{dương})=0{,}116$"
      },
      {
        "key": "c",
        "text": "$P(\\text{bệnh} \\mid \\text{dương}) \\approx 0{,}155$"
      },
      {
        "key": "d",
        "text": "$P(\\text{bệnh} \\mid \\text{dương})>0{,}5$"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) $0{,}02 \\cdot 0{,}9+0{,}98 \\cdot 0{,}1=0{,}116$ — đúng. c) $\\dfrac{0{,}018}{0{,}116} \\approx 0{,}155$ — đúng. d) $0{,}155<0{,}5$ — sai.",
    "points": 1,
    "tags": [
      "xác suất",
      "Bayes",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Lớp 10A có 40 học sinh: 24 em chơi bóng đá; trong 24 em đó có 18 em thích môn thể thao. Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Xác suất chọn được em chơi bóng đá là 0,6"
      },
      {
        "key": "b",
        "text": "$P(\\text{đá bóng} \\cap \\text{thích})=0{,}45$"
      },
      {
        "key": "c",
        "text": "$P(\\text{thích} \\mid \\text{đá bóng})=0{,}6$"
      },
      {
        "key": "d",
        "text": "$P(\\text{thích} \\mid \\text{đá bóng})=0{,}75$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $\\dfrac{24}{40}=0{,}6$ — đúng. b) $\\dfrac{18}{40}=0{,}45$ — đúng. c) $\\dfrac{18}{24}=0{,}75 \\ne 0{,}6$ — sai. d) Đúng.",
    "points": 1,
    "tags": [
      "xác suất",
      "có điều kiện",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Mẫu số liệu ghép nhóm: nhóm $[10;20)$ tần số 5, nhóm $[20;30)$ tần số 10, nhóm $[30;40)$ tần số 5 ($n=20$). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Trung tâm kiểu của nhóm thứ hai là 25"
      },
      {
        "key": "b",
        "text": "Trung vị của mẫu là 25"
      },
      {
        "key": "c",
        "text": "Mốt của mẫu là 25"
      },
      {
        "key": "d",
        "text": "Khoảng biến thiên của mẫu là 20"
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) Vị trí 10–11 rơi vào nhóm $[20;30)$: $20+\\dfrac{10-5}{10} \\cdot 10=25$ — đúng. c) Nhóm có tần số lớn nhất $[20;30)$: mốt $=25$ — đúng. d) $R=40-10=30 \\ne 20$ — sai.",
    "points": 1,
    "tags": [
      "thống kê",
      "mẫu ghép nhóm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Mẫu ghép nhóm: nhóm $[0;4)$ tần số 3 (giá trị đại diện 2), nhóm $[4;8)$ tần số 5 (giá trị đại diện 6). Xét tính đúng sai:",
    "options": [
      {
        "key": "a",
        "text": "Số trung bình của mẫu là 4,5"
      },
      {
        "key": "b",
        "text": "Phương sai của mẫu là 3,75"
      },
      {
        "key": "c",
        "text": "Độ lệch chuẩn của mẫu khoảng 3,75"
      },
      {
        "key": "d",
        "text": "Độ lệch chuẩn của mẫu khoảng 1,94"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $\\dfrac{3 \\cdot 2+5 \\cdot 6}{8}=4{,}5$ — đúng. b) $\\dfrac{3(2-4{,}5)^2+5(6-4{,}5)^2}{8}=3{,}75$ — đúng. c) Độ lệch chuẩn là $\\sqrt{3{,}75} \\approx 1{,}94$, không phải 3,75 — sai. d) Đúng.",
    "points": 1,
    "tags": [
      "thống kê",
      "độ lệch chuẩn",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $P(A \\cap B)=0{,}12$ và $P(B)=0{,}3$. Tính $P(A \\mid B)$.",
    "answer": "0,4",
    "explanation": "$P(A \\mid B)=\\dfrac{0{,}12}{0{,}3}=0{,}4$.",
    "points": 0.5,
    "tags": [
      "xác suất",
      "có điều kiện",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hộp I có 4 bi đỏ, 1 bi xanh; hộp II có 1 bi đỏ, 4 bi xanh. Chọn ngẫu nhiên một hộp rồi bốc một bi. Tính xác suất bốc được bi đỏ.",
    "answer": "0,5",
    "explanation": "$P=\\dfrac{1}{2} \\cdot \\dfrac{4}{5}+\\dfrac{1}{2} \\cdot \\dfrac{1}{5}=0{,}5$.",
    "points": 0.5,
    "tags": [
      "xác suất",
      "toàn phần",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Quay lại bài toán hai hộp (hộp I: 4 đỏ 1 xanh; hộp II: 1 đỏ 4 xanh, chọn hộp ngẫu nhiên). Biết bi bốc được màu đỏ. Tính xác suất bi đó thuộc hộp I.",
    "answer": "0,8",
    "explanation": "$P(I \\mid \\text{đỏ})=\\dfrac{0{,}5 \\cdot 0{,}8}{0{,}5}=0{,}8$.",
    "points": 0.5,
    "tags": [
      "xác suất",
      "Bayes",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $A$, $B$ độc lập với $P(A)=0{,}5$, $P(B)=0{,}4$. Tính $P(A \\cup B)$.",
    "answer": "0,7",
    "explanation": "$P(A \\cup B)=0{,}5+0{,}4-0{,}5 \\cdot 0{,}4=0{,}7$.",
    "points": 0.5,
    "tags": [
      "xác suất",
      "biến cố độc lập",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Mẫu ghép nhóm có các nhóm $[15;25)$, $[25;35)$, $[35;45)$. Tính khoảng biến thiên của mẫu.",
    "answer": "30",
    "explanation": "$R=45-15=30$.",
    "points": 0.5,
    "tags": [
      "thống kê",
      "khoảng biến thiên",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Mẫu ghép nhóm: nhóm $[0;5)$ tần số 2 (giá trị đại diện 2,5), nhóm $[5;10)$ tần số 6 (giá trị đại diện 7,5). Tính phương sai của mẫu (làm tròn đến hàng phần trăm).",
    "answer": "4,69",
    "explanation": "$\\bar{x}=6{,}25$; $s^2=\\dfrac{2(2{,}5-6{,}25)^2+6(7{,}5-6{,}25)^2}{8}=\\dfrac{37{,}5}{8} \\approx 4{,}69$.",
    "points": 0.5,
    "tags": [
      "thống kê",
      "phương sai ghép nhóm",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-t12-xacsuat-thongke-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một mẫu số liệu có $Q_1=12$ và $Q_3=24$. Tính khoảng tứ phân vị của mẫu.",
    "answer": "12",
    "explanation": "$\\Delta_Q=Q_3-Q_1=12$.",
    "points": 0.5,
    "tags": [
      "thống kê",
      "khoảng tứ phân vị",
      "TH"
    ],
    "variable": false
  }
]
