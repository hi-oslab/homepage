import type { LinkBlock as LinkBlockType } from '@/types/blocks'
import { GoArrowUpRight } from 'react-icons/go'
import classNames from 'classnames'

export function LinkBlock({ block, className }: { block: LinkBlockType; className?: string }) {
  if (block.style === 'inline') {
    return (
      <p className={classNames('py-4', className)}>
        <a
          href={block.url}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-1 underline font-medium decoration-gray underline-offset-2 hover:decoration-black'
        >
          {block.title || block.url}
          <GoArrowUpRight className='shrink-0' />
        </a>
      </p>
    )
  }

  return (
    <a
      href={block.url}
      target='_blank'
      rel='noopener noreferrer'
      className={classNames(
        'group my-8 flex gap-4 rounded-sm bg-neutral-500/5 p-2 no-underline backdrop-blur-sm transition-colors hover:bg-white/45 md:p-3',
        className,
      )}
    >
      {block.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.image}
          alt=''
          loading='lazy'
          className='aspect-video h-20 shrink-0 rounded-sm object-cover md:h-28'
        />
      )}
      <div className='flex min-w-0 flex-col justify-center gap-1'>
        <strong className='truncate font-helvetica text-sm font-semibold uppercase md:text-lg'>
          {block.title || block.url}
        </strong>
        {block.description && <p className='line-clamp-2 text-sm text-gray'>{block.description}</p>}
        <span className='truncate text-xs text-gray'>{block.url}</span>
      </div>
    </a>
  )
}
