# Kế hoạch gỡ rối phần AI (nhánh `refactor/ai`)

Rà ngày 25/11/2026. Mới đọc và lập kế hoạch, **chưa sửa code nào theo kế hoạch này**.
Chưa đọc kỹ: `server/llmProxy.ts`, `slideAi.ts`, `slideEdit.ts`, `aiDeck.ts`, `examAiResult.ts` (ngoài đoạn áp kết quả).

## Hiện trạng

15 tác vụ trong `server/aiTasks.ts`: `soan-de`, `hoi-truoc`, `slide-chat`, `slide-sua`, `slide-lo`, `slide-trang`, `bang-ve`, `tim-web`, `de-online`, `sua-cau`, `ve-do-thi`, `chon-hinh`, `ngan-hang`, `ma-tran`, `sua-slide`.

### 1. Đoán ý bằng từ khoá rồi ép model theo (gốc của phần lớn lỗi "siết cứng")

| Chỗ | Đoán gì | Đoán sai thì |
|---|---|---|
| `examIntent`, `chatOnly` (`aiDocContext.ts`) | hỏi đáp hay sửa đề | đổi prompt, đổi quyền thay cả đề, đổi cách hiện |
| `detectIntent` (`AiPanel.tsx`), `looksLikeEdit` (`slideEdit.ts`) | slide: hỏi, lập dàn ý mới, hay sửa | đi nhầm hẳn tác vụ (`slide-chat` ↔ `slide-sua`) |
| `rewritesWholeExam` | được thay cả đề không | kết quả bị từ chối |
| `needsAskFirst` (`AiAskPanel.tsx`) | có hỏi lại không | tốn thêm một lượt hoặc soạn bừa |
| `planExamSplit` (`examSplit.ts`) | chia nhiều lượt không | một lượt hết token |
| `allowLegacy`, `comparison` (`AiPanel.tsx`) | loại bỏ lệnh sửa slide | lệnh đúng bị vứt |
| `WANTS_HARDER` (`exam.ts`, mới thêm) | ghép luật độ khó | luật không được ghép |
| `figureGuideFor`, `khungPrompt.ts` | cắt bớt hướng dẫn theo môn / lớp | model thiếu thông tin (chỉ để tiết kiệm, ít rủi ro hơn) |

Bảng vẽ làm khác: `BOARD_OPS_GUIDE` để model tự chọn trả lệnh vẽ hay trả chữ, web nhận cả hai. Đề và slide nên theo cách này.

### 2. Prompt chồng chéo, không khớp nhau

- Soạn câu hỏi có hai bộ hợp đồng JSON: `exam.ts` và `de-online.ts`.
- `ve-do-thi.ts` tả lại cấu hình đồ thị đã có ở mục 1 của `figureGuide.ts`.
- Luật phạm vi (`SCOPE_RULE`) chỉ có ở soạn đề; slide và bảng vẽ không có.
- Công thức: chat slide dặn dùng Unicode, "không dùng LaTeX"; dàn ý Pro dặn dùng LaTeX.
- Slide HTML (`variant: 'html'`, `htmlDeckPrompt.ts`): client không còn gửi, chỉ còn test dùng.
- `exam.ts` là một chuỗi dài, luật vá dồn qua nhiều lần sửa; không có cách biết luật nào còn tác dụng.
- Kho hình mẫu trước đây chỉ gửi cho `chon-hinh`; soạn đề không thấy (đã gửi thêm một phần, chỉ khi đòi khó hơn).

### 3. Luồng gọi và gọi lại nằm trong giao diện

`AiPanel.tsx` hơn 2.000 dòng, gánh cả đề, slide, bảng vẽ. Mỗi nhánh tự viết kiểu gọi lại riêng (dàn ý hỏng, áp đề hỏng, xin lại bằng chữ, sửa slide rỗng, một phần đề tách hỏng, một trang slide lỗi).

### 4. Không đo được

Test hiện có kiểm prompt đúng từng byte và kiểm code áp kết quả. Không có bộ yêu cầu thật để biết một lần sửa prompt làm AI tốt lên hay xấu đi.

## Các bước (mỗi bước một đợt commit, dừng lại để duyệt)

### Bước 0. Bộ câu thử
- `scripts/ai-cases/` gồm khoảng 30 yêu cầu: sửa đề, hỏi đáp, nói lửng ("câu 5 chưa ổn"), ngoài luồng, đòi khó hơn, slide, bảng vẽ.
- Mỗi ca ghi điều phải đúng và kiểm được bằng máy (trả lệnh sửa hay trả chữ, đụng đúng khối, hình dựng được). Độ khó và độ đẹp vẫn chấm bằng mắt.
- Chạy bằng DeepSeek (tốn tiền thật), đo thêm token và thời gian.
- Xong khi: có số nền của bản hiện tại.

**Đã làm (25/11):** `scripts/ai-cases/` có 29 ca, chạy `npm run build:prompts` rồi `npm run eval:ai -- --label <tên>` (thêm `--dry` để chỉ xem web đoán gì, `--only id1,id2`).

Số nền: **28/29**, mỗi ca chạy một lần (nhánh này, kể cả hai thay đổi độ khó chưa commit). Gộp đợt `nen` với đợt chạy lại `nen-sua` sau khi sửa hai lỗi của chính trình chạy.

- Ca trượt: `sua-noi-lung-slide` ("slide 3 chữ nhiều quá" bị đẩy sang lập dàn ý mới thay vì sửa slide 3).
- Web đoán là "hỏi đáp" ở 4 ca giáo viên muốn sửa đề (`sua-noi-lung`, `sua-than-phien`, `de-hon`, `them-hinh`). Cả bốn vẫn đạt nhờ bản sửa `ac402fc`.
- Thời gian: đa số dưới 20 giây; hai ca đòi khó hơn mất 65 và 122 giây, tốn 7.800 và 13.000 token ra.

Chưa đo được: hội thoại nhiều lượt, tệp đính kèm, tìm trên web, đề dài, slide viết từng trang, độ đúng của đáp án và độ khó. Điểm cao ở đây không có nghĩa là hết lỗi; mỗi lỗi giáo viên gặp thật nên thêm thành một ca.

### Bước 1. Thôi ép model theo từ khoá
- Đề: một prompt duy nhất, model tự chọn trả JSON sửa đề hay trả chữ. Bỏ câu ghép theo `intent`.
- Slide: gộp quyết định hỏi / sửa vào model. Làm sau đề, vì khác tác vụ và khác định dạng.
- Từ khoá chỉ còn dùng cho giao diện (tên bước đang chạy).
- Chặn việc nguy hiểm (thay cả đề, mất hình) bằng code khi áp, như hiện có.
- Chú ý: thống kê và miễn điểm đang dựa vào `intent` (`aiKind` trong `server/ops.ts`) → phải gắn nhãn theo kết quả trả về.
- Xong khi: không ca nào trong bộ thử bị vứt kết quả hay báo lỗi vì đoán sai.

**Đã làm (25/11):** bộ thử 30 ca (thêm `bai-moi-khi-da-co`) đạt **30/30**, mỗi ca một lần. Chưa thử trên web.

- Đề: prompt không còn đổi theo `intent`; model tự chọn JSON hay chữ; quyền thay cả đề chỉ phụ thuộc đề đang có nội dung và `rewritesWholeExam`.
- Slide: đã có bài thì luôn vào `slide-sua`, model chọn lệnh sửa / chữ / `{"action":"new_deck"}`; bỏ `looksLikeEdit` khỏi luồng gửi (hàm còn trong `slideEdit.ts` cho test, xoá ở bước 2).
- Đổi kèm theo: lượt hỏi đáp trong đề giờ cũng nhận khung chương trình Toán và đọc nguồn như lượt soạn. Câu hỏi về bài slide đang mở bị gắn nhãn `edit-slide` thay vì `question` trong thống kê admin (chưa sửa `aiKind`).
- Còn từ khoá chi phối: `chatOnly` (giữ đề khi giáo viên bảo chỉ xem trong chat), `rewritesWholeExam`, `requirePatch` (`ComposeDoc.tsx`), `needsAskFirst`, `planExamSplit`, `allowLegacy` / `comparison` (lọc lệnh slide), `WANTS_HARDER`.
- Slide HTML và `variant: 'chat'` giờ không còn client nào gọi (bước 2).

### Bước 2. Gọn prompt
- Xoá phần slide HTML không còn dùng.
- `ve-do-thi` dùng lại mục đồ thị của `figureGuide`.
- Một lõi chung (giọng, công thức, phạm vi), mỗi tác vụ chỉ thêm định dạng cần trả.
- Trong `exam.ts`: bỏ thử từng nhóm luật; bộ thử không xấu đi thì xoá.
- Xong khi: prompt ngắn hơn (đo ký tự và token), số ca đạt không giảm.

**Đã làm (25/11):** bộ thử 30/30.
- Xoá prompt slide HTML (`htmlDeckPrompt.ts`), prompt hỏi đáp slide (`SLIDE_SYSTEM`, hết luôn mâu thuẫn Unicode / LaTeX) và `looksLikeEdit`. `variant: 'chat'` còn nhận cho tab mở từ bản cũ. Hiển thị slide HTML đã lưu giữ nguyên.
- `exam.ts`: gộp hai đoạn "giải lại trước khi trả". Prompt soạn đề gần như không ngắn đi (36.414 → 36.291 ký tự).
- Không làm: `ve-do-thi` dùng lại `figureGuide` (khác định dạng trả về, phần trùng vài dòng); lõi chung (sau khi xoá `SLIDE_SYSTEM` còn quá ít để gộp, thêm luật phạm vi vào slide / bảng là siết thêm); bỏ thử từng nhóm luật trong `exam.ts` (bộ thử chưa chấm được đúng sai, độ khó, định dạng nên không biết bỏ có hại không).

### Bước 3. Tách `AiPanel`
- Giao diện chat riêng; ba luồng đề / slide / bảng vẽ riêng; một hàm gọi lại dùng chung.
- Chỉ chuyển code, không đổi hành vi. File CRLF: giữ nguyên kiểu xuống dòng.

**Đã làm (25/11):** `AiPanel.tsx` 2.073 → 957 dòng (còn giao diện chat và `send`). Phần chuyển sang `src/examEditor/ai/`: `turns.ts` (kiểu lượt chat), `chatParts.tsx` (mảnh hiển thị), `slideGen.ts` (sinh slide), `flowKit.ts` (ngữ cảnh lượt, `askAgain`, nhật ký stream), `examFlow.ts`, `slideFlow.ts`, `boardFlow.ts`. Biến `examSteps` (luôn bằng true) đã bỏ. Hai chỗ gọi lại còn viết riêng vì không nối thêm lời dặn: một phần đề tách bị hỏng, và sửa trang slide.

## Chưa quyết

- Câu rất khó (mức hình tuyển sinh 10): chỉnh prompt trên `deepseek-flash` mức `low` đã thử ba vòng, chưa đạt. Cần đo model mạnh hơn bằng bộ thử ở bước 0, tách khỏi việc gỡ rối.
- Có giữ luật từ chối câu ngoài luồng không (đang giữ để đỡ tốn tiền).

## Lưu ý khi làm

Sửa chữ prompt phải cập nhật bản chụp trong `scripts/fixtures/` và chạy `npm run build:prompts`.
