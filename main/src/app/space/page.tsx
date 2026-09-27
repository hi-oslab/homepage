import Link from 'next/link'
import { redirect } from 'next/navigation'
import { GoArrowRight, GoPlus } from 'react-icons/go'
import { getCurrentUser, isApproved } from '@/lib/admin-auth'
import { getAdminMembers, getAdminUsers, getAdminWorks, getMember } from '@/lib/cms'
import { getCommunityFeed } from '@/lib/community'
import { ProfileImage } from '@/components/ProfileImage'
import { OperatorBadge } from '@/components/OperatorBadge'
import { createWorkAction } from './works/actions'
import { RelativeTime } from './DashboardActions'
import { AFFILIATION_LABELS } from './AccountFields'
import { BentoCard } from './home/BentoCard'
import { Board } from './board/Board'

export const dynamic = 'force-dynamic'

/*
 * 멤버 공간 홈 — 워크스페이스처럼
 * 인사 · 함께하는 멤버 → 지금 할 일 카드(벤토) → 라운지(게시판)
 */
export default async function SpaceHomePage() {
  // 홈에서는 리다이렉트하지 않는다 (승인 대기 안내는 레이아웃이 보여주므로 여기서 /space 로 보내면 무한 루프)
  const user = await getCurrentUser().catch(() => null)
  if (!isApproved(user)) return null
  // 첫 로그인: 프로필카드부터
  if (!user.member_id && !user.onboarded_at) redirect('/space/profile?welcome=1')
  const isMaster = user.is_master

  const [works, profiles, accounts, profile, posts] = await Promise.all([
    getAdminWorks('updated_at'),
    getAdminMembers(),
    getAdminUsers(),
    user.member_id ? getMember(user.member_id) : Promise.resolve(null),
    getCommunityFeed(user.id),
  ])

  const approved = accounts.filter((account) => account.status === 'approved')
  const pending = accounts.filter((account) => account.status === 'pending')
  const profileById = new Map(profiles.map((item) => [item.id, item]))
  const recentWorks = works.slice(0, 4)
  const myDrafts = works.filter((work) => work.author_id === user.id && !work.published)
  const todo = [
    !user.affiliation && { label: '소속 고르기', href: '/space/account' },
    !profile && { label: '프로필카드 만들기', href: '/space/profile' },
    profile && !profile.published && { label: '프로필카드 공개하기', href: '/space/profile' },
    profile && !profile.cover_image_url && { label: '프로필 이미지 올리기', href: '/space/profile' },
  ].filter(Boolean) as { label: string; href: string }[]

  const today = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())

  return (
    <div className='flex w-full max-w-[1440px] flex-col gap-6'>
      {/* 인사 · 함께하는 멤버 */}
      <header className='grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]'>
        {/* 인사말 */}
        <div className='flex flex-col gap-2 rounded-3xl bg-surface p-5 md:p-6'>
          <span className='text-sm text-mute'>{today}</span>
          <h1 className='flex items-center gap-3 text-3xl font-medium tracking-[-0.04em] md:text-4xl'>
            안녕하세요, {user.name}님{isMaster && <OperatorBadge className='text-xs' />}
          </h1>
          <form action={createWorkAction}>
            <button
              type='submit'
              className='mt-1 flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm text-white transition-transform hover:-translate-y-0.5'
            >
              <GoPlus size={14} />새 프로젝트 기록하기
            </button>
          </form>
        </div>
        {/* 함께하는 멤버 */}
        <Link
          href='/members'
          target='_blank'
          className='group flex items-center justify-between gap-4 rounded-3xl bg-surface p-5 transition-shadow hover:shadow-[0_12px_32px_rgba(17,17,17,0.08)] md:flex-col md:items-start md:justify-center md:p-6'
        >
          <span className='flex -space-x-2.5'>
            {approved.slice(0, 9).map((account) => {
              const card = account.member_id ? profileById.get(account.member_id) : undefined
              return (
                <span
                  key={account.id}
                  title={account.name}
                  className='rounded-full bg-surface p-0.5 transition-transform duration-300 group-hover:-translate-y-0.5'
                >
                  <ProfileImage src={card?.cover_image_url} name={account.name} size='sm' className='size-9 text-xs' />
                </span>
              )
            })}
          </span>
          <span className='flex flex-col text-right md:text-left'>
            <span className='text-sm'>함께하는 멤버 {approved.length}명</span>
            <span className='flex items-center justify-end gap-1 text-xs text-mute group-hover:text-ink md:justify-start'>
              Members 보기 <GoArrowRight size={11} />
            </span>
          </span>
        </Link>
      </header>

      {/* 넓은 화면: 왼쪽 라운지 · 오른쪽 할 일 카드 / 좁은 화면: 카드가 위, 라운지가 아래 */}
      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start'>
        {/* 지금 할 일: 모바일 2열 · 태블릿 3열 · 넓은 화면에서는 오른쪽 칸에 세로로 (스크롤해도 따라온다) */}
        <aside className='grid grid-cols-2 gap-2.5 rounded-3xl bg-tile/60 p-2.5 md:grid-cols-3 xl:sticky xl:top-[calc(var(--spacing-header)+1.5rem)] xl:order-last xl:grid-cols-1'>
          {/* 최근 수정된 프로젝트 (좁은 화면: 한 줄 전체, 넓은 화면: 오른쪽 칸 맨 위) */}
          <div className='col-span-2 md:col-span-3 xl:col-span-1'>
            <BentoCard index={0} className='gap-2'>
              <span className='flex items-center justify-between'>
                <span className='text-sm text-mute'>최근 수정된 프로젝트</span>
                <Link href='/space/works' className='flex items-center gap-1 text-xs text-mute hover:text-ink'>
                  전체 <GoArrowRight size={11} />
                </Link>
              </span>
              <ul className='-mx-2 flex flex-col'>
                {recentWorks.map((work) => (
                  <li key={work.id}>
                    <Link
                      href={`/space/works/${work.id}`}
                      className='flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-field'
                    >
                      <span className='h-8 w-10 shrink-0 overflow-hidden rounded-lg bg-field'>
                        {work.thumbnail_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={work.thumbnail_url} alt='' className='size-full object-cover' />
                        )}
                      </span>
                      <span className='flex min-w-0 flex-1 flex-col'>
                        <span className='truncate text-sm'>{work.title || '제목 없음'}</span>
                        <span className='flex items-center gap-1 truncate text-[11px] text-mute'>
                          {!work.published && '비공개 ·'}
                          <RelativeTime iso={work.updated_at} />
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
                {recentWorks.length === 0 && <li className='px-2 py-3 text-sm text-mute'>아직 기록된 프로젝트가 없어요.</li>}
              </ul>
            </BentoCard>
          </div>

          {/* 내 프로필카드 */}
          <BentoCard index={1} href='/space/profile'>
            <span className='text-sm text-mute'>프로필카드</span>
            <span className='flex flex-1 items-end gap-3'>
              <ProfileImage
                src={profile?.cover_image_url}
                name={user.name}
                size='sm'
                className='size-11 shrink-0 text-base'
              />
              <span className='flex min-w-0 flex-col'>
                <span className='truncate text-lg font-medium tracking-[-0.02em]'>{profile?.name ?? user.name}</span>
                <span className='truncate text-xs text-mute'>
                  {profile
                    ? [profile.role, profile.published ? '공개 중' : '비공개'].filter(Boolean).join(' · ')
                    : '아직 없어요'}
                </span>
              </span>
            </span>
          </BentoCard>

          {/* 운영자: 승인 대기 / 멤버: 작성 중인 프로젝트 */}
          {isMaster ? (
            <BentoCard index={2} href='/space/users'>
              <span className='flex items-center justify-between text-sm text-mute'>
                승인 대기
                {pending.length > 0 && <span className='size-2 rounded-full bg-danger' />}
              </span>
              {pending.length > 0 ? (
                <span className='flex flex-1 flex-col justify-end gap-1'>
                  <span className='text-2xl font-medium tracking-[-0.03em]'>{pending.length}명</span>
                  <span className='truncate text-xs text-mute'>
                    {pending.map((account) => account.name).join(', ')}
                  </span>
                </span>
              ) : (
                <span className='flex flex-1 items-end text-sm text-ink/70'>기다리는 가입 신청이 없어요</span>
              )}
            </BentoCard>
          ) : (
            <BentoCard index={2} href='/space/works?status=draft'>
              <span className='text-sm text-mute'>작성 중인 프로젝트</span>
              <span className='flex flex-1 flex-col justify-end gap-1'>
                <span className='text-2xl font-medium tracking-[-0.03em]'>{myDrafts.length}개</span>
                <span className='truncate text-xs text-mute'>
                  {myDrafts[0]?.title ?? '직접 작성한 비공개 프로젝트'}
                </span>
              </span>
            </BentoCard>
          )}

          {/* 확인할 일 (모바일에서는 한 줄 전체) */}
          <div className='col-span-2 md:col-span-1'>
            <BentoCard index={3}>
              <span className='text-sm text-mute'>확인할 일</span>
              {todo.length > 0 ? (
                <ul className='flex flex-1 flex-col justify-end gap-1.5'>
                  {todo.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className='flex items-center justify-between gap-2 text-sm hover:text-mute'
                      >
                        <span className='flex items-center gap-2'>
                          <span className='size-1.5 rounded-full bg-[#e0a526]' />
                          {item.label}
                        </span>
                        <GoArrowRight size={12} className='text-mute' />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className='flex flex-1 items-end text-sm text-ink/70'>
                  모두 정리되어 있어요{user.affiliation && ` · ${AFFILIATION_LABELS[user.affiliation]}`}
                </span>
              )}
            </BentoCard>
          </div>
        </aside>

        {/* 라운지 */}
        <section className='flex min-w-0 flex-col gap-4 rounded-3xl bg-tile/60 p-3 md:p-5'>
          <div className='flex flex-col gap-1'>
            <h2 className='text-2xl font-medium tracking-[-0.03em]'>라운지</h2>
            <p className='text-sm text-mute'>공지, 자유로운 이야기, 협업 제안, 정보를 나누는 곳이에요.</p>
          </div>
          <Board initialPosts={posts} viewer={{ id: user.id, isMaster }} />
        </section>
      </div>
    </div>
  )
}
