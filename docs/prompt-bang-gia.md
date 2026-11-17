# Prompt: trang Bảng giá (mua điểm AI)

> Đưa nguyên file này cho agent (Antigravity CLI). Đọc `AGENTS.md` và `context.md` trước.
> Làm trên **nhánh riêng** `feat/bang-gia`, **trong worktree riêng** (agent khác có thể đang dùng thư mục chính):
> `git worktree add ../dethinhbien-bang-gia -b feat/bang-gia main`, chạy dev ở cổng **5190**. Không commit lên `main`, không push.

---

## Bối cảnh

Web dùng **điểm AI** để trả cho các lượt AI (soạn đề, soạn slide, sửa, tìm web, vẽ ảnh). 1 điểm = 1.000 token (`TOKENS_PER_POINT` trong `server/aiQuota.ts`). Tài khoản mới được tặng 120 điểm. Số dư hiện ở trang Hồ sơ (`src/pages/Profile.tsx`, mục điểm AI).

Cần **trang Bảng giá**: trả theo lượng dùng, không gói tháng. Người dùng chọn một mức tiền có sẵn hoặc tự nhập, thấy ngay được bao nhiêu điểm và dùng được khoảng bao nhiêu lượt, rồi quét QR để chuyển khoản. **Phiên này chỉ làm giao diện.** Thanh toán thật (PayOS: tạo đơn, webhook cộng điểm) làm ở phiên khác, nên **không** viết server, không viết migration, không đụng `server/`.

## Bảng giá (đặt hết vào MỘT file cấu hình)

Tạo `src/lib/pricing.ts`, mọi con số trên trang đều đọc từ đây (người dùng sẽ chỉnh giá sau, không được viết số cứng trong JSX):

```ts
/** Giá gốc: 1.000đ = 25 điểm (40đ/điểm). */
export const POINTS_PER_1000 = 25
export const MIN_VND = 2_000
export const MAX_VND = 100_000

/**
 * Các gói có sẵn. `bonus` CHỈ áp cho LẦN NẠP ĐẦU TIÊN của đúng gói đó (mỗi gói một lần):
 * nạp gói 5.000đ lần đầu → +5%; nạp gói 5.000đ lần hai → không thưởng; gói 10.000đ chưa nạp lần nào → vẫn +10%.
 * Số tiền tự nhập không phải gói → không có thưởng.
 */
export const PACKS = [
  { vnd: 2_000,  bonus: 0 },    //   50 điểm
  { vnd: 5_000,  bonus: 0.05 }, //  125 → lần đầu 131
  { vnd: 10_000, bonus: 0.10 }, //  250 → lần đầu 275
  { vnd: 20_000, bonus: 0.15 }, //  500 → lần đầu 575
  { vnd: 50_000, bonus: 0.20 }, // 1250 → lần đầu 1500
] as const

/** Ước tính điểm mỗi lượt (số đo thật trong docs/bao-cao-chi-phi-ai.md, làm tròn lên). */
export const USAGE = [
  { id: 'exam',   label: 'Soạn 1 đề (vd. Toán THPT, 22 câu)', points: 30 },
  { id: 'slide',  label: 'Soạn 1 bộ slide 15 trang',          points: 45 },
  { id: 'ask',    label: '1 lượt AI hỏi lại trước khi soạn',  points: 10 },
  { id: 'edit',   label: '1 lượt sửa / hỏi thêm',             points: 5 },
  { id: 'search', label: '1 lượt tìm trên web',               points: 5 },
  { id: 'image',  label: '1 ảnh minh hoạ AI',                 points: 5 },
] as const
```

Viết thêm các hàm thuần (để dễ test):

- `basePoints(vnd)` = `floor(vnd / 1000 * POINTS_PER_1000)`.
- `packPoints(pack, firstTime: boolean)` = `floor(basePoints(pack.vnd) * (1 + (firstTime ? pack.bonus : 0)))`.
- `vndFor(points)`: số tiền **nhỏ nhất** (bội số 1.000đ) mà `basePoints(vnd) >= points` (tự nhập không có thưởng), kẹp trong `[MIN_VND, MAX_VND]`.
- `clampVnd(vnd)`: làm tròn **lên** bội số 1.000đ, kẹp trong `[MIN_VND, MAX_VND]`.
- `usesFor(points)`: mỗi mục `USAGE` dùng được bao nhiêu lượt, `floor(points / item.points)`.

**Gói nào đã nạp lần đầu:** server chưa có (làm cùng PayOS ở phiên sau). Tạo hàm `src/lib/pricing.ts` → `export async function boughtPacks(): Promise<number[]>` trả `[]` (danh sách `vnd` của các gói đã từng nạp) kèm `// TODO PayOS: đọc từ server (bảng đơn nạp)`. Trang gọi hàm này lúc mở; mọi chỗ tính thưởng đều dựa vào kết quả của nó, không giả định.

## Trang

- Route `/bang-gia`, file `src/pages/Pricing.tsx`, lazy-load như các trang khác trong `src/App.tsx`.
- **Tạm thời chỉ admin xem được.** Trong `src/lib/pricing.ts` thêm `export const PRICING_PUBLIC = false`. Khi `false`: trang gọi `getMe()` (`src/lib/adminApi.ts`) lúc mở; chỉ `role === 'admin'` mới thấy trang, còn lại (chưa đăng nhập, người dùng thường, moderator, lỗi 401/403) hiện đúng trang 404 có sẵn (`NotFound`), không lộ là có trang bảng giá. Khi `true`: ai cũng xem được (người dùng sẽ bảo lúc nào bật).
- Link "Bảng giá" trong điều hướng chung (`src/components/Layout.tsx` / `NavPanel.tsx`) và link nhỏ cạnh số dư điểm ở trang Hồ sơ: **chỉ hiện khi `PRICING_PUBLIC = true`**. Lúc này admin vào bằng cách gõ thẳng `/bang-gia`.

Bố cục (desktop 2 cột, điện thoại 1 cột):

1. **Chọn gói**: 5 thẻ (desktop 5 cột hoặc 3+2; điện thoại 2 cột). Mỗi thẻ có số tiền (vd. `10.000đ`) và số điểm nhận được **ở lần nạp này**. Gói có thưởng mà chưa nạp lần nào: hiện nhãn `+10% lần đầu` và số điểm đã cộng thưởng (có thể gạch số gốc bên cạnh). Gói đã nạp rồi: chỉ hiện số điểm gốc, không nhãn. Thẻ đang chọn có viền nhấn. Mặc định chọn 10.000đ.
2. **Tự nhập**: `Segmented` (component có sẵn) hai chế độ **Số tiền** / **Số điểm**, bên dưới là một ô nhập số.
   - Chế độ Số tiền: nhập VNĐ, hiện ra số điểm nhận được (`basePoints`, không thưởng). Khi rời ô thì `clampVnd`; ngoài khoảng thì báo lỗi ngắn ngay dưới ô ("Tối thiểu 2.000đ", "Tối đa 100.000đ").
   - Chế độ Số điểm: nhập số điểm, hiện ra số tiền phải trả (`vndFor`) và số điểm thực nhận (có thể nhiều hơn số đã nhập do làm tròn lên 1.000đ). Số điểm vượt mức 100.000đ thì báo lỗi.
   - Số tự nhập trùng đúng giá một gói (vd. gõ 10.000) thì tự chọn luôn thẻ gói đó (để hưởng thưởng lần đầu nếu còn).
   - Gõ vào ô tự nhập thì bỏ chọn thẻ; bấm thẻ thì ô nhập lấy số của thẻ đó.
   - Hiện số có dấu chấm ngăn hàng nghìn (`toLocaleString('vi-VN')`).
3. **Dùng được khoảng**: bảng `USAGE` cho số điểm đang chọn: mỗi dòng gồm tên lượt, điểm/lượt, "≈ N lượt". Cập nhật ngay khi đổi mức.
4. **Thanh toán** (cột phải desktop, cuối trang trên điện thoại): tóm tắt (số tiền, số điểm) → khung **QR tạm** → nút "Tôi đã chuyển khoản" (tạm thời chỉ mở `dialog.alert` báo đang chờ kích hoạt thanh toán).
   - QR tạm: một khung vuông 200×200 vẽ bằng SVG/CSS (ô vuông kiểu QR, ba ô định vị ở góc), **không** gọi dịch vụ ngoài, không thêm thư viện. Có nhãn nhỏ "QR mẫu", và trong code ghi `// TODO PayOS: thay bằng checkoutUrl/qrCode từ API tạo đơn`.
   - Nội dung chuyển khoản hiển thị dạng `DR <6 ký tự đầu user id>` (chưa đăng nhập thì nút thanh toán chuyển sang `/dang-nhap`, dùng `rememberReturnPath` trong `src/lib/auth.ts` để quay lại `/bang-gia`).

## Thẩm mỹ: phải đẹp, không "AI slop"

Trang này là nơi người dùng trả tiền nên phải trông chỉn chu, có chủ đích, cùng một hệ với phần còn lại của web (xem trang chủ `src/pages/home/` và trang Hồ sơ: nền giấy ấm, màu nhấn `clay`, chữ `ink`, viền `line`, bo 8–12px). Trước khi làm, mở hai trang đó trên dev và bắt chước nhịp chữ, khoảng cách, màu.

**Cấm các dấu hiệu giao diện kiểu AI sinh hàng loạt:**
- Nền gradient tím/xanh, chữ gradient, glow/neon, glassmorphism mờ đục, bóng đổ to mềm khắp nơi.
- Emoji, icon trang trí ở mọi thẻ, ✨/🚀, huy hiệu "Phổ biến nhất"/"Best value" chói, ruy băng chéo góc.
- Ba thẻ giá to giống hệt nhau xếp hàng kiểu SaaS mẫu; checklist "✓ tính năng" dài.
- Tiêu đề khẩu hiệu ("Mở khoá sức mạnh AI", "Đơn giản, minh bạch"), câu "X, không phải Y".
- Mọi thứ căn giữa, chữ to hết cỡ, khoảng trắng vô tội vạ; hiệu ứng bay nhảy khi cuộn.

**Hướng nên làm:**
- Bố cục như một **công cụ tính tiền rõ ràng**: chọn gói → thấy ngay điểm và số lượt → thanh toán. Thông tin quan trọng nhất (số điểm nhận được) to và đậm nhất; số tiền rõ ràng; phần phụ nhỏ, xám.
- Số dùng `tabular-nums`, căn phải trong bảng ước tính để dễ so.
- Thẻ gói phẳng, viền mảnh; trạng thái chọn bằng viền + nền nhấn nhạt màu `clay`, không phóng to. Nhãn thưởng là chip nhỏ, màu nhấn vừa phải.
- Một màu nhấn duy nhất (`clay`); còn lại trung tính. Bóng chỉ dùng cho khối thanh toán nếu cần tách lớp.
- Chuyển trạng thái nhẹ (đổi viền/nền 150ms), không animation trang trí. Tôn trọng `prefers-reduced-motion`.
- Có trạng thái rỗng/lỗi/đang tải gọn gàng (đang kiểm quyền: khung xương nhẹ, không spinner to giữa trang).

Khi báo xong, tự soát lại theo hai danh sách trên và ghi một dòng "Đã soát thẩm mỹ" kèm những gì đã chỉnh.

## Luật giao diện (AGENTS.md, nhắc lại vì hay bị vi phạm)

- **Không thêm chữ thừa.** Tiêu đề trang + các nhãn cần thiết là đủ. Không đoạn giới thiệu, không câu trấn an ("Thanh toán an toàn"…), không FAQ, không giọng khẩu hiệu. Chỉ một dòng nhỏ dưới bảng ước tính: "Số điểm mỗi lượt là ước tính, tuỳ độ dài yêu cầu." (đây là thông tin thật, cần có).
- Dùng lại component có sẵn: `Segmented`, `Button`, `inputClass`, `Badge`, `dialog`. Màu, bo góc, bóng theo token sẵn có trong `src/index.css` (xem trang Hồ sơ để bắt chước phong cách).
- Không thêm thư viện.

## Lưu ý kỹ thuật

- Nhiều file dùng **CRLF**: không `sed -i` / Python ghi text thường; sau khi sửa chạy `git ls-files --eol <file>` + `git diff --stat`.
- Test: `scripts/test-pricing.mjs` (thêm `"test:pricing"` vào `package.json`), kiểm: 5 gói ra đúng số điểm như comment (cả lần đầu và lần sau); gói 2.000đ không có thưởng; 1.000đ và 1.999đ thành 2.000đ, 100.001đ thành 100.000đ, 2.500đ thành 3.000đ; `basePoints(7000) = 175` (tự nhập không thưởng); `vndFor(250) = 10000`; `vndFor(1) = 2000`; `basePoints(vndFor(p)) >= p` với mọi p từ 1 đến `basePoints(MAX_VND)`.

## Responsive (bắt buộc)

Trang phải đẹp và dùng được ở mọi khung dưới đây; dùng breakpoint Tailwind (`sm` / `md` / `lg` / `xl` / `2xl`), không cố định chiều rộng bằng px:

| Khung | Kích thước thử | Yêu cầu |
|---|---|---|
| Điện thoại | 360×740, 390×844 | 1 cột: thẻ mức 2 cột, tự nhập, ước tính, thanh toán xếp dọc; ô nhập và nút cao ≥ 44px; không cuộn ngang |
| Máy tính bảng | 768×1024 (dọc), 1024×768 (ngang) | dọc: 1 cột, thẻ 3 cột; ngang: 2 cột như desktop |
| Laptop 15 inch | 1366×768, 1536×864 | 2 cột, khối thanh toán `sticky` bên phải, thấy được QR mà không phải cuộn ở 768px chiều cao |
| Màn 30 inch | 2560×1440 | nội dung có `max-w` (vd. `max-w-6xl`) và căn giữa, không giãn hết bề ngang; chữ không bé lại |
| Cỡ chữ hệ thống | chỉnh cỡ chữ mặc định của trình duyệt lên **20px và 24px** (hoặc `html { font-size: 125% / 150% }` để thử) | dùng `rem`, không đặt `font-size` cứng bằng px cho chữ chính; chữ không tràn khỏi thẻ, số tiền/điểm dài không bị cắt (cho xuống dòng hoặc thu gọn), nút không chồng lên nhau |

## Kiểm tra trước khi báo xong

1. `npx tsc -p tsconfig.app.json --noEmit` sạch; `npm run test:pricing` qua.
2. Dev (cổng 5190): kiểm quyền: chưa đăng nhập / tài khoản thường thấy 404, admin thấy trang (dùng chế độ mock admin có sẵn trong `adminApi.ts` nếu không có tài khoản admin thật); đổi `PRICING_PUBLIC = true` tạm để thấy link trong điều hướng rồi trả lại `false`. Mở `/bang-gia`, bấm từng thẻ; nhập 7.000 / 1.500 / 150.000 / 10.000 ở chế độ Số tiền; giả lập `boughtPacks()` trả `[5000]` để thấy gói 5.000đ mất nhãn thưởng còn các gói khác vẫn có; nhập 500 ở chế độ Số điểm. Bảng ước tính cập nhật đúng.
3. Đi hết các khung trong bảng Responsive ở trên (kể cả cỡ chữ 125% và 150%): `document.documentElement.scrollWidth <= innerWidth`, không chữ nào tràn / bị cắt.
4. Chụp màn hình: 390×844, 768×1024, 1366×768, 2560×1440, và 390×844 với cỡ chữ 150%.

## Báo lại

Danh sách file đã thêm/sửa, ảnh chụp, kết quả test. Thấy chỗ nào nên đổi giá / đổi số ước tính thì ghi ở mục "Đề xuất", **đừng tự sửa** `pricing.ts` ngoài các số ghi trong prompt.
