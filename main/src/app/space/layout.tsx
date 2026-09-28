import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthSetupError, getCurrentUser, hasMaster, isApproved } from '@/lib/admin-auth'
import { MentionProvider, type MentionMember } from '@/components/mentions/MentionProvider'
import { getAdminMembers, getAdminUsers, getHelpRequests, getRoles } from '@/lib/cms'
import { AdminNotice } from './AdminAuth'
import { AdminShell } from './AdminShell'
import { OnboardingModal } from './home/OnboardingModal'
import { ONBOARDING_MARKER } from './home/PopIn'
import { NAV_COLLAPSED_COOKIE, SPACE_THEMES, THEME_COOKIE, type SpaceTheme } from './nav'
import { NotificationCenter } from './NotificationCenter'
import { getNotifications } from '@/lib/notifications'

export const metadata: Metadata = {
  title: 'Member Space',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user, masterExists
  try {
    ;[user, masterExists] = await Promise.all([getCurrentUser(), hasMaster()])
  } catch (error) {
    if (error instanceof AuthSetupError) return <AdminNotice kind='migration' />
    throw error
  }

  // 로그인 안 했으면 로그인 대문으로 (마스터가 아직 없으면 첫 마스터 만들기)
  if (!user) redirect(masterExists ? '/login' : '/join')
  if (!isApproved(user))
    return <AdminNotice kind={user.status === 'rejected' ? 'rejected' : 'pending'} name={user.name} />

  const [accounts, profiles, openRequests, notifications, cookieStore, roleList] = await Promise.all([
    getAdminUsers(),
    getAdminMembers(),
    user.is_master ? getHelpRequests('open') : [],
    // 오른쪽 아래 알림 (멤버 공간 모든 화면)
    getNotifications(user),
    cookies(),
    getRoles(),
  ])
  // 마스터에게는 승인 대기 + 미처리 문의 수를 메뉴 배지로 보여준다
  const pendingCount = user.is_master
    ? accounts.filter((item) => item.status === 'pending').length + openRequests.length
    : 0
  // '@' 멘션 후보: 승인된 멤버. 전화번호 같은 개인정보는 빼고 이름 · 아이디 · 사진 · 프로필카드만 넘긴다
  const profileById = new Map(profiles.map((item) => [item.id, item]))
  const mentionMembers: MentionMember[] = accounts
    .filter((account) => account.status === 'approved')
    .map((account) => {
      const profile = (account.member_id && profileById.get(account.member_id)) || null
      return {
        id: account.id,
        name: account.name,
        username: account.username,
        image: profile?.cover_image_url ?? null,
        profile,
      }
    })

  // 프로필카드가 없거나(운영자가 지운 경우 포함) 첫 방문을 안 끝냈으면 어느 화면이든 프로필 설정 창을 띄운다
  const myProfile = (user.member_id && profileById.get(user.member_id)) || null
  const needsOnboarding = !user.onboarded_at || !myProfile

  const savedTheme = cookieStore.get(THEME_COOKIE)?.value as SpaceTheme | undefined
  const theme: SpaceTheme = savedTheme && SPACE_THEMES.includes(savedTheme) ? savedTheme : 'light'
  return (
    <AdminShell
      navCollapsed={cookieStore.get(NAV_COLLAPSED_COOKIE)?.value === '1'}
      theme={theme}
      user={{
        name: user.name,
        username: user.username,
        isMaster: user.is_master,
        hasProfile: Boolean(user.member_id),
        pendingCount,
      }}
    >
      {/* 첫 화면에서 헤더(멤버 공간 바깥)까지 바로 같은 테마로: 하이드레이션 전에 <html>에 붙인다.
          화면 이동 뒤에는 AdminShell의 useSpaceTheme가 붙이고 뗀다 */}
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.dataset.theme=${JSON.stringify(theme)}` }} />
      <MentionProvider members={mentionMembers}>
        {children}
        <NotificationCenter items={notifications} userId={user.id} />
        {/* 홈 섹션 등장 모션(PopIn)이 창이 끝날 때까지 기다리게 하는 표시 */}
        {needsOnboarding && <span hidden {...{ [ONBOARDING_MARKER]: '' }} />}
        {needsOnboarding && (
          <OnboardingModal
            member={myProfile}
            roles={roleList.map((role) => role.name)}
            // 분야는 다른 프로필에서 쓰인 값을 추천
            fieldSuggestions={Array.from(new Set(profiles.flatMap((item) => item.fields)))}
            userName={user.name}
          />
        )}
      </MentionProvider>
    </AdminShell>
  )
}
