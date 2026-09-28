'use server'

import { revalidatePath } from 'next/cache'
import { requireMaster, requireUser } from '@/lib/admin-auth'
import {
  createMember,
  createRole,
  getMember,
  getRoles,
  removeMember,
  removeRole,
  renameRole,
  updateAdminUser,
  updateMember,
} from '@/lib/cms'
import type { Member, MemberRole } from '@/types/cms'

type MemberInput = Partial<Omit<Member, 'id' | 'created_at' | 'updated_at' | 'display_order'>>

// 멤버 정보가 노출되는 공개 페이지들
function revalidateMemberPages() {
  revalidatePath('/members')
  revalidatePath('/')
  revalidatePath('/space', 'layout')
}

/* ─── 운영자: 조회 · 공개 여부 · 삭제 (내용은 각자 '내 프로필'에서) ─── */

export async function setMemberPublishedAction(id: string, published: boolean) {
  await requireMaster()
  const member = await updateMember(id, { published })
  revalidateMemberPages()
  return member
}

/** 역할은 운영자도 바꿀 수 있다 (목록에 있는 역할 또는 비우기) */
export async function setMemberRoleAction(id: string, role: string) {
  await requireMaster()
  if (role !== '' && !(await getRoles()).some((item) => item.name === role)) throw new Error('목록에 없는 역할입니다.')
  const member = await updateMember(id, { role })
  revalidateMemberPages()
  return member
}

/** 연결된 멤버의 member_id는 DB에서 자동으로 비워지고, 멤버는 '내 프로필'에서 다시 만들 수 있다 */
export async function deleteMemberAction(id: string) {
  await requireMaster()
  await removeMember(id)
  revalidateMemberPages()
}

/* ─── 본인: 내 프로필 ─────────────────────────────────────────────────── */

/** 내 계정에 연결된 멤버 프로필이 없으면 새로 만든다 (처음엔 비공개). 있으면 그 프로필 */
export async function createMyProfileAction(): Promise<Member> {
  const user = await requireUser()
  if (user.member_id) {
    const existing = await getMember(user.member_id)
    if (existing) return existing
  }
  const member = await createMember({ name: user.name, published: false })
  await updateAdminUser(user.id, { member_id: member.id })
  revalidateMemberPages()
  return member
}

/** 역할은 운영자가 관리하는 목록 중에서만 (지금 쓰고 있는 역할은 목록에서 빠졌어도 그대로 둘 수 있다) */
async function assertRole(memberId: string, role: string | undefined) {
  if (role === undefined || role === '') return
  const [roles, current] = await Promise.all([getRoles(), getMember(memberId)])
  if (!roles.some((item) => item.name === role) && role !== current?.role) throw new Error('목록에 없는 역할입니다.')
}

export async function updateMyProfileAction(input: MemberInput) {
  const user = await requireUser()
  if (!user.member_id) throw new Error('연결된 프로필이 없습니다.')
  await assertRole(user.member_id, input.role)
  const member = await updateMember(user.member_id, input)
  revalidateMemberPages()
  return member
}

/**
 * 첫 로그인 프로필 설정 '완료하기': 프로필카드를 저장하고 첫 방문을 끝낸다 (다음부터는 창이 뜨지 않는다).
 * 프로필카드가 아직 없으면 여기서 만든다.
 */
export async function completeOnboardingAction(input: MemberInput): Promise<Member> {
  const user = await requireUser()
  if (!input.name?.trim()) throw new Error('이름을 입력해 주세요.')
  // 연결된 프로필이 없거나(지워진 경우 포함) 없으면 여기서 만든다
  const existing = user.member_id ? await getMember(user.member_id) : null
  const memberId = existing?.id ?? (await createMember({ name: user.name, published: false })).id
  await assertRole(memberId, input.role)
  const member = await updateMember(memberId, { ...input, name: input.name.trim() })
  await updateAdminUser(user.id, { member_id: memberId, onboarded_at: new Date().toISOString() })
  revalidateMemberPages()
  return member
}

/* ─── 운영자: 역할 목록 ───────────────────────────────────────────────── */

type RoleResult = { ok: true; role?: MemberRole } | { ok: false; message: string }

const roleName = (name: string) => name.trim().replace(/\s+/g, ' ').slice(0, 40)

async function runRole(task: () => Promise<RoleResult>): Promise<RoleResult> {
  try {
    await requireMaster()
    const result = await task()
    if (result.ok) revalidateMemberPages()
    return result
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code === '23505') return { ok: false, message: '이미 있는 역할입니다.' }
    return { ok: false, message: '처리하지 못했습니다. 권한을 확인해 주세요.' }
  }
}

export async function createRoleAction(name: string) {
  return runRole(async () => {
    const value = roleName(name)
    if (!value) return { ok: false, message: '역할 이름을 입력해 주세요.' }
    return { ok: true, role: await createRole(value) }
  })
}

/** 이름을 바꾸면 이 역할을 쓰던 프로필도 함께 바뀐다 */
export async function renameRoleAction(id: string, name: string) {
  return runRole(async () => {
    const value = roleName(name)
    if (!value) return { ok: false, message: '역할 이름을 입력해 주세요.' }
    return { ok: true, role: await renameRole(id, value) }
  })
}

/** 지우면 이 역할을 쓰던 프로필의 역할은 비워진다 */
export async function deleteRoleAction(id: string) {
  return runRole(async () => {
    await removeRole(id)
    return { ok: true }
  })
}
