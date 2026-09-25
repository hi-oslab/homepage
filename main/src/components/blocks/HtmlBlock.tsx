import type { HtmlBlock as HtmlBlockType } from '@/types/blocks'
import classNames from 'classnames'

export function HtmlBlock({ block, className }: { block: HtmlBlockType; className?: string }) {
  return <div className={classNames('my-6', className)} dangerouslySetInnerHTML={{ __html: block.html }} />
}
