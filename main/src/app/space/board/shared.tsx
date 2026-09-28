import classNames from 'classnames'
import { BOARDS, type CommunityKind } from '@/lib/community-types'

/** 게시판을 보는 사람 */
export type Viewer = { id: string; isMaster: boolean }

/** 게시판 종류 표시 (공지 · 자유 · 협업 · 정보공유) */
export const BoardChip = ({ kind, className }: { kind: CommunityKind; className?: string }) => (
  <span
    className={classNames(
      'rounded-full px-2 py-0.5 text-[11px] font-normal tracking-normal',
      BOARDS[kind].chip,
      className,
    )}
  >
    {BOARDS[kind].label}
  </span>
)
