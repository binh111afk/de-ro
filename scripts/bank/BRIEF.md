# Soạn câu hỏi cho ngân hàng đề Toán (THPT, định dạng thi tốt nghiệp 2025)

Bạn soạn câu hỏi MỚI, TỰ VIẾT (không chép nguyên văn đề nào), độ khó và phong cách tương đương đề thi thử / kiểm tra của các trường THPT Việt Nam năm 2026. Đề thật hiện nay:
- Nhiều bài thực tế dài 3–6 dòng (drone, máy bay trong Oxyz; tối ưu giá bán – doanh thu; lãi suất, trả góp; nồng độ thuốc $C(t)=\frac{15t}{t^2+9}$; mô hình $N(t)=\frac{at+b}{ct+d}$; biển quảng cáo cắt bởi parabol; khối tròn xoay ghép; xác suất có điều kiện hai hộp bi; xếp chỗ có ràng buộc…). Học sinh phải tự đặt ẩn, tự lập mô hình.
- Câu đúng/sai: một đoạn dẫn + 4 ý a, b, c, d; ý a, b dễ (nhận biết/thông hiểu), ý c vận dụng, ý d vận dụng/vận dụng cao.
- Câu trả lời ngắn: đáp án là MỘT SỐ tối đa 4 ký tự kể cả dấu âm và dấu phẩy (vd `12`, `-3,5`, `0,25`, `1,73`); đề phải nói rõ làm tròn đến đâu nếu kết quả không nguyên.

## Đầu ra
Ghi DUY NHẤT một file JSON (mảng) vào đường dẫn được giao. Mỗi phần tử:

```json
{
  "grades": ["Lớp 12"],
  "type": "trac-nghiem" | "dung-sai" | "tra-loi-ngan" | "tu-luan",
  "level": "NB" | "TH" | "VD" | "VDC",
  "prompt": "Đề bài, công thức LaTeX trong $...$",
  "options": [{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."}],
  "answer": "B",
  "explanation": "Lời giải ngắn gọn nhưng đủ các bước chính",
  "tags": ["chủ đề", "dạng"],
  "figure": { ... }   // tuỳ chọn
}
```

- `trac-nghiem`: đúng 4 phương án key A–D, `answer` là một chữ cái; phân bố đáp án đúng đều giữa A, B, C, D; phương án nhiễu là lỗi sai thường gặp.
- `dung-sai`: `options` là 4 ý key `a`,`b`,`c`,`d` (chữ thường, text không ghi sẵn "a)"); `answer` là chuỗi 4 ký tự Đ/S, vd `"ĐSĐS"`; `explanation` giải từng ý.
- `tra-loi-ngan`: KHÔNG có `options`; `answer` là con số dạng chuỗi, dấu thập phân là dấu phẩy.
- Trong JSON, dấu `\` của LaTeX phải viết đôi: `"$\\frac{1}{2}$"`.

## Hình vẽ (`figure`)
Khoảng 30% số câu có hình, nhất là câu đọc đồ thị / bảng biến thiên / hình không gian / biểu đồ. Khi có figure thì đề bài nói "như hình bên dưới". Hình phải khớp số liệu và KHÔNG lộ đáp án. Chỉ dùng các loại sau (đúng tên field):
1) `{"kind":"graph","curves":["x^3-3x"],"xMin":-3,"xMax":3}`
2) `{"kind":"vartable","expr":"x^3-3x+1","fname":"y"}`
3) `{"kind":"signtable","expr":"(x-1)(x+2)/(x-3)"}`
4) `{"kind":"oxy","xMin":-1,"xMax":5,"yMin":-1,"yMax":5,"items":"A(1; 2)\nd: 2x - y + 1 = 0\n(P): y = x^2 - 2x"}`
5) `{"kind":"geo3d","shape":"pyramid3|pyramid3-sa|pyramid3-regular|pyramid4|pyramid4-sa|pyramid4-regular|tetrahedron|prism3|box|cube|cone|cylinder|sphere","names":["S","A","B","C","D"],"height":true,"diagonals":false}`
6) `{"kind":"scene","text":"A(0; 0) B(4; 0) C(0; 3)\nAB, BC, CA\nvuông BAC\nkích thước AB \"4 m\""}` — hình thực tế nét đơn.
7) `{"kind":"stats","chart":"bar|line|pie|hist|table","title":"","xLabel":"","yLabel":"","data":"[40; 50) [50; 60) [60; 70)\nSố học sinh: 5; 12; 8"}` (dòng 1 nhãn cách nhau bởi khoảng trắng hoặc ;)
8) `{"kind":"probtree","text":"Hộp I: 0,5\n  Xanh: 0,6\n  Đỏ: 0,4\nHộp II: 0,5\n  Xanh: 0,3\n  Đỏ: 0,7"}`
Biểu thức dùng biến x, ^, sqrt(), ln, sin, cos.

## Bắt buộc
- TỰ KIỂM TRA mọi đáp án bằng tính toán thật: chạy `node -e "..."` hoặc `python -c "..."` cho các câu có số liệu. Câu nào không chắc đúng thì sửa số liệu hoặc bỏ.
- Tiếng Việt chuẩn, số liệu nhất quán, không trùng ý giữa các câu.
- Sau khi ghi file, chạy `node -e "const a=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));console.log(a.length)" <đường_dẫn>` để chắc JSON hợp lệ.
- Trả lời cuối cùng chỉ một dòng: số câu đã ghi theo từng loại.
