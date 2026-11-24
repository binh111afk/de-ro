/**
 * Hình thực tế nét đơn (gấp giấy, thang dựa tường, đo chiều cao, mảnh vườn…): khung hình học
 * + mũi tên kích thước + kí hiệu góc + nét đứt + mặt đất / tường gạch chéo + hình tự do / đường cong / tô khối.
 *
 * Mỗi dòng một lệnh (toạ độ trục y hướng lên):
 *   A(0; 0) B(4; 0) C(4; 3)        khai báo điểm (tên bắt đầu bằng "_" thì không ghi nhãn)
 *   AB, BC, CA                     đoạn thẳng;  ABCD = đa giác khép kín
 *   đứt MN                         đoạn nét đứt
 *   kích thước AB "15 cm"          mũi tên hai đầu song song AB, ghi chữ (đặt phía ngoài hình)
 *   góc ABC "60°" [r]              cung góc tại B;  vuông ABC = kí hiệu góc vuông tại B
 *   nhãn AB "?"                    chữ ở giữa đoạn AB (không vẽ đoạn)
 *   đất AB / tường AB              gạch chéo dưới đoạn (mặt đất) hoặc bên cạnh (bức tường)
 *   hình cây AB                    hình vật (kho tranh nét) đứng từ chân A lên đỉnh B, xoay theo AB
 *   hình ô tô A                    hình vật đặt đứng tại A (cao 1/4 hình); vật ngoài kho: hình en:teapot A
 */
import type { SceneSpec } from './scene/types'
export type { SceneSpec } from './scene/types'
export { parseScene } from './scene/parse'
export { renderSceneSvg } from './scene/render'

export const SCENE_DEFAULT: SceneSpec = {
  text: [
    '_G(-1; 0) _K(5; 0) A(0; 0) B(4; 0) C(0; 3)',
    'đất _G-_K',
    'tường AC',
    'CB',
    'vuông CAB',
    'góc CBA "60°"',
    'kích thước AB "x"',
    'nhãn CB "5 m"',
    'nhãn AC "?"',
  ].join('\n'),
}

export const SCENE_HELP = [
  {
    group: 'Điểm, đoạn',
    items: [
      { code: 'A(0; 0) B(4; 0)', what: 'Khai báo điểm (trục y hướng lên)' },
      { code: '_M(1; 2)', what: 'Điểm không ghi tên; nối bằng gạch: _M-_N' },
      { code: 'AB, BC [màu lam dày]', what: 'Đoạn thẳng; thêm màu, dày, mảnh' },
      { code: 'ABCD', what: 'Đa giác khép kín' },
      { code: 'đứt MN [màu lục]', what: 'Đoạn nét đứt (nếp gấp, tia nhìn, trục)' },
      { code: 'mũi tên hai đầu đứt AB', what: 'Mũi tên hai đầu đặt trực tiếp giữa A và B' },
    ],
  },
  {
    group: 'Kí hiệu',
    items: [
      { code: 'kích thước AB "15 cm"', what: 'Mũi tên hai đầu, ghi chữ, đặt phía ngoài hình' },
      { code: 'góc ABC "60°" [0.8]', what: 'Cung góc tại đỉnh B (có thể đặt bán kính)' },
      { code: 'vuông ABC', what: 'Kí hiệu góc vuông tại B' },
      { code: 'nhãn AB "?" [dọc | xoay 30]', what: 'Chữ cạnh đoạn AB (thêm dọc để xoay song song đoạn)' },
      { code: 'chấm A [đỏ|trắng] [to|nhỏ]', what: 'Chấm điểm đặc hoặc rỗng (trắng)' },
      { code: 'đất AB / tường AB', what: 'Gạch chéo mặt đất / bức tường' },
    ],
  },
  {
    group: 'Hình vật',
    items: [
      { code: 'hình cây AB', what: 'Cây đứng từ chân A lên ngọn B (cao đúng AB)' },
      { code: 'hình cái thang CB', what: 'Thang dọc đoạn CB, xoay theo độ nghiêng' },
      { code: 'hình người A', what: 'Người đứng tại A; có: toà nhà, cột cờ, hải đăng, thuyền, ô tô…' },
      { code: 'hình en:teapot A', what: 'Vật chưa có trong kho: tên tiếng Anh, vẽ thêm một lần (tốn điểm lần đầu)' },
    ],
  },
  {
    group: 'Hình tự do & đường cong',
    items: [
      { code: 'tròn O 0.6 "Nhãn"', what: 'Vòng tròn tâm O, bán kính 0.6; thêm đứt, tô [đậm|bóng] <màu>, nền' },
      { code: 'elip O 1 0.6 đứt [xoay 30]', what: 'Elip tâm O, hai bán kính; có thể xoay, tô, đặt nền' },
      { code: 'hộp O 2 1 "Nhãn" bo tô xanh', what: 'Hộp tâm O, rộng 2, cao 1; thêm bo, xoay, đứt, tô, nền' },
      { code: 'thoi O 3 1.5 "i ≤ n?"', what: 'Hình thoi tâm O, rộng 3, cao 1.5' },
      { code: 'cung O 4 0 60 "Nhãn"', what: 'Cung tròn tâm O; cung elip O rx ry 180 360 vẽ nửa elip trước/sau' },
      { code: 'quạt O 4 0 60 tô vàng', what: 'Hình quạt tâm O với hai bán kính; thêm đứt, tô <màu>' },
      { code: 'cong A-B-C [kín] [mũi tên]', what: 'Đường cong mượt qua các điểm (3 điểm tạo parabol)' },
      { code: 'vùng mảnh1; mảnh2 tô đậm đen', what: 'Miền kín ghép từ cung / cung elip / cong / đoạn; hỗ trợ tô gạch, tô bóng, mờ' },
      { code: 'ABC tô [đậm|gạch|cầu] đỏ [mờ 0.5] [nền]', what: 'Đa giác/hình tô nhạt, đậm, gạch (chéo/đứng/ngang), khối cầu hoặc bán trong suốt' },
      { code: 'chữ O "$y = f(x)$" [xoay 30]', what: 'Chữ căn giữa tại O; bọc $...$ để in nghiêng chữ toán học; thêm to, đậm, xoay' },
      { code: 'mũi tên AB / khung 520 240', what: 'Mũi tên màu/nét tuỳ chọn; khung W H chỉnh cỡ hình ngang rộng' },
      { code: 'A(x; y; z) / mặt A-B-C-D / lưới 3d', what: 'Chiếu điểm 3D (góc nhìn xiên hoặc az el), xếp lớp mặt che khuất và lưới thiết diện 3D' },
    ],
  },
]
