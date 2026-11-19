# Prompt giao agent: chuyển prompt các chỗ gọi AI nhỏ lên server

> Đọc `AGENTS.md` và `context.md` trước. Việc này **máy móc nhưng phải giữ nguyên từng ký tự prompt**: chất lượng AI không được đổi.

## Bối cảnh

Trước đây client tự ghép system prompt rồi gửi cả `messages` (có `role: 'system'`) lên `/api/llm`: ai mở tab Network cũng chép được prompt và dùng `/api/llm` như ô chat tự do (vẫn trừ điểm của họ). Agent mạnh đã dựng khung ở nhánh `feat/prompt-server`: client gửi `task` + dữ liệu người dùng, **server tự ghép system prompt** và bỏ mọi `role: 'system'` client gửi kèm. Đã chuyển xong: soạn đề (`soan-de`) và hỏi trước (`hoi-truoc`). Việc của bạn: chuyển các chỗ gọi AI nhỏ còn lại theo đúng mẫu đó.

## Làm việc ở đâu

- Nhánh gốc: `feat/prompt-server` (phải đã được commit; chưa có thì dừng và báo người dùng). Tạo nhánh riêng: `git switch feat/prompt-server && git switch -c feat/prompt-server-nho`. Không commit lên `main`, không động tới `feat/prompt-server`.
- **Không sửa `src/examEditor/AiPanel.tsx`** (agent mạnh đang chuyển slide / bảng vẽ ở file đó, sửa chung là xung đột). Các chỗ trong file đó **không thuộc việc này**.
- Nhiều file là CRLF: sửa bằng công cụ sửa file, kiểm `git ls-files --eol <file>` và `git diff --stat` sau mỗi file (xem AGENTS.md mục 3).

## Đọc trước (mẫu đã làm)

| File | Vai trò |
|---|---|
| `src/lib/prompts/common.ts`, `exam.ts`, `sources.ts`, `figureGuide.ts` | chữ prompt, **module thuần**: không import `@/…` hay gì phụ thuộc trình duyệt; import tương đối phải có đuôi `.js` (server chạy ESM trên Vercel) |
| `server/aiTasks.ts` | bảng `TASKS`: tên tác vụ → hàm kiểm dữ liệu client gửi → trả system prompt (hoặc `null` nếu sai kiểu) |
| `server/llmProxy.ts` | đoạn xử lý `body.task`: dựng system, bỏ `role: system` của client |
| `src/lib/llm.ts` | tuỳ chọn `task: { name, input }` của `callLlm` |
| `scripts/test-ai-prompts.ts`, `scripts/fixtures/prompt-exam-snap.json` | test khẳng định prompt server ghép **khớp từng byte** bản chụp trước khi chuyển |
| `scripts/test-ai-stream.ts` (mục 7) | test server: system do server ghép, system của client bị bỏ, task lạ bị 400 |

## Việc cần làm (mỗi dòng một tác vụ)

| Chỗ gọi (client) | Prompt đang nằm ở | Tên task | Client chỉ được gửi (dữ liệu người dùng) |
|---|---|---|---|
| `src/components/OnlineAiBox.tsx` (dòng ~70) | `systemPrompt(meta, questions)` trong `src/lib/onlineAi.ts` (+ `DIFFICULTY_RULE`) | `de-online` | `meta`, `questions` (dữ liệu đề), lời người dùng ở message `user` |
| `src/lib/docRewrite.ts` (dòng ~33) sửa / viết lại câu | `SYSTEM` | `sua-cau` | đoạn đang chọn, yêu cầu |
| `src/lib/docRewrite.ts` (~68) vẽ đồ thị | `PLOT_SYSTEM` | `ve-do-thi` | đề bài, ngữ cảnh |
| `src/lib/docRewrite.ts` (~147) chọn hình minh hoạ | `TOOL_SYSTEM` (dùng `FIGURE_GUIDE` từ `src/lib/prompts/figureGuide.ts`, đã tách sẵn) | `chon-hinh` | đề bài, ngữ cảnh |
| `src/lib/bankImport.ts` (~93) | chuỗi `'Bạn là giáo viên Việt Nam ra đề theo chương trình GDPT 2018…'` + phần ghép sau nó | `ngan-hang` | tham số người dùng chọn (môn, lớp, chủ đề, số câu…) |
| `src/lib/matrixExam.ts` (~197) | `system` ghép trong hàm quanh dòng 197 | `ma-tran` | danh sách câu hỏi cần phân loại (đúng dữ liệu hàm đang đưa vào message `user`) |
| `src/lib/slideRewrite.ts` (~53) | `SYSTEM` | `sua-slide` | đoạn slide đang chọn, yêu cầu |

Cùng cách làm cho mọi dòng. Khi chuyển một chỗ mà thấy prompt dùng chung với chỗ khác (như `FIGURE_GUIDE`), tách phần chữ ra `src/lib/prompts/` một lần, hai bên cùng import.

## Cách làm từng tác vụ

1. **Chụp chuẩn trước khi sửa.** Viết script nhỏ (hoặc test) gọi đúng hàm đang ghép prompt với 2–3 bộ đầu vào đại diện, lưu `{tên, độ dài, sha256}` của system prompt vào `scripts/fixtures/prompt-<tác vụ>-snap.json`. Làm bước này **trước** khi đổi bất cứ file nào của tác vụ.
2. **Tách chữ prompt** sang `src/lib/prompts/<tác vụ>.ts`: copy nguyên văn, không sửa chữ, không "dọn" khoảng trắng, không đổi thứ tự ghép. Hàm xây `build<Tác vụ>System(input)` nhận dữ liệu người dùng và trả đúng chuỗi cũ. Chỗ cũ ở client chỉ còn gọi `callLlm(messages không có system, { task: { name, input } })`; không giữ lại chữ prompt ở client.
3. **Đăng ký ở server**: thêm vào `TASKS` trong `server/aiTasks.ts`. Hàm kiểm: mỗi trường là chuỗi thì cắt độ dài (xem `str()`), mảng thì cắt số phần tử, kiểu sai trả `null`. Không tin client: mọi thứ client gửi là dữ liệu, không phải chỉ dẫn.
4. **Test byte**: thêm vào `scripts/test-ai-prompts.ts` (hoặc file test mới, thêm vào `package.json` gần `test:ai-prompts`) so `build<Tác vụ>System(...)` với bản chụp bước 1. Phải khớp từng byte.
5. **Test server**: thêm ca vào `scripts/test-ai-stream.ts` (mục 7): gửi `task` mới, kiểm system server ghép có mặt, system của client bị bỏ.
6. Chạy bộ kiểm (bên dưới) rồi mới sang tác vụ kế tiếp. Mỗi tác vụ một commit riêng.

## Điều cấm

- Đổi chữ prompt, tham số `reasoningEffort`, `temperature`, `maxTokens`, cách xử lý kết quả của chỗ gọi (chỉ đổi chỗ prompt được ghép).
- Sửa `AiPanel.tsx`, `AiAskPanel.tsx`, `llmProxy.ts` phần chọn model / tính điểm / stream, hay `AI_REJECT_CLIENT_SYSTEM`. Cờ này **chỉ agent mạnh bật** sau khi mọi chỗ đã chuyển.
- Thêm thư viện. Ghi đường dẫn tuyệt đối ra ngoài dự án.
- Gửi chữ prompt, tên model hay nhà cung cấp về trình duyệt (kể cả lỗi): phản hồi lỗi chỉ báo chung.
- Gộp vào `main` hay push. Chỉ commit trên nhánh riêng khi người dùng bảo.

## Cách kiểm

```powershell
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.node.json --noEmit   # chỉ lỗi cũ JsonWebKey ở server/guard.ts là chấp nhận được
npm run test:ai-prompts
npm run test:ai-stream
npm run test:ai-abuse
git ls-files --eol <file đã sửa>         # cột i/ và w/ giống nhau
git diff --stat                          # file chỉ đổi vài dòng mà báo hàng trăm dòng = hỏng xuống dòng
```

Sau khi xong cả nhóm, gọi thử bằng tay từng tính năng trong app (dev: `npm run dev -- --port 5184 --host 127.0.0.1`, máy dev không cần đăng nhập): sửa câu, vẽ đồ thị, chọn hình, AI ngân hàng, ma trận, đề online, sửa slide. Mở tab Network, xem body gửi `/api/llm`: **không được còn chữ prompt hay `role: "system"`**, chỉ có `task`, `taskInput` và message `user`. Nói rõ tính năng nào chưa thử được.

## Mẫu báo cáo

```
Nhánh: feat/prompt-server-nho (commit …)
Đã chuyển: <tác vụ> (file, commit), …
Chưa chuyển / vướng: …
Test: tsc app ✓/✗, tsc node ✓/✗ (lỗi còn lại: …), test:ai-prompts ✓/✗, test:ai-stream ✓/✗, test:ai-abuse ✓/✗
Byte khớp bản chụp: <tác vụ> ✓ …
Đã thử tay trong app: … ; chưa thử: …
Body /api/llm còn chữ prompt / role system không: không / có ở …
```
