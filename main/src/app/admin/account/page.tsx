import { requirePageUser } from '@/lib/admin-auth'
import { AccountEditor } from './AccountEditor'

export const dynamic = 'force-dynamic'

export default async function AdminAccountPage() {
  const user = await requirePageUser()
  return <AccountEditor user={user} />
}
