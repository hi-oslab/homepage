import Link from 'next/link'
import { GoArrowRight } from 'react-icons/go'
import { RelativeTime } from '../../DashboardActions'
import { BentoCard, type HomeCardProps } from '../BentoCard'
import { getHomeWorks } from '../data'

/** 보여줄 프로젝트 수 */
const LIMIT = 1

/** 최근 수정된 프로젝트 */
export async function RecentWorksCard({ index, className }: HomeCardProps) {
  const works = (await getHomeWorks()).slice(0, LIMIT)

  return (
    <BentoCard index={index} className={className} bodyClassName='gap-2'>
      <span className='flex items-center justify-between'>
        <span className='text-sm text-mute'>최근 수정된 프로젝트</span>
        <Link href='/space/works' className='flex items-center gap-1 text-xs text-mute hover:text-ink'>
          전체 <GoArrowRight size={11} />
        </Link>
      </span>
      <ul className='-mx-2 flex flex-col'>
        {works.map((work) => (
          <li key={work.id}>
            <Link
              href={`/space/works/${work.id}`}
              className='flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-field'
            >
              <span className='rounded-inner h-8 w-10 shrink-0 overflow-hidden bg-field'>
                {work.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={work.thumbnail_url} alt='' className='size-full object-cover' />
                )}
              </span>
              <span className='flex min-w-0 flex-1 flex-col'>
                <span className='truncate text-sm'>{work.title || '제목 없음'}</span>
                <span className='flex items-center gap-1 truncate text-[11px] text-mute'>
                  {!work.published && '비공개 ·'}
                  <RelativeTime iso={work.updated_at} />
                </span>
              </span>
            </Link>
          </li>
        ))}
        {works.length === 0 && <li className='px-2 py-3 text-sm text-mute'>아직 기록된 프로젝트가 없어요.</li>}
      </ul>
    </BentoCard>
  )
}
