'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { GoCheck, GoFileMedia, GoSearch, GoSync } from 'react-icons/go'
import { PageHeader } from '@/components/admin/ui'

type Reference = { kind: 'work' | 'member'; id: string; title: string; source: string }
type MediaFile = {
  key: string
  url: string
  size: number
  lastModified: string | null
  mimeType: string
  optimizable: boolean
  references: Reference[]
}
type Filter = 'all' | 'used' | 'unused' | 'optimizable'

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

export function MediaManager() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/media/manage', { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || '미디어 조회 실패')
      setFiles(body.files ?? [])
      setSelected(new Set())
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '미디어 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const visible = useMemo(() => files.filter((file) => {
    if (filter === 'used' && file.references.length === 0) return false
    if (filter === 'unused' && file.references.length > 0) return false
    if (filter === 'optimizable' && (!file.optimizable || file.references.length === 0)) return false
    return !query.trim() || file.key.toLowerCase().includes(query.trim().toLowerCase())
  }), [files, filter, query])

  const selectable = visible.filter((file) => file.optimizable && file.references.length > 0)
  const allVisibleSelected = selectable.length > 0 && selectable.every((file) => selected.has(file.key))
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const selectedSize = files.filter((file) => selected.has(file.key)).reduce((sum, file) => sum + file.size, 0)

  const toggle = (key: string) => setSelected((current) => {
    const next = new Set(current)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  const optimize = async () => {
    const keys = Array.from(selected)
    if (keys.length === 0 || !confirm(`선택한 이미지 ${keys.length}개를 최적화하시겠습니까?\nDB의 이미지 주소가 자동으로 변경됩니다.`)) return
    setOptimizing(true)
    setProgress({ done: 0, total: keys.length })
    setMessage('')
    let saved = 0
    let optimizedCount = 0
    let skippedCount = 0
    let failedCount = 0

    for (const key of keys) {
      try {
        const response = await fetch('/api/media/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        })
        const body = await response.json()
        if (!response.ok) throw new Error(body.message || '최적화 실패')
        if (body.skipped) skippedCount += 1
        else {
          optimizedCount += 1
          saved += Math.max(0, Number(body.beforeSize) - Number(body.afterSize))
        }
      } catch {
        failedCount += 1
      } finally {
        setProgress((current) => ({ ...current, done: current.done + 1 }))
      }
    }
    const resultMessage = `완료: ${optimizedCount}개 최적화 · ${skippedCount}개 유지 · ${failedCount}개 실패 · ${formatBytes(saved)} 절감`
    setOptimizing(false)
    await load()
    setMessage(resultMessage)
  }

  return (
    <div className='flex flex-col gap-4'>
      <PageHeader
        title='미디어'
        count={files.length}
        description='R2에 저장된 파일의 사용처를 확인하고, 선택한 이미지를 WebP로 최적화합니다.'
        actions={
          <>
            <button onClick={load} disabled={loading || optimizing} className='btn btn-secondary'>
              <GoSync className={loading ? 'animate-spin' : ''} /> 새로고침
            </button>
            <button onClick={optimize} disabled={selected.size === 0 || optimizing} className='btn btn-primary'>
              {optimizing ? `${progress.done}/${progress.total} 최적화 중` : `선택 최적화 (${selected.size})`}
            </button>
          </>
        }
      />

      <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
        <Stat label='전체 파일' value={`${files.length}개`} />
        <Stat label='전체 용량' value={formatBytes(totalSize)} />
        <Stat label='사용 중 이미지' value={`${files.filter((file) => file.optimizable && file.references.length > 0).length}개`} />
        <Stat label='선택 용량' value={formatBytes(selectedSize)} />
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <div className='flex rounded-lg bg-tile p-0.5'>
          {(['all', 'used', 'unused', 'optimizable'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${filter === value ? 'bg-surface text-ink' : 'text-mute hover:text-ink'}`}
            >
              {{ all: '전체', used: '사용 중', unused: '미사용', optimizable: '최적화 가능' }[value]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSelected(allVisibleSelected ? new Set() : new Set(selectable.map((file) => file.key)))}
          disabled={selectable.length === 0}
          className='btn btn-ghost'
        >
          {allVisibleSelected ? '선택 해제' : '보이는 항목 모두 선택'}
        </button>
        <div className='relative ml-auto w-full sm:w-64'>
          <GoSearch className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mute' size={14} />
          <input type='search' value={query} onChange={(event) => setQuery(event.target.value)} placeholder='파일 경로 검색' className='bg-tile! pl-9!' />
        </div>
      </div>

      {message && <p className='rounded-xl bg-ink px-4 py-3 text-sm text-white'>{message}</p>}
      {loading ? (
        <p className='rounded-xl bg-surface py-20 text-center text-sm text-mute'>R2 파일을 확인하는 중…</p>
      ) : visible.length === 0 ? (
        <p className='rounded-xl bg-surface py-20 text-center text-sm text-mute'>조건에 맞는 파일이 없습니다.</p>
      ) : (
        <ul className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4'>
          {visible.map((file) => {
            const canSelect = file.optimizable && file.references.length > 0
            const isSelected = selected.has(file.key)
            return (
              <li
                key={file.key}
                className={`group relative flex flex-col gap-2 rounded-xl p-2 transition-colors ${isSelected ? 'bg-ink text-white' : 'bg-surface'}`}
              >
                <button
                  type='button'
                  disabled={!canSelect || optimizing}
                  onClick={() => toggle(file.key)}
                  className={`absolute top-4 right-4 z-10 flex size-6 items-center justify-center rounded-full transition-opacity disabled:hidden ${
                    isSelected ? 'bg-white text-ink' : 'bg-ink/60 text-white opacity-0 group-hover:opacity-100'
                  }`}
                  aria-label='선택'
                >
                  {isSelected && <GoCheck size={14} />}
                </button>
                <div className='flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-field'>
                  {file.mimeType.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.url} alt='' loading='lazy' className='size-full object-cover' />
                  ) : file.mimeType.startsWith('video/') ? (
                    <video src={file.url} muted preload='metadata' className='size-full object-cover' />
                  ) : (
                    <GoFileMedia size={28} className='text-mute' />
                  )}
                </div>
                <div className='flex flex-col gap-1 px-1 pb-1'>
                  <p className='truncate text-xs' title={file.key}>
                    {file.key.split('/').pop()}
                  </p>
                  <p className={`text-[11px] ${isSelected ? 'text-white/50' : 'text-mute'}`}>
                    {formatBytes(file.size)} · {file.mimeType.split('/')[1]}
                  </p>
                  <p className={`truncate text-[11px] ${file.references.length ? (isSelected ? 'text-white/70' : 'text-ink/70') : 'text-danger'}`}>
                    {file.references.length
                      ? file.references.map((reference) => reference.title).filter((title, index, all) => all.indexOf(title) === index).join(', ')
                      : '미사용 파일'}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex flex-col gap-3 rounded-xl bg-surface p-4'>
      <p className='text-xs text-mute'>{label}</p>
      <p className='text-2xl font-medium tracking-[-0.03em]'>{value}</p>
    </div>
  )
}
