import { getParsedDataByTableType } from '@/app/api/notion'
import { Section } from '@/components'

export const revalidate = 30 // 30초마다 데이터 갱신 (자동 업데이트)

export default async function Page() {
  return (
    <>
      <Section fixed className='bg-black flex items-center justify-center'>
        <img src='/img/main.png' className='max-w-full max-h-full' />
      </Section>
    </>
  )
}
