import { requirePageUser } from '@/lib/admin-auth'
import { getAdminUsers, getAdminWorks } from '@/lib/cms'
import { WorksList } from './WorksList'

export const dynamic = 'force-dynamic'

export default async function AdminWorksPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requirePageUser()
  const { status } = await searchParams
  const initialStatus = status === 'draft' || status === 'published' ? status : 'all'

  // 모든 멤버가 전체 작품을 본다 (수정 가능, 삭제는 본인 작품 / 마스터만)
  const [works, users] = await Promise.all([getAdminWorks('display_order'), getAdminUsers()])
  const authors = Object.fromEntries(users.map((item) => [item.id, item.name]))

  return (
    <WorksList
      initialWorks={works}
      initialStatus={initialStatus}
      isMaster={user.is_master}
      currentUserId={user.id}
      authors={authors}
    />
  )
}
