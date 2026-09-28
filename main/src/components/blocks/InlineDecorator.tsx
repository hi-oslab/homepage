'use client'

import { createContext, useContext, type ReactNode } from 'react'

/**
 * 문단 블록의 평범한 글자 조각을 한 번 더 꾸밀 수 있게 한다 (게시판 글의 '@멘션' 등).
 * 기본은 없음 → 공개 페이지 · 프로젝트 본문은 그대로.
 */
export type InlineDecorate = (text: string) => ReactNode

const InlineDecoratorContext = createContext<InlineDecorate | null>(null)

export const useInlineDecorator = () => useContext(InlineDecoratorContext)

export const InlineDecoratorProvider = ({ decorate, children }: { decorate: InlineDecorate; children: ReactNode }) => (
  <InlineDecoratorContext.Provider value={decorate}>{children}</InlineDecoratorContext.Provider>
)
