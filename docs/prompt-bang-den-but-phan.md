# Prompt: Bảng vẽ — nền bảng đen / bảng xanh + bút phấn

> Làm trong **worktree riêng + nhánh riêng** tạo từ `origin/main` mới nhất (thư mục chính đang có việc khác):
> ```
> git fetch origin
> git worktree add ../dethinhbien-bang-den -b agy/bang-den-but-phan origin/main
> cd ../dethinhbien-bang-den
> npm install
> ```
> Chạy dev ở **cổng 5191**: `npm run dev -- --port 5191 --host 127.0.0.1`.
> Không làm trên `main`, không push, không merge. Xong thì commit trên nhánh và báo lại.

---

## Bối cảnh

Đọc phần đầu `context.md` (nguyên tắc, lệnh, bẫy hay gặp). Bảng vẽ nằm ở `src/board/`:
- `scene.ts`: kiểu dữ liệu. `Paper = 'plain' | 'grid' | 'lines' | 'dots'`, `PenKind = 'fountain' | 'ball' | 'brush' | 'pencil' | 'marker' | 'highlight'`, `El` (một hình / nét).
- `render.ts`: vẽ canvas. `drawPaper()` vẽ nền giấy; `PEN_TRAITS` + `penOutline()` tạo viền nét bút (perfect-freehand); `pencilFill()` là ví dụ tô nét bằng mẫu hạt (bút chì) — **bút phấn làm theo cách tương tự**. `render()` gọi `drawPaper` trước rồi vẽ các hình.
- `BoardEditor.tsx` (rất dài, file **CRLF**): giao diện. `PAPERS` (danh sách kiểu giấy, có ô xem trước), menu "Giấy" (`<Pop id="paper" …>`), danh sách bút (mảng có `{ id: 'pencil', label: 'Bút chì', icon: … }`), `DEFAULT_STYLES` (màu / độ dày mặc định từng loại bút), `Opts.paper`, hàng màu gần đây `recentColors`.
- `io.ts`: xuất PNG / PDF (`savePng`, `canvasToA4Pdf`, `renderRegion`).

**Bẫy:** `BoardEditor.tsx` là file CRLF — **không dùng `sed -i`** (đổi cả file sang LF). Sửa bằng công cụ Edit, hoặc Python mở với `newline=''`. Sau mỗi lần sửa chạy `git diff --stat` để chắc chỉ đổi vài dòng. Tooltip dùng `data-tip`, **không dùng `title=`**. Icon / nút dùng lại component có sẵn trong file (`Pop`, `IconBtn`, `Ico`, `Group`…), không tự làm mới.

## Yêu cầu

### 1. Nền bảng đen và bảng xanh
- Thêm vào `Paper` hai loại `'chalkboard'` (bảng đen, màu nền khoảng `#2b2f2e`) và `'greenboard'` (bảng xanh lớp học, khoảng `#2f4a3a`). Nền có **vân phấn mờ rất nhẹ** (hạt / vệt loang sáng độ trong suốt thấp, cố định theo toạ độ cảnh để kéo bảng không bị "trôi" vân), không làm rối nét vẽ.
- Có thể kèm kẻ ô / kẻ dòng mảnh màu trắng mờ trên nền tối? → Làm dạng tuỳ chọn phụ nếu gọn; không bắt buộc. Tối thiểu: nền trơn có vân.
- `drawPaper` tô cả vùng nhìn thấy bằng màu nền (hiện `plain` không tô gì vì canvas nằm trên `bg-white`). Chú ý vùng ngoài canvas / khung `board-editor` `bg-white` không được lộ viền trắng.
- Menu "Giấy": thêm 2 ô xem trước "Bảng đen", "Bảng xanh" cùng kiểu các ô hiện có.
- Lưu theo bảng như các kiểu giấy khác (`opts.paper`, đã lưu sẵn).

### 2. Tự đổi màu cho hợp nền tối
- Khi đang ở nền tối, màu mặc định của bút / chữ / hình là **trắng phấn** (`#f5f3ea`) thay cho đen; hàng màu gần đây đề xuất bộ màu phấn: trắng, vàng `#f7e07a`, hồng `#f4a6b8`, xanh dương nhạt `#9fd3f5`, xanh lá nhạt `#b7e4a7`, cam `#f9b97a`.
- **Không đổi màu các nét đã vẽ.** Chỉ đổi màu đang chọn / gợi ý. Đổi lại nền trắng thì quay về bộ màu cũ (nhớ riêng từng loại nền, hoặc đơn giản: lúc đổi nền nếu màu đang chọn là đen thì đổi sang trắng và ngược lại).
- Các phần vẽ phụ trên nền tối phải nhìn rõ: khung chọn, tay nắm, đường gióng, viền xem trước thùng sơn, vòng gôm, khung chữ đang gõ (con trỏ, màu chữ trong textarea). Kiểm từng cái.
- Hình công cụ vẽ (đồ thị, hình học… dựng từ `svgImport.ts`) có nét đen: **không bắt buộc** đổi màu; ghi vào báo cáo nếu thấy khó nhìn.

### 3. Bút phấn
- Thêm `PenKind` mới `'chalk'`, nhãn "Bút phấn", icon viên phấn (nét rỗng, cùng kiểu icon các bút khác, 24×24, stroke).
- Hình nét: độ dày gần như đều (ít thon theo lực), **mép sần**, bên trong **lấm tấm lỗ hổng** như phấn trên bảng. Gợi ý: viền từ `penOutline` (thêm `chalk` vào `PEN_TRAITS`, `thin` nhỏ, `taper` 0–1), tô bằng mẫu hạt có nhiều điểm trong suốt giống `pencilFill` nhưng hạt to hơn, thưa hơn (độ phủ khoảng 70–80%); mép sần có thể làm bằng cách vẽ thêm vài chấm lệch ngẫu nhiên dọc viền (ngẫu nhiên theo `seed` của nét để vẽ lại không đổi hình).
- Mặc định: màu `#f5f3ea`, độ dày vừa (khoảng như bút dạ). Dùng được cả trên nền trắng (lúc đó chọn màu tối thì vẫn ra vân phấn).
- Ô xem trước bút trong menu "Kiểu bút" hiện đúng vân phấn.
- Hiệu năng: nét dài 1000+ điểm vẫn vẽ mượt (mẫu hạt tạo một lần, cache theo màu như `pencilFill`).

### 4. Xuất file
- Xuất PNG / PDF giữ nền bảng đen / xanh (không thành nền trắng làm mất nét phấn trắng). Kiểm `io.ts` xem nền được vẽ ở đâu khi xuất.

## Kiểm tra trước khi báo xong
1. `npx tsc -p tsconfig.app.json --noEmit` không lỗi (không dùng `tsc -p .`).
2. Mở `http://127.0.0.1:5191/soan-de` → tab Bắt đầu → Bảng vẽ. Thử: đổi qua lại Trắng ↔ Bảng đen ↔ Bảng xanh; vẽ bút phấn, bút bi, chữ, hình, thùng sơn; chọn / kéo / đổi cỡ; gôm; hoàn tác; tải lại trang thấy nền vẫn giữ; xuất PNG và PDF.
3. Bảng cũ (tạo trước khi sửa) mở ra vẫn y nguyên.
4. Chụp ảnh: bảng đen có chữ + hình vẽ bằng phấn trắng và phấn màu; bảng xanh; menu Giấy; menu Kiểu bút.
5. Báo lại: file đã sửa, chỗ chưa làm được / làm khác yêu cầu và lý do.
