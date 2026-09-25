'use client'

import classNames from 'classnames'
import { useState } from 'react'
import { SHOWROOM_SCRIPTS, TerminalLoader, TerminalPanel } from '@/components/TerminalLoader'

/** 사이트 로딩 화면(TerminalLoader) 미리보기 — 경로별 스크립트를 골라 재생해 볼 수 있다 */
export function TerminalShowroom() {
  const [index, setIndex] = useState(0)
  const [run, setRun] = useState(0)
  const [mode, setMode] = useState<'loading' | 'finish'>('finish')
  const script = SHOWROOM_SCRIPTS[index]

  const play = (next: number) => {
    setIndex(next)
    setRun((value) => value + 1)
  }

  return (
    <div className='flex w-full flex-col px-4 md:px-8'>
      <section className='flex flex-col gap-16 pt-6 pb-12 md:pt-8'>
        <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-12 md:gap-8'>
          <span className='md:col-span-4'>Showroom</span>
          <span className='text-mute md:col-span-4'>Component / 001</span>
        </div>
        <div className='grid grid-cols-1 items-end gap-8 md:grid-cols-12'>
          <h1 className='text-[clamp(3rem,9vw,8rem)] font-medium leading-[0.9] tracking-[-0.05em] md:col-span-8'>
            Terminal
            <br />
            Loading
          </h1>
          <p className='max-w-sm break-keep text-sm leading-relaxed md:col-span-4'>
            페이지와 데이터가 준비되는 동안 보여주는 로딩 화면이에요. 사이트 곳곳의 loading에 쓰이고, 경로마다 다른 명령과 로그가
            나타납니다.
          </p>
        </div>
      </section>

      {/* 컨트롤 */}
      <div className='flex flex-wrap items-center gap-x-6 gap-y-3 pb-4 text-sm'>
        <div className='flex flex-wrap gap-x-4 gap-y-1'>
          {SHOWROOM_SCRIPTS.map((item, itemIndex) => (
            <button
              key={item.command}
              type='button'
              onClick={() => play(itemIndex)}
              className={classNames('transition-colors', itemIndex === index ? 'text-ink' : 'text-ink/30 hover:text-ink/60')}
            >
              {item.title}
            </button>
          ))}
        </div>
        <div className='flex gap-x-4'>
          {(['finish', 'loading'] as const).map((value) => (
            <button
              key={value}
              type='button'
              onClick={() => {
                setMode(value)
                setRun((current) => current + 1)
              }}
              className={classNames('transition-colors', mode === value ? 'text-ink' : 'text-ink/30 hover:text-ink/60')}
            >
              {value === 'finish' ? '완료까지' : '대기 상태'}
            </button>
          ))}
        </div>
        <button type='button' onClick={() => setRun((value) => value + 1)} className='ml-auto text-ink transition-colors hover:text-mute'>
          ↻ Replay
        </button>
      </div>

      {/* 미리보기 */}
      <section className='rounded-xl bg-tile p-4 md:p-8'>
        <TerminalLoader key={`${index}-${run}-${mode}`} variant='inline' script={script} finish={mode === 'finish'} run={run} />
      </section>

      {/* 패널 단독 */}
      <section className='grid grid-cols-1 gap-3 pt-3 pb-32 md:grid-cols-3 md:pb-48'>
        {SHOWROOM_SCRIPTS.slice(0, 3).map((item) => (
          <TerminalPanel key={item.command} script={item} visible={item.lines.length} progress={100} complete className='h-60' />
        ))}
      </section>
    </div>
  )
}
