'use client'

import { Select, Switch, buttonClass } from '@/components/admin/ui'
import type { Member } from '@/types/cms'
import { ProfileImage } from '@/components/ProfileImage'

/*
 * 멤버 관리 안의 프로필 (Members 페이지에 보이는 카드)
 * 내용은 각 멤버가 '내 프로필'에서 직접 고치고, 운영자는 공개 여부 · 삭제만 정한다.
 * 순서는 따로 없고 가입 시기 최신순으로 보여준다 (lib/cms.ts sortByJoined).
 */

/** 멤버 상세 안의 프로필 요약: 읽기 전용 + 공개 전환 + 삭제 */
export function MemberProfileSection({
  member,
  roles,
  busy,
  onTogglePublished,
  onChangeRole,
  onRemove,
}: {
  member: Member | null
  /** 역할 목록 (운영자가 관리) */
  roles: string[]
  busy: boolean
  onTogglePublished: (published: boolean) => void
  onChangeRole: (role: string) => void
  onRemove: () => void
}) {
  if (!member) {
    return (
      <div className='rounded-inner flex flex-col gap-1 bg-surface p-3'>
        <span className='text-xs text-mute'>Members 페이지 프로필</span>
        <span className='text-sm text-mute'>아직 프로필을 만들지 않았어요.</span>
      </div>
    )
  }

  const rows = [
    ['한 줄 소개', member.sub_name],
    ['분야', member.fields.join(', ')],
    ['이메일', member.email],
    ['웹사이트', member.website],
  ].filter(([, value]) => value)

  return (
    <div className='rounded-inner flex flex-col gap-3 bg-surface p-3'>
      <div className='flex items-center justify-between gap-3'>
        <span className='text-xs text-mute'>Members 페이지 프로필 · 역할 말고는 본인이 관리해요</span>
        <Switch
          checked={member.published}
          disabled={busy}
          onChange={onTogglePublished}
          label={member.published ? '공개' : '비공개'}
        />
      </div>
      <div className='flex gap-3'>
        <ProfileImage src={member.cover_image_url} name={member.name} className='size-20 shrink-0 p-1' />
        <div className='flex min-w-0 flex-1 flex-col gap-2 text-sm'>
          <span className='text-[15px]'>{member.name || '이름 없음'}</span>
          <label className='flex items-center gap-3'>
            <span className='w-14 shrink-0 text-xs text-mute'>역할</span>
            <Select
              value={member.role}
              disabled={busy}
              onChange={(event) => onChangeRole(event.target.value)}
              className='w-auto py-1.5 text-xs'
            >
              <option value=''>선택 안 함</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
              {member.role && !roles.includes(member.role) && (
                <option value={member.role}>{member.role} (목록에 없음)</option>
              )}
            </Select>
          </label>
          {rows.length > 0 && (
            <dl className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1'>
              {rows.map(([label, value]) => (
                <div key={label} className='contents'>
                  <dt className='text-xs text-mute'>{label}</dt>
                  <dd className='truncate text-xs'>{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {member.description && (
            <p className='line-clamp-3 break-keep text-xs leading-relaxed text-ink/70'>{member.description}</p>
          )}
        </div>
      </div>
      <button type='button' disabled={busy} onClick={onRemove} className={buttonClass('danger', 'sm', 'self-start')}>
        프로필 삭제
      </button>
    </div>
  )
}
