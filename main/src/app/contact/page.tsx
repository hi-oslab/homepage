'use client'

import { Arrow, InView } from '@/components'
import { useState } from 'react'

const CONTACTS = [
  { label: 'Email', value: 'hi.oslab@gmail.com', href: 'mailto:hi.oslab@gmail.com' },
  { label: 'Instagram', value: '@opensource_lab', href: 'https://www.instagram.com/opensource_lab/' },
]

type Status = 'idle' | 'sending' | 'sent' | 'error'

const inputClassName =
  'w-full rounded-md bg-tile px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink/30 focus:bg-[#e2e2de] disabled:opacity-50'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  // 스팸 거르기: 숨은 칸(사람은 못 보고 봇만 채운다) · 폼을 연 뒤 걸린 시간
  const [website, setWebsite] = useState('')
  const [openedAt] = useState(() => Date.now())

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    if (status === 'sending' || status === 'sent') return
    setStatus('sending')

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message, website, elapsed: Date.now() - openedAt }),
    })

    setStatus(res.ok ? 'sent' : 'error')
  }

  return (
    <div className='flex w-full flex-col px-4 md:px-8'>
      <InView className='grid grid-cols-1 gap-16 pt-6 pb-32 md:grid-cols-12 md:gap-8 md:pt-8 md:pb-48'>
        {/* 좌측: 큰 문장 */}
        <div className='flex flex-col gap-8 md:col-span-6'>
          <span className='text-sm'>Contact</span>
          <h1 className='max-w-[12ch] break-keep text-[clamp(2.5rem,5vw,5rem)] font-medium leading-[1.08] '>
            함께 만들고 싶은 이야기가 있다면.
          </h1>
        </div>

        {/* 우측: 연락처 + 폼 */}
        <div className='flex flex-col gap-16 md:col-span-6 md:gap-20 md:pt-13'>
          <div className='flex flex-col gap-6'>
            {CONTACTS.map((contact) => (
              <Row key={contact.label} label={contact.label}>
                <a
                  href={contact.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='group inline-flex items-center gap-1 text-base transition-colors hover:text-mute'
                >
                  {contact.value}
                  <Arrow className='size-4' />
                </a>
              </Row>
            ))}
          </div>

          <Row label='Message'>
            {status === 'sent' ? (
              <div className='flex flex-col gap-2 rounded-md bg-ink p-6 text-white'>
                <span className='text-2xl font-medium '>Thank you.</span>
                <span className='text-sm text-white/60'>메시지가 전송되었습니다. 곧 연락드릴게요.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
                {/* 숨은 칸: 화면 · 스크린리더 · 탭 이동에서 빠져 있어 사람은 채우지 않는다 */}
                <input
                  type='text'
                  name='website'
                  tabIndex={-1}
                  autoComplete='off'
                  aria-hidden
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className='absolute -left-[9999px] h-px w-px opacity-0'
                />
                <div className='grid grid-cols-1 gap-2 lg:grid-cols-2'>
                  <input
                    type='text'
                    aria-label='이름'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={status === 'sending'}
                    className={inputClassName}
                    placeholder='Name'
                  />
                  <input
                    type='email'
                    aria-label='이메일'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={status === 'sending'}
                    className={inputClassName}
                    placeholder='Email'
                  />
                </div>
                <textarea
                  aria-label='메시지'
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  disabled={status === 'sending'}
                  rows={6}
                  className={`${inputClassName} resize-none`}
                  placeholder='프로젝트, 전시, 협업 등 무엇이든 적어주세요.'
                />
                {status === 'error' && <p className='text-sm text-red-600'>전송에 실패했습니다. 다시 시도해주세요.</p>}
                <button
                  type='submit'
                  disabled={status === 'sending'}
                  className='group mt-2 flex items-center justify-between rounded-md bg-ink px-5 py-4 text-base text-white transition-opacity hover:opacity-85 disabled:opacity-50'
                >
                  {status === 'sending' ? 'Sending…' : 'Send message'}
                  <Arrow direction='right' className='size-5' />
                </button>
              </form>
            )}
          </Row>
        </div>
      </InView>
    </div>
  )
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <section className='grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-8'>
    <h2 className='text-sm text-mute'>{label}</h2>
    <div className='sm:col-span-2'>{children}</div>
  </section>
)
