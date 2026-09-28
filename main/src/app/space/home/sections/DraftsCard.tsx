import { BentoCard, type HomeCardProps } from '../BentoCard'
import { getHomeUser, getHomeWorks } from '../data'

/** 작성 중인 프로젝트 (멤버용): 내가 쓴 비공개 프로젝트 수 */
export async function DraftsCard({ index, className }: HomeCardProps) {
  const [user, works] = await Promise.all([getHomeUser(), getHomeWorks()])
  const drafts = works.filter((work) => work.author_id === user.id && !work.published)

  return (
    <BentoCard index={index} className={className} href='/space/works?status=draft'>
      <span className='text-sm text-mute'>작성 중인 프로젝트</span>
      <span className='flex flex-1 flex-col justify-end gap-1'>
        <span className='text-2xl font-medium tracking-[-0.03em]'>{drafts.length}개</span>
        <span className='truncate text-xs text-mute'>{drafts[0]?.title ?? '직접 작성한 비공개 프로젝트'}</span>
      </span>
    </BentoCard>
  )
}
