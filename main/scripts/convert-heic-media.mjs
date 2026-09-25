import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const required = (name) => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

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

const response = await fetch(`${supabaseUrl}/rest/v1/works?select=id,slug,content` , { headers })
if (!response.ok) throw new Error(`Failed to load works (${response.status})`)
const works = await response.json()
const replacements = new Map()
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'osl-heic-'))

try {
  const urls = [...new Set(works
    .flatMap((work) => work.content.match(urlPattern) ?? [])
    .filter((url) => url.startsWith(`${publicBase}/`)))]
  for (const url of urls) {
    const source = await fetch(url)
    const contentType = source.headers.get('content-type')?.split(';')[0].toLowerCase()
    if (!source.ok || (contentType !== 'image/heic' && contentType !== 'image/heif')) continue

    const id = randomUUID()
    const heicPath = join(temporaryDirectory, `${id}.heic`)
    const jpegPath = join(temporaryDirectory, `${id}.jpg`)
    writeFileSync(heicPath, Buffer.from(await source.arrayBuffer()))
    execFileSync('sips', ['-s', 'format', 'jpeg', heicPath, '--out', jpegPath], { stdio: 'ignore' })
    const optimized = await sharp(jpegPath)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 5, smartSubsample: true })
      .toBuffer()

    const oldKey = decodeURIComponent(url.slice(`${publicBase}/`.length))
    const directory = oldKey.includes('/') ? oldKey.slice(0, oldKey.lastIndexOf('/')) : 'migration/recovered'
    const newKey = `${directory}/${id}-optimized.webp`
    await r2.send(new PutObjectCommand({
      Bucket: bucket,
      Key: newKey,
      Body: optimized,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }))
    replacements.set(url, `${publicBase}/${newKey}`)
  }

  for (const work of works) {
    let content = work.content
    for (const [oldUrl, newUrl] of replacements) content = content.replaceAll(oldUrl, newUrl)
    if (content === work.content) continue
    const update = await fetch(`${supabaseUrl}/rest/v1/works?id=eq.${work.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (!update.ok) throw new Error(`Failed to update ${work.slug} (${update.status})`)
  }

  console.log(`Converted ${replacements.size} HEIC images to WebP.`)
  console.log('Original HEIC objects were retained in R2 for recovery.')
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true })
}
