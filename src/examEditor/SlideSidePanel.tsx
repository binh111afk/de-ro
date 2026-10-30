/**
 * Cột trái của trình soạn slide, kiểu Canva: thanh icon hẹp + một panel trượt
 * ra cạnh thanh đó. Panel đẩy sân giấy sang phải chứ không che slide đang sửa.
 *
 * Bốn tab: Mẫu (bố cục slide có sẵn, thêm thành slide mới), Thành phần (hình
 * khối và đồ hoạ vector, chia nhóm theo chủ đề), Icon (biểu tượng đơn sắc, chia
 * nhóm) và Tải lên (ảnh của giáo viên). Ô tìm kiếm ở Thành phần và Icon lọc theo tên.
 */
import { memo, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, LayoutTemplate, Shapes, Smile, Upload, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { SLIDE_LAYOUTS, type SlideLayoutId } from '@/lib/slideLayouts'
import { SLIDE_ASSET_IDS, SLIDE_ASSETS } from '@/lib/slideAssets'
import { ICON_LIBRARY } from '@/lib/slideIconLibrary'
import { GRAPHIC_CATEGORY_LABEL, SLIDE_GRAPHICS, graphicById, graphicMarkup, searchGraphics, type GraphicCategory } from '@/lib/slideGraphics'
import { PRESET_GROUPS, defaultBox, shapeNameOf } from '@/lib/slidePresets'
import { uid } from '@/data/docTypes'
import { uploadImage } from '@/lib/mediaStore'
import { useUploads } from '@/store/uploads'
import type { SlideElement } from '@/store/docs'
import { ShapeGallery, ShapePreview } from './ShapeGallery'

type PanelId = 'templates' | 'elements' | 'icons' | 'uploads'

const PANELS: Array<{ id: PanelId; label: string; title: string; Icon: typeof Shapes }> = [
  { id: 'templates', label: 'Mẫu', title: 'Mẫu slide', Icon: LayoutTemplate },
  { id: 'elements', label: 'Thành phần', title: 'Thành phần', Icon: Shapes },
  { id: 'icons', label: 'Icon', title: 'Icon', Icon: Smile },
  { id: 'uploads', label: 'Tải lên', title: 'Tải ảnh lên', Icon: Upload },
]

/** ảnh tải lên lớn hơn mức này thì thu nhỏ trước khi đưa vào slide (đỡ nặng bài giảng) */
const MAX_IMAGE_SIDE = 1600
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

interface SlideSidePanelProps {
  accent: string
  /** có slide để chèn vào không (deck HTML hoặc chưa có slide thì tắt chèn) */
  canInsert: boolean
  /** chữ của bài giảng và slide đang mở, để gợi ý đồ hoạ */
  hint?: string
  onAddLayoutSlide: (layoutId: SlideLayoutId) => void
  onInsert: (el: SlideElement) => void
}

function SlideSidePanelImpl({ accent, canInsert, hint = '', onAddLayoutSlide, onInsert }: SlideSidePanelProps) {
  const [active, setActive] = useState<PanelId | null>(null)
  // panel cuối cùng đã mở: giữ nội dung trong lúc trượt đóng (và giữ vị trí cuộn khi mở lại)
  const [last, setLast] = useState<PanelId | null>(null)
  const shown = active ?? last
  const current = PANELS.find((p) => p.id === shown) ?? null

  return (
    <div className="relative flex min-h-0 shrink-0">
      <nav aria-label="Thư viện slide" className="flex w-[64px] flex-col items-center gap-1 border-r border-line bg-surface py-2">
        {PANELS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setActive((cur) => (cur === id ? null : id))
              setLast(id)
            }}
            aria-pressed={active === id}
            className={cn(
              'flex w-[56px] flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-medium transition-colors',
              active === id ? 'bg-paper-2 text-clay' : 'text-ink-3 hover:bg-paper-2 hover:text-ink',
            )}
          >
            <Icon className="size-[18px]" strokeWidth={1.7} />
            {label}
          </button>
        ))}
      </nav>

      {/* nút thu panel kiểu Canva: viên thuốc bám mép phải panel, đi theo khi panel trượt */}
      <button
        type="button"
        aria-label="Đóng panel"
        title="Đóng panel"
        tabIndex={active ? 0 : -1}
        onClick={() => setActive(null)}
        className="absolute top-1/2 z-30 flex h-12 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink-2 shadow-sm transition-[left,opacity] duration-200 ease-out hover:text-clay motion-reduce:transition-none"
        style={{ left: 64 + (active ? 280 : 0), opacity: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none' }}
      >
        <ChevronLeft className="size-4" />
      </button>
      {/* khung ngoài đổi bề rộng để panel trượt ra/vào; khung trong giữ nguyên 280px nên nội dung không bị bóp */}
      <div
        className="min-h-0 overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none"
        style={{ width: active ? 280 : 0 }}
        inert={!active}
      >
      {current && (
        <aside className="flex h-full w-[280px] min-h-0 flex-col border-r border-line bg-surface" aria-label={current.title}>
          {!canInsert && (
            <p className="px-3 pt-2 text-[12px] text-ink-3">Mở một slide để thêm nội dung vào đó.</p>
          )}
          {/* ô tìm kiếm nằm ngoài vùng cuộn (kiểu Canva): thanh cuộn chỉ chạy qua phần nội dung bên dưới */}
          <div className="flex min-h-0 flex-1 flex-col">
            {shown === 'templates' && <Scroll><div className="pt-3"><TemplatesPanel onPick={onAddLayoutSlide} /></div></Scroll>}
            {shown === 'elements' && <ElementsPanel accent={accent} canInsert={canInsert} hint={hint} onInsert={onInsert} />}
            {shown === 'icons' && <IconsPanel canInsert={canInsert} onInsert={onInsert} />}
            {shown === 'uploads' && <Scroll><div className="pt-3"><UploadsPanel canInsert={canInsert} onInsert={onInsert} /></div></Scroll>}
          </div>
        </aside>
      )}
      </div>
    </div>
  )
}

export const SlideSidePanel = memo(SlideSidePanelImpl)

function Scroll({ children }: { children: React.ReactNode }) {
  return <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">{children}</div>
}

/** bỏ dấu tiếng Việt để tìm bằng chuỗi không dấu */
const norm = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-[14px] shadow-sm outline-none focus:border-clay"
    />
  )
}

/** nhóm có tiêu đề, hiện hết (không gập) để nhìn toàn bộ thư viện */
function Section({ id, title, children }: { id?: string; title?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-3">
      {title && <h4 className="mb-1.5 px-1 text-[12px] font-semibold text-ink-3">{title}</h4>}
      {children}
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Mẫu: 22 bố cục có sẵn, bấm để thêm một slide mới theo bố cục đó
 * ------------------------------------------------------------------ */
function TemplatesPanel({ onPick }: { onPick: (id: SlideLayoutId) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SLIDE_LAYOUTS.map((layout) => (
        <button
          key={layout.id}
          type="button"
          title={layout.description}
          onClick={() => onPick(layout.id)}
          className="slide-layout-card"
        >
          <span className={cn('slide-layout-thumb', `slide-layout-thumb--${layout.id}`)} aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <small>{layout.name}</small>
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Thành phần: hình khối (theo nhóm) và đồ hoạ vector (theo chủ đề)
 * ------------------------------------------------------------------ */
const GRAPHIC_CATEGORIES = (Object.keys(GRAPHIC_CATEGORY_LABEL) as GraphicCategory[]).filter((c) => c !== 'ornament')

/** 24 nhóm đồ hoạ gộp thành vài nhóm lớn để lọc nhanh (kiểu Canva); 'shapes' là thư viện hình khối */
type GroupId = 'all' | 'subject' | 'class' | 'sym' | 'frame' | 'shapes'
const GROUPS: Array<{ id: GroupId; label: string; cats: GraphicCategory[] }> = [
  { id: 'all', label: 'Tất cả', cats: [] },
  { id: 'subject', label: 'Môn học', cats: ['math', 'sci', 'lang', 'lit', 'eng', 'cs', 'prog', 'bio', 'chem', 'phys', 'soc', 'his', 'geo', 'art', 'pe', 'nat'] },
  { id: 'class', label: 'Lớp học', cats: ['class', 'people', 'reward', 'life'] },
  { id: 'sym', label: 'Ký hiệu', cats: ['sym', 'arrow'] },
  { id: 'frame', label: 'Khung & trang trí', cats: ['frame', 'decor', 'misc'] },
  { id: 'shapes', label: 'Hình khối', cats: [] },
]

const PREVIEW_COUNT = 4
/** hình quen thuộc nhất, hiện ở hàng xem trước */
const PREVIEW_SHAPES = ['line', 'rect', 'roundRect', 'ellipse', 'triangle', 'rightArrow']
const RECENT_KEY = 'slide-recent-graphics'
const RECENT_MAX = 8

const loadRecent = (): string[] => {
  try {
    const ids = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string' && graphicById(id)) : []
  } catch {
    return []
  }
}

/** đầu mỗi hàng xem trước: tên nhóm + "Xem tất cả" */
function RowHead({ title, onMore }: { title: string; onMore?: () => void }) {
  return (
    <div className="mb-1 flex items-center justify-between px-1">
      <h4 className="text-[12px] font-semibold text-ink-3">{title}</h4>
      {onMore && (
        <button type="button" onClick={onMore} className="flex items-center text-[12px] text-ink-3 hover:text-clay">
          Xem tất cả <ChevronRight className="size-3.5" />
        </button>
      )}
    </div>
  )
}

function ElementsPanel({ accent, canInsert, hint, onInsert }: { accent: string; canInsert: boolean; hint: string; onInsert: (el: SlideElement) => void }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<GroupId>('all')
  /** đang xem trang con của một nhóm đồ hoạ ('shapes' = toàn bộ hình khối) */
  const [open, setOpen] = useState<GraphicCategory | 'shapes' | null>(null)
  const [recent, setRecent] = useState(loadRecent)
  const q = query.trim()
  const hits = q ? searchGraphics(q, 200) : []
  // gợi ý theo tiêu đề bài giảng và chữ trên slide đang mở
  const suggested = hint.trim() ? searchGraphics(hint, PREVIEW_COUNT) : []

  const pickShape = (prst: string) => {
    if (!canInsert) return
    if (prst.startsWith('line')) {
      const lineArrow = prst === 'line' ? 'none' : prst === 'lineArrow' ? 'end' : 'both'
      onInsert({ id: uid(), type: 'shape', shape: 'line', x: 20, y: 47.5, w: 60, h: 5, fill: accent, border: 4, lineArrow })
      return
    }
    const box = defaultBox(prst)
    onInsert({ id: uid(), type: 'shape', shape: shapeNameOf(prst), x: (100 - box.w) / 2, y: (100 - box.h) / 2, ...box, fill: accent })
  }

  const insertGraphic = (graphicId: string) => {
    if (!canInsert) return
    onInsert({ id: uid(), type: 'graphic', graphicId, x: 38, y: 28, w: 20, h: 35.6 })
    const next = [graphicId, ...recent.filter((id) => id !== graphicId)].slice(0, RECENT_MAX)
    setRecent(next)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {
      /* bỏ qua: chỉ là tiện ích "dùng gần đây" */
    }
  }

  const items = (cat: GraphicCategory) => SLIDE_GRAPHICS.filter((g) => g.category === cat)
  const recentItems = recent.map((id) => graphicById(id)).filter((g): g is NonNullable<typeof g> => Boolean(g))

  const header = (
    <div className="shrink-0 border-b border-line bg-surface px-3 pb-2.5 pt-3">
      <SearchBox value={query} onChange={setQuery} placeholder="Tìm hình khối hoặc đồ hoạ" />
      {!q && !open && (
        <div className="mt-2 flex flex-wrap gap-1">
          {GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={group === g.id}
              onClick={() => setGroup(g.id)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[12px]',
                group === g.id ? 'border-clay bg-paper-2 text-clay' : 'border-line text-ink-2 hover:border-clay hover:text-clay',
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // kết quả tìm kiếm: đồ hoạ gom theo nhóm, kèm số lượng
  if (q) {
    const byCat = GRAPHIC_CATEGORIES.map((c) => ({ c, list: hits.filter((g) => g.category === c) })).filter((x) => x.list.length > 0)
    return (
      <>
        {header}
        <Scroll>
          <div className="pt-3">
            <Section title="Hình khối">
              <ShapeGallery onPick={pickShape} query={q} scroll={false} />
            </Section>
            {byCat.map(({ c, list }) => (
              <Section key={c} title={`${GRAPHIC_CATEGORY_LABEL[c]} (${list.length})`}>
                <GraphicGrid items={list} onPick={insertGraphic} />
              </Section>
            ))}
            {byCat.length === 0 && <p className="text-[12px] text-ink-3">Không có đồ hoạ nào khớp.</p>}
          </div>
        </Scroll>
      </>
    )
  }

  // trang con: toàn bộ một nhóm, có nút quay lại
  if (open) {
    return (
      <>
        <div className="flex shrink-0 items-center gap-1 border-b border-line bg-surface px-2 py-2.5">
          <button type="button" onClick={() => setOpen(null)} aria-label="Quay lại" className="rounded-md p-1 text-ink-2 hover:bg-paper-2 hover:text-clay">
            <ChevronLeft className="size-5" />
          </button>
          <h3 className="text-[14px] font-semibold text-ink">{open === 'shapes' ? 'Hình khối' : GRAPHIC_CATEGORY_LABEL[open]}</h3>
        </div>
        <Scroll>
          <div className="pt-3">
            {open === 'shapes' ? <ShapeGallery onPick={pickShape} scroll={false} /> : <GraphicGrid items={items(open)} onPick={insertGraphic} />}
          </div>
        </Scroll>
      </>
    )
  }

  const cats = group === 'all' ? GRAPHIC_CATEGORIES : GROUPS.find((g) => g.id === group)?.cats ?? []
  const shapePreview = PRESET_GROUPS.flatMap((g) => g.shapes).filter((s) => PREVIEW_SHAPES.includes(s.prst))

  return (
    <>
      {header}
      <Scroll>
      <div className="pt-3">
        {group === 'all' && recentItems.length > 0 && (
          <Section>
            <RowHead title="Dùng gần đây" />
            <GraphicGrid items={recentItems.slice(0, PREVIEW_COUNT * 2)} onPick={insertGraphic} />
          </Section>
        )}
        {group === 'all' && suggested.length > 0 && (
          <Section>
            <RowHead title="Gợi ý cho slide này" />
            <GraphicGrid items={suggested} onPick={insertGraphic} />
          </Section>
        )}
        {(group === 'all' || group === 'shapes') && (
          <Section>
            <RowHead title="Hình khối" onMore={() => setOpen('shapes')} />
            <div className="flex flex-wrap gap-1" onMouseDown={(e) => e.preventDefault()}>
              {shapePreview.map((s) => (
                <button
                  key={s.prst}
                  type="button"
                  title={s.label}
                  aria-label={s.label}
                  onClick={() => pickShape(s.prst)}
                  className="flex size-[40px] items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-paper-2 hover:text-clay"
                >
                  <ShapePreview prst={s.prst} />
                </button>
              ))}
            </div>
          </Section>
        )}
        {cats.map((cat) => {
          const list = items(cat)
          if (list.length === 0) return null
          return (
            <Section key={cat}>
              <RowHead title={GRAPHIC_CATEGORY_LABEL[cat]} onMore={() => setOpen(cat)} />
              <GraphicGrid items={list.slice(0, PREVIEW_COUNT)} onPick={insertGraphic} />
            </Section>
          )
        })}
      </div>
      </Scroll>
    </>
  )
}

/** SVG đồ hoạ mặc định hay được vẽ lại: nhớ chuỗi đã dựng thay vì replace trên SVG vài KB mỗi lần */
const markupCache = new Map<string, string>()
const cachedMarkup = (id: string) => {
  let m = markupCache.get(id)
  if (m === undefined) markupCache.set(id, (m = graphicMarkup(id)))
  return m
}

function GraphicGrid({ items, onPick }: { items: Array<{ id: string; name: string }>; onPick: (id: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {items.map((g) => (
        <button
          key={g.id}
          type="button"
          title={g.name}
          aria-label={g.name}
          onClick={() => onPick(g.id)}
          className="flex aspect-square items-center justify-center rounded-md p-1.5 text-ink-2 transition-colors hover:bg-paper-2 hover:text-clay"
        >
          {/* SVG lấy từ registry đồ hoạ của dự án (không phải nội dung người dùng) */}
          <span className="size-full [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: cachedMarkup(g.id) }} />
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Icon: biểu tượng đơn sắc, chia nhóm theo môn/chủ đề, tìm theo tên và từ khoá
 * ------------------------------------------------------------------ */
function IconsPanel({ canInsert, onInsert }: { canInsert: boolean; onInsert: (el: SlideElement) => void }) {
  const [query, setQuery] = useState('')
  const q = norm(query.trim())

  // bộ 27 icon AI/layout dùng đứng trước, rồi tới thư viện mở rộng
  const all = useMemo(
    () => [
      ...SLIDE_ASSET_IDS.map((id) => ({ id: id as string, ...SLIDE_ASSETS[id] })),
      ...ICON_LIBRARY,
    ],
    [],
  )
  const matches = (i: (typeof all)[number]) => !q || norm([i.id, i.group, ...i.tags].join(' ')).includes(q)
  const hits = all.filter(matches)
  const groups = Array.from(new Set(hits.map((i) => i.group)))

  const insert = (assetId: string) => {
    if (!canInsert) return
    onInsert({ id: uid(), type: 'icon', assetId, x: 44, y: 36, w: 12, h: 21.3 })
  }

  return (
    <>
      <div className="shrink-0 border-b border-line bg-surface px-3 pb-2.5 pt-3">
        <SearchBox value={query} onChange={setQuery} placeholder="Tìm icon, ví dụ: sách, hoá, xe, hoa" />
      </div>
      <Scroll>
        <div className="pt-3">
          {groups.map((group) => (
            <Section key={group} title={group}>
              <div className="grid grid-cols-4 gap-1.5">
                {hits
                  .filter((i) => i.group === group)
                  .map(({ id, icon: Icon, tags }) => (
                    <button
                      key={id}
                      type="button"
                      title={tags[0]}
                      aria-label={tags[0]}
                      onClick={() => insert(id)}
                      className="flex aspect-square items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-paper-2 hover:text-clay"
                    >
                      <Icon size={24} weight="duotone" />
                    </button>
                  ))}
              </div>
            </Section>
          ))}
          {q && hits.length === 0 && <p className="text-[12px] text-ink-3">Không có icon nào khớp.</p>}
        </div>
      </Scroll>
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Tải lên: PNG/JPG/WebP. Ảnh được đẩy lên R2, danh sách giữ theo tài khoản để chèn lại ở máy nào cũng được.
 * ------------------------------------------------------------------ */
interface UploadedImage {
  src: string
  /** tỉ lệ cao/rộng của ảnh gốc, để giữ đúng dáng khi chèn */
  ratio: number
}

function UploadsPanel({ canInsert, onInsert }: { canInsert: boolean; onInsert: (el: SlideElement) => void }) {
  const images = useUploads((s) => s.items)
  const addUpload = useUploads((s) => s.add)
  const removeUpload = useUploads((s) => s.remove)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const insert = (img: UploadedImage) => {
    const w = 40
    onInsert({ id: uid(), type: 'image', src: img.src, x: (100 - w) / 2, y: 26, w, h: Math.min(60, w * img.ratio * (16 / 9)) })
  }

  const onFile = async (file: File) => {
    setError(null)
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setError('Chỉ nhận ảnh PNG, JPG hoặc WebP.')
    if (file.size > MAX_UPLOAD_BYTES) return setError('Ảnh quá 8 MB. Hãy thu nhỏ trước khi tải lên.')
    setBusy(true)
    try {
      const img = await readImage(file)
      let src = img.src
      try {
        src = await uploadImage(img.src)
        addUpload({ id: uid(), src, ratio: img.ratio })
      } catch {
        // không đẩy lên được (mất mạng…): vẫn chèn vào slide, ảnh sẽ được chuyển lên R2 khi đồng bộ
        setError('Chưa lưu được ảnh vào tài khoản, ảnh vẫn được chèn vào slide.')
      }
      insert({ src, ratio: img.ratio })
    } catch {
      setError('Không đọc được ảnh này.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <label
        className={cn(
          'flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-line-2 px-3 py-5 text-center text-[12.5px] text-ink-3 transition-colors hover:border-clay hover:text-clay',
          (!canInsert || busy) && 'pointer-events-none opacity-50',
        )}
      >
        <Upload className="size-5" strokeWidth={1.6} />
        {busy ? 'Đang xử lý ảnh…' : 'Chọn ảnh từ máy để thêm vào slide'}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void onFile(file)
          }}
        />
      </label>
      {error && <p role="alert" className="mt-2 text-[12px] text-clay">{error}</p>}

      {images.length > 0 && (
        <>
          <h4 className="mb-1.5 mt-4 text-[11.5px] font-semibold text-ink-3">Ảnh của bạn</h4>
          <div className="grid grid-cols-2 gap-2">
            {images.map((img) => (
              <div key={img.id} className="group relative">
                <button
                  type="button"
                  disabled={!canInsert}
                  onClick={() => insert(img)}
                  title="Chèn vào slide"
                  className="block w-full overflow-hidden rounded-md border border-line bg-white p-1 transition-colors hover:border-clay disabled:opacity-40"
                >
                  <img src={img.src} alt="" loading="lazy" className="aspect-video w-full object-contain" />
                </button>
                <button
                  type="button"
                  onClick={() => removeUpload(img.id)}
                  title="Xoá khỏi danh sách (slide đã chèn không đổi)"
                  aria-label="Xoá ảnh khỏi danh sách"
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-white/90 text-ink-3 opacity-0 shadow-soft transition-opacity hover:text-clay focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Đọc ảnh thành data URL; ảnh quá lớn được thu nhỏ xuống MAX_IMAGE_SIDE. */
async function readImage(file: File): Promise<UploadedImage> {
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('decode'))
    el.src = url
  })
  const { naturalWidth: nw, naturalHeight: nh } = img
  const ratio = nh / nw
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(nw, nh))
  if (scale === 1) return { src: url, ratio }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(nw * scale)
  canvas.height = Math.round(nh * scale)
  canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
  // PNG giữ độ trong suốt; ảnh khác xuất JPEG cho nhẹ
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  return { src: canvas.toDataURL(type, 0.9), ratio }
}
