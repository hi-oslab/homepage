// DB에 저장된 옛 R2 공개 주소(https://pub-xxx.r2.dev/<key>)를 사이트 상대 주소(/media/<key>)로 바꾼다.
//
//   node scripts/migrate-media-urls.mjs          # 미리보기 (변경 없음)
//   node scripts/migrate-media-urls.mjs --apply  # 실제 적용
//
// 대상: works.thumbnail_url, works.content(본문 JSON 안의 주소), members.cover_image_url
// 여러 번 실행해도 안전하다 (이미 바뀐 주소는 건드리지 않음).
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const required = (name) => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

const apply = process.argv.includes('--apply')
const supabaseUrl = required('NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = required('SUPABASE_SECRET_KEY')
// 옛 공개 주소. 환경변수를 이미 지웠다면 LEGACY_R2_PUBLIC_URL 로 넘겨준다
const legacyBase = (process.env.LEGACY_R2_PUBLIC_URL || required('NEXT_PUBLIC_R2_PUBLIC_URL')).trim().replace(/\/$/, '')
const MEDIA_BASE = '/media'

if (!/^https?:\/\//.test(legacyBase)) throw new Error(`옛 주소가 절대 URL이 아닙니다: ${legacyBase}`)

const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' }
const convert = (value) => (value ? value.replaceAll(`${legacyBase}/`, `${MEDIA_BASE}/`) : value)
const count = (value) => (value ? value.split(`${legacyBase}/`).length - 1 : 0)

async function load(table, columns) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}`, { headers })
  if (!response.ok) throw new Error(`Failed to load ${table} (${response.status})`)
  return response.json()
}

async function patch(table, id, body) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`Failed to update ${table} ${id} (${response.status}): ${await response.text()}`)
}

const [works, members] = await Promise.all([
  load('works', 'id,slug,thumbnail_url,content'),
  load('members', 'id,name,cover_image_url'),
])

const changes = []
for (const work of works) {
  const body = {}
  if (count(work.thumbnail_url)) body.thumbnail_url = convert(work.thumbnail_url)
  if (count(work.content)) body.content = convert(work.content)
  if (Object.keys(body).length) {
    changes.push({ table: 'works', id: work.id, label: work.slug, urls: count(work.thumbnail_url) + count(work.content), body })
  }
}
for (const member of members) {
  if (count(member.cover_image_url)) {
    changes.push({
      table: 'members',
      id: member.id,
      label: member.name,
      urls: 1,
      body: { cover_image_url: convert(member.cover_image_url) },
    })
  }
}

const total = changes.reduce((sum, change) => sum + change.urls, 0)
console.log(`mode: ${apply ? 'apply' : 'dry-run'}`)
console.log(`${legacyBase}/…  →  ${MEDIA_BASE}/…`)
for (const change of changes) console.log(`  ${change.table.padEnd(8)} ${change.label}  (${change.urls})`)
console.log(`rows: ${changes.length}, urls: ${total}`)

if (apply) {
  for (const change of changes) await patch(change.table, change.id, change.body)
  console.log('done. 사이트 캐시를 갱신하려면 어드민의 "사이트 갱신"을 누르거나 다시 배포하세요.')
} else if (changes.length) {
  console.log('미리보기입니다. 적용하려면 --apply 를 붙여 다시 실행하세요.')
}
