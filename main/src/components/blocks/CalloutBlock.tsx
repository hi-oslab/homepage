import type { CalloutBlock as CalloutBlockType } from '@/types/blocks'
import { renderInlineText } from './inline'
import classNames from 'classnames'

export function CalloutBlock({ block, className }: { block: CalloutBlockType; className?: string }) {
  return (
    <div className={classNames('my-10 flex gap-3 rounded-sm bg-beige/65 p-4 backdrop-blur-sm md:p-6', className)}>
      {block.icon && <span className='shrink-0 text-lg leading-none'>{block.icon}</span>}
      <p className='text-sm leading-relaxed'>{renderInlineText(block.text)}</p>
    </div>
  )
}
