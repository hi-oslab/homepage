import { TerminalLoader } from '@/components/TerminalLoader'

// 어드민은 사이드바를 유지한 채 콘텐츠 영역에만 로더를 보여준다
export default function Loading() {
  return <TerminalLoader variant='inline' />
}
