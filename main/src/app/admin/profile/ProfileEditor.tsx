'use client'

import { useRouter } from 'next/navigation'
import classNames from 'classnames'
import { useState, useTransition } from 'react'
import { GoEye } from 'react-icons/go'
import { Input, PageHeader, Panel, buttonClass, useSaveShortcut, useToast, useUnsavedWarning } from '@/components/admin/ui'
import { PreviewModal } from '@/components/admin/PreviewModal'
import { deleteImage, isOwnStorageUrl, uploadImage } from '@/lib/storage'
import type { Member } from '@/types/cms'
import { MemberCard } from '@/app/members/components/MemberCard'
import { MemberForm, toMemberDraft, type MemberDraft } from '../members/MemberForm'
import {
  claimMemberProfileAction,
  createMyProfileAction,
  skipProfileSetupAction,
  updateMyProfileAction,
} from '../members/actions'

type UnassignedMember = Pick<Member, 'id' | 'name' | 'sub_name' | 'role' | 'cover_image_url' | 'published'>

export function ProfileEditor({
  member,
  roles,
  fieldSuggestions,
  welcome,
  userName,
  unassigned,
}: {
  member: Member | null
  roles: string[]
  fieldSuggestions: string[]
  /** 첫 로그인 안내 */
  welcome: boolean
  userName: string
  /** 아직 어떤 계정에도 연결되지 않은 멤버 프로필 */
  unassigned: UnassignedMember[]
}) {
  const router = useRouter()
  const toast = useToast()
  const [saved, setSaved] = useState(member)
  const [draft, setDraft] = useState<MemberDraft | null>(member ? toMemberDraft(member) : null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const dirty = Boolean(saved && draft && JSON.stringify(toMemberDraft(saved)) !== JSON.stringify(draft))
  useUnsavedWarning(dirty)

  const patch = <K extends keyof MemberDraft>(key: K, value: MemberDraft[K]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current))

  const save = () => {
    if (!draft || !dirty || isPending) return
    startTransition(async () => {
      try {
        const result = await updateMyProfileAction(draft)
        setSaved(result)
        setDraft(toMemberDraft(result))
        toast.show('프로필을 저장했습니다')
      } catch {
        toast.show('저장하지 못했습니다', 'error')
      }
    })
  }
  useSaveShortcut(save)

  const uploadPhoto = async (file: File) => {
    if (!saved || !draft) return
    try {
      const previous = draft.cover_image_url
      const url = await uploadImage(file, 'project-media', `members/${saved.id}`)
      patch('cover_image_url', url)
      if (previous && isOwnStorageUrl(previous)) await deleteImage(previous).catch(() => undefined)
    } catch {
      toast.show('사진을 업로드하지 못했습니다', 'error')
    }
  }

  if (!saved || !draft) {
    return (
      <ProfileSetup welcome={welcome} userName={userName} unassigned={unassigned} onDone={() => router.refresh()} />
    )
  }

  return (
    <div className='flex flex-col gap-3'>
      <PageHeader
        title='내 프로필'
        description='Members 페이지에 보이는 내 소개를 관리합니다.'
        actions={
          <>
            {dirty && <span className='text-xs text-mute'>저장 안 된 변경</span>}
            <button type='button' onClick={() => setPreviewOpen(true)} className={buttonClass('secondary')}>
              <GoEye size={14} />
              미리보기
            </button>
            <button type='button' onClick={save} disabled={!dirty || isPending} className={buttonClass('primary')}>
              {isPending ? '저장 중…' : '저장'}
              <kbd className='hidden font-sans text-[11px] text-white/50 sm:inline'>⌘S</kbd>
            </button>
          </>
        }
      />

      <div className='grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_280px]'>
        <div className='flex flex-col gap-3'>
          <MemberForm
            draft={draft}
            patch={patch}
            onUpload={uploadPhoto}
            roles={roles}
            fieldSuggestions={fieldSuggestions}
          />
        </div>
        <div className='flex flex-col gap-3 xl:sticky xl:top-12 xl:self-start'>
          <span className='text-xs text-mute'>사이트 카드</span>
          <MemberCard member={{ ...saved, ...draft }} />
        </div>
      </div>

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={draft.name}
        meta={dirty ? '저장 전 내용' : draft.published ? '/members' : '비공개'}
      >
        <div className='flex flex-col gap-8 px-4 py-8 md:px-8'>
          <p className='text-sm text-mute'>Members 페이지에서 이렇게 보여요. 사진에 마우스를 올려 보세요.</p>
          <div className='grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-4'>
            <MemberCard member={{ ...saved, ...draft }} />
          </div>
        </div>
      </PreviewModal>
      {toast.node}
    </div>
  )
}

/** 연결된 프로필이 없을 때: 기존 프로필 중 내 것 고르기 / 새로 만들기 / 나중에 (첫 로그인 안내 겸용) */
function ProfileSetup({
  welcome,
  userName,
  unassigned,
  onDone,
}: {
  welcome: boolean
  userName: string
  unassigned: UnassignedMember[]
  onDone: () => void
}) {
  const router = useRouter()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // 내 이름과 같은 프로필을 먼저 보여준다
  const sameName = (item: UnassignedMember) => item.name.replace(/\s/g, '') === userName.replace(/\s/g, '')
  const q = query.trim().toLowerCase()
  const candidates = unassigned
    .filter((item) => !q || [item.name, item.sub_name, item.role].some((text) => text?.toLowerCase().includes(q)))
    .sort((a, b) => Number(sameName(b)) - Number(sameName(a)))
  const selected = unassigned.find((item) => item.id === selectedId)

  const claim = () => {
    if (!selected) return
    if (!confirm(`'${selected.name}' 프로필을 내 계정에 연결할까요?\n연결하면 이 프로필을 직접 수정할 수 있어요.`))
      return
    startTransition(async () => {
      const result = await claimMemberProfileAction(selected.id)
      if ('message' in result) return toast.show(result.message, 'error')
      toast.show('프로필을 연결했습니다')
      onDone()
    })
  }

  const create = () =>
    startTransition(async () => {
      await createMyProfileAction()
      onDone()
    })

  const skip = () =>
    startTransition(async () => {
      await skipProfileSetupAction()
      router.replace('/admin')
    })

  return (
    <div className='flex flex-col gap-4'>
      <PageHeader
        title={welcome ? `환영해요, ${userName}님` : '내 프로필'}
        description={
          welcome
            ? '먼저 Members 페이지에 보일 내 멤버 프로필을 연결해 주세요.'
            : '아직 계정에 연결된 멤버 프로필이 없어요.'
        }
      />

      {/* 1. 기존 프로필 중 내 것 */}
      {unassigned.length > 0 && (
        <Panel title='이미 사이트에 등록된 멤버라면'>
          <p className='break-keep text-sm leading-relaxed text-mute'>
            관리자가 미리 만들어 둔 프로필 중 아직 아무 계정에도 연결되지 않은 것들이에요. 내 프로필이 있다면 골라서
            연결하세요.
          </p>
          {unassigned.length > 8 && (
            <Input
              type='search'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='이름으로 찾기'
              className='sm:max-w-xs'
            />
          )}
          <ul className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4'>
            {candidates.map((item) => (
              <li key={item.id}>
                <button
                  type='button'
                  aria-pressed={selectedId === item.id}
                  onClick={() => setSelectedId((current) => (current === item.id ? null : item.id))}
                  className={classNames(
                    'flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors',
                    selectedId === item.id ? 'bg-ink text-white' : 'bg-field hover:bg-tile',
                  )}
                >
                  <span className='size-10 shrink-0 overflow-hidden rounded-full bg-tile'>
                    {item.cover_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.cover_image_url} alt='' className='size-full object-cover' />
                    )}
                  </span>
                  <span className='flex min-w-0 flex-col'>
                    <span className='truncate text-sm'>
                      {item.name}
                      {sameName(item) && (
                        <span
                          className={classNames(
                            'ml-1.5 text-[11px]',
                            selectedId === item.id ? 'text-white/60' : 'text-mute',
                          )}
                        >
                          이름 일치
                        </span>
                      )}
                    </span>
                    <span
                      className={classNames(
                        'truncate text-[11px]',
                        selectedId === item.id ? 'text-white/60' : 'text-mute',
                      )}
                    >
                      {[item.role, item.published ? null : '비공개'].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {candidates.length === 0 && <li className='col-span-full text-sm text-mute'>찾는 이름이 없어요.</li>}
          </ul>
          <button
            type='button'
            disabled={!selected || isPending}
            onClick={claim}
            className={buttonClass('primary', 'md', 'self-start')}
          >
            {selected ? `'${selected.name}' 프로필이 저예요` : '프로필을 골라 주세요'}
          </button>
        </Panel>
      )}

      {/* 2. 새로 만들기 */}
      <Panel title={unassigned.length > 0 ? '목록에 내 프로필이 없다면' : '새 프로필 만들기'}>
        <p className='max-w-md break-keep text-sm leading-relaxed text-mute'>
          새로 만들면 사진, 소개, 분야를 직접 작성할 수 있어요. 처음에는 비공개로 만들어지고, 준비가 되면 공개로 바꾸면
          Members 페이지에 표시됩니다.
        </p>
        <button type='button' disabled={isPending} onClick={create} className={buttonClass('secondary', 'md', 'self-start')}>
          {isPending ? '처리 중…' : '내 프로필 새로 만들기'}
        </button>
      </Panel>

      {welcome && (
        <button type='button' disabled={isPending} onClick={skip} className={buttonClass('ghost', 'md', 'self-start')}>
          나중에 할게요
        </button>
      )}
      {toast.node}
    </div>
  )
}
