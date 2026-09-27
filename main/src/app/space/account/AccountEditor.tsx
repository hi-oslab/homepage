'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Field, Input, PageHeader, Panel, buttonClass, useToast } from '@/components/admin/ui'
import type { AccountProfileInput, AdminUser } from '@/types/cms'
import { AccountFields } from '../AccountFields'
import { changePasswordAction, updateMyAccountAction, withdrawAction } from '../actions'
import { ROLE_LABELS } from '@/lib/roles'

const pickProfile = (user: AdminUser): AccountProfileInput => ({
  name: user.name,
  affiliation: user.affiliation,
  student_id: user.student_id,
  major: user.major,
  is_hongik: user.is_hongik,
  phone: user.phone,
  joined_year: user.joined_year,
  joined_half: user.joined_half,
})

export function AccountEditor({ user }: { user: AdminUser }) {
  const router = useRouter()
  const toast = useToast()
  const [saved, setSaved] = useState(() => pickProfile(user))
  const [profile, setProfile] = useState(() => pickProfile(user))
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [isPending, startTransition] = useTransition()
  const dirty = JSON.stringify(saved) !== JSON.stringify(profile)

  const saveProfile = () =>
    startTransition(async () => {
      const result = await updateMyAccountAction(profile)
      if ('message' in result) return toast.show(result.message, 'error')
      setSaved(profile)
      toast.show('계정 정보를 저장했습니다')
      router.refresh()
    })

  const changePassword = (event: React.FormEvent) => {
    event.preventDefault()
    if (passwords.next !== passwords.confirm) return toast.show('새 비밀번호 확인이 일치하지 않습니다', 'error')
    startTransition(async () => {
      const result = await changePasswordAction(passwords.current, passwords.next)
      if ('message' in result) return toast.show(result.message, 'error')
      setPasswords({ current: '', next: '', confirm: '' })
      toast.show('비밀번호를 바꿨습니다. 다른 기기의 로그인은 해제됩니다')
    })
  }

  const withdraw = (event: React.FormEvent) => {
    event.preventDefault()
    if (!confirm('정말 탈퇴할까요? 계정은 삭제되고 되돌릴 수 없습니다.')) return
    startTransition(async () => {
      const result = await withdrawAction(withdrawPassword)
      if ('message' in result) return toast.show(result.message, 'error')
      router.refresh()
    })
  }

  return (
    <div className='flex max-w-3xl flex-col gap-3'>
      <PageHeader title='내 계정' description={`@${user.username}${user.is_master ? ` · ${ROLE_LABELS.operator.ko}` : ''}`} />

      <Panel title='계정 정보'>
        <Field label='아이디' hint='아이디는 바꿀 수 없어요.'>
          <Input value={user.username} disabled className='opacity-60' />
        </Field>
        <AccountFields value={profile} onChange={setProfile} />
        <button
          type='button'
          onClick={saveProfile}
          disabled={!dirty || isPending}
          className={buttonClass('primary', 'md', 'self-start')}
        >
          저장
        </button>
      </Panel>

      <Panel title='비밀번호 변경'>
        <form onSubmit={changePassword} className='flex flex-col gap-2'>
          <Input
            type='password'
            required
            autoComplete='current-password'
            placeholder='현재 비밀번호'
            value={passwords.current}
            onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))}
          />
          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
            <Input
              type='password'
              required
              minLength={8}
              autoComplete='new-password'
              placeholder='새 비밀번호 (8자 이상)'
              value={passwords.next}
              onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))}
            />
            <Input
              type='password'
              required
              autoComplete='new-password'
              placeholder='새 비밀번호 확인'
              value={passwords.confirm}
              onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))}
            />
          </div>
          <button type='submit' disabled={isPending} className={buttonClass('secondary', 'md', 'self-start')}>
            비밀번호 변경
          </button>
        </form>
      </Panel>

      <Panel title='탈퇴'>
        <ul className='flex list-disc flex-col gap-1 pl-4 text-sm text-ink/70'>
          <li>계정과 가입 정보가 삭제되고 되돌릴 수 없어요.</li>
          <li>내가 쓴 작품은 사이트에 그대로 남고, 이후에는 운영자만 삭제할 수 있어요.</li>
          <li>Members 페이지의 내 프로필도 함께 삭제돼요.</li>
          {user.is_master && <li>마지막 운영자 계정은 탈퇴할 수 없어요. 먼저 다른 사람을 운영자로 지정해 주세요.</li>}
        </ul>
        <form onSubmit={withdraw} className='flex flex-col gap-2 sm:flex-row'>
          <Input
            type='password'
            required
            autoComplete='current-password'
            placeholder='비밀번호 확인'
            value={withdrawPassword}
            onChange={(event) => setWithdrawPassword(event.target.value)}
            className='sm:max-w-64'
          />
          <button type='submit' disabled={isPending} className={buttonClass('danger')}>
            탈퇴하기
          </button>
        </form>
      </Panel>
      {toast.node}
    </div>
  )
}
