# Bàn giao phiên 16 (02–03/11/2026)

## Đã làm

**Kho đồ hoạ: 718 → 1146 icon AI dùng được** (+140 hoạ tiết `orn-*`, tổng 1286 mục)

| Nhóm | Trước → sau | Ghi chú |
|---|---|---|
| Khen thưởng `reward` | 10 → 40 | |
| Ký hiệu `sym` | 20 → 50 | chữ khối, helper `uni()` gộp nhiều mảnh thành một khối liền |
| Khung & nhãn `frame` | 22 → 52 | vẽ lại 10 icon sheet bị lệch màu tô (băng rôn, ruy băng, nét đứt, bong bóng, cuộn, thẻ lật, bậc thang, câu hỏi/đáp án) |
| Mũi tên `arrow` | 13 → 43 | helper `curveArrowD()`: mũi tên khối theo đường cong bất kỳ |
| Trang trí `decor` | 5 → 55 | |
| Tin học `cs` | 14 → 64 | |
| Văn học `lit` | 19 → 47 | vẽ lại thuyền, cuộn thơ, mái đình, đèn dầu, bút lông; **bỏ Cánh cò** (`REMOVED`) |
| Hoá học `chem` | 11 → 71 | |
| Vật lí `phys` | 14 → 74 | kí hiệu mạch điện kiểu SGK, quang, cơ, nhiệt, đồ dùng điện |
| Nghệ thuật `art` | 19 → 79 | |

- Cách làm: vẽ trong `scripts/graphics-redraw.mjs` (mỗi đợt một mảng `XXX_NEW` + `reduce(..., '<id đứng trước>')`), chèn vào `graphics.ts` bằng script — xem dưới.
- Mỗi đợt đều mở lưới xem thử trên dev server; icon nhìn không ra thì **xoá thay hình khác chứ không cố sửa** (yêu cầu của người dùng).
- Tránh trùng nội dung giữa các nhóm (vd. Văn học không vẽ lại sách cổ/cây đa/bánh chưng đã có ở Ngữ văn; Vật lí không vẽ lại hải đăng, máy ảnh, đèn giao thông…).

**TS2590 khi kho vượt ~1000 mục**: mảng literal quá lớn làm tsc báo "union type too complex". `graphics.ts` (và template trong `import-graphics.mjs`) giờ khai báo `RAW` với `category: string` rồi ép `GRAPHICS = RAW as SlideGraphicData[]`. Vì tsc không còn bắt nhóm sai nên `test-slide-graphics` có thêm kiểm tra "mọi icon thuộc nhóm đã khai báo".

**Chạy thử AI tạo slide thật** (`npm run eval:slides`, 5 môn): icon AI chọn đúng chủ đề, dùng được icon mới; `decorKit` chọn hợp (hình học cho tự nhiên, hoa dịu cho văn, lấp lánh cho lễ hội). Script giờ in thêm `subject`, `decorKit` và icon từng slide. Sửa 3 lỗi phát hiện được:
1. **Lộ `**` ra chữ**: AI viết `**Lan:** câu`, các hàm tách "nhãn: mô tả" (`splitLabel`, `splitCardItem`, `parseBranch` trong `slideLayouts.ts`) cắt giữa cặp `**`. Thêm `unboldLabel()` gỡ cặp ** quanh nhãn trước khi cắt.
2. **Lặp đồ hoạ trong một deck** (bìa/khởi động/kết cùng một icon): `dropRepeatedGraphic()` (`slideAi.ts`) gọi theo thứ tự slide trong `AiPanel` (`landReady`) — trùng thì bỏ `graphic`.
3. **Icon thẻ (Phosphor) khớp nhầm**: từ khoá ngắn ≤3 ký tự ("số", "anh") chỉ tính nửa điểm, cần ≥1 điểm mới gắn icon (`pickSlideAsset`).

## Chèn / sửa icon (file sheet gốc vẫn không còn)

- `node scripts/graphics-patch-add.mjs` — chèn mọi mục `ADDED` chưa có vào `src/lib/graphics.ts` (đúng vị trí `after`).
- `node scripts/graphics-patch-redrawn.mjs <id> …` — ghi đè svg của icon có trong `REDRAWN`.
- Sửa icon đã chèn từ `ADDED`: xoá khối `{ id: "…" }` trong `graphics.ts` rồi chạy lại patch-add.
- Bỏ icon từ sheet: thêm id vào `export const REMOVED` trong `graphics-redraw.mjs` (import-graphics gỡ khi dựng lại) **và** xoá khối trong `graphics.ts`.
- Nhớ sửa số ghi cứng trong `scripts/test-slide-graphics.mjs` (hiện **1146**).
- Xem lưới: trong tab dev server chạy `import('/src/lib/graphics.ts')`, lọc theo `category`, chèn `<div id="__chk">` lên `document.documentElement` rồi chụp màn hình; Vite HMR sẽ reload trang mỗi lần `graphics.ts` đổi nên chờ vài giây rồi chèn lại.
- Màu chỉ đọc từ `fill=` (đổi màu theo theme), không tô bằng stroke. Heredoc bash hay lỗi với chuỗi SVG — viết khối code ra file bằng Write rồi `cat >>`.

## Còn lại / chưa kiểm

- Các nhóm còn mỏng: Lễ & sự kiện 8, Giáo dục công dân 8, Ngoại ngữ 11, Cảm xúc 11, Người 12, Thể chất 15.
- Thêm icon làm catalog gửi AI dài hơn (token prompt) — chưa đo riêng, deck thử vẫn ~31–54k token vào như phiên 15.
- Vài icon cũ trong nhóm Nghệ thuật trông chưa đẹp (đàn bầu, kéo-hồ dán, cọ vẽ cũ) — chưa động vào.
- Slide cũ dùng `lit-canh-co` sẽ mất hình.
