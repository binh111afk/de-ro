# Prompt: dựng giao diện trang Admin (giai đoạn 1)

> Đưa nguyên file này cho agent (Antigravity CLI). Agent làm trên **nhánh riêng** `feat/admin-ui` (hoặc worktree), không đụng `main`.

---

## Bối cảnh

Dự án: web soạn đề thi tiếng Việt (React 19 + TypeScript + Vite 6 + Tailwind v4). Đọc `context.md` (phần đầu, "Nguyên tắc", "Bản đồ nhanh") trước.

Trang `/admin` đã có sẵn phần logic. Việc của bạn **chỉ là giao diện**:

- `src/lib/adminApi.ts`: mọi kiểu dữ liệu và hàm gọi API (`getMe`, `listUsers`, `banUser`, `unbanUser`, `deleteUser`, `getQuota`, `setQuota`, `clearQuota`, `listAudit`, `AUDIT_LABEL`). **Chỉ gọi các hàm này**, không tự `fetch`.
- `src/pages/admin/AdminPage.tsx`: cổng kiểm quyền. Không có quyền thì hiện trang chủ (giữ nguyên hành vi này). Khi có quyền, thay đoạn "Giao diện đang được dựng" bằng `<AdminLayout me={me} />`.
- Mở `http://127.0.0.1:5184/admin?mock=1` để xem với **dữ liệu giả** (57 người dùng, 3 dòng nhật ký). Không cần đăng nhập.

## Yêu cầu

### 1. `src/pages/admin/AdminLayout.tsx`
- Menu trái cố định (rộng ~220px): **Tổng quan, Người dùng, Nội dung, Ngân hàng, AI & Server, Nhật ký**. Icon `lucide-react`.
- Dùng route con: `/admin` (Tổng quan), `/admin/nguoi-dung`, `/admin/noi-dung`, `/admin/ngan-hang`, `/admin/ai`, `/admin/nhat-ky`. Route `/admin/*` đã khai báo trong `App.tsx`; bên trong dùng `<Routes>` lồng. Giữ `?mock=1` khi chuyển mục.
- Giai đoạn này chỉ làm thật **Người dùng** và **Nhật ký**. Các mục khác hiện thẻ "Sắp có" (dùng `EmptyState`). Tổng quan: thẻ đếm tổng người dùng (lấy `total` từ `listUsers({ perPage: 1 })`) và thẻ "Sắp có" cho phần còn lại.
- Màn hình hẹp (< 768px): menu trái thành thanh tab cuộn ngang ở trên. 360px không được cuộn ngang trang.
- Góc trên phải hiện vai trò (`Badge`): admin / kiểm duyệt.

### 2. `src/pages/admin/UsersPanel.tsx`
- Ô tìm theo email (gõ xong 400ms mới gọi, có nút xoá). Bảng: Email + tên, Ngày tạo, Đăng nhập gần nhất, Số đề, Số slide, Token tháng này, Trạng thái (Bình thường / Đang khoá `Badge tone="clay"`), Vai trò.
- Phân trang bằng `src/components/Pager.tsx`, 20 dòng / trang.
- Bấm một dòng mở **ngăn bên phải** (drawer) chi tiết người dùng:
  - Thông tin như trên.
  - **Hạn mức AI**: gọi `getQuota`. Hiện đã dùng / hạn mức (thanh tiến độ). Ô số "Hạn mức tháng (token)", nút "Không giới hạn", ô ghi chú, nút Lưu (`setQuota`), nút "Về mặc định" (`clearQuota`, chỉ hiện khi đang có `override`).
  - **Khoá tài khoản**: chọn thời hạn (1 ngày / 7 ngày / 30 ngày / Vô thời hạn → `hours` 24/168/720/không truyền), ô lý do, nút Khoá. Đang khoá thì hiện "Khoá đến …" và nút Mở khoá.
  - **Xoá tài khoản** (vùng đỏ cuối ngăn): giải thích "Xoá vĩnh viễn tài khoản, đề đã đồng bộ, đề cộng đồng và tài liệu của người này. Không hoàn tác được." Ô "Gõ lại email để xác nhận", nút Xoá chỉ bật khi gõ đúng email.
  - Không hiện nút Khoá/Xoá với người có `role === 'admin'`.
- Sau mỗi thao tác: thông báo ngắn, tải lại dòng / danh sách. Lỗi (`AdminError`) hiện bằng `dialog.alert` (`src/components/Dialog`) với `err.message`.
- Hỏi xác nhận trước khi Khoá bằng `dialog.confirm` (xem cách dùng trong code có sẵn).

### 3. `src/pages/admin/AuditPanel.tsx`
- Danh sách nhật ký: thời gian (định dạng `dd/MM/yyyy HH:mm`, giờ Việt Nam), thao tác (`AUDIT_LABEL[action] ?? action`), đối tượng (rút gọn id 8 ký tự đầu), chi tiết (lý do / hạn mức, đọc từ `detail`). Phân trang bằng `Pager`.

## Style (bắt buộc giống phần còn lại của web)

- Component có sẵn: `src/components/ui.tsx` (`Button`, `Badge`, `Card`, `Field`, `EmptyState`, `Spinner`, `inputClass`, `selectClass`, `Checkbox`), `Pager`, `Dialog`. Chọn giữa vài lựa chọn dùng `src/components/Segmented.tsx`. `Pager` nhận `{ page, pages, go }` (số trang = `Math.ceil(total / perPage)`).
- Lớp màu: `bg-surface`, `bg-sunken`, `border-line`, `border-line-2`, `text-ink` / `text-ink-2` / `text-ink-3`, `clay` (nhấn, nguy hiểm), `sage` (thành công), `honey`. Bo góc `rounded-[6px]` / `rounded-[8px]`. Font Be Vietnam Pro (đã cài toàn trang).
- Trang mẫu để bắt chước bố cục và chữ: `src/pages/Library.tsx` (bảng + lọc + phân trang), `src/pages/Profile.tsx` (thẻ, thanh tiến độ).
- Mọi chữ hiển thị bằng **tiếng Việt**, câu ngắn, không dùng tiếng Anh ("Ban", "Delete"…).

## Không được

- Không sửa `server/`, `api/`, `supabase/`, `vite.config.ts`, `src/lib/adminApi.ts` (thiếu gì thì ghi vào báo cáo, đừng tự thêm).
- Không thêm thư viện mới.
- Không đưa link `/admin` vào header / menu của site.
- Không commit lên `main`.

## Kiểm tra trước khi báo xong

```powershell
npx tsc -p tsconfig.app.json --noEmit
```

- Mở `/admin?mock=1` ở 1440px và 360px: không lỗi console, không cuộn ngang. Thử tìm, chuyển trang, mở ngăn, khoá rồi mở khoá, đặt hạn mức, xoá (gõ sai email thì nút không bật).
- Mở `/admin` (không mock, chưa đăng nhập): phải thấy trang chủ.
- Báo cáo: danh sách file đã tạo/sửa, ảnh chụp 1440px và 360px, những gì chưa làm được.
