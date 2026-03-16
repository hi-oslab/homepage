const CODE = `# Delicious Source ^^* - Discovery Creative Extension
오소랩 = "괴짜 창의력 폭발!"
핵심가치 = ["Discovery", "Creativity", "Extension"]
for 가치 in 핵심가치: print(f"{가치} - 오소랩 모드 ON!")
print("Delicious Source^^*")
print("오소랩 방향: 창의력 무한 확장!")`

const CONTACTS = [
  { label: '@opensource_lab', href: 'https://www.instagram.com/opensource_lab/' },
  { label: 'hi.oslab@gmail.com', href: 'mailto:hi.oslab@gmail.com' },
]

export const Footer = () => {
  return (
    <footer className='h-fit w-full bg-black p-4 text-white md:p-8'>
      {/* 코드 텍스트 */}
      <div className='mb-6 font-mono'>
        <p className='mb-3 text-xs text-neutral-600'>$ python delicious_source.py</p>
        <div className='whitespace-pre-wrap text-xs text-neutral-400'>
          {CODE}
          <span className='cursor-blink inline-block text-neutral-400'>▊</span>
        </div>
      </div>

      {/* 하단 정보 */}
      <div className='flex flex-col items-start justify-between gap-6 md:flex-row md:items-end'>
        {/* 연락처 */}
        <div className='flex flex-col gap-1.5 font-mono'>
          {CONTACTS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target='_blank'
              rel='noopener noreferrer'
              className='text-xs text-neutral-500 transition-colors hover:text-white'
            >
              <span className='mr-1 text-neutral-600'>&gt;</span>
              {item.label}
            </a>
          ))}
        </div>

        {/* 저작권 + 로고 */}
        <div className='flex flex-col items-start gap-2 md:items-end'>
          <span className='text-2xl leading-none'>●▲☰</span>
          <p className='text-xs text-neutral-600'>© {new Date().getFullYear()} Open Source Lab. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
