import { redirect } from 'next/navigation'
import { AuthSetupError, getCurrentUser, hasMaster } from '@/lib/admin-auth'

/**
 * 로그인/가입 페이지 공통: 이미 로그인했으면 /admin 으로 보낸다.
 * 마이그레이션 전이면 'migration'을 돌려준다.
 */
export async function getAuthPageState(): Promise<{ hasMaster: boolean } | 'migration'> {
  let user, masterExists
  try {
    ;[user, masterExists] = await Promise.all([getCurrentUser(), hasMaster()])
  } catch (error) {
    if (error instanceof AuthSetupError) return 'migration'
    throw error
  }
  if (user) redirect('/admin')
  return { hasMaster: masterExists }
}
