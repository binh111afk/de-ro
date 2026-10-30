## 5b. Việc tiếp theo sau phiên 10 (tạo đề online)

Xem [phiên 10](handoff/phien-10.md). Còn lại, theo thứ tự nên làm:

- [x] **Nhập đề từ file** (30/10/2026): nút "Nhập đề từ file" ở trang Tạo đề online (.docx, .pdf, .txt, .md) → `src/lib/parseExamText.ts`, test `npm run test:parse`. Đáp án đọc từ: dòng "Đáp án:", bảng/dòng đáp án cuối đề (`Câu 1: a. Câu 11: b.`, `1A 2B`, bảng Word), hoặc phương án duy nhất được đậm/nghiêng/gạch chân/gạch ngang/đổi màu/tô nền (server bọc chữ bằng U+E000…U+E001, `markEmphasis` trong `server/extract.ts`) hay có dấu `* ✓`. Đề không có "Câu N." (chuyển từ PDF, đề bài là ảnh) vẫn tách theo từng bộ A–D. Chưa có: ô **dán văn bản**, hình/ảnh đề bài trong docx, công thức equation của Word (mammoth bỏ), ảnh scan/OCR. PDF chữ cũng đọc đánh dấu (`pdfEmphasis` trong `server/extract.ts`: tên font gốc → đậm/nghiêng, lệnh vẽ → màu chữ, đường kẻ mảnh/ô tô màu → gạch chân/gạch ngang/tô nền); mới thử với PDF xuất từ LibreOffice và Word (`scripts/fixtures`), chưa thử PDF nhiều cột hay chữ xoay.
- [ ] **Thử đăng thật** bằng tài khoản đăng nhập (đường đăng + `/de-online/:id` mới kiểm bằng test/typecheck).
- [ ] **Thử luồng `Tệp → Làm đề tương tác`** ở trình soạn bằng tay (đề có lời giải cuối tài liệu).
- [ ] **Đề chỉ có link, không lên danh sách cộng đồng**: cần thêm cột (vd `unlisted`) trong `community_exams`. Hỏi chủ dự án trước khi đổi database.
- [ ] **Lịch sử đề lưu theo tài khoản** (hiện chỉ `localStorage`, đổi máy là mất).
- [ ] Đề đăng không tự cập nhật khi sửa (có nút "Đăng lại bản mới"); chưa có xoá/gỡ bản đã đăng.
- [ ] **Xuất .docx — bố cục trong Word thật**: người dùng báo lệch (LibreOffice thì đúng). Cần ảnh chụp từ Word để sửa. Công thức đã thành equation (hệ phương trình `cases` còn xấp xỉ, xem phiên 10).
- [ ] Gộp hai đường vào làm đề tương tác (đề cộng đồng qua `Community.tsx` và đề online) nếu thêm tính năng.

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

