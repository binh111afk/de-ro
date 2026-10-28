/**
 * Chế độ HTML: model trả MỘT tệp HTML nhiều `<section class="slide">`; app tách thành từng
 * slide độc lập (mỗi slide một tài liệu HTML đầy đủ, cùng CSS) để nằm trong danh sách slide
 * như PPT. Slide HTML chỉ để trình chiếu trên web: không sửa bằng trình soạn, không xuất PPT.
 */

/** Ép tài liệu một slide vừa khung iframe, hiện ngay (không đợi JS điều hướng của cả deck). */
const SINGLE_SLIDE_HEAD =
  '<style data-single>html,body{margin:0;width:100%;height:100%;overflow:hidden}' +
  '.slide{position:relative!important;inset:auto!important;width:100%!important;height:100vh!important;' +
  'min-height:0!important;opacity:1!important;visibility:visible!important;transform:none!important}' +
  '</style>' +
  "<script data-single>addEventListener('DOMContentLoaded',function(){" +
  "document.querySelectorAll('.slide').forEach(function(s){s.classList.add('active','is-active','visible','in')})})</script>"

/** Bỏ mọi thứ ngoài chuỗi tổ tiên của `section` (thanh tiến trình, số trang của cả deck…), giữ style/script. */
function isolate(section: Element) {
  let node: Element | null = section
  while (node && node.parentElement) {
    const parent: Element = node.parentElement
    for (const sibling of [...parent.children]) {
      if (sibling === node) continue
      if (/^(SCRIPT|STYLE|LINK|META)$/.test(sibling.tagName)) continue
      sibling.remove()
    }
    if (parent.tagName === 'BODY') break
    node = parent
  }
}

/** Tách tệp HTML của AI thành danh sách tài liệu HTML một-slide (rỗng nếu không có section.slide). */
export function splitHtmlDeck(html: string): string[] {
  const count = new DOMParser().parseFromString(html, 'text/html').querySelectorAll('section.slide').length
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    // parse lại cho mỗi slide: tránh clone, mỗi bản được cắt tỉa độc lập
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const keep = doc.querySelectorAll('section.slide')[i]
    if (!keep) continue
    doc.querySelectorAll('section.slide').forEach((section) => {
      if (section !== keep) section.remove()
    })
    isolate(keep)
    doc.head.insertAdjacentHTML('beforeend', SINGLE_SLIDE_HEAD)
    out.push('<!doctype html>' + doc.documentElement.outerHTML)
  }
  return out
}
