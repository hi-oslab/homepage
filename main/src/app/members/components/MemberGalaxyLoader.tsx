'use client'

import dynamic from 'next/dynamic'
import type { Member } from '@/types/cms'
import type { GalaxyLayout } from './galaxyLayout'

type Props = { members: Member[]; layout: GalaxyLayout }

/** 3D(WebGL)는 브라우저에서만 그린다. 불러오는 동안은 같은 자리를 검게 채운다 */
const MemberGalaxy = dynamic<Props>(
  // tsconfig가 nodenext라 타입 검사만 확장자를 요구한다 (Next 번들러는 이 경로를 그대로 찾는다)
  // @ts-expect-error TS2835
  () => import('./MemberGalaxy'),
  {
    ssr: false,
    loading: () => <div className='fixed inset-x-0 top-header bottom-0 z-40 bg-black' aria-hidden />,
  },
)

export function MemberGalaxyLoader(props: Props) {
  return <MemberGalaxy {...props} />
}
