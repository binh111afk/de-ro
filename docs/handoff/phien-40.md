# Phiên 40 (15/11/2026): công cụ trình chiếu, nhóm/khoá đối tượng, video slide, tên miền dero.id.vn chạy

Tiếp [phiên 39](phien-39.md). Mọi việc code đã lên `main` và đã push (commit cuối `9f8a6ca`). Không có migration mới. **Có giao agy một việc** (xem mục 1), nhánh `feat/anh-slide` có thể đang chạy.

## Việc nên làm tiếp

1. **Xem nhánh agy `feat/anh-slide`** (tab "Định dạng ảnh": thay ảnh, cắt, bo góc, bóng, viền + xuất PPTX). Prompt: [docs/prompt-anh-slide.md](../prompt-anh-slide.md), worktree `../dethinhbien-anh-slide`, cổng 5190. Khi agy báo xong: review diff, chạy thử đủ mục "Kiểm tra" trong prompt, rồi mới gộp vào `main`.
2. **Thử thật** (chưa kiểm được trong khung trình duyệt của app):
   - Màn người trình bày bằng **cửa sổ bật lên trên Chrome thật** (khung trình duyệt của app chặn popup nên mới thử phần dự phòng hiện ngay trên màn chiếu).
   - Mở file PPTX có video bằng PowerPoint thật: YouTube phải phát trực tuyến, ảnh bìa đúng.
   - Đề Toán sau khi đổi mức suy luận (việc treo từ phiên 39, mục 2).
3. **Để sau, chỉ làm khi người dùng cần — tải video từ máy lên.** Đã bàn và quyết định chưa làm. Lý do: Vercel giới hạn thân request/response ~4,5 MB nên không thể đi qua `/api/upload` / `/api/files`. Nếu làm: server ký presigned PUT cho R2 (đã có code SigV4 trong `server/r2.ts`), trình duyệt gửi thẳng lên R2 (cần bật CORS bucket), `/api/files/vid/...` trả redirect sang presigned GET để tua được; giới hạn ~200 MB, chỉ mp4/webm. **Không dùng Cloudinary**: tính phí băng thông theo lượt xem, R2 không tính phí tải xuống.
4. **Bỏ hẳn: xuất hiệu ứng ra PPTX.** Người dùng quyết định không làm (Canva cũng hạn chế).
5. Còn treo từ trước: `BoardEditor.tsx` ~2.900 dòng, Vercel `ANYROUTER_API_KEY`, `AI_SETTINGS_SECRET`.

## Đã làm

### Trình chiếu (`src/examEditor/PresentTools.tsx`, `SlideEditor.tsx`)
- Thanh dưới khi chiếu: con trỏ, **bút vẽ** (6 màu), **laser**, **tẩy**, xoá nét slide, **đồng hồ** (dừng/chạy/đặt lại), nút màn người trình bày. Phím tắt `P` / `L` / `E`; Esc lần đầu cất bút, lần nữa mới thoát. Nét vẽ lưu theo slide (toạ độ 0–1), chỉ sống trong buổi chiếu.
- **Màn người trình bày**: `window.open` + `createPortal` — slide n/tổng, đồng hồ, tiêu đề, ghi chú (`Slide.notes`), tiêu đề slide sau, nút/phím ←→. Popup bị chặn thì hiện bảng nổi góc trái trên màn chiếu.
- **Bấm tiến ở slide cuối (đã hiện hết hiệu ứng) thì thoát trình chiếu** — mọi cách tiến (phím, mũi tên mép, nút "Slide sau", bấm slide).

### Nhóm và khoá đối tượng
- Field mới trên `SlideElement`: `groupId?`, `locked?` (`src/store/docs.ts`).
- `Ctrl+G` nhóm, `Ctrl+Shift+G` rã nhóm, `Ctrl+Shift+L` khoá/mở. Bấm một thành viên chọn cả nhóm, bấm lần nữa chọn riêng nó. Kéo cả nhóm; phần tử khoá không kéo/đổi cỡ/xoay/xoá, hiện huy hiệu khoá (`.slide-el-lock`). Nút Nhóm/Rã nhóm trên `GroupToolbar`, nút khoá trên `SelectionToolbar`. `Ctrl+D` nhân bản bỏ `groupId`/`locked`.

### Video trên slide
- `type: 'video'`, link nằm ở `src`. Đọc link: `parseSlideVideo` trong `src/lib/slideVideo.ts` (YouTube kể cả `youtu.be`, `shorts`, `?t=`; Vimeo; tệp https `.mp4/.webm/.ogg/.mov`; link lạ/`javascript:` → null).
- Chèn: tab **Chèn › Video** (popup dán link; đang chọn video thì bấm lại để đổi link).
- Vẽ: `VideoView` trong `slideRender.tsx` — bản soạn và ảnh thu nhỏ chỉ hiện ảnh bìa + nút phát (iframe sẽ nuốt thao tác kéo); prop `live` (chỉ khi trình chiếu) mới nhúng iframe `youtube-nocookie` / player Vimeo / `<video controls>`.
- PPTX: YouTube → `addMedia({ type: 'online' })` + ảnh bìa ytimg; Vimeo/tệp → khung đen "▶ Video" có link.

### Tên miền dero.id.vn — đã chạy
- Nguyên nhân cũ: nameserver trỏ về `ns1/ns2.vercel-dns.com` nhưng Vercel **không tạo được DNS zone** cho `dero.id.vn` (API báo `not a DNS zone` — có vẻ coi là tên miền con của `id.vn`), nên máy chủ Vercel từ chối trả lời.
- Đã chuyển sang DNS của **iNET** (portal.inet.vn): nameserver `ns1.inet.vn`, `ns2.inet.vn`; bản ghi `A @ → 216.198.79.1`, `CNAME www → 8ef114a07f70902a.vercel-dns-017.com` (theo gợi ý Vercel). `https://dero.id.vn` trả 200; `www` chuyển 308 về tên miền chính.
- Bản ghi DNS sau này (email, xác minh…) tạo trên iNET, **không** trên Vercel.

## Lưu ý cách làm
- Khung trình duyệt của app chặn popup → muốn thử màn người trình bày thật phải dùng Chrome.
- Khi khung trình duyệt bị ẩn, `screenshot` treo → dùng `javascript_tool` / `get_page_text`. Ribbon co lại ở khung hẹp: tab "Trình chiếu" nằm trong menu "Thêm".
- Thử xuất PPTX không cần tải file: trong trang gọi `import('/src/lib/exportDeck.ts')` → `buildDeckPptx(deck)` rồi mở bằng JSZip (`/node_modules/.vite/deps/jszip.js`); deck lấy từ `localStorage['soandethi-docs']`.
