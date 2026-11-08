# Yêu cầu: soạn bù 13 câu Toán 12

Định dạng câu, cách viết LaTeX, các trường JSON: làm đúng như `scripts/bank/BRIEF.md` (mẫu sẵn: `scripts/bank/toan600/t12-oxyz.json`). Mỗi câu có `"grades": ["Lớp 12"]`, có `explanation` giải đủ từng bước (câu Đúng/Sai giải từng ý).

Ghi vào thư mục mới `scripts/bank/bu/`, hai file:

| File | Số câu | Nội dung | Dạng câu |
|---|---|---|---|
| `t12-matcau-oxyz.json` | 11 | Phương trình mặt cầu trong Oxyz: tìm tâm và bán kính, viết phương trình mặt cầu (biết tâm và bán kính; biết tâm và đi qua một điểm; biết đường kính AB; đi qua 4 điểm cho bằng toạ độ), vị trí tương đối mặt cầu với mặt phẳng, mặt cầu tiếp xúc mặt phẳng, bài thực tế (ra-đa, drone, sóng điện thoại) | 4 trắc nghiệm, 4 Đúng/Sai, 3 trả lời ngắn; độ khó trải đều NB/TH/VD/VDC |
| `t12-toiuu-them.json` | 2 | Bài tối ưu thực tế giải bằng đạo hàm (chi phí nhỏ nhất, lợi nhuận lớn nhất, thể tích lớn nhất…) | 2 Đúng/Sai: một câu mức TH, một câu mức VDC |

## Cấm (chương trình 2018 không học)
- Mặt cầu, mặt nón, mặt trụ **ngoại tiếp hoặc nội tiếp** hình chóp, hình lập phương, hình hộp, lăng trụ, tứ diện. Không dùng chữ "ngoại tiếp", "nội tiếp" với mặt cầu.
- Tích có hướng của hai vectơ.
- Không dùng trường `figure` có `circumsphere`. Câu nào cần hình thì không cần hình — để không có `figure`.

## Tự kiểm trước khi báo xong
- Tự giải lại từng câu; câu Đúng/Sai so **từng ý** với chuỗi `answer` (lỗi hay gặp nhất là ý đúng bị ghi S).
- Câu trả lời ngắn: đáp số là một số, dấu phẩy thập phân, làm tròn đúng như đề yêu cầu.
- Câu trắc nghiệm: bốn phương án khác nhau, chỉ một phương án đúng.
- Chạy `cd scripts/bank && node build.mjs bu x.ts` phải in "Không có câu lỗi"; sau đó xoá file `scripts/bank/x.ts`.

Không sửa file nào khác, không commit.
