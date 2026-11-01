/**
 * Icon vẽ lại bằng tay, thay bản lấy từ sheet (import-graphics.mjs áp dụng sau khi nhập).
 *
 * Icon từ sheet dồn mọi nét vào MỘT path nên phần sau không bị phần trước che — nét chồng chéo,
 * lệch, có chỗ tô hở. Ở đây mỗi bộ phận là một path tự tô + tự viền, vẽ từ sau ra trước:
 * phần vẽ sau che nét của phần vẽ trước (như xếp giấy). Khung 70×70, nét #22333B dày 3,
 * màu tô lấy theo bảng pastel của kho để đổi "màu chủ đạo" vẫn chạy (đổi theo mã màu).
 */
const INK = '#22333B'

const fill = (d, color) =>
  `<path d="${d}" fill="${color}" stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`
const line = (d, extra = '') =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"${extra}/>`
const circle = (cx, cy, r, color) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="${INK}" stroke-width="3"/>`
const dot = (cx, cy, r = 1.6) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${INK}"/>`
const svg = (...parts) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70">${parts.join('')}</svg>`

const MINT = '#BFE5DE'
const PEACH = '#F6C6A8'
const BEIGE = '#E8DCC8'
const BLUE = '#B9D4EA'
const PINK = '#F5D6E0'
const GREEN = '#C6E5B3'
const YELLOW = '#F7E6A8'
const LILAC = '#D8CFF0'
const WHITE = '#FFFFFF'

const round1 = (n) => Math.round(n * 10) / 10

/** bông tuyết: 6 nhánh, mỗi nhánh có một chữ V */
function snowflake() {
  const arms = []
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 2
    const p = (r, da = 0) => `${round1(35 + r * Math.cos(a + da))} ${round1(35 + r * Math.sin(a + da))}`
    arms.push(line(`M${p(7)}L${p(27)}`))
    // chữ V hướng ra ngoài, gốc ở r=16
    const v = (side) => {
      const b = a + side * 0.75
      return `${round1(35 + 16 * Math.cos(a) + 7 * Math.cos(b))} ${round1(35 + 16 * Math.sin(a) + 7 * Math.sin(b))}`
    }
    arms.push(line(`M${v(-1)}L${p(16)}L${v(1)}`))
  }
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3 - Math.PI / 2
    return `${round1(35 + 7 * Math.cos(a))} ${round1(35 + 7 * Math.sin(a))}`
  })
  return svg(...arms, fill(`M${hex.join('L')}Z`, BLUE))
}

/** bút chì đứng trong hộp: thân + đầu nhọn */
const pencil = (x, top, color) => fill(`M${x} 44V${top + 7}L${x + 3.5} ${top}L${x + 7} ${top + 7}V44Z`, color) + line(`M${x} ${top + 7}H${x + 7}`)

const guitar = svg(
  `<g transform="rotate(35 35 35)">`,
  fill('M32.5 6H37.5V30H32.5Z', BEIGE),
  fill('M31 2H39V8H31Z', BEIGE),
  fill('M35 24C29 24 25.5 28 25.5 33C25.5 35.5 26.5 37.5 28 39C23.5 41 21 45 21 49.5C21 57.5 27.5 63 35 63C42.5 63 49 57.5 49 49.5C49 45 46.5 41 42 39C43.5 37.5 44.5 35.5 44.5 33C44.5 28 41 24 35 24Z', PEACH),
  circle(35, 44, 4.5, BEIGE),
  line('M30 55H40'),
  '</g>',
)


/** mũi tên vòng cung: dải cung tô màu đi qua đỉnh, đầu mũi tên ở cuối bên phải */
function arcArrow() {
  const cx = 35, cy = 50, R = 25, r = 14
  // góc toán học (y hướng lên): bắt đầu 180° bên trái, kết thúc 15° bên phải
  const pt = (rad, deg) => {
    const a = (deg * Math.PI) / 180
    return `${round1(cx + rad * Math.cos(a))} ${round1(cy - rad * Math.sin(a))}`
  }
  const end = 15
  const tip = (end - 32 + 360) % 360 // đầu nhọn đi tiếp theo chiều kim đồng hồ
  const mid = (R + r) / 2
  // thân cung (dừng trước đầu nhọn 2°) rồi đầu nhọn vẽ sau, che mép thân
  const body =
    `M${pt(r, 180)}L${pt(R, 180)}A${R} ${R} 0 0 1 ${pt(R, end + 2)}` +
    `L${pt(r, end + 2)}A${r} ${r} 0 0 0 ${pt(r, 180)}Z`
  const head = `M${pt(R + 6, end)}L${pt(mid, tip)}L${pt(r - 6, end)}Z`
  return svg(fill(body, PEACH), fill(head, PEACH))
}


/** la bàn: mặt tròn, 4 vạch chính, kim hình thoi xoay 45° quanh đúng tâm */
const compass = svg(
  circle(35, 35, 27, WHITE),
  line('M35 11V15M35 55V59M11 35H15M55 35H59'),
  fill('M46.3 23.7L38.5 38.5L31.5 31.5Z', BLUE),
  fill('M23.7 46.3L31.5 31.5L38.5 38.5Z', WHITE),
  dot(35, 35, 2),
)

/** Hoa sen (hai bản) xử lý riêng trong import-graphics.mjs; còn lại ở đây. */
// trái tim cân đối: hai thuỳ tròn, đáy nhọn ở giữa; vệt sáng trắng trên thuỳ trái
const HEART_L = 'C20 47 9 37 9 25C9 16 16 10 24 10C29 10 33 13 35 17'
const HEART_R = 'C37 13 41 10 46 10C54 10 61 16 61 25C61 37 50 47 35 58'
const shine = '<path d="M16 24C16 19.5 19 16.5 23 16" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>'
const heart = svg(fill(`M35 58${HEART_L}${HEART_R}Z`, PINK), shine)
// tim vỡ: vết nứt zigzag, hai nửa tách và nghiêng ra hai bên quanh đáy
const CRACK = 'L31 27L38 35L32 44L35 58'
const brokenHeart = svg(
  `<g transform="translate(-3 1) rotate(-7 35 58)">${fill(`M35 17${CRACK}${HEART_L}Z`, PINK)}${shine}</g>`,
  `<g transform="translate(3 1) rotate(7 35 58)">${fill(`M35 17${HEART_R}L32 44L38 35L31 27Z`, PINK)}</g>`,
)


// bút bi đứng rồi xoay chéo: thân, kẹp, ngòi
const pen = svg(
  '<g transform="rotate(40 35 35)">',
  fill('M29 14Q29 9 35 9Q41 9 41 14V45H29Z', PEACH),
  line('M41 15H44.5V32'),
  line('M29 21H41'),
  fill('M29 45H41L37 55H33Z', WHITE),
  fill('M33 55H37L35 61Z', INK),
  '</g>',
)
const usb = svg(
  fill('M27 26V8H43V26Z', WHITE),
  fill('M31 13H34V18H31Z', INK),
  fill('M36 13H39V18H36Z', INK),
  fill('M27 26H43Q47 26 47 30V58Q47 62 43 62H27Q23 62 23 58V30Q23 26 27 26Z', YELLOW),
  line('M35 51V35M31 39L35 35L39 39M30 44H40'),
)
const printer = svg(
  fill('M21 26V9H49V26Z', WHITE),
  fill('M18 26H52Q57 26 57 31V45Q57 50 52 50H18Q13 50 13 45V31Q13 26 18 26Z', LILAC),
  dot(50, 33, 2),
  fill('M21 42H49V61H21Z', WHITE),
  line('M26 49H44M26 55H38'),
)
// bông lúa trĩu: thân cong + hạt dọc theo đầu bông
const tuft = (x, y) => line(`M${x} ${y}C${x} ${y - 10} ${x + 3} ${y - 15} ${x + 9} ${y - 16}`) + [[1, -11], [4, -14.5], [8, -10.5]].map(([dx, dy]) => dot(x + dx, y + dy, 2.2)).join('')
const riceField = svg(
  circle(53, 15, 7, YELLOW),
  fill('M5 34Q35 26 65 34V62H5Z', GREEN),
  line('M12 62Q24 46 35 40M35 40V62M58 62Q46 46 35 40M5 48Q16 42 26 41M65 48Q54 42 44 41'),
  tuft(13, 31), tuft(25, 28),
)
const dropper = svg(
  fill('M28 21V16Q28 7 35 7Q42 7 42 16V21Z', MINT),
  fill('M25 21H45V27H25Z', MINT),
  fill('M30 27H40V45L36.5 53H33.5L30 45Z', WHITE),
  line('M33 35V44'),
  fill('M35 57Q39 62 39 64.5Q39 68 35 68Q31 68 31 64.5Q31 62 35 57Z', MINT),
)
// bảng tuần hoàn: dáng ô đặc trưng (cột trái cao, cột phải cao, khối giữa thấp, hàng rời bên dưới)
const periodic = (() => {
  const C = 10, X = 10, Y = 8
  const cells = [[0, 0], [4, 0], [0, 1], [1, 1], [4, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3]]
  const sq = (x, y, c) => fill(`M${x} ${y}h${C}v${C}h-${C}Z`, c)
  const color = (i) => (i === 0 ? PEACH : i === 4 ? MINT : YELLOW)
  return svg(...cells.map(([i, j]) => sq(X + i * C, Y + j * C, color(i))), ...[1, 2, 3].map((i) => sq(X + i * C, 54, YELLOW)))
})()


// --- đợt bổ sung theo dáng bộ "Education Icon pack" (Figma Community), vẽ lại theo quy ước kho ---
const eLearning = svg(
  fill('M14 13H56Q59 13 59 16V45H11V16Q11 13 14 13Z', BLUE),
  fill('M35 20L49 27L35 34L21 27Z', WHITE),
  fill('M28 30.5V36Q35 40.5 42 36V30.5L35 34Z', WHITE),
  line('M49 27V34'),
  fill('M5 45H65L61 54H9Z', WHITE),
)
const videoLesson = svg(
  fill('M10 14H60Q63 14 63 17V51Q63 54 60 54H10Q7 54 7 51V17Q7 14 10 14Z', PINK),
  circle(35, 31, 10, WHITE),
  fill('M32 26L40.5 31L32 36Z', INK),
  line('M13 47H57'),
  dot(27, 47, 3),
)
const webinar = svg(
  fill('M11 10H59Q62 10 62 13V42Q62 45 59 45H11Q8 45 8 42V13Q8 10 11 10Z', MINT),
  fill('M24 45Q24 33 35 33Q46 33 46 45Z', WHITE),
  circle(35, 24, 6, WHITE),
  line('M35 45V54M24 57H46'),
)
const box = (x, y, c) => fill(`M${x} ${y}h11v11h-11Z`, c)
const tick = (x, y) => line(`M${x + 2.8} ${y + 5.8}L${x + 4.8} ${y + 7.8}L${x + 8.3} ${y + 3.3}`)
const quiz = svg(
  fill('M14 6H45L55 16V64H14Z', WHITE),
  line('M45 6V16H55'),
  box(20, 17, GREEN), tick(20, 17),
  box(20, 32, GREEN), tick(20, 32),
  box(20, 47, PINK), line('M23.5 50.5L27.5 54.5M27.5 50.5L23.5 54.5'),
  line('M37 22.5H48M37 37.5H48M37 52.5H44'),
)
const tile = (x, y) => fill(`M${x + 3} ${y}H${x + 21}Q${x + 24} ${y} ${x + 24} ${y + 3}V${y + 21}Q${x + 24} ${y + 24} ${x + 21} ${y + 24}H${x + 3}Q${x} ${y + 24} ${x} ${y + 21}V${y + 3}Q${x} ${y} ${x + 3} ${y}Z`, BLUE)
const operations = svg(
  tile(9, 9), tile(37, 9), tile(9, 37), tile(37, 37),
  line('M21 15V27M15 21H27M43 21H55M16.5 44.5L25.5 53.5M25.5 44.5L16.5 53.5M43 49H55'),
  dot(49, 43.5, 2), dot(49, 54.5, 2),
)
const research = svg(
  fill('M11 7H39L47 15V58H11Z', WHITE),
  line('M39 7V15H47M17 21H33M17 28H39M17 35H29'),
  fill('M50.5 52.5L54.5 48.5L63.5 57.5Q64 60.5 61.5 62Q59 62.5 57 60Z', PEACH),
  circle(45, 44, 11, BLUE),
  '<path d="M39 42C39.5 39.5 41.5 38 44 38" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>',
)
const schoolBuilding = svg(
  line('M35 17V5'),
  fill('M35 5H46L43 8.5L46 12H35Z', PINK),
  fill('M14 33H56V62H14Z', PEACH),
  fill('M9 34L35 17L61 34Z', PINK),
  fill('M19 41H26V48H19Z', WHITE),
  fill('M44 41H51V48H44Z', WHITE),
  fill('M30 62V49Q30 44 35 44Q40 44 40 49V62Z', WHITE),
  line('M6 62H64'),
)
const knowledge = svg(
  line('M35 3V6M18 9L20 11M52 9L50 11M12 23H15M55 23H58'),
  fill('M30 32H40V38Q40 40 38 40H32Q30 40 30 38Z', WHITE),
  circle(35, 22, 12, YELLOW),
  line('M31 22L33 26L35 22L37 26L39 22'),
  fill('M35 49Q25 43 8 45V62Q25 60 35 66Z', BLUE),
  fill('M35 49Q45 43 62 45V62Q45 60 35 66Z', BLUE),
)


// --- Toán & hình học bổ sung (40 icon) ---
/** đường tròn vẽ bằng path (test cần ≥2 path/icon; cũng tô được màu chủ đạo) */
const cp = (cx, cy, r, color) =>
  fill(`M${round1(cx - r)} ${round1(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`, color)
const ring = (cx, cy, r) => line(`M${round1(cx - r)} ${round1(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`)
const bold = (d, w = 5) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`
const dash = (d) => line(d, ' stroke-dasharray="3 4.5"')
const poly = (pts, color) => fill(`M${pts.map(([x, y]) => `${round1(x)} ${round1(y)}`).join('L')}Z`, color)
const ngon = (n, cx, cy, r, rot = -90) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  })
const rsq = (x, y, w, h, color, r = 4) =>
  fill(`M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`, color)
const card = (color) => rsq(8, 8, 54, 54, color, 6)

const pentagon = ngon(5, 35, 37.5, 27)
const hexagon = ngon(6, 35, 35, 27, 0)
const cyclicQuad = [200, 290, 15, 120].map((d) => [35 + 26 * Math.cos((d * Math.PI) / 180), 35 + 26 * Math.sin((d * Math.PI) / 180)])

const MATH_NEW = [
  // ---- toán ----
  ['math-so-sanh', 'Dấu so sánh', 'dau so sanh lon hon nho hon bang', svg(
    rsq(3, 22, 20, 26, BLUE), rsq(25, 22, 20, 26, YELLOW), rsq(47, 22, 20, 26, BLUE),
    bold('M17 29L9 35L17 41M30 31.5H40M30 38.5H40M53 29L61 35L53 41', 4))],
  ['math-phan-tram', 'Phần trăm', 'phan tram ti le phan tram giam gia', svg(
    cp(21, 21, 9, PEACH), cp(49, 49, 9, PEACH), bold('M53 13L17 57'))],
  ['math-vo-cuc', 'Vô cực', 'vo cuc vo han gioi han', svg(
    fill('M35 35C28 20 7 19 6 35C7 51 28 50 35 35Z', MINT), fill('M35 35C42 20 63 19 64 35C63 51 42 50 35 35Z', MINT))],
  ['math-so-pi', 'Số pi', 'so pi hang so duong tron', svg(
    cp(35, 35, 27, BLUE), bold('M20 25H50M29 25V50M42 25V45Q42 50 47 50'))],
  ['math-tong-sigma', 'Kí hiệu tổng', 'ki hieu tong sigma day so cong', svg(
    cp(35, 35, 27, YELLOW), bold('M47 19H23L36 35L23 51H47'))],
  ['math-tich-phan', 'Tích phân', 'tich phan giai tich dao ham nguyen ham', svg(
    cp(35, 35, 27, LILAC), bold('M45 16Q39 10 36 18L34 52Q32 60 25 55'))],
  ['math-parabol', 'Đồ thị parabol', 'do thi parabol ham so bac hai', svg(
    card(BLUE), line('M14 42H56M35 56V14'), line('M21 16Q35 80 49 16'))],
  ['math-do-thi-sin', 'Đồ thị hình sin', 'do thi hinh sin luong giac song', svg(
    card(BLUE), line('M14 35H56M17 15V55'), line('M17 35Q23 13 29 35T41 35T53 35'))],
  ['math-bieu-do-duong', 'Biểu đồ đường', 'bieu do duong thong ke xu huong', svg(
    card(YELLOW), line('M16 15V54H55'), line('M21 45L31 33L40 39L51 21'),
    cp(31, 33, 3, WHITE), cp(40, 39, 3, WHITE), cp(51, 21, 3, WHITE))],
  ['math-dong-xu', 'Đồng xu', 'dong xu xac suat tung dong xu sap ngua', svg(
    cp(44, 28, 18, YELLOW), cp(27, 43, 18, YELLOW), ring(27, 43, 11))],
  ['math-vong-quay', 'Vòng quay may mắn', 'vong quay xac suat may man con quay', svg(
    fill('M35 38V14A24 24 0 0 1 59 38Z', PINK), fill('M35 38H59A24 24 0 0 1 35 62Z', YELLOW),
    fill('M35 38V62A24 24 0 0 1 11 38Z', PINK), fill('M35 38H11A24 24 0 0 1 35 14Z', YELLOW),
    line('M35 38L47 27'), cp(35, 38, 3.5, WHITE), fill('M30.5 5H39.5L35 12Z', INK))],
  ['math-giay-o-ly', 'Giấy ô ly', 'giay o ly luoi o vuong ve hinh dien tich', svg(
    fill('M12 12H58V58H12Z', WHITE),
    fill('M23.5 23.5H35V46.5H23.5Z', PEACH), fill('M35 35H46.5V46.5H35Z', PEACH),
    line('M23.5 12V58M35 12V58M46.5 12V58M12 23.5H58M12 35H58M12 46.5H58'))],
  ['math-thuoc-day', 'Thước dây', 'thuoc day do chieu dai do dai', svg(
    fill('M38 47H63V55H38Z', WHITE), line('M45 47V50.5M51 47V51.5M57 47V50.5M63 44V58'),
    cp(29, 36, 20, YELLOW), cp(29, 36, 7, WHITE))],
  ['math-khoi-don-vi', 'Khối đơn vị', 'khoi don vi hang chuc hang tram dem so', svg(
    fill('M10 10H21V60H10Z', GREEN), line('M10 20H21M10 30H21M10 40H21M10 50H21'),
    fill('M29 27H60V58H29Z', GREEN), line('M39.3 27V58M49.7 27V58M29 37.3H60M29 47.7H60'),
    fill('M39 9H50V20H39Z', GREEN))],
  ['math-quy-luat-day', 'Quy luật dãy hình', 'quy luat day hinh lap lai tim hinh tiep theo', svg(
    cp(13, 24, 7, PINK), fill('M25 17H39V31H25Z', BLUE), fill('M45 31L52 17L59 31Z', YELLOW),
    cp(13, 48, 7, PINK), fill('M25 41H39V55H25Z', BLUE), dash('M45 41H59V55H45Z'))],
  ['math-phan-so-banh', 'Bánh phân số', 'phan so banh chia phan bang nhau ba phan tu', svg(
    fill('M35 35H9A26 26 0 0 1 35 9Z', WHITE), fill('M35 35V9A26 26 0 0 1 61 35Z', PEACH),
    fill('M35 35H61A26 26 0 0 1 35 61Z', PEACH), fill('M35 35V61A26 26 0 0 1 9 35Z', PEACH),
    line('M35 9V61M9 35H61'))],
  ['math-tap-hop', 'Tập hợp', 'tap hop phan tu ngoac nhon', svg(
    line('M24 12Q16 12 16 20V30Q16 35 10 35Q16 35 16 40V50Q16 58 24 58M46 12Q54 12 54 20V30Q54 35 60 35Q54 35 54 40V50Q54 58 46 58'),
    cp(28, 27, 4.5, PINK), cp(42, 27, 4.5, PINK), cp(35, 43, 4.5, PINK))],
  ['math-ma-tran', 'Ma trận', 'ma tran bang so hang cot', svg(
    line('M18 12H12V58H18M52 12H58V58H52'),
    ...[22, 35, 48].flatMap((y) => [24, 35, 46].map((x) => cp(x, y, 3.5, BLUE))))],
  ['math-so-do-cay', 'Sơ đồ cây', 'so do cay xac suat phan nhanh to hop', svg(
    line('M13 35L34 20M13 35L34 50M34 20L57 12M34 20L57 28M34 50L57 42M34 50L57 58'),
    cp(13, 35, 5, MINT), cp(34, 20, 5, MINT), cp(34, 50, 5, MINT),
    cp(57, 12, 4, WHITE), cp(57, 28, 4, WHITE), cp(57, 42, 4, WHITE), cp(57, 58, 4, WHITE))],
  ['math-bieu-do-phan-tan', 'Biểu đồ phân tán', 'bieu do phan tan diem du lieu thong ke tuong quan', svg(
    line('M15 11V56H59'), dash('M20 51L56 17'),
    ...[[23, 45], [28, 40], [33, 44], [38, 33], [44, 35], [48, 25], [54, 21]].map(([x, y]) => cp(x, y, 3.3, PEACH)))],
  // ---- hình học ----
  ['math-hinh-vuong', 'Hình vuông', 'hinh vuong canh bang nhau goc vuong', svg(
    fill('M16 16H54V54H16Z', BLUE), line('M16 47H23V54M35 12V20M35 50V58M12 35H20M50 35H58'))],
  ['math-hinh-thoi', 'Hình thoi', 'hinh thoi duong cheo vuong goc', svg(
    fill('M35 7L59 35L35 63L11 35Z', PINK), dash('M35 7V63M11 35H59'), line('M35 29H41V35'))],
  ['math-ngu-giac-deu', 'Ngũ giác đều', 'ngu giac deu da giac nam canh', svg(
    poly(pentagon, YELLOW), dash(`M35 37.5L${round1(pentagon[0][0])} ${round1(pentagon[0][1])}`), dot(35, 37.5, 2.2))],
  ['math-luc-giac-deu', 'Lục giác đều', 'luc giac deu da giac sau canh to ong', svg(
    poly(hexagon, GREEN), dash(hexagon.slice(0, 3).map(([x, y], i) => {
      const [ox, oy] = hexagon[i + 3]
      return `M${round1(x)} ${round1(y)}L${round1(ox)} ${round1(oy)}`
    }).join('')))],
  ['math-tam-giac-vuong', 'Tam giác vuông', 'tam giac vuong canh huyen goc vuong', svg(
    fill('M14 58V12L58 58Z', PEACH), line('M14 50H22V58'))],
  ['math-tam-giac-can', 'Tam giác cân', 'tam giac can hai canh bang nhau', svg(
    fill('M35 9L59 58H11Z', MINT), line('M20.6 32.2L26.4 35.6M43.6 35.6L49.4 32.2'))],
  ['math-hinh-elip', 'Hình elip', 'hinh elip truc lon truc nho conic', svg(
    fill('M7 35A28 18 0 1 0 63 35A28 18 0 1 0 7 35Z', LILAC), dash('M7 35H63M35 17V53'))],
  ['math-hinh-quat', 'Hình quạt', 'hinh quat tron cung tron goc o tam', svg(
    fill('M11 59H59A48 48 0 0 0 35 17.4Z', PEACH), line('M23 59A12 12 0 0 0 17 48.6'), dot(11, 59, 2.2))],
  ['math-hinh-hop-chu-nhat', 'Hình hộp chữ nhật', 'hinh hop chu nhat khoi hop the tich', svg(
    fill('M10 29H46V61H10Z', BLUE), fill('M10 29L23 16H59L46 29Z', WHITE), fill('M46 29L59 16V48L46 61Z', BLUE),
    dash('M10 61L23 48H59M23 48V16'))],
  ['math-lang-tru-tam-giac', 'Lăng trụ tam giác', 'lang tru tam giac khoi lang tru dung', svg(
    fill('M34 56L60 42L48 18L22 32Z', YELLOW), fill('M10 56L22 32L34 56Z', YELLOW),
    dash('M10 56L36 42L60 42M36 42L48 18'))],
  ['math-duong-vuong-goc', 'Đường vuông góc', 'duong thang vuong goc goc vuong', svg(
    line('M8 46H62M28 8V62'), fill('M28 38H36V46H28Z', PEACH), cp(28, 46, 3.5, PEACH))],
  ['math-goc-nhon', 'Góc nhọn', 'goc nhon do goc nho hon 90', svg(
    fill('M12 56H31A19 19 0 0 0 24.4 41.6Z', GREEN), line('M60 56H12L48 14'), dot(12, 56, 2.2))],
  ['math-goc-tu', 'Góc tù', 'goc tu do goc lon hon 90', svg(
    fill('M38 56H53A15 15 0 0 0 28.1 44.8Z', PEACH), line('M64 56H38L8 22'), dot(38, 56, 2.2))],
  ['math-tia-phan-giac', 'Tia phân giác', 'tia phan giac chia doi goc', svg(
    fill('M10 56H27A17 17 0 0 0 25 48Z', BLUE), fill('M10 56L25 48A17 17 0 0 0 19.3 41.8Z', BLUE),
    line('M62 56H10L40 10'), dash('M10 56L58 30.3'))],
  ['math-dinh-ly-pitago', 'Định lý Py-ta-go', 'dinh ly pitago tam giac vuong binh phuong canh', svg(
    fill('M8 26H26V44H8Z', PEACH), fill('M26 44H42V60H26Z', BLUE), fill('M26 26L42 44L60 28L44 10Z', YELLOW),
    fill('M26 26V44H42Z', WHITE), line('M26 39H31V44'))],
  ['math-duong-tron-noi-tiep', 'Đường tròn nội tiếp', 'duong tron noi tiep tam giac tiep xuc', svg(
    fill('M35 8L62 58H8Z', YELLOW), cp(35, 41.9, 15.8, WHITE), dot(35, 41.9, 2))],
  ['math-tu-giac-noi-tiep', 'Tứ giác nội tiếp', 'tu giac noi tiep duong tron', svg(
    cp(35, 35, 26, BLUE), poly(cyclicQuad, WHITE), ...cyclicQuad.map(([x, y]) => dot(round1(x), round1(y), 2.4)))],
  ['math-diem-duong-thang', 'Điểm và đường thẳng', 'diem duong thang doan thang tia', svg(
    line('M6 48L64 22'), cp(19, 42.2, 5, PINK), cp(51, 27.8, 5, PINK))],
  ['math-tu-dien', 'Tứ diện', 'tu dien khoi chop tam giac hinh khong gian', svg(
    dash('M8 47L62 43'), fill('M34 8L8 47L38 60Z', GREEN), fill('M34 8L38 60L62 43Z', GREEN))],
  ['math-tam-giac-dong-dang', 'Tam giác đồng dạng', 'tam giac dong dang ti so ty le', svg(
    fill('M6 58H40L16 22Z', PEACH), fill('M45 58H64L50.6 38Z', PEACH),
    line('M14.5 58A8.5 8.5 0 0 0 9.2 50.2M50.5 58A5.5 5.5 0 0 0 47.3 52.9'))],
]


// đợt 2: giải tích, tổ hợp, chia hết — chữ (log, n!) vẽ bằng nét vì kho cấm <text>
const circD = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
const PRIMES = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23])
MATH_NEW.push(
  ['math-so-du', 'Phép chia có dư', 'phep chia co du so du chia deu', svg(
    rsq(3, 9, 30, 26, BLUE), rsq(37, 9, 30, 26, BLUE),
    ...[9, 18, 27, 43, 52, 61].map((x) => cp(x, 22, 3, PEACH)),
    dash(circD(35, 52, 11)), cp(35, 52, 6, PEACH))],
  ['math-dao-ham', 'Đạo hàm', 'dao ham tiep tuyen he so goc giai tich', svg(
    card(BLUE), line('M14 52Q35 10 56 52'), bold('M12 48.8L40 20.8', 3.5), cp(24.5, 36.3, 3.5, PEACH))],
  ['math-nguyen-ham', 'Nguyên hàm', 'nguyen ham ho nguyen ham hang so c giai tich', svg(
    card(MINT), line('M14 56C26 56 30 42 38 38S50 32 56 30M14 44C26 44 30 30 38 26S50 20 56 18M14 32C26 32 30 18 38 14'))],
  ['math-logarit', 'Logarit', 'logarit log ham so mu', svg(
    cp(35, 35, 27, LILAC), bold('M17 23V47', 4), bold(circD(28, 41, 6), 4),
    bold(`${circD(45, 41, 6)}M51 35V50Q51 57 44 57Q40 57 38 55`, 4))],
  ['math-giai-thua', 'Giai thừa', 'giai thua n giai thua to hop', svg(
    cp(35, 35, 27, YELLOW), bold('M19 30V48M19 37Q19 30 26 30Q33 30 33 37V48'), bold('M46 20V37'), dot(46, 47, 3.2))],
  ['math-hoan-vi', 'Hoán vị', 'hoan vi doi cho sap xep thu tu to hop', svg(
    line('M16 33Q35 12 54 33M48.5 32L54 33L55 27.5'), line('M54 55Q35 66 16 55M21.5 57.5L16 55L16.5 61'),
    cp(14, 44, 7, PINK), cp(35, 44, 7, BLUE), cp(56, 44, 7, YELLOW))],
  ['math-to-hop', 'Tổ hợp', 'to hop chon k phan tu xac suat', svg(
    dash('M18 40A17 11 0 1 0 52 40A17 11 0 1 0 18 40Z'),
    cp(9, 40, 6, MINT), cp(27, 40, 6, PEACH), cp(43, 40, 6, PEACH), cp(61, 40, 6, MINT))],
  ['math-ucln', 'Ước chung lớn nhất', 'uoc chung lon nhat ucln uoc chung chia het', svg(
    cp(25, 35, 20, WHITE), cp(45, 35, 20, WHITE), fill('M35 17.7A20 20 0 0 1 35 52.3A20 20 0 0 1 35 17.7Z', PEACH),
    dot(35, 29, 2.4), dot(35, 41, 2.4), dot(16, 30, 2.4), dot(20, 43, 2.4), dot(53, 29, 2.4), dot(51, 42, 2.4))],
  ['math-bcnn', 'Bội chung nhỏ nhất', 'boi chung nho nhat bcnn boi chung', svg(
    line('M5 40H65'), line('M8 36Q17 18 26 36Q35 18 44 36Q53 18 62 36'), line('M8 44Q21.5 66 35 44Q48.5 66 62 44'),
    cp(8, 40, 3, WHITE), cp(26, 40, 3.5, BLUE), cp(44, 40, 3.5, BLUE), cp(35, 40, 3.5, PINK), cp(62, 40, 6, YELLOW))],
  ['math-uoc-so', 'Ước số', 'uoc so chia het chia thanh nhom bang nhau', svg(
    rsq(8, 15, 54, 40, WHITE), dash('M26 18V52M44 18V52'),
    ...[27, 43].flatMap((y) => [17, 35, 53].map((x) => cp(x, y, 5.5, PEACH))))],
  ['math-boi-so', 'Bội số', 'boi so dem cach nhay buoc tia so', svg(
    line('M5 46H65'), line('M8 42Q17 24 26 42Q35 24 44 42Q53 24 62 42'),
    cp(8, 46, 3.5, WHITE), cp(26, 46, 4, GREEN), cp(44, 46, 4, GREEN), cp(62, 46, 4, GREEN))],
  ['math-so-nguyen-to', 'Số nguyên tố', 'so nguyen to sang eratosthenes chia het', svg(
    ...Array.from({ length: 25 }, (_, i) => {
      const x = 10 + (i % 5) * 10
      const y = 10 + Math.floor(i / 5) * 10
      return fill(`M${x} ${y}h10v10h-10Z`, PRIMES.has(i + 1) ? YELLOW : WHITE)
    }))],
)


// Venn: tô mờ để thấy phần giao, viền vẽ sau cùng
const tint = (cx, cy, r, color) => `<path d="${circD(cx, cy, r)}" fill="${color}" fill-opacity="0.75"/>`
MATH_NEW.push(
  ['math-venn-3', 'Biểu đồ Venn ba tập', 'bieu do venn ba tap hop giao hop so do ven', svg(
    tint(35, 25, 17, PINK), tint(24, 44, 17, BLUE), tint(46, 44, 17, YELLOW),
    ring(35, 25, 17), ring(24, 44, 17), ring(46, 44, 17))],
  ['math-tap-con', 'Tập con', 'tap con tap hop con chua trong bieu do venn so do ven', svg(
    cp(35, 35, 27, BLUE), cp(42, 42, 13, PEACH), dot(24, 24, 2.4), dot(20, 38, 2.4), dot(40, 39, 2.4), dot(46, 46, 2.4))],
)

/** icon mới (không có trong sheet): chèn ngay sau icon `after` */
export const ADDED = [
  { after: 'class-mu-tot-nghiep', id: 'class-hoc-truc-tuyen', name: 'Học trực tuyến', category: 'class', keywords: 'hoc truc tuyen online e-learning laptop mu tot nghiep', svg: eLearning },
  { after: 'class-hoc-truc-tuyen', id: 'class-video-bai-giang', name: 'Video bài giảng', category: 'class', keywords: 'video bai giang khoa hoc online phat xem', svg: videoLesson },
  { after: 'class-video-bai-giang', id: 'class-hoi-thao-truc-tuyen', name: 'Hội thảo trực tuyến', category: 'class', keywords: 'hoi thao truc tuyen webinar hop online man hinh', svg: webinar },
  { after: 'class-hoi-thao-truc-tuyen', id: 'class-bai-trac-nghiem', name: 'Bài trắc nghiệm', category: 'class', keywords: 'bai trac nghiem kiem tra quiz dap an lua chon', svg: quiz },
  { after: 'class-bai-trac-nghiem', id: 'class-ngoi-truong', name: 'Ngôi trường', category: 'class', keywords: 'ngoi truong truong hoc toa nha co', svg: schoolBuilding },
  { after: 'class-ngoi-truong', id: 'class-tri-thuc', name: 'Tri thức', category: 'class', keywords: 'tri thuc kien thuc sach bong den y tuong hoc tap', svg: knowledge },
  { after: 'math-tam-giac', id: 'math-phep-tinh', name: 'Phép tính', category: 'math', keywords: 'phep tinh cong tru nhan chia toan hoc so hoc', svg: operations },
  { after: 'sci-kinh-lup', id: 'sci-nghien-cuu', name: 'Nghiên cứu', category: 'sci', keywords: 'nghien cuu tai lieu kinh lup tim hieu khoa hoc', svg: research },
  { after: 'feel-trai-tim', id: 'feel-trai-tim-vo', name: 'Trái tim vỡ', category: 'feel', keywords: 'trai tim vo buon that tinh dau long cam xuc', svg: brokenHeart },
]
// 40 icon toán/hình học xếp nối nhau sau icon toán cuối của sheet
MATH_NEW.reduce((after, [id, name, keywords, svg]) => {
  ADDED.push({ after, id, name, category: 'math', keywords, svg })
  return id
}, 'math-xuc-xac-2')

export const REDRAWN = {
  'class-but-bi': pen,
  'cs-usb': usb,
  'cs-may-in': printer,
  'geo-canh-dong-lua': riceField,
  'chem-ong-nho-giot': dropper,
  'chem-bang-tuan-hoan': periodic,
  'decor-trai-tim': heart,
  'feel-trai-tim': heart,
  'soc-ban-do': svg(
    fill('M8 17L24 11L46 17L62 11V53L46 59L24 53L8 59Z', MINT),
    line('M24 11V53'),
    line('M46 17V59'),
    line('M14 46C19 40 22 47 28 41S37 35 41 40', ' stroke-dasharray="0.5 5.5"'),
    fill('M53 37C49.5 33 47.5 30 47.5 27.5A5.5 5.5 0 0 1 58.5 27.5C58.5 30 56.5 33 53 37Z', PEACH),
    dot(53, 27.5),
  ),
  'art-guitar': guitar,
  'art-ghi-ta': guitar,
  'sci-kep-ong-nghiem': svg(
    fill('M10 56H40A3 3 0 0 1 43 59V62H7V59A3 3 0 0 1 10 56Z', MINT),
    line('M20 56V8'),
    line('M20 20H43'),
    fill('M44 10H56V48A6 6 0 0 1 44 48Z', WHITE),
    fill('M44 34H56V48A6 6 0 0 1 44 48Z', PINK),
    fill('M41 15H59V24H41Z', MINT),
    circle(20, 20, 3.5, MINT),
  ),
  'sci-kinh-lup': svg(
    fill('M39.5 45.5L45.5 39.5L60.5 54.5A4.24 4.24 0 0 1 54.5 60.5Z', BEIGE),
    circle(28, 28, 17, BLUE),
    line('M19 26C19.5 21.5 22.5 18.5 27 18'),
  ),
  'sci-binh-cau': svg(
    fill('M30 9V26.3A17 17 0 1 0 40 26.3V9Z', WHITE),
    `<path d="M18.1 44A17 17 0 0 0 51.9 44Z" fill="${PINK}"/>`,
    line('M30 9V26.3A17 17 0 1 0 40 26.3V9'),
    line('M18.1 44H51.9'),
    line('M27 9H43'),
    circle(30, 51, 2, WHITE),
    circle(40, 54, 1.5, WHITE),
  ),
  'sci-dna': svg(
    fill('M26.5 10.5H43.5A2.5 2.5 0 0 1 43.5 15.5H26.5A2.5 2.5 0 0 1 26.5 10.5Z', PINK),
    fill('M29 26.5H41A2.5 2.5 0 0 1 41 31.5H29A2.5 2.5 0 0 1 29 26.5Z', BLUE),
    fill('M29 38.5H41A2.5 2.5 0 0 1 41 43.5H29A2.5 2.5 0 0 1 29 38.5Z', PINK),
    fill('M26.5 54.5H43.5A2.5 2.5 0 0 1 43.5 59.5H26.5A2.5 2.5 0 0 1 26.5 54.5Z', BLUE),
    line('M46 6C46 21 24 21 24 35S46 49 46 64'),
    line('M24 6C24 21 46 21 46 35S24 49 24 64'),
  ),
  'nat-bong-tuyet': snowflake(),
  'nat-cay-thong': svg(
    fill('M31 48H39V61H31Z', BEIGE),
    fill('M35 26L55 51H15Z', GREEN),
    fill('M35 16L50 36H20Z', GREEN),
    fill('M35 6L46 23H24Z', GREEN),
  ),
  'nat-nui': svg(
    fill('M30 57L46 26L64 57Z', BLUE),
    fill('M41.6 34.5L46 26L50.4 34.5L48 33L46 36L44 33Z', WHITE),
    fill('M6 57L26 16L46 57Z', BEIGE),
    fill('M20.6 28L26 16L31.4 28L28.5 26L26 30L23.5 26Z', WHITE),
    line('M4 57H66'),
  ),
  'class-hop-but-mau': svg(
    pencil(20, 10, PINK),
    pencil(31.5, 6, YELLOW),
    pencil(43, 12, GREEN),
    fill('M15 32H55L50.5 62H19.5Z', BLUE),
    line('M17 40H53'),
  ),
  'class-may-chieu': svg(
    fill('M52 32L66 25V51L52 44Z', YELLOW),
    fill('M9 25H51A4 4 0 0 1 55 29V47A4 4 0 0 1 51 51H9A4 4 0 0 1 5 47V29A4 4 0 0 1 9 25Z', YELLOW),
    circle(42, 38, 8, BLUE),
    dot(42, 38, 2.4),
    line('M12 33H27'),
    line('M12 40H27'),
    line('M13 51V56'),
    line('M47 51V56'),
  ),
  'class-ban-ghe': svg(
    fill('M18 20H32V28H18Z', BLUE),
    fill('M5 28H45V34H5Z', BEIGE),
    line('M10 34V59'),
    line('M40 34V59'),
    fill('M58 20H64V45H58Z', BEIGE),
    fill('M47 41H64V46H47Z', BEIGE),
    line('M50 46V59'),
    line('M62 46V59'),
    line('M3 60H67'),
  ),
  'class-cong-truong': svg(
    fill('M17 21C25 11 45 11 53 21V29H17Z', GREEN),
    line('M27 21H43'),
    line('M17 36H53'),
    line('M25 36V61'),
    line('M31 36V61'),
    line('M39 36V61'),
    line('M45 36V61'),
    fill('M8 22H18V61H8Z', BEIGE),
    fill('M52 22H62V61H52Z', BEIGE),
    fill('M6 16H20V22H6Z', PEACH),
    fill('M50 16H64V22H50Z', PEACH),
    line('M3 61H67'),
  ),
  'class-kep-giay': svg(
    fill('M15 10H45L56 21V62H15Z', LILAC),
    line('M45 10V21H56'),
    line('M23 35H48'),
    line('M23 43H48'),
    line('M23 51H39'),
    line('M31 29V9A4.5 4.5 0 0 0 22 9V31A7 7 0 0 0 36 31V14'),
  ),
  'class-kep-giay-2': svg(
    fill('M12 16H58V62H12Z', BEIGE),
    line('M20 40H50'),
    line('M20 48H50'),
    line('M20 56H38'),
    fill('M23 23H47V33H23Z', WHITE),
    line('M38 30V7A4.5 4.5 0 0 0 29 7V32A7 7 0 0 0 43 32V12'),
  ),
  'people-bat-tay': svg(
    fill('M15 26L30 20C33 19 37 19 39 20L55 26L50 39L42 47C40 49 37 49 35 47L21 38Z', PEACH),
    line('M30 20C33 24.5 37.5 25.5 42 24'),
    line('M37 31L44 38'),
    line('M33 34L39.5 40.5'),
    line('M29 36.5L35 42.5'),
    fill('M3 30L15 24L22 38L10 44Z', BLUE),
    fill('M67 30L55 24L49 38L60 44Z', GREEN),
  ),
  'people-thi-nghiem': svg(
    fill('M13 62V44C13 36 18.5 31 26 31C33.5 31 39 36 39 44V62Z', GREEN),
    circle(26, 19, 7.5, PEACH),
    fill('M46 34V43L39 57C37.5 60 39 62.5 42 62.5H56C59 62.5 60.5 60 59 57L52 43V34Z', WHITE),
    `<path d="M41.5 52H56.5L59 57C60.5 60 59 62.5 56 62.5H42C39 62.5 37.5 60 39 57Z" fill="${PINK}"/>`,
    line('M46 34V43L39 57C37.5 60 39 62.5 42 62.5H56C59 62.5 60.5 60 59 57L52 43V34'),
    line('M41.5 52H56.5'),
    line('M44 34H54'),
  ),
  'people-cham-bai': svg(
    fill('M7 56V41C7 33 13 28.5 21 28.5C29 28.5 35 33 35 41V56Z', BLUE),
    circle(21, 17, 7.5, PEACH),
    fill('M40 14H60V50H40Z', WHITE),
    line('M44 20H56'),
    line('M44 26H52'),
    line('M44 36L48 40L56 31'),
    fill('M3 52H67V58H3Z', BEIGE),
  ),
  'people-phu-huynh-con': svg(
    fill('M10 62V37C10 29 15.5 24.5 23 24.5C30.5 24.5 36 29 36 37V62Z', BLUE),
    circle(23, 14, 7.5, PEACH),
    fill('M40 62V48C40 42 43.5 38.5 49 38.5C54.5 38.5 58 42 58 48V62Z', GREEN),
    circle(49, 30, 5.5, PEACH),
    line('M36 45C38 48 39.5 49 41 49'),
    line('M4 62H66'),
  ),
  'people-doc-sach': svg(
    fill('M16 62V41C16 32 24 27.5 35 27.5C46 27.5 54 32 54 41V62Z', PINK),
    circle(35, 15, 7.5, PEACH),
    fill('M35 41C29 37 21.5 37 14 39V57C21.5 55 29 55 35 59C41 55 48.5 55 56 57V39C48.5 37 41 37 35 41Z', WHITE),
    line('M35 41V59'),
    line('M19 44C23 43.5 27 43.5 30 45'),
    line('M51 44C47 43.5 43 43.5 40 45'),
  ),
  'people-hoc-sinh-gio-tay': svg(
    // tay mọc từ vai phải: vẽ tay trước, thân đè lên chân tay để nét nối liền
    fill('M42.9 46.9L49.9 14.9A4 4 0 0 0 42.1 13.1L35.1 45.1Z', BLUE),
    circle(46, 11, 5, PEACH),
    fill('M16 62V49C16 41 22.5 36.5 30 36.5C37.5 36.5 44 41 44 49V62Z', BLUE),
    circle(30, 24, 7.5, PEACH),
  ),
  'his-voi-chien': svg(
    fill('M28 39H35V57H28Z', BEIGE),
    fill('M39 39H46V57H39Z', BEIGE),
    fill('M50 39H57V57H50Z', BEIGE),
    line('M61 31C64 33 64.5 37 63 40'),
    fill('M23 30C23 22 31 18.5 41 18.5C53 18.5 61 23.5 61 33C61 40 57 45 50 45H31C26 45 23 40 23 34Z', BEIGE),
    // bành trên lưng: thùng + mái nhọn (không cột cờ — nhìn như cây đèn)
    fill('M36 11H54V20H36Z', PEACH),
    fill('M33 11L45 3.5L57 11Z', PINK),
    fill('M14 23C14 16.5 19 12 25.5 12C32 12 35.5 17 35.5 24C35.5 31 31.5 35.5 25.5 35.5C23.5 35.5 21.5 34.5 20.5 33.5C18.5 40.5 18 47 13.5 51C11.5 52.5 8.5 50.5 9.5 48.5C12.5 44 14 38 14 31.5Z', BEIGE),
    fill('M25 17C30 15.5 34 19.5 33 25.5C32 29.5 28 30 26 28Z', PINK),
    dot(19.5, 21.5),
    line('M22 33.5C23 37 26 38.5 29 37.5'),
  ),
  'his-mu-chien-binh': svg(
    // chùm lông ngắn trên đỉnh, mũ tròn, vành bằng đúng bề ngang mũ, hai miếng che má ôm khuôn mặt
    fill('M35 6C41 7 44 12 42.5 19H27.5C26 12 29 7 35 6Z', PINK),
    fill('M14 42C14 28 23 18.5 35 18.5C47 18.5 56 28 56 42Z', BEIGE),
    fill('M14 42H25V57C18.5 57 14 52.5 14 47Z', BEIGE),
    fill('M56 42H45V57C51.5 57 56 52.5 56 47Z', BEIGE),
    fill('M12 37H58V44H12Z', PEACH),
    line('M35 18.5V37'),
    dot(20, 40.5),
    dot(35, 40.5),
    dot(50, 40.5),
  ),
  'arrow-vong-cung': arcArrow(),
  'soc-la-ban': compass,
  'geo-la-ban': compass,
}
