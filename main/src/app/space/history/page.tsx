import { requirePageUser } from '@/lib/admin-auth'
import { getAdminHistory } from '@/lib/cms'
import { HistoryEditor } from './HistoryEditor'

export const dynamic = 'force-dynamic'

export default async function AdminHistoryPage() {
  await requirePageUser({ master: true })
  const items = await getAdminHistory().catch(() => null)

  if (!items) {
    return (
      <div className='rounded-xl bg-surface p-8 text-sm leading-relaxed'>
        연혁 테이블이 아직 없습니다. <code className='rounded bg-field px-1.5 py-0.5'>supabase/migrations/20260929_history.sql</code>을
        Supabase SQL Editor에서 실행해 주세요.
      </div>
    )
  }
  return <HistoryEditor initialItems={items} />
}
