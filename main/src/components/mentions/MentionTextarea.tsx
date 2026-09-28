'use client'

import classNames from 'classnames'
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AutoTextarea } from '@/components/admin/BlockEditor/AutoTextarea'
import { ProfileImage } from '@/components/ProfileImage'
import { mentionToken } from '@/lib/mentions'
import { useMentions, type MentionMember } from './MentionProvider'

/** 목록에 보여줄 최대 인원 */
const LIMIT = 6
/** 커서 바로 앞의 '@검색어' (앞이 글자 · 숫자면 메일 주소 등이라 제외) */
const QUERY_RE = new RegExp('(?:^|[^\\p{L}\\p{N}])@([^\\s@]{0,20})$', 'u')
/** 한글 조합 중 끝에 붙는 낱자(ㅅ, ㅏ …)는 검색에서 뺀다 */
const TRAILING_JAMO = /[ㄱ-ㆎ]+$/

type Query = { text: string; start: number }
type Place = { left: number; width: number; top?: number; bottom?: number }

/**
 * '@'로 멤버를 실명 검색해 넣을 수 있는 입력칸 (AutoTextarea와 같은 props).
 * 고르면 '@실명(아이디) '가 들어가고(화면에는 '@실명'만 보인다), 입력칸의 onChange가 평소처럼 불린다.
 * 목록이 열려 있는 동안 ↑↓ · Enter · Tab · Esc는 목록이 먼저 쓴다 (Enter 등록 · 블록 나누기보다 먼저).
 */
export const MentionTextarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ onKeyDown, onChange, onBlur, ...props }, forwarded) => {
    const { members } = useMentions()
    const inner = useRef<HTMLTextAreaElement | null>(null)
    const [query, setQuery] = useState<Query | null>(null)
    const [active, setActive] = useState(0)
    const [place, setPlace] = useState<Place | null>(null)

    const results = useMemo(() => {
      if (!query) return []
      const needle = query.text.replace(TRAILING_JAMO, '').toLowerCase()
      return members
        .filter((member) => member.name.toLowerCase().includes(needle))
        .sort(
          (a, b) => Number(b.name.toLowerCase().startsWith(needle)) - Number(a.name.toLowerCase().startsWith(needle)),
        )
        .slice(0, LIMIT)
    }, [members, query])
    const open = results.length > 0

    // 커서 앞 글자를 보고 검색어를 정한다
    const detect = useCallback(() => {
      const element = inner.current
      if (!element || element.selectionStart !== element.selectionEnd) return setQuery(null)
      const before = element.value.slice(0, element.selectionStart)
      const match = before.match(QUERY_RE)
      setQuery(match ? { text: match[1], start: before.length - match[1].length - 1 } : null)
      setActive(0)
    }, [])

    // 목록 위치: 입력칸 아래, 공간이 모자라면 위 (모달 안에서도 잘리지 않게 화면 기준)
    useEffect(() => {
      if (!open) return
      const measure = () => {
        const rect = inner.current?.getBoundingClientRect()
        if (!rect) return
        const width = Math.min(Math.max(rect.width, 220), 300)
        const below = window.innerHeight - rect.bottom > 260
        setPlace(
          below
            ? { left: rect.left, width, top: rect.bottom + 6 }
            : { left: rect.left, width, bottom: window.innerHeight - rect.top + 6 },
        )
      }
      measure()
      window.addEventListener('resize', measure)
      window.addEventListener('scroll', measure, true)
      return () => {
        window.removeEventListener('resize', measure)
        window.removeEventListener('scroll', measure, true)
      }
    }, [open, query])

    // '@검색어'를 '@실명(아이디) '로 바꾸고, React onChange가 불리도록 입력 이벤트를 보낸다
    const pick = (member: MentionMember) => {
      const element = inner.current
      if (!element || !query) return
      const caret = element.selectionStart
      const token = mentionToken(member)
      const next = `${element.value.slice(0, query.start)}${token} ${element.value.slice(caret)}`
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
      setter?.call(element, next)
      element.dispatchEvent(new Event('input', { bubbles: true }))
      const at = query.start + token.length + 1
      requestAnimationFrame(() => element.setSelectionRange(at, at))
      setQuery(null)
    }

    return (
      <>
        <AutoTextarea
          ref={(element) => {
            inner.current = element
            if (typeof forwarded === 'function') forwarded(element)
            else if (forwarded) forwarded.current = element
          }}
          {...props}
          onChange={(event) => {
            onChange?.(event)
            detect()
          }}
          onSelect={detect}
          onBlur={(event) => {
            setQuery(null)
            onBlur?.(event)
          }}
          onKeyDown={(event) => {
            if (open && !event.nativeEvent.isComposing) {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                event.stopPropagation()
                const step = event.key === 'ArrowDown' ? 1 : -1
                return setActive((current) => (current + step + results.length) % results.length)
              }
              if (event.key === 'Enter' || event.key === 'Tab') {
                event.preventDefault()
                event.stopPropagation()
                return pick(results[active] ?? results[0])
              }
              if (event.key === 'Escape') {
                // 모달이 같이 닫히지 않게
                event.preventDefault()
                event.stopPropagation()
                return setQuery(null)
              }
            }
            onKeyDown?.(event)
          }}
        />
        {open &&
          place &&
          createPortal(
            <ul
              role='listbox'
              aria-label='언급할 멤버'
              style={{ left: place.left, width: place.width, top: place.top, bottom: place.bottom }}
              className='fixed z-[85] flex flex-col gap-0.5 rounded-inner bg-surface p-1 text-sm text-ink shadow-[0_12px_32px_rgb(var(--shadow-rgb)/0.14)] ring-1 ring-ink/10'
            >
              {results.map((member, index) => (
                <li
                  key={member.id}
                  role='option'
                  aria-selected={index === active}
                  // 입력칸 포커스를 뺏지 않고 고른다
                  onMouseDown={(event) => {
                    event.preventDefault()
                    pick(member)
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={classNames(
                    'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5',
                    index === active && 'bg-ink/[0.06]',
                  )}
                >
                  <ProfileImage
                    src={member.image}
                    name={member.name}
                    size='sm'
                    className='size-6 shrink-0 text-[10px]'
                  />
                  {/* 이름이 같은 멤버도 아이디로 구분해 고른다 */}
                  <span className='truncate'>{member.name}</span>
                  <span className='shrink-0 text-xs text-mute'>@{member.username}</span>
                  {member.profile?.role && (
                    <span className='ml-auto shrink-0 text-[11px] text-mute'>{member.profile.role}</span>
                  )}
                </li>
              ))}
            </ul>,
            document.body,
          )}
      </>
    )
  },
)
MentionTextarea.displayName = 'MentionTextarea'
