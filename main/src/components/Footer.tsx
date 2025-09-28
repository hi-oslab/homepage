import Logo from '@/img/logo.svg'

export const Footer = () => {
  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Info', path: '/info' },
    { name: 'Contact', path: '/contact' },
    { name: 'Work', path: '/work' },
    { name: 'Lab Space', path: '/lab-space' },
  ]

  return (
    <footer className='w-screen h-fit px-8 lg:px-28 py-16 lg:py-28 bg-black text-white snap-start flex flex-col gap-28 items-center justify-center'>
      <div className='w-full h-fit flex flex-col lg:flex-row justify-between items-start gap-10 lg:gap-0'>
        <code className='text-sm lg:text-base w-full lg:w-[60%] h-fit font-mono'>
          {`# Delicious Source ^^* - Discovery Creative Extension
오소랩 = "괴짜 창의력 폭발!"
핵심가치 = ["Discovery", "Creativity", "Extension"]
for 가치 in 핵심가치: print(f"{가치} - 오소랩 모드 ON!")
print("Delicious Source^^*")
print("오소랩 방향: 창의력 무한 확장!")`}
        </code>
        <div className='w-full lg:w-[40%] text-lg h-full flex flex-col gap-10 lg:gap-0 lg:flex-row justify-between items-start'>
          <div className='w-full h-full flex flex-col gap-2 lg:gap-4 justify-start items-start'>
            {[
              {
                label: 'Insta',
                value: 'opensource_lab',
              },
              {
                label: 'E-mail',
                value: 'hi.oslab@gmail.com',
              },
            ].map((item) => (
              <div key={item.label} className='w-full flex flex-row  gap-2 lg:gap-4 justify-start items-center'>
                <span className='text-gray-400'>{item.label}</span>
                <span className=''>{item.value}</span>
              </div>
            ))}
          </div>
          <div className='w-28 flex flex-col gap-4 justify-start items-center'>
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.path}
                className='w-full text-sm lg:text-base text-gray-400 uppercase hover:opacity-70 transition-all duration-300 ease-in-out'
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className='w-full h-fit flex flex-col lg:flex-row justify-between items-start gap-4 lg:gap-0 lg:items-end'>
        <Logo className='h-auto lg:h-32 w-full lg:w-auto' />
        <p className='text-sm lg:text-base text-gray-400'>
          &copy; {new Date().getFullYear()} OPEN SOURCE LAB. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
