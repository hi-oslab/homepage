import { getCurrentUser, isApproved } from '@/lib/admin-auth'
import {
  GreetingSection,
  LoungeSection,
  MembersSection,
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
  return (
    <div className='relative isolate flex w-full flex-col gap-2'>
      {/* 위쪽에 옅은 강조색 빛: 유리 면(glass) 블록이 바탕과 구분되도록 */}
      <div aria-hidden className='pointer-events-none absolute inset-x-0 -top-4 -z-10 h-80 md:-top-4' />
      {/*
        위 줄: 인사 · 확인할 일 · 최근 프로젝트 | 건의사항
        아래 줄: 라운지 | 멤버
        - 모바일(~sm): 전부 한 줄씩 세로로
        - sm~: 확인할 일 · 최근 프로젝트가 나란히
        - xl~: 오른쪽 칸(건의사항 · 멤버)이 생긴다. 위아래 줄의 오른쪽 칸 너비를 같게 맞춰 세로선이 이어진다
        - 3xl~ · 4xl~: 오른쪽 칸만 조금씩 넓힌다 (라운지는 열 수가 늘어난다, board/Board.tsx)
      */}
      <header className='grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_340px] 3xl:grid-cols-[minmax(0,1fr)_400px] 4xl:grid-cols-[minmax(0,1fr)_460px]'>
        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
          {/* 인사 + 내 프로필카드 (이미지 · 역할 · 프로필 설정 버튼) */}
          <GreetingSection className='sm:col-span-2' />
          {/* 확인할 일: 승인 대기(운영자) · 작성 중인 프로젝트 · 소속 · 프로필카드 */}
          <TodoCard index={1} />
          <RecentWorksCard index={0} />
        </div>
        <SuggestionsSection />
      </header>

      <div className='grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start 3xl:grid-cols-[minmax(0,1fr)_400px] 4xl:grid-cols-[minmax(0,1fr)_460px]'>
        <LoungeSection />
        <MembersSection />
      </div>
    </div>
  )
}
