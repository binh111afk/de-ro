# Prompt: sửa cách ghi tên hàm cạnh đồ thị (công cụ Đồ thị hàm số)

> Làm tiếp trên nhánh `feat/keo-nhan` (cùng nhánh với tính năng kéo thả nhãn), không đụng `main`.

---

## Lỗi hiện tại

File: `src/lib/plot.ts`, hàm `renderPlotSvg`, đoạn `if (spec.labels && last) { … }` (tìm `y = ${esc(c.expr.trim())}`).

Tên hàm đang được đặt tại **điểm cuối cùng còn thấy được** của đường cong, lùi 6px sang trái, 8px lên trên, chữ nằm ngang. Hậu quả, ví dụ khi vẽ cùng lúc `x^2 - 2x - 3`, `x`, `-x` trên khung x từ −5 đến 5:

1. Chữ đè lên chính đường của nó, hoặc đè lên đường khác. Ví dụ "y = x" nằm ngay trên đường đỏ, "y = −x" nằm trên đường xanh ở góc dưới.
2. Chữ luôn nằm ngang, không theo phương của đồ thị.
3. Tên hàm bị dồn hết vào mép trên/góc khung, chen vào nhau ("y = x^2 − 2x − 3" sát "y = x").
4. Biểu thức in thô: `x^2`, `2*x`, dấu `-` thường.

## Cách người ta vẫn ghi trong SGK (yêu cầu)

1. **Theo phương đồ thị:** chữ xoay song song với tiếp tuyến của đường cong tại chỗ ghi. Luôn giữ chữ đọc xuôi, nghĩa là góc xoay trong khoảng (−90°; 90°); nếu dốc quá (gần thẳng đứng, trên khoảng 70°) thì cho phép giới hạn ở ±70°.
2. **Cách đồ thị một khoảng:** tâm chữ dời theo pháp tuyến khoảng 10–14px, nằm hẳn **phía trên hoặc phía dưới** đường cong, không chạm nét.
3. **Không đè thứ khác:** không đè đường cong khác, trục toạ độ, số trên trục, tên điểm, tên hàm khác; không tràn khỏi khung.
4. **Biểu thức viết đẹp:** `x^2` thành x², `x^3` thành x³, bỏ dấu `*` (2*x thành 2x), dấu trừ dùng `−`. Viết một hàm `prettyExpr(expr)` riêng. Phần mũ dạng chữ số đơn giản dùng kí tự mũ Unicode (², ³, ⁴…). Phần mũ phức tạp (ví dụ `x^(1/2)`) thì dùng `<tspan baseline-shift="super" font-size="…">`.

## Cách làm gợi ý

Viết một hàm riêng, ví dụ `placeCurveLabel(...)`, trong `plot.ts`:

1. Với mỗi đường cong, lấy các điểm mẫu **còn trong khung** (bỏ phần sát mép 8% mỗi phía và phần gần chỗ đứt/tiệm cận). Đổi sang toạ độ pixel bằng `sx`, `sy`. Tính góc tiếp tuyến bằng chính toạ độ pixel, không tính bằng toạ độ toán, vì hai trục có thể khác tỉ lệ.
2. Sinh ứng viên: khoảng 20 vị trí dọc đường cong × 2 phía (pháp tuyến + và −). Mỗi ứng viên là một hình chữ nhật xoay (dài ≈ 7.5px × số kí tự, cao ≈ 15px).
3. Chấm điểm (càng thấp càng tốt):
   - phạt nặng nếu hình chữ nhật cắt bất kì đường cong nào (kể cả chính nó), trục, hoặc nhãn đã đặt; kiểm bằng khoảng cách từ các điểm mẫu tới hình chữ nhật;
   - phạt nặng nếu tràn khung;
   - phạt nhẹ nếu gần giao điểm của các đường cong;
   - ưu tiên nhẹ chỗ đường cong ít cong và chỗ phía bên phải, gần cuối đường (thói quen SGK).
4. Đặt lần lượt từng đường cong; nhãn đã đặt thành vật cản cho nhãn sau.
5. Xuất `<text … transform="rotate(góc cx cy)" text-anchor="middle">`. Giữ `fill` màu của đường cong.

Không tìm được chỗ đạt thì lấy ứng viên điểm thấp nhất, không bỏ nhãn.

## Phải khớp với tính năng kéo thả nhãn (cùng nhánh)

- Thẻ `<text>` tên hàm phải có `data-lbl="cv:<chỉ số đường>"` như quy ước trong `docs/prompt-keo-nhan.md`.
- Chữ giờ có sẵn `transform="rotate(…)"`. Khi áp độ lệch người dùng kéo, phần translate phải đặt **trước** rotate, thành `transform="translate(dx dy) rotate(…)"`, để nhãn dời theo đúng hướng chuột chứ không theo hướng đã xoay. Kiểm tra lại hàm áp độ lệch đã viết, sửa nếu nó ghi đè hoặc nối sai thứ tự.

## Không được

- Không đổi cách vẽ đường cong, trục, số trên trục, tên điểm.
- Không đổi định dạng spec / `<desc>`. Ảnh cũ mở lại chỉ khác ở chỗ tên hàm đặt đẹp hơn.
- Không thêm thư viện.

## Kiểm tra trước khi báo xong

1. `npx tsc -p tsconfig.app.json --noEmit` sạch. **Không** dùng `tsc -p .`.
2. Chạy `npm run test:docx` và `npm run test:export`, cả hai phải đạt.
3. Vẽ thử và chụp ảnh (dev server `npm run dev -- --port 5184 --host 127.0.0.1`, mở `/soan-de`, công cụ Đồ thị, bật ghi tên hàm) cho ít nhất các ca:
   - `x^2 - 2x - 3`, `x`, `-x` trên x ∈ [−5; 5], ca của người dùng;
   - một đường duy nhất `x^3 - 3x`;
   - `sin(x)` và `cos(x)` (hai đường cắt nhau nhiều lần);
   - hàm phân thức có tiệm cận, ví dụ `(2x+1)/(x-1)`;
   - đường thẳng đứng gần như dốc đứng, ví dụ `10x`.

   Mỗi ca, tên hàm phải: theo phương đường cong, cách nét, không đè gì, đọc xuôi, biểu thức đẹp.
4. Kéo thử tên hàm bằng tính năng kéo nhãn, kiểm tra nhãn đi đúng hướng chuột và giữ được vị trí sau khi mở lại.

## Bàn giao

- Commit riêng trên `feat/keo-nhan`, message tiếng Việt, rồi push nhánh.
- Thêm một mục "Tên hàm cạnh đồ thị" vào `docs/handoff/keo-nhan.md`: cách chấm điểm, các ca đã thử, chỗ còn xấu nếu có.
