import { notFound, redirect } from 'next/navigation'
import { requirePageUser } from '@/lib/admin-auth'
import { getMember } from '@/lib/cms'
import { getLabArticle, getLabIssues } from '@/lib/lab'
import { ArticleEditor } from './ArticleEditor'

export const dynamic = 'force-dynamic'

/** Lab Space 글 편집: 작성자 본인만 (다른 사람 글은 운영자라도 열 수 없다) */
export default async function LabArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser()
  const [article, issues] = await Promise.all([getLabArticle((await params).id), getLabIssues()])
  if (!article || !issues) notFound()
  if (article.author_id !== user.id) redirect('/space/lab')
  const profile = user.member_id ? await getMember(user.member_id) : null

  return (
    <ArticleEditor
      initialArticle={article}
      issues={issues}
      author={{ name: user.name, image: profile?.cover_image_url ?? null }}
    />
  )
}
