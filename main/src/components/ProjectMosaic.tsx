'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { Work } from '@/types/cms'

function hash(value: string) {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

export function ProjectMosaic({ works }: { works: Work[] }) {
  const projects = useMemo(
    () =>
      works
        .filter((work) => work.thumbnail_url)
        .slice()
        .sort((a, b) => hash(a.id) - hash(b.id)),
    [works],
  )

  if (projects.length === 0) {
    return (
      <div className='flex min-h-[50dvh] items-center justify-center font-mono text-xs uppercase text-black/35'>
        No project images
      </div>
    )
  }

  return (
    <div className='columns-1 gap-2 sm:columns-2 lg:columns-3 xl:columns-4'>
      {projects.map((work) => (
        <Link
          key={work.id}
          href={`/work/${work.slug}`}
          className='group relative mb-2 block rounded-sm w-full break-inside-avoid overflow-hidden bg-black/5'
          aria-label={`${work.title} 프로젝트 보기`}
        >
          <div className='h-4 w-full bg-black'></div>
          <img
            src={work.thumbnail_url ?? ''}
            alt={work.title}
            className='block h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.025]'
          />
          <div className='absolute inset-0 flex flex-col justify-between bg-black/0 p-3 text-white opacity-0 transition-[background-color,opacity] duration-300 group-hover:bg-black/35 group-hover:opacity-100'>
            <span className='font-mono text-[8px] uppercase '>
              {work.category || 'Project'} / {work.year}
            </span>
            <div>
              <h2 className='break-keep text-sm font-semibold leading-tight md:text-base'>{work.title}</h2>
              {work.subtitle && (
                <p className='mt-1 line-clamp-2 text-[10px] leading-snug text-white/70'>{work.subtitle}</p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
