// src/app/utils/notion.ts

import { Client } from '@notionhq/client'
import { BlockObjectResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { cache } from 'react'

import { DATABASE_REGISTRY, TableType, ParsedItem, parseBySchema } from './schema'

// ✅ Notion API 연결
const TOKEN = process.env.NEXT_PUBLIC_NOTION_TOKEN as string

export const notionClient = new Client({
  auth: TOKEN,
})

// ✅ registry에서 DATABASE_ID 자동 생성
const DATABASE_ID_MAP = Object.fromEntries(
  Object.entries(DATABASE_REGISTRY).map(([key, { envKey }]) => [key, process.env[envKey] as string]),
) as Record<TableType, string>

// ✅ 타입 가드 함수 - PageObjectResponse인지 확인
function isFullPage(page: any): page is PageObjectResponse {
  return page && 'properties' in page && page.object === 'page'
}

// ✅ 특정 테이블에서 데이터 가져오기 (post, project 등) - 수정된 버전
export const getPagesByTableType = async (tableType: TableType): Promise<PageObjectResponse[]> => {
  const databaseId = DATABASE_ID_MAP[tableType]
  if (!databaseId) throw new Error(`Invalid tableType: ${tableType}`)

  const response = await notionClient.databases.query({
    database_id: databaseId,
    filter: {
      property: 'published',
      checkbox: { equals: true },
    },
  })

  // 타입 가드를 사용하여 PageObjectResponse만 필터링하여 반환
  return response.results.filter(isFullPage)
}

// ✅ 특정 테이블에서 Slug로 페이지 가져오기
export const getPageBySlug = async (
  tableType: TableType,
  slug: string,
): Promise<PageObjectResponse | undefined> => {
  const databaseId = DATABASE_ID_MAP[tableType]
  if (!databaseId) throw new Error(`Invalid tableType: ${tableType}`)

  const response = await notionClient.databases.query({
    database_id: databaseId,
    filter: {
      property: 'slug',
      rich_text: {
        equals: slug,
      },
    },
  })

  const firstResult = response.results[0]
  return firstResult && isFullPage(firstResult) ? firstResult : undefined
}

// 자식 블록을 포함하는 확장 타입
export type BlockWithChildren = BlockObjectResponse & { children?: BlockWithChildren[] }

// ✅ 특정 페이지의 블록 콘텐츠 가져오기 - has_children 블록의 자식을 재귀적으로 fetch
export const getPageContent = cache(async (pageId: string): Promise<BlockWithChildren[]> => {
  try {
    const response = await notionClient.blocks.children.list({ block_id: pageId })
    const blocks = response.results as BlockObjectResponse[]

    return Promise.all(
      blocks.map(async (block) => {
        if (block.has_children) {
          const children = await getPageContent(block.id)
          return { ...block, children }
        }
        return block
      }),
    )
  } catch (error) {
    console.error(`Error fetching page content for pageId: ${pageId}`, error)
    return []
  }
})

// ✅ 파싱된 데이터 가져오기 - 스키마는 schema.ts에서 관리
export async function getParsedDataByTableType<T extends TableType>(itemType: T): Promise<ParsedItem<T>[]> {
  const rawItems = await getPagesByTableType(itemType)
  const { schema } = DATABASE_REGISTRY[itemType]
  return rawItems.map((item) => parseBySchema(schema, item)) as ParsedItem<T>[]
}
