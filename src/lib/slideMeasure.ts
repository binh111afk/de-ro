/**
 * Đo chữ & chọn cỡ chữ cho slide — lõi "typography engine" (chặng 1).
 *
 * Vì sao có file này: trước đây cỡ chữ do từng layout đoán (bodySize/listSize/
 * thang card) còn việc co cho vừa hộp thì giao cho `FitText` ở lúc render, và
 * bản xuất PPTX không co gì cả. Hệ quả: cùng một slide nhưng editor, thumbnail
 * và file .pptx có thể hiển thị ba cỡ khác nhau, nội dung dài bị cắt.
 *
 * Nguyên tắc: **đo trước khi đặt**. Mọi hộp chữ do layout dựng ra phải được
 * chọn cỡ ngay lúc compose, dùng chung một công thức với `elementHeight` và
 * `FitText` (floor 60%). Nhờ vậy ba nơi hiển thị khớp nhau; `FitText` chỉ còn là
 * lưới an toàn cho chữ người dùng tự nhập.
 *
 * ponytail: 0,5em là bề rộng ký tự trung bình của font sans tiếng Việt. Chữ
 * toàn in hoa/nhiều dấu có thể ước lượng thiếu một dòng — floor 60% + FitText
 * vẫn chặn tràn, nên không cần đo DOM.
 */

/**
 * Bề rộng ký tự trung bình, tính theo em. 0,52 thay vì 0,5 vì font sans tiếng
 * Việt (Be Vietnam Pro) có dấu và nhiều nét ngang: đo ở 0,5 thì chữ vừa khít
 * một dòng trên giấy lại xuống dòng thật trong DOM → tràn đúng ở biên.
 */
export const CHAR_WIDTH_EM = 0.52

/** Padding dọc của hộp chữ: `p-[1%]` trên + dưới, đổi từ % bề rộng sang % chiều cao. */
export const TEXT_PADDING_PCT = 2 * (16 / 9)

/**
 * Padding ngang của hộp chữ, tính bằng cqw: `padding: 1%` là % của khối chứa
 * (khung slide) chứ không phải của hộp, nên hộp hẹp mất tỉ lệ lớn hơn hộp rộng.
 */
export const TEXT_PAD_X = 2

/** Sàn co chữ — khớp với `FitText`/`AutoFitText` trong SlideEditor (60% cỡ gốc). */
export const MIN_FIT_SCALE = 0.6

/** Font đo — trùng font nội dung mặc định của theme (xem `slideTheme.ts` SANS). */
const MEASURE_FONT = 'Be Vietnam Pro'
/** Hệ số an toàn trên bề rộng dòng: subpixel/kerning của DOM lệch vài ‰ so với canvas. */
const WRAP_SAFETY = 0.97

export interface TextStyleOpts {
  /** độ đậm chữ (400/500/600/700); đậm hơn → rộng hơn */
  weight?: number
  /** khoảng cách chữ, tính bằng em mỗi ký tự (kicker in hoa dùng 0,12) */
  letterSpacing?: number
}

type Ctx2d = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
let measureCtx: Ctx2d | null | undefined
const widthCache = new Map<string, number>()

/**
 * Canvas 2D để đo chữ thật. Chỉ có trong trình duyệt; Node (test) trả `null`
 * và `textBoxHeight` rơi về công thức ký tự cũ.
 */
function getMeasureCtx(): Ctx2d | null {
  if (measureCtx !== undefined) return measureCtx
  try {
    const canvas =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(1, 1)
        : typeof document !== 'undefined'
          ? document.createElement('canvas')
          : null
    measureCtx = (canvas?.getContext('2d') as Ctx2d | null) ?? null
  } catch {
    measureCtx = null
  }
  // Font nạp xong thì số đo cũ (đo bằng font dự phòng) không còn đúng.
  if (measureCtx && typeof document !== 'undefined' && document.fonts) {
    document.fonts.addEventListener('loadingdone', () => widthCache.clear())
  }
  return measureCtx
}

/**
 * Nạp trước các độ đậm dùng để đo. Gọi trước khi dựng layout (lúc AI trả slide)
 * để canvas đo bằng đúng font chứ không phải font dự phòng.
 */
export async function ensureMeasureFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  await Promise.all(
    [400, 500, 600, 700].map((w) =>
      document.fonts.load(`${w} 16px "${MEASURE_FONT}"`, 'Tiếng Việt ăn đậm').catch(() => []),
    ),
  )
  widthCache.clear()
}

/** Bề rộng chuỗi tính bằng em (đo ở 100px rồi chia, để không phụ thuộc cỡ). */
function emWidth(ctx: Ctx2d, text: string, weight: number): number {
  const key = `${weight}|${text}`
  const hit = widthCache.get(key)
  if (hit !== undefined) return hit
  ctx.font = `${weight} 100px "${MEASURE_FONT}", sans-serif`
  const em = ctx.measureText(text).width / 100
  widthCache.set(key, em)
  return em
}

/** Số dòng sau khi ngắt theo từ (greedy, như trình duyệt); từ quá dài bị bẻ theo ký tự. */
function wrapLines(
  ctx: Ctx2d,
  text: string,
  availEm: number,
  weight: number,
  letterSpacing: number,
): number {
  const space = emWidth(ctx, ' ', weight) + letterSpacing
  let total = 0
  for (const paragraph of text.split('\n')) {
    let lines = 1
    let line = 0
    for (const word of paragraph.split(/ +/)) {
      if (!word) continue
      const w = emWidth(ctx, word, weight) + word.length * letterSpacing
      if (w > availEm) {
        const parts = Math.ceil(w / availEm)
        if (line > 0) lines++
        lines += parts - 1
        line = w - (parts - 1) * availEm
      } else if (line === 0) {
        line = w
      } else if (line + space + w <= availEm) {
        line += space + w
      } else {
        lines++
        line = w
      }
    }
    total += lines
  }
  return total
}

/**
 * Ước lượng chiều cao cần cho text, tính bằng % chiều cao slide 16:9.
 *
 * Trong trình duyệt: ngắt dòng bằng `canvas.measureText` với font thật. Ngoài
 * trình duyệt (test Node): công thức ký tự `CHAR_WIDTH_EM`. Nếu vẫn thiếu một
 * dòng, `FitText` co cỡ chữ cho vừa hộp nên không tràn.
 */
export function textBoxHeight(
  text: string,
  widthPct: number,
  fontCqw: number,
  lineHeight = 1.25,
  opts: TextStyleOpts = {},
): number {
  if (!text.trim()) return 0
  // Padding ngang 1% mỗi bên ăn vào bề rộng khả dụng; bỏ qua bước này thì
  // ước lượng lạc quan đúng ở biên (chữ vừa khít một dòng trên giấy nhưng
  // xuống dòng thật trong DOM → tràn 2px).
  const ctx = getMeasureCtx()
  let lines: number
  if (ctx) {
    const availEm = Math.max(1, ((widthPct - TEXT_PAD_X) / fontCqw) * WRAP_SAFETY)
    lines = wrapLines(ctx, text, availEm, opts.weight ?? 400, opts.letterSpacing ?? 0)
  } else {
    const charsPerLine = Math.max(8, (widthPct - TEXT_PAD_X) / (fontCqw * CHAR_WIDTH_EM))
    lines = text
      .split('\n')
      .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / charsPerLine)), 0)
  }
  const linePct = fontCqw * lineHeight * (16 / 9)
  return Math.round((lines * linePct + TEXT_PADDING_PCT) * 10) / 10
}

export interface FitFontOptions {
  text: string
  /** bề rộng hộp, % bề rộng slide */
  widthPct: number
  /** chiều cao hộp, % chiều cao slide */
  heightPct: number
  /** cỡ mong muốn (cqw) — chỉ co xuống, không phóng to */
  baseCqw: number
  lineHeight?: number
  /** sàn co, mặc định 60% như FitText */
  minScale?: number
  weight?: number
  letterSpacing?: number
}

/**
 * Cỡ chữ lớn nhất ≤ `baseCqw` mà ước lượng vẫn nằm trong hộp.
 * Không bao giờ trả về nhỏ hơn `baseCqw * minScale`.
 */
export function fitFontSize({
  text,
  widthPct,
  heightPct,
  baseCqw,
  lineHeight = 1.4,
  minScale = MIN_FIT_SCALE,
  weight,
  letterSpacing,
}: FitFontOptions): number {
  if (!text.trim() || baseCqw <= 0 || heightPct <= 0) return Math.max(0, baseCqw)
  const style = { weight, letterSpacing }
  const fits = (size: number) =>
    textBoxHeight(text, widthPct, size, lineHeight, style) <= heightPct + 0.05
  if (fits(baseCqw)) return baseCqw
  const min = Math.max(0.2, baseCqw * minScale)
  for (let size = baseCqw - 0.05; size > min; size -= 0.05) {
    if (fits(size)) return Math.round(size * 100) / 100
  }
  return Math.round(min * 100) / 100
}
