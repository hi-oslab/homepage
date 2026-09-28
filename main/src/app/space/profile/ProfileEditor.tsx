'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { GoEye } from 'react-icons/go'
import {
  EditorBar,
  ImageDrop,
  PageHeader,
  SaveState,
  SectionCard,
  Switch,
  buttonClass,
  useSaveShortcut,
  useToast,
  useUnsavedWarning,
} from '@/components/admin/ui'
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
    <div className='flex flex-col gap-6'>
      {/* 상단 바: 저장 상태 · 공개 여부 · 미리보기 · 저장 (프로젝트 편집과 같은 모양) */}
      <EditorBar>
        <div className='flex min-w-0 items-baseline gap-3'>
          <h1 className='truncate text-lg font-medium tracking-[-0.02em]'>프로필카드 설정</h1>
          <SaveState dirty={dirty} saving={isPending} className='hidden sm:inline-flex' />
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <span
            title={draft.published ? '저장하면 Members 페이지에 표시됩니다' : '비공개 프로필은 사이트에 표시되지 않습니다'}
            className='mr-1 flex items-center'
          >
            <Switch
              checked={draft.published}
              onChange={(value) => patch('published', value)}
              label={draft.published ? '공개' : '비공개'}
            />
          </span>
          <button type='button' onClick={() => setPreviewOpen(true)} className={buttonClass('secondary')}>
            <GoEye size={14} />
            <span className='hidden sm:inline'>미리보기</span>
          </button>
          <button type='button' onClick={save} disabled={!dirty || isPending} className={buttonClass('primary')}>
            저장
            <kbd className='hidden font-sans text-[11px] text-paper/50 sm:inline'>⌘S</kbd>
          </button>
        </div>
      </EditorBar>

      {/* 넓은 화면: 왼쪽에 이미지 · 카드 미리보기 고정, 오른쪽에 정보 상자. 최대 960px */}
      <div className='mx-auto grid w-full max-w-[960px] grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]'>
        <aside className='flex flex-col gap-4 lg:sticky lg:top-[calc(var(--spacing-header)+5rem)] lg:self-start'>
          <SectionCard title='프로필 이미지' description='투명 PNG 아이콘을 추천해요. 배경이 있는 사진은 원 · 사각형 · 별 모양으로 오려서 저장돼요.'>
            <ImageDrop
              url={draft.cover_image_url}
              onUpload={async (file) => setCropFile(file)}
              onEdit={editCurrentImage}
              onRemove={() => patch('cover_image_url', null)}
              aspect='aspect-square'
              label='이미지를 끌어다 놓거나 눌러서 올리기'
              // 투명 PNG를 자르지 않고, 모양을 따라 그림자
              imageClassName='object-contain p-[8%] drop-shadow-[0_8px_18px_rgb(var(--shadow-rgb)/0.18)]'
            />
          </SectionCard>
          <div className='hidden flex-col gap-2 lg:flex'>
            <span className='px-1 text-xs text-mute'>Members 카드 미리보기</span>
            <MemberCard member={{ ...saved, ...draft }} />
          </div>
        </aside>

        <div className='flex min-w-0 flex-col gap-4'>
          <MemberForm draft={draft} patch={patch} roles={roles} fieldSuggestions={fieldSuggestions} />
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
    <div className='mx-auto flex w-full max-w-[640px] flex-col gap-4'>
      <PageHeader
        title={welcome ? `환영해요, ${userName}님` : '프로필카드 설정'}
        description={
          welcome ? '먼저 Members 페이지에 보일 프로필카드를 만들어 주세요.' : '아직 프로필카드가 없어요.'
        }
      />
      <SectionCard
        title='프로필카드 만들기'
        description='이미지, 소개, 분야를 직접 작성할 수 있어요. 처음에는 비공개로 만들어지고, 준비가 되면 공개로 바꾸면 Members 페이지에 표시돼요.'
      >
        <div className='flex flex-wrap gap-2'>
          <button type='button' disabled={isPending} onClick={create} className={buttonClass('primary')}>
            {isPending ? '만드는 중…' : '프로필카드 만들기'}
          </button>
          {welcome && (
            <button type='button' disabled={isPending} onClick={skip} className={buttonClass('ghost')}>
              나중에 할게요
            </button>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
