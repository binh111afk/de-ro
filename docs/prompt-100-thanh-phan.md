# Prompt tạo thêm 100 thành phần (đồ hoạ pastel)

Dán **mục A** (phong cách) + **mục B** (danh sách 100 hình) cho công cụ vẽ. Sau khi có file SVG, nhập bằng
`scripts/import-graphics.mjs` theo **mục C** (dòng khai báo sẵn id/tên/từ khoá).

Hiện có 232 đồ hoạ; 100 hình dưới đây đều **không trùng** chủ đề với chúng (danh sách có sẵn ở mục D để công cụ vẽ tránh).

---

## A. Phong cách (giữ y hệt bộ hiện có)

```
Hãy vẽ một bộ 100 icon giáo dục dạng "contact sheet" SVG, cùng phong cách với bộ icon sẵn có của tôi:

- Mỗi icon nằm trong một ô 64×64 px, nền trắng, lưới 10 cột × 10 hàng, xếp đúng thứ tự trong danh sách bên dưới (đọc từ trái sang phải, trên xuống dưới).
- Mỗi icon gồm ĐÚNG HAI path liền nhau: (1) một khối tô màu (fill) đặt phía sau, (2) một path nét viền đặt phía trước.
- Nét viền: màu #22333B, độ dày 3px, stroke-linecap round, stroke-linejoin round, không tô (fill none).
- Khối tô: chỉ dùng 1 trong 8 màu pastel sau, mỗi icon chọn 1 màu (nhiều nhất 2 màu pastel khi icon có hai bộ phận rõ rệt, ví dụ thân và lá):
  #F6C6A8 (cam đào), #B9D4EA (xanh dương nhạt), #D8CFF0 (tím nhạt), #F7E6A8 (vàng nhạt),
  #BFE5DE (xanh bạc hà), #F5D6E0 (hồng nhạt), #C6E5B3 (xanh lá nhạt), #E8DCC8 (be).
- Khối tô lệch nhẹ so với nét (khoảng 2–3px) như bản in lệch màu, không khớp tuyệt đối với đường viền — đúng kiểu bộ cũ.
- Hình đơn giản, đọc được từ xa khi chiếu lên màn hình lớp học: tối đa khoảng 6–8 chi tiết nét, không đổ bóng, không gradient, không hoạ tiết nhỏ, không chữ nhỏ (chữ/số chỉ dùng khi danh sách yêu cầu, to và đậm).
- Nhìn thẳng chính diện hoặc 3/4 đơn giản, thân thiện với học sinh Việt Nam (bối cảnh, đồ vật, con vật quen thuộc ở Việt Nam).
- Mỗi icon chiếm khoảng 44–52px trong ô 64px, căn giữa ô, chừa lề cho nét 3px không bị cắt.
- Chỉ trả về MỘT file SVG duy nhất chứa cả lưới 100 icon, không thêm nhãn hay đường kẻ ô.

QUAN TRỌNG — KHÔNG ĐƯỢC LẶP: bộ này phải là hình MỚI. Tuyệt đối không vẽ lại, không vẽ biến thể gần giống bất kỳ icon nào trong danh sách "đã có" ở cuối prompt (cùng đồ vật dù đổi góc nhìn hay đổi màu cũng tính là lặp). Nếu một hình trong danh sách mới trùng ý với hình đã có, hãy vẽ phiên bản khác hẳn về cấu trúc (đồ vật khác, góc nhìn khác, chi tiết khác) hoặc bỏ qua và báo tôi.
```

---

## B. Danh sách 100 hình (đúng thứ tự trên lưới)

Mô tả hình để công cụ vẽ không phải đoán.

### Toán (9)
1. Que tính — bó que tính buộc dây, kèm 3 que rời xếp thành hình tam giác.
2. Bàn tính — khung gỗ hình chữ nhật, 3 thanh ngang xuyên hạt tròn dịch lệch.
3. Hình chữ nhật — hình chữ nhật có hai mũi tên đo "dài" và "rộng" (không chữ).
4. Hình bình hành — hình bình hành, đường cao vẽ nét đứt, ký hiệu góc vuông nhỏ.
5. Hình thang — hình thang cân, hai đáy có mũi tên đo, đường cao nét đứt.
6. Phân số — bánh tròn chia 4 phần bằng nhau, tô đậm 1 phần, một phần tách nhẹ ra.
7. Biểu đồ Venn — hai vòng tròn giao nhau, phần giao tô đậm hơn.
8. Hệ trục Oxy — trục toạ độ có mũi tên, một điểm tròn, hai đường nét đứt chiếu xuống hai trục.
9. Góc vuông — hai tia vuông góc, ô vuông nhỏ ở đỉnh, cung tròn nhỏ.

### Khoa học (5)
10. Kính lúp — kính lúp tay cầm, bên dưới là chiếc lá được phóng to.
11. Cân điện tử — cân thí nghiệm mặt phẳng, màn hình hiển thị, có quả cân nhỏ đặt trên.
12. Phễu lọc — phễu thuỷ tinh cắm giấy lọc, dưới là cốc hứng, vài giọt nước.
13. Kẹp ống nghiệm — kẹp gỗ kẹp một ống nghiệm có chất lỏng.
14. Bình cầu — bình cầu đáy tròn đặt trên kiềng ba chân, chất lỏng bên trong.

### Thiên nhiên (5)
15. Cầu vồng — cầu vồng nhiều lớp, hai đám mây nhỏ ở hai chân.
16. Bông tuyết — bông tuyết sáu cánh đối xứng, vài chấm tuyết rơi.
17. Gió — ba đường gió cuộn xoắn, một chiếc lá bay theo.
18. Cây thông — cây thông ba tầng, thân nâu, ngôi sao nhỏ trên ngọn.
19. Bình minh trên biển — mặt trời nửa vòng nhô khỏi mặt nước, vài gợn sóng ngang.

### Con vật (10)
20. Con mèo — mèo ngồi nhìn nghiêng, đuôi cuộn.
21. Con chó — chó ngồi, tai cụp, lè lưỡi.
22. Con gà trống — gà trống nhìn nghiêng, mào đỏ, đuôi cong.
23. Con trâu — trâu nhìn nghiêng, cặp sừng cong.
24. Con voi — voi nhìn nghiêng, vòi cong lên, tai to.
25. Con hổ — đầu hổ nhìn thẳng, vằn đơn giản.
26. Con thỏ — thỏ ngồi, hai tai dài, đuôi tròn.
27. Cá heo — cá heo đang nhảy, vài tia nước.
28. Con bướm — bướm dang cánh nhìn từ trên, hoa văn cánh đơn giản.
29. Con rùa — rùa nhìn nghiêng, mai có hoa văn lục giác.

### Thực phẩm & sức khoẻ (8)
30. Quả táo — quả táo có cuống và một chiếc lá.
31. Quả chuối — nải 3 quả chuối.
32. Củ cà rốt — cà rốt kèm phần lá xanh.
33. Ly sữa — ly sữa đầy kèm hộp sữa nhỏ phía sau.
34. Bát cơm — bát cơm đầy, đôi đũa gác ngang.
35. Bàn chải đánh răng — bàn chải kèm tuýp kem, vài bọt nhỏ.
36. Rửa tay — bàn tay dưới vòi nước, bọt xà phòng.
37. Khẩu trang — khẩu trang y tế có dây đeo tai.

### Lớp học (8)
38. Trống trường — trống trường có giá, hai dùi trống.
39. Cổng trường — cổng trường có hai trụ, mái nhỏ, biển trống phía trên.
40. Bàn ghế học sinh — bàn và ghế liền, hộc bàn.
41. Bút bi — bút bi bấm có nắp, đầu bút lộ ra.
42. Hộp bút màu — hộp bút màu sáp mở nắp, vài cây bút nhiều màu.
43. Kẹp giấy — hai chiếc kẹp giấy lồng nhau, kẹp một tờ giấy.
44. Máy chiếu — máy chiếu để bàn, chùm sáng hình thang chiếu ra.
45. Thời khoá biểu — bảng lưới thời khoá biểu đơn giản, vài ô tô màu.

### Con người (5)
46. Học sinh đọc sách — học sinh ngồi đọc sách mở trên đùi.
47. Học sinh thí nghiệm — học sinh áo blouse cầm ống nghiệm, đeo kính bảo hộ.
48. Bác sĩ — bác sĩ áo blouse, ống nghe quanh cổ.
49. Cô giáo chấm bài — giáo viên cầm bút đỏ, tờ bài kiểm tra có dấu tích.
50. Phụ huynh và con — người lớn nắm tay trẻ em.

### Khen thưởng (3)
51. Phiếu bé ngoan — phiếu khen hình chữ nhật, có sao ở giữa, viền răng cưa.
52. Điểm mười — con dấu tròn ghi số 10 to, viền tia.
53. Bục nhận giải — bục ba bậc cao thấp, ngôi sao nhỏ trên bậc cao nhất.

### Ký hiệu (6)
54. Dấu lớn hơn (>).
55. Dấu bé hơn (<).
56. Dấu khác (≠).
57. Dấu ngoặc tròn ( ) — hai ngoặc tròn to, có khoảng trống giữa.
58. Đúng – Sai — hai hình tròn cạnh nhau: một dấu tích, một dấu gạch chéo.
59. Dấu xấp xỉ (≈).

### Khung & nhãn (5)
60. Bóng suy nghĩ — bong bóng hình đám mây, ba chấm nhỏ nối xuống.
61. Bóng hét — bong bóng thoại viền gai nhọn, kiểu nhấn mạnh.
62. Khung ảnh — khung ảnh có cạnh dày, một ngọn núi nhỏ và mặt trời bên trong.
63. Cuộn tiêu đề — băng cuộn hai đầu cuộn tròn, để trống giữa.
64. Thẻ lật — flashcard bo góc, một góc lật lên như đang xem mặt sau.

### Mũi tên (5)
65. Mũi tên vòng cung — mũi tên cong đi từ trái sang phải theo hình vòm.
66. Mũi tên chữ U — mũi tên quay đầu hình chữ U.
67. Mũi tên đi lên — đường zigzag đi lên, mũi tên ở cuối (tăng trưởng).
68. Mũi tên đi xuống — đường zigzag đi xuống, mũi tên ở cuối (giảm).
69. Mũi tên nhiều bước — ba bậc thang đi lên, mũi tên chỉ lên bậc cao nhất.

### Trang trí (3)
70. Trái tim — trái tim tròn đầy, có vệt sáng nhỏ.
71. Bóng bay — ba quả bóng bay cột chung dây, các màu khác nhau.
72. Pháo giấy — ống pháo giấy phun hoa giấy và sao nhỏ.

### Tin học (4)
73. Người máy — robot đầu vuông, ăng-ten, hai mắt tròn.
74. Điện thoại — điện thoại thông minh thẳng đứng, màn hình có biểu tượng đơn giản.
75. Máy in — máy in có khay giấy ra, một tờ giấy đang in.
76. USB — thanh USB nắp mở, dây đeo nhỏ.

### Ngoại ngữ (3)
77. Bảng chữ cái — ba khối chữ A, B, C xếp chồng lệch.
78. Xin chào — bong bóng thoại có chữ "Hello" to và đậm.
79. Thẻ tên — thẻ đeo cổ có dây, dòng chữ "Hi" nhỏ trên thẻ.

### Địa lí (3)
80. Bão — vòng xoáy bão nhìn từ trên, mắt bão ở giữa.
81. Cánh đồng lúa — vài bông lúa nặng hạt trước đường chân trời, mặt trời thấp.
82. Mỏ than — xe goòng chở than trên đường ray, cửa hầm.

### Vật lí (3)
83. Ròng rọc — ròng rọc cố định treo trên giá, dây kéo vật nặng.
84. Quả cân — quả cân có quai xách, in số "1" đậm.
85. Lực kế — lực kế lò xo thẳng đứng có thang chia, móc treo vật.

### Lịch sử (3)
86. Nón lá — chiếc nón lá nhìn nghiêng, quai nón.
87. Áo dài — áo dài đứng thẳng như mannequin, hoạ tiết đơn giản.
88. Voi chiến — voi mang tháp chiến, cờ nhỏ cắm trên.

### Văn học (3)
89. Cánh cò — cánh cò bay trên cánh đồng, vài nét lúa dưới.
90. Mái đình — mái đình cong vút, hai rồng nhỏ ở hai đầu mái.
91. Đèn dầu — đèn dầu thuỷ tinh có bấc, ngọn lửa nhỏ.

### Hoá học (3)
92. Bảng tuần hoàn — lưới nhiều ô vuông nhiều màu, hai ô nổi bật.
93. Phản ứng sủi bọt — cốc thuỷ tinh có chất lỏng sủi bọt tràn lên.
94. Kính bảo hộ — kính bảo hộ phòng thí nghiệm kèm đôi găng tay.

### Nghệ thuật (3)
95. Cọ vẽ — cọ vẽ đầu tròn, vệt màu quét cong phía dưới.
96. Kéo và hồ dán — kéo cắt giấy cạnh lọ hồ dán, mảnh giấy cắt hình.
97. Đàn bầu — đàn bầu một dây, cần đàn cong, hộp cộng hưởng.

### Thể chất (3)
98. Bóng đá — quả bóng đá có hoạ tiết ngũ giác, vệt chuyển động.
99. Vợt cầu lông — vợt kèm quả cầu lông.
100. Dây nhảy — người dây nhảy hình vòng cung, hai tay cầm hai đầu.

---

## C. Dòng khai báo để nhập (thêm vào mảng ICONS theo đúng thứ tự trên lưới)

Mỗi dòng: `[id, tên, nhóm, từ khoá không dấu]`. Làm sheet mới thì thêm cặp `SHEET_xxx`/`ICONS_xxx` trong `scripts/graphics-extra.mjs` như hai sheet 100 + prog trước đó.

```js
['math-que-tinh', 'Que tính', 'math', 'que tinh dem so tieu hoc cong tru'],
['math-ban-tinh', 'Bàn tính', 'math', 'ban tinh abacus dem so tinh toan'],
['math-hinh-chu-nhat', 'Hình chữ nhật', 'math', 'hinh chu nhat chieu dai chieu rong dien tich chu vi'],
['math-hinh-binh-hanh', 'Hình bình hành', 'math', 'hinh binh hanh duong cao dien tich'],
['math-hinh-thang', 'Hình thang', 'math', 'hinh thang day lon day nho dien tich'],
['math-phan-so', 'Phân số', 'math', 'phan so chia phan bang nhau banh tron tu so mau so'],
['math-venn', 'Biểu đồ Venn', 'math', 'venn tap hop giao hop phan chung'],
['math-he-truc-oxy', 'Hệ trục Oxy', 'math', 'truc toa do oxy diem toa do'],
['math-goc-vuong', 'Góc vuông', 'math', 'goc vuong 90 do hinh hoc'],
['sci-kinh-lup', 'Kính lúp', 'sci', 'kinh lup phong to quan sat'],
['sci-can-dien-tu', 'Cân điện tử', 'sci', 'can dien tu khoi luong do can'],
['sci-phieu-loc', 'Phễu lọc', 'sci', 'phieu loc giay loc tach chat'],
['sci-kep-ong-nghiem', 'Kẹp ống nghiệm', 'sci', 'kep ong nghiem dung cu thi nghiem'],
['sci-binh-cau', 'Bình cầu', 'sci', 'binh cau day tron kieng ba chan dun'],
['nat-cau-vong', 'Cầu vồng', 'nat', 'cau vong sau mua anh sang'],
['nat-bong-tuyet', 'Bông tuyết', 'nat', 'bong tuyet tuyet mua dong lanh'],
['nat-gio', 'Gió', 'nat', 'gio thoi khi tuong thoi tiet'],
['nat-cay-thong', 'Cây thông', 'nat', 'cay thong giang sinh rung'],
['nat-binh-minh-bien', 'Bình minh trên biển', 'nat', 'binh minh mat troi moc bien'],
['bio-meo', 'Con mèo', 'bio', 'meo con vat thu cung dong vat'],
['bio-cho', 'Con chó', 'bio', 'cho con vat thu cung dong vat'],
['bio-ga-trong', 'Con gà trống', 'bio', 'ga trong gia cam dong vat'],
['bio-trau', 'Con trâu', 'bio', 'trau gia suc dong vat nong nghiep'],
['bio-voi', 'Con voi', 'bio', 'voi dong vat hoang da'],
['bio-ho', 'Con hổ', 'bio', 'ho cop dong vat hoang da'],
['bio-tho', 'Con thỏ', 'bio', 'tho con vat dong vat'],
['bio-ca-heo', 'Cá heo', 'bio', 'ca heo dong vat bien'],
['bio-buom', 'Con bướm', 'bio', 'buom con trung bien thai'],
['bio-rua', 'Con rùa', 'bio', 'rua dong vat bo sat'],
['life-qua-tao', 'Quả táo', 'life', 'qua tao trai cay dinh duong'],
['life-qua-chuoi', 'Quả chuối', 'life', 'chuoi trai cay dinh duong'],
['life-ca-rot', 'Củ cà rốt', 'life', 'ca rot rau cu dinh duong'],
['life-ly-sua', 'Ly sữa', 'life', 'sua ly sua canxi dinh duong'],
['life-bat-com', 'Bát cơm', 'life', 'bat com bua an luong thuc'],
['life-ban-chai', 'Bàn chải đánh răng', 'life', 'ban chai kem danh rang ve sinh rang mieng'],
['life-rua-tay', 'Rửa tay', 'life', 'rua tay xa phong ve sinh phong benh'],
['life-khau-trang', 'Khẩu trang', 'life', 'khau trang y te phong benh'],
['class-trong-truong', 'Trống trường', 'class', 'trong truong gio ra choi khai giang'],
['class-cong-truong', 'Cổng trường', 'class', 'cong truong ngoi truong'],
['class-ban-ghe', 'Bàn ghế học sinh', 'class', 'ban ghe hoc sinh cho ngoi lop hoc'],
['class-but-bi', 'Bút bi', 'class', 'but bi viet dung cu hoc tap'],
['class-hop-but-mau', 'Hộp bút màu', 'class', 'but mau sap to mau ve'],
['class-kep-giay', 'Kẹp giấy', 'class', 'kep giay ghim tai lieu van phong'],
['class-may-chieu', 'Máy chiếu', 'class', 'may chieu trinh chieu bai giang'],
['class-thoi-khoa-bieu', 'Thời khoá biểu', 'class', 'thoi khoa bieu lich hoc tiet hoc'],
['people-doc-sach', 'Học sinh đọc sách', 'people', 'hoc sinh doc sach thu vien'],
['people-thi-nghiem', 'Học sinh thí nghiệm', 'people', 'hoc sinh thi nghiem ao blouse phong thi nghiem'],
['people-bac-si', 'Bác sĩ', 'people', 'bac si y te nghe nghiep'],
['people-cham-bai', 'Cô giáo chấm bài', 'people', 'giao vien cham bai kiem tra'],
['people-phu-huynh-con', 'Phụ huynh và con', 'people', 'phu huynh con gia dinh'],
['reward-phieu-be-ngoan', 'Phiếu bé ngoan', 'reward', 'phieu be ngoan khen thuong'],
['reward-diem-10', 'Điểm mười', 'reward', 'diem 10 diem muoi con dau xuat sac'],
['reward-buc-nhan-giai', 'Bục nhận giải', 'reward', 'buc nhan giai xep hang nhat nhi ba'],
['sym-lon-hon', 'Dấu lớn hơn', 'sym', 'dau lon hon so sanh bat dang thuc'],
['sym-be-hon', 'Dấu bé hơn', 'sym', 'dau be hon so sanh bat dang thuc'],
['sym-khac', 'Dấu khác', 'sym', 'dau khac khong bang so sanh'],
['sym-ngoac-tron', 'Dấu ngoặc tròn', 'sym', 'dau ngoac tron ngoac don bieu thuc'],
['sym-dung-sai', 'Đúng – Sai', 'sym', 'dung sai trac nghiem dap an'],
['sym-xap-xi', 'Dấu xấp xỉ', 'sym', 'dau xap xi gan bang lam tron'],
['frame-bong-suy-nghi', 'Bóng suy nghĩ', 'frame', 'bong suy nghi dam may cau hoi suy nghi'],
['frame-bong-het', 'Bóng hét', 'frame', 'bong het nhan manh thoai chu y'],
['frame-khung-anh', 'Khung ảnh', 'frame', 'khung anh hinh anh minh hoa'],
['frame-cuon-tieu-de', 'Cuộn tiêu đề', 'frame', 'cuon tieu de bang ron tieu de'],
['frame-the-lat', 'Thẻ lật', 'frame', 'the lat flashcard mat sau ghi nho'],
['arrow-vong-cung', 'Mũi tên vòng cung', 'arrow', 'mui ten vong cung chuyen tiep quy dao'],
['arrow-chu-u', 'Mũi tên chữ U', 'arrow', 'mui ten chu u quay dau tro lai'],
['arrow-di-len', 'Mũi tên đi lên', 'arrow', 'mui ten di len tang truong tang'],
['arrow-di-xuong', 'Mũi tên đi xuống', 'arrow', 'mui ten di xuong giam suy giam'],
['arrow-nhieu-buoc', 'Mũi tên nhiều bước', 'arrow', 'mui ten nhieu buoc bac thang tien trinh'],
['decor-trai-tim', 'Trái tim', 'decor', 'trai tim yeu thuong tinh cam'],
['decor-bong-bay', 'Bóng bay', 'decor', 'bong bay le hoi sinh nhat'],
['decor-phao-giay', 'Pháo giấy', 'decor', 'phao giay chuc mung an mung'],
['cs-robot', 'Người máy', 'cs', 'robot nguoi may tri tue nhan tao'],
['cs-dien-thoai', 'Điện thoại', 'cs', 'dien thoai di dong smartphone'],
['cs-may-in', 'Máy in', 'cs', 'may in in an tai lieu'],
['cs-usb', 'USB', 'cs', 'usb luu tru thiet bi nho'],
['eng-bang-chu-cai', 'Bảng chữ cái', 'eng', 'bang chu cai abc khoi chu alphabet'],
['eng-xin-chao', 'Xin chào', 'eng', 'xin chao hello giao tiep'],
['eng-the-ten', 'Thẻ tên', 'eng', 'the ten gioi thieu ban than hi'],
['geo-bao', 'Bão', 'geo', 'bao xoay thien tai khi tuong'],
['geo-canh-dong-lua', 'Cánh đồng lúa', 'geo', 'canh dong lua nong nghiep dong bang'],
['geo-mo-than', 'Mỏ than', 'geo', 'mo than khai thac khoang san'],
['phys-rong-roc', 'Ròng rọc', 'phys', 'rong roc may co don gian keo vat'],
['phys-qua-can', 'Quả cân', 'phys', 'qua can khoi luong can'],
['phys-luc-ke', 'Lực kế', 'phys', 'luc ke do luc trong luc newton'],
['his-non-la', 'Nón lá', 'his', 'non la truyen thong viet nam'],
['his-ao-dai', 'Áo dài', 'his', 'ao dai trang phuc truyen thong'],
['his-voi-chien', 'Voi chiến', 'his', 'voi chien khang chien chien tranh co'],
['lit-canh-co', 'Cánh cò', 'lit', 'canh co dong que ca dao'],
['lit-mai-dinh', 'Mái đình', 'lit', 'mai dinh lang que van hoa'],
['lit-den-dau', 'Đèn dầu', 'lit', 'den dau anh sang hoc bai ban dem'],
['chem-bang-tuan-hoan', 'Bảng tuần hoàn', 'chem', 'bang tuan hoan nguyen to hoa hoc'],
['chem-coc-sui-bot', 'Phản ứng sủi bọt', 'chem', 'phan ung sui bot khi coc thi nghiem'],
['chem-kinh-bao-ho', 'Kính bảo hộ', 'chem', 'kinh bao ho gang tay an toan thi nghiem'],
['art-co-ve', 'Cọ vẽ', 'art', 'co ve to mau mi thuat'],
['art-keo-ho-dan', 'Kéo và hồ dán', 'art', 'keo ho dan thu cong cat dan'],
['art-dan-bau', 'Đàn bầu', 'art', 'dan bau nhac cu dan toc am nhac'],
['pe-bong-da', 'Bóng đá', 'pe', 'bong da the thao the duc'],
['pe-vot-cau-long', 'Vợt cầu lông', 'pe', 'vot cau long the thao the duc'],
['pe-day-nhay', 'Dây nhảy', 'pe', 'day nhay nhay day the duc van dong'],
```

---

## D. Danh sách "đã có" (dán vào cuối prompt A để công cụ vẽ tránh lặp)

```
Đã có — KHÔNG vẽ lại:
Toán: Ê-ke, Compa, Đồ thị hàm số, Cán cân, Máy tính, Thước đo góc, Thước kẻ, Hình lập phương, Hình chóp, Biểu đồ tròn, Tam giác, Đường tròn, Dấu căn, Bộ hình cơ bản, Hình cầu, Hình trụ, Hình nón, Trục số, Biểu đồ cột, Xúc xắc.
Khoa học: Giá ống nghiệm, Mặt phẳng nghiêng, Ống nghiệm, Kính hiển vi, DNA, Nam châm, Mạch điện, Nguyên tử, Bình tam giác, Cốc đong, Phân tử, Hành tinh, Kính viễn vọng, Bóng đèn ý tưởng, Bánh răng, Tên lửa.
Thiên nhiên: Mặt trời, Mây mưa, Sóng biển, Quả địa cầu, Cây, Chiếc lá, Núi, Bông hoa, Trăng và sao.
Ngữ văn: Sách mở, Bút chì, Bóng thoại, Sổ ghi chú, Cuộn giấy, Bút lông, Thẻ đánh dấu sách, Từ điển, Phong bì thư.
Sử – địa: Bản đồ, La bàn, Trống đồng, Hải đăng, Bảo tàng, Đồng hồ cát, Lá cờ, Ghim vị trí.
Lớp học: Bảng thuyết trình, Cặp sách, Giá sách, Lịch, Bút chì (nghiêng), Kéo, Cục tẩy, Vở xoắn, Đồng hồ, Mũ tốt nghiệp, Hộp bút, Lớp học.
Con người: Học sinh giơ tay, Giáo viên và bảng, Bắt tay, Diễn giả, Nhóm học tập, Thảo luận, Giáo viên.
Khen thưởng: Cúp, Huy chương, Bằng khen, Ngôi sao, Vương miện, Huy hiệu, Nơ ruy băng.
Ký hiệu: Chữ A, B, C, D, Dấu cộng, trừ, nhân, chia, bằng, phần trăm, tích, gạch chéo, chấm hỏi, chấm than.
Khung: Khung bo tròn, Băng rôn, Nhãn, Khung thẻ, Khung nét đứt, Giấy ghi chú.
Trang trí: Chùm sao, Hình elip. Mũi tên: Mũi tên phải, Mũi tên cong, Vòng tuần hoàn, Mũi tên hai chiều, Mũi tên tách nhánh.
Khác: Nhịp tim, Nốt nhạc, Quả bóng.
Tin học: Máy tính để bàn, Laptop, Bàn phím, Chuột máy tính, Mã nguồn, Sơ đồ thuật toán, Mạng máy tính, Điện toán đám mây, Cơ sở dữ liệu, Khoá bảo mật.
Ngoại ngữ: Phát âm, Tai nghe, Micro, Thẻ từ vựng, Dịch hai chiều, Hộ chiếu, Sách ngữ pháp, Lắng nghe.
Địa lí: Núi lửa, Sông ngòi, Sa mạc, Đảo, Bản đồ đồng mức, Khí hậu, Tua-bin gió, Ruộng bậc thang, Thành phố.
Vật lí: Đồng hồ đo, Con lắc, Thấu kính, Lăng kính tán sắc, Sóng, Lò xo, Nhiệt kế, Tia chớp, Gương phản xạ, Đòn bẩy, Pin mặt trời.
Lịch sử: Thành cổ, Gươm cổ, Khiên, Thuyền buồm, Chùa Một Cột, Đồng tiền cổ, Bia đá, Cung tên, Đại bác, Ngọn đuốc.
Văn học: Máy chữ, Quạt giấy, Mặt nạ sân khấu, Chồng sách, Tre, Hoa sen, Cổng làng, Thuyền trên sông, Đèn lồng, Cuộn thơ.
Sinh học: Tế bào, Hạt nảy mầm, Tim, Phổi, Não, Xương, Chuỗi thức ăn, Con cá, Chim, Ong mật, Nấm, Cấu tạo hoa.
Hoá học: Ô nguyên tố, Đèn cồn, Giấy pH và ống nghiệm, Ống nhỏ giọt, Tinh thể, Giọt nước, Bình hoá chất, Pin điện hoá.
Nghệ thuật: Bảng pha màu, Giá vẽ, Đàn guitar, Phím đàn piano, Máy ảnh, Trống.
Thể chất: Giày chạy, Tạ tay, Còi, Bóng rổ.
Kỹ năng sống: Danh sách việc, Đồng hồ báo thức, Tái chế, Heo đất, Đèn giao thông, Hộp sơ cứu.
Lập trình: Python, JavaScript, TypeScript, Java, C, C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, Dart, R, SQL, Dòng lệnh, Lua, HTML5, CSS3.
```
