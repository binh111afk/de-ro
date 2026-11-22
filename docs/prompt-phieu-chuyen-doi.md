# Việc: phễu người dùng ở admin → Số liệu

Đọc `AGENTS.md` trước. Làm trong worktree này (nhánh `feat/phieu-chuyen-doi`), không commit, không đụng nhánh khác.

## Bối cảnh
Migration `supabase/migrations/20261221_admin_funnel.sql` (đã viết và đã thử bằng SQL thuần, **chưa áp, đừng sửa**) tạo RPC `public.admin_funnel(p_days int)`, chỉ `service_role` gọi được. `p_days = 0` là toàn bộ người dùng; `> 0` là chỉ người đăng ký trong p_days ngày gần nhất. Trả `jsonb`:

```
{ signed_up, returned, made, used_ai, paid,           // số người (đếm distinct) ở từng bước
  weeks: [{ week: 'YYYY-MM-DD', signed_up, returned, made, used_ai, paid }],   // tối đa 12 tuần, mới nhất trước
  hot:   [{ user_id, calls, billed }] }               // tối đa 20 người dùng AI nhiều nhưng chưa nạp
```
Ý nghĩa: `returned` = hoạt động từ 2 ngày khác nhau trở lên; `made` = có ít nhất một đề / slide / bảng vẽ / đề online; `used_ai` = có ít nhất một lượt AI thành công; `paid` = có ít nhất một đơn PayOS đã trả.

## Việc cần làm
1. `server/adminStats.ts`: thêm action `stats.funnel` vào `STATS_ACTIONS` (`need: 'admin'`). Nhận `days` ∈ {0, 7, 30, 90} (giá trị khác về 0); gọi `/rest/v1/rpc/admin_funnel` với `{ p_days }` (cùng kiểu như `stats.overview`). Với mỗi người trong `hot` tra email + tên bằng `/auth/v1/admin/users/<id>` như `stats.online` (lỗi từng người thì bỏ qua, vẫn trả dòng đó). Trả `{ days, steps: { signedUp, returned, made, usedAi, paid }, weeks: [...camelCase], hot: [{ userId, email, name, calls, billed }] }`. Trường nào thiếu thì về 0 / mảng rỗng.
2. Hàm thuần để test (đặt trong `server/` hoặc `src/lib/`, chỗ nào hợp): chuyển dữ liệu RPC → dạng trả về ở trên, và tính phần trăm từng bước (so với "Đăng ký" và so với bước ngay trước; chia cho 0 thì `null`).
3. `src/lib/adminStatsApi.ts`: thêm kiểu `StatsFunnel` + hàm `getStatsFunnel(days)` theo đúng cách các hàm `getStatsOverview` / `getStatsOnline` đang làm (kể cả nhánh mock nếu có, và `src/lib/adminMock.ts` nếu cần).
4. `src/pages/admin/StatsPanel.tsx`: thêm một khối "Phễu người dùng" dưới các khối hiện có. Gồm:
   - `Segmented` chọn Tất cả / 7 / 30 / 90 ngày (riêng cho khối này, không đụng bộ chọn ngày sẵn có).
   - 5 hàng thanh ngang: Đăng ký → Quay lại → Đã tạo nội dung → Đã dùng AI → Đã nạp tiền, mỗi hàng hiện số người và % so với Đăng ký (`—` khi không tính được). Thanh dùng màu / kiểu đang có trong trang.
   - Bảng theo tuần đăng ký (cột: Tuần bắt đầu, Đăng ký, Quay lại, Tạo nội dung, Dùng AI, Nạp), % trong ngoặc cạnh số.
   - Danh sách "Dùng AI nhiều, chưa nạp": email (tên nếu có), số lượt AI.
   - Có trạng thái đang tải và lỗi như các khối khác; lỗi thì các khối khác vẫn hiện.
   - Dùng lại component sẵn có (`Card`, `Segmented`, `Spinner`, `Pager` nếu cần). Nhãn tiếng Việt ngắn.
5. Test: `scripts/test-funnel.ts` cho hàm thuần (phần trăm, chia 0, thiếu trường) + phản hồi RPC giả lập qua action `stats.funnel` (xem `scripts/test-admin-stats.ts` để theo cách giả lập hiện có); thêm script `test:funnel` vào `package.json`.

## Điều cấm
- Không thêm chữ thừa trên giao diện (không dòng phụ giải thích, không câu trấn an, không chú thích cách tính).
- Không thêm thư viện, không sửa / áp migration, không commit / push, không sửa action `stats.overview` đang chạy.
- Không in email người dùng ra log. Không ghi đường dẫn tuyệt đối ngoài dự án.
- File CRLF (`StatsPanel.tsx`, và kiểm các file khác bằng `git ls-files --eol`): sửa bằng công cụ sửa file, không `sed -i`. Sau khi sửa: `git ls-files --eol <file>` (cột `i/` = `w/`) và `git diff --stat` (file chỉ đổi vài dòng thì không được báo hàng trăm dòng).

## Kiểm
```
npx tsc -p tsconfig.app.json --noEmit
npm run test:funnel
npm run test:admin-stats
npm run test:admin
```
(`node_modules` là liên kết về dự án chính, không cài lại. Nếu PowerShell chặn `npm.ps1` thì dùng `npm.cmd` / `npx.cmd`.)

## Báo cáo
Liệt kê file đã đổi, kết quả 4 lệnh kiểm (nguyên văn nếu lỗi), điều chưa kiểm được (ví dụ chưa xem giao diện thật), và quyết định nào tự đặt ra.
