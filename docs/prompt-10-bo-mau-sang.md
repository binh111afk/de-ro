# Prompt: thêm 10 bộ màu slide MỚI, tất cả nền SÁNG (18 → 28 bộ)

> **Nhánh mới** `feat/10-bo-mau-sang` tạo từ `main` mới nhất, trong **thư mục riêng**:
> ```
> git fetch origin && git worktree add ../dethinhbien-bo-mau -b feat/10-bo-mau-sang origin/main
> ```
> Làm trong `../dethinhbien-bo-mau`; chạy `npm install` trước. Dev ở cổng **5191** (`npm run dev -- --port 5191 --host 127.0.0.1`). Không làm trên `main`, không push `--force`, không merge — xong thì commit trên nhánh và báo lại. Xong việc nhớ **tắt dev server 5191**.

---

## Bối cảnh

Panel trái › **Mẫu › Bộ màu** hiện có **18 bộ** (8 gốc + 10 bộ thêm ở commit `7530f89`: 8 sáng, 2 tối). Áp bộ màu **chỉ đổi kiểu** (màu, phông, nền, viền, bóng, motif), **không đổi bố cục** — `applyDeckDesign` + `keepGeometry` trong `src/lib/slideEdit.ts`. Thêm **10 bộ mới, tất cả nền sáng** (`dark: false`), tổng **28 bộ**.

**Làm theo đúng khuôn của commit `7530f89`** (đọc `git show 7530f89` trước khi bắt đầu — đó là mẫu chuẩn: mỗi bộ chạm những file nào, test sửa ra sao).

## Đọc trước

- `git show 7530f89` — mẫu thêm 10 bộ lần trước.
- `src/lib/slideTheme.ts` — `DECK_THEMES` (mỗi bộ một `DeckTheme`: `bg, fg, surface, muted, accent, secondary, chart[5], radius, shadow, border, borderColor, fonts, decor, dark, tags, vibe`).
- `src/lib/slideSkins.ts` — `SlideSkin` (phông, `createTitleSlide`, `createClosingSlide`, `createSectionSlide?`, `transformSlide` chèn motif riêng của bộ) và map `SLIDE_SKINS`.
- `src/lib/slideDesigns.ts` — `SLIDE_DESIGNS` (bộ: `id, name, description, themeId, decorKit?, stylePack?, slides[]`) và `ALIASES` (tên tiếng Việt có/không dấu → id, để AI và ô tìm hiểu được).
- `src/examEditor/slide.css` — `.slide-design-card__preview[data-motif='…']` (hình motif trên thẻ chọn bộ màu).
- `src/examEditor/SlideDesignGrid.tsx`, `src/examEditor/SlideSidePanel.tsx` — nơi hiện thẻ (thường không cần sửa).
- `src/pages/PreviewDesigns.tsx` — trang `/preview-designs` xem toàn bộ bộ màu.
- Phông: `src/main.tsx` (import `@fontsource/...`), `fontStack` trong `src/examEditor/slideRender.tsx`, `WEB_FONT_FALLBACK` trong `src/lib/exportDeck.ts`.

## 10 bộ cần làm (gợi ý — được đổi tên/màu cho đẹp hơn, nhưng giữ đủ 10, đều sáng, không trùng 18 bộ cũ)

| id gợi ý | Tên | Hướng màu / cảm giác | Hợp với |
|---|---|---|---|
| `bac-ha` | Bạc hà | nền trắng ngà ánh xanh bạc hà, accent xanh lá đậm | Sinh học, KHTN |
| `hong-dao` | Hồng đào | nền kem đào, accent cam san hô | Ngữ văn, kỹ năng sống |
| `oai-huong` | Oải hương | nền tím rất nhạt, accent tím than | Âm nhạc, mĩ thuật |
| `cat-vang` | Cát vàng | nền be cát, accent nâu đất + xanh ô liu | Địa lí, du lịch |
| `chanh-tuoi` | Chanh tươi | nền trắng, accent vàng chanh đậm + xanh lá | Toán tiểu học, trò chơi |
| `bau-troi` | Bầu trời | nền xanh trời rất nhạt, motif mây | KHTN, Vật lí |
| `bao-tuong` | Báo tường | trắng – đen kiểu tạp chí, điểm nhấn đỏ, chữ có chân cho tiêu đề | Lịch sử, GDCD, tin tức |
| `hinh-hoc-mau` | Hình học màu | nền trắng, khối tròn/vuông/tam giác màu cơ bản (kiểu Bauhaus) | Toán hình, mĩ thuật |
| `bang-trang` | Bảng trắng | nền trắng xám nhạt như bảng trắng, chữ "bút dạ" xanh/đỏ | Lớp học hằng ngày |
| `tet-xuan` | Tết xuân | nền kem, đỏ son + vàng kim, hoa mai/đào cách điệu | Sự kiện, chủ đề Tết |

Mỗi bộ phải có **cá tính riêng** (motif trong `transformSlide` + slide Tiêu đề / Kết thúc dàn tay), không chỉ đổi màu.

## Yêu cầu bắt buộc

1. **Đúng 28 bộ**, 10 bộ mới đều `dark: false`; `id` và `bg` không trùng bộ nào.
2. **Tương phản**: chữ trên nền và chữ trên accent đạt ≥ 4,5 : 1 (test có sẵn kiểm). Màu vàng/chanh/đào dễ trượt — chỉnh accent đậm đủ.
3. **Phông có tiếng Việt**: dùng lại phông đang có (Be Vietnam Pro, Nunito, Lora, Patrick Hand, Space Grotesk, JetBrains Mono, Times New Roman). Muốn thêm thì **tối đa 2 phông** `@fontsource/*` có subset `vietnamese`; nhớ thêm vào `main.tsx`, `fontStack` và `WEB_FONT_FALLBACK` (xuất PPTX đổi sang phông hệ thống gần giống).
4. **Áp bộ màu không đổi bố cục**: áp cả 28 bộ lên một deck 7 slide có sẵn → 0 slide đổi `x, y, w, h`; áp A → B → A ra cùng kết quả (như kiểm ở phiên 39).
5. Thẻ "Mặc định" vẫn đưa về theme Sáng như cũ; deck cũ dùng 18 bộ cũ trông **y như trước**.
6. Thêm `ALIASES` cho 10 bộ (có dấu và không dấu), thêm ca test alias vào `scripts/check-designs.ts`.
7. Cập nhật số **18 → 28** trong `scripts/check-designs.ts`, `scripts/test-slide-theme.mjs`, `scripts/test-slide-plan.mjs` (và chỗ nào khác test đếm số bộ).
8. Motif thẻ chọn (`data-motif` trong `slide.css`) cho 10 bộ mới.
9. Không đụng bộ máy trình chiếu, ribbon, AI panel, hay bố cục slide.
10. Tooltip dùng `data-tip`, không `title=`.

## Lưu ý kỹ thuật (đã gây lỗi lần trước)

- **Kiểu xuống dòng**: nhiều file trong repo là **CRLF**. Đừng để công cụ ghi lại cả file thành LF (`sed -i`, một số trình sửa) — diff sẽ thành thay đổi cả file và gộp nhánh bị xung đột toàn bộ. Trước khi commit chạy `git diff --stat`: file nào hiện hàng nghìn dòng là đã đổi EOL → sửa lại. Kiểm bằng `git ls-files --eol <file>` (cột `i/` và `w/` phải giống nhau).

## Kiểm tra trước khi báo xong

1. `node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit` sạch.
2. `npm run test:designs`, `npm run test:slide-theme`, `npm run test:slide-plan`, `npm run test:slide-contrast` đều qua.
3. Trình duyệt cổng 5191, khung 1440×900:
   - Mở `/preview-designs`, chụp màn hình **đủ 10 bộ mới** (cả slide Tiêu đề, một slide nội dung, slide Kết thúc).
   - Panel trái › Mẫu › Bộ màu: thẻ 10 bộ mới hiện đúng motif; áp từng bộ lên deck có sẵn, bố cục không xê dịch.
   - Trình chiếu 1 deck dùng bộ mới, và tải PPTX mở thử (phông thay thế hợp lý).
4. Báo lại: danh sách file đã sửa, ảnh chụp 10 bộ, phông có thêm không, phần nào chưa làm được và vì sao.
