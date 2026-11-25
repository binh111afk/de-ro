/**
 * Trình soạn bài giảng trình chiếu (slide).
 *
 * Nằm trong tab slide của trình soạn chung (`/soan-de`) cùng hệ tab + AI panel;
 * mọi tài liệu được lưu về Home qua store khi đóng tab hoặc rời trang.
 *
 * Model dữ liệu (`Deck` / `Slide` / `SlideElement`) nằm ở `store/docs.ts`.
 */
import { dialog } from '@/components/Dialog'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ColorPalette } from './ColorPalette'
import { SelectionToolbar } from './SelectionToolbar'
import { SlideSidePanel } from './SlideSidePanel'
import { SlideStrip } from './SlideStrip'
import { ContextMenu, type MenuEntry, type MenuState } from './ContextMenu'
import { IconBringForward, IconBringToFront, IconCopy, IconCut, IconDesign, IconGridlines, IconPalette, IconPaste, IconPlus, IconSendBackward, IconSendToBack } from './icons'
import { TrashIcon } from '@/components/appIcons'
import { rewriteElement } from '@/lib/slideRewrite'
import { keepCustomBg, slideBgStyle, withBackground } from '@/lib/slideBackground'
import { AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignStartHorizontal, AlignStartVertical, ChevronLeft, ChevronRight, CopyPlus, Group, Layers, Lock, LockOpen, Minimize2, MonitorPlay, Ungroup } from 'lucide-react'
import { alignBoxes, type AlignMode } from '@/lib/slideAlign'
import { graphicMainColor } from '@/lib/slideGraphics'
import { hasRich } from '@/lib/slideMath'
import { renderMath } from '@/lib/math'
import { autoAnimate, clearAnimation, slideSteps, applyElementAnim, startOf } from '@/lib/slideAnim'
import { EmptyState } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Deck, DeckFooter, Slide, SlideElement, SlideTone } from '@/store/docs'
import { isStarterDeck } from '@/lib/slideStarter'
import { applyTextFormat, captureTextFormat, type TextFormatSample, normalizeSlideHref } from '@/lib/slideFormat'
import { parseAiDeck, type AiSlidePayload, type DeckPlan } from '@/lib/aiDeck'
import { HtmlDeckBar, HtmlSlideFrame } from './HtmlSlide'
import { applyDeckDesign, applyEdits, describeSlide, recomposeSlide, type SlideEditOp } from '@/lib/slideEdit'
import { elementHeight } from '@/lib/slideText'
import { ensureFonts, slideFontByName } from '@/lib/slideFonts'
import { normalizeTheme, themeById, withThemeFonts, type ResolvedTheme } from '@/lib/slideTheme'
import { readableElements } from '@/lib/slideContrast'
import { designById, designTheme, type SlideDesign } from '@/lib/slideDesigns'
import { applySkin } from '@/lib/slideSkins'
import { appendSlidesToDeck, checkSlide, withImage } from '@/lib/slideAi'
import { IMAGE_LAYOUTS, buildImagePrompt, generateSlideImage, loadProPhoto, queueImage } from '@/lib/imageGen'
import { uploadImage } from '@/lib/mediaStore'
import { SLIDE_LAYOUTS, composeLayout, contentFromSlide, defaultTone, isLayoutId, toneBackground, withPlaceholders, type SlideLayoutId } from '@/lib/slideLayouts'
import { AiPanel } from './AiPanel'
import { AiDock } from './Layout'
import { SlideRibbon, type SlideRibbonTab } from './SlideRibbon'
import { attachToAi } from '@/lib/aiAttach'
import { SlideThumb, SlideElView, SlideFooterView, SlideImageStatuses, elTransform } from './slideRender'
import { SlideImageContext } from './slideImageContext'
import { SlideImageJobs, type SlideImageSlot } from './slideImageStatus'
import { InkLayer, PresentToolbar, PresenterWindow, usePresentTools } from './PresentTools'
import { GroupToolbar, SnapGuides, EditableEl, setSnapEnabled } from './slideEditParts'

/** Trạng thái ẩn/hiện của hiệu ứng bấm-chuột: mờ dần + trượt/phóng nhẹ (translate/scale tách khỏi transform xoay của phần tử). */
const HIDDEN_POSE: Record<NonNullable<SlideElement['anim']>, React.CSSProperties> = {
  fade: {},
  rise: { translate: '0 2.4cqw' },
  drop: { translate: '0 -2.4cqw' },
  left: { translate: '-6cqw 0' },
  right: { translate: '6cqw 0' },
  zoom: { scale: '0.8' },
  spin: { rotate: '-90deg', scale: '0.6' },
}

/** cài đặt nhỏ theo trình duyệt (lưới, đường gióng); localStorage hỏng thì dùng mặc định */
function readPref(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key)
    return v == null ? fallback : v === '1'
  } catch {
    return fallback
  }
}
function writePref(key: string, value: boolean): boolean {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    /* bỏ qua */
  }
  return value
}

export const revealStyle = (shown: boolean, anim: SlideElement['anim'] = 'fade', ms = 450): React.CSSProperties => ({
  opacity: shown ? 1 : 0,
  ...(shown ? { translate: '0 0', scale: '1', rotate: '0deg' } : HIDDEN_POSE[anim] ?? {}),
  transition: `opacity ${ms}ms ease, translate ${ms}ms cubic-bezier(.2,.8,.2,1), scale ${ms}ms cubic-bezier(.2,.8,.2,1), rotate ${ms}ms cubic-bezier(.2,.8,.2,1)`,
})

/** Lớp phủ cả slide bọc một phần tử; zoom phóng quanh tâm phần tử chứ không quanh tâm slide. */
/** Chạy thử hiệu ứng ngay trên bản soạn (kiểu Canva): phủ bản sao phần tử lên đúng chỗ, ẩn bản thật, diễn một lần rồi tự tắt. */
function AnimPreview({ el, theme, onDone }: { el: SlideElement; theme: ResolvedTheme; onDone: () => void }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    // trình duyệt vẽ tư thế ẩn trước, rồi mới chuyển sang hiện để transition chạy
    const show = window.setTimeout(() => setShown(true), 40)
    const t = window.setTimeout(onDone, (el.animMs ?? 450) + 300)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(t)
    }
  }, [el, onDone])
  return (
    <>
      <style>{`[data-el-id="${CSS.escape(el.id)}"]{visibility:hidden}`}</style>
      <RevealLayer el={el} shown={shown}>
        <SlideElView el={el} theme={theme} />
      </RevealLayer>
    </>
  )
}

function RevealLayer({ el, shown, children }: { el: SlideElement; shown: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: el.zIndex,
        transformOrigin: `${el.x + el.w / 2}% ${el.y + el.h / 2}%`,
        ...revealStyle(shown, el.anim, el.animMs),
      }}
    >
      {children}
    </div>
  )
}

/**
 * Vẽ công thức trong slide. `\frac` → `\tfrac` (phân số cỡ chữ thường): phân số
 * cỡ display cao ~2,2em làm dòng chữ phình ra và bị `FitText` co nhỏ.
 */
export const slideMathHtml = (text: string): string =>
  renderMath(text.replace(/\\(d?)frac/g, '\\tfrac')).replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')

/** Ô bảng có công thức: hiện KaTeX khi không gõ, nhấp đúp để sửa mã. */
/** hàng màu trong bảng Định dạng: bấm ô màu để mở bảng ô vuông + mã màu ngay bên dưới */
function PaneColor({ label, value, themeColors, onPick }: { label: string; value: string; themeColors: string[]; onPick: (color: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-1.5">
      <div className="slide-format-pane__row" style={{ marginBottom: open ? 6 : 0 }}>
        <span>{label}</span>
        <button
          type="button"
          aria-label={label}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="h-6 w-[30px] rounded-[3px] border border-line-2"
          style={{ background: value }}
        />
      </div>
      {open && <ColorPalette value={value} themeColors={themeColors} onPick={onPick} />}
    </div>
  )
}

export function MathCell({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [editing, setEditing] = useState(false)
  if (hasRich(value) && !editing) {
    return (
      <span
        data-tip="Nhấp đúp để sửa công thức"
        onDoubleClick={() => setEditing(true)}
        dangerouslySetInnerHTML={{ __html: slideMathHtml(value) }}
      />
    )
  }
  return (
    <input
      autoFocus={editing}
      onBlur={() => setEditing(false)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent outline-none"
      style={{ color: 'inherit' }}
    />
  )
}

const uid = () => Math.random().toString(36).slice(2, 10)
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** biến màu cho hoạ tiết nền `.slide-frame[data-decor]` (slide.css) */
/**
 * Xuất PDF: dựng mọi slide thành các trang 16:9 trong lớp chỉ hiện khi in, rồi mở hộp thoại in của
 * trình duyệt (chọn "Lưu thành PDF"). Dùng đúng bộ vẽ của bản xem nên phông, công thức, màu giống hệt —
 * không phụ thuộc phông trong PowerPoint. CSS in nằm ở slide.css (`.slide-print-*`).
 */
function PrintDeck({ slides, theme, footer, onDone }: { slides: Slide[]; theme: ResolvedTheme; footer?: DeckFooter; onDone: () => void }) {
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    let alive = true
    const finish = () => done.current()
    window.addEventListener('afterprint', finish, { once: true })
    // đợi phông (Be Vietnam Pro, KaTeX) nạp xong rồi mới in, nếu không trang đầu in bằng phông tạm
    void ensureFonts({ theme, slides }).then(() => requestAnimationFrame(() => requestAnimationFrame(() => alive && window.print())))
    return () => {
      alive = false
      window.removeEventListener('afterprint', finish)
    }
  }, [])
  return createPortal(
    <div className="slide-print-root">
      {slides.map((slide, idx) => (
        <div key={slide.id} className="slide-print-page">
          {slide.html ? null : (
            <div className="slide-frame relative h-full w-full overflow-hidden" data-decor={theme.decor} style={{ ...slideBgStyle(slide), ...decorStyle(theme) }}>
              {readableElements(slide, theme).map((el) => (
                <SlideElView key={el.id} el={el} theme={theme} />
              ))}
              <SlideFooterView footer={footer} slide={slide} slideIndex={idx} theme={theme} />
            </div>
          )}
        </div>
      ))}
    </div>,
    document.body,
  )
}

export const decorStyle = (theme: ResolvedTheme): React.CSSProperties =>
  ({ '--slide-decor-ink': theme.fg, '--slide-decor-accent': theme.secondary }) as React.CSSProperties

export interface SlideEditorProps {
  deck: Deck
  /** cập nhật deck (đã gộp sẵn trong store) */
  updateDeck: (patch: Partial<Deck>) => void
  /** lưu deck */
  onSave?: () => void
  /** menu Tệp: tạo bài giảng mới trong tab khác */
  onNewDeck?: () => void
  /** menu Tệp: nhập .pptx/.docx/.xlsx thành tab bài giảng mới */
  onImportFile?: (file: File) => Promise<void>
}

export function SlideEditor({
  deck,
  updateDeck,
  onSave,
  onNewDeck,
  onImportFile,
}: SlideEditorProps) {
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  /** chọn nhiều (Shift+bấm, Ctrl+A): ≥2 id, khi đó selectedElementId = null */
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [ribbonTab, setRibbonTab] = useState<SlideRibbonTab>('home')
  const [presenting, setPresenting] = useState(false)
  const [presentIndex, setPresentIndex] = useState(0)
  /** số lần đã bấm trong slide đang chiếu (hiệu ứng bấm-chuột-rồi-hiện) */
  const [presentStep, setPresentStep] = useState(0)
  /** vùng chuột đang đứng khi chiếu: mép trái/phải hiện mũi tên, đáy hiện thanh điều khiển */
  const [presentHover, setPresentHover] = useState<'left' | 'right' | 'bar' | null>(null)
  const [printing, setPrinting] = useState(false)
  /** bút vẽ / laser / đồng hồ khi chiếu */
  const presentTools = usePresentTools(presenting)
  const [presenterOpen, setPresenterOpen] = useState(false)
  /** hình khối đang được gõ chữ trong đó */
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null)
  /** ảnh đang mở chế độ cắt */
  const [croppingId, setCroppingId] = useState<string | null>(null)
  const preCropDeckRef = useRef<Deck | null>(null)
  // màn hẹp (tablet/điện thoại): trợ lý AI nổi đè lên slide nên mặc định đóng
  const [aiOpen, setAiOpen] = useState(() => window.innerWidth >= 1024)
  const [zoom, setZoom] = useState(100)
  const designRequest = useRef(0)
  const [openDesignsSignal, setOpenDesignsSignal] = useState(0)
  const [openIconsSignal, setOpenIconsSignal] = useState(0)
  // lưới / đường gióng: nhớ theo trình duyệt
  const [gridOn, setGridOn] = useState(() => readPref('slide-grid', false))
  const [snapOn, setSnapOn] = useState(() => readPref('slide-snap', true))
  useEffect(() => setSnapEnabled(snapOn), [snapOn])
  const [formatPaneOpen, setFormatPaneOpen] = useState(false)
  /** phần tử đang chạy thử hiệu ứng (nonce để chọn lại cùng hiệu ứng vẫn chạy lại) */
  const [animPreview, setAnimPreview] = useState<{ id: string; nonce: number } | null>(null)
  const endAnimPreview = useCallback(() => setAnimPreview(null), [])
  /** phần tử đã sao chép (một mục hoặc cả nhóm) */
  const [clipboard, setClipboard] = useState<SlideElement[]>([])
  const [ctxMenu, setCtxMenu] = useState<MenuState>(null)
  const closeCtxMenu = useCallback(() => setCtxMenu(null), [])
  /** sao chép định dạng (cây cọ): once = áp 1 lần rồi tắt, lock = khoá áp nhiều lần */
  const [painter, setPainter] = useState<{ mode: 'once' | 'lock'; sample: TextFormatSample } | null>(null)
  /** ghi chú diễn giả đang mở (nút nhỏ ở góc slide) */
  const [notesOpen, setNotesOpen] = useState(false)
  /** AI đang sinh slide: cột thumbnail vẽ ô chờ skeleton (chặng 26b) */
  const [pendingSlides, setPendingSlides] = useState<{ done: number; total: number } | null>(null)
  const historyRef = useRef<{ past: Deck[]; future: Deck[] }>({ past: [], future: [] })
  /** deck mới nhất — ảnh AI tạo xong sau ~20s không được ghi đè sửa đổi trong lúc chờ */
  const deckRef = useRef(deck)
  const [, refreshImageStatus] = useState(0)
  const imageJobs = useMemo(() => new SlideImageJobs(() => refreshImageStatus(revision => revision + 1)), [deck.id])
  const activeImageJobs = useRef<SlideImageJobs | null>(null)
  /** vừa kéo/resize/xoay: bỏ qua cú click kế tiếp rơi ra ngoài phần tử */
  const didDragRef = useRef(false)
  /** kéo trên nền slide để quét chọn nhiều phần tử (giống Canva) — toạ độ % của slide */
  const [marquee, setMarquee] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
  const swipeRef = useRef<{ x: number; y: number; didSwipe: boolean } | null>(null)

  const slides = deck.slides
  /** số ô skeleton còn chờ trong cột thumbnail (trang bị bỏ cũng tính là xong) */
  const pendingCount = pendingSlides
    ? Math.max(0, pendingSlides.total - pendingSlides.done)
    : 0
  /** theme đã điền đủ token — deck cũ chỉ có bg/fg/accent vẫn dựng đúng */
  const theme = useMemo(() => normalizeTheme(deck.theme), [deck.theme])

  useLayoutEffect(() => {
    activeImageJobs.current = imageJobs
    return () => {
      activeImageJobs.current = null
      imageJobs.clear()
    }
  }, [imageJobs])

  useLayoutEffect(() => {
    deckRef.current = deck
    imageJobs.removeMissingSlides(new Set(deck.slides.map(slide => slide.id)))
  }, [deck, imageJobs])

  const currentSlide = useMemo(
    () => slides.find((s) => s.id === selectedSlideId) ?? slides[0] ?? null,
    [slides, selectedSlideId],
  )
  const [, refreshFontMetrics] = useState(0)
  useEffect(() => {
    if (!currentSlide || currentSlide.html) return
    let alive = true
    void ensureFonts({ theme, slides: [currentSlide] }).then(() => {
      if (alive) refreshFontMetrics(revision => revision + 1)
    })
    return () => { alive = false }
  }, [currentSlide, theme])
  const heightOf = (el: SlideElement) => elementHeight(el, el.variant === 'body' ? theme.fonts.body : theme.fonts.heading)
  const selectedElement = currentSlide?.elements.find((el) => el.id === selectedElementId) ?? null
  const groupEls = currentSlide?.elements.filter((el) => groupIds.includes(el.id)) ?? []
  /** đang chọn đúng một nhóm cố định (đã bấm Nhóm): vẽ một khung bao chung như Canva */
  const fixedGroup = groupEls.length >= 2 && !!groupEls[0].groupId && groupEls.every((el) => el.groupId === groupEls[0].groupId)

  useEffect(() => {
    if (selectedElementId) setGroupIds([])
  }, [selectedElementId])
  useEffect(() => setGroupIds([]), [currentSlide?.id])

  const toggleInGroup = (id: string) => {
    const base = groupIds.length ? groupIds : selectedElementId ? [selectedElementId] : []
    const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id]
    if (next.length >= 2) {
      setGroupIds(next)
      setSelectedElementId(null)
    } else {
      setGroupIds([])
      setSelectedElementId(next[0] ?? null)
    }
  }

  /** thành viên nhóm cố định chứa phần tử (≥2 mục), không có nhóm thì [] */
  const groupMembers = (el: SlideElement) =>
    el.groupId ? (currentSlide?.elements.filter((e) => e.groupId === el.groupId) ?? []) : []
  /** bấm phần tử: thuộc nhóm thì chọn cả nhóm; muốn chọn riêng một mục trong nhóm thì bấm đúp */
  const selectEl = (el: SlideElement) => {
    const members = groupMembers(el)
    const groupSelected = members.length >= 2 && members.every((m) => groupIds.includes(m.id)) && groupIds.length === members.length
    // nhóm đang được chọn: bấm một lần vẫn giữ cả nhóm (bấm đúp mới vào từng mục), kẻo kéo lộn một mục ra
    if (groupSelected) return
    if (members.length >= 2 && selectedElementId !== el.id) {
      setGroupIds(members.map((m) => m.id))
      setSelectedElementId(null)
    } else setSelectedElementId(el.id)
  }

  const commitDeck = useCallback((next: Deck) => {
    historyRef.current.past = [...historyRef.current.past, deck].slice(-50)
    historyRef.current.future = []
    updateDeck(next)
  }, [deck, updateDeck])

  const undo = useCallback(() => {
    const previous = historyRef.current.past.pop()
    if (!previous) return
    historyRef.current.future.unshift(deck)
    updateDeck(previous)
  }, [deck, updateDeck])

  const redo = useCallback(() => {
    const next = historyRef.current.future.shift()
    if (!next) return
    historyRef.current.past.push(deck)
    updateDeck(next)
  }, [deck, updateDeck])

  /* ---------------------------------------------------------------- *
   * Slide helpers
   * ---------------------------------------------------------------- */
  const patchSlide = useCallback(
    (id: string, patch: Partial<Slide>) => {
      commitDeck({
        ...deck,
        slides: deck.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      })
    },
    [commitDeck, deck],
  )

  const addElement = (el: SlideElement) => {
    if (!currentSlide) return
    patchSlide(currentSlide.id, { elements: [...currentSlide.elements, el] })
  }

  /** thêm slide trống vào vị trí `index` (0..n) */
  const addSlideAt = (index: number) => {
    const s: Slide = {
      id: uid(),
      background: deck.theme.bg,
      elements: [],
      transition: 'none',
    }
    const next = [...deck.slides]
    next.splice(index, 0, s)
    commitDeck({ ...deck, slides: next })
    setSelectedSlideId(s.id)
    setSelectedElementId(null)
  }

  const addSlide = () => addSlideAt(deck.slides.length)

  /** thêm một slide mới theo bố cục có sẵn (tab Mẫu) — slide đang mở không đổi */
  const addLayoutSlide = async (layoutId: SlideLayoutId) => {
    const id = deckRef.current.id
    await ensureFonts({ theme, slides: [] })
    const deck = deckRef.current
    if (deck.id !== id) return
    const tone = defaultTone(layoutId)
    // slide thêm tay vẫn theo bộ trang trí của deck
    const decorKit = deck.slides.find((slide) => slide.decorKit)?.decorKit
    const elements = composeLayout(deck.theme, layoutId, { ...withPlaceholders(layoutId, {}), decorKit }, tone)
    let s: Slide = {
      id: uid(),
      layout: layoutId,
      tone,
      ...(decorKit ? { decorKit } : {}),
      background: toneBackground(deck.theme, tone),
      elements,
      transition: 'none',
    }
    if (deck.design) {
      s = applySkin(s, deck.design, deck.theme, deck.slides.length, deck.slides.length + 1, true)
    }
    commitDeck({ ...deck, slides: [...deck.slides, s] })
    setSelectedSlideId(s.id)
    setSelectedElementId(null)
  }

  const duplicateSlide = (id: string) => {
    const idx = deck.slides.findIndex((s) => s.id === id)
    if (idx < 0) return
    const copy: Slide = {
      ...deck.slides[idx],
      id: uid(),
      elements: deck.slides[idx].elements.map((e) => ({ ...e, id: uid() })),
    }
    const next = [...deck.slides]
    next.splice(idx + 1, 0, copy)
    commitDeck({ ...deck, slides: next })
    setSelectedSlideId(copy.id)
    setSelectedElementId(null)
  }

  /** Kéo thumbnail: chèn slide `from` vào khe `insertAt` (0..n), như PowerPoint. */
  const moveSlide = (from: number, insertAt: number) => {
    const target = insertAt > from ? insertAt - 1 : insertAt
    if (target === from) return
    const next = [...deck.slides]
    const [moved] = next.splice(from, 1)
    next.splice(target, 0, moved)
    commitDeck({ ...deck, slides: next })
  }

  const removeSlide = (id: string) => {
    const next = deck.slides.filter((s) => s.id !== id)
    imageJobs.removeMissingSlides(new Set(next.map(slide => slide.id)))
    commitDeck({ ...deck, slides: next })
    if (selectedSlideId === id) {
      setSelectedSlideId(next[0]?.id ?? null)
      setSelectedElementId(null)
    }
  }

  const updateElement = (slideId: string, elId: string, patch: Partial<SlideElement>) => {
    commitDeck({
      ...deck,
      slides: deck.slides.map((s) =>
        s.id === slideId
          ? { ...s, elements: s.elements.map((e) => (e.id === elId ? { ...e, ...patch } : e)) }
          : s,
      ),
    })
  }

  const removeElement = (slideId: string, elId: string) => {
    commitDeck({
      ...deck,
      slides: deck.slides.map((s) =>
        s.id === slideId ? { ...s, elements: s.elements.filter((e) => e.id !== elId) } : s,
      ),
    })
    setSelectedElementId(null)
  }

  /** Ghi ảnh AI xong vào đúng phần tử, dựa trên deck mới nhất lúc hoàn tất. */
  const setElementImage = (slideId: string, elId: string, src: string) => {
    const latest = deckRef.current
    historyRef.current.past = [...historyRef.current.past, latest].slice(-50)
    historyRef.current.future = []
    updateDeck({
      slides: latest.slides.map((slide) =>
        slide.id === slideId
          ? {
              ...slide,
              elements: slide.elements.map((el) => (el.id === elId ? { ...el, src } : el)),
            }
          : slide,
      ),
    })
  }

  /** Prompt lấy từ tiêu đề + ý chính của slide đang chứa ảnh. */
  const generateImageFor = async (slideId: string, elId: string) => {
    const slide = slides.find((s) => s.id === slideId)
    if (!slide) return
    const content = contentFromSlide(slide)
    const image = await generateSlideImage(buildImagePrompt(content.title, content.bullets))
    setElementImage(slideId, elId, await uploadImage(image.dataUrl))
  }

  /** Áp dụng bộ thiết kế lên toàn bộ slide hiện có (chỉ restyle, không thêm/bớt slide). */
  const applyDesignToDeck = async (design: SlideDesign | null) => {
    const request = ++designRequest.current
    const id = deckRef.current.id
    await ensureFonts({ theme: design ? designTheme(design) : themeById('sang'), slides: [] })
    const latest = deckRef.current
    if (request !== designRequest.current || latest.id !== id || latest.format === 'html') return
    commitDeck(applyDeckDesign(latest, design))
  }


  // Panel thư viện được memo để kéo phần tử (cập nhật deck mỗi lần di chuột) không vẽ lại hàng trăm đồ hoạ;
  // handler đi qua ref để callback ổn định mà vẫn luôn gọi bản mới nhất (không giữ deck cũ).
  const panelHandlers = useRef({
    insert: (_el: SlideElement) => {},
    addLayout: (_id: SlideLayoutId) => {},
    applyDesign: (_design: SlideDesign | null) => {},
  })
  panelHandlers.current = {
    insert: (el) => { addElement(el); setSelectedElementId(el.id) },
    addLayout: addLayoutSlide,
    applyDesign: applyDesignToDeck,
  }
  const insertFromPanel = useCallback((el: SlideElement) => panelHandlers.current.insert(el), [])
  const addLayoutFromPanel = useCallback((id: SlideLayoutId) => panelHandlers.current.addLayout(id), [])
  const applyDesignFromPanel = useCallback((design: SlideDesign | null) => panelHandlers.current.applyDesign(design), [])

  const previewElement = useCallback(
    (slideId: string, elId: string, patch: Partial<SlideElement>) => {
      updateDeck({
        ...deck,
        slides: deck.slides.map((s) =>
          s.id === slideId
            ? { ...s, elements: s.elements.map((e) => (e.id === elId ? { ...e, ...patch } : e)) }
            : s,
        ),
      })
    },
    [deck, updateDeck],
  )

  const previewMany = useCallback(
    (slideId: string, patches: Record<string, Partial<SlideElement>>) => {
      updateDeck({
        ...deck,
        slides: deck.slides.map((s) =>
          s.id === slideId ? { ...s, elements: s.elements.map((e) => (patches[e.id] ? { ...e, ...patches[e.id] } : e)) } : s,
        ),
      })
    },
    [deck, updateDeck],
  )

  const alignGroup = (mode: AlignMode) => {
    if (!currentSlide) return
    const patches = alignBoxes(groupEls.map((e) => ({ id: e.id, x: e.x, y: e.y, w: e.w, h: heightOf(e) })), mode)
    commitDeck({
      ...deck,
      slides: deck.slides.map((s) =>
        s.id === currentSlide.id ? { ...s, elements: s.elements.map((e) => (patches[e.id] ? { ...e, ...patches[e.id] } : e)) } : s,
      ),
    })
  }

  const removeGroup = () => {
    if (!currentSlide) return
    commitDeck({
      ...deck,
      // mục đã khoá được giữ lại
      slides: deck.slides.map((s) => (s.id === currentSlide.id ? { ...s, elements: s.elements.filter((e) => e.locked || !groupIds.includes(e.id)) } : s)),
    })
    setGroupIds([])
  }

  /** Nhóm (Ctrl+G) / rã nhóm (Ctrl+Shift+G) các mục đang chọn. */
  const setGroupOf = (ids: string[], groupId: string | undefined) => {
    if (!currentSlide || !ids.length) return
    commitDeck({
      ...deck,
      slides: deck.slides.map((s) =>
        s.id === currentSlide.id ? { ...s, elements: s.elements.map((e) => (ids.includes(e.id) ? { ...e, groupId } : e)) } : s,
      ),
    })
  }
  const groupSelected = () => groupIds.length >= 2 && setGroupOf(groupIds, uid())
  const ungroupSelected = () => {
    const ids = groupIds.length ? groupIds : selectedElement ? groupMembers(selectedElement).map((m) => m.id) : []
    setGroupOf(ids, undefined)
  }

  /** Chụp trạng thái trước khi bắt đầu một thao tác kéo/đổi text để undo gộp cả thao tác. */
  const beginHistory = useCallback(() => {
    historyRef.current.past = [...historyRef.current.past, deck].slice(-50)
    historyRef.current.future = []
  }, [deck])

  useEffect(() => {
    if (!selectedElement) {
      if (['elementFormat', 'pictureFormat', 'tableDesign', 'chartDesign'].includes(ribbonTab)) {
        setRibbonTab('home')
      }
      return
    }
    const auto: Partial<Record<SlideElement['type'], SlideRibbonTab>> = {
      image: 'pictureFormat',
      shape: 'elementFormat',
      icon: 'elementFormat',
      graphic: 'elementFormat',
      connector: 'elementFormat',
      table: 'tableDesign',
      chart: 'chartDesign',
    }
    const next = auto[selectedElement.type]
    // đang ở Hoạt ảnh thì giữ nguyên tab để chọn lần lượt từng đối tượng gắn hiệu ứng
    if (next && ribbonTab !== 'animations') setRibbonTab(next)
  }, [selectedElement?.id])

  const confirmCrop = useCallback(() => {
    if (!croppingId) return
    const before = preCropDeckRef.current
    preCropDeckRef.current = null
    setCroppingId(null)
    if (before && before !== deckRef.current) {
      historyRef.current.past = [...historyRef.current.past, before].slice(-50)
      historyRef.current.future = []
    }
  }, [croppingId])

  const cancelCrop = useCallback(() => {
    if (!croppingId) return
    const before = preCropDeckRef.current
    preCropDeckRef.current = null
    setCroppingId(null)
    if (before && before !== deckRef.current) updateDeck(before)
  }, [croppingId, updateDeck])

  const toggleCrop = useCallback(() => {
    if (croppingId) {
      confirmCrop()
      return
    }
    if (!selectedElement || selectedElement.type !== 'image' || !selectedElement.src || selectedElement.locked) return
    if (((selectedElement.rotation ?? 0) % 360) !== 0) return
    preCropDeckRef.current = deckRef.current
    setCroppingId(selectedElement.id)
  }, [croppingId, confirmCrop, selectedElement])

  const resetCrop = useCallback(() => {
    const slide = currentSlide
    const el = selectedElement
    if (!slide || !el || el.type !== 'image' || el.locked || !el.crop || !el.src) return
    const baseDeck = (croppingId === el.id ? preCropDeckRef.current : null) ?? deckRef.current
    preCropDeckRef.current = null
    setCroppingId(null)
    const c = el.crop
    const visW = Math.max(10, 100 - c.l - c.r)
    const visH = Math.max(10, 100 - c.t - c.b)
    const fullW = (el.w * 100) / visW
    const fullH = (el.h * 100) / visH
    const visL = el.flipX ? c.r : c.l
    const visT = el.flipY ? c.b : c.t
    const fullX = el.x - (visL / 100) * fullW
    const fullY = el.y - (visT / 100) * fullH

    const applyReset = (targetW: number, targetH: number) => {
      const latest = deckRef.current
      historyRef.current.past = [...historyRef.current.past, baseDeck].slice(-50)
      historyRef.current.future = []
      updateDeck({
        ...latest,
        slides: latest.slides.map((s) =>
          s.id === slide.id
            ? {
                ...s,
                elements: s.elements.map((item) =>
                  item.id === el.id ? { ...item, x: fullX, y: fullY, w: targetW, h: targetH, crop: undefined } : item,
                ),
              }
            : s,
        ),
      })
    }

    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        const natH = (fullW * img.naturalHeight * 16) / (img.naturalWidth * 9)
        applyReset(fullW, clamp(natH, 4, 95))
      } else applyReset(fullW, fullH)
    }
    img.onerror = () => applyReset(fullW, fullH)
    img.src = el.src
  }, [currentSlide, selectedElement, croppingId, updateDeck])

  // Thoát chế độ cắt khi đổi phần tử chọn, khoá hoặc xoay ảnh
  useEffect(() => {
    if (!croppingId) return
    if (selectedElementId !== croppingId || !selectedElement || selectedElement.locked || ((selectedElement.rotation ?? 0) % 360) !== 0) {
      setCroppingId(null)
      preCropDeckRef.current = null
    }
  }, [croppingId, selectedElementId, selectedElement])

  // Bấm ra ngoài khung ảnh đang cắt → xác nhận vùng cắt
  useEffect(() => {
    if (!croppingId) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null
      if (!t) return
      if (t.closest(`[data-el-id="${croppingId}"]`) || t.closest('.slide-ribbon') || t.closest('.slide-ribbon-menu')) return
      confirmCrop()
    }
    window.addEventListener('pointerdown', onDown, true)
    return () => window.removeEventListener('pointerdown', onDown, true)
  }, [croppingId, confirmCrop])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing = target?.closest?.('input, textarea, select, [contenteditable="true"]')
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (mod && e.key.toLowerCase() === 'd' && groupIds.length >= 2 && !typing) {
        e.preventDefault()
        duplicateIds(groupIds)
        return
      }
      if (mod && e.key.toLowerCase() === 'd' && selectedElement && currentSlide && !typing) {
        e.preventDefault()
        addElement({ ...selectedElement, id: uid(), groupId: undefined, locked: undefined, x: selectedElement.x + 3, y: selectedElement.y + 3 })
        return
      }
      if (mod && e.key.toLowerCase() === 'a' && currentSlide && !currentSlide.html && !typing) {
        e.preventDefault()
        const ids = currentSlide.elements.map((el) => el.id)
        if (ids.length >= 2) {
          setGroupIds(ids)
          setSelectedElementId(null)
        } else setSelectedElementId(ids[0] ?? null)
        return
      }
      if (mod && e.key.toLowerCase() === 'g' && currentSlide && !typing) {
        e.preventDefault()
        if (e.shiftKey) ungroupSelected()
        else groupSelected()
        return
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'l' && selectedElement && currentSlide && !typing) {
        e.preventDefault()
        updateElement(currentSlide.id, selectedElement.id, { locked: selectedElement.locked ? undefined : true })
        return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && groupIds.length && !typing) {
        e.preventDefault()
        removeGroup()
        return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement && currentSlide && !typing) {
        if (selectedElement.locked) return
        e.preventDefault()
        removeElement(currentSlide.id, selectedElement.id)
        return
      }
      if (e.key === 'Enter' && croppingId && !typing) {
        e.preventDefault()
        confirmCrop()
        return
      }
      if (e.key === 'Escape') {
        if (croppingId) {
          cancelCrop()
          return
        }
        setPainter(null)
        setSelectedElementId(null)
        setGroupIds([])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedElement, currentSlide, undo, redo, groupIds, croppingId, confirmCrop, cancelCrop])

  /**
   * Áp kết quả AI vào deck.
   *
   * AI trả về JSON dạng:
   *   { "slides": [ { "title": "...", "elements": [ { "type": "text", "text": "..." } ] } ] }
   * Nếu không parse được thì coi như một slide text đơn giản — không làm hỏng deck.
   */
  const arrangeSelected = (action: 'front' | 'back' | 'forward' | 'backward', elId = selectedElementId) => {
    if (!currentSlide || !elId) return
    const index = currentSlide.elements.findIndex((el) => el.id === elId)
    if (index < 0) return
    const next = [...currentSlide.elements]
    const target = action === 'front' ? next.length - 1 : action === 'back' ? 0 : action === 'forward' ? Math.min(next.length - 1, index + 1) : Math.max(0, index - 1)
    const [element] = next.splice(index, 1)
    next.splice(target, 0, element)
    patchSlide(currentSlide.id, { elements: next })
  }

  /** Menu chuột phải trên slide, giống PowerPoint: trên phần tử thì lệnh phần tử, trên nền thì lệnh slide. */
  const MOD = /Mac/i.test(navigator.platform) ? '⌘' : 'Ctrl+'
  const slideItems = (slideId: string, index: number): MenuEntry[] => [
    { label: 'Slide mới', icon: <IconPlus size={16} />, onClick: () => addSlideAt(index + 1), disabled: deck.format === 'html' },
    { label: 'Nhân bản slide', icon: <IconCopy size={16} />, onClick: () => duplicateSlide(slideId), disabled: deck.format === 'html' },
    { label: 'Xoá slide', icon: <TrashIcon size={16} strokeWidth={1.8} />, onClick: () => removeSlide(slideId) },
  ]
  const selectIds = (ids: string[]) => {
    if (ids.length >= 2) {
      setSelectedElementId(null)
      setGroupIds(ids)
    } else {
      setGroupIds([])
      setSelectedElementId(ids[0] ?? null)
    }
  }
  /** bản sao của các mục: id mới, nhóm mới nếu chép cả nhóm, lệch 3% để thấy bản sao */
  const cloneEls = (src: SlideElement[]) => {
    const gid = new Map<string, string>()
    const newGid = (g: string) => gid.get(g) ?? gid.set(g, uid()).get(g)
    return src.map((el) => ({
      ...el,
      id: uid(),
      locked: undefined,
      // chép một mục lẻ trong nhóm thì bản sao đứng riêng
      groupId: src.length > 1 && el.groupId ? newGid(el.groupId) : undefined,
      x: el.x + 3,
      y: el.y + 3,
    }))
  }
  const addCopies = (src: SlideElement[]) => {
    if (!currentSlide || !src.length) return
    const copies = cloneEls(src)
    patchSlide(currentSlide.id, { elements: [...currentSlide.elements, ...copies] })
    selectIds(copies.map((c) => c.id))
  }
  const pasteClipboard = () => addCopies(clipboard)
  const duplicateIds = (ids: string[]) => addCopies(currentSlide?.elements.filter((el) => ids.includes(el.id)) ?? [])
  /** Sửa nhiều phần tử trên slide hiện tại trong một bước hoàn tác. */
  const patchEls = (ids: string[], fn: (el: SlideElement) => SlideElement) => {
    if (!currentSlide) return
    patchSlide(currentSlide.id, { elements: currentSlide.elements.map((el) => (ids.includes(el.id) ? fn(el) : el)) })
  }
  /** Xếp lớp cả một tập phần tử, giữ thứ tự giữa chúng. */
  const arrangeIds = (ids: string[], action: 'front' | 'back' | 'forward' | 'backward') => {
    if (!currentSlide || !ids.length) return
    const els = [...currentSlide.elements]
    const isIn = (el: SlideElement) => ids.includes(el.id)
    let next: SlideElement[]
    if (action === 'front') next = [...els.filter((e) => !isIn(e)), ...els.filter(isIn)]
    else if (action === 'back') next = [...els.filter(isIn), ...els.filter((e) => !isIn(e))]
    else {
      next = els
      // đổi chỗ từng mục với hàng xóm ngoài tập, duyệt từ phía đang tiến tới để các mục không giẫm lên nhau
      const order = action === 'forward' ? [...next.keys()].reverse() : [...next.keys()]
      for (const i of order) {
        const j = action === 'forward' ? i + 1 : i - 1
        if (isIn(next[i]) && j >= 0 && j < next.length && !isIn(next[j])) [next[i], next[j]] = [next[j], next[i]]
      }
    }
    patchSlide(currentSlide.id, { elements: next })
  }
  /** Căn cả khối (một mục hoặc nhóm) theo trang: dời mọi mục cùng một khoảng. */
  const alignIdsToPage = (ids: string[], mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const els = currentSlide?.elements.filter((el) => ids.includes(el.id) && !el.locked) ?? []
    if (!els.length) return
    const l = Math.min(...els.map((e) => e.x))
    const r = Math.max(...els.map((e) => e.x + e.w))
    const t = Math.min(...els.map((e) => e.y))
    const b = Math.max(...els.map((e) => e.y + heightOf(e)))
    const dx = mode === 'left' ? -l : mode === 'center' ? (100 - (r - l)) / 2 - l : mode === 'right' ? 100 - r : 0
    const dy = mode === 'top' ? -t : mode === 'middle' ? (100 - (b - t)) / 2 - t : mode === 'bottom' ? 100 - b : 0
    patchEls(els.map((e) => e.id), (e) => ({ ...e, x: e.x + dx, y: e.y + dy }))
  }
  const toggleLockIds = (ids: string[]) => {
    const els = currentSlide?.elements.filter((el) => ids.includes(el.id)) ?? []
    const lock = !els.every((el) => el.locked)
    patchEls(ids, (el) => ({ ...el, locked: lock ? true : undefined }))
  }
  const removeIds = (ids: string[]) => {
    if (!currentSlide) return
    patchSlide(currentSlide.id, { elements: currentSlide.elements.filter((el) => el.locked || !ids.includes(el.id)) })
    setGroupIds([])
    setSelectedElementId(null)
  }

  /** Mục menu cho một mục hoặc một nhóm (chuột phải và nút ⋯ trên thanh công cụ), bố cục như PowerPoint/Canva. */
  const elementItems = (ids: string[]): MenuEntry[] => {
    const els = currentSlide?.elements.filter((el) => ids.includes(el.id)) ?? []
    if (!els.length) return []
    const many = els.length >= 2
    const locked = els.every((el) => el.locked)
    const fixed = many && !!els[0].groupId && els.every((el) => el.groupId === els[0].groupId)
    const single = many ? null : els[0]
    const lu = { size: 16, strokeWidth: 1.5 }
    return [
      { label: 'Cắt', icon: <IconCut size={16} />, disabled: locked, onClick: () => { setClipboard(els); removeIds(ids) } },
      { label: 'Sao chép', icon: <IconCopy size={16} />, onClick: () => setClipboard(els) },
      { label: 'Dán', icon: <IconPaste size={16} />, disabled: !clipboard.length, onClick: pasteClipboard },
      { label: 'Nhân bản', icon: <CopyPlus {...lu} />, hint: `${MOD}D`, onClick: () => duplicateIds(ids) },
      { label: 'Xoá', icon: <TrashIcon size={16} strokeWidth={1.8} />, hint: 'Delete', disabled: locked, onClick: () => removeIds(ids) },
      'sep',
      {
        label: 'Lớp',
        icon: <Layers {...lu} />,
        children: [
          { label: 'Đưa lên trên cùng', icon: <IconBringToFront size={16} />, onClick: () => arrangeIds(ids, 'front') },
          { label: 'Đưa lên một lớp', icon: <IconBringForward size={16} />, onClick: () => arrangeIds(ids, 'forward') },
          { label: 'Đưa xuống một lớp', icon: <IconSendBackward size={16} />, onClick: () => arrangeIds(ids, 'backward') },
          { label: 'Đưa xuống dưới cùng', icon: <IconSendToBack size={16} />, onClick: () => arrangeIds(ids, 'back') },
        ],
      },
      {
        label: 'Căn chỉnh theo trang',
        icon: <AlignStartVertical {...lu} />,
        disabled: locked,
        children: [
          { label: 'Căn trái', icon: <AlignStartVertical {...lu} />, onClick: () => alignIdsToPage(ids, 'left') },
          { label: 'Căn giữa ngang', icon: <AlignCenterVertical {...lu} />, onClick: () => alignIdsToPage(ids, 'center') },
          { label: 'Căn phải', icon: <AlignEndVertical {...lu} />, onClick: () => alignIdsToPage(ids, 'right') },
          'sep',
          { label: 'Căn trên', icon: <AlignStartHorizontal {...lu} />, onClick: () => alignIdsToPage(ids, 'top') },
          { label: 'Căn giữa dọc', icon: <AlignCenterHorizontal {...lu} />, onClick: () => alignIdsToPage(ids, 'middle') },
          { label: 'Căn dưới', icon: <AlignEndHorizontal {...lu} />, onClick: () => alignIdsToPage(ids, 'bottom') },
        ],
      },
      'sep',
      ...(many && !fixed ? [{ label: 'Nhóm', icon: <Group {...lu} />, hint: `${MOD}G`, onClick: groupSelected } as MenuEntry] : []),
      ...(fixed ? [{ label: 'Bỏ nhóm', icon: <Ungroup {...lu} />, hint: `${MOD}⇧G`, onClick: ungroupSelected } as MenuEntry] : []),
      { label: locked ? 'Mở khoá' : 'Khoá', icon: locked ? <Lock size={16} strokeWidth={1.8} /> : <LockOpen size={16} strokeWidth={1.8} />, hint: `${MOD}⇧L`, onClick: () => toggleLockIds(ids) },
      ...(single ? [{ label: 'Định dạng…', icon: <IconPalette size={16} />, onClick: () => setFormatPaneOpen(true) } as MenuEntry] : []),
    ]
  }

  const openSlideMenu = (e: React.MouseEvent) => {
    if (!currentSlide || currentSlide.html) return
    const target = e.target as HTMLElement
    // đang gõ chữ trong hộp: để menu của trình duyệt (cắt/dán chữ, kiểm tra chính tả)
    if (target.closest('[contenteditable="true"], input, textarea')) return
    e.preventDefault()
    const slide = currentSlide
    const el = slide.elements.find((x) => x.id === target.closest<HTMLElement>('[data-el-id]')?.dataset.elId)
    let items: MenuEntry[]
    if (el) {
      // chuột phải lên một mục của nhóm → lệnh cho cả nhóm (trừ khi đang chọn riêng mục đó bằng bấm đúp)
      const members = groupMembers(el)
      const ids =
        groupIds.length >= 2 && groupIds.includes(el.id)
          ? groupIds
          : members.length >= 2 && selectedElementId !== el.id
            ? members.map((m) => m.id)
            : [el.id]
      selectIds(ids)
      items = elementItems(ids)
    } else {
      setSelectedElementId(null)
      setGroupIds([])
      const index = deck.slides.findIndex((x) => x.id === slide.id)
      items = [
        { label: 'Dán', icon: <IconPaste size={16} />, disabled: !clipboard.length, onClick: pasteClipboard },
        'sep',
        ...slideItems(slide.id, index),
        'sep',
        { label: 'Mẫu thiết kế…', icon: <IconDesign size={16} />, onClick: () => setOpenDesignsSignal((n) => n + 1) },
        { label: gridOn ? 'Ẩn lưới' : 'Hiện lưới', icon: <IconGridlines size={16} />, onClick: () => setGridOn((v) => writePref('slide-grid', !v)) },
      ]
    }
    setCtxMenu({ x: e.clientX, y: e.clientY, items })
  }

  const alignSelected = (action: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!currentSlide || !selectedElement) return
    const h = heightOf(selectedElement)
    const patch = action === 'left' ? { x: 0 } : action === 'center' ? { x: (100 - selectedElement.w) / 2 } : action === 'right' ? { x: 100 - selectedElement.w } : action === 'top' ? { y: 0 } : action === 'middle' ? { y: (100 - h) / 2 } : { y: 100 - h }
    updateElement(currentSlide.id, selectedElement.id, patch)
  }

  const flipSelected = (axis: 'x' | 'y') => {
    if (!currentSlide || !selectedElement) return
    updateElement(currentSlide.id, selectedElement.id, axis === 'x' ? { flipX: !selectedElement.flipX } : { flipY: !selectedElement.flipY })
  }

  /** Đổi tông cho slide đã có layout; dựng lại phần tử theo tông mới. */
  const applyTone = (tone: SlideTone) => {
    if (!currentSlide?.layout || !isLayoutId(currentSlide.layout)) return
    const elements = composeLayout(
      deck.theme,
      currentSlide.layout,
      contentFromSlide(currentSlide),
      tone,
    )
    if (elements.length === 0) return
    // chọn tông = muốn nền theo bộ màu, nên bỏ nền riêng
    patchSlide(currentSlide.id, {
      tone,
      customBg: undefined,
      bgImage: undefined,
      background: toneBackground(deck.theme, tone),
      elements,
    })
  }

  const onUpdateSelected = (patch: Partial<SlideElement>) => {
    if (currentSlide && selectedElement) updateElement(currentSlide.id, selectedElement.id, patch)
  }

  /** Áp layout cho slide đang chọn; hỏi trước vì thay toàn bộ phần tử. */
  const applyLayout = async (layoutId: SlideLayoutId) => {
    if (!currentSlide) return
    const name = SLIDE_LAYOUTS.find((layout) => layout.id === layoutId)?.name ?? layoutId
    if (!(await dialog.confirm('Nội dung hiện tại của slide sẽ được thay.', { title: `Áp bố cục "${name}"?`, confirmLabel: 'Áp bố cục' }))) return
    await ensureFonts({ theme, slides: [] })
    const content = withPlaceholders(layoutId, contentFromSlide(currentSlide))
    const tone = defaultTone(layoutId)
    const elements = composeLayout(deck.theme, layoutId, content, tone)
    if (elements.length === 0) return
    const next = keepCustomBg(
      currentSlide,
      { ...currentSlide, layout: layoutId, tone, background: toneBackground(deck.theme, tone), elements },
      deck.theme.fg,
    )
    patchSlide(currentSlide.id, { layout: next.layout, tone: next.tone, background: next.background, elements: next.elements })
  }

  /**
   * Nối slide AI vào **deck mới nhất** (deckRef), không dùng `deck` của lần
   * render trước: các trang sinh xong cách nhau vài giây, người dùng có thể đã
   * sửa/xoá slide trong lúc chờ. Việc dựng slide + đổi theme nằm ở
   * `appendSlidesToDeck` (lib/slideAi.ts) để test được.
   */
  const appendAiSlides = async (pages: AiSlidePayload[], plan?: DeckPlan): Promise<Slide[]> => {
    if (!pages.length) return []
    await ensureFonts({ theme: plan?.theme ? themeById(plan.theme) : normalizeTheme(deckRef.current.theme), slides: [] })
    if (activeImageJobs.current !== imageJobs) return []
    // Bài giảng HTML không trộn với slide PPT: dựng PPT mới thì bỏ các slide HTML.
    if (deckRef.current.format === 'html') {
      deckRef.current = { ...deckRef.current, format: undefined, slides: [] }
      updateDeck({ format: undefined, slides: [] })
    }
    const latest = deckRef.current
    const { patch, added } = appendSlidesToDeck(latest, pages, plan)
    if (!added.length) return []

    historyRef.current.past = [...historyRef.current.past, latest].slice(-50)
    historyRef.current.future = []
    deckRef.current = { ...latest, ...patch }
    updateDeck(patch)
    setSelectedSlideId(added[0].id)
    setSelectedElementId(null)
    return added
  }

  // Bấm/→ hiện phần tử kế tiếp của slide; hết hiệu ứng mới sang slide sau; hết slide thì thoát. Lùi: ẩn bớt, rồi về slide trước (đã hiện đủ).
  const goNext = () => {
    if (presentStep < slideSteps(slides[presentIndex]?.elements ?? [])) setPresentStep(presentStep + 1)
    else if (presentIndex < slides.length - 1) {
      setPresentIndex(presentIndex + 1)
      setPresentStep(0)
    } else setPresenting(false) // đã ở bước cuối của slide cuối: tiến thêm thì thoát trình chiếu
  }
  const goPrev = () => {
    if (presentStep > 0) setPresentStep(presentStep - 1)
    else if (presentIndex > 0) {
      setPresentIndex(presentIndex - 1)
      setPresentStep(slideSteps(slides[presentIndex - 1]?.elements ?? []))
    }
  }

  useEffect(() => {
    if (presenting) setPresentStep(0)
  }, [presenting])

  // Chiếu toàn màn hình; Esc của trình duyệt thoát toàn màn hình thì thoát luôn trình chiếu.
  useEffect(() => {
    if (!presenting) return
    void document.documentElement.requestFullscreen?.().catch(() => {})
    const onChange = () => {
      if (!document.fullscreenElement) setPresenting(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      setPresentHover(null)
      setPresenterOpen(false)
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    }
  }, [presenting])

  // Trình chiếu: ←/→/Space/PageUp/PageDown, Esc thoát (iframe không có phím điều hướng riêng).
  useEffect(() => {
    if (!presenting) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return
      const k = e.key.toLowerCase()
      // Esc: đang cầm bút/laser thì cất bút trước, lần nữa mới thoát
      if (e.key === 'Escape') {
        if (presentTools.tool !== 'none') presentTools.setTool('none')
        else setPresenting(false)
      } else if (k === 'p' || k === 'l' || k === 'e') {
        const t = k === 'p' ? 'pen' : k === 'l' ? 'laser' : 'eraser'
        presentTools.setTool(presentTools.tool === t ? 'none' : t)
      } else if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) goNext()
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /** Deck có nội dung thật (không phải một slide mặc định chưa đụng tới) → duyệt dàn ý phải hỏi ghi đè. */
  const hasContent = deck.slides.length > 0 && !isStarterDeck(deck)

  /** Người dùng chọn "Ghi đè": xoá hết slide cũ (hoàn tác được), slide mới sinh ra bắt đầu từ deck rỗng. */
  const clearSlides = () => {
    const next: Deck = { ...deck, format: undefined, slides: [] }
    imageJobs.clear()
    commitDeck(next)
    deckRef.current = next
    setSelectedSlideId(null)
    setSelectedElementId(null)
  }

  /** AI sửa slide có sẵn bằng lệnh có cấu trúc; áp lên deck mới nhất, có lịch sử để hoàn tác. */
  const applyAiEdits = async (ops: SlideEditOp[], signal: AbortSignal): Promise<string[]> => {
    let target = normalizeTheme(deckRef.current.theme)
    const loads = ops.map(op => {
      if (op.op === 'set_theme') target = themeById(op.theme)
      if (op.op === 'apply_design') {
        const design = designById(op.id)
        if (design) target = normalizeTheme(designTheme(design))
      }
      if (op.op === 'set_fonts') {
        target = normalizeTheme(withThemeFonts(target, [slideFontByName(op.heading)?.family ?? target.fontHeading, slideFontByName(op.body)?.family ?? target.fontBody]))
      }
      return ensureFonts({ theme: target, slides: [] })
    })
    await Promise.all(loads)
    signal.throwIfAborted()
    if (activeImageJobs.current !== imageJobs) return []
    const latest = deckRef.current
    if (latest.slides.length !== deck.slides.length || latest.slides.some((slide, i) => slide.id !== deck.slides[i].id))
      return ['Thứ tự slide đã đổi. Bạn gửi lại yêu cầu nhé.']
    const result = applyEdits(latest, ops)
    if (result.changed) {
      historyRef.current.past = [...historyRef.current.past, latest].slice(-50)
      historyRef.current.future = []
      deckRef.current = result.deck
      updateDeck(result.deck)
    }
    const lines = [...result.summary]
    for (const { slideId, description, replace } of result.images) {
      const slide = deckRef.current.slides.find(s => s.id === slideId)
      if (!slide) continue
      const content = contentFromSlide(slide)
      try {
        const prompt = buildImagePrompt(content.title, description ? [description] : content.bullets, 'portrait', target.accent)
        const photo = await queueImage(() => {
          signal.throwIfAborted()
          return generateSlideImage(prompt)
        })
        signal.throwIfAborted()
        if (activeImageJobs.current !== imageJobs || !deckRef.current.slides.some(s => s.id === slideId)) continue
        const src = await uploadImage(photo.dataUrl)
        signal.throwIfAborted()
        const current = deckRef.current
        const index = current.slides.findIndex(s => s.id === slideId)
        if (activeImageJobs.current !== imageJobs || index < 0) continue
        const selected = current.slides[index]
        const slot = selected.elements.find(el => el.type === 'image' && !el.src)
          ?? (replace ? selected.elements.find(el => el.type === 'image' && !el.decor && !el.locked) : undefined)
        const elements = slot
          ? selected.elements.map(el => el === slot ? { ...el, src, crop: undefined } : el)
          : [
              ...selected.elements.map(el => el.decor || el.y + el.h <= 24 ? el : { ...el, x: el.x * 0.66, w: el.w * 0.66 }),
              { id: uid(), type: 'image' as const, x: 68, y: 27, w: 26, h: 62, src },
            ]
        const updated = { ...current, slides: current.slides.map(s => s === selected ? { ...s, elements, ...(slot ? {} : { layout: undefined }) } : s) }
        historyRef.current.past = [...historyRef.current.past, current].slice(-50)
        historyRef.current.future = []
        deckRef.current = updated
        updateDeck({ slides: updated.slides })
        lines.push(slot?.src ? `Mình đã đổi ảnh ở slide ${index + 1}.` : `Mình đã thêm ảnh vào slide ${index + 1}.`)
      } catch {
        signal.throwIfAborted()
        lines.push('Mình chưa thêm được ảnh. Bạn thử lại nhé.')
      }
    }
    return lines
  }

  /** Mô tả deck cho lệnh sửa: theme, phông, danh sách slide (số thứ tự bắt đầu từ 1). */
  const editContext =
    `bộ màu ${theme.id} (${theme.name}), phông tiêu đề ${theme.fonts.heading}, phông nội dung ${theme.fonts.body}; ` +
    `\nSlide đang chọn: ${Math.max(1, deck.slides.findIndex(s => s.id === selectedSlideId) + 1)}.\n` + deck.slides.map(describeSlide).join('\n')

  /** Chế độ HTML: thay toàn bộ slide bằng các slide HTML (hoàn tác được bằng lịch sử). */
  /** Đường deck một lượt (dàn ý không parse được hoặc câu trả lời cũ). */
  const applyAiResult = async (text: string, plan?: DeckPlan): Promise<number> => {
    const parsed = parseAiDeck(text)
    if (!parsed) return 0
    const checked = parsed.slides.map(page => checkSlide(page, page.layout ?? 'bullets'))
    if (checked.some(check => check.errors.length)) return 0
    return (await appendAiSlides(checked.map(check => check.page), plan)).length
  }

  /** Ghi ảnh AI vào slide theo deck mới nhất lúc ảnh về (slide có thể đã được sửa/xoá). */
  const setSlideImage = (slideId: string, image: string, slot: SlideImageSlot, credit?: string) => {
    const latest = deckRef.current
    const slide = latest.slides.find((s) => s.id === slideId)
    if (!slide || activeImageJobs.current !== imageJobs) return false
    const next = withImage(slide, normalizeTheme(latest.theme), image, slot, credit)
    if (next === slide) return false
    historyRef.current.past = [...historyRef.current.past, latest].slice(-50)
    historyRef.current.future = []
    const slides = latest.slides.map((s) => (s.id === slideId ? next : s))
    deckRef.current = { ...latest, slides }
    updateDeck({ slides })
    return true
  }

  /**
   * Đường 26b: mỗi trang xong được chèn NGAY (đúng thứ tự); ảnh AI mất 45–90 giây
   * nên xếp hàng vẽ ảnh sau cho bìa và bố cục ảnh.
   */
  const applyAiSlide = async (page: AiSlidePayload, plan: DeckPlan) => {
    const added = await appendAiSlides([page], plan)
    const slide = added[0]
    if (!slide || activeImageJobs.current !== imageJobs || !deckRef.current.slides.some(s => s.id === slide.id)) return
    // Chế độ Chuyên nghiệp: AI mô tả ảnh, app vẽ ảnh cho các bố cục biên tập
    if (page.imagePrompt || page.image2Prompt) {
      const jobs: Array<[SlideImageSlot, string | undefined]> = [
        ['image', page.image ? undefined : page.imagePrompt],
        ['image2', page.image2 ? undefined : page.image2Prompt],
      ]
      for (const [slot, text] of jobs) {
        if (!text?.trim()) continue
        void imageJobs.start(slide.id, slot, async () => {
          const photo = await loadProPhoto(text)
          if (!photo) throw new Error('Thiếu mô tả ảnh')
          return { src: await uploadImage(photo.dataUrl), credit: photo.credit }
        }, ({ src, credit }) => setSlideImage(slide.id, src, slot, credit))
      }
      return
    }
    if (page.image || !IMAGE_LAYOUTS.includes(page.layout ?? '')) return
    const palette = normalizeTheme(deckRef.current.theme).accent
    const isCover = page.layout === 'title'
    const bullets = page.bullets ?? page.steps ?? page.items ?? [page.subtitle ?? '']
    const orientation = isCover ? 'square' : page.layout === 'image-left' || page.layout === 'image-right' ? 'portrait' : 'landscape'
    const prompt = buildImagePrompt(page.title, bullets, orientation, palette)
    void imageJobs.start(slide.id, 'image', async () => {
      // Provider hay quá hạn/lỗi thoáng qua: thử lại một lần trong cùng lượt hàng đợi.
      const generated = await queueImage(() => generateSlideImage(prompt).catch(() => generateSlideImage(prompt)))
      return { src: await uploadImage(generated.dataUrl) }
    }, ({ src }) => setSlideImage(slide.id, src, 'image'))
  }

  /* ---------------------------------------------------------------- *
   * Trình chiếu
   * ---------------------------------------------------------------- */
  if (presenting) {
    const slide = deck.slides[presentIndex]
    if (!slide) {
      setPresenting(false)
      return null
    }
    const canPrev = presentIndex > 0 || presentStep > 0
    // tiến luôn được: hết slide thì goNext thoát trình chiếu
    const canNext = true
    const onMove = (e: React.MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window
      setPresentHover(e.clientY > h - 90 ? 'bar' : e.clientX < w * 0.12 ? 'left' : e.clientX > w * 0.88 ? 'right' : null)
    }
    const edge = (side: 'left' | 'right') => {
      const go = side === 'left' ? goPrev : goNext
      const enabled = side === 'left' ? canPrev : canNext
      const Icon = side === 'left' ? ChevronLeft : ChevronRight
      return (
        <div
          className={cn('absolute inset-y-0 z-10 flex w-[12%] items-center', side === 'left' ? 'left-0 justify-start pl-5' : 'right-0 justify-end pr-5')}
          style={{ cursor: enabled ? 'pointer' : 'default' }}
          onClick={(e) => {
            e.stopPropagation()
            go()
          }}
        >
          <span
            className="flex size-12 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all duration-200"
            style={{ opacity: presentHover === side && enabled ? 1 : 0, transform: presentHover === side && enabled ? 'scale(1)' : 'scale(0.85)' }}
          >
            <Icon className="size-6" />
          </span>
        </div>
      )
    }
    return (
      <SlideImageContext.Provider value={{ jobs: imageJobs }}>
      <div
        className="fixed inset-0 z-[100] select-none overflow-hidden bg-black touch-pan-y"
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse') return
          swipeRef.current = { x: e.clientX, y: e.clientY, didSwipe: false }
        }}
        onPointerUp={(e) => {
          if (e.pointerType === 'mouse' || !swipeRef.current) return
          const dx = e.clientX - swipeRef.current.x
          const dy = e.clientY - swipeRef.current.y
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            swipeRef.current.didSwipe = true
            if (dx < 0) goNext()
            else goPrev()
          }
        }}
        onClick={(e) => {
          if (swipeRef.current?.didSwipe) {
            swipeRef.current.didSwipe = false
            return
          }
          // Chạm vào phần dưới màn hình trên cảm ứng để bật/tắt thanh điều khiển
          if (e.clientY > window.innerHeight - 90) {
            setPresentHover((cur) => (cur === 'bar' ? null : 'bar'))
            return
          }
          if (presentTools.tool !== 'none') return
          goNext()
        }}
        onMouseMove={onMove}
        onMouseLeave={() => setPresentHover(null)}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {/* vừa khít màn hình, giữ 16:9 */}
          <div
            key={slide.id}
            className={slide.transition && slide.transition !== 'none' ? `slide-enter-${slide.transition}` : undefined}
            style={{ width: 'min(100vw, calc(100vh * 16 / 9))' }}
          >
            {slide.html ? (
              <HtmlSlideFrame html={slide.html} interactive />
            ) : (
              <div
                className="slide-frame relative aspect-[16/9] w-full overflow-hidden"
                data-decor={theme.decor}
                style={{ ...slideBgStyle(slide), ...decorStyle(theme) }}
              >
                {readableElements(slide, theme).map((el) => {
                  // kiểm lại link lúc vẽ: bài chia sẻ/nhập tệp có thể chứa sẵn `javascript:`…
                  const safeHref = el.href ? normalizeSlideHref(el.href) : null
                  const linkHitbox =
                    safeHref && (!el.step || el.step <= presentStep) ? (
                      <a
                        key={`${el.id}-href`}
                        href={safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Mở liên kết ${safeHref}`}
                        data-tip={safeHref}
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          window.open(safeHref, '_blank', 'noopener')
                        }}
                        style={{
                          position: 'absolute',
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          width: `${el.w}%`,
                          height: `${heightOf(el)}%`,
                          transform: elTransform(el),
                          zIndex: (el.zIndex ?? 0) + 1,
                          pointerEvents: 'auto',
                          cursor: 'pointer',
                        }}
                      />
                    ) : null
                  return el.step ? (
                    <RevealLayer key={el.id} el={el} shown={el.step <= presentStep}>
                      <SlideElView el={el} theme={theme} slideId={slide.id} live />
                      {linkHitbox}
                    </RevealLayer>
                  ) : (
                    <div key={el.id} style={{ display: 'contents' }}>
                      <SlideElView el={el} theme={theme} slideId={slide.id} revealStep={presentStep} live />
                      {linkHitbox}
                    </div>
                  )
                })}
                <SlideImageStatuses slide={slide} theme={theme} />
                <SlideFooterView footer={deck.footer} slide={slide} slideIndex={presentIndex} theme={theme} />
                <InkLayer
                  tool={presentTools.tool}
                  color={presentTools.color}
                  strokes={presentTools.ink[slide.id] ?? []}
                  onAdd={(st) => presentTools.addStroke(slide.id, st)}
                  onRemove={(i) => presentTools.removeStroke(slide.id, i)}
                />
              </div>
            )}
          </div>
        </div>
        {presentTools.tool === 'none' && edge('left')}
        {presentTools.tool === 'none' && edge('right')}
        {/* thanh điều khiển trượt lên từ đáy, đè lên slide chứ không đẩy slide */}
        <div
          className="absolute inset-x-0 bottom-0 z-20 flex h-[68px] items-center justify-between px-10 text-white/85 backdrop-blur-md transition-transform duration-300 ease-out"
          style={{ background: 'rgba(52, 58, 70, 0.92)', transform: presentHover === 'bar' ? 'translateY(0)' : 'translateY(100%)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-5">
            <button type="button" aria-label="Slide trước" onClick={goPrev} disabled={!canPrev} className="rounded-md p-1.5 transition-colors hover:bg-white/10 disabled:opacity-30">
              <ChevronLeft className="size-6" />
            </button>
            <span className="tnum min-w-[4.5rem] text-center text-[17px] font-semibold text-white">
              {presentIndex + 1} / {deck.slides.length}
            </span>
            <button type="button" aria-label="Slide sau" onClick={goNext} disabled={!canNext} className="rounded-md p-1.5 transition-colors hover:bg-white/10 disabled:opacity-30">
              <ChevronRight className="size-6" />
            </button>
          </div>
          <PresentToolbar tools={presentTools} slideId={slide.id} presenterOpen={presenterOpen} onOpenPresenter={() => setPresenterOpen((v) => !v)} />
          <button type="button" aria-label="Thoát trình chiếu" data-tip="Thoát trình chiếu" data-tip-kbd="Esc" onClick={() => setPresenting(false)} className="rounded-md p-1.5 transition-colors hover:bg-white/10">
            <Minimize2 className="size-6" />
          </button>
        </div>
        <PresenterWindow
          open={presenterOpen}
          onClose={() => setPresenterOpen(false)}
          index={presentIndex}
          total={deck.slides.length}
          title={contentFromSlide(slide).title ?? ''}
          nextTitle={deck.slides[presentIndex + 1] ? contentFromSlide(deck.slides[presentIndex + 1]).title ?? '' : null}
          notes={slide.notes ?? ''}
          elapsed={presentTools.timer.elapsed}
          onPrev={goPrev}
          onNext={goNext}
        />
      </div>
      </SlideImageContext.Provider>
    )
  }

  /* ---------------------------------------------------------------- *
   * Editor
   * ---------------------------------------------------------------- */
  return (
    // điện thoại: chừa chỗ cho thanh tab đáy (SlideSidePanel) để dải slide không bị che
    <SlideImageContext.Provider value={{ jobs: imageJobs }}>
    <div className="slide-editor flex min-h-0 min-w-0 flex-1 flex-col max-sm:pb-14">
      {printing && (
        <SlideImageContext.Provider value={null}>
          <PrintDeck slides={deck.slides} theme={theme} footer={deck.footer} onDone={() => setPrinting(false)} />
        </SlideImageContext.Provider>
      )}
      {deck.format === 'html' ? (
        <HtmlDeckBar
          onSave={onSave}
          onPresent={() => { setPresentIndex(currentSlide ? deck.slides.indexOf(currentSlide) : 0); setPresenting(true) }}
        />
      ) : (
      <SlideRibbon
        deck={deck}
        slide={currentSlide}
        slideIndex={currentSlide ? deck.slides.indexOf(currentSlide) : 0}
        selected={selectedElement}
        activeTab={ribbonTab}
        onTabChange={setRibbonTab}
        onNewDeck={onNewDeck}
        onImportFile={onImportFile}
        onDownload={() => import('@/lib/exportDeck').then((m) => m.exportDeckPptx(deck))}
        onSave={onSave}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyRef.current.past.length > 0}
        canRedo={historyRef.current.future.length > 0}
        onAddSlide={addSlide}
        onDuplicateSlide={() => currentSlide && duplicateSlide(currentSlide.id)}
        onDeleteSlide={() => currentSlide && removeSlide(currentSlide.id)}
        onInsert={(el) => { addElement(el); setSelectedElementId(el.id) }}
        onUpdateSelected={onUpdateSelected}
        cropping={Boolean(croppingId && croppingId === selectedElement?.id)}
        onToggleCrop={toggleCrop}
        onResetCrop={resetCrop}
        onDeleteSelected={() => selectedElement && removeElement(currentSlide?.id ?? '', selectedElement.id)}
        onCopySelected={() => (groupEls.length >= 2 ? setClipboard(groupEls) : selectedElement && setClipboard([selectedElement]))}
        onCutSelected={() => {
          if (groupEls.length >= 2) { setClipboard(groupEls); removeGroup(); return }
          if (!selectedElement || !currentSlide) return
          setClipboard([selectedElement])
          removeElement(currentSlide.id, selectedElement.id)
        }}
        onPaste={pasteClipboard}
        canPaste={clipboard.length > 0}
        onArrange={arrangeSelected}
        onAlign={alignSelected}
        onFlip={flipSelected}
        onOpenDesigns={() => setOpenDesignsSignal((n) => n + 1)}
        onOpenIcons={() => setOpenIconsSignal((n) => n + 1)}
        gridOn={gridOn}
        onToggleGrid={() => setGridOn((v) => writePref('slide-grid', !v))}
        snapOn={snapOn}
        onToggleSnap={() => setSnapOn((v) => writePref('slide-snap', !v))}
        onApplyLayout={applyLayout}
        onTone={applyTone}
        onTransition={(transition, allSlides) => {
          if (allSlides) commitDeck({ ...deck, slides: deck.slides.map((s) => ({ ...s, transition })) })
          else if (currentSlide) patchSlide(currentSlide.id, { transition })
        }}
        onBackground={(background, allSlides, image) =>
          commitDeck({
            ...deck,
            slides: deck.slides.map((s) =>
              s.html || (!allSlides && s.id !== currentSlide?.id)
                ? s
                : background
                  ? withBackground({ ...s, bgImage: image }, background, deck.theme.fg)
                  : recomposeSlide(deck.theme, { ...s, customBg: undefined, bgImage: undefined }),
            ),
          })
        }
        onElementAnim={(action) => {
          if (!currentSlide || !selectedElement) return
          commitDeck({
            ...deck,
            slides: deck.slides.map((s) =>
              s.id === currentSlide.id ? { ...s, elements: applyElementAnim(s.elements, selectedElement.id, action) } : s,
            ),
          })
          if (action.type === 'set' || action.type === 'speed' || action.type === 'byLine')
            setAnimPreview({ id: selectedElement.id, nonce: Date.now() })
        }}
        onAnimate={(mode, allSlides) =>
          commitDeck({
            ...deck,
            slides: deck.slides.map((s) =>
              s.html || (!allSlides && s.id !== currentSlide?.id)
                ? s
                : { ...s, elements: mode === 'auto' ? autoAnimate(s.elements, s.layout ?? 'bullets') : clearAnimation(s.elements) },
            ),
          })
        }
        onPresent={() => { setPresentIndex(currentSlide ? deck.slides.indexOf(currentSlide) : 0); setPresenting(true) }}
        onPresentFromStart={() => { setPresentIndex(0); setPresenting(true) }}
        onExportPdf={() => setPrinting(true)}
        formatPaneOpen={formatPaneOpen}
        onToggleFormatPane={() => setFormatPaneOpen((v) => !v)}
        painterMode={painter?.mode ?? 'off'}
        onTogglePainter={(lock) => {
          if (lock) {
            const sample = captureTextFormat(selectedElement ?? undefined) ?? painter?.sample
            if (sample) setPainter({ mode: 'lock', sample })
            return
          }
          if (painter) {
            setPainter(null)
            return
          }
          const sample = captureTextFormat(selectedElement ?? undefined)
          if (sample) setPainter({ mode: 'once', sample })
        }}
        onUpdateFooter={(footer) => commitDeck({ ...deck, footer })}
        aiOpen={aiOpen}
        onToggleAi={() => setAiOpen((v) => !v)}
        zoom={zoom}
        onZoom={setZoom}
      />
      )}
      <div className="flex min-h-0 min-w-0 flex-1">
      {/* ---------------- thư viện (cột trái, kiểu Canva): panel trượt đẩy sân giấy ---------------- */}
      <SlideSidePanel
        theme={theme}
        accent={theme.accent}
        canInsert={Boolean(currentSlide) && !currentSlide?.html}
        hint={`${deck.title} ${(currentSlide?.elements ?? []).map((e) => e.text ?? '').join(' ').replace(/<[^>]+>/g, ' ')}`}
        onAddLayoutSlide={addLayoutFromPanel}
        activeDesignId={deck.design}
        designDisabled={deck.format === 'html'}
        onApplyDesign={applyDesignFromPanel}
        openDesignsSignal={openDesignsSignal}
        openIconsSignal={openIconsSignal}
        onInsert={insertFromPanel}
        onOpenAi={() => setAiOpen(true)}
      />

      {/* ---------------- sân soạn (giữa) ---------------- */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* canvas */}
        <div className="slide-stage group relative min-h-0 anim-tab-in" key={deck.id}>
          {formatPaneOpen && selectedElement && currentSlide && (
            <aside className="slide-format-pane" aria-label="Bảng chọn định dạng">
              <div className="slide-format-pane__title">Định dạng</div>
              {(['x', 'y', 'w', 'h'] as const).map((key) => (
                <label key={key} className="slide-format-pane__row">
                  <span>{{ x: 'X', y: 'Y', w: 'Rộng', h: 'Cao' }[key]}</span>
                  <input
                    type="number"
                    value={Math.round(key === 'h' ? heightOf(selectedElement) : selectedElement[key])}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      updateElement(
                        currentSlide.id,
                        selectedElement.id,
                        key === 'h' && selectedElement.type === 'text'
                          ? { h: value, fixedHeight: true }
                          : { [key]: value },
                      )
                    }}
                  />
                  <em>%</em>
                </label>
              ))}
              {selectedElement.type === 'text' && (
                <PaneColor label="Màu" value={selectedElement.textColor ?? theme.fg} themeColors={[theme.accent, theme.fg]} onPick={(c) => updateElement(currentSlide.id, selectedElement.id, { textColor: c })} />
              )}
              {selectedElement.type === 'graphic' && (
                <>
                  <PaneColor label="Nét" value={selectedElement.textColor ?? theme.fg} themeColors={[theme.accent, theme.fg]} onPick={(c) => updateElement(currentSlide.id, selectedElement.id, { textColor: c })} />
                  <PaneColor label="Chủ đạo" value={selectedElement.fill ?? graphicMainColor(selectedElement.graphicId)} themeColors={[theme.accent, theme.fg]} onPick={(c) => updateElement(currentSlide.id, selectedElement.id, { fill: c })} />
                </>
              )}
              {selectedElement.type === 'icon' && (
                <PaneColor label="Màu" value={selectedElement.textColor ?? theme.accent} themeColors={[theme.accent, theme.fg]} onPick={(c) => updateElement(currentSlide.id, selectedElement.id, { textColor: c })} />
              )}
              {(selectedElement.type === 'shape' || selectedElement.type === 'graphic' || selectedElement.type === 'icon') && (
                <label className="slide-format-pane__row">
                  <span>Trong suốt</span>
                  <input
                    type="range"
                    min={0}
                    max={90}
                    step={5}
                    value={100 - Math.round((selectedElement.opacity ?? 1) * 100)}
                    onChange={(e) => updateElement(currentSlide.id, selectedElement.id, { opacity: 1 - Number(e.target.value) / 100 })}
                  />
                  <em>{100 - Math.round((selectedElement.opacity ?? 1) * 100)}%</em>
                </label>
              )}
              {selectedElement.type === 'shape' && (
                <PaneColor label="Tô" value={selectedElement.fill ?? theme.accent} themeColors={[theme.accent, theme.fg]} onPick={(c) => updateElement(currentSlide.id, selectedElement.id, { fill: c })} />
              )}
              <button type="button" className="slide-format-pane__close" onClick={() => setFormatPaneOpen(false)}>Đóng</button>
            </aside>
          )}
          {/* zoom đặt ở lớp bọc, không đặt lên chính `.slide-frame`: frame là
              container query của `cqw`, giữ nó ở bề rộng layout thật để chữ chỉ
              bị phóng đúng một lần. */}
          <div className="slide-stage__inner" style={{ zoom: zoom / 100 }}>
            {currentSlide?.html ? (
              <HtmlSlideFrame html={currentSlide.html} interactive className="shadow-[0_2px_24px_-8px_rgba(35,32,28,0.35)]" />
            ) : currentSlide ? (
              <div
                className={cn(
                  'slide-frame relative aspect-[16/9] w-full overflow-hidden bg-white shadow-[0_2px_24px_-8px_rgba(35,32,28,0.35)]',
                  painter && 'is-painter',
                )}
                data-decor={theme.decor}
                style={{ ...slideBgStyle(currentSlide), ...decorStyle(theme) }}
                onContextMenu={openSlideMenu}
                onPointerDown={(e) => {
                  // chỉ bắt đầu khi bấm chuột trái lên nền trống (không phải phần tử, tay nắm)
                  if (e.button !== 0 || e.target !== e.currentTarget || painter || croppingId || animPreview) return
                  const frame = e.currentTarget
                  const box = frame.getBoundingClientRect()
                  const at = (ev: PointerEvent) => ({
                    x: Math.max(0, Math.min(100, ((ev.clientX - box.left) / box.width) * 100)),
                    y: Math.max(0, Math.min(100, ((ev.clientY - box.top) / box.height) * 100)),
                  })
                  const p0 = at(e.nativeEvent)
                  let rect = { x0: p0.x, y0: p0.y, x1: p0.x, y1: p0.y }
                  let moved = false
                  const onMove = (ev: PointerEvent) => {
                    const p = at(ev)
                    rect = { ...rect, x1: p.x, y1: p.y }
                    if (!moved && Math.hypot(p.x - p0.x, p.y - p0.y) < 0.6) return
                    moved = true
                    setMarquee(rect)
                  }
                  const onUp = () => {
                    window.removeEventListener('pointermove', onMove)
                    window.removeEventListener('pointerup', onUp)
                    setMarquee(null)
                    if (!moved) return
                    didDragRef.current = true
                    const [l, r] = [Math.min(rect.x0, rect.x1), Math.max(rect.x0, rect.x1)]
                    const [t, b] = [Math.min(rect.y0, rect.y1), Math.max(rect.y0, rect.y1)]
                    // chạm vào khung là tính, như Canva
                    const hits = currentSlide.elements.filter((el) => el.x < r && el.x + el.w > l && el.y < b && el.y + heightOf(el) > t)
                    setPainter(null)
                    if (hits.length >= 2) {
                      setSelectedElementId(null)
                      setGroupIds(hits.map((el) => el.id))
                    } else {
                      setGroupIds([])
                      setSelectedElementId(hits[0]?.id ?? null)
                    }
                  }
                  window.addEventListener('pointermove', onMove)
                  window.addEventListener('pointerup', onUp)
                }}
                onClickCapture={(e) => {
                  // Kéo xoay/resize có thể nhả chuột ngoài phần tử; đừng để cú
                  // click rơi vào nền xoá mất vùng chọn vừa thao tác.
                  if (!didDragRef.current) return
                  e.stopPropagation()
                  didDragRef.current = false
                }}
                onClick={() => {
                  setPainter(null)
                  setSelectedElementId(null)
                  setGroupIds([])
                }}
              >
                {gridOn ? <div className="slide-grid-overlay" aria-hidden /> : null}
                {fixedGroup && (
                  <div
                    className="slide-group-box"
                    aria-hidden
                    style={{
                      left: `${Math.min(...groupEls.map((el) => el.x))}%`,
                      top: `${Math.min(...groupEls.map((el) => el.y))}%`,
                      width: `${Math.max(...groupEls.map((el) => el.x + el.w)) - Math.min(...groupEls.map((el) => el.x))}%`,
                      height: `${Math.max(...groupEls.map((el) => el.y + heightOf(el))) - Math.min(...groupEls.map((el) => el.y))}%`,
                    }}
                  />
                )}
                {marquee && (
                  <div
                    className="slide-marquee"
                    aria-hidden
                    style={{
                      left: `${Math.min(marquee.x0, marquee.x1)}%`,
                      top: `${Math.min(marquee.y0, marquee.y1)}%`,
                      width: `${Math.abs(marquee.x1 - marquee.x0)}%`,
                      height: `${Math.abs(marquee.y1 - marquee.y0)}%`,
                    }}
                  />
                )}
                {ribbonTab === 'animations'
                  ? currentSlide.elements
                      .filter((el) => startOf(el) !== undefined)
                      .map((el) => (
                        <span
                          key={`anim-${el.id}`}
                          className={cn('slide-anim-badge', el.id === selectedElementId && 'is-selected')}
                          style={{ left: `${el.x}%`, top: `${el.y}%` }}
                          aria-hidden
                        >
                          {el.lineStep !== undefined ? `${el.lineStep}…` : el.step}
                        </span>
                      ))
                  : null}
                <SnapGuides />
                {animPreview
                  ? (() => {
                      const el = currentSlide.elements.find((e) => e.id === animPreview.id)
                      return el?.anim ? <AnimPreview key={animPreview.nonce} el={el} theme={theme} onDone={endAnimPreview} /> : null
                    })()
                  : null}
                {readableElements(currentSlide, theme).map((el) => (
                  <EditableEl
                    key={el.id}
                    el={el}
                    slideId={currentSlide.id}
                    theme={theme}
                    selected={selectedElementId === el.id}
                    onSelect={() => selectEl(el)}
                    grouped={groupIds.includes(el.id) ? (fixedGroup ? 'soft' : true) : false}
                    onSelectSingle={() => { setGroupIds([]); setSelectedElementId(el.id) }}
                    // kéo cả nhóm chọn, hoặc cả nhóm cố định ngay từ cú bấm đầu; mục khoá đứng yên
                    group={(groupIds.includes(el.id) ? groupEls : selectedElementId === el.id ? [] : groupMembers(el))
                      .filter((g) => g.id !== el.id && !g.locked)
                      .map((g) => ({ id: g.id, x: g.x, y: g.y }))}
                    onToggleSelect={() => toggleInGroup(el.id)}
                    onPreviewMany={(patches) => previewMany(currentSlide.id, patches)}
                    onDragEnd={() => {
                      didDragRef.current = true
                      window.setTimeout(() => {
                        didDragRef.current = false
                      }, 0)
                    }}
                    onBeginHistory={beginHistory}
                    onPreview={(patch) => previewElement(currentSlide.id, el.id, patch)}
                    onChange={(patch) => updateElement(currentSlide.id, el.id, patch)}
                    onGenerateImage={() => generateImageFor(currentSlide.id, el.id)}
                    onDropInFrame={(frameId, src) => {
                      // một lần ghi (khung nhận ảnh + bỏ ảnh kéo), dựa trên deck mới nhất
                      const latest = deckRef.current
                      commitDeck({
                        ...latest,
                        slides: latest.slides.map((s) =>
                          s.id === currentSlide.id
                            ? { ...s, elements: s.elements.flatMap((e) => (e.id === el.id ? [] : e.id === frameId ? [{ ...e, src }] : [e])) }
                            : s,
                        ),
                      })
                      setSelectedElementId(frameId)
                    }}
                    editingText={editingShapeId === el.id}
                    onEditingText={(on) => setEditingShapeId(on ? el.id : null)}
                    cropping={croppingId === el.id}
                    formatPainterActive={Boolean(painter)}
                    onPaintApply={() => {
                      if (!painter) return
                      if (el.type === 'text') {
                        updateElement(currentSlide.id, el.id, applyTextFormat(painter.sample))
                        setSelectedElementId(el.id)
                      }
                      if (painter.mode === 'once') setPainter(null)
                    }}
                  />
                ))}
                <SlideImageStatuses slide={currentSlide} theme={theme} editable />
                <SlideFooterView
                  footer={deck.footer}
                  slide={currentSlide}
                  slideIndex={deck.slides.indexOf(currentSlide)}
                  theme={theme}
                />
              </div>
            ) : (
              <EmptyState
                icon={<MonitorPlay className="size-7" strokeWidth={1.4} />}
                title="Chưa có slide nào"
                description="Nhấn dấu + ở thanh slide phía dưới để bắt đầu."
              />
            )}
            {groupEls.length >= 2 && currentSlide && !currentSlide.html && (
              <GroupToolbar
                els={groupEls}
                onAlign={alignGroup}
                onDelete={removeGroup}
                onGroup={groupSelected}
                onUngroup={ungroupSelected}
                onDuplicate={() => duplicateIds(groupIds)}
                onToggleLock={() => toggleLockIds(groupIds)}
                onMore={(r) => setCtxMenu({ x: r.left, y: r.bottom + 6, items: elementItems(groupIds) })}
              />
            )}
            {selectedElement && currentSlide && !currentSlide.html && croppingId !== selectedElement.id && (
              <SelectionToolbar
                key={selectedElement.id}
                el={selectedElement}
                onAskAi={async (instruction) => {
                  const patch = await rewriteElement(
                    selectedElement,
                    instruction,
                    currentSlide.elements.find((e) => e.id === 'title')?.text ?? '',
                  )
                  updateElement(currentSlide.id, selectedElement.id, patch)
                }}
                height={heightOf(selectedElement)}
                accent={theme.accent}
                fg={theme.fg}
                onUpdate={(patch) => updateElement(currentSlide.id, selectedElement.id, patch)}
                onEditText={() => setEditingShapeId(selectedElement.id)}
                onAskChat={() => {
                  const el = selectedElement
                  const idx = deck.slides.findIndex((s) => s.id === currentSlide.id) + 1
                  const text = 'text' in el && typeof el.text === 'string' ? el.text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''
                  const kind = ({ text: 'Hộp chữ', shape: 'Hình khối', image: 'Ảnh', icon: 'Icon', graphic: 'Đồ hoạ', table: 'Bảng', chart: 'Biểu đồ' } as Record<string, string>)[el.type] ?? 'Phần tử'
                  attachToAi('slide', [{
                    id: `${currentSlide.id}-${el.id}`,
                    label: `${kind}${text ? ` “${text.slice(0, 18)}${text.length > 18 ? '…' : ''}”` : ''} · slide ${idx}`,
                    detail: `${kind} (id ${el.id}) trên slide ${idx}, vị trí x=${Math.round(el.x)}% y=${Math.round(el.y)}% rộng ${Math.round(el.w)}% cao ${Math.round(el.h)}%${text ? `, nội dung: "${text.slice(0, 1500)}"` : ''}`,
                  }])
                  setAiOpen(true)
                }}
                onDelete={() => removeElement(currentSlide.id, selectedElement.id)}
                onArrange={arrangeSelected}
                elements={currentSlide.elements}
                onSelectLayer={setSelectedElementId}
                onDuplicate={() => {
                  const copy = { ...selectedElement, id: uid(), x: selectedElement.x + 3, y: selectedElement.y + 3 }
                  addElement(copy)
                  setSelectedElementId(copy.id)
                }}
              />
            )}
          </div>
          {/* ghi chú diễn giả: nút nhỏ ở góc dưới, hiện khi di chuột vào slide. AI viết vào đây (lệnh set_notes)
              và PPTX xuất ra phần ghi chú. Lưu khi rời ô để không sinh một bước hoàn tác mỗi ký tự. */}
          {currentSlide && !currentSlide.html && (
            <div className="absolute bottom-3 left-3 z-20">
              {notesOpen && (
                <textarea
                  key={currentSlide.id}
                  className="slide-notes mb-2 block h-28 w-[320px] resize-none rounded-lg border border-line bg-white p-2.5 text-[13px] shadow-lg outline-none focus:border-clay"
                  placeholder="Nhấp để thêm ghi chú diễn giả"
                  aria-label="Ghi chú diễn giả"
                  defaultValue={currentSlide.notes ?? ''}
                  onBlur={(e) => {
                    if (e.target.value !== (currentSlide.notes ?? '')) patchSlide(currentSlide.id, { notes: e.target.value })
                  }}
                />
              )}
              <button
                type="button"
                aria-pressed={notesOpen}
                onClick={() => setNotesOpen((v) => !v)}
                className={cn(
                  'rounded-full bg-white/90 px-3 py-1 text-[12px] font-medium text-ink-2 shadow transition-opacity hover:text-clay focus-visible:opacity-100 group-hover:opacity-100',
                  notesOpen ? 'opacity-100' : 'opacity-0',
                )}
              >
                Ghi chú{currentSlide.notes ? ' ·' : ''}
              </button>
            </div>
          )}
        </div>
        {/* thanh slide dưới đáy: thumbnail ngang, dấu + cuối dãy và giữa hai slide, kéo để đổi thứ tự */}
        <SlideStrip
          slides={deck.slides}
          currentId={currentSlide?.id ?? null}
          allowAdd={deck.format !== 'html'}
          pendingCount={pendingCount}
          renderThumb={(s) => (
            <SlideThumb
              slide={s}
              theme={theme}
              footer={deck.footer}
              slideIndex={deck.slides.indexOf(s)}
            />
          )}
          onSelect={(id) => { setSelectedSlideId(id); setSelectedElementId(null) }}
          onAddAt={addSlideAt}
          onDuplicate={duplicateSlide}
          onRemove={removeSlide}
          onMove={moveSlide}
          onSlideMenu={(id, index, e) => setCtxMenu({ x: e.clientX, y: e.clientY, items: slideItems(id, index) })}
        />
        <ContextMenu menu={ctxMenu} onClose={closeCtxMenu} />
      </div>

      {/* ---------------- AI panel (phải) — trợ lý AI nằm ở cột phải --------- */}
      <AiDock open={aiOpen} onToggle={() => setAiOpen((v) => !v)} width={360} side="right">
        <AiPanel
          mode="slide"
          panelOpen={aiOpen}
          attachKey="slide"
          historyKey={deck.id}
          onApplySlides={applyAiResult}
          onAppendSlide={applyAiSlide}
          existingSlideCount={hasContent ? deck.slides.length : 0}
          onClearSlides={clearSlides}
          editContext={editContext}
          onApplyEdits={applyAiEdits}
          onCheckEdits={ops => applyEdits(deckRef.current, ops).rejected}
          onPendingSlides={setPendingSlides}
          contextSummary={`bài giảng "${deck.title}", ${deck.slides.length} slide`}
        />
      </AiDock>
      </div>
    </div>
    </SlideImageContext.Provider>
  )
}

/* ------------------------------------------------------------------ *
 * Element views
 * ------------------------------------------------------------------ */
/**
 * Thumbnail một slide — dùng trong cột thumbnail của editor và bảng "Gần đây"
 * ở tab Bắt đầu.
 */
export { SlideThumb } from './slideRender'
