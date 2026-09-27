import { requirePageUser } from '@/lib/admin-auth'
import { MediaManager } from './MediaManager'

export const dynamic = 'force-dynamic'

export default async function AdminMediaPage() {
  await requirePageUser({ master: true })
  return <MediaManager />
}

