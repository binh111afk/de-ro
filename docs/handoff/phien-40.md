# Phiên 40 (15/11/2026): công cụ trình chiếu, nhóm/khoá, video + ảnh slide, hoạt ảnh chạy thử, lịch sử điểm AI, lề trang soạn đề, dero.id.vn chạy

Tiếp [phiên 39](phien-39.md). Mọi việc đã lên `main` và đã push (code cuối `5726249`). **1 migration mới, đã áp lên Supabase**: `20261124_ai_credit_events.sql`. Đã dọn sạch nhánh cũ; **agy được giao 10 bộ màu sáng** (mục 0 dưới đây) nên có thể đang có nhánh `feat/10-bo-mau-sang`.

## Việc còn treo (không phải tính năng mới)

> Người dùng dặn: **chưa tự đề xuất thêm tính năng cho soạn thảo** (ribbon soạn đề, tab "Đề thi"…) — người dùng sẽ tự quyết sau.

0. **Giao agy: 10 bộ màu slide mới, tất cả nền sáng (18 → 28 bộ).** Prompt: [docs/prompt-10-bo-mau-sang.md](../prompt-10-bo-mau-sang.md), nhánh `feat/10-bo-mau-sang`, worktree `../dethinhbien-bo-mau`, cổng 5191. Khi agy báo xong, phiên sau phải:
   - review diff (mẫu chuẩn là commit `7530f89`), kiểm EOL hai phía trước khi gộp;
   - **preview cho người dùng xem**: mở `/preview-designs` và panel trái › Mẫu › Bộ màu, chụp đủ 10 bộ mới (Tiêu đề, một slide nội dung, Kết thúc) gửi người dùng duyệt **trước khi merge**;
   - chạy `npm run test:designs`, `test:slide-theme`, `test:slide-plan`, `test:slide-contrast`; áp cả 28 bộ lên deck 7 slide → bố cục không đổi;
   - người dùng đồng ý mới merge, push, xoá worktree + nhánh (tắt dev server 5191 trước khi xoá thư mục).
0b. **Tính năng mới người dùng giao: đăng nhập bằng Google.** Ghi chú để bắt đầu (chưa làm gì):
   - Auth hiện tự gọi REST Supabase, không dùng `supabase-js` (`src/lib/auth.ts`: `signIn`, `signUp`, `requestReset`…). Trang đăng nhập/đăng ký: `src/pages/Auth.tsx`.
   - **Đã có sẵn chỗ nhận token khi quay về**: `consumeAuthRedirect()` (gọi ở `src/App.tsx`) đọc `#access_token=…&refresh_token=…` trên URL, lấy `/auth/v1/user` rồi `saveSession`. Nên nút Google chỉ cần chuyển trang tới `${VITE_SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=<origin>/` (luồng implicit trả token qua hash). Cân nhắc PKCE nếu muốn chặt hơn (cần thêm bước đổi `code`).
   - **Phần người dùng phải làm (Claude không tự làm được)**: tạo OAuth Client trong Google Cloud Console (Authorized redirect URI = `https://ddcyhsxytbcdpgpggexh.supabase.co/auth/v1/callback`), rồi bật provider Google trong Supabase › Authentication › Providers, dán Client ID + Secret. Trong Supabase › URL Configuration thêm `https://dero.id.vn` (và `http://localhost:5184` để thử) vào Redirect URLs.
   - Cần xử lý: tài khoản Google trùng email tài khoản mật khẩu có sẵn (Supabase tự liên kết nếu email đã xác minh — kiểm lại), tên + ảnh đại diện lấy từ `user_metadata` (`full_name`, `avatar_url`) trong `toUser`, quà chào mừng 120 điểm vẫn chạy như tài khoản thường.
   - Nút "Tiếp tục với Google" đặt trên cả trang đăng nhập và đăng ký; dùng logo Google chuẩn (màu gốc, nền trắng) theo hướng dẫn thương hiệu của Google.
1. **Thử thật** (khung trình duyệt của app không kiểm được):
   - Màn người trình bày bằng cửa sổ bật lên trên Chrome thật (khung app chặn popup, mới thử phần dự phòng nổi trên màn chiếu).
   - Mở PPTX bằng PowerPoint thật: video YouTube phát trực tuyến; ảnh cắt + bo góc + bóng đúng.
   - Nút **Thay ảnh** (cần chọn tệp từ máy); hộp thoại **In** với lề/hướng tuỳ chỉnh.
   - Chuyển động hoạt ảnh (chạy thử trên slide, thẻ hiệu ứng khi rê chuột) — khung app đứng hình nên chỉ kiểm được bằng code.
   - Đề Toán sau khi đổi mức suy luận (treo từ phiên 39).
2. **Thiết lập trang soạn đề chưa lưu theo từng đề** (lề, hướng, màu, viền): tải lại trang là về mặc định 2 cm / dọc. Có từ trước, chưa sửa.
3. **Để sau, chỉ làm khi người dùng cần — tải video từ máy lên.** Vercel giới hạn thân request/response ~4,5 MB nên không đi qua `/api/upload` / `/api/files` được. Nếu làm: server ký presigned PUT cho R2 (đã có SigV4 trong `server/r2.ts`), trình duyệt gửi thẳng lên R2 (bật CORS bucket), `/api/files/vid/...` redirect sang presigned GET để tua được; ~200 MB, chỉ mp4/webm. **Không dùng Cloudinary** (tính phí băng thông theo lượt xem; R2 không tính phí tải xuống).
4. **Bỏ hẳn: xuất hiệu ứng ra PPTX** (người dùng quyết định, Canva cũng hạn chế).
5. Treo từ trước: `BoardEditor.tsx` ~2.900 dòng, Vercel `ANYROUTER_API_KEY`, `AI_SETTINGS_SECRET`.

## Đã làm

### Slide — trình chiếu (`src/examEditor/PresentTools.tsx`, `SlideEditor.tsx`)
- Thanh dưới khi chiếu: con trỏ, **bút vẽ** (6 màu), **laser**, **tẩy**, xoá nét, **đồng hồ**, nút màn người trình bày. Phím `P` / `L` / `E`; Esc lần đầu cất bút, lần nữa mới thoát. Nét vẽ theo slide (toạ độ 0–1), chỉ sống trong buổi chiếu.
- **Màn người trình bày**: `window.open` + `createPortal` (slide n/tổng, đồng hồ, ghi chú `Slide.notes`, tiêu đề slide sau, ←→). Popup bị chặn → bảng nổi góc trái màn chiếu.
- **Tiến ở slide cuối (đã hiện hết hiệu ứng) thì thoát trình chiếu** — mọi cách tiến.

### Slide — nhóm và khoá
- `SlideElement.groupId?`, `locked?`. `Ctrl+G` / `Ctrl+Shift+G` / `Ctrl+Shift+L`. Bấm thành viên chọn cả nhóm, bấm lần nữa chọn riêng. Phần tử khoá không kéo/đổi cỡ/xoay/xoá/cắt (`.slide-el-lock`). `Ctrl+D` bỏ `groupId`/`locked`.

### Slide — video
- `type: 'video'`, link ở `src`; `parseSlideVideo` (`src/lib/slideVideo.ts`): YouTube (`youtu.be`, `shorts`, `?t=`), Vimeo, tệp https `.mp4/.webm/.ogg/.mov`; link lạ / `javascript:` → null.
- Chèn: **Chèn › Video** (đang chọn video thì bấm lại để đổi link). `VideoView` (`slideRender.tsx`): bản soạn/thu nhỏ chỉ ảnh bìa; prop `live` (trình chiếu) mới nhúng iframe `youtube-nocookie` / Vimeo / `<video>`.
- PPTX: YouTube → `addMedia({ type: 'online' })` + ảnh bìa; Vimeo/tệp → khung "▶ Video" có link.

### Slide — tab "Định dạng ảnh" (agy làm, đã review + gộp `6ed25fe`)
- Thay ảnh, **Cắt** (kéo 8 tay nắm trên slide, khung co theo; Enter/bấm ngoài = xong, Esc = huỷ; chỉ ảnh chưa xoay), Bỏ cắt, khung hình, bo góc (`radius`), bóng 4 mức (`shadowLevel`, `filter: drop-shadow` bọc ngoài clip-path), viền (`border*`). Field mới `SlideElement.crop?: {l,t,r,b}` (% ảnh gốc).
- Dùng chung `imageImgStyle` / `imageStyleParts` (`slideRender.tsx`) cho bản soạn và bản xem; `photoFrameRadius` (`slideShapes.ts`) vẽ khung bo góc bằng `border-radius` để viền bám mép.
- PPTX (`exportDeck.ts`): cắt + bo góc + khung + viền nướng sẵn bằng canvas thành PNG nền trong suốt (`renderImageForPptx`); bóng → `shadow outer`; giữ lật/xoay/độ mờ.
- Đã thử: cắt, bóng, hoàn tác/làm lại (`Ctrl+Z` / `Ctrl+Shift+Z`), trình chiếu, xuất PPTX (có `outerShdw`, góc PNG trong suốt, video vẫn còn).

### Slide — hoạt ảnh
- **Chọn hiệu ứng / tốc độ / hiện từng dòng thì phần tử chạy thử ngay trên slide** (`AnimPreview` trong `SlideEditor.tsx`: phủ bản sao, ẩn bản thật bằng `<style>[data-el-id]{visibility:hidden}`, dùng `RevealLayer` như lúc chiếu; không ghi lịch sử). "Hiện từng dòng" chỉ chạy thử cả hộp.
- **Thẻ chọn hiệu ứng** (tab Hoạt ảnh, `slide.css` `.slide-anim-chip*`): một hàng 8 thẻ, khung slide nhỏ + minh hoạ tĩnh (bóng nét đứt ở chỗ xuất phát, Hiện dần = dải nhạt dần, Phóng to = ô nhỏ trong khung đích); rê chuột thì diễn lặp.

### Slide — thanh nổi
- Bỏ A−/A+, Đậm, Nghiêng, Màu chữ, Căn lề khỏi thanh nổi (hộp chữ và chữ trong hình) — đã có trên ribbon. Giữ Thêm/Sửa chữ trong hình, màu tô/viền hình, màu đồ hoạ.

### Icon dùng chung toàn web
- `src/components/appIcons.tsx`: `TrashIcon`, `BucketIcon` (`TRASH_D`, `BUCKET_D` lấy từ bảng vẽ). Thay mọi `Trash2` (lucide, 18 file), `IconTrash` ribbon, nút "Xoá cả bảng", `IconFillColor` slide. Giữ nguyên icon xoá hàng/cột/bảng.

### Hồ sơ — lịch sử điểm AI
- Bảng `ai_credit_events (user_id, kind, tokens, created_at)`, RLS chỉ đọc dòng của mình, chỉ hàm service ghi. `claim_ai_welcome` ghi `welcome` khi thật sự vừa tặng; `grant_ai_credits` ghi `admin`. **Hoàn điểm không ghi** (người dùng chọn); **không ghi bù** tài khoản cũ.
- Hồ sơ › thẻ Điểm AI › **Lịch sử điểm**: 20 lần mới nhất (`CreditHistory` trong `Profile.tsx`, nhãn ở `EVENT_LABELS` — thêm điểm danh sau này: ghi `kind: 'checkin'` + thêm nhãn).

### Soạn đề — lề và hướng trang (cuối phiên)
- `PageSetup.margins?` (cm từng cạnh, thiếu thì lấy `marginCm`), `marginsOf()`; `pageGeometry` trả `MARGIN_TOP/RIGHT/BOTTOM` (`MARGIN` = lề trái). Khung soạn, ngắt trang, thước (kéo trái/phải độc lập, đủ 29,7 cm khi ngang) dùng đúng 4 lề.
- Ribbon Bố cục › Thiết lập trang: nút lớn **Lề** (5 mẫu có hình minh hoạ: Thường, Hẹp, Vừa, Đề thi trái 3 cm, Rộng + 4 ô tuỳ chỉnh) và **Hướng** (Dọc/Ngang, icon đúng) — `MenuButton`, `PageGlyph`, `OrientGlyph` cuối `Ribbon.tsx`.
- **In/PDF và Word giờ theo lề + hướng của trình soạn** (trước đây cố định 1,8 × 1,6 cm, luôn dọc): `printDoc(doc, page)` ghi đè `@page`; `exportDocBlocks(doc, { landscape, margins })` → `w:pgMar`.
- Commit `5726249`, đã push.

### Tên miền dero.id.vn — đã chạy
- Vercel không tạo được DNS zone cho `dero.id.vn` (API: `not a DNS zone`) → máy chủ Vercel từ chối trả lời. Đã chuyển DNS về **iNET** (portal.inet.vn): NS `ns1.inet.vn`, `ns2.inet.vn`; `A @ → 216.198.79.1`, `CNAME www → 8ef114a07f70902a.vercel-dns-017.com`. `https://dero.id.vn` 200; `www` 308 về tên miền chính. Bản ghi DNS sau này tạo trên iNET.

### Dọn nhánh
- Xoá toàn bộ nhánh đã gộp (local + GitHub), kể cả `feat/khung-chuong-trinh` (15 file JSON của nó đã có giống hệt ở `scripts/khung/ban-goc/nhanh-khung/` và đã ghép vào `src/data/khung*.json`).

## Lưu ý cách làm
- **Kiểu xuống dòng**: nhiều file là CRLF. `sed -i` của Git Bash và Python `open()` mặc định ghi LF cả file → diff phình và gộp nhánh xung đột cả file. Sửa bằng Python đọc/ghi bytes, kiểm `git ls-files --eol`. Trước khi gộp nhánh agy, đưa EOL hai phía về như bản gốc.
- Heredoc bash dài chứa JSX/`'` hay vỡ → viết script vào scratchpad bằng Write rồi `python <file>`.
- Khung trình duyệt của app: chặn popup; khi bị ẩn/đứng hình thì `requestAnimationFrame` và CSS transition không chạy → ribbon soạn đề luôn khoá (editor báo lên qua rAF). Thử được bằng cách chạy `window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16)` rồi chuyển tab để ExamEditor mount lại. `screenshot` treo khi pane ẩn → dùng `javascript_tool` / `get_page_text`.
- Ribbon co lại ở khung hẹp → `resize_window` 1440×900; tab Trình chiếu/Hoạt ảnh có thể nằm trong menu "Thêm".
- Thử PPTX/Word không cần tải file: `import('/src/lib/exportDeck.ts')` → `buildDeckPptx(deck)` / `import('/src/examEditor/docxBlocks.ts')` → `buildDocxBlob(...)`, mở bằng JSZip (`/node_modules/.vite/deps/jszip.js`); deck ở `localStorage['soandethi-docs'].state.myDecks`.
- Phím trong trang thử: bắn `keydown` lên `document.body` một lần (bắn cả `document` lẫn `window` sẽ chạy hai lần, vd hoàn tác 2 bước).
