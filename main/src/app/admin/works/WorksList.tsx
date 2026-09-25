'use client'

import classNames from 'classnames'
import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GoGrabber, GoLinkExternal, GoSearch, GoTrash } from 'react-icons/go'
import { PageHeader, Switch, useToast } from '@/components/admin/ui'
import { RelativeTime } from '../DashboardActions'
import type { Work } from '@/types/cms'
import { createWorkAction, deleteWorkAction, reorderWorksAction, setWorkPublishedAction } from './actions'

type Status = 'all' | 'published' | 'draft'

const STATUS_LABELS: Record<Status, string> = { all: '전체', published: '공개', draft: '비공개' }

export function WorksList({
  initialWorks,
  initialStatus,
  isMaster,
  authors,
}: {
  initialWorks: Work[]
  initialStatus: Status
  isMaster: boolean
  authors: Record<string, string>
}) {
  const [works, setWorks] = useState(initialWorks)
  const [status, setStatus] = useState<Status>(initialStatus)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [, startTransition] = useTransition()
  const toast = useToast()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const categories = useMemo(() => Array.from(new Set(works.map((work) => work.category).filter(Boolean))), [works])

  const filtered = works.filter((work) => {
    if (status === 'published' && !work.published) return false
    if (status === 'draft' && work.published) return false
    if (category && work.category !== category) return false
    const q = query.trim().toLowerCase()
    return !q || [work.title, work.slug, work.subtitle, ...work.tags].some((text) => text?.toLowerCase().includes(q))
  })
  // 필터가 걸려 있으면 순서가 헷갈리므로 드래그 정렬은 전체 목록에서만
  const canReorder = isMaster && status === 'all' && !category && !query.trim()

  const counts = {
    all: works.length,
    published: works.filter((work) => work.published).length,
    draft: works.filter((work) => !work.published).length,
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = works.findIndex((work) => work.id === active.id)
    const to = works.findIndex((work) => work.id === over.id)
    const next = arrayMove(works, from, to)
    setWorks(next)
    startTransition(async () => {
      try {
        await reorderWorksAction(next.map((work) => work.id))
        toast.show('순서를 저장했습니다')
      } catch {
        setWorks(works)
        toast.show('순서를 저장하지 못했습니다', 'error')
      }
    })
  }

  const togglePublished = (work: Work, published: boolean) => {
    setWorks((current) => current.map((item) => (item.id === work.id ? { ...item, published } : item)))
    startTransition(async () => {
      try {
        await setWorkPublishedAction(work.id, published)
        toast.show(published ? `'${work.title}' 공개됨` : `'${work.title}' 비공개로 전환`)
      } catch {
        setWorks((current) => current.map((item) => (item.id === work.id ? { ...item, published: !published } : item)))
        toast.show('상태를 바꾸지 못했습니다', 'error')
      }
    })
  }

  const remove = (work: Work) => {
    if (!confirm(`'${work.title}' 작품을 삭제할까요?\n삭제하면 되돌릴 수 없습니다.`)) return
    setWorks((current) => current.filter((item) => item.id !== work.id))
    startTransition(async () => {
      try {
        await deleteWorkAction(work.id)
        toast.show('삭제했습니다')
      } catch {
        setWorks(works)
        toast.show('삭제하지 못했습니다', 'error')
      }
    })
  }

  return (
    <div className='flex flex-col gap-4'>
      <PageHeader
        title={isMaster ? '작품' : '내 작품'}
        count={works.length}
        description={
          isMaster ? '드래그해서 사이트에 보이는 순서를 바꿀 수 있어요.' : '내가 작성한 작품을 관리합니다. 노출 순서는 마스터가 정해요.'
        }
        actions={
          <form action={createWorkAction}>
            <button className='btn btn-primary'>+ 새 작품</button>
          </form>
        }
      />

      {/* 툴바 */}
      <div className='flex flex-wrap items-center gap-2'>
        <div className='flex rounded-lg bg-tile p-0.5'>
          {(Object.keys(STATUS_LABELS) as Status[]).map((value) => (
            <button
              key={value}
              type='button'
              onClick={() => setStatus(value)}
              className={classNames(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                status === value ? 'bg-surface text-ink' : 'text-mute hover:text-ink',
              )}
            >
              {STATUS_LABELS[value]}
              <span className='ml-1.5 text-xs text-mute'>{counts[value]}</span>
            </button>
          ))}
        </div>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className='w-auto! bg-tile!'>
          <option value=''>모든 카테고리</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <div className='relative ml-auto w-full sm:w-64'>
          <GoSearch className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mute' size={14} />
          <input
            type='search'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='제목, 태그 검색'
            className='bg-tile! pl-9!'
          />
        </div>
      </div>

      {/* 목록 */}
      <DndContext id='admin-works' sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={filtered.map((work) => work.id)} strategy={verticalListSortingStrategy}>
          <ul className='flex flex-col gap-1'>
            {filtered.map((work) => (
              <WorkRow
                key={work.id}
                work={work}
                draggable={canReorder}
                author={isMaster ? (work.author_id ? (authors[work.author_id] ?? '알 수 없음') : '작성자 없음') : undefined}
                onTogglePublished={(published) => togglePublished(work, published)}
                onRemove={() => remove(work)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {filtered.length === 0 && (
        <div className='rounded-xl bg-surface py-16 text-center text-sm text-mute'>
          {works.length === 0 ? '아직 작품이 없습니다. 첫 작품을 추가해 보세요.' : '조건에 맞는 작품이 없습니다.'}
        </div>
      )}
      {isMaster && !canReorder && filtered.length > 0 && (
        <p className='text-xs text-mute'>필터나 검색을 해제하면 드래그로 순서를 바꿀 수 있어요.</p>
      )}
      {toast.node}
    </div>
  )
}

function WorkRow({
  work,
  draggable,
  author,
  onTogglePublished,
  onRemove,
}: {
  work: Work
  draggable: boolean
  author?: string
  onTogglePublished: (published: boolean) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: work.id,
    disabled: !draggable,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={classNames(
        'group relative flex items-center gap-3 rounded-xl bg-surface p-2 pr-3 transition-colors',
        isDragging ? 'z-10 opacity-80' : 'hover:bg-white',
      )}
    >
      <button
        type='button'
        aria-label='드래그해서 순서 변경'
        {...attributes}
        {...listeners}
        className={classNames(
          'flex h-12 w-6 shrink-0 touch-none items-center justify-center rounded-md text-ink/20',
          draggable ? 'cursor-grab hover:bg-field hover:text-ink' : 'invisible',
        )}
      >
        <GoGrabber size={16} />
      </button>

      <Link href={`/admin/works/${work.id}`} className='flex min-w-0 flex-1 items-center gap-4'>
        <span className='h-12 w-16 shrink-0 overflow-hidden rounded-md bg-field'>
          {work.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={work.thumbnail_url} alt='' className='size-full object-cover' />
          )}
        </span>
        <span className='flex min-w-0 flex-col gap-0.5'>
          <span className='truncate text-[15px]'>{work.title || '제목 없음'}</span>
          <span className='truncate text-xs text-mute'>
            {[author, work.category, work.year, `/${work.slug}`].filter(Boolean).join(' · ')}
          </span>
        </span>
      </Link>

      <span className='hidden md:block'>
        <RelativeTime iso={work.updated_at} />
      </span>
      <Switch
        checked={work.published}
        onChange={onTogglePublished}
        label={work.published ? '공개' : '비공개'}
        labelClassName='hidden sm:inline'
      />
      <div className='flex items-center gap-0.5'>
        {work.published && (
          // 모바일에서는 공간이 좁아 숨김
          <span className='hidden sm:contents'>
            <a
              href={`/work/${work.slug}`}
              target='_blank'
              rel='noopener noreferrer'
              className='icon-btn'
              title='사이트에서 보기'
            >
              <GoLinkExternal size={14} />
            </a>
          </span>
        )}
        <button
          type='button'
          onClick={onRemove}
          className='icon-btn hover:bg-danger-soft! hover:text-danger!'
          title='삭제'
        >
          <GoTrash size={14} />
        </button>
      </div>
    </li>
  )
}
