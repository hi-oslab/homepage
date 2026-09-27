import { requirePageUser } from '@/lib/admin-auth'
import { getMember } from '@/lib/cms'
import { AccountEditor } from './AccountEditor'

export const dynamic = 'force-dynamic'

export default async function AdminAccountPage() {
  const user = await requirePageUser()
  // 맨 위 요약에 프로필 이미지를 보여준다
  const member = user.member_id ? await getMember(user.member_id) : null
  return <AccountEditor user={user} profileImage={member?.cover_image_url ?? null} />
}
