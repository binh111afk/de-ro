/**
 * Bộ phong cách của chế độ Chuyên nghiệp: nền / khung / hình trang trí vẽ sẵn
 * (public/slide-packs) đặt quanh chữ. Mỗi bộ dựng riêng các bố cục biên tập,
 * giữ nguyên id phần tử (title, kicker, body, item-N-…) để sửa, AI sửa và dựng
 * lại bố cục vẫn đọc được nội dung. Toạ độ viết theo px trên slide 1280×720.
 */
import type { SlideElement } from '@/store/docs'
import type { SlideLayoutContent } from './slideLayouts'

export type SlidePackId = 'co-dien' | 'dan-gian' | 'khoa-hoc' | 'toan' | 'vat-ly' | 'hoa-hoc' | 'tin-hoc' | 'tam-ly' | 'sinh-hoc' | 'ngu-van' | 'dia-li' | 'tieng-anh' | 'kinh-te-phap-luat' | 'lich-su' | 'cong-nghe' | 'nghe-thuat' | 'the-duc' | 'mam-non' | 'sinh-hoat-lop' | 'moi-truong' | 'kinh-doanh' | 'le-hoi' | 'quoc-phong' | 'huong-nghiep' | 'ngoai-ngu' | 'du-lich' | 'dinh-duong' | 'y-te' | 'giao-thong' | 'gia-dinh' | 'trung-tinh' | 'su-do' | 'dia-li-ht' | 'chinh-tri'

export const PACK_COLORS = {
  'co-dien': { background: '#8b0000', fg: '#8b0000', ink: '#8b0000', accent: '#8b0000', muted: '#7a3b2e', surface: '#fdeed3', panel: '#f7e2bd', onAccent: '#fdeed3' },
  'dan-gian': { background: '#faf3e6', fg: '#4a2c1d', ink: '#962a0e', accent: '#b4461a', muted: '#7a5a45', surface: '#fff7e8', panel: '#ffe9b8', onAccent: '#ffffff' },
  'khoa-hoc': { background: '#f7f5ee', fg: '#2c4256', ink: '#173f5f', accent: '#0f7c8c', muted: '#53687a', surface: '#ffffff', panel: '#e2f0ec', onAccent: '#ffffff' },
  toan: { background: '#fbfcff', fg: '#34446b', ink: '#1d3f8f', accent: '#2f6fd6', muted: '#56658a', surface: '#ffffff', panel: '#eef4ff', onAccent: '#ffffff' },
  'vat-ly': { background: '#fbfaf6', fg: '#3d4a68', ink: '#2f3c6e', accent: '#3d6399', muted: '#5f6a85', surface: '#ffffff', panel: '#e4eef8', onAccent: '#ffffff' },
  'sinh-hoc': { background: '#fafaf4', fg: '#3f4a36', ink: '#34603a', accent: '#a5503f', muted: '#66705c', surface: '#ffffff', panel: '#e6f1dd', onAccent: '#ffffff' },
  'hoa-hoc': { background: '#faf9f6', fg: '#5a3a44', ink: '#7a4455', accent: '#4a7573', muted: '#77606a', surface: '#ffffff', panel: '#eaf1ef', onAccent: '#ffffff' },
  'ngu-van': { background: '#fbf8f2', fg: '#4f3a38', ink: '#6d3b4f', accent: '#a04a32', muted: '#76605a', surface: '#ffffff', panel: '#f6e9e0', onAccent: '#ffffff' },
  'dia-li': { background: '#f8faf8', fg: '#35495a', ink: '#1f4e66', accent: '#2c6e63', muted: '#586a74', surface: '#ffffff', panel: '#e1f0ee', onAccent: '#ffffff' },
  'tieng-anh': { background: '#fcfaf7', fg: '#3c4260', ink: '#2d3a6b', accent: '#b23a48', muted: '#646a86', surface: '#ffffff', panel: '#fbe8ea', onAccent: '#ffffff' },
  'kinh-te-phap-luat': { background: '#faf9f5', fg: '#3b475a', ink: '#233a5c', accent: '#8a5a12', muted: '#626b78', surface: '#ffffff', panel: '#f5eddc', onAccent: '#ffffff' },
  'lich-su': { background: '#fbf7ee', fg: '#54432f', ink: '#5a3d24', accent: '#9a4a24', muted: '#74654f', surface: '#ffffff', panel: '#f4e8d2', onAccent: '#ffffff' },
  'cong-nghe': { background: '#f8f9fa', fg: '#39485a', ink: '#243a52', accent: '#b0541a', muted: '#5f6b79', surface: '#ffffff', panel: '#fbeadc', onAccent: '#ffffff' },
  'nghe-thuat': { background: '#fdf9f7', fg: '#4c3d58', ink: '#4a2f66', accent: '#b0386a', muted: '#74647c', surface: '#ffffff', panel: '#fbe6ee', onAccent: '#ffffff' },
  'the-duc': { background: '#f8faf6', fg: '#34493e', ink: '#1f4a38', accent: '#b34a1e', muted: '#5c6d63', surface: '#ffffff', panel: '#e5f2e4', onAccent: '#ffffff' },
  'mam-non': { background: '#fffbf5', fg: '#44506e', ink: '#34508f', accent: '#c2452d', muted: '#6a728a', surface: '#ffffff', panel: '#fdeadf', onAccent: '#ffffff' },
  'sinh-hoat-lop': { background: '#fbf9f4', fg: '#3a4b47', ink: '#234b45', accent: '#b05a14', muted: '#62706c', surface: '#ffffff', panel: '#e3f0ec', onAccent: '#ffffff' },
  'moi-truong': { background: '#f7faf4', fg: '#37493e', ink: '#25503a', accent: '#2f7a45', muted: '#5d6e60', surface: '#ffffff', panel: '#e4f2df', onAccent: '#ffffff' },
  'kinh-doanh': { background: '#f9f9fb', fg: '#3b4263', ink: '#232c55', accent: '#3d4fc4', muted: '#646a86', surface: '#ffffff', panel: '#e8ebfb', onAccent: '#ffffff' },
  'le-hoi': { background: '#fffaf4', fg: '#593a3a', ink: '#8a1f2d', accent: '#b23020', muted: '#7a625e', surface: '#ffffff', panel: '#fde8e0', onAccent: '#ffffff' },
  'quoc-phong': { background: '#f9f8f1', fg: '#434a39', ink: '#2f4a2a', accent: '#a8301f', muted: '#676c5c', surface: '#ffffff', panel: '#e9eedc', onAccent: '#ffffff' },
  'huong-nghiep': { background: '#fbf9f5', fg: '#3c4a52', ink: '#1f4554', accent: '#b4531c', muted: '#61707a', surface: '#ffffff', panel: '#e2f0f3', onAccent: '#ffffff' },
  'ngoai-ngu': { background: '#fbf8f6', fg: '#493f58', ink: '#4a2f6b', accent: '#b03a5b', muted: '#6f667c', surface: '#ffffff', panel: '#eee8f7', onAccent: '#ffffff' },
  'du-lich': { background: '#fbf9f4', fg: '#3b4a53', ink: '#1f4a63', accent: '#b4501f', muted: '#606e76', surface: '#ffffff', panel: '#e2f0f6', onAccent: '#ffffff' },
  'dinh-duong': { background: '#fcf9f3', fg: '#4f3f36', ink: '#7a2e1e', accent: '#b23a24', muted: '#766860', surface: '#ffffff', panel: '#fbeade', onAccent: '#ffffff' },
  'y-te': { background: '#f7faf9', fg: '#394a4a', ink: '#1d4f4d', accent: '#b83a2c', muted: '#5f6f6f', surface: '#ffffff', panel: '#e0f1ef', onAccent: '#ffffff' },
  'giao-thong': { background: '#fafaf7', fg: '#40465a', ink: '#27406b', accent: '#b83a2c', muted: '#656b7a', surface: '#ffffff', panel: '#e6eefa', onAccent: '#ffffff' },
  'gia-dinh': { background: '#fcf8f5', fg: '#51403f', ink: '#6e3340', accent: '#a8403c', muted: '#77696a', surface: '#ffffff', panel: '#fbe8e6', onAccent: '#ffffff' },
  'trung-tinh': { background: '#fbf9f4', fg: '#3b4a58', ink: '#27405a', accent: '#a84e2c', muted: '#5f6c77', surface: '#ffffff', panel: '#e4eef0', onAccent: '#ffffff' },
  'su-do': { background: '#f1efea', fg: '#6b1a24', ink: '#760015', accent: '#760015', muted: '#7d4a50', surface: '#ffffff', panel: '#eadfdc', onAccent: '#ffffff' },
  'dia-li-ht': { background: '#fef8ee', fg: '#2f3a1c', ink: '#546826', accent: '#e3bf27', muted: '#5d6648', surface: '#ffffff', panel: '#ece7d2', onAccent: '#2f3a1c' },
  'chinh-tri': { background: '#fffef6', fg: '#3a2a2a', ink: '#a92f31', accent: '#a92f31', muted: '#7a4a48', surface: '#ffffff', panel: '#f8ebe4', onAccent: '#fffef6' },
  'tin-hoc': { background: '#f8f7fc', fg: '#3a3560', ink: '#241d4d', accent: '#5a3ee0', muted: '#635d85', surface: '#ffffff', panel: '#ece8fd', onAccent: '#ffffff' },
  'tam-ly': { background: '#fbf4ec', fg: '#53392f', ink: '#5a2c1c', accent: '#a8532f', muted: '#7d6257', surface: '#fffaf5', panel: '#f8e4da', onAccent: '#ffffff' },
} as const

const CREAM = '#fdeed3'

/** kích thước gốc của hình trang trí (để giữ đúng tỉ lệ khi chỉ định bề rộng) */
const ART: Record<string, [number, number]> = {
  'co-dien/canh-mai': [800, 394], 'co-dien/canh-tung': [800, 281], 'co-dien/chim-en': [800, 609], 'co-dien/chim-hac': [473, 800],
  'co-dien/goc-hoa-van': [800, 659], 'co-dien/hoa-sen': [663, 800], 'co-dien/mat-troi': [785, 800], 'co-dien/may': [800, 152], 'co-dien/nui': [800, 236],
  'dan-gian/canh-tre': [800, 529], 'dan-gian/chuon-chuon': [800, 527], 'dan-gian/den-long': [653, 800], 'dan-gian/dieu': [800, 503],
  'dan-gian/hoa-sen': [800, 673], 'dan-gian/mai-dinh': [800, 382], 'dan-gian/may': [800, 136], 'dan-gian/non-la': [800, 672], 'dan-gian/sach': [800, 658],
  'khoa-hoc/binh-tam-giac': [358, 540], 'khoa-hoc/bong-den': [480, 540], 'khoa-hoc/dna': [221, 540], 'khoa-hoc/hanh-tinh': [540, 315],
  'khoa-hoc/kinh-hien-vi': [299, 540], 'khoa-hoc/la-cay': [379, 540], 'khoa-hoc/nam-cham': [402, 540], 'khoa-hoc/nguyen-tu': [540, 529],
  'khoa-hoc/ong-nghiem': [540, 450], 'khoa-hoc/te-bao': [484, 540],
  'toan/ban-tinh': [503, 540], 'toan/but-chi': [477, 540], 'toan/compa': [395, 540], 'toan/dau-phep-tinh': [540, 524], 'toan/e-ke': [533, 540],
  'toan/hinh-tru-lang-tru': [540, 310], 'toan/khoi-hinh': [540, 205], 'toan/may-tinh': [423, 540], 'toan/thuoc-do-goc': [540, 323], 'toan/thuoc-ke': [539, 540],
  // dot 2
  'vat-ly/con-lac': [488, 540], 'vat-ly/hanh-tinh': [540, 363], 'vat-ly/hat-1': [300, 322], 'vat-ly/hat-2': [218, 227], 'vat-ly/hat-3': [216, 215],
  'vat-ly/kinh-thien-van': [489, 540], 'vat-ly/lo-xo': [331, 540], 'vat-ly/mang': [540, 229], 'vat-ly/nam-cham': [540, 455], 'vat-ly/nguyen-tu': [509, 540],
  'hoa-hoc/binh-cau': [358, 540], 'hoa-hoc/binh-tam-giac': [416, 540], 'hoa-hoc/dai-te-bao': [540, 229], 'hoa-hoc/dna': [252, 540], 'hoa-hoc/hat-1': [297, 278],
  'hoa-hoc/hat-2': [272, 250], 'hoa-hoc/hat-3': [221, 207], 'hoa-hoc/nguyen-tu': [540, 430], 'hoa-hoc/ong-nghiem-doi': [494, 540], 'hoa-hoc/phan-tu': [540, 471],
  'tin-hoc/banh-rang': [540, 493], 'tin-hoc/chuot-ban-phim': [540, 347], 'tin-hoc/dam-may': [540, 434], 'tin-hoc/dien-thoai': [319, 540], 'tin-hoc/khien-bao-mat': [463, 540],
  'tin-hoc/mang-luoi': [514, 540], 'tin-hoc/may-chu': [352, 540], 'tin-hoc/may-tinh-xach-tay': [540, 540], 'tin-hoc/robot': [373, 540], 'tin-hoc/vi-mach': [540, 496],
  'tam-ly/bong-thoai': [540, 402], 'tam-ly/guong': [310, 540], 'tam-ly/mam-cay': [346, 540], 'tam-ly/manh-ghep': [540, 315], 'tam-ly/may-mat-troi': [540, 358],
  'tam-ly/nao-cay': [419, 540], 'tam-ly/so-tay': [540, 402], 'tam-ly/thien': [484, 540], 'tam-ly/trai-tim': [470, 540], 'tam-ly/tro-chuyen': [540, 435],
  'sinh-hoc/dai-te-bao': [540, 409], 'sinh-hoc/dna': [250, 540], 'sinh-hoc/hat-1': [269, 250], 'sinh-hoc/hat-2': [312, 164], 'sinh-hoc/hat-3': [290, 178],
  'sinh-hoc/kinh-hien-vi': [338, 540], 'sinh-hoc/mam-cay': [264, 540], 'sinh-hoc/no-ron': [528, 540], 'sinh-hoc/te-bao-dong-vat': [540, 536], 'sinh-hoc/te-bao-thuc-vat': [540, 532],
  'ngu-van/but-long': [109, 540], 'ngu-van/chong-sach': [540, 460], 'ngu-van/den-dau': [196, 540], 'ngu-van/hat-1': [232, 112], 'ngu-van/hat-2': [166, 136],
  'ngu-van/hat-3': [176, 112], 'ngu-van/hoa-sen': [519, 540], 'ngu-van/lo-muc': [362, 540], 'ngu-van/mang': [540, 229], 'ngu-van/sach-mo': [540, 263],
  'dia-li/ban-do': [540, 249], 'dia-li/hai-dang': [265, 540], 'dia-li/hat-1': [241, 125], 'dia-li/hat-2': [191, 112], 'dia-li/hat-3': [129, 125],
  'dia-li/khinh-khi-cau': [396, 540], 'dia-li/la-ban': [418, 540], 'dia-li/mang': [540, 229], 'dia-li/qua-dia-cau': [440, 540], 'dia-li/thuyen-buom': [528, 540],
  'tieng-anh/bong-thoai': [540, 482], 'tieng-anh/bot-dien-thoai': [253, 540], 'tieng-anh/but-chi': [188, 540], 'tieng-anh/hat-1': [298, 272], 'tieng-anh/hat-2': [222, 209],
  'tieng-anh/hat-3': [146, 142], 'tieng-anh/mang': [540, 229], 'tieng-anh/tach-tra': [454, 540], 'tieng-anh/tai-nghe': [540, 482], 'tieng-anh/thap-dong-ho': [125, 540],
  'kinh-te-phap-luat/bieu-do': [540, 424], 'kinh-te-phap-luat/bua': [540, 389], 'kinh-te-phap-luat/can-cong-ly': [540, 407], 'kinh-te-phap-luat/cay-tien': [237, 540], 'kinh-te-phap-luat/hat-1': [291, 200],
  'kinh-te-phap-luat/hat-2': [243, 172], 'kinh-te-phap-luat/hat-3': [219, 147], 'kinh-te-phap-luat/heo-dat': [540, 480], 'kinh-te-phap-luat/khien': [482, 540], 'kinh-te-phap-luat/mang': [540, 229],
  'lich-su/binh-gom': [505, 540], 'lich-su/cot-da': [227, 540], 'lich-su/dong-ho-cat': [279, 540], 'lich-su/hat-1': [275, 232], 'lich-su/hat-2': [269, 200],
  'lich-su/hat-3': [203, 202], 'lich-su/kim-tu-thap': [540, 226], 'lich-su/mang': [540, 229], 'lich-su/trong-dong': [539, 540],
  'cong-nghe/banh-rang': [540, 382], 'cong-nghe/co-le': [319, 540], 'cong-nghe/den-ban': [298, 540], 'cong-nghe/drone': [540, 492], 'cong-nghe/hat-1': [192, 247],
  'cong-nghe/hat-2': [173, 158], 'cong-nghe/hat-3': [203, 147], 'cong-nghe/hop-dung-cu': [489, 540], 'cong-nghe/mang': [540, 229], 'cong-nghe/robot': [467, 540],
  'nghe-thuat/bang-mau': [540, 421], 'nghe-thuat/co-ve': [114, 540], 'nghe-thuat/dan-guitar': [238, 540], 'nghe-thuat/gia-ve': [277, 540], 'nghe-thuat/hat-1': [151, 291],
  'nghe-thuat/hat-2': [169, 274], 'nghe-thuat/hat-3': [208, 225], 'nghe-thuat/khung-tranh': [540, 431], 'nghe-thuat/mang': [540, 229], 'nghe-thuat/trong': [540, 426],
  'the-duc/bong-da': [539, 540], 'the-duc/cup-vang': [540, 501], 'the-duc/hat-1': [253, 258], 'the-duc/hat-2': [247, 253], 'the-duc/hat-3': [150, 149],
  'the-duc/huy-chuong': [351, 540], 'the-duc/mang': [540, 229], 'the-duc/vot-cau-long': [304, 540], 'the-duc/xe-dap': [540, 305],
  'mam-non/but-sap': [167, 540], 'mam-non/cau-vong': [540, 246], 'mam-non/gau-bong': [511, 540], 'mam-non/hat-1': [256, 246], 'mam-non/hat-2': [233, 231],
  'mam-non/hat-3': [247, 212], 'mam-non/khoi-go': [330, 540], 'mam-non/mang': [540, 229], 'mam-non/ngua-go': [540, 510], 'mam-non/qua-bong': [525, 540],
  'sinh-hoat-lop/ba-lo': [540, 539], 'sinh-hoat-lop/chong-vo': [404, 540], 'sinh-hoat-lop/chuong': [257, 540], 'sinh-hoat-lop/dong-ho': [528, 540], 'sinh-hoat-lop/hat-1': [165, 151],
  'sinh-hoat-lop/hat-2': [154, 111], 'sinh-hoat-lop/hat-3': [112, 149], 'sinh-hoat-lop/mang': [540, 229], 'sinh-hoat-lop/thuoc-but': [72, 540], 'sinh-hoat-lop/truong-hoc': [540, 489],
  'moi-truong/binh-tuoi': [540, 280], 'moi-truong/canh-tre': [263, 540], 'moi-truong/cay-xanh': [395, 540], 'moi-truong/hat-1': [149, 144], 'moi-truong/hat-2': [141, 136],
  'moi-truong/hat-3': [116, 154], 'moi-truong/mang': [540, 229], 'moi-truong/thung-tai-che': [454, 540], 'moi-truong/trai-dat': [425, 540], 'moi-truong/tua-bin': [266, 540],
  'kinh-doanh/bang-trinh-bay': [270, 540], 'kinh-doanh/bia-ten': [540, 482], 'kinh-doanh/but-may': [112, 540], 'kinh-doanh/ca-phe': [540, 423], 'kinh-doanh/hat-1': [226, 222],
  'kinh-doanh/hat-2': [206, 202], 'kinh-doanh/hat-3': [141, 206], 'kinh-doanh/mang': [540, 229], 'kinh-doanh/may-tinh': [540, 362], 'kinh-doanh/ten-lua': [209, 540],
  'le-hoi/banh-kem': [441, 540], 'le-hoi/bo-hoa': [484, 540], 'le-hoi/bong-bay': [327, 540], 'le-hoi/den-long': [121, 540], 'le-hoi/hat-1': [225, 202],
  'le-hoi/hat-2': [218, 205], 'le-hoi/hat-3': [219, 202], 'le-hoi/hop-qua': [424, 540], 'le-hoi/mang': [540, 229], 'le-hoi/trong-hoi': [465, 540],
  'quoc-phong/ba-lo-linh': [511, 540], 'quoc-phong/cot-moc': [280, 540], 'quoc-phong/gay-tre': [399, 540], 'quoc-phong/hat-1': [157, 154], 'quoc-phong/hat-2': [196, 127],
  'quoc-phong/hat-3': [172, 163], 'quoc-phong/la-co': [242, 540], 'quoc-phong/leu-trai': [540, 305], 'quoc-phong/mang': [540, 229], 'quoc-phong/mu-coi': [540, 342],
  'huong-nghiep/bien-chi-duong': [333, 540], 'huong-nghiep/cap-sach': [540, 496], 'huong-nghiep/chong-sach-mu': [391, 540], 'huong-nghiep/hat-1': [172, 172], 'huong-nghiep/hat-2': [151, 140],
  'huong-nghiep/hat-3': [142, 163], 'huong-nghiep/la-ban': [533, 540], 'huong-nghiep/mang': [540, 229], 'huong-nghiep/mu-bao-ho': [540, 346], 'huong-nghiep/thuoc-ke': [267, 540],
  'ngoai-ngu/bong-thoai': [540, 385], 'ngoai-ngu/canh-anh-dao': [311, 540], 'ngoai-ngu/cong-torii': [540, 487], 'ngoai-ngu/den-long': [330, 540], 'ngoai-ngu/hat-1': [232, 221],
  'ngoai-ngu/hat-2': [206, 179], 'ngoai-ngu/hat-3': [258, 182], 'ngoai-ngu/mang': [540, 229], 'ngoai-ngu/qua-cau': [540, 375], 'ngoai-ngu/thap-eiffel': [321, 540],
  'du-lich/ban-do-ghim': [540, 359], 'du-lich/cay-dua': [308, 540], 'du-lich/hat-1': [252, 181], 'du-lich/hat-2': [245, 228], 'du-lich/hat-3': [198, 192],
  'du-lich/mai-cheo': [192, 540], 'du-lich/mang': [540, 229], 'du-lich/may-anh': [540, 402], 'du-lich/thuyen-thung': [540, 296], 'du-lich/vali': [540, 497],
  'dinh-duong/binh-sua': [540, 523], 'dinh-duong/dau-bep': [364, 540], 'dinh-duong/dia-com': [540, 231], 'dinh-duong/gio-rau-qua': [540, 440], 'dinh-duong/hat-1': [218, 212],
  'dinh-duong/hat-2': [210, 226], 'dinh-duong/hat-3': [186, 220], 'dinh-duong/mang': [540, 229], 'dinh-duong/muong-go': [360, 540], 'dinh-duong/noi-canh': [540, 499],
  'y-te/chai-thuoc': [520, 540], 'y-te/hat-1': [264, 175], 'y-te/hat-2': [157, 212], 'y-te/hat-3': [228, 138], 'y-te/mang': [540, 229],
  'y-te/nhiet-ke': [192, 540], 'y-te/ong-nghe': [266, 540], 'y-te/rang-cuoi': [540, 409], 'y-te/trai-tim-nhip': [540, 462], 'y-te/tui-cuu-thuong': [540, 408],
  'giao-thong/bien-bao': [149, 540], 'giao-thong/den-giao-thong': [105, 540], 'giao-thong/hat-1': [239, 241], 'giao-thong/hat-2': [230, 241], 'giao-thong/hat-3': [235, 227],
  'giao-thong/mang': [540, 229], 'giao-thong/mu-bao-hiem': [501, 540], 'giao-thong/rao-chan': [190, 540], 'giao-thong/xe-buyt': [540, 321], 'giao-thong/xe-dap': [540, 367],
  'gia-dinh/am-tra': [540, 381], 'gia-dinh/cay-gia-dinh': [297, 540], 'gia-dinh/den-cay': [384, 540], 'gia-dinh/hat-1': [235, 223], 'gia-dinh/hat-2': [213, 189],
  'gia-dinh/hat-3': [184, 184], 'gia-dinh/khan-len': [326, 540], 'gia-dinh/khung-anh': [540, 406], 'gia-dinh/mang': [540, 229], 'gia-dinh/ngoi-nha': [540, 458],
  'trung-tinh/bong-den': [506, 540], 'trung-tinh/bong-thoai': [540, 512], 'trung-tinh/but-chi': [144, 540], 'trung-tinh/hat-1': [254, 161], 'trung-tinh/hat-2': [158, 204],
  'trung-tinh/hat-3': [208, 207], 'trung-tinh/kinh-lup': [306, 540], 'trung-tinh/mang': [540, 229], 'trung-tinh/may-bay-giay': [540, 275], 'trung-tinh/ngoi-sao': [540, 523],
  'su-do/nui-song': [1600, 388], 'su-do/dai-song': [1600, 70], 'su-do/cuon-thu': [840, 449], 'su-do/sach-but': [840, 529], 'su-do/ban-tac-chien': [1600, 437],
  'chinh-tri/tem-kem': [820, 1016], 'chinh-tri/tem-do': [820, 1016], 'chinh-tri/sen': [626, 900], 'chinh-tri/sach-but': [900, 862], 'chinh-tri/sen-kem': [626, 900],
  'chinh-tri/bua-liem': [600, 524], 'chinh-tri/sach-kem': [900, 862],
  'chinh-tri/bo-cau-do': [900, 660], 'chinh-tri/lua-banh-rang-do': [843, 900],
  'chinh-tri/bac-ho': [560, 718], 'chinh-tri/mac': [560, 718], 'chinh-tri/le-nin': [560, 718],
 
  // het dot 2
}

type Box = Pick<SlideElement, 'x' | 'y' | 'w' | 'h'>
type Text = (id: string, value: string | undefined, box: Box, style: Partial<SlideElement>, minScale?: number) => SlideElement | null

const box = (x: number, y: number, w: number, h: number): Box => ({ x: x / 12.8, y: y / 7.2, w: w / 12.8, h: h / 7.2 })
/** cỡ chữ px (slide 1280) → cqw */
const fs = (px: number) => px / 12.8

const image = (id: string, src: string | undefined, b: Box, extra: Partial<SlideElement> = {}): SlideElement => ({
  id, type: 'image', src, ...b, radius: 0, border: 0, shadowLevel: 0, ...extra,
})

/** hình trang trí, cao theo tỉ lệ gốc */
function art(n: number, name: string, x: number, y: number, w: number, extra: Partial<SlideElement> = {}): SlideElement {
  const [aw, ah] = ART[name]
  return image(`decor-kit-${n}`, `/slide-packs/${name}.png`, box(x, y, w, (w * ah) / aw), { decor: true, ...extra })
}

const full = (name: string): SlideElement =>
  image('decor-kit-0', `/slide-packs/${name}.png`, box(0, 0, 1280, 720), { decor: true, locked: true })

const list = (value?: string[]) => (value ?? []).map((v) => String(v ?? '').trim()).filter(Boolean)
const upper = (text?: string) => text?.trim().toLocaleUpperCase('vi') || undefined

const rowsOf = (c: SlideLayoutContent) => (c.stats ?? [])
  .map((s) => ({ value: String(s.value ?? '').trim(), label: String(s.label ?? '').trim() }))
  .filter((s) => s.value || s.label)
  .slice(0, 5)

/** mép dưới an toàn (px trên khung 720) khi slide có dòng nguồn */
const FLOOR = 650

/**
 * Nhiều ý "tên + mô tả" chia lưới cột (3 → một hàng, 4 → 2×2, 5 → 3 + 2) để chữ luôn đủ to,
 * thay cho danh sách hàng ngang bị ép nhỏ.
 */
function gridRows(
  rows: Array<{ value: string; label: string }>,
  { title, body }: Kit,
  o: { top: number; bottom: number; color: (i: number) => string; text: string },
): Built {
  const perRow = rows.length === 4 ? 2 : Math.min(rows.length, 3)
  const many = rows.length > 3
  const w = perRow === 3 ? 366 : 420
  const gap = perRow === 3 ? 26 : 56
  const rowH = (o.bottom - o.top) / (many ? 2 : 1)
  const headH = many ? 66 : 96
  return rows.flatMap((row, i) => {
    const line = Math.floor(i / perRow)
    const inLine = Math.min(perRow, rows.length - line * perRow)
    const x = 640 - (inLine * w + (inLine - 1) * gap) / 2 + (i % perRow) * (w + gap)
    const y = o.top + line * rowH
    return [
      title(`item-${i + 1}-value`, row.value, box(x, y, w, headH), many ? 36 : 52, o.color(i), { align: 'center', valign: 'middle', caps: true, lineHeight: 1.1 }),
      body(`item-${i + 1}-label`, row.label, box(x, y + headH + (many ? 0 : 8), w, rowH - headH - (many ? 2 : 8)), rows.length === 4 ? 30 : many ? 28 : 34, o.text, { align: 'center', lineHeight: 1.3 }),
    ]
  })
}

const paragraphs = (c: SlideLayoutContent) => {
  const bullets = list(c.bullets)
  return (bullets.length ? bullets : list(c.body?.split('\n'))).join('\n\n')
}

const statement = (c: SlideLayoutContent) =>
  c.body?.trim() || c.quote?.trim() || list(c.bullets).join(' ') || c.title?.trim() || ''

interface Kit {
  text: Text
  title: (id: string, value: string | undefined, b: Box, px: number, color: string, extra?: Partial<SlideElement>) => SlideElement | null
  body: (id: string, value: string | undefined, b: Box, px: number, color: string, extra?: Partial<SlideElement>) => SlideElement | null
}

function kitOf(text: Text): Kit {
  return {
    text,
    title: (id, value, b, px, color, extra) =>
      // tiêu đề slide của mọi bộ doodle đều in hoa
      text(id, value, b, { variant: 'title', fontWeight: 800, lineHeight: 1.15, valign: 'top', fontSize: fs(px), textColor: color, caps: id === 'title', ...extra }, 0.4),
    body: (id, value, b, px, color, extra) =>
      text(id, value, b, { variant: 'body', lineHeight: 1.45, valign: 'top', fontSize: fs(px), textColor: color, ...extra }, 0.55),
  }
}

type Built = Array<SlideElement | null>

/* ------------------------------------------------------------------ *
 * Cổ điển đỏ kem: khung tem thư
 * ------------------------------------------------------------------ */
function coDien(id: string, c: SlideLayoutContent, { title, body }: Kit): Built | null {
  const red = PACK_COLORS['co-dien'].ink
  switch (id) {
    case 'photo-full':
      if (c.image) return [
        full('co-dien/tem-day'),
        image('image-1', c.image, box(660, 110, 510, 500), { imagePosition: { x: c.focusX ?? 50, y: c.focusY ?? 40 }, crop: c.imageCrop, border: 6, borderColor: red }),
        art(1, 'co-dien/chim-en', 540, 50, 170),
        body('kicker', upper(c.kicker), box(100, 91, 520, 58), 24, red, { fontWeight: 700 }),
        title('title', c.title, box(100, 160, 520, 280), 68, red, { valign: 'middle' }),
        body('subtitle', c.subtitle, box(100, 470, 520, 140), 26, red),
      ]
      return [
        full('co-dien/tem-bia'),
        art(1, 'co-dien/mat-troi', 830, 50, 300),
        art(2, 'co-dien/nui', 380, 470, 700, { opacity: 0.9 }),
        art(3, 'co-dien/may', 730, 260, 260),
        art(4, 'co-dien/chim-hac', 850, 80, 378),
        body('kicker', upper(c.kicker), box(100, 87, 600, 58), 24, red, { fontWeight: 700 }),
        title('title', c.title, box(96, 150, 640, 290), 96, red, { valign: 'middle' }),
        body('subtitle', c.subtitle, box(100, 468, 520, 140), 28, red),
      ]
    case 'manifesto': {
      const text = statement(c)
      return [
        full('co-dien/tem-tren'),
        art(1, 'co-dien/chim-en', 1130, 6, 130),
        art(2, 'co-dien/may', 60, 282, 260),
        body('kicker', upper(c.kicker), box(140, 31, 1000, 54), 22, red, { fontWeight: 700, align: 'center' }),
        title('body', text, box(160, 84, 960, 230), text.length > 150 ? 42 : text.length > 80 ? 52 : 68, red, { align: 'center', valign: 'middle' }),
        body('author', c.author, box(190, 420, 900, 120), 28, CREAM, { align: 'center' }),
      ]
    }
    case 'editorial-text':
      return [
        full('co-dien/tem-ben'),
        art(1, 'co-dien/canh-mai', 880, 500, 340),
        // nhãn dựng dọc bên trái: hộp ngang xoay 90° quanh tâm (125, 360)
        title('kicker', upper(c.kicker), box(-165, 315, 580, 90), 54, CREAM, { align: 'center', valign: 'middle', rotation: -90, letterSpacing: 0.02 }),
        title('title', c.title, box(310, 66, 870, 170), 52, red, { valign: 'middle' }),
        body('body', paragraphs(c), box(310, 262, 640, 390), 27, red),
      ]
    case 'rules': {
      const rows = rowsOf(c)
      if (!rows.length) return []
      const h = Math.min(130, 390 / rows.length)
      if (rows.length > 3) return [
        full('co-dien/tem-day'),
        body('kicker', upper(c.kicker), box(96, 57, 700, 54), 22, red, { fontWeight: 700 }),
        title('title', c.title, box(96, 104, 1000, 130), 52, red, { valign: 'middle' }),
        ...gridRows(rows, { title, body } as Kit, { top: 244, bottom: FLOOR, color: () => red, text: red }),
      ]
      return [
        full('co-dien/tem-day'),
        art(1, 'co-dien/canh-tung', 860, 36, 360),
        body('kicker', upper(c.kicker), box(96, 57, 700, 54), 22, red, { fontWeight: 700 }),
        title('title', c.title, box(96, 104, 780, 130), 52, red, { valign: 'middle' }),
        ...rows.flatMap((row, i) => {
          const y = 256 + i * h
          return [
            { id: `divider-${i + 1}`, type: 'shape', shape: 'rect', fill: red, opacity: 0.35, border: 0, shadowLevel: 0, ...box(100, y, 1080, 2) } as SlideElement,
            title(`item-${i + 1}-value`, row.value, box(96, y + 4, 240, h - 8), 38, red, { valign: 'middle' }),
            body(`item-${i + 1}-label`, row.label, box(360, y + 4, 820, h - 8), 26, red, { valign: 'middle', lineHeight: 1.3 }),
          ]
        }),
      ]
    }
    case 'bignum':
      return [
        full('co-dien/tem-day'),
        c.image
          ? image('image-1', c.image, box(730, 110, 440, 500), { imagePosition: { x: c.focusX ?? 50, y: c.focusY ?? 40 }, crop: c.imageCrop, border: 6, borderColor: red })
          : art(1, 'co-dien/hoa-sen', 830, 220, 340),
        art(2, 'co-dien/chim-en', c.image ? 620 : 990, 50, 150),
        body('kicker', upper(c.kicker), box(100, 81, 560, 58), 24, red, { fontWeight: 700 }),
        title('bignum-value', c.value, box(96, 140, 600, 270), 190, red, { valign: 'middle', lineHeight: 1 }),
        title('bignum-label', c.label, box(100, 418, 580, 104), 40, red),
        body('subtitle', c.subtitle, box(100, 526, 590, FLOOR - 526), 28, red, { lineHeight: 1.3 }),
      ]
    default:
      return null
  }
}

/* ------------------------------------------------------------------ *
 * Dân gian: giấy kẻ ô, màu nước
 * ------------------------------------------------------------------ */
function danGian(id: string, c: SlideLayoutContent, { title, body }: Kit): Built | null {
  const { ink, fg } = PACK_COLORS['dan-gian']
  const paper = full('dan-gian/giay-o')
  const blob = (x: number, y: number, size: number): SlideElement =>
    ({ id: 'decor-kit-9', type: 'shape', shape: 'ellipse', fill: '#ffe2a8', border: 0, shadowLevel: 0, decor: true, ...box(x, y, size, size) })
  const photo = (b: Box, extra: Partial<SlideElement> = {}) =>
    image('image-1', c.image!, b, { imagePosition: { x: c.focusX ?? 50, y: c.focusY ?? 40 }, crop: c.imageCrop, ...extra })
  switch (id) {
    case 'photo-full':
      return [
        paper,
        ...(c.image
          ? [blob(640, 50, 640), photo(box(700, 110, 520, 520), { shape: 'ellipse' }), art(1, 'dan-gian/canh-tre', 990, -40, 330)]
          : [art(1, 'dan-gian/may', -80, -20, 700, { opacity: 0.85 }), art(2, 'dan-gian/mai-dinh', 590, 400, 700), art(3, 'dan-gian/canh-tre', 910, -40, 400)]),
        art(4, 'dan-gian/chuon-chuon', 530, 90, 150),
        body('kicker', upper(c.kicker), box(100, 161, 540, 62), 28, fg, { fontWeight: 800 }),
        title('title', c.title, box(96, 226, 600, 250), c.image ? 70 : 84, ink, { valign: 'middle' }),
        body('subtitle', c.subtitle, box(100, 496, 480, 130), 28, fg),
      ]
    case 'manifesto': {
      const text = statement(c)
      return [
        paper,
        { id: 'decor-kit-8', type: 'shape', shape: 'round', fill: '#ffdca4', radius: 32, border: 0, shadowLevel: 0, decor: true, ...box(160, 140, 960, 440) },
        art(1, 'dan-gian/canh-tre', -40, -40, 400, { flipX: true }),
        art(2, 'dan-gian/hoa-sen', 940, 450, 330),
        art(3, 'dan-gian/chuon-chuon', 940, 60, 140),
        body('kicker', upper(c.kicker), box(240, 169, 800, 54), 24, fg, { fontWeight: 800, align: 'center' }),
        title('body', text, box(230, 226, 820, 260), text.length > 150 ? 40 : text.length > 80 ? 50 : 66, ink, { align: 'center', valign: 'middle' }),
        body('author', c.author, box(260, 502, 760, 56), 24, fg, { align: 'center' }),
      ]
    }
    case 'editorial-text': {
      // đổi hình theo độ dài tiêu đề để hai slide chữ không giống hệt nhau
      const kite = (c.title?.length ?? 0) % 2 === 0
      return [
        paper,
        blob(800, 20, 700),
        ...(kite
          ? [art(1, 'dan-gian/dieu', 740, 160, 500), art(2, 'dan-gian/may', 760, 650, 520)]
          : [art(1, 'dan-gian/den-long', 880, -10, 290), art(2, 'dan-gian/non-la', 850, 420, 360)]),
        body('kicker', upper(c.kicker), box(96, 61, 640, 54), 24, fg, { fontWeight: 800 }),
        title('title', c.title, box(96, 112, 640, 170), 56, ink, { valign: 'middle' }),
        // bốn ý trở lên thì bỏ dòng trống giữa các ý để chữ không bị thu nhỏ
        body('body', list(c.bullets).length > 3 ? list(c.bullets).join('\n') : paragraphs(c), box(100, 296, 640, FLOOR - 296), 28, fg, { lineHeight: 1.35 }),
      ]
    }
    case 'rules': {
      const rows = rowsOf(c)
      if (!rows.length) return []
      const head = [
        paper,
        art(1, 'dan-gian/sach', 1030, 0, 220),
        art(2, 'dan-gian/chuon-chuon', 20, 10, 100, { flipX: true }),
        body('kicker', upper(c.kicker), box(90, 49, 700, 54), 22, fg, { fontWeight: 800 }),
        title('title', c.title, box(90, 98, 920, 140), 54, ink, { valign: 'middle' }),
      ]
      // ba ý trở xuống: thẻ viền lượn; nhiều hơn: danh sách hàng ngang
      if (rows.length <= 3) {
        const colors = ['the-vang', 'the-xanh', 'the-tim']
        const left = 640 - (rows.length * 360 + (rows.length - 1) * 30) / 2
        return [...head, ...rows.flatMap((row, i) => {
          const x = left + i * 390
          return [
            image(`decor-kit-${3 + i}`, `/slide-packs/dan-gian/${colors[i]}.png`, box(x, 270, 360, 360), { decor: true }),
            title(`item-${i + 1}-value`, row.value, box(x + 24, 310, 312, 90), 36, ink, { align: 'center', valign: 'middle' }),
            body(`item-${i + 1}-label`, row.label, box(x + 28, 412, 304, 190), 26, fg, { align: 'center' }),
          ]
        })]
      }
      return [...head, ...gridRows(rows, { title, body } as Kit, { top: 244, bottom: FLOOR, color: () => ink, text: fg })]
    }
    case 'bignum':
      return [
        paper,
        blob(720, 80, 560),
        c.image ? photo(box(770, 130, 460, 460), { shape: 'ellipse' }) : art(1, 'dan-gian/non-la', 800, 170, 420),
        art(2, 'dan-gian/chuon-chuon', 620, 40, 140),
        body('kicker', upper(c.kicker), box(100, 81, 560, 58), 24, fg, { fontWeight: 800 }),
        title('bignum-value', c.value, box(96, 140, 600, 270), 180, ink, { valign: 'middle', lineHeight: 1 }),
        title('bignum-label', c.label, box(100, 418, 580, 104), 40, fg),
        body('subtitle', c.subtitle, box(100, 526, 590, FLOOR - 526), 28, fg, { lineHeight: 1.3 }),
      ]
    default:
      return null
  }
}

/* ------------------------------------------------------------------ *
 * Các bộ theo môn: chung một khung bố cục, mỗi bộ chỉ khai báo màu,
 * kiểu thẻ và chỗ đặt hình. Thêm bộ mới = thêm một mục vào STUDY.
 * ------------------------------------------------------------------ */
type StudyId = 'khoa-hoc' | 'toan' | 'vat-ly' | 'hoa-hoc' | 'tin-hoc' | 'tam-ly' | 'sinh-hoc' | 'ngu-van' | 'dia-li' | 'tieng-anh' | 'kinh-te-phap-luat' | 'lich-su' | 'cong-nghe' | 'nghe-thuat' | 'the-duc' | 'mam-non' | 'sinh-hoat-lop' | 'moi-truong' | 'kinh-doanh' | 'le-hoi' | 'quoc-phong' | 'huong-nghiep' | 'ngoai-ngu' | 'du-lich' | 'dinh-duong' | 'y-te' | 'giao-thong' | 'gia-dinh' | 'trung-tinh'

/** hình đặt gọn trong một ô: [tên, x, y, rộng, cao] (px trên slide 1280×720) */
type Slot = [string, number, number, number, number]

interface StudyStyle {
  /** màu luân phiên cho số thứ tự và thẻ, kèm màu chữ trên từng màu */
  cycle: string[]
  onCycle: string[]
  /** outline: viền màu; strip: dải màu trên; window: thanh cửa sổ; tint: nền pha nhạt */
  cards: 'outline' | 'strip' | 'window' | 'tint'
  tints?: string[]
  card: string
  line: string
  radius: number
  /** ý đánh số có thẻ nền riêng; số nằm trong hình tròn hay ô vuông bo */
  rowCards: boolean
  round: boolean
  /** nhãn trên tiêu đề */
  tag: { fill: string; text: string; pill: boolean }
  /** nhãn câu trích: viên thuốc đậm trên mép thẻ, không có thì chữ thường trong thẻ */
  quoteTag?: { fill: string; text: string }
  /** băng dính trang trí kiểu sổ tay */
  tape?: string
  big: string
  formula: string
  halo: string
  frame: string
  cover: Slot[]
  quote: Slot[]
  list: Slot[]
  listHalo?: boolean
  corner: Slot
  bignum: Slot[]
  bignumHalo?: boolean
  backdrop: Slot
  /** bộ vẽ tay: bố cục dựng theo bộ mẫu doodle (hình lớn tràn mép, tiêu đề in hoa); giá trị là tên hình cho từng vai */
  sample?: Record<'tallA' | 'tallB' | 'blob' | 'pair' | 'atom' | 'long' | 'mol' | 'big' | 'bit1' | 'bit2' | 'bit3', string>
}

/** bộ vẽ tay: chỉ khai màu và tên hình cho từng vai trong khung mẫu; mảng đốm và ba hạt rời đặt tên theo lệ chung */
function veTay(o: {
  cycle: string[]; soft: string; softText: string; frame: string; tints: string[]
  tallA: string; tallB: string; pair: string; atom: string; long: string; mol: string
  /** mảng ôm góc; mặc định 'mang' */
  blob?: string
}): StudyStyle {
  const blob = o.blob ?? 'mang'
  return {
    cycle: o.cycle, onCycle: ['#ffffff', '#ffffff', '#ffffff'],
    cards: 'tint', tints: o.tints, card: '#ffffff', line: '#dddbd6', radius: 24, rowCards: false, round: true,
    tag: { fill: o.soft, text: o.softText, pill: true },
    big: o.cycle[0], formula: o.cycle[0], halo: o.soft, frame: o.frame,
    // bìa, câu trích, danh sách và số liệu không ảnh do khung mẫu vẽ; các ô này chỉ dùng khi slide có ảnh
    cover: [], quote: [], list: [], bignum: [],
    corner: [o.atom, 1085, 30, 150, 180], backdrop: [o.mol, 1150, 14, 110, 100],
    sample: { tallA: o.tallA, tallB: o.tallB, blob, pair: o.pair, atom: o.atom, long: o.long, mol: o.mol, big: blob, bit1: 'hat-1', bit2: 'hat-2', bit3: 'hat-3' },
  }
}

const STUDY: Record<StudyId, StudyStyle> = {
  'khoa-hoc': {
    cycle: ['#0f7c8c', '#e4695a', '#e9b949'], onCycle: ['#ffffff', '#ffffff', '#173f5f'],
    cards: 'strip', card: '#ffffff', line: '#dcd8cc', radius: 0, rowCards: false, round: true,
    tag: { fill: '#f6cf63', text: '#173f5f', pill: false }, tape: '#e9b949',
    big: '#173f5f', formula: '#0f7c8c', halo: '#e2f0ec', frame: '#ffffff',
    cover: [['kinh-hien-vi', 800, 106, 340, 614], ['nguyen-tu', 660, 36, 180, 176], ['binh-tam-giac', 670, 430, 180, 271]],
    quote: [['dna', 46, 380, 120, 293], ['bong-den', 1096, 440, 160, 180]],
    list: [['te-bao', 866, 200, 330, 368], ['la-cay', 1100, 14, 140, 200]], listHalo: true,
    corner: ['ong-nghiem', 1010, 40, 180, 150],
    bignum: [['hanh-tinh', 690, 170, 520, 303], ['nam-cham', 1070, 500, 130, 175]],
    backdrop: ['nguyen-tu', 1170, 8, 90, 88],
  },
  toan: {
    cycle: ['#2f6fd6', '#e8702f', '#2f9e7f'], onCycle: ['#ffffff', '#ffffff', '#ffffff'],
    cards: 'outline', card: '#ffffff', line: '#dbe7fb', radius: 28, rowCards: true, round: false,
    tag: { fill: '#f6cf63', text: '#1d3f8f', pill: true }, quoteTag: { fill: '#2f6fd6', text: '#ffffff' },
    big: '#d9611f', formula: '#c4561a', halo: '#fff1c9', frame: '#2f6fd6',
    cover: [['e-ke', 800, 150, 370, 375], ['compa', 700, 40, 160, 219], ['but-chi', 1090, 440, 160, 181], ['khoi-hinh', 660, 520, 380, 144]],
    quote: [['thuoc-do-goc', 30, 560, 220, 132], ['thuoc-ke', 1070, 30, 180, 180]],
    list: [['ban-tinh', 872, 264, 330, 354], ['dau-phep-tinh', 1060, 40, 160, 155]],
    corner: ['hinh-tru-lang-tru', 930, 60, 290, 166],
    bignum: [['may-tinh', 870, 170, 285, 364], ['but-chi', 700, 40, 140, 158]], bignumHalo: true,
    backdrop: ['dau-phep-tinh', 1180, 8, 80, 78],
  },
  'vat-ly': veTay({ cycle: ['#3d6399', '#a8503c', '#7a6118'], soft: '#e4eef8', softText: '#2f4a73', frame: '#a9cdee', tints: ['#e4eef8', '#fbe7e2', '#faf0d4'],
    tallA: 'nam-cham', tallB: 'kinh-thien-van', pair: 'con-lac', atom: 'nguyen-tu', long: 'lo-xo', mol: 'hanh-tinh' }),
  'hoa-hoc': veTay({ cycle: ['#4a7573', '#a5566a', '#7a6520'], soft: '#e3efec', softText: '#37605e', frame: '#a9d3c0', tints: ['#e3efec', '#f4e5e8', '#f7f1d6'],
    tallA: 'binh-cau', tallB: 'binh-tam-giac', pair: 'ong-nghiem-doi', atom: 'nguyen-tu', long: 'dna', mol: 'phan-tu', blob: 'dai-te-bao' }),
  'tin-hoc': {
    cycle: ['#5a3ee0', '#0b7d6d', '#c93a63'], onCycle: ['#ffffff', '#ffffff', '#ffffff'],
    cards: 'window', card: '#ffffff', line: '#e4e0f5', radius: 14, rowCards: true, round: false,
    tag: { fill: '#241d4d', text: '#ffffff', pill: false },
    big: '#5a3ee0', formula: '#5a3ee0', halo: '#ece8fd', frame: '#6c4cf1',
    cover: [['may-tinh-xach-tay', 740, 150, 490, 450], ['dam-may', 660, 40, 200, 170], ['banh-rang', 1080, 500, 170, 180]],
    quote: [['robot', 30, 430, 170, 260], ['khien-bao-mat', 1085, 450, 170, 220]],
    list: [['may-chu', 880, 220, 320, 390], ['mang-luoi', 1070, 24, 170, 170]], listHalo: true,
    corner: ['vi-mach', 1010, 34, 200, 180],
    bignum: [['dien-thoai', 820, 130, 360, 450], ['chuot-ban-phim', 1010, 550, 230, 140]], bignumHalo: true,
    backdrop: ['vi-mach', 1170, 10, 90, 90],
  },
  'sinh-hoc': veTay({ cycle: ['#3f6f43', '#a5503f', '#7a6118'], soft: '#e6f1dd', softText: '#34603a', frame: '#a9cf8e', tints: ['#e6f1dd', '#fbe9e5', '#faf1d6'],
    tallA: 'te-bao-thuc-vat', tallB: 'kinh-hien-vi', pair: 'mam-cay', atom: 'te-bao-dong-vat', long: 'dna', mol: 'no-ron', blob: 'dai-te-bao' }),
  'ngu-van': veTay({ cycle: ['#a04a32', '#6d3b4f', '#5b6b3a'], soft: '#f6e9e0', softText: '#7c3a28', frame: '#efb7a0', tints: ['#f6e9e0', '#f1e6ec', '#edf0e0'],
    tallA: 'chong-sach', tallB: 'den-dau', pair: 'lo-muc', atom: 'sach-mo', long: 'but-long', mol: 'hoa-sen' }),
  'dia-li': veTay({ cycle: ['#2c6e63', '#a5503f', '#2f5f86'], soft: '#e1f0ee', softText: '#22594f', frame: '#bfe0e4', tints: ['#e1f0ee', '#fbeae2', '#e5eef6'],
    tallA: 'qua-dia-cau', tallB: 'hai-dang', pair: 'thuyen-buom', atom: 'la-ban', long: 'khinh-khi-cau', mol: 'ban-do' }),
  'tieng-anh': veTay({ cycle: ['#b23a48', '#35518f', '#7a6118'], soft: '#fbe8ea', softText: '#93303c', frame: '#a9c8ee', tints: ['#fbe8ea', '#e6edf9', '#faf1d6'],
    tallA: 'bong-thoai', tallB: 'thap-dong-ho', pair: 'bot-dien-thoai', atom: 'tach-tra', long: 'but-chi', mol: 'tai-nghe' }),
  'kinh-te-phap-luat': veTay({ cycle: ['#8a5a12', '#233a5c', '#2f6a57'], soft: '#f5eddc', softText: '#6e470d', frame: '#c5d8ee', tints: ['#f5eddc', '#e5ebf4', '#e4efe9'],
    tallA: 'heo-dat', tallB: 'cay-tien', pair: 'can-cong-ly', atom: 'khien', long: 'bua', mol: 'bieu-do' }),
  'lich-su': veTay({ cycle: ['#9a4a24', '#2f5f6b', '#7a5c10'], soft: '#f4e8d2', softText: '#6e3a1c', frame: '#e8cfa0', tints: ['#f4e8d2', '#e4eef0', '#f6e3da'],
    tallA: 'binh-gom', tallB: 'cot-da', pair: 'dong-ho-cat', atom: 'trong-dong', long: 'cot-da', mol: 'kim-tu-thap' }),
  'cong-nghe': veTay({ cycle: ['#b0541a', '#2d5f8a', '#2c6e63'], soft: '#fbeadc', softText: '#8c4112', frame: '#f6c79c', tints: ['#fbeadc', '#e4eef7', '#e2f1ee'],
    tallA: 'robot', tallB: 'den-ban', pair: 'hop-dung-cu', atom: 'banh-rang', long: 'co-le', mol: 'drone' }),
  'nghe-thuat': veTay({ cycle: ['#b0386a', '#5a3f8a', '#1f6f6a'], soft: '#fbe6ee', softText: '#8f2a55', frame: '#f4b6cd', tints: ['#fbe6ee', '#eee8f7', '#e2f2f0'],
    tallA: 'bang-mau', tallB: 'dan-guitar', pair: 'gia-ve', atom: 'trong', long: 'co-ve', mol: 'khung-tranh' }),
  'the-duc': veTay({ cycle: ['#2f7043', '#b34a1e', '#2b5f8c'], soft: '#e5f2e4', softText: '#245834', frame: '#b5dbb0', tints: ['#e5f2e4', '#fbe9e0', '#e4eef7'],
    tallA: 'bong-da', tallB: 'vot-cau-long', pair: 'cup-vang', atom: 'huy-chuong', long: 'vot-cau-long', mol: 'xe-dap' }),
  'mam-non': veTay({ cycle: ['#c2452d', '#34508f', '#2f7a4f'], soft: '#fdeadf', softText: '#9a3520', frame: '#ffd27f', tints: ['#fdeadf', '#e6edfa', '#e3f2e6'],
    tallA: 'gau-bong', tallB: 'khoi-go', pair: 'ngua-go', atom: 'qua-bong', long: 'but-sap', mol: 'cau-vong' }),
  'sinh-hoat-lop': veTay({ cycle: ['#2f6d60', '#b05a14', '#35569a'], soft: '#e3f0ec', softText: '#245449', frame: '#f3cd7a', tints: ['#e3f0ec', '#faecdc', '#e6ebf7'],
    tallA: 'ba-lo', tallB: 'chuong', pair: 'chong-vo', atom: 'dong-ho', long: 'thuoc-but', mol: 'truong-hoc' }),
  'moi-truong': veTay({ cycle: ['#2f7a45', '#1f6b80', '#8a5a12'], soft: '#e4f2df', softText: '#235c35', frame: '#bfe3a8', tints: ['#e4f2df', '#e0eff3', '#f6eedc'],
    tallA: 'trai-dat', tallB: 'cay-xanh', pair: 'tua-bin', atom: 'thung-tai-che', long: 'canh-tre', mol: 'binh-tuoi' }),
  'kinh-doanh': veTay({ cycle: ['#3d4fc4', '#b8503a', '#1f6f6a'], soft: '#e8ebfb', softText: '#2f3c9a', frame: '#c3cbf5', tints: ['#e8ebfb', '#fbe9e4', '#e2f2f0'],
    tallA: 'may-tinh', tallB: 'bang-trinh-bay', pair: 'ten-lua', atom: 'bia-ten', long: 'but-may', mol: 'ca-phe' }),
  'le-hoi': veTay({ cycle: ['#b23020', '#8a5a10', '#2d6a55'], soft: '#fde8e0', softText: '#8f2418', frame: '#ffcf80', tints: ['#fde8e0', '#fbf0d8', '#e3f1ea'],
    tallA: 'bo-hoa', tallB: 'bong-bay', pair: 'hop-qua', atom: 'banh-kem', long: 'den-long', mol: 'trong-hoi' }),
  'quoc-phong': veTay({ cycle: ['#4a6b32', '#a8301f', '#6e5410'], soft: '#e9eedc', softText: '#3d5a27', frame: '#c9d6a0', tints: ['#e9eedc', '#f8e6e1', '#f5eed6'],
    tallA: 'ba-lo-linh', tallB: 'cot-moc', pair: 'la-co', atom: 'mu-coi', long: 'gay-tre', mol: 'leu-trai' }),
  'huong-nghiep': veTay({ cycle: ['#1f6478', '#b4531c', '#5a4a96'], soft: '#e2f0f3', softText: '#1c576a', frame: '#f7cf8f', tints: ['#e2f0f3', '#fbeadd', '#edeaf7'],
    tallA: 'cap-sach', tallB: 'bien-chi-duong', pair: 'chong-sach-mu', atom: 'mu-bao-ho', long: 'thuoc-ke', mol: 'la-ban' }),
  'ngoai-ngu': veTay({ cycle: ['#6a47a0', '#b03a5b', '#1f6f78'], soft: '#eee8f7', softText: '#553789', frame: '#d6c4f0', tints: ['#eee8f7', '#fbe6ec', '#e1f0f1'],
    tallA: 'qua-cau', tallB: 'thap-eiffel', pair: 'cong-torii', atom: 'bong-thoai', long: 'canh-anh-dao', mol: 'den-long' }),
  'du-lich': veTay({ cycle: ['#2a6f91', '#b4501f', '#37754a'], soft: '#e2f0f6', softText: '#1d5a78', frame: '#b9dcea', tints: ['#e2f0f6', '#fbeadd', '#e6f2e8'],
    tallA: 'vali', tallB: 'cay-dua', pair: 'may-anh', atom: 'ban-do-ghim', long: 'mai-cheo', mol: 'thuyen-thung' }),
  'dinh-duong': veTay({ cycle: ['#b23a24', '#3f7a32', '#7a4a86'], soft: '#fbeade', softText: '#8f3418', frame: '#f8d58a', tints: ['#fbeade', '#eaf3dc', '#f1e8f3'],
    tallA: 'gio-rau-qua', tallB: 'binh-sua', pair: 'dau-bep', atom: 'dia-com', long: 'muong-go', mol: 'noi-canh' }),
  'y-te': veTay({ cycle: ['#1f7570', '#b83a2c', '#3d5f9e'], soft: '#e0f1ef', softText: '#1a615d', frame: '#bfe3df', tints: ['#e0f1ef', '#fae6e3', '#e7edf8'],
    tallA: 'tui-cuu-thuong', tallB: 'ong-nghe', pair: 'chai-thuoc', atom: 'trai-tim-nhip', long: 'nhiet-ke', mol: 'rang-cuoi' }),
  'giao-thong': veTay({ cycle: ['#2f5a96', '#b83a2c', '#35753f'], soft: '#e6eefa', softText: '#264b82', frame: '#f6d36b', tints: ['#e6eefa', '#fbe7e4', '#e7f2e8'],
    tallA: 'mu-bao-hiem', tallB: 'den-giao-thong', pair: 'bien-bao', atom: 'xe-dap', long: 'rao-chan', mol: 'xe-buyt' }),
  'gia-dinh': veTay({ cycle: ['#a8403c', '#9a5a12', '#3f704a'], soft: '#fbe8e6', softText: '#8c3532', frame: '#f6c3bd', tints: ['#fbe8e6', '#faeeda', '#e6f1e5'],
    tallA: 'ngoi-nha', tallB: 'cay-gia-dinh', pair: 'den-cay', atom: 'am-tra', long: 'khan-len', mol: 'khung-anh' }),
  'trung-tinh': veTay({ cycle: ['#3f6e80', '#a84e2c', '#27405a'], soft: '#e4eef0', softText: '#27405a', frame: '#e9d9c0', tints: ['#e4eef0', '#fbeadf', '#eef1e6'],
    tallA: 'bong-den', tallB: 'kinh-lup', pair: 'bong-thoai', atom: 'ngoi-sao', long: 'but-chi', mol: 'may-bay-giay' }),
  'tam-ly': {
    cycle: ['#a8532f', '#4f7350', '#4c5c92'], onCycle: ['#ffffff', '#ffffff', '#ffffff'],
    cards: 'tint', tints: ['#f8e4da', '#e6eee3', '#fbefd3'], card: '#fffaf5', line: '#f0ddd0', radius: 40, rowCards: true, round: true,
    tag: { fill: '#f4d6c6', text: '#5a2c1c', pill: true },
    big: '#a8532f', formula: '#a8532f', halo: '#f8e4da', frame: '#f2a58c',
    cover: [['nao-cay', 770, 110, 440, 540], ['bong-thoai', 650, 40, 190, 170], ['mam-cay', 650, 460, 180, 220]],
    quote: [['thien', 28, 430, 190, 260], ['guong', 1085, 440, 170, 240]],
    list: [['tro-chuyen', 850, 230, 370, 350], ['may-mat-troi', 1060, 30, 180, 160]], listHalo: true,
    corner: ['manh-ghep', 1010, 34, 200, 180],
    bignum: [['trai-tim', 800, 150, 400, 410], ['so-tay', 1040, 540, 200, 140]], bignumHalo: true,
    backdrop: ['mam-cay', 1175, 8, 80, 100],
  },
}

const isStudy = (pack: SlidePackId): pack is StudyId => pack in STUDY

/** đặt hình vào giữa ô, giữ tỉ lệ gốc */
function fit(pack: StudyId, n: number, [name, x, y, w, h]: Slot): SlideElement {
  const [aw, ah] = ART[`${pack}/${name}`]
  const k = Math.min(w / aw, h / ah)
  return art(n, `${pack}/${name}`, x + (w - aw * k) / 2, y + (h - ah * k) / 2, aw * k)
}

const shape = (id: string, b: Box, fill: string, extra: Partial<SlideElement> = {}): SlideElement =>
  ({ id, type: 'shape', shape: 'rect', fill, border: 0, shadowLevel: 0, ...b, ...extra })

const deco = (n: number, b: Box, fill: string, extra: Partial<SlideElement> = {}) =>
  shape(`decor-kit-${n}`, b, fill, { decor: true, ...extra })

const rounded = (radius: number): Partial<SlideElement> => (radius ? { shape: 'round', radius } : {})

/** nhãn nhỏ trên tiêu đề */
function tag(value: string | undefined, x: number, y: number, { body }: Kit, look: { fill: string; text: string; pill: boolean }, center = false): Built {
  const label = upper(value)
  if (!label) return []
  const w = Math.min(760, 60 + label.length * 17)
  const left = center ? x - w / 2 : x
  return [
    deco(40, box(left, y, w, 50), look.fill, look.pill ? rounded(25) : { rotation: -1.2, opacity: 0.95 }),
    body('kicker', label, box(left, y + 2, w, 48), 22, look.text, { fontWeight: 700, align: 'center', valign: 'middle', lineHeight: 1.2 }),
  ]
}

const studyHead = (pack: StudyId, c: SlideLayoutContent, kit: Kit): Built => STUDY[pack].sample
  ? sampleTitle(pack, c, kit)
  : [
      ...tag(c.kicker, 106, 58, kit, STUDY[pack].tag),
      kit.title('title', c.title, box(106, 118, 760, 132), 54, PACK_COLORS[pack].ink, { valign: 'middle' }),
    ]

/** hình đặt theo toạ độ đo trên bộ mẫu: [vai, x, y, rộng, cao, góc xoay, lật ngang] */
type Placed = [keyof NonNullable<StudyStyle['sample']>, number, number, number, number, number?, boolean?]

const SAMPLE: Record<'cover' | 'photo' | 'intro' | 'goals' | 'four' | 'columns' | 'rules' | 'section', Placed[]> = {
  // slide có ảnh: chỉ viền góc, không che ảnh bên phải
  photo: [['blob', -62, -78, 210, 210, 22], ['blob', -80, 566, 230, 230, -115], ['bit1', 626, 40, 90, 90, -16], ['bit3', 1178, 28, 92, 92, 16], ['bit2', 1180, 610, 104, 104, 16]],
  cover: [
    ['tallA', 24, 60, 296, 348, 4], ['blob', 891, -27, 438, 379, 55], ['blob', -57, 412, 438, 379, -115], ['tallB', 1016, 335, 195, 339, -7],
    ['bit1', 815, 37, 96, 94, -16], ['bit2', 918, 589, 96, 94, 16], ['bit1', 214, 570, 100, 98, 7], ['bit3', 263, 126, 83, 81, 16],
  ],
  intro: [['pair', 996, 263, 258, 417, 13], ['atom', 46, 444, 237, 221], ['bit2', 1067, 72, 141, 134], ['blob', -54, -24, 438, 379, -27]],
  goals: [['long', -60, 233, 320, 548, -38], ['long', 1018, -89, 340, 574, -38]],
  four: [
    ['mol', 1067, 26, 164, 170], ['bit1', 1137, 587, 165, 161], ['bit2', -36, 567, 200, 200],
    ['bit3', 33, 35, 124, 136], ['bit1', 128, 84, 70, 70, -22], ['bit2', 81, 161, 62, 62, -14],
  ],
  columns: [
    ['blob', -62, -78, 210, 210, 22], ['blob', 1110, -48, 220, 220, -67], ['bit1', 1013, 32, 99, 94], ['bit3', 1086, 134, 90, 98],
    ['bit2', 49, 176, 99, 94, -85], ['bit1', 135, 62, 90, 98, -85],
  ],
  rules: [
    ['atom', 972, 313, 226, 211], ['atom', 1118, -101, 324, 302, -38], ['bit1', 1184, 261, 72, 72], ['bit2', 1117, 544, 186, 176],
    ['bit1', 1013, 576, 72, 72], ['bit1', 995, 87, 61, 61], ['bit3', 57, 70, 91, 86, 14], ['bit1', 182, 42, 61, 61, 14],
  ],
  section: [
    ['mol', 776, 69, 323, 241, -4], ['big', 700, 330, 720, 560, -32], ['bit1', 690, 95, 94, 94], ['bit3', 1077, 363, 136, 134, 16],
    ['bit2', 891, 552, 87, 85, 11], ['bit2', 892, 380, 60, 59], ['bit1', 1176, 20, 105, 105],
  ],
}

function sampleArt(pack: StudyId, set: keyof typeof SAMPLE, credit = false): Built {
  const names = STUDY[pack].sample!
  return SAMPLE[set].map(([role, x, y, w, h, rotation, flipX], i) => {
    // có dòng nguồn thì hạt đậm ở góc dưới trái nhích lên, khỏi nằm sau chữ
    const top = credit && role.startsWith('bit') && x < 100 && y + h > 660 ? 430 : y
    return { ...fit(pack, i + 1, [names[role], x, top, w, h]), rotation, flipX }
  })
}

/** tiêu đề giữa, in hoa, như bộ mẫu */
const sampleTitle = (pack: StudyId, c: SlideLayoutContent, { title }: Kit, b: Box = box(200, 96, 880, 124)): Built => [
  title('title', c.title, b, 84, PACK_COLORS[pack].ink, { align: 'center', valign: 'middle', caps: true, lineHeight: 1.15 }),
]

function sampleFrame(pack: StudyId, id: string, c: SlideLayoutContent, kit: Kit): Built | null {
  const { title, body } = kit
  const { ink, fg } = PACK_COLORS[pack]
  const style = STUDY[pack]
  const paper = full(`${pack}/giay`)
  const head = { align: 'center' as const, valign: 'middle' as const, caps: true, lineHeight: 1.2 }
  const small = { align: 'center' as const, caps: true, fontWeight: 700, letterSpacing: 0.12 }
  // mép dưới của nội dung: có dòng nguồn thì chừa chỗ cho nó
  const floor = c.credit ? 650 : 690
  const photo = image('image-1', c.image, box(730, 120, 450, 480), {
    imagePosition: { x: c.focusX ?? 50, y: c.focusY ?? 40 }, crop: c.imageCrop, ...rounded(style.radius), border: 6, borderColor: style.frame,
  })
  switch (id) {
    case 'photo-full':
      if (c.image) return [
        paper,
        ...sampleArt(pack, 'photo'),
        photo,
        body('kicker', c.kicker, box(110, 132, 580, 56), 26, style.big, { caps: true, fontWeight: 700, letterSpacing: 0.12 }),
        title('title', c.title, box(106, 200, 590, 300), 96, ink, { caps: true, valign: 'middle', lineHeight: 1.15 }),
        body('subtitle', c.subtitle, box(110, 508, 590, floor - 508), 30, fg, { lineHeight: 1.3 }),
      ]
      return [
        paper,
        ...sampleArt(pack, 'cover'),
        body('kicker', c.kicker, box(340, 150, 600, 56), 28, style.big, small),
        title('title', c.title, box(322, 204, 676, 340), 136, ink, { ...head, lineHeight: 1.12 }),
        body('subtitle', c.subtitle, box(320, 550, 640, floor - 550), 28, style.big, { ...small, letterSpacing: 0.08, lineHeight: 1.2 }),
      ]
    case 'manifesto': {
      const text = statement(c)
      return [
        paper,
        ...sampleArt(pack, 'goals'),
        title('kicker', c.kicker, box(240, 150, 800, 120), 84, ink, head),
        body('body', text, box(330, 290, 620, 290), text.length > 150 ? 36 : 42, fg, { align: 'center', valign: 'middle', lineHeight: 1.45 }),
        body('author', c.author, box(340, 580, 600, 56), 26, style.big, small),
      ]
    }
    case 'editorial-text':
    case 'bullets': {
      const bullets = list(c.bullets)
      const items = bullets.length ? bullets : list(c.body?.split('\n'))
      if (id === 'bullets' && !items.length) return []
      const number = (i: number, b: Box, px: number) =>
        title(`decor-kit-${70 + i}`, `0${i + 1}`, b, px, style.cycle[i % style.cycle.length], { align: 'center', valign: 'middle', decor: true, lineHeight: 1 })
      if (items.length === 4) {
        return [
          paper,
          ...sampleArt(pack, 'four', Boolean(c.credit)),
          ...sampleTitle(pack, c, kit, box(220, 90, 840, 124)),
          ...items.flatMap((item, i) => {
            const x = i % 2 ? 668 : 197
            const rowH = (floor - 222) / 2
            const y = 222 + Math.floor(i / 2) * rowH
            return [number(i, box(x, y, 416, 62), 50), body(`bullet-${i + 1}`, item, box(x, y + 62, 416, rowH - 64), 30, fg, { align: 'center', lineHeight: 1.35 })]
          }),
        ]
      }
      if (items.length === 2 || items.length === 3) {
        const w = items.length === 3 ? 320 : 420
        const gap = items.length === 3 ? 60 : 70
        const left = 640 - (items.length * w + (items.length - 1) * gap) / 2
        return [
          paper,
          ...sampleArt(pack, 'columns'),
          ...sampleTitle(pack, c, kit, box(220, 128, 840, 128)),
          ...items.flatMap((item, i) => {
            const x = left + i * (w + gap)
            return [number(i, box(x, 272, w, 88), 68), body(`bullet-${i + 1}`, item, box(x, 368, w, floor - 368), 32, fg, { align: 'center', lineHeight: 1.4 })]
          }),
        ]
      }
      const text = items.length > 1 ? items.map((item) => `• ${item}`).join('\n') : items[0]
      return [
        paper,
        ...sampleArt(pack, 'intro'),
        ...sampleTitle(pack, c, kit, box(240, 140, 800, 130)),
        body(bullets.length ? 'bullets' : 'body', text, box(320, 286, 640, floor - 286), (text?.length ?? 0) > 260 ? 29 : 35, fg, { align: 'center', lineHeight: 1.5 }),
      ]
    }
    case 'rules': {
      const rows = rowsOf(c)
      if (!rows.length) return []
      const many = rows.length > 3
      return [
        paper,
        ...sampleArt(pack, many ? 'four' : 'columns', Boolean(c.credit)),
        ...sampleTitle(pack, c, kit, box(220, many ? 90 : 128, 840, many ? 118 : 128)),
        ...gridRows(rows, kit, { top: many ? 214 : 270, bottom: floor, color: (i) => style.cycle[i % style.cycle.length], text: fg }),
      ]
    }
    case 'bignum':
      if (c.image) return [
        paper,
        ...sampleArt(pack, 'photo'),
        photo,
        title('bignum-value', c.value, box(106, 104, 590, 226), 190, style.big, { valign: 'middle', lineHeight: 1 }),
        title('bignum-label', c.label, box(110, 338, 590, 174), 72, ink, { caps: true, valign: 'middle', lineHeight: 1.15 }),
        body('subtitle', c.subtitle, box(110, 518, 590, floor - 518), 30, fg, { lineHeight: 1.35 }),
      ]
      return [
        paper,
        ...sampleArt(pack, 'section'),
        title('bignum-value', c.value, box(150, 84, 560, 224), 200, style.big, { valign: 'middle', lineHeight: 1 }),
        title('bignum-label', c.label, box(154, 310, 620, 204), 112, ink, { caps: true, valign: 'middle', lineHeight: 1.15 }),
        body('subtitle', c.subtitle, box(158, 518, 600, floor - 518), 30, fg, { lineHeight: 1.35 }),
      ]
    default:
      return null
  }
}

/** hai tới bốn ý đánh số; còn lại là một khối chữ */
function steps(pack: StudyId, c: SlideLayoutContent, { title, body }: Kit): Built {
  const bullets = list(c.bullets)
  const items = bullets.length ? bullets : list(c.body?.split('\n'))
  const { fg } = PACK_COLORS[pack]
  const style = STUDY[pack]
  if (!items.length) return []
  if (items.length < 2 || items.length > 4) {
    const text = items.length > 1 ? items.map((item) => `• ${item}`).join('\n') : items[0]
    return [body(bullets.length ? 'bullets' : 'body', text, box(110, 276, 690, 390), text.length > 320 ? 24 : 28, fg, { valign: 'middle', lineHeight: 1.6 })]
  }
  const h = Math.min(126, (FLOOR + 10 - 262) / items.length)
  return items.flatMap((item, i) => {
    const y = 262 + i * h
    const k = i % style.cycle.length
    const at = box(128, y + (h - 10 - 56) / 2, 56, 56)
    return [
      style.rowCards
        ? deco(50 + i, box(106, y, 710, h - 10), style.card, { ...rounded(Math.min(style.radius, 28)), border: 3, borderColor: style.line })
        : null,
      deco(60 + i, at, style.cycle[k], style.round ? { shape: 'ellipse' } : rounded(14)),
      title(`decor-kit-${70 + i}`, String(i + 1), at, 26, style.onCycle[k], { align: 'center', valign: 'middle', decor: true, lineHeight: 1.1 }),
      body(`bullet-${i + 1}`, item, box(200, y, 610, h - 10), 26, fg, { valign: 'middle', lineHeight: 1.25 }),
    ]
  })
}

/** tối đa ba thẻ dọc; nhiều hơn thì danh sách hàng ngang */
function cards(pack: StudyId, rows: Array<{ value: string; label: string }>, { title, body }: Kit): Built {
  const { ink, fg } = PACK_COLORS[pack]
  const style = STUDY[pack]
  if (rows.length > 3) return gridRows(rows, { title, body } as Kit, { top: 256, bottom: FLOOR, color: () => ink, text: fg })
  const left = 664 - (rows.length * 336 + (rows.length - 1) * 36) / 2
  return rows.flatMap((row, i) => {
    const x = left + i * 372
    const k = i % style.cycle.length
    const color = style.cycle[k]
    const whole = box(x, 276, 336, 356)
    const back: SlideElement[] =
      style.cards === 'outline' ? [deco(50 + i, whole, style.card, { ...rounded(style.radius), border: 4, borderColor: color, shadowLevel: 1 })]
        : style.cards === 'tint' ? [deco(50 + i, whole, style.tints![k], rounded(style.radius))]
          : style.cards === 'window'
            ? [
                deco(50 + i, whole, style.card, { border: 3, borderColor: style.line, shadowLevel: 1 }),
                deco(60 + i, box(x, 276, 336, 34), color),
                ...[0, 1, 2].map((d) => deco(80 + i * 3 + d, box(x + 16 + d * 22, 286, 13, 13), '#ffffff', { shape: 'ellipse' })),
              ]
            : [
                deco(50 + i, whole, style.card, { shadowLevel: 1 }),
                deco(60 + i, box(x, 276, 336, 10), color),
                deco(70 + i, box(x + 108, 258, 120, 36), '#cfe3df', { opacity: 0.8, rotation: [-4, 3, -2][i] }),
              ]
    return [
      ...back,
      title(`item-${i + 1}-value`, row.value, box(x + 18, 320, 300, 90), 36, ink, { align: 'center', valign: 'middle' }),
      body(`item-${i + 1}-label`, row.label, box(x + 28, 424, 280, 188), 25, fg, { align: 'center' }),
    ]
  })
}

function study(pack: StudyId, id: string, c: SlideLayoutContent, kit: Kit): Built | null {
  const { title, body } = kit
  const { ink, fg, accent } = PACK_COLORS[pack]
  const style = STUDY[pack]
  if (style.sample) {
    const built = sampleFrame(pack, id, c, kit)
    if (built) return built
  }
  const paper = full(`${pack}/giay`)
  const arts = (slots: Slot[]) => slots.map((slot, i) => fit(pack, i + 1, slot))
  const halo = (x: number, y: number, size: number) => deco(8, box(x, y, size, size), style.halo, { shape: 'ellipse' })
  /** ảnh: khung màu của bộ, hoặc tờ ảnh dán băng dính */
  const photo = (x: number, y: number, w: number, h: number): Built => [
    style.tape ? deco(30, box(x - 16, y - 16, w + 32, h + 32), '#ffffff', { shadowLevel: 2 }) : null,
    image('image-1', c.image, box(x, y, w, h), {
      imagePosition: { x: c.focusX ?? 50, y: c.focusY ?? 40 }, crop: c.imageCrop,
      ...(style.tape ? {} : { ...rounded(style.radius), border: 6, borderColor: style.frame }),
    }),
    style.tape ? deco(31, box(x + w / 2 - 70, y - 32, 140, 38), style.tape, { opacity: 0.8, rotation: -3 }) : null,
  ]
  switch (id) {
    case 'photo-full':
      return [
        paper,
        ...(c.image ? photo(730, 130, 450, 460) : arts(style.cover)),
        ...tag(c.kicker, 110, 128, kit, style.tag),
        title('title', c.title, box(106, 200, 590, 260), c.image ? 62 : 74, ink, { valign: 'middle' }),
        body('subtitle', c.subtitle, box(110, 478, 520, 130), 27, fg),
      ]
    case 'manifesto': {
      const text = statement(c)
      // dòng cuối là công thức thì cho to và nổi, là tên người / nguồn thì để nhỏ
      const formula = /[=≤≥]/.test(c.author ?? '')
      return [
        paper,
        style.tape
          ? deco(8, box(190, 130, 900, 450), style.card, { shadowLevel: 2 })
          : deco(8, box(180, 150, 920, 430), style.card, { ...rounded(style.radius), border: 4, borderColor: style.frame, shadowLevel: 1 }),
        ...(style.tape
          ? [
              deco(9, box(148, 128, 150, 36), style.tape, { opacity: 0.8, rotation: -32 }),
              deco(10, box(982, 126, 150, 36), style.tape, { opacity: 0.8, rotation: 32 }),
            ]
          : []),
        ...arts(style.quote),
        ...(style.quoteTag
          ? tag(c.kicker, 640, 126, kit, { ...style.quoteTag, pill: true }, true)
          : [body('kicker', upper(c.kicker), box(240, 172, 800, 54), 22, accent, { fontWeight: 700, align: 'center' })]),
        title('body', text, box(250, 232, 780, 214), text.length > 150 ? 36 : text.length > 90 ? 44 : 56, ink, { align: 'center', valign: 'middle' }),
        formula
          ? title('author', c.author, box(220, 458, 840, 100), 52, style.formula, { align: 'center', valign: 'middle' })
          : body('author', c.author, box(240, 484, 800, 66), 24, fg, { align: 'center' }),
      ]
    }
    case 'editorial-text':
    case 'bullets': {
      const items = steps(pack, c, kit)
      if (id === 'bullets' && !items.length) return []
      return [
        paper,
        style.listHalo ? halo(836, 190, 390) : null,
        ...arts(style.list),
        ...studyHead(pack, c, kit),
        ...items,
      ]
    }
    case 'rules': {
      const rows = rowsOf(c)
      if (!rows.length) return []
      return [paper, fit(pack, 1, style.corner), ...studyHead(pack, c, kit), ...cards(pack, rows, kit)]
    }
    case 'bignum':
      return [
        paper,
        ...(c.image
          ? photo(750, 130, 440, 460)
          : [style.bignumHalo ? halo(780, 130, 440) : null, ...arts(style.bignum)]),
        ...tag(c.kicker, 110, 100, kit, style.tag),
        title('bignum-value', c.value, box(106, 168, 600, 250), 200, style.big, { valign: 'middle', lineHeight: 1 }),
        title('bignum-label', c.label, box(110, 420, 590, 104), 40, ink),
        body('subtitle', c.subtitle, box(110, 528, 590, FLOOR - 528), 28, fg, { lineHeight: 1.3 }),
      ]
    default:
      return null
  }
}

/* ------------------------------------------------------------------ *
 * Sử đỏ: tiêu đề cao đậm, đỏ trầm trên giấy, hoa văn nét mảnh
 * ------------------------------------------------------------------ */
function suDo(id: string, c: SlideLayoutContent, { title, body }: Kit, standard: () => SlideElement[]): Built {
  const red = PACK_COLORS['su-do'].ink
  const fg = PACK_COLORS['su-do'].fg
  const paper = full('su-do/giay')
  const head = { fontWeight: 700, caps: true, lineHeight: 1.08 }
  const rect = (name: string, x: number, y: number, w: number, h: number, fill: string = red): SlideElement =>
    ({ id: name, type: 'shape', shape: 'rect', fill, border: 0, shadowLevel: 0, decor: true, ...box(x, y, w, h) })
  const photo = (b: Box, src = c.image) =>
    image('image-1', src, b, { imagePosition: { x: c.focusX ?? 50, y: c.focusY ?? 40 }, crop: c.imageCrop })
  const frieze = (y: number) => c.credit ? null : art(7, 'su-do/dai-song', 0, y, 1280)
  const long = (c.title?.length ?? 0) > 34

  switch (id) {
    case 'photo-full': {
      if (c.image) return [
        paper,
        photo(box(660, 0, 620, 720)),
        body('kicker', upper(c.kicker), box(70, 70, 540, 56), 22, fg, { fontWeight: 600 }),
        title('title', c.title, box(70, 150, 550, 330), 86, red, { ...head, valign: 'middle' }),
        body('subtitle', c.subtitle, box(70, 510, 540, 130), 26, fg),
      ]
      // bài về chiến tranh dùng bàn tác chiến, còn lại núi sông
      const war = /chiến tranh|chiến dịch|chiến thắng|kháng chiến|khởi nghĩa|trận /i.test(`${c.title ?? ''} `.normalize('NFC'))
      const scene = war ? 'su-do/ban-tac-chien' : 'su-do/nui-song'
      // bàn tác chiến thu vào một chút để đèn bão không chạm dòng phụ bên phải
      const wide = war ? 1160 : 1280
      return [
        paper,
        art(1, scene, (1280 - wide) / 2, 720 - (wide * ART[scene][1]) / ART[scene][0], wide),
        title('title', c.title, box(40, 24, 1200, 250), long ? 96 : 150, red, { ...head, align: 'center', valign: 'middle' }),
        body('kicker', upper(c.kicker), box(44, 292, 320, 170), 28, fg, { fontWeight: 600, lineHeight: 1.35 }),
        body('subtitle', c.subtitle, war ? box(866, 292, 370, 108) : box(966, 292, 270, 200), 28, fg, { align: 'right', lineHeight: 1.35 }),
      ]
    }
    case 'manifesto': {
      const text = statement(c)
      return [
        rect('decor-kit-0', 0, 0, 1280, 720),
        rect('decor-kit-2', 110, 96, 1060, 528, PACK_COLORS['su-do'].background),
        body('kicker', upper(c.kicker), box(180, 126, 920, 62), 28, fg, { fontWeight: 700, align: 'center' }),
        title('body', text, box(190, 200, 900, 300), text.length > 150 ? 46 : text.length > 80 ? 60 : 76, red, { ...head, caps: false, align: 'center', valign: 'middle', lineHeight: 1.3 }),
        body('author', c.author, box(190, 518, 900, 66), 32, fg, { align: 'center' }),
      ]
    }
    case 'editorial-text':
      return [
        paper,
        title('title', c.title, box(64, 44, c.image ? 590 : 760, 210), long ? 70 : 104, red, { ...head, valign: 'middle' }),
        body('kicker', upper(c.kicker), box(68, 252, 560, 58), 26, red, { fontWeight: 700 }),
        body('body', paragraphs(c), box(68, 318, 640, c.credit ? 330 : 370), 35, fg),
        c.image ? photo(box(720, 0, 560, 720)) : art(1, 'su-do/cuon-thu', 730, 290, 510),
      ]
    case 'rules': {
      const rows = rowsOf(c)
      if (!rows.length) return []
      const n = rows.length
      const w = 1140 / n
      const size = n > 4 ? 25 : n > 3 ? 29 : n > 2 ? 31 : 36
      const short = rows.every((row) => row.value.length <= 4)
      return [
        paper,
        title('title', c.title, box(60, 34, 1160, 180), long ? 68 : 100, red, { ...head, align: 'center', valign: 'middle' }),
        body('kicker', upper(c.kicker), box(240, 204, 800, 56), 26, red, { fontWeight: 700, align: 'center' }),
        rect('divider-0', 70, 372, 1140, 4),
        ...rows.flatMap((row, i) => {
          const x = 70 + i * w
          return [
            title(`item-${i + 1}-value`, row.value, box(x + 4, 262, w - 8, 96), short ? 64 : n > 3 ? 32 : 42, red, { ...head, caps: false, align: 'center', valign: 'middle', lineHeight: 1.15 }),
            rect(`divider-${i * 2 + 1}`, x + w / 2 - 9, 365, 18, 18),
            rect(`divider-${i * 2 + 2}`, x + 10, 404, 2, 220, '#b9868c'),
            body(`item-${i + 1}-label`, row.label, box(x + 22, 404, w - 34, c.credit ? 226 : 232), size, fg, { lineHeight: 1.4 }),
          ]
        }),
        frieze(654),
      ]
    }
    case 'bignum':
      return [
        paper,
        c.image ? photo(box(760, 0, 520, 720)) : art(1, 'su-do/sach-but', 730, 200, 500),
        body('kicker', upper(c.kicker), box(70, 66, 600, 62), 28, red, { fontWeight: 700 }),
        title('bignum-value', c.value, box(64, 130, 660, 280), 210, red, { ...head, valign: 'middle', lineHeight: 1 }),
        title('bignum-label', c.label, box(70, 414, 640, 112), 58, red, { ...head, lineHeight: 1.15 }),
        body('subtitle', c.subtitle, box(70, 530, 660, FLOOR - 530), 33, fg, { lineHeight: 1.35 }),
      ]
    case 'bullets': {
      const items = list(c.bullets).length ? list(c.bullets) : list(c.body?.split('\n'))
      if (!items.length) return []
      const numbered = items.every((item) => /^\d+[.)]\s/.test(item))
      const text = items.map((item) => (numbered ? item : `• ${item}`)).join('\n')
      return [
        paper,
        title('title', c.title, box(50, 40, 500, 600), long ? 70 : 96, red, { ...head, valign: 'middle' }),
        rect('divider-1', 580, 80, 2, 560, '#b9868c'),
        body('bullets', text, box(612, 80, 620, c.credit ? 560 : 580), text.length > 320 ? 29 : text.length > 180 ? 34 : 42, fg, { valign: 'middle', lineHeight: 1.7 }),
      ]
    }
    case 'photo-compare': {
      const h = c.caption || c.caption2 ? 310 : 410
      return [
        paper,
        title('title', c.title, box(60, 30, 1160, 170), long ? 52 : 76, red, { ...head, align: 'center', valign: 'middle' }),
        image('image-1', c.image, box(70, 220, 555, h), { crop: c.imageCrop }),
        image('image-2', c.image2, box(655, 220, 555, h), { crop: c.image2Crop }),
        body('photo-caption', c.caption, box(70, 546, 555, c.credit ? 104 : 130), 27, fg, { align: 'center', lineHeight: 1.3 }),
        body('photo-caption-2', c.caption2, box(655, 546, 555, c.credit ? 104 : 130), 27, fg, { align: 'center', lineHeight: 1.3 }),
      ]
    }
    case 'bars': {
      const chart = standard().filter((el) => el.id.startsWith('bar'))
      if (!chart.length) return []
      for (const el of chart) {
        el.x = 8 + (el.x - 5) * 0.93
        el.y = 36 + (el.y - 26) * 0.86
        el.w *= 0.93
        el.h *= 0.86
      }
      return [paper, title('title', c.title, box(60, 30, 1160, 190), long ? 52 : 76, red, { ...head, align: 'center', valign: 'middle' }), ...chart]
    }
    default: {
      const elements = standard()
      return elements.length ? [paper, ...elements] : []
    }
  }
}

/* ------------------------------------------------------------------ *
 * Địa lí (Học thuật): xanh rêu và kem, ảnh khung cổng vòm, tiêu đề in hoa đậm
 * ------------------------------------------------------------------ */
function diaLiHt(id: string, c: SlideLayoutContent, { title, body }: Kit, standard: () => SlideElement[]): Built {
  const { background: cream, ink: olive, fg, accent: gold } = PACK_COLORS['dia-li-ht']
  const head = { fontWeight: 800, caps: true, lineHeight: 1.12 }
  const long = (c.title?.length ?? 0) > 34
  const block = (n: string, x: number, y: number, w: number, h: number, fill: string, extra: Partial<SlideElement> = {}): SlideElement =>
    ({ id: n, type: 'shape', shape: 'rect', fill, border: 0, shadowLevel: 0, decor: true, ...box(x, y, w, h), ...extra })
  const paper = block('decor-kit-0', 0, 0, 1280, 720, cream, { locked: true })
  const moss = block('decor-kit-0', 0, 0, 1280, 720, olive, { locked: true })
  const photo = (b: Box, shape?: string, src = c.image) =>
    image('image-1', src, b, { shape, imagePosition: { x: c.focusX ?? 50, y: c.focusY ?? 40 }, crop: c.imageCrop })

  switch (id) {
    case 'photo-full':
      if (c.image) return [
        moss,
        block('decor-kit-1', 0, 0, 1280, 240, cream),
        photo(box(450, 36, 380, 420), 'arch'),
        body('kicker', upper(c.kicker), box(40, 150, 390, 66), 28, olive, { fontWeight: 700 }),
        title('title', c.title, box(70, 474, 1140, 150), long ? 54 : 72, cream, { ...head, align: 'center', valign: 'middle' }),
        body('subtitle', c.subtitle, box(190, 628, 900, c.credit ? 44 : 66), 28, cream, { align: 'center', lineHeight: 1.3 }),
      ]
      return [
        moss,
        block('decor-kit-1', 0, 0, 1280, 170, cream),
        body('kicker', upper(c.kicker), box(140, 56, 1000, 66), 30, olive, { fontWeight: 700, align: 'center' }),
        title('title', c.title, box(80, 220, 1120, 300), long ? 76 : 112, cream, { ...head, align: 'center', valign: 'middle' }),
        block('divider-1', 580, 540, 120, 8, gold),
        body('subtitle', c.subtitle, box(190, 570, 900, 90), 32, cream, { align: 'center', lineHeight: 1.3 }),
      ]
    case 'manifesto': {
      const text = statement(c)
      return [
        moss,
        body('kicker', upper(c.kicker), box(190, 100, 900, 66), 28, gold, { fontWeight: 700, align: 'center' }),
        title('body', text, box(140, 190, 1000, 340), text.length > 150 ? 44 : text.length > 80 ? 56 : 70, cream, { ...head, caps: false, align: 'center', valign: 'middle', lineHeight: 1.3 }),
        block('divider-1', 580, 556, 120, 8, gold),
        body('author', c.author, box(190, 584, 900, 66), 30, cream, { align: 'center' }),
      ]
    }
    case 'editorial-text':
      return [
        paper,
        ...(c.image ? [block('decor-kit-1', 940, 0, 340, 720, olive), photo(box(760, 70, 440, 580), 'arch')] : []),
        body('kicker', upper(c.kicker), box(80, 60, 620, 66), 28, olive, { fontWeight: 700 }),
        title('title', c.title, box(76, 132, c.image ? 640 : 1080, 200), long ? 54 : 72, olive, { ...head, valign: 'middle' }),
        block('divider-1', 80, 350, 120, 8, gold),
        body('body', paragraphs(c), box(80, 384, c.image ? 620 : 1080, c.credit ? 266 : 296), 32, fg),
      ]
    case 'rules': {
      const rows = rowsOf(c)
      if (!rows.length) return []
      const n = rows.length
      const w = 1140 / n
      const size = n > 4 ? 26 : n > 3 ? 30 : n > 2 ? 34 : 38
      const short = rows.every((row) => row.value.length <= 4)
      return [
        paper,
        block('decor-kit-1', 0, 364, 1280, 356, olive),
        title('title', c.title, box(60, 36, 1160, 130), long ? 52 : 68, olive, { ...head, align: 'center', valign: 'middle' }),
        body('kicker', upper(c.kicker), box(240, 168, 800, 58), 26, olive, { fontWeight: 700, align: 'center' }),
        ...rows.flatMap((row, i) => {
          const x = 70 + i * w
          return [
            title(`item-${i + 1}-value`, row.value, box(x + 10, 236, w - 20, 96), short ? 64 : n > 3 ? 30 : 40, olive, { ...head, caps: false, align: 'center', valign: 'middle' }),
            block(`divider-${i + 1}`, x + w / 2 - 22, 342, 44, 44, gold, { shape: 'ellipse' }),
            body(`item-${i + 1}-label`, row.label, box(x + 18, 414, w - 36, c.credit ? 236 : 260), size, cream, { align: 'center', lineHeight: 1.35 }),
          ]
        }),
      ]
    }
    case 'bignum':
      return [
        moss,
        c.image ? photo(box(790, 70, 420, 650), 'arch') : null,
        body('kicker', upper(c.kicker), box(80, 70, 660, 66), 28, gold, { fontWeight: 700 }),
        title('bignum-value', c.value, box(74, 146, c.image ? 680 : 1100, 260), 200, cream, { ...head, valign: 'middle', lineHeight: 1 }),
        title('bignum-label', c.label, box(80, 420, c.image ? 660 : 1080, 110), 52, cream, head),
        body('subtitle', c.subtitle, box(80, 546, c.image ? 660 : 1080, FLOOR - 546), 30, cream, { lineHeight: 1.35 }),
      ]
    case 'bullets': {
      const items = list(c.bullets).length ? list(c.bullets) : list(c.body?.split('\n'))
      if (!items.length) return []
      const numbered = items.every((item) => /^\d+[.)]\s/.test(item))
      const text = items.map((item) => (numbered ? item : `• ${item}`)).join('\n')
      return [
        paper,
        block('decor-kit-1', 0, 0, 520, 720, olive),
        title('title', c.title, box(50, 100, 430, 520), long ? 52 : 66, cream, { ...head, valign: 'middle' }),
        body('bullets', text, box(580, 76, 630, c.credit ? 560 : 580), text.length > 320 ? 29 : text.length > 180 ? 34 : 40, fg, { valign: 'middle', lineHeight: 1.65 }),
      ]
    }
    case 'photo-compare': {
      const h = c.caption || c.caption2 ? 320 : 430
      return [
        moss,
        title('title', c.title, box(60, 30, 1160, 150), long ? 52 : 68, cream, { ...head, align: 'center', valign: 'middle' }),
        image('image-1', c.image, box(70, 210, 555, h), { crop: c.imageCrop }),
        image('image-2', c.image2, box(655, 210, 555, h), { crop: c.image2Crop }),
        body('photo-caption', c.caption, box(70, 546, 555, c.credit ? 104 : 130), 28, cream, { align: 'center', lineHeight: 1.3 }),
        body('photo-caption-2', c.caption2, box(655, 546, 555, c.credit ? 104 : 130), 28, cream, { align: 'center', lineHeight: 1.3 }),
      ]
    }
    case 'bars': {
      const chart = standard().filter((el) => el.id.startsWith('bar'))
      if (!chart.length) return []
      for (const el of chart) {
        el.x = 8 + (el.x - 5) * 0.93
        el.y = 36 + (el.y - 26) * 0.86
        el.w *= 0.93
        el.h *= 0.86
      }
      return [paper, title('title', c.title, box(60, 30, 1160, 190), long ? 52 : 68, olive, { ...head, align: 'center', valign: 'middle' }), ...chart]
    }
    default: {
      const elements = standard()
      return elements.length ? [paper, ...elements] : []
    }
  }
}

/* ------------------------------------------------------------------ *
 * Đỏ son (Học thuật, lí luận chính trị): đỏ và kem, khung tem, sao chìm, hình cắt khuôn
 * ------------------------------------------------------------------ */
/** chân dung / biểu trưng trên bìa (nguồn ở docs/ban-quyen.md): chỉ khi chữ trên slide nói rõ môn */
const chinhTriFigures = (t: string): string[] => {
  if (/tư tưởng hồ chí minh/.test(t)) return ['bac-ho']
  if (/lịch sử đảng|đảng cộng sản|xây dựng đảng/.test(t) && !/tuyên ngôn/.test(t)) return ['bua-liem']
  if (/hồ chí minh|bác hồ/.test(t)) return ['bac-ho']
  // triết học ngoài Mác - Lênin thì không đặt chân dung
  if (/phương đông|phương tây|phật|khổng|nho giáo|nho gia|hy lạp|cổ đại/.test(t)) return []
  if (/mác ?[-–] ?lê|c\. ?mác|các mác|marx|lê-?nin|lenin|triết học|biện chứng|duy vật|kinh tế chính trị|giá trị thặng dư|chủ nghĩa xã hội|tuyên ngôn/.test(t)) return ['mac', 'le-nin']
  return /đại hội đảng|của đảng|đảng ra đời|đảng lãnh đạo/.test(t) ? ['bua-liem'] : []
}

/** hình trung tính trong khung tem ở bìa khi không có chân dung phù hợp */
const chinhTriCover = (t: string): string => {
  if (/kinh tế|giá trị|hàng ho|hàng hó|tư bản|thị trường/.test(t)) return 'lua-banh-rang-do'
  if (/triết|biện chứng|duy vật|nhận thức|ý thức/.test(t)) return 'sach-but'
  if (/chủ nghĩa xã hội|giai cấp|quá độ/.test(t)) return 'bo-cau-do'
  return 'sen'
}

function chinhTri(id: string, c: SlideLayoutContent, { title, body }: Kit, standard: () => SlideElement[]): Built {
  const { background: cream, ink: red, fg, muted } = PACK_COLORS['chinh-tri']
  const gold = '#f4dc71'
  const shade = '#4d0c10'
  const head = { fontWeight: 700, caps: true, lineHeight: 1.1 }
  const long = (c.title?.length ?? 0) > 34
  const block = (n: string, x: number, y: number, w: number, h: number, fill: string, extra: Partial<SlideElement> = {}): SlideElement =>
    ({ id: n, type: 'shape', shape: 'rect', fill, border: 0, shadowLevel: 0, decor: true, ...box(x, y, w, h), ...extra })
  const paper = block('decor-kit-0', 0, 0, 1280, 720, cream, { locked: true })
  const solid = block('decor-kit-0', 0, 0, 1280, 720, red, { locked: true })
  const star = (x: number, y: number, w: number, fill: string, opacity: number) =>
    block('decor-kit-1', x, y, w, w * 0.951, fill, { shape: 'star', opacity })
  // dải chân trang tương phản với nền, dòng nguồn nằm trong dải
  const band = (fill: string) => block('decor-kit-2', 0, 650, 1280, 70, fill)
  // dòng phụ ngay dưới tiêu đề, chữ cao như tiêu đề như trong mẫu
  const sub = (b: Box, color: string, align: 'left' | 'center' | 'right' = 'left') =>
    title('kicker', upper(c.kicker), b, 46, color, { fontWeight: 600, align, valign: 'top', lineHeight: 1.15 })
  const photo = (b: Box, src = c.image) =>
    image('image-1', src, b, { imagePosition: { x: c.focusX ?? 50, y: c.focusY ?? 40 }, crop: c.imageCrop })
  // tem thư lớn bên trái, chạm mép trên
  const stamp = (name: 'tem-kem' | 'tem-do') => art(3, `chinh-tri/${name}`, 48, -2, 560)
  // hình đặt gọn trong một khung cho trước
  const fitArt = (n: number, name: string, x: number, y: number, w: number, h: number): SlideElement => {
    const [aw, ah] = ART[name]
    const width = Math.min(w, (h * aw) / ah)
    return art(n, name, x + (w - width) / 2, y + (h - (width * ah) / aw) / 2, width)
  }

  const words = `${c.kicker ?? ''} ${c.title ?? ''} ${c.subtitle ?? ''}`.normalize('NFC').toLocaleLowerCase('vi')

  switch (id) {
    case 'photo-full': {
      // slide kết: nền kem, tem đỏ
      if (!c.image && /cảm ơn|thank/.test(words)) return [
        paper,
        stamp('tem-do'),
        fitArt(4, 'chinh-tri/sen-kem', 118, 80, 420, 520),
        body('kicker', upper(c.kicker), box(640, 44, 580, 66), 30, muted, { fontWeight: 700, align: 'right' }),
        title('title', c.title, box(640, 170, 584, 280), long ? 100 : 160, red, { ...head, align: 'right', valign: 'middle' }),
        body('subtitle', c.subtitle, box(660, 470, 564, 160), 40, fg, { align: 'right', lineHeight: 1.3 }),
        c.credit ? band(red) : null,
      ]
      const figures = chinhTriFigures(words)
      const coverArt = (): SlideElement[] => {
        if (c.image) return [stamp('tem-kem'), photo(box(84, 34, 488, 622))]
        if (figures[0] === 'bua-liem') return [stamp('tem-kem'), fitArt(4, 'chinh-tri/bua-liem', 128, 130, 400, 430)]
        if (figures.length === 1) return [stamp('tem-kem'), art(4, `chinh-tri/${figures[0]}`, 86, 34, 484)]
        if (figures.length) return figures.flatMap((name, i) => [
          art(3 + i * 3, 'chinh-tri/tem-kem', 40 + i * 248, 28 + i * 240, 320),
          art(4 + i * 3, `chinh-tri/${name}`, 62 + i * 248, 50 + i * 240, 276),
        ])
        return [stamp('tem-kem'), fitArt(4, `chinh-tri/${chinhTriCover(words)}`, 118, 90, 420, 510)]
      }
      return [
        solid,
        star(760, 60, 500, shade, 0.2),
        ...coverArt(),
        body('kicker', upper(c.kicker), box(640, 44, 580, 66), 30, cream, { fontWeight: 700, align: 'right' }),
        title('title', c.title, box(630, 150, 594, 360), long ? 94 : 132, gold, { ...head, align: 'right', valign: 'middle' }),
        body('subtitle', c.subtitle, box(640, 530, 584, c.credit ? 118 : 150), 40, cream, { align: 'right', lineHeight: 1.3 }),
      ]
    }
    case 'manifesto': {
      const text = statement(c)
      return [
        solid,
        star(380, 40, 520, shade, 0.2),
        body('kicker', upper(c.kicker), box(190, 50, 900, 76), 38, gold, { fontWeight: 700, align: 'center' }),
        title('body', text, box(90, 140, 1100, 370), text.length > 150 ? 62 : text.length > 80 ? 82 : 104, cream, { ...head, caps: false, align: 'center', valign: 'middle', lineHeight: 1.2 }),
        block('divider-1', 580, 524, 120, 6, gold),
        body('author', c.author, box(190, 550, 900, 76), 40, gold, { align: 'center' }),
        band(cream),
      ]
    }
    case 'editorial-text':
      // có ảnh: nền đỏ, chữ trái, ảnh tràn mép phải
      if (c.image) return [
        solid,
        star(-60, 60, 520, shade, 0.2),
        photo(box(750, 0, 530, 650)),
        title('title', c.title, box(60, 30, 660, 180), long ? 76 : 112, gold, { ...head, valign: 'middle' }),
        sub(box(64, 212, 650, 76), cream),
        body('body', paragraphs(c), box(64, 300, 650, 336), 40, cream, { lineHeight: 1.35 }),
        band(cream),
      ]
      // không ảnh: nền kem, chữ trong khung viền, mảng đỏ bên phải
      return [
        paper,
        block('decor-kit-1', 810, 0, 470, 650, red),
        art(3, 'chinh-tri/sach-kem', 855, 150, 380),
        title('title', c.title, box(60, 20, 720, 170), long ? 72 : 108, red, { ...head, valign: 'middle' }),
        sub(box(64, 188, 710, 72), fg),
        block('divider-1', 60, 268, 710, 362, cream, { border: 3, borderColor: red }),
        body('body', paragraphs(c), box(86, 284, 660, 334), 38, fg, { lineHeight: 1.35 }),
        band(red),
      ]
    case 'rules': {
      const rows = rowsOf(c)
      if (!rows.length) return []
      const n = rows.length
      // mục lục hoặc các mốc ngắn: hình bên trái, danh sách canh phải
      if (rows.every((row) => row.value.length <= 4)) {
        const top = 236
        const h = (636 - top) / n
        return [
          paper,
          art(3, 'chinh-tri/sen', 100, 60, 378),
          title('title', c.title, box(520, 24, 704, 150), long ? 70 : 112, red, { ...head, align: 'right', valign: 'middle' }),
          sub(box(520, 162, 704, 70), fg, 'right'),
          ...rows.flatMap((row, i) => {
            const y = top + i * h
            return [
              body(`item-${i + 1}-label`, row.label, box(500, y + 2, 600, h - 4), n > 4 ? 34 : 40, fg, { align: 'right', valign: 'middle', lineHeight: 1.2, fontWeight: 600 }),
              title(`item-${i + 1}-value`, row.value, box(1112, y + 2, 112, h - 4), n > 4 ? 48 : 60, red, { ...head, caps: false, align: 'right', valign: 'middle' }),
            ]
          }),
          band(red),
        ]
      }
      const w = 1160 / n
      const size = n > 4 ? 28 : n > 3 ? 34 : n > 2 ? 38 : 44
      return [
        paper,
        star(390, 80, 500, gold, 0.25),
        title('title', c.title, box(60, 20, 1160, 156), long ? 76 : 104, red, { ...head, align: 'center', valign: 'middle' }),
        sub(box(240, 168, 800, 70), fg, 'center'),
        ...rows.flatMap((row, i) => {
          const x = 60 + i * w
          return [
            block(`divider-${i + 1}`, x + 8, 244, w - 16, 388, cream, { border: 3, borderColor: red }),
            title(`item-${i + 1}-value`, row.value, box(x + 14, 250, w - 28, 124), n > 3 ? 36 : 46, red, { ...head, caps: false, align: 'center', valign: 'middle', lineHeight: 1.15 }),
            body(`item-${i + 1}-label`, row.label, box(x + 18, 376, w - 36, 244), size, fg, { align: 'center', lineHeight: 1.3 }),
          ]
        }),
        band(red),
      ]
    }
    case 'bignum':
      // nền kem: hình bên trái, con số trong khung đè lên góc, lời giải canh phải
      return [
        paper,
        star(760, 70, 500, gold, 0.25),
        c.image ? photo(box(60, 0, 500, 560)) : fitArt(3, 'chinh-tri/lua-banh-rang-do', 120, 24, 420, 380),
        block('divider-1', 60, 400, 380, 232, cream, { border: 3, borderColor: red }),
        title('bignum-value', c.value, box(70, 410, 360, 212), 180, red, { ...head, caps: false, align: 'center', valign: 'middle', lineHeight: 1 }),
        title('bignum-label', c.label, box(600, 60, 624, 220), 112, red, { ...head, align: 'right', valign: 'middle' }),
        sub(box(600, 290, 624, 116), fg, 'right'),
        body('subtitle', c.subtitle, box(600, 424, 624, 210), 40, fg, { align: 'right', lineHeight: 1.3 }),
        band(red),
      ]
    case 'bullets': {
      const items = list(c.bullets).length ? list(c.bullets) : list(c.body?.split('\n'))
      if (!items.length) return []
      const numbered = items.every((item) => /^\d+[.)]\s/.test(item))
      const text = items.map((item) => (numbered ? item : `• ${item}`)).join('\n')
      return [
        solid,
        star(380, 60, 520, shade, 0.2),
        title('title', c.title, box(60, 20, 1160, 156), long ? 70 : 104, gold, { ...head, align: 'center', valign: 'middle' }),
        block('divider-1', 90, 192, 1100, 440, red, { border: 3, borderColor: gold, opacity: 0.92 }),
        body('bullets', text, box(130, 208, 1020, 408), text.length > 320 ? 32 : text.length > 180 ? 40 : 48, cream, { valign: 'middle', lineHeight: 1.6 }),
        band(cream),
      ]
    }
    case 'photo-compare': {
      // hai khung viền, nhãn nằm trên nền vàng ở đầu khung
      const captions = Boolean(c.caption || c.caption2)
      const top = captions ? 300 : 206
      return [
        solid,
        title('title', c.title, box(60, 20, 1160, 156), long ? 70 : 104, gold, { ...head, align: 'center', valign: 'middle' }),
        ...[60, 650].flatMap((x, i) => [
          block(`divider-${i * 2 + 1}`, x, 200, 570, 434, red, { border: 3, borderColor: gold }),
          captions ? block(`divider-${i * 2 + 2}`, x, 200, 570, 90, gold) : null,
        ]),
        image('image-1', c.image, box(74, top, 542, 624 - top), { crop: c.imageCrop }),
        image('image-2', c.image2, box(664, top, 542, 624 - top), { crop: c.image2Crop }),
        body('photo-caption', c.caption, box(70, 204, 550, 84), 34, shade, { align: 'center', valign: 'middle', lineHeight: 1.15, fontWeight: 700 }),
        body('photo-caption-2', c.caption2, box(660, 204, 550, 84), 34, shade, { align: 'center', valign: 'middle', lineHeight: 1.15, fontWeight: 700 }),
        band(cream),
      ]
    }
    case 'bars': {
      const chart = standard().filter((el) => el.id.startsWith('bar'))
      if (!chart.length) return []
      for (const el of chart) {
        el.x = 8 + (el.x - 5) * 0.93
        el.y = 33 + (el.y - 26) * 0.84
        el.w *= 0.93
        el.h *= 0.84
      }
      return [paper, title('title', c.title, box(60, 20, 1160, 180), long ? 70 : 96, red, { ...head, align: 'center', valign: 'middle' }), ...chart, band(red)]
    }
    default: {
      const elements = standard()
      return elements.length ? [paper, ...elements] : []
    }
  }
}

/* ------------------------------------------------------------------ *
 * Gạch đầu dòng, so sánh ảnh, biểu đồ cột: cùng khung và hình của bộ
 * ------------------------------------------------------------------ */
function shared(pack: SlidePackId, id: string, c: SlideLayoutContent, kit: Kit, standard: () => SlideElement[]): Built | null {
  if (id !== 'bullets' && id !== 'photo-compare' && id !== 'bars') return null
  const { title, body } = kit
  const learn: StudyId | null = isStudy(pack) ? pack : null
  const red = pack === 'co-dien'
  const { ink, fg } = PACK_COLORS[pack]
  const rule: SlideElement = { id: 'divider-1', type: 'shape', shape: 'rect', fill: ink, opacity: 0.45, border: 0, shadowLevel: 0, ...box(100, (c.title?.length ?? 0) > 36 ? 250 : 206, 120, 5) }
  const head = (): Built => learn ? studyHead(learn, c, kit) : [
    body('kicker', upper(c.kicker), box(96, 57, 700, 54), 22, red ? ink : fg, { fontWeight: red ? 700 : 800 }),
    title('title', c.title, box(96, 114, 860, 130), 52, ink, { valign: 'top' }),
    rule,
  ]
  const paper = full(learn ? `${learn}/giay` : red ? 'co-dien/tem-day' : 'dan-gian/giay-o')
  const corner = (): SlideElement =>
    learn ? fit(learn, 1, STUDY[learn].corner)
        : red ? art(1, 'co-dien/canh-tung', 900, 50, 320)
          : id === 'bars' ? art(1, 'dan-gian/sach', 1030, 0, 220) : art(1, 'dan-gian/canh-tre', 990, -40, 330)

  if (id === 'bullets') {
    const items = list(c.bullets).length ? list(c.bullets) : list(c.body?.split('\n'))
    if (!items.length) return []
    const numbered = items.every((item) => /^\d+[.)]\s/.test(item))
    const text = items.map((item) => (numbered ? item : `• ${item}`)).join('\n')
    const size = text.length > 320 ? 24 : text.length > 180 ? 28 : 34
    return [
      paper,
      ...(red
        ? [art(1, 'co-dien/hoa-sen', 905, 300, 270), art(2, 'co-dien/chim-en', 1000, 52, 150)]
        : [
            { id: 'decor-kit-8', type: 'shape', shape: 'round', fill: '#ffe9b8', radius: 28, border: 0, shadowLevel: 0, decor: true, ...box(76, 274, 820, 396) } as SlideElement,
            art(1, 'dan-gian/hoa-sen', 920, 400, 340),
            art(2, 'dan-gian/chuon-chuon', 960, 90, 170),
          ]),
      ...head(),
      body('bullets', text, red ? box(100, 278, 780, 380) : box(110, 292, 750, 360), size, red ? ink : fg, { valign: 'middle', lineHeight: 1.7 }),
    ]
  }

  if (id === 'photo-compare') {
    const captions = Boolean(c.caption || c.caption2)
    const h = captions ? 270 : 370
    const frame = red ? { border: 6, borderColor: ink }
      : learn
        ? { ...rounded(STUDY[learn].radius), border: 6, borderColor: STUDY[learn].frame, ...(STUDY[learn].tape ? { shadowLevel: 2 as const } : {}) }
        : { shape: 'round' as const, radius: 28, border: 6, borderColor: '#ffd98a' }
    return [
      paper,
      corner(),
      ...head(),
      image('image-1', c.image, box(100, 280, 525, h), { crop: c.imageCrop, ...frame }),
      image('image-2', c.image2, box(655, 280, 525, h), { crop: c.image2Crop, ...frame }),
      body('photo-caption', c.caption, box(100, 556, 525, c.credit ? 98 : 124), 28, fg, { align: 'center', lineHeight: 1.3 }),
      body('photo-caption-2', c.caption2, box(655, 556, 525, c.credit ? 98 : 124), 28, fg, { align: 'center', lineHeight: 1.3 }),
    ]
  }

  // biểu đồ cột: giữ các phần tử của bố cục thường, dời xuống dưới tiêu đề của bộ
  const chart = standard().filter((el) => el.id.startsWith('bar'))
  if (!chart.length) return []
  for (const el of chart) {
    el.x = 8 + (el.x - 5) * 0.93
    el.y = 38 + (el.y - 26) * 0.84
    el.w *= 0.93
    el.h *= 0.84
  }
  return [
    paper,
    corner(),
    ...head(),
    ...chart,
  ]
}

/** Nền / trang trí đặt dưới các bố cục còn lại. */
function backdrop(pack: SlidePackId): SlideElement[] {
  if (isStudy(pack)) return [full(`${pack}/giay`), fit(pack, 1, STUDY[pack].backdrop)]
  switch (pack) {
    case 'co-dien': return [full('co-dien/tem-day'), art(1, 'co-dien/goc-hoa-van', 44, 36, 110)]
    case 'dan-gian': return [full('dan-gian/giay-o'), art(1, 'dan-gian/chuon-chuon', 1130, 6, 110)]
    case 'su-do': return [full('su-do/giay')]
    case 'dia-li-ht': return []
    case 'chinh-tri': return []
  }
}

export function composePack(
  pack: SlidePackId,
  layoutId: string,
  content: SlideLayoutContent,
  text: Text,
  standard: () => SlideElement[],
): SlideElement[] {
  const kit = kitOf(text)
  const own = pack === 'co-dien' ? coDien(layoutId, content, kit)
    : pack === 'dan-gian' ? danGian(layoutId, content, kit)
      : pack === 'su-do' ? suDo(layoutId, content, kit, standard)
      : pack === 'dia-li-ht' ? diaLiHt(layoutId, content, kit, standard)
      : pack === 'chinh-tri' ? chinhTri(layoutId, content, kit, standard)
      : study(pack, layoutId, content, kit)
  const built = own ?? shared(pack, layoutId, content, kit, standard)
  if (built) return built.filter((el): el is SlideElement => Boolean(el))
  const elements = standard()
  if (!elements.length) return elements
  // bố cục thường tính lề theo slide trơn; khung tem lấn vào nên thu vào trong tờ giấy
  if (pack === 'co-dien') for (const el of elements) {
    el.x = 5 + el.x * 0.9
    el.y = 6 + el.y * 0.88
    el.w *= 0.9
    el.h *= 0.88
    if (el.fontSize) el.fontSize *= 0.9
  }
  // gáy sổ / đường lề bên trái
  if (pack === 'khoa-hoc' || pack === 'toan') for (const el of elements) {
    el.x = 3.5 + el.x * 0.94
    el.w *= 0.94
  }
  return [...backdrop(pack), ...elements]
}

/** Màu dòng nguồn: slide câu lớn của bộ cổ điển có chân nền đỏ. */
export function packCreditColor(pack: SlidePackId, layoutId: string, hasImage = false): string {
  // bộ Đỏ son: dòng nguồn nằm trên dải chân trang (hoặc nền đỏ ở bìa), dải kem thì chữ sẫm
  if (pack === 'chinh-tri') {
    const onCream = ['manifesto', 'bullets', 'photo-compare'].includes(layoutId) || (layoutId === 'editorial-text' && hasImage)
    return onCream ? PACK_COLORS[pack].muted : '#fbe9e0'
  }
  return pack === 'co-dien' && layoutId === 'manifesto' ? CREAM : PACK_COLORS[pack].muted
}
