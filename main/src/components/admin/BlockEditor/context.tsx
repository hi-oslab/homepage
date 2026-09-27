'use client'

import { createContext, useContext, useEffect } from 'react'
import type { Block } from '@/types/blocks'

/** 커서를 둘 위치: 처음 · 끝 · 몇 번째 글자 */
export type FocusPosition = 'start' | 'end' | number

/** 글 블록이 에디터에 알리는 키 · 입력 (블록 사이 이동, 나누기 · 합치기, '/' 메뉴) */
export type EditorApi = {
  /** 블록이 자기 입력칸에 커서를 두는 방법을 등록한다 */
  registerFocus: (id: string, focus: (position: FocusPosition) => void) => () => void
  /** 한 칸짜리 글 블록 공통 키 처리 (field: 블록의 글 속성 이름) */
  onTextKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>, block: Block, field: 'text' | 'title') => void
  /** 글이 바뀔 때 ('/' 메뉴 · 마크다운 단축키) */
  onTextChange: (block: Block, field: 'text' | 'title', value: string) => void
  /** 블록 통째로 바꾸기 */
  update: (block: Block) => void
  /** 앞 · 뒤 블록으로 커서 옮기기 (없으면 false) */
  focusSibling: (id: string, direction: -1 | 1) => boolean
  /** 이 블록 뒤에 문단을 넣고 커서를 옮긴다 */
  insertParagraphAfter: (id: string, text?: string) => void
  /** 블록을 문단으로 바꾼다 (목록을 비웠을 때 등) */
  toParagraph: (id: string, text?: string) => void
  remove: (id: string, focus?: -1 | 1) => void
}

export const EditorContext = createContext<EditorApi | null>(null)

export function useEditor() {
  const api = useContext(EditorContext)
  if (!api) throw new Error('BlockEditor 안에서만 쓸 수 있어요')
  return api
}

/** 입력칸 하나에 커서 두기 */
export function placeCaret(element: HTMLTextAreaElement | HTMLInputElement | null, position: FocusPosition) {
  if (!element) return
  element.focus()
  const length = element.value.length
  const at = position === 'start' ? 0 : position === 'end' ? length : Math.min(position, length)
  element.setSelectionRange(at, at)
}

/** 블록의 커서 두기 방법을 등록 (마운트 동안) */
export function useFocusRegistration(id: string, focus: (position: FocusPosition) => void) {
  const { registerFocus } = useEditor()
  useEffect(() => registerFocus(id, focus), [id, focus, registerFocus])
}
