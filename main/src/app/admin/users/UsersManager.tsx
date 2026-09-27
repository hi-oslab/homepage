'use client'

import classNames from 'classnames'
import { useState, useTransition } from 'react'
import { GoChevronDown, GoCopy, GoKey, GoTrash } from 'react-icons/go'
import {
  Input,
  PageHeader,
  Select,
  Switch,
  buttonClass,
  useRefreshOnFocus,
  useServerState,
  useToast,
} from '@/components/admin/ui'
import { RelativeTime } from '../DashboardActions'
import { AFFILIATION_LABELS, Segmented, formatJoined } from '../AccountFields'
import type { AdminUser, AdminUserStatus, HelpRequest, Member, MemberAffiliation } from '@/types/cms'
import {
  approveAsMasterAction,
  createResetLinkAction,
  deleteUserAction,
  linkUserMemberAction,
  resolveHelpRequestAction,
  setUserAffiliationAction,
  setUserMasterAction,
  setUserStatusAction,
} from './actions'

type Tab = 'pending' | 'approved' | 'rejected' | 'requests'
type MemberOption = Pick<Member, 'id' | 'name' | 'cover_image_url'>
type ActionResult = { ok: true; user?: AdminUser } | { ok: false; message: string }

const TABS: Record<Tab, string> = { pending: '승인 대기', approved: '승인됨', rejected: '거절됨', requests: '문의' }

type AffiliationFilter = 'all' | MemberAffiliation | 'none'
const AFFILIATION_FILTERS: Record<AffiliationFilter, string> = {
  all: '전체',
  club: AFFILIATION_LABELS.club,
  external: AFFILIATION_LABELS.external,
  none: '미지정',
}
const matchesAffiliation = (user: AdminUser, filter: AffiliationFilter) =>
  filter === 'all' || (filter === 'none' ? !user.affiliation : user.affiliation === filter)

const digits = (value: string) => value.replace(/[^\d]/g, '')

export function UsersManager({
  initialUsers,
  initialRequests,
  members,
  currentUserId,
}: {
  initialUsers: AdminUser[]
  initialRequests: HelpRequest[]
  members: MemberOption[]
  currentUserId: string
}) {
  const [users, setUsers] = useServerState(initialUsers)
  const [requests, setRequests] = useServerState(initialRequests)
  useRefreshOnFocus()
  const [tab, setTab] = useState<Tab>(() =>
    initialUsers.some((user) => user.status === 'pending')
      ? 'pending'
      : initialRequests.length
        ? 'requests'
        : 'approved',
  )
  const [affiliation, setAffiliation] = useState<AffiliationFilter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [resetLink, setResetLink] = useState<{ userId: string; url: string; expiresAt: string } | null>(null)
  const [, startTransition] = useTransition()
  const toast = useToast()

  const counts: Record<Tab, number> = {
    pending: users.filter((user) => user.status === 'pending').length,
    approved: users.filter((user) => user.status === 'approved').length,
    rejected: users.filter((user) => user.status === 'rejected').length,
    requests: requests.length,
  }

  /** 서버 액션 실행 → 결과 반영 + 알림 */
  const run = (id: string, action: () => Promise<ActionResult>, success: string, onDone?: () => void) => {
    setBusyId(id)
    startTransition(async () => {
      const result = await action()
      setBusyId(null)
      if ('message' in result) return toast.show(result.message, 'error')
      if (result.user) setUsers((current) => current.map((user) => (user.id === id ? result.user! : user)))
      onDone?.()
      toast.show(success)
    })
  }

  const issueResetLink = (user: AdminUser) => {
    if (!confirm(`${user.name}님의 비밀번호 재설정 링크를 만들까요?\n이전에 만든 링크는 무효가 됩니다.`)) return
    setBusyId(user.id)
    startTransition(async () => {
      const result = await createResetLinkAction(user.id)
      setBusyId(null)
      if ('message' in result) return toast.show(result.message, 'error')
      setResetLink({ userId: user.id, url: `${window.location.origin}${result.path}`, expiresAt: result.expiresAt })
    })
  }

  const resolve = (request: HelpRequest) =>
    run(
      request.id,
      () => resolveHelpRequestAction(request.id),
      '문의를 처리 완료로 표시했습니다',
      () => setRequests((current) => current.filter((item) => item.id !== request.id)),
    )

  return (
    <div className='flex flex-col gap-4'>
      <PageHeader
        title='회원 관리'
        count={users.length}
        description='가입 승인, 소속, 관리자 권한, 프로필 연결, 비밀번호 재설정 문의를 관리합니다.'
      />

      <div className='flex flex-wrap items-center gap-2'>
        <div className='flex self-start overflow-x-auto rounded-lg bg-tile p-0.5'>
          {(Object.keys(TABS) as Tab[]).map((value) => (
            <button
              key={value}
              type='button'
              onClick={() => setTab(value)}
              className={classNames(
                'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                tab === value ? 'bg-surface text-ink' : 'text-mute hover:text-ink',
              )}
            >
              {TABS[value]}
              <span
                className={classNames(
                  'text-xs',
                  (value === 'pending' || value === 'requests') && counts[value] > 0 ? 'text-danger' : 'text-mute',
                )}
              >
                {counts[value]}
              </span>
            </button>
          ))}
        </div>
        {/* 소속별 보기: 학교 소모임 / 외부 활동 */}
        {tab !== 'requests' && (
          <div className='flex overflow-x-auto rounded-lg bg-tile p-0.5'>
            {(Object.keys(AFFILIATION_FILTERS) as AffiliationFilter[]).map((value) => {
              const count = users.filter((user) => user.status === tab && matchesAffiliation(user, value)).length
              if (value === 'none' && count === 0) return null
              return (
                <button
                  key={value}
                  type='button'
                  onClick={() => setAffiliation(value)}
                  className={classNames(
                    'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                    affiliation === value ? 'bg-surface text-ink' : 'text-mute hover:text-ink',
                  )}
                >
                  {AFFILIATION_FILTERS[value]}
                  <span className='text-xs text-mute'>{count}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 방금 만든 재설정 링크 */}
      {resetLink && (
        <div className='flex flex-col gap-3 rounded-xl bg-ink p-5 text-white'>
          <div className='flex items-center justify-between gap-3'>
            <span className='text-sm'>
              {users.find((user) => user.id === resetLink.userId)?.name}님의 비밀번호 재설정 링크
            </span>
            <button type='button' onClick={() => setResetLink(null)} className='text-xs text-white/50 hover:text-white'>
              닫기
            </button>
          </div>
          <div className='flex flex-col gap-2 sm:flex-row'>
            <Input
              readOnly
              value={resetLink.url}
              onFocus={(event) => event.target.select()}
              className='bg-white/10 text-white text-sm'
            />
            <button
              type='button'
              onClick={async () => {
                await navigator.clipboard.writeText(resetLink.url)
                toast.show('링크를 복사했습니다')
              }}
              className={buttonClass('plain', 'md', 'shrink-0 bg-white text-ink hover:opacity-85')}
            >
              <GoCopy size={14} />
              복사
            </button>
          </div>
          <p className='text-xs leading-relaxed text-white/60'>
            카톡 등으로 본인에게만 전달하세요. 한 번 사용하면 무효가 되고,{' '}
            {new Date(resetLink.expiresAt).toLocaleString('ko-KR')}에 만료됩니다. 이 화면을 닫으면 다시 볼 수 없어요.
          </p>
        </div>
      )}

      {tab === 'requests' ? (
        <RequestList requests={requests} users={users} busyId={busyId} onIssue={issueResetLink} onResolve={resolve} />
      ) : (
        <ul className='flex flex-col gap-1'>
          {users
            .filter((user) => user.status === tab && matchesAffiliation(user, affiliation))
            .map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isMe={user.id === currentUserId}
                busy={busyId === user.id}
                members={members}
                users={users}
                onRun={run}
                onIssueReset={() => issueResetLink(user)}
                onRemoved={() => setUsers((current) => current.filter((item) => item.id !== user.id))}
              />
            ))}
          {users.filter((user) => user.status === tab && matchesAffiliation(user, affiliation)).length === 0 && (
            <li className='rounded-xl bg-surface py-16 text-center text-sm text-mute'>
              {tab === 'pending' ? '승인을 기다리는 가입 신청이 없습니다.' : '해당하는 계정이 없습니다.'}
            </li>
          )}
        </ul>
      )}
      {toast.node}
    </div>
  )
}

function UserRow({
  user,
  isMe,
  busy,
  members,
  users,
  onRun,
  onIssueReset,
  onRemoved,
}: {
  user: AdminUser
  isMe: boolean
  busy: boolean
  members: MemberOption[]
  users: AdminUser[]
  onRun: (id: string, action: () => Promise<ActionResult>, success: string, onDone?: () => void) => void
  onIssueReset: () => void
  onRemoved: () => void
}) {
  const [open, setOpen] = useState(user.status === 'pending')
  const linkedTo = (memberId: string) => users.find((item) => item.member_id === memberId)

  const setStatus = (status: AdminUserStatus) =>
    onRun(
      user.id,
      () => setUserStatusAction(user.id, status),
      {
        approved: `${user.name}님을 승인했습니다`,
        rejected: `${user.name}님의 가입을 거절했습니다`,
        pending: '승인을 취소했습니다',
      }[status],
    )

  const approveAsMaster = () => {
    if (!confirm(`${user.name}님을 관리자로 승인할까요?\n모든 작품·멤버·회원을 관리할 수 있게 됩니다.`)) return
    onRun(user.id, () => approveAsMasterAction(user.id), `${user.name}님을 관리자로 승인했습니다`)
  }

  const remove = () => {
    if (!confirm(`'${user.name}' 계정을 삭제할까요?\n작성한 작품은 남고 작성자 정보만 비워집니다.`)) return
    onRun(user.id, () => deleteUserAction(user.id), '계정을 삭제했습니다', onRemoved)
  }

  const details = [
    ['전화번호', user.phone || '—'],
    ['홍익대학교', user.is_hongik ? '예' : '아니요'],
    ['학번', user.student_id || '—'],
    ['오픈소스랩 가입', formatJoined(user.joined_year, user.joined_half)],
    ['관리자 권한 신청', user.master_requested ? '신청함' : '—'],
  ]

  return (
    <li
      className={classNames('flex flex-col gap-4 rounded-xl bg-surface p-4 transition-opacity', busy && 'opacity-50')}
    >
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:gap-4'>
        {/* 계정 요약 */}
        <button
          type='button'
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          title={open ? '가입 정보 접기' : '가입 정보 · 소속 설정 보기'}
          className='group -m-2 flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-field'
        >
          <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-field text-sm'>
            {user.name.slice(0, 1) || '?'}
          </span>
          <span className='flex min-w-0 flex-col gap-0.5'>
            <span className='flex items-center gap-1.5 text-[15px]'>
              <span className='truncate'>{user.name}</span>
              {user.is_master && <span className='rounded bg-ink px-1.5 py-0.5 text-[10px] text-white'>ADMIN</span>}
              {user.master_requested && !user.is_master && (
                <span className='rounded bg-danger-soft px-1.5 py-0.5 text-[10px] text-danger'>관리자 신청</span>
              )}
              <span
                className={classNames(
                  'rounded px-1.5 py-0.5 text-[10px]',
                  user.affiliation ? 'bg-field text-ink/70' : 'bg-danger-soft text-danger',
                )}
              >
                {user.affiliation ? AFFILIATION_LABELS[user.affiliation] : '소속 미지정'}
              </span>
              {isMe && <span className='text-xs text-mute'>(나)</span>}
            </span>
            <span className='truncate text-xs text-mute'>
              @{user.username} · {user.phone || '전화번호 없음'} · {formatJoined(user.joined_year, user.joined_half)}{' '}
              가입 · 신청 <RelativeTime iso={user.created_at} />
            </span>
          </span>
          {/* 펼칠 수 있다는 표시 */}
          <span className='ml-auto flex shrink-0 items-center gap-1 text-xs text-mute group-hover:text-ink'>
            <span className='hidden sm:inline'>{open ? '접기' : '상세'}</span>
            <GoChevronDown size={14} className={classNames('transition-transform', open && 'rotate-180')} />
          </span>
        </button>

        {/* 승인된 계정: 프로필 연결 + 관리자 권한 */}
        {user.status === 'approved' && (
          <div className='flex flex-wrap items-center gap-3'>
            <Select
              aria-label='연결된 멤버 프로필'
              value={user.member_id ?? ''}
              disabled={busy}
              onChange={(event) =>
                onRun(
                  user.id,
                  () => linkUserMemberAction(user.id, event.target.value || null),
                  '프로필 연결을 변경했습니다',
                )
              }
              className='w-48 text-sm'
            >
              <option value=''>프로필 연결 안 함</option>
              {members.map((member) => {
                const owner = linkedTo(member.id)
                return (
                  <option key={member.id} value={member.id} disabled={Boolean(owner && owner.id !== user.id)}>
                    {member.name}
                    {owner && owner.id !== user.id ? ` (${owner.name} 연결됨)` : ''}
                  </option>
                )
              })}
            </Select>
            <Switch
              checked={user.is_master}
              disabled={busy}
              onChange={(value) => {
                if (
                  value &&
                  !confirm(`${user.name}님에게 관리자 권한을 줄까요?\n모든 작품·멤버·회원을 관리할 수 있게 됩니다.`)
                )
                  return
                onRun(
                  user.id,
                  () => setUserMasterAction(user.id, value),
                  value ? '관리자 권한을 부여했습니다' : '관리자 권한을 해제했습니다',
                )
              }}
              label='관리자'
            />
          </div>
        )}

        {/* 상태 변경 */}
        <div className='flex shrink-0 items-center gap-1'>
          {/* 관리자 권한을 신청한 가입자: 관리자로 승인 / 멤버로 승인 */}
          {user.status !== 'approved' && user.master_requested && (
            <button type='button' disabled={busy} onClick={approveAsMaster} className={buttonClass('primary', 'sm')}>
              관리자로 승인
            </button>
          )}
          {user.status !== 'approved' && (
            <button
              type='button'
              disabled={busy}
              onClick={() => setStatus('approved')}
              className={buttonClass(user.master_requested ? 'secondary' : 'primary', 'sm')}
            >
              {user.master_requested ? '멤버로 승인' : '승인'}
            </button>
          )}
          {user.status === 'pending' && (
            <button
              type='button'
              disabled={busy}
              onClick={() => setStatus('rejected')}
              className={buttonClass('secondary', 'sm')}
            >
              거절
            </button>
          )}
          {!isMe && (
            <button
              type='button'
              disabled={busy}
              onClick={onIssueReset}
              className={buttonClass('secondary', 'sm', 'w-fit')}
              title='비밀번호 재설정 링크 만들기'
            >
              비밀번호 재설정 링크
            </button>
          )}
          {!isMe && (
            <button
              type='button'
              disabled={busy}
              onClick={remove}
              className={buttonClass('secondary', 'sm', 'not-disabled:hover:bg-danger-soft text-danger w-fit')}
              title='계정 삭제'
            >
              계정 삭제
            </button>
          )}
        </div>
      </div>

      {/* 가입 정보 */}
      {open && (
        <div className='flex flex-col gap-3 rounded-lg bg-field p-3 sm:flex-row sm:items-end sm:justify-between'>
          <dl className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4'>
            {details.map(([label, value]) => (
              <div key={label} className='flex flex-col gap-0.5'>
                <dt className='text-xs text-mute'>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className='flex flex-col gap-1.5 sm:ml-auto'>
            <span className='text-xs text-mute'>소속</span>
            <Segmented<MemberAffiliation | ''>
              value={user.affiliation ?? ''}
              onChange={(next) =>
                next &&
                onRun(
                  user.id,
                  () => setUserAffiliationAction(user.id, next),
                  `${user.name}님의 소속을 ${AFFILIATION_LABELS[next]}(으)로 바꿨습니다`,
                )
              }
              options={[
                { value: 'club', label: AFFILIATION_LABELS.club },
                { value: 'external', label: AFFILIATION_LABELS.external },
              ]}
            />
          </div>
          {user.status === 'approved' && !isMe && (
            <button
              type='button'
              disabled={busy}
              onClick={() => setStatus('pending')}
              className={buttonClass('ghost', 'sm', 'self-start')}
            >
              승인 취소
            </button>
          )}
        </div>
      )}
    </li>
  )
}

function RequestList({
  requests,
  users,
  busyId,
  onIssue,
  onResolve,
}: {
  requests: HelpRequest[]
  users: AdminUser[]
  busyId: string | null
  onIssue: (user: AdminUser) => void
  onResolve: (request: HelpRequest) => void
}) {
  if (requests.length === 0) {
    return <div className='rounded-xl bg-surface py-16 text-center text-sm text-mute'>처리할 문의가 없습니다.</div>
  }

  return (
    <ul className='flex flex-col gap-1'>
      {requests.map((request) => {
        // 비밀번호 문의는 아이디로, 아이디 문의는 실명 또는 전화번호로 후보 계정을 찾는다
        const matches =
          request.kind === 'password'
            ? users.filter((user) => user.username === request.username)
            : users.filter(
                (user) =>
                  (request.phone && digits(user.phone) === digits(request.phone)) ||
                  (request.name && user.name === request.name),
              )
        return (
          <li
            key={request.id}
            className={classNames(
              'flex flex-col gap-3 rounded-xl bg-surface p-4',
              busyId === request.id && 'opacity-50',
            )}
          >
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <span className='flex flex-wrap items-center gap-2 text-[15px]'>
                <span className='rounded bg-field px-1.5 py-0.5 text-xs'>
                  {request.kind === 'password' ? '비밀번호 재설정' : '아이디 찾기'}
                </span>
                {request.name}
                <span className='text-xs text-mute'>
                  {request.kind === 'password' && `@${request.username} · `}
                  {request.phone} · <RelativeTime iso={request.created_at} />
                </span>
              </span>
              <button type='button' onClick={() => onResolve(request)} className={buttonClass('secondary', 'sm')}>
                처리 완료
              </button>
            </div>
            {request.message && <p className='rounded-lg bg-field p-3 text-sm'>{request.message}</p>}
            <div className='flex flex-col gap-2 text-sm'>
              <span className='text-xs text-mute'>가입 정보와 비교</span>
              {matches.length === 0 && (
                <span className='text-danger'>
                  {request.kind === 'password'
                    ? '해당 아이디의 계정이 없습니다.'
                    : '실명·전화번호가 일치하는 계정이 없습니다.'}{' '}
                  본인에게 직접 확인해 주세요.
                </span>
              )}
              {matches.map((user) => {
                const checks = [
                  ...(request.kind === 'password' ? [{ label: '아이디', value: `@${user.username}`, ok: true }] : []),
                  { label: '실명', value: user.name, ok: user.name === request.name },
                  { label: '전화번호', value: user.phone || '없음', ok: digits(user.phone) === digits(request.phone) },
                ]
                const verified = checks.every((check) => check.ok)
                return (
                  <div
                    key={user.id}
                    className='flex flex-col gap-2 rounded-lg bg-field p-3 sm:flex-row sm:items-center sm:justify-between'
                  >
                    <div className='flex flex-wrap gap-x-4 gap-y-1'>
                      {request.kind === 'username' && (
                        <span>
                          가입 아이디 <span className='font-medium'>@{user.username}</span>
                        </span>
                      )}
                      {checks.map((check) => (
                        <span key={check.label} className={check.ok ? 'text-ink' : 'text-danger'}>
                          {check.ok ? '✓' : '✗'} {check.label} {check.value}
                        </span>
                      ))}
                    </div>
                    {request.kind === 'password' && (
                      <button
                        type='button'
                        onClick={() => onIssue(user)}
                        className={buttonClass(verified ? 'primary' : 'secondary', 'sm', 'shrink-0')}
                        title={verified ? undefined : '일부 정보가 일치하지 않습니다. 본인 확인 후 발급하세요.'}
                      >
                        <GoKey size={13} />
                        재설정 링크 만들기
                      </button>
                    )}
                  </div>
                )
              })}
              {request.kind === 'username' && matches.length > 0 && (
                <span className='text-xs text-mute'>실명과 전화번호가 모두 맞는지 확인한 뒤 아이디를 알려주세요.</span>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
