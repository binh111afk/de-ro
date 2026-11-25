/**
 * Kho hình mẫu cho tác vụ chọn hình: server chọn 2–3 mẫu có từ khoá gần đề nhất rồi ghép vào cuối
 * system prompt (phần đầu prompt không đổi nên vẫn trúng cache). Model yếu chép cách dựng của mẫu
 * tốt hơn nhiều so với tự ghép lệnh từ hướng dẫn chung.
 *
 * Mỗi mẫu: `tags` là cụm từ khoá (viết thường, có dấu; so khớp bỏ dấu), `problem` là đề ngắn,
 * `json` là đúng object model phải trả (một dòng). Test: `npm run test:scene` kiểm mọi mẫu vẽ được.
 */
export interface SceneExample { id: string; tags: string[]; problem: string; json: string }

const scene = (text: string[]) => JSON.stringify({ kind: 'scene', text: text.join('\n') })

export const SCENE_EXAMPLES: SceneExample[] = [
  {
    id: 'thang-tuong',
    tags: ['chiếc thang', 'cái thang', 'dựa vào tường', 'chân thang'],
    problem: 'Một chiếc thang dài 5 m dựa vào tường, chân thang cách tường 1,5 m. Tính chiều cao đầu thang.',
    json: scene([
      '_G(-1; 0) _K(4; 0) A(0; 0) B(1.5; 0) C(0; 4.77)',
      'đất _G-_K', 'tường AC', 'hình cái thang CB', 'vuông CAB',
      'kích thước AB "1,5 m"', 'nhãn BC "5 m"', 'nhãn AC "?"',
    ]),
  },
  {
    id: 'bong-cay',
    tags: ['tia nắng', 'bóng trên mặt đất', 'bóng của', 'tia nắng mặt trời'],
    problem: 'Một cây cao 6 m có bóng trên mặt đất dài 8 m. Tính góc tạo bởi tia nắng mặt trời với mặt đất.',
    json: scene([
      '_G(-1; 0) _K(9; 0) A(0; 0) B(0; 6) C(8; 0)',
      'đất _G-_K', 'hình cây AB', 'đứt BC', 'vuông BAC', 'góc BCA "α"',
      'kích thước AC "8 m"', 'nhãn AB "6 m"',
    ]),
  },
  {
    id: 'tiep-tuyen-chung',
    tags: ['tiếp tuyến chung', 'tiếp xúc ngoài'],
    problem: "Hai đường tròn (O; 3 cm) và (O'; 1 cm) tiếp xúc ngoài tại A. Vẽ tiếp tuyến chung ngoài BC (B thuộc (O), C thuộc (O')).",
    json: scene([
      "O(0; 0) O'(4; 0) A(3; 0)",
      'tròn O 3', "tròn O' 1",
      "tiếp tuyến ngoài O 3 O' 1 B C _D _E",
      "OB, O'C", 'vuông OBC', "chấm A",
    ]),
  },
  {
    id: 'la-hai-cung',
    tags: ['phần tư đường tròn', 'cung tròn tâm', 'hình lá'],
    problem: 'Hình vuông ABCD cạnh 4 cm. Vẽ cung tròn tâm A bán kính 4 và cung tròn tâm C bán kính 4 nằm trong hình vuông; tô phần chung giữa hai cung.',
    json: scene([
      'A(0; 0) B(4; 0) C(4; 4) D(0; 4)',
      'vùng cung A 4 0 90; cung C 4 180 270 tô đậm xám',
      'ABCD', 'kích thước AB "4 cm"',
    ]),
  },
  {
    id: 'du-quay',
    tags: ['đu quay', 'vòng quay', 'cabin'],
    problem: 'Một vòng đu quay bán kính 20 m có 8 cabin cách đều nhau, tâm vòng quay cao 22 m so với mặt đất.',
    json: scene([
      '_G(-26; 0) _K(26; 0) O(0; 22) _H(0; 0) _L(-7; 0) _R(7; 0)',
      'đất _G-_K', '_L-O, _R-O', 'tròn O 20',
      'đều 8 _C quanh O 20 tròn 1.6 nối',
      'kích thước _H O "22 m"', 'nhãn O-_C1 "20 m"',
    ]),
  },
  // --- Toán ứng dụng ---
  {
    id: 'hai-dang-goc-ha',
    tags: ['góc hạ', 'hải đăng', 'ngọn hải đăng', 'con thuyền'],
    problem: 'Từ đỉnh ngọn hải đăng cao 45 m so với mực nước biển, người ta nhìn thấy một con thuyền với góc hạ 28°. Tính khoảng cách từ thuyền đến chân hải đăng.',
    json: scene([
      '_S(-1.5; 0) _E(10; 0) A(0; 0) B(0; 4.5) C(8.46; 0) _H(8.5; 4.5)',
      'đất _S-_E', 'hình hải đăng AB', 'hình thuyền C',
      'đứt B-_H', 'đứt BC', 'vuông CAB', 'góc _H-B-C "28°" 1.1',
      'kích thước AB "45 m"', 'kích thước AC "?"',
    ]),
  },
  {
    id: 'do-song-hai-diem',
    tags: ['bờ sông', 'bề rộng con sông', 'qua sông', 'hai điểm quan sát'],
    problem: 'Từ hai điểm A, B trên bờ sông cách nhau 60 m nhìn sang gốc cây C ở bờ bên kia với góc CAB = 52° và góc CBA = 64°. Tính bề rộng con sông.',
    json: scene([
      '_L1(-1; 0) _R1(7; 0) _L2(-1; 4.72) _R2(7; 4.72)',
      'A(0; 0) B(6; 0) C(3.69; 4.72)',
      '_L1-_R1-_R2-_L2 tô xanh mờ 0.25 không viền nền',
      '_L1-_R1, _L2-_R2', 'H = hình chiếu C lên AB',
      'AC, BC, đứt CH', 'hình cây C', 'vuông CHA',
      'góc CAB "52°"', 'góc CBA "64°"', 'kích thước AB "60 m"', 'nhãn CH "?"',
    ]),
  },
  {
    id: 'cot-co-gay',
    tags: ['cột cờ', 'bị gãy', 'chạm đất', 'gãy ngang'],
    problem: 'Một cột cờ cao 10 m bị gió làm gãy ngang thân, ngọn cột chạm đất cách gốc 4 m (phần thân dưới vẫn thẳng đứng). Tính chiều cao chỗ gãy.',
    json: scene([
      '_G(-1; 0) _K(5.5; 0) A(0; 0) B(0; 4.2) C(4; 0) _T(0; 7.2)',
      'đất _G-_K', 'AB dày', 'BC dày', 'đứt B-_T', 'vuông BAC',
      'kích thước AC "4 m"', 'nhãn AB "?"',
    ]),
  },
  {
    id: 'doc-duong-o-to',
    tags: ['độ dốc', 'đoạn dốc', 'con dốc'],
    problem: 'Một con đường dốc lên nghiêng góc 12° so với phương ngang. Xe ô tô đi hết đoạn dốc dài 200 m thì lên cao được bao nhiêu mét?',
    json: scene([
      '_G(-1; 0) _K(9; 0) A(0; 0) B(8; 0) C(8; 1.7) _M(4; 0.85)',
      'đất _G-_K', 'AC dày', 'đứt BC', 'vuông ABC',
      'góc CAB "12°" 1.3', 'hình ô tô _M',
      'nhãn AC "200 m"', 'nhãn BC "?"',
    ]),
  },
  {
    id: 'cau-truot-thang',
    tags: ['cầu trượt'],
    problem: 'Một cầu trượt thẳng dài 3,6 m đặt nghiêng góc 38° so với mặt sân. Tính chiều cao bậc thang thẳng đứng của cầu trượt.',
    json: scene([
      '_G(-1; 0) _K(4; 0) A(0; 0) B(2.84; 0) C(0; 2.22)',
      'đất _G-_K', 'AC dày', 'CB dày', 'vuông CAB',
      'góc CBA "38°" 0.7', 'nhãn CB "3,6 m"', 'nhãn AC "?"',
    ]),
  },
  {
    id: 'hai-tau-bien',
    tags: ['rời bến', 'hai tàu', 'tàu thủy', 'hướng hợp'],
    problem: 'Hai tàu thủy rời bến O cùng lúc theo hai hướng hợp với nhau góc 65°: tàu thứ nhất đi được 40 km tới A, tàu thứ hai đi được 50 km tới B. Tính khoảng cách AB.',
    json: scene([
      'O(0; 0) A(4; 0)', 'B = tròn O 5 góc 65',
      'OA, OB, đứt AB', 'hình thuyền A', 'hình thuyền B',
      'góc AOB "65°" 0.9', 'nhãn OA "40 km"', 'nhãn OB "50 km"', 'nhãn AB "?"',
    ]),
  },
  {
    id: 'khinh-khi-cau',
    tags: ['khinh khí cầu', 'điểm phóng'],
    problem: 'Một khinh khí cầu bay thẳng đứng lên cao từ O. Từ điểm M cách O một khoảng 120 m, người quan sát nhìn lên khinh khí cầu K với góc nâng 48°. Tính độ cao OK.',
    json: scene([
      '_G(-1; 0) _K(5; 0) O(0; 0) M(4; 0) K(0; 4.44)',
      'đất _G-_K', 'đứt OK', 'đứt MK', 'hình khinh khí cầu K',
      'vuông KOM', 'góc KMO "48°" 0.8', 'kích thước OM "120 m"', 'nhãn OK "?"',
    ]),
  },
  {
    id: 'dieu-bay-cao',
    tags: ['thả diều', 'dây diều', 'con diều', 'tay cầm'],
    problem: 'Một bạn nhỏ thả diều với đoạn dây căng dài 80 m, dây diều hợp với phương ngang góc 55°. Biết tay cầm diều cao 1 m so với mặt đất, tính độ cao của diều.',
    json: scene([
      '_G(-1; 0) _K(6; 0) O(0; 0) A(0; 0.7) B(4.59; 7.25) H(4.59; 0) _C(4.59; 0.7)',
      'đất _G-_K', 'hình người O-A', 'hình con diều B',
      'AB, đứt A-_C, đứt BH', 'vuông B_CA', 'góc BA_C "55°" 0.9',
      'nhãn AB "80 m"', 'kích thước OA "1 m"', 'nhãn BH "?"',
    ]),
  },
  // --- Hình phẳng ---
  {
    id: 'tiep-tuyen-ngoai',
    tags: ['tiếp điểm', 'điểm nằm ngoài đường tròn', 'hai tiếp tuyến'],
    problem: 'Từ điểm A nằm ngoài đường tròn (O; 3 cm) với OA = 5 cm, kẻ hai tiếp tuyến AB, AC (B, C là hai tiếp điểm). Tính độ dài AB.',
    json: scene([
      'O(0; 0) A(5; 0)', 'tròn O 3',
      'tiếp tuyến từ A tới O 3 B C',
      'AB, AC, OB, OC, đứt OA', 'vuông OBA', 'vuông OCA',
      'nhãn OB "3 cm"', 'nhãn OA "5 cm"', 'nhãn AB "?"',
    ]),
  },
  {
    id: 'day-cung-khoang-cach',
    tags: ['dây cung', 'khoảng cách từ tâm', 'vuông góc với dây', 'trung điểm dây'],
    problem: 'Cho đường tròn (O; 5 cm) và dây cung AB = 8 cm. Kẻ OH vuông góc với AB tại H. Tính khoảng cách OH từ tâm O đến dây AB.',
    json: scene([
      'O(0; 0) A(-4; -3) B(4; -3) H(0; -3)',
      'tròn O 5', 'AB, OA, OB, OH', 'vuông OHA',
      'nhãn OA "5 cm"', 'kích thước AB "8 cm"', 'nhãn OH "?"',
    ]),
  },
  {
    id: 'goc-noi-tiep-tam',
    tags: ['góc nội tiếp', 'góc ở tâm', 'cùng chắn cung', 'nằm trên đường tròn'],
    problem: 'Cho đường tròn (O) có ba điểm A, B, C nằm trên đường tròn sao cho góc ở tâm BOC = 110°. Tính số đo góc nội tiếp BAC.',
    json: scene([
      'O(0; 0)', 'A = tròn O 3 góc 115', 'B = tròn O 3 góc 215', 'C = tròn O 3 góc 325',
      'tròn O 3', 'AB, AC, OB, OC', 'góc BOC "110°" 0.7', 'góc BAC "?" 0.8',
    ]),
  },
  {
    id: 'tam-giac-truc-tam-noi-tiep',
    tags: ['trực tâm', 'tứ giác nội tiếp', 'tam giác nhọn'],
    problem: 'Cho tam giác nhọn ABC nội tiếp đường tròn (O), các đường cao BD và CE cắt nhau tại trực tâm H. Chứng minh tứ giác BEDC nội tiếp.',
    json: scene([
      'O(0; 0)', 'A = tròn O 3.5 góc 80', 'B = tròn O 3.5 góc 210', 'C = tròn O 3.5 góc 330',
      'tròn O 3.5', 'ABC', 'D = hình chiếu B lên AC', 'E = hình chiếu C lên AB',
      'BD, CE', 'H = BD cắt CE', 'vuông BDC', 'vuông CEB', 'chấm H',
    ]),
  },
  {
    id: 'tam-giac-vuong-he-thuc',
    tags: ['hệ thức lượng'],
    problem: 'Cho tam giác ABC vuông tại A, đường cao AH. Biết AB = 6 cm, AC = 8 cm. Tính độ dài đường cao AH.',
    json: scene([
      'A(0; 0) B(0; 6) C(8; 0)', 'H = hình chiếu A lên BC',
      'ABC, AH', 'vuông BAC', 'vuông AHB',
      'nhãn AB "6 cm"', 'nhãn AC "8 cm"', 'nhãn AH "?"',
    ]),
  },
  {
    id: 'hinh-thang-duong-cheo',
    tags: ['hình thang', 'hai đường chéo', 'đáy nhỏ', 'đáy lớn'],
    problem: 'Cho hình thang ABCD (AB // CD) có đáy nhỏ AB = 4 cm, đáy lớn CD = 8 cm, chiều cao 3 cm; hai đường chéo AC và BD cắt nhau tại O.',
    json: scene([
      'D(0; 0) C(8; 0) A(1.5; 3) B(5.5; 3)',
      'ABCD, AC, BD', 'O = AC cắt BD', 'H = hình chiếu A lên CD',
      'đứt AH', 'vuông AHC',
      'kích thước AB "4 cm"', 'kích thước CD "8 cm"', 'nhãn AH "3 cm"',
    ]),
  },
  {
    id: 'hinh-binh-hanh-duong-cheo',
    tags: ['hình bình hành', 'hai đường chéo'],
    problem: 'Cho hình bình hành ABCD có AB = 6 cm, AD = 4 cm, góc BAD = 60°. Hai đường chéo AC và BD cắt nhau tại O. Tính độ dài AC.',
    json: scene([
      'A(0; 0) B(6; 0) D(2; 3.46) C(8; 3.46)',
      'ABCD, AC, BD', 'O = AC cắt BD', 'góc DAB "60°" 0.8',
      'kích thước AB "6 cm"', 'nhãn AD "4 cm"',
    ]),
  },
  {
    id: 'hinh-vien-phan',
    tags: ['hình viên phân', 'viên phân'],
    problem: 'Cho đường tròn (O; 4 cm) và dây cung AB sao cho góc AOB = 90°. Tính diện tích hình viên phân giới hạn bởi cung nhỏ AB và dây AB.',
    json: scene([
      'O(0; 0) A(4; 0) B(0; 4)', 'tròn O 4',
      'vùng cung O 4 0 90; đoạn B-A tô gạch xanh',
      'OA, OB, AB', 'vuông AOB', 'nhãn OA "4 cm"',
    ]),
  },
  {
    id: 'hinh-vanh-khuyen',
    tags: ['hình vành khuyên', 'đồng tâm', 'bán kính ngoài', 'bán kính trong'],
    problem: 'Một chiếc đĩa hình vành khuyên tạo bởi hai đường tròn đồng tâm (O) bán kính ngoài R = 6 cm và bán kính trong r = 2 cm. Tính diện tích vành khuyên.',
    json: scene([
      'O(0; 0) A(2; 0) B(6; 0)',
      'tròn O 6 tô xám nền', 'tròn O 2 tô trắng',
      'OA, OB', 'nhãn OA "2 cm"', 'kích thước OB "6 cm"',
    ]),
  },
  {
    id: 'quat-giay',
    tags: ['quạt giấy', 'xòe ra'],
    problem: 'Một chiếc quạt giấy xòe ra thành hình quạt tròn tâm O góc ở tâm 120°, bán kính ngoài R = 25 cm và phần giấy dán từ r = 8 cm đến R = 25 cm.',
    json: scene([
      'O(0; 0)', 'A = tròn O 5 góc 30', 'B = tròn O 5 góc 150',
      'quạt O 5 30 150 tô vàng', 'quạt O 1.6 30 150 tô trắng',
      'góc AOB "120°" 0.9', 'nhãn OA "25 cm"',
    ]),
  },
  {
    id: 'luc-giac-noi-tiep',
    tags: ['lục giác đều', 'đa giác đều'],
    problem: 'Cho lục giác đều ABCDEF nội tiếp đường tròn (O; 3 cm). Tính chu vi và diện tích lục giác đều ABCDEF.',
    json: scene([
      'O(0; 0)', 'A = tròn O 3 góc 90', 'B = tròn O 3 góc 150', 'C = tròn O 3 góc 210',
      'D = tròn O 3 góc 270', 'E = tròn O 3 góc 330', 'F = tròn O 3 góc 30',
      'tròn O 3 đứt', 'ABCDEF tô xanh mờ 0.25', 'đứt OA, đứt OB', 'nhãn OA "3 cm"',
    ]),
  },
  {
    id: 'cong-parabol',
    tags: ['cổng parabol', 'cổng chào', 'chân cổng', 'đỉnh cổng'],
    problem: 'Một cổng chào có dạng hình parabol chiều rộng chân cổng AB = 8 m và chiều cao đỉnh cổng I là 4,5 m. Tính diện tích mặt cắt cổng.',
    json: scene([
      '_G(-5.5; 0) _K(5.5; 0) A(-4; 0) B(4; 0) I(0; 4.5) _O(0; 0)',
      'đất _G-_K', 'cong A-I-B dày', 'đứt I-_O', 'vuông I_OB',
      'chấm I', 'kích thước AB "8 m"', 'nhãn I-_O "4,5 m"',
    ]),
  },
  {
    id: 'duong-chay-svd',
    tags: ['sân vận động', 'đường chạy'],
    problem: 'Một đường chạy sân vận động gồm hai đoạn thẳng song song dài 100 m và hai nửa đường tròn đường kính 60 m ở hai đầu. Tính chu vi đường chạy.',
    json: scene([
      'A(-5; 3) B(5; 3) C(5; -3) D(-5; -3)',
      'AB, CD', 'nửa tròn BC trái', 'nửa tròn DA trái',
      'đứt AD, đứt BC', 'kích thước AB "100 m"', 'nhãn AD "60 m"',
    ]),
  },
  {
    id: 'phan-to-bon-cung',
    tags: ['bốn cung tròn', 'bốn phần tư'],
    problem: 'Cho hình vuông ABCD cạnh 4 cm. Vẽ bốn phần tư đường tròn tâm A, B, C, D cùng bán kính 2 cm nằm trong hình vuông. Tô phần nằm ngoài bốn cung.',
    json: scene([
      'A(0; 4) B(4; 4) C(4; 0) D(0; 0)',
      'ABCD tô xám nền',
      'quạt A 2 270 360 tô trắng', 'quạt B 2 180 270 tô trắng',
      'quạt C 2 90 180 tô trắng', 'quạt D 2 0 90 tô trắng',
      'ABCD', 'kích thước CD "4 cm"',
    ]),
  },
  {
    id: 'tam-giac-noi-tiep-r',
    tags: ['ngoại tiếp tam giác', 'bán kính ngoại tiếp', 'tâm ngoại tiếp'],
    problem: 'Cho tam giác ABC có AB = 5 cm, AC = 7 cm, BC = 8 cm nội tiếp đường tròn tâm O. Tính bán kính R của đường tròn ngoại tiếp tam giác ABC.',
    json: scene([
      'B(0; 0) C(8; 0) A(2.5; 4.33) O(4; 0.58)',
      'tròn O 4.04 đứt', 'ABC, OA',
      'nhãn AB "5 cm"', 'nhãn AC "7 cm"', 'kích thước BC "8 cm"', 'nhãn OA "R"',
    ]),
  },
  // --- Hình không gian (3D) ---
  {
    id: 'hinh-tru-thiet-dien',
    tags: ['thiết diện qua trục'],
    problem: 'Một hình trụ có bán kính đáy R = 3 cm, chiều cao h = 6 cm. Vẽ thiết diện qua trục của hình trụ và tính diện tích thiết diện.',
    json: scene([
      "_O(0; 0) _O'(0; 6) A(-3; 0) B(3; 0) C(3; 6) D(-3; 6)",
      'cung elip _O 3 0.9 180 360', 'cung elip _O 3 0.9 0 180 đứt',
      "elip _O' 3 0.9", 'ABCD tô gạch xám', "đứt _O-_O'",
      'kích thước BC "6 cm"', 'nhãn _O-B "3 cm"',
    ]),
  },
  {
    id: 'cau-noi-tiep-tru',
    tags: ['nội tiếp hình trụ', 'hình cầu nội tiếp', 'vừa khít', 'quả cầu'],
    problem: 'Một quả cầu đặc nằm vừa khít (nội tiếp) trong một chiếc hộp hình trụ có bán kính đáy R = 5 cm và chiều cao 10 cm. Tính thể tích phần trống.',
    json: scene([
      "_O(0; 0) _O'(0; 6) _C(0; 3) _A(-3; 0) _B(3; 0) _C1(3; 6) _D(-3; 6)",
      'tròn _C 3 tô cầu xám mờ 0.6',
      'cung elip _O 3 0.9 180 360', 'cung elip _O 3 0.9 0 180 đứt',
      "elip _O' 3 0.9", '_A-_D, _B-_C1',
      'kích thước _B-_C1 "10 cm"', 'kích thước _A-_B "10 cm"',
    ]),
  },
  {
    id: 'be-nuoc-muc-nuoc',
    tags: ['bể nước', 'bể cá', 'mực nước', 'chứa nước'],
    problem: 'Một bể cá hình hộp chữ nhật dài 80 cm, rộng 40 cm, cao 50 cm đang chứa nước cao 35 cm. Tính thể tích nước trong bể.',
    json: scene([
      'góc nhìn xiên -0.4 -0.35',
      '_A(0; 0; 0) _B(5; 0; 0) _C(5; 2.5; 0) _D(0; 2.5; 0) _E(0; 0; 3.2) _F(5; 0; 3.2) _G(5; 2.5; 3.2) _H(0; 2.5; 3.2)',
      '_W1(0; 0; 2.2) _W2(5; 0; 2.2) _W3(5; 2.5; 2.2) _W4(0; 2.5; 2.2)',
      'mặt _W1-_W2-_W3-_W4 tô xanh mờ 0.45',
      'đứt _A-_B, đứt _A-_D, đứt _A-_E',
      '_B-_C, _C-_D, _E-_F, _F-_G, _G-_H, _H-_E, _B-_F, _C-_G, _D-_H',
      'nhãn _D-_C "80 cm"', 'nhãn _B-_C "40 cm"', 'nhãn _C-_G "50 cm"', 'nhãn _C-_W3 "35 cm"',
    ]),
  },
  // --- Vật lý ---
  {
    id: 'rong-roc-co-dinh',
    tags: ['ròng rọc cố định'],
    problem: 'Một hệ thống gồm một ròng rọc cố định gắn trên trần dùng để kéo vật nặng m = 10 kg lên đều bằng lực kéo F hướng xuống nghiêng góc 30°.',
    json: scene([
      '_C1(-2; 5) _C2(2; 5) _O(0; 4) _T(0; 5) _A(-0.6; 4) _W(-0.6; 1.2) _B(0.52; 4.3) _F(2.2; 1.4)',
      'tường _C1-_C2', '_T-_O dày', 'tròn _O 0.6 tô xám', 'chấm _O',
      '_A-_W', 'hộp _W 1 1 tô nâu "m"', '_B-_F', 'mũi tên _B-_F màu đỏ dày',
      'nhãn _F "F"',
    ]),
  },
  {
    id: 'rong-roc-dong',
    tags: ['ròng rọc động', 'kiện hàng'],
    problem: 'Dùng một ròng rọc động và một ròng rọc cố định để nâng một kiện hàng nặng P = 400 N lên cao. Tính lực kéo F tối thiểu.',
    json: scene([
      '_C1(-2; 5.5) _C2(3; 5.5) _O1(0; 2.2) _O2(1.4; 4.5) _T1(-0.5; 5.5) _T2(1.4; 5.5)',
      '_P1(-0.5; 2.2) _P2(0.5; 2.2) _P3(0.9; 4.5) _P4(1.9; 4.5) _W(0; 0.8) _F(1.9; 2.5)',
      'tường _C1-_C2', '_T2-_O2 dày', '_O1-_W',
      'tròn _O1 0.5 tô xám', 'tròn _O2 0.5 tô xám', 'chấm _O1', 'chấm _O2',
      '_T1-_P1, _P2-_P3', 'mũi tên _P4-_F màu đỏ dày',
      'hộp _W 1.2 0.9 tô nâu "400 N"', 'nhãn _F "F"',
    ]),
  },
  {
    id: 'don-bay-can-bang',
    tags: ['đòn bẩy', 'điểm tựa', 'cánh tay đòn'],
    problem: 'Một thanh cứng nhẹ AB dài 1,2 m có điểm tựa O cách đầu A 0,4 m. Treo vật nặng P1 = 60 N tại A, cần treo vật P2 bằng bao nhiêu tại B để đòn bẩy cân bằng?',
    json: scene([
      '_G(-2; 0) _K(8; 0) O(2; 0.9) A(0; 0.9) B(6; 0.9) _L(1.5; 0) _R(2.5; 0)',
      '_W1(0; 0.1) _W2(6; 0.1)',
      'đất _G-_K', '_L-O-_R tô xám', 'AB dày',
      'A-_W1, B-_W2', 'mũi tên A-_W1 màu đỏ', 'mũi tên B-_W2 màu lam',
      'kích thước A-O "0,4 m"', 'kích thước AB "1,2 m"',
      'chữ _W1 "60 N" nhỏ', 'chữ _W2 "P2 = ?" nhỏ',
    ]),
  },
  {
    id: 'con-lac-don',
    tags: ['con lắc đơn'],
    problem: 'Một con lắc đơn gồm sợi dây dài l = 1 m treo vật nhỏ khối lượng m tại điểm cố định I. Kéo vật lệch khỏi phương thẳng đứng một góc α = 10° rồi thả nhẹ.',
    json: scene([
      '_C1(-1.5; 4) _C2(2.5; 4) I(0; 4) _V(0; 0.5) M(1.2; 0.72)',
      'tường _C1-_C2', 'đứt I-_V', 'I-M',
      'tròn M 0.3 tô cầu xám', 'góc _V-I-M "α" 1.2',
      'nhãn I-M "l = 1 m"', 'nhãn M "m"',
    ]),
  },
  {
    id: 'phan-xa-guong-phang',
    tags: ['gương phẳng', 'tia phản xạ'],
    problem: 'Chiếu một tia sáng SI tới gương phẳng nằm ngang với góc tới i = 40°. Vẽ tia phản xạ IR và tính góc hợp bởi tia tới và tia phản xạ.',
    json: scene([
      '_G1(-4; 0) _G2(4; 0) I(0; 0) N(0; 3.5) S(-2.5; 3) R(2.5; 3)',
      'đất _G1-_G2', '_G1-_G2 dày', 'đứt I-N',
      'mũi tên S-I màu đỏ dày', 'mũi tên I-R màu đỏ dày',
      'góc S-I-N "40°" 1.0', 'góc N-I-R "i′" 1.0',
    ]),
  },
  {
    id: 'khuc-xa-mat-nuoc',
    tags: ['khúc xạ', 'tia khúc xạ', 'chiết suất'],
    problem: "Chiếu một tia sáng SI từ không khí vào nước dưới góc tới i = 45°, biết chiết suất của nước n = 4/3. Vẽ tia khúc xạ IR và đường pháp tuyến NN'.",
    json: scene([
      "_L(-4; 0) _R(4; 0) _BL(-4; -3.2) _BR(4; -3.2) I(0; 0) N(0; 3) N'(0; -3) S(-2.8; 2.8) R(1.7; -2.7)",
      '_L-_R-_BR-_BL tô xanh mờ 0.25 không viền nền', '_L-_R dày', "đứt N-N'",
      'mũi tên S-I màu đỏ dày', 'mũi tên I-R màu lam dày',
      'góc S-I-N "45°" 0.9', 'góc R-I-N\' "r" 1.0',
    ]),
  },
  {
    id: 'nem-ngang',
    tags: ['ném ngang', 'tầm xa'],
    problem: 'Từ độ cao h = 45 m, một viên bi được ném theo phương ngang với vận tốc ban đầu v0 = 20 m/s. Vẽ quỹ đạo parabol của viên bi và tầm xa L.',
    json: scene([
      '_G(-1; 0) _K(8; 0) O(0; 0) A(0; 4.5) B(6; 0) _C(3; 4.5) _V(2; 4.5)',
      'đất _G-_K', 'AO', 'mũi tên A-_V màu đỏ dày',
      'cong A-_C-B đứt màu lam dày', 'chấm A to', 'vuông AOB',
      'nhãn A-_V "v0"', 'nhãn AO "h = 45 m"', 'kích thước OB "L = ?"',
    ]),
  },
  // --- Sơ đồ ---
  {
    id: 'chu-trinh-quang-hop',
    tags: ['quang hợp', 'hô hấp', 'chu trình', 'trao đổi khí'],
    problem: 'Vẽ sơ đồ chu trình trao đổi khí giữa hô hấp và quang hợp (O2 và CO2) giữa thực vật và động vật.',
    json: scene([
      '_A(-2.6; 0) _B(2.6; 0) _T(0; 1.6) _D(0; -1.6)',
      'hộp _A 2.4 1.2 "Thực vật\\n(Quang hợp)" bo tô lục',
      'hộp _B 2.4 1.2 "Động vật\\n(Hô hấp)" bo tô cam',
      'cong _A-_T-_B mũi tên màu lam dày',
      'cong _B-_D-_A mũi tên màu đỏ dày',
      'chữ _T "Nhả O2" nhỏ', 'chữ _D "Thải CO2" nhỏ',
    ]),
  },
  {
    id: 'so-do-tu-duy',
    tags: ['sơ đồ tư duy', 'nhánh chính', 'ý trung tâm'],
    problem: 'Vẽ sơ đồ tư duy trung tâm "Tam giác" với 4 nhánh chính: Phân loại, Đường đồng quy, Diện tích, Đồng dạng.',
    json: scene([
      '_O(0; 0) _A(-3.2; 1.8) _B(3.2; 1.8) _C(3.2; -1.8) _D(-3.2; -1.8)',
      'hộp _O 2.4 1.1 "Tam giác" bo tô vàng đậm',
      'hộp _A 2.3 0.9 "Phân loại" bo tô xanh',
      'hộp _B 2.5 0.9 "Đường đồng quy" bo tô lục',
      'hộp _C 2.3 0.9 "Diện tích" bo tô cam',
      'hộp _D 2.3 0.9 "Đồng dạng" bo tô tím',
      '_O-_A, _O-_B, _O-_C, _O-_D',
    ]),
  },
  {
    id: 'ban-do-huong-bac',
    tags: ['hướng bắc', 'hướng đông', 'bản đồ', 'sơ đồ đường đi'],
    problem: 'Một người đi từ A hướng về phía Bắc 4 km đến B, rồi rẽ sang hướng Đông đi tiếp 3 km đến C. Vẽ sơ đồ đường đi có mũi tên chỉ hướng Bắc và tính AC.',
    json: scene([
      'A(0; 0) B(0; 4) C(3; 4) _N1(-2; 2.8) _N2(-2; 4.2) _N3(-2; 4.5)',
      'mũi tên _N1-_N2 dày', 'chữ _N3 "Bắc" nhỏ đậm',
      'mũi tên A-B dày', 'mũi tên B-C dày', 'đứt A-C', 'vuông ABC',
      'nhãn A-B "4 km"', 'nhãn B-C "3 km"', 'nhãn A-C "?"',
    ]),
  },
  {
    id: 'mang-may-tinh-sao',
    tags: ['mạng máy tính', 'máy chủ', 'máy trạm', 'hình sao'],
    problem: 'Một mạng máy tính nội bộ gồm máy chủ S ở trung tâm kết nối trực tiếp với 5 máy trạm M1, M2, M3, M4, M5 tạo thành sơ đồ hình sao.',
    json: scene([
      'S(0; 0)',
      'đều 5 M quanh S 3.2 góc 90',
      'nút S 0.6 "S" tô cam',
      'nút M1 0.45 "M1" tô xanh', 'nút M2 0.45 "M2" tô xanh',
      'nút M3 0.45 "M3" tô xanh', 'nút M4 0.45 "M4" tô xanh', 'nút M5 0.45 "M5" tô xanh',
      'S-M1, S-M2, S-M3, S-M4, S-M5',
    ]),
  },
  {
    id: 'quy-trinh-xu-ly-nuoc',
    tags: ['sơ đồ khối', 'sơ đồ quy trình'],
    problem: 'Vẽ sơ đồ quy trình 4 bước xử lý nước sạch: Lắng → Lọc → Khử trùng → Bể chứa.',
    json: scene([
      'khung 560 200',
      '_A(-4.5; 0) _B(-1.5; 0) _C(1.5; 0) _D(4.5; 0)',
      'hộp _A 2.1 1.0 "1. Lắng" bo tô xanh',
      'hộp _B 2.1 1.0 "2. Lọc" bo tô xanh',
      'hộp _C 2.2 1.0 "3. Khử trùng" bo tô vàng',
      'hộp _D 2.1 1.0 "4. Bể chứa" bo tô lục',
      'mũi tên _A-_B', 'mũi tên _B-_C', 'mũi tên _C-_D',
    ]),
  },
  {
    id: 'so-do-phan-cap',
    tags: ['sơ đồ phân cấp', 'phòng ban'],
    problem: 'Vẽ sơ đồ phân cấp tổ chức gồm Giám đốc ở trên cùng, bên dưới chia làm 3 phòng ban: Kỹ thuật, Kinh doanh, Nhân sự.',
    json: scene([
      '_G(0; 2.8) _M(0; 1.4) _L(-3.2; 1.4) _R(3.2; 1.4) _A(-3.2; 0) _B(0; 0) _C(3.2; 0)',
      'hộp _G 2.6 1.0 "Giám đốc" bo tô vàng',
      'hộp _A 2.4 0.9 "Kỹ thuật" bo tô xanh',
      'hộp _B 2.4 0.9 "Kinh doanh" bo tô xanh',
      'hộp _C 2.4 0.9 "Nhân sự" bo tô xanh',
      '_G-_M, _L-_R, _L-_A, _M-_B, _R-_C',
    ]),
  },
  // Hình học tuyển sinh lớp 10: nhiều giao điểm. Mọi điểm đề gọi tên đều DỰNG bằng lệnh, không tự tính toạ độ.
  {
    id: 'tiep-tuyen-cat-tuyen',
    tags: ['cát tuyến', 'hai tiếp tuyến', 'tiếp điểm'],
    problem: 'Từ điểm M nằm ngoài đường tròn (O; R) kẻ hai tiếp tuyến MA, MB (A, B là tiếp điểm) và cát tuyến MCD (C nằm giữa M và D). Gọi H là giao điểm của OM và AB, K là trung điểm của CD.',
    json: scene([
      'O(0; 0) M(6; 0)', 'tròn O 3',
      'tiếp tuyến từ M tới O 3 A B',
      'D = tròn O 3 góc 125', 'C = MD cắt tròn O 3',
      'H = OM cắt AB', 'K = trung điểm CD',
      'MA, MB, AB, MD, OA, OB, OK, đứt OM',
      'vuông OAM', 'vuông OBM', 'vuông OHA', 'vuông OKD',
    ]),
  },
  {
    id: 'cat-tuyen-song-song',
    tags: ['cát tuyến', 'hai tiếp tuyến', 'song song với BD'],
    problem: 'Từ điểm S nằm ngoài đường tròn (O) kẻ hai tiếp tuyến SA, SB và cát tuyến SCD không đi qua O (C nằm giữa S và D). SO cắt AB tại H, cắt cung nhỏ AB tại I; M là trung điểm CD. Qua C kẻ đường thẳng song song với BD, cắt AB tại E và AD tại F.',
    json: scene([
      'O(0; 0) S(-9; 0)', 'tròn O 4',
      'tiếp tuyến từ S tới O 4 B A',
      'D = tròn O 4 góc -48', 'C = SD cắt tròn O 4',
      'H = SO cắt AB', 'I = SO cắt tròn O 4', 'M = trung điểm CD',
      '_Q = đối xứng B qua M', 'E = AB cắt C_Q', 'F = AD cắt C_Q',
      'SA, SB, SD, SO, AB, AC, AD, BC, BD, CF, ME, OM',
      'vuông OMD', 'vuông OHA',
    ]),
  },
  {
    id: 'tam-giac-ba-duong-cao',
    tags: ['ba đường cao', 'các đường cao', 'nội tiếp đường tròn (O)', 'trực tâm'],
    problem: 'Cho tam giác ABC nhọn nội tiếp đường tròn (O). Ba đường cao AD, BE, CF cắt nhau tại H. Tia AD cắt (O) tại N, M là trung điểm của BC.',
    json: scene([
      'O(0; 0)', 'A = tròn O 4 góc 105', 'B = tròn O 4 góc 205', 'C = tròn O 4 góc 335',
      'tròn O 4', 'ABC',
      'D = hình chiếu A lên BC', 'E = hình chiếu B lên AC', 'F = hình chiếu C lên AB',
      'H = AD cắt BE', 'N = AD cắt tròn O 4', 'M = trung điểm BC',
      'AN, BE, CF, EF, đứt OM',
      'vuông ADC', 'vuông BEC', 'vuông CFB',
    ]),
  },
  {
    id: 'nua-tron-hai-tiep-tuyen',
    tags: ['nửa đường tròn', 'tiếp tuyến ax', 'tiếp tuyến by', 'hai tiếp tuyến ax'],
    problem: 'Cho nửa đường tròn (O) đường kính AB. Ax, By là hai tiếp tuyến tại A và B. Tiếp tuyến tại M thuộc nửa đường tròn cắt Ax, By lần lượt tại C, D. AD cắt BC tại N.',
    json: scene([
      'O(0; 0) A(-3; 0) B(3; 0) _X(-3; 6.5) _Y(3; 6.5)',
      'cung O 3 0 180', 'AB',
      'M = tròn O 3 góc 62', '_Q = quay O quanh M 90',
      'C = M_Q cắt A_X', 'D = M_Q cắt B_Y', 'N = AD cắt BC',
      'A-_X, B-_Y', 'CD, OC, OD, OM, AD, BC',
      'vuông OMD', 'vuông BAC', 'vuông ABD',
    ]),
  },
]

const fold = (s: string) => s.normalize('NFD').replace(/\p{Mark}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

/** chọn tối đa `n` mẫu có điểm khớp từ khoá > 0, điểm = tổng số từ của các cụm khớp */
export function pickSceneExamples(text: string, n = 3, pool: SceneExample[] = SCENE_EXAMPLES): SceneExample[] {
  const t = ` ${fold(text).replace(/[^a-z0-9]+/g, ' ')} `
  return pool
    .map((e, i) => ({ e, i, s: e.tags.reduce((sum, tag) => sum + (t.includes(` ${fold(tag).replace(/[^a-z0-9]+/g, ' ').trim()} `) ? tag.split(/\s+/).length : 0), 0) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, n)
    .map((x) => x.e)
}

/** đoạn ghép vào cuối system prompt; rỗng nếu không có mẫu nào hợp */
export function sceneExamplesBlock(text: string): string {
  const picked = pickSceneExamples(text)
  if (!picked.length) return ''
  return '\n\nHình mẫu của các đề gần giống (học cách dựng, đặt toạ độ và ghi nhãn; số liệu, tên điểm và chi tiết phải theo đúng đề đang làm, không chép nguyên):\n' +
    picked.map((e) => `Đề: ${e.problem}\n${e.json}`).join('\n\n')
}
