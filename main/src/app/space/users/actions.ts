'use server'

import { revalidatePath } from 'next/cache'
import { createResetToken, requireMaster } from '@/lib/admin-auth'
import { getAdminUsers, removeAdminUser, resolveHelpRequest, updateAdminUser } from '@/lib/cms'
import type { AdminUser, AdminUserStatus, MemberAffiliation } from '@/types/cms'

type Result = { ok: true; user?: AdminUser } | { ok: false; message: string }

// 프로덕션에서는 throw한 메시지가 가려지므로 결과 객체로 돌려준다
async function run(task: (masterId: string) => Promise<Result>): Promise<Result> {
  try {
    const master = await requireMaster()
    const result = await task(master.id)
    revalidatePath('/space', 'layout')
    return result
  } catch (error) {
    console.error(error)
    return { ok: false, message: '처리하지 못했습니다. 권한을 확인해 주세요.' }
  }
}

export async function setUserStatusAction(id: string, status: AdminUserStatus) {
  return run(async (masterId) => {
    if (id === masterId) return { ok: false, message: '본인 계정의 승인 상태는 바꿀 수 없습니다.' }
    const user = await updateAdminUser(id, {
      status,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
      // 승인이 취소되면 관리자 권한도 함께 해제
      ...(status !== 'approved' ? { is_master: false } : {}),
      // 승인/거절로 처리되면 관리자 신청 표시는 지운다 (승인 취소로 대기로 돌릴 때는 유지)
      ...(status !== 'pending' ? { master_requested: false } : {}),
    })
    return { ok: true, user }
  })
}

/** 관리자 권한을 신청한 가입자를 관리자로 바로 승인 */
export async function approveAsMasterAction(id: string) {
  return run(async () => {
    const user = await updateAdminUser(id, {
      status: 'approved',
      approved_at: new Date().toISOString(),
      is_master: true,
      master_requested: false,
    })
    return { ok: true, user }
  })
}

export async function setUserMasterAction(id: string, isMaster: boolean) {
  return run(async () => {
    if (!isMaster) {
      const masters = (await getAdminUsers()).filter((user) => user.is_master)
      if (masters.length <= 1) return { ok: false, message: '운영자는 최소 한 명 있어야 합니다.' }
    }
    const user = await updateAdminUser(
      id,
      isMaster
        ? { is_master: true, master_requested: false, status: 'approved', approved_at: new Date().toISOString() }
        : { is_master: false, master_requested: false },
    )
    return { ok: true, user }
  })
}

/** 소속 변경 (학교 소모임 ↔ 외부 활동) */
export async function setUserAffiliationAction(id: string, affiliation: MemberAffiliation) {
  return run(async () => {
    if (affiliation !== 'club' && affiliation !== 'external') return { ok: false, message: '올바른 소속이 아닙니다.' }
    const user = await updateAdminUser(id, { affiliation, ...(affiliation === 'club' ? { is_hongik: true } : {}) })
    return { ok: true, user }
  })
}

export async function deleteUserAction(id: string) {
  return run(async (masterId) => {
    if (id === masterId) return { ok: false, message: '본인 계정은 삭제할 수 없습니다.' }
    await removeAdminUser(id)
    // 연결된 프로필도 함께 지워지므로 공개 Members 페이지도 갱신
    revalidatePath('/members')
    return { ok: true }
  })
}

/** 선택한 계정을 한 번에 삭제. 본인 계정은 빼고, 운영자가 한 명도 남지 않게 되면 막는다 */
export async function deleteUsersAction(ids: string[]): Promise<{ ok: true; deleted: string[] } | { ok: false; message: string }> {
  try {
    const master = await requireMaster()
    const targets = ids.filter((id) => id !== master.id)
    const users = await getAdminUsers()
    const remainingMasters = users.filter((user) => user.is_master && !targets.includes(user.id))
    if (remainingMasters.length === 0) return { ok: false, message: '운영자는 최소 한 명 있어야 합니다.' }
    const deleted: string[] = []
    for (const id of targets) {
      if (!users.some((user) => user.id === id)) continue
      await removeAdminUser(id)
      deleted.push(id)
    }
    revalidatePath('/space', 'layout')
    revalidatePath('/members')
    return { ok: true, deleted }
  } catch (error) {
    console.error(error)
    return { ok: false, message: '삭제하지 못했습니다. 권한을 확인해 주세요.' }
  }
}

/** 1회용 비밀번호 재설정 링크 발급 (24시간 유효). 경로만 돌려주고 도메인은 화면에서 붙인다 */
export async function createResetLinkAction(
  id: string,
): Promise<{ ok: true; path: string; expiresAt: string } | { ok: false; message: string }> {
  try {
    const master = await requireMaster()
    const { token, expiresAt } = await createResetToken(id, master.id)
    return { ok: true, path: `/reset-password/${token}`, expiresAt }
  } catch (error) {
    console.error(error)
    return { ok: false, message: '링크를 만들지 못했습니다.' }
  }
}

export async function resolveHelpRequestAction(id: string) {
  return run(async (masterId) => {
    await resolveHelpRequest(id, masterId)
    return { ok: true }
  })
}
