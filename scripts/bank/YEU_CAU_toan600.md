# Soạn 600 câu Toán mới cho ngân hàng đề (lớp 10, 11, 12 — mỗi lớp 200 câu)

Đọc kỹ trước khi làm: `scripts/bank/BRIEF.md` (định dạng chung, Toán). Mọi quy tắc ở đó bắt buộc, cộng thêm các điểm dưới đây.

## Nhánh git
- Làm trên **nhánh hiện tại** (`feat/trig-7-tinh-nang`), không tạo nhánh mới, không chuyển nhánh.
- Chỉ thêm file mới trong `scripts/bank/toan600/`. Không sửa file nào khác của dự án (không sửa `src/`, không gộp vào `bankThpt*.ts` — Claude sẽ kiểm rồi gộp sau).
- Làm xong: commit riêng các file trong `scripts/bank/toan600/` (+ file này) với thông điệp `chore(bank): soạn 600 câu Toán 10–12 (chưa kiểm)`, rồi `git push`. Không merge vào `main`.

## Cách làm
- Làm lần lượt từng lô trong bảng. Mỗi lô ghi ra **một file JSON riêng** trong `scripts/bank/toan600/` với đúng tên file đã cho. Lô nào đã có file thì bỏ qua (để chạy lại được khi bị ngắt).
- Làm xong một lô thì kiểm JSON hợp lệ bằng lệnh `node -e` cuối BRIEF.md, rồi mới làm lô tiếp.
- **Field `grades` bắt buộc đúng lớp của lô**: `["Lớp 10"]`, `["Lớp 11"]` hoặc `["Lớp 12"]`. Thiếu field này thì câu bị gán nhầm Lớp 12.
- Không ghi `subject` (Toán là mặc định).
- Mỗi câu có `level` (NB/TH/VD/VDC). Trong mỗi lô: khoảng 40% NB+TH, 40% VD, 20% VDC.
- Dạng câu theo định dạng thi 2025: TN = trắc nghiệm A–D, ĐS = đúng/sai 4 ý, TLN = trả lời ngắn (đáp án số ≤ 4 ký tự, dấu phẩy thập phân). Mỗi lô 25 câu = **12 TN / 6 ĐS / 7 TLN**.
- Bám chương trình GDPT 2018 (sách Kết nối tri thức / Chân trời sáng tạo / Cánh diều). Ưu tiên bài toán thực tế ở mức VD/VDC (như đề tốt nghiệp 2025).
- Tự giải lại mọi câu tính số bằng `node -e` hoặc `python -c`. Câu ĐS: kiểm **từng ý** khớp với đáp án (đây là lỗi hay mắc nhất). Không chắc đúng thì sửa hoặc bỏ câu.
- Không trùng ý giữa các câu, kể cả giữa các lô, và tránh trùng câu đã có trong `scripts/bank/*.json`, `scripts/bank/new/*.json`.
- Đề không thiếu dữ kiện, chỉ có đúng một đáp án hợp lệ; phương án nhiễu hợp lý (sai lầm hay gặp), không lặp phương án.

## Hình vẽ — bổ sung cho BRIEF
Khoảng 30% số câu có hình. Ngoài các loại trong BRIEF, được dùng thêm (đúng tên field):

- **Đặt tên điểm trên đồ thị**: thêm `"points"` vào `graph`, mỗi dòng một điểm, thêm `chiếu` để kẻ nét đứt xuống trục:
  `{"kind":"graph","curves":["x^3-3x^2"],"xMin":-1,"xMax":4,"yMin":-5,"yMax":2,"points":"M(0; 0)\nN(2; -4) chiếu"}`
- **Hình học phẳng**: `{"kind":"geo2d","shape":"triangle|right-triangle|isosceles|equilateral|square|rectangle|parallelogram|trapezoid|rhombus|circle|inscribed-triangle","names":["A","B","C"],"altitude":false,"median":false,"diagonals":false,"circumcircle":false,"extras":"…"}`
- **Dựng thêm điểm/đoạn** cho `geo2d` và `geo3d` (không dùng cho nón, trụ, cầu) qua field `"extras"`, mỗi dòng một lệnh:
  `M = trung điểm SC`, `N = SB 1/3`, `O = AC cắt BD`, `H = hình chiếu S lên (ABCD)`, `K = hình chiếu A lên SB`, `G = trọng tâm ABC`, `O = tâm ngoại tiếp ABC`, `đường cao AH`, `trung tuyến AM`, `MN` (nối), `đứt MN` (nối nét đứt).
- **Mặt cầu ngoại tiếp** khối hộp/lập phương/chóp đều: thêm `"circumsphere": true` vào `geo3d`, kết hợp `"extras":"I = trung điểm AC'"` để hiện tâm.
- **Đường tròn lượng giác** (lớp 10–11): `{"kind":"trig","angles":"…","projections":true,"tan":false,"cot":false,"values":false}`, mỗi dòng một lệnh:
  - góc `pi/3`, `-2pi/3`, `150°`; họ nghiệm `pi/4 + kpi/2`; đặt tên `M: pi/3`; điểm theo toạ độ `M(1/2; √3/2)`
  - tô cung nghiệm `tô: [pi/6 → 5pi/6)`; đường thẳng `y = 1/2`, `x = -√2/2`
  - nối thành đa giác `nối: M N P` hoặc `nối tô: họ`; cung giữa hai điểm `cung: M N "α"`
  - `"values": true` ghi giá trị cos, sin trên trục; `"cot": true` vẽ trục cot.
  Xem bảng trợ giúp trong `src/examEditor/tools/MoreToolModals.tsx` (`TRIG_HELP`) nếu cần cú pháp chính xác.

**Quy tắc bắt buộc về điểm:** đề gọi tên điểm nào (M, N, I, O, G, H…) thì điểm đó **phải hiện trên hình** (qua `points`, `extras`, `M: góc`, `names`…). Không được để đề nói "điểm M như hình" mà hình không có M. Trừ khi điểm đó chính là thứ cần tìm và vẽ ra sẽ lộ đáp án.

Hình khớp số liệu, không lộ đáp án; đồ thị dùng `yMin`/`yMax` để không tràn khung.

## Các lô (tổng 600 câu = 24 lô × 25 câu)

### Lớp 10 (200 câu, `"grades": ["Lớp 10"]`)

| File | Số câu | Nội dung | Gợi ý hình |
|---|---|---|---|
| t10-taphop.json | 25 | Mệnh đề, tập hợp, các phép toán tập hợp, bài toán đếm phần tử thực tế | `{"kind":"venn","sets":"A, B","shade":"A ∩ B","counts":"A: 5\nAB: 3\nB: 4"}` |
| t10-bpt.json | 25 | Bất phương trình, hệ bất phương trình bậc nhất hai ẩn, miền nghiệm, bài toán tối ưu sản xuất | `oxy` (miền nghiệm `x + y <= 4`) |
| t10-hambac2.json | 25 | Hàm số, hàm bậc hai, đồ thị parabol, dấu tam thức bậc hai, BPT bậc hai, PT quy về bậc hai | `graph` có `points` (đỉnh), `signtable` |
| t10-hethuc.json | 25 | Giá trị lượng giác góc 0°–180°, định lí sin, côsin, diện tích tam giác, giải tam giác thực tế (đo khoảng cách, chiều cao) | `geo2d` + `extras`, `scene` |
| t10-vecto.json | 25 | Vectơ, tổng hiệu, tích vectơ với số, tích vô hướng, ứng dụng lực/vật lí | `geo2d` + `extras` (trung điểm, trọng tâm) |
| t10-oxy.json | 25 | Toạ độ trong mặt phẳng, phương trình đường thẳng, khoảng cách, góc, đường tròn, ba đường conic | `oxy` |
| t10-tohop.json | 25 | Quy tắc cộng, nhân, hoán vị, chỉnh hợp, tổ hợp, nhị thức Newton (n ≤ 5) | `probtree` cho đếm theo nhánh |
| t10-xacsuat-thongke.json | 25 | Xác suất cổ điển; thống kê: số trung bình, trung vị, tứ phân vị, mốt, khoảng biến thiên, phương sai, độ lệch chuẩn (mẫu không ghép nhóm) | `stats` |

### Lớp 11 (200 câu, `"grades": ["Lớp 11"]`)

| File | Số câu | Nội dung | Gợi ý hình |
|---|---|---|---|
| t11-luonggiac.json | 25 | Góc lượng giác, giá trị lượng giác, công thức lượng giác, hàm số lượng giác và đồ thị | `trig` (đặt tên điểm, `values`), `graph` |
| t11-ptlg.json | 25 | Phương trình lượng giác cơ bản, số nghiệm trên khoảng, bài toán thực tế dao động/chuyển động tròn | `trig` (`y = a`, `tô:`, `nối: họ`) |
| t11-dayso.json | 25 | Dãy số, cấp số cộng, cấp số nhân, bài toán lãi suất, tăng trưởng | thường không hình; `stats` line nếu hợp |
| t11-gioihan.json | 25 | Giới hạn dãy số, giới hạn hàm số, hàm số liên tục, cấp số nhân lùi vô hạn | `graph` (đọc giới hạn từ đồ thị) |
| t11-mulog.json | 25 | Lũy thừa, mũ, logarit, hàm mũ–logarit, PT/BPT mũ–logarit, bài toán thực tế (pH, động đất, phóng xạ, lãi kép) | `graph` |
| t11-daoham.json | 25 | Định nghĩa, quy tắc tính đạo hàm, đạo hàm cấp hai, tiếp tuyến, ý nghĩa vận tốc/gia tốc | `graph` có `points` (tiếp điểm) |
| t11-songsong.json | 25 | Đường thẳng–mặt phẳng trong không gian, quan hệ song song, giao tuyến, thiết diện, phép chiếu song song | `geo3d` + `extras` (giao điểm, trung điểm) |
| t11-vuonggoc-xs.json | 25 | Quan hệ vuông góc, góc, khoảng cách, thể tích (15 câu); xác suất: biến cố hợp/giao, quy tắc cộng–nhân xác suất, mẫu số liệu ghép nhóm (10 câu) | `geo3d` + `extras` (hình chiếu), `probtree`, `stats` hist |

### Lớp 12 (200 câu, `"grades": ["Lớp 12"]`)

| File | Số câu | Nội dung | Gợi ý hình |
|---|---|---|---|
| t12-dondieu.json | 25 | Tính đơn điệu, cực trị, đọc BBT/đồ thị f'(x) | `vartable`, `graph` có `points` |
| t12-gtln-tiemcan.json | 25 | GTLN–GTNN, tiệm cận, khảo sát hàm bậc ba, bậc bốn trùng phương, phân thức | `graph`, `vartable` |
| t12-toiuu.json | 25 | Bài toán tối ưu thực tế (chi phí, doanh thu, thể tích hộp, quãng đường), ứng dụng đạo hàm trong kinh tế–vật lí | `scene` |
| t12-nguyenham.json | 25 | Nguyên hàm, tích phân, tính chất, đổi biến/từng phần đơn giản (chương trình mới) | không hình hoặc `graph` |
| t12-ungdungtp.json | 25 | Diện tích hình phẳng, thể tích khối tròn xoay, bài toán quãng đường–vận tốc, thực tế (cổng parabol, bồn nước) | `graph` có `points`, `scene` |
| t12-oxyz.json | 25 | Vectơ và toạ độ trong không gian, phương trình mặt phẳng, đường thẳng, góc, khoảng cách | `geo3d` + `extras` |
| t12-matcau.json | 25 | Mặt cầu, vị trí tương đối, bài toán thực tế (drone, ra-đa, ánh sáng, vệ tinh) | `geo3d` có `circumsphere`/`sphere` |
| t12-xacsuat-thongke.json | 25 | Xác suất có điều kiện, công thức xác suất toàn phần, Bayes (15 câu); khoảng biến thiên, khoảng tứ phân vị, phương sai, độ lệch chuẩn mẫu ghép nhóm (10 câu) | `probtree`, `stats` hist |

Tổng: 8 + 8 + 8 = 24 lô × 25 = 600 câu.

## Khi xong
Trả lời một dòng cho mỗi file: tên file, số câu, số câu có hình, số câu theo level (NB/TH/VD/VDC). Cuối cùng ghi tên commit đã push.
