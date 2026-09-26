import type { Metadata } from 'next'
import Link from 'next/link'
import classNames from 'classnames'
import { OG_IMAGE } from '@/app/metadata'
import { Arrow, InView, Label } from '@/components'
import { PracticeList, type Practice } from '@/components/PracticeList'
import { getPublishedHistory, getPublishedMembers, getPublishedWorks } from '@/lib/cms'
import type { HistoryItem } from '@/types/cms'

// 메인 = About. 첫 방문자가 "오픈소스랩이 무엇을 하는 곳인지"를 이야기 순서로 읽도록 구성한다.

// 공식 명칭
const OFFICIAL_NAME = 'Interactive Media Art Collective, Open Source Lab'

const DESCRIPTION =
  'Interactive Media Art Collective, Open Source Lab. 2018년 홍익대학교에서 시작된 인터랙티브 미디어 아트 콜렉티브, 오픈소스랩. 미디어 아트, 크리에이티브 코딩, 피지컬 컴퓨팅을 연구하고 공유합니다.'

export const metadata: Metadata = {
  title: { absolute: OFFICIAL_NAME },
  description: DESCRIPTION,
  openGraph: { url: '/', title: OFFICIAL_NAME, description: DESCRIPTION, images: [OG_IMAGE] },
  alternates: { canonical: '/' },
}

export const revalidate = 30 // 30초마다 데이터 갱신 (자동 업데이트)

// 각 섹션은 한 가지 이야기만 한다: 누구인지(첫 화면) → 어떻게 시작했는지 → 무엇을 하는지 → 이름에 담은 태도
// 첫 화면 문장: 영문이 먼저, 한글을 함께 적는다
const STATEMENT = {
  en: 'Interactive Media Art Collective',
  ko: '정보를 나누고 함께 만드는 인터랙티브 미디어 아트 콜렉티브.',
}

const ORIGIN = {
  lead: '2018년, 홍익대학교 디지털미디어디자인 전공과 디자인컨버전스학부 학생들이 예술과 디지털 기술을 함께 공부하려고 모였습니다.',
  body: '지금은 코드와 사물을 재료로 작업을 만들고, 만드는 과정과 소스를 서로 나누며 토론합니다.',
}

const NAME_MEANING =
  '자유 소프트웨어 운동에서 비롯된 "오픈소스" 문화 — 정보를 평등하게 나누고 함께 만드는 태도를 이어가자는 뜻으로 이름을 지었습니다.'

const PRACTICES: Practice[] = [
  { title: 'Media Art', description: '공간과 관객에 반응하는 인터랙티브 미디어 아트 전시를 기획하고 만듭니다.' },
  { title: 'Creative Coding', description: '코드로 이미지와 소리, 움직임을 만들고 그 과정과 소스를 함께 나눕니다.' },
  { title: 'Physical Computing', description: '센서와 사물을 연결해 손으로 만지고 몸으로 경험하는 작업을 만듭니다.' },
  { title: 'Performance', description: '소리와 목소리, AI를 활용해 관객이 함께 완성하는 공연을 만듭니다.' },
]

const VALUES = [
  { title: 'Discovery', description: '익숙한 것에서 낯선 질문을 발견합니다.' },
  { title: 'Creativity', description: '코드와 사물로 새로운 경험을 만듭니다.' },
  { title: 'Extension', description: '만든 것을 나누고 함께 확장합니다.' },
]

export default async function Page() {
  const [works, members, history] = await Promise.all([
    getPublishedWorks(),
    getPublishedMembers(),
    getPublishedHistory(),
  ])
  const recent = works.slice(0, 5)

  const explore = [
    { title: 'Contact', caption: '협업과 전시 문의', href: '/contact' },
    { title: 'Members', caption: `${members.length}명의 멤버가 함께합니다`, href: '/members' },
    { title: 'Lab Space', caption: 'Opening soon', href: '/lab-space' },
  ]

  return (
    <div className='flex w-full flex-col px-4 md:px-8'>
      {/* 첫 화면: 우리가 누구인지 한 문장으로 */}
      <InView className='flex min-h-[calc(100dvh-var(--spacing-header))] flex-col justify-between gap-16 pt-8 pb-10 md:pt-12 md:pb-12'>
        <div className='flex flex-col gap-5 md:gap-7'>
          <h1 className='max-w-[18ch] text-[clamp(2.5rem,6.4vw,7rem)] font-medium leading-[1.02] tracking-[-0.045em]'>
            {STATEMENT.en}
          </h1>
          <p
            lang='ko'
            className='max-w-[26ch] break-keep text-xl leading-snug tracking-[-0.02em] text-mute md:text-3xl'
          >
            {STATEMENT.ko}
          </p>
        </div>
        <div className='flex flex-col gap-6'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src='/img/logo.svg' alt='Open Source Lab' className='h-auto w-1/2 md:w-1/3 self-end' />
        </div>
      </InView>

      {/* (01) Origin — 어떻게 시작했는지 */}
      <InView className='grid grid-cols-1 gap-8 pt-16 pb-24 md:grid-cols-12 md:pt-24 md:pb-40'>
        <Label index='01' className='md:col-span-4'>
          Origin
        </Label>
        <div className='flex flex-col gap-6 break-keep md:col-span-7'>
          <p className='text-2xl font-medium leading-snug tracking-[-0.02em] md:text-3xl'>{ORIGIN.lead}</p>
          <p className='text-base leading-relaxed text-ink/70 md:text-lg'>{ORIGIN.body}</p>
        </div>
      </InView>

      {/* (02) Practice — 무엇을 하는지 */}
      <InView className='flex flex-col gap-10 pb-24 md:pb-40'>
        <Label index='02'>Practice</Label>
        <PracticeList items={PRACTICES} />
      </InView>

      {/* (03) Open Source — 이름에 담은 태도 */}
      <InView className='flex flex-col gap-10 pb-24 md:pb-40'>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-12'>
          <Label index='03' className='md:col-span-4'>
            Open Source
          </Label>
          <p className='break-keep text-xl leading-snug tracking-[-0.01em] md:col-span-7 md:text-2xl'>{NAME_MEANING}</p>
        </div>
        <ul className='grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3'>
          {VALUES.map((value) => (
            <li
              key={value.title}
              className='flex flex-col justify-between gap-10 rounded-md bg-tile p-5 md:aspect-[5/3] md:p-6'
            >
              <span className='text-3xl font-medium tracking-[-0.03em] md:text-4xl'>{value.title}</span>
              <span className='break-keep text-sm text-ink/60'>{value.description}</span>
            </li>
          ))}
        </ul>
      </InView>

      {/* (04) Recent Works — 썸네일 대신 텍스트 목록 */}
      {recent.length > 0 && (
        <InView className='grid grid-cols-1 gap-8 pb-24 md:grid-cols-12 md:pb-40'>
          <div className='flex items-baseline justify-between md:col-span-4 md:flex-col md:justify-start md:gap-4'>
            <Label index='04'>Recent Works</Label>
            <MoreLink href='/work'>All works</MoreLink>
          </div>
          <ul className='-mx-3 flex flex-col md:col-span-8'>
            {recent.map((work) => (
              <li key={work.id}>
                <Link
                  href={`/work/${work.slug}`}
                  className='group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 rounded-md px-3 py-4 transition-colors hover:bg-tile md:grid-cols-[minmax(0,1fr)_12rem_4rem]'
                >
                  <span className='break-keep text-lg font-medium tracking-[-0.02em] md:text-xl'>{work.title}</span>
                  <span className='hidden truncate text-sm text-mute md:block'>{work.category}</span>
                  <span className='flex items-center justify-end gap-1 text-sm tabular-nums text-mute'>
                    {work.year}
                    <Arrow className='size-3.5 opacity-0 transition-opacity group-hover:opacity-100' />
                  </span>
                  {work.subtitle && (
                    <span className='col-span-full break-keep text-sm leading-snug text-mute'>{work.subtitle}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </InView>
      )}

      {/* (05) History — 연혁 */}
      {history.length > 0 && <History items={history} />}

      {/* Explore — 멤버 / 연락 / 공간 */}
      <InView className='flex flex-col gap-8 pb-32 md:pb-48'>
        <div className='flex flex-wrap items-baseline justify-between gap-4'>
          <Label index={history.length > 0 ? '06' : '05'}>Explore</Label>
          <span className='flex flex-wrap gap-x-4 text-sm'>
            <a href='mailto:hi.oslab@gmail.com' className='transition-colors hover:text-mute'>
              hi.oslab@gmail.com
            </a>
            <a
              href='https://www.instagram.com/opensource_lab/'
              target='_blank'
              rel='noopener noreferrer'
              className='transition-colors hover:text-mute'
            >
              @opensource_lab
            </a>
          </span>
        </div>
        <div className='grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3'>
          {explore.map((item, index) => (
            <Link
              key={item.title}
              href={item.href}
              className={classNames(
                'group flex aspect-[5/2] flex-col justify-between rounded-md p-5 transition-colors duration-300 md:aspect-[5/3] md:p-6',
                index === 0 ? 'bg-ink text-white' : 'bg-tile text-ink/50 hover:bg-ink hover:text-white',
              )}
            >
              <span className='text-3xl font-medium tracking-[-0.03em] md:text-5xl'>{item.title}</span>
              <span className='flex items-end justify-between text-sm'>
                <span className='opacity-70'>{item.caption}</span>
                <Arrow
                  direction={index === 0 ? 'up-right' : 'down-right'}
                  className='size-7 transition-[rotate] duration-300 group-hover:rotate-0'
                />
              </span>
            </Link>
          ))}
        </div>
      </InView>
    </div>
  )
}

const MoreLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className='group inline-flex items-center gap-1 text-sm text-ink transition-colors hover:text-mute'>
    {children}
    <Arrow className='size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5' />
  </Link>
)

/** 연혁(CV): 연도별로 묶어 최신순 */
const History = ({ items }: { items: HistoryItem[] }) => {
  const years = Array.from(new Set(items.map((item) => item.year)))

  return (
    <InView className='flex flex-col gap-10 pb-24 md:pb-40'>
      <Label index='05'>History</Label>
      <div className='flex flex-col gap-12 md:gap-16'>
        {years.map((year) => (
          <section key={year} className='grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-8'>
            <h3 className='text-3xl font-medium tracking-[-0.04em] md:col-span-4 md:text-4xl'>{year}</h3>
            <ul className='flex flex-col gap-5 md:col-span-8'>
              {items
                .filter((item) => item.year === year)
                .map((item) => (
                  <li
                    key={item.id}
                    className='grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 gap-y-1 sm:grid-cols-[3rem_7rem_minmax(0,1fr)]'
                  >
                    <span className='text-sm tabular-nums text-mute'>
                      {item.month ? String(item.month).padStart(2, '0') : ''}
                    </span>
                    <span className='hidden text-sm text-mute sm:block'>{item.category}</span>
                    <div className='flex flex-col gap-0.5'>
                      {item.link ? (
                        <a
                          href={item.link}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='group inline-flex items-start gap-1 break-keep text-base leading-snug transition-colors hover:text-mute'
                        >
                          {item.title}
                          <Arrow className='mt-1 size-3.5 shrink-0' />
                        </a>
                      ) : (
                        <span className='break-keep text-base leading-snug'>{item.title}</span>
                      )}
                      {(item.detail || item.category) && (
                        <span className='break-keep text-sm text-mute'>
                          <span className='sm:hidden'>{item.category}</span>
                          {item.category && item.detail && <span className='sm:hidden'> · </span>}
                          {item.detail}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </InView>
  )
}
