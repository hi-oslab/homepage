'use client'

import { WorksItem } from '@/app/api/schema'
import Link from 'next/link'
import { useState } from 'react'

export default function Client({ works }: { works: WorksItem[] }) {
  const categories = ['All', ...Array.from(new Set(works.map((w) => w.properties.category).filter(Boolean)))]
  const allTags = Array.from(new Set(works.flatMap((w) => w.properties.tags.map((t) => t.name))))

  const [activeCategory, setActiveCategory] = useState('All')
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [sortDesc, setSortDesc] = useState(true)

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  const filtered = works
    .filter((w) => activeCategory === 'All' || w.properties.category === activeCategory)
    .filter((w) => activeTags.size === 0 || Array.from(activeTags).every((tag) => w.properties.tags.some((t) => t.name === tag)))
    .slice()
    .sort((a, b) => {
      const cmp = a.properties.projectDate.start.localeCompare(b.properties.projectDate.start)
      return sortDesc ? -cmp : cmp
    })

  return (
    <div className='w-full h-full flex flex-col p-4 justify-start items-start gap-4 md:gap-8 pb-32 md:pb-48'>
      {/* Category Tabs + Sort */}
      <div className='w-full flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap gap-2'>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 text-sm border transition-colors ${
                activeCategory === cat
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

      {/* Tag Filter */}
      <div className='w-full flex flex-wrap gap-2'>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              activeTags.has(tag)
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-400 hover:text-white'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Work Items */}
      {filtered.map((work) => (
        <WorkCard key={work.id} work={work} />
      ))}
    </div>
  )
}

export const WorkCard = ({ work }: { work: WorksItem }) => {
  const { title, description, year, thumbnail, tags } = work.properties

  return (
    <Link
      href={`/work/${work.properties.slug}`}
      key={work.id}
      className='w-full h-fit flex flex-col md:flex-row gap-2 md:gap-8 justify-between items-start'
    >
      <div className='w-full md:w-1/3 h-auto aspect-video bg-neutral-800 mb-4 flex justify-center items-center'>
        {thumbnail ? (
          <img src={thumbnail} alt={title} className='w-full h-full object-cover' />
        ) : (
          <span className='text-neutral-500'>No Image</span>
        )}
      </div>
      <div className='w-full md:w-2/3 h-fit flex flex-col justify-start items-start gap-2'>
        <h2 className='w-full text-left text-xl md:text-2xl font-semibold'>{title}</h2>
        <p className='w-full text-left text-base leading  relaxed break-keep'>{description}</p>
        <p className='w-full text-left text-sm text-neutral-500'>{year}</p>
        <div className='w-full text-left mt-2'>
          {tags.map((tag) => (
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
  )
}
