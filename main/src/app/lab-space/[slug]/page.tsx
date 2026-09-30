import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LabArticleLayout } from '@/components/LabArticleLayout'
import { getPublishedLab, getPublishedLabArticleBySlug } from '@/lib/lab'
import { ViewCounter } from './ViewCounter'

type PageParams = Promise<{ slug: string }>

export const revalidate = 60

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const article = await getPublishedLabArticleBySlug(decodeURIComponent((await params).slug))
  if (!article) return {}
  const description = article.description || article.subtitle
  return {
    title: article.title,
    description,
    openGraph: {
      title: `${article.title} | Lab Space`,
      description,
      url: `/lab-space/${article.slug}`,
      ...(article.thumbnail_url ? { images: [{ url: article.thumbnail_url, alt: article.title }] } : {}),
    },
    alternates: { canonical: `/lab-space/${article.slug}` },
  }
}

// 공개된 글은 빌드 때 미리 만들어 두어 목록에서 누르면 바로 열린다 (새 글은 처음 열 때 만든다)
export async function generateStaticParams() {
  const lab = await getPublishedLab()
  return (lab?.articles ?? []).map((article) => ({ slug: article.slug }))
}

export default async function Page({ params }: { params: PageParams }) {
  const article = await getPublishedLabArticleBySlug(decodeURIComponent((await params).slug))
  if (!article) notFound()

  return (
    <>
      {/* 조회수는 브라우저에서 한 번 기록한다 (페이지는 캐시되므로) */}
      <ViewCounter articleId={article.id} />
      <LabArticleLayout article={article} />
    </>
  )
}
