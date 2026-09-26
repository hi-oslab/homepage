import type { Metadata } from 'next'
import Link from 'next/link'
import classNames from 'classnames'
import { Arrow, InView, Label, MainMotionTitle, WorkTile } from '@/components'
import { PracticeList, type Practice } from '@/components/PracticeList'
import { getPublishedWorks } from '@/lib/cms'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export const revalidate = 30 // 30초마다 데이터 갱신 (자동 업데이트)

const PRACTICES: Practice[] = [
  {
    title: 'Media Art',
    description: '공간과 관객에 반응하는 인터랙티브 미디어 아트 전시를 기획하고 만듭니다.',
  },
  {
    title: 'Creative Coding',
    description: '코드로 이미지와 소리, 움직임을 만들고 그 과정과 소스를 함께 나눕니다.',
  },
  {
    title: 'Physical Computing',
    description: '센서와 사물을 연결해 손으로 만지고 몸으로 경험하는 작업을 만듭니다.',
  },
  {
    title: 'Performance',
    description: '소리와 목소리, AI를 활용해 관객이 함께 완성하는 공연을 만듭니다.',
  },
]

const EXPLORE = [
  { title: 'Contact', caption: '협업과 전시 문의', href: '/contact' },
  { title: 'Members', caption: '오픈소스랩을 만드는 사람들', href: '/members' },
  { title: 'Lab Space', caption: 'Opening soon', href: '/lab-space' },
]

export default async function Page() {
  const works = await getPublishedWorks()
  const [featured, ...rest] = works
  const recent = rest.slice(0, 6)

  return (
    <div className='flex w-full flex-col '>
      {/* Hero */}
      <InView className='flex min-h-[calc(100dvh-1.75rem)] bg-black flex-col justify-between gap-16 pt-6 pb-20 md:pt-8 md:pb-16'>
        {/* <h1 className='max-w-[16ch] break-keep text-[clamp(2.5rem,6.4vw,6.5rem)] font-medium leading-[1.08] tracking-[-0.04em]'>
          코드와 사물로 이야기를 만드는 인터랙티브 미디어 아트 크루.
        </h1> */}
        <MainMotionTitle layout='stacked' className='h-[80vh] my-auto' />
      </InView>

      {featured && (
        <InView className='pb-24 md:pb-40 pt-4 md:pt-8 px-4 md:px-8'>
          <Link href={`/work/${featured.slug}`} className='group flex flex-col gap-3'>
            <div className='aspect-[4/3] w-full overflow-hidden bg-tile md:aspect-[16/8]'>
              {featured.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.thumbnail_url}
                  alt={featured.title}
                  className='size-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.02]'
                />
              )}
            </div>
            <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-12 md:gap-8'>
              <span className='text-mute md:col-span-4'>Latest — {featured.year}</span>
              <span className='break-keep md:col-span-8'>
                {featured.title}
                {featured.subtitle && <span className='hidden text-mute md:inline'> — {featured.subtitle}</span>}
              </span>
            </div>
          </Link>
        </InView>
      )}

      {/* (01) Studio */}
      <InView className='grid grid-cols-1 gap-8 pb-24 md:grid-cols-12 md:pb-40 px-4 md:px-8'>
        <Label index='01' className='md:col-span-4'>
          Open Source Lab
        </Label>
        <div className='flex flex-col items-start gap-8 md:col-span-8'>
          <p className='break-keep text-2xl font-medium leading-snug tracking-[-0.02em] md:text-4xl'>
            2018년 홍익대학교에서 시작된 오픈소스랩은 예술과 기술 사이에서 인터랙션이 있는 미디어 아트와 피지컬 컴퓨팅
            작품을 만들고, 그 과정을 함께 나눕니다.
          </p>
          <MoreLink href='/about'>About us</MoreLink>
        </div>
      </InView>

      {/* (02) Recent Works */}
      {recent.length > 0 && (
        <InView className='flex flex-col gap-8 pb-24 md:pb-40 px-4 md:px-8'>
          <div className='flex items-baseline justify-between'>
            <Label index='02'>Recent Works</Label>
            <MoreLink href='/work'>All works</MoreLink>
          </div>
          <div className='grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8 md:gap-y-16'>
            {recent.map((work) => (
              <WorkTile key={work.id} work={work} />
            ))}
          </div>
        </InView>
      )}

      {/* (03) Practice */}
      <InView className='flex flex-col gap-10 pb-24 md:pb-40 px-4 md:px-8'>
        <Label index='03'>Practice</Label>
        <PracticeList items={PRACTICES} />
      </InView>

      {/* (04) Explore */}
      <InView className='flex flex-col gap-8 pb-32 md:pb-48 px-4 md:px-8'>
        <Label index='04'>Explore</Label>
        <div className='grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3'>
          {EXPLORE.map((item, index) => (
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
