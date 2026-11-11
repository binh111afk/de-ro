/**
 * Admin giai đoạn 4: Ngân hàng câu hỏi. Xem docs/prompt-admin-bank.md.
 * Quản lý kho câu hỏi: Gốc / Đã sửa / Câu mới / Đã ẩn.
 * Bộ lọc đa chiều, khối đếm môn × độ khó, xem trước dạng drawer, form thêm/sửa câu.
 */
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import { Badge, Button, Card, EmptyState, Spinner, inputClass } from '@/components/ui'
import { Pager, usePaged } from '@/components/Pager'
import { SiteSelect, type SiteSelectOption } from '@/components/SiteSelect'
import { MathText } from '@/components/MathText'
import { Portal } from '@/components/Portal'
import { QuestionImageField } from '@/components/QuestionImageField'
import { imageToSrc } from '@/lib/questionImage'
import type { QuestionImage } from '@/data/types'
import { dialog } from '@/components/Dialog'
import type { AdminMe } from '@/lib/adminApi'
import {
  hideBankQuestion,
  listBankOverrides,
  revertBankQuestion,
  saveBankQuestion,
  unhideBankQuestion,
  type AdminBankItem,
  type BankItemOrigin,
  type BankQuestionRow,
} from '@/lib/adminBankApi'
import { BANK, loadStaticBank, type BankEntry } from '@/data/bank'
import { LEVEL_LABEL, levelOf } from '@/data/bankLevel'
import { GRADES, SUBJECTS, TYPE_LABEL, type Option, type QuestionType, type Subject } from '@/data/types'
import { formatViDateTime } from './adminUtils'
import { figureDoc, figureImageAttrs } from '@/examEditor/toolImages'
import { cn } from '@/lib/cn'
import { useDrawerExit } from './useDrawerExit'
import { Segmented } from '@/components/Segmented'
import { BankAiPanel } from './BankAiPanel'
import type { BankDraft } from '@/lib/bankImport'

const figureCache = new Map<string, { src: string; alt: string } | null>()
function figureOf(entry: BankEntry) {
  if (entry.image?.src) return { src: entry.image.src, alt: entry.image.alt ?? '' }
  if (!entry.figure) return null
  if (!figureCache.has(entry.id)) {
    const doc = figureDoc(entry.figure)
    figureCache.set(entry.id, doc ? figureImageAttrs(doc) : null)
  }
  return figureCache.get(entry.id) ?? null
}

const ORIGIN_LABEL: Record<BankItemOrigin, string> = {
  goc: 'Gốc',
  'da-sua': 'Đã sửa',
  'cau-moi': 'Câu mới',
  'da-an': 'Đã ẩn',
}

const ORIGIN_TONE: Record<BankItemOrigin, 'neutral' | 'honey' | 'sage' | 'clay'> = {
  goc: 'neutral',
  'da-sua': 'honey',
  'cau-moi': 'sage',
  'da-an': 'clay',
}

const SUBJECT_SELECT_OPTIONS: ReadonlyArray<SiteSelectOption<string>> = [
  { value: '', label: 'Tất cả môn' },
  ...SUBJECTS.map((s) => ({ value: s, label: s })),
]

const GRADE_SELECT_OPTIONS: ReadonlyArray<SiteSelectOption<string>> = [
  { value: '', label: 'Tất cả lớp' },
  ...GRADES.map((g) => ({ value: g, label: g })),
]

const LEVEL_SELECT_OPTIONS: ReadonlyArray<SiteSelectOption<string>> = [
  { value: '', label: 'Tất cả mức độ' },
  { value: 'de', label: 'Dễ' },
  { value: 'tb', label: 'Trung bình' },
  { value: 'kho', label: 'Khó' },
]

const TYPE_SELECT_OPTIONS: ReadonlyArray<SiteSelectOption<string>> = [
  { value: '', label: 'Tất cả dạng câu' },
  ...(Object.keys(TYPE_LABEL) as QuestionType[]).map((k) => ({ value: k, label: TYPE_LABEL[k] })),
]

const ORIGIN_SELECT_OPTIONS: ReadonlyArray<SiteSelectOption<string>> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'goc', label: 'Gốc' },
  { value: 'da-sua', label: 'Đã sửa' },
  { value: 'cau-moi', label: 'Câu mới' },
  { value: 'da-an', label: 'Đã ẩn' },
]

export function BankPanel({ me: _me }: { me: AdminMe }) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<AdminBankItem[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [originFilter, setOriginFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')

  // Drawer xem chi tiết
  const [activeItem, setActiveItem] = useState<AdminBankItem | null>(null)
  // Form thêm / sửa
  const [editingItem, setEditingItem] = useState<AdminBankItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  // Khối đếm môn × mức
  const [showMatrix, setShowMatrix] = useState(true)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  // Tải dữ liệu kết hợp: file tĩnh + overrides từ Supabase
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [staticBank, overrides] = await Promise.all([
        loadStaticBank().catch(() => BANK),
        listBankOverrides().catch((err) => {
          console.warn('Lỗi lấy overrides máy chủ:', err)
          return [] as BankQuestionRow[]
        }),
      ])

      const overrideMap = new Map<string, BankQuestionRow>()
      for (const o of overrides) {
        overrideMap.set(o.id, o)
      }

      const mergedList: AdminBankItem[] = []
      const processedIds = new Set<string>()

      // 1. Duyệt các câu tĩnh
      for (const staticItem of staticBank) {
        const o = overrideMap.get(staticItem.id)
        if (o) {
          if (o.status === 'hidden') {
            mergedList.push({
              entry: o.data?.prompt ? o.data : staticItem,
              origin: 'da-an',
              updatedAt: o.updated_at,
              updatedBy: o.updated_by,
            })
          } else {
            mergedList.push({
              entry: o.data,
              origin: 'da-sua',
              updatedAt: o.updated_at,
              updatedBy: o.updated_by,
            })
          }
        } else {
          mergedList.push({
            entry: staticItem,
            origin: 'goc',
          })
        }
        processedIds.add(staticItem.id)
      }

      // 2. Thêm các câu mới từ overrides (không có trong staticBank)
      for (const o of overrides) {
        if (!processedIds.has(o.id)) {
          mergedList.push({
            entry: o.data,
            origin: o.status === 'hidden' ? 'da-an' : 'cau-moi',
            updatedAt: o.updated_at,
            updatedBy: o.updated_by,
          })
          processedIds.add(o.id)
        }
      }

      setItems(mergedList)
      // Cập nhật lại activeItem nếu đang mở
      if (activeItem) {
        const fresh = mergedList.find((i) => i.entry.id === activeItem.entry.id)
        if (fresh) setActiveItem(fresh)
      }
    } catch (err) {
      console.error('Lỗi nạp ngân hàng câu hỏi:', err)
      void dialog.alert('Không thể tải ngân hàng câu hỏi.', { title: 'Lỗi' })
    } finally {
      setLoading(false)
    }
  }, [activeItem])

  useEffect(() => {
    void loadData()
  }, [])

  // Danh sách tags có sẵn để gợi ý / lọc
  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const item of items) {
      if (subjectFilter && item.entry.subject !== subjectFilter) continue
      for (const t of item.entry.tags || []) {
        if (t.trim()) set.add(t.trim())
      }
    }
    return Array.from(set).sort()
  }, [items, subjectFilter])

  // Lọc danh sách câu hỏi
  const filteredItems = useMemo(() => {
    const qLower = debouncedSearch.toLowerCase()
    return items.filter((item) => {
      const e = item.entry
      if (originFilter && item.origin !== originFilter) return false
      if (subjectFilter && e.subject !== subjectFilter) return false
      if (gradeFilter && !e.grades.includes(gradeFilter) && !e.grades.includes('all')) return false
      if (levelFilter && levelOf(e) !== levelFilter) return false
      if (typeFilter && e.type !== typeFilter) return false
      if (tagFilter && !(e.tags || []).some((t) => t.toLowerCase() === tagFilter.toLowerCase())) return false

      if (qLower) {
        const inId = e.id.toLowerCase().includes(qLower)
        const inPrompt = (e.prompt || '').toLowerCase().includes(qLower)
        const inExplanation = (e.explanation || '').toLowerCase().includes(qLower)
        const inTags = (e.tags || []).some((t) => t.toLowerCase().includes(qLower))
        if (!inId && !inPrompt && !inExplanation && !inTags) return false
      }
      return true
    })
  }, [items, originFilter, subjectFilter, gradeFilter, levelFilter, typeFilter, tagFilter, debouncedSearch])

  // Thống kê môn × độ khó (chỉ tính câu đang hoạt động: origin !== 'da-an')
  const matrixStats = useMemo(() => {
    const stats: Record<string, { de: number; tb: number; kho: number; total: number }> = {}
    for (const sub of SUBJECTS) {
      stats[sub] = { de: 0, tb: 0, kho: 0, total: 0 }
    }
    for (const item of items) {
      if (item.origin === 'da-an') continue
      const sub = item.entry.subject
      if (!stats[sub]) {
        stats[sub] = { de: 0, tb: 0, kho: 0, total: 0 }
      }
      const lvl = levelOf(item.entry)
      stats[sub][lvl]++
      stats[sub].total++
    }
    return stats
  }, [items])

  // Phân trang 30 câu / trang
  const filterResetKey = `${debouncedSearch}|${subjectFilter}|${gradeFilter}|${levelFilter}|${typeFilter}|${originFilter}|${tagFilter}`
  const { items: pageItems, page, pages, go } = usePaged(filteredItems, 30, filterResetKey)

  // Thao tác Ẩn
  const handleHide = async (item: AdminBankItem) => {
    const ok = await dialog.confirm(`Ẩn câu hỏi "${item.entry.id}" khỏi kho dùng chung?`, {
      title: 'Ẩn câu hỏi',
      danger: true,
      confirmLabel: 'Ẩn câu',
    })
    if (!ok) return
    try {
      await hideBankQuestion(item.entry.id, item.entry)
      void loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi ẩn câu hỏi'
      void dialog.alert(msg, { title: 'Lỗi' })
    }
  }

  // Thao tác Hiện lại
  const handleUnhide = async (item: AdminBankItem) => {
    try {
      await unhideBankQuestion(item.entry.id)
      void loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi hiện lại câu hỏi'
      void dialog.alert(msg, { title: 'Lỗi' })
    }
  }

  // Thao tác Về bản gốc / Xoá câu mới
  const handleRevert = async (item: AdminBankItem) => {
    const isNew = item.origin === 'cau-moi'
    const ok = await dialog.confirm(
      isNew
        ? `Xoá vĩnh viễn câu hỏi mới "${item.entry.id}"? Thao tác không thể hoàn tác.`
        : `Huỷ bỏ toàn bộ chỉnh sửa/trạng thái ẩn của câu "${item.entry.id}" để trở về nguyên bản trong file tĩnh?`,
      {
        title: isNew ? 'Xoá câu hỏi' : 'Trở về bản gốc',
        danger: true,
        confirmLabel: isNew ? 'Xoá vĩnh viễn' : 'Về bản gốc',
      },
    )
    if (!ok) return
    try {
      await revertBankQuestion(item.entry.id)
      setActiveItem(null)
      void loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi khôi phục câu hỏi'
      void dialog.alert(msg, { title: 'Lỗi' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề & nút thêm */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink">Ngân hàng câu hỏi</h1>
          <p className="text-[13.5px] text-ink-3">
            Kho câu hỏi tích hợp sẵn và lưu chỉnh sửa từ máy chủ. Tổng {items.length.toLocaleString('vi-VN')} câu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMatrix((v) => !v)}
            title="Bật/tắt ma trận câu theo môn"
          >
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline">Ma trận môn</span>
          </Button>
          <Button
            variant="clay"
            size="sm"
            onClick={() => {
              setEditingItem(null)
              setIsCreating(true)
            }}
          >
            <Plus className="size-4" />
            <span>Thêm câu mới</span>
          </Button>
        </div>
      </div>

      {/* Khối đếm môn × độ khó */}
      {showMatrix && (
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-ink-3" />
              <h2 className="text-[14px] font-bold text-ink">Số câu theo môn & độ khó</h2>
              <span className="text-[12px] text-ink-4">(câu đang sử dụng)</span>
            </div>
            <span className="text-[12px] text-ink-4">Bấm vào môn để lọc nhanh</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-ink-3">
                  <th className="pb-2 font-medium">Môn học</th>
                  <th className="pb-2 text-center font-medium">Dễ</th>
                  <th className="pb-2 text-center font-medium">Trung bình</th>
                  <th className="pb-2 text-center font-medium">Khó</th>
                  <th className="pb-2 text-right font-medium">Tổng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {SUBJECTS.map((sub) => {
                  const s = matrixStats[sub] || { de: 0, tb: 0, kho: 0, total: 0 }
                  const isSelected = subjectFilter === sub
                  const isLow = s.total < 10
                  return (
                    <tr
                      key={sub}
                      onClick={() => setSubjectFilter((cur) => (cur === sub ? '' : sub))}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-paper-2',
                        isSelected && 'bg-clay/10 font-semibold text-clay',
                      )}
                    >
                      <td className="py-2 font-medium">
                        <span className="flex items-center gap-1.5">
                          {sub}
                          {isLow && <span className="size-1.5 rounded-full bg-amber-500" title="Ít hơn 10 câu" />}
                        </span>
                      </td>
                      <td className="py-2 text-center tnum text-ink-2">{s.de}</td>
                      <td className="py-2 text-center tnum text-ink-2">{s.tb}</td>
                      <td className="py-2 text-center tnum text-ink-2">{s.kho}</td>
                      <td className="py-2 text-right font-semibold tnum text-ink">{s.total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Thanh lọc đa chiều */}
      <Card className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã câu, nội dung đề bài, giải thích hoặc tag..."
              className={cn(inputClass, 'pl-9 text-[13.5px]')}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink"
                aria-label="Xoá tìm kiếm"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Nút xoá nhanh bộ lọc */}
          {(subjectFilter || gradeFilter || levelFilter || typeFilter || originFilter || tagFilter || search) && (
            <Button
              variant="quiet"
              size="sm"
              onClick={() => {
                setSearch('')
                setSubjectFilter('')
                setGradeFilter('')
                setLevelFilter('')
                setTypeFilter('')
                setOriginFilter('')
                setTagFilter('')
              }}
              className="text-clay shrink-0"
            >
              <RotateCcw className="size-3.5" />
              <span>Đặt lại bộ lọc</span>
            </Button>
          )}
        </div>

        {/* Các select lọc */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          <SiteSelect
            label="Môn học"
            value={subjectFilter}
            options={SUBJECT_SELECT_OPTIONS}
            onChange={setSubjectFilter}
          />
          <SiteSelect
            label="Khối lớp"
            value={gradeFilter}
            options={GRADE_SELECT_OPTIONS}
            onChange={setGradeFilter}
          />
          <SiteSelect
            label="Độ khó"
            value={levelFilter}
            options={LEVEL_SELECT_OPTIONS}
            onChange={setLevelFilter}
          />
          <SiteSelect
            label="Dạng câu"
            value={typeFilter}
            options={TYPE_SELECT_OPTIONS}
            onChange={setTypeFilter}
          />
          <SiteSelect
            label="Trạng thái"
            value={originFilter}
            options={ORIGIN_SELECT_OPTIONS}
            onChange={setOriginFilter}
          />
        </div>

        {/* Lọc theo tag nếu có */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[12px] font-medium text-ink-4 flex items-center gap-1">
              <Filter className="size-3" /> Chủ đề:
            </span>
            {allTags.slice(0, 10).map((t) => {
              const active = tagFilter === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTagFilter((cur) => (cur === t ? '' : t))}
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[11.5px] transition-colors',
                    active ? 'bg-ink font-semibold text-white' : 'bg-sunken text-ink-2 hover:bg-veil',
                  )}
                >
                  {t}
                </button>
              )
            })}
            {tagFilter && !allTags.slice(0, 10).includes(tagFilter) && (
              <button
                type="button"
                onClick={() => setTagFilter('')}
                className="rounded-full bg-ink px-2.5 py-0.5 text-[11.5px] font-semibold text-white"
              >
                {tagFilter} <X className="ml-1 inline size-3" />
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Danh sách câu hỏi */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-8 text-ink-4" />}
          title="Không tìm thấy câu hỏi"
          description="Thử thay đổi từ khoá tìm kiếm hoặc các tiêu chí bộ lọc phía trên."
        />
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          <div className="flex items-center justify-between bg-paper-2 px-4 py-2.5 text-[12.5px] text-ink-3">
            <span>
              Tìm thấy <strong className="text-ink">{filteredItems.length}</strong> câu hỏi
            </span>
            <span>Trang {page} / {pages}</span>
          </div>

          <div className="divide-y divide-line/70">
            {pageItems.map((item) => {
              const e = item.entry
              const lvl = levelOf(e)
              const figure = figureOf(e)
              const isHidden = item.origin === 'da-an'

              return (
                <div
                  key={e.id}
                  onClick={() => setActiveItem(item)}
                  className={cn(
                    'group flex cursor-pointer flex-col gap-2 p-4 transition-colors hover:bg-paper-2/80 sm:flex-row sm:items-start sm:gap-4',
                    isHidden && 'bg-sunken/40 opacity-75',
                  )}
                >
                  {/* Cột trái: Badges & ID */}
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:w-44 sm:flex-col sm:items-start">
                    <div className="flex items-center gap-1.5">
                      <Badge tone={ORIGIN_TONE[item.origin]}>{ORIGIN_LABEL[item.origin]}</Badge>
                      <Badge tone="neutral">{e.subject}</Badge>
                    </div>
                    <span className="font-mono text-[11px] text-ink-4 truncate max-w-[170px]" title={e.id}>
                      {e.id}
                    </span>
                    <div className="flex items-center gap-1 text-[11.5px] text-ink-3">
                      <span>{e.grades.join(', ')}</span>
                      <span>·</span>
                      <span className={cn(lvl === 'kho' ? 'text-clay font-medium' : '')}>{LEVEL_LABEL[lvl]}</span>
                    </div>
                  </div>

                  {/* Cột giữa: Đề bài & nội dung trích */}
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-[14px] leading-relaxed text-ink">
                      <MathText as="div">{e.prompt}</MathText>
                    </div>
                    {/* Tags */}
                    {e.tags && e.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {e.tags.map((t) => (
                          <span key={t} className="rounded bg-sunken px-1.5 py-0.5 text-[11px] text-ink-3">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cột phải: Hình vẽ thu nhỏ / điểm & nút xem */}
                  <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                    {figure ? (
                      <div className="size-10 overflow-hidden rounded border border-line-2 bg-white p-0.5">
                        <img src={figure.src} alt="" className="size-full object-contain" />
                      </div>
                    ) : (
                      <Badge tone="outline" className="text-[12px]">
                        {e.points}đ
                      </Badge>
                    )}
                    <ChevronRight className="size-4 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="p-4">
            <Pager page={page} pages={pages} go={go} />
          </div>
        </Card>
      )}

      {/* Drawer xem trước câu hỏi */}
      {activeItem && (
        <QuestionDrawer
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onEdit={() => {
            setEditingItem(activeItem)
            setIsCreating(false)
          }}
          onHide={() => handleHide(activeItem)}
          onUnhide={() => handleUnhide(activeItem)}
          onRevert={() => handleRevert(activeItem)}
        />
      )}

      {/* Modal Form Thêm / Sửa */}
      {(isCreating || editingItem) && (
        <QuestionFormModal
          initialEntry={editingItem?.entry}
          origin={editingItem?.origin}
          onAdded={() => void loadData()}
          onClose={() => {
            setEditingItem(null)
            setIsCreating(false)
          }}
          onSaved={async (savedEntry) => {
            setEditingItem(null)
            setIsCreating(false)
            await loadData()
            // Tìm và mở lại item vừa lưu
            const freshItem: AdminBankItem = {
              entry: savedEntry,
              origin: savedEntry.id.startsWith('db-') ? 'cau-moi' : 'da-sua',
              updatedAt: new Date().toISOString(),
            }
            setActiveItem(freshItem)
          }}
        />
      )}
    </div>
  )
}

/** Drawer xem chi tiết câu hỏi */
function QuestionDrawer({
  item,
  onClose,
  onEdit,
  onHide,
  onUnhide,
  onRevert,
}: {
  item: AdminBankItem
  onClose: () => void
  onEdit: () => void
  onHide: () => void
  onUnhide: () => void
  onRevert: () => void
}) {
  const { close, backdropClass, panelClass } = useDrawerExit(onClose)

  const e = item.entry
  const lvl = levelOf(e)
  const figure = figureOf(e)
  const isHidden = item.origin === 'da-an'
  const isCustomOrEdited = item.origin !== 'goc'

  return (
    <Portal>
      {/* Nền mờ */}
      <div
        className={cn('fixed inset-0 z-40 bg-ink/40 backdrop-blur-xs', backdropClass)}
        onClick={close}
        aria-hidden="true"
      />

      {/* Khung trượt từ phải sang */}
      <aside
        className={cn('fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col border-l border-line bg-surface shadow-2xl sm:w-[560px]', panelClass)}
        role="dialog"
        aria-label="Chi tiết câu hỏi"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <Badge tone={ORIGIN_TONE[item.origin]}>{ORIGIN_LABEL[item.origin]}</Badge>
            <h2 className="font-mono text-[13px] font-semibold text-ink truncate max-w-[280px]" title={e.id}>
              {e.id}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-[6px] p-1.5 text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Nội dung xem trước */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
            <Badge tone="clay">{e.subject}</Badge>
            <Badge tone="outline">{TYPE_LABEL[e.type]}</Badge>
            <Badge tone="neutral">{LEVEL_LABEL[lvl]}</Badge>
            <Badge tone="outline">{e.points}đ</Badge>
            <span className="text-ink-4">Khối: {e.grades.join(', ')}</span>
            {item.updatedAt && (
              <span className="text-[11.5px] text-ink-4 ml-auto">
                Cập nhật: {formatViDateTime(item.updatedAt)}
              </span>
            )}
          </div>

          {/* Đề bài */}
          <div className="rounded-[8px] border border-line-2 bg-paper p-4 text-[15px] leading-relaxed text-ink">
            <MathText as="div">{e.prompt}</MathText>
          </div>

          {/* Hình vẽ nếu có */}
          {figure && (
            <div className="flex justify-center rounded-[8px] border border-line-2 bg-white p-3">
              <img src={figure.src} alt={figure.alt} className="max-h-[260px] max-w-full object-contain" />
            </div>
          )}

          {/* Phương án Trắc nghiệm */}
          {e.type === 'trac-nghiem' && e.options && e.options.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[13px] font-semibold text-ink-3">Các phương án lựa chọn:</h3>
              <ol className="flex flex-col gap-2">
                {e.options.map((o) => {
                  const isCorrect = e.answer === o.key
                  return (
                    <li
                      key={o.key}
                      className={cn(
                        'flex items-start gap-3 rounded-[6px] border px-3.5 py-2.5 text-[14px]',
                        isCorrect ? 'border-sage/50 bg-sage-soft text-ink font-medium' : 'border-line-2 text-ink-2',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-5.5 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold',
                          isCorrect ? 'bg-sage text-white' : 'bg-sunken text-ink-3',
                        )}
                      >
                        {o.key}
                      </span>
                      <span className="pt-0.5 min-w-0 flex-1">
                        <MathText as="span">{o.text}</MathText>
                      </span>
                      {isCorrect && (
                        <span className="shrink-0 text-[12px] font-semibold text-sage flex items-center gap-1">
                          <Check className="size-3.5" /> Đáp án
                        </span>
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          )}

          {/* Dạng Đúng / Sai */}
          {e.type === 'dung-sai' && e.options && e.options.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[13px] font-semibold text-ink-3">Các ý xét tính Đúng / Sai:</h3>
              <ol className="flex flex-col gap-2">
                {e.options.map((o, idx) => {
                  const ansChar = e.answer?.[idx]
                  return (
                    <li
                      key={o.key}
                      className="flex items-start gap-3 rounded-[6px] border border-line-2 px-3.5 py-2.5 text-[14px]"
                    >
                      <span className="shrink-0 font-semibold text-ink-3">{o.key})</span>
                      <span className="pt-0.5 min-w-0 flex-1 text-ink-2">
                        <MathText as="span">{o.text}</MathText>
                      </span>
                      {ansChar && (
                        <span
                          className={cn(
                            'shrink-0 text-[12px] font-bold px-2 py-0.5 rounded',
                            ansChar === 'Đ' ? 'bg-sage-soft text-sage' : 'bg-clay/10 text-clay',
                          )}
                        >
                          {ansChar === 'Đ' ? 'Đúng' : 'Sai'}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          )}

          {/* Dạng Trả lời ngắn */}
          {e.type === 'tra-loi-ngan' && e.answer && (
            <div className="rounded-[6px] border border-sage/40 bg-sage-soft p-3.5 text-[14px]">
              <span className="text-ink-3">Đáp án ngắn: </span>
              <strong className="text-ink">{e.answer}</strong>
            </div>
          )}

          {/* Lời giải chi tiết */}
          {e.solution && e.solution.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-[13px] font-semibold text-ink-3">Lời giải</h3>
              <div className="rounded-[6px] border border-line bg-sunken/40 p-3.5 text-[14px] leading-relaxed space-y-1.5">
                {e.solution.map((line, i) => (
                  <MathText key={i} as="div">
                    {line}
                  </MathText>
                ))}
              </div>
            </div>
          )}

          {/* Giải thích */}
          {e.explanation && (
            <div className="space-y-1.5">
              <h3 className="text-[13px] font-semibold text-ink-3">Giải thích</h3>
              <div className="rounded-[6px] border border-line bg-sunken/40 p-3.5 text-[14px] leading-relaxed">
                <MathText as="div">{e.explanation}</MathText>
              </div>
            </div>
          )}

          {/* Tags */}
          {e.tags && e.tags.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-[12px] font-semibold text-ink-4">Tags:</h3>
              <div className="flex flex-wrap gap-1.5">
                {e.tags.map((t) => (
                  <span key={t} className="rounded bg-paper-2 px-2 py-0.5 text-[12px] text-ink-2">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer hành động */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper px-5 py-3">
          <div className="flex items-center gap-2">
            {isHidden ? (
              <Button variant="outline" size="sm" onClick={onUnhide} className="text-sage">
                <Eye className="size-4" />
                <span>Hiện lại</span>
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={onHide} className="text-ink-3 hover:text-clay">
                <EyeOff className="size-4" />
                <span>Ẩn câu</span>
              </Button>
            )}

            {isCustomOrEdited && (
              <Button variant="quiet" size="sm" onClick={onRevert} className="text-ink-3 hover:text-clay">
                {item.origin === 'cau-moi' ? (
                  <>
                    <Trash2 className="size-4" />
                    <span>Xoá câu</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="size-4" />
                    <span>Về bản gốc</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <Button variant="clay" size="sm" onClick={onEdit}>
            <span>Chỉnh sửa</span>
          </Button>
        </div>
      </aside>
    </Portal>
  )
}

/** Modal Form Thêm / Chỉnh sửa câu hỏi */
function QuestionFormModal({
  initialEntry,
  origin,
  onAdded,
  onClose,
  onSaved,
}: {
  initialEntry?: BankEntry
  origin?: BankItemOrigin
  onAdded: () => void
  onClose: () => void
  onSaved: (entry: BankEntry) => void
}) {
  const isEdit = !!initialEntry
  const [subject, setSubject] = useState<Subject>(initialEntry?.subject ?? 'Toán')
  const [grades, setGrades] = useState<string[]>(initialEntry?.grades ?? ['Lớp 10'])
  const [type, setType] = useState<QuestionType>(initialEntry?.type ?? 'trac-nghiem')
  const [points, setPoints] = useState<number>(initialEntry?.points ?? 0.25)
  const [prompt, setPrompt] = useState(initialEntry?.prompt ?? '')
  const [image, setImage] = useState<QuestionImage | undefined>(initialEntry?.image)
  const [imgBusy, setImgBusy] = useState(false)
  const [imgError, setImgError] = useState<string | null>(null)
  const pickImage = async (file: File) => {
    setImgBusy(true)
    setImgError(null)
    try {
      const src = await imageToSrc(file)
      // tải R2 lỗi thì imageToSrc trả data URL; ảnh lớn lưu vào câu sẽ vượt giới hạn API
      if (src.startsWith('data:') && src.length > 40_000) throw new Error('Không tải được ảnh lên máy chủ, thử lại sau.')
      setImage({ ...(image ?? {}), src })
    } catch (err) {
      setImgError(err instanceof Error ? err.message : 'Không đọc được ảnh.')
    } finally {
      setImgBusy(false)
    }
  }
  const [explanation, setExplanation] = useState(initialEntry?.explanation ?? '')
  const [solutionText, setSolutionText] = useState((initialEntry?.solution || []).join('\n'))
  const [tagsText, setTagsText] = useState((initialEntry?.tags || []).join(', '))
  const [variable, setVariable] = useState(initialEntry?.variable ?? false)

  // Options trắc nghiệm
  const [options, setOptions] = useState<Option[]>(() => {
    if (initialEntry?.options && initialEntry.options.length > 0) {
      return initialEntry.options.map((o) => ({ ...o }))
    }
    return [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' },
    ]
  })
  const [answer, setAnswer] = useState(initialEntry?.answer ?? 'A')

  // Đúng / Sai options
  const [tfOptions, setTfOptions] = useState<Array<{ key: string; text: string; verdict: 'Đ' | 'S' }>>(() => {
    const keys = ['a', 'b', 'c', 'd']
    const existing = initialEntry?.options || []
    const existingAns = initialEntry?.answer || 'ĐSĐS'
    return keys.map((k, i) => ({
      key: k,
      text: existing[i]?.text ?? '',
      verdict: (existingAns[i] === 'S' ? 'S' : 'Đ') as 'Đ' | 'S',
    }))
  })

  // Trả lời ngắn answer
  const [shortAnswer, setShortAnswer] = useState(initialEntry?.type === 'tra-loi-ngan' ? (initialEntry.answer ?? '') : '')

  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const toggleGrade = (g: string) => {
    setGrades((prev) => (prev.includes(g) ? (prev.length > 1 ? prev.filter((x) => x !== g) : prev) : [...prev, g]))
  }

  const [addedCount, setAddedCount] = useState(0)
  const [formTab, setFormTab] = useState<'manual' | 'ai'>('manual')
  const [drafts, setDrafts] = useState<BankDraft[]>([])
  // câu nháp đang được sửa ở tab Soạn tay
  const [editingDraft, setEditingDraft] = useState<string | null>(null)
  const promptRef = useRef<HTMLTextAreaElement>(null)

  // Soạn câu tiếp: giữ môn, dạng, điểm, khối, tags; chỉ xoá phần nội dung
  const parsedTags = () => tagsText.split(',').map((x) => x.trim()).filter(Boolean)

  const editDraft = (d: BankDraft) => {
    setType(d.type)
    setPrompt(d.prompt)
    setImage(d.image)
    setExplanation(d.explanation ?? '')
    setSolutionText((d.solution ?? []).join('\n'))
    if (d.type === 'trac-nghiem') {
      setOptions(d.options?.length ? d.options.map((o) => ({ ...o })) : ['A', 'B', 'C', 'D'].map((key) => ({ key, text: '' })))
      setAnswer(d.answer ?? d.options?.[0]?.key ?? 'A')
    } else if (d.type === 'dung-sai') {
      setTfOptions(['a', 'b', 'c', 'd'].map((key, i) => ({ key, text: d.options?.[i]?.text ?? '', verdict: d.answer?.[i] === 'S' ? 'S' : 'Đ' })))
    } else if (d.type === 'tra-loi-ngan') {
      setShortAnswer(d.answer ?? '')
    }
    setErrorMsg(null)
    setEditingDraft(d.id)
    setFormTab('manual')
  }

  const saveDrafts = async (list: BankDraft[]) => {
    let done = 0
    let lastError = ''
    for (const d of list) {
      try {
        await saveBankQuestion(
          { id: '', subject, grades, type: d.type, prompt: d.prompt, points, options: d.options, answer: d.answer, explanation: d.explanation, solution: d.solution, tags: parsedTags(), variable, image: d.image },
          'published',
        )
        setDrafts((cur) => cur.filter((x) => x.id !== d.id))
        done++
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Có lỗi khi lưu.'
      }
    }
    if (done) {
      setAddedCount((n) => n + done)
      onAdded()
    }
    if (lastError) await dialog.alert(`Đã lưu ${done}/${list.length} câu. Lỗi gần nhất: ${lastError}`, { title: 'Chưa lưu hết' })
  }

  const resetForNext = () => {
    setPrompt('')
    setImage(undefined)
    setImgError(null)
    setOptions(['A', 'B', 'C', 'D'].map((key) => ({ key, text: '' })))
    setAnswer('A')
    setTfOptions(['a', 'b', 'c', 'd'].map((key) => ({ key, text: '', verdict: 'Đ' as const })))
    setShortAnswer('')
    setSolutionText('')
    setExplanation('')
    promptRef.current?.focus()
  }

  const handleSave = async (e: React.SyntheticEvent, addNext = false) => {
    e.preventDefault()
    setErrorMsg(null)

    // Kiểm tra dữ liệu
    if (!prompt.trim()) {
      setErrorMsg('Vui lòng nhập nội dung câu hỏi.')
      return
    }
    if (prompt.trim().length > 5000) {
      setErrorMsg('Nội dung câu hỏi quá dài (tối đa 5000 ký tự).')
      return
    }
    if (grades.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một khối lớp.')
      return
    }
    if (points <= 0) {
      setErrorMsg('Điểm số phải lớn hơn 0.')
      return
    }

    let finalOptions: Option[] | undefined
    let finalAnswer = ''

    if (type === 'trac-nghiem') {
      if (options.length < 2) {
        setErrorMsg('Câu trắc nghiệm phải có ít nhất 2 phương án.')
        return
      }
      if (options.some((o) => !o.text.trim())) {
        setErrorMsg('Vui lòng điền nội dung cho tất cả các phương án trắc nghiệm.')
        return
      }
      if (!options.some((o) => o.key === answer)) {
        setErrorMsg('Đáp án đúng phải trỏ vào một phương án hợp lệ.')
        return
      }
      finalOptions = options.map((o) => ({ key: o.key, text: o.text.trim() }))
      finalAnswer = answer
    } else if (type === 'dung-sai') {
      if (tfOptions.some((o) => !o.text.trim())) {
        setErrorMsg('Vui lòng điền nội dung cho tất cả các ý a, b, c, d của câu đúng/sai.')
        return
      }
      finalOptions = tfOptions.map((o) => ({ key: o.key, text: o.text.trim() }))
      finalAnswer = tfOptions.map((o) => o.verdict).join('')
    } else if (type === 'tra-loi-ngan') {
      if (!shortAnswer.trim()) {
        setErrorMsg('Vui lòng nhập đáp án cho câu trả lời ngắn.')
        return
      }
      finalAnswer = shortAnswer.trim()
    }

    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const solution = solutionText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const payload: BankEntry = {
      id: initialEntry?.id || '',
      subject,
      grades,
      type,
      prompt: prompt.trim(),
      points,
      options: finalOptions,
      answer: finalAnswer || undefined,
      explanation: explanation.trim() || undefined,
      solution: solution.length > 0 ? solution : undefined,
      tags,
      variable,
      // Giữ nguyên figure cũ nếu đang sửa
      figure: initialEntry?.figure,
      image,
    }

    setSaving(true)
    try {
      const res = await saveBankQuestion(payload, origin === 'da-an' ? 'hidden' : 'published')
      if (editingDraft) {
        // sửa xong câu nháp thì quay lại danh sách nháp
        setDrafts((cur) => cur.filter((x) => x.id !== editingDraft))
        setEditingDraft(null)
        setAddedCount((n) => n + 1)
        resetForNext()
        onAdded()
        setFormTab('ai')
      } else if (addNext) {
        setAddedCount((n) => n + 1)
        resetForNext()
        onAdded()
      } else {
        onSaved(res.entry)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi lưu câu hỏi.'
      setErrorMsg(msg)
    } finally {
      setSaving(false)
    }
  }

  const metaFields = (
    <div className="space-y-5">
            {/* Môn & Loại câu & Điểm */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-ink">Môn học</label>
                <SiteSelect
                  label="Môn học"
                  value={subject}
                  options={SUBJECTS.map((s) => ({ value: s, label: s }))}
                  onChange={setSubject}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-ink">Dạng câu</label>
                <SiteSelect
                  label="Dạng câu"
                  value={type}
                  options={(Object.keys(TYPE_LABEL) as QuestionType[]).map((k) => ({ value: k, label: TYPE_LABEL[k] }))}
                  onChange={setType}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-ink">Điểm số</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="10"
                  value={points}
                  onChange={(e) => setPoints(parseFloat(e.target.value) || 0)}
                  className={cn(inputClass, 'h-11 text-[14px]')}
                />
              </div>
            </div>

            {/* Khối lớp */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">Khối lớp áp dụng</label>
              <div className="flex flex-wrap gap-2">
                {GRADES.map((g) => {
                  const checked = grades.includes(g)
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGrade(g)}
                      className={cn(
                        'rounded-[6px] border px-3 py-1 text-[13px] font-medium transition-colors',
                        checked ? 'border-clay bg-clay text-white' : 'border-line-2 bg-white text-ink-2 hover:bg-paper-2',
                      )}
                    >
                      {g}
                    </button>
                  )
                })}
              </div>
            </div>
    </div>
  )

  return (
    <Portal>
      <div className="page-enter fixed inset-0 z-50 flex flex-col bg-surface" role="dialog" aria-label="Soạn câu hỏi">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
              <h2 className="text-[17px] font-bold text-ink">
                {isEdit ? `Chỉnh sửa câu hỏi (${initialEntry.id})` : 'Thêm câu hỏi mới vào ngân hàng'}
              </h2>
              {isEdit ? null : (
                <Segmented<'manual' | 'ai'>
                  value={formTab}
                  onChange={setFormTab}
                  label="Cách thêm câu hỏi"
                  options={[
                    { key: 'manual', label: 'Soạn tay' },
                    { key: 'ai', label: 'AI và tệp', count: drafts.length || undefined },
                  ]}
                />
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="rounded-[6px] p-1.5 text-ink-3 hover:bg-sunken hover:text-ink"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Form Fields: cột trái là đề và đáp án, cột phải là lời giải và phân loại */}
          {formTab === 'ai' ? (
            <BankAiPanel
              meta={metaFields}
              subject={subject}
              grade={grades[0] ?? 'Lớp 10'}
              type={type}
              drafts={drafts}
              setDrafts={setDrafts}
              onEdit={editDraft}
              onSaveDrafts={saveDrafts}
            />
          ) : (
          <>
          <form
            onSubmit={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !saving) void handleSave(e, !isEdit)
            }}
            className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:overflow-hidden"
          >
          <div className="space-y-5 p-5 lg:overflow-y-auto">
            {metaFields}

            {/* Nội dung câu hỏi (prompt) */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[13px] font-semibold text-ink">Nội dung câu hỏi (Đề bài)</label>
                <span className="text-[11.5px] text-ink-4">Hỗ trợ LaTeX kẹp trong $...$</span>
              </div>
              <textarea
                ref={promptRef}
                autoFocus
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Nhập đề bài câu hỏi..."
                className={cn(inputClass, 'h-auto py-2.5 text-[14px]')}
              />
              <QuestionImageField image={image} onChange={setImage} busy={imgBusy} error={imgError} pick={(f) => void pickImage(f)} />
              {/* Xem trước trực tiếp */}
              {prompt.trim() && (
                <div className="mt-2 rounded-[6px] border border-line bg-paper-2/60 p-3">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-4">
                    Xem trước đề bài:
                  </span>
                  <div className="text-[14px] text-ink leading-relaxed">
                    <MathText as="div">{prompt}</MathText>
                  </div>
                </div>
              )}
            </div>

            {/* Phương án Trắc nghiệm */}
            {type === 'trac-nghiem' && (
              <div className="space-y-3 rounded-[8px] border border-line-2 bg-paper p-4">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-ink">Các phương án trắc nghiệm</label>
                  <Button
                    type="button"
                    variant="soft"
                    size="sm"
                    onClick={() => {
                      const nextChar = String.fromCharCode(65 + options.length)
                      setOptions([...options, { key: nextChar, text: '' }])
                    }}
                    className="h-8 text-[12px]"
                  >
                    <Plus className="size-3.5" /> Thêm phương án
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {options.map((o, idx) => (
                    <div key={o.key} className="flex items-start gap-2.5">
                      <label className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 px-1">
                        <input
                          type="radio"
                          name="correct-answer"
                          checked={answer === o.key}
                          onChange={() => setAnswer(o.key)}
                          className="size-4 text-clay focus:ring-clay"
                        />
                        <span className="font-semibold text-ink text-[13.5px]">{o.key}.</span>
                      </label>
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={o.text}
                          onChange={(e) => {
                            const next = [...options]
                            next[idx].text = e.target.value
                            setOptions(next)
                          }}
                          placeholder={`Nội dung phương án ${o.key}...`}
                          className={cn(inputClass, 'h-10 text-[13.5px]')}
                        />
                        {o.text.trim() && (
                          <div className="text-[12px] text-ink-3 pl-1">
                            <MathText as="span">{o.text}</MathText>
                          </div>
                        )}
                      </div>
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = options.filter((_, i) => i !== idx)
                            setOptions(next)
                            if (answer === o.key && next[0]) setAnswer(next[0].key)
                          }}
                          className="mt-2 text-ink-4 hover:text-clay"
                          title="Xoá phương án này"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Đúng / Sai */}
            {type === 'dung-sai' && (
              <div className="space-y-3 rounded-[8px] border border-line-2 bg-paper p-4">
                <label className="text-[13px] font-semibold text-ink">Các ý Đúng / Sai</label>
                <div className="space-y-3">
                  {tfOptions.map((o, idx) => (
                    <div key={o.key} className="flex items-start gap-3">
                      <span className="mt-2 shrink-0 font-bold text-ink-3 text-[14px]">{o.key})</span>
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={o.text}
                          onChange={(e) => {
                            const next = [...tfOptions]
                            next[idx].text = e.target.value
                            setTfOptions(next)
                          }}
                          placeholder={`Nội dung ý ${o.key})...`}
                          className={cn(inputClass, 'h-10 text-[13.5px]')}
                        />
                        {o.text.trim() && (
                          <div className="text-[12px] text-ink-3 pl-1">
                            <MathText as="span">{o.text}</MathText>
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...tfOptions]
                            next[idx].verdict = 'Đ'
                            setTfOptions(next)
                          }}
                          className={cn(
                            'rounded px-2.5 py-1 text-[12px] font-bold transition-colors',
                            o.verdict === 'Đ' ? 'bg-sage text-white' : 'bg-sunken text-ink-3 hover:bg-veil',
                          )}
                        >
                          Đúng
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...tfOptions]
                            next[idx].verdict = 'S'
                            setTfOptions(next)
                          }}
                          className={cn(
                            'rounded px-2.5 py-1 text-[12px] font-bold transition-colors',
                            o.verdict === 'S' ? 'bg-clay text-white' : 'bg-sunken text-ink-3 hover:bg-veil',
                          )}
                        >
                          Sai
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trả lời ngắn */}
            {type === 'tra-loi-ngan' && (
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-ink">Đáp án ngắn</label>
                <input
                  type="text"
                  value={shortAnswer}
                  onChange={(e) => setShortAnswer(e.target.value)}
                  placeholder="Ví dụ: -1,5 hoặc 42"
                  className={cn(inputClass, 'h-10 text-[14px]')}
                />
              </div>
            )}

          </div>

          <div className="space-y-5 border-line p-5 lg:overflow-y-auto lg:border-l">
            {/* Lời giải (tự luận / các bước) */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">
                Lời giải chi tiết <span className="text-[12px] text-ink-4 font-normal">(mỗi dòng một bước)</span>
              </label>
              <textarea
                rows={3}
                value={solutionText}
                onChange={(e) => setSolutionText(e.target.value)}
                placeholder="Bước 1: ...&#10;Bước 2: ..."
                className={cn(inputClass, 'h-auto py-2.5 text-[14px]')}
              />
            </div>

            {/* Giải thích */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">Giải thích đáp án</label>
              <textarea
                rows={3}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Giải thích ngắn gọn căn cứ chọn đáp án..."
                className={cn(inputClass, 'h-auto py-2.5 text-[14px]')}
              />
              {explanation.trim() && (
                <div className="mt-2 rounded-[6px] border border-line bg-paper-2/60 p-3">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-4">
                    Xem trước giải thích:
                  </span>
                  <div className="text-[13.5px] text-ink leading-relaxed">
                    <MathText as="div">{explanation}</MathText>
                  </div>
                </div>
              )}
            </div>

            {/* Tags & Biến thiên */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-ink">
                  Tags chủ đề <span className="text-[12px] text-ink-4 font-normal">(cách nhau bằng dấu phẩy)</span>
                </label>
                <input
                  type="text"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="số tự nhiên, phân số, NB..."
                  className={cn(inputClass, 'h-10 text-[13.5px]')}
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={variable}
                    onChange={(e) => setVariable(e.target.checked)}
                    className="size-4.5 rounded border-line-2 text-clay focus:ring-clay"
                  />
                  <span className="text-[13.5px] text-ink">Cho phép AI đổi số tạo biến thể (variable)</span>
                </label>
              </div>
            </div>

            {/* Thông báo hình vẽ nếu có */}
            {initialEntry?.figure && (
              <div className="rounded-[6px] border border-line-2 bg-sunken/40 p-3 text-[12.5px] text-ink-3">
                Câu này có đính kèm cấu hình hình vẽ (figure). Khi lưu, hình vẽ hiện tại sẽ được giữ nguyên.
              </div>
            )}
          </div>
          </form>

          {/* Footer: lỗi nằm đây để luôn nhìn thấy, không phải cuộn */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-line bg-paper px-5 py-3">
            <div className="mr-auto min-w-0 text-[13px]">
              {errorMsg ? (
                <span className="flex items-center gap-2 text-clay">
                  <AlertCircle className="size-4 shrink-0" />
                  {errorMsg}
                </span>
              ) : addedCount > 0 ? (
                <span className="font-medium text-sage">Đã thêm {addedCount} câu</span>
              ) : !isEdit ? (
                <span className="hidden text-ink-4 sm:inline">Ctrl + Enter để lưu và soạn câu tiếp</span>
              ) : null}
            </div>
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              {addedCount > 0 ? 'Xong' : 'Huỷ'}
            </Button>
            {isEdit ? (
              <Button variant="clay" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Spinner /> : null}
                <span>Lưu thay đổi</span>
              </Button>
            ) : (
              <>
                <Button variant="soft" size="sm" onClick={handleSave} disabled={saving}>
                  Lưu và đóng
                </Button>
                <Button variant="clay" size="sm" onClick={(e) => void handleSave(e, true)} disabled={saving}>
                  {saving ? <Spinner /> : null}
                  <span>Lưu và thêm câu tiếp</span>
                </Button>
              </>
            )}
          </div>
          </>
          )}
      </div>
    </Portal>
  )
}
