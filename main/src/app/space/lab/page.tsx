import { requirePageUser } from '@/lib/admin-auth'
import { getAllLabArticles, getLabIssues, getLabSettings, toCards } from '@/lib/lab'
import { getAdminUsers } from '@/lib/cms'
import { canEditLabArticle } from '@/lib/lab-types'
import { LabManager } from './LabManager'

export const dynamic = 'force-dynamic'

/** Lab Space (멤버 공간): 주차 표 + 편집 가능한 글 표 */
export default async function SpaceLabPage() {
  const user = await requirePageUser()
  const issues = await getLabIssues()

  // 표가 아직 없으면(마이그레이션 전)
  if (!issues) {
    return (
      <p className='rounded-block bg-surface p-4 text-sm text-mute'>
        Lab Space를 쓰려면 DB 마이그레이션(supabase/migrations/20261009_lab_space.sql)이 필요해요.
      </p>
    )
  }

  const [articles, lab, users] = await Promise.all([getAllLabArticles(), getLabSettings(), getAdminUsers()])
  // 멤버는 본인 또는 공동 편집 가능한 글을 보고, 운영자는 관리 목적으로 모든 글을 본다.
  const visible = user.is_master ? articles : articles.filter((article) => canEditLabArticle(article, user.id))

  return (
    <LabManager
      issues={issues}
      articles={await toCards(visible, issues)}
      userId={user.id}
      isLead={user.is_master}
      settings={lab.settings}
      settingsReady={lab.ready}
      editors={users.filter((account) => account.status === 'approved').map(({ id, name }) => ({ id, name }))}
    />
  )
}
