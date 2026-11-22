import type { ResolvedTheme } from './slideTheme'

/** Match the CSS patterns on the 1000px reference canvas. */
export function decorSvg(decor: ResolvedTheme['decor'], ink: string, accent: string) {
  const width = 1000
  const height = 562.5
  const circle = (x: number, y: number, r: number, fill: string) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`
  const tile = (id: string, w: number, h: number, content: string) =>
    `<defs><pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${content}</pattern></defs>` +
    `<rect width="${width}" height="${height}" fill="url(#${id})"/>`
  const glow = (id: string, x: number, y: number, rx: number, ry: number) =>
    `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs>` +
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${id})"/>`

  let opacity: number
  let content: string
  switch (decor) {
    case 'dots':
      opacity = 0.08
      content = tile('dots', 16, 16, circle(8, 8, 1.1, ink))
      break
    case 'grid':
      opacity = 0.02
      content = tile('grid', 32, 32, `<path d="M0 0h32v1H1v31H0Z" fill="${ink}"/>`)
      break
    case 'waves':
      opacity = 0.035
      content = tile('waves', 88, 88, [22.5, 66.5, 110.5].map(radius =>
        `<circle cx="0" cy="88" r="${radius}" fill="none" stroke="${ink}" stroke-width="1"/>`).join(''))
      break
    case 'confetti':
      opacity = 0.16
      content = tile('confetti', 180, 140, circle(21.6, 30.8, 3.2, accent) + circle(122.4, 16.8, 2.2, ink) +
        circle(61.2, 103.6, 2.6, accent) + circle(151.2, 92.4, 3, ink))
      break
    case 'grain':
      opacity = 0.07
      content = tile('grain-a', 7, 9, circle(1.26, 2.43, 0.6, ink)) +
        tile('grain-b', 11, 13, circle(7.81, 8.19, 0.6, ink))
      break
    case 'glow':
      opacity = 0.14
      content = glow('glow-top', width, 0, width * 0.6 * 0.62, height * 0.55 * 0.62) +
        glow('glow-bottom', 0, height, width * 0.5 * 0.66, height * 0.45 * 0.66)
      break
    case 'frame':
      opacity = 0.28
      content = `<rect x="${width * 0.032 + 1}" y="${height * 0.032 + 1}" width="${width * 0.936 - 2}" height="${height * 0.936 - 2}" fill="none" stroke="${ink}" stroke-width="2"/>`
      break
    default:
      return
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><g opacity="${opacity}">${content}</g></svg>`
}
