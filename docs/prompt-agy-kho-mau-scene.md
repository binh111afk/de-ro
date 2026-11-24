# Giao việc: viết kho hình mẫu cho AI vẽ hình (`scene`)

Thư mục làm việc: worktree `dethinhbien-update-tool-scene`, nhánh `feat/update-tool-scene`. **Không commit, không đổi nhánh, không push.** Agent giao việc sẽ rà rồi tự commit.

## Bối cảnh

Khi giáo viên bấm "Vẽ hình minh hoạ", AI (model rẻ, yếu) đọc đề rồi trả một object JSON. Với hình tự do, nó viết lệnh `scene` (ngôn ngữ vẽ riêng của dự án). Model yếu tự ghép lệnh từ hướng dẫn chung rất hay sai bố cục, nhưng **chép theo mẫu thì rất giỏi**. Vì vậy server chọn 2–3 hình mẫu có từ khoá gần đề nhất (`pickSceneExamples`) và ghép vào prompt. Việc của bạn: viết kho mẫu đó.

## Đọc trước

1. `AGENTS.md` (luật chung, đặc biệt mục CRLF và "báo kết quả trung thực").
2. `src/lib/prompts/sceneExamples.ts`: định dạng mẫu + 5 mẫu có sẵn + hàm chọn mẫu. **Bạn chỉ sửa file này.**
3. `src/lib/scene.ts` (`SCENE_HELP`) và mục `5c` trong `src/lib/prompts/figureGuide.ts`: toàn bộ cú pháp `scene`.
4. `scripts/test-scene-free.ts`: nhiều ví dụ lệnh chạy được (kể cả 3D: `góc nhìn xiên`, điểm `A(x; y; z)`, `mặt …`).
5. `eval-out/scene-eval/cases.ts`, `cases-holdout.ts`, `cases-kin.ts`: các đề dùng để chấm. **Chỉ đọc để tránh trùng** (xem luật 1).

## Việc cần làm

Thêm **45–55 mẫu** vào `SCENE_EXAMPLES`, phủ các dạng sau (mỗi dạng 1–3 mẫu, chọn tình huống hay gặp trong đề Việt Nam lớp 6–12):

- Toán ứng dụng: góc nâng / góc hạ (hải đăng nhìn thuyền, hai điểm quan sát), thang trượt, dốc đường, cột cờ bị gãy, đo khoảng cách qua sông.
- Hình phẳng: tiếp tuyến từ điểm ngoài, góc nội tiếp, tam giác nội tiếp có đường cao / trực tâm, hình thang / hình bình hành có đường chéo, hình viên phân, hình vành khuyên, hình quạt (quạt giấy), phần tô giữa các cung, đường chạy sân vận động, cổng parabol (`cong`).
- Hình không gian (3D): hình hộp chữ nhật có đường chéo, lập phương, chóp tứ giác đều, chóp tam giác có cạnh vuông góc đáy, lăng trụ tam giác, trụ, nón, cầu nội tiếp, bể nước có mực nước.
- Vật lý: mặt phẳng nghiêng có vật và lực, ròng rọc, đòn bẩy, con lắc đơn, tia sáng phản xạ gương phẳng, khúc xạ qua mặt nước, thấu kính hội tụ dựng ảnh.
- Sơ đồ: chu trình / sơ đồ khối (hộp + mũi tên), sơ đồ mạng nút, bản đồ đơn giản có hướng Bắc và khoảng cách.

Mỗi mẫu:

- `id`: chữ thường không dấu, gạch nối, không trùng.
- `tags`: 2–5 cụm từ khoá **đặc trưng** của dạng đó (vd. `góc hạ`, `ngọn hải đăng`, `ròng rọc`). **Không** dùng cụm chung chung xuất hiện ở mọi đề (`tam giác`, `đường tròn`, `tính`, `hình vẽ`, `độ dài`): chúng làm server chọn sai mẫu.
- `problem`: đề ngắn ≤ 250 ký tự, đủ số liệu.
- `json`: dùng helper `scene([...])` như các mẫu có sẵn, ≤ 900 ký tự. Nếu dạng đó có công cụ riêng hợp hơn (`venn`, `clock`, `circuit`…) thì **bỏ**, kho này chỉ cho `scene`.

## Luật bắt buộc

1. **Không trùng đề chấm.** Không viết mẫu cùng tình huống với bất kỳ đề nào trong ba file `cases*.ts` (vd. đã có đề "tháp + góc nâng 35°" thì không viết mẫu tháp góc nâng; viết hải đăng góc hạ thì được). Lần trước một agent đưa lời giải của chính đề chấm vào prompt, điểm đẹp giả; lần này sẽ chấm bằng bộ đề mới bạn không thấy.
2. **Chất lượng kiểu sách giáo khoa:** toạ độ tỉ lệ đúng số liệu (thang 5 m dựa tường cách 1,5 m thì đỉnh ở y ≈ 4,77), nhãn không đè nhau, không đè lên nét, số ghi trên hình khớp đề, chỉ ghi điều đề cho hoặc hỏi (dấu `?`), nét đứt cho đường phụ / đường khuất, điểm phụ không cần tên thì dùng `_`.
3. **Mẫu nào cũng phải tự xem bằng mắt** trong trình duyệt, không chỉ chạy test. Chạy dev server riêng cổng **5196**: `npm run dev -- --port 5196 --host 127.0.0.1`. Trên trang `http://127.0.0.1:5196/`, render bằng `toolFromRaw` (`/src/lib/docRewrite.ts`) + `prepareToolDoc` (`/src/lib/objects.ts`, để tải hình vật như cây, người, thang) + `renderTool` (`/src/lib/toolSpec.ts`). Đổi PNG bằng `@napi-rs/canvas` sẽ **mất chữ**, đừng dùng để chấm.
4. Gặp lệnh vẽ sai hoặc thiếu lệnh cần thiết: **không sửa bộ vẽ**, chọn cách vẽ khác hoặc bỏ mẫu, rồi ghi vào báo cáo.
5. **Không gọi API AI nào** (tốn tiền).
6. Chỉ sửa `src/lib/prompts/sceneExamples.ts` và tạo file trong `eval-out/scene-kho/`. Giữ nguyên kiểu xuống dòng của file (kiểm `git ls-files --eol` và `git diff --stat`).

## Kiểm trước khi báo xong

- `npm run test:scene` qua (test mục 13 kiểm mọi mẫu vẽ được, id không trùng).
- `npx tsc -p tsconfig.app.json --noEmit` qua.
- `eval-out/scene-kho/gallery.html`: một trang tĩnh chứa SVG của mọi mẫu (đã tải hình vật), mỗi ô ghi `id` + đề, để người rà xem nhanh.

## Báo cáo: `eval-out/scene-kho/bao-cao.md`

- Bảng: `id` | dạng | tags | tự chấm 1–10 | ghi chú.
- Các mẫu đã bỏ và lý do.
- Lỗi / thiếu sót của bộ vẽ gặp phải (lệnh nào, hiện tượng, cách đã né).
- Xác nhận đã kiểm luật 1 (liệt kê đề chấm gần nhất với từng mẫu dễ nhầm, và vì sao khác).
