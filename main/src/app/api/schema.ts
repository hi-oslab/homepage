/**
 * ✅ Notion 데이터베이스 스키마 정의 (단일 진실 공급원)
 *
 * 노션에서 속성을 추가/수정/삭제할 때 이 파일만 수정하면 됩니다.
 *
 * 지원하는 Notion 속성 타입:
 *   'title'               → string
 *   'rich_text'           → string
 *   'number'              → number
 *   'select'              → string
 *   'multi_select'        → { name: string }[]
 *   'multi_select_names'  → string[]          (이름만 추출)
 *   'date'                → { start: string; end?: string }
 *   'files_image'         → string            (Notion 프록시 이미지 URL)
 *   'url'                 → string
 *   'created_time'        → string
 *   'last_edited_time'    → string
 */

// ─── 타입 헬퍼 ────────────────────────────────────────────────────────────────

type FieldType =
  | 'title'
  | 'rich_text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'multi_select_names'
  | 'date'
  | 'files_image'
  | 'url'
  | 'created_time'
  | 'last_edited_time'

type ParsedField<T extends FieldType> = T extends
  | 'title'
  | 'rich_text'
  | 'select'
  | 'url'
  | 'created_time'
  | 'last_edited_time'
  ? string
  : T extends 'number'
    ? number
    : T extends 'multi_select'
      ? { name: string }[]
      : T extends 'multi_select_names'
        ? string[]
        : T extends 'files_image'
          ? string
          : T extends 'date'
            ? { start: string; end?: string }
            : never

type Schema = Record<string, FieldType>

export type ParsedFromSchema<S extends Schema> = {
  id: string
  properties: { [K in keyof S]: ParsedField<S[K]> }
}

// ─── 데이터베이스 등록부 ──────────────────────────────────────────────────────
// DB 추가/수정/삭제 시 DATABASE_REGISTRY만 수정하면 됩니다.
// envKey: .env에 있는 환경변수 이름

type DatabaseRegistry = Record<string, { envKey: string; schema: Schema }>

export const DATABASE_REGISTRY = {
  works: {
    envKey: 'NEXT_PUBLIC_NOTION_WORKS_DATABASE_ID',
    schema: {
      slug: 'rich_text',
      thumbnail: 'files_image',
      title: 'title',
      year: 'number',
      projectDate: 'date',
      subtitle: 'rich_text',
      description: 'rich_text',
      category: 'select',
      tags: 'multi_select',
      createdTime: 'created_time',
      lastEditedTime: 'last_edited_time',
    },
  },
  members: {
    envKey: 'NEXT_PUBLIC_NOTION_MEMBERS_DATABASE_ID',
    schema: {
      coverImage: 'files_image',
      name: 'title',
      subName: 'rich_text',
      description: 'rich_text',
      role: 'select',
      field: 'multi_select_names',
      email: 'rich_text',
      website: 'url',
    },
  },
} as const satisfies DatabaseRegistry

// ─── 파싱된 타입 (스키마에서 자동 추론) ──────────────────────────────────────

export type TableType = keyof typeof DATABASE_REGISTRY
export type ParsedItem<T extends TableType> = ParsedFromSchema<(typeof DATABASE_REGISTRY)[T]['schema']>

// 기존 named 타입 (컴포넌트에서 직접 참조 시 사용)
export type WorksItem = ParsedItem<'works'>
export type MembersItem = ParsedItem<'members'>

// ─── 제네릭 파서 ─────────────────────────────────────────────────────────────

const NOTION_IMAGE_HOST = 'https://designersejinoh.notion.site'

function extractField(type: FieldType, prop: any, pageId: string): any {
  if (!prop) {
    switch (type) {
      case 'number':
        return 0
      case 'multi_select':
        return []
      case 'multi_select_names':
        return []
      case 'date':
        return { start: '' }
      default:
        return ''
    }
  }
  switch (type) {
    case 'title':
      return prop.title[0]?.plain_text || ''
    case 'rich_text':
      return prop.rich_text[0]?.plain_text || ''
    case 'number':
      return prop.number ?? 0
    case 'select':
      return prop.select?.name || ''
    case 'multi_select':
      return prop.multi_select || []
    case 'multi_select_names':
      return prop.multi_select?.map((s: { name: string }) => s.name) || []
    case 'date':
      return prop.date || { start: '' }
    case 'url':
      return prop.url || ''
    case 'created_time':
      return prop.created_time || ''
    case 'last_edited_time':
      return prop.last_edited_time || ''
    case 'files_image': {
      const fileUrl = prop.files?.[0]?.file?.url || ''
      return fileUrl
        ? `${NOTION_IMAGE_HOST}/image/${encodeURIComponent(fileUrl)}?table=block&id=${pageId}&cache=v2`
        : ''
    }
  }
}

export function parseBySchema<S extends Schema>(
  schema: S,
  rawItem: { id: string; properties: Record<string, any> },
): ParsedFromSchema<S> {
  const properties: Record<string, any> = {}
  for (const [key, fieldType] of Object.entries(schema)) {
    properties[key] = extractField(fieldType, rawItem.properties[key], rawItem.id)
  }
  return { id: rawItem.id, properties: properties as ParsedFromSchema<S>['properties'] }
}
