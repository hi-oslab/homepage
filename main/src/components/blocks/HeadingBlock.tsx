import type { HeadingBlock as HeadingBlockType } from '@/types/blocks'
import { renderInlineText } from './inline'
import classNames from 'classnames'

export function HeadingBlock({ block, className }: { block: HeadingBlockType; className?: string }) {
  const text = renderInlineText(block.text)

  if (block.level === 1)
    return (
      <h1
        className={classNames(
          'pb-6 pt-16 break-keep text-3xl md:text-4xl font-bold uppercase leading-[1.2]',
          className,
        )}
      >
        {text}
      </h1>
    )
  if (block.level === 2)
    return (
      <h2 className={classNames('pb-5 pt-14 break-keep text-2xl md:text-3xl font-bold leading-[1.2]', className)}>
        {text}
      </h2>
    )
  return (
    <h3 className={classNames('pb-3 pt-12 break-keep text-xl md:text-2xl font-bold leading-[1.2]', className)}>
      {text}
    </h3>
  )
}
