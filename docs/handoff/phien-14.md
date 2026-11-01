# Bàn giao phiên 14 (01/11/2026)

## Đã làm

**Trình soạn slide**
- Chọn nhiều phần tử: Shift + bấm, Ctrl+A. Thanh nổi có căn trái/giữa/phải/trên/giữa/dưới và giãn đều ngang/dọc (từ 3 mục trở lên). Kéo một mục thì cả nhóm đi theo; Delete xoá cả nhóm (`src/lib/slideAlign.ts`, `GroupToolbar` trong `SlideEditor.tsx`).
- Đổi kích thước cũng hút vào đường gióng (chỉ khi hình không xoay, không giữ Alt, không khoá tỉ lệ).
- Panel Đồ hoạ giữ vị trí cuộn khi bấm "Xem tất cả" rồi quay lại.
- Bo góc và viền của hình tính theo `cqw` (khung chuẩn rộng 1000px), nên thumbnail thu nhỏ đúng tỉ lệ.
- Hộp chữ của layout co vừa chữ (`textEl` trong `slideLayouts.ts`), hết khoảng trống dư phía dưới. Chỉ áp dụng cho slide tạo mới.
- AI đặt đồ hoạ ở 7 layout (thêm `section` và `closing`). Prompt khuyên chọn hình gần nghĩa thay vì để trống (`slideAi.ts`, `supportsGraphic`).

**Kho đồ hoạ: 572 → 705 icon**
- Vẽ lại: mũi tên vòng cung, la bàn, trái tim, bút bi, USB, máy in, cánh đồng lúa, ống nhỏ giọt, bảng tuần hoàn, học sinh giơ tay.
- Thêm mới: trái tim vỡ, 8 icon giáo dục, 54 icon toán và hình học (gồm Venn ba tập, tập con), 20 khoa học, 20 thiên nhiên, 30 ngữ văn.

## Quy trình tạo icon (dùng cho phiên sau)

Yêu cầu mẫu: *"thêm 20 icon cho nhóm X, nhớ kiểm lại"*. Làm theo đúng các bước dưới đây.

### 1. Chỗ sửa
- `src/lib/graphics.ts` là file **sinh tự động**, không sửa tay.
- Icon mới và icon vẽ lại đều nằm trong `scripts/graphics-redraw.mjs`:
  - `REDRAWN[id] = svg(...)`: thay hình của icon đã có.
  - `ADDED.push({ after, id, name, category, keywords, svg })`: thêm icon mới, chèn ngay sau icon `after`. Một đợt nhiều icon thì viết mảng `[id, name, keywords, svg]` rồi `reduce` nối tiếp `after`. Xem `MATH_NEW`, `SCI_NEW`, `NAT_NEW`, `LIT_NEW`.
  - Khối mới phải nằm **sau** khai báo `ADDED` và **trước** `export const REDRAWN`.
- Sinh lại kho: `node scripts/import-graphics.mjs`.

### 2. Chọn nhóm và tránh trùng
- Tên nhóm hiện trên panel nằm trong `GRAPHIC_CATEGORY_LABEL` của `src/lib/slideGraphics.ts`. Ví dụ `lang` = **"Ngữ văn"**, `lit` = **"Văn học"**. Phiên này từng xếp nhầm 30 icon vào `lit`, phải chuyển sang `lang`. **Hỏi lại hoặc tra nhãn trước khi chọn nhóm.**
- Liệt kê icon đã có của nhóm (và tìm theo tên ở mọi nhóm) để không vẽ trùng:
  ```bash
  node -e "const s=require('fs').readFileSync('src/lib/graphics.ts','utf8');for(const m of s.matchAll(/id: \"([^\"]+)\",\s*name: \"([^\"]+)\",\s*category: \"lang\"/g))console.log(m[1],m[2])"
  ```
- Môn học nào thấy nhóm nào thì xem `graphicGroups` trong `src/lib/slideSubjects.ts`. Nhóm mới phải có ở đây thì AI mới dùng.

### 3. Quy ước vẽ (test kiểm một phần)
- Khung `0 0 70 70`, chừa lề khoảng 4px. Nét `#22333B` dày 3, đầu và góc nét tròn.
- Chỉ dùng màu pastel có sẵn: `MINT, PEACH, BEIGE, BLUE, PINK, GREEN, YELLOW, LILAC, WHITE`. Màu tô xuất hiện nhiều nhất (bỏ trắng và mực) là **màu chủ đạo**, người dùng đổi được. Mỗi icon phải có ít nhất một màu pastel không phải trắng.
- **Mỗi icon tối thiểu 2 `<path>`.** `<circle>` không được tính, nên dùng `cp()` hoặc `ring()` (đường tròn vẽ bằng path).
- **Cấm** `<rect>`, `<text>`, `<image>`, gradient, filter. Chữ như "log", "n!" hay π phải vẽ bằng nét `bold()`.
- Vẽ **từ sau ra trước**: phần nằm sau vẽ trước, phần tự tô sẽ che nét phía sau. Cạnh khuất dùng `dash()`.
- Helper có sẵn trong file: `fill, line, circle, dot, cp, ring, bold, dash, poly, ngon, rsq, card, circD, ellipseD, polar, sparkle, annular, blossom, tint`. Xoay cả nhóm bằng `'<g transform="rotate(a 35 35)">' … '</g>'`.
- Từ khoá viết không dấu, đủ các cách giáo viên hay viết trên slide. AI chỉ giữ hình khi từ khoá trùng ít nhất một từ (từ 3 chữ cái trở lên) với chữ trên slide (`graphicFits`).

### 4. Kiểm tra (bắt buộc)
1. `node scripts/import-graphics.mjs`.
2. Sửa số lượng ghi cứng trong `scripts/test-slide-graphics.mjs` (hiện là **565**, tức số icon không tính ornament), rồi chạy `npm run test:slide-graphics` (21 nhóm). Lỗi hay gặp: icon có dưới 2 path.
3. **Soi bằng mắt từng icon** ở 2 cỡ, khoảng 80–100px và 28–32px. Dán đoạn sau vào trình duyệt đang mở dev server (thay id đầu và số lượng):
   ```js
   const m = await import('/src/lib/graphics.ts?t='+Date.now()); const all = Object.values(m).find(v=>Array.isArray(v)&&v[0]?.svg);
   const d=document.createElement('div'); d.id='__chk'; d.style.cssText='position:fixed;left:0;top:0;width:800px;height:600px;z-index:2147483647;background:#fff;display:grid;grid-template-columns:repeat(5,1fr);gap:2px;padding:4px';
   const i0=all.findIndex(x=>x.id==='ID-DAU'); for(const e of all.slice(i0,i0+20)) d.insertAdjacentHTML('beforeend',`<div style="text-align:center;font:10px sans-serif">${e.svg.replace('<svg','<svg width=84 height=84')}${e.svg.replace('<svg','<svg width=28 height=28')}<br>${e.name}</div>`);
   document.documentElement.append(d)
   ```
   Gắn vào `documentElement` vì React có thể dựng lại `body`. Mỗi lần sinh lại kho, trang sẽ tải lại, phải chèn lại. Xong thì gỡ `#__chk`.
4. Lỗi thường gặp khi soi:
   - Ô hoặc chấm nhỏ dưới khoảng 9px bị nét 3px lấp kín. Cần phóng to.
   - Sao 4 cánh quá mảnh, thành chấm đen. Dùng `sparkle()` vì nó có điểm điều khiển lệch khỏi tâm.
   - Cung `A` sai chiều nên tô sai phần, ví dụ bánh phân số. Cách chắc ăn là vẽ từng phần tư riêng.
   - Hình rõ ở cỡ to nhưng rối ở cỡ nhỏ vì quá nhiều vạch chia. Cần bỏ bớt.
   - Hình dễ hiểu sai nghĩa, ví dụ áo dài thành áo sơ mi với quần đùi. Cần vẽ lại theo dáng đặc trưng.
5. `npx tsc -b --noEmit`.

## Còn lại / chưa kiểm
- Chưa tạo thử bài giảng thật bằng AI sau khi nới prompt đồ hoạ và co hộp chữ. Cần xem AI có chọn hình gượng không (`graphicFits` khá lỏng) và chữ có bị co nhỏ do ước lượng chiều cao hụt không.
- Panel Đồ hoạ có hai mục "Ngữ văn" (`lang`, 39 icon) và "Văn học" (`lit`, 19 icon) dễ gây nhầm. Có thể gộp.
- Vài icon còn khó nhận nếu slide không có chữ đi kèm: BCNN, Đàn bầu, Cầu tre, Thác nước.
- Chọn nhiều phần tử: chưa có kéo khung để chọn. Hình đang xoay thì được căn theo hộp chưa xoay. Ctrl+A bằng bàn phím thật chưa kiểm.
- Các layout thẻ, dòng thời gian, sơ đồ tư duy chưa có icon cho từng mục.
- Dữ liệu thử trên máy dev: bài giảng "Bài giảng mới".
