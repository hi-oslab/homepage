'use client'

import classNames from 'classnames'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Fragment, useEffect, useState, useTransition } from 'react'
import { Arrow } from '@/components/Typography'
import type { AccountProfileInput } from '@/types/cms'
import {
  AFFILIATION_LABELS,
  AffiliationFields,
  IdentityFields,
  Segmented,
  emptyAccountProfile,
  formatJoined,
} from './AccountFields'
import {
  checkUsernameAction,
  helpRequestAction,
  logout,
  setupMasterAction,
  signInAction,
  signUpAction,
  withdrawAction,
} from './actions'
import { Input, Textarea, buttonClass } from '@/components/admin/ui'
import { LARGE_FIELD } from '@/components/admin/styles'

const bigInput = LARGE_FIELD

/** 전체 화면 레이아웃: 좌측 큰 제목 + 우측 폼 (사이트 톤과 동일) */
export const AuthScreen = ({
  title,
  label = 'Members only',
  children,
}: {
  title: string
  label?: string
  children: React.ReactNode
}) => (
  <main className='flex min-h-[calc(100dvh-var(--spacing-header))] w-full flex-col justify-between gap-16 px-4 pt-6 pb-10 md:px-8 md:pt-8'>
    <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-12 md:gap-8'>
      <span className='md:col-span-4'>{label}</span>
      <span className='text-mute md:col-span-4'>Open Source Lab</span>
    </div>
    <div className='grid grid-cols-1 items-end gap-10 md:grid-cols-12 md:gap-8'>
      <h1 className='text-[clamp(3.5rem,11vw,11rem)] font-medium leading-[0.85] tracking-[-0.05em] md:sticky md:bottom-10 md:col-span-7'>
        {title}
      </h1>
      <div className='flex flex-col gap-3 md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-9'>{children}</div>
    </div>
  </main>
)

const SubmitButton = ({ pending, children }: { pending: boolean; children: React.ReactNode }) => (
  <button type='submit' disabled={pending} className={buttonClass('primary', 'lg', 'justify-between')}>
    {pending ? '처리 중…' : children}
    <Arrow direction='right' className='size-5' />
  </button>
)

const TextLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className='self-start text-sm text-mute transition-colors hover:text-ink'>
    {children}
  </Link>
)

/** /login — 로그인 대문 */
export function LoginForm({ hasMaster }: { hasMaster: boolean }) {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setError('')
  }

  return (
    <AuthScreen title='Login'>
      <p className='break-keep text-sm leading-relaxed text-mute'>
        오픈소스랩 멤버 공간입니다. 로그인하면 내 프로필과 작품을 관리할 수 있어요.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          startTransition(async () => {
            const result = await signInAction(form.username, form.password)
            if ('message' in result) setError(result.message)
            else router.replace('/admin')
          })
        }}
        className='flex flex-col gap-2'
      >
        <Input
          required
          autoFocus
          autoCapitalize='none'
          autoCorrect='off'
          spellCheck={false}
          autoComplete='username'
          placeholder='아이디'
          aria-label='아이디'
          value={form.username}
          onChange={set('username')}
          className={bigInput}
        />
        <Input
          type='password'
          required
          autoComplete='current-password'
          placeholder='비밀번호'
          aria-label='비밀번호'
          value={form.password}
          onChange={set('password')}
          className={bigInput}
        />
        {error && <p className='text-sm text-danger'>{error}</p>}
        <SubmitButton pending={isPending}>로그인</SubmitButton>
      </form>
      <div className='flex flex-wrap justify-between gap-x-4 gap-y-2'>
        <TextLink href='/join'>{hasMaster ? '처음이신가요? 가입 신청하기 →' : '관리자 계정 만들기 →'}</TextLink>
        <TextLink href='/login/help'>아이디나 비밀번호를 잊으셨나요?</TextLink>
      </div>
    </AuthScreen>
  )
}

type JoinStep = 'account' | 'identity' | 'affiliation' | 'role'

const JOIN_STEPS: Record<JoinStep, { title: string; description: string }> = {
  account: { title: '로그인 정보', description: '로그인할 때 쓸 아이디와 비밀번호를 정해 주세요.' },
  identity: { title: '본인 정보', description: '오픈소스랩 멤버의 본인 정보를 입력해 주세요.' },
  affiliation: { title: '현재 소속', description: '지금 어떤 형태로 오픈소스랩과 함께하고 있는지 알려 주세요.' },
  role: { title: '멤버 역할', description: '마지막 단계예요. 본인의 멤버 역할을 확인주세요.' },
}

/** /join — 가입 신청 (마스터가 아직 없으면 첫 마스터 계정 만들기). 한 화면에 한 단계씩 */
export function JoinForm({ setup }: { setup: boolean }) {
  const router = useRouter()
  const steps: JoinStep[] = setup
    ? ['account', 'identity', 'affiliation']
    : ['account', 'identity', 'affiliation', 'role']
  const [stepIndex, setStepIndex] = useState(0)
  const [credentials, setCredentials] = useState({ username: '', password: '', confirm: '', setupPassword: '' })
  const [profile, setProfile] = useState<AccountProfileInput>(emptyAccountProfile)
  const [requestMaster, setRequestMaster] = useState(false)
  const [error, setError] = useState('')
  const [usernameCheck, setUsernameCheck] = useState<{ available: boolean; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1

  const set = (key: keyof typeof credentials) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((current) => ({ ...current, [key]: event.target.value }))
    // 아이디가 바뀌면 이전 확인 결과로 다음 단계에 넘어가지 않도록
    if (key === 'username') setUsernameCheck(null)
    setError('')
  }
  const updateProfile = (next: AccountProfileInput) => {
    setProfile(next)
    setError('')
  }
  const goTo = (index: number) => {
    setStepIndex(index)
    setError('')
  }

  /** 현재 단계 입력 확인 (서버에서도 다시 검증한다) */
  const stepError = (): string | null => {
    if (step === 'account') {
      if (!usernameCheck) return '아이디 확인이 끝날 때까지 잠시 기다려 주세요.'
      if (!usernameCheck.available) return usernameCheck.message
      if (credentials.password.length < 8) return '비밀번호는 8자 이상이어야 합니다.'
      if (credentials.password !== credentials.confirm) return '비밀번호 확인이 일치하지 않습니다.'
    }
    if (step === 'identity') {
      if (!profile.name.trim()) return '실명을 입력해 주세요.'
      const phone = profile.phone.replace(/[^\d]/g, '')
      if (phone.length < 9 || phone.length > 11) return '전화번호를 확인해 주세요.'
    }
    if (step === 'affiliation' && !profile.affiliation) return '소속(학교 소모임 / 외부 활동)을 선택해 주세요.'
    return null
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const invalid = stepError()
    if (invalid) return setError(invalid)
    if (!isLast) return goTo(stepIndex + 1)
    startTransition(async () => {
      const input = { ...profile, username: credentials.username, password: credentials.password, requestMaster }
      const result = setup
        ? await setupMasterAction({ ...input, setupPassword: credentials.setupPassword })
        : await signUpAction(input)
      if (!('message' in result)) return router.replace('/admin')
      // 아이디·비밀번호 문제는 첫 단계로 돌려보낸다
      if (/아이디|비밀번호/.test(result.message)) setStepIndex(0)
      setError(result.message)
    })
  }

  return (
    <AuthScreen title={setup ? 'Setup' : 'Join'}>
      {/* 단계 표시 */}
      <div className='flex flex-col gap-3'>
        <div className='flex gap-1'>
          {steps.map((item, index) => (
            <button
              key={item}
              type='button'
              // 지나온 단계로만 돌아갈 수 있다
              disabled={index >= stepIndex || isPending}
              onClick={() => goTo(index)}
              aria-label={`${index + 1}단계 ${JOIN_STEPS[item].title}`}
              className={classNames(
                'h-1 flex-1 rounded-full transition-colors',
                index <= stepIndex ? 'bg-ink' : 'bg-tile',
                index < stepIndex && 'cursor-pointer hover:opacity-60',
              )}
            />
          ))}
        </div>
        <div className='flex flex-col gap-1'>
          <span className='text-xs text-mute'>
            {stepIndex + 1} / {steps.length}
          </span>
          <span className='text-2xl font-medium tracking-[-0.03em]'>{JOIN_STEPS[step].title}</span>
          <p className='break-keep text-sm leading-relaxed text-mute'>
            {setup && step === 'account'
              ? '아직 관리자 계정이 없습니다. 기존 관리자 비밀번호(ADMIN_PASSWORD)로 첫 관리자 계정을 만드세요.'
              : JOIN_STEPS[step].description}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className='flex flex-col gap-2'>
        {step === 'account' && (
          <>
            {setup && (
              <Input
                type='password'
                required
                placeholder='관리자 비밀번호 (ADMIN_PASSWORD)'
                aria-label='관리자 비밀번호'
                value={credentials.setupPassword}
                onChange={set('setupPassword')}
                className={bigInput}
              />
            )}
            <Input
              required
              autoFocus
              autoCapitalize='none'
              autoCorrect='off'
              spellCheck={false}
              autoComplete='username'
              placeholder='아이디 (영문 소문자·숫자·_ 4~20자)'
              aria-label='아이디'
              value={credentials.username}
              onChange={set('username')}
              className={bigInput}
            />
            <UsernameCheck username={credentials.username} result={usernameCheck} onResult={setUsernameCheck} />
            <Input
              type='password'
              required
              minLength={8}
              autoComplete='new-password'
              placeholder='비밀번호 (8자 이상)'
              aria-label='비밀번호'
              value={credentials.password}
              onChange={set('password')}
              className={bigInput}
            />
            <Input
              type='password'
              required
              autoComplete='new-password'
              placeholder='비밀번호 확인'
              aria-label='비밀번호 확인'
              value={credentials.confirm}
              onChange={set('confirm')}
              className={bigInput}
            />
          </>
        )}

        {step === 'identity' && <IdentityFields value={profile} onChange={updateProfile} large autoFocus />}

        {step === 'affiliation' && <AffiliationFields value={profile} onChange={updateProfile} large />}

        {step === 'role' && (
          <div className='flex flex-col gap-1.5'>
            <Segmented<boolean>
              large
              value={requestMaster}
              onChange={setRequestMaster}
              options={[
                { value: false, label: '일반 멤버' },
                { value: true, label: '리드 멤버' },
              ]}
            />
            <p className='break-keep text-[11px] leading-snug text-mute'>
              {requestMaster
                ? '리드 멤버는 모든 작품·멤버 정보를 관리할 수 있어요. 기존 리드멤버가 확인한 뒤 권한을 줍니다.'
                : '일반 멤버는 내 프로필을 관리하고, 모든 작품을 보고 수정할 수 있어요.'}
            </p>
            {/* 신청 내용 확인 */}
            <dl className='mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 rounded-xl bg-tile p-4 text-sm'>
              {[
                ['아이디', `@${normalizeUsernameInput(credentials.username)}`],
                ['실명', profile.name],
                ['전화번호', profile.phone],
                ['소속', profile.affiliation ? AFFILIATION_LABELS[profile.affiliation] : '—'],
                ['가입 시기', formatJoined(profile.joined_year, profile.joined_half)],
              ].map(([label, value]) => (
                <Fragment key={label}>
                  <dt className='text-mute'>{label}</dt>
                  <dd className='truncate'>{value}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
        )}

        {error && <p className='text-sm text-danger'>{error}</p>}
        <div className='mt-2 flex gap-2'>
          {stepIndex > 0 && (
            <button
              type='button'
              disabled={isPending}
              onClick={() => goTo(stepIndex - 1)}
              className={buttonClass('secondary', 'lg')}
            >
              이전
            </button>
          )}
          <div className='flex flex-1 flex-col'>
            <SubmitButton pending={isPending}>
              {!isLast ? '다음' : setup ? '관리자 계정 만들기' : '가입 신청'}
            </SubmitButton>
          </div>
        </div>
      </form>
      <TextLink href='/login'>이미 계정이 있나요? 로그인 →</TextLink>
    </AuthScreen>
  )
}

const normalizeUsernameInput = (username: string) => username.trim().toLowerCase()

/** /login/help — 로그인 없이 관리자에게 도움 요청 (비밀번호 재설정 / 아이디 찾기) */
export function HelpRequestForm() {
  const [kind, setKind] = useState<'password' | 'username'>('password')
  const [form, setForm] = useState({ username: '', name: '', phone: '', message: '' })
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setError('')
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    startTransition(async () => {
      const result = await helpRequestAction({ kind, ...form })
      if ('message' in result) setError(result.message)
      else setSent(true)
    })
  }

  return (
    <AuthScreen title='Help'>
      {sent ? (
        <>
          <p className='text-2xl font-medium tracking-[-0.03em]'>요청을 보냈어요.</p>
          <p className='break-keep text-sm leading-relaxed text-mute'>
            {kind === 'password'
              ? '관리자가 본인 확인 후 비밀번호 재설정 링크를 전달해 드려요. 링크는 한 번만 쓸 수 있고 24시간 뒤 만료됩니다.'
              : '관리자가 본인 확인 후 가입한 아이디를 알려드려요.'}
          </p>
          <Link href='/login' className={buttonClass('secondary', 'md', 'self-start')}>
            로그인으로 돌아가기
          </Link>
        </>
      ) : (
        <>
          <div className='self-start'>
            <Segmented
              large
              value={kind}
              onChange={(next) => {
                setKind(next)
                setError('')
              }}
              options={[
                { value: 'password', label: '비밀번호를 잊었어요' },
                { value: 'username', label: '아이디를 잊었어요' },
              ]}
            />
          </div>
          <p className='break-keep text-sm leading-relaxed text-mute'>
            관리자가 가입 정보(아이디·실명·전화번호)로 본인인지 확인하고 직접 도와드려요.
          </p>
          <form onSubmit={submit} className='flex flex-col gap-2'>
            {kind === 'password' && (
              <Input
                required
                autoCapitalize='none'
                autoComplete='username'
                placeholder='아이디'
                aria-label='아이디'
                value={form.username}
                onChange={set('username')}
                className={bigInput}
              />
            )}
            <Input
              required
              placeholder='실명'
              aria-label='실명'
              value={form.name}
              onChange={set('name')}
              className={bigInput}
            />
            <Input
              type='tel'
              required
              placeholder='가입할 때 쓴 전화번호'
              aria-label='전화번호'
              value={form.phone}
              onChange={set('phone')}
              className={bigInput}
            />
            <Textarea
              rows={3}
              placeholder='관리자에게 남길 말 (선택) — 예: 카톡으로 링크 보내주세요'
              aria-label='메시지'
              value={form.message}
              onChange={set('message')}
              className={classNames(bigInput, 'resize-none')}
            />
            {error && <p className='text-sm text-danger'>{error}</p>}
            <SubmitButton pending={isPending}>관리자에게 요청하기</SubmitButton>
          </form>
          <TextLink href='/login'>← 로그인으로 돌아가기</TextLink>
        </>
      )}
    </AuthScreen>
  )
}

/** 입력이 멈추면 아이디 중복을 확인해 결과를 보여준다 */
function UsernameCheck({
  username,
  result,
  onResult,
}: {
  username: string
  result: { available: boolean; message: string } | null
  onResult: (result: { available: boolean; message: string } | null) => void
}) {
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!username.trim()) {
      onResult(null)
      return
    }
    setChecking(true)
    let cancelled = false
    const timer = setTimeout(async () => {
      const next = await checkUsernameAction(username)
      if (cancelled) return
      onResult(next)
      setChecking(false)
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [username, onResult])

  if (!username.trim()) return null
  return (
    <p
      className={classNames(
        'px-1 text-xs',
        checking ? 'text-mute' : result?.available ? 'text-success' : 'text-danger',
      )}
    >
      {checking ? '아이디 확인 중…' : result?.message}
    </p>
  )
}

/** 승인 대기 / 거절 / 마이그레이션 필요 안내 */
export function AdminNotice({ kind, name }: { kind: 'pending' | 'rejected' | 'migration'; name?: string }) {
  const router = useRouter()
  const [withdrawing, setWithdrawing] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const content = {
    pending: {
      title: 'Pending',
      body: `${name ?? ''}님, 신청이 완료되었어요. 리드멤버가 승인하면 바로 이용할 수 있습니다.`,
    },
    rejected: { title: 'Sorry', body: '가입 신청이 승인되지 않았습니다. 필요하면 관리자에게 문의해 주세요.' },
    migration: {
      title: 'Setup',
      body: 'DB 마이그레이션이 필요합니다. 관리자에게 문의해주세요.',
    },
  }[kind]

  return (
    <AuthScreen title={content.title}>
      <p className='break-keep text-base leading-relaxed'>{content.body}</p>
      {kind !== 'migration' && (
        <>
          <div className='flex flex-wrap gap-2'>
            <button type='button' onClick={() => router.refresh()} className={buttonClass('secondary')}>
              상태 새로고침
            </button>
            <button
              type='button'
              onClick={async () => {
                await logout()
                router.replace('/login')
              }}
              className={buttonClass('ghost')}
            >
              로그아웃
            </button>
            <button type='button' onClick={() => setWithdrawing((value) => !value)} className={buttonClass('ghost')}>
              가입 신청 취소
            </button>
          </div>
          {withdrawing && (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                startTransition(async () => {
                  const result = await withdrawAction(password)
                  if ('message' in result) setError(result.message)
                  else router.replace('/login')
                })
              }}
              className='flex flex-col gap-2 rounded-xl bg-surface p-4'
            >
              <p className='text-sm'>가입 신청을 취소하면 계정 정보가 삭제됩니다.</p>
              <Input
                type='password'
                required
                placeholder='비밀번호 확인'
                aria-label='비밀번호'
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError('')
                }}
              />
              {error && <p className='text-sm text-danger'>{error}</p>}
              <button type='submit' disabled={isPending} className={buttonClass('danger', 'md', 'self-start')}>
                {isPending ? '처리 중…' : '신청 취소하고 계정 삭제'}
              </button>
            </form>
          )}
        </>
      )}
    </AuthScreen>
  )
}
