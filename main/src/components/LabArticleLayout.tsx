import classNames from 'classnames'
import { BlockRenderer } from '@/components/BlockRenderer'
import { ProfileImage } from '@/components/ProfileImage'
import { parseBlocks } from '@/lib/blocks'
import type { LabArticleCard } from '@/lib/lab-types'

const CONTENT_MAX_WIDTH = 'max-w-[1080px]'

const formatDate = (iso: string) => iso.slice(0, 10).replaceAll('-', '.')

/**
 * Lab Space 글 상세 (공개 페이지 · 멤버 공간 미리보기 공용).
 * 프로젝트 상세(WorkDetailLayout)와 같은 결: 커버 → 주차 · 날짜 → 제목 · 부제 → 글쓴이 → 본문
 */
export function LabArticleLayout({ article }: { article: LabArticleCard }) {
  const blocks = parseBlocks(article.content)

  return (
    <article className='w-full pb-20 md:pb-32'>
      {article.thumbnail_url && (
        <section className='px-4 pt-6 md:px-8 md:pt-8'>
          <div aria-label='Article cover' className='relative aspect-[16/9] w-full overflow-hidden bg-tile'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.thumbnail_url} alt={`${article.title} cover`} className='size-full object-cover' />
          </div>
        </section>
      )}

      <header className={classNames('mx-auto w-full px-4 pt-10 md:px-8 md:pt-16', CONTENT_MAX_WIDTH)}>
        <div className='flex items-center justify-between gap-4 text-sm text-mute'>
          <span className='truncate'>{article.issue_title || 'Lab Space'}</span>
          <span className='shrink-0 tabular-nums'>
            {formatDate(article.created_at)} · {article.view_count.toLocaleString()} views
          </span>
        </div>
        <h1 className='mt-6 text-4xl leading-[1.05] font-medium tracking-[-0.04em] break-keep md:text-6xl'>
          {article.title}
        </h1>
        {article.subtitle && (
          <p className='mt-5 text-lg leading-snug break-keep text-mute md:text-2xl'>{article.subtitle}</p>
        )}
        <div className='mt-8 flex items-center gap-3 border-t border-ink/10 pt-6'>
          <ProfileImage src={article.author_image} name={article.author_name} size='sm' className='size-10 text-sm' />
          <span className='flex flex-col'>
            <span className='text-sm'>{article.author_name}</span>
            <span className='text-xs text-mute'>Written by</span>
          </span>
        </div>
      </header>

      {blocks.length > 0 && (
        <div className={classNames('mx-auto w-full px-4 pt-6 md:px-8', CONTENT_MAX_WIDTH)}>
          <BlockRenderer blocks={blocks} />
        </div>
      )}
    </article>
  )
}
