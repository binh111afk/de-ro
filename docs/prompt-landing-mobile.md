# Prompt: gọn landing page trên điện thoại

> Đưa nguyên file này cho agent (Antigravity CLI). Làm trên **nhánh riêng** `feat/landing-mobile`, không commit lên `main`, không push.

---

## Bối cảnh

Dự án: web soạn đề thi tiếng Việt (React 19 + TypeScript + Vite 6 + Tailwind v4). Đọc phần đầu `context.md` trước.

Trang chủ (`src/pages/Home.tsx`) ghép 8 section trong `src/pages/home/`. Trên điện thoại trang **quá dài**: đo ở khung 375×812 tổng cộng khoảng **9.800px ≈ 12 màn hình**:

| Section | File | Cao (px) | ≈ màn |
|---|---|---|---|
| Hero | `HeroSection.tsx` | 885 | 1,1 |
| Đề, slide và bảng vẽ mở chung một chỗ | `WorkspaceSection.tsx` | 1406 | 1,7 |
| Vẽ hình theo đúng kiểu sách giáo khoa | `DrawingToolsSection.tsx` | **2043** | **2,5** |
| Bảng để giảng và chữa bài | `BoardSection.tsx` | 1121 | 1,4 |
| Trợ lý AI trong trang soạn | `AiWorkflowSection.tsx` | 1069 | 1,3 |
| Cho học sinh làm online hoặc chấm phiếu giấy | `OnlineGradingSection.tsx` | 1196 | 1,5 |
| Sửa đề trên điện thoại | `MobileSection.tsx` | 1019 | 1,3 |
| Đề đã soạn được lưu lại | `CommunityCtaSection.tsx` | 1076 | 1,3 |

Nguyên nhân chung: bố cục desktop (2 cột, lưới thẻ, demo lớn) chỉ bị xếp chồng thành 1 cột trên điện thoại, nên mọi thẻ/ảnh demo/khoảng đệm đều dồn dọc.

## Mục tiêu

- Tổng chiều cao trang ở 375px **≤ khoảng 6.000px (~7 màn)**; không section nào cao quá **~1,2 màn (≈ 1.000px)**, `DrawingToolsSection` và `WorkspaceSection` là ưu tiên số 1.
- Mỗi section trên điện thoại đọc được trong một lần lướt: tiêu đề → 1 câu mô tả → **một** hình minh hoạ → nút/điểm chính.
- **Desktop (≥ `md`) giữ nguyên tuyệt đối.** Chỉ thêm/sửa class cho màn nhỏ (class mặc định không tiền tố là mobile; giữ nguyên mọi class `md:`/`lg:` đang có, hoặc tách bằng `md:` khi cần đổi mặc định).

## Cách làm (chọn theo từng section)

1. **Danh sách thẻ / lưới tính năng** xếp chồng dài → trên mobile đổi thành **hàng cuộn ngang có snap** (`flex overflow-x-auto snap-x snap-mandatory`, mỗi thẻ `snap-start shrink-0 w-[80%]`, ẩn thanh cuộn, lề âm để thẻ chạm mép như app). Desktop vẫn là lưới như cũ (`md:grid md:overflow-visible …`). Trước khi tự làm, tìm trong `src/` xem đã có khối cuộn ngang/carousel nào dùng lại được không (quy tắc dự án: có sẵn thì dùng lại).
2. **Nhiều demo/ảnh minh hoạ trong một section** → mobile chỉ giữ **một** demo tiêu biểu (`hidden md:block` cho phần còn lại), hoặc gộp vào hàng cuộn ngang ở mục 1.
3. **Demo/khung mô phỏng quá cao** → giới hạn chiều cao trên mobile (vd. `max-h-[…] overflow-hidden` hoặc thu `aspect-ratio`), không để demo cao hơn ~60% màn.
4. **Khoảng đệm**: giảm `py`/`gap`/`mt` của section trên mobile (vd. `py-20 md:py-28` → `py-12 md:py-28`). Đừng giảm cỡ chữ thân dưới 15px.
5. **Danh sách gạch đầu dòng dài** (> 3 ý) → mobile chỉ hiện 3 ý đầu, phần còn lại `hidden md:list-item` (không thêm nút "Xem thêm").
6. Hero: giữ CTA chính trong màn đầu tiên (không phải cuộn mới thấy nút).

## KHÔNG được

- **Không thêm chữ mới** (dòng phụ, giải thích, nút "Xem thêm", nhãn "Vuốt để xem"…). Chỉ được ẩn bớt hoặc sắp xếp lại nội dung có sẵn trên mobile. Không sửa câu chữ.
- Không xoá section, không đổi thứ tự section, không đổi nội dung desktop.
- Không thêm thư viện (không swiper/embla…). Không tạo component carousel mới nếu đã có cái dùng được.
- Không đụng `reveal.ts` / hiệu ứng hiện dần trừ khi nó làm vỡ hàng cuộn ngang (khi đó báo lại).
- Không có thanh cuộn ngang của **cả trang** (chỉ hàng thẻ được cuộn ngang).

## Lưu ý kỹ thuật

- **Nhiều file dùng CRLF.** Không sửa bằng `sed -i` hay Python ghi text thường. Sau khi sửa chạy `git ls-files --eol <file>` và `git diff --stat`: file nào báo đổi hàng trăm dòng là đã hỏng xuống dòng — khôi phục lại.
- Trang chủ cuộn trong một khung riêng (không phải `window`), đo chiều cao bằng `section.getBoundingClientRect().height`.

## Kiểm tra trước khi báo xong

1. `npx tsc -p tsconfig.app.json --noEmit` sạch.
2. `npm run dev` → `http://127.0.0.1:5184`, khung **375×812** và **390×844**: đo lại chiều cao từng section (cuộn hết trang một lượt trước để các khối hiện dần đã hiện), điền bảng trước/sau.
3. Không có cuộn ngang cả trang ở 360px (`document.documentElement.scrollWidth <= innerWidth`).
4. Hàng thẻ cuộn ngang vuốt được, thẻ dừng đúng mép (snap).
5. Khung **1280×800**: so ảnh chụp trước/sau từng section — phải giống hệt.

## Báo lại

- Bảng: section — cao trước — cao sau — đã làm gì (cuộn ngang / ẩn demo phụ / giảm đệm …).
- Tổng chiều cao trước/sau ở 375px.
- Mục "Không làm được / cần quyết": chỗ nào phải bỏ bớt nội dung đáng kể mới gọn được thì liệt kê, **đừng tự xoá**.
