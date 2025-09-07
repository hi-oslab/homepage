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
    <footer className='w-screen h-fit px-28 py-28 bg-black text-white snap-start flex flex-col gap-28 items-center justify-center'>
      <div className='w-full h-fit flex flex-row justify-between items-start'>
        <code className='w-[60%] h-fit font-mono'>
          {`# Delicious Source ^^* - Discovery Creative Extension
오소랩 = "괴짜 창의력 폭발!"
핵심가치 = ["Discovery", "Creativity", "Extension"]
for 가치 in 핵심가치: print(f"{가치} - 오소랩 모드 ON!")
print("Delicious Source^^*")
print("오소랩 방향: 창의력 무한 확장!")`}
        </code>
        <div className='w-[40%] text-lg h-full flex flex-row justify-between items-start'>
          <div className='w-full h-full flex flex-col gap-4 justify-start items-start'>
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
              <div key={item.label} className='w-full flex flex-row gap-4 justify-start items-center'>
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
                className='w-full text-gray-400 uppercase hover:opacity-70 transition-all duration-300 ease-in-out'
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className='w-full h-fit flex flex-row justify-between items-end'>
        <Logo className='h-32 w-auto' />
        <p className='text-base text-gray-400'>
          &copy; {new Date().getFullYear()} OPEN SOURCE LAB. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
