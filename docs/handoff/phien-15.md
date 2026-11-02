# Bàn giao phiên 15 (01–02/11/2026)

## Đã làm

**Kho đồ hoạ: 705 → 858 mục (718 icon AI dùng được + 140 hoạ tiết `orn-*`)**
- **Địa lí** (`geo`, 49 icon): thêm 30 icon.
- **Lịch sử** (`his`, 52 icon): thêm 30 icon. Nhóm cũ `soc` "Lịch sử & địa lý" đã tách về hai nhóm này: `import-graphics.mjs` đổi `soc-*` sang `geo` hoặc `his` theo `SOC_GEO`, giữ nguyên id nên slide cũ không mất hình.
- **Sinh học** (`bio`):
  - Bỏ 10 con vật vẽ tay cũ (`ANIMALS_REMOVED`). Thay bằng 43 con vật lấy từ SVG Repo, đã đổi sang màu của kho: nét `#663333` → `#22333B`, màu tô → tông pastel.
  - File SVG đã đổi màu nằm ở `scripts/animals/*.svg`, danh sách id/tên/từ khoá ở `scripts/graphics-animals.mjs`. Mèo, chó, hổ, rùa, bướm dùng lại id cũ.
  - Thêm 30 icon cơ thể người (mắt, tai, tim mạch, nội tạng, xương, máu, y tế), vẽ lại icon Cấu tạo hoa.
- **Hình động** (`anim`, 30 icon): chuyển động SMIL viết sẵn trong SVG (quay, nhịp, lắc, tự vẽ nét, chạy quỹ đạo), chạy được trên slide và khi trình chiếu.
  - Xuất PPTX hoặc ảnh thì lấy khung hình đầu. Icon "tự vẽ nét" được làm sao cho khung đầu luôn có nét đầy đủ.
  - Nhóm này chưa có trong `graphicGroups` của môn nào, nên AI không tự chọn; người dùng chèn tay.

**Trang trí slide theo bộ** (`src/lib/slideDecor.ts`)
- Ở bước dàn ý, AI chọn **một** `decorKit` cho cả bài trong 6 bộ: `ve-tay`, `la-xanh`, `hoa-diu`, `hinh-hoc`, `lap-lanh`, `toi-gian`. Mỗi bộ gồm 3 hoạ tiết theo vai: `corner` (ôm góc), `accent` (điểm nhấn nhỏ), `celebrate` (mở đầu/kết thúc).
- Thiếu bộ thì `planDecorKit` (trong `slideAi.ts`) suy theo style pack rồi theo môn. Style pack consulting hoặc editorial dùng `toi-gian`.
- `DECOR_ANCHORS` là khung thiết kế sẵn cho 12 bố cục, đo theo phần tử thật của từng bố cục.
  - `withKitDecor` trong `slideLayouts.ts` thu hoạ tiết vừa khung. Khung nào vướng phần tử khác thì bỏ trống, không dời đi chỗ khác.
  - Slide mở đầu, chương mục, thông điệp, kết thúc có tối đa 2 món; slide nội dung tối đa 1 món; slide nhiều chữ (trên 320 ký tự) không trang trí.
  - Bộ trang trí thay hoạ tiết mặc định `decor-N` của bố cục statement và closing.
- Bộ được lưu ở `Slide.decorKit` (`store/docs.ts`), nên đổi bố cục, đổi tông, sửa bằng AI hay thêm slide từ tab Mẫu đều giữ đúng bộ. Deck cũ chưa có bộ thì vẫn giữ hoạ tiết mặc định.
- Test: `npm run test:slide-decor` (7 nhóm).
- **Đã thử và bỏ:** cho AI tự chọn hoạ tiết hoặc icon cho từng slide rồi nhét vào góc trống. Kết quả lộn xộn, sai thiết kế, và mỗi slide tốn thêm 6–8 nghìn token prompt.

## Quan trọng: file nguồn icon không còn trong Downloads

- `scripts/import-graphics.mjs` đọc các contact sheet gốc ở `C:/Users/Lenovo/Downloads/` (`112 educational icons · 64px.svg`, `100 icon giáo dục · contact sheet 10×10.svg`, …). Các file này **đã bị xoá** nên chạy lại toàn bộ script bị lỗi ENOENT.
- Cách đang làm tạm: viết icon mới vào `scripts/graphics-redraw.mjs` như cũ, rồi **chèn thẳng vào `src/lib/graphics.ts`** bằng script đọc `ADDED`/`REDRAWN` và ghi đúng định dạng của import. Script mẫu chèn icon `ADDED` còn thiếu:
  ```js
  // node patch-add.mjs (chạy ở gốc dự án)
  import { readFileSync, writeFileSync } from 'node:fs'
  import { pathToFileURL } from 'node:url'
  const { ADDED } = await import(pathToFileURL(process.cwd() + '/scripts/graphics-redraw.mjs'))
  let s = readFileSync('src/lib/graphics.ts', 'utf8')
  for (const { after, ...e } of ADDED) {
    if (s.includes(`id: ${JSON.stringify(e.id)},`)) continue
    const i = s.indexOf(`id: ${JSON.stringify(after)},`)
    const end = s.indexOf('\n  },', i) + 5
    s = s.slice(0, end) + `\n  {\n    id: ${JSON.stringify(e.id)},\n    name: ${JSON.stringify(e.name)},\n    category: ${JSON.stringify(e.category)},\n    keywords: ${JSON.stringify(e.keywords)},\n    ratio: 1,\n    svg: ${JSON.stringify(e.svg)},\n  },` + s.slice(end)
  }
  writeFileSync('src/lib/graphics.ts', s)
  ```
  Muốn sửa một icon đã chèn thì xoá khối `{ id: "…" }` của nó trong `graphics.ts` rồi chạy lại script.
- Nên đưa các sheet gốc vào repo (như `scripts/animals/`) để chạy lại được toàn bộ.
- Số icon ghi cứng trong `scripts/test-slide-graphics.mjs` hiện là **718**.

## Số liệu token (đo từ `.llmlog`, model `deepseek-v4.1-flash`)
- Bài giảng 15 slide: khoảng **60 nghìn token**, ~$0,02–0,035. Gồm 1 lượt dàn ý (~3,2k vào, ~3,7k ra), 15 lượt viết slide (~2,1k vào, ~0,85k ra mỗi lượt) và vài lượt sửa.
- Soạn một đề: khoảng **10 nghìn token**, ~$0,004 (~2,5k vào, ~6,4k ra, trong đó ~4,3k là suy luận). Lượt soạn đề chạy mức suy luận `max`; hạ mức sẽ giảm token ra.

## Còn lại / chưa kiểm
- **Chưa tạo deck thật bằng AI** với trang trí theo bộ, nên chưa biết AI chọn `decorKit` có hợp chủ đề không.
- Chưa lật được hình: vài hoạ tiết ôm góc vốn vẽ cho góc trái, đặt ở góc phải trông ngược chiều.
- Icon con vật từ SVG Repo chi tiết hơn icon tự vẽ, làm `graphics.ts` nặng thêm ~140KB. Nên xem lại giấy phép trước khi dùng thương mại.
- Gà trống, trâu, voi, thỏ, cá heo không có bản thay. Slide cũ dùng 5 id này sẽ mất hình.
- Biến màu trình soạn đề vẫn mang tên cũ `--word-blue` dù giá trị là màu nâu đất nung `#b4532a` (`--color-clay` trong `index.css`).
