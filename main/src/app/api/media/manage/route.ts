import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { requireMaster } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { deleteR2Object, getR2Object, listR2Objects, publicR2Url, putR2Object } from '@/lib/r2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Reference = { kind: 'work' | 'member'; id: string; title: string; source: string }
type WorkRow = { id: string; title: string; slug: string; thumbnail_url: string | null; content: string }
type MemberRow = { id: string; name: string; cover_image_url: string | null }

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

function extension(key: string) {
  return key.split('.').pop()?.toLowerCase() ?? ''
}

function mimeFromKey(key: string) {
  const ext = extension(key)
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'heic') return 'image/heic'
  if (ext === 'heif') return 'image/heif'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'mp4') return 'video/mp4'
  if (ext === 'pdf') return 'application/pdf'
  return 'application/octet-stream'
}

async function loadReferences() {
  const supabase = createAdminSupabaseClient()
  const [{ data: works, error: worksError }, { data: members, error: membersError }] = await Promise.all([
    supabase.from('works').select('id,title,slug,thumbnail_url,content'),
    supabase.from('members').select('id,name,cover_image_url'),
  ])
  if (worksError) throw worksError
  if (membersError) throw membersError

  const references = new Map<string, Reference[]>()
  const add = (url: string | null, reference: Reference) => {
    if (!url) return
    const current = references.get(url) ?? []
    current.push(reference)
    references.set(url, current)
  }

  for (const work of (works ?? []) as WorkRow[]) {
    add(work.thumbnail_url, { kind: 'work', id: work.id, title: work.title, source: '썸네일' })
    for (const match of Array.from(work.content.matchAll(/https?:\/\/[^\s"'<>\\)]+/g))) {
      add(match[0], { kind: 'work', id: work.id, title: work.title, source: '본문' })
    }
  }
  for (const member of (members ?? []) as MemberRow[]) {
    add(member.cover_image_url, { kind: 'member', id: member.id, title: member.name, source: '프로필' })
  }
  return { references, works: (works ?? []) as WorkRow[], members: (members ?? []) as MemberRow[] }
}

export async function GET() {
  try {
    await requireMaster()
    const [objects, { references }] = await Promise.all([listR2Objects(), loadReferences()])
    const files = objects
      .filter((object) => object.Key)
      .map((object) => {
        const key = object.Key as string
        const url = publicR2Url(key)
        return {
          key,
          url,
          size: object.Size ?? 0,
          lastModified: object.LastModified?.toISOString() ?? null,
          mimeType: mimeFromKey(key),
          optimizable: IMAGE_EXTENSIONS.has(extension(key)),
          references: references.get(url) ?? [],
        }
      })
      .sort((a, b) => b.size - a.size)
    return NextResponse.json({ files })
  } catch (error) {
    console.error('Failed to list R2 media', error)
    return NextResponse.json({ message: error instanceof Error ? error.message : '미디어 조회 실패' }, { status: 500 })
  }
}

async function replaceReferences(oldUrl: string, newUrl: string, works: WorkRow[], members: MemberRow[]) {
  const supabase = createAdminSupabaseClient()
  for (const work of works) {
    const thumbnailChanged = work.thumbnail_url === oldUrl
    const contentChanged = work.content.includes(oldUrl)
    if (!thumbnailChanged && !contentChanged) continue
    const { error } = await supabase.from('works').update({
      ...(thumbnailChanged ? { thumbnail_url: newUrl } : {}),
      ...(contentChanged ? { content: work.content.replaceAll(oldUrl, newUrl) } : {}),
    }).eq('id', work.id)
    if (error) throw error
  }
  for (const member of members) {
    if (member.cover_image_url !== oldUrl) continue
    const { error } = await supabase.from('members').update({ cover_image_url: newUrl }).eq('id', member.id)
    if (error) throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireMaster()
    const { key } = (await request.json()) as { key?: string }
    if (!key || key.startsWith('/') || key.includes('..') || !IMAGE_EXTENSIONS.has(extension(key))) {
      return NextResponse.json({ message: '최적화할 수 없는 파일입니다.' }, { status: 400 })
    }

    const oldUrl = publicR2Url(key)
    const [{ works, members, references }, object] = await Promise.all([loadReferences(), getR2Object(key)])
    const usage = references.get(oldUrl) ?? []
    if (usage.length === 0) {
      return NextResponse.json({ message: '사용 중인 이미지가 아니므로 최적화하지 않았습니다.' }, { status: 409 })
    }
    if (!object.Body) throw new Error('R2 object body is empty')

    const original = Buffer.from(await object.Body.transformToByteArray())
    const image = sharp(original, { failOn: 'warning', limitInputPixels: 100_000_000 }).rotate()
    const before = await image.metadata()
    const optimized = await image
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 5, smartSubsample: true })
      .toBuffer()

    if (optimized.length >= original.length) {
      return NextResponse.json({
        skipped: true,
        reason: '이미 충분히 최적화되어 있습니다.',
        beforeSize: original.length,
        afterSize: original.length,
      })
    }

    const base = key.replace(/\.[^.]+$/, '')
    const newKey = `${base}-optimized-${randomUUID().slice(0, 8)}.webp`
    const newUrl = publicR2Url(newKey)
    await putR2Object(newKey, optimized, 'image/webp')
    try {
      await replaceReferences(oldUrl, newUrl, works, members)
    } catch (error) {
      await deleteR2Object(newKey).catch(() => undefined)
      throw error
    }
    await deleteR2Object(key)

    return NextResponse.json({
      ok: true,
      oldKey: key,
      newKey,
      newUrl,
      beforeSize: original.length,
      afterSize: optimized.length,
      beforeWidth: before.width ?? null,
      beforeHeight: before.height ?? null,
      referencesUpdated: usage.length,
    })
  } catch (error) {
    console.error('Failed to optimize R2 media', error)
    return NextResponse.json({ message: error instanceof Error ? error.message : '이미지 최적화 실패' }, { status: 500 })
  }
}
