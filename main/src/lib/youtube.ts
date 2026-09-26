export type YoutubeSource = {
  id: string
  /** 시작 위치(초). ?t=90, ?t=1m30s, ?start=90 */
  start: number | null
}

const ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/
const HOSTS = ['youtube.com', 'youtube-nocookie.com', 'youtu.be']

/** "90", "1m30s", "1h2m3s" → 초 */
function parseTime(value: string | null): number | null {
  if (!value) return null
  if (/^\d+$/.test(value)) return Number(value)
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  if (!match || !match[0]) return null
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0)
}

/**
 * 지원 형식: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID,
 * youtube.com/embed/ID, youtube.com/live/ID, youtube-nocookie.com/embed/ID, 영상 ID(11자) 직접 입력
 */
export function parseYoutubeSource(input: string): YoutubeSource | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (ID_PATTERN.test(trimmed)) return { id: trimmed, start: null }

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
    const host = url.hostname.replace(/^(www|m|music)\./, '')
    if (!HOSTS.includes(host)) return null

    const segments = url.pathname.split('/').filter(Boolean)
    const id =
      host === 'youtu.be'
        ? segments[0]
        : url.searchParams.get('v') ??
          (['shorts', 'embed', 'live', 'v'].includes(segments[0]) ? segments[1] : undefined)
    if (!id || !ID_PATTERN.test(id)) return null

    return { id, start: parseTime(url.searchParams.get('t') ?? url.searchParams.get('start')) }
  } catch {
    return null
  }
}

export function extractYoutubeId(input: string): string | null {
  return parseYoutubeSource(input)?.id ?? null
}

/** 개인정보 보호 모드(youtube-nocookie) 임베드 주소 */
export function buildYoutubeEmbedUrl(input: string, params: Record<string, string>): string | null {
  const source = parseYoutubeSource(input)
  if (!source) return null

  const query = new URLSearchParams(params)
  if (source.start) query.set('start', String(source.start))
  return `https://www.youtube-nocookie.com/embed/${source.id}?${query.toString()}`
}
