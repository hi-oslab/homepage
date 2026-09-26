'use client'

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { GoMute, GoPlay, GoScreenFull, GoScreenNormal, GoUnmute } from 'react-icons/go'
import classNames from 'classnames'
import { buildVimeoEmbedUrl } from '@/lib/vimeo'
import { buildYoutubeEmbedUrl, parseYoutubeSource } from '@/lib/youtube'

/* ─── 공급자별 드라이버 ────────────────────────────────────────────────── */
// 플레이어 UI(음소거 자동재생 + 커스텀 컨트롤)는 같고, iframe과 주고받는 메시지 형식만 다르다.

type PlayerUpdate = { ready?: boolean; playing?: boolean; currentTime?: number; duration?: number; muted?: boolean }
type Post = (message: unknown) => void

type Driver = {
  buildUrl: (source: string) => string | null
  isOwnOrigin: (origin: string) => boolean
  /** iframe 준비 후 이벤트 구독 */
  connect: (post: Post) => void
  /** 현재 재생 상태 요청 (자동재생 차단 확인용) */
  requestState: (post: Post) => void
  poll: (post: Post) => void
  parse: (data: unknown) => PlayerUpdate | null
  play: (post: Post) => void
  pause: (post: Post) => void
  setMuted: (post: Post, muted: boolean) => void
  seek: (post: Post, seconds: number) => void
}

const parseJson = (data: unknown) => {
  try {
    return (typeof data === 'string' ? JSON.parse(data) : data) as Record<string, unknown>
  } catch {
    return null
  }
}

const vimeoDriver: Driver = {
  buildUrl: (source) =>
    buildVimeoEmbedUrl(source, { autoplay: '1', muted: '1', loop: '1', background: '1', autopause: '0', api: '1' }),
  isOwnOrigin: (origin) => origin.endsWith('vimeo.com'),
  connect: (post) => {
    ;['play', 'pause', 'timeupdate', 'volumechange', 'ended'].forEach((event) =>
      post({ method: 'addEventListener', value: event }),
    )
    // getVolume은 묻지 않는다: 배경(background) 모드는 실제로 음소거인데도 볼륨을 1로 알려준다
    ;['getDuration', 'getCurrentTime'].forEach((method) => post({ method }))
  },
  requestState: (post) => post({ method: 'getPaused' }),
  poll: (post) => {
    post({ method: 'getCurrentTime' })
    post({ method: 'getDuration' })
  },
  parse: (data) => {
    const message = parseJson(data)
    if (!message) return null
    const value = message.value as number | boolean | { seconds?: number; duration?: number; volume?: number }
    switch (message.event) {
      case 'ready':
        return { ready: true }
      case 'play':
        return { playing: true }
      case 'pause':
      case 'ended':
        return { playing: false }
      case 'timeupdate':
        return typeof value === 'object' ? { currentTime: value.seconds ?? 0, duration: value.duration ?? 0 } : null
      case 'volumechange':
        return typeof value === 'object' ? { muted: (value.volume ?? 0) === 0 } : null
    }
    switch (message.method) {
      case 'getDuration':
        return typeof value === 'number' ? { duration: value } : null
      case 'getCurrentTime':
        return typeof value === 'number' ? { currentTime: value } : null
      case 'getPaused':
        return typeof value === 'boolean' ? { playing: !value } : null
      case 'getVolume':
        return typeof value === 'number' ? { muted: value === 0 } : null
    }
    return null
  },
  play: (post) => post({ method: 'play' }),
  pause: (post) => post({ method: 'pause' }),
  setMuted: (post, muted) => post({ method: 'setVolume', value: muted ? 0 : 1 }),
  seek: (post, seconds) => post({ method: 'setCurrentTime', value: seconds }),
}

// YouTube IFrame API: JSON 문자열로 명령을 보내고, 'listening' 이후 infoDelivery로 상태를 받는다
const youtubeCommand = (post: Post, func: string, args: unknown[] = []) =>
  post(JSON.stringify({ event: 'command', func, args, id: 1, channel: 'widget' }))

const youtubeDriver: Driver = {
  buildUrl: (source) => {
    const id = parseYoutubeSource(source)?.id
    if (!id) return null
    return buildYoutubeEmbedUrl(source, {
      autoplay: '1',
      mute: '1',
      loop: '1',
      playlist: id, // 한 영상 반복 재생에 필요
      controls: '0',
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
      iv_load_policy: '3',
      disablekb: '1',
      enablejsapi: '1',
      origin: window.location.origin,
    })
  },
  isOwnOrigin: (origin) => /(^|\.)youtube(-nocookie)?\.com$/.test(new URL(origin).hostname),
  connect: (post) => {
    post(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }))
    youtubeCommand(post, 'addEventListener', ['onStateChange'])
  },
  requestState: (post) => post(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' })),
  // 'listening' 이후에는 YouTube가 infoDelivery를 계속 보내준다
  poll: () => undefined,
  parse: (data) => {
    const message = parseJson(data)
    if (!message) return null
    if (message.event === 'onReady') return { ready: true }
    if (message.event === 'onStateChange' && typeof message.info === 'number') {
      // 1 재생, 3 버퍼링, 2 일시정지, 0 종료
      return message.info === 1 || message.info === 3 ? { playing: true } : message.info === 2 ? { playing: false } : null
    }
    if ((message.event === 'infoDelivery' || message.event === 'initialDelivery') && message.info) {
      const info = message.info as { currentTime?: number; duration?: number; playerState?: number; muted?: boolean }
      const update: PlayerUpdate = {}
      if (typeof info.currentTime === 'number') update.currentTime = info.currentTime
      if (typeof info.duration === 'number' && info.duration > 0) update.duration = info.duration
      if (typeof info.muted === 'boolean') update.muted = info.muted
      if (info.playerState === 1 || info.playerState === 3) update.playing = true
      if (info.playerState === 2) update.playing = false
      return update
    }
    return null
  },
  play: (post) => youtubeCommand(post, 'playVideo'),
  pause: (post) => youtubeCommand(post, 'pauseVideo'),
  setMuted: (post, muted) => youtubeCommand(post, muted ? 'mute' : 'unMute'),
  seek: (post, seconds) => youtubeCommand(post, 'seekTo', [seconds, true]),
}

const DRIVERS = { vimeo: vimeoDriver, youtube: youtubeDriver }
export type VideoProvider = keyof typeof DRIVERS

/* ─── 공용 플레이어 ────────────────────────────────────────────────────── */

type PlayerProps = {
  source: string
  title?: string
  className?: string
  fill?: boolean
  showControls?: boolean
}

export function EmbedVideoPlayer({
  provider,
  source,
  title = 'Video',
  className,
  fill = false,
  showControls = true,
}: PlayerProps & { provider: VideoProvider }) {
  const driver = DRIVERS[provider]
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoplayTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const hasPlayed = useRef(false)
  const userInteracted = useRef(false)
  // origin 파라미터 등 브라우저 정보가 필요하므로 마운트 후에 주소를 만든다
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [controlsVisible, setControlsVisible] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0

  useEffect(() => {
    setEmbedUrl(driver.buildUrl(source))
  }, [driver, source])

  const post = useCallback<Post>((message) => {
    iframeRef.current?.contentWindow?.postMessage(message, '*')
  }, [])

  const revealControls = useCallback(() => {
    setControlsVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2600)
  }, [])

  // iframe 로드 → 구독 → 잠시 뒤 재생 상태 확인 → 재생된 적 없으면 자동재생 차단으로 보고 재생 버튼 표시
  const onIframeLoad = useCallback(() => {
    driver.connect(post)
    autoplayTimers.current.forEach(clearTimeout)
    autoplayTimers.current = [
      setTimeout(() => driver.requestState(post), 1200),
      setTimeout(() => {
        if (!hasPlayed.current && !userInteracted.current) setAutoplayBlocked(true)
      }, 2000),
    ]
  }, [driver, post])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return
      try {
        if (!driver.isOwnOrigin(event.origin)) return
      } catch {
        return
      }
      const update = driver.parse(event.data)
      if (!update) return
      if (update.ready) driver.connect(post)
      if (update.playing !== undefined) {
        setPlaying(update.playing)
        if (update.playing) {
          hasPlayed.current = true
          setAutoplayBlocked(false)
        }
      }
      if (update.currentTime !== undefined) setCurrentTime(update.currentTime)
      if (update.duration !== undefined) setDuration(update.duration)
      if (update.muted !== undefined) setMuted(update.muted)
    }

    window.addEventListener('message', onMessage)
    const progressTimer = window.setInterval(() => driver.poll(post), 500)
    return () => {
      window.removeEventListener('message', onMessage)
      window.clearInterval(progressTimer)
    }
  }, [driver, post])

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      autoplayTimers.current.forEach(clearTimeout)
    },
    [],
  )

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(document.fullscreenElement === containerRef.current)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const togglePlayback = () => {
    userInteracted.current = true
    if (playing) driver.pause(post)
    else driver.play(post)
    setPlaying((value) => !value)
    revealControls()
  }

  const startBlockedPlayback = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    userInteracted.current = true
    setAutoplayBlocked(false)
    setPlaying(true)
    driver.play(post)
    if (showControls) revealControls()
  }

  const toggleMuted = () => {
    driver.setMuted(post, !muted)
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
          allow='autoplay; fullscreen; picture-in-picture; encrypted-media'
          title={title}
          onLoad={onIframeLoad}
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
                driver.seek(post, value)
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

export const VimeoPlayer = (props: PlayerProps) => <EmbedVideoPlayer provider='vimeo' title='Vimeo video' {...props} />
export const YoutubePlayer = (props: PlayerProps) => <EmbedVideoPlayer provider='youtube' title='YouTube video' {...props} />
