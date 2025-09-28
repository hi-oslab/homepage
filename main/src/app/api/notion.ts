// src/app/utils/notion.ts

import { Client } from '@notionhq/client'
import { BlockObjectResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { cache } from 'react'

// ✅ 로컬 페이지 데이터 가져오기 및 파싱
import { WORKS_TYPE, MEMBERS_TYPE } from './types'
import { ParsedType } from '@/types'

// ✅ Notion API 연결
const TOKEN = process.env.NEXT_PUBLIC_NOTION_TOKEN as string

const WORKS_ID = process.env.NEXT_PUBLIC_NOTION_WORKS_DATABASE_ID as string
const MEMBERS_ID = process.env.NEXT_PUBLIC_NOTION_MEMBERS_DATABASE_ID as string

export const notionClient = new Client({
  auth: TOKEN,
})

// ✅ 테이블 유형별 DATABASE_ID 매핑
const DATABASE_ID_MAP: Record<string, string> = {
  works: WORKS_ID,
  members: MEMBERS_ID,
}

// ✅ 타입 가드 함수 - PageObjectResponse인지 확인
function isFullPage(page: any): page is PageObjectResponse {
  return page && 'properties' in page && page.object === 'page'
}

// ✅ 특정 테이블에서 데이터 가져오기 (post, project 등) - 수정된 버전
export const getPagesByTableType = async (tableType: 'works' | 'members'): Promise<PageObjectResponse[]> => {
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
  tableType: 'works' | 'members',
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

// ✅ 특정 페이지의 블록 콘텐츠 가져오기 (캐싱 적용)
export const getPageContent = cache(async (pageId: string) => {
  try {
    const response = await notionClient.blocks.children.list({ block_id: pageId })
    return response.results as BlockObjectResponse[]
  } catch (error) {
    console.error(`Error fetching page content for pageId: ${pageId}`, error)
    return [] // 에러 발생 시 빈 배열 반환 (페이지 깨짐 방지)
  }
})

// 방법 2: 제네릭 타입을 사용하여 단일 함수로 처리
export function getParsedDataByTableType(itemType: 'works'): Promise<ParsedType['works'][]>
export function getParsedDataByTableType(itemType: 'members'): Promise<ParsedType['members'][]>
export async function getParsedDataByTableType(
  itemType: 'works' | 'members',
): Promise<ParsedType['works'][] | ParsedType['members'][]> {
  const rawItems = await getPagesByTableType(itemType)

  if (itemType === 'works') {
    return rawItems.map((rawItem) => {
      const item = rawItem as WORKS_TYPE
      const thumbnail = `https://designersejinoh.notion.site/image/${encodeURIComponent(
        item.properties.thumbnail?.files[0]?.file?.url || '',
      )}?table=block&id=${item.id}&cache=v2`

      return {
        id: item.id,
        properties: {
          slug: item.properties.slug?.rich_text[0]?.plain_text || '',
          thumbnail,
          title: item.properties.title?.title[0]?.plain_text || '',
          projectDate: item.properties.projectDate?.created_time || '',
          subtitle: item.properties.subtitle?.rich_text[0]?.plain_text || '',
          description: item.properties.description?.rich_text[0]?.plain_text || '',
          businessType: item.properties.businessType?.select?.name || '',
          category: item.properties.category?.select?.name || '',
          tags: item.properties.tags?.multi_select || [],
          createdTime: item.properties.createdTime?.created_time || '',
          lastEditedTime: item.properties.lastEditedTime?.last_edited_time || '',
        },
      }
    }) as ParsedType['works'][]
  } else {
    return rawItems.map((rawItem) => {
      const item = rawItem as MEMBERS_TYPE
      const coverImage = `https://designersejinoh.notion.site/image/${encodeURIComponent(
        item.properties.coverImage?.files[0]?.file?.url || '',
      )}?table=block&id=${item.id}&cache=v2`

      return {
        id: item.id,
        properties: {
          coverImage,
          name: item.properties.name?.title[0]?.plain_text || '',
          subName: item.properties.subName?.rich_text[0]?.plain_text || '',
          description: item.properties.description?.rich_text[0]?.plain_text || '',
          role: item.properties.role?.multi_select.map((role) => role.name) || [],
          field: item.properties.field?.multi_select.map((field) => field.name) || [],
          email: item.properties.email?.rich_text[0]?.plain_text || '',
          website: item.properties.website?.url || '',
        },
      }
    }) as ParsedType['members'][]
  }
}
