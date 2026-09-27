'use server'

import { revalidatePath } from 'next/cache'
import { requireMaster, requireUser } from '@/lib/admin-auth'
import {
  createMember,
  getMember,
  getUnassignedMembers,
  removeMember,
  reorderMembers,
  updateAdminUser,
  updateMember,
} from '@/lib/cms'
import type { Member } from '@/types/cms'

type MemberInput = Partial<Omit<Member, 'id' | 'created_at' | 'updated_at' | 'display_order'>>

// 멤버 정보가 노출되는 공개 페이지들
function revalidateMemberPages() {
  revalidatePath('/members')
  revalidatePath('/')
  revalidatePath('/admin', 'layout')
}

/* ─── 마스터: 전체 멤버 관리 ───────────────────────────────────────────── */

export async function createMemberAction() {
  await requireMaster()
  const member = await createMember()
  revalidateMemberPages()
  return member
}

export async function updateMemberAction(id: string, input: MemberInput) {
  await requireMaster()
  const member = await updateMember(id, input)
  revalidateMemberPages()
  return member
}

export async function reorderMembersAction(ids: string[]) {
  await requireMaster()
  await reorderMembers(ids)
  revalidateMemberPages()
}

export async function deleteMemberAction(id: string) {
  await requireMaster()
  await removeMember(id)
  revalidateMemberPages()
}

/* ─── 본인: 내 프로필 ─────────────────────────────────────────────────── */

type Result = { ok: true } | { ok: false; message: string }

/** 내 계정에 연결된 멤버 프로필이 없으면 새로 만든다 (처음엔 비공개) */
export async function createMyProfileAction() {
  const user = await requireUser()
  if (user.member_id) return
  const member = await createMember({ name: user.name, published: false })
  await updateAdminUser(user.id, { member_id: member.id, onboarded_at: new Date().toISOString() })
  revalidateMemberPages()
}

/** 이미 등록된(아직 아무 계정에도 연결되지 않은) 멤버 프로필을 내 것으로 연결 */
export async function claimMemberProfileAction(memberId: string): Promise<Result> {
  const user = await requireUser()
  if (user.member_id) return { ok: false, message: '이미 연결된 프로필이 있습니다.' }
  const [member, unassigned] = await Promise.all([getMember(memberId), getUnassignedMembers()])
  if (!member) return { ok: false, message: '프로필을 찾을 수 없습니다.' }
  if (!unassigned.some((item) => item.id === memberId))
    return { ok: false, message: '이미 다른 계정에 연결된 프로필입니다.' }
  try {
    await updateAdminUser(user.id, { member_id: memberId, onboarded_at: new Date().toISOString() })
  } catch {
    // 동시에 다른 사람이 연결한 경우 (member_id unique)
    return { ok: false, message: '이미 다른 계정에 연결된 프로필입니다.' }
  }
  revalidateMemberPages()
  return { ok: true }
}

/** 첫 로그인 안내를 건너뛴다 (나중에 내 프로필에서 다시 할 수 있음) */
export async function skipProfileSetupAction() {
  const user = await requireUser()
  if (!user.onboarded_at) await updateAdminUser(user.id, { onboarded_at: new Date().toISOString() })
  revalidatePath('/admin', 'layout')
}

export async function updateMyProfileAction(input: MemberInput) {
  const user = await requireUser()
  if (!user.member_id) throw new Error('연결된 프로필이 없습니다.')
  const member = await updateMember(user.member_id, input)
  revalidateMemberPages()
  return member
}
