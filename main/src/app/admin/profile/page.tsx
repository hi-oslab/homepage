import { requirePageUser } from '@/lib/admin-auth'
import { getAdminMembers, getMember } from '@/lib/cms'
import { ProfileEditor } from './ProfileEditor'

export const dynamic = 'force-dynamic'

export default async function AdminProfilePage() {
  const user = await requirePageUser()
  const [member, members] = await Promise.all([user.member_id ? getMember(user.member_id) : null, getAdminMembers()])

  // 추천값(역할/분야)만 전달한다
  const roles = Array.from(new Set(members.map((item) => item.role).filter(Boolean)))
  const fields = Array.from(new Set(members.flatMap((item) => item.fields)))

  return <ProfileEditor key={member?.id ?? 'empty'} member={member} roles={roles} fieldSuggestions={fields} />
}
