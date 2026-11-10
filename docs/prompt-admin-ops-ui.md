# Prompt: giao diện mục "AI & Server" của trang Admin (giai đoạn 2)

> Đưa nguyên file này cho agent (Antigravity CLI). Làm trên **nhánh riêng** `feat/admin-ops-ui`, không đụng `main`, không merge, không push.

---

## Bối cảnh

Dự án: web soạn đề thi tiếng Việt (React 19 + TypeScript + Vite 6 + Tailwind v4). Đọc `context.md` phần đầu trước.

Trang `/admin` đã có giao diện giai đoạn 1 (`src/pages/admin/AdminLayout.tsx`, `UsersPanel.tsx`, `AuditPanel.tsx`, `OverviewPanel.tsx`). Phần logic giai đoạn 2 đã xong. Việc của bạn **chỉ là giao diện** mục **AI & Server** (`/admin/ai`), hiện đang là thẻ "Sắp có".

Các hàm có sẵn trong `src/lib/adminApi.ts`. **Chỉ gọi các hàm này**, không tự `fetch`:

| Hàm | Trả về | Ghi chú |
|---|---|---|
| `getSettings()` | `AppSettings` = `{ maintenance: {on, message?, until?}, banner: {on, text?, level?: 'info' \| 'warn'} }` | |
| `setMaintenance(v)` | `{ok}` | bật/tắt bảo trì |
| `setBanner(v)` | `{ok}` | dải thông báo; bật thì `text` không được trống |
| `getAiStats(days)` | `{ days, rows: AiStatRow[] }` | mỗi dòng = 1 ngày × 1 model: `day, model, provider, calls, errors, tokens, cost (USD, có thể null), avgMs` |
| `getAiErrors(limit)` | `{ items: AiErrorRow[] }` | lỗi gần nhất: `model, provider, error, ms, createdAt, userId` |
| `runHealth()` | `HealthReport` = `{ checkedAt, supabase, r2, providers[] }` | mỗi mục `{ok, ms, error?}`, provider có thêm `provider, model`. **Tốn tiền, có thể mất ~30 giây** |

Xem bằng dữ liệu giả: `http://127.0.0.1:5184/admin/ai?mock=1` (chạy `npm run dev -- --port 5184 --host 127.0.0.1`). Không cần đăng nhập.

## Yêu cầu

Tạo `src/pages/admin/OpsPanel.tsx`, gắn vào route `ai` trong `AdminLayout.tsx` thay cho `<ComingSoon … title="AI & Server">`. Chia 4 khối (thẻ `Card`) từ trên xuống:

### 1. Bảo trì và thông báo
- **Chế độ bảo trì**: công tắc Bật/Tắt, ô "Lời nhắn cho người dùng" (textarea, tối đa 500 ký tự), ô "Dự kiến xong lúc" (`<input type="datetime-local">`, đổi sang ISO khi gửi, bỏ trống được), nút Lưu.
  - **Bật** bảo trì phải hỏi `dialog.confirm` (`src/components/Dialog`, `danger: true`): "Người dùng thường sẽ không vào được app và không gọi được AI. Admin vẫn dùng bình thường."
  - Đang bật thì hiện `Badge tone="clay"` "Đang bảo trì" cạnh tiêu đề.
- **Dải thông báo**: công tắc, ô nội dung (tối đa 300 ký tự), chọn mức `Segmented` (`src/components/Segmented`): Thông tin / Cảnh báo, nút Lưu. Có ô xem trước dải thông báo ngay dưới form.

### 2. Tình trạng server
- Nút **Kiểm tra ngay** gọi `runHealth()`. Trong lúc chạy: nút tắt, có `Spinner` và dòng "Đang gọi thử từng dịch vụ, có thể mất tới 30 giây…".
- Kết quả là danh sách: Supabase, R2, rồi từng provider (`provider · model`). Mỗi dòng có chấm xanh/đỏ, độ trễ (`ms` → "0,8 s" nếu ≥ 1000), lỗi nếu có. Ghi "Kiểm tra lúc HH:mm".
- **Không** tự chạy khi mở trang (tốn tiền). Chưa bấm thì hiện dòng hướng dẫn.

### 3. Thống kê AI
- Chọn khoảng: `Segmented` 7 ngày / 30 ngày (gọi `getAiStats(7 | 30)`).
- 4 ô số trên cùng: Tổng lượt gọi, Tỉ lệ lỗi (%), Tổng token, Chi phí (USD, chỉ cộng các dòng có `cost`; nếu không dòng nào có thì "Chưa có giá").
- Biểu đồ cột **lượt gọi theo ngày** (cột chồng: thành công / lỗi). Tự vẽ bằng `div` hoặc SVG, **không thêm thư viện**. Ngày cũ bên trái.
- Bảng **theo model**: Model, Provider, Lượt gọi, Lỗi, Token, Chi phí, Độ trễ TB. Gộp các ngày lại, xếp theo lượt gọi giảm dần.

### 4. Lỗi gần đây
- `getAiErrors(30)`: bảng Thời gian (`formatViDateTime` trong `adminUtils.ts`), Model, Provider, Lỗi (cắt 1 dòng, hover hiện đủ), Thời gian chờ.
- Không có lỗi thì hiện `EmptyState` "Chưa có lỗi nào".

### Chung
- Lỗi gọi API (`AdminError`) thì hiện bằng `dialog.alert(err.message)`. Lưu xong thì hiện thông báo ngắn như `UsersPanel`.
- Dùng component và màu sẵn có (`@/components/ui`: `Card`, `Button`, `Badge`, `EmptyState`, `Spinner`, `inputClass`; màu `ink`, `clay`, `sage`, `honey`, `line`, `sunken`). Xem `UsersPanel.tsx` để giữ cùng phong cách.
- Màn 360px không được cuộn ngang trang (bảng thì cuộn trong khung riêng). Kiểm tra cả 1440px.
- Trên Tổng quan (`OverviewPanel.tsx`): đổi thẻ "AI & Máy chủ" từ "Sắp có" thành số **lượt gọi AI 7 ngày** (từ `getAiStats(7)`) kèm link sang `/admin/ai`.

## Không được làm
- Không sửa `server/`, `api/`, `supabase/`, `vite.config.ts`, `vercel.json`, `src/lib/adminApi.ts`, `src/components/SiteStatus.tsx`.
- Không thêm thư viện npm. Không commit vào `main`.

## Xong thì
1. `npx tsc -p tsconfig.app.json --noEmit` phải sạch.
2. Commit vào nhánh `feat/admin-ops-ui`.
3. Báo lại: danh sách file đã tạo/sửa, những gì chưa làm được. **Không cần tự chụp màn hình** (người review sẽ tự xem).
