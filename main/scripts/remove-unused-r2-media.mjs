import { S3Client, DeleteObjectsCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
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
const publicBase = required('NEXT_PUBLIC_R2_PUBLIC_URL').replace(/\/$/, '')
const bucket = required('R2_BUCKET_NAME')
const r2 = new S3Client({
  region: 'auto',
  endpoint: required('R2_ENDPOINT'),
  credentials: {
    accessKeyId: required('R2_ACCESS_KEY_ID'),
    secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
  },
})
const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
const urlPattern = /https?:\/\/[^\s"'<>\\)]+/g

async function loadReferences() {
  const [worksResponse, membersResponse] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/works?select=thumbnail_url,content`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/members?select=cover_image_url`, { headers }),
  ])
  if (!worksResponse.ok || !membersResponse.ok) throw new Error('Failed to load Supabase media references')
  const works = await worksResponse.json()
  const members = await membersResponse.json()
  return new Set([
    ...works.flatMap((work) => [work.thumbnail_url, ...(work.content.match(urlPattern) ?? [])]),
    ...members.map((member) => member.cover_image_url),
  ].filter(Boolean))
}

async function listObjects() {
  const objects = []
  let continuationToken
  do {
    const page = await r2.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken }))
    objects.push(...(page.Contents ?? []))
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (continuationToken)
  return objects
}

const [references, objects] = await Promise.all([loadReferences(), listObjects()])
const unusedImages = []

for (const object of objects) {
  if (!object.Key || references.has(`${publicBase}/${object.Key}`)) continue
  const metadata = await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: object.Key }))
  if (!metadata.ContentType?.toLowerCase().startsWith('image/')) continue
  unusedImages.push({ key: object.Key, size: object.Size ?? 0, contentType: metadata.ContentType })
}

const totalBytes = unusedImages.reduce((sum, object) => sum + object.size, 0)
console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', count: unusedImages.length, totalBytes, files: unusedImages }, null, 2))

if (apply && unusedImages.length > 0) {
  for (let index = 0; index < unusedImages.length; index += 1000) {
    const batch = unusedImages.slice(index, index + 1000)
    const result = await r2.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: batch.map(({ key }) => ({ Key: key })), Quiet: true },
    }))
    if (result.Errors?.length) throw new Error(`R2 deletion failed: ${JSON.stringify(result.Errors)}`)
  }
  console.log(`Deleted ${unusedImages.length} unused images (${totalBytes} bytes).`)
}
