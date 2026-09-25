import type { Metadata } from 'next'
import { AdminNotice, HelpRequestForm } from '@/app/admin/AdminAuth'
import { getAuthPageState } from '../authState'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Help',
  robots: { index: false, follow: false },
}

export default async function LoginHelpPage() {
  const state = await getAuthPageState()
  if (state === 'migration') return <AdminNotice kind='migration' />
  return <HelpRequestForm />
}
