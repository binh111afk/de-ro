# Việc: bot Telegram báo thêm 2 loại — API trả 5xx và đơn PayOS lỗi

Đọc `AGENTS.md` trước. Làm trong worktree này (nhánh `feat/canh-bao`), không commit, không đụng nhánh khác. Ba việc khác chạy song song ở worktree khác: **chỉ sửa file thuộc việc này**.

## Bối cảnh
`server/alerts.ts` (`evaluateAlerts`, `handleAlertRequest`) chạy mỗi 5 phút (pg_cron → `/api/alert`), lấy số liệu từ RPC `alert_metrics`, báo Telegram, mỗi loại có thời gian nghỉ (`alert_state`). Migration `supabase/migrations/20261222_api_errors_alerts.sql` (đã viết, **chưa áp, đừng sửa**) thêm:
- bảng `public.api_errors (id, at, status, path)`, chỉ `service_role` ghi / đọc;
- `alert_metrics` trả thêm `api_5xx_15m` (số dòng `api_errors` 15 phút gần nhất) và `pay_failed_1h` (đơn `payment_orders.status = 'failed'` tạo trong 1 giờ qua).

## Việc cần làm
1. `server/http.ts`: trong `json(res, code, body)`, khi `code >= 500` ghi một dòng vào `api_errors` (`status`, `path` lấy từ `res.req?.url` bỏ query, cắt 200 ký tự) bằng `fetch` tới Supabase REST với service role key (env như `server/alerts.ts`: `VITE_SUPABASE_URL` / `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). Yêu cầu:
   - Fire-and-forget: không `await` trong đường trả lời, nuốt mọi lỗi, `AbortSignal.timeout` ngắn (3 s), không bao giờ làm hỏng hay chậm phản hồi.
   - Bỏ qua: status 503 (bảo trì / thiếu cấu hình), path `/api/alert`, và khi thiếu env.
   - Chặn bão ghi: mỗi instance tối đa 20 dòng / phút.
   - Không ghi nội dung body hay thông tin người dùng, chỉ status + path.
2. `server/alerts.ts`: thêm 2 trường vào `AlertMetrics` (cho phép thiếu → coi là 0 để chạy được khi migration chưa áp) và 2 cảnh báo trong `evaluateAlerts`:
   - `api_5xx`: `api_5xx_15m >= ALERT_API_5XX` (env, mặc định 5) → "API lỗi 5xx: N lần trong 15 phút."
   - `pay_failed`: `pay_failed_1h >= 1` (env `ALERT_PAY_FAILED`, mặc định 1) → "Đơn nạp PayOS lỗi: N đơn trong 1 giờ."
   - Giọng văn ngắn như các cảnh báo cũ.
3. Trong `handleAlertRequest`, mỗi lần chạy xoá dòng `api_errors` cũ hơn 3 ngày (REST `DELETE ...?at=lt.<iso>`), lỗi thì bỏ qua, không làm hỏng việc báo.
4. Test: `scripts/test-alerts.ts` + script `test:alerts` trong `package.json`: `evaluateAlerts` với số liệu thiếu trường mới (không báo), dưới ngưỡng, bằng ngưỡng, trên ngưỡng, ngưỡng đổi bằng env; phần `json()` — 5xx gọi fetch ghi log một lần với đúng status/path, 4xx và 503 và `/api/alert` thì không gọi, lỗi fetch không ném, giới hạn 20 / phút (giả lập `fetch` toàn cục, trả lại sau test).

## Điều cấm
- Không sửa / áp migration, không thêm thư viện, không commit / push.
- Không log email, token hay body request. Không đổi hành vi các cảnh báo cũ.
- Không ghi đường dẫn tuyệt đối ngoài dự án. Kiểm `git ls-files --eol <file>` trước khi sửa file; file CRLF sửa bằng công cụ sửa file (không `sed -i`), sau đó `git diff --stat` (đổi vài chục dòng, không phải cả file).

## Kiểm
```
npx tsc -p tsconfig.app.json --noEmit
npm run test:alerts
npm run test:guard
```
(`node_modules` là liên kết, không cài lại. PowerShell chặn `npm.ps1` thì dùng `npm.cmd`; `tsx` lỗi `uv_os_get_passwd` thì dùng cấu hình Node tạm, nói rõ.)

## Báo cáo
File đã đổi, kết quả từng lệnh (nguyên văn nếu lỗi), điều chưa kiểm được (chưa chạy với Supabase thật vì migration chưa áp), quyết định tự đặt ra.
