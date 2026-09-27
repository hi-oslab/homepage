import { requirePageUser } from '@/lib/admin-auth'
import { getAdminMembers, getMember, getUnassignedMembers } from '@/lib/cms'
import { ProfileEditor } from './ProfileEditor'

export const dynamic = 'force-dynamic'

export default async function AdminProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requirePageUser()
  const [member, members, unassigned] = await Promise.all([
    user.member_id ? getMember(user.member_id) : null,
    getAdminMembers(),
    user.member_id ? Promise.resolve([]) : getUnassignedMembers(),
  ])
  const welcome = (await searchParams).welcome === '1' && !user.onboarded_at

  // 추천값(역할/분야)만 전달한다
  const roles = Array.from(new Set(members.map((item) => item.role).filter(Boolean)))
  const fields = Array.from(new Set(members.flatMap((item) => item.fields)))

  return (
    <ProfileEditor
      key={member?.id ?? 'empty'}
      member={member}
      roles={roles}
      fieldSuggestions={fields}
      welcome={welcome}
      userName={user.name}
      // 선택 후보: 이름·사진 등 공개 정보만
      unassigned={unassigned.map(({ id, name, sub_name, role, cover_image_url, published }) => ({
        id,
        name,
        sub_name,
        role,
        cover_image_url,
        published,
      }))}
    />
  )
}
