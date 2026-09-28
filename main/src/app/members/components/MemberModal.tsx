'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { GoX } from 'react-icons/go'
import { Arrow } from '@/components/Typography'
import type { Member } from '@/types/cms'
import { ProfileImage } from '@/components/ProfileImage'

/** 프로필을 누르면 뜨는 상세 카드 */
export function MemberModal({ member, onClose }: { member: Member | null; onClose: () => void }) {
  useEffect(() => {
    if (!member) return
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [member, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {member && (
        <motion.div
          className='fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role='dialog'
          aria-modal='true'
          aria-label={`${member.name} 소개`}
        >
          <motion.div
            initial={{ y: 24, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
            className='relative max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-block bg-surface p-5 ring-1 ring-ink/10 sm:p-6'
          >
            <button
              type='button'
              onClick={onClose}
              aria-label='닫기'
              className='absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-full bg-paper/80 text-ink transition-colors hover:bg-tile'
            >
              <GoX size={16} />
            </button>
            <MemberDetail member={member} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** 모달 안의 멤버 상세 (소개를 마우스 오버 없이 바로 보여준다) */
function MemberDetail({ member }: { member: Member }) {
  const { name, sub_name: subName, role, description, cover_image_url: photo, email, website, fields } = member
  const websiteUrl = website && (/^https?:\/\//.test(website) ? website : `https://${website}`)

  return (
    <div className='flex flex-col gap-4'>
      <div className='aspect-square w-full overflow-hidden bg-tile'>
        <ProfileImage src={photo} name={name} className='size-full p-[8%]' />
      </div>
      <div className='flex flex-col gap-1'>
        <div className='flex items-baseline justify-between gap-3'>
          <h3 className='text-2xl font-medium tracking-[-0.03em]'>{name}</h3>
          {role && <span className='shrink-0 text-xs text-mute'>{role}</span>}
        </div>
        {subName && <p className='break-keep text-sm text-mute'>{subName}</p>}
      </div>
      {description && <p className='break-keep text-sm leading-relaxed'>{description}</p>}
      {fields.length > 0 && <p className='break-keep text-xs leading-relaxed text-mute'>{fields.join(' · ')}</p>}
      {(email || websiteUrl) && (
        <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm'>
          {email && (
            <a href={`mailto:${email.trim()}`} className='inline-flex items-center gap-1 transition-colors hover:text-mute'>
              Email
              <Arrow className='size-3.5' />
            </a>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1 transition-colors hover:text-mute'
            >
              Website
              <Arrow className='size-3.5' />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
