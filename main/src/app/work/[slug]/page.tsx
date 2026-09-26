import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { WorkDetailLayout } from '@/components/WorkDetailLayout'
import { getPublishedWorkBySlug, getPublishedWorks } from '@/lib/cms'
import { absoluteUrl } from '@/lib/site'

type PageParams = Promise<{ slug: string }>

export const revalidate = 300

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const work = await getPublishedWorkBySlug((await params).slug)
  if (!work) return {}
  const canonical = `/work/${work.slug}`

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

  // 검색엔진용 작품 정보 (schema.org CreativeWork)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: work.title,
    headline: work.subtitle || undefined,
    description: work.description || work.subtitle || undefined,
    url: absoluteUrl(`/work/${work.slug}`),
    image: work.thumbnail_url ? absoluteUrl(work.thumbnail_url) : undefined,
    dateCreated: work.project_date || String(work.year),
    genre: work.category || undefined,
    keywords: work.tags.length ? work.tags.join(', ') : undefined,
    inLanguage: 'ko',
    creator: { '@type': 'Organization', name: 'Open Source Lab', url: absoluteUrl('/') },
  }

  return (
    <>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <WorkDetailLayout work={work} />
    </>
  )
}
