import { redirect } from 'next/navigation'
import { getCurrentUser, isApproved } from '@/lib/admin-auth'
import {
  DraftsCard,
  GreetingSection,
  LoungeSection,
  MembersSection,
  PendingCard,
  ProfileCard,
  RecentWorksCard,
  SuggestionsSection,
  TodoCard,
} from './home/sections'

export const dynamic = 'force-dynamic'

/*
 * 멤버 공간 홈 — 배치만 한다.
 * 섹션은 home/sections/ 에 하나씩 있고 각자 데이터를 불러온다(home/data.ts).
 * 섹션을 옮기거나 빼려면 여기서 줄만 옮기면 되고, 그리드 칸 · 순서는 className으로 정한다.
 *
 * 웹사이트 건의사항 → 인사 · 함께하는 멤버 → 지금 할 일 카드(벤토) → 라운지(게시판)
 */
export default async function SpaceHomePage() {
  // 홈에서는 리다이렉트하지 않는다 (승인 대기 안내는 레이아웃이 보여주므로 여기서 /space 로 보내면 무한 루프)
  const user = await getCurrentUser().catch(() => null)
  if (!isApproved(user)) return null
  // 첫 로그인: 프로필카드부터
  if (!user.member_id && !user.onboarded_at) redirect('/space/profile?welcome=1')

  return (
    <div className='flex w-full flex-col gap-6'>
      <SuggestionsSection />

      {/* 인사 · 함께하는 멤버 */}
      <header className='grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]'>
        <GreetingSection />
        <MembersSection />
      </header>

      {/* 넓은 화면: 왼쪽 라운지 · 오른쪽 할 일 카드 / 좁은 화면: 카드가 위, 라운지가 아래 */}
      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start'>
        {/* 지금 할 일: 모바일 2열 · 태블릿 3열 · 넓은 화면에서는 오른쪽 칸에 세로로 (스크롤해도 따라온다) */}
        <aside className='grid grid-cols-2 gap-2.5 rounded-3xl bg-tile/60 p-2.5 md:grid-cols-3 xl:sticky xl:top-[calc(var(--spacing-header)+1.5rem)] xl:order-last xl:grid-cols-1'>
          {/* 좁은 화면: 한 줄 전체, 넓은 화면: 오른쪽 칸 맨 위 */}
          <RecentWorksCard index={0} className='col-span-2 md:col-span-3 xl:col-span-1' />
          <ProfileCard index={1} />
          {/* 운영자: 승인 대기 / 멤버: 작성 중인 프로젝트 */}
          {user.is_master ? <PendingCard index={2} /> : <DraftsCard index={2} />}
          {/* 모바일에서는 한 줄 전체 */}
          <TodoCard index={3} className='col-span-2 md:col-span-1' />
        </aside>

        <LoungeSection />
      </div>
    </div>
  )
}
