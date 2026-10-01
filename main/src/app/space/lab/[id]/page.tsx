import { notFound, redirect } from 'next/navigation'
import { requirePageUser } from '@/lib/admin-auth'
import { getAdminUsers, getMember } from '@/lib/cms'
import { getLabArticle, getLabIssues } from '@/lib/lab'
import { canEditLabArticle } from '@/lib/lab-types'
import { ArticleEditor } from './ArticleEditor'

export const dynamic = 'force-dynamic'

/** Lab Space 글 편집: 작성자가 정한 공동 편집 권한을 확인한다. */
export default async function LabArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser()
  const [article, issues] = await Promise.all([getLabArticle((await params).id), getLabIssues()])
  if (!article || !issues) notFound()
  if (!canEditLabArticle(article, user.id)) redirect('/space/lab')
  const users = await getAdminUsers()
  const owner = users.find((account) => account.id === article.author_id)
  const profile = owner?.member_id ? await getMember(owner.member_id) : null

  return (
    <ArticleEditor
      initialArticle={article}
      issues={issues}
      author={{ name: owner?.name ?? '탈퇴한 멤버', image: profile?.cover_image_url ?? null }}
      viewerId={user.id}
      editors={users.filter((account) => account.status === 'approved').map(({ id, name }) => ({ id, name }))}
    />
  )
}
