import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminSupabaseClient } from './supabase'
import type { AccountProfileInput, AdminUser, Work } from '@/types/cms'

const scrypt = promisify(scryptCallback) as (password: string, salt: string, keylen: number) => Promise<Buffer>

const COOKIE_NAME = 'osl_session'
const SESSION_DAYS = 14
const RESET_HOURS = 24
export const USER_COLUMNS =
  'id,username,name,status,is_master,master_requested,member_id,affiliation,onboarded_at,student_id,is_hongik,phone,joined_year,joined_half,approved_at,last_login_at,created_at,updated_at'

type Result = { ok: true } | { ok: false; message: string }

/* ─── 비밀번호 ─────────────────────────────────────────────────────────── */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = await scrypt(password, salt, 64)
  return `scrypt$${salt}$${hash.toString('hex')}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, salt, hash] = stored.split('$')
  if (algorithm !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'hex')
  const actual = await scrypt(password, salt, expected.length)
  return timingSafeEqual(actual, expected)
}

/** 아이디: 영문 소문자로 시작, 영문 소문자/숫자/_ 4~20자 (DB 제약과 동일) */
const USERNAME_PATTERN = /^[a-z][a-z0-9_]{3,19}$/
export const normalizeUsername = (username: string) => username.trim().toLowerCase()
export const usernameError = (username: string) =>
  USERNAME_PATTERN.test(username)
    ? null
    : '아이디는 영문 소문자로 시작하는 4~20자 (영문 소문자, 숫자, _)로 입력해 주세요.'

const passwordError = (password: string) => (password.length < 8 ? '비밀번호는 8자 이상이어야 합니다.' : null)

/* ─── 세션 (서명된 쿠키: userId.version.expires.signature) ────────────── */

function sessionKey(): string {
  const secret = process.env.AUTH_SECRET || process.env.SUPABASE_SECRET_KEY
  if (!secret) throw new Error('Missing AUTH_SECRET')
  return createHash('sha256').update(`osl-session:${secret}`).digest('hex')
}

function sign(value: string) {
  return createHmac('sha256', sessionKey()).update(value).digest('hex')
}

async function createSession(userId: string, version: number) {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  const payload = `${userId}.${version}.${expires}`
  ;(await cookies()).set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expires),
  })
}

async function readSession(): Promise<{ userId: string; version: number } | null> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value
  if (!raw) return null
  const [userId, version, expires, signature] = raw.split('.')
  if (!userId || !version || !expires || !signature || Number(expires) < Date.now()) return null
  const expected = Buffer.from(sign(`${userId}.${version}.${expires}`))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  return { userId, version: Number(version) }
}

export async function clearSession() {
  ;(await cookies()).delete(COOKIE_NAME)
}

/* ─── 셋업 확인 ────────────────────────────────────────────────────────── */

export class AuthSetupError extends Error {}

/** 테이블/컬럼이 아직 없으면(마이그레이션 미실행) AuthSetupError */
export function assertSchema(error: { code?: string; message?: string } | null) {
  if (!error) return
  const missing = ['42P01', 'PGRST205', '42703', 'PGRST204'].includes(error.code ?? '')
  if (missing) throw new AuthSetupError(error.message)
  throw error
}

/* ─── 현재 사용자 ─────────────────────────────────────────────────────── */

/** 요청당 한 번만 조회. 권한 변경이 즉시 반영되도록 매 요청 DB에서 읽는다 */
export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  const session = await readSession()
  if (!session) return null
  const { data, error } = await createAdminSupabaseClient()
    .from('admin_users')
    .select(`${USER_COLUMNS},session_version`)
    .eq('id', session.userId)
    .maybeSingle()
  assertSchema(error)
  // 비밀번호가 바뀐 뒤의 옛 세션은 무효
  if (!data || data.session_version !== session.version) return null
  const { session_version: _, ...user } = data
  return user as AdminUser
})

export const hasMaster = cache(async (): Promise<boolean> => {
  // head 요청은 테이블이 없을 때 에러 코드가 비어 오므로 일반 조회로 확인
  // 최신 마이그레이션에서 생긴 컬럼(username, session_version)까지 조회해 실행 여부를 함께 확인
  const { data, error } = await createAdminSupabaseClient()
    .from('admin_users')
    .select('id,username,session_version,master_requested,affiliation,onboarded_at')
    .eq('is_master', true)
    .limit(1)
  assertSchema(error)
  return (data ?? []).length > 0
})

/* ─── 가입 / 로그인 ───────────────────────────────────────────────────── */

/** 가입·내 정보 수정 공통 검증. 통과하면 정리된 값을 돌려준다 */
export function normalizeProfile(
  input: AccountProfileInput,
): { ok: true; value: AccountProfileInput } | { ok: false; message: string } {
  const name = input.name.trim()
  const phone = input.phone.replace(/[^\d]/g, '')
  const year = Number(input.joined_year)
  const thisYear = new Date().getFullYear()
  if (!name) return { ok: false, message: '실명을 입력해 주세요.' }
  if (input.affiliation !== 'club' && input.affiliation !== 'external')
    return { ok: false, message: '소속(학교 소모임 / 외부 활동)을 선택해 주세요.' }
  if (phone.length < 9 || phone.length > 11) return { ok: false, message: '전화번호를 확인해 주세요.' }
  if (!Number.isInteger(year) || year < 2018 || year > thisYear) {
    return { ok: false, message: `가입 연도는 2018년부터 ${thisYear}년 사이로 선택해 주세요.` }
  }
  if (input.joined_half !== 'H1' && input.joined_half !== 'H2')
    return { ok: false, message: '가입 시기(상반기/하반기)를 선택해 주세요.' }
  return {
    ok: true,
    value: {
      name,
      affiliation: input.affiliation,
      phone: phone.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3'),
      student_id: input.student_id.trim(),
      // 학교 소모임 멤버는 홍익대 학생
      is_hongik: input.affiliation === 'club' || Boolean(input.is_hongik),
      joined_year: year,
      joined_half: input.joined_half,
    },
  }
}

/** 아이디 중복 확인 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await createAdminSupabaseClient()
    .from('admin_users')
    .select('id')
    .eq('username', normalizeUsername(username))
    .limit(1)
  assertSchema(error)
  return (data ?? []).length === 0
}

export async function signIn(username: string, password: string): Promise<boolean> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('admin_users')
    .select('id,password_hash,session_version')
    .eq('username', normalizeUsername(username))
    .maybeSingle()
  assertSchema(error)
  if (!data || !(await verifyPassword(password, data.password_hash))) return false
  await supabase.from('admin_users').update({ last_login_at: new Date().toISOString() }).eq('id', data.id)
  await createSession(data.id, data.session_version)
  return true
}

export async function signUp(
  input: AccountProfileInput & { username: string; password: string; requestMaster?: boolean },
  options: { master?: boolean } = {},
): Promise<Result> {
  const username = normalizeUsername(input.username)
  const invalidUsername = usernameError(username)
  if (invalidUsername) return { ok: false, message: invalidUsername }
  const invalidPassword = passwordError(input.password)
  if (invalidPassword) return { ok: false, message: invalidPassword }
  const profile = normalizeProfile(input)
  if (!profile.ok) return profile

  const { data, error } = await createAdminSupabaseClient()
    .from('admin_users')
    .insert({
      ...profile.value,
      username,
      password_hash: await hashPassword(input.password),
      status: options.master ? 'approved' : 'pending',
      is_master: Boolean(options.master),
      master_requested: !options.master && Boolean(input.requestMaster),
      approved_at: options.master ? new Date().toISOString() : null,
    })
    .select('id,session_version')
    .single()
  if (error?.code === '23505') return { ok: false, message: '이미 사용 중인 아이디입니다.' }
  assertSchema(error)
  await createSession(data!.id, data!.session_version)
  return { ok: true }
}

/* ─── 비밀번호 변경 / 탈퇴 (본인) ─────────────────────────────────────── */

async function checkOwnPassword(userId: string, password: string) {
  const { data, error } = await createAdminSupabaseClient()
    .from('admin_users')
    .select('password_hash')
    .eq('id', userId)
    .single()
  assertSchema(error)
  return verifyPassword(password, data.password_hash)
}

/** 비밀번호를 바꾸고 세션 버전을 올린다 (다른 기기 로그인은 모두 끊김) */
async function setPassword(userId: string, password: string): Promise<number> {
  const supabase = createAdminSupabaseClient()
  const { data: current } = await supabase.from('admin_users').select('session_version').eq('id', userId).single()
  const version = (current?.session_version ?? 1) + 1
  const { error } = await supabase
    .from('admin_users')
    .update({ password_hash: await hashPassword(password), session_version: version })
    .eq('id', userId)
  assertSchema(error)
  return version
}

export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  nextPassword: string,
): Promise<Result> {
  if (!(await checkOwnPassword(userId, currentPassword)))
    return { ok: false, message: '현재 비밀번호가 올바르지 않습니다.' }
  const invalid = passwordError(nextPassword)
  if (invalid) return { ok: false, message: invalid }
  const version = await setPassword(userId, nextPassword)
  await createSession(userId, version) // 지금 기기는 로그인 유지
  return { ok: true }
}

/**
 * 탈퇴: 계정을 삭제한다.
 * - 작성한 작품은 남고 작성자만 비워진다 (이후 마스터만 편집 가능)
 * - 연결된 멤버 프로필은 삭제하지 않고 비공개로 돌린다 (마스터가 정리)
 */
export async function withdrawAccount(user: AdminUser, password: string): Promise<Result> {
  if (!(await checkOwnPassword(user.id, password))) return { ok: false, message: '비밀번호가 올바르지 않습니다.' }
  const supabase = createAdminSupabaseClient()
  if (user.is_master) {
    const { data } = await supabase.from('admin_users').select('id').eq('is_master', true)
    if ((data ?? []).length <= 1)
      return { ok: false, message: '마지막 관리자 계정은 탈퇴할 수 없습니다. 다른 사람에게 관리자 권한을 넘겨주세요.' }
  }
  if (user.member_id) await supabase.from('members').update({ published: false }).eq('id', user.member_id)
  const { error } = await supabase.from('admin_users').delete().eq('id', user.id)
  assertSchema(error)
  await clearSession()
  return { ok: true }
}

/* ─── 비밀번호 재설정 링크 (마스터 발급, 1회용) ───────────────────────── */

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

/** 새 링크를 만들면 그 사용자의 이전 링크는 모두 무효 */
export async function createResetToken(
  userId: string,
  createdBy: string,
): Promise<{ token: string; expiresAt: string }> {
  const supabase = createAdminSupabaseClient()
  const now = new Date().toISOString()
  await supabase.from('admin_password_resets').update({ used_at: now }).eq('user_id', userId).is('used_at', null)
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + RESET_HOURS * 60 * 60 * 1000).toISOString()
  const { error } = await supabase
    .from('admin_password_resets')
    .insert({ user_id: userId, token_hash: hashToken(token), created_by: createdBy, expires_at: expiresAt })
  assertSchema(error)
  return { token, expiresAt }
}

async function findValidReset(token: string) {
  if (!/^[\w-]{20,}$/.test(token)) return null
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('admin_password_resets')
    .select('id,user_id,expires_at,used_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle()
  assertSchema(error)
  if (!data || data.used_at || new Date(data.expires_at).getTime() < Date.now()) return null
  const { data: account } = await supabase
    .from('admin_users')
    .select('name,username')
    .eq('id', data.user_id)
    .maybeSingle()
  return account
    ? { id: data.id as string, userId: data.user_id as string, name: account.name, username: account.username }
    : null
}

/** 링크 페이지에서 보여줄 계정 정보 (유효하지 않으면 null) */
export async function inspectResetToken(token: string): Promise<{ name: string; username: string } | null> {
  const reset = await findValidReset(token)
  return reset ? { name: reset.name, username: reset.username } : null
}

export async function consumeResetToken(token: string, password: string): Promise<Result> {
  const invalid = passwordError(password)
  if (invalid) return { ok: false, message: invalid }
  const reset = await findValidReset(token)
  if (!reset) return { ok: false, message: '만료되었거나 이미 사용된 링크입니다. 관리자에게 새 링크를 요청해 주세요.' }

  // 먼저 링크를 사용 처리해서 같은 링크로 두 번 바꾸지 못하게 한다
  const { data: claimed } = await createAdminSupabaseClient()
    .from('admin_password_resets')
    .update({ used_at: new Date().toISOString() })
    .eq('id', reset.id)
    .is('used_at', null)
    .select('id')
  if (!claimed?.length) return { ok: false, message: '이미 사용된 링크입니다.' }

  const version = await setPassword(reset.userId, password)
  await createSession(reset.userId, version)
  return { ok: true }
}

/* ─── 권한 ─────────────────────────────────────────────────────────────── */

export const isApproved = (user: AdminUser | null): user is AdminUser => user?.status === 'approved'

/** 승인된 계정만 통과 */
export async function requireUser(): Promise<AdminUser> {
  const user = await getCurrentUser()
  if (!isApproved(user)) throw new Error('Unauthorized')
  return user
}

/** 마스터만 통과 */
export async function requireMaster(): Promise<AdminUser> {
  const user = await requireUser()
  if (!user.is_master) throw new Error('Forbidden')
  return user
}

/** 수정: 승인된 멤버는 모든 작품을 볼 수 있고 수정할 수 있다 */
export function canEditWork(user: AdminUser, _work?: Pick<Work, 'author_id'>) {
  return isApproved(user)
}

/** 삭제: 마스터이거나 본인이 쓴 작품만 */
export function canDeleteWork(user: AdminUser, work: Pick<Work, 'author_id'>) {
  return user.is_master || (Boolean(work.author_id) && work.author_id === user.id)
}

/** 페이지용: 로그인 안 했으면 /login, 권한이 없으면 /admin 으로 보낸다 */
export async function requirePageUser(options: { master?: boolean } = {}): Promise<AdminUser> {
  const user = await getCurrentUser().catch(() => null)
  if (!user) redirect('/login')
  // 승인 대기/거절 계정과 권한 없는 계정은 대시보드로 (레이아웃이 안내를 보여준다)
  if (!isApproved(user) || (options.master && !user.is_master)) redirect('/admin')
  return user
}
