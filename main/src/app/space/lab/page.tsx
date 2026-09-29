import { requirePageUser } from '@/lib/admin-auth'
import { getAllLabArticles, getLabIssues, getLabSettings, toCards } from '@/lib/lab'
import { LabManager } from './LabManager'

export const dynamic = 'force-dynamic'

/** Lab Space (멤버 공간): 주차 표 + 글 표. 편집은 본인 글만, 주차 · 추천 관리는 리드 멤버(운영자) */
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

  const [articles, lab] = await Promise.all([getAllLabArticles(), getLabSettings()])
  // 멤버: 직접 작성한 글만 (다른 사람 글은 공개 페이지에서) / 운영자: 모든 글
  const visible = user.is_master ? articles : articles.filter((article) => article.author_id === user.id)

  return (
    <LabManager
      issues={issues}
      articles={await toCards(visible, issues)}
      userId={user.id}
      isLead={user.is_master}
      settings={lab.settings}
      settingsReady={lab.ready}
    />
  )
}
