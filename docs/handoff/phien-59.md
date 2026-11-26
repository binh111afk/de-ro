# Phiên 59 (26/11/2026) — slide Chuyên nghiệp: bộ vẽ tay, chọn kiểu doodle / tạp chí

Đã gộp `main` và push (`9dd404b`). **Chưa thử trên web thật có đăng nhập, chưa thử luồng chọn kiểu với AI thật.**

**Người dùng sẽ tạo tiếp template: đọc [hướng dẫn thêm bộ slide](../huong-dan-them-bo-slide.md).**

## Đã làm

- 38 bộ Chuyên nghiệp: 8 tạp chí, 6 bộ minh hoạ (cổ điển đỏ kem, dân gian, sổ khoa học, toán ô li, tin học 3D, tâm lý cắt giấy), 24 bộ vẽ tay `*-ve-tay`. Mã: `src/lib/slidePacks.ts`, `slideTheme.ts` (`PRO_THEMES`), ảnh `public/slide-packs/`.
- `65dc5d6`: chữ to hơn (3 ý một hàng, 4 ý 2×2, 5 ý 3+2 qua `gridRows`), dòng nguồn đặt sát đáy, nội dung dừng ở `FLOOR`.
- `90fbd2c`: xuất PPTX gộp ảnh trùng.
- `9dd404b`: **chọn kiểu sau khi duyệt dàn ý** (xem dưới).
- Trước loạt slide (cùng phiên): tô vùng đồ thị bằng bấm, bảng chọn số hàng cột trên bảng vẽ, thời gian biến mất của bút laser (`1910871` … `8acde2a`).
- Script thêm bộ doodle đưa vào `scripts/slide-packs/` (`them-bo.py`, `tach-nen.py`, `xem-thu.html`), đã chạy thử với ảnh giả rồi gỡ.

## Chọn kiểu slide (quyết định đã chốt)

- Thứ tự: yêu cầu → dàn ý → bấm "Tạo N slide" → hỏi "Bạn muốn slide kiểu nào?" → viết slide. Không tốn lượt AI.
- Chỉ hai lựa chọn, **không có ô "Khác…"** (`AiAsk.noCustom`) vì web không xử lý được kiểu lạ. Bỏ qua / hết 2 phút → **doodle**.
- Yêu cầu đã nói "vẽ tay / doodle" hoặc "kiểu tạp chí" thì không hỏi (`proStyleOf`).
- Lúc lập dàn ý AI trả hai bộ: `theme` (không phải tạp chí) và `themeMagazine`; `proPlan` sửa id sai (doodle lạc → `sinh-hoat-lop-ve-tay`), `withProStyle` chốt. Còn `plan.themeMagazine` nghĩa là chưa chọn.
- 6 bộ minh hoạ cũ nằm chung nhóm doodle.
- File: `AiPanel.tsx` (`STYLE_ASK`, `startDeck`, `chooseStyle`), `aiDeck.ts`, `prompts/slideTasks.ts`, `ai/slideFlow.ts`.

Thử không tốn token: trong trình duyệt thay `window.fetch` cho `/api/llm` bằng JSON `{ content }` giả (client nhận cả phản hồi không stream).

## Còn mở (chưa được yêu cầu làm)

- **Nối tiếp** vào bài đã có slide: không hỏi, dùng bộ doodle, giao diện slide cũ có thể đổi theo. Đã báo người dùng.
- AI bịa số liệu / dùng luật cũ trong slide (thử GLM: dẫn NĐ 100 thay vì NĐ 168, số tử vong giao thông sai). Đã đề xuất thêm luật prompt hoặc tìm web, chưa chốt.
- Chủ đề chưa có bộ doodle riêng: chính trị thế giới / thời sự, động vật, Đoàn Đội Đảng, phòng chống ma tuý / bạo lực học đường, đạo đức, giải trí; Toán, Tin học, Tâm lý chưa có bản vẽ tay.
- Bấm vùng trống trên slide chọn trúng ảnh nền giấy đã khoá (đổi nền slide có thể bị che).
- Slide 5 ý chữ dài còn khoảng 24px; bộ tạp chí 5 hàng chữ nhỏ.
