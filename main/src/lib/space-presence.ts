import { createHash, createHmac } from 'crypto'

/** Realtime 채널에 계정 UUID를 직접 노출하지 않기 위한 안정적인 식별자. */
export function spacePresenceKey(userId: string): string {
  const secret = process.env.AUTH_SECRET || process.env.SUPABASE_SECRET_KEY
  if (!secret) throw new Error('Missing AUTH_SECRET')
  const key = createHash('sha256').update(`osl-presence:${secret}`).digest()
  return createHmac('sha256', key).update(userId).digest('hex').slice(0, 24)
}
