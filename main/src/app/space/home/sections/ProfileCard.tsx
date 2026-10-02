import { ProfileImage } from '@/components/ProfileImage'
import { BentoCard, type HomeCardProps } from '../BentoCard'
import { getHomeUser, getMyProfile } from '../data'

/** 내 프로필카드: 이미지 · 이름 · 역할 · 공개 여부 */
export async function ProfileCard({ index, className }: HomeCardProps) {
  const [user, profile] = await Promise.all([getHomeUser(), getMyProfile()])

  return (
    <BentoCard index={index} className={className} href='/space/profile'>
      <span className='text-sm text-mute'>프로필카드</span>
      <span className='flex flex-1 items-end gap-3'>
        <ProfileImage
          src={profile?.cover_image_url}
          name={user.name}
          size='sm'
          className='size-11 shrink-0 text-base'
        />
        <span className='flex min-w-0 flex-col'>
          <span className='truncate text-lg font-medium '>{profile?.name ?? user.name}</span>
          <span className='truncate text-xs text-mute'>
            {profile
              ? [profile.role, profile.published ? '공개 중' : '비공개'].filter(Boolean).join(' · ')
              : '아직 없어요'}
          </span>
        </span>
      </span>
    </BentoCard>
  )
}
