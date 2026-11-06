/**
 * Ảnh công cụ vẽ chèn tự động (AI soạn đề, kho câu hỏi): vẽ từ cấu hình thành SVG để chèn ngay,
 * rồi `pngifyToolImages` đổi sang PNG (xuất Word không đọc SVG). Cấu hình nằm trong attr `plot`
 * nên nhấp đúp vẫn mở lại đúng công cụ.
 */
import type { Editor, JSONContent } from '@tiptap/core'
import { svgDataUrl, svgToPng } from '@/lib/plot'
import { parseToolJson, renderTool, type ToolDoc, type ToolKind } from '@/lib/toolSpec'
import { toolFromRaw } from '@/lib/docRewrite'

/** bề rộng mặc định (px) và chữ thay thế của ảnh công cụ trong trang đề */
export const TOOL_DOC_IMAGE: Record<ToolKind, { width: number; alt: string }> = {
  graph: { width: 300, alt: 'Đồ thị hàm số' },
  vartable: { width: 460, alt: 'Bảng biến thiên' },
  geo2d: { width: 260, alt: 'Hình vẽ' },
  geo3d: { width: 260, alt: 'Hình vẽ' },
  signtable: { width: 440, alt: 'Bảng xét dấu' },
  oxy: { width: 280, alt: 'Hệ trục toạ độ' },
  stats: { width: 380, alt: 'Biểu đồ' },
  circuit: { width: 360, alt: 'Mạch điện' },
  motion: { width: 320, alt: 'Đồ thị chuyển động' },
  incline: { width: 300, alt: 'Mặt phẳng nghiêng' },
  gas: { width: 300, alt: 'Đồ thị trạng thái khí' },
  scene: { width: 300, alt: 'Hình vẽ' },
  electron: { width: 360, alt: 'Cấu hình electron' },
  struct: { width: 280, alt: 'Công thức cấu tạo' },
  chemgraph: { width: 320, alt: 'Đồ thị số mol' },
  trig: { width: 260, alt: 'Đường tròn lượng giác' },
  probtree: { width: 380, alt: 'Sơ đồ cây' },
  numberline: { width: 400, alt: 'Trục số' },
  venn: { width: 260, alt: 'Biểu đồ Ven' },
}

/** cấu hình dạng chữ (như AI trả, hoặc trong kho câu hỏi) → ToolDoc; sai thì null */
export function figureDoc(raw: unknown): ToolDoc | null {
  if (!raw || typeof raw !== 'object') return null
  try {
    return toolFromRaw(raw as Record<string, unknown>)
  } catch {
    return null
  }
}

/** attr ảnh (src SVG tạm) cho một hình công cụ */
export function figureImageAttrs(doc: ToolDoc) {
  const look = TOOL_DOC_IMAGE[doc.kind]
  return { src: svgDataUrl(renderTool(doc).svg), alt: look.alt, width: look.width, plot: JSON.stringify(doc) }
}

/** đoạn căn giữa chứa ảnh hình công cụ, để đặt ngay dưới câu hỏi */
export function figureParagraph(doc: ToolDoc): JSONContent {
  return { type: 'paragraph', attrs: { textAlign: 'center' }, content: [{ type: 'image', attrs: figureImageAttrs(doc) }] }
}

/** ảnh công cụ còn ở dạng SVG → PNG, giữ nguyên attr khác */
export async function pngifyToolImages(editor: Editor) {
  const jobs: Array<{ pos: number; doc: ToolDoc }> = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== 'image' || !String(node.attrs.src).startsWith('data:image/svg')) return
    const doc = parseToolJson(node.attrs.plot)
    if (doc) jobs.push({ pos, doc })
  })
  for (const { pos, doc } of jobs) {
    const img = renderTool(doc)
    const src = await svgToPng(img.svg, img.width, img.height).catch(() => null)
    if (!src || editor.isDestroyed) continue
    const node = editor.state.doc.nodeAt(pos)
    if (node?.type.name === 'image' && String(node.attrs.src).startsWith('data:image/svg'))
      editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, src }))
  }
}
