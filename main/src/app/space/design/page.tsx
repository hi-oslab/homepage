import { requirePageUser } from '@/lib/admin-auth'
import { PageHeader } from '@/components/admin/ui'
import { DesignGuide } from './DesignGuide'

export const dynamic = 'force-dynamic'

/*
 * 디자인 가이드 — 멤버 공간이 쓰는 색 · 버튼 · 입력 · 블록 · 모달을 한 화면에 모아 본다.
 * 여기 보이는 건 전부 실제 공용 부품을 그대로 불러온 것이라,
 * 부품 파일(각 칸 아래 적힌 경로)을 고치면 이 페이지와 멤버 공간 전체가 같이 바뀐다.
 */
export default async function DesignGuidePage() {
  await requirePageUser({ master: true })

  return (
    <div className='flex flex-col gap-2'>
      <PageHeader
        title='디자인 가이드'
        description='멤버 공간의 공용 부품 모음이에요. 각 칸에 적힌 파일을 고치면 전체에 반영돼요. 운영자만 볼 수 있어요.'
      />
      <DesignGuide />
    </div>
  )
}
