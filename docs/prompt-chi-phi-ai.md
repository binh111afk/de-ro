# Việc: admin xem lãi / lỗ theo loại tác vụ AI và đối chiếu chi phí thật với ước tính

Đọc `AGENTS.md` trước. Làm trong worktree này (nhánh `feat/chi-phi-ai`), không commit, không đụng nhánh khác. Hai việc khác chạy song song ở worktree khác (cảnh báo Telegram; phản hồi AI): **chỉ sửa file thuộc việc này**. Để tránh xung đột khi gộp: action mới đặt trong **file server mới**, giao diện trong **component mới**, chỉ thêm đúng một dòng gộp vào `server/admin.ts` (`...AI_MARGIN_ACTIONS` cạnh các `...X_ACTIONS`) và một dòng gắn component vào `src/pages/admin/OpsPanel.tsx`.

## Bối cảnh
- `ai_calls (user_id, model, provider, ok, prompt_tokens, completion_tokens, cost, kind, billed, created_at)`. `cost` là USD **ước tính** (`estimateCost` ở `server/ops.ts`, bảng giá `DEFAULT_PRICE`); `billed` là số token trừ của người dùng (1 điểm = 1.000 token, xem `server/aiQuota.ts` và `src/lib/pricing.ts` cho giá điểm / tiền nạp).
- Lỗ hổng đã thấy trên dữ liệu thật: các lượt `kind = 'image'` và `'image-pro'` (provider `image`) có `cost = null` nhưng đã trừ điểm của người dùng — chi phí ảnh đang không được tính, nên chi phí tổng bị thấp.
- Cài đặt admin lưu ở bảng `app_settings` (khoá / giá trị JSON), xem `server/aiSettings.ts` và `WelcomePointsCard.tsx` / `PricingEditor.tsx` làm cách đọc / ghi + ghi nhật ký admin (`audit`).
- Admin đã có `ai.stats` (`server/admin.ts` ~dòng 624) và thẻ chi phí trong `OpsPanel.tsx`: không làm lại, thêm bên cạnh.

## Việc cần làm
1. `server/adminAiMargin.ts` với 3 action (`need: 'admin'`):
   - `aiMargin.get` nhận `days` ∈ {7, 30, 90}: theo từng `kind` (bỏ kind rỗng thì gom vào "Khác"): số lượt thành công, token đã trừ (`billed`) và **điểm** tương ứng, **doanh thu quy đổi VND** (điểm × giá điểm theo bảng giá hiện hành — lấy đúng cách `pricing.ts` / app_settings định nghĩa, ghi rõ giả định), chi phí ước tính USD (`cost` có sẵn; riêng kind chưa có `cost` thì dùng **giá mỗi lượt** do admin nhập, xem dưới), chi phí quy VND theo **tỉ giá** do admin nhập, và biên = doanh thu − chi phí (VND và %). Có dòng tổng. Kind chưa có giá thì đánh dấu rõ "chưa có giá", không coi là 0 lãi.
   - `aiMargin.settings` (đọc) / `aiMargin.saveSettings` (ghi + `audit`): lưu trong `app_settings` khoá `ai_margin`: `usdVnd` (tỉ giá, mặc định 25000, kiểm 1.000–100.000), `unitCostUsd` (`{ kind: giá USD mỗi lượt }` cho kind không có `cost`, ví dụ `image`, `image-pro`; mỗi giá 0–10), `actual` (`{ 'YYYY-MM': { provider: USD thực trả } }` — số liệu admin chép từ hoá đơn nhà cung cấp, 0–100000). Kiểm đầu vào chặt, từ chối khoá lạ, giới hạn số mục.
   - Đối chiếu: trong `aiMargin.get`, với tháng hiện tại và mỗi `provider` có số `actual` thì trả thêm chi phí ước tính cùng tháng (USD, tổng `cost` của provider) và **hệ số = thực / ước tính** (`null` nếu ước tính = 0).
2. Hàm thuần (đặt trong `server/` hoặc `src/lib/`) tính doanh thu / chi phí / biên / hệ số để test; chia 0 → `null`.
3. `src/lib/adminAiMarginApi.ts` và `src/pages/admin/AiMarginCard.tsx`: khối "Lãi / lỗ AI" gồm `Segmented` 7 / 30 / 90 ngày; bảng theo kind (Lượt, Điểm đã trừ, Doanh thu, Chi phí, Biên %) với dòng kind chưa có giá nổi bật; phần "Giá nhập tay" (tỉ giá, giá mỗi lượt cho kind chưa có giá, chi phí thật tháng này theo nhà cung cấp) có nút Lưu; bảng đối chiếu (nhà cung cấp, ước tính, thực, hệ số). Dùng lại `Card`, `Segmented`, `Button`, `inputClass`, `Spinner`. Trạng thái đang tải / lỗi riêng; lưu thành công / lỗi báo bằng cách các panel admin khác đang báo.
4. Test `scripts/test-ai-margin.ts` + script `test:ai-margin` trong `package.json`: hàm thuần (biên âm / dương, kind không giá, chia 0, hệ số), kiểm đầu vào `saveSettings` (khoá lạ, số ngoài khoảng, quá nhiều mục), `aiMargin.get` với phản hồi Supabase giả lập (theo cách `scripts/test-admin-stats.ts`).

## Điều cấm
- Không chữ thừa trên giao diện (không dòng phụ giải thích, không câu trấn an); nhãn tiếng Việt ngắn. Không thêm thư viện, không sửa / áp migration (dùng `app_settings` có sẵn), không commit / push.
- **Không đổi cách tính điểm hay trừ điểm của người dùng, không đổi `estimateCost` / `DEFAULT_PRICE`** — việc này chỉ hiển thị và nhập số liệu.
- Không in email / số liệu nhạy cảm ra log. Không đường dẫn tuyệt đối ngoài dự án.
- CRLF: kiểm `git ls-files --eol <file>`; `admin.ts`, `OpsPanel.tsx` có thể là CRLF — sửa bằng công cụ sửa file, không `sed -i`, sau đó `git diff --stat`.

## Kiểm
```
npx tsc -p tsconfig.app.json --noEmit
npm run test:ai-margin
npm run test:admin
npm run test:ai-cost
```
(PowerShell chặn `npm.ps1` thì dùng `npm.cmd`; `tsx` lỗi `uv_os_get_passwd` thì dùng cấu hình Node tạm, nói rõ.)

## Báo cáo
File đã đổi, kết quả từng lệnh (nguyên văn nếu lỗi), giả định về giá điểm / quy đổi VND, điều chưa kiểm (giao diện thật, Supabase thật), quyết định tự đặt ra.
