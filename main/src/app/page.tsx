import { getParsedDataByTableType } from '@/app/api/notion'
import { InView, Section } from '@/components'
import { Scene } from '@/components/Three'

export const revalidate = 30 // 60초마다 데이터 갱신 (자동 업데이트)

export default async function Page() {
  return (
    <>
      <InView className='h-[calc(100dvh-64px)] flex items-center justify-center'>
        <Scene />
      </InView>
      <InView className='px-4 md:px-8 h-[calc(100dvh-64px)] flex items-center justify-center'>
        <span className='text-4xl'>●▲☰</span>
      </InView>
    </>
  )
}
