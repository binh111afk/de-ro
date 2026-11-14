# Phiên 38 (14/11/2026): tên miền dero.id.vn, tác giả đề cộng đồng, Thêm nguồn cho AI, sắp xếp lại ribbon soạn đề + slide, sửa vặt bảng vẽ

Tiếp [phiên 37](phien-37.md). Mọi việc code dưới đây **đã lên `main` và đã push** (commit cuối `63c121a`). Có **1 migration mới, đã áp lên Supabase**: `20261121_community_authors.sql`. Không còn nhánh / worktree agy nào treo.

## Việc nên làm tiếp (chọn cùng người dùng)
1. **Tên miền `dero.id.vn` chưa mở được** (lúc 21:00 ngày 14/11). Kiểm lại:
   - `nslookup -type=NS dero.id.vn a.dns-servers.vn` → phải ra `ns1/ns2.vercel-dns.com` (**đã đúng**).
   - `nslookup dero.id.vn ns1.vercel-dns.com` → lúc bàn giao vẫn *Query refused* (Vercel chưa dựng vùng DNS, `zone: false`).
   - Vercel MCP `get_domain` (team `team_nCC2zj1mKZJ7RqTuqHZoodB5`): `nsVerifiedAt` = 20:58 14/11, `get_domain_config` còn `misconfigured: true`.
   - Nếu sau vài giờ vẫn refused: vào Vercel dashboard › Domains › `dero.id.vn` xem có nút "Enable Vercel DNS" / thêm bản ghi A `76.76.21.21` cho `@` và CNAME `cname.vercel-dns.com` cho `www`, hoặc đổi nameserver iNET về `vclouddns` rồi trỏ A / CNAME như trên.
   - Đã cài sẵn trên project `de-ro`: `dero.id.vn` (chính) và `www.dero.id.vn` (chuyển 308 về `dero.id.vn`), cả hai `verified: true`.
2. **Thử thật trên web** các thứ chưa kiểm được trong khung xem thử (khung của Claude bị ẩn, canvas không dựng): vệt **laser màu đen**, **con trỏ thùng sơn** mới (điểm bấm dời về đầu giọt sơn — người dùng chưa nói có quen không), **hình vẽ thẳng** trên bảng vẽ.
3. **Thêm nguồn cho AI** chưa thử khi đã đăng nhập: tab Kho tài liệu có tệp thật (tải tệp `/api/files/...` rồi `/api/extract`), và gửi một yêu cầu soạn đề có nguồn.
4. Gộp ô / tách ô: chưa mở thử file **Word xuất ra** có ô gộp (code `docxBlocks.ts` đã có `columnSpan`/`rowSpan`).
5. Còn treo từ phiên 37: ghi số token mỗi lần gọi AI; `BoardEditor.tsx` vẫn ~2.900 dòng; Vercel `ANYROUTER_API_KEY`, `AI_SETTINGS_SECRET`.

## Đã làm

### Tên miền `dero.id.vn` (mua ở iNET, portal.inet.vn)
- Vercel: thêm `dero.id.vn` + `www.dero.id.vn` (redirect) vào project `de-ro` qua MCP.
- iNET: đổi nameserver sang `ns1/ns2.vercel-dns.com` (hộp "Cập nhật DNS" trong danh sách tên miền; nút **"Bản ghi" là form bản khai, không phải DNS**).
- **Tên miền `.vn` (cả `.id.vn`, `.io.vn`) bắt buộc bản khai VNNIC** có chữ ký của chủ tên miền — Claude không ký hộ. Người dùng tự ký, Claude chỉ ghi họ tên dưới chữ ký; bản khai đã nộp và được duyệt. Thư mục `ban-khai/` (có CCCD, địa chỉ) **đã xoá khỏi repo**.

### Đề cộng đồng
- Thẻ đề và dòng danh sách hiện **ảnh đại diện + tên người đăng** (agy làm, Claude review). Tên chỉ 1 dòng (`truncate`), thẻ cùng hàng luôn cao bằng nhau.
- Dữ liệu: RPC `public.community_authors(p_ids uuid[])` (security definer, chỉ trả tên/ảnh của người có đề `listed` + `published`, không trả email). RPC lỗi thì trang vẫn chạy, hiện "Giáo viên".
- `src/components/Avatar.tsx` dùng chung (Header, Hồ sơ, Admin người dùng, Cộng đồng).
- Bỏ chữ "miễn phí" ở landing, header, footer, trang đăng nhập.

### Trợ lý AI: nút **Thêm nguồn**
- `src/examEditor/SourcePicker.tsx`: modal 3 tab (Đề của tôi / Cộng đồng / Kho tài liệu, dùng `Segmented`), tìm kiếm, tối đa 5 nguồn (`MAX_PICKED`), ngăn trượt từ đáy trên điện thoại.
- `src/lib/sources.ts`: `PickedSource`, `loadPickedSources` (tải nội dung **lúc gửi**), `buildSourcePack(prompt, files, picked)` — nguồn chọn tay = **ưu tiên 1**, ngang tệp đính kèm (khi có thì không tự dò tài liệu / web). Mỗi nguồn tối đa 12.000 ký tự, chung trần 30.000. Đề online (blocks rỗng) lấy chữ từ `doc.online`.
- `AiPanel.tsx`: nguồn chọn giữ qua các lượt tới khi bấm ×; áp cho mọi chế độ (soạn đề, slide, bảng vẽ, hỏi đáp).

### Ribbon soạn đề (`Ribbon.tsx`, `RibbonAdaptive.tsx`)
- Còn **3 tab**: Trang chủ · Chèn · Bố cục. Bỏ tab Tài liệu (Lưu / In ở thanh nút nhanh, **Xuất PDF vào menu Tệp** — `FileMenu` nhận `extra` là một mục hoặc mảng) và tab Thiết kế (Màu trang / Viền trang sang Bố cục).
- Bỏ trùng: nút chèn câu hỏi / khối / bảng đáp án / thang điểm (đã có ở panel **Khối mẫu**), thụt lề + giãn dòng ở Bố cục, Ngắt trang ở Bố cục, nút In ("Cỡ trang"), phông chữ ở Thiết kế. Xóa hàng/cột/bảng vào nhóm Bảng, Xóa khối vào Chỉnh sửa.
- **Gộp ô / Tách ô** (lệnh `mergeCells` / `splitCell` có sẵn của TipTap; lưu, Word, HTML đã hỗ trợ span từ trước).
- **Ô chọn** (`Dropdown.tsx` + `.gs-dd*` trong `compose.css`, dùng chung cả slide): cao 28px, bo 6px, vòng sáng khi mở, mũi tên xoay, dấu tích mục đang chọn, danh sách rộng hơn ô khi cần.
- **Nút tách** màu / viền (`ColorDropdown` trong `Ribbon.tsx`): nút + mũi tên thành một khối, mũi tên 20px (điện thoại 28px), bảng có tiêu đề riêng, ô màu 20px, mục bỏ màu ("Không tô sáng", "Tự động (đen)", "Không đổ bóng"), menu Viền đoạn có hình minh hoạ cạnh + dấu tích.
- Sửa: giãn dòng chưa đặt hiện "0" → `num()` trong `formatState.ts` coi `null`/`''` là chưa đặt.

### Ribbon slide (`SlideRibbon.tsx`) — cùng quy trình rà, **không chép chức năng soạn đề**
- Trang chủ › Slide: Slide mới, **Bố cục** (chuyển từ Chèn), Nhân bản, Xóa. Bỏ Slide mới trùng ở Chèn, bỏ Trình chiếu trùng ở Trang chủ.
- Đoạn văn: 3 nút căn chữ bấm thẳng (trước là menu thả xuống trộn căn chữ với căn vào slide). Sắp xếp gom: Thứ tự lớp · Căn vào slide · Lật. Tab Thành phần bỏ nhóm Sắp xếp trùng.
- Sửa tràn ngang bảng công cụ điện thoại (hàng phông, lưới chủ đề) — `slide.css`.

### Bảng vẽ
- **Ghi chú PDF lệch khi đổi tab**: đổi tab là bảng dựng lại, `clampRef` chạy khi canvas còn cỡ mặc định 300×150 → chờ `c.style.width` (ResizeObserver đặt) mới kéo vùng nhìn.
- **Laser đen ra đỏ**: `rgbOf` dùng `parseInt(...) || đỏ`, đen = 0 → rơi vào đỏ. Đã sửa (chỉ NaN mới lấy đỏ, đọc được `#fff`). Thêm **hàng màu laser gần đây** (`opts.recentLaserColors`).
- **Con trỏ thùng sơn** dựng từ chính `BUCKET_D` của icon trên thanh công cụ (`BUCKET_SVG` trong `boardUi.tsx`), điểm bấm `20 21`.
- **Hình mặc định vẽ thẳng, tô đặc** (`DEFAULT_STYLES.shape`); bảng cũ tự chuyển một lần (cờ `opts.shapeStraight`), hình đã vẽ giữ nguyên.
- Menu Dụng cụ: icon cho Thước kẻ / Thước đo góc / Compa; **thước đo góc dùng `src/assets/icons/protractor.svg`** (người dùng gửi, hình tô đặc → `ProtractorIcon` dùng CSS mask để theo `currentColor`).

## Lưu ý cách làm
- Người dùng muốn **việc cần phán đoán thì Claude tự làm**, việc máy móc mới giao agy (đã ghi trong memory). Lần này agy làm phần tác giả đề cộng đồng, Claude review + áp migration khi được bảo.
- "Làm giống bên kia" có thể là **giống quy trình** (rà, tìm trùng, sửa) chứ không phải chép chức năng — hỏi lại nếu mơ hồ.
- Khung trình duyệt của Claude **bị ẩn** khá thường xuyên: ảnh chụp trễ một bước, canvas bảng vẽ không dựng (ResizeObserver không chạy). Kiểm giao diện bằng `javascript_tool` (đọc DOM, `getBoundingClientRect`), chỉ chụp ảnh khi khung đang hiện. Tiptap editor lấy được qua `document.querySelector('.ProseMirror').editor`.
- Ribbon có bản đo ẩn để tính nút "Thêm": khi tìm nút bằng JS, lọc `offsetParent` và `!disabled`; nút ribbon chỉ bật khi editor đã được bấm vào (sau hiệu ứng chuyển trang).
- `sed -i` trên Git Bash **làm mất CRLF** (cả file hiện là đã đổi): sửa bằng python `newline=''`, hoặc sau đó chạy `sed -i 's/$/\r/'`. Heredoc python dài trong Bash dễ vỡ — ghi script ra scratchpad rồi chạy.
