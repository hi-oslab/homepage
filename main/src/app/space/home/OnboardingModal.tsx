'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Modal } from '@/components/admin/Modal'
import { ProfileImageCropper } from '@/components/admin/ProfileImageCropper'
import { ImageDrop, Switch, buttonClass, useToast } from '@/components/admin/ui'
import { deleteImage, isOwnStorageUrl, uploadImage } from '@/lib/storage'
import type { Member } from '@/types/cms'
import { MemberForm, toMemberDraft, type MemberDraft } from '../members/MemberForm'
import { completeOnboardingAction, createMyProfileAction } from '../members/actions'
import { HOME_INTRO_EVENT } from './PopIn'

/**
 * 프로필 설정 창 (space/layout.tsx): 첫 방문을 안 끝냈거나 프로필카드가 없으면 멤버 공간 어느 화면에서든 뜬다.
 * 닫기 · 건너뛰기 없음. '완료하기'를 누르면 저장 · 첫 방문을 끝내고, 채운 정보가 반영된 홈으로 간다.
 * 프로필카드가 없으면 비공개로 먼저 만들어 둔다 (이미지를 올릴 자리가 필요해서).
 * 프로필카드 설정 화면에서는 띄우지 않는다 (그 화면이 직접 만들고 고치므로, 둘이 동시에 만들지 않게).
 */
export function OnboardingModal({
  member,
  roles,
  fieldSuggestions,
  userName,
}: {
  member: Member | null
  roles: string[]
  fieldSuggestions: string[]
  userName: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const onProfilePage = pathname.startsWith('/space/profile')
  const toast = useToast()
  const [open, setOpen] = useState(true)
  const [saved, setSaved] = useState(member)
  const [draft, setDraft] = useState<MemberDraft | null>(member ? toMemberDraft(member) : null)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()

  // 프로필카드가 없으면 먼저 만든다
  const started = useRef(false)
  useEffect(() => {
    if (member || onProfilePage || started.current) return
    started.current = true
    createMyProfileAction().then(
      (created) => {
        setSaved(created)
        setDraft(toMemberDraft(created))
      },
      () => toast.show('프로필카드를 준비하지 못했어요. 새로고침해 주세요', 'error'),
    )
  }, [member, onProfilePage, toast])

  const patch = <K extends keyof MemberDraft>(key: K, value: MemberDraft[K]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current))

  const uploadPhoto = async (file: File) => {
    if (!saved || !draft) return
    try {
      const previous = draft.cover_image_url
      const url = await uploadImage(file, 'project-media', `members/${saved.id}`, { keepFormat: true })
      patch('cover_image_url', url)
      setCropFile(null)
      if (previous && isOwnStorageUrl(previous)) await deleteImage(previous).catch(() => undefined)
    } catch {
      toast.show('이미지를 업로드하지 못했어요', 'error')
    }
  }

  const complete = () => {
    if (!draft || !draft.name.trim() || isPending) return
    startTransition(async () => {
      try {
        await completeOnboardingAction(draft)
        setOpen(false)
        // 홈으로 (이미 홈이면 다시 그려) 방금 채운 프로필(인사 · 멤버 목록)을 반영한다
        if (pathname === '/space') {
          router.refresh()
          // 기다리던 홈 섹션들이 이제 톡톡 등장한다
          window.dispatchEvent(new Event(HOME_INTRO_EVENT))
        } else router.push('/space')
      } catch (error) {
        toast.show(error instanceof Error && error.message ? error.message : '저장하지 못했어요', 'error')
      }
    })
  }

  return (
    <>
      <Modal
        open={open && !onProfilePage}
        onClose={() => undefined}
        dismissible={false}
        size='lg'
        title={`환영해요, ${userName}님`}
        meta='Members 페이지에 보일 프로필카드를 채워 주세요. 나중에 프로필카드 설정에서 언제든 고칠 수 있어요.'
        footer={
          draft && (
            <>
              <span
                title={
                  draft.published ? 'Members 페이지에 표시돼요' : '사이트에 표시되지 않아요. 준비되면 공개로 바꾸세요'
                }
              >
                <Switch
                  checked={draft.published}
                  onChange={(value) => patch('published', value)}
                  label={draft.published ? 'Members에 공개' : '비공개로 시작'}
                />
              </span>
              <button
                type='button'
                disabled={!draft.name.trim() || isPending}
                onClick={complete}
                className={buttonClass('primary', 'md', 'ml-auto')}
              >
                {isPending ? '저장 중…' : '완료하기'}
              </button>
            </>
          )
        }
      >
        {draft ? (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-[200px_minmax(0,1fr)]'>
            <div className='flex flex-col gap-2'>
              <span className='text-xs text-mute'>프로필 이미지</span>
              <ImageDrop
                url={draft.cover_image_url}
                onUpload={async (file) => setCropFile(file)}
                onRemove={() => patch('cover_image_url', null)}
                aspect='aspect-square'
                label='이미지를 끌어다 놓거나 눌러서 올리기'
                imageClassName='object-contain p-[8%] drop-shadow-[0_8px_18px_rgb(var(--shadow-rgb)/0.18)]'
              />
              <span className='text-[11px] leading-snug text-mute'>
                투명 PNG를 추천해요. 사진은 원 · 사각형 · 별 모양으로 오려서 저장돼요.
              </span>
            </div>
            <div className='flex min-w-0 flex-col gap-3'>
              <MemberForm draft={draft} patch={patch} roles={roles} fieldSuggestions={fieldSuggestions} />
            </div>
          </div>
        ) : (
          <p className='py-10 text-center text-sm text-mute'>프로필카드를 준비하고 있어요…</p>
        )}
      </Modal>
      <ProfileImageCropper file={cropFile} onCancel={() => setCropFile(null)} onConfirm={uploadPhoto} />
      {toast.node}
    </>
  )
}
