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
- Cách D: đoạn "CÁCH SUY NGHĨ (tiết kiệm)" ở cuối `examSystemPrompt` (`src/examEditor/AiPanel.tsx`), trước phần tài liệu hiện tại.
- Từ các lần trước: hướng dẫn hình theo môn (cách 2), slide gộp 5 slide mỗi lượt và rút danh mục đồ hoạ (cách 4), phần cache tính 1/10 điểm (cách 1).
- **Model chính vẫn là opencode** (`deepseek-v4.1-flash`). DeepSeek chính hãng chỉ để trong `.env` máy dev làm dự phòng, chờ nạp tiền rồi tính.
- Cách D mới đo trên DeepSeek chính hãng; **chưa đo riêng trên opencode** (cùng dòng model V4.1-Flash nên dự kiến tương tự).

**Chi phí ước tính mỗi lần tạo (mức low):**

| | Opencode (đang chạy trên web) | DeepSeek chính hãng (khi chuyển làm model chính) |
|---|---|---|
| 1 đề Toán THPT QG | **~20–23 điểm** (~23.000 token trước cách D, trừ ~11%) | **~20 điểm** khi cache lạnh, ~19 khi trúng cache |
| 1 bộ 15 slide | **~41 điểm** (40.765 token) | **~20–26 điểm** lúc đông người dùng; ~28–30 khi cache lạnh |
| Thời gian | đề ~160 s, slide ~90–100 s | đề ~85 s, slide ~30 s |

- 120 điểm tặng lúc đầu: với opencode khoảng **5–6 đề** hoặc **khoảng 3 bộ slide**; với DeepSeek chính hãng khoảng **6 đề** hoặc **4–6 bộ slide**.
- Opencode không giảm giá phần lặp lại (báo `cached_tokens: 0`), nên trên opencode điểm = token thật.
- Các số dựa trên 1–3 lần đo mỗi trường hợp; mỗi lần chạy có thể lệch vài nghìn token (model chọn bố cục khác, có lượt sửa…).

**Chi phí đã tiêu cho thí nghiệm** (tài khoản DeepSeek chính hãng, 15–16/11): khoảng 600.000 token cho 12 đề + 12 lượt chấm + 3 bộ slide + vài lượt thử tham số.

## Đo lại

```bash
LLM_TIMEOUT_MS=400000 npm run eval:exam -- max high medium low
npm run eval:slides -- "<chủ đề>" --batch --effort low
```

Log từng lượt gọi: bảng `ai_calls` trên Supabase, hoặc `%TEMP%/dethinhbien-llmlog/` khi chạy trên máy.
