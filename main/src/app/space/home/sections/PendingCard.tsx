import { BentoCard, type HomeCardProps } from '../BentoCard'
import { getHomeAccounts } from '../data'

/** 승인 대기 (운영자용): 인원 · 이름 */
export async function PendingCard({ index, className }: HomeCardProps) {
  const pending = (await getHomeAccounts()).filter((account) => account.status === 'pending')

  return (
    <BentoCard index={index} className={className} href='/space/users'>
      <span className='flex items-center justify-between text-sm text-mute'>
        승인 대기
        {pending.length > 0 && <span className='size-2 rounded-full bg-danger' />}
      </span>
      {pending.length > 0 ? (
        <span className='flex flex-1 flex-col justify-end gap-1'>
          <span className='text-2xl font-medium tracking-[-0.03em]'>{pending.length}명</span>
          <span className='truncate text-xs text-mute'>{pending.map((account) => account.name).join(', ')}</span>
        </span>
      ) : (
        <span className='flex flex-1 items-end text-sm text-ink/70'>기다리는 가입 신청이 없어요</span>
      )}
    </BentoCard>
  )
}
