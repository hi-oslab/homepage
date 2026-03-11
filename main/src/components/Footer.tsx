import Logo from '@/img/logo.svg'

export const Footer = () => {
  return (
    <footer className='w-full  h-fit p-4 md:p-8 bg-black text-white flex flex-col gap-8 md:gap-28 items-center justify-between md:justify-center'>
      <div className='w-full h-fit flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-0'>
        <code className='text-xs md:text-sm w-full lg:w-[60%] h-fit font-mono'>
          {`# Delicious Source ^^* - Discovery Creative Extension
오소랩 = "괴짜 창의력 폭발!"
핵심가치 = ["Discovery", "Creativity", "Extension"]
for 가치 in 핵심가치: print(f"{가치} - 오소랩 모드 ON!")
print("Delicious Source^^*")
print("오소랩 방향: 창의력 무한 확장!")`}
        </code>
        <div className='w-full lg:w-[40%] text-lg h-full flex flex-col gap-4 lg:gap-0 lg:flex-row justify-between items-start'>
          <div className='w-full h-full flex flex-row md:flex-col font-mono gap-6 md:gap-2 justify-start items-start'>
            {[
              {
                value: '@opensource_lab',
                href: 'https://www.instagram.com/opensource_lab/',
              },
              {
                value: 'hi.oslab@gmail.com',
                href: 'mailto:hi.oslab@gmail.com',
              },
            ].map((item) => (
              <div
                key={item.value}
                className='w-fit flex flex-row text-sm md:text-base gap-2 lg:gap-4 md:justify-end items-center'
              >
                <a
                  className='w-fit h-fit hover:opacity-50 active:scale-95 transition-all'
                  href={item.href}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {item.value}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className='w-full h-fit  flex flex-col-reverse lg:flex-row justify-between items-start gap-4 lg:gap-0 lg:items-end'>
        <p className='text-sm lg:text-base'>© {new Date().getFullYear()} Open Source Lab. All rights reserved.</p>
        <span className='text-4xl leading-none'>●▲☰</span>
      </div>
    </footer>
  )
}
