'use client'

import { useEffect, useState } from 'react'
import classNames from 'classnames'

interface LocationProps {
  className?: string
}

export const Location = ({ className }: LocationProps) => {
  const [location, setLocation] = useState('')
  const [latency, setLatency] = useState<number | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    const fetchLocation = async () => {
      try {
        const response = await fetch('https://geolocation-db.com/json/', {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error(`Location request failed: ${response.status}`)

        const data = (await response.json()) as {
          city?: string
          state?: string
          country_code?: string
        }
        const { city, state, country_code: countryCode } = data
        const displayCity = countryCode === 'KR' && city && /(-gu|-gun|구|군)$/i.test(city) && state ? state : city
        const parts = [displayCity, countryCode].filter(Boolean)

        setLocation(parts.length > 0 ? parts.join(', ') : 'Not Found')
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setLocation('Not Found')
        }
      }
    }

    const measureLatency = async () => {
      if (!navigator.onLine) {
        setIsOnline(false)
        setLatency(null)
        return
      }

      setIsOnline(true)

      try {
        const start = performance.now()
        const response = await fetch(`/icons/favicon.ico?t=${Date.now()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!response.ok) throw new Error(`Latency request failed: ${response.status}`)
        setLatency(Math.round(performance.now() - start))
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setLatency(null)
        }
      }
    }

    const handleOnline = () => {
      setIsOnline(true)
      void measureLatency()
    }
    const handleOffline = () => {
      setIsOnline(false)
      setLatency(null)
    }

    void fetchLocation()
    void measureLatency()

    const intervalId = window.setInterval(measureLatency, 10000)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getSignalLevel = (barCount: number) => {
    if (!isOnline || latency === null) return 0
    if (barCount === 3) return latency < 100 ? 3 : latency < 250 ? 2 : 1
    return latency < 80 ? 4 : latency < 150 ? 3 : latency < 300 ? 2 : 1
  }

  return (
    <div className={classNames('flex h-fit w-fit items-center justify-center gap-1 truncate leading-none', className)}>
      <div
        className='flex h-2 w-fit items-end justify-center gap-px'
        title={isOnline ? (latency !== null ? `${latency}ms` : 'Connection unavailable') : 'Offline'}
        aria-label={isOnline ? `Connection latency ${latency ?? 'unavailable'} ms` : 'Offline'}
      >
        {[1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={classNames(
              'hidden w-0.5 rounded-sm transition-colors duration-300 md:block',
              level <= getSignalLevel(4) ? 'bg-black' : 'bg-gray-300',
            )}
            style={{ height: `${level * 2}px` }}
          />
        ))}
        {[1, 2, 3].map((level) => (
          <span
            key={level}
            className={classNames(
              'w-0.5 rounded-sm transition-colors duration-300 md:hidden',
              level <= getSignalLevel(3) ? 'bg-black' : 'bg-gray-300',
            )}
            style={{ height: `${level * 2}px` }}
          />
        ))}
      </div>
      <span className='max-w-28 truncate tabular-nums leading-4 md:max-w-none'>{location || '...'}</span>
    </div>
  )
}
