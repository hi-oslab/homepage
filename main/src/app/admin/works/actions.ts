'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canEditWork, requireMaster, requireUser } from '@/lib/admin-auth'
import { createWork, getAdminWork, removeWork, reorderWorks, updateWork } from '@/lib/cms'
import type { WorkInput } from '@/types/cms'

// 작품이 노출되는 공개 페이지들
function revalidateWorkPages(slugs: string[] = []) {
  revalidatePath('/')
  revalidatePath('/work')
  for (const slug of slugs) revalidatePath(`/work/${slug}`)
  revalidatePath('/admin', 'layout')
}

/** 로그인한 사용자가 이 작품을 편집할 수 있는지 확인하고 작품을 돌려준다 */
async function requireEditableWork(id: string) {
  const user = await requireUser()
  const work = await getAdminWork(id)
  if (!work || !canEditWork(user, work)) throw new Error('Forbidden')
  return work
}

export async function createWorkAction() {
  const user = await requireUser()
  const work = await createWork(user.id)
  redirect(`/admin/works/${work.id}`)
}

export async function updateWorkAction(id: string, input: Partial<WorkInput>) {
  const previous = await requireEditableWork(id)
  const work = await updateWork(id, input)
  revalidateWorkPages([work.slug, ...(previous.slug !== work.slug ? [previous.slug] : [])])
  return work
}

export async function setWorkPublishedAction(id: string, published: boolean) {
  await requireEditableWork(id)
  const work = await updateWork(id, { published })
  revalidateWorkPages([work.slug])
  return work
}

export async function reorderWorksAction(ids: string[]) {
  await requireMaster()
  await reorderWorks(ids)
  revalidateWorkPages()
}

export async function deleteWorkAction(id: string) {
  const work = await requireEditableWork(id)
  await removeWork(id)
  revalidateWorkPages([work.slug])
}
