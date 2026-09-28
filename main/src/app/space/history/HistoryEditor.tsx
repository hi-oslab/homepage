'use client'

import classNames from 'classnames'
import { useMemo, useState, useTransition } from 'react'
import { GoLinkExternal, GoTrash } from 'react-icons/go'
import { Input, PageHeader, Panel, Select, Switch, buttonClass, iconButtonClass, useRefreshOnFocus, useServerState, useToast } from '@/components/admin/ui'
import type { HistoryInput, HistoryItem } from '@/types/cms'
import { createHistoryAction, deleteHistoryAction, updateHistoryAction } from './actions'

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1)
const DEFAULT_CATEGORIES = ['전시', '공연', '수상', '워크숍', '강연', '프로젝트', '협업']

const emptyInput = (): HistoryInput => ({
  year: new Date().getFullYear(),
  month: null,
  category: '',
  title: '',
  detail: '',
  link: '',
  published: true,
})

// 날짜순 정렬 (최신이 위)
const sortItems = (items: HistoryItem[]) =>
  items.slice().sort((a, b) => b.year - a.year || (b.month ?? 0) - (a.month ?? 0) || b.created_at.localeCompare(a.created_at))

export function HistoryEditor({ initialItems }: { initialItems: HistoryItem[] }) {
  const [items, setItems] = useServerState(initialItems)
  useRefreshOnFocus()
  const [draft, setDraft] = useState<HistoryInput>(emptyInput)
  const [isPending, startTransition] = useTransition()
  const toast = useToast()

  const categories = useMemo(
    () => Array.from(new Set([...DEFAULT_CATEGORIES, ...items.map((item) => item.category).filter(Boolean)])),
    [items],
  )
  const years = useMemo(() => Array.from(new Set(items.map((item) => item.year))), [items])

  const add = (event: React.FormEvent) => {
    event.preventDefault()
    startTransition(async () => {
      const result = await createHistoryAction(draft)
      if ('message' in result) return toast.show(result.message, 'error')
      setItems((current) => sortItems([...current, result.item!]))
      // 연도·분류는 이어서 입력하기 쉽도록 유지
      setDraft((current) => ({ ...emptyInput(), year: current.year, category: current.category }))
      toast.show('추가했습니다')
    })
  }

  const update = (item: HistoryItem, patch: Partial<HistoryInput>) => {
    const previous = items
    setItems((current) => sortItems(current.map((entry) => (entry.id === item.id ? { ...entry, ...patch } : entry))))
    startTransition(async () => {
      const result = await updateHistoryAction(item.id, patch)
      if ('message' in result) {
        setItems(previous)
        return toast.show(result.message, 'error')
      }
      toast.show('저장했습니다')
    })
  }

  const remove = (item: HistoryItem) => {
    if (!confirm(`'${item.title}' 항목을 삭제할까요?`)) return
    setItems((current) => current.filter((entry) => entry.id !== item.id))
    startTransition(async () => {
      const result = await deleteHistoryAction(item.id)
      if ('message' in result) {
        setItems(initialItems)
        return toast.show(result.message, 'error')
      }
      toast.show('삭제했습니다')
    })
  }

  return (
    <div className='flex flex-col gap-4'>
      <PageHeader
        title='연혁'
        description='About 페이지의 History(CV)에 표시됩니다. 항목을 고치면 입력칸을 벗어날 때 자동으로 저장돼요.'
      />

      {/* 빠른 추가 */}
      <Panel title='새 항목'>
        <form onSubmit={add} className='grid grid-cols-2 gap-2 md:grid-cols-[88px_96px_140px_minmax(0,1fr)]'>
          <Input
            type='number'
            aria-label='연도'
            value={draft.year}
            onChange={(event) => setDraft((current) => ({ ...current, year: Number(event.target.value) }))}
          />
          <Select
            aria-label='월'
            value={draft.month ?? ''}
            onChange={(event) => setDraft((current) => ({ ...current, month: event.target.value ? Number(event.target.value) : null }))}
          >
            <option value=''>월 없음</option>
            {MONTHS.map((month) => (
              <option key={month} value={month}>
                {month}월
              </option>
            ))}
          </Select>
          <Input
            list='history-categories'
            aria-label='분류'
            placeholder='분류'
            value={draft.category}
            onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
          />
          <Input
            required
            aria-label='내용'
            placeholder='내용 — 예: 《일상행동:변주》 기획전시'
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            className='col-span-2 md:col-span-1'
          />
          <Input
            aria-label='상세'
            placeholder='상세 (선택) — 장소, 주최, 협업 기관'
            value={draft.detail}
            onChange={(event) => setDraft((current) => ({ ...current, detail: event.target.value }))}
            className='col-span-2 md:col-span-3'
          />
          <div className='col-span-2 flex gap-2 md:col-span-1'>
            <Input
              type='url'
              aria-label='링크'
              placeholder='링크 (선택)'
              value={draft.link}
              onChange={(event) => setDraft((current) => ({ ...current, link: event.target.value }))}
            />
            <button type='submit' disabled={isPending || !draft.title.trim()} className={buttonClass('primary', 'md', 'shrink-0')}>
              추가
            </button>
          </div>
        </form>
        <datalist id='history-categories'>
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </Panel>

      {/* 연도별 목록 */}
      {years.map((year) => (
        <section key={year} className='grid grid-cols-1 gap-3 md:grid-cols-[120px_minmax(0,1fr)]'>
          <h2 className='text-3xl font-medium tracking-[-0.04em] md:sticky md:top-12 md:self-start'>{year}</h2>
          <ul className='flex flex-col gap-1'>
            {items
              .filter((item) => item.year === year)
              .map((item) => (
                <HistoryRow key={item.id} item={item} onUpdate={(patch) => update(item, patch)} onRemove={() => remove(item)} />
              ))}
          </ul>
        </section>
      ))}

      {items.length === 0 && (
        <div className='rounded-block bg-surface py-16 text-center text-sm text-mute'>
          아직 연혁이 없습니다. 위에서 첫 항목을 추가해 보세요.
        </div>
      )}
      {toast.node}
    </div>
  )
}

/** 한 줄 편집: 입력칸을 벗어날 때 바뀐 값만 저장 */
function HistoryRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: HistoryItem
  onUpdate: (patch: Partial<HistoryInput>) => void
  onRemove: () => void
}) {
  const inline = 'bg-transparent! px-2! py-1.5! hover:bg-field! focus:bg-field!'
  const commit = <K extends keyof HistoryInput>(key: K, value: HistoryInput[K]) => {
    if (value !== item[key]) onUpdate({ [key]: value } as Partial<HistoryInput>)
  }

  return (
    <li
      className={classNames(
        'rounded-inner group grid grid-cols-[72px_88px_minmax(0,1fr)_auto] items-start gap-1 bg-surface p-2',
        !item.published && 'opacity-60',
      )}
    >
      <Input
        type='number'
        aria-label='연도'
        defaultValue={item.year}
        onBlur={(event) => commit('year', Number(event.target.value))}
        className={inline}
      />
      <Select
        aria-label='월'
        value={item.month ?? ''}
        onChange={(event) => commit('month', event.target.value ? Number(event.target.value) : null)}
        className={classNames(inline, 'bg-none!')}
      >
        <option value=''>—</option>
        {MONTHS.map((month) => (
          <option key={month} value={month}>
            {month}월
          </option>
        ))}
      </Select>
      <div className='flex min-w-0 flex-col'>
        <div className='flex min-w-0 gap-1'>
          <Input
            list='history-categories'
            aria-label='분류'
            placeholder='분류'
            defaultValue={item.category}
            onBlur={(event) => commit('category', event.target.value.trim())}
            className={classNames(inline, 'w-28! shrink-0 text-mute!')}
          />
          <Input
            aria-label='내용'
            defaultValue={item.title}
            onBlur={(event) => commit('title', event.target.value.trim())}
            className={inline}
          />
        </div>
        <Input
          aria-label='상세'
          placeholder='상세 (선택)'
          defaultValue={item.detail}
          onBlur={(event) => commit('detail', event.target.value.trim())}
          className={classNames(inline, 'text-sm! text-mute!')}
        />
        <Input
          type='url'
          aria-label='링크'
          placeholder='링크 (선택)'
          defaultValue={item.link}
          onBlur={(event) => commit('link', event.target.value.trim())}
          className={classNames(inline, 'text-xs! text-mute!')}
        />
      </div>
      <div className='flex items-center gap-1 pt-1'>
        <Switch checked={item.published} onChange={(value) => onUpdate({ published: value })} label={item.published ? '공개' : '숨김'} labelClassName='hidden sm:inline text-xs' />
        {item.link && (
          <a href={item.link} target='_blank' rel='noopener noreferrer' className={iconButtonClass()} title='링크 열기'>
            <GoLinkExternal size={13} />
          </a>
        )}
        <button type='button' onClick={onRemove} className={iconButtonClass({ danger: true })} title='삭제'>
          <GoTrash size={13} />
        </button>
      </div>
    </li>
  )
}
