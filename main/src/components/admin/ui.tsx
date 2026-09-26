'use client'

import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { GoImage, GoTrash } from 'react-icons/go'

/* ─── 레이아웃 ─────────────────────────────────────────────────────────── */

export const PageHeader = ({
  title,
  count,
  description,
  actions,
}: {
  title: string
  count?: number
  description?: string
  actions?: React.ReactNode
}) => (
  <header className='flex flex-wrap items-end justify-between gap-4 pb-8'>
    <div className='flex flex-col gap-2'>
      <h1 className='flex items-start gap-2 text-4xl font-medium tracking-[-0.04em]'>
        {title}
        {count !== undefined && <sup className='mt-1 text-sm font-normal tracking-normal text-mute'>{count}</sup>}
      </h1>
      {description && <p className='text-sm text-mute'>{description}</p>}
    </div>
    {actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
  </header>
)

export const Panel = ({
  title,
  children,
  className,
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) => (
  <section className={classNames('flex flex-col gap-4 rounded-xl bg-surface p-5', className)}>
    {title && <h2 className='text-sm text-mute'>{title}</h2>}
    {children}
  </section>
)

/* ─── 폼 요소 ─────────────────────────────────────────────────────────── */

export const Field = ({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: React.ReactNode
  children: React.ReactNode
  className?: string
}) => (
  <label className={classNames('flex flex-col gap-1.5', className)}>
    <span className='text-xs text-mute'>{label}</span>
    {children}
    {hint && <span className='text-[11px] leading-snug text-mute'>{hint}</span>}
  </label>
)

export const Switch = ({
  checked,
  onChange,
  label,
  labelClassName,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  labelClassName?: string
  disabled?: boolean
}) => (
  <button
    type='button'
    role='switch'
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={(event) => {
      event.preventDefault()
      event.stopPropagation()
      onChange(!checked)
    }}
    className='group inline-flex items-center gap-2 text-sm disabled:opacity-40'
  >
    <span
      className={classNames(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200',
        checked ? 'bg-ink' : 'bg-[#d9d9d5]',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={classNames('absolute size-4 rounded-full bg-white', checked ? 'right-0.5' : 'left-0.5')}
      />
    </span>
    {label && <span className={classNames(checked ? 'text-ink' : 'text-mute', labelClassName)}>{label}</span>}
  </button>
)

/** 상태 표시 점 + 텍스트 */
export const StatusBadge = ({ published }: { published: boolean }) => (
  <span className={classNames('inline-flex items-center gap-1.5 text-xs', published ? 'text-ink' : 'text-mute')}>
    <span className={classNames('size-1.5 rounded-full', published ? 'bg-success' : 'bg-[#c9c9c4]')} />
    {published ? '공개' : '비공개'}
  </span>
)

/** 칩 형태의 태그 입력. Enter/쉼표로 추가, Backspace로 마지막 삭제 */
export const TagInput = ({
  value,
  onChange,
  suggestions = [],
  placeholder = '입력 후 Enter',
}: {
  value: string[]
  onChange: (value: string[]) => void
  suggestions?: string[]
  placeholder?: string
}) => {
  const [draft, setDraft] = useState('')
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const add = (raw: string) => {
    const items = raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => !value.includes(item))
    if (items.length) onChange([...value, ...items])
    setDraft('')
  }

  const remaining = suggestions.filter((item) => !value.includes(item))

  return (
    <div className='flex flex-col gap-2'>
      <div
        className='flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg bg-field px-2 py-1.5'
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((item) => (
          <span
            key={item}
            className='inline-flex items-center gap-1 rounded-md bg-surface py-0.5 pr-1 pl-2 text-[13px]'
          >
            {item}
            <button
              type='button'
              aria-label={`${item} 삭제`}
              onClick={() => onChange(value.filter((tag) => tag !== item))}
              className='flex size-4 items-center justify-center rounded text-mute hover:bg-tile hover:text-ink'
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          list={listId}
          value={draft}
          placeholder={value.length ? '' : placeholder}
          onChange={(event) => {
            const next = event.target.value
            // datalist에서 고른 경우 바로 추가
            if (remaining.includes(next)) add(next)
            else setDraft(next)
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              add(draft)
            } else if (event.key === 'Backspace' && !draft && value.length) {
              onChange(value.slice(0, -1))
            }
          }}
          onBlur={() => draft && add(draft)}
          className='min-w-24 flex-1 bg-transparent! px-1! py-0.5! text-sm'
        />
        <datalist id={listId}>
          {remaining.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </div>
      {remaining.length > 0 && (
        <div className='flex flex-wrap gap-x-3 gap-y-1'>
          {remaining.slice(0, 12).map((item) => (
            <button
              key={item}
              type='button'
              onClick={() => onChange([...value, item])}
              className='text-xs text-mute transition-colors hover:text-ink'
            >
              + {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** 클릭 또는 드래그 앤 드롭으로 이미지 업로드 */
export const ImageDrop = ({
  url,
  onUpload,
  onRemove,
  aspect = 'aspect-square',
  label = '이미지를 끌어다 놓거나 클릭해서 업로드',
}: {
  url: string | null
  onUpload: (file: File) => Promise<void>
  onRemove?: () => void
  aspect?: string
  label?: string
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handle = async (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    try {
      await onUpload(file)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className={classNames(
        'group relative w-full overflow-hidden rounded-lg transition-colors',
        aspect,
        dragging ? 'bg-tile' : 'bg-field',
      )}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        void handle(event.dataTransfer.files?.[0])
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt='' className='size-full object-cover' />
      ) : (
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          className='flex size-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-mute transition-colors hover:text-ink'
        >
          <GoImage size={20} />
          {label}
        </button>
      )}

      {url && (
        <div className='absolute inset-x-2 bottom-2 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
          <button
            type='button'
            onClick={() => inputRef.current?.click()}
            className='btn btn-sm bg-ink/80 text-white hover:bg-ink'
          >
            교체
          </button>
          {onRemove && (
            <button
              type='button'
              onClick={onRemove}
              className='btn btn-sm bg-ink/80 text-white hover:bg-danger'
              aria-label='이미지 제거'
            >
              <GoTrash size={12} />
            </button>
          )}
        </div>
      )}

      {uploading && (
        <div className='absolute inset-0 flex items-center justify-center bg-paper/80 text-xs text-ink'>업로드 중…</div>
      )}

      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(event) => {
          void handle(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </div>
  )
}

/* ─── 피드백 ──────────────────────────────────────────────────────────── */

type ToastKind = 'success' | 'error' | 'info'

/** 하단 중앙에 잠깐 떴다 사라지는 알림 */
export function useToast() {
  const [toast, setToast] = useState<{ id: number; message: string; kind: ToastKind } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    clearTimeout(timer.current)
    setToast({ id: Date.now(), message, kind })
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const node = (
    <div className='pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4'>
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className={classNames(
              'flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-white',
              toast.kind === 'error' ? 'bg-danger' : 'bg-ink',
            )}
          >
            {toast.kind === 'success' && <span className='size-1.5 rounded-full bg-[#7ee08a]' />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  return { show, node }
}

/* ─── 훅 ─────────────────────────────────────────────────────────────── */

/** ⌘S / Ctrl+S 로 저장 */
export function useSaveShortcut(onSave: () => void, enabled = true) {
  const saveRef = useRef(onSave)
  saveRef.current = onSave

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        saveRef.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}

/** 저장하지 않은 변경사항이 있으면 탭 닫기/새로고침 전에 경고 */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])
}

/** "3분 전" 같은 상대 시간 */
export function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}일 전`
  return new Date(iso).toLocaleDateString('ko-KR')
}
