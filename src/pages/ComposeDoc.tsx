/**
 * Trang Soạn đề — trình soạn đề thi kiểu tài liệu (GenOffice-style).
 *
 * Bố cục (full-screen, không header/footer chung của site):
 *   ┌───────────────────────────────────────────────────────────┐
 *   │ ribbon-tabs: Trang chủ | Chèn | Bố cục | Thiết kế | Tài liệu│
 *   ├───────────────────────────────────────────────────────────┤
 *   │ tab-strip: nhiều đề đang mở                             │
 *   ├────────┬───────────────────────────────┬─────────────────┤
 *   │  AI    │ ruler                         │ Mục lục         │
 *   │  dock  ├───────────────────────────────┤ Khối mẫu        │
 *   │ (trái) │ sân A4 — trang giấy thật      │ Tìm kiếm        │
 *   └────────┴───────────────────────────────┴─────────────────┘
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Editor } from '@tiptap/core'
import type { JSONContent } from '@tiptap/core'
import { Selection } from '@tiptap/pm/state'
import { ExamEditor, pageGeometry, CM, type PageSetup } from '@/examEditor/ExamEditor'
import { Ribbon } from '@/examEditor/Ribbon'
import { TabStrip } from '@/examEditor/TabStrip'
import { AiPanel } from '@/examEditor/AiPanel'
import { StartTab } from '@/examEditor/StartTab'
import { NavPanel } from '@/examEditor/NavPanel'
import { insertBlockTemplate, type BlockTemplate } from '@/examEditor/templates'
import { AiDock, NavPane, Ruler, useViewportSize } from '@/examEditor/Layout'
import { tipTapToBlocks, blocksToTipTap } from '@/examEditor/convert'
import { useFormatState, applyFormatAttrs } from '@/examEditor/formatState'
import { FindPanel } from '@/examEditor/FindPanel'
import { exportDocBlocks, printDoc } from '@/examEditor/exportBlocks'
import { useComposeStore } from '@/store/compose'
import { useApp } from '@/store/app'
import { docToExam } from '@/lib/docToExam'
import { isAutoGraded } from '@/lib/grading'
import { DECK_THEMES } from '@/lib/slideTheme'
import { SlideEditor } from '@/examEditor/SlideEditor'
import { extractJson } from '@/lib/llm'
import { importedSlides, readImportFile, textToBlocks } from '@/lib/importFile'
import { IconZoomIn, IconZoomOut } from '@/examEditor/icons'
import type { ExamBlock, ExamDoc, FormatAttrs, RichText } from '@/data/docTypes'
import { emptyDoc } from '@/data/docTypes'

/** Hợp đồng AI trả về: thay cả đề / thêm cuối / sửa theo id khối. */
interface AiExamEnvelope {
  action?: string
  blocks?: unknown
  patch?: unknown
}

const AI_BLOCK_TYPES = new Set([
  'header',
  'title',
  'meta',
  'student',
  'heading',
  'paragraph',
  'bullets',
  'grid',
  'question',
  'essay',
  'answerKey',
  'rubric',
  'pageBreak',
  'divider',
])

/** Chuẩn hoá block AI trả về: đúng loại + field tối thiểu, sai thì bỏ. */
function sanitizeBlocks(raw: unknown): ExamBlock[] {
  if (!Array.isArray(raw)) return []
  // AI có lúc trả mảng trộn string + span; chuẩn hoá về Span[] để converter/export đọc được.
  const rich = (v: unknown): RichText =>
    typeof v === 'string'
      ? v
      : Array.isArray(v)
        ? (v.map((s) => (typeof s === 'string' ? { text: s } : s)) as RichText)
        : ''
  const fmt = (v: unknown): FormatAttrs | undefined =>
    v && typeof v === 'object' ? (v as FormatAttrs) : undefined
  const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
  const out: ExamBlock[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const b = item as Record<string, unknown>
    const type = typeof b.type === 'string' ? b.type : ''
    if (!AI_BLOCK_TYPES.has(type)) continue
    switch (type) {
      case 'header': {
        // dạng cũ {"type":"header","text":"…"} → đưa vào cột trái thay vì header rỗng
        const left = rich(b.left) || (typeof b.text === 'string' ? b.text : '')
        out.push({ type: 'header', left, right: rich(b.right) })
        break
      }
      case 'title':
        out.push({ type: 'title', text: rich(b.text), format: fmt(b.format) })
        break
      case 'meta':
        out.push({
          type: 'meta',
          rows: list(b.rows)
            .map((row, i) =>
              Array.isArray(row)
                ? ([String(row[0] ?? ''), rich(row[1])] as [string, RichText])
                : row && typeof row === 'object'
                  ? ([
                      String((row as Record<string, unknown>).label ?? `Dòng ${i + 1}`),
                      rich((row as Record<string, unknown>).value),
                    ] as [string, RichText])
                  : null,
            )
            .filter((r): r is [string, RichText] => r !== null),
        })
        break
      case 'student':
        out.push({ type: 'student', text: rich(b.text), format: fmt(b.format) })
        break
      case 'heading':
        out.push({
          type: 'heading',
          text: rich(b.text),
          level: (b.level === 2 || b.level === 3 ? b.level : 1) as 1 | 2 | 3,
          format: fmt(b.format),
        })
        break
      case 'paragraph':
        out.push({ type: 'paragraph', text: rich(b.text), format: fmt(b.format) })
        break
      case 'bullets':
        out.push({
          type: 'bullets',
          items: list(b.items) as RichText[],
          ...(b.ordered === true ? { ordered: true } : {}),
          ...(Array.isArray(b.levels) ? { levels: b.levels.map(Number) } : {}),
          format: fmt(b.format),
        })
        break
      case 'grid':
        out.push({
          type: 'grid',
          cols: b.cols === 3 ? 3 : 2,
          cells: list(b.cells) as RichText[],
          format: fmt(b.format),
        })
        break
      case 'question': {
        // kind: 'tf' = đúng/sai (4 ý a–d), 'short' = trả lời ngắn (không có phương án); còn lại là trắc nghiệm A–D
        const kind = b.kind === 'tf' || b.kind === 'short' ? b.kind : undefined
        out.push({
          type: 'question',
          no: typeof b.no === 'number' ? b.no : 1,
          ...(kind ? { kind } : {}),
          text: rich(b.text),
          // chấp nhận cả dạng viết tắt: options: ["A. …", "B. …"]
          options:
            kind === 'short'
              ? []
              : list(b.options).map((o, i) => {
                  const letter = String.fromCharCode((kind === 'tf' ? 97 : 65) + i)
                  if (typeof o === 'string') return { label: letter, text: o }
                  const opt = (o ?? {}) as Record<string, unknown>
                  return {
                    label: typeof opt.label === 'string' ? (kind === 'tf' ? opt.label.toLowerCase() : opt.label) : letter,
                    text: rich(opt.text),
                    format: fmt(opt.format),
                  }
                }),
          format: fmt(b.format),
        })
        break
      }
      case 'essay':
        out.push({
          type: 'essay',
          no: typeof b.no === 'number' ? b.no : 1,
          score: typeof b.score === 'number' ? b.score : 0,
          text: rich(b.text),
          sub: Array.isArray(b.sub) ? (b.sub as RichText[]) : undefined,
          format: fmt(b.format),
        })
        break
      case 'answerKey':
        // chấp nhận items: [{no, answer}] hoặc chuỗi rút gọn "Câu 1. A"
        out.push({
          type: 'answerKey',
          items: list(b.items).map((it, i) =>
            typeof it === 'string'
              ? { no: i + 1, answer: it }
              : {
                  no: typeof (it as Record<string, unknown>)?.no === 'number'
                    ? ((it as Record<string, unknown>).no as number)
                    : i + 1,
                  answer: rich((it as Record<string, unknown>)?.answer),
                },
          ),
        })
        break
      case 'rubric':
        out.push({
          type: 'rubric',
          title: b.title == null ? undefined : rich(b.title),
          // chấp nhận items: [{label, text}] hoặc chuỗi rút gọn
          items: list(b.items).map((it, i) =>
            typeof it === 'string'
              ? { label: `${i + 1}.`, text: it }
              : {
                  label:
                    typeof (it as Record<string, unknown>)?.label === 'string'
                      ? ((it as Record<string, unknown>).label as string)
                      : `${i + 1}.`,
                  text: rich((it as Record<string, unknown>)?.text),
                },
          ),
        })
        break
      case 'pageBreak':
        out.push({ type: 'pageBreak' })
        break
      case 'divider':
        out.push({ type: 'divider' })
        break
    }
  }
  return out
}

/** Các mục patch: {id, block} với block hợp lệ. */
function sanitizePatches(raw: unknown): Array<{ id: string; block: ExamBlock }> {
  if (!Array.isArray(raw)) return []
  const out: Array<{ id: string; block: ExamBlock }> = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const p = item as Record<string, unknown>
    if (typeof p.id !== 'string' || !p.id) continue
    const [block] = sanitizeBlocks([p.block])
    if (block) out.push({ id: p.id, block })
  }
  return out
}

/** Gom text của một node TipTap (để tóm tắt tài liệu cho AI). */
function nodeText(node: JSONContent): string {
  if (node.type === 'text') return node.text ?? ''
  return (node.content ?? []).map(nodeText).join(' ')
}

export default function ComposeDoc() {
  const navigate = useNavigate()
  const viewport = useViewportSize()

  const {
    tabs,
    activeId,
    contents,
    decks,
    newDoc,
    newSlide,
    ensureDoc,
    closeTab,
    setActive,
    renameTab,
    setContent,
    saveDoc,
    saveTab,
    saveAll,
    openDoc,
    openDeck,
    updateDeck,
  } = useComposeStore()

  const [ribbonTab, setRibbonTab] = useState('home')
  const [findTab, setFindTab] = useState<'find' | 'replace' | null>(null)
  // tab khởi động (trang bắt đầu) hiện thay cho sân soạn khi được chọn
  const [startOpen, setStartOpen] = useState(true)
  const [aiOpen, setAiOpen] = useState(true)
  const [navOpen, setNavOpen] = useState(true)
  const [navWidth, setNavWidth] = useState(288)
  const [zoom, setZoom] = useState(100)
  const [pageCount, setPageCount] = useState(1)
  const stageRef = useRef<HTMLDivElement>(null)

  // Đổi tab → editor cũ bị destroy, editor mới chưa sẵn sàng. Xóa editor khỏi
  // state ngay để ribbon không trỏ vào instance đã chết (mọi lệnh sẽ im
  // lặng). `ExamEditor` báo lại editor mới sau khi mount.
  //
  // Dùng "derived state" (so sánh trong lúc render) thay vì `useEffect`: effect
  // cha chạy SAU effect con, nên `setEditor(null)` trong effect sẽ xóa luôn
  // editor mới mà con vừa báo.
  const [editorState, setEditorState] = useState<{ id: string | null; editor: Editor | null }>({
    id: null,
    editor: null,
  })
  const editor = editorState.id === activeId ? editorState.editor : null
  const handleEditorReady = useCallback(
    (e: Editor) => setEditorState({ id: activeId, editor: e }),
    [activeId],
  )

  const format = useFormatState(editor)
  const [pageSetup, setPageSetup] = useState<PageSetup>({ marginCm: 2, orientation: 'portrait' })
  const geo = pageGeometry(pageSetup)
  const { PAGE_W, MARGIN } = geo

  // mở tab đầu tiên nếu chưa có.
  // `ensureDoc` kiểm tra trạng thái tại thời điểm gọi nên StrictMode gọi effect
  // hai lần vẫn chỉ tạo ra một tab.
  useEffect(() => {
    ensureDoc()
  }, [ensureDoc])

  // Tự lưu toàn bộ tab khi rời trang (đóng tab trình duyệt, tải lại, điều hướng).
  useEffect(() => {
    const flush = () => useComposeStore.getState().saveAll()
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
      // rời /soan-de bằng điều hướng SPA: chỉ lưu tab có thay đổi, tránh tạo
      // bản ghi rỗng khi StrictMode mount/unmount hai lần
      const s = useComposeStore.getState()
      if (s.tabs.some((t) => t.dirty)) s.saveAll()
    }
  }, [])

  // mở đề = rời trang bắt đầu
  const selectDoc = useCallback(
    (id: string) => {
      setActive(id)
      setStartOpen(false)
    },
    [setActive],
  )

  /**
   * Tạo đề mới và mở nó.
   * `reuseEmpty` = dùng lại tab trống đang mở thay vì đẻ thêm tab rỗng thứ
   * hai — chỉ áp dụng cho thẻ "Đề thi" ở trang Bắt đầu. Nút "+" trên tab
   * strip LUÔN tạo tab mới: bấm mà không thấy tab nào xuất hiện thì tưởng
   * như nút hỏng.
   */
  const newDocAndOpen = useCallback(
    (reuseEmpty: boolean) => {
      if (reuseEmpty) {
        const only = tabs.length === 1 ? tabs[0] : null
        const empty =
          only && !only.dirty && (contents[only.id]?.content?.length ?? 0) === 0
        if (empty) {
          setActive(only.id)
          setStartOpen(false)
          return
        }
      }
      newDoc()
      setStartOpen(false)
    },
    [tabs, contents, setActive, newDoc],
  )

  /** Đề đang soạn — dựng từ nội dung TipTap hiện tại. */
  const activeDoc = useMemo<ExamDoc | null>(() => {
    if (!activeId) return null
    const content = contents[activeId]
    if (!content) return null
    return {
      ...emptyDoc({ id: activeId }),
      title: tabs.find((t) => t.id === activeId)?.title ?? 'Đề thi mới',
      blocks: tipTapToBlocks(content),
    }
  }, [activeId, contents, tabs])

  /**
   * Bản tóm tắt đề cho AI: mỗi khối cấp cao nhất một dòng `[id] loại: trích đoạn`.
   * Có id để model patch đúng khối; giới hạn 80 dòng / 160 ký tự mỗi dòng.
   */
  const documentDigest = useMemo(() => {
    if (!activeId) return undefined
    const json = contents[activeId]
    const nodes = json?.content ?? []
    if (!nodes.length) return undefined
    const lines: string[] = []
    for (const node of nodes) {
      const type = node.type ?? ''
      if (type === 'paragraph' && !node.content?.length) continue
      const id = typeof node.attrs?.id === 'string' ? node.attrs.id : ''
      const shortType = type.startsWith('exam')
        ? type[4].toLowerCase() + type.slice(5)
        : type
      const text = nodeText(node).replace(/\s+/g, ' ').trim().slice(0, 160)
      lines.push(`- [${id}] ${shortType}${text ? `: ${text}` : ''}`)
      if (lines.length >= 80) {
        lines.push('… (còn nữa)')
        break
      }
    }
    return lines.join('\n')
  }, [activeId, contents])

  const activeContent = useMemo<JSONContent>(
    () => contents[activeId ?? ''] ?? { type: 'doc', content: [] },
    [contents, activeId],
  )

  const activeTab = tabs.find((t) => t.id === activeId)

  /** deck đang mở — chỉ có khi tab active là slide */
  const activeDeck = useMemo(() => {
    if (!activeId) return null
    if (tabs.find((t) => t.id === activeId)?.kind !== 'slide') return null
    return decks[activeId] ?? null
  }, [activeId, tabs, decks])

  /** lưu bài trình bày đang soạn vào kho tài liệu của Home */
  const handleSaveSlide = useCallback(() => {
    if (activeDeck) saveTab(activeDeck.id)
  }, [activeDeck, saveTab])

  const onChange = useCallback(
    (doc: JSONContent) => {
      if (!activeId) return
      setContent(activeId, doc)
    },
    [activeId, setContent],
  )

  const handleSave = useCallback(() => {
    if (!activeId) return
    saveDoc(activeId)
  }, [activeId, saveDoc])

  const handleExportWord = useCallback(async () => {
    if (!activeDoc) return
    await exportDocBlocks(activeDoc)
  }, [activeDoc])

  /**
   * Tệp → Làm đề tương tác: dựng đề tương tác từ các khối đang soạn (`docToExam`) rồi mở màn làm bài.
   * Mỗi lần bấm thay bản đã chuyển trước đó của đề này (để sửa đề rồi làm lại không ra bản cũ).
   */
  const handleStartQuiz = useCallback(() => {
    if (!activeDoc) return
    const exam = docToExam(activeDoc, `doc-${activeDoc.id}`)
    const questions = exam.sections.flatMap((s) => s.questions)
    if (!questions.length) {
      window.alert('Đề chưa có câu hỏi nào để làm. Thêm câu trắc nghiệm hoặc tự luận trước nhé.')
      return
    }
    // câu tự động chấm được (trắc nghiệm, đúng/sai, trả lời ngắn) mà thiếu đáp án thì không chấm được
    const noAnswer = questions.filter((q) => q.type !== 'tu-luan' && q.type !== 'tu-luan-dong' && !isAutoGraded(q)).length
    if (
      noAnswer > 0 &&
      !window.confirm(`${noAnswer} câu chưa có đáp án hợp lệ (thiếu khối đáp án, số câu không khớp, hoặc đáp án sai dạng: đúng/sai cần chuỗi Đ/S đủ 4 ý, trả lời ngắn cần một số), nên không chấm được các câu này. Vẫn làm thử?`)
    )
      return
    const app = useApp.getState()
    const prev = app.myExams.find((e) => e.importedFrom === exam.id)
    if (prev) app.deleteExam(prev.id)
    const id = app.importExam(exam)
    app.startQuiz(id)
    navigate(`/lam-de/${id}`)
  }, [activeDoc, navigate])

  /** Tệp → Nhập file: mở tệp Word/Excel/PowerPoint thành một tab đề mới. */
  const handleImportExam = useCallback(
    async (file: File) => {
      const data = await readImportFile(file)
      const blocks = textToBlocks(data.text)
      if (!blocks.length) throw new Error('Tệp không có nội dung văn bản để nhập.')
      const id = newDoc()
      renameTab(id, data.title)
      setContent(id, blocksToTipTap(blocks))
    },
    [newDoc, renameTab, setContent],
  )

  /** Tệp → Nhập file trong trình soạn slide: tab bài giảng mới. */
  const handleImportSlides = useCallback(
    async (file: File) => {
      const data = await readImportFile(file)
      const id = newSlide()
      updateDeck(id, { title: data.title, slides: importedSlides(data, DECK_THEMES[0]) })
    },
    [newSlide, updateDeck],
  )

  const handlePrint = useCallback(() => {
    if (!activeDoc) return
    printDoc(activeDoc)
  }, [activeDoc])

  /** AI trả về JSON đề → áp theo `action` (replace / append / patch), trả câu tóm tắt. */
  const handleAiResult = useCallback(
    (text: string): string | undefined => {
      if (!activeId || !editor || editor.isDestroyed) return undefined
      let raw: AiExamEnvelope
      try {
        raw = extractJson<AiExamEnvelope>(text)
      } catch {
        // AI trả lời tự do — không phải JSON thì bỏ qua, người dùng đọc trong panel
        return undefined
      }
      if (!raw || typeof raw !== 'object') return undefined

      const blocks = sanitizeBlocks(raw.blocks)
      const patches = sanitizePatches(raw.patch)
      const action =
        raw.action === 'append' || raw.action === 'patch' || raw.action === 'replace'
          ? raw.action
          : blocks.length
            ? 'replace'
            : 'none'
      try {
        if (action === 'replace' && blocks.length) {
          editor.commands.setContent(blocksToTipTap(blocks))
          // setContent thay cả tài liệu nên selection cũ được map lại tuỳ vị trí
          // → có thể rơi vào khối bất kỳ. Đặt lại con trỏ về đầu đề.
          editor.commands.setTextSelection(Selection.near(editor.state.doc.resolve(1)).from)
          // Luôn báo việc đã làm; `note` của model hay lặp lại đúng câu prompt.
          return `Đã soạn xong đề (${blocks.length} khối).`
        }
        if (action === 'append' && blocks.length) {
          const content = blocksToTipTap(blocks).content ?? []
          editor.chain().focus().insertContentAt(editor.state.doc.content.size, content).run()
          return `Đã thêm ${blocks.length} khối vào cuối đề.`
        }
        if (action === 'patch' && patches.length) {
          const { state, view } = editor
          const tr = state.tr
          let applied = 0
          for (const { id, block } of patches) {
            // tìm khối cấp cao nhất theo id trong trạng thái hiện tại của tr
            let pos = -1
            let size = 0
            tr.doc.forEach((node, offset) => {
              if (pos < 0 && node.attrs.id === id) {
                pos = offset
                size = node.nodeSize
              }
            })
            if (pos < 0) continue
            const nodeJson = blocksToTipTap([block]).content?.[0]
            if (!nodeJson) continue
            tr.replaceWith(pos, pos + size, state.schema.nodeFromJSON(nodeJson))
            applied++
          }
          if (applied) {
            view.dispatch(tr)
            return `Đã cập nhật ${applied} khối trong đề.`
          }
          return 'Không tìm thấy khối cần sửa trong đề.'
        }
      } catch (err) {
        // Không áp được (JSON hỏng/cắt cụt, block lạ…) — log để chẩn đoán,
        // panel sẽ báo cho người dùng biết thay vì im lặng.
        console.error('[AI] không áp được kết quả vào đề', err)
        return undefined
      }
      return 'AI không đề xuất thay đổi nào cho đề.'
    },
    [activeId, editor],
  )

  /** Chèn khối mẫu — đường chèn chung xem `insertBlockTemplate` (templates.ts). */
  const handleInsertTemplate = useCallback(
    (tpl: BlockTemplate) => {
      if (!editor || editor.isDestroyed) return
      insertBlockTemplate(editor, tpl)
    },
    [editor],
  )

  /** Nhảy tới khối cấp cao nhất theo index (dùng cho mục lục / tìm kiếm). */
  const handleGoToBlock = useCallback(
    (index: number) => {
      if (!editor) return
      // offset của node cấp cao nhất thứ `index` trong doc
      let pos = -1
      editor.state.doc.content.forEach((_node, offset, i) => {
        if (i === index) pos = offset
      })
      if (pos < 0) return
      editor.chain().focus().setTextSelection(pos + 1).run()

      // cuộn khối đó vào 1/3 chiều cao vùng nhìn
      const dom = editor.view.dom as HTMLElement
      const child = dom.children[index] as HTMLElement | undefined
      const stage = stageRef.current
      if (child && stage) {
        stage.scrollTop = child.offsetTop - stage.clientHeight / 3
      }
    },
    [editor],
  )

  // đếm số trang: quan sát chiều cao sân
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const update = () => {
      const papers = stage.querySelectorAll('.doc-paper')
      setPageCount(Math.max(1, papers.length))
    }
    const ro = new ResizeObserver(update)
    ro.observe(stage)
    const t = setTimeout(update, 200)
    return () => {
      ro.disconnect()
      clearTimeout(t)
    }
  }, [activeContent])

  // tự co trang A4 cho vừa khung nhìn khi người dùng chưa chỉnh tay
  const [autoFit, setAutoFit] = useState(true)
  const [stageBox, setStageBox] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setStageBox({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // co trang A4 vừa chiều rộng khung nhìn (như Word), giới hạn 25%–130%.
  // Sàn thấp là 25% vì khi cả AI dock + nav pane đều mở trên màn hình hẹp,
  // trang vẫn phải nhìn thấy được (sân cuộn ngang được).
  const fitScale = useMemo(() => {
    if (!stageBox.w) return 1
    const usableW = stageBox.w - 56
    const byW = usableW / PAGE_W
    return Math.max(0.25, Math.min(1.3, byW))
  }, [stageBox])

  // zoom bấm tay thì bỏ auto-fit
  const setZoomManual = useCallback((z: number) => {
    setAutoFit(false)
    setZoom(z)
  }, [])

  const effectiveZoom = autoFit ? Math.round(fitScale * 100) : zoom
  const effectiveScale = effectiveZoom / 100

  // trên màn hình hẹp, ưu tiên sân soạn: tự thu gọn panel bên
  useEffect(() => {
    if (viewport.w > 0 && viewport.w < 1100) setNavOpen(false)
    if (viewport.w > 0 && viewport.w < 860) setAiOpen(false)
  }, [viewport.w])

  return (
    <div className="compose-app">
      {/* ---------- tab strip nhiều đề — trên cùng như GenOffice ---------- */}
      <div className="compose-tabbar">
        <TabStrip
          tabs={tabs}
          activeId={startOpen ? null : activeId}
          startActive={startOpen}
          onSelect={selectDoc}
          onSelectStart={() => {
            saveAll()
            setStartOpen(true)
          }}
          onClose={(id) => {
            saveTab(id)
            closeTab(id)
            if (id === activeId && tabs.length === 1) newDoc()
          }}
          onNew={() => newDocAndOpen(false)}
          onNewSlide={() => {
            newSlide()
            setStartOpen(false)
          }}
          slideEnabled
          onRename={renameTab}
          onBack={saveAll}
        />
      </div>

      {/* ---------- trang bắt đầu: ẩn ribbon/sân soạn, chỉ còn dashboard ---------- */}
      {startOpen ? (
        <StartTab
          onNewDoc={() => newDocAndOpen(true)}
          onOpenDoc={(doc) => {
            openDoc(doc)
            setStartOpen(false)
          }}
          onNewSlide={() => {
            newSlide()
            setStartOpen(false)
          }}
          onOpenDeck={(deck) => {
            openDeck(deck)
            setStartOpen(false)
          }}
        />
      ) : activeDeck ? (
        /* ---------- tab slide: trình soạn trình chiếu dùng chung với /soan-slide ---------- */
        <div className="compose-body">
          <SlideEditor
            deck={activeDeck}
            updateDeck={(patch) => updateDeck(activeDeck.id, patch)}
            onSave={handleSaveSlide}
            onNewDeck={newSlide}
            onImportFile={handleImportSlides}
          />
        </div>
      ) : (
        <>
      {/* ---------- ribbon (hàng tab → ribbon body) ---------- */}
      <Ribbon
        editor={editor}
        activeTab={ribbonTab}
        onTabChange={setRibbonTab}
        onNewDoc={() => newDocAndOpen(false)}
        onImportFile={handleImportExam}
        onSave={handleSave}
        onPrint={handlePrint}
        onExportWord={handleExportWord}
        onExportPdf={handlePrint}
        onStartQuiz={handleStartQuiz}
        dirty={activeTab?.dirty ?? false}
        pageCount={pageCount}
        zoom={effectiveZoom}
        onZoomChange={setZoomManual}
        format={format}
        onFind={() => setFindTab('find')}
        onReplace={() => setFindTab('replace')}
        marginCm={pageSetup.marginCm}
        onMarginChange={(cm) => setPageSetup((p) => ({ ...p, marginCm: cm }))}
        orientation={pageSetup.orientation}
        onOrientationChange={(o) => setPageSetup((p) => ({ ...p, orientation: o }))}
        pageColor={pageSetup.pageColor}
        onPageColorChange={(c) => setPageSetup((p) => ({ ...p, pageColor: c }))}
        pageBorder={pageSetup.pageBorder}
        onPageBorderChange={(w) => setPageSetup((p) => ({ ...p, pageBorder: w }))}
      />

      {/* ---------- thân ---------- */}
      <div className="compose-body">
        {/* AI dock (trái) */}
        <AiDock open={aiOpen} onToggle={() => setAiOpen((v) => !v)} width={360}>
          <AiPanel
            onApplyBlocks={handleAiResult}
            documentDigest={documentDigest}
            contextSummary={
              activeDoc
                ? `đề đang soạn: "${activeDoc.title}", ${activeDoc.blocks.length} khối`
                : undefined
            }
          />
        </AiDock>

        {/* sân soạn (giữa) */}
        <div className="compose-center">
          {findTab && editor && (
            <FindPanel editor={editor} initialTab={findTab} onClose={() => setFindTab(null)} />
          )}
          <div className="compose-scroll" ref={stageRef}>
            {/* `zoom` (không phải transform) để thước kẻ và trang giấy co cùng
                tỉ lệ và container vẫn đúng bề rộng — giống GenOffice `.doc-zoom`. */}
            <div className="compose-canvas anim-tab-in" key={activeId ?? 'none'} style={{ zoom: effectiveScale }}>
              <Ruler
                width={PAGE_W}
                margin={MARGIN}
                indentLeft={format.indentLeft}
                indentFirstLine={format.indentFirstLine}
                onIndentChange={(patch) => {
                  if (editor) applyFormatAttrs(editor, patch)
                }}
                onMarginChange={(px) =>
                  setPageSetup((p) => ({ ...p, marginCm: Math.round((px / CM) * 10) / 10 }))
                }
              />
              <ExamEditor
                key={activeId ?? 'none'}
                content={activeContent}
                onChange={onChange}
                onReady={handleEditorReady}
                pageSetup={pageSetup}
              />            </div>
          </div>

          {/* thanh trạng thái */}
          <div className="status-bar">
            <div className="status-left">
              <span className="status-item">{pageCount} trang</span>
              <span className="status-item">
                Trang A4 {pageSetup.orientation === 'landscape' ? 'ngang' : 'dọc'} · lề {pageSetup.marginCm} cm
              </span>
              <span className="status-item">{activeTab?.dirty ? 'Chưa lưu' : 'Đã lưu'}</span>
            </div>
            <div className="status-right">
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setZoomManual(Math.max(50, effectiveZoom - 10))}
                aria-label="Thu nhỏ"
                disabled={effectiveZoom <= 50}
              >
                <IconZoomOut size={14} />
              </button>
              <span className="tnum">{effectiveZoom}%</span>
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setZoomManual(Math.min(200, effectiveZoom + 10))}
                aria-label="Phóng to"
                disabled={effectiveZoom >= 200}
              >
                <IconZoomIn size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* nav pane (phải) */}
        {navOpen && (
          <NavPane width={navWidth} onResize={setNavWidth}>
            <NavPanel
              doc={activeContent}
              onInsertTemplate={handleInsertTemplate}
              onGoToBlock={handleGoToBlock}
            />
          </NavPane>
        )}
      </div>
        </>
      )}
    </div>
  )
}

export { pageGeometry }
