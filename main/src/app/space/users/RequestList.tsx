'use client'

import classNames from 'classnames'
import { GoKey } from 'react-icons/go'
import { buttonClass } from '@/components/admin/ui'
import type { AdminUser, HelpRequest } from '@/types/cms'
import { RelativeTime } from '../DashboardActions'

const digits = (value: string) => value.replace(/[^\d]/g, '')

/** 로그인 도움 요청(비밀번호 재설정 / 아이디 찾기) 목록 — 가입 정보와 비교해 본인 확인 */
export function RequestList({
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
