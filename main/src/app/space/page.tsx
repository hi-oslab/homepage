import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser, isApproved } from '@/lib/admin-auth'
import { getAdminMembers, getAdminUsers, getAdminWorks, getMember } from '@/lib/cms'
import { PageHeader, Panel } from '@/components/admin/ui'
// 서버 컴포넌트: 클라이언트 모듈(ui) 대신 styles에서 직접 가져온다
import { buttonClass } from '@/components/admin/styles'
import { Arrow } from '@/components/Typography'
import { createWorkAction } from './works/actions'
import { DashboardActions, RelativeTime } from './DashboardActions'
import { CommunityBoard } from './CommunityBoard'
import { getCommunityFeed } from '@/lib/community'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  // 대시보드에서는 리다이렉트하지 않는다 (승인 대기 안내는 레이아웃이 보여주므로 여기서 /admin 으로 보내면 무한 루프)
  const user = await getCurrentUser().catch(() => null)
  if (!isApproved(user)) return null
  // 첫 로그인: 멤버 프로필 연결부터 (기존 프로필 선택 / 새로 만들기 / 나중에)
  if (!user.member_id && !user.onboarded_at) redirect('/space/profile?welcome=1')
  const isMaster = user.is_master
  const [works, members, users, profile, posts] = await Promise.all([
    getAdminWorks('updated_at', isMaster ? undefined : user.id),
    isMaster ? getAdminMembers() : Promise.resolve([]),
    isMaster ? getAdminUsers() : Promise.resolve([]),
    user.member_id ? getMember(user.member_id) : Promise.resolve(null),
    getCommunityFeed(),
  ])
  const pendingUsers = users.filter((item) => item.status === 'pending')

  const publishedWorks = works.filter((work) => work.published).length
  const publishedMembers = members.filter((member) => member.published).length
  const drafts = works.filter((work) => !work.published)
  const missingThumbnail = works.filter((work) => work.published && !work.thumbnail_url)

  const stats = isMaster
    ? [
        { label: '공개 작품', value: publishedWorks, sub: `전체 ${works.length}`, href: '/space/works' },
        { label: '비공개 작품', value: drafts.length, sub: '작성 중', href: '/space/works?status=draft' },
        { label: '승인 대기 멤버', value: pendingUsers.length, sub: `공개 프로필 ${publishedMembers}`, href: '/space/users' },
      ]
    : [
        { label: '내 공개 작품', value: publishedWorks, sub: `전체 ${works.length}`, href: '/space/works' },
        { label: '내 비공개 작품', value: drafts.length, sub: '작성 중', href: '/space/works?status=draft' },
        {
          label: '내 프로필',
          value: profile ? (profile.published ? '공개' : '비공개') : '없음',
          sub: profile ? profile.name : '만들어 주세요',
          href: '/space/profile',
        },
      ]

  return (
    <div className='flex flex-col gap-3'>
      <PageHeader
        title={`안녕하세요, ${user.name}님`}
        description={isMaster ? '오픈소스랩 웹사이트의 작품, 프로필, 멤버를 관리합니다.' : '내 프로필과 작품을 관리합니다.'}
        actions={
          <form action={createWorkAction}>
            <button className={buttonClass('primary')}>+ 새 작품</button>
          </form>
        }
      />

      {/* 현황 */}
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className='group flex flex-col justify-between gap-8 rounded-xl bg-surface p-5 transition-colors hover:bg-ink hover:text-white'
          >
            <span className='flex items-center justify-between text-sm text-mute group-hover:text-white/60'>
              {stat.label}
              <Arrow className='size-4' />
            </span>
            <span className='flex items-baseline gap-2'>
              <span className='text-5xl font-medium tracking-[-0.04em]'>{stat.value}</span>
              <span className='text-xs text-mute group-hover:text-white/60'>{stat.sub}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* 커뮤니티 */}
      <CommunityBoard initialPosts={posts} me={{ id: user.id, isMaster }} />

      <div className='grid grid-cols-1 gap-3 lg:grid-cols-3'>
        {/* 최근 수정 */}
        <Panel title={isMaster ? '최근 수정한 작품' : '최근 수정한 내 작품'} className='lg:col-span-2'>
          <ul className='-mx-2 flex flex-col'>
            {works.slice(0, 6).map((work) => (
              <li key={work.id}>
                <Link
                  href={`/space/works/${work.id}`}
                  className='flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-field'
                >
                  <span className='h-9 w-12 shrink-0 overflow-hidden rounded-md bg-field'>
                    {work.thumbnail_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={work.thumbnail_url} alt='' className='size-full object-cover' />
                    )}
                  </span>
                  <span className='min-w-0 flex-1 truncate text-sm'>{work.title}</span>
                  {!work.published && <span className='text-xs text-mute'>비공개</span>}
                  <RelativeTime iso={work.updated_at} />
                </Link>
              </li>
            ))}
            {works.length === 0 && (
              <li className='px-2 py-6 text-sm text-mute'>아직 작품이 없습니다. 오른쪽 위 &apos;새 작품&apos;으로 시작해 보세요.</li>
            )}
          </ul>
        </Panel>

        <div className='flex flex-col gap-3'>
          {isMaster && pendingUsers.length > 0 && (
            <Panel title='가입 승인 대기'>
              <ul className='-mx-2 flex flex-col text-sm'>
                {pendingUsers.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <Link href='/space/users' className='flex justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-field'>
                      <span className='truncate'>
                        {item.name}
                        {item.master_requested && <span className='ml-1.5 text-xs text-danger'>운영자 신청</span>}
                      </span>
                      <span className='shrink-0 text-xs text-mute'>@{item.username}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {/* 확인이 필요한 항목 */}
          <Panel title='확인이 필요해요'>
            {!user.affiliation && (
              <Link href='/space/account' className='-mx-2 flex justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-field'>
                <span>내 소속 (학교 소모임 / 외부 활동)</span>
                <span className='text-xs text-danger'>선택 안 함</span>
              </Link>
            )}
            {!profile && (
              <Link href='/space/profile' className='-mx-2 flex justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-field'>
                <span>내 프로필</span>
                <span className='text-xs text-danger'>아직 없음</span>
              </Link>
            )}
            {drafts.length === 0 && missingThumbnail.length === 0 ? (
              <p className='text-sm'>모두 정리되어 있어요.</p>
            ) : (
              <ul className='-mx-2 flex flex-col text-sm'>
                {missingThumbnail.map((work) => (
                  <li key={work.id}>
                    <Link href={`/space/works/${work.id}`} className='flex justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-field'>
                      <span className='truncate'>{work.title}</span>
                      <span className='shrink-0 text-xs text-danger'>썸네일 없음</span>
                    </Link>
                  </li>
                ))}
                {drafts.slice(0, 5).map((work) => (
                  <li key={work.id}>
                    <Link href={`/space/works/${work.id}`} className='flex justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-field'>
                      <span className='truncate'>{work.title}</span>
                      <span className='shrink-0 text-xs text-mute'>비공개</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title='사이트'>
            <DashboardActions />
          </Panel>
        </div>
      </div>
    </div>
  )
}
