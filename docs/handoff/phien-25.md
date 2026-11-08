# Phiên 25 (08/11/2026): khung chương trình 12 môn + sửa khung trục đồ thị

## Đã xong (đã push main: f3f84f3, 8131fed)

- Khung chương trình GDPT 2018 đủ 12 môn, lớp 1–12, trong `src/data/khung*.json`. Trạng thái từng môn: bảng D trong `docs/khung-chuong-trinh.md`.
- `src/lib/khungPrompt.ts` nối khung vào prompt AI soạn đề cho mọi môn:
  - đoán môn + lớp + chương/học kỳ ("cuối năm" = HK2), nạp lười đúng file;
  - lớp 6–9 nói rõ Lý/Hoá/Sinh thì lọc theo `mach` của KHTN; "Lịch sử và Địa lí" THCS ghép 2 phân môn;
  - tiểu học dùng Mức 1/2/3 (TT 27); TN&XH, Đạo đức chèn cách đánh giá thay cấu trúc đề.
  - Test: `npx tsx scripts/check-khung.ts`.
- Đã thử trên web thật (đã đăng nhập): Vật lí 7, Tiếng Anh 8 unit 3, Toán 3 đều đúng phạm vi, đáp án đúng. Lỗi "AI soạn đề bị lỗi định dạng" gặp khi mở 3 tab web cùng lúc; mở 1 tab thì hết.
- Bản gốc agent gửi về: `scripts/khung/ban-goc/`. SVG gốc của script cắt icon: `scripts/nguon-icon/`.
- context.md có nguyên tắc số 5: không ghi đường dẫn tuyệt đối ra ngoài dự án.

## Đang dở: công cụ Đồ thị hàm số (`src/lib/plot.ts`, CHƯA commit)

Người dùng phàn nàn: `y = 30` thì khung tự động ra 29–40. Đường 30 dán đáy, số 29 nằm ngay chỗ O, và tỉ lệ hai trục lệch nhau.

Đã sửa (đã xem trên dev server, `tsc` đạt):
1. `autoYRange`: đồ thị xa trục Ox thì khung vẫn chứa gốc O (y = 30 → khung khoảng −2 đến 33). Không ngắt trục.
2. `renderPlotSvg`: miền y quá dài so với miền x thì **mở rộng miền x** (giữ tâm) thay vì kéo giãn riêng trục y. Hai trục cùng đơn vị, cùng bước chia, ô vuông. Ví dụ y = 30 vẽ x ∈ [−15; 15], mỗi vạch 2.
3. Khi người dùng TỰ đặt khung không chứa 0: trục bám mép, có dấu ngắt (2 gạch chéo), bỏ số sát chỗ trục.

Còn phải làm:
- Ô "Khung hình" trong `GraphToolModal.tsx` vẫn ghi x −5 → 5 trong khi hình đã mở rộng ra −15 → 15. Nên cho hiện miền x thật, hoặc báo "đã mở rộng miền x để giữ cùng tỉ lệ".
- Hàm phân thức có tiệm cận ngang lớn, như `(30x+1)/(x−1)`, chỉ thấy một nhánh, đường tiệm cận y = 30 nằm ngoài khung. Cần tìm tiệm cận ngang (giới hạn khi x → ±∞) để đưa vào khung.
- Rà xem chỗ khác có gọi `renderPlotSvg`/`readPlotSpec` mà cần biết miền x đã đổi không (ví dụ đọc lại spec khi sửa hình).
- Xong thì commit.

## Ý tưởng chưa làm: hình vẽ che số liệu (mọi công cụ vẽ)

Đã thống nhất hướng làm với người dùng:
1. Viền trắng quanh chữ trong SVG (`paint-order="stroke" stroke="#fff" stroke-width="3"`). Sửa ở chỗ vẽ chữ dùng chung, mọi công cụ đều được hưởng.
2. Nhãn điểm và số trên cạnh: thử khoảng 8 vị trí quanh điểm neo, chọn chỗ ít đè nhất. Số trên trục tọa độ giữ nguyên vị trí, chỉ dùng cách 1.

## Việc khác còn treo (từ phiên 24)

- Kiểm code trig (4afe5e8), công cụ Bảng ghép nhóm, 600 câu Toán: xem `docs/handoff/phien-24.md`.
- Chất lượng đề AI: đáp án trắc nghiệm hay dồn vào một chữ cái; ma trận tiểu học cho Mức 3 hơi nặng.
- Đề "cuối năm" hiện chỉ lấy chương HK2 làm phạm vi; thực tế thường kiểm tra cả năm.
