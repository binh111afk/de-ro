/**
 * Video trên slide: chỉ nhận link (YouTube, Vimeo, tệp .mp4/.webm/.ogg qua https).
 * Không tải tệp video lên server — giới hạn thân request của Vercel (~4.5 MB) không đủ cho video.
 */
export type SlideVideo =
  | { kind: 'youtube'; id: string; embed: string; link: string; thumb: string }
  | { kind: 'vimeo'; id: string; embed: string; link: string }
  | { kind: 'file'; url: string; link: string }

/** Đọc link người dùng dán; link không nhận ra / không an toàn → null */
export function parseSlideVideo(raw: string | undefined): SlideVideo | null {
  const text = raw?.trim()
  if (!text) return null
  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const host = url.hostname.replace(/^(www\.|m\.)/, '')

  let yt: string | null = null
  if (host === 'youtu.be') yt = url.pathname.slice(1).split('/')[0]
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    yt = url.searchParams.get('v') ?? (/^\/(embed|shorts|live)\/([^/]+)/.exec(url.pathname)?.[2] ?? null)
  }
  if (yt && /^[\w-]{6,20}$/.test(yt)) {
    const t = url.searchParams.get('t') ?? url.searchParams.get('start')
    const start = t ? parseInt(t, 10) : 0
    const q = `rel=0${start > 0 ? `&start=${start}` : ''}`
    return {
      kind: 'youtube',
      id: yt,
      embed: `https://www.youtube-nocookie.com/embed/${yt}?${q}`,
      link: `https://www.youtube.com/embed/${yt}${start > 0 ? `?start=${start}` : ''}`,
      thumb: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
    }
  }

  const vimeo = host === 'vimeo.com' || host === 'player.vimeo.com' ? /(\d{5,})/.exec(url.pathname)?.[1] : undefined
  if (vimeo) return { kind: 'vimeo', id: vimeo, embed: `https://player.vimeo.com/video/${vimeo}`, link: `https://vimeo.com/${vimeo}` }

  if (url.protocol === 'https:' && /\.(mp4|webm|ogg|ogv|mov)$/i.test(url.pathname)) return { kind: 'file', url: url.href, link: url.href }
  return null
}
