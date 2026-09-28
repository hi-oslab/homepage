// 홈 섹션들이 쓰는 데이터 (서버 전용)
// 섹션마다 필요한 걸 직접 불러오고, 같은 요청 안에서 겹치는 조회는 cache로 한 번만 한다.
// 그래서 page.tsx에서 섹션을 빼거나 옮겨도 데이터 쪽은 고칠 게 없다.

import { cache } from 'react'
import { requireUser } from '@/lib/admin-auth'
import { getAdminMembers, getAdminUsers, getAdminWorks, getMember } from '@/lib/cms'
import { getCommunityFeed } from '@/lib/community'
import { getSuggestions } from '@/lib/suggestions'
import type { Viewer } from '../board/shared'

/** 로그인한 승인된 멤버 (홈 page.tsx가 먼저 확인하므로 섹션에서는 항상 있다) */
export const getHomeUser = cache(() => requireUser())

export const getHomeViewer = cache(async (): Promise<Viewer> => {
  const user = await getHomeUser()
  return { id: user.id, isMaster: user.is_master }
})

/** 프로젝트 (최근 수정순) */
export const getHomeWorks = cache(() => getAdminWorks('updated_at'))

/** 계정 목록 (승인 · 대기 모두) */
export const getHomeAccounts = cache(() => getAdminUsers())

/** 프로필카드 목록 */
export const getHomeProfiles = cache(() => getAdminMembers())

/** 내 프로필카드 (없으면 null) */
export const getMyProfile = cache(async () => {
  const user = await getHomeUser()
  return user.member_id ? getMember(user.member_id) : null
})

export const getHomeFeed = cache(async () => getCommunityFeed((await getHomeUser()).id))

export const getHomeSuggestions = cache(() => getSuggestions())
