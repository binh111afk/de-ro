const SVG_NS = 'http://www.w3.org/2000/svg'
export const TOOL_SVG_HALO = 'text:not([stroke]):not([fill="#fff"]):not([fill="#ffffff"]):not([fill="white"]){paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round}'

const shapes = new Set([
  'svg', 'g', 'defs', 'desc', 'title', 'metadata', 'symbol', 'use', 'image',
  'path', 'line', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'text', 'tspan',
  'marker', 'clipPath', 'pattern', 'mask', 'linearGradient', 'radialGradient', 'stop',
])

/** Chỉ giữ SVG tĩnh trước khi gắn vào tài liệu ứng dụng. */
export function parseToolSvg(text: string): SVGSVGElement | null {
  const root = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement
  if (root.localName !== 'svg' || root.namespaceURI !== SVG_NS) return null
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const halo = el.localName === 'style' && !el.children.length && el.textContent === TOOL_SVG_HALO
    if (el.namespaceURI !== SVG_NS || (!halo && !shapes.has(el.localName))) {
      el.remove()
      continue
    }
    for (const attr of [...el.attributes]) {
      const name = attr.localName.toLowerCase()
      if (name.startsWith('on') || name === 'style' ||
          (attr.namespaceURI === 'http://www.w3.org/XML/1998/namespace' && name === 'base')) {
        el.removeAttributeNode(attr)
      } else if (name === 'href') {
        const fragment = /^#[\w.-]+$/.test(attr.value)
        const raster = el.localName === 'image' && /^data:image\/(png|jpeg|gif|webp);base64,/i.test(attr.value)
        if (!fragment && !raster) el.removeAttributeNode(attr)
      } else if (/url\s*\(/i.test(attr.value) && !/^url\(#[\w.-]+\)$/.test(attr.value)) {
        el.removeAttributeNode(attr)
      }
    }
  }
  return root as unknown as SVGSVGElement
}
