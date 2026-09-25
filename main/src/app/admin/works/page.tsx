import { requirePageUser } from '@/lib/admin-auth'
import { getAdminUsers, getAdminWorks } from '@/lib/cms'
import { WorksList } from './WorksList'

export const dynamic = 'force-dynamic'

export default async function AdminWorksPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requirePageUser()
  const { status } = await searchParams
  const initialStatus = status === 'draft' || status === 'published' ? status : 'all'

  // 마스터는 전체 작품 + 작성자 이름, 멤버는 본인 작품만
  const [works, users] = await Promise.all([
    getAdminWorks('display_order', user.is_master ? undefined : user.id),
    user.is_master ? getAdminUsers() : Promise.resolve([]),
  ])
  const authors = Object.fromEntries(users.map((item) => [item.id, item.name]))

  return <WorksList initialWorks={works} initialStatus={initialStatus} isMaster={user.is_master} authors={authors} />
}
