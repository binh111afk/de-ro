# Việc: kiểm xuất .pptx có đúng bố cục và màu như trên web không (chỉ báo cáo, không sửa exportDeck)

Đọc `AGENTS.md` trước. Làm trong worktree này (nhánh `chore/kiem-pptx`), không commit.

## Phạm vi
So **bố cục** (vị trí, kích thước, thứ tự chồng lớp) và **màu sắc** (nền slide, màu nền / viền hình, màu chữ, độ trong suốt) giữa slide trên web và file `.pptx` xuất ra.
**Không tính**: hiệu ứng / hoạt ảnh và kiểu chữ (phông, cỡ, kẹp chữ) — đó là giới hạn kỹ thuật đã biết. Chữ chỉ cần đúng nội dung, đúng ô, đúng màu.

## Việc cần làm
1. Đọc `src/lib/exportDeck.ts` (`buildDeckPptx`), `src/store/docs.ts` (kiểu `Deck` / `Slide` / `SlideElement`), cách web vẽ ở `src/examEditor/slideRender.tsx` và `src/lib/slideTheme.ts`, `slideSkins.ts`, `slideLayouts.ts`. Chú ý: toạ độ web là % của slide, PPTX là inch (slide 10 × 5,625) — xem `exportDeck.ts` đổi thế nào.
2. Viết `scripts/check-pptx-fidelity.ts` (chạy bằng `tsx --tsconfig tsconfig.app.json`, theo cách các `scripts/test-slide-*.mjs` / `test-deck-integration.ts` đang dùng): dựng các bài mẫu rồi gọi `buildDeckPptx`, giải nén bằng JSZip (đã có trong dự án), đọc `ppt/slides/slide*.xml` và so với mô hình:
   - Bài mẫu: **mọi** bộ trong `SLIDE_DESIGNS` (`buildDesignSlides`), **mọi** `DECK_THEMES`, **mọi** layout trong `slideLayouts.ts` (`composeLayout`), và nhánh Chuyên nghiệp `PRO_THEMES` + 7 layout nếu dựng được trong Node (xem `scripts/test-slide-pro.mjs`).
   - Với mỗi slide: màu nền (kể cả nền ảnh / chuyển sắc: ra đúng loại và màu đầu–cuối); số phần tử; với mỗi phần tử: vị trí `x, y, cx, cy` (sai lệch cho phép ≤ 1% bề rộng/cao slide, ghi rõ ngưỡng), thứ tự z, màu nền (`solidFill`), màu viền + độ dày, độ trong suốt (`alpha`), hình (`prstGeom`), màu chữ từng đoạn, ảnh có đúng vị trí và có bị cắt đúng khung.
   - Phần tử mà PPTX chủ ý đổi (ví dụ khung ảnh hình dạng ra chữ nhật, SVG → PNG) thì ghi vào mục "khác biệt đã biết", không tính là lỗi.
3. Chạy toàn bộ, in bảng tóm tắt: số slide đã so, số phần tử đã so, số sai lệch theo loại (vị trí / màu nền / màu viền / màu chữ / trong suốt / thứ tự z / thiếu phần tử / dư phần tử). Mỗi sai lệch ghi: bộ / layout, số slide, phần tử, giá trị web, giá trị PPTX.
4. Tìm nguyên nhân gốc trong `exportDeck.ts` cho từng **loại** sai lệch (dòng code nào, vì sao) và đề xuất cách sửa ngắn. **Không sửa `exportDeck.ts` hay file nguồn nào khác** — chỉ thêm script kiểm và báo cáo.

## Điều cấm
- Không sửa file nguồn có sẵn (ngoài thêm script `check-pptx-fidelity.ts` và dòng `check:pptx` trong `package.json`), không thêm thư viện, không commit / push, không đụng migration.
- Không mở PowerPoint / LibreOffice (sandbox không chạy được); việc nhìn thật để người dùng làm sau.
- Không ghi đường dẫn tuyệt đối ngoài dự án. Nhiều file CRLF: sửa `package.json` bằng công cụ sửa file, kiểm `git ls-files --eol package.json` và `git diff --stat`.

## Kiểm
```
npx tsc -p tsconfig.app.json --noEmit
npm run check:pptx
```
(`node_modules` là liên kết về dự án chính. Nếu PowerShell chặn `npm.ps1` thì dùng `npm.cmd` / `npx.cmd`; nếu `tsx` lỗi `uv_os_get_passwd` thì dùng cấu hình Node tạm, nói rõ trong báo cáo.)

## Báo cáo
Nêu: bảng tóm tắt số liệu, danh sách sai lệch theo loại (kèm ví dụ cụ thể), nguyên nhân gốc + đề xuất sửa, mục "khác biệt đã biết", ngưỡng đã chọn, và điều chưa kiểm được (nêu rõ phần chưa so được, ví dụ nền ảnh, nhóm phần tử, ảnh SVG). Trung thực: chưa so thì nói chưa so.
