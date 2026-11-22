# Việc: sửa `src/lib/exportDeck.ts` cho .pptx khớp bố cục và màu với web

Đọc `AGENTS.md` trước. Làm trong worktree này (nhánh `chore/kiem-pptx`), không commit. Script đo `scripts/check-pptx-fidelity.ts` (`npm run check:pptx`) đã có; báo cáo lần chạy trước nằm trong yêu cầu này. Dùng nó làm thước đo: sửa → chạy lại → số sai lệch phải giảm, không loại nào được tăng.

## Việc cần làm (theo thứ tự ưu tiên, mỗi mục một lần sửa nhỏ rồi chạy lại `check:pptx`)
1. **Màu `transparent` / màu không phải hex 6 ký tự** (hàm `hex`, ~dòng 26): `transparent`, `rgba(...)`, hex 3 và 8 ký tự phải ra đúng RGB + alpha hoặc `noFill`, không được thành trắng.
2. **Viền**: khi phần tử thiếu `border` / `borderColor` thì dùng giá trị đã resolve từ theme giống cách web vẽ (`slideRender.tsx`), không mặc định `#111827`. Giữ alpha của viền. Ánh xạ `borderStyle` đứt / chấm sang `dashType`. Dùng một hàm quy đổi độ dày chung (px → pt, 0,72) cho hình, bảng, connector.
3. **Hộp chữ cao sai** (~dòng 321): dùng cùng chiều cao hộp mà web dùng (`SlideElView`); không đo lại `elementHeight` làm hộp co lại. Chữ vẫn phải nằm đúng ô.
4. **Lớp hoạ tiết nền** (`glow`, hoạ tiết CSS…, ~74 chỗ): xuất tương đương gần nhất (hình + màu + alpha, hoặc gradient nếu đã có đường xuất gradient dùng được); thứ không biểu diễn được thì ghi vào danh sách "khác biệt đã biết" của script, không bỏ im lặng.
5. **Khung chờ ảnh** (nhánh ảnh yêu cầu `el.src`, ~dòng 464): xuất khung thay thế cùng vị trí, cùng màu nền / viền như web vẽ khung chờ.
6. **Bảng**: ô hàng lẻ trong suốt thì để `noFill`, không tô màu theme; độ dày viền ô theo hàm chung ở mục 2.
7. **Biểu đồ**: ghi màu từng cột / từng phần đúng như web.
8. **Thứ tự z**: cùng quy tắc xếp lớp cho web và export (chân trang `z=10`, `ChartView` áp `zIndex`) — chỉ sửa phía export nếu sửa phía web có thể đổi giao diện.
9. **Ảnh**: tính `srcRect` crop kiểu `cover` khi tỉ lệ khung khác tỉ lệ ảnh, kể cả `radius: 0`.
10. Nếu còn sức và an toàn: connector Bézier → preset cong; chữ chuyển sắc. Không làm được gọn thì bỏ, ghi vào báo cáo.

## Điều cấm
- **Không đổi cách web vẽ** (`slideRender.tsx`, `slide.css`, layout, bộ màu) và không đổi dữ liệu mô hình `Slide`. Chỉ sửa phía xuất (`exportDeck.ts` + file phụ trợ của nó).
- Không đụng hiệu ứng / hoạt ảnh, phông và cỡ chữ.
- Không thêm thư viện, không commit / push, không đụng migration, không sửa prompt AI.
- Không nới ngưỡng so sánh của script để số giảm giả. Được sửa script nếu nó đo sai, nhưng phải nói rõ sửa gì và vì sao.
- File CRLF: kiểm `git ls-files --eol <file>` trước khi sửa, sửa bằng công cụ sửa file, không `sed -i`; sau đó `git diff --stat` (file chỉ đổi vài chục dòng thì không được báo hàng trăm dòng).
- Không ghi đường dẫn tuyệt đối ngoài dự án.

## Kiểm (chạy hết, trước khi báo)
```
npx tsc -p tsconfig.app.json --noEmit
npm run check:pptx
npm run test:export
npm run test:slide-text
npm run test:slide-shapes
npm run test:slide-bg
npm run test:slide-decor
npm run test:slide-layout
npx tsx --tsconfig tsconfig.app.json scripts/test-deck-integration.ts
```
(`node_modules` là liên kết về dự án chính. PowerShell chặn `npm.ps1` thì dùng `npm.cmd`; `tsx` lỗi `uv_os_get_passwd` thì dùng cấu hình Node tạm như lần trước, nói rõ.)

## Báo cáo
Bảng **trước / sau** số sai lệch theo từng loại (lấy từ `check:pptx`), danh sách mục đã làm / đã bỏ và lý do, thay đổi nào có thể làm file trông khác hẳn trong PowerPoint (để người dùng nhìn lại), kết quả từng lệnh kiểm (nguyên văn nếu lỗi), và điều chưa kiểm được. Trung thực: chưa mở PowerPoint thì nói chưa.
