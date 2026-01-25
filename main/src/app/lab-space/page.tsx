import { InView, Section } from '@/components'

export default function Page() {
  return (
    <>
      <InView className='px-4 md:px-8 h-[calc(100dvh-128px)] flex flex-col gap-4 md:gap-8 md:flex-row items-center justify-center'>
        <span>Coming soon</span>
      </InView>
    </>
  )
}
