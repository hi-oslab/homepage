import { InView } from '@/components'

export default function Contact() {
  const list = [
    {
      type: 'instagram',
      value: '@opensource_lab',
      href: 'https://www.instagram.com/opensource_lab/',
    },
    {
      type: 'email',
      value: 'hi.oslab@gmail.com',
      href: 'mailto:hi.oslab@gmail.com',
    },
  ]
  return (
    <>
      <InView className='px-4 md:px-8 h-[calc(100dvh-128px)] flex flex-col gap-4 md:gap-8 md:flex-row items-center justify-center'>
        <div className='w-full h-1/3 md:h-full flex items-center text-[4vw] font-bold'>Contact Us</div>
        <div className='w-full h-2/3 md:h-full flex flex-col justify-center items-center text-base leading-relaxed break-keep'>
          {list.map((item) => (
            <div key={item.type} className='uppercase mb-4 w-full text-xl flex justify-start items-center'>
              <span className='mr-4'>{item.type}:</span>
              <a className=' hover:underline' href={item.href} target='_blank' rel='noopener noreferrer'>
                {item.value}
              </a>
            </div>
          ))}
        </div>
      </InView>
    </>
  )
}
