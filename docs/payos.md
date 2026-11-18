# Gắn PayOS (nạp điểm AI)

Code đã sẵn (`server/payment.ts`, `api/pay.ts`, `src/lib/payClient.ts`, trang `/bang-gia`). Chưa có key thì nút "Thanh toán" báo "Thanh toán chưa mở".

## Luồng

1. Người dùng chọn gói ở `/bang-gia`, bấm **Thanh toán** → `POST /api/pay {vnd}`.
2. Server đọc bảng giá đã lưu (`app_settings.pricing`), **tự tính số điểm** (gói + thưởng lần đầu), ghi một dòng `payment_orders` (`pending`), gọi PayOS `POST /v2/payment-requests` (chữ ký HMAC-SHA256 trên `amount, cancelUrl, description, orderCode, returnUrl`), trả `checkoutUrl`.
3. Trang mở khung thanh toán **tự vẽ** (`src/pages/PayCheckout.tsx`): mã QR vẽ từ chuỗi VietQR PayOS trả (thư viện `qrcode-generator`), ngân hàng, số tài khoản, số tiền, nội dung (nút chép), đếm ngược 15 phút, hỏi trạng thái đơn mỗi 3 giây. Nội dung chuyển khoản lấy đúng chuỗi PayOS trả (PayOS gắn thêm mã riêng, vd `CS9BSJTYZW1 DR100001`). Không dùng khung nhúng của PayOS: tải chậm và bị trình duyệt ép tối.
4. Trả xong, PayOS gọi **webhook** `POST /api/pay?webhook=1`. Server kiểm chữ ký `data` bằng `PAYOS_CHECKSUM_KEY`, rồi gọi hàm DB `credit_payment_order` (khoá dòng đơn, kiểm số tiền khớp, cộng `ai_credits` + ghi `ai_credit_events` kind `topup`). Gọi lại bao nhiêu lần cũng chỉ cộng một lần.
5. Trả xong (hoặc đóng khung, hoặc quay về `/bang-gia?order=<mã>` khi link mở ở tab khác), trang hỏi `GET /api/pay?order=` vài lần; đơn còn chờ thì server **hỏi thẳng PayOS** — lỡ webhook vẫn cộng được điểm.
6. Số tiền: cổng không báo số tiền → bỏ qua (đơn giữ nguyên, lần sau xử lý); trả thiếu (`UNDERPAID`) → đơn vẫn `pending`, `reference` ghi `THIEU <đã trả>/<số đơn>` để đối soát tay; trả đủ hoặc dư → cộng điểm. Hàm DB không bao giờ ghi `failed` cho đơn đã có tiền (Strix `dethinhbien_ce3e`).

Thưởng lần đầu mỗi gói: tính lúc tạo đơn; nếu hai đơn cùng gói mở song song thì đơn trả sau chỉ được điểm gốc (kiểm lại trong `credit_payment_order`).

## Việc cần làm khi gắn

1. Đăng ký https://my.payos.vn, liên kết tài khoản ngân hàng, tạo **Kênh thanh toán** → lấy `Client ID`, `API Key`, `Checksum Key`.
2. Áp migration `20261205_payment_orders.sql` (bảng + hàm) và `20261206_payment_amount.sql` (bản sửa xử lý số tiền).
3. Vercel → Settings → Environment Variables (Production + Preview): `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`. Tuỳ chọn `PUBLIC_SITE_URL` (mặc định `https://dero.id.vn`, chỉ dùng khi request không có Origin). Redeploy.
4. Trong kênh thanh toán trên my.payos.vn, đặt **Webhook URL** = `https://dero.id.vn/api/pay?webhook=1` (hoặc tên miền Vercel). PayOS gửi dữ liệu mẫu để kiểm — server trả 200.
5. Thử bằng tài khoản admin (trang vẫn chỉ admin xem): nạp gói 2.000đ, kiểm điểm cộng ở Hồ sơ (dòng "Nạp điểm"), bảng `payment_orders` có `status = paid`.
6. Ổn rồi thì đặt `PRICING_PUBLIC = true` trong `src/lib/pricing.ts` để mở trang cho mọi người.

## Kiểm

- `npm run test:payment` — Supabase + PayOS giả: điểm tính ở server, chữ ký tạo link, webhook chữ ký sai / sửa số tiền bị từ chối, gửi lại không cộng hai lần, thưởng gói chỉ một lần, tra đơn lỡ webhook, người khác không xem được đơn.
- Hàm `credit_payment_order` đã chạy thử trên DB thật trong giao dịch rồi rollback (cộng một lần, gửi lại `already`, đơn thứ hai cùng gói chỉ điểm gốc).

## Chưa làm

- Phí PayOS + thuế chưa tính vào giá (xem phiên 46 mục Giá).
- Admin chưa có màn xem / hoàn tiền đơn nạp (xem thẳng bảng `payment_orders` trên Supabase).
- Nội dung chuyển khoản `DR<mã đơn>` (tài khoản không liên kết qua PayOS chỉ nhận ≤ 9 ký tự).
