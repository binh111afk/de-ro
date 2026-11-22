# Việc: hiện "số lần quay lại" và "tỉ lệ quay lại" của từng người dùng ở admin

Đọc `AGENTS.md` trước. Làm trong worktree này (nhánh `feat/ti-le-quay-lai`), không commit, không đụng nhánh khác.

## Bối cảnh
Migration `supabase/migrations/20261220_presence_return_stats.sql` (đã viết, **chưa áp, đừng sửa**) thêm 4 cột vào bảng `presence`, do trigger đặt:
- `visits`: số phiên (phiên mới khi im lặng quá 30 phút).
- `active_days`: số ngày (giờ VN) có hoạt động, kể cả ngày đầu.
- `first_day`, `last_day`: ngày hoạt động đầu / cuối (date).

## Việc cần làm
1. `server/admin.ts`, action `users.list`: ngoài truy vấn `presence` đang có (lọc online 2 phút), thêm một truy vấn `presence?user_id=in.(...)&select=user_id,visits,active_days,first_day` (lỗi thì `.catch(() => [])`, danh sách vẫn phải hiện, và nên chạy được cả khi cột chưa có). Mỗi dòng người dùng trả thêm `visits` (số phiên), `returnDays = max(0, active_days - 1)` và `returnRate` (0..1, hoặc `null` nếu chưa có dữ liệu).
   - `returnRate = returnDays / max(1, số ngày từ first_day đến hôm nay theo giờ VN)`, kẹp trong 0..1. Người mới chỉ có ngày đầu: `returnRate = 0`.
   - Viết phần tính này thành hàm thuần (đặt trong `server/admin.ts` hoặc file riêng trong `server/`) để test.
2. `src/lib/adminApi.ts`: thêm `visits`, `returnDays`, `returnRate` vào `AdminUser`. `src/lib/adminMock.ts`: thêm giá trị mẫu.
3. `src/pages/admin/UsersPanel.tsx`: ở khung chi tiết người dùng (chỗ đang hiện "Đăng nhập gần nhất", quanh dòng 612) thêm hai dòng: "Số lần quay lại" (`returnDays`, kèm số phiên) và "Tỉ lệ quay lại" (phần trăm làm tròn). Bảng danh sách thêm một cột "Quay lại" hiện `returnDays` (và % nếu vừa chỗ), có thể sắp xếp nếu bảng đang có sắp xếp. Dùng lại component sẵn có.
4. Test: `scripts/test-return-rate.ts` cho hàm thuần (người mới = 0, quay lại mọi ngày = 1, kẹp 0..1, thiếu dữ liệu = null) và thêm script `test:return-rate` vào `package.json`.

## Điều cấm
- Không thêm chữ thừa trên giao diện (không dòng phụ giải thích, không câu trấn an); nhãn tiếng Việt ngắn.
- Không thêm thư viện, không sửa migration, không áp migration, không commit / push.
- File CRLF (`server/admin.ts`, `adminApi.ts`, `UsersPanel.tsx`): sửa bằng công cụ sửa file, không `sed -i`. Sau khi sửa chạy `git ls-files --eol <file>` (cột `i/` = `w/`) và `git diff --stat` (file chỉ đổi vài dòng thì không được báo hàng trăm dòng).
- Không ghi đường dẫn tuyệt đối ngoài dự án.

## Kiểm
```
npx tsc -p tsconfig.app.json --noEmit
npm run test:return-rate
npm run test:admin
```
(`node_modules` là liên kết về dự án chính, không cài lại.)

## Báo cáo
Liệt kê file đã đổi, kết quả 3 lệnh kiểm (nguyên văn nếu lỗi), điều chưa kiểm được (ví dụ chưa xem giao diện thật), và quyết định nào tự đặt ra.
