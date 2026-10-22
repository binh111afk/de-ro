# context.md — đề rõ (trình soạn đề thi)

Tài liệu này ghi lại toàn bộ trạng thái dự án: đã làm gì, đã gặp lỗi gì, bài học
rút ra, và **những gì còn chưa làm xong**. Đọc file này là đủ để tiếp tục làm việc
mà không cần đọc lại lịch sử hội thoại.

> Cập nhật lần cuối: 22/10/2026 — Chặng 1+2: nâng cấp ExamBlock lên rich text,
> sửa 3 bug converter, Ribbon Trang chủ + Chèn đầy đủ, Tìm/Thay thế, re-theme
> clay/Be Vietnam Pro, sửa bố cục tab strip.

## 0. Vị trí dự án

```
C:\Users\Lenovo\Desktop\workspace\dethinhbien
```

> **Lưu ý:** dự án đã được **chuyển** từ thư mục phiên làm việc cũ
> (`~\.minimax\sessions\mvs_198c7695ae8240c5a34b2d4862cc8661\workspace`) sang vị trí
> trên ngày 22/10/2026. Bản cũ đã được đưa vào Recycle Bin (khôi phục được).
> Từ giờ mọi lệnh `cd` / đường dẫn tương đối phải trỏ về thư mục mới.
>
> Lệnh dev hiện tại (chạy ở cổng 5184 vì 5183 đã được dùng cho bản cũ):
>
> ```powershell
> cd C:\Users\Lenovo\Desktop\workspace\dethinhbien
> npm run dev -- --port 5184 --host 127.0.0.1
> ```

---

## 1. Dự án là gì

Ứng dụng web (React 19 + TypeScript + Vite 6 + Tailwind v4 + TipTap 3) giúp soạn đề
thi tiếng Việt theo mô hình tài liệu Word. Trang **Soạn đề** (`/soan-de`) là trình
soạn thảo chính: full-screen, ribbon nhiều tab, tab strip nhiều đề, dock AI bên trái,
nav pane (mục lục / khối mẫu / tìm kiếm) bên phải, sân giấy A4 thật ở giữa.

Các màn khác: Soạn slide, Đề thi của tôi, Thư viện, Cộng đồng, Chấm điểm, Quiz.

### Nguyên tắc bất di bất dịch của dự án

1. **`ExamBlock` là mô hình lưu bền vững.** Mọi luồng (AI sinh đề, thư viện, xuất
   Word, in A4) đều đi qua `ExamBlock`. TipTap chỉ là lớp trình bày bên trong.
2. **Một editor TipTap liên tục.** Không clone/split editor theo từng trang, nếu
   không con trỏ và undo/redo sẽ vỡ. Lớp giấy A4 chỉ là hình nền vẽ phía sau.
3. **Không lộ credential.** API key của LLM nằm server-side, đi qua proxy
   same-origin `/api/llm`. Không đưa key vào bundle hay checkpoint.
4. **Tiếng Việt, bám GenOffice/Word** cho phần vỏ giao diện.

---

## 2. Quyết định kiến trúc then chốt

| Quyết định | Lý do |
|---|---|
| TipTap/ProseMirror thay editor cũ | Cần một editor duy nhất liên tục để phân trang không vỡ con trỏ |
| Vẽ lớp giấy `.doc-paper` phía sau `.doc-flow` | Giữ 1 editor, vẫn có trang A4 thật có bóng đổ |
| `ExamBlock` là cầu nối AI ↔ TipTap ↔ Word ↔ in | Không phá vỡ luồng cũ khi chuyển engine |
| Store `compose` chỉ quản lý phiên nhiều tab; tài liệu đã lưu ở `useDocStore` | Tách "đang mở" khỏi "đã lưu" |
| Khối mẫu định nghĩa 1 lần ở `src/examEditor/templates.ts` | Ribbon và NavPanel cùng đọc, không lệch dữ liệu |
| `zoom` (CSS property) chứ không phải `transform: scale()` | `zoom` ảnh hưởng layout → thước kẻ và trang giấy luôn khớp nhau, container giữ đúng bề rộng (giống `.doc-zoom` của GenOffice) |
| Trang A4: 21 × 29,7 cm, lề 2 cm, quy đổi theo 96 dpi | PAGE_W = 794px, PAGE_H = 1123px, MARGIN = 76px |
| Auto-fit co **theo chiều rộng** khung nhìn, giới hạn 25%–130% | Word cũng vậy; bỏ giới hạn 50% cứng vì khi mở cả 2 panel trên màn hẹp thì trang biến mất |

---

## 3. Đã hoàn thành

### 3.1. Hạ tầng AI

- Proxy LLM server-side: `server/llmProxy.ts` — key ở server, client gọi
  `/api/llm` cùng origin.
- Client: `src/lib/llm.ts` (`callLlm`, `extractJson`).
- Module xử lý AI đề: `src/lib/examAI.ts`.
- Kiểu dữ liệu tài liệu: `src/data/docTypes.ts` (`ExamBlock` và các biến thể).
- **Đã sửa lỗi provider trả về content rỗng**: thêm retry, log raw response và
  thông báo lỗi rõ ràng thay vì im lặng. Đã test thật với
  `xkiro/minimax-m3.1-flash` → trả về JSON 37 block thành công.

### 3.2. Các màn hình khác

- Soạn slide, Đề thi của tôi (quota, sort, grid/list, menu), Thư viện, Cộng đồng,
  Chấm điểm, Quiz.

### 3.3. Schema TipTap cho cấu trúc đề — `src/examEditor/schema.ts`

Các node: `examHeader`, `examTitle`, `examMeta` (+`examMetaRow`), `examStudent`,
`examHeading`, `examParagraph`, `examBullets` (+`examBullet`), `examQuestion`
(+`examQuestionPrompt`, `examOption`), `examEssay` (+`examEssayPrompt`,
`examEssaySub`), `examAnswerKey`, `examRubric` (+`examRubricTitle`, `examRubricItem`),
`examPageBreak`, `examDivider`.

### 3.4. Converter hai chiều — `src/examEditor/convert.ts`

- `tipTapToBlocks(json)` → `ExamBlock[]`
- `blocksToTipTap(blocks)` → TipTap JSON
- `buildTocFromDoc(json)` → mục lục

### 3.5. Trình soạn đề — vỏ GenOffice (đã dựng lại lần này)

Cấu trúc:

```
┌──────────────────────────────────────────────────────────┐
│ ribbon-tabs: Trang chủ | Chèn | Bố cục | Thiết kế | Tài liệu │  ribbon (cao 80px)
├──────────────────────────────────────────────────────────┤
│ tab strip kiểu Chrome — nhiều đề đang mở                │  (cao 40px)
├──────────┬───────────────────────────────┬───────────────┤
│  AI      │  ruler (cao 20px)             │  nav pane     │
│  dock    ├───────────────────────────────┤  (288px)      │
│  (360px) │  sân giấy A4 xám #e6e6e6      │  Mục lục      │
│          │  trang trắng có đổ bóng        │  Khối mẫu     │
│          ├───────────────────────────────┤  Tìm kiếm     │
│          │  status bar (cao 24px)         │               │
└──────────┴───────────────────────────────┴───────────────┘
```

Files:

- `src/examEditor/genoffice-tokens.css` — **lớp token** port từ
  `packages/ui/src/tokens.css` + `apps/docs/src/renderer/styles.css`.
  Word-blue `#185abd`, chrome trung tính, token ruler / status bar / paper.
- `src/examEditor/compose.css` — toàn bộ vỏ, lấy nguyên số đo từ bản gốc.
- `src/examEditor/icons.tsx` — **189 icon SVG**, trong đó ~160 icon port trực tiếp
  từ `apps/docs/src/renderer/components/icons.tsx` của GenOffice, phần còn lại tự
  vẽ theo cùng ngôn ngữ hình ảnh. **Không có emoji nào.**
- `src/examEditor/Ribbon.tsx` — ribbon Word: nhóm `rb-big` (icon + nhãn dưới),
  `rb-icon` 28×30, `rb-select`, phân cách `ribbon-sep`.
- `src/examEditor/Layout.tsx` — `RibbonTabs`, `RibbonBody`, `RibbonGroup`,
  `RibbonButton`, `RibbonIconButton`, `Ruler`, `AiDock`, `NavPane`, `useViewportSize`.
- `src/examEditor/TabStrip.tsx` — tab strip kiểu Chrome (đĩa hover/active, chân cong).
- `src/examEditor/AiPanel.tsx` — empty state + starter pill + composer bo 16px.
- `src/examEditor/NavPanel.tsx` — ô tìm kiếm + dải tab + vùng nội dung.
- `src/pages/ComposeDoc.tsx` — ghép toàn bộ, auto-fit, save, print, export.
- `src/store/compose.ts` — store phiên nhiều tab, nội dung + undo/redo riêng từng tab.

### 3.6. Chức năng đã nối

Chèn khối mẫu (ribbon + nav panel) · lưu theo từng tab · xuất Word · in A4 ·
áp kết quả AI · điều hướng khối từ mục lục / tìm kiếm · zoom + auto-fit ·
undo/redo theo từng tab (trong store).

### 3.7. Build

- `npx tsc -b --noEmit` — **sạch**.
- `npm run build` — **thành công**. Còn cảnh báo bundle chính ~1 MB vượt ngưỡng
  Vite 500 kB (đã có `manualChunks` cho vendor/math).

### 3.8. Dọn dẹp bloat (ponytail-audit, 22/10/2026)

Đã xóa code chết và dependency thừa tìm được khi audit toàn repo:

**Đã xóa (không có route/import nào trỏ tới):**
- `src/pages/Composer.tsx` — trình soạn bản cũ, bị `ComposeDoc.tsx` thay thế.
- `src/lib/ai.ts`, `src/lib/examAI.ts` — module AI cũ, trùng vai trò với `lib/llm.ts` đang chạy thật.
- `src/lib/exportDoc.ts` — bản sao của `examEditor/exportBlocks.ts`.
- `src/components/DocView.tsx`, `src/components/examEditor/*` (MenuBar, SidePanel, AiPanel, Ribbon) — vỏ editor cũ trước khi chuyển sang `src/examEditor/*`.
- `server/testLlm.ts`, `server/testProvider.ts`, `scripts/test-llm.mjs` — script debug thủ công, không có `npm script` nào gọi.
- `_ref/_shell_extract*.txt` — file trích CSS tạm.

**Đã gỡ dependency không dùng** (grep xác nhận không file nào import):
`@tiptap/extension-subscript`, `@tiptap/extension-superscript`,
`@tiptap/extension-link`, `@tiptap/extension-underline`,
`@tiptap/extension-placeholder`, `@fontsource-variable/figtree`,
`@fontsource-variable/fraunces`, `@fontsource-variable/inter`,
`@fontsource-variable/newsreader`, `tsx` (chỉ dùng cho script test đã xóa).

**Giữ lại** (grep nhầm lúc đầu, thực ra đang dùng):
- `@tiptap/extension-text-style` — `ExamEditor.tsx` import `TextStyle`.
- `ExamSheet.tsx`, `exportDocx.ts`, `ExamView.tsx` — route `/de/:id` đang dùng.

Typecheck + build chạy lại sau khi dọn: **sạch**.

### 3.9. Chặng 1 — Rich text + Ribbon Trang chủ đầy đủ + re-theme (22/10/2026)

Mục tiêu: giao diện trình soạn đề bám đúng GenOffice (bố cục, icon, số đo) nhưng
dùng theme web của app (clay `#b4532a`, Be Vietnam Pro), và nâng `ExamBlock` lên
rich text để không mất định dạng khi lưu.

**Mô hình dữ liệu (`src/data/docTypes.ts`):**
- Thêm `Span {text, marks}`, `Mark {type, attrs}`, `RichText = string | Span[]`
  (string = plain text, tương thích ngược dữ liệu cũ), `FormatAttrs {align,
  lineHeight, indentLeft, indentFirstLine, spaceBefore, spaceAfter, borders, shading}`.
- Mọi field text (`title.text`, `paragraph.text`, `question.text`,
  `options[].text`, `essay.sub[]`, `answerKey.items[].answer`, `rubric.items[].text`…)
  đổi sang `RichText`; thêm `format?: FormatAttrs` cho block/đoạn con.
- 13 block type giữ nguyên — không thêm block tự do.

**Converter (`src/examEditor/convert.ts`) — viết lại, sửa 3 bug mất dữ liệu:**
1. `answerKey` bị nuốt toàn bộ items: trước duyệt `node.content` (thực ra là 1
   node `table`) thay vì `table > tableRow > cell`; lại còn `continue` mọi dòng có
   ô đầu `tableHeader` — trong khi `blocksToTipTap` luôn sinh ô đầu 'Câu'/'Đáp án'.
   Giờ duyệt đúng cấp bảng, bỏ ô nhãn cột, vẫn đọc ô dữ liệu.
2. Header trái/phải: `blocksToTipTap` tách 2 node nhưng `tipTapToBlocks` không
   ghép lại → mất 1 nửa header. Giờ gộp theo attr `side`.
3. Inline marks bị làm phẳng (textOf chỉ lấy text). Giờ `richOf` giữ marks,
   gộp span liền nhau cùng marks.

Thêm `plainText(rt)` cho mục lục/label. Test round-trip: `npm run test:convert`
(`scripts/test-convert.mjs`) — 5/5 pass.

**Schema TipTap (`src/examEditor/schema.ts`):**
- Thêm mark `underline`/`sub`/`super` (`EXAM_MARKS`) — StarterKit chỉ có
  bold/italic/strike.
- Thêm `formatAttrs` (align/lineHeight/indent/space/borders/shading) cho mọi node
  text-bearing; render thành inline style.
- `TextAlign`/`LineHeight` giờ đăng ký cho cả node exam (trước chỉ `paragraph`
  → nút căn lề/giãn dòng không hoạt động trong ô bảng/đề).

**Xuất Word/in (`src/examEditor/exportBlocks.ts`):** thêm `richToHtml(Span[])`
→ `<b>/<i>/<u>/<s>/<sub>/<sup>/<span style>`; `format` render thành inline CSS
(align/line-height/margin/border/background).

**Prompt AI (`src/examEditor/AiPanel.tsx`):** mô tả `text` có thể là chuỗi hoặc
`[{text, marks}]`, thêm field `format`.

**Ribbon Trang chủ (`src/examEditor/Ribbon.tsx`, `formatState.ts`, `compose.css`):**
- `formatState.ts` mới: `useFormatState(editor)` snapshot bold/italic/underline/
  strike/sub/super/highlight/font/align/lineHeight/indent/space/borders/shading
  tại con trỏ (so sánh nông để khỏi re-render thừa); `applyFormatAttrs(editor, patch)`
  ghi thuộc tính cấp đoạn vào block exam tại con trỏ.
- Home tab đầy đủ theo nhóm GenOffice: Clipboard (Paste/Cut/Copy/Format Painter) ·
  Phông chữ (font family/size combo, grow/shrink, change case, clear formatting,
  B/I/U/S dạng glyph `<b>B</b>`, sub/super, highlight + font color split palette
  15 màu OOXML + theme colors) · Đoạn văn (bullets/numbering/multilevel,
  indent ±, show/hide ¶, align L/C/R/J, LTR/RTL, line spacing 1→3, shading split,
  borders split trên/dưới/trái/phải/khung/không) · Kiểu (gallery Normal/No Spacing/
  Title/Subtitle/Heading 1-3/Quote áp ở cấp block) · Chỉnh sửa (Tìm/Thay thế/Chọn
  tất cả — Tìm/Thay thế nối ở chặng 2) · Cỡ trang (In/Tỉ lệ).
- CSS mới: `.rb-split`, `.rb-color-bar`, `.rb-color-drop`, `.rb-color-menu`,
  `.rb-color-grid`, `.rb-color-swatch`, `.rb-color-item`, `.rb-styles`,
  `.rb-style-card` (preview + label).

**Re-theme (`genoffice-tokens.css`, `compose.css`):** word-blue `#185abd` → clay
`#b4532a`; `--canvas #e6e6e6` → `#eef0ef`; `--gs-font-sans Inter` →
`'Be Vietnam Pro'`; ruler/status/tabstrip/paper tokens chuyển sang palette
ink/line/canvas của `index.css`. Số đo giữ nguyên (ribbon 80px, ruler 20px,
status 24px, A4 794×1123, margin 76px). `var(--word-blue)` trong `compose.css`
tự nhận màu mới vì đã map qua token.

**Kiểm chứng:** `npx tsc -b --noEmit` sạch · `npm run build` thành công ·
`npm run test:convert` 5/5 pass.

**Còn lại (chặng 2/3):** Tìm/Thay thế panel, ribbon Chèn đầy đủ (table picker,
picture, symbol, equation, link), ribbon Bố cục (margins/paper/columns/breaks),
header/footer theo trang, ruler indent markers kéo được.

### 3.10. Chặng 2 — Tìm/Thay thế + Ribbon Chèn đầy đủ + sửa bố cục (22/10/2026)

**Sửa bố cục (theo phản hồi người dùng):**
- Tab strip (dải đề đang mở) trước nằm **dưới** ribbon body → đã đưa lên **trên
  cùng**, trên cả hàng tab ribbon, đúng thứ tự GenOffice (tab strip → hàng tab →
  ribbon body). Render trực tiếp trong `ComposeDoc.tsx` trước `<Ribbon>`.
- Ribbon được bọc trong `<div className="ribbon">` (`background: var(--chrome-bg)`)
  để có nền riêng, không lộ nền xám canvas.
- Nhóm Clipboard trước xếp **dọc** (nút Dán trên, hàng icon dưới) nên bị
  `overflow-y: hidden` của ribbon body cắt cụt → đổi sang xếp **ngang**
  (nút Dán lớn bên trái + cột 3 icon Cắt/Sao chép/Sao chép định dạng bên phải),
  thêm class `.rb-row--top` + `.rb-col--icons`.
- Nới padding: `.ribbon-body` 8px/14px/6px, cao 92px (trước 82px bị thiếu chỗ),
  `.ribbon-tabs` 6px/12px/4px, `.compose-tabbar` 42px + `border-bottom`.

**Tìm/Thay thế (`find.ts`, `FindPanel.tsx`, CSS `.find-panel`, `.doc-search-hit`):**
- `find.ts`: tìm kiếm thuần ProseMirror (`findMatches` duyệt text node, hỗ trợ
  match case + nguyên từ), plugin `examSearch` bôi vàng kết quả
  (`Decoration.inline`), active = cam đậm. Đóng gói thành TipTap `Extension`
  (`createSearchPlugin`) để đăng ký trong `ExamEditor.tsx`.
- `FindPanel.tsx`: panel nổi góc trên phải vùng soạn, 2 tab Tìm/Thay thế,
  ô nhập + đếm `n/m` + nút ‹/› điều hướng kết quả, ô thay thế + nút Thay/
  Thay tất cả, checkbox Phân biệt hoa/thường + Nguyên từ. Enter = tới kết quả
  sau, Shift+Enter = lùi, Esc = đóng.
- Nút Tìm/Thay thế trong nhóm "Chỉnh sửa" của ribbon Home đã nối
  (`onFind`/`onReplace` → `setFindTab`).

**Ribbon Chèn đầy đủ (`InsertMenus.tsx`, CSS `.rb-drop`, `.rb-modal`, `.rb-table-*`, `.rb-symbol-*`):**
- `TablePicker`: lưới chọn kích thước 10×8 kiểu Word (hover hiện `hàng × cột`),
  chèn `insertTable({rows, cols, withHeaderRow: true})`.
- `ImagePicker`: chọn ảnh từ máy → base64 → `setImage` (node `image` inline
  tự viết trong `schema.ts`, có command `setImage`).
- `SymbolPicker`: lưới 60 ký hiệu toán/lý/hóa/tiền tệ/mũi tên.
- `EquationDialog`: nhập LaTeX, preview KaTeX ngay khi gõ, chèn dạng `$...$`
  (khớp với `MathText`/export hiện có).
- `LinkDialog`: chèn/sửa/bỏ siêu liên kết (extension `Link` của TipTap,
  `openOnClick: false`).
- Nhóm ribbon Chèn mới: Trang · Bảng (TablePicker + Bảng đáp án + Thang điểm) ·
  Minh họa (Hình ảnh) · Câu hỏi · Khối · Liên kết · Ký hiệu (SymbolPicker + Công thức).

**Kiểm chứng:** `npx tsc -b --noEmit` sạch · `npm run build` thành công.

**Còn lại (chặng 3):** ribbon Bố cục đầy đủ (margins/paper size/columns/breaks),
header/footer theo trang, ruler indent markers kéo được.

### 3.11. Chặng 3 — Dropdown tùy chỉnh + canvas đúng kiểu Word + ribbon Bố cục (22/10/2026)

**Dropdown thay `<select>` native (`Dropdown.tsx`, CSS `.gs-dd*`):**
- Port theo `packages/ui/src/dropdown.tsx` của GenOffice: trigger có viền
  (giá trị hiện tại + caret) mở popover tùy chọn do app vẽ — theo theme, không
  bị container `overflow: hidden` của ribbon cắt như popup OS của `<select>` native.
- Hỗ trợ phím mũi tên / Enter / Space / Esc / Home / End khi trigger giữ focus,
  cuộn mục active vào tầm nhìn, đánh dấu selected = màu accent + in đậm.
- `options` cho phép `render` tùy chỉnh (preview font theo font thật).
- Đã thay **mọi** `<select>` native trong Ribbon: font family, font size,
  giãn dòng, lề trang, font trong tab Thiết kế.

**Canvas hoạt động đúng kiểu Word:**
- `TextAlign`/`LineHeight` trước chỉ đăng ký cho node cấp cao nhất → prompt/
  option/bullet không căn lề được. Thêm `TEXT_CONTENT_NODES` trong `schema.ts`
  (tất cả node chứa inline text) và đăng ký cho cả hai extension.
- `applyFormatAttrs` trước áp cho block cấp cao nhất → đổi sang áp cho **node
  text chứa con trỏ** (`selection.$from.parent`), đúng như Word: căn lề/thụt lề
  áp cho đoạn đang đứng, không lan ra cả câu hỏi.

**Ribbon Bố cục đầy đủ (`Ribbon.tsx`):**
- Thiết lập trang: lề (dropdown 1/1,5/2/2,5/3 cm), hướng (dọc/ngang) — **ảnh
  hưởng canvas thật** qua `PageSetup`/`pageGeometry()` (`ExamEditor.tsx`),
  không còn hằng số `PAGE_W`/`PAGE_H`/`MARGIN` cứng.
- Đoạn văn: nút tăng/giảm thụt lề + ô nhập số Thụt trái / Dòng đầu / Trước / Sau
  (gọi `applyFormatAttrs`), dropdown giãn dòng.
- Ngắt: nút Ngắt trang. Hiển thị: zoom −/+.

**Thước kẻ kéo được (`Layout.tsx` `Ruler`, CSS `.ruler-marker`):**
- 3 marker thụt lề kiểu Word (tam giác xuống = dòng đầu, tam giác lên = thụt
  treo, khối vuông = thụt lề trái), kéo để đổi `indentFirstLine`/`indentLeft`
  của đoạn đang đứng, snap 5px.
- Vùng lề trái/phải kéo được → đổi `marginCm` của trang (snap 5px, clamp 20px–nửa trang).

**Kiểm chứng:** `npx tsc -b --noEmit` sạch · `npm run build` thành công ·
`npm run test:convert` 5/5 pass.

**Còn lại:** header/footer theo trang, bảng thuộc tính bảng đầy đủ (borders/
shading per-cell), dark theme.

### 3.13. Sửa TablePicker + xóa bảng/ảnh/khối theo GenOffice (22/10/2026)

**TablePicker:**
- `useAnchoredPopover` giờ collision-aware: popover có bề rộng tối thiểu,
  clamp theo viewport, tự mở lên trên nếu gần đáy, cập nhật khi scroll/resize.
- `.rb-table-picker` dùng `width: max-content`, min-width 224px, grid 10 cột
  gap 3px, label không wrap; không còn bị ép theo bề rộng nút hoặc clipping bởi
  ribbon `overflow-x: scroll`.
- Đã test browser thật ở viewport 1280×720: picker rect 224.6×205.1,
  không tràn viewport; click cell chèn table thành công, không có console error.

**Xóa bảng (`deleteActions.ts`, `ExamEditor.tsx`, `Ribbon.tsx`):**
- `Table.configure({ allowTableNodeSelection: true })` sẽ được dùng khi cần mở rộng
  selection; hiện đã thêm command wrapper-aware.
- Ribbon nhóm Xóa có: Xóa bảng, Xóa hàng, Xóa cột, Xóa khối.
- `deleteCurrentTable`: xóa table thường; với bảng nằm trong `examAnswerKey`,
  xóa cả wrapper để không để block rỗng.
- `DeleteObjects` extension xử lý Delete/Backspace khi NodeSelection là table,
  image/atom, hoặc full table CellSelection; caret bình thường không xóa cả bảng.
- Browser test: tạo table → Xóa bảng = 0 table; tạo answerKey → Xóa bảng = 0
  answerKey wrapper + 0 table; xóa khối cuối vẫn giữ paragraph hợp lệ; console sạch.

**Xóa ảnh/khối:**
- Inline image đã là atom, Delete/Backspace qua `DeleteObjects` xóa đúng node.
- Xóa khối dùng `getSelectedBlock`, giữ paragraph hợp lệ nếu đó là block cuối.

**Validation:** `npx tsc -b --noEmit` sạch · `npm run build` thành công ·
`npm run test:convert` 5/5 pass.

### 3.12. Sửa 2 lỗi người dùng báo: ribbon không hoạt động + dropdown bị che (22/10/2026)

**Ribbon không công cụ nào hoạt động:**
- Nguyên nhân: khi bấm nút trên ribbon, `mousedown` làm editor mất focus **trước
  khi** `click` chạy → selection bị collapse về con trỏ trống → `toggleBold()`…
  áp vào khoảng rỗng, không thấy hiệu quả.
- Cách sửa (giống GenOffice/Word): thêm `onMouseDown={(e) => e.preventDefault()}`
  vào mọi control tương tác của ribbon (`RibbonButton`, `RibbonIconButton` trong
  `Layout.tsx`; nút B/I/U/S glyph, style card, zoom toggle, color caret trong
  `Ribbon.tsx`; table cell, symbol cell trong `InsertMenus.tsx`) — giữ nguyên
  selection của editor khi bấm nút.

**Dropdown bị đẩy lên / bị che thay vì đè lên lớp dưới:**
- Nguyên nhân: popover dùng `position: absolute` bên trong `.ribbon-body` có
  `overflow-x: scroll` → overflow container cắt/clipping mọi thứ `absolute`
  bên trong (dù có `z-index`).
- Cách sửa (đúng cách GenOffice làm): neo popover bằng **`position: fixed`**
  theo tọa độ `getBoundingClientRect()` của trigger (`useAnchoredPopover.ts`),
  cập nhật lại khi cuộn/resize. Đã áp cho `Dropdown.tsx` (gs-dd), `TablePicker`,
  `SymbolPicker` (`rb-drop-menu`), `ColorDropdown` (`rb-color-menu`).

**Kiểm chứng:** `npx tsc -b --noEmit` sạch · `npm run build` thành công ·
`npm run test:convert` 5/5 pass.

---

## 4. Lỗi đã gặp và cách sửa

### 4.1. TipTap v3 — `content` phải là mảng

```ts
// SAI (v2 còn chấp nhận, v3 thì không):
content: { type: 'table', content: [] }

// ĐÚNG:
content: [{ type: 'table', content: [] }]
```

### 4.2. TipTap v3 — `setContent` đổi signature

```ts
// SAI: editor.commands.setContent(content, false)
editor.commands.setContent(content, { emitUpdate: false })
```

### 4.3. `content.child(index)` không trả `.pos`

Phải lấy offset bằng `forEach`:

```ts
editor.state.doc.content.forEach((_node, offset, index) => {
  if (index === targetIndex) position = offset
})
```

### 4.4. Provider LLM trả content rỗng

Triệu chứng: AI "không soạn được" mà không có lỗi. Nguyên nhân: response rỗng /
retry thiếu. Cách sửa: retry + log raw response + báo lỗi rõ ràng cho người dùng.

### 4.5. Hai tab đề đầu tiên bị trùng

**Triệu chứng:** mở `/soan-de` thấy 2 tab "Đề thi mới" giống nhau.

**Nguyên nhân:** React StrictMode gọi effect **hai lần**. Effect cũ đọc
`tabs.length` từ closure của lần render trước → lần gọi thứ hai vẫn thấy `0` →
gọi `newDoc()` lần nữa.

**Cách sửa (đã áp dụng):** đưa logic vào store, kiểm tra trạng thái **tại thời điểm
gọi** thay vì closure:

```ts
// src/store/compose.ts
ensureDoc: () => {
  const s = get()
  if (s.tabs.length > 0) return s.activeId ?? s.tabs[0].id
  return s.newDoc()
},
```

> Bài học: **đừng dựa vào giá trị từ closure trong effect để quyết định "đã tồn tại
> chưa"**. Dùng `get()` bên trong action của store, hoặc một cờ "đã khởi tạo" đặt
> ở nơi không bị reset.

### 4.6. Trang A4 bị co còn ~38%

**Nguyên nhân:** công thức auto-fit cũ lấy `Math.min(byW, byH)` → chiều cao khung
nhìn (thấp) kéo tỉ lệ xuống.

**Cách sửa:** chỉ co theo chiều rộng, `clamp(0.25, 1.3)`.

### 4.7. Thước kẻ lệch với trang giấy (sau khi đổi auto-fit)

**Triệu chứng:** ruler rộng cố định 842px còn trang giấy bị `transform: scale()` →
thước kẻ không khớp mép trang, tràn ra ngoài khung.

**Nguyên nhân:** `transform: scale()` **không** ảnh hưởng layout, nên container
và phần tử bên trong lệch nhau.

**Cách sửa:** dùng CSS `zoom` (ảnh hưởng layout) cho toàn bộ khối chứa thước kẻ +
trang giấy, đặt trong `.compose-canvas { width: fit-content; margin: 0 auto }` —
đúng cách GenOffice làm với `.doc-zoom`.

### 4.8. Giao diện "AI slop", khác 1 trời 1 vực so với bản gốc

**Triệu chứng (báo cáo của người dùng):** giao diện tôi làm khác hẳn ảnh gốc
GenOffice, dùng emoji làm icon, nhìn rất "AI slop".

**Nguyên nhân:** tôi tự phát minh bảng màu (clay/sage/honey), tự bo góc, và dùng
emoji `📋 ✂️ 🖨 ❓ 💾` thay cho icon. Bản gốc dùng:
- chrome trung tính (trắng/xám `#e6e6e6` sân, `#f3f4f6` status bar),
- accent word-blue `#185abd`,
- icon SVG stroke `currentColor` 16×16, nét ~1.5px cố định,
- ribbon cao **cố định** 80px, nút lớn icon-trên-nhãn-dưới.

**Cách sửa:** port thẳng từ mã nguồn gốc thay vì đoán:
- token: `packages/ui/src/tokens.css` → `src/examEditor/genoffice-tokens.css`
- vỏ: `apps/docs/src/renderer/styles.css` → `src/examEditor/compose.css`
- icon: `apps/docs/src/renderer/components/icons.tsx` → `src/examEditor/icons.tsx`
- tab strip: `apps/shell/src/renderer/src/tabbar.css`

### 4.9. `setLineHeight` không tồn tại trong tiptap core

**Triệu chứng:** `npx tsc -b --noEmit` báo lỗi
`Property 'setLineHeight' does not exist on type 'ChainedCommands'`
tại `Ribbon.tsx` (dropdown "Giãn dòng").

**Nguyên nhân:** lệnh `setLineHeight` **không** có sẵn trong `@tiptap/core`
hay bất kỳ extension nào đang dùng — nó chỉ được đăng ký bởi extension
`LineHeight` của `@tiptap/extension-text-style/line-height`. Code dropdown được
port từ GenOffice nhưng quên không đăng ký extension này.

**Cách sửa (đã áp dụng):** import `LineHeight` từ
`@tiptap/extension-text-style/line-height` và đăng ký trong
`ExamEditor.tsx` với `types: ['paragraph', 'heading']`.
Không cần viết extension thủ công (đã thử, bị trùng khai báo kiểu với bản có
sẵn trong thư viện).

---

## 5. Bài học rút ra

1. **Khi được yêu cầu "copy giao diện của repo X", hãy đọc source thật của repo X
   trước khi viết code.** Mã nguồn GenOffice nằm ở `_ref/genoffice/` (Apache-2.0) —
   đọc nó tiết kiệm hơn nhiều so với suy đoán từ ảnh chụp màn hình.
2. **Emoji không bao giờ nên đứng trong UI sản phẩm.** Nó nổi màu, không theo nhịp
   nét của hệ icon, và phá hệ thống hình ảnh. Icon SVG stroke `currentColor` là
   chuẩn của Word/GenOffice.
3. **Số đo cụ thể quan trọng hơn cảm giác "gần giống".** Ribbon 80px, tab strip
   40px, ruler 20px, status bar 24px, AI dock 360px, nav pane 288px, canvas
   `#e6e6e6` — lấy nguyên số từ bản gốc thì nhìn ra ngay là giống.
4. **`transform: scale()` không đổi layout; `zoom` thì có.** Khi cần thước kẻ /
   trang giấy / nội dung luôn khớp nhau, dùng `zoom`.
5. **StrictMode double-invoke effect** là nguyên nhân kinh điển của "tạo bản ghi
   trùng". Kiểm tra idempotency ở tầng store, không ở tầng component.
6. **Một editor liên tục + lớp giấy vẽ nền** là cách đúng để có phân trang thật mà
   không phá con trỏ / undo.

---

## 6. ⚠️ CHƯA LÀM XONG (việc còn tồn đọng)

Phần này là danh sách công việc **còn dở** tại thời điểm ghi file. Xếp theo mức độ
quan trọng.

### 6.1. Chưa kiểm chứng lại trong trình duyệt sau đợt dựng lại giao diện

Đợt dựng lại vừa rồi mới xác nhận bằng **typecheck + build + một ảnh chụp màn hình**
(rồi: ribbon, tab strip, AI rail, ruler, trang A4, status bar đều render đúng;
đúng 1 tab đề; `zoom` đúng áp dụng). **Chưa** kiểm chứng bằng thao tác thật:

- [ ] Chèn khối mẫu từ ribbon và từ nav panel → xác nhận node xuất hiện trên giấy.
- [ ] Sửa nội dung, lưu, đóng tab, mở lại → xác nhận nội dung được khôi phục.
- [ ] Undo/redo theo từng tab (hiện có trong store nhưng chưa test qua UI).
- [ ] Áp kết quả AI vào tài liệu (`handleAiResult`).
- [ ] Xuất Word (`exportDocBlocks`) và in A4 (`printDoc`).
- [ ] Mục lục / tìm kiếm nhảy đúng khối (`handleGoToBlock`).
- [ ] Mở nhiều tab, đổi tab qua lại, xác nhận nội dung và lịch sử không lẫn nhau.

### 6.2. Lỗi fidelity của converter (đã sửa 2/3, còn 1)

- [x] **Bảng đáp án mất dữ liệu khi round-trip** — đã sửa (xem mục 3.9): duyệt đúng
      cấp bảng `table > tableRow > cell`, bỏ ô nhãn cột nhưng vẫn đọc ô dữ liệu.
- [x] **Header trái/phải không ghép lại** — đã sửa (xem mục 3.9): gộp theo attr `side`.
- [ ] Phân trang hiện **đo theo khối cấp cao nhất**, chưa tách nội dung dài qua biên
      giữa trang (giống GenOffice đã có `tests/pagination-corpus` — tham khảo
      `apps/docs/src/renderer/editor/`).

### 6.3. Về mặt thẩm mỹ, còn lệch so với bản gốc

- [ ] Ribbon hiện **chưa có** các nhóm lớn như bản gốc: Styles gallery (Normal /
      No Spacing), font colour + highlight colour với thanh màu, Borders, Shading,
      Page Number, Watermark, Table Layout… Bản gốc có đầy đủ; hiện chỉ có các nhóm
      cơ bản vì cần map sang schema đề.
- [ ] Ribbon gốc có **nút "File" màu word-blue** ở đầu hàng tab, menu File, AutoSave
      toggle, nút Styles Pane. Chưa port.
- [ ] AI panel gốc có rail icon Genspark, nút header (mở rộng/thu gọn), composer có
      nút đính kèm file và pill "Track changes". Hiện mới có tiêu đề + composer.
- [ ] Chưa có dark theme (bản gốc có `[data-theme='dark']` với đầy đủ token).
- [ ] Trạng thái hover/active của ribbon button đã copy nhưng chưa tinh chỉnh theo
      pixel so với bản gốc.

### 6.4. Lỗi nhỏ đã phát hiện khi rà lại (đã sửa 1, còn theo dõi)

- [x] Status bar hiện "Đã lưu" **hai lần** (một ở cột trái, một ở cột phải) — đã
      bỏ bản ở cột phải, chỉ còn cột trái + nhóm zoom ở cột phải.
- [x] `setLineHeight` không tồn tại trong tiptap → đã đăng ký extension
      `LineHeight` của `@tiptap/extension-text-style/line-height` (xem mục 4.9).
- [ ] Dropdown "Giãn dòng" ở `Ribbon.tsx` đang dùng `defaultValue` cứng `"1.5"`,
      không đọc giá trị hiện tại của node đang chọn → hiển thị sai nếu người dùng
      đổi rồi quay lại. Cần đọc `editor.getAttributes('paragraph').lineHeight`.
- [ ] Số trang trong status bar lấy bằng cách đếm `.doc-paper` trong DOM → cập nhật
      chậm hơn 1 nhịp so với nội dung thật. Nên lấy trực tiếp từ `ExamEditor`
      (đã có state `pageCount` bên trong) thay vì đếm DOM.
- [ ] Auto-fit đang tính theo `clientWidth` của `.compose-scroll`; khi người dùng
      cuộn ngang, thanh cuộn ngang chiếm chỗ → tỉ lệ nhảy. Cần trừ cả gutter
      ngang.

### 6.5. Việc khác

- [ ] Bundle chính ~1 MB, vượt ngưỡng Vite 500 kB. Cần code-split (lazy route cho
      `/soan-de`, tách `bank.ts`/`community.ts` ra chunk riêng).
- [ ] Thư mục `_ref/genoffice/` (74 MB, clone git của GenOffice) nằm trong dự án —
      nên giữ lại làm tài liệu tham chiếu, hoặc xoá / chuyển ra ngoài sau khi port
      xong. **Chưa xoá.**
- [ ] Chưa viết test cho converter (`tipTapToBlocks` ⇄ `blocksToTipTap`).
- [x] `_ref/_shell_extract*.txt` — đã xoá.
- [x] Chạy ponytail-audit, xóa code chết + dependency thừa (xem mục 3.8).

---

## 7. Bản đồ file

```
src/
  examEditor/
    genoffice-tokens.css   token chrome/ruler/paper — đã re-theme clay/Be Vietnam Pro
    compose.css            toàn bộ vỏ giao diện (ribbon, tab strip, nav, AI dock, doc stage)
    icons.tsx              189 icon SVG (port từ GenOffice + tự vẽ)
    schema.ts              node + mark TipTap cho cấu trúc đề (kèm format attrs)
    convert.ts             ExamBlock <-> TipTap JSON (giữ marks/format), buildTocFromDoc
    formatState.ts         useFormatState + applyFormatAttrs (trạng thái định dạng cho ribbon)
    Dropdown.tsx           dropdown tùy chỉnh thay <select> native (gs-dd*)
    find.ts                tìm kiếm ProseMirror + plugin bôi vàng kết quả
    FindPanel.tsx          panel Tìm/Thay thế (2 tab, match case, nguyên từ)
    InsertMenus.tsx        TablePicker/ImagePicker/SymbolPicker/EquationDialog/LinkDialog
    useAnchoredPopover.ts  fixed popover + viewport collision handling
    deleteActions.ts       GenOffice-style delete table/image/block commands
    ExamEditor.tsx         editor TipTap + dựng lớp giấy A4 + đo phân trang (PageSetup/pageGeometry)
    Layout.tsx             RibbonTabs/RibbonBody/RibbonGroup/RibbonButton/Ruler/AiDock/NavPane
    Ribbon.tsx             ribbon Word (Home đầy đủ + Insert/Layout/Design/Doc)
    TabStrip.tsx           tab strip kiểu Chrome
    AiPanel.tsx            panel AI (chat + starter + composer)
    NavPanel.tsx           nav pane (mục lục / khối mẫu / tìm kiếm)
    templates.ts           BLOCK_TEMPLATES — nguồn duy nhất cho ribbon + nav panel
    exportBlocks.ts        xuất Word + in A4 (richToHtml + format CSS)
  pages/ComposeDoc.tsx     trang Soạn đề (ghép vỏ, auto-fit, save, print, export)
  store/compose.ts         store phiên nhiều tab (nội dung + undo/redo từng tab)
  store/docs.ts            store tài liệu đã lưu (myDocs, saveDocById)
  data/docTypes.ts         kiểu ExamBlock + RichText/Span/Mark/FormatAttrs
  lib/llm.ts               client gọi /api/llm
server/llmProxy.ts         proxy LLM (key server-side)
scripts/test-convert.mjs   test round-trip converter (npm run test:convert)
_ref/genoffice/            clone mã nguồn GenOffice (Apache-2.0) — tham chiếu
```

---

## 8. Lệnh

```powershell
# dev (chạy trong thư mục dự án mới)
cd C:\Users\Lenovo\Desktop\workspace\dethinhbien
npm run dev -- --port 5184 --host 127.0.0.1

# kiểm tra
npx tsc -b --noEmit
npm run build

# test proxy LLM
npm run test:llm        # scripts/test-llm.mjs
```

Route ứng dụng: `http://127.0.0.1:5184/soan-de`

---

## 9. Ghi chú về bản quyền

`_ref/genoffice/` là clone mã nguồn `https://github.com/genspark-ai/genoffice`
(Apache-2.0). Các phần đã port sang dự án này:

| File đích | Nguồn |
|---|---|
| `src/examEditor/icons.tsx` | `apps/docs/src/renderer/components/icons.tsx` |
| `src/examEditor/genoffice-tokens.css` | `packages/ui/src/tokens.css` + `apps/docs/src/renderer/styles.css` |
| `src/examEditor/compose.css` | `apps/docs/src/renderer/styles.css` + `apps/shell/src/renderer/src/tabbar.css` |

Apache-2.0 cho phép dùng lại kể cả thương mại, chỉ cần giữ phần thông báo bản
quyền. File `icons.tsx` đã có ghi chú attribution ở đầu file.
