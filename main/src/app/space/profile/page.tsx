import { requirePageUser } from '@/lib/admin-auth'
import { getAdminMembers, getMember, getRoles } from '@/lib/cms'
import { ProfileEditor } from './ProfileEditor'

export const dynamic = 'force-dynamic'

export default async function AdminProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requirePageUser()
  const [member, members, roleList] = await Promise.all([
    user.member_id ? getMember(user.member_id) : null,
    getAdminMembers(),
    getRoles(),
  ])
  // 첫 방문으로 온 이 화면에서는 안내를 계속 보여준다 (만들기 · 저장으로 onboarded_at이 채워진 뒤에도)
  const welcome = (await searchParams).welcome === '1'

  // 역할은 운영자가 관리하는 목록, 분야는 다른 프로필에서 쓰인 값을 추천
  const roles = roleList.map((role) => role.name)
  const fields = Array.from(new Set(members.flatMap((item) => item.fields)))

  return (
    <ProfileEditor
      key={member?.id ?? 'empty'}
      member={member}
      roles={roles}
      fieldSuggestions={fields}
      welcome={welcome}
      userName={user.name}
    />
  )
}
