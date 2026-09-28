import classNames from 'classnames'
import { BLOCK_PAD, surfaceClass } from '@/components/admin/styles'

/**
 * 홈 섹션 공통 틀: 제목 줄(제목 · 보조 숫자 · 설명 · 오른쪽 버튼) + 내용.
 * 서버 · 클라이언트 컴포넌트 어디서나 쓸 수 있다 (상태 없음).
 *
 * - tone: surface(흰 블록, 기본) · tile(블록 안에 들어가는 회색 면)
 * - size: sm(작은 제목, 촘촘하게) · lg(큰 제목, 넉넉하게)
 * - className: 바깥 틀에 붙는다 (배치는 page.tsx에서 이걸로 정한다)
 */
export function HomeSection({
  title,
  meta,
  description,
  action,
  tone = 'surface',
  size = 'lg',
  className,
  children,
}: {
  title?: React.ReactNode
  /** 제목 옆 작은 글자 (개수 등) */
  meta?: React.ReactNode
  /** 제목 아래 한 줄 설명 */
  description?: React.ReactNode
  /** 제목 줄 오른쪽 (더보기 등) */
  action?: React.ReactNode
  tone?: 'surface' | 'tile'
  size?: 'sm' | 'lg'
  className?: string
  children: React.ReactNode
}) {
  const hasHeader = Boolean(title || action)

  return (
    <section
      className={classNames(
        'flex min-w-0 flex-col',
        surfaceClass(tone === 'surface' ? 'solid' : 'inset'),
        size === 'sm' ? 'px-4 py-3' : ['gap-3', BLOCK_PAD],
        className,
      )}
    >
      {hasHeader && (
        <div className={classNames('flex justify-between gap-3', size === 'sm' ? 'items-center pb-1' : 'items-end')}>
          <div className='flex min-w-0 flex-col gap-1'>
            {title && (
              <h2
                className={classNames(
                  'flex items-baseline gap-2',
                  size === 'sm' ? 'text-sm font-semibold' : 'text-2xl font-semibold tracking-[-0.03em]',
                )}
              >
                {title}
                {meta && <span className='text-xs font-normal tracking-normal text-mute tabular-nums'>{meta}</span>}
              </h2>
            )}
            {description && <p className='text-sm text-mute'>{description}</p>}
          </div>
          {action && <div className='shrink-0'>{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
