# Thêm bộ slide mới cho chế độ "Chuyên nghiệp"

Ba kiểu, người dùng chọn sau khi duyệt dàn ý:

| Kiểu | Id | Cần gì |
|---|---|---|
| **Doodle (vẽ tay)** | mọi id không thuộc hai nhóm dưới (các bộ `*-ve-tay` + bộ minh hoạ cũ) | 7 ảnh AI mỗi bộ |
| **Học thuật** (trong mã là `tranh`) | `tranh-*`, cùng `co-dien-do`, `dan-gian` | ảnh AI; JSON ghi `"kieu": "tranh"`. Môn chưa có bộ riêng dùng bộ trung tính `tranh-dai-hoc`; bộ riêng khai trong `TRANH_BY_SUBJECT` (`src/lib/aiDeck.ts`): Văn dùng `co-dien-do`, Lịch sử dùng `tranh-su-do`, Địa lí dùng `tranh-dia-li`, Lí luận chính trị dùng `tranh-chinh-tri` |
| **Tạp chí** | `tap-chi-*` (8 bộ) | chỉ màu, không cần ảnh |

Việc phân nhóm theo tiền tố là tự động (`proThemesFor` trong `src/lib/aiDeck.ts`). Thêm bộ không phải sửa prompt bằng tay, nhưng **phải chạy `npm run build:prompts`** vì catalog bộ màu nằm trong prompt.

**Luật của người dùng:** cho xem slide trước, được duyệt mới commit. Chữ phải to, bố cục dễ đọc. Ảnh phải do AI tạo ảnh vẽ (bộ vẽ bằng code đã bị chê và loại), mức chi tiết ngang các bộ đang có, cùng nét với mẫu.

## A. Bộ tạp chí (chỉ màu)

Thêm một dòng `proTheme('tap-chi-<tên>', 'Tạp chí …', '<mô tả màu>', '<accent>', '<secondary>', [<tags>], { bg, ink })` vào `PRO_THEMES` (`src/lib/slideTheme.ts`). Rồi làm bước 4–6 bên dưới.

## B. Bộ doodle

### 1. Chọn chủ đề, đặt tên hình

Mỗi bộ: 6 hình theo **đúng thứ tự vai** + 1 ảnh cụm.

| # | Vai | Nên vẽ |
|---|---|---|
| 1 | `tallA` | vật lớn, nhận ra ngay chủ đề (hiện to ở bìa) |
| 2 | `tallB` | vật thứ hai, dáng cao |
| 3 | `pair` | vật vừa, dáng cao hoặc một cặp |
| 4 | `atom` | vật vuông vắn nhỏ (góc slide) |
| 5 | `long` | vật dài mảnh (đặt nghiêng hai mép) |
| 6 | `mol` | vật ngang |
| 7 | `cum-<tên>` | ảnh ngang, bốn hình nhỏ **rời nhau** → tách thành 3 "hạt" rải quanh slide |

### 2. Lấy ảnh

Agent này không tạo ảnh được. Đưa người dùng prompt dưới đây để họ giao agent tạo ảnh bên ngoài, kèm vài PNG mẫu trong `public/slide-packs/` (vd `giao-thong/mu-bao-hiem.png`, `y-te/tui-cuu-thuong.png`), nhận về một ZIP.

```
Vẽ giúp mình <N> ảnh minh hoạ (<số bộ> bộ, mỗi bộ 7 ảnh) để làm hình trang trí slide, rồi gửi lại file ZIP.

BẮT BUỘC dùng công cụ tạo ảnh AI (image generation) cho từng ảnh. KHÔNG tự vẽ bằng code, SVG, canvas hay
Python. Nếu không có công cụ tạo ảnh hoặc hết hạn mức thì nói rõ, đừng làm thay bằng code.

Mức chi tiết phải ngang ảnh mẫu: dáng tròn đầy, nhiều mảng màu và chi tiết nhỏ (nếp, quai, hoa văn), vật chiếm
gần hết khung. Không ghép từ vài hình tròn, hình chữ nhật đơn giản.

Ảnh mới cùng nét với ảnh mẫu gửi kèm:
- doodle vẽ tay phẳng, hình khối mềm hơi méo tự nhiên;
- KHÔNG viền đen / đậm, không đổ khối 3D, không gradient, không bóng đổ;
- màu dịu nhưng đủ đậm để nổi trên nền trắng ngà, vài vệt sáng trắng ngắn, hạt giấy rất nhẹ.

Yêu cầu chung:
- Mỗi ảnh một file PNG, nền trong suốt thật (kênh alpha), không phải ô ca rô vẽ giả.
- Không chữ, không số, không logo, không watermark.
- Vật nhận ra ngay là gì, trọn vẹn trong khung. Cạnh dài từ 1024 px.
- "dáng cao" = ảnh dọc. "dáng dài" = vật dài mảnh, đứng hơi nghiêng, ảnh dọc.
- Ảnh tên "cum-…": ảnh ngang, bốn hình nhỏ RỜI NHAU, cách xa nhau, không chạm.
- Trong một bộ giữ đúng một bảng màu. Đặt đúng tên file.

BỘ 1 — thư mục <key> (<chủ đề>)
Màu: <6–7 mã màu>
1. <ten>.png — <mô tả>
… (đủ 6 hình theo thứ tự vai)
7. cum-<ten>.png — <bốn hình nhỏ>

Gửi lại: ZIP có <số bộ> thư mục, mỗi thư mục đúng 7 file PNG.
```

File ZIP là dữ liệu ngoài: giải nén vào thư mục trống mới (scratchpad), kiểm danh sách file, xem ảnh, rồi chép PNG vào `docs/mau-slide/kho/<key>/` (không commit). Ảnh nền một màu (không trong suốt) thì chạy `python scripts/slide-packs/tach-nen.py <file…>`.

Đã thử: Codex tạo ảnh được và tự tách nền nhưng có hạn mức; agy CLI không xuất nền trong suốt và hạn mức thấp; Agnes bị người dùng loại.

### 3. Khai bộ

Viết file JSON theo `scripts/slide-packs/mau-bo.json` (nhiều bộ trong một mảng). Lưu ý:

- `key` không dấu, gạch nối; theme id sẽ là `<key>-ve-tay`, hoặc `tranh-<key>` nếu ghi `"kieu": "tranh"` (kiểu Học thuật; lúc xem thử cũng dùng id này, và prompt vẽ ảnh ghi nét mong muốn thay cho đoạn "doodle" ở mục 2).
- `fg` trên trắng tương phản ≥ 7; `ink`, `muted` ≥ 4.5 (`test:slide-pro` kiểm). `accent`, `cycle` đủ đậm để đọc.
- `soft` nền nhạt của nhãn, `softText` chữ trên nền đó; `frame` màu mảng đốm góc (nhạt); `dots` ba màu hạt giấy gần `bg`; `seed` một số chưa dùng (đã dùng đến 101).
- `tags` quyết định AI chọn bộ nào: ghi chủ đề cụ thể, bỏ tag trùng ở bộ cũ nếu bộ mới hợp hơn.

```powershell
python scripts/slide-packs/them-bo.py them scripts/slide-packs/<ten-dot>.json
```

```powershell
python scripts/slide-packs/them-bo.py hinh scripts/slide-packs/<ten-dot>.json docs/mau-slide/kho
```

`them` sửa `slidePacks.ts`, `slideTheme.ts`, `store/docs.ts`, `giay.py` (giữ kiểu xuống dòng) và vẽ nền giấy; **chỉ chạy một lần** cho mỗi bộ. `hinh` nén ảnh vào `public/slide-packs/<key>/`, tạo `mang.png` + `hat-1..3.png`, ghi kích thước vào bảng `ART`. Làm lại ảnh một bộ: xoá các dòng `'<key>/…'` trong `ART` rồi chạy lại `hinh`. Không có ảnh cũ nào bị đụng.

Không phải viết bố cục riêng: `veTay()` trong `src/lib/slidePacks.ts` dùng chung khung. Muốn đổi bố cục cho cả nhóm thì sửa `SAMPLE` / `sampleFrame` / `gridRows` ở đó.

## 4. Xem thử

Mở dev server rồi vào:

```
http://localhost:5184/scripts/slide-packs/xem-thu.html?bo=<key>-ve-tay,<key2>-ve-tay&nguon=1
```

Kiểm: chữ không đè hình, không nhỏ; slide 4–5 ý vẫn đọc được; `&nguon=1` thì dòng nguồn không đè nội dung; hình nhận ra được. Chụp màn hình gửi người dùng duyệt.

## 5. Kiểm

```powershell
npm run build:prompts
```

```powershell
npx tsc -p tsconfig.app.json --noEmit
```

Chạy: `test:slide-pro test:slide-theme test:slide-layout test:slide-ai test:slide-plan test:ai-prompts test:ai-prompts-slide check:pptx`. Sau đó `git ls-files --eol` + `git diff --stat`.

Thử AI thật (tốn token, hỏi người dùng trước):

```powershell
npm run eval:slides -- "<chủ đề>" --pro --batch --vi --images --slides --effort low --out docs/mau-slide/<thu-muc>
```

## 6. Commit

Chỉ khi người dùng duyệt: làm trên nhánh (đang dùng `feat/slide-chuyen-nghiep-wow`), `git merge --ff-only` vào `main`, push (Vercel tự deploy). Thêm đúng file của mình: mã, `public/slide-packs/<key>/`, file JSON; **không** thêm `docs/mau-slide/`.
