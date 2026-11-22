# Việc: admin xem phản hồi chất lượng AI (bảng `ai_feedback`)

Đọc `AGENTS.md` trước. Làm trong worktree này (nhánh `feat/phan-hoi-ai`), không commit, không đụng nhánh khác. Hai việc khác chạy song song ở worktree khác (cảnh báo Telegram; chi phí AI): **chỉ sửa file thuộc việc này**. Để tránh xung đột khi gộp: action mới đặt trong **file server mới**, giao diện mới đặt trong **component mới**, chỉ thêm đúng một dòng gộp vào `server/admin.ts` (`...AI_FEEDBACK_ACTIONS` cạnh các `...X_ACTIONS` có sẵn) và một dòng gắn component vào `src/pages/admin/OpsPanel.tsx`.

## Bối cảnh
Bảng `public.ai_feedback (id, user_id, kind, mode, request, reply, context, note, created_at)`:
- `kind` ∈ `up | down | undo | resend | complaint` (👍, 👎, Ctrl+Z ngay sau khi AI sửa, gửi lại yêu cầu gần giống, nói "sai rồi"); `up` là tốt, bốn loại còn lại là tín hiệu không hài lòng.
- `mode` ∈ `exam | slide | board`.
Hiện mới 10 dòng (đều `exam`). Ghi bằng `server/ops.ts` / `server/quota.ts`; chưa có chỗ nào cho admin xem. Số lượt AI lấy từ `ai_calls` (cột `kind`, `ok`): `task-doc`, `question`, `ask-clarify`, `task-exam-online`, `vision-source` → `exam`; `task-slide`, `task-slide-pro` → `slide`; `board` → `board`; các kind khác (`image`…) không tính. Action `ai.stats` (`server/admin.ts`, ~dòng 624, RPC `admin_ai_stats`) đã trả thống kê lượt AI theo kind — dùng lại nếu hợp, không thì truy vấn REST `ai_calls`.

## Việc cần làm
1. `server/adminAiFeedback.ts`: action `aiFeedback.overview` (`need: 'admin'`) nhận `days` ∈ {7, 30, 90} (mặc định 30). Trả:
   - theo từng `mode`: số lượt AI thành công, số phản hồi theo từng `kind`, số tín hiệu không hài lòng (down + undo + resend + complaint), tỉ lệ không hài lòng = không hài lòng / lượt AI (`null` nếu 0 lượt);
   - tối đa 50 dòng không hài lòng mới nhất (kind, mode, thời gian, `request` và `reply` cắt 300 ký tự, `note`, email + tên người dùng tra bằng `/auth/v1/admin/users/<id>` — lỗi từng người thì bỏ qua).
   Truy vấn REST giới hạn dòng (ví dụ ≤ 1000), lỗi bảng thì trả cấu trúc rỗng chứ không ném.
2. Hàm thuần (đặt trong `server/` hoặc `src/lib/`) gộp số liệu và tính tỉ lệ để test.
3. `src/lib/adminAiFeedbackApi.ts` (kiểu + hàm gọi, theo cách `adminStatsApi.ts` làm, kể cả mock nếu có) và `src/pages/admin/AiFeedbackCard.tsx`: khối "Phản hồi AI" gồm `Segmented` 7 / 30 / 90 ngày, bảng theo mode (Lượt AI, 👍, Không hài lòng, Tỉ lệ), danh sách phản hồi không hài lòng (loại, mode, thời gian, người, yêu cầu → trả lời, bấm mở rộng xem đủ). Trạng thái đang tải / lỗi riêng. Dùng lại `Card`, `Segmented`, `Spinner`, `Pager` + `usePaged` nếu danh sách dài. Gắn vào `OpsPanel.tsx` bằng một dòng.
4. Test `scripts/test-ai-feedback-admin.ts` + script `test:ai-feedback-admin` trong `package.json`: hàm thuần (tỉ lệ, chia 0, mode không có dữ liệu) và action với phản hồi Supabase giả lập (theo cách `scripts/test-admin-stats.ts` giả lập).

## Điều cấm
- Không chữ thừa trên giao diện (không dòng phụ giải thích, không câu trấn an); nhãn tiếng Việt ngắn. Không thêm thư viện, không sửa / áp migration, không commit / push.
- Không cho khách đọc (chỉ `need: 'admin'`). Không in email / nội dung phản hồi ra log. Không đường dẫn tuyệt đối ngoài dự án.
- CRLF: kiểm `git ls-files --eol <file>`; `admin.ts`, `OpsPanel.tsx` có thể là CRLF — sửa bằng công cụ sửa file, không `sed -i`, sau đó `git diff --stat`.

## Kiểm
```
npx tsc -p tsconfig.app.json --noEmit
npm run test:ai-feedback-admin
npm run test:admin
```
(PowerShell chặn `npm.ps1` thì dùng `npm.cmd`; `tsx` lỗi `uv_os_get_passwd` thì dùng cấu hình Node tạm, nói rõ.)

## Báo cáo
File đã đổi, kết quả từng lệnh (nguyên văn nếu lỗi), điều chưa kiểm (giao diện thật, Supabase thật), quyết định tự đặt ra.
