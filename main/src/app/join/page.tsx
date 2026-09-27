import type { Metadata } from 'next'
import { AdminNotice, JoinForm } from '@/app/space/AdminAuth'
import { getAuthPageState } from '@/app/login/authState'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Join',
  robots: { index: false, follow: false },
}

export default async function JoinPage() {
  const state = await getAuthPageState()
  if (state === 'migration') return <AdminNotice kind='migration' />
  // 마스터가 아직 없으면 첫 마스터 계정 만들기 화면
  return <JoinForm setup={!state.hasMaster} />
}
