# Phiên 58 (25/11/2026) — AI sửa slide, đồ thị kiểu SGK, hình lăng trụ

Cả hai việc đã gộp vào `main` và push (`5a157bd`), Vercel báo Ready. **Chưa thử trên web thật.** Hai nhánh `fix/slide-ai-lenh`, `fix/do-thi-lang-tru` còn ở máy (đã gộp, không có trên GitHub, xoá được khi người dùng đồng ý).

## Việc phiên sau: thử trên bản chạy thật (có đăng nhập)

- Slide: "tách slide 2 thành 2 slide", "đổi nền slide 3", "phóng to tiêu đề slide 2", đổi ảnh đang có, sửa tiêu đề slide có hình tự thêm (hình phải còn).
- Công cụ vẽ: chèn đồ thị và lăng trụ vào đề, xem cỡ chữ trên trang và trong file Word.
- Các mục còn treo của [phiên 57](phien-57.md) (thay cả đề, link đề online, GLM ở AI & Server).

## AI sửa slide (`9048f1a`)

Lỗi đã sửa, chủ yếu ở `src/lib/slideEdit.ts`:

- Số slide trong mọi lệnh tính theo bài **trước khi áp** (trước đây tách slide 2 rồi sửa slide 3 thì đè lên slide vừa tách). `add_slide` / `add_chart` dùng `after` (0 = đầu bài); `position` còn nhận cho lượt kiểu cũ.
- `edit_slide` giữ vị trí / màu / phần tử người dùng tự thêm (`mergeContent`: so ba bản). `set_layout` giữ phần tử tự thêm.
- Lệnh mới: `set_background` (nền vài slide), `edit_element` (chữ, màu, cỡ, đậm, nghiêng, căn, xoá; `id: "*"` = mọi hộp chữ; dùng cho cả slide tự do). `add_image` có `replace`.
- Field dài sẵn không đụng tới không còn chặn việc sửa field khác. Bỏ regex "so sánh" ở `slideFlow.ts` (chặn nhầm). Nhận 60 lệnh (cũ 12). Mô tả slide gửi AI 2.500 ký tự (cũ 600) + danh sách id phần tử → bài dài tốn thêm điểm.
- Tách slide mà phần mới hỏng thì giữ nguyên slide gốc. AI không làm được thì trả `{"action":"none","say":…}`.
- Test: `npm run test:slide-edit`. Sửa prompt `editSystemPrompt` phải `npm run build:prompts` và cập nhật `len` + `sha256` trong `scripts/fixtures/prompt-slide-snap.json`.

Đã thử với DeepSeek thật 7 câu (đúng lệnh) và "tách slide 3" trên máy dev. **Chưa kiểm:** đổi ảnh / nền / cỡ chữ trên giao diện, GLM, câu prompt cấm bịa tên menu (sửa sau lần gọi thật).

## Đồ thị và lăng trụ (`e777500`)

- `src/lib/plot.ts`: hệ toạ độ vẽ `W = 420` (cũ 640), ảnh xuất vẫn rộng 640 (`OUT_SCALE`) → chèn vào đề (300px) chữ và nét to hơn ~1,5 lần. `roomyStep` thưa số trên trục khi khung rộng.
- Đường đồ thị **đen** (`PLOT_COLORS = ['#111111']`) theo yêu cầu người dùng.
- `src/lib/geometry.ts`: toạ độ mặc định `prism3` / `prism3-oblique` mới (B nhô ra trước, cạnh bên cao hơn).
- Đồ thị trong đề cũ giữ kiểu cũ tới khi bấm sửa; nhãn từng kéo tay (`labelPos` theo đơn vị viewBox) có thể lệch sau khi cập nhật.

**Chưa kiểm:** chèn vào đề, xuất Word thật, xem lại hình sau khi đổi sang đen. Người dùng chưa xác nhận đã giống SGK.

## Bẫy

- Dựng nhiều SVG đồ thị inline trong một trang để so: chúng trùng id `plotclip` → đường cong trông bị đứt (lỗi giả). Đổi sang `<img src="data:…">`.
- Heredoc + Python chuỗi thường: `\n` trong mã JS sinh ra thành xuống dòng thật.
