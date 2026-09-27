// 어드민 "시스템 상태" 페이지용 점검 (서버 전용)
// 각 서비스를 동시에 확인하고, 느린 서비스가 있어도 페이지가 멈추지 않도록 제한 시간을 둔다.

import { createAdminSupabaseClient } from './supabase'
import { listR2Objects } from './r2'
import { ALLOW_INDEXING, PRODUCTION_URL, SITE_URL } from './site'
import { CONTACT_FROM } from './contact'

export type Health = 'ok' | 'warn' | 'error'
export type Metric = { label: string; value: string; hint?: string }
export type Link = { label: string; href: string }

export type ServiceStatus = {
  id: string
  name: string
  role: string
  health: Health
  summary: string
  latencyMs?: number
  metrics: Metric[]
  /** 0~1, 무료 한도 대비 사용률 */
  usage?: { ratio: number; label: string }
  notes: string[]
  links: Link[]
}

const TIMEOUT_MS = 8000
const R2_FREE_BYTES = 10 * 1024 ** 3

async function timed<T>(task: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const started = Date.now()
  const value = await Promise.race([
    task(),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`시간 초과 (${TIMEOUT_MS / 1000}초)`)), TIMEOUT_MS)),
  ])
  return { value, ms: Date.now() - started }
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error))

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

/* ─── Supabase ────────────────────────────────────────────────────────── */

async function checkSupabase(): Promise<ServiceStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  const base: ServiceStatus = {
    id: 'supabase',
    name: 'Supabase',
    role: '데이터베이스 (작품, 프로필, 멤버, 커뮤니티)',
    health: 'ok',
    summary: '',
    metrics: [],
    notes: ['무료 플랜은 7일 동안 요청이 없으면 프로젝트가 일시정지돼요.'],
    links: [
      ...(ref ? [{ label: '대시보드', href: `https://supabase.com/dashboard/project/${ref}` }] : []),
      ...(ref ? [{ label: '사용량', href: `https://supabase.com/dashboard/project/${ref}/settings/usage` }] : []),
      { label: '장애 현황', href: 'https://status.supabase.com' },
    ],
  }

  try {
    const supabase = createAdminSupabaseClient()
    const count = async (table: string, column?: string, value?: string | boolean) => {
      let query = supabase.from(table).select('id', { count: 'exact', head: true })
      if (column) query = query.eq(column, value)
      const { count: total, error } = await query
      if (error) throw new Error(`${table}: ${error.message || error.code || '조회 실패'}`)
      return total ?? 0
    }

    const { value, ms } = await timed(() =>
      Promise.all([
        count('works'),
        count('works', 'published', true),
        count('members'),
        count('admin_users'),
        count('admin_users', 'status', 'pending'),
        count('community_posts'),
        count('history_items'),
      ]),
    )
    const [works, publishedWorks, members, users, pending, posts, history] = value
    return {
      ...base,
      health: ms > 3000 ? 'warn' : 'ok',
      summary: ms > 3000 ? '응답이 느려요' : '정상',
      latencyMs: ms,
      metrics: [
        { label: '작품', value: `${works}`, hint: `공개 ${publishedWorks}` },
        { label: '프로필', value: `${members}` },
        { label: '멤버', value: `${users}`, hint: pending ? `승인 대기 ${pending}` : undefined },
        { label: '커뮤니티 글', value: `${posts}` },
        { label: '연혁', value: `${history}` },
      ],
    }
  } catch (error) {
    return { ...base, health: 'error', summary: `연결 실패 — ${message(error)}` }
  }
}

/* ─── Cloudflare R2 ───────────────────────────────────────────────────── */

async function checkR2(): Promise<ServiceStatus> {
  const account = process.env.R2_ACCOUNT_ID
  const bucket = process.env.R2_BUCKET_NAME
  const base: ServiceStatus = {
    id: 'r2',
    name: 'Cloudflare R2',
    role: '이미지 저장소 (사이트의 /media 로 서빙)',
    health: 'ok',
    summary: '',
    metrics: [],
    notes: ['무료 한도: 저장 10GB/월, 쓰기 100만 회, 읽기 1000만 회. 전송료는 무료예요.'],
    links: [
      ...(account && bucket
        ? [{ label: '버킷', href: `https://dash.cloudflare.com/${account}/r2/default/buckets/${bucket}` }]
        : []),
      ...(account ? [{ label: '사용량', href: `https://dash.cloudflare.com/${account}/r2/overview` }] : []),
      { label: '장애 현황', href: 'https://www.cloudflarestatus.com' },
    ],
  }

  try {
    const { value: objects, ms } = await timed(() => listR2Objects())
    const bytes = objects.reduce((sum, object) => sum + (object.Size ?? 0), 0)
    const ratio = bytes / R2_FREE_BYTES
    return {
      ...base,
      health: ratio > 0.8 ? 'warn' : ms > 4000 ? 'warn' : 'ok',
      summary: ratio > 0.8 ? '무료 저장 한도에 가까워요' : ms > 4000 ? '응답이 느려요' : '정상',
      latencyMs: ms,
      metrics: [
        { label: '파일', value: `${objects.length}` },
        { label: '용량', value: formatBytes(bytes) },
      ],
      usage: { ratio, label: `${formatBytes(bytes)} / 10 GB` },
    }
  } catch (error) {
    return { ...base, health: 'error', summary: `연결 실패 — ${message(error)}` }
  }
}

/* ─── Resend ──────────────────────────────────────────────────────────── */

const CONTACT_SENDER = CONTACT_FROM.match(/<([^>]+)>/)?.[1] ?? CONTACT_FROM

async function checkResend(): Promise<ServiceStatus> {
  const key = process.env.RESEND_API_KEY
  const base: ServiceStatus = {
    id: 'resend',
    name: 'Resend',
    role: 'Contact 폼 메일 발송',
    health: 'ok',
    summary: '',
    metrics: [],
    notes: ['무료 한도: 3,000통/월, 100통/일.'],
    links: [
      { label: '발송 내역', href: 'https://resend.com/emails' },
      { label: '도메인', href: 'https://resend.com/domains' },
      { label: '장애 현황', href: 'https://resend-status.com' },
    ],
  }
  const senderNote = CONTACT_SENDER.endsWith('@resend.dev')
    ? 'Contact 메일이 테스트용 주소(onboarding@resend.dev)로 발송돼요. Resend 계정 본인 메일로만 보낼 수 있으니, 도메인을 인증하고 발신 주소를 바꾸는 걸 추천해요.'
    : null

  if (!key) return { ...base, health: 'error', summary: 'RESEND_API_KEY가 없어요' }

  try {
    const { value: response, ms } = await timed(() =>
      fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' }),
    )
    const body = (await response.json().catch(() => ({}))) as {
      name?: string
      message?: string
      data?: { name: string; status: string }[]
    }

    // 발송 전용 키는 도메인 조회가 막혀 있지만, 이 응답 자체가 "유효한 키"라는 뜻
    if (response.status === 401 && body.name === 'restricted_api_key') {
      return {
        ...base,
        health: senderNote ? 'warn' : 'ok',
        summary: senderNote ? '키 정상 · 발신 주소 확인 필요' : '키 정상',
        latencyMs: ms,
        metrics: [{ label: 'API 키', value: '유효', hint: '발송 전용 권한' }],
        notes: [...(senderNote ? [senderNote] : []), '발송 전용 키라서 도메인 인증 상태는 대시보드에서 확인해 주세요.', ...base.notes],
      }
    }
    if (!response.ok) {
      return { ...base, health: 'error', summary: `키 오류 — ${body.message ?? response.status}`, latencyMs: ms }
    }

    const domains = body.data ?? []
    const unverified = domains.filter((domain) => domain.status !== 'verified')
    return {
      ...base,
      health: senderNote || unverified.length ? 'warn' : 'ok',
      summary: senderNote ? '발신 주소 확인 필요' : unverified.length ? '인증되지 않은 도메인이 있어요' : '정상',
      latencyMs: ms,
      metrics: [
        { label: 'API 키', value: '유효' },
        ...domains.map((domain) => ({ label: domain.name, value: domain.status === 'verified' ? '인증됨' : domain.status })),
      ],
      notes: [...(senderNote ? [senderNote] : []), ...base.notes],
    }
  } catch (error) {
    return { ...base, health: 'error', summary: `연결 실패 — ${message(error)}` }
  }
}

/* ─── Vercel / 배포 환경 ──────────────────────────────────────────────── */

function checkDeployment(): ServiceStatus {
  const env = process.env.VERCEL_ENV
  const commit = process.env.VERCEL_GIT_COMMIT_SHA
  // NEXT_PUBLIC_ 값은 빌드할 때 박히므로, 환경변수를 고친 뒤에는 다시 배포해야 반영된다
  const wrongSite = env === 'production' && new URL(SITE_URL).hostname !== new URL(PRODUCTION_URL).hostname
  return {
    id: 'vercel',
    name: 'Vercel',
    role: '호스팅 / 배포',
    health: wrongSite ? 'warn' : 'ok',
    summary: wrongSite ? '사이트 주소가 정식 도메인이 아니에요' : env ? `${env} 배포` : '로컬 개발 환경',
    metrics: [
      { label: '사이트 주소', value: SITE_URL.replace(/^https?:\/\//, '') },
      { label: '검색 노출', value: ALLOW_INDEXING ? '허용' : '차단 (noindex)' },
      ...(env ? [{ label: '환경', value: env }] : []),
      ...(commit
        ? [{ label: '커밋', value: commit.slice(0, 7), hint: process.env.VERCEL_GIT_COMMIT_MESSAGE?.split('\n')[0] }]
        : []),
      ...(process.env.VERCEL_REGION ? [{ label: '리전', value: process.env.VERCEL_REGION }] : []),
    ],
    notes: [
      ...(wrongSite
        ? [`Environment Variables에서 NEXT_PUBLIC_SITE_URL을 ${PRODUCTION_URL}로 바꾸거나 지운 뒤 다시 배포해 주세요. 검색 노출도 함께 켜져요.`]
        : []),
      'Hobby 플랜: 대역폭 100GB/월, 비상업적 용도만. 사용량은 대시보드 Usage 탭에서 볼 수 있어요.',
    ],
    links: [
      { label: '대시보드', href: 'https://vercel.com/dashboard' },
      { label: '장애 현황', href: 'https://www.vercel-status.com' },
    ],
  }
}

/* ─── 도메인 ──────────────────────────────────────────────────────────── */

// 정식 도메인으로 옮긴 뒤에도 살려 둔 옛 주소 — 정식 도메인으로 영구 이동(308)돼야 한다 (next.config.ts)
const LEGACY_HOSTS = ['beta.hioslab.com']

type DomainResult = { host: string; ok: boolean; value: string; hint?: string }

async function checkMainDomain(): Promise<DomainResult> {
  const host = new URL(PRODUCTION_URL).hostname
  try {
    const { value: response, ms } = await timed(() => fetch(PRODUCTION_URL, { redirect: 'manual', cache: 'no-store' }))
    if (response.ok) return { host, ok: true, value: '정상', hint: `${response.status} · ${ms}ms` }
    // 예: Vercel에서 www가 대표 도메인이면 hioslab.com → www.hioslab.com 으로 이동해 canonical과 어긋난다
    const location = response.headers.get('location')
    return location
      ? { host, ok: false, value: `→ ${new URL(location, PRODUCTION_URL).hostname}`, hint: `${response.status} · canonical 주소가 다른 곳으로 이동돼요` }
      : { host, ok: false, value: `${response.status}`, hint: '정상 응답이 아니에요' }
  } catch (error) {
    return { host, ok: false, value: '접속 실패', hint: message(error) }
  }
}

async function checkLegacyDomain(host: string): Promise<DomainResult> {
  try {
    const { value: response } = await timed(() => fetch(`https://${host}/`, { redirect: 'manual', cache: 'no-store' }))
    const location = response.headers.get('location') ?? ''
    const target = location ? new URL(location, `https://${host}`).hostname : ''
    const permanent = response.status === 301 || response.status === 308
    if (permanent && target === new URL(PRODUCTION_URL).hostname) {
      return { host, ok: true, value: '이동 중', hint: `${response.status} → ${target}` }
    }
    return {
      host,
      ok: false,
      value: location ? `${response.status} → ${target}` : `${response.status}`,
      hint: '정식 도메인으로 영구 이동되지 않아요',
    }
  } catch (error) {
    return { host, ok: false, value: '접속 실패', hint: message(error) }
  }
}

async function checkDomains(): Promise<ServiceStatus> {
  const productionHost = new URL(PRODUCTION_URL).hostname
  const siteHost = new URL(SITE_URL).hostname
  const isProduction = process.env.VERCEL_ENV === 'production'
  const [main, ...legacy] = await Promise.all([checkMainDomain(), ...LEGACY_HOSTS.map(checkLegacyDomain)])

  const problems: string[] = []
  if (!main.ok) problems.push(main.value.startsWith('→') ? `${productionHost}가 ${main.value.slice(2)}로 이동돼요 — Vercel에서 대표 도메인을 ${productionHost}로 바꿔 주세요` : `${productionHost}에 접속할 수 없어요`)
  legacy.filter((item) => !item.ok).forEach((item) => problems.push(`${item.host}가 정식 도메인으로 이동되지 않아요`))
  if (isProduction && siteHost !== productionHost) problems.push(`사이트 주소가 ${siteHost}로 설정돼 있어요`)
  if (isProduction && !ALLOW_INDEXING) problems.push('정식 배포인데 검색 노출이 막혀 있어요')

  return {
    id: 'domains',
    name: '도메인',
    role: `정식 주소 ${productionHost} · 옛 주소는 영구 이동`,
    health: !main.ok && !main.value.startsWith('→') ? 'error' : problems.length ? 'warn' : 'ok',
    summary: problems[0] ?? '정상',
    metrics: [main, ...legacy].map((item) => ({ label: item.host, value: item.value, hint: item.hint })),
    notes: [
      ...problems.slice(1),
      `canonical, 사이트맵, robots 주소는 NEXT_PUBLIC_SITE_URL(없으면 ${productionHost}) 기준으로 만들어져요.`,
      '옛 주소는 연결을 끊지 말고 이동만 시켜 두세요. 예전 링크와 검색 결과가 새 주소로 넘어와요.',
    ],
    links: [
      { label: 'Vercel 도메인', href: 'https://vercel.com/dashboard' },
      { label: 'Search Console', href: 'https://search.google.com/search-console' },
    ],
  }
}

/* ─── 환경변수 (값은 절대 노출하지 않음) ───────────────────────────────── */

const ENV_VARS: { name: string; required: boolean; purpose: string }[] = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true, purpose: 'Supabase 주소' },
  { name: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', required: true, purpose: 'Supabase 공개 키' },
  { name: 'SUPABASE_SECRET_KEY', required: true, purpose: 'Supabase 서버 키 · 로그인 세션 서명' },
  { name: 'R2_ENDPOINT', required: true, purpose: 'R2 접속 주소' },
  { name: 'R2_ACCESS_KEY_ID', required: true, purpose: 'R2 키' },
  { name: 'R2_SECRET_ACCESS_KEY', required: true, purpose: 'R2 비밀 키' },
  { name: 'R2_BUCKET_NAME', required: true, purpose: 'R2 버킷' },
  { name: 'RESEND_API_KEY', required: true, purpose: 'Contact 메일 발송' },
  { name: 'ADMIN_PASSWORD', required: true, purpose: '첫 운영자 계정 생성' },
  { name: 'NEXT_PUBLIC_SITE_URL', required: false, purpose: '사이트 주소 (없으면 hioslab.com)' },
  { name: 'R2_ACCOUNT_ID', required: false, purpose: 'Cloudflare 대시보드 바로가기' },
  { name: 'NEXT_PUBLIC_R2_PUBLIC_URL', required: false, purpose: '옛 r2.dev 주소 인식 (전환용)' },
  { name: 'AUTH_SECRET', required: false, purpose: '로그인 세션 서명 키 (없으면 Supabase 키로 대체)' },
  { name: 'NEXT_PUBLIC_GA_ID', required: false, purpose: 'Google Analytics' },
  { name: 'NEXT_PUBLIC_GTM_ID', required: false, purpose: 'Google Tag Manager' },
]

export type EnvStatus = { name: string; required: boolean; purpose: string; set: boolean }

export function checkEnv(): EnvStatus[] {
  return ENV_VARS.map((item) => ({ ...item, set: Boolean(process.env[item.name]?.trim()) }))
}

/* ─── 전체 ────────────────────────────────────────────────────────────── */

export async function getSystemStatus() {
  const [supabase, r2, resend, domains] = await Promise.all([checkSupabase(), checkR2(), checkResend(), checkDomains()])
  return { services: [supabase, r2, resend, checkDeployment(), domains], env: checkEnv(), checkedAt: new Date().toISOString() }
}
