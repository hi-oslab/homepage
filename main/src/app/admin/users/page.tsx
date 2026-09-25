import { requirePageUser } from '@/lib/admin-auth'
import { getAdminMembers, getAdminUsers, getHelpRequests } from '@/lib/cms'
import { UsersManager } from './UsersManager'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const me = await requirePageUser({ master: true })
  const [users, members, requests] = await Promise.all([getAdminUsers(), getAdminMembers(), getHelpRequests('open')])

  return (
    <UsersManager
      initialUsers={users}
      initialRequests={requests}
      members={members.map(({ id, name, cover_image_url }) => ({ id, name, cover_image_url }))}
      currentUserId={me.id}
    />
  )
}
