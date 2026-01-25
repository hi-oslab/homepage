// src/app/work/[slug]/page.tsx

import { getPageContent, getPageBySlug } from '@/app/api/notion'
import { Breadcrumbs, NotionRenderer } from '@/components'
import { notFound } from 'next/navigation'

type PageParams = Promise<{ slug: string }>

export const revalidate = 30 // 30초마다 데이터 갱신 (자동 업데이트)

export default async function Page({ params }: { params: PageParams }) {
  const workItem = await getPageBySlug('works', (await params).slug)

  // Redirect to not found page if not found
  if (!workItem) notFound()

  const content = await getPageContent(workItem.id)

  const title = (workItem.properties.title as any).title[0].plain_text
  const subTitle = (workItem.properties.subtitle as any).rich_text[0]?.plain_text || 'No subtitle available'

  return (
    <>
      {/* header */}
      <div className='w-full h-fit px-4 md:px-8 py-6 md:py-12 flex flex-col items-start justify-start gap-4'>
        <Breadcrumbs />
        <span className='text-4xl md:text-6xl font-semibold leading-none'>{title}</span>
        <span className='text-lg md:text-xl'>{subTitle}</span>
      </div>
      {/* content */}
      <div className='w-full bg-white text-black min-h-dvh h-fit px-4 md:px-8 py-6 md:py-12 flex flex-col items-start justify-start gap-4'>
        {content.length > 0 ? <NotionRenderer blocks={content} /> : <div className=''>No content</div>}
      </div>
    </>
  )
}
