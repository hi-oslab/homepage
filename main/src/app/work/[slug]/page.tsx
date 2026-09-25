import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { WorkDetailLayout } from '@/components/WorkDetailLayout'
import { getPublishedWorkBySlug, getPublishedWorks } from '@/lib/cms'

type PageParams = Promise<{ slug: string }>

export const revalidate = 300

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const work = await getPublishedWorkBySlug((await params).slug)
  if (!work) return {}
  const canonical = `https://hioslab.com/work/${work.slug}`

  return {
    title: work.title,
    description: work.description || work.subtitle,
    openGraph: {
      title: `${work.title} | Open Source Lab`,
      description: work.description || work.subtitle,
      url: canonical,
      ...(work.thumbnail_url ? { images: [{ url: work.thumbnail_url, alt: work.title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: work.title,
      description: work.description || work.subtitle,
      ...(work.thumbnail_url ? { images: [work.thumbnail_url] } : {}),
    },
    alternates: { canonical },
  }
}

export async function generateStaticParams() {
  const works = await getPublishedWorks()
  return works.map((work) => ({ slug: work.slug }))
}

export default async function Page({ params }: { params: PageParams }) {
  const work = await getPublishedWorkBySlug((await params).slug)
  if (!work) notFound()
  return <WorkDetailLayout work={work} />
}
