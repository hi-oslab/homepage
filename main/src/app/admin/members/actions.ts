'use server'

import { revalidatePath } from 'next/cache'
import { requireMaster, requireUser } from '@/lib/admin-auth'
import { createMember, removeMember, reorderMembers, updateAdminUser, updateMember } from '@/lib/cms'
import type { Member } from '@/types/cms'

type MemberInput = Partial<Omit<Member, 'id' | 'created_at' | 'updated_at' | 'display_order'>>

// 멤버 정보가 노출되는 공개 페이지들
function revalidateMemberPages() {
  revalidatePath('/members')
  revalidatePath('/about')
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

/** 내 계정에 연결된 멤버 프로필이 없으면 새로 만든다 (처음엔 비공개) */
export async function createMyProfileAction() {
  const user = await requireUser()
  if (user.member_id) return
  const member = await createMember({ name: user.name, published: false })
  await updateAdminUser(user.id, { member_id: member.id })
  revalidateMemberPages()
}

export async function updateMyProfileAction(input: MemberInput) {
  const user = await requireUser()
  if (!user.member_id) throw new Error('연결된 프로필이 없습니다.')
  const member = await updateMember(user.member_id, input)
  revalidateMemberPages()
  return member
}
