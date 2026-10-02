'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { PasswordInput, SaveState, SectionCard, buttonClass, useToast } from '@/components/admin/ui'
import { OperatorBadge } from '@/components/OperatorBadge'
import { ProfileImage } from '@/components/ProfileImage'
import { callAction } from '@/lib/call-action'
import type { AccountProfileInput, AdminUser } from '@/types/cms'
import { AFFILIATION_LABELS, AffiliationFields, IdentityFields, formatJoined } from '../AccountFields'
import { changePasswordAction, updateMyAccountAction, withdrawAction } from '../actions'

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

/**
 * 계정 설정: 요약 → 본인 정보 → 소속 · 학적 → 로그인 · 보안 → 탈퇴 (최대 720px)
 * 정보를 고치면 아래에 저장 막대가 뜨고, 비밀번호 변경 · 탈퇴는 눌러서 펼친다.
 */
export function AccountEditor({ user, profileImage }: { user: AdminUser; profileImage: string | null }) {
  const router = useRouter()
  const toast = useToast()
  const [saved, setSaved] = useState(() => pickProfile(user))
  const [profile, setProfile] = useState(() => pickProfile(user))
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [isPending, startTransition] = useTransition()
  const dirty = JSON.stringify(saved) !== JSON.stringify(profile)

  const saveProfile = () =>
    startTransition(async () => {
      const result = await callAction(() => updateMyAccountAction(profile))
      if ('message' in result) return toast.show(result.message, 'error')
      setSaved(profile)
      toast.show('계정 정보를 저장했습니다')
      router.refresh()
    })

  const changePassword = (event: React.FormEvent) => {
    event.preventDefault()
    if (passwords.next !== passwords.confirm) return toast.show('새 비밀번호 확인이 일치하지 않습니다', 'error')
    startTransition(async () => {
      const result = await callAction(() => changePasswordAction(passwords.current, passwords.next))
      if ('message' in result) return toast.show(result.message, 'error')
      setPasswords({ current: '', next: '', confirm: '' })
      setPasswordOpen(false)
      toast.show('비밀번호를 바꿨습니다. 다른 기기의 로그인은 해제됩니다')
    })
  }

  const withdraw = (event: React.FormEvent) => {
    event.preventDefault()
    if (!confirm('정말 탈퇴할까요? 계정은 삭제되고 되돌릴 수 없습니다.')) return
    startTransition(async () => {
      const result = await callAction(() => withdrawAction(withdrawPassword))
      if ('message' in result) return toast.show(result.message, 'error')
      router.refresh()
    })
  }

  return (
    <div className='mx-auto flex w-full max-w-[720px] flex-col gap-4 pb-20'>
      {/* 요약 */}
      <section className='rounded-block flex items-center gap-4 bg-surface p-4 md:p-5'>
        <ProfileImage src={profileImage} name={saved.name} size='sm' className='size-16 shrink-0 text-xl md:size-20' />
        <div className='flex min-w-0 flex-col gap-1'>
          <span className='flex items-center gap-2'>
            <span className='truncate text-2xl font-medium '>{saved.name}</span>
            {user.is_master && <OperatorBadge />}
          </span>
          <span className='truncate text-sm text-mute'>
            @{user.username}
            {saved.affiliation && ` · ${AFFILIATION_LABELS[saved.affiliation]}`}
            {saved.joined_year && ` · ${formatJoined(saved.joined_year, saved.joined_half)} 가입`}
          </span>
        </div>
      </section>

      <SectionCard
        title='본인 정보'
        description='비밀번호를 잊었을 때 운영자가 본인인지 확인하는 데 써요. 사이트에는 보이지 않아요.'
      >
        <IdentityFields value={profile} onChange={setProfile} />
      </SectionCard>

      <SectionCard title='소속 · 학적' description='멤버 관리에서 소모임 · 외부 활동 멤버를 나눠 보는 데 써요.'>
        <AffiliationFields value={profile} onChange={setProfile} />
      </SectionCard>

      <SectionCard
        title='로그인 · 보안'
        actions={
          !passwordOpen && (
            <button type='button' onClick={() => setPasswordOpen(true)} className={buttonClass('secondary', 'sm')}>
              비밀번호 바꾸기
            </button>
          )
        }
      >
        <dl className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-sm'>
          <dt className='text-mute'>아이디</dt>
          <dd>
            @{user.username} <span className='text-xs text-mute'>· 바꿀 수 없어요</span>
          </dd>
        </dl>
        {passwordOpen && (
          <form onSubmit={changePassword} className='rounded-inner flex flex-col gap-2 bg-field/60 p-4'>
            <PasswordInput
              required
              autoFocus
              autoComplete='current-password'
              placeholder='현재 비밀번호'
              value={passwords.current}
              onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))}
              className='bg-surface'
            />
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
              <PasswordInput
                required
                minLength={8}
                autoComplete='new-password'
                placeholder='새 비밀번호 (8자 이상)'
                value={passwords.next}
                onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))}
                className='bg-surface'
              />
              <PasswordInput
                required
                autoComplete='new-password'
                placeholder='새 비밀번호 확인'
                value={passwords.confirm}
                onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))}
                className='bg-surface'
              />
            </div>
            <p className='text-xs text-mute'>바꾸면 다른 기기의 로그인은 해제돼요.</p>
            <div className='flex gap-2'>
              <button type='submit' disabled={isPending} className={buttonClass('primary', 'sm')}>
                비밀번호 변경
              </button>
              <button
                type='button'
                onClick={() => {
                  setPasswordOpen(false)
                  setPasswords({ current: '', next: '', confirm: '' })
                }}
                className={buttonClass('ghost', 'sm')}
              >
                취소
              </button>
            </div>
          </form>
        )}
      </SectionCard>

      <SectionCard
        title='탈퇴'
        description='계정과 가입 정보가 삭제되고 되돌릴 수 없어요.'
        actions={
          !withdrawOpen && (
            <button
              type='button'
              onClick={() => setWithdrawOpen(true)}
              className={buttonClass('ghost', 'sm', 'text-danger')}
            >
              탈퇴하기
            </button>
          )
        }
      >
        {withdrawOpen && (
          <form onSubmit={withdraw} className='rounded-inner flex flex-col gap-3 bg-danger-soft/50 p-4'>
            <ul className='flex list-disc flex-col gap-1 pl-4 text-sm text-ink/70'>
              <li>작성한 프로젝트는 사이트에 그대로 남고, 이후에는 운영자만 삭제할 수 있어요.</li>
              <li>Members 페이지의 프로필카드도 함께 삭제돼요.</li>
              {user.is_master && (
                <li>마지막 운영자 계정은 탈퇴할 수 없어요. 먼저 다른 사람을 운영자로 지정해 주세요.</li>
              )}
            </ul>
            <div className='flex flex-col gap-2 sm:flex-row'>
              <PasswordInput
                required
                autoFocus
                autoComplete='current-password'
                placeholder='비밀번호 확인'
                value={withdrawPassword}
                onChange={(event) => setWithdrawPassword(event.target.value)}
                className='bg-surface sm:max-w-64'
              />
              <button
                type='submit'
                disabled={isPending}
                className={buttonClass('plain', 'md', 'bg-danger text-white hover:opacity-85')}
              >
                탈퇴하기
              </button>
              <button type='button' onClick={() => setWithdrawOpen(false)} className={buttonClass('ghost')}>
                취소
              </button>
            </div>
          </form>
        )}
      </SectionCard>

      {/* 고친 게 있으면 아래에 저장 막대 */}
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            // 모바일에서는 바텀탭 위에
            className='rounded-block sticky bottom-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom)+0.75rem)] z-30 flex items-center justify-between gap-3 bg-ink px-5 py-3 text-paper shadow-[0_12px_32px_rgb(var(--shadow-rgb)/0.25)] md:bottom-4'
          >
            <SaveState dirty={dirty} saving={isPending} className='text-paper/70' />
            <div className='flex gap-2'>
              <button
                type='button'
                disabled={isPending}
                onClick={() => setProfile(saved)}
                className={buttonClass('plain', 'sm', 'text-paper/70 hover:text-paper')}
              >
                되돌리기
              </button>
              <button
                type='button'
                disabled={isPending}
                onClick={saveProfile}
                className={buttonClass('plain', 'sm', 'bg-paper text-ink hover:opacity-85')}
              >
                저장
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {toast.node}
    </div>
  )
}
