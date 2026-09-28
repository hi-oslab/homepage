import classNames from 'classnames'
import Link from 'next/link'
import { GoArrowRight } from 'react-icons/go'
import { ProfileImage } from '@/components/ProfileImage'
import { getHomeAccounts, getHomeProfiles } from '../data'

/** 겹쳐 보여줄 얼굴 수 */
const FACES = 9

/** 함께하는 멤버: 얼굴 몇 개 · 인원 · 공개 Members 페이지로 */
export async function MembersSection({ className }: { className?: string }) {
  const [accounts, profiles] = await Promise.all([getHomeAccounts(), getHomeProfiles()])
  const approved = accounts.filter((account) => account.status === 'approved')
  const profileById = new Map(profiles.map((item) => [item.id, item]))

  return (
    <Link
      href='/members'
      target='_blank'
      className={classNames(
        'group flex items-center justify-between gap-4 rounded-3xl bg-surface p-5 transition-shadow hover:shadow-[0_12px_32px_rgba(17,17,17,0.08)] md:flex-col md:items-start md:justify-center md:p-6',
        className,
      )}
    >
      <span className='flex -space-x-2.5'>
        {approved.slice(0, FACES).map((account) => {
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
  )
}
