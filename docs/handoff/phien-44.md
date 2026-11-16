# Phiên 44 (16/11/2026): bỏ chữ thừa, admin điểm AI, tranh đếm + đồng hồ + hình vật, kho hình dùng chung

Tiếp [phiên 43](phien-43.md). Không có migration mới. Repo chỉ có nhánh `main`.

> Người dùng dặn (đã ghi memory `khong-chu-thua`): **không thêm dòng phụ / giải thích / hướng dẫn hiển nhiên trên UI, copy không giọng khẩu hiệu AI.** Hỏi "bỏ đi có ai thiếu không".

## Việc còn treo

1. **Agnes gói miễn phí** giới hạn tần suất (429 sau ~10 ảnh, mở lại sau một lúc). Server đã tự rơi sang Xkiro/SenseNova; nút vẽ ảnh slide cũng chịu chung.
2. **Chưa thử đầu-cuối bằng AI soạn đề thật**: đề Toán lớp 2 có tranh đếm / đồng hồ, đề toán thực tế có `hình <vật>`; vật ngoài kho (`en`) trên bản deploy (cần R2 env trên Vercel — đã có từ trước).
3. Chân thang hơi chạm qua mép đất; "tháp" trông giống hải đăng.
4. File chưa commit, hỏi trước khi đụng: `.claude/`, `.rls-audit/`, `.strix/`, `public/brand/logo-120*.png`, `scripts/probe-imports.mts`.

## Đã làm (đã push)

| Commit | Nội dung |
|---|---|
| `ca06a5f`, `453ef65` | Bỏ chữ thừa toàn web; viết lại chữ trang chủ; nút Slide/Bảng vẽ ở trang chủ mở thẳng trình soạn (`navState.create`, chặn tạo đôi do StrictMode bằng ref) |
| `792fc04`, `ec24c1c`, `6e95f4d` | Admin › Người dùng: điểm AI còn lại = hạn mức tháng + điểm cộng − đã dùng (khớp người dùng thấy), mọi chỗ ghi **điểm** (1 điểm = `TOKENS_PER_POINT`), hộp Cộng điểm nhập điểm; bỏ hướng dẫn thừa các tab admin |
| `1186cb6` | `DialogHost` render qua `createPortal(document.body)` — `#root` có z-index riêng nên hộp xác nhận từng nằm dưới ngăn kéo admin |
| `029aa74` | Tranh đếm, đồng hồ, hình vật, kho hình dùng chung (dưới) |

Ngoài code: xoá 38 deploy Vercel cũ (còn 10 mới nhất).

## Tranh đếm / đồng hồ / hình vật

- **`objects`** (`src/lib/objects.ts`): nhóm `{container?, item, each, count, label?}`. Đồ chứa `inside` (rổ, giỏ, hộp, xô, chậu: vẽ đồ chứa 2 lần, lần sau cắt theo mép trước miệng để che chân đồ vật), `on_top` (đĩa, khay, ao), `label` (túi, gói, thùng, lọ, chuồng: chỉ ghi số; có đồ vật thì vẽ nhóm rời). Đồ vật lạ không có `en` → bỏ cả nhóm (không vẽ rổ rỗng).
- **`clock`**: `{hour, minute, numbers}`.
- **`scene`**: lệnh `hình <vật> AB` (chân A → đỉnh B, xoay theo AB), `hình <vật> A`, `hình en:<tên Anh> A`. Vật đứng thẳng đặt giữa; vật nghiêng lệch nửa bề rộng ra ngoài; `EDGE_ANCHOR` (toà nhà, nhà, lều, bồn nước) đặt mặt lên đoạn. Nhãn điểm né khung hình vật; nhãn đoạn đổi phía theo vật. Vật không nhận ra → bỏ dòng, hình học vẫn vẽ. Tên gọi khác: `OBJECT_ALIASES`.
- **Kho có sẵn**: `src/data/figureSprites.json` (114 hình, vector potrace `{w,h,ink,body}`, ~490 KB gzip, nạp cùng `loadTools`). Danh mục sinh tự động `src/lib/objectsCatalog.ts` — **đừng sửa tay**.
- **Kho dùng chung**: `POST /api/figure-sprite {en}` (`server/figureSprite.ts`) — có R2 `fig/<slug>.png` thì trả url (không trừ điểm), chưa có thì `chargeAndGenerate` (tách từ `imageProxy.ts`) vẽ + lưu. Máy khách tải, tách nền bằng canvas (`figureSprites.ts › cutOut`), id `x-<slug>`. `prepareToolDoc` gọi trước khi đổi PNG (`pngifyToolImages`), trong `planTool`, và lúc mở hộp sửa (hộp không tự vẽ vật mới theo phím gõ).
- Hộp sửa: `ObjectsModal`, `ClockModal` (`objectsModals.tsx`); tab Công cụ › Toán có 2 mục mới.
- Kiểm: `npx tsx --tsconfig tsconfig.app.json scripts/check-objects.ts`.

### Thêm / vẽ lại hình kho có sẵn

1. Sửa `scripts/figure-sprites/hinh-tieu-hoc.json` (prompt cùng khung nét đen trắng; vật thực tế thêm `"scene": true`, `"aliases"`). Đồ chứa mới phải có thông số miệng ở `containers.json`.
2. `node scripts/figure-sprites/gen.mjs <thư mục ảnh gốc> [id…]` (Agnes → SenseNova khi 429; ảnh có rồi thì bỏ qua). Ảnh gốc không lưu trong repo.
3. potrace không trong `package.json`: `npm i --prefix <tmp> potrace@2.1.8`, rồi `POTRACE=<tmp>/node_modules/potrace node scripts/figure-sprites/vector.cjs <thư mục ảnh gốc> [id…]` (`--catalog` = chỉ sinh lại danh mục). Xem ảnh lại bằng mắt: "orange" từng ra cái cột (màu), "number_card" ra chữ số 7 (đã bỏ).
