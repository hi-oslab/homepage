import classNames from 'classnames'
import Link from 'next/link'
import { GoArrowRight } from 'react-icons/go'
import type { MemberAffiliation } from '@/types/cms'
import { HomeSection } from '../HomeSection'
import { getHomeAccounts, getHomeProfiles, getHomeUser } from '../data'
import { MemberRow } from './MemberRow'

/** AccountFields의 AFFILIATION_LABELS와 같은 값 (그쪽은 클라이언트 모듈이라 서버 컴포넌트에서 가져오지 않는다) */
const GROUP_LABELS: Record<MemberAffiliation, string> = { club: '학교 소모임', external: '외부 활동' }

/** 함께하는 멤버: 소속별로 묶은 세로 목록 (내 소속 묶음이 먼저) */
export async function MembersSection({ className }: { className?: string }) {
  const [user, accounts, profiles] = await Promise.all([getHomeUser(), getHomeAccounts(), getHomeProfiles()])
  const approved = accounts.filter((account) => account.status === 'approved')
  const profileById = new Map(profiles.map((item) => [item.id, item]))

  // 내 소속 → 다른 소속 → 소속 미정 순
  const order: (MemberAffiliation | null)[] =
    user.affiliation === 'external' ? ['external', 'club', null] : ['club', 'external', null]
  const groups = order
    .map((affiliation) => ({
      affiliation,
      members: approved.filter((account) => account.affiliation === affiliation),
    }))
    .filter((group) => group.members.length > 0)

  return (
    <HomeSection title='OSL Members' meta={`${approved.length}명`} className={classNames('w-full h-fit', className)}>
      <div className='flex min-h-0 h-fit flex-col gap-5'>
        {groups.map(({ affiliation, members }) => (
          <div key={affiliation ?? 'none'} className='flex flex-col gap-1'>
            <h3 className='flex items-baseline gap-1.5 px-2 text-xs text-mute'>
              {affiliation ? GROUP_LABELS[affiliation] : '소속 미정'}
              <span className='tabular-nums'>{members.length}명</span>
            </h3>
            <ul className='flex flex-col gap-2'>
              {members.map((account) => (
                <MemberRow
                  key={account.id}
                  name={account.name}
                  profile={(account.member_id && profileById.get(account.member_id)) || null}
                  isMe={account.id === user.id}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </HomeSection>
  )
}
