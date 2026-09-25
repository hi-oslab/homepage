'use client'

import { useState } from 'react'
import { GoChevronLeft, GoChevronRight } from 'react-icons/go'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperInstance } from 'swiper'
import type { GalleryBlock as GalleryBlockType } from '@/types/blocks'
import classNames from 'classnames'
import 'swiper/css'

export function GalleryBlock({
  block,
  className,
  onImageClick,
}: {
  block: GalleryBlockType
  className?: string
  onImageClick?: (url: string, alt: string) => void
}) {
  const items = block.items.filter((item) => Boolean(item.url))
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  if (items.length === 0) return null

  if (items.length === 1) {
    const item = items[0]
    return (
      <figure className={classNames('py-4 md:py-8', className)}>
        <button
          type='button'
          className='block w-full cursor-zoom-in rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'
          onClick={() => onImageClick?.(item.url, item.caption ?? '')}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.url} alt={item.caption ?? ''} loading='lazy' className='w-full rounded-sm' />
        </button>
        {item.caption && <figcaption className='mt-2 text-[9px] text-black/40 md:text-[10px]'>{item.caption}</figcaption>}
      </figure>
    )
  }

  return (
    <div className={classNames('w-full py-4 md:py-8', className)}>
      <div className='group relative w-full overflow-hidden rounded-sm bg-black/5'>
        <Swiper
          className='w-full'
          loop
          autoHeight
          speed={450}
          onSwiper={setSwiper}
          onSlideChange={(instance) => setActiveIndex(instance.realIndex)}
        >
          {items.map((item, index) => (
            <SwiperSlide key={`${item.url}-${index}`}>
              <figure className='relative w-full'>
                <button
                  type='button'
                  className='block w-full cursor-zoom-in'
                  onClick={() => onImageClick?.(item.url, item.caption ?? '')}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.caption ?? ''} className='block h-auto w-full' />
                </button>
                {item.caption && (
                  <figcaption className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 pb-3 pt-10 text-[10px] text-white md:px-4 md:pb-4 md:text-xs'>
                    {item.caption}
                  </figcaption>
                )}
              </figure>
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          type='button'
          onClick={() => swiper?.slidePrev()}
          aria-label='이전 이미지'
          className='absolute left-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white opacity-0 backdrop-blur-sm transition-[background-color,opacity] hover:bg-black/45 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white group-hover:opacity-100 md:left-3 md:size-10'
        >
          <GoChevronLeft size={20} />
        </button>
        <button
          type='button'
          onClick={() => swiper?.slideNext()}
          aria-label='다음 이미지'
          className='absolute right-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white opacity-0 backdrop-blur-sm transition-[background-color,opacity] hover:bg-black/45 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white group-hover:opacity-100 md:right-3 md:size-10'
        >
          <GoChevronRight size={20} />
        </button>

        <span className='pointer-events-none absolute right-2 top-2 z-10 rounded-full bg-black/20 px-2 py-1 font-mono text-[9px] text-white backdrop-blur-sm md:right-3 md:top-3'>
          {activeIndex + 1} / {items.length}
        </span>
      </div>

      <div className='no-scroll-bar flex w-full gap-1.5 overflow-x-auto pt-2' aria-label='갤러리 이미지 목록'>
        {items.map((item, index) => (
          <button
            key={`${item.url}-${index}`}
            type='button'
            onClick={() => swiper?.slideToLoop(index)}
            aria-label={`${index + 1}번 이미지 보기`}
            aria-current={index === activeIndex ? 'true' : undefined}
            className={`relative aspect-square w-12 shrink-0 overflow-hidden rounded-sm transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:w-14 md:w-16 ${
              index === activeIndex ? 'opacity-100' : 'opacity-45 hover:opacity-80'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.caption ?? ''} loading='lazy' className='size-full object-cover' />
            {index === activeIndex && <span className='pointer-events-none absolute inset-0 rounded-sm ring-2 ring-inset ring-black/70' />}
          </button>
        ))}
      </div>
    </div>
  )
}
