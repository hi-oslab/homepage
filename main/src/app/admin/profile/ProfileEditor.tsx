'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { GoEye } from 'react-icons/go'
import { PageHeader, Panel, useSaveShortcut, useToast, useUnsavedWarning } from '@/components/admin/ui'
import { PreviewModal } from '@/components/admin/PreviewModal'
import { deleteImage, isOwnStorageUrl, uploadImage } from '@/lib/storage'
import type { Member } from '@/types/cms'
import { MemberCard } from '@/app/members/components/MemberCard'
import { MemberForm, toMemberDraft, type MemberDraft } from '../members/MemberForm'
import { createMyProfileAction, updateMyProfileAction } from '../members/actions'

export function ProfileEditor({
  member,
  roles,
  fieldSuggestions,
}: {
  member: Member | null
  roles: string[]
  fieldSuggestions: string[]
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
      <div className='flex flex-col gap-4'>
        <PageHeader title='내 프로필' />
        <Panel className='items-start py-10'>
          <p className='text-2xl font-medium tracking-[-0.03em]'>아직 멤버 프로필이 없어요.</p>
          <p className='max-w-md break-keep text-sm leading-relaxed text-mute'>
            프로필을 만들면 사진, 소개, 분야를 직접 작성할 수 있어요. 처음에는 비공개로 만들어지고, 준비가 되면 공개로 바꾸면
            Members 페이지에 표시됩니다. 이미 사이트에 등록된 멤버라면 마스터에게 계정 연결을 요청해 주세요.
          </p>
          <button
            type='button'
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await createMyProfileAction()
                router.refresh()
              })
            }
            className='btn btn-primary mt-2'
          >
            {isPending ? '만드는 중…' : '내 프로필 만들기'}
          </button>
        </Panel>
        {toast.node}
      </div>
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
            <button type='button' onClick={() => setPreviewOpen(true)} className='btn btn-secondary'>
              <GoEye size={14} />
              미리보기
            </button>
            <button type='button' onClick={save} disabled={!dirty || isPending} className='btn btn-primary'>
              {isPending ? '저장 중…' : '저장'}
              <kbd className='hidden font-sans text-[11px] text-white/50 sm:inline'>⌘S</kbd>
            </button>
          </>
        }
      />

      <div className='grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_280px]'>
        <div className='flex flex-col gap-3'>
          <MemberForm draft={draft} patch={patch} onUpload={uploadPhoto} roles={roles} fieldSuggestions={fieldSuggestions} />
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
