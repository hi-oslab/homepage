import Link from 'next/link'
import { GoArrowRight } from 'react-icons/go'
import { AFFILIATION_LABELS } from '../../AccountFields'
import { BentoCard, type HomeCardProps } from '../BentoCard'
import { getHomeUser, getMyProfile } from '../data'

/** 확인할 일: 소속 · 프로필카드 준비 상태 */
export async function TodoCard({ index, className }: HomeCardProps) {
  const [user, profile] = await Promise.all([getHomeUser(), getMyProfile()])
  const todo = [
    !user.affiliation && { label: '소속 고르기', href: '/space/account' },
    !profile && { label: '프로필카드 만들기', href: '/space/profile' },
    profile && !profile.published && { label: '프로필카드 공개하기', href: '/space/profile' },
    profile && !profile.cover_image_url && { label: '프로필 이미지 올리기', href: '/space/profile' },
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    <BentoCard index={index} className={className}>
      <span className='text-sm text-mute'>확인할 일</span>
      {todo.length > 0 ? (
        <ul className='flex flex-1 flex-col justify-end gap-1.5'>
          {todo.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className='flex items-center justify-between gap-2 text-sm hover:text-mute'>
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
  )
}
