# context.md — đề rõ (trình soạn đề thi)

Tài liệu này ghi lại toàn bộ trạng thái dự án: đã làm gì, đã gặp lỗi gì, bài học
rút ra, và **những gì còn chưa làm xong**. Đọc file này là đủ để tiếp tục làm việc
mà không cần đọc lại lịch sử hội thoại.

> Cập nhật lần cuối: **28/10/2026** — xem mục **BÀN GIAO PHIÊN** ngay dưới.
> Lịch sử từng chặng nằm ở mục 3.x (mới nhất 3.51–3.57: P0/P1 slide, gói môn, KaTeX,
> layout ví dụ mẫu/mở bài, công cụ chấm điểm, icon bổ sung, ảnh AI nền, asset trang trí `ornament`).

## BÀN GIAO PHIÊN (27/10/2026) — đọc mục này trước

### Trạng thái nhanh

Trọng tâm phiên này: **chất lượng slide do AI sinh** (không đụng nhiều tới trình soạn đề).
Pipeline: dàn ý (`SLIDE_PLAN_SYSTEM`, có `subject`/`stylePack`/`theme`) → duyệt → sinh từng
slide (`generateSlide` + repair, kiểm tra chữ co `readabilityIssues`) → layout engine
(`slideLayouts.ts`, **21 layout**, đo chữ bằng canvas) → slide hiện ngay → ảnh AI sinh nền
(bìa + layout ảnh) rồi `withImage()` thay vào.

- **6 theme OKLCH** (`sang`, `dem-xanh`, `giay-am`, `rung`, `tim`, `do`); id cũ tra qua `resolveThemeId`.
- **7 gói môn** (`slideSubjects.ts`: toán, văn, sử-địa, ngoại ngữ, tin, khtn, khác): cấu trúc bài,
  layout ưu tiên, luật nội dung, nhóm icon cho prompt.
- **Công thức** `$...$` bằng KaTeX (+ `\ce{}` mhchem) ở thumbnail/trình chiếu/editor/ô bảng;
  xuất PPTX đổi thành chữ Unicode (giới hạn đã biết).
- **Kho đồ hoạ 232 icon** (112 gốc + 100 bổ sung + 20 ngôn ngữ lập trình), đặt trên "tấm nền sáng"
  cố định (`graphicPlate`) để nét tối + pastel luôn tương phản.
- **Ảnh AI**: Xkiro `sensenova/sensenova-u1.5-lite` (45–90s/ảnh, đôi khi quá hạn → giữ icon).

### Điểm chất lượng (thước tương đối, model deepseek-v4.1-flash chấm ảnh slide)

| | Model | Người dùng |
|---|---|---|
| 6 deck do dự án sinh (59 slide) | **6,6/10** (layout 7,0 · chữ 7,1 · màu 7,5 · điểm nhấn 7,1 · **hình ảnh 4,4** · hoàn thiện 6,1) | 6,8 / 6,8 / 6,8 / 6,8 / 7 / 7 (TB 6,87) |
| Deck mẫu người dùng gửi ("Ước Chung Lớn Nhất") | 6,4 (6,8 nếu bỏ slide gần trống) | — |

Model khắt khe hơn người dùng ~0,3; dùng để so TRƯỚC/SAU mỗi lần sửa (nhiễu ±1/slide).
Sau các sửa theo góp ý người dùng, điểm model vẫn 6,6 → **hình ảnh/minh hoạ mới là nút thắt**.

### Việc tiếp theo (ưu tiên)

> **Phiên 28/10:** đo lại điểm, thẻ số, icon, ảnh, vòng chấm bằng mắt đều đã làm (mục 3.58). Điểm model **6,8/10**
> (baseline cùng 6 chủ đề 6,7; nhiễu ±1/slide nên chưa kết luận). Có ảnh AI thật: 6,7 (chỉ bìa có ảnh).

1. **Hình ảnh (4,7–5,0, thấp nhất)** — ĐỪNG thêm ảnh AI/ornament: giám khảo chê thiếu *minh hoạ đúng nội dung* (cây thừa
   số, Venn, bản đồ, lục lạp), không phải thiếu trang trí; ảnh AI chỉ nâng bìa (6,4→7,3) mà bìa là 1/10 slide. Hướng thật sự:
   **sơ đồ sinh từ dữ liệu** (trục số, cây thừa số, Venn, biểu đồ `ChartView`) cho toán/khtn/tin.
2. Khung (`orn-khung-*`), blob, họa tiết nền lát vẫn chưa dùng (chỉ scale đều → chọn bản vuông/ngang theo hộp). Ưu tiên thấp.
3. Vòng chấm bằng mắt mới nằm trong script (`eval:slides --slides --polish`); app chưa có DOM→ảnh nên chưa đưa vào pipeline.
4. Tồn đọng cũ: lazy-load bundle (>1 MB), so chế độ HTML với PPT, khối bảng biến thiên/biểu đồ/đồ thị cho TRÌNH SOẠN ĐỀ
   (mục 6.1b), `reasoning` model, quiz chưa có "hiện đáp án khi bấm".

### Lệnh và công cụ (chạy ở thư mục dự án)

- Dev: `npm run dev -- --port 5184 --host 127.0.0.1` (cổng bận thì preview tự đổi 5186). Sửa `server/*`
  phải khởi động lại dev server.
- Test slide (đều `npm run test:<tên>`): `slide-math`, `slide-theme`, `slide-layout`, `slide-measure`,
  `slide-text`, `slide-ai`, `slide-plan`, `slide-graphics`, `slide-assets`, `image`, `convert`.
- `npm run lint:slides` — dựng 630 slide (6 theme × 21 layout × 3 bộ nội dung × tông) trong Chrome
  headless, đo DOM: tràn/đè/ngoài khung/**sát mép (edge)** là *error*, chữ nhỏ/tương phản là *warn*.
  Hiện **0 error**, ~90 warn (chữ `cycle`/pill `hook` với nội dung stress vượt ngân sách).
- `npm run eval:slides -- "chủ đề" ... --out <dir> [--slides] [--images]` — chạy pipeline LLM THẬT,
  chụp lưới/ từng slide (`--slides`), sinh ảnh AI thật (`--images`, chậm vài phút). Ảnh vào `eval-out/`
  (gitignored).
- `node scripts/judge-slides.mjs <thư-mục-ảnh> --label "..."` — chấm bằng `LLM_MODEL` (nhận ảnh);
  ghi `judge.json`. Gateway opencode đòi header `x-opencode-session` (đã có trong script/proxy).
- `node scripts/import-graphics.mjs` — nhập 3 contact sheet (đường dẫn ở `Downloads/`, tên/keyword
  trong `scripts/graphics-extra.mjs` và đầu script) → `src/lib/graphics.ts` (đừng sửa tay).
- `.env` (không commit): `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` (opencode, deepseek-v4.1-flash).
  Ảnh/Xkiro lấy key từ `~/.zcode/v2/provider_config.json` nếu `.env` không có `IMAGE_*`.
- `.claude/launch.json` (cấu hình dev server cho công cụ preview) để ngoài git.

### Bẫy đã gặp (đừng lặp lại)

- Bash heredoc/tool **làm hỏng ký tự `\`** (LaTeX, regex, `'\n'`): tạo file chứa backslash bằng công
  cụ Write, hoặc sinh ký tự bằng `chr(92)`. Kiểm tra `tsc` ngay sau khi sửa.
- Helper ghi file `open(p,'wb').write(f(s))` mở file TRƯỚC khi `f` chạy → lỗi assert làm file rỗng
  (đã mất `slideAi.ts`, khôi phục bằng `git checkout`). Tính xong rồi mới mở để ghi.
- Nhiều file là **CRLF**; khi thay chuỗi nhiều dòng phải tính tới `\r\n`.
- Trang `scripts/*/main.tsx` (lint/eval) KHÔNG nằm trong `tsc` (chỉ `src`); chạy thật mới biết lỗi.
- `.katex` toàn cục của app là 1,03em (hợp đề thi) → slide ghi đè trong `slide.css`.
- Hộp chữ canh giữa là flex-column: chữ + `.katex` làm con trực tiếp sẽ tách hàng → bọc một khối con.
- Editor dùng `<textarea>` (không có valign) → `AutoFitText` tự bọc flex để canh giữa như bản xem.

### Bản đồ file chính của pipeline slide

`src/lib/`: `slideLayouts.ts` (21 layout, `composeLayout`, `contentFromSlide`, `graphicPlate`),
`slideMeasure.ts` (đo chữ canvas), `slideAi.ts` (sanitize/validate/budget/`readabilityIssues`/`withImage`),
`aiDeck.ts` (parse dàn ý, `repairJson`, `enforceRhythm`), `slideTheme.ts` (OKLCH), `slideSubjects.ts`,
`slideGraphics.ts` + `graphics.ts` (232 icon), `slideAssets.ts` (Phosphor), `slideMath.ts`, `math.ts`,
`imageGen.ts` (`queueImage`, `IMAGE_LAYOUTS`), `exportDeck.ts`. `src/examEditor/`: `SlideEditor.tsx`
(renderer + editor + `applyAiSlide`), `AiPanel.tsx` (prompt/luồng chat). `server/`: `llmProxy.ts`,
`imageProxy.ts`. `scripts/`: `lint-slides*`, `eval-slides*`, `judge-slides.mjs`, `lib/cdp.mjs`,
`import-graphics.mjs`, `graphics-extra.mjs`, `test-slide-*.mjs`.

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
  `/api/llm` cùng origin. Đọc cấu hình từ `.env` (`LLM_BASE_URL`,
  `LLM_API_KEY`, `LLM_MODEL`) — xem mục 3.18.
- Vite dev mount chính proxy này ở `/api/llm` (`vite.config.ts`), nên
  `npm run dev` gọi AI được ngay, không cần chạy server riêng.
- Client: `src/lib/llm.ts` (`callLlm`, `extractJson`).
- Kiểu dữ liệu tài liệu: `src/data/docTypes.ts` (`ExamBlock` và các biến thể).
- **Đã sửa lỗi provider trả về content rỗng**: thêm retry, log raw response và
  thông báo lỗi rõ ràng thay vì im lặng.

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
- `src/store/compose.ts` — store phiên nhiều tab (nội dung + deck). Lịch sử
  hoàn tác nằm ở editor, không nhân bản trong store (xem 3.17).

### 3.6. Chức năng đã nối

Chèn khối mẫu (ribbon + nav panel) · lưu theo từng tab · xuất Word · in A4 ·
áp kết quả AI · điều hướng khối từ mục lục / tìm kiếm · zoom + auto-fit ·
hoàn tác/làm lại (lịch sử TipTap, nút trên ribbon).

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

### 3.17. Chặng 7 — Hoàn tác/Làm lại trên ribbon, sửa số trang, dọn Lottie (23/10/2026)

Rà lại toàn bộ mục 6 của context và đối chiếu với code, rồi xử lý 4 việc rẻ mà có
lý do thật.

**Hoàn tác/Làm lại cho trình soạn đề (`Ribbon.tsx`):**
- Trước đây store ghi lịch sử (`histories`) **mỗi lần gõ phím** nhưng không UI nào
  gọi `undo`/`redo` → trả giá bộ nhớ cho tính năng không tồn tại, còn người dùng
  chỉ có Ctrl+Z.
- Giờ dùng **một sổ duy nhất** là lịch sử của TipTap: thêm 2 nút icon cạnh "Lưu"
  ở cụm quick phải (`ribbon-quick`), gọi `chain()?.undo()/redo().run()`;
  `onMouseDown preventDefault` giữ selection như các nút khác.
- Bật/tắt nút theo `editor.can().undo()/redo()`; listener `transaction` riêng vì
  `useFormatState` chỉ re-render khi định dạng đổi.
- Đã xoá `History`, `histories`, `undo`, `redo` và option `pushHistory` khỏi
  `store/compose.ts` — hết cảnh hai sổ hoàn tác song song. Đánh đổi đã chấp nhận:
  đổi tab là editor remount nên hoàn tác **không xuyên tab** (giống Ctrl+Z).

**Sửa số trang sai khi đổi khổ giấy (`ExamEditor.tsx`):**
- `measure` dùng `CONTENT_H` nhưng `useCallback` deps rỗng → giữ closure của lần
  render đầu. Đổi dọc↔ngang hoặc kéo lề xong, số trang/số tờ giấy vẫn tính theo
  khổ cũ. Thêm `CONTENT_H` vào deps.

**Dọn code chết (Lottie):**
- Đã xoá `src/components/AIAssistantIcon.tsx` (không được import ở đâu) và gỡ
  dependency `lottie-react`. **Hai file trong `src/assets/` là của người dùng
  cung cấp — không xoá**; sau đó SVG được dùng cho animation "đang suy luận"
  (xem 3.19).

**Kiểm chứng:** `npx tsc -b --noEmit` sạch · `npm run build` thành công (chunk
chính 1.146 MB, vẫn vượt ngưỡng 500 kB — xem 6.5) · `npm run test:convert`
6/6 pass.

### 3.18. Chặng 8 — Nối API thật cho trợ lý AI (23/10/2026)

Mục tiêu: AI dùng endpoint thật `https://opencode.ai/inference/go/openai/v1`,
model `deepseek-v4.1-flash`, key do người dùng tự điền — key không bao giờ vào
bundle.

**Cấu hình (`.env` + `.env.example`):**

| Biến | Mặc định | Ghi chú |
|---|---|---|
| `LLM_BASE_URL` | `https://opencode.ai/inference/go/openai/v1` | không có `/` cuối |
| `LLM_API_KEY` | — (bắt buộc) | `.env` đã nằm trong `.gitignore` |
| `LLM_MODEL` | `deepseek-v4.1-flash` | model id theo tài liệu opencode |

`.env.example` được commit; `.env` chỉ tạo cục bộ và bị git bỏ qua. Proxy báo
lỗi rõ khi thiếu key ("Chưa cấu hình LLM_API_KEY…") và khi key bị từ chối
("API key bị từ chối…"), thay vì "dịch vụ đang bận".

**Proxy (`server/llmProxy.ts`):**
- Bỏ hoàn toàn cơ chế đọc `~/.minimax/config.yaml` (provider `xkiro`); gỡ
  dependency `yaml`. Cấu hình giờ chỉ từ env.
- **Header bắt buộc `x-opencode-session`**: gateway của opencode trả
  400 `MissingSessionID` nếu thiếu. Dùng một UUID sinh lúc khởi động process
  (app cục bộ, một người dùng); kèm `User-Agent: de-ro/1.0` theo khuyến nghị
  của gateway. **Đừng xoá 2 header này.**
- Kiểm tra URL trước khi gọi: chỉ http/https, chặn `localhost`, loopback, dải
  riêng/link-local/CGNAT/multicast IPv4 và IPv6 nội bộ (floor: chống SSRF nếu
  ai đó sửa `LLM_BASE_URL`).
- Sửa lỗi path traversal có sẵn ở phần serve static: `path.resolve(dist, rel)`
  phải nằm trong `dist/`, ngược lại 404; SPA fallback chỉ cho đường dẫn không
  có phần mở rộng.
- Tách `handleLlmRequest` (dùng chung dev/prod) và `llmMiddleware`
  (Connect-style) để Vite mount; `createAppServer` giữ nguyên vai trò server
  production (API + `dist/`), tự nạp `.env` khi chạy `tsx server/llmProxy.ts`.

**Vite (`vite.config.ts`):**
- Dùng `loadDotEnv()` export từ `server/llmProxy.ts` thay cho `loadEnv` của Vite.
  **Lý do:** `loadEnv` để biến sẵn có trong `process.env` thắng file `.env`; máy
  này có `LLM_API_KEY=sk-…` cũ trong shell nên key mới điền vào `.env` bị đè và
  mọi lời gọi trả 401. `loadDotEnv` cho giá trị không rỗng trong file thắng —
  cùng quy tắc cho dev và production.
- Plugin `llm-proxy` mount `llmMiddleware` ở `/api/llm`. Trước đây repo **chưa
  hề nối** route này vào dev server → mọi lời gọi AI trong `npm run dev` đều
  404.
- `optimizeDeps.entries: ['index.html']` — mặc định Vite quét mọi `*.html`
  trong repo, gồm cả `_ref/genoffice/**` (clone tham chiếu) làm dev khởi động
  chậm.

**Kiểm chứng:** `npx tsc -b --noEmit` sạch (đã thêm `server` vào
`tsconfig.node.json` để file proxy được typecheck) · `npm run build` thành
công · **gọi thật thành công** cả hai đường:
- Vite dev `POST /api/llm` (đúng payload của panel: `reasoningEffort: 'max'`)
  → 200, `content: "ok"`, `model: "deepseek-v4.1-flash"`, có `reasoning_content`.
- Server production `node/tsx server/llmProxy.ts` → 200, cùng kết quả.
- Key dùng trực tiếp với upstream cũng 200; `GET …/v1/models` trả đúng 2 model
  (`deepseek-v4.1-flash`, `deepseek-v4-pro`).

### 3.19. Chặng 9 — Gắn animation "Trợ lý giấy" vào trạng thái đang suy luận (23/10/2026)

Người dùng phát hiện animation họ cung cấp (`src/assets/ai-assistant.json` +
`.svg`) chưa được gắn vào đâu. Đã gắn vào đúng trạng thái chờ của panel AI.

- **Vị trí:** `AiPanel.tsx`, lượt trả lời đang chờ (`turn.pending && !turn.text`)
  — dòng "Đang suy luận…". Panel này dùng chung cho cả trình soạn đề và slide
  nên animation xuất hiện ở cả hai.
- **Chọn SVG, không chọn Lottie:** hai file là cùng một artwork (bản SVG do
  công cụ Lottie xuất ra, có sẵn `@keyframes` bên trong, tự chạy khi đặt trong
  `<img>`). Dùng `lottie-react` làm chunk chính tăng từ 1.146 MB lên 1.595 MB
  (lottie-web ~450 KB); dùng SVG chỉ thêm 50 KB asset, chỉ tải khi indicator
  hiện. Vì vậy `AIAssistantIcon.tsx` + dependency `lottie-react` bị gỡ lần nữa,
  còn **hai file asset vẫn giữ** (đồ của người dùng, `ai-assistant.json` là bản
  gốc).
- **CSS:** `.ai-thinking__anim` khung 22px, `transform: scale(1.55)` quanh tâm
  vì hình gốc chỉ chiếm ~31/64 viewBox (phần còn lại là lề trong suốt); ẩn hẳn
  khi `prefers-reduced-motion: reduce` — chữ "Đang suy luận…" vẫn còn.
- Bỏ hiệu ứng 3 chấm nhấp nháy cũ (`.ai-dot`, `@keyframes ai-pulse`).
- Thêm `src/vite-env.d.ts` (`/// <reference types="vite/client" />`) để TS hiểu
  import `*.svg`.

**Kiểm chứng:** `npx tsc -b --noEmit` sạch · `npm run build` thành công, chunk
chính trở lại 1.145,8 kB (gzip 337,7 kB), SVG phát ra thành asset riêng.

### 3.20. Chặng 10 — Markdown + hiệu ứng gõ chữ cho câu trả lời AI (23/10/2026)

Trước đây khung chat in thô `turn.text`: `**đậm**`, danh sách, code đều hiện
nguyên dấu; câu trả lời hiện ra một cục.

**Markdown (`src/examEditor/markdown.tsx`, mới):**
- Chỉ hỗ trợ tập con đủ dùng: đoạn văn, tiêu đề `#`, danh sách `-`/`1.`, trích
  dẫn `>`, hàng kẻ, khối ``` ``` ```, đậm `**`/`__`, nghiêng `*`/`_`, code nội
  tuyến, link `[chữ](url)`.
- Render ra **React node**, không dùng `dangerouslySetInnerHTML` → nội dung model
  trả về không thể chèn HTML/script. Link chỉ nhận `http(s)`/`mailto`; giao thức
  khác (kể cả `javascript:`) bị hạ thành chữ thường.
- Nếu cả câu trả lời bắt đầu bằng `{` hoặc `[` (AI trả JSON đề/slide), hiển thị
  trong một khối `<pre>` cuộn được thay vì để markdown nuốt dấu.
- `_nghiêng_` yêu cầu ranh giới từ để `snake_case` không bị in nghiêng nhầm.

**Hiệu ứng gõ chữ (`AiPanel.tsx` — `TypedMarkdown`):**
- Sau khi câu trả lời về, chữ hiện dần bằng `requestAnimationFrame`; thời lượng
  `min(1.6s, 140ms + 3ms/ký tự)` nên đề dài không kéo dài quá lâu.
- Hiện đúng như đang gõ nhưng không stream thật: API vẫn trả một lần (đường
  ống không đổi). Muốn stream thật thì phải làm SSE ở proxy + client.
- Tắt hẳn khi `prefers-reduced-motion: reduce` (hiện ngay toàn bộ).
- Lượt người dùng vẫn in thuần (không render markdown).

**CSS (`compose.css`):** khối `.ai-md*` — đoạn/tiêu đề/danh sách/`pre` (nền
`--color-bg-subtle`, cao tối đa 280px)/trích dẫn/link. `.ai-msg` gốc có
`white-space: pre-wrap` nên `.ai-md` đặt lại `normal` để markdown xuống dòng
đúng. Khoảng cách icon ↔ "Đang suy luận…" nới từ 6px lên 10px vì icon phóng
1.55 tràn ~3px sang phải.

**Phạm vi trả lời (`SCOPE_RULE` trong `AiPanel.tsx`):** nối vào system prompt
của **cả hai** chế độ — chỉ trả lời việc soạn đề/bài giảng và các chủ đề học
tập, nghiên cứu; từ chối một câu rồi hướng người dùng quay lại soạn đề với các
yêu cầu ngoài phạm vi (viết cả trang web/ứng dụng hoàn chỉnh, hỏi model là gì /
ai tạo, đời sống, giải trí, tin tức, tư vấn cá nhân). Đoạn mã ngắn để học hoặc
minh hoạ kiến thức vẫn được phép.

**Kiểm chứng:** `npx tsc -b --noEmit` sạch · `npm run build` thành công (chunk
chính 1.149,5 kB) · `npm run test:markdown` **14/14 pass** (test mới:
`scripts/test-markdown.mjs`, chạy với `--tsconfig tsconfig.app.json` để hiểu
alias `@/`) · `npm run test:convert` 6/6 pass · gọi thật với `deepseek-v4.1-flash`:
hỏi "Bạn là model nào / do ai tạo" → từ chối gọn một câu; yêu cầu "viết một
trang web bán hàng hoàn chỉnh" → từ chối và gợi ý quay lại soạn đề.

### 3.21. Chặng 11 — Sửa canvas/thumbnail/icon slide theo bản gốc (23/10/2026)

Người dùng báo: icon "Kiểm tra"/"Ảnh AI" sai, resize không đúng, không kéo được
thumbnail để đổi thứ tự, thumbnail vẽ sai bố cục. Đã đọc lại
`_ref/genoffice/apps/slides` để so cơ chế.

**Thumbnail lệch bố cục — nguyên nhân gốc:** mọi cỡ chữ trong slide dùng `cqw`
(1% bề rộng khung), nhưng `.slide-frame` **không đặt `container-type`** → `cqw`
rơi về viewport. Thumbnail ~166px và sân soạn ~1000px vẽ chữ cùng một cỡ px, nên
thumbnail trông như phóng to và tràn. Sửa:
- `.slide-frame { container-type: inline-size }` (`slide.css`) — bề rộng frame
  thành tham chiếu cho `cqw`; thumbnail và sân soạn vẽ cùng tỉ lệ.
- Đồng bộ số đo chữ giữa `SlideElView` và `EditableEl`: padding `1%`,
  `line-height: 1.25` (trước là `0 2%` / `1.3`) để thumbnail khớp canvas.

**Zoom (đổi để không nhân đôi cỡ chữ):** `zoom` chuyển từ chính `.slide-frame`
sang lớp bọc `.slide-stage__inner`. Frame là container query; giữ nó ở bề rộng
layout thật để `cqw` không bị tính lại theo tỉ lệ zoom.

**Biểu đồ lệch giữa canvas và thumbnail:** trong `EditableEl`, `ChartView` được
đặt trong một div đã neo `left/top/w/h` bằng `%`, mà `ChartView` lại tự neo thêm
lần nữa → toạ độ nhân đôi. Thêm prop `absolute` (mặc định true cho thumbnail;
canvas truyền `false` để lấp đầy khung bao).

**Kéo thumbnail đổi thứ tự (port từ bản gốc):** HTML5 drag native, không thêm
thư viện. `dragIndex` + `dropPos` (khe chèn 0..n), tính lại vị trí tại điểm thả,
`moveSlide(from, insertAt)` sửa chỉ số khi chèn sau vị trí gỡ, một bước undo.
Chỉ báo `.thumb-dragging`, `.thumb-drop-before/after` (thanh accent 3px).

**Resize (port cơ chế 8 anchor):** thay 1 tay nắm góc bằng 8 tay nắm
(n/nw/ne/e/se/s/sw/w) với `cursor` riêng; mỗi hướng chỉ dịch đúng cạnh đó và giữ
cạnh đối diện (`left/right/top/bottom` tính theo %, min 4%). Kéo phần tử giờ
bắt đầu ngay trong cùng thao tác chọn (trước phải click chọn rồi kéo lần hai);
dọn listener cả `pointerup` lẫn `pointercancel`.

**Icon AI:** hai glyph `IconAiFactCheck`/`IconAiImage` trước dùng path vẽ tay
rút gọn. Đã thay bằng **path chính xác** từ
`apps/slides/src/renderer/components/icons.tsx` (circle nét + dấu check là path
tô; ảnh AI gồm 4 path nét + tia sáng góc trên phải) và render ở **24px** —
file gốc dùng `strokeWidth="1.5"` cố định, chỉ đúng khi viewBox 24 vẽ 1:1.

**Kiểm chứng:** `npx tsc -b --noEmit` sạch · `npm run build` thành công ·
`test:convert` 6/6 · `test:markdown` 14/14. Chưa có kiểm tra trực quan trong
trình duyệt (automation trình duyệt hay treo phiên); các thay đổi là CSS/layout
+ handler, cần một lượt bấm thử thực tế.

### 3.22. Chặng 12 — Chữ co theo hộp, tay nắm thẳng hàng, thêm xoay (23/10/2026)

Phản hồi sau chặng 11: thu nhỏ hộp thì chữ bị cắt thay vì nhỏ lại, ô vuông tay
nắm trông lệch, và thiếu nút xoay như bản gốc.

- **Chữ co theo hộp:** khi kéo cạnh trên/dưới (hoặc góc) của phần tử `text`,
  `fontSize` (đơn vị `cqw`) được nhân theo tỉ lệ chiều cao mới, kẹp 0,8–12. Kéo
  ngang không đổi cỡ chữ như PowerPoint. Thêm `ResizeObserver` vào `FitText` và
  `AutoFitText` để fit lại khi **hộp** đổi kích thước (trước chỉ fit khi đổi
  chữ/cỡ chữ) — đây mới là lý do chữ bị "che".
- **Tay nắm thẳng hàng:** bỏ `outline-offset: 2px` (đường chọn vẽ lệch ra ngoài
  so với tâm các ô vuông). Giờ outline sát cạnh hộp, ô vuông canh đúng góc/cạnh.
- **Xoay:** thêm `SlideElement.rotation?` (độ, quanh tâm) — deck cũ vẫn đọc
  được. `elTransform()` gộp `rotate()` với `scaleX/scaleY` cho cả canvas và
  thumbnail. Tay nắm xoay là nút tròn phía trên cạnh trên (icon RotateCw, dây nối
  12px như bản gốc); kéo để xoay, giữ Shift bắt góc 15°. Toạ độ góc tính từ tâm
  hộp trong hệ toạ độ khung slide nên vẫn đúng khi hộp đã xoay.
  *Hạn chế đã biết:* resize phần tử đã xoay vẫn dùng trục màn hình (không chiếu
  delta qua phép quay) — đã ghi chú trong code.

**Kiểm chứng:** `npx tsc -b --noEmit` sạch · `npm run build` thành công ·
`test:convert` 6/6 · `test:markdown` 14/14.

### 3.23. Chặng 13 — Lớp trình bày block (23/10/2026)

Học từ soandethi: block "đẹp đều" nhờ CSS theo node + hình học trang, không
phải nhờ phân trang. Giữ nguyên phân trang hiện tại (quyết định của chủ dự án).

- **Không thêm class mới:** repo đã có selector ổn định `data-exam-node` (và
  `data-side`, `data-label`, `data-level`) trong `index.css`; thêm class song
  song chỉ là trùng lặp. Dùng lại các selector này.
- **Phương án trắc nghiệm → grid:** `examQuestion` là grid 2 cột, lời dẫn
  `examQuestionPrompt` phủ cả hàng (`grid-column: 1/-1`), `examOption` bỏ
  `inline-block 50%`. Khoảng cách cột tính theo bề rộng nội dung thật nên đổi
  lề/hướng trang vẫn cân.
- **Biến hình học:** `ExamEditor` đặt `--doc-content-w`, `--doc-margin`,
  `--doc-orient` lên `.doc-flow` từ `pageGeometry()`. CSS khối dùng biến thay
  vì số cứng.
- **Thang điểm:** tiêu đề đậm/in hoa, mỗi ý thụt treo (`padding-left` +
  `text-indent` âm) để nhãn điểm không lấn nội dung.
- **Xuất Word/in khớp màn hình:**
  - Phương án xuất thành **bảng 2 cột** (`.opts table`, 50%/ô). Trước đây dùng
    `display:flex` — Word không hiểu flex nên phương án bị dồn một cột.
  - Đánh số **theo thứ tự khối** thay vì `block.no`: màn hình dùng CSS counter
    nên chèn/xoá/sắp xếp lại câu là số tự đổi; bản Word giờ cũng vậy (trước đó
    có thể lệch số sau khi sửa thứ tự).
  - Gộp CSS của Word và bản in thành một hằng `EXPORT_CSS` (trước là hai khối
    copy gần giống nhau, dễ lệch).
- **Hạn chế đã biết:** phương án rất dài vẫn nằm trong nửa cột; bản gốc đo cột
  thật để cho phép chiếm cả hàng. Để sau, không cần cho bản nháp hiện tại.

**Kiểm chứng:** `npx tsc -b --noEmit` sạch · `npm run build` thành công ·
`test:convert` 6/6 · `test:markdown` 14/14 · `test:export` **4/4** (test mới:
`scripts/test-export.mjs` — đánh số tuần tự, bảng 2 cột, CSS dùng chung).

### 3.24. Chặng 14 — Lấy block bố cục từ soandethi (đợt 1, 23/10/2026)

Mục tiêu: port các block cấu trúc trong đề mẫu của soandethi, làm dần từng đợt.
Đợt này lấy hai thứ dùng ở mọi đề và không cần engine hình học.

**1. Choice layout — số cột phương án theo bề rộng thật (`choiceLayout.ts`, mới):**
- Port thuật toán `choiceLayout` của bản gốc: đo bề rộng tự nhiên của từng
  phương án rồi chọn số cột lớn nhất (2–4) mà mọi phương án còn vừa; chỉ chọn
  số cột chia hết cho số phương án (4 phương án → 4 hoặc 2, không phải 3).
- Cách đo: tạm gắn class `.exam-choice-measuring` (chuyển khối câu hỏi sang
  flex, ẩn lời dẫn, phương án co về `max-content`), đọc `getBoundingClientRect`,
  rồi trả lại grid — tất cả trong một frame nên không nhấp nháy.
- Có `<br>` cứng hoặc công thức `.katex-display` trong phương án → xếp 1 cột.
- Chạy bằng effect trong `ExamEditor` (ResizeObserver + MutationObserver, gộp
  bằng rAF) thay vì ProseMirror plugin, vì câu hỏi của mình không phải node view.

**2. Block lưới nhiều cột (`grid`):**
- `ExamBlock` thêm `GridBlock { type:'grid', cols: 2|3, cells: RichText[] }`;
  schema thêm `examGrid` (attr `cols`) + `examGridCell` (inline*).
- CSS: grid thật, số cột đặt inline khi render, khoảng cách cột theo
  `--doc-content-w`; `examGridCell` đăng ký trong `TEXT_CONTENT_NODES` để căn
  lề/giãn dòng dùng được.
- Converter hai chiều + test round-trip (giữ số cột, marks trong ô).
- Xuất Word/in: `<table class="grid">` một hàng, mỗi ô một `<td>` (Word không
  hiểu grid/flex).
- Có 2 mục trong `BLOCK_TEMPLATES` ("Lưới 2 cột", "Lưới 3 cột") nên xuất hiện
  ở cả ribbon Chèn và panel Khối mẫu; prompt AI liệt kê thêm block `grid`.

**Còn lại của bộ block bên họ (các đợt sau):**
bảng biến thiên (`variationTable`) · biểu đồ thống kê (`statChart`) · đồ thị hàm
số (`functionGraph`) · hình học / vector (`geometryDiagram`, `vectorDiagram`) ·
`docColumns` (toàn văn 2 cột) · mark `boxed`. Mỗi loại cần thêm ExamBlock +
renderer + export, nên tách đợt.

**Kiểm chứng:** `tsc` sạch · `npm run build` thành công · `test:convert` 7/7
(thêm case lưới) · `test:layout` **7/7** (mới: chọn số cột) · `test:export` 4/4 ·
`test:markdown` 14/14.

### 3.25. Chặng 15 — Đầu đề hai cột theo mô hình bản gốc (23/10/2026)

Đầu đề cũ là **hai block rời** (`side=left/right`, `inline-block 34%/66%`): mỗi
bên chỉ có một dòng inline, muốn xuống dòng thì để trình duyệt tự wrap (ảnh
chụp cho thấy "SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH …" bị gãy dòng tuỳ ý), không thể
định dạng riêng từng dòng và không có khung "ĐỀ CHÍNH THỨC".

Port đúng mô hình soandethi:

- **Schema:** `examHeader` giờ là một block chứa đúng hai `examHeaderColumn`,
  mỗi cột `content: 'paragraph+'`. Mỗi dòng là một paragraph thật nên xuống
  dòng là chủ động và mỗi dòng có định dạng riêng.
- **Dữ liệu:** `HeaderBlock.left/right` vẫn là `RichText`; các dòng ngăn bằng
  `'\n'`. `splitRichLines()` (convert) tách thành paragraph khi dựng editor;
  `columnToRich()` nối lại khi lưu. Không đổi mô hình lưu, tài liệu cũ đọc được.
- **Mark `boxed`:** thêm mark (span `data-boxed` + class `doc-boxed`) để dòng
  "ĐỀ CHÍNH THỨC" có khung viền; đi qua converter/`MARK_TYPES` và xuất Word
  thành `<span style="border:…;display:inline-block">`.
- **CSS:** `.doc-content [data-exam-node='examHeader']` là grid `34fr 66fr`,
  khe hở theo `--doc-content-w`, `align-items:start`, `line-height:1.2` (chặt
  hơn thân bài 1,625 — đây là lý do các dòng đầu đề trước đây bị rã). Bỏ
  `text-transform: uppercase` để dòng "Thời gian làm bài…" in nghiêng chữ
  thường như đề mẫu. Cột căn giữa mặc định; format của từng paragraph vẫn thắng.
- **Template "Đầu đề hai cột":** dựng đúng bố cục đề mẫu — trái: Sở GD / Tỉnh /
  "ĐỀ CHÍNH THỨC" (boxed); phải: KỲ THI / NĂM HỌC / Môn thi / Thời gian (italic).
- **Xuất Word/in:** header vẫn là bảng 2 ô; mỗi dòng nối bằng `<br>`, ô căn
  giữa, `.hdr` line-height 1.2; boxed thành span có viền.

**Chưa có:** nút ribbon bật/tắt mark `boxed` cho vùng chọn (hiện chỉ template
tạo ra; muốn thêm thì phải mở rộng `useFormatState`). Định dạng **cấp đoạn**
(căn lề riêng từng dòng) trong cột đầu đề chỉ sống trong phiên — lưu xuống chỉ
giữ marks inline; muốn giữ thì phải mở rộng `HeaderBlock` thành mảng dòng có
format.

**Kiểm chứng:** `tsc` sạch · `build` thành công · `test:convert` **9/9** (thêm
2 case: xuống dòng, boxed) · `test:export` **5/5** (thêm case header) ·
`test:layout` 7/7 · `test:markdown` 14/14.

### 3.26. Ghi chú audit soandethi.com — tư liệu cho các đợt port (23/10/2026)

Phương pháp: tải HTML + toàn bộ JS/CSS công khai (Next.js, ~45 chunk), đọc mã
minify. **Không thấy prompt/model phía server** (cần đăng nhập); các kết luận
về server là suy ra từ payload client. Muốn lấy lại tư liệu: curl trang chủ,
`/exams`, `/slides`, `/doc/test` rồi bò theo tham chiếu `static/chunks/*.js`.

**Node của editor họ** (TipTap + ReactNodeViewRenderer cho node phức tạp):
`examHeader` (2 `headerColumn` `paragraph+`), `grid`/`gridCell` (attr
`columns`, `autoColumns`; plugin `choiceLayout` đo `.doc-grid` rồi đặt
`grid-template-columns`), `examTable` (row/header/cell), `pageBreak` (atom,
Mod-Enter), `docMath`, `examImage` (align/width), và 5 node atom giữ JSON
trong attr `data`: `variationTable`, `functionGraph`, `geometryDiagram`,
`vectorDiagram`, `statChart`. Marks: font family/size/color/highlight,
`boxed`, `tableAppearance`, `paragraphFormat`.

**Dữ liệu `variationTable` mặc định của họ:**
`{caption, bottomCaption, width:440, yHeight:90, showDerivative:true,
points:[{x,y,yPos}|{x,yPrime:'||',doubleLine,yLeft,yLeftPos,yRight,yRightPos}],
intervals:[{sign}]}` — plus `analyzeVariation(expression)` sinh points/intervals
từ chuỗi hàm số (dạng `x^3-3x+1`, `(2x+1)/(x-1)`).

**Phân trang họ** (mình KHÔNG port — chủ dự án giữ nguyên): plugin ProseMirror
dùng Decoration spacer (`.pg-spacer`, `.pg-lift-spacer`, `.pg-table-gap`),
đo DOM qua `.pg-measuring`, cắt bảng + lặp header, tự ngắt trước heading
"HƯỚNG DẪN CHẤM/ĐÁP ÁN"; print flow riêng `.doc-print-root` + `@page A4
20mm 15mm 18mm 20mm`.

**Luồng AI họ** (đáng học, chưa làm): 2 bước `POST /api/chat-exam/plan` →
`POST /api/chat-exam`. Planner trả `{taskKind, decision, intent, contextSource,
examScope, editRanges, operations, agents, verificationToken, …}` + OCR ảnh.
Solver trả `{action: replace|append|patch|none, patches}`; client kiểm tra
editRanges hợp lệ rồi mới áp (`applyExamPatches`), sai thì từ chối. Transport:
SSE (`progress`/`delta`/`reset`/`result`) + fallback poll job 15 phút + cancel.
Trong lúc chờ, markdown stream được ghi **trực tiếp vào editor** qua
`startMarkdownStream` (chỉ parse tới biên block ổn định, tạm `setEditable(false)`).

**Slide họ:** DOM + react-moveable (kéo/resize/xoay/snap); AI sửa qua **command
registry** (`scope: slide|document`, params có schema + mô tả: addText,
setTransition, setNotes…) thay vì replace deck; deck lưu server có `/versions`,
upload asset, import/export PPTX (PptxGenJS).

### 3.27. Chặng 16 — Audit "thêm khối" so với soandethi, nâng lên ngang tầm (24/10/2026)

Audit phần thêm khối (tab "Khối mẫu" nav panel + ribbon Chèn) đối chiếu với tab
"Mẫu đề thi" của soandethi.com (tải lại ~45 chunk JS công khai vào
`_ref/soandethi/`, đọc mã minify — chunk chính `1cqwn8a32l5hb.js`).

**Họ làm gì (từ mã nguồn):** sidebar 2 tab (Mục lục / Mẫu đề thi), danh mục
mẫu chia 5 nhóm (Hình minh hoạ SVG / Đầu đề / Câu hỏi / Nội dung / Bố cục,
~25 mẫu), mỗi mẫu `markdown()` sinh chuỗi markup riêng; bấm = chèn tại con trỏ
hoặc **kéo vào trang** (payload qua DataTransfer MIME riêng, `dropRange` tính
vị trí thả: nửa trên khối → chèn trước, nửa dưới → chèn sau); "Thông tin thí
sinh" và "Đường kẻ" chèn **cuối đề** (`insertExamFooter`: trước phần
HƯỚNG DẪN CHẤM/ĐÁP ÁN, lùi qua pageBreak liền trước; đề THPT Quốc gia thì
thí sinh nằm ngay sau đầu đề); chèn qua `parseExamBlocks` → `insertContentAt`;
đề trống (1 paragraph rỗng) thì thay toàn bộ doc.

**Khoảng cách của mình trước chặng này:** danh sách mẫu phẳng 14 mục, không
nhóm; chỉ bấm, không kéo-thả; "Thông tin thí sinh" chèn tại con trỏ như mẫu
thường; thiếu câu đúng/sai, trả lời ngắn, ngữ liệu, dòng HẾT, đầu hướng dẫn
chấm.

**Đã port (`templates.ts` viết lại + `NavPanel.tsx` + `ExamEditor.tsx` +
`compose.css` + `icons.tsx`):**
- **Nhóm mẫu:** `TplGroup` 4 nhóm (Đầu đề / Câu hỏi / Nội dung / Bố cục) giữ
  thứ tự khai báo, nav panel render heading nhóm + mục có grip icon (port bố
  cục, không sao chép palette của họ).
- **Kéo-thả:** nút mẫu `draggable`, payload JSON qua MIME
  `application/x-exam-block` (`BLOCK_TEMPLATE_MIME`); `handleDrop` trong
  `ExamEditor` dùng `posAtCoords` + nửa trên/dưới khối cấp cao nhất để quyết
  định chèn trước/sau — đúng cơ chế `dropRange` của họ.
- **Chèn cuối đề:** `examFooterPos(doc, place)` port `insertExamFooter`;
  `place: 'student'` (thí sinh — lên ngay sau đầu đề nếu text đầu đề khớp
  THPT Quốc gia/Tốt nghiệp THPT) và `place: 'footer'` (đường kẻ — trước phần
  chấm, lùi qua pageBreak liền trước).
- **Đường chèn chung `insertBlockTemplate(editor, tpl)`:** đề trống →
  `setContent` thay toàn bộ; có `place` → cuối đề; đang đứng trong đoạn
  paragraph rỗng → thay đoạn đó (hết đoạn trống sót lại); còn lại → chèn sau
  khối cấp cao nhất chứa con trỏ. Ribbon (`insertTemplate`) và nav panel
  (`handleInsertTemplate`) cùng gọi một chỗ — xoá 2 bản sao logic cũ.
- **6 mẫu mới:** Đầu hướng dẫn chấm (pageBreak + 2 heading + rubric — mẫu đa
  khối đầu tiên), Câu đúng/sai, Câu trả lời ngắn, Ngữ liệu/đoạn trích (căn
  giữa/phải qua `format.align`), Dòng HẾT, Câu tự luận có ý a) b). Tổng 20
  mẫu. `build()` được phép trả mảng JSONContent.

**Phát hiện khi kiểm chứng:** StarterKit v3 bật `trailingNode` — doc bao giờ
cũng kết thúc bằng 1 paragraph để con trỏ có chỗ đứng (giống Word). Chèn
"đề trống → đầu đề" cho kết quả `header + paragraph` là hành vi chủ ý, không
phải bug; test chỉ khẳng định không có 2 paragraph.

**Kiểm chứng:** `tsc` sạch · `build` thành công · `test:templates` **9/9**
(mới: mọi mẫu dựng được node hợp lệ theo schema, id không trùng,
examFooterPos 6 case) · convert 9/9 · markdown 14/14 · export 5/5 ·
layout 7/7 · trình duyệt thật: 4 nhóm + 20 mẫu draggable, chèn đầu đề/câu
hỏi/hướng dẫn chấm đúng thứ tự, thí sinh + đường kẻ chèn trước phần chấm
(lùi qua pageBreak), kéo-thả nửa trên → trước / nửa dưới → sau khối, ribbon
chèn + undo hoạt động, console sạch.

**Chưa có (nợ nhỏ):** các nhóm "Hình minh hoạ SVG" của họ (diagram vector dữ
liệu JSON — thuộc đợt 4/5 về block hình học ở mục 6.1b, không phải UI thêm
khối); kéo-thả chưa có chỉ báo vị trí thả (họ cũng không có).



---

### 3.28. Chặng 17 — Sửa gốc con trỏ/block loạn, đầu đề chuẩn, AI sinh đề có hợp đồng (24/10/2026)

Người dùng báo: đầu đề 2 cột chưa đạt chất lượng như ảnh mẫu; tab Khối mẫu
không cuộn được; cần animation đóng/mở bar AI; và con trỏ soạn thảo "mất điểm
bắt đầu" làm vị trí block loạn. Khi kiểm tra phát hiện thêm: sau khi chèn khối
vào đề trống, **cả document bị chọn** (AllSelection) thay vì con trỏ ở cuối.

**Nguyên nhân gốc #1 — lệch `data-exam-node` giữa schema và CSS.**
Schema render `data-exam-node='header'/'question'/'essay'/…` nhưng toàn bộ CSS
trình bày block (chặng 13–15) và `choiceLayout.ts` viết theo dạng
`examHeader/examQuestion/…`. Chỉ các node dựng qua helper `textBlock()`
(`examTitle`, `examHeading`, `examStudent`, `examParagraph`) là khớp. Hệ quả:
grid 34/66 của đầu đề, 2 cột phương án, thụt treo thang điểm… **chưa từng chạy**
trong trình duyệt — đúng như mục 6.1 ghi "chưa kiểm tra trực quan chặng 13–15".
Sửa: đưa toàn bộ giá trị về đúng tên node (exam-prefix), trừ `headerCol` (CSS
cũng dùng `headerCol`). Quy ước: **giá trị `data-exam-node` phải trùng tên
node**, CSS/choiceLayout bám theo tên đó.

**Nguyên nhân gốc #2 — choiceLayout ghi DOM của ProseMirror.**
`layoutChoiceQuestions` (bản đầu) toggle class + ghi inline
`grid-template-columns` lên chính node PM quản lý. Khi selector vừa khớp sau
fix #1, mỗi lần gõ phím PM re-render lại xoá inline style, MutationObserver
đo lại ghi lại → layout nhảy liên tục; PM còn đọc DOM mutation ngoài và map
lại selection → con trỏ nhảy ("mất điểm bắt đầu"). Sửa gốc:
- Đo trên **bản clone** trong host `.doc-content` ẩn ngoài editor
  (`measureChoiceColumns`), không đụng DOM thật.
- Áp số cột bằng **ProseMirror decoration** (`ChoiceLayoutExtension`), class
  `exam-cols-1/3/4` do PM tự quản (2 cột là mặc định CSS), key theo `id` khối
  để không lệch khi chèn/xoá khối khác.
- Effect trong `ExamEditor` chỉ dispatch transaction meta khi số cột **thực sự
  đổi** (`addToHistory: false`), nên gõ phím không tạo vòng lặp.

**Sửa AllSelection sau khi chèn vào đề trống:** `insertBlockTemplate` dùng
`setContent` (thay cả doc) rồi `focus('end')` để collapse con trỏ về cuối;
trước đó setContent để lại selection phủ toàn bộ tài liệu.

**Đầu đề 2 cột:** text dòng cuối đổi "ĐỀ CHÍNH THỨC" → "Đề chính thức" đúng
ảnh mẫu; sau fix #1 CSS grid 34/66 + căn giữa + đậm + line-height 1.2 + khung
boxed mới thực sự có hiệu lực. Đã chụp so sánh: khớp ảnh người dùng gửi.

**Nav panel cuộn được:** `.nav-panel` (div gốc của NavPanel) **không có CSS**;
nằm trong `.nav-pane` (flex column, overflow hidden) nên `.nav-body`
(flex:1; min-height:0; overflow-y:auto) không bị chặn chiều cao → nội dung bị
cắt. Thêm `.nav-panel { display:flex; flex-direction:column; flex:1;
min-height:0 }`.

**Animation AI dock:** CSS `.ai-dock.collapsed` + transition đã có sẵn nhưng
`AiDock` render có điều kiện (rail thay panel) nên không dùng. Giờ panel **luôn
mount** (giữ lịch sử chat), `.ai-dock` transition width 180ms, `.ai-panel` teo
về 0 + mờ dần khi collapsed, rail hiện thay nút thu gọn; `inert` khi đóng để
không tab vào nội dung ẩn. Đo thực tế: 360 → 34px và ngược lại mượt.

**Sinh đề AI — hợp đồng kiểu soandethi, một lượt gọi:**
Trước đây model chỉ biết tiêu đề + số khối, và mọi JSON trả về đều
`setContent` **thay sạch cả đề** — kể cả khi người dùng bảo "thêm 5 câu" hay
"sửa lỗi". Đã thay bằng hợp đồng:
`{"action":"replace"|"append"|"patch","blocks":[...],"patch":[{"id","block"}],"note":"..."}`
- Prompt (`examSystemPrompt`) mô tả **shape từng loại block**, quy ước đề thi
  Việt Nam (header 2 cột, title, student, heading phần, 4 phương án, essay
  score/sub, answerKey, rubric, LaTeX trong `$...$`).
- Client gửi kèm **digest tài liệu**: mỗi khối cấp cao nhất một dòng
  `[id] loại: trích đoạn` (từ TipTap JSON — `ExamBlock` không lưu id) để model
  patch đúng khối.
- `handleAiResult` (ComposeDoc) chuẩn hoá block trước khi áp (`sanitizeBlocks`:
  whitelist type + default field, chấp nhận dạng viết tắt như answerKey items
  là chuỗi, meta rows dạng object, options là chuỗi), rồi:
  `replace` → setContent; `append` → insertContentAt cuối doc; `patch` → thay
  node cấp cao nhất theo id trong một transaction; không khớp id nào thì không
  đụng tài liệu.
- Chat hiện **câu tóm tắt** (`note` hoặc số khối đã áp) thay vì JSON thô;
  câu trả lời văn bản thường vẫn hiện nguyên.

**Kiểm chứng (trình duyệt thật, gọi LLM thật):** tsc sạch · build thành công ·
convert 9/9 · markdown 14/14 · export 5/5 · layout 7/7 · templates 9/9 ·
- Header render grid 211/411px, chữ đen đậm căn giữa, "Đề chính thức" boxed.
- Click giữa lời dẫn rồi gõ "123" → chèn đúng chỗ click, caret 169→172, cột
  giữ nguyên.
- Gõ chuỗi dài vào phương án → decoration đổi `exam-cols-4` → `exam-cols-1`,
  caret đứng yên.
- Khối mẫu: scrollHeight 1593 / clientHeight 448, cuộn được.
- AI dock: 360→34 và 34→360 mượt.
- Sinh đề "15 phút Toán 9, 4 câu căn bậc hai" → 14 khối đúng thứ tự
  (header/title/meta/student/heading/paragraph/4 question/pageBreak/heading/
  answerKey/rubric), bảng đáp án có dữ liệu, câu hỏi 4 cột, chat hiện tóm tắt.
- "Bổ sung 2 câu" → 6 câu liền mạch, bảng đáp án cập nhật 6 đáp án.
- "Sửa câu 1" → chỉ câu 1 đổi, 5 câu còn lại nguyên vẹn.
- Console sạch.

**Công thức toán inline trong editor (`inlineMath`):**
AI sinh LaTeX `$...$` nhưng editor chỉ hiện chuỗi thô (trước đó `MathText` chỉ
dùng ở trang xem `/de/:id`). Đã thêm node atom `inlineMath` (schema.ts) render
bằng KaTeX qua NodeView; mô hình lưu **không đổi** — `ExamBlock` vẫn là text
`$latex$`, converter tách chuỗi thành node khi dựng editor (`splitMath` trong
`richNodes`, kèm marks) và nối lại khi lưu (`walkInline`). Gõ `$x^2$` trong
editor được input rule chuyển ngay thành công thức. CSS KaTeX import ở
`ExamEditor.tsx` (không import trong schema.ts để test Node không vướng CSS).
Kiểm chứng: mở lại đề 20 câu đã lưu → **171** công thức render (`.katex`),
không còn `$\frac`/`$\sqrt` thô; `scrollWidth = clientWidth = 642`, không khối
nào tràn. Test convert thêm 2 case (math + math có marks), **11/11**.

*về "tràn trang": không tái hiện được với đúng nội dung đó — mọi khối cũng như
`.doc-content` đều đúng 642px; ảnh người dùng gửi nhiều khả năng là cửa sổ hẹp
ở zoom 100% nên trang 794px rộng hơn vùng nhìn (phải cuộn ngang). Nếu còn tái
hiện sau khi render toán, cần thêm thông tin cửa sổ/khối cụ thể.*

**Chưa làm:** streaming thật vào editor (SSE) — API hiện một lượt; OCR/đọc nội
dung tệp đính kèm (chỉ gửi tên); plan 2 bước + verificationToken như họ (đã
gộp còn 1 lượt có action); **in/xuất Word vẫn để `$...$` thô** (KaTeX chỉ render
trong editor và trang xem `/de/:id`). Ghi ở mục 6.1b.



### 3.29. Chặng 18 — Phân trang theo khối + sửa đếm trang (25/10/2026)

**Nguyên nhân gốc — pageCount luôn = 1.** `measure` tìm khối bằng
`:scope > .doc-content > *`, nhưng TipTap v3 bọc `.doc-content` trong một div
của `EditorContent` → selector không khớp, `blocks.length === 0`, hàm set
`pageCount = 1` và thoát. Vì vậy chỉ 1 tờ giấy được vẽ dù nội dung dài; chữ
"rơi" ra nền xám (đúng ảnh người dùng gửi). Sửa: lấy `flow.querySelector('.doc-content')`
rồi đọc `content.children`.

**Phân trang theo khối (`pagination.ts`, mới):**
- `computePagePlan(heights, spaces, contentH, stride, marginTop)` — hàm thuần:
  mô phỏng vị trí khối từ chiều cao thật; khối không đủ chỗ và còn vừa một trang
  thì chèn spacer để nó bắt đầu đúng đầu vùng nội dung trang sau. Khối cao hơn
  cả trang để tràn (không cắt nội dung bên trong — giữ nguyên tắc một editor).
- `PaginationExtension` — spacer là **widget decoration** của ProseMirror
  (`.doc-page-gap`), PM tự chèn/gỡ DOM; không ghi trực tiếp vào node editor
  (bài học chặng 17).
- `ExamEditor.layoutPass` — đo chiều cao khối + khoảng cách tự nhiên (trừ các
  spacer đã biết), tính plan, chỉ dispatch khi bản đồ spacer đổi; mọi trigger
  (ResizeObserver + MutationObserver) gộp vào một rAF.

**Sự cố trong lúc làm (đã sửa):** lần đầu dispatch spacer bằng số lẻ từ
`getBoundingClientRect` → lượt đo sau lệch dưới 1px lại dispatch → vòng lặp vô
hạn làm treo renderer (tab phải mở lại). Sửa: chỉ **làm tròn spacer cuối**
(giữ số thực khi mô phỏng để không dồn sai số — làm tròn từng khối từng gây lệch
5px), gộp đo bằng rAF. Test `test:pagination` khoá hành vi này (6 case).

**Kiểm chứng:** đề 20 câu → 3 tờ giấy, 2 spacer (185px, 267px), khối mở đầu
trang 2/3 đúng tại 1147/2294px; quét toàn bộ khối: **0 khối cắt qua mép trang**;
gõ thêm chữ khi phân trang bật vẫn ổn định (không loop, caret đúng); status bar
"3 trang". `tsc` sạch · build thành công · convert 11/11 · templates 9/9 ·
layout 7/7 · pagination 6/6 · markdown 14/14 · export 5/5.

**Giới hạn còn lại:** khối cao hơn một trang (bảng đáp án dài, bài đọc dài) vẫn
tràn qua trang — muốn cắt bên trong khối phải port cơ chế slicing của họ (đã
chốt không làm). Bản in/Word do trình duyệt/Word phân trang nên không bị ảnh
hưởng.

### 3.30. Chặng 19 — Đầu đề AI bám 2 mẫu PDF chuẩn (25/10/2026)

Đối chiếu 2 đề PDF mẫu (Toán 12 khảo sát đầu năm, Ngữ văn 12 giữa kì I) rồi sửa:

- **Prompt** (`AiPanel.tsx`): cột trái thêm "TRƯỜNG THPT …", đơn vị + tỉnh nằm
  một dòng (không `\n` cứng giữa "TẠO" và tên tỉnh); tên đề nằm ở dòng đầu cột
  phải; **không sinh `title`/`meta` trùng header**. Gọi thật
  `deepseek-v4.1-flash`: trả `header, heading, question…`, không còn title/meta.
- **Template** (`templates.ts`): "SỞ GIÁO DỤC VÀ ĐÀO TẠO …" + "TRƯỜNG THPT …"
  + "Đề chính thức" (boxed).
- **CSS** (`index.css`): `31fr 69fr`, khe `6,9%` — đo từ PDF: content 481,9pt
  thì trái 140,8pt / khe 33,3pt / phải 307,8pt; line-height `1,5` (mẫu
  ~17,3pt); `em` trong header weight 400 (dòng thời gian nghiêng thường).
- **Converter** (`convert.ts`): `splitRichLines` nhận mảng trộn string + span
  (AI có lúc trả vậy) — trước đó throw làm cả kết quả AI không áp được.
- **Sanitize** (`ComposeDoc.tsx`): chuẩn hoá span string ở mọi field; header
  dạng cũ `{text}` rơi vào cột trái thay vì rỗng.
- **AI replace + con trỏ** (`ComposeDoc.tsx`): sau `setContent` đặt lại con trỏ
  về đầu đề bằng `Selection.near(doc.resolve(1))` — trước đó selection cũ được
  map qua toàn bộ tài liệu nên có thể rơi vào khối bất kỳ.
- **Chat sau khi áp** (`AiPanel.tsx`, `ComposeDoc.tsx`): bỏ `note` khỏi hợp đồng
  và khỏi câu hiển thị (model hay lặp lại đúng câu prompt); câu xác nhận cố
  định "Đã soạn xong đề (N khối)." / "Đã thêm N khối…" / "Đã cập nhật N khối…".
- **Trạng thái chờ AI** (`AiPanel.tsx`): thay "Đang suy luận…" bằng dải trạng
  thái theo tiến trình (phân tích → bố cục → đầu đề → câu hỏi → đáp án → rà
  soát → hoàn thiện), đổi mỗi 2,4 giây; slide có dải riêng. `detectIntent` chọn
  dải theo câu lệnh: câu hỏi thường như "Chào bạn" dùng "Đang xem câu hỏi… /
  Đang soạn câu trả lời… / Đang kiểm tra lại…", không hiện bước soạn đề. API
  vẫn trả một lượt nên đây là mô phỏng tiến trình, không phải log suy luận thật.
- **Thêm/xoá khối + con trỏ** (`formatState.getTopBlock`): trước đây
  `insertBlockTemplate` và `deleteCurrentBlock` dùng `getSelectedBlock` — khối
  **sâu nhất** (prompt/phương án). Chèn một block cấp cao vào trong câu hỏi là
  sai schema; xoá chỉ xoá lời dẫn, để lại câu hỏi rỗng → con trỏ nhảy. Giờ lấy
  con trực tiếp của `doc`; `applyStylePreset` vẫn dùng khối sâu nhất.
- **Xuất Word/in** (`exportBlocks.ts`): `.hdr` 31%/69%, `table-layout: fixed`,
  11,5pt/1,5, `i` weight thường.

**Kiểm chứng:** tsc sạch · build thành công · test:convert **12/12** (thêm case
mảng trộn) · test:export 5/5 · render header tĩnh ở 794px khớp tâm cột mẫu
(trái 127pt, phải 384pt) · gọi LLM thật trả header đúng, không title/meta ·
trình duyệt thật: chèn khối khi con trỏ trong prompt → khối mới là con trực
tiếp của doc (không nằm trong câu hỏi); xoá khối → mất cả câu hỏi (20→19),
undo khôi phục đủ 20.

### 3.31. Chặng 20 — Thang nguồn khi soạn đề: tệp mẫu → tài liệu lưu → web (25/10/2026)

Chủ dự án chốt thứ tự nguồn: (1) tệp mẫu giáo viên đính kèm, (2) tài liệu đã
lưu trong app, (3) web; không đủ nguồn thì model phải nói rõ chỗ chưa chắc.

- **Đọc tệp mẫu** (`server/extract.ts`, `/api/extract`): `mammoth` cho `.docx`,
  `pdfjs-dist` (legacy) cho `.pdf`, `exceljs` cho `.xlsx`, text cho
  `.csv/.txt/.md/.json`; `.doc/.xls` báo cần lưu lại. Chạy server-side, parser
  import động nên client không phình bundle; cap 12 MB / 60k ký tự.
- **Client giữ `File`** (`AiPanel.tsx`): `Attachment.file` chỉ dùng để trích;
  lượt chat chỉ lưu metadata để không giữ tệp lớn trong state.
- **Ưu tiên 2** (`src/lib/sources.ts` `findSavedSources`): quét `myDocs`, lọc
  theo lớp (regex `lớp N`) + môn (từ khoá) + trùng từ khoá, bỏ tài liệu hiện
  tại, tối đa 3 tài liệu × 8k ký tự. Tên trùng được đánh số (2), (3).
- **Ưu tiên 3** (`server/searchProxy.ts`, `/api/search`): adapter Tavily
  (endpoint cố định, key server-side). Chưa có key → `configured:false` +
  cảnh báo trong chat, không lỗi. `.env` hiện chỉ có `LLM_*`, không có search;
  opencode gateway là inference, không thấy endpoint search.
- **Prompt** (`sourceRule`/`sourcePrompt`): tier 1 bắt bám cấu trúc/độ khó/
  phạm vi của tệp mẫu, không thay bằng kiến thức ngoài; tier 2 dùng tài liệu
  lưu; tier 3 chỉ tham khảo; tier 0 cảnh báo chưa có nguồn. Nội dung nguồn là
  **dữ liệu không tin cậy** — có câu lệnh bỏ qua mọi instruction trong nguồn.
- **UI**: lượt AI hiện dòng `Nguồn: …` (tên tệp/tài liệu/web) và cảnh báo nguồn
  nhỏ bên dưới; nguồn chỉ dùng cho lượt có intent soạn/sửa (`detectIntent`),
  câu chào/hỏi đáp không search.

**Kiểm chứng:** tsc sạch · build thành công · `test:sources` **4/4** ·
`test:extract` **2/2** · convert 12/12 · export 5/5 · templates 9/9 · trình
duyệt thật: đính kèm CSV giả → chat hiện `Nguồn: mau-lop-7.csv`, AI áp 16 khối;
không đính kèm → lấy 3 tài liệu Toán 9 đã lưu; câu "Chào bạn" không gọi search.

**Giới hạn:** ảnh đề chưa OCR (chỉ nhận dạng tên tệp); `.doc/.xls` cũ chưa đọc;
search web cần `TAVILY_API_KEY`; nguồn chỉ gắn với lượt gửi (follow-up muốn dùng
lại tệp mẫu phải đính kèm lại).

### 3.32. Đổi tên / xoá tài liệu ngay tại tab Bắt đầu (25/10/2026)

Tab Bắt đầu trước chỉ xoá được (nút "Xoá" neo `absolute` đè lên cột kích thước);
đổi tên chỉ làm được bằng nhấn đúp tab.

- **Đổi tên tại chỗ** (`StartTab.tsx`): cột thao tác mới có nút bút chì → ô tên
  thành input, Enter/blur lưu, Esc huỷ, tên rỗng hoặc không đổi thì bỏ qua. Nút
  xoá đổi sang icon thùng rác cùng cột.
- **Đồng bộ tab đang mở**: sau khi đổi tên gọi `compose.renameTab` (và
  `updateDeck` nếu deck đang mở) — nếu không, lần tự lưu sau sẽ ghi đè tên cũ.
  Thêm `renameDeck` vào `store/docs.ts` (trước chỉ có `renameDoc`).
- **Bố cục**: cột thao tác rộng 64px cố định; header thêm ô trống cùng bề rộng nên
  5 cột dữ liệu vẫn thẳng hàng (đo trên trình duyệt: header và row cùng x =
  183/219/805/947/1089). Hai nút icon 30px hiện khi rê dòng hoặc focus bàn phím.
- **Tên mặc định vẫn là** "Đề thi mới" / "Bài giảng mới" — không tự lấy tiêu đề
  trong đề; muốn đổi thì dùng bút chì ở Home, nhấn đúp tab, hoặc ô tên ở cột
  thumbnail của slide.
- **Kiểm chứng:** tsc sạch · build thành công · headless Chrome: rê dòng hiện 2
  nút, đổi tên lưu vào `localStorage`, tab đang mở đổi tên theo, chuyển tab rồi
  quay lại (saveAll) tên vẫn giữ, Esc không đổi tên.

### 3.33. Menu Tệp ở ribbon đề và slide: Đề mới / Nhập file / Tải xuống (25/10/2026)

Nút "Tệp" nâu chữ trắng đứng đầu hàng tab ribbon, bấm mở menu neo `fixed`.

- **Menu dùng chung** (`src/examEditor/FileMenu.tsx`): Đề mới / Bài giảng mới ·
  Nhập file… · Tải xuống file. Nút dùng `--color-clay`; menu dùng
  `useAnchoredPopover` nên không bị ribbon `overflow` cắt, đóng khi bấm ra ngoài
  hoặc Esc. Có dòng "Đang xử lý…" và lỗi hiện ngay trong menu.
- **Nhập file** (`src/lib/importFile.ts` + `/api/extract`): chấp nhận
  .docx/.doc/.xlsx/.xls/.pptx/.ppt. docx → mammoth; xlsx → exceljs; **pptx →
  jszip đọc `ppt/slides/slideN.xml`**, trả `slides[]` đúng thứ tự số hiệu, giải
  mã XML. `.doc/.xls/.ppt` (nhị phân cũ) báo rõ cần lưu lại thành
  .docx/.xlsx/.pptx — chưa parse. Nội dung nhập là **text**: đề nhận mỗi dòng
  một đoạn văn; slide nhận mỗi slide gốc (hoặc lô 12 dòng) thành một slide,
  dòng đầu làm tiêu đề.
- **Tải xuống:** đề dùng `exportDocBlocks` (tệp .doc mở bằng Word, như nút Xuất
  Word); slide dùng `src/lib/exportDeck.ts` — `pptxgenjs` **nạp động** (chunk
  ~373 kB chỉ tải khi bấm), map text/shape/image/table/chart, toạ độ % → `Coord`,
  cỡ chữ cqw × 7,2 = pt cho slide 16:9.
- **Tab mới:** "Đề mới"/"Bài giảng mới" tạo tab trống; nhập file cũng tạo tab
  mới (không đè tài liệu đang mở), tên tab = tên tệp.
- **Kiểm chứng:** tsc sạch · build thành công · test:extract **4/4** (thêm pptx)
  · convert 12/12 · sources 4/4 · headless Chrome: nút đúng nâu/trắng và đứng
  đầu hàng tab ở cả 2 ribbon, menu đủ 3 mục, docx → 3 đoạn văn, pptx → 2 slide
  đúng nội dung, .doc hiện lỗi rõ, tải .doc và .pptx thành công; **pptx xuất ra
  được nhập lại** đúng 2 slide.
- **Lần mở đầu bị lệch:** `popoverStyle(null)` giờ trả `position:fixed;
  visibility:hidden` thay vì style rỗng. Trước đó popover lần đầu nằm trong
  luồng, làm hàng ribbon cao lên và đẩy nút trigger xuống, nên rect dùng để neo
  bị đo sai; lần mở thứ hai đã có `pos` nên đúng. Sửa ở hook dùng chung
  (`useAnchoredPopover.ts`) nên mọi dropdown/popover trong ribbon cũng hết lệch.
- **Giới hạn:** nhập chỉ giữ text, không giữ định dạng/bảng/ảnh của tệp nguồn;
  .doc/.ppt cũ chưa đọc; pptx xuất bỏ qua lật (flipX/flipY) của phần tử.

### 3.34. Khung chọn hộp chữ slide ôm nội dung (25/10/2026)

Hộp chữ luôn cao đúng `el.h` (mặc định 16–20% ở đề mặc định/AI/nhập pptx) trong
khi chữ một dòng chỉ chiếm phần trên → khung chọn và 8 tay nắm thừa một đoạn dưới.

- **`src/lib/slideText.ts`:** `textBoxHeight` ước lượng số dòng theo bề rộng hộp +
  cỡ chữ cqw (0,5em/ký tự); `elementHeight` = `min(el.h, ước lượng)` cho node
  text, hộp rỗng giữ `el.h` để vẫn chọn/nhập được.
- **Chốt chiều cao thủ công:** thêm `SlideElement.fixedHeight`; kéo tay nắm
  trên/dưới hoặc sửa ô "Cao" trong bảng Định dạng sẽ đặt cờ này. Khi đó khung
  giữ đúng số đo người dùng đặt, không tự co nữa.
- **`EditableEl`** dùng `elementHeight` cho style và cho `base.h` lúc kéo (tránh
  nhảy chiều cao ở lần kéo đầu); bảng Định dạng hiện chiều cao thực; căn
  giữa/dưới tính theo chiều cao thực.
- **Xuất PPTX** dùng `elementHeight` và `valign: 'top'` cho khớp bản xem.
- **Kiểm chứng:** tsc sạch · build thành công · `test:slide-text` **5/5** ·
  headless Chrome: tiêu đề mặc định 16% co còn 11,6% (72,7 → 52,7px); kéo nam
  45px → 21,5% và giữ nguyên khi gõ thêm; bảng Định dạng hiện 12, sửa thành 30
  thì khung đúng 30%.
- **Giới hạn:** ước lượng 0,5em/ký tự nên chữ toàn in hoa có thể thiếu một dòng
  (AutoFitText co chữ bù). Đã kéo thủ công thì muốn tự co lại phải xoá
  `fixedHeight` (chưa có nút UI).

### 3.35. Resize phần tử slide chính xác khi xoay/lật (25/10/2026)

- **Trước:** delta kéo tính theo trục màn hình nên phần tử đã xoay/lật resize
  lệch, cạnh đối diện không đứng yên. Kéo xong nhả chuột ra ngoài phần tử thì
  click rơi vào nền khung → mất vùng chọn (tưởng như resize hỏng).
- **Giờ:** delta màn hình được chiếu vào hệ trục cục bộ của hộp (nghịch đảo phép
  xoay, rồi bỏ lật), cập nhật các cạnh trong hệ đó, sau đó dời tâm nửa delta đã
  xoay về trục slide → cạnh/góc đối diện đứng yên. Phần tử chưa xoay giữ nguyên
  hành vi cũ, kể cả kẹp trong trang.
- **Giữ vùng chọn:** `EditableEl` báo `onDragEnd` khi nhả chuột (kéo/resize/xoay);
  khung slide dùng `onClickCapture` bỏ qua cú click kế tiếp nếu vừa kéo — nhả
  chuột ngoài phần tử không còn xoá chọn. Click nền bình thường vẫn bỏ chọn.
- **Kiểm chứng (headless Chrome):** shape xoay 30° kéo cạnh E 80px → handle đi
  đúng (60; 34,7) theo trục chéo, cạnh W đứng yên (0; 0); kéo góc SE (60; 30) →
  SE đi đúng (60; 30), NW đứng yên; lật ngang kéo cạnh trái ảo 40px → cạnh phải
  ảo đứng yên; click nền vẫn bỏ chọn; không xoay thì E +80px, S +40px, NW
  −30/−20 chính xác như trước. tsc sạch · build thành công · 66 test pass.
- **Giới hạn:** kéo **cạnh** của phần tử xoay là chiếu delta lên trục của hộp
  (giống PowerPoint) nên handle không bám đúng con trỏ khi kéo chéo trục; kéo
  **góc** thì bám đúng con trỏ.

### 3.36. Audit workflow AI sinh slide của soandethi.com (25/10/2026)

Tải lại toàn bộ JS/CSS công khai của `/slides`, `/slides/[id]`, `/exams`; đọc
bundle Turbopack. Báo cáo đầy đủ: `_ref/soandethi/AI-SLIDE-AUDIT.md` (không
commit — `_ref/` đã gitignore). Prompt/model phía server không có trong bundle;
các kết luận dưới đây suy ra từ payload + hợp đồng phía client.

- **Hai bước:** `POST /api/slide-deck/plan` → `outline` + `grant` (decision
  proceed/propose/reject/clarify) → `POST /api/slide-deck/generate` stream từng
  slide `{id, calls, error}`. `proceed` tự chạy; `propose` chờ duyệt outline.
- **Catalog gửi kèm cả 2 bước:** 20 lệnh có schema, 19 theme, 26 layout, 8 preset
  motion, 208 đồ hoạ (200 cái AI thấy) + 122 icon. Model chỉ chọn trong bộ này.
- **Đẹp/chuẩn nhờ layout engine:** AI trả `composeSlide` (layout + trường nội
  dung), client `composeLayout` dựng toạ độ/font/màu theo canvas 1280×720, safe
  margin 64, tone theme/soft/accent, id vai trò, callout tự xếp, co chữ theo số
  ý, tương phản chữ/nền. 26 layout: title/section/agenda/bullets/cards/split/
  two-column/venn/table/image-*/quote/big-number/stats/timeline/cycle/pyramid/
  mindmap/example/quiz/discussion/formula/chart/closing/blank.
- **Motion:** element có `{effect,start,order,duration,delay,byLine}`; 18 hiệu
  ứng (11 khối + 7 chữ theo ký tự), 8 preset; `animationPlan` xếp enter/click
  (~900ms/bước, byLine); renderer gắn `sa-enter`/`sa-fx` + CSS vars, hiệu ứng
  native dùng fragment Reveal, chữ tách `.sa-ch` với `--i`; `--sa-step` 15–90ms
  theo độ dài; reduced-motion; đồ hoạ idle `sg-*`; present bằng Reveal.js
  (transition none/fade/slide/convex/zoom + speed, notes, presenter window).
- **Ảnh async:** slide hiện trước, ảnh chờ được vẽ sau qua `/api/exam-image`
  (prompt + context slide 2800 ký tự), tối đa 12 ảnh/bộ, chèn vào vùng trống.
- **Apply an toàn:** command registry + validate kiểu/enum/màu/icon/graphic;
  `lenient` bỏ tham số lạ, lỗi từng slide không chặn slide khác; digest
  `deckBrief`/`slideContent` ≤22 KB cho model sửa đúng chỗ.
- **Chưa thấy:** prompt/model server, cách sinh grant, model ảnh, scheduler các
  agent, quota. Không chạy thử vì cần tài khoản.

### 3.37. Chặng 21 — Theme v2: token theo môn + font + decor (25/10/2026)

Mục tiêu: theme đủ giàu để layout (chặng 22) dùng lại, thay vì 6 theme chỉ có
bg/fg/accent.

- **Token (`src/store/docs.ts`):** `DeckTheme` giữ `bg/fg/accent/fontHeading/
  fontBody` (deck lưu trước chặng 21 vẫn đọc được), thêm optional `id`, `name`,
  `tags`, `decor`, `dark`, `surface`, `muted`, `secondary`, `chart`, `fonts`.
  Không thêm `background/text/primary` trùng nghĩa với `bg/fg/accent` — một
  nguồn duy nhất cho nền/chữ/màu nhấn.
- **`src/lib/slideTheme.ts` (mới):** `DECK_THEMES` 10 theme — 6 theme cũ (đặt
  tên đúng: Sáng, Đêm xanh, Giấy ấm, Rừng, Đỏ, Tím; trước đây bảng tên trong
  ribbon bị lệch thứ tự Đỏ/Tím) + 4 theme theo môn: **Khoa học** (Toán/Lý/Hoá),
  **Văn Sử Địa**, **Sinh học**, **Ngoại ngữ & Tin**, mỗi theme có `tags` môn để
  AI chọn sau này. `normalizeTheme` điền token thiếu cho theme cũ (surface/muted
  suy ra bằng trộn màu, chart mặc định, fonts mặc định); theme người dùng thắng
  catalog cùng `id`, deck cũ không lưu id thì khớp theo `bg`. `readableTextOn`
  chọn mực `#111827`/trắng theo tương phản WCAG (≥4,5:1), `themeById` (id lạ →
  theme đầu).
- **Font:** bỏ Figtree/Fraunces khỏi theme (hai font này đã bị gỡ khỏi bundle từ
  chặng 7 nên trước đây chỉ rơi về sans-serif). Dùng font thật đang nạp: Be
  Vietnam Pro (sans), Times New Roman/Liberation Serif (serif), JetBrains Mono.
  `SlideElView`/`EditableEl` lấy `theme.fonts.heading/body`; `FitText` không còn
  hardcode Figtree đè lên font của phần tử; chữ mặc định dùng `theme.fg` (trước
  là `#000` nên theme tối bị chữ đen).
- **Decor:** 4 hoạ tiết CSS thuần qua `data-decor` trên `.slide-frame` — chấm
  (Sinh học), lưới (Khoa học), sóng (Văn Sử Địa), confetti (Ngoại ngữ & Tin);
  màu lấy từ biến `--slide-decor-ink/--slide-decor-accent` do editor đặt theo
  theme. Vẽ ở lớp `::before` dưới nội dung nên không che chữ; áp cho cả canvas,
  thumbnail và màn trình chiếu.
- **Bảng/biểu đồ:** bảng dùng `theme.fg/surface/muted` thay màu xám cứng;
  `ChartView` nhận `theme.chart` cho cột/đường/tròn.
- **Ribbon Thiết kế:** gallery 10 theme hiển thị palette (nền/chữ/2 thanh màu,
  "Aa" bằng font heading); active so theo `normalizeTheme(deck.theme).id` thay
  vì so `bg`; bỏ nhóm "Nền" (trùng hoàn toàn với gallery); dropdown phông chữ
  chỉ còn font thực có trong bundle.
- **PPTX:** text không phải `body` xuất bằng `fontHeading` (trước dùng body cho
  cả tiêu đề).

**Kiểm chứng:** `tsc` sạch · `npm run build` thành công · `test:slide-theme`
**4/4** (normalize theme cũ, tương phản ≥4,5:1, themeById, catalog 10 theme) ·
toàn bộ test cũ xanh (convert 12/12, markdown 14/14, export 5/5, layout 7/7,
templates 9/9, pagination 6/6, slide-text 5/5, sources 4/4, extract 4/4) ·
Chrome headless 1440×900: gallery đủ 10 theme, đổi theme đổi nền đúng
(`#fbf7f0`, `#f4f8ff`, `#f2fbf4`…), 4 pattern render ở cả canvas lẫn thumbnail
(`repeating-radial-gradient`, `linear-gradient`, `radial-gradient`), tiêu đề
Văn Sử Địa dùng Times New Roman, màu chữ theo `fg`, active chuyển đúng theo id.

**Giới hạn:** decor là CSS nên không đi kèm file .pptx xuất ra; đổi theme vẫn
ghi đè `background` của mọi slide như hành vi cũ (chưa có UI nền riêng từng
slide); deck cũ có `fontFamily: 'Figtree'` vẫn rơi về sans-serif.

### 3.38. Chặng 22 — Layout engine v1 + 7 bố cục (25/10/2026)

Mục tiêu: AI và người dùng chọn layout + nội dung, máy dựng hình — thay vì mỗi
slide chỉ có tiêu đề + một khối bullets.

- **`src/lib/slideLayouts.ts` (mới):** `SLIDE_LAYOUTS` 7 bố cục — `title`,
  `section`, `bullets`, `cards` (2–6), `two-column`, `quote`, `closing`; mỗi
  bố cục khai báo field dùng. `composeLayout(theme, id, content)` trả
  `SlideElement[]` theo % (lề an toàn 5–8%). Id phần tử là **vai trò cố định**
  (`title`, `kicker`, `subtitle`, `bullets`, `card-1…6`, `body`, `body-2`,
  `quote`, `author`, `accent-bar`, `divider`, `accent-line`, `mark`) để sau này
  AI sửa đúng chỗ. Layout lạ rơi về `bullets`; thiếu field bắt buộc trả mảng
  rỗng để caller fallback. Màu/font lấy từ `normalizeTheme` của chặng 21.
- **Giữ nội dung khi đổi bố cục:** `contentFromSlide(slide)` đọc lại chữ theo
  vai trò/variant — deck mặc định cũ (một ô chữ không có id/variant) vẫn được
  coi là tiêu đề; bullets bỏ dấu `•`; `two-column` đọc `body`/`body-2`;
  `cards` đọc `card-N`. `withPlaceholders` chỉ bù chữ mẫu cho field mà layout
  cần và slide thực sự chưa có (slide trống vẫn dựng được bố cục).
- **Mô hình:** `Slide.layout?: string` (optional; deck cũ không có vẫn render
  như trước). Hộp chữ do layout dựng đặt `fixedHeight: true` — nếu không,
  `elementHeight` (chặng 20) co thẻ/hai cột về đúng một dòng và phá hình học.
  Hộp chữ có `fill` giờ render nền ở cả canvas/thumbnail/presenter (trước chỉ
  file PPTX dùng `fill`).
- **UI:** nút **Bố cục** ở ribbon Chèn mở gallery 7 thẻ có hình xem trước CSS;
  thẻ active theo `slide.layout`; áp layout hỏi xác nhận (thay phần tử hiện
  có), giữ `notes`/`transition`, một bước undo.
- **AI:** `AiSlidePayload` thêm `layout/kicker/subtitle/body/items/left/right/
  quote/author`; `applyAiResult` dựng bằng `composeLayout` khi layout hợp lệ,
  sai/thiếu field thì rơi về tiêu đề + bullets như cũ. `SLIDE_SYSTEM` liệt kê
  7 layout + field để model chọn.

**Kiểm chứng:** `tsc` sạch · build thành công · `test:slide-layout` **6/6**
(catalog/geometry 0–100 + id không trùng, cards 2–6/cắt 9→6, quote/closing,
layout lạ = bullets, đọc nội dung cũ + placeholder + màu theme) · toàn bộ test
cũ xanh (convert 12/12, markdown 14/14, export 5/5, layout 7/7, templates 9/9,
pagination 6/6, slide-text 5/5, slide-theme 4/4, sources 4/4, extract 4/4) ·
Chrome headless 1440×900: gallery 7 thẻ đúng hình xem trước; áp Thẻ → tiêu đề
cũ được giữ + 3 thẻ nền `surface` (x 8/37/66, y 29, h 40); áp Hai cột → 2 cột
39% + vạch ngăn; slide trống + Trích dẫn → quote/author mẫu; **gọi AI thật**
(“3 slide phân số lớp 6, slide 1 title, slide 2 cards 3 thẻ, slide 3 bullets”)
→ model trả đúng 3 layout, cards có 3 thẻ nền, bullets 3 ý, chat chỉ hiện tóm
tắt danh sách slide.

**Giới hạn:** layout v1 chỉ dựng chữ + vạch/accent bằng shape (chưa có ảnh,
bảng, biểu đồ — chặng 23); đổi bố cục chỉ giữ được **chữ**, hình ảnh/khối
custom bị thay sau khi xác nhận (cảnh báo trong hộp thoại); `fixedHeight` khiến
hộp chữ không còn tự ôm nội dung (chủ ý để giữ hình học layout).

### 3.39. Chặng 23 — Layout v2 + tone (25/10/2026)

Đủ 14 bố cục và tông nền, để slide AI sinh ra có hình thức đa dạng thay vì chỉ
tiêu đề + bullets.

- **7 layout mới (`src/lib/slideLayouts.ts`):** `table` (bảng tối đa 6 cột × 8
  hàng, tự pad ô thiếu), `image-left`/`image-right` (element `image` chưa có
  `src` → khung chọn ảnh; giữ `src` khi đổi layout), `stats` (1–4 cặp số
  lớn/nhãn), `timeline` (3–6 bước: vạch ngang + chấm + nhãn đánh số), `cycle`
  (3–6 nút ellipse quanh vòng, chữ trên nền nhấn đọc được), `quiz` (câu hỏi +
  2–4 phương án; `answer` nhận chỉ số 0-based, chữ cái A–D hoặc khớp nguyên
  văn; đáp án đúng tô `accent` + chữ tương phản). Tổng **14 layout**.
- **Tone:** `Slide.tone?: 'theme' | 'soft' | 'accent'` (optional). `defaultTone`
  — title/section → `accent`, quote/quiz/closing → `soft`, còn lại `theme`;
  `toneBackground(theme, tone)` trả màu nền để caller ghi vào
  `Slide.background`. Palette theo tông có `onAccent` = `readableTextOn(accent)`
  nên chữ trên nền nhấn luôn ≥4,5:1. Chưa có UI chọn tông riêng — tông do
  layout quyết định hoặc AI gửi kèm.
- **Đổi theme dựng lại slide layout (`SlideEditor.applyTheme`):** trước đây đổi
  theme chỉ đổi `background`; màu chữ của layout là màu cụ thể nên sẽ lệch.
  Giờ slide có `layout` được `contentFromSlide` + `composeLayout` dựng lại theo
  theme/tone mới (giữ notes/transition); slide freeform giữ hành vi cũ.
- **Đọc lại nội dung (`contentFromSlide`):** thêm `rows`, `image`, `stats`,
  `steps`, `question`/`options`, suy `answer` từ ô có màu tô khác các ô còn
  lại; đọc được cả khối `bullets` theo id vai trò; bỏ tiền tố do builder sinh
  (`1. `, `A. `) để dựng lại không bị “1. 1.” / “A. A.”.
- **AI/ribbon:** `AiSlidePayload` thêm `tone`, `rows`, `image`, `stats`,
  `steps`, `question`, `options`, `answer`; `applyAiResult` dùng tone của AI
  hoặc mặc định layout; prompt slide liệt kê 14 layout + field + tone. Gallery
  Bố cục có 14 thẻ, mỗi thẻ một hình xem trước CSS riêng (bảng, ảnh trái/phải,
  cột số liệu, trục bước, vòng chu trình, 2×2 đáp án).

**Kiểm chứng:** `tsc` sạch · build thành công · `test:slide-layout` **10/10**
(14 layout trong khung 0–100 + id không trùng, cards, quote/closing, fallback,
đọc nội dung, bảng 8×6 + pad, timeline/cycle 3–6, quiz 2–4 + đáp án, tone +
dựng lại idempotent) · toàn bộ test cũ xanh (tổng **80 test**) · Chrome headless
1440×900: gallery 14 thẻ đúng hình xem trước; áp Bảng/Số liệu/Tiến trình/Chu
trình/Câu hỏi/Ảnh trái đúng hình học, quiz nền `soft` + đáp án A tô accent;
title nền accent chữ đọc được; đổi theme Sáng → Đêm xanh dựng lại toàn bộ slide
layout (nền `#38bdf8`, chữ `#111827`, thumbnail đồng bộ); **gọi AI thật** yêu
cầu 4 slide table/stats/timeline/quiz → model trả đủ 4 layout, bảng có dữ liệu,
stats 3 số, timeline 4 bước, quiz 4 phương án và đáp án C được tô.

**Giới hạn:** (UI chọn tone + tạo ảnh AI cho khung ảnh đã bổ sung ở 3.40);
timeline/cycle chỉ chữ + shape, chưa icon; bảng dùng renderer bảng cơ bản
(không merge cell/định dạng ô); đổi bố cục vẫn thay phần tử không phải chữ sau
khi xác nhận.

### 3.40. Chặng 23 bổ sung — ảnh AI qua Xkiro + UI chọn tông (25/10/2026)

**Provider:** config ZCode (`~/.zcode/v2/provider_config.json`) có provider
**Xkiro**: base `https://api.xkiro.com/v1`, key server-side. Model mặc định
`openai/gpt-image-2.5` là **image model**, không phải chat: POST
`/images/generations` trả job (202 `{id,status}`), poll `GET /images/generations/:id`
tới `status=succeeded` và `data[0].url`. Gọi chat vào model này bị 400 kèm
hướng dẫn dùng endpoint ảnh.

- **`server/imageProxy.ts` + `/api/image`** (dev mount trong `vite.config.ts`,
  production trong `createAppServer`): prompt ≤2000 ký tự; poll 1,5s, hạn 3
  phút (model thực tế 20–75s); tải ảnh CDN về **data URL** (≤8 MB) để deck lưu
  offline. Key lấy `IMAGE_API_KEY`/`IMAGE_BASE_URL`/`IMAGE_MODEL`, thiếu thì
  đọc provider Xkiro trong config ZCode — **không đưa key vào bundle**. Có
  `IMAGE_*` mẫu trong `.env.example`.
- **`src/lib/imageGen.ts`:** `buildImagePrompt` lấy tiêu đề + tối đa 3 ý và dặn
  model không vẽ chữ trong ảnh; `generateSlideImage` gọi `/api/image` rồi thu
  nhỏ bằng canvas (tối đa 1280px, JPEG q0.85): PNG 1,3 MB → **~140 KB**, nên
  localStorage chịu được nhiều ảnh; canvas lỗi thì giữ ảnh gốc.
- **UI khung ảnh:** khung trống có "Chọn ảnh" và **"Tạo ảnh AI"**; đang chờ hiện
  "Đang tạo ảnh…", lỗi hiện "Lỗi tạo ảnh" (title có thông điệp đầy đủ). Ảnh ghi
  vào slide chứa nó qua `deckRef` (chờ 20–75s không đè sửa đổi khác); viền nét
  đứt chỉ còn khi chưa có ảnh.
- **UI tông nền:** tab Thiết kế thêm nhóm **"Tông nền"** — Theo theme / Dịu /
  Nhấn — active theo `slide.tone` (hoặc mặc định của layout); chỉ bật khi slide
  có layout; đổi tông dựng lại phần tử nhưng giữ ảnh/nội dung.

**Kiểm chứng:** `test:image` **3/3** (prompt bám tiêu đề + 3 ý, fallback, không
chữ trong ảnh) · tsc sạch · build thành công · toàn bộ **83 test** xanh ·
`POST /api/image` thật trả 200, data URL PNG 1,3 MB (model đúng) · Chrome
headless: áp "Ảnh trái" → bấm Tạo ảnh AI → 74s trả **JPEG 138 KB, 1024²** render
đúng trong khung; đổi tông "Nhấn" → nền `rgb(37,99,235)`, ảnh còn nguyên, nút
active chuyển đúng; viền nét đứt biến mất khi có ảnh.

**Giới hạn:** mỗi lần một ảnh, chưa có hàng đợi/chèn ảnh hàng loạt vào vùng
trống (phần còn lại của chặng 28); ảnh vuông 1024² bị crop theo khung; fallback
key phụ thuộc config ZCode của máy — triển khai máy khác phải điền `IMAGE_*`.

### 3.41. Audit AI sinh slide của GenOffice (25/10/2026)

Báo cáo đầy đủ: `_ref/genoffice/AI-SLIDES-AUDIT.md` (không commit — `_ref/` đã
gitignore). Đọc `apps/slides/src/renderer/ai/*`, `packages/pipelines/src/slides/*`,
`agent-core`, `ai-provider`, `pptx-ops`.

- **Họ làm gì:** agent ReAct nhiều lượt có tool; `generate_deck` = hỏi yêu cầu →
  web_search → **Style Skill** (một call riêng) → **outline** (một call, layout
  chỉ là nhãn gợi ý) → tự search ảnh → **sinh từng trang một call** (output cap
  16k, validate/clamp page-spec, repair 1 lần) → land dần → **QC từng trang**
  (geometry audit + screenshot vision; tối đa 20 trang; rollback nếu xấu). Sửa
  element bằng edit queue + script DSL + 71 op giao dịch atomic.
- **Không có template layout:** model tự viết page-spec toạ độ tuyệt đối; chất
  lượng hình học nhờ prompt anti-AI, font metrics/autofit và QC. Vì vậy không
  nên copy freeform của họ — mình đang có 14 layout deterministic + theme/tone,
  đó là lợi thế.
- **Mình thiếu để bằng họ:** style/outline/per-page/repair/QC/streaming thật;
  ảnh tự động theo brief; sửa theo element/selection; font metrics/valign;
  style template/layout skeleton. **Mình có:** layout engine + test hình học,
  theme/tone, freeform editor, image gen thủ công, PPTX export.
- **Chưa biết:** prompt/model thật sau proxy Genspark (`claude-opus-5-5` chỉ là
  alias); provider mình (deepseek qua opencode) có tool calls/streaming/vision
  không; tỷ lệ đóng góp model vs prompt vs QC; hiệu quả layout-skeleton; image
  provider phía họ; prompt “HTML pipeline first” trong repo đã lỗi thời.
- **Đề xuất:** 23.5 polish (đã xong 3.42) → 24 motion → 26a style+outline →
  26b per-slide + repair → 27 regenerate/QC → 28 ảnh tự động; agent tools chỉ
  khi cần sửa element bằng ngôn ngữ tự nhiên.

### 3.42. Chặng 23.5 — Polish 14 layout (25/10/2026)

Sau khi xem ảnh chặng 23: slide đúng hình học nhưng khô (chữ dồn góc trên,
card rỗng, bảng lưới đen, tone accent tô kín). Chặng này chỉ sửa thẩm mỹ, không
đổi model dữ liệu.

- **Tông nhấn:** `paletteOf('accent')` giờ dùng nền **tint** `mixHex(bg, accent,
  12–22%)` thay vì tô kín accent; chữ giữ `theme.fg` nên vẫn ≥4,5:1. Title
  accent thêm dải nhấn trên cùng (`accent-band` 100×1,4%). Section giữ vạch trái,
  quote thêm `quote-bar` dọc.
- **Cards:** bỏ kiểu chữ tô nền cao 40%; mỗi thẻ = panel `round` nền `surface`
  + số thứ tự `01…` màu accent + nội dung. Chiều cao 34% (1 hàng) / 28% (2
  hàng), căn giữa vùng nội dung. Id mới `card-N-panel`, `card-N-index`; đọc lại
  nội dung vẫn lấy `card-N`.
- **Stats:** mỗi số liệu có panel `round` nền `surface`, số lớn accent, nhãn
  muted; id `stat-N-panel`.
- **Timeline:** panel nền `surface` bao cả trục; đường mảnh màu muted; chấm tròn
  accent; số bước `01…` phía trên; nhãn dưới bỏ tiền tố “1.” (đã tách số riêng).
- **Cycle:** node thành hình tròn thật (h = w × 16/9), nhỏ hơn khi 6 bước; chữ
  trong node căn giữa theo hộp.
- **Bảng:** header nền accent + chữ `readableTextOn(accent)`, hàng zebra
  `surface`, border muted, bo góc ngoài, padding rộng hơn; áp cho cả canvas soạn
  và bản xem/thumbnail. Xuất PPTX cũng tô header/zebra theo theme.
- **Ảnh:** khung ảnh bo góc 1cqw; prompt ảnh thêm “vector phẳng, nét mảnh, màu
  pastel, bố cục dọc” để khớp khung ảnh dọc.
- Không thêm `valign` vào model: thay bằng panel + số thứ tự + hộp chữ đặt đúng
  chỗ, giữ editor textarea WYSIWYG (tránh đổi cơ chế soạn chữ).

**Kiểm chứng:** `tsc` sạch · build thành công · `test:slide-layout` **10/10**
(thêm case tông accent tint cho **mọi** theme, panel/index card, timeline không
còn tiền tố) · `test:image` 3/3 · toàn bộ **83 test** xanh · Chrome headless:
title nền `rgb(229,236,253)` + dải xanh; cards 3 panel + 01/02/03; stats 3
panel; timeline 4 chấm + số; cycle 4 hình tròn; bảng header xanh + zebra + bo
góc; quote có vạch dọc; theme Đêm xanh đổi đúng panel/chữ.

**Giới hạn:** không thêm vertical-align (chữ vẫn bắt đầu từ đỉnh hộp); card
nội dung ngắn vẫn còn khoảng trống dưới; timeline/cycle chưa có mũi tên/icon;
bảng chưa merge cell; polish mới áp cho layout dựng bằng engine, slide freeform
giữ nguyên.

### 3.43. Chặng 26a — Dàn ý + duyệt trước khi sinh slide (25/10/2026)

Trước đây một câu lệnh là một lượt gọi trả cả deck JSON rồi áp ngay: không xem
trước được hướng đi, và model phải vừa chọn bố cục vừa viết nội dung trong một
lần. Chặng này tách lượt đầu thành **lập dàn ý + chọn style**, người dùng duyệt
rồi mới sinh nội dung — đúng nửa đầu của chặng 27 trong lộ trình 6.8, làm sớm
vì nó cải thiện chất lượng deck rõ hơn motion.

- **Hai lượt gọi**: (1) `SLIDE_PLAN_SYSTEM` trả
  `{title, theme, audience, style, mainIdeas[], slides:[{title, layout, tone?,
  kicker?, brief?}]}`; (2) sau khi duyệt, `SLIDE_SYSTEM` + JSON dàn ý trả deck
  đầy đủ như cũ (26b đã thay bằng sinh từng trang — 3.44). Gộp style + outline
  vào **một** lượt (audit GenOffice tách hai lượt) vì với 10 theme/14 layout thì
  style chỉ là chọn theme + 2 câu mô tả; 26b tái dùng đúng `style` này trong
  prompt từng trang.
- **Catalog sinh từ code**: `slideCatalogText()` đọc thẳng `DECK_THEMES` +
  `SLIDE_LAYOUTS` (id, mô tả, field) nên thêm theme/layout không phải sửa prompt.
- **Chuẩn hoá dàn ý** (`parseDeckPlan`): bỏ slide không tiêu đề; layout lạ →
  `bullets`; tone lạ bỏ; theme lạ bỏ (giữ theme deck); cắt 20 slide/6 ý chính,
  title 160, brief 400 ký tự. Nhận JSON trần, `{"plan":…}` hoặc fence.
- **Thẻ duyệt trong chat** (`PlanCard`): tiêu đề, bộ màu + đối tượng + số slide,
  ý chính, danh sách slide (số thứ tự, tên layout, tone, brief), nút **Tạo
  slide** / **Huỷ**. Huỷ không chạm deck; duyệt mới gọi lượt 2.
- **Theme do dàn ý chọn**: `applyAiResult(text, plan)` áp `theme` của dàn ý cho
  cả deck như đổi theme (slide layout được dựng lại, slide freeform đổi nền),
  rồi mới thêm slide mới — tránh deck trộn hai bộ màu.
- Dàn ý không parse được → rơi về hành vi cũ (deck một lượt) thay vì chặn người
  dùng; chat vẫn chỉ hiện tóm tắt, không phun JSON.

**Kiểm chứng:** `tsc -b --noEmit` sạch · `npm run build` thành công · toàn bộ
**90 test** xanh (83 cũ + `test:slide-plan` 7 nhóm: sanitize, cap, wrapper,
fence, null, catalog đủ 10 theme/14 layout, không hồi quy `parseAiDeck`) ·
smoke test thật qua `/api/llm`: dàn ý 8 slide sau 28 s (theme `khoa-hoc`, đúng
title → section → bullets → two-column → table → cards → quiz → closing), deck
đầy đủ sau 21 s, `parseAiDeck` đọc đủ 8 slide · Chrome headless (bản CSS build):
thẻ dàn ý đúng bố cục, số `01…04` không xuống dòng, nút Tạo slide/Huỷ đúng màu.

**Giới hạn:** hai lượt gọi ~50 s/deck (provider 20–30 s mỗi lượt) — chấp nhận
vì có bước duyệt; chưa sửa từng dòng dàn ý (chỉ duyệt/huỷ — để chặng 27); chưa
lưu `style` vào `Deck` (26b đã thêm ở 3.44); chưa sinh từng trang/validate/repair
(26b đã làm ở 3.44); dàn ý 16 slide làm thẻ chat dài (danh sách cuộn trong 320 px).

### 3.44. Chặng 26b — Sinh từng slide + validate/repair + chèn dần (25/10/2026)

Lượt 2 của 26a vẫn bắt model trả cả deck trong một JSON: slide sau dễ lặp ý
slide trước, một field sai làm hỏng cả deck, và người dùng chỉ thấy kết quả sau
20–30 s. Chặng này gọi **mỗi slide một lần**, kiểm tra theo layout, sửa tối đa
một lần, rồi chèn ngay vào deck theo đúng thứ tự dàn ý.

- **Hợp đồng một slide** (`src/lib/slideAi.ts`):
  - `sanitizeSlide(raw, layout, tone?)` — ép đúng layout của dàn ý (AI không
    được đổi), giữ tone của dàn ý, cắt mọi field theo giới hạn layout chịu được
    (bullets/items ≤6, rows 8×6, stats ≤4, notes ≤6…), bỏ field lạ.
  - `validateSlide(page, layout)` — field bắt buộc theo từng layout: title/
    section/closing cần `title`; cards ≥2 thẻ; two-column ≥2 ý; table ≥2 hàng ×
    2 cột; stats ≥1 value; timeline/cycle ≥2 bước; quiz cần `question`, ≥2 phương
    án và `answer` trỏ đúng phương án (index 0-based, chữ A–D hoặc nguyên văn —
    dùng chung `resolveAnswer` với layout engine).
  - `pageSystemPrompt(plan, slide, i)` — chỉ gửi layout bắt buộc + field hint
    (sinh từ `layout.fields`), style/đối tượng của dàn ý và cả dàn ý (để không
    lặp ý), không gửi catalog 14 layout. Công thức toán viết **Unicode** (², √,
    ·…), không LaTeX — slide render chữ thuần.
  - `repairPrompt(errors)` — lượt sửa thứ hai nêu đúng lỗi, model chỉ được trả
    một JSON; vẫn sai thì bỏ slide, không chèn nội dung rác.
- **Chạy song song 2 luồng, chèn đúng thứ tự** (`AiPanel.generateFromPlan`):
  `results[i]` giữ trang đã xong; con trỏ `cursor` chỉ chèn khi các trang trước
  đã có (trang lỗi = `null` → bỏ qua). Trang đầu tiên áp theme + style của dàn
  ý, các trang sau chỉ nối thêm. Huỷ giữa đường: dừng gọi mới, các trang đã
  chèn vẫn giữ, deck cũ không bị xoá.
- **Chèn dần** (`appendSlidesToDeck` trong `slideAi.ts` + `SlideEditor`): đọc
  `deckRef.current` tại thời điểm trang xong (không dùng bản render cũ), trả
  patch `{theme?, style?, slides}`; lần đầu đổi theme còn dựng lại slide layout
  cũ, slide freeform chỉ đổi nền. `Deck.style?: string` được lưu để tái dùng.
  Logic dựng slide + đổi theme nằm ở lib để test được, editor chỉ ghi patch.
- **Tiến trình thật** (`ChatTurn.progress` + `DeckProgress`): animation Trợ lý
  giấy + “Đang viết: <tên slide> · 3/8 slide” + thanh tiến trình; xong thì thay
  bằng “Đã thêm 8 slide…” hoặc “Bỏ qua N slide vì nội dung không hợp lệ”.
- **Skeleton thumbnail** (`onPendingSlides` → `SlideEditor.pendingSlides`): sau
  khi duyệt, cột thumbnail vẽ `total − done` ô xám 16:9 (3 thanh + vệt sáng
  chạy, tắt khi `prefers-reduced-motion`); trang nào về thì thay bằng thumbnail
  thật, trang bị bỏ cũng làm số ô giảm. Chỉ là CSS, không đụng model deck.

**Kiểm chứng:** `tsc -b --noEmit` sạch · `npm run build` thành công · toàn bộ
**99 test** xanh (90 cũ + `test:slide-ai` 9 nhóm: sanitize/cap, validate 14
layout, quiz answer, prompt, repair, parse, chèn dần + đổi theme + fallback) ·
smoke thật qua `/api/llm` với 4 layout (title/section/bullets/two-column),
concurrency 2: **7,9–9,6 s cho cả 4 slide**, cả 4 hợp lệ, **0 lượt repair**; nội
dung toán ra `b² = a·b′` (Unicode, không LaTeX) · Chrome headless (CSS build):
thanh tiến trình đúng màu/vị trí, trạng thái 0/8 và 3/8; ô skeleton 16:9 đúng
bề rộng thumbnail, 3 thanh + số thứ tự, không tràn cột 190 px.

**Giới hạn:** chỉ validate **cấu trúc** (không QC nội dung/hình học như
GenOffice); lỗi mạng của một trang → bỏ trang đó, không retry (lượt sửa chỉ dành
cho lỗi field); 2 request đồng thời là mức an toàn với provider hiện tại; chưa
sửa/xoá từng slide bằng AI hay sinh lại một trang (chặng 27); `style` đã lưu
nhưng chưa hiện trong UI; dàn ý 16 slide vẫn tốn ~20 s.

### 3.45. Chặng 27a — Ngân sách chữ + bố cục art-directed (25/10/2026)

Sau 26b, người dùng nhận xét slide vẫn "như người làm sơ cấp": không bố cục, nhiều
chữ, thiếu thành phần trang trí. Nguyên nhân chính không nằm ở model mà ở hai chỗ:
prompt cho phép mỗi slide tới 6 ý × 220 ký tự, và `FitText` tự thu chữ xuống 60%
để nhét vừa hộp (`SlideEditor.tsx:805`) nên slide dày vẫn "hợp lệ" nhưng trông
chữ nhỏ, bí. Chặng này sửa lớp thiết kế tĩnh trước khi làm ảnh (28).

- **Ngân sách chữ** (`BUDGETS` trong `slideAi.ts`): mỗi layout có tổng ký tự,
  số mục và độ dài mỗi mục; prompt sinh đúng câu ngân sách từ bảng này
  (`budgetLine`) nên không lệch validate. Ví dụ: bullets tổng ≤ 400, 2–4 ý ×
  ≤ 90; cards 2–5 mục × ≤ 80; comparison 3 × ≤ 55 mỗi bên; timeline 3–5 bước ×
  ≤ 60; bảng ≤ 6 hàng, ô ≤ 40; tiêu đề ≤ 80. Vượt ngân sách → lỗi repair
  ("quá nhiều chữ 460/400") thay vì để FitText thu nhỏ.
- **Prompt viết như slide:** một ý lớn mỗi slide, mỗi ý 8–15 từ, cắt từ nối và
  giải thích dài, ưu tiên số liệu; brief dàn ý 1 câu ≤ 140 ký tự, title ≤ 10 từ.
- **5 bố cục mới** (tổng **19**):
  - `statement` — một câu lớn, dấu trích + vạch nhấn + tác giả, nền accent.
  - `agenda` — panel màu bên trái (kicker + title) + danh sách đánh số `01…`
    bên phải, có đường phân cách; tự bỏ tiền tố số trong item để không bị "01 · 01".
  - `comparison` — hai panel đối lập có nhãn `leftTitle`/`rightTitle`, huy hiệu
    VS tròn ở giữa.
  - `image-full` — ảnh phủ kín, thẻ chữ nhỏ góc dưới trái + vạch accent.
  - `stat-image` — hai số liệu lớn bên trái, ảnh phủ nửa phải.
- **Trang trí thuần shape** (không asset): title/closing thêm vòng tròn lớn +
  chấm accent (h = w × 16/9 để tròn thật), bullets thêm vạch dọc accent,
  statement thêm dấu trích + vạch; agenda/ comparison có panel/badge.
- **Model dữ liệu:** thêm `leftTitle`/`rightTitle` optional vào
  `SlideLayoutContent` + `AiSlidePayload`; `contentFromSlide` đọc lại; DEMO và
  `withPlaceholders` phủ đủ 19 layout để gallery/đổi layout không trống.
- **Plan prompt:** ưu tiên agenda/statement/comparison, bullets chỉ khi thật có
  2–4 ý ngắn; layout ảnh tối đa 3 slide và chỉ khi brief có hình.

**Kiểm chứng:** `tsc -b --noEmit` sạch · `npm run build` thành công · toàn bộ
**100 test** xanh (thêm 10 nhóm `test:slide-ai` gồm ngân sách chữ; layout 19/19
nằm trong 0–100) · smoke thật 6 trang (statement/agenda/comparison/bullets/
stat-image/image-full), concurrency 2: **20,8 s**, cả 6 hợp lệ, **0 repair**,
mỗi slide **70–270 ký tự** (trước đây 400–1.000) · plan thật 17 s cho 9 slide
chọn title → agenda → section → cards → two-column → comparison → timeline →
quiz → closing · Chrome headless render 8 layout: sửa title bị tràn 3 dòng
(hạ cỡ, nới hộp) và lỗi agenda "01 · 01".

**Giới hạn:** ngân sách là heuristic theo ký tự, không đo pixel; chữ vẫn bắt
đầu từ đỉnh hộp (không vertical-align) nên slide ít chữ còn khoảng trống dưới;
layout ảnh vẫn là khung chờ (28 mới tự sinh/chèn ảnh); chưa có icon/graphic
chuyên nghiệp; 27a không đụng motion (24/25).



### 3.46. Vòng “visual material” cho slide — icon semantic, ảnh thật, fallback model (27/10/2026)

Sau khi tự chấm contact sheet: slide đúng hình học nhưng vẫn “an toàn”. Vòng này
thêm vật liệu thị giác thật thay vì chỉnh màu.

- **Icon semantic (`src/lib/slideAssets.ts`):** 16 icon Lucide (ISC) theo môn/chủ
  đề, chọn bằng `pickSlideAsset(text)` theo tags tiếng Việt. `SlideElement` thêm
  `type: 'icon'` + `assetId` (optional). Renderer editor/thumbnail/presenter dùng
  chung một nhánh; PPTX export render icon thành SVG data URL.
- **Layout dùng icon:** title (icon trong panel nhấn), bullets (icon theo tiêu đề
  thay cho khối số vô nghĩa), cards (badge icon + số thứ tự), stats (mỗi số liệu
  một icon theo nhãn: nghiệm → sigma, trục → chart, đỉnh → target).
- **Vùng nội dung:** bullets/cards tính chiều cao theo text rồi canh giữa; card
  text canh giữa dọc; image-left/right tăng cỡ chữ và bề rộng cột chữ.
- **Tự sinh ảnh:** `applyAiSlide` gọi `generateSlideImage` cho 4 layout ảnh khi
  AI không trả `image`; lỗi provider thì giữ placeholder theme, không mất slide.
- **Ảnh:** proxy mặc định chuyển sang `openai/gpt-image-2.5` (Xkiro, async job,
  ~55s), timeout 90s; prompt chuyển sang editorial education, có chủ thể, không chữ.
- **Fallback model:** chuỗi `deepseek-v4.1-flash` → `deepseek-v4.1-flash-free` →
  `google/gemini-3.8-flash` (Xkiro) → `google/gemini-3-flash`. Proxy không return
  sớm khi một model 401/429/5xx; key Xkiro lấy từ provider_config (không bị key
  stale trong shell đè); Gemini không nhận `reasoning_effort`.
- **Test:** `test:slide-assets` mới; layout/ai/image cập nhật. Toàn bộ suite xanh.

**Tự chấm (ảnh focus kích thước gần thật):** title 8 · bullets 8 · cards 8 ·
stats 8 · image-right 8 → **trung bình 8/10**. Ảnh minh hoạ trong bản chấm được
sinh thật qua `/api/image`; vẫn là đánh giá thị giác của trợ lý, không phải QC
vision độc lập.

**Giới hạn:** ảnh AI mất 55–90s/slide nên deck 3 slide ảnh chậm hơn; icon Lucide
là nét mảnh, ở slide rất ít chữ vẫn có thể nhỏ; chưa có QC hình học tự động.

**Sửa lỗi cards sau phản hồi 27/10:** slide 4 thẻ bị cắt chữ, icon góc đè tiêu đề,
4 thẻ xếp 3 cột lẻ loi. Đã sửa: 4 thẻ → lưới 2×2; badge icon co theo bề rộng thẻ
(không còn chiếm nửa thẻ); cỡ chữ trong thẻ chọn theo chiều cao còn lại nên không
mất dòng cuối; tiêu đề dài tự giảm cỡ (3,2/3,6/4,3 cqw) và bỏ icon nổi ở góc.

**Chọn màu theo chủ đề (27/10):** theme không gắn cứng vào môn. Mỗi theme có
`vibe` (cảm giác/tông) và tags chỉ là gợi ý; catalog gửi cho model ghi rõ "chọn
theme theo chủ đề, cảm xúc, đối tượng — không bắt buộc theo môn", nên chủ đề tự do
(hướng nghiệp, kỹ năng…) vẫn chọn được bộ màu phù hợp. Icon dùng `currentColor`
nên tự đổi theo accent của theme (đã kiểm chứng 4 theme: xanh, nâu đất, tím, navy).
Bộ icon mở rộng lên 25 mục (văn, ngoại ngữ, tin, hàm số, mỹ thuật, nhạc, thể dục,
kinh tế, lịch sử…) bằng Phosphor Duotone (MIT).

**Style pack cho deck (27/10):** thêm `src/lib/slideStyles.ts` — 6 art direction
(editorial / keynote / consulting / bento / classroom / bold) rút gọn từ
SlideSpeak/presentation-design-prompts (MIT). Planner trả `stylePack`; plan card
hiện tên pack; prompt từng slide chèn luật pack + điều cần tránh. `parseDeckPlan`
bỏ id lạ. Đây là phần trả lời cho "deck lúc nào cũng một nhịp": nhịp/mật độ do
pack quyết định, không chỉ do layout.

**Design token từ beautiful-html-templates (27/10):** giữ engine hiện tại, mượn
design (MIT, repo zarazhangrui/beautiful-html-templates): thêm token theme
`radius`, `shadow` (soft/hard/none), `border`/`borderColor`; decor mới `grain`
(vân giấy), `glow` (vệt sáng góc), `frame` (khung poster). 10 theme được gán
tính cách: Đỏ = poster cứng (radius 0, bóng lệch 6px, viền đen), Giấy ấm/Sinh =
radius lớn + grain, Tím = glow. Renderer shape dùng token theme, element có thể
ghi đè `radius`/`border`. **Chưa** dùng HTML template — đúng lựa chọn của chủ dự
án; giới hạn còn lại là illustration/backdrop thật.

**AI panel 2 chế độ PPT/HTML (27/10):** segmented control trong composer của chế
độ slide (thẻ trượt 260ms, `useSlidingThumb`). `PPT` giữ pipeline dàn ý → sinh
từng slide. `HTML` gọi một lượt với `HTML_SYSTEM`: model trả **một tệp HTML tự
chứa** (16:9, CSS trong `<style>`, phím chuyển slide), app mở modal xem trước
bằng iframe `sandbox="allow-scripts"` + nút tải `.html`. Không đụng deck hiện
tại. Đã test thật qua `/api/llm`: Gemini 3 Flash trả 5.162 ký tự HTML bắt đầu
bằng `<!doctype html>`.

**HTML mode tự sinh theo brief thiết kế (27/10):** bỏ hướng template HTML
(đã vendor thử 3 template MIT rồi gỡ theo quyết định của chủ dự án). Prompt
`src/lib/htmlDeckPrompt.ts` là brief đầy đủ: nền sáng, một màu nhấn, tương phản
≥4,5:1, font hỗ trợ tiếng Việt, mỗi slide một ý, bố cục đa dạng, animation vào
nhẹ có stagger + reduced-motion, kèm checklist QA (không tràn/đè, ≤60 từ/slide).
App chuẩn hoá NFC và thay Georgia/Cambria bằng Times New Roman vì hai font này
làm vỡ dấu tiếng Việt trên Windows (đã kiểm chứng bằng ảnh so sánh font).
Smoke test thật: Gemini 3 Flash trả 11.656 ký tự, 8 section; render slide 1/3/4
đúng bố cục, không tràn, dấu tiếng Việt đúng.

### 3.47. Sửa lỗi “Các model AI đều không phản hồi” khi lập dàn ý slide (27/10/2026)

**Triệu chứng:** bấm Gửi ở trợ lý AI của trình soạn slide, chờ một lúc rồi nhận
`Các model AI đều không phản hồi. deepseek-v4.1-flash: The operation was aborted
due to timeout`. Đề thi vẫn chạy vì prompt ngắn.

**Nguyên nhân:** `UPSTREAM_TIMEOUT_MS` trong `server/llmProxy.ts` là 45s, trong
khi model reasoning hiện tại (`deepseek-v4.1-flash`) tiêu 7–10k token suy luận cho
một dàn ý 10–16 slide → 30–90s mới trả. Prompt càng dài càng dễ vượt hạn, dù
provider vẫn khoẻ.

**Sửa:**

- `server/llmProxy.ts`: timeout đọc từ `LLM_TIMEOUT_MS`, mặc định **120s**
  (`upstreamTimeoutMs()` đọc lúc gọi, không phải lúc import — `.env` được nạp sau
  khi module load).
- `src/examEditor/AiPanel.tsx`: lượt lập dàn ý và lượt sinh từng slide (kể cả
  lượt repair) truyền `reasoningEffort: 'medium'` thay vì `max`. Đo thật cùng một
  prompt 10 slide: `max` 7.173 token suy luận / 33s, `low` 1.927 token / 21s; JSON
  vẫn qua `sanitizeSlide` + `checkSlide` nên hạ effort không làm hỏng hợp đồng.
- `.env.example`: ghi chú `LLM_TIMEOUT_MS` để tự chỉnh khi mạng chậm.

**Lưu ý vận hành:** phần timeout nằm ở server nên **phải khởi động lại
`npm run dev`** mới có hiệu lực; sửa client thì HMR tự áp. Typecheck xanh.

### 3.48. Audit đối chiếu với code soandethi trích xuất (27/10/2026)

Chủ dự án trích được **mã nguồn client** của soandethi.com (bundle public) vào
`~/Downloads/soandethi-slide-code/` (19 file, có `ANALYSIS.md`). Đối chiếu trực
tiếp với `src/lib/slide*` + `AiPanel`/`SlideEditor`. Báo cáo đầy đủ:
`_ref/soandethi/SLIDE-GAP-AUDIT.md` (không commit — `_ref/` đã gitignore).

**Kết luận:** thua không phải do prompt mà do **thiếu lớp design engine** giữa
JSON của AI và pixel: họ "AI điền khuôn, code vẽ hình" với auto-typography đo
trước khi đặt (`S(lines)`, `x(texts,width,fontSize)`, clamp theo từng layout,
repair vùng đè), kho **208 đồ hoạ vector (200 cái AI thấy) + 122 icon** thay ảnh
AI, **18 hiệu ứng
+ 8 preset mood theo vai trò** + click-reveal cho quiz/example, lenient repair
(không bao giờ mất slide), nén ngữ cảnh 22KB/slide, hàng đợi ảnh dedupe + dừng
khi hết quota. Mình có **25 icon**, không animation (transition lưu nhưng trình
chiếu không chạy), 1 lần repair rồi bỏ slide, gửi nguyên lịch sử chat.

**Cái mình không thua (giữ nguyên):** ngân sách chữ theo layout (họ không có),
tương phản WCAG + `inkOf`, 6 style pack, pipeline plan → duyệt → sinh từng trang,
chế độ HTML tự chứa.

Lộ trình mới (chi tiết ở báo cáo): 1) typography engine → 2) kho đồ hoạ vector →
3) motion + click-reveal → 4) lenient repair → 5) nén ngữ cảnh → 6) hàng đợi ảnh →
7) PPTX import + version history + formula. Ước lúc audit ~57–60%; **chặng 1–2
đã xong (3.49/3.50) đưa lên ~72%**, chặng 3 mục tiêu ~80%.

### 3.49. Chặng 1 — Typography engine: đo trước khi đặt (27/10/2026)

Mục tiêu theo audit 3.48: bỏ tình trạng mỗi nơi hiển thị tự co chữ một kiểu
(editor/thumbnail co bằng `FitText`, PPTX không co) và chữ dài tràn hộp.

**Lõi mới — `src/lib/slideMeasure.ts`:**

- `textBoxHeight(text, width, fontCqw, lineHeight)` — công thức duy nhất để ước
  lượng chiều cao khối chữ, dùng chung cho layout engine, `elementHeight` và test.
  Hai hằng số hiệu chỉnh: `CHAR_WIDTH_EM = 0.52` (font sans tiếng Việt rộng hơn
  0,5em; đo ở 0,5 thì chữ vừa khít trên giấy lại xuống dòng thật trong DOM) và
  `TEXT_INNER_WIDTH = 0.98` (trừ padding ngang `p-[1%]` mỗi bên).
- `fitFontSize({ text, widthPct, heightPct, baseCqw, lineHeight, minScale })` —
  chọn cỡ lớn nhất ≤ cỡ thiết kế mà vẫn vừa hộp; chỉ co, không phóng to; sàn 60%
  (tiêu đề 55% vì hộp tiêu đề layout chỉ cao 12–13%).

**Một điểm chặn duy nhất — `textEl()` trong `slideLayouts.ts`:** mọi hộp chữ của
cả 19 layout đều đi qua đây, nên chỉ cần fit ở đây là cả bộ layout được "đo trước
khi đặt". Cỡ đã fit được ghi thẳng vào `SlideElement.fontSize` → editor, thumbnail
và PPTX dùng chung một cỡ; `FitText` chỉ còn là lưới an toàn cho chữ người dùng
tự nhập.

**Sửa kèm theo (đều là lỗi thật phát hiện khi đo):**

- `textEl` trước đây đặt `lineHeight` rồi spread `...style`, nên style có
  `lineHeight` sẽ ghi đè; giờ tính lineHeight một lần và ghi sau spread.
- `elementHeight` bỏ qua `el.lineHeight` (luôn 1,25) → hộp auto-height lệch với
  hộp layout (1,4). Đã truyền `el.lineHeight ?? 1.25`.
- Hộp quá nhỏ so với sàn 60%: kicker/subtitle layout `title` và body
  `image-full` được nới 0,5–2% chiều cao (không đè phần tử nào).
- `FitText`/`AutoFitText` fit trước khi webfont load xong → font swap đổi số dòng
  mà `ResizeObserver` không thấy. Thêm `refitOnFonts()` (`document.fonts.ready` +
  `loadingdone`).
- FitText làm tròn **lên** 0,1cqw (`2,45 → 2,5`) — đúng ở biên là tràn. Đổi sang
  làm tròn xuống 0,01cqw.

**Kiểm chứng:**

- `test:slide-measure` mới, 9 nhóm: công thức đo · fitFontSize (không phóng to,
  sàn, ổn định) · **bất biến 19 layout** với nội dung stress (tiêu đề 64 ký tự,
  4 bullet dài, 6 thẻ, bảng 6×4, stats nhãn dài…) — không hộp chữ nào tràn quá
  0,15%; layout ngắn vẫn giữ đúng cỡ thiết kế (bullets 3 ý = 3,25cqw).
- Toàn bộ suite slide xanh (text 5/5, layout 10/10, theme 4/4, plan, ai, assets
  5/5, layout 7/7, pagination 6/6), `tsc` sạch, build thành công.
- Kiểm tra DOM thật: bơm deck stress 12 layout vào localStorage, đo
  `scrollHeight > clientHeight` trên **12 thumbnail + stage của từng slide**
  (editor dùng textarea) → **0 tràn**. Trước khi sửa, title layout cards tràn 2px.

**Còn lại của chặng (để chặng sau):** repair vùng đè (callout) và clamp riêng
theo layout kiểu soandethi (stats theo độ dài nhãn, bảng theo số hàng) — hiện
fitFontSize đã xử lý phần lớn; các clamp đó chỉ cần khi thêm layout mới.

### 3.50. Chặng 2 — Kho 112 đồ hoạ vector + AI chọn thay ảnh (27/10/2026)

Chủ dự án giao 2 contact sheet (100 rồi 112 icon, 64px, nét 3px `#22333B`,
8 màu pastel). Đây là đòn bẩy thị giác lớn thứ hai sau typography engine.

**Nhập kho — `scripts/import-graphics.mjs`:**

- Đọc sheet, tách từng cặp path (1 fill + 1 nét), cắt cửa sổ **70×70** quanh tâm
  icon (3px đệm để nét 3px không bị cắt), bỏ nền trắng, ghi ra
  `src/lib/graphics.ts` (**112 icon**, 13 nhóm, ~115KB).
- Danh sách id/tên/keyword nằm ngay trong script theo đúng thứ tự đọc — thêm
  icon mới chỉ cần thêm một dòng rồi chạy lại.
- Mỗi SVG chỉ có 2 path, không chữ/không `<rect>`/không ảnh ngoài; nét giữ
  `#22333B` để thay màu lúc render.

**Registry — `src/lib/slideGraphics.ts`:**

- `isGraphicId`, `graphicById`, `searchGraphics` (bỏ dấu tiếng Việt, khớp
  name/keyword/id), `graphicMarkup(id, ink)` (đổi màu nét + ép `width/height
  100%`, `preserveAspectRatio`), `graphicCatalogText()` (112 id + tên ngắn, gom
  nhóm ≈ 2,5K ký tự).

**Model & render:**

- `SlideElType` thêm `'graphic'`; `SlideElement.graphicId?` (optional — deck cũ
  không đổi). Renderer editor/thumbnail/presenter dùng `dangerouslySetInnerHTML`
  với SVG do app sinh (không phải input người dùng).
- Màu nét theo ngữ cảnh: bìa/bullets dùng `p.onAccent` (nằm trên panel màu),
  layout ảnh dùng `p.fg`. Khối fill pastel giữ nguyên như thiết kế.
- Xuất PPTX: SVG → `data:image/svg+xml;base64` qua `slide.addImage` (cùng đường
  với icon Phosphor).

**Layout & AI:**

- `SlideLayoutContent.graphic?`; `composeTitle` đặt graphic vào panel bìa,
  `composeBullets` thay icon neo, `composeImageSide` dùng graphic + panel thay
  khung ảnh trống. `contentFromSlide` đọc lại được khi đổi layout.
- `AiSlidePayload.graphic?`; `sanitizeSlide` chỉ nhận id có trong catalog (id lạ
  bị bỏ, không lỗi); `pageSystemPrompt` chỉ nhồi catalog cho 4 layout dùng được
  (`title`, `bullets`, `image-left`, `image-right`) để không phình mọi lượt gọi.
  Layout ảnh được dặn: có graphic khớp thì để trống `image` → **không gọi vẽ ảnh
  (55–90s)**.
- `applyAiSlide` chỉ sinh ảnh khi thiếu cả `image` lẫn `graphic`.

**Kiểm chứng:**

- `test:slide-graphics` mới, **19 nhóm**: registry 112 id duy nhất · SVG hợp lệ
  (2 path, không chữ/nền/ảnh ngoài) · search có dấu/không dấu · recolor ·
  catalog đủ id · title/bullets/image-left dùng graphic · id lạ bị bỏ ·
  `contentFromSlide` đọc lại · prompt có/không catalog đúng layout · 19 layout
  vẫn dựng được.
- Gọi AI thật 2 lượt: layout `title` chọn `math-tam-giac` (6s); layout
  `image-right` chọn `math-tam-giac` và để trống `image` (9s) → không sinh ảnh.
- Kiểm tra DOM thật: deck 5 slide (bìa/bullets/ảnh trái), graphic render đúng
  hộp (bìa 16×24% trong panel, bullets 11×14%, ảnh trái 30×28%), không còn khung
  "Chọn ảnh".
- Toàn bộ suite slide xanh, export 5/5, layout 7/7, `tsc` sạch, build thành công
  (bundle chính +~100KB do SVG inline).

**Chưa làm:** gallery chèn đồ hoạ thủ công trong ribbon (hiện chỉ AI/layout
dùng), và graphic cho các layout khác ngoài 4 layout trên.

### 3.51. Gói P0 — đo chữ thật, xếp chồng theo chiều cao đo, lint render (27/10/2026)

Sau audit "AI sinh slide vỡ layout": gốc là tọa độ cố định + đo chữ bằng đếm ký tự.

- **`slideMeasure.ts`:** `textBoxHeight(text, w, size, lineHeight, {weight, letterSpacing})`
  ngắt dòng bằng `canvas.measureText` với Be Vietnam Pro (cache theo weight+chuỗi,
  xoá cache khi font nạp xong). Node/test không có canvas → rơi về công thức ký tự
  cũ. `ensureMeasureFonts()` nạp trước 4 độ đậm. Sửa luôn mô hình padding ngang:
  `padding: 1%` là % của **khung slide**, nên chiều rộng chữ = `w − 2cqw` (trước đây
  `w × 0.98` → hộp hẹp tràn).
- **`slideLayouts.ts`:** `titleEls()` chọn cỡ tiêu đề lớn nhất vừa hộp (cho 2 dòng
  thay vì co sàn), hộp ôm đúng chữ, vạch `title-rule` đặt ngay dưới chữ; dùng cho
  10 layout. `bullets` tính vùng nội dung dưới tiêu đề đã đo; `section` xếp
  kicker → title theo chiều cao đo; `cycle` đặt chữ trong hình chữ nhật nội tiếp
  của vòng tròn (budget bước 60 → 36 ký tự, `slideAi.ts`). `textEl` đo đúng độ
  đậm renderer (title 600 / body 500) và nới hộp canh-trên quá thấp cho một dòng
  (kicker không còn bị co xuống 1,2cqw).
- **`npm run lint:slides`** (`scripts/lint-slides.mjs` + `scripts/lint-slides/`):
  dựng 950 slide (10 theme × 19 layout × stress/medium/demo × 3 tông) bằng
  `SlideThumb` thật trong Chrome headless (CDP, ~10s), đo DOM: tràn, đè
  chữ/vạch/icon, ngoài khung (error → exit 1); chữ < 1,3cqw, tương phản (warn).
  Trước khi sửa: **115 overflow + 30 overlap**; sau: **0 error**. Còn 716 warn
  (tương phản `stats` label/`quiz` option-1, số thứ tự timeline 1cqw) — việc P1.
- Ghi chú: font serif của vài theme hẹp hơn Be Vietnam Pro nên đo dư (an toàn).

### 3.52. Gói P1 — palette OKLCH, panel nhạt, ép nhịp deck (27/10/2026)

- **Theme 10 → 6** (`slideTheme.ts`): mỗi theme một hue, dựng bằng `oklch()` +
  `palette(hue)` (nền gần trắng/đen ngả hue, **một** accent, màu phụ lệch 150°;
  accent đủ đậm để chữ trên accent ≥ 4,5:1). Giữ `sang`, `dem-xanh`, `giay-am`,
  `rung`, `tim`, `do`; môn học gộp vào `tags`. Bỏ hoạ tiết ồn (confetti/waves/
  grid/dots) — CSS vẫn giữ cho deck cũ. Id cũ (`khoa-hoc`, `van-su-dia`,
  `sinh-hoc`, `ngoai-ngu-tin`) tra qua `resolveThemeId` nên dàn ý/deck cũ chạy.
- **Panel nhạt hơn** (`paletteOf`): pha accent 0,12–0,14 thay vì 0,22–0,24; nền
  tông `accent` 0,07. `muted`/`ink` được lùi về phía mực tới khi ≥ 4,5:1 trên
  **cả** nền slide lẫn panel (`legible`).
- **Ép nhịp bằng code** (`enforceRhythm` trong `aiDeck.ts`, gọi trong
  `parseDeckPlan`): không hai layout liền kề trùng nhau, `bullets` ≤ 40% deck ≥ 6
  slide; đổi sang layout cùng "họ" nội dung, giữ slide đầu/cuối.
- **Layout:** agenda xếp kicker → title theo chiều cao đo; `bullets` tiêu đề lớn
  hơn khi không có kicker, panel ôm nội dung (không còn khoảng trống dưới);
  `textEl` nới hộp một dòng cho cả hộp có `align`.
- **Lint:** 716 → 54 cảnh báo, 0 error; còn lại là bước `cycle` dài hơn budget
  36 ký tự trong nội dung stress (luồng AI thật bị repair chặn). Backdrop của ô
  chữ có `fill` (đáp án quiz) tính theo fill.
- **Chưa làm:** hero panel bìa/section vẫn là khối accent đặc lớn (diện tích >
  10%); giảm tiếp là quyết định thẩm mỹ cần xem bằng mắt.

### 3.53. Đo thật + giai đoạn 1: parse bền, gói theo môn (27/10/2026)

- **Eval bằng LLM thật:** `npm run eval:slides -- "chủ đề" ... [--out dir]` chạy
  đúng pipeline (dàn ý → từng slide + repair → layout) trong Chrome headless
  (CDP, `scripts/lib/cdp.mjs` dùng chung với `lint:slides`) và chụp ảnh lưới
  slide; `eval-out/` đã gitignore. Dùng để xem bằng mắt sau mỗi đợt sửa.
- **A–C (e9c7674):** `checkSlide` trả thêm `readability` — dựng thử layout, hộp
  chữ co < 78% cỡ thiết kế và < 1,9cqw bị báo để repair (còn lỗi mềm sau repair
  vẫn giữ slide); chỉnh timeline/comparison/thẻ 4 ô/phụ đề/quiz; `pickSlideAsset`
  không còn icon sách mặc định, dedupe theo slide (`used` set).
- **Parse bền** (`aiDeck.ts`): `repairJson` cứu dấu phẩy thừa, xuống dòng trần
  trong chuỗi, phản hồi cụt (đóng chuỗi + ngoặc); `jsonCandidates` thử bản sửa;
  `AiPanel` có đúng một lượt retry khi dàn ý vẫn không parse được (lỗi quan sát
  được: ~1/4 lần dàn ý Chí Phèo trả JSON hỏng; 3 lần chạy lại đều ổn).
- **Gói theo môn** (`slideSubjects.ts`): `SUBJECT_PACKS` (toán, văn, sử-địa,
  ngoại ngữ, tin, khtn, khác) khai báo `structure` (cấu trúc bài), `layouts` ưu
  tiên, `rules` nội dung, `themeHint`. Dàn ý có field `subject` (model chọn, thiếu
  thì `inferSubject` suy từ tiêu đề/đối tượng); prompt dàn ý có catalog môn,
  prompt từng slide chèn `subjectRulesBlock`. Thêm môn = thêm một mục mảng.
- **Còn lại:** lõi dùng chung giai đoạn 2 (công thức KaTeX, layout ví dụ mẫu,
  mở bài, quiz có đáp án, chart); dùng kho 112 đồ hoạ cho cards/stats (hiện chỉ
  title/bullets/image-left/right); mở rộng kho minh hoạ cho tin, ngoại ngữ, địa.

### 3.54. Giai đoạn 2 — công thức KaTeX, ví dụ mẫu, mở bài, quiz có đáp án (27/10/2026)

- **Công thức `$...$` trong chữ slide** (`lib/slideMath.ts`, thuần chuỗi, test được
  ở Node): `hasMath`, `latexToPlain`/`mathToPlain` (LaTeX → Unicode gần đúng),
  `fixMathEscapes`. Vẽ bằng `renderMath` (KaTeX + `mhchem` cho `\ce{...}`):
  thumbnail/trình chiếu qua `FitText html=...`, editor hiện công thức khi không gõ
  và nhấp đúp để sửa mã (`AutoFitText`). Đo chữ (`textBoxHeight`) và ngân sách
  ký tự tính theo chữ Unicode tương đương, xuất PPTX dùng `mathToPlain` (công
  thức thành chữ Unicode, **không** thành ảnh — giới hạn đã biết).
- **JSON và gạch chéo:** `JSON.parse` nuốt `\frac`→form-feed, `\times`→tab…;
  `fixMathEscapes` khôi phục trong đoạn `$...$` (sanitize), `repairJson` nhân đôi
  gạch chéo không hợp lệ (`\cdot`, `\(`); prompt dặn model viết `\\frac`.
- **Layout mới (tổng 21):** `example` (đề bài trái, 2–4 bước đánh số phải, thanh
  kết luận; fields `problem/steps/conclusion`), `hook` (bong bóng thoại + 2–3
  pill gợi ý, đuôi lật `flipY`); `quiz` có thanh "Đáp án: C — giải thích"
  (`explanation`, id `answer`), `contentFromSlide` đọc ngược đáp án thành chỉ số.
- Gói môn tham chiếu `hook`/`example` trong cấu trúc + layout ưu tiên; gói Toán/
  KHTN dặn dùng LaTeX cho phân số/phương trình hoá học.
- Test: `test:slide-math` mới, test layout round-trip example/hook/quiz; lint
  630 slide, 0 error (warn còn lại: cycle/pill hook ở nội dung stress).
- **Sửa tương phản đồ hoạ 112 icon:** icon có nét `#22333B` + mảng pastel; đổi nét
  thành trắng/sáng trên panel accent hoặc nền tối làm nét lẫn vào pastel (quả cân
  trắng trên nền xanh đậm). Giờ `graphicPlate()` đặt đồ hoạ trên **tấm nền sáng cố
  định** (`GRAPHIC_PLATE #f7f9fc`) với đúng nét gốc — bìa, bullets, image-left/right,
  hook; đã kiểm chứng trên cả 6 theme gồm nền tối và theme Đỏ poster.
- **Lỗi KaTeX trong hộp canh giữa:** hộp chữ `valign: middle` là flex-column nên
  "Vậy" và `.katex` thành hai hàng riêng → bọc HTML công thức trong một khối con.
  Phân số dùng `\tfrac` khi vẽ slide; `textBoxHeight` cộng 0,6 dòng cho mỗi công
  thức cao (`tallMathCount`). Ô bảng có `$...$` cũng vẽ KaTeX (`MathCell`).

### 3.55. Chấm điểm bằng model thị giác + sửa theo góp ý người dùng (27/10/2026)

- **Công cụ:** `node scripts/judge-slides.mjs <thư-mục-ảnh>` chấm ảnh slide bằng
  `LLM_MODEL` (deepseek-v4.1-flash nhận ảnh) theo 6 tiêu chí (layout, typography,
  color, hierarchy, imagery, polish); `eval:slides --slides` lưu mỗi slide một
  ảnh 2×. Gateway opencode đòi header `x-opencode-session`.
- **Lần chấm 1** (6 deck, 59 slide): model **6,6/10**; deck mẫu người dùng gửi
  (Ước Chung Lớn Nhất) **6,4** (6,8 nếu bỏ slide gần trống). Điểm yếu: hình ảnh 4,4.
  **Người dùng tự chấm** 6 deck: 6,8 / 6,8 / 6,8 / 6,8 / 7 / 7 (TB 6,87) — gần điểm
  model (6,5–7,0), model khắt khe hơn ~0,3 → dùng làm thước tương đối.
- **Góp ý người dùng → sửa:** (1) bìa: khối panel cao nửa trống + sticker không đẹp →
  huy hiệu tròn (`hero-panel` ellipse + đĩa sáng + hình); (2) thẻ 2×2 sát mép dưới
  (đáy 99,5%) → vùng thẻ kết thúc ở y=93, lint thêm luật `edge` (đáy/phải > 96%);
  thẻ không có "nhãn:" dùng cả bề rộng bên phải badge, chữ lớn hơn; (3) two-column
  khó nhìn → `splitLabel`: "Bước 1: …" thành nhãn đậm màu nhấn + mô tả, dùng chung
  một cỡ chữ cho hai cột, `contentFromSlide` đọc lại `left-N`/`right-N`;
  (4) phân số KaTeX nhỏ do `.katex {1.03em}` toàn cục của app → `slide.css` đặt
  `.slide-frame .katex 1.2em`, `.mfrac 1.15em`.

### 3.56. Icon bổ sung, ảnh AI nền, canh giữa trong editor (27/10/2026)

- **Kho đồ hoạ 112 → 232:** nhập thêm "100 icon giáo dục bổ sung" (cs, eng, geo, his,
  lit, bio, chem, phys, math, art, pe, life) và "20 ngôn ngữ lập trình" (prog).
  Sheet không có nhãn nên tên/keyword đặt theo hình thật (`scripts/graphics-extra.mjs`);
  `import-graphics.mjs` đọc 3 sheet và báo id trùng. Prompt từng slide chỉ gửi các
  nhóm hợp với môn (`SubjectPack.graphicGroups` → `graphicCatalogText(groups)`).
- **Ảnh AI (Xkiro `sensenova/sensenova-u1.5-lite`, mặc định của `imageProxy`):** ~45–90s
  mỗi ảnh, đôi khi quá 150s → lỗi thì giữ đồ hoạ. Slide hiện NGAY, ảnh sinh nền
  (`queueImage`, tối đa 2 song song) rồi `withImage()` dựng lại slide: bìa có ảnh cắt
  tròn trong vòng accent (`hero-image`, `shape: 'ellipse'`), layout ảnh thay graphic
  bằng ảnh. `eval:slides --images` chạy đúng luồng này để xem.
- **Canh giữa dọc trong editor:** `AutoFitText` dùng `<textarea>` nên không có valign →
  chữ/số dính đỉnh khung (bong bóng `hook`, số trong vòng tròn của `example`) dù
  thumbnail đúng. Giờ textarea cao đúng nội dung, hộp bọc flex căn giữa; chế độ xem
  công thức cũng căn giữa. Đã chụp editor thật để kiểm.
- **Sự cố công cụ:** helper ghi file kiểu `open(p,'wb').write(f(s))` mở file TRƯỚC khi
  `f` chạy → assert lỗi làm file rỗng (mất `slideAi.ts`, khôi phục bằng git). Luôn
  tính xong rồi mới mở để ghi.

### 3.57. Asset trang trí `ornament` từ B.svg (27/10/2026)

- **Nhập:** `scripts/import-decor.mjs` (gọi từ `import-graphics.mjs`; `bboxOf` tách ra `scripts/lib/svg-bbox.mjs`) đọc
  `Downloads/B.svg` (78 item, không nhãn → id/tên/keyword đặt theo thứ tự đọc trong `ICONS_DECOR`). Item gom theo ô lưới
  (cột = cx/360, hàng = cụm cy), item trong `<g clip-path>` lấy hộp cắt làm viewBox. Thêm `orn-ke-song-ngan`/`orn-ke-zigzag-ngan`
  (64 đơn vị) vì đường kẻ 256 đơn vị thu nhỏ còn ~10% slide thì nét 3 đơn vị chỉ còn sợi tóc.
- **Registry:** category mới `ornament` nằm chung `graphics.ts` (310+2 mục) nhưng KHÔNG vào `SLIDE_GRAPHICS`/`GRAPHIC_IDS`/
  catalog/`searchGraphics` (AI chỉ chọn 232 icon); tra qua `graphicById`. Renderer bỏ đệm 1–2% cho ornament (đệm làm
  vạch mảnh co thành hairline).
- **Layout:** helper `ornament()` (`slideLayouts.ts`) đặt theo bề rộng, chiều cao suy từ tỉ lệ thật trên khung 16:9.
  `title-rule`/`section-rule` → vạch lượn ngắn; statement → nhánh hoa + cánh hoa rơi; closing → cành lá + bó hoa;
  bỏ ngoặc kép ở statement (quote vẫn giữ). Sửa (b)(c)(d) ở mục BÀN GIAO.
- **Chưa dùng:** khung (bo tròn/vát/ảnh/tem), thẻ kẹp giấy/băng keo, thẻ số 1–5, blob/vòm/sóng đồi, ruy-băng, họa tiết nền lát,
  góc ngoặc. Khung/blob cần co giãn: ornament chỉ scale đều (`meet`), nên phải chọn bản vuông/ngang theo tỉ lệ hộp.
- **Kiểm chứng:** `tsc` sạch, test `slide-graphics` 21 nhóm (thêm test ornament), layout/measure/ai/theme xanh, lint 0 error
  (90 warn cũ), build ok; chụp ảnh preview 6 layout × 2 theme bằng trang tạm (đã xoá).

### 3.58. Thẻ số, icon theo nghĩa, ảnh, vòng chấm bằng mắt (28/10/2026)

- **Điểm:** baseline 6 deck (ƯCLN, Chí Phèo, Quang hợp, Điện Biên Phủ, Thì HTHT, Python for; không ảnh) **6,7**; sau đợt này
  **6,8** (hình ảnh 4,7→5,0); sinh ảnh AI thật 6,7 (hình ảnh 4,8). Slide bìa có ảnh 7,3 so 6,4.
- **Thẻ số:** `numberTag()` (`slideLayouts.ts`) dùng `orn-the-so-1..5` cho `timeline` (≤5 bước) và `example` (≤4 bước, hàng ≥12%);
  chỉ khi nền đủ sáng cho nét `GRAPHIC_INK` (pastel + nét tối cố định), nền tối giữ chấm/badge cũ. `cycle` thêm badge số trên node.
- **Icon:** `pageSystemPrompt` đưa gợi ý `searchGraphics(title+brief)`, dặn chọn theo nghĩa nội dung và bỏ trống nếu không khớp;
  `hook` cũng được chọn đồ hoạ. Chưa đo lại lỗi "cái cân cho ƯCLN".
- **Ảnh:** hạn server 150s→240s (`imageProxy.ts`); `applyAiSlide` thử lại một lần.
- **Vòng chấm bằng mắt:** `polishSlide()` (`AiPanel.tsx`) viết lại slide theo lời chê của giám khảo. `eval:slides -- ... --slides --polish`
  chấm từng slide, viết lại slide <6,5, chỉ giữ bản điểm cao hơn (ví dụ 5,5→7,4). `judge()` export từ `judge-slides.mjs`;
  `eval-slides/main.tsx` có `window.__polish/__rects`. Chỉ chạy được khi không slide nào lỗi (`failed` rỗng).
- **statement dồn chữ:** ngân sách `body` 160→100 ký tự (tổng 160), note prompt "một câu ngắn ≤90", chữ >90 ký tự hạ cỡ 4,6→3,7cqw.
- Kiểm chứng: `tsc` sạch, test slide-ai/layout/measure/graphics/assets xanh, lint 630 slide 0 error (90 warn cũ).

### 3.59. Chữ đậm `**` + chế độ HTML thành slide trong deck (28/10/2026)

- **In đậm:** `**từ khoá**` trong chữ slide (`slideMath.ts`: `hasBold/hasRich/stripBold/limitBold/boldRuns`). Renderer đổi thành `<strong>`
  (`slideMathHtml`), đo chữ/ngân sách dùng chữ đã bỏ `**` (`mathToPlain`), PPTX xuất thành run đậm. `clean()` trong `slideAi.ts` giữ tối đa
  2 cụm × 6 từ mỗi chuỗi; prompt dặn nhấn 1–2 cụm/ý, không dùng trong tiêu đề/công thức.
- **Slide HTML trong deck:** `Slide.html` (tài liệu HTML đầy đủ của một slide) + `Deck.format = 'html'`. AI vẫn sinh MỘT tệp HTML nhiều
  `<section class="slide">`; `splitHtmlDeck()` (`lib/htmlDeck.ts`, cần DOM) tách thành từng slide độc lập (bỏ thanh tiến trình/số trang chung,
  ép hiện ngay). `HtmlSlideFrame` (`examEditor/HtmlSlide.tsx`) = iframe sandbox 1280×720 thu phóng theo khung: dùng cho thumbnail, sân soạn, trình chiếu.
- **Chính sách:** bài giảng HTML **chỉ trình chiếu trên web** — không sửa bằng trình soạn, không xuất PPT (`exportDeckPptx` ném lỗi),
  không có tải `.html`. Ribbon thay bằng `HtmlDeckBar` (Lưu + Trình chiếu); ẩn Thêm slide/Nhân bản. Bấm tab HTML trong AI panel hiện modal lưu ý
  (không sửa được, không xuất PPT, thay toàn bộ slide hiện có — hoàn tác bằng Ctrl+Z). Dựng PPT mới trên deck HTML thì bỏ slide HTML (`appendAiSlides`).
- Trình chiếu có ←/→/Space/PageUp/PageDown, Esc thoát. Kiểm chứng trên trình duyệt thật: sinh 5 slide, thumbnail, trình chiếu, lưu/mở lại, chặn xuất.
  **Chưa kiểm:** nhánh "dựng PPT sau khi có deck HTML"; slide HTML do AI lỗi JS/CSS lạ.

### 3.60. Hỏi ghi đè khi duyệt dàn ý + AI sửa slide có sẵn bằng lệnh (28/10/2026)

- **Ghi đè hay nối tiếp:** deck đã có nội dung (`hasContent` trong `SlideEditor`: slide HTML, có layout hoặc >1 phần tử) thì bấm "Tạo slide" mở hộp
  Ghi đè / Nối tiếp / Huỷ (`overwriteAsk` trong `AiPanel`). Ghi đè gọi `clearSlides` (hoàn tác được); deck chỉ có slide mặc định chưa đụng tới thì không hỏi.
- **Lệnh sửa slide (`lib/slideEdit.ts`):** model KHÔNG viết lại slide, chỉ trả `{"action":"edit","commands":[...]}`; engine kiểm tra rồi dựng lại bằng
  layout engine. 7 lệnh: `set_theme`, `set_fonts` (whitelist 8 phông có dấu VN, không Georgia/Cambria), `set_colors` (hex + tương phản ≥4,5:1),
  `set_tone`, `set_transition`, `delete_slides` (không xoá hết), `move_slide`. `applyEdits` thuần (test được); lệnh lỗi bị bỏ kèm lý do, phần còn lại vẫn chạy.
  `set_theme` giữ phông đã đặt riêng. Deck HTML chỉ nhận xoá/dời. `recomposeSlide` dùng chung với `applyTheme` của ribbon.
- **Luồng:** `looksLikeEdit(text)` (regex rẻ) + deck có slide → một lượt gọi model với `editSystemPrompt` (có danh sách theme/phông/slide hiện tại);
  trả `{"action":"none"}` thì rơi xuống luồng soạn bình thường. Kết quả báo lại từng dòng; ghi vào lịch sử nên Ctrl+Z hoàn tác.
  Kiểm chứng thật: "đổi phông tiêu đề sang Times New Roman, bộ màu tím, xoá slide 4" → 3 lệnh chạy, deck còn 3 slide màu tím. Test: `npm run test:slide-edit`.
- **Sửa nội dung/bố cục MỘT slide (cùng ngày):** thêm `edit_slide` (`{slide, fields}` — CHỈ field nêu mới đổi, field khác giữ nguyên; field danh sách gửi
  trọn bộ; ảnh/đồ hoạ không cho AI đụng; qua `checkSlide` nên bị chặn nếu thiếu field bắt buộc/vượt ngân sách) và `set_layout` (đổi bố cục, giữ nội dung;
  `adaptContent` lấy danh sách ý cho items/steps/left/right; không đủ nội dung — ví dụ timeline cần ≥3 bước — thì bỏ kèm lý do). `describeSlide` đưa
  nội dung hiện tại từng slide vào prompt để model biết đang sửa gì. Kiểm chứng thật: "Sửa tiêu đề slide 1…" chỉ đổi tiêu đề (nhãn/phụ đề/slide khác giữ nguyên);
  "Đổi bố cục slide 3 sang mốc thời gian" cycle→timeline.
- **Chưa làm:** đổi cỡ chữ, thêm/chèn slide mới tại vị trí bất kỳ bằng lệnh, sơ đồ tư duy (`mindmap` — AI trả cây dữ liệu, engine bố trí và vẽ SVG).

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
7. **Không bao giờ sửa DOM do ProseMirror quản lý từ bên ngoài.** Ghi inline
   style/toggle class trên node của editor khiến PM đọc lại DOM và map lại
   selection → con trỏ nhảy, block reflow loạn. Muốn đổi cách hiển thị theo dữ
   liệu đo được thì dùng **decoration** (PM tự quản class) và đo trên bản clone
   ngoài editor.
8. **`data-exam-node` phải trùng tên node** (`examHeader`, `examQuestion`, …).
   CSS và `choiceLayout` bám theo giá trị này; lệch tên thì CSS "sống" mà không
   có tác dụng và rất khó thấy vì không có lỗi nào được báo.

---

## 6. ⚠️ CHƯA LÀM XONG (việc còn tồn đọng)

Phần này là danh sách công việc **còn dở** tại thời điểm ghi file. Xếp theo mức độ
quan trọng.

### 6.1. Còn cần kiểm chứng (không phải viết mới)

Xem mục **3.15** cho lần kiểm chứng trình duyệt đầy đủ ở chặng 5.

- [x] **Hoàn tác/Làm lại** — đã có nút trên ribbon, dùng lịch sử TipTap (3.17).
- [x] **Áp kết quả AI** (`handleAiResult`) — đã chạy thật, mục cũ ghi "chưa" là sai.
- [ ] **Mục lục / tìm kiếm ở nav panel nhảy đúng khối** (`handleGoToBlock`) —
      code có vẻ đúng, chỉ còn thiếu một lần test thao tác nhảy.
- [x] **Kiểm tra trực quan chặng 13–15** — đã làm ở chặng 17 (3.28): phát hiện
      lệch `data-exam-node` khiến CSS block chưa từng chạy, đã sửa; đầu đề
      2 cột + choice layout 4/2/1 cột đã kiểm chứng trên trình duyệt thật.
      Còn lại: xuất Word sau các thay đổi (mới chạy test tự động, chưa mở file).

### 6.1b. Đợt còn lại của bộ block soandethi (tiếp tục từ chặng 15)

Người dùng chốt: **lấy hết** các block trong đề mẫu của soandethi, làm dần từng
đợt (mỗi đợt = 1 chặng, có kiểm chứng). Xem ghi chú audit ở mục 3.26.

- [ ] **Đợt 2 — Bảng biến thiên** (`variationTable`): dữ liệu gốc của họ là
      `{points[], intervals[], caption, width, yHeight, showDerivative}` trong
      một node atom; họ có cả `analyzeVariation(expression)` sinh bảng từ hàm
      số — phiên mình làm atom + dữ liệu tay trước, phân tích hàm để sau.
- [ ] **Đợt 3 — Biểu đồ thống kê** (`statChart`): atom + data JSON; có thể tái
      dùng logic vẽ bar/line/pie của `ChartView` bên slide.
- [ ] **Đợt 4 — Đồ thị hàm số** (`functionGraph`): cần parser biểu thức + vẽ
      SVG lấy mẫu; nặng nhất.
- [ ] **Đợt 5 — Hình học / vector** (`geometryDiagram`, `vectorDiagram`) và
      `docColumns` (toàn văn 2 cột), mark `boxed` nút ribbon.
- [ ] **Nợ của chặng 15:** nút ribbon bật/tắt `boxed`; lưu định dạng cấp đoạn
      (căn lề) cho từng dòng trong cột đầu đề — cần mở rộng `HeaderBlock`.
- Sau đợt block: quay lại **hợp đồng AI** — đã làm một phần ở chặng 17 (3.28):
      một lượt gọi với `action: replace|append|patch` + digest tài liệu kèm id.
      Còn: plan 2 bước + verificationToken, stream SSE ghi thẳng vào editor,
      OCR/đọc nội dung tệp đính kèm; sau đó là slide command registry.

### 6.2. Hạn chế đã biết — cố ý để nguyên

- [x] **Bảng đáp án mất dữ liệu khi round-trip** — đã sửa (xem mục 3.9): duyệt đúng
      cấp bảng `table > tableRow > cell`, bỏ ô nhãn cột nhưng vẫn đọc ô dữ liệu.
- [x] **Header trái/phải không ghép lại** — đã sửa (xem mục 3.9): gộp theo attr `side`.
- [x] **Mất `formatAttrs` khi round-trip** — đã sửa (xem mục 3.9): giữ attrs cấu
      hình ở node/mark.
- [x] **Phân trang trên màn hình** — 25/10 (3.29): khối không đủ chỗ được đẩy
      sang đầu trang sau bằng spacer (widget decoration), không còn chữ rơi ra
      nền xám. **Còn giới hạn:** khối cao hơn một trang vẫn tràn; cắt bên trong
      khối (bảng dài, lặp header) là cơ chế slicing của soandethi — chưa làm vì
      đụng nguyên tắc "một editor liên tục". In/xuất Word vẫn do trình duyệt /
      Word phân trang.

### 6.3. Không làm — quyết định YAGNI (23/10/2026)

Đã đối chiếu code và chốt không port thêm các mục sau. Ghi lại để phiên sau
không mất thời gian làm lại.

- **Watermark, Page Number, Table Layout, nút/menu File, toggle AutoSave,
  Styles Pane** — AutoSave đã chạy tự động (`saveTab`/`saveAll` khi đóng tab,
  pagehide); gallery kiểu + Styles Pane đã có từ chặng 1/5; watermark và số
  trang không có chỗ trong model đề thi.
- **Dark theme** — không ai yêu cầu, và phải làm lại toàn bộ token.
- **Rail icon Genspark, pill "Track changes"** — track changes không có model dữ
  liệu; dựng UI giả còn tệ hơn không có.
- **Nhóm Styles/Borders/Shading "còn thiếu"** — thực tế đã có (nhóm Kiểu +
  split button viền/tô sáng trong Đoạn văn). Dòng cũ trong context là sai.
- **Auto-fit bị gutter** — không phải lỗi: `clientWidth` đã trừ scrollbar dọc,
  scrollbar ngang chỉ ảnh hưởng chiều cao.
- Còn lại (hover/active tinh chỉnh theo pixel) là việc thẩm mỹ vô hạn, không có
  tiêu chí "xong" — bỏ.

### 6.4. Lỗi nhỏ còn theo dõi

- [x] Status bar hiện "Đã lưu" **hai lần** (một ở cột trái, một ở cột phải) — đã
      bỏ bản ở cột phải, chỉ còn cột trái + nhóm zoom ở cột phải.
- [x] `setLineHeight` không tồn tại trong tiptap → đã đăng ký extension
      `LineHeight` của `@tiptap/extension-text-style/line-height` (xem mục 4.9).
- [x] Dropdown "Giãn dòng" đọc `format.lineHeight` (từ `useFormatState`) — đã
      đúng, không còn `defaultValue` cứng. Đã kiểm chứng: chọn "2,0" → span
      `style="line-height: 2"`.
- [x] Số trang sai sau khi đổi hướng/lề — `measure` giữ `CONTENT_H` cũ trong
      closure; đã thêm dep (3.17).
- [ ] Số trang trong status bar đếm `.doc-paper` trong DOM → chậm hơn 1 nhịp so
      với `pageCount` thật của `ExamEditor`. Sửa rẻ nhưng giá trị thấp.
- [ ] **Hiệu năng gõ phím** (chưa đo): mỗi phím gõ làm `ComposeDoc` re-render
      toàn trang (destructure cả store) và `ExamEditor` `JSON.stringify` hai lần
      để so sánh. Đáng đo với đề dài trước khi sửa; hướng sửa: selector zustand
      thay vì lấy cả state, và so sánh bằng ref thay vì stringify.

### 6.5. Việc khác

- [ ] Bundle chính **1,146 MB** (gzip 338 kB), vượt ngưỡng Vite 500 kB. Cách rẻ:
      `React.lazy` cho route (`/soan-de` và các trang phụ) + `Suspense` — khoảng
      6 dòng, chủ yếu để landing không tải cả TipTap. Chưa làm vì chưa phải lỗi.
- [x] `_ref/genoffice/` — đã nằm trong `.gitignore`, **0 file được track**; giữ
      làm tài liệu tham chiếu, không cần chuyển đi.
- [x] Test cho converter (`tipTapToBlocks` ⇄ `blocksToTipTap`) — `scripts/test-convert.mjs`,
      `npm run test:convert`, hiện **12/12 pass** (mục 3.30 thêm case mảng trộn string + span).
- [x] `_ref/_shell_extract*.txt` — đã xoá.
- [x] Chạy ponytail-audit, xóa code chết + dependency thừa (xem mục 3.8, 3.17).
- [x] Update lại chính file `context.md` này sau mỗi chặng — mục 6 đã được rà và
      viết lại ngày 23/10 (chặng 7).

### 6.6. Thay đổi chặng 7 (23/10/2026)

Trạng thái git lúc rà: **sạch**, chặng 6 đã vào commit `5c92e66`
(`feat: rebuild slide editor ribbon, unify docs in Start tab`). Chặng 7 chưa commit:

| File | Nội dung |
|---|---|
| `src/examEditor/Ribbon.tsx` | nút Hoàn tác/Làm lại ở cụm quick phải, trạng thái theo `editor.can()` + listener `transaction` |
| `src/store/compose.ts` | xoá `History`/`histories`/`undo`/`redo`/`pushHistory` — chỉ còn một sổ hoàn tác của TipTap |
| `src/pages/ComposeDoc.tsx` | `setContent(activeId, doc)` không còn option lịch sử |
| `src/examEditor/ExamEditor.tsx` | `measure` thêm `CONTENT_H` vào deps (sửa số trang sai khi đổi khổ) |
| `src/components/AIAssistantIcon.tsx` | **xoá** — code chết |
| `src/assets/ai-assistant.json`, `.svg` | **giữ** — asset người dùng cung cấp; `.svg` dùng cho animation suy luận (3.19) |
| `package.json`, `package-lock.json` | gỡ `lottie-react` |

**Chặng 8 (mục 3.18) — API thật:**

| File | Nội dung |
|---|---|
| `server/llmProxy.ts` | cấu hình qua env; header `x-opencode-session` + `User-Agent`; kiểm tra URL (chặn host nội bộ); `llmMiddleware` cho Vite; sửa path traversal ở serve static |
| `vite.config.ts` | plugin `llm-proxy` mount `/api/llm`; `loadEnv` → `process.env`; `optimizeDeps.entries` |
| `tsconfig.node.json` | thêm `server` vào include để proxy được typecheck |
| `.env` | **tạo cục bộ, bị gitignore** — người dùng điền `LLM_API_KEY` |
| `.env.example` | **mới** — mẫu cấu hình, được commit |
| `package.json`, `package-lock.json` | gỡ `yaml` (không còn đọc config.yaml) |

**Chặng 9–15 cũng chưa commit** (chi tiết từng chặng ở mục 3.19–3.25). Tóm tắt
working tree tính đến cuối phiên 23/10: animation suy luận (SVG), markdown +
typing cho chat AI, SCOPE_RULE, sửa slide (container-type, kéo thumbnail đổi
thứ tự, 8 tay nắm resize + xoay, icon AI), lớp trình bày block + export Word
(đánh số tuần tự, bảng phương án), choice layout đo cột, block `grid`, đầu đề
hai cột mới + mark `boxed`. Danh sách file chính xác: xem `git status`.
Khuyến nghị phiên sau: **commit lại trước khi làm tiếp** để mỗi chặng là một
commit như thói quen.

### 6.7. Trạng thái cuối phiên 23/10 (buổi chiều)

- Dev server 5184 **đã tắt** (task nền bị đóng khi kết thúc lượt). Chạy lại:
  `npm run dev -- --port 5184 --host 127.0.0.1`.
- Mọi test đều xanh lúc dừng: `tsc` sạch, build thành công, convert 9/9,
  markdown 14/14, export 5/5, layout 7/7.
- Việc tiếp theo theo ý chủ dự án: đợt 2 (bảng biến thiên) — xem 6.1b.

### 6.8. Lộ trình bắt kịp workflow AI slide soandethi (sau audit 3.36, 25/10/2026)

Hiện trạng ước **~72%** so với workflow của họ (cách chấm ở 3.36 + báo cáo
`_ref/soandethi/SLIDE-GAP-AUDIT.md`, đã cộng chặng
21–27a + chặng 1–2 ngày 27/10). Điểm mạnh hiện có:
trình soạn slide freeform (kéo/resize/xoay, auto-fit chữ, undo, thumbnail),
theme v2 10 màu + font + decor, layout engine **19 bố cục** + tone + 5 bố cục
art-directed, typography engine đo trước khi đặt, **kho 112 đồ hoạ vector**,
pipeline AI **dàn ý → duyệt → sinh từng trang → validate/repair → chèn dần**,
ngân sách chữ chống slide dày, xuất PPTX cơ bản, autosave localStorage. Khoảng
cách lớn nhất còn lại: **motion + presenter**, **QC/regenerate**, **hàng đợi
ảnh**; layout tĩnh đã khá hơn nhưng chưa image-led.

Thứ tự dưới đây ưu tiên thứ nhìn thấy khác ngay trước, pipeline AI sau. Ước %
chỉ là tương đối (±5%), đo lại sau mỗi chặng bằng đúng thang ở 3.36.

> **Cập nhật sau audit GenOffice (3.41):** khoảng cách lớn nhất về chất lượng
> không phải số layout mà là pipeline AI (style → outline → sinh từng trang →
> QC/repair) và ảnh tự động. 23.5 (3.42), **26a dàn ý + duyệt** (3.43), **26b
> sinh từng trang + validate/repair** (3.44) và **27a ngân sách chữ + bố cục
> art-directed** (3.45) đã xong. Bước tiếp theo là **28 ảnh tự động + icon**
> (đòn bẩy thị giác lớn nhất còn lại), rồi **27 regenerate/QC**, sau đó
> 24/25 motion + presenter nếu ưu tiên trình chiếu.

> **Cập nhật sau audit code soandethi trích xuất (3.48, 27/10/2026):** khoảng
> cách lớn nhất không phải số layout mà là **design engine**: auto-typography
> đo trước khi đặt, kho đồ hoạ vector thay ảnh AI, motion + click-reveal.
> **Chặng 1 (typography engine) đã xong** — 3.49: cả 19 layout fit cỡ chữ lúc
> compose, editor/thumbnail/PPTX dùng chung một cỡ, test bất biến + đo DOM thật
> 0 tràn. **Chặng 2 (kho 112 đồ hoạ vector) đã xong** — 3.50: nhập sheet tự
> động, AI chọn theo catalog, render + PPTX + 4 layout dùng graphic, gọi AI thật
> xác nhận chọn đúng id và bỏ vẽ ảnh. Hiện trạng ước **~72%**.
> Tiếp theo: **chặng 3 — motion + click-reveal** (transition đã lưu nhưng chưa
> chạy, chưa có animation phần tử); sau đó lenient repair, nén ngữ cảnh, hàng
> đợi ảnh.

**Nguyên tắc chung**

- Không copy CSS/asset/theme của soandethi; chỉ học kiến trúc rồi tự viết layout,
  keyframes và đồ hoạ. `_ref/soandethi/` chỉ là tài liệu tham chiếu.
- Mọi field mới của `Slide`/`SlideElement`/`DeckTheme` phải **optional**; deck cũ
  (không có layout/theme mới/animation) phải render y như trước, normalize khi đọc.
- Không phá trình soạn đề (`ExamEditor`, converter, test 12/12). Slide là tab
  riêng trong `ComposeDoc`; autosave local vẫn là nguồn chính.
- Mỗi chặng chốt bằng: `npx tsc -b --noEmit` sạch · `npm run build` thành công ·
  test liên quan xanh · mở browser thật 1 tab kiểm tra trực quan · cập nhật
  context (mục 3.x) + tick chặng ở đây.

---

#### ✅ Chặng 21 — Theme v2: token theo môn + font + decor (~28%, xong 25/10/2026 — 3.37)

**Mục tiêu:** theme đủ giàu để layout dùng lại, thay vì 6 theme chỉ có bg/fg/accent.

- `src/store/docs.ts` — mở rộng `DeckTheme` (giữ `bg/fg/accent` cũ để deck cũ đọc
  được): thêm `id?`, `name?`, `tags?: string[]`, `decor?: string`, `dark?: boolean`,
  `surface`, `muted`, `primary`, `secondary`, `chart?: string[]`,
  `fonts?: { heading; body; serif; mono }`.
- `src/lib/slideTheme.ts` (mới) — `normalizeTheme(theme)` map theme cũ
  (bg→background, fg→text, accent→primary, font mặc định), `readableTextOn(bg)`
  chọn màu chữ tương phản ≥4.5:1, `themeById(id)`.
- Bộ theme: 6 theme cũ + 4 theme mới theo môn (Toán/Lý/Hoá, Văn/Sử/Địa, Sinh,
  Tiếng Anh/Tin) — tự chọn palette, không lấy màu của họ. Mỗi theme có tags môn
  để sau này AI chọn.
- Decor: 3–4 hoạ tiết CSS thuần (chấm, lưới, sóng, confetti) qua
  `data-decor` trên `.slide-frame`; không dùng ảnh/asset ngoài.
- `SlideEditor.tsx` — `SlideElView`/`EditableEl` dùng `theme.fonts.heading/body`
  thay vì hardcode Figtree; thẻ theme ở tab Thiết kế hiển thị đúng palette mới.
- Test: `scripts/test-slide-theme.mjs` — normalize theme cũ, contrast, themeById.

**Done khi:** đổi theme đổi được nền/chữ/font/decor; deck cũ mở vẫn đúng; test
theme 4/4; build sạch. Chưa đụng AI.

#### ✅ Chặng 22 — Layout engine v1 + 7 layout (~35%, xong 25/10/2026 — 3.38)

**Mục tiêu:** AI (và người dùng) chọn layout + nội dung; máy dựng hình. Đây là
chặng tạo khác biệt lớn nhất về "chuẩn".

- `src/lib/slideLayouts.ts` (mới) — `SLIDE_LAYOUTS` catalog (id, name, mô tả,
  field dùng), `composeLayout(theme, layoutId, content)` → `SlideElement[]`.
  Làm việc theo % (0–100), safe margin 5%; role id cố định:
  `title, kicker, subtitle, body, bullets, item-1…, card-1…, quote, author,
  image-1…, center`.
- 7 layout v1: `title`, `section`, `bullets`, `cards` (2–6), `two-column`,
  `quote`, `closing`.
- `Slide.layout?: string` (optional; deck cũ = undefined → render như cũ).
- `SlideRibbon.tsx` — mở khoá nút **Bố cục** (tab Chèn) thành gallery; áp layout
  thay element hiện có (có xác nhận vì phá nội dung); giữ notes/transition.
- `src/lib/aiDeck.ts` + `SlideEditor.applyAiResult` — nhận `layout` + field cấu
  trúc; nếu layout hợp lệ thì `composeLayout`, sai/thiếu thì fallback title+bullets
  như hiện tại.
- Test: `scripts/test-slide-layout.mjs` — mọi element nằm 0–100; id role không
  trùng; cards 2–6; quote/closing đúng field; layout lạ fallback.

**Done khi:** 7 layout dựng được bằng UI và bằng AI; deck cũ không đổi; xuất PPTX
vẫn chạy; test layout 6/6.

#### ✅ Chặng 23 — Layout v2 + tone (~41%, xong 25/10/2026 — 3.39)

- Thêm 7 layout: `table`, `image-left`, `image-right`, `stats`, `timeline`,
  `cycle`, `quiz` → tổng 14.
- `Slide.tone?: 'theme' | 'soft' | 'accent'` (optional) + compose dùng nền/màu
  chữ tương phản. Mặc định theo layout: title/section → accent; quote/quiz/
  closing → soft.
- Layout ảnh: tạo element `image` không có `src` + nhãn "chọn ảnh" (ảnh AI để
  chặng 28); không chặn phần còn lại.
- `timeline`/`cycle` dùng shape + text (chưa cần icon); `quiz` có đáp án tô màu.
- Test: thêm case bảng 6 cột/8 hàng, timeline 3–6 bước, quiz 2–4 phương án.

**Done khi:** 14 layout; không element nào tràn khung; AI chọn được layout mới;
test 10/10.

#### Chặng 24 — Motion v1: animation phần tử + preview (ước ~49%)

**Mục tiêu:** slide không còn tĩnh; preset + enter/click + byLine; chưa cần
Reveal.

- `src/lib/slideAnimation.ts` (mới) — `EFFECTS` (fade-in/up/down/left/right,
  zoom-in, wipe, pop, blur-in; có thể thêm drift/tumble), `PRESETS`
  (subtle/build/lively/chill), `normalizeAnimation`, `applyAnimationPreset`,
  `animationPlan` (enter/click, order, delay, byLine).
- `SlideElement.animation?: { effect; start: 'enter'|'click'; order; duration;
  delay; byLine }` — optional.
- `slide.css` — tự viết keyframes `sa-fade-*`, `sa-zoom-in`, `sa-wipe`, `sa-pop`,
  `sa-blur-in`; class `sa-enter`, `sa-play`; `--sa-duration/--sa-delay`; tôn
  trọng `prefers-reduced-motion`.
- `SlideEditor.tsx`/`SlideElView` — nhận `mode: edit|preview|present`; edit tĩnh;
  preview thêm `sa-play`; byLine tách text theo dòng và gán delay từng dòng
  (chưa tách ký tự).
- `SlideRibbon.tsx` — tab **Hoạt ảnh** (đang "Chưa hỗ trợ"): gallery hiệu ứng,
  preset áp cả slide, nút "Xem trước" (dialog phát lại), nút áp dụng tất cả.
  `Slide.transition` hiện có vẫn chỉ lưu, chưa dùng ở đây.
- Test: `scripts/test-slide-animation.mjs` — plan enter/click/order/byLine;
  preset gán đúng loại element; normalize rác.

**Done khi:** preview chạy hiệu ứng; presenter đơn giản phát enter; dữ liệu
animation optional; deck cũ không đổi; test 6/6.

#### Chặng 25 — Presenter v2: transition + click build + notes (ước ~56%)

- `SlideEditor.tsx` — presenter dùng `slide.transition` (none/fade/slide/zoom)
  và `transitionSpeed` (fast/default/slow) bằng CSS trên key đổi slide; đây là
  chỗ hiện tại **có field nhưng chưa chạy**.
- Click build: state `step`; `animationPlan` chia enter (vào slide) và click
  (theo order); next/prev đi qua từng step trước khi sang slide; nút/space/←/→;
  Esc thoát; F fullscreen.
- Notes: hiện `slide.notes` trong panel cạnh hoặc overlay (dữ liệu đã có, hiện
  chưa hiển thị khi trình chiếu). Chưa cần cửa sổ presenter thứ hai.
- Preview trong editor dùng cùng logic để WYSIWYG.
- Không thêm Reveal.js ở chặng này; nếu sau này cần presenter window/fragments
  phức tạp mới cân nhắc.

**Done khi:** transition chạy thật; click build đúng thứ tự; notes xem được;
reduced-motion vẫn ổn; kiểm tra browser 1 tab.

#### ✅ Chặng 26 — AI prompt v2 + validate (26a 3.43, 26b 3.44 — xong 25/10/2026)

**26a:** catalog text sinh từ code, `parseDeckPlan` (whitelist layout/theme/tone,
cắt độ dài), thẻ dàn ý + duyệt trong chat, theme của dàn ý áp cho cả deck, dàn ý
hỏng thì rơi về deck một lượt. Xem 3.43.

**26b:** sinh **từng trang** với prompt ngắn (layout + field hint + brief +
style + cả dàn ý), validate theo layout, **repair 1 lần**, bỏ trang vẫn sai;
hai luồng song song, chèn dần đúng thứ tự; tiến trình thật + huỷ an toàn;
`Deck.style` được lưu. Xem 3.44.

**Còn để chặng 27:** sửa/xoá/sinh lại **một slide hoặc vùng chọn** (regenerate
theo yêu cầu), và QC nội dung/hình học sau khi sinh. `sanitizeSlide` hiện chỉ
whitelist layout/theme/tone/field của 26b; motion (chặng 24) chưa có để
whitelist.

#### ✅ Chặng 27a — Ngân sách chữ + bố cục art-directed (xong 25/10/2026 — 3.45)

Thêm trước 27 vì người dùng chốt: slide vẫn "sơ cấp" do nhiều chữ, thiếu bố cục
và trang trí. Đã làm:

- `BUDGETS` theo layout + `budgetLine` sinh từ cùng bảng; vượt ngân sách →
  repair, không để `FitText` thu nhỏ. Một ý lớn/slide, 8–15 từ/ý.
- 5 layout mới: `statement`, `agenda`, `comparison`, `image-full`, `stat-image`
  → tổng 19; decor shape cho title/closing/bullets.
- `leftTitle`/`rightTitle` optional; plan prompt ưu tiên agenda/statement/
  comparison, giới hạn layout ảnh.
- Test 100 xanh; smoke 6 trang ~21 s, 0 repair, 70–270 ký tự/slide.

Chi tiết + giới hạn: 3.45.

#### Chặng 27 — Regenerate/QC + sửa outline

**Phần plan/duyệt/sinh đã xong ở 26a + 26b (3.43, 3.44).** Phần còn lại:

- **Sửa outline** ngay trong thẻ dàn ý: đổi tiêu đề/layout/brief, bỏ/thêm slide
  trước khi sinh (hiện chỉ duyệt hoặc huỷ).
- **Sinh lại một slide** đã có: gửi nội dung hiện tại + yêu cầu sửa → cùng
  contract `sanitizeSlide`/`validateSlide`, thay slide theo id thay vì nối thêm
  (cần `replaceSlide` trong `appendSlidesToDeck` hoặc hàm riêng).
- **Sửa/xoá theo vùng chọn**: dùng `selectedSlideId` / `selectedElementId` làm
  target; chưa cần agent tools.
- **QC nhẹ sau sinh**: kiểm tra trùng ý giữa các slide, độ dài quá khung, slide
  thiếu tiêu đề; chỉ báo + cho sinh lại, không tự rollback như GenOffice.
- Test: replace theo id, regenerate lỗi giữ slide cũ, QC phát hiện trùng/thiếu.

**Done khi:** sửa được dàn ý trước khi sinh; sinh lại đúng một slide; QC báo
được lỗi nội dung; không JSON thô trong chat.

#### Chặng 28 — Asset/ảnh minh hoạ (một phần đã làm sớm ở 3.40)

- Ảnh AI: đã có provider **Xkiro** + `/api/image` (model
  `sensenova/sensenova-u1.5-lite`) và nút "Tạo ảnh AI" cho từng khung ảnh
  (3.40). Còn lại: hàng đợi async nhiều ảnh, prompt + context slide ≤2800 ký tự,
  tối đa 12 ảnh/bộ, tự chèn vào vùng trống, retry/abort.
- Bộ icon/graphic SVG: chưa có asset; nếu chủ dự án cung cấp thì thêm
  `SlideElement.type='icon'|'graphic'`, picker, render, xuất PPTX.
- Nếu có API ảnh: hàng đợi async như audit (prompt + context slide ≤2800 ký tự,
  tối đa 12 ảnh/bộ, chèn vào vùng trống), không chặn hiện slide.
- Test: queue/abort/retry; ảnh lỗi → placeholder + thông báo.

#### Chặng 29 — PPTX fidelity (optional, sau cùng)

- Thêm speaker notes vào export (`pptxgenjs` hỗ trợ `addNotes`).
- Transition/animation của PPTX: `pptxgenjs` không hỗ trợ — ghi rõ giới hạn,
  không giả lập.
- Icon/graphic nếu có asset thì export; import PPTX vẫn chỉ text (như hiện tại).
- Chỉ làm khi 21–27 đã xong.

#### Chặng 30 — Server storage/versions (deferred, YAGNI)

- App hiện local-first, một người dùng; `myDecks` localStorage là đủ. Chỉ làm khi
  chủ dự án cần đồng bộ nhiều máy/version/sources như họ. Không đưa vào lộ trình
  mặc định.

---

**Bảng ước lượng sau từng chặng** (đo lại bằng thang 3.36):

| Sau chặng | Ước % |
|---|---|
| sau chặng 20 (hiện trạng trước 21) | ~20% |
| 21 theme v2 | ~28% (đã xong) |
| 22 layout v1 | ~35% (đã xong) |
| 23 layout v2 | ~41% (đã xong) |
| 23.5 polish layout | ~41% (đã xong — chất lượng thị giác, không đổi thang) |
| 24 motion v1 | ~49% |
| 25 presenter v2 | ~56% |
| 26 AI prompt v2 | ~61% |
| 27 plan/generate | ~67% |
| 28 asset/ảnh | ~72% (nếu có nguồn) |
| 29 PPTX fidelity | ~75% |
| **27/10 chặng 1 — typography engine (3.49)** | **~65%** |
| **27/10 chặng 2 — 112 đồ hoạ + AI chọn (3.50)** | **~72%** |
| **kế tiếp chặng 3 — motion + click-reveal** | mục tiêu ~80% |

**Cập nhật 27a (25/10/2026):** pipeline (3.43/3.44) và ngân sách chữ + art
direction (3.45) đã xong — ước **~57%** feature coverage; thẩm mỹ tĩnh ước
**~6/10** theo cảm nhận (đã hết "slide dày chữ", có 5 bố cục nhìn ra thiết kế).
**7/10 cần 28** (ảnh tự động + icon); **8/10 cần thêm 24/25** (motion/presenter)
và QC bằng vision — không đạt 8/10 chỉ bằng danh sách chặng.

**Cập nhật 27/10/2026 (sau audit code trích xuất 3.48):** typography engine
(3.49) và kho 112 đồ hoạ (3.50) đã xong → **~72%**; thẩm mỹ tĩnh ước **~7/10**
(đã có đo chữ + đồ hoạ vector thay ảnh AI). Việc còn lại để lên **~8/10**:
**motion + click-reveal** (chặng 3), **QC/regenerate từng slide** và **hàng đợi
ảnh** (dedupe/giới hạn/dừng khi hết quota). Streaming/clarification vẫn là
nice-to-have, không tính vào thang.

**Không làm trong lộ trình này:** copy CSS/theme/asset của soandethi; copy 208
đồ hoạ của họ (kho của mình do chủ dự án thiết kế — hiện 112 icon); thêm
Reveal.js khi presenter tự viết đã đủ; server/version khi chưa cần;
mindmap/venn/pyramid phức tạp trước khi có 19 layout cơ bản.

**Rủi ro lớn nhất cần theo dõi:** (1) deck cũ mất theme khi thêm token — phải
normalize; (2) layout thay element có thể làm mất nội dung người dùng — luôn xác
nhận + undo; (3) pipeline nhiều lượt (1 dàn ý + N trang) — 2 luồng song song,
tiến trình thật, cho huỷ; dàn ý được duyệt nên không phí lượt sinh; (4) motion
làm nặng re-render — chỉ chạy khi preview/present, edit tĩnh; (5) ngân sách chữ
quá chặt gây repair lặp — prompt và validate dùng chung một bảng, một lượt sửa
rồi bỏ trang; smoke thật đang 0 repair.


---

## 7. Bản đồ file

```
src/
  examEditor/
    genoffice-tokens.css   token chrome/ruler/paper — đã re-theme clay/Be Vietnam Pro
    compose.css            toàn bộ vỏ giao diện (ribbon, tab strip, nav, AI dock, doc stage)
    slide.css              vỏ trình soạn slide (ribbon gallery/popup, stage, Format Pane, hoạ tiết theme, gallery bố cục)
    SlideRibbon.tsx        ribbon slide nhiều tab + nhóm lệnh + tab ngữ cảnh
    SlideEditor.tsx        trình soạn slide (thumbnail, stage, chọn/kéo/resize, AI dock)
    slideIcons.tsx         icon slide port GenOffice (canvas 24×24, nét 1.5px)
    icons.tsx              189 icon SVG (port từ GenOffice + tự vẽ, canvas 16×16)
    schema.ts              node + mark TipTap cho cấu trúc đề (kèm format attrs)
    convert.ts             ExamBlock <-> TipTap JSON (giữ marks/format), buildTocFromDoc
    formatState.ts         useFormatState + applyFormatAttrs (trạng thái định dạng cho ribbon)
    choiceLayout.ts        chọn số cột phương án theo bề rộng thật (port soandethi)
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
    FileMenu.tsx           menu "Tệp" (Đề mới / Nhập file / Tải xuống) dùng chung 2 ribbon
    markdown.tsx           parse/render markdown tối giản cho chat AI (an toàn XSS) + Markdown
    NavPanel.tsx           nav pane (mục lục / khối mẫu / tìm kiếm) — dải tab có thẻ trượt
    templates.ts           BLOCK_TEMPLATES — nguồn duy nhất cho ribbon + nav panel
    exportBlocks.ts        xuất Word + in A4 (richToHtml + format CSS)
  components/
    Layout.tsx             vỏ web (header/footer) — logo mới /brand/logo-de-ro.svg
    docIcons.tsx           icon loại tài liệu: IconDocExam/IconDocSlide/IconDocSheet + DocIcon
  assets/
    ai-assistant.svg       animation "Trợ lý giấy" cho trạng thái đang suy luận (asset người dùng)
    ai-assistant.json      bản gốc Lottie của cùng animation (nguồn, không import)
  vite-env.d.ts            reference vite/client — để TS hiểu import *.svg
  pages/ComposeDoc.tsx     trang Soạn đề (ghép vỏ, auto-fit, save, print, export)
  store/compose.ts         store phiên nhiều tab (nội dung + deck, OpenTab.kind)
  store/docs.ts            store tài liệu đã lưu (myDocs, saveDocById) + kiểu theme/deck/tone
  data/docTypes.ts         kiểu ExamBlock + RichText/Span/Mark/FormatAttrs + DocKind
  lib/llm.ts               client gọi /api/llm
  lib/sources.ts           thang nguồn: đọc tệp, tìm myDocs, search web, rule/prompt nguồn
  lib/importFile.ts        nhập docx/xlsx/pptx → block đề hoặc slide (text)
  lib/exportDeck.ts        xuất bài giảng .pptx bằng pptxgenjs (nạp động)
  lib/slideText.ts         chiều cao hộp chữ bám nội dung (elementHeight)
  lib/slideMeasure.ts      typography engine: đo chữ + fitFontSize (dùng chung layout/FitText/PPTX)
  lib/graphics.ts          112 icon SVG sinh tự động từ contact sheet (2 path/icon, 8 màu pastel)
  lib/slideGraphics.ts     registry đồ hoạ: search không dấu, recolor nét, catalog text cho AI
  lib/slideTheme.ts        catalog 10 theme + normalizeTheme/readableTextOn/themeById
  lib/slideLayouts.ts      layout v1–v3: 19 bố cục + tone/art-directed + composeLayout/contentFromSlide
  lib/aiDeck.ts            đọc JSON AI: deck một lượt + dàn ý (parseDeckPlan) + catalog text
  lib/slideAi.ts           26b: sanitize/validate một slide + prompt trang/repair + chèn vào deck
  lib/imageGen.ts          prompt ảnh từ slide + gọi /api/image + thu nhỏ JPEG
server/llmProxy.ts         proxy LLM (env LLM_*, header x-opencode-session, middleware cho Vite)
server/extract.ts          trích text docx/pdf/xlsx/csv/pptx — endpoint /api/extract
server/searchProxy.ts      adapter Tavily cho /api/search (env TAVILY_API_KEY)
server/imageProxy.ts       tạo ảnh Xkiro (sensenova-u1.5-lite) cho /api/image, key server-side
server/http.ts             json/readBody dùng chung cho các endpoint
vite.config.ts             dev: mount /api/llm, /api/extract, /api/search + nạp .env
.env.example               mẫu cấu hình AI (được commit; .env thật bị gitignore)
public/brand/
  logo-de-ro.svg           logo chính 194×72 (mark + chữ "đề rõ")
  favicon.svg              mark cắt từ logo, dùng làm favicon
  ai-static.svg            icon AI tĩnh cho nút "Trợ lý AI" trên ribbon
  file-icons/
    doc.svg                icon Word cho tệp đính kèm AI
    sheet.svg              icon bảng tính cho tệp đính kèm AI
    pdf.svg                icon PDF cho tệp đính kèm AI
scripts/test-convert.mjs   test round-trip converter (npm run test:convert) — 12/12 pass
scripts/test-export.mjs    test đánh số + bảng phương án của bản Word/in — 5/5 pass
scripts/test-layout.mjs    test chọn số cột phương án — 7/7 pass
scripts/test-slide-text.mjs test chiều cao hộp chữ slide — 5/5 pass
scripts/test-slide-theme.mjs test theme v2 (normalize/tương phản/catalog) — 4/4 pass
scripts/test-slide-layout.mjs test layout v1–v3 (19 bố cục/geometry/quiz/tone) — 10/10 pass
scripts/test-slide-measure.mjs test typography engine (đo chữ/fit 19 layout) — 9 nhóm pass
scripts/test-slide-graphics.mjs test kho 112 đồ hoạ (registry/search/recolor/layout/prompt) — 19 nhóm pass
scripts/import-graphics.mjs nhập contact sheet icon → src/lib/graphics.ts (chạy lại khi có đợt mới)
scripts/test-slide-plan.mjs test dàn ý 26a (sanitize/catalog/không hồi quy) — 7 nhóm pass
scripts/test-slide-ai.mjs test 26b+27a (sanitize/validate/ngân sách chữ/prompt/repair/chèn dần) — 10 nhóm pass
scripts/test-image.mjs     test prompt tạo ảnh (tiêu đề + 3 ý, fallback) — 3/3 pass
scripts/test-sources.mjs   test thang nguồn (myDocs + rule) — 4/4 pass
scripts/test-extract.mjs   test trích tệp server-side (csv/.doc/.ppt/pptx) — 4/4 pass
_ref/genoffice/            clone mã nguồn GenOffice (Apache-2.0) — tham chiếu (còn nguyên)
_ref/soandethi/AI-SLIDE-AUDIT.md  audit workflow AI slide + motion (mục 3.36, lộ trình 6.8)
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
npm run test:convert    # 12/12 pass
npm run test:markdown   # 14/14 pass (parser markdown của chat AI)
npm run test:export     # 5/5 pass (đánh số + phương án 2 cột khi xuất Word)
npm run test:layout     # 7/7 pass (chọn số cột phương án)
npm run test:slide-text # 5/5 pass (chiều cao hộp chữ slide)
npm run test:slide-theme # 4/4 pass (theme v2: normalize/tương phản/catalog)
npm run test:slide-layout # 10/10 pass (layout v1+v2: 14 bố cục/quiz/tone)
npm run test:slide-measure # 9 nhóm pass (đo chữ + fit 19 layout, bất biến không tràn)
npm run test:slide-graphics # 19 nhóm pass (112 icon: registry/search/recolor/layout/prompt)
npm run test:image      # 3/3 pass (prompt tạo ảnh từ nội dung slide)
npm run test:sources    # 4/4 pass (thang nguồn + myDocs)
npm run test:extract    # 4/4 pass (trích docx/pdf/xlsx/csv/pptx)
```

**Cấu hình AI:** điền `LLM_API_KEY` vào `.env` ở gốc dự án (mẫu ở
`.env.example`). `.env` đã bị gitignore. `npm run dev` tự mount `/api/llm`,
`/api/extract`, `/api/search`, `/api/image`; bản production chạy
`npx tsx server/llmProxy.ts` (tự nạp `.env`, mặc định cổng 8787). Search web
(ưu tiên 3) cần thêm `TAVILY_API_KEY`; để trống thì app bỏ qua bước search và
báo trong chat. Tạo ảnh dùng `IMAGE_BASE_URL`/`IMAGE_API_KEY`/`IMAGE_MODEL`
(mặc định Xkiro + `sensenova/sensenova-u1.5-lite`); thiếu env thì server đọc
provider Xkiro từ `~/.zcode/v2/provider_config.json` của máy.

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
