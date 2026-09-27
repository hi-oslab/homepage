'use client'

import imageCompression from 'browser-image-compression'
import { mediaKeyFromUrl } from './media-url'

/**
 * 이미지를 R2에 올리고 공개 주소를 돌려준다.
 * 기본은 WebP로 줄여서 올리고, keepFormat이면 그대로 올린다
 * (프로필 투명 PNG: 브라우저마다 WebP 변환에서 투명도가 흔들릴 수 있어서)
 */
export async function uploadImage(
  file: File,
  _bucket = 'project-media',
  path = 'projects',
  options: { keepFormat?: boolean } = {},
): Promise<string> {
  const shouldConvert = !options.keepFormat && (file.type === 'image/png' || file.type === 'image/jpeg')
  const uploadFile = shouldConvert
    ? await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.85,
      })
    : file
  const contentType = shouldConvert ? 'image/webp' : uploadFile.type
  const projectId = path.split('/').filter(Boolean).at(-1) ?? 'unassigned'

  const signResponse = await fetch('/api/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, filename: file.name, contentType }),
  })
  if (!signResponse.ok) throw new Error('업로드 URL을 만들지 못했습니다.')
  const { uploadUrl, publicUrl } = (await signResponse.json()) as { uploadUrl: string; publicUrl: string }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: uploadFile,
  })
  if (!uploadResponse.ok) throw new Error('R2 업로드에 실패했습니다. CORS 설정을 확인하세요.')
  return publicUrl
}

export async function deleteImage(url: string): Promise<void> {
  const response = await fetch('/api/media', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!response.ok) throw new Error('이미지를 삭제하지 못했습니다.')
}

export function isOwnStorageUrl(url: string): boolean {
  return mediaKeyFromUrl(url) !== null
}
