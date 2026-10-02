import type { Metadata } from 'next'
import Link from 'next/link'
import { OG_IMAGE } from '@/app/metadata'
import { InView } from '@/components'
import { ProfileImage } from '@/components/ProfileImage'
import { getPublishedLab } from '@/lib/lab'
import {
  LAB_BEST_PERIODS,
  labArticleByline,
  type LabArticleCard,
  type LabIssue,
  type LabRecommendMode,
} from '@/lib/lab-types'
import { HScroll } from './HScroll'

export const revalidate = 60 // 조회수 · 새 글을 1분마다 반영

export const metadata: Metadata = {
  title: 'Lab Space',
  description: '오픈소스랩 멤버들이 토픽마다 함께 쓰는 매거진, Lab Space.',
  openGraph: { title: 'Lab Space | Open Source Lab', url: '/lab-space', images: [OG_IMAGE] },
  alternates: { canonical: '/lab-space' },
}

/**
 * Lab Space: 멤버들이 토픽마다 쓰는 매거진
 * 머리: 제목 + 토픽 목차(Index) → Best · Recommend(가로로 넘기는 줄) → 토픽별 섹션(왼쪽 토픽 소개 · 오른쪽 글 목록)
 * Best · Recommend를 넣을지, 몇 개일지는 멤버 공간 Lab Space의 공개 페이지 설정에서 운영자가 정한다
 */
export default async function Page() {
  const lab = await getPublishedLab()
  const articles = lab?.articles ?? []
  const issues = lab?.issues ?? []

  const best = lab?.best ?? []
  const recommended = lab?.recommended ?? []
  const settings = lab?.settings
  const period = LAB_BEST_PERIODS.find((item) => item.days === (settings?.best_period_days ?? null))
  const sections = issues
    .map((issue) => ({ issue, articles: articles.filter((article) => article.issue_id === issue.id) }))
    .filter((section) => section.articles.length > 0)

  return (
    <div className='flex w-full flex-col px-4 pb-32 md:px-8 md:pb-48'>
      <InView className='flex min-h-[30dvh] md:min-h-[50dvh] flex-col justify-between gap-16 pt-6 pb-16 md:pt-8 md:pb-24'>
        <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-12 md:gap-8'>
          <span className='md:col-span-4'>Lab Space</span>
          <span className='text-mute md:col-span-6 lg:col-span-4'>Articles, essays & discussions by OSL members</span>
        </div>
        <h1 className='flex items-start gap-3 text-[clamp(3.5rem,11vw,11rem)] font-medium leading-[0.85] '>
          Lab Space
          <sup className='mt-[0.4em] text-base font-normal text-mute md:text-xl'>
            ({String(articles.length).padStart(2, '0')})
          </sup>
        </h1>
      </InView>

      {articles.length === 0 ? (
        <p className='py-24 text-center text-sm text-mute'>첫 글을 기다리고 있어요.</p>
      ) : (
        <div className='flex flex-col gap-24 md:gap-16'>
          {recommended.length > 0 && (
            <InView className='flex flex-col gap-5'>
              <RowHeader label='Selected' />
              <HScroll label='Selected'>
                {recommended.map((article) => (
                  <li key={article.id} className='w-44 shrink-0 snap-start sm:w-60 md:w-72 lg:w-96'>
                    <CompactCard article={article} />
                  </li>
                ))}
              </HScroll>
            </InView>
          )}

          {best.length > 0 && (
            <InView className='flex flex-col gap-5'>
              <RowHeader label='Best' />
              <HScroll label='Best'>
                {best.map((article, index) => (
                  <li key={article.id} className='w-44 shrink-0 snap-start sm:w-60 md:w-72 lg:w-96'>
                    <CompactCard article={article} rank={index + 1} />
                  </li>
                ))}
              </HScroll>
            </InView>
          )}

          {/* 토픽별: 왼쪽 토픽 소개 · 오른쪽 글 목록 */}
          {sections.map(({ issue, articles: items }, index) => (
            <InView
              key={issue.id}
              id={`topic-${issue.id}`}
              className='grid scroll-mt-24 grid-cols-1 gap-8 pt-4 lg:grid-cols-12'
            >
              <div className='flex flex-col gap-4 lg:sticky lg:top-24 lg:col-span-4 lg:self-start'>
                <div className='flex items-baseline justify-between gap-4'>
                  <Label>{periodLabel(issue)}</Label>
                </div>
                <h2 className='text-4xl leading-none font-semibold break-keep md:text-5xl lg:text-6xl'>
                  {issue.title}
                </h2>
                {issue.description && (
                  <p className='max-w-sm text-sm font-normal leading-relaxed break-keep md:max-w-lg lg:max-w-sm'>
                    {issue.description}
                  </p>
                )}
              </div>

              <ul className='flex flex-col gap-4 lg:col-span-8'>
                {items.map((article) => (
                  <li key={article.id}>
                    <RowCard article={article} />
                  </li>
                ))}
              </ul>
            </InView>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── 작은 조각들 ─────────────────────────────────────────────────────── */

/** 모노 작은 글씨 라벨 (참고 디자인의 메타 정보) */
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`font-mono text-[10px] leading-tight text-ink/50 ${className ?? ''}`}>{children}</span>
}

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'Asia/Seoul' }).format(new Date(iso))
const fullDate = (iso: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Seoul' }).format(
    new Date(iso),
  )

/** 토픽 기간: 'Aug 19 – Dec 10' (마감이 없으면 시작만) */
function periodLabel(issue: LabIssue) {
  const start = issue.opens_at ?? issue.created_at
  return issue.closes_at ? `${shortDate(start)} – ${shortDate(issue.closes_at)}` : `From ${shortDate(start)}`
}

/** Best · Recommend 줄 머리 */
function RowHeader({ label }: { label: string }) {
  return (
    <header className='grid grid-cols-2 items-baseline gap-4 pt-3 pr-20 md:grid-cols-12 md:gap-8'>
      <h2 className='text-4xl leading-none font-semibold md:text-5xl lg:text-6xl'>{label}</h2>
    </header>
  )
}

function Thumbnail({ article, className }: { article: LabArticleCard; className?: string }) {
  return (
    <div className={`relative aspect-[16/9] w-full overflow-hidden bg-tile ${className ?? ''}`}>
      {article.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.thumbnail_url}
          alt=''
          loading='lazy'
          className='size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]'
        />
      ) : (
        <span className='flex size-full items-end p-2 text-sm leading-tight font-medium break-keep text-ink/25'>
          {article.title}
        </span>
      )}
    </div>
  )
}

/** Best · Recommend: 작은 세로 카드 */
function CompactCard({ article, rank }: { article: LabArticleCard; rank?: number }) {
  return (
    <Link href={`/lab-space/${article.slug}`} className='group flex flex-col gap-2.5'>
      <div className='relative'>
        <Thumbnail article={article} />
        {rank !== undefined && (
          <span className='absolute top-2 left-2 font-mono text-[10px] text-white tabular-nums mix-blend-difference'>
            {String(rank).padStart(2, '0')}
          </span>
        )}
      </div>
      <div className='flex flex-col gap-1'>
        <Label className='truncate'>
          {article.issue_title} · {article.view_count.toLocaleString()} views
        </Label>
        <span className='line-clamp-2 text-sm leading-snug font-medium break-keep transition-colors group-hover:text-mute'>
          {article.title}
        </span>
        <span className='text-[11px] text-mute'>{labArticleByline(article, true)}</span>
      </div>
    </Link>
  )
}

/** 토픽 섹션: 가로 한 줄 (작은 썸네일 · 메타 · 제목) */
function RowCard({ article }: { article: LabArticleCard }) {
  return (
    <Link
      href={`/lab-space/${article.slug}`}
      className='group grid grid-cols-[10rem_minmax(0,1fr)] gap-4 py-3 sm:grid-cols-[13rem_minmax(0,1fr)] md:grid-cols-[2fr_4fr] md:gap-6'
    >
      <Thumbnail article={article} />
      <div className='flex min-w-0 flex-col justify-between gap-2'>
        <div className='flex flex-col gap-1'>
          <span className='flex items-baseline justify-between gap-3'>
            <Label className='truncate'>{fullDate(article.created_at)}</Label>
            <Label className='shrink-0 tabular-nums'>{article.view_count.toLocaleString()} views</Label>
          </span>
          <span className='line-clamp-2 text-base sm:text-lg lg:text-xl leading-snug font-medium break-keep transition-colors group-hover:text-mute'>
            {article.title}
          </span>
          {article.subtitle && (
            <span className='line-clamp-1 text-xs sm:text-sm lg:text-base break-keep text-mute'>
              {article.subtitle}
            </span>
          )}
        </div>
        <span className='flex items-center gap-1.5 text-[11px] md:text-sm mb-1'>
          <ProfileImage
            src={article.edit_scope === 'all' ? null : article.author_image}
            name={labArticleByline(article, true)}
            size='sm'
            className='size-4 md:size-6 text-[8px] md:text-sm'
          />
          {labArticleByline(article, true)}
        </span>
      </div>
    </Link>
  )
}
