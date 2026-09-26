'use client'

import classNames from 'classnames'
import { useMemo, useState, useTransition } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GoGrabber } from 'react-icons/go'
import { PageHeader, useSaveShortcut, useToast, useUnsavedWarning } from '@/components/admin/ui'
import { deleteImage, isOwnStorageUrl, uploadImage } from '@/lib/storage'
import type { Member } from '@/types/cms'
import { MemberCard } from '@/app/members/components/MemberCard'
import { MemberForm, toMemberDraft, type MemberDraft } from './MemberForm'
import { createMemberAction, deleteMemberAction, reorderMembersAction, updateMemberAction } from './actions'

export function MembersEditor({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers)
  const [selectedId, setSelectedId] = useState<string | null>(initialMembers[0]?.id ?? null)
  const [draft, setDraft] = useState<MemberDraft | null>(() => (initialMembers[0] ? toMemberDraft(initialMembers[0]) : null))
  const [isPending, startTransition] = useTransition()
  const toast = useToast()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const selected = members.find((member) => member.id === selectedId) ?? null
  const dirty = Boolean(selected && draft && JSON.stringify(toMemberDraft(selected)) !== JSON.stringify(draft))
  useUnsavedWarning(dirty)

  const roles = useMemo(() => Array.from(new Set(members.map((member) => member.role).filter(Boolean))), [members])
  const fieldSuggestions = useMemo(() => Array.from(new Set(members.flatMap((member) => member.fields))), [members])

  const select = (member: Member) => {
    if (member.id === selectedId) return
    if (dirty && !confirm('저장하지 않은 변경사항이 있습니다. 다른 멤버로 이동할까요?')) return
    setSelectedId(member.id)
    setDraft(toMemberDraft(member))
  }

  const patch = <K extends keyof MemberDraft>(key: K, value: MemberDraft[K]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current))

  const add = () => {
    if (dirty && !confirm('저장하지 않은 변경사항이 있습니다. 새 멤버를 추가할까요?')) return
    startTransition(async () => {
      const member = await createMemberAction()
      setMembers((current) => [...current, member])
      setSelectedId(member.id)
      setDraft(toMemberDraft(member))
    })
  }

  const save = () => {
    if (!selected || !draft || !dirty || isPending) return
    startTransition(async () => {
      try {
        const saved = await updateMemberAction(selected.id, draft)
        setMembers((current) => current.map((item) => (item.id === saved.id ? saved : item)))
        setDraft(toMemberDraft(saved))
        toast.show(`${saved.name} 저장했습니다`)
      } catch {
        toast.show('저장하지 못했습니다', 'error')
      }
    })
  }
  useSaveShortcut(save)

  const remove = () => {
    if (!selected || !confirm(`'${selected.name}' 멤버를 삭제할까요?\n삭제하면 되돌릴 수 없습니다.`)) return
    startTransition(async () => {
      await deleteMemberAction(selected.id)
      const rest = members.filter((item) => item.id !== selected.id)
      setMembers(rest)
      setSelectedId(rest[0]?.id ?? null)
      setDraft(rest[0] ? toMemberDraft(rest[0]) : null)
      toast.show('삭제했습니다')
    })
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const next = arrayMove(
      members,
      members.findIndex((member) => member.id === active.id),
      members.findIndex((member) => member.id === over.id),
    )
    setMembers(next)
    startTransition(async () => {
      try {
        await reorderMembersAction(next.map((member) => member.id))
        toast.show('순서를 저장했습니다')
      } catch {
        setMembers(members)
        toast.show('순서를 저장하지 못했습니다', 'error')
      }
    })
  }

  const uploadPhoto = async (file: File) => {
    if (!selected || !draft) return
    try {
      const previous = draft.cover_image_url
      const url = await uploadImage(file, 'project-media', `members/${selected.id}`)
      patch('cover_image_url', url)
      if (previous && isOwnStorageUrl(previous)) await deleteImage(previous).catch(() => undefined)
    } catch {
      toast.show('사진을 업로드하지 못했습니다', 'error')
    }
  }

  return (
    <div className='flex flex-col gap-4'>
      <PageHeader
        title='멤버'
        count={members.length}
        description='드래그해서 사이트에 보이는 순서를 바꿀 수 있어요.'
        actions={
          <button type='button' onClick={add} disabled={isPending} className='btn btn-primary'>
            + 새 멤버
          </button>
        }
      />

      <div className='grid grid-cols-1 gap-3 lg:grid-cols-[280px_minmax(0,1fr)]'>
        {/* 목록 */}
        <DndContext id='admin-members' sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={members.map((member) => member.id)} strategy={verticalListSortingStrategy}>
            <ul className='flex flex-col gap-1 lg:sticky lg:top-12 lg:max-h-[calc(100dvh-4rem)] lg:self-start lg:overflow-y-auto no-scroll-bar'>
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member.id === selectedId && draft ? { ...member, ...draft } : member}
                  active={member.id === selectedId}
                  dirty={member.id === selectedId && dirty}
                  onSelect={() => select(member)}
                />
              ))}
              {members.length === 0 && <li className='rounded-xl bg-surface p-6 text-sm text-mute'>아직 멤버가 없습니다.</li>}
            </ul>
          </SortableContext>
        </DndContext>

        {/* 편집 */}
        {selected && draft ? (
          <div className='flex min-w-0 flex-col gap-3'>
            <div className='sticky top-header z-10 -mx-1 flex items-center justify-between gap-3 bg-paper px-1 py-2'>
              <span className='truncate text-2xl font-medium tracking-[-0.03em]'>{draft.name || '이름 없음'}</span>
              <div className='flex shrink-0 items-center gap-2'>
                {dirty && <span className='hidden text-xs text-mute sm:inline'>저장 안 된 변경</span>}
                <button type='button' onClick={save} disabled={!dirty || isPending} className='btn btn-primary'>
                  {isPending ? '저장 중…' : '저장'}
                  <kbd className='hidden font-sans text-[11px] text-white/50 sm:inline'>⌘S</kbd>
                </button>
              </div>
            </div>

            <div className='grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_260px]'>
              <div className='flex flex-col gap-3'>
                <MemberForm draft={draft} patch={patch} onUpload={uploadPhoto} roles={roles} fieldSuggestions={fieldSuggestions} />

                <button type='button' onClick={remove} disabled={isPending} className='btn btn-danger self-start'>
                  이 멤버 삭제
                </button>
              </div>

              {/* 사이트 카드 미리보기 */}
              <div className='flex flex-col gap-3 xl:sticky xl:top-20 xl:self-start'>
                <span className='text-xs text-mute'>사이트 미리보기</span>
                <MemberCard member={{ ...selected, ...draft }} />
              </div>
            </div>
          </div>
        ) : (
          <div className='flex items-center justify-center rounded-xl bg-surface p-16 text-sm text-mute'>
            왼쪽에서 멤버를 선택하거나 새 멤버를 추가하세요.
          </div>
        )}
      </div>
      {toast.node}
    </div>
  )
}

function MemberRow({
  member,
  active,
  dirty,
  onSelect,
}: {
  member: Member
  active: boolean
  dirty: boolean
  onSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: member.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={classNames(
        'group flex items-center gap-1 rounded-xl p-1.5 transition-colors',
        active ? 'bg-ink text-white' : 'bg-surface hover:bg-white',
        isDragging && 'z-10 opacity-80',
      )}
    >
      <button
        type='button'
        aria-label='드래그해서 순서 변경'
        {...attributes}
        {...listeners}
        className={classNames(
          'flex h-10 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-md',
          active ? 'text-white/30 hover:text-white' : 'text-ink/20 hover:text-ink',
        )}
      >
        <GoGrabber size={14} />
      </button>
      <button type='button' onClick={onSelect} className='flex min-w-0 flex-1 items-center gap-3 text-left'>
        <span className='size-10 shrink-0 overflow-hidden rounded-lg bg-field'>
          {member.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.cover_image_url} alt='' className='size-full object-cover' />
          )}
        </span>
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='flex items-center gap-1.5 truncate text-sm'>
            {member.name || '이름 없음'}
            {dirty && <span className='size-1.5 shrink-0 rounded-full bg-[#e0a526]' title='저장 안 된 변경' />}
          </span>
          <span className={classNames('truncate text-xs', active ? 'text-white/50' : 'text-mute')}>
            {member.role || '역할 없음'}
          </span>
        </span>
        {!member.published && (
          <span className={classNames('shrink-0 pr-1 text-[11px]', active ? 'text-white/50' : 'text-mute')}>비공개</span>
        )}
      </button>
    </li>
  )
}
