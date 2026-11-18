# Phiên 48 — trang nạp mở cho mọi người, pháp lý + ô tick đồng ý, vá Strix a70c, bảng vẽ (nhóm, lực nhấn), DeepSeek ưu tiên 1

Ngày 18–19/11/2026. Nhánh `main`, commit cuối `f39ea77` (đã push). Không có migration mới (vẫn đến `20261206`).

## Việc phiên sau

1. **Prompt hệ thống lộ trên trình duyệt** (người dùng thấy trong tab Network). Prompt ghép ở client (`AiPanel.tsx`, `slideAi.ts`, `docRewrite.ts` + `FIGURE_GUIDE`, `khungPrompt.ts`, `bankImport.ts`…) rồi gửi cả `messages` lên `/api/llm`. Hệ quả: chép được prompt; ai có tài khoản cũng gửi prompt tự viết, dùng `/api/llm` như ô chat đa năng (vẫn trừ điểm của họ); kết quả trả về có trường `model` → lộ tên model / nhà cung cấp. Người dùng đã đồng ý làm, theo thứ tự:
   - **Việc nhỏ trước:** bỏ `model` khỏi kết quả gửi về trình duyệt (JSON và sự kiện SSE `done`/`retry` của `server/llmProxy.ts`), chỉ ghi ở `ai_calls`. Kiểm client có chỗ nào đọc `model` (nhật ký AI, nút Thử lại model mạnh) trước khi bỏ.
   - **Việc lớn:** chuyển prompt lên server. Client gửi `task` (`soan-de`, `slide`, `sua`, `hoi-lai`, …) + dữ liệu người dùng (yêu cầu, môn/lớp, tài liệu đính kèm, phần đang chọn); server tự ghép prompt, từ chối `role: system` từ client. Đề xuất làm soạn đề + slide trước (giá trị nhất), các chỗ nhỏ sau. Ước 1–2 phiên.
   - **Chia việc (người dùng đã đồng ý):** agent mạnh tự làm khung bảo mật + soạn đề + slide + ẩn tên model; các chỗ gọi AI nhỏ còn lại (sửa câu, hỏi lại, AI ngân hàng admin, AI bảng vẽ…) thì viết `docs/prompt-chuyen-prompt-server.md` giao agy trên nhánh riêng, agent mạnh review rồi mới gộp.
   - **Bắt buộc kiểm chất lượng (người dùng dặn):** **trước khi sửa**, chạy soạn **5–7 đề** khác nhau (nhiều môn / lớp / dạng: vd Toán 12 THPT, Toán 8, Lý 11, Hoá 10, Văn hoặc Sử, một đề có hình vẽ, một đề kèm tài liệu đính kèm) bằng `npm run eval:exam` (hoặc `node scripts/exp-exam-cost.mjs` có giám khảo chấm câu sai) và lưu kết quả. **Sau khi chuyển**, chạy lại đúng các đề đó, cùng model / mức suy luận, rồi so: số câu sai giám khảo bắt, đáp án, hình vẽ, câu vượt khung chương trình, token / điểm mỗi đề. Chất lượng giảm thì chưa được gộp. Slide làm tương tự với `npm run eval:slides` (2–3 bộ). Báo người dùng bảng so trước / sau.
2. **Bảng vẽ — chưa có phản hồi sau bản sửa chớp** (`35488e3`): người dùng báo bản `e9a840c` chớp nặng, sau khi bỏ `desynchronized` thì "ít chớp hơn nhưng vẫn chớp"; bản bỏ luôn điểm dự đoán chưa được thử. Nếu vẫn chớp thì lỗi có từ trước đợt này — hỏi chớp cả bảng hay chỉ nét đang viết, trình duyệt gì. Cũng chưa thử lực nhấn bằng bút thật.
3. **Đọc PDF ngân hàng câu hỏi (admin)** giờ thử opencode trước — người dùng chưa thử lại với PDF thật, chưa kiểm opencode khoanh hình (`figure.box`) có chuẩn không.
4. Treo từ phiên trước: `DEEPSEEK_STRONG_MODEL`, `ANYROUTER_API_KEY` trên Vercel; xoá `MERCURY_*`, `TAVILY_*`; tắt r2.dev bucket R2. `AI_SETTINGS_SECRET` người dùng nói đã cài.
5. Điểm phụ báo cáo Strix a70c chưa làm: nhiều đơn chờ cùng lúc khi tạo đơn song song (cần partial unique index — migration), cộng tay + nhật ký chưa cùng giao dịch, doanh thu tháng theo UTC và theo giá đơn, khung QR hết giờ không hỏi PayOS lần cuối.

## Đã làm (theo commit)

| Commit | Nội dung |
|---|---|
| `9e700ff`, `ddfacba` | Đọc PDF ngân hàng câu hỏi (`server/bankVision.ts`): thứ tự `opencode → FOSTA → Claude` (`visionTargets` trong `llmProxy.ts`), opencode gửi `OPENCODE_HEADERS` + suy luận `max`, 64k token, chờ 240 s; model trả 0 câu thì chuyển model sau. `vercel.json`: `api/admin.ts` `maxDuration` 300. |
| `e2a970c` | **Vá Strix a70c** (`server/payment.ts`): webhook không tin `amount` trong body — có đơn thì gọi `reconcileOrder` (số tiền = `amountPaid` PayOS), không hỏi được PayOS thì 500 để PayOS gửi lại; đơn mẫu (không có trong DB) vẫn 200. Xem trạng thái đơn hỏi lại PayOS cả đơn huỷ / hết hạn trong 48 h (`RECHECK_CLOSED_MS`). Admin "Cần xem" gồm cả đơn đã đóng có ghi chú `THIEU`. |
| `e8a3b02` | Trang **Điều khoản / Quyền riêng tư** viết lại (`src/pages/Legal.tsx`, nội dung từ bản người dùng gửi + đoạn "Dữ liệu từ Google"; bỏ thống kê truy cập, bỏ xoá tài khoản theo yêu cầu, không ghi thông tin doanh nghiệp). **Ô tick đồng ý** ở đăng nhập / đăng ký (`Auth.tsx`, chặn cả nút Google, nhớ ở `localStorage` `dero.terms-accepted`). **`PRICING_PUBLIC = true`** (trang nạp mở cho mọi người, server hết 403); bỏ tab Bảng giá trên nav, nút Nạp điểm hiện từ `lg` (dạng icon tới `xl`), menu điện thoại mọi cỡ. **Chuyển thiếu → cộng theo giá nạp lẻ** (`creditPartial`): khoá link PayOS, đổi đơn thành nạp lẻ đúng số tiền nhận (`vnd`, `points = basePoints`, bỏ thưởng), rồi cộng; chưa đủ 1 điểm thì để admin. |
| `975d9c2` | Liên hệ: `src/lib/contact.ts` (email, Zalo, Facebook, Threads), `src/components/ContactLinks.tsx`, icon ở `public/brand/social/`; tooltip Zalo hiện số. Chân trang bỏ liên hệ giả, điện thoại gọn (850 → 549 px). |
| `713fc3e` | Ghi chú phiên 47. |
| `fe997cd` | Bảng vẽ: bấm chỗ trống trong khung **mọi nhóm** hoặc vùng đang chọn (≥ 2 hình) để kéo (`topHit`). Nấc độ dày bút `0,5 · 0,65 · 0,8 · 1 · 1,5 · 2` (hình khối giữ bộ cũ), ô xem trước đúng độ dày. |
| `e9a840c`, `35488e3` | Bảng vẽ (`render.ts` `penOutline`): lực nhấn bút thật đổi dày ~2 lần (đường cong `0,15 + 0,85·p^0,75`, `thinning` + `0,4 + 0,2·sens` khi có lực), `streamline` 0,3 cho bút thật; bảng vẽ báo `mouse` mà có lực ≠ 0,5 cũng nhận. Đã thử rồi **bỏ** `desynchronized` và `getPredictedEvents` vì gây chớp. |
| `f39ea77` | `/api/llm`: **DeepSeek chính hãng ưu tiên 1, opencode ưu tiên 2** (env `DEEPSEEK_*` đã có trên Vercel production). Bảng giá ước tính 1 đề 20 điểm, slide 15 trang 26 điểm (khớp Điều khoản mục 5). Test `test:ai-stream` đổi theo thứ tự mới. |

## Quyết định đã chốt

- Chuyển thiếu cộng theo giá nạp lẻ ngay (không chờ người dùng chuyển nốt); phần chuyển thêm sau khi link đã khoá phải cộng tay.
- Liên hệ công khai: email + icon Zalo/Facebook/Threads (số Zalo chỉ trong tooltip và link `zalo.me`).
- Ô tick điều khoản nhớ theo máy, không lưu lên server.
- Số điểm trong Điều khoản là chữ cố định — đổi giá trong admin thì phải sửa tay `Legal.tsx` và `USAGE` trong `src/lib/pricing.ts`.

## Bẫy mới

- Canvas `{ desynchronized: true }` làm nét đang viết chớp trên Windows (mỗi khung xoá rồi vẽ lại, canvas đó đưa từng lệnh lên màn hình ngay); trên Android thành tấm đen. Công cụ chụp màn hình của trình duyệt pane **không bắt được** lớp canvas này — đừng kết luận "không vẽ" từ ảnh chụp, đọc `getImageData`.
- Nét đang viết được vẽ ở hai chỗ (`redrawLive` và trong `paint` của `BoardEditor`): thêm gì chỉ vào một chỗ là chớp.
- `scripts/test-payment.ts`: bản giả DB phải trả `created_at` và hiểu `status=neq.` / `in.(`; bản giả PayOS trả `amountPaid` 0 khi chưa trả.
- `docs/handoff/README.md` là file `mixed` (lẫn CRLF/LF) — sửa bằng công cụ sửa file, đừng ghi lại cả file.
