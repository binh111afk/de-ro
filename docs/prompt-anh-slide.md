# Prompt: tab "Định dạng ảnh" của soạn slide (cắt ảnh, thay ảnh, bo góc, đổ bóng, viền)

> **Nhánh mới** `feat/anh-slide` tạo từ `main` mới nhất, trong **thư mục riêng**:
> ```
> git fetch origin && git worktree add ../dethinhbien-anh-slide -b feat/anh-slide origin/main
> ```
> Làm trong `../dethinhbien-anh-slide`; chạy `npm install` trước. Chạy dev ở cổng **5190** (`npm run dev -- --port 5190 --host 127.0.0.1`). Không làm trên `main`, không push `--force`, không merge — xong thì commit trên nhánh và báo lại.

---

## Tổng quan

Chọn một **ảnh** trên slide thì ribbon hiện tab ngữ cảnh **"Định dạng ảnh"** (`pictureFormat`, `CONTEXT_LABELS` trong `src/examEditor/SlideRibbon.tsx`). Hiện tab này **dùng chung** `renderElementFormat()` với hình khối / icon (nhóm Màu, Hiệu ứng, Thứ tự lớp, Căn vào slide, Lật, Xoay) — **chưa có gì riêng cho ảnh**.

Việc cần làm (đúng 5 mục, không thêm):
- **A. Thay ảnh** giữ nguyên vị trí, kích thước, xoay, hiệu ứng.
- **B. Cắt ảnh** (crop) kéo trực tiếp trên slide.
- **C. Bo góc** (thanh trượt) + **khung hình** có sẵn (giữ nguyên các khung `photoFrameClip` đang có).
- **D. Đổ bóng** 4 mức (dùng lại `shadowLevel` 0–3 sẵn có).
- **E. Viền ảnh** (độ dày + màu, dùng lại `border` / `borderColor` / `borderStyle` sẵn có).
- Cả 5 mục phải **ra đúng khi trình chiếu và khi xuất PPTX**.

Không đụng tab khác của ribbon, không đụng bộ máy trình chiếu, không đổi định dạng các phần tử không phải ảnh.

## Đọc trước

- `src/store/docs.ts` — `SlideElement` (đã có `src`, `shape`, `radius`, `shadowLevel`, `border`, `borderColor`, `borderStyle`, `opacity`, `locked`, `groupId`).
- `src/examEditor/slideRender.tsx` — nhánh `if (el.type === 'image')` (khoảng dòng 434): vẽ `<img objectFit: cover>`, bo góc cứng `1cqw`, `photoFrameClip(el.shape)`. Hàm `shadowLevelOf`, `SHADOWS`.
- `src/examEditor/slideEditParts.tsx` — `EditableEl` (kéo, đổi cỡ 8 tay nắm, xoay; `startDrag`). **Không phá** kéo/nhóm/khoá vừa làm: phần tử `locked` không được cắt hay thay đổi hình học.
- `src/examEditor/SlideRibbon.tsx` — `renderElementFormat`, `RibbonGroup`, `RibbonButton`, `Anchored`, `ColorPalette` (dùng lại, **không tự làm component mới** nếu đã có).
- `src/lib/mediaStore.ts` — `uploadImage(dataUrl)` (ảnh tải lên đi qua đây; dùng lại cho Thay ảnh).
- `src/lib/exportDeck.ts` — nhánh `el.type === 'image'` (khoảng dòng 258) dùng `slide.addImage` của pptxgenjs.
- Tooltip dùng `data-tip` (+ `data-tip-kbd`), **không dùng `title=`**.

## Dữ liệu mới

Thêm **một** field vào `SlideElement` (tuỳ chọn, deck cũ thiếu vẫn đọc được):

```ts
/** ảnh: vùng cắt, phần trăm cắt bớt mỗi cạnh của ảnh gốc (0–90); thiếu = không cắt */
crop?: { l: number; t: number; r: number; b: number }
```

Bo góc ảnh dùng lại `radius` (px theo cách `slideRender` đang đổi sang cqw cho hình khối: `radius / 10` cqw). Thiếu `radius` thì giữ đúng hành vi cũ (`1cqw`).

## A. Thay ảnh

- Nút **"Thay ảnh"** đầu tab. Bấm → mở chọn tệp (`accept="image/*"`) → `uploadImage` → ghi `src` mới, **xoá `crop`**, giữ mọi field khác.
- Cũng nhận kéo-thả tệp ảnh từ máy vào ảnh đang chọn (nếu dễ; không bắt buộc).
- Có hoàn tác (đi qua `onUpdateSelected` là đủ — nó đã ghi lịch sử).

## B. Cắt ảnh

- Nút **"Cắt"** (bật/tắt). Khi bật, ảnh đang chọn vào chế độ cắt:
  - Hiện **toàn bộ ảnh gốc mờ đi** phía sau, vùng giữ lại sáng rõ, 4 cạnh + 4 góc có tay nắm cắt (kiểu PowerPoint/Canva).
  - Kéo tay nắm thay đổi `crop`; **khung phần tử (x, y, w, h) co theo** vùng cắt để ảnh không bị méo.
  - Enter / bấm ra ngoài / bấm lại nút "Cắt" = xong. Esc = huỷ, về `crop` cũ.
- Nút phụ **"Bỏ cắt"** đặt `crop = undefined` và trả khung về tỉ lệ ảnh gốc.
- Vẽ (`slideRender.tsx`): khi có `crop`, ảnh bên trong khung phóng to và dời sao cho đúng vùng cắt (ví dụ `width: 100/(100-l-r)*100%`, `left: -l/(100-l-r)*100%`, tương tự trục dọc), `objectFit: 'fill'`. Khi không có `crop` giữ `cover` như cũ.
- Gợi ý: cắt chỉ làm cho ảnh **chưa xoay** (`rotation` 0/undefined); ảnh đã xoay thì nút Cắt disabled với `data-tip` giải thích. Như vậy đủ dùng và tránh toán khó.

## C. Bo góc + khung hình

- Thanh trượt **"Bo góc"** 0–50 (ghi `radius`). Khi ảnh có `shape` là khung đặc biệt (`photoFrameClip` trả clip-path) thì thanh trượt disabled.
- Giữ menu khung hình hiện có (nếu ribbon/thanh nổi đang có chỗ chọn `shape` cho ảnh, dùng lại; không làm trùng).

## D. Đổ bóng

- 4 lựa chọn **Không / Nhẹ / Vừa / Đậm** → `shadowLevel` 0–3. Dùng `filter: drop-shadow(...)` hoặc `box-shadow` sao cho **bóng vẫn đúng khi ảnh có bo góc / clip-path** (clip-path cắt mất box-shadow → bọc thêm một lớp ngoài mang `filter: drop-shadow`).

## E. Viền ảnh

- Độ dày (0, 1, 2, 4, 6 px) + màu (`ColorPalette`, màu theme đầu danh sách) + kiểu nét (liền/đứt/chấm). Ghi `border`, `borderColor`, `borderStyle`. Viền phải bám theo bo góc.

## Xuất PPTX (`src/lib/exportDeck.ts`)

- `crop` → tuỳ chọn `sizing: { type: 'crop', ... }` của pptxgenjs (đọc kiểu trong `node_modules/pptxgenjs/types/index.d.ts`; cần kích thước ảnh gốc — lấy bằng `Image()` từ data URL trước khi thêm). Nếu không làm khớp được thì cắt sẵn bằng `<canvas>` rồi xuất ảnh đã cắt — cách nào cũng được, miễn mở PowerPoint thấy đúng vùng cắt.
- `radius` > 0 → `rounding: true` chỉ đúng cho elip; với bo góc thường, cắt sẵn bằng canvas (bo góc trong suốt, PNG) là chấp nhận được.
- `shadowLevel` → `shadow: { type: 'outer', ... }` của pptxgenjs, mức tương ứng.
- `border` → `line` nếu `addImage` hỗ trợ; không hỗ trợ thì bỏ qua và ghi chú trong báo cáo.

## Kiểm tra trước khi báo xong

1. `node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit` sạch.
2. Trên trình duyệt (cổng 5190, khung 1440×900): chèn ảnh → thử đủ A–E, hoàn tác/làm lại từng bước, trình chiếu thấy giống hệt bản soạn.
3. Ảnh **đã khoá** (`locked`) không cắt / thay hình học được; ảnh trong **nhóm** (`groupId`) vẫn kéo cả nhóm bình thường.
4. Deck cũ (ảnh không có `crop`/`radius`) trông **y như trước**.
5. Tải PPTX, mở bằng PowerPoint (hoặc LibreOffice) chụp màn hình slide có ảnh cắt + bo góc + bóng.
6. Báo lại: danh sách file đã sửa, ảnh chụp, phần nào chưa làm được và vì sao.
