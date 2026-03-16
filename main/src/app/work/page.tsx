import { getParsedDataByTableType } from '@/app/api/notion'
import { InView } from '@/components'
import WorkList from './WorkList'

export const revalidate = 30 // 30초마다 데이터 갱신 (자동 업데이트)

export default async function Page() {
  const works = await getParsedDataByTableType('works')

  return (
    <>
      <InView className='w-full min-h-dvh h-fit flex flex-col gap-8 md:gap-16 p-4 md:p-8 justify-start items-center'>
        <div className='w-full h-fit flex flex-col items-center justify-center text-center'>
          <h1 className='text-4xl font-bold uppercase'>[ our works ]</h1>
        </div>
        <WorkList works={works} />
      </InView>
    </>
  )
}
