import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/** 상태바 표시용 로그인 상태. 민감 정보 없이 최소 정보만 돌려준다 */
export async function GET() {
  const user = await getCurrentUser().catch(() => null)
  return NextResponse.json(
    {
      user: user
        ? { username: user.username, name: user.name, isMaster: user.is_master, status: user.status }
        : null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
