export type VimeoSource = {
  id: string
  hash: string | null
}

const HASH_PATTERN = /^[a-zA-Z0-9_-]+$/

export function parseVimeoSource(input: string): VimeoSource | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^\d+$/.test(trimmed)) return { id: trimmed, hash: null }

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
    if (url.hostname !== 'vimeo.com' && !url.hostname.endsWith('.vimeo.com')) return null

    const segments = url.pathname.split('/').filter(Boolean)
    const idIndex = segments.findIndex((segment) => /^\d+$/.test(segment))
    if (idIndex < 0) return null

    const pathHash = segments[idIndex + 1]
    const hash = url.searchParams.get('h') || (pathHash && HASH_PATTERN.test(pathHash) ? pathHash : null)
    return { id: segments[idIndex], hash }
  } catch {
    return null
  }
}

export function normalizeVimeoSource(input: string): string | null {
  const source = parseVimeoSource(input)
  if (!source) return null
  return `https://vimeo.com/${source.id}${source.hash ? `?h=${source.hash}` : ''}`
}

export function buildVimeoEmbedUrl(input: string, params: Record<string, string>): string | null {
  const source = parseVimeoSource(input)
  if (!source) return null

  const query = new URLSearchParams()
  if (source.hash) query.set('h', source.hash)
  Object.entries(params).forEach(([key, value]) => query.set(key, value))
  return `https://player.vimeo.com/video/${source.id}?${query.toString()}`
}
