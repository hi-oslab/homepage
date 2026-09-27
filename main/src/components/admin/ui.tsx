'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react'
import { GoEye, GoEyeClosed, GoImage, GoTrash } from 'react-icons/go'

import { cn } from '@/lib/cn'
import {
  buttonClass,
  fieldClass,
  iconButtonClass,
  SELECT_CHEVRON,
  selectClass,
  type ButtonSize,
  type ButtonVariant,
} from './styles'

export { buttonClass, fieldClass, iconButtonClass, selectClass }

/* ─── 기본 요소 (버튼 · 입력 필드) ─────────────────────────────────────── */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }

export const Button = ({ variant = 'secondary', size = 'md', type = 'button', className, ...props }: ButtonProps) => (
  <button type={type} className={buttonClass(variant, size, className)} {...props} />
)

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean; size?: 'md' | 'sm' }

export const IconButton = ({ danger, size, type = 'button', className, ...props }: IconButtonProps) => (
  <button type={type} className={iconButtonClass({ danger, size }, className)} {...props} />
)

/**
 * 체크박스. globals.css 기본 초기화가 모든 input에 appearance: none을 걸어 체크박스가 사라지므로
 * appearance-auto로 브라우저 기본 모양을 되살린다. indeterminate: 일부만 선택됨(−)
 */
export const Checkbox = ({
  className,
  indeterminate,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { indeterminate?: boolean }) => (
  <input
    type='checkbox'
    ref={(element) => {
      if (element) element.indeterminate = Boolean(indeterminate)
    }}
    className={cn('size-3.5 shrink-0 cursor-pointer appearance-auto accent-ink', className)}
    {...props}
  />
)

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={fieldClass(className)} {...props} />,
)
Input.displayName = 'Input'

/** 비밀번호 입력칸 + 오른쪽 보기/숨기기 버튼 */
export const PasswordInput = ({ className, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) => {
  const [visible, setVisible] = useState(false)
  return (
    <span className='relative block'>
      <input type={visible ? 'text' : 'password'} className={fieldClass(cn('pr-11', className))} {...props} />
      <button
        type='button'
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
        aria-pressed={visible}
        // 입력 중인 칸의 포커스를 빼앗지 않도록
        onMouseDown={(event) => event.preventDefault()}
        className='absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-mute transition-colors hover:text-ink'
      >
        {visible ? <GoEyeClosed size={16} /> : <GoEye size={16} />}
      </button>
    </span>
  )
}

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={fieldClass(className)} {...props} />,
)
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, style, ...props }, ref) => (
    <select ref={ref} className={selectClass(className)} style={{ backgroundImage: SELECT_CHEVRON, ...style }} {...props} />
  ),
)
Select.displayName = 'Select'

/* ─── 레이아웃 ─────────────────────────────────────────────────────────── */

export const PageHeader = ({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) => (
  <header className='flex flex-wrap items-end justify-between gap-4 pb-8'>
    <div className='flex flex-col gap-2'>
      <h1 className='text-4xl font-medium tracking-[-0.04em]'>{title}</h1>
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
  <section className={cn('flex flex-col gap-4 rounded-xl bg-surface p-5', className)}>
    {title && <h2 className='text-sm text-mute'>{title}</h2>}
    {children}
  </section>
)

/** 흰 상자 한 구역 (제목 + 짧은 설명). 프로필 · 계정 설정 · 프로젝트 편집이 같이 쓴다 */
export const SectionCard = ({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string
  description?: React.ReactNode
  /** 제목 오른쪽 버튼 */
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) => (
  <section className={cn('flex flex-col gap-5 rounded-2xl bg-surface p-5 md:p-7', className)}>
    {(title || actions) && (
      <div className='flex items-start justify-between gap-3'>
        <div className='flex flex-col gap-1'>
          {title && <h2 className='text-base font-medium tracking-[-0.01em]'>{title}</h2>}
          {description && <p className='text-xs leading-relaxed break-keep text-mute'>{description}</p>}
        </div>
        {actions && <div className='flex shrink-0 items-center gap-2'>{actions}</div>}
      </div>
    )}
    {children}
  </section>
)

/** 저장 상태 표시: 저장 중 · 저장 안 된 변경 · 저장됨 */
export function SaveState({ dirty, saving, className }: { dirty: boolean; saving: boolean; className?: string }) {
  const [label, color] = saving
    ? ['저장 중…', 'bg-mute animate-pulse']
    : dirty
      ? ['저장 안 된 변경', 'bg-[#e0a526]']
      : ['저장됨', 'bg-success']
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-mute', className)}>
      <span className={cn('size-1.5 rounded-full', color)} />
      {label}
    </span>
  )
}

/** 편집 화면 상단에 붙는 막대 (스크롤해도 헤더 아래에 남는다) */
export const EditorBar = ({ children }: { children: React.ReactNode }) => (
  <div className='sticky top-header z-20 -mx-4 -mt-4 flex items-center justify-between gap-3 bg-paper px-4 py-3 md:-mx-8 md:-mt-8 md:px-8 md:py-4'>
    {children}
  </div>
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
  <label className={cn('flex flex-col gap-1.5', className)}>
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
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200',
        checked ? 'bg-ink' : 'bg-[#d9d9d5]',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={cn('absolute size-4 rounded-full bg-white', checked ? 'right-0.5' : 'left-0.5')}
      />
    </span>
    {label && <span className={cn(checked ? 'text-ink' : 'text-mute', labelClassName)}>{label}</span>}
  </button>
)

/** 상태 표시 점 + 텍스트 */
export const StatusBadge = ({ published }: { published: boolean }) => (
  <span className={cn('inline-flex items-center gap-1.5 text-xs', published ? 'text-ink' : 'text-mute')}>
    <span className={cn('size-1.5 rounded-full', published ? 'bg-success' : 'bg-[#c9c9c4]')} />
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
        <Input
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
          className='min-w-24 flex-1 bg-transparent px-1 py-0.5 text-sm'
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
  imageClassName,
  onEdit,
}: {
  url: string | null
  onUpload: (file: File) => Promise<void>
  onRemove?: () => void
  /** 지금 이미지를 다시 편집 (예: 프로필 모양 바꾸기) */
  onEdit?: () => void
  aspect?: string
  label?: string
  /** 미리보기 이미지 스타일 (기본은 꽉 채우기) */
  imageClassName?: string
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
      className={cn(
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
        <img src={url} alt='' className={cn('size-full object-cover', imageClassName)} />
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
          {onEdit && (
            <button
              type='button'
              onClick={onEdit}
              className={buttonClass('plain', 'sm', 'bg-ink/80 text-white hover:bg-ink')}
            >
              모양 바꾸기
            </button>
          )}
          <button
            type='button'
            onClick={() => inputRef.current?.click()}
            className={buttonClass('plain', 'sm', 'bg-ink/80 text-white hover:bg-ink')}
          >
            교체
          </button>
          {onRemove && (
            <button
              type='button'
              onClick={onRemove}
              className={buttonClass('plain', 'sm', 'bg-ink/80 text-white hover:bg-danger')}
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
    // 모바일에서는 멤버 공간 바텀탭 위에
    <div className='pointer-events-none fixed inset-x-0 bottom-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom)+0.75rem)] z-[80] flex justify-center px-4 md:bottom-6'>
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className={cn(
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

/* ─── 서버 데이터 동기화 ───────────────────────────────────────────────── */

/**
 * 서버에서 받은 목록을 화면에서 바로 고칠 수 있는 상태로 쓴다.
 * 서버 값이 새로 오면(서버 액션 후 재검증, router.refresh) 그 값으로 다시 맞춘다.
 */
export function useServerState<T>(serverValue: T) {
  const [value, setValue] = useState(serverValue)
  const [synced, setSynced] = useState(serverValue)
  if (serverValue !== synced) {
    setSynced(serverValue)
    setValue(serverValue)
  }
  return [value, setValue] as const
}

/** 창으로 돌아오면 최신 데이터를 다시 불러온다 (다른 관리자가 바꾼 내용, 새 가입 신청 등) */
export function useRefreshOnFocus(minIntervalMs = 10_000) {
  const router = useRouter()
  useEffect(() => {
    let last = Date.now()
    const refresh = () => {
      if (document.visibilityState !== 'visible' || Date.now() - last < minIntervalMs) return
      last = Date.now()
      router.refresh()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [router, minIntervalMs])
}
