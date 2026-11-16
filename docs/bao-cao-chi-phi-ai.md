# Báo cáo chi phí AI: đề thi và slide

Tổng hợp ngày 15/11/2026 từ số đo thật trong [phiên 39](handoff/phien-39.md), [phiên 27](handoff/phien-27.md), [phiên 15](handoff/phien-15.md). Model: `deepseek-v4.1-flash`. **1 điểm AI = 1.000 token** (`TOKENS_PER_POINT`, `server/aiQuota.ts`).

## Chi phí một lần tạo

| | Mức low (app đang dùng) | Mức medium | Mức max |
|---|---|---|---|
| 1 đề Toán THPT QG | **~23.600 token ≈ 24 điểm**, ~160 s | ~31.100 token ≈ 31 điểm, ~214 s | ~34.300 token ≈ 34 điểm, ~240 s |
| 1 bộ 15 slide | **~41.000–44.000 token ≈ 41–44 điểm** | ~51.700 token ≈ 52 điểm | chưa đo |

- Slide gộp 4 slide mỗi lần gọi (`SLIDE_BATCH = 4`): 15 slide còn 5 lượt gọi, giảm từ ~71.000 xuống ~41.000 token.
- 120 điểm tặng lúc đầu (`AI_WELCOME_POINTS`) đủ cho khoảng **4–5 đề** hoặc khoảng **3 bộ slide**.
- Từ bản vá `eed3381`: nếu nhà cung cấp không báo số token đã dùng, server tính mức trần (prompt + toàn bộ phần trả lời cho phép), nên lượt đó có thể bị trừ cao hơn các số trên.
- Vẽ ảnh AI: 5 điểm/ảnh (`AI_IMAGE_POINTS`).

## Mức suy luận có ảnh hưởng chất lượng không

Mức suy luận đặt ở `AI_EFFORT` trong `src/examEditor/AiPanel.tsx`; cả đề lẫn slide đang để **low**.

- **Đề ở low:** đúng cấu trúc 12/4/6 câu, soát tay khoảng 15 câu không thấy sai.
- **Slide ở low:** chất lượng ngang medium.

Kết luận này có ba giới hạn:

- **Mẫu đo ít:** mỗi mức chỉ đo một lần, chỉ soát tay một phần đề, chưa có phép chấm chất lượng bài bản.
- **Chưa có số liệu cho đề khó:** đề chuyên Toán khó từng dùng khoảng 20.000 token suy luận ([phiên 27](handoff/phien-27.md)). Với loại đề này, low có thể yếu hơn, nhưng chưa ai đo.
- **Rủi ro lớn nhất là hết thời gian chờ:** quá thời gian chờ (250 s) thì app chuyển sang `mercury-3`. Đề do mercury soạn có ít nhất 3 câu sai (hai phương án bằng nhau, đáp án sai). Mức low nhanh hơn nên ít bị trường hợp này hơn.

## Thử giảm chi phí (15/11/2026): cách 1 và 2

Mục tiêu đặt ra: 1 đề còn ~10 điểm, 1 bộ 15 slide còn ~30 điểm, chất lượng không đổi đáng kể.

**Cách 1 — đầu vào lấy từ cache chỉ tính 1/10 điểm** (`billOf` trong `server/llmProxy.ts`, đọc `prompt_tokens_details.cached_tokens` hoặc `prompt_cache_hit_tokens`).
- Log thật: opencode (model chính deepseek) luôn báo `cached_tokens: 0`, kể cả khi gửi cùng một prompt 8.578 token ba lần. Nhà cung cấp này không giảm giá phần lặp lại.
- Vì vậy cách 1 **không giảm điểm với deepseek**. Nó chỉ có tác dụng khi rơi sang model dự phòng có cache (mercury-3 báo cache ~8.000/8.500 token). Vẫn giữ trong code vì vô hại và công bằng.

**Cách 2 — rút prompt soạn đề**: chỉ gửi những loại hình hợp với môn (`figureGuideFor` trong `src/lib/docRewrite.ts`). Ví dụ đề Toán không gửi kèm hướng dẫn mạch điện, thấu kính, phả hệ, công thức hoá…

| Lần đo (mức low) | Prompt | Suy luận | Đầu ra | Tổng | Điểm |
|---|---|---|---|---|---|
| Đề Toán, trước | 8.578 | 11.013 | 15.009 | 23.587 | ~24 |
| **Đề Toán, sau cách 2** | **6.299** | 11.999 | 16.438 | **22.737** | **~23** |
| 15 slide, trước | 33.632 | 5.558 | 10.559 | 44.191 | ~44 |
| 15 slide, đo lại (chưa đổi gì ở slide) | 40.808 | 4.190 | 9.687 | 50.495 | ~50 |

- Đề sau cách 2 vẫn đúng 12/4/6 câu, đủ 22 đáp án, JSON hợp lệ (chưa soát tay từng câu).
- Prompt đề giảm 27%, nhưng tổng chỉ giảm ~4% vì phần suy luận dao động giữa các lần chạy (±1.000 token).
- Slide không đổi code. Hai lần đo chênh nhau ~6.000 token chỉ vì model chọn bố cục khác nhau; đo một lần không đủ để kết luận nhỏ.

**Kết luận:** cách 1 + 2 chỉ bớt được khoảng 1 điểm/đề và 0 điểm/slide với deepseek qua opencode. Muốn đạt 10 điểm/đề và 30 điểm/slide phải đụng vào hai phần lớn nhất:
- **Đề:** phần suy luận (~11.000–12.000 token, gần một nửa tổng). Cần cách 3: giới hạn suy luận + server tự kiểm đáp án bằng code, hoặc tách lượt soạn/soát. Có rủi ro chất lượng, phải soát tay đủ 22 câu trước khi bật.
- **Slide:** phần đầu vào lặp lại 6 lần (~34.000–41.000 token). Cần rút prompt slide và/hoặc gộp 5 slide mỗi lượt (cách 4); hoặc đổi sang nhà cung cấp deepseek có cache (DeepSeek chính hãng tự cache, phần trùng chỉ ~1/10 giá, khi đó cách 1 tự có tác dụng).

## Thử cách 4 (15/11/2026): rút danh mục đồ hoạ + gộp 5 slide mỗi lượt

- **Danh mục đồ hoạ rút gọn** (`graphicShortlistText` trong `src/lib/slideGraphics.ts`): mỗi lượt chỉ gửi nhóm chính của môn + nhóm lớp học + các hình khớp từ khoá của chính các slide trong lượt, thay vì cả danh mục. Phần này giảm 8.418 → 4.355 ký tự mỗi lượt.
- **Gộp 5 slide mỗi lượt** (`SLIDE_BATCH` 4 → 5): 6 lượt gọi còn 5.

| 15 slide, mức low | Lượt gọi | Vào | Ra (suy luận) | Tổng | Điểm |
|---|---|---|---|---|---|
| Trước (đo 1) | 6 | 33.632 | 10.559 (5.558) | 44.191 | ~44 |
| Trước (đo 2) | 6 | 40.808 | 9.687 (4.190) | 50.495 | ~50 |
| **Sau cách 4** | **5** | **29.685** | 11.080 (5.437) | **40.765** | **~41** |

- Đầu vào giảm 12–27% so với hai lần đo trước. Tổng giảm ~8–19%, tức khoảng 3–10 điểm mỗi bộ.
- **Chất lượng (xem ảnh `eval-out/s-low-c4/1.png`):** đủ 15 slide, không slide nào hỏng, nội dung đúng (ƯCLN(24, 36) = 12, ƯCLN(18, 24) = 6, phân tích thừa số đúng), vẫn có đồ hoạ ở bìa/khởi động/định nghĩa. Lỗi nhỏ thấy được: slide Nội dung bài học bị lặp số thứ tự ("01 01 Định nghĩa…").
- **Chưa đạt mục tiêu 30 điểm.** Phần còn lại: dàn ý (~3.200 vào, ~3.700 ra), bối cảnh + dàn ý cả deck gửi lại mỗi lượt (~3.500 ký tự), và đầu ra thật của 15 slide (~5.000–6.000 token) không cắt được.

## DeepSeek chính hãng (15/11/2026)

Thay Mercury (Inception đã đóng cổng API) bằng DeepSeek chính hãng ở vị trí dự phòng 1: `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL=https://api.deepseek.com`, `DEEPSEEK_MODEL=deepseek-flash` (= DeepSeek-V4.1-Flash). Hiện chỉ đặt key ở máy dev. Proxy gửi `reasoning_effort` cho DeepSeek giống opencode (DeepSeek nhận tham số này).

- **DeepSeek có cache thật:** usage trả `prompt_cache_hit_tokens`. Thử cùng prompt 3.333 token hai lần: lần 2 trúng cache 3.199 token. Cách 1 (phần cache tính 1/10 điểm) có tác dụng với nhà cung cấp này.
- **Đảo thứ tự prompt slide:** phần giống nhau giữa các lượt (quy tắc, bối cảnh, dàn ý) đặt trước, danh mục đồ hoạ và đặc tả từng slide đặt sau. Cache chỉ khớp phần đầu trùng nhau.
- Đo bằng script với `EVAL_MODEL=deepseek-flash` (`scripts/lib/forceModel.ts` gửi kèm tên model, proxy gọi thẳng DeepSeek, bỏ qua opencode).

| Mức low, qua DeepSeek | Token thật | Trúng cache | **Điểm bị trừ** | Thời gian |
|---|---|---|---|---|
| Đề Toán, lần đầu (chưa có cache) | 24.908 | 0 | ~25 | 86 s |
| **Đề Toán, lần sau** | 24.812 | 6.144 | **~19** | 83 s |
| **15 slide, lần 1** (4 lượt) | 32.744 | 13.696 | **~20** | 28 s |
| **15 slide, lần 2** (5 lượt, có 1 lượt sửa) | 38.914 | 13.824 | **~26** | 35 s |

So với trước (opencode): đề ~24 điểm / 160 s, slide ~41–50 điểm / 90–100 s.

- **Slide đạt mục tiêu 30 điểm** (20–26 điểm), nhanh gấp ~3 lần.
- **Đề còn ~19 điểm, chưa đạt 10.** Phần suy luận vẫn ~14.000 token (DeepSeek chính hãng ở mức low còn suy luận nhiều hơn opencode ~12.000). Muốn xuống 10 điểm phải làm cách 3 (giới hạn suy luận + server tự kiểm đáp án).
- Cache chỉ trúng khi đã có người gửi cùng phần đầu prompt trong ít phút trước; lượt đầu tiên của ngày, hoặc hai lượt slide chạy song song cùng lúc, vẫn tính đủ.
- **Chất lượng:** đề đúng 12/4/6, đủ 22 đáp án, JSON hợp lệ (chưa soát tay từng câu). 15 slide (`eval-out/s-low-ds1/1.png`): đủ, không slide hỏng, phép tính đúng (ƯCLN(12, 18) = 6, ƯCLN(36, 48) = 12, U(120) có 16 ước, câu hỏi ƯCLN(18, 30) = 6).

## Thí nghiệm giảm chi phí soạn đề (16/11/2026)

Script `scripts/exp-exam-cost.mjs` gọi thẳng DeepSeek chính hãng (`deepseek-flash`) bằng đúng prompt soạn đề của app, mỗi cách 3 đề Toán THPT QG. Giám khảo: `deepseek-flash` mức suy luận max, tự giải lại từng câu và đếm câu sai (đáp án sai, hai phương án đúng, thiếu dữ kiện, hình không khớp). Tôi soát tay 2 lỗi giám khảo chỉ ra (đề A-2 câu 3 và câu 15): giám khảo đúng cả hai.

Tham số: DeepSeek tắt suy luận được bằng `thinking: {type: "disabled"}` (hoặc `reasoning_effort: "none"`); còn `reasoning_effort: "low"` thì **không khác** mặc định.

| Cách | Token / đề | Suy luận | Điểm* | Thời gian | Câu sai / 22 (3 đề) |
|---|---|---|---|---|---|
| A — như hiện tại (có suy luận) | 26.000–33.500 | 15.000–22.800 | 26–34 | 89–123 s | 0 · 0 · 2 |
| B — tắt suy luận | 12.300–13.600 | 0 | **12–14** | 26–31 s | **7 · 8 · 9** |
| C — tắt suy luận + lượt soát có suy luận | ~36.000 | ~19.700 | ~36 | ~124 s | 0 (1 đề; 2/3 lần lượt soát trả JSON hỏng) |
| **D — có suy luận, dặn suy luận gọn** | **25.600–26.400** | **15.300–16.200** | **20–21** | 83–91 s | **0 · 2 · 0** |

\* Điểm tính theo cách tính mới (phần cache 1/10). Các lượt A chạy song song lúc cache còn lạnh nên gần như không trúng cache; D chạy sau nên trúng ~6.000 token cache prompt. So sánh công bằng theo token: D ít hơn A ~10–20% và ổn định hơn (A dao động 15.000–22.800 token suy luận).

- **B (tắt suy luận)** rẻ nhất nhưng sai 7–9/22 câu mỗi đề, 12 câu trắc nghiệm đều đáp án A → **không dùng được**.
- **C (thêm lượt soát)** sửa được lỗi nhưng lượt soát phải giải lại cả 22 câu nên **tốn hơn cả A**, lại hay hỏng JSON → không đáng.
- **D (dặn suy luận gọn)**: thêm đoạn hướng dẫn vào cuối prompt ("trong phần suy nghĩ chỉ chọn số liệu và tính kiểm đáp án, không nháp lại đề…"). Chất lượng ngang A (2 câu sai / 66 câu, như A), độ khó như nhau (giám khảo chấm 3/5 cả hai — cả hai đều thiếu câu chốt chặn thật khó).

**Kết luận:** không có cách nào đưa đề xuống 10–15 điểm mà giữ được chất lượng; phần suy luận ~15.000 token là thứ giữ đáp án đúng. Cách đáng áp dụng là **D + DeepSeek chính hãng có cache**: ~20 điểm/đề lúc cache lạnh, ~19–20 khi trúng cache, nhanh ~85 s. Muốn thấp hơn nữa chỉ còn cách giảm số câu cần suy luận (ví dụ đề ngắn hơn) hoặc chấp nhận đề sai nhiều hơn.

## Đã áp dụng và chi phí hiện tại (16/11/2026)

**Đã áp vào web:**
- ~~Cách D~~: đã áp rồi gỡ (không lợi trên opencode, xem mục dưới).
- Từ các lần trước: hướng dẫn hình theo môn (cách 2), slide gộp 5 slide mỗi lượt và rút danh mục đồ hoạ (cách 4), phần cache tính 1/10 điểm (cách 1).
- **Model chính vẫn là opencode** (`deepseek-v4.1-flash`). DeepSeek chính hãng chỉ để trong `.env` máy dev làm dự phòng, chờ nạp tiền rồi tính.
- Cách D mới đo trên DeepSeek chính hãng; **chưa đo riêng trên opencode** (cùng dòng model V4.1-Flash nên dự kiến tương tự).

**Chi phí ước tính mỗi lần tạo (mức low):**

| | Opencode (đang chạy trên web) | DeepSeek chính hãng (khi chuyển làm model chính) |
|---|---|---|
| 1 đề Toán THPT QG | **~23–26 điểm** (đo 3 đề sau phiên 45: 23.147–26.103 token, trung bình **~25**) | **~22 điểm** khi cache lạnh, ~20 khi trúng cache (ước cộng thêm ~2.000 token prompt từ phiên 44–45) |
| 1 đề qua lượt hỏi lại (#2 + #3) | **~25–33 điểm** token thật (trung bình **~29** = ~11 lượt hỏi + ~18 lượt soạn; ~20–27 nếu lượt 2 trúng cache) | chưa đo riêng |
| 1 bộ 15 slide | **~34–41 điểm** (3 lần không lỗi sau phiên 45: 33.877–36.005 token, trung bình **~35**; lên ~41 nếu có lượt sửa) | **~20–26 điểm** lúc đông người dùng; ~28–30 khi cache lạnh |
| Thời gian | đề ~145–172 s (lượt hỏi ~7 s), slide ~80–100 s | đề ~85 s, slide ~30 s |

- 120 điểm tặng lúc đầu: với opencode khoảng **4–5 đề** (hoặc **3–4 đề** nếu đi qua lượt hỏi lại) hoặc **khoảng 3 bộ slide**; với DeepSeek chính hãng khoảng **5–6 đề** hoặc **4–6 bộ slide**.
- Trước đây opencode luôn báo `cached_tokens: 0`; trong lần đo ngày 16/11/2026 (sau phiên 45), opencode bắt đầu trả `cached_tokens` ở các lượt liên tiếp trong cùng phiên (6.144–10.496 token), nhưng không ổn định giữa các lần gọi rời (`0` ở nhiều lượt), nên bảng trên vẫn lấy token thật làm chuẩn bảo thủ.
- Các số dựa trên 1–3 lần đo mỗi trường hợp; mỗi lần chạy có thể lệch vài nghìn token (model chọn bố cục khác, có lượt sửa…).

**Chi phí đã tiêu cho thí nghiệm** (tài khoản DeepSeek chính hãng, 15–16/11): khoảng 600.000 token cho 12 đề + 12 lượt chấm + 3 bộ slide + vài lượt thử tham số.

## Cách D trên opencode (16/11/2026)

Đo bằng `scripts/exp-exam-cost.mjs O OD --n 3` (gọi thẳng opencode `deepseek-v4.1-flash`, mức low, cùng header `x-opencode-session` như proxy; giám khảo deepseek-flash mức max).

| Opencode, mức low | Token đề 1 · 2 · 3 | Trung bình | Câu sai | Ghi chú |
|---|---|---|---|---|
| O — prompt cũ | 22.287 · 23.115 · 18.177 | 21.193 | 0 · 0 · 0 | |
| OD — prompt có cách D | 19.856 · 22.945 · 23.087 | 21.963 | 3 · 1 · 0 | đề 1 hỏng cấu trúc: 26 câu, câu 14 lặp, câu đúng/sai 14–16 thiếu ý a)–d) |

- Trên opencode, cách D **không bớt token** (trung bình còn nhỉnh hơn ~800) và **chất lượng có dấu hiệu kém hơn** (4 câu sai / 70 câu so với 0 / 66, kèm 1 đề hỏng cấu trúc).
- Khác với DeepSeek chính hãng (ở đó D bớt ~11% token, câu sai không tăng). Opencode ở mức low vốn đã suy luận ít hơn (8.300–13.100 token), nên đoạn dặn "suy luận gọn" không còn gì để cắt mà lại làm model bỏ sót.
- Mẫu nhỏ (3 đề mỗi bên), nhưng không có lợi gì để bù rủi ro → **không nên dùng cách D khi model chính là opencode**.
- **Đã gỡ cách D khỏi web** (16/11/2026). Khi chuyển DeepSeek chính hãng làm model chính thì thêm lại, chỉ bật cho model đó. Ước tính chi phí đề trên opencode trở về **~21 điểm** (trung bình 3 đề prompt cũ: 21.193 token).

## Đo lại

```bash
LLM_TIMEOUT_MS=400000 npm run eval:exam -- max high medium low
node scripts/eval-ask-exam.mjs --effort low
npm run eval:slides -- "<chủ đề>" --batch --effort low
```

Log từng lượt gọi: bảng `ai_calls` trên Supabase, hoặc `%TEMP%/dethinhbien-llmlog/` khi chạy trên máy.

## Đo lại sau phiên 45 (16/11/2026)

Đo ở mức suy luận `low`, model chính opencode `deepseek-v4.1-flash` như web đang chạy, mỗi trường hợp 3 lần. Đã sửa `scripts/eval-exam/main.tsx` và `scripts/eval-slides/main.tsx` để nối thêm `ASK_RULE` khớp với `AiPanel.tsx`, và thêm `scripts/eval-ask-exam.mjs` (dựng lịch sử bằng `historyOf` và `askAnswerText` thật) cho hội thoại hỏi lại 2 lượt.

### Bảng số đo chi tiết (từng lần và trung bình)

| Trường hợp | Lần | Prompt | Suy luận | Đầu ra | Tổng token | Điểm* | Thời gian | Cấu trúc / kết quả |
|---|---|---|---|---|---|---|---|---|
| **#1** Đề Toán THPT QG (rõ) | 1 | 8.309 | 12.195 | 16.355 | 24.664 | 25 | 197,8 s | 12/4/6, 22 đáp án, JSON hợp lệ, không hỏi lại |
| | 2 | 8.309 | 14.231 | 17.794 | 26.103 | 26 | 179,6 s | 12/4/6, JSON hợp lệ, không hỏi lại (`answerKey` 22 câu nằm ở gốc thay vì trong `blocks`) |
| | 3 | 8.309 | 11.380 | 14.838 | 23.147 | 23 | 138,4 s | 12/4/6, 22 đáp án, JSON hợp lệ, không hỏi lại |
| **#1 Trung bình** | **3 lần** | **8.309** | **12.602** | **16.329** | **24.638** | **~25** | **171,9 s** | Đều không hỏi nhầm; soát tay đủ 22/22 câu ở lần 1: đúng hết |
| **#2** Yêu cầu mơ hồ `"soạn đề đi"` (lượt hỏi) | 1 | 10.555 | 19 | 241 | 10.796 | 11 | 5,7 s | `parseAsk` hợp lệ (4 câu hỏi) |
| | 2 | 10.555 | 32 | 282 | 10.837 | 11 | 8,6 s | `parseAsk` hợp lệ (4 câu hỏi) |
| | 3 | 10.555 | 16 | 240 | 10.795 | 11 (2) | 6,0 s | `parseAsk` hợp lệ (4 câu hỏi); opencode báo cache 10.496 |
| **#2 Trung bình** | **3 lần** | **10.555** | **22** | **254** | **10.809** | **~11** | **6,8 s** | 3/3 lượt trả JSON hỏi lại đúng chuẩn |
| **#3** Lượt soạn sau khi trả lời (Toán 9, 1 tiết, có hình, kèm `ASK_DEFAULT`) | 1 | 8.206 | 8.970 | 11.027 | 19.233 | 19 (14) | 104,0 s | 4 TN + 4 TL, 2 hình, 4 đáp án + rubric 8 ý, cache 6.144 |
| | 2 | 8.232 | 10.688 | 13.581 | 21.813 | 22 (16) | 163,6 s | 12 TN + 4 TL, 1 hình, 12 đáp án + rubric 6 ý, cache 6.144 |
| | 3 | 8.207 | 3.775 | 5.544 | 13.751 | 14 (7) | 56,8 s | 4 TN + 4 TL, 3 hình, 4 đáp án + rubric 7 ý, cache 7.808 |
| **#3 Trung bình** | **3 lần** | **8.215** | **7.811** | **10.051** | **18.266** | **~18** | **108,1 s** | 3/3 JSON hợp lệ, không hỏi lại; soát tay lần 1 & 3 đúng hết |
| **Tổng #2 + #3** | **TB 3 lần** | — | **7.833** | **10.305** | **29.075** | **~29 (20)** | **114,9 s** | Lần 1: 30.029 · Lần 2: 32.650 · Lần 3: 24.546 |
| **#4** Đề Toán lớp 10 có hình (hình học phẳng, vectơ) | 1 | 8.354 | 10.887 | 14.338 | 22.692 | 23 | 136,6 s | 12/4/6, 22 đáp án, 9 hình, JSON hợp lệ |
| | 2 | 8.354 | 13.440 | 18.109 | 26.463 | 26 (19) | 173,2 s | 12/4/6, 22 đáp án, 13 hình, JSON hợp lệ, cache 8.192 |
| | 3 | 8.354 | 9.307 | 12.751 | 21.105 | 21 | 123,8 s | 12/4/6, 22 đáp án, 13 hình, JSON hợp lệ |
| **#4 Trung bình** | **3 lần** | **8.354** | **11.211** | **15.066** | **23.420** | **~23** | **144,5 s** | Dùng đúng lệnh `vectơ AB, AD` và `vectơ AC "u"` |

| **#5** Bộ 15 slide (`--batch --effort low`) | Lượt gọi | Vào | Ra (suy luận) | Tổng token | Điểm* | Thời gian | Ghi chú |
|---|---|---|---|---|---|---|---|
| Lần 1 | 4 | 25.557 | 8.320 (3.499) | 33.877 | 34 | 77,6 s | 15/15 slide, 0 lỗi |
| Lần 2 | 4 | 28.044 | 7.121 (3.103) | 35.165 | 35 | 85,5 s | 15/15 slide, 0 lỗi |
| Lần 3 | 4 | 28.125 | 7.880 (3.876) | 36.005 | 36 (30) | 78,1 s | 15/15 slide, 0 lỗi, cache 6.400 |
| **#5 Trung bình** | **4** | **27.242** | **7.774 (3.493)** | **35.016** | **~35** | **80,4 s** | So với 40.765 token cũ: giảm ~5.749 token (~6 điểm) |

\* Điểm tính theo token thật (`total_tokens / 1000`); số trong ngoặc là điểm thực tế bị trừ theo `billOf` ở những lượt opencode báo có `cached_tokens`.

### Nhận xét

- **Prompt đề tăng +2.010 token so với mốc cũ (`6.299` → `8.309`), nhưng phần lớn đến từ phiên 44 chứ không phải phiên 45:** đo độ dài chuỗi thật cho thấy tổng prompt đề Toán tăng +4.672 ký tự so với bản trước phiên 44 (`~14.298` → `18.970` ký tự), trong đó **~3.542 ký tự (~1.500 token)** là do phiên 44 thêm mục `27) Tranh đếm đồ vật` (`2.882` ký tự, liệt kê ~90 đồ vật tiểu học), `28) Đồng hồ kim` (`110` ký tự) và danh sách `SCENE_OBJECTS` vào mục `5b`; còn **phiên 45 chỉ thêm 1.130 ký tự (~500 token)** gồm `ASK_RULE` (`827` ký tự) và hướng dẫn `vectơ AB` + `đất`/`tường` (`303` ký tự).
- **Tổng chi phí 1 đề Toán THPT QG tăng ~3,4 điểm** (`21.193` → `24.638` token, tức ~21 → ~25 điểm): ngoài +2.010 token prompt, phần suy luận trung bình cũng nhích từ ~11k lên ~12,6k token (vẫn trong biên dao động bình thường của model). Trên web thật còn cộng thêm `sourceRule` (`238` ký tự) và `khungPromptFor` (`9.139` ký tự với THPT QG, `5.388` ký tự với Toán 9, `4.088` ký tự với Toán 10 vectơ), thêm khoảng `~1.800–4.000` token prompt ngoài phần `eval:exam` đo.
- **`ASK_RULE` hoạt động ổn định, không gây hỏi nhầm hay hỏng JSON:** 6/6 đề ở #1 và #4 và 3/3 bộ slide ở #5 đều đi thẳng vào soạn khi yêu cầu rõ; 3/3 lượt mơ hồ ở #2 đều hỏi lại đúng JSON; 3/3 lượt #3 sau khi trả lời + `ASK_DEFAULT` đều soạn ngay mà không hỏi vòng lại. Có 1 lỗi cấu trúc ở #1 lần 2 (`answerKey` đặt ở gốc JSON thay vì trong `blocks`) — không liên quan `ASK_RULE` nhưng đáng lưu ý vì `ComposeDoc.tsx` hiện chỉ đọc từ `blocks`.
- **Lượt hỏi lại (#2) tốn ~10.809 token (~11 điểm) nhưng chỉ mất ~6,8 s:** đắt bất ngờ ở prompt (`10.555` token, `24.112` ký tự) vì câu mơ hồ `"soạn đề đi"` không nêu môn nên `figureGuideFor` gửi toàn bộ 28 loại hình của mọi môn (Lý, Hoá, Sinh, tiểu học…), chỉ để lấy về ~250 token JSON câu hỏi. Tổng hội thoại 2 lượt (#2 + #3) mất trung bình `29.075` token (~29 điểm thật, cao hơn #1 khoảng +4,4 điểm; nếu lượt 2 trúng cache trên opencode thì còn ~20–27 điểm).
- **Đề hình học lớp 10 (#4) tốn trung bình `23.420` token (~23 điểm), dùng tốt lệnh mới:** prompt `8.354` token (chỉ hơn #1 đúng `45` token do câu prompt dài hơn); cả 3 đề đều sinh 9–13 hình, có câu dùng đúng `vectơ AB, AD` và `vectơ AC "u"` theo mục 5 mới.
- **Bộ 15 slide (#5) rẻ hơn ~6 điểm so với số cũ (`35.016` so với `40.765`):** dù lượt lập dàn ý dài thêm `827` ký tự từ `ASK_RULE` (prompt dàn ý `10.456` token), cả 3 lần đo mới đều chạy trơn tru trong đúng 4 lượt gọi (không phát sinh lượt sửa thứ 5 như lần đo cũ) và đầu ra gọn hơn (~7,8k so với 11,1k).

### Kết luận và đề xuất rút gọn (không sửa code app)

- **Mức tăng thực tế của phiên 45:** riêng thay đổi phiên 45 chỉ cộng thêm **~0,5 điểm/lượt đầu** cho cả đề và slide — không đáng kể. Mức tăng ~3,4 điểm/đề thấy được khi đo lại chủ yếu đến từ danh mục tranh đếm tiểu học của phiên 44 và dao động suy luận. Riêng **lượt hỏi lại khi yêu cầu mơ hồ tốn ~11 điểm** (tổng 2 lượt ~29 điểm).
- **Có đáng rút gọn `ASK_RULE` / `FIGURE_GUIDE` không?**
  - **Không cần rút `FIGURE_GUIDE` mục 5 và 5b** (`+303` ký tự ≈ ~120 token): đã rất gọn và giúp model vẽ đúng vectơ ngay.
  - **Nên rút `FIGURE_GUIDE` theo cấp học (đề xuất lớn nhất, không đổi hành vi):** tách mục `27) Tranh đếm đồ vật` (`2.882` ký tự) và `28) Đồng hồ kim` (`110` ký tự) khỏi các đề Toán nhận ra lớp 6–12 / THPT (`figureGuideFor` trong `src/lib/docRewrite.ts`). Việc này cắt ngay **~3.000 ký tự (~1.350–1.400 token ≈ 1,4 điểm)** cho mọi đề Toán THCS/THPT mà hoàn toàn không ảnh hưởng Toán tiểu học.
  - **Nên tránh gửi cả `FIGURE_GUIDE` khi lượt hỏi đang xử lý yêu cầu quá ngắn/mơ hồ:** khi yêu cầu như `"soạn đề đi"` chưa nêu môn, `AiPanel.tsx` có thể dùng prompt rút gọn (hoặc bỏ phần chi tiết 28 loại hình ở lượt 1) vì lượt đó nhiều khả năng chỉ trả `{"action":"ask",...}`, lượt 2 sau khi biết môn mới gửi `figureGuideFor` chuẩn. Cách này có thể kéo lượt hỏi từ **~11 điểm xuống ~2–3 điểm**.
  - **`ASK_RULE` (`827` ký tự ≈ ~380 token):** không bắt buộc rút ngay; nếu muốn gọn hơn nữa có thể nén câu chữ xuống ~550 ký tự (bớt ví dụ dài dòng, giữ nguyên schema JSON và các chữ viết hoa `KHÔNG`/`CHƯA`) để tiết kiệm thêm ~120 token/lượt đầu.
