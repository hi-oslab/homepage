import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type _Object,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function env(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value.replace(/\/$/, '')
}

function client() {
  return new S3Client({
    region: 'auto',
    endpoint: env('R2_ENDPOINT'),
    credentials: {
      accessKeyId: env('R2_ACCESS_KEY_ID'),
      secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
    },
  })
}

export async function createUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: env('R2_BUCKET_NAME'),
    Key: key,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  })
  return getSignedUrl(client(), command, { expiresIn: 300 })
}

export async function deleteR2Object(key: string) {
  await client().send(new DeleteObjectCommand({ Bucket: env('R2_BUCKET_NAME'), Key: key }))
}

export async function getR2Object(key: string) {
  return client().send(new GetObjectCommand({ Bucket: env('R2_BUCKET_NAME'), Key: key }))
}

export async function putR2Object(key: string, body: Buffer, contentType: string) {
  await client().send(new PutObjectCommand({
    Bucket: env('R2_BUCKET_NAME'),
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }))
}

export async function listR2Objects(): Promise<_Object[]> {
  const objects: _Object[] = []
  let continuationToken: string | undefined
  do {
    const response = await client().send(new ListObjectsV2Command({
      Bucket: env('R2_BUCKET_NAME'),
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    }))
    objects.push(...(response.Contents ?? []))
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
  } while (continuationToken)
  return objects
}

export function publicR2Url(key: string): string {
  return `${env('NEXT_PUBLIC_R2_PUBLIC_URL')}/${key}`
}

export function keyFromPublicR2Url(url: string): string | null {
  const base = env('NEXT_PUBLIC_R2_PUBLIC_URL')
  if (!url.startsWith(`${base}/`)) return null
  return decodeURIComponent(url.slice(base.length + 1))
}
