import { getParsedDataByTableType } from '@/app/api/notion'
import { InView } from '@/components'
import Link from 'next/link'

export const revalidate = 30 // 30초마다 데이터 갱신 (자동 업데이트)

export default async function Page() {
  const parsedWorks = await getParsedDataByTableType('works')

  //projectDate 기준 내림차순 정렬
  const sortedWorks = parsedWorks.sort((a, b) =>
    b.properties.projectDate.start.localeCompare(a.properties.projectDate.start),
  )

  return (
    <>
      <InView className='w-full min-h-dvh h-fit flex flex-col gap-8 md:gap-16 p-4 md:p-8 justify-start items-center'>
        <div className='w-full h-fit flex flex-col items-center justify-center text-center'>
          <h1 className='text-4xl font-bold uppercase'>[ our works ]</h1>
        </div>
        <div className='w-full h-full flex flex-col p-4 justify-start items-start gap-4 md:gap-8 pb-32 md:pb-48'>
          {sortedWorks.map((work) => (
            <Link
              href={`/work/${work.properties.slug}`}
              key={work.id}
              className='w-full h-fit flex flex-col md:flex-row gap-2 md:gap-8 justify-between items-start'
            >
              <div className='w-full md:w-1/3 h-auto aspect-video bg-neutral-800 mb-4 flex justify-center items-center'>
                {work.properties.thumbnail ? (
                  <img
                    src={work.properties.thumbnail}
                    alt={work.properties.title}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <span className='text-neutral-500'>No Image</span>
                )}
              </div>
              <div className='w-full md:w-2/3 h-fit flex flex-col justify-start items-start gap-2'>
                <h2 className='w-full text-left text-xl md:text-2xl font-semibold'>{work.properties.title}</h2>
                <p className='w-full text-left text-base leading-relaxed break-keep'>{work.properties.description}</p>
                <p className='w-full text-left text-sm text-neutral-500'>{work.properties.year}</p>
                <p className='w-full text-left text-sm text-neutral-500'>Category: {work.properties.category}</p>
                <p className='w-full text-left text-sm text-neutral-500'>
                  Business Type: {work.properties.businessType}
                </p>
                <div className='w-full text-left mt-2'>
                  {work.properties.tags.map((tag) => (
                    <span
                      key={tag.name}
                      className='inline-block bg-neutral-800 text-white text-xs px-3 py-1 mr-2 mb-2 rounded-full'
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </InView>
    </>
  )
}
