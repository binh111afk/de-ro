# Phiên 49 — prompt AI chuyển lên server, vá lộ thông tin ra trình duyệt, admin (chi phí AI, điểm, thu theo kỳ, mobile), kho hình +74

Ngày 19–20/11/2026. Nhánh `main`, commit cuối `4d9dff8` (đã push, repo chỉ còn nhánh `main`). Migration mới `20261207`, `20261208` (**đã áp** lên DB `dethinhbien`, id `ddcyhsxytbcdpgpggexh`).

## Việc phiên sau

1. **Người dùng tự thử trên bản chạy thật** (chỉ có test và thử máy dev): bảng vẽ, sửa slide, tìm web, hỏi lại, sửa câu, vẽ đồ thị, chọn hình, AI ngân hàng, ma trận, đề online, soạn đề có đính kèm, slide đủ luồng. Lỗi cần để ý: **"Tác vụ AI không hợp lệ."** hoặc **"Phiên bản trang đã cũ, hãy tải lại trang (F5)"** (client cũ chưa có `task`). Công tắc khẩn: biến Vercel `AI_ALLOW_TASKLESS=1` cho `/api/llm` chạy lại không cần `task` (chỉ tạm thời).
2. **Giá ước tính chi phí AI** (`server/ops.ts` `DEFAULT_PRICE`, USD / 1 triệu token: DeepSeek 0,27 / cache 0,027 / ra 1,1; anthropic 3 / 0,3 / 15; các nhà khác 0,27 / 0,27 / 1,1) là **số ước chừng, chưa đối chiếu giá thật**. Chỉnh bằng biến Vercel `AI_PRICE_<NHÀ_CUNG_CẤP>="vào,cache,ra"` (`DEEPSEEK`, `OPENCODE`, `FOSTA`, `ANYROUTER`, `NIGHTROUTER`, `ANTHROPIC`). Chỉ các lượt gọi **sau deploy** có chi phí, dòng `ai_calls` cũ vẫn `null` ("—").
3. **Chưa kiểm trên production**: header bảo mật mới (`curl.exe -sI https://de-ro-lac.vercel.app`), tab Nạp điểm với đơn thật (dòng so sánh kỳ trước, thu theo tháng), tên người đăng đề cộng đồng, kho hình mới do AI soạn đề dùng (thử đề Toán tiểu học có hình), tooltip biểu đồ trên điện thoại.
4. Lỗi nhỏ còn lại: `catch` giữ `err.message` có chủ ý ở `server/admin.ts` (lỗi nghiệp vụ, `pingProvider`, `handleVision`), `server/extract.ts` (cảnh báo tệp người dùng tải), `pingProviders`, `pingR2` — chỉ admin hoặc người dùng thấy, không phải lỗ hổng. `Access-Control-Allow-Origin: *` giữ nguyên (đã có `guard` chặn Origin lạ); chưa thêm CSP (dễ làm hỏng KaTeX, font, ảnh R2).
5. Người dùng chưa quyết: hỏi về tiếng Nhật / Trung / Pháp… — chỉ tiếng Anh có khung chương trình (`khungAnh.json`); các tiếng khác AI ra theo hiểu biết chung, chưa thử xuất Word với chữ CJK. Hiện ở trạng thái "trả lời rồi, chưa làm gì".
6. Còn treo từ [phiên 48](phien-48.md) mục 2–5: bảng vẽ chớp (chờ phản hồi), đọc PDF ngân hàng (opencode, chưa thử PDF thật), `DEEPSEEK_STRONG_MODEL` / `ANYROUTER_API_KEY` trên Vercel, xoá `MERCURY_*` `TAVILY_*`, tắt r2.dev bucket R2, các điểm phụ Strix a70c cần migration. Mục 1 của phiên 48 (prompt lộ trình duyệt) **đã xong**.

## Đã làm (theo nhóm)

| Commit | Nội dung |
|---|---|
| `69af5fa` | Không gửi tên model về trình duyệt (kết quả `/api/llm`, SSE `done`, lỗi 502); chỉ máy dev (`isLocal(ip)`) còn thấy. |
| `65d4524`, `5a7e80b`, `837fc03`… `209d15b` | **Prompt hệ thống do server ghép.** Client gửi `task` + `taskInput` + tin nhắn người dùng (`callLlm(..., { task: { name, input } })` trong `src/lib/llm.ts`); `server/aiTasks.ts` bảng `TASKS` (soan-de, hoi-truoc, slide-chat plan/chat/html, bang-ve, slide-lo, slide-trang, slide-sua, tim-web, de-online, sua-cau, ve-do-thi, chon-hinh, ngan-hang, ma-tran, sua-slide) dựng system; `role: system` của client bị bỏ. Chữ prompt thuần ở `src/lib/prompts/*`; phần slide / bảng vẽ ghép từ module nặng của client nằm ở **`server/generated/prompts.js` (sinh bằng esbuild, `npm run build:prompts`, `scripts/build-server-prompts.mjs`; `test:ai-prompts-slide` báo lỗi nếu cũ)**. Agy làm 7 chỗ nhỏ (de-online … sua-slide) trên nhánh riêng, đã gộp. |
| `fbf7069` | `/api/llm` **bắt buộc `task`** (không có → 400, trừ `isLocal` hoặc `AI_ALLOW_TASKLESS=1`; `task` lạ → 400). `test-ai-abuse` đặt `AI_ALLOW_TASKLESS=1`. |
| `135df8e`…`b38754e` | **Vá lộ thông tin** (nguồn: báo cáo rà soát của agy, đã đối chiếu): `server/http.ts` `safeError(err, local, fallback)` — production trả "Máy chủ đang bận, thử lại sau." (log `[server]`, tra ở Vercel Logs), máy dev vẫn thấy lỗi gốc; dùng ở 9 file `server/`; `/api/image` bỏ `model` + lỗi nhà cung cấp; `vercel.json` thêm `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`; dữ liệu giả admin tách `src/lib/adminMock.ts` + `adminContentMock.ts`, chỉ dynamic-import khi `import.meta.env.DEV`; bỏ ghi chú "Claude ghép/rà soát" khỏi `src/data/khung*.json`; `console.warn` nội dung AI chỉ ở DEV. |
| `e990b99` | Admin: **chi phí AI** — trước chỉ opencode báo `usage.opencode.list_cost`, các nhà cung cấp khác (DeepSeek ưu tiên 1) ghi `null` nên tổng đứng im; `costFromUsage(usage, provider)` + `estimateCost` ước từ token (tính cache). **Điểm**: `quota.get` thiếu dòng `ai_credits` thì trả quà chào mừng (`WELCOME_TOKENS()`, 120 điểm) + `welcomePending`, panel người dùng hiện "Chưa dùng AI, sẽ nhận ở lượt đầu" thay vì 0. Migration `20261207_community_authors_name.sql`: `community_authors` đọc `display_name → full_name → name` và `avatar_url → picture` (tài khoản Google trước hiện "Giáo viên"). |
| `31b5af7`, `74d8cb1` (agy) | Admin responsive điện thoại (Segmented cuộn ngang, nav `lg:`, drawer người dùng, KPI, bảng lọc…); Nạp điểm có Segmented Hôm nay / Tuần này / Tháng này / Tất cả. |
| `17e1564` | Nạp điểm: **so với kỳ trước cùng thời điểm** (hôm qua tới cùng giờ, tuần trước tới cùng thứ + giờ, tháng trước tới cùng ngày + giờ, chặn ở hết tháng trước) + thẻ **Thu theo tháng** (12 tháng, giờ VN). Tính bằng hàm SQL (migration `20261208_admin_revenue.sql`: `admin_revenue_ranges(timestamptz[], timestamptz[])`, `admin_revenue_monthly(int)`, chỉ `service_role`), thay cách kéo toàn bộ đơn (bị giới hạn dòng PostgREST). Server: `revenueRanges`, `buildRevenue` trong `server/adminPayments.ts`; `scripts/test-payment.ts` 45 ca. |
| `f006340` | Tooltip biểu đồ "Lượt gọi theo ngày" (`OpsPanel.tsx`): gắn `data-tip` vào đúng chiều cao cột thay vì cả cột (trước nằm tít đỉnh, xa cột thấp). |
| `f908613`…`4d9dff8` (agy) | **Kho hình +74** (97 → 171 đồ vật, 188 sprite): công trình (nhà chọc trời, nhà sàn, chùa, cầu, cối xay gió, giếng…), thang gấp, cầu thang, **vẽ lại `ladder` và `tower`**, đồ dùng, thực phẩm, động vật, phương tiện, dụng cụ khoa học. `src/data/figureSprites.json` gzip ~490 KB → ~790 KB (nạp lười cùng `loadTools`). Đã xem tay cả 76 hình: nét đồng nhất. |

Ngoài code: xoá 20 deploy Vercel cũ (còn 10 mới nhất, CLI `npx --no-install vercel rm`); áp 2 migration bằng MCP Supabase (cần người dùng cho phép rõ khi bị chặn); xoá các `docs/prompt-*` và `docs/bao-cao-*` của đợt agy này.

## Quyết định đã chốt

- Prompt AI **chỉ ở server**; client không bao giờ gửi chữ prompt hay `role: system`. Thêm tác vụ mới = thêm vào `TASKS` (`server/aiTasks.ts`) + hàm dựng system trong `src/lib/prompts/` + test byte (`scripts/test-ai-prompts*.ts` + fixture `scripts/fixtures/prompt-*-snap.json`).
- Chất lượng soạn đề / slide đo trước-sau (7 đề, 3 slide): cấu trúc, đáp án, hình giữ nguyên; token ngang hoặc giảm; prompt giữ **đúng từng byte** (sha256).
- Lỗi production trả câu chung, chi tiết chỉ ở log server.
- "Ai đang online": đã có ở admin tab Số liệu (`stats.online`, bảng `presence`, nhịp 2 phút); **không** hiện công khai vì lộ thông tin cá nhân.
- Chia việc: agent mạnh làm bảo mật, ước tính chi phí, quyết định thiết kế; agy làm việc máy móc (mobile, kho hình, 7 chỗ prompt nhỏ) trên nhánh riêng, agent mạnh xem diff + chạy lại test rồi gộp.

## Bẫy mới

- `scripts/test-payment.ts`: bản giả DB phải có `rpc/admin_revenue_ranges` và `rpc/admin_revenue_monthly`; payment mock vẫn phải trả `created_at`.
- Python / `sed` ghi `\n` vào file CRLF làm file `mixed`: sau khi sửa luôn `git ls-files --eol` (`server/admin.ts` từng bị).
- Thay đoạn giữa hai mốc bằng chỉ mục chuỗi dễ cắt nhầm hàm kế bên (`needOrder`, `total` trong `adminPayments.ts` từng bị mất): chạy test ngay sau khi sửa.
- Trình duyệt pane: trang dev mở ở `localhost` có thể trắng (WebSocket HMR); dùng `127.0.0.1:5184`. Cuộn bằng `scrollIntoView` trong `javascript_tool` đo rect trước khi cuộn xong — đo lại.
- `server/generated/prompts.js` (~745 KB) phải build lại (`npm run build:prompts`) mỗi khi đổi bất kỳ module prompt slide / bảng vẽ / sửa / web ở client.
- Sprite kho hình là `{w,h,ink,body}` vector; xem tay bằng cách vẽ SVG (`ink` fill-rule evenodd, `body` nền) rồi mở bằng trình duyệt pane (máy không có công cụ raster).
