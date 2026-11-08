# Yêu cầu: soạn khung chương trình GDPT 2018 các môn còn thiếu

File này dành cho agent soạn dữ liệu, làm việc trong dự án. Đọc hết trước khi làm. Claude sẽ kiểm kết quả sau.

## 0. Bối cảnh
Web soạn đề sẽ chèn "khung chương trình" của đúng lớp và chương vào prompt cho AI soạn đề, để AI không dùng kiến thức lớp trên hoặc chương trình cũ (trước 2018). Mỗi môn là một file JSON. Đã có và đã kiểm (dùng làm **mẫu**, KHÔNG sửa): `src/data/khungToan.json`, `khungLy.json`, `khungHoa.json`, `khungSinh.json`, `khungVan.json`, `khungSu.json`, `khungTin.json`. Quy trình chung: `docs/khung-chuong-trinh.md`.

Lần trước, nhiều file bị nộp dưới dạng "bản nháp" thiếu chương, vì làm cả môn trong một lần và không tra được mục lục. Lần này làm **từng lượt nhỏ** theo mục 3.

## 1. Git — làm trên nhánh riêng, không đụng việc dở của người khác
Thư mục dự án có thể đang có thay đổi chưa commit của agent khác. **Không** `checkout`, `stash`, `reset` trong thư mục chính. Dùng worktree riêng:

```bash
git fetch origin
git worktree add ../dethinhbien-khung -b feat/khung-chuong-trinh origin/feat/trig-7-tinh-nang
cd ../dethinhbien-khung
```

(Nếu nhánh đã tồn tại do lần chạy trước bị ngắt: `git worktree add ../dethinhbien-khung feat/khung-chuong-trinh`.)

- Chỉ tạo file mới trong `scripts/khung/` (thư mục mới). Không sửa `src/`, `docs/` hay bất kỳ file nào khác.
- Xong **mỗi lượt**: chạy kiểm tra ở mục 5, rồi `git add scripts/khung/<file>.json` và `git commit -m "chore(khung): <tên lượt>"` rồi `git push -u origin feat/khung-chuong-trinh`. Không merge vào nhánh nào.
- Lượt nào đã có file trong `scripts/khung/` và đã qua kiểm tra thì bỏ qua (để chạy lại được khi bị ngắt).

## 2. Quy tắc chung cho mọi lượt
1. **Tra mục lục trước khi viết.** Với mỗi lớp trong lượt, tra và ghi ra mục lục đầy đủ (tên chương, bài) của bộ **Kết nối tri thức với cuộc sống (KNTT)**, sau đó đến Chân trời sáng tạo (CTST) và Cánh diều (CD) nếu tra được. Nguồn: hoc10.vn, taphuan.nxbgd.vn, sachmem; các trang giải bài theo sách (loigiaihay.com, vietjack.com, hoc247.net) có mục lục từng bài. Lưu mục lục vào trường `"muc_luc_da_tra"` ở đầu file (mảng chuỗi, mỗi phần tử ghi "Lớp X – KNTT – <tên bài>").
2. **Mỗi chương hoặc bài trong mục lục phải có mục tương ứng trong JSON.** Được gộp vài bài cùng chủ đề thành một mục, nhưng không bỏ sót. Cấm để trống hay ghi "chưa có nội dung", "cần xác minh tên" thay cho nội dung.
3. Nguồn "yêu cầu cần đạt": Chương trình GDPT 2018 (Thông tư 32/2018/TT-BGDĐT, sửa đổi bởi Thông tư 13/2022). Đánh giá: Thông tư 22/2021 (THCS, THPT) hoặc Thông tư 27/2020 (tiểu học). Đề tốt nghiệp THPT: cấu trúc từ năm 2025 của Bộ.
4. **`chua_duoc_dung` là trường quan trọng nhất.** Liệt kê kiến thức hay bị dùng sớm: nội dung lớp trên, chương sau trong cùng lớp, nội dung chương trình 2006 đã bỏ hoặc đã chuyển lớp. Mỗi mục ghi "học ở lớp nào". Ít nhất 2–3 mục mỗi chương. Không ghi mục cho đủ số (kiến thức đại học…).
5. Chỗ không chắc: vẫn viết theo nguồn tốt nhất, và ghi vào `"ghi_chu_chua_chac"` của lớp đó. Không bịa.
6. Mỗi chương khoảng 120–400 từ. Không viết lý thuyết, không viết bài giải mẫu, không chép nguyên văn sách hay luật.
7. Chỉ dùng ký tự tiếng Việt, tiếng Anh và ký hiệu toán. **Không để lọt chữ Hán, chữ Thái** (lần trước bị lỗi này).
8. `cau_truc_de`: giữa kỳ 1, cuối kỳ 1, giữa kỳ 2, cuối kỳ 2 cho TỪNG lớp (không gộp nhiều lớp vào một mục), cộng đề tốt nghiệp THPT nếu có lớp 12. Đề không có quy định toàn quốc: ghi cấu trúc phổ biến, kèm nguồn (Sở nào, năm nào), ghi chú vào `ghi_chu_chua_chac`. `pham_vi` là mảng id chương.
9. `id` duy nhất trong file, dạng `<mã môn><lớp>-<ten-khong-dau>` (mã môn ghi ở từng lượt).

## 3. Các lượt (làm theo thứ tự)

| # | File ra (`scripts/khung/…`) | Phạm vi | Mã id |
|---|---|---|---|
| 1 | `khung_tin_11_12.json` | Tin học lớp 11, 12 | `tin` |
| 2 | `khung_khtn_6_7.json` | KHTN lớp 6, 7 | `khtn` |
| 3 | `khung_khtn_8_9.json` | KHTN lớp 8, 9 | `khtn` |
| 4 | `khung_anh_7_9.json` | Tiếng Anh lớp 7, 8, 9 | `anh` |
| 5 | `khung_anh_10_12.json` | Tiếng Anh lớp 10, 11, 12 | `anh` |
| 6 | `khung_gdcd_6_9.json` | GDCD lớp 6–9 | `gdcd` |
| 7 | `khung_ktpl_10_12.json` | Giáo dục kinh tế và pháp luật lớp 10–12 | `ktpl` |
| 8 | `khung_dia_6_9.json` | Phân môn Địa lí (môn Lịch sử và Địa lí) lớp 6–9 | `dia` |
| 9 | `khung_dia_10_12.json` | Địa lí lớp 10–12 | `dia` |
| 10 | `khung_congnghe_6_9.json` | Công nghệ lớp 6–9 | `cn` |
| 11 | `khung_congnghe_10_12.json` | Công nghệ lớp 10–12 (cả hai định hướng) | `cn` |
| 12 | `khung_tieuhoc_toan.json` | Toán lớp 1–5 | `th-toan` |
| 13 | `khung_tieuhoc_tiengviet.json` | Tiếng Việt lớp 1–5 | `th-tiengviet` |
| 14 | `khung_tieuhoc_anh.json` | Tiếng Anh lớp 3–5 | `th-anh` |
| 15 | `khung_tieuhoc_khac.json` | Khoa học 4–5, Lịch sử và Địa lí 4–5, Tin học và Công nghệ 3–5 | `th-khoahoc`, `th-lsdl`, `th-tincn` |

## 4. Định dạng

### 4.1. Khung chung (mọi lượt THCS, THPT)
```json
{
  "mon": "<tên môn>",
  "pham_vi_luot": "<ví dụ: lớp 8–9>",
  "nguon": ["<văn bản, link>"],
  "muc_luc_da_tra": ["Lớp 8 – KNTT – Bài 1. ..."],
  "lop": [
    {
      "lop": 8,
      "chuong": [
        {
          "id": "khtn8-...",
          "ten": "...",
          "hoc_ky": 1,
          "ten_theo_sach": { "KNTT": "...", "CTST": "...", "CD": "..." },
          "yeu_cau_can_dat": ["..."],
          "kien_thuc_duoc_dung": ["..."],
          "chua_duoc_dung": ["..."],
          "dang_bai_dien_hinh": ["..."],
          "luu_y_ra_de": "..."
        }
      ],
      "chuyen_de": [],
      "ghi_chu_chua_chac": []
    }
  ],
  "cau_truc_de": [
    { "loai": "Giữa kỳ 1", "lop": 8, "thoi_gian_phut": 60, "phan": [{ "ten": "...", "so_cau": 0, "diem_moi_cau": 0 }], "pham_vi": ["<id>"], "ti_le_muc_do": "..." }
  ]
}
```

### 4.2. Trường riêng từng môn (thêm vào mỗi chương)

**Tin học 11–12 (lượt 1)**
- `mach` (A–G theo chương trình), `dinh_huong`: "chung" | "ICT" | "CS". Tra mục lục **cả hai** cuốn Tin học 11 và 12 (Tin học ứng dụng, Khoa học máy tính) để biết chủ đề nào là phần chung, chủ đề nào riêng.
- `phan_mem_ngon_ngu`, `lenh_va_cau_truc` (với chủ đề lập trình).
- Chương trình 2018 **không có** lập trình hướng đối tượng (OOP). Lớp 10 đã học Python cơ bản, gồm list, xâu và hàm `def` (xem `src/data/khungTin.json` lớp 10).
- Thêm bảng `tien_trinh_lap_trinh` cho lớp 11–12: `[{ "noi_dung", "lop", "id", "ghi_chu" }]`.
- Đề tốt nghiệp Tin học 2025: ghi đúng bao nhiêu câu thuộc phần chung, bao nhiêu thuộc phần riêng ICT/CS, ở cả Phần I và Phần II.

**KHTN 6–9 (lượt 2, 3)**
- `mach`: "Hoá" | "Sinh" | "Lý" | "Trái Đất và bầu trời" | "Mở đầu".
- `thuat_ngu` (danh pháp IUPAC: sodium, oxygen, hydrochloric acid…; thuật ngữ DNA, gene…), `cong_thuc` (ký hiệu SGK, lớp áp dụng), `thi_nghiem`.
- `kien_thuc_duoc_dung` ghi cả công cụ Toán đã có (phương trình bậc nhất ở Toán 8, căn bậc hai ở Toán 9…).
- `cau_truc_de` thêm `ti_le_mach` (tỉ lệ điểm Lý/Hoá/Sinh trong đề chung).
- Gợi ý kiểm đủ chương (đối chiếu lại mục lục): lớp 7 có nguyên tử, sơ lược bảng tuần hoàn, phân tử; tốc độ; âm thanh; ánh sáng; từ; trao đổi chất và chuyển hoá năng lượng ở sinh vật; cảm ứng; sinh trưởng và phát triển; sinh sản. Lớp 8 có phản ứng hoá học, mol và tính theo phương trình, acid–base–muối, khối lượng riêng–áp suất, moment lực, điện, nhiệt; **cơ thể người**; sinh thái. Lớp 9 có năng lượng cơ học, **ánh sáng (khúc xạ, thấu kính, mắt)**, **điện, điện từ**, năng lượng với cuộc sống, kim loại, hợp chất hữu cơ (hydrocarbon, ethylic alcohol, acetic acid, lipid, carbohydrate, protein, polymer), di truyền, tiến hoá.

**Tiếng Anh 7–12 (lượt 4, 5)**
- Sách **Global Success**. Mỗi chương là một UNIT, id `anh<lớp>-u<nn>` (ví dụ `anh7-u03`). Lớp 6–9: 12 unit mỗi lớp. Lớp 10–12: 10 unit mỗi lớp. Không cần tách các bài Review.
- Trường: `chu_de`, `tu_vung` (8–15 từ tiêu biểu), `ngu_phap`, `phat_am`, `ky_nang` {doc, nghe, noi, viet}, `ngu_phap_da_hoc_truoc`. Thay `yeu_cau_can_dat` bằng các trường này cũng được.
- `chua_duoc_dung` = cấu trúc chưa học tính đến unit đó, ghi rõ lớp và unit: passive, conditionals 1/2/3, relative clauses, reported speech, present perfect, past continuous, gerund/to-inf, wish, so/such… that, participle clauses, inversion…
- Bảng `tien_trinh_ngu_phap` ở cấp gốc: `[{ "cau_truc", "lop", "unit", "ghi_chu" }]`. Lượt 4 tính cả lớp 6 (tham khảo `scripts/khung/` nếu có, nếu không thì tra sách lớp 6). Bảng này không được mâu thuẫn với `chua_duoc_dung`.
- `cau_truc_de`: dạng bài và số câu (phát âm, trọng âm, từ vựng–ngữ pháp, đọc điền từ, đọc hiểu, viết lại câu, sắp xếp…). Lớp 9 thêm đề thi vào lớp 10 (Hà Nội, TP.HCM). Lớp 12 thêm đề tốt nghiệp 2025 (40 câu).

**GDCD 6–9, Kinh tế và pháp luật 10–12 (lượt 6, 7)**
- `mach`: GDCD là "Đạo đức" | "Kĩ năng sống" | "Kinh tế" | "Pháp luật"; KTPL là "Kinh tế" | "Pháp luật".
- `khai_niem`, `can_cu_phap_ly`: `[{ "van_ban", "so_hieu", "noi_dung", "hieu_luc", "sgk_dan" }]`. Mỗi mục phải có **tình trạng hiệu lực hiện tại**. Tra Cơ sở dữ liệu quốc gia về văn bản pháp luật. Lưu ý các thay đổi sau khi SGK in: Hiến pháp sửa đổi 2025, bỏ cấp huyện và sáp nhập tỉnh 2025, Luật Đất đai 2024, Luật Trật tự an toàn giao thông đường bộ 2024, tuổi nghỉ hưu… `luu_y_ra_de` ghi: khi SGK khác luật hiện hành thì ra đề theo luật hiện hành, hoặc tránh câu phụ thuộc vào chi tiết đã đổi.
- Làm đủ **mọi bài** trong mục lục: GDCD khoảng 8–10 bài mỗi lớp; KTPL khoảng 15–20 bài mỗi lớp (được gộp các bài cùng chủ đề). Lần trước chỉ có 1–2 chủ đề mỗi lớp, không chấp nhận.
- `dang_bai_dien_hinh` ưu tiên xử lý tình huống.

**Địa lí (lượt 8, 9)**
- Lớp 6–9: chỉ **phân môn Địa lí** của môn Lịch sử và Địa lí. Chủ đề chung Sử–Địa đặt `mach: "chủ đề chung"` (chỉ ghi phần Địa lí).
- `mach`, `khai_niem`, `dia_danh`, `so_lieu_moc` (mỗi số liệu ghi năm và nguồn: SGK hoặc niên giám Cục Thống kê), `ky_nang` (bản đồ, biểu đồ, bảng số liệu, tính toán).
- Bảng `ky_nang_tinh_toan` ở cấp gốc: `[{ "ten", "cong_thuc", "don_vi", "lop_bat_dau" }]` (mật độ dân số, tỉ lệ gia tăng tự nhiên, tốc độ tăng trưởng, tỉ trọng/cơ cấu, bình quân đầu người, năng suất, cán cân xuất nhập khẩu…).
- **Địa giới hành chính**: năm 2025 Việt Nam sáp nhập tỉnh và bỏ cấp huyện. Ở các chương địa lí Việt Nam và vùng, ghi rõ trong `luu_y_ra_de`: SGK dùng cách chia nào, hiện hành ra sao, ra đề nên theo cách nào.
- Lớp 6–9: `cau_truc_de` ghi tỉ lệ điểm phần Địa lí trong đề chung môn Lịch sử và Địa lí. Lớp 12: đề tốt nghiệp 2025 (phần trả lời ngắn chủ yếu là tính toán), và có được dùng Atlat trong phòng thi hay không.

**Công nghệ (lượt 10, 11)**
- Lớp 9: trường `mo_dun` (tên mô đun nghề nghiệp lựa chọn; ghi mô đun nào bắt buộc, mô đun nào tự chọn).
- Lớp 10–12: `dinh_huong`: "Công nghiệp" | "Nông nghiệp" | "chung". Tra mục lục cả hai bộ sách định hướng.
- `thuat_ngu_ki_hieu` (kí hiệu bản vẽ, kí hiệu mạch điện, TCVN nếu sách nêu), `cong_thuc`, `quy_trinh`.
- `chua_duoc_dung` có cả nội dung của định hướng kia và của mô đun khác.
- `cau_truc_de` lớp 10–12 ghi riêng cho từng định hướng (thêm trường `dinh_huong`). Đề tốt nghiệp 2025 cho cả hai định hướng.

**Tiểu học (lượt 12–15)**
- Ở cấp gốc mỗi file thêm khối `danh_gia` theo Thông tư 27/2020: `{ "muc_do": [{ "muc": 1, "mo_ta" }, …], "thang_diem", "thoi_diem_kiem_tra" }`. Đề tiểu học có **3 mức**, không dùng NB/TH/VD/VDC. `cau_truc_de` dùng `ti_le_muc` {"Mức 1", "Mức 2", "Mức 3"}.
- Mỗi chương thêm `pham_vi` (phạm vi số, phép tính đã học, đơn vị đo; với Tiếng Việt là độ dài bài đọc, bài viết).
- Toán: mỗi lớp khoảng 6–10 chương theo mục lục, **không gộp cả lớp vào một chương** (lần trước bị lỗi này).
- Tiếng Việt: chương là chủ điểm; `yeu_cau_can_dat` chia {doc, viet, noi_nghe}; thêm `kien_thuc_tieng_viet`, `kieu_bai_viet`. `cau_truc_de` gồm kiểm tra đọc (đọc thành tiếng, đọc hiểu) và kiểm tra viết.
- Tiếng Anh 3–5: unit của Global Success; `tu_vung`, `mau_cau`, `phat_am`.
- Lượt 15: mỗi môn là một phần tử trong mảng `"mon": [{ "mon": "...", "lop": [...], "cau_truc_de": [...] }]`. Tin học và Công nghệ ghi rõ hai phân môn.
- Mỗi chương 80–250 từ.

## 5. Kiểm tra trước khi commit mỗi lượt
Chạy từ thư mục worktree (sửa tên file):

```bash
node -e '
const d=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
const blocks=Array.isArray(d.mon)?d.mon.map(m=>({lop:m.lop,cd:m.cau_truc_de})):[{lop:d.lop,cd:d.cau_truc_de}];
const ids=new Set();let err=[];
for(const b of blocks)for(const l of b.lop){if(!l.chuong.length)err.push("lớp "+l.lop+" rỗng");
 for(const c of l.chuong){if(ids.has(c.id))err.push("trùng "+c.id);ids.add(c.id);
  if(!c.chua_duoc_dung||!c.chua_duoc_dung.length)err.push("chua_duoc_dung rỗng "+c.id);
  if(/chưa có nội dung|cần xác minh/i.test(c.ten))err.push("tên tạm "+c.id)}
 console.log("lớp",l.lop,":",l.chuong.length,"chương")}
for(const b of blocks)for(const e of b.cd||[])for(const x of [].concat(e.pham_vi||[]))if(typeof x==="string"&&/^[a-z-]+\d+-/.test(x)&&!ids.has(x))err.push("pham_vi sai "+x);
if(/[\u0E00-\u0E7F\u3040-\u30FF\u4E00-\u9FFF]/.test(JSON.stringify(d)))err.push("có chữ Hán/Thái");
if(!d.muc_luc_da_tra||!d.muc_luc_da_tra.length)err.push("thiếu muc_luc_da_tra");
console.log(err.length?"LỖI:\n"+err.join("\n"):"OK")' scripts/khung/<file>.json
```

Chỉ commit khi kết quả là `OK`, đồng thời số chương mỗi lớp khớp với mục lục đã tra.

## 6. Báo cáo khi xong (hoặc khi dừng giữa chừng)
Mỗi lượt một dòng: tên file, số chương mỗi lớp, số mục `ghi_chu_chua_chac`, commit. Cuối cùng ghi các lượt chưa làm được và lý do.
