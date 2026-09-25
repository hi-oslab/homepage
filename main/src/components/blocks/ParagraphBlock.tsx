import type { ParagraphBlock as ParagraphBlockType } from '@/types/blocks'
import { renderInlineText } from './inline'
import classNames from 'classnames'

export function ParagraphBlock({ block, className }: { block: ParagraphBlockType; className?: string }) {
  return (
    <p
      className={classNames('my-6 break-keep text-sm md:text-base font-medium leading-[1.75] text-black/60', className)}
    >
      {renderInlineText(block.text)}
    </p>
  )
}
