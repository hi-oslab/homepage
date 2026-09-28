import classNames from 'classnames'
import Link from 'next/link'
import { GoArrowRight } from 'react-icons/go'
import type { MemberAffiliation } from '@/types/cms'
import { BentoCard, type HomeCardProps } from '../BentoCard'
import { getHomeAccounts, getHomeUser, getHomeWorks, getMyProfile } from '../data'

/** AccountFields의 AFFILIATION_LABELS와 같은 값 (그쪽은 클라이언트 모듈이라 서버 컴포넌트에서 가져오지 않는다) */
const AFFILIATION_LABELS: Record<MemberAffiliation, string> = { club: '학교 소모임', external: '외부 활동' }

type TodoItem = {
  label: string
  href: string
  /** 개수 (승인 대기 · 작성 중) */
  count?: string
  /** 바로 처리해야 하는 일은 빨간 점 */
  urgent?: boolean
}

/** 확인할 일: 승인 대기(운영자) · 작성 중인 프로젝트 · 소속 · 프로필카드 준비 상태 */
export async function TodoCard({ index, className }: HomeCardProps) {
  const [user, profile, accounts, works] = await Promise.all([
    getHomeUser(),
    getMyProfile(),
    getHomeAccounts(),
    getHomeWorks(),
  ])
  const pending = user.is_master ? accounts.filter((account) => account.status === 'pending') : []
  const drafts = works.filter((work) => work.author_id === user.id && !work.published)

  const todo = [
    pending.length > 0 && { label: '가입 승인하기', href: '/space/users', count: `${pending.length}명`, urgent: true },
    !user.affiliation && { label: '소속 고르기', href: '/space/account' },
    !profile && { label: '프로필카드 만들기', href: '/space/profile' },
    profile && !profile.published && { label: '프로필카드 공개하기', href: '/space/profile' },
    profile && !profile.cover_image_url && { label: '프로필 이미지 올리기', href: '/space/profile' },
    drafts.length > 0 && { label: '작성 중인 프로젝트', href: '/space/works?status=draft', count: `${drafts.length}개` },
  ].filter(Boolean) as TodoItem[]

  return (
    <BentoCard index={index} className={className}>
      <span className='text-sm text-mute'>확인할 일</span>
      {todo.length > 0 ? (
        <ul className='flex flex-1 flex-col justify-end gap-1.5'>
          {todo.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className='flex items-center justify-between gap-2 text-sm hover:text-mute'>
                <span className='flex min-w-0 items-center gap-2'>
                  <span className={classNames('size-1.5 shrink-0 rounded-full', item.urgent ? 'bg-danger' : 'bg-[#e0a526]')} />
                  <span className='truncate'>{item.label}</span>
                  {item.count && <span className='shrink-0 text-xs text-mute tabular-nums'>{item.count}</span>}
                </span>
                <GoArrowRight size={12} className='shrink-0 text-mute' />
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
  )
}
