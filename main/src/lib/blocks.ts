// src/lib/blocks.ts
// Block[] <-> content(text) 직렬화, 블록 생성, 미디어 URL 추출

import type { Block, BlockType } from '@/types/blocks'
import { parseVimeoSource } from '@/lib/vimeo'

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `b-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * content 문자열을 Block[] 로 파싱한다.
 * - 유효한 블록 배열 JSON이면 그대로 사용
 * - 그 외(과거 raw markdown 등)는 legacy-markdown 블록 1개로 감싼다
 */
export function parseBlocks(content: string | null | undefined): Block[] {
  if (!content || !content.trim()) return []

  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed) && parsed.every((b) => b && typeof b === 'object' && typeof b.type === 'string')) {
      return parsed as Block[]
    }
  } catch {
    // JSON이 아님 -> 과거 markdown 텍스트로 간주
  }

  return [{ id: genId(), type: 'legacy-markdown', text: content }]
}

export function serializeBlocks(blocks: Block[]): string {
  return JSON.stringify(blocks)
}

export function createBlock(type: BlockType): Block {
  const id = genId()
  switch (type) {
    case 'section-index':
      return { id, type, number: '01', title: '' }
    case 'heading':
      return { id, type, level: 2, text: '' }
    case 'paragraph':
      return { id, type, text: '' }
    case 'media':
      return { id, type, mediaType: 'image', url: '', caption: '' }
    case 'gallery':
      return { id, type, items: [] }
    case 'link':
      return { id, type, url: '', style: 'bookmark', title: '', description: '', image: '' }
    case 'code':
      return { id, type, code: '', language: '' }
    case 'html':
      return { id, type, html: '' }
    case 'divider':
      return { id, type }
    case 'quote':
      return { id, type, text: '', cite: '' }
    case 'list':
      return { id, type, style: 'bullet', items: [''] }
    case 'embed':
      return { id, type, url: '', title: '' }
    case 'callout':
      return { id, type, icon: '💡', text: '' }
    case 'legacy-markdown':
      return { id, type, text: '' }
  }
}

const MARKDOWN_IMAGE_URL_RE = /!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g

/**
 * 블록 배열 안에서 실제로 참조되는 (스토리지) 이미지 URL을 모두 모은다.
 * 저장 시 더 이상 참조되지 않는 이미지를 자동 정리하는 데 사용한다.
 * 영상(mediaType: 'video')은 Vimeo 링크이므로 대상에서 제외한다.
 */
export function extractUrlsFromBlocks(blocks: Block[]): string[] {
  const urls: string[] = []

  for (const block of blocks) {
    switch (block.type) {
      case 'media':
        if (block.mediaType === 'image') {
          const mediaUrls = block.urls?.length ? block.urls : block.url ? [block.url] : []
          urls.push(...mediaUrls)
        }
        break
      case 'gallery':
        block.items.forEach((item) => item.url && urls.push(item.url))
        break
      case 'link':
        if (block.image) urls.push(block.image)
        break
      case 'legacy-markdown':
        urls.push(...Array.from(block.text.matchAll(MARKDOWN_IMAGE_URL_RE), (m) => m[1]))
        break
    }
  }

  return urls
}

/**
 * Vimeo URL(또는 ID 직접 입력)에서 영상 ID만 추출한다.
 * 지원 형식: vimeo.com/123456789, player.vimeo.com/video/123456789,
 * 비공개 링크(vimeo.com/123456789/abcdef) 등
 */
export function extractVimeoId(input: string): string | null {
  return parseVimeoSource(input)?.id ?? null
}
