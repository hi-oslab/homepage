'use client'

import { WorksItem } from '@/types'
import Link from 'next/link'
import { useState } from 'react'

export default function WorkList({ works }: { works: WorksItem[] }) {
  const categories = ['All', ...Array.from(new Set(works.map((w) => w.properties.category).filter(Boolean)))]
  const [active, setActive] = useState('All')
  const [sortDesc, setSortDesc] = useState(true)

  const filtered = (active === 'All' ? works : works.filter((w) => w.properties.category === active))
    .slice()
    .sort((a, b) => {
      const cmp = a.properties.projectDate.start.localeCompare(b.properties.projectDate.start)
      return sortDesc ? -cmp : cmp
    })

  return (
    <div className='w-full h-full flex flex-col p-4 justify-start items-start gap-4 md:gap-8 pb-32 md:pb-48'>
      {/* Filter Tabs + Sort */}
      <div className='w-full flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap gap-2'>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-4 py-1.5 text-sm border transition-colors ${
                active === cat
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-neutral-400 border-neutral-600 hover:border-white hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSortDesc((v) => !v)}
          className='flex items-center gap-1 px-3 py-1.5 text-sm border border-neutral-600 text-neutral-400 hover:border-white hover:text-white transition-colors'
        >
          Date {sortDesc ? '↓' : '↑'}
        </button>
      </div>

      {/* Work Items */}
      {filtered.map((work) => (
        <Link
          href={`/work/${work.properties.slug}`}
          key={work.id}
          className='w-full h-fit flex flex-col md:flex-row gap-2 md:gap-8 justify-between items-start'
        >
          <div className='w-full md:w-1/3 h-auto aspect-video bg-neutral-800 mb-4 flex justify-center items-center'>
            {work.properties.thumbnail ? (
              <img
                src={work.properties.thumbnail}
                alt={work.properties.title}
                className='w-full h-full object-cover'
              />
            ) : (
              <span className='text-neutral-500'>No Image</span>
            )}
          </div>
          <div className='w-full md:w-2/3 h-fit flex flex-col justify-start items-start gap-2'>
            <h2 className='w-full text-left text-xl md:text-2xl font-semibold'>{work.properties.title}</h2>
            <p className='w-full text-left text-base leading-relaxed break-keep'>{work.properties.description}</p>
            <p className='w-full text-left text-sm text-neutral-500'>{work.properties.year}</p>
            <p className='w-full text-left text-sm text-neutral-500'>Category: {work.properties.category}</p>
            <div className='w-full text-left mt-2'>
              {work.properties.tags.map((tag) => (
                <span
                  key={tag.name}
                  className='inline-block bg-neutral-800 text-white text-xs px-3 py-1 mr-2 mb-2 rounded-full'
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
