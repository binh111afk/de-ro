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
export const REDRAWN = {
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
    fill('M37 40L47.5 13A3.8 3.8 0 0 1 54.5 15.8L45 43Z', BLUE),
    circle(51.5, 9.5, 5, PEACH),
    fill('M14 62V47C14 39 20.5 34.5 28 34.5C35.5 34.5 42 39 42 47V62Z', BLUE),
    circle(28, 22, 7.5, PEACH),
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
