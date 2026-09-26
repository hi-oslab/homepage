import type { MediaBlock as MediaBlockType } from '@/types/blocks'
import classNames from 'classnames'
import { VimeoPlayer, YoutubePlayer } from '@/components/EmbedVideoPlayer'
import { extractVimeoId, extractYoutubeId } from '@/lib/blocks'

export function MediaBlock({
  block,
  className,
  onImageClick,
}: {
  block: MediaBlockType
  className?: string
  onImageClick?: (url: string, alt: string) => void
}) {
  const imageUrls = block.urls?.length ? block.urls : block.url ? [block.url] : []
  // 저장된 ID가 없어도 주소로 공급자를 다시 판별한다
  const youtubeId = block.youtubeId || (block.url ? extractYoutubeId(block.url) : null)
  const vimeoId = youtubeId ? null : block.vimeoId || (block.url ? extractVimeoId(block.url) : null)

  return (
    <figure className={classNames('py-4 md:py-8', className)}>
      {block.mediaType === 'video' ? (
        youtubeId ? (
          <YoutubePlayer source={block.url || youtubeId} title={block.caption || 'YouTube video'} />
        ) : vimeoId ? (
          <VimeoPlayer source={block.url || vimeoId} title={block.caption || 'Vimeo video'} />
        ) : block.url ? (
          <video src={block.url} controls playsInline className='w-full rounded-sm' />
        ) : null
      ) : imageUrls.length > 0 ? (
        <div className={imageUrls.length > 1 ? 'flex w-full flex-col gap-2' : undefined}>
          {imageUrls.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type='button'
              className='block w-full cursor-zoom-in rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'
              onClick={() => onImageClick?.(url, block.caption ?? '')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={block.caption ?? ''} loading='lazy' className='w-full rounded-sm' />
            </button>
          ))}
        </div>
      ) : null}
      {block.caption && (
        <figcaption className='mt-2 text-[9px] text-black/40 md:text-[10px]'>{block.caption}</figcaption>
      )}
    </figure>
  )
}
