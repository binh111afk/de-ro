# Phiên 47 — PayOS (nạp điểm), màn admin Nạp điểm, Strix 7–8, 4/5 việc chống AI chết cứng

Ngày 18/11/2026. Nhánh `main`, commit cuối `91b6484`. Migration đến `20261206` đã áp.

## Việc phiên sau

- **Trang nạp đang ĐÓNG** (`PRICING_PUBLIC = false` trong `src/lib/pricing.ts`): chỉ admin thấy Bảng giá / nút Nạp điểm / "Mua thêm điểm", server trả 403 khi người khác tạo đơn. Mở cho mọi người = đổi thành `true` (chỉ khi người dùng bảo).
- Người dùng đã nạp thật 2.000đ qua PayOS thành công (đơn 100001, 100008). Chưa thử trên bản deploy: huỷ đơn khi đóng khung, panel chi tiết đơn ở admin, tài khoản thường không thấy nút nạp.
- **Chưa xử lý:** khách chuyển khoản *sau khi* đơn đã huỷ/hết hạn → PayOS không khớp, tiền vẫn vào tài khoản nhưng web không biết. Hiện admin dò sao kê theo `DR<mã đơn>` rồi **Cộng tay** (đơn huỷ/hết hạn vẫn cộng được). Có thể làm: webhook báo tiền cho đơn đã đóng → ghi chú + đưa vào "Cần xem" (cần tra tài liệu PayOS xem link đã huỷ có còn gửi webhook không).
- Việc 5 chống AI chết cứng (model mạnh đỡ ca khó) đã có khung (`DEEPSEEK_STRONG_MODEL`, `STRONG_POINT_FACTOR`) nhưng **chưa đặt env trên Vercel**.
- Treo từ trước, chờ người dùng quyết: đổi model chính sang DeepSeek chính hãng (`DEEPSEEK_API_KEY` trên Vercel) + hạ ước tính đề 20 / slide 30 điểm; ghi chú điều khoản điểm; xoá env cũ trên Vercel (`TAVILY_*`, `MERCURY_*`).
- Vercel: đã xoá deploy cũ, còn 10 bản mới nhất.

## PayOS — cách chạy

- Env (đã có ở `.env` và Vercel): `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`. Webhook đã đặt: `https://de-ro-lac.vercel.app/api/pay?webhook=1`. Hướng dẫn: `docs/payos.md`.
- `server/payment.ts` (`/api/pay`, re-export ở `api/pay.ts`):
  - `POST` tạo đơn: điểm tính ở server từ `app_settings.pricing`; trước đó **tự huỷ đơn chờ cũ** của người đó (mỗi người một đơn chờ). Trả `qrCode` (chuỗi VietQR), số TK, `description` **đúng chuỗi PayOS trả** (PayOS gắn mã riêng phía trước, vd `CS3RWXTFZC6 DR100008`; ngân hàng còn thêm cả đoạn dài vào nội dung — bình thường).
  - `POST ?cancel=<mã>`: huỷ link PayOS rồi `reconcileOrder` (lỡ đã trả → vẫn cộng điểm, trả `paid`).
  - `GET ?order=<mã>`: trạng thái, đơn chờ thì hỏi PayOS. `POST ?webhook=1`: kiểm chữ ký `signData`.
  - Hàm DB `credit_payment_order` (migration `20261205`/`20261206`): cộng một lần, thưởng gói một lần, trả thiếu → giữ `pending` + ghi chú `THIEU …`, không bao giờ ghi `failed` cho đơn đã có tiền.
- Client: `src/pages/PayCheckout.tsx` tự vẽ QR (`qrcode-generator`), đếm ngược 15 phút, hỏi đơn 3 s/lần; đóng khi còn hạn → hộp "Huỷ giao dịch?" rồi gọi `cancelPayment`. Từ `md` khung hai cột (QR 18rem, `2xl` 21rem). Bỏ khung nhúng PayOS (tối theo trình duyệt, giật).
- Ai thấy trang nạp: hook `src/lib/usePricingAccess.ts` (nhớ kết quả theo tài khoản; dùng ở `Layout.tsx`, `Profile.tsx`, `Pricing.tsx`).
- Test: `npm run test:payment` (35 ca, giả PayOS + Supabase).

## Admin › Nạp điểm (`/admin/nap-diem`)

`src/pages/admin/PaymentsPanel.tsx` + `src/lib/adminPaymentsApi.ts` (mock `?mock=1`), server `server/adminPayments.ts` (`payments.list` / `payments.sync` / `payments.credit`, đăng ký trong `server/admin.ts`). Bảng 6 cột, bấm dòng mở ngăn chi tiết (ghi chú đủ, `DR<mã>`, nút **Hỏi PayOS** / **Cộng tay** — cộng tay bắt ghi mã giao dịch, ghi `admin_audit` `payments.credit`). Lọc **Cần xem** = chờ quá 20 phút hoặc trả thiếu.

## Đã làm khác

| Commit | Nội dung |
|---|---|
| `4e1de22`, `a1eca99` | AI: 👍/👎 + tín hiệu bực (hoàn tác, gửi lại, "sai rồi") vào `ai_feedback`; AI thấy nguyên văn câu được nhắc; sửa bằng patch; lời giáo viên thắng quy ước; kết quả hỏng hiện trong chat + Thử lại (model mạnh) |
| `64c173a`, `1bcc719` | Nhật ký suy nghĩ thật ở mọi lượt soạn đề, trợ lý giấy thay vòng xoay, thời gian có phút/giờ |
| `966ce27`, `542c767` | Logo mail đọc được ở chế độ tối (đã dán vào Supabase dashboard) |
| `4e2fde8`, `36d2745` | Vá Strix 7–8: hạn mức báo cáo, khoá sửa đề đang bị báo cáo, trần bài nộp mỗi đề, chỉ máy dev chọn model, kẹp temperature; **gỡ Tavily** (`/api/search`) — tìm web đi qua DeepSeek |
| `18954dc` | Nhãn Beta + cảnh báo thử nghiệm cho Tạo đề online |
| `d705ef7`, `3dc2c4c`, `a354307` | Thẻ gói Bảng giá gọn; admin sửa bảng giá (`app_settings.pricing`) |
| `0350b6b` → `91b6484` | PayOS + admin Nạp điểm (mục trên) |
