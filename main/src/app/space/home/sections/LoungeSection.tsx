import { Board } from '../../board/Board'
import { HomeSection } from '../HomeSection'
import { getHomeFeed, getHomeViewer } from '../data'

/** 라운지: 게시판 (화면 · 동작은 board/ 폴더) */
export async function LoungeSection({ className }: { className?: string }) {
  const [posts, viewer] = await Promise.all([getHomeFeed(), getHomeViewer()])
  return (
    <HomeSection
      title='라운지'
      description='공지, 자유로운 이야기, 협업 제안, 정보를 나누는 곳이에요.'
      className={className}
    >
      <Board initialPosts={posts} viewer={viewer} />
    </HomeSection>
  )
}
