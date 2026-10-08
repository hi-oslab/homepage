'use client'

import { createClient } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type PresenceValue = {
  onlineKeys: ReadonlySet<string>
  onlineCount: number
  ready: boolean
}

const PresenceContext = createContext<PresenceValue>({ onlineKeys: new Set(), onlineCount: 0, ready: false })

export function SpacePresenceProvider({
  presenceKey,
  allowedKeys,
  children,
}: {
  presenceKey: string
  allowedKeys: string[]
  children: React.ReactNode
}) {
  const [onlineKeys, setOnlineKeys] = useState<ReadonlySet<string>>(new Set())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!url || !publishableKey) return

    const supabase = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const channel = supabase.channel('osl-space-online', { config: { presence: { key: presenceKey } } })
    const allowed = new Set(allowedKeys)

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineKeys(new Set(Object.keys(channel.presenceState()).filter((key) => allowed.has(key))))
        setReady(true)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ onlineAt: new Date().toISOString() })
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setReady(false)
          setOnlineKeys(new Set())
        }
      })

    return () => {
      void channel.untrack()
      void supabase.removeChannel(channel)
    }
  }, [allowedKeys, presenceKey])

  const value = useMemo(() => ({ onlineKeys, onlineCount: onlineKeys.size, ready }), [onlineKeys, ready])
  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
}

export const useSpacePresence = () => useContext(PresenceContext)
