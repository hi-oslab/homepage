import { NextRequest, NextResponse } from 'next/server'
import { getR2Object } from '@/lib/r2'

export const runtime = 'nodejs'

// 파일명이 UUID라 내용이 바뀌지 않으므로 브라우저와 Vercel CDN에 1년 캐시
const CACHE_CONTROL = 'public, max-age=31536000, s-maxage=31536000, immutable'

/** R2 파일을 사이트 도메인(/media/<key>)으로 서빙한다 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.map(decodeURIComponent).join('/')
  if (!key || key.includes('..') || key.startsWith('/')) return new NextResponse('Not found', { status: 404 })

  try {
    const object = await getR2Object(key, {
      range: request.headers.get('range') ?? undefined,
      ifNoneMatch: request.headers.get('if-none-match') ?? undefined,
    })
    if (!object.Body) return new NextResponse('Not found', { status: 404 })

    const headers = new Headers({
      'Cache-Control': CACHE_CONTROL,
      'Content-Type': object.ContentType ?? 'application/octet-stream',
      'Accept-Ranges': 'bytes',
    })
    if (object.ContentLength !== undefined) headers.set('Content-Length', String(object.ContentLength))
    if (object.ETag) headers.set('ETag', object.ETag)
    if (object.LastModified) headers.set('Last-Modified', object.LastModified.toUTCString())
    if (object.ContentRange) headers.set('Content-Range', object.ContentRange)

    return new NextResponse(object.Body.transformToWebStream(), {
      status: object.ContentRange ? 206 : 200,
      headers,
    })
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
    if (status === 304) return new NextResponse(null, { status: 304, headers: { 'Cache-Control': CACHE_CONTROL } })
    if (status === 404 || (error as { name?: string }).name === 'NoSuchKey') {
      return new NextResponse('Not found', { status: 404 })
    }
    if (status === 416) return new NextResponse('Range not satisfiable', { status: 416 })
    console.error('media route failed', key, error)
    return new NextResponse('Media unavailable', { status: 502 })
  }
}
