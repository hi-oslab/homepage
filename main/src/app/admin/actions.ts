'use server'

import { timingSafeEqual } from 'crypto'
import { revalidatePath } from 'next/cache'
import {
  changeOwnPassword,
  clearSession,
  consumeResetToken,
  getCurrentUser,
  hasMaster,
  isUsernameAvailable,
  normalizeProfile,
  normalizeUsername,
  requireUser,
  signIn,
  signUp,
  usernameError,
  withdrawAccount,
} from '@/lib/admin-auth'
import { createHelpRequest, updateAdminUser } from '@/lib/cms'
import type { AccountProfileInput, HelpRequest } from '@/types/cms'

type Result = { ok: true } | { ok: false; message: string }
type SignUpInput = AccountProfileInput & { username: string; password: string; requestMaster?: boolean }

const refreshAdmin = () => revalidatePath('/admin', 'layout')

export async function signInAction(username: string, password: string): Promise<Result> {
  if (!(await signIn(username, password))) return { ok: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' }
  refreshAdmin()
  return { ok: true }
}

/** 가입 화면의 아이디 중복 확인 */
export async function checkUsernameAction(raw: string): Promise<{ available: boolean; message: string }> {
  const username = normalizeUsername(raw)
  const invalid = usernameError(username)
  if (invalid) return { available: false, message: invalid }
  const available = await isUsernameAvailable(username)
  return { available, message: available ? '사용할 수 있는 아이디입니다.' : '이미 사용 중인 아이디입니다.' }
}

export async function signUpAction(input: SignUpInput): Promise<Result> {
  const result = await signUp(input)
  if (result.ok) refreshAdmin()
  return result
}

/** 마스터가 아직 없을 때만, 기존 ADMIN_PASSWORD로 첫 마스터 계정을 만든다 */
export async function setupMasterAction(input: SignUpInput & { setupPassword: string }): Promise<Result> {
  if (await hasMaster()) return { ok: false, message: '이미 관리자 계정이 있습니다.' }
  const expected = process.env.ADMIN_PASSWORD ?? ''
  const actual = input.setupPassword
  const valid =
    expected.length > 0 &&
    expected.length === actual.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
  if (!valid) return { ok: false, message: '설정 비밀번호가 올바르지 않습니다.' }

  const result = await signUp(input, { master: true })
  if (result.ok) refreshAdmin()
  return result
}

export async function logout(): Promise<void> {
  await clearSession()
  refreshAdmin()
}

/** 로그인 없이 관리자에게 비밀번호 재설정 / 이메일 찾기를 요청 */
export async function helpRequestAction(
  input: Pick<HelpRequest, 'kind' | 'username' | 'name' | 'phone' | 'message'>,
): Promise<Result> {
  const clip = (value: string, max: number) => value.trim().slice(0, max)
  const request = {
    kind: input.kind === 'username' ? 'username' : 'password',
    username: clip(input.username, 40).toLowerCase(),
    name: clip(input.name, 50),
    phone: clip(input.phone, 30),
    message: clip(input.message, 500),
  } as const
  if (!request.name) return { ok: false, message: '실명을 입력해 주세요.' }
  if (!request.phone) return { ok: false, message: '가입할 때 쓴 전화번호를 입력해 주세요.' }
  if (request.kind === 'password' && !request.username) return { ok: false, message: '아이디를 입력해 주세요.' }
  try {
    await createHelpRequest(request)
    refreshAdmin()
    return { ok: true }
  } catch {
    return { ok: false, message: '요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.' }
  }
}

/** 재설정 링크로 새 비밀번호 설정 (링크는 1회용) */
export async function resetPasswordAction(token: string, password: string): Promise<Result> {
  const result = await consumeResetToken(token, password)
  if (result.ok) refreshAdmin()
  return result
}

/* ─── 내 계정 ─────────────────────────────────────────────────────────── */

export async function updateMyAccountAction(input: AccountProfileInput): Promise<Result> {
  const user = await requireUser()
  const profile = normalizeProfile(input)
  if (!profile.ok) return profile
  await updateAdminUser(user.id, profile.value)
  refreshAdmin()
  return { ok: true }
}

export async function changePasswordAction(currentPassword: string, nextPassword: string): Promise<Result> {
  const user = await requireUser()
  return changeOwnPassword(user.id, currentPassword, nextPassword)
}

// 승인 대기 중인 계정도 탈퇴할 수 있다
export async function withdrawAction(password: string): Promise<Result> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, message: '로그인이 필요합니다.' }
  const result = await withdrawAccount(user, password)
  if (result.ok) {
    refreshAdmin()
    revalidatePath('/members')
  }
  return result
}

/** 사이트 전체 캐시를 즉시 갱신 */
export async function revalidateAll(): Promise<{ ok: boolean }> {
  try {
    await requireUser()
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch {
    return { ok: false }
  }
}
