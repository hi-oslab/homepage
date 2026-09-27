'use client'

import classNames from 'classnames'
import { GoArrowDown, GoArrowUp } from 'react-icons/go'
import { Checkbox, buttonClass } from '@/components/admin/ui'
import type { AdminUser, Member } from '@/types/cms'
import { formatJoined } from '../AccountFields'
import { OperatorBadge } from '@/components/OperatorBadge'
import { ProfileImage } from '@/components/ProfileImage'
import { ROLE_LABELS } from '@/lib/roles'

/* ─── 정렬 ─────────────────────────────────────────────────────────────── */

export type SortKey = 'name' | 'role' | 'student_id' | 'major' | 'phone' | 'joined' | 'username' | 'operator'
export type Sort = { key: SortKey; dir: 'asc' | 'desc' }

/** 기본: 가입 시기 최신순 (Members 페이지와 같은 순서) */
export const DEFAULT_SORT: Sort = { key: 'joined', dir: 'desc' }

/** 칸을 처음 누르면 글자는 오름차순, 가입 시기 · 권한은 내림차순(최신 · 운영자)부터 */
const FIRST_DIR: Record<SortKey, Sort['dir']> = {
  name: 'asc',
  role: 'asc',
  student_id: 'asc',
  major: 'asc',
  phone: 'asc',
  joined: 'desc',
  username: 'asc',
  operator: 'desc',
}

export const nextSort = (current: Sort, key: SortKey): Sort =>
  current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: FIRST_DIR[key] }

export function sortUsers(users: AdminUser[], sort: Sort, profiles: Map<string, Member>): AdminUser[] {
  const value = (user: AdminUser): string | number => {
    switch (sort.key) {
      case 'name':
        return user.name
      case 'username':
        return user.username
      case 'operator':
        // 운영자 → 운영자 신청 → 멤버
        return user.is_master ? 2 : user.master_requested ? 1 : 0
      case 'role':
        return (user.member_id ? profiles.get(user.member_id)?.role : '') ?? ''
      case 'joined':
        return (user.joined_year ?? 0) * 2 + (user.joined_half === 'H2' ? 1 : 0)
      case 'phone':
        return user.phone.replace(/[^\d]/g, '')
      case 'student_id':
        return user.student_id.trim().toUpperCase()
      case 'major':
        return user.major
    }
  }
  const direction = sort.dir === 'asc' ? 1 : -1
  return users.slice().sort((a, b) => {
    const [x, y] = [value(a), value(b)]
    const compared = typeof x === 'number' ? x - (y as number) : x.localeCompare(y as string, 'ko', { numeric: true })
    // 값이 같으면(비어 있는 경우 포함) 가입 순
    return compared * direction || a.created_at.localeCompare(b.created_at)
  })
}

/** 누르면 정렬되는 칸 제목 */
function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  sort: Sort
  onSort: (key: SortKey) => void
  className?: string
}) {
  const active = sort.key === sortKey
  const Arrow = sort.dir === 'asc' ? GoArrowUp : GoArrowDown
  return (
    <th
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={classNames('py-1.5 font-normal', className)}
    >
      <button
        type='button'
        onClick={() => onSort(sortKey)}
        className={classNames(
          '-mx-1.5 flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-field hover:text-ink',
          active && 'text-ink',
        )}
      >
        {label}
        <Arrow size={11} className={active ? 'opacity-100' : 'opacity-0'} aria-hidden />
      </button>
    </th>
  )
}

/** 멤버 목록 표. 행을 누르면 상세 모달이 열린다 */
/*
 * 칸: [선택] 이미지 · 이름 · 역할 · 학번 · 전공 · 전화번호 · 가입 시기 · 아이디 · 권한 · 더보기
 * 소속 묶음마다 표가 따로라 칸 위치가 맞도록 너비를 비율로 고정하고, 빈 공간 없이 표 전체를 나눠 쓴다.
 * 좁은 화면에서는 뒤쪽 칸부터 숨기고, 숨은 정보는 더보기(상세 모달)에서 본다.
 */
const COLUMNS: { key: SortKey; label: string; className: string }[] = [
  { key: 'name', label: '이름', className: 'w-[14%]' },
  { key: 'role', label: '역할', className: 'hidden w-[12%] sm:table-cell' },
  { key: 'student_id', label: '학번', className: 'hidden w-[10%] md:table-cell' },
  { key: 'major', label: '전공', className: 'hidden w-[17%] md:table-cell' },
  { key: 'phone', label: '전화번호', className: 'hidden w-[13%] lg:table-cell' },
  { key: 'joined', label: '가입 시기', className: 'hidden w-[11%] xl:table-cell' },
  { key: 'username', label: '아이디', className: 'hidden w-[12%] lg:table-cell' },
  { key: 'operator', label: '권한', className: 'hidden w-[9%] sm:table-cell' },
]

export function MembersTable({
  users,
  profiles,
  currentUserId,
  busyId,
  sort,
  onSort,
  selected,
  onSelect,
  onOpen,
  onApprove,
}: {
  users: AdminUser[]
  /** member id → 프로필 */
  profiles: Map<string, Member>
  currentUserId: string
  busyId: string | null
  sort: Sort
  onSort: (key: SortKey) => void
  /** CSV 내보내기 · 삭제할 멤버 */
  selected: Set<string>
  onSelect: (ids: string[], checked: boolean) => void
  onOpen: (user: AdminUser) => void
  /** 승인 대기 행의 빠른 승인 */
  onApprove: (user: AdminUser) => void
}) {
  const selectedCount = users.filter((user) => selected.has(user.id)).length
  const allSelected = selectedCount === users.length && users.length > 0
  const cell = (key: SortKey) => COLUMNS.find((column) => column.key === key)!.className.replace(/w-\[[^\]]+\]/, '')

  return (
    <div className='overflow-x-auto rounded-xl bg-surface'>
      <table className='w-full table-fixed text-left text-sm whitespace-nowrap'>
        <thead className='text-xs text-mute'>
          <tr>
            <th className='w-10 pl-4'>
              <Checkbox
                aria-label='이 묶음 전체 선택'
                checked={allSelected}
                indeterminate={selectedCount > 0 && !allSelected}
                onChange={(event) => onSelect(users.map((user) => user.id), event.target.checked)}
              />
            </th>
            <th className='w-12 px-1'>
              <span className='sr-only'>프로필 이미지</span>
            </th>
            {COLUMNS.map((column) => (
              <SortHeader
                key={column.key}
                label={column.label}
                sortKey={column.key}
                sort={sort}
                onSort={onSort}
                className={classNames('px-3', column.className)}
              />
            ))}
            <th className='w-36 px-3'>
              <span className='sr-only'>더보기</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const profile = user.member_id ? profiles.get(user.member_id) : undefined
            const busy = busyId === user.id
            const text = 'truncate px-3 py-3 text-ink/70'
            return (
              <tr
                key={user.id}
                onClick={() => onOpen(user)}
                className={classNames(
                  'cursor-pointer border-t border-paper transition-colors hover:bg-field',
                  selected.has(user.id) && 'bg-field',
                  busy && 'opacity-50',
                )}
              >
                <td className='pl-4' onClick={(event) => event.stopPropagation()}>
                  <Checkbox
                    aria-label={`${user.name} 선택`}
                    checked={selected.has(user.id)}
                    onChange={(event) => onSelect([user.id], event.target.checked)}
                  />
                </td>
                <td className='px-1 py-2'>
                  <ProfileImage src={profile?.cover_image_url} name={user.name} size='sm' className='size-8' />
                </td>
                <td className='truncate px-3 py-3 text-[15px]'>
                  {user.name}
                  {user.id === currentUserId && <span className='ml-1.5 text-xs text-mute'>(나)</span>}
                </td>
                <td className={classNames(text, cell('role'))}>{profile?.role || '—'}</td>
                <td className={classNames(text, 'tabular-nums', cell('student_id'))}>{user.student_id || '—'}</td>
                <td className={classNames(text, cell('major'))}>{user.major || '—'}</td>
                <td className={classNames(text, 'tabular-nums', cell('phone'))}>{user.phone || '—'}</td>
                <td className={classNames(text, cell('joined'))}>{formatJoined(user.joined_year, user.joined_half)}</td>
                <td className={classNames(text, cell('username'))}>@{user.username}</td>
                <td className={classNames('px-3 py-3', cell('operator'))}>
                  {user.is_master ? (
                    <OperatorBadge />
                  ) : user.master_requested ? (
                    <span className='text-xs text-danger'>운영자 신청</span>
                  ) : (
                    <span className='text-xs text-mute'>{ROLE_LABELS.member.en}</span>
                  )}
                </td>
                <td className='px-3 py-2' onClick={(event) => event.stopPropagation()}>
                  <span className='flex items-center justify-end gap-1'>
                    {user.status === 'pending' && !user.master_requested && (
                      <button
                        type='button'
                        disabled={busy}
                        onClick={() => onApprove(user)}
                        className={buttonClass('primary', 'sm')}
                      >
                        승인
                      </button>
                    )}
                    <button type='button' onClick={() => onOpen(user)} className={buttonClass('ghost', 'sm')}>
                      더보기
                    </button>
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
