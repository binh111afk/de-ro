# Prompt giao agent: admin chạy tốt trên điện thoại + thu theo ngày / tuần / tháng

> Đọc `AGENTS.md` và `context.md` trước. Hai việc, mỗi việc một commit riêng.

## Nhánh

- Từ `main`: `git switch main && git switch -c feat/admin-mobile-thu`. Không commit lên `main`, không push, không gộp. Có thay đổi chưa commit mà không phải của mình trong thư mục này thì **dừng và hỏi** (không `git checkout`/`stash` đè lên).
- File CRLF: sửa bằng công cụ sửa file, không `sed -i` / Python ghi text. Sau mỗi file: `git ls-files --eol <file>` (cột `i/` và `w/` giống nhau), `git diff --stat`.
- Không thêm thư viện. Dùng lại component có sẵn (`Segmented`, `SiteSelect`, `Pager`, `Button`, `Badge`…, xem AGENTS.md mục 4). **Không thêm chữ thừa trên UI.**

## Việc 1. Sửa responsive trang Admin trên điện thoại

Lỗi người dùng báo: panel mở ra khi bấm vào một người dùng (`src/pages/admin/UsersPanel.tsx`) **bị tràn ngang** ở khối Segmented, và khu **Cộng điểm / Nạp điểm** (`PaymentsPanel.tsx` + modal cộng điểm trong `UsersPanel.tsx`) có Segmented nhìn xấu. Rà **tất cả tab admin**: `OverviewPanel`, `UsersPanel`, `PaymentsPanel`, `StatsPanel`, `OpsPanel`, `ContentPanel`, `BankPanel`, `AuditPanel`, `PricingEditor`, `AnnouncementsEditor`, `AdminLayout` (thanh điều hướng).

Cách làm:
1. Chạy dev `npm run dev -- --port 5184 --host 127.0.0.1` (bật dữ liệu giả: `VITE_ADMIN_MOCK=1` hoặc `?mock=1`, xem `src/lib/adminMock.ts`), mở từng tab ở bề rộng **360, 390, 768 px** (công cụ trình duyệt `resize_window` hoặc tương đương). Mở cả drawer người dùng và các modal.
2. Với mỗi tab ghi lỗi thấy: tràn ngang (thanh cuộn ngang của trang), chữ bị cắt, nút chồng nhau, bảng không cuộn được, Segmented quá dài, drawer rộng hơn màn hình.
3. Sửa tận gốc bằng Tailwind: `min-w-0`, `flex-wrap`, `overflow-x-auto` cho bảng / Segmented dài, drawer `w-full max-w-…`, bảng chuyển sang dạng thẻ hoặc cuộn ngang. Không đổi chức năng. Segmented quá nhiều lựa chọn trên mobile thì cho cuộn ngang trong chính khối đó, hoặc xếp 2 hàng, nhưng đẹp và đều.
4. Chụp lại (hoặc đo `document.documentElement.scrollWidth <= window.innerWidth`) sau khi sửa ở 360 px cho **từng tab**; báo cáo ghi tab nào đã sạch, tab nào còn.

## Việc 2. Tab Nạp điểm: thu theo ngày / tuần / tháng

Hiện `PaymentsPanel.tsx` có "Thu tháng này", "Tổng đã thu", "Số đơn đã trả" (`data.revenue.month|all|paidCount`, tính ở `server/payment.ts` / `server/admin*.ts`, tìm bằng `grep -rn "revenue" server src`). Cần:
- Thêm **Segmented** chuyển nhanh: **Hôm nay · Tuần này · Tháng này · Tất cả**; ô "Thu" đổi theo lựa chọn, kèm số đơn đã trả trong khoảng đó.
- Mốc thời gian theo **giờ Việt Nam (UTC+7)**: hôm nay = từ 0h hôm nay; tuần này = từ 0h **thứ Hai**; tháng này = từ 0h ngày 1. Chỉ đếm đơn `status = 'paid'`, cộng đúng số tiền thật đã trả (xem `20261206_payment_amount.sql`).
- Tính ở **server** (một lần gọi, trả đủ `day`, `week`, `month`, `all` + số đơn mỗi khoảng) để client không phải tải hết đơn. Không cần migration nếu truy vấn được bằng REST (`created_at` / `paid_at` + `status=eq.paid`); nếu phải thêm hàm SQL thì viết file migration mới trong `supabase/migrations/` nhưng **không áp**, báo người dùng.
- Cập nhật dữ liệu giả trong `src/lib/adminMock.ts` / mock tương ứng cho đủ trường mới, và `scripts/test-admin*.ts` nếu test kiểm hình dạng phản hồi.

## Điều cấm

- Đổi logic nạp điểm / webhook PayOS / cộng điểm, đổi quyền admin, sửa `server/aiQuota.ts`, `server/llmProxy.ts`, `server/ops.ts` (phần tính chi phí AI người khác đang sửa).
- Thêm thư viện, thêm chữ giải thích thừa, push, gộp vào `main`, áp migration, gọi API sản xuất.

## Cách kiểm

```powershell
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.node.json --noEmit   # chỉ lỗi cũ JsonWebKey ở server/guard.ts là chấp nhận được
npm run test:admin
npm run test:admin-content
npm run test:admin-stats
npm run test:payment
git ls-files --eol <file đã sửa>
git diff --stat main
```

## Mẫu báo cáo (`docs/bao-cao-admin-mobile-thu.md`, chưa commit; tóm 6 dòng trong tin nhắn)

```
Nhánh: feat/admin-mobile-thu (commit …)
Việc 1: từng tab (Tổng quan, Người dùng, Nạp điểm, Số liệu, Vận hành, Nội dung, Ngân hàng, Nhật ký, Bảng giá, Thông báo, thanh điều hướng): lỗi đã thấy → đã sửa gì; 360px còn tràn ở: không / …
Việc 2: Segmented + server (file); mốc tuần / ngày đúng giờ VN: đã kiểm bằng …
Test: tsc app ✓/✗, tsc node ✓/✗, test:admin ✓/✗, admin-content ✓/✗, admin-stats ✓/✗, payment ✓/✗
Migration mới: không / có (tên, chưa áp)
Chưa kiểm được: …
```
