# Prompt: tab Mẫu của soạn slide, gồm "Bố cục" và "Thiết kế" (8 bộ slide mẫu)

> **Nhánh mới** `feat/mau-slide` tạo từ `main` mới nhất, trong **thư mục riêng** (thư mục dự án chính đang có agent khác làm):
> ```
> git fetch origin && git worktree add ../dethinhbien-mau-slide -b feat/mau-slide origin/main
> ```
> Làm trong `../dethinhbien-mau-slide`; chạy `npm install` trước. Không làm trên `main`, không push `--force`.

---

## Tổng quan

Cột trái soạn slide → tab **Mẫu** (`TemplatesPanel` trong `src/examEditor/SlideSidePanel.tsx`). Hiện tab này chỉ có 22 **bố cục** một slide (`SLIDE_LAYOUTS`, `src/lib/slideLayouts.ts`); bấm vào thì thêm một slide theo bố cục đó.

Việc cần làm:
- **A.** Thêm thanh chuyển trên cùng tab Mẫu, gồm hai mục **Bố cục** | **Thiết kế**. Dùng lại component `Segmented` có sẵn (`src/components/Segmented.tsx`).
- **B.** Mục **Bố cục**: là 22 bố cục hiện có, làm cho đẹp hơn.
- **C.** Mục **Thiết kế**: **8 bộ slide mẫu đúng nghĩa**. Mỗi bộ là một phong cách hoàn chỉnh (màu, font, trang trí) kèm khoảng 6–8 slide. Bấm một bộ thì chèn cả bộ vào sau slide cuối của bài.
- **D.** Trợ lý AI trong web biết 8 bộ thiết kế này. Người dùng nói "làm giống thiết kế X" thì AI tạo hoặc sửa slide theo đúng phong cách đó.

Không đụng các tab khác của cột trái (Đồ hoạ, Icon, Tải lên, Công cụ), thanh icon, ribbon.

Đọc trước để hiểu dữ liệu:
- `src/store/docs.ts`: `Deck` (có `theme: DeckTheme` chung cho cả bài, `style?`) và `Slide` (`background`, `customBg`, `layout`, `tone`, `decorKit`, `elements`).
- `src/lib/slideTheme.ts` (`DECK_THEMES`, `themeById`, `normalizeTheme`), `src/lib/slideDecor.ts` (`DECOR_KITS`), `src/lib/slideStyles.ts` (`SLIDE_STYLE_PACKS`, `stylePackCatalogText`), `src/lib/slideLayouts.ts` (`composeLayout`, `withPlaceholders`, `contentFromSlide`).
- `src/examEditor/SlideEditor.tsx`: `addLayout` (qua `panelHandlers.current.addLayout`), `SlideThumb`, cách đổi theme cả bài, chỗ AI sửa slide bằng lệnh có cấu trúc (khoảng dòng 720), `appendSlidesToDeck` (`src/lib/slideAi.ts`).
- `src/lib/aiDeck.ts`: chỗ prompt AI liệt kê style pack / decor kit.

## A. Thanh chuyển Bố cục | Thiết kế

- Đặt trên cùng tab Mẫu, rộng hết panel, dùng `Segmented` y như các chỗ khác trong web.
- Nhớ mục đang chọn trong phiên (state). Có thể lưu `localStorage`, bọc try/catch.
- Đổi mục có hiệu ứng nhẹ (mờ dần khoảng 150ms), không chớp.

## B. Bố cục (22 bố cục hiện có)

Hiện tại trông cứng: hình nhỏ là các khối CSS trừu tượng khoảng 60×32px (`.slide-layout-thumb--<id>` trong `src/examEditor/compose.css`), lọt thỏm trong ô to, khó đoán bố cục, không chia nhóm, ô đầu có nền xám khác các ô còn lại.

1. **Hình xem trước thật:** slide thu nhỏ 16:9 rộng gần hết ô (2 cột, khoảng 118px ở panel 280px). Nội dung là bố cục thật với nội dung giữ chỗ, theo **theme hiện tại của bài**. Dựng bằng chính đường `addLayout` / `composeLayout` + `withPlaceholders`, vẽ bằng `SlideThumb`. Truyền theme vào `SlideSidePanel` qua prop nếu chưa có. Bố cục nào không dựng được thì dùng lại hình CSS cũ cho riêng bố cục đó.
2. **Chia nhóm** có tiêu đề nhỏ (cùng kiểu tiêu đề nhóm ở tab Đồ hoạ), ví dụ: Mở đầu & kết thúc / Nội dung chữ / Hình ảnh / Số liệu & bảng / Sơ đồ / Câu hỏi & ví dụ. Giữ thứ tự trong nhóm theo `SLIDE_LAYOUTS`.
3. **Thẻ đều nhau:** mọi ô cùng nền và viền mảnh. Hình bo góc, viền 1px nhạt, bóng rất nhẹ. Tên 12px, một dòng, dài thì cắt bằng `…`. Rê chuột: viền màu `clay`, hình nhấc nhẹ (`translateY(-1px)`, bóng đậm hơn), khoảng 150ms. Focus bàn phím có viền rõ. Giữ `title` mô tả.
4. **Chức năng giữ nguyên:** bấm là thêm đúng slide bố cục đó.

## C. Thiết kế (8 bộ)

### Dữ liệu

Tạo `src/lib/slideDesigns.ts`:

```ts
export interface SlideDesign {
  id: string            // 'thanh-lich', 'tre-trung'…
  name: string          // tên hiển thị tiếng Việt
  description: string   // một câu: hợp với môn/lứa tuổi/dịp nào
  themeId: string       // id trong DECK_THEMES, hoặc tự khai báo theme riêng nếu cần (thêm vào DECK_THEMES)
  decorKit?: string     // id trong DECOR_KITS
  stylePack?: string    // id trong SLIDE_STYLE_PACKS (dùng cho AI)
  /** dàn slide của bộ: layout + nội dung mẫu + tông nền */
  slides: Array<{ layout: SlideLayoutId; tone?: SlideTone; content: Partial<SlideLayoutContent> }>
}
export const SLIDE_DESIGNS: SlideDesign[]
export function buildDesignSlides(design: SlideDesign): Slide[]  // dựng Slide thật bằng composeLayout
```

- Dựng slide **chỉ** bằng các bố cục, theme, decor kit, style pack **đã có**. Được thêm theme hoặc decor kit mới vào danh mục có sẵn nếu cần cho đủ 8 phong cách khác nhau rõ rệt. Không viết cách vẽ slide mới.
- Mỗi bộ có **6–8 slide**, dàn theo một bài giảng thật, ví dụ: Tiêu đề → Mục tiêu bài học → Nội dung (2–3 slide với bố cục khác nhau: danh sách, hai cột, ảnh + chữ, số liệu, tiến trình…) → Câu hỏi / ví dụ → Kết thúc.
- Nội dung mẫu bằng tiếng Việt, hợp lớp học, ngắn gọn (ví dụ chủ đề "Vòng tuần hoàn của nước", "Phân số", "Cách mạng tháng Tám"…), để giáo viên thấy ngay cách dùng. Không dùng tên người thật, logo hay thương hiệu.
- **8 bộ phải khác nhau rõ** về màu, font, trang trí và nhịp bố cục. Gợi ý: Thanh lịch tối giản / Trẻ trung nhiều màu (tiểu học) / Học thuật nghiêm túc (THPT) / Thiên nhiên xanh / Công nghệ tối màu / Cổ điển giấy (Văn, Sử) / Vui nhộn hoạt hình / Bảng đen phấn trắng. Được đổi theo ý bạn, nhưng ghi lý do vào handoff.

### Giao diện mục Thiết kế

- Mỗi bộ là một **thẻ to rộng hết panel**: ảnh bìa (slide đầu, vẽ bằng `SlideThumb` theo theme **của bộ**, không theo theme bài) + hàng 3–4 slide nhỏ phía dưới (hoặc một dải cuộn ngang xem trước) + tên + mô tả 1 dòng + số slide ("7 slide").
- Rê chuột: viền màu `clay`, nhấc nhẹ. Có nút **"Thêm vào bài"** rõ ràng. Bấm thẻ cũng được.
- Hiệu năng: dựng sẵn slide xem trước bằng `useMemo` (chỉ một lần, không phụ thuộc theme bài); render lười khi cuộn tới. Mở mục Thiết kế không được khựng.

### Khi bấm "Thêm vào bài" (đã thống nhất với chủ dự án)

- **Bài đang trống** (chưa có slide, hoặc chỉ có 1 slide trống mặc định): đặt luôn `deck.theme` theo theme của bộ, `deck.style` theo bộ, rồi thêm các slide của bộ. Không hỏi. Nếu có slide trống mặc định thì thay nó.
- **Bài đã có slide:** hiện hộp hỏi (dùng component modal/xác nhận có sẵn trong web) với 2 lựa chọn + Huỷ:
  1. **"Đổi cả bài sang giao diện này"**: đổi `deck.theme` (và `style`) sang của bộ. Slide cũ đổi màu/font theo đúng cách nút đổi chủ đề hiện có đang làm (giữ `customBg` của người dùng). Rồi chèn bộ slide vào sau slide cuối.
  2. **"Giữ giao diện hiện tại, chỉ thêm slide"**: không đổi theme. Bộ slide mới mang bố cục + nội dung mẫu và dựng lại theo theme hiện tại của bài.
- Chèn **sau slide cuối**, chọn slide đầu của bộ vừa chèn và cuộn tới nó. Mỗi slide có `id` mới (`uid`).
- **Hoàn tác được trong một bước** bằng lịch sử hoàn tác có sẵn của trình soạn slide.
- Trên điện thoại (ngăn kéo đáy): thẻ co theo bề ngang, chèn xong tự đóng ngăn kéo.

## D. AI biết các bộ thiết kế

1. Thêm `designCatalogText()` vào `slideDesigns.ts`, liệt kê mỗi bộ: id, tên, mô tả, theme, decor kit, style pack, nhịp bố cục. Đưa đoạn này vào prompt AI ở những chỗ đang có `stylePackCatalogText()` / `decorKitCatalogText()` (`src/lib/aiDeck.ts`, `src/lib/slideAi.ts`).
2. **Tạo bài mới bằng AI:** người dùng nói "theo thiết kế Thanh lịch", "giống mẫu bảng đen"… thì dàn ý AI chọn đúng `themeId` / `decorKit` / `stylePack` của bộ đó, và bám nhịp bố cục của bộ.
3. **Sửa bài có sẵn bằng AI** (chỗ AI sửa slide bằng lệnh có cấu trúc trong `SlideEditor.tsx`): thêm hoặc dùng lệnh **áp thiết kế** (ví dụ `apply_design { id }`). Lệnh này đổi theme + style cả bài như lựa chọn 1 ở trên. Người dùng nói "đổi bài này sang kiểu thiết kế Công nghệ" thì AI gọi lệnh đó. Phải hoàn tác được như các lệnh AI khác.
4. AI nhận cả tên tiếng Việt có/không dấu và cách gọi gần đúng ("mẫu bảng đen", "kiểu tối giản").

## Không được

- Không đổi chức năng bố cục hiện có, cách dựng slide, xuất PPTX (bộ thiết kế xuất PPTX được vì dùng bố cục có sẵn).
- Không đổi các tab khác của cột trái.
- Không thêm thư viện.
- Không ghi đường dẫn tuyệt đối ra ngoài dự án vào code.

## Kiểm tra trước khi báo xong

1. `npx tsc -p tsconfig.app.json --noEmit` sạch (**không** dùng `tsc -p .`).
2. Viết test nhỏ `scripts/check-designs.ts` (thêm script `test:designs` vào `package.json`). Với cả 8 bộ: `buildDesignSlides` dựng đủ slide, không lỗi, mọi `layout` / `themeId` / `decorKit` / `stylePack` đều tồn tại, mỗi bộ có 6–8 slide. Chạy đạt. Chạy thêm `npm run test:export`, phải đạt.
3. Dev: `npm run dev -- --port 5186 --host 127.0.0.1`, mở `/soan-de`, soạn slide. Chụp ảnh **trước/sau** tab Mẫu (cả Bố cục và Thiết kế) ở 1280×800 và 390×844, lưu ở `docs/handoff/mau-slide-anh/`.
4. Thử chèn thiết kế:
   - vào bài trống: theme đổi theo bộ, không hỏi;
   - vào bài có sẵn slide: hộp hỏi hiện ra; thử cả 2 lựa chọn và nút Huỷ;
   - hoàn tác một bước thì bài về như trước khi chèn;
   - xuất PPTX một bài vừa chèn thiết kế, mở được.
5. Thử AI (nếu có `LLM_API_KEY` trong `.env`): yêu cầu "tạo bài về phân số theo thiết kế …" và "đổi bài này sang thiết kế …". Ghi kết quả. Không có key thì ghi rõ là chưa thử.
6. Mở tab Mẫu → Thiết kế, đo bằng Performance của DevTools. Không có tác vụ dài quá 100ms.

## Bàn giao

Commit nhỏ theo phần A/B/C/D, message tiếng Việt, push nhánh `feat/mau-slide`. Viết `docs/handoff/mau-slide.md`: đã làm gì, file nào, danh sách 8 bộ (tên, theme, lý do chọn), cách chia nhóm bố cục, ảnh trước/sau, kết quả kiểm tra, chỗ còn chưa ưng.
