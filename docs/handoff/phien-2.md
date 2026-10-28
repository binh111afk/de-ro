## BÀN GIAO PHIÊN 2 (28/10/2026, trước phiên 3) — slide do AI sinh và AI sửa slide

### Trạng thái nhanh

Trọng tâm 2 phiên gần nhất: **slide do AI sinh** và **AI sửa slide có sẵn**. Mọi thứ dưới đây đã commit + push lên `main`
(commit cuối `7fba099`); thư mục `.claude/` là cấu hình cục bộ, KHÔNG commit.

Pipeline: dàn ý (`SLIDE_PLAN_SYSTEM`) → duyệt (nếu deck đã có nội dung thì hộp **Ghi đè / Nối tiếp / Huỷ**) → sinh từng slide
(`generateSlide` + repair, `readabilityIssues`) → layout engine (`slideLayouts.ts`, **22 layout**, đo chữ canvas) → slide hiện ngay → ảnh AI nền (bìa + layout ảnh).
Hai chế độ trong AI panel (tab PPT/HTML): **PPT** = deck sửa được; **HTML** = slide HTML trong deck, CHỈ trình chiếu trên web (xem 3.59).

Đã có trong 2 phiên này (chi tiết ở 3.58–3.61):
- **Chữ đậm `**từ khoá**`**: vẽ/đo/xuất PPTX; AI nhấn 1–2 cụm/ý, code cắt tối đa 2 cụm × 6 từ.
- **AI sửa slide có sẵn bằng LỆNH có cấu trúc** (`lib/slideEdit.ts`, **13 lệnh**): `set_theme`, `set_fonts`, `set_colors`, `set_tone`, `set_transition`, `delete_slides`, `move_slide`,
  `edit_slide` (CHỈ đổi field nêu), `set_layout`, `add_slide`, `duplicate_slide`, `set_notes`, `rename_deck`. Model không viết lại slide; engine kiểm tra rồi dựng lại; Ctrl+Z hoàn tác.
- **Layout `mindmap`** do engine vẽ (phần tử mới `connector`, S-curve SVG); AI chỉ đưa cây dữ liệu.
- **Chặn icon lệch nghĩa** (`graphicFits`), layout `hook` mới (không bong bóng), `bullets` bỏ icon lẻ, thẻ số 1–5 cho `timeline`/`example`, badge số cho `cycle`.
- **Chế độ HTML thành slide trong deck**: `Slide.html`, `Deck.format='html'`, `splitHtmlDeck`, `HtmlSlideFrame`, modal lưu ý khi bấm tab HTML, không xuất PPT/`.html`.
- Công cụ: `eval:slides` in **token thật** và có `--polish` (chấm → viết lại slide <6,5 → giữ bản điểm cao hơn).

### Điểm chất lượng (thước tương đối, model deepseek-v4.1-flash chấm ảnh slide)

| Lần đo (6 chủ đề: ƯCLN, Chí Phèo, Quang hợp, Điện Biên Phủ, Thì HTHT, Python for) | Tổng | Hình ảnh |
|---|---|---|
| Baseline sau ornament (không ảnh AI) | 6,7 | 4,7 |
| Sau thẻ số + polish | 6,8 | 5,0 |
| Có ảnh AI thật (chỉ bìa có ảnh) | 6,7 | 4,8 (bìa 6,4→7,3) |
| Sau chặn icon + hook mới | 6,6 | 4,7 |

Toàn bộ nằm trong nhiễu chấm (±1/slide, ~±0,2 cả deck). Người dùng chấm thường cao hơn model ~0,3. **Hình ảnh/minh hoạ đúng nội dung vẫn là nút thắt.**
Chi phí: ~29–41K token/deck (suy luận chiếm phần lớn token ra); lệnh sửa ≈ 1,2K token vào + vài trăm ra.

### Việc tiếp theo (ưu tiên)

1. **Minh hoạ đúng nội dung (hình ảnh 4,7–5,0)** — ĐỪNG thêm ảnh AI/ornament (giám khảo chê thiếu sơ đồ đúng nội dung, không phải thiếu trang trí). Hướng thật:
   **sơ đồ sinh từ dữ liệu** như `mindmap` đã làm: trục số, cây thừa số, Venn, biểu đồ (`ChartView` có sẵn nhưng AI chưa sinh data) cho toán/khtn/tin.
2. **Mindmap còn thiếu:** nhánh con nhiều cấp, hộp riêng cho ý con; xuất PPTX hiện thành đường THẲNG (chưa mở file PPTX để xem); chưa thử với theme `do`/`tim`.
3. **Chưa kiểm:** (a) PPTX có chữ đậm trong PowerPoint thật; (b) slide HTML do AI sinh có lỗi JS/CSS lạ; (c) chặn icon theo từ khoá có làm mất nhiều icon đúng nghĩa không (chưa đếm); (d) lệnh sửa trên deck dài >10 slide (prompt mô tả từng slide ≤600 ký tự).
4. **Lệnh sửa chưa có:** đổi cỡ chữ; phông riêng từng slide (phông là của theme). Nếu thêm nhiều lệnh (>~20): chia nhóm lệnh theo từ khoá, chỉ gửi nhóm liên quan (xem 3.60) — chưa cần.
5. Khung (`orn-khung-*`), blob, họa tiết nền lát chưa dùng; ưu tiên thấp. Vòng chấm bằng mắt chưa vào app (không có DOM→ảnh).
6. Tồn đọng cũ: lazy-load bundle (>1 MB), khối bảng biến thiên/biểu đồ/đồ thị cho TRÌNH SOẠN ĐỀ (mục 6.1b), `reasoning` model, quiz chưa có "hiện đáp án khi bấm".

### Lệnh và công cụ (chạy ở thư mục dự án)

- Dev: `npm run dev -- --port 5184 --host 127.0.0.1` (cổng bận thì preview tự đổi 5186). Sửa `server/*` phải khởi động lại dev server.
- Test slide (đều `npm run test:<tên>`): `slide-math`, `slide-theme`, `slide-layout`, `slide-measure`, `slide-text`, `slide-ai`, `slide-plan`,
  `slide-graphics`, `slide-assets`, **`slide-edit`**, `image`, `convert`, `export`. Sau khi đổi số layout phải sửa các số 22 trong `test-slide-layout`/`test-slide-plan`.
- `npm run lint:slides` — dựng 630 slide trong Chrome headless, đo DOM: tràn/đè/ngoài khung/sát mép là *error*, chữ nhỏ/tương phản là *warn*. Hiện **0 error**, ~108 warn (chữ nhỏ ở `cycle`/`hook` với nội dung stress).
- `npm run eval:slides -- "chủ đề" ... --out <dir> [--slides] [--images] [--polish]` — pipeline LLM THẬT, chụp lưới/từng slide, in token thật, `--polish` cần `--slides`.
- `node scripts/judge-slides.mjs <thư-mục-ảnh> --label "..."` — chấm bằng `LLM_MODEL`; ghi `judge.json`. `judge()` được export cho `--polish`.
- `node scripts/import-graphics.mjs` — nhập contact sheet → `src/lib/graphics.ts` (đừng sửa tay).
- `.env` (không commit): `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` (opencode, deepseek-v4.1-flash). Ảnh/Xkiro lấy key từ `~/.zcode/v2/provider_config.json` nếu `.env` không có `IMAGE_*`.
- `.claude/launch.json` (cấu hình dev server cho công cụ preview) để ngoài git. Ảnh/eval ra `eval-out/` (gitignored).

### Bẫy đã gặp (đừng lặp lại)

- Bash heredoc/tool **làm hỏng ký tự `\`** và xuống dòng trong chuỗi (regex, LaTeX, `'\n'`): tạo file chứa backslash bằng công cụ **Write**, hoặc sửa bằng Edit; kiểm tra `tsc` ngay sau khi sửa. Python heredoc cũng bị (đã gặp ở `looksLikeEdit`, test toán).
- Helper ghi file `open(p,'wb').write(f(s))` mở file TRƯỚC khi `f` chạy → lỗi assert làm file rỗng. Tính xong rồi mới mở để ghi.
- Nhiều file là **CRLF**; script vá nên đọc `newline=''`, đổi về `\n` để sửa rồi trả lại CRLF.
- Trang `scripts/*/main.tsx` (lint/eval) KHÔNG nằm trong `tsc`; chạy thật mới biết lỗi.
- `.katex` toàn cục là 1,03em → slide ghi đè trong `slide.css`. Hộp chữ canh giữa là flex-column: bọc một khối con. Editor dùng `<textarea>`; `AutoFitText` tự bọc flex để canh giữa.
- **Slide HTML** nằm trong `localStorage` (~9 KB/slide): deck dài có thể chạm giới hạn trình duyệt.
- `slideAi.ts` `clean()` cắt chuỗi theo `max` → KHÔNG đưa `image` (data URL) qua `checkSlide`; `edit_slide` đã tách `image`/`graphic` ra trước.
- `looksLikeEdit` là bước lọc regex rẻ: câu sửa mà không khớp sẽ đi luồng soạn mới; câu khớp nhầm thì model trả `{"action":"none"}` và rơi về luồng cũ.

### Bản đồ file chính của pipeline slide

`src/lib/`: `slideLayouts.ts` (22 layout, `composeLayout`, `contentFromSlide`, `graphicPlate`, `composeMindmap`, `numberTag`), `slideMeasure.ts` (đo chữ canvas),
`slideAi.ts` (sanitize/validate/budget/`readabilityIssues`/`withImage`, prompt từng slide), `slideEdit.ts` (**lệnh sửa slide**, `applyEdits`, `recomposeSlide`, `describeSlide`),
`htmlDeck.ts` + `htmlDeckPrompt.ts` (chế độ HTML), `aiDeck.ts` (dàn ý, `repairJson`, `enforceRhythm`), `slideTheme.ts` (OKLCH), `slideSubjects.ts`, `slideGraphics.ts` + `graphics.ts`
(232 icon + 78 ornament), `slideAssets.ts`, `slideMath.ts` (công thức + `**đậm**`), `math.ts`, `imageGen.ts`, `exportDeck.ts`.
`src/examEditor/`: `SlideEditor.tsx` (renderer + editor + `applyAiSlide/applyAiEdits/applyHtmlDeck/clearSlides`), `HtmlSlide.tsx` (`HtmlSlideFrame`, `HtmlDeckBar`),
`AiPanel.tsx` (prompt, luồng chat, `polishSlide`, hộp ghi đè, modal HTML). `server/`: `llmProxy.ts`, `imageProxy.ts`. `scripts/`: `lint-slides*`, `eval-slides*`, `judge-slides.mjs`, `lib/cdp.mjs`, `test-slide-*.mjs`.

