import { requirePageUser } from '@/lib/admin-auth'
import { getAdminMembers } from '@/lib/cms'
import { MembersEditor } from './MembersEditor'

export const dynamic = 'force-dynamic'

export default async function AdminMembersPage() {
  await requirePageUser({ master: true })
  return <MembersEditor initialMembers={await getAdminMembers()} />
}
