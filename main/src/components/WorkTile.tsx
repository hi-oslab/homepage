import Link from 'next/link'
import classNames from 'classnames'
import type { Work } from '@/types/cms'

/** 작업 카드: 이미지 + 아래 작은 캡션 */
export const WorkTile = ({
  work,
  className,
  aspect = 'aspect-[16/9]',
}: {
  work: Work
  className?: string
  aspect?: string
}) => (
  <Link href={`/work/${work.slug}`} className={classNames('group flex flex-col gap-3', className)}>
    <div className={classNames('relative w-full overflow-hidden bg-tile', aspect)}>
      {work.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={work.thumbnail_url}
          alt={work.title}
          loading='lazy'
          className='size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]'
        />
      ) : (
        <span className='absolute inset-0 flex items-center justify-center text-xs text-mute'>No image</span>
      )}
    </div>
    <div className='flex flex-col gap-1 text-sm leading-snug'>
      <h3 className='break-keep font-medium text-ink'>{work.title}</h3>
      <p className='text-mute'>{[work.category, work.year].filter(Boolean).join(' · ')}</p>
    </div>
  </Link>
)
