# Phiên 60 (26–27/11/2026) — kiểu "Học thuật", sửa khung soạn slide, thẻ xuất file

Đã gộp `main` và push hết (`1a9d18e`). **Chưa thử trên web thật có đăng nhập; các bộ "Học thuật" chưa thử với AI thật.**

## Việc đầu phiên sau

1. Deploy của `1a9d18e` đã Ready và đang chạy ở dero.id.vn.
2. Trên bản chạy thật: tạo slide "Học thuật", khoá nền rồi quét chọn, kéo hình tràn mép, xuất file.

## Slide Chuyên nghiệp

- Kiểu thứ ba **"Học thuật"** (`ProStyle` = `tranh`, id `tranh-*`) luôn có trong câu hỏi chọn kiểu. `TRANH_BY_SUBJECT` (`src/lib/aiDeck.ts`): Văn → Cổ điển đỏ, Lịch sử → Sử đỏ, Địa lí → xanh rêu, Lí luận chính trị → "Đỏ son"; môn khác → "Đại học".
- Môn mới `chinh-tri` (đứng trước `van` trong `slideSubjects.ts` để thắng khi hoà điểm); tách `su-dia` thành `lich-su` / `dia-li`.
- Bộ Sinh học xanh lá đã làm rồi **gỡ**.
- "Đỏ son": bìa chọn chân dung / búa liềm theo tên bài (`chinhTriFigures`). Nguồn ảnh: `docs/ban-quyen.md`. Ảnh Bác chỉ 282×383.
- `normalizeTheme` nhận bộ theo **màu nền**: mỗi bộ phải có màu giấy riêng, không dùng `#ffffff` ("Đại học" dùng `#fefeff`).
- Ảnh slide: Agnes trước, ảnh chụp bài Pro lỗi thì CogView-4 (`GLM_API_KEY`), cuối là Xkiro (`server/imageProxy.ts`). `AGNES_*`, `GLM_*` đã có trên Vercel.
- Slide sắp vẽ ảnh AI đổi ngay sang khung chờ (`setSlideImageFrames`); **bìa đầu tiên** của bộ giữ hình sẵn, không vẽ. Vẽ lỗi thì khung trống + "Vẽ lại", hình sẵn không quay lại.
- AI sửa slide: gửi lại đúng lệnh đã trả trong lịch sử; yêu cầu đã Dừng bị bỏ khỏi lịch sử (`5998cb1`).

## Khung soạn slide (`1cffe08`, `1a9d18e`)

- Viền chọn, tay nắm, khung nhóm, khung quét vẽ ở lớp `.slide-chrome` **ngoài** `.slide-frame` (portal từ `EditableEl`, `SlideChromeContext`). Tay nắm không còn là con DOM của khung: tìm khung bằng `frameOf`, đừng dùng `closest('.slide-frame')`; bấm-ra-ngoài phải tính cả `[data-el-chrome]`.
- `.slide-chrome` cần `contain: layout`, không thì phần tràn sinh thanh cuộn.
- Quét chọn được từ phần tử đã khoá và từ vùng xám; bỏ qua phần tử khoá. Cảm ứng ở vùng xám vẫn là cuộn.
- Kéo cỡ cho tràn ra ngoài trang (người dùng muốn giống Canva).
- Chọn chữ / công thức / video sau ảnh, hình thì ribbon về Trang chủ.
- Còn lại: tay nắm **cắt ảnh** vẫn nằm trong khung (bị cắt ở mép).

## Thẻ tiến độ xuất file

`ExportToast.tsx`, góc dưới phải. **Người dùng không muốn nền tối**: nền sáng, viền màu theo trạng thái + vòng sóng (`.export-card--*` trong `index.css`).

## Khác

- Vercel: 27/11 người dùng bảo xoá deploy cũ, giữ 10 bản; dự án `de-ro` chỉ có **6** deploy nên không xoá gì.
- Worktree `../dethinhbien-agy-glm` còn trên máy (có `.env` chứa key GLM); gỡ thì `unlink` junction `node_modules` trước.
- `docs/mau-slide/chinh-tri`, `dai-hoc` (trang xem thử) và `docs/prompt-*.md` không commit.

## Đã đề xuất, chưa được yêu cầu

Tắt ảnh AI ở slide số lớn; ẩn Doodle cho môn chính trị; chuyển Lịch sử sang "Đỏ son"; ảnh Bác nét hơn.
