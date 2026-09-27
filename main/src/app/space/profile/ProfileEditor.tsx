'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { GoEye } from 'react-icons/go'
import { PageHeader, Panel, buttonClass, useSaveShortcut, useToast, useUnsavedWarning } from '@/components/admin/ui'
import { PreviewModal } from '@/components/admin/PreviewModal'
import { ProfileImageCropper } from '@/components/admin/ProfileImageCropper'
import { deleteImage, isOwnStorageUrl, uploadImage } from '@/lib/storage'
import type { Member } from '@/types/cms'
import { MemberCard } from '@/app/members/components/MemberCard'
import { MemberForm, toMemberDraft, type MemberDraft } from '../members/MemberForm'
import {
  createMyProfileAction,
  skipProfileSetupAction,
  updateMyProfileAction,
} from '../members/actions'

export function ProfileEditor({
  member,
  roles,
  fieldSuggestions,
  welcome,
  userName,
}: {
  member: Member | null
  roles: string[]
  fieldSuggestions: string[]
  /** 첫 로그인 안내 */
  welcome: boolean
  userName: string
}) {
  const router = useRouter()
  const toast = useToast()
  const [saved, setSaved] = useState(member)
  const [draft, setDraft] = useState<MemberDraft | null>(member ? toMemberDraft(member) : null)
  const [previewOpen, setPreviewOpen] = useState(false)
  // 고른 이미지는 바로 올리지 않고 자르기 모달을 거친다
  const [cropFile, setCropFile] = useState<File | null>(null)
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
      // 잘라낸 투명 PNG는 변환하지 않고 그대로 올린다
      const url = await uploadImage(file, 'project-media', `members/${saved.id}`, { keepFormat: true })
      patch('cover_image_url', url)
      setCropFile(null)
      toast.show('이미지를 바꿨어요. 저장하면 반영됩니다')
      if (previous && isOwnStorageUrl(previous)) await deleteImage(previous).catch(() => undefined)
    } catch {
      toast.show('이미지를 업로드하지 못했습니다', 'error')
    }
  }

  /** 지금 올라가 있는 이미지를 불러와 다시 자르기 (예전 사진을 원·별 모양으로) */
  const editCurrentImage = async () => {
    if (!draft?.cover_image_url) return
    try {
      const response = await fetch(draft.cover_image_url)
      if (!response.ok) throw new Error(String(response.status))
      const blob = await response.blob()
      setCropFile(new File([blob], 'profile', { type: blob.type || 'image/png' }))
    } catch {
      toast.show('지금 이미지를 불러오지 못했어요. 새 이미지를 올려 주세요', 'error')
    }
  }

  if (!saved || !draft) {
    return (
      <ProfileSetup welcome={welcome} userName={userName} onDone={() => router.refresh()} />
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
            onUpload={async (file) => setCropFile(file)}
            onEditImage={editCurrentImage}
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
      <ProfileImageCropper file={cropFile} onCancel={() => setCropFile(null)} onConfirm={uploadPhoto} />
      {toast.node}
    </div>
  )
}

/** 연결된 프로필이 없을 때: 새로 만들기 / 나중에 (첫 로그인 안내 겸용) */
function ProfileSetup({ welcome, userName, onDone }: { welcome: boolean; userName: string; onDone: () => void }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const create = () =>
    startTransition(async () => {
      await createMyProfileAction()
      onDone()
    })

  const skip = () =>
    startTransition(async () => {
      await skipProfileSetupAction()
      router.replace('/space')
    })

  return (
    <div className='flex flex-col gap-4'>
      <PageHeader
        title={welcome ? `환영해요, ${userName}님` : '내 프로필'}
        description={
          welcome ? '먼저 Members 페이지에 보일 내 프로필을 만들어 주세요.' : '아직 내 프로필이 없어요.'
        }
      />
      <Panel title='내 프로필 만들기'>
        <p className='max-w-md break-keep text-sm leading-relaxed text-mute'>
          사진, 소개, 분야를 직접 작성할 수 있어요. 처음에는 비공개로 만들어지고, 준비가 되면 공개로 바꾸면 Members
          페이지에 표시됩니다.
        </p>
        <button type='button' disabled={isPending} onClick={create} className={buttonClass('primary', 'md', 'self-start')}>
          {isPending ? '만드는 중…' : '내 프로필 만들기'}
        </button>
      </Panel>
      {welcome && (
        <button type='button' disabled={isPending} onClick={skip} className={buttonClass('ghost', 'md', 'self-start')}>
          나중에 할게요
        </button>
      )}
    </div>
  )
}
