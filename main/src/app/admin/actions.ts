'use server'

import { revalidatePath } from 'next/cache'

export async function checkPassword(password: string): Promise<boolean> {
  return password === process.env.ADMIN_PASSWORD
}

export async function revalidateAll(): Promise<{ ok: boolean }> {
  try {
    revalidatePath('/work', 'layout')
    revalidatePath('/about', 'layout')
    return { ok: true }
  } catch {
    return { ok: false }
  }
}
