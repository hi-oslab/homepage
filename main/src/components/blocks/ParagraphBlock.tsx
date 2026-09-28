'use client'

import type { ParagraphBlock as ParagraphBlockType } from '@/types/blocks'
import { useInlineDecorator } from './InlineDecorator'
import { renderInlineText } from './inline'
import classNames from 'classnames'

export function ParagraphBlock({ block, className }: { block: ParagraphBlockType; className?: string }) {
  // 게시판 글 보기에서만 '@멘션'을 꾸민다 (그 외에는 null → 그대로)
  const decorate = useInlineDecorator()
  return (
    <p
      className={classNames('my-6 break-keep text-sm md:text-base font-medium leading-[1.75] text-black/60', className)}
    >
      {renderInlineText(block.text, decorate)}
    </p>
  )
}
