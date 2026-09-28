'use client'

import classNames from 'classnames'
import { useState } from 'react'
import { MemberModal } from '@/app/members/components/MemberModal'
import { ROW_HOVER } from '@/components/admin/styles'
import { useToast } from '@/components/admin/ui'
import { ProfileImage } from '@/components/ProfileImage'
import type { Member } from '@/types/cms'
import { IoIosMore } from 'react-icons/io'

/**
 * 멤버 목록 한 줄. 누르면 프로필카드 모달이 뜬다.
 * 계정(AdminUser)을 통째로 받지 않는다: 전화번호 같은 개인정보가 브라우저로 넘어가지 않도록
 * 서버에서 보여줄 값만 골라 넘긴다.
 */
export function MemberRow({
  name,
  profile,
  isMe,
}: {
  name: string
  /** 프로필카드 (없으면 눌렀을 때 모달 대신 "아직 없어요" 안내) */
  profile: Member | null
  isMe: boolean
}) {
  const [open, setOpen] = useState(false)
  const toast = useToast()

  // 프로필카드가 없으면 모달 대신 아래에 안내를 띄운다
  const openCard = () => {
    if (profile) return setOpen(true)
    toast.show(
      isMe ? '아직 프로필카드가 없어요. 프로필 설정에서 만들 수 있어요' : `${name}님은 아직 프로필카드가 없어요`,
      'info',
    )
  }

  return (
    <>
      <li
        role='button'
        tabIndex={0}
        onClick={openCard}
        onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && (event.preventDefault(), openCard())}
        className={classNames(
          'flex cursor-pointer items-center justify-between',
          'gap-2 pl-3 pr-2 py-2 text-sm',
          ROW_HOVER,
        )}
      >
        <div className={classNames('flex w-full items-center justify-start gap-3 text-left')}>
          <span className='flex min-w-0 items-center gap-2'>
            <ProfileImage src={profile?.cover_image_url} name={name} size='sm' className='size-8 shrink-0 text-xs' />
            <span className='truncate text-sm'>{name}</span>
            {isMe && <span className='shrink-0 text-xs text-mute'>나</span>}
          </span>
          {profile?.role ? (
            <span className='shrink-0 text-[10px] font-semibold font-mono text-neutral-500/50'>
              {profile.role.replace(' Member', '')}
            </span>
          ) : null}
        </div>
        <div className='ml-2 flex h-8 w-8 items-center justify-center rounded-full text-mute transition-colors hover:bg-surface'>
          <IoIosMore />
        </div>
      </li>
      {/* 줄 바깥에 둔다: 안에 두면 모달의 닫기 클릭이 React 트리를 타고 줄로 올라와 다시 열린다 */}
      {profile && <MemberModal member={open ? profile : null} onClose={() => setOpen(false)} />}
      {toast.node}
    </>
  )
}
