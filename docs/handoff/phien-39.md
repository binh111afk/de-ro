# Phiên 39 (14–15/11/2026): bộ màu slide, gộp slide AI, hoàn điểm, điểm AI tặng một lần, mức suy luận low, ribbon slide, hoạt hình từng đối tượng

Tiếp [phiên 38](phien-38.md). Mọi việc code dưới đây **đã lên `main` và đã push** (commit cuối `b9c8965`). **3 migration mới, đều đã áp lên Supabase**: `20261122_ai_refunds.sql`, `20261123_ai_welcome_points.sql`, `20261123b_ai_welcome_reset_usage.sql`. Không còn nhánh / worktree agy nào treo.

## Việc nên làm tiếp (chọn cùng người dùng)

1. **Ribbon soạn slide — phần còn lại** (người dùng đã đồng ý làm, để phiên sau). Thứ tự đề xuất:
   1. **Trình chiếu**: bút vẽ + bút laser lên slide khi chiếu, ghi chú người trình bày ở màn riêng (`Slide.notes` đã lưu sẵn), đồng hồ hẹn giờ. Đụng bộ máy trình chiếu trong `SlideEditor.tsx` → Claude tự làm.
   2. **Khoá + nhóm đối tượng**: web hiện chỉ có chọn nhiều (`groupIds` trong `SlideEditor.tsx`), **chưa có nhóm cố định, chưa có khoá** → làm mới (field kiểu `groupId?` / `locked?` trên `SlideElement`, kéo/xoá/căn cả nhóm, đối tượng khoá không kéo được). Claude tự làm.
   3. **Ảnh**: cắt ảnh, thay ảnh giữ vị trí/kích thước, đổ bóng, bo góc (tab `pictureFormat`). Có thể giao agy.
   4. **Video**: chưa có loại phần tử video → thêm `type: 'video'` (link YouTube / tệp R2), vẽ trong `slideRender.tsx`, chỉ phát khi trình chiếu; xuất PPTX thay bằng ảnh + link.
   5. **Xuất hiệu ứng ra PPTX**: hiệu ứng từng đối tượng (`anim`, `animMs`, `step`, `lineStep`) hiện chỉ chạy trên web; `src/lib/exportDeck.ts` chưa ghi timing PowerPoint.
2. **Thử thật trên web sau deploy** (chưa kiểm được):
   - Tạo 1 đề Toán THPT QG: phải ra trong ~2–3 phút và do **deepseek** soạn (xem bảng `ai_calls`: `select model, ok, error, ms from ai_calls order by created_at desc limit 5`). Nếu vẫn thấy `quá thời gian chờ` rồi `mercury-3` → nâng `LLM_TIMEOUT_MS` hoặc hạ thêm độ dài prompt.
   - Tài khoản mới đăng nhập → Hồ sơ hiện **120 điểm**.
   - Ribbon: chỉ số trên/dưới (có và không bôi đen), cây cọ sao chép định dạng (bấm 1 lần / bấm đúp / Esc), tải PPTX có gạch ngang + link + số trang + chân trang.
3. **Functions Storage Vercel** (10 GB gói Hobby, lúc bàn giao báo 100%): đã xoá 182 bản deploy cũ + bật tự xoá sau 30 ngày. Nếu 1–2 ngày sau vẫn ~10 GB thì nguyên nhân không phải deploy cũ → bấm ⓘ trên trang Usage hoặc hỏi Vercel. Mỗi bản deploy ~50 MB (9 function trong `api/` mỗi cái gói riêng thư viện server); muốn giảm hẳn thì gộp function — chưa cần.
4. Còn treo từ phiên trước: tên miền `dero.id.vn` (phiên 38), `BoardEditor.tsx` ~2.900 dòng, Vercel `ANYROUTER_API_KEY`, `AI_SETTINGS_SECRET`.

## Đã làm

### Slide — bộ màu (panel trái › Mẫu › Bộ màu)
- Picker bộ màu nằm ở **panel trái**, Segmented `Bố cục | Bộ màu` (`SlideSidePanel.tsx`, khoá localStorage `slide-template-mode`), thẻ 2 cột (`SlideDesignGrid.tsx`). Ribbon tab Thiết kế chỉ còn nút **"Bộ màu…"** mở panel (lưới bộ màu trên ribbon đã bỏ vì trùng).
- **Áp bộ màu chỉ đổi kiểu, không đổi bố cục**: `applyDeckDesign` (`src/lib/slideEdit.ts`) + `keepGeometry` giữ `x, y, w, h, rotation, fixedHeight, align, valign, fontSize, flipX, flipY`; chỉ lấy màu/phông/nền/viền/bóng từ skin và thêm motif id `skin-motif-*` / `decor-kit-*`. Thẻ **"Mặc định"** đưa về `DECK_THEMES[0]` (Sáng), xoá `style`/`design`.
- agy thêm **10 bộ màu** (tổng 18; 8 sáng: Pastel mầm non, Biển xanh, Sổ tay ô li, Cam năng động, Lịch sử cổ, Phòng thí nghiệm, Bắc Âu tối giản, Hoạ sĩ màu nước; 2 tối: Vũ trụ, Rừng đêm), phông mới `@fontsource/patrick-hand`, `@fontsource/space-grotesk` (có subset tiếng Việt). Đã kiểm: áp cả 18 bộ lên deck 7 slide → 0 slide đổi bố cục, A→B→A ra cùng kết quả.

### AI — chi phí và hạn mức
- **Gộp 4 slide mỗi lần gọi** (`generateSlideBatch`, `SLIDE_BATCH = 4` trong `AiPanel.tsx`; prompt `batchSystemPrompt` / `parseBatchSlides` trong `src/lib/slideAi.ts`). Đo thật 15 slide: 16 → 5 lượt, **71.245 → 41.305 token (−42%)**, chi phí ước ~−27% (đầu ra đắt hơn đầu vào).
- **Hoàn điểm khi AI trả kết quả hỏng**: server cấp **biên nhận HMAC** mỗi lượt thành công (`issueReceipt` trong `server/aiQuota.ts`, ký bằng `AI_RECEIPT_SECRET` hoặc service key); client gọi lại kèm header `x-ai-retry-of` → `refund_ai_usage` hoàn token (mỗi biên nhận 1 lần, sống 15 phút, ≤ 20 lần/người/ngày; lượt gọi lại không có biên nhận). Client: `callLlmChecked` + `retryOf` trong `src/lib/llm.ts`; áp ở đề JSON hỏng, dàn ý slide hỏng, cả nhóm slide hỏng, lượt sửa từng slide. Lỗi mạng / 5xx thì `callLlm` tự gọi lại 1 lần (không tốn điểm vì server chỉ trừ khi thành công).
- **Chỉ người đã đăng nhập mới dùng AI**: `/api/llm` và `/api/image` trả 401 cho khách (`LOGIN_REQUIRED` trong `server/guard.ts`; máy dev localhost vẫn dùng được). Khung AI hiện nút Đăng nhập thay ô nhập. **Đã xoá hạn mức khách theo ngày.**
- **Điểm AI tặng một lần**: 1 điểm = 1.000 token (`TOKENS_PER_POINT`, khớp ở `src/lib/llm.ts`). Lần đầu dùng AI / mở Hồ sơ, `claim_ai_welcome` cất **120 điểm** (`AI_WELCOME_POINTS`, mặc định 120; ban đầu 200, đã hạ) vào `ai_credits`. Hạn mức tháng mặc định 0 (`AI_MONTHLY_TOKENS`, giữ để bật lại). Hết điểm báo "Gói nạp thêm điểm sẽ sớm có" — **gói nạp chưa làm**. Khung AI và Hồ sơ hiện "Còn N điểm". Tài khoản đã nhận 200 điểm trước đó giữ nguyên. Đã đưa `ai_usage.tokens` tháng 11 về 0 một lần (migration `20261123b`) để token dùng theo cách cũ không bị trừ vào điểm.
- **Mức suy luận low cho cả đề và slide** (`AI_EFFORT` trong `AiPanel.tsx`), **thời gian chờ model 120 → 250 s** (`DEFAULT_UPSTREAM_TIMEOUT_MS`, `server/llmProxy.ts`; function Vercel tối đa 300 s). Đo thật (deepseek-v4.1-flash):

  | | Token | Thời gian | Ghi chú |
  |---|---|---|---|
  | Đề Toán max | 34.337 | 240 s | |
  | Đề Toán medium | 31.136 | 214 s | |
  | **Đề Toán low** | **23.587** | **160 s** | đúng 12/4/6, soát tay ~15 câu không sai |
  | 15 slide medium | 51.671 | | |
  | **15 slide low** | **44.191** | | chất lượng ngang |

  **Phát hiện**: với thời gian chờ 120 s cũ, model chính **luôn bị cắt khi soạn đề** rồi rơi sang `mercury-3` — đề mercury có ≥ 3 câu sai (hai phương án bằng nhau, đáp án sai). Đo lại: `npm run eval:exam -- max high medium low` (đặt `LLM_TIMEOUT_MS=400000` khi đo để không bị cắt), `npm run eval:slides -- "<chủ đề>" --batch --effort low`. Log từng lượt gọi: bảng `ai_calls` trên Supabase, hoặc `%TEMP%/dethinhbien-llmlog/` khi chạy máy.
- Ước tính 120 điểm: ~3 bộ slide 15 trang (~41 điểm/bộ) hoặc ~4–6 đề Toán (~24 điểm/đề ở low).

### Ribbon soạn slide
- **Trang đầu**: danh sách gạch đầu dòng / đánh số (bật-tắt), giãn dòng, căn dọc chữ; agy thêm gạch ngang, tô sáng (`highlight`, vẽ bằng span `box-decoration-break`, không dùng `fill`), chỉ số trên/dưới, xoá định dạng, cây cọ sao chép định dạng (`src/lib/slideFormat.ts`).
- **Chèn**: Công thức (10 mẫu KaTeX, chèn hộp chữ `$…$`), Icon (mở panel Icon qua `openIconsSignal`), agy thêm Liên kết (`href`, chỉ http/https), Ký hiệu đặc biệt, Số trang + chân trang (`Deck.footer`, vẽ ở `SlideFooterView` trong `slideRender.tsx`, có trong PPTX).
- **Thành phần**: Thứ tự lớp, Căn vào slide, Lật ngay trên ribbon. **Xem**: Lưới 16×9, bật/tắt đường gióng (`setSnapEnabled` trong `slideEditParts.tsx`; nhớ localStorage `slide-grid`, `slide-snap`).
- **Hoạt ảnh — hiệu ứng từng đối tượng**: 7 kiểu (`fade, rise, drop, left, right, zoom, spin`), tốc độ (`animMs`), hiện từng dòng (`lineStep`), ↑/↓ đổi lần bấm (tự đánh số lại liền mạch) — `applyElementAnim` trong `src/lib/slideAnim.ts`, test `npm run test:slide-anim`. Số lần bấm hiện trên slide khi ở tab Hoạt ảnh; chọn đối tượng ở tab này không tự nhảy sang tab Thành phần.
- **Bảo mật**: link được kiểm lại bằng `normalizeSlideHref` lúc trình chiếu và xuất PPTX (bài chia sẻ / nhập tệp có thể chứa sẵn `javascript:`).

### Vercel
- Xoá 182 bản deploy cũ (giữ 10 mới nhất) bằng `npx --no-install vercel rm`; bật **Deployment Retention** qua `vercel api /v9/projects/de-ro/deployment-expiration` (PATCH: `expiration` 1m, `expirationProduction` 1m — Hobby tối đa 1m, `expirationCanceled` / `expirationErrored` 1w).

## Lưu ý cách làm
- Script Python sửa file: viết ra file trong scratchpad rồi chạy (heredoc dài có `\` bị kiểm tra an toàn chặn nhầm). Chuỗi `\n` trong heredoc Python thành xuống dòng thật trong JS.
- `node_modules/.bin` có lúc mất sau `npm install --silent` → chạy `node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit` hoặc `npm install` lại.
- Thử ribbon trong trình duyệt: khung hẹp thì ribbon co lại → `resize_window` 1440×900; chọn phần tử slide bằng cách bắn `pointerdown/mousedown/…` vào phần tử chứa chữ (click theo toạ độ hay trượt).
- Migration sửa dữ liệu hàng loạt (vd đưa `ai_usage` về 0) bị chặn tự động → hỏi người dùng, có đồng ý mới áp.
