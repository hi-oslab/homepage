'use client'

import { useState } from 'react'
import { checkPassword, revalidateAll } from './actions'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [showPassword, setShowPassword] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await checkPassword(password)
    if (ok) {
      setAuthed(true)
    } else {
      alert('비밀번호가 틀렸습니다.')
    }
  }

  const handleRevalidate = async () => {
    setStatus('loading')
    const { ok } = await revalidateAll()
    setStatus(ok ? 'success' : 'error')
  }

  if (!authed) {
    return (
      <div className='w-full min-h-dvh flex flex-col items-center justify-center gap-4 p-8'>
        <h1 className='text-2xl font-bold uppercase'>Admin</h1>
        <form onSubmit={handleAuth} className='flex flex-col gap-3 w-full max-w-xs'>
          <div className='flex items-center gap-2 relative bg-neutral-800 border border-neutral-700 px-4 py-2 text-white '>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder='Password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='outline-none bg-transparent w-full'
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='text-sm text-neutral-400 hover:text-neutral-200 absolute right-2 top-1/2 -translate-y-1/2'
            >
              {showPassword ? (
                <>
                  <div className='w-4 h-4 relative'>
                    <div className='w-full h-0.5 bg-neutral-400 absolute top-1/2 left-0 -translate-y-1/2 rotate-45' />
                    <div className='w-full h-0.5 bg-neutral-400 absolute top-1/2 left-0 -translate-y-1/2 -rotate-45' />
                  </div>
                </>
              ) : (
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                  />
                </svg>
              )}
            </button>
          </div>
          <button type='submit' className='bg-white text-black px-4 py-2 font-semibold hover:bg-neutral-200'>
            Enter
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className='w-full min-h-dvh flex flex-col items-center justify-center gap-8 p-8'>
      <h1 className='text-2xl font-bold uppercase'>Admin</h1>
      <div className='flex flex-col items-center gap-3'>
        <p className='text-neutral-400 text-sm'>노션 수정 후 아래 버튼을 눌러 페이지를 즉시 갱신하세요.</p>
        <button
          onClick={handleRevalidate}
          disabled={status === 'loading'}
          className='bg-white text-black px-6 py-3 font-semibold hover:bg-neutral-200 disabled:opacity-50'
        >
          {status === 'loading' ? 'Revalidating...' : 'Revalidate'}
        </button>
        {status === 'success' && <p className='text-green-400 text-sm'>완료! 페이지가 갱신되었습니다.</p>}
        {status === 'error' && <p className='text-red-400 text-sm'>오류가 발생했습니다. 다시 시도해주세요.</p>}
      </div>
    </div>
  )
}
