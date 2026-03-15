//@/types/index.ts

import { WorksItem, MembersItem } from '@/app/api/schema'

// ParsedType은 기존 컴포넌트 호환성을 위해 유지
// 실제 타입 정의는 src/app/api/schema.ts에서 관리됩니다.
export interface ParsedType {
  works: WorksItem
  members: MembersItem
}
