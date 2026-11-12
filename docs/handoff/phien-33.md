# Phiên 33 (11–12/11/2026): "Đề của tôi" riêng trang, 8 công cụ vẽ mới / nâng cấp, chỉnh cạnh, giao việc agy song song

Tiếp [phiên 32](phien-32.md). Mọi việc dưới đây **đã lên `main`** (commit cuối của phiên ở `git log`), **trừ nhánh agy đang làm** (mục đầu tiên). Không có migration mới.

## ⚠️ Việc đầu tiên phiên sau: review nhánh agy `feat/chinh-canh-3d`
- Agy đang làm "Chỉnh cạnh" cho **Hình học không gian** trong worktree `../dethinhbien-chinh-canh-3d` (nhánh `feat/chinh-canh-3d`, tách từ `409e8b5`). Đề bài đầy đủ: [`prompt-agy-chinh-canh-3d.md`](../../prompt-agy-chinh-canh-3d.md) ở gốc repo (file tạm, không commit; xoá khi gộp xong).
- Cách review đã dùng cả phiên (làm y vậy):
  1. `git log main..feat/chinh-canh-3d`, `git diff --stat main...feat/chinh-canh-3d`, đọc diff các file dùng chung.
  2. Gộp thử trong worktree tạm: `git worktree add --detach ../dethinhbien-review main` → `git merge feat/...` → junction `node_modules` sang thư mục gốc (`New-Item -ItemType Junction`) → `npx tsc --noEmit -p tsconfig.app.json` + mọi `scripts/check-*.ts` (chạy bằng `npx tsx --tsconfig tsconfig.app.json scripts/<file>.ts`, thiếu `--tsconfig` sẽ lỗi `@/`).
  3. Chạy dev server của worktree tạm (thêm cấu hình `review` cổng 5190 vào `.claude/launch.json`, `npx --prefix ../dethinhbien-review vite ../dethinhbien-review`), mở công cụ trên trình duyệt, thử đúng các ví dụ "Tự kiểm" trong prompt. Kéo chuột: giả lập bằng `PointerEvent` qua `javascript_tool` (công cụ kéo của pane hay lệch toạ độ khi giả lập viewport 1280×800).
  4. Báo người dùng → được đồng ý mới gộp vào `main`, push, xoá worktree + nhánh. **Xoá junction `node_modules` trước** khi `git worktree remove --force` (không thì xoá xuyên sang `node_modules` gốc).
- Prompt yêu cầu: toạ độ `A(x; y; z)` trong "Dựng thêm", kéo nút mặc định trên mặt ngang, **Shift** = kéo đứng, lăng trụ/hộp giữ đáy trên đi theo, hít theo trục / S ngay trên điểm đáy / độ dài tròn, bảng độ dài **thật 3D**, script `scripts/check-geo3d-edit.ts`.

## Đã làm

### Hồ sơ / "Đề của tôi"
- Trang riêng `/ho-so/de-tai-len` (`src/pages/MyUploads.tsx`), mở bằng tab dưới thẻ hồ sơ: gom **đề / slide / bảng vẽ** (từ tab Bắt đầu) + **tệp tải lên**; tìm kiếm, `SiteSelect` sắp xếp, `Segmented` lọc, phân trang 8 mục; tải **nhiều tệp**, hiện thẻ ngay (chờ → đang tải); thanh **dung lượng** chuyển từ Hồ sơ sang đây. Mở đề/slide/bảng → `/soan-de` với `state.open`.
- `src/components/ProgressBar.tsx` (dùng chung). Memory mới: dùng lại component có sẵn (Segmented, SiteSelect, Pager…), không tự làm mới.
- Admin: mục "Dung lượng lưu trữ" trong ngăn người dùng (`storage.get` / `storage.set`, ghi `user_quota`).

### Công cụ vẽ (tab Công cụ)
- **Ô tìm kiếm** trên đầu panel (không dấu, gom theo môn) — `ToolsPanel.tsx`.
- **Khí**: nhãn đường `a-b: đẳng áp | p_1`, tuỳ chọn ẩn điểm trạng thái (`showStates`).
- **Tạo bảng** (nhóm Khác, `src/lib/table.ts`): bảng kẻ ô SVG, gộp ô `1,1:1,3`, tiêu đề, viền, chỉ số. Nhóm Khác giờ hiện cả ở slide / bảng vẽ (Xáo đề chỉ ở đề).
- **Phương trình hoá học** (`src/lib/chemEq.ts`): điều kiện `[trên | dưới]`, `<=>`, ion, ↑ ↓, **tự cân bằng** (ma trận nguyên tố); chất **cấu tạo** trong `{...}` (vẽ bằng `renderStructSvg`), nhiều mũi tên / dòng. `chem.ts`: điện tích `NH3^+`, `COO^-`.
- **Đồ thị chuyển thể** (Vật lí 12, `src/lib/phaseChange.ts`): gốc O ở giá trị nhỏ nhất, điểm có tên `A: (15; -8,83)`, kí hiệu trục `60 = T_1`.
- **Đồ thị dao động** (Vật lí 11, `src/lib/oscillation.ts`): nhập A, T/f/ω, trạng thái đầu → tự tính φ, vẽ x/v/a, lưới T/8, hai đường so pha.
- **Đồ thị chuyển động**: nút mẫu **d – t**; tên trục t không đè số khi điểm cuối âm.
- **Hình học phẳng**: mẫu **"Tự do (theo toạ độ)"** đứng đầu danh sách, chọn vào điền sẵn hình mẫu; lệnh `A(0; 4)`, `nhãn AB "4 km"`, `kích thước BC "7 km"` (chữ nằm ngoài nét đứt), `đường BC kéo dài`, `tia BC`; nút **"Chỉnh cạnh"** (`EdgeEditPreview.tsx`, `edgeSnap.ts`): nút ở đỉnh, kéo xoay/đổi độ dài cạnh, hít ngang/dọc/15°/vuông/thẳng hàng/độ dài tròn, bảng độ dài·góc, ghi `A(x; y) // kéo`, "Đặt lại hình"; khung giữ tỉ lệ cố định (hình ~70%, kéo dài thấy to ra thật).
- **Đường tròn lượng giác**: bấm lên đường tròn thêm điểm (hít bội π/6, π/4; ghi `M: -π/6`, góc trong (−π; π]), kéo điểm đổi góc, bấm đúp/bấm phải xoá — `TrigPickPreview.tsx`, hằng `TRIG_GEOM` (mathExtra.ts).
- Chèn ảnh: bảng và phương trình lấy **độ rộng thật** (không phóng quá mức chuẩn) — `toolImageWidth` trong `toolImages.ts`.

## Lưu ý cách làm (rút từ phiên này)
- Giao việc agy: viết prompt `prompt-agy-*.md` ở gốc repo (file tạm), **mỗi việc một worktree** (`git worktree add -b feat/x ../dethinhbien-x origin/main`) — nhiều phiên chung một thư mục thì `git switch` của phiên này đổi nhánh phiên kia. Push `main` trước khi giao để worktree có code mới nhất. Câu giao việc: "Đọc và làm đúng theo file <đường dẫn đầy đủ>…".
- Gộp nhiều nhánh cùng thêm công cụ: xung đột luôn ở `ToolsPanel.tsx`, `toolSpec.ts`, `toolImages.ts`, `ToolModal.tsx`, `MoreToolModals.tsx`, `docRewrite.ts`, `BoardEditor.tsx`, `DocSelectionAi.tsx` — giữ cả hai bên; `MoreToolModals.tsx` lấy bản HEAD rồi nối khối của nhánh kia ở cuối + thêm import; sau đó gộp import icon lucide về một dòng và đánh lại số mục `FIGURE_GUIDE`. Sửa file bằng Python nhớ `newline=''` (repo lẫn CRLF/LF).
- Agy làm tốt cả việc khó (tự cân bằng, kéo cạnh có hít) khi prompt ghi rõ: file mẫu để bắt chước, spec gợi ý, ví dụ tự kiểm, ràng buộc (không push, chỉ thêm dòng ở file dùng chung).

## Còn lại / chưa kiểm
- Review + gộp `feat/chinh-canh-3d` (xem trên).
- Công cụ `scene` ("Hình thực tế") chỉ AI dùng, không có trong panel — hình phẳng Tự do giờ làm được việc đó, chưa cần đưa ra.
- Hình phẳng: kéo về thẳng đứng thì lúc kéo có góc vuông tạm, thả ra mẫu "Tam giác" không tự thêm `vuông B A C`.
- "Đề của tôi" và mục dung lượng admin **chưa thử khi đăng nhập** (cần tài khoản thật / service role).
- Treo từ phiên trước: đặt `AI_SETTINGS_SECRET` trên Vercel; các mục "Còn lại" của [phiên 32](phien-32.md).
