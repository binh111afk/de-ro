# Phiên 41 (15/11/2026): đăng nhập Google, SEO, 10 bộ màu sáng, tải nhanh slide/bảng vẽ/soạn đề, vá 4 lỗi Strix, thanh Tìm

Tiếp [phiên 40](phien-40.md). Code cuối đã push: `154e557`. **Không có migration mới.** Repo chỉ còn nhánh `main` (đã gộp và xoá `feat/10-bo-mau-sang` + worktree `../dethinhbien-bo-mau`).

## Việc còn treo

> Người dùng vẫn dặn: **chưa tự đề xuất tính năng mới cho soạn thảo**, người dùng tự quyết.

1. **Thanh Tìm kiểu Google Docs, CHƯA COMMIT** (`src/examEditor/FindPanel.tsx`, `src/examEditor/compose.css`, `src/pages/ComposeDoc.tsx`).
   - Đã làm: hộp thoại giữa màn hình có nền tối (`5818ad5`) bị người dùng chê vì che kết quả, tắt thì không chuyển được kết quả khác. Đổi thành thanh nổi `absolute right-4 top-3` trong `.compose-center` (đã thêm `position: relative`), không nền tối. Một hàng: ô tìm + đếm `2/5`, ↑ ↓, ⇄ (mở hàng Thay thế), ✕. Mỗi lần nhảy kết quả thì `scrollIntoView()`, focus giữ ở ô tìm; Thay/Thay hết không lấy focus và tìm lại qua state `version`. Thêm Ctrl/Cmd+F (Tìm) và Ctrl/Cmd+H (Thay thế), chỉ ở tab đề thi (`docTabOpen`).
   - **Còn phải làm:** chạy lại `npx tsc -p tsconfig.app.json --noEmit` (lần cuối bị timeout 5 phút vì máy chậm, không phải lỗi code; lần trước khi thêm Ctrl+F đã qua). Thử trên dev với đề dài khoảng 40 câu: Ctrl+F → gõ chữ → kết quả được tô và cuộn tới, ↑↓ chạy, Thay/Thay hết đúng, Esc đóng. Khung trình duyệt của app phải đang hiện (bị ẩn thì timer bị bóp, script treo). Xong thì hỏi người dùng rồi mới commit.
   - Lưu ý khi thử: ribbon có bản đo ẩn nằm ngoài màn hình (`x≈1536`), nên `querySelector` nút "Tìm" hay trúng bản ẩn. Dùng Ctrl+F để mở.
2. **Kiểm trên dero.id.vn (người dùng làm, hoặc nhờ họ đăng nhập):**
   - Mở tài liệu ở Kho tài liệu / Đề tải lên: PDF phải mở tab mới, DOCX tải xuống đúng tên (bản vá vuln-0001 bắt buộc gửi token, xem dưới).
   - Hồ sơ: điểm AI hiện nhanh (`/api/quota`); tài khoản mới thấy ngay dòng "Quà chào mừng".
   - Đăng nhập Google trọn vòng (bấm tài khoản Google → về web đã đăng nhập) chưa ai xác nhận.
3. **Trang Quyền riêng tư / Điều khoản là bản sơ bộ** (`src/pages/Legal.tsx`), người dùng muốn bổ sung sau. Đang dùng để Google xác minh thương hiệu, **đừng xoá route** `/quyen-rieng-tu`, `/dieu-khoan`.
4. **File rác chưa commit:** `.rls-audit/`, `scripts/poc-llm-clamp-k7q2.ts`, `scripts/probe-imports.mts` (do công cụ pentest tạo, không phải code app), `.strix/`, `public/brand/logo-120.png` (logo 120px đã tải lên Google, giữ hay commit tuỳ người dùng). Hỏi người dùng trước khi xoá.

## Đã làm (đã push)

### Đăng nhập Google (`2b82bbc`, `d1c8fe0`, `6fd4372`)
- `signInWithGoogle()` trong `src/lib/auth.ts`: luồng implicit `/auth/v1/authorize?provider=google`, `consumeAuthRedirect()` ở App nhận token. `toUser` lấy tên/ảnh từ `full_name`/`name`/`picture`.
- Đăng ký bằng email đã có tài khoản (kể cả Google): Supabase trả `identities: []` → báo "Email này đã có tài khoản…" (chống tạo thêm tài khoản lấy điểm AI).
- Cấu hình ngoài code đã xong: Google OAuth client (Web, redirect `https://ddcyhsxytbcdpgpggexh.supabase.co/auth/v1/callback`), Supabase provider Google bật, Redirect URLs có `https://dero.id.vn/**`. Google Auth Platform: **Production**, thương hiệu đã xác minh (màn chọn tài khoản hiện "đề rõ" + logo). Search Console xác minh dero.id.vn bằng TXT ở iNET: **giữ bản ghi TXT `google-site-verification=…`**.
- Trang đăng nhập: bỏ icon bút lông, tiêu đề theo trang (Đăng nhập/Đăng ký/…), ẩn hình minh hoạ dưới `lg`.

### SEO (`b1c5d19`)
- `public/robots.txt` (chặn `/admin`, `/ho-so`, `/de-cua-toi`, `/preview-designs`), `public/sitemap.xml` (10 trang công khai), canonical + Open Graph trong `index.html`. Đã gửi sitemap lên Search Console: Thành công, 10 trang.

### 10 bộ màu slide nền sáng (agy, `3befe4c` + merge `f9dfded`)
- Người dùng tự xem `/preview-designs` và duyệt. 4 nhóm test slide đều qua. 28 bộ.

### Tải nhanh (lazy load)
- **Slide (`232ff7e`):** SVG đồ hoạ tách khỏi danh mục. `src/lib/graphicsMeta.ts` (sinh bằng `scripts/split-graphics.mjs`, các script import/vá đồ hoạ tự gọi ở cuối) nạp ngay, SVG ở `graphics.ts` tải bằng `loadGraphics()`. Icon Phosphor tải qua `src/lib/slideIcons.ts`. Component `GraphicFill`/`SlideIcon` ở `src/examEditor/LazyAssets.tsx`. `exportDeck` (react-dom/server) nạp lúc bấm tải PPTX. Chunk SlideEditor 382 → 70 KB gzip.
- **Bảng vẽ (`7666a46`):** ComposeDoc nạp sau ExamEditor (TipTap), AiPanel, FindPanel, DocSelectionAi, ToolsPanel (`tools/LazyToolsPanel.tsx`), xuất Word/in. Số đo trang A4 tách ra `src/examEditor/pageSetup.ts`. `deleteActions` nạp lúc bấm. Bảng vẽ ~756 → 416 KB gzip. Kèm sửa: tab bảng vẽ trống bị coi là đề trống khi bấm tạo Đề thi.
- **Soạn đề (`dc4c241`):** công cụ vẽ hình (`toolSpec`, `toolImages`, `plot`) nạp qua `loadTools()` trong ComposeDoc, tải sẵn khi trình soạn sẵn sàng. `ToolModal`, `BankModal` nạp khi mở. Soạn đề 493 → 332 KB gzip.
- Đo bundle: `npx vite build --manifest --outDir <tạm>` rồi đi theo `imports` từ chunk ComposeDoc (khoá trong manifest tên `_ComposeDoc-*.js`).

### Điểm AI (`dc4c241`, `24aed61`)
- `GET /api/quota` (`server/quota.ts`, `api/quota.ts`, route dev trong `vite.config.ts`): hàm nhỏ chỉ đọc điểm, khởi động nguội nhanh hơn `/api/llm`. Hồ sơ nhớ số lần trước trong localStorage theo user id.
- Lịch sử điểm đọc lại sau khi ô điểm tải xong (quà chào mừng chỉ được tặng lúc đọc điểm lần đầu → trước đây lịch sử đọc quá sớm).

### Vá 4 lỗi Strix (`5638178`, `154e557`), báo cáo ở `../strix_runs/dethinhbien_2b06/`
- **vuln-0003:** `maxTokens` cắt về `MAX_OUTPUT_TOKENS = 32000` và không vượt số token còn lại; `body.model` chỉ nhận model có trong cấu hình.
- **vuln-0004:** biên nhận hoàn điểm có `h = requestHash(messages, maxTokens)`; chỉ hoàn khi lượt gọi lại gửi đúng yêu cầu cũ. Body đọc trước khi hoàn/giữ chỗ.
- **vuln-0001:** `/api/files/doc/*` chỉ trả cho chủ tệp (hỏi `user_documents` bằng token người gọi, RLS quyết định), sai thì 404, `Cache-Control: private, no-store`. `img/` vẫn công khai. Client mở tài liệu qua `openDocument()` (`src/lib/documents.ts`); `sources.ts` dùng `apiFetch`.
- **vuln-0002:** `userFromToken` bỏ token không đúng dạng JWT hoặc > 4 KB; tối đa 60 lần hỏi Supabase / IP / 10 phút; cache khoá bằng sha256, đầy thì bỏ mục cũ nhất.
- Test: `npm run test:ai-abuse`, `npm run test:guard` (13 ca). **Test admin giờ phải dùng token dạng JWT**: đã đổi sang `Bearer h.<tên>.s` và mock bóc ra.

### Khác
- Ribbon soạn đề nhóm "Chỉnh sửa": 2 cột có chữ (`RibbonIconButton` nhận `label` → class `rb-icon--labeled`).

## Lưu ý cách làm
- **Strix cài nhầm esbuild Linux vào `node_modules`** (làm `tsx` trên Windows hỏng). Gặp lỗi "installed esbuild for another platform" thì chạy `npm install`.
- `sed -i` của Git Bash đổi CRLF → LF cả file (đã dính ở `SlideSidePanel.tsx`, `BoardEditor.tsx`, phải đổi lại). Sửa file CRLF bằng Python bytes hoặc công cụ Edit, rồi kiểm `git diff --stat`.
- Heredoc dài chứa dấu backtick hoặc `'''` trong Bash hay vỡ; file lớn thì dùng công cụ Write/Edit.
- Máy chậm: `tsc` toàn dự án có lúc quá 5 phút. Chạy nền, đừng chạy hai bản cùng lúc.
