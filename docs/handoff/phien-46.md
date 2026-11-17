# Phiên 46 (16–17/11/2026): soạn thảo kiểu Word, Strix 6, nhập PPTX giữ bố cục, AI stream + nhật ký, bảng giá

Tiếp [phiên 45](phien-45.md). Migration `20261130_strix6_moderation` đã áp. Repo chỉ có nhánh `main`, mọi commit dưới đây đã push.

## Việc phiên sau (người dùng đã chốt thứ tự)

Lo ngại của người dùng: vá prompt bằng luật thì gặp yêu cầu ngoài luật AI sẽ "chết cứng", người dùng bực rồi bỏ web. Hướng xử lý:

1. **Cho AI nhìn thấy đủ.** Câu giáo viên nhắc tới ("câu 4", phần đang bôi đen) → gửi nguyên văn đầy đủ (công thức, phương án, hình, đáp án), không chỉ bản tóm tắt 320 ký tự (`documentDigest` trong `ComposeDoc.tsx`).
2. **Công cụ sửa thay vì viết lại cả đề.** Hiện "thêm lời giải câu 4" làm AI trả lại toàn bộ đề (panel báo "Đã soạn xong đề (23 khối)") → tốn token, dễ hỏng câu khác. Đưa `patch` (chèn sau / thay / xoá khối, trả lời trong chat) thành đường chính.
3. **Không ngõ cụt.** Một nguyên tắc đứng trên mọi luật trong prompt: "lời giáo viên thắng quy ước mặc định; không khớp quy ước nào thì làm cách hợp lý nhất rồi nói ngắn đã hiểu thế nào". Các luật mới thêm (lời giải ≠ hướng dẫn giải, `THINK_VI`…) chuyển thành **quy ước mặc định** dưới nguyên tắc này. Kết quả không áp được vào đề → hiện trong chat + nút "Thử lại", không báo lỗi trơn.
4. **Biết khi nào người dùng bực:** ghi lượt bị Ctrl+Z ngay sau khi AI sửa / gửi lại gần giống / "sai rồi"; nút 👎 dưới câu trả lời; gom thành bộ đề thử, chạy lại mỗi lần đổi prompt (`scripts/exp-exam-cost.mjs`, `eval:slides`). Làm trước khi bật thanh toán.
5. **Model mạnh đỡ ca khó:** lượt đầu flash; không áp được / bấm Thử lại → tự chuyển model mạnh hơn (vd. DeepSeek Pro).

Việc còn treo khác:

- **Đổi model chính sang DeepSeek chính hãng** (người dùng chắc chắn đổi): đặt `DEEPSEEK_API_KEY` trên Vercel (Production + Preview), nạp tiền, đưa DeepSeek lên đầu chuỗi trong `llmProxy.ts`. Đo phiên này: nhanh gấp 2–3 lần opencode, đắt hơn ~1–3 điểm/đề.
- **Thanh toán PayOS** (phiên riêng): tạo đơn + webhook cộng điểm; thay QR mẫu trong `Pricing.tsx` (dấu `TODO PayOS`); `boughtPacks()` trong `src/lib/pricing.ts` đọc bảng đơn nạp; bật `PRICING_PUBLIC` khi người dùng bảo. Cùng lúc nên đổi cách tính điểm sát giá DeepSeek (token ra đắt ×4 token vào, phần cache gần như miễn phí) — xem mục Giá.
- **Streaming chưa thử trên Vercel thật** (đã có bản preview nhưng người dùng chưa xác nhận). Nếu Vercel gom luồng: số giây vẫn chạy nhưng không có dòng chạy theo, các bước xong cùng lúc.
- **Tiến độ slide chưa xem tận mắt trên giao diện** (đã chạy qua script đo, 10 bộ không hỏng).
- Dòng chạy theo lúc "Viết đề" hiện LaTeX thô (`$\begin{cases}…`), có thể làm sạch.
- **Bẫy worktree:** agy tạo worktree rồi tạo liên kết `node_modules` trỏ về `node_modules` của dự án chính. `git worktree remove` trên Windows **đi theo liên kết và xoá mất một nửa `node_modules` chính** (mất `.bin`, `tsc` không chạy). Đã `npm install` lại. Lần sau: `unlink <worktree>/node_modules` trước, rồi mới `git worktree remove` / `rm -rf`. Thư mục `../dethinhbien-bang-gia` đã xoá.
- File chưa commit, hỏi trước khi đụng: `.claude/`, `.rls-audit/`, `.strix/`, `public/brand/logo-120*.png`, `scripts/probe-imports.mts`.

## Đã làm

| Commit | Nội dung |
|---|---|
| `62f8333` | Đầu/chân trang kiểu Word, khổ giấy, khối 2–3 cột, menu chuột phải (soạn đề kiểu Word, slide kiểu PowerPoint, có liên kết), Chèn → Hình dạng, bảng màu thống nhất (`ColorPalette`, `HexInput`), căn đều slide, kéo vùng chọn nhiều phần tử + nhóm kiểu Canva |
| `d9443a7`, `cbc8bf4` | Bấm đúp công thức mở hộp Công thức để sửa; bảng lệnh nhanh 6 nhóm (`mathSnippets.ts`), ribbon dùng chung hộp |
| `65fd523` | AI soạn đề chỉ dùng nguồn giáo viên tự thêm (bỏ tự lấy đề đã lưu / web); tự sửa tam giác vuông lệch đỉnh (`fixRightAngleCoords`) |
| `f5d2548` (agy) | Mọi modal giữa màn hình mở bằng `anim-pop` |
| `e9697a3` | **Strix 6**: hạn mức báo cáo/góp ý chạy thật (`auth.role()` thay `current_user` trong hàm SECURITY DEFINER), chặn xoá đề đang bị báo cáo (`exam_has_open_report`), đề đã gỡ không sửa được, moderator không xử lý báo cáo đề của mình, **nonce đăng nhập Google** (`auth_flow` + sessionStorage), sổ điểm đọc hết theo trang |
| `ffe79db` | **Nhập .pptx giữ bố cục** (`src/lib/pptxImport.ts`: vị trí, hình prst, màu theme, phông, cỡ, ảnh, bảng, nhóm, nền, master/layout, placeholder kế thừa); giới hạn 40 MB / 150 slide |
| `467d8ac` (agy) | Trang chủ trên điện thoại 9.800px → 5.700px (hàng thẻ vuốt ngang), desktop giữ nguyên |
| `c3c3ceb` | **`AGENTS.md`** luật chung cho mọi AI (`CLAUDE.md`, `GEMINI.md` trỏ về) |
| `4655974`, `6149b35`, `739e73e`, `f5d8151` | **`/api/llm` stream SSE** + nhật ký soạn đề/slide kiểu app code, suy nghĩ tiếng Việt (xem dưới) |
| `2dcc643` | Lời giải ≠ hướng dẫn giải (prompt); AI thấy công thức + số câu khi sửa đề; cung các góc chung đỉnh tách bán kính; thang tự dựng tường |
| `e6a9b1e` (agy) + merge `64b4f87` | **Trang Bảng giá** `/bang-gia` (chỉ admin xem) |

## Stream AI + nhật ký (quan trọng cho phiên sau)

- **Server** `server/llmProxy.ts`: body `stream: true` → gọi upstream `stream:true` + `include_usage`, đọc dần (`readUpstreamSse`), gửi SSE: `think` (mẩu suy luận, gom ~250 ms), `delta` (chữ trả lời), `retry` (đổi model / gọi lại), cuối `done` (payload như JSON thường) hoặc `error`. Chỉ mở luồng khi upstream đầu tiên trả 200; lỗi trước đó vẫn trả JSON. Ping 15 s giữ kết nối.
- **Trừ điểm:** server đọc hết upstream rồi tự trừ **kể cả khi client đóng tab**; luồng đứt giữa chừng → trừ theo phần đã nhận (prompt + độ dài/3), không mức trần; đứt thì sang model dự phòng ngay. Test: `npm run test:ai-stream` (15 ca), `test:ai-abuse` vẫn qua.
- **Client** `src/lib/llm.ts`: `opts.onProgress` → tự gửi `stream:true`, nhận `LlmProgress {phase, thinking, text}`.
- **Panel** `AiPanel.tsx`: soạn đề dùng `log: ActStep[]` (`ActLog`): Đọc nguồn / Tìm trên web (chỉ khi có) → Suy nghĩ (số giây + dòng suy luận chạy theo) → Viết đề (`N/T câu`, câu đang viết) → Đưa vào đề. Đã bỏ hai bước giả "Đọc yêu cầu", "Tìm nguồn tham khảo". Slide: `DeckProgress` có `written` (đếm cả trang trong lô đang chạy) + `live`.
- **Suy nghĩ tiếng Việt:** hằng `THINK_VI` nối vào system prompt soạn đề và lô slide (chỉ khi stream). Model mặc định nghĩ tiếng Anh, lẫn "Hmm… actually".
- Bẫy: sửa `server/` khi dev server đang chạy có lúc trang vẫn dùng code cũ → `preview_stop` rồi `preview_start` lại.

## Số đo (eval-out/exp/summary-*.json, eval-out/vi-cmp/)

Đề Toán THPT QG 22 câu, giám khảo flash mức max chấm câu sai:

| | Đề | Token TB | Câu sai | Thời gian |
|---|---|---|---|---|
| opencode cũ / tiếng Việt | 8 / 7 | 24.600 / 26.200 (±2.600) | 4/176 / 1/154 | 195 / 209 s |
| DeepSeek cũ / tiếng Việt | 8 / 7 | 31.100 / 32.200 (±3.000) | 3/176 / 2/154 | 95 / 97 s |

Slide ƯCLN 15 trang, 5 bộ mỗi bản: cũ 41.100 token, điểm thiết kế 6,70; tiếng Việt 36.600 token, 6,74. Kết luận: tiếng Việt không giảm chất lượng, token chênh trong mức nhiễu. Một lượt DeepSeek trả JSON dính chữ sau (script không đọc được; app có bộ sửa JSON).

Script: `node scripts/exp-exam-cost.mjs OC OV A AV --n 5` (OC/OV = opencode, A/AV = DeepSeek, V = thêm `THINK_VI`; cần `eval-out/exp/system.txt` từ `EVAL_DUMP=1 node scripts/eval-exam.mjs dump` → lấy `system` trong `eval-out/exam-dump.json`). Slide: `node scripts/eval-slides.mjs "<chủ đề>" --batch --slides [--vi] --out <thư mục>` rồi `node scripts/judge-slides.mjs <thư mục>`.

## Giá (bảng giá đang dùng)

`src/lib/pricing.ts`: 1.000đ = 25 điểm (40đ/điểm), nạp 2.000–100.000đ; gói 2k/5k/10k/20k/50k, thưởng 0/5/10/15/20% **chỉ lần nạp đầu của đúng gói đó**; tự nhập không thưởng. Lý do: DeepSeek flash giờ cao điểm $0,30/M vào, $1,20/M ra → đề ~550đ chi phí, mỗi điểm ~22đ → lãi ~50% (30% ở gói thưởng 20%). Giá DeepSeek lấy từ trang tổng hợp, chưa đối chiếu trang chính thức. Còn phải tính phí PayOS + thuế.

## Khác

- Strix 6 migration: hàm `exam_has_open_report(uuid)` SECURITY DEFINER chỉ trả lời cho chủ đề (policy xoá không đọc thẳng `reports` được vì bảng không có SELECT cho client).
- Supabase Redirect URLs đã có `/**` cho dero.id.vn, de-ro-lac.vercel.app, localhost:5184/5185, 127.0.0.1:5184 (cần cho `?auth_flow=`). Link xác nhận email đăng ký không còn tự đăng nhập (chống gài phiên).
- Agy làm song song **phải dùng worktree riêng** (hai lần agy đổi nhánh thư mục chính làm commit của Claude rơi nhầm nhánh). Prompt giao agy mẫu: `docs/prompt-bang-gia.md`.
