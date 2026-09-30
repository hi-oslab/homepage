import type { EmbedBlock as EmbedBlockType } from '@/types/blocks'
import classNames from 'classnames'
import { GoArrowUpRight } from 'react-icons/go'
import { toEmbedUrl } from '@/lib/embed'

/**
 * 임베드: 16:9 칸에 바로 띄워서 그 자리에서 조작한다
 * 아래 '새 탭으로 열기'는 원래 링크(Figma 파일 페이지 등)를 새 탭으로 연다
 */
export function EmbedBlock({ block, className }: { block: EmbedBlockType; className?: string }) {
  if (!block.url) return null
  // 이미 저장된 Figma 공유 링크도 임베드 주소로 바꿔서 띄운다
  const src = toEmbedUrl(block.url)

  return (
    <figure className={classNames('my-12 flex w-full flex-col gap-2 md:my-20', className)}>
      <div className='relative aspect-video w-full overflow-hidden rounded-sm bg-neutral-500/10'>
        <iframe
          src={src}
          title={block.title || 'embed'}
          loading='lazy'
          allowFullScreen
          className='absolute inset-0 h-full w-full border-0'
        />
      </div>
      <figcaption className='flex items-center justify-between gap-4 text-sm'>
        <span className='truncate text-mute'>{block.title}</span>
        <a
          href={block.url}
          target='_blank'
          rel='noopener noreferrer'
          className='flex shrink-0 items-center gap-1 text-mute transition-colors hover:text-ink'
        >
          새 탭으로 열기
          <GoArrowUpRight size={14} aria-hidden='true' />
        </a>
      </figcaption>
    </figure>
  )
}
