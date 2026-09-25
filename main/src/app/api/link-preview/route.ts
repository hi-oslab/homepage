import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/admin-auth'

export const runtime = 'nodejs'

// 링크 블록의 "메타데이터 자동으로 가져오기" — 페이지의 og 태그를 읽는다 (어드민 전용)
export async function GET(request: NextRequest) {
  try {
    await requireUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const raw = request.nextUrl.searchParams.get('url') ?? ''
  let target: URL
  try {
    target = new URL(raw)
    if (target.protocol !== 'http:' && target.protocol !== 'https:') throw new Error('protocol')
  } catch {
    return NextResponse.json({ error: '올바른 URL이 아닙니다' }, { status: 400 })
  }

  try {
    const response = await fetch(target, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OSLBot/1.0)', Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
    })
    const html = (await response.text()).slice(0, 500_000)

    const meta = (name: string) => {
      const pattern = new RegExp(
        `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`,
        'i',
      )
      const match = html.match(pattern)
      return decode(match?.[1] ?? match?.[2] ?? '')
    }

    const title = meta('og:title') || meta('twitter:title') || decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '')
    const description = meta('og:description') || meta('twitter:description') || meta('description')
    const imageRaw = meta('og:image') || meta('twitter:image')
    const image = imageRaw ? new URL(imageRaw, target).toString() : ''

    return NextResponse.json({ title: title.trim(), description: description.trim(), image })
  } catch (error) {
    console.error('link-preview failed', error)
    return NextResponse.json({ error: '페이지를 불러오지 못했습니다' }, { status: 502 })
  }
}

function decode(text: string) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}
