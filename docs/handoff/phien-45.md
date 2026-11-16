# Phiên 45 (16/11/2026): panel hỏi lại của AI, sửa hình, nhập Word giữ định dạng, thước, mục lục tự động

Tiếp [phiên 44](phien-44.md). Không có migration mới. Repo chỉ có nhánh `main`, mọi commit dưới đây đã push.

## Việc còn treo

1. **Chưa thử với AI thật**: panel hỏi lại sau lần đổi `ASK_DEFAULT` cuối; slide không hỏi câu hình; prompt hình thực tế mới (bắt "đất"/"tường" qua đỉnh góc); lệnh `vectơ AB` trong đề vectơ lớp 10.
2. **Chưa mở bằng Word thật**: file xuất có mục lục (trường TOC + `updateFields`).
3. **Nhập Word chưa thử file có công thức gõ bằng Word** (mới thử vòng xuất → nhập của chính app). MathType (OLE) không nhập được.
4. Kéo marker trên thước: sự kiện giả chạy đúng, kéo bằng chuột của công cụ thì không nhúc nhích. Cần người dùng thử tay.
5. Thiết lập trang (`pageSetup` trong `ComposeDoc.tsx`) dùng chung mọi tab: nhập Word đổi lề cho cả tab khác. Nếu phiền thì chuyển sang lưu theo từng tài liệu.
6. App chỉ có khổ A4 (dọc/ngang). File Letter nhập vào vẫn thành A4.
7. **Tìm trên web cần `DEEPSEEK_API_KEY` trên Vercel** (chưa đặt; tài khoản DeepSeek phải có tiền). Thiếu key thì nút báo "Tìm trên web chưa được bật trên máy chủ". Chưa thử tìm web với soạn slide.
8. Model chính trên web vẫn là opencode. Báo cáo chi phí có số đo DeepSeek chính hãng nếu muốn chuyển.
9. File chưa commit, hỏi trước khi đụng: `.claude/`, `.rls-audit/`, `.strix/`, `public/brand/logo-120*.png`, `scripts/probe-imports.mts`.

## Đã làm

| Commit | Nội dung |
|---|---|
| `6fa2e63` | Panel AI hỏi lại khi yêu cầu mơ hồ (`AiAskPanel.tsx`) |
| `450b516` | Soạn slide không hỏi câu hình minh hoạ (prop `figure`) |
| `d3641d8` | Mẫu tam giác vuông đúng đỉnh A; hình thực tế tự vẽ cạnh góc thiếu, thang lệch khỏi phía có góc |
| `3f19af1` | Thẻ dàn ý slide gọn, rõ chữ |
| `316b0d5`, `28ac251`, `187d545` | Nhập `.docx` giữ định dạng; công thức Word → LaTeX; giới hạn 12 MB, thu nhỏ ảnh; lấy lề + hướng trang |
| `822dcfb` | Lệnh `vectơ AB` cho hình học phẳng |
| `3a5772d` | Thước như Word: số 0 ở lề trái, thụt treo giữ dòng đầu; bỏ nút "L" chết |
| `63cb17f` | Thanh trạng thái gọn, số đo lề vào tooltip |
| `570e2f6` | Mục lục tự động |
| `e2b050e` (agy), `85c0388`, merge `88974d2` | Đo lại chi phí AI; lượt hỏi rút gọn khi chưa nêu môn; đề lớp 6+ bỏ hướng dẫn tranh đếm/đồng hồ |
| `d9222b4` | Nút Tìm trên web (DeepSeek `deepseek_web_search`) |

## Panel hỏi lại (AI soạn đề / slide)

- `src/examEditor/AiAskPanel.tsx`: `ASK_RULE` (model trả `{"action":"ask","intro","questions":[{q,options,multi}]}`, 1–4 câu), `parseAsk`, `askAnswerText`. Panel thế chỗ ô nhập khi lượt AI cuối có `askState: 'open'`.
- Mỗi câu có lựa chọn tự nhập. Phím số để chọn, Enter sang câu sau, Esc bỏ qua.
- Đề Toán thêm câu 5 về hình minh hoạ (`FIG_Q`, `FIG_MEANING`); slide không hỏi câu này (`figure={mode !== 'slide'}`).
- Không thao tác 2 phút (`IDLE_MS`) thì tự gửi. Câu chưa trả lời theo `ASK_DEFAULT`: đề bố cục chuẩn, độ khó đều (người dùng không muốn để AI tự quyết).
- Không hỏi ở bảng vẽ, slide HTML, và ngay sau một lượt vừa hỏi.

## Hình

- `geometry.ts`: toạ độ mẫu `right-triangle` cũ có góc vuông ở B, trong khi kí hiệu và đường cao vẽ theo A. Giờ A ở trên, cạnh huyền BC nằm ngang.
- `scene.ts`: cạnh góc chưa vẽ (thiếu `đất`) thì tự thêm đoạn. Vật nghiêng có góc ở chân/đỉnh thì lệch về phía không có góc.
- `geoConstruct.ts`: lệnh `vectơ AB, AD` và `vectơ AC "u"` (`out.vecs` + đoạn thường). `geometry.ts` vẽ đầu mũi tên; hình 3D chỉ vẽ đoạn.

## Nhập Word (`src/lib/docxImport.ts`, `src/lib/ommlLatex.ts`)

- `.docx` đọc trên trình duyệt bằng JSZip + DOMParser, ra `ExamBlock[]`. `.doc`/Excel/PowerPoint vẫn qua server (`readImportFile`).
- Kiểu đoạn trải theo `basedOn`; đè bằng định dạng trực tiếp. Giữ được:
  - căn lề, thụt lề, khoảng cách đoạn, giãn dòng;
  - đề mục (Heading N / outlineLvl);
  - đậm, nghiêng, gạch chân, gạch ngang, chỉ số, cỡ chữ, phông, màu, tô nền, chữ in hoa (`caps`);
  - ngắt trang;
  - bảng (gộp ô ngang/dọc, nền ô, nhiều đoạn trong ô = xuống dòng);
  - ảnh trong dòng.
- Danh sách: gạch đầu dòng ra `bullets`; danh sách số ghép số vào chữ (`numberText` đếm theo numId, mẫu `lvlText`). `numId 0` tắt số kế thừa từ kiểu: mục lục dựa trên Heading 1 từng làm lệch số.
- Công thức `m:oMath` → `$latex$`. Tên hàm gõ thẳng (sin, lim…) đổi sang `\sin`.
- Ảnh trên 250 KB thu về cạnh dài 1600 px. Ảnh EMF/WMF bị bỏ.
- Lề và hướng trang lấy từ `w:sectPr` (`docxImport()` trả `{blocks, page}`), gán `setPageSetup`. Khổ giấy vẫn A4.
- Chưa nhập: header/footer, chú thích cuối trang, hộp chữ, shape/SmartArt, ảnh nổi.

## Mục lục tự động (`src/examEditor/toc.ts`)

- Node atom `examToc` (block `toc` trong `docTypes`/`convert`). Chèn qua Chèn → Trang → "Chèn mục lục" hoặc template `toc` ở Khối mẫu. Nút "Mục lục" cũ trên ribbon vẫn là mở bảng điều hướng.
- Node view liệt kê `examHeading` cấp 1–3 nằm **sau** nó. Số trang = vị trí DOM / `stride`, đổi theo `pageNumberAt` nếu có đánh số trang.
- ExamEditor ghi `stride` và `pageNumber` vào `editor.storage.examToc`, rồi dispatch meta `tocRefresh`.
- Vẽ lại khi `docChanged`, khi có meta `pageGapsKey` (phân trang đổi), hoặc `tocRefresh`. Bấm dòng: đặt con trỏ trước rồi mới cuộn.
- Xuất Word: đề mục có `outlineLevel`, mục lục là `TableOfContents` (`useAppliedParagraphOutlineLevel`), Document có `features.updateFields`. In/HTML chỉ liệt kê đề mục, không có số trang.

## Chi phí AI (xem `docs/bao-cao-chi-phi-ai.md`, 2 mục cuối)

- agy đo lại trên opencode (nhánh đã merge, đã xoá): đề THPT ~25 điểm theo script, **trên web ~27–29** (web gửi thêm khung chương trình + quy tắc nguồn); 15 slide ~35; lượt hỏi "soạn đề đi" ~11 điểm. Script mới: `scripts/eval-ask-exam.mjs` (2 lượt hỏi → soạn).
- Hai chỗ rút prompt, đo bằng DeepSeek chính hãng (`EVAL_MODEL=deepseek-flash`):
  - `figureGuideFor`: đề có "lớp 6–12 / THCS / THPT / tốt nghiệp…" (`UPPER_GRADE`) bỏ mục 27 (tranh đếm) và 28 (đồng hồ). Prompt đề Toán THPT 8.309 → 7.064 token.
  - `needsAskFirst` + `ASK_ONLY_SYSTEM` (`AiAskPanel.tsx`): lượt đầu, tài liệu trống, yêu cầu < 80 ký tự không có tên môn → gọi prompt hỏi ngắn (~500 token thay vì ~10.500). Model đoán được môn thì trả `{"action":"proceed"}` và `AiPanel` chạy luồng đầy đủ.

## Tìm trên web

- Nút quả địa cầu trên ô nhập AI (soạn đề, slide; không có ở bảng vẽ). Mặc định tắt, không nhớ qua lần mở trang.
- Bật lần đầu: `dialog.choose` (nút phụ `altLabel` mới trong `src/components/Dialog.tsx`) — Huỷ / "Bật, không hỏi lại" (localStorage `dethinhbien-web-search-warned`) / Bật.
- Khi bật, trước lượt soạn chính: `callLlm(..., { webSearch: true, maxTokens: 4000 })` với `WEB_SEARCH_SYSTEM` (tóm tắt ≤ 25 dòng số liệu + nguồn). Kết quả nối vào system prompt mục "NGUỒN TÌM TRÊN WEB"; `citations` → `turn.webSources`, hiện thành link trong nút "Nguồn".
- Server (`server/llmProxy.ts`): `body.webSearch` → chỉ một target DeepSeek chính hãng, gửi `tools: [{type: "deepseek_web_search"}]`, `thinking: {type: "disabled"}` (bật suy luận = tìm nhiều bước, đắt 2–4 lần). Trả `citations` từ `message.annotations` (`url_citation`). `requestHash` thêm tiền tố `web:` vào model.
- Đo: 5 câu Địa lí, lượt tìm 12.456 token (~12 điểm, 4 nguồn) + lượt soạn 9.573. Ước tính đề/bộ slide đầy đủ có tìm: ~30–40 điểm (chưa đo).
- Tài liệu API: `https://api-docs.deepseek.com/guides/build_a_chatbot`.

## Lưu ý cách làm

- Script Python có `\r\n` hoặc `\n` trong chuỗi, viết qua heredoc của Bash, hay hỏng (chuỗi bị cắt dòng). Viết script bằng công cụ Write, dùng `chr(13)`/`chr(10)`.
- Thử module trong trình duyệt: `await import('/src/...')`; thư viện npm lấy ở `/node_modules/.vite/deps/<tên>.js`. `npx tsx` chạy script ngoài thư mục dự án thì không nhận alias `@/`.
- Đổi `server/llmProxy.ts` phải khởi động lại dev server (Vite không nạp lại middleware).
- rAF không chạy khi pane trình duyệt không vẽ, nên mục lục trống trong lúc thử. Đó không phải lỗi.
