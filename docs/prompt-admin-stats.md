# Prompt: Admin giai đoạn 5 — Số liệu (logic + giao diện)

> Đưa nguyên file này cho agent. Có 3 agent chạy song song trên cùng repo, nên **bắt buộc làm trong worktree riêng**, không đổi nhánh ở thư mục gốc:
>
> ```
> git worktree add ../dethinhbien-stats -b feat/admin-stats main
> cd ../dethinhbien-stats
> npm install
> ```
>
> Mọi lệnh sau đó chạy trong `../dethinhbien-stats`. Dev server dùng **cổng 5188**: `npm run dev -- --port 5188 --host 127.0.0.1`. Không merge, không push, không áp migration lên Supabase.

## Bối cảnh

Dự án: web soạn đề thi tiếng Việt (React 19 + TypeScript + Vite 6 + Tailwind v4, Supabase, Vercel). Đọc `context.md` phần đầu, rồi đọc kỹ các file mẫu:
- `server/admin.ts`: API admin một endpoint, POST `{action, ...}`; `requireAdmin`, `call`, `HttpError`. Hàm SQL `admin_user_stats`, `admin_ai_stats` trong `supabase/migrations/20261110_admin.sql`, `20261111_admin_ops.sql` là mẫu viết RPC chỉ service role gọi được.
- `src/lib/adminApi.ts`: `post`, dữ liệu giả `?mock=1` (`isAdminMock`, `wait`).
- `src/pages/admin/OpsPanel.tsx`: mẫu khối thống kê + biểu đồ cột tự vẽ (không dùng thư viện).

**Khung đã dựng sẵn, chỉ sửa trong các file này:**

| File | Việc |
|---|---|
| `server/adminStats.ts` | thêm action vào `STATS_ACTIONS` |
| `src/lib/adminStatsApi.ts` | kiểu + hàm gọi API + dữ liệu giả |
| `src/pages/admin/StatsPanel.tsx` | giao diện `/admin/so-lieu` (menu "Số liệu" đã có) |
| `scripts/test-admin-stats.ts` | test, `npm run test:admin-stats` |
| `supabase/migrations/20261114_admin_stats.sql` | tạo mới |

Được sửa thêm: `src/App.tsx` (chỉ để gắn nhịp "đang online" và Vercel Analytics), `package.json` (chỉ thêm dependency `@vercel/analytics`), tạo file mới trong `src/lib/`.

**Không được sửa**: `server/admin.ts`, `src/lib/adminApi.ts`, `src/pages/admin/AdminLayout.tsx`, `OverviewPanel.tsx`, các file giai đoạn Nội dung / Ngân hàng (`*Content*`, `*Bank*`), `api/` (không thêm function), `vercel.json`.

Bảng đang có: `auth.users` (`created_at`, `last_sign_in_at`), `user_items (owner_id, kind, id, data, updated_at)` (`kind` là loại: đề, slide…; xem `src/lib/sync.ts`), `community_exams (created_at)`, `ai_usage`, `ai_calls`.

## Yêu cầu

### 1. Migration `20261114_admin_stats.sql`
- `user_items`: thêm `created_at timestamptz` **có default now()**; dòng cũ để `null` (không biết ngày tạo thật, **không** gán bằng `updated_at`). Kiểm tra `src/lib/sync.ts` khi upsert không ghi đè `created_at` (upsert chỉ gửi cột có trong body nên thường ổn; nếu sync gửi toàn bộ dòng thì xử lý bằng trigger giữ giá trị cũ).
- `presence (user_id uuid pk references auth.users on delete cascade, last_seen timestamptz not null default now())`. RLS: người đăng nhập chỉ `insert`/`update` dòng của chính mình (`user_id = auth.uid()`), không ai đọc.
- RPC `admin_stats_overview(p_days int)` (service role): theo từng ngày (giờ `Asia/Ho_Chi_Minh`) trong `p_days` ngày: số đăng ký mới, số đề/slide tạo mới (theo `kind`, chỉ dòng có `created_at`), số đề cộng đồng mới. Và các tổng: tổng người dùng, hoạt động 7 ngày và 30 ngày (theo `last_sign_in_at` hoặc `presence.last_seen`, lấy cái mới hơn), số đang online (`presence.last_seen` trong 2 phút).

### 2. Action server (`STATS_ACTIONS`), quyền `admin`
- `stats.overview`: `{days: 7|30|90}` (kẹp 1..90) → gọi RPC, đổi tên cột sang camelCase.
- `stats.online`: chỉ số đang online + danh sách tối đa 20 email đang online (Auth Admin API).

### 3. Nhịp "đang online" (phía người dùng)
- `src/lib/presence.ts`: khi đã đăng nhập và tab đang hiện (`document.visibilityState === 'visible'`), mỗi 60 giây upsert `presence` (Supabase REST, token người dùng, `Prefer: resolution=merge-duplicates`). Không gửi khi tab ẩn. Lỗi thì im lặng. Gắn trong `src/App.tsx` cạnh `startSync`.
- Khách không đăng nhập không tính (ghi rõ trong giao diện: "chỉ tính người đã đăng nhập").

### 4. Vercel Web Analytics
- Cài `@vercel/analytics` bản ổn định, thêm `<Analytics />` (import từ `@vercel/analytics/react`) trong `App.tsx`. Không gửi khi chạy ở máy dev. Trong StatsPanel để một thẻ "Lượt truy cập" ghi "Xem trên Vercel Analytics" kèm link `https://vercel.com/dashboard` (chưa gọi API Vercel).

### 5. Giao diện `StatsPanel.tsx`
- `Segmented` 7 / 30 / 90 ngày.
- Hàng thẻ số: Tổng người dùng, Đăng ký mới (trong khoảng), Hoạt động 7 ngày, Hoạt động 30 ngày, **Đang online** (chấm xanh, tự tải lại mỗi 60 giây khi trang mở).
- Biểu đồ cột tự vẽ: đăng ký mới theo ngày; đề / slide tạo mới theo ngày (cột chồng hoặc 2 màu). Ghi chú nhỏ: "Đề tạo trước ngày bật thống kê không có ngày tạo nên không tính".
- Bấm thẻ Đang online mở danh sách email đang online.
- Dữ liệu giả `?mock=1` đủ các khoảng. 360px không cuộn ngang trang.

## Kiểm tra trước khi báo xong
1. `npx tsc -p tsconfig.app.json --noEmit` và `npx tsc -p tsconfig.node.json --noEmit` sạch.
2. `npm run test:admin-stats`: moderator/user thường bị 403; `days` bị kẹp; đổi tên cột đúng. `npm run test:admin` vẫn đạt.
3. Đồng bộ đề (`npm run test:sync`) vẫn đạt sau khi thêm `created_at`.
4. Xem `http://127.0.0.1:5188/admin/so-lieu?mock=1` ở 1440px và 360px. Không cần chụp màn hình.
5. Commit vào `feat/admin-stats`. Báo lại: danh sách file, những gì chưa làm được, câu hỏi còn vướng.
