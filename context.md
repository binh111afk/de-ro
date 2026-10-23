# context.md — đề rõ (trình soạn đề thi)

Tài liệu này ghi lại toàn bộ trạng thái dự án: đã làm gì, đã gặp lỗi gì, bài học
rút ra, và **những gì còn chưa làm xong**. Đọc file này là đủ để tiếp tục làm việc
mà không cần đọc lại lịch sử hội thoại.

> Cập nhật lần cuối: 23/10/2026 — Chặng 6: làm lại trình soạn slide theo vỏ
> GenOffice (ribbon nhiều tab, nhóm công cụ, gallery/popup, tab ngữ cảnh,
> chọn/kéo/resize/undo).

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

**Trợ lý AI nằm ở đâu (quyết định của chủ dự án, không theo GenOffice):** ở
trình soạn đề (`/soan-de`) panel AI ở cột **trái**; ở trình soạn slide panel AI ở
cột **phải** (cột trái là danh sách thumbnail). `AiDock` nhận prop `side="left" |
"right"` để đảo rail, viền panel và hướng nút thu gọn.

Các màn khác: Đề thi của tôi, Thư viện, Cộng đồng, Chấm điểm, Quiz. Slide không có
màn riêng — mọi tài liệu (đề/slide/bảng tính) được tạo và mở từ tab **Bắt đầu**
trong `/soan-de`; `/soan-slide` chỉ redirect về đó.

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
│ tab strip kiểu Chrome — "Bắt đầu" + các đề đang mở      │  (cao 40px)
├──────────┬───────────────────────────────┬───────────────┤
│  AI      │  ruler (cao 20px)             │  nav pane     │
│  dock    ├───────────────────────────────┤  (288px)      │
│  (360px) │  sân giấy A4 xám #e6e6e6      │  Mục lục      │
│          │  trang trắng có đổ bóng        │  Khối mẫu     │
│          ├───────────────────────────────┤  Tìm kiếm     │
│          │  status bar (cao 24px)         │               │
└──────────┴───────────────────────────────┴───────────────┘
```

Khi tab "Bắt đầu" active: vùng dưới tab strip hiện **trang dashboard**
(`StartTab.tsx`) thay cho vỏ soạn đề — hero chào theo giờ, 3 thẻ loại tài liệu,
bộ lọc + danh sách "Gần đây". Nền trang = `--surface` (trắng) khớp với nền tab
active để chân cong của tab nối liền.

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
  Tab đầu tiên là "Bắt đầu" (icon nhà từ GenOffice shell); tab tài liệu dùng icon
  theo loại (`DocIcon`).
- `src/examEditor/StartTab.tsx` — trang "Bắt đầu": hero chào theo giờ, 3 thẻ loại
  tài liệu (Đề thi / Slide / Bảng tính), bộ lọc + danh sách "Gần đây".
- `src/examEditor/useSlidingThumb.ts` — hook đo vị trí phần tử active để làm thẻ
  trượt của segmented control.
- `src/components/docIcons.tsx` — 3 icon loại tài liệu (đề xanh lam / slide cam đất /
  bảng tính xanh lá) vẽ lại từ file SVG gốc.
- `src/examEditor/AiPanel.tsx` — empty state + starter pill + composer bo 16px.
- `src/examEditor/NavPanel.tsx` — ô tìm kiếm + dải tab (có thẻ trượt) + vùng nội dung.
- `src/pages/ComposeDoc.tsx` — ghép toàn bộ, auto-fit, save, print, export.
- `src/store/compose.ts` — store phiên nhiều tab, nội dung + undo/redo riêng từng tab.

### 3.6. Chức năng đã nối

Chèn khối mẫu (ribbon + nav panel) · lưu theo từng tab · xuất Word · in A4 ·
áp kết quả AI · điều hướng khối từ mục lục / tìm kiếm · zoom + auto-fit ·
undo/redo theo từng tab (trong store).

### 3.7. Build

- `npx tsc -b --noEmit` — **sạch**.
- `npm run build` — **thành công**. Còn cảnh báo bundle chính ~1.1 MB vượt ngưỡng
  Vite 500 kB (đã có `manualChunks` cho vendor/math).
- `npm run test:convert` — **6/6 pass**.

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
`@fontsource-variable/newsreader`.
- `tsx` — **vẫn cần**: `npm run test:convert` chạy `tsx scripts/test-convert.mjs`.
  (Ghi chú cũ trong context nói đã gỡ `tsx` là không đúng.)

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
`npm run test:convert` 6/6 pass.

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
`npm run test:convert` 6/6 pass.

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
`npm run test:convert` 6/6 pass.

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
`npm run test:convert` 6/6 pass.

---

### 3.14. Chặng 4 — Nhận diện thương hiệu mới + tab Bắt đầu + animation (23/10/2026)

Commit `9b5ba99` (đã push) + một lượt sửa chưa commit (xem mục 6.6).

**Bộ nhận diện mới (file do người dùng cung cấp):**
- `public/brand/logo-de-ro.svg` — logo chính 194×72 (mark + chữ "đề rõ", fill
  `#15191C`). Dùng thẳng file gốc bằng `<img>` để giữ nguyên nét chữ.
- `public/brand/favicon.svg` — cắt riêng phần mark trong logo (viewBox
  `4 2 68 68`) làm favicon; `index.html` trỏ sang file này thay vì data-URI cũ.
- `src/components/docIcons.tsx` (mới) — vẽ lại 3 icon loại tài liệu từ file gốc
  để chỉnh size tuỳ ý: `IconDocExam` (nền xanh lam `#EAF1FB`, đề + bút chì),
  `IconDocSlide` (nền cam đất `#FBECE5`, màn hình + biểu đồ), `IconDocSheet`
  (nền xanh lá `#EAF4ED`, lưới ô) + `DocIcon` bộ phân loại theo `kind`.

**Logo web** (`src/components/Layout.tsx`): xoá component `Mark` (icon trang trắng
vẽ tay + chữ font) → thay bằng `<img src="/brand/logo-de-ro.svg">`. Header cao
36px (`h-9`), footer 28px (`h-7`).

**Loại tài liệu** (`src/data/docTypes.ts`, `src/store/compose.ts`):
- Thêm `DocKind = 'exam' | 'slide' | 'sheet'`.
- `ExamDoc.kind?` (mặc định `'exam'`), `OpenTab.kind` — tab trong tab strip giờ
  render `DocIcon` theo loại tài liệu thay vì icon trang trắng chung.
- Trang Bắt đầu: thẻ "Đề thi" (bấm được) / "Slide" / "Bảng tính" dùng icon mới;
  pill lọc "Gần đây" thêm **Bảng tính** → trạng thái rỗng "Bảng tính chưa mở".
- Xoá thẻ "Mở đề đã lưu" (không cần — danh sách Gần đây đã ở ngay dưới) và
  bỏ luôn CSS `.quick-folder` thành code chết.

**Bố cục thẻ loại** (`compose.css` `.quick-cards`): đổi từ flex sang **grid**
`repeat(auto-fit, minmax(min(100%, 200px), 1fr))`. Lý do: flex `flex: 1` kéo giãn
thẻ cuối hết hàng khi số thẻ không chia hết. Grid tự chia đều phần chiều rộng
còn lại, tự xuống hàng khi chật.

**Icon tab "Bắt đầu" = ngôi nhà** (`src/examEditor/icons.tsx` `IconHome`):
lấy nguyên artwork từ GenOffice shell
(`_ref/genoffice/apps/shell/src/renderer/src/TabBar.tsx` → `HomeIcon`, canvas
24×24, nhà + chấm cửa, stroke `currentColor` 1.5). Bản `IconHome` 16×16 có sẵn
trong repo nhưng là icon ribbon của app docs, **chưa dùng ở đâu** — đã thay.

**Animation thẻ trượt** (segmented control):
- `src/examEditor/useSlidingThumb.ts` (mới) — hook đo `offsetLeft`/`offsetWidth`
  của phần tử active + `ResizeObserver`, trả về `{x, w}`.
- Dùng cho 2 chỗ: `.filter-pills` (trang Bắt đầu: Tất cả / Đề thi / Slide /
  Bảng tính) và `.nav-tabs` (nav pane phải: Mục lục / Khối mẫu / Tìm kiếm).
- Thẻ trắng là phần tử riêng `.filter-pill__thumb` / `.nav-tab__thumb`
  (`pointer-events: none`), pill có `z-index: 1` để chữ luôn nằm trên.
- Chuyển động: `transform` + `width` 280ms `cubic-bezier(0.32,0.72,0,1)`;
  pill `:active` `scale(0.96)` (bộ lọc) / `scale(0.97)` (nav tab).
- Vì sao đo bằng JS chứ không hardcode: chữ active đậm hơn (`font-weight: 600`)
  nên bề rộng pill đổi theo → hardcode sẽ lệch.

**Sửa nền trang Bắt đầu** (`compose.css` `.start-scroll`): nền cũ
`var(--color-paper)` = `#f7f8f7` lệch với nền tab active (`--surface` trắng) →
tab trắng bị "đứt" khỏi vùng dưới. Đổi sang `var(--surface)`.

**Kiểm chứng:** `npx tsc -b --noEmit` sạch · `npm run build` thành công ·
`npm run test:convert` 6/6 pass · browser: logo header/footer, favicon 200, 3
thẻ loại + pill Bảng tính, icon nhà trên tab, thẻ trượt ở cả 2 segmented
control, console không lỗi.

### 3.15. Chặng 5 — Sửa triệt để lỗi ribbon không hoạt động (23/10/2026)

Người dùng báo: "các công gụ trên ribbon không hoạt động được", menu Ký hiệu
(tab Chèn) bị tràn, và không mở được tab làm việc mới. Đã tái hiện trong
trình duyệt thật và sửa gốc — không phải sửa triệu hiện tượng.

**Nguyên nhân gốc #1 — ribbon giữ editor đã bị destroy:**
`ExamEditor` báo editor cho host qua `onCreate` (TipTap gọi trong `setTimeout(0)`
sau `mount()`). Khi đổi tab, `key={activeId}` remount `ExamEditor`: editor cũ bị
destroy, editor mới được tạo — nhưng `onCreate` của editor **cũ** vẫn chạy
sau đó và set vào state. Ribbon nhận editor đã chết → mọi `chain()` rơi vào im
lặng (ProseMirror không báo lỗi khi view đã destroy).

Cách phát hiện: đọc React fiber của `.ribbon` để lấy `props.editor`, so với
`document.querySelector('.ProseMirror').editor` (TipTap gắn editor instance
lên DOM node) → thấy `same: false`, `ribbonDestroyed: true`.

Sửa:
- `ExamEditor` báo editor trong `useEffect` (sau commit) thay vì `onCreate` /
  `onMount` — `onMount` của TipTap gọi trong lúc `EditorContent` đang render →
  React báo *"Cannot update a component while rendering a different component"*.
- `ComposeDoc` dùng **derived state**: `editorState = { id, editor }`, lấy
  `editor = editorState.id === activeId ? editorState.editor : null`. Nhờ vậy
  đổi tab là editor cũ biến mất ngay, không phải đợi effect con báo lại.
  (Dùng `useEffect(() => setEditor(null), [activeId])` sẽ **xoá nhầm** editor
  mới vì effect cha chạy sau effect con.)
- `Ribbon` chặn editor đã destroy ở **một chỗ duy nhất**: `chain()` trả
  `undefined` nếu `editor.isDestroyed`, `disabled = !editor || editor.isDestroyed`.
  Các lệnh gọi trực tiếp dùng biến `live` (editor còn sống) — `insertTemplate`,
  `applyStylePreset`, `applyCase`, `clearFormatting`, `capturePainter`, xóa
  bảng/hàng/cột/khối, các `applyFormatAttrs`.

**Nguyên nhân gốc #2 — `formatStyle` sinh CSS sai:**
- Trả về **object** `{ marginLeft: '24px' }` → `mergeAttributes` của TipTap parse
  `style` bằng `parseStyleEntries` — chỉ hiểu **chuỗi** → style bị nuốt rỗng.
  Sửa: `formatStyle` trả về chuỗi `"margin-left: 24px; …"`.
- Dùng **camelCase** (`marginLeft`) — CSS cần kebab-case (`margin-left`).
  Sửa: đổi hết sang kebab-case.
- Node `paragraph` của StarterKit chỉ có `textAlign` → các nút thụt lề / đổ
  bóng / viền im lặng khi đoạn đang đứng là paragraph (ô bảng, dòng trả lời).
  Sửa: thêm `BaseParagraphNode` (tên node `paragraph`, `priority: 1000`) có đủ
  `formatAttrs`; tắt `paragraph` của StarterKit (`paragraph: false`).

**Nguyên nhân gốc #3 — chèn khối mẫu sai cấp:**
`insertContent` chèn tại con trỏ; nếu con trỏ đang ở giữa một `examBullet`,
khối mẫu bị nhét vào trong node text → schema báo *"Invalid content for node
examBullets"*. Sửa: chèn tại `target.pos + target.node.nodeSize` (sau khối cấp
cao nhất) bằng `insertContentAt`. Áp cho cả ribbon (`insertTemplate`) và nav
panel (`handleInsertTemplate` trong `ComposeDoc`).

**Nguyên nhân gốc #4 — menu Ký hiệu bị tràn:**
`useAnchoredPopover` ép `width: 220px` trong khi lưới ký hiệu cần
10×28px + 9 gap 2px + padding = 314px → ô cuối nằm ngoài viewport.
Sửa: `useAnchoredPopover(open, minWidth)` nhận minWidth tuỳ chỉnh;
`popoverStyle` dùng `minWidth` thay vì `width` cứng (menu co theo nội dung);
`SymbolPicker` truyền `314`; bỏ `max-width: 300px` của `.rb-symbol-grid`.

**Nguyên nhân gốc #5 — nút "+" không tạo tab mới:**
`newDocAndOpen` tái dùng tab trống duy nhất → bấm "+" thấy không có gì xảy
ra, tưởng nút hỏng. Sửa: tách 2 hành vi — nút "+" trên tab strip **luôn** tạo
tab mới (`newDocAndOpen(false)`), thẻ "Đề thi" ở trang Bắt đầu mới tái dùng
tab trống (`newDocAndOpen(true)`).

**Nguyên nhân gốc #6 — nút In im lặng khi popup bị chặn:**
`printDoc` gọi `window.open(...)`; khi trình duyệt chặn popup thì trả `null`, code cũ
`if (!w) return` → bấm In không ra gì, tưởng nút hỏng. Thêm `printViaHiddenFrame`:
in ra chính trang hiện tại qua iframe ẩn (vẫn đúng A4 nhờ CSS `@page`). Đồng
thời gán `w.onload` **trước** `w.document.close()` — gán sau thì nội dung có
thể đã load xong, `w.print()` không bao giờ chạy.

**5 nút ribbon không có handler — đã nối:**
- Trái sang phải / Phải sang trái → thêm attr `dir` (`'ltr' | 'rtl'`) vào
  `formatAttrs` + `FormatAttrs`, render thành CSS `direction`.
- Màu trang (tab Thiết kế) → `PageSetup.pageColor`, áp vào `.doc-paper`.
- Viền trang (tab Thiết kế) → `PageSetup.pageBorder` (px), áp vào `.doc-paper`.
- Khung kiểu → popover liệt kê `STYLE_PRESETS` (dùng lại `applyStylePreset`).

**Kiểm chứng (trình duyệt thật, 1 tab, từng nút một):**
- Tab Trang chủ: 20/20 nút định dạng OK (Đậm, Nghiêng, Gạch chân, Gạch ngang,
  Chỉ số dưới/trên, 4 nút căn lề, thụt lề ±, đổ bóng, viền, tô sáng, màu chữ,
  phóng/thu chữ, đổi kiểu chữ, xóa định dạng) + 15/15 nút còn lại (3 kiểu danh
  sách, chọn tất cả, hiện ¶, LTR/RTL, 8 style preset, khung kiểu).
- Tab Chèn: ngắt trang, bảng (TablePicker 3×3), bảng đáp án, thang điểm, xóa
  bảng/hàng/cột/khối, trắc nghiệm, tự luận, đoạn văn, tiêu đề, danh sách,
  liên kết, ký hiệu, công thức — tất cả OK. Menu ký hiệu 315.6px, mép phải
  1433.6 < viewport 1440 → không tràn.
- Tab Bố cục: lề 1→3cm, hướng dọc/ngang (794px ↔ 1123px), input Trước/Sau/
  Thụt trái/Dòng đầu, giãn dòng, ngắt trang, zoom — tất cả OK.
- Tab Thiết kế: màu trang (nền đổi sang rgb(238,244,255)), viền trang — OK.
- Tab Tài liệu: Lưu, Xuất Word (download OK), Xuất PDF — OK. Nút In: giả lập
  chặn popup → fallback iframe chạy, `print()` được gọi 1 lần, không lỗi.
- Luồng nhiều tab: tạo 3 tab bằng "+", chuyển qua lại, nội dung + định dạng
  được giữ, ribbon vẫn ăn trên tab mới, Lưu → "Đã lưu".
- Tìm/Thay thế: tìm "Phương án" → 5 hit, đếm 1/5; thay tất cả → OK.
- Console: không còn lỗi nào.
- `npx tsc -b --noEmit` sạch · `npm run build` thành công ·
  `npm run test:convert` 6/6 pass.

### 3.16. Chặng 6 — Làm lại trình soạn slide theo vỏ GenOffice (23/10/2026)

Mục tiêu: slide không còn là một hàng toolbar icon; port cơ chế ribbon, nhóm lệnh,
gallery/popup và tab ngữ cảnh từ `_ref/genoffice/apps/slides` vào model `Deck` hiện
có (không kéo Konva/IPC/PPTX engine).

**Vỏ mới (`SlideRibbon.tsx`, `slide.css`):**
- Ribbon **trải hết chiều ngang** phía trên editor (trước nằm trong cột giữa), rồi
  mới tới hàng `thumbnail | stage | AI dock`.
- Hàng tab: Trang chủ · Chèn · Vẽ · Thiết kế · Chuyển tiếp · Hoạt ảnh · Trình chiếu ·
  Xem lại · Xem; tab ngữ cảnh thêm vào cuối theo loại đối tượng đang chọn
  (Định dạng hình / Định dạng ảnh / Thiết kế bảng / Thiết kế biểu đồ).
- Body 92px, nhóm ngăn bằng `.ribbon-sep`, nút lớn icon + nhãn dưới, nút nhỏ 28×30.
- **Icon port đúng bộ slide của GenOffice** (`slideIcons.tsx`, canvas 24×24,
  `pinnedStroke` giữ nét ~1.5px): New Slide, Slide Layout, Play current/from start,
  Find, AI Beautify/FactCheck/Image, object align/flip, shape gallery, transition
  gallery. Các icon trùng tên dùng lại bộ docs (`icons.tsx`, canvas 16×16). Không
  còn dùng Lucide trong ribbon.
- Quick Access (Lưu/Hoàn tác/Làm lại, 16px) nằm **trước hàng tab** như GenOffice;
  không còn tiêu đề bài giảng hay nút Trình chiếu ở góc phải hàng tab. Tên bài
  giảng sửa được ở đầu cột thumbnail.
- Popup/gallery dùng `useAnchoredPopover` (`position: fixed`) nên không bị ribbon
  `overflow-x` cắt: menu Dán/Slide/Trình chiếu, bảng 8×5, gallery hình, gallery
  biểu đồ, gallery chủ đề.
- Tab Trang chủ bám thứ tự ảnh mẫu: AI (Trợ lý AI + 3 nút chưa hỗ trợ) · Bảng tạm
  (Dán + Cắt/Sao chép) · Trình chiếu · Slide · Phông chữ (2 combo + tăng/giảm cỡ +
  B/I/U/x²/x₂/màu chữ) · Đoạn văn · Định dạng (Format Pane) · Căn chỉnh ·
  Tìm/Thay thế (disabled — slide chưa có find).
- Tab Chèn: Slide mới/Bố cục · Bảng · Hình ảnh · Hình dạng/Biểu đồ · Hộp văn bản.
- Tab Thiết kế: gallery chủ đề + nền; Chuyển tiếp: 4 hiệu ứng + áp dụng tất cả;
  Xem: zoom + bật/tắt Bảng chọn/AI.
- **AI trên ribbon (23/10/2026):** icon nút "Trợ lý AI" dùng file tĩnh
  `public/brand/ai-static.svg` (do người dùng cung cấp), nhóm AI được đẩy ra **rìa
  phải** ribbon bằng `.ribbon-flex-spacer`. Icon Lottie động ở header panel AI đã bị
  xoá cho cả slide và docx (header chỉ còn chữ "Trợ lý AI").
- Icon trên tab tài liệu (đề/slide) và tab "Bắt đầu" cùng cỡ 20px; container
  `.tab-item__icon` nới từ 18 lên 20px.

**Lõi chỉnh sửa (`SlideEditor.tsx`, `store/docs.ts`):**
- Chọn phần tử bằng click (outline clay), tab ngữ cảnh tự mở cho ảnh/bảng/biểu đồ.
- Kéo để di chuyển, handle góc để resize; tọa độ vẫn % để thumbnail/presenter khớp.
- Phím tắt: Delete/Backspace xoá, Ctrl/Cmd+Z/Shift+Z undo/redo, Ctrl/Cmd+D nhân
  bản, Esc bỏ chọn.
- Undo/redo trong phiên editor: mọi mutation đi qua `commitDeck` (chụp snapshot
  trước khi đổi); kéo/resize chỉ chụp 1 lần lúc bắt đầu rồi preview không ghi history.
- Copy/cut/paste nội bộ, sắp xếp lớp (front/back/forward/backward), căn theo slide,
  lật ngang/dọc.
- Bảng chọn định dạng (X/Y/Rộng/Cao %, màu chữ/màu tô) mở từ ribbon.
- `SlideElement` thêm optional: `fontWeight`, `fontFamily`, `textColor`,
  `fontStyle`, `textDecoration`, `align`, `zIndex`, `flipX`, `flipY` — deck cũ vẫn đọc được.
- `SlideThumb`/`SlideElView` render cùng style mới (font, màu, căn lề, lật, z-index).

**Home là nơi duy nhất chứa tài liệu (23/10/2026):**
- `/soan-slide` không còn trang danh sách/tạo riêng — redirect về `/soan-de`
  (`Navigate replace`). Xoá `pages/Slides.tsx`. Mọi thứ bắt đầu từ tab "Bắt đầu"
  trong `/soan-de`; MyDocs cũng trỏ về `/soan-de`.
- Autosave ở store compose: `saveTab(id)` lưu cả đề và slide vào `myDocs`/`myDecks`;
  `saveAll()` gọi khi đóng tab, bấm "Bắt đầu", `pagehide`/`beforeunload`, và khi
  unmount route (chỉ nếu có tab dirty). Tab chưa sửa và chưa từng lưu thì không tạo
  bản ghi rỗng.
- Đóng tab = lưu xong vào Home; danh sách "Gần đây" hiển thị cả `.docx` và `.pptx`.

**Sửa lỗi kèm theo:** `/soan-slide` trước cao `100dvh - 68px` dù route đã full-screen
→ dải trắng 68px dưới đáy; route này giờ redirect nên không còn trang đó.

**Chưa hỗ trợ (hiện disabled, không giả lập):** Tìm/Thay thế trong slide, bố cục
slide, cỡ slide, viền hình, hoạt ảnh, comment, media/SmartArt, import-export PPTX.

**Đính kèm trong composer AI + placeholder docx (23/10/2026):**
- Nút đính kèm (paperclip) ở góc trái footer composer, `multiple`, chỉ nhận
  `.doc/.docx/.xls/.xlsx/.csv/.pdf` và `image/*`; file khác bị bỏ qua.
- Chip tệp hiện phía trên textarea: Word/Excel/PDF dùng icon tĩnh
  `public/brand/file-icons/{doc,sheet,pdf}.svg`; ảnh dùng thumbnail object URL.
  Có nút bỏ từng tệp, hiện cả tên + dung lượng, và hiển thị lại trong lượt chat.
- Gửi kèm danh sách tệp (tên + loại) trong message cho LLM; chưa parse nội dung
  nhị phân của docx/xlsx/pdf (cần thư viện riêng nếu muốn trích xuất).
- Editor docx có placeholder “Bắt đầu soạn đề…” khi tài liệu rỗng; bấm vào là
  focus editor, gõ chữ đầu tiên thì placeholder biến mất.

**Animation (23/10/2026):**
- Đổi tab ribbon: `.ribbon-tab-page` remount theo tab, fade + trượt lên 3px
  (170ms `--ease-soft`) — áp cho cả ribbon đề và ribbon slide.
- Đổi tab tài liệu: `.anim-tab-in` trên `.compose-canvas` (đề) và `.slide-stage`
  (slide), 200ms.
- Chip tệp AI: `attach-in` 200ms khi thêm, `attach-out` 160ms trước khi bỏ khỏi
  state (delay 170ms) nên có animation xoá thật.
- Dòng “Gần đây” ở tab Bắt đầu: `recent-out` 170ms (mờ dần + trượt trái) rồi mới
  xoá khỏi store.
- Tất cả animation bị tắt khi `prefers-reduced-motion: reduce`.

**Kiểm chứng:** `npx tsc -b --noEmit` sạch · `npm run build` thành công ·
`npm run test:convert` 6/6 pass · browser thật: placeholder hiện/ẩn đúng, đính kèm
đủ 4 loại tệp với icon/thumbnail, kéo-thả nút gửi bật đúng; slide vẫn chọn/kéo/
resize/undo, chèn hình, đổi tab Thiết kế/Chuyển tiếp/Xem và trình chiếu bình thường,
console không lỗi.

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

### 6.1. Đã kiểm chứng lại trong trình duyệt (chặng 5, 23/10/2026)

Xem mục **3.15** — đã kiểm chứng bằng thao tác thật trên trình duyệt:
chèn khối mẫu từ ribbon và nav panel, sửa + lưu + đóng/mở lại tab, áp kết quả
AI, xuất Word, nhiều tab đổi qua lại, Tìm/Thay thế, toàn bộ nút ribbon.
Còn lại:

- [ ] **Undo/redo theo từng tab** — có trong store nhưng chưa có nút ribbon
      gọi tới (chỉ TipTap undo/redo nội bộ). Chưa test qua UI.
- [ ] **Mục lục / tìm kiếm ở nav panel nhảy đúng khối** (`handleGoToBlock`) —
      chưa test thao tác nhảy.
- [ ] **Áp kết quả AI** (`handleAiResult`) — chưa chạy thật với proxy LLM.

### 6.2. Lỗi fidelity của converter (đã sửa 3/3, còn 1 việc khác)

- [x] **Bảng đáp án mất dữ liệu khi round-trip** — đã sửa (xem mục 3.9): duyệt đúng
      cấp bảng `table > tableRow > cell`, bỏ ô nhãn cột nhưng vẫn đọc ô dữ liệu.
- [x] **Header trái/phải không ghép lại** — đã sửa (xem mục 3.9): gộp theo attr `side`.
- [x] **Mất `formatAttrs` khi round-trip** — đã sửa (xem mục 3.9): giữ attrs cấu
      hình ở node/mark.
- [ ] Phân trang hiện **đo theo khối cấp cao nhất**, chưa tách nội dung dài qua biên
      giữa trang (giống GenOffice đã có `tests/pagination-corpus` — tham khảo
      `apps/docs/src/renderer/editor/`).

### 6.3. Về mặt thẩm mỹ, còn lệch so với bản gốc

- [ ] Ribbon hiện **chưa có** các nhóm lớn như bản gốc: Styles gallery (Normal /
      No Spacing), Borders, Shading, Page Number, Watermark, Table Layout…
      Bản gốc có đầy đủ; hiện chỉ có các nhóm cơ bản vì cần map sang schema đề.
      *(Font colour + highlight colour **đã có** từ chặng 1, mục 3.9; commit
      `9b5ba99` bổ sung highlight đa màu + nhớ màu đã chọn.)*
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
- [x] Dropdown "Giãn dòng" đọc `format.lineHeight` (từ `useFormatState`) — đã
      đúng, không còn `defaultValue` cứng. Đã kiểm chứng: chọn "2,0" → span
      `style="line-height: 2"`.
- [ ] Số trang trong status bar lấy bằng cách đếm `.doc-paper` trong DOM → cập nhật
      chậm hơn 1 nhịp so với nội dung thật. Nên lấy trực tiếp từ `ExamEditor`
      (đã có state `pageCount` bên trong) thay vì đếm DOM.
- [ ] Auto-fit đang tính theo `clientWidth` của `.compose-scroll`; khi người dùng
      cuộn ngang, thanh cuộn ngang chiếm chỗ → tỉ lệ nhảy. Cần trừ cả gutter
      ngang.

### 6.5. Việc khác

- [ ] Bundle chính ~1 MB, vượt ngưỡng Vite 500 kB. Cần code-split (lazy route cho
      `/soan-de`, tách `bank.ts`/`community.ts` ra chunk riêng).
- [ ] Thư mục `_ref/genoffice/` (clone git của GenOffice) nằm trong dự án — nên giữ
      lại làm tài liệu tham chiếu (dùng để lấy icon nhà, icon loại tài liệu), hoặc
      chuyển ra ngoài sau khi port xong. **Đã xác nhận còn nguyên** — lần trước
      báo "thư mục trống" là do `Get-ChildItem` chạy sai, không phải mất file.
- [x] Test cho converter (`tipTapToBlocks` ⇄ `blocksToTipTap`) — `scripts/test-convert.mjs`,
      `npm run test:convert`, hiện **6/6 pass** (mục 3.9 thêm case màu chữ + tô sáng).
- [x] `_ref/_shell_extract*.txt` — đã xoá.
- [x] Chạy ponytail-audit, xóa code chết + dependency thừa (xem mục 3.8).
- [ ] Update lại chính file `context.md` này sau mỗi chặng — mục 3.14 mới bổ sung
      ngày 23/10, các mục 3.9–3.13 vẫn còn sót chi tiết cũ.

### 6.6. Thay đổi chưa commit (23/10/2026)

Working tree hiện có 9 file sửa + 3 file mới, **chưa commit** (chỉ `9b5ba99` đã push):

| File | Nội dung |
|---|---|
| `index.html` | favicon → `/brand/favicon.svg` |
| `src/components/Layout.tsx` | logo mới ở header + footer (xoá `Mark`) |
| `src/components/docIcons.tsx` | **mới** — 3 icon loại tài liệu + `DocIcon` |
| `src/data/docTypes.ts` | `DocKind`, `ExamDoc.kind` |
| `src/store/compose.ts` | `OpenTab.kind` |
| `src/examEditor/StartTab.tsx` | thẻ icon mới + Bảng tính + xoá "Mở đề đã lưu" + thẻ trượt |
| `src/examEditor/TabStrip.tsx` | icon theo loại tài liệu, tab Bắt đầu dùng icon nhà |
| `src/examEditor/NavPanel.tsx` | thẻ trượt cho dải tab nav pane |
| `src/examEditor/useSlidingThumb.ts` | **mới** — hook đo thẻ trượt |
| `src/examEditor/icons.tsx` | `IconHome` thay bằng artwork GenOffice shell |
| `src/examEditor/compose.css` | grid `.quick-cards`, `.start-scroll` nền surface, animation thumb |
| `public/brand/*` | **mới** — `logo-de-ro.svg`, `favicon.svg` |

**Chặng 5 (mục 3.15) — sửa lỗi ribbon, thêm file nữa:**

| File | Nội dung |
|---|---|
| `src/examEditor/ExamEditor.tsx` | báo editor trong `useEffect`; `PageSetup` thêm `pageColor` / `pageBorder`; `.doc-paper` áp màu + viền |
| `src/examEditor/Ribbon.tsx` | chặn editor đã destroy qua biến `live`; nối 5 nút rỗng (LTR/RTL, màu trang, viền trang, khung kiểu); chèn khối mẫu ở cấp block; `StylePaneButton` |
| `src/examEditor/schema.ts` | `formatAttrs` thêm `dir`; `formatStyle` sinh CSS kebab-case dạng chuỗi; `BaseParagraphNode` (node `paragraph` có đủ `formatAttrs`, thay paragraph của StarterKit) |
| `src/examEditor/formatState.ts` | `FormatState.dir`; `getSelectedBlock` / `syncDomSelection` dùng chung |
| `src/examEditor/useAnchoredPopover.ts` | `minWidth` tuỳ chỉnh thay vì `width` cứng 220px |
| `src/examEditor/InsertMenus.tsx` | `SymbolPicker` truyền `minWidth: 314` cho popover ký hiệu; `TablePicker` |
| `src/examEditor/exportBlocks.ts` | `printDoc` fallback in qua iframe ẩn khi `window.open` bị chặn; gán `onload` trước `close()` |
| `src/components/Layout.tsx` | thanh nav còn 4 mục (Trang chủ / Soạn đề / Đề cộng đồng / Kho tài liệu), mỗi mục nằm **một dòng** (`whitespace-nowrap`); bỏ Soạn slide, Đề của tôi, Chấm bài khỏi nav (route vẫn còn) |
| `src/examEditor/TabStrip.tsx` | nút quay lại (mũi tên `‹`) đứng trước tab "Bắt đầu" → `navigate('/')` về landing page |
| `src/examEditor/compose.css` | style `.tab-back-btn` (30×30, bo tròn 6px, hover nền 6%) |
| `src/pages/ComposeDoc.tsx` | editor theo derived state (`editorState.id === activeId`); nối `pageColor`/`pageBorder`; nút "+" luôn tạo tab mới; `handleInsertTemplate` chèn ở cấp block |
| `src/data/docTypes.ts` | `FormatAttrs.dir` |


---

## 7. Bản đồ file

```
src/
  examEditor/
    genoffice-tokens.css   token chrome/ruler/paper — đã re-theme clay/Be Vietnam Pro
    compose.css            toàn bộ vỏ giao diện (ribbon, tab strip, nav, AI dock, doc stage)
    slide.css              vỏ trình soạn slide (ribbon gallery/popup, stage, Format Pane)
    SlideRibbon.tsx        ribbon slide nhiều tab + nhóm lệnh + tab ngữ cảnh
    SlideEditor.tsx        trình soạn slide (thumbnail, stage, chọn/kéo/resize, AI dock)
    slideIcons.tsx         icon slide port GenOffice (canvas 24×24, nét 1.5px)
    icons.tsx              189 icon SVG (port từ GenOffice + tự vẽ, canvas 16×16)
    schema.ts              node + mark TipTap cho cấu trúc đề (kèm format attrs)
    convert.ts             ExamBlock <-> TipTap JSON (giữ marks/format), buildTocFromDoc
    formatState.ts         useFormatState + applyFormatAttrs (trạng thái định dạng cho ribbon)
    Dropdown.tsx           dropdown tùy chỉnh thay <select> native (gs-dd*)
    find.ts                tìm kiếm ProseMirror + plugin bôi vàng kết quả
    FindPanel.tsx          panel Tìm/Thay thế (2 tab, match case, nguyên từ)
    InsertMenus.tsx        TablePicker/ImagePicker/SymbolPicker/EquationDialog/LinkDialog
    useAnchoredPopover.ts  fixed popover + viewport collision handling
    useSlidingThumb.ts     hook đo vị trí active → thẻ trượt của segmented control
    deleteActions.ts       GenOffice-style delete table/image/block commands
    ExamEditor.tsx         editor TipTap + lớp giấy A4 + placeholder "Bắt đầu soạn đề…"
    Layout.tsx             RibbonTabs/RibbonBody/RibbonGroup/RibbonButton/Ruler/AiDock/NavPane
    Ribbon.tsx             ribbon Word (Home đầy đủ + Insert/Layout/Design/Doc)
    TabStrip.tsx           tab strip kiểu Chrome (tab "Bắt đầu" + icon theo loại tài liệu)
    StartTab.tsx           trang "Bắt đầu" (hero + thẻ loại tài liệu + danh sách Gần đây)
    AiPanel.tsx            panel AI (chat + starter + composer + đính kèm docx/xlsx/pdf/ảnh)
    NavPanel.tsx           nav pane (mục lục / khối mẫu / tìm kiếm) — dải tab có thẻ trượt
    templates.ts           BLOCK_TEMPLATES — nguồn duy nhất cho ribbon + nav panel
    exportBlocks.ts        xuất Word + in A4 (richToHtml + format CSS)
  components/
    Layout.tsx             vỏ web (header/footer) — logo mới /brand/logo-de-ro.svg
    docIcons.tsx           icon loại tài liệu: IconDocExam/IconDocSlide/IconDocSheet + DocIcon
  pages/ComposeDoc.tsx     trang Soạn đề (ghép vỏ, auto-fit, save, print, export)
  store/compose.ts         store phiên nhiều tab (nội dung + undo/redo từng tab, OpenTab.kind)
  store/docs.ts            store tài liệu đã lưu (myDocs, saveDocById)
  data/docTypes.ts         kiểu ExamBlock + RichText/Span/Mark/FormatAttrs + DocKind
  lib/llm.ts               client gọi /api/llm
server/llmProxy.ts         proxy LLM (key server-side)
public/brand/
  logo-de-ro.svg           logo chính 194×72 (mark + chữ "đề rõ")
  favicon.svg              mark cắt từ logo, dùng làm favicon
  ai-static.svg            icon AI tĩnh cho nút "Trợ lý AI" trên ribbon
  file-icons/
    doc.svg                icon Word cho tệp đính kèm AI
    sheet.svg              icon bảng tính cho tệp đính kèm AI
    pdf.svg                icon PDF cho tệp đính kèm AI
scripts/test-convert.mjs   test round-trip converter (npm run test:convert) — 6/6 pass
_ref/genoffice/            clone mã nguồn GenOffice (Apache-2.0) — tham chiếu (còn nguyên)
```

---

## 8. Lệnh

```powershell
# dev (chạy trong thư mục dự án mới)
cd C:\Users\Lenovo\Desktop\workspace\dethinhbien
npm run dev -- --port 5184 --host 127.0.0.1

# chạy tách rời (không bị giới hạn 1 giờ của task nền)
Start-Process cmd.exe -ArgumentList '/c','npm run dev -- --port 5184 --host 127.0.0.1 > dev-server.log 2>&1' -WindowStyle Hidden

# kiểm tra
npx tsc -b --noEmit
npm run build
npm run test:convert    # 6/6 pass

# test proxy LLM
npm run test:llm        # scripts/test-llm.mjs
```

Route ứng dụng: `http://127.0.0.1:5184/soan-de`

**Lưu ý:** dev server chạy trong task nền của MCode sẽ bị dừng sau 1 giờ
(`maxRunMs` 3600000). Nếu bị tắt giữa chừng — đây là hạn chế runtime, **không
phải lỗi code**; kiểm tra `dev-server.log` rồi chạy lại bằng lệnh `Start-Process`
ở trên.

---

## 9. Ghi chú về bản quyền

`_ref/genoffice/` là clone mã nguồn `https://github.com/genspark-ai/genoffice`
(Apache-2.0). Các phần đã port sang dự án này:

| File đích | Nguồn |
|---|---|
| `src/examEditor/icons.tsx` | `apps/docs/src/renderer/components/icons.tsx` |
| `src/examEditor/icons.tsx` (`IconHome`) | `apps/shell/src/renderer/src/TabBar.tsx` → `HomeIcon` |
| `src/examEditor/genoffice-tokens.css` | `packages/ui/src/tokens.css` + `apps/docs/src/renderer/styles.css` |
| `src/examEditor/compose.css` | `apps/docs/src/renderer/styles.css` + `apps/shell/src/renderer/src/tabbar.css` |

Ngoài ra, 3 icon loại tài liệu trong `src/components/docIcons.tsx` **không** port từ
GenOffice — đó là file SVG do người dùn cung cấp, vẽ lại bằng React theo cùng
nét. Logo chính + favicon cũng là file SVG do người dùn cung cấp.

Apache-2.0 cho phép dùng lại kể cả thương mại, chỉ cần giữ phần thông báo bản
quyền. File `icons.tsx` đã có ghi chú attribution ở đầu file.
