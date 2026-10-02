import { cn } from '@/lib/cn'

/*
 * 프로필 이미지 표시 (Members 카드 · 모달 · 멤버 공간 공용)
 * 프로필 이미지는 투명 PNG(각자 만든 아이콘이나 원·사각형·별로 오린 사진)라서
 * 자르지 않고(contain) 통째로 보여주고, 그림자는 모양을 따라가는 drop-shadow로 준다.
 */

const SHADOW = {
  /** 표 · 목록의 작은 아바타 */
  sm: 'drop-shadow-[0_1px_2px_rgb(var(--shadow-rgb)/0.28)]',
  /** 카드 · 미리보기 */
  lg: 'drop-shadow-[0_8px_18px_rgb(var(--shadow-rgb)/0.18)]',
}

export function ProfileImage({
  src,
  name,
  size = 'lg',
  className,
  imageClassName,
}: {
  src: string | null | undefined
  name: string
  size?: keyof typeof SHADOW
  /** 바깥 틀 (크기 · 여백) */
  className?: string
  /** 이미지에 더할 효과 (예: hover 확대) */
  imageClassName?: string
}) {
  if (!src) {
    // 이미지가 없으면 이름 첫 글자
    return (
      <span
        className={cn(
          'flex items-center justify-center font-medium',
          // 작은 아바타는 동그라미, 카드는 바탕 위에 큰 글자
          size === 'sm' ? 'rounded-full bg-field text-xs text-ink/60' : 'text-7xl text-ink/15',
          className,
        )}
      >
        {name.slice(0, 1) || '?'}
      </span>
    )
  }
  return (
    <span className={cn('flex items-center justify-center', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        loading='lazy'
        className={cn('size-full object-contain', SHADOW[size], imageClassName)}
      />
    </span>
  )
}
