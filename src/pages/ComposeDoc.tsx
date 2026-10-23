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
import type { Editor } from '@tiptap/core'
import type { JSONContent } from '@tiptap/core'
import { ExamEditor, pageGeometry, CM, type PageSetup } from '@/examEditor/ExamEditor'
import { Ribbon } from '@/examEditor/Ribbon'
import { TabStrip } from '@/examEditor/TabStrip'
import { AiPanel } from '@/examEditor/AiPanel'
import { StartTab } from '@/examEditor/StartTab'
import { NavPanel } from '@/examEditor/NavPanel'
import type { BlockTemplate } from '@/examEditor/templates'
import { AiDock, NavPane, Ruler, useViewportSize } from '@/examEditor/Layout'
import { tipTapToBlocks, blocksToTipTap } from '@/examEditor/convert'
import { useFormatState, applyFormatAttrs, getSelectedBlock, syncDomSelection } from '@/examEditor/formatState'
import { FindPanel } from '@/examEditor/FindPanel'
import { exportDocBlocks, printDoc } from '@/examEditor/exportBlocks'
import { useComposeStore } from '@/store/compose'
import { SlideEditor } from '@/examEditor/SlideEditor'
import { extractJson } from '@/lib/llm'
import { IconZoomIn, IconZoomOut } from '@/examEditor/icons'
import type { ExamBlock, ExamDoc } from '@/data/docTypes'
import { emptyDoc } from '@/data/docTypes'

export default function ComposeDoc() {
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
      setContent(activeId, doc, { pushHistory: true })
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

  const handlePrint = useCallback(() => {
    if (!activeDoc) return
    printDoc(activeDoc)
  }, [activeDoc])

  /** AI trả về JSON đề → nạp vào tài liệu hiện tại. */
  const handleAiResult = useCallback(
    (text: string) => {
      if (!activeId || !editor) return
      try {
        const raw = extractJson<{ title?: string; blocks?: ExamBlock[] }>(text)
        if (!raw.blocks?.length) return
        editor.commands.setContent(blocksToTipTap(raw.blocks))
      } catch {
        /* AI trả lời tự do — không phải JSON thì bỏ qua, người dùng đọc trong panel */
      }
    },
    [activeId, editor],
  )

  /** Chèn khối mẫu ở CẤP BLOCK (sau khối cấp cao nhất đang chứa con trỏ). */
  const handleInsertTemplate = useCallback(
    (tpl: BlockTemplate) => {
      if (!editor || editor.isDestroyed) return
      syncDomSelection(editor)
      const target = getSelectedBlock(editor)
      if (!target) {
        editor.chain().focus().insertContent(tpl.build()).run()
        return
      }
      const at = target.pos + target.node.nodeSize
      editor.chain().focus().insertContentAt(at, tpl.build()).run()
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
            onRename={(title) => {
              updateDeck(activeDeck.id, { title })
              renameTab(activeDeck.id, title)
            }}
          />
        </div>
      ) : (
        <>
      {/* ---------- ribbon (hàng tab → ribbon body) ---------- */}
      <Ribbon
        editor={editor}
        activeTab={ribbonTab}
        onTabChange={setRibbonTab}
        onSave={handleSave}
        onPrint={handlePrint}
        onExportWord={handleExportWord}
        onExportPdf={handlePrint}
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
