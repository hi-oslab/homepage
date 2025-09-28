import { getParsedDataByTableType } from '@/app/api/notion'
import { Section } from '@/components'
import { MemberCard } from './components'

export const revalidate = 30 // 30초마다 데이터 갱신 (자동 업데이트)

export default async function Page() {
  const parsedMembers = await getParsedDataByTableType('members')

  return (
    <>
      <Section className='bg-black'>...</Section>

      <Section className='flex flex-col justify-start items-center bg-white text-black'>
        <div className='w-full h-fit pt-96 pb-72 flex flex-col items-center justify-center text-center'>
          <h1 className='text-4xl font-bold uppercase'>[ we are osl creators ]</h1>
        </div>
        <div className='max-w-5xl pb-72 w-full h-full grid grid-cols-3 justify-center items-start gap-1'>
          {parsedMembers.map((member) => (
            <MemberCard key={member.id} {...member} />
          ))}
        </div>
      </Section>
    </>
  )
}
