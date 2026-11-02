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

// --- khoa học bổ sung (20 icon) ---
const polar = (cx, cy, r, deg) => [round1(cx + r * Math.cos((deg * Math.PI) / 180)), round1(cy + r * Math.sin((deg * Math.PI) / 180))]
// sao 4 cánh bầu: điểm điều khiển lệch khỏi tâm 30% để cánh đủ rộng, không thành nét đen
const sparkle = (cx, cy, r, color) => {
  const k = round1(r * 0.3)
  return fill(`M${cx} ${cy - r}Q${cx + k} ${cy - k} ${cx + r} ${cy}Q${cx + k} ${cy + k} ${cx} ${cy + r}Q${cx - k} ${cy + k} ${cx - r} ${cy}Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`, color)
}
/** cánh quạt hình vành khuyên (r1→r2, từ a đến a+span độ) */
const annular = (cx, cy, r1, r2, a, span, color) => {
  const [x1, y1] = polar(cx, cy, r2, a), [x2, y2] = polar(cx, cy, r2, a + span)
  const [x3, y3] = polar(cx, cy, r1, a + span), [x4, y4] = polar(cx, cy, r1, a)
  return fill(`M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`, color)
}
const virusSpikes = [0, 45, 90, 135, 180, 225, 270, 315]
const constellation = [[10, 50], [22, 36], [35, 40], [45, 24], [59, 15], [52, 50]]

const SCI_NEW = [
  ['sci-virus', 'Vi-rút', 'virus vi rut vi khuan mam benh dich benh', svg(
    line(virusSpikes.map((d) => { const [a, b] = polar(35, 35, 16, d), [c, e] = polar(35, 35, 23, d); return `M${a} ${b}L${c} ${e}` }).join('')),
    ...virusSpikes.map((d) => { const [x, y] = polar(35, 35, 25, d); return cp(x, y, 3, GREEN) }),
    cp(35, 35, 16, GREEN), cp(30, 31, 3, WHITE), cp(40, 39, 3.5, WHITE), cp(40, 28, 2, WHITE))],
  ['sci-dia-petri', 'Đĩa Petri', 'dia petri nuoi cay vi khuan thi nghiem sinh hoc', svg(
    fill('M7 34V42A28 11 0 0 0 63 42V34Z', WHITE), fill('M7 34A28 11 0 1 0 63 34A28 11 0 1 0 7 34Z', MINT),
    cp(23, 34, 3.5, PEACH), cp(37, 30, 2.6, YELLOW), cp(47, 36, 4, PEACH), cp(32, 39, 2.2, YELLOW))],
  ['sci-ao-blouse', 'Áo blouse', 'ao blouse ao thi nghiem nha khoa hoc phong thi nghiem', svg(
    fill('M23 11H47L60 22L55 31L51 27V61H19V27L15 31L10 22Z', WHITE), fill('M28 11L35 25L42 11Z', BLUE),
    line('M35 25V61'), fill('M41 38H50V46H41Z', BLUE), line('M44 38V33'), dot(31, 34, 1.8), dot(31, 44, 1.8))],
  ['sci-mat-trang', 'Mặt Trăng', 'mat trang ve tinh trai dat mieng ho thien van', svg(
    cp(35, 35, 25, YELLOW), cp(27, 28, 5, WHITE), cp(44, 42, 6.5, WHITE), cp(43, 23, 3, WHITE), cp(26, 46, 3, WHITE))],
  ['sci-sao-choi', 'Sao chổi', 'sao choi thien van vu tru duoi sao', svg(
    fill('M10 39Q36 18 59 9Q46 34 31 60Z', BLUE), line('M33 34L50 19M36 45L52 28'), cp(21, 49, 10, YELLOW))],
  ['sci-ve-tinh', 'Vệ tinh', 've tinh nhan tao quy dao vu tru lien lac', svg(
    '<g transform="rotate(-30 35 35)">',
    fill('M5 30H22V40H5Z', BLUE), fill('M48 30H65V40H48Z', BLUE), line('M13.5 30V40M56.5 30V40M22 35H28M42 35H48M35 27V21'),
    fill('M28 27H42V43H28Z', WHITE), fill('M27 21Q35 28 43 21Z', WHITE),
    '</g>')],
  ['sci-hoa-thach', 'Hoá thạch', 'hoa thach oc amonit co sinh vat dia chat', svg(
    cp(38, 36, 22, BEIGE), line('M35 36A3 3 0 0 1 41 36A6 6 0 0 1 29 36A9 9 0 0 1 47 36A12 12 0 0 1 23 36A15 15 0 0 1 53 36'))],
  ['sci-phich-cam', 'Phích cắm điện', 'phich cam dien o cam nang luong dien', svg(
    fill('M26 13H31V31H26Z', WHITE), fill('M39 13H44V31H39Z', WHITE),
    fill('M21 30H49V43Q49 53 39 53H31Q21 53 21 43Z', YELLOW), line('M35 53V58Q35 63 41 63H60'))],
  ['sci-robot', 'Rô-bốt', 'robot ro bot tu dong hoa tri tue nhan tao lap trinh', svg(
    line('M35 19V12M35 45V50'), cp(35, 9, 3.2, PINK),
    fill('M13 27H18V38H13Z', BLUE), fill('M52 27H57V38H52Z', BLUE), rsq(18, 19, 34, 26, BLUE),
    cp(28, 31, 4.2, WHITE), cp(42, 31, 4.2, WHITE), line('M29 39H41'), rsq(23, 50, 24, 14, BLUE))],
  ['sci-mu-phi-hanh-gia', 'Mũ phi hành gia', 'mu phi hanh gia du hanh vu tru nasa', svg(
    cp(35, 33, 24, WHITE), fill('M19 29Q19 19 35 19Q51 19 51 29V35Q51 45 35 45Q19 45 19 35Z', BLUE),
    '<path d="M24 29C24.5 26 27 24 30 23.5" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>',
    rsq(17, 53, 36, 10, BLUE, 3))],
  ['sci-trong-luc', 'Trọng lực', 'trong luc luc hap dan qua tao roi newton', svg(
    line('M9 24V52M4.5 47L9 52L13.5 47'),
    '<g transform="translate(5 2)">',
    fill('M38 22Q44 13 51 17Q45 24 38 22Z', GREEN), line('M35 30Q35 22 38 17'),
    fill('M35 30C27 24 16 28 16 40C16 52 26 60 35 56C44 60 54 52 54 40C54 28 43 24 35 30Z', PINK),
    '</g>')],
  ['sci-am-thanh', 'Âm thanh', 'am thanh song am loa tieng dong vat li', svg(
    fill('M8 27H18L32 15V55L18 43H8Z', PEACH), line('M41 27Q46 35 41 43M48 21Q56 35 48 49M55 15Q65 35 55 55'))],
  ['sci-so-thi-nghiem', 'Sổ thí nghiệm', 'so thi nghiem ghi chep bao cao thuc hanh', svg(
    rsq(15, 7, 42, 56, YELLOW), fill('M31 22V31L24 45H48L41 31V22Z', WHITE), line('M29 22H43M27 39H45'),
    line('M10 15H19M10 25H19M10 35H19M10 45H19M10 55H19'))],
  ['sci-bien-canh-bao', 'Biển cảnh báo', 'bien canh bao nguy hiem an toan phong thi nghiem', svg(
    fill('M35 8L63 58H7Z', YELLOW), bold('M35 26V41', 4.5), dot(35, 49.5, 3))],
  ['sci-binh-chua-chay', 'Bình chữa cháy', 'binh chua chay cuu hoa an toan phong chay', svg(
    line('M31 13Q18 14 16 30V42M39 12H51'), fill('M31 9H39V18H31Z', WHITE),
    fill('M24 25Q24 18 31 18H39Q46 18 46 25V62H24Z', PINK), fill('M24 34H46V46H24Z', WHITE))],
  ['sci-phong-xa', 'Phóng xạ', 'phong xa hat nhan nguy hiem nang luong nguyen tu', svg(
    cp(35, 35, 27, YELLOW), annular(35, 35, 8, 21, -120, 60, INK), annular(35, 35, 8, 21, 0, 60, INK),
    annular(35, 35, 8, 21, 120, 60, INK), cp(35, 35, 4, INK))],
  ['sci-cau-tao-trai-dat', 'Cấu tạo Trái Đất', 'cau tao trai dat vo trai dat lop man loi dia chat', svg(
    cp(35, 35, 26, BLUE), fill('M13 40Q17 30 25 34Q30 44 22 52Q13 50 13 40Z', GREEN), fill('M30 54Q38 50 44 56Q38 61 30 54Z', GREEN),
    fill('M35 35V9A26 26 0 0 1 61 35Z', PEACH), fill('M35 35V18A17 17 0 0 1 52 35Z', YELLOW),
    fill('M35 35V27A8 8 0 0 1 43 35Z', PINK))],
  ['sci-chom-sao', 'Chòm sao', 'chom sao ngoi sao thien van bau troi dem', svg(
    line(`M${constellation.slice(0, 5).map(([x, y]) => `${x} ${y}`).join('L')}M35 40L52 50`),
    ...constellation.map(([x, y], i) => sparkle(x, y, i % 2 ? 8.5 : 7, YELLOW)))],
  ['sci-he-mat-troi', 'Hệ Mặt Trời', 'he mat troi quy dao hanh tinh thien van vu tru', svg(
    dash(circD(35, 35, 16)), dash(circD(35, 35, 27)), cp(35, 35, 8, YELLOW),
    cp(...polar(35, 35, 16, -40), 3.8, BLUE), cp(...polar(35, 35, 27, 150), 5, PEACH))],
  ['sci-cay-trong-chau', 'Cây trong chậu', 'cay trong chau thi nghiem trong cay quang hop sinh truong', svg(
    line('M35 40V20'), fill('M35 31Q24 31 20 21Q32 18 35 31Z', GREEN), fill('M35 25Q46 25 50 15Q38 12 35 25Z', GREEN),
    fill('M22 45H48L45 62H25Z', PEACH), fill('M19 40H51V46H19Z', PEACH))],
]
SCI_NEW.reduce((after, [id, name, keywords, svg]) => {
  ADDED.push({ after, id, name, category: 'sci', keywords, svg })
  return id
}, 'sci-binh-cau')

// --- thiên nhiên bổ sung (20 icon) ---
const ellipseD = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`
/** hoa 5 cánh tròn + nhuỵ */
const blossom = (cx, cy, color) =>
  [0, 72, 144, 216, 288].map((d) => { const [x, y] = polar(cx, cy, 5, d - 90); return cp(x, y, 4, color) }).join('') + cp(cx, cy, 2.6, YELLOW)
const sunflowerPetals = Array.from({ length: 12 }, (_, i) => polar(35, 27, 14, i * 30))
const starfish = Array.from({ length: 10 }, (_, i) => polar(35, 37, i % 2 ? 11 : 27, i * 36 - 90))

const NAT_NEW = [
  ['nat-thac-nuoc', 'Thác nước', 'thac nuoc dong nuoc vach da thien nhien', svg(
    fill('M24 16H46V54H24Z', BLUE), line('M30 22V46M38 24V50'),
    fill('M6 18Q15 11 26 17V62H6Z', GREEN), fill('M44 17Q55 11 64 18V62H44Z', GREEN),
    fill('M13 55Q35 48 57 55Q57 63 35 63Q13 63 13 55Z', BLUE))],
  ['nat-xuong-rong', 'Xương rồng', 'xuong rong sa mac cay chiu han', svg(
    fill('M29 36H22Q18 36 18 32V24Q18 20 21.5 20Q25 20 25 24V30H29Z', GREEN),
    fill('M41 30H47V22Q47 18 50.5 18Q54 18 54 22V30Q54 36 48 36H41Z', GREEN),
    fill('M29 50V16Q29 10 35 10Q41 10 41 16V50Z', GREEN), line('M33 19V23M37 29V33M33 39V43'),
    fill('M23 50H47L44 63H26Z', PEACH))],
  ['nat-cay-dua', 'Cây dừa', 'cay dua dao bien nhiet doi bai bien', svg(
    line('M4 62H66'), fill('M10 61Q35 48 60 61Z', BEIGE),
    fill('M33 55Q30 37 38 19L42 20Q36 37 39 55Z', PEACH),
    fill('M40 18Q30 6 13 12Q28 15 40 18Z', GREEN), fill('M40 18Q52 6 65 14Q52 15 40 18Z', GREEN),
    fill('M40 18Q26 21 17 34Q30 26 40 18Z', GREEN), fill('M40 18Q54 21 60 34Q50 26 40 18Z', GREEN))],
  ['nat-huong-duong', 'Hoa hướng dương', 'hoa huong duong mat troi hat huong duong', svg(
    line('M35 37V64'), fill('M35 54Q24 54 19 45Q30 42 35 54Z', GREEN),
    ...sunflowerPetals.map(([x, y]) => cp(x, y, 6, YELLOW)), cp(35, 27, 10, PEACH),
    dot(31, 24, 1.6), dot(38, 25, 1.6), dot(34, 31, 1.6))],
  ['nat-nhieu-may', 'Trời nhiều mây', 'troi nhieu may thoi tiet mat troi may', svg(
    line('M44 5V9M58 10L55.5 12.5M63 24H59M30 10L32.5 12.5'), cp(44, 24, 12, YELLOW),
    fill('M16 54Q7 54 7 46Q7 38 16 38Q17 29 26 29Q34 29 37 36Q41 33 46 35Q53 37 53 45Q59 46 59 50Q59 54 54 54Z', WHITE))],
  ['nat-cay-mua-thu', 'Cây mùa thu', 'cay mua thu la vang la rung', svg(
    fill('M31 62V38H39V62Z', BEIGE),
    fill('M35 7Q48 7 50 19Q60 23 56 33Q54 43 42 41H28Q16 43 14 33Q10 23 20 19Q22 7 35 7Z', PEACH),
    fill('M50 52Q54 47 59 51Q54 56 50 52Z', YELLOW), fill('M10 56Q14 51 19 55Q14 60 10 56Z', YELLOW))],
  ['nat-da-chong', 'Đá chồng', 'da chong hon da cuoi thang bang', svg(
    fill(ellipseD(35, 54, 19, 8), BEIGE), fill(ellipseD(35, 40, 13, 6.5), BEIGE), fill(ellipseD(35, 28.5, 8, 5), BEIGE),
    line('M8 62H62'))],
  ['nat-vo-so', 'Vỏ sò', 'vo so bien bai bien hai san', svg(
    fill('M29 55H41L38 62H32Z', PEACH), fill('M35 56L11 30Q12 11 35 9Q58 11 59 30Z', PEACH),
    line('M35 56L21 14M35 56V9M35 56L49 14M35 56L12 25M35 56L58 25'))],
  ['nat-san-ho', 'San hô', 'san ho dai duong bien rang san ho', svg(
    `<path d="M35 60V40M35 46L22 32V18M22 32L14 24M35 40L48 28V14M48 28L56 20M35 52L46 46" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<path d="M35 60V40M35 46L22 32V18M22 32L14 24M35 40L48 28V14M48 28L56 20M35 52L46 46" fill="none" stroke="${PINK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    fill('M16 63Q35 53 54 63Z', PINK))],
  ['nat-bui-co', 'Bụi cỏ', 'bui co co xanh dong co thao moc', svg(
    fill('M12 60Q16 42 9 28Q22 40 23 60Z', GREEN), fill('M44 60Q52 44 62 38Q56 50 56 60Z', GREEN),
    fill('M33 60Q40 36 50 22Q46 44 45 60Z', GREEN), fill('M22 60Q26 34 22 14Q38 34 34 60Z', GREEN),
    line('M5 61H65'))],
  ['nat-hoa-tulip', 'Hoa tulip', 'hoa tulip hoa mua xuan', svg(
    line('M35 40V64'), fill('M35 60Q22 56 20 42Q32 46 35 60Z', GREEN), fill('M35 58Q48 54 50 40Q38 44 35 58Z', GREEN),
    fill('M22 15L28.5 22L35 12L41.5 22L48 15V29Q48 42 35 42Q22 42 22 29Z', PINK))],
  ['nat-ho-nuoc', 'Hồ nước', 'ho nuoc ao ho dam lay co lau', svg(
    fill(ellipseD(35, 48, 29, 11), BLUE), line('M20 48H32M39 52H49'),
    line('M54 42V17M61 44V23M47 40V28'),
    fill('M52 17Q54 10 56 17V25Q54 28 52 25Z', BEIGE), fill('M59 23Q61 16 63 23V31Q61 34 59 31Z', BEIGE))],
  ['nat-bang-troi', 'Tảng băng trôi', 'tang bang troi bac cuc nam cuc bien bang', svg(
    fill('M17 31H55L60 45L48 61H26L13 45Z', BLUE), fill('M23 31L31 16L37 22L44 11L51 31Z', WHITE), line('M4 31H66'))],
  ['nat-qua-thong', 'Quả thông', 'qua thong cay thong rung mua dong', svg(
    line('M35 14V8M35 8L24 4M35 8L28 2M35 8L46 4M35 8L42 2'),
    fill('M35 62Q20 52 20 35Q20 19 35 14Q50 19 50 35Q50 52 35 62Z', PEACH),
    line('M27 22Q31 27 35 22Q39 27 43 22M21 32Q25 37 28 32Q31.5 37 35 32Q38.5 37 42 32Q45 37 49 32M21 42Q25 47 28 42Q31.5 47 35 42Q38.5 47 42 42Q45 47 49 42M25 52Q28.5 56 32 52Q35 56 38 52Q41.5 56 45 52'))],
  ['nat-to-chim', 'Tổ chim', 'to chim trung chim lam to', svg(
    fill(ellipseD(26, 35, 7, 9), BLUE), fill(ellipseD(48, 36, 7, 9), BLUE), fill(ellipseD(37, 32, 7, 9), BLUE),
    fill('M7 40H63Q61 59 35 59Q9 59 7 40Z', BEIGE), line('M13 46Q35 53 57 46M18 53Q35 57 52 53'))],
  ['nat-oc-sen', 'Ốc sên', 'oc sen con oc cham chap', svg(
    line('M13 34L10 25M17 34L20 25'), dot(10, 24, 2.2), dot(20, 24, 2.2),
    fill('M10 54V40Q10 33 15 33Q20 33 20 40V46H54Q61 48 63 54Z', GREEN),
    cp(41, 33, 15, PEACH), line('M41 33A2.5 2.5 0 0 1 46 33A5 5 0 0 1 36 33A7.5 7.5 0 0 1 51 33A10 10 0 0 1 31 33'))],
  ['nat-hoa-dao', 'Hoa đào', 'hoa dao tet mua xuan canh dao', svg(
    line('M7 61Q28 48 38 30Q44 19 60 10M29 46Q40 45 50 53'),
    blossom(38, 29, PINK), blossom(57, 13, PINK), blossom(49, 51, PINK), blossom(20, 53, PINK))],
  ['nat-dong-co', 'Đồng cỏ', 'dong co doi xanh thao nguyen phong canh', svg(
    cp(18, 17, 7, YELLOW), fill('M4 44Q22 26 42 40Q54 32 66 38V62H4Z', GREEN), line('M51 36V27'), cp(51, 23, 6, GREEN),
    fill('M4 52Q32 40 66 54V62H4Z', MINT))],
  ['nat-loc-xoay', 'Lốc xoáy', 'loc xoay voi rong gio xoay thien tai', svg(
    fill('M8 12H62Q60 20 50 24Q45 33 40 40Q38 50 36 62Q32 50 30 40Q22 31 19 24Q10 20 8 12Z', LILAC),
    line('M15 18Q35 24 55 18M23 28Q35 32 47 28M28 36Q35 39 42 36M31 46Q35 48 39 46'))],
  ['nat-sao-bien', 'Sao biển', 'sao bien bien dai duong sinh vat bien', svg(
    poly(starfish, PEACH), ring(35, 37, 4), dot(35, 25, 1.6), dot(45, 34, 1.6), dot(41, 45, 1.6), dot(29, 45, 1.6), dot(25, 34, 1.6))],
]
NAT_NEW.reduce((after, [id, name, keywords, svg]) => {
  ADDED.push({ after, id, name, category: 'nat', keywords, svg })
  return id
}, 'nat-binh-minh-bien')

// --- ngữ văn bổ sung (30 icon) ---
const stampHoles = [
  ...[15, 21, 27, 33, 39, 45, 51].flatMap((x) => [[x, 8], [x, 62]]),
  ...[14, 20, 26, 32, 38, 44, 50, 56].flatMap((y) => [[12, y], [58, y]]),
].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#FFFFFF"/>`)

const LIT_NEW = [
  ['lit-but-long-ngong', 'Bút lông ngỗng', 'but long ngong lo muc viet van sang tac co dien', svg(
    fill('M23 45Q29 21 59 6Q51 31 31 45Z', WHITE), line('M25 45L50 17'),
    fill('M18 39H30V46H18Z', BLUE), rsq(13, 46, 22, 16, BLUE, 3))],
  ['lit-but-may', 'Bút máy', 'but may ngoi but viet chu dep luyen chu', svg(
    '<g transform="rotate(40 35 35)">',
    fill('M30 22L35 7L40 22Z', YELLOW), line('M35 12V18'),
    rsq(29, 22, 12, 40, BLUE, 3), line('M29 28H41M41 32H44V48'),
    '</g>')],
  ['lit-cay-da', 'Cây đa', 'cay da lang que dinh lang chu cuoi', svg(
    fill('M29 40Q30 51 23 62H47Q40 51 41 40Z', BEIGE),
    fill('M10 34Q8 22 20 20Q24 10 35 12Q46 8 52 18Q63 20 60 32Q62 41 52 41H18Q8 41 10 34Z', GREEN),
    line('M20 41V50M50 41V53M26 41V46'))],
  ['lit-gieng-nuoc', 'Giếng nước', 'gieng nuoc gieng lang que huong', svg(
    line('M18 40V15M52 40V15M35 11V29'), fill('M12 17L35 6L58 17Z', PEACH),
    fill('M31 29H39L38 35H32Z', PEACH),
    fill('M16 40H54V61H16Z', BEIGE), line('M16 50H54M28 40V50M42 50V61'), fill(ellipseD(35, 40, 19, 5), BLUE))],
  ['lit-ao-dai', 'Áo dài', 'ao dai trang phuc truyen thong viet nam', svg(
    // quần trắng lộ hai bên, thân ôm + vạt trước dài thuôn xuống gót
    fill('M22 40L17 63H28L35 50L42 63H53L48 40Z', WHITE),
    fill('M27 11H43L53 18L59 31L53 33L48 24V40H46.5L43 63H27L23.5 40H22V24L17 33L11 31L17 18Z', PINK),
    fill('M30 6H40V11H30Z', PINK), line('M35 11L41 17'))],
  ['lit-chiec-luoc', 'Chiếc lược', 'chiec luoc chiec luoc nga ky vat', svg(
    line([15, 20, 25, 30, 35, 40, 45, 50, 55].map((x) => `M${x} 34V52`).join('')),
    rsq(9, 21, 52, 14, BEIGE, 7), dot(35, 28, 2))],
  ['lit-thuyen-giay', 'Thuyền giấy', 'thuyen giay tuoi tho uoc mo gap giay', svg(
    fill('M35 12L48 40H22Z', YELLOW), fill('M6 40H64L52 54H18Z', YELLOW), line('M35 12V40'),
    line('M4 61Q12 57 20 61T36 61T52 61T68 61'))],
  ['lit-bep-lua', 'Bếp lửa', 'bep lua noi com bep que ba chau', svg(
    line('M20 24L13 63M50 24L57 63M35 30V34'),
    fill('M35 60Q22 54 26 42Q30 48 32 44Q30 34 38 28Q36 38 44 42Q48 54 35 60Z', PEACH),
    fill('M17 12H53Q53 30 35 30Q17 30 17 12Z', BEIGE), line('M12 12H58M17 17H11M53 17H59'))],
  ['lit-banh-chung', 'Bánh chưng', 'banh chung tet co truyen lang lieu', svg(
    rsq(11, 11, 48, 48, GREEN, 3), line('M18 18H52V52H18Z'), line('M28 11V59M42 11V59M11 28H59M11 42H59'))],
  ['lit-trau-cau', 'Trầu cau', 'trau cau mieng trau su tich trau cau', svg(
    fill('M30 58Q10 44 12 26Q14 12 30 18Q34 8 44 12Q50 20 44 34Q40 48 30 58Z', GREEN),
    line('M30 56Q30 36 37 16'), cp(51, 47, 10, PEACH), cp(51, 47, 4.5, BEIGE))],
  ['lit-guom-than', 'Gươm thần', 'guom than thanh guom su tich ho guom le loi', svg(
    '<g transform="rotate(35 35 35)">',
    fill('M31 9L35 3L39 9V44H31Z', BLUE), line('M35 11V41'),
    fill('M32 50H38V61H32Z', PEACH), fill('M20 44H50V50H20Z', YELLOW), cp(35, 64, 3.5, YELLOW),
    '</g>')],
  ['lit-dua-hau', 'Dưa hấu', 'dua hau mai an tiem su tich qua dua', svg(
    fill('M8 24A27 27 0 0 0 62 24Z', GREEN), fill('M13 24A22 22 0 0 0 57 24Z', PINK),
    dot(25, 31, 2), dot(35, 37, 2), dot(45, 31, 2), dot(30, 42, 2), dot(40, 42, 2))],
  ['lit-dan-bau', 'Đàn bầu', 'dan bau nhac cu dan toc mot day', svg(
    line('M14 41Q11 25 19 13M19 17L60 41'), cp(17, 23, 5, PEACH), rsq(6, 41, 58, 10, BEIGE, 4))],
  ['lit-sao-truc', 'Sáo trúc', 'sao truc nhac cu dan toc thoi sao', svg(
    '<g transform="rotate(-30 35 35)">',
    rsq(5, 30, 60, 10, GREEN, 5), line('M14 30V40M56 30V40'),
    dot(24, 35, 2.2), dot(31, 35, 2.2), dot(38, 35, 2.2), dot(45, 35, 2.2),
    '</g>')],
  ['lit-kinh-doc-sach', 'Kính đọc sách', 'kinh doc sach doc hieu van ban', svg(
    fill('M35 43Q25 37 8 39V57Q25 55 35 61Z', BLUE), fill('M35 43Q45 37 62 39V57Q45 55 35 61Z', BLUE),
    line('M32 24Q35 21 38 24M16 22L9 17M54 22L61 17'), cp(24, 25, 8, WHITE), cp(46, 25, 8, WHITE))],
  ['lit-micro', 'Micro', 'micro hung bien thuyet trinh dien thuyet doc tho', svg(
    line('M21 30Q21 46 35 46Q49 46 49 30M35 46V56M26 58H44'),
    fill('M27 22Q27 10 35 10Q43 10 43 22V30Q43 40 35 40Q27 40 27 30Z', LILAC), line('M27 22H43M27 29H43'))],
  ['lit-con-dau', 'Con dấu', 'con dau an trien dong dau chu ky', svg(
    fill('M20 51H50V63H20Z', PINK), ring(35, 57, 3),
    cp(35, 13, 7, PEACH), fill('M31 19H39V32H31Z', PEACH), rsq(18, 32, 34, 12, PEACH, 3))],
  ['lit-dan-y', 'Dàn ý', 'dan y bo cuc lap dan y bai van', svg(
    fill('M14 8H56V62H14Z', WHITE), line('M27 18H48M33 28H48M33 36H44M27 46H48M33 54H46'),
    cp(21, 18, 3, PEACH), cp(27, 28, 2.4, PEACH), cp(27, 36, 2.4, PEACH), cp(21, 46, 3, PEACH), cp(27, 54, 2.4, PEACH))],
  ['lit-but-da-quang', 'Bút dạ quang', 'but da quang danh dau tu khoa gach chan', svg(
    fill('M6 58H48V65H6Z', YELLOW),
    '<g transform="rotate(30 35 35)">',
    fill('M31 46H39L38 56H32Z', YELLOW), rsq(27, 10, 16, 37, YELLOW, 3), line('M27 20H43'),
    '</g>')],
  ['lit-canh-dieu', 'Cánh diều', 'canh dieu tha dieu tuoi tho dong que', svg(
    line('M35 50Q26 56 34 60Q42 64 36 67'),
    fill('M35 6L16 26H35Z', PINK), fill('M35 6L54 26H35Z', YELLOW), fill('M16 26L35 50V26Z', YELLOW), fill('M54 26L35 50V26Z', PINK))],
  ['lit-nha-tranh', 'Nhà tranh', 'nha tranh mai tranh lang que ngheo', svg(
    fill('M12 34H58V58H12Z', BEIGE), fill('M30 58V44H40V58Z', PEACH), fill('M17 40H25V48H17Z', WHITE),
    fill('M6 34L22 13H48L64 34Z', YELLOW), line('M15 30L26 15M25 32L32 15M37 32L40 15M48 32L46 15M5 58H65'))],
  ['lit-chim-en', 'Chim én', 'chim en mua xuan bay luon', svg(
    fill('M7 31Q21 27 30 33Q40 22 59 17Q47 30 43 36Q53 40 63 53Q49 47 38 43Q30 47 19 45Q25 40 23 37Q15 35 7 31Z', BLUE),
    line('M30 33Q36 37 38 43'), dot(14, 31, 1.8))],
  ['lit-hoa-phuong', 'Hoa phượng', 'hoa phuong mua he tuoi hoc tro chia tay', svg(
    line('M7 62Q24 44 34 34Q44 24 62 18M20 50L14 40M48 26L52 14'),
    fill('M14 40Q8 34 10 26Q18 30 14 40Z', GREEN), fill('M52 14Q58 8 64 10Q60 18 52 14Z', GREEN),
    blossom(34, 34, PEACH), blossom(56, 22, PEACH), blossom(22, 52, PEACH))],
  ['lit-cau-tre', 'Cầu tre', 'cau tre cau khi lang que song nuoc', svg(
    fill('M4 52Q20 48 35 52T66 52V64H4Z', BLUE),
    line('M14 36V60M56 36V60M14 24V36M56 24V36M10 24Q35 18 60 24'), rsq(7, 34, 56, 5, BEIGE, 2))],
  ['lit-hai-dang', 'Hải đăng', 'hai dang ngon hai dang bien dan duong', svg(
    line('M24 18L10 14M46 18L60 14M24 23L10 27M46 23L60 27M12 61H58'),
    fill('M26 26H44L48 61H22Z', WHITE), fill('M24.9 37H45.1L46 46H24Z', PINK),
    fill('M28 16H42V26H28Z', YELLOW), fill('M26 16L35 8L44 16Z', PINK))],
  ['lit-tem-thu', 'Tem thư', 'tem thu buu chinh la thu', svg(
    fill('M12 8H58V62H12Z', PEACH), fill('M19 15H51V48H19Z', BLUE),
    fill('M19 48L30 32L38 40L44 34L51 42V48Z', GREEN), cp(43, 23, 4, YELLOW), ...stampHoles)],
  ['lit-sach-co', 'Sách cổ', 'sach co co thu han nom van hoc trung dai', svg(
    rsq(14, 8, 42, 54, BEIGE, 2), line('M20 8V62M14 16H20M14 26H20M14 36H20M14 46H20M14 56H20'),
    fill('M31 15H43V42H31Z', WHITE), line('M34 21H40M34 27H40M34 33H40'))],
  ['lit-sang-tac', 'Sáng tác', 'sang tac viet van lam tho trang giay', svg(
    fill('M9 11H45V62H9Z', WHITE), line('M15 21H38M15 29H39M15 37H30M15 45H34'),
    fill('M40 54L57 20L64 24L47 58Z', YELLOW), fill('M40 54L47 58L39 63Z', INK))],
  ['lit-am-tra', 'Ấm trà', 'am tra chen tra tho ca thu thai', svg(
    line('M16 38Q6 40 8 48Q10 54 18 52'), fill('M54 38Q62 34 64 26L60 25Q58 32 53 34Z', MINT),
    fill('M15 34Q15 59 35 59Q55 59 55 34Z', MINT), fill('M24 34Q24 24 35 24Q46 24 46 34Z', MINT), cp(35, 20.5, 3, MINT))],
  ['lit-ngon-nen', 'Ngọn nến', 'ngon nen ngon lua thap sang hy vong', svg(
    line('M35 28V31M20 14L24 17M50 14L46 17M35 4V6'),
    fill('M35 10Q42 18 40 24Q38 28 35 28Q32 28 30 24Q28 18 35 10Z', PEACH), rsq(26, 31, 18, 31, YELLOW, 2))],
]
LIT_NEW.reduce((after, [id, name, keywords, svg]) => {
  ADDED.push({ after, id, name, category: 'lang', keywords, svg })
  return id
}, 'lang-phong-bi')

// --- địa lí bổ sung (30 icon) ---
const starPts = (cx, cy, R, r) => Array.from({ length: 10 }, (_, i) => polar(cx, cy, i % 2 ? r : R, -90 + 36 * i))
const pyramid = [[52, 27], [43, 22], [34, 17], [25, 12], [16, 7]]
const GEO_NEW = [
  ['geo-kinh-vi-tuyen', 'Kinh tuyến, vĩ tuyến', 'kinh tuyen vi tuyen xich dao toa do dia li qua dia cau luoi', svg(
    cp(35, 35, 26, BLUE), line(ellipseD(35, 35, 11, 26)), line('M35 9V61M9 35H61M12.5 22H57.5M12.5 48H57.5'))],
  ['geo-ti-le-ban-do', 'Tỉ lệ bản đồ', 'ti le ban do thuoc ti le khoang cach do ban do', svg(
    rsq(6, 6, 58, 58, GREEN, 6), line('M6 30Q20 18 34 28T64 22'), dot(46, 16, 2.4),
    fill('M13 46H26V54H13Z', WHITE), fill('M26 46H39V54H26Z', INK), fill('M39 46H52V54H39Z', WHITE), line('M13 42V46M52 42V46'))],
  ['geo-nhiet-ke', 'Nhiệt kế', 'nhiet ke nhiet do khi hau thoi tiet do nong lanh', svg(
    cp(15, 16, 6, YELLOW), line('M15 4V6M15 26V28M3 16H5M25 16H27'),
    fill('M28 50V13Q28 7 35 7Q42 7 42 13V50Z', WHITE), fill('M32 50V26H38V50Z', PEACH), cp(35, 54, 9, PEACH),
    line('M47 16H53M47 24H53M47 32H53M47 40H53'))],
  ['geo-vu-ke', 'Đo lượng mưa', 'luong mua vu ke do mua khi hau thoi tiet', svg(
    fill('M15 28Q7 28 7 21Q7 14 15 15Q18 7 27 8Q34 4 40 11Q50 9 53 17Q62 18 62 23Q62 28 55 28Z', WHITE),
    line('M18 34L14 42M28 34L24 42M22 46L19 52'),
    fill('M38 34H58V62H38Z', WHITE), fill('M38 48H58V62H38Z', BLUE), line('M38 41H45M38 48H45M38 55H45'))],
  ['geo-cang-bien', 'Cảng biển', 'cang bien tau container van tai bien xuat nhap khau giao thong duong bien', svg(
    rsq(20, 16, 12, 12, MINT, 1), rsq(14, 28, 12, 12, YELLOW, 1), rsq(26, 28, 12, 12, GREEN, 1), rsq(38, 28, 12, 12, PINK, 1),
    fill('M6 40H64L56 54H14Z', PEACH), line('M4 61Q11 56 18 61T32 61T46 61T60 61'))],
  ['geo-gian-khoan', 'Giàn khoan dầu', 'gian khoan dau khi dau mo khai thac bien dong khoang san', svg(
    fill('M4 50Q19 45 35 50T66 50V62H4Z', BLUE), line('M18 38V58M31 38V58M44 38V58'),
    fill('M22 32L27 8H33L38 32Z', WHITE), line('M25 20H35M24 26H36'), line('M46 32V18L60 13'),
    fill('M12 32H52V38H12Z', BEIGE))],
  ['geo-thuy-dien', 'Thuỷ điện', 'thuy dien dap nuoc ho chua nang luong dien song', svg(
    fill('M4 20H30V58H4Z', BLUE), fill('M50 48Q58 44 66 48V58H50Z', BLUE),
    fill('M28 14H40L50 58H28Z', BEIGE), line('M34 26V32M34 40V48'), line('M4 58H66'),
    fill('M56 6L48 22H55L51 36L63 18H56L60 6Z', YELLOW))],
  ['geo-nha-may', 'Nhà máy', 'nha may cong nghiep khu cong nghiep san xuat', svg(
    fill('M52 10Q50 4 56 4Q60 2 63 5Q67 8 63 11Q58 13 52 10Z', WHITE), fill('M50 60V16H60V60Z', PEACH),
    fill('M6 60V34L20 26V34L34 26V34L48 26V60Z', BEIGE),
    rsq(11, 42, 9, 9, YELLOW, 1), rsq(24, 42, 9, 9, YELLOW, 1), rsq(37, 42, 9, 9, YELLOW, 1), line('M4 60H66'))],
  ['geo-nha-san', 'Nhà sàn', 'nha san dan toc mien nui lang ban dan cu nong thon', svg(
    line('M18 46V61M35 46V61M52 46V61M4 61H66'), fill('M14 32H56V46H14Z', BEIGE),
    fill('M8 34L35 10L62 34Z', PEACH), rsq(30, 35, 10, 11, YELLOW, 1), line('M30 50L24 61M36 50L30 61'))],
  ['geo-thap-dan-so', 'Tháp dân số', 'thap dan so co cau dan so do tuoi gioi tinh dan cu', svg(
    ...pyramid.flatMap(([y, w]) => [fill(`M${35 - w} ${y}H35V${y + 9}H${35 - w}Z`, BLUE), fill(`M35 ${y}H${35 + w}V${y + 9}H35Z`, PINK)]),
    line('M35 10V64'))],
  ['geo-quy-dao', 'Quỹ đạo Trái Đất', 'quy dao trai dat quay quanh mat troi chuyen dong nam mua', svg(
    dash(ellipseD(35, 35, 29, 16)), cp(35, 35, 9, YELLOW), line('M35 20V22M35 48V50M20 35H22M48 35H50'),
    cp(58, 44, 6, BLUE), line('M12 25L17 21M12 25L18 26'))],
  ['geo-ngay-dem', 'Ngày và đêm', 'ngay dem trai dat tu quay quanh truc sang toi mui gio', svg(
    line('M4 26H9M4 35H9M4 44H9'), cp(35, 35, 22, BLUE), fill('M35 13A22 22 0 0 1 35 57Z', LILAC),
    line('M35 13V57'), sparkle(47, 28, 5, YELLOW), dot(44, 44, 1.8))],
  ['geo-bon-mua', 'Bốn mùa', 'bon mua xuan ha thu dong thoi tiet khi hau', svg(
    fill('M35 35V11A24 24 0 0 1 59 35Z', GREEN), fill('M35 35H59A24 24 0 0 1 35 59Z', YELLOW),
    fill('M35 35V59A24 24 0 0 1 11 35Z', PEACH), fill('M35 35H11A24 24 0 0 1 35 11Z', BLUE),
    fill('M41 29Q41 20 50 20Q50 29 41 29Z', WHITE), cp(46, 46, 5, WHITE),
    fill('M24 41Q18 47 22 51Q28 49 24 41Z', WHITE), line('M24 18V28M19 23H29'))],
  ['geo-dong-dat', 'Động đất', 'dong dat dia chan rung chan thien tai vo trai dat', svg(
    line('M4 24H15L19 14L24 34L29 8L34 38L39 18L43 28L47 24H66'),
    fill('M4 44H66V62H4Z', BEIGE), line('M33 44L38 50L31 55L36 62'))],
  ['geo-song-than', 'Sóng thần', 'song than thien tai bien dong dat bao lu', svg(
    fill('M4 62V40Q8 14 34 10Q54 8 60 22Q50 16 42 22Q36 28 44 34Q34 36 30 46Q28 56 36 62Z', BLUE),
    line('M42 22Q34 22 34 30'), fill('M48 62V48L56 41L64 48V62Z', PEACH))],
  ['geo-hang-dong', 'Hang động', 'hang dong nhu da thach nhu karst dia hinh da voi', svg(
    fill('M4 62V30Q8 10 35 8Q62 10 66 30V62Z', BEIGE), fill('M16 62V44Q16 26 35 26Q54 26 54 44V62Z', LILAC),
    fill('M25 28L29 39L33 27Z', WHITE), fill('M38 27L42 36L46 29Z', WHITE), fill('M38 62L43 50L48 62Z', WHITE))],
  ['geo-chau-tho', 'Đồng bằng châu thổ', 'dong bang chau tho song hong song cuu long cua song phu sa', svg(
    fill('M4 8H66V44Q50 52 35 52Q20 52 4 44Z', GREEN), fill('M4 44Q20 52 35 52Q50 52 66 44V62H4Z', BLUE),
    fill('M31 8H39L38 24L52 50H45L35 32L25 50H18L32 24Z', BLUE))],
  ['geo-cao-nguyen', 'Cao nguyên', 'cao nguyen tay nguyen dia hinh doi nui', svg(
    cp(54, 13, 6, YELLOW), fill('M4 60L14 26H56L66 60Z', PEACH), fill('M14 26H56L54 33H16Z', GREEN),
    line('M10 42H60M7 52H63'))],
  ['geo-rung-nhiet-doi', 'Rừng nhiệt đới', 'rung nhiet doi rung mua rung rung xanh sinh thai', svg(
    line('M19 40V60M51 40V60M35 34V60M4 60H66'), cp(19, 30, 13, GREEN), cp(51, 30, 13, GREEN), cp(35, 22, 14, MINT),
    line('M29 18Q35 24 41 18'))],
  ['geo-vung-cuc', 'Vùng cực', 'vung cuc bac cuc nam cuc bang tuyet lanh nha tuyet', svg(
    fill('M10 56Q10 24 35 24Q60 24 60 56Z', BLUE), line('M14 44H56M19 34H51M28 24V34M42 24V34M22 34V44M48 34V44'),
    fill('M28 56V47Q28 40 35 40Q42 40 42 47V56Z', LILAC), line('M4 56H66'), sparkle(58, 12, 5, WHITE))],
  ['geo-ca-phe', 'Cà phê', 'ca phe cay cong nghiep nong san tay nguyen xuat khau', svg(
    fill('M38 12Q54 2 62 12Q50 22 38 12Z', GREEN),
    '<g transform="rotate(-25 25 40)">', fill(ellipseD(25, 40, 11, 16), PEACH), line('M25 25Q20 40 25 55'), '</g>',
    '<g transform="rotate(20 46 38)">', fill(ellipseD(46, 38, 11, 16), PEACH), line('M46 23Q41 38 46 53'), '</g>')],
  ['geo-danh-ca', 'Đánh bắt cá', 'danh bat ca thuy san ngu nghiep thuyen ca bien', svg(
    fill('M4 50Q19 46 35 50T66 50V62H4Z', BLUE), line('M30 38V10'), fill('M30 12L47 34H30Z', WHITE),
    fill('M8 38H52L45 49H15Z', PEACH), dash('M52 38L60 56'),
    fill('M40 56Q46 51 52 56Q46 61 40 56Z', YELLOW), fill('M52 56L58 52V60Z', YELLOW))],
  ['geo-tau-hoa', 'Tàu hoả', 'tau hoa duong sat giao thong van tai xe lua', svg(
    line('M25 52L16 63M45 52L54 63M20 58H50'), rsq(13, 8, 44, 44, PEACH, 7), rsq(19, 14, 32, 14, WHITE, 3),
    cp(23, 41, 4, YELLOW), cp(47, 41, 4, YELLOW), line('M31 41H39'))],
  ['geo-duong-cao-toc', 'Đường cao tốc', 'duong cao toc duong bo giao thong van tai quoc lo', svg(
    fill('M4 62L26 8H4Z', GREEN), fill('M66 62L44 8H66Z', GREEN),
    fill('M28 8H42L62 62H8Z', BEIGE), line('M35 14V20M35 29V37M35 47V57'))],
  ['geo-may-bay', 'Hàng không', 'hang khong may bay san bay giao thong van tai du lich', svg(
    '<g transform="rotate(45 35 35)">', fill('M30 24L6 38V44L30 37Z', BLUE), fill('M40 24L64 38V44L40 37Z', BLUE),
    fill('M35 6Q40 6 40 14V48L46 55V60L35 56L24 60V55L30 48V14Q30 6 35 6Z', WHITE), '</g>')],
  ['geo-dien-mat-troi', 'Điện mặt trời', 'dien mat troi nang luong tai tao pin mat troi nang luong sach', svg(
    cp(15, 14, 7, YELLOW), line('M15 3V4M27 14H28M24 5L23 6'),
    line('M40 50V62M30 62H50'), fill('M10 30H54L62 50H18Z', BLUE), line('M24.7 30L32.7 50M39.3 30L47.3 50M14 40H58'))],
  ['geo-bieu-do-khi-hau', 'Biểu đồ khí hậu', 'bieu do khi hau nhiet do luong mua bieu do cot duong', svg(
    fill('M15 60V50H22V60Z', BLUE), fill('M24 60V42H31V60Z', BLUE), fill('M33 60V30H40V60Z', BLUE),
    fill('M42 60V24H49V60Z', BLUE), fill('M51 60V38H58V60Z', BLUE),
    line('M18 30Q27 16 36 14T55 24'), cp(55, 24, 3, PEACH), cp(18, 30, 3, PEACH), line('M10 6V60H64'))],
  ['geo-nha-kinh', 'Hiệu ứng nhà kính', 'hieu ung nha kinh bien doi khi hau nong len toan cau moi truong', svg(
    cp(12, 12, 7, YELLOW), line('M19 19L28 30M28 30L22 29M28 30L27 24'),
    dash('M7 60A28 28 0 0 1 63 60'), cp(35, 47, 13, BLUE), fill('M28 40Q34 36 37 42Q34 48 28 46Z', GREEN), line('M4 60H66'))],
  ['geo-cot-moc', 'Cột mốc biên giới', 'cot moc bien gioi chu quyen lanh tho quoc gia', svg(
    fill('M24 56V18Q24 9 35 9Q46 9 46 18V56Z', WHITE), fill('M24 18Q24 9 35 9Q46 9 46 18V24H24Z', PEACH),
    poly(starPts(35, 38, 7, 3), YELLOW), fill('M14 54H56V62H14Z', BEIGE))],
  ['geo-thung-lung', 'Thung lũng', 'thung lung nui doi song suoi dia hinh', svg(
    cp(35, 14, 6, YELLOW), fill('M4 62V36Q12 14 20 14Q26 14 34 44Q35 47 36 44Q44 14 50 14Q58 14 66 36V62Z', GREEN),
    fill('M29 62Q34 54 35 48Q36 54 41 62Z', BLUE))],
]
GEO_NEW.reduce((after, [id, name, keywords, svg]) => {
  ADDED.push({ after, id, name, category: 'geo', keywords, svg })
  return id
}, 'geo-ruong-bac-thang-2')

// --- lịch sử bổ sung (30 icon, nhóm Lịch sử) ---
const HIS_NEW = [
  ['his-cuon-sac-phong', 'Cuộn sắc phong', 'cuon giay sac phong chieu chi van ban co lich su', svg(
    fill('M16 14H54V56H16Z', BEIGE),
    fill('M12 8H58Q62 8 62 12Q62 16 58 16H12Q8 16 8 12Q8 8 12 8Z', PEACH),
    fill('M12 54H58Q62 54 62 58Q62 62 58 62H12Q8 62 8 58Q8 54 12 54Z', PEACH),
    line('M23 27H47M23 35H47M23 43H39'))],
  ['his-an-trien', 'Ấn triện', 'an trien con dau vua quyen luc trieu dinh phong kien', svg(
    cp(35, 15, 6, YELLOW), fill('M28 40V30Q28 21 35 21Q42 21 42 30V40Z', YELLOW),
    fill('M16 40H54V58H16Z', PEACH), line('M28 49H42M35 44V54'))],
  ['his-vuong-mien', 'Vương miện', 'vuong mien vua chua hoang de trieu dai phong kien', svg(
    poly([[12, 50], [10, 22], [23, 34], [35, 13], [47, 34], [60, 22], [58, 50]], YELLOW),
    fill('M12 50H58V58H12Z', PEACH), cp(35, 42, 4, PINK))],
  ['his-ngai-vang', 'Ngai vàng', 'ngai vang ngai vua trieu dinh hoang cung phong kien', svg(
    line('M18 46V62M52 46V62'),
    fill('M20 40V16Q20 8 35 8Q50 8 50 16V40Z', PEACH), fill('M27 36V21Q27 15 35 15Q43 15 43 21V36Z', YELLOW),
    fill('M12 38H58V46H12Z', YELLOW))],
  ['his-giao-mac', 'Giáo mác', 'giao mac vu khi co chien tranh linh', svg(
    '<g transform="rotate(35 35 35)">', line('M35 22V66'),
    poly([[35, 3], [42, 18], [35, 24], [28, 18]], BLUE), fill('M31 24H39L37 31H33Z', PEACH), '</g>')],
  ['his-riu-dong', 'Rìu đồng', 'riu dong dong son thoi dai do dong cong cu co', svg(
    fill('M12 62L44 12L49 15L17 65Z', BEIGE),
    fill('M41 14L50 27Q60 32 65 26Q67 13 57 4Q51 11 41 14Z', YELLOW), line('M52 24Q60 19 59 9'))],
  ['his-coc-bach-dang', 'Cọc Bạch Đằng', 'coc bach dang tran thuy chien ngo quyen tran hung dao song', svg(
    poly([[11, 60], [11, 24], [16, 12], [21, 24], [21, 60]], BEIGE),
    poly([[30, 60], [30, 18], [35, 6], [40, 18], [40, 60]], BEIGE),
    poly([[49, 60], [49, 26], [54, 14], [59, 26], [59, 60]], BEIGE),
    fill('M4 44Q12 40 20 44T36 44T52 44T66 44V62H4Z', BLUE))],
  ['his-cong-thanh', 'Cổng thành', 'cong thanh kinh thanh hoang thanh di tich co', svg(
    fill('M8 26H62V62H8Z', BEIGE), fill('M22 26V18H48V26Z', WHITE),
    fill('M12 18Q24 15 26 8H44Q46 15 58 18Z', PEACH),
    fill('M26 62V45Q26 36 35 36Q44 36 44 45V62Z', PEACH), line('M8 38H20M50 38H62M8 50H20M50 50H62'))],
  ['his-dinh-lang', 'Đình làng', 'dinh lang kien truc co lang xa van hoa viet nam', svg(
    fill('M14 32H56V58H14Z', BEIGE), line('M25 34V58M35 34V58M45 34V58'),
    fill('M5 29Q16 30 22 17H48Q54 30 65 29Q50 35 35 35Q20 35 5 29Z', PEACH),
    line('M22 17Q35 13 48 17'), fill('M8 58H62V63H8Z', PEACH))],
  ['his-thap-co', 'Tháp cổ', 'thap co thap cham champa kien truc di tich', svg(
    fill('M18 62V40H52V62Z', PEACH), fill('M23 40V26H47V40Z', PEACH), fill('M28 26V14H42V26Z', PEACH),
    fill('M31 14L35 5L39 14Z', YELLOW), fill('M30 62V53Q30 47 35 47Q40 47 40 53V62Z', BEIGE))],
  ['his-binh-gom', 'Bình gốm', 'binh gom co vat gom su chu dau bat trang', svg(
    fill('M28 9H42V14Q42 18 46 22Q56 30 54 44Q52 58 35 62Q18 58 16 44Q14 30 24 22Q28 18 28 14Z', BLUE),
    line('M18 37Q35 43 52 37M20 48Q35 54 50 48'), fill('M25 6H45V10H25Z', WHITE))],
  ['his-den-long', 'Đèn lồng', 'den long hoi an pho co le hoi truyen thong', svg(
    line('M35 4V12M35 56V66M31 58V64M39 58V64'), fill('M27 12H43V16H27Z', YELLOW),
    fill('M24 16Q12 34 24 52H46Q58 34 46 16Z', PEACH), line('M35 16V52M29 16Q22 34 29 52M41 16Q48 34 41 52'),
    fill('M27 52H43V56H27Z', YELLOW))],
  ['his-banh-xe-go', 'Bánh xe gỗ', 'banh xe go xe ngua xe bo co phat minh', svg(
    cp(35, 35, 26, BEIGE), ring(35, 35, 19), line('M35 16V54M16 35H54M21.6 21.6L48.4 48.4M48.4 21.6L21.6 48.4'),
    cp(35, 35, 6, PEACH))],
  ['his-nhat-quy', 'Đồng hồ mặt trời', 'dong ho mat troi nhat quy do thoi gian co', svg(
    cp(14, 13, 6, YELLOW), fill('M26 50H44L48 64H22Z', BEIGE),
    fill('M8 44Q8 34 35 34Q62 34 62 44Q62 54 35 54Q8 54 8 44Z', BEIGE),
    poly([[35, 44], [35, 18], [52, 44]], BLUE), line('M35 44L18 41M13 44H16M54 44H57'))],
  ['his-hoa-thach', 'Hoá thạch', 'hoa thach oc cuc da co sinh vat co tien su', svg(
    fill('M10 40Q6 20 24 12Q44 4 58 18Q66 32 58 48Q46 64 26 60Q12 56 10 40Z', BEIGE),
    line('M35 35A3 3 0 0 1 41 35A6 6 0 0 1 29 35A9 9 0 0 1 47 35A12 12 0 0 1 23 35A15 15 0 0 1 53 35'))],
  ['his-riu-da', 'Rìu đá', 'riu da cong cu da nguoi tien su thoi dai do da', svg(
    fill('M35 6Q52 18 54 40Q54 60 35 64Q16 60 16 40Q18 18 35 6Z', BEIGE),
    line('M28 22L35 34L42 22M24 44L35 34L46 44M35 34V56'))],
  ['his-hang-dong', 'Hang động', 'hang dong nguoi tien su nguoi nguyen thuy cu tru', svg(
    fill('M4 62Q8 26 26 14Q44 6 58 22Q66 34 66 62Z', BEIGE), fill('M20 62Q20 38 35 36Q50 38 50 62Z', LILAC),
    fill('M35 62Q28 56 33 47Q34 53 37 51Q42 56 35 62Z', PEACH))],
  ['his-chuong-dong', 'Chuông đồng', 'chuong dong chua chien dai hong chung', svg(
    cp(35, 59, 4, PEACH), fill('M30 12Q30 6 35 6Q40 6 40 12Z', YELLOW),
    fill('M24 12H46Q48 30 50 44Q56 50 56 56H14Q14 50 20 44Q22 30 24 12Z', YELLOW), line('M22 34H48M19 46H51'))],
  ['his-dinh-dong', 'Đỉnh đồng', 'dinh dong vac dong cuu dinh trieu nguyen co vat', svg(
    line('M20 44L16 62M50 44L54 62M35 48V62M20 22V12H26V22M44 22V12H50V22'),
    fill('M12 24H58Q58 46 35 48Q12 46 12 24Z', YELLOW), fill('M8 20H62V26H8Z', PEACH), line('M22 34H48'))],
  ['his-but-long-ngong', 'Bút lông ngỗng', 'but long ngong lo muc tuyen ngon van kien lich su', svg(
    fill('M32 44Q40 20 61 6Q56 28 36 44Z', WHITE), line('M34 44L52 18'),
    fill('M24 40H38V46H24Z', BLUE), fill('M16 46H46V62H16Z', BLUE))],
  ['his-xe-tang', 'Xe tăng', 'xe tang chien tranh khang chien thong nhat 30 4 1975', svg(
    fill('M44 29H64V33H44Z', GREEN), fill('M24 37Q24 26 36 26Q46 26 46 37Z', GREEN),
    fill('M10 46L16 36H54L60 46Z', GREEN),
    fill('M10 46H60Q66 46 66 53Q66 60 58 60H12Q4 60 4 53Q4 46 10 46Z', BEIGE),
    cp(15, 53, 3.5, GREEN), cp(28, 53, 3.5, GREEN), cp(42, 53, 3.5, GREEN), cp(55, 53, 3.5, GREEN))],
  ['his-co-chien-thang', 'Cờ chiến thắng', 'co chien thang dien bien phu cam co tren dinh doi', svg(
    line('M35 41V9'), fill('M35 9H61L55 17L61 25H35Z', PEACH), poly(starPts(45, 17, 5, 2), YELLOW),
    fill('M4 62Q20 40 35 40Q50 40 66 62Z', GREEN))],
  ['his-dong-thoi-gian', 'Dòng thời gian', 'dong thoi gian truc thoi gian moc su kien nien bieu', svg(
    line('M6 35H64M14 22V30M35 40V48M56 22V30'),
    fill('M6 11H22V22H6Z', BEIGE), fill('M27 48H43V59H27Z', BEIGE), fill('M48 11H64V22H48Z', BEIGE),
    cp(14, 35, 5, PEACH), cp(35, 35, 5, BLUE), cp(56, 35, 5, GREEN))],
  ['his-sach-co', 'Sách cổ', 'sach co sach su dong chi han nom su ky', svg(
    fill('M14 8H56V62H14Z', BEIGE), line('M22 8V62M14 18H22M14 30H22M14 42H22M14 54H22'),
    fill('M33 16H47V42H33Z', WHITE), line('M38 22V36M42 22V36'))],
  ['his-khao-co', 'Khảo cổ', 'khao co hoc khai quat di chi co vat xeng', svg(
    fill('M4 50H66V64H4Z', BEIGE), fill('M16 50Q12 41 16 34H32Q36 41 32 50Z', PEACH), line('M18 34H30'),
    line('M58 8L50 36'), fill('M45 34L54 37L51 48L42 45Z', BLUE))],
  ['his-kinh-vien-vong', 'Kính viễn vọng cổ', 'kinh vien vong ong nhom hai trinh tham hiem phat kien dia ly', svg(
    '<g transform="rotate(-30 35 35)">', fill('M4 29H22V41H4Z', BEIGE), fill('M22 30H44V40H22Z', YELLOW),
    fill('M44 31.5H64V38.5H44Z', BEIGE), line('M10 29V41M56 31.5V38.5'), '</g>')],
  ['his-mo-neo', 'Mỏ neo', 'mo neo thuyen tau bien hang hai', svg(
    ring(35, 11, 5), line('M12 42Q14 60 35 60Q56 60 58 42M7 47L12 40L18 45M63 47L58 40L52 45'),
    fill('M32 16H38V60H32Z', BLUE), fill('M22 21H48V26H22Z', BLUE))],
  ['his-ban-do-co', 'Bản đồ cổ', 'ban do co kho bau hanh trinh tham hiem', svg(
    fill('M8 14L24 8L46 14L62 8V56L46 62L24 56L8 62Z', BEIGE), line('M24 8V56M46 14V62'),
    dash('M14 50Q24 36 34 40T50 26'), line('M51 17L57 23M57 17L51 23'))],
  ['his-ken-hieu', 'Kèn hiệu', 'ken hieu ken xung tran quan doi bao hieu', svg(
    line('M16 34Q16 44 26 44H32Q38 44 38 34'), fill('M18 44H36V58L27 53L18 58Z', PEACH),
    fill('M8 28H40V34H8Z', YELLOW), fill('M4 27H9V35H4Z', YELLOW), fill('M38 28L62 15V47L38 34Z', YELLOW))],
  ['his-dau-may-hoi-nuoc', 'Đầu máy hơi nước', 'dau may hoi nuoc tau hoa cach mang cong nghiep', svg(
    cp(23, 9, 4, WHITE), cp(31, 6, 3, WHITE), fill('M18 18H26V30H18Z', BLUE),
    fill('M12 30H48V50H12Z', BLUE), fill('M46 18H62V50H46Z', PEACH), line('M43 18H65'),
    fill('M50 24H58V32H50Z', WHITE), poly([[12, 42], [5, 52], [12, 52]], PEACH),
    cp(22, 54, 6, BEIGE), cp(38, 54, 6, BEIGE), cp(54, 54, 6, BEIGE))],
]
HIS_NEW.reduce((after, [id, name, keywords, svg]) => {
  ADDED.push({ after, id, name, category: 'his', keywords, svg })
  return id
}, 'geo-thung-lung')

// --- cơ thể người bổ sung (30 icon, nhóm Sinh học) ---
const oval = (cx, cy, rx, ry, color) => fill(ellipseD(cx, cy, rx, ry), color)
const vertebra = (y) => fill(`M26 ${y}H44Q48 ${y + 4} 44 ${y + 8}H26Q22 ${y + 4} 26 ${y}Z`, WHITE)
const BODY_NEW = [
  ['bio-mat', 'Mắt', 'mat thi giac giac quan nhin co the nguoi', svg(
    fill('M6 35Q35 8 64 35Q35 62 6 35Z', WHITE), cp(35, 35, 12, BLUE), dot(35, 35, 5), cp(39, 31, 2, WHITE),
    line('M35 14V8M22 18L18 12M48 18L52 12'))],
  ['bio-tai', 'Tai', 'tai thinh giac giac quan nghe co the nguoi', svg(
    fill('M22 28Q22 8 39 8Q56 8 56 28Q56 40 46 46Q42 49 42 56Q42 64 33 64Q25 64 24 56Z', PEACH),
    line('M32 27Q32 18 39 18Q46 18 46 26Q46 34 38 36Q35 42 40 45'))],
  ['bio-mui', 'Mũi', 'mui khuu giac giac quan ngui co the nguoi', svg(
    fill('M30 8Q30 32 21 44Q18 54 28 54Q32 58 35 54Q38 58 42 54Q52 54 49 44Q40 32 40 8Z', PEACH),
    fill(ellipseD(29, 48, 3, 2), INK), fill(ellipseD(41, 48, 3, 2), INK))],
  ['bio-mieng', 'Miệng', 'mieng moi an noi co the nguoi', svg(
    fill('M7 35Q20 16 35 25Q50 16 63 35Q50 56 35 56Q20 56 7 35Z', PINK), line('M7 35Q35 43 63 35'))],
  ['bio-luoi', 'Lưỡi', 'luoi vi giac giac quan nem co the nguoi', svg(
    fill('M18 10H52V34Q52 62 35 62Q18 62 18 34Z', PINK), line('M35 20V46'),
    cp(27, 24, 2, WHITE), cp(43, 24, 2, WHITE), cp(28, 38, 2, WHITE), cp(42, 38, 2, WHITE))],
  ['bio-rang', 'Răng', 'rang nha khoa ve sinh rang mieng co the nguoi', svg(
    fill('M18 12Q26 6 35 12Q44 6 52 12Q61 22 55 40Q51 50 48 62Q42 65 40 52Q38 44 35 44Q32 44 30 52Q28 65 22 62Q19 50 15 40Q9 22 18 12Z', WHITE),
    line('M23 19Q20 25 22 30'))],
  ['bio-ban-tay', 'Bàn tay', 'ban tay ngon tay co the nguoi', svg(
    fill('M20 64V40L11 30Q8 25 13 22Q17 20 21 25L24 29V13Q24 8 28 8Q32 8 32 13V30V9Q32 4 36 4Q40 4 40 9V30V11Q40 6 44 6Q48 6 48 11V32V17Q48 12 52 12Q56 12 56 17V44Q56 56 48 64Z', PEACH),
    line('M32 22V30M40 22V30M48 24V32'))],
  ['bio-ban-chan', 'Bàn chân', 'ban chan dau chan ngon chan co the nguoi', svg(
    fill('M26 26Q44 20 48 34Q50 50 44 60Q36 68 28 60Q20 50 22 38Q22 30 26 26Z', PEACH),
    cp(24, 15, 4.5, PEACH), cp(33, 11, 4, PEACH), cp(41, 12, 3.5, PEACH), cp(48, 16, 3, PEACH), cp(53, 22, 2.5, PEACH))],
  ['bio-da-day', 'Dạ dày', 'da day tieu hoa co quan co the nguoi', svg(
    line('M48 57Q51 64 60 63'),
    fill('M26 5V18Q26 26 22 32Q14 46 22 56Q32 64 46 58Q58 52 56 40Q54 30 44 32Q38 34 36 26V5Z', PINK),
    line('M24 44Q32 50 44 46'))],
  ['bio-gan', 'Gan', 'gan tieu hoa thai doc co quan co the nguoi', svg(
    oval(40, 50, 4, 5, GREEN),
    fill('M6 30Q10 16 34 16Q58 14 64 22Q62 34 46 44Q32 52 20 52Q8 48 6 30Z', PEACH), line('M38 18Q36 30 40 42'))],
  ['bio-than', 'Thận', 'than bai tiet nuoc tieu co quan co the nguoi', svg(
    line('M27 32Q32 46 33 58M43 32Q38 46 37 58'), oval(35, 60, 9, 5.5, YELLOW),
    fill('M22 8Q6 8 6 28Q6 48 22 50Q30 50 30 40Q30 34 26 29Q30 24 30 18Q30 8 22 8Z', PINK),
    fill('M48 8Q64 8 64 28Q64 48 48 50Q40 50 40 40Q40 34 44 29Q40 24 40 18Q40 8 48 8Z', PINK))],
  ['bio-ruot', 'Ruột', 'ruot non ruot gia tieu hoa co the nguoi', svg(
    fill('M10 60V16Q10 10 16 10H54Q60 10 60 16V58H51V19H19V60Z', PEACH),
    fill('M24 22Q35 18 46 22Q50 28 46 34Q50 40 46 46Q42 54 35 52Q28 54 24 46Q20 40 24 34Q20 28 24 22Z', PINK),
    line('M28 28H42M28 34Q35 38 42 34M28 41H42M30 47H40'))],
  ['bio-co-bap', 'Cơ bắp', 'co bap co bap tay van dong suc khoe co the nguoi', svg(
    fill('M8 58Q6 40 18 36Q26 34 30 40Q32 26 44 20L40 10Q48 5 57 12Q63 24 57 35Q52 47 40 53Q26 60 8 58Z', PEACH),
    line('M30 40Q36 33 45 36'))],
  ['bio-hong-cau', 'Hồng cầu', 'hong cau te bao mau van chuyen oxy', svg(
    oval(46, 46, 17, 13, PINK), oval(46, 46, 7, 4, PINK),
    oval(26, 26, 18, 14, PINK), oval(26, 26, 8, 5, PINK))],
  ['bio-bach-cau', 'Bạch cầu', 'bach cau te bao mau mien dich bao ve co the', svg(
    fill('M35 8Q50 6 58 18Q66 30 60 44Q56 60 38 62Q20 64 12 50Q4 36 12 22Q20 10 35 8Z', LILAC),
    fill('M24 30Q24 22 32 24Q38 18 44 26Q52 28 48 38Q46 46 38 42Q30 48 26 40Q20 36 24 30Z', PINK))],
  ['bio-mach-mau', 'Mạch máu', 'mach mau dong mach tinh mach tuan hoan', svg(
    fill('M30 64Q32 44 30 34Q20 26 12 10L18 7Q24 20 35 28Q46 20 52 7L58 10Q50 26 40 34Q38 44 40 64Z', PINK),
    line('M35 34V60'))],
  ['bio-noron', 'Nơ-ron thần kinh', 'noron te bao than kinh dan truyen xung than kinh', svg(
    line('M14 20L6 14M15 32L7 38M22 16V7M29 18L35 10M29 31L50 52M50 52H62M50 52L52 64M50 52L59 60'),
    fill('M34 34L38 30L44 36L40 40Z', YELLOW), cp(22, 26, 9, LILAC), cp(22, 26, 3.5, WHITE))],
  ['bio-hop-so', 'Hộp sọ', 'hop so xuong dau bo xuong co the nguoi', svg(
    fill('M14 30Q14 8 35 8Q56 8 56 30Q56 40 48 44V54H22V44Q14 40 14 30Z', WHITE),
    cp(26, 30, 5, LILAC), cp(44, 30, 5, LILAC), poly([[35, 36], [32, 42], [38, 42]], LILAC), line('M29 54V47M35 54V47M41 54V47'))],
  ['bio-cot-song', 'Cột sống', 'cot song dot song xuong song bo xuong', svg(
    line('M35 4V66'), vertebra(6), vertebra(18), vertebra(30), vertebra(42), vertebra(54))],
  ['bio-long-nguc', 'Lồng ngực', 'long nguc xuong suon bo xuong', svg(
    line('M32 16Q14 16 12 30M38 16Q56 16 58 30M32 26Q14 26 14 42M38 26Q56 26 56 42M32 36Q18 38 18 52M38 36Q52 38 52 52'),
    fill('M31 8H39V48H31Z', WHITE))],
  ['bio-van-tay', 'Vân tay', 'van tay dau van tay nhan dang', svg(
    oval(35, 36, 22, 28, PEACH),
    line('M22 54Q16 34 24 22Q35 12 46 22Q54 32 50 50M28 56Q24 40 28 30Q35 22 42 30Q46 38 43 54M35 58V36'))],
  ['bio-giot-mau', 'Giọt máu', 'giot mau hien mau mau', svg(
    fill('M35 6Q54 32 54 44Q54 62 35 62Q16 62 16 44Q16 32 35 6Z', PINK), line('M24 44Q24 53 31 56'))],
  ['bio-tui-mau', 'Túi máu', 'tui mau hien mau truyen mau', svg(
    line('M35 58V66M30 14V7H40V14'), fill('M18 14H52Q56 14 56 18V52Q56 58 50 58H20Q14 58 14 52V18Q14 14 18 14Z', WHITE),
    fill('M14 32H56V52Q56 58 50 58H20Q14 58 14 52Z', PINK), line('M35 38V50M29 44H41'))],
  ['bio-khi-quan', 'Khí quản', 'khi quan phe quan ho hap co the nguoi', svg(
    line('M30 36Q20 40 14 58M40 36Q50 40 56 58M20 46L10 48M50 46L60 48'),
    fill('M30 5H40V38H30Z', WHITE), line('M30 12H40M30 19H40M30 26H40M30 33H40'))],
  ['bio-nhip-tim', 'Nhịp tim', 'nhip tim dien tim mach dap tim mach', svg(
    fill('M35 60Q8 42 8 24Q8 10 21 10Q30 10 35 18Q40 10 49 10Q62 10 62 24Q62 42 35 60Z', PINK),
    line('M10 34H22L27 24L33 44L38 30L42 34H60'))],
  ['bio-co-the-nguoi', 'Cơ thể người', 'co the nguoi hinh nguoi giai phau', svg(
    cp(35, 12, 7, PEACH), fill('M24 22H46Q50 22 50 26V42H45V64H37V46H33V64H25V42H20V26Q20 22 24 22Z', BLUE))],
  ['bio-vi-khuan', 'Vi khuẩn', 'vi khuan vi sinh vat benh', svg(
    '<g transform="rotate(-30 35 35)">', line('M58 35Q62 30 66 35T74 35M12 35Q8 40 4 35'),
    oval(35, 35, 24, 13, GREEN), cp(26, 33, 3, WHITE), cp(40, 38, 2.5, WHITE), cp(45, 31, 2, WHITE), '</g>')],
  ['bio-tiem-vac-xin', 'Tiêm vắc-xin', 'tiem vac xin ong tiem phong benh mien dich', svg(
    '<g transform="rotate(45 35 35)">', line('M35 20V8M28 8H42M35 54V66'),
    fill('M28 20H42V50H28Z', WHITE), fill('M28 34H42V50H28Z', BLUE), fill('M31 50H39V55H31Z', BLUE), '</g>')],
  ['bio-ong-nghe', 'Ống nghe', 'ong nghe bac si kham benh y te', svg(
    line('M22 8V24Q22 38 35 38Q48 38 48 24V8M35 38V48Q35 56 44 56'),
    cp(50, 56, 7, BLUE), cp(22, 8, 3, LILAC), cp(48, 8, 3, LILAC))],
  ['bio-vien-thuoc', 'Viên thuốc', 'vien thuoc thuoc chua benh y te', svg(
    '<g transform="rotate(-35 35 35)">', fill('M20 27H35V43H20Q12 43 12 35Q12 27 20 27Z', PINK),
    fill('M35 27H50Q58 27 58 35Q58 43 50 43H35Z', WHITE), '</g>')],
]
BODY_NEW.reduce((after, [id, name, keywords, svg]) => {
  ADDED.push({ after, id, name, category: 'bio', keywords, svg })
  return id
}, 'bio-xuong')

// --- hình động (30 icon, nhóm "Hình động"): chuyển động SMIL nằm sẵn trong SVG, lặp vô hạn ---
// Trên slide (SVG nhúng inline) hình tự chạy; xuất PPTX/ảnh thì lấy khung hình đầu.
const T = (type, values, dur, extra = '') =>
  `<animateTransform attributeName="transform" type="${type}" values="${values}" dur="${dur}s" repeatCount="indefinite"${extra}/>`
const ag = (anim, ...parts) => `<g>${anim}${parts.join('')}</g>`
const spin = (cx, cy, dur, rev = false) => T('rotate', rev ? `360 ${cx} ${cy};0 ${cx} ${cy}` : `0 ${cx} ${cy};360 ${cx} ${cy}`, dur)
const swing = (cx, cy, a, dur) =>
  T('rotate', `${-a} ${cx} ${cy};${a} ${cx} ${cy};${-a} ${cx} ${cy}`, dur, ' calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"')
const fade = (values, dur, begin = 0) => `<animate attributeName="opacity" values="${values}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>`
const pulse = (cx, cy, values, dur, ...parts) =>
  `<g transform="translate(${cx} ${cy})"><g>${T('scale', values, dur)}<g transform="translate(${-cx} ${-cy})">${parts.join('')}</g></g></g>`
/** nét tự vẽ ra rồi giữ một lúc, lặp lại; khung đầu là nét đầy đủ (xuất PPTX/ảnh lấy khung đầu) */
const draw = (d, len, dur) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${len}">` +
  `<animate attributeName="stroke-dashoffset" values="0;${len};0;0" keyTimes="0;0.01;0.6;1" dur="${dur}s" repeatCount="indefinite"/></path>`
/** chấm tròn chạy theo quỹ đạo `path` */
const orbiter = (r, color, path, dur) =>
  `<path d="M${-r} 0a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z" fill="${color}" stroke="${INK}" stroke-width="3">` +
  `<animateMotion path="${path}" dur="${dur}s" repeatCount="indefinite"/></path>`
const rotg = (deg, ...parts) => `<g transform="rotate(${deg} 35 35)">${parts.join('')}</g>`
const gear = (cx, cy, R, r, n) => {
  const w = 360 / n / 4
  return Array.from({ length: n }, (_, k) => {
    const a = (360 * k) / n
    return [polar(cx, cy, r, a - 1.6 * w), polar(cx, cy, R, a - 0.8 * w), polar(cx, cy, R, a + 0.8 * w), polar(cx, cy, r, a + 1.6 * w)]
  }).flat()
}
const inner = (s) => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
const HEART = 'M35 60Q8 42 8 24Q8 10 21 10Q30 10 35 18Q40 10 49 10Q62 10 62 24Q62 42 35 60Z'
const CLOUD = 'M18 44Q8 44 8 36Q8 28 17 28Q18 16 31 16Q42 16 45 26Q48 22 54 24Q62 26 62 34Q62 44 52 44Z'
const arcAt = (cx, cy, r) => `M${round1(cx - r * 0.707)} ${round1(cy - r * 0.707)}A${r} ${r} 0 0 1 ${round1(cx + r * 0.707)} ${round1(cy - r * 0.707)}`
const blade = (deg, color) => rotg(deg, fill('M35 35V9Q50 13 47 25Z', color))
const sail = (deg) => `<g transform="rotate(${deg} 35 28)">${fill('M33.5 26L30 4H40L36.5 26Z', WHITE)}</g>`
const drop = (x, begin) =>
  `<g>${T('translate', '0 -6;0 10', 0.9, ` begin="${begin}s"`)}${fade('1;0', 0.9, begin)}${line(`M${x} 46L${x - 3} 53`)}</g>`

const ANIM_NEW = [
  ['anim-banh-rang', 'Bánh răng quay', 'banh rang quay co khi may moc cai dat dong', svg(
    ag(spin(35, 35, 6), poly(gear(35, 35, 28, 22, 10), BLUE), cp(35, 35, 8, WHITE)))],
  ['anim-hai-banh-rang', 'Bánh răng ăn khớp', 'banh rang an khop truyen dong co khi quy trinh dong', svg(
    ag(spin(24, 25, 4), poly(gear(24, 25, 19, 14, 8), BLUE), cp(24, 25, 5, WHITE)),
    ag(spin(48, 48, 3, true), poly(gear(48, 48, 15, 10.5, 6), PEACH), cp(48, 48, 4, WHITE)))],
  ['anim-dong-ho', 'Đồng hồ chạy', 'dong ho chay thoi gian dem gio kim dong', svg(
    cp(35, 35, 27, WHITE), line('M35 12V16M35 54V58M12 35H16M54 35H58'),
    ag(spin(35, 35, 24), line('M35 35V22')), ag(spin(35, 35, 2), line('M35 35V14')), cp(35, 35, 3, PEACH))],
  ['anim-dong-ho-cat', 'Đồng hồ cát lật', 'dong ho cat lat thoi gian cho dong', svg(
    ag(T('rotate', '0 35 35;0 35 35;180 35 35;180 35 35', 3, ' keyTimes="0;0.7;0.9;1"'),
      fill('M20 8H50V12Q50 26 38 35Q50 44 50 58V62H20V58Q20 44 32 35Q20 26 20 12Z', WHITE),
      fill('M25 18H45Q43 25 35 31Q27 25 25 18Z', YELLOW), fill('M35 46Q24 50 23 58H47Q46 50 35 46Z', YELLOW),
      line('M15 8H55M15 62H55')))],
  ['anim-bong-den', 'Bóng đèn sáng', 'bong den sang y tuong nhay sang dong', svg(
    ag(fade('0.15;1;0.15', 1.6), line('M35 3V8M15 12L19 16M55 12L51 16M6 30H11M64 30H59')),
    fill('M35 12Q52 12 52 30Q52 40 44 46V52H26V46Q18 40 18 30Q18 12 35 12Z', YELLOW),
    fill('M27 52H43V59Q43 63 39 63H31Q27 63 27 59Z', BEIGE), line('M30 40L33 34L37 40L40 34'))],
  ['anim-tim-dap', 'Tim đập', 'tim dap trai tim yeu thuong nhip tim dong', svg(
    pulse(35, 36, '1;1.14;1;1.07;1', 1.2, fill(HEART, PINK), line('M20 22Q18 28 22 32')))],
  ['anim-ngoi-sao', 'Sao lấp lánh', 'ngoi sao lap lanh khen thuong noi bat dong', svg(
    pulse(35, 37, '1;0.86;1', 1.4, poly(starPts(35, 37, 24, 10), YELLOW)),
    ag(fade('0;1;0', 1.4), line('M58 6V16M53 11H63')), ag(fade('0;1;0', 1.4, -0.7), line('M11 52V62M6 57H16')))],
  ['anim-mat-troi', 'Mặt trời quay', 'mat troi quay nang thoi tiet dong', svg(
    ag(spin(35, 35, 10), line(Array.from({ length: 12 }, (_, i) => {
      const [a, b] = polar(35, 35, 21, i * 30), [c, d] = polar(35, 35, 30, i * 30)
      return `M${a} ${b}L${c} ${d}`
    }).join(''))), cp(35, 35, 15, YELLOW))],
  ['anim-dang-tai', 'Đang tải', 'dang tai cho xu ly loading dong', svg(
    ...Array.from({ length: 8 }, (_, i) => {
      const [x, y] = polar(35, 35, 23, i * 45 - 90)
      return ag(fade('1;0.2;1', 1.2, round1(-1.2 + (i * 1.2) / 8)), cp(x, y, 5, BLUE))
    }))],
  ['anim-vong-xoay', 'Vòng xoay', 'vong xoay dang tai cho loading dong', svg(
    cp(35, 35, 24, BLUE), cp(35, 35, 12, WHITE), ag(spin(35, 35, 1.1), bold('M35 17A18 18 0 0 1 53 35', 6)))],
  ['anim-chuong-reo', 'Chuông reo', 'chuong reo thong bao bao hieu dong', svg(
    line('M8 24Q5 33 9 41M62 24Q65 33 61 41'),
    ag(swing(35, 10, 16, 0.9), fill('M32 17Q32 10 35 10Q38 10 38 17Z', YELLOW),
      cp(35, 56, 4.5, PEACH), fill('M21 46Q21 20 35 16Q49 20 49 46L55 52H15Z', YELLOW)))],
  ['anim-kinh-lup', 'Kính lúp tìm kiếm', 'kinh lup tim kiem tra cuu kham pha dong', svg(
    fill('M12 6H50V64H12Z', WHITE), line('M19 16H43M19 26H43M19 36H37M19 46H43'),
    ag(T('translate', '0 0;6 -4;0 -8;-6 -4;0 0', 2.6), bold('M43 43L57 57', 6), cp(34, 34, 13, BLUE)))],
  ['anim-ten-lua', 'Tên lửa bay', 'ten lua bay khoi dong phong khat vong dong', svg(
    ag(T('translate', '0 1;0 -4;0 1', 1.2),
      ag(fade('1;0.45;1', 0.3), fill('M28 44H42L35 63Z', YELLOW)),
      fill('M24 34L13 47H25Z', PEACH), fill('M46 34L57 47H45Z', PEACH),
      fill('M35 5Q48 17 46 44H24Q22 17 35 5Z', WHITE), cp(35, 25, 5, BLUE)))],
  ['anim-may-troi', 'Mây trôi', 'may troi bau troi thoi tiet dong', svg(
    cp(48, 22, 10, YELLOW), ag(T('translate', '-6 4;6 4;-6 4', 5), fill(CLOUD, WHITE)))],
  ['anim-mua-roi', 'Mưa rơi', 'mua roi thoi tiet nuoc dong', svg(
    drop(22, 0), drop(35, -0.3), drop(48, -0.6),
    `<g transform="translate(0 -8)">${fill(CLOUD, BLUE)}</g>`)],
  ['anim-bong-tuyet', 'Bông tuyết xoay', 'bong tuyet xoay mua dong lanh dong', svg(
    ag(spin(35, 35, 8), inner(snowflake())))],
  ['anim-chong-chong', 'Chong chóng quay', 'chong chong quay gio tuoi tho dong', svg(
    line('M35 35V66'), ag(spin(35, 35, 1.6), blade(0, PINK), blade(90, BLUE), blade(180, YELLOW), blade(270, GREEN)), cp(35, 35, 3.5, WHITE))],
  ['anim-coi-xay-gio', 'Cối xay gió', 'coi xay gio nang luong gio dong', svg(
    fill('M30 30H40L47 64H23Z', BEIGE), fill('M31 64V55Q31 51 35 51Q39 51 39 55V64Z', PEACH),
    ag(spin(35, 28, 4), sail(0), sail(90), sail(180), sail(270)), cp(35, 28, 4, PEACH))],
  ['anim-but-viet', 'Bút đang viết', 'but viet ghi chep soan bai dong', svg(
    draw('M8 52Q16 40 23 50T37 50T52 48', 60, 2.4),
    ag(T('translate', '0 0;-44 2;0 0;0 0', 2.4, ' keyTimes="0;0.01;0.6;1"'),
      fill('M52 48L54 38L63 16Q65 12 68 14Q70 16 68 20L59 42Z', WHITE), line('M54 38L59 42')))],
  ['anim-dau-tich', 'Dấu tích', 'dau tich dung hoan thanh dong y dong', svg(
    cp(35, 35, 27, GREEN), draw('M22 36L31 45L49 26', 40, 1.8))],
  ['anim-mui-ten-nhay', 'Mũi tên nhún', 'mui ten chi xuong chu y tai xuong dong', svg(
    line('M12 63H58'), ag(T('translate', '0 -5;0 4;0 -5', 1.1), fill('M28 6H42V30H52L35 50L18 30H28Z', PEACH)))],
  ['anim-wifi', 'Sóng wifi', 'song wifi mang internet ket noi dong', svg(
    cp(35, 56, 4.5, BLUE),
    ...[12, 22, 32].map((r, i) => ag(fade('0.15;1;1;0.15', 1.8, round1(-1.8 + i * 0.3)), line(arcAt(35, 56, r)))))],
  ['anim-loa', 'Loa phát', 'loa phat am thanh nghe dong', svg(
    fill('M8 26H18L32 14V56L18 44H8Z', BLUE),
    ...['M40 27Q45 35 40 43', 'M47 20Q55 35 47 50', 'M54 13Q65 35 54 57'].map((d, i) => ag(fade('0.15;1;0.15', 1.5, round1(-1.5 + i * 0.25)), line(d))))],
  ['anim-pin-sac', 'Pin đang sạc', 'pin sac nang luong dien dong', svg(
    fill('M7 20H58V50H7Z', WHITE), fill('M58 28H64V42H58Z', WHITE),
    ...[12, 23, 34, 45].map((x, i) => ag(fade('0;0;1;1', 2.4, round1(-2.4 + i * 0.4)), fill(`M${x} 25H${x + 8}V45H${x}Z`, GREEN))))],
  ['anim-con-lac', 'Con lắc', 'con lac dao dong vat ly dong', svg(
    line('M12 8H58'), ag(swing(35, 8, 26, 1.6), line('M35 8V45'), cp(35, 51, 8, PEACH)))],
  ['anim-nguyen-tu', 'Nguyên tử', 'nguyen tu electron hat nhan hoa hoc vat ly dong', svg(
    ...[0, 60, 120].map((deg, i) => rotg(deg, line(ellipseD(35, 35, 28, 10)), orbiter(3.5, [BLUE, PINK, YELLOW][i], ellipseD(35, 35, 28, 10), 1.6 + i * 0.4))),
    cp(35, 35, 6, PEACH))],
  ['anim-trai-dat-quay', 'Trái Đất quay quanh Mặt Trời', 'trai dat quay quanh mat troi quy dao he mat troi dong', svg(
    dash(ellipseD(35, 35, 26, 26)), cp(35, 35, 10, YELLOW), orbiter(5, BLUE, ellipseD(35, 35, 26, 26), 4))],
  ['anim-dien-tam-do', 'Điện tâm đồ', 'dien tam do nhip tim may theo doi y te dong', svg(
    fill('M5 12H65V58H5Z', WHITE), draw('M9 36H21L26 26L32 47L38 18L43 40L47 36H61', 95, 2))],
  ['anim-bong-bay', 'Bóng bay', 'bong bay le hoi sinh nhat vui dong', svg(
    ag(T('translate', '0 1;0 -4;0 1', 2.4), line('M35 49Q30 56 36 65'), poly([[31, 50], [35, 45], [39, 50]], PINK),
      fill('M35 5Q52 5 52 23Q52 39 35 46Q18 39 18 23Q18 5 35 5Z', PINK), line('M25 17Q26 12 30 10')))],
  ['anim-phao-hoa', 'Pháo hoa', 'phao hoa le hoi chuc mung tet dong', svg(
    `<g>${fade('1;1;0', 1.6)}${pulse(35, 35, '0.3;1;1.05', 1.6,
      line(Array.from({ length: 8 }, (_, i) => {
        const [a, b] = polar(35, 35, 8, i * 45), [c, d] = polar(35, 35, 21, i * 45)
        return `M${a} ${b}L${c} ${d}`
      }).join('')),
      ...Array.from({ length: 8 }, (_, i) => {
        const [x, y] = polar(35, 35, 27, i * 45)
        return cp(x, y, 3, [PINK, YELLOW, BLUE, GREEN][i % 4])
      }))}</g>`)],
]
ANIM_NEW.reduce((after, [id, name, keywords, svg]) => {
  ADDED.push({ after, id, name, category: 'anim', keywords, svg })
  return id
}, 'feel-vo-tay')

// --- khen thưởng bổ sung (30 icon, nhóm "Khen thưởng") ---
const star5 = (cx, cy, R, color, k = 0.45) => poly(Array.from({ length: 10 }, (_, i) => polar(cx, cy, i % 2 ? R * k : R, i * 36 - 90)), color)
const leaf = (cx, cy, deg, color) => `<g transform="rotate(${round1(deg)} ${cx} ${cy})">${fill(ellipseD(cx, cy, 6, 3.2), color)}</g>`
/** hoa 5 cánh cỡ lớn (blossom quá nhỏ cho bó hoa) */
const flower5 = (cx, cy, color) =>
  [0, 72, 144, 216, 288].map((d) => { const [x, y] = polar(cx, cy, 7, d - 90); return cp(x, y, 5.5, color) }).join('') + cp(cx, cy, 4, YELLOW)
const REWARD_NEW = [
  ['reward-ba-sao', 'Ba ngôi sao', 'ba ngoi sao danh gia 3 sao xuat sac khen thuong', svg(
    star5(15, 45, 10, YELLOW), star5(55, 45, 10, YELLOW), star5(35, 29, 16, YELLOW))],
  ['reward-like', 'Ngón cái tán thưởng', 'like ngon cai tuyet voi gioi lam khen thuong', svg(
    rsq(8, 30, 11, 32, BLUE, 2),
    fill('M19 33L30 21Q33 12 37 8Q44 7 43 17L41 27H55Q61 27 60 34L57 55Q56 61 50 61H19Z', PEACH),
    line('M47 36H59M47 45H58M47 53H56'), dot(13.5, 55, 1.8))],
  ['reward-the-sticker', 'Tờ sticker', 'sticker nhan dan ngoi sao phan thuong khen thuong', svg(
    rsq(10, 8, 50, 54, WHITE, 5),
    star5(23, 22, 9, YELLOW), star5(47, 22, 9, PINK), star5(23, 47, 9, BLUE), star5(47, 47, 9, YELLOW))],
  ['reward-ken-tiec', 'Kèn tiệc', 'ken tiec phao giay chuc mung ky niem khen thuong', svg(
    line('M33 39Q42 26 50 32Q56 38 50 42Q44 44 46 35Q50 22 62 18'),
    fill('M10 60L22 30L40 48Z', YELLOW), line('M16 45L25 54'),
    sparkle(56, 50, 6, PINK), cp(44, 12, 3, BLUE), cp(62, 34, 2.5, MINT))],
  ['reward-bong-bay', 'Bóng bay', 'bong bay chuc mung ky niem vui khen thuong', svg(
    line('M22 41Q22 52 34 64M48 39Q48 52 36 64M35 36Q31 50 35 64'),
    fill(ellipseD(21, 26, 11, 13), PINK), fill(ellipseD(49, 24, 11, 13), BLUE),
    fill(ellipseD(35, 20, 12, 14), YELLOW),
    '<path d="M28 15Q29 10 33 9" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>',
    fill('M19 42L21 39L23 42Z', PINK), fill('M47 40L49 37L51 40Z', BLUE), fill('M33 37L35 34L37 37Z', YELLOW))],
  ['reward-co-dich', 'Cờ đích', 'co dich ve dich hoan thanh chien thang khen thuong', svg(
    fill('M6 64Q15 56 24 64Z', GREEN),
    fill('M15 10H59V38H15Z', WHITE),
    ...[0, 1].flatMap((r) => [0, 1, 2, 3].filter((c) => (r + c) % 2).map((c) =>
      fill(`M${15 + c * 11} ${10 + r * 14}h11v14h-11Z`, INK))),
    line('M15 64V8'), cp(15, 7, 3, YELLOW))],
  ['reward-nguyet-que', 'Vòng nguyệt quế', 'vong nguyet que vinh quang chien thang quan quan khen thuong', svg(
    line(`M${polar(35, 36, 23, 100).join(' ')}A23 23 0 0 1 ${polar(35, 36, 23, 245).join(' ')}`),
    line(`M${polar(35, 36, 23, 80).join(' ')}A23 23 0 0 0 ${polar(35, 36, 23, -65).join(' ')}`),
    ...[115, 145, 175, 205, 235].map((d) => { const [x, y] = polar(35, 36, 23, d); return leaf(x, y, d + 90 + 25, GREEN) }),
    ...[65, 35, 5, -25, -55].map((d) => { const [x, y] = polar(35, 36, 23, d); return leaf(x, y, d + 90 - 25, GREEN) }),
    star5(35, 35, 11, YELLOW),
    fill('M35 59L27 54V64Z', PINK), fill('M35 59L43 54V64Z', PINK))],
  ['reward-kim-cuong', 'Kim cương', 'kim cuong vien ngoc quy gia phan thuong khen thuong', svg(
    poly([[20, 20], [50, 20], [61, 31], [35, 62], [9, 31]], BLUE),
    line('M9 31H61M20 20L27 31L35 62L43 31L50 20M27 31L35 20L43 31'),
    sparkle(60, 11, 5, WHITE))],
  ['reward-dong-xu', 'Đồng xu vàng', 'dong xu tien vang diem thuong xu khen thuong', svg(
    cp(45, 27, 17, YELLOW), ring(45, 27, 11),
    cp(28, 42, 20, YELLOW), ring(28, 42, 14), star5(28, 42, 8, WHITE))],
  ['reward-ruong-bau', 'Rương kho báu', 'ruong kho bau bau vat phan thuong khen thuong', svg(
    sparkle(35, 8, 5, YELLOW),
    fill('M10 26Q10 15 35 15Q60 15 60 26V36H10Z', PEACH),
    fill('M10 36H60V61H10Z', PEACH),
    line('M22 16V61M48 16V61'),
    rsq(29, 31, 12, 13, YELLOW, 2), dot(35, 38, 2))],
  ['reward-cup-sao', 'Cúp ngôi sao', 'cup ngoi sao giai thuong vo dich quan quan khen thuong', svg(
    fill('M23 55H47L50 63H20Z', PEACH),
    fill('M31 42H39V55H31Z', YELLOW),
    star5(35, 26, 20, YELLOW, 0.48))],
  ['reward-ve-thuong', 'Vé thưởng', 've thuong phieu thuong coupon phan thuong khen thuong', svg(
    '<g transform="rotate(-12 35 35)">',
    fill('M6 20H64V30A5 5 0 0 0 64 40V50H6V40A5 5 0 0 0 6 30Z', PINK),
    dash('M21 23V47'), star5(43, 35, 10, YELLOW), '</g>')],
  ['reward-diem-a-cong', 'Điểm A+', 'diem a cong xuat sac gioi diem cao khen thuong', svg(
    cp(35, 35, 28, MINT),
    bold('M16 50L26 20L36 50M20 40H32'), bold('M48 28V44M40 36H56'))],
  ['reward-thanh-tien-do', 'Thanh tiến độ', 'thanh tien do hoan thanh tien bo muc tieu khen thuong', svg(
    rsq(5, 24, 50, 22, WHITE, 11), rsq(5, 24, 40, 22, GREEN, 11),
    line('M19 29L14 41M30 29L25 41'),
    star5(51, 35, 14, YELLOW))],
  ['reward-bieu-do-tang', 'Biểu đồ đi lên', 'bieu do di len tien bo tang truong ket qua khen thuong', svg(
    rsq(10, 44, 11, 18, BLUE, 2), rsq(26, 36, 11, 26, BLUE, 2), rsq(42, 28, 11, 34, BLUE, 2),
    line('M8 34L24 20L34 26L58 8M48 8H58V18'))],
  ['reward-ngon-lua', 'Ngọn lửa', 'ngon lua chuoi ngay nhiet huyet hang say khen thuong', svg(
    fill('M35 6Q46 18 49 29Q55 24 54 16Q64 28 62 42Q60 62 35 64Q10 62 8 42Q8 30 18 22Q18 31 24 33Q22 18 35 6Z', PEACH),
    fill('M35 34Q44 44 44 52Q44 60 35 60Q26 60 26 52Q26 44 35 34Z', YELLOW))],
  ['reward-muc-tieu', 'Trúng hồng tâm', 'trung hong tam bia muc tieu chinh xac dat muc tieu khen thuong', svg(
    cp(32, 38, 25, WHITE), cp(32, 38, 16, PINK), cp(32, 38, 7, WHITE),
    line('M32 38L57 13'), fill('M57 13L56 5L63 7L65 14L59 15Z', YELLOW))],
  ['reward-sao-bang', 'Sao băng', 'sao bang uoc mo tuyet voi xuat sac khen thuong', svg(
    line('M7 50L27 37M12 61L32 45M22 64L37 52'),
    star5(45, 28, 19, YELLOW))],
  ['reward-bo-hoa', 'Bó hoa', 'bo hoa tang hoa chuc mung tri an khen thuong', svg(
    line('M35 62L21 24M35 62V18M35 62L49 24'),
    flower5(20, 25, PEACH), flower5(50, 25, LILAC), flower5(35, 17, PEACH),
    fill('M19 38H51L41 64H29Z', PINK),
    fill('M35 50L28 46V54Z', YELLOW), fill('M35 50L42 46V54Z', YELLOW))],
  ['reward-cuon-giay-khen', 'Giấy khen cuộn', 'giay khen cuon chung nhan bang danh du khen thuong', svg(
    fill('M15 13H55V57H15Z', WHITE),
    line('M23 27H47M23 34H47M23 41H37'),
    rsq(9, 7, 52, 10, BEIGE, 5), rsq(9, 53, 52, 10, BEIGE, 5),
    cp(47, 44, 6, PINK))],
  ['reward-cong-mot', 'Điểm cộng', 'diem cong cong mot cong diem thuong phat bieu khen thuong', svg(
    cp(35, 35, 28, GREEN),
    bold('M16 35H32M24 27V43'), bold('M42 27L48 23V48M42 48H54'))],
  ['reward-loa-vinh-danh', 'Loa vinh danh', 'loa vinh danh thong bao tuyen duong khen thuong', svg(
    fill('M21 44L25 57H32L30 46Z', BLUE),
    fill('M10 28L44 12V58L10 42Z', YELLOW),
    fill(ellipseD(44, 35, 5, 23), YELLOW),
    sparkle(59, 18, 5, PINK), sparkle(60, 52, 5, PINK), line('M57 35H65'))],
  ['reward-dau-tick', 'Dấu hoàn thành', 'dau tich hoan thanh dat yeu cau dung chinh xac khen thuong', svg(
    poly(Array.from({ length: 24 }, (_, i) => polar(35, 35, i % 2 ? 24 : 29, i * 15)), GREEN),
    cp(35, 35, 17, WHITE), bold('M26 35L32 41L44 29'))],
  ['reward-cau-vong', 'Cầu vồng', 'cau vong vui ve tich cuc may man khen thuong', svg(
    annular(35, 46, 22, 28, 180, 180, PINK), annular(35, 46, 16, 22, 180, 180, YELLOW), annular(35, 46, 10, 16, 180, 180, BLUE),
    fill('M4 52Q4 44 11 45Q13 38 20 41Q27 41 26 48Q26 55 19 55H8Q4 55 4 52Z', WHITE),
    fill('M66 52Q66 44 59 45Q57 38 50 41Q43 41 44 48Q44 55 51 55H62Q66 55 66 52Z', WHITE))],
  ['reward-dinh-nui', 'Chinh phục đỉnh núi', 'chinh phuc dinh nui cam co thanh cong vuot kho khen thuong', svg(
    line('M28 22V6'), fill('M28 6L42 10L28 14Z', PINK),
    poly([[4, 62], [28, 22], [40, 38], [48, 28], [66, 62]], GREEN),
    fill('M22 32L28 22L34.5 31L31 29L26 33Z', WHITE))],
  ['reward-keo', 'Kẹo', 'keo ngot phan thuong qua nho khen thuong', svg(
    '<g transform="rotate(-20 35 35)">',
    fill('M23 35L8 24L11 35L8 46Z', YELLOW), fill('M47 35L62 24L59 35L62 46Z', YELLOW),
    fill(ellipseD(35, 35, 14, 11), PINK), line('M30 25Q34 35 30 45M39 25Q43 35 39 45'), '</g>')],
  ['reward-bang-vang', 'Bảng vàng', 'bang vang bang danh du vinh danh hoc sinh gioi khen thuong', svg(
    line('M18 54L14 64M52 54L56 64'),
    rsq(8, 8, 54, 46, YELLOW, 4), rsq(15, 15, 40, 32, WHITE, 2),
    star5(35, 25, 7, YELLOW), line('M23 37H47M27 42H43'))],
  ['reward-hu-sao', 'Hũ ngôi sao', 'hu ngoi sao tich sao lo sao phan thuong khen thuong', svg(
    fill('M19 22H51Q58 30 58 44V56Q58 62 52 62H18Q12 62 12 56V44Q12 30 19 22Z', WHITE),
    rsq(16, 10, 38, 12, PEACH, 3),
    star5(25, 49, 7, YELLOW), star5(44, 50, 7, PINK), star5(34, 36, 7, BLUE))],
  ['reward-hoa-diem-tot', 'Hoa điểm tốt', 'hoa diem tot diem 10 diem muoi thi dua khen thuong', svg(
    ...Array.from({ length: 6 }, (_, i) => { const [x, y] = polar(35, 35, 19, i * 60 - 90); return cp(x, y, 11, PINK) }),
    cp(35, 35, 13, YELLOW),
    line('M28 30L31 28V42'), line(ellipseD(40, 35, 3.5, 6.5)))],
  ['reward-the-tich-diem', 'Thẻ tích điểm', 'the tich diem tich sao dong dau phan thuong khen thuong', svg(
    rsq(6, 12, 58, 46, BLUE, 5),
    ...[[20, 26], [35, 26], [50, 26], [20, 44]].map(([x, y]) => star5(x, y, 8.5, YELLOW)),
    cp(35, 44, 6, WHITE), cp(50, 44, 6, WHITE))],
]
REWARD_NEW.reduce((after, [id, name, keywords, svg]) => {
  ADDED.push({ after, id, name, category: 'reward', keywords, svg })
  return id
}, 'reward-buc-nhan-giai')

// --- ký hiệu bổ sung (30 icon, nhóm "Ký hiệu"): chữ khối như sym-* từ sheet ---
// Mọi mảnh vẽ viền trước (nét 6, lộ 3 ra ngoài) rồi tô sau, nên chỗ các mảnh chồng nhau liền một khối.
const uni = (color, ...ds) =>
  ds.map((d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>`).join('') +
  ds.map((d) => `<path d="${d}" fill="${color}"/>`).join('')
const P = (pts) => `M${pts.map(([x, y]) => `${round1(x)} ${round1(y)}`).join('L')}Z`
const barD = (x1, y1, x2, y2, w) => {
  const L = Math.hypot(x2 - x1, y2 - y1), nx = (-(y2 - y1) / L) * (w / 2), ny = ((x2 - x1) / L) * (w / 2)
  return P([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]])
}
const rectD = (x1, y1, x2, y2) => P([[x1, y1], [x2, y1], [x2, y2], [x1, y2]])
/** chữ V nằm ngang dày t: dir 1 mở trái (>), -1 mở phải (<) */
const chevD = (a, b, cy, h, t, dir = 1) => {
  const pts = [[a, cy - h], [a + t, cy - h], [b, cy], [a + t, cy + h], [a, cy + h], [b - t, cy]]
  return P(dir > 0 ? pts : pts.map(([x, y]) => [a + b - x, y]))
}
const plusD = (cx, cy, L, t) => P([[cx - t / 2, cy - L], [cx + t / 2, cy - L], [cx + t / 2, cy - t / 2], [cx + L, cy - t / 2], [cx + L, cy + t / 2], [cx + t / 2, cy + t / 2], [cx + t / 2, cy + L], [cx - t / 2, cy + L], [cx - t / 2, cy + t / 2], [cx - L, cy + t / 2], [cx - L, cy - t / 2], [cx - t / 2, cy - t / 2]])
/** vành khuyên (vòng trong ngược chiều nên thủng lỗ) */
const ringD = (cx, cy, R, r) => `${circD(cx, cy, R)}M${cx - r} ${cy}a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${r} 0 1 1 ${-2 * r} 0Z`
/** chữ C dày: nửa vành trái + hai cánh kéo sang phải tới x2 */
const cD = (cx, cy, R, r, x2) => `M${x2} ${cy - R}H${cx}A${R} ${R} 0 0 0 ${cx} ${cy + R}H${x2}V${cy + r}H${cx}A${r} ${r} 0 0 1 ${cx} ${cy - r}H${x2}Z`
const boxD = 'M10 10H60V60H10ZM18 18V52H52V18Z'
const SYM_NEW = [
  ['sym-lon-hon-bang', 'Dấu lớn hơn hoặc bằng', 'dau lon hon hoac bang so sanh bat dang thuc toan', svg(
    uni(BLUE, chevD(18, 52, 26, 17, 12), rectD(16, 50, 54, 59)))],
  ['sym-be-hon-bang', 'Dấu bé hơn hoặc bằng', 'dau be hon hoac bang nho hon so sanh bat dang thuc toan', svg(
    uni(PEACH, chevD(18, 52, 26, 17, 12, -1), rectD(16, 50, 54, 59)))],
  ['sym-cong-tru', 'Dấu cộng trừ', 'dau cong tru sai so nghiem toan', svg(
    uni(MINT, plusD(35, 26, 18, 10), rectD(17, 51, 53, 60)))],
  ['sym-chia-het', 'Dấu chia hết', 'dau chia het boi uoc so hoc ba cham doc toan', svg(
    uni(YELLOW, circD(35, 13, 7), circD(35, 35, 7), circD(35, 57, 7)))],
  ['sym-khong-chia-het', 'Dấu không chia hết', 'dau khong chia het boi uoc so hoc toan', svg(
    uni(PINK, circD(35, 13, 7), circD(35, 35, 7), circD(35, 57, 7)), uni(PINK, barD(54, 10, 16, 60, 6)))],
  ['sym-thuoc', 'Dấu thuộc', 'dau thuoc phan tu tap hop toan', svg(
    uni(LILAC, cD(38, 35, 22, 12, 58), rectD(26, 30.5, 58, 39.5)))],
  ['sym-khong-thuoc', 'Dấu không thuộc', 'dau khong thuoc phan tu tap hop toan', svg(
    uni(PEACH, cD(38, 35, 22, 12, 58), rectD(26, 30.5, 58, 39.5)), uni(PEACH, barD(53, 6, 23, 64, 6)))],
  ['sym-suy-ra', 'Dấu suy ra', 'dau suy ra keo theo menh de logic toan', svg(
    uni(BLUE, rectD(8, 22, 48, 30), rectD(8, 40, 48, 48), chevD(34, 60, 35, 22, 11)))],
  ['sym-tuong-duong', 'Dấu tương đương', 'dau tuong duong khi va chi khi menh de logic toan', svg(
    uni(GREEN, rectD(14, 25, 56, 31), rectD(14, 39, 56, 45), chevD(46, 64, 35, 17, 9), chevD(6, 24, 35, 17, 9, -1)))],
  ['sym-do-c', 'Độ C', 'do c do xe nhiet do don vi vat ly', svg(
    uni(PEACH, ringD(17, 17, 10, 4), cD(44, 40, 20, 11, 61)))],
  ['sym-hai-cham', 'Dấu hai chấm', 'dau hai cham ty so liet ke dau cau', svg(
    uni(MINT, circD(35, 20, 8), circD(35, 50, 8)))],
  ['sym-cham-phay', 'Dấu chấm phẩy', 'dau cham phay dau cau ngu phap', svg(
    uni(YELLOW, circD(35, 18, 8), 'M35 38A8 8 0 0 1 43 46Q43 56 33 64L28 61Q33 56 33 53.7A8 8 0 0 1 35 38Z'))],
  ['sym-ngoac-vuong', 'Dấu ngoặc vuông', 'dau ngoac vuong bieu thuc hop nghiem toan', svg(
    uni(LILAC, P([[12, 8], [28, 8], [28, 17], [21, 17], [21, 53], [28, 53], [28, 62], [12, 62]]),
      P([[58, 8], [42, 8], [42, 17], [49, 17], [49, 53], [42, 53], [42, 62], [58, 62]])))],
  ['sym-ba-cham', 'Dấu ba chấm', 'dau ba cham dau chung con nua dau cau', svg(
    uni(BLUE, circD(13, 35, 7), circD(35, 35, 7), circD(57, 35, 7)))],
  ['sym-thang', 'Dấu thăng', 'dau thang hashtag so thu tu am nhac', svg(
    uni(PINK, barD(29, 8, 23, 62, 9), barD(48, 8, 42, 62, 9), barD(10, 25, 62, 25, 9), barD(8, 45, 60, 45, 9)))],
  ['sym-sao', 'Dấu sao', 'dau sao hoa thi ghi chu chu thich', svg(
    uni(YELLOW, ...[90, 30, 150].map((d) => barD(...polar(35, 35, 26, d), ...polar(35, 35, 26, d + 180), 10))))],
  ['sym-vuong-goc', 'Dấu vuông góc', 'dau vuong goc duong vuong goc hinh hoc toan', svg(
    uni(GREEN, rectD(30, 9, 40, 52), rectD(10, 52, 60, 61)))],
  ['sym-goc', 'Kí hiệu góc', 'ki hieu goc dau goc hinh hoc toan', svg(
    uni(MINT, barD(14, 56, 50, 10, 10), rectD(9, 51, 62, 61)))],
  ['sym-dong-nhat', 'Dấu đồng nhất', 'dau dong nhat dong du hang dang thuc toan', svg(
    uni(PEACH, rectD(12, 14, 58, 23), rectD(12, 30.5, 58, 39.5), rectD(12, 47, 58, 56)))],
  ['sym-chu-dd', 'Chữ Đ', 'chu d dung dap an dung', svg(
    uni(GREEN, 'M20 12H36A23 23 0 0 1 36 58H20ZM30 22V48H36A13 13 0 0 0 36 22Z', rectD(11, 31, 30, 39)))],
  ['sym-chu-s', 'Chữ S', 'chu s sai dap an sai', svg(
    uni(PINK, P([[16, 10], [54, 10], [54, 20], [26, 20], [26, 30], [54, 30], [54, 60], [16, 60], [16, 50], [44, 50], [44, 40], [16, 40]])))],
  ['sym-o-tich', 'Ô đã đánh dấu', 'o danh dau o tich checkbox chon phuong an dung', svg(
    uni(BLUE, boxD), uni(GREEN, barD(21, 35, 32, 46, 9), barD(30, 46, 55, 17, 9)))],
  ['sym-o-gach', 'Ô gạch chéo', 'o gach cheo checkbox sai loai bo phuong an', svg(
    uni(BLUE, boxD), uni(PINK, barD(22, 22, 48, 48, 9), barD(48, 22, 22, 48, 9)))],
  ['sym-o-chon', 'Nút chọn', 'nut chon radio phuong an duoc chon trac nghiem', svg(
    uni(LILAC, ringD(35, 35, 26, 17)), uni(YELLOW, circD(35, 35, 10)))],
  ['sym-dau-dong', 'Dấu đầu dòng', 'dau dau dong gach dau dong liet ke y chinh', svg(
    uni(PEACH, circD(14, 16, 6), circD(14, 35, 6), circD(14, 54, 6)),
    uni(BEIGE, rectD(26, 12, 60, 20), rectD(26, 31, 60, 39), rectD(26, 50, 52, 58)))],
  ['sym-voi-moi', 'Dấu với mọi', 'dau voi moi luong tu menh de logic toan', svg(
    uni(MINT, barD(13, 9, 35, 60, 10), barD(57, 9, 35, 60, 10), rectD(22, 30, 48, 38)))],
  ['sym-cam', 'Dấu cấm', 'dau cam khong duoc phep khong lam bien cam', svg(
    uni(PINK, ringD(35, 35, 27, 18), barD(17, 17, 53, 53, 9)))],
  ['sym-thong-tin', 'Dấu thông tin', 'dau thong tin chu i ghi chu luu y huong dan', svg(
    uni(BLUE, ringD(35, 35, 27, 19)), uni(BLUE, circD(35, 23, 4.5), rectD(31, 31, 39, 49)))],
  ['sym-delta', 'Kí hiệu Delta', 'delta tam giac denta bien thien phuong trinh bac hai toan', svg(
    uni(YELLOW, P([[35, 8], [64, 60], [6, 60]]) + P([[35, 28], [20, 51], [50, 51]])))],
  ['sym-tap-rong', 'Tập rỗng', 'tap rong tap hop rong khong co phan tu toan', svg(
    uni(LILAC, ringD(35, 35, 21, 12), barD(51, 7, 19, 63, 8)))],
]
SYM_NEW.reduce((after, [id, name, keywords, svg]) => {
  ADDED.push({ after, id, name, category: 'sym', keywords, svg })
  return id
}, 'sym-xap-xi')

export const REDRAWN = {
  // cấu tạo hoa (bổ dọc): cánh, nhị (chỉ nhị + bao phấn), nhuỵ (bầu, vòi, đầu nhuỵ), đài, cuống, lá
  'bio-hoa-cau-tao': svg(
    line('M35 48V66'), fill('M35 59Q45 50 56 54Q47 63 35 59Z', GREEN),
    fill('M25 44Q7 36 9 13Q22 17 31 40Z', PINK), fill('M45 44Q63 36 61 13Q48 17 39 40Z', PINK),
    line('M30 38L22 19M40 38L48 19'), fill(ellipseD(21, 16, 3.5, 4.5), YELLOW), fill(ellipseD(49, 16, 3.5, 4.5), YELLOW),
    fill('M20 40Q26 51 35 51Q44 51 50 40Z', GREEN),
    fill('M28 43Q28 35 35 35Q42 35 42 43Q42 49 35 49Q28 49 28 43Z', MINT), cp(35, 43, 2.2, WHITE),
    line('M35 35V17'), cp(35, 13, 4, PEACH),
  ),
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

// --- khung & nhãn: vẽ lại icon sheet bị lệch màu tô + 30 icon mới ---
const rrD = (x1, y1, x2, y2, r) =>
  `M${x1 + r} ${y1}H${x2 - r}A${r} ${r} 0 0 1 ${x2} ${y1 + r}V${y2 - r}A${r} ${r} 0 0 1 ${x2 - r} ${y2}H${x1 + r}A${r} ${r} 0 0 1 ${x1} ${y2 - r}V${y1 + r}A${r} ${r} 0 0 1 ${x1 + r} ${y1}Z`
const txt = (x1, x2, ...ys) => line(ys.map((y) => `M${x1} ${y}H${x2}`).join(''))
const dashed = (d, color) => `<path d="${d}" fill="${color}"/>` + line(d, ' stroke-dasharray="7 5"')
const thin = (d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.5"/>`
/** tem: cạnh răng cưa (khuyết nửa tròn) quanh hình vuông a..b */
const stampD = (a, b, n, r) => {
  const step = (b - a) / n
  const rot = ([x, y], k) => { for (let i = 0; i < k; i++) [x, y] = [70 - y, x]; return `${round1(x)} ${round1(y)}` }
  let d = ''
  for (let k = 0; k < 4; k++) {
    d += (k ? 'L' : 'M') + rot([a, a], k)
    for (let i = 0; i < n; i++) { const c = a + step * (i + 0.5); d += `L${rot([c - r, a], k)}A${r} ${r} 0 0 0 ${rot([c + r, a], k)}` }
  }
  return d + 'Z'
}
const rosetteD = (cx, cy, R, n, r) => {
  const pts = Array.from({ length: n }, (_, i) => polar(cx, cy, R, (i * 360) / n - 90))
  return `M${pts[0].join(' ')}` + pts.map((_, i) => `A${r} ${r} 0 0 1 ${pts[(i + 1) % n].join(' ')}`).join('') + 'Z'
}
const hexD = (r) => P(Array.from({ length: 6 }, (_, i) => polar(35, 35, r, i * 60 - 90)))
const cloudD = 'M16 52A11 11 0 0 1 13 31A13 13 0 0 1 33 17A13 13 0 0 1 56 24A12 12 0 0 1 56 52Z'

Object.assign(REDRAWN, {
  'frame-bang-ron': svg(fill('M16 26H5L10 35L5 44H16Z', PINK), fill('M54 26H65L60 35L65 44H54Z', PINK), fill('M14 21H56V49H14Z', PINK), txt(23, 47, 35)),
  'nav-ruy-bang': svg(fill('M13 30H3L8 39L3 48H15Z', PEACH), fill('M57 30H67L62 39L67 48H55Z', PEACH), fill('M10 24Q35 14 60 24V44Q35 34 10 44Z', YELLOW)),
  'frame-vien-net-dut': svg(dashed(rrD(8, 12, 62, 58, 7), MINT), txt(20, 50, 30, 40)),
  'frame-bong-suy-nghi': svg(fill('M20 46A9 9 0 0 1 16 28A11 11 0 0 1 34 17A11 11 0 0 1 53 22A10 10 0 0 1 56 42A9 9 0 0 1 44 48H26A7 7 0 0 1 20 46Z', LILAC), fill(circD(17, 55, 4.5), LILAC), fill(circD(9, 63, 2.5), LILAC)),
  'frame-cuon-tieu-de': svg(fill('M14 20H56V50H14Z', BEIGE), fill(rrD(5, 16, 17, 54, 6), PEACH), fill(rrD(53, 16, 65, 54, 6), PEACH), txt(25, 45, 30, 40)),
  'frame-the-lat': svg(fill('M14 8H56V48L44 62H14Z', BEIGE), fill('M56 48H47Q44 48 44 51V62Z', PEACH), txt(22, 48, 20, 29, 38)),
  'frame-bong-het': svg(fill('M22 50L9 64L32 55Z', YELLOW), fill(P(Array.from({ length: 24 }, (_, i) => polar(35, 33, i % 2 ? 21 : 28, i * 15 - 90))), YELLOW), txt(26, 44, 30, 38)),
  'nav-the-buoc': svg(fill('M6 60V46H25V32H44V18H64V60Z', GREEN), line('M25 46V60M44 32V60')),
  'nav-cau-hoi': svg(fill(rrD(6, 14, 60, 60, 7), BLUE), txt(14, 38, 36, 46), fill(circD(54, 16, 10), PINK), line('M50.5 13.5A3.5 3.5 0 1 1 54 17V19'), dot(54, 23.5, 1.8)),
  'nav-dap-an': svg(fill(rrD(6, 14, 60, 60, 7), MINT), txt(14, 38, 36, 46), fill(circD(54, 16, 10), GREEN), line('M49.5 16L53 19.5L59 13')),
})

const FRAME_NEW = [
  ['frame-tron', 'Khung tròn', 'khung tron hinh tron vien tron', svg(fill(circD(35, 35, 27), BLUE), line(circD(35, 35, 20), ' stroke-dasharray="4 5"'))],
  ['frame-oval', 'Khung bầu dục', 'khung bau duc oval elip', svg(fill(ellipseD(35, 35, 29, 21), PEACH), txt(23, 47, 31, 40))],
  ['frame-luc-giac', 'Khung lục giác', 'khung luc giac sau canh to ong', svg(fill(hexD(29), MINT), line(hexD(21)))],
  ['frame-trai-tim', 'Khung trái tim', 'khung trai tim yeu thuong loi chuc', svg(fill('M35 61C14 47 7 36 8 25A13 13 0 0 1 35 19A13 13 0 0 1 62 25C63 36 56 47 35 61Z', PINK), line('M16 27A7 7 0 0 1 22 21'))],
  ['frame-dam-may', 'Khung đám mây', 'khung dam may y tuong suy nghi', svg(fill(cloudD, BLUE), txt(25, 47, 38, 46))],
  ['frame-khien', 'Khung khiên', 'khung khien huy hieu bao ve', svg(fill('M35 7L60 15V33C60 48 49 58 35 64C21 58 10 48 10 33V15Z', LILAC), line('M35 15L52 20.5V33C52 43 45 50 35 55C25 50 18 43 18 33V20.5Z'))],
  ['frame-hoa-van', 'Khung hoa văn tròn', 'khung hoa van tron rang cua huy hieu nhan dan', svg(fill(rosetteD(35, 35, 25, 12, 7), YELLOW), fill(circD(35, 35, 16), BEIGE))],
  ['frame-tem', 'Khung tem thư', 'khung tem thu buu chinh rang cua', svg(fill(stampD(9, 61, 5, 2.6), BEIGE), fill(rectD(17, 17, 53, 53), PINK), line('M22 47L30 36L37 43L42 38L48 47'))],
  ['frame-ghim', 'Giấy ghim', 'giay ghim ghi chu dinh ghim bang tin', svg(fill('M12 14H58V60H12Z', YELLOW), txt(20, 50, 30, 40, 50), fill(circD(35, 14, 6), PINK))],
  ['frame-giay-o-li', 'Giấy ô li', 'giay o li o vuong ke o vo', svg(fill(rectD(10, 10, 60, 60), BLUE), thin('M10 22.5H60M10 35H60M10 47.5H60M22.5 10V60M35 10V60M47.5 10V60'), line(rectD(10, 10, 60, 60)))],
  ['frame-giay-ke-dong', 'Giấy kẻ dòng', 'giay ke dong vo viet trang vo', svg(fill(rectD(12, 8, 58, 62), BEIGE), txt(12, 58, 22, 34, 46), line('M22 8V62'))],
  ['frame-cuon-doc', 'Cuộn giấy dọc', 'cuon giay doc sac phong thu cuon', svg(fill(rectD(16, 14, 54, 56), BEIGE), fill(rrD(10, 8, 60, 18, 5), PEACH), fill(rrD(10, 52, 60, 62, 5), PEACH), txt(24, 46, 28, 36, 44))],
  ['frame-ve', 'Khung vé', 'khung ve phieu coupon', svg(fill('M8 18H62V29A6 6 0 0 0 62 41V52H8V41A6 6 0 0 0 8 29Z', YELLOW), line('M46 18V52', ' stroke-dasharray="4 4"'), txt(17, 37, 30, 40))],
  ['frame-the-ten', 'Thẻ tên', 'the ten bang ten deo nhan ten', svg(fill(rrD(8, 18, 62, 58, 6), BLUE), fill('M8 24A6 6 0 0 1 14 18H56A6 6 0 0 1 62 24V32H8Z', PINK), fill(rrD(29, 10, 41, 22, 3), BEIGE), txt(18, 52, 45))],
  ['frame-bien-mui-ten', 'Biển mũi tên', 'bien mui ten nhan chi huong', svg(fill('M8 22H50L63 35L50 48H8Z', GREEN), txt(16, 44, 35))],
  ['frame-cot-chi-duong', 'Cột chỉ đường', 'cot chi duong bien huong di', svg(fill(rectD(32, 26, 38, 64), BEIGE), fill('M10 10H52L60 18L52 26H10Z', PEACH), fill('M60 32H18L10 40L18 48H60Z', MINT))],
  ['frame-thoai-tron', 'Bong bóng thoại tròn', 'bong bong thoai tron loi noi hoi thoai', svg(fill('M35 10C51 10 62 19 62 31C62 43 51 52 35 52C32 52 29 51.7 26.5 51L14 60L17 48C11 44 8 38 8 31C8 19 19 10 35 10Z', LILAC), txt(22, 48, 27, 36))],
  ['frame-hoi-thoai', 'Hội thoại', 'hoi thoai hai bong bong trao doi tro chuyen', svg(fill('M33 8H57A7 7 0 0 1 64 15V31A7 7 0 0 1 57 38H56L58 46L48 38H33A7 7 0 0 1 26 31V15A7 7 0 0 1 33 8Z', BLUE), fill('M13 28H37A7 7 0 0 1 44 35V51A7 7 0 0 1 37 58H22L13 65V58A7 7 0 0 1 6 51V35A7 7 0 0 1 13 28Z', PEACH), txt(14, 36, 39, 47))],
  ['frame-chu-thich', 'Khung chú thích', 'khung chu thich ghi chu chi xuong', svg(fill('M13 10H57A6 6 0 0 1 63 16V42A6 6 0 0 1 57 48H42L35 58L28 48H13A6 6 0 0 1 7 42V16A6 6 0 0 1 13 10Z', YELLOW), txt(17, 53, 22, 30, 38))],
  ['frame-bat-giac', 'Khung bát giác', 'khung bat giac tam canh cat goc bien', svg(fill('M20 12H50L60 22V48L50 58H20L10 48V22Z', PEACH), line('M23 18H47L54 25V45L47 52H23L16 45V25Z'))],
  ['frame-thu-muc', 'Thẻ thư mục', 'the thu muc tab ho so', svg(fill('M8 16A4 4 0 0 1 12 12H28L33 18H58A4 4 0 0 1 62 22V54A4 4 0 0 1 58 58H12A4 4 0 0 1 8 54Z', YELLOW), line('M8 26H62'))],
  ['frame-phong-bi', 'Phong bì', 'phong bi thu thiep moi', svg(fill(rectD(8, 16, 62, 56), BEIGE), line('M8 16L35 38L62 16M8 56L28 33M62 56L42 33'))],
  ['frame-man-hinh', 'Khung màn hình', 'khung man hinh may tinh trinh chieu', svg(fill('M28 48H42L44 60H26Z', BEIGE), fill(rrD(6, 10, 64, 50, 4), BLUE), fill(rectD(12, 16, 58, 44), MINT), line('M20 60H50'))],
  ['frame-dien-thoai', 'Khung điện thoại', 'khung dien thoai man hinh di dong', svg(fill(rrD(20, 6, 50, 64, 6), LILAC), fill(rectD(24, 14, 46, 54), BLUE), line('M32 59H38'))],
  ['frame-tranh', 'Khung tranh', 'khung tranh khung anh treo tuong', svg(fill(rectD(6, 6, 64, 64), YELLOW), fill(rectD(16, 16, 54, 54), BEIGE), line('M6 6L16 16M64 6L54 16M6 64L16 54M64 64L54 54'))],
  ['frame-co-nheo', 'Cờ đuôi nheo', 'co duoi nheo nhan co hieu', svg(fill('M12 10H62L52 22L62 34H12Z', PINK), line('M12 8V64'))],
  ['frame-ruy-bang-goc', 'Thẻ ruy băng góc', 'the ruy bang goc noi bat moi', svg(fill(rectD(8, 8, 62, 62), BLUE), fill('M36 8H49L62 21V34Z', PINK), txt(16, 38, 32, 42, 52))],
  ['frame-bia-kep', 'Bìa kẹp hồ sơ', 'bia kep ho so bang kep giay', svg(fill(rrD(12, 10, 58, 64, 5), BEIGE), fill(rectD(18, 18, 52, 58), YELLOW), fill(rrD(26, 6, 44, 16, 3), PEACH), txt(24, 46, 30, 39, 48))],
  ['frame-nhan-tron', 'Nhãn tròn treo', 'nhan tron the treo day nhan gia', svg(line('M38 24Q30 12 16 8'), fill(circD(38, 42, 20), MINT), fill(circD(38, 28, 3), BEIGE))],
  ['frame-bang-den', 'Bảng đen', 'bang den bang phan lop hoc', svg(line('M18 52L14 63M52 52L56 63'), fill(rectD(6, 10, 64, 52), BEIGE), fill(rectD(12, 16, 58, 46), GREEN), line('M19 26H41M19 35H49'))],
]
FRAME_NEW.reduce((after, [id, name, keywords, svg]) => {
  ADDED.push({ after, id, name, category: 'frame', keywords, svg })
  return id
}, 'nav-dap-an')

// --- mũi tên bổ sung (30 icon, nhóm "Mũi tên"): mũi tên khối, đường cong lấy mẫu rồi dời biên ±w/2 ---
/** mũi tên khối theo đường tâm pts (điểm cuối là đầu mũi): thân rộng w, đầu rộng hw dài hl */
const curveArrowD = (pts, w = 11, hw = 25, hl = 14) => {
  // cắt bỏ đoạn cuối dài hl làm chỗ cho đầu mũi
  const tip = pts[pts.length - 1]
  let i = pts.length - 1, base
  while (i > 0 && Math.hypot(pts[i - 1][0] - tip[0], pts[i - 1][1] - tip[1]) < hl) i--
  const [ax, ay] = pts[i - 1], [bx, by] = pts[i]
  const da = Math.hypot(ax - tip[0], ay - tip[1]), db = Math.hypot(bx - tip[0], by - tip[1])
  const t = (da - hl) / (da - db || 1)
  base = [ax + (bx - ax) * t, ay + (by - ay) * t]
  const body = [...pts.slice(0, i), base]
  const nrm = (k) => {
    const [x0, y0] = body[Math.max(0, k - 1)], [x1, y1] = body[Math.min(body.length - 1, k + 1)]
    const L = Math.hypot(x1 - x0, y1 - y0)
    return [-(y1 - y0) / L, (x1 - x0) / L]
  }
  const side = (s, h) => body.map(([x, y], k) => { const [nx, ny] = nrm(k); return [x + nx * h * s, y + ny * h * s] })
  const [nx, ny] = nrm(body.length - 1)
  const L = side(1, w / 2), R = side(-1, w / 2).reverse()
  return P([...L, [base[0] + nx * hw / 2, base[1] + ny * hw / 2], tip, [base[0] - nx * hw / 2, base[1] - ny * hw / 2], ...R])
}
const arD = (x1, y1, x2, y2, w, hw, hl) => curveArrowD([[x1, y1], [(x1 + x2) / 2, (y1 + y2) / 2], [x2, y2]], w, hw, hl)
/** cung tròn từ góc a0 tới a1 (độ, chiều kim đồng hồ khi a1 > a0) */
const arcPts = (cx, cy, R, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, k) => polar(cx, cy, R, a0 + ((a1 - a0) * k) / n))
const sinePts = (x1, x2, cy, A, periods) => Array.from({ length: 33 }, (_, k) => { const x = x1 + ((x2 - x1) * k) / 32; return [x, cy - A * Math.sin((k / 32) * periods * 2 * Math.PI)] })
const a1 = (color, d) => svg(uni(color, d))
const barsD = (hs) => hs.map((h, k) => rectD(8 + k * 14, 62 - h, 18 + k * 14, 62))

const ARROW_NEW = [
  ['arrow-trai', 'Mũi tên trái', 'mui ten trai quay lai truoc', a1(PEACH, arD(62, 35, 8, 35, 14, 32, 22))],
  ['arrow-len', 'Mũi tên lên', 'mui ten len tang di len', a1(GREEN, arD(35, 62, 35, 8, 14, 32, 22))],
  ['arrow-xuong', 'Mũi tên xuống', 'mui ten xuong giam di xuong', a1(PINK, arD(35, 8, 35, 62, 14, 32, 22))],
  ['arrow-cheo-len', 'Mũi tên chéo lên', 'mui ten cheo len tang truong', a1(MINT, arD(12, 58, 58, 12, 12, 30, 20))],
  ['arrow-cheo-xuong', 'Mũi tên chéo xuống', 'mui ten cheo xuong suy giam', a1(LILAC, arD(12, 12, 58, 58, 12, 30, 20))],
  ['arrow-hai-chieu-doc', 'Mũi tên hai chiều dọc', 'mui ten hai chieu doc len xuong', svg(uni(YELLOW, curveArrowD([[35, 35], [35, 6]], 12, 28, 17), curveArrowD([[35, 34], [35, 64]], 12, 28, 17)))],
  ['arrow-bon-huong', 'Mũi tên bốn hướng', 'mui ten bon huong di chuyen moi phia', svg(uni(BLUE, ...[[35, 6], [64, 35], [35, 64], [6, 35]].map(([x, y]) => curveArrowD([[35, 35], [x, y]], 9, 20, 12))))],
  ['arrow-toa-ra', 'Mũi tên tỏa ra', 'mui ten toa ra lan rong phan tan', svg(uni(PEACH, circD(35, 35, 8), ...[-45, 45, 135, 225].map((a) => curveArrowD([polar(35, 35, 8, a), polar(35, 35, 29, a)], 8, 19, 11))))],
  ['arrow-thu-vao', 'Mũi tên thu vào', 'mui ten thu vao tap trung hoi tu', svg(uni(MINT, ...[-45, 45, 135, 225].map((a) => curveArrowD([polar(35, 35, 30, a), polar(35, 35, 8, a)], 8, 19, 11))))],
  ['arrow-hoi-tu', 'Mũi tên hội tụ', 'mui ten hoi tu hop lai ket qua', svg(uni(LILAC, curveArrowD([[6, 12], [22, 12], [34, 33], [36, 35], [44, 35]], 9, 1, 0.1), curveArrowD([[6, 58], [22, 58], [34, 37], [36, 35], [44, 35]], 9, 1, 0.1), arD(34, 35, 64, 35, 10, 24, 14)))],
  ['arrow-vong-tron', 'Mũi tên vòng tròn', 'mui ten vong tron chu trinh lap lai', a1(BLUE, curveArrowD(arcPts(35, 35, 22, -60, 250), 10, 23, 13))],
  ['arrow-hoan-tac', 'Hoàn tác', 'hoan tac quay lai undo lam lai', a1(PEACH, curveArrowD([[24, 56], ...arcPts(38, 38, 18, 90, -90), [8, 20]], 10, 24, 13))],
  ['arrow-lam-lai', 'Làm lại', 'lam lai redo tiep tuc', a1(GREEN, curveArrowD([[46, 56], ...arcPts(32, 38, 18, 90, 270), [62, 20]], 10, 24, 13))],
  ['arrow-chu-l', 'Mũi tên gấp góc', 'mui ten gap goc chu l re phai', a1(YELLOW, curveArrowD([[16, 8], [16, 44], [17, 48], [20, 50], [24, 51], [62, 51]], 11, 25, 14))],
  ['arrow-gap-khuc', 'Mũi tên gấp khúc', 'mui ten gap khuc zic zac bien dong', a1(PINK, curveArrowD([[6, 52], [24, 30], [36, 44], [62, 14]], 9, 22, 13))],
  ['arrow-chu-trinh-ba', 'Chu trình ba bước', 'chu trinh ba buoc vong lap quy trinh', svg(uni(MINT, ...[-80, 40, 160].map((a) => curveArrowD(arcPts(35, 36, 22, a, a + 95, 12), 9, 20, 11))))],
  ['arrow-song-song', 'Mũi tên song song', 'mui ten song song cung chieu', svg(uni(BLUE, arD(6, 22, 64, 22, 9, 22, 13)), uni(BLUE, arD(6, 48, 64, 48, 9, 22, 13)))],
  ['arrow-nguoc-chieu', 'Mũi tên ngược chiều', 'mui ten nguoc chieu trao doi qua lai', svg(uni(PEACH, arD(6, 22, 64, 22, 9, 22, 13)), uni(MINT, arD(64, 48, 6, 48, 9, 22, 13)))],
  ['arrow-tang-truong', 'Biểu đồ tăng', 'bieu do tang truong mui ten len cot', svg(uni(BEIGE, ...barsD([10, 18, 26, 34])), uni(GREEN, arD(8, 36, 62, 7, 9, 22, 13)))],
  ['arrow-suy-giam', 'Biểu đồ giảm', 'bieu do giam suy giam mui ten xuong cot', svg(uni(BEIGE, ...barsD([34, 26, 18, 10])), uni(PINK, arD(8, 7, 62, 36, 9, 22, 13)))],
  ['arrow-chevron-phai', 'Mũi tên kép phải', 'mui ten kep phai tiep theo tua nhanh', svg(uni(LILAC, chevD(10, 34, 35, 22, 12)), uni(LILAC, chevD(34, 58, 35, 22, 12)))],
  ['arrow-chevron-len', 'Mũi tên kép lên', 'mui ten kep len cap bac thang hang', svg(...[12, 32].map((y) => uni(YELLOW, P([[35, y], [60, y + 18], [60, y + 28], [35, y + 10], [10, y + 28], [10, y + 18]])))) ],
  ['arrow-nut-tron', 'Nút mũi tên tròn', 'nut mui ten tron tiep tuc bat dau', svg(fill(circD(35, 35, 28), BLUE), uni(WHITE, arD(18, 35, 52, 35, 8, 22, 13)))],
  ['arrow-tai-xuong', 'Tải xuống', 'tai xuong download luu ve', svg(uni(MINT, arD(35, 6, 35, 44, 10, 26, 15)), uni(BEIGE, P([[8, 40], [16, 40], [16, 54], [54, 54], [54, 40], [62, 40], [62, 62], [8, 62]])))],
  ['arrow-tai-len', 'Tải lên', 'tai len upload gui nop bai', svg(uni(PEACH, arD(35, 46, 35, 6, 10, 26, 15)), uni(BEIGE, P([[8, 40], [16, 40], [16, 54], [54, 54], [54, 40], [62, 40], [62, 62], [8, 62]])))],
  ['arrow-di-vao', 'Đi vào', 'di vao dang nhap vao lop cua', svg(uni(BEIGE, P([[36, 8], [62, 8], [62, 62], [36, 62], [36, 54], [54, 54], [54, 16], [36, 16]])), uni(GREEN, arD(6, 35, 46, 35, 10, 24, 14)))],
  ['arrow-cong-xuong', 'Mũi tên cong xuống', 'mui ten cong xuong re xuong', a1(LILAC, curveArrowD([[8, 22], ...arcPts(30, 44, 22, -90, 0, 12).slice(1), [52, 62]], 10, 24, 13))],
  ['arrow-xoay', 'Mũi tên xoay', 'mui ten xoay quay goc', svg(uni(BEIGE, rectD(10, 30, 38, 58)), uni(PEACH, curveArrowD(arcPts(24, 44, 32, -100, -5, 16), 9, 22, 12)))],
  ['arrow-hop-nhat', 'Mũi tên hợp nhất', 'mui ten hop nhat gop lai hai thanh mot', svg(uni(YELLOW, curveArrowD([[12, 62], [12, 52], [14, 46], [20, 40], [35, 34]], 9, 1, 0.1), curveArrowD([[58, 62], [58, 52], [56, 46], [50, 40], [35, 34]], 9, 1, 0.1), arD(35, 40, 35, 6, 10, 25, 14)))],
  ['arrow-luon-song', 'Mũi tên lượn sóng', 'mui ten luon song dao dong song', a1(BLUE, curveArrowD(sinePts(6, 64, 35, 11, 1.25), 9, 22, 12))],
]
ARROW_NEW.reduce((after, [id, name, keywords, svg]) => {
  ADDED.push({ after, id, name, category: 'arrow', keywords, svg })
  return id
}, 'arrow-nhieu-buoc')
