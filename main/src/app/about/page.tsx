import { getParsedDataByTableType } from '@/app/api/notion'
import { InView } from '@/components'
import { MemberCard } from './components'

export const revalidate = 60 // 30초마다 데이터 갱신 (자동 업데이트)

export default async function Page() {
  const parsedMembers = await getParsedDataByTableType('members')

  return (
    <>
      <InView className='px-4 md:px-8 h-[calc(100dvh-128px)] flex flex-col gap-4 md:gap-8 md:flex-row items-center justify-center'>
        <div className='w-full h-fit md:h-full flex items-center text-4xl md:text-6xl font-bold'>Open Source Lab</div>
        <div className='w-full h-fit md:h-full flex items-center text-sm md:text-base leading-relaxed break-keep'>
          2018년 홍익대학교 디지털미디어디자인 전공 학생과 디자인컨버전스학부 학생들이 만나 예술과 디지털기술에대해
          공부하며 시작된 모임으로 현재는 다양한 코드와 마크업 언어를 이용하여 인터랙션이 있는 미디어 아트, 그리고
          사물을 접목시킨 피지컬 컴퓨팅 작품을 만들고 토론한다. 자유 소프트웨어 운동에서 비롯된 "오픈소스" 문화의 특징인
          정보공유 평등주의와 협업주의를 받아들여 계승하자는 의미로 'Open Source Lab' 이라는 이름으로 정하였다.
        </div>
      </InView>

      <InView className='w-full h-fit flex flex-col gap-8 md:gap-16 p-4 md:p-8 justify-start items-center'>
        <div className='w-full h-fit flex flex-col items-center justify-center text-center'>
          <h1 className='text-2xl md:text-4xl font-bold uppercase'>[ we are osl creators ]</h1>
        </div>
        <div className='w-full h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4 justify-center items-start gap-8 pb-32 md:pb-48'>
          {parsedMembers.map((member) => (
            <MemberCard key={member.id} {...member} />
          ))}
        </div>
      </InView>
    </>
  )
}
