'use client'

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { GoMute, GoPlay, GoScreenFull, GoScreenNormal, GoUnmute } from 'react-icons/go'
import classNames from 'classnames'
import { buildVimeoEmbedUrl } from '@/lib/vimeo'

type VimeoMessage = {
  event?: string
  method?: string
  value?: number | boolean | { seconds?: number; duration?: number; volume?: number }
}

export function VimeoPlayer({
  source,
  title = 'Vimeo video',
  className,
  fill = false,
  showControls = true,
}: {
  source: string
  title?: string
  className?: string
  fill?: boolean
  showControls?: boolean
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoplayCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasPlayed = useRef(false)
  const userInteracted = useRef(false)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [controlsVisible, setControlsVisible] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0
  const embedUrl = buildVimeoEmbedUrl(source, {
    autoplay: '1',
    muted: '1',
    loop: '1',
    background: '1',
    autopause: '0',
    api: '1',
  })

  const send = useCallback((method: string, value?: number | string) => {
    iframeRef.current?.contentWindow?.postMessage(value === undefined ? { method } : { method, value }, '*')
  }, [])

  const revealControls = useCallback(() => {
    setControlsVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2600)
  }, [])

  const subscribe = useCallback(() => {
    ;['play', 'pause', 'timeupdate', 'volumechange', 'ended'].forEach((event) => send('addEventListener', event))
    send('getDuration')
    send('getCurrentTime')
    send('getVolume')
  }, [send])

  const checkAutoplay = useCallback(() => {
    subscribe()
    if (autoplayCheckTimer.current) clearTimeout(autoplayCheckTimer.current)
    autoplayCheckTimer.current = setTimeout(() => send('getPaused'), 1200)
  }, [send, subscribe])

  useEffect(() => {
    const onMessage = (event: MessageEvent<VimeoMessage | string>) => {
      if (!event.origin.endsWith('vimeo.com') || event.source !== iframeRef.current?.contentWindow) return
      let message: VimeoMessage
      try {
        message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      } catch {
        return
      }
      if (message.event === 'ready') subscribe()
      if (message.event === 'play') {
        hasPlayed.current = true
        setAutoplayBlocked(false)
        setPlaying(true)
      }
      if (message.event === 'pause' || message.event === 'ended') setPlaying(false)
      if (message.event === 'timeupdate' && typeof message.value === 'object') {
        setCurrentTime(message.value.seconds ?? 0)
        setDuration(message.value.duration ?? 0)
      }
      if (message.event === 'volumechange' && typeof message.value === 'object') {
        setMuted((message.value.volume ?? 0) === 0)
      }
      if (message.method === 'getDuration' && typeof message.value === 'number') setDuration(message.value)
      if (message.method === 'getCurrentTime' && typeof message.value === 'number') setCurrentTime(message.value)
      if (message.method === 'getPaused' && typeof message.value === 'boolean') {
        setPlaying(!message.value)
        if (message.value && !hasPlayed.current && !userInteracted.current) setAutoplayBlocked(true)
      }
      if (message.method === 'getVolume' && typeof message.value === 'number') setMuted(message.value === 0)
    }

    window.addEventListener('message', onMessage)
    const progressTimer = window.setInterval(() => {
      send('getCurrentTime')
      if (!duration) send('getDuration')
    }, 500)
    return () => {
      window.removeEventListener('message', onMessage)
      window.clearInterval(progressTimer)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      if (autoplayCheckTimer.current) clearTimeout(autoplayCheckTimer.current)
    }
  }, [duration, send, subscribe])

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(document.fullscreenElement === containerRef.current)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const togglePlayback = () => {
    userInteracted.current = true
    send(playing ? 'pause' : 'play')
    setPlaying((value) => !value)
    revealControls()
  }

  const startBlockedPlayback = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    userInteracted.current = true
    setPlaying(true)
    send('play')
    if (showControls) revealControls()
  }

  const toggleMuted = () => {
    send('setVolume', muted ? 1 : 0)
    setMuted((value) => !value)
    revealControls()
  }

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await containerRef.current?.requestFullscreen()
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error)
    }
    revealControls()
  }

  return (
    <div
      ref={containerRef}
      className={classNames(
        'group overflow-hidden rounded-sm bg-black',
        fill ? 'relative size-full' : 'relative aspect-video w-full',
        fullscreen && 'size-full aspect-auto rounded-none',
        className,
      )}
      data-cursor={showControls ? 'pointer' : undefined}
      onMouseEnter={showControls ? revealControls : undefined}
      onMouseMove={showControls ? revealControls : undefined}
      onFocusCapture={showControls ? revealControls : undefined}
      onTouchStart={showControls ? revealControls : undefined}
      onClick={showControls ? togglePlayback : undefined}
      onKeyDown={(event) => {
        if (!showControls) return
        if (event.target !== event.currentTarget) return
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault()
          togglePlayback()
        }
      }}
      role={showControls ? 'button' : undefined}
      tabIndex={showControls ? 0 : undefined}
      aria-label={showControls ? (playing ? `${title} 일시정지` : `${title} 재생`) : title}
    >
      {embedUrl && (
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className='pointer-events-none absolute inset-0 size-full border-0'
          allow='autoplay; fullscreen; picture-in-picture'
          title={title}
          onLoad={checkAutoplay}
        />
      )}

      {autoplayBlocked && (
        <button
          type='button'
          onClick={startBlockedPlayback}
          className='absolute left-1/2 top-1/2 z-20 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white shadow-lg backdrop-blur-md transition-[background-color,transform] hover:scale-105 hover:bg-black/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:size-16'
          aria-label={`${title} 재생`}
        >
          <GoPlay size={24} className='translate-x-px' />
        </button>
      )}

      {showControls && (
        <div
          className={`absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-10 text-white transition-[opacity,transform] duration-300 md:gap-3 md:px-4 md:pb-4 ${
            controlsVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
          }`}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type='button'
            onClick={togglePlayback}
            className='flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-colors hover:bg-white/30'
            aria-label={playing ? '일시정지' : '재생'}
          >
            {playing ? (
              <span className='flex gap-[3px]' aria-hidden='true'>
                <span className='h-3.5 w-[3px] bg-white' />
                <span className='h-3.5 w-[3px] bg-white' />
              </span>
            ) : (
              <GoPlay size={16} />
            )}
          </button>

          <div className='relative h-8 min-w-0 flex-1'>
            <div className='pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/30'>
              <span className='block h-full rounded-full bg-white' style={{ width: `${progress}%` }} />
            </div>
            <span
              className='pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm'
              style={{ left: `${progress}%` }}
            />
            <input
              type='range'
              min={0}
              max={duration || 1}
              step='0.01'
              value={Math.min(currentTime, duration || 1)}
              onChange={(event) => {
                const value = Number(event.target.value)
                setCurrentTime(value)
                send('setCurrentTime', value)
                revealControls()
              }}
              className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
              aria-label='재생 위치'
            />
          </div>

          <button
            type='button'
            onClick={toggleMuted}
            className='flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-colors hover:bg-white/30'
            aria-label={muted ? '소리 켜기' : '음소거'}
          >
            {muted ? <GoMute size={16} /> : <GoUnmute size={16} />}
          </button>
          <button
            type='button'
            onClick={toggleFullscreen}
            className='flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-colors hover:bg-white/30'
            aria-label={fullscreen ? '전체화면 종료' : '전체화면'}
          >
            {fullscreen ? <GoScreenNormal size={16} /> : <GoScreenFull size={16} />}
          </button>
        </div>
      )}
    </div>
  )
}
