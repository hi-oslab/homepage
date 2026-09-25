import classNames from 'classnames'

/** 섹션 라벨: "(01) Studio" 형태의 작은 캡션 */
export const Label = ({
  index,
  children,
  className,
}: {
  index?: string
  children: React.ReactNode
  className?: string
}) => (
  <p className={classNames('flex items-baseline gap-2 text-sm leading-none text-ink', className)}>
    {index && <span className='font-mono text-xs text-mute'>({index})</span>}
    <span>{children}</span>
  </p>
)

/** 얇은 선 화살표 아이콘. direction으로 방향 지정 */
export const Arrow = ({
  direction = 'up-right',
  className,
}: {
  direction?: 'up-right' | 'down-right' | 'right'
  className?: string
}) => {
  const rotate = { 'up-right': '', right: 'rotate-45', 'down-right': 'rotate-90' }[direction]

  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.25}
      aria-hidden
      className={classNames('shrink-0', rotate, className)}
    >
      <path d='M6 18L18 6M8 6h10v10' />
    </svg>
  )
}
