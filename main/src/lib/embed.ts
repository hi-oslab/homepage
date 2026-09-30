/** Figma 파일 종류 (공유 링크 경로의 첫 칸) → embed.figma.com 경로 */
const FIGMA_KINDS: Record<string, string> = {
  file: 'design',
  design: 'design',
  proto: 'proto',
  board: 'board',
  slides: 'slides',
  deck: 'deck',
  buzz: 'buzz',
  site: 'site',
  make: 'make',
}

/**
 * 공유 링크 → iframe에 넣을 수 있는 주소
 * figma.com/design/KEY/NAME?node-id=1-2 처럼 파일 페이지를 그대로 넣으면
 * Figma가 frame-ancestors로 막으므로 embed.figma.com 주소로 바꾼다
 * 모르는 주소 · 이미 임베드 주소인 것은 그대로 둔다
 */
export function toEmbedUrl(input: string): string {
  const trimmed = input.trim()
  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return trimmed
  }

  const host = url.hostname.replace(/^www\./, '')
  if (host === 'figma.com') {
    const [kind, key, ...rest] = url.pathname.split('/').filter(Boolean)
    const target = FIGMA_KINDS[kind]
    // figma.com/embed?url=… (예전 임베드 형식)은 그대로 쓴다
    if (!target || !key) return trimmed
    const embed = new URL(`https://embed.figma.com/${[target, key, ...rest].join('/')}`)
    url.searchParams.forEach((value, name) => embed.searchParams.set(name, value))
    if (!embed.searchParams.has('embed-host')) embed.searchParams.set('embed-host', 'share')
    return embed.toString()
  }

  return trimmed
}
