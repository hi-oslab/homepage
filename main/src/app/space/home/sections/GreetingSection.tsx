import classNames from 'classnames'
import { GoPlus } from 'react-icons/go'
import { OperatorBadge } from '@/components/OperatorBadge'
import { createWorkAction } from '../../works/actions'
import { getHomeUser } from '../data'

/** 인사말: 오늘 날짜 · 이름 · 새 프로젝트 기록하기 */
export async function GreetingSection({ className }: { className?: string }) {
  const user = await getHomeUser()
  const today = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())

  return (
    <div className={classNames('flex flex-col gap-2 rounded-3xl bg-surface p-5 md:p-6', className)}>
      <span className='text-sm text-mute'>{today}</span>
      <h1 className='flex items-center gap-3 text-3xl font-medium tracking-[-0.04em] md:text-4xl'>
        안녕하세요, {user.name}님{user.is_master && <OperatorBadge className='text-xs' />}
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
  )
}
