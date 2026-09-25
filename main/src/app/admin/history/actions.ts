'use server'

import { revalidatePath } from 'next/cache'
import { requireMaster } from '@/lib/admin-auth'
import { createHistoryItem, removeHistoryItem, updateHistoryItem } from '@/lib/cms'
import type { HistoryInput, HistoryItem } from '@/types/cms'

type Result = { ok: true; item?: HistoryItem } | { ok: false; message: string }

/** 입력값 정리 + 검증 */
function clean(input: Partial<HistoryInput>): Partial<HistoryInput> | string {
  const next: Partial<HistoryInput> = { ...input }
  if ('year' in input) {
    const year = Number(input.year)
    if (!Number.isInteger(year) || year < 2000 || year > 2100) return '연도를 확인해 주세요.'
    next.year = year
  }
  if ('month' in input) next.month = input.month ? Number(input.month) : null
  if ('title' in input) {
    next.title = (input.title ?? '').trim()
    if (!next.title) return '내용을 입력해 주세요.'
  }
  for (const key of ['category', 'detail', 'link'] as const) if (key in input) next[key] = (input[key] ?? '').trim()
  return next
}

// 연혁은 마스터만 관리한다
async function run(task: () => Promise<Result>): Promise<Result> {
  try {
    await requireMaster()
    const result = await task()
    revalidatePath('/about')
    return result
  } catch (error) {
    console.error(error)
    return { ok: false, message: '저장하지 못했습니다.' }
  }
}

export async function createHistoryAction(input: HistoryInput) {
  return run(async () => {
    const value = clean(input)
    if (typeof value === 'string') return { ok: false, message: value }
    return { ok: true, item: await createHistoryItem(value as HistoryInput) }
  })
}

export async function updateHistoryAction(id: string, input: Partial<HistoryInput>) {
  return run(async () => {
    const value = clean(input)
    if (typeof value === 'string') return { ok: false, message: value }
    return { ok: true, item: await updateHistoryItem(id, value) }
  })
}

export async function deleteHistoryAction(id: string) {
  return run(async () => {
    await removeHistoryItem(id)
    return { ok: true }
  })
}
