// src/types/blocks.ts
// 프로젝트 본문(content)을 구성하는 블록 타입 정의.
// content 컬럼(text)에는 이 Block[] 을 JSON.stringify 해서 저장한다.
// (과거 raw markdown 프로젝트는 lib/blocks.ts#parseBlocks 에서 legacy-markdown 블록 1개로 감싸 처리)

export interface BlockBase {
  id: string
}

export interface HeadingBlock extends BlockBase {
  type: 'heading'
  level: 1 | 2 | 3
  text: string
}

export interface SectionIndexBlock extends BlockBase {
  type: 'section-index'
  number: string
  title: string
}

export interface ParagraphBlock extends BlockBase {
  type: 'paragraph'
  text: string
}

export interface MediaBlock extends BlockBase {
  type: 'media'
  mediaType: 'image' | 'video'
  url: string
  /** 여러 이미지를 세로로 표시한다. 없으면 기존 url 필드를 단일 이미지로 사용한다. */
  urls?: string[]
  // mediaType === 'video'일 때: url에 입력한 Vimeo 링크에서 추출한 영상 ID
  vimeoId?: string
  caption?: string
}

export interface GalleryItem {
  url: string
  caption?: string
}

export interface GalleryBlock extends BlockBase {
  type: 'gallery'
  items: GalleryItem[]
}

export interface LinkBlock extends BlockBase {
  type: 'link'
  url: string
  style: 'bookmark' | 'inline'
  title?: string
  description?: string
  image?: string
}

export interface CodeBlock extends BlockBase {
  type: 'code'
  code: string
  language?: string
}

export interface HtmlBlock extends BlockBase {
  type: 'html'
  html: string
}

export interface DividerBlock extends BlockBase {
  type: 'divider'
}

export interface QuoteBlock extends BlockBase {
  type: 'quote'
  text: string
  cite?: string
}

export interface ListBlock extends BlockBase {
  type: 'list'
  style: 'bullet' | 'number'
  items: string[]
}

export interface EmbedBlock extends BlockBase {
  type: 'embed'
  url: string
  title?: string
}

export interface CalloutBlock extends BlockBase {
  type: 'callout'
  icon?: string
  text: string
}

// 과거(마크다운 단일 텍스트) 프로젝트 콘텐츠를 감싸는 호환용 블록
export interface LegacyMarkdownBlock extends BlockBase {
  type: 'legacy-markdown'
  text: string
}

export type Block =
  | HeadingBlock
  | SectionIndexBlock
  | ParagraphBlock
  | MediaBlock
  | GalleryBlock
  | LinkBlock
  | CodeBlock
  | HtmlBlock
  | DividerBlock
  | QuoteBlock
  | ListBlock
  | EmbedBlock
  | CalloutBlock
  | LegacyMarkdownBlock

export type BlockType = Block['type']

// 에디터의 "블록 추가" 메뉴에 노출되는 타입 (legacy-markdown 은 자동 생성 전용이라 제외)
export const INSERTABLE_BLOCK_TYPES: Exclude<BlockType, 'legacy-markdown'>[] = [
  'section-index',
  'heading',
  'paragraph',
  'media',
  'gallery',
  'link',
  'code',
  'html',
  'divider',
  'quote',
  'list',
  'embed',
  'callout',
]

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  'section-index': '섹션 인덱스',
  heading: '제목',
  paragraph: '문단',
  media: '이미지 / 영상',
  gallery: '갤러리',
  link: '링크',
  code: '코드',
  html: 'HTML',
  divider: '구분선',
  quote: '인용구',
  list: '리스트',
  embed: '임베드',
  callout: '콜아웃',
  'legacy-markdown': '레거시 마크다운',
}
