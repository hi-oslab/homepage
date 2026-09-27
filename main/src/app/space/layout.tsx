import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthSetupError, getCurrentUser, hasMaster, isApproved } from '@/lib/admin-auth'
import { getAdminUsers, getHelpRequests } from '@/lib/cms'
import { AdminNotice } from './AdminAuth'
import { AdminShell } from './AdminShell'

export const metadata: Metadata = {
  title: 'Member Space',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user, masterExists
  try {
    ;[user, masterExists] = await Promise.all([getCurrentUser(), hasMaster()])
  } catch (error) {
    if (error instanceof AuthSetupError) return <AdminNotice kind='migration' />
    throw error
  }

  // 로그인 안 했으면 로그인 대문으로 (마스터가 아직 없으면 첫 마스터 만들기)
  if (!user) redirect(masterExists ? '/login' : '/join')
  if (!isApproved(user)) return <AdminNotice kind={user.status === 'rejected' ? 'rejected' : 'pending'} name={user.name} />

  // 마스터에게는 승인 대기 + 미처리 문의 수를 메뉴 배지로 보여준다
  const pendingCount = user.is_master
    ? await Promise.all([getAdminUsers(), getHelpRequests('open')]).then(
        ([users, requests]) => users.filter((item) => item.status === 'pending').length + requests.length,
      )
    : 0

  return (
    <AdminShell
      user={{
        name: user.name,
        username: user.username,
        isMaster: user.is_master,
        hasProfile: Boolean(user.member_id),
        pendingCount,
      }}
    >
      {children}
    </AdminShell>
  )
}
