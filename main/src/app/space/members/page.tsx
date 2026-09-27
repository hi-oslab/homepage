import { redirect } from 'next/navigation'

// 프로필 관리는 멤버 관리(/space/users) 안으로 합쳤다
export default function AdminMembersPage() {
  redirect('/space/users')
}
