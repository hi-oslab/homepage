// 블록 메뉴 항목 ('/' 메뉴와 ＋ 버튼이 같이 쓴다)
// 목록 · 인용 · 콜아웃은 새로 넣지 않는다 (예전에 넣은 블록은 그대로 보이고 고칠 수 있다)
import { createBlock } from '@/lib/blocks'
import type { Block } from '@/types/blocks'

export type MenuEntry = {
  id: string
  label: string
  hint: string
  icon: string
  /** '/' 뒤에 입력한 글자로 찾을 때 쓰는 말 */
  keywords: string[]
  create: () => Block
}

const heading = (level: 1 | 2 | 3): Block => ({ ...(createBlock('heading') as Extract<Block, { type: 'heading' }>), level })
const video = (): Block => ({ ...(createBlock('media') as Extract<Block, { type: 'media' }>), mediaType: 'video' })

export const MENU_ENTRIES: MenuEntry[] = [
  { id: 'paragraph', label: '문단', hint: '일반 글', icon: '¶', keywords: ['text', 'p', '본문', '글'], create: () => createBlock('paragraph') },
  { id: 'h1', label: '제목 1', hint: '큰 제목', icon: 'H1', keywords: ['heading', 'h1', '제목'], create: () => heading(1) },
  { id: 'h2', label: '제목 2', hint: '중간 제목', icon: 'H2', keywords: ['heading', 'h2', '제목'], create: () => heading(2) },
  { id: 'h3', label: '제목 3', hint: '작은 제목', icon: 'H3', keywords: ['heading', 'h3', '제목'], create: () => heading(3) },
  { id: 'section', label: '섹션', hint: '상세 페이지 옆 목차에 표시', icon: '§', keywords: ['section', 'index', '목차', '섹션'], create: () => createBlock('section-index') },
  { id: 'image', label: '이미지', hint: '사진 한 장 또는 여러 장', icon: '🖼', keywords: ['image', 'img', 'photo', '사진', '이미지'], create: () => createBlock('media') },
  { id: 'video', label: '영상', hint: '유튜브 · 비메오 링크', icon: '▶', keywords: ['video', 'youtube', 'vimeo', '영상', '비디오'], create: video },
  { id: 'gallery', label: '갤러리', hint: '가로로 넘겨 보는 이미지', icon: '▦', keywords: ['gallery', '갤러리', '슬라이드'], create: () => createBlock('gallery') },
  { id: 'divider', label: '구분선', hint: '흐름 나누기', icon: '—', keywords: ['divider', 'hr', 'line', '구분'], create: () => createBlock('divider') },
  { id: 'link', label: '링크', hint: '미리보기 카드 또는 글 속 링크', icon: '🔗', keywords: ['link', 'url', 'bookmark', '링크'], create: () => createBlock('link') },
  { id: 'embed', label: '임베드', hint: '다른 사이트 화면 넣기', icon: '⧉', keywords: ['embed', 'iframe', '임베드'], create: () => createBlock('embed') },
  { id: 'code', label: '코드', hint: '코드 조각', icon: '</>', keywords: ['code', '코드'], create: () => createBlock('code') },
  { id: 'html', label: 'HTML', hint: '직접 쓰는 HTML', icon: '⌘', keywords: ['html'], create: () => createBlock('html') },
]

export function filterEntries(query: string): MenuEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return MENU_ENTRIES
  return MENU_ENTRIES.filter(
    (entry) => entry.label.toLowerCase().includes(q) || entry.keywords.some((keyword) => keyword.includes(q)),
  )
}

/** 글 블록인지 (Enter · Backspace · ↑↓로 오가는 블록) */
export const TEXT_TYPES = new Set<Block['type']>(['paragraph', 'heading', 'quote', 'callout', 'section-index', 'list'])
