import classNames from 'classnames'
import Link from 'next/link'
import { GoGear } from 'react-icons/go'
import { BLOCK_PAD, buttonClass, surfaceClass } from '@/components/admin/styles'
import { OperatorBadge } from '@/components/OperatorBadge'
import { ProfileImage } from '@/components/ProfileImage'
import { getHomeUser, getMyProfile } from '../data'
import { VisitStatsBar } from './VisitStatsBar'
/** 인사말 + 내 프로필카드: 프로필 이미지 · 오늘 날짜 · 이름 · 역할 · 공개 여부 · 프로필 설정 버튼 */
export async function GreetingSection({ className }: { className?: string }) {
  const [user, profile] = await Promise.all([getHomeUser(), getMyProfile()])
  const today = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())
  const status = profile
    ? [profile.role, profile.published ? '공개 중' : '비공개'].filter(Boolean).join(' · ')
    : '아직 프로필카드가 없어요'

  return (
    // 좁은 화면에서는 설정 버튼이 아래 줄로 내려간다
    <div
      className={classNames(
        'flex flex-wrap items-center justify-between gap-x-4 gap-y-3',
        surfaceClass('glass'),
        BLOCK_PAD,
        className,
      )}
    >
      <div className='flex min-w-0 items-center gap-3 sm:gap-4'>
        <ProfileImage
          src={profile?.cover_image_url}
          name={user.name}
          size='sm'
          className='size-12 shrink-0 text-lg sm:size-14 md:size-16'
        />
        <div className='flex min-w-0 flex-col gap-1'>
          <span className='text-sm text-mute'>{today}</span>
          <h1 className='flex min-w-0 items-center gap-2 text-2xl font-medium sm:gap-3 sm:text-3xl md:text-4xl'>
            <span className='truncate'>안녕하세요, {user.name}님</span>
            {user.is_master && <OperatorBadge className='shrink-0 text-xs' />}
          </h1>
          <span className='truncate text-xs text-mute'>{status}</span>
        </div>
      </div>
      <Link href='/space/profile' className={buttonClass('secondary', 'sm', 'shrink-0')}>
        <GoGear size={13} />
        {profile ? '프로필 설정' : '프로필카드 만들기'}
      </Link>
      <VisitStatsBar />
    </div>
  )
}
