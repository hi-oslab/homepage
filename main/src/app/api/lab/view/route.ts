import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { recordLabView } from '@/lib/lab'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Lab Space 글 조회 1회 기록.
 * 방문자는 IP + 브라우저 정보의 해시로만 구분한다 (원래 값은 저장하지 않는다). 같은 방문자는 하루 한 번.
 * 공개된 글만 늘어난다 (DB 함수 lab_record_view).
 */
export async function POST(req: NextRequest) {
  let articleId: unknown
  try {
    ;({ articleId } = await req.json())
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  if (typeof articleId !== 'string' || !UUID.test(articleId)) return NextResponse.json({ ok: false }, { status: 400 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const agent = req.headers.get('user-agent') ?? ''
  const viewer = createHash('sha256')
    .update(`${ip}|${agent}|${process.env.SUPABASE_SECRET_KEY ?? ''}`)
    .digest('hex')
    .slice(0, 32)

  try {
    const counted = await recordLabView(articleId, viewer)
    return NextResponse.json({ ok: true, counted })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
