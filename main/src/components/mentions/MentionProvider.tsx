'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { MemberModal } from '@/app/members/components/MemberModal'
import { useToast } from '@/components/admin/ui'
import type { Member } from '@/types/cms'

/** 언급할 수 있는 멤버 (승인된 계정). 전화번호 등은 빼고 보여줄 값만 (username: 같은 이름 구분 · 멘션 저장용) */
export type MentionMember = { id: string; name: string; username: string; image: string | null; profile: Member | null }

type MentionApi = {
  members: MentionMember[]
  /** 멘션을 누르면: 프로필카드 모달, 없으면 안내 */
  openMember: (member: MentionMember) => void
}

const MentionContext = createContext<MentionApi>({ members: [], openMember: () => {} })

export const useMentions = () => useContext(MentionContext)

/**
 * 멤버 공간 전체에 멤버 목록을 나눠 준다 (space/layout.tsx).
 * 모달이 body로 나가도(portal) React 트리 안이라 같은 목록을 쓴다.
 */
export function MentionProvider({ members, children }: { members: MentionMember[]; children: React.ReactNode }) {
  const [open, setOpen] = useState<Member | null>(null)
  const { show, node } = useToast()

  const openMember = useCallback(
    (member: MentionMember) => {
      if (member.profile) setOpen(member.profile)
      else show(`${member.name}님은 아직 프로필카드가 없어요`, 'info')
    },
    [show],
  )
  const value = useMemo(() => ({ members, openMember }), [members, openMember])

  return (
    <MentionContext.Provider value={value}>
      {children}
      <MemberModal member={open} onClose={() => setOpen(null)} />
      {node}
    </MentionContext.Provider>
  )
}

/**
 * 블록 에디터 문단에서도 '@'로 멤버를 고를 수 있게 켠다 (게시판 글쓰기만).
 * 프로젝트 편집처럼 공개 페이지에 나가는 글에서는 꺼 둔다.
 */
const MentionInputContext = createContext(false)
export const useMentionInput = () => useContext(MentionInputContext)
export const MentionInputScope = ({ children }: { children: React.ReactNode }) => (
  <MentionInputContext.Provider value>{children}</MentionInputContext.Provider>
)
