import type { QuoteBlock as QuoteBlockType } from '@/types/blocks'
import { renderInlineText } from './inline'
import classNames from 'classnames'

export function QuoteBlock({ block, className }: { block: QuoteBlockType; className?: string }) {
  return (
    <blockquote
      className={classNames(
        'my-12 ml-auto max-w-[58rem] rounded-sm bg-neutral-500/8 p-4 backdrop-blur-sm md:my-20 md:p-6',
        className,
      )}
    >
      <p className='font-pretendard text-[clamp(1.25rem,2.6vw,2.4rem)] font-medium leading-[1.2] text-black/80'>
        {renderInlineText(block.text)}
      </p>
      {block.cite && (
        <cite className='mt-4 block font-mono text-[9px] not-italic uppercase text-black/40'>{block.cite}</cite>
      )}
    </blockquote>
  )
}
