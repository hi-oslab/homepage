import type { Metadata } from 'next'
import { AdminNotice, LoginForm } from '@/app/space/AdminAuth'
import { getAuthPageState } from './authState'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Login',
  robots: { index: false, follow: false },
}

export default async function LoginPage() {
  const state = await getAuthPageState()
  if (state === 'migration') return <AdminNotice kind='migration' />
  return <LoginForm hasMaster={state.hasMaster} />
}
