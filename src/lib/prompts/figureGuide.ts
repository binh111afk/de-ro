/**
 * Chữ prompt hướng dẫn AI vẽ hình trong đề (FIGURE_GUIDE). Module thuần (không import client) để cả trình duyệt
 * lẫn server/ ghép prompt từ cùng một nguồn.
 */
import { CONTAINERS, OBJECTS, SCENE_OBJECTS } from '../objectsCatalog.js'

/** danh sách loại hình AI được chọn + cấu hình từng loại; dùng chung cho "Vẽ hình minh hoạ" và AI soạn đề */
export const FIGURE_GUIDE =
  '1) Đồ thị hàm số: {"kind":"graph","curves":["x^2-2x"],"xMin":-2,"xMax":4,"points":"M(1; -1) chiếu"}. "points" (tuỳ chọn) chấm và ghi tên điểm đề nhắc tới (cực trị, giao điểm…), mỗi dòng một điểm, thêm "chiếu" để kẻ nét đứt xuống trục; đề gọi tên điểm nào thì PHẢI có điểm đó. Mặc định không có lưới ô vuông; thêm "grid": true nếu đề cần lưới.\n' +
  '2) Bảng biến thiên của hàm số: {"kind":"vartable","expr":"x^3-3x+1","fname":"y"}\n' +
  '3) Bảng xét dấu của một biểu thức: {"kind":"signtable","expr":"(x-1)(x+2)/(x-3)"}\n' +
  '4) Hệ trục Oxy (điểm, vectơ, đường thẳng, đường tròn, miền nghiệm): {"kind":"oxy","xMin":-1,"xMax":5,"yMin":-1,"yMax":5,"items":"mỗi dòng một lệnh"}. ' +
  'Lệnh: "A(1; 2)", "M(2; 3) chiếu", "AB, BC", "vectơ AB", "vectơ u(2; 1)", "d: 2x - y + 1 = 0", "đường thẳng AB", "x = 2", "(P): y = x^2 - 2x", "đường tròn (I; 2)", "đường tròn (1; -2) 3", "x + y <= 4".\n' +
  '5) Hình học phẳng: {"kind":"geo2d","shape":"triangle|right-triangle|isosceles|equilateral|square|rectangle|parallelogram|trapezoid|rhombus|circle|inscribed-triangle|free","names":["A","B","C"],"altitude":false,"median":false,"diagonals":false,"circumcircle":false,"extras":"mỗi dòng một lệnh dựng thêm"}. ' +
  'Mẫu "free" (tự do theo toạ độ, "names":[]): trong "extras" (cũng dùng được cho các mẫu) hỗ trợ "A(0; 4)" / "M(2,5; 0)", "nhãn AB \\"4 km\\"", "kích thước BC \\"7 km\\"" (thêm trên/dưới/trái/phải), "đường BC kéo dài", "tia BC", "vectơ AB, AD" (mũi tên từ A tới B; bài vectơ, quy tắc hình bình hành / ba điểm thì vẽ các vectơ đề nhắc tới), "vectơ AC \\"u\\"" (vectơ có tên riêng). Toạ độ phải khớp đề: "vuông tại A" thì góc vuông nằm ở chính điểm A (vd A(0; 0) B(0; 3) C(4; 0)), góc đề cho (vd góc B = 60°) phải đúng số đo trên hình; tam giác vuông không cần toạ độ riêng thì dùng mẫu right-triangle (vuông tại đỉnh đầu của "names").\n' +
  '5b) Hình thực tế nét đơn (thang dựa tường, gấp giấy, đo chiều cao qua góc nhìn, mảnh vườn…): {"kind":"scene","text":"mỗi dòng một lệnh"}. Lệnh: "A(0; 0) B(4; 0) C(0; 3)" khai báo điểm (y hướng lên; tên bắt đầu _ thì ẩn nhãn, nối điểm ẩn bằng gạch: _G-_K); "AB, BC" đoạn; "ABCD" đa giác; "đứt MN" nét đứt; "kích thước AB \"15 cm\"" mũi tên kích thước; "góc ABC \"60°\"" cung góc tại B; "vuông ABC" góc vuông tại B; "nhãn AB \"?\"" chữ cạnh đoạn; "đất AB" / "tường AB" gạch chéo; "hình <vật> AB" vẽ hình vật đứng từ chân A lên đỉnh B (cao đúng AB, xoay theo AB — thang dựa tường đặt dọc đoạn thang), "hình <vật> A" đặt vật đứng tại A. Vật có sẵn: ' +
  SCENE_OBJECTS.map((id) => OBJECTS[id]).filter(Boolean).join(', ') +
  '; vật khác ghi "hình en:<tên tiếng Anh> A". Bài có cây, người, toà nhà, cột cờ, thang, thuyền… thì NÊN thêm hình vật cho dễ hình dung; đoạn đo vẫn vẽ như thường.Toạ độ gần đúng tỉ lệ số liệu đề, nhưng đoạn quá ngắn so với hình (chiều cao mắt 1,5 m bên khoảng cách 50 m…) thì vẽ to hơn tỉ lệ cho dễ nhìn; cạnh/góc đã biết dùng kích thước hoặc nhãn; cạnh cần tìm ghi \"?\" hoặc chữ, KHÔNG ghi đáp số. Góc tạo với mặt đất/tường thì PHẢI có \\"đất\\"/\\"tường\\" qua đỉnh góc làm cạnh thứ hai; đỉnh góc là chân vật (góc ở A khi \\"hình cái thang AB\\").\n' +
  '6) Hình không gian: {"kind":"geo3d","shape":"pyramid3|pyramid3-sa|pyramid3-regular|pyramid4|pyramid4-sa|pyramid4-regular|tetrahedron|prism3|box|cube|cone|cylinder|sphere","names":["S","A","B","C","D"],"height":true,"diagonals":false,"circumsphere":false,"extras":"mỗi dòng một lệnh dựng thêm"}. "circumsphere": true vẽ mặt cầu ngoại tiếp khối (hộp, lập phương, chóp/lăng trụ đều); trong "extras" có thể đặt/đổi toạ độ 3D dạng "S(1; 0,5; 2)". ' +
  'Lệnh dựng thêm (5 và 6; không dùng cho nón, trụ, cầu): "M = trung điểm SC", "N = SB 1/3", "O = AC cắt BD", "H = hình chiếu S lên (ABCD)", "K = hình chiếu A lên SB", "G = trọng tâm ABC", "O = tâm ngoại tiếp ABC", "đường cao AH", "trung tuyến AM", "MN" (nối), "đứt MN". Đề gọi tên điểm nào (trung điểm, giao điểm, tâm I…) thì PHẢI dựng điểm đó cho hiện trên hình.\n' +
  '7) Biểu đồ thống kê: {"kind":"stats","chart":"bar|line|pie|hist|table","title":"","xLabel":"","yLabel":"","data":"dòng 1: nhãn cách nhau bởi ;\\nTên dãy: số; số; ..."}. Ghép nhóm dùng nhãn "[40; 50) [50; 60)".\n' +
  '8) Đường tròn lượng giác: {"kind":"trig","angles":"mỗi dòng một lệnh","values":true|false,"cot":true|false}. Lệnh mỗi dòng: góc "pi/3", "150°"; họ nghiệm "π/4 + kπ/2"; đặt tên điểm "M: pi/6"; điểm theo toạ độ "M(1/2; √3/2)"; tô miền nghiệm "tô: [π/6 → 5π/6)" (mũi tên →, -> hoặc đến; [ ] lấy đầu mút, ( ) không lấy); đường thẳng "y = 1/2", "x = -√2/2"; nối đa giác "nối tô: M N P" (tô nhạt; "nối tô: họ" nối cả họ nghiệm); cung giữa 2 điểm "cung: M N \\"α\\"". Ví dụ: {"kind":"trig","angles":"M: pi/6\\nN: 5pi/6\\ntô: [pi/6 → 5pi/6]\\ny = 1/2","values":true}. values=true ghi giá trị cos, sin trên trục, cot=true vẽ trục cot. Đề gọi điểm M, N… thì ghi M: góc để tên hiện trên hình.\n' +
  '9) Sơ đồ cây xác suất: {"kind":"probtree","text":"mỗi dòng một nhánh \\"Tên: xác suất\\", thụt 2 dấu cách cho nhánh con"}\n' +
  '10) Trục số biểu diễn tập hợp: {"kind":"numberline","sets":"mỗi dòng một tập, vd (-2; 3] hoặc (-oo; -1) ∪ [2; 5]"}\n' +
  '11) Biểu đồ Ven: {"kind":"venn","sets":"A, B","shade":"A ∩ B","counts":"A: 5\\nAB: 3\\nB: 4"}\n' +
  '11b) Bảng ghép nhóm (tần số ghép nhóm): {"kind":"grouped","groups":"mỗi dòng một nhóm, vd \\"[150; 155): 4\\"","label":"Chiều cao (cm)","freqLabel":"Số học sinh","view":"htable","polygon":false,"extras":""}. view: "htable" bảng ngang kiểu SGK (mặc định), "vtable" bảng dọc, "hist" biểu đồ cột liền (polygon=true vẽ thêm đa giác tần số); extras (chỉ bảng): "mid,cum,rel,total" — giá trị đại diện, tần số tích luỹ, tần số tương đối %, cột/hàng Tổng. Nhóm cuối có thể là đoạn đóng [a; b]. Đề cho bảng tần số ghép nhóm thì DÙNG loại này thay cho stats.\n' +
  '12) Mạch điện: {"kind":"circuit","text":"nguồn E = 12 V, r = 1 Ω\\nR1=4Ω - (R2=6Ω // R3=3Ω)"}. "-" nối tiếp, "//" song song, ngoặc gom cụm; linh kiện theo chữ đầu: R, Rb, Đ, A, V, K, C, L, E.\n' +
  '13) Đồ thị chuyển động: {"kind":"motion","yName":"v (m/s)","tName":"t (s)","points":"(0; 0) (2; 4) (5; 4)"}\n' +
  '14) Mặt phẳng nghiêng: {"kind":"incline","angle":30,"fms":"none|up|down","F":"none|up|down"}\n' +
  '15b) Đồ thị trạng thái khí (Vật lí 12): {"kind":"gas","axes":"pV|pT|VT","states":"1: (1; 4)\\n2: (4; 1)\\n3: (4; 4)","processes":"1-2: đẳng nhiệt\\n2-3: đẳng tích\\n3-1: đẳng áp","ticks":"value|symbol|none","showStates":true|false}. Toạ độ (ngang; dọc): p–V là (V; p), p–T là (T; p), V–T là (T; V). Số liệu phải khớp quá trình (đẳng nhiệt trên p–V: p·V bằng nhau; đẳng tích trên p–T: p/T bằng nhau…); thêm "| nhãn" sau quá trình để ghi tên đường (vd "a-b: đẳng áp | p_1"), đặt showStates=false để ẩn chấm/nhãn trạng thái; ticks "symbol" ghi p₁, V₁, T₁ thay cho số.\n' +
  '15) Cấu hình electron: {"kind":"electron","element":"Fe"}\n' +
  '16) Công thức cấu tạo hữu cơ: {"kind":"struct","formula":"CH3-CH(CH3)-CH2-OH","style":"condensed|skeletal","ringStyle":"kekule|circle","number":false}. Nhánh trong ngoặc (...); điện tích cuối nhóm dùng ^+, ^-, ^2+, ^2- (vd "CH3-CH(NH3^+)-COO^-"). Mạch vòng: [benzen] hoặc C6H5 (vòng benzen), [xiclo3]…[xiclo6] (vòng no 3–6 cạnh), nhóm thế theo vị trí (1:CH3)(4:NO2). Ví dụ vòng: {"kind":"struct","formula":"[benzen]-CH=CH2","style":"condensed"} (stiren), {"kind":"struct","formula":"[benzen](1:CH3)(4:NO2)","style":"condensed"} (p-nitrotoluen), {"kind":"struct","formula":"[xiclo6]","style":"skeletal"} (xiclohexan).\n' +
  '17) Đồ thị số mol (Hoá): {"kind":"chemgraph","xName":"n CO2","yName":"n↓","points":"(0; 0) (0,2; 0,2) (0,4; 0)"}\n' +
  '18) Bảng số liệu / đối chiếu tuỳ ý: {"kind":"table","cells":"hàng 1 | ô 2 | ô 3\\nhàng 2 | a | b","header":"row|col|both|none","align":"center|left|right","merges":"","border":"all|outer|horizontal","fontSize":15}. Ô xuống dòng ghi "\\\\n" (hai kí tự) trong ô; chỉ số dùng x_1, x^2; gộp ô ghi "r1,c1:r2,c2" (vd. "1,1:1,3").\n' +
  '19) Phương trình hoá học (Hoá): {"kind":"chemeq","equations":"2KMnO4 -> K2MnO4 + MnO2 + O2 [t°]","autoBalance":false,"fontSize":17,"align":"center"}. Mũi tên ->, <=>, điều kiện [trên | dưới] (có điện tích như [-OH^- | +H^+]); nhiều mũi tên một dòng đặt [điều kiện] ngay sau mỗi mũi tên; chất cấu tạo bọc trong {...} (vd "{CH3-CH(NH3^+)-COOH} <=> [-OH^- | +H^+] {CH3-CH(NH3^+)-COO^-}"). Chỉ bật autoBalance khi dòng chỉ có 1 mũi tên và không có {...}.\n' +
  '20) Đồ thị chuyển thể (Vật lí 12 — nhiệt độ theo thời gian): {"kind":"phase","yName":"t (°C)","tName":"T (phút)","points":"(0; -45)\\nA: (15; -8,83)\\nB: (27,4; -8,83)\\nC: (40 = T_1; 0)\\n(54 = T_2; 0)\\n_(66; 16)","extend":false,"dashed":true,"dots":true}. Gốc O tự đặt tại giá trị nhỏ nhất của trục dọc; dùng "60 = T_1" để ghi kí hiệu trên trục, "_(x; y)" cho điểm kéo dài không hiện vạch trục; extend=true vẽ đoạn ngang ra mép phải sau điểm cuối.\n' +
  '21) Đồ thị dao động điều hoà (Vật lí 11): {"kind":"osc","qty":"x|v|a","A":8,"period":{"by":"T|f|omega","value":2},"start":{"by":"state","x0":"0|A|-A|A/2|-A/2|A√2/2|-A√2/2|A√3/2|-A√3/2","dir":"up|down"},"tEnd":2.5,"grid":"T/8|T/4|none","ticks":"value|symbol"}. Hoặc start theo pha: {"by":"phi","phiPi":0.5} (đơn vị π). Thêm "second":{"qty":"v","dashed":true} để vẽ đường thứ hai so pha. Dùng cho dao động điều hoà hình sin. Điện xoay chiều u-i (Vật lí 12): {"kind":"osc","mode":"ac","ac":{"U0":311.13,"I0":2,"period":{"by":"f","value":50},"phiUPi":0,"phiIPi":-0.3333,"tEnd":0.03,"grid":"T/8","ticks":"value","showPhaseDiff":true}}. Sóng dừng (Vật lí 12): {"kind":"osc","mode":"standing","standing":{"length":60,"k":3,"ends":"fixed-fixed|fixed-free","A":4,"showNodes":true,"showAntinodes":true,"showDim":true}}.\n' +
  '22) Thấu kính mỏng (Vật lí 11 — tạo ảnh qua thấu kính hội tụ / phân kì): {"kind":"lens","type":"converging|diverging","f":10,"d":30,"h":2,"rays":["parallel","center","focal"],"show2F":false,"showValues":false,"hideImage":false}. f > 0, d > 0 (cm).\n' +
  '23) Sơ đồ phả hệ (Sinh học 12): {"kind":"pedigree","text":"1: nam bt\\n2: nữ bệnh\\n1 x 2 -> 3, 4\\n3: nam bt\\n4: nữ mang gen\\nhỏi 4"}. Khai báo người "id: nam|nữ|? bt|bệnh|mang gen|chết"; vợ chồng "1 x 2" (cận huyết "1 xx 2"); con "1 x 2 -> 3, 4" (sinh đôi cùng trứng "(5 6)", khác trứng "[7 8]"); "hỏi 10" đánh dấu người hỏi; đặt tên bệnh: bệnh "mù màu".\n' +
  '24) Bảng lai Punnett (Sinh học 9 & 12): {"kind":"punnett","cross":"AaBb x Aabb"}. Tối đa 3 cặp gen phân li độc lập (khung tối đa 8x8), hỗ trợ gen liên kết giới tính (XAXa x XaY), trội không hoàn toàn, tên kiểu hình, để trống (blankGrid: true).\n' +
  '25) Chuỗi và lưới thức ăn (Sinh học): {"kind":"foodweb","text":"Cỏ -> Thỏ, Chuột\\nThỏ, Chuột -> Cáo\\nVi sinh vật: phân giải","direction":"bottom-up|left-right","nodeStyle":"box|text","showLevels":true|false,"connectDecomposers":true|false}. Mũi tên -> chỉ chiều năng lượng (thức ăn -> vật ăn); máy tự xếp bậc dinh dưỡng từ dưới lên. Dùng [A] hoặc ?A để ẩn tên loài làm câu hỏi.\n' +
  '27) Tranh đếm đồ vật (Toán tiểu học: đếm, cộng trừ, chia đều, nhân): {"kind":"objects","groups":[{"container":"basket","item":"apple","each":5,"count":3}]}. Mỗi nhóm: "count" đồ chứa giống nhau, mỗi cái có đúng "each" đồ vật; bỏ "container" thì vẽ "count" nhóm đồ vật rời, mỗi nhóm "each" cái; "label" (tuỳ chọn) ghi số trên đồ chứa, vd túi ghi "10" ("each": 0 nếu chỉ cần đồ chứa có nhãn). Tối đa 4 nhóm, mỗi đồ chứa tối đa 20 vật. Số trên hình phải khớp đề. CHỈ dùng id có sẵn — đồ vật: ' +
  Object.entries(OBJECTS).map(([id, name]) => `${id} (${name})`).join(', ') +
  '; đồ chứa: ' +
  Object.entries(CONTAINERS).map(([id, c]) => `${id} (${c.name}${c.placement === 'label' ? ', chỉ để ghi số' : ''})`).join(', ') +
  '. Vật không có trong danh sách: "item" ghi tên tiếng Việt và thêm "en" là tên tiếng Anh 1–3 từ không dấu (vd {"item":"ấm trà","en":"teapot","each":4,"count":1}); app tự vẽ thêm. Đồ chứa chỉ dùng id trong danh sách.\n' +
  '28) Đồng hồ kim: {"kind":"clock","hour":8,"minute":15}. Câu hỏi đọc giờ thì KHÔNG ghi đáp án ra chữ cạnh hình.\n' +
  '26) Đường sức điện trường / từ trường (Vật lí 11):{"kind":"field","scene":{"type":"two-charges","signs":["+","-"],"ratio":1},"lines":8,"showArrows":true,"labels":true}. scene.type: "charge" (sign:"+"|"-"), "two-charges" (signs:["+"|"-","+"|"-"], ratio), "plates", "wire" (current:"out"|"in"), "wire-side" (current:"up"|"down"), "loop" (current:"cw"|"ccw"), "solenoid" (current:"left"|"right"), "magnet" (orient:"h"|"v"). Tuỳ chọn probe:{"x":0,"y":0.6,"vector":"E"|"B"}.\n' +

  'Biểu thức dùng biến x, ^ cho luỹ thừa, sqrt(), ln, sin, cos; nhân ngầm được (2x).'

/** loại hình hợp từng môn (số mục trong FIGURE_GUIDE) — đề một môn khỏi phải gửi cả hướng dẫn mạch điện, phả hệ… */
const FIGURE_BY_SUBJECT: Array<[RegExp, string[]]> = [
  [/to[aá]n/i, ['1', '2', '3', '4', '5', '5b', '6', '7', '8', '9', '10', '11', '11b', '18', '27', '28']],
  [/v[aậ]t\s*l[ií]|m[oô]n\s*l[ý]/i, ['1', '4', '5b', '7', '12', '13', '14', '15b', '18', '20', '21', '22', '26']],
  [/ho[aá]\s*h[oọ]c|m[oô]n\s*ho[aá]/i, ['7', '15', '16', '17', '18', '19']],
  [/sinh\s*h[oọ]c|m[oô]n\s*sinh/i, ['7', '18', '23', '24', '25']],
  [/[đd][iị]a\s*l[ií]/i, ['7', '18']],
]

/**
 * FIGURE_GUIDE rút theo môn đoán từ yêu cầu. Không đoán được môn (hoặc đề nhiều môn) thì trả đủ.
 * Môn không có hình (Văn, Sử, ngoại ngữ…) vẫn trả đủ: hiếm khi dùng, không đáng rủi ro đoán sai.
 */
/** đề từ lớp 6 trở lên: không cần tranh đếm (27), đồng hồ kim (28) — hai mục dành cho tiểu học, dài ~3.000 ký tự */
const UPPER_GRADE = /l[ớo]p\s*(?:[6-9]|1[0-2])(?!\d)|thcs|thpt|t[ốo]t\s*nghi[ệe]p|tuy[ểe]n\s*sinh|[đd][ạa]i\s*h[ọo]c/i
const PRIMARY_ONLY = new Set(['27', '28'])

export function figureGuideFor(request: string): string {
  const hits = FIGURE_BY_SUBJECT.filter(([re]) => re.test(request))
  if (hits.length !== 1) return FIGURE_GUIDE
  const upper = UPPER_GRADE.test(request)
  const keep = new Set(hits[0][1].filter((id) => !(upper && PRIMARY_ONLY.has(id))))
  const lines = FIGURE_GUIDE.split('\n')
  const tail = lines.pop() ?? ''
  return lines.filter((l) => keep.has(/^(\d+b?)\)/.exec(l)?.[1] ?? '')).join('\n') + '\n' + tail
}
