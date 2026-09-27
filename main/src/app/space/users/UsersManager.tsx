'use client'

import classNames from 'classnames'
import { useMemo, useState, useTransition } from 'react'
import { GoSearch } from 'react-icons/go'
import { Checkbox, Input, PageHeader, buttonClass, useRefreshOnFocus, useServerState, useToast } from '@/components/admin/ui'
import { AFFILIATION_LABELS, formatJoined } from '../AccountFields'
import type { AdminUser, HelpRequest, Member, MemberAffiliation, MemberRole } from '@/types/cms'
import { downloadCsv } from '@/lib/csv'
import {
  approveAsMasterAction,
  createResetLinkAction,
  deleteUsersAction,
  resolveHelpRequestAction,
  setUserStatusAction,
} from './actions'
import { deleteMemberAction, setMemberPublishedAction, setMemberRoleAction } from '../members/actions'
import { MemberDetailModal, ResetLinkPanel, type ActionResult, type ResetLink } from './MemberDetailModal'
import { DEFAULT_SORT, MembersTable, nextSort, sortUsers, type Decision, type Sort } from './MembersTable'
import { RequestList } from './RequestList'
import { RolesModal } from './RolesModal'

type Tab = 'pending' | 'approved' | 'rejected' | 'requests'

const TABS: Record<Tab, string> = { pending: '승인 대기', approved: '승인됨', rejected: '거절됨', requests: '문의' }

// 목록은 소속별 묶음으로 나눠 보여준다 (미지정은 있을 때만)
type GroupKey = MemberAffiliation | 'none'
const AFFILIATION_GROUPS: { key: GroupKey; label: string }[] = [
  { key: 'club', label: AFFILIATION_LABELS.club },
  { key: 'external', label: AFFILIATION_LABELS.external },
  { key: 'none', label: '소속 미지정' },
]
const inGroup = (user: AdminUser, key: GroupKey) =>
  key === 'none' ? !user.affiliation : user.affiliation === key

const STATUS_LABELS: Record<AdminUser['status'], string> = { pending: '승인 대기', approved: '승인됨', rejected: '거절됨' }
const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ko-KR') : '')

/** CSV 한 줄 = 멤버 한 명 (표보다 자세하게) */
function toCsvRows(users: AdminUser[], profiles: Map<string, Member>): string[][] {
  // 칸 순서는 표와 같게, 표에 없는 정보는 뒤에
  const header = [
    '이름',
    '역할',
    '학번',
    '전공',
    '전화번호',
    '오픈소스랩 가입',
    '아이디',
    '권한',
    '소속',
    '홍익대학교',
    '상태',
    '가입 신청일',
    '최근 로그인',
  ]
  return [
    header,
    ...users.map((user) => {
      const profile = user.member_id ? profiles.get(user.member_id) : undefined
      return [
        user.name,
        profile?.role ?? '',
        user.student_id,
        user.major,
        user.phone,
        formatJoined(user.joined_year, user.joined_half),
        user.username,
        user.is_master ? '운영자' : '멤버',
        user.affiliation ? AFFILIATION_LABELS[user.affiliation] : '미지정',
        user.is_hongik ? '예' : '아니요',
        STATUS_LABELS[user.status],
        formatDate(user.created_at),
        formatDate(user.last_login_at),
      ]
    }),
  ]
}

/** 이름 · 아이디 · 전화번호 · 학번 · 전공으로 찾기 (공백 · 하이픈 무시) */
const matchesQuery = (user: AdminUser, query: string) => {
  const normalize = (text: string) => text.toLowerCase().replace(/[\s-]/g, '')
  const q = normalize(query)
  return !q || [user.name, user.username, user.phone, user.student_id, user.major].some((text) => normalize(text ?? '').includes(q))
}

export function UsersManager({
  initialUsers,
  initialRequests,
  initialMembers,
  initialRoles,
  currentUserId,
}: {
  initialUsers: AdminUser[]
  initialRequests: HelpRequest[]
  /** Members 페이지 프로필 (각 멤버에 연결됨) */
  initialMembers: Member[]
  /** 프로필 역할 목록 (운영자가 관리) */
  initialRoles: MemberRole[]
  currentUserId: string
}) {
  const [users, setUsers] = useServerState(initialUsers)
  const [requests, setRequests] = useServerState(initialRequests)
  const [profiles, setProfiles] = useServerState(initialMembers)
  const [roles, setRoles] = useServerState(initialRoles)
  const [rolesOpen, setRolesOpen] = useState(false)
  useRefreshOnFocus()
  const [tab, setTab] = useState<Tab>(() =>
    initialUsers.some((user) => user.status === 'pending')
      ? 'pending'
      : initialRequests.length
        ? 'requests'
        : 'approved',
  )
  const [query, setQuery] = useState('')
  // 정렬은 소속 묶음마다 따로 (학교 소모임에서 정렬해도 외부 활동은 그대로)
  const [sorts, setSorts] = useState<Partial<Record<GroupKey, Sort>>>({})
  const sortOf = (key: GroupKey) => sorts[key] ?? DEFAULT_SORT
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [openId, setOpenId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [resetLink, setResetLink] = useState<ResetLink | null>(null)
  const [, startTransition] = useTransition()
  const toast = useToast()

  const profileMap = useMemo(() => new Map(profiles.map((member) => [member.id, member])), [profiles])
  const openUser = users.find((user) => user.id === openId) ?? null

  const counts: Record<Tab, number> = {
    pending: users.filter((user) => user.status === 'pending').length,
    approved: users.filter((user) => user.status === 'approved').length,
    rejected: users.filter((user) => user.status === 'rejected').length,
    requests: requests.length,
  }
  // 화면 순서: 소속 묶음 순서대로, 묶음 안에서는 그 묶음의 정렬
  const groups = AFFILIATION_GROUPS.map((group) => ({
    ...group,
    users: sortUsers(
      users.filter((user) => user.status === tab && inGroup(user, group.key) && matchesQuery(user, query)),
      sortOf(group.key),
      profileMap,
    ),
  }))
  const visible = groups.flatMap((group) => group.users)

  /** 승인 대기 표에서 바로 처리 */
  const decide = (user: AdminUser, decision: Decision) => {
    if (decision === 'approve')
      return run(user.id, () => setUserStatusAction(user.id, 'approved'), `${user.name}님을 승인했습니다`)
    if (decision === 'operator') {
      if (!confirm(`${user.name}님을 운영자로 승인할까요?\n모든 프로젝트·프로필·멤버를 함께 관리할 수 있게 됩니다.`)) return
      return run(user.id, () => approveAsMasterAction(user.id), `${user.name}님을 운영자로 승인했습니다`)
    }
    if (!confirm(`${user.name}님의 가입 신청을 거절할까요?`)) return
    run(user.id, () => setUserStatusAction(user.id, 'rejected'), `${user.name}님의 가입을 거절했습니다`)
  }

  /* ─── 선택 · CSV 내보내기 ─── */

  const select = (ids: string[], checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })

  const changeTab = (next: Tab) => {
    setTab(next)
    setSelected(new Set())
  }

  const exportCsv = () => {
    // 화면에 보이는 순서(정렬) 그대로
    const rows = visible.filter((user) => selected.has(user.id))
    if (rows.length === 0) return
    const date = new Date().toISOString().slice(0, 10)
    downloadCsv(`osl-members-${TABS[tab]}-${date}.csv`, toCsvRows(rows, profileMap))
    toast.show(`${rows.length}명을 CSV로 내보냈습니다`)
  }
  const selectedVisible = visible.filter((user) => selected.has(user.id)).length

  const deleteSelected = () => {
    // 본인 계정은 여기서 지울 수 없다 (탈퇴는 계정 설정에서)
    const targets = visible.filter((user) => selected.has(user.id) && user.id !== currentUserId)
    if (targets.length === 0) return toast.show('본인 계정은 여기서 삭제할 수 없어요', 'error')
    const names = targets.slice(0, 5).map((user) => user.name).join(', ') + (targets.length > 5 ? ` 외 ${targets.length - 5}명` : '')
    if (
      !confirm(
        `${targets.length}명의 계정을 삭제할까요?\n${names}\n\n작성한 프로젝트는 남고 작성자 정보만 비워지며, Members 페이지의 프로필은 함께 삭제됩니다. 되돌릴 수 없습니다.`,
      )
    )
      return
    startTransition(async () => {
      const result = await deleteUsersAction(targets.map((user) => user.id))
      if ('message' in result) return toast.show(result.message, 'error')
      const deleted = new Set(result.deleted)
      const removedProfiles = new Set(targets.filter((user) => deleted.has(user.id)).map((user) => user.member_id))
      setUsers((current) => current.filter((user) => !deleted.has(user.id)))
      setProfiles((current) => current.filter((member) => !removedProfiles.has(member.id)))
      setSelected(new Set())
      toast.show(`${deleted.size}명의 계정을 삭제했습니다`)
    })
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

  /* ─── 프로필 (내용은 본인이, 운영자는 공개 여부 · 삭제만) ─── */

  const toggleProfile = (member: Member, published: boolean) => {
    setProfiles((current) => current.map((item) => (item.id === member.id ? { ...item, published } : item)))
    startTransition(async () => {
      try {
        await setMemberPublishedAction(member.id, published)
        toast.show(published ? `'${member.name}' 프로필 공개됨` : `'${member.name}' 프로필 비공개로 전환`)
      } catch {
        setProfiles((current) =>
          current.map((item) => (item.id === member.id ? { ...item, published: !published } : item)),
        )
        toast.show('상태를 바꾸지 못했습니다', 'error')
      }
    })
  }

  const changeProfileRole = (member: Member, role: string) => {
    const previous = member.role
    setProfiles((current) => current.map((item) => (item.id === member.id ? { ...item, role } : item)))
    startTransition(async () => {
      try {
        await setMemberRoleAction(member.id, role)
        toast.show(role ? `'${member.name}' 역할을 ${role}(으)로 바꿨습니다` : `'${member.name}' 역할을 비웠습니다`)
      } catch {
        setProfiles((current) => current.map((item) => (item.id === member.id ? { ...item, role: previous } : item)))
        toast.show('역할을 바꾸지 못했습니다', 'error')
      }
    })
  }

  const removeProfile = (user: AdminUser, member: Member) => {
    if (
      !confirm(
        `${user.name}님의 프로필을 삭제할까요?\n${user.name}님은 '프로필카드 설정'에서 다시 만들 수 있어요. 삭제하면 되돌릴 수 없습니다.`,
      )
    )
      return
    setBusyId(user.id)
    startTransition(async () => {
      try {
        await deleteMemberAction(member.id)
        setProfiles((current) => current.filter((item) => item.id !== member.id))
        // DB에서 member_id는 자동으로 비워진다 (on delete set null)
        setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, member_id: null } : item)))
        toast.show('프로필을 삭제했습니다')
      } catch {
        toast.show('삭제하지 못했습니다', 'error')
      } finally {
        setBusyId(null)
      }
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
        title='멤버 관리'
        description='가입 승인, 소속, 운영자 지정, Members 페이지 프로필, 비밀번호 재설정 문의를 관리합니다. 멤버를 누르면 자세한 정보와 설정이 열려요.'
        actions={
          <button type='button' onClick={() => setRolesOpen(true)} className={buttonClass('secondary')}>
            역할 관리
          </button>
        }
      />

      {/* 툴바: 상태 탭 + 검색 */}
      <div className='flex flex-wrap items-center gap-2'>
        <div className='flex overflow-x-auto rounded-lg bg-tile p-0.5'>
          {(Object.keys(TABS) as Tab[]).map((value) => (
            <button
              key={value}
              type='button'
              onClick={() => changeTab(value)}
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
        {tab !== 'requests' && (
          <div className='relative ml-auto w-full sm:w-64'>
            <GoSearch className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mute' size={14} />
            <Input
              type='search'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='이름, 아이디, 전화번호, 학번, 전공'
              className='bg-tile pl-9'
            />
          </div>
        )}
      </div>

      {/* 방금 만든 재설정 링크 (문의 탭에서 발급했을 때) */}
      {resetLink && !openUser && (
        <ResetLinkPanel
          link={resetLink}
          name={users.find((user) => user.id === resetLink.userId)?.name}
          onClose={() => setResetLink(null)}
          onCopied={() => toast.show('링크를 복사했습니다')}
        />
      )}

      {/* 선택 막대 */}
      {tab !== 'requests' && (
        <div className='flex min-h-9 flex-wrap items-center gap-2 px-1 text-sm'>
          <label className='flex cursor-pointer items-center gap-2 text-mute'>
            <Checkbox
              aria-label='보이는 멤버 전체 선택'
              checked={selectedVisible === visible.length && visible.length > 0}
              indeterminate={selectedVisible > 0 && selectedVisible < visible.length}
              onChange={(event) => select(visible.map((user) => user.id), event.target.checked)}
            />
            {selectedVisible > 0 ? <span className='text-ink'>{selectedVisible}명 선택됨</span> : '전체 선택'}
          </label>
          {selectedVisible > 0 && (
            <>
              <button type='button' onClick={exportCsv} className={buttonClass('primary', 'sm')}>
                CSV 내보내기
              </button>
              <button type='button' onClick={() => setSelected(new Set())} className={buttonClass('ghost', 'sm')}>
                선택 해제
              </button>
              <button type='button' onClick={deleteSelected} className={buttonClass('danger', 'sm', 'ml-auto')}>
                계정 삭제
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'requests' ? (
        <RequestList requests={requests} users={users} busyId={busyId} onIssue={issueResetLink} onResolve={resolve} />
      ) : (
        <div className='flex flex-col gap-6'>
          {groups.map(({ key, label, users: group }) => {
            if (group.length === 0) return null
            return (
              <section key={key} className='flex flex-col gap-2'>
                <h2 className={classNames('flex items-baseline gap-1.5 px-1 text-sm', key === 'none' && 'text-danger')}>
                  {label}
                </h2>
                <MembersTable
                  users={group}
                  profiles={profileMap}
                  currentUserId={currentUserId}
                  busyId={busyId}
                  sort={sortOf(key)}
                  selected={selected}
                  onSelect={select}
                  onSort={(column) => setSorts((current) => ({ ...current, [key]: nextSort(sortOf(key), column) }))}
                  onOpen={(user) => setOpenId(user.id)}
                  onDecide={decide}
                />
              </section>
            )
          })}
          {visible.length === 0 && (
            <div className='rounded-xl bg-surface py-16 text-center text-sm text-mute'>
              {query.trim()
                ? `'${query.trim()}'에 해당하는 멤버가 없어요.`
                : tab === 'pending'
                  ? '승인을 기다리는 가입 신청이 없습니다.'
                  : '해당하는 멤버가 없습니다.'}
            </div>
          )}
        </div>
      )}

      <MemberDetailModal
        user={openUser}
        profile={openUser?.member_id ? (profileMap.get(openUser.member_id) ?? null) : null}
        roles={roles.map((role) => role.name)}
        isMe={openUser?.id === currentUserId}
        busy={Boolean(openUser && busyId === openUser.id)}
        resetLink={resetLink && openUser && resetLink.userId === openUser.id ? resetLink : null}
        onClose={() => setOpenId(null)}
        onRun={run}
        onIssueReset={issueResetLink}
        onCloseResetLink={() => setResetLink(null)}
        onCopiedResetLink={() => toast.show('링크를 복사했습니다')}
        onToggleProfile={toggleProfile}
        onChangeProfileRole={changeProfileRole}
        onRemoveProfile={removeProfile}
        onRemoved={(user) => {
          setUsers((current) => current.filter((item) => item.id !== user.id))
          setOpenId(null)
        }}
      />
      <RolesModal
        open={rolesOpen}
        onClose={() => setRolesOpen(false)}
        roles={roles}
        profiles={profiles}
        onRolesChange={setRoles}
        onProfilesChange={setProfiles}
        onMessage={(message, tone) => toast.show(message, tone)}
      />
      {toast.node}
    </div>
  )
}
