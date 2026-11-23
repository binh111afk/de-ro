/**
 * Trang Soạn đề — trình soạn đề thi kiểu tài liệu (GenOffice-style).
 *
 * Bố cục (full-screen, không header/footer chung của site):
 *   ┌───────────────────────────────────────────────────────────┐
 *   │ ribbon-tabs: Trang chủ | Chèn | Bố cục | Thiết kế | Tài liệu│
 *   ├───────────────────────────────────────────────────────────┤
 *   │ tab-strip: nhiều đề đang mở                             │
 *   ├────────┬───────────────────────────────┬─────────────────┤
 *   │ Mục lục│ ruler                         │  AI dock        │
 *   │ Khối   ├───────────────────────────────┤  (phải, như     │
 *   │ Công cụ│ sân A4 — trang giấy thật      │   soạn slide)   │
 *   └────────┴───────────────────────────────┴─────────────────┘
 */
import { dialog } from '@/components/Dialog'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { lazyPage } from '@/lib/lazyPage'
import { useBoards } from '@/store/boards'
import { PageErrorBoundary } from '@/components/PageErrorBoundary'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Editor } from '@tiptap/core'
import type { JSONContent } from '@tiptap/core'
import { pageGeometry, marginsOf, paperCm, CM, PAGE_SIZES, type PageSetup } from '@/examEditor/pageSetup'
import { Ribbon } from '@/examEditor/Ribbon'
import { TabStrip } from '@/examEditor/TabStrip'
import { StartTab } from '@/examEditor/StartTab'
import { NavPanel, type PaneTab } from '@/examEditor/NavPanel'
import type { ToolDoc, ToolImage } from '@/lib/toolSpec'

/** chỗ đặt đồ thị: thay ảnh cũ, hoặc chèn thành đoạn mới tại vị trí giữa hai khối */
type PlotTarget = { replace: number } | { after: number }
import { insertBlockTemplate, type BlockTemplate } from '@/examEditor/templates'
import { AiDock, Ruler, useViewportSize } from '@/examEditor/Layout'
import { tipTapToBlocks, blocksToTipTap } from '@/examEditor/convert'
import { useFormatState, applyFormatAttrs } from '@/examEditor/formatState'
import { useComposeStore } from '@/store/compose'
import { useDocStore } from '@/store/docs'
import { useOnline } from '@/store/online'
import { docToExam } from '@/lib/docToExam'
import { examToDraft } from '@/lib/onlineExam'
import { DECK_THEMES } from '@/lib/slideTheme'
import { applyExamReply } from '@/examEditor/examAiResult'
import { importedSlides, readImportFile, textToBlocks } from '@/lib/importFile'
import { IconZoomIn, IconZoomOut } from '@/examEditor/icons'
import type { ExamBlock, ExamDoc } from '@/data/docTypes'
import { emptyDoc } from '@/data/docTypes'
import { cn } from '@/lib/cn'
import { attachToAi } from '@/lib/aiAttach'
import { blocksText, examDigest, focusNote, type AiApplyResult } from '@/lib/aiDocContext'
import { reportAi, takeRecentAiTurn } from '@/lib/aiFeedback'

const SESSION_KEY = 'dethinhbien-compose-session'
const MOBILE_VIEW_KEY = 'dethinhbien-mobile-view'
type ComposeSession = { ids: string[]; active: string | null; start: boolean }

function readSession(): ComposeSession | null {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null')
  } catch {
    return null
  }
}

/** Mở lại các tab của phiên trước (sau F5) từ kho tài liệu — tab trống chưa từng lưu thì bỏ qua. */
function restoreSession() {
  const session = readSession()
  const compose = useComposeStore.getState()
  if (!session || compose.tabs.length > 0) return
  const { myDocs, myDecks } = useDocStore.getState()
  for (const id of session.ids) {
    if (id.startsWith('board-')) {
      compose.newBoard(id, useBoards.getState().items.find((b) => b.id === id)?.title)
      continue
    }
    const deck = myDecks.find((d) => d.id === id)
    if (deck) compose.openDeck(deck)
    else {
      const doc = myDocs.find((d) => d.id === id)
      if (doc) compose.openDoc(doc)
    }
  }
  const { tabs } = useComposeStore.getState()
  if (session.active && tabs.some((t) => t.id === session.active)) compose.setActive(session.active)
}

// trình soạn slide (pptxgen, bố cục, trình chiếu…) chỉ tải khi mở tab slide
const loadSlideEditor = () => import('@/examEditor/SlideEditor')
const BoardEditor = lazyPage(() => import('@/pages/Board'))
// trình soạn văn bản (TipTap) và trợ lý AI (kéo theo dữ liệu slide) tải sau: tab bảng vẽ/slide không cần chờ
const ExamEditor = lazyPage(() => import('@/examEditor/ExamEditor').then((m) => ({ default: m.ExamEditor })))
const FindPanel = lazyPage(() => import('@/examEditor/FindPanel').then((m) => ({ default: m.FindPanel })))
const DocSelectionAi = lazyPage(() => import('@/examEditor/DocSelectionAi').then((m) => ({ default: m.DocSelectionAi })))
const ToolModal = lazyPage(() => import('@/examEditor/tools/ToolModal').then((m) => ({ default: m.ToolModal })))

/**
 * Công cụ vẽ hình (toolSpec ~100 KB gzip: hình học, mạch điện, phả hệ…) nạp sau, không chặn lúc mở trang.
 * Tải sẵn ngay khi trình soạn sẵn sàng (xem effect gọi `loadTools`), nên lúc AI trả đề có hình thì đã có.
 */
type ToolMods = { ti: typeof import('@/examEditor/toolImages'); ts: typeof import('@/lib/toolSpec'); plot: typeof import('@/lib/plot') }
let tools: ToolMods | null = null
let toolsLoading: Promise<ToolMods> | null = null
const loadTools = (): Promise<ToolMods> =>
  (toolsLoading ??= Promise.all([
    import('@/examEditor/toolImages'),
    import('@/lib/toolSpec'),
    import('@/lib/plot'),
    // kho hình đồ vật (tranh đếm tiểu học): phải có trước khi vẽ, kẻo hình ra ô trống
    import('@/lib/figureSprites').then((m) => m.loadSprites()),
  ]).then(
    ([ti, ts, plot]) => (tools = { ti, ts, plot }),
  ))
const AiPanel = lazyPage(() => import('@/examEditor/AiPanel').then((m) => ({ default: m.AiPanel })))
const SlideEditor = lazyPage(() => loadSlideEditor().then((m) => ({ default: m.SlideEditor })))

/** khung giữ chỗ lúc trình soạn slide chưa tải xong: có sẵn thanh ribbon + vùng slide mờ, không để trắng phía trên */
/** khung chờ của bảng vẽ: thanh công cụ, hàng tuỳ chọn, mặt bảng */
function BoardSkeleton() {
  return (
    // cùng màu, cùng chiều cao với thanh công cụ thật của BoardEditor (bg-surface, h-12 + h-11, một đường kẻ dưới)
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white" aria-busy="true" aria-label="Đang tải bảng vẽ">
      <div className="shrink-0 animate-pulse border-b border-line bg-surface">
      <div className="flex h-12 items-end gap-2 px-3 pb-1">
        <div className="mb-0.5 size-7 rounded-md bg-line/70" />
        <div className="mb-0.5 size-7 rounded-md bg-line/70" />
        <span className="mb-1.5 h-5 w-px bg-line" />
        <div className="flex h-[38px] items-center gap-1.5 rounded-[10px] bg-sunken px-[3px]">
          {[52, 50, 54, 52, 50, 46, 48].map((w, i) => <div key={i} className="h-6 rounded-[7px] bg-line/80" style={{ width: w }} />)}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {[60, 76, 72, 28, 44].map((w, i) => <div key={i} className="h-6 rounded-[7px] bg-line/70" style={{ width: w }} />)}
        </div>
      </div>
      <div className="flex h-11 items-center gap-2 px-3 pb-1">
        <div className="h-2.5 w-8 rounded bg-line" />
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="size-5 rounded-full bg-line/80" />)}
        <div className="mx-2 h-5 w-px bg-line" />
        <div className="h-2.5 w-10 rounded bg-line" />
        {[6, 8, 10, 12, 14, 16].map((d, i) => <div key={i} className="rounded-full bg-line/80" style={{ width: d, height: d }} />)}
      </div>
      </div>
      {/* mặt bảng: trắng như bảng thật, vài khối mờ thay cho nội dung đang tải */}
      <div className="relative min-h-0 flex-1 animate-pulse bg-white">
        <div className="absolute left-[12%] top-[18%] h-24 w-40 rounded-lg bg-sunken" />
        <div className="absolute left-[38%] top-[30%] h-3 w-56 rounded-full bg-sunken" />
        <div className="absolute left-[40%] top-[38%] h-3 w-40 rounded-full bg-sunken" />
        <div className="absolute right-[14%] top-[22%] size-28 rounded-full bg-sunken/70" />
      </div>
    </div>
  )
}

function SlideEditorSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col animate-pulse">
      <div className="flex h-[34px] items-end gap-5 border-b border-line bg-paper px-4 pb-2">
        {[44, 52, 40, 60, 48].map((w, i) => <div key={i} className="h-2.5 rounded bg-line" style={{ width: w }} />)}
      </div>
      <div className="flex h-[88px] items-center gap-3 border-b border-line bg-paper px-4">
        {Array.from({ length: 9 }, (_, i) => <div key={i} className="size-12 rounded-lg bg-line/70" />)}
      </div>
      <div className="flex min-h-0 flex-1 gap-4 bg-canvas p-4">
        <div className="hidden w-[180px] flex-col gap-3 md:flex">
          {[0, 1, 2].map((i) => <div key={i} className="aspect-video rounded-md bg-line/60" />)}
        </div>
        <div className="flex flex-1 items-center justify-center"><div className="aspect-video w-full max-w-[880px] rounded-lg bg-line/50" /></div>
      </div>
    </div>
  )
}

export default function ComposeDoc() {
  const navigate = useNavigate()
  const viewport = useViewportSize()
  // tải sẵn trình soạn slide khi rảnh → bấm "Slide" là hiện ngay, không thấy khung chờ
  useEffect(() => {
    const t = setTimeout(() => loadSlideEditor().catch(() => {}), 800)
    return () => clearTimeout(t)
  }, [])

  const {
    tabs,
    activeId,
    contents,
    decks,
    newDoc,
    newSlide,
    newBoard,
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
  // trang khác đã mở sẵn một tab (vd. Lưu vào trình soạn thảo ở trang xem đề) thì vào thẳng tab đó
  // create: trang chủ bấm "Mở bảng vẽ" / "Mở ngay" (Slide) → mở thẳng một slide / bảng vẽ trống
  const { state: navState } = useLocation() as { state: { openTab?: boolean; open?: { kind: 'exam' | 'slide' | 'board'; id: string }; create?: 'slide' | 'board' } | null }
  // F5 không về màn Bắt đầu: phiên (tab đang mở, tab đang xem) giữ trong sessionStorage — xem effect khôi phục bên dưới
  const [startChosen, setStartOpen] = useState(() => (navState?.openTab || navState?.create ? false : (readSession()?.start ?? true)))
  // không còn tab nào (mới vào trang, hoặc vừa đóng tab cuối) thì luôn ở màn Bắt đầu
  const startOpen = startChosen || tabs.length === 0
  // màn hẹp (tablet/điện thoại): trợ lý AI nổi đè lên trang nên mặc định đóng
  const [aiOpen, setAiOpen] = useState(() => window.innerWidth >= 1024)
  const [navOpen, setNavOpen] = useState(true)
  const [navTab, setNavTab] = useState<PaneTab>('toc')
  const openNavWithTab = useCallback((tab: PaneTab) => {
    setNavTab(tab)
    setNavOpen(true)
  }, [])
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
  const { PAGE_W, MARGIN, MARGIN_RIGHT } = geo

  // mở lại tab của phiên trước (F5); không tự tạo tab trống — mới vào chỉ có màn Bắt đầu, người dùng tự chọn
  const restoredRef = useRef(false)
  const createdRef = useRef(false)
  useEffect(() => {
    restoreSession()
    restoredRef.current = true
    // trang "Đề của tôi" (Hồ sơ) gửi sang một mục cần mở
    const want = navState?.open
    if (want) {
      const { myDocs, myDecks } = useDocStore.getState()
      if (want.kind === 'board') newBoard(want.id, useBoards.getState().items.find((b) => b.id === want.id)?.title)
      else if (want.kind === 'slide') {
        const deck = myDecks.find((d) => d.id === want.id)
        if (deck) openDeck(deck)
      } else {
        const doc = myDocs.find((d) => d.id === want.id)
        if (doc) openDoc(doc)
      }
      navigate('.', { replace: true, state: null })
    } else if (navState?.create && !createdRef.current) {
      // StrictMode chạy effect hai lần ở dev: không tạo hai bảng/slide
      createdRef.current = true
      if (navState.create === 'board') newBoard()
      else newSlide()
      navigate('.', { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ghi lại phiên mỗi khi đổi tab / mở-đóng màn Bắt đầu
  const sessionTabs = useComposeStore((s) => s.tabs)
  useEffect(() => {
    // trước khi khôi phục xong chưa có tab — đừng ghi đè phiên cũ bằng danh sách rỗng
    if (!restoredRef.current) return
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ids: sessionTabs.map((t) => t.id), active: activeId, start: startOpen }))
    } catch {
      /* chỉ là tiện ích */
    }
  }, [sessionTabs, activeId, startOpen])

  // Tự lưu toàn bộ tab khi rời trang (đóng tab trình duyệt, tải lại, điều hướng).
  useEffect(() => {
    const flush = () => useComposeStore.getState().saveAll()
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    // và cứ 5 giây lưu các tab có thay đổi, để treo máy hay trình duyệt đóng đột ngột cũng không mất bài (rồi đồng bộ lên tài khoản)
    const timer = window.setInterval(() => {
      const s = useComposeStore.getState()
      for (const t of s.tabs) if (t.dirty) s.saveTab(t.id)
    }, 5000)
    return () => {
      window.clearInterval(timer)
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
        // chỉ dùng lại tab ĐỀ trống — tab slide/bảng vẽ không có `contents` nên trước đây bị coi nhầm là đề trống
        const only = tabs.length === 1 && tabs[0].kind !== 'slide' && tabs[0].kind !== 'board' ? tabs[0] : null
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

  const documentDigest = useMemo(() => examDigest(activeId ? contents[activeId] : undefined), [activeId, contents])

  const activeContent = useMemo<JSONContent>(
    () => contents[activeId ?? ''] ?? { type: 'doc', content: [] },
    [contents, activeId],
  )

  const activeTab = tabs.find((t) => t.id === activeId)

  // Ctrl/Cmd+F: Tìm, Ctrl/Cmd+H: Thay thế (như Word/Docs) — chỉ ở tab đề thi, thay ô tìm của trình duyệt
  const docTabOpen = !startOpen && !!editor && activeTab?.kind !== 'slide' && activeTab?.kind !== 'board'
  useEffect(() => {
    if (!docTabOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return
      const k = e.key.toLowerCase()
      if (k !== 'f' && k !== 'h') return
      e.preventDefault()
      setFindTab(k === 'f' ? 'find' : 'replace')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [docTabOpen])

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
    const { exportDocBlocks } = await import('@/examEditor/exportBlocks') // xuất Word nạp lúc bấm
    await exportDocBlocks(activeDoc, { landscape: pageSetup.orientation === 'landscape', paper: paperCm(pageSetup), margins: marginsOf(pageSetup), pageNumber: pageSetup.pageNumber, header: pageSetup.header, footer: pageSetup.footer })
  }, [activeDoc, pageSetup])

  /**
   * Tệp → Làm đề tương tác: chuyển các khối đang soạn (`docToExam`) thành bản nháp ở trang Tạo đề online
   * để chỉnh đáp án, giải thích, cài đặt rồi làm thử hoặc đăng. Chuyển rồi mà bấm lại thì hỏi mở bản đã chỉnh hay chuyển lại từ đầu.
   */
  const handleStartQuiz = useCallback(async () => {
    if (!activeDoc) return
    const exam = docToExam(activeDoc, `doc-${activeDoc.id}`)
    if (!exam.sections.some((s) => s.questions.length)) {
      await dialog.alert('Thêm câu trắc nghiệm hoặc tự luận trước nhé.', { title: 'Đề chưa có câu hỏi nào để chuyển' })
      return
    }
    const online = useOnline.getState()
    const prev = online.items.find((it) => it.sourceDocId === activeDoc.id)
    // đóng hộp bằng Esc hay bấm ra ngoài thì mở bản đã chỉnh, không mất gì
    const redo =
      prev &&
      (await dialog.confirm('Bản đã chỉnh đáp án, giải thích, cài đặt được giữ nếu bạn mở lại. Chuyển lại từ đầu thì bản đó bị thay.', {
        title: 'Đề này đã được chuyển sang Tạo đề online',
        confirmLabel: 'Chuyển lại từ đầu',
        cancelLabel: 'Mở bản đã chỉnh',
        danger: true,
      }))
    if (prev && !redo) {
      navigate(`/tao-de-online/${prev.id}`)
      return
    }
    if (prev) online.remove(prev.id)
    navigate(`/tao-de-online/${online.create({ ...examToDraft(exam), sourceDocId: activeDoc.id })}`)
  }, [activeDoc, navigate])

  /** Tệp → Nhập file: mở tệp Word/Excel/PowerPoint thành một tab đề mới. */
  const handleImportExam = useCallback(
    async (file: File) => {
      // .docx đọc trên trình duyệt để giữ định dạng; .doc/.xlsx… vẫn qua server lấy chữ
      const isDocx = /\.docx$/i.test(file.name)
      const data = isDocx ? { title: file.name.replace(/\.[^.]+$/, '').trim().slice(0, 120) || 'Tài liệu nhập', text: '' } : await readImportFile(file)
      const imported = isDocx ? await (await import('@/lib/docxImport')).docxImport(file) : null
      const blocks = imported ? imported.blocks : textToBlocks(data.text)
      // lề và hướng trang theo tệp Word (khổ giấy vẫn A4)
      const page = imported?.page
      if (page) setPageSetup((p) => ({ ...p, margins: page.margins, orientation: page.orientation }))
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
      if (/\.pptx$/i.test(file.name)) {
        if (file.size > 40 * 1024 * 1024) throw new Error('Tệp quá lớn (tối đa 40 MB).')
        const { importPptx } = await import('@/lib/pptxImport')
        const deck = await importPptx(file)
        const id = newSlide()
        updateDeck(id, deck)
        return
      }
      const data = await readImportFile(file)
      const id = newSlide()
      updateDeck(id, { title: data.title, slides: importedSlides(data, DECK_THEMES[0]) })
    },
    [newSlide, updateDeck],
  )

  const handlePrint = useCallback(() => {
    if (!activeDoc) return
    void import('@/examEditor/exportBlocks').then(({ printDoc }) => printDoc(activeDoc, { landscape: pageSetup.orientation === 'landscape', paper: paperCm(pageSetup), margins: marginsOf(pageSetup), pageNumber: pageSetup.pageNumber, header: pageSetup.header, footer: pageSetup.footer }))
  }, [activeDoc, pageSetup])

  // hoàn tác ngay sau khi AI sửa đề = tín hiệu AI làm chưa đúng ý (bảng ai_feedback)
  useEffect(() => {
    if (!editor) return
    const on = ({ transaction }: { transaction: { getMeta: (k: string) => unknown } }) => {
      const meta = transaction.getMeta('history$') as { redo?: boolean } | undefined
      if (!meta || meta.redo) return
      const t = takeRecentAiTurn()
      if (t) reportAi('undo', t)
    }
    editor.on('transaction', on)
    return () => void editor.off('transaction', on)
  }, [editor])

  const handleAiResult = useCallback(
    (text: string, allowReplace: boolean): AiApplyResult => {
      const current = useComposeStore.getState()
      if (!activeId || !editor || editor.isDestroyed || current.activeId !== activeId || current.contents[activeId] !== contents[activeId])
        return { text: 'Đề đã thay đổi trong khi AI xử lý. Hãy gửi lại yêu cầu.', failed: true, retryable: false }
      return applyExamReply(editor, text, allowReplace, (figure) => {
        const ti = tools?.ti
        const doc = ti?.figureDoc(figure)
        return doc ? ti?.figureImageAttrs(doc) : undefined
      }, () => {
        setTimeout(() => void loadTools().then(({ ti }) => ti.pngifyToolImages(editor)), 0)
      }, (name) => {
        const tab = current.tabs.find((t) => t.id === activeId)
        if (tab && (!tab.title.trim() || tab.title === 'Đề thi mới')) renameTab(activeId, name)
      })
    },
    [activeId, contents, editor, renameTab],
  )

  /** Chèn khối mẫu — đường chèn chung xem `insertBlockTemplate` (templates.ts). */
  const handleInsertTemplate = useCallback(
    (tpl: BlockTemplate) => {
      if (!editor || editor.isDestroyed) return
      insertBlockTemplate(editor, tpl)
    },
    [editor],
  )

  /** Chèn danh sách khối vào cuối đề (sau ngắt trang). */
  const handleInsertBlocks = useCallback(
    (newBlocks: ExamBlock[]) => {
      if (!editor || editor.isDestroyed) return
      const tipTapDoc = blocksToTipTap(newBlocks)
      const nodes = tipTapDoc.content ?? []
      if (!nodes.length) return
      editor
        .chain()
        .focus('end')
        .insertContentAt(editor.state.doc.content.size, nodes)
        .run()
    },
    [editor],
  )

  /**
   * Chèn đồ thị (công cụ Toán) tại con trỏ — dạng PNG vì bản xuất Word không đọc SVG;
   * cấu hình đi kèm trong attr `plot` để nhấp đúp sửa lại. `replace`: thay ảnh cũ ở vị trí đó;
   * `after`: đặt thành đoạn riêng (căn giữa) tại vị trí giữa hai khối, vd. ngay dưới câu hỏi.
   */
  const handleInsertPlot = useCallback(
    async (img: ToolImage, target?: PlotTarget) => {
      if (!editor || editor.isDestroyed) return
      try {
        const { ti, ts, plot: plotLib } = await loadTools()
        const src = await plotLib.svgToPng(img.svg, img.width, img.height)
        if (editor.isDestroyed) return
        const doc = ts.readToolDoc(img.svg)
        const plot = JSON.stringify(doc)
        const look = ti.TOOL_DOC_IMAGE[doc?.kind ?? 'graph']
        const attrs = { src, alt: look.alt, width: ti.toolImageWidth(doc?.kind ?? 'graph', img.width), plot }
        const node = target && 'replace' in target ? editor.state.doc.nodeAt(target.replace) : null
        if (target && 'replace' in target && node?.type.name === 'image') {
          editor.view.dispatch(editor.state.tr.setNodeMarkup(target.replace, undefined, { ...node.attrs, src, plot }))
        } else if (target && 'after' in target && target.after <= editor.state.doc.content.size) {
          editor
            .chain()
            .insertContentAt(target.after, { type: 'paragraph', attrs: { textAlign: 'center' }, content: [{ type: 'image', attrs }] })
            .setNodeSelection(target.after + 1)
            .scrollIntoView()
            .run()
        } else {
          editor.chain().focus().setImage(attrs).run()
        }
      } catch (err) {
        void dialog.alert(err instanceof Error ? err.message : String(err))
      }
    },
    [editor],
  )

  // nhấp đúp ảnh đồ thị trong trang → mở lại công cụ Đồ thị với cấu hình cũ
  const [plotEdit, setPlotEdit] = useState<{ doc: ToolDoc; target: PlotTarget } | null>(null)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const dom = editor.view.dom
    const onDbl = (e: MouseEvent) => {
      const img = (e.target as HTMLElement).closest?.('img[data-plot]')
      if (!img) return
      const raw = img.getAttribute('data-plot')
      const pos = editor.view.posAtDOM(img.closest('.exam-image') ?? img, 0)
      void loadTools().then(({ ts }) => {
        const doc = ts.parseToolJson(raw)
        if (doc) setPlotEdit({ doc, target: { replace: pos } })
      })
    }
    dom.addEventListener('dblclick', onDbl)
    // trình soạn đã sẵn sàng: tải sẵn công cụ vẽ hình lúc rảnh (AI chèn hình, nhấp đúp sửa hình)
    void loadTools()
    return () => dom.removeEventListener('dblclick', onDbl)
  }, [editor])

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

  const isPhone = viewport.w > 0 && viewport.w < 640
  const isTablet = viewport.w >= 640 && viewport.w < 1024
  const isMobile = isPhone
  const layoutMode: 'desktop' | 'tablet' | 'phone' = isPhone ? 'phone' : isTablet ? 'tablet' : 'desktop'

  const [mobileView, setMobileView] = useState<'reflow' | 'paged'>(() => {
    try {
      const saved = localStorage.getItem(MOBILE_VIEW_KEY)
      if (saved === 'paged' || saved === 'reflow') return saved
    } catch {}
    return 'reflow'
  })

  const isReflow = isPhone && mobileView === 'reflow'

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const sync = () => setStageBox({ w: el.clientWidth, h: el.clientHeight })
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
    // khung soạn chỉ có khi rời màn Bắt đầu / tab slide / bảng vẽ — đo lại lúc nó xuất hiện, không thì autofit kẹt ở 100%
  }, [startOpen, activeDeck?.id, activeTab?.kind, isReflow])

  // co trang A4 vừa chiều rộng khung nhìn (như Word), giới hạn 25%–130%.
  // Sàn thấp là 25% vì khi cả AI dock + nav pane đều mở trên màn hình hẹp,
  // trang vẫn phải nhìn thấy được (sân cuộn ngang được).
  const fitScale = useMemo(() => {
    const availW = isPhone ? Math.min(stageBox.w || viewport.w, viewport.w) : stageBox.w
    if (!availW) return 1
    const pad = isPhone ? 24 : 56
    const usableW = Math.max(120, availW - pad)
    const byW = usableW / PAGE_W
    return Math.max(0.25, Math.min(1.3, byW))
  }, [stageBox, PAGE_W, isPhone, viewport.w])

  // zoom bấm tay thì bỏ auto-fit
  const setZoomManual = useCallback((z: number) => {
    setAutoFit(false)
    setZoom(z)
  }, [])

  const toggleMobileView = useCallback(() => {
    setMobileView((prev) => {
      const next = prev === 'reflow' ? 'paged' : 'reflow'
      try {
        localStorage.setItem(MOBILE_VIEW_KEY, next)
      } catch {}
      return next
    })
  }, [])

  const effectiveZoom = isReflow ? 100 : (autoFit ? Math.floor(fitScale * 100) : zoom)
  const effectiveScale = isReflow ? 1 : effectiveZoom / 100

  // trên màn hình hẹp, ưu tiên sân soạn: tự thu gọn panel bên
  useEffect(() => {
    if (viewport.w > 0 && viewport.w < 1100) setNavOpen(false)
    if (viewport.w > 0 && viewport.w < 860) setAiOpen(false)
  }, [viewport.w])

  // màn laptop (< 1440px): mở trợ lý AI thì thu cột Mục lục về dải icon để trang đề không bị bóp nhỏ
  // (chỉ chạy khi AI vừa mở / đổi cỡ màn — người dùng vẫn bấm mở lại cột được)
  useEffect(() => {
    if (aiOpen && viewport.w > 0 && viewport.w < 1440) setNavOpen(false)
  }, [aiOpen, viewport.w])

  return (
    <div className={cn('compose-app', isReflow && 'is-reflow')}>
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
          }}
          onNew={() => newDocAndOpen(false)}
          onNewSlide={() => {
            newSlide()
            setStartOpen(false)
          }}
          onNewBoard={() => {
            newBoard()
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
          onNewBoard={() => {
            newBoard()
            setStartOpen(false)
          }}
          onOpenDeck={(deck) => {
            openDeck(deck)
            setStartOpen(false)
          }}
          onOpenBoard={(id, title) => {
            newBoard(id, title)
            setStartOpen(false)
          }}
        />
      ) : activeTab?.kind === 'board' ? (
        <div className="compose-body">
          <PageErrorBoundary resetKey={activeTab.id}>
          <Suspense fallback={<BoardSkeleton />}>
            <BoardEditor key={activeTab.id} id={activeTab.id} />
          </Suspense>
          </PageErrorBoundary>
        </div>
      ) : activeDeck ? (
        /* ---------- tab slide: trình soạn trình chiếu dùng chung với /soan-slide ---------- */
        <div className="compose-body">
          <PageErrorBoundary resetKey={activeDeck.id}>
          <Suspense fallback={<SlideEditorSkeleton />}>
          <SlideEditor
            deck={activeDeck}
            updateDeck={(patch) => updateDeck(activeDeck.id, patch)}
            onSave={handleSaveSlide}
            onNewDeck={newSlide}
            onImportFile={handleImportSlides}
          />
          </Suspense>
          </PageErrorBoundary>
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
        margins={marginsOf(pageSetup)}
        onMarginsChange={(margins) => setPageSetup((p) => ({ ...p, margins }))}
        orientation={pageSetup.orientation}
        onOrientationChange={(o) => setPageSetup((p) => ({ ...p, orientation: o }))}
        pageSize={pageSetup.size ?? 'A4'}
        onPageSizeChange={(size) => setPageSetup((p) => ({ ...p, size }))}
        pageColor={pageSetup.pageColor}
        onPageColorChange={(c) => setPageSetup((p) => ({ ...p, pageColor: c }))}
        pageBorder={pageSetup.pageBorder}
        onPageBorderChange={(w) => setPageSetup((p) => ({ ...p, pageBorder: w }))}
        pageNumber={pageSetup.pageNumber}
        onPageNumberChange={(pn) => setPageSetup((p) => ({ ...p, pageNumber: pn }))}
        header={pageSetup.header}
        footer={pageSetup.footer}
        onHeaderChange={(header) => setPageSetup((p) => ({ ...p, header }))}
        onFooterChange={(footer) => setPageSetup((p) => ({ ...p, footer }))}
        onOpenNav={openNavWithTab}
        layoutMode={layoutMode}
      />

      {/* ---------- thân ---------- */}
      <div className="compose-body">
        {/* mục lục / khối mẫu / công cụ (trái) */}
        <NavPanel
          doc={activeContent}
          open={navOpen}
          onOpenChange={setNavOpen}
          onInsertTemplate={handleInsertTemplate}
          onGoToBlock={handleGoToBlock}
          onInsertPlot={(img) => void handleInsertPlot(img)}
          onInsertBlocks={handleInsertBlocks}
          examDoc={activeDoc}
          side="left"
          isMobile={isMobile}
          isOverlay={isTablet}
          currentTab={navTab}
          onTabChange={setNavTab}
        />
        {/* sân soạn (giữa) */}
        <div className="compose-center">
          {findTab && editor && (
            <Suspense fallback={null}><FindPanel editor={editor} initialTab={findTab} onClose={() => setFindTab(null)} /></Suspense>
          )}
          <div className="compose-scroll" ref={stageRef}>
            {/* `zoom` (không phải transform) để thước kẻ và trang giấy co cùng
                tỉ lệ và container vẫn đúng bề rộng — giống GenOffice `.doc-zoom`. */}
            <div
              className={cn('compose-canvas anim-tab-in', isReflow && 'is-reflow')}
              key={activeId ?? 'none'}
              style={{ zoom: isReflow ? 1 : effectiveScale, ['--page-zoom' as string]: isReflow ? 1 : effectiveScale }}
            >
              {!isReflow && (
                <Ruler
                  width={PAGE_W}
                  margin={MARGIN}
                  marginRight={MARGIN_RIGHT}
                  indentLeft={format.indentLeft}
                  indentFirstLine={format.indentFirstLine}
                  onIndentChange={(patch) => {
                    if (editor) applyFormatAttrs(editor, patch)
                  }}
                  onMarginChange={(px, side) =>
                    setPageSetup((p) => ({ ...p, margins: { ...marginsOf(p), [side]: Math.round((px / CM) * 10) / 10 } }))
                  }
                />
              )}
              <Suspense fallback={null}>
                <ExamEditor
                  key={activeId ?? 'none'}
                  content={activeContent}
                  onChange={onChange}
                  onReady={handleEditorReady}
                  pageSetup={pageSetup}
                  isReflow={isReflow}
                />
              </Suspense>
            </div>
          </div>

          {/* thanh trạng thái */}
          <div className="status-bar">
            <div className="status-left">
              <span className="status-item">{pageCount} trang</span>
              {/* chỉ khổ + hướng; số đo lề để trong tooltip cho thanh trạng thái gọn */}
              <span
                className="status-item"
                data-tip={(() => {
                  const m = marginsOf(pageSetup)
                  const f = (n: number) => n.toLocaleString('vi-VN')
                  return m.top === m.bottom && m.left === m.right && m.top === m.left
                    ? `Lề ${f(m.top)} cm`
                    : `Lề trên ${f(m.top)}, dưới ${f(m.bottom)}, trái ${f(m.left)}, phải ${f(m.right)} cm`
                })()}
              >
                {PAGE_SIZES[pageSetup.size ?? 'A4'].label} {pageSetup.orientation === 'landscape' ? 'ngang' : 'dọc'}
              </span>
              <span className="status-item">{activeTab?.dirty ? 'Chưa lưu' : 'Đã lưu'}</span>
            </div>
            <div className="status-right">
              {isMobile ? (
                <button
                  type="button"
                  className="mobile-view-toggle-btn"
                  onClick={toggleMobileView}
                  data-tip={isReflow ? 'Chuyển sang xem trang A4' : 'Chuyển sang dàn trang theo màn hình'}
                >
                  {isReflow ? 'Xem trang A4' : 'Dàn trang'}
                </button>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>

        {/* nav pane (phải) */}
        <Suspense fallback={null}>
        <DocSelectionAi
          editor={editor}
          context={activeDoc ? `đề "${activeDoc.title}"` : undefined}
          onInsertPlot={(img, after) => void handleInsertPlot(img, { after })}
          onEditPlot={(doc, after) => setPlotEdit({ doc, target: { after } })}
          onAskChat={(text) => {
            const t = text.trim()
            // gửi kèm nguyên văn đầy đủ các khối chứa phần đang bôi đen (công thức, phương án, hình) để AI sửa đúng chỗ
            let full = ''
            if (editor && !editor.isDestroyed) {
              const { from, to } = editor.state.selection
              const doc = editor.state.doc
              const idx: number[] = []
              let pos = 0
              for (let i = 0; i < doc.childCount; i++) {
                const end = pos + doc.child(i).nodeSize
                if (end > from && pos < Math.max(to, from + 1)) idx.push(i)
                pos = end
              }
              full = blocksText(editor.getJSON(), idx.slice(0, 8))
            }
            attachToAi('exam', [{
              id: `sel-${t.length}-${t.slice(0, 40)}`,
              label: `“${t.length > 26 ? `${t.slice(0, 26)}…` : t}”`,
              detail: `đoạn đang bôi đen trong đề: "${t.slice(0, 2000)}"${full ? `\nNguyên văn khối chứa đoạn này (JSON đầy đủ, dùng đúng id trong ngoặc vuông khi patch):\n${full}` : ''}`,
            }])
            setAiOpen(true)
          }}
        />
        </Suspense>
        {plotEdit && (
          <Suspense fallback={null}>
          <ToolModal
            kind={plotEdit.doc.kind}
            initial={plotEdit.doc.spec}
            submitLabel={'after' in plotEdit.target ? 'Chèn hình' : undefined}
            onClose={() => setPlotEdit(null)}
            onInsert={(img) => {
              void handleInsertPlot(img, plotEdit.target)
              setPlotEdit(null)
            }}
          />
          </Suspense>
        )}
        {/* AI dock (phải, như soạn slide) */}
        <AiDock open={aiOpen} onToggle={() => setAiOpen((v) => !v)} width={360} side="right">
          <Suspense fallback={null}>
          <AiPanel
            attachKey="exam"
            historyKey={activeDoc?.id}
            onApplyBlocks={handleAiResult}
            documentDigest={documentDigest}
            focusFor={(request) => focusNote(activeContent, request)}
            contextSummary={
              activeDoc
                ? `đề đang soạn: "${activeDoc.title}", ${activeDoc.blocks.length} khối`
                : undefined
            }
          />
          </Suspense>
        </AiDock>

      </div>
        </>
      )}
    </div>
  )
}

export { pageGeometry }
