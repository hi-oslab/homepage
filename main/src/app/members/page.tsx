import type { Metadata } from 'next'
import { OG_IMAGE } from '@/app/metadata'
import { getPublishedMembers } from '@/lib/cms'
import { layoutGalaxy } from './components/galaxyLayout'
import { MemberGalaxyLoader } from './components/MemberGalaxyLoader'
import { SceneTheme } from './components/SceneTheme'

export const revalidate = 30 // 30초마다 데이터 갱신 (자동 업데이트)

export const metadata: Metadata = {
  title: 'Members',
  description: '오픈소스랩을 함께 만들어가는 멤버들을 소개합니다.',
  openGraph: {
    title: 'Members | Open Source Lab',
    description: '오픈소스랩을 함께 만들어가는 멤버들을 소개합니다.',
    url: '/members',
    images: [OG_IMAGE],
  },
  alternates: { canonical: '/members' },
}

/*
 * Members: 헤더 아래 화면 전체가 검은 3D 씬 (페이지 스크롤 없음, 휠은 줌).
 * 이 페이지에서만 헤더가 검은 버전(Header), 푸터는 숨긴다(Layout). 사이트 테마는 그대로.
 */
export default async function Page() {
  const members = await getPublishedMembers()
  // 3D 배치는 여기(서버)서 한 번 계산한다: 인원이 많아도 방문자 브라우저가 멈추지 않게 (30초마다 새로)
  const layout = layoutGalaxy(members.map((member) => ({ id: member.id, fields: member.fields })))

  return (
    <>
      <SceneTheme />
      <MemberGalaxyLoader members={members} layout={layout} />
    </>
  )
}
