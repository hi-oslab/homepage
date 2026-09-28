'use client'

import classNames from 'classnames'
import { GoCopy } from 'react-icons/go'
import { Input, Panel, Switch, buttonClass } from '@/components/admin/ui'
import { Modal } from '@/components/admin/Modal'
import { ROLE_LABELS } from '@/lib/roles'
import type { AdminUser, AdminUserStatus, Member, MemberAffiliation } from '@/types/cms'
import { RelativeTime } from '../DashboardActions'
import { AFFILIATION_LABELS, Segmented, formatJoined } from '../AccountFields'
import {
  approveAsMasterAction,
  deleteUserAction,
  setUserAffiliationAction,
  setUserMasterAction,
  setUserStatusAction,
} from './actions'
import { MemberProfileSection } from './MemberProfiles'
import { OperatorBadge } from '@/components/OperatorBadge'

export type ActionResult = { ok: true; user?: AdminUser } | { ok: false; message: string }
export type ResetLink = { userId: string; url: string; expiresAt: string }
export type RunAction = (id: string, action: () => Promise<ActionResult>, success: string, onDone?: () => void) => void

/** 멤버 한 명의 상세 정보와 설정 (가입 정보 · 소속 · 운영자 · 프로필 · 비밀번호 · 승인 · 삭제) */
export function MemberDetailModal({
  user,
  profile,
  roles,
  isMe,
  busy,
  resetLink,
  onClose,
  onRun,
  onIssueReset,
  onCloseResetLink,
  onCopiedResetLink,
  onToggleProfile,
  onChangeProfileRole,
  onRemoveProfile,
  onRemoved,
}: {
  user: AdminUser | null
  /** 이 멤버의 Members 페이지 프로필 */
  profile: Member | null
  /** 역할 목록 (운영자가 관리) */
  roles: string[]
  isMe: boolean
  busy: boolean
  /** 방금 만든 재설정 링크 (이 멤버 것일 때만) */
  resetLink: ResetLink | null
  onClose: () => void
  onRun: RunAction
  onIssueReset: (user: AdminUser) => void
  onCloseResetLink: () => void
  onCopiedResetLink: () => void
  onToggleProfile: (member: Member, published: boolean) => void
  onChangeProfileRole: (member: Member, role: string) => void
  onRemoveProfile: (user: AdminUser, member: Member) => void
  onRemoved: (user: AdminUser) => void
}) {
  return (
    <Modal
      open={Boolean(user)}
      onClose={onClose}
      title={
        user && (
          <span className='flex items-center gap-2'>
            {user.name}
            {user.is_master && <OperatorBadge />}
            {isMe && <span className='text-sm font-normal text-mute'>(나)</span>}
          </span>
        )
      }
      meta={user && `@${user.username} · 신청 ${new Date(user.created_at).toLocaleDateString('ko-KR')}`}
      footer={user && <Footer user={user} isMe={isMe} busy={busy} onRun={onRun} onIssueReset={onIssueReset} onRemoved={onRemoved} />}
    >
      {user && (
        <div className={classNames('flex flex-col gap-3 transition-opacity', busy && 'opacity-50')}>
          {resetLink && <ResetLinkPanel link={resetLink} name={user.name} onClose={onCloseResetLink} onCopied={onCopiedResetLink} />}

          <Panel title='가입 정보'>
            <dl className='grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3'>
              {[
                ['전화번호', user.phone || '—'],
                ['오픈소스랩 가입', formatJoined(user.joined_year, user.joined_half)],
                ['홍익대학교', user.is_hongik ? '예' : '아니요'],
                ['학번', user.student_id || '—'],
                ['전공', user.major || '—'],
                ['운영자 신청', user.master_requested ? '신청함' : '—'],
                ['최근 로그인', user.last_login_at ? <RelativeTime key='login' iso={user.last_login_at} /> : '—'],
              ].map(([label, value]) => (
                <div key={label as string} className='flex flex-col gap-0.5'>
                  <dt className='text-xs text-mute'>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title='소속'>
            <Segmented<MemberAffiliation | ''>
              value={user.affiliation ?? ''}
              onChange={(next) => {
                if (!next || next === user.affiliation) return
                if (!confirm(`${user.name}님의 소속을 '${AFFILIATION_LABELS[next]}'(으)로 바꿀까요?`)) return
                onRun(
                  user.id,
                  () => setUserAffiliationAction(user.id, next),
                  `${user.name}님의 소속을 ${AFFILIATION_LABELS[next]}(으)로 바꿨습니다`,
                )
              }}
              options={[
                { value: 'club', label: AFFILIATION_LABELS.club },
                { value: 'external', label: AFFILIATION_LABELS.external },
              ]}
            />
            {!user.affiliation && <p className='-mt-2 text-xs text-danger'>아직 소속을 고르지 않았어요.</p>}
          </Panel>

          {user.status === 'approved' && (
            <Panel>
              <div className='flex items-center justify-between gap-3'>
                <div className='flex flex-col gap-0.5'>
                  <span className='text-sm'>{ROLE_LABELS.operator.ko}</span>
                  <span className='text-xs text-mute'>프로젝트·프로필·멤버를 함께 관리해요.</span>
                </div>
                <Switch
                  checked={user.is_master}
                  disabled={busy}
                  onChange={(value) => {
                    const message = value
                      ? `${user.name}님을 운영자로 지정할까요?\n모든 프로젝트·프로필·멤버를 함께 관리할 수 있게 됩니다.`
                      : `${user.name}님을 운영자에서 해제할까요?\n프로젝트·프로필·멤버 관리 권한이 없어집니다.`
                    if (!confirm(message)) return
                    onRun(
                      user.id,
                      () => setUserMasterAction(user.id, value),
                      value ? '운영자로 지정했습니다' : '운영자에서 해제했습니다',
                    )
                  }}
                />
              </div>
            </Panel>
          )}

          {user.status === 'approved' && (
            <MemberProfileSection
              member={profile}
              roles={roles}
              busy={busy}
              onTogglePublished={(published) => profile && onToggleProfile(profile, published)}
              onChangeRole={(role) => profile && onChangeProfileRole(profile, role)}
              onRemove={() => profile && onRemoveProfile(user, profile)}
            />
          )}
        </div>
      )}
    </Modal>
  )
}

/** 모달 아래 버튼: 왼쪽은 승인 상태, 오른쪽은 계정 관리 */
function Footer({
  user,
  isMe,
  busy,
  onRun,
  onIssueReset,
  onRemoved,
}: {
  user: AdminUser
  isMe: boolean
  busy: boolean
  onRun: RunAction
  onIssueReset: (user: AdminUser) => void
  onRemoved: (user: AdminUser) => void
}) {
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
    if (!confirm(`${user.name}님을 운영자로 승인할까요?\n모든 프로젝트·프로필·멤버를 함께 관리할 수 있게 됩니다.`)) return
    onRun(user.id, () => approveAsMasterAction(user.id), `${user.name}님을 운영자로 승인했습니다`)
  }

  const remove = () => {
    if (
      !confirm(
        `'${user.name}' 계정을 삭제할까요?\n작성한 프로젝트는 남고 작성자 정보만 비워지며, Members 페이지의 프로필은 함께 삭제됩니다.`,
      )
    )
      return
    onRun(user.id, () => deleteUserAction(user.id), '계정을 삭제했습니다', () => onRemoved(user))
  }

  return (
    <>
      {user.status !== 'approved' && user.master_requested && (
        <button type='button' disabled={busy} onClick={approveAsMaster} className={buttonClass('primary', 'sm')}>
          운영자로 승인
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
        <button type='button' disabled={busy} onClick={() => setStatus('rejected')} className={buttonClass('secondary', 'sm')}>
          거절
        </button>
      )}
      {user.status === 'approved' && !isMe && (
        <button type='button' disabled={busy} onClick={() => setStatus('pending')} className={buttonClass('ghost', 'sm')}>
          승인 취소
        </button>
      )}
      {!isMe && (
        <span className='ml-auto flex gap-2'>
          <button type='button' disabled={busy} onClick={() => onIssueReset(user)} className={buttonClass('ghost', 'sm')}>
            비밀번호 재설정 링크
          </button>
          <button type='button' disabled={busy} onClick={remove} className={buttonClass('danger', 'sm')}>
            계정 삭제
          </button>
        </span>
      )}
    </>
  )
}

/** 방금 만든 비밀번호 재설정 링크 (다시 볼 수 없으므로 복사해서 전달) */
export function ResetLinkPanel({
  link,
  name,
  onClose,
  onCopied,
}: {
  link: ResetLink
  name?: string
  onClose: () => void
  onCopied: () => void
}) {
  return (
    <div className='rounded-block flex flex-col gap-3 bg-ink p-5 text-paper'>
      <div className='flex items-center justify-between gap-3'>
        <span className='text-sm'>{name}님의 비밀번호 재설정 링크</span>
        <button type='button' onClick={onClose} className='text-xs text-paper/50 hover:text-paper'>
          닫기
        </button>
      </div>
      <div className='flex flex-col gap-2 sm:flex-row'>
        <Input readOnly value={link.url} onFocus={(event) => event.target.select()} className='bg-paper/10 text-sm text-paper' />
        <button
          type='button'
          onClick={async () => {
            await navigator.clipboard.writeText(link.url)
            onCopied()
          }}
          className={buttonClass('plain', 'md', 'shrink-0 bg-paper text-ink hover:opacity-85')}
        >
          <GoCopy size={14} />
          복사
        </button>
      </div>
      <p className='text-xs leading-relaxed text-paper/60'>
        카톡 등으로 본인에게만 전달하세요. 한 번 사용하면 무효가 되고, {new Date(link.expiresAt).toLocaleString('ko-KR')}에
        만료됩니다. 닫으면 다시 볼 수 없어요.
      </p>
    </div>
  )
}
