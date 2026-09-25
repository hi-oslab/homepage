import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedHistory, getPublishedMembers } from '@/lib/cms'
import { Arrow, InView, Label } from '@/components'
import type { HistoryItem } from '@/types/cms'

export const revalidate = 30 // 30초마다 데이터 갱신 (자동 업데이트)

export const metadata: Metadata = {
  title: 'About',
  description:
    '2018년 홍익대학교에서 시작된 인터랙티브 미디어 아트 크루, 오픈소스랩. 미디어 아트, 크리에이티브 코딩, 피지컬 컴퓨팅을 연구하고 공유합니다.',
  openGraph: {
    title: 'About | Open Source Lab',
    description:
      '2018년 홍익대학교에서 시작된 인터랙티브 미디어 아트 크루, 오픈소스랩. 미디어 아트, 크리에이티브 코딩, 피지컬 컴퓨팅을 연구하고 공유합니다.',
    url: 'https://hioslab.com/about',
  },
  alternates: { canonical: 'https://hioslab.com/about' },
}

const CONTENTS = {
  statement: '정보를 나누고 함께 만드는 인터랙티브 미디어 아트 크루.',
  description: [
    '2018년 홍익대학교 디지털미디어디자인 전공 학생과 디자인컨버전스학부 학생들이 만나 예술과 디지털 기술에 대해 공부하며 시작된 모임입니다. 현재는 다양한 코드와 마크업 언어를 이용하여 인터랙션이 있는 미디어 아트, 그리고 사물을 접목시킨 피지컬 컴퓨팅 작품을 만들고 토론합니다.',
    '자유 소프트웨어 운동에서 비롯된 "오픈소스" 문화의 특징인 정보공유 평등주의와 협업주의를 받아들여 계승하자는 의미로 \'Open Source Lab\'이라는 이름을 정하였습니다.',
  ],
}

const VALUES = [
  { title: 'Discovery', description: '익숙한 것에서 낯선 질문을 발견합니다.' },
  { title: 'Creativity', description: '코드와 사물로 새로운 경험을 만듭니다.' },
  { title: 'Extension', description: '만든 것을 나누고 함께 확장합니다.' },
]

const FIELDS = ['Media Art', 'Creative Coding', 'Physical Computing', 'Interaction Design', 'Sound & Performance']

export default async function Page() {
  const [members, history] = await Promise.all([getPublishedMembers(), getPublishedHistory()])

  return (
    <div className='flex w-full flex-col px-4 md:px-8'>
      <InView className='grid grid-cols-1 gap-16 pt-6 pb-32 md:grid-cols-12 md:gap-8 md:pt-8 md:pb-48'>
        {/* 좌측: 큰 문장 */}
        <div className='flex flex-col gap-8 md:col-span-6'>
          <span className='text-sm'>About</span>
          <h1 className='max-w-[14ch] break-keep text-[clamp(2.5rem,5vw,5rem)] font-medium leading-[1.08] tracking-[-0.04em] md:sticky md:top-12'>
            {CONTENTS.statement}
          </h1>
        </div>

        {/* 우측: 라벨 + 내용 행 */}
        <div className='flex flex-col gap-16 md:col-span-6 md:pt-13 md:gap-20'>
          <Row label='Studio'>
            <div className='flex flex-col gap-5 break-keep text-base leading-relaxed'>
              {CONTENTS.description.map((paragraph) => (
                <p key={paragraph.slice(0, 16)}>{paragraph}</p>
              ))}
            </div>
          </Row>

          <Row label='Values'>
            <ul className='flex flex-col gap-2'>
              {VALUES.map((value) => (
                <li key={value.title} className='flex flex-col gap-2 rounded-md bg-tile p-5'>
                  <span className='text-2xl font-medium tracking-[-0.03em]'>{value.title}</span>
                  <span className='text-sm text-ink/60'>{value.description}</span>
                </li>
              ))}
            </ul>
          </Row>

          <Row label='Fields'>
            <ul className='flex flex-col gap-1 text-base'>
              {FIELDS.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </Row>

          <Row label='Members'>
            <Link href='/members' className='group inline-flex items-center gap-1 text-base transition-colors hover:text-mute'>
              {members.length}명의 멤버가 함께합니다
              <Arrow className='size-4' />
            </Link>
          </Row>

          <Row label='Inquiries'>
            <div className='flex flex-col gap-1 text-base'>
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
            </div>
          </Row>
        </div>
      </InView>

      {history.length > 0 && <History items={history} />}
    </div>
  )
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <section className='grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-8'>
    <h2 className='text-sm text-mute'>{label}</h2>
    <div className='sm:col-span-2'>{children}</div>
  </section>
)

/** 연혁(CV): 연도별로 묶어 최신순 */
const History = ({ items }: { items: HistoryItem[] }) => {
  const years = Array.from(new Set(items.map((item) => item.year)))

  return (
    <InView className='flex flex-col gap-10 pb-32 md:pb-48'>
      <Label index='CV'>History</Label>
      <div className='flex flex-col gap-12 md:gap-16'>
        {years.map((year) => (
          <section key={year} className='grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-8'>
            <h3 className='text-3xl font-medium tracking-[-0.04em] md:col-span-3 md:text-4xl'>{year}</h3>
            <ul className='flex flex-col gap-5 md:col-span-9'>
              {items
                .filter((item) => item.year === year)
                .map((item) => (
                  <li key={item.id} className='grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 gap-y-1 sm:grid-cols-[3rem_7rem_minmax(0,1fr)]'>
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
