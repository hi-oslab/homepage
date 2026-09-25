import type { ListBlock as ListBlockType } from '@/types/blocks'
import { renderInlineText } from './inline'
import classNames from 'classnames'

export function ListBlock({ block, className }: { block: ListBlockType; className?: string }) {
  const items = block.items.map((item, i) => (
    <li key={i} className='leading-relaxed'>
      {renderInlineText(item)}
    </li>
  ))

  return block.style === 'number' ? (
    <ol className={classNames('my-6 ml-auto max-w-[52rem] list-decimal space-y-2 pl-5 font-pretendard text-[15px] md:text-lg', className)}>{items}</ol>
  ) : (
    <ul className={classNames('my-6 ml-auto max-w-[52rem] list-disc space-y-2 pl-5 font-pretendard text-[15px] md:text-lg', className)}>{items}</ul>
  )
}
