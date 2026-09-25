'use client'

import { useCallback, useState } from 'react'
import type { Block } from '@/types/blocks'
import classNames from 'classnames'
import { ImageLightbox, type LightboxImage } from './ImageLightbox'
import {
  HeadingBlock,
  ParagraphBlock,
  MediaBlock,
  GalleryBlock,
  LinkBlock,
  CodeBlock,
  HtmlBlock,
  DividerBlock,
  QuoteBlock,
  ListBlock,
  EmbedBlock,
  CalloutBlock,
  LegacyMarkdownBlock,
  SectionIndexBlock,
} from './blocks'

// 블록 타입 -> 컴포넌트 매핑. 각 블록의 디자인은 components/blocks/*.tsx 에서 개별적으로 손볼 수 있다.
type BlockRendererProps = {
  blocks: Block[]
  className?: string
  blockClassNames?: Partial<Record<Block['type'], string>>
}

export function BlockRenderer({ blocks, className, blockClassNames }: BlockRendererProps) {
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null)
  const openImage = useCallback((url: string, alt: string) => setLightboxImage({ url, alt }), [])
  const closeImage = useCallback(() => setLightboxImage(null), [])

  return (
    <>
      {blocks.map((block) => {
        const blockClassName = classNames(className, blockClassNames?.[block.type], 'font-pretendard')

        switch (block.type) {
          case 'section-index':
            return <SectionIndexBlock key={block.id} block={block} className={blockClassName} />
          case 'heading':
            return <HeadingBlock key={block.id} block={block} className={blockClassName} />
          case 'paragraph':
            return <ParagraphBlock key={block.id} block={block} className={blockClassName} />
          case 'media':
            return <MediaBlock key={block.id} block={block} className={blockClassName} onImageClick={openImage} />
          case 'gallery':
            return <GalleryBlock key={block.id} block={block} className={blockClassName} onImageClick={openImage} />
          case 'link':
            return <LinkBlock key={block.id} block={block} className={blockClassName} />
          case 'code':
            return <CodeBlock key={block.id} block={block} className={blockClassName} />
          case 'html':
            return <HtmlBlock key={block.id} block={block} className={blockClassName} />
          case 'divider':
            return <DividerBlock key={block.id} className={blockClassName} />
          case 'quote':
            return <QuoteBlock key={block.id} block={block} className={blockClassName} />
          case 'list':
            return <ListBlock key={block.id} block={block} className={blockClassName} />
          case 'embed':
            return <EmbedBlock key={block.id} block={block} className={blockClassName} />
          case 'callout':
            return <CalloutBlock key={block.id} block={block} className={blockClassName} />
          case 'legacy-markdown':
            return <LegacyMarkdownBlock key={block.id} block={block} className={blockClassName} />
          default:
            return null
        }
      })}
      <ImageLightbox image={lightboxImage} onClose={closeImage} />
    </>
  )
}
