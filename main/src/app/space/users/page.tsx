import { requirePageUser } from '@/lib/admin-auth'
import { getAdminMembers, getAdminUsers, getHelpRequests, getRoles } from '@/lib/cms'
import { UsersManager } from './UsersManager'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const me = await requirePageUser({ master: true })
  const [users, members, requests, roles] = await Promise.all([
    getAdminUsers(),
    getAdminMembers(),
    getHelpRequests('open'),
    getRoles(),
  ])

  return (
    <UsersManager
      initialUsers={users}
      initialRequests={requests}
      initialMembers={members}
      initialRoles={roles}
      currentUserId={me.id}
    />
  )
}
