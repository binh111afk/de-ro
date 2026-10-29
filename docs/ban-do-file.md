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
  pages/Quiz.tsx          làm bài + ResultView + ReviewView (xem lại: đáp án đúng/sai từng câu); đọc Exam.settings (không giới hạn giờ, hiện đáp án ngay, đảo câu)
  pages/OnlineList.tsx     tab Tạo đề online: lịch sử đề trên máy (thẻ: Sửa, Làm thử, Đăng, chép link, xoá)
  pages/OnlineBuilder.tsx  trình tạo đề 3 bước (soạn câu / thông tin + cài đặt / hoàn tất), tự lưu vào store/online
  pages/OnlineOpen.tsx     /de-online/:id — link chia sẻ đề đã đăng, tải từ cộng đồng rồi vào làm bài
  store/online.ts          lịch sử đề tạo online (persist localStorage "dethinhbien-online")
  lib/onlineExam.ts        mô hình OnlineItem, kiểm lỗi câu, xếp theo dạng, itemToExam/itemToDoc/examToDraft, loadForQuiz
  lib/onlinePublish.ts     đăng đề online lên cộng đồng (qua publishDoc) + shareUrl
  lib/docToExam.ts         ExamDoc → Exam; đọc phần lời giải cuối tài liệu ("Câu N:"/"Bài N:"); doc.online trả nguyên đề online
  components/CopyLink.tsx  ô link kèm nút chép
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

