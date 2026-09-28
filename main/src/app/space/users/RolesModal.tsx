'use client'

import { useState, useTransition } from 'react'
import { GoTrash } from 'react-icons/go'
import { Input, buttonClass, iconButtonClass } from '@/components/admin/ui'
import { Modal } from '@/components/admin/Modal'
import type { Member, MemberRole } from '@/types/cms'
import { createRoleAction, deleteRoleAction, renameRoleAction } from '../members/actions'

/**
 * 프로필 역할 목록 관리 (운영자). 멤버는 내 프로필에서 이 목록 중 하나를 고른다.
 * 이름을 바꾸면 그 역할을 쓰던 프로필도 함께 바뀌고, 지우면 비워진다.
 */
export function RolesModal({
  open,
  onClose,
  roles,
  profiles,
  onRolesChange,
  onProfilesChange,
  onMessage,
}: {
  open: boolean
  onClose: () => void
  roles: MemberRole[]
  profiles: Member[]
  onRolesChange: (roles: MemberRole[]) => void
  /** 이름 변경 · 삭제가 반영된 프로필 목록 */
  onProfilesChange: (update: (profiles: Member[]) => Member[]) => void
  onMessage: (message: string, tone?: 'success' | 'error') => void
}) {
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()
  const usage = (role: string) => profiles.filter((profile) => profile.role === role).length

  const add = (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    startTransition(async () => {
      const result = await createRoleAction(name)
      if ('message' in result) return onMessage(result.message, 'error')
      onRolesChange([...roles, result.role!])
      setName('')
      onMessage(`'${result.role!.name}' 역할을 추가했습니다`)
    })
  }

  const rename = (role: MemberRole, next: string) => {
    if (!next.trim() || next.trim() === role.name) return
    startTransition(async () => {
      const result = await renameRoleAction(role.id, next)
      if ('message' in result) return onMessage(result.message, 'error')
      const renamed = result.role!
      onRolesChange(roles.map((item) => (item.id === role.id ? renamed : item)))
      onProfilesChange((current) =>
        current.map((profile) => (profile.role === role.name ? { ...profile, role: renamed.name } : profile)),
      )
      onMessage(`'${role.name}' → '${renamed.name}'로 바꿨습니다`)
    })
  }

  const remove = (role: MemberRole) => {
    const count = usage(role.name)
    if (
      !confirm(
        `'${role.name}' 역할을 삭제할까요?${count ? `\n이 역할을 쓰는 프로필 ${count}개의 역할이 비워집니다.` : ''}`,
      )
    )
      return
    startTransition(async () => {
      const result = await deleteRoleAction(role.id)
      if ('message' in result) return onMessage(result.message, 'error')
      onRolesChange(roles.filter((item) => item.id !== role.id))
      onProfilesChange((current) =>
        current.map((profile) => (profile.role === role.name ? { ...profile, role: '' } : profile)),
      )
      onMessage(`'${role.name}' 역할을 삭제했습니다`)
    })
  }

  return (
    <Modal open={open} onClose={onClose} title='역할 관리' meta='멤버는 프로필카드 설정에서 이 목록 중 하나를 골라요.'>
      <div className='flex flex-col gap-3'>
        <form onSubmit={add} className='flex gap-2'>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder='새 역할 이름 (예: Designer)'
            maxLength={40}
          />
          <button
            type='submit'
            disabled={isPending || !name.trim()}
            className={buttonClass('primary', 'md', 'shrink-0')}
          >
            추가
          </button>
        </form>

        <ul className='flex flex-col gap-1'>
          {roles.map((role) => (
            <RoleRow
              key={`${role.id}:${role.name}`}
              role={role}
              usage={usage(role.name)}
              disabled={isPending}
              onRename={(next) => rename(role, next)}
              onRemove={() => remove(role)}
            />
          ))}
          {roles.length === 0 && (
            <li className='rounded-inner bg-surface px-3 py-8 text-center text-sm text-mute'>
              아직 역할이 없어요. 위에서 추가해 주세요.
            </li>
          )}
        </ul>
      </div>
    </Modal>
  )
}

/** 이름을 고치고 칸을 벗어나거나 Enter를 누르면 저장 */
function RoleRow({
  role,
  usage,
  disabled,
  onRename,
  onRemove,
}: {
  role: MemberRole
  usage: number
  disabled: boolean
  onRename: (name: string) => void
  onRemove: () => void
}) {
  const [value, setValue] = useState(role.name)

  return (
    <li className='rounded-inner flex items-center gap-2 bg-surface py-1.5 pr-1.5 pl-1.5'>
      <Input
        value={value}
        disabled={disabled}
        maxLength={40}
        aria-label={`${role.name} 이름`}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => (value.trim() ? onRename(value) : setValue(role.name))}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
          if (event.key === 'Escape') {
            setValue(role.name)
            event.stopPropagation()
          }
        }}
        className='bg-transparent focus:bg-field'
      />
      <span className='shrink-0 text-xs whitespace-nowrap text-mute'>
        {usage ? `${usage}명 사용 중` : '사용 안 함'}
      </span>
      <button
        type='button'
        disabled={disabled}
        onClick={onRemove}
        className={iconButtonClass({ danger: true })}
        title='삭제'
      >
        <GoTrash size={14} />
      </button>
    </li>
  )
}
