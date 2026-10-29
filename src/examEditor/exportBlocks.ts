/**
 * Xuất tài liệu đề (ExamDoc) ra Word / in A4.
 *
 * Tách riêng khỏi `exportDocx.ts` vì file đó xuất từ mô hình `Exam` (dùng cho
 * đề cộng đồng), còn trình soạn dùng mô hình block `ExamDoc`.
 */
import type { ExamBlock, ExamDoc, FormatAttrs, RichText, Span } from '@/data/docTypes'
import { splitRichLines } from './convert'

/* ------------------------------------------------------------------ *
 * Word (.doc)
 * ------------------------------------------------------------------ */

export async function exportDocBlocks(doc: ExamDoc): Promise<void> {
  const html = buildWordHtml(doc)
  const blob = new Blob(['﻿', html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitize(doc.title)}.doc`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

function sanitize(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, '-').trim() || 'de-thi'
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Rich text → HTML có mark (`<b>/<i>/<u>/<s>/<sub>/<sup>/<span style>`). */
function richToHtml(rt: RichText): string {
  if (typeof rt === 'string') return escapeHtml(rt)
  return rt.map(spanToHtml).join('')
}

/** Mỗi dòng của đầu đề thành một dòng trong ô bảng (Word không cần paragraph). */
function richLines(rt: RichText): string {
  return splitRichLines(rt)
    .map((line) => richToHtml(line))
    .join('<br>')
}

function spanToHtml(s: Span): string {
  let inner = escapeHtml(s.text)
  for (const m of s.marks ?? []) {
    switch (m.type) {
      case 'bold':
        inner = `<b>${inner}</b>`
        break
      case 'italic':
        inner = `<i>${inner}</i>`
        break
      case 'underline':
        inner = `<u>${inner}</u>`
        break
      case 'strike':
        inner = `<s>${inner}</s>`
        break
      case 'sub':
        inner = `<sub>${inner}</sub>`
        break
      case 'super':
        inner = `<sup>${inner}</sup>`
        break
      case 'boxed':
        inner = `<span style="border:1px solid #000;padding:0 4px;display:inline-block">${inner}</span>`
        break
      case 'highlight': {
        const c = (m.attrs?.color as string | undefined) ?? '#fff3a3'
        inner = `<span style="background:${c}">${inner}</span>`
        break
      }
      case 'textStyle': {
        const a = m.attrs ?? {}
        const st: string[] = []
        if (a.fontFamily) st.push(`font-family:${a.fontFamily}`)
        if (a.fontSize) st.push(`font-size:${a.fontSize}`)
        if (a.color) st.push(`color:${a.color}`)
        if (st.length) inner = `<span style="${st.join(';')}">${inner}</span>`
        break
      }
    }
  }
  return inner
}

/** FormatAttrs → inline style cho thẻ block (align/line-height/indent/space/border/shading). */
function formatCss(f: FormatAttrs | undefined): string {
  if (!f) return ''
  const st: string[] = []
  if (f.align) st.push(`text-align:${f.align}`)
  if (f.lineHeight != null) st.push(`line-height:${f.lineHeight}`)
  if (f.indentLeft != null) st.push(`margin-left:${f.indentLeft}px`)
  if (f.indentFirstLine != null) st.push(`text-indent:${f.indentFirstLine}px`)
  if (f.spaceBefore != null) st.push(`margin-top:${f.spaceBefore}px`)
  if (f.spaceAfter != null) st.push(`margin-bottom:${f.spaceAfter}px`)
  if (f.shading) st.push(`background-color:${f.shading}`)
  if (f.borders && f.borders !== 'none') {
    const w = '1px solid #000'
    if (f.borders === 'box') st.push(`border:${w}`)
    else st.push(`border-${f.borders}:${w}`)
  }
  return st.length ? ` style="${st.join(';')}"` : ''
}

function blocksToHtml(blocks: ExamBlock[]): string {
  // Số câu/bài lấy theo thứ tự khối, khớp với CSS counter trên màn hình:
  // `block.no` có thể cũ sau khi chèn/xoá/sắp xếp lại câu.
  const seq: BlockSeq = { q: 0, essay: 0 }
  return blocks
    .map((b) => {
      if (b.type === 'question') seq.q += 1
      if (b.type === 'essay') seq.essay += 1
      return blockToHtml(b, seq)
    })
    .join('\n')
}

interface BlockSeq {
  q: number
  essay: number
}

function blockToHtml(b: ExamBlock, seq: BlockSeq): string {
  switch (b.type) {
    case 'header':
      return `<table class="hdr"><tr><td>${richLines(b.left)}</td><td>${richLines(
        b.right,
      )}</td></tr></table>`

    case 'title':
      return `<h1 class="t"${formatCss(b.format)}>${richToHtml(b.text)}</h1>`

    case 'meta':
      return `<div class="meta">${b.rows
        .map(([k, v]) => `<b>${escapeHtml(k)}:</b> ${richToHtml(v)}`)
        .join(' &nbsp;•&nbsp; ')}</div>`

    case 'student':
      return `<p class="stu"${formatCss(b.format)}>${richToHtml(b.text)}</p>`

    case 'heading':
      return `<h2 class="h${b.level ?? 1}"${formatCss(b.format)}>${richToHtml(b.text)}</h2>`

    case 'paragraph':
      return `<p class="p"${formatCss(b.format)}>${richToHtml(b.text)}</p>`

    case 'bullets': {
      const tag = b.ordered ? 'ol' : 'ul'
      return `<${tag} class="bul"${formatCss(b.format)}>${b.items
        .map((i, n) => {
          const lv = b.levels?.[n] ?? 0
          return `<li${lv ? ` style="margin-left:${lv * 24}px"` : ''}>${richToHtml(i)}</li>`
        })
        .join('')}</${tag}>`
    }

    case 'grid': {
      const width = Math.round(100 / (b.cols || 2))
      return (
        '<table class="grid"><tr>' +
        b.cells.map((c) => `<td style="width:${width}%">${richToHtml(c)}</td>`).join('') +
        '</tr></table>'
      )
    }

    case 'question': {
      const head = `<p class="q"${formatCss(b.format)}><b>Câu ${seq.q}.</b> ${richToHtml(b.text)}</p>`
      // trả lời ngắn: 4 ô trống điền đáp số (khớp 4 cột trên phiếu trả lời)
      if (b.kind === 'short') {
        return head + '<table class="sa" cellspacing="0"><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></table>'
      }
      // đúng/sai: mỗi ý một dòng, nhãn "a)"; trắc nghiệm: hai cột, nhãn "A."
      const tf = b.kind === 'tf'
      const rows = chunk(b.options, tf ? 1 : 2)
        .map(
          (row) =>
            '<tr>' +
            row
              .map(
                (o) =>
                  `<td class="opt"${formatCss(o.format)}><b>${escapeHtml(o.label)}${tf ? ')' : '.'}</b> ${richToHtml(
                    o.text,
                  )}</td>`,
              )
              .join('') +
            '</tr>',
        )
        .join('')
      return head + (rows ? `<div class="opts${tf ? ' tf' : ''}"><table>${rows}</table></div>` : '')
    }

    case 'essay':
      return (
        `<p class="q"${formatCss(b.format)}><b>Bài ${seq.essay}${b.score ? ` (${fmt(b.score)} điểm)` : ''}.</b> ${richToHtml(
          b.text,
        )}</p>` +
        (b.sub?.length
          ? `<div class="subs">${b.sub.map((s) => `<div class="sub">${richToHtml(s)}</div>`).join('')}</div>`
          : '')
      )

    case 'answerKey': {
      const rows = chunk(b.items, 10)
      return (
        '<table class="ak">' +
        rows
          .map((row) => {
            const nos = row.map((c) => `<td>${c.no}</td>`).join('')
            const ans = row.map((c) => `<td><b>${richToHtml(c.answer)}</b></td>`).join('')
            return `<tr><th>Câu</th>${nos}</tr><tr><th>Đáp án</th>${ans}</tr>`
          })
          .join('') +
        '</table>'
      )
    }

    case 'rubric':
      return (
        (b.title ? `<h2 class="h2">${richToHtml(b.title)}</h2>` : '') +
        '<ol class="rub">' +
        b.items
          .map((i) => `<li>${escapeHtml(i.label)} ${richToHtml(i.text)}</li>`)
          .join('') +
        '</ol>'
      )

    case 'pageBreak':
      return '<div style="page-break-after:always"></div>'

    case 'divider':
      return '<hr class="hr">'

    default:
      return ''
  }
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

function fmt(n: number): string {
  return n.toLocaleString('vi-VN', {
    minimumFractionDigits: n % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })
}

/** CSS dùng chung cho bản Word và bản in — một nguồn, tránh hai nơi lệch nhau. */
const EXPORT_CSS = `
  @page { size: A4; margin: 1.8cm 1.6cm; }
  body { font-family: "Times New Roman", serif; font-size: 13pt; line-height: 1.5; color: #000; }
  .hdr { width: 100%; table-layout: fixed; border: none; margin: 0 0 6px; font-weight: bold; font-size: 11.5pt; line-height: 1.5; }
  .hdr td { border: none; vertical-align: top; text-align: center; }
  .hdr td:first-child { width: 31%; }
  .hdr td:last-child { width: 69%; }
  .hdr i { font-weight: normal; }
  .t { text-align: center; font-size: 15pt; font-weight: bold; margin: 0 0 6px; text-transform: uppercase; }
  .meta { text-align: center; font-size: 12pt; margin: 0 0 4px; }
  .stu { font-size: 12.5pt; margin: 8px 0 10px; }
  .h1 { font-size: 13pt; font-weight: bold; text-align: center; margin: 16px 0 8px; text-transform: uppercase; }
  .h2 { font-size: 12.5pt; font-weight: bold; margin: 12px 0 6px; text-transform: uppercase; }
  .h3 { font-size: 12.5pt; font-weight: bold; margin: 10px 0 5px; }
  .p { margin: 0 0 6px; text-align: justify; }
  .p.it { font-style: italic; }
  .bul { margin: 0 0 8px 24px; }
  .grid { width: 100%; border: none; border-collapse: collapse; margin: 4px 0; }
  .grid td { border: none; vertical-align: top; padding: 0 6px 0 0; }
  .q { margin: 8px 0 3px; text-align: justify; }
  /* Phương án 2 cột bằng bảng: Word không hiểu flex, dùng bảng để file Word
     và bản in giống nhau. */
  .opts { margin: 0 0 4px 22px; }
  .opts table { width: 100%; border-collapse: collapse; }
  .opts td { width: 50%; vertical-align: top; padding: 0 6px 0 0; border: none; }
  .opts.tf td { width: 100%; }
  .sa { margin: 2px 0 6px 22px; border-collapse: collapse; }
  .sa td { width: 28px; height: 28px; border: 1px solid #000; }
  .subs { margin-left: 22px; }
  .sub { margin: 0 0 3px; }
  .ak { border-collapse: collapse; margin: 10px 0; font-size: 12pt; }
  .ak td, .ak th { border: 1px solid #000; padding: 2px 6px; text-align: center; }
  .ak th { background: #f2f2f2; }
  .rub { margin: 0 0 8px 22px; }
  .hr { border: 0; border-top: 1px solid #999; margin: 10px 0; }
`

export function buildWordHtml(doc: ExamDoc): string {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escapeHtml(doc.title)}</title>
<style>
${EXPORT_CSS}
</style>
</head>
<body>
${blocksToHtml(doc.blocks)}
</body>
</html>`
}

/* ------------------------------------------------------------------ *
 * In A4
 * ------------------------------------------------------------------ */

/**
 * Mở hộp thoại in với CSS @page A4.
 * Nội dung in lấy từ chính tài liệu đang mở nên khớp với màn hình.
 *
 * `window.open` có thể bị chặn (popup blocker, hoặc trình duyệt chặn cửa
 * sổ mới từ handler không phải thao tác trực tiếp) → trả `null`. Khi đó
 * fallback sang iframe ẩn: in ra chính trang hiện tại, vẫn ra đúng A4 nhờ
 * CSS @page. Không fallback thì bấm In im lặng, user tưởng nút hỏng.
 */
export function printDoc(doc: ExamDoc): void {
  const html = buildPrintHtml(doc)
  const w = window.open('', '_blank', 'width=900,height=1000')
  if (w) {
    w.document.open()
    w.document.write(html)
    // gán onload TRƯỚC khi close — gán sau thì load có thể đã xong,
    // `print()` không bao giờ chạy
    w.onload = () => {
      setTimeout(() => {
        w.focus()
        w.print()
      }, 250)
    }
    w.document.close()
    w.focus()
    return
  }
  printViaHiddenFrame(html)
}

/** In bằng iframe ẩn — dùng khi `window.open` bị chặn. */
function printViaHiddenFrame(html: string): void {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  document.body.appendChild(frame)
  const cleanup = () => {
    // đợi hộp thoại in đóng rồi mới gỡ iframe (bỏ sớm sẽ huỷ lệnh in)
    setTimeout(() => frame.remove(), 1000)
  }
  const doc = frame.contentDocument
  if (!doc) {
    frame.remove()
    return
  }
  doc.open()
  doc.write(html)
  doc.close()
  frame.onload = () => {
    setTimeout(() => {
      try {
        frame.contentWindow?.focus()
        frame.contentWindow?.print()
      } finally {
        cleanup()
      }
    }, 250)
  }
}

function buildPrintHtml(doc: ExamDoc): string {
  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(doc.title)}</title>
<style>${EXPORT_CSS}</style></head>
<body>${blocksToHtml(doc.blocks)}</body></html>`
}
