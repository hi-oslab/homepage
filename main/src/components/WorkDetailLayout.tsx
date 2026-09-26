import type { ReactNode } from 'react'
import classNames from 'classnames'
import { BlockRenderer } from '@/components/BlockRenderer'
import { SectionIndexNavigation } from '@/components/blocks'
import { parseBlocks } from '@/lib/blocks'
import type { Work } from '@/types/cms'

const DETAIL_CONTENT_MAX_WIDTH = 'max-w-[1080px]'
function formatDate(date: string | null, year: number) {
  if (!date) return String(year)
  return date.replaceAll('-', '.')
}

type DetailRowProps = {
  children: ReactNode
  aside?: ReactNode
  className?: string
  breakpoint?: 'md' | 'lg'
  projectContent?: boolean
  ariaLabel?: string
}

function DetailRow({ children, aside, className = '', breakpoint = 'lg', projectContent, ariaLabel }: DetailRowProps) {
  const rowClass = breakpoint === 'md' ? 'md:flex-row' : 'lg:flex-row'
  const asideClass =
    breakpoint === 'md'
      ? 'md:block md:min-w-[180px] md:flex-[0.7] min-[1800px]:w-[180px] min-[1800px]:flex-none'
      : 'lg:block lg:min-w-[180px] lg:flex-[0.7] min-[1800px]:w-[180px] min-[1800px]:flex-none'
  const contentClass =
    breakpoint === 'md' ? 'md:flex-[2] min-[1800px]:flex-[1_1_0%]' : 'lg:flex-[2] min-[1800px]:flex-[1_1_0%]'

  return (
    <section
      data-project-content={projectContent ? '' : undefined}
      aria-label={ariaLabel}
      className={`flex w-full flex-col gap-8 px-4 md:px-8 ${rowClass} ${className}`}
    >
      <aside className={`${aside === undefined ? 'hidden' : 'contents'} min-w-0 ${asideClass}`}>{aside}</aside>
      <div className={`w-full min-w-0 ${contentClass}`}>{children}</div>
    </section>
  )
}

export function WorkDetailLayout({ work }: { work: Work }) {
  const blocks = parseBlocks(work.content)
  const sections = blocks.filter((block) => block.type === 'section-index')
  const details = [
    work.category ? { label: 'Category', value: work.category } : null,
    { label: 'Period', value: formatDate(work.project_date, work.year) },
    work.tags.length ? { label: 'Keywords', value: work.tags.join(' · ') } : null,
    work.description ? { label: 'Description', value: work.description } : null,
  ].filter((detail): detail is { label: string; value: string } => Boolean(detail))

  return (
    <article className='w-full pb-20 md:pb-32'>
      {work.thumbnail_url && (
        <section className='h-fit px-4 pt-6 md:px-8 md:pt-8'>
          <div aria-label='Project cover' className='relative aspect-[16/9] w-full overflow-hidden bg-tile'>
            <img src={work.thumbnail_url} alt={`${work.title} cover`} className='size-full object-cover' />
          </div>
        </section>
      )}

      <DetailRow
        className='pt-10 md:pt-16'
        aside={
          <div className='hidden text-sm leading-none text-mute lg:sticky lg:top-12 lg:flex lg:self-start'>
            Information
          </div>
        }
      >
        <header className={classNames('mx-auto w-full', DETAIL_CONTENT_MAX_WIDTH)}>
          <div className='flex items-center justify-between text-sm text-mute'>
            <span>{work.category || 'Selected Work'}</span>
            <span>{work.year}</span>
          </div>
          <h1 className='mt-6 w-full break-keep text-4xl font-medium leading-[1.05] tracking-[-0.04em] md:text-6xl xl:text-7xl'>
            {work.title}
          </h1>
          {work.subtitle && (
            <p className='mt-6 w-full break-keep text-lg leading-snug text-mute md:text-2xl'>{work.subtitle}</p>
          )}
        </header>

        <dl
          className={classNames(
            'mx-auto mt-10 flex w-full flex-col gap-3 rounded-md bg-tile p-4 md:mt-12 md:p-6',
            DETAIL_CONTENT_MAX_WIDTH,
          )}
        >
          {details.map((detail) => (
            <div key={detail.label} className='flex w-full min-w-0 flex-row gap-3'>
              <dt className='min-w-20 flex-1 text-sm text-mute md:min-w-28'>{detail.label}</dt>
              <dd className='min-w-0 flex-[5] break-keep text-sm leading-relaxed md:text-base'>{detail.value}</dd>
            </div>
          ))}
        </dl>
      </DetailRow>

      <DetailRow
        aside={sections.length > 0 ? <SectionIndexNavigation sections={sections} /> : null}
        breakpoint='md'
        className='pb-20 pt-4 md:pb-0'
        projectContent
        ariaLabel='Project content'
      >
        {blocks.length > 0 ? (
          <div className={classNames('mx-auto w-full', DETAIL_CONTENT_MAX_WIDTH)}>
            <BlockRenderer blocks={blocks} />
          </div>
        ) : // <div className={classNames('mx-auto flex min-h-48 w-full items-center justify-center rounded-md bg-tile text-sm text-mute', DETAIL_CONTENT_MAX_WIDTH)}>No content yet</div>
        null}
      </DetailRow>
    </article>
  )
}
