'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { AuthScreen } from '@/app/admin/AdminAuth'
import { resetPasswordAction } from '@/app/admin/actions'
import { Arrow } from '@/components/Typography'
import { Input, buttonClass } from '@/components/admin/ui'

export function ResetPasswordForm({ token, account }: { token: string; account: { name: string; username: string } | null }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!account && !done) {
    return (
      <AuthScreen title='Expired'>
        <p className='break-keep text-base leading-relaxed'>
          만료되었거나 이미 사용된 링크입니다. 재설정 링크는 한 번만 쓸 수 있고 24시간 동안만 유효해요. 관리자에게 새 링크를
          요청해 주세요.
        </p>
        <Link href='/admin' className={buttonClass('secondary', 'md', 'self-start')}>
          로그인 화면으로
        </Link>
      </AuthScreen>
    )
  }

  if (done) {
    return (
      <AuthScreen title='Done'>
        <p className='break-keep text-base leading-relaxed'>
          비밀번호를 바꿨어요. 이 링크는 이제 사용할 수 없고, 다른 기기의 로그인은 모두 해제되었습니다.
        </p>
        <Link href='/admin' className={buttonClass('primary', 'md', 'self-start')}>
          어드민으로 이동
        </Link>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen title='Reset'>
      <p className='break-keep text-sm leading-relaxed text-mute'>
        <span className='text-ink'>{account!.name}</span> (@{account!.username}) 계정의 새 비밀번호를 설정하세요.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (password !== confirm) {
            setError('비밀번호 확인이 일치하지 않습니다.')
            return
          }
          startTransition(async () => {
            const result = await resetPasswordAction(token, password)
            if ('message' in result) setError(result.message)
            else setDone(true)
          })
        }}
        className='flex flex-col gap-2'
      >
        <Input
          type='password'
          required
          minLength={8}
          autoFocus
          autoComplete='new-password'
          placeholder='새 비밀번호 (8자 이상)'
          aria-label='새 비밀번호'
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setError('')
          }}
          className='bg-tile py-3.5 text-base'
        />
        <Input
          type='password'
          required
          autoComplete='new-password'
          placeholder='새 비밀번호 확인'
          aria-label='새 비밀번호 확인'
          value={confirm}
          onChange={(event) => {
            setConfirm(event.target.value)
            setError('')
          }}
          className='bg-tile py-3.5 text-base'
        />
        {error && <p className='text-sm text-danger'>{error}</p>}
        <button type='submit' disabled={isPending} className={buttonClass('primary', 'lg', 'justify-between')}>
          {isPending ? '처리 중…' : '비밀번호 변경'}
          <Arrow direction='right' className='size-5' />
        </button>
      </form>
    </AuthScreen>
  )
}
