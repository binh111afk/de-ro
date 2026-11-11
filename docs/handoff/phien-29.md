# Phiên 29 (10-11/11/2026): Admin giai đoạn 1-5, bảo mật, pentest

Tiếp phần đầu ở [phiên 28](phien-28.md). Kế hoạch gốc: [plan-admin.md](../plan-admin.md). Mọi thứ dưới đây **đã lên `main`** (`bf1ed90`), mọi migration **đã áp**.

## Bắt đầu phiên sau
1. Đọc `context.md` rồi file này. **Không** đọc lại cả `UsersPanel`, `BankPanel`, `ContentPanel` (mỗi file 1.000-1.400 dòng): dùng `grep -n` rồi `sed -n`.
2. Việc đang chờ: xem mục "Còn lại". Người dùng hay thử trên giao diện rồi gửi ảnh lỗi, nên sửa theo ảnh là chính.
3. Sửa UI admin xem bằng `http://localhost:5184/admin/...?mock=1` (`preview_start` tên `dev`).

## Bản đồ Admin

| Mục | Server | Client | Giao diện | Migration |
|---|---|---|---|---|
| Lõi, người dùng, hạn mức, cộng điểm, nhật ký, bảo trì, thông báo, thống kê AI, health | `server/admin.ts`, `server/ops.ts`, `server/dbMetrics.ts` | `src/lib/adminApi.ts` | `AdminLayout`, `UsersPanel`, `AuditPanel`, `OverviewPanel`, `OpsPanel`, `DbStatusCard` | `20261110*`, `20261111_admin_ops` |
| G3 Nội dung | `server/adminContent.ts` | `adminContentApi.ts` | `ContentPanel` | `20261112_admin_content` |
| G4 Ngân hàng | `server/adminBank.ts` | `adminBankApi.ts` | `BankPanel` | `20261113_admin_bank` |
| G5 Số liệu | `server/adminStats.ts` | `adminStatsApi.ts` | `StatsPanel`, `src/lib/presence.ts` | `20261114_admin_stats` |
| Tự khoá, chống vượt hạn mức | `strikeIntruder` trong `admin.ts`, `reserveQuota` trong `aiQuota.ts` | `clearSecurityFlag` | nhãn "Theo dõi" trong `UsersPanel` | `20261115`, `20261116` |

Giao diện nằm ở `src/pages/admin/`. Test: `npm run test:admin`, `test:admin-content`, `test:admin-bank`, `test:admin-stats`, `test:guard`. Kiểu: `npx tsc -p tsconfig.app.json --noEmit` và `tsconfig.node.json` (node kiểm `server/`).

**Thêm action:** thêm vào `*_ACTIONS` của file tương ứng, dùng `call`, `audit`, `HttpError`, `str`, `needUser` từ `./admin.js`, **chỉ trong `run`** (import vòng). Thao tác ghi phải `audit`. Không thêm file vào `api/` (Vercel Hobby). Client gọi `post(action, body, read)`; `read: true` được nhớ 60 giây, thao tác ghi xoá cache.

## Quyết định người dùng đã chốt
- Cộng điểm: modal nhập số, **cộng dồn**, không mất khi sang tháng. Hạn mức hiệu lực = hạn mức tháng + số dư.
- Xoá tài khoản: đề cộng đồng giữ lại, `owner_id` thành null.
- Tự khoá: tài khoản **không có vai trò** gọi action admin (trừ `me`) thì lần 1 khoá 3 ngày + gắn cờ, lần 2 vĩnh viễn. **Do người dùng yêu cầu**: pentest báo là rủi ro, đừng tự gỡ. Không phạt moderator, không phạt khi hạ tầng lỗi; đang khoá thì không tính thêm.
- Ngân hàng: file tĩnh giữ làm nền và dự phòng; Supabase `bank_questions` chỉ lưu câu sửa, ẩn, câu mới. `loadFullBank` gộp lại.
- Bảng Người dùng không có cột token (người dùng bảo bỏ). Hiện tên hiển thị và ảnh đại diện.
- Giao diện admin phải dùng component có sẵn: `SiteSelect` (không `<select>`), `Segmented`, `Pager`, `dialog`, `Portal`.

## Lưu ý kỹ thuật dễ sai
- Modal/ngăn kéo phải bọc `<Portal>` (`src/components/Portal.tsx`). `.page-enter` có `transform` nên `fixed` trong đó không phủ màn hình.
- Trong `App.tsx`, `/admin/*` dùng chung một `key`, nếu không mỗi lần chuyển tab dựng lại cả trang.
- Tên và ảnh của người dùng ở `user_metadata.display_name` / `avatar_url` (không phải `full_name`).
- Chỉ có màu trong `src/index.css` (`--color-*`). Tailwind im lặng với màu không tồn tại (`bg-forest` làm cột biểu đồ trong suốt).
- `?mock=1` **chỉ chạy ở dev** (`import.meta.env.DEV`). Trên production người thường mở cũng không vào được.
- `getMe()` được gọi cho mọi người ở Hồ sơ và khi bảo trì, nên `me` không được tính là vi phạm. Trang mới gọi action admin phải nằm sau kiểm quyền, nếu không sẽ khoá oan người thường.
- Moderator mở Tổng quan vẫn gọi `users.list`, `ai.stats` và bị 403 (không phạt): thẻ đó hiện 0, chưa xử lý.
- Upsert qua PostgREST cần cả policy SELECT, thiếu là bị RLS chặn (lỗi `presence` đã sửa).
- Chủ đề sửa được đề qua REST, nên cột kiểm duyệt phải khoá bằng trigger (`protect_exam_moderation`). Đọc đề bằng service role phải tự lọc `status` (`examCache.ts`).
- `user_documents.url` do người dùng tự ghi được: xoá R2 phải qua `r2DocKeyFromUrl` (chỉ `doc/`).
- Câu ẩn: kho câu dùng `loadFullBank` đã ẩn đúng, còn `pickQuestions` (tự tạo đề, `store/app.ts`) vẫn lấy file tĩnh.
- Ảnh câu hỏi: `BankEntry.image`; SVG được đổi sang ảnh thường trong `imageToSrc`, `bank.save` không nhận link ngoài.

## Môi trường
- Supabase project `ddcyhsxytbcdpgpggexh`. Production: https://de-ro-lac.vercel.app (push `main` là tự deploy).
- Máy dev **đã có `SUPABASE_SERVICE_ROLE_KEY` trong `.env`**, nên `/admin` không kèm `?mock=1` đang chạy trên **dữ liệu production**. Thử thao tác thật thì dùng tài khoản phụ. Đừng in giá trị key ra màn hình; muốn kiểm thì `grep -q`.
- Admin nằm trong bảng `user_roles`. Không ghi email vào repo.
- `.claude/` và `.strix/` chưa track, **đừng `git add -A`**, chỉ add đúng file.

## Quy trình làm việc đã thống nhất
- **Migration + push cần người dùng nói rõ** ("Áp và push"). Công cụ tự chặn `apply_migration` nếu chưa được đồng ý. Thứ tự: áp migration, kiểm trên DB, **rồi mới push** (code mới có thể cần cột mới).
- **Kiểm DB thật không để lại dữ liệu:** `do $$ ... raise exception 'RESULT ...' $$`; giả làm người dùng bằng `set_config('role','authenticated',true)` và `set_config('request.jwt.claims', ...)`. Lỗi trả về chính là kết quả.
- Commit/push theo từng yêu cầu. Xong việc thì hỏi "Push?".
- **Claude làm logic và review, agy (Antigravity CLI) làm việc dài.** Claude viết `docs/prompt-*.md` rồi đưa đoạn ngắn để người dùng dán, không tự chạy agy.
- Nhiều agy song song: mỗi con một worktree (`git worktree add ../dethinhbien-x -b feat/x main`) và một cổng riêng; dựng sẵn khung file riêng trước để ít xung đột. Trong prompt ghi rõ "không cần chụp màn hình" (agy từng treo 30 phút).

## Lỗi đã gặp khi thao tác
- `node_modules` hay mất gói nhị phân (`@rollup/rollup-win32-x64-msvc`, `@esbuild/win32-x64`), do công cụ khác cài lại. Chạy `npm install`, kiểm `git status` xem lockfile có đổi không.
- Heredoc dài chứa nháy trong Bash có thể lỗi parse: viết script Python vào thư mục scratchpad bằng Write rồi chạy.
- Chuỗi Python không raw có `\n` sẽ thành xuống dòng thật trong file TS.
- `execute_sql` nhiều câu chỉ trả kết quả câu cuối.
- Khung admin có `overflow-x-hidden` nên `scrollWidth` luôn báo không tràn: đo `getBoundingClientRect` từng phần tử.
- Ảnh chụp ở khung giả lập hẹp có thể bị cắt giả; lúc mới mở trang Vite biên dịch lâu (5-9 giây), đừng kết luận trang trắng.
- Đầu ra tool gõ phím vào ô `number` đôi khi cộng dồn; dùng `form_input`.
- Agy hay: dùng class không tồn tại, dùng `<select>` gốc, quên quyền ở DB, không nối chỗ prompt cấm sửa. **Review migration và luồng quyền bằng mắt**, test giả của agy không bắt được RLS.

## Tiết kiệm token
- Không đọc nguyên file lớn; `grep -n` rồi `sed -n` đúng đoạn. Đọc `.env` chỉ lấy tên biến.
- Giao việc dài cho agy, Claude chỉ review diff: migration, server, phần gọi API. Dựng UI để agy làm.
- Gộp nhiều lệnh kiểm trong một lần gọi; dùng `browser_batch`, `get_page_text`, `javascript_tool` thay ảnh chụp, ảnh để `scale` 0.6-0.7.
- Test chỉ in dòng lỗi: `npm run -s test:admin 2>&1 | grep -E "❌|OK"`.
- Sửa nhiều chỗ: một script Python với `assert s.count(a)==1`, thay vì nhiều lần Edit.
- Không lặp lại kết quả dài trong câu trả lời. Không đọc lại báo cáo Strix trừ khi có lượt quét mới.

## Còn lại
**Cần thử trên production** (mới kiểm bằng dữ liệu giả hoặc DB):
- Khoá thật bằng tài khoản phụ, lưu câu có ảnh, ẩn đề rồi mở link học sinh, "Đang online", thẻ Primary Database (chưa xác nhận số đo Supabase đúng định dạng), kiểm tra server.
- Bật Web Analytics trong dự án Vercel (người dùng làm).

**Việc nhỏ:**
- `pickQuestions` chưa ẩn câu đã ẩn.
- Thẻ Tổng quan cho moderator (ẩn hoặc hiện "—").
- Chủ đề bị gỡ đề chưa thấy lý do trong danh sách đề của mình.
- Góp ý của khách chưa giới hạn số lần.
- Dải đỏ bảo trì phải tải lại trang mới hiện.

**Chưa làm:** email cảnh báo chi phí (G2 mục 4), gọi API Vercel để hiện lượt truy cập trong admin.

Strix (phiên này): 5 phát hiện, sửa 4, giữ 1 (tự khoá). Cuộc quét chạy trước khi sửa, chưa quét lại.
