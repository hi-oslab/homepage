'use client'

import classNames from 'classnames'
import { useState } from 'react'

export type Practice = { title: string; description: string }

/** 큰 텍스트 리스트: 선택된 항목만 진하게, 나머지는 옅게 */
export const PracticeList = ({ items }: { items: Practice[] }) => {
  const [active, setActive] = useState(0)

  return (
    <div className='grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8'>
      <ul className='flex flex-col md:col-span-8'>
        {items.map((item, index) => (
          <li key={item.title}>
            <button
              type='button'
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onClick={() => setActive(index)}
              className={classNames(
                'text-left text-[clamp(2.5rem,7vw,6.5rem)] font-medium leading-[1.02] transition-colors duration-300',
                active === index ? 'text-ink' : 'text-ink/15 hover:text-ink/40',
              )}
            >
              {item.title}
            </button>
          </li>
        ))}
      </ul>
      <div className='flex items-end md:col-span-3 md:col-start-10'>
        <p
          key={active}
          className='max-w-xs animate-[fade-in_0.4s_ease-out] break-keep text-sm leading-relaxed text-ink'
        >
          {items[active].description}
        </p>
      </div>
    </div>
  )
}
