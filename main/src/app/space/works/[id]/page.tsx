import { notFound, redirect } from 'next/navigation'
import { canDeleteWork, canEditWork, requirePageUser } from '@/lib/admin-auth'
import { getAdminWork, getAdminWorks } from '@/lib/cms'
import { WorkEditor } from './WorkEditor'

export const dynamic = 'force-dynamic'

const DEFAULT_CATEGORIES = ['스터디・세션']

export default async function AdminWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser()
  const [work, works] = await Promise.all([getAdminWork((await params).id), getAdminWorks()])
  if (!work) notFound()
  if (!canEditWork(user, work)) redirect('/space/works')

  // 다른 작품에서 쓰인 카테고리/태그를 추천값으로 제공
  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...works.map((item) => item.category).filter(Boolean)]))
  const tags = Array.from(new Set(works.flatMap((item) => item.tags)))

  return <WorkEditor initialWork={work} categories={categories} tags={tags} canDelete={canDeleteWork(user, work)} />
}
