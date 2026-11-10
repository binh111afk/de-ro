# Prompt: Admin giai đoạn 4 — Ngân hàng câu hỏi (logic + giao diện)

> Đưa nguyên file này cho agent. Có 3 agent chạy song song trên cùng repo, nên **bắt buộc làm trong worktree riêng**, không đổi nhánh ở thư mục gốc:
>
> ```
> git worktree add ../dethinhbien-bank -b feat/admin-bank main
> cd ../dethinhbien-bank
> npm install
> ```
>
> Mọi lệnh sau đó chạy trong `../dethinhbien-bank`. Dev server dùng **cổng 5187**: `npm run dev -- --port 5187 --host 127.0.0.1`. Không merge, không push, không áp migration lên Supabase.

## Bối cảnh

Dự án: web soạn đề thi tiếng Việt (React 19 + TypeScript + Vite 6 + Tailwind v4, Supabase, Vercel). Đọc `context.md` phần đầu, rồi đọc kỹ các file mẫu:
- `server/admin.ts`: API admin một endpoint, POST `{action, ...}`; `requireAdmin`, `audit`, `HttpError`, `call`, `str`.
- `src/lib/adminApi.ts`: `post`, dữ liệu giả `?mock=1` (`isAdminMock`, `wait`).
- `src/pages/admin/UsersPanel.tsx`: phong cách giao diện admin.
- `scripts/test-admin.ts`: cách test bằng `fetch` giả.

Ngân hàng câu hỏi hiện nằm **trong code**: `src/data/bank.ts` (`BankEntry`, `BANK`, `loadFullBank()` gộp thêm `bankThpt*.ts`), hình vẽ trong `bankFigures.ts`, độ khó `bankLevel.ts`. Khoảng 1.198 câu. Trang soạn đề dùng qua `src/examEditor/BankModal.tsx` và `bankQuestions.ts`. Quy trình soạn câu: `scripts/bank/HUONG_DAN_SOAN.md`.

**Thiết kế đã chốt (làm đúng như vậy):** file tĩnh **vẫn giữ làm nền và làm dự phòng**. Supabase chỉ lưu **phần chỉnh sửa**:
- Sửa một câu có sẵn → một dòng cùng `id`, ghi đè câu tĩnh.
- Ẩn một câu có sẵn → một dòng cùng `id`, `status='hidden'`.
- Câu mới → một dòng với `id` mới (tiền tố `db-`).
- `loadFullBank()` tải thêm các dòng này rồi gộp (ghi đè theo `id`, bỏ câu `hidden`, thêm câu mới). Tải lỗi hoặc chậm quá 4 giây thì dùng nguyên file tĩnh như hiện nay. Nhớ kết quả trong phiên.

**Khung đã dựng sẵn, chỉ sửa trong các file này:**

| File | Việc |
|---|---|
| `server/adminBank.ts` | thêm action vào `BANK_ACTIONS` |
| `src/lib/adminBankApi.ts` | kiểu + hàm gọi API + dữ liệu giả |
| `src/pages/admin/BankPanel.tsx` | giao diện `/admin/ngan-hang` (route `ngan-hang/*`) |
| `scripts/test-admin-bank.ts` | test, `npm run test:admin-bank` |
| `supabase/migrations/20261113_admin_bank.sql` | tạo mới |

Được sửa thêm: `src/data/bank.ts` (chỉ phần `loadFullBank` + hàm gộp), tạo file mới trong `src/data/` hoặc `src/lib/` nếu cần.

**Không được sửa**: `server/admin.ts`, `src/lib/adminApi.ts`, `src/pages/admin/AdminLayout.tsx`, các file của giai đoạn Nội dung / Số liệu (`*Content*`, `*Stats*`), `api/` (không thêm function), `vercel.json`, `package.json`, nội dung các câu trong `bankThpt*.ts`.

## Yêu cầu

### 1. Migration `20261113_admin_bank.sql`
- `bank_questions (id text pk, data jsonb not null, status text not null default 'published' check in ('published','hidden'), updated_at timestamptz default now(), updated_by uuid)`. `data` là một `BankEntry` đầy đủ.
- RLS: **ai cũng đọc** (app cần để gộp), không ai ghi qua REST (chỉ service role qua `/api/admin`).
- Index theo `updated_at`.

### 2. Action server (`BANK_ACTIONS`), quyền `admin`
- `bank.overrides.list`: trả mọi dòng (ít, không cần phân trang) để admin gộp với file tĩnh ở client.
- `bank.save`: `{entry: BankEntry}`; kiểm tra chặt: `subject` thuộc danh sách môn có trong `src/data/types.ts`, `type` hợp lệ, `prompt` không rỗng (≤ 5000 ký tự), trắc nghiệm phải có ≥ 2 phương án và `answer` trỏ đúng một phương án, `points > 0`, `grades` là mảng chuỗi. Câu mới không có `id` → server tạo `db-<uuid>`. Upsert, ghi `audit('bank.save', id, {subject, type, isNew})`.
- `bank.hide` / `bank.unhide`: `{id}`. `bank.revert`: xoá dòng ghi đè (câu tĩnh trở về bản gốc; câu `db-` thì xoá hẳn). Đều ghi audit.
- Không đọc file tĩnh ở server (nặng). Client tự gộp.

### 3. Giao diện `BankPanel.tsx`
- Client tải `loadFullBank()` **bản gốc** (không gộp) + `bank.overrides.list`, gộp lại, đánh dấu mỗi câu: Gốc / Đã sửa / Câu mới / Đã ẩn.
- Thanh lọc: môn, lớp, chương/chủ đề (từ `tags`), độ khó (`bankLevel.ts`), dạng câu, trạng thái, ô tìm theo nội dung. Phân trang `Pager` 30 câu/trang.
- Khối đếm: số câu theo môn × độ khó (bảng nhỏ), để biết chỗ thiếu câu.
- Bấm câu mở drawer: xem trước (dùng `QuestionBody` hoặc component hiển thị câu có sẵn, tìm bằng grep), nút Sửa / Ẩn / Hiện lại / Về bản gốc.
- Nút **Thêm câu**. Form sửa/thêm: môn, lớp (chọn nhiều), dạng, nội dung, phương án (thêm/xoá), đáp án, lời giải, điểm, tags. Công thức toán viết kiểu `$...$` như các câu có sẵn; có ô xem trước ngay dưới. Hình vẽ (`figure`) chỉ giữ nguyên khi sửa, chưa cần tạo mới.
- Dữ liệu giả `?mock=1`: vài câu đã sửa, đã ẩn, câu mới. 360px không cuộn ngang trang.

### 4. Gộp vào app
- Sửa `loadFullBank()` như phần "Thiết kế đã chốt". Đọc Supabase REST bằng publishable key (xem `src/components/SiteStatus.tsx` làm mẫu), chỉ lấy cột `id,data,status`.
- Viết hàm gộp thuần (pure) tách riêng để test được.

## Kiểm tra trước khi báo xong
1. `npx tsc -p tsconfig.app.json --noEmit` và `npx tsc -p tsconfig.node.json --noEmit` sạch.
2. `npm run test:admin-bank`: moderator/user thường bị 403; `bank.save` từ chối câu thiếu nội dung, đáp án trỏ sai, môn lạ; câu mới được id `db-…`; mọi thao tác ghi `admin_audit`; hàm gộp: ghi đè đúng id, bỏ câu ẩn, thêm câu mới, lỗi mạng → trả nguyên bản tĩnh. `npm run test:admin` vẫn đạt.
3. Mở trang soạn đề, mở kho câu hỏi: vẫn chạy khi không có Supabase (tắt mạng hoặc chưa có bảng).
4. Xem `http://127.0.0.1:5187/admin/ngan-hang?mock=1` ở 1440px và 360px. Không cần chụp màn hình.
5. Commit vào `feat/admin-bank`. Báo lại: danh sách file, những gì chưa làm được, câu hỏi còn vướng.
