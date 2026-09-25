import { notFound, redirect } from 'next/navigation'
import { canEditWork, requirePageUser } from '@/lib/admin-auth'
import { getAdminWork, getAdminWorks } from '@/lib/cms'
import { WorkEditor } from './WorkEditor'

export const dynamic = 'force-dynamic'

export default async function AdminWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser()
  const [work, works] = await Promise.all([getAdminWork((await params).id), getAdminWorks()])
  if (!work) notFound()
  if (!canEditWork(user, work)) redirect('/admin/works')

  // 다른 작품에서 쓰인 카테고리/태그를 추천값으로 제공
  const categories = Array.from(new Set(works.map((item) => item.category).filter(Boolean)))
  const tags = Array.from(new Set(works.flatMap((item) => item.tags)))

  return <WorkEditor initialWork={work} categories={categories} tags={tags} />
}
