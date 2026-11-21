import type { Deck } from '@/store/docs'

type FontGroup = 'Tiêu đề đậm' | 'Serif' | 'Sans' | 'Viết tay' | 'Mono' | 'Hệ thống'
interface SlideFont {
  id: string
  label: string
  family: string
  group: FontGroup
  weights: readonly number[]
  load?: () => Promise<unknown>
}

const web = (id: string, family: string, group: FontGroup, weights: number[], load?: SlideFont['load'], label = family): SlideFont =>
  ({ id, label, family, group, weights, load })
const system = (id: string, family: string): SlideFont => web(id, family, 'Hệ thống', [400, 700])

// Các phông dùng chung với trình soạn đề đã có stylesheet ở main.tsx.
export const SLIDE_FONTS: readonly SlideFont[] = [
  web('barlow-condensed', 'Barlow Condensed', 'Tiêu đề đậm', [400, 600, 700, 800], () => Promise.all([
    import('@fontsource/barlow-condensed/400.css'),
    import('@fontsource/barlow-condensed/600.css'),
    import('@fontsource/barlow-condensed/700.css'),
    import('@fontsource/barlow-condensed/800.css'),
  ])),
  web('oswald', 'Oswald', 'Tiêu đề đậm', [400, 600, 700], () => Promise.all([
    import('@fontsource/oswald/400.css'),
    import('@fontsource/oswald/600.css'),
    import('@fontsource/oswald/700.css'),
  ])),
  web('saira-condensed', 'Saira Condensed', 'Tiêu đề đậm', [400, 600, 700, 800], () => Promise.all([
    import('@fontsource/saira-condensed/400.css'),
    import('@fontsource/saira-condensed/600.css'),
    import('@fontsource/saira-condensed/700.css'),
    import('@fontsource/saira-condensed/800.css'),
  ])),
  web('roboto-condensed', 'Roboto Condensed', 'Tiêu đề đậm', [400, 500, 600, 700, 800], () => Promise.all([
    import('@fontsource/roboto-condensed/400.css'),
    import('@fontsource/roboto-condensed/500.css'),
    import('@fontsource/roboto-condensed/600.css'),
    import('@fontsource/roboto-condensed/700.css'),
    import('@fontsource/roboto-condensed/800.css'),
  ])),
  web('playfair-display', 'Playfair Display', 'Serif', [400, 600, 700, 800], () => Promise.all([
    import('@fontsource/playfair-display/400.css'),
    import('@fontsource/playfair-display/600.css'),
    import('@fontsource/playfair-display/700.css'),
    import('@fontsource/playfair-display/800.css'),
  ])),
  web('merriweather', 'Merriweather', 'Serif', [400, 600, 700, 800], () => Promise.all([
    import('@fontsource/merriweather/400.css'),
    import('@fontsource/merriweather/600.css'),
    import('@fontsource/merriweather/700.css'),
    import('@fontsource/merriweather/800.css'),
  ])),
  web('source-serif-4', 'Source Serif 4', 'Serif', [400, 500, 600, 700, 800], () => Promise.all([
    import('@fontsource/source-serif-4/400.css'),
    import('@fontsource/source-serif-4/500.css'),
    import('@fontsource/source-serif-4/600.css'),
    import('@fontsource/source-serif-4/700.css'),
    import('@fontsource/source-serif-4/800.css'),
  ])),
  web('montserrat', 'Montserrat', 'Sans', [400, 500, 600, 700, 800], () => Promise.all([
    import('@fontsource/montserrat/400.css'),
    import('@fontsource/montserrat/500.css'),
    import('@fontsource/montserrat/600.css'),
    import('@fontsource/montserrat/700.css'),
    import('@fontsource/montserrat/800.css'),
  ])),
  web('lexend', 'Lexend', 'Sans', [400, 500, 600, 700, 800], () => Promise.all([
    import('@fontsource/lexend/400.css'),
    import('@fontsource/lexend/500.css'),
    import('@fontsource/lexend/600.css'),
    import('@fontsource/lexend/700.css'),
    import('@fontsource/lexend/800.css'),
  ])),
  web('inter', 'Inter', 'Sans', [400, 500, 600, 700, 800], () => Promise.all([
    import('@fontsource/inter/400.css'),
    import('@fontsource/inter/500.css'),
    import('@fontsource/inter/600.css'),
    import('@fontsource/inter/700.css'),
    import('@fontsource/inter/800.css'),
  ])),
  web('caveat', 'Caveat', 'Viết tay', [400, 600, 700], () => Promise.all([
    import('@fontsource/caveat/400.css'),
    import('@fontsource/caveat/600.css'),
    import('@fontsource/caveat/700.css'),
  ])),
  web('jetbrains-mono', 'JetBrains Mono', 'Mono', [400, 500, 600, 700, 800], () => Promise.all([
    import('@fontsource/jetbrains-mono/400.css'),
    import('@fontsource/jetbrains-mono/500.css'),
    import('@fontsource/jetbrains-mono/600.css'),
    import('@fontsource/jetbrains-mono/700.css'),
    import('@fontsource/jetbrains-mono/800.css'),
  ])),
  web('lora', 'Lora', 'Serif', [400, 600, 700]),
  web('be-vietnam-pro', 'Be Vietnam Pro', 'Sans', [400, 500, 600, 700]),
  web('nunito', 'Nunito', 'Sans', [400, 600, 700, 800]),
  web('space-grotesk', 'Space Grotesk', 'Sans', [500, 700]),
  web('patrick-hand', 'Patrick Hand', 'Viết tay', [400]),
  web('jetbrains-mono-variable', 'JetBrains Mono Variable', 'Mono', [100, 200, 300, 400, 500, 600, 700, 800], undefined),
  system('times-new-roman', 'Times New Roman'),
  system('arial', 'Arial'),
  system('arial-narrow', 'Arial Narrow'),
  system('georgia', 'Georgia'),
  system('tahoma', 'Tahoma'),
  system('verdana', 'Verdana'),
  system('segoe-ui', 'Segoe UI'),
  system('calibri', 'Calibri'),
  system('courier-new', 'Courier New'),
]

export const primaryFont = (stack?: string) => (stack ?? '').split(',')[0].trim().replace(/^['"]|['"]$/g, '')
export const slideFontByName = (name?: string) => {
  const key = primaryFont(name).toLowerCase()
  return SLIDE_FONTS.find(font => font.id === key || font.family.toLowerCase() === key)
}

/** Cùng danh sách phông dự phòng khi vẽ chữ HTML, đo canvas và xuất PNG. */
export function slideFontStack(family: string): string {
  if (family.includes(',')) return family
  switch (family) {
    case 'Lora': return 'Lora, Georgia, serif'
    case 'JetBrains Mono Variable': return "'JetBrains Mono Variable', ui-monospace, monospace"
    case 'Patrick Hand': return "'Patrick Hand', 'Nunito', sans-serif"
    case 'Space Grotesk': return "'Space Grotesk', 'Be Vietnam Pro', sans-serif"
    default: return slideFontByName(family)?.load ? `"${family}", "Be Vietnam Pro", sans-serif` : `${family}, sans-serif`
  }
}

const imports = new Map<SlideFont, Promise<unknown>>()
const fontLoads = new Map<string, Promise<FontFace[]>>()
const probe = 'Aa 0123456789 Ăn Âm Ê Ô Ơ Ư Đ ắ ằ ẳ ẵ ặ ể ễ ệ ố ổ ộ ớ ở ợ ứ ử ự ỳ ỹ ỷ ỵ'

async function register(font: SlideFont) {
  if (!font.load) return
  if (!imports.has(font)) imports.set(font, font.load().catch(error => {
    imports.delete(font)
    console.error('Lỗi nạp phông slide', font.family, error)
  }))
  await imports.get(font)
}

export async function previewSlideFont(family: string) {
  const font = slideFontByName(family)
  if (font && typeof document !== 'undefined') await register(font)
}

export async function previewSlideFonts() {
  if (typeof document === 'undefined' || !document.fonts) return
  await Promise.all(SLIDE_FONTS.map(register))
}

export async function ensureFonts({ theme, slides }: Pick<Deck, 'theme' | 'slides'>) {
  if (typeof document === 'undefined' || !document.fonts) return
  const requests = new Map<string, { font: SlideFont; weight: number; style: string; text: string }>()
  const add = (family: string | undefined, weight: number, style = 'normal', text = '') => {
    const font = slideFontByName(family)
    if (!font || font.group === 'Hệ thống') return
    const key = `${font.id}|${weight}|${style}`
    const current = requests.get(key)
    if (current) current.text += text
    else requests.set(key, { font, weight, style, text: probe + text })
  }
  const heading = theme.fonts?.heading ?? theme.fontHeading
  const body = theme.fonts?.body ?? theme.fontBody
  if (!slides.length) {
    for (const w of [400, 500, 600, 700, 800]) {
      add(heading, w)
      add(body, w)
    }
  }
  if (slides.some(slide => !slide.html)) add(body, 400)
  for (const slide of slides) {
    if (slide.html) continue
    for (const el of slide.elements) {
      if (!el.text || (el.type !== 'text' && el.type !== 'shape')) continue
      const isBody = el.variant === 'body' || el.type === 'shape'
      add(el.fontFamily ?? (isBody ? body : heading), el.fontWeight ?? (el.type === 'shape' ? 600 : isBody ? 500 : 600), el.fontStyle, el.text)
    }
  }
  await Promise.all(Array.from(requests.values(), async ({ font, weight, style, text }) => {
    await register(font)
    // Chỉ yêu cầu mỗi ký tự một lần, kể cả khi nhiều slide dùng cùng phông.
    const css = `${style} ${weight} 16px "${font.family}"`
    const chars = [...new Set(text)].sort().join('')
    const key = css + chars
    if (!fontLoads.has(key)) {
      if (fontLoads.size >= 256) fontLoads.clear()
      fontLoads.set(key, document.fonts.load(css, chars).catch(() => {
        fontLoads.delete(key)
        return []
      }))
    }
    await fontLoads.get(key)
  }))
  await document.fonts.ready
}
