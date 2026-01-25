import { getParsedDataByTableType } from '@/app/api/notion'
import { InView, Section } from '@/components'

export const revalidate = 60 // 60초마다 데이터 갱신 (자동 업데이트)

export default async function Page() {
  return (
    <>
      <InView className=' px-4 md:px-8 h-[calc(100dvh-64px)] flex items-center justify-center'>
        <img src='/img/main.png' className='max-w-full max-h-full' />
      </InView>
    </>
  )
}
