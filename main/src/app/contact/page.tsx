'use client'

import { InView } from '@/components'
import { useRef, useState } from 'react'

const CONTACTS = [
  { key: 'instagram', value: '@opensource_lab', href: 'https://www.instagram.com/opensource_lab/' },
  { key: 'email', value: 'hi.oslab@gmail.com', href: 'mailto:hi.oslab@gmail.com' },
]

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const nameRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    if (status === 'sending' || status === 'sent') return
    setStatus('sending')

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message }),
    })

    setStatus(res.ok ? 'sent' : 'error')
  }

  return (
    <InView className='flex h-[calc(100dvh-128px)] items-center justify-center px-4 md:px-8'>
      <div className='w-full max-w-xl border border-neutral-800 font-mono'>
        {/* 타이틀바 */}
        <div className='flex items-center gap-2 border-b border-neutral-800 bg-neutral-950 px-4 py-2'>
          <span className='text-xs text-neutral-600'>●</span>
          <span className='text-xs text-neutral-600'>●</span>
          <span className='text-xs text-neutral-600'>●</span>
          <span className='ml-3 text-xs tracking-widest text-neutral-600'>OSL TERMINAL</span>
          <span className='ml-auto text-xs text-neutral-700'>contact --list</span>
        </div>

        {/* 터미널 본문 */}
        <div className='space-y-1 p-6'>
          {/* contact --list */}
          <p className='text-sm text-white'>
            &gt; contact --list &nbsp;<span className='text-neutral-600'># 연락처</span>
          </p>
          <p className='text-xs text-neutral-500'>resolving contact info...</p>
          <div className='h-3' />
          {CONTACTS.map((contact) => (
            <a
              key={contact.key}
              href={contact.href}
              target='_blank'
              rel='noopener noreferrer'
              className='block text-sm text-neutral-300 transition-colors hover:text-white'
            >
              <span className='mr-2 text-neutral-600'>$</span>
              <span className='mr-2 text-neutral-500'>{contact.key.padEnd(10)}</span>
              <span className='mr-2 text-neutral-400'>→</span>
              <span className='hover:underline'>{contact.value}</span>
            </a>
          ))}
          <div className='h-3' />
          <p className='text-xs text-neutral-600'>
            done. <span className='cursor-blink inline-block text-neutral-400'>▊</span>
          </p>

          {/* send --mail */}
          <div className='pt-2'>
            <p className='mb-4 text-sm text-white'>
              &gt; send --mail &nbsp;<span className='text-neutral-600'># 메일 보내기</span>
            </p>
            {status === 'sent' ? (
              <p className='text-xs text-neutral-400'>
                <span className='text-neutral-600'>$</span> 메시지가 전송되었습니다. 곧 연락드릴게요. ✓
              </p>
            ) : (
              <form onSubmit={handleSubmit} className='space-y-2'>
                <label className='flex items-center gap-2 text-sm'>
                  <span className='w-20 shrink-0 text-neutral-500'>[name]</span>
                  <input
                    ref={nameRef}
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={status === 'sending'}
                    className='flex-1 border-b border-neutral-700 bg-transparent text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-neutral-500 disabled:opacity-50'
                    placeholder='이름 / your name'
                  />
                </label>
                <label className='flex items-center gap-2 text-sm'>
                  <span className='w-20 shrink-0 text-neutral-500'>[email]</span>
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={status === 'sending'}
                    className='flex-1 border-b border-neutral-700 bg-transparent text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-neutral-500 disabled:opacity-50'
                    placeholder='이메일 / your@email.com'
                  />
                </label>
                <label className='flex flex-col gap-2 text-sm'>
                  <span className='text-neutral-500'>[message]</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    disabled={status === 'sending'}
                    rows={3}
                    className='resize-none border border-neutral-800 bg-transparent p-2 text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-neutral-600 disabled:opacity-50'
                    placeholder='메시지를 입력하세요 / write your message...'
                  />
                </label>
                {status === 'error' && (
                  <p className='text-xs text-red-500'>
                    오류: 전송에 실패했습니다. 다시 시도해주세요. / failed to send. please try again.
                  </p>
                )}
                <div className='flex justify-end pt-1'>
                  <button
                    type='submit'
                    disabled={status === 'sending'}
                    className='border border-neutral-700 px-4 py-1 text-xs text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white disabled:opacity-50'
                  >
                    {status === 'sending' ? 'sending...' : 'send →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </InView>
  )
}
