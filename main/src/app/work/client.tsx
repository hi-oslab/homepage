'use client'

import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import type { Work } from '@/types/cms'
import { WorkTile } from '@/components'

export default function Client({ works }: { works: Work[] }) {
  const categories = ['All', ...Array.from(new Set(works.map((w) => w.category).filter(Boolean)))]
  const allTags = Array.from(new Set(works.flatMap((w) => w.tags)))

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
    .filter((w) => activeCategory === 'All' || w.category === activeCategory)
    .filter((w) => activeTags.size === 0 || Array.from(activeTags).every((tag) => w.tags.includes(tag)))
    .slice()
    .sort((a, b) => {
      const cmp = a.year - b.year || (a.project_date ?? '').localeCompare(b.project_date ?? '')
      return sortDesc ? -cmp : cmp
    })

  return (
    <div className='flex w-full flex-col gap-12 md:gap-16'>
      {/* 필터 */}
      <div className='grid grid-cols-1 gap-6 text-sm md:grid-cols-12 md:gap-8'>
        <FilterGroup label='Category' className='md:col-span-4'>
          {categories.map((cat) => (
            <Toggle key={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)}>
              {cat}
            </Toggle>
          ))}
        </FilterGroup>
        <FilterGroup label='Keywords' className='md:col-span-6'>
          {allTags.map((tag) => (
            <Toggle key={tag} active={activeTags.has(tag)} onClick={() => toggleTag(tag)}>
              {tag.toLowerCase()}
            </Toggle>
          ))}
        </FilterGroup>
        <FilterGroup label='Sort' className='md:col-span-2 md:items-end md:text-right'>
          <Toggle active onClick={() => setSortDesc((v) => !v)}>
            {sortDesc ? 'Newest ↓' : 'Oldest ↑'}
          </Toggle>
        </FilterGroup>
      </div>

      {/* 목록 */}
      {filtered.length > 0 ? (
        <motion.div layout className='grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8 md:gap-y-16'>
          <AnimatePresence mode='popLayout' initial={false}>
            {filtered.map((work) => (
              <motion.div
                key={work.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <WorkTile work={work} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <p className='py-24 text-center text-sm text-mute'>조건에 맞는 작업이 없습니다.</p>
      )}
    </div>
  )
}

const FilterGroup = ({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) => (
  <div className={classNames('flex flex-col gap-3', className)}>
    <span className='text-mute'>{label}</span>
    <div className='flex flex-wrap gap-x-4 gap-y-1'>{children}</div>
  </div>
)

const Toggle = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) => (
  <button
    type='button'
    onClick={onClick}
    className={classNames('transition-colors', active ? 'text-ink' : 'text-ink/30 hover:text-ink/60')}
  >
    {children}
  </button>
)
