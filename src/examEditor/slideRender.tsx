/** Slide — hiển thị phần tử (chữ tự co, hình, biểu đồ, ảnh thu nhỏ slide). */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { slideBgStyle } from '@/lib/slideBackground'
import { FRAME_PLACEHOLDER, photoFrameClip, shapeClipOf } from '@/lib/slideShapes'
import { isPresetShape, isStrokeOnlyShape, presetPaths, prstOf } from '@/lib/slidePresets'
import { slideIconById } from '@/lib/slideIconLibrary'
import { graphicById, graphicMarkup } from '@/lib/slideGraphics'
import { hasRich } from '@/lib/slideMath'
import { cn } from '@/lib/cn'
import type { Slide, SlideElement } from '@/store/docs'
import { HtmlSlideFrame } from './HtmlSlide'
import { readableTextOn, type ResolvedTheme } from '@/lib/slideTheme'
import { readableElements } from '@/lib/slideContrast'
import { revealStyle, slideMathHtml, decorStyle } from './SlideEditor'

export function SlideThumb({ slide, theme }: { slide: Slide; theme: ResolvedTheme }) {
  if (slide.html) return <HtmlSlideFrame html={slide.html} />
  return (
    <div
      className="slide-frame relative aspect-[16/9] w-full overflow-hidden"
      data-decor={theme.decor}
      style={{ ...slideBgStyle(slide), ...decorStyle(theme) }}
    >
      {readableElements(slide, theme).map((el) => (
        <SlideElView key={el.id} el={el} theme={theme} />
      ))}
    </div>
  )
}

/**
 * Khối chữ trong slide ở chế độ xem: tự co cỡ chữ cho tới khi nội dung
 * vừa khung, nên nội dung dài (AI sinh nhiều ý) không bị cắt.
 */
/**
 * Fit lại chữ khi webfont load xong. Font swap đổi bề rộng ký tự → số dòng đổi,
 * nhưng kích thước hộp không đổi nên ResizeObserver không bắt được. Thiếu bước
 * này, lần fit đầu (font fallback) tưởng vừa nhưng hiển thị thật lại tràn 1–2px.
 */
export function refitOnFonts(fit: () => void): () => void {
  let alive = true
  const run = () => {
    if (alive) fit()
  }
  document.fonts?.ready.then(run).catch(() => {})
  document.fonts?.addEventListener('loadingdone', run)
  return () => {
    alive = false
    document.fonts?.removeEventListener('loadingdone', run)
  }
}

export function FitText({
  children,
  html,
  baseSize,
  style,
}: {
  children: React.ReactNode
  /** HTML đã vẽ công thức (KaTeX) — có thì dùng thay cho `children` */
  html?: string
  /** cỡ chữ tối đa, tính bằng cqw */
  baseSize: number
  style: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(baseSize)

  useEffect(() => {
    setSize(baseSize)
  }, [baseSize])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const min = baseSize * 0.6
    const fit = () => {
      let s = baseSize
      const fits = (px: number) => {
        el.style.fontSize = `${px}cqw`
        return el.scrollHeight <= el.clientHeight + 1
      }
      if (!fits(s)) while (s > min && !fits(s)) s -= 0.1
      // giữ 2 chữ số: compose-time đã fit tới 0,01cqw, làm tròn lên 0,1 sẽ
      // biến 2,45 thành 2,5 và gây tràn đúng ở biên
      const final = Math.floor(s * 100) / 100
      setSize(final)
      el.style.fontSize = `${final}cqw`
    }
    fit()
    // hộp đổi kích thước (kéo tay nắm) cũng phải fit lại, không chỉ khi đổi chữ
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    const stopFonts = refitOnFonts(fit)
    return () => {
      stopFonts()
      ro.disconnect()
    }
  }, [children, html, baseSize])

  const box: React.CSSProperties = {
    ...style,
    fontSize: `${size}cqw`,
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
  }
  // Công thức nằm trong MỘT khối con: hộp chữ canh giữa dùng flex-column, nếu để
  // chữ và `.katex` làm con trực tiếp thì mỗi phần thành một hàng riêng ("Vậy" / phân số).
  return html !== undefined ? (
    <div ref={ref} style={box}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  ) : (
    <div ref={ref} style={box}>
      {children}
    </div>
  )
}

/** transform của phần tử: xoay quanh tâm rồi lật (giữ nguyên thứ tự trong CSS). */
export function elTransform(el: SlideElement): string | undefined {
  const t = [
    el.rotation ? `rotate(${el.rotation}deg)` : '',
    el.flipX ? 'scaleX(-1)' : '',
    el.flipY ? 'scaleY(-1)' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return t || undefined
}

/** font của theme đã là CSS stack đầy đủ, font người dùng chọn chỉ là tên */
export function fontStack(font: string): string {
  if (font.includes(',')) return font
  return font === 'Lora' ? 'Lora, Georgia, serif' : `${font}, sans-serif`
}

/** Đường nối cong (connector): S-curve tiếp tuyến ngang trong hộp phần tử; lật dọc bằng `flipY`. */
export function ConnectorSvg({ el, theme }: { el: SlideElement; theme: ResolvedTheme }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }}>
      <path
        d="M0,0 C50,0 50,100 100,100"
        fill="none"
        stroke={el.borderColor ?? theme.accent}
        strokeWidth={el.border ?? 3}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/**
 * CSS của hình khối (nền, bo góc, viền, bóng, đường cắt, độ đục) — dùng chung cho bản xem và bản chỉnh sửa.
 * Hình bị cắt (sao, tim, tam giác…) cắt luôn cả viền CSS, nên viền của chúng vẽ bằng lớp trong thu vào (`shapeInner`).
 */
export function shapeCss(el: SlideElement, theme: ResolvedTheme): React.CSSProperties {
  // hình dựng sẵn vẽ bằng SVG (PresetSvg): chỉ cần độ đục và bóng (drop-shadow theo đúng đường viền hình)
  if (isPresetShape(el.shape)) return { opacity: el.opacity, filter: SHADOW_FILTERS[shadowLevelOf(el, theme)] }
  const isLine = el.shape === 'line'
  const border = isLine ? 0 : (el.border ?? theme.border)
  const clip = shapeClipOf(el)
  const borderColor = el.borderColor ?? theme.borderColor
  return {
    background: clip && border ? borderColor : (el.fill ?? theme.accent),
    // bo góc / viền tính theo khung slide rộng 1000px (cqw) để thumbnail thu nhỏ đúng tỉ lệ, không bo tròn quá tay
    borderRadius: el.shape === 'ellipse' ? '50%' : el.shape === 'round' ? `${(el.radius ?? theme.radius) / 10}cqw` : 0,
    clipPath: clip,
    boxShadow: isLine ? undefined : shadowCss(el, theme),
    border: !clip && border ? `max(1px, ${border / 10}cqw) ${el.borderStyle ?? 'solid'} ${borderColor}` : undefined,
    opacity: el.opacity,
  }
}

export const isHollowShape = (el: SlideElement) =>
  el.type === 'shape' && el.shape !== 'line' && !el.text && (el.fill === 'transparent' || el.fill === 'none')
/** vùng nhận chuột của hình rỗng: dải viền rộng 10px quanh mép trong (evenodd khoét phần giữa) */
export const HOLLOW_HIT =
  'polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, 10px 10px, 10px calc(100% - 10px), calc(100% - 10px) calc(100% - 10px), calc(100% - 10px) 10px, 10px 10px)'

/** Bóng đổ theo mức (0 không, 1 nhẹ, 2 vừa, 3 đậm); chưa chọn mức thì theo `shadow` và bộ màu như trước. */
export const SHADOWS = [
  undefined,
  '0 0.3cqw 0.9cqw -0.2cqw rgb(15 23 42 / 0.25)',
  '0 0.8cqw 2.4cqw -0.6cqw rgb(15 23 42 / 0.28)',
  '0 1.2cqw 3.6cqw -0.5cqw rgb(15 23 42 / 0.42)',
]
export const SHADOW_FILTERS = [
  undefined,
  'drop-shadow(0 0.3cqw 0.5cqw rgb(15 23 42 / 0.3))',
  'drop-shadow(0 0.7cqw 1.1cqw rgb(15 23 42 / 0.32))',
  'drop-shadow(0 1.1cqw 1.8cqw rgb(15 23 42 / 0.45))',
]
export const shadowLevelOf = (el: SlideElement, theme: ResolvedTheme): 0 | 1 | 2 | 3 =>
  el.shadowLevel ?? (el.shadow === true || (el.shadow !== false && theme.shadow !== 'none') ? 2 : 0)

export function shadowCss(el: SlideElement, theme: ResolvedTheme): string | undefined {
  if (el.shadowLevel !== undefined) return SHADOWS[el.shadowLevel]
  if (el.shadow === false || (el.shadow !== true && theme.shadow === 'none')) return undefined
  return theme.shadow === 'hard' ? '0.6cqw 0.6cqw 0 rgb(17 24 39 / 0.92)' : SHADOWS[2]
}

/** mẫu nét đứt/chấm theo độ dày viền (đơn vị px của SVG) */
export const dashOf = (style: SlideElement['borderStyle'], width: number): string | undefined =>
  style === 'dashed' ? `${width * 3} ${width * 2}` : style === 'dotted' ? `0 ${width * 2}` : undefined

/** Hình dựng sẵn (OOXML prst) vẽ bằng SVG: nền, nét, và phần chỉ có nét/chỉ có nền của từng hình. */
export function PresetSvg({ el, theme }: { el: SlideElement; theme: ResolvedTheme }) {
  const { W, H, both, fillOnly, strokeOnly } = presetPaths(prstOf(el.shape), el.w, el.h)
  const fill = el.fill ?? theme.accent
  const border = el.border ?? theme.border ?? 0
  const outline = border ? el.borderColor ?? theme.borderColor : 'none'
  const common = { vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', display: 'block' }}>
      {both && <path d={both} fill={isStrokeOnlyShape(el.shape) ? 'none' : fill} stroke={outline} strokeWidth={border} strokeDasharray={dashOf(el.borderStyle, border)} {...common} />}
      {fillOnly && <path d={fillOnly} fill={fill} stroke="none" />}
      {strokeOnly && (
        // nét của đường nối/cung: dùng màu tô làm màu nét nếu hình không có nền
        <path d={strokeOnly} fill="none" stroke={both || fillOnly ? outline : fill} strokeWidth={both || fillOnly ? border || 2 : Math.max(border, 3)} {...common} />
      )}
    </svg>
  )
}

/** Phần ruột của hình bị cắt có viền: thu vào `border`px để lộ viền ở ngoài. */
export function shapeInner(el: SlideElement, theme: ResolvedTheme): React.ReactNode {
  if (isPresetShape(el.shape)) return <PresetSvg el={el} theme={theme} />
  const border = el.shape === 'line' ? 0 : (el.border ?? theme.border)
  const clip = shapeClipOf(el)
  if (!clip || !border) return null
  return <div style={{ position: 'absolute', inset: border, background: el.fill ?? theme.accent, clipPath: clip }} />
}

/** Chữ nằm trong hình khối (căn giữa, tự co cho vừa); màu mặc định đọc được trên màu tô. */
export function ShapeText({ el, theme }: { el: SlideElement; theme: ResolvedTheme }) {
  if (!el.text?.trim() || el.shape === 'line') return null
  return (
    <FitText
      html={hasRich(el.text) ? slideMathHtml(el.text) : undefined}
      baseSize={el.fontSize ?? 2.4}
      style={{
        position: 'absolute',
        inset: '10% 12%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: el.align ?? 'center',
        color: el.textColor ?? readableTextOn(el.fill ?? theme.accent),
        fontFamily: fontStack(el.fontFamily ?? theme.fonts.body),
        fontWeight: el.fontWeight ?? 600,
        fontStyle: el.fontStyle,
        lineHeight: 1.25,
      }}
    >
      {el.text}
    </FitText>
  )
}

export function SlideElView({ el, theme, revealStep }: { el: SlideElement; theme: ResolvedTheme; revealStep?: number }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: `${el.w}%`,
    height: `${el.h}%`,
    zIndex: el.zIndex,
    transform: elTransform(el),
  }
  const isBody = el.variant === 'body'

  if (el.type === 'text') {
    const size = el.fontSize ?? (isBody ? 2.4 : 3.6)
    // trình chiếu: mỗi dòng là một khối riêng để hiện lần lượt (bố cục không đổi vì chỉ đổi opacity/translate)
    const lines = el.lineStep && revealStep !== undefined ? (el.text ?? '').split('\n') : null
    return (
      <FitText
        // công thức `$...$` vẽ bằng KaTeX (HTML do KaTeX sinh, không phải input thô)
        html={!lines && hasRich(el.text) ? slideMathHtml(el.text ?? '') : undefined}
        style={{
          ...style,
          color: el.textColor ?? theme.fg,
          background: el.fill,
          borderRadius: el.fill ? '0.6cqw' : undefined,
          fontFamily: fontStack(el.fontFamily ?? (isBody ? theme.fonts.body : theme.fonts.heading)),
          fontWeight: el.fontWeight ?? (isBody ? 500 : 600),
          fontStyle: el.fontStyle,
          textDecoration: el.textDecoration,
          textAlign: el.align,
          lineHeight: el.lineHeight ?? 1.25,
          letterSpacing: el.letterSpacing ? `${el.letterSpacing}em` : undefined,
          // ô có nền canh giữa dọc: chữ nằm giữa khung thay vì dồn về phía trên
          padding: el.fill ? '1.5% 3%' : '1%',
          ...(el.fill || el.valign === 'middle'
            ? { display: 'flex', flexDirection: 'column', justifyContent: 'center' }
            : {}),
        }}
        baseSize={size}
      >
        {lines
          ? lines.map((line, i) => (
              <div key={i} style={revealStyle((el.lineStep ?? 0) + i <= (revealStep ?? 0), el.anim)}>
                {hasRich(line) ? <span dangerouslySetInnerHTML={{ __html: slideMathHtml(line) }} /> : line || ' '}
              </div>
            ))
          : el.text}
      </FitText>
    )
  }

  if (el.type === 'icon') {
    const Icon = slideIconById(el.assetId)
    return Icon ? <Icon size="100%" weight="duotone" style={{ ...style, opacity: el.opacity, padding: '1%', color: el.textColor ?? theme.accent }} /> : null
  }

  if (el.type === 'connector') {
    return (
      <div style={style}>
        <ConnectorSvg el={el} theme={theme} />
      </div>
    )
  }

  if (el.type === 'graphic') {
    if (!el.graphicId || !graphicById(el.graphicId)) return null
    return (
      <div
        style={{ ...style, opacity: el.opacity, padding: graphicById(el.graphicId)?.category === 'ornament' ? 0 : '1%' }}
        // SVG do chính app sinh ra từ file thiết kế (không phải dữ liệu người
        // dùng nhập) nên nhúng trực tiếp là an toàn.
        dangerouslySetInnerHTML={{ __html: graphicMarkup(el.graphicId, el.textColor ?? theme.fg, el.fill) }}
      />
    )
  }

  if (el.type === 'shape')
    return (
      <div style={{ ...style, ...shapeCss(el, theme) }}>
        {shapeInner(el, theme)}
        <ShapeText el={el} theme={theme} />
      </div>
    )

  if (el.type === 'image')
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // khung chờ ảnh ở bản xem là panel theme (nét đứt chỉ có ở bản chỉnh sửa)
          background: el.src ? undefined : `linear-gradient(135deg, ${theme.surface} 0 48%, ${theme.accent}22 48% 54%, ${theme.surface} 54% 100%)`,
          border: el.src ? undefined : `1px solid ${theme.accent}66`,
          borderRadius: photoFrameClip(el.shape) ? 0 : '1cqw',
          clipPath: photoFrameClip(el.shape),
          overflow: 'hidden',
          color: el.src ? theme.muted : theme.accent,
          fontSize: '1.9cqw',
          fontFamily: fontStack(theme.fonts.body),
          letterSpacing: '0.04em',
          fontWeight: el.src ? 400 : 600,
        }}
      >
        {el.src ? (
          <img
            src={el.src}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          photoFrameClip(el.shape) ? <img src={FRAME_PLACEHOLDER} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'Ảnh minh hoạ'
        )}
      </div>
    )

  if (el.type === 'table') {
    const headerFg = readableTextOn(theme.accent)
    const rowCount = el.rows?.length ?? 0
    return (
      <table
        style={{
          ...style,
          borderCollapse: 'separate',
          borderSpacing: 0,
          border: `1px solid ${theme.muted}`,
          borderRadius: '0.8cqw',
          overflow: 'hidden',
          fontSize: '1.7cqw',
          color: theme.fg,
        }}
      >
        <tbody>
          {(el.rows ?? []).map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td
                  key={ci}
                  style={{
                    borderBottom:
                      ri < rowCount - 1 ? `1px solid ${theme.muted}` : undefined,
                    borderRight: ci < r.length - 1 ? `1px solid ${theme.muted}` : undefined,
                    padding: '0.5em 0.7em',
                    background:
                      ri === 0 ? theme.accent : ri % 2 === 0 ? theme.surface : 'transparent',
                    color: ri === 0 ? headerFg : theme.fg,
                    fontWeight: ri === 0 ? 600 : 400,
                  }}
                >
                  {hasRich(c) ? <span dangerouslySetInnerHTML={{ __html: slideMathHtml(c) }} /> : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (el.type === 'chart')
    return <ChartView el={el} colors={theme.chart} />

  return null
}

/**
 * `absolute` = true: tự neo theo % của khung slide (dùng trong thumbnail).
 * false: lấp đầy khung bao ngoài đã neo sẵn (dùng trong canvas soạn) — nếu
 * vẫn neo tuyệt đối lần nữa, toạ độ bị nhân đôi và biểu đồ lệch khỏi thumbnail.
 */
export function ChartView({
  el,
  absolute = true,
  colors = ['#2563eb'],
}: {
  el: SlideElement
  absolute?: boolean
  /** bảng màu của theme; thiếu thì dùng xanh mặc định */
  colors?: string[]
}) {
  const palette = colors.length > 0 ? colors : ['#2563eb']
  const data = el.chart?.data ?? []
  const max = Math.max(1, ...data.map((d) => d.value))
  const type = el.chart?.type ?? 'bar'
  const pos: React.CSSProperties = absolute
    ? {
        position: 'absolute',
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.w}%`,
        height: `${el.h}%`,
      }
    : { width: '100%', height: '100%' }

  if (type === 'pie') {
    const total = data.reduce((s, d) => s + d.value, 0) || 1
    let acc = 0
    return (
      <div style={pos}>
        <svg viewBox="0 0 42 42" style={{ width: '100%', height: '100%' }}>
          {data.map((d, i) => {
            const start = (acc / total) * 360
            acc += d.value
            const end = (acc / total) * 360
            const r = 15.915
            const rad = (a: number) => ((a - 90) * Math.PI) / 180
            const x1 = 21 + r * Math.cos(rad(start))
            const y1 = 21 + r * Math.sin(rad(start))
            const x2 = 21 + r * Math.cos(rad(end))
            const y2 = 21 + r * Math.sin(rad(end))
            const large = end - start > 180 ? 1 : 0
            return (
              <path
                key={d.label}
                d={`M 21 21 L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
                fill={palette[i % palette.length]}
              />
            )
          })}
        </svg>
      </div>
    )
  }

  if (type === 'line') {
    const pts = data.map((d, i) => {
      const x = (i / Math.max(1, data.length - 1)) * 100
      const y = 100 - (d.value / max) * 90
      return `${x},${y}`
    })
    return (
      <div style={pos}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%' }}
        >
          <polyline
            points={pts.join(' ')}
            fill="none"
            stroke={palette[0]}
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
          {data.map((d, i) => {
            const x = (i / Math.max(1, data.length - 1)) * 100
            const y = 100 - (d.value / max) * 90
            return (
              <circle
                key={d.label}
                cx={x}
                cy={y}
                r="2.5"
                fill={palette[0]}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </svg>
      </div>
    )
  }

  return (
    <div
      style={{
        ...pos,
        display: 'flex',
        alignItems: 'flex-end',
        gap: '4%',
        padding: '0 2%',
      }}
    >
      {data.map((d, i) => (
        <div
          key={d.label}
          style={{
            flex: 1,
            height: `${(d.value / max) * 100}%`,
            background: palette[i % palette.length],
            borderRadius: '3px 3px 0 0',
          }}
        />
      ))}
    </div>
  )
}

/**
 * Ô chữ trong slide: tự co cỡ chữ xuống cho tới khi nội dung vừa khung,
 * nên nội dung dài (ví dụ AI sinh nhiều ý) không bị cắt.
 */
export function AutoFitText({
  value,
  baseSize,
  weight,
  fontFamily,
  fontStyle,
  textDecoration,
  align,
  color,
  background,
  lineHeight,
  letterSpacing,
  valign,
  focusOnMount,
  locked,
  onDone,
  onChange,
}: {
  value: string
  /** cỡ chữ tối đa, tính bằng cqw */
  baseSize: number
  /** canh giữa dọc — khớp bản xem (SlideElView) để chữ không nhảy lên đỉnh khi chọn */
  valign?: 'top' | 'middle'
  /** focus ô chữ ngay khi hiện (gõ chữ trong hình khối) */
  focusOnMount?: boolean
  /** chưa sửa chữ: textarea không nhận chuột để bấm một lần chỉ chọn/kéo hộp, nhấp đúp mới sửa */
  locked?: boolean
  /** rời ô chữ (mất focus) */
  onDone?: () => void
  weight: number
  fontFamily?: string
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline'
  align?: 'left' | 'center' | 'right'
  color?: string
  lineHeight?: number
  letterSpacing?: number
  /** nền hộp chữ (thẻ của layout cards) */
  background?: string
  onChange: (text: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const middle = valign === 'middle'
  const [size, setSize] = useState(baseSize)
  // Công thức hiển thị bằng KaTeX khi không gõ; nhấp đúp để sửa mã LaTeX.
  const [editing, setEditing] = useState(false)
  const showMath = hasRich(value) && !editing

  useEffect(() => {
    setSize(baseSize)
  }, [baseSize])

  // nhấp đúp mở khoá ô chữ: vào ô và đặt con trỏ cuối chữ (autoFocus chỉ chạy lúc gắn, ô này đã gắn sẵn)
  useEffect(() => {
    if (locked !== false) return
    const ta = ref.current
    if (!ta) return
    ta.focus()
    ta.setSelectionRange(ta.value.length, ta.value.length)
  }, [locked])

  useLayoutEffect(() => {
    const ta = ref.current
    if (!ta) return
    const box = boxRef.current
    const min = baseSize * 0.6
    // Canh giữa dọc: textarea cao đúng bằng nội dung, hộp bọc flex căn giữa nó —
    // textarea tự nó không có valign nên trước đây chữ luôn dính đỉnh khung.
    const need = () => {
      ta.style.height = '0px'
      return ta.scrollHeight
    }
    const fit = () => {
      // co dần cho tới khi vừa khung; không nhỏ hơn 60% cỡ gốc
      let s = baseSize
      const fits = (px: number) => {
        ta.style.fontSize = `${px}cqw`
        return middle && box ? need() <= box.clientHeight + 1 : ta.scrollHeight <= ta.clientHeight + 1
      }
      if (!fits(s)) while (s > min && !fits(s)) s -= 0.1
      // giữ 2 chữ số: compose-time đã fit tới 0,01cqw, làm tròn lên 0,1 sẽ
      // biến 2,45 thành 2,5 và gây tràn đúng ở biên
      const final = Math.floor(s * 100) / 100
      setSize(final)
      ta.style.fontSize = `${final}cqw`
      if (middle && box) ta.style.height = `${Math.min(need(), box.clientHeight)}px`
    }
    fit()
    // kéo tay nắm đổi chiều cao/chiều rộng hộp → fit lại ngay khi hộp đổi
    const ro = new ResizeObserver(fit)
    ro.observe(middle && box ? box : ta)
    const stopFonts = refitOnFonts(fit)
    return () => {
      stopFonts()
      ro.disconnect()
    }
  }, [value, baseSize, showMath, middle])

  if (showMath) {
    return (
      <div className="h-full w-full" onDoubleClick={() => setEditing(true)} data-tip="Nhấp đúp để sửa công thức">
        <FitText
          html={slideMathHtml(value)}
          baseSize={baseSize}
          style={{
            width: '100%',
            height: '100%',
            padding: background ? '1.5% 3%' : '1%',
            ...(middle ? { display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' } : {}),
            color: color ?? 'inherit',
            background,
            borderRadius: background ? '0.6cqw' : undefined,
            fontFamily: fontFamily ?? 'Be Vietnam Pro, sans-serif',
            fontWeight: weight,
            fontStyle,
            textDecoration,
            textAlign: align,
            lineHeight: lineHeight ?? 1.25,
            letterSpacing: letterSpacing ? `${letterSpacing}em` : undefined,
          }}
        >
          {value}
        </FitText>
      </div>
    )
  }

  const textarea = (
    <textarea
      ref={ref}
      autoFocus={editing || focusOnMount}
      onBlur={() => {
        setEditing(false)
        onDone?.()
      }}
      readOnly={locked}
      tabIndex={locked ? -1 : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn('w-full resize-none overflow-hidden bg-transparent p-[1%] outline-none', !middle && 'h-full')}
      style={{
        color: color ?? 'inherit',
        background: middle ? undefined : background,
        borderRadius: !middle && background ? '0.6cqw' : undefined,
        padding: background ? '1.5% 3%' : undefined,
        fontFamily: fontFamily ?? 'Be Vietnam Pro, sans-serif',
        fontSize: `${size}cqw`,
        fontWeight: weight,
        fontStyle,
        textDecoration,
        textAlign: align,
        lineHeight: lineHeight ?? 1.25,
        letterSpacing: letterSpacing ? `${letterSpacing}em` : undefined,
        pointerEvents: locked ? 'none' : undefined,
      }}
    />
  )
  return middle ? (
    <div
      ref={boxRef}
      className="flex h-full w-full flex-col justify-center"
      style={{ background, borderRadius: background ? '0.6cqw' : undefined }}
    >
      {textarea}
    </div>
  ) : (
    textarea
  )
}
