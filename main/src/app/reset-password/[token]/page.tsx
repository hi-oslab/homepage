import type { Metadata } from 'next'
import { inspectResetToken } from '@/lib/admin-auth'
import { ResetPasswordForm } from './ResetPasswordForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '비밀번호 재설정',
  robots: { index: false, follow: false },
  // 토큰이 담긴 주소가 외부로 전달되지 않도록
  referrer: 'no-referrer',
}

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const account = await inspectResetToken(token).catch(() => null)
  return <ResetPasswordForm token={token} account={account} />
}
