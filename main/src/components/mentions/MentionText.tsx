'use client'

import { Fragment } from 'react'
import { findMentions } from '@/lib/mentions'
import { useMentions, type MentionMember } from './MentionProvider'

/** 멘션 하나: 강조색 글자, 누르면 프로필카드 (목록 줄 · 카드 클릭으로 번지지 않게 막는다) */
export function MentionChip({ label, member }: { label: string; member: MentionMember }) {
  const { openMember } = useMentions()
  return (
    <span
      role='button'
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation()
        openMember(member)
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        event.stopPropagation()
        openMember(member)
      }}
      className='cursor-pointer font-medium text-accent hover:underline'
    >
      {label}
    </span>
  )
}

/** 글자 안의 '@이름'을 멘션으로 바꿔 그린다. 나머지는 그대로 (줄바꿈은 부모의 whitespace로) */
export function renderMentions(text: string, members: MentionMember[]): React.ReactNode {
  const matches = findMentions(text, members)
  if (matches.length === 0) return text
  const nodes: React.ReactNode[] = []
  let last = 0
  matches.forEach((match, index) => {
    if (match.start > last) nodes.push(<Fragment key={`t${index}`}>{text.slice(last, match.start)}</Fragment>)
    nodes.push(<MentionChip key={`m${index}`} label={match.label} member={match.members[0]} />)
    last = match.end
  })
  if (last < text.length) nodes.push(<Fragment key='rest'>{text.slice(last)}</Fragment>)
  return nodes
}

export function MentionText({ text }: { text: string }) {
  const { members } = useMentions()
  return <>{renderMentions(text, members)}</>
}
