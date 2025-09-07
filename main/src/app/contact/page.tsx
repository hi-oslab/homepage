import { Section } from '@/components'

export default function Page() {
  return (
    <>
      <Section className='bg-black'>
        <img src='/img/main.png' className='h-[90%] w-auto' />
      </Section>
      <Section className=''>
        <div className='w-full h-full flex flex-col items-center justify-center px-9 text-center'>
          <h1 className='text-4xl font-bold mb-6'>Open Source Lab</h1>
          <p className='text-lg max-w-3xl'>
            Open Source Lab는 오픈소스 소프트웨어 개발을 통해 사회에 긍정적인 영향을 미치고자 하는 개발자들의
            모임입니다. 우리는 협업과 공유를 통해 더 나은 소프트웨어를 만들고, 이를 통해 세상을 변화시키는 것을 목표로
            합니다.
          </p>
        </div>
      </Section>
    </>
  )
}
