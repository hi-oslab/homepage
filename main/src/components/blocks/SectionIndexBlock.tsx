'use client'

import { useEffect, useRef, useState } from 'react'
import type { SectionIndexBlock as SectionIndexBlockType } from '@/types/blocks'
import classNames from 'classnames'

export const sectionAnchorId = (blockId: string) => `project-section-${blockId}`

export function SectionIndexNavigation({ sections }: { sections: SectionIndexBlockType[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')
  const [isContentVisible, setIsContentVisible] = useState(false)
  const navigationRef = useRef<HTMLElement>(null)
  const indexListRef = useRef<HTMLDivElement>(null)
  const indexButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  useEffect(() => {
    const contentSection = navigationRef.current?.closest('[data-project-content]')
    if (!contentSection) return

    const observer = new IntersectionObserver(([entry]) => setIsContentVisible(entry.isIntersecting), { threshold: 0 })
    observer.observe(contentSection)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(sectionAnchorId(section.id)))
      .filter((element): element is HTMLElement => Boolean(element))

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]

        if (visible) setActiveId(visible.target.getAttribute('data-section-id') ?? '')
      },
      { rootMargin: '-28% 0px -62% 0px', threshold: 0 },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [sections])

  useEffect(() => {
    if (!window.matchMedia('(max-width: 767px)').matches) return

    const list = indexListRef.current
    const activeButton = indexButtonRefs.current.get(activeId)
    if (!list || !activeButton) return

    const targetLeft = activeButton.offsetLeft - (list.clientWidth - activeButton.offsetWidth) / 2
    list.scrollTo({ left: targetLeft, behavior: 'smooth' })
  }, [activeId])

  return (
    <nav
      ref={navigationRef}
      aria-label='Project section index'
      className={`fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0rem)] z-40 bg-background/90 p-2 md:p-0 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md transition-[opacity,transform] duration-300 ease-out md:sticky md:inset-x-auto md:bottom-auto md:top-36 md:z-20 md:translate-y-0 md:bg-transparent md:opacity-100 md:shadow-none md:backdrop-blur-none ${
        isContentVisible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-[calc(100%+1rem)] opacity-0 md:pointer-events-auto'
      }`}
    >
      <div ref={indexListRef} className='[scrollbar-width:none] flex overflow-x-auto md:flex-col md:overflow-visible'>
        {sections.map((section) => {
          const active = activeId === section.id

          return (
            <button
              key={section.id}
              ref={(element) => {
                if (element) indexButtonRefs.current.set(section.id, element)
                else indexButtonRefs.current.delete(section.id)
              }}
              type='button'
              aria-current={active ? 'location' : undefined}
              onClick={() => {
                setActiveId(section.id)
                document
                  .getElementById(sectionAnchorId(section.id))
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className={classNames(
                'font-pretendard text-[10px] font-medium p-0.5 md:p-1 leading-none',
                'flex shrink-0 flex-row justify-start items-start gap-0',
                'md:w-fit md:justify-start md:rounded-sm md:text-xs',
                'transition-[background-color,color,transform] hover:bg-white/70 active:scale-[0.98]',
                active ? ' text-black hover:bg-black' : 'text-black/50 md:hover:bg-white/55',
              )}
            >
              <span
                className={classNames(
                  'flex flex-col justify-start items-start gap-1.5 ',
                  'text-xl md:text-2xl',
                  'font-helvetica font-bold text-left capitalize leading-none',
                )}
              >
                {section.title || 'Untitled section'}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function SectionIndexBlock({ block, className }: { block: SectionIndexBlockType; className?: string }) {
  return (
    <section
      id={sectionAnchorId(block.id)}
      data-section-id={block.id}
      className={classNames('pt-20 pb-2 md:pt-28 md:pb-4 flex scroll-mt-48 items-center gap-3 ', className)}
    >
      {/* {block.number && (
 <span className='font-mono text-[9px] leading-none text-black/40 md:text-[10px]'>{block.number}</span>
 )} */}
      <h2 className='text-sm md:text-base font-semibold leading-none text-black/50'>
        {block.title || 'Untitled section'}
      </h2>
    </section>
  )
}
