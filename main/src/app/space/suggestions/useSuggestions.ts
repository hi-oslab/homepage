'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useServerState, useToast } from '@/components/admin/ui'
import { callAction } from '@/lib/call-action'
import { SUGGESTION_STATUSES, type Suggestion, type SuggestionStatus } from '@/lib/suggestion-types'
import type { Viewer } from '../board/shared'
import {
  createSuggestionAction,
  createSuggestionCommentAction,
  deleteSuggestionAction,
  deleteSuggestionCommentAction,
  setSuggestionStatusAction,
} from './actions'

/** 건의 한 건을 다루는 동작 (목록 줄 · 모달이 받아 쓴다) */
export type SuggestionHandlers = {
  viewer: Viewer
  busy: boolean
  changeStatus: (item: Suggestion, status: SuggestionStatus) => void
  remove: (item: Suggestion) => void
  addComment: (item: Suggestion, body: string) => Promise<boolean>
  removeComment: (item: Suggestion, commentId: string) => void
}

/**
 * 건의사항 상태 + 서버 요청을 한곳에. 화면(홈 목록 · 모달)은 여기서 받은 값만 그린다.
 * items가 null이면 표가 아직 없는 것(마이그레이션 전)
 */
export function useSuggestions(initialItems: Suggestion[] | null, viewer: Viewer) {
  const router = useRouter()
  const toast = useToast()
  const [items, setItems] = useServerState(initialItems)
  const [isPending, startTransition] = useTransition()

  const active = (items ?? []).filter((item) => !item.archived)
  const archived = (items ?? []).filter((item) => item.archived)
  const patch = (id: string, next: Partial<Suggestion>) =>
    setItems((current) => (current ?? []).map((item) => (item.id === id ? { ...item, ...next } : item)))

  const create = (body: string) =>
    new Promise<boolean>((resolve) =>
      startTransition(async () => {
        const result = await callAction(() => createSuggestionAction(body))
        if ('message' in result) {
          toast.show(result.message, 'error')
          return resolve(false)
        }
        setItems((current) => [result.data!, ...(current ?? [])])
        toast.show('건의사항을 남겼어요')
        router.refresh()
        resolve(true)
      }),
    )

  const handlers: SuggestionHandlers = {
    viewer,
    busy: isPending,
    changeStatus: (item, status) => {
      if (item.status === status) return
      // 먼저 화면에 반영하고, 실패하면 되돌린다
      patch(item.id, { status })
      startTransition(async () => {
        const result = await callAction(() => setSuggestionStatusAction(item.id, status))
        if ('message' in result) {
          patch(item.id, { status: item.status })
          return toast.show(result.message, 'error')
        }
        patch(item.id, { status, ...result.data })
        toast.show(`'${SUGGESTION_STATUSES[status].label}'(으)로 바꿨어요`)
      })
    },
    remove: (item) => {
      if (!confirm('이 건의사항을 지울까요? 코멘트도 함께 지워져요.')) return
      startTransition(async () => {
        const result = await callAction(() => deleteSuggestionAction(item.id))
        if ('message' in result) return toast.show(result.message, 'error')
        setItems((current) => (current ?? []).filter((entry) => entry.id !== item.id))
        toast.show('건의사항을 지웠어요')
      })
    },
    addComment: (item, body) =>
      new Promise<boolean>((resolve) =>
        startTransition(async () => {
          const result = await callAction(() => createSuggestionCommentAction(item.id, body))
          if ('message' in result) {
            toast.show(result.message, 'error')
            return resolve(false)
          }
          patch(item.id, { comments: [...item.comments, result.data!] })
          resolve(true)
        }),
      ),
    removeComment: (item, commentId) => {
      if (!confirm('코멘트를 지울까요?')) return
      startTransition(async () => {
        const result = await callAction(() => deleteSuggestionCommentAction(commentId))
        if ('message' in result) return toast.show(result.message, 'error')
        patch(item.id, { comments: item.comments.filter((comment) => comment.id !== commentId) })
      })
    },
  }

  return { items, active, archived, create, handlers, busy: isPending, toast }
}
