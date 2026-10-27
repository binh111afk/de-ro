# Brief: 100 đồ hoạ vector cho trình soạn slide

> **Trạng thái 27/10/2026:** chủ dự án đã giao sheet **112 icon** (100 gốc + 12 bổ sung:
> tam giác, đường tròn, dấu căn, bộ hình cơ bản, hộp bút, lớp học, từ điển, bánh răng,
> tên lửa, phong bì, ghim vị trí, nơ). Đã nhập vào engine bằng
> `scripts/import-graphics.mjs` → `src/lib/graphics.ts` (xem context 3.50). Brief dưới
> đây giữ làm chuẩn thiết kế cho các đợt bổ sung sau; các mục còn thiếu so với brief:
> bàn tính, phân số, bảng đen, ô số thứ tự, khung thoại lớn, viền dải.

Mục đích: kho đồ hoạ vector kiểu `addGraphic` của soandethi — AI chọn theo `id` + keyword,
engine giữ tỉ lệ, đặt vào slide thay cho ảnh AI. Xuất từ Figma (hoặc plugin vector AI) dưới
dạng SVG, nhúng vào `src/lib/graphics/` + registry `slideAssets.ts`.

Nguyên tắc: **đẹp nhưng phải cài được** — lưới cố định, nét đồng nhất, 2 tông, không chữ.

---

## 1. Prompt chính — dán nguyên vào ô prompt của Figma AI / plugin vector

### Bản tiếng Anh (khuyến nghị — model vector cho kết quả ổn định hơn)

```
Flat vector icon set for an educational slide editor, 100 icons, strict consistent style:
- 64x64 viewBox, centered, 4px safe padding, transparent background
- 2-tone flat design: one soft "fill" shape + one dark "ink" line layer named "fill" and "ink"
- ink stroke #22333B, uniform 3px stroke, round caps and joins
- fill colors from this 8-color pastel palette only: #B9D4EA #F6C6A8 #C6E5B3 #F5D6E0
  #D8CFF0 #F7E6A8 #BFE5DE #E8DCC8
- no gradients, no drop shadows, no 3D, no photorealism, no text or letters
  (exception: symbol group A B C D + - x / = % ? ! and check/cross marks, drawn as
  outlined shapes)
- geometric, friendly, educational mood, optical size consistent across the set
- every icon must read clearly at 32px
Output: one SVG per icon, flat, optimized, no background rectangle.
```

### Bản tiếng Việt (dùng khi công cụ hiểu tiếng Việt tốt hơn)

```
Bộ 100 icon vector phẳng cho trình soạn slide giáo dục, phong cách đồng nhất tuyệt đối:
- khung 64x64, căn giữa, chừa lề an toàn 4px, nền trong suốt
- thiết kế 2 tông: một khối màu "fill" + một lớp nét "ink"; đặt tên layer là "fill" và "ink"
- nét ink màu #22333B, độ dày đồng nhất 3px, đầu nét bo tròn
- chỉ dùng 8 màu pastel: #B9D4EA #F6C6A8 #C6E5B3 #F5D6E0 #D8CFF0 #F7E6A8 #BFE5DE #E8DCC8
- không gradient, không đổ bóng, không 3D, không tả thực, KHÔNG có chữ/ký tự
  (ngoại lệ: nhóm ký hiệu A B C D + − × ÷ = % ? ! và dấu tích/gạch chéo — vẽ dạng nét)
- hình học, thân thiện, tinh thần giáo dục; cỡ quang học đồng đều cả bộ
- mỗi icon vẫn đọc rõ ở 32px
Xuất: mỗi icon một file SVG phẳng, đã tối ưu, không có hình chữ nhật nền.
```

> Mẹo: trước khi chạy batch 100, sinh **3 icon mẫu** (thước êke, ống nghiệm, cúp) để chốt
> phong cách, rồi bắt tool giữ đúng style đó cho cả bộ. Nếu dùng Recraft/vector plugin:
> chọn model "Vector" / "Flat illustration", style "Outline + flat fill".

---

## 2. Quy chuẩn kỹ thuật (bắt buộc — để cài vào engine không phải sửa)

| Hạng mục | Quy định |
|---|---|
| Lưới | `viewBox="0 0 64 64"`, nội dung căn giữa, padding ≥ 4px mỗi bên |
| Nét | stroke `#22333B`, **3px đồng nhất**, `stroke-linecap="round"`, `stroke-linejoin="round"` |
| Màu fill | chỉ 8 màu pastel ở trên; tối đa **2 màu fill** mỗi icon |
| Layer | group `fill` (khối màu) đứng dưới, group `ink` (nét) đứng trên — để app tô lại theo theme |
| Chữ | cấm (trừ nhóm ký hiệu `sym-*`); chữ ở nhóm ký hiệu phải **convert sang outline** |
| Nền | trong suốt; không `rect` nền, không shadow, không gradient |
| Tỉ lệ | 1:1 mặc định; khung/banner/mũi tên dài dùng 4:3 hoặc 16:9 (ghi rõ trong bảng) |
| Kích thước file | mỗi SVG < 12 KB sau khi tối ưu (svgo) |
| Đặt tên | `<id>.svg` đúng theo cột id ở mục 3 |
| Kiểm tra | phóng to/thu nhỏ 32px → 256px xem có vỡ nét không; 10 icon đặt cạnh nhau phải cùng "trọng lượng thị giác" |

---

## 3. Danh sách 100 đồ hoạ (id · tên · tỉ lệ · keyword tìm kiếm)

> Keyword **viết không dấu** (engine search bằng chuỗi không dấu). Id dùng `kebab-case`.

### A. Toán & hình học — `math` (12)

| id | Tên | Tỉ lệ | Keyword |
|---|---|---|---|
| math-thuoc-thang | Thước kẻ | 1:1 | thuoc, thang, do, chieu dai |
| math-thuoc-ke | Thước êke tam giác vuông | 1:1 | eke, tam giac, goc vuong, hinh hoc |
| math-compa | Compa | 1:1 | compa, duong tron, ban kinh |
| math-may-tinh | Máy tính bỏ túi | 1:1 | may tinh, so hoc, phep tinh |
| math-ban-tinh | Bàn tính hạt | 1:1 | ban tinh, dem so, so hoc |
| math-truc-toa-do | Trục toạ độ + đồ thị parabol | 4:3 | toa do, ham so, do thi, parabol |
| math-tam-giac | Tam giác có góc đánh dấu | 1:1 | tam giac, goc, dinh, hinh hoc |
| math-duong-tron | Đường tròn + bán kính | 1:1 | tron, ban kinh, tam, hinh hoc |
| math-phan-so | Phân số trong khung | 1:1 | phan so, tu, mau, so hoc |
| math-can-bac | Dấu căn + kết quả | 1:1 | can bac, nghiem, bpt |
| math-can-bang | Cán cân phương trình | 4:3 | can bang, phuong trinh, bang nhau |
| math-hinh-co-ban | Bộ hình cơ bản (vuông/tròn/tam giác) | 1:1 | hinh hoc, hinh vuong, hinh tron |

### B. Khoa học & phòng thí nghiệm — `sci` (12)

| id | Tên | Tỉ lệ | Keyword |
|---|---|---|---|
| sci-be-thuy-tinh | Bình to đun | 1:1 | binh, dung dich, hoa hoc, nong do |
| sci-ong-nghiem | Ống nghiệm | 3:4 | on nghiem, thu nghiem, phong thi nghiem |
| sci-kinh-hien-vi | Kính hiển vi | 1:1 | kinh hien vi, phong thi nghiem, vi khuan |
| sci-nguyen-tu | Nguyên tử (hạt nhân + quỹ đạo) | 1:1 | nguyen tu, vat ly, hat nhan |
| sci-phan-tu | Phân tử (3 hạt nối nhau) | 1:1 | phan tu, hoa hoc, ket noi, hop chat |
| sci-dna | Xoắn DNA | 3:4 | dna, di truyen, sinh hoc |
| sci-nam-cham | Nam châm chữ U | 1:1 | nam cham, tu truong, vat ly |
| sci-den-y-tuong | Bóng đèn + tia sáng | 1:1 | den, y tuong, sang, phat minh |
| sci-mach-dien | Mạch điện + pin | 4:3 | mach dien, pin, dong dien, cong nghe |
| sci-banh-rang | Bánh răng | 1:1 | banh rang, co che, ky thuat |
| sci-thien-van | Kính viễn vọng + sao | 1:1 | kinh vien vong, thien van, vu tru |
| sci-ten-lua | Tên lửa | 3:4 | ten lua, vu tru, phong ten lua |

### C. Thiên nhiên — `nat` (9)

| id | Tên | Tỉ lệ | Keyword |
|---|---|---|---|
| nat-mat-troi | Mặt trời | 1:1 | mat troi, nang, thoi tiet |
| nat-dam-may | Đám mây + mưa | 4:3 | may, mua, thoi tiet, khi tuong |
| nat-la-cay | Chiếc lá | 1:1 | la cay, xanh, thien nhien |
| nat-cay | Cây + gốc | 1:1 | cay, rung, thien nhien |
| nat-hoa | Bông hoa | 1:1 | hoa, sac mau, thien nhien |
| nat-nui | Dãy núi | 4:3 | nui, canh quan, dia ly |
| nat-song-bien | Sóng biển | 4:3 | song, bien, lan song, dia ly |
| nat-que-dat | Quả địa cầu | 1:1 | que dat, trai dat, dia ly, the gioi |
| nat-gio | Nét gió | 1:1 | gio, thoi tiet, khi hau |

### D. Ngữ văn & đọc hiểu — `lang` (7)

| id | Tên | Tỉ lệ | Keyword |
|---|---|---|---|
| lang-sach-mo | Sách mở | 1:1 | sach, doc, van hoc, doc hieu |
| lang-sach-xep | Chồng sách | 1:1 | sach, thu vien, kho tri thuc |
| lang-but-viet | Bút viết | 1:1 | but, viet, sang tac, lam van |
| lang-bong-thoai | Bóng thoại | 1:1 | thoai, noi, giao tiep, ke chuyen |
| lang-thu | Phong bì thư | 1:1 | thu, van ban, gui thu |
| lang-tu-dien | Từ điển + kính lúp | 1:1 | tu dien, nghia, tu vung, tim kiem |
| lang-cuon-giay | Cuộn giấy | 1:1 | cuon giay, truyen, xua |

### E. Lịch sử & địa lý — `soc` (7)

| id | Tên | Tỉ lệ | Keyword |
|---|---|---|---|
| soc-ban-do | Bản đồ gấp + ghim | 4:3 | ban do, dia ly, vi tri, hanh trinh |
| soc-la-ban | La bàn | 1:1 | la ban, huong, dinh huong |
| soc-thap-co | Tháp/đình cổ | 3:4 | thap, di tich, lich su, van hoa |
| soc-trong-dong | Trống đồng | 1:1 | trong dong, dong son, van hoa, lich su |
| soc-co | Lá cờ | 1:1 | co, doc lap, su kien, lich su |
| soc-dong-ho-cat | Đồng hồ cát | 3:4 | dong ho cat, thoi gian, lich su |
| soc-ghim-vi-tri | Ghim vị trí | 1:1 | vi tri, danh dau, gps, dia diem |

### F. Lớp học & dụng cụ — `class` (10)

| id | Tên | Tỉ lệ | Keyword |
|---|---|---|---|
| class-bang-den | Bảng đen + phấn | 4:3 | bang den, giang day, lop hoc, giao vien |
| class-cap-sach | Cặp sách | 1:1 | cap sach, hoc sinh, di hoc |
| class-hop-but | Hộp bút + bút chì | 1:1 | but chi, dung cu, hoc tap |
| class-so-tay | Vở/ghi chú | 1:1 | vo, ghi chu, hoc tap, but |
| class-gia-sach | Giá sách | 4:3 | gia sach, thu vien, sach |
| class-dong-ho | Đồng hồ treo tường | 1:1 | dong ho, gio hoc, thoi gian |
| class-lich | Tờ lịch | 1:1 | lich, ngay, ke hoach, thoi gian bieu |
| class-keo-bang | Kéo + băng dính | 1:1 | keo, bang dinh, lam do, thu cong |
| class-lop-hoc | Lớp học (bàn + ghế) | 4:3 | lop hoc, ban ghe, truong hoc |
| class-bang-ten | Bảng tên | 1:1 | bang ten, nhan, ten |

### G. Người & giao tiếp — `people` (7)

| id | Tên | Tỉ lệ | Keyword |
|---|---|---|---|
| people-hoc-sinh-gio-tay | Học sinh giơ tay | 3:4 | hoc sinh, gio tay, cau hoi, phat bieu |
| people-giao-vien | Giáo viên + bảng | 3:4 | giao vien, giang day, day hoc |
| people-thao-luan | Nhóm thảo luận | 4:3 | nhom, thao luan, team, hop nhom |
| people-bat-tay | Bắt tay | 1:1 | bat tay, hop tac, dong y |
| people-dien-gia | Diễn giả + mic | 3:4 | dien gia, trinh chieu, thuyet trinh |
| people-hoi-dap | Hỏi & đáp (2 bóng thoại) | 4:3 | hoi dap, tu van, trac nghiem |
| people-doi-nhom | Bàn tay chồng nhau | 1:1 | team, dong doi, doan ket |

### H. Khen thưởng — `reward` (6)

| id | Tên | Tỉ lệ | Keyword |
|---|---|---|---|
| reward-cup | Cúp | 1:1 | cup, giai thuong, vo dich |
| reward-huy-chuong | Huy chương + ruy băng | 1:1 | huy chuong, giai thuong, huy chuong vang |
| reward-sao | Ngôi sao khen | 1:1 | sao, tich cuc, khen thuong |
| reward-bang-khen | Bằng khen | 4:3 | bang khen, chung nhan, tot nghiep |
| reward-vuong-mien | Vương miện | 1:1 | vuong mien, quan quan, xuat sac |
| reward-no-ruy-bang | Nơ/ruy băng | 1:1 | ruy bang, no, le hoi, trang tri |

### I. Số & ký hiệu — `sym` (14) · *được phép có chữ — convert outline*

| id | Tên | Tỉ lệ | Keyword |
|---|---|---|---|
| sym-a | Chữ A | 1:1 | chu a, phuong an, trac nghiem |
| sym-b | Chữ B | 1:1 | chu b, phuong an, trac nghiem |
| sym-c | Chữ C | 1:1 | chu c, phuong an, trac nghiem |
| sym-d | Chữ D | 1:1 | chu d, phuong an, trac nghiem |
| sym-cong | Dấu + | 1:1 | cong, phep cong, toan |
| sym-tru | Dấu − | 1:1 | tru, phep tru, toan |
| sym-nhan | Dấu × | 1:1 | nhan, phep nhan, toan |
| sym-chia | Dấu ÷ | 1:1 | chia, phep chia, toan |
| sym-bang | Dấu = | 1:1 | bang, phuong trinh, toan |
| sym-phan-tram | Dấu % | 1:1 | phan tram, ty le, thong ke |
| sym-dung | Dấu tích ✓ | 1:1 | dung, check, dap an dung |
| sym-sai | Dấu gạch chéo ✗ | 1:1 | sai, cross, dap an sai |
| sym-hoi | Dấu chấm hỏi | 1:1 | cau hoi, thac mac, hoi dap |
| sym-thang-dau | Dấu chấm than | 1:1 | chu y, than, nhan manh |

### J. Khung & nhãn — `frame` (8)

| id | Tên | Tỉ lệ | Keyword |
|---|---|---|---|
| frame-bo-tron | Khung bo tròn | 4:3 | khung, vien, khung anh |
| frame-goc | Khung góc (bracket) | 4:3 | khung goc, go, vien |
| frame-nhan | Nhãn/tag | 1:1 | nhan, tag, danh gia |
| frame-banner | Băng rôn ribbon | 4:3 | banner, bang ron, tieu de |
| frame-the | Thẻ bo góc | 4:3 | the, card, khung noi dung |
| frame-thoai-lon | Khung thoại lớn | 4:3 | thoai, bubble, ke chuyen |
| frame-o-so | Ô số thứ tự | 1:1 | o so, so thu tu, danh so |
| frame-vien-dai | Viền trang trí dải | 16:9 | vien, trang tri, phan cach |

### K. Mũi tên & luồng — `arrow` (5)

| id | Tên | Tỉ lệ | Keyword |
|---|---|---|---|
| arrow-phai | Mũi tên phải | 4:3 | mui ten, huong, tien trinh |
| arrow-cong | Mũi tên cong | 1:1 | mui ten cong, quay lai, tro ve |
| arrow-vong | Vòng tuần hoàn | 1:1 | vong, tuan hoan, quy trinh |
| arrow-tach | Mũi tên tách nhánh | 4:3 | tach, nhanh, phan nhanh, so do |
| arrow-duong-di | Đường đi có chấm mốc | 16:9 | duong di, hanh trinh, moc, timeline |

### L. Sức khoẻ · âm nhạc · thể thao — `misc` (3)

| id | Tên | Tỉ lệ | Keyword |
|---|---|---|---|
| misc-nhip-tim | Nhịp tim | 1:1 | nhip tim, suc khoe, the duc |
| misc-not-nhac | Nốt nhạc | 1:1 | not nhac, am nhac, nhac |
| misc-bong-da | Quả bóng | 1:1 | bong da, the thao, bong |

*Tổng: 12+12+9+7+7+10+7+6+14+8+5+3 = **100**.*

**Tuỳ chọn thêm (không tính vào 100):** bộ số `sym-0` … `sym-9` cho slide đếm/bài tập.

---

## 4. Cách bàn giao vào code

1. Figma: mỗi icon một Frame 64×64 đặt tên đúng `id` → export **SVG** cả 100 file.
2. Chạy svgo tối ưu, drop vào `src/lib/graphics/<id>.svg` (hoặc inline vào một TS module
   để tránh 100 file lẻ — PPTX export cần SVG string để render thành ảnh).
3. Registry theo cấu trúc hiện có (`slideAssets.ts`):

```ts
export interface SlideGraphic {
  id: string        // 'math-thuoc-ke'
  name: string      // 'Thước êke tam giác vuông'
  category: string  // 'math' | 'sci' | ... 
  ratio: number     // 1, 4/3, 3/4, 16/9
  keywords: string  // 'eke, tam giac, goc vuong' — không dấu, cách nhau dấu phẩy
  svg: string       // nội dung SVG
}
```

4. `searchGraphic(text)` chuẩn hoá tiếng Việt (NFD + đ→d) như `pickSlideAsset` hiện tại.
5. Prompt của AI sinh slide sẽ nhận danh sách `{id, name, category, keywords}` (không gửi
   SVG lên model) và điền field `graphic` trong layout — thay cho `imagePrompt`.
