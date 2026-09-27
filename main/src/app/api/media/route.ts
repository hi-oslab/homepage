import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { canEditWork, requireUser } from '@/lib/admin-auth'
import { getAdminWork } from '@/lib/cms'
import { createUploadUrl, deleteR2Object, keyFromPublicR2Url, publicR2Url } from '@/lib/r2'
import type { AdminUser } from '@/types/cms'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

/** 업로드 폴더(projects/<id>)의 주인인지: 운영자이거나, 프로젝트 / 본인 프로필 / 본인 계정(게시판 글 이미지) */
async function ownsFolder(user: AdminUser, folderId: string) {
  if (user.is_master) return true
  if (user.member_id && folderId === user.member_id) return true
  if (folderId === user.id) return true
  const work = await getAdminWork(folderId).catch(() => null)
  return Boolean(work && canEditWork(user, work))
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const body = (await request.json()) as { projectId?: string; filename?: string; contentType?: string }
    const contentType = body.contentType?.toLowerCase() ?? ''
    if (!body.projectId || !/^[\w-]+$/.test(body.projectId) || !ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json({ message: 'Invalid upload request' }, { status: 400 })
    }
    if (!(await ownsFolder(user, body.projectId))) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

    const extension = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1]
    const key = `projects/${body.projectId}/${randomUUID()}.${extension}`
    const uploadUrl = await createUploadUrl(key, contentType)
    return NextResponse.json({ uploadUrl, publicUrl: publicR2Url(key) })
  } catch (error) {
    console.error('Failed to create R2 upload URL', error)
    return NextResponse.json({ message: 'Unauthorized or storage unavailable' }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser()
    const { url } = (await request.json()) as { url?: string }
    const key = url ? keyFromPublicR2Url(url) : null
    if (!key) return NextResponse.json({ message: 'Invalid media URL' }, { status: 400 })
    // 마스터가 아니면 본인 폴더(projects/<id>/...)의 파일만 지울 수 있다
    const folderId = key.match(/^projects\/([^/]+)\//)?.[1]
    if (!user.is_master && (!folderId || !(await ownsFolder(user, folderId)))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    await deleteR2Object(key)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete R2 object', error)
    return NextResponse.json({ message: 'Unauthorized or storage unavailable' }, { status: 401 })
  }
}

